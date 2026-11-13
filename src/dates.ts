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
  d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?([ap])\.?m\.?/i, '\u00a0$1m').toLowerCase(); // a no-break space: a time never wraps as "11:00 / am"
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

/**
 * How an event reads on one particular day, and where it sorts that day. A timed event names its start only on the day it starts:
 * on its last day it reads "until 6:00 am", on a day in the middle "continues". An all-day event over several days counts them ("Day 2 of 3").
 */
export const whenOn = (ev: { start: Date; end: Date; allDay: boolean }, d: Date): { label: string; sort: number } => {
  const s = startOfDay(d).getTime(), e = addDays(d, 1).getTime();
  if (ev.allDay) {
    const n = Math.max(1, Math.round((ev.end.getTime() - ev.start.getTime()) / DAY));
    return { label: n > 1 ? `Day ${Math.min(n, Math.max(1, Math.round((s - startOfDay(ev.start).getTime()) / DAY) + 1))} of ${n}` : 'All day', sort: -2 };
  }
  if (ev.start.getTime() >= s) return { label: fmtTime(ev.start), sort: ev.start.getTime() - s };
  if (ev.end.getTime() < e) return { label: `until ${fmtTime(ev.end)}`, sort: 0 };
  return ev.end.getTime() === e ? { label: 'until midnight', sort: 0 } : { label: 'continues', sort: -1 };
};
/** The whole span of an event in words: "5:00 pm to 6:00 pm", "All day", "Tue, 10 Nov 10:00 pm to Wed, 11 Nov 6:00 am", "All day, Wed, 11 Nov to Fri, 13 Nov". */
export const fmtSpan = (ev: { start: Date; end: Date; allDay: boolean }): string => {
  if (ev.allDay) { const last = addDays(ev.end, -1); return last.getTime() > startOfDay(ev.start).getTime() ? `All day, ${fmtShortDate(ev.start)} to ${fmtShortDate(last)}` : 'All day'; }
  return sameDay(ev.start, ev.end) || ev.end.getTime() === addDays(ev.start, 1).getTime() ? `${fmtTime(ev.start)} to ${fmtTime(ev.end)}` : `${fmtShortDate(ev.start)} ${fmtTime(ev.start)} to ${fmtShortDate(ev.end)} ${fmtTime(ev.end)}`;
};
