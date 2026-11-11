import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CerroDeLaCampana } from "@/components/inicio/cerro";
import { cn } from "@/lib/utils";

type Miga = { href?: string; etiqueta: string };

/**
 * Encabezado de página con el cielo nocturno de Hermosillo.
 * `postal` añade al pie la franja del Cerro de la Campana al atardecer.
 */
export function EncabezadoPagina({
  migas,
  rotulo,
  titulo,
  descripcion,
  postal = false,
  children,
  className,
}: {
  migas?: Miga[];
  rotulo?: React.ReactNode;
  titulo: string;
  descripcion?: string;
  postal?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[linear-gradient(180deg,#041f24_0%,#06363b_100%)] text-white", className)}>
      <div className="rejilla pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
      <div className={cn("relative z-10 mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8", postal ? "pb-4" : "pb-10 sm:pb-12")}>
        {migas && (
          <nav aria-label="Ruta de navegación">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-white/60">
              {migas.map((m, i) => (
                <li key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
                  {m.href ? (
                    <Link href={m.href} className="rounded hover:text-white hover:underline">
                      {m.etiqueta}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-white">
                      {m.etiqueta}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {rotulo && <div className="entrada mt-8">{rotulo}</div>}
        <h1
          className={cn("entrada text-4xl font-semibold sm:text-5xl lg:text-6xl", rotulo ? "mt-3" : "mt-8")}
          style={{ "--retraso": "60ms" } as React.CSSProperties}
        >
          {titulo}
        </h1>
        {descripcion && (
          <p className="entrada mt-4 max-w-2xl text-lg leading-relaxed text-white/70" style={{ "--retraso": "120ms" } as React.CSSProperties}>
            {descripcion}
          </p>
        )}
        {children}
      </div>
      {postal && (
        <div className="relative h-[clamp(170px,22vw,520px)]">
          <CerroDeLaCampana className="absolute inset-0 h-full w-full" />
        </div>
      )}
    </div>
  );
}
