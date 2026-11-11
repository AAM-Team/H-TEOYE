"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cerrarSesion, crearSesion, obtenerUsuario, registrarBitacora } from "@/lib/auth/sesion";
import { consumirCupo } from "@/lib/limite-envios";
import { prisma } from "@/lib/prisma";

export type EstadoAcceso = { estado: "inicial" } | { estado: "error"; mensaje: string };

const esquema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña.").max(200),
});

// Hash de relleno: se compara aunque el correo no exista, para no revelar qué cuentas existen por el tiempo de respuesta.
let hashRelleno: string | null = null;
const relleno = () => (hashRelleno ??= bcrypt.hashSync("hteoye-relleno-sin-uso", 10));

export async function iniciarSesion(_previo: EstadoAcceso, formData: FormData): Promise<EstadoAcceso> {
  const datos = esquema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!datos.success) return { estado: "error", mensaje: datos.error.issues[0]?.message ?? "Revisa tus datos." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "conexion-local";
  const cupo = consumirCupo(`acceso:${ip}:${datos.data.email}`, Date.now(), 8, 15 * 60 * 1000);
  if (!cupo.permitido) {
    return { estado: "error", mensaje: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: datos.data.email },
    select: { id: true, passwordHash: true, activo: true },
  });
  const valida = await bcrypt.compare(datos.data.password, usuario?.passwordHash ?? relleno());
  if (!usuario || !valida || !usuario.activo) {
    return { estado: "error", mensaje: "El correo o la contraseña no son correctos." };
  }

  await crearSesion(usuario.id);
  await Promise.all([
    prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcceso: new Date() } }),
    registrarBitacora(usuario.id, "sesion.iniciar", "Usuario", usuario.id),
  ]);
  redirect("/panel");
}

export async function salir() {
  const usuario = await obtenerUsuario();
  await cerrarSesion();
  if (usuario) await registrarBitacora(usuario.id, "sesion.cerrar", "Usuario", usuario.id);
  redirect("/panel/login");
}
