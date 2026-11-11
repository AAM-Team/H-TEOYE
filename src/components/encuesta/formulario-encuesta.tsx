"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, Lock, Send } from "lucide-react";
import { enviarEvaluacion, type EstadoEnvio } from "@/app/(portal)/evaluar/acciones";
import { CalificacionEstrellas } from "@/components/encuesta/calificacion-estrellas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CANALES,
  DIMENSIONES,
  MAX_COMENTARIO,
  OPCIONES_PAGO_INDEBIDO,
  PROBLEMA_NINGUNO,
  PROBLEMAS,
  type ClaveDimension,
} from "@/lib/constantes";
import { colorCalificacion, veredicto } from "@/lib/escala";
import { cn, formatearPromedio } from "@/lib/utils";

const estadoInicial: EstadoEnvio = { estado: "inicial" };

/** Destino y nombre de cada campo, para enlazar el resumen de errores con el campo a corregir. */
const CAMPOS: Record<string, { ancla: string; nombre: string }> = {
  ...Object.fromEntries(DIMENSIONES.map((d) => [d.clave, { ancla: `campo-${d.clave}`, nombre: d.titulo }])),
  problemas: { ancla: "campo-problemas", nombre: "Problemas que enfrentaste" },
  comentario: { ancla: "comentario", nombre: "Comentario" },
  aceptaPrivacidad: { ancla: "acepta-privacidad", nombre: "Aviso de privacidad" },
};

/** Opción tipo «pastilla» (radio o casilla nativa, oculta visualmente): se marca con un check. */
function Opcion({
  type,
  name,
  value,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "presionable flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-[15px] font-medium transition-[background-color,border-color,color] duration-200",
        "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        checked ? "border-primary bg-primary-soft text-primary-ink" : "border-border bg-card text-navy hover:border-input hover:bg-muted/50",
      )}
    >
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center border-2 transition-colors duration-200",
          type === "radio" ? "rounded-full" : "rounded-md",
          checked ? "border-primary bg-primary text-white" : "border-input bg-card",
        )}
      >
        <Check className={cn("size-3 transition-[opacity,transform] duration-300 ease-[var(--spring)]", checked ? "scale-100 opacity-100" : "scale-50 opacity-0")} strokeWidth={3.5} />
      </span>
      {children}
    </label>
  );
}

function Seccion({
  id,
  numero,
  titulo,
  descripcion,
  children,
}: {
  id: string;
  numero: string;
  titulo: React.ReactNode;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgb(29_47_59/0.04)] sm:p-8">
      <p className="rotulo text-primary-ink">{numero}</p>
      <h2 id={id} className="mt-1.5 text-2xl font-semibold text-navy sm:text-[1.75rem]">
        {titulo}
      </h2>
      {descripcion && <p className="mt-1.5 text-muted-foreground">{descripcion}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function FormularioEncuesta({ tramiteId }: { tramiteId: string }) {
  const [estado, accion, enviando] = useActionState(enviarEvaluacion, estadoInicial);
  const [calificaciones, setCalificaciones] = useState<Record<ClaveDimension, number | null>>({
    trato: null,
    claridad: null,
    facilidad: null,
    satisfaccion: null,
  });
  const [canal, setCanal] = useState<string>("");
  const [problemas, setProblemas] = useState<string[]>([]);
  const [pago, setPago] = useState<string>("");
  const [comentario, setComentario] = useState("");
  const [acepta, setAcepta] = useState(false);
  const resumenRef = useRef<HTMLDivElement>(null);

  const errores = estado.estado === "error" ? estado.errores ?? {} : {};
  // Cada error desaparece en cuanto la persona corrige el campo.
  const errorPrivacidad = acepta ? undefined : errores.aceptaPrivacidad?.[0];
  const valores = Object.values(calificaciones).filter((v): v is number => v != null);
  const completas = valores.length;
  const tuPromedio = completas ? valores.reduce((a, b) => a + b, 0) / completas : null;
  const opcionales = [canal, problemas.length ? "x" : "", pago, comentario.trim()].filter(Boolean).length;
  const listo = completas === 4 && acepta;

  useEffect(() => {
    if (estado.estado === "error") resumenRef.current?.focus();
  }, [estado]);

  function alternarProblema(valor: string) {
    setProblemas((actual) => {
      if (valor === PROBLEMA_NINGUNO.valor) return actual.includes(valor) ? [] : [valor];
      const sinNinguno = actual.filter((p) => p !== PROBLEMA_NINGUNO.valor);
      return sinNinguno.includes(valor) ? sinNinguno.filter((p) => p !== valor) : [...sinNinguno, valor];
    });
  }

  const pasos = [
    ...DIMENSIONES.map((d) => ({ ancla: `campo-${d.clave}`, titulo: d.titulo, hecho: calificaciones[d.clave] != null })),
    { ancla: "titulo-adicional", titulo: `Detalles opcionales (${opcionales} de 4)`, hecho: opcionales > 0, opcional: true },
    { ancla: "acepta-privacidad", titulo: "Aviso de privacidad", hecho: acepta },
  ];
  const color = colorCalificacion(tuPromedio);

  return (
    <form action={accion} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <input type="hidden" name="tramiteId" value={tramiteId} />
      {/* Campo trampa para bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          No llenar este campo
          <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="space-y-6">
        {estado.estado === "error" && (
          <div ref={resumenRef} tabIndex={-1} className="outline-none">
            <Alert variant="destructive" className="rounded-2xl">
              <AlertCircle />
              <AlertTitle>No pudimos enviar tu evaluación</AlertTitle>
              <AlertDescription>
                <p>{estado.mensaje}</p>
                {Object.keys(errores).some((c) => CAMPOS[c]) && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {Object.keys(errores)
                      .filter((c) => CAMPOS[c])
                      .map((c) => (
                        <li key={c}>
                          <a href={`#${CAMPOS[c].ancla}`} className="font-semibold underline underline-offset-2">
                            {CAMPOS[c].nombre}
                          </a>
                        </li>
                      ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Seccion
          id="titulo-calificaciones"
          numero="Obligatorio"
          titulo={
            <>
              Califica tu experiencia <span className="sr-only">(obligatorio)</span>
            </>
          }
          descripcion="Una estrella es muy malo; cinco es excelente."
        >
          <div className="space-y-3">
            {DIMENSIONES.map((d, i) => (
              <CalificacionEstrellas
                key={d.clave}
                numero={i + 1}
                nombre={d.clave}
                titulo={d.titulo}
                pregunta={d.pregunta}
                valor={calificaciones[d.clave]}
                onCambio={(v) => setCalificaciones((c) => ({ ...c, [d.clave]: v }))}
                error={calificaciones[d.clave] ? undefined : errores[d.clave]?.[0]}
              />
            ))}
          </div>
        </Seccion>

        <Seccion id="titulo-adicional" numero="Opcional" titulo="Cuéntanos un poco más" descripcion="Cada respuesta ayuda a ubicar qué mejorar.">
          <div className="space-y-8">
            <fieldset>
              <legend className="font-semibold text-navy">¿Cómo realizaste el trámite?</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {CANALES.map((c) => (
                  <Opcion key={c.valor} type="radio" name="canal" value={c.valor} checked={canal === c.valor} onChange={() => setCanal(c.valor)}>
                    {c.etiqueta}
                  </Opcion>
                ))}
              </div>
            </fieldset>

            <fieldset id="campo-problemas" aria-describedby={errores.problemas ? "error-problemas" : undefined}>
              <legend className="font-semibold text-navy">¿Enfrentaste alguno de estos problemas?</legend>
              <p className="mt-1 text-sm text-muted-foreground">Puedes marcar varios.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PROBLEMAS.map((p) => (
                  <Opcion
                    key={p.valor}
                    type="checkbox"
                    name="problemas"
                    value={p.valor}
                    checked={problemas.includes(p.valor)}
                    onChange={() => alternarProblema(p.valor)}
                  >
                    {p.etiqueta}
                  </Opcion>
                ))}
                <Opcion
                  type="checkbox"
                  name="problemas"
                  value={PROBLEMA_NINGUNO.valor}
                  checked={problemas.includes(PROBLEMA_NINGUNO.valor)}
                  onChange={() => alternarProblema(PROBLEMA_NINGUNO.valor)}
                >
                  {PROBLEMA_NINGUNO.etiqueta}
                </Opcion>
              </div>
              {errores.problemas && (
                <p id="error-problemas" className="mt-2 text-sm font-medium text-destructive">
                  {errores.problemas[0]}
                </p>
              )}
            </fieldset>

            <fieldset>
              <legend className="font-semibold text-navy">
                ¿Alguna persona te pidió o sugirió un pago no oficial para agilizar o resolver tu trámite?
              </legend>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu respuesta es anónima y sólo se usa en estadísticas agregadas. Esta encuesta no es un canal de denuncia.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {OPCIONES_PAGO_INDEBIDO.map((o) => (
                  <Opcion key={o.valor} type="radio" name="pagoIndebido" value={o.valor} checked={pago === o.valor} onChange={() => setPago(o.valor)}>
                    {o.etiqueta}
                  </Opcion>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="comentario" className="font-semibold text-navy">
                Comentario
              </label>
              <p id="ayuda-comentario" className="mt-1 text-sm text-muted-foreground">
                No escribas nombres, CURP, teléfonos, correos ni números de expediente. Los comentarios se revisan antes de
                publicarse.
              </p>
              <Textarea
                id="comentario"
                name="comentario"
                className="mt-3 min-h-32 rounded-2xl bg-muted/40 px-4 py-3 focus-visible:bg-card"
                maxLength={MAX_COMENTARIO}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                aria-describedby={`ayuda-comentario contador-comentario${errores.comentario ? " error-comentario" : ""}`}
                aria-invalid={errores.comentario ? true : undefined}
                placeholder="¿Qué funcionó bien? ¿Qué podría mejorar?"
              />
              <div className="mt-1.5 flex justify-between gap-4 text-xs">
                <span id="error-comentario" className="font-medium text-destructive">
                  {errores.comentario?.[0]}
                </span>
                <span
                  id="contador-comentario"
                  className={cn(
                    "tabular transition-colors",
                    comentario.length >= MAX_COMENTARIO * 0.9 ? "font-semibold text-orange-ink" : "text-muted-foreground",
                  )}
                >
                  {comentario.length} / {MAX_COMENTARIO}
                </span>
              </div>
            </div>
          </div>
        </Seccion>

        <section className="rounded-[1.75rem] border border-border/70 bg-card p-5 sm:p-8">
          <label className="flex cursor-pointer items-start gap-3 text-[15px]">
            <input
              type="checkbox"
              id="acepta-privacidad"
              name="aceptaPrivacidad"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              aria-invalid={errorPrivacidad ? true : undefined}
              aria-describedby={errorPrivacidad ? "error-privacidad" : undefined}
              className="mt-0.5 size-5 shrink-0 accent-[var(--brand-teal-ink)]"
            />
            <span className="leading-relaxed text-navy">
              Leí el{" "}
              <Link href="/privacidad" target="_blank" className="font-semibold text-primary-ink underline underline-offset-2">
                aviso de privacidad
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </Link>{" "}
              y entiendo que mi evaluación es voluntaria y anónima. <span className="text-destructive" aria-hidden="true">*</span>
            </span>
          </label>
          {errorPrivacidad && (
            <p id="error-privacidad" className="mt-2 pl-8 text-sm font-medium text-destructive">
              {errorPrivacidad}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden="true" /> No guardamos tu IP ni datos que te identifiquen.
            </p>
            <Button type="submit" size="lg" className="rounded-full px-7" disabled={enviando} aria-busy={enviando || undefined}>
              {enviando ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              {enviando ? "Enviando…" : "Enviar evaluación"}
            </Button>
          </div>
        </section>
      </div>

      {/* Progreso (escritorio): fijo al costado mientras se responde */}
      <aside aria-label="Tu progreso" className="hidden lg:sticky lg:top-24 lg:block">
        <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card">
          <div className="bg-[linear-gradient(160deg,#06363b,#0a5155)] p-6 text-white">
            <p className="text-sm text-white/70">Tu calificación hasta ahora</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="tabular font-display text-5xl font-semibold tracking-[-0.03em]">{formatearPromedio(tuPromedio)}</span>
              <span className="text-white/60">/ 5</span>
            </p>
            <span
              className="mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold transition-colors duration-300"
              style={tuPromedio == null ? { background: "rgb(255 255 255 / 0.1)" } : { background: color.fondo, color: color.texto }}
            >
              {tuPromedio == null ? "Empieza por las estrellas" : veredicto(tuPromedio).etiqueta}
            </span>
          </div>
          <ol className="space-y-1 p-3">
            {pasos.map((p) => (
              <li key={p.ancla}>
                <a href={`#${p.ancla}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300",
                      p.hecho ? "border-primary bg-primary text-white" : "border-input",
                    )}
                  >
                    {p.hecho && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className={cn(p.hecho ? "font-medium text-navy" : "text-muted-foreground")}>{p.titulo}</span>
                  <span className="sr-only">{p.hecho ? "(listo)" : "(pendiente)"}</span>
                </a>
              </li>
            ))}
          </ol>
          <div className="border-t p-4">
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={enviando}>
              {enviando
                ? "Enviando…"
                : listo
                  ? "Enviar evaluación"
                  : (() => {
                      const faltan = 4 - completas + (acepta ? 0 : 1);
                      return `${faltan === 1 ? "Falta 1 paso" : `Faltan ${faltan} pasos`}`;
                    })()}
            </Button>
          </div>
        </div>
      </aside>
    </form>
  );
}
