import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Configuración de Prisma CLI.
 *
 * Por defecto se usa el motor de esquemas clásico (binario que Prisma descarga
 * automáticamente al instalar). En entornos sin acceso a binaries.prisma.sh
 * puede usarse el motor JS/WASM con: PRISMA_SCHEMA_ENGINE=js
 */
const usarMotorJs = process.env.PRISMA_SCHEMA_ENGINE === "js";

const base = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
};

export default usarMotorJs
  ? defineConfig({
      ...base,
      experimental: { adapter: true },
      engine: "js",
      adapter: async () => new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    })
  : defineConfig(base);
