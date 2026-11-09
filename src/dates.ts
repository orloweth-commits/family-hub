export const DAY = 86_400_000;

export const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Monday-start week, as Australians read a planner. */
export const startOfWeek = (d: Date): Date => {
  const s = startOfDay(d);
  const dow = (s.getDay() + 6) % 7;
  return addDays(s, -dow);
};
export const startOfMonthGrid = (d: Date): Date => startOfWeek(new Date(d.getFullYear(), d.getMonth(), 1));

const loc = 'en-AU';
export const fmtTime = (d: Date): string =>
  d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?([ap])\.?m\.?/i, ' $1m').toLowerCase();
export const fmtClock = (d: Date): { hm: string; ampm: string } => {
  const h = d.getHours();
  return { hm: `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`, ampm: h < 12 ? 'am' : 'pm' };
};
export const fmtLongDate = (d: Date): string => d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtShortDate = (d: Date): string => d.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtDow = (d: Date): string => d.toLocaleDateString(loc, { weekday: 'short' });
export const fmtMonthYear = (d: Date): string => d.toLocaleDateString(loc, { month: 'long', year: 'numeric' });
export const fmtRange = (a: Date, b: Date): string =>
  a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} ${b.toLocaleDateString(loc, { month: 'long' })}`
    : `${a.getDate()} ${a.toLocaleDateString(loc, { month: 'short' })} – ${b.getDate()} ${b.toLocaleDateString(loc, { month: 'short' })}`;

export const greeting = (d: Date): string => {
  const h = d.getHours();
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/** True when `now` falls in a window like 21:00–06:00 (wraps midnight). */
export const inWindow = (now: Date, start: string, end: string): boolean => {
  const m = now.getHours() * 60 + now.getMinutes();
  const p = (s: string) => { const [h, mm] = s.split(':').map(Number); return h * 60 + (mm || 0); };
  const a = p(start), b = p(end);
  return a <= b ? m >= a && m < b : m >= a || m < b;
};
