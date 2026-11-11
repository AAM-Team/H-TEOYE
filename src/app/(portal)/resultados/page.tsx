import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EncabezadoTablero } from "@/components/resultados/encabezado-tablero";
import { BarrasFrecuencia, Distribucion, LeyendaEscala, Panel } from "@/components/resultados/graficas";
import { RankingDependencias } from "@/components/resultados/ranking";
import { Tendencia } from "@/components/resultados/tendencia";
import { MIN_MUESTRA, obtenerDetalle, resumenPorDependencia } from "@/lib/consultas/resultados";
import { formatearEntero } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Resultados",
  description: "Tablero público con la calificación ciudadana de los trámites de cinco dependencias de Hermosillo.",
};

export default async function ResultadosPage() {
  const [dependencias, detalle] = await Promise.all([resumenPorDependencia(), obtenerDetalle()]);
  const ordenadas = [...dependencias].sort((a, b) => (b.promedios.satisfaccion ?? -1) - (a.promedios.satisfaccion ?? -1));

  return (
    <>
      <EncabezadoTablero
        titulo="Cómo atiende Hermosillo, según quien hizo el trámite."
        descripcion="Promedios de las evaluaciones ciudadanas en cinco dependencias municipales. Se actualiza con cada encuesta enviada."
        opciones={dependencias}
        activo={null}
        detalle={detalle}
      />

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Panel
          titulo="Ranking de dependencias"
          descripcion="De la mejor a la peor calificada en satisfacción general. Toca una para ver el detalle."
          accion={<LeyendaEscala />}
        >
          <RankingDependencias
            filas={dependencias.map((d) => ({
              clave: d.slug,
              slug: d.slug,
              nombre: d.nombre,
              href: `/resultados/${d.slug}`,
              total: d.total,
              promedios: d.promedios,
              satisfechos: d.satisfechos,
            }))}
          />
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel
            titulo="Satisfacción general, estrella por estrella"
            descripcion="Qué parte de las personas calificó con cada número de estrellas."
          >
            <Distribucion
              filas={ordenadas.map((d) => ({ clave: d.slug, etiqueta: d.nombreCorto, distribucion: d.distribucion }))}
            />
          </Panel>
          <Panel
            titulo="Problemas más reportados"
            descripcion={`Porcentaje de las ${formatearEntero(detalle.respondieronProblemas)} personas que respondieron. Podían marcar varios.`}
          >
            <BarrasFrecuencia items={detalle.problemas} />
          </Panel>
        </div>

        <Panel titulo="Evolución en los últimos seis meses" descripcion="La línea punteada marca 3, «regular».">
          <Tendencia datos={detalle.tendencia} />
        </Panel>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <Panel titulo="Cómo hicieron el trámite" descripcion="Entre quienes indicaron el canal.">
            <BarrasFrecuencia items={detalle.canales} maximo={1} />
          </Panel>
          <section className="flex flex-col justify-between gap-6 rounded-[1.75rem] bg-[linear-gradient(135deg,#005f63,#00777a)] p-6 text-white sm:p-8">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">¿Hiciste un trámite hace poco? Súmalo al tablero.</h2>
              <p className="mt-3 max-w-lg text-white/85">
                Una evaluación tarda dos minutos y no pide datos personales. Los grupos con menos de {MIN_MUESTRA}{" "}
                respuestas no se publican.
              </p>
            </div>
            <Button asChild size="lg" variant="outline" className="w-fit rounded-full border-transparent bg-white text-primary-ink hover:bg-white/90 hover:text-primary-ink">
              <Link href="/dependencias">
                Evaluar un trámite <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}
