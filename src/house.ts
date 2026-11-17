/* ------------------------------------------------------------------ *
 * When Home Assistant cannot be reached (R1.2).
 *
 * The panel keeps showing what it last had (the calendar, the jobs, the shopping list, the weather), kept in this
 * browser, with one plain line saying when that was. A tap that would change something says it cannot yet; nothing
 * pretends to have changed. When Home Assistant answers again everything is read afresh by itself: no reload.
 *
 * Three things live here:
 *  - whether the house is answering (`houseUp`), set by the card from `hass.connected` and its own ping;
 *  - what was last read (`keep`, `kept`), in memory and in localStorage, each with the time it was read;
 *  - `followList`, a to-do list followed live that shows the kept copy while Home Assistant is away and follows
 *    afresh when it is back (a subscription the websocket library re-made after a restart can die quietly if the
 *    list was not there yet; so every follower subscribes again itself).
 * ------------------------------------------------------------------ */

type Kept<T> = { v: T; at: number };
const PREFIX = 'fh-kept-';
const mem = new Map<string, Kept<unknown>>();

/** Keep `v` as the last good copy of `key`, read now. */
export function keep<T>(key: string, v: T): void {
  const k = { v, at: Date.now() };
  mem.set(key, k);
  try { localStorage.setItem(PREFIX + key, JSON.stringify(k)); } catch { /* storage full or private: memory still has it */ }
}
/** A copy followed live until now is as good as one read now (`at`): said when the house goes away. */
function touch(key: string, at: number): void {
  const k = kept<unknown>(key); if (!k || k.at >= at) return;
  const n = { v: k.v, at }; mem.set(key, n);
  try { localStorage.setItem(PREFIX + key, JSON.stringify(n)); } catch { /* memory has it */ }
}
/** The last good copy of `key` and when it was read, or null. */
export function kept<T>(key: string): Kept<T> | null {
  const m = mem.get(key) as Kept<T> | undefined;
  if (m) return m;
  try { const s = localStorage.getItem(PREFIX + key); if (!s) return null; const k = JSON.parse(s) as Kept<T>; if (!k || typeof k.at !== 'number') return null; mem.set(key, k); return k; } catch { return null; }
}

/* ---------------- whether the house is answering ---------------- */

let up = true, downAt = 0, lastHeard = Date.now(), oldest = Infinity;
const subs = new Set<(up: boolean) => void>();
export const houseUp = (): boolean => up;
/** When the house last answered (the time the kept copies are "as at"). */
export const heardAt = (): number => lastHeard;
/** A kept copy read at `at` is on screen while the house is away: the line's "as at" is never later than the oldest. */
export const noteKept = (at: number): void => { if (!up) oldest = Math.min(oldest, at); };
/** The time the page's contents are "as at" while the house is away. */
export const asAt = (): number => Math.min(lastHeard, oldest);
/** How long the house has been silent, in ms (0 while it answers). */
export const downFor = (now = Date.now()): number => (up ? 0 : now - downAt);
export function setHouse(isUp: boolean): void {
  if (isUp) lastHeard = Date.now();
  if (isUp === up) return;
  up = isUp;
  if (!up) downAt = Date.now(); else oldest = Infinity;
  for (const f of [...subs]) { try { f(up); } catch (e) { console.warn('Family Hub: house listener', e); } }
}
/** Told each time the house goes away or comes back. Returns the way to stop listening. */
export function onHouse(f: (up: boolean) => void): () => void { subs.add(f); return () => { subs.delete(f); }; }

/** The words for a change that could not be made because the house is not answering. */
export const DOWN_SAY = 'Home Assistant isn’t answering, so that didn’t change. Try again once it’s back.';
/** The one line across the page while the house is away (`at`: when it last answered). */
export const downLine = (at: string): string => `Home Assistant isn’t answering. Showing things as at ${at}.`;
/** What a tap on that line says. */
export const DOWN_MORE = 'Nothing can be changed until Home Assistant answers again. It reconnects by itself: there is no need to reload.';
/** The line shows only once the house has been silent this long (a blip while the link re-forms says nothing). */
export const DOWN_SHOW_MS = 10_000;

/* ---------------- a to-do list followed live, with the kept copy in between ---------------- */

type Conn = { subscribeMessage<T>(cb: (msg: T) => void, msg: Record<string, unknown>): Promise<() => unknown> };
/**
 * Follows `entity`'s items. `cb(items, at)`: `at` is null for a live copy, or the time a kept copy was read.
 * `none()` is called when the list cannot be had and nothing was kept. Returns the way to stop following.
 * The kept copy is shown at once whenever the live one is not there within a moment; the list is followed again
 * each time the house comes back, and tried again on its own every so often while it cannot be had.
 */
export function followList<T>(conn: Conn, entity: string, cb: (items: T[], at: number | null) => void, none?: () => void): () => void {
  const key = `list:${entity}`;
  let live = true, gen = 0, un: (() => unknown) | null = null, wait = 0, retry = 0, backoff = 30_000, gotLive = false;
  // (a slow answer while the house is up shows a kept copy if there is one, but is not yet called a failure)
  const showKept = (failed: boolean): void => { if (!live || gotLive) return; const k = kept<T[]>(key); if (k) { noteKept(k.at); cb(k.v, k.at); } else if (failed || !up) none?.(); };
  const drop = (): void => { const u = un; un = null; if (u) Promise.resolve().then(() => u()).catch(() => undefined); };
  const go = (): void => {
    if (!live) return;
    clearTimeout(retry); clearTimeout(wait);
    const g = ++gen; gotLive = false;
    // the subscription waits for the socket while the house is away: show what was kept in the meantime
    wait = window.setTimeout(() => showKept(false), up ? 4000 : 0);
    conn.subscribeMessage<{ items?: T[] }>((m) => {
      if (!live || g !== gen) return;
      const items = (m?.items ?? []) as T[];
      gotLive = true; clearTimeout(wait); backoff = 30_000;
      keep(key, items); setHouse(true); cb(items, null);
    }, { type: 'todo/item/subscribe', entity_id: entity }).then((u) => {
      if (!live || g !== gen) { Promise.resolve().then(() => u()).catch(() => undefined); return; }
      drop(); un = u;
    }, () => {
      if (!live || g !== gen) return;
      clearTimeout(wait); gotLive = false; showKept(true);
      retry = window.setTimeout(go, backoff); backoff = Math.min(backoff * 2, 5 * 60_000);
    });
  };
  // the house is back: follow afresh, a moment later (the old subscription may not have survived a restart)
  const off = onHouse((isUp) => { if (!live) return; if (isUp) { window.setTimeout(() => { drop(); go(); }, 1500); } else if (gotLive) { touch(key, lastHeard); gotLive = false; } });
  go();
  return () => { live = false; off(); clearTimeout(retry); clearTimeout(wait); drop(); };
}

/* ---------------- a calendar's rows for a stretch of days ---------------- */

type Range = { a: number; b: number; rows: unknown[] };
/** Keep a calendar's rows as read for [a, b) under `slot` (one slot per kind of view, so the store stays small). */
export const keepRange = (entity: string, slot: string, a: Date, b: Date, rows: unknown[]): void => keep<Range>(`cal:${entity}:${slot}`, { a: a.getTime(), b: b.getTime(), rows });
/** The kept rows of a calendar from every slot that overlaps [a, b), each row once, and the oldest time among them; null when none. */
export function keptRange(entity: string, slots: string[], a: Date, b: Date): { rows: unknown[]; at: number } | null {
  const seen = new Set<string>(), rows: unknown[] = []; let at = Infinity;
  for (const s of slots) {
    const k = kept<Range>(`cal:${entity}:${s}`);
    if (!k || k.v.b <= a.getTime() || k.v.a >= b.getTime()) continue;
    at = Math.min(at, k.at);
    for (const r of k.v.rows ?? []) { const x = r as { uid?: string; summary?: string; start?: unknown }; const id = JSON.stringify([x?.uid, x?.summary, x?.start]); if (!seen.has(id)) { seen.add(id); rows.push(r); } }
  }
  return Number.isFinite(at) ? { rows, at } : null;
}
