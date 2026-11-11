export const ESCALA_ESTRELLAS = [
  { valor: 1, etiqueta: "Muy malo" },
  { valor: 2, etiqueta: "Malo" },
  { valor: 3, etiqueta: "Regular" },
  { valor: 4, etiqueta: "Bueno" },
  { valor: 5, etiqueta: "Excelente" },
] as const;

export const DIMENSIONES = [
  { clave: "trato", titulo: "Trato del personal", pregunta: "¿Cómo fue el trato que recibiste del personal?" },
  { clave: "claridad", titulo: "Claridad de la información", pregunta: "¿La información y los requisitos fueron claros?" },
  { clave: "facilidad", titulo: "Facilidad del trámite", pregunta: "¿Qué tan fácil fue realizar el trámite?" },
  { clave: "satisfaccion", titulo: "Satisfacción general", pregunta: "En general, ¿qué tan satisfecho quedaste con la atención?" },
] as const;

export type ClaveDimension = (typeof DIMENSIONES)[number]["clave"];

export const CANALES = [
  { valor: "PRESENCIAL", etiqueta: "Presencial" },
  { valor: "EN_LINEA", etiqueta: "En línea" },
  { valor: "TELEFONICO", etiqueta: "Por teléfono" },
] as const;

export const MAX_COMENTARIO = 500;

/** Categorías tomadas de las barreras en trámites que mide la ENCIG (INEGI). */
export const PROBLEMAS = [
  { valor: "FILAS_LARGAS", etiqueta: "Filas o esperas largas" },
  { valor: "REQUISITOS_NO_VISIBLES", etiqueta: "Los requisitos no estaban a la vista" },
  { valor: "HORARIO_RESTRINGIDO", etiqueta: "Horario de atención restringido" },
  { valor: "REQUISITOS_EXCESIVOS", etiqueta: "Requisitos excesivos" },
  { valor: "VENTANILLA_EN_VENTANILLA", etiqueta: "Me enviaron de una ventanilla a otra" },
  { valor: "COSTOS_EXCESIVOS", etiqueta: "Costos excesivos" },
] as const;

export const PROBLEMA_NINGUNO = { valor: "NINGUNO", etiqueta: "No tuve ningún problema" } as const;

export const OPCIONES_PAGO_INDEBIDO = [
  { valor: "no", etiqueta: "No" },
  { valor: "si", etiqueta: "Sí" },
  { valor: "prefiero-no-responder", etiqueta: "Prefiero no responder" },
] as const;

/** Modalidad oficial del trámite (Portal de Trámites y Servicios del Ayuntamiento). */
export const MODALIDADES = {
  VENTANILLA: { etiqueta: "En ventanilla", descripcion: "Se realiza de forma presencial en ventanilla." },
  EN_LINEA: { etiqueta: "En línea", descripcion: "Se puede realizar en línea." },
  CON_FORMATO: { etiqueta: "Con formato", descripcion: "Requiere llenar un formato." },
} as const;
