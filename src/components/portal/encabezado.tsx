"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDesplazado } from "@/components/portal/use-desplazado";
import { Lock, Menu, X } from "lucide-react";
import { Logotipo } from "@/components/marca/logotipo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ENLACES = [
  { href: "/resultados", etiqueta: "Resultados" },
  { href: "/acciones", etiqueta: "Mejoras" },
  { href: "/metodologia", etiqueta: "Metodología" },
  { href: "/privacidad", etiqueta: "Privacidad" },
] as const;

function estaActivo(ruta: string, href: string) {
  return ruta === href || ruta.startsWith(`${href}/`);
}

export function Encabezado() {
  const ruta = usePathname();
  // El menú móvil se considera abierto sólo en la ruta donde se abrió: al navegar se cierra solo.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn === ruta;
  const botonRef = useRef<HTMLButtonElement>(null);
  const desplazado = useDesplazado();

  // Escape cierra el menú y devuelve el foco al botón que lo abrió.
  useEffect(() => {
    if (!abierto) return;
    function alPresionar(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setAbiertoEn(null);
      botonRef.current?.focus();
    }
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [abierto]);

  return (
    <header
      className={cn(
        "material-barra sticky top-0 z-40 transition-shadow duration-300",
        desplazado && "borde-desplazamiento",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="shrink-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label="H-TEOYE, ir al inicio"
          >
            <Logotipo />
          </Link>
          <span className="h-8 w-px shrink-0 bg-border" aria-hidden="true" />
          {/* Logotipo oficial, usado con permiso del hackathon organizado por el Ayuntamiento. */}
          <Image
            src="/marca/logo-ayuntamiento-hermosillo.svg"
            alt="H. Ayuntamiento de Hermosillo"
            width={317}
            height={103}
            priority
            className="hidden h-10 w-auto sm:block"
          />
          <Image
            src="/marca/escudo-hermosillo.png"
            alt="H. Ayuntamiento de Hermosillo"
            width={78}
            height={92}
            priority
            className="h-8 w-auto sm:hidden"
          />
        </div>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {ENLACES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              aria-current={estaActivo(ruta, e.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy",
                "aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-ink aria-[current=page]:font-semibold",
              )}
            >
              {e.etiqueta}
            </Link>
          ))}
          <Link
            href="/panel/login"
            className="ml-1 hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy xl:flex"
          >
            <Lock className="size-3.5" aria-hidden="true" /> Funcionarios
          </Link>
          <Button asChild className="ml-2 rounded-full">
            <Link href="/dependencias">Evaluar un trámite</Link>
          </Button>
        </nav>

        <Button
          ref={botonRef}
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label="Menú principal"
          onClick={() => setAbiertoEn(abierto ? null : ruta)}
        >
          {abierto ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </Button>
      </div>

      {abierto && (
        <nav
          id="menu-movil"
          aria-label="Principal"
          className="animate-in fade-in slide-in-from-top-1 border-t border-border/60 px-4 pb-4 pt-2 duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] md:hidden"
        >
          <ul className="flex flex-col">
            {ENLACES.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  onClick={() => setAbiertoEn(null)}
                  aria-current={estaActivo(ruta, e.href) ? "page" : undefined}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-navy aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-ink"
                >
                  {e.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-2 w-full rounded-full" size="lg">
            <Link href="/dependencias" onClick={() => setAbiertoEn(null)}>Evaluar un trámite</Link>
          </Button>
          <Link href="/panel/login" onClick={() => setAbiertoEn(null)} className="mt-3 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-muted-foreground">
            <Lock className="size-3.5" aria-hidden="true" /> Acceso para funcionarios
          </Link>
        </nav>
      )}
    </header>
  );
}
