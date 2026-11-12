import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DIMENSIONES, PROBLEMAS } from "@/lib/constantes";
import { MIN_MUESTRA } from "@/lib/consultas/resultados";

/**
 * Consultas internas del panel. A diferencia de publicas.ts, aquí sí se leen registros individuales,
 * pero SIEMPRE filtrados por el alcance del usuario (su dependencia, salvo la administración).
 */
type Alcance = { dependenciaId?: string };
const DIA = 86_400_000;

export async function resumenPanel(filtro: Alcance) {
  const ahora = Date.now();
  const hace30 = new Date(ahora - 30 * DIA);
  const hace60 = new Date(ahora - 60 * DIA);
  const [recientes, previas, prom30, prom60, pendientes, abiertas, porValidar, comentarios, acciones] = await Promise.all([
    prisma.evaluacion.count({ where: { ...filtro, createdAt: { gte: hace30 } } }),
    prisma.evaluacion.count({ where: { ...filtro, createdAt: { gte: hace60, lt: hace30 } } }),
    prisma.evaluacion.aggregate({ where: { ...filtro, createdAt: { gte: hace30 } }, _avg: { satisfaccion: true } }),
    prisma.evaluacion.aggregate({ where: { ...filtro, createdAt: { gte: hace60, lt: hace30 } }, _avg: { satisfaccion: true } }),
    prisma.evaluacion.count({ where: { ...filtro, estadoComentario: "PENDIENTE" } }),
    prisma.accionMejora.count({ where: { ...filtro, estado: { not: "CONCLUIDA" } } }),
    prisma.accionMejora.count({ where: { ...filtro, validada: false } }),
    prisma.evaluacion.groupBy({
      by: ["estadoComentario"],
      where: { ...filtro, estadoComentario: { not: "SIN_COMENTARIO" } },
      _count: { _all: true },
    }),
    prisma.accionMejora.groupBy({ by: ["estado"], where: filtro, _count: { _all: true } }),
  ]);
  const porComentario = new Map<string, number>(comentarios.map((c) => [c.estadoComentario, c._count._all]));
  const porAccion = new Map<string, number>(acciones.map((a) => [a.estado, a._count._all]));
  return {
    recientes,
    previas,
    satisfaccion30: prom30._avg.satisfaccion,
    satisfaccionPrevia: prom60._avg.satisfaccion,
    pendientes,
    abiertas,
    porValidar,
    comentarios: {
      PENDIENTE: porComentario.get("PENDIENTE") ?? 0,
      APROBADO: porComentario.get("APROBADO") ?? 0,
      RECHAZADO: porComentario.get("RECHAZADO") ?? 0,
    },
    acciones: {
      PENDIENTE: porAccion.get("PENDIENTE") ?? 0,
      EN_REVISION: porAccion.get("EN_REVISION") ?? 0,
      EN_PROCESO: porAccion.get("EN_PROCESO") ?? 0,
      CONCLUIDA: porAccion.get("CONCLUIDA") ?? 0,
    },
  };
}

const ETIQUETA_PROBLEMA = new Map<string, string>(PROBLEMAS.map((p) => [p.valor, p.etiqueta]));

export type Prioridad = {
  tramiteId: string;
  tramite: string;
  dependencia: string;
  dependenciaSlug: string;
  total: number;
  satisfaccion: number;
  peorAspecto: { titulo: string; valor: number } | null;
  /** Trato, claridad y facilidad (en el orden de DIMENSIONES), para dibujarlos lado a lado. */
  aspectos: { titulo: string; valor: number | null }[];
  problema: { etiqueta: string; proporcion: number } | null;
  pagoIndebido: number | null;
  accionAbierta: string | null;
};

/** Trámites con peor satisfacción (con muestra suficiente), con la pista de qué atender primero. */
export async function prioridades(filtro: Alcance, limite = 4): Promise<Prioridad[]> {
  const grupos = await prisma.evaluacion.groupBy({
    by: ["tramiteId"],
    where: filtro,
    _count: { _all: true },
    _avg: { trato: true, claridad: true, facilidad: true, rapidez: true, satisfaccion: true },
    having: { tramiteId: { _count: { gte: MIN_MUESTRA } } },
    orderBy: { _avg: { satisfaccion: "asc" } },
    take: limite,
  });
  if (!grupos.length) return [];
  const ids = grupos.map((g) => g.tramiteId);

  const [tramites, problemas, respondieron, pagos, acciones] = await Promise.all([
    prisma.tramite.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true, dependencia: { select: { nombreCorto: true, slug: true } } },
    }),
    prisma.$queryRaw<{ tramiteId: string; problema: string; total: number }[]>`
      SELECT "tramiteId", p::text AS problema, count(*)::int AS total
      FROM "Evaluacion", unnest("problemas") AS p
      WHERE "tramiteId" IN (${Prisma.join(ids)}) AND p <> 'NINGUNO'
      GROUP BY 1, 2`,
    prisma.$queryRaw<{ tramiteId: string; total: number }[]>`
      SELECT "tramiteId", count(*)::int AS total FROM "Evaluacion"
      WHERE "tramiteId" IN (${Prisma.join(ids)}) AND cardinality("problemas") > 0
      GROUP BY 1`,
    prisma.evaluacion.groupBy({
      by: ["tramiteId", "pagoIndebido"],
      where: { tramiteId: { in: ids }, pagoIndebido: { not: null } },
      _count: { _all: true },
    }),
    prisma.accionMejora.findMany({
      where: { tramiteId: { in: ids }, estado: { not: "CONCLUIDA" } },
      select: { tramiteId: true, titulo: true },
    }),
  ]);

  const nombres = new Map(tramites.map((t) => [t.id, t]));
  const resp = new Map(respondieron.map((r) => [r.tramiteId, r.total]));

  return grupos.map((g) => {
    const t = nombres.get(g.tramiteId);
    const aspectos = DIMENSIONES.filter((d) => d.clave !== "satisfaccion")
      .map((d): { titulo: string; valor: number | null } => ({ titulo: d.titulo, valor: g._avg[d.clave] }))
      .filter((a): a is { titulo: string; valor: number } => a.valor != null)
      .sort((a, b) => a.valor - b.valor);
    const top = problemas.filter((p) => p.tramiteId === g.tramiteId).sort((a, b) => b.total - a.total)[0];
    const n = resp.get(g.tramiteId) ?? 0;
    const si = pagos.find((p) => p.tramiteId === g.tramiteId && p.pagoIndebido === true)?._count._all ?? 0;
    const no = pagos.find((p) => p.tramiteId === g.tramiteId && p.pagoIndebido === false)?._count._all ?? 0;
    return {
      tramiteId: g.tramiteId,
      tramite: t?.nombre ?? "—",
      dependencia: t?.dependencia.nombreCorto ?? "—",
      dependenciaSlug: t?.dependencia.slug ?? "",
      total: g._count._all,
      satisfaccion: g._avg.satisfaccion ?? 0,
      peorAspecto: aspectos[0] ?? null,
      aspectos: DIMENSIONES.filter((d) => d.clave !== "satisfaccion").map((d) => ({ titulo: d.titulo, valor: g._avg[d.clave] })),
      problema: top && n ? { etiqueta: ETIQUETA_PROBLEMA.get(top.problema) ?? top.problema, proporcion: top.total / n } : null,
      pagoIndebido: si + no >= MIN_MUESTRA ? si / (si + no) : null,
      accionAbierta: acciones.find((a) => a.tramiteId === g.tramiteId)?.titulo ?? null,
    };
  });
}

export type FiltrosEvaluaciones = {
  dependenciaId?: string;
  tramiteId?: string;
  calificacion?: "mal" | "regular" | "bien";
  comentario?: boolean;
  /** Búsqueda por folio (exacto o parcial, sin distinguir mayúsculas). */
  folio?: string;
  pagina: number;
};

export const POR_PAGINA = 20;

export async function listarEvaluaciones(alcanceUsuario: Alcance, f: FiltrosEvaluaciones) {
  const where: Prisma.EvaluacionWhereInput = {
    ...(f.dependenciaId ? { dependenciaId: f.dependenciaId } : {}),
    ...alcanceUsuario, // el alcance del usuario siempre gana sobre el filtro elegido
    ...(f.tramiteId ? { tramiteId: f.tramiteId } : {}),
    ...(f.calificacion === "mal" ? { satisfaccion: { lte: 2 } } : {}),
    ...(f.calificacion === "regular" ? { satisfaccion: 3 } : {}),
    ...(f.calificacion === "bien" ? { satisfaccion: { gte: 4 } } : {}),
    ...(f.comentario ? { comentario: { not: null } } : {}),
    ...(f.folio ? { folio: { contains: f.folio, mode: "insensitive" as const } } : {}),
  };
  const [total, filas] = await Promise.all([
    prisma.evaluacion.count({ where }),
    prisma.evaluacion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: {
        id: true,
        folio: true,
        createdAt: true,
        trato: true,
        claridad: true,
        facilidad: true,
        rapidez: true,
        satisfaccion: true,
        canal: true,
        problemas: true,
        pagoIndebido: true,
        problemaOtro: true,
        comentario: true,
        estadoComentario: true,
        esDemo: true,
        tramite: { select: { nombre: true } },
        dependencia: { select: { nombreCorto: true } },
      },
    }),
  ]);
  return { total, filas };
}
