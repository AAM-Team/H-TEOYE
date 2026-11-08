import { useState } from 'react';

// Tarjeta con una dependencia, la lista de sus servicios
// y un formulario corto para agregarle más servicios.
export default function DependenciaCard({
  dependencia,
  onAgregarServicio,
  onEliminarServicio,
  onEliminarDependencia,
}) {
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const agregar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await onAgregarServicio(dependencia.id, nuevoServicio);
      setNuevoServicio('');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarDependencia = () => {
    const mensaje = `¿Eliminar "${dependencia.nombre}" y sus ${dependencia.servicios.length} servicio(s)? Esta acción no se puede deshacer.`;
    if (window.confirm(mensaje)) onEliminarDependencia(dependencia.id);
  };

  const confirmarEliminarServicio = (servicio) => {
    if (dependencia.servicios.length === 1) {
      window.alert('Una dependencia debe tener al menos un servicio. Agrega otro antes de eliminar este.');
      return;
    }
    if (window.confirm(`¿Eliminar el servicio "${servicio.nombre}"?`)) {
      onEliminarServicio(dependencia.id, servicio.id);
    }
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900">{dependencia.nombre}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{dependencia.descripcion}</p>
        </div>
        <button
          type="button"
          onClick={confirmarEliminarDependencia}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          Eliminar
        </button>
      </header>

      <ul className="divide-y divide-gray-100">
        {dependencia.servicios.map((servicio) => (
          <li key={servicio.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <p className="min-w-0 text-sm font-medium text-gray-800">{servicio.nombre}</p>
            <button
              type="button"
              onClick={() => confirmarEliminarServicio(servicio)}
              aria-label={`Eliminar servicio ${servicio.nombre}`}
              className="shrink-0 rounded-md px-2 py-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={agregar} className="border-t border-gray-100 px-5 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={120}
            value={nuevoServicio}
            onChange={(e) => {
              setNuevoServicio(e.target.value);
              if (error) setError('');
            }}
            aria-label={`Nuevo servicio para ${dependencia.nombre}`}
            placeholder="Agregar un servicio…"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={guardando || !nuevoServicio.trim()}
            className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </form>
    </article>
  );
}