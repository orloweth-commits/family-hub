import type { Hass } from './types';

/* ------------------------------------------------------------------ *
 * The dinner line (F5): "what's for dinner?" is the question a family
 * asks most, and it used to live as an ordinary event. One line a day,
 * dinner only: no recipes, no pantry, no stock.
 *
 *   where it is kept    one line a day on the asks list (approve.ts), `dinner {…}`; nothing Home Assistant runs reads it
 *   where it shows      the planner's Reminders card ("Dinner: …") and the morning board
 *   feeding groceries   when a dinner is set, a parent can name what to buy for it; each goes on the shopping list
 * ------------------------------------------------------------------ */
export const DINNER_PREFIX = 'dinner ';
export const DINNER_MAX = 60;
export interface Dinner { d: string; text: string; uid?: string }
export const ymdOf = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dinnerClean = (t: string): string => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, DINNER_MAX);
export const dinnerParse = (description: string | null | undefined): Dinner | null => {
  const m = /^dinner (\{.*\})\s*$/s.exec(String(description ?? ''));
  if (!m) return null;
  try { const x = JSON.parse(m[1]) as { v?: number; d?: string; text?: string }; return x && x.v === 1 && /^\d{4}-\d{2}-\d{2}$/.test(String(x.d)) && dinnerClean(String(x.text ?? '')) ? { d: String(x.d), text: dinnerClean(String(x.text)) } : null; } catch { return null; }
};
export const dinnersReady = (hass: Hass | undefined, list: string | undefined): boolean => !!list && !!hass?.states[list];
/** Every dinner on the list, by day. Lines for days before yesterday are taken off as they are met. */
export const loadDinners = async (hass: Hass, list: string, today = new Date()): Promise<Record<string, Dinner>> => {
  const res = await hass.callWS<{ items: { uid?: string; description?: string | null }[] }>({ type: 'todo/item/list', entity_id: list });
  const out: Record<string, Dinner> = {}, old = ymdOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
  for (const i of res.items) {
    const d = dinnerParse(i.description); if (!d) continue;
    if (d.d < old || out[d.d]) { if (i.uid) hass.callService('todo', 'remove_item', { item: i.uid }, { entity_id: list }).catch(() => undefined); continue; }
    out[d.d] = { ...d, uid: i.uid };
  }
  return out;
};
/** Sets, changes or (with no words) clears one day's dinner. */
export const setDinner = async (hass: Hass, list: string, day: string, text: string, was?: Dinner): Promise<void> => {
  const t = dinnerClean(text);
  if (was?.uid) await hass.callService('todo', 'remove_item', { item: was.uid }, { entity_id: list });
  if (t) await hass.callService('todo', 'add_item', { item: `Dinner ${day}: ${t}`, description: DINNER_PREFIX + JSON.stringify({ v: 1, d: day, text: t }) }, { entity_id: list });
};
/** "mince, tortillas and cheese" as things to buy. */
export const toBuy = (text: string): string[] => [...new Set(String(text ?? '').split(/\s*(?:,|;|\band\b)\s*/i).map((s) => s.trim()).filter((s) => s.length > 1).map((s) => s.charAt(0).toUpperCase() + s.slice(1)))].slice(0, 12);
