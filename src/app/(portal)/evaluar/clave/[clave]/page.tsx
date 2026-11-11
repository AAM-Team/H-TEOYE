import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Enlace estable a la evaluación de un trámite por su clave del catálogo
 * (p. ej. /evaluar/clave/agua-tarifa-social). Lo usa el asistente, que no conoce
 * los identificadores internos de la base de datos.
 */
export default async function EvaluarPorClave({ params }: PageProps<"/evaluar/clave/[clave]">) {
  const { clave } = await params;
  const tramite = await prisma.tramite.findFirst({
    where: { clave, activo: true, dependencia: { activa: true } },
    select: { id: true },
  });
  redirect(tramite ? `/evaluar/${tramite.id}` : "/dependencias");
}
