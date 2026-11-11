import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, ClipboardCheck, Lightbulb, MessageSquareText, Minus, Plus } from "lucide-react";
import { BarrasFrecuencia, Panel } from "@/components/resultados/graficas";
import { InsigniaVeredicto, RankingDependencias } from "@/components/resultados/ranking";
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

function Cambio({ actual, previo, formato }: { actual: number | null; previo: number | null; formato: "conteo" | "promedio" }) {
  if (actual == null || previo == null || previo === 0) return <span className="text-muted-foreground">Sin periodo previo</span>;
  const d = formato === "conteo" ? (actual - previo) / previo : actual - previo;
  const igual = Math.abs(d) < (formato === "conteo" ? 0.02 : 0.05);
  const Icono = igual ? Minus : d > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-semibold", igual ? "text-muted-foreground" : d > 0 ? "text-[#0f6538]" : "text-[#b8283a]")}>
      <Icono className="size-3.5" aria-hidden="true" />
      {igual ? "Sin cambio" : formato === "conteo" ? `${d > 0 ? "+" : ""}${pct.format(d)}` : `${d > 0 ? "+" : "−"}${formatearPromedio(Math.abs(d))}`}
      <span className="font-normal text-muted-foreground">&nbsp;vs. 30 días previos</span>
    </span>
  );
}

function Tarjeta({ etiqueta, valor, detalle, href }: { etiqueta: string; valor: string; detalle: React.ReactNode; href?: string }) {
  const contenido = (
    <>
      <p className="text-sm text-muted-foreground">{etiqueta}</p>
      <p className="tabular mt-2 font-display text-4xl font-semibold tracking-[-0.03em] text-navy">{valor}</p>
      <p className="mt-2 text-xs">{detalle}</p>
    </>
  );
  const clase = "block rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgb(29_47_59/0.04)]";
  return href ? (
    <Link href={href} className={cn(clase, "presionable transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_12px_30px_-20px_rgb(6_38_43/0.5)]")}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
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

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
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
          <p className="mt-2 text-muted-foreground">
            {esAdmin ? "Estás viendo las cinco dependencias." : `Estás viendo ${usuario.dependencia?.nombre ?? "tu dependencia"}.`}
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/panel/acciones/nueva">
            <Plus aria-hidden="true" /> Nueva acción de mejora
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta
          etiqueta="Evaluaciones en 30 días"
          valor={formatearEntero(resumen.recientes)}
          detalle={<Cambio actual={resumen.recientes} previo={resumen.previas} formato="conteo" />}
        />
        <Tarjeta
          etiqueta="Satisfacción en 30 días"
          valor={`${formatearPromedio(resumen.satisfaccion30)} /5`}
          detalle={<Cambio actual={resumen.satisfaccion30} previo={resumen.satisfaccionPrevia} formato="promedio" />}
        />
        <Tarjeta
          etiqueta="Comentarios por revisar"
          valor={formatearEntero(resumen.pendientes)}
          href="/panel/comentarios"
          detalle={<span className="font-semibold text-primary-ink">Ir a moderación →</span>}
        />
        <Tarjeta
          etiqueta="Acciones de mejora abiertas"
          valor={formatearEntero(resumen.abiertas)}
          href="/panel/acciones"
          detalle={<span className="text-muted-foreground">{resumen.porValidar} sin validar</span>}
        />
      </div>

      {/* Prioridades */}
      <section aria-labelledby="titulo-prioridades">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-orange-soft text-orange-ink">
            <Lightbulb className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="titulo-prioridades" className="text-2xl font-semibold text-navy">
              Prioridades sugeridas
            </h2>
            <p className="text-sm text-muted-foreground">Los trámites peor calificados y la pista de qué atender primero.</p>
          </div>
        </div>
        {lista.length === 0 ? (
          <p className="mt-5 rounded-[1.5rem] border border-dashed bg-card p-8 text-center text-muted-foreground">
            Aún no hay trámites con suficientes evaluaciones.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {lista.map((p) => (
              <li key={p.tramiteId} className="flex flex-col rounded-[1.5rem] border border-border/70 bg-card p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">{p.dependencia}</p>
                    <h3 className="mt-1 text-lg font-semibold leading-snug text-navy">{p.tramite}</h3>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tabular font-display text-3xl font-semibold text-navy">{formatearPromedio(p.satisfaccion)}</span>
                    <InsigniaVeredicto valor={p.satisfaccion} />
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm">
                  {p.peorAspecto && (
                    <div className="flex justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2">
                      <dt className="text-muted-foreground">Lo que más falla</dt>
                      <dd className="text-right font-semibold text-navy">
                        {p.peorAspecto.titulo} · {formatearPromedio(p.peorAspecto.valor)}
                      </dd>
                    </div>
                  )}
                  {p.problema && (
                    <div className="flex justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2">
                      <dt className="text-muted-foreground">Problema más reportado</dt>
                      <dd className="text-right font-semibold text-navy">
                        {p.problema.etiqueta} · {pct.format(p.problema.proporcion)}
                      </dd>
                    </div>
                  )}
                  {p.pagoIndebido != null && p.pagoIndebido > 0 && (
                    <div className="flex justify-between gap-3 rounded-xl bg-[#b8283a]/8 px-3 py-2">
                      <dt className="text-[#8f1f2d]">Reportes de pago no oficial</dt>
                      <dd className="font-semibold text-[#8f1f2d]">{pct.format(p.pagoIndebido)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                  <span className="text-xs text-muted-foreground">{formatearEntero(p.total)} evaluaciones</span>
                  {p.accionAbierta ? (
                    <Link href="/panel/acciones" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-ink hover:underline">
                      <ClipboardCheck className="size-4" aria-hidden="true" /> Acción en curso
                    </Link>
                  ) : (
                    <Button asChild size="sm" className="rounded-full">
                      <Link href={`/panel/acciones/nueva?tramite=${p.tramiteId}`}>
                        Registrar acción de mejora <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Panel
        titulo={esAdmin ? "Ranking de dependencias" : "Ranking de trámites"}
        descripcion="Satisfacción general histórica. Toca una fila para ver sus evaluaciones."
      >
        {esAdmin ? (
          <RankingDependencias
            filas={dependencias.map((d) => ({
              clave: d.slug,
              slug: d.slug,
              nombre: d.nombreCorto,
              href: `/panel/evaluaciones?dependencia=${d.id}`,
              total: d.total,
              promedios: d.promedios,
              satisfechos: d.satisfechos,
            }))}
          />
        ) : (
          <RankingDependencias
            compacto
            filas={tramites.map((t) => ({
              clave: t.id,
              nombre: t.nombre,
              href: `/panel/evaluaciones?tramite=${t.id}`,
              total: t.total,
              promedios: t.promedios,
            }))}
          />
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel titulo="Evolución en seis meses" descripcion="La línea punteada marca 3, «regular».">
          <Tendencia datos={detalle.tendencia} />
        </Panel>
        <Panel titulo="Problemas más reportados" descripcion={`Entre ${formatearEntero(detalle.respondieronProblemas)} personas que respondieron.`}>
          <BarrasFrecuencia items={detalle.problemas} />
        </Panel>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageSquareText className="size-3.5" aria-hidden="true" /> Las cifras incluyen datos demostrativos del prototipo.
      </p>
    </div>
  );
}
