import { useState } from 'react';

// Tarjeta con una dependencia, la lista de sus servicios
// y el código QR único descargable por cada servicio (HU01).
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
        {dependencia.servicios.map((servicio) => {
          // URL de evaluación única para este servicio asociada al QR
          const urlEvaluacion = `${window.location.origin}/evaluar/${dependencia.id}/${servicio.id}`;
          // URL del código QR generado dinámicamente mediante API pública estándar
          const urlQrApi = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlEvaluacion)}`;

          return (
            <li key={servicio.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm font-medium text-gray-800">{servicio.nombre}</p>
                <p className="mt-0.5 text-xs text-gray-400 truncate">URL: {urlEvaluacion}</p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {/* Contenedor del Código QR y su enlace de descarga */}
                <div className="flex flex-col items-center bg-white p-1.5 border border-gray-200 rounded-lg shadow-2xs">
                  <img 
                    src={urlQrApi} 
                    alt={`QR para el servicio ${servicio.nombre}`} 
                    className="w-16 h-16 object-contain"
                  />
                  <a
                    href={urlQrApi}
                    download={`QR-${dependencia.nombre}-${servicio.nombre}.png`.replace(/\s+/g, '_')}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 text-[10px] font-medium text-blue-600 hover:underline"
                  >
                    Descargar QR
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => confirmarEliminarServicio(servicio)}
                  aria-label={`Eliminar servicio ${servicio.nombre}`}
                  className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 self-center"
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
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