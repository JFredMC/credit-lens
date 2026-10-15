import { buildIcs, monthGrid, monthSchedule } from './calendar';
import { parseISO } from './format';
import { AS_OF, PERSONAS } from './personas';

const asOf = parseISO(AS_OF);
const camila = PERSONAS.find((p) => p.id === 'camila')!;

describe('payment calendar', () => {
  it('clamps due day 30 to 28 in February and adds overdue only in the current month', () => {
    const feb = monthSchedule(camila.products, 2027, 1, asOf);
    expect(feb.find((s) => s.product.id === 'c-edu')!.date.getUTCDate()).toBe(28);
    const oct = monthSchedule(camila.products, 2026, 9, asOf);
    expect(oct.find((s) => s.product.id === 'c-card-2')!.amount).toBe(260_000 + 540_000);
    expect(feb.find((s) => s.product.id === 'c-card-2')!.amount).toBe(260_000);
  });
  it('grid starts on Monday and covers whole weeks', () => {
    const g = monthGrid(2026, 9); // Oct 2026 starts on Thursday
    expect(g[0].slice(0, 3)).toEqual([null, null, null]);
    expect(g[0][3]!.getUTCDate()).toBe(1);
    expect(g.every((w) => w.length === 7)).toBe(true);
  });
  it('builds a valid ICS with CRLF, 12 months of events and alarms', () => {
    const ics = buildIcs(camila.products, asOf, 12, new Date('2026-10-01T00:00:00Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(48);
    expect((ics.match(/TRIGGER:-P2D/g) ?? []).length).toBe(48);
    for (const line of ics.split('\r\n'))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
