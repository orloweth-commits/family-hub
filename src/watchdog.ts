/* ------------------------------------------------------------------ *
 * A stuck or strange screen heals itself (R1.3).
 *
 * A watchdog that lives beside the card (one per page, kept across the card being made afresh). It watches four things:
 *  - drawing: the card has not finished drawing for 3 minutes although it was asked to (stalled);
 *  - errors: the same error from the card's own code, again and again (errors);
 *  - memory: the page's memory has stayed far above where it settled for half an hour (memory);
 *  - the link: Home Assistant has been silent to this screen for 5 minutes, yet a new link to it is answered at once (socket).
 * When one of them holds, it reloads the page once, quietly, at a moment nobody is using the screen, and the reloaded page
 * writes one dated line to the health log in Home Assistant. Every night between 3 and 4 am, with the screensaver up, it
 * reloads once as a fresh start (nightly).
 *
 * A new build takes itself (R1.4). A deploy points the dashboard's resource at a new file (`/local/family-hub/<commit>/family-hub.js`),
 * and a page keeps the build it loaded until it reloads. So every 5 minutes, while Home Assistant answers, the watchdog reads the
 * dashboard's resources; when the one for this card names another file than the one this page was loaded from (a new build, or a
 * rollback), it reloads by the same rules as the rest (build): at a quiet moment, the new file answering first, not within 10 minutes of
 * the last reload. A new build is not a fault: it is left out of the doubling and the six-a-day cap, as the nightly one is. If a page
 * reloaded for a file still comes back on the old one, it tries once more, then stops and writes "held back" for a person.
 *
 * A false reload of a healthy screen is the failure designed against, so it only ever reloads when:
 *  - the page is shown (a hidden page is left alone: Home Assistant drops its own link on a hidden page on purpose);
 *  - nobody has touched the screen for 3 minutes and nothing is running that must not be cut off (a timer, a count-down,
 *    typing, a call, an open sheet or the PIN pad: the same things that hold back the screensaver);
 *  - Home Assistant is answering (`houseUp()`), and has been for a minute; except for "socket", where a fresh link of its
 *    own must be answered instead: either way the page will come back after the reload;
 *  - the card's own file answers from where it was loaded;
 *  - it has not reloaded in the last 10 minutes (longer each time the same fault comes back within the hour, and at most
 *    6 times a day; past that it stops and writes "held back" to the health log for a person to look at).
 * Time that jumps (a computer waking from sleep) starts every count again.
 * ------------------------------------------------------------------ */

import { houseUp, onHouse } from './house';
import type { Hass } from './types';

export type Why = 'stalled' | 'errors' | 'memory' | 'socket' | 'nightly' | 'build';
/** What the card tells the watchdog about the moment (it is asked; it never pushes). */
export interface WatchHost {
  /** nobody is touching the screen and nothing is running that a reload would cut off (a timer, typing, a call, a sheet) */
  quiet(): boolean;
  /** the screensaver is up (and whether at its night level, so the reloaded page can bring it straight back) */
  art(): { on: boolean; night: boolean; manual?: boolean };
  /** the card's Home Assistant */
  hass(): Hass | undefined;
  /** the to-do list for the health log, if any */
  log(): string | undefined;
  /** this screen's four-letter name */
  screen(): string;
  /** ask the card to draw (a healthy card does so within moments) */
  poke(): void;
}

export const STALL_MS = 3 * 60_000, POKE_MS = 45_000, QUIET_MS = 3 * 60_000, SOCKET_MS = 5 * 60_000, UP_MS = 60_000;
export const GAP_MS = 10 * 60_000, MAX_GAP_MS = 6 * 3_600_000, DAY_MAX = 6;
export const ERR_WINDOW = 5 * 60_000, ERR_SAME = 10, ERR_ANY = 30;
export const MEM_WINDOW = 30 * 60_000;
export const BUILD_MS = 5 * 60_000, BUILD_TRIES = 2;
const CYCLE_MS = 15_000, JUMP_MS = 50_000;
const RELOADS = 'fh-reloads', PENDING = 'fh-reload', RESUME = 'fh-resume', NIGHT = 'fh-reload-night', BUILD = 'fh-build';

/** Where the card itself was loaded from: errors are counted only from this file, and it must answer before a reload. */
const SELF = ((): string => { try { return new URL(import.meta.url).pathname; } catch { return 'family-hub.js'; } })();
/** The whole address this page loaded the card from, to compare with the dashboard's resource (R1.4). */
const SELF_HREF = ((): string => { try { return new URL(import.meta.url).href; } catch { return ''; } })();
const isCard = (u: URL): boolean => u.pathname.split('/').pop() === 'family-hub.js';
/** A short name for a build's file in the health log: its commit's first seven, or its path. */
const buildName = (href: string): string => { const m = /[0-9a-f]{40}/.exec(href); if (m) return m[0].slice(0, 7); try { return new URL(href).pathname; } catch { return href.slice(0, 60); } };

const lsGet = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) as T; } catch { return d; } };
const lsSet = (k: string, v: unknown): void => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };
const two = (n: number): string => String(n).padStart(2, '0');
const ymdOf = (d: Date): string => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
const visible = (): boolean => typeof document === 'undefined' || document.visibilityState !== 'hidden';

/** The words for each reason, in the health log and on the health sheet (R1.5). */
export const WHY_SAY: Record<Why, string> = {
  nightly: 'the nightly fresh start',
  stalled: 'the screen had stopped drawing',
  errors: 'the same error kept coming back',
  memory: 'its memory had kept climbing',
  socket: 'Home Assistant was answering but this screen’s link to it would not come back',
  build: 'a new build was ready',
};

type Rec = { at: number; why: Why; logged?: boolean; note?: string };
/** The reloads this screen has made, newest last (the last 20). */
export const reloads = (): Rec[] => lsGet<Rec[]>(RELOADS, []).filter((r) => r && typeof r.at === 'number');
/** This screen's last reload and why, or null (for the health sheet, R1.5). */
export const lastReload = (): Rec | null => reloads().slice(-1)[0] ?? null;

/** How long to wait after the last reload before another for `why`: 10 minutes; doubled for each further time the same fault
 *  brought a reload within three hours of the one after it (10, 20, 40 minutes … at most 6 hours). The nightly and build ones do not count. */
export function gapFor(why: Why, hist: Rec[], now: number): number {
  let n = 0, t = now;
  for (let i = hist.length - 1; i >= 0; i--) {
    const r = hist[i];
    if (r.why === 'nightly' || r.why === 'build') continue;
    if (r.why !== why || t - r.at > 3 * 3_600_000) break;
    n++; t = r.at;
  }
  return Math.min(GAP_MS * 2 ** Math.max(0, n - 1), MAX_GAP_MS);
}

export class Watchdog {
  private host: WatchHost | null = null;
  private iv = 0; private lastCycle = 0; private loadedAt = Date.now();
  private drawnAt = Date.now(); private shownAt = Date.now(); private upAt = Date.now(); private downShownAt = 0;
  private errs: { at: number; key: string }[] = [];
  private mem: { at: number; used: number }[] = []; private base = 0;
  private probeAt = 0; private busy = false; private wish: Why | null = null; private heldSaid = '';
  private offHouse: (() => void) | null = null; private touchAt = 0;
  private buildAt = 0; private readAt = 0; private reading = false; private next = '';
  /** for the tests and the health sheet: what the watchdog last thought, and why it did not act; `build` the new build's file, if one is waiting */
  state = { wish: '' as Why | '', wait: '', build: '' };

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', (e) => this.error(e.error ?? e.message, e.filename));
    window.addEventListener('unhandledrejection', (e) => this.error(e.reason, ''));
    document.addEventListener('visibilitychange', () => { if (visible()) this.restart(); });
    // its own count of touches too, so a card too broken to answer can still be judged untouched
    for (const t of ['pointerdown', 'keydown', 'wheel']) window.addEventListener(t, () => { this.touchAt = Date.now(); }, { capture: true, passive: true });
    this.offHouse = onHouse((up) => { if (up) { this.upAt = Date.now(); this.downShownAt = 0; } else this.downShownAt = visible() ? Date.now() : 0; });
  }

  /** The card is on screen. A card made afresh (Home Assistant does after a reconnect) takes over from the last. */
  attach(host: WatchHost): void {
    this.host = host; this.drawnAt = Date.now();
    if (!this.iv) { this.lastCycle = Date.now(); this.iv = window.setInterval(() => this.cycle(), CYCLE_MS); }
    this.writePending();
  }
  detach(host: WatchHost): void { if (this.host === host) this.host = null; }
  /** The card finished drawing. */
  drawn(): void { this.drawnAt = Date.now(); }

  /** Everything counted starts again (the page has just been shown again, or time jumped). */
  private restart(): void {
    const n = Date.now();
    this.drawnAt = n; this.shownAt = n; this.lastCycle = n; this.errs = []; this.mem = this.mem.filter((m) => n - m.at < 60_000);
    if (!houseUp()) this.downShownAt = n;
  }

  private error(err: unknown, file: string): void {
    if (!houseUp() || Date.now() - this.upAt < UP_MS) return; // calls fail while Home Assistant is away: that is R1.2's to say
    const e = err as { message?: string; stack?: string } | string | null;
    const msg = typeof e === 'string' ? e : String(e?.message ?? ''), stack = typeof e === 'string' ? '' : String(e?.stack ?? '');
    if (!(file && file.includes(SELF)) && !stack.includes(SELF)) return; // only the card's own code: another card's or the frontend's errors are not ours to heal
    if (/ResizeObserver loop/i.test(msg)) return;
    const n = Date.now();
    this.errs.push({ at: n, key: msg.replace(/\d+/g, '#').slice(0, 120) });
    if (this.errs.length > 400) this.errs.splice(0, this.errs.length - 400);
  }

  /** What is wrong, if anything (the first that holds). */
  private fault(now: number): { why: Why; note?: string } | null {
    const h = this.host;
    if (!h) return null;
    // Home Assistant silent to this screen for a long while, shown all the while (first: a reload is then the cure for whatever else is wrong, if a new link is answered)
    if (!houseUp() && this.downShownAt && visible() && now - this.downShownAt > SOCKET_MS) return { why: 'socket' };
    // the screen has stopped drawing
    if (visible() && now - Math.max(this.drawnAt, this.shownAt) > STALL_MS) return { why: 'stalled' };
    // the same error again and again (and still coming)
    this.errs = this.errs.filter((x) => now - x.at < ERR_WINDOW);
    if (this.errs.length && now - this.errs[this.errs.length - 1].at < 60_000) {
      const by = new Map<string, number>(); for (const x of this.errs) by.set(x.key, (by.get(x.key) ?? 0) + 1);
      const [key, n] = [...by].sort((a, b) => b[1] - a[1])[0];
      if (n >= ERR_SAME || this.errs.length >= ERR_ANY) return { why: 'errors', note: `${n}× ${key.slice(0, 60)}` };
    }
    // memory far above where it settled, for half an hour without a dip
    if (this.base > 0) {
      const w = this.mem.filter((m) => now - m.at <= MEM_WINDOW);
      const lim = (performance as Performance & { memory?: { jsHeapSizeLimit?: number } }).memory?.jsHeapSizeLimit ?? 4e9;
      const ceil = Math.min(Math.max(this.base * 4, this.base + 400e6), lim * 0.7);
      if (w.length >= 25 && now - w[0].at >= MEM_WINDOW - 90_000 && Math.min(...w.map((m) => m.used)) > ceil) return { why: 'memory', note: `${Math.round(Math.min(...w.map((m) => m.used)) / 1e6)} MB, settled at ${Math.round(this.base / 1e6)} MB` };
    }
    return null;
  }

  private sampleMemory(now: number): void {
    const m = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory;
    const used = Number(m?.usedJSHeapSize);
    if (!Number.isFinite(used) || used <= 0) return;
    if (this.mem.length && now - this.mem[this.mem.length - 1].at < 55_000) return;
    this.mem.push({ at: now, used }); if (this.mem.length > 60) this.mem.shift();
    // where the page settled: the lowest reading between 2 and 30 minutes after it loaded
    const age = now - this.loadedAt;
    if (age >= 2 * 60_000 && age <= 30 * 60_000) this.base = this.base ? Math.min(this.base, used) : used;
  }

  /** Every 15 seconds. */
  private cycle(): void {
    const now = Date.now();
    if (now - this.lastCycle > JUMP_MS) { this.restart(); return; } // time jumped (asleep, or the page frozen): nothing counted across it
    this.lastCycle = now;
    if (!visible()) { this.state = { ...this.state, wish: '', wait: 'hidden' }; return; }
    if (!this.downShownAt && !houseUp()) this.downShownAt = now;
    this.sampleMemory(now);
    const h = this.host;
    if (!h) return;
    if (now - this.drawnAt > POKE_MS) { try { h.poke(); } catch { /* counted as not drawing */ } }
    this.writePending();
    if (houseUp() && now - this.upAt >= UP_MS && now - this.buildAt >= BUILD_MS && !this.busy) { this.buildAt = now; void this.readBuild(); }
    const f = this.fault(now);
    const night = this.nightDue(now);
    const want: { why: Why; note?: string } | null = f ?? (this.next ? { why: 'build', note: `to ${buildName(this.next)}` } : night ? { why: 'nightly' } : null);
    this.wish = want?.why ?? null; this.state.wish = this.wish ?? '';
    if (!want) { this.state.wait = ''; return; }
    void this.tryReload(want.why, want.note, now);
  }

  private nightDue(now: number): boolean {
    const d = new Date(now), h = this.host;
    if (!h || d.getHours() !== 3) return false;
    const day = ymdOf(d);
    if (lsGet<string>(NIGHT, '') === day) return false;
    if (now - this.loadedAt < 3_600_000) { lsSet(NIGHT, day); return false; } // loaded within the hour: fresh enough tonight
    try { return h.art().on; } catch { return false; }
  }

  private async tryReload(why: Why, note: string | undefined, now: number): Promise<void> {
    const h = this.host;
    if (!h || this.busy) return;
    const wait = (w: string): void => { this.state.wait = w; };
    const quiet = (): boolean => { if (Date.now() - this.touchAt < QUIET_MS) return false; try { return h.quiet(); } catch { return true; } };
    if (!quiet()) return wait('in use');
    if (why !== 'socket' && (!houseUp() || now - this.upAt < UP_MS)) return wait('house');
    const hist = reloads(), last = hist[hist.length - 1];
    const free = why === 'nightly' || why === 'build'; // not faults: outside the doubling and the cap
    const today = hist.filter((r) => r.why !== 'nightly' && r.why !== 'build' && now - r.at < 24 * 3_600_000).length;
    if (!free && today >= DAY_MAX) { this.held(why, note); return wait('held back'); }
    const tried = lsGet<{ url: string; n: number }>(BUILD, { url: '', n: 0 });
    if (why === 'build' && tried.url === this.next && tried.n >= BUILD_TRIES) { this.held(why, note, `${WHY_SAY.build} (${buildName(this.next)}), but this screen came back on the old one ${tried.n} times`); return wait('held back'); }
    if (last && now - last.at < (free ? GAP_MS : gapFor(why, hist, now))) return wait('too soon');
    this.busy = true;
    try {
      // the page must come back: the card's own file answers, and (for a lost link) a fresh link of our own is answered
      if (why === 'socket') {
        if (now - this.probeAt < 2 * 60_000) return wait('probe');
        this.probeAt = now;
        if (!(await this.probe(h.hass()))) return wait('not answering');
      }
      if (why === 'build') {
        // read the dashboard again (a rollback may have come in between), and the new file must answer, not the old one
        const target = Date.now() - this.readAt < 60_000 ? this.next : await this.readBuild();
        if (!target) return wait('changed');
        if (!(await this.answers(target))) return wait('file');
      } else if (!(await this.answers(import.meta.url))) return wait('file');
      if (!quiet() || this.wish !== why) return wait('changed');
      if (why === 'build') lsSet(BUILD, { url: this.next, n: tried.url === this.next ? tried.n + 1 : 1 });
      this.reload(why, note, h);
    } finally { this.busy = false; }
  }

  /** A new websocket of our own to Home Assistant is greeted ("auth_required"): its side of the link is working, so only this page's link is stuck. */
  private probe(hass: Hass | undefined): Promise<boolean> {
    return new Promise((yes) => {
      let url = '';
      try { url = (hass?.hassUrl ? hass.hassUrl('/api/websocket') : `${location.origin}/api/websocket`).replace(/^http/, 'ws'); } catch { yes(false); return; }
      let ws: WebSocket | null = null, done = false;
      const end = (v: boolean): void => { if (done) return; done = true; clearTimeout(t); try { ws?.close(); } catch { /* gone */ } yes(v); };
      const t = window.setTimeout(() => end(false), 6000);
      try { ws = new WebSocket(url); } catch { end(false); return; }
      ws.onmessage = (m) => { try { end((JSON.parse(String(m.data)) as { type?: string }).type === 'auth_required'); } catch { end(false); } };
      ws.onerror = () => end(false); ws.onclose = () => end(false);
    });
  }
  /** The card's file at `url` answers (a HEAD request: `/local/` files answer it truly). */
  private async answers(url: string): Promise<boolean> {
    const stop = new AbortController(), t = window.setTimeout(() => stop.abort(), 6000);
    try { const r = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: stop.signal }); return r.ok; } catch { return false; } finally { clearTimeout(t); }
  }

  /** The dashboard's resource for this card, if it names another file than the one this page was loaded from (R1.4). Read from Home
   *  Assistant (`lovelace/resources`); nothing is changed when the read fails, when the page's own file is still among them, or when
   *  more than one other file would do (a person is in the middle of something: never guess). */
  private async readBuild(): Promise<string> {
    const hass = this.host?.hass();
    if (!hass || !SELF_HREF || this.reading) return this.next;
    this.reading = true; this.readAt = Date.now();
    try {
      let t = 0;
      const list = await Promise.race([
        hass.callWS<{ url?: string; type?: string }[]>({ type: 'lovelace/resources' }),
        new Promise<never>((_, no) => { t = window.setTimeout(() => no(new Error('slow')), 10_000); }),
      ]).finally(() => clearTimeout(t));
      if (!Array.isArray(list)) return this.next;
      const ours = list.flatMap((r) => { try { const u = new URL(String(r?.url ?? ''), location.href); return r?.type !== 'css' && isCard(u) ? [u.href] : []; } catch { return []; } });
      this.next = ours.includes(SELF_HREF) || new Set(ours).size !== 1 ? '' : ours[0];
    } catch { /* Home Assistant slow or refusing: keep what was known */ } finally { this.reading = false; this.state.build = this.next; }
    return this.next;
  }

  private reload(why: Why, note: string | undefined, h: WatchHost): void {
    const now = Date.now(), d = new Date(now);
    const hist = [...reloads(), { at: now, why, logged: false, ...(note ? { note } : {}) }].slice(-20);
    lsSet(RELOADS, hist); lsSet(PENDING, 1);
    if (why === 'nightly') lsSet(NIGHT, ymdOf(d));
    // the screensaver comes straight back after the reload (a night reload must not light the kitchen for three minutes)
    try { let a = { on: false, night: false, manual: false }; try { a = { ...a, ...h.art() }; } catch { /* drawn afresh */ } sessionStorage.setItem(RESUME, JSON.stringify({ at: now, ...a })); } catch { /* it comes back by itself after 3 minutes */ }
    const go = (window as Window & { __fhReload?: (why: Why) => void }).__fhReload;
    console.info(`Family Hub: reloading (${why}${note ? `: ${note}` : ''})`);
    if (typeof go === 'function') { go(why); this.restart(); return; } // the preview records it instead
    location.reload();
  }

  /** The cap is reached: say so once in the health log, for a person. */
  private held(why: Why, note?: string, words = `${WHY_SAY[why]}, ${DAY_MAX} times today already`): void {
    const day = ymdOf(new Date()), key = `${day}|${why}|${why === 'build' ? this.next : ''}`;
    if (this.heldSaid === key) return;
    this.heldSaid = key;
    void this.line(`held back a reload: ${words}`, { k: 'held', why, ...(note ? { note } : {}) });
  }

  /** The reloaded page writes the line for the reload that made it, once Home Assistant answers. */
  private writing = false;
  private writePending(): void {
    if (this.writing || !lsGet<number>(PENDING, 0) || !houseUp()) return;
    const hist = reloads(), i = hist.map((r) => !r.logged).lastIndexOf(true);
    if (i < 0) { lsSet(PENDING, 0); return; }
    const r = hist[i], d = new Date(r.at);
    this.writing = true;
    void this.line(`reloaded at ${two(d.getHours())}:${two(d.getMinutes())}: ${WHY_SAY[r.why]}`, { k: 'reload', why: r.why, at: r.at, ...(r.note ? { note: r.note } : {}) }, d).then((ok) => {
      this.writing = false;
      if (!ok) return;
      const now = reloads(); for (const x of now) if (x.at <= r.at) x.logged = true;
      lsSet(RELOADS, now); lsSet(PENDING, 0);
    });
  }
  /** One dated line in the health log: "2026-11-17 ab12 reloaded at 03:00: the nightly fresh start". */
  private async line(words: string, rec: Record<string, unknown>, d = new Date()): Promise<boolean> {
    const h = this.host, hass = h?.hass(), list = h?.log();
    if (!h || !hass || !list || !hass.states[list]) return true; // no health log configured: nothing to write
    try {
      await hass.callService('todo', 'add_item', { item: `${ymdOf(d)} ${h.screen()} ${words}`, description: JSON.stringify({ v: 1, ...rec }) }, { entity_id: list });
      return true;
    } catch (e) { console.warn('Family Hub: health line not written', e); return false; }
  }

  /** Just after a reload this watchdog made: what was up (the screensaver, at night or not), so the page can bring it back at once. */
  static resume(): { art: boolean; night: boolean; manual: boolean } | null {
    try {
      const s = sessionStorage.getItem(RESUME); if (!s) return null;
      sessionStorage.removeItem(RESUME);
      const r = JSON.parse(s) as { at: number; on?: boolean; night?: boolean; manual?: boolean };
      return Date.now() - r.at < 2 * 60_000 ? { art: !!r.on, night: !!r.night, manual: !!r.manual } : null;
    } catch { return null; }
  }
}

/** The one watchdog of this page. */
export const watchdog = new Watchdog();
// to read on a real screen (the console) and in the tests: window.__fhWatchdog.state
if (typeof window !== 'undefined') (window as Window & { __fhWatchdog?: Watchdog }).__fhWatchdog = watchdog;
