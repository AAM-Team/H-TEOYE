import { describe, expect, it } from "vitest";
import { MARCA_REDACCION, redactarDatosPersonales } from "@/lib/validaciones/datos-personales";

describe("redactarDatosPersonales", () => {
  it.each([
    ["correo", "Escríbanme a juan.perez@correo.com por favor"],
    ["CURP", "Mi CURP es GODE561231HSRNRL09 y no aparece"],
    ["RFC", "Facturar al RFC GODE561231AB1"],
    ["teléfono", "Llámenme al 662 123 4567"],
    ["teléfono con lada", "Tel. +52 (662) 123-4567"],
    ["folio", "El expediente 2024-001234 sigue sin respuesta"],
  ])("elimina %s", (_tipo, texto) => {
    const r = redactarDatosPersonales(texto);
    expect(r.redactado).toBe(true);
    expect(r.texto).toContain(MARCA_REDACCION);
  });

  it("no altera comentarios sin datos personales", () => {
    const texto = "La atención fue buena, esperé 20 minutos y salí con mi trámite el 3 de mayo.";
    expect(redactarDatosPersonales(texto)).toEqual({ texto, redactado: false });
  });
});
