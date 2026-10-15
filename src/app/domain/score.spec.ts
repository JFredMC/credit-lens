import { parseISO } from './format';
import { AS_OF, PERSONAS, h } from './personas';
import { BANDS, SCORE_MAX, SCORE_MIN, bandFor, scorePersona, utilizationFactor } from './score';
import { summarize } from './summary';

const asOf = parseISO(AS_OF);
const byId = (id: string) => PERSONAS.find((p) => p.id === id)!;

describe('score model', () => {
  it('keeps scores inside 150–950 and orders the personas sensibly', () => {
    const [laura, andres, camila] = ['laura', 'andres', 'camila'].map(
      (id) => scorePersona(byId(id), asOf).score,
    );
    for (const s of [laura, andres, camila]) {
      expect(s).toBeGreaterThanOrEqual(SCORE_MIN);
      expect(s).toBeLessThanOrEqual(SCORE_MAX);
    }
    expect(laura).toBeGreaterThan(andres);
    expect(andres).toBeGreaterThan(camila);
    expect(bandFor(laura).status).toBe('good');
    expect(bandFor(camila).status).toBe('bad');
  });

  it('factor points add up to the score above the minimum', () => {
    const r = scorePersona(byId('andres'), asOf);
    const pts = r.factors.reduce((s, f) => s + f.points, 0);
    expect(Math.abs(SCORE_MIN + pts - r.score)).toBeLessThanOrEqual(3);
    expect(r.factors.reduce((s, f) => s + f.weight, 0)).toBeCloseTo(1);
  });

  it('utilization factor is monotonic decreasing', () => {
    let prev = 2;
    for (let u = 0; u <= 1.2; u += 0.05) {
      const v = utilizationFactor(u);
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
  });

  it('bands start at the minimum and are sorted', () => {
    expect(BANDS[0].min).toBe(SCORE_MIN);
    expect(BANDS.map((b) => b.min)).toEqual([...BANDS.map((b) => b.min)].sort((a, b) => a - b));
  });

  it('history helper validates length', () => {
    expect(h('OK*24')).toHaveLength(24);
    expect(() => h('OK*3')).toThrow();
  });

  it('summary excludes closed products from debt', () => {
    const s = summarize(byId('andres'));
    expect(s.closedProducts).toBe(1);
    expect(s.totalDebt).toBe(1_900_000 + 4_150_000);
    expect(summarize(byId('camila')).overdue).toBe(540_000);
  });
});
