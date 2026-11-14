import type { FamilyHubConfig } from './types';

/* ------------------------------------------------------------------ *
 * The rules a card configuration must pass. The card applies them when
 * Home Assistant hands it a configuration (setConfig) and Settings applies
 * the same ones before it saves, so a save can never write a configuration
 * that the card would then refuse.
 * ------------------------------------------------------------------ */

/** A time as the configuration writes it: "6:30", "06:30" or "06:30:00". */
export const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
/** A real time of day ("24:10" and "7:75" are not). */
export const isTime = (t: unknown): boolean => { if (!TIME_RE.test(String(t ?? ''))) return false; const [h, m] = String(t).split(':').map(Number); return h < 24 && m < 60; };
export const isPin = (p: unknown): boolean => /^\d{4,8}$/.test(String(p ?? ''));

/** The first thing wrong with a configuration, in words for the person who wrote it, or null when the card accepts it. */
export const configError = (config: FamilyHubConfig | null | undefined): string | null => {
  if (!config) return 'Family Hub: missing configuration';
  for (const k of config.kids ?? []) {
    if (!k.name) return 'Family Hub: every kid needs a name';
    if (k.ask !== undefined && !['pictures', 'full', 'off'].includes(String(k.ask))) return `Family Hub: ask for ${k.name} should be pictures, full or off`;
    if (k.ask_minutes !== undefined && !(typeof k.ask_minutes === 'number' && Number.isFinite(k.ask_minutes) && k.ask_minutes >= 0)) return `Family Hub: ask_minutes for ${k.name} should be a number of minutes, 0 or more`;
    for (const r of [...(k.rewards ?? []), ...(k.rewards_draft ?? [])]) if (r?.weekly !== undefined && !(typeof r.weekly === 'number' && Number.isFinite(r.weekly) && r.weekly >= 0)) return `Family Hub: weekly on “${r.name}” should be a number of times a week, 0 or more`;
  }
  for (const m of config.meds ?? []) if (!m?.id || !TIME_RE.test(String(m.time ?? ''))) return 'Family Hub: every medicine in "meds" needs an id and a time like "06:30"';
  for (const t of [config.night?.start, config.night?.end]) if (t !== undefined && !TIME_RE.test(String(t))) return 'Family Hub: night start and end need times like "21:00"';
  for (const c of config.calendars ?? []) {
    if (!c.entity?.startsWith('calendar.')) return `Family Hub: "${c.entity}" isn't a calendar entity`;
    for (const k of ['only', 'hide'] as const) if (c[k] !== undefined && !(Array.isArray(c[k]) && c[k]!.every((w) => typeof w === 'string'))) return `Family Hub: ${k} on "${c.entity}" should be a list of words, e.g. ${k}: [Western Australia]`;
  }
  const wait = (config as { all_off_wait?: unknown }).all_off_wait;
  if (wait !== undefined && !(typeof wait === 'number' && Number.isFinite(wait) && wait >= 0 && wait <= 30)) return 'Family Hub: all_off_wait should be a number of seconds, 0 to 30';
  if (config.pin_shuffle !== undefined && typeof config.pin_shuffle !== 'boolean') return 'Family Hub: pin_shuffle should be true or false';
  if (config.parent_pin !== undefined && !isPin(config.parent_pin)) return 'Family Hub: parent_pin should be 4–8 digits (put it in quotes)';
  if (config.sounds !== undefined && config.sounds !== true && config.sounds !== false && config.sounds !== 'quiet') return 'Family Hub: sounds should be true, false or quiet';
  const keep = (config as { keep_on?: unknown }).keep_on;
  if (keep !== undefined && !(Array.isArray(keep) && keep.every((x) => typeof x === 'string'))) return 'Family Hub: keep_on should be a list of entity ids, e.g. [light.hallway_night]';
  const art = (config as { art?: Record<string, unknown> }).art;
  if (art !== undefined) {
    if (!art || typeof art !== 'object' || Array.isArray(art)) return 'Family Hub: art should be a group of options, e.g. art: { idle_minutes: 3 }';
    for (const k of ['idle_minutes', 'interval_minutes', 'cap', 'cost', 'looks_per_day', 'camera_sensitivity', 'camera_margin', 'backlight_art', 'backlight_night']) if (art[k] !== undefined && !(typeof art[k] === 'number' && Number.isFinite(art[k]) && (art[k] as number) >= 0)) return `Family Hub: art.${k} should be a number, 0 or more`;
    if (art.presence !== undefined && !['none', 'sensor', 'camera'].includes(String(art.presence))) return 'Family Hub: art.presence should be none, sensor or camera';
    for (const k of ['presence_entity', 'backlight', 'list', 'painter']) if (art[k] !== undefined && !/^[a-z_]+\.[a-z0-9_]+$/.test(String(art[k]))) return `Family Hub: art.${k} should be an entity id, e.g. binary_sensor.kitchen_presence`;
  }
  const voice = (config as { voice?: Record<string, unknown> }).voice;
  if (voice !== undefined) {
    if (!voice || typeof voice !== 'object' || Array.isArray(voice) || !/^tts\.[a-z0-9_]+$/.test(String(voice.tts ?? ''))) return 'Family Hub: voice needs a text-to-speech entity, e.g. voice: { tts: tts.home_assistant_cloud }';
    if (voice.daily_chars !== undefined && !(typeof voice.daily_chars === 'number' && Number.isFinite(voice.daily_chars) && voice.daily_chars >= 0)) return 'Family Hub: voice.daily_chars should be a number of characters a day, 0 or more';
    if (voice.count !== undefined && !/^input_number\.[a-z0-9_]+$/.test(String(voice.count))) return 'Family Hub: voice.count should be an input_number, e.g. input_number.fh_voice_chars';
    if (voice.files !== undefined && !String(voice.files).includes('{line}')) return 'Family Hub: voice.files should be a media id with {line} in it, e.g. media-source://media_source/local/line-{line}.mp3';
  }
  return null;
};
