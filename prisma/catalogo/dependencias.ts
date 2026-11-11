/**
 * Catálogo de las cinco dependencias participantes en el prototipo.
 * Las descripciones son genéricas y pueden sustituirse por textos oficiales.
 */
export const DEPENDENCIAS = [
  {
    slug: "tesoreria-municipal",
    nombre: "Tesorería Municipal",
    nombreCorto: "Tesorería",
    descripcion: "Trámites de pagos, contribuciones y servicios de recaudación municipal.",
  },
  {
    slug: "agua-de-hermosillo",
    nombre: "Agua de Hermosillo",
    nombreCorto: "Agua de Hermosillo",
    descripcion: "Trámites relacionados con el servicio de agua potable y drenaje.",
  },
  {
    slug: "ordenamiento-y-desarrollo-urbano",
    nombre: "Dirección General de Ordenamiento y Desarrollo Urbano",
    nombreCorto: "Desarrollo Urbano",
    descripcion: "Trámites de uso de suelo, construcción y ordenamiento territorial.",
  },
  {
    slug: "seguridad-publica-transito",
    nombre: "Seguridad Pública — Tránsito",
    nombreCorto: "Tránsito",
    descripcion: "Trámites y servicios de tránsito municipal.",
  },
  {
    slug: "dif-hermosillo",
    nombre: "DIF Hermosillo",
    nombreCorto: "DIF",
    descripcion: "Trámites y servicios de asistencia social y apoyo a las familias.",
  },
] as const;

export type SlugDependencia = (typeof DEPENDENCIAS)[number]["slug"];
