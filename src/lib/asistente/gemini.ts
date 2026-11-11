import "server-only";

/**
 * Cliente mínimo de la API de Gemini (REST) para el asistente.
 * La clave se lee de GEMINI_API_KEY (en .env.local, nunca en el repositorio).
 */
const BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Modelos de chat en orden de preferencia: si uno está saturado (429/503) se prueba el siguiente. */
export const MODELOS_CHAT = [
  ...new Set([process.env.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-flash-latest"].filter(Boolean) as string[]),
];
export const MODELO_EMBEDDINGS = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
export const DIMENSIONES = 768;

export function geminiConfigurado() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function encabezados() {
  const clave = process.env.GEMINI_API_KEY;
  if (!clave) throw new Error("Falta GEMINI_API_KEY");
  return { "content-type": "application/json", "x-goog-api-key": clave };
}

export type MensajeGemini = { role: "user" | "model"; parts: { text: string }[] };

/** Genera la respuesta en streaming y devuelve un ReadableStream de texto plano. */
export async function generarEnStreaming(opciones: {
  sistema: string;
  mensajes: MensajeGemini[];
  senal?: AbortSignal;
}): Promise<ReadableStream<Uint8Array>> {
  const cuerpo = JSON.stringify({
    systemInstruction: { parts: [{ text: opciones.sistema }] },
    contents: opciones.mensajes,
    generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
  });
  let r: Response | null = null;
  const fallas: string[] = [];
  for (const modelo of MODELOS_CHAT) {
    const intento = await fetch(`${BASE}/models/${modelo}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: encabezados(),
      signal: opciones.senal,
      body: cuerpo,
    });
    if (intento.ok && intento.body) {
      r = intento;
      break;
    }
    fallas.push(`${modelo} ${intento.status}`);
    // Sólo se cambia de modelo ante saturación, cuota o modelo inexistente.
    if (![404, 429, 500, 503].includes(intento.status)) break;
  }
  if (!r?.body) throw new Error(`Gemini no respondió (${fallas.join(", ")})`);

  const lector = r.body.pipeThrough(new TextDecoderStream()).getReader();
  const codificador = new TextEncoder();
  let pendiente = "";

  return new ReadableStream<Uint8Array>({
    async pull(controlador) {
      while (true) {
        const { value, done } = await lector.read();
        if (done) {
          controlador.close();
          return;
        }
        pendiente += value;
        const eventos = pendiente.split(/\r?\n\r?\n/);
        pendiente = eventos.pop() ?? "";
        let emitido = false;
        for (const evento of eventos) {
          const datos = evento
            .split(/\r?\n/)
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5).trim())
            .join("");
          if (!datos) continue;
          try {
            const json = JSON.parse(datos);
            const texto = (json.candidates?.[0]?.content?.parts ?? [])
              .map((p: { text?: string; thought?: boolean }) => (p.thought ? "" : (p.text ?? "")))
              .join("");
            if (texto) {
              controlador.enqueue(codificador.encode(texto));
              emitido = true;
            }
          } catch {
            // Fragmento incompleto o no JSON: se ignora.
          }
        }
        if (emitido) return;
      }
    },
    cancel() {
      lector.cancel().catch(() => {});
    },
  });
}

/** Calcula embeddings normalizados por lotes (máximo 100 textos por petición). */
export async function calcularEmbeddings(
  textos: string[],
  tarea: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[][]> {
  const resultado: number[][] = [];
  for (let i = 0; i < textos.length; i += 100) {
    const lote = textos.slice(i, i + 100);
    const r = await fetch(`${BASE}/models/${MODELO_EMBEDDINGS}:batchEmbedContents`, {
      method: "POST",
      headers: encabezados(),
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        requests: lote.map((texto) => ({
          model: `models/${MODELO_EMBEDDINGS}`,
          content: { parts: [{ text: texto }] },
          taskType: tarea,
          outputDimensionality: DIMENSIONES,
        })),
      }),
    });
    if (!r.ok) throw new Error(`Embeddings ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const json = (await r.json()) as { embeddings: { values: number[] }[] };
    for (const e of json.embeddings) {
      const norma = Math.hypot(...e.values) || 1;
      resultado.push(e.values.map((v) => v / norma));
    }
  }
  return resultado;
}
