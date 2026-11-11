import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { hayDatosDemo } from "@/lib/consultas/publicas";

export async function AvisoPrototipo() {
  const demo = await hayDatosDemo();
  return (
    <div className="border-b border-orange/20 bg-orange-soft text-navy">
      <p className="mx-auto flex max-w-7xl items-start gap-2 px-4 py-2 text-xs leading-relaxed sm:items-center sm:px-6 lg:px-8">
        <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-orange-ink sm:mt-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Prototipo para hackathon.</strong> No es un servicio oficial del Ayuntamiento
          de Hermosillo.
          {demo && <> Las cifras incluyen <strong className="font-semibold">datos demostrativos</strong> ficticios.</>}{" "}
          <Link href="/metodologia" className="font-semibold text-orange-ink underline underline-offset-2">
            Ver metodología
          </Link>
        </span>
      </p>
    </div>
  );
}
