import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DIMENSIONES, PROBLEMAS, type ClaveDimension } from "@/lib/constantes";

/**
 * Consultas del tablero público de resultados.
 * Regla (igual que en publicas.ts): sólo AGREGADOS. Nunca evaluaciones individuales
 * ni comentarios sin moderar. Un grupo con menos de MIN_MUESTRA evaluaciones se
 * muestra como «muestra insuficiente» para no exponer respuestas casi individuales.
 */
export const MIN_MUESTRA = 5;
const MESES_TENDENCIA = 6;

export type Promedios = Record<ClaveDimension, number | null>;
/** Conteo de respuestas de satisfacción general por estrella: índice 0 = 1 estrella … 4 = 5 estrellas. */
export type Distribucion = [number, number, number, number, number];

export type ResumenDependencia = {
  id: string;
  slug: string;
  nombre: string;
  nombreCorto: string;
  total: number;
  promedios: Promedios;
  distribucion: Distribucion;
  /** Proporción 0–1 de personas que calificaron su satisfacción general con 4 o 5. */
  satisfechos: number | null;
};

const vacio = (): Promedios => ({ trato: null, claridad: null, facilidad: null, rapidez: null, satisfaccion: null });

function satisfechosDe(d: Distribucion) {
  const total = d.reduce((a, b) => a + b, 0);
  return total ? (d[3] + d[4]) / total : null;
}

/** Resumen de las cinco dependencias, siempre completo para poder compararlas entre sí. */
export async function resumenPorDependencia(): Promise<ResumenDependencia[]> {
  const [dependencias, promedios, distribucion] = await Promise.all([
    prisma.dependencia.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
      select: { id: true, slug: true, nombre: true, nombreCorto: true },
    }),
    prisma.evaluacion.groupBy({
      by: ["dependenciaId"],
      _count: { _all: true },
      _avg: { trato: true, claridad: true, facilidad: true, rapidez: true, satisfaccion: true },
    }),
    prisma.evaluacion.groupBy({ by: ["dependenciaId", "satisfaccion"], _count: { _all: true } }),
  ]);

  const porId = new Map(promedios.map((p) => [p.dependenciaId, p]));
  return dependencias.map((d) => {
    const p = porId.get(d.id);
    const dist: Distribucion = [0, 0, 0, 0, 0];
    for (const fila of distribucion) {
      if (fila.dependenciaId === d.id && fila.satisfaccion >= 1 && fila.satisfaccion <= 5) {
        dist[fila.satisfaccion - 1] = fila._count._all;
      }
    }
    const total = p?._count._all ?? 0;
    const suficiente = total >= MIN_MUESTRA;
    return {
      ...d,
      total,
      promedios: suficiente && p ? { ...vacio(), ...p._avg } : vacio(),
      distribucion: suficiente ? dist : [0, 0, 0, 0, 0],
      satisfechos: suficiente ? satisfechosDe(dist) : null,
    };
  });
}

export type PuntoTendencia = { mes: string; etiqueta: string; total: number; satisfaccion: number | null };
export type Frecuencia = { clave: string; etiqueta: string; total: number; proporcion: number };

export type Detalle = {
  total: number;
  totalDemo: number;
  promedios: Promedios;
  distribucion: Distribucion;
  satisfechos: number | null;
  tendencia: PuntoTendencia[];
  problemas: Frecuencia[];
  /** Personas que respondieron la pregunta de problemas (incluye «ninguno»). */
  respondieronProblemas: number;
  /** Proporción 0–1 que reportó una solicitud de pago no oficial, entre quienes respondieron. */
  pagoIndebido: number | null;
  respondieronPago: number;
  canales: Frecuencia[];
};

const ETIQUETA_CANAL: Record<string, string> = {
  PRESENCIAL: "Presencial",
  EN_LINEA: "En línea",
  TELEFONICO: "Por teléfono",
};

const formatoMes = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });

/** Indicadores detallados de todo el municipio o de una sola dependencia. */
export async function obtenerDetalle(dependenciaId?: string): Promise<Detalle> {
  const where: Prisma.EvaluacionWhereInput = dependenciaId ? { dependenciaId } : {};
  const filtroSql = dependenciaId ? Prisma.sql`AND "dependenciaId" = ${dependenciaId}` : Prisma.empty;

  const [agregado, totalDemo, distribucion, tendencia, problemas, pago, canales] = await Promise.all([
    prisma.evaluacion.aggregate({
      where,
      _count: { _all: true },
      _avg: { trato: true, claridad: true, facilidad: true, rapidez: true, satisfaccion: true },
    }),
    prisma.evaluacion.count({ where: { ...where, esDemo: true } }),
    prisma.evaluacion.groupBy({ by: ["satisfaccion"], where, _count: { _all: true } }),
    prisma.$queryRaw<{ mes: Date; total: number; satisfaccion: number | null }[]>`
      SELECT date_trunc('month', "createdAt") AS mes,
             count(*)::int AS total,
             avg("satisfaccion")::float AS satisfaccion
      FROM "Evaluacion"
      WHERE "createdAt" >= date_trunc('month', now()) - make_interval(months => ${MESES_TENDENCIA - 1}) ${filtroSql}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ problema: string; total: number }[]>`
      SELECT p::text AS problema, count(*)::int AS total
      FROM "Evaluacion", unnest("problemas") AS p
      WHERE true ${filtroSql}
      GROUP BY 1`,
    prisma.evaluacion.groupBy({ by: ["pagoIndebido"], where, _count: { _all: true } }),
    prisma.evaluacion.groupBy({ by: ["canal"], where: { ...where, canal: { not: null } }, _count: { _all: true } }),
  ]);

  const total = agregado._count._all;
  const dist: Distribucion = [0, 0, 0, 0, 0];
  for (const fila of distribucion) if (fila.satisfaccion >= 1 && fila.satisfaccion <= 5) dist[fila.satisfaccion - 1] = fila._count._all;

  // Meses completos aunque alguno no tenga evaluaciones.
  const porMes = new Map(tendencia.map((t) => [t.mes.toISOString().slice(0, 7), t]));
  const hoy = new Date();
  const puntos: PuntoTendencia[] = [];
  for (let i = MESES_TENDENCIA - 1; i >= 0; i--) {
    const fecha = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i, 1));
    const clave = fecha.toISOString().slice(0, 7);
    const fila = porMes.get(clave);
    const etiqueta = formatoMes.format(fecha).replace(".", "");
    puntos.push({
      mes: clave,
      etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1),
      total: fila?.total ?? 0,
      satisfaccion: fila && fila.total >= MIN_MUESTRA ? fila.satisfaccion : null,
    });
  }

  const conteoProblemas = new Map(problemas.map((p) => [p.problema, p.total]));
  // Quien respondió la pregunta tiene al menos un elemento en el arreglo (puede ser NINGUNO).
  const respondieronProblemas = await prisma.evaluacion.count({ where: { ...where, NOT: { problemas: { isEmpty: true } } } });
  const listaProblemas = PROBLEMAS.map((p) => {
    const n = conteoProblemas.get(p.valor) ?? 0;
    return { clave: p.valor, etiqueta: p.etiqueta, total: n, proporcion: respondieronProblemas ? n / respondieronProblemas : 0 };
  })
    // El catálogo incluye problemas presenciales, en línea y por teléfono: sólo se listan los que alguien marcó.
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total);

  const si = pago.find((p) => p.pagoIndebido === true)?._count._all ?? 0;
  const no = pago.find((p) => p.pagoIndebido === false)?._count._all ?? 0;
  const respondieronPago = si + no;

  const totalCanales = canales.reduce((a, c) => a + c._count._all, 0);
  const listaCanales = canales
    .map((c) => ({
      clave: c.canal ?? "",
      etiqueta: ETIQUETA_CANAL[c.canal ?? ""] ?? "—",
      total: c._count._all,
      proporcion: totalCanales ? c._count._all / totalCanales : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const suficiente = total >= MIN_MUESTRA;
  return {
    total,
    totalDemo,
    promedios: suficiente ? { ...vacio(), ...agregado._avg } : vacio(),
    distribucion: dist,
    satisfechos: suficiente ? satisfechosDe(dist) : null,
    tendencia: puntos,
    problemas: listaProblemas,
    respondieronProblemas,
    pagoIndebido: respondieronPago >= MIN_MUESTRA ? si / respondieronPago : null,
    respondieronPago,
    canales: listaCanales,
  };
}

export type ResumenTramite = { id: string; nombre: string; total: number; satisfaccion: number | null; promedios: Promedios };

/** Indicadores por trámite de una dependencia, ordenados del mejor al peor evaluado. */
export async function resumenPorTramite(dependenciaId: string): Promise<ResumenTramite[]> {
  const [tramites, promedios] = await Promise.all([
    prisma.tramite.findMany({
      where: { dependenciaId, activo: true },
      orderBy: { orden: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.evaluacion.groupBy({
      by: ["tramiteId"],
      where: { dependenciaId },
      _count: { _all: true },
      _avg: { trato: true, claridad: true, facilidad: true, rapidez: true, satisfaccion: true },
    }),
  ]);
  const porId = new Map(promedios.map((p) => [p.tramiteId, p]));
  return tramites
    .map((t) => {
      const p = porId.get(t.id);
      const total = p?._count._all ?? 0;
      const ok = total >= MIN_MUESTRA && p;
      return {
        ...t,
        total,
        satisfaccion: ok ? p._avg.satisfaccion : null,
        promedios: ok ? { ...vacio(), ...p._avg } : vacio(),
      };
    })
    .sort((a, b) => (b.satisfaccion ?? -1) - (a.satisfaccion ?? -1));
}

export async function obtenerDependenciaPorSlug(slug: string) {
  return prisma.dependencia.findFirst({
    where: { slug, activa: true },
    select: { id: true, slug: true, nombre: true, nombreCorto: true, descripcion: true },
  });
}

export { DIMENSIONES };
