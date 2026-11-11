import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DIMENSIONES, ESCALA_ESTRELLAS, type ClaveDimension } from "@/lib/constantes";
import { COLOR_ESTRELLA, DEGRADADO, colorCalificacion } from "@/lib/escala";
import { cn, formatearEntero, formatearPromedio } from "@/lib/utils";

const pct = new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 0 });
export const formatearPorcentaje = (n: number | null | undefined) => (n == null ? "—" : pct.format(n));

type Tono = "claro" | "oscuro";

/* ------------------------------------------------------------------ Indicador */

export function Indicador({
  etiqueta,
  valor,
  unidad,
  detalle,
  tono = "claro",
  className,
}: {
  etiqueta: string;
  valor: string;
  unidad?: string;
  detalle?: React.ReactNode;
  tono?: Tono;
  className?: string;
}) {
  const oscuro = tono === "oscuro";
  return (
    <div className={cn("flex flex-col", className)}>
      <dt className={cn("text-sm", oscuro ? "text-white/65" : "text-muted-foreground")}>{etiqueta}</dt>
      <dd className="order-first">
        <span className={cn("tabular font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl", oscuro ? "text-white" : "text-navy")}>
          {valor}
        </span>
        {unidad && <span className={cn("ml-1 text-lg font-medium", oscuro ? "text-white/55" : "text-muted-foreground")}>{unidad}</span>}
      </dd>
      {detalle && <dd className={cn("mt-1 text-xs", oscuro ? "text-white/50" : "text-muted-foreground")}>{detalle}</dd>}
    </div>
  );
}

/* ------------------------------------------------------------------ Leyenda de la escala */

export function LeyendaEscala({ tono = "claro" }: { tono?: Tono }) {
  return (
    <div className={cn("flex items-center gap-2 text-xs", tono === "oscuro" ? "text-white/65" : "text-muted-foreground")}>
      <span>1 · Muy malo</span>
      <span className="h-2.5 w-32 rounded-full" style={{ background: DEGRADADO }} aria-hidden="true" />
      <span>5 · Excelente</span>
      <span className="sr-only">Escala de color continua de 1 (rojo) a 3 (ámbar) a 5 (verde).</span>
    </div>
  );
}

/* ------------------------------------------------------------------ Mapa de calor */

export type FilaMapa = {
  clave: string;
  etiqueta: string;
  href?: string;
  total: number;
  promedios: Record<ClaveDimension, number | null>;
};

/**
 * Tabla real (lectores de pantalla, copiar y pegar) coloreada con la escala divergente.
 * Cada celda lleva su número: el color nunca es la única señal.
 */
export function MapaCalor({
  filas,
  titulo,
  tono = "claro",
  encabezadoFila = "Dependencia",
}: {
  filas: FilaMapa[];
  titulo: string;
  tono?: Tono;
  encabezadoFila?: string;
}) {
  const oscuro = tono === "oscuro";
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-[3px] text-sm">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr className={cn("text-left text-xs font-semibold", oscuro ? "text-white/60" : "text-muted-foreground")}>
            <th scope="col" className="w-[32%] pb-2 pl-1 font-semibold">
              {encabezadoFila}
            </th>
            {DIMENSIONES.map((d) => (
              <th key={d.clave} scope="col" className="w-[14%] pb-2 text-center font-semibold">
                {d.titulo.replace(" del personal", "").replace(" de la información", "").replace(" del trámite", "").replace(" general", "")}
              </th>
            ))}
            <th scope="col" className="w-[12%] pb-2 pr-1 text-right font-semibold">
              Evaluaciones
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.clave} className="group">
              <th scope="row" className={cn("py-1 pl-1 pr-3 text-left font-medium", oscuro ? "text-white" : "text-navy")}>
                {f.href ? (
                  <Link
                    href={f.href}
                    className={cn(
                      "inline-flex items-center gap-1 rounded underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    )}
                  >
                    {f.etiqueta}
                    <ArrowUpRight className="size-3.5 opacity-50 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </Link>
                ) : (
                  f.etiqueta
                )}
              </th>
              {DIMENSIONES.map((d) => {
                const v = f.promedios[d.clave];
                const c = colorCalificacion(v);
                return (
                  <td
                    key={d.clave}
                    className={cn(
                      "tabular h-12 rounded-lg text-center text-[19px] font-bold tracking-[-0.01em] transition-shadow",
                      v == null && (oscuro ? "border border-dashed border-white/15" : "border border-dashed"),
                      oscuro ? "hover:shadow-[0_0_0_2px_rgb(255_255_255/0.85)]" : "hover:shadow-[0_0_0_2px_var(--brand-navy)]",
                    )}
                    style={{ background: c.fondo, color: v == null ? undefined : c.texto }}
                    title={v == null ? "Muestra insuficiente" : `${f.etiqueta} · ${d.titulo}: ${formatearPromedio(v)} de 5`}
                  >
                    {v == null ? <span className={oscuro ? "text-white/40" : "text-muted-foreground"}>—</span> : formatearPromedio(v)}
                  </td>
                );
              })}
              <td className={cn("tabular pr-1 text-right", oscuro ? "text-white/70" : "text-muted-foreground")}>
                {formatearEntero(f.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ Distribución de estrellas */

export type FilaDistribucion = {
  clave: string;
  etiqueta: string;
  distribucion: [number, number, number, number, number];
};

/** Barras 100 % apiladas: 1–2 estrellas a la izquierda (rojo), 3 al centro (gris), 4–5 a la derecha (azul). */
export function Distribucion({ filas, tono = "claro" }: { filas: FilaDistribucion[]; tono?: Tono }) {
  const oscuro = tono === "oscuro";
  return (
    <div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" aria-label="Leyenda">
        {ESCALA_ESTRELLAS.map((e, i) => (
          <li key={e.valor} className={cn("flex items-center gap-1.5", oscuro ? "text-white/70" : "text-muted-foreground")}>
            <span className="size-2.5 rounded-sm" style={{ background: COLOR_ESTRELLA[i] }} aria-hidden="true" />
            {e.valor} · {e.etiqueta}
          </li>
        ))}
      </ul>
      <ul className="mt-5 space-y-4">
        {filas.map((f, fila) => {
          const total = f.distribucion.reduce((a, b) => a + b, 0);
          const bajos = total ? (f.distribucion[0] + f.distribucion[1]) / total : 0;
          const altos = total ? (f.distribucion[3] + f.distribucion[4]) / total : 0;
          return (
            <li key={f.clave}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={cn("font-medium", oscuro ? "text-white" : "text-navy")}>{f.etiqueta}</span>
                <span className={cn("tabular text-xs", oscuro ? "text-white/60" : "text-muted-foreground")}>
                  {total ? (
                    <>
                      <span className="font-semibold" style={{ color: oscuro ? "#ff9a8f" : "#b8283a" }}>
                        {formatearPorcentaje(bajos)}
                      </span>{" "}
                      mal ·{" "}
                      <span className="font-semibold" style={{ color: oscuro ? "#7fd99a" : "#0f6538" }}>
                        {formatearPorcentaje(altos)}
                      </span>{" "}
                      bien
                    </>
                  ) : (
                    "Muestra insuficiente"
                  )}
                </span>
              </div>
              <div className="mt-1.5 flex h-3.5 gap-[2px]" aria-hidden="true">
                {total > 0 &&
                  f.distribucion.map((n, i) =>
                    n === 0 ? null : (
                      <span
                        key={i}
                        className="group/seg relative h-full first:rounded-l-full last:rounded-r-full crece-x"
                        style={
                          {
                            width: `${(n / total) * 100}%`,
                            background: COLOR_ESTRELLA[i],
                            "--retraso": `${fila * 60}ms`,
                          } as React.CSSProperties
                        }
                      >
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-navy-deep px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/seg:opacity-100">
                          {i + 1} ★ · {formatearEntero(n)} ({formatearPorcentaje(n / total)})
                        </span>
                      </span>
                    ),
                  )}
              </div>
              <span className="sr-only">
                {f.distribucion.map((n, i) => `${i + 1} estrellas: ${n}`).join(", ")}.
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ Barras de frecuencia */

export function BarrasFrecuencia({
  items,
  maximo,
}: {
  items: { clave: string; etiqueta: string; total: number; proporcion: number }[];
  maximo?: number;
}) {
  const tope = maximo ?? Math.max(0.0001, ...items.map((i) => i.proporcion));
  return (
    <ul className="space-y-3.5">
      {items.map((it, i) => (
        <li key={it.clave} className="group">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-navy">{it.etiqueta}</span>
            <span className="tabular shrink-0 font-semibold text-navy">
              {formatearPorcentaje(it.proporcion)}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">{formatearEntero(it.total)}</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-muted" aria-hidden="true">
            <div
              className="crece-x h-full rounded-full bg-navy transition-colors group-hover:bg-orange-ink"
              style={{ width: `${(it.proporcion / tope) * 100}%`, "--retraso": `${i * 50}ms` } as React.CSSProperties}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ Tarjeta contenedora */

export function Panel({
  titulo,
  descripcion,
  accion,
  children,
  className,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgb(29_47_59/0.04),0_8px_24px_-12px_rgb(29_47_59/0.08)] sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-navy">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>}
        </div>
        {accion}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
