export const ESCALA_ESTRELLAS = [
  { valor: 1, etiqueta: "Muy malo" },
  { valor: 2, etiqueta: "Malo" },
  { valor: 3, etiqueta: "Regular" },
  { valor: 4, etiqueta: "Bueno" },
  { valor: 5, etiqueta: "Excelente" },
] as const;

/** Cómo se realizó el trámite. Define qué preguntas y qué problemas se muestran en la encuesta. */
export const CANALES = [
  { valor: "PRESENCIAL", etiqueta: "Presencial", detalle: "En oficina o ventanilla" },
  { valor: "EN_LINEA", etiqueta: "En línea", detalle: "Sitio web, plataforma o app" },
  { valor: "TELEFONICO", etiqueta: "Por teléfono", detalle: "Llamada a la dependencia" },
] as const;

export type ClaveCanal = (typeof CANALES)[number]["valor"];

type TextoPorCanal = Record<ClaveCanal, string>;

/**
 * Calificaciones obligatorias (1 a 5 estrellas). `titulo` es el nombre que se usa en resultados;
 * `titulos` y `preguntas` adaptan el texto a la modalidad del trámite (presencial, en línea o teléfono).
 */
export const DIMENSIONES: readonly {
  clave: "trato" | "claridad" | "facilidad" | "rapidez" | "satisfaccion";
  titulo: string;
  pregunta: string;
  titulos?: Partial<TextoPorCanal>;
  preguntas: TextoPorCanal;
}[] = [
  {
    clave: "trato",
    titulo: "Trato del personal",
    pregunta: "¿Cómo fue el trato que recibiste?",
    titulos: { EN_LINEA: "Atención recibida", TELEFONICO: "Trato por teléfono" },
    preguntas: {
      PRESENCIAL: "¿Cómo fue el trato que recibiste del personal en la oficina o ventanilla?",
      EN_LINEA: "¿Cómo calificas la atención que recibiste (respuestas, soporte, avisos) durante el trámite en línea?",
      TELEFONICO: "¿Cómo fue el trato de la persona que te atendió por teléfono?",
    },
  },
  {
    clave: "claridad",
    titulo: "Claridad de la información",
    pregunta: "¿La información y los requisitos fueron claros?",
    preguntas: {
      PRESENCIAL: "¿La información y los requisitos fueron claros y estaban a la vista?",
      EN_LINEA: "¿Las instrucciones y los requisitos en la plataforma fueron claros?",
      TELEFONICO: "¿La información que te dieron por teléfono fue clara y completa?",
    },
  },
  {
    clave: "facilidad",
    titulo: "Facilidad del trámite",
    pregunta: "¿Qué tan fácil fue realizar el trámite?",
    titulos: { EN_LINEA: "Facilidad de la plataforma" },
    preguntas: {
      PRESENCIAL: "¿Qué tan fácil fue realizar el trámite en la oficina?",
      EN_LINEA: "¿Qué tan fácil fue usar el sitio o la plataforma para hacer el trámite?",
      TELEFONICO: "¿Qué tan fácil fue comunicarte y realizar el trámite por teléfono?",
    },
  },
  {
    clave: "rapidez",
    titulo: "Rapidez del trámite",
    pregunta: "¿Qué tan rápido se resolvió tu trámite?",
    preguntas: {
      PRESENCIAL: "¿Qué tan rápido te atendieron? Piensa en el tiempo de espera y en el tiempo total del trámite.",
      EN_LINEA: "¿Qué tan rápido avanzó y se resolvió tu trámite en línea?",
      TELEFONICO: "¿Qué tan rápido te contestaron y resolvieron tu trámite?",
    },
  },
  {
    clave: "satisfaccion",
    titulo: "Satisfacción general",
    pregunta: "En general, ¿qué tan satisfecho quedaste con la atención?",
    preguntas: {
      PRESENCIAL: "En general, ¿qué tan satisfecho quedaste con la atención?",
      EN_LINEA: "En general, ¿qué tan satisfecho quedaste con el trámite en línea?",
      TELEFONICO: "En general, ¿qué tan satisfecho quedaste con la atención por teléfono?",
    },
  },
];

export type ClaveDimension = (typeof DIMENSIONES)[number]["clave"];

export const MAX_COMENTARIO = 500;
export const MAX_PROBLEMA_OTRO = 150;

/**
 * Catálogo completo de problemas (nombres usados en resultados y en el panel).
 * Las presenciales siguen las barreras en trámites que mide la ENCIG (INEGI).
 */
export const PROBLEMAS = [
  { valor: "FILAS_LARGAS", etiqueta: "Filas o esperas largas" },
  { valor: "REQUISITOS_NO_VISIBLES", etiqueta: "Los requisitos no estaban a la vista" },
  { valor: "HORARIO_RESTRINGIDO", etiqueta: "Horario de atención restringido" },
  { valor: "REQUISITOS_EXCESIVOS", etiqueta: "Requisitos excesivos" },
  { valor: "VENTANILLA_EN_VENTANILLA", etiqueta: "Me enviaron de una ventanilla o área a otra" },
  { valor: "COSTOS_EXCESIVOS", etiqueta: "Costos excesivos" },
  { valor: "PLATAFORMA_FALLA", etiqueta: "La plataforma falló o no estaba disponible" },
  { valor: "DIFICIL_ENCONTRAR", etiqueta: "Fue difícil encontrar el trámite o la información en línea" },
  { valor: "SIN_RESPUESTA", etiqueta: "No recibí confirmación, respuesta o seguimiento" },
  { valor: "TUVO_QUE_IR_EN_PERSONA", etiqueta: "Al final tuve que acudir en persona" },
  { valor: "NO_CONTESTARON", etiqueta: "No contestaban o la espera al teléfono fue muy larga" },
  { valor: "OTRO", etiqueta: "Otro" },
] as const;

export type ClaveProblema = (typeof PROBLEMAS)[number]["valor"];

const problema = (valor: ClaveProblema, etiqueta?: string) => ({
  valor,
  etiqueta: etiqueta ?? PROBLEMAS.find((p) => p.valor === valor)!.etiqueta,
});

/** Problemas que se ofrecen en la encuesta según cómo se realizó el trámite («Otro» siempre al final). */
export const PROBLEMAS_POR_CANAL: Record<ClaveCanal, { valor: ClaveProblema; etiqueta: string }[]> = {
  PRESENCIAL: [
    problema("FILAS_LARGAS"),
    problema("REQUISITOS_NO_VISIBLES"),
    problema("HORARIO_RESTRINGIDO"),
    problema("REQUISITOS_EXCESIVOS"),
    problema("VENTANILLA_EN_VENTANILLA", "Me enviaron de una ventanilla a otra"),
    problema("COSTOS_EXCESIVOS"),
    problema("OTRO"),
  ],
  EN_LINEA: [
    problema("PLATAFORMA_FALLA", "La plataforma falló, se trabó o estaba fuera de servicio"),
    problema("DIFICIL_ENCONTRAR"),
    problema("SIN_RESPUESTA", "No recibí confirmación ni respuesta"),
    problema("TUVO_QUE_IR_EN_PERSONA"),
    problema("REQUISITOS_EXCESIVOS"),
    problema("COSTOS_EXCESIVOS"),
    problema("OTRO"),
  ],
  TELEFONICO: [
    problema("NO_CONTESTARON"),
    problema("VENTANILLA_EN_VENTANILLA", "Me transfirieron de un área a otra"),
    problema("SIN_RESPUESTA", "No me dieron seguimiento"),
    problema("HORARIO_RESTRINGIDO"),
    problema("TUVO_QUE_IR_EN_PERSONA"),
    problema("COSTOS_EXCESIVOS"),
    problema("OTRO"),
  ],
};

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
