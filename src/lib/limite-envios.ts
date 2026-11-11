import { createHash, randomBytes } from "node:crypto";

/**
 * Límite de envíos en memoria para frenar abuso sin guardar datos personales.
 * La IP nunca se persiste: sólo se usa su hash con una sal aleatoria por proceso.
 * En un despliegue con varias instancias debe sustituirse por un almacén compartido (p. ej. Redis).
 */
const SAL = randomBytes(16).toString("hex");
const VENTANA_MS = 10 * 60 * 1000;
const MAXIMO = 5;

const registros = new Map<string, number[]>();

export function huellaAnonima(identificador: string) {
  return createHash("sha256").update(SAL + identificador).digest("hex");
}

export function consumirCupo(identificador: string, ahora = Date.now(), maximo = MAXIMO, ventanaMs = VENTANA_MS) {
  const clave = huellaAnonima(identificador);
  const recientes = (registros.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (recientes.length >= maximo) {
    registros.set(clave, recientes);
    return { permitido: false as const, reintentarEnMs: ventanaMs - (ahora - recientes[0]) };
  }
  recientes.push(ahora);
  registros.set(clave, recientes);
  if (registros.size > 10_000) {
    for (const [k, v] of registros) if (v.every((t) => ahora - t >= ventanaMs)) registros.delete(k);
  }
  return { permitido: true as const };
}
