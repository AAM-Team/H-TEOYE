import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Check, ShieldCheck } from "lucide-react";
import { CerroDeLaCampana } from "@/components/inicio/cerro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Gracias por tu evaluación" };

const SIGUIENTES = [
  { t: "Ya cuenta", d: "Tu evaluación se sumó a los indicadores públicos de la dependencia." },
  { t: "Se revisa", d: "Si dejaste un comentario, una persona lo revisa antes de publicarlo." },
  { t: "Se convierte en mejoras", d: "La dependencia usa los resultados para registrar acciones de mejora." },
];

export default async function GraciasPage({ searchParams }: PageProps<"/evaluar/gracias">) {
  const sp = await searchParams;
  const dependencia =
    typeof sp.dependencia === "string" && /^[a-z0-9-]{1,80}$/.test(sp.dependencia) ? sp.dependencia : null;
  const redactado = sp.redactado === "1";

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#041f24_0%,#06363b_60%,#0a4a4e_100%)] text-white">
      <div className="rejilla pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-6 pt-16 text-center sm:px-6 sm:pt-20">
        <span className="entrada mx-auto flex size-20 items-center justify-center rounded-full bg-primary shadow-[0_0_0_10px_rgb(0_154_156/0.18),0_0_0_22px_rgb(0_154_156/0.08)]">
          <Check className="size-10" strokeWidth={3} aria-hidden="true" />
        </span>
        <h1 className="entrada mt-8 text-4xl font-semibold sm:text-5xl" style={{ "--retraso": "80ms" } as React.CSSProperties}>
          ¡Gracias! Tu voz ya cuenta.
        </h1>
        <p className="entrada mt-4 text-lg text-white/70" style={{ "--retraso": "140ms" } as React.CSSProperties}>
          Cada evaluación ayuda a que la atención en Hermosillo mejore.
        </p>

        {redactado && (
          <Alert variant="info" className="mt-8 rounded-2xl text-left">
            <ShieldCheck />
            <AlertTitle>Protegimos tus datos</AlertTitle>
            <AlertDescription>
              Detectamos y eliminamos de tu comentario información que podría identificarte (como teléfonos, correos o folios).
            </AlertDescription>
          </Alert>
        )}

        <ol className="mt-10 grid gap-3 text-left sm:grid-cols-3">
          {SIGUIENTES.map((s, i) => (
            <li
              key={s.t}
              className="material-vidrio entrada rounded-2xl p-4"
              style={{ "--retraso": `${200 + i * 70}ms` } as React.CSSProperties}
            >
              <span className="tabular font-display text-2xl font-semibold text-orange">{i + 1}</span>
              <p className="mt-1 font-semibold">{s.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/65">{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href={dependencia ? `/dependencias/${dependencia}` : "/dependencias"}>Evaluar otro trámite</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={dependencia ? `/resultados/${dependencia}` : "/resultados"}>
              <BarChart3 aria-hidden="true" /> Ver los resultados
            </Link>
          </Button>
        </div>
      </div>
      <div className="relative h-[clamp(200px,22vw,500px)]">
        <CerroDeLaCampana className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}
