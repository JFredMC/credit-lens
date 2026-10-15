import { CLAIM_TYPES, buildLetter, claimDeadlines } from './claim-letter';
import { parseISO } from './format';

const base = {
  fullName: 'Ana Pérez',
  documentNumber: '123',
  city: 'Medellín',
  address: 'Calle 1',
  email: 'a@b.co',
  recipient: 'Banco Ficticio',
  obligation: 'tarjeta de crédito con Banco Ficticio',
  facts: 'Hecho uno\n\nHecho dos',
  date: '2026-10-01',
};

describe('claim letter', () => {
  it('builds every type with requests and legal grounds', () => {
    for (const t of CLAIM_TYPES) {
      const l = buildLetter({ ...base, type: t.id });
      expect(l.requests.length).toBeGreaterThan(0);
      expect(l.grounds.join(' ')).toContain('15 días hábiles');
      expect(l.facts).toEqual(['Hecho uno', 'Hecho dos']);
      expect(l.opening).toContain('Ana Pérez');
    }
  });
  it('computes business-day deadlines', () => {
    expect(claimDeadlines('2026-10-01', parseISO)).toEqual({
      legend: '2026-10-05',
      answer: '2026-10-23',
      extended: '2026-11-05',
    });
  });
});
