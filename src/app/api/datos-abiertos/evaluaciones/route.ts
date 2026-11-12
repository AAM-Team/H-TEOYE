import { NextRequest, NextResponse } from "next/server";
import {
  exportarEvaluacionesACSV,
  obtenerEvaluacionesAnonimizadas,
} from "@/lib/consultas/datos-abiertos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * API Abierta de Evaluaciones Ciudadanas de Hermosillo.
 *
 * Criterios de Aceptación:
 * - Exportación en formatos abiertos estandarizados (JSON por defecto, CSV vía ?formato=csv).
 * - Garantía estricta de desvinculación de datos personales (Art. 3 Fracc. XIV LGPDPPSO).
 * - Sin folios, sin IPs, hora truncada a día, comentarios solo si están aprobados.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const formato = searchParams.get("formato")?.toLowerCase();
  const dependenciaSlug = searchParams.get("dependencia") || undefined;
  const tramiteClave = searchParams.get("tramite") || undefined;
  const incluirDemoParam = searchParams.get("incluir_demo");
  const incluirDemo =
    incluirDemoParam === "false" ? false : incluirDemoParam === "true" ? true : undefined;

  const evaluaciones = await obtenerEvaluacionesAnonimizadas({
    dependenciaSlug,
    tramiteClave,
    incluirDemo,
  });

  const fechaHoy = new Date().toISOString().slice(0, 10);

  // Si se solicita formato CSV en la API
  if (formato === "csv") {
    const csv = exportarEvaluacionesACSV(evaluaciones);
    const sufijo = dependenciaSlug ? `-${dependenciaSlug}` : "-municipio";
    const nombreArchivo = `evaluaciones-hermosillo${sufijo}-${fechaHoy}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  // Respuesta JSON estándar de Datos Abiertos
  return NextResponse.json(
    {
      metadatos: {
        titulo: "Evaluaciones de Calidad en la Atención Ciudadana — H-TEOYE Hermosillo",
        descripcion:
          "Conjunto de datos abiertos y anonimizados con las evaluaciones ciudadanas sobre trámites y servicios municipales del Ayuntamiento de Hermosillo.",
        licencia: "Open Data Commons Open Database License (ODbL) / Libre uso para investigación y periodismo",
        marco_legal_privacidad:
          "Disociación estricta conforme al Art. 3, Fracc. XIV de la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados (LGPDPPSO).",
        garantias_desvinculacion: [
          "Folios excluidos: los folios de trámite nunca se exponen en este conjunto de datos.",
          "k-anonimato temporal: fecha truncada a nivel día (AAAA-MM-DD) para evitar correlación con bitácoras físicas.",
          "Identificador sintético: 'id_anonimo' es un hash determinista no reversible.",
          "Comentarios moderados: solo se muestran textos previamente revisados y redactados contra datos personales.",
        ],
        fecha_extraccion: new Date().toISOString(),
        total_registros: evaluaciones.length,
        filtros_aplicados: {
          dependencia: dependenciaSlug ?? "todas",
          tramite: tramiteClave ?? "todos",
          incluir_demo: incluirDemo ?? "todos",
        },
        documentacion_campos: {
          id_anonimo: "Identificador sintético seguro no vinculable a personas ni expedientes.",
          fecha: "Fecha del registro en formato ISO (AAAA-MM-DD).",
          dependencia: "Nombre de la dependencia municipal evaluada.",
          dependencia_clave: "Identificador URL de la dependencia.",
          tramite: "Nombre del trámite evaluado.",
          tramite_clave: "Clave de importación del catálogo oficial de trámites.",
          modalidad: "Modalidad oficial de atención (En ventanilla, En línea, Con formato).",
          calificacion_trato: "Calificación otorgada al trato del personal (1 a 5).",
          calificacion_claridad: "Calificación sobre claridad de información y requisitos (1 a 5).",
          calificacion_facilidad: "Calificación sobre facilidad del trámite (1 a 5).",
          calificacion_satisfaccion: "Satisfacción general con el servicio (1 a 5).",
          canal_atencion: "Canal por el cual se realizó el trámite (Presencial, En línea, Telefónico).",
          problemas_reportados: "Barreras o problemas reportados (categorías de la ENCIG - INEGI).",
          reporte_pago_indebido: "Respuesta ciudadana sobre si le solicitaron pagos indebidos (SI, NO, NO_RESPONDIO).",
          comentario_publico: "Comentario ciudadano, presente únicamente si fue aprobado por la moderación.",
          es_dato_demostrativo: "Booleano que distingue datos ficticios de demostración de evaluaciones reales.",
        },
      },
      datos: evaluaciones,
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

