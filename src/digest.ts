import type { FamilyHubConfig, Hass } from './types';
import { isBin, kidEntities } from './types';
import { JAR, SNAP_PREFIX } from './trust';

/* ------------------------------------------------------------------ *
 * The evening digest (F3, the parents' loop). One message a night to a
 * parent's phone, read-only:
 *
 *   anything the panel is unsure of   a calendar that can't be reached, a wall panel that has gone quiet
 *   tomorrow                          the events, and on a school day when each child leaves
 *   bins                              when tonight or tomorrow is bin night
 *   medicine                          a daily medicine with no record today
 *   rewards                           what is waiting on the reward ledger
 *   marbles                           how many the jar gained today
 *
 * Home Assistant sends it, so it does not depend on a screen being on.
 * `haDigest()` builds that automation from the card's own configuration
 * (as `haTrust()` does), so no household's names are written in this
 * repository. The words are made by one Home Assistant template: the
 * suite `scripts/tests/digest.mjs` renders it against made-up evenings.
 * ------------------------------------------------------------------ */

export interface DigestConfig {
  /** the phones it goes to: notify services such as notify.mobile_app_dads_phone. With none, there is no digest */
  notify?: string[];
  /** when it is sent (default 19:30) */
  time?: string;
}

export const DIGEST_ID = 'family_hub_digest';
export const DIGEST_TIME = '19:30';
/** how many events and reward lines one message carries before "+2 more" */
const MAX_EVENTS = 8, MAX_OWED = 4;

const hm = (s: string | undefined, d: number): number => { const [h, m] = String(s ?? '').split(':').map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : d; };
/** A value as a Home Assistant template writes it (JSON's strings, lists and maps are also the template language's). */
const j = (v: unknown): string => JSON.stringify(v);
export const digestOn = (cfg: FamilyHubConfig | undefined): boolean => (cfg?.digest?.notify ?? []).some((n) => /^notify\.[a-z0-9_]+$/.test(n));
/** "7:30 pm" */
export const timeWords = (t: string | undefined): string => { const m = hm(t, hm(DIGEST_TIME, 0)); return `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')} ${m < 720 ? 'am' : 'pm'}`; };

/** The digest's automation in Home Assistant, if it has been made: found by its id, whatever it has been renamed to. */
export const digestEntity = (hass: Hass | undefined): string | undefined => Object.keys(hass?.states ?? {}).find((e) => e.startsWith('automation.') && hass!.states[e].attributes.id === DIGEST_ID);

/** The template that writes the message. Every line starts with a word, so Home Assistant never mistakes the result for a number or a list. */
const messageTemplate = (cfg: FamilyHubConfig, owedEntity: string): string => {
  const cals = (cfg.calendars ?? []).map((c) => {
    const kid = (cfg.kids ?? []).find((k) => kidEntities(k).calendar === c.entity || (c.name && k.name.toLowerCase() === c.name.toLowerCase()));
    const words = (l: string[] | undefined): string[] => (l ?? []).map((w) => String(w).trim().toLowerCase()).filter(Boolean);
    return { e: c.entity, n: c.name ?? '', only: words(c.only), hide: words(c.hide), who: kid?.name ?? '' };
  });
  const usual = cfg.morning?.leave_by ?? '08:15';
  const kids = (cfg.kids ?? []).map((k) => ({ n: k.name, l: hm(k.leave_by ?? usual, hm(usual, 495)) }));
  const b = cfg.bins, h = cfg.health ?? {};
  const meds = (cfg.meds ?? []).map((m) => ({ id: m.id, w: m.who ?? m.label, t: hm(m.time, 0) }));
  const T: string[] = [];
  const say = (expr: string): string => `{%- set ns.L = ns.L + [${expr}] -%}`;
  T.push(
    `{%- macro t12(m) -%}{{ '%d:%02d %s' % ((m // 60) % 12 or 12, m % 60, 'am' if m < 720 else 'pm') }}{%- endmacro -%}`,
    `{%- macro und(a) -%}{{ (a | first) if (a | count) < 2 else ((a[:-1] | join(', ')) ~ ' and ' ~ (a | last)) }}{%- endmacro -%}`,
    `{%- set CALS = ${j(cals)} -%}{%- set PRIV = ${j((cfg.private ?? []).map((w) => w.toLowerCase()).filter(Boolean))} -%}`,
    `{%- set t0 = today_at('00:00') + timedelta(days=1) -%}{%- set tom = t0.strftime('%Y-%m-%d') -%}{%- set today = now().strftime('%Y-%m-%d') -%}`,
    `{%- set ns = namespace(L=[], ev=[], seen=[], down=[]) -%}`,
    // what the panel is unsure of comes first: it says how far to trust the rest
    `{%- set read = cal is defined and cal is mapping -%}`,
    `{%- for c in CALS -%}{%- if not has_value(c.e) -%}{%- set ns.down = ns.down + [c.n or (state_attr(c.e, 'friendly_name') or c.e.split('.')[1])] -%}{%- endif -%}{%- endfor -%}`,
    `{%- if ns.down -%}${say(`'Check: the ' ~ und(ns.down) ~ ' calendar' ~ ('s' if ns.down | count > 1 else '') ~ ' can’t be reached, so tomorrow may be missing something.'`)}`,
    `{%- elif CALS and not read -%}${say(`'Check: the calendars could not be read tonight.'`)}{%- endif -%}`
  );
  if (h.heartbeat) T.push(
    `{%- set hb = state_attr(${j(h.heartbeat)}, 'timestamp') | float(0) -%}`,
    `{%- if hb > 0 and now().timestamp() - hb > ${Math.max(10, h.heartbeat_minutes ?? 20) * 60} -%}${say(`'Check: the wall panel hasn’t checked in since ' ~ ('' if (hb | timestamp_custom('%Y-%m-%d')) == today else ((hb | timestamp_custom('%A')) ~ ' at ')) ~ (hb | timestamp_custom('%-I:%M %p') | lower) ~ '.'`)}{%- endif -%}`
  );
  // tomorrow's events: each calendar's own word filter, the same event in two calendars once, private ones without their words
  T.push(
    `{%- for c in CALS -%}{%- for e in (cal[c.e].events if (read and c.e in cal) else []) -%}`,
    `{%- set t = (e.summary | default('', true) | string | trim) -%}{%- set tl = t | lower -%}{%- set s = e.start | string -%}{%- set key = tl ~ '|' ~ s -%}`,
    `{%- if t and key not in ns.seen and (not c.only or (c.only | select('in', tl) | list | count) > 0) and (c.hide | select('in', tl) | list | count) == 0 -%}`,
    `{%- set ns.seen = ns.seen + [key] -%}{%- set allday = (s | length) <= 10 -%}{%- set priv = (PRIV | select('in', tl) | list | count) > 0 -%}`,
    `{%- set d = none if allday else (as_datetime(s) | as_local) -%}{%- set m = (d.hour * 60 + d.minute) if (d and d.strftime('%Y-%m-%d') == tom) else -1 -%}`,
    `{%- set ns.ev = ns.ev + [{'k': ('0' if allday else ('1' if m < 0 else '2' ~ ('%04d' % m))) ~ tl, 'a': allday, 'm': m, 't': ('Private event' if priv else t), 'tl': tl, 'w': c.who, 'p': priv}] -%}`,
    `{%- endif -%}{%- endfor -%}{%- endfor -%}`,
    `{%- set evs = ns.ev | sort(attribute='k') -%}`,
    `{%- for e in evs[:${MAX_EVENTS}] -%}${say(`('All day: ' if e.a else ('Continues: ' if e.m < 0 else (t12(e.m) ~ ' '))) ~ e.t ~ ((' (' ~ e.w ~ ')') if (e.w and not e.p and (e.w | lower) not in e.tl) else '')`)}{%- endfor -%}`,
    `{%- if (evs | count) > ${MAX_EVENTS} -%}${say(`'+' ~ ((evs | count) - ${MAX_EVENTS}) ~ ' more'`)}{%- endif -%}`,
    `{%- if read and not evs -%}${say(`'Nothing in the calendars.'`)}{%- endif -%}`
  );
  // leaving times, on a school day: the usual time, or earlier for a child's own event before 10 am (as the morning board works it out)
  if (kids.length) T.push(
    `{%- set KIDS = ${j(kids)} -%}{%- set TERMS = ${j((cfg.school_terms ?? []).map(([a, z]) => ({ a, z })))} -%}`,
    `{%- if t0.weekday() < 5 and tom not in ${j(cfg.public_holidays ?? [])} and (not TERMS or (TERMS | selectattr('a', 'le', tom) | selectattr('z', 'ge', tom) | list | count) > 0) -%}`,
    `{%- set lv = namespace(g=[], why=false) -%}`,
    `{%- for k in KIDS -%}{%- set kl = k.n | lower -%}{%- set f = namespace(m=k.l, why='') -%}`,
    `{%- for e in evs if (not e.a and not e.p and e.m >= 0 and e.m < 600 and (e.w == k.n or kl in e.tl)) -%}{%- if loop.first and e.m - ${cfg.morning?.travel ?? 15} < k.l -%}{%- set f.m = e.m - ${cfg.morning?.travel ?? 15} -%}{%- set f.why = e.t -%}{%- set lv.why = true -%}{%- endif -%}{%- endfor -%}`,
    `{%- set lv.g = lv.g + [{'m': f.m, 'n': k.n ~ ((' (' ~ f.why ~ ')') if f.why else '')}] -%}{%- endfor -%}`,
    `{%- set gs = lv.g | groupby('m') -%}`,
    `{%- if (gs | count) == 1 and not lv.why -%}${say(`('Everyone leaves' if (KIDS | count) > 1 else (KIDS[0].n ~ ' leaves')) ~ ' by ' ~ t12(gs[0].grouper) ~ '.'`)}`,
    `{%- else -%}{%- set p = namespace(p=[]) -%}{%- for g in gs -%}{%- set p.p = p.p + [t12(g.grouper) ~ ' ' ~ und(g.list | map(attribute='n') | list)] -%}{%- endfor -%}${say(`'Leave by: ' ~ (p.p | join('; ')) ~ '.'`)}{%- endif -%}`,
    `{%- endif -%}`
  );
  // bins: only the night before and the night itself; whose turn it is counts whole weeks from the anchor, as the panel does
  if (b && Number.isInteger(b.day)) {
    const always = (b.always ?? []).filter(isBin), alt = (b.alternate ?? []).filter(isBin);
    T.push(
      `{%- set off = (${b.day} - ((now().weekday() + 1) % 7) + 7) % 7 -%}`,
      `{%- if off < 2 -%}{%- set wk = ((((today_at('00:00') + timedelta(days=off)).date() - strptime(${j(b.anchor ?? '2026-01-05')}, '%Y-%m-%d').date()).days) / 7) | round | int -%}`,
      `{%- set ALT = ${j(alt)} -%}{%- set bins = ${j(always)} + ([ALT[wk % (ALT | count)]] if ALT else []) -%}`,
      `{%- if bins -%}${say(`'Bins out ' ~ ('tonight' if off == 0 else 'tomorrow night') ~ ': ' ~ und(bins) ~ '.'`)}{%- endif -%}{%- endif -%}`
    );
  }
  // medicine: a daily one that is due by now and has no record today. A helper never set reads as midnight with nobody's name: not a dose
  if (meds.length) T.push(
    `{%- set md = namespace(w=[]) -%}{%- set nowm = now().hour * 60 + now().minute -%}`,
    `{%- for m in ${j(meds)} -%}{%- set e = 'input_datetime.fh_med_' ~ m.id -%}{%- if has_value(e) and nowm >= m.t - 60 -%}`,
    `{%- set ts = state_attr(e, 'timestamp') | float(0) -%}{%- set at = ts | timestamp_custom('%Y-%m-%d %H:%M:%S') -%}`,
    `{%- set never = states('input_text.fh_med_' ~ m.id ~ '_by') in ['unknown', 'unavailable', ''] and at[11:] == '00:00:00' -%}`,
    `{%- if (ts <= 0 or never or at[:10] != today) and m.w not in md.w -%}{%- set md.w = md.w + [m.w] -%}{%- endif -%}`,
    `{%- endif -%}{%- endfor -%}`,
    `{%- if md.w -%}${say(`'Medicine not recorded today: ' ~ und(md.w) ~ '.'`)}{%- endif -%}`
  );
  T.push(
    `{%- set ow = (owed[${j(owedEntity)}]['items'] | map(attribute='summary') | list) if (owed is defined and owed is mapping and ${j(owedEntity)} in owed) else [] -%}`,
    `{%- if ow -%}${say(`'Rewards waiting: ' ~ (ow[:${MAX_OWED}] | join('; ')) ~ ((' (+' ~ ((ow | count) - ${MAX_OWED}) ~ ' more)') if (ow | count) > ${MAX_OWED} else '') ~ '.'`)}{%- endif -%}`
  );
  // marbles added today: the jar now, less the jar in this morning's snapshot
  if (h.backup) T.push(
    `{%- set sn = (had[${j(h.backup)}]['items'] | selectattr('summary', 'eq', today) | map(attribute='description') | select('string') | list) if (had is defined and had is mapping and ${j(h.backup)} in had) else [] -%}`,
    `{%- if sn and sn[0][:${SNAP_PREFIX.length}] == ${j(SNAP_PREFIX)} -%}{%- set rec = sn[0][${SNAP_PREFIX.length}:] | from_json -%}`,
    `{%- if rec is mapping and rec.jar is defined -%}{%- set jar = states(${j(JAR)}) | float(0) -%}{%- set add = (jar - (rec.jar | float(0))) | round | int -%}`,
    `{%- if add >= 1 -%}${say(`'Marbles: ' ~ add ~ ' added today, ' ~ (jar | round | int) ~ ${cfg.jar?.target ? `' of ${Math.round(cfg.jar.target)}'` : `' in the jar'`} ~ '.'`)}{%- endif -%}`,
    `{%- endif -%}{%- endif -%}`
  );
  T.push(`{{ ns.L | join('\\n') }}`);
  return T.join('');
};

/** The digest's automation, as Home Assistant's config API takes it, or null when no phone is named. Built from the configuration this card is running. */
export const haDigest = (cfg: FamilyHubConfig | undefined, owedEntity = 'todo.rewards_owed'): Record<string, unknown> | null => {
  if (!cfg || !digestOn(cfg)) return null;
  const d = cfg.digest!, to = [...new Set((d.notify ?? []).filter((n) => /^notify\.[a-z0-9_]+$/.test(n)))], at = hm(d.time, hm(DIGEST_TIME, 0));
  const cals = (cfg.calendars ?? []).map((c) => c.entity), backup = cfg.health?.backup;
  return {
    alias: 'Family Hub: evening digest',
    description: `One message to a parent’s phone at ${timeWords(d.time)}: tomorrow’s events and leaving times, bins, medicine with no record today, rewards waiting, marbles added today, and anything the panel is unsure of. It only reads. Written by the card from its own settings: change them in Settings, People and safety.`,
    mode: 'single',
    triggers: [{ trigger: 'time', at: `${String(Math.floor(at / 60)).padStart(2, '0')}:${String(at % 60).padStart(2, '0')}:00` }],
    conditions: [],
    actions: [
      ...(cals.length ? [{ action: 'calendar.get_events', target: { entity_id: cals }, data: { start_date_time: "{{ (today_at('00:00') + timedelta(days=1)).isoformat() }}", end_date_time: "{{ (today_at('00:00') + timedelta(days=2)).isoformat() }}" }, response_variable: 'cal', continue_on_error: true }] : []),
      { action: 'todo.get_items', target: { entity_id: owedEntity }, data: { status: ['needs_action'] }, response_variable: 'owed', continue_on_error: true },
      ...(backup ? [{ action: 'todo.get_items', target: { entity_id: backup }, response_variable: 'had', continue_on_error: true }] : []),
      { variables: { title: "Tomorrow, {{ (today_at('00:00') + timedelta(days=1)).strftime('%A %-d %B') }}", message: messageTemplate(cfg, owedEntity) } },
      ...to.map((svc) => ({ action: svc, data: { title: '{{ title }}', message: "{{ message if message is string and message | trim else 'Nothing to report for tomorrow.' }}", data: { tag: 'family-hub-digest', group: 'family-hub' } }, continue_on_error: true }))
    ]
  };
};

/** Whether the automation Home Assistant holds is the one this configuration would write (so Settings can say "the settings have changed"). */
export const sameDigest = (held: Record<string, unknown> | null | undefined, want: Record<string, unknown> | null): boolean => {
  if (!held || !want) return false;
  const norm = (v: unknown): unknown => Array.isArray(v) ? v.map(norm) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v as object).filter((k) => k !== 'id').sort().map((k) => [k, norm((v as Record<string, unknown>)[k])])) : v;
  return JSON.stringify(norm(held)) === JSON.stringify(norm(want));
};

/** Writes the automation (a new one starts switched on), or switches it off when no phone is named any more. Returns what it did. */
export const syncDigest = async (hass: Hass, cfg: FamilyHubConfig): Promise<'made' | 'updated' | 'off' | 'none'> => {
  const want = haDigest(cfg), ent = digestEntity(hass);
  if (!want) { if (ent && hass.states[ent].state === 'on') { await hass.callService('automation', 'turn_off', { stop_actions: false }, { entity_id: ent }); return 'off'; } return 'none'; }
  await hass.callApi('POST', `config/automation/config/${DIGEST_ID}`, { id: DIGEST_ID, ...want });
  return ent ? 'updated' : 'made';
};
