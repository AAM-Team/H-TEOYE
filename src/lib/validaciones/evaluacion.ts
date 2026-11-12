import { z } from "zod";
import { MAX_COMENTARIO } from "@/lib/constantes";

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

export const evaluacionSchema = z.object({
  tramiteId: z.string().min(1).max(40),
  folio: folioSchema,
  trato: estrellas,
  claridad: estrellas,
  facilidad: estrellas,
  satisfaccion: estrellas,
  canal: z.preprocess(vacioAIndefinido, z.enum(["PRESENCIAL", "EN_LINEA", "TELEFONICO"]).optional()),
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
      z.enum([
        "NINGUNO",
        "FILAS_LARGAS",
        "REQUISITOS_NO_VISIBLES",
        "HORARIO_RESTRINGIDO",
        "REQUISITOS_EXCESIVOS",
        "VENTANILLA_EN_VENTANILLA",
        "COSTOS_EXCESIVOS",
      ]),
    )
    .max(7)
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
  aceptaPrivacidad: z.literal("on", { error: "Debes aceptar el aviso de privacidad para enviar tu evaluación." }),
});

export type EvaluacionEntrada = z.infer<typeof evaluacionSchema>;

/** Convierte FormData en un objeto plano para validar con Zod. */
export function formDataAObjeto(fd: FormData) {
  const campos = [
    "tramiteId",
    "folio",
    "trato",
    "claridad",
    "facilidad",
    "satisfaccion",
    "canal",
    "pagoIndebido",
    "comentario",
    "aceptaPrivacidad",
  ];
  return {
    ...Object.fromEntries(campos.map((c) => [c, fd.get(c) ?? undefined])),
    problemas: fd.getAll("problemas").map(String),
  };
}
