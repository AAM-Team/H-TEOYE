import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, EyeOff } from "lucide-react";
import { FormularioEncuesta } from "@/components/encuesta/formulario-encuesta";
import { EncabezadoPagina } from "@/components/portal/encabezado-pagina";
import { IconoDependencia } from "@/components/portal/icono-dependencia";
import { InsigniaModalidad } from "@/components/portal/insignia-modalidad";
import { Badge } from "@/components/ui/badge";
import { obtenerTramiteParaEvaluar } from "@/lib/consultas/publicas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Evaluar trámite" };

export default async function EvaluarPage({ params }: PageProps<"/evaluar/[tramiteId]">) {
  const { tramiteId } = await params;
  const tramite = await obtenerTramiteParaEvaluar(tramiteId);
  if (!tramite) notFound();

  return (
    <>
      <EncabezadoPagina
        migas={[
          { href: "/dependencias", etiqueta: "Evaluar un trámite" },
          { href: `/dependencias/${tramite.dependencia.slug}`, etiqueta: tramite.dependencia.nombreCorto },
          { etiqueta: "Encuesta" },
        ]}
        rotulo={
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
            <span className="flex size-5 items-center justify-center rounded-full bg-orange text-[11px] font-bold text-navy-deep">3</span>
            Paso 3 de 3 · Califica
          </span>
        }
        titulo="¿Cómo te atendieron?"
      >
        <div className="material-vidrio entrada mt-6 flex max-w-2xl items-start gap-4 rounded-2xl p-4 sm:p-5" style={{ "--retraso": "160ms" } as React.CSSProperties}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange">
            <IconoDependencia slug={tramite.dependencia.slug} className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-white/65">{tramite.dependencia.nombre}</p>
            <p className="mt-0.5 text-lg font-semibold leading-snug">{tramite.nombre}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 [&_[data-slot=badge]]:border-white/20 [&_[data-slot=badge]]:text-white/80">
              {tramite.porDefinir && <Badge variant="secondary">Pendiente de catálogo oficial</Badge>}
              <InsigniaModalidad modalidad={tramite.modalidad} />
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
          <span className="flex items-center gap-2">
            <Clock className="size-4 text-orange" aria-hidden="true" /> Alrededor de 2 minutos
          </span>
          <span className="flex items-center gap-2">
            <EyeOff className="size-4 text-orange" aria-hidden="true" /> Anónima: no pedimos datos personales
          </span>
        </div>
      </EncabezadoPagina>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <FormularioEncuesta tramiteId={tramite.id} />
      </div>
    </>
  );
}
