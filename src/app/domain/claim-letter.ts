import { addBusinessDays } from './business-days';
import { formatCOP, formatDate, toISO } from './format';
import {
  CLAIM_BUSINESS_DAYS,
  CLAIM_EXTENSION_BUSINESS_DAYS,
  CLAIM_LEGEND_BUSINESS_DAYS,
} from './legal';

export type ClaimType =
  'rectificacion' | 'actualizacion' | 'permanencia' | 'sin-aviso' | 'suplantacion';

export const CLAIM_TYPES: { id: ClaimType; label: string; hint: string }[] = [
  {
    id: 'actualizacion',
    label: 'Ya pagué y sigue en mora',
    hint: 'Pide actualizar el estado de la obligación.',
  },
  {
    id: 'permanencia',
    label: 'El reporte ya debió salir',
    hint: 'Pide eliminar el dato por vencimiento del término de permanencia o caducidad.',
  },
  {
    id: 'sin-aviso',
    label: 'Me reportaron sin avisarme',
    hint: 'Pide retirar el reporte por falta de comunicación previa.',
  },
  {
    id: 'rectificacion',
    label: 'Hay un dato incorrecto',
    hint: 'Pide corregir montos, fechas o estados equivocados.',
  },
  {
    id: 'suplantacion',
    label: 'No reconozco esta obligación',
    hint: 'Suplantación de identidad: pide marcar «Víctima de Falsedad Personal».',
  },
];

export interface ClaimInput {
  type: ClaimType;
  fullName: string;
  documentNumber: string;
  city: string;
  address: string;
  email: string;
  recipient: string;
  obligation: string;
  amount?: number;
  facts: string;
  date: string;
}

export interface ClaimLetter {
  subject: string;
  opening: string;
  facts: string[];
  requests: string[];
  grounds: string[];
  closing: string[];
}

const REQUESTS: Record<ClaimType, string[]> = {
  actualizacion: [
    'Actualizar la información de la obligación indicada para que refleje que está al día o extinguida, y retirar el dato de mora.',
    'Aplicar el término de permanencia del artículo 13 de la Ley 1266 de 2008 contado desde la fecha de pago, y actualizar simultáneamente cualquier calificación o puntaje afectado (parágrafo 3).',
  ],
  permanencia: [
    'Eliminar el dato negativo asociado a la obligación indicada, por haberse cumplido el término máximo de permanencia (doble del tiempo de mora, máximo cuatro años desde el pago) o la caducidad de ocho años desde el inicio de la mora.',
    'Actualizar simultáneamente cualquier calificación o puntaje afectado por ese dato.',
  ],
  'sin-aviso': [
    'Enviarme copia de la comunicación previa al reporte negativo, con la constancia de envío a mi última dirección registrada y su fecha.',
    'Si no existe dicha comunicación, retirar el reporte negativo conforme al parágrafo del artículo 12 de la Ley 1266 de 2008.',
  ],
  rectificacion: [
    'Rectificar la información de la obligación indicada de acuerdo con los hechos descritos y los soportes anexos.',
    'Incluir la leyenda «reclamo en trámite» mientras se resuelve esta solicitud.',
  ],
  suplantacion: [
    'Cotejar los documentos usados para adquirir la obligación con los que anexo, que constituyen prueba sumaria de la falsedad.',
    'Modificar el dato negativo y cualquier puntaje asociado, e incluir en mi registro la leyenda «Víctima de Falsedad Personal».',
  ],
};

const GROUNDS: Record<ClaimType, string[]> = {
  actualizacion: ['Ley 1266 de 2008, artículos 8 (num. 2 y 3), 13 y 16.'],
  permanencia: [
    'Ley 1266 de 2008, artículo 13 y parágrafos 1 y 3, modificado por el artículo 3 de la Ley 2157 de 2021.',
  ],
  'sin-aviso': [
    'Ley 1266 de 2008, artículo 12 y su parágrafo, adicionado por el artículo 6 de la Ley 2157 de 2021.',
  ],
  rectificacion: ['Ley 1266 de 2008, artículos 4 (principio de veracidad), 8 y 16.'],
  suplantacion: [
    'Ley 1266 de 2008, artículo 16, parte II, numeral 7, adicionado por el artículo 7 de la Ley 2157 de 2021.',
  ],
};

export function buildLetter(c: ClaimInput): ClaimLetter {
  const t = CLAIM_TYPES.find((x) => x.id === c.type)!;
  const amount = c.amount ? ` por ${formatCOP(c.amount)}` : '';
  return {
    subject: `Derecho de petición en ejercicio del hábeas data · ${t.label}`,
    opening: `Yo, ${c.fullName || '[nombre completo]'}, identificado(a) con cédula de ciudadanía n.º ${c.documentNumber || '[número]'}, en ejercicio del derecho de petición (artículo 23 de la Constitución Política) y del derecho de hábeas data (artículo 15 de la Constitución y Ley 1266 de 2008, modificada por la Ley 2157 de 2021), presento el siguiente reclamo respecto de la obligación ${c.obligation || '[obligación]'}${amount}.`,
    facts: c.facts
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean),
    requests: REQUESTS[c.type],
    grounds: [
      ...GROUNDS[c.type],
      `Ley 1266 de 2008, artículo 16, parte II: el reclamo debe resolverse en máximo ${CLAIM_BUSINESS_DAYS} días hábiles contados desde el día siguiente a su recibo, prorrogables por ${CLAIM_EXTENSION_BUSINESS_DAYS} días hábiles, y la leyenda «reclamo en trámite» debe incluirse en un término no mayor a ${CLAIM_LEGEND_BUSINESS_DAYS} días hábiles. Si no se resuelve en ese lapso, se entiende resuelto favorablemente.`,
    ],
    closing: [
      `Recibiré notificaciones en ${c.address || '[dirección]'} y en el correo ${c.email || '[correo]'}.`,
      'Anexos: copia de mi documento de identidad y soportes relacionados.',
    ],
  };
}

export interface ClaimDeadlines {
  legend: string;
  answer: string;
  extended: string;
}

export function claimDeadlines(filedIso: string, parse: (s: string) => Date): ClaimDeadlines {
  const filed = parse(filedIso);
  return {
    legend: toISO(addBusinessDays(filed, CLAIM_LEGEND_BUSINESS_DAYS)),
    answer: toISO(addBusinessDays(filed, CLAIM_BUSINESS_DAYS)),
    extended: toISO(addBusinessDays(filed, CLAIM_BUSINESS_DAYS + CLAIM_EXTENSION_BUSINESS_DAYS)),
  };
}

export function letterHeader(c: ClaimInput): string[] {
  return [
    `${c.city || '[ciudad]'}, ${formatDate(c.date)}`,
    '',
    'Señores',
    c.recipient || '[entidad]',
    'E. S. D.',
  ];
}
