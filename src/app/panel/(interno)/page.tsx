import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Ban,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  HandCoins,
  Lightbulb,
  Minus,
  Plus,
} from "lucide-react";
import { BarraSegmentada, BarrasAspecto, Dona, Medidor, Minigrafica, RankingBarras } from "@/components/panel/visuales";
import { BarrasFrecuencia, Distribucion, Panel } from "@/components/resultados/graficas";
import { Tendencia } from "@/components/resultados/tendencia";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { alcance, requerirUsuario } from "@/lib/auth/sesion";
import { prioridades, resumenPanel } from "@/lib/consultas/panel";
import { obtenerDetalle, resumenPorDependencia, resumenPorTramite } from "@/lib/consultas/resultados";
import { cn, formatearEntero, formatearPromedio } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tablero" };

const pct = new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 0 });
const fecha = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" });

// Paletas validadas con el script de dataviz.
// Canales: tres primeros colores de la paleta de referencia (todas las parejas pasan daltonismo y visión normal).
const COLOR_CANAL: Record<string, string> = { PRESENCIAL: "#2a78d6", EN_LINEA: "#eb6834", TELEFONICO: "#1baf7a" };
// Estados de acción: un solo tono, de claro a oscuro (ordinal).
const COLOR_ESTADO = { PENDIENTE: "#6cc2bf", EN_REVISION: "#2fa3a1", EN_PROCESO: "#00777a", CONCLUIDA: "#03474b" } as const;
// Moderación: colores de estado (siempre con ícono y texto).
const COLOR_MODERACION = { PENDIENTE: "#fab219", APROBADO: "#0ca30c", RECHAZADO: "#a3adb4" } as const;

function Cambio({ actual, previo, formato }: { actual: number | null; previo: number | null; formato: "conteo" | "promedio" }) {
  if (actual == null || previo == null || previo === 0) return null;
  const d = formato === "conteo" ? (actual - previo) / previo : actual - previo;
  const igual = Math.abs(d) < (formato === "conteo" ? 0.02 : 0.05);
  const Icono = igual ? Minus : d > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        igual ? "bg-muted text-muted-foreground" : d > 0 ? "bg-[#0f6538]/10 text-[#0f6538]" : "bg-[#b8283a]/10 text-[#b8283a]",
      )}
      title="Frente a los 30 días previos"
    >
      <Icono className="size-3.5" aria-hidden="true" />
      {igual ? "=" : formato === "conteo" ? `${d > 0 ? "+" : ""}${pct.format(d)}` : `${d > 0 ? "+" : "−"}${formatearPromedio(Math.abs(d))}`}
      <span className="sr-only"> frente a los 30 días previos</span>
    </span>
  );
}

function Indicador({
  etiqueta,
  valor,
  extra,
  href,
  children,
}: {
  etiqueta: string;
  valor: string;
  extra?: React.ReactNode;
  href?: string;
  children: React.ReactNode;
}) {
  const cuerpo = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{etiqueta}</p>
        {href && <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="tabular font-display text-4xl font-semibold tracking-[-0.03em] text-navy">{valor}</span>
        {extra}
      </div>
      <div className="mt-4">{children}</div>
    </>
  );
  const clase = "group flex flex-col rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgb(29_47_59/0.04)]";
  return href ? (
    <Link href={href} className={cn(clase, "presionable transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_12px_30px_-20px_rgb(6_38_43/0.5)]")}>
      {cuerpo}
    </Link>
  ) : (
    <div className={clase}>{cuerpo}</div>
  );
}

export default async function TableroPanel({ searchParams }: PageProps<"/panel">) {
  const usuario = await requerirUsuario();
  const sp = await searchParams;
  const filtro = alcance(usuario);
  const esAdmin = usuario.rol === "ADMINISTRADOR";

  const [resumen, lista, detalle, dependencias, tramites] = await Promise.all([
    resumenPanel(filtro),
    prioridades(filtro, esAdmin ? 4 : 3),
    obtenerDetalle(filtro.dependenciaId),
    esAdmin ? resumenPorDependencia() : Promise.resolve([]),
    !esAdmin && usuario.dependenciaId ? resumenPorTramite(usuario.dependenciaId) : Promise.resolve([]),
  ]);

  // El mes actual va incompleto: se rotula para que la barra baja no se lea como caída.
  const meses = detalle.tendencia.map((m, i, arr) => ({
    ...m,
    corta: m.etiqueta,
    etiqueta: i === arr.length - 1 ? `${m.etiqueta} (mes en curso)` : m.etiqueta,
  }));
  // La minigráfica de satisfacción muestra tendencia: su eje se ajusta al rango de los datos (medios puntos).
  const sats = meses.map((m) => m.satisfaccion).filter((v): v is number => v != null);
  const dominioSat: [number, number] = sats.length
    ? [Math.max(1, Math.floor((Math.min(...sats) - 0.25) * 2) / 2), Math.min(5, Math.ceil((Math.max(...sats) + 0.25) * 2) / 2)]
    : [1, 5];
  const filasRanking = esAdmin
    ? dependencias.map((d) => ({
        clave: d.slug,
        nombre: d.nombreCorto,
        href: `/panel/evaluaciones?dependencia=${d.id}`,
        valor: d.promedios.satisfaccion,
        total: d.total,
      }))
    : tramites.map((t) => ({ clave: t.id, nombre: t.nombre, href: `/panel/evaluaciones?tramite=${t.id}`, valor: t.satisfaccion, total: t.total }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      {sp.aviso === "sin-permiso" && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTriangle />
          <AlertTitle>No tienes permiso para esa sección</AlertTitle>
          <AlertDescription>Si lo necesitas, pide a la coordinación general que revise tu rol.</AlertDescription>
        </Alert>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground first-letter:uppercase">{fecha.format(new Date())}</p>
          <h1 className="mt-1 text-4xl font-semibold text-navy">Hola, {usuario.nombre.split(" ")[0]}.</h1>
          <span className="mt-2 inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-ink">
            {esAdmin ? "Las cinco dependencias" : usuario.dependencia?.nombre}
          </span>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/panel/acciones/nueva">
            <Plus aria-hidden="true" /> Nueva acción de mejora
          </Link>
        </Button>
      </header>

      {/* Indicadores: cifra + su gráfica */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta="Evaluaciones · 30 días"
          valor={formatearEntero(resumen.recientes)}
          extra={<Cambio actual={resumen.recientes} previo={resumen.previas} formato="conteo" />}
        >
          <Minigrafica
            tipo="barras"
            parcialUltimo
            datos={meses.map((m) => ({ etiqueta: m.etiqueta, corta: m.corta, valor: m.total }))}
            formato={(v) => `${formatearEntero(v)} evaluaciones`}
          />
        </Indicador>
        <Indicador
          etiqueta="Satisfacción · 30 días"
          valor={formatearPromedio(resumen.satisfaccion30)}
          extra={<Cambio actual={resumen.satisfaccion30} previo={resumen.satisfaccionPrevia} formato="promedio" />}
        >
          <Minigrafica
            tipo="linea"
            dominio={dominioSat}
            parcialUltimo
            datos={meses.map((m) => ({ etiqueta: m.etiqueta, corta: m.corta, valor: m.satisfaccion }))}
            formato={(v) => `${formatearPromedio(v)} de 5`}
            formatoEje={(v) => formatearPromedio(v)}
          />
        </Indicador>
        <Indicador etiqueta="Comentarios por revisar" valor={formatearEntero(resumen.pendientes)} href="/panel/comentarios">
          <BarraSegmentada
            unidad="comentarios"
            segmentos={[
              { clave: "p", etiqueta: "Por revisar", valor: resumen.comentarios.PENDIENTE, color: COLOR_MODERACION.PENDIENTE, icono: <Clock className="size-3 shrink-0 text-[#b07800]" aria-hidden="true" /> },
              { clave: "a", etiqueta: "Aprobados", valor: resumen.comentarios.APROBADO, color: COLOR_MODERACION.APROBADO, icono: <Check className="size-3 shrink-0 text-[#0a7a0a]" aria-hidden="true" /> },
              { clave: "r", etiqueta: "Rechazados", valor: resumen.comentarios.RECHAZADO, color: COLOR_MODERACION.RECHAZADO, icono: <Ban className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" /> },
            ]}
          />
        </Indicador>
        <Indicador etiqueta="Acciones de mejora abiertas" valor={formatearEntero(resumen.abiertas)} href="/panel/acciones">
          <BarraSegmentada
            unidad="acciones"
            segmentos={[
              { clave: "pe", etiqueta: "Pendiente", valor: resumen.acciones.PENDIENTE, color: COLOR_ESTADO.PENDIENTE },
              { clave: "re", etiqueta: "En revisión", valor: resumen.acciones.EN_REVISION, color: COLOR_ESTADO.EN_REVISION },
              { clave: "pr", etiqueta: "En proceso", valor: resumen.acciones.EN_PROCESO, color: COLOR_ESTADO.EN_PROCESO },
              { clave: "co", etiqueta: "Concluida", valor: resumen.acciones.CONCLUIDA, color: COLOR_ESTADO.CONCLUIDA },
            ]}
          />
        </Indicador>
      </div>

      {/* Prioridades: medidor + aspectos + la pista principal */}
      <section aria-labelledby="titulo-prioridades" className="rounded-[1.75rem] bg-[linear-gradient(160deg,#041f24,#0a4a4e)] p-5 sm:p-6">
        <div className="flex items-center gap-3 text-white">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-orange">
            <Lightbulb className="size-5" aria-hidden="true" />
          </span>
          <h2 id="titulo-prioridades" className="text-xl font-semibold">
            Prioridades: los trámites peor calificados
          </h2>
        </div>
        {lista.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-white/5 p-8 text-center text-white/70">Aún no hay trámites con suficientes evaluaciones.</p>
        ) : (
          <ul className={cn("mt-5 grid items-start gap-3", lista.length > 3 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3")}>
            {lista.map((p) => (
              <li key={p.tramiteId} className="flex flex-col rounded-[1.25rem] bg-card p-4">
                <p className="text-[11px] font-semibold text-muted-foreground">{p.dependencia}</p>
                <h3 className="mt-0.5 line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug text-navy" title={p.tramite}>
                  {p.tramite}
                </h3>
                <div className="mt-3 flex justify-center">
                  <Medidor valor={p.satisfaccion} />
                </div>
                {/* Detalle plegable: por defecto sólo el medidor, para reducir ruido visual */}
                <details className="desplegable group/d mt-3 rounded-xl border border-border/70">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-navy [&::-webkit-details-marker]:hidden">
                    <span className="group-open/d:hidden">Ver detalles</span>
                    <span className="hidden group-open/d:inline">Ocultar detalles</span>
                    <ChevronDown className="size-4 transition-transform duration-300 ease-[var(--spring)] group-open/d:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="space-y-4 px-3 pb-3 pt-1">
                    <BarrasAspecto aspectos={p.aspectos} />
                    {(p.problema || (p.pagoIndebido != null && p.pagoIndebido > 0)) && (
                      <div className="flex flex-wrap gap-1.5">
                      {p.problema && (
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-orange-soft px-2.5 py-1 text-[11px] font-semibold text-orange-ink" title="Problema más reportado">
                          <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{p.problema.etiqueta}</span>
                          <span className="tabular">{pct.format(p.problema.proporcion)}</span>
                        </span>
                      )}
                      {p.pagoIndebido != null && p.pagoIndebido > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#b8283a]/10 px-2.5 py-1 text-[11px] font-semibold text-[#8f1f2d]" title="Reportes de pago no oficial">
                          <HandCoins className="size-3" aria-hidden="true" /> {pct.format(p.pagoIndebido)}
                        </span>
                      )}
                      </div>
                    )}
                  </div>
                </details>
                <div className="mt-auto pt-4">
                  {p.accionAbierta ? (
                    <Link href="/panel/acciones" className="flex items-center justify-center gap-1.5 rounded-full bg-primary-soft py-2 text-sm font-semibold text-primary-ink">
                      <ClipboardCheck className="size-4" aria-hidden="true" /> Acción en curso
                    </Link>
                  ) : (
                    <Button asChild size="sm" className="w-full rounded-full">
                      <Link href={`/panel/acciones/nueva?tramite=${p.tramiteId}`}>
                        <Plus aria-hidden="true" /> Registrar acción
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel titulo={esAdmin ? "Satisfacción por dependencia" : "Satisfacción por trámite"}>
          <RankingBarras
            filas={filasRanking}
            referencia={detalle.promedios.satisfaccion}
            etiquetaReferencia={esAdmin ? "Promedio municipal" : "Promedio de la dependencia"}
          />
        </Panel>
        <div className="grid gap-5">
          <Panel titulo="Estrellas en satisfacción general">
            <Distribucion filas={[{ clave: "alcance", etiqueta: `${formatearEntero(detalle.total)} evaluaciones`, distribucion: detalle.distribucion }]} />
          </Panel>
          <Panel titulo="Canal de atención">
            <Dona
              centro="respuestas"
              segmentos={detalle.canales.map((c) => ({ clave: c.clave, etiqueta: c.etiqueta, valor: c.total, color: COLOR_CANAL[c.clave] ?? "#a3adb4" }))}
            />
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel titulo="Evolución mensual">
          <Tendencia datos={detalle.tendencia} />
        </Panel>
        <Panel titulo="Problemas reportados">
          <BarrasFrecuencia items={detalle.problemas} />
        </Panel>
      </div>
    </div>
  );
}
