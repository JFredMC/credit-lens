import { Product } from './models';

export interface UpcomingPayment {
  product: Product;
  date: Date;
  amount: number;
  daysLeft: number;
}

/** Next due date (on or after asOf) for each open product with an installment. */
export function upcomingPayments(products: Product[], asOf: Date): UpcomingPayment[] {
  return products
    .filter((p) => p.status !== 'CERRADA' && p.monthlyPayment > 0)
    .map((p) => {
      const y = asOf.getUTCFullYear();
      const m = asOf.getUTCMonth();
      const day = (yy: number, mm: number) =>
        Math.min(p.dueDay, new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate());
      let date = new Date(Date.UTC(y, m, day(y, m)));
      if (date < asOf) date = new Date(Date.UTC(y, m + 1, day(y, m + 1)));
      return {
        product: p,
        date,
        amount: p.monthlyPayment + p.overdueAmount,
        daysLeft: Math.round((date.getTime() - asOf.getTime()) / 86_400_000),
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
