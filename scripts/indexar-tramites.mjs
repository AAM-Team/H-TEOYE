/**
 * Precalcula los embeddings de la base de conocimiento del asistente con la API de Gemini.
 *
 * Uso:  node scripts/indexar-tramites.mjs   (después de scripts/extraer-tramites.mjs)
 * Lee:  src/lib/asistente/tramites-hermosillo.json y GEMINI_API_KEY de .env.local / .env
 * Salida: src/lib/asistente/embeddings-tramites.json
 *
 * Se hace una sola vez para no gastar la cuota de la API en cada arranque del servidor.
 * Los vectores se guardan cuantizados a int8 (base64) para que el archivo sea ligero.
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(raiz, ".env.local"), quiet: true });
config({ path: join(raiz, ".env"), quiet: true });

const CLAVE = process.env.GEMINI_API_KEY;
if (!CLAVE) throw new Error("Falta GEMINI_API_KEY en .env.local");
const MODELO = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
const DIMENSIONES = 768;
const LOTE = 20;

const dir = join(raiz, "src", "lib", "asistente");
const { tramites } = JSON.parse(readFileSync(join(dir, "tramites-hermosillo.json"), "utf8"));

/** Debe coincidir con la idea de la consulta: nombre, dependencia, sector, descripción y a quién aplica. */
const texto = (t) =>
  `${t.nombre}. Dependencia: ${t.dependencia}. Sector: ${t.sector}. ${t.objetivo} Aplica a: ${t.aplicaA}`.slice(0, 1800);

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function embeber(textos) {
  for (let intento = 1; ; intento++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:batchEmbedContents`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": CLAVE },
      body: JSON.stringify({
        requests: textos.map((t) => ({
          model: `models/${MODELO}`,
          content: { parts: [{ text: t }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: DIMENSIONES,
        })),
      }),
    });
    if (r.ok) return (await r.json()).embeddings.map((e) => e.values);
    const cuerpo = await r.text();
    if ((r.status === 429 || r.status >= 500) && intento < 8) {
      const espera = Number(cuerpo.match(/"retryDelay":\s*"(\d+)s"/)?.[1] ?? 30) + 2;
      console.log(`  ${r.status}: espero ${espera}s (intento ${intento})`);
      await dormir(espera * 1000);
      continue;
    }
    throw new Error(`Embeddings ${r.status}: ${cuerpo.slice(0, 300)}`);
  }
}

function cuantizar(v) {
  const norma = Math.hypot(...v) || 1;
  const unit = v.map((x) => x / norma);
  const max = Math.max(...unit.map(Math.abs)) || 1;
  const bytes = Int8Array.from(unit.map((x) => Math.round((x / max) * 127)));
  return Buffer.from(bytes.buffer).toString("base64");
}

const vectores = {};
for (let i = 0; i < tramites.length; i += LOTE) {
  const lote = tramites.slice(i, i + LOTE);
  const res = await embeber(lote.map(texto));
  lote.forEach((t, k) => (vectores[t.clave] = cuantizar(res[k])));
  console.log(`${Math.min(i + LOTE, tramites.length)}/${tramites.length}`);
  await dormir(1500);
}

writeFileSync(
  join(dir, "embeddings-tramites.json"),
  JSON.stringify({ modelo: MODELO, dimensiones: DIMENSIONES, generado: new Date().toISOString().slice(0, 10), vectores }) + "\n",
);
console.log(`Listo: ${Object.keys(vectores).length} vectores → src/lib/asistente/embeddings-tramites.json`);
