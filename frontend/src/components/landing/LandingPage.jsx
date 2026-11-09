import CatalogoView from '../catalogo/CatalogoView';

export default function LandingPage() {
  const irACatalogo = () => {
    const el = document.getElementById('seccion-catalogo-hu01');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#252B2D] flex flex-col font-sans">
      {/* Navegación Superior Institucional */}
      <header className="sticky top-0 z-40 bg-[#F5F0E8]/95 backdrop-blur-md border-b border-[#D8C8B5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8C8B5] p-2 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src="/logo_HAyuntamiento.svg"
                alt="Escudo Oficial de Hermosillo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#173B43] tracking-tight leading-none font-sans">
                  H-TEOYE
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E87932]/15 text-[#E87932] border border-[#E87932]/30">
                  HERMOSILLO
                </span>
              </div>
              <p className="text-[11px] text-[#536064] font-medium mt-0.5 hidden sm:block">
                Evaluación de la Calidad en la Atención Ciudadana · Reto #2
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-xs sm:text-sm font-bold text-[#173B43]">
            <a
              href="#inicio"
              className="px-3.5 py-2 rounded-xl hover:bg-[#D8C8B5]/40 transition-colors"
            >
              Inicio
            </a>
            <a
              href="#diagnostico"
              className="px-3.5 py-2 rounded-xl hover:bg-[#D8C8B5]/40 transition-colors"
            >
              Problema y Solución
            </a>
            <a
              href="#seccion-catalogo-hu01"
              className="px-3.5 py-2 rounded-xl bg-[#173B43] text-white hover:bg-[#0F272C] transition-colors"
            >
              Catálogo y QR
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
          </div>
        </div>
      </header>

      {/* SECCIÓN 1: HERO DEL PROYECTO */}
      <section id="inicio" className="bg-[#173B43] text-white pt-14 pb-16 lg:pb-20 border-b border-[#0F272C] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-white/10 text-[#D8C8B5] border border-white/15">
              <span className="w-2 h-2 rounded-full bg-[#E87932] shrink-0" />
              Hackathon: Innovación por la transparencia · Reto #2
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              H-TEOYE: Evaluación de la Calidad en la Atención Ciudadana
            </h1>

            <p className="text-sm sm:text-base text-[#D8C8B5] leading-relaxed">
              Plataforma institucional del Ayuntamiento de Hermosillo para capturar la experiencia ciudadana al terminar cualquier trámite en ventanilla mediante <strong>códigos QR únicos por servicio</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={irACatalogo}
                className="btn-press rounded-xl bg-[#E87932] px-5 py-3 text-xs sm:text-sm font-black text-white shadow-md hover:bg-[#C96220] transition-colors inline-flex items-center gap-2"
              >
                <span>Ir al Catálogo de Dependencias y QR</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              <a
                href="#diagnostico"
                className="btn-press rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 text-xs sm:text-sm font-bold text-white transition-colors"
              >
                Ver Justificación del Reto
              </a>
            </div>
          </div>

          {/* Tarjeta de Alcance H-TEOYE */}
          <div className="bg-[#122e35] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded bg-[#E87932] text-white">
                Pilares de H-TEOYE
              </span>
              <span className="text-xs text-[#D8C8B5]">
                Puntos de atención ciudadana y códigos QR presenciales
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E87932] block">
                  1. Alta de Dependencias
                </span>
                <p className="text-sm font-bold text-white">Registro de Áreas Municipales</p>
                <p className="text-xs text-[#D8C8B5]/80">
                  Estructuración jerárquica de dependencias responsables de atención ciudadana.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E87932] block">
                  2. Servicios por Dependencia
                </span>
                <p className="text-sm font-bold text-white">Asociación de Trámites</p>
                <p className="text-xs text-[#D8C8B5]/80">
                  Cada servicio genera una URL única de evaluación para el punto presencial.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E87932] block">
                  3. QR Dinámico Descargable
                </span>
                <p className="text-sm font-bold text-white">Conexión con api.qrserver.com</p>
                <p className="text-xs text-[#D8C8B5]/80">
                  Generación de imagen PNG lista para imprimir y colocar en ventanilla sin dependencias pesadas en Docker.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: DIAGNÓSTICO INSTITUCIONAL (RETO #2) */}
      <section id="diagnostico" className="py-16 sm:py-20 bg-white border-b border-[#D8C8B5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#E87932] block">
              Planteamiento del Problema
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#173B43] tracking-tight leading-tight">
              El Ayuntamiento no contaba con un mecanismo sistemático para capturar la experiencia ciudadana.
            </h2>
            <p className="text-sm sm:text-base text-[#536064] leading-relaxed">
              Las personas que reciben un servicio no tienen una forma ágil de calificarlo al terminar. Las pocas opiniones quedan dispersas en redes sociales o quejas verbales, impidiendo que las dependencias identifiquen patrones de mejora.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 01 */}
            <div className="rounded-3xl bg-[#F5F0E8] border border-[#D8C8B5] p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xs">
              <div className="space-y-4">
                <span className="w-10 h-10 rounded-xl bg-[#173B43] text-white flex items-center justify-center font-black text-sm">
                  01
                </span>
                <h3 className="text-lg font-black text-[#173B43]">
                  Opiniones dispersas y sin registro
                </h3>
                <p className="text-xs sm:text-sm text-[#536064] leading-relaxed">
                  Las quejas y comentarios quedaban aislados en redes sociales o quejas verbales sin seguimiento institucional.
                </p>
              </div>

              <div className="pt-4 border-t border-[#D8C8B5] text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E87932] block">
                  Qué aporta H-TEOYE:
                </span>
                <p className="text-[#173B43] font-bold mt-1 leading-snug">
                  Un código QR único por trámite captura la experiencia ciudadana directamente en la ventanilla, en menos de un minuto.
                </p>
              </div>
            </div>

            {/* Tarjeta 02 */}
            <div className="rounded-3xl bg-[#F5F0E8] border border-[#D8C8B5] p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xs">
              <div className="space-y-4">
                <span className="w-10 h-10 rounded-xl bg-[#173B43] text-white flex items-center justify-center font-black text-sm">
                  02
                </span>
                <h3 className="text-lg font-black text-[#173B43]">
                  Falta de análisis e indicadores
                </h3>
                <p className="text-xs sm:text-sm text-[#536064] leading-relaxed">
                  Sin un mecanismo sistemático, ningún área analizaba los motivos de queja para identificar patrones en tiempos, requisitos o trato.
                </p>
              </div>

              <div className="pt-4 border-t border-[#D8C8B5] text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E87932] block">
                  Qué aporta H-TEOYE:
                </span>
                <p className="text-[#173B43] font-bold mt-1 leading-snug">
                  Estructuración centralizada de dependencias y servicios que permite organizar la voz ciudadana y medir la evolución del servicio.
                </p>
              </div>
            </div>

            {/* Tarjeta 03 */}
            <div className="rounded-3xl bg-[#F5F0E8] border border-[#D8C8B5] p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xs">
              <div className="space-y-4">
                <span className="w-10 h-10 rounded-xl bg-[#173B43] text-white flex items-center justify-center font-black text-sm">
                  03
                </span>
                <h3 className="text-lg font-black text-[#173B43]">
                  Sin seguimiento público ni cambios
                </h3>
                <p className="text-xs sm:text-sm text-[#536064] leading-relaxed">
                  La ciudadanía no tenía forma de verificar si su opinión generaba soluciones reales, reduciendo la participación y la confianza.
                </p>
              </div>

              <div className="pt-4 border-t border-[#D8C8B5] text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E87932] block">
                  Qué aporta H-TEOYE:
                </span>
                <p className="text-[#173B43] font-bold mt-1 leading-snug">
                  Acceso directo y transparente desde el punto de atención para cerrar el ciclo entre la experiencia del usuario y la mejora institucional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: DEMOSTRACIÓN DE LA FUNCIONALIDAD (SPRINT ACTUAL - HU01) */}
      <section id="seccion-catalogo-hu01" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 w-full">
        {/* Cabecera Técnica de la Entrega */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D8C8B5] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#E87932]/15 text-[#E87932] border border-[#E87932]/30">
              <span className="w-2 h-2 rounded-full bg-[#E87932]" />
              Puntos de Atención Ciudadana
            </span>
            <span className="text-xs font-mono text-[#536064]">
              Hermosillo Te Oye · Plataforma Abierta
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#173B43] tracking-tight">
              Catálogo de Dependencias y Generación Dinámica de Códigos QR
            </h2>
            <p className="text-xs sm:text-sm text-[#536064] leading-relaxed max-w-3xl">
              Generación y descarga de códigos QR dinámicos para los servicios de cada dependencia municipal, permitiendo a los ciudadanos escanear y acceder directamente al enlace de evaluación de su trámite en ventanilla.
            </p>
          </div>
        </div>

        {/* Componente Operativo de HU01 */}
        <CatalogoView />
      </section>

      {/* Pie de Página Institucional */}
      <footer className="mt-auto bg-[#0F272C] text-white py-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#D8C8B5]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
              <img src="/logo_HAyuntamiento.svg" alt="Ayuntamiento" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-white">H-TEOYE · Ayuntamiento de Hermosillo</p>
              <p className="text-[11px] text-[#D8C8B5]/80">
                Hackathon: Innovación por la transparencia y la anticorrupción · Reto #2
              </p>
            </div>
          </div>
          <p className="text-[11px] text-center sm:text-right">
            Equipo ADOO: Jesús David Ayala, Ana Sofía Matti, Melina González, Daniel Álvarez
          </p>
        </div>
      </footer>
    </div>
  );
}
