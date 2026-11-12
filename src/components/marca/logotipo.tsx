import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Marca propia de H-TEOYE (no es un logotipo oficial del Ayuntamiento).
 * Palabra en Barlow Condensed Black Italic: la H de barras y arco, y la O como un
 * solecito de Hermosillo. El solecito solo es el ícono (favicon, app).
 */

const NARANJA = "#ef7900";

/** Trazos del solecito en un viewBox de 64×64 (también los usan icon.svg y las imágenes generadas). */
export const RAYOS_SOLECITO =
  "M54.5 32L60.5 32M47.91 47.91L52.15 52.15M32 54.5L32 60.5M16.09 47.91L11.85 52.15M9.5 32L3.5 32M16.09 16.09L11.85 11.85M32 9.5L32 3.5M47.91 16.09L52.15 11.85";

export function Solecito({ className, titulo }: { className?: string; titulo?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      {...(titulo ? { role: "img", "aria-label": titulo } : { "aria-hidden": true })}
    >
      <circle cx="32" cy="32" r="15.5" fill="none" stroke={NARANJA} strokeWidth="7" />
      <path d={RAYOS_SOLECITO} stroke={NARANJA} strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** La H: barra naranja, arco y barra turquesa. viewBox 87.7×102.5. */
export function HMarca({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 87.7 102.5" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`hb${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e45a28" />
          <stop offset="1" stopColor="#f29a26" />
        </linearGradient>
        <linearGradient id={`ha${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f6ad22" />
          <stop offset="1" stopColor="#eb8524" />
        </linearGradient>
        <clipPath id={`hc${id}`}>
          <rect width="31.3" height="102.5" />
        </clipPath>
      </defs>
      <rect width="31.3" height="102.5" fill={`url(#hb${id})`} />
      <path d="M-1 102.5V81.5C-1 54.5 22.5 32.7 56.5 32.7V40H40Z" fill="#a8702a" opacity=".55" clipPath={`url(#hc${id})`} />
      <path
        d="M0 102.5V81.5C0 54.5 23.5 33.5 56.5 33.5V64.5C40.5 64.5 31.3 70.5 31.3 81.5V102.5Z"
        fill={`url(#ha${id})`}
      />
      <rect x="56.5" width="31.2" height="102.5" fill="#21908a" />
    </svg>
  );
}

/** Sólo la palabra «H-TEOYE». El tamaño se controla con font-size (clase text-*). */
export function PalabraMarca({ className, claro = false }: { className?: string; claro?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap font-marca text-[1.75rem] leading-none",
        claro ? "text-white" : "text-navy",
        className,
      )}
    >
      <span className="sr-only">H-TEOYE</span>
      <span aria-hidden="true">
        <HMarca className="inline-block h-[0.7em] w-auto align-baseline" />
        <span className="ml-[0.04em] text-orange">-</span>
        TE
        <Solecito className="-mx-[0.06em] inline-block size-[1.15em] align-[-0.225em]" />
        YE
      </span>
    </span>
  );
}

/** Ícono compacto (el solecito); se conserva el nombre por compatibilidad. */
export function Isotipo({ className }: { className?: string }) {
  return <Solecito className={cn("size-8", className)} />;
}

export function Logotipo({
  className,
  claro = false,
  subtitulo = "Tu voz mejora Hermosillo",
}: {
  className?: string;
  claro?: boolean;
  subtitulo?: string;
}) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <PalabraMarca claro={claro} />
      <span
        className={cn(
          "mt-1 font-marca-texto text-[11px] uppercase tracking-[0.06em]",
          claro ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {subtitulo}
      </span>
    </span>
  );
}
