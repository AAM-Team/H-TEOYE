/**
 * Escala de calificaciones 1–5: degradado continuo rojo → ámbar → verde.
 *
 * Validada con el script de dataviz (adyacentes): separación con daltonismo ΔE 18.0, visión normal ΔE 18.3.
 * La luminosidad no es monótona (el ámbar es el más claro), así que el número siempre se muestra junto al
 * color: el color nunca es la única señal.
 */
export const PARADAS = ["#b8283a", "#ec7440", "#fad35a", "#3b9f5a", "#0f6538"] as const;

const TINTA = "var(--brand-navy-deep)";

export type Celda = { fondo: string; texto: string };

/** Color continuo para cualquier promedio entre 1 y 5 (mezcla en OKLab entre las dos paradas vecinas). */
export function colorCalificacion(valor: number | null): Celda {
  if (valor == null) return { fondo: "transparent", texto: "var(--muted-foreground)" };
  const v = Math.max(1, Math.min(5, valor));
  const i = Math.min(3, Math.floor(v - 1));
  const t = Math.round((v - 1 - i) * 100);
  const fondo = t === 0 ? PARADAS[i] : `color-mix(in oklab, ${PARADAS[i + 1]} ${t}%, ${PARADAS[i]})`;
  return { fondo, texto: v < 1.75 || v > 4.3 ? "#ffffff" : TINTA };
}

/** Color fijo de cada estrella en la distribución. */
export const COLOR_ESTRELLA = PARADAS;

/** Degradado CSS para leyendas y barras de escala. */
export const DEGRADADO = `linear-gradient(90deg, ${PARADAS.join(", ")})`;

export type Veredicto = { etiqueta: string; descripcion: string };

/** Traducción a palabras de un promedio, para que cualquier persona lo entienda sin leer números. */
export function veredicto(valor: number | null): Veredicto {
  if (valor == null) return { etiqueta: "Sin datos", descripcion: "Aún no hay suficientes evaluaciones." };
  if (valor >= 4.2) return { etiqueta: "Muy bien", descripcion: "La gran mayoría quedó satisfecha." };
  if (valor >= 3.7) return { etiqueta: "Bien", descripcion: "La mayoría quedó satisfecha." };
  if (valor >= 3.0) return { etiqueta: "Regular", descripcion: "Opiniones divididas: hay que mejorar." };
  if (valor >= 2.3) return { etiqueta: "Mal", descripcion: "Más personas insatisfechas que satisfechas." };
  return { etiqueta: "Muy mal", descripcion: "La mayoría tuvo una mala experiencia." };
}
