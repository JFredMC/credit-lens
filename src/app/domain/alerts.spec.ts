import { buildAlerts } from './alerts';
import { parseISO } from './format';
import { AS_OF, PERSONAS } from './personas';

const asOf = parseISO(AS_OF);
const get = (id: string) => PERSONAS.find((p) => p.id === id)!;

describe('alerts feed', () => {
  it('camila gets critical mora, utilization and consultation alerts', () => {
    const a = buildAlerts(get('camila'), asOf);
    expect(a.some((x) => x.kind === 'pago' && x.severity === 'critical')).toBe(true);
    expect(a.filter((x) => x.kind === 'cupo')).toHaveLength(2);
    expect(a.some((x) => x.kind === 'consulta')).toBe(true);
    expect(new Set(a.map((x) => x.id)).size).toBe(a.length);
  });
  it('threshold controls utilization alerts', () => {
    expect(buildAlerts(get('laura'), asOf, 0.7).filter((x) => x.kind === 'cupo')).toHaveLength(0);
    expect(buildAlerts(get('laura'), asOf, 0.1).filter((x) => x.kind === 'cupo')).toHaveLength(2);
  });
  it('is sorted newest first', () => {
    const a = buildAlerts(get('andres'), asOf);
    expect(a.map((x) => x.date)).toEqual([...a.map((x) => x.date)].sort().reverse());
  });
});
