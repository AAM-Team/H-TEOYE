import { useState } from 'react';

/**
 * HU01 — Tarjeta institucional de una dependencia con la lista de sus servicios
 * y el código QR único descargable generado dinámicamente para cada servicio.
 */
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
    if (!nuevoServicio.trim()) return;
    setError('');
    setGuardando(true);
    try {
      await onAgregarServicio(dependencia.id, nuevoServicio);
      setNuevoServicio('');
    } catch (err) {
      setError(err.message || 'No se pudo agregar el servicio.');
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
      window.alert('Una dependencia debe tener al menos un servicio registrado.');
      return;
    }
    if (window.confirm(`¿Eliminar el servicio "${servicio.nombre}"?`)) {
      onEliminarServicio(dependencia.id, servicio.id);
    }
  };

  return (
    <article className="rounded-2xl border border-[#D8C8B5] bg-white shadow-xs flex flex-col justify-between transition-all hover:border-[#173B43] overflow-hidden">
      <div>
        {/* Cabecera de la Dependencia */}
        <header className="flex items-start justify-between gap-4 border-b border-[#D8C8B5]/60 bg-[#F5F0E8]/40 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#173B43] text-white">
                POS #{dependencia.id}
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#173B43] leading-snug">
                {dependencia.nombre}
              </h3>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#536064] line-clamp-2 leading-relaxed">
              {dependencia.descripcion}
            </p>
          </div>

          <button
            type="button"
            onClick={confirmarEliminarDependencia}
            title="Eliminar dependencia"
            className="btn-press shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#536064] hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            Eliminar
          </button>
        </header>

        {/* Listado de Servicios con Códigos QR Oficiales (HU01) */}
        <ul className="divide-y divide-[#D8C8B5]/50">
          {(dependencia.servicios || []).map((servicio) => {
            // URL de evaluación única para este servicio asociada al QR
            const urlEvaluacion = `${window.location.origin}/evaluar/${dependencia.id}/${servicio.id}`;
            // URL del código QR generado dinámicamente mediante API pública estándar (api.qrserver.com)
            const urlQrApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=${encodeURIComponent(
              urlEvaluacion
            )}`;

            return (
              <li
                key={servicio.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 px-5 py-4 hover:bg-[#F5F0E8]/30 transition-colors"
              >
                {/* Información del Trámite */}
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E87932] shrink-0" />
                    <p className="text-sm font-bold text-[#252B2D] leading-tight">
                      {servicio.nombre}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] font-mono text-[#536064] truncate">
                    URL: {urlEvaluacion}
                  </p>
                </div>

                {/* Bloque QR Dinámico Descargable */}
                <div className="flex items-center gap-3.5 self-end sm:self-center">
                  <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-[#D8C8B5] shadow-2xs group">
                    <img
                      src={urlQrApi}
                      alt={`Código QR para el servicio ${servicio.nombre}`}
                      loading="lazy"
                      className="w-16 h-16 object-contain rounded-md"
                    />
                    <a
                      href={urlQrApi}
                      download={`QR-${dependencia.nombre}-${servicio.nombre}.png`.replace(/\s+/g, '_')}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-press mt-1.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#E87932] hover:text-[#C96220] hover:underline"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Descargar QR</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => confirmarEliminarServicio(servicio)}
                    aria-label={`Eliminar servicio ${servicio.nombre}`}
                    className="btn-press shrink-0 rounded-lg p-1.5 text-[#536064] hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Formulario para agregar un nuevo servicio a la dependencia */}
      <form onSubmit={agregar} className="border-t border-[#D8C8B5]/60 bg-[#F5F0E8]/50 px-5 py-3">
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
            placeholder="Agregar un servicio a esta área…"
            className="w-full rounded-xl border border-[#D8C8B5] bg-white px-3 py-2 text-xs sm:text-sm text-[#252B2D] placeholder-[#536064] focus:border-[#E87932] focus:outline-none focus:ring-1 focus:ring-[#E87932]"
          />
          <button
            type="submit"
            disabled={guardando || !nuevoServicio.trim()}
            className="btn-press shrink-0 rounded-xl bg-[#173B43] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0F272C] disabled:cursor-not-allowed disabled:opacity-40 transition-colors shadow-2xs"
          >
            + Agregar
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
      </form>
    </article>
  );
}
