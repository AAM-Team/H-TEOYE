import { cn } from "@/lib/utils";

/**
 * Marca propia de H-TEOYE (no es un logotipo oficial del Ayuntamiento).
 * Un globo de diálogo con una estrella: la voz ciudadana que califica.
 */
export function Isotipo({ className, tono = "naranja" }: { className?: string; tono?: "naranja" | "turquesa" }) {
  const color = tono === "naranja" ? "var(--brand-orange)" : "var(--brand-teal)";
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <path
        d="M6 4h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H14.5l-6.2 4.6A1 1 0 0 1 6.7 28v-4H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"
        fill={color}
      />
      <path
        d="m16 8.6 1.9 3.9 4.3.6-3.1 3 .7 4.2L16 18.3l-3.8 2 .7-4.2-3.1-3 4.3-.6L16 8.6Z"
        fill="#fff"
      />
    </svg>
  );
}

export function Logotipo({
  className,
  tono = "turquesa",
  claro = false,
  subtitulo = "Tu voz mejora Hermosillo",
}: {
  className?: string;
  tono?: "naranja" | "turquesa";
  claro?: boolean;
  subtitulo?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Isotipo tono={tono} />
      <span className="flex flex-col leading-none">
        <span className={cn("text-lg font-extrabold tracking-tight", claro ? "text-white" : "text-navy")}>
          H-TEOYE
        </span>
        <span className={cn("mt-1 text-[11px] font-medium", claro ? "text-white/70" : "text-muted-foreground")}>
          {subtitulo}
        </span>
      </span>
    </span>
  );
}
