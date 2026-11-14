import type { CalendarConfig, FamilyHubConfig, Hass } from './types';
import { kidEntities } from './types';
import { ymd } from './util';

/* ------------------------------------------------------------------ *
 * Trust guards (Phase 4c). Four small things that let a family rely on
 * the panel, none of which adds a screen:
 *
 *   calendar health   are the calendars on screen fresh, and is each one reachable
 *   panel liveness    the wall panel tells Home Assistant it is alive
 *   snapshots         one dated record of every child's points, the jar and the reward ledger
 *   use counts        opens and taps per page, per day: numbers only, never content, never per child
 *
 * The snapshot itself is taken by Home Assistant (it must not depend on a
 * screen being on). `haTrust()` builds that automation, the restore script
 * and the panel watch from the card's own configuration, so no household's
 * entity names are written in this repository. `snapshotOf()` and
 * `restoreCalls()` are the same record in TypeScript, for tests and drills.
 * ------------------------------------------------------------------ */

export interface HealthConfig {
  /** a calendar that has not been fetched for this many minutes is called stale (default 30; the planner asks every 5) */
  calendar_minutes?: number;
  /** an input_datetime the wall panel stamps every few minutes */
  heartbeat?: string;
  /** minutes without a stamp before Home Assistant tells a parent (default 20) */
  heartbeat_minutes?: number;
  /** a to-do list that keeps one line of counts per screen per day */
  use_log?: string;
  /** a to-do list that keeps the nightly snapshots */
  backup?: string;
  /** the notify service for the panel watch (default: the first emergency contact) */
  notify?: string;
}

const lsGet = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) as T; } catch { return d; } };
const lsSet = (k: string, v: unknown): void => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

/* ---------------- calendar health ---------------- */

export interface CalHealth {
  /** minutes since the least recently fetched calendar was fetched; null before the first answer */
  age: number | null;
  /** names of calendars whose entity is missing or unavailable */
  down: string[];
  /** names of calendars not fetched within the limit */
  stale: string[];
}

/** `seen` holds, per calendar entity, when its events were last fetched without an error; `since` is when this screen started asking. */
export const calHealth = (hass: Hass | undefined, cals: CalendarConfig[], seen: Record<string, number>, since: number, now: number, limitMin = 30): CalHealth => {
  const down: string[] = [], stale: string[] = [];
  let oldest: number | null = null;
  for (const c of cals) {
    const s = hass?.states[c.entity], name = c.name ?? (s?.attributes.friendly_name as string | undefined) ?? 'A calendar';
    if (!s || s.state === 'unavailable') { down.push(name); continue; }
    const at = seen[c.entity];
    if (at !== undefined) oldest = oldest === null ? at : Math.min(oldest, at);
    if (now - (at ?? since) > limitMin * 60_000) stale.push(name);
  }
  return { age: oldest === null ? null : Math.max(0, Math.floor((now - oldest) / 60_000)), down, stale };
};

/** "just now", "4 min ago", "2 h ago" */
export const agoWords = (min: number): string => (min < 1 ? 'just now' : min < 90 ? `${min} min ago` : `${Math.round(min / 60)} h ago`);
const listWords = (a: string[]): string => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
/** "30 min", "2 h" */
export const forWords = (min: number): string => (min < 90 ? `${Math.max(1, min)} min` : `${Math.round(min / 60)} h`);
/** The plain warning, or '' when all is well. */
export const calWarning = (h: CalHealth): string => {
  const cal = (a: string[]): string => `The ${listWords(a)} calendar${a.length > 1 ? 's' : ''}`;
  if (h.down.length) return `${cal(h.down)} can’t be reached. What’s shown may be out of date.`;
  if (h.stale.length) return `${cal(h.stale)} ${h.stale.length > 1 ? 'haven’t' : 'hasn’t'} updated${h.age !== null ? ` for ${forWords(h.age)}` : ''}. What’s shown may be out of date.`;
  return '';
};

/* ---------------- panel liveness ---------------- */

/** One screen in the house is the wall panel (Settings, House). Only that screen stamps the heartbeat: a phone opening the card must not make a dead panel look alive. */
export const isWall = (): boolean => lsGet<boolean>('fh-wall', false) === true;
export const setWall = (on: boolean): void => lsSet('fh-wall', on);
export const BEAT_MS = 5 * 60_000;

/* ---------------- use counts ---------------- */

const screenId = (): string => { let id = lsGet<string>('fh-screen', ''); if (!/^[a-z0-9]{4}$/.test(id)) { id = Math.random().toString(36).slice(2, 6).padEnd(4, '0'); lsSet('fh-screen', id); } return id; };
/** Page names are a fixed alphabet: nothing a person typed can end up in a count. */
const clean = (page: string): string => page.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'other';

/** Opens and taps per page for today, on this screen. Kept in this browser between flushes; written to one to-do line per screen per day. */
export class UseLog {
  private day = ''; private c: Record<string, [number, number]> = {}; private dirty = false; private written = ''; private busy = false;
  readonly screen = screenId();
  constructor() { const s = lsGet<{ day?: string; c?: Record<string, [number, number]> }>('fh-use', {}); if (s.day === ymd(new Date()) && s.c) { this.day = s.day; this.c = s.c; this.dirty = true; } }
  private _roll(): void { const d = ymd(new Date()); if (d !== this.day) { this.day = d; this.c = {}; this.written = ''; } }
  private _bump(page: string, i: 0 | 1): void { this._roll(); const k = clean(page); (this.c[k] ??= [0, 0])[i]++; this.dirty = true; lsSet('fh-use', { day: this.day, c: this.c }); }
  open(page: string): void { this._bump(page, 0); }
  tap(page: string): void { this._bump(page, 1); }
  get counts(): Record<string, [number, number]> { return this.c; }
  /** The line's name: the day and this screen. */
  get line(): string { return `${this.day} ${this.screen}`; }
  async flush(hass: Hass | undefined, entity: string | undefined): Promise<void> {
    if (!hass || !entity || !hass.states[entity] || !this.dirty || this.busy || !this.day) return;
    this.busy = true;
    const line = this.line, description = JSON.stringify({ v: 1, p: this.c });
    try {
      if (this.written !== line) {
        const got = await hass.callWS<{ items?: { summary: string }[] }>({ type: 'todo/item/list', entity_id: entity });
        if (!(got.items ?? []).some((x) => x.summary === line)) await hass.callService('todo', 'add_item', { item: line, description }, { entity_id: entity });
        else await hass.callService('todo', 'update_item', { item: line, description }, { entity_id: entity });
        this.written = line;
      } else await hass.callService('todo', 'update_item', { item: line, description }, { entity_id: entity });
      this.dirty = false;
    } catch (e) { console.warn('Family Hub: use counts not saved', e); } finally { this.busy = false; }
  }
}
export const USE_FLUSH_MS = 10 * 60_000;

/** Every screen's lines for one day added together: { page: [opens, taps] }. */
export const useTotals = (items: { summary: string; description?: string | null }[], day: string): Record<string, [number, number]> => {
  const out: Record<string, [number, number]> = {};
  for (const it of items) {
    if (!it.summary.startsWith(day + ' ')) continue;
    try { const p = (JSON.parse(it.description ?? '') as { p?: Record<string, [number, number]> }).p ?? {}; for (const [k, [o, t]] of Object.entries(p)) { const r = (out[k] ??= [0, 0]); r[0] += Number(o) || 0; r[1] += Number(t) || 0; } } catch { /* not one of ours */ }
  }
  return out;
};

/* ---------------- snapshots ---------------- */

export const JAR = 'input_number.family_jar';
export const SNAP_PREFIX = 'snap ';
export interface SnapKid { p: number; l: number; s: number; g: number; w: string; goal: string }
export interface Snap { v: 1; d: string; jar: number; kids: Record<string, SnapKid>; owed: string[] }

const n = (hass: Hass, id: string): number => { const v = Number(hass.states[id]?.state); return Number.isFinite(v) ? v : 0; };
const t = (hass: Hass, id: string): string => { const s = hass.states[id]?.state; return s === undefined || s === 'unknown' || s === 'unavailable' ? '' : String(s); };

/** The record Home Assistant writes each night, built here from the same entities. `owed` is the reward ledger's open lines. */
export const snapshotOf = (hass: Hass, cfg: FamilyHubConfig, owed: string[] = [], day = ymd(new Date())): Snap => ({
  v: 1, d: day, jar: n(hass, JAR),
  kids: Object.fromEntries((cfg.kids ?? []).map((k) => { const e = kidEntities(k); return [e.slug, { p: n(hass, e.points), l: n(hass, e.lifetime), s: n(hass, e.streak), g: n(hass, e.grow), w: t(hass, e.week), goal: t(hass, e.goal) }]; })),
  owed: [...owed]
});
export const snapText = (s: Snap): string => SNAP_PREFIX + JSON.stringify(s);
export const snapParse = (text: string | null | undefined): Snap | null => {
  try { const s = JSON.parse(String(text ?? '').replace(/^snap\s+/, '')) as Snap; return s && s.v === 1 && typeof s.kids === 'object' && Number.isFinite(s.jar) ? s : null; } catch { return null; }
};

export interface Call { domain: string; service: string; data: Record<string, unknown>; target: { entity_id: string } }
/** What a restore does: every number and line put back as the snapshot has it. `owedNow` is the ledger as it stands: lines it already has are not added twice. */
export const restoreCalls = (s: Snap, cfg: FamilyHubConfig, owedNow: string[] = [], owedEntity = 'todo.rewards_owed'): Call[] => {
  const out: Call[] = [{ domain: 'input_number', service: 'set_value', data: { value: s.jar }, target: { entity_id: JAR } }];
  for (const k of cfg.kids ?? []) {
    const e = kidEntities(k), r = s.kids[e.slug]; if (!r) continue;
    for (const [id, value] of [[e.points, r.p], [e.lifetime, r.l], [e.streak, r.s], [e.grow, r.g]] as [string, number][]) out.push({ domain: 'input_number', service: 'set_value', data: { value }, target: { entity_id: id } });
    for (const [id, value] of [[e.week, r.w], [e.goal, r.goal]] as [string, string][]) out.push({ domain: 'input_text', service: 'set_value', data: { value }, target: { entity_id: id } });
  }
  const have = [...owedNow];
  for (const line of s.owed) { const i = have.indexOf(line); if (i >= 0) have.splice(i, 1); else out.push({ domain: 'todo', service: 'add_item', data: { item: line }, target: { entity_id: owedEntity } }); }
  return out;
};

/* ---------------- the Home Assistant side ---------------- */

export interface HaTrust {
  /** helpers to create if missing */
  helpers: { kind: 'input_datetime' | 'local_todo'; entity: string; name: string }[];
  automations: Record<string, Record<string, unknown>>;
  scripts: Record<string, Record<string, unknown>>;
}

const q = (s: string): string => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** The automations and the restore script, as Home Assistant's config API takes them. Built from the configuration this card is running. */
export const haTrust = (cfg: FamilyHubConfig, owedEntity = 'todo.rewards_owed', keepDays = 35, useDays = 62): HaTrust => {
  const h = cfg.health ?? {}, kids = (cfg.kids ?? []).map((k) => kidEntities(k));
  const out: HaTrust = { helpers: [], automations: {}, scripts: {} };
  const prune = (entity: string, days: number, v: string): Record<string, unknown>[] => [
    { action: 'todo.get_items', target: { entity_id: entity }, response_variable: v },
    { repeat: { for_each: `{{ ${v}[${q(entity)}]['items'] | map(attribute='summary') | select('match', '^[0-9]{4}-[0-9]{2}-[0-9]{2}') | select('lt', (now() - timedelta(days=${days})).strftime('%Y-%m-%d')) | list }}`, sequence: [{ action: 'todo.remove_item', target: { entity_id: entity }, data: { item: '{{ repeat.item }}' } }] } }
  ];
  if (h.backup) {
    out.helpers.push({ kind: 'local_todo', entity: h.backup, name: 'Family Hub backup' });
    const kidsJ = kids.map((e) => `${q(e.slug)}: {'p': states(${q(e.points)}) | float(0), 'l': states(${q(e.lifetime)}) | float(0), 's': states(${q(e.streak)}) | float(0), 'g': states(${q(e.grow)}) | float(0), 'w': states(${q(e.week)}) | replace('unknown', '') | replace('unavailable', ''), 'goal': states(${q(e.goal)}) | replace('unknown', '') | replace('unavailable', '')}`).join(', ');
    out.automations.family_hub_snapshot = {
      alias: 'Family Hub: nightly snapshot of points', description: 'Copies every child’s points, the family jar and the reward ledger into one dated line, so nothing earned can be lost. Restore with the script “Family Hub: restore points”.',
      mode: 'single', triggers: [{ trigger: 'time', at: '02:15:00' }], conditions: [],
      actions: [
        { action: 'todo.get_items', target: { entity_id: owedEntity }, data: { status: ['needs_action'] }, response_variable: 'owed', continue_on_error: true },
        { variables: { day: "{{ now().strftime('%Y-%m-%d') }}", lines: `{{ (owed[${q(owedEntity)}]['items'] | map(attribute='summary') | list) if owed is defined and owed else [] }}` } },
        { variables: { rec: `{{ {'v': 1, 'd': day, 'jar': states(${q(JAR)}) | float(0), 'kids': {${kidsJ}}, 'owed': lines} }}` } },
        { action: 'todo.get_items', target: { entity_id: h.backup }, response_variable: 'had' },
        { if: [{ condition: 'template', value_template: `{{ day in (had[${q(h.backup)}]['items'] | map(attribute='summary') | list) }}` }], then: [{ action: 'todo.remove_item', target: { entity_id: h.backup }, data: { item: '{{ day }}' } }] },
        { action: 'todo.add_item', target: { entity_id: h.backup }, data: { item: '{{ day }}', description: `${SNAP_PREFIX}{{ rec | to_json }}` } },
        ...prune(h.backup, keepDays, 'kept'),
        ...(h.use_log ? prune(h.use_log, useDays, 'used') : [])
      ]
    };
    const setN = (id: string, expr: string): Record<string, unknown> => ({ action: 'input_number.set_value', target: { entity_id: id }, data: { value: `{{ ${expr} }}` } });
    const setT = (id: string, expr: string): Record<string, unknown> => ({ action: 'input_text.set_value', target: { entity_id: id }, data: { value: `{{ ${expr} }}` } });
    out.scripts.fh_restore_points = {
      alias: 'Family Hub: restore points', description: 'Puts every child’s points, the family jar and the reward ledger back as they were in a nightly snapshot. Leave the date empty for the newest snapshot.',
      mode: 'single', icon: 'mdi:backup-restore',
      fields: { date: { name: 'Snapshot date', description: 'Like 2026-12-01. Empty: the newest.', required: false, selector: { text: {} } } },
      sequence: [
        { action: 'todo.get_items', target: { entity_id: h.backup }, response_variable: 'got' },
        { variables: { want: "{{ date | default('') | string | trim }}" } },
        { variables: { found: `{{ got[${q(h.backup)}]['items'] | selectattr('summary', 'match', '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') | selectattr('description', 'defined') | sort(attribute='summary') | map(attribute='summary') | list }}` } },
        { variables: { pick: "{{ want if want in found else ('' if want else (found | last | default('')) ) }}" } },
        { if: [{ condition: 'template', value_template: "{{ pick == '' }}" }], then: [{ stop: 'No snapshot for that date.', error: true }] },
        { variables: { rec: `{{ (got[${q(h.backup)}]['items'] | selectattr('summary', 'eq', pick) | map(attribute='description') | first)[${SNAP_PREFIX.length}:] | from_json }}` } },
        { if: [{ condition: 'template', value_template: '{{ not (rec is mapping and rec.v == 1 and rec.kids is mapping) }}' }], then: [{ stop: 'That snapshot can’t be read.', error: true }] },
        setN(JAR, 'rec.jar'),
        ...kids.map((e) => ({ if: [{ condition: 'template', value_template: `{{ ${q(e.slug)} in rec.kids }}` }], then: [
          { variables: { k: `{{ rec.kids[${q(e.slug)}] }}` } },
          setN(e.points, 'k.p'), setN(e.lifetime, 'k.l'), setN(e.streak, 'k.s'), setN(e.grow, 'k.g'), setT(e.week, 'k.w'), setT(e.goal, 'k.goal')] })),
        { action: 'todo.get_items', target: { entity_id: owedEntity }, data: { status: ['needs_action'] }, response_variable: 'owed', continue_on_error: true },
        { variables: { have: `{{ (owed[${q(owedEntity)}]['items'] | map(attribute='summary') | list) if owed is defined and owed else [] }}` } },
        { repeat: { for_each: "{{ rec.owed | default([]) | reject('in', have) | list }}", sequence: [{ action: 'todo.add_item', target: { entity_id: owedEntity }, data: { item: '{{ repeat.item }}' } }] } },
        { action: 'persistent_notification.create', data: { title: 'Family Hub', message: 'Points, the jar and the reward ledger were put back from the snapshot of {{ pick }}.' } }
      ]
    };
  }
  if (h.use_log) out.helpers.push({ kind: 'local_todo', entity: h.use_log, name: 'Family Hub use' });
  if (h.heartbeat) {
    out.helpers.push({ kind: 'input_datetime', entity: h.heartbeat, name: 'Family Hub panel seen' });
    const mins = Math.max(10, h.heartbeat_minutes ?? 20), to = h.notify ?? cfg.emergency?.notify?.[0];
    const stale = `(now().timestamp() - (state_attr(${q(h.heartbeat)}, 'timestamp') | float(0))) > ${mins * 60}`;
    if (to) out.automations.family_hub_panel_watch = {
      alias: 'Family Hub: the wall panel has stopped', description: `Tells a parent once when the wall panel has not checked in for ${mins} minutes, between 6:30 am and 9 pm. Stays off until one screen is marked as the wall panel in Settings, House.`,
      mode: 'single',
      triggers: [{ trigger: 'template', value_template: `{{ (state_attr(${q(h.heartbeat)}, 'timestamp') | float(0)) > 0 and ${stale} and (now().hour * 60 + now().minute) >= 390 and now().hour < 21 }}` }],
      conditions: [],
      actions: [{ action: to, data: { title: 'Family Hub', message: `The wall panel hasn’t checked in since {{ (state_attr(${q(h.heartbeat)}, 'timestamp') | float(0)) | timestamp_custom('%-I:%M %p') }}. It may be off, asleep or off the Wi-Fi.` } }]
    };
  }
  return out;
};
