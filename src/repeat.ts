/** How an event repeats: the choices the add sheet offers, the words for them, and the calendar rule (RFC 5545 RRULE) they become. */
export type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export interface Repeat {
  freq: Freq;
  /** every N days, weeks, months or years */
  every: number;
  /** weekly: which days, 0 = Monday … 6 = Sunday */
  days: number[];
  /** monthly: on the same date ("the 13th") or the same weekday ("the second Friday") */
  monthBy: 'date' | 'weekday';
  end: 'never' | 'on' | 'after';
  /** last day it happens, as YYYY-MM-DD (end = 'on') */
  until?: string;
  /** how many times in all (end = 'after') */
  count?: number;
}

const CODE = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const NTH = ['first', 'second', 'third', 'fourth', 'last'];
const UNIT: Record<Freq, string> = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' };

/** Monday = 0 */
export const dow = (d: Date): number => (d.getDay() + 6) % 7;
/** which of its weekday in the month a date is: 1 to 4, or -1 for the last */
export const nth = (d: Date): number => { const n = Math.ceil(d.getDate() / 7); return n >= 5 ? -1 : n; };
const ord = (n: number): string => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
const base = (freq: Freq, d: Date, more: Partial<Repeat> = {}): Repeat => ({ freq, every: 1, days: [dow(d)], monthBy: 'date', end: 'never', ...more });

/** The ready-made choices for an event on this date, as Google Calendar offers them. */
export const presets = (d: Date): Repeat[] => [
  base('DAILY', d),
  base('WEEKLY', d),
  base('WEEKLY', d, { every: 2 }),
  base('MONTHLY', d),
  base('MONTHLY', d, { monthBy: 'weekday' }),
  base('YEARLY', d),
  base('WEEKLY', d, { days: [0, 1, 2, 3, 4] }),
];

/** "Every week on Fri", "Every 2 weeks on Mon and Wed, 10 times", "Every month on the second Friday, until 3 Dec". */
export const repeatWords = (r: Repeat | null, d: Date): string => {
  if (!r) return 'Does not repeat';
  const n = Math.max(1, r.every), days = [...new Set(r.days)].sort((a, b) => a - b);
  let s = n === 1 ? `Every ${UNIT[r.freq]}` : n === 2 && r.freq === 'WEEKLY' ? 'Every fortnight' : `Every ${n} ${UNIT[r.freq]}s`;
  if (r.freq === 'WEEKLY') s = days.join() === '0,1,2,3,4' && n === 1 ? 'Every weekday (Mon to Fri)' : days.length === 7 && n === 1 ? 'Every day' : `${s} on ${days.map((x) => SHORT[x]).join(', ').replace(/, ([^,]*)$/, ' and $1')}`;
  else if (r.freq === 'MONTHLY') s += r.monthBy === 'weekday' ? ` on the ${NTH[nth(d) === -1 ? 4 : nth(d) - 1]} ${LONG[dow(d)]}` : ` on the ${ord(d.getDate())}`;
  else if (r.freq === 'YEARLY') s += ` on ${d.getDate()} ${MONTH[d.getMonth()]}`;
  if (r.end === 'after' && r.count) s += `, ${r.count} times`;
  if (r.end === 'on' && r.until) { const u = new Date(`${r.until}T00:00:00`); s += `, until ${u.getDate()} ${MONTH[u.getMonth()].slice(0, 3)}${u.getFullYear() === d.getFullYear() ? '' : ` ${u.getFullYear()}`}`; }
  return s;
};

/** The calendar rule. `allDay` decides how the last day is written: a date for all-day events, the end of that day (in UTC) for timed ones. */
export const toRRule = (r: Repeat, d: Date, allDay: boolean): string => {
  const p = [`FREQ=${r.freq}`];
  if (r.every > 1) p.push(`INTERVAL=${Math.floor(r.every)}`);
  if (r.freq === 'WEEKLY') { const days = [...new Set(r.days.length ? r.days : [dow(d)])].sort((a, b) => a - b); p.push(`BYDAY=${days.map((x) => CODE[x]).join(',')}`); }
  if (r.freq === 'MONTHLY' && r.monthBy === 'weekday') p.push(`BYDAY=${nth(d)}${CODE[dow(d)]}`);
  if (r.end === 'after' && r.count) p.push(`COUNT=${Math.max(1, Math.floor(r.count))}`);
  if (r.end === 'on' && r.until) {
    const z = (x: number, w = 2): string => String(x).padStart(w, '0');
    if (allDay) p.push(`UNTIL=${r.until.replace(/-/g, '')}`);
    else { const u = new Date(`${r.until}T23:59:59`); p.push(`UNTIL=${z(u.getUTCFullYear(), 4)}${z(u.getUTCMonth() + 1)}${z(u.getUTCDate())}T${z(u.getUTCHours())}${z(u.getUTCMinutes())}${z(u.getUTCSeconds())}Z`); }
  }
  return p.join(';');
};

/** Read a rule back into the sheet's choices. Rules this sheet cannot show (by month day lists, by set position, hourly…) give null: the caller keeps the rule as it is. */
export const fromRRule = (rule: string | undefined, d: Date): Repeat | null => {
  if (!rule) return null;
  const kv: Record<string, string> = {};
  for (const part of rule.replace(/^RRULE:/i, '').split(';')) { const [k, v] = part.split('='); if (k && v !== undefined) kv[k.toUpperCase()] = v; }
  const freq = kv.FREQ as Freq;
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) return null;
  for (const k of Object.keys(kv)) if (!['FREQ', 'INTERVAL', 'BYDAY', 'COUNT', 'UNTIL', 'WKST', 'BYMONTHDAY', 'BYMONTH'].includes(k)) return null;
  const r = base(freq, d, { every: Math.max(1, Number(kv.INTERVAL ?? 1) || 1) });
  if (kv.BYDAY) {
    const parts = kv.BYDAY.split(',');
    if (freq === 'WEEKLY') { const days = parts.map((x) => CODE.indexOf(x)); if (days.some((x) => x < 0)) return null; r.days = days; }
    else if (freq === 'MONTHLY' && parts.length === 1 && /^-?\d[A-Z]{2}$/.test(parts[0])) r.monthBy = 'weekday';
    else return null;
  }
  if (kv.BYMONTHDAY && (freq !== 'MONTHLY' && freq !== 'YEARLY' || kv.BYMONTHDAY.includes(','))) return null;
  if (kv.BYMONTH && (freq !== 'YEARLY' || kv.BYMONTH.includes(','))) return null;
  if (kv.COUNT) { r.end = 'after'; r.count = Number(kv.COUNT) || 1; }
  else if (kv.UNTIL) {
    const m = /^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d)(\d\d)(Z?))?$/.exec(kv.UNTIL); if (!m) return null;
    const u = m[4] && m[7] ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) : new Date(+m[1], +m[2] - 1, +m[3]);
    r.end = 'on'; r.until = `${u.getFullYear()}-${String(u.getMonth() + 1).padStart(2, '0')}-${String(u.getDate()).padStart(2, '0')}`;
  }
  return r;
};

export const sameRepeat = (a: Repeat | null, b: Repeat | null, d: Date): boolean => (!a && !b) || (!!a && !!b && toRRule(a, d, true) === toRRule(b, d, true));
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const DAY_NAMES = LONG;
