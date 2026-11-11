"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EstadoAccion } from "@prisma/client";
import { alcance, puedeModerar, puedeValidar, registrarBitacora, requerirUsuario } from "@/lib/auth/sesion";
import { prisma } from "@/lib/prisma";

/**
 * Acciones del panel. Cada una vuelve a comprobar sesión, rol y alcance en el servidor:
 * nunca se confía en lo que el formulario dice sobre la dependencia.
 */

const id = z.string().min(1).max(64);

export async function moderarComentario(formData: FormData) {
  const usuario = await requerirUsuario();
  if (!puedeModerar(usuario)) redirect("/panel/comentarios?aviso=sin-permiso");
  const datos = z.object({ id, decision: z.enum(["APROBADO", "RECHAZADO"]) }).safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
  });
  if (!datos.success) redirect("/panel/comentarios");

  const r = await prisma.evaluacion.updateMany({
    where: { id: datos.data.id, ...alcance(usuario), comentario: { not: null } },
    data: { estadoComentario: datos.data.decision, comentarioRevisadoPorId: usuario.id, comentarioRevisadoEn: new Date() },
  });
  if (r.count) {
    await registrarBitacora(usuario.id, datos.data.decision === "APROBADO" ? "comentario.aprobar" : "comentario.rechazar", "Evaluacion", datos.data.id);
  }
  revalidatePath("/panel", "layout");
}

export type EstadoFormularioAccion = { estado: "inicial" } | { estado: "error"; mensaje: string; errores?: Record<string, string> };

const esquemaAccion = z.object({
  titulo: z.string().trim().min(5, "Escribe un título de al menos 5 caracteres.").max(120, "Máximo 120 caracteres."),
  descripcion: z.string().trim().min(15, "Describe la acción en al menos 15 caracteres.").max(1000, "Máximo 1,000 caracteres."),
  dependenciaId: z.string().max(64).optional(),
  tramiteId: z.string().max(64).optional(),
  fechaCompromiso: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function crearAccion(_previo: EstadoFormularioAccion, formData: FormData): Promise<EstadoFormularioAccion> {
  const usuario = await requerirUsuario();
  const vacio = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v : undefined);
  const datos = esquemaAccion.safeParse({
    titulo: formData.get("titulo") ?? "",
    descripcion: formData.get("descripcion") ?? "",
    dependenciaId: vacio(formData.get("dependenciaId")),
    tramiteId: vacio(formData.get("tramiteId")),
    fechaCompromiso: vacio(formData.get("fechaCompromiso")),
  });
  if (!datos.success) {
    const errores: Record<string, string> = {};
    for (const i of datos.error.issues) errores[String(i.path[0])] ??= i.message;
    return { estado: "error", mensaje: "Revisa los campos marcados.", errores };
  }
  const d = datos.data;

  // La dependencia sale del usuario; sólo la administración puede elegirla.
  let dependenciaId = usuario.rol === "ADMINISTRADOR" ? d.dependenciaId : usuario.dependenciaId;
  if (d.tramiteId) {
    const t = await prisma.tramite.findFirst({ where: { id: d.tramiteId, ...alcance(usuario) }, select: { dependenciaId: true } });
    if (!t) return { estado: "error", mensaje: "El trámite elegido no pertenece a tu dependencia." };
    dependenciaId ??= t.dependenciaId;
    if (t.dependenciaId !== dependenciaId) return { estado: "error", mensaje: "El trámite no corresponde a la dependencia elegida." };
  }
  if (!dependenciaId) return { estado: "error", mensaje: "Elige una dependencia.", errores: { dependenciaId: "Elige una dependencia." } };

  const accion = await prisma.accionMejora.create({
    data: {
      titulo: d.titulo,
      descripcion: d.descripcion,
      dependenciaId,
      tramiteId: d.tramiteId ?? null,
      fechaCompromiso: d.fechaCompromiso ? new Date(`${d.fechaCompromiso}T12:00:00Z`) : null,
      creadoPorId: usuario.id,
    },
    select: { id: true },
  });
  await registrarBitacora(usuario.id, "accion.crear", "AccionMejora", accion.id, { titulo: d.titulo });
  revalidatePath("/panel", "layout");
  redirect("/panel/acciones?aviso=creada");
}

async function accionEnAlcance(accionId: string) {
  const usuario = await requerirUsuario();
  const accion = await prisma.accionMejora.findFirst({
    where: { id: accionId, ...alcance(usuario) },
    select: { id: true, creadoPorId: true, validada: true, publicada: true },
  });
  if (!accion) redirect("/panel/acciones");
  return { usuario, accion };
}

export async function cambiarEstadoAccion(formData: FormData) {
  const datos = z.object({ id, estado: z.enum(EstadoAccion) }).safeParse({ id: formData.get("id"), estado: formData.get("estado") });
  if (!datos.success) redirect("/panel/acciones");
  const { usuario, accion } = await accionEnAlcance(datos.data.id);
  await prisma.accionMejora.update({ where: { id: accion.id }, data: { estado: datos.data.estado } });
  await registrarBitacora(usuario.id, "accion.estado", "AccionMejora", accion.id, { estado: datos.data.estado });
  revalidatePath("/panel", "layout");
}

export async function validarAccion(formData: FormData) {
  const datos = id.safeParse(formData.get("id"));
  if (!datos.success) redirect("/panel/acciones");
  const { usuario, accion } = await accionEnAlcance(datos.data);
  if (!puedeValidar(usuario)) redirect("/panel/acciones?aviso=sin-permiso");
  // Separación de funciones: quien registra no valida su propia acción.
  if (accion.creadoPorId === usuario.id) redirect("/panel/acciones?aviso=propia");
  await prisma.accionMejora.update({
    where: { id: accion.id },
    data: { validada: true, validadaPorId: usuario.id, validadaEn: new Date() },
  });
  await registrarBitacora(usuario.id, "accion.validar", "AccionMejora", accion.id);
  revalidatePath("/panel", "layout");
}

export async function publicarAccion(formData: FormData) {
  const datos = z.object({ id, publicar: z.enum(["si", "no"]) }).safeParse({ id: formData.get("id"), publicar: formData.get("publicar") });
  if (!datos.success) redirect("/panel/acciones");
  const { usuario, accion } = await accionEnAlcance(datos.data.id);
  if (!puedeValidar(usuario)) redirect("/panel/acciones?aviso=sin-permiso");
  const publicar = datos.data.publicar === "si";
  if (publicar && !accion.validada) redirect("/panel/acciones?aviso=sin-validar");
  await prisma.accionMejora.update({
    where: { id: accion.id },
    data: { publicada: publicar, publicadaEn: publicar ? new Date() : null },
  });
  await registrarBitacora(usuario.id, publicar ? "accion.publicar" : "accion.despublicar", "AccionMejora", accion.id);
  revalidatePath("/panel", "layout");
  revalidatePath("/acciones");
}
