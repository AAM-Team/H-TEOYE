# H-TEOYE — Tu voz mejora Hermosillo

Prototipo cívico para evaluar la calidad de la atención en trámites municipales de Hermosillo, Sonora.
Desarrollado para el **Hackathon de Innovación por la Transparencia y Anticorrupción** del Ayuntamiento de
Hermosillo, reto «Evaluación de la calidad en la atención ciudadana».

> **Aviso:** H-TEOYE es un prototipo. No es un servicio oficial del Ayuntamiento y las cifras incluyen datos
> demostrativos ficticios claramente identificados. El logotipo del H. Ayuntamiento de Hermosillo
> (`public/marca/`, descargado de hermosillo.gob.mx) se muestra con permiso del hackathon que el Ayuntamiento
> organiza; retíralo si el proyecto se usa fuera de ese contexto.

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Base del proyecto, diseño, base de datos, flujo ciudadano completo | ✅ Lista |
| 2 | Dashboard público con indicadores, filtros y gráficas (CSV pendiente) | ✅ Lista |
| 3 | Panel institucional: inicio de sesión, roles, consulta de evaluaciones | ✅ Lista |
| 4 | Acciones de mejora, validación/publicación, moderación, bitácora | ✅ Lista |
| 5 | Catálogo editable desde el panel, pruebas E2E, accesibilidad, documentación final | Pendiente |

Detalle técnico en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) y bitácora de fases en
[`docs/FASES.md`](docs/FASES.md). Contexto y fuentes en [`docs/CONTEXTO.md`](docs/CONTEXTO.md).

## Tecnologías

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) · Lucide · Recharts · PostgreSQL ·
Prisma 6 · Zod 4 · Vitest.

## Cómo ejecutarlo en Windows

Requisitos: **Node.js 20.9 o superior** (recomendado 22 LTS) y **PostgreSQL 16**, ya sea con
[Docker Desktop](https://www.docker.com/products/docker-desktop/) o instalado localmente.

```powershell
# 1. Entra a la carpeta del proyecto
cd "C:\Users\DGSSP\Downloads\H- TEOYE"

# 2. Levanta PostgreSQL (opción Docker). Si instalaste PostgreSQL localmente,
#    crea un usuario y base "hteoye" con contraseña "hteoye" o ajusta .env
docker compose up -d

# 3. Variables de entorno
copy .env.example .env

# 4. Dependencias (también genera el cliente de Prisma)
npm install

# 5. Crea las tablas y carga el catálogo + datos demostrativos
npm run db:deploy
npm run db:seed

# 6. Arranca en modo desarrollo
npm run dev
```

Abre <http://localhost:3000>.

### PostgreSQL local sin Docker (Windows)

Si Prisma falla con `ECONNREFUSED` en `localhost:5432`, la base de datos no est? iniciada.
Como alternativa a Docker, puedes usar PostgreSQL 16 dentro del proyecto:

```powershell
npm install --prefix .local/postgres-runtime --no-save --package-lock=false @embedded-postgres/windows-x64@16.15.0-beta.19
npm run db:local
npm run db:deploy
npm run db:seed
npm run dev
```

El script usa el usuario, contrase?a, puerto y base de `DATABASE_URL` en `.env`.
Los datos persisten en `.local/postgres-data` (excluido de Git). Despu?s de reiniciar Windows,
ejecuta `npm run db:local` antes de `npm run dev`. Para detener la base: `npm run db:local:stop`.
No ejecutes esta alternativa y Docker en el mismo puerto a la vez.

### Compartir en el mismo Wi-Fi o hotspot

Para que otras personas prueben el sitio, usa la versi?n optimizada en vez de `npm run dev`:

```powershell
npm run db:local
npm run build
npm run preview:lan
```

Desde otro dispositivo conectado al mismo Wi-Fi/hotspot, abre `http://172.20.10.11:3001`
(IP de esta computadora al configurar la prueba). Mant?n encendida la computadora y abiertas la base
y la terminal del servidor. Si cambia la red, consulta la nueva direcci?n IPv4 con `ipconfig`.
La compilaci?n de producci?n usa `.next-production` y no interfiere con `npm run dev`.
Vuelve a ejecutar `npm run build` y reinicia `npm run preview:lan` despu?s de cambiar c?digo.

Si no abre desde otro dispositivo:

- Comprueba que ambos est?n en la misma red; `localhost` en el tel?fono apunta al propio tel?fono.
- Escribe `http://`, no `https://`, y usa el puerto `3001` de esta prueba.
- Revisa que Windows permita Node.js en el perfil de red activo, sin desactivar el firewall.
- Algunas redes de invitados y hotspots a?slan dispositivos; prueba un Wi-Fi que permita comunicaci?n entre ellos.
- Esta IP es privada: para visitas desde Internet hace falta desplegar el sitio o configurar un t?nel. Subirlo a GitHub no inicia el servidor ni PostgreSQL.

Si desarrollas desde otro dispositivo en el puerto 3000, agrega la IP actual a `allowedDevOrigins`
en `next.config.ts` y reinicia `npm run dev`. El modo desarrollo compila rutas al visitarlas y no
es el indicado para medir la respuesta en el tel?fono.

### Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run typecheck` | Genera tipos de rutas y revisa TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run db:deploy` | Aplica las migraciones |
| `npm run db:migrate` | Crea una migración nueva tras cambiar `schema.prisma` |
| `npm run db:seed` | Carga dependencias, catálogo y datos demo si no existen (idempotente) |
| `npm run db:catalogo` | Importa `prisma/catalogo/tramites.json` (idempotente, no toca evaluaciones) |
| `npm run db:studio` | Explorador visual de la base de datos |

## Catálogo de trámites

El catálogo oficial (25 trámites, 5 por dependencia) está en `prisma/catalogo/tramites.json`, verificado
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

## Asistente «Sol» (chatbot)

Botón flotante (el sol, esquina inferior derecha) en todas las páginas del portal público. Abre una
ventana de chat que:

- Responde sobre los trámites del [Portal de Trámites de Hermosillo](https://tramites.hermosillo.gob.mx/)
  (requisitos, costo, plazos, horarios, contacto, enlace en línea) con RAG: recuperación híbrida
  BM25 + embeddings de Gemini y respuesta generada con Gemini.
- Lleva a evaluar un trámite en H-TEOYE (`/evaluar/clave/<clave>` redirige a la encuesta).
- Canaliza quejas, denuncias y reconocimientos a <https://denuncias.hermosillo.gob.mx/>.

Configuración: pon `GEMINI_API_KEY` en `.env.local` (ver `.env.example`).

| Script | Para qué |
|---|---|
| `npm run asistente:extraer` | Vuelve a descargar el catálogo del portal → `src/lib/asistente/tramites-hermosillo.json` |
| `npm run asistente:indexar` | Recalcula los embeddings → `src/lib/asistente/embeddings-tramites.json` |

Ejecuta ambos (en ese orden) cuando el portal oficial cambie. Sin el archivo de embeddings o sin cuota
de Gemini, la búsqueda sigue funcionando sólo con BM25.

## Dos portales

| Portal | Ruta | Cuenta | Para qué |
|---|---|---|---|
| Ciudadano | `/` | No necesita | Evaluar un trámite, ver el ranking y los resultados, consultar las mejoras publicadas |
| Funcionarios | `/panel` | Sí (`/panel/login`) | Prioridades por trámite, evaluaciones individuales, moderación de comentarios, acciones de mejora y bitácora |

### Cuentas de demostración del panel

`npm run db:seed` crea estas cuentas **sólo si `SEED_PASSWORD` está definida** (la contraseña de prueba está en
`.env.example`; cópiala a `.env` o pásala al ejecutar el seed). Usan el dominio reservado `.example`.

| Correo | Rol | Alcance |
|---|---|---|
| `coordinacion@hteoye.example` | Coordinación general | Todas las dependencias; bitácora |
| `responsable.agua@hteoye.example` | Responsable | Agua de Hermosillo: modera, valida y publica |
| `enlace.agua@hteoye.example` | Enlace | Agua de Hermosillo: consulta y registra acciones |
| `responsable.transito@hteoye.example` | Responsable | Tránsito |
| `responsable.tesoreria@hteoye.example` | Responsable | Tesorería |

Reglas que el servidor aplica en cada acción: cada rol ve sólo su dependencia, quien registra una acción no puede
validarla, sólo se publica lo validado y todo queda en la bitácora. **Cambia la contraseña o elimina estas cuentas
antes de cualquier uso real.**

## Datos demostrativos

`npm run db:seed` crea las dependencias, importa el catálogo y, **sólo si la base no tiene ninguna**,
genera evaluaciones ficticias con `esDemo = true`, que el sitio identifica con avisos visibles. El seed nunca
borra evaluaciones, así que puede ejecutarse varias veces. Para no generar datos demo: `SEED_DEMO="false"`.

## Nota para entornos sin acceso a binarios de Prisma

El cliente de Prisma usa el adaptador `@prisma/adapter-pg` (sin motor binario de consultas). Las migraciones
usan el motor clásico, que Prisma descarga al instalar. Si tu red bloquea `binaries.prisma.sh`, puedes aplicar
`prisma/migrations/*/migration.sql` directamente con `psql`.
