import { useEffect, useRef, useState } from 'react';

// Formulario en ventana modal para dar de alta una dependencia
// junto con uno o más servicios (criterio de aceptación de la HU01).
export default function DependenciaForm({ onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [servicios, setServicios] = useState(['']);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const primerCampo = useRef(null);

  useEffect(() => {
    primerCampo.current?.focus();
  }, []);

  useEffect(() => {
    const cerrarConEscape = (e) => {
      if (e.key === 'Escape') onCancelar();
    };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [onCancelar]);

  const conLimpieza = (setter) => (valor) => {
    if (error) setError('');
    setter(valor);
  };
  const cambiarNombre = conLimpieza(setNombre);
  const cambiarDescripcion = conLimpieza(setDescripcion);

  const cambiarServicio = (indice, valor) => {
    if (error) setError('');
    setServicios((actuales) => actuales.map((s, i) => (i === indice ? valor : s)));
  };

  const agregarCampoServicio = () => setServicios((actuales) => [...actuales, '']);

  const quitarCampoServicio = (indice) => {
    setServicios((actuales) => actuales.filter((_, i) => i !== indice));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await onGuardar({ nombre, descripcion, servicios });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  const inputClase =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-form-dependencia"
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <form onSubmit={enviar}>
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 id="titulo-form-dependencia" className="text-lg font-semibold text-gray-900">
              Nueva dependencia
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Registra la dependencia y los servicios que ofrece a la ciudadanía.
            </p>
          </div>

          <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
            <div>
              <label htmlFor="dep-nombre" className="mb-1 block text-sm font-medium text-gray-700">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="dep-nombre"
                ref={primerCampo}
                type="text"
                maxLength={120}
                value={nombre}
                onChange={(e) => cambiarNombre(e.target.value)}
                placeholder="Ej. Tesorería Municipal"
                className={inputClase}
              />
            </div>

            <div>
              <label htmlFor="dep-descripcion" className="mb-1 block text-sm font-medium text-gray-700">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                id="dep-descripcion"
                rows={3}
                maxLength={300}
                value={descripcion}
                onChange={(e) => cambiarDescripcion(e.target.value)}
                placeholder="¿Qué atiende esta dependencia?"
                className={`${inputClase} resize-none`}
              />
              <p className="mt-1 text-right text-xs text-gray-400">{descripcion.length}/300</p>
            </div>

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-gray-700">
                Servicios <span className="text-red-500">*</span>
              </legend>
              <p className="mb-2 text-xs text-gray-500">
                Agrega al menos un servicio que ofrezca esta dependencia.
              </p>
              <div className="space-y-2">
                {servicios.map((servicio, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      aria-label={`Servicio ${i + 1}`}
                      maxLength={120}
                      value={servicio}
                      onChange={(e) => cambiarServicio(i, e.target.value)}
                      placeholder={i === 0 ? 'Ej. Pago de impuesto predial' : 'Otro servicio'}
                      className={inputClase}
                    />
                    {servicios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => quitarCampoServicio(i)}
                        aria-label={`Quitar servicio ${i + 1}`}
                        className="shrink-0 rounded-lg border border-gray-300 px-3 text-gray-500 hover:bg-gray-50 hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={agregarCampoServicio}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                + Agregar otro servicio
              </button>
            </fieldset>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : 'Guardar dependencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}