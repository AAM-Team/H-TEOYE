"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, LayoutDashboard, ListChecks, MessageSquareText, QrCode, ScrollText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONOS: Record<string, LucideIcon> = {
  "/panel": LayoutDashboard,
  "/panel/evaluaciones": ListChecks,
  "/panel/comentarios": MessageSquareText,
  "/panel/acciones": ClipboardCheck,
  "/panel/bitacora": ScrollText,
  "/panel/qr": QrCode,
};

export type EnlacePanel = { href: string; etiqueta: string; contador?: number };

function activo(ruta: string, href: string) {
  return href === "/panel" ? ruta === "/panel" : ruta === href || ruta.startsWith(`${href}/`);
}

export function NavegacionPanel({ enlaces, horizontal = false }: { enlaces: EnlacePanel[]; horizontal?: boolean }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Panel">
      <ul className={cn(horizontal ? "flex gap-1 overflow-x-auto" : "space-y-1")}>
        {enlaces.map((e) => {
          const Icono = ICONOS[e.href] ?? LayoutDashboard;
          return (
            <li key={e.href}>
              <Link
                href={e.href}
                aria-current={activo(ruta, e.href) ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  horizontal && "whitespace-nowrap",
                  "text-white/70 hover:bg-white/10 hover:text-white",
                  "aria-[current=page]:bg-white aria-[current=page]:text-navy aria-[current=page]:shadow-[0_2px_10px_rgb(0_0_0/0.25)]",
                )}
              >
                <Icono className="size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{e.etiqueta}</span>
                {!!e.contador && (
                  <span className="tabular rounded-full bg-orange px-2 py-0.5 text-[11px] font-bold text-navy-deep">
                    {e.contador}
                    <span className="sr-only"> pendientes</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
