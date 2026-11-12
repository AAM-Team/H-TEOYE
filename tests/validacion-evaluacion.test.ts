import { describe, expect, it } from "vitest";
import { evaluacionSchema, formDataAObjeto } from "@/lib/validaciones/evaluacion";

function fd(campos: Record<string, string | string[]>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) for (const x of [v].flat()) f.append(k, x);
  return formDataAObjeto(f);
}

const valido = {
  tramiteId: "ckxyz123",
  folio: "HMO-2026-001234",
  trato: "5",
  claridad: "4",
  facilidad: "3",
  rapidez: "2",
  satisfaccion: "4",
  canal: "PRESENCIAL",
  aceptaPrivacidad: "on",
};

describe("folio del trámite", () => {
  it("es obligatorio", () => {
    const { folio: _omitido, ...sinFolio } = valido;
    void _omitido;
    const r = evaluacionSchema.safeParse(fd(sinFolio));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "folio")).toBe(true);
  });

  it("se normaliza a mayúsculas y sin espacios en los extremos", () => {
    const r = evaluacionSchema.safeParse(fd({ ...valido, folio: "  dgodu-ac-1520/2026 " }));
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.folio).toBe("DGODU-AC-1520/2026");
  });

  it("acepta formatos variados de las dependencias", () => {
    for (const folio of ["DCM-P302-F03-LDT", "DGODU-AC", "12345", "TES.2026.88", "A1B2"]) {
      expect(evaluacionSchema.safeParse(fd({ ...valido, folio })).success, folio).toBe(true);
    }
  });

  it("rechaza folios cortos, largos, con espacios o símbolos", () => {
    for (const folio of ["", "AB1", "A".repeat(41), "HMO 2026 1", "-HMO-1", "HMO-1-", "FOLIO#12", "<script>"]) {
      expect(evaluacionSchema.safeParse(fd({ ...valido, folio })).success, folio).toBe(false);
    }
  });
});

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

describe("encuesta por modalidad", () => {
  it("exige la rapidez del trámite", () => {
    const { rapidez: _r, ...sinRapidez } = valido;
    void _r;
    const r = evaluacionSchema.safeParse(fd(sinRapidez));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "rapidez")).toBe(true);
    expect(evaluacionSchema.parse(fd(valido)).rapidez).toBe(2);
  });

  it("exige elegir si el trámite fue presencial, en línea o por teléfono", () => {
    const { canal: _c, ...sinCanal } = valido;
    void _c;
    const r = evaluacionSchema.safeParse(fd(sinCanal));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "canal")).toBe(true);
    expect(evaluacionSchema.safeParse(fd({ ...valido, canal: "CORREO" })).success).toBe(false);
  });

  it("sólo acepta problemas de la modalidad elegida", () => {
    expect(evaluacionSchema.safeParse(fd({ ...valido, canal: "EN_LINEA", problemas: ["PLATAFORMA_FALLA"] })).success).toBe(true);
    expect(evaluacionSchema.safeParse(fd({ ...valido, canal: "TELEFONICO", problemas: ["NO_CONTESTARON"] })).success).toBe(true);
    // «Filas largas» es presencial: no aplica a un trámite en línea.
    const r = evaluacionSchema.safeParse(fd({ ...valido, canal: "EN_LINEA", problemas: ["FILAS_LARGAS"] }));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "problemas")).toBe(true);
  });

  it("«Otro» exige una descripción", () => {
    const sin = evaluacionSchema.safeParse(fd({ ...valido, problemas: ["OTRO"] }));
    expect(sin.success).toBe(false);
    if (!sin.success) expect(sin.error.issues.some((i) => i.path[0] === "problemaOtro")).toBe(true);
    const con = evaluacionSchema.parse(fd({ ...valido, problemas: ["OTRO"], problemaOtro: "  No había dónde sentarse  " }));
    expect(con.problemaOtro).toBe("No había dónde sentarse");
  });

  it("descarta la descripción si no se marcó «Otro» y limita su largo", () => {
    expect(evaluacionSchema.parse(fd({ ...valido, problemaOtro: "texto suelto" })).problemaOtro).toBeUndefined();
    expect(evaluacionSchema.safeParse(fd({ ...valido, problemas: ["OTRO"], problemaOtro: "a".repeat(151) })).success).toBe(false);
  });
});
