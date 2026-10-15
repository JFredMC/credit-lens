import { Inquiry, MonthStatus, Persona, Product } from './models';
import { monthsBetween, parseISO } from './format';

/**
 * Credit Lens fictional score model (150–950).
 * It is NOT the model of any real credit bureau: it is a transparent, educational
 * approximation built on commonly cited factors so every point can be explained.
 */
export const SCORE_MIN = 150;
export const SCORE_MAX = 950;

export type FactorId = 'payment' | 'utilization' | 'age' | 'inquiries' | 'mix';
export type FactorStatus = 'good' | 'warn' | 'bad';

export interface FactorResult {
  id: FactorId;
  label: string;
  weight: number;
  /** 0..1 */
  value: number;
  /** Points contributed out of weight * 800. */
  points: number;
  maxPoints: number;
  status: FactorStatus;
  detail: string;
  tip: string;
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  factors: FactorResult[];
}

export interface ScoreBand {
  id: 'muy-bajo' | 'bajo' | 'medio' | 'bueno' | 'excelente';
  label: string;
  min: number;
  status: FactorStatus;
}

export const BANDS: ScoreBand[] = [
  { id: 'muy-bajo', label: 'Muy bajo', min: SCORE_MIN, status: 'bad' },
  { id: 'bajo', label: 'Bajo', min: 450, status: 'bad' },
  { id: 'medio', label: 'Medio', min: 600, status: 'warn' },
  { id: 'bueno', label: 'Bueno', min: 720, status: 'good' },
  { id: 'excelente', label: 'Excelente', min: 830, status: 'good' },
];

export const WEIGHTS: Record<FactorId, number> = {
  payment: 0.35,
  utilization: 0.3,
  age: 0.15,
  inquiries: 0.1,
  mix: 0.1,
};

export interface ScoreInput {
  products: Product[];
  inquiries: Inquiry[];
  asOf: Date;
}

const SEVERITY: Record<MonthStatus, number> = {
  OK: 0,
  NA: 0,
  M30: 1,
  M60: 2,
  M90: 3.5,
  M120: 5,
};

export function bandFor(score: number): ScoreBand {
  return [...BANDS].reverse().find((b) => score >= b.min) ?? BANDS[0];
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Revolving utilization (cards): balance / limit across open cards. */
export function utilization(products: Product[]): number {
  const cards = products.filter((p) => p.type === 'CARD' && p.status !== 'CERRADA' && p.limit);
  const limit = cards.reduce((s, p) => s + (p.limit ?? 0), 0);
  if (!limit) return 0;
  return cards.reduce((s, p) => s + p.balance, 0) / limit;
}

export function paymentFactor(products: Product[]): number {
  let penalty = 0;
  for (const p of products) {
    p.history.forEach((m, i) => {
      // recent months weigh more (last month = 1, 24 months ago ≈ 0.35)
      const recency = 0.35 + (0.65 * (i + 1)) / p.history.length;
      penalty += SEVERITY[m] * recency;
    });
    if (p.status === 'EN_MORA') penalty += 8 + Math.min(p.daysLate, 180) / 30;
  }
  return clamp01(1 - penalty / 26);
}

export function utilizationFactor(u: number): number {
  if (u <= 0.1) return 1;
  if (u <= 0.3) return 1 - ((u - 0.1) / 0.2) * 0.15;
  if (u <= 0.5) return 0.85 - ((u - 0.3) / 0.2) * 0.3;
  if (u <= 0.9) return 0.55 - ((u - 0.5) / 0.4) * 0.4;
  return Math.max(0, 0.15 - (u - 0.9));
}

export function averageAgeMonths(products: Product[], asOf: Date): number {
  if (!products.length) return 0;
  return (
    products.reduce((s, p) => s + Math.max(0, monthsBetween(parseISO(p.openedAt), asOf)), 0) /
    products.length
  );
}

export function recentInquiries(inquiries: Inquiry[], asOf: Date, months = 6): number {
  return inquiries.filter((q) => !q.self && monthsBetween(parseISO(q.date), asOf) < months).length;
}

export function computeScore({ products, inquiries, asOf }: ScoreInput): ScoreResult {
  const u = utilization(products);
  const age = averageAgeMonths(products, asOf);
  const inq = recentInquiries(inquiries, asOf);
  const types = new Set(products.filter((p) => p.status !== 'CERRADA').map((p) => p.type)).size;
  const lateMonths = products.reduce(
    (s, p) => s + p.history.filter((m) => m !== 'OK' && m !== 'NA').length,
    0,
  );
  const active = products.filter((p) => p.status === 'EN_MORA');

  const values: Record<FactorId, number> = {
    payment: paymentFactor(products),
    utilization: utilizationFactor(u),
    age: clamp01(age / 132),
    inquiries: clamp01(1 - inq * 0.15),
    mix: clamp01(types / 4),
  };

  const statusOf = (v: number): FactorStatus => (v >= 0.8 ? 'good' : v >= 0.55 ? 'warn' : 'bad');
  const pctU = Math.round(u * 100);

  const meta: Record<FactorId, { label: string; detail: string; tip: string }> = {
    payment: {
      label: 'Hábito de pago',
      detail: active.length
        ? `${active.length} obligación(es) en mora hoy y ${lateMonths} mes(es) con mora en 24 meses.`
        : lateMonths
          ? `Sin moras activas. ${lateMonths} mes(es) con mora en los últimos 24 meses.`
          : 'Todos tus pagos de los últimos 24 meses están al día.',
      tip: active.length
        ? 'Ponte al día con la obligación en mora: es lo que más mueve tu puntaje.'
        : 'Programa pagos automáticos para no perder una fecha.',
    },
    utilization: {
      label: 'Uso de cupos',
      detail: `Usas el ${pctU} % del cupo total de tus tarjetas.`,
      tip:
        u > 0.3
          ? 'Baja el uso por debajo del 30 % abonando a la tarjeta más llena.'
          : 'Vas bien. Mantén el uso por debajo del 30 %.',
    },
    age: {
      label: 'Antigüedad',
      detail: `Tus productos tienen en promedio ${Math.round(age)} meses.`,
      tip: 'Evita cerrar tus productos más antiguos si no te cuestan dinero.',
    },
    inquiries: {
      label: 'Solicitudes recientes',
      detail: `${inq} consulta(s) de entidades en los últimos 6 meses.`,
      tip: 'Espacia tus solicitudes de crédito. Consultar tu propio historial no te afecta.',
    },
    mix: {
      label: 'Mezcla de productos',
      detail: `${types} tipo(s) de producto activos.`,
      tip: 'Una mezcla sana (tarjeta + crédito a plazo) ayuda, pero no abras productos solo por eso.',
    },
  };

  const factors: FactorResult[] = (Object.keys(WEIGHTS) as FactorId[]).map((id) => {
    const maxPoints = WEIGHTS[id] * (SCORE_MAX - SCORE_MIN);
    return {
      id,
      ...meta[id],
      weight: WEIGHTS[id],
      value: values[id],
      points: Math.round(values[id] * maxPoints),
      maxPoints: Math.round(maxPoints),
      status: statusOf(values[id]),
    };
  });

  const raw = factors.reduce((s, f) => s + f.value * WEIGHTS[f.id], 0);
  const score = Math.round(SCORE_MIN + raw * (SCORE_MAX - SCORE_MIN));
  return { score, band: bandFor(score), factors };
}

export function scorePersona(p: Persona, asOf: Date): ScoreResult {
  return computeScore({ products: p.products, inquiries: p.inquiries, asOf });
}
