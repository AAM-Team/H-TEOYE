"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ClipboardCheck, ExternalLink, Megaphone, RotateCcw, SendHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const URL_DENUNCIAS = "https://denuncias.hermosillo.gob.mx/";

type Mensaje = { rol: "usuario" | "asistente"; texto: string; error?: boolean };

const BIENVENIDA =
  "¡Hola! Soy **Sol**, el asistente de H-TEOYE. Puedo ayudarte a:\n- Conocer requisitos, costos y horarios de los trámites del Ayuntamiento de Hermosillo.\n- Evaluar la atención que recibiste en un trámite.\n- Llegar al sistema oficial de quejas y denuncias.\n\n¿En qué te ayudo?";

const SUGERENCIAS = [
  "¿Qué necesito para una licencia de construcción?",
  "¿Cómo pago el predial?",
  "Quiero evaluar un trámite",
  "Quiero denunciar a un servidor público",
];

/* ---------- Render de Markdown mínimo (negritas, enlaces, listas) ---------- */

function Enlace({ href, children }: { href: string; children: ReactNode }) {
  const clase = "font-semibold text-teal-ink underline decoration-teal/40 underline-offset-2 hover:decoration-teal";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={clase}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(clase, "inline-flex items-baseline gap-0.5")}>
      {children}
      <ExternalLink className="size-3 shrink-0 self-center" aria-hidden="true" />
      <span className="sr-only">(se abre en otra pestaña)</span>
    </a>
  );
}

function enLinea(texto: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const patron = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)<]+[^\s).,;:<])/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = patron.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    if (m[1]) partes.push(<Enlace key={m.index} href={m[2]}>{m[1]}</Enlace>);
    else if (m[3]) partes.push(<strong key={m.index} className="font-semibold">{m[3]}</strong>);
    else if (m[4]) partes.push(<Enlace key={m.index} href={m[4]}>{m[4].replace(/^https?:\/\//, "").replace(/\/$/, "")}</Enlace>);
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

function Markdown({ texto }: { texto: string }) {
  const bloques: ReactNode[] = [];
  let lista: { ordenada: boolean; items: string[] } | null = null;
  const cerrarLista = () => {
    if (!lista) return;
    const Tag = lista.ordenada ? "ol" : "ul";
    bloques.push(
      <Tag key={bloques.length} className={cn("space-y-1 pl-5", lista.ordenada ? "list-decimal" : "list-disc marker:text-orange")}>
        {lista.items.map((it, i) => (
          <li key={i}>{enLinea(it)}</li>
        ))}
      </Tag>,
    );
    lista = null;
  };
  for (const cruda of texto.split("\n")) {
    const linea = cruda.trim();
    const vineta = linea.match(/^[-*•]\s+(.*)$/);
    const numero = linea.match(/^\d+[.)]\s+(.*)$/);
    if (vineta || numero) {
      const ordenada = Boolean(numero);
      if (lista && lista.ordenada !== ordenada) cerrarLista();
      lista ??= { ordenada, items: [] };
      lista.items.push((vineta ?? numero)![1]);
      continue;
    }
    cerrarLista();
    if (!linea) continue;
    if (/^([-*_])\1{2,}$/.test(linea)) {
      bloques.push(<hr key={bloques.length} className="border-border" />);
      continue;
    }
    const titulo = linea.match(/^#{1,4}\s+(.*)$/);
    bloques.push(
      <p key={bloques.length} className={titulo ? "font-semibold text-navy" : undefined}>
        {enLinea(titulo ? titulo[1] : linea)}
      </p>,
    );
  }
  cerrarLista();
  return <div className="space-y-2">{bloques.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}

/* ---------- Componente ---------- */

export function AsistenteFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [borrador, setBorrador] = useState("");
  const [pensando, setPensando] = useState(false);
  const controlador = useRef<AbortController | null>(null);
  const lista = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idTitulo = useId();

  const cerrar = useCallback(() => {
    setAbierto(false);
    boton.current?.focus();
  }, []);

  useEffect(() => {
    if (!abierto) return;
    entrada.current?.focus();
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [abierto, cerrar]);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, pensando]);

  useEffect(() => () => controlador.current?.abort(), []);

  async function enviar(texto: string) {
    const limpio = texto.trim();
    if (!limpio || pensando) return;
    const historial: Mensaje[] = [...mensajes.filter((m) => !m.error), { rol: "usuario", texto: limpio }];
    setMensajes(historial);
    setBorrador("");
    setPensando(true);

    controlador.current?.abort();
    const ctrl = new AbortController();
    controlador.current = ctrl;

    try {
      const r = await fetch("/api/asistente", {
        method: "POST",
        headers: { "content-type": "application/json", "x-hteoye-asistente": "1" },
        body: JSON.stringify({ mensajes: historial.map(({ rol, texto }) => ({ rol, texto })) }),
        signal: ctrl.signal,
      });
      if (!r.ok || !r.body) {
        const err = await r.json().catch(() => null);
        throw new Error(err?.error ?? "No pude responder en este momento.");
      }
      const lector = r.body.pipeThrough(new TextDecoderStream()).getReader();
      let respuesta = "";
      setMensajes((m) => [...m, { rol: "asistente", texto: "" }]);
      while (true) {
        const { value, done } = await lector.read();
        if (done) break;
        respuesta += value;
        setPensando(false);
        setMensajes((m) => [...m.slice(0, -1), { rol: "asistente", texto: respuesta }]);
      }
      if (!respuesta.trim()) throw new Error("No recibí respuesta. Intenta reformular tu pregunta.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setMensajes((m) => [
        ...m.filter((x) => !(x.rol === "asistente" && !x.texto)),
        { rol: "asistente", texto: (e as Error).message, error: true },
      ]);
    } finally {
      if (controlador.current === ctrl) setPensando(false);
    }
  }

  function reiniciar() {
    controlador.current?.abort();
    setMensajes([]);
    setPensando(false);
    entrada.current?.focus();
  }

  return (
    <>
      {/* Ventana del chat */}
      <section
        role="dialog"
        aria-modal="false"
        aria-labelledby={idTitulo}
        hidden={!abierto}
        className={cn(
          "asistente-panel fixed z-50 flex-col",
          abierto ? "flex" : "hidden",
          " overflow-hidden rounded-[1.5rem] border border-border bg-card text-card-foreground shadow-[0_24px_60px_-12px_rgba(6,38,43,0.45)]",
          "inset-x-3 bottom-3 top-20 sm:inset-x-auto sm:right-6 sm:bottom-28 sm:top-auto sm:h-[min(620px,calc(100dvh-9rem))] sm:w-[400px]",
        )}
      >
        <header className="flex items-center gap-3 bg-navy-deep px-4 py-3 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca/sol-asistente.svg" alt="" className="size-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 id={idTitulo} className="font-display text-base font-semibold leading-tight">
              Sol · Asistente H-TEOYE
            </h2>
            <p className="truncate text-xs text-white/70">Trámites, evaluaciones y denuncias</p>
          </div>
          {mensajes.length > 0 && (
            <button
              type="button"
              onClick={reiniciar}
              className="presionable rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Nueva conversación"
              title="Nueva conversación"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={cerrar}
            className="presionable rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar asistente"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div ref={lista} className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-background px-4 py-4" aria-live="polite">
          <Burbuja rol="asistente">
            <Markdown texto={BIENVENIDA} />
          </Burbuja>

          {mensajes.length === 0 && (
            <div className="flex flex-wrap gap-2 pl-1">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="presionable rounded-full border border-teal/30 bg-card px-3 py-1.5 text-left text-xs font-medium text-teal-ink hover:border-teal hover:bg-teal-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {mensajes.map((m, i) =>
            m.rol === "asistente" && !m.texto ? null : (
              <Burbuja key={i} rol={m.rol} error={m.error}>
                {m.rol === "usuario" ? <p className="whitespace-pre-wrap">{m.texto}</p> : <Markdown texto={m.texto} />}
              </Burbuja>
            ),
          )}

          {pensando && (
            <Burbuja rol="asistente">
              <span className="flex items-center gap-1 py-1" aria-label="Sol está escribiendo">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="asistente-punto size-2 rounded-full bg-orange" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
            </Burbuja>
          )}
        </div>

        <div className="border-t border-border bg-card px-3 pb-3 pt-2">
          <div className="mb-2 flex gap-2">
            <Link
              href="/dependencias"
              className="presionable inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-teal-soft px-3 py-1.5 text-xs font-semibold text-teal-ink hover:bg-teal/15"
            >
              <ClipboardCheck className="size-3.5" aria-hidden="true" /> Evaluar trámite
            </Link>
            <a
              href={URL_DENUNCIAS}
              target="_blank"
              rel="noopener noreferrer"
              className="presionable inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-orange-soft px-3 py-1.5 text-xs font-semibold text-orange-ink hover:bg-orange/15"
            >
              <Megaphone className="size-3.5" aria-hidden="true" /> Quejas y denuncias
              <span className="sr-only">(se abre en otra pestaña)</span>
            </a>
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(borrador);
            }}
          >
            <label htmlFor="asistente-entrada" className="sr-only">
              Escribe tu pregunta
            </label>
            <textarea
              id="asistente-entrada"
              ref={entrada}
              rows={1}
              maxLength={1000}
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  enviar(borrador);
                }
              }}
              placeholder="Pregunta por un trámite…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:text-sm"
            />
            <button
              type="submit"
              disabled={!borrador.trim() || pensando}
              className="presionable flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-ink text-white hover:bg-navy disabled:opacity-40"
              aria-label="Enviar"
            >
              <SendHorizontal className="size-5" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            No compartas datos personales. Información del portal de trámites de Hermosillo.
          </p>
        </div>
      </section>

      {/* Botón flotante con el sol */}
      <button
        ref={boton}
        type="button"
        onClick={() => (abierto ? cerrar() : setAbierto(true))}
        aria-expanded={abierto}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente: pregunta por trámites, evaluaciones o denuncias"}
        className={cn(
          "asistente-boton group fixed bottom-4 right-4 z-50 size-20 rounded-full sm:bottom-6 sm:right-6",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/50",
          abierto && "max-sm:hidden",
        )}
      >
        {!abierto && (
          <span className="pointer-events-none absolute right-full top-1/2 mr-2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-navy-deep px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 sm:block">
            ¿Te ayudo con un trámite?
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marca/sol-asistente.svg" alt="" className="size-full drop-shadow-[0_6px_14px_rgba(239,121,0,0.45)]" />
        {abierto && (
          <span className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-navy-deep/85 text-white">
            <X className="size-5" aria-hidden="true" />
          </span>
        )}
      </button>
    </>
  );
}

function Burbuja({ rol, error, children }: { rol: Mensaje["rol"]; error?: boolean; children: ReactNode }) {
  const usuario = rol === "usuario";
  return (
    <div className={cn("flex", usuario ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          usuario
            ? "rounded-br-md bg-teal-ink text-white"
            : error
              ? "rounded-bl-md border border-destructive/30 bg-destructive/5 text-destructive"
              : "rounded-bl-md border border-border bg-card text-card-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
