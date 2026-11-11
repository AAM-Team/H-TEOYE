# Bitácora de fases

## Fase 1 — Fundaciones y flujo ciudadano ✅

**Implementado**

- Proyecto Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui (Radix) + Lucide; Recharts instalado para la fase 2.
- Sistema visual: tokens de la paleta con variantes de contraste AA, tema portal (naranja) y tema panel
  (turquesa/azul), marca propia (no oficial), fuente Public Sans autoalojada.
- Esquema Prisma completo (7 modelos) y migración inicial; incluye ya usuarios, sesiones, acciones y bitácora.
- Seed idempotente: 5 dependencias, 25 espacios de trámite desde `tramites.json`, ~580 evaluaciones demo.
- Portal: inicio con indicadores reales, catálogo, detalle por dependencia, encuesta (4 dimensiones con
  estrellas accesibles, canal, problemas ENCIG, pago no oficial, comentario, aceptación de privacidad),
  confirmación, metodología con contexto citado, aviso de privacidad, 404.
- Seguridad y privacidad: validación Zod en servidor, redacción automática de datos personales, comentario
  en estado PENDIENTE, límite de envíos sin guardar IP, campo trampa, cabeceras de seguridad.

**Verificación**

- `npm run typecheck` sin errores · `npm run lint` sin errores ni advertencias.
- `npm test`: 16 pruebas (validación, redacción de datos personales, límite de envíos).
- `npm run build` correcto; las 8 rutas responden (200 y 404 donde corresponde).
- Prueba E2E con Playwright: inicio → dependencia → trámite → envío vacío (errores) → envío completo →
  registro en PostgreSQL con comentario redactado → contador del inicio incrementado. Sin errores de consola,
  sin desplazamiento horizontal en móvil (390 px).

## Fase 1.1 — Catálogo oficial de trámites ✅

- `prisma/catalogo/tramites.json` con los 25 trámites verificados en tramites.hermosillo.gob.mx (nombres,
  identificadores y modalidades oficiales).
- Migración aditiva `20261111190000_catalogo_tramites`: columnas `Tramite.clave` (única) y
  `Tramite.modalidad` (VENTANILLA · EN_LINEA · CON_FORMATO). No borra ni reinicia datos.
- Importador idempotente `npm run db:catalogo` (`prisma/catalogo/importar.ts`), usado también por el seed.
- El seed ya no borra evaluaciones demo; sólo las crea si no existen.
- El portal muestra la modalidad oficial de cada trámite.

**Verificación:** primera ejecución 25 asignados a sus espacios existentes; segunda ejecución 25 sin cambios.
Mismos 25 ids internos y mismas evaluaciones por trámite (579 → 579). Prueba en una copia de la base con
orden intercambiado, renombre y reemplazo de un trámite: comportamiento correcto y reversible.

**Pendiente**

- Fases 2 a 5.
