import Link from "next/link";
import { Code2, Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PanelDatosAbiertos({
  dependenciaSlug,
  dependenciaNombre,
}: {
  dependenciaSlug?: string | null;
  dependenciaNombre?: string | null;
}) {
  const urlCsv = dependenciaSlug
    ? `/resultados/csv?dependencia=${encodeURIComponent(dependenciaSlug)}`
    : "/resultados/csv";

  const urlApi = dependenciaSlug
    ? `/api/datos-abiertos/evaluaciones?dependencia=${encodeURIComponent(dependenciaSlug)}`
    : "/api/datos-abiertos/evaluaciones";

  const alcance = dependenciaNombre ? `de ${dependenciaNombre}` : "de todo el municipio";

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Datos Abiertos &amp; Auditoría Social
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Descarga las evaluaciones {alcance}
          </h2>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Diseñado para <strong>investigadores, académicos y periodistas</strong>. Los datos están{" "}
            <strong>estrictamente desvinculados de datos personales</strong> (Art. 3 Fracc. XIV de la Ley de
            Protección de Datos Personales): no se incluyen folios, la fecha se trunca al día para evitar
            correlaciones
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col shrink-0">
          <Button asChild size="lg" className="rounded-xl font-semibold shadow-xs">
            <Link href={urlCsv} download>
              <Download className="size-4" aria-hidden="true" />
              <span>Descargar CSV ({dependenciaSlug ? "Dependencia" : "Completo"})</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="rounded-xl border-border/80 font-semibold">
            <Link href={urlApi} target="_blank" rel="noopener noreferrer">
              <Code2 className="size-4 text-primary" aria-hidden="true" />
              <span>Consumir API JSON</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

