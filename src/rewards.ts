import { addDays, startOfDay } from './dates';

/* ------------------------------------------------------------------ *
 * A reward with a weekly limit (`weekly: 1`): how often it has been had
 * since Monday. The count comes from the rewards list in Home Assistant
 * (every reward spent is written there with its date), so every screen
 * agrees; this screen's own note covers a list that is missing or that a
 * grown-up has cleared.
 * ------------------------------------------------------------------ */

/** Monday 00:00 of the week `d` is in. */
export const weekStart = (d = new Date()): number => { const s = startOfDay(d); return addDays(s, -((s.getDay() + 6) % 7)).getTime(); };
/** The day a weekly limit starts again. */
export const backDay = (_d = new Date()): string => 'Monday';

interface Note { n: string; t: number }
const key = (slug: string): string => `fh-spent-${slug}`;
const notes = (slug: string): Note[] => { try { const l = JSON.parse(localStorage.getItem(key(slug)) || '[]'); return Array.isArray(l) ? l : []; } catch { return []; } };
/** Remember, on this screen, that a limited reward was spent just now. */
export const noteSpend = (slug: string, name: string, now = Date.now()): void => {
  try { localStorage.setItem(key(slug), JSON.stringify([...notes(slug).filter((x) => x.t >= weekStart(new Date(now))), { n: name, t: now }])); } catch { /* storage unavailable */ }
};
/** The date a rewards-list line was written on: its description starts with it, as "14/11/2026 · 50 pts". */
const lineDate = (description: string): number => { const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(description.trim()); return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime() : NaN; };
/** How many times each reward has been had this week: the larger of what the list says and what this screen noted. */
export const spentThisWeek = (slug: string, lines: { name: string; description: string }[], now = new Date()): Record<string, number> => {
  const from = weekStart(now), a: Record<string, number> = {}, b: Record<string, number> = {};
  for (const l of lines) if (lineDate(l.description) >= from) a[l.name] = (a[l.name] ?? 0) + 1;
  for (const n of notes(slug)) if (n.t >= from) b[n.n] = (b[n.n] ?? 0) + 1;
  const out: Record<string, number> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = Math.max(a[k] ?? 0, b[k] ?? 0);
  return out;
};
