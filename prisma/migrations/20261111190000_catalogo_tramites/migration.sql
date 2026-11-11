-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('VENTANILLA', 'EN_LINEA', 'CON_FORMATO');

-- AlterTable
ALTER TABLE "Tramite" ADD COLUMN     "clave" TEXT,
ADD COLUMN     "modalidad" "Modalidad";

-- CreateIndex
CREATE UNIQUE INDEX "Tramite_clave_key" ON "Tramite"("clave");

