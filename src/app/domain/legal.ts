/**
 * Legal figures used by the app. Each one was checked against the official text
 * (see SOURCES) on 2026-10-14. Educational information, not legal advice.
 */
export interface LegalSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
}

export const SOURCES = {
  ley1266: {
    id: 'ley1266',
    title: 'Ley Estatutaria 1266 de 2008 (texto vigente con modificaciones)',
    publisher: 'Secretaría del Senado',
    url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1266_2008.html',
  },
  ley2157: {
    id: 'ley2157',
    title: 'Ley 2157 de 2021 («borrón y cuenta nueva»)',
    publisher: 'Secretaría del Senado',
    url: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2157_2021.html',
  },
  ley1266fp: {
    id: 'ley1266fp',
    title: 'Ley 1266 de 2008 en el Gestor Normativo',
    publisher: 'Función Pública',
    url: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=34488',
  },
  sic: {
    id: 'sic',
    title: 'Sobre el hábeas data financiero (preguntas frecuentes)',
    publisher: 'Superintendencia de Industria y Comercio',
    url: 'https://www.sic.gov.co/sobre-el-habeas-data-financiero',
  },
  smmlv: {
    id: 'smmlv',
    title: 'Decreto 0159 de 2026 (salario mínimo 2026; ratifica el valor del Decreto 1469 de 2025)',
    publisher: 'Presidencia de la República',
    url: 'https://dapre.presidencia.gov.co/normativa/normativa/DECRETO%20No.%200159%20DEL%2019%20DE%20FEBRERO%20DE%202026.pdf',
  },
} satisfies Record<string, LegalSource>;

export type SourceId = keyof typeof SOURCES;

/** Art. 13 Ley 1266 (mod. art. 3 Ley 2157): negative data stays twice the time in arrears… */
export const PERMANENCE_MULTIPLIER = 2;
/** …with a maximum of 4 years from payment / extinction. */
export const PERMANENCE_MAX_YEARS = 4;
/** Art. 13 par. 1: negative data expires 8 years after the obligation went into arrears. */
export const EXPIRY_YEARS_FROM_DEFAULT = 8;
/** Art. 8 num. 11 (added by art. 4 Ley 2157): report at most 18 months after arrears start. */
export const MAX_MONTHS_TO_REPORT = 18;
/** Art. 12: report only 20 calendar days after the prior notice was sent. */
export const NOTICE_DAYS = 20;
/** Art. 13 par. 2: debts ≤ 15 % of one SMMLV need two notices on different days. */
export const SMALL_DEBT_SMMLV_SHARE = 0.15;
/** Salario mínimo 2026 (Decreto 1469 de 2025 / Decreto 0159 de 2026). */
export const SMMLV_2026 = 1_750_905;
export const SMALL_DEBT_THRESHOLD_2026 = Math.floor(SMMLV_2026 * SMALL_DEBT_SMMLV_SHARE);
/** Art. 16 II num. 3 and 8: claims answered within 15 business days, extendable 8 more. */
export const CLAIM_BUSINESS_DAYS = 15;
export const CLAIM_EXTENSION_BUSINESS_DAYS = 8;
/** Art. 16 I: queries (consultas) answered within 10 business days, extendable 5 more. */
export const QUERY_BUSINESS_DAYS = 10;
export const QUERY_EXTENSION_BUSINESS_DAYS = 5;
/** Art. 16 II num. 2: "reclamo en trámite" legend within 2 business days. */
export const CLAIM_LEGEND_BUSINESS_DAYS = 2;

export interface LegalFact {
  title: string;
  text: string;
  cite: string;
  source: SourceId;
}

export const FACTS: LegalFact[] = [
  {
    title: 'Consultar tu historial es gratis siempre',
    text: 'La consulta por parte del titular es gratuita en toda ocasión y por todos los medios, y revisarla no puede bajar tu calificación ni usarse para decisiones laborales.',
    cite: 'Ley 1266 de 2008, art. 10 par. 2 (modificado por el art. 5 de la Ley 2157 de 2021)',
    source: 'ley2157',
  },
  {
    title: 'Cuánto dura un reporte negativo',
    text: 'El doble del tiempo de la mora, con un máximo de 4 años contados desde que pagas las cuotas vencidas o se extingue la obligación. La información positiva permanece indefinidamente.',
    cite: 'Ley 1266 de 2008, art. 13 (modificado por el art. 3 de la Ley 2157 de 2021)',
    source: 'ley1266',
  },
  {
    title: 'Caducidad a los 8 años',
    text: 'El dato negativo caduca a los 8 años contados desde que la obligación entró en mora, y debe eliminarse.',
    cite: 'Ley 1266 de 2008, art. 13 par. 1',
    source: 'ley1266',
  },
  {
    title: 'Aviso previo de 20 días',
    text: 'Antes de reportarte, la entidad debe avisarte. Solo puede reportar pasados 20 días calendario desde el envío de esa comunicación.',
    cite: 'Ley 1266 de 2008, art. 12',
    source: 'ley1266',
  },
  {
    title: 'Deudas pequeñas: dos avisos',
    text: `Si la deuda es igual o menor al 15 % de un salario mínimo (${'$'} ${SMALL_DEBT_THRESHOLD_2026.toLocaleString('es-CO')} en 2026), deben enviarte al menos dos comunicaciones en días distintos y esperar 20 días calendario después de la última.`,
    cite: 'Ley 1266 de 2008, art. 13 par. 2; Decreto 0159 de 2026',
    source: 'ley1266',
  },
  {
    title: 'Sin aviso, se retira el reporte',
    text: 'Si te reportaron sin la comunicación previa y ya pagaste, el reporte negativo se retira de inmediato. Si no has pagado, deben retirarlo y avisarte antes de reportarte de nuevo.',
    cite: 'Ley 1266 de 2008, art. 12 par. (adicionado por el art. 6 de la Ley 2157 de 2021)',
    source: 'ley2157',
  },
  {
    title: 'Máximo 18 meses para reportar',
    text: 'La entidad debe reportar la información negativa máximo 18 meses después de que entraste en mora.',
    cite: 'Ley 1266 de 2008, art. 8 num. 11 (adicionado por el art. 4 de la Ley 2157 de 2021)',
    source: 'ley2157',
  },
  {
    title: 'Respuesta a reclamos en 15 días hábiles',
    text: 'Los reclamos se resuelven en máximo 15 días hábiles desde el día siguiente al recibo, prorrogables 8 días hábiles más si te informan el motivo. En 2 días hábiles debe aparecer la leyenda «reclamo en trámite». Si no responden a tiempo, se entiende resuelto a tu favor.',
    cite: 'Ley 1266 de 2008, art. 16 II num. 2, 3 y 8',
    source: 'ley1266',
  },
  {
    title: 'Consultas en 10 días hábiles',
    text: 'Las consultas sobre tu información se atienden en máximo 10 días hábiles, prorrogables 5 días hábiles más.',
    cite: 'Ley 1266 de 2008, art. 16 I',
    source: 'ley1266',
  },
  {
    title: 'A quién reclamar',
    text: 'Puedes reclamar ante la fuente (la entidad que te reportó) o ante el operador (la central de riesgo). Si no responden o no estás de acuerdo, acude a la SIC; si la entidad es vigilada por la Superintendencia Financiera, ante esa entidad. Debes probar el reclamo previo.',
    cite: 'SIC, hábeas data financiero; Ley 1266 de 2008, arts. 16 y 17',
    source: 'sic',
  },
];
