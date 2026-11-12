import Link from "next/link";
import { ArrowRight, BarChart3, EyeOff, MessageSquareText, ShieldCheck, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CerroDeLaCampana } from "@/components/inicio/cerro";
import { EncuestaDemo } from "@/components/inicio/encuesta-demo";
import { Indicador, LeyendaEscala, formatearPorcentaje } from "@/components/resultados/graficas";
import { RankingDependencias } from "@/components/resultados/ranking";
import { obtenerResumenGeneral } from "@/lib/consultas/publicas";
import { resumenPorDependencia } from "@/lib/consultas/resultados";
import { formatearEntero, formatearPromedio } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PASOS = [
  {
    titulo: "Elige tu trámite",
    texto: "Cinco dependencias y 25 trámites del catálogo oficial. Sin cuenta, sin registro.",
  },
  {
    titulo: "Califica cuatro aspectos",
    texto: "Trato, claridad, facilidad y satisfacción, de una a cinco estrellas. Lo demás es opcional.",
  },
  {
    titulo: "Mira el resultado público",
    texto: "Tu evaluación se suma al tablero de la dependencia, que la usa para registrar mejoras.",
  },
];

const retraso = (ms: number) => ({ "--retraso": `${ms}ms` }) as React.CSSProperties;

export default async function InicioPage() {
  const [resumen, dependencias] = await Promise.all([obtenerResumenGeneral(), resumenPorDependencia()]);
  const todoDemo = resumen.total > 0 && resumen.totalDemo === resumen.total;
  const totalSatisfechos = dependencias.reduce((a, d) => a + d.distribucion[3] + d.distribucion[4], 0);
  const totalDistribucion = dependencias.reduce((a, d) => a + d.distribucion.reduce((x, y) => x + y, 0), 0);

  return (
    <>
      {/* Héroe: el producto mismo, una encuesta que se puede probar */}
      <section
        className="relative overflow-hidden bg-[linear-gradient(180deg,#041f24_0%,#06363b_55%,#0a4a4e_100%)] text-white"
        aria-labelledby="titulo-inicio"
      >
        <div className="rejilla pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_10%,black,transparent_70%)]" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-4 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:pt-24">
          <div>
            <p className="entrada rotulo text-orange">Hermosillo · Evaluación ciudadana de trámites</p>
            <h1
              id="titulo-inicio"
              style={retraso(70)}
              className="entrada mt-4 text-5xl font-semibold sm:text-6xl lg:text-7xl"
            >
              Califica tu trámite municipal en <span className="text-orange">2 minutos</span>.
            </h1>
            <p style={retraso(140)} className="entrada mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              El folio de tu trámite, cuatro preguntas y cinco estrellas. Cada respuesta alimenta un tablero
              público que compara a las cinco dependencias participantes.
            </p>
            <div style={retraso(210)} className="entrada mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/dependencias">
                  Evaluar un trámite <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/resultados">
                  <BarChart3 aria-hidden="true" /> Ver resultados
                </Link>
              </Button>
            </div>

            <dl style={retraso(280)} className="material-vidrio entrada mt-12 grid max-w-xl grid-cols-3 gap-4 rounded-2xl p-5 sm:gap-6">
              <Indicador tono="oscuro" etiqueta="evaluaciones" valor={formatearEntero(resumen.total)} />
              <Indicador
                tono="oscuro"
                etiqueta="satisfacción promedio"
                valor={formatearPromedio(resumen.promedioSatisfaccion)}
                unidad="/5"
              />
              <Indicador
                tono="oscuro"
                etiqueta="quedaron satisfechos"
                valor={formatearPorcentaje(totalDistribucion ? totalSatisfechos / totalDistribucion : null)}
              />
            </dl>
          </div>

          <div style={retraso(160)} className="entrada mx-auto w-full max-w-md lg:max-w-none">
            <EncuestaDemo
              dependencias={dependencias.map((d) => ({ slug: d.slug, nombreCorto: d.nombreCorto, promedios: d.promedios }))}
            />
          </div>
        </div>
        {/* Postal: el Cerro de la Campana al atardecer */}
        <div className="relative -mt-10 h-[clamp(260px,24vw,580px)] lg:-mt-40">
          <CerroDeLaCampana className="absolute inset-0 h-full w-full" />
        </div>
      </section>

      {/* Resultados: mapa de calor de las cinco dependencias */}
      <section aria-labelledby="titulo-mapa" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="rotulo text-primary-ink">Resultados públicos</p>
            <h2 id="titulo-mapa" className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
              ¿Qué dependencia atiende mejor?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Ordenadas por la satisfacción general que reportan quienes hicieron un trámite. Verde es bien, ámbar es
              regular y rojo es mal.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            {resumen.totalDemo > 0 && (
              <Badge variant="demo">
                {todoDemo ? "Datos demostrativos" : `Incluye ${formatearEntero(resumen.totalDemo)} evaluaciones demostrativas`}
              </Badge>
            )}
            <LeyendaEscala />
          </div>
        </div>

        <div className="mt-8">
          <RankingDependencias
            filas={dependencias.map((d) => ({
              clave: d.slug,
              slug: d.slug,
              nombre: d.nombreCorto,
              href: `/resultados/${d.slug}`,
              total: d.total,
              promedios: d.promedios,
              satisfechos: d.satisfechos,
            }))}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Toca una dependencia para ver sus trámites, su evolución y los problemas más reportados.
          </p>
          <Button asChild variant="navy" className="rounded-full">
            <Link href="/resultados">
              Abrir el tablero completo <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Cómo funciona */}
      <section aria-labelledby="titulo-pasos" className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <h2 id="titulo-pasos" className="text-3xl font-semibold text-navy sm:text-4xl">
            Tres pasos, de la ventanilla al tablero.
          </h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="border-t-2 border-teal pt-5">
                <span className="font-display text-6xl font-semibold leading-none text-teal" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-navy">{p.titulo}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Privacidad */}
      <section aria-labelledby="titulo-privacidad" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="grid gap-10 rounded-[1.75rem] bg-[linear-gradient(135deg,#06363b,#0a5155)] p-8 text-white sm:p-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <ShieldCheck className="size-9 text-orange" aria-hidden="true" />
            <h2 id="titulo-privacidad" className="mt-5 text-3xl font-semibold sm:text-4xl">
              Tu evaluación es confidencial.
            </h2>
            <p className="mt-4 leading-relaxed text-white/70">
              El tablero muestra sólo promedios y porcentajes. Un grupo con menos de cinco evaluaciones no se publica,
              para que nadie pueda adivinar quién respondió.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { i: EyeOff, t: "Sin datos personales", d: "No pedimos nombre, CURP ni correo. Sólo el folio del trámite, que nunca se publica." },
              { i: MessageSquareText, t: "Comentarios revisados", d: "Se eliminan datos personales y se revisan antes de publicarse." },
              { i: ShieldCheck, t: "Acceso restringido", d: "Sólo personal autorizado consulta el detalle interno." },
              { i: ClipboardCheck, t: "Mejoras verificadas", d: "Las acciones de mejora se publican sólo después de validarse." },
            ].map((x) => (
              <li key={x.t} className="material-vidrio rounded-2xl p-5">
                <x.i className="size-5 text-orange" aria-hidden="true" />
                <p className="mt-3 font-semibold">{x.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/65">{x.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
