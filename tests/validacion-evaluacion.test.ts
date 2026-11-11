import { describe, expect, it } from "vitest";
import { evaluacionSchema, formDataAObjeto } from "@/lib/validaciones/evaluacion";

function fd(campos: Record<string, string | string[]>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) for (const x of [v].flat()) f.append(k, x);
  return formDataAObjeto(f);
}

const valido = {
  tramiteId: "ckxyz123",
  trato: "5",
  claridad: "4",
  facilidad: "3",
  satisfaccion: "4",
  aceptaPrivacidad: "on",
};

describe("evaluacionSchema", () => {
  it("acepta una evaluación mínima válida", () => {
    const r = evaluacionSchema.safeParse(fd(valido));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.trato).toBe(5);
      expect(r.data.problemas).toEqual([]);
      expect(r.data.pagoIndebido).toBeNull();
      expect(r.data.comentario).toBeUndefined();
    }
  });

  it("rechaza calificaciones faltantes o fuera de rango", () => {
    const sinTrato = evaluacionSchema.safeParse(fd({ ...valido, trato: "" }));
    const seis = evaluacionSchema.safeParse(fd({ ...valido, claridad: "6" }));
    const decimal = evaluacionSchema.safeParse(fd({ ...valido, facilidad: "2.5" }));
    expect(sinTrato.success).toBe(false);
    expect(seis.success).toBe(false);
    expect(decimal.success).toBe(false);
  });

  it("exige aceptar el aviso de privacidad", () => {
    const resto: Record<string, string> = { ...valido };
    delete resto.aceptaPrivacidad;
    const r = evaluacionSchema.safeParse(fd(resto));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["aceptaPrivacidad"]);
  });

  it("convierte la respuesta de pago indebido a booleano o null", () => {
    const si = evaluacionSchema.parse(fd({ ...valido, pagoIndebido: "si" }));
    const no = evaluacionSchema.parse(fd({ ...valido, pagoIndebido: "no" }));
    const prefiero = evaluacionSchema.parse(fd({ ...valido, pagoIndebido: "prefiero-no-responder" }));
    expect([si.pagoIndebido, no.pagoIndebido, prefiero.pagoIndebido]).toEqual([true, false, null]);
  });

  it("no permite combinar «ningún problema» con otros problemas", () => {
    const r = evaluacionSchema.safeParse(fd({ ...valido, problemas: ["NINGUNO", "FILAS_LARGAS"] }));
    expect(r.success).toBe(false);
  });

  it("elimina problemas duplicados y rechaza valores desconocidos", () => {
    const dup = evaluacionSchema.parse(fd({ ...valido, problemas: ["FILAS_LARGAS", "FILAS_LARGAS"] }));
    expect(dup.problemas).toEqual(["FILAS_LARGAS"]);
    expect(evaluacionSchema.safeParse(fd({ ...valido, problemas: ["INVENTADO"] })).success).toBe(false);
  });

  it("limita el comentario a 500 caracteres y descarta comentarios vacíos", () => {
    expect(evaluacionSchema.safeParse(fd({ ...valido, comentario: "a".repeat(501) })).success).toBe(false);
    expect(evaluacionSchema.parse(fd({ ...valido, comentario: "   " })).comentario).toBeUndefined();
  });
});
