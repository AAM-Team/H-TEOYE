import { z } from "zod";
import { CANALES, MAX_COMENTARIO, MAX_PROBLEMA_OTRO, PROBLEMAS, PROBLEMAS_POR_CANAL, type ClaveCanal } from "@/lib/constantes";

const estrellas = z.coerce
  .number({ error: "Selecciona una calificación de 1 a 5 estrellas." })
  .int({ error: "Selecciona una calificación de 1 a 5 estrellas." })
  .min(1, { error: "Selecciona una calificación de 1 a 5 estrellas." })
  .max(5, { error: "Selecciona una calificación de 1 a 5 estrellas." });

/**
 * Folio del trámite o servicio. No hay un formato único entre dependencias (p. ej. «HMO-2026-001234»,
 * «DGODU-AC-1520/2026»), así que sólo se exige una forma razonable: 4 a 40 caracteres entre letras,
 * números, guiones, diagonales y puntos, empezando y terminando en letra o número.
 * Se normaliza a mayúsculas para que «abc-12» y «ABC-12» cuenten como el mismo folio.
 */
export const folioSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
  z
    .string({ error: "Escribe el folio de tu trámite." })
    .min(1, { error: "Escribe el folio de tu trámite." })
    .min(4, { error: "El folio debe tener al menos 4 caracteres." })
    .max(40, { error: "El folio no puede superar 40 caracteres." })
    .regex(/^[A-Z0-9Ñ](?:[A-Z0-9Ñ./-]*[A-Z0-9Ñ])?$/, {
      error: "Usa sólo letras, números, guiones (-), diagonales (/) o puntos, sin espacios.",
    }),
);

const vacioAIndefinido = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const CLAVES_CANAL = CANALES.map((c) => c.valor) as [ClaveCanal, ...ClaveCanal[]];
const CLAVES_PROBLEMA = ["NINGUNO", ...PROBLEMAS.map((p) => p.valor)] as [string, ...string[]];

export const evaluacionSchema = z
  .object({
  tramiteId: z.string().min(1).max(40),
  folio: folioSchema,
  trato: estrellas,
  claridad: estrellas,
  facilidad: estrellas,
  rapidez: estrellas,
  satisfaccion: estrellas,
  // Obligatorio: define qué preguntas y qué problemas aplican (presencial, en línea o teléfono).
  canal: z.preprocess(
    vacioAIndefinido,
    z.enum(CLAVES_CANAL, { error: "Elige cómo realizaste el trámite: presencial, en línea o por teléfono." }),
  ),
  comentario: z.preprocess(
    vacioAIndefinido,
    z
      .string()
      .trim()
      .max(MAX_COMENTARIO, { error: `El comentario no puede superar ${MAX_COMENTARIO} caracteres.` })
      .optional(),
  ),
  problemas: z
    .array(
      z.enum(CLAVES_PROBLEMA),
    )
    .max(8)
    .transform((l) => [...new Set(l)])
    .refine((l) => !(l.includes("NINGUNO") && l.length > 1), {
      error: "No puedes marcar «No tuve ningún problema» junto con otros problemas.",
    }),
  pagoIndebido: z.preprocess(
    vacioAIndefinido,
    z
      .enum(["si", "no", "prefiero-no-responder"])
      .optional()
      .transform((v) => (v === "si" ? true : v === "no" ? false : null)),
  ),
  problemaOtro: z.preprocess(
    vacioAIndefinido,
    z
      .string()
      .trim()
      .max(MAX_PROBLEMA_OTRO, { error: `La descripción no puede superar ${MAX_PROBLEMA_OTRO} caracteres.` })
      .optional(),
  ),
  aceptaPrivacidad: z.literal("on", { error: "Debes aceptar el aviso de privacidad para enviar tu evaluación." }),
  })
  .superRefine((e, ctx) => {
    // Sólo se aceptan los problemas que se ofrecen para la modalidad elegida.
    const validos = new Set<string>(["NINGUNO", ...PROBLEMAS_POR_CANAL[e.canal].map((p) => p.valor)]);
    if (e.problemas.some((p) => !validos.has(p))) {
      ctx.addIssue({ code: "custom", path: ["problemas"], message: "Marca sólo problemas de la modalidad que elegiste." });
    }
    if (e.problemas.includes("OTRO") && !(e.problemaOtro && e.problemaOtro.length >= 3)) {
      ctx.addIssue({ code: "custom", path: ["problemaOtro"], message: "Describe brevemente el otro problema que enfrentaste." });
    }
  })
  // La descripción sólo se guarda si se marcó «Otro».
  .transform((e) => ({ ...e, problemaOtro: e.problemas.includes("OTRO") ? e.problemaOtro : undefined }));

export type EvaluacionEntrada = z.infer<typeof evaluacionSchema>;

/** Convierte FormData en un objeto plano para validar con Zod. */
export function formDataAObjeto(fd: FormData) {
  const campos = [
    "tramiteId",
    "folio",
    "trato",
    "claridad",
    "facilidad",
    "rapidez",
    "satisfaccion",
    "canal",
    "pagoIndebido",
    "comentario",
    "problemaOtro",
    "aceptaPrivacidad",
  ];
  return {
    ...Object.fromEntries(campos.map((c) => [c, fd.get(c) ?? undefined])),
    problemas: fd.getAll("problemas").map(String),
  };
}
