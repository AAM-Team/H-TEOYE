import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Consultas del portal público.
 * Regla: aquí sólo se exponen catálogos y AGREGADOS. Nunca se devuelven
 * evaluaciones individuales ni comentarios sin moderar.
 */

export async function obtenerResumenGeneral() {
  const [agregado, totalDemo, dependencias] = await Promise.all([
    prisma.evaluacion.aggregate({ _count: { _all: true }, _avg: { satisfaccion: true } }),
    prisma.evaluacion.count({ where: { esDemo: true } }),
    prisma.dependencia.count({ where: { activa: true } }),
  ]);
  return {
    total: agregado._count._all,
    totalDemo,
    promedioSatisfaccion: agregado._avg.satisfaccion,
    dependencias,
  };
}

export async function hayDatosDemo() {
  return (await prisma.evaluacion.count({ where: { esDemo: true }, take: 1 })) > 0;
}

export async function listarDependencias() {
  const [dependencias, conteos] = await Promise.all([
    prisma.dependencia.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        slug: true,
        nombre: true,
        nombreCorto: true,
        descripcion: true,
        _count: { select: { tramites: { where: { activo: true } } } },
      },
    }),
    prisma.evaluacion.groupBy({ by: ["dependenciaId"], _count: { _all: true } }),
  ]);
  const porDependencia = new Map(conteos.map((c) => [c.dependenciaId, c._count._all]));
  return dependencias.map((d) => ({
    ...d,
    tramites: d._count.tramites,
    evaluaciones: porDependencia.get(d.id) ?? 0,
  }));
}

export async function obtenerDependenciaConTramites(slug: string) {
  return prisma.dependencia.findFirst({
    where: { slug, activa: true },
    select: {
      id: true,
      slug: true,
      nombre: true,
      nombreCorto: true,
      descripcion: true,
      tramites: {
        where: { activo: true },
        orderBy: { orden: "asc" },
        select: { id: true, nombre: true, descripcion: true, porDefinir: true, modalidad: true },
      },
    },
  });
}

export async function obtenerTramiteParaEvaluar(id: string) {
  return prisma.tramite.findFirst({
    where: { id, activo: true, dependencia: { activa: true } },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      porDefinir: true,
      modalidad: true,
      dependencia: { select: { slug: true, nombre: true, nombreCorto: true } },
    },
  });
}

/** Acciones de mejora PUBLICADAS (validadas por otra persona). Nunca muestra borradores ni quién las registró. */
export async function listarAccionesPublicadas(dependenciaId?: string) {
  return prisma.accionMejora.findMany({
    where: { publicada: true, validada: true, ...(dependenciaId ? { dependenciaId } : {}) },
    orderBy: [{ publicadaEn: "desc" }],
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      estado: true,
      fechaCompromiso: true,
      publicadaEn: true,
      esDemo: true,
      dependencia: { select: { nombreCorto: true, slug: true } },
      tramite: { select: { nombre: true } },
    },
  });
}
