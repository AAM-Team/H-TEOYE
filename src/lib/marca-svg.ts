/**
 * La marca H-TEOYE como SVG en texto, para las imágenes generadas (ícono de app,
 * imagen para redes). Debe coincidir con components/marca/logotipo.tsx.
 */
import { RAYOS_SOLECITO } from "@/components/marca/logotipo";

export const COLORES_MARCA = {
  naranja: "#ef7900",
  turquesa: "#21908a",
  marino: "#06262b",
  crema: "#f6f4ef",
} as const;

export const SVG_SOLECITO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="15.5" fill="none" stroke="${COLORES_MARCA.naranja}" stroke-width="7"/><path d="${RAYOS_SOLECITO}" stroke="${COLORES_MARCA.naranja}" stroke-width="4.5" stroke-linecap="round" fill="none"/></svg>`;

export const SVG_H = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87.7 102.5"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e45a28"/><stop offset="1" stop-color="#f29a26"/></linearGradient><linearGradient id="a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6ad22"/><stop offset="1" stop-color="#eb8524"/></linearGradient></defs><rect width="31.3" height="102.5" fill="url(#b)"/><path d="M0 102.5V81.5C0 54.5 23.5 33.5 56.5 33.5V64.5C40.5 64.5 31.3 70.5 31.3 81.5V102.5Z" fill="url(#a)"/><rect x="56.5" width="31.2" height="102.5" fill="${COLORES_MARCA.turquesa}"/></svg>`;

export const aDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
