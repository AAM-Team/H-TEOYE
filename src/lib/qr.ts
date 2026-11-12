import "server-only";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { alcance, type UsuarioSesion } from "@/lib/auth/sesion";

/** Sitio publicado; los QR impresos siempre deben llevar aquí, nunca a una computadora local. */
const SITIO_PUBLICADO = "https://h-teoye.vercel.app";

/**
 * Códigos QR para las ventanillas: cada uno abre la encuesta de un trámite.
 *
 * La dirección pública sale de SITIO_URL (p. ej. un dominio propio); si no, del dominio de
 * producción en Vercel; si no, del sitio publicado. Así un QR descargado desde una vista previa
 * o desde la computadora local siempre apunta al sitio real.
 */
export function urlBaseSitio() {
  const configurada = process.env.SITIO_URL?.replace(/\/+$/, "");
  if (configurada) return configurada;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return SITIO_PUBLICADO;
}

/** La dirección como se lee en un cartel: sin «https://». */
export function urlLegible(url: string) {
  return url.replace(/^https?:\/\//, "");
}

/**
 * Enlace de la encuesta. Usa la clave estable del catálogo (igual en todas las bases de datos),
 * no el id interno, que cambia entre la base local y la de producción.
 */
export function urlEvaluacion(base: string, tramite: { id: string; clave: string | null }) {
  return tramite.clave
    ? `${base}/evaluar/clave/${encodeURIComponent(tramite.clave)}`
    : `${base}/evaluar/${encodeURIComponent(tramite.id)}`;
}

const OPCIONES = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#06262b", light: "#ffffff" } };

export function qrSvg(texto: string) {
  return QRCode.toString(texto, { ...OPCIONES, type: "svg" });
}

/** PNG de alta resolución (sirve para imprimir a ~10 cm). */
export function qrPng(texto: string, ancho = 1200) {
  return QRCode.toBuffer(texto, { ...OPCIONES, type: "png", width: ancho });
}

/** Trámites que la persona puede ver, según su alcance (la coordinación ve todos). */
export function tramitesConQr(usuario: UsuarioSesion) {
  const { dependenciaId } = alcance(usuario);
  return prisma.tramite.findMany({
    where: { activo: true, dependencia: { activa: true }, ...(dependenciaId ? { dependenciaId } : {}) },
    orderBy: [{ dependencia: { orden: "asc" } }, { orden: "asc" }],
    select: {
      id: true,
      clave: true,
      nombre: true,
      porDefinir: true,
      dependencia: { select: { nombre: true, nombreCorto: true, slug: true } },
    },
  });
}

export async function tramiteConQr(usuario: UsuarioSesion, tramiteId: string) {
  const { dependenciaId } = alcance(usuario);
  return prisma.tramite.findFirst({
    where: { id: tramiteId, activo: true, dependencia: { activa: true }, ...(dependenciaId ? { dependenciaId } : {}) },
    select: { id: true, clave: true, nombre: true, dependencia: { select: { nombre: true, nombreCorto: true, slug: true } } },
  });
}

export function nombreArchivo(t: { clave: string | null; id: string }, extension: string) {
  return `qr-hteoye-${(t.clave ?? t.id).replace(/[^a-z0-9-]/gi, "")}.${extension}`;
}
