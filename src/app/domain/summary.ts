import { Persona } from './models';
import { utilization } from './score';

export interface Summary {
  totalDebt: number;
  monthlyPayments: number;
  overdue: number;
  activeProducts: number;
  closedProducts: number;
  utilization: number;
  /** Share of reported months (last 24) that were on time. */
  onTimeRate: number;
  /** monthly payments / monthly income */
  debtToIncome: number;
}

export function summarize(p: Persona): Summary {
  const open = p.products.filter((x) => x.status !== 'CERRADA');
  const months = p.products.flatMap((x) => x.history).filter((m) => m !== 'NA');
  const monthlyPayments = open.reduce((s, x) => s + x.monthlyPayment, 0);
  return {
    totalDebt: open.reduce((s, x) => s + x.balance, 0),
    monthlyPayments,
    overdue: open.reduce((s, x) => s + x.overdueAmount, 0),
    activeProducts: open.length,
    closedProducts: p.products.length - open.length,
    utilization: utilization(p.products),
    onTimeRate: months.length ? months.filter((m) => m === 'OK').length / months.length : 1,
    debtToIncome: p.monthlyIncome ? monthlyPayments / p.monthlyIncome : 0,
  };
}
