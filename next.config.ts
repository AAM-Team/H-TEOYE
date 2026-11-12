import type { NextConfig } from "next";

/**
 * cacheComponents y partialPrefetching se dejan desactivados a propósito:
 * las páginas con indicadores deben reflejar cada evaluación en cuanto se envía,
 * y el modelo de renderizado dinámico clásico es más predecible para el prototipo.
 */
const desarrollo = process.env.NODE_ENV !== "production";
// La barra de comentarios de Vercel sólo se inyecta en despliegues de vista previa.
const vistaPrevia = process.env.VERCEL_ENV === "preview";

/**
 * Política de seguridad de contenido: todo se sirve desde el propio sitio.
 * 'unsafe-inline' en scripts es necesario para los scripts de hidratación de Next.js sin nonce;
 * aun así no se permite ningún origen externo, ni frames, ni envío de formularios a otros sitios.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${desarrollo ? " 'unsafe-eval'" : ""}${vistaPrevia ? " https://vercel.live" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${desarrollo ? " ws: wss:" : ""}${vistaPrevia ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
  `frame-src ${vistaPrevia ? "https://vercel.live" : "'none'"}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(desarrollo ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  // Habilitar salida standalone para Docker
  output: "standalone",
  // La compilación de producción no interfiere con el servidor de desarrollo.
  distDir: process.env.NODE_ENV === "production" ? ".next-production" : ".next",
  allowedDevOrigins: ["172.20.10.11"],
  cacheComponents: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
          { key: "Content-Security-Policy", value: csp },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          ...(desarrollo ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
        ],
      },
      {
        // La API nunca debe guardarse en caché ni indexarse.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;