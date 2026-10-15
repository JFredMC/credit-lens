import { addDays, parseISO } from './format';
import { EXPIRY_YEARS_FROM_DEFAULT, PERMANENCE_MAX_YEARS, PERMANENCE_MULTIPLIER } from './legal';

export type PermanenceRule = 'double' | 'cap4' | 'expiry8' | 'unpaid';

export interface PermanenceInput {
  /** Date the obligation went into arrears (yyyy-mm-dd). */
  defaultStart: string;
  /** Date overdue installments were paid or the obligation was extinguished. */
  paidAt?: string;
  asOf: Date;
}

export interface PermanenceResult {
  rule: PermanenceRule;
  arrearsDays: number;
  /** Estimated removal date (null only when the input is invalid). */
  removal: Date | null;
  /** Date of expiry by 8 years from default start. */
  expiry: Date;
  daysLeft: number;
  alreadyRemoved: boolean;
  error?: string;
}

const addYears = (d: Date, y: number): Date =>
  new Date(Date.UTC(d.getUTCFullYear() + y, d.getUTCMonth(), d.getUTCDate()));
const daysBetween = (a: Date, b: Date): number =>
  Math.round((b.getTime() - a.getTime()) / 86_400_000);

/**
 * Estimated removal date of negative data under art. 13 Ley 1266 de 2008
 * (modified by Ley 2157 de 2021). Does not cover the 2021 transition regime (art. 9 Ley 2157).
 */
export function permanence({ defaultStart, paidAt, asOf }: PermanenceInput): PermanenceResult {
  const start = parseISO(defaultStart);
  const expiry = addYears(start, EXPIRY_YEARS_FROM_DEFAULT);
  const base = { expiry, arrearsDays: 0, daysLeft: 0, alreadyRemoved: false };

  if (!paidAt) {
    const left = daysBetween(asOf, expiry);
    return {
      ...base,
      rule: 'unpaid',
      arrearsDays: Math.max(0, daysBetween(start, asOf)),
      removal: expiry,
      daysLeft: Math.max(0, left),
      alreadyRemoved: left <= 0,
    };
  }
  const paid = parseISO(paidAt);
  if (paid < start) {
    return {
      ...base,
      rule: 'double',
      removal: null,
      error: 'La fecha de pago es anterior al inicio de la mora.',
    };
  }
  const arrearsDays = daysBetween(start, paid);
  const doubled = addDays(paid, arrearsDays * PERMANENCE_MULTIPLIER);
  const cap = addYears(paid, PERMANENCE_MAX_YEARS);
  let removal = doubled;
  let rule: PermanenceRule = 'double';
  if (cap < removal) {
    removal = cap;
    rule = 'cap4';
  }
  if (expiry < removal) {
    removal = expiry;
    rule = 'expiry8';
  }
  const left = daysBetween(asOf, removal);
  return {
    rule,
    arrearsDays,
    removal,
    expiry,
    daysLeft: Math.max(0, left),
    alreadyRemoved: left <= 0,
  };
}
