import { PRODUCT_LABEL, Product } from './models';

export interface ScheduledPayment {
  product: Product;
  /** UTC date of the due day (clamped to the month's last day). */
  date: Date;
  amount: number;
  overdue: number;
}

const lastDay = (y: number, m: number): number => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/** Payments due in a given month (month 0-11) for open products with an installment. */
export function monthSchedule(
  products: Product[],
  year: number,
  month: number,
  asOf: Date,
): ScheduledPayment[] {
  const isCurrent = year === asOf.getUTCFullYear() && month === asOf.getUTCMonth();
  return products
    .filter((p) => p.status !== 'CERRADA' && p.monthlyPayment > 0)
    .map((p) => {
      const overdue = isCurrent ? p.overdueAmount : 0;
      return {
        product: p,
        date: new Date(Date.UTC(year, month, Math.min(p.dueDay, lastDay(year, month)))),
        amount: p.monthlyPayment + overdue,
        overdue,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Weeks (Monday first) covering the month; null for days outside it. */
export function monthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const days = lastDay(year, month);
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(Date.UTC(year, month, d)));
  while (cells.length % 7) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const pad = (n: number): string => String(n).padStart(2, '0');
const icsDate = (d: Date): string =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
const escape = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

/** Folds lines longer than 75 octets (RFC 5545 §3.1). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

/**
 * iCalendar with one all-day event per payment for the next `months` months,
 * each with a reminder 2 days before.
 */
export function buildIcs(products: Product[], asOf: Date, months = 12, stamp = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JFredDev//Credit Lens demo//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pagos · Credit Lens (demo)',
  ];
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  for (let i = 0; i < months; i++) {
    const y = asOf.getUTCFullYear() + Math.floor((asOf.getUTCMonth() + i) / 12);
    const m = (asOf.getUTCMonth() + i) % 12;
    for (const s of monthSchedule(products, y, m, asOf)) {
      if (s.date < asOf) continue;
      const next = new Date(s.date.getTime() + 86_400_000);
      const amount = `$ ${Math.round(s.amount).toLocaleString('es-CO')}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${s.product.id}-${icsDate(s.date)}@credit-lens.jfreddev`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${icsDate(s.date)}`,
        `DTEND;VALUE=DATE:${icsDate(next)}`,
        `SUMMARY:${escape(`Pago ${s.product.entity} · ${amount}`)}`,
        `DESCRIPTION:${escape(`${PRODUCT_LABEL[s.product.type]}. Datos ficticios de la demo Credit Lens.`)}`,
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escape(`Pago ${s.product.entity} en 2 días`)}`,
        'TRIGGER:-P2D',
        'END:VALARM',
        'END:VEVENT',
      );
    }
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
