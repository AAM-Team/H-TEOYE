import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { IconoDependencia } from "@/components/portal/icono-dependencia";
import { DIMENSIONES, type ClaveDimension } from "@/lib/constantes";
import { colorCalificacion, veredicto } from "@/lib/escala";
import { cn, conteo, formatearPromedio } from "@/lib/utils";

const pct = new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 0 });

export type FilaRanking = {
  clave: string;
  nombre: string;
  /** slug de la dependencia, para su ícono. */
  slug?: string;
  href?: string;
  total: number;
  promedios: Record<ClaveDimension, number | null>;
  satisfechos?: number | null;
};

/** Cinco estrellas rellenas hasta el promedio (p. ej. 3.6 = tres estrellas y 60 % de la cuarta). */
export function EstrellasPromedio({ valor, className }: { valor: number | null; className?: string }) {
  const relleno = valor == null ? 0 : (Math.max(0, Math.min(5, valor)) / 5) * 100;
  return (
    <span className={cn("relative inline-flex", className)} aria-hidden="true">
      <span className="flex gap-0.5 text-input">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="size-4 fill-current" strokeWidth={0} />
        ))}
      </span>
      <span className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-orange" style={{ width: `${relleno}%` }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="size-4 shrink-0 fill-current" strokeWidth={0} />
        ))}
      </span>
    </span>
  );
}

/** Insignia de semáforo: la calificación en palabras sobre su color. */
export function InsigniaVeredicto({ valor, className }: { valor: number | null; className?: string }) {
  const c = colorCalificacion(valor);
  const v = veredicto(valor);
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", valor == null && "border border-dashed", className)}
      style={{ background: c.fondo, color: valor == null ? undefined : c.texto }}
    >
      {v.etiqueta}
    </span>
  );
}

function Envoltura({ href, className, children }: { href?: string; className?: string; children: React.ReactNode }) {
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

function mejorYPeor(promedios: Record<ClaveDimension, number | null>) {
  const v = DIMENSIONES.filter((d) => d.clave !== "satisfaccion")
    .map((d): { titulo: string; valor: number | null } => ({ titulo: d.titulo, valor: promedios[d.clave] }))
    .filter((x): x is { titulo: string; valor: number } => x.valor != null)
    .sort((a, b) => b.valor - a.valor);
  return v.length ? { mejor: v[0], peor: v[v.length - 1] } : null;
}

/**
 * Ranking pensado para cualquier ciudadano: posición, estrellas, una palabra de semáforo y una frase
 * que dice qué funciona y qué falla. El orden es por satisfacción general.
 */
export function RankingDependencias({ filas, compacto = false }: { filas: FilaRanking[]; compacto?: boolean }) {
  const ordenadas = [...filas].sort((a, b) => (b.promedios.satisfaccion ?? -1) - (a.promedios.satisfaccion ?? -1));

  return (
    <ol className="space-y-3">
      {ordenadas.map((f, i) => {
        const s = f.promedios.satisfaccion;
        const c = colorCalificacion(s);
        const extremos = mejorYPeor(f.promedios);
        return (
          <li key={f.clave}>
            <Envoltura
              href={f.href}
              className={cn(
                "group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-[1.25rem] border border-border/70 bg-card p-4 sm:grid-cols-[auto_1fr_auto] sm:p-5",
                f.href &&
                  "presionable outline-none transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-[0_10px_30px_-18px_rgb(6_38_43/0.45)] focus-visible:ring-[3px] focus-visible:ring-ring/50",
              )}
            >
              {/* Posición */}
              <span
                className={cn(
                  "tabular flex size-11 items-center justify-center rounded-2xl font-display text-xl font-bold",
                  i === 0 && s != null ? "bg-primary text-white" : "bg-muted text-navy",
                )}
              >
                <span className="sr-only">Lugar </span>
                {i + 1}
              </span>

              {/* Nombre y explicación en palabras */}
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {f.slug && !compacto && <IconoDependencia slug={f.slug} className="size-4 text-primary-ink" />}
                  <span className={cn("font-semibold leading-snug text-navy", compacto ? "text-[15px]" : "text-lg")}>{f.nombre}</span>
                  <InsigniaVeredicto valor={s} />
                </span>
                <span className="mt-1.5 block text-sm text-muted-foreground">
                  {s == null ? (
                    `${conteo(f.total, "evaluación", "evaluaciones")}: aún no alcanza el mínimo para publicarse.`
                  ) : (
                    <>
                      {f.satisfechos != null && (
                        <>
                          <strong className="font-semibold text-navy">{pct.format(f.satisfechos)}</strong> quedó satisfecho ·{" "}
                        </>
                      )}
                      {extremos && (
                        <>
                          Lo mejor: <span className="text-navy">{extremos.mejor.titulo.toLowerCase()}</span>
                          {extremos.peor.titulo !== extremos.mejor.titulo && (
                            <>
                              {" "}
                              · A mejorar: <span className="text-navy">{extremos.peor.titulo.toLowerCase()}</span>
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </span>
              </span>

              {/* Calificación */}
              <span className="col-span-2 flex items-center gap-4 sm:col-span-1 sm:justify-end">
                <span className="flex flex-1 flex-col gap-1.5 sm:w-44 sm:flex-none">
                  <span className="flex items-center justify-between gap-2">
                    <EstrellasPromedio valor={s} />
                    <span className="text-xs text-muted-foreground">{conteo(f.total, "opinión", "opiniones")}</span>
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <span
                      className="crece-x block h-full rounded-full"
                      style={
                        {
                          width: `${s == null ? 0 : (s / 5) * 100}%`,
                          background: c.fondo,
                          "--retraso": `${i * 70}ms`,
                        } as React.CSSProperties
                      }
                    />
                  </span>
                </span>
                <span className="tabular w-14 text-right font-display text-3xl font-semibold tracking-[-0.03em] text-navy">
                  {formatearPromedio(s)}
                  <span className="sr-only"> de 5 estrellas</span>
                </span>
                {f.href && (
                  <ChevronRight className="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
                )}
              </span>
            </Envoltura>
          </li>
        );
      })}
    </ol>
  );
}
