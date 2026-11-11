import "server-only";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { consumirCupo } from "@/lib/limite-envios";

/**
 * Límite de uso compartido entre todas las instancias del servidor (Vercel ejecuta varias
 * a la vez, cada una con su propia memoria). Usa una ventana fija guardada en PostgreSQL.
 *
 * Privacidad: la clave guardada es un HMAC con una sal secreta (LIMITE_SAL); la IP nunca
 * se almacena. Si la base de datos falla, se recurre al límite en memoria del proceso.
 */

let avisoSal = false;
function sal() {
  const s = process.env.LIMITE_SAL;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production" && !avisoSal) {
    avisoSal = true;
    console.error("[limite] Falta LIMITE_SAL (mín. 16 caracteres): los hashes de límite usan una sal por defecto.");
  }
  return "h-teoye-sal-de-desarrollo";
}

export function claveLimite(...partes: string[]) {
  return createHmac("sha256", sal()).update(partes.join("\u0000")).digest("hex");
}

export type ResultadoCupo = { permitido: true; restantes: number } | { permitido: false; reintentarEnS: number };

export async function consumirCupoCompartido(
  ambito: string,
  identificador: string,
  maximo: number,
  ventanaMs: number,
): Promise<ResultadoCupo> {
  const clave = claveLimite(ambito, identificador);
  const expira = new Date(Date.now() + ventanaMs);
  try {
    const [fila] = await prisma.$queryRaw<{ conteo: number; expiraEn: Date }[]>`
      INSERT INTO "LimiteUso" ("clave", "conteo", "expiraEn") VALUES (${clave}, 1, ${expira})
      ON CONFLICT ("clave") DO UPDATE SET
        "conteo"   = CASE WHEN "LimiteUso"."expiraEn" <= NOW() THEN 1 ELSE "LimiteUso"."conteo" + 1 END,
        "expiraEn" = CASE WHEN "LimiteUso"."expiraEn" <= NOW() THEN EXCLUDED."expiraEn" ELSE "LimiteUso"."expiraEn" END
      RETURNING "conteo", "expiraEn"`;

    // Limpieza ocasional de ventanas vencidas (≈1 % de las solicitudes).
    if (Math.random() < 0.01) {
      prisma.$executeRaw`DELETE FROM "LimiteUso" WHERE "expiraEn" < NOW() - INTERVAL '1 day'`.catch(() => {});
    }

    if (fila.conteo > maximo) {
      return { permitido: false, reintentarEnS: Math.max(1, Math.ceil((fila.expiraEn.getTime() - Date.now()) / 1000)) };
    }
    return { permitido: true, restantes: maximo - fila.conteo };
  } catch (e) {
    console.error("[limite] base de datos no disponible, uso límite en memoria:", (e as Error).message);
    const local = consumirCupo(`${ambito}:${identificador}`, Date.now(), maximo, ventanaMs);
    return local.permitido
      ? { permitido: true, restantes: 0 }
      : { permitido: false, reintentarEnS: Math.ceil(local.reintentarEnMs / 1000) };
  }
}

/**
 * IP del cliente para los límites de uso.
 *
 * En Vercel sólo `x-real-ip` es confiable: la plataforma lo sobrescribe con la IP real.
 * Se comprobó en producción que `x-vercel-forwarded-for` llega tal como lo envía el cliente,
 * así que NO debe usarse (permitiría saltarse el límite inventando una IP por petición).
 * Fuera de Vercel (desarrollo local) se acepta `x-forwarded-for` como respaldo.
 */
export function ipDeEncabezados(h: Headers) {
  const real = h.get("x-real-ip")?.trim();
  if (process.env.VERCEL) return real || "sin-ip";
  return real || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "conexion-local";
}
