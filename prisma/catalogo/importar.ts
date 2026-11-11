/**
 * Importador idempotente del catálogo oficial de trámites (prisma/catalogo/tramites.json).
 *
 * Garantías:
 * - Nunca borra trámites ni evaluaciones. Conserva el id interno de cada trámite, así que
 *   todas sus evaluaciones y acciones de mejora siguen vinculadas.
 * - Empareja por `clave` (el "id" del catálogo). Si un trámite aún no tiene clave, ocupa el
 *   espacio «por definir» de la misma posición (orden) en su dependencia.
 * - Sólo escribe cuando algo cambió: ejecutarlo dos veces seguidas no produce cambios.
 * - Un trámite que deja de aparecer en el catálogo se desactiva (activo = false), no se borra.
 * - Todo ocurre en una transacción: o se aplica el catálogo completo, o nada.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { Modalidad, type PrismaClient } from "@prisma/client";

export const TRAMITES_POR_DEPENDENCIA = 5;

/** Identificadores del archivo verificado que difieren del slug usado en la base de datos. */
const ALIAS_DEPENDENCIA: Record<string, string> = {
  "ordenamiento-desarrollo-urbano": "ordenamiento-y-desarrollo-urbano",
};

const MODALIDADES = { ventanilla: Modalidad.VENTANILLA, en_linea: Modalidad.EN_LINEA, con_formato: Modalidad.CON_FORMATO };

const claveValida = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones");

const catalogoSchema = z
  .object({
    dependencias: z.array(
      z.object({
        id: claveValida,
        nombre: z.string().min(1),
        tramites: z
          .array(
            z.object({
              id: claveValida,
              nombre: z.string().trim().min(3),
              modalidad: z.enum(["ventanilla", "en_linea", "con_formato"]),
            }),
          )
          .length(TRAMITES_POR_DEPENDENCIA, `Cada dependencia debe tener ${TRAMITES_POR_DEPENDENCIA} trámites`),
      }),
    ),
  })
  .superRefine((c, ctx) => {
    const vistos = new Set<string>();
    for (const d of c.dependencias)
      for (const t of d.tramites) {
        if (vistos.has(t.id)) ctx.addIssue({ code: "custom", message: `Identificador de trámite repetido: ${t.id}` });
        vistos.add(t.id);
      }
  });

export type Catalogo = z.infer<typeof catalogoSchema>;

export function leerCatalogo(ruta = join(__dirname, "tramites.json")): Catalogo {
  const r = catalogoSchema.safeParse(JSON.parse(readFileSync(ruta, "utf8")));
  if (!r.success) {
    throw new Error("El catálogo no es válido:\n" + r.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n"));
  }
  return r.data;
}

export type Accion = "creado" | "asignado" | "actualizado" | "sin cambios";

export type ResultadoImportacion = {
  filas: { dependencia: string; orden: number; clave: string; nombre: string; modalidad: Modalidad; accion: Accion; tramiteId: string }[];
  desactivados: { dependencia: string; tramiteId: string; nombre: string }[];
  totales: Record<Accion, number> & { desactivados: number };
};

export async function importarCatalogo(prisma: PrismaClient, catalogo: Catalogo = leerCatalogo()): Promise<ResultadoImportacion> {
  return prisma.$transaction(async (tx) => {
    const resultado: ResultadoImportacion = {
      filas: [],
      desactivados: [],
      totales: { creado: 0, asignado: 0, actualizado: 0, "sin cambios": 0, desactivados: 0 },
    };

    for (const depCat of catalogo.dependencias) {
      const slug = ALIAS_DEPENDENCIA[depCat.id] ?? depCat.id;
      const dep = await tx.dependencia.findUnique({ where: { slug }, include: { tramites: true } });
      if (!dep) throw new Error(`No existe la dependencia «${slug}». Ejecuta primero: npm run db:seed`);

      // Una clave del catálogo no puede pertenecer a otra dependencia.
      const ajenas = await tx.tramite.findMany({
        where: { clave: { in: depCat.tramites.map((t) => t.id) }, dependenciaId: { not: dep.id } },
        select: { clave: true },
      });
      if (ajenas.length) throw new Error(`Claves ya usadas en otra dependencia: ${ajenas.map((a) => a.clave).join(", ")}`);

      // 1. Planear: emparejar cada entrada con un trámite existente.
      const usados = new Set<string>();
      const plan = depCat.tramites.map((entrada, i) => {
        const orden = i + 1;
        const existente =
          dep.tramites.find((t) => t.clave === entrada.id) ??
          dep.tramites.find((t) => t.clave === null && t.orden === orden && !usados.has(t.id));
        if (existente) usados.add(existente.id);
        return { entrada, orden, existente };
      });
      const sobrantes = dep.tramites.filter((t) => !usados.has(t.id));

      // 2. Liberar posiciones sólo de los trámites que cambian de orden (evita choques con el índice único).
      const aMover = [
        ...plan.filter((p) => p.existente && p.existente.orden !== p.orden).map((p) => p.existente!.id),
        ...sobrantes.filter((t) => t.activo || t.orden <= TRAMITES_POR_DEPENDENCIA).map((t) => t.id),
      ];
      if (aMover.length) {
        await tx.tramite.updateMany({ where: { id: { in: aMover } }, data: { orden: { increment: 1000 } } });
      }

      // 3. Aplicar.
      for (const { entrada, orden, existente } of plan) {
        const modalidad = MODALIDADES[entrada.modalidad];
        let accion: Accion;
        let tramiteId: string;

        if (!existente) {
          const creado = await tx.tramite.create({
            data: { clave: entrada.id, nombre: entrada.nombre, modalidad, orden, dependenciaId: dep.id },
          });
          accion = "creado";
          tramiteId = creado.id;
        } else {
          tramiteId = existente.id;
          const cambios = {
            ...(existente.clave !== entrada.id && { clave: entrada.id }),
            ...(existente.nombre !== entrada.nombre && { nombre: entrada.nombre }),
            ...(existente.modalidad !== modalidad && { modalidad }),
            ...(existente.orden !== orden && { orden }),
            ...(existente.porDefinir && { porDefinir: false, descripcion: null }),
            ...(!existente.activo && { activo: true }),
          };
          if (Object.keys(cambios).length === 0) {
            accion = "sin cambios";
          } else {
            await tx.tramite.update({ where: { id: existente.id }, data: cambios });
            accion = existente.clave === null ? "asignado" : "actualizado";
          }
        }
        resultado.totales[accion]++;
        resultado.filas.push({ dependencia: slug, orden, clave: entrada.id, nombre: entrada.nombre, modalidad, accion, tramiteId });
      }

      // 4. Trámites fuera del catálogo: se desactivan y se conservan con sus evaluaciones.
      const archivados = await tx.tramite.aggregate({
        where: { dependenciaId: dep.id, orden: { gte: 100, lt: 1000 } },
        _max: { orden: true },
      });
      let siguienteOrdenArchivo = Math.max(99, archivados._max.orden ?? 99) + 1;
      for (const t of sobrantes) {
        if (!t.activo && t.orden > TRAMITES_POR_DEPENDENCIA) continue; // ya estaba archivado
        await tx.tramite.update({ where: { id: t.id }, data: { activo: false, orden: siguienteOrdenArchivo++ } });
        resultado.desactivados.push({ dependencia: slug, tramiteId: t.id, nombre: t.nombre });
        resultado.totales.desactivados++;
      }
    }

    const huboCambios =
      resultado.totales.creado + resultado.totales.asignado + resultado.totales.actualizado + resultado.totales.desactivados > 0;
    if (huboCambios) {
      await tx.bitacora.create({
        data: {
          accion: "catalogo.importar",
          entidad: "Tramite",
          detalle: {
            totales: resultado.totales,
            cambios: resultado.filas
              .filter((f) => f.accion !== "sin cambios")
              .map((f) => ({ clave: f.clave, accion: f.accion, tramiteId: f.tramiteId })),
            desactivados: resultado.desactivados,
          },
        },
      });
    }
    return resultado;
  });
}
