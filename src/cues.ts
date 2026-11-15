import type { FamilyHubConfig, Hass, KidConfig } from './types';
import { hm } from './util';
import { resolveVoice, houseVoice, voiceReady, DAILY_CHARS } from './voice';

/* ------------------------------------------------------------------ *
 * Spoken cues (F4). The panel waits to be visited; a child who finds
 * starting hard will not walk to the kitchen to find out what is next.
 * So Home Assistant says it, on his own speaker, at the three moments
 * that matter:
 *
 *   morning start         on a school morning, when the morning window opens
 *   ten minutes to go     ten minutes before he leaves, on a school morning
 *   wind-down start       an hour before his bedtime (later on Friday and Saturday, as the panel has it)
 *
 * The rules, each of which the automation itself keeps (no screen has to be on):
 *   - a child's OWN speaker only, never a shared room: he needs a room on the Music map that is his alone,
 *     and no other child or room may name the same speaker
 *   - never after his bedtime, and never before 5 am
 *   - off until switched on for that child (kids[].cues.on)
 *   - in the house voice, through the announce script (which reads the voice helper), at a set, gentle volume
 *   - under the house voice's daily allowance: past it, the cue is simply not spoken
 *
 * The automation is built by `haCues()` from the card's own configuration (as the digest's is), so no household's
 * names are in this repository. The fourth cue, "Start with me", is on the child's page (kid.ts): it needs no speaker.
 * ------------------------------------------------------------------ */

export interface KidCues {
  /** spoken cues for this child (default off) */
  on?: boolean;
  /** his own speaker, as the announce script names it, e.g. media_player.sams_room */
  speaker?: string;
  /** each cue is on unless it is set false */
  morning?: boolean; leave?: boolean; wind?: boolean;
}
export interface CuesConfig {
  /** the script that speaks: it takes `message`, `speakers` and `volume` (default script.fh_announce) */
  script?: string;
  /** how loud a cue is, 0 to 1 (default 0.4) */
  volume?: number;
}
export const CUES_ID = 'family_hub_cues';
export const CUE_SCRIPT = 'script.fh_announce';
export const CUE_VOLUME = 0.4;
/** minutes before leaving that the second cue is spoken */
export const CUE_LEAVE = 10;
const PLAYER = /^media_player\.[a-z0-9_]+$/;

type Cfg = FamilyHubConfig | undefined;
const rooms = (cfg: Cfg): { player?: string; kids?: string[]; zones?: { player: string }[] }[] => (cfg?.music_map ?? []).flatMap((f) => f.rooms ?? []);
/** The room on the Music map that is this child's alone: its speaker, or '' when he shares a room or has none. */
export const ownRoom = (cfg: Cfg, kid: { name: string }): string => rooms(cfg).find((r) => !!r.player && Array.isArray(r.kids) && r.kids.length === 1 && r.kids[0] === kid.name)?.player ?? '';
/** The speakers that may be his: his own room's, and any other entity Home Assistant has under the same name (one speaker often has two: its own integration's and Music Assistant's). The other names come first: the announce script usually wants those. */
export const ownSpeakers = (cfg: Cfg, kid: { name: string }, hass: Hass | undefined): string[] => {
  const p = ownRoom(cfg, kid); if (!p) return [];
  const name = String(hass?.states[p]?.attributes.friendly_name ?? '').trim().toLowerCase();
  const twins = name ? Object.keys(hass?.states ?? {}).filter((e) => e !== p && e.startsWith('media_player.') && String(hass!.states[e].attributes.friendly_name ?? '').trim().toLowerCase() === name) : [];
  return [...twins.sort(), p];
};
/** Why this child's cues cannot be spoken, in words for Settings; '' when they can. */
export const cueBlock = (cfg: Cfg, kid: KidConfig): string => {
  const s = kid.cues?.speaker ?? '';
  if (!ownRoom(cfg, kid)) return `${kid.name} has no room of his own on the Music map, so there are no spoken cues for him: a cue is only ever spoken on a child’s own speaker.`;
  if (!PLAYER.test(s)) return 'Choose his speaker.';
  if ((cfg?.kids ?? []).some((k) => k !== kid && k.name !== kid.name && (k.cues?.speaker === s || k.speaker === s))) return 'Another child has the same speaker, so it is not his alone.';
  if (rooms(cfg).some((r) => (r.player === s && !(r.kids?.length === 1 && r.kids[0] === kid.name)) || (r.zones ?? []).some((z) => z.player === s))) return 'That speaker is in a shared room.';
  return '';
};
export interface CueKid { n: string; s: string; bed: number; lv: number; m: boolean; l: boolean; w: boolean }
/** The children whose cues are on and can be spoken, with the times the automation needs (minutes after midnight). */
export const cueKids = (cfg: Cfg): CueKid[] => (cfg?.kids ?? []).filter((k) => k.cues?.on === true && !cueBlock(cfg, k)).map((k) => ({
  n: k.name, s: k.cues!.speaker!, bed: hm(k.bedtime ?? '20:00'), lv: hm(k.leave_by ?? cfg?.morning?.leave_by ?? '08:15'),
  m: k.cues!.morning !== false, l: k.cues!.leave !== false, w: k.cues!.wind !== false
})).filter((k) => k.m || k.l || k.w);
export const cuesOn = (cfg: Cfg): boolean => cueKids(cfg).length > 0;
export const cuesEntity = (hass: Hass | undefined): string | undefined => Object.keys(hass?.states ?? {}).find((e) => e.startsWith('automation.') && hass!.states[e].attributes.id === CUES_ID);
/** What each cue says. Each starts with a word, so Home Assistant never reads one as a number or a list. */
export const CUE_WORDS = { morning: (n: string): string => `Good morning, ${n}. Time to start your morning jobs.`, leave: (n: string): string => `${n}, ten minutes until it is time to leave.`, wind: (n: string): string => `${n}, it is wind-down time. One hour until bed.` };

/** Every line the automation may say, as it will say it. */
export const cueLines = (cfg: Cfg): string[] => cueKids(cfg).flatMap((k) => [k.m ? CUE_WORDS.morning(k.n) : '', k.l ? CUE_WORDS.leave(k.n) : '', k.w ? CUE_WORDS.wind(k.n) : ''].filter(Boolean));
/**
 * Makes each cue line in the house voice ahead of time, so Home Assistant holds the sound before a speaker asks for it.
 * Found on the real system (15 Nov): a line the voice has never said is not ready when a HomePod asks, the speaker gives up
 * ("failed to init decoder") and the cue is silent; the same line a minute later plays. A cue is said once a day, so without
 * this the first of each would be lost, and again after every change of voice.
 * Resolves to the lines that could NOT be made (none when there is no house voice: the script then uses the built-in one).
 */
export const warmCues = async (cfg: Cfg): Promise<string[]> => {
  if (!houseVoice()) return [];
  const cold: string[] = [];
  for (const line of cueLines(cfg)) { if (!(await voiceReady(line))) cold.push(line); }
  return cold;
};
const WARM = 'fh-cues-warm';
/** Once per screen for each set of lines and voice: the card calls this when it has its settings. */
export const warmCuesOnce = async (cfg: Cfg): Promise<void> => {
  const v = houseVoice(), lines = cueLines(cfg); if (!v || !lines.length) return;
  const key = JSON.stringify([v.tts, v.voice ?? '', v.language ?? '', lines]);
  try { if (localStorage.getItem(WARM) === key) return; } catch { /* storage unavailable: make them again */ }
  if (!(await warmCues(cfg)).length) { try { localStorage.setItem(WARM, key); } catch { /* storage unavailable */ } }
};

const j = (v: unknown): string => JSON.stringify(v);
const at = (m: number): string => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}:00`; };

/** The automation that speaks the cues, as Home Assistant's config API takes it; null when no child's cues are on. */
export const haCues = (cfg: Cfg): Record<string, unknown> | null => {
  const kids = cueKids(cfg); if (!cfg || !kids.length) return null;
  const extra = Number.isFinite(Number(cfg.bedtime_weekend_extra ?? NaN)) ? Math.max(0, Math.min(180, Number(cfg.bedtime_weekend_extra))) : 30; // (as bedtimeFor has it)
  const script = /^script\.[a-z0-9_]+$/.test(String(cfg.cues?.script ?? '')) ? cfg.cues!.script! : CUE_SCRIPT;
  const vol = typeof cfg.cues?.volume === 'number' && cfg.cues.volume >= 0 && cfg.cues.volume <= 1 ? cfg.cues.volume : CUE_VOLUME;
  const voice = cfg.voice ? resolveVoice(cfg.voice) : undefined, count = voice?.count && /^input_number\.[a-z0-9_]+$/.test(voice.count) ? voice.count : '';
  const cap = voice && Number.isFinite(Number(voice.daily_chars)) && Number(voice.daily_chars) >= 0 ? Number(voice.daily_chars) : DAILY_CHARS;
  const triggers: Record<string, unknown>[] = [];
  if (kids.some((k) => k.m)) triggers.push({ trigger: 'time', at: at(hm(cfg.morning?.start ?? '06:30')), id: 'morning' });
  kids.forEach((k, i) => {
    if (k.l) triggers.push({ trigger: 'time', at: at(k.lv - CUE_LEAVE), id: `leave_${i}` });
    // wind-down is an hour before bedtime, and bedtime is later on Friday and Saturday: one trigger for each, and the action keeps only the one that is true tonight
    if (k.w) { if (extra) { triggers.push({ trigger: 'time', at: at(k.bed - 60), id: `wind_${i}_a` }, { trigger: 'time', at: at(k.bed + extra - 60), id: `wind_${i}_b` }); } else triggers.push({ trigger: 'time', at: at(k.bed - 60), id: `wind_${i}_x` }); }
  });
  const terms = (cfg.school_terms ?? []).map(([a, z]) => ({ a, z }));
  return {
    alias: 'Family Hub: spoken cues',
    description: `Says a short cue on a child’s own speaker (never a shared room): when the school morning starts, ${CUE_LEAVE} minutes before he leaves, and when his wind-down starts. Never after his bedtime, in the house voice through ${script}, under the voice’s daily allowance, and only for a child whose cues are switched on. Written by the card from its own settings: change them in Settings, Children.`,
    mode: 'queued', max: 10,
    // (the event is for trying a cue by hand: fire family_hub_cue with { cue: 'wind_0_a' }. Every rule below still applies to it)
    triggers: [...triggers, { trigger: 'event', event_type: 'family_hub_cue', id: 'try' }],
    conditions: [{ condition: 'template', value_template: "{% set t = (trigger.event.data.cue | default('')) if trigger.platform == 'event' else trigger.id %}{{ t is string and t is match('(morning|leave_[0-9]+|wind_[0-9]+_[abx])$') }}" }],
    actions: [
      { variables: { KIDS: `{{ ${j(kids)} }}` } },
      { variables: { tid: "{{ (trigger.event.data.cue | default('')) if trigger.platform == 'event' else trigger.id }}" } },
      { variables: { kind: "{{ tid.split('_')[0] }}", idx: "{{ (tid.split('_')[1] | int(-1)) if (tid.split('_') | count) > 1 else -1 }}", part: "{{ tid.split('_')[2] if (tid.split('_') | count) > 2 else '' }}" } },
      { variables: { nowm: '{{ now().hour * 60 + now().minute }}', late: '{{ now().weekday() in [4, 5] }}', day: "{{ now().strftime('%Y-%m-%d') }}" } },
      // a school day, as the panel's morning has it: Monday to Friday, not a public holiday, inside a term when terms are given
      { variables: { school: `{%- set TERMS = ${j(terms)} -%}{{ now().weekday() < 5 and day not in ${j(cfg.public_holidays ?? [])} and (not TERMS or (TERMS | selectattr('a', 'le', day) | selectattr('z', 'ge', day) | list | count) > 0) }}` } },
      // who is spoken to: never before 5 am, never at or after his bedtime tonight, and only on a speaker Home Assistant can reach
      { variables: { who: `{%- set ns = namespace(w=[]) -%}{%- for k in KIDS -%}{%- set bed = k.bed + (${extra} if late else 0) -%}{%- if nowm >= 300 and nowm < bed and has_value(k.s) and ((kind == 'morning' and school and k.m) or (kind == 'leave' and school and k.l and loop.index0 == idx) or (kind == 'wind' and k.w and loop.index0 == idx and (part == 'x' or (part == 'b') == late))) -%}{%- set ns.w = ns.w + [loop.index0] -%}{%- endif -%}{%- endfor -%}{{ ns.w }}` } },
      { if: [{ condition: 'template', value_template: '{{ who is not iterable or who is string or (who | count) == 0 }}' }], then: [{ stop: 'Nobody to speak to now.' }] },
      { repeat: { for_each: '{{ who }}', sequence: [
        { variables: { k: '{{ KIDS[repeat.item] }}' } },
        { variables: { msg: `{{ ('Good morning, ' ~ k.n ~ '. Time to start your morning jobs.') if kind == 'morning' else ((k.n ~ ', ten minutes until it is time to leave.') if kind == 'leave' else (k.n ~ ', it is wind-down time. One hour until bed.')) }}` } },
        // the house voice's daily allowance: the helper holds today's count (a count last changed on another day is yesterday's, so it reads as nothing)
        ...(count ? [{ variables: { used: `{{ (states(${j(count)}) | float(0)) if (has_value(${j(count)}) and (states[${j(count)}].last_changed | as_local).date() == now().date()) else 0 }}` } }, { variables: { room: `{{ (used | float(0)) + (msg | length) <= ${cap} }}` } }] : [{ variables: { used: 0, room: true } }]),
        { if: [{ condition: 'template', value_template: '{{ room }}' }], then: [
          { action: script, data: { message: '{{ msg }}', speakers: ['{{ k.s }}'], volume: vol }, continue_on_error: true },
          ...(count ? [{ action: 'input_number.set_value', target: { entity_id: count }, data: { value: '{{ (used | float(0)) + (msg | length) }}' }, continue_on_error: true }] : [])
        ] }
      ] } }
    ]
  };
};

/** Whether the automation Home Assistant holds is the one this configuration would write. */
export const sameCues = (held: Record<string, unknown> | null | undefined, want: Record<string, unknown> | null): boolean => {
  if (!held || !want) return false;
  const norm = (v: unknown): unknown => Array.isArray(v) ? v.map(norm) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v as object).filter((k) => k !== 'id' || typeof (v as Record<string, unknown>).trigger === 'string').sort().map((k) => [k, norm((v as Record<string, unknown>)[k])])) : v;
  return JSON.stringify(norm(held)) === JSON.stringify(norm(want));
};

/** Writes the automation (a new one starts switched on), or switches it off when no child's cues are on any more. */
export const syncCues = async (hass: Hass, cfg: FamilyHubConfig): Promise<'made' | 'updated' | 'off' | 'none'> => {
  const want = haCues(cfg), ent = cuesEntity(hass);
  if (!want) { if (ent && hass.states[ent].state === 'on') { await hass.callService('automation', 'turn_off', { stop_actions: false }, { entity_id: ent }); return 'off'; } return 'none'; }
  await hass.callApi('POST', `config/automation/config/${CUES_ID}`, { id: CUES_ID, ...want });
  if (ent && hass.states[ent].state === 'off') await hass.callService('automation', 'turn_on', {}, { entity_id: ent });
  return ent ? 'updated' : 'made';
};
