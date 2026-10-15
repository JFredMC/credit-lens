import { monthsBetween, parseISO } from './format';
import { Inquiry } from './models';

export interface Footprint {
  /** Entity consultations, newest first, last 24 months. */
  entity: Inquiry[];
  self: Inquiry[];
  last6: number;
  last12: number;
  /** Distinct entities in the last 6 months. */
  entities6: number;
}

export function footprint(inquiries: Inquiry[], asOf: Date): Footprint {
  const within = (q: Inquiry, m: number) => monthsBetween(parseISO(q.date), asOf) < m;
  const sorted = [...inquiries]
    .filter((q) => within(q, 24))
    .sort((a, b) => b.date.localeCompare(a.date));
  const entity = sorted.filter((q) => !q.self);
  return {
    entity,
    self: sorted.filter((q) => q.self),
    last6: entity.filter((q) => within(q, 6)).length,
    last12: entity.filter((q) => within(q, 12)).length,
    entities6: new Set(entity.filter((q) => within(q, 6)).map((q) => q.entity)).size,
  };
}
