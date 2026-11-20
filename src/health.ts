/* ------------------------------------------------------------------ *
 * The health sheet (R1.5): everything the panel depends on, each with a tick or a plain word, in one place behind the PIN
 * (More, House info, the cog: Settings, Health). "Self-diagnosing", for a parent and for Claude.
 *
 * Two halves:
 *  - `readHealth()`: the few things that must be asked for (whether the internet answers, the newest nightly snapshot, the health
 *    log's lines from every screen, and whether a newer build is waiting). Each read has its own time limit and never throws.
 *  - `healthGroups()`: the rows themselves, from what Home Assistant's states already say, what this screen knows of itself
 *    (R1.2's house, R1.3's watchdog, R1.4's build) and those reads. Pure, so the tests can feed it anything.
 *
 * Nothing here changes anything: it only reads. A row is `ok` (a tick), `warn` (worth a look), `bad` (not working) or `wait`
 * (being checked, or waiting on something else). Colour is never the only cue: every row says what it means in words.
 * ------------------------------------------------------------------ */

import { houseUp, heardAt } from './house';
import { reachable } from './online';
import { agoWords, forWords, isWall, screenId } from './trust';
import { lastReload, loadedFrom, buildShort, watchdog, WAIT_SAY, WHY_SAY, type Why } from './watchdog';
import { houseVoice, voiceCap, voiceInUse, voiceUsed } from './voice';
import { fmtTime, sameDay } from './dates';
import type { FamilyHubConfig, Hass, HassEntity } from './types';

export type Mark = 'ok' | 'warn' | 'bad' | 'wait';
export interface HealthRow { id: string; name: string; mark: Mark; words: string }
export interface HealthGroup { id: string; title: string; rows: HealthRow[] }
export interface LogLine { day: string; screen: string; words: string }
/** What had to be asked for. `undefined`: not answered yet; 'error': could not be read. */
export interface HealthReads { at: number; internet?: boolean; snap?: string | null | 'error'; log?: LogLine[] | 'error'; build?: string | 'error' }
/** What this screen knows of its calendars (the card's own record of when each was last read). */
export interface CalSeen { seen: Record<string, number>; since: number }

/** The two sites asked whether the internet answers: where a new build comes from, and the rain radar's. Either will do. */
export const NET_SITES = ['https://cdn.jsdelivr.net/', 'https://api.rainviewer.com/'];
/** A phone not heard from for this long is worth a look (an iPhone can be quiet for hours and still be fine). */
export const PHONE_QUIET_MS = 48 * 3_600_000;
/** The nightly snapshot runs at 2:15 am; after this time today's should be there. */
export const SNAP_DUE = 2 * 60 + 45;
const DAY_MS = 86_400_000;

const two = (n: number): string => String(n).padStart(2, '0');
const ymdOf = (d: Date): string => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const within = <T>(p: Promise<T>, ms: number): Promise<T> => new Promise<T>((ok, no) => { const t = window.setTimeout(() => no(new Error('slow')), ms); p.then((v) => { clearTimeout(t); ok(v); }, (e) => { clearTimeout(t); no(e); }); });
const stamp = (e: HassEntity | undefined): number => { const t = Date.parse(String(e?.last_updated ?? e?.last_changed ?? '')); return Number.isFinite(t) ? t : 0; };
const nameOf = (h: Hass, id: string): string => String(h.states[id]?.attributes?.friendly_name ?? id.split('.')[1] ?? id);
const gone = (e: HassEntity | undefined): boolean => !e || e.state === 'unavailable';
/** "today", "yesterday", or "Tue 18 Nov" */
export const dayWords = (d: Date, now: Date): string => {
  if (sameDay(d, now)) return 'today';
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (sameDay(d, y)) return 'yesterday';
  return `${d.toLocaleDateString('en-AU', { weekday: 'short' })} ${d.getDate()} ${d.toLocaleDateString('en-AU', { month: 'short' })}`;
};
const dateOf = (ymd: string): Date => { const [y, m, d] = ymd.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
/** A line of the health log: "2026-11-17 ab12 reloaded at 03:00: the nightly fresh start" */
const LINE = /^(\d{4}-\d{2}-\d{2}) ([a-z0-9]{4}) ((?:reloaded|held back).*)$/;
export const parseLogLine = (summary: string): LogLine | null => { const m = LINE.exec(summary.trim()); return m ? { day: m[1], screen: m[2], words: m[3] } : null; };

/* ---------------- what must be asked for ---------------- */

/** The list the health log is written to (as the watchdog writes it): `health.log`, else the use log. */
export const logList = (cfg: FamilyHubConfig): string | undefined => cfg.health?.log ?? cfg.health?.use_log;

/** Asks for everything at once; each part has its own limit and its own failure. */
export async function readHealth(hass: Hass | undefined, cfg: FamilyHubConfig, now = Date.now()): Promise<HealthReads> {
  const out: HealthReads = { at: now };
  const items = async (list: string): Promise<{ summary: string; description?: string | null }[]> =>
    (await within(hass!.callWS<{ items: { summary: string; description?: string | null }[] }>({ type: 'todo/item/list', entity_id: list }), 8000)).items ?? [];
  const jobs: Promise<void>[] = [];
  jobs.push(Promise.all(NET_SITES.map((u) => reachable(u, 6000))).then((r) => { out.internet = r.some(Boolean); }, () => { out.internet = false; }));
  const backup = cfg.health?.backup;
  if (backup) jobs.push((async () => {
    if (!hass || !houseUp()) { out.snap = 'error'; return; }
    try {
      const days = (await items(backup)).filter((i) => /^\d{4}-\d{2}-\d{2}$/.test(i.summary) && String(i.description ?? '').startsWith('snap ')).map((i) => i.summary).sort();
      out.snap = days.length ? days[days.length - 1] : null;
    } catch { out.snap = 'error'; }
  })());
  const log = logList(cfg);
  if (log) jobs.push((async () => {
    if (!hass || !houseUp()) { out.log = 'error'; return; }
    try {
      const from = ymdOf(new Date(now - 6 * DAY_MS));
      out.log = (await items(log)).map((i) => parseLogLine(i.summary)).filter((l): l is LogLine => !!l && l.day >= from).reverse()
        .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0)).slice(0, 8);
    } catch { out.log = 'error'; }
  })());
  jobs.push((async () => {
    if (!houseUp()) { out.build = 'error'; return; }
    try { out.build = await within(watchdog.checkBuild(), 12_000); } catch { out.build = 'error'; }
  })());
  await Promise.all(jobs);
  return out;
}

/* ---------------- the rows ---------------- */

/** Every speaker the panel uses: those in the house map (and its zones), else the configured players; and each child's own.
 *  (With a map, the configured players are often the same speakers under their own integration's names: the map's are the ones played to.) */
export function speakersOf(cfg: FamilyHubConfig): string[] {
  const ids: string[] = [];
  for (const f of cfg.music_map ?? []) for (const r of f.rooms ?? []) { if (r.player) ids.push(r.player); for (const z of r.zones ?? []) if (z.player) ids.push(z.player); }
  if (!ids.length) ids.push(...(cfg.music_players ?? []));
  for (const k of cfg.kids ?? []) if (k.speaker) ids.push(k.speaker);
  return [...new Set(ids.filter((x) => typeof x === 'string' && x.startsWith('media_player.')))];
}

/** Every phone Home Assistant sends to for the panel, and what for. */
export function phonesOf(cfg: FamilyHubConfig): { service: string; uses: string[] }[] {
  const m = new Map<string, string[]>();
  const add = (list: string[] | undefined, what: string): void => { for (const s of list ?? []) if (typeof s === 'string' && s.startsWith('notify.')) { const u = m.get(s) ?? []; if (!u.includes(what)) u.push(what); m.set(s, u); } };
  add(cfg.digest?.notify, 'the evening digest');
  add(cfg.approve?.notify, 'approvals');
  add(cfg.emergency?.notify, 'the emergency alert');
  return [...m].map(([service, uses]) => ({ service, uses }));
}
const listWords = (a: string[]): string => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

/** When Home Assistant last heard from a phone's app: the newest of its device's entities (or, failing that, those named after it). */
export function phoneHeard(hass: Hass, service: string): { name: string; at: number } {
  const id = service.replace(/^notify\./, '').replace(/^mobile_app_/, '');
  const dev = Object.values(hass.devices ?? {}).find((d) => slug(String(d.name_by_user ?? d.name ?? '')) === id || slug(String(d.name ?? '')) === id);
  let at = 0;
  const ids = dev ? Object.values(hass.entities ?? {}).filter((e) => e.device_id === dev.id).map((e) => e.entity_id) : [];
  if (!ids.length) ids.push(...Object.keys(hass.states).filter((e) => e === `device_tracker.${id}` || e.startsWith(`sensor.${id}_`)));
  for (const e of ids) { const s = hass.states[e]; if (!gone(s)) at = Math.max(at, stamp(s)); }
  const tracker = hass.states[`device_tracker.${id}`];
  return { name: String(dev?.name_by_user ?? dev?.name ?? tracker?.attributes?.friendly_name ?? id), at };
}

export interface HealthInput {
  hass: Hass | undefined; cfg: FamilyHubConfig; reads: HealthReads | null; cals: CalSeen; version: string; now?: number;
  /** what this screen knows of itself; the tests pass their own */
  self?: { up?: boolean; heard?: number; screen?: string; wall?: boolean; loadedAt?: number; memory?: number; from?: ReturnType<typeof loadedFrom>;
    last?: { at: number; why: Why; note?: string } | null; wish?: string; wait?: string };
}

export function healthGroups(i: HealthInput): HealthGroup[] {
  const { hass, cfg, reads, cals, version } = i, now = i.now ?? Date.now(), today = new Date(now);
  const me = {
    up: houseUp(), heard: heardAt(), screen: screenId(), wall: isWall(),
    loadedAt: typeof performance !== 'undefined' && performance.timeOrigin ? performance.timeOrigin : now,
    memory: Number((typeof performance !== 'undefined' ? (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize : 0) ?? 0),
    from: loadedFrom(), last: lastReload(), wish: watchdog.state.wish, wait: watchdog.state.wait,
    ...i.self,
  };
  const groups: HealthGroup[] = [];
  const away: HealthRow = { id: 'away', name: 'Not checked', mark: 'wait', words: 'Can’t be checked while Home Assistant isn’t answering.' };
  const ha = !!hass && me.up;

  // Home Assistant and the internet
  const downMin = Math.max(1, Math.round((now - me.heard) / 60_000));
  const ver = hass?.config?.version;
  groups.push({ id: 'house', title: 'Home Assistant and the internet', rows: [
    me.up ? { id: 'ha', name: 'Home Assistant', mark: 'ok', words: `Answering${ver ? ` (version ${ver})` : ''}.` }
      : { id: 'ha', name: 'Home Assistant', mark: 'bad', words: `Not answering since ${sameDay(new Date(me.heard), today) ? '' : `${dayWords(new Date(me.heard), today)} `}${fmtTime(new Date(me.heard))} (${forWords(downMin)}). The panel shows what it last had, and reconnects by itself.` },
    reads?.internet === undefined ? { id: 'net', name: 'The internet', mark: 'wait', words: 'Checking…' }
      : reads.internet ? { id: 'net', name: 'The internet', mark: 'ok', words: 'Answering.' }
        : { id: 'net', name: 'The internet', mark: 'bad', words: 'Not answering. The rain radar, the wind map, the house voice, Ask and new builds need it; the rest of the panel does not.' },
  ] });

  // the calendars, as this screen last read them
  const calRows: HealthRow[] = [];
  const limit = (cfg.health?.calendar_minutes ?? 30) * 60_000;
  for (const c of cfg.calendars ?? []) {
    const s = hass?.states[c.entity], name = c.name ?? (s?.attributes?.friendly_name as string | undefined) ?? 'A calendar', at = cals.seen[c.entity], id = `cal:${c.entity}`;
    if (!ha) continue;
    if (gone(s)) calRows.push({ id, name, mark: 'bad', words: 'Can’t be reached in Home Assistant.' });
    else if (at === undefined) calRows.push({ id, name, mark: now - cals.since > limit ? 'warn' : 'wait', words: 'Not read on this screen yet.' });
    else if (now - at > limit) calRows.push({ id, name, mark: 'warn', words: `Not read for ${forWords(Math.floor((now - at) / 60_000))}.` });
    else calRows.push({ id, name, mark: 'ok', words: `Read ${agoWords(Math.floor((now - at) / 60_000))}.` });
  }
  if (cfg.calendars?.length) groups.push({ id: 'cals', title: 'Calendars', rows: ha ? calRows : [away] });

  // the speakers
  // one row per speaker: the same speaker named twice (its own integration's name and Music Assistant's) is shown once
  const spk = speakersOf(cfg).filter((e, n, all) => !hass || all.findIndex((x) => nameOf(hass, x).toLowerCase() === nameOf(hass, e).toLowerCase()) === n);
  if (spk.length) groups.push({ id: 'speakers', title: 'Speakers', rows: !ha ? [away] : spk.map((e) => { const s = hass!.states[e], name = nameOf(hass!, e);
    return gone(s) ? { id: `spk:${e}`, name, mark: 'bad' as Mark, words: 'Can’t be reached.' } : { id: `spk:${e}`, name, mark: 'ok' as Mark, words: s!.state === 'playing' ? 'Answering, playing now.' : 'Answering.' }; }) });

  // the house voice
  const v = cfg.voice, hv = houseVoice();
  if (v?.tts) {
    const s = hass?.states[v.tts], who = voiceInUse(v)?.name, used = voiceUsed(), cap = voiceCap(), name = `The house voice${who ? ` (${who})` : ''}`;
    const rows: HealthRow[] = [];
    if (!ha) rows.push(away);
    else if (gone(s)) rows.push({ id: 'voice', name, mark: 'bad', words: 'Not available in Home Assistant: the screen’s own voice speaks instead.' });
    else rows.push({ id: 'voice', name, mark: 'ok', words: 'Ready. It is made on the internet: with the internet down, only lines said before can play.' });
    if (hv) rows.push(used >= cap ? { id: 'allowance', name: 'Today’s allowance', mark: 'warn', words: `Used up (${used.toLocaleString('en-AU')} of ${cap.toLocaleString('en-AU')} new characters): new lines are spoken in the screen’s own voice until midnight.` }
      : { id: 'allowance', name: 'Today’s allowance', mark: 'ok', words: `${used.toLocaleString('en-AU')} of ${cap.toLocaleString('en-AU')} new characters used.` });
    groups.push({ id: 'voice', title: 'The voice', rows });
  }

  // the phones Home Assistant sends to
  const ph = phonesOf(cfg);
  if (ph.length) groups.push({ id: 'phones', title: 'Phones', rows: !ha ? [away] : ph.map((p) => {
    const svc = p.service.replace(/^notify\./, ''), known = !!hass!.services?.notify?.[svc], heard = phoneHeard(hass!, p.service), id = `phone:${svc}`, what = listWords(p.uses);
    if (!known) return { id, name: heard.name, mark: 'bad' as Mark, words: `Home Assistant no longer knows this phone, so ${what} can’t reach it.` };
    if (!heard.at) return { id, name: heard.name, mark: 'ok' as Mark, words: `Home Assistant can send to it (${what}).` };
    const quiet = now - heard.at;
    return quiet > PHONE_QUIET_MS ? { id, name: heard.name, mark: 'warn' as Mark, words: `Not heard from for ${Math.floor(quiet / DAY_MS)} days: it may be off, or its Home Assistant app signed out. It gets ${what}.` }
      : { id, name: heard.name, mark: 'ok' as Mark, words: `Last heard from ${agoWords(Math.max(0, Math.floor(quiet / 60_000)))}. It gets ${what}.` };
  }) });

  // the nightly snapshot of points
  if (cfg.health?.backup) {
    const snap = reads?.snap, dueDay = new Date(today); if (today.getHours() * 60 + today.getMinutes() < SNAP_DUE) dueDay.setDate(dueDay.getDate() - 1);
    const due = ymdOf(dueDay);
    const row: HealthRow = snap === undefined ? { id: 'snap', name: 'The nightly snapshot', mark: 'wait', words: 'Checking…' }
      : snap === 'error' ? { id: 'snap', name: 'The nightly snapshot', mark: 'wait', words: ha ? 'Couldn’t be read just now.' : 'Can’t be read while Home Assistant isn’t answering.' }
        : snap === null ? { id: 'snap', name: 'The nightly snapshot', mark: 'bad', words: 'There isn’t one yet: the snapshot at 2:15 am has not run.' }
          : snap >= due ? { id: 'snap', name: 'The nightly snapshot', mark: 'ok', words: `Points and the jar copied ${dayWords(dateOf(snap), today) === 'today' ? 'last night' : dayWords(dateOf(snap), today)} (${snap}).` }
            : { id: 'snap', name: 'The nightly snapshot', mark: 'bad', words: `The newest is from ${dayWords(dateOf(snap), today)} (${snap}): the snapshot at 2:15 am has not run since.` };
    groups.push({ id: 'backup', title: 'Backups', rows: [row] });
  }

  // this screen
  const screen: HealthRow[] = [];
  const mb = me.memory > 0 ? `, using ${Math.round(me.memory / 1e6)} MB` : '';
  screen.push({ id: 'screen', name: 'This screen', mark: 'ok', words: `Called ${me.screen}${me.wall ? ', the wall panel' : ''}. This page loaded ${dayWords(new Date(me.loadedAt), today) === 'today' ? '' : `${dayWords(new Date(me.loadedAt), today)} `}at ${fmtTime(new Date(me.loadedAt))}${mb}.` });
  const f = me.from;
  screen.push(f.where === 'jsdelivr' ? { id: 'build', name: 'This build', mark: 'warn', words: `${version} (${f.name}), loaded from jsDelivr: it needs the internet to start. A deploy copies it into Home Assistant.` }
    : { id: 'build', name: 'This build', mark: 'ok', words: `${version}${f.name ? ` (${f.name})` : ''}, loaded from ${f.where === 'house' ? 'Home Assistant' : 'its own address'}.` });
  const next = reads?.build;
  screen.push(next === undefined ? { id: 'next', name: 'A newer build', mark: 'wait', words: 'Checking…' }
    : next === 'error' ? { id: 'next', name: 'A newer build', mark: 'wait', words: ha ? 'Couldn’t be checked just now.' : 'Can’t be checked while Home Assistant isn’t answering.' }
      : next ? { id: 'next', name: 'A newer build', mark: 'wait', words: `Waiting (${buildShort(next)}): this screen takes it by itself at its next quiet moment.` }
        : { id: 'next', name: 'A newer build', mark: 'ok', words: 'None waiting: this is the build the dashboard names.' });
  const last = me.last;
  screen.push(!last ? { id: 'reload', name: 'Its last reload', mark: 'ok', words: 'It has not needed to reload itself.' }
    : { id: 'reload', name: 'Its last reload', mark: 'ok', words: `${dayWords(new Date(last.at), today).replace(/^./, (c) => c.toUpperCase())} at ${fmtTime(new Date(last.at))}: ${WHY_SAY[last.why] ?? last.why}.` });
  const wish = me.wish as Why | '', wait = me.wait;
  screen.push(wait === 'held back' && wish ? { id: 'watch', name: 'Its watchdog', mark: 'bad', words: `Held back a reload (${WHY_SAY[wish]}): it has reloaded too often today. A person should look.` }
    : wish ? { id: 'watch', name: 'Its watchdog', mark: 'wait', words: `Will reload (${WHY_SAY[wish]})${wait ? `, waiting ${WAIT_SAY[wait] ?? wait}` : ''}.` }
      : { id: 'watch', name: 'Its watchdog', mark: 'ok', words: 'Watching: nothing to do.' });
  groups.push({ id: 'screen', title: 'This screen', rows: screen });

  // the health log: what every screen has written this week
  if (logList(cfg)) {
    const log = reads?.log;
    const rows: HealthRow[] = log === undefined ? [{ id: 'log', name: 'Reloads', mark: 'wait', words: 'Checking…' }]
      : log === 'error' ? [{ id: 'log', name: 'Reloads', mark: 'wait', words: ha ? 'The health log couldn’t be read just now.' : 'Can’t be read while Home Assistant isn’t answering.' }]
        : !log.length ? [{ id: 'log', name: 'Reloads', mark: 'ok', words: 'No screen has reloaded itself this week.' }]
          : log.map((l, n) => {
            // one fault healed by a reload is the watchdog working; two on one screen in a day, or a reload held back, needs a person
            const held = l.words.startsWith('held back'), fault = (x: LogLine): boolean => x.words.startsWith('reloaded') && !/the nightly fresh start|a new build was ready/.test(x.words);
            const again = fault(l) && log.filter((x) => x.day === l.day && x.screen === l.screen && fault(x)).length > 1;
            return { id: `log:${n}`, name: `${dayWords(dateOf(l.day), today).replace(/^./, (c) => c.toUpperCase())}, ${l.screen === me.screen ? 'this screen' : `screen ${l.screen}`}`, mark: (held ? 'bad' : again ? 'warn' : 'ok') as Mark,
              words: `${l.words.replace(/^./, (c) => c.toUpperCase())}${again ? ' (more than once that day: worth a look)' : held ? ' (a person should look)' : ''}.` };
          });
    groups.push({ id: 'log', title: 'Every screen, this week', rows });
  }
  return groups;
}

/** The sheet's summary: one line, and which rows it is about (so the problems are named at the top, wherever they sit below). */
export const healthSummary = (groups: HealthGroup[]): { mark: Mark; words: string; which: string } => {
  const all = groups.flatMap((g) => g.rows.map((r) => ({ ...r, g: g.title })));
  const bad = all.filter((r) => r.mark === 'bad'), warn = all.filter((r) => r.mark === 'warn'), wait = all.some((r) => r.mark === 'wait' && r.words === 'Checking…');
  const names = (rs: typeof all): string => { const n = rs.slice(0, 4).map((r) => (r.g === 'Every screen, this week' ? `the health log (${r.name.toLowerCase()})` : r.name === r.g || r.g === 'This screen' || r.g.startsWith('Home Assistant') ? r.name : `${r.name} (${r.g.toLowerCase()})`)); return `${n.join('; ')}${rs.length > 4 ? `; and ${rs.length - 4} more` : ''}`; };
  const which = [bad.length ? `Not working: ${names(bad)}.` : '', warn.length ? `Worth a look: ${names(warn)}.` : ''].filter(Boolean).join(' ');
  if (bad.length) return { mark: 'bad', words: `${bad.length === 1 ? 'One thing is' : `${bad.length} things are`} not working${warn.length ? `, and ${warn.length === 1 ? 'one is' : `${warn.length} are`} worth a look` : ''}.`, which };
  if (warn.length) return { mark: 'warn', words: `Everything is working. ${warn.length === 1 ? 'One thing is' : `${warn.length} things are`} worth a look.`, which };
  if (wait) return { mark: 'wait', words: 'Checking…', which };
  return { mark: 'ok', words: 'Everything the panel needs is answering.', which };
};

/** The rows as plain text (for Claude reading a real screen: `window.__fhHealth()`), one per line. */
export const healthText = (groups: HealthGroup[]): string =>
  groups.map((g) => `${g.title}\n${g.rows.map((r) => `  [${r.mark}] ${r.name}: ${r.words}`).join('\n')}`).join('\n');
