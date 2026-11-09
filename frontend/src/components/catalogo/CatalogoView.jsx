import { useEffect, useMemo, useState } from 'react';
import DependenciaCard from './DependenciaCard';
import DependenciaForm from './DependenciaForm';
import {
  agregarServicio,
  crearDependencia,
  eliminarDependencia,
  eliminarServicio,
  obtenerDependencias,
} from '../../services/catalogoService';

// HU01 — Vista del administrador para el catálogo de dependencias y servicios.
export default function CatalogoView() {
  const [dependencias, setDependencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [aviso, setAviso] = useState('');

  // Vuelve a pedir el catálogo (después de guardar, eliminar o reintentar).
  const recargar = async () => {
    try {
      setDependencias(await obtenerDependencias());
      setErrorCarga('');
    } catch {
      setErrorCarga('No se pudo cargar el catálogo. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // Carga inicial al abrir la pestaña.
  useEffect(() => {
    let activo = true;
    obtenerDependencias()
      .then((datos) => activo && setDependencias(datos))
      .catch(() => activo && setErrorCarga('No se pudo cargar el catálogo. Intenta de nuevo.'))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  // El aviso de éxito desaparece solo después de unos segundos.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 3000);
    return () => clearTimeout(t);
  }, [aviso]);

  const totalServicios = dependencias.reduce((suma, d) => suma + d.servicios.length, 0);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return dependencias;
    return dependencias.filter(
      (d) =>
        d.nombre.toLowerCase().includes(q) ||
        d.servicios.some((s) => s.nombre.toLowerCase().includes(q)),
    );
  }, [dependencias, busqueda]);

  // ---------- Acciones ----------

  const guardarDependencia = async (datos) => {
    const nueva = await crearDependencia(datos); // si falla, el formulario muestra el error
    await recargar();
    setMostrarForm(false);
    setAviso(`Dependencia "${nueva.nombre}" registrada con ${nueva.servicios.length} servicio(s).`);
  };

  const manejarAgregarServicio = async (dependenciaId, nombre) => {
    const servicio = await agregarServicio(dependenciaId, nombre);
    await recargar();
    setAviso(`Servicio "${servicio.nombre}" agregado.`);
  };

  const manejarEliminarServicio = async (dependenciaId, servicioId) => {
    await eliminarServicio(dependenciaId, servicioId);
    await recargar();
    setAviso('Servicio eliminado.');
  };

  const manejarEliminarDependencia = async (dependenciaId) => {
    await eliminarDependencia(dependenciaId);
    await recargar();
    setAviso('Dependencia eliminada.');
  };

  // ---------- Render ----------

  return (
    <section className="space-y-6">
      {/* Resumen y acciones principales */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-4">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Dependencias</p>
            <p className="text-2xl font-bold text-gray-900">{dependencias.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Servicios registrados</p>
            <p className="text-2xl font-bold text-gray-900">{totalServicios}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar dependencia o servicio…"
            aria-label="Buscar dependencia o servicio"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72"
          />
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Nueva dependencia
          </button>
        </div>
      </div>

      {/* Aviso de éxito */}
      {aviso && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
          ✓ {aviso}
        </p>
      )}

      {/* Contenido */}
      {cargando ? (
        <p className="py-12 text-center text-sm text-gray-500">Cargando catálogo…</p>
      ) : errorCarga ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{errorCarga}</p>
          <button onClick={recargar} className="mt-3 text-sm font-medium text-red-700 underline">
            Reintentar
          </button>
        </div>
      ) : dependencias.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="font-medium text-gray-700">Aún no hay dependencias registradas</p>
          <p className="mt-1 text-sm text-gray-500">Da de alta la primera para empezar.</p>
          <button
            onClick={() => setMostrarForm(true)}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nueva dependencia
          </button>
        </div>
      ) : filtradas.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Ninguna dependencia o servicio coincide con “{busqueda}”.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filtradas.map((dependencia) => (
            <DependenciaCard
              key={dependencia.id}
              dependencia={dependencia}
              onAgregarServicio={manejarAgregarServicio}
              onEliminarServicio={manejarEliminarServicio}
              onEliminarDependencia={manejarEliminarDependencia}
            />
          ))}
        </div>
      )}

      {mostrarForm && (
        <DependenciaForm onGuardar={guardarDependencia} onCancelar={() => setMostrarForm(false)} />
      )}
    </section>
  );
}