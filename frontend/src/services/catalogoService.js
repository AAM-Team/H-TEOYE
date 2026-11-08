// Servicio de datos del catálogo (HU01).
//
// Mientras no exista el backend en Django REST Framework, este archivo simula
// la API guardando los datos en el navegador (localStorage). Todas las
// funciones son asíncronas y lanzan un Error con mensaje legible cuando algo
// no es válido, igual que lo haría una respuesta 400 del servidor.
//
// Cuando el backend esté listo, solo hay que reemplazar el cuerpo de cada
// función por una llamada fetch al endpoint correspondiente; los componentes
// no necesitan cambiar.

const STORAGE_KEY = 'civica_catalogo_v1';

const DATOS_INICIALES = [
  {
    id: 1,
    nombre: 'Tesorería Municipal',
    descripcion: 'Recaudación de impuestos y pagos municipales.',
    creadoEn: '2026-11-01T10:00:00.000Z',
    servicios: [
      { id: 1, nombre: 'Pago de impuesto predial', creadoEn: '2026-11-01T10:00:00.000Z' },
      { id: 2, nombre: 'Constancia de no adeudo', creadoEn: '2026-11-01T10:00:00.000Z' },
    ],
  },
  {
    id: 2,
    nombre: 'Desarrollo Urbano y Ecología',
    descripcion: 'Licencias de construcción, uso de suelo y trámites urbanos.',
    creadoEn: '2026-11-01T10:00:00.000Z',
    servicios: [
      { id: 3, nombre: 'Licencia de construcción', creadoEn: '2026-11-01T10:00:00.000Z' },
    ],
  },
  {
    id: 3,
    nombre: 'Servicios Públicos',
    descripcion: 'Recolección de basura, alumbrado y mantenimiento urbano.',
    creadoEn: '2026-11-01T10:00:00.000Z',
    servicios: [
      { id: 4, nombre: 'Reporte de alumbrado público', creadoEn: '2026-11-01T10:00:00.000Z' },
      { id: 5, nombre: 'Recolección de residuos voluminosos', creadoEn: '2026-11-01T10:00:00.000Z' },
    ],
  },
];

// ---------- Utilidades internas ----------

const esperar = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

function leer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Si el almacenamiento no está disponible, se usan los datos iniciales.
  }
  return structuredClone(DATOS_INICIALES);
}

function guardar(datos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  } catch {
    // Sin almacenamiento disponible: los cambios duran solo esta sesión.
  }
}

// Compara textos ignorando mayúsculas, acentos y espacios extra.
function normalizar(texto) {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function limpiar(texto) {
  return (texto ?? '').trim().replace(/\s+/g, ' ');
}

function siguienteIdDependencia(datos) {
  return datos.reduce((max, d) => Math.max(max, d.id), 0) + 1;
}

function siguienteIdServicio(datos) {
  const ids = datos.flatMap((d) => d.servicios.map((s) => s.id));
  return ids.reduce((max, id) => Math.max(max, id), 0) + 1;
}

function validarNombreServicio(nombre, serviciosExistentes) {
  if (!nombre) throw new Error('El nombre del servicio es obligatorio.');
  if (nombre.length > 120) throw new Error('El nombre del servicio no puede pasar de 120 caracteres.');
  const repetido = serviciosExistentes.some((s) => normalizar(s.nombre) === normalizar(nombre));
  if (repetido) throw new Error(`El servicio "${nombre}" ya existe en esta dependencia.`);
}

/** GET /api/dependencias/ */
export async function obtenerDependencias() {
  await esperar();
  return leer();
}

/**
 * POST /api/dependencias/
 * @param {{ nombre: string, descripcion: string, servicios: string[] }} datosNuevos
 */
export async function crearDependencia({ nombre, descripcion, servicios }) {
  await esperar();
  const datos = leer();

  const nombreLimpio = limpiar(nombre);
  const descripcionLimpia = limpiar(descripcion);
  const nombresServicios = (servicios ?? []).map(limpiar).filter(Boolean);

  if (!nombreLimpio) throw new Error('El nombre de la dependencia es obligatorio.');
  if (nombreLimpio.length > 120) throw new Error('El nombre de la dependencia no puede pasar de 120 caracteres.');
  if (!descripcionLimpia) throw new Error('La descripción es obligatoria.');
  if (descripcionLimpia.length > 300) throw new Error('La descripción no puede pasar de 300 caracteres.');
  if (datos.some((d) => normalizar(d.nombre) === normalizar(nombreLimpio))) {
    throw new Error(`Ya existe una dependencia llamada "${nombreLimpio}".`);
  }
  if (nombresServicios.length === 0) {
    throw new Error('Asigna al menos un servicio a la dependencia.');
  }

  const ahora = new Date().toISOString();
  let idServicio = siguienteIdServicio(datos);
  const serviciosNuevos = [];
  for (const nombreServicio of nombresServicios) {
    validarNombreServicio(nombreServicio, serviciosNuevos);
    serviciosNuevos.push({ id: idServicio++, nombre: nombreServicio, creadoEn: ahora });
  }

  const dependencia = {
    id: siguienteIdDependencia(datos),
    nombre: nombreLimpio,
    descripcion: descripcionLimpia,
    creadoEn: ahora,
    servicios: serviciosNuevos,
  };

  guardar([...datos, dependencia]);
  return dependencia;
}

/** DELETE /api/dependencias/:id/ */
export async function eliminarDependencia(dependenciaId) {
  await esperar();
  const datos = leer();
  guardar(datos.filter((d) => d.id !== dependenciaId));
}

/** POST /api/dependencias/:id/servicios/ */
export async function agregarServicio(dependenciaId, nombre) {
  await esperar();
  const datos = leer();
  const dependencia = datos.find((d) => d.id === dependenciaId);
  if (!dependencia) throw new Error('La dependencia ya no existe.');

  const nombreLimpio = limpiar(nombre);
  validarNombreServicio(nombreLimpio, dependencia.servicios);

  const servicio = {
    id: siguienteIdServicio(datos),
    nombre: nombreLimpio,
    creadoEn: new Date().toISOString(),
  };
  dependencia.servicios.push(servicio);
  guardar(datos);
  return servicio;
}

/** DELETE /api/servicios/:id/ */
export async function eliminarServicio(dependenciaId, servicioId) {
  await esperar();
  const datos = leer();
  const dependencia = datos.find((d) => d.id === dependenciaId);
  if (!dependencia) return;
  dependencia.servicios = dependencia.servicios.filter((s) => s.id !== servicioId);
  guardar(datos);
}