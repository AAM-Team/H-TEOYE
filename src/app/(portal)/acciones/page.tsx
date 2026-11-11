import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Hammer, SearchCheck } from "lucide-react";
import { EncabezadoPagina } from "@/components/portal/encabezado-pagina";
import { IconoDependencia } from "@/components/portal/icono-dependencia";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listarAccionesPublicadas } from "@/lib/consultas/publicas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mejoras en marcha",
  description: "Acciones de mejora que las dependencias registraron a partir de las evaluaciones ciudadanas.",
};

const ESTADO = {
  PENDIENTE: { t: "Por iniciar", i: CalendarDays, c: "bg-muted text-navy" },
  EN_REVISION: { t: "En revisión", i: SearchCheck, c: "bg-[#fad35a]/50 text-navy" },
  EN_PROCESO: { t: "En proceso", i: Hammer, c: "bg-primary-soft text-primary-ink" },
  CONCLUIDA: { t: "Concluida", i: CheckCircle2, c: "bg-[#0f6538] text-white" },
} as const;

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" });

export default async function AccionesPublicas() {
  const acciones = await listarAccionesPublicadas();

  return (
    <>
      <EncabezadoPagina
        postal
        migas={[{ href: "/", etiqueta: "Inicio" }, { etiqueta: "Mejoras en marcha" }]}
        rotulo={<span className="rotulo text-orange">De tu opinión a la acción</span>}
        titulo="Mejoras en marcha"
        descripcion="Lo que las dependencias se comprometieron a cambiar a partir de las evaluaciones. Cada acción fue validada por una segunda persona antes de publicarse."
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        {acciones.length === 0 ? (
          <p className="rounded-[1.5rem] border border-dashed bg-card p-10 text-center text-muted-foreground">Todavía no hay acciones publicadas.</p>
        ) : (
          <ol className="space-y-4">
            {acciones.map((a) => {
              const e = ESTADO[a.estado];
              return (
                <li key={a.id}>
                  <article className="rounded-[1.5rem] border border-border/70 bg-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-primary-ink">
                        <IconoDependencia slug={a.dependencia.slug} className="size-4" /> {a.dependencia.nombreCorto}
                      </span>
                      <span className={cn("ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", e.c)}>
                        <e.i className="size-3.5" aria-hidden="true" /> {e.t}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-navy">{a.titulo}</h2>
                    {a.tramite && <p className="mt-1 text-sm text-muted-foreground">Trámite: {a.tramite.nombre}</p>}
                    <p className="mt-3 leading-relaxed text-navy/90">{a.descripcion}</p>
                    <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {a.publicadaEn && <span>Publicada el {fecha.format(a.publicadaEn)}</span>}
                      {a.fechaCompromiso && <span>Compromiso: {fecha.format(a.fechaCompromiso)}</span>}
                      {a.esDemo && <Badge variant="demo">Ejemplo demostrativo</Badge>}
                    </p>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-[1.75rem] bg-[linear-gradient(135deg,#005f63,#00777a)] p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <p className="text-2xl font-semibold">Tu evaluación es el punto de partida.</p>
          <Button asChild size="lg" variant="outline" className="rounded-full border-transparent bg-white text-primary-ink hover:bg-white/90 hover:text-primary-ink">
            <Link href="/dependencias">
              Evaluar un trámite <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
