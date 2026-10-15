import { describe, expect, it } from 'vitest';
import { USURY_CONSUMO_OCT_2026, IBC_CONSUMO_OCT_2026 } from '../../domain/legal';
import { monthlyFromEa, pct2 } from './learn-page';

describe('learn', () => {
  it('converts E.A. to monthly', () => {
    expect(monthlyFromEa(0.12)).toBeCloseTo(0.009489, 5);
    expect(Math.pow(1 + monthlyFromEa(0.25), 12) - 1).toBeCloseTo(0.25, 10);
  });
  it('formats rates with two decimals', () => {
    expect(pct2(USURY_CONSUMO_OCT_2026)).toBe('28,59 %');
  });
  it('usury is 1.5 × IBC as certified', () => {
    expect(IBC_CONSUMO_OCT_2026 * 1.5).toBeCloseTo(USURY_CONSUMO_OCT_2026, 3);
  });
});
