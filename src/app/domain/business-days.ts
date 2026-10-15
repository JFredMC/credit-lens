import { addDays } from './format';

/** Easter Sunday (Gregorian, anonymous algorithm). */
export function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const nextMonday = (d: Date): Date => {
  const dow = d.getUTCDay();
  return dow === 1 ? d : addDays(d, (8 - dow) % 7);
};
const iso = (d: Date): string => d.toISOString().slice(0, 10);

/** Colombian public holidays (Ley 51 de 1983 "ley Emiliani" + Easter-based dates). */
export function colombianHolidays(year: number): Set<string> {
  const D = (m: number, d: number) => new Date(Date.UTC(year, m - 1, d));
  const e = easter(year);
  const fixed = [D(1, 1), D(5, 1), D(7, 20), D(8, 7), D(12, 8), D(12, 25)];
  const moved = [D(1, 6), D(3, 19), D(6, 29), D(8, 15), D(10, 12), D(11, 1), D(11, 11)].map(
    nextMonday,
  );
  const easterBased = [
    addDays(e, -3),
    addDays(e, -2),
    nextMonday(addDays(e, 39)),
    nextMonday(addDays(e, 60)),
    nextMonday(addDays(e, 68)),
  ];
  return new Set([...fixed, ...moved, ...easterBased].map(iso));
}

export function isBusinessDay(d: Date): boolean {
  const dow = d.getUTCDay();
  return dow !== 0 && dow !== 6 && !colombianHolidays(d.getUTCFullYear()).has(iso(d));
}

/** Adds n business days counted from the day after `from`. */
export function addBusinessDays(from: Date, n: number): Date {
  let d = from;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    if (isBusinessDay(d)) left--;
  }
  return d;
}
