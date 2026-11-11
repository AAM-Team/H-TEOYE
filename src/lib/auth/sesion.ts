import "server-only";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma, Rol } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Sesiones del panel institucional.
 * - El token aleatorio sólo vive en la cookie (httpOnly, SameSite=Lax, Secure en producción, ruta /panel).
 * - En la base se guarda su SHA-256: una fuga de la tabla no permite suplantar sesiones.
 * - Toda página y toda acción del panel vuelve a comprobar la sesión y el rol en el servidor.
 */
export const COOKIE_SESION = "hteoye_sesion";
const DURACION_MS = 8 * 60 * 60 * 1000;

const huella = (token: string) => createHash("sha256").update(token).digest("hex");

export async function crearSesion(usuarioId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiraEn = new Date(Date.now() + DURACION_MS);
  await prisma.sesion.create({ data: { tokenHash: huella(token), usuarioId, expiraEn } });
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/panel",
    expires: expiraEn,
  });
}

/** Usuario de la sesión actual, o null. Se memoriza por solicitud. */
export const obtenerUsuario = cache(async () => {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;
  const sesion = await prisma.sesion.findUnique({
    where: { tokenHash: huella(token) },
    select: {
      expiraEn: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          activo: true,
          dependenciaId: true,
          dependencia: { select: { nombre: true, nombreCorto: true, slug: true } },
        },
      },
    },
  });
  if (!sesion || sesion.expiraEn < new Date() || !sesion.usuario.activo) return null;
  return sesion.usuario;
});

export type UsuarioSesion = NonNullable<Awaited<ReturnType<typeof obtenerUsuario>>>;

/** Exige sesión (y opcionalmente uno de ciertos roles); si no, redirige. */
export async function requerirUsuario(roles?: Rol[]): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/panel/login");
  if (roles && !roles.includes(usuario.rol)) redirect("/panel?aviso=sin-permiso");
  return usuario;
}

export async function cerrarSesion() {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (token) await prisma.sesion.deleteMany({ where: { tokenHash: huella(token) } });
  almacen.delete({ name: COOKIE_SESION, path: "/panel" });
}

/** Filtro de alcance: la administración ve todo; los demás roles, sólo su dependencia. */
export function alcance(usuario: UsuarioSesion): { dependenciaId?: string } {
  if (usuario.rol === "ADMINISTRADOR") return {};
  return { dependenciaId: usuario.dependenciaId ?? "__sin-dependencia__" };
}

export const puedeModerar = (u: UsuarioSesion) => u.rol === "ADMINISTRADOR" || u.rol === "RESPONSABLE";
export const puedeValidar = puedeModerar;

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMINISTRADOR: "Coordinación general",
  RESPONSABLE: "Responsable de dependencia",
  ENLACE: "Enlace operativo",
};

export async function registrarBitacora(
  usuarioId: string | null,
  accion: string,
  entidad: string,
  entidadId?: string | null,
  detalle?: Prisma.InputJsonValue,
) {
  await prisma.bitacora.create({ data: { usuarioId, accion, entidad, entidadId: entidadId ?? null, detalle } });
}
