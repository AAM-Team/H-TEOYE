# H-TEOYE

Sistema de Evaluación Ciudadana
**H. Ayuntamiento de Hermosillo**  
*Hackaton: Innovación por la transparencia y la anticorrupción — Reto #2: “Evaluación de la calidad en la atención ciudadana”*

## 🏛️ Propósito del Proyecto

El Ayuntamiento de Hermosillo no contaba con un mecanismo accesible y sistemático para capturar, analizar y publicar la experiencia de las personas que utilizan sus servicios públicos. Las opiniones ciudadanas quedaban dispersas en redes sociales o quejas verbales sin procesar, impidiendo que las dependencias identificaran con evidencia sus áreas de oportunidad y debilitando la confianza ciudadana.

**H-TEOYE** resuelve este reto cerrando el ciclo completo de la experiencia ciudadana:
1. **Evaluación Ciudadana Móvil:** Cualquier ciudadano escanea un código QR único en ventanilla y califica su atención en menos de 60 segundos, de manera 100% anónima y sin registros.
2. **Inteligencia de Datos y PLN:** Procesamiento automático del lenguaje natural en español para detectar sentimiento (positivo, neutro, queja) y clasificar el motivo del reporte (tiempos de espera, trato, requisitos, resolución).
3. **Panel Administrativo y Filtros:** Tablero institucional interactivo con Chart.js para que enlaces y autoridades analicen tendencias históricas, quejas críticas y volumen de atención.
4. **Portal Abierto y Compromisos:** Publicación transparente del ranking municipal de calidad y seguimiento auditado de las acciones de mejora asumidas por cada área.


## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Backend | Django 5.2, Django REST Framework |
| Base de datos | PostgreSQL 16 |
| Infraestructura | Docker / Docker Compose |

## Estructura del proyecto

```
H-TEOYE/
├── backend/             # API Django (config/ + app catalogo/)
├── frontend/            # SPA React + Vite
└── docker-compose.yml   # Orquesta db + backend + frontend
```

## Requisitos previos

**Opción recomendada (Docker):**
- [Docker](https://docs.docker.com/get-docker/) y Docker Compose v2

**Opción manual (sin Docker):**
- Python 3.12+
- Node.js 22+
- PostgreSQL 16 en ejecución

## Inicio rápido con Docker

```bash
git clone https://github.com/AAM-Team/H-TEOYE.git
cd H-TEOYE
docker compose up --build
```

Al iniciar, el backend ejecuta las migraciones automáticamente. Servicios disponibles:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api/ |
| Health check | http://localhost:8000/api/health/ |
| Admin de Django | http://localhost:8000/admin/ |

### Cargar datos iniciales (opcional)

Con los contenedores corriendo, en otra terminal:

```bash
docker compose exec backend python manage.py loaddata datos_iniciales
```

### Crear usuario administrador (opcional)

```bash
docker compose exec backend python manage.py createsuperuser
```

### Comandos útiles

```bash
docker compose up -d                 # levantar en segundo plano
docker compose logs -f backend       # ver logs del backend
docker compose down                  # detener contenedores
docker compose down -v               # detener y BORRAR la base de datos
docker compose exec backend python manage.py test   # correr pruebas
```

## Ejecución manual (sin Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configura la base de datos (ver variables de entorno abajo)
export POSTGRES_DB=civica POSTGRES_USER=civica POSTGRES_PASSWORD=civica
export POSTGRES_HOST=localhost POSTGRES_PORT=5432

python manage.py migrate
python manage.py loaddata datos_iniciales   # opcional
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite redirige las peticiones `/api` a `http://localhost:8000` (se puede cambiar con la variable `API_URL`).

Otros scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Variables de entorno

### Backend

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DJANGO_SECRET_KEY` | Llave secreta de Django | valor de desarrollo (**cambiar en producción**) |
| `DJANGO_DEBUG` | Modo debug | `true` |
| `ALLOWED_HOSTS` | Hosts permitidos, separados por coma | `localhost,127.0.0.1,backend` |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos, separados por coma | `http://localhost:5173` |
| `DATABASE_URL` | URL completa de la BD (tiene prioridad) | — |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciales de PostgreSQL | `civica` en Docker |
| `POSTGRES_HOST` / `POSTGRES_PORT` | Host y puerto de PostgreSQL | `db` / `5432` |

### Frontend

| Variable | Descripción |
|----------|-------------|
| `API_URL` | URL del backend a la que Vite hace proxy de `/api` (default `http://localhost:8000`) |
| `VITE_USE_POLLING` | `true` para detectar cambios de archivos dentro de Docker |

> Las credenciales de `docker-compose.yml` son solo para desarrollo local. No las uses en producción.

## API

Base: `/api/`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/dependencias/` | Lista dependencias con sus servicios |
| `POST` | `/dependencias/` | Crea una dependencia con sus servicios |
| `DELETE` | `/dependencias/<id>/` | Elimina una dependencia y sus servicios |
| `POST` | `/dependencias/<id>/servicios/` | Agrega un servicio a una dependencia |
| `DELETE` | `/servicios/<id>/` | Elimina un servicio |
| `GET` | `/health/` | Estado del servicio |

**Reglas de negocio:**
- El nombre de una dependencia es único.
- No puede haber dos servicios con el mismo nombre dentro de una dependencia.
- Una dependencia debe conservar al menos un servicio (no se puede eliminar el último).

## Flujo de trabajo del equipo

1. Crea una rama desde `main` (`feature/...`, `fix/...`).
2. Haz commits descriptivos (por ejemplo `feat(front): ...`, `fix(back): ...`).
3. Abre un Pull Request hacia `main` y solicita revisión.

## Problemas comunes

- **El backend no conecta a la BD:** verifica que el contenedor `db` esté saludable (`docker compose ps`) o que las variables `POSTGRES_*` sean correctas.
- **Errores de CORS:** agrega el origen de tu frontend a `CORS_ALLOWED_ORIGINS`.
- **Puerto ocupado (5173 / 8000):** detén el proceso que lo usa o cambia el puerto en `docker-compose.yml`.
- **Quiero reiniciar la base de datos:** `docker compose down -v` y vuelve a levantar.
