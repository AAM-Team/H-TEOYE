-- Encuesta por modalidad: rapidez obligatoria, problemas para trámites en línea y por teléfono,
-- y la opción «Otro» con descripción.

-- AlterEnum
ALTER TYPE "Problema" ADD VALUE 'PLATAFORMA_FALLA';
ALTER TYPE "Problema" ADD VALUE 'DIFICIL_ENCONTRAR';
ALTER TYPE "Problema" ADD VALUE 'SIN_RESPUESTA';
ALTER TYPE "Problema" ADD VALUE 'TUVO_QUE_IR_EN_PERSONA';
ALTER TYPE "Problema" ADD VALUE 'NO_CONTESTARON';
ALTER TYPE "Problema" ADD VALUE 'OTRO';

-- Rapidez: las evaluaciones existentes (demostrativas) reciben un valor derivado de su facilidad
-- (±1, entre 1 y 5) para que los promedios no queden vacíos.
ALTER TABLE "Evaluacion" ADD COLUMN "rapidez" INTEGER;
UPDATE "Evaluacion"
SET "rapidez" = GREATEST(1, LEAST(5, "facilidad" + (get_byte(decode(md5("id"), 'hex'), 0) % 3) - 1))
WHERE "rapidez" IS NULL;
ALTER TABLE "Evaluacion" ALTER COLUMN "rapidez" SET NOT NULL;

-- Descripción del problema «Otro»
ALTER TABLE "Evaluacion" ADD COLUMN "problemaOtro" TEXT;
