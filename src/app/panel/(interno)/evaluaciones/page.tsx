import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { alcance, requerirUsuario } from "@/lib/auth/sesion";
import { POR_PAGINA, listarEvaluaciones, type FiltrosEvaluaciones } from "@/lib/consultas/panel";
import { DIMENSIONES, PROBLEMAS } from "@/lib/constantes";
import { colorCalificacion } from "@/lib/escala";
import { prisma } from "@/lib/prisma";
import { cn, formatearEntero } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Evaluaciones" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" });
const PROBLEMA = new Map<string, string>(PROBLEMAS.map((p) => [p.valor, p.etiqueta]));
const CANAL: Record<string, string> = { PRESENCIAL: "Presencial", EN_LINEA: "En línea", TELEFONICO: "Teléfono" };
const ESTADO: Record<string, { t: string; c: string }> = {
  PENDIENTE: { t: "Por revisar", c: "bg-orange-soft text-orange-ink" },
  APROBADO: { t: "Aprobado", c: "bg-[#0f6538]/10 text-[#0f6538]" },
  RECHAZADO: { t: "Rechazado", c: "bg-muted text-muted-foreground" },
};

const texto = (v: unknown) => (typeof v === "string" && v.length < 100 ? v : undefined);

export default async function EvaluacionesPanel({ searchParams }: PageProps<"/panel/evaluaciones">) {
  const usuario = await requerirUsuario();
  const sp = await searchParams;
  const filtroUsuario = alcance(usuario);
  const esAdmin = usuario.rol === "ADMINISTRADOR";

  const calificacion = texto(sp.calificacion);
  const filtros: FiltrosEvaluaciones = {
    dependenciaId: esAdmin ? texto(sp.dependencia) : undefined,
    tramiteId: texto(sp.tramite),
    calificacion: calificacion === "mal" || calificacion === "regular" || calificacion === "bien" ? calificacion : undefined,
    comentario: sp.comentario === "1",
    folio: texto(sp.folio)?.trim().toUpperCase().slice(0, 40) || undefined,
    pagina: Math.max(1, Number.parseInt(texto(sp.pagina) ?? "1", 10) || 1),
  };

  const [dependencias, tramites, { total, filas }] = await Promise.all([
    esAdmin ? prisma.dependencia.findMany({ where: { activa: true }, orderBy: { orden: "asc" }, select: { id: true, nombreCorto: true } }) : [],
    prisma.tramite.findMany({
      where: { activo: true, ...(filtroUsuario.dependenciaId ? { dependenciaId: filtroUsuario.dependenciaId } : filtros.dependenciaId ? { dependenciaId: filtros.dependenciaId } : {}) },
      orderBy: [{ dependenciaId: "asc" }, { orden: "asc" }],
      select: { id: true, nombre: true },
    }),
    listarEvaluaciones(filtroUsuario, filtros),
  ]);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const enlace = (pagina: number) => {
    const p = new URLSearchParams();
    if (filtros.dependenciaId) p.set("dependencia", filtros.dependenciaId);
    if (filtros.tramiteId) p.set("tramite", filtros.tramiteId);
    if (filtros.calificacion) p.set("calificacion", filtros.calificacion);
    if (filtros.comentario) p.set("comentario", "1");
    if (filtros.folio) p.set("folio", filtros.folio);
    p.set("pagina", String(pagina));
    return `/panel/evaluaciones?${p.toString()}`;
  };
  const selectClase = "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-navy outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header>
        <h1 className="text-4xl font-semibold text-navy">Evaluaciones</h1>
        <p className="mt-2 text-muted-foreground">
          Respuestas individuales con el folio del trámite para verificarlas. {esAdmin ? "Todas las dependencias." : `Sólo ${usuario.dependencia?.nombreCorto}.`}
        </p>
      </header>

      <form method="get" className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-card p-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
        {esAdmin && (
          <label className="space-y-1.5 text-sm font-medium text-navy">
            Dependencia
            <select name="dependencia" defaultValue={filtros.dependenciaId ?? ""} className={selectClase}>
              <option value="">Todas</option>
              {dependencias.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombreCorto}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="space-y-1.5 text-sm font-medium text-navy">
          Trámite
          <select name="tramite" defaultValue={filtros.tramiteId ?? ""} className={selectClase}>
            <option value="">Todos</option>
            {tramites.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre.length > 60 ? `${t.nombre.slice(0, 58)}…` : t.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-navy">
          Satisfacción general
          <select name="calificacion" defaultValue={filtros.calificacion ?? ""} className={selectClase}>
            <option value="">Cualquiera</option>
            <option value="mal">1–2 estrellas (mal)</option>
            <option value="regular">3 estrellas (regular)</option>
            <option value="bien">4–5 estrellas (bien)</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-navy">
          Folio
          <input
            type="search"
            name="folio"
            defaultValue={filtros.folio ?? ""}
            maxLength={40}
            placeholder="Buscar folio"
            autoComplete="off"
            className={cn(selectClase, "font-mono uppercase")}
          />
        </label>
        <label className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-input bg-card px-3 text-sm font-medium text-navy">
          <input type="checkbox" name="comentario" value="1" defaultChecked={filtros.comentario} className="size-4 accent-[var(--brand-teal-ink)]" />
          Sólo con comentario
        </label>
        <Button type="submit" className="h-11 rounded-full">
          <Filter aria-hidden="true" /> Filtrar
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        {formatearEntero(total)} {total === 1 ? "evaluación" : "evaluaciones"} · página {filtros.pagina} de {paginas}
      </p>

      <ul className="space-y-3">
        {filas.map((e) => (
          <li key={e.id} className="rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {fecha.format(e.createdAt)} · {e.dependencia.nombreCorto} · Folio{" "}
                  <span className="font-mono font-semibold text-navy">{e.folio}</span>
                  {e.canal ? ` · ${CANAL[e.canal]}` : ""}
                </p>
                <p className="mt-1 font-semibold leading-snug text-navy">{e.tramite.nombre}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {e.esDemo && <Badge variant="demo">Demo</Badge>}
                {e.pagoIndebido && <Badge className="border-transparent bg-[#b8283a] text-white">Reportó pago no oficial</Badge>}
              </div>
            </div>
            <dl className="mt-3 flex flex-wrap gap-2">
              {DIMENSIONES.map((d) => {
                const v = e[d.clave];
                const c = colorCalificacion(v);
                return (
                  <div key={d.clave} className="flex items-center gap-2 rounded-full bg-muted/60 py-1 pl-3 pr-1 text-xs">
                    <dt className="text-muted-foreground">{d.titulo.split(" ")[0]}</dt>
                    <dd className="tabular flex size-6 items-center justify-center rounded-full font-bold" style={{ background: c.fondo, color: c.texto }}>
                      {v}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {e.problemas.length > 0 && !e.problemas.includes("NINGUNO") && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {e.problemas.map((p) => (
                  <li key={p} className="rounded-full border px-2.5 py-0.5 text-xs text-navy">
                    {PROBLEMA.get(p) ?? p}
                  </li>
                ))}
              </ul>
            )}
            {e.comentario && (
              <div className="mt-3 flex items-start gap-3 rounded-xl bg-background p-3">
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", ESTADO[e.estadoComentario]?.c)}>
                  {ESTADO[e.estadoComentario]?.t}
                </span>
                <p className="text-sm leading-relaxed text-navy">“{e.comentario}”</p>
              </div>
            )}
          </li>
        ))}
        {filas.length === 0 && (
          <li className="rounded-[1.5rem] border border-dashed bg-card p-10 text-center text-muted-foreground">No hay evaluaciones con esos filtros.</li>
        )}
      </ul>

      {paginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-between">
          <Button asChild variant="outline" className="rounded-full" aria-disabled={filtros.pagina <= 1}>
            <Link href={enlace(Math.max(1, filtros.pagina - 1))} className={cn(filtros.pagina <= 1 && "pointer-events-none opacity-50")}>
              <ChevronLeft aria-hidden="true" /> Anterior
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={enlace(Math.min(paginas, filtros.pagina + 1))} className={cn(filtros.pagina >= paginas && "pointer-events-none opacity-50")}>
              Siguiente <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      )}
    </div>
  );
}
