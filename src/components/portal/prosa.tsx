import { cn } from "@/lib/utils";

/** Contenedor tipográfico para páginas de texto largo (privacidad, metodología). */
export function Prosa({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-none text-[15px] leading-relaxed text-navy/90",
        "[&_h2]:mt-12 [&_h2]:scroll-mt-28 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy first:[&_h2]:mt-0",
        "[&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-navy",
        "[&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
        "[&_a]:font-semibold [&_a]:text-primary-ink [&_a]:underline [&_a]:underline-offset-2",
        "[&_strong]:font-semibold [&_strong]:text-navy",
        className,
      )}
    >
      {children}
    </div>
  );
}
