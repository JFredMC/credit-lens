import { addBusinessDays, colombianHolidays, easter } from './business-days';
import { parseISO, toISO } from './format';
import { SMALL_DEBT_THRESHOLD_2026 } from './legal';
import { permanence } from './permanence';

const asOf = parseISO('2026-10-01');

describe('permanence (art. 13 Ley 1266, mod. Ley 2157)', () => {
  it('doubles the arrears time from payment', () => {
    const r = permanence({ defaultStart: '2025-01-01', paidAt: '2025-07-01', asOf });
    expect(r.rule).toBe('double');
    expect(r.arrearsDays).toBe(181);
    expect(toISO(r.removal!)).toBe('2026-06-28');
    expect(r.alreadyRemoved).toBe(true);
  });
  it('caps at 4 years from payment', () => {
    const r = permanence({ defaultStart: '2022-01-01', paidAt: '2025-01-01', asOf });
    expect(r.rule).toBe('cap4');
    expect(toISO(r.removal!)).toBe('2029-01-01');
  });
  it('never beyond 8 years from default start', () => {
    const r = permanence({ defaultStart: '2019-01-01', paidAt: '2025-01-01', asOf });
    expect(r.rule).toBe('expiry8');
    expect(toISO(r.removal!)).toBe('2027-01-01');
  });
  it('unpaid debts expire at 8 years', () => {
    const r = permanence({ defaultStart: '2024-03-15', asOf });
    expect(r.rule).toBe('unpaid');
    expect(toISO(r.removal!)).toBe('2032-03-15');
  });
  it('rejects payment before default', () => {
    expect(
      permanence({ defaultStart: '2025-01-01', paidAt: '2024-01-01', asOf }).error,
    ).toBeTruthy();
  });
  it('small debt threshold 2026 = 15 % of SMMLV', () => {
    expect(SMALL_DEBT_THRESHOLD_2026).toBe(262_635);
  });
});

describe('Colombian business days', () => {
  it('Easter dates', () => {
    expect(toISO(easter(2026))).toBe('2026-04-05');
    expect(toISO(easter(2027))).toBe('2027-03-28');
  });
  it('2026 holidays include the moved and Easter-based ones', () => {
    const h = colombianHolidays(2026);
    for (const d of [
      '2026-01-12',
      '2026-03-23',
      '2026-04-02',
      '2026-04-03',
      '2026-05-18',
      '2026-06-08',
      '2026-06-15',
      '2026-06-29',
      '2026-08-17',
      '2026-10-12',
      '2026-11-02',
      '2026-11-16',
      '2026-12-08',
    ])
      expect(h.has(d)).toBe(true);
    expect(h.size).toBe(18);
  });
  it('15 business days from 2026-10-01 skips weekends and 12 Oct', () => {
    expect(toISO(addBusinessDays(parseISO('2026-10-01'), 15))).toBe('2026-10-23');
  });
});
