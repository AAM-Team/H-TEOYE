"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIMENSIONES, ESCALA_ESTRELLAS, type ClaveDimension } from "@/lib/constantes";
import { cn, formatearPromedio } from "@/lib/utils";

type DependenciaDemo = {
  slug: string;
  nombreCorto: string;
  promedios: Record<ClaveDimension, number | null>;
};

type Calificaciones = Record<ClaveDimension, number | null>;
const SIN_CALIFICAR: Calificaciones = { trato: null, claridad: null, facilidad: null, satisfaccion: null };

/** Fila compacta de 5 estrellas: un grupo de radios nativos (flechas del teclado, lectores de pantalla). */
function FilaEstrellas({
  nombre,
  titulo,
  valor,
  onCambio,
}: {
  nombre: string;
  titulo: string;
  valor: number | null;
  onCambio: (v: number) => void;
}) {
  const [sobre, setSobre] = useState<number | null>(null);
  const visible = sobre ?? valor ?? 0;
  const etiqueta = ESCALA_ESTRELLAS.find((e) => e.valor === (sobre ?? valor))?.etiqueta;

  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
      <legend className="sr-only">{titulo}</legend>
      <span aria-hidden="true" className="min-w-0 text-sm font-medium text-navy">
        {titulo}
        <span className={cn("block text-xs", etiqueta ? "text-primary-ink" : "text-muted-foreground")}>
          {etiqueta ?? "Sin calificar"}
        </span>
      </span>
      <span className="-mr-1 flex" onMouseLeave={() => setSobre(null)}>
        {ESCALA_ESTRELLAS.map((e) => (
          <label
            key={e.valor}
            onMouseEnter={() => setSobre(e.valor)}
            className="group cursor-pointer p-1 has-[:focus-visible]:rounded-md has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
          >
            <input
              type="radio"
              name={nombre}
              value={e.valor}
              checked={valor === e.valor}
              onChange={() => onCambio(e.valor)}
              className="sr-only"
              aria-label={`${e.valor} de 5: ${e.etiqueta}`}
            />
            <Star
              aria-hidden="true"
              strokeWidth={1.75}
              className={cn(
                "size-7 transition-[color,fill,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-90",
                e.valor <= visible ? "fill-orange text-orange" : "fill-transparent text-input",
              )}
            />
          </label>
        ))}
      </span>
    </fieldset>
  );
}

export function EncuestaDemo({ dependencias }: { dependencias: DependenciaDemo[] }) {
  const id = useId();
  const [slug, setSlug] = useState(dependencias[0]?.slug ?? "");
  const [calificaciones, setCalificaciones] = useState<Calificaciones>(SIN_CALIFICAR);
  const [paso, setPaso] = useState<"calificar" | "comparar">("calificar");
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const primerCambio = useRef(true);

  const dep = dependencias.find((d) => d.slug === slug) ?? dependencias[0];
  const completas = Object.values(calificaciones).filter(Boolean).length;
  const listo = completas === DIMENSIONES.length;

  // Al cambiar de paso, el foco va al título del paso nuevo (no en la primera pintura).
  useEffect(() => {
    if (primerCambio.current) {
      primerCambio.current = false;
      return;
    }
    tituloRef.current?.focus();
  }, [paso]);

  if (!dep) return null;

  const tuPromedio = listo
    ? DIMENSIONES.reduce((a, d) => a + (calificaciones[d.clave] ?? 0), 0) / DIMENSIONES.length
    : null;
  const promedioDep = (() => {
    const v = DIMENSIONES.map((d) => dep.promedios[d.clave]).filter((x): x is number => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  })();
  const diferencia = tuPromedio != null && promedioDep != null ? tuPromedio - promedioDep : null;

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white text-navy shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)]"
    >
      {/* Barra superior: contexto y progreso */}
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="size-2 rounded-full bg-teal" aria-hidden="true" />
          Prueba la encuesta · no se guarda
        </span>
        <span className="tabular text-xs font-semibold text-muted-foreground" aria-live="polite">
          {paso === "calificar" ? `${completas} de 4` : "Resultado"}
        </span>
      </div>
      <div className="h-1 bg-muted" aria-hidden="true">
        <div
          className="h-full origin-left bg-orange transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `scaleX(${paso === "comparar" ? 1 : completas / 4})` }}
        />
      </div>

      {paso === "calificar" ? (
        <div className="p-5 sm:p-6">
          <h2 id={`${id}-titulo`} ref={tituloRef} tabIndex={-1} className="text-xl font-semibold outline-none">
            ¿Cómo te atendieron?
          </h2>

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold text-muted-foreground">Dependencia</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dependencias.map((d) => (
                <label
                  key={d.slug}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                    d.slug === slug ? "border-primary bg-primary text-white" : "bg-white text-navy hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-dependencia`}
                    value={d.slug}
                    checked={d.slug === slug}
                    onChange={() => setSlug(d.slug)}
                    className="sr-only"
                  />
                  {d.nombreCorto}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-3 divide-y">
            {DIMENSIONES.map((d) => (
              <FilaEstrellas
                key={d.clave}
                nombre={`${id}-${d.clave}`}
                titulo={d.titulo}
                valor={calificaciones[d.clave]}
                onCambio={(v) => setCalificaciones((c) => ({ ...c, [d.clave]: v }))}
              />
            ))}
          </div>

          <Button
            type="button"
            className="mt-4 w-full rounded-full"
            size="lg"
            disabled={!listo}
            onClick={() => setPaso("comparar")}
          >
            {listo ? "Comparar con la ciudadanía" : `Califica ${4 - completas} ${4 - completas === 1 ? "aspecto más" : "aspectos más"}`}
            {listo && <ArrowRight aria-hidden="true" />}
          </Button>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <h2 id={`${id}-titulo`} ref={tituloRef} tabIndex={-1} className="text-xl font-semibold outline-none">
            Tú frente a {dep.nombreCorto}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {diferencia == null
              ? "Aún no hay suficientes evaluaciones para comparar."
              : Math.abs(diferencia) < 0.25
                ? "Tu experiencia coincide con lo que reporta la mayoría."
                : diferencia > 0
                  ? `Te fue mejor que al promedio: +${formatearPromedio(diferencia)} estrellas.`
                  : `Te fue peor que al promedio: −${formatearPromedio(-diferencia)} estrellas. Justo lo que esta encuesta quiere detectar.`}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-orange" aria-hidden="true" /> Tu calificación
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-teal" aria-hidden="true" /> Promedio ciudadano
            </span>
          </div>

          <dl className="mt-3 space-y-3.5">
            {DIMENSIONES.map((d, i) => {
              const tu = calificaciones[d.clave] ?? 0;
              const prom = dep.promedios[d.clave];
              return (
                <div key={d.clave}>
                  <dt className="text-sm font-medium">{d.titulo}</dt>
                  <dd className="mt-1.5 space-y-[3px]">
                    {[
                      { valor: tu, color: "bg-orange", texto: `Tú: ${tu}` },
                      { valor: prom ?? 0, color: "bg-teal", texto: `Promedio: ${formatearPromedio(prom)}` },
                    ].map((b) => (
                      <span key={b.texto} className="flex items-center gap-2">
                        <span className="h-2.5 flex-1 rounded-full bg-muted">
                          <span
                            className={cn("crece-x block h-full rounded-full", b.color)}
                            style={
                              { width: `${(b.valor / 5) * 100}%`, "--retraso": `${i * 70}ms` } as React.CSSProperties
                            }
                          />
                        </span>
                        <span className="tabular w-24 shrink-0 text-xs text-muted-foreground">{b.texto}</span>
                      </span>
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg" className="flex-1 rounded-full">
              <Link href={`/dependencias/${dep.slug}`}>
                Evaluar mi trámite real <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="rounded-full"
              onClick={() => {
                setCalificaciones(SIN_CALIFICAR);
                setPaso("calificar");
              }}
            >
              <RotateCcw aria-hidden="true" /> Otra vez
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
