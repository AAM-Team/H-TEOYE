import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3, Info } from "lucide-react";
import { EncabezadoPagina } from "@/components/portal/encabezado-pagina";
import { IconoDependencia } from "@/components/portal/icono-dependencia";
import { InsigniaModalidad } from "@/components/portal/insignia-modalidad";
import { EstrellasPromedio } from "@/components/resultados/ranking";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { obtenerDependenciaConTramites } from "@/lib/consultas/publicas";
import { resumenPorTramite } from "@/lib/consultas/resultados";
import { conteo, formatearPromedio } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/dependencias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dep = await obtenerDependenciaConTramites(slug);
  return { title: dep ? `Evaluar · ${dep.nombreCorto}` : "Dependencia no encontrada" };
}

export default async function DependenciaPage({ params }: PageProps<"/dependencias/[slug]">) {
  const { slug } = await params;
  const dep = await obtenerDependenciaConTramites(slug);
  if (!dep) notFound();

  const resumen = await resumenPorTramite(dep.id);
  const porId = new Map(resumen.map((r) => [r.id, r]));
  const hayPorDefinir = dep.tramites.some((t) => t.porDefinir);

  return (
    <>
      <EncabezadoPagina
        migas={[
          { href: "/", etiqueta: "Inicio" },
          { href: "/dependencias", etiqueta: "Evaluar un trámite" },
          { etiqueta: dep.nombreCorto },
        ]}
        rotulo={
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
            <span className="flex size-5 items-center justify-center rounded-full bg-orange text-[11px] font-bold text-navy-deep">2</span>
            Paso 2 de 3 · Elige el trámite
          </span>
        }
        titulo={dep.nombre}
        descripcion={dep.descripcion}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-orange">
            <IconoDependencia slug={dep.slug} className="size-6" />
          </span>
          <Link
            href={`/resultados/${dep.slug}`}
            className="material-vidrio presionable inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            <BarChart3 className="size-4 text-orange" aria-hidden="true" /> Ver cómo la califica la ciudadanía
          </Link>
        </div>
      </EncabezadoPagina>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 className="text-2xl font-semibold text-navy sm:text-3xl">¿Qué trámite realizaste?</h2>
        <p className="mt-2 text-muted-foreground">Si hiciste varios, evalúa uno a la vez.</p>

        {hayPorDefinir && (
          <Alert variant="info" className="mt-6">
            <Info />
            <AlertTitle>Catálogo en preparación</AlertTitle>
            <AlertDescription>
              Algunos trámites aún no tienen su nombre oficial y se muestran como «por definir». Puedes evaluarlos para
              probar el prototipo.
            </AlertDescription>
          </Alert>
        )}

        {dep.tramites.length === 0 ? (
          <p className="mt-8 rounded-[1.5rem] border border-dashed bg-card p-10 text-center text-muted-foreground">
            Esta dependencia aún no tiene trámites disponibles para evaluar.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {dep.tramites.map((t, i) => {
              const r = porId.get(t.id);
              return (
                <li key={t.id} className="entrada" style={{ "--retraso": `${i * 50}ms` } as React.CSSProperties}>
                  <Link
                    href={`/evaluar/${t.id}`}
                    className="presionable group flex items-center gap-4 rounded-[1.25rem] border border-border/70 bg-card p-5 outline-none transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-[0_14px_34px_-22px_rgb(6_38_43/0.5)] focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:p-6"
                  >
                    <span className="tabular hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-muted font-display text-lg font-semibold text-navy sm:flex">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={t.porDefinir ? "font-medium text-muted-foreground" : "text-[17px] font-semibold leading-snug text-navy"}>
                          {t.nombre}
                        </span>
                        {t.porDefinir && <Badge variant="secondary">Pendiente de catálogo oficial</Badge>}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                        <InsigniaModalidad modalidad={t.modalidad} />
                        {r && r.satisfaccion != null ? (
                          <span className="flex items-center gap-1.5">
                            <EstrellasPromedio valor={r.satisfaccion} />
                            <span className="tabular font-semibold text-navy">{formatearPromedio(r.satisfaccion)}</span>
                            <span>· {conteo(r.total, "opinión", "opiniones")}</span>
                          </span>
                        ) : (
                          <span>Sé de las primeras personas en evaluarlo</span>
                        )}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-[filter] group-hover:brightness-110">
                      Evaluar
                      <ArrowRight className="size-4 transition-transform duration-300 ease-[var(--spring)] group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
