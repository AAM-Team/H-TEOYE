import { createHash } from "node:crypto";
import { CANALES, MODALIDADES, PROBLEMAS } from "@/lib/constantes";

/**
 * Semilla estática para disociación determinista e irreversible de identificadores.
 * Garantiza que investigadores puedan correlacionar registros en análisis longitudinales
 * sin exponer jamás las claves primarias de la base de datos ni datos personales.
 */
const SALT_DISOCIACION = process.env.SALT_DISOCIACION || "hteoye-datos-abiertos-hermosillo-2026";

export function generarIdAnonimo(idInterno: string): string {
  return "eval_" + createHash("sha256").update(idInterno + SALT_DISOCIACION).digest("hex").slice(0, 12);
}

export const MAPA_PROBLEMAS = new Map<string, string>(PROBLEMAS.map((p) => [p.valor, p.etiqueta]));
export const MAPA_CANALES = new Map<string, string>(CANALES.map((c) => [c.valor, c.etiqueta]));
export const MAPA_MODALIDADES = new Map<string, string>(
  Object.entries(MODALIDADES).map(([k, v]) => [k, v.etiqueta]),
);

export type EvaluacionAnonimizada = {
  id_anonimo: string;
  fecha: string; // AAAA-MM-DD (k-anonimato temporal)
  dependencia: string;
  dependencia_clave: string;
  tramite: string;
  tramite_clave: string;
  modalidad: string;
  calificacion_trato: number;
  calificacion_claridad: number;
  calificacion_facilidad: number;
  calificacion_satisfaccion: number;
  canal_atencion: string;
  problemas_reportados: string;
  reporte_pago_indebido: "SI" | "NO" | "NO_RESPONDIO";
  comentario_publico: string;
  es_dato_demostrativo: boolean;
};

export type FiltrosDatosAbiertos = {
  dependenciaSlug?: string;
  tramiteClave?: string;
  incluirDemo?: boolean;
};

function escaparCSV(campo: string | number | boolean): string {
  const str = String(campo ?? "");
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.includes(";")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convierte un conjunto de evaluaciones anonimizadas a formato CSV conforme al estándar RFC 4180
 * con encabezado BOM UTF-8 para visualización óptima en Microsoft Excel, LibreOffice y herramientas de datos.
 */
export function exportarEvaluacionesACSV(evaluaciones: EvaluacionAnonimizada[]): string {
  const encabezados = [
    "id_anonimo",
    "fecha",
    "dependencia",
    "dependencia_clave",
    "tramite",
    "tramite_clave",
    "modalidad",
    "calificacion_trato",
    "calificacion_claridad",
    "calificacion_facilidad",
    "calificacion_satisfaccion",
    "canal_atencion",
    "problemas_reportados",
    "reporte_pago_indebido",
    "comentario_publico",
    "es_dato_demostrativo",
  ];

  const filas = evaluaciones.map((ev) =>
    [
      ev.id_anonimo,
      ev.fecha,
      ev.dependencia,
      ev.dependencia_clave,
      ev.tramite,
      ev.tramite_clave,
      ev.modalidad,
      ev.calificacion_trato,
      ev.calificacion_claridad,
      ev.calificacion_facilidad,
      ev.calificacion_satisfaccion,
      ev.canal_atencion,
      ev.problemas_reportados,
      ev.reporte_pago_indebido,
      ev.comentario_publico,
      ev.es_dato_demostrativo ? "VERDADERO" : "FALSO",
    ]
      .map(escaparCSV)
      .join(","),
  );

  return "\uFEFF" + [encabezados.join(","), ...filas].join("\r\n");
}

