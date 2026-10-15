import { formatCOP, formatDate, formatPct } from './format';
import { Persona, PRODUCT_LABEL, STATUS_LABEL } from './models';
import { ScoreResult } from './score';
import { Summary } from './summary';

export type Pair = [string, string];

export interface CreditReport {
  title: string;
  asOfLabel: string;
  person: Pair[];
  score: number;
  band: string;
  factors: Pair[];
  kpis: Pair[];
  productHeader: string[];
  products: string[][];
  inquiries: Pair[];
  disclaimer: string;
}

export const REPORT_DISCLAIMER =
  'Reporte de demostración con datos ficticios generado por Credit Lens. El puntaje es un modelo educativo propio, no es una calificación de ninguna central de riesgo. Credit Lens no está afiliado a DataCrédito, Experian, TransUnion ni a ninguna central de riesgo.';

/** Plain, format-agnostic content of the full credit report (shared by PDF, Excel and Word). */
export function buildReport(
  p: Persona,
  s: ScoreResult,
  sum: Summary,
  asOfIso: string,
): CreditReport {
  return {
    title: `Reporte de crédito · ${p.name}`,
    asOfLabel: formatDate(asOfIso),
    person: [
      ['Nombre', p.name],
      ['Documento', `${p.documentType} ${p.documentMasked}`],
      ['Ciudad', p.city],
      ['Ingreso mensual declarado', formatCOP(p.monthlyIncome)],
    ],
    score: s.score,
    band: s.band.label,
    factors: s.factors.map((f) => [
      `${f.label} (${Math.round(f.weight * 100)} %)`,
      `${f.points} / ${f.maxPoints} pts`,
    ]),
    kpis: [
      ['Deuda total', formatCOP(sum.totalDebt)],
      ['Cuotas mensuales', formatCOP(sum.monthlyPayments)],
      ['Saldo en mora', formatCOP(sum.overdue)],
      ['Uso de cupos', formatPct(sum.utilization)],
      ['Pagos a tiempo (24 meses)', formatPct(sum.onTimeRate)],
      ['Cuotas / ingreso', formatPct(sum.debtToIncome)],
      ['Obligaciones abiertas / cerradas', `${sum.activeProducts} / ${sum.closedProducts}`],
    ],
    productHeader: ['Entidad', 'Tipo', 'Estado', 'Saldo', 'Cuota', 'Mora (días)'],
    products: p.products.map((x) => [
      x.entity,
      PRODUCT_LABEL[x.type],
      STATUS_LABEL[x.status],
      formatCOP(x.balance),
      formatCOP(x.monthlyPayment),
      String(x.daysLate),
    ]),
    inquiries: p.inquiries.map((q) => [
      formatDate(q.date),
      q.self ? 'Consulta propia (no afecta el puntaje)' : `${q.entity} · ${q.purpose}`,
    ]),
    disclaimer: REPORT_DISCLAIMER,
  };
}

export function reportFileName(p: Persona, ext: string): string {
  return `credit-lens-reporte-${p.id}.${ext}`;
}
