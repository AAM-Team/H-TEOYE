import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, ClipboardCheck, MessageSquareText } from "lucide-react";
import { CerroDeLaCampana } from "@/components/inicio/cerro";
import { Logotipo } from "@/components/marca/logotipo";
import { FormularioAcceso } from "@/components/panel/formulario-acceso";
import { obtenerUsuario } from "@/lib/auth/sesion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acceso para funcionarios" };

export default async function AccesoPage() {
  if (await obtenerUsuario()) redirect("/panel");

  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Lado de marca */}
      <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#041f24_0%,#06363b_55%,#0a4a4e_100%)] text-white lg:flex lg:flex-col">
        <div className="rejilla pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <div className="relative z-10 p-12">
          <div className="flex items-center gap-4">
            <Logotipo claro />
            <span className="h-8 w-px bg-white/15" aria-hidden="true" />
            <Image src="/marca/logo-ayuntamiento-hermosillo.svg" alt="H. Ayuntamiento de Hermosillo" width={317} height={103} className="h-10 w-auto brightness-0 invert" />
          </div>
          <h1 className="mt-16 max-w-md text-5xl font-semibold">Los datos de la ciudadanía, convertidos en mejoras.</h1>
          <ul className="mt-10 space-y-4 text-white/80">
            {[
              { i: BarChart3, t: "Prioridades por trámite, con lo que más falla" },
              { i: MessageSquareText, t: "Moderación de comentarios antes de publicarse" },
              { i: ClipboardCheck, t: "Acciones de mejora con validación y seguimiento" },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-3">
                <span className="material-vidrio flex size-10 items-center justify-center rounded-xl">
                  <x.i className="size-5 text-orange" aria-hidden="true" />
                </span>
                {x.t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-auto h-[320px]">
          <CerroDeLaCampana className="absolute inset-0 h-full w-full" />
        </div>
      </section>

      {/* Formulario */}
      <section className="flex flex-col bg-background px-5 py-8 sm:px-10">
        <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy">
          <ArrowLeft className="size-4" aria-hidden="true" /> Portal ciudadano
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="lg:hidden">
            <Logotipo />
          </div>
          <p className="rotulo mt-8 text-primary-ink lg:mt-0">Panel institucional</p>
          <h2 className="mt-2 text-4xl font-semibold text-navy">Acceso para funcionarios</h2>
          <p className="mt-3 text-muted-foreground">
            Para personal del Ayuntamiento con cuenta asignada. Para evaluar un trámite no necesitas cuenta.
          </p>
          <FormularioAcceso />
          <p className="mt-8 rounded-2xl bg-muted/70 p-4 text-xs leading-relaxed text-muted-foreground">
            Las cuentas de demostración del prototipo están documentadas en el README del proyecto. Cada acceso queda
            registrado en la bitácora.
          </p>
        </div>
      </section>
    </main>
  );
}
