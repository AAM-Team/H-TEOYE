import Image from "next/image";
import Link from "next/link";
import { Logotipo } from "@/components/marca/logotipo";

export function Pie() {
  return (
    <footer className="mt-auto bg-navy-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-md">
          <div className="flex items-center gap-4">
            <Logotipo claro />
            <span className="h-8 w-px bg-white/15" aria-hidden="true" />
            {/* Logotipo oficial en versión monocroma blanca para fondo oscuro. */}
            <Image
              src="/marca/logo-ayuntamiento-hermosillo.svg"
              alt="H. Ayuntamiento de Hermosillo"
              width={317}
              height={103}
              className="h-9 w-auto brightness-0 invert"
            />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-white/70">
            Prototipo desarrollado para el Hackathon de Innovación por la Transparencia y Anticorrupción del
            Ayuntamiento de Hermosillo, reto «Evaluación de la calidad en la atención ciudadana».
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Participa</h2>
          <ul className="mt-3 space-y-1 text-sm text-white/70">
            <li><Link className="-mx-1 inline-block rounded px-1 py-1 transition-colors hover:text-white focus-visible:text-white" href="/dependencias">Evaluar un trámite</Link></li>
            <li><Link className="-mx-1 inline-block rounded px-1 py-1 transition-colors hover:text-white focus-visible:text-white" href="/resultados">Resultados por dependencia</Link></li>
            <li><Link className="-mx-1 inline-block rounded px-1 py-1 transition-colors hover:text-white focus-visible:text-white" href="/">Inicio</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Transparencia</h2>
          <ul className="mt-3 space-y-1 text-sm text-white/70">
            <li><Link className="-mx-1 inline-block rounded px-1 py-1 transition-colors hover:text-white focus-visible:text-white" href="/metodologia">Metodología</Link></li>
            <li><Link className="-mx-1 inline-block rounded px-1 py-1 transition-colors hover:text-white focus-visible:text-white" href="/privacidad">Aviso de privacidad</Link></li>
            <li><Link className="-mx-1 inline-block rounded px-1 py-1 transition-colors hover:text-white focus-visible:text-white" href="/acciones">Mejoras en marcha</Link></li>
            <li><Link className="-mx-1 inline-block rounded px-1 py-1 transition-colors hover:text-white focus-visible:text-white" href="/panel/login">Acceso para funcionarios</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs leading-relaxed text-white/60 sm:px-6 lg:px-8">
          H-TEOYE no es un servicio oficial ni sustituye los canales institucionales de quejas, denuncias o
          atención ciudadana. Las encuestas son voluntarias y sus resultados no representan estadísticamente a toda
          la población de Hermosillo.
        </p>
      </div>
    </footer>
  );
}
