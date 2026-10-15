import { parseISO } from './format';
import { footprint } from './footprint';
import { AS_OF, PERSONAS } from './personas';
import { computeScore } from './score';

const asOf = parseISO(AS_OF);

describe('consultation footprint', () => {
  it('separates self consultations and counts windows', () => {
    const camila = PERSONAS.find((p) => p.id === 'camila')!;
    const f = footprint(camila.inquiries, asOf);
    expect(f.self).toHaveLength(1);
    expect(f.last6).toBe(4);
    expect(f.last12).toBe(5);
    expect(f.entity[0].date >= f.entity[1].date).toBe(true);
  });
  it('self consultations never change the score', () => {
    const p = PERSONAS[0];
    const base = computeScore({ products: p.products, inquiries: p.inquiries, asOf }).score;
    const many = Array.from({ length: 20 }, () => ({
      date: '2026-09-30',
      entity: 'Tú',
      purpose: 'Consulta propia',
      self: true,
    }));
    expect(
      computeScore({ products: p.products, inquiries: [...p.inquiries, ...many], asOf }).score,
    ).toBe(base);
  });
});
