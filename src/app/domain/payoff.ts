export type Strategy = 'avalanche' | 'snowball';

export interface Debt {
  id: string;
  name: string;
  balance: number;
  /** Effective annual rate as a fraction. */
  annualRate: number;
  minPayment: number;
}

export interface PayoffResult {
  strategy: Strategy;
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** Month (1-based) when each debt reaches zero, in payoff order. */
  order: { id: string; name: string; month: number }[];
  /** Remaining total balance at the end of each month (index 0 = start). */
  timeline: number[];
  /** True if the budget can't cover interest and the plan never ends. */
  stuck: boolean;
}

export const monthlyRate = (annual: number): number => Math.pow(1 + annual, 1 / 12) - 1;

const MAX_MONTHS = 600;

/**
 * Month-by-month payoff simulation. Every debt gets its minimum; the extra budget plus the
 * minimums of debts already paid off go to the target debt (highest rate for avalanche,
 * lowest balance for snowball).
 */
export function payoffPlan(debts: Debt[], extra: number, strategy: Strategy): PayoffResult {
  const ds = debts.filter((d) => d.balance > 0).map((d) => ({ ...d }));
  const budget = ds.reduce((s, d) => s + d.minPayment, 0) + Math.max(0, extra);
  const timeline = [ds.reduce((s, d) => s + d.balance, 0)];
  const order: PayoffResult['order'] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;

  const priority = (): typeof ds =>
    ds
      .filter((d) => d.balance > 0)
      .sort((a, b) =>
        strategy === 'avalanche'
          ? b.annualRate - a.annualRate || a.balance - b.balance
          : a.balance - b.balance || b.annualRate - a.annualRate,
      );

  while (ds.some((d) => d.balance > 0.5) && month < MAX_MONTHS) {
    month++;
    for (const d of ds) {
      if (d.balance <= 0) continue;
      const i = d.balance * monthlyRate(d.annualRate);
      d.balance += i;
      totalInterest += i;
    }
    let money = budget;
    for (const d of ds) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.minPayment, d.balance, money);
      d.balance -= pay;
      money -= pay;
      totalPaid += pay;
    }
    for (const d of priority()) {
      if (money <= 0) break;
      const pay = Math.min(d.balance, money);
      d.balance -= pay;
      money -= pay;
      totalPaid += pay;
    }
    for (const d of ds) {
      if (d.balance <= 0.5 && !order.some((o) => o.id === d.id)) {
        d.balance = 0;
        order.push({ id: d.id, name: d.name, month });
      }
    }
    timeline.push(ds.reduce((s, d) => s + d.balance, 0));
  }
  return {
    strategy,
    months: month,
    totalInterest: Math.round(totalInterest),
    totalPaid: Math.round(totalPaid),
    order,
    timeline,
    stuck: month >= MAX_MONTHS,
  };
}
