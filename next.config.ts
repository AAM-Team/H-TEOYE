import type { NextConfig } from "next";

/**
 * cacheComponents y partialPrefetching se dejan desactivados a propósito:
 * las páginas con indicadores deben reflejar cada evaluación en cuanto se envía,
 * y el modelo de renderizado dinámico clásico es más predecible para el prototipo.
 */
const nextConfig: NextConfig = {
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
