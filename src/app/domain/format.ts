const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const pct = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthFmt = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'UTC' });

export const formatCOP = (n: number): string => cop.format(Math.round(n)).replace(/\u00a0/g, ' ');
export const formatPct = (f: number): string => pct.format(f).replace(/\u00a0/g, ' ');
export const formatDate = (iso: string): string => dateFmt.format(parseISO(iso));
export const monthShort = (d: Date): string => monthFmt.format(d).replace('.', '');

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function addMonths(d: Date, n: number): Date {
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(d.getUTCDate(), last));
  return r;
}
export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}
export function monthsBetween(a: Date, b: Date): number {
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}
