import { parseISO } from './format';
import { payoffPlan, monthlyRate } from './payoff';
import { AS_OF, PERSONAS } from './personas';
import { simulate } from './simulator';
import { cardUsage } from './utilization';

const asOf = parseISO(AS_OF);
const camila = PERSONAS.find((p) => p.id === 'camila')!;

describe('simulator', () => {
  it('catching up and paying cards raises the score', () => {
    const r = simulate(
      camila,
      [
        { kind: 'catchUp', productId: 'c-card-2' },
        { kind: 'pay', productId: 'c-card-1', amount: 4_000_000 },
      ],
      asOf,
    );
    expect(r.delta).toBeGreaterThan(30);
  });
  it('missing a payment and many inquiries lower it', () => {
    const laura = PERSONAS[0];
    const r = simulate(
      laura,
      [
        { kind: 'miss', productId: 'l-card-1' },
        { kind: 'inquiries', count: 4 },
      ],
      asOf,
    );
    expect(r.delta).toBeLessThan(0);
  });
  it('no actions means no change and does not mutate the persona', () => {
    const before = JSON.stringify(camila);
    expect(simulate(camila, [], asOf).delta).toBe(0);
    simulate(camila, [{ kind: 'close', productId: 'c-card-1' }], asOf);
    expect(JSON.stringify(camila)).toBe(before);
  });
});

describe('payoff planner', () => {
  const debts = [
    { id: 'a', name: 'Tarjeta A', balance: 3_000_000, annualRate: 0.33, minPayment: 150_000 },
    { id: 'b', name: 'Crédito B', balance: 1_000_000, annualRate: 0.15, minPayment: 80_000 },
    { id: 'c', name: 'Tarjeta C', balance: 6_000_000, annualRate: 0.28, minPayment: 250_000 },
  ];
  it('monthly rate from E.A.', () => {
    expect(monthlyRate(0.268242)).toBeCloseTo(0.02, 4);
  });
  it('avalanche never pays more interest than snowball', () => {
    const av = payoffPlan(debts, 300_000, 'avalanche');
    const sn = payoffPlan(debts, 300_000, 'snowball');
    expect(av.totalInterest).toBeLessThanOrEqual(sn.totalInterest);
    expect(sn.order[0].id).toBe('b');
    expect(av.order[0].id).toBe('a');
    expect(av.stuck).toBe(false);
  });
  it('more extra money finishes sooner', () => {
    expect(payoffPlan(debts, 600_000, 'avalanche').months).toBeLessThan(
      payoffPlan(debts, 100_000, 'avalanche').months,
    );
  });
  it('detects a budget that cannot cover interest', () => {
    const r = payoffPlan(
      [{ id: 'x', name: 'X', balance: 10_000_000, annualRate: 0.4, minPayment: 50_000 }],
      0,
      'avalanche',
    );
    expect(r.stuck).toBe(true);
  });
});

describe('utilization', () => {
  it('computes amount to reach 30 %', () => {
    const u = cardUsage(camila.products);
    expect(u.limit).toBe(10_500_000);
    expect(u.toTarget).toBe(9_850_000 - 3_150_000);
    expect(u.cards[0].ratio).toBeGreaterThanOrEqual(u.cards[1].ratio);
  });
});
