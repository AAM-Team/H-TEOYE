"use client";

import { useId, useState } from "react";
import { Check, Star } from "lucide-react";
import { ESCALA_ESTRELLAS } from "@/lib/constantes";
import { colorCalificacion } from "@/lib/escala";
import { cn } from "@/lib/utils";

/**
 * Calificación de 1 a 5 estrellas accesible: es un grupo de radios nativos
 * (navegable con flechas del teclado y legible por lectores de pantalla).
 * La respuesta visual ocurre al presionar (pointer-down), no al soltar.
 */
export function CalificacionEstrellas({
  nombre,
  titulo,
  pregunta,
  valor,
  onCambio,
  error,
  numero,
}: {
  nombre: string;
  titulo: string;
  pregunta: string;
  valor: number | null;
  onCambio: (v: number) => void;
  error?: string;
  numero: number;
}) {
  const id = useId();
  const [sobre, setSobre] = useState<number | null>(null);
  const visible = sobre ?? valor ?? 0;
  const actual = sobre ?? valor;
  const etiqueta = ESCALA_ESTRELLAS.find((e) => e.valor === actual)?.etiqueta;
  const color = colorCalificacion(actual);

  return (
    <fieldset
      id={`campo-${nombre}`}
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={error ? true : undefined}
      className={cn(
        "rounded-2xl border p-4 transition-[background-color,border-color] duration-300 sm:p-5",
        error ? "border-destructive/50 bg-destructive/[0.03]" : valor ? "border-primary/25 bg-primary-soft/40" : "border-border bg-background/60",
      )}
    >
      <legend className="sr-only">
        {titulo}. {pregunta}
      </legend>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3" aria-hidden="true">
          <span
            className={cn(
              "tabular flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300",
              valor ? "bg-primary text-white" : "bg-muted text-muted-foreground",
            )}
          >
            {valor ? <Check className="size-4" strokeWidth={3} /> : numero}
          </span>
          <div>
            <p className="text-[17px] font-semibold text-navy">{titulo}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{pregunta}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-11 sm:pl-0">
          <div className="-m-1 flex" onMouseLeave={() => setSobre(null)}>
            {ESCALA_ESTRELLAS.map((e) => (
              <label
                key={e.valor}
                onMouseEnter={() => setSobre(e.valor)}
                className="group relative cursor-pointer p-1 has-[:focus-visible]:rounded-lg has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
              >
                <input
                  type="radio"
                  name={nombre}
                  value={e.valor}
                  checked={valor === e.valor}
                  onChange={() => onCambio(e.valor)}
                  className="sr-only"
                  required
                  aria-label={`${e.valor} de 5 estrellas: ${e.etiqueta}`}
                />
                <Star
                  aria-hidden="true"
                  strokeWidth={1.6}
                  className={cn(
                    "size-9 transition-[color,fill,transform] duration-300 ease-[var(--spring)] group-active:scale-85 group-active:duration-75 sm:size-10",
                    e.valor <= visible ? "fill-orange text-orange" : "fill-transparent text-input",
                    valor === e.valor && "scale-110",
                  )}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-h-7 items-center pl-11" aria-hidden="true">
        {etiqueta ? (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold transition-colors duration-200"
            style={{ background: color.fondo, color: color.texto }}
          >
            {actual} · {etiqueta}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Toca una estrella</span>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-2 pl-11 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
