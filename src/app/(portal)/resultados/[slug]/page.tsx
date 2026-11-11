import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EncabezadoTablero } from "@/components/resultados/encabezado-tablero";
import { BarrasFrecuencia, Distribucion, LeyendaEscala, Panel } from "@/components/resultados/graficas";
import { RankingDependencias } from "@/components/resultados/ranking";
import { Tendencia } from "@/components/resultados/tendencia";
import {
  MIN_MUESTRA,
  obtenerDependenciaPorSlug,
  obtenerDetalle,
  resumenPorDependencia,
  resumenPorTramite,
} from "@/lib/consultas/resultados";
import { formatearEntero } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/resultados/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dep = await obtenerDependenciaPorSlug(slug);
  return { title: dep ? `Resultados · ${dep.nombreCorto}` : "Dependencia no encontrada" };
}

export default async function ResultadosDependenciaPage({ params }: PageProps<"/resultados/[slug]">) {
  const { slug } = await params;
  const dep = await obtenerDependenciaPorSlug(slug);
  if (!dep) notFound();

  const [dependencias, detalle, municipio, tramites] = await Promise.all([
    resumenPorDependencia(),
    obtenerDetalle(dep.id),
    obtenerDetalle(),
    resumenPorTramite(dep.id),
  ]);

  return (
    <>
      <EncabezadoTablero
        titulo={dep.nombre}
        descripcion={dep.descripcion}
        opciones={dependencias}
        activo={dep.slug}
        detalle={detalle}
        referencia={municipio}
      />

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Panel
          titulo="Ranking de trámites"
          descripcion={`Del mejor al peor calificado en satisfacción general. Se publica con ${MIN_MUESTRA} opiniones o más.`}
          accion={<LeyendaEscala />}
        >
          <RankingDependencias
            compacto
            filas={tramites.map((t) => ({ clave: t.id, nombre: t.nombre, total: t.total, promedios: t.promedios }))}
          />
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel titulo="Satisfacción general, estrella por estrella" descripcion="Esta dependencia frente al municipio completo.">
            <Distribucion
              filas={[
                { clave: dep.slug, etiqueta: dep.nombreCorto, distribucion: detalle.distribucion },
                { clave: "municipio", etiqueta: "Todo el municipio", distribucion: municipio.distribucion },
              ]}
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

        <section className="flex flex-col items-start justify-between gap-6 rounded-[1.75rem] bg-[linear-gradient(135deg,#005f63,#00777a)] p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">¿Hiciste un trámite en {dep.nombreCorto}?</h2>
            <p className="mt-2 text-white/85">Tu evaluación aparece en este tablero en cuanto la envías.</p>
          </div>
          <Button asChild size="lg" variant="outline" className="shrink-0 rounded-full border-transparent bg-white text-primary-ink hover:bg-white/90 hover:text-primary-ink">
            <Link href={`/dependencias/${dep.slug}`}>
              Evaluar un trámite aquí <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}
