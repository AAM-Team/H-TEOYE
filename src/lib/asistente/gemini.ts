import "server-only";

/**
 * Cliente mínimo de la API de Gemini (REST) para el asistente.
 * La clave se lee de GEMINI_API_KEY (en .env.local, nunca en el repositorio).
 */
const BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Modelos de chat en orden de preferencia. Si uno no tiene cuota (429), está saturado (503) o no
 * responde a tiempo, se usa el siguiente y ese modelo se «enfría» un rato para no volver a esperar por él.
 * Los «lite» van al final: son más rápidos y tienen cuota aparte, aunque con respuestas algo más simples.
 */
export const MODELOS_CHAT = [
  ...new Set(
    [
      process.env.GEMINI_MODEL,
      "gemini-3-flash-preview",
      "gemini-3.5-flash",
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
    ].filter(Boolean) as string[],
  ),
];

/** Tiempo máximo para que un modelo empiece a responder; después se descarta. */
const ESPERA_POR_MODELO_MS = 12_000;
/** Si el modelo no empieza a responder en este tiempo, se pide también al siguiente en paralelo. */
const MARGEN_PARALELO_MS = 3_000;

/**
 * Límite de tokens de la respuesta. En estos modelos el razonamiento interno («thinking») cuenta
 * dentro del mismo límite: con 1,200 las respuestas largas se cortaban a media palabra.
 */
const MAX_TOKENS_RESPUESTA = 4096;

/** Modelo → momento (ms) hasta el que no se intenta por falta de cuota, saturación o lentitud. */
const enfriados = new Map<string, number>();
/** Modelos que rechazaron el ajuste de razonamiento (400): se les llama sin él. */
const sinAjusteRazonamiento = new Set<string>();

/**
 * Menos razonamiento interno = primera palabra mucho antes. Para orientar trámites no hace falta más.
 * Los modelos actuales aceptan `thinkingLevel` (y rechazan `thinkingBudget` con un 400); si alguno
 * rechaza también este ajuste, se le vuelve a llamar sin él.
 */
function ajusteRazonamiento(modelo: string) {
  return sinAjusteRazonamiento.has(modelo) ? {} : { thinkingConfig: { thinkingLevel: "low" } };
}

/** Segundos de espera sugeridos por la API en un 429 («retryDelay»), si los trae. */
function segundosSugeridos(cuerpo: string) {
  const s = Number(cuerpo.match(/"retryDelay":\s*"(\d+)(?:\.\d+)?s"/)?.[1]);
  return Number.isFinite(s) && s > 0 ? s : null;
}

/** Aviso que se agrega si Gemini corta la respuesta por llegar al límite de tokens. */
export const AVISO_RESPUESTA_CORTADA =
  "\n\n(La respuesta se cortó por ser muy larga. Pregúntame por una parte específica, por ejemplo sólo los requisitos o sólo el costo.)";
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
  const cuerpo = (modelo: string) =>
    JSON.stringify({
      systemInstruction: { parts: [{ text: opciones.sistema }] },
      contents: opciones.mensajes,
      generationConfig: { temperature: 0.3, maxOutputTokens: MAX_TOKENS_RESPUESTA, ...ajusteRazonamiento(modelo) },
    });

  type Resultado = { modelo: string; respuesta?: Response; falla?: string; reintentar?: boolean; definitivo?: boolean };
  const nunca = new AbortController().signal;

  /** Pide la respuesta a un modelo; nunca lanza excepción (salvo que la persona cancele). */
  function pedir(modelo: string, control: AbortController): Promise<Resultado> {
    return (async () => {
      // El límite sólo aplica hasta que el modelo empieza a responder; después la respuesta puede
      // tardar lo que necesite (antes este límite también cortaba respuestas largas a media palabra).
      const espera = new AbortController();
      const temporizador = setTimeout(() => espera.abort(), ESPERA_POR_MODELO_MS);
      try {
        const resp = await fetch(`${BASE}/models/${modelo}:streamGenerateContent?alt=sse`, {
          method: "POST",
          headers: encabezados(),
          signal: AbortSignal.any([control.signal, opciones.senal ?? nunca, espera.signal]),
          body: cuerpo(modelo),
        });
        clearTimeout(temporizador);
        if (resp.ok && resp.body) return { modelo, respuesta: resp };
        const detalle = await resp.text().catch(() => "");
        if (resp.status === 400 && !sinAjusteRazonamiento.has(modelo)) {
          // Lo más probable es que el modelo no acepte el ajuste de razonamiento (la API sólo dice
          // «invalid argument»): se recuerda y se reintenta una vez sin él.
          sinAjusteRazonamiento.add(modelo);
          return { modelo, falla: `${modelo} 400`, reintentar: true };
        }
        if (resp.status === 429) enfriados.set(modelo, Date.now() + (segundosSugeridos(detalle) ?? 60) * 1000);
        else if (resp.status === 503 || resp.status === 500) enfriados.set(modelo, Date.now() + 30_000);
        else if (resp.status === 404) enfriados.set(modelo, Date.now() + 6 * 60 * 60_000);
        // Sólo se cambia de modelo ante cuota, saturación, error del servidor o modelo inexistente.
        return { modelo, falla: `${modelo} ${resp.status}`, definitivo: ![400, 404, 429, 500, 503].includes(resp.status) };
      } catch {
        clearTimeout(temporizador);
        if (control.signal.aborted || opciones.senal?.aborted) return { modelo, falla: `${modelo} cancelado` };
        enfriados.set(modelo, Date.now() + 60_000);
        return { modelo, falla: `${modelo} sin respuesta` };
      }
    })();
  }

  const fallas: string[] = [];
  const ahora = Date.now();
  // Primero los modelos disponibles; los enfriados sólo como último recurso.
  const cola = [...MODELOS_CHAT].sort((a, b) => Number((enfriados.get(a) ?? 0) > ahora) - Number((enfriados.get(b) ?? 0) > ahora));
  const enCurso = new Map<string, { promesa: Promise<Resultado>; control: AbortController }>();
  const lanzar = () => {
    const modelo = cola.shift();
    if (!modelo) return;
    const control = new AbortController();
    enCurso.set(modelo, { promesa: pedir(modelo, control), control });
  };

  // Se pide al primer modelo; si no empieza a responder en MARGEN_PARALELO_MS, se pide también al
  // siguiente y se usa el que conteste primero. Así un modelo lento no hace esperar a la persona.
  let ganador: Resultado | null = null;
  lanzar();
  while (enCurso.size > 0) {
    if (opciones.senal?.aborted) break;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const margen = cola.length
      ? new Promise<null>((resolver) => (temporizador = setTimeout(() => resolver(null), MARGEN_PARALELO_MS)))
      : null;
    const res = await Promise.race([...[...enCurso.values()].map((e) => e.promesa), ...(margen ? [margen] : [])]);
    clearTimeout(temporizador);
    if (res === null) {
      lanzar();
      continue;
    }
    enCurso.delete(res.modelo);
    if (res.respuesta) {
      ganador = res;
      break;
    }
    if (res.falla) fallas.push(res.falla);
    if (res.definitivo) break;
    if (res.reintentar) cola.unshift(res.modelo);
    if (enCurso.size === 0) lanzar();
  }
  // Se cancelan los modelos que no ganaron (y se libera la respuesta si alguno llegó tarde).
  for (const e of enCurso.values()) {
    e.control.abort();
    e.promesa.then((x) => x.respuesta?.body?.cancel().catch(() => {}));
  }
  const r = ganador?.respuesta;
  if (!r?.body) throw new Error(`Gemini no respondió (${fallas.join(", ") || "cancelado"})`);
  enfriados.delete(ganador!.modelo);
  if (fallas.length) console.info(`[asistente] respondió ${ganador!.modelo} tras: ${fallas.join(", ")}`);

  const lector = r.body.pipeThrough(new TextDecoderStream()).getReader();
  const codificador = new TextEncoder();
  let pendiente = "";
  let cortada = false;

  /** Extrae el texto de un evento SSE de Gemini (ignora el razonamiento interno). */
  function textoDeEvento(evento: string) {
    const datos = evento
      .split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .join("");
    if (!datos) return "";
    try {
      const json = JSON.parse(datos);
      const motivo = json.candidates?.[0]?.finishReason;
      if (motivo === "MAX_TOKENS") cortada = true;
      else if (motivo && motivo !== "STOP") console.warn(`[asistente] respuesta terminada por ${motivo}`);
      return (json.candidates?.[0]?.content?.parts ?? [])
        .map((p: { text?: string; thought?: boolean }) => (p.thought ? "" : (p.text ?? "")))
        .join("");
    } catch {
      console.warn("[asistente] fragmento de Gemini no legible:", datos.slice(0, 120));
      return "";
    }
  }

  return new ReadableStream<Uint8Array>({
    async pull(controlador) {
      while (true) {
        const { value, done } = await lector.read();
        if (done) {
          // El último evento puede llegar sin la línea en blanco final: antes se descartaba y
          // con él se perdía el final de la respuesta (las palabras «cortadas»).
          const final = pendiente.trim() ? textoDeEvento(pendiente) : "";
          pendiente = "";
          if (final) controlador.enqueue(codificador.encode(final));
          if (cortada) controlador.enqueue(codificador.encode(AVISO_RESPUESTA_CORTADA));
          controlador.close();
          return;
        }
        pendiente += value;
        const eventos = pendiente.split(/\r?\n\r?\n/);
        pendiente = eventos.pop() ?? "";
        const texto = eventos.map(textoDeEvento).join("");
        if (texto) {
          controlador.enqueue(codificador.encode(texto));
          return;
        }
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
      // La búsqueda semántica es un extra: si tarda, se responde sólo con la búsqueda por palabras.
      signal: AbortSignal.timeout(textos.length === 1 ? 3_000 : 20_000),
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
