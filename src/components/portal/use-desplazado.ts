"use client";

import { useSyncExternalStore } from "react";

function suscribir(aviso: () => void) {
  window.addEventListener("scroll", aviso, { passive: true });
  return () => window.removeEventListener("scroll", aviso);
}

/** true cuando la página se desplazó: la barra fija muestra su borde sólo si hay contenido debajo. */
export function useDesplazado(umbral = 4) {
  return useSyncExternalStore(
    suscribir,
    () => window.scrollY > umbral,
    () => false,
  );
}
