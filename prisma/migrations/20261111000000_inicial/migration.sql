-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'RESPONSABLE', 'ENLACE');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('PRESENCIAL', 'EN_LINEA', 'TELEFONICO');

-- CreateEnum
CREATE TYPE "Problema" AS ENUM ('NINGUNO', 'FILAS_LARGAS', 'REQUISITOS_NO_VISIBLES', 'HORARIO_RESTRINGIDO', 'REQUISITOS_EXCESIVOS', 'VENTANILLA_EN_VENTANILLA', 'COSTOS_EXCESIVOS');

-- CreateEnum
CREATE TYPE "EstadoComentario" AS ENUM ('SIN_COMENTARIO', 'PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoAccion" AS ENUM ('PENDIENTE', 'EN_REVISION', 'EN_PROCESO', 'CONCLUIDA');

-- CreateTable
CREATE TABLE "Dependencia" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreCorto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dependencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tramite" (
    "id" TEXT NOT NULL,
    "dependenciaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "porDefinir" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "dependenciaId" TEXT NOT NULL,
    "trato" INTEGER NOT NULL,
    "claridad" INTEGER NOT NULL,
    "facilidad" INTEGER NOT NULL,
    "satisfaccion" INTEGER NOT NULL,
    "canal" "Canal",
    "problemas" "Problema"[],
    "pagoIndebido" BOOLEAN,
    "comentario" TEXT,
    "estadoComentario" "EstadoComentario" NOT NULL DEFAULT 'SIN_COMENTARIO',
    "comentarioRedactado" BOOLEAN NOT NULL DEFAULT false,
    "comentarioRevisadoPorId" TEXT,
    "comentarioRevisadoEn" TIMESTAMP(3),
    "esDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccionMejora" (
    "id" TEXT NOT NULL,
    "dependenciaId" TEXT NOT NULL,
    "tramiteId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoAccion" NOT NULL DEFAULT 'PENDIENTE',
    "fechaCompromiso" TIMESTAMP(3),
    "creadoPorId" TEXT NOT NULL,
    "validada" BOOLEAN NOT NULL DEFAULT false,
    "validadaPorId" TEXT,
    "validadaEn" TIMESTAMP(3),
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "publicadaEn" TIMESTAMP(3),
    "esDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccionMejora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "dependenciaId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bitacora" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dependencia_slug_key" ON "Dependencia"("slug");

-- CreateIndex
CREATE INDEX "Tramite_dependenciaId_activo_idx" ON "Tramite"("dependenciaId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "Tramite_dependenciaId_orden_key" ON "Tramite"("dependenciaId", "orden");

-- CreateIndex
CREATE INDEX "Evaluacion_dependenciaId_createdAt_idx" ON "Evaluacion"("dependenciaId", "createdAt");

-- CreateIndex
CREATE INDEX "Evaluacion_tramiteId_createdAt_idx" ON "Evaluacion"("tramiteId", "createdAt");

-- CreateIndex
CREATE INDEX "Evaluacion_estadoComentario_idx" ON "Evaluacion"("estadoComentario");

-- CreateIndex
CREATE INDEX "AccionMejora_dependenciaId_estado_idx" ON "AccionMejora"("dependenciaId", "estado");

-- CreateIndex
CREATE INDEX "AccionMejora_publicada_idx" ON "AccionMejora"("publicada");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_tokenHash_key" ON "Sesion"("tokenHash");

-- CreateIndex
CREATE INDEX "Sesion_usuarioId_idx" ON "Sesion"("usuarioId");

-- CreateIndex
CREATE INDEX "Bitacora_entidad_entidadId_idx" ON "Bitacora"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "Bitacora_createdAt_idx" ON "Bitacora"("createdAt");

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "Dependencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "Dependencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_comentarioRevisadoPorId_fkey" FOREIGN KEY ("comentarioRevisadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionMejora" ADD CONSTRAINT "AccionMejora_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "Dependencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionMejora" ADD CONSTRAINT "AccionMejora_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionMejora" ADD CONSTRAINT "AccionMejora_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionMejora" ADD CONSTRAINT "AccionMejora_validadaPorId_fkey" FOREIGN KEY ("validadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "Dependencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

