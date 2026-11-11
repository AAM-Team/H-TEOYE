/**
 * Elimina de un texto libre los datos personales más comunes antes de guardarlo.
 * Es una red de seguridad: los comentarios igualmente se revisan antes de publicarse.
 */
const PATRONES: RegExp[] = [
  // Correos electrónicos
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  // CURP (18 caracteres)
  /\b[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/gi,
  // RFC de persona física o moral
  /\b[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b/gi,
  // Teléfonos (10 dígitos con separadores opcionales, prefijo +52 opcional)
  /(?:\+?52[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)\d{3,4}[\s.-]?\d{4}\b/g,
  // Secuencias largas de dígitos: folios, expedientes, cuentas, tarjetas
  /\b\d[\d\s-]{5,}\d\b/g,
];

export const MARCA_REDACCION = "[dato removido]";

export function redactarDatosPersonales(texto: string): { texto: string; redactado: boolean } {
  let resultado = texto;
  for (const patron of PATRONES) resultado = resultado.replace(patron, MARCA_REDACCION);
  return { texto: resultado, redactado: resultado !== texto };
}
