/**
 * Carga inicial de H-TEOYE.
 *
 * - Dependencias: se crean/actualizan por slug (idempotente).
 * - Trámites: catálogo oficial de prisma/catalogo/tramites.json mediante el importador
 *   idempotente (el mismo que usa `npm run db:catalogo`).
 * - Datos demostrativos: evaluaciones marcadas con esDemo = true. Sólo se generan si la base
 *   no tiene ninguna; nunca se borran evaluaciones. Desactívalos con SEED_DEMO=false.
 * - Cuentas del panel (sólo demostración): se crean si no existen, con la contraseña de SEED_PASSWORD
 *   (ver .env.example). Nunca se sobrescribe una cuenta existente.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Canal, EstadoAccion, EstadoComentario, Problema, Rol } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEPENDENCIAS } from "./catalogo/dependencias";
import { importarCatalogo } from "./catalogo/importar";
import { PROBLEMAS_POR_CANAL } from "../src/lib/constantes";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
/** Generador pseudoaleatorio determinista (mulberry32) para que el demo sea reproducible. */
function prng(semilla: number) {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMENTARIOS_DEMO = [
  "Comentario de demostración: el personal fue amable y resolvió mis dudas.",
  "Comentario de demostración: la fila fue larga, pero el trámite salió el mismo día.",
  "Comentario de demostración: no quedaba claro qué documentos debía llevar.",
  "Comentario de demostración: sería útil poder hacer este trámite en línea.",
  "Comentario de demostración: buena atención, instalaciones limpias.",
  "Comentario de demostración: tuve que regresar dos veces por falta de información.",
];

/** Problemas de demostración según la modalidad, igual que en la encuesta (sin «Otro»). */
function elegirProblemas(azar: () => number, base: number, canal: Canal): Problema[] {
  const r = azar();
  if (r < 0.2) return []; // sin respuesta
  if (r < 0.2 + Math.max(0.1, (base - 2.5) * 0.25)) return [Problema.NINGUNO];
  const opciones = PROBLEMAS_POR_CANAL[canal].map((p) => p.valor).filter((v) => v !== "OTRO") as Problema[];
  return opciones.filter(() => azar() < 0.28).slice(0, 3);
}

/** Cuentas de demostración del panel institucional (dominio .example: no son correos reales). */
const USUARIOS_DEMO = [
  { email: "coordinacion@hteoye.example", nombre: "Mariana Coordinación", rol: Rol.ADMINISTRADOR, dependencia: null },
  { email: "responsable.agua@hteoye.example", nombre: "Jorge Responsable Agua", rol: Rol.RESPONSABLE, dependencia: "agua-de-hermosillo" },
  { email: "enlace.agua@hteoye.example", nombre: "Lucía Enlace Agua", rol: Rol.ENLACE, dependencia: "agua-de-hermosillo" },
  { email: "responsable.transito@hteoye.example", nombre: "Ramón Responsable Tránsito", rol: Rol.RESPONSABLE, dependencia: "seguridad-publica-transito" },
  { email: "responsable.tesoreria@hteoye.example", nombre: "Elena Responsable Tesorería", rol: Rol.RESPONSABLE, dependencia: "tesoreria-municipal" },
] as const;

async function sembrarPanel() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 10) {
    console.log("· Cuentas del panel: omitidas (define SEED_PASSWORD con 10+ caracteres; ver .env.example)");
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const ids: Record<string, string> = {};
  let creadas = 0;
  for (const u of USUARIOS_DEMO) {
    const dep = u.dependencia ? await prisma.dependencia.findUnique({ where: { slug: u.dependencia }, select: { id: true } }) : null;
    const existente = await prisma.usuario.findUnique({ where: { email: u.email }, select: { id: true } });
    if (existente) {
      ids[u.email] = existente.id;
      continue;
    }
    const nuevo = await prisma.usuario.create({
      data: { email: u.email, nombre: u.nombre, rol: u.rol, passwordHash: hash, dependenciaId: dep?.id ?? null },
      select: { id: true },
    });
    ids[u.email] = nuevo.id;
    creadas++;
  }

  // Acciones de mejora de ejemplo: sólo si aún no hay ninguna.
  let acciones = 0;
  if ((await prisma.accionMejora.count()) === 0) {
    const deps = Object.fromEntries(
      (await prisma.dependencia.findMany({ select: { id: true, slug: true } })).map((d) => [d.slug, d.id]),
    );
    const primerTramite = async (slug: string) =>
      (await prisma.tramite.findFirst({ where: { dependenciaId: deps[slug], activo: true }, orderBy: { orden: "asc" }, select: { id: true } }))?.id ?? null;
    const dias = (n: number) => new Date(Date.now() + n * 86_400_000);
    const coord = ids["coordinacion@hteoye.example"];
    const respAgua = ids["responsable.agua@hteoye.example"];
    const enlaceAgua = ids["enlace.agua@hteoye.example"];
    const respTransito = ids["responsable.transito@hteoye.example"];
    const respTesoreria = ids["responsable.tesoreria@hteoye.example"];
    const datos = [
      {
        dependenciaId: deps["agua-de-hermosillo"], tramiteId: await primerTramite("agua-de-hermosillo"),
        titulo: "Requisitos visibles en ventanilla y en línea",
        descripcion: "Colocar carteles con la lista de requisitos en cada ventanilla y publicar la misma lista en el portal de trámites, para reducir las visitas repetidas.",
        estado: EstadoAccion.EN_PROCESO, creadoPorId: enlaceAgua, validada: true, validadaPorId: respAgua, publicada: true, fechaCompromiso: dias(45),
      },
      {
        dependenciaId: deps["agua-de-hermosillo"], tramiteId: null,
        titulo: "Turnos por mensaje para reducir filas",
        descripcion: "Probar un sistema de turnos que avise por mensaje cuando se acerque el turno, en la oficina con más espera.",
        estado: EstadoAccion.PENDIENTE, creadoPorId: enlaceAgua, validada: false, validadaPorId: null, publicada: false, fechaCompromiso: dias(90),
      },
      {
        dependenciaId: deps["seguridad-publica-transito"], tramiteId: await primerTramite("seguridad-publica-transito"),
        titulo: "Pago de infracciones en línea sin intermediarios",
        descripcion: "Habilitar el pago en línea con referencia única y difundir que ningún agente puede cobrar en efectivo.",
        estado: EstadoAccion.EN_REVISION, creadoPorId: respTransito, validada: true, validadaPorId: coord, publicada: true, fechaCompromiso: dias(60),
      },
      {
        dependenciaId: deps["tesoreria-municipal"], tramiteId: await primerTramite("tesoreria-municipal"),
        titulo: "Horario extendido en temporada de predial",
        descripcion: "Abrir las cajas hasta las 18:00 en enero y febrero, cuando se concentran los pagos de predial.",
        estado: EstadoAccion.CONCLUIDA, creadoPorId: coord, validada: true, validadaPorId: respTesoreria, publicada: true, fechaCompromiso: dias(-20),
      },
    ];
    for (const a of datos) {
      if (!a.dependenciaId || !a.creadoPorId) continue;
      await prisma.accionMejora.create({
        data: {
          ...a,
          validadaEn: a.validada ? new Date() : null,
          publicadaEn: a.publicada ? new Date() : null,
          esDemo: true,
        },
      });
      acciones++;
    }
  }
  console.log(`✔ Panel: ${creadas} cuentas nuevas · ${acciones} acciones de ejemplo`);
}

async function main() {
  const sembrarDemo = process.env.SEED_DEMO !== "false";

  for (const [i, dep] of DEPENDENCIAS.entries()) {
    await prisma.dependencia.upsert({
      where: { slug: dep.slug },
      update: { nombre: dep.nombre, nombreCorto: dep.nombreCorto, descripcion: dep.descripcion, orden: i + 1 },
      create: { ...dep, orden: i + 1 },
    });
  }

  const catalogo = await importarCatalogo(prisma);

  // Datos demostrativos: sólo si todavía no existen (nunca se borran evaluaciones).
  const demoExistentes = await prisma.evaluacion.count({ where: { esDemo: true } });

  let creados = 0;
  if (sembrarDemo && demoExistentes === 0) {
    const azar = prng(20261111);
    const tramites = await prisma.tramite.findMany({ where: { activo: true }, include: { dependencia: true } });
    // Sesgo por dependencia para que el tablero muestre diferencias plausibles.
    const sesgo: Record<string, number> = {
      "tesoreria-municipal": 0.4,
      "agua-de-hermosillo": -0.3,
      "ordenamiento-y-desarrollo-urbano": -0.1,
      "seguridad-publica-transito": -0.5,
      "dif-hermosillo": 0.6,
    };
    const canales = [Canal.PRESENCIAL, Canal.PRESENCIAL, Canal.PRESENCIAL, Canal.EN_LINEA, Canal.TELEFONICO];
    const estados = [EstadoComentario.PENDIENTE, EstadoComentario.APROBADO, EstadoComentario.APROBADO, EstadoComentario.RECHAZADO];
    const ahora = Date.now();
    const filas = [];

    for (const t of tramites) {
      const n = 14 + Math.floor(azar() * 18);
      const base = 3.4 + (sesgo[t.dependencia.slug] ?? 0) + (azar() - 0.5) * 0.6;
      const estrella = (ajuste = 0) =>
        Math.min(5, Math.max(1, Math.round(base + ajuste + (azar() - 0.5) * 2.4)));
      for (let k = 0; k < n; k++) {
        const conComentario = azar() < 0.28;
        const canal = canales[Math.floor(azar() * canales.length)];
        filas.push({
          tramiteId: t.id,
          dependenciaId: t.dependenciaId,
          // Folio ficticio y reconocible como demostrativo (único en todo el conjunto).
          folio: `DEMO-2026-${String(filas.length + 1).padStart(6, "0")}`,
          trato: estrella(0.3),
          claridad: estrella(-0.2),
          facilidad: estrella(-0.4),
          rapidez: estrella(-0.5),
          satisfaccion: estrella(),
          canal,
          problemas: elegirProblemas(azar, base, canal),
          pagoIndebido: azar() < 0.3 ? null : azar() < (t.dependencia.slug === "seguridad-publica-transito" ? 0.08 : 0.02),
          comentario: conComentario ? COMENTARIOS_DEMO[Math.floor(azar() * COMENTARIOS_DEMO.length)] : null,
          estadoComentario: conComentario
            ? estados[Math.floor(azar() * estados.length)]
            : EstadoComentario.SIN_COMENTARIO,
          esDemo: true,
          createdAt: new Date(ahora - Math.floor(azar() * 180) * 86_400_000 - Math.floor(azar() * 36_000_000)),
        });
      }
    }
    const r = await prisma.evaluacion.createMany({ data: filas });
    creados = r.count;
  }

  await sembrarPanel();

  const t = catalogo.totales;
  console.log(
    `✔ Dependencias: ${DEPENDENCIAS.length} · Catálogo: ${t.creado} creados, ${t.asignado} asignados, ` +
      `${t.actualizado} actualizados, ${t["sin cambios"]} sin cambios · ` +
      `Evaluaciones demo: ${creados ? `+${creados}` : `${demoExistentes} existentes (sin cambios)`}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
