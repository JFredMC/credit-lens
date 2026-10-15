import { addMonths, formatCOP, formatPct, toISO } from './format';
import { BANDS, SCORE_MAX } from './score';

export type GoalKind = 'score' | 'utilization' | 'overdue';

export interface Goal {
  id: string;
  kind: GoalKind;
  /** Score points, utilization fraction or COP amount. */
  target: number;
  /** Value when the goal was set. */
  start: number;
  /** ISO month deadline (yyyy-mm-01). */
  deadline: string;
}

export interface Metrics {
  score: number;
  utilization: number;
  overdue: number;
}

export const GOAL_LABEL: Record<GoalKind, string> = {
  score: 'Subir mi puntaje',
  utilization: 'Bajar el uso de mis cupos',
  overdue: 'Ponerme al día',
};

export const GOAL_TIPS: Record<GoalKind, string[]> = {
  score: [
    'Paga todas tus cuotas a tiempo: el hábito de pago es el factor que más pesa.',
    'Mantén el uso de tus tarjetas por debajo del 30 % del cupo.',
    'Espacia tus solicitudes de crédito.',
  ],
  utilization: [
    'Abona a la tarjeta con mayor uso antes de la fecha de corte.',
    'Divide compras grandes en varios meses o usa un crédito a plazo.',
    'No canceles tarjetas sin deuda: su cupo disponible ayuda.',
  ],
  overdue: [
    'Prioriza la obligación con más días de mora.',
    'Habla con la entidad: puedes pedir un acuerdo de pago.',
    'Al pagar, el reporte negativo tiene un tiempo máximo de permanencia.',
  ],
};

/** Higher is better for the score; lower is better for the rest. */
export const higherIsBetter = (k: GoalKind): boolean => k === 'score';

export function currentValue(k: GoalKind, m: Metrics): number {
  return k === 'score' ? m.score : k === 'utilization' ? m.utilization : m.overdue;
}

export function isMet(g: Goal, current: number): boolean {
  return higherIsBetter(g.kind) ? current >= g.target : current <= g.target;
}

/** Share of the way from start to target, 0..1. */
export function goalProgress(g: Goal, current: number): number {
  if (isMet(g, current)) return 1;
  const total = higherIsBetter(g.kind) ? g.target - g.start : g.start - g.target;
  const done = higherIsBetter(g.kind) ? current - g.start : g.start - current;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, done / total));
}

export function formatGoalValue(k: GoalKind, v: number): string {
  return k === 'score' ? String(Math.round(v)) : k === 'utilization' ? formatPct(v) : formatCOP(v);
}

/** Next band threshold above the score, or the scale maximum. */
export function nextScoreTarget(score: number): number {
  return BANDS.find((b) => b.min > score)?.min ?? SCORE_MAX;
}

/** Suggested starter goals for a persona. The score goal starts at the value from a year ago. */
export function defaultGoals(m: Metrics, scoreYearAgo: number, asOf: Date): Goal[] {
  const deadline = toISO(addMonths(asOf, 6)).slice(0, 8) + '01';
  const goals: Goal[] = [
    {
      id: 'g-score',
      kind: 'score',
      target: nextScoreTarget(m.score),
      start: Math.min(scoreYearAgo, m.score),
      deadline,
    },
  ];
  if (m.utilization > 0.3)
    goals.push({ id: 'g-util', kind: 'utilization', target: 0.3, start: m.utilization, deadline });
  if (m.overdue > 0)
    goals.push({ id: 'g-overdue', kind: 'overdue', target: 0, start: m.overdue, deadline });
  return goals;
}

export function validateGoal(kind: GoalKind, target: number, current: number): string {
  if (!Number.isFinite(target)) return 'Escribe una meta válida.';
  if (kind === 'score' && (target < 150 || target > SCORE_MAX))
    return `El puntaje va de 150 a ${SCORE_MAX}.`;
  if (kind === 'utilization' && (target < 0 || target > 1))
    return 'El uso de cupos va de 0 % a 100 %.';
  if (kind === 'overdue' && target < 0) return 'El saldo no puede ser negativo.';
  if (higherIsBetter(kind) ? target <= current : target >= current)
    return 'Ya cumples esa meta: elige una más exigente.';
  return '';
}
