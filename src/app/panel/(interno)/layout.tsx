import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { salir } from "@/app/panel/login/acciones";
import { Logotipo } from "@/components/marca/logotipo";
import { NavegacionPanel, type EnlacePanel } from "@/components/panel/navegacion";
import { ETIQUETA_ROL, alcance, requerirUsuario } from "@/lib/auth/sesion";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requerirUsuario();
  const pendientes = await prisma.evaluacion.count({ where: { ...alcance(usuario), estadoComentario: "PENDIENTE" } });

  const enlaces: EnlacePanel[] = [
    { href: "/panel", etiqueta: "Tablero" },
    { href: "/panel/evaluaciones", etiqueta: "Evaluaciones" },
    { href: "/panel/comentarios", etiqueta: "Comentarios", contador: pendientes },
    { href: "/panel/acciones", etiqueta: "Acciones de mejora" },
    ...(usuario.rol === "ADMINISTRADOR" ? [{ href: "/panel/bitacora", etiqueta: "Bitácora" }] : []),
  ];
  const iniciales = usuario.nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const Usuario = (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange font-semibold text-navy-deep">{iniciales}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{usuario.nombre}</p>
        <p className="truncate text-xs text-white/60">
          {ETIQUETA_ROL[usuario.rol]}
          {usuario.dependencia ? ` · ${usuario.dependencia.nombreCorto}` : ""}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <a
        href="#contenido-panel"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>

      {/* Barra lateral (escritorio) */}
      <aside className="relative hidden w-72 shrink-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#041f24,#06363b)] p-5 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="rejilla pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative flex flex-col gap-1">
          <Link href="/panel" className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Tablero del panel">
            <Logotipo claro subtitulo="Panel institucional" />
          </Link>
        </div>
        <div className="relative mt-8 flex-1">
          <NavegacionPanel enlaces={enlaces} />
        </div>
        <div className="relative space-y-4">
          <Link
            href="/resultados"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="size-4" aria-hidden="true" /> Ver portal ciudadano
          </Link>
          <div className="material-vidrio rounded-2xl p-3">
            {Usuario}
            <form action={salir} className="mt-3">
              <button
                type="submit"
                className="presionable flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                <LogOut className="size-4" aria-hidden="true" /> Cerrar sesión
              </button>
            </form>
          </div>
          <Image src="/marca/logo-ayuntamiento-hermosillo.svg" alt="H. Ayuntamiento de Hermosillo" width={317} height={103} className="h-8 w-auto opacity-80 brightness-0 invert" />
        </div>
      </aside>

      {/* Barra superior (móvil) */}
      <header className="bg-[linear-gradient(180deg,#041f24,#06363b)] px-4 pb-3 pt-4 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Logotipo claro subtitulo="Panel institucional" />
          <form action={salir}>
            <button type="submit" className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white">
              <LogOut className="size-3.5" aria-hidden="true" /> Salir
            </button>
          </form>
        </div>
        <div className="mt-3">
          <NavegacionPanel enlaces={enlaces} horizontal />
        </div>
      </header>

      <main id="contenido-panel" className="min-w-0 flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}
