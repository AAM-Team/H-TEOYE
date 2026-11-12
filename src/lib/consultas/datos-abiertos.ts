import "server-only";
import { prisma } from "@/lib/prisma";
import { EstadoComentario, type Prisma } from "@prisma/client";
import {
  MAPA_CANALES,
  MAPA_MODALIDADES,
  MAPA_PROBLEMAS,
  exportarEvaluacionesACSV,
  generarIdAnonimo,
  type EvaluacionAnonimizada,
  type FiltrosDatosAbiertos,
} from "@/lib/datos-abiertos";

export { exportarEvaluacionesACSV, generarIdAnonimo };
export type { EvaluacionAnonimizada, FiltrosDatosAbiertos };

/**
 * Consulta evaluaciones aplicando disociación estricta de datos personales
 * de conformidad con el Art. 3, Fracción XIV de la Ley General de Protección
 * de Datos Personales en Posesión de Sujetos Obligados (LGPDPPSO).
 *
 * Reglas de anonimización:
 * 1. El folio del trámite NUNCA se consulta ni se incluye en la respuesta.
 * 2. La fecha se trunca a día (AAAA-MM-DD) para evitar ataques de correlación temporal.
 * 3. Los comentarios solo se incluyen si su estado es APROBADO (revisados contra datos personales).
 * 4. El ID se sustituye por un hash sintético irreversible.
 */
export async function obtenerEvaluacionesAnonimizadas(
  filtros: FiltrosDatosAbiertos = {},
): Promise<EvaluacionAnonimizada[]> {
  const where: Prisma.EvaluacionWhereInput = {};

  if (filtros.dependenciaSlug) {
    where.dependencia = { slug: filtros.dependenciaSlug };
  }

  if (filtros.tramiteClave) {
    where.tramite = { clave: filtros.tramiteClave };
  }

  if (filtros.incluirDemo !== undefined) {
    where.esDemo = filtros.incluirDemo;
  }

  // IMPORTANTE POR PRIVACIDAD: No se solicita el campo `folio`.
  const evaluaciones = await prisma.evaluacion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      trato: true,
      claridad: true,
      facilidad: true,
      satisfaccion: true,
      canal: true,
      problemas: true,
      pagoIndebido: true,
      comentario: true,
      estadoComentario: true,
      esDemo: true,
      dependencia: {
        select: {
          nombre: true,
          slug: true,
        },
      },
      tramite: {
        select: {
          nombre: true,
          clave: true,
          modalidad: true,
        },
      },
    },
  });

  return evaluaciones.map((ev) => {
    const fecha = ev.createdAt.toISOString().slice(0, 10);

    const problemasTexto =
      ev.problemas.length > 0
        ? ev.problemas.map((p) => MAPA_PROBLEMAS.get(p) ?? p).join("; ")
        : "Ninguno";

    const comentarioPublico =
      ev.estadoComentario === EstadoComentario.APROBADO && ev.comentario
        ? ev.comentario.trim()
        : "";

    return {
      id_anonimo: generarIdAnonimo(ev.id),
      fecha,
      dependencia: ev.dependencia.nombre,
      dependencia_clave: ev.dependencia.slug,
      tramite: ev.tramite.nombre,
      tramite_clave: ev.tramite.clave ?? "sin-clave",
      modalidad: ev.tramite.modalidad
        ? (MAPA_MODALIDADES.get(ev.tramite.modalidad) ?? ev.tramite.modalidad)
        : "No especificada",
      calificacion_trato: ev.trato,
      calificacion_claridad: ev.claridad,
      calificacion_facilidad: ev.facilidad,
      calificacion_satisfaccion: ev.satisfaccion,
      canal_atencion: ev.canal ? (MAPA_CANALES.get(ev.canal) ?? ev.canal) : "No especificado",
      problemas_reportados: problemasTexto,
      reporte_pago_indebido:
        ev.pagoIndebido === true ? "SI" : ev.pagoIndebido === false ? "NO" : "NO_RESPONDIO",
      comentario_publico: comentarioPublico,
      es_dato_demostrativo: ev.esDemo,
    };
  });
}
