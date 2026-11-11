import Link from "next/link";
import { colorCalificacion, veredicto } from "@/lib/escala";
import { cn, formatearEntero, formatearPromedio } from "@/lib/utils";

/**
 * Visualizaciones compactas del tablero interno (SVG/HTML renderizados en el servidor).
 * Reglas de dataviz: marcas finas, extremos redondeados de 4px, 2px de separación entre segmentos,
 * texto en tintas (nunca del color de la serie), tooltip por marca y alternativa en texto para lectores.
 */

const pct = new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 0 });

/** Globo que aparece al pasar el puntero sobre la marca (el padre lleva `group/m relative`). */
function Globo({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy-deep px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/m:opacity-100",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Minigráfica */

/** Máximo "redondo" para el eje (p. ej. 107 → 120, 32 → 40). */
function maximoRedondo(v: number) {
  if (v <= 0) return 1;
  const base = 10 ** Math.floor(Math.log10(v));
  return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * base).find((m) => m >= v) ?? v);
}

/**
 * Minigráfica con ejes: valores a la izquierda (con rejilla tenue) y meses abajo.
 * Cada columna es una zona de puntero con su globo; el último periodo puede marcarse como parcial.
 */
export function Minigrafica({
  datos,
  tipo,
  dominio,
  formato,
  formatoEje = (v) => formatearEntero(v),
  parcialUltimo = false,
  color = "var(--brand-teal-ink)",
}: {
  datos: { etiqueta: string; corta?: string; valor: number | null }[];
  tipo: "linea" | "barras";
  dominio?: [number, number];
  formato: (v: number) => string;
  formatoEje?: (v: number) => string;
  /** El último periodo está en curso: barra más tenue y asterisco en el eje. */
  parcialUltimo?: boolean;
  color?: string;
}) {
  const valores = datos.map((d) => d.valor).filter((v): v is number => v != null);
  const [min, max] = dominio ?? [0, maximoRedondo(Math.max(1, ...valores))];
  const marcas = [min, (min + max) / 2, max];
  const yPct = (v: number) => 100 - ((v - min) / (max - min || 1)) * 100;
  const xPct = (i: number) => ((i + 0.5) / datos.length) * 100;
  const puntos = datos
    .map((d, i) => (d.valor == null ? null : `${xPct(i).toFixed(2)},${yPct(d.valor).toFixed(2)}`))
    .filter(Boolean)
    .join(" ");
  const n = datos.length;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2">
      {/* Eje Y */}
      <div className="relative h-16 w-7" aria-hidden="true">
        {marcas.map((m) => (
          <span key={m} className="tabular absolute right-0 -translate-y-1/2 text-[10px] leading-none text-muted-foreground" style={{ top: `${yPct(m)}%` }}>
            {formatoEje(m)}
          </span>
        ))}
      </div>

      {/* Área de trazado */}
      <div className="relative h-16">
        {marcas.map((m, k) => (
          <span
            key={m}
            className={cn("absolute inset-x-0 h-px", k === 0 ? "bg-input" : "bg-border/80")}
            style={{ top: `${yPct(m)}%` }}
            aria-hidden="true"
          />
        ))}

        {tipo === "barras" ? (
          <div className="absolute inset-0 flex items-end gap-[3px] px-[2px]" aria-hidden="true">
            {datos.map((d, i) => {
              const parcial = parcialUltimo && i === n - 1;
              return (
                <span
                  key={d.etiqueta}
                  className={cn("flex-1 rounded-t-[4px]", parcial && "border border-b-0 border-dashed")}
                  style={{
                    height: `${d.valor == null ? 0 : Math.max(3, 100 - yPct(d.valor))}%`,
                    background: color,
                    opacity: parcial ? 0.35 : 0.85,
                    borderColor: parcial ? color : undefined,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <polyline points={puntos} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {datos.map((d, i) =>
              d.valor == null ? null : (
                <span
                  key={d.etiqueta}
                  className={cn("absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card", parcialUltimo && i === n - 1 && "opacity-50")}
                  style={{ left: `${xPct(i)}%`, top: `${yPct(d.valor)}%`, background: color }}
                  aria-hidden="true"
                />
              ),
            )}
          </>
        )}

        {/* Zonas de puntero por columna; el globo va debajo para no tapar la cifra */}
        <div className="absolute inset-0 flex">
          {datos.map((d) => (
            <span key={d.etiqueta} className="group/m relative flex-1 rounded transition-colors hover:bg-navy/[0.05]">
              <Globo className="bottom-auto top-full mb-0 mt-2">
                {d.etiqueta}: {d.valor == null ? "sin datos" : formato(d.valor)}
              </Globo>
            </span>
          ))}
        </div>
      </div>

      {/* Eje X */}
      <span aria-hidden="true" />
      <div className="mt-1.5 flex px-[2px]" aria-hidden="true">
        {datos.map((d, i) => (
          <span key={d.etiqueta} className="flex-1 text-center text-[10px] text-muted-foreground">
            {d.corta ?? d.etiqueta}
            {parcialUltimo && i === n - 1 ? "*" : ""}
          </span>
        ))}
      </div>
      <span className="sr-only">{datos.map((d) => `${d.etiqueta}: ${d.valor == null ? "sin datos" : formato(d.valor)}`).join("; ")}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ Medidor semicircular */

export function Medidor({ valor, tamano = 132 }: { valor: number; tamano?: number }) {
  const t = Math.max(0, Math.min(1, (valor - 1) / 4));
  const c = colorCalificacion(valor);
  // Semicírculo de radio 50 centrado en (60,60): longitud π·50.
  const largo = Math.PI * 50;
  return (
    <div className="relative" style={{ width: tamano }} role="img" aria-label={`Satisfacción general ${formatearPromedio(valor)} de 5: ${veredicto(valor).etiqueta}`}>
      <svg viewBox="0 0 120 68" className="w-full" aria-hidden="true">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--muted)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          stroke={c.fondo}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${largo * t} ${largo}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="tabular font-display text-3xl font-semibold leading-none tracking-[-0.03em] text-navy">{formatearPromedio(valor)}</span>
        <span className="mt-1 text-[11px] font-semibold text-muted-foreground">{veredicto(valor).etiqueta}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Barras por aspecto */

export function BarrasAspecto({ aspectos }: { aspectos: { titulo: string; valor: number | null }[] }) {
  const validos = aspectos.filter((a) => a.valor != null) as { titulo: string; valor: number }[];
  const peor = validos.length ? validos.reduce((a, b) => (b.valor < a.valor ? b : a)) : null;
  return (
    <ul className="space-y-2">
      {aspectos.map((a) => {
        const c = colorCalificacion(a.valor);
        const esPeor = peor?.titulo === a.titulo;
        return (
          <li key={a.titulo} className="group/m relative">
            <div className="flex items-baseline justify-between text-xs">
              <span className={cn(esPeor ? "font-semibold text-navy" : "text-muted-foreground")}>
                {a.titulo.split(" ")[0]}
                {esPeor && <span className="ml-1.5 rounded-full bg-navy px-1.5 py-px text-[10px] font-bold text-white">más bajo</span>}
              </span>
              <span className="tabular font-semibold text-navy">{formatearPromedio(a.valor)}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-muted" aria-hidden="true">
              <div className="crece-x h-full rounded-full" style={{ width: `${a.valor == null ? 0 : (a.valor / 5) * 100}%`, background: c.fondo }} />
            </div>
            <Globo>
              {a.titulo}: {formatearPromedio(a.valor)} de 5
            </Globo>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ Barra segmentada (parte de un todo) */

export type Segmento = { clave: string; etiqueta: string; valor: number; color: string; icono?: React.ReactNode };

export function BarraSegmentada({ segmentos, unidad }: { segmentos: Segmento[]; unidad: string }) {
  const total = segmentos.reduce((a, s) => a + s.valor, 0);
  return (
    <div>
      <div className="flex h-3.5 gap-[2px]" aria-hidden="true">
        {total === 0 ? (
          <span className="h-full flex-1 rounded-full bg-muted" />
        ) : (
          segmentos
            .filter((s) => s.valor > 0)
            .map((s) => (
              <span
                key={s.clave}
                className="group/m relative h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(s.valor / total) * 100}%`, background: s.color }}
              >
                <Globo>
                  {s.etiqueta}: {formatearEntero(s.valor)} ({pct.format(s.valor / total)})
                </Globo>
              </span>
            ))
        )}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
        {segmentos.map((s) => (
          <li key={s.clave} className="flex items-center gap-1.5 text-muted-foreground">
            {s.icono ?? <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden="true" />}
            <span className="truncate">{s.etiqueta}</span>
            <span className="tabular ml-auto font-semibold text-navy">{formatearEntero(s.valor)}</span>
          </li>
        ))}
      </ul>
      <span className="sr-only">
        {segmentos.map((s) => `${s.etiqueta}: ${s.valor} ${unidad}`).join(", ")}.
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ Dona */

export function Dona({ segmentos, centro }: { segmentos: Segmento[]; centro: string }) {
  const total = segmentos.reduce((a, s) => a + s.valor, 0);
  const r = 40;
  const largo = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="14" />
          {total > 0 &&
            segmentos.map((s) => {
              const parte = (s.valor / total) * largo;
              const separacion = segmentos.filter((x) => x.valor > 0).length > 1 ? 1.6 : 0;
              const el = (
                <circle
                  key={s.clave}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="14"
                  strokeDasharray={`${Math.max(0, parte - separacion)} ${largo}`}
                  strokeDashoffset={-acumulado}
                >
                  <title>{`${s.etiqueta}: ${pct.format(s.valor / total)}`}</title>
                </circle>
              );
              acumulado += parte;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular font-display text-2xl font-semibold text-navy">{formatearEntero(total)}</span>
          <span className="text-[11px] text-muted-foreground">{centro}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
        {segmentos.map((s) => (
          <li key={s.clave} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
            <span className="truncate text-muted-foreground">{s.etiqueta}</span>
            <span className="tabular ml-auto font-semibold text-navy">{total ? pct.format(s.valor / total) : "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ Ranking en barras */

export type FilaBarra = { clave: string; nombre: string; href?: string; valor: number | null; total: number };

/**
 * Barras horizontales de 1 a 5 con color de la escala y una línea de referencia (el promedio).
 * La base es 1 (la calificación mínima), no 0.
 */
export function RankingBarras({ filas, referencia, etiquetaReferencia }: { filas: FilaBarra[]; referencia: number | null; etiquetaReferencia: string }) {
  const ordenadas = [...filas].sort((a, b) => (b.valor ?? -1) - (a.valor ?? -1));
  const x = (v: number) => ((v - 1) / 4) * 100;
  return (
    <div>
      <div className="relative ml-[38%] mr-12 h-5 text-[11px] text-muted-foreground sm:ml-[30%]" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: `${x(t)}%` }}>
            {t}
          </span>
        ))}
      </div>
      <ol className="space-y-1">
        {ordenadas.map((f, i) => {
          const c = colorCalificacion(f.valor);
          const contenido = (
            <>
              <span className="flex min-w-0 items-center gap-2 pr-3">
                <span className="tabular w-4 shrink-0 text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <span className="truncate text-sm font-medium text-navy">{f.nombre}</span>
              </span>
              <span className="relative h-7">
                {/* Rejilla en 1..5 y referencia */}
                {[1, 2, 3, 4, 5].map((t) => (
                  <span key={t} className="absolute inset-y-0 w-px bg-border" style={{ left: `${x(t)}%` }} aria-hidden="true" />
                ))}
                {f.valor != null && (
                  <span
                    className="crece-x absolute inset-y-1.5 left-0 rounded-r-[4px]"
                    style={{ width: `${x(f.valor)}%`, background: c.fondo, "--retraso": `${i * 50}ms` } as React.CSSProperties}
                    aria-hidden="true"
                  />
                )}
                {referencia != null && (
                  <span className="absolute -inset-y-0.5 w-0.5 rounded-full bg-navy" style={{ left: `${x(referencia)}%` }} aria-hidden="true" />
                )}
                <Globo>
                  {f.nombre}: {formatearPromedio(f.valor)} de 5 · {formatearEntero(f.total)} evaluaciones
                </Globo>
              </span>
              <span className="tabular w-12 text-right text-sm font-semibold text-navy">{formatearPromedio(f.valor)}</span>
            </>
          );
          const clase = "group/m relative grid grid-cols-[38%_1fr_auto] items-center rounded-lg px-1 transition-colors hover:bg-muted/70 sm:grid-cols-[30%_1fr_auto]";
          return (
            <li key={f.clave}>
              {f.href ? (
                <Link href={f.href} className={cn(clase, "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50")}>
                  {contenido}
                </Link>
              ) : (
                <div className={clase}>{contenido}</div>
              )}
            </li>
          );
        })}
      </ol>
      {referencia != null && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3 w-0.5 rounded-full bg-navy" aria-hidden="true" /> {etiquetaReferencia}: {formatearPromedio(referencia)}
        </p>
      )}
    </div>
  );
}
