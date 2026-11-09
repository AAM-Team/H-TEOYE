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

/**
 * HU01 — Catálogo de Dependencias y Servicios con Generación de Códigos QR.
 * Permite registrar áreas municipales, listar sus trámites asociados y
 * generar automáticamente el código QR dinámico descargable para cada servicio.
 */
export default function CatalogoView() {
  const [dependencias, setDependencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [aviso, setAviso] = useState('');

  const recargar = async () => {
    try {
      const datos = await obtenerDependencias();
      setDependencias(datos);
      setErrorCarga('');
    } catch {
      setErrorCarga('No se pudo cargar el catálogo. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

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

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const totalServicios = useMemo(
    () => dependencias.reduce((suma, d) => suma + (d.servicios || []).length, 0),
    [dependencias]
  );

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return dependencias;
    return dependencias.filter(
      (d) =>
        d.nombre.toLowerCase().includes(q) ||
        d.descripcion.toLowerCase().includes(q) ||
        (d.servicios || []).some((s) => s.nombre.toLowerCase().includes(q))
    );
  }, [dependencias, busqueda]);

  const guardarDependencia = async (datos) => {
    const nueva = await crearDependencia(datos);
    await recargar();
    setMostrarForm(false);
    setAviso(`Dependencia "${nueva.nombre}" registrada con códigos QR activos para sus servicios.`);
  };

  const manejarAgregarServicio = async (dependenciaId, nombre) => {
    const servicio = await agregarServicio(dependenciaId, nombre);
    await recargar();
    setAviso(`Servicio "${servicio.nombre}" agregado con código QR activo.`);
  };

  const manejarEliminarServicio = async (dependenciaId, servicioId) => {
    await eliminarServicio(dependenciaId, servicioId);
    await recargar();
    setAviso('Servicio eliminado del catálogo.');
  };

  const manejarEliminarDependencia = async (dependenciaId) => {
    await eliminarDependencia(dependenciaId);
    await recargar();
    setAviso('Dependencia eliminada del catálogo.');
  };

  return (
    <section className="space-y-6">
      {/* Barra Superior de Control y Métricas de Catálogo (HU01) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 rounded-2xl border border-[#D8C8B5] shadow-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-[#F5F0E8] border border-[#D8C8B5] px-4 py-2 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#536064]">Dependencias</p>
            <p className="text-2xl font-black text-[#173B43] tabular-nums mt-0.5">{dependencias.length}</p>
          </div>
          <div className="rounded-xl bg-[#F5F0E8] border border-[#D8C8B5] px-4 py-2 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#536064]">Servicios con QR</p>
            <p className="text-2xl font-black text-[#E87932] tabular-nums mt-0.5">{totalServicios}</p>
          </div>
          <div className="hidden sm:block pl-2 border-l border-[#D8C8B5] max-w-sm">
            <p className="text-xs text-[#536064] leading-relaxed">
              Cada trámite genera automáticamente un <strong>código QR único</strong> descargable para imprimir y colocar en el módulo de atención presencial.
            </p>
          </div>
        </div>

        {/* Buscador y Botón de Nueva Dependencia */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar dependencia o servicio…"
              aria-label="Buscar dependencia o servicio"
              className="w-full rounded-xl border border-[#D8C8B5] bg-[#F5F0E8]/50 pl-9 pr-3 py-2 text-xs sm:text-sm text-[#252B2D] placeholder-[#536064] focus:border-[#E87932] focus:bg-white focus:outline-none"
            />
            <svg
              className="w-4 h-4 text-[#536064] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="btn-press shrink-0 rounded-xl bg-[#E87932] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#C96220] transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Dependencia</span>
          </button>
        </div>
      </div>

      {/* Aviso de Operación Exitosa */}
      {aviso && (
        <div
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-900 flex items-center justify-between shadow-2xs"
        >
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>{aviso}</span>
          </span>
          <button
            type="button"
            onClick={() => setAviso('')}
            className="text-xs text-emerald-800 font-bold hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Lista de Tarjetas de Dependencias con Códigos QR */}
      {cargando ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-[#E87932] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-[#173B43] font-bold">Cargando catálogo institucional…</p>
        </div>
      ) : errorCarga ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-bold text-rose-800">{errorCarga}</p>
          <button
            type="button"
            onClick={recargar}
            className="btn-press mt-3 inline-flex items-center px-4 py-2 rounded-xl bg-white border border-rose-300 text-xs font-bold text-rose-800"
          >
            Reintentar carga
          </button>
        </div>
      ) : dependencias.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#D8C8B5] bg-white p-10 text-center">
          <p className="font-bold text-[#173B43] text-base">Aún no hay dependencias registradas en el catálogo</p>
          <p className="mt-1 text-xs text-[#536064]">Da de alta la primera área municipal para generar sus códigos QR.</p>
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="btn-press mt-4 rounded-xl bg-[#E87932] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#C96220]"
          >
            + Registrar Primera Dependencia
          </button>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#D8C8B5] p-10 text-center">
          <p className="text-sm font-bold text-[#173B43]">
            Ninguna dependencia o servicio coincide con &ldquo;{busqueda}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setBusqueda('')}
            className="btn-press mt-2 text-xs font-bold text-[#E87932] hover:underline"
          >
            Limpiar búsqueda
          </button>
        </div>
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

      {/* Modal / Formulario de Nueva Dependencia */}
      {mostrarForm && (
        <DependenciaForm onGuardar={guardarDependencia} onCancelar={() => setMostrarForm(false)} />
      )}
    </section>
  );
}
