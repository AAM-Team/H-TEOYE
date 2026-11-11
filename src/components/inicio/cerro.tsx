/**
 * El Cerro de la Campana al atardecer: cielo naranja con nubes oscuras, la cima iluminada, las torres de
 * antenas con sus balizas rojas y las luces de la ciudad a sus pies. Ilustración vectorial propia, decorativa.
 */

// Luces de la ciudad con un generador determinista: el SVG es idéntico en servidor y cliente.
function luces(cantidad: number, semilla: number, x0: number, x1: number, y0: number, y1: number) {
  let s = semilla;
  const azar = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return Array.from({ length: cantidad }, () => ({
    x: +(x0 + azar() * (x1 - x0)).toFixed(1),
    y: +(y0 + azar() * (y1 - y0)).toFixed(1),
    r: +(0.8 + azar() * 1.6).toFixed(2),
    o: +(0.45 + azar() * 0.55).toFixed(2),
    blanca: azar() < 0.22,
  }));
}
// Lienzo ancho (x de -480 a 1920) para que en pantallas grandes el cerro se vea completo sin recortar el cielo.
const X0 = -480;
const ANCHO = 2400;
const LUCES = luces(240, 7, X0, X0 + ANCHO, 452, 540);

/** Horizonte de la ciudad: bloques de edificios deterministas a lo largo de todo el lienzo. */
const CIUDAD = (() => {
  let s = 11;
  const azar = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  let x = X0;
  let d = `M${X0} 540 L${X0} 470`;
  while (x < X0 + ANCHO) {
    const w = 40 + Math.round(azar() * 70);
    const h = 452 + Math.round(azar() * 20);
    d += ` L${x} ${h} L${x + w} ${h}`;
    x += w;
  }
  return `${d} L${X0 + ANCHO} 540 Z`;
})();
const LUCES_LADERA = luces(26, 21, 330, 640, 420, 452);

/** Torre de celosía (antena) con su baliza roja. */
function Torre({ x, base, alto, ancho }: { x: number; base: number; alto: number; ancho: number }) {
  const cima = base - alto;
  const tramos = Math.max(4, Math.round(alto / 14));
  const lineas = [];
  for (let i = 0; i <= tramos; i++) {
    const y = base - (alto * i) / tramos;
    const w = ancho * (1 - (i / tramos) * 0.82);
    lineas.push(<line key={`h${i}`} x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} />);
    if (i < tramos) {
      const y2 = base - (alto * (i + 1)) / tramos;
      const w2 = ancho * (1 - ((i + 1) / tramos) * 0.82);
      lineas.push(<line key={`d${i}`} x1={x - w / 2} y1={y} x2={x + w2 / 2} y2={y2} />);
      lineas.push(<line key={`e${i}`} x1={x + w / 2} y1={y} x2={x - w2 / 2} y2={y2} />);
    }
  }
  const tope = ancho * 0.18;
  return (
    <g>
      <g stroke="#1a1414" strokeWidth="1.1" opacity="0.92">
        <line x1={x - ancho / 2} y1={base} x2={x - tope / 2} y2={cima} />
        <line x1={x + ancho / 2} y1={base} x2={x + tope / 2} y2={cima} />
        {lineas}
        <line x1={x} y1={cima} x2={x} y2={cima - alto * 0.12} strokeWidth="1.4" />
      </g>
      <circle cx={x} cy={cima - alto * 0.12} r="2.6" fill="#ff3b2f" />
      <circle cx={x} cy={cima - alto * 0.12} r="7" fill="#ff3b2f" opacity="0.25" />
      <circle cx={x} cy={cima + alto * 0.35} r="1.8" fill="#ff3b2f" opacity="0.9" />
    </g>
  );
}

export function CerroDeLaCampana({
  className,
  cielo = true,
}: {
  className?: string;
  /** false: sólo el cerro y la ciudad, sobre el fondo que ya tenga la sección. */
  cielo?: boolean;
}) {
  return (
    <svg aria-hidden="true" className={className} viewBox={`${X0} 0 ${ANCHO} 540`} preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cc-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ef7900" stopOpacity="0" />
          <stop offset="0.45" stopColor="#ef7900" stopOpacity="0.35" />
          <stop offset="0.72" stopColor="#ff7a1a" stopOpacity="0.9" />
          <stop offset="0.86" stopColor="#ff5a1f" stopOpacity="1" />
        </linearGradient>
        {/* Luz de los reflectores sobre la cima: se desvanece hacia la base */}
        <radialGradient id="cc-cima" gradientUnits="userSpaceOnUse" cx="816" cy="190" r="250" gradientTransform="translate(816 190) scale(1.15 1) translate(-816 -190)">
          <stop offset="0" stopColor="#eef0b4" />
          <stop offset="0.22" stopColor="#b8c763" />
          <stop offset="0.5" stopColor="#6b8636" stopOpacity="0.85" />
          <stop offset="0.8" stopColor="#3a5124" stopOpacity="0.35" />
          <stop offset="1" stopColor="#1d2a1f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cc-ladera" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2a1f" />
          <stop offset="1" stopColor="#0a1312" />
        </linearGradient>
        <radialGradient id="cc-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff2c4" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff2c4" stopOpacity="0" />
        </radialGradient>
        <clipPath id="cc-forma">
          <path d="M-480 474 L 120 466 L300 456 C 420 440, 520 404, 610 368 C 680 340, 720 300, 752 246 C 768 220, 778 196, 792 186 L 812 178 L 838 182 C 856 190, 868 204, 884 226 C 912 264, 946 300, 1000 328 C 1070 362, 1160 400, 1300 432 L 1440 448 L 1700 462 L 1920 468 L 1920 540 L -480 540 Z" />
        </clipPath>
      </defs>

      {cielo && (
        <>
          <rect x={X0} width={ANCHO} height="540" fill="url(#cc-cielo)" />
          {/* Nubes oscuras del atardecer */}
          <g fill="#3a1f2e" opacity="0.55">
            <path d="M0 150 C 180 132, 380 140, 560 156 C 420 166, 200 170, 0 172 Z" />
            <path d="M980 120 C 1140 104, 1300 108, 1440 118 L 1440 140 C 1290 134, 1120 136, 980 120 Z" />
            <path d="M1010 196 C 1160 182, 1320 186, 1440 196 L 1440 212 C 1300 206, 1150 208, 1010 196 Z" opacity="0.7" />
            <path d="M120 236 C 260 226, 420 230, 540 240 C 400 248, 250 248, 120 236 Z" opacity="0.6" />
            <path d="M-460 196 C -300 184, -120 188, 40 200 C -120 208, -300 208, -460 196 Z" opacity="0.7" />
            <path d="M1480 168 C 1620 156, 1780 160, 1920 170 L 1920 186 C 1780 180, 1620 182, 1480 168 Z" />
          </g>
        </>
      )}

      {/* El cerro: ladera oscura y cima iluminada */}
      <g clipPath="url(#cc-forma)">
        <rect x={X0} y="170" width={ANCHO} height="370" fill="url(#cc-ladera)" />
        <rect x={X0} y="170" width={ANCHO} height="370" fill="url(#cc-cima)" />
        {/* Textura de roca y vegetación en la zona iluminada */}
        <g fill="#f4f0b8" opacity="0.5">
          <path d="M790 196 l14 -6 l10 10 l-12 8 Z" />
          <path d="M826 204 l12 -4 l6 12 l-14 4 Z" />
          <path d="M770 232 l10 -3 l5 9 l-12 2 Z" />
          <path d="M852 232 l14 2 l-2 10 l-12 -3 Z" />
        </g>
        {/* Vetas de roca */}
        <g stroke="#2f4320" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.45">
          <path d="M744 272 q18 -8 30 4" />
          <path d="M796 290 q22 -10 40 2" />
          <path d="M860 266 q16 6 26 20" />
          <path d="M716 312 q24 -6 44 6" />
          <path d="M890 306 q20 4 34 18" />
          <path d="M770 330 q30 -8 56 4" />
        </g>
        {/* Muro del camino que rodea el cerro */}
        <path d="M540 392 C 680 360, 860 352, 1060 372" stroke="#2b3a2b" strokeWidth="3" fill="none" opacity="0.8" />
      </g>
      <ellipse cx="814" cy="186" rx="60" ry="22" fill="url(#cc-halo)" />

      {/* Torres de antenas en la cima y en la ladera */}
      <Torre x={798} base={186} alto={150} ancho={22} />
      <Torre x={842} base={186} alto={104} ancho={16} />
      <Torre x={470} base={448} alto={130} ancho={14} />
      <Torre x={1660} base={462} alto={76} ancho={10} />

      {/* Ciudad */}
      <path d={CIUDAD} fill="#071514" />
      <g>
        {[...LUCES_LADERA, ...LUCES].map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={l.blanca ? "#f5f7ff" : "#ffb347"} opacity={l.o} />
        ))}
      </g>
    </svg>
  );
}

/** @deprecated usa CerroDeLaCampana */
export const AtardecerHermosillo = CerroDeLaCampana;
