/**
 * Importa prisma/catalogo/tramites.json a la base de datos y verifica el resultado.
 * Uso: npm run db:catalogo
 *
 * No toca evaluaciones. Puede ejecutarse cuantas veces se quiera (idempotente).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { importarCatalogo, leerCatalogo, TRAMITES_POR_DEPENDENCIA } from "./catalogo/importar";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const ETIQUETA_MODALIDAD = { VENTANILLA: "ventanilla", EN_LINEA: "en línea", CON_FORMATO: "con formato" } as const;
const corto = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

async function evaluacionesPorTramite() {
  const g = await prisma.evaluacion.groupBy({ by: ["tramiteId"], _count: { _all: true } });
  return new Map(g.map((x) => [x.tramiteId, x._count._all]));
}

async function main() {
  const catalogo = leerCatalogo();
  const totalAntes = await prisma.evaluacion.count();
  const porTramiteAntes = await evaluacionesPorTramite();

  const r = await importarCatalogo(prisma, catalogo);

  const totalDespues = await prisma.evaluacion.count();
  const porTramiteDespues = await evaluacionesPorTramite();

  console.log("\nImportación del catálogo de trámites\n");
  let depActual = "";
  for (const f of r.filas) {
    if (f.dependencia !== depActual) {
      depActual = f.dependencia;
      console.log(`■ ${depActual}`);
    }
    const evals = porTramiteDespues.get(f.tramiteId) ?? 0;
    console.log(
      `  ${f.orden}. ${corto(f.nombre, 62).padEnd(62)}  ${ETIQUETA_MODALIDAD[f.modalidad].padEnd(11)}  ` +
        `${String(evals).padStart(3)} eval.  ${f.accion}`,
    );
  }
  if (r.desactivados.length) {
    console.log("\nDesactivados (fuera del catálogo; se conservan con sus evaluaciones):");
    for (const d of r.desactivados) console.log(`  - ${d.dependencia}: ${d.nombre}`);
  }

  const t = r.totales;
  console.log(
    `\nResumen: ${t.creado} creados · ${t.asignado} asignados a espacios existentes · ${t.actualizado} actualizados · ` +
      `${t["sin cambios"]} sin cambios · ${t.desactivados} desactivados`,
  );

  // Verificaciones
  const errores: string[] = [];
  const deps = await prisma.dependencia.findMany({
    orderBy: { orden: "asc" },
    select: { slug: true, tramites: { where: { activo: true }, select: { clave: true, nombre: true } } },
  });
  for (const d of deps) {
    if (d.tramites.length !== TRAMITES_POR_DEPENDENCIA)
      errores.push(`${d.slug} tiene ${d.tramites.length} trámites activos (se esperaban ${TRAMITES_POR_DEPENDENCIA})`);
    const nombres = new Set(d.tramites.map((x) => x.nombre.toLowerCase()));
    if (nombres.size !== d.tramites.length) errores.push(`${d.slug} tiene nombres de trámite duplicados`);
    if (d.tramites.some((x) => !x.clave)) errores.push(`${d.slug} tiene trámites activos sin clave de catálogo`);
  }
  const clavesDuplicadas = await prisma.tramite.groupBy({
    by: ["clave"],
    where: { clave: { not: null } },
    having: { clave: { _count: { gt: 1 } } },
  });
  if (clavesDuplicadas.length) errores.push(`Claves duplicadas: ${clavesDuplicadas.map((c) => c.clave).join(", ")}`);
  const porDefinir = await prisma.tramite.count({ where: { activo: true, porDefinir: true } });
  if (porDefinir) errores.push(`Quedan ${porDefinir} trámites «por definir» activos`);
  if (totalAntes !== totalDespues) errores.push(`Cambió el total de evaluaciones: ${totalAntes} → ${totalDespues}`);
  const vinculosAlterados = [...porTramiteAntes].filter(([id, n]) => porTramiteDespues.get(id) !== n);
  if (vinculosAlterados.length) errores.push(`Cambiaron las evaluaciones de ${vinculosAlterados.length} trámites`);

  console.log("\nVerificaciones:");
  for (const d of deps) console.log(`  ${d.tramites.length === TRAMITES_POR_DEPENDENCIA ? "✔" : "✘"} ${d.slug}: ${d.tramites.length} trámites activos`);
  console.log(`  ${clavesDuplicadas.length ? "✘" : "✔"} Sin claves duplicadas`);
  console.log(`  ${porDefinir ? "✘" : "✔"} Sin trámites «por definir» activos`);
  console.log(`  ${totalAntes === totalDespues ? "✔" : "✘"} Evaluaciones intactas: ${totalAntes} antes → ${totalDespues} después`);
  console.log(`  ${vinculosAlterados.length ? "✘" : "✔"} Cada trámite conserva sus evaluaciones (${porTramiteAntes.size} trámites comparados)`);

  if (errores.length) {
    console.error("\n✘ La importación terminó con observaciones:\n - " + errores.join("\n - "));
    process.exitCode = 1;
  } else {
    console.log("\n✔ Catálogo importado correctamente.");
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
