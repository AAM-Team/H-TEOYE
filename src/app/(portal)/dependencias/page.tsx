import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, EyeOff, Star } from "lucide-react";
import { EncabezadoPagina } from "@/components/portal/encabezado-pagina";
import { IconoDependencia } from "@/components/portal/icono-dependencia";
import { EstrellasPromedio, InsigniaVeredicto } from "@/components/resultados/ranking";
import { listarDependencias } from "@/lib/consultas/publicas";
import { resumenPorDependencia } from "@/lib/consultas/resultados";
import { conteo, formatearPromedio } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Evaluar un trámite" };

export default async function DependenciasPage() {
  const [dependencias, resumen] = await Promise.all([listarDependencias(), resumenPorDependencia()]);
  const porSlug = new Map(resumen.map((r) => [r.slug, r]));

  return (
    <>
      <EncabezadoPagina
        postal
        migas={[{ href: "/", etiqueta: "Inicio" }, { etiqueta: "Evaluar un trámite" }]}
        rotulo={
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
            <span className="flex size-5 items-center justify-center rounded-full bg-orange text-[11px] font-bold text-navy-deep">1</span>
            Paso 1 de 3 · Elige la dependencia
          </span>
        }
        titulo="¿Dónde hiciste tu trámite?"
        descripcion="Elige la dependencia municipal que te atendió. En el siguiente paso eliges el trámite y luego calificas."
      >
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
          <span className="flex items-center gap-2">
            <Clock className="size-4 text-orange" aria-hidden="true" /> 2 minutos
          </span>
          <span className="flex items-center gap-2">
            <EyeOff className="size-4 text-orange" aria-hidden="true" /> Sin nombre, CURP ni correo
          </span>
          <span className="flex items-center gap-2">
            <Star className="size-4 text-orange" aria-hidden="true" /> 5 calificaciones obligatorias
          </span>
        </div>
      </EncabezadoPagina>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dependencias.map((d, i) => {
            const r = porSlug.get(d.slug);
            const s = r?.promedios.satisfaccion ?? null;
            return (
              <li key={d.id} className="entrada" style={{ "--retraso": `${i * 60}ms` } as React.CSSProperties}>
                <Link
                  href={`/dependencias/${d.slug}`}
                  className="presionable group flex h-full flex-col rounded-[1.5rem] border border-border/70 bg-card p-6 outline-none transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-[0_18px_40px_-24px_rgb(6_38_43/0.5)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink transition-colors group-hover:bg-primary group-hover:text-white">
                      <IconoDependencia slug={d.slug} className="size-7" />
                    </span>
                    <InsigniaVeredicto valor={s} />
                  </span>
                  <span className="mt-5 font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-navy">{d.nombreCorto}</span>
                  {d.nombreCorto !== d.nombre && <span className="mt-0.5 text-sm text-muted-foreground">{d.nombre}</span>}
                  <span className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{d.descripcion}</span>
                  <span className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <EstrellasPromedio valor={s} />
                      <span className="tabular font-semibold text-navy">{formatearPromedio(s)}</span>
                      <span>· {conteo(d.tramites, "trámite", "trámites")}</span>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-primary-ink">
                      Elegir
                      <ArrowRight className="size-4 transition-transform duration-300 ease-[var(--spring)] group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
