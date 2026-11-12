"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, Lock, Send } from "lucide-react";
import { enviarEvaluacion, type EstadoEnvio } from "@/app/(portal)/evaluar/acciones";
import { CalificacionEstrellas } from "@/components/encuesta/calificacion-estrellas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CANALES,
  DIMENSIONES,
  MAX_COMENTARIO,
  MAX_PROBLEMA_OTRO,
  OPCIONES_PAGO_INDEBIDO,
  PROBLEMA_NINGUNO,
  PROBLEMAS_POR_CANAL,
  type ClaveCanal,
  type ClaveDimension,
} from "@/lib/constantes";
import { colorCalificacion, veredicto } from "@/lib/escala";
import { cn, formatearPromedio } from "@/lib/utils";

const estadoInicial: EstadoEnvio = { estado: "inicial" };

/** Destino y nombre de cada campo, para enlazar el resumen de errores con el campo a corregir. */
const CAMPOS: Record<string, { ancla: string; nombre: string }> = {
  folio: { ancla: "folio", nombre: "Folio del trámite" },
  canal: { ancla: "campo-canal", nombre: "Cómo realizaste el trámite" },
  ...Object.fromEntries(DIMENSIONES.map((d) => [d.clave, { ancla: `campo-${d.clave}`, nombre: d.titulo }])),
  problemas: { ancla: "campo-problemas", nombre: "Problemas que enfrentaste" },
  problemaOtro: { ancla: "problema-otro", nombre: "Descripción del otro problema" },
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

/** Modalidad oficial del trámite → modalidad sugerida en la encuesta (la persona puede cambiarla). */
const CANAL_SUGERIDO: Record<string, ClaveCanal> = { VENTANILLA: "PRESENCIAL", EN_LINEA: "EN_LINEA" };

export function FormularioEncuesta({ tramiteId, modalidad }: { tramiteId: string; modalidad?: string | null }) {
  const [estado, accion, enviando] = useActionState(enviarEvaluacion, estadoInicial);
  const [calificaciones, setCalificaciones] = useState<Record<ClaveDimension, number | null>>(
    () => Object.fromEntries(DIMENSIONES.map((d) => [d.clave, null])) as Record<ClaveDimension, number | null>,
  );
  const [canal, setCanalElegido] = useState<ClaveCanal | "">((modalidad && CANAL_SUGERIDO[modalidad]) || "");
  const [problemas, setProblemas] = useState<string[]>([]);
  const [problemaOtro, setProblemaOtro] = useState("");
  const [pago, setPago] = useState<string>("");
  const [comentario, setComentario] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [folio, setFolio] = useState("");
  const [folioConError, setFolioConError] = useState<string | null>(null);
  const resumenRef = useRef<HTMLDivElement>(null);

  const errores = estado.estado === "error" ? estado.errores ?? {} : {};
  // Cada error desaparece en cuanto la persona corrige el campo.
  const errorPrivacidad = acepta ? undefined : errores.aceptaPrivacidad?.[0];
  // El error del folio se oculta en cuanto la persona cambia el folio que causó el error.
  const errorFolio = folio === folioConError ? errores.folio?.[0] : undefined;
  const folioListo = folio.trim().length >= 4;
  const valores = Object.values(calificaciones).filter((v): v is number => v != null);
  const completas = valores.length;
  const tuPromedio = completas ? valores.reduce((a, b) => a + b, 0) / completas : null;
  const opcionales = [problemas.length ? "x" : "", pago, comentario.trim()].filter(Boolean).length;
  const listo = folioListo && canal !== "" && completas === DIMENSIONES.length && acepta;
  const problemasDelCanal = canal ? PROBLEMAS_POR_CANAL[canal] : [];
  const marcoOtro = problemas.includes("OTRO");
  const errorCanal = canal ? undefined : errores.canal?.[0];
  const errorOtro = errores.problemaOtro && problemaOtro.trim().length < 3 ? errores.problemaOtro[0] : undefined;

  /** Al cambiar de modalidad se quitan los problemas que no aplican a la nueva. */
  function setCanal(nuevo: ClaveCanal) {
    setCanalElegido(nuevo);
    const validos = new Set<string>([PROBLEMA_NINGUNO.valor, ...PROBLEMAS_POR_CANAL[nuevo].map((p) => p.valor)]);
    setProblemas((actual) => actual.filter((p) => validos.has(p)));
  }

  useEffect(() => {
    if (estado.estado === "error") resumenRef.current?.focus();
  }, [estado]);

  // Recuerda con qué folio se produjo el error, para mostrarlo hasta que lo corrija.
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    setFolioConError(estado.estado === "error" && estado.errores?.folio ? folio : null);
  }

  function alternarProblema(valor: string) {
    setProblemas((actual) => {
      if (valor === PROBLEMA_NINGUNO.valor) return actual.includes(valor) ? [] : [valor];
      const sinNinguno = actual.filter((p) => p !== PROBLEMA_NINGUNO.valor);
      return sinNinguno.includes(valor) ? sinNinguno.filter((p) => p !== valor) : [...sinNinguno, valor];
    });
  }

  const pasos = [
    { ancla: "folio", titulo: "Folio del trámite", hecho: folioListo },
    { ancla: "campo-canal", titulo: "Cómo realizaste el trámite", hecho: canal !== "" },
    ...DIMENSIONES.map((d) => ({
      ancla: `campo-${d.clave}`,
      titulo: (canal && d.titulos?.[canal]) || d.titulo,
      hecho: calificaciones[d.clave] != null,
    })),
    { ancla: "titulo-adicional", titulo: `Detalles opcionales (${opcionales} de 3)`, hecho: opcionales > 0, opcional: true },
    { ancla: "acepta-privacidad", titulo: "Aviso de privacidad", hecho: acepta },
  ];
  const color = colorCalificacion(tuPromedio);

  return (
    <form
      action={accion}
      // Con JavaScript se envía manualmente: así React no vacía el formulario cuando el servidor
      // rechaza el envío (p. ej. folio repetido) y la persona no pierde sus respuestas.
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        startTransition(() => accion(datos));
      }}
      noValidate
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
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
          id="titulo-folio"
          numero="Obligatorio"
          titulo={
            <>
              Folio de tu trámite <span className="sr-only">(obligatorio)</span>
            </>
          }
          descripcion="Lo encuentras en tu comprobante, recibo, solicitud o en el correo de confirmación del trámite."
        >
          <label htmlFor="folio" className="font-semibold text-navy">
            Folio del trámite o servicio <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <p id="ayuda-folio" className="mt-1 text-sm text-muted-foreground">
            Escríbelo tal como aparece (por ejemplo, HMO-2026-001234). Cada folio sólo se puede evaluar una vez. La
            dependencia puede usarlo para verificar tu evaluación; nunca se publica.
          </p>
          <Input
            id="folio"
            name="folio"
            value={folio}
            onChange={(e) => setFolio(e.target.value.toUpperCase())}
            required
            minLength={4}
            maxLength={40}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Ej. HMO-2026-001234"
            aria-required="true"
            aria-invalid={errorFolio ? true : undefined}
            aria-describedby={`ayuda-folio${errorFolio ? " error-folio" : ""}`}
            className="mt-3 h-12 max-w-md rounded-2xl bg-muted/40 px-4 font-mono text-base tracking-wide uppercase focus-visible:bg-card"
          />
          {errorFolio && (
            <p id="error-folio" className="mt-2 text-sm font-medium text-destructive">
              {errorFolio}
            </p>
          )}
        </Seccion>

        <Seccion
          id="titulo-canal"
          numero="Obligatorio"
          titulo={
            <>
              ¿Cómo realizaste el trámite? <span className="sr-only">(obligatorio)</span>
            </>
          }
          descripcion="Así te hacemos las preguntas que corresponden a tu experiencia."
        >
          <fieldset id="campo-canal" aria-describedby={errorCanal ? "error-canal" : undefined}>
            <legend className="sr-only">Modalidad del trámite</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {CANALES.map((c) => (
                <Opcion key={c.valor} type="radio" name="canal" value={c.valor} checked={canal === c.valor} onChange={() => setCanal(c.valor)}>
                  <span className="flex flex-col">
                    {c.etiqueta}
                    <span className="text-xs font-normal text-muted-foreground">{c.detalle}</span>
                  </span>
                </Opcion>
              ))}
            </div>
            {errorCanal && (
              <p id="error-canal" className="mt-2 text-sm font-medium text-destructive">
                {errorCanal}
              </p>
            )}
          </fieldset>
        </Seccion>

        <Seccion
          id="titulo-calificaciones"
          numero="Obligatorio"
          titulo={
            <>
              Califica tu experiencia <span className="sr-only">(obligatorio)</span>
            </>
          }
          descripcion={
            canal
              ? "Una estrella es muy malo; cinco es excelente."
              : "Una estrella es muy malo; cinco es excelente. Elige arriba cómo hiciste el trámite para ver las preguntas que te corresponden."
          }
        >
          <div className="space-y-3">
            {DIMENSIONES.map((d, i) => (
              <CalificacionEstrellas
                key={d.clave}
                numero={i + 1}
                nombre={d.clave}
                titulo={(canal && d.titulos?.[canal]) || d.titulo}
                pregunta={canal ? d.preguntas[canal] : d.pregunta}
                valor={calificaciones[d.clave]}
                onCambio={(v) => setCalificaciones((c) => ({ ...c, [d.clave]: v }))}
                error={calificaciones[d.clave] ? undefined : errores[d.clave]?.[0]}
              />
            ))}
          </div>
        </Seccion>

        <Seccion id="titulo-adicional" numero="Opcional" titulo="Cuéntanos un poco más" descripcion="Cada respuesta ayuda a ubicar qué mejorar.">
          <div className="space-y-8">
            <fieldset id="campo-problemas" aria-describedby={errores.problemas ? "error-problemas" : undefined}>
              <legend className="font-semibold text-navy">¿Enfrentaste alguno de estos problemas?</legend>
              <p className="mt-1 text-sm text-muted-foreground">
                {canal ? "Puedes marcar varios." : "Elige primero cómo realizaste el trámite para ver los problemas que aplican."}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {problemasDelCanal.map((p) => (
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
              {marcoOtro && (
                <div className="mt-3">
                  <label htmlFor="problema-otro" className="text-sm font-semibold text-navy">
                    Describe el otro problema <span className="text-destructive" aria-hidden="true">*</span>
                  </label>
                  <Input
                    id="problema-otro"
                    name="problemaOtro"
                    value={problemaOtro}
                    onChange={(e) => setProblemaOtro(e.target.value)}
                    maxLength={MAX_PROBLEMA_OTRO}
                    autoComplete="off"
                    placeholder="Ej. el sistema pedía un dato que no tenía"
                    aria-required="true"
                    aria-invalid={errorOtro ? true : undefined}
                    aria-describedby="ayuda-problema-otro"
                    className="mt-2 h-11 rounded-2xl bg-muted/40 px-4 focus-visible:bg-card"
                  />
                  <p id="ayuda-problema-otro" className="mt-1.5 flex justify-between gap-4 text-xs text-muted-foreground">
                    <span className={errorOtro ? "font-medium text-destructive" : undefined}>
                      {errorOtro ?? "Sin nombres ni datos personales."}
                    </span>
                    <span className="tabular">
                      {problemaOtro.length} / {MAX_PROBLEMA_OTRO}
                    </span>
                  </p>
                </div>
              )}
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
              y entiendo que mi evaluación es voluntaria y que el folio sólo se usa para verificarla y evitar duplicados. <span className="text-destructive" aria-hidden="true">*</span>
            </span>
          </label>
          {errorPrivacidad && (
            <p id="error-privacidad" className="mt-2 pl-8 text-sm font-medium text-destructive">
              {errorPrivacidad}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden="true" /> No guardamos tu IP. El folio no se publica.
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
                      const faltan = DIMENSIONES.length - completas + (acepta ? 0 : 1) + (folioListo ? 0 : 1) + (canal ? 0 : 1);
                      return `${faltan === 1 ? "Falta 1 paso" : `Faltan ${faltan} pasos`}`;
                    })()}
            </Button>
          </div>
        </div>
      </aside>
    </form>
  );
}
