// Servicio de datos del catálogo (HU01).

const API = '/api';

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
    throw new Error('No se pudo conectar con el servidor. Revisa que el backend esté corriendo.');
  }

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(primerMensaje(datos) || `Error del servidor (${respuesta.status}).`);
  }
  return datos;
}

/** GET /api/dependencias/ */
export function obtenerDependencias() {
  return pedir('/dependencias/');
}

/**
 * POST /api/dependencias/
 * @param {{ nombre: string, descripcion: string, servicios: string[] }} datos
 */
export function crearDependencia({ nombre, descripcion, servicios }) {
  return pedir('/dependencias/', {
    method: 'POST',
    body: JSON.stringify({ nombre, descripcion, servicios }),
  });
}

export function eliminarDependencia(dependenciaId) {
  return pedir(`/dependencias/${dependenciaId}/`, { method: 'DELETE' });
}

export function agregarServicio(dependenciaId, nombre) {
  return pedir(`/dependencias/${dependenciaId}/servicios/`, {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  });
}

export function eliminarServicio(_dependenciaId, servicioId) {
  return pedir(`/servicios/${servicioId}/`, { method: 'DELETE' });
}