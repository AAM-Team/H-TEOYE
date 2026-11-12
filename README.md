# H-TEOYE — Tu voz mejora Hermosillo

Prototipo cívico para evaluar la calidad de la atención en trámites municipales de Hermosillo, Sonora.
Desarrollado para el **Hackathon de Innovación por la Transparencia y Anticorrupción** del Ayuntamiento de
Hermosillo, reto «Evaluación de la calidad en la atención ciudadana».

**Sitio publicado:** <https://h-teoye.vercel.app>

> **Aviso:** H-TEOYE es un prototipo. No es un servicio oficial del Ayuntamiento y las cifras incluyen datos
> demostrativos ficticios claramente identificados. El logotipo del H. Ayuntamiento de Hermosillo
> (`public/marca/`, descargado de hermosillo.gob.mx) se muestra con permiso del hackathon que el Ayuntamiento
> organiza; retíralo si el proyecto se usa fuera de ese contexto.

## Qué hace

**Portal ciudadano** (sin cuenta)

- **Encuesta de atención** por trámite, en unos 2 minutos:
  - **Folio del trámite** obligatorio: valida la evaluación y permite **una sola evaluación por folio** en cada dependencia.
  - **Modalidad**: presencial, en línea o por teléfono. Las preguntas y la lista de problemas se adaptan a la respuesta.
  - **5 calificaciones obligatorias** (1 a 5 estrellas): trato, claridad, facilidad, **rapidez** y satisfacción general.
  - Opcionales: problemas enfrentados (incluye **«Otro»** con descripción), pago no oficial y comentario.
- **Resultados públicos**: ranking y tablero por dependencia y trámite (sólo agregados; grupos pequeños no se publican).
- **Datos abiertos**: descarga en CSV y API JSON, anonimizados (ver [Datos abiertos](#datos-abiertos)).
- **Mejoras publicadas**: acciones de mejora validadas por las dependencias.
- **Asistente «Sol»**: chatbot sobre los 196 trámites del portal oficial, que lleva a evaluar o a denunciar
  (ver [Asistente «Sol»](#asistente-sol-chatbot)).

**Panel institucional** (`/panel`, con cuenta y roles)

- Tablero de prioridades, evaluaciones individuales (con folio y buscador), moderación de comentarios,
  acciones de mejora, bitácora y **códigos QR por trámite** para las ventanillas.

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Base del proyecto, diseño, base de datos, flujo ciudadano completo | ✅ Lista |
| 2 | Dashboard público con indicadores, filtros, gráficas y descarga de datos abiertos | ✅ Lista |
| 3 | Panel institucional: inicio de sesión, roles, consulta de evaluaciones | ✅ Lista |
| 4 | Acciones de mejora, validación/publicación, moderación, bitácora | ✅ Lista |
| — | Folio obligatorio, encuesta por modalidad, rapidez, «Otro», códigos QR, asistente «Sol» | ✅ Lista |
| — | Despliegue en Vercel + Neon (PostgreSQL) y contenedor Docker | ✅ Lista |
| 5 | Catálogo editable desde el panel, pruebas E2E, accesibilidad, documentación final | Pendiente |

Detalle técnico en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) y bitácora de fases en
[`docs/FASES.md`](docs/FASES.md). Contexto y fuentes en [`docs/CONTEXTO.md`](docs/CONTEXTO.md).

## Tecnologías

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) · Lucide · Recharts · PostgreSQL ·
Prisma 6 · Zod 4 · Vitest · Gemini API (asistente) · qrcode · Vercel + Neon (producción) · Docker.

## Cómo ejecutarlo en Windows

Requisitos: **Node.js 20.9 o superior** (recomendado 22 LTS) y **PostgreSQL 16**, ya sea con
[Docker Desktop](https://www.docker.com/products/docker-desktop/), instalado localmente o con la
[alternativa integrada](#postgresql-local-sin-docker-windows).

```powershell
# 1. Clona el repositorio y entra a la carpeta
git clone https://github.com/AAM-Team/H-TEOYE.git
cd H-TEOYE

# 2. Variables de entorno (ver la tabla de abajo)
copy .env.example .env

# 3. Levanta PostgreSQL (opción Docker: sólo la base de datos)
docker compose up -d db

# 4. Dependencias (también genera el cliente de Prisma)
npm install

# 5. Crea las tablas y carga el catálogo + datos demostrativos
npm run db:deploy
npm run db:seed

# 6. Arranca en modo desarrollo
npm run dev
```

Abre <http://localhost:3000>.

> **Base de datos de Docker:** `docker-compose.yml` publica PostgreSQL en el puerto **5433** con usuario
> `postgres`, contraseña `postgres` y base `h_teoye`. Si la usas, cambia en tu `.env`:
> `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/h_teoye?schema=public"`.
> El valor de `.env.example` (`hteoye:hteoye@localhost:5432/hteoye`) corresponde a un PostgreSQL instalado localmente.

### Variables de entorno

Pon los valores en `.env` (o los secretos en `.env.local`). **Nunca subas estos archivos a Git**: están en
`.gitignore`. En producción se configuran en Vercel (Settings → Environment Variables).

| Variable | Obligatoria | Para qué |
|---|---|---|
| `DATABASE_URL` | Sí | Conexión a PostgreSQL |
| `GEMINI_API_KEY` | Para el asistente | Clave de la API de Gemini ([Google AI Studio](https://aistudio.google.com/apikey)). Sin ella el chat responde «no disponible» |
| `LIMITE_SAL` | En producción | Sal secreta (≥ 16 caracteres) para los límites de uso. Genera una con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SEED_PASSWORD` | Para cuentas demo | Contraseña de las cuentas de demostración del panel (`npm run db:seed`) |
| `SEED_DEMO` | No | `"false"` para no generar evaluaciones demostrativas |
| `GEMINI_MODEL` | No | Fuerza el primer modelo de chat que se intenta |
| `ASISTENTE_LIMITE_DIARIO` | No | Respuestas del asistente por día en todo el sitio (por defecto 1500) |
| `ASISTENTE_DESACTIVADO` | No | `"1"` apaga el asistente sin volver a desplegar |
| `SITIO_URL` | No | Dominio de los códigos QR (por defecto, el de producción en Vercel) |
| `SALT_DISOCIACION` | Recomendada en producción | Sal para los identificadores anónimos de los datos abiertos |

### PostgreSQL local sin Docker (Windows)

Si Prisma falla con `ECONNREFUSED` en `localhost:5432`, la base de datos no está iniciada.
Como alternativa a Docker, puedes usar PostgreSQL 16 dentro del proyecto:

```powershell
npm install --prefix .local/postgres-runtime --no-save --package-lock=false @embedded-postgres/windows-x64@16.15.0-beta.19
npm run db:local
npm run db:deploy
npm run db:seed
npm run dev
```

El script usa el usuario, contraseña, puerto y base de `DATABASE_URL` en `.env`.
Los datos persisten en `.local/postgres-data` (excluido de Git). Después de reiniciar Windows,
ejecuta `npm run db:local` antes de `npm run dev`. Para detener la base: `npm run db:local:stop`.
No ejecutes esta alternativa y Docker en el mismo puerto a la vez; si el puerto 5432 está ocupado por otro
PostgreSQL, cambia el puerto en `DATABASE_URL`.

### Compartir en el mismo Wi-Fi o hotspot

Para que otras personas prueben el sitio en tu red, usa la versión optimizada en vez de `npm run dev`:

```powershell
npm run db:local
npm run build
npm run preview:lan
```

Desde otro dispositivo conectado al mismo Wi-Fi/hotspot, abre `http://<IP-de-tu-computadora>:3001`
(consúltala con `ipconfig`, campo «Dirección IPv4»). Mantén encendida la computadora y abiertas la base
y la terminal del servidor. La compilación local de producción usa `.next-production` y no interfiere con
`npm run dev`. Vuelve a ejecutar `npm run build` y reinicia `npm run preview:lan` después de cambiar código.

Si no abre desde otro dispositivo:

- Comprueba que ambos estén en la misma red; `localhost` en el teléfono apunta al propio teléfono.
- Escribe `http://`, no `https://`, y usa el puerto `3001`.
- Revisa que Windows permita Node.js en el perfil de red activo, sin desactivar el firewall.
- Algunas redes de invitados y hotspots aíslan dispositivos; prueba un Wi-Fi que permita comunicación entre ellos.

Si desarrollas desde otro dispositivo en el puerto 3000, agrega su IP a `allowedDevOrigins` en
`next.config.ts` y reinicia `npm run dev`. Para visitas desde Internet usa el [sitio publicado](https://h-teoye.vercel.app).

### Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run preview:lan` | Sirve la compilación en la red local (puerto 3001) |
| `npm run typecheck` | Genera tipos de rutas y revisa TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run db:deploy` | Aplica las migraciones |
| `npm run db:migrate` | Crea una migración nueva tras cambiar `schema.prisma` |
| `npm run db:seed` | Carga dependencias, catálogo y datos demo si no existen (idempotente) |
| `npm run db:catalogo` | Importa `prisma/catalogo/tramites.json` (idempotente, no toca evaluaciones) |
| `npm run db:reset` | **Borra** la base local y la vuelve a crear (sólo desarrollo) |
| `npm run db:studio` | Explorador visual de la base de datos |
| `npm run db:local` / `db:local:stop` | Inicia o detiene el PostgreSQL integrado |
| `npm run asistente:extraer` | Descarga de nuevo el catálogo del portal de trámites para el asistente |
| `npm run asistente:indexar` | Recalcula los embeddings del asistente |

## Despliegue

### Vercel (producción)

El proyecto `h-teoye` en Vercel está conectado al repositorio: **cada push a `main` se despliega solo** en
<https://h-teoye.vercel.app>, y cada rama o PR recibe una URL de vista previa (protegida con inicio de sesión de Vercel).

- La base de datos es **Neon** (PostgreSQL), creada desde Vercel → Storage; inyecta `DATABASE_URL` y
  `DATABASE_URL_UNPOOLED`.
- `vercel.json` aplica las migraciones pendientes antes de cada compilación
  (`prisma migrate deploy` con la conexión directa de Neon), así que no hay que migrar a mano.
- Variables en Vercel: `GEMINI_API_KEY` y `LIMITE_SAL` (marcadas como sensibles). Las de Neon se agregan solas.
- En Vercel la salida debe quedar en `.next`; `next.config.ts` sólo usa `.next-production` fuera de Vercel.
  Si un despliegue falla con `NEXT_OUTPUT_DIR_MISSING`, revisa el `distDir` de `next.config.ts`.
- Historial y errores: <https://vercel.com/h-teoye/h-teoye/deployments> o `npx vercel inspect <id> --logs`.

### Docker

`Dockerfile` construye la aplicación en modo `standalone` y `docker-compose.yml` levanta la base y la app:

```powershell
docker compose up -d --build
```

La app queda en <http://localhost:3000> y PostgreSQL en el puerto 5433. La primera vez aplica las migraciones y
el seed apuntando `DATABASE_URL` al puerto 5433 (ver la nota de [Cómo ejecutarlo](#cómo-ejecutarlo-en-windows)).
Para usar el asistente, agrega `GEMINI_API_KEY` y `LIMITE_SAL` al servicio `app`.

## La encuesta

Ruta ciudadana: **Evaluar un trámite → dependencia → trámite → encuesta** (`/evaluar/<id>`). También se puede
entrar con la clave estable del catálogo: `/evaluar/clave/<clave>` (la usan los QR y el asistente).

| Paso | Obligatorio | Detalle |
|---|---|---|
| Folio del trámite | Sí | 4 a 40 caracteres (letras, números, `-`, `/`, `.`); se guarda en mayúsculas. **Un folio sólo se evalúa una vez por dependencia**. Nunca se publica: sólo lo ve el personal autorizado en el panel |
| ¿Cómo realizaste el trámite? | Sí | Presencial, en línea o por teléfono. Se sugiere según la modalidad oficial del trámite |
| Calificaciones | Sí | Trato, claridad, facilidad, rapidez y satisfacción general; la redacción cambia según la modalidad |
| Problemas | No | Lista según la modalidad (p. ej. filas largas en presencial; la plataforma falló en línea; no contestaban por teléfono). **«Otro»** pide una descripción de hasta 150 caracteres |
| Pago no oficial y comentario | No | El comentario y la descripción de «Otro» se limpian de datos personales; los comentarios se moderan antes de publicarse |

Si el servidor rechaza el envío (por ejemplo, un folio repetido), el formulario conserva las respuestas.

## Asistente «Sol» (chatbot)

Botón flotante (el sol, esquina inferior derecha) en todas las páginas del portal público. El asistente:

- Responde sobre los **196 trámites** del [Portal de Trámites de Hermosillo](https://tramites.hermosillo.gob.mx/)
  (requisitos, costo, plazos, horarios, contacto, enlace en línea) con **RAG**: búsqueda híbrida BM25 +
  embeddings de Gemini, y respuesta generada con Gemini.
- Invita a evaluar el trámite con el enlace directo y canaliza quejas y denuncias a
  <https://denuncias.hermosillo.gob.mx/>.
- Usa varios modelos de Gemini en orden: si uno no tiene cuota (429), está saturado (503) o tarda en responder,
  pasa al siguiente sin hacer esperar a la persona. Con la **cuota gratuita** suele responder el modelo «lite»,
  más rápido pero menos preciso; con facturación activada en la clave respondería el modelo principal.
- Está protegido: sólo acepta peticiones del propio sitio, valida tamaño y formato, limita mensajes por IP y por
  día (contadores compartidos en PostgreSQL), oculta datos personales antes de enviarlos a Gemini y resiste
  instrucciones inyectadas.

Para actualizar su base de conocimiento cuando cambie el portal oficial:

```powershell
npm run asistente:extraer   # → src/lib/asistente/tramites-hermosillo.json
npm run asistente:indexar   # → src/lib/asistente/embeddings-tramites.json (necesita GEMINI_API_KEY)
```

Sin el archivo de embeddings o sin cuota de Gemini, la búsqueda sigue funcionando sólo con BM25.

## Códigos QR para ventanilla

En el panel, **Códigos QR** (`/panel/qr`) muestra un QR por trámite (cada persona ve sólo los de su dependencia;
la coordinación ve todos). Se descarga en **PNG** (para imprimir) o **SVG**, o se imprime un **cartel tamaño carta**
con instrucciones. Los QR siempre apuntan al sitio publicado (`/evaluar/clave/<clave>`), aunque se generen desde
una computadora local; cambia el dominio con `SITIO_URL` si se usa uno propio.

## Datos abiertos

Evaluaciones **anonimizadas** (sin folios, sin IPs, fecha truncada al día, comentarios sólo si están aprobados,
identificador anónimo por evaluación):

| Ruta | Formato |
|---|---|
| `/resultados/csv` | Descarga CSV (botón en el tablero de resultados) |
| `/api/datos-abiertos/evaluaciones` | JSON con diccionario de datos; `?formato=csv` para CSV |

Filtros opcionales: `dependencia=<slug>`, `tramite=<clave>`, `incluir_demo=true|false`.

## Catálogo de trámites evaluables

El catálogo de la encuesta (25 trámites, 5 por dependencia) está en `prisma/catalogo/tramites.json`, verificado
contra el [Portal de Trámites y Servicios del Ayuntamiento](https://tramites.hermosillo.gob.mx/). Cada trámite
tiene un `id` estable, su `nombre` y su `modalidad` oficial (`ventanilla`, `en_linea` o `con_formato`).

Para aplicar cambios del catálogo a la base de datos:

```powershell
npm run db:catalogo
```

El importador:

- **es idempotente**: si se ejecuta de nuevo sin cambios, no escribe nada;
- **conserva las evaluaciones**: actualiza cada trámite en su lugar (mismo id interno), nunca borra;
- empareja por `id` del catálogo; un trámite que desaparece del archivo se **desactiva**, no se elimina;
- valida que haya 5 trámites por dependencia y que no haya identificadores repetidos;
- trabaja en una sola transacción y registra los cambios en la bitácora.

> El archivo verificado usa el id `ordenamiento-desarrollo-urbano`; el importador lo asocia a la dependencia
> `ordenamiento-y-desarrollo-urbano` (su URL pública) mediante un alias.

## Dos portales

| Portal | Ruta | Cuenta | Para qué |
|---|---|---|---|
| Ciudadano | `/` | No necesita | Evaluar un trámite, ver resultados, descargar datos abiertos, consultar mejoras, preguntar al asistente |
| Funcionarios | `/panel` | Sí (`/panel/login`) | Prioridades, evaluaciones con folio, moderación, acciones de mejora, códigos QR y bitácora |

### Cuentas de demostración del panel

`npm run db:seed` crea estas cuentas **sólo si `SEED_PASSWORD` está definida** (la contraseña de prueba local está
en `.env.example`). Usan el dominio reservado `.example`.

| Correo | Rol | Alcance |
|---|---|---|
| `coordinacion@hteoye.example` | Coordinación general | Todas las dependencias; bitácora |
| `responsable.agua@hteoye.example` | Responsable | Agua de Hermosillo: modera, valida y publica |
| `enlace.agua@hteoye.example` | Enlace | Agua de Hermosillo: consulta y registra acciones |
| `responsable.transito@hteoye.example` | Responsable | Tránsito |
| `responsable.tesoreria@hteoye.example` | Responsable | Tesorería |

Reglas que el servidor aplica en cada acción: cada rol ve sólo su dependencia, quien registra una acción no puede
validarla, sólo se publica lo validado y todo queda en la bitácora. **En producción las cuentas usan otra
contraseña (no la de `.env.example`); cámbiala o elimina las cuentas antes de cualquier uso real.**

## Datos demostrativos

`npm run db:seed` crea las dependencias, importa el catálogo y, **sólo si la base no tiene ninguna**,
genera evaluaciones ficticias con `esDemo = true` (folios `DEMO-2026-000001`, …), que el sitio identifica con
avisos visibles. El seed nunca borra evaluaciones, así que puede ejecutarse varias veces. Para no generar datos
demo: `SEED_DEMO="false"`.

## Seguridad

- Cabeceras en todo el sitio: CSP sin orígenes externos, HSTS, `X-Frame-Options: DENY`, COOP/CORP.
- Límites de uso compartidos en PostgreSQL (tabla `LimiteUso`, sólo hashes con `LIMITE_SAL`, nunca IPs) para el
  asistente, el envío de evaluaciones y el inicio de sesión del panel. En Vercel la IP se toma de `x-real-ip`,
  que la plataforma sobrescribe.
- Sesiones del panel con cookie `httpOnly`, `SameSite=Lax` y `Secure` en producción.
- Secretos sólo en variables de entorno (`.env*` y `.vercel` están en `.gitignore`; `.vercelignore` evita subirlos con la CLI).

## Flujo de trabajo con Git

1. Trabaja en una rama propia: `git checkout -b feature/<descripcion>`.
2. Antes de subir: `npm run typecheck` y `npm test`.
3. Sube la rama y abre un PR hacia `main`; Vercel genera una vista previa del PR.
4. Al fusionar a `main`, Vercel despliega a producción y aplica las migraciones.
5. Después de hacer pull: `npm install` y `npm run db:deploy` por si llegaron paquetes o migraciones nuevas.

## Nota para entornos sin acceso a binarios de Prisma

El cliente de Prisma usa el adaptador `@prisma/adapter-pg` (sin motor binario de consultas). Las migraciones
usan el motor clásico, que Prisma descarga al instalar. Si tu red bloquea `binaries.prisma.sh`, puedes aplicar
`prisma/migrations/*/migration.sql` directamente con `psql`.
