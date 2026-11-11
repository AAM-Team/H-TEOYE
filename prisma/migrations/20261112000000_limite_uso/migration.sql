-- CreateTable
CREATE TABLE "LimiteUso" (
    "clave" TEXT NOT NULL,
    "conteo" INTEGER NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LimiteUso_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE INDEX "LimiteUso_expiraEn_idx" ON "LimiteUso"("expiraEn");
