import { NextRequest } from "next/server";
import {
  exportarEvaluacionesACSV,
  obtenerEvaluacionesAnonimizadas,
} from "@/lib/consultas/datos-abiertos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

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

  const csv = exportarEvaluacionesACSV(evaluaciones);

  const fechaHoy = new Date().toISOString().slice(0, 10);
  const sufijo = dependenciaSlug ? `-${dependenciaSlug}` : "-municipio";
  const nombreArchivo = `evaluaciones-hermosillo${sufijo}-${fechaHoy}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

