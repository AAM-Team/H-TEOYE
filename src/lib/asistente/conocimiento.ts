import "server-only";
import base from "./tramites-hermosillo.json";
import indiceEmbeddings from "./embeddings-tramites.json";
import catalogoEvaluable from "../../../prisma/catalogo/tramites.json";
import { DIMENSIONES, MODELO_EMBEDDINGS, calcularEmbeddings, geminiConfigurado } from "./gemini";

/**
 * Base de conocimiento del asistente (RAG) sobre el Portal de Trámites de Hermosillo.
 *
 * Recuperación híbrida:
 *  1. BM25 léxico (sin red, siempre disponible).
 *  2. Similitud semántica con embeddings de Gemini: los de los trámites están precalculados en
 *     embeddings-tramites.json; en cada consulta sólo se calcula el de la pregunta.
 * Ambas listas se combinan con Reciprocal Rank Fusion. Si los embeddings fallan,
 * el asistente sigue funcionando sólo con BM25.
 */

export type Tramite = (typeof base.tramites)[number];

export const FUENTE_TRAMITES = base._fuente;
export const FECHA_EXTRACCION = base._extraido;
export const URL_DENUNCIAS = "https://denuncias.hermosillo.gob.mx/";
export const URL_HDIGITAL = "https://hdigital.hermosillo.gob.mx/";

const TRAMITES: Tramite[] = base.tramites;

/* ---------- Dependencias que H-TEOYE permite evaluar ---------- */

const ALIAS_SLUG: Record<string, string> = { "ordenamiento-desarrollo-urbano": "ordenamiento-y-desarrollo-urbano" };

/** Nombre de la dependencia en el portal oficial → slug de H-TEOYE. */
const DEPENDENCIA_A_SLUG: Record<string, string> = {
  "TESORERIA MUNICIPAL": "tesoreria-municipal",
  "AGUA DE HERMOSILLO": "agua-de-hermosillo",
  "DIRECCIÓN GENERAL DE ORDENAMIENTO Y DESARROLLO URBANO": "ordenamiento-y-desarrollo-urbano",
  "SEGURIDAD PÚBLICA": "seguridad-publica-transito",
  "DIF HERMOSILLO": "dif-hermosillo",
};

export const EVALUABLES = catalogoEvaluable.dependencias.map((d) => ({
  slug: ALIAS_SLUG[d.id] ?? d.id,
  nombre: d.nombre,
  tramites: d.tramites.map((t) => ({ clave: t.id, nombre: t.nombre })),
}));

export function textoEvaluables() {
  return EVALUABLES.map(
    (d) =>
      `- ${d.nombre} → elegir trámite: /dependencias/${d.slug}\n` +
      d.tramites.map((t) => `  · ${t.nombre} → evaluar directo: /evaluar/clave/${t.clave}`).join("\n"),
  ).join("\n");
}

/* ---------- Normalización y BM25 ---------- */

const VACIAS = new Set(
  "a al algo algun alguna como con cual cuales cuando de del el ella ellos en entre era es esa ese eso esta este esto fue ha hay la las le les lo los mas me mi mis muy no nos o para pero por que quien se sea si sin sobre son su sus te tiene tu tus un una uno unos y ya yo quiero necesito puedo hacer donde cuanto cuesta tramite tramites como saber informacion favor hola".split(
    " ",
  ),
);

function raiz(p: string) {
  if (p.length > 5 && p.endsWith("es")) return p.slice(0, -2);
  if (p.length > 4 && p.endsWith("s")) return p.slice(0, -1);
  return p;
}

export function tokenizar(texto: string): string[] {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9ñ]+/)
    .filter((p) => p.length > 1 && !VACIAS.has(p))
    .map(raiz);
}

function textoIndexable(t: Tramite) {
  // El nombre y la dependencia pesan más: se repiten.
  return [t.nombre, t.nombre, t.nombre, t.dependencia, t.dependencia, t.sector, t.modalidad, t.objetivo, t.aplicaA, t.requisitos.slice(0, 1500), t.documentoObtenido].join(" ");
}

const K1 = 1.4;
const B = 0.75;

const indice = (() => {
  const docs = TRAMITES.map((t) => {
    const tokens = tokenizar(textoIndexable(t));
    const frec = new Map<string, number>();
    for (const tk of tokens) frec.set(tk, (frec.get(tk) ?? 0) + 1);
    return { frec, largo: tokens.length };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const tk of d.frec.keys()) df.set(tk, (df.get(tk) ?? 0) + 1);
  const promedio = docs.reduce((s, d) => s + d.largo, 0) / docs.length;
  return { docs, df, promedio, n: docs.length };
})();

export function buscarBM25(consulta: string, limite = 10) {
  const terminos = [...new Set(tokenizar(consulta))];
  const puntajes = indice.docs.map((d, i) => {
    let s = 0;
    for (const t of terminos) {
      const f = d.frec.get(t);
      if (!f) continue;
      const df = indice.df.get(t) ?? 0;
      const idf = Math.log(1 + (indice.n - df + 0.5) / (df + 0.5));
      s += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.largo) / indice.promedio)));
    }
    return { i, s };
  });
  return puntajes
    .filter((p) => p.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limite);
}

/* ---------- Embeddings precalculados (scripts/indexar-tramites.mjs) ---------- */

const vectores: (Int8Array | null)[] | null = (() => {
  // Importado de forma estática para que Vercel lo incluya en la función del servidor.
  const archivo = indiceEmbeddings as { modelo: string; dimensiones: number; vectores: Record<string, string> };
  if (archivo.modelo !== MODELO_EMBEDDINGS || archivo.dimensiones !== DIMENSIONES) return null;
  return TRAMITES.map((t) => {
    const b64 = archivo.vectores[t.clave];
    return b64 ? new Int8Array(Buffer.from(b64, "base64")) : null;
  });
})();

/** Tras un 429 de cuota se deja de pedir embeddings un rato y se usa sólo BM25. */
let pausaSemanticaHasta = 0;

async function buscarSemantico(consulta: string, limite = 10) {
  if (!vectores || !geminiConfigurado() || Date.now() < pausaSemanticaHasta) return [];
  try {
    const [q] = await calcularEmbeddings([consulta], "RETRIEVAL_QUERY");
    return vectores
      .map((v, i) => {
        if (!v) return { i, s: -1 };
        // Coseno: cada vector int8 tiene su propia escala, así que se divide entre su norma.
        let s = 0;
        let n = 0;
        for (let k = 0; k < v.length; k++) {
          s += v[k] * q[k];
          n += v[k] * v[k];
        }
        return { i, s: s / (Math.sqrt(n) || 1) };
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, limite);
  } catch (e) {
    const mensaje = (e as Error).message;
    if (mensaje.includes(" 429")) pausaSemanticaHasta = Date.now() + 60_000;
    console.warn("[asistente] búsqueda semántica no disponible, se usa BM25:", mensaje.slice(0, 120));
    return [];
  }
}

/* ---------- Recuperación híbrida ---------- */

export async function recuperar(consulta: string, limite = 6): Promise<Tramite[]> {
  const [lexico, semantico] = await Promise.all([Promise.resolve(buscarBM25(consulta, 12)), buscarSemantico(consulta, 12)]);
  const RRF = 60;
  const total = new Map<number, number>();
  lexico.forEach((r, rango) => total.set(r.i, (total.get(r.i) ?? 0) + 1 / (RRF + rango)));
  semantico.forEach((r, rango) => total.set(r.i, (total.get(r.i) ?? 0) + 1 / (RRF + rango)));
  return [...total.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([i]) => TRAMITES[i]);
}

/** Ficha de un trámite en texto, lista para el contexto del modelo. */
export function fichaTramite(t: Tramite) {
  const slug = DEPENDENCIA_A_SLUG[t.dependencia];
  const lineas = [
    `### ${t.nombre} (${t.clave})`,
    `Dependencia: ${t.dependencia}`,
    `Sector: ${t.sector} · Modalidad: ${t.modalidad}`,
    t.objetivo && `Descripción: ${t.objetivo}`,
    t.aplicaA && `A quién aplica: ${t.aplicaA}`,
    t.requisitos && `Requisitos:\n${t.requisitos.slice(0, 1800)}${t.requisitos.length > 1800 ? "\n[…lista completa en el portal]" : ""}`,
    t.documentos && `Datos y documentos adicionales: ${t.documentos.slice(0, 600)}`,
    `Costo: ${t.costo || "No especificado"}`,
    t.plazo && `Plazo de respuesta: ${t.plazo.slice(0, 300)}`,
    t.vigencia && `Vigencia: ${t.vigencia}`,
    t.documentoObtenido && `Documento que obtienes: ${t.documentoObtenido}`,
    t.horario && `Horario: ${t.horario}`,
    t.domicilio && `Domicilio: ${t.domicilio}`,
    t.telefono && `Teléfono: ${t.telefono}`,
    t.correo && `Correo: ${t.correo}`,
    t.enlaceEnLinea && `Hacerlo en línea: ${t.enlaceEnLinea}`,
    slug && `Esta dependencia se puede evaluar en H-TEOYE: /dependencias/${slug}`,
  ];
  return lineas.filter(Boolean).join("\n");
}

export const RESUMEN_DEPENDENCIAS = (() => {
  const conteo = new Map<string, number>();
  for (const t of TRAMITES) conteo.set(t.dependencia, (conteo.get(t.dependencia) ?? 0) + 1);
  return [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([d, n]) => `${d} (${n})`)
    .join("; ");
})();

export const TOTAL_TRAMITES = TRAMITES.length;
