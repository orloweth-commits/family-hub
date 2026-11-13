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
  for (const k of config.kids ?? []) if (!k.name) return 'Family Hub: every kid needs a name';
  for (const m of config.meds ?? []) if (!m?.id || !TIME_RE.test(String(m.time ?? ''))) return 'Family Hub: every medicine in "meds" needs an id and a time like "06:30"';
  for (const t of [config.night?.start, config.night?.end]) if (t !== undefined && !TIME_RE.test(String(t))) return 'Family Hub: night start and end need times like "21:00"';
  for (const c of config.calendars ?? []) if (!c.entity?.startsWith('calendar.')) return `Family Hub: "${c.entity}" isn't a calendar entity`;
  if (config.parent_pin !== undefined && !isPin(config.parent_pin)) return 'Family Hub: parent_pin should be 4–8 digits (put it in quotes)';
  if (config.sounds !== undefined && config.sounds !== true && config.sounds !== false && config.sounds !== 'quiet') return 'Family Hub: sounds should be true, false or quiet';
  const keep = (config as { keep_on?: unknown }).keep_on;
  if (keep !== undefined && !(Array.isArray(keep) && keep.every((x) => typeof x === 'string'))) return 'Family Hub: keep_on should be a list of entity ids, e.g. [light.hallway_night]';
  return null;
};
