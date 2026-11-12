-- Folio obligatorio del trámite en cada evaluación (una evaluación por folio en cada dependencia).

-- 1. Columna nueva, temporalmente opcional.
ALTER TABLE "Evaluacion" ADD COLUMN "folio" TEXT;

-- 2. Las evaluaciones que ya existían reciben un folio ficticio identificable: DEMO-AAAA-XXXXXXXX.
UPDATE "Evaluacion"
SET "folio" = 'DEMO-' || to_char("createdAt", 'YYYY') || '-' || upper(substr(md5("id"), 1, 8))
WHERE "folio" IS NULL;

-- 3. Obligatoria y única por dependencia.
ALTER TABLE "Evaluacion" ALTER COLUMN "folio" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Evaluacion_dependenciaId_folio_key" ON "Evaluacion"("dependenciaId", "folio");
