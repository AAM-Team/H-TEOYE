// Servicio de datos del catálogo (HU01).
// Conecta con la API de Django REST Framework en /api/dependencias/
// e implementa almacenamiento local de respaldo para pruebas sin backend.

const API = '/api';
const STORAGE_KEY = 'hteoye_catalogo_v1';

const DATOS_INICIALES = [
  {
    id: 1,
    nombre: 'Tesorería Municipal',
    descripcion: 'Recaudación de impuestos, pagos de servicios y trámites fiscales del municipio.',
    creadoEn: '2026-11-01T10:00:00.000Z',
    servicios: [
      { id: 1, nombre: 'Pago de impuesto predial', creadoEn: '2026-11-01T10:00:00.000Z' },
      { id: 2, nombre: 'Constancia de no adeudo', creadoEn: '2026-11-01T10:00:00.000Z' },
      { id: 3, nombre: 'Licencia de funcionamiento comercial', creadoEn: '2026-11-01T10:00:00.000Z' },
    ],
  },
  {
    id: 2,
    nombre: 'Desarrollo Urbano y Ecología',
    descripcion: 'Licencias de construcción, uso de suelo, permisos ambientales y planeación urbana.',
    creadoEn: '2026-11-01T10:00:00.000Z',
    servicios: [
      { id: 4, nombre: 'Licencia de construcción habitacional', creadoEn: '2026-11-01T10:00:00.000Z' },
      { id: 5, nombre: 'Dictamen de uso de suelo', creadoEn: '2026-11-01T10:00:00.000Z' },
    ],
  },
  {
    id: 3,
    nombre: 'Servicios Públicos Municipales',
    descripcion: 'Recolección de residuos, alumbrado público, parques y bacheo urbano.',
    creadoEn: '2026-11-01T10:00:00.000Z',
    servicios: [
      { id: 6, nombre: 'Reporte de alumbrado público', creadoEn: '2026-11-01T10:00:00.000Z' },
      { id: 7, nombre: 'Recolección de residuos voluminosos', creadoEn: '2026-11-01T10:00:00.000Z' },
      { id: 8, nombre: 'Atención a baches y vialidades', creadoEn: '2026-11-01T10:00:00.000Z' },
    ],
  },
  {
    id: 4,
    nombre: 'Protección Civil Municipal',
    descripcion: 'Inspecciones de seguridad, anuencia para eventos masivos y capacitación de brigadas.',
    creadoEn: '2026-11-01T10:00:00.000Z',
    servicios: [
      { id: 9, nombre: 'Visto Bueno de Programa Interno', creadoEn: '2026-11-01T10:00:00.000Z' },
      { id: 10, nombre: 'Permiso para eventos masivos', creadoEn: '2026-11-01T10:00:00.000Z' },
    ],
  },
];

function leerLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return structuredClone(DATOS_INICIALES);
}

function guardarLocal(datos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  } catch {
    // fallback
  }
}

function primerMensaje(datos) {
  if (!datos) return '';
  if (typeof datos === 'string') return datos;
  if (Array.isArray(datos)) return primerMensaje(datos[0]);
  if (datos.detail) return datos.detail;
  return primerMensaje(Object.values(datos)[0]);
}

async function pedir(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
  } catch {
    return null; // El backend no está corriendo, usar fallback
  }

  if (respuesta.status === 204) return true;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(primerMensaje(datos) || `Error del servidor (${respuesta.status}).`);
  }
  return datos;
}

/** GET /api/dependencias/ */
export async function obtenerDependencias() {
  const datosApi = await pedir('/dependencias/').catch(() => null);
  if (datosApi && Array.isArray(datosApi)) {
    return datosApi;
  }
  return leerLocal();
}

/**
 * POST /api/dependencias/
 * @param {{ nombre: string, descripcion: string, servicios: string[] }} datos
 */
export async function crearDependencia({ nombre, descripcion, servicios }) {
  const payload = {
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    servicios: (servicios || []).map((s) => s.trim()).filter(Boolean),
  };

  const resultadoApi = await pedir('/dependencias/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).catch((err) => {
    if (err.message.includes('servidor')) return null;
    throw err;
  });

  if (resultadoApi) return resultadoApi;

  // Fallback local
  const locales = leerLocal();
  const nuevoId = locales.reduce((m, d) => Math.max(m, d.id), 0) + 1;
  let nextServicioId = 100;
  const nueva = {
    id: nuevoId,
    nombre: payload.nombre,
    descripcion: payload.descripcion,
    creadoEn: new Date().toISOString(),
    servicios: payload.servicios.map((s) => ({
      id: ++nextServicioId,
      nombre: s,
      creadoEn: new Date().toISOString(),
    })),
  };
  guardarLocal([...locales, nueva]);
  return nueva;
}

/** DELETE /api/dependencias/:id/ */
export async function eliminarDependencia(dependenciaId) {
  const res = await pedir(`/dependencias/${dependenciaId}/`, { method: 'DELETE' }).catch(() => null);
  if (res) return;

  const locales = leerLocal();
  guardarLocal(locales.filter((d) => d.id !== dependenciaId));
}

/** POST /api/dependencias/:id/servicios/ */
export async function agregarServicio(dependenciaId, nombre) {
  const payload = { nombre: nombre.trim() };
  const resultadoApi = await pedir(`/dependencias/${dependenciaId}/servicios/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).catch((err) => {
    if (err.message.includes('servidor')) return null;
    throw err;
  });

  if (resultadoApi) return resultadoApi;

  const locales = leerLocal();
  const dep = locales.find((d) => d.id === dependenciaId);
  if (!dep) throw new Error('La dependencia ya no existe.');
  const nuevo = {
    id: Date.now(),
    nombre: payload.nombre,
    creadoEn: new Date().toISOString(),
  };
  dep.servicios.push(nuevo);
  guardarLocal(locales);
  return nuevo;
}

/** DELETE /api/servicios/:id/ */
export async function eliminarServicio(dependenciaId, servicioId) {
  const res = await pedir(`/servicios/${servicioId}/`, { method: 'DELETE' }).catch(() => null);
  if (res) return;

  const locales = leerLocal();
  const dep = locales.find((d) => d.id === dependenciaId);
  if (dep) {
    dep.servicios = dep.servicios.filter((s) => s.id !== servicioId);
    guardarLocal(locales);
  }
}
