import { z } from "zod";
import { MAX_COMENTARIO } from "@/lib/constantes";

const estrellas = z.coerce
  .number({ error: "Selecciona una calificación de 1 a 5 estrellas." })
  .int({ error: "Selecciona una calificación de 1 a 5 estrellas." })
  .min(1, { error: "Selecciona una calificación de 1 a 5 estrellas." })
  .max(5, { error: "Selecciona una calificación de 1 a 5 estrellas." });

const vacioAIndefinido = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const evaluacionSchema = z.object({
  tramiteId: z.string().min(1).max(40),
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
