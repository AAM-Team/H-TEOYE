# Arquitectura de H-TEOYE

## 1. Requisitos clave

- Dos módulos sobre una misma base de datos: **portal ciudadano** (público, anónimo) y **panel institucional**
  (privado, por roles y dependencia).
- Flujo obligatorio: ciudadano elige dependencia y trámite → contesta → se guarda en PostgreSQL → el
  dashboard público se actualiza → usuario institucional inicia sesión → consulta evaluaciones de su
  dependencia → registra acción de mejora → la acción se publica sólo tras validarse.
- Gobernanza: sin datos personales, comentarios moderados, control de acceso, bitácora, separación entre
  datos internos y estadísticas públicas, metodología visible, datos demo identificados.

## 2. Decisiones

| Decisión | Motivo |
|---|---|
| Un solo proyecto Next.js con grupos de rutas `(portal)` y, en fase 3, `panel/` | Comparten modelo, validaciones y componentes; temas visuales separados con la clase `.theme-panel`. |
| Server Components para leer, Server Actions + Zod para escribir | Sin API intermedia; la validación vive en el servidor. |
| `cacheComponents: false` y páginas con datos en `force-dynamic` | Los indicadores deben reflejar cada evaluación al instante; modelo más predecible para el prototipo. |
| Prisma 6 con `@prisma/adapter-pg` y `engineType = "client"` | Sin motor binario de consultas; funciona igual en Windows, Linux y contenedores. |
| Autenticación propia (fase 3): bcrypt + sesiones en BD con token aleatorio (se guarda su SHA-256) en cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción | Sin dependencias externas ni servicios de terceros; revocable desde la BD; autorización comprobada en el servidor en cada acción. |
| Consultas públicas aisladas en `src/lib/consultas/publicas.ts` | Sólo exponen catálogos y agregados; nunca filas individuales ni comentarios sin moderar. |
| Umbral de 5 evaluaciones para desgloses públicos (fase 2) | Protege el anonimato en filtros pequeños. |
| Límite de envíos en memoria con hash salado de la IP | Frena abuso sin persistir datos de la conexión. |
| Fuente Public Sans autoalojada (`@fontsource-variable`) | No depende de Google Fonts en tiempo de compilación. |

## 3. Modelo de datos

```
Dependencia 1─* Tramite 1─* Evaluacion
Dependencia 1─* Evaluacion          (desnormalizado para agregar rápido)
Dependencia 1─* AccionMejora *─0..1 Tramite
Dependencia 1─* Usuario (null para ADMINISTRADOR)
Usuario 1─* Sesion · Usuario 1─* Bitacora
Usuario 1─* AccionMejora (creadoPor / validadaPor)
Usuario 1─* Evaluacion (comentarioRevisadoPor)
```

**Evaluacion**: `trato`, `claridad`, `facilidad`, `satisfaccion` (1–5), `canal?`, `problemas[]` (categorías
de la ENCIG), `pagoIndebido?` (null = no respondió), `comentario?`, `estadoComentario`
(SIN_COMENTARIO · PENDIENTE · APROBADO · RECHAZADO), `comentarioRedactado`, `esDemo`, `createdAt`.
No existe ningún campo para nombre, CURP, correo, expediente ni IP.

**Tramite**: `clave` (id estable del catálogo oficial, única), `nombre`, `modalidad`
(VENTANILLA · EN_LINEA · CON_FORMATO), `orden`, `activo`. Se importa con `npm run db:catalogo`, que actualiza
en su lugar y nunca borra.

**AccionMejora**: `estado` (PENDIENTE · EN_REVISION · EN_PROCESO · CONCLUIDA), `validada`, `validadaPor`,
`publicada`, `publicadaEn`, `esDemo`. Regla: `publicada` exige `validada`; quien valida no puede ser quien
creó la acción.

**Roles**

| Rol | Alcance |
|---|---|
| ADMINISTRADOR | Todas las dependencias; modera, valida, publica, consulta bitácora y catálogo. |
| RESPONSABLE | Su dependencia; consulta, registra, valida y publica acciones; modera comentarios. |
| ENLACE | Su dependencia; consulta evaluaciones y registra/actualiza acciones (no valida ni publica). |

## 4. Rutas

| Ruta | Fase | Descripción |
|---|---|---|
| `/` | 1 | Inicio con indicadores reales |
| `/dependencias`, `/dependencias/[slug]` | 1 | Catálogo |
| `/evaluar/[tramiteId]`, `/evaluar/gracias` | 1 | Encuesta y confirmación |
| `/metodologia`, `/privacidad` | 1 | Transparencia |
| `/resultados`, `/resultados/csv` | 2 | Dashboard público y exportación agregada |
| `/acciones` | 4 | Acciones de mejora publicadas |
| `/panel/login`, `/panel` | 3 | Acceso y dashboard interno |
| `/panel/evaluaciones` | 3 | Consulta y filtros |
| `/panel/acciones`, `/panel/comentarios`, `/panel/bitacora` | 4 | Gestión y gobernanza |
| `/panel/catalogo` | 5 | Trámites configurables |

## 5. Estructura

```
prisma/
  schema.prisma            modelo
  migrations/              SQL versionado
  catalogo/                dependencias.ts · tramites.json (catálogo oficial)
  seed.ts                  carga idempotente + datos demo
src/
  app/(portal)/            portal ciudadano
  components/ui/           shadcn/ui
  components/portal/       encabezado, pie, aviso de prototipo, prosa
  components/encuesta/     estrellas y formulario
  lib/consultas/           acceso a datos (público / interno)
  lib/validaciones/        esquemas Zod y redacción de datos personales
tests/                     Vitest
```

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cambios futuros al catálogo | Importador idempotente por clave; trámites retirados se desactivan, no se borran. |
| Next.js 16 muy reciente | Se leyó la documentación incluida en `node_modules/next/dist/docs`; caché de componentes desactivada. |
| Spam / envíos repetidos | Límite por conexión, campo trampa; en producción, sustituir por almacén compartido (Redis) y CAPTCHA accesible. |
| Datos personales en comentarios | Redacción automática + moderación humana obligatoria. |
| Confusión entre datos demo y reales | `esDemo` por registro, avisos visibles, opción de excluirlos. |
| Interpretación como muestra representativa | Página de metodología y avisos en pie y dashboard. |
| Escalamiento horizontal | El límite de envíos en memoria es por instancia (documentado). |
