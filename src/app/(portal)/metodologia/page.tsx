import type { Metadata } from "next";
import {
  BadgeCheck,
  Check,
  Eraser,
  FileText,
  Hourglass,
  Lock,
  MessageSquareText,
  Route,
  Smile,
  Star,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { EncabezadoPagina } from "@/components/portal/encabezado-pagina";
import { DIMENSIONES, PROBLEMAS, type ClaveDimension } from "@/lib/constantes";
import { DEGRADADO, colorCalificacion, veredicto } from "@/lib/escala";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Metodología",
  description: "Qué mide H-TEOYE, cómo se calculan sus indicadores y cómo deben interpretarse.",
};

const SECCIONES = [
  { id: "que-mide", titulo: "Qué mide" },
  { id: "calculo", titulo: "Cómo se calcula" },
  { id: "colores", titulo: "Cómo leer los colores" },
  { id: "alcance", titulo: "Alcance y limitaciones" },
  { id: "comentarios", titulo: "Revisión de comentarios" },
  { id: "contexto", titulo: "Por qué importa" },
  { id: "fuentes", titulo: "Fuentes" },
];

const ICONO_DIMENSION: Record<ClaveDimension, LucideIcon> = {
  trato: UserRound,
  claridad: FileText,
  facilidad: Route,
  satisfaccion: Smile,
};

/** Cifras de contexto citadas textualmente de sus fuentes. */
const CONTEXTO = [
  {
    cifra: "39.1 %",
    texto:
      "de los trámites realizados en zonas urbanas del país durante 2025 presentaron algún problema para la persona usuaria, como largas filas, requisitos no exhibidos u horarios restringidos.",
    fuente: "INEGI, ENCIG 2025",
  },
  {
    cifra: "23.7 %",
    texto: "de las personas en Hermosillo realizó algún trámite con el gobierno municipal en el último año.",
    fuente: "Hermosillo ¿Cómo Vamos?, Encuesta de Percepción Ciudadana 2025",
  },
  {
    cifra: "58.1 %",
    texto: "de las personas en Hermosillo considera que el gobierno municipal es poco o nada transparente en la toma de decisiones.",
    fuente: "Hermosillo ¿Cómo Vamos?, Encuesta de Percepción Ciudadana 2025",
  },
  {
    cifra: "34.1 %",
    texto:
      "de quienes fueron detenidos por policía preventiva o de tránsito en Hermosillo reconoció haber dado dinero para evitar una infracción.",
    fuente: "Hermosillo ¿Cómo Vamos?, Encuesta de Percepción Ciudadana 2025",
  },
];

const RANGOS = [
  { desde: 4.2, texto: "4.2 a 5.0", ejemplo: 4.5 },
  { desde: 3.7, texto: "3.7 a 4.1", ejemplo: 3.9 },
  { desde: 3.0, texto: "3.0 a 3.6", ejemplo: 3.3 },
  { desde: 2.3, texto: "2.3 a 2.9", ejemplo: 2.6 },
  { desde: 1.0, texto: "1.0 a 2.2", ejemplo: 1.6 },
];

const RECORRIDO = [
  { icono: Eraser, t: "Limpieza automática", d: "Se borran patrones de datos personales: teléfonos, correos, CURP y folios." },
  { icono: Hourglass, t: "Queda pendiente", d: "El comentario no es visible para nadie fuera del equipo autorizado." },
  { icono: BadgeCheck, t: "Revisión humana", d: "Una persona autorizada lo aprueba o lo rechaza. La decisión queda en bitácora." },
  { icono: MessageSquareText, t: "Se publica", d: "Sólo los comentarios aprobados pueden mostrarse en el portal." },
];

function Titulo({ id, rotulo, children }: { id: string; rotulo: string; children: React.ReactNode }) {
  return (
    <div className="scroll-mt-28" id={id}>
      <p className="rotulo text-primary-ink">{rotulo}</p>
      <h2 className="mt-2 text-3xl font-semibold text-navy sm:text-4xl">{children}</h2>
    </div>
  );
}

function Estrellas({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("size-4", i <= n ? "fill-orange text-orange" : "fill-transparent text-input")} strokeWidth={1.6} />
      ))}
    </span>
  );
}

const tarjeta = "rounded-[1.5rem] border border-border/70 bg-card p-6 shadow-[0_1px_2px_rgb(29_47_59/0.04)]";

export default function MetodologiaPage() {
  return (
    <>
      <EncabezadoPagina
        postal
        migas={[{ href: "/", etiqueta: "Inicio" }, { etiqueta: "Metodología" }]}
        rotulo={<span className="rotulo text-orange">Transparencia</span>}
        titulo="Cómo medimos la atención"
        descripcion="Qué preguntamos, cómo se calcula cada número y qué puede —y qué no puede— decirte este tablero."
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-8 lg:py-20">
        <nav aria-label="En esta página" className="hidden lg:block">
          <div className="sticky top-28">
            <p className="text-xs font-semibold text-muted-foreground">En esta página</p>
            <ul className="mt-3 space-y-1 border-l">
              {SECCIONES.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-navy"
                  >
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="min-w-0 space-y-20">
          {/* Qué mide */}
          <section aria-labelledby="que-mide">
            <Titulo id="que-mide" rotulo="Cuatro preguntas obligatorias">
              Qué mide
            </Titulo>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              La percepción de las personas sobre la <strong className="text-navy">calidad de la atención</strong> que
              recibieron al hacer un trámite municipal, en una escala de 1 a 5 estrellas.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {DIMENSIONES.map((d) => {
                const Icono = ICONO_DIMENSION[d.clave];
                return (
                  <li key={d.clave} className={tarjeta}>
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">
                      <Icono className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-xl font-semibold text-navy">{d.titulo}</h3>
                    <p className="mt-1.5 text-muted-foreground">{d.pregunta}</p>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 rounded-[1.5rem] bg-muted/70 p-6">
              <p className="font-semibold text-navy">Y tres preguntas opcionales</p>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {["Canal de atención", "Problemas que enfrentó", "Si le pidieron un pago no oficial"].map((x) => (
                  <li key={x} className="rounded-full bg-card px-3 py-1.5 font-medium text-navy">
                    {x}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Las categorías de problemas retoman las barreras que mide la ENCIG del INEGI:{" "}
                {PROBLEMAS.map((p) => p.etiqueta.toLowerCase()).join(", ")}.
              </p>
            </div>
          </section>

          {/* Cálculo */}
          <section aria-labelledby="calculo">
            <Titulo id="calculo" rotulo="Con ejemplos">
              Cómo se calcula cada número
            </Titulo>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <article className={tarjeta}>
                <h3 className="text-lg font-semibold text-navy">Promedio por aspecto</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">La media de todas las calificaciones de 1 a 5.</p>
                <div className="mt-5 space-y-2 rounded-2xl bg-muted/60 p-4">
                  {[4, 5, 3].map((n, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Persona {i + 1}</span>
                      <Estrellas n={n} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                    <span className="font-medium text-navy">(4 + 5 + 3) ÷ 3</span>
                    <span className="tabular font-display text-2xl font-semibold text-navy">4.0</span>
                  </div>
                </div>
              </article>

              <article className={tarjeta}>
                <h3 className="text-lg font-semibold text-navy">Porcentaje de satisfechos</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Quienes calificaron la satisfacción general con 4 o 5 estrellas.
                </p>
                <div className="mt-5 rounded-2xl bg-muted/60 p-4">
                  <div className="grid grid-cols-10 gap-1.5" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span key={i} className="aspect-square rounded-full" style={{ background: i < 6 ? "#3b9f5a" : "#c4cfd4" }} />
                    ))}
                  </div>
                  <p className="mt-3 flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">6 de cada 10 dieron 4 o 5</span>
                    <span className="tabular font-display text-2xl font-semibold text-navy">60 %</span>
                  </p>
                </div>
              </article>

              <article className={tarjeta}>
                <h3 className="text-lg font-semibold text-navy">Problemas reportados</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Porcentaje de quienes respondieron esa pregunta. Cada persona puede marcar varios, así que no suman 100 %.
                </p>
              </article>

              <article className={tarjeta}>
                <h3 className="text-lg font-semibold text-navy">Pagos no oficiales</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Respuestas «Sí» entre quienes contestaron «Sí» o «No». No se cuenta a quien prefirió no responder.
                </p>
              </article>
            </div>

            <div className="mt-4 flex items-start gap-4 rounded-[1.5rem] border border-primary/25 bg-primary-soft/60 p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                <Lock className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-navy">Mínimo de 5 evaluaciones</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Un grupo con menos de 5 opiniones no se publica: aparece como «—». Así nadie puede adivinar quién
                  respondió y se evitan conclusiones con muy pocos datos.
                </p>
              </div>
            </div>
          </section>

          {/* Colores */}
          <section aria-labelledby="colores">
            <Titulo id="colores" rotulo="Semáforo">
              Cómo leer los colores
            </Titulo>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Todas las calificaciones usan la misma escala: rojo es mal, ámbar es regular y verde es bien. El número
              siempre acompaña al color.
            </p>
            <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-card p-6">
              <div className="h-4 rounded-full" style={{ background: DEGRADADO }} aria-hidden="true" />
              <div className="mt-1.5 flex justify-between text-xs font-medium text-muted-foreground" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
              <ul className="mt-6 grid gap-2 sm:grid-cols-5">
                {RANGOS.map((r) => {
                  const c = colorCalificacion(r.ejemplo);
                  const v = veredicto(r.ejemplo);
                  return (
                    <li key={r.texto} className="rounded-2xl p-4" style={{ background: c.fondo, color: c.texto }}>
                      <p className="font-display text-lg font-semibold">{v.etiqueta}</p>
                      <p className="tabular text-sm font-semibold opacity-90">{r.texto}</p>
                      <p className="mt-2 text-xs leading-snug opacity-90">{v.descripcion}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Alcance */}
          <section aria-labelledby="alcance">
            <Titulo id="alcance" rotulo="Léelo antes de comparar">
              Alcance y limitaciones
            </Titulo>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Las encuestas son voluntarias: responde quien decide hacerlo, y suelen participar más quienes tuvieron una
              experiencia muy buena o muy mala.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className={tarjeta}>
                <p className="flex items-center gap-2 font-semibold text-navy">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#3b9f5a] text-white">
                    <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                  </span>
                  Sirve para
                </p>
                <ul className="mt-4 space-y-2.5 text-[15px] text-navy">
                  <li>Detectar tendencias a lo largo del tiempo.</li>
                  <li>Ubicar trámites y aspectos que necesitan atención.</li>
                  <li>Dar seguimiento a las acciones de mejora.</li>
                </ul>
              </div>
              <div className={tarjeta}>
                <p className="flex items-center gap-2 font-semibold text-navy">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#b8283a] text-white">
                    <X className="size-4" strokeWidth={3} aria-hidden="true" />
                  </span>
                  No sirve para
                </p>
                <ul className="mt-4 space-y-2.5 text-[15px] text-navy">
                  <li>Representar estadísticamente a toda la población de Hermosillo.</li>
                  <li>Compararse directamente con encuestas probabilísticas como la ENCIG.</li>
                  <li>Sustituir los canales oficiales de quejas o denuncias.</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-orange/50 bg-orange-soft p-6 text-[15px] leading-relaxed text-navy">
              <strong className="font-semibold">Datos demostrativos.</strong> Este prototipo incluye evaluaciones ficticias
              generadas automáticamente para mostrar su funcionamiento. Cada una está marcada como demostrativa y el sitio
              lo indica con avisos visibles. Las evaluaciones que envías se guardan como registros reales del prototipo.
            </div>
          </section>

          {/* Comentarios */}
          <section aria-labelledby="comentarios">
            <Titulo id="comentarios" rotulo="Moderación">
              El recorrido de un comentario
            </Titulo>
            <ol className="mt-8 grid gap-4 md:grid-cols-4">
              {RECORRIDO.map((p, i) => (
                <li key={p.t} className="relative">
                  {i < RECORRIDO.length - 1 && (
                    <span className="absolute left-[calc(50%+2rem)] top-7 hidden h-0.5 w-[calc(100%-4rem+1rem)] bg-primary/25 md:block" aria-hidden="true" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <span className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_8px_20px_-10px_rgb(0_119_122/0.8)]">
                      <p.icono className="size-6" aria-hidden="true" />
                      <span className="tabular absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-orange text-xs font-bold text-navy-deep">
                        {i + 1}
                      </span>
                    </span>
                    <h3 className="mt-4 font-semibold text-navy">{p.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Contexto */}
          <section aria-labelledby="contexto" className="rounded-[1.75rem] bg-[linear-gradient(160deg,#041f24,#0a4a4e)] p-6 text-white sm:p-10">
            <div className="scroll-mt-28" id="contexto">
              <p className="rotulo text-orange">Por qué importa</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Medir para que la atención mejore.</h2>
            </div>
            <p className="mt-4 max-w-2xl leading-relaxed text-white/70">
              Escuchar a las personas en los puntos de contacto con el gobierno ayuda a detectar barreras y riesgos de
              corrupción. Algunas cifras de referencia:
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {CONTEXTO.map((c) => (
                <figure key={c.cifra + c.fuente} className="material-vidrio rounded-2xl p-5">
                  <p className="tabular font-display text-4xl font-semibold tracking-[-0.03em] text-orange">{c.cifra}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">{c.texto}</p>
                  <figcaption className="mt-3 text-xs text-white/55">Fuente: {c.fuente}</figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-white/70">
              Según la ENCIG 2025, el contacto con autoridades de seguridad pública fue el trámite con mayor incidencia de
              corrupción en el país, y los permisos relacionados con la propiedad aumentaron respecto de 2023. Por eso
              H-TEOYE incluye una pregunta anónima sobre solicitudes de pagos no oficiales.
            </p>
          </section>

          {/* Fuentes */}
          <section aria-labelledby="fuentes">
            <Titulo id="fuentes" rotulo="Referencias">
              Fuentes
            </Titulo>
            <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-navy">
              <li className={tarjeta}>
                INEGI.{" "}
                <a
                  className="font-semibold text-primary-ink underline underline-offset-2"
                  href="https://www.inegi.org.mx/programas/encig/2025/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Encuesta Nacional de Calidad e Impacto Gubernamental (ENCIG) 2025
                </a>
                . Periodo de referencia: enero a diciembre de 2025.
              </li>
              <li className={tarjeta}>
                Hermosillo ¿Cómo Vamos?.{" "}
                <a
                  className="font-semibold text-primary-ink underline underline-offset-2"
                  href="https://hermosillocomovamos.org/wp-content/uploads/2026/10/Informe-de-Indicadores-Hermosillo-como-vamos-2026.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Informe de Indicadores 2026
                </a>{" "}
                (Encuesta de Percepción Ciudadana 2025: 1,607 entrevistas en vivienda, margen de error municipal de 2.8 %
                con 95 % de confianza).
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
