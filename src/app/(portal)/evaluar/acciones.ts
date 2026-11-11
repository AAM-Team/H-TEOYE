"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { consumirCupoCompartido, ipDeEncabezados } from "@/lib/limite-compartido";
import { evaluacionSchema, formDataAObjeto } from "@/lib/validaciones/evaluacion";
import { redactarDatosPersonales } from "@/lib/validaciones/datos-personales";

export type EstadoEnvio =
  | { estado: "inicial" }
  | { estado: "error"; mensaje: string; errores?: Record<string, string[] | undefined> };

async function identificadorConexion() {
  return ipDeEncabezados(await headers());
}

export async function enviarEvaluacion(_previo: EstadoEnvio, formData: FormData): Promise<EstadoEnvio> {
  // Campo trampa para bots: un humano no lo ve ni lo llena.
  if (String(formData.get("sitio_web") ?? "") !== "") redirect("/evaluar/gracias");

  const resultado = evaluacionSchema.safeParse(formDataAObjeto(formData));
  if (!resultado.success) {
    const errores: Record<string, string[]> = {};
    for (const issue of resultado.error.issues) {
      const campo = String(issue.path[0] ?? "formulario");
      (errores[campo] ??= []).push(issue.message);
    }
    return { estado: "error", mensaje: "Revisa los campos marcados para enviar tu evaluación.", errores };
  }
  const datos = resultado.data;

  const tramite = await prisma.tramite.findFirst({
    where: { id: datos.tramiteId, activo: true, dependencia: { activa: true } },
    select: { id: true, dependenciaId: true, dependencia: { select: { slug: true } } },
  });
  if (!tramite) {
    return { estado: "error", mensaje: "El trámite seleccionado ya no está disponible para evaluación." };
  }

  // Sólo cuentan los envíos válidos: corregir errores del formulario no consume cupo.
  const cupo = await consumirCupoCompartido("evaluacion", await identificadorConexion(), 5, 10 * 60 * 1000);
  if (!cupo.permitido) {
    return {
      estado: "error",
      mensaje: "Recibimos varias evaluaciones desde esta conexión en pocos minutos. Intenta de nuevo más tarde.",
    };
  }

  const comentario = datos.comentario ? redactarDatosPersonales(datos.comentario) : null;

  await prisma.evaluacion.create({
    data: {
      tramiteId: tramite.id,
      dependenciaId: tramite.dependenciaId,
      trato: datos.trato,
      claridad: datos.claridad,
      facilidad: datos.facilidad,
      satisfaccion: datos.satisfaccion,
      canal: datos.canal ?? null,
      problemas: datos.problemas,
      pagoIndebido: datos.pagoIndebido ?? null,
      comentario: comentario?.texto ?? null,
      comentarioRedactado: comentario?.redactado ?? false,
      estadoComentario: comentario ? "PENDIENTE" : "SIN_COMENTARIO",
    },
  });

  revalidatePath("/", "layout");
  const params = new URLSearchParams({ dependencia: tramite.dependencia.slug });
  if (comentario?.redactado) params.set("redactado", "1");
  redirect(`/evaluar/gracias?${params.toString()}`);
}
