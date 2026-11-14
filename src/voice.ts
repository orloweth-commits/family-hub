import type { Hass } from './types';

/* ------------------------------------------------------------------ *
 * The house voice: one voice for everything the house says aloud.
 *
 *   voice: { tts, voice, language }   a Home Assistant text-to-speech engine, one of its voices, its language
 *   voice.files                       where the recorded fixed lines live: a media id with {line} in it
 *   voice.daily_chars                 how many NEW characters a day may be sent to the engine (default 1500)
 *   voice.count                       an input_number that holds today's count, so every screen shares one allowance
 *
 * Changing the voice: name every voice the house may use under `voice.voices` and the one in use under `voice.use`
 * (Settings, House, "The house voice" writes it). Everything below then speaks in it:
 *
 *   voice.voices   [{ name, voice, files? }]   `voice` is the engine's own id for it; `files` is where THAT voice's recorded lines live
 *   voice.use      the name of the one in use (the first, when none is named)
 *   voice.sync     { voice: input_text.…, files: input_text.…, pipeline: true }   the same choice, kept for Home Assistant's own
 *                  scripts and automations to read, and (pipeline) written to Ask's Assist pipeline for spoken conversations
 *
 * EVERY PLACE THE APP SPEAKS (keep this list true; a new one must go through say(), voiceUrl() or voiceReady()):
 *   1. Read-aloud on a screen: say() in util.ts. The youngest's page (jobs, stars, rewards, feelings), the morning board's "Done!",
 *      the Style Studio, the weather's "what to wear", Settings' "hear it".                         -> the house voice, then the screen's own
 *   2. Ask, typed and tapped answers: FhChat._speak.                                                -> `chat.tts` if set, otherwise the house voice
 *   3. Ask, spoken conversations (microphone): Home Assistant's Assist pipeline makes the speech.   -> the pipeline's own voice (voice.sync.pipeline)
 *   4. Call a room, a ready message: FhMusic._call plays the voice's recording (lineReady) when that voice has one.
 *   5. Call a room, a typed message or a ready one with no recording: voiceReady().                 -> the house voice, then the built-in voice
 *   6. The dinner call: the Dinner button runs `announce_script` with fh_line, fh_file and fh_voice. -> the recording, else the script speaks
 *   7. Anything Home Assistant says by itself through the announce script (the kitchen timer).      -> the script reads voice.sync's helpers
 *   Fallbacks, which are not the house voice and do not change with it: the screen's own voice (the browser's, Australian when it
 *   has one) and Home Assistant's built-in voice on a speaker (`call_language`, `call_voice`).
 *
 * Every paid voice call has a cap and a fallback. A phrase this screen has heard before costs nothing (Home Assistant
 * keeps the sound), so it is always allowed; a new phrase is allowed while the day's allowance lasts. Past that, or
 * when the engine does not answer, the caller falls back: the screen's own voice on the panel, the built-in voice on a speaker.
 * ------------------------------------------------------------------ */
export interface NamedVoice { name: string; voice: string; files?: string }
export interface VoiceSync { voice?: string; files?: string; pipeline?: boolean }
export interface VoiceConfig { tts: string; voice?: string; language?: string; daily_chars?: number; count?: string; files?: string; use?: string; voices?: NamedVoice[]; sync?: VoiceSync }
/** The voices a house has named, and the one in use: the one `use` names, else the first. None when no list is given. */
export const voiceList = (c: VoiceConfig | null | undefined): NamedVoice[] => (Array.isArray(c?.voices) ? c!.voices!.filter((v) => v && typeof v.name === 'string' && v.name.trim() && typeof v.voice === 'string' && v.voice) : []);
export const voiceInUse = (c: VoiceConfig | null | undefined): NamedVoice | undefined => { const l = voiceList(c); return l.find((v) => v.name === c?.use) ?? l[0]; };
/** The configuration as everything else reads it: with a list of voices, the one in use supplies `voice` and `files` (a voice with no recordings has none: its lines are spoken live). */
export const resolveVoice = (c: VoiceConfig): VoiceConfig => { const v = voiceInUse(c); if (!v) return c; const { files: _f, ...rest } = c; return { ...rest, voice: v.voice, ...(v.files ? { files: v.files } : {}) }; };
/** One engine and voice to speak in: the house voice, or Ask's own when it is set differently. */
export interface Engine { tts: string; voice?: string; language?: string }

/** The six ready phrases of Call a room, in the order of `CALLS` in music.ts; `dinner` is also the dinner call. */
export const LINES = ['dinner', 'getready', 'kitchen', 'bedtime5', 'leave', 'loveyou'] as const;
export type Line = (typeof LINES)[number];
export const DAILY_CHARS = 1500;

let cfg: VoiceConfig | null = null;
let hassOf: () => Hass | undefined = () => undefined;
export const setVoice = (c: VoiceConfig | null | undefined, h: () => Hass | undefined): void => { cfg = c && typeof c.tts === 'string' && c.tts.startsWith('tts.') ? resolveVoice(c) : null; hassOf = h; };
export const houseVoice = (): VoiceConfig | null => cfg;

/* ---------------- the daily allowance ---------------- */
const DAY = 'fh-voice-day', KNOWN = 'fh-voice-known', KEEP = 400;
const today = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const read = <T>(k: string, d: T): T => { try { return (JSON.parse(localStorage.getItem(k) || 'null') as T) ?? d; } catch { return d; } };
const write = (k: string, v: unknown): void => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };
const hash = (s: string): string => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const key = (text: string, e: Engine): string => hash(`${e.tts}|${e.voice ?? ''}|${e.language ?? ''}|${text.trim()}`);
const known = (text: string, e: Engine): boolean => read<string[]>(KNOWN, []).includes(key(text, e));
/** Characters sent to the engine today: this screen's own count, or the shared helper's when that is higher. */
export const voiceUsed = (): number => {
  const own = read<{ d?: string; n?: number }>(DAY, {}), mine = own.d === today() ? Number(own.n) || 0 : 0;
  const st = cfg?.count ? hassOf()?.states[cfg.count] as { state: string; last_changed?: string } | undefined : undefined;
  const changed = st?.last_changed ? new Date(st.last_changed) : null;
  const shared = st && changed && changed.toDateString() === new Date().toDateString() ? Number(st.state) || 0 : 0;
  return Math.max(mine, shared);
};
export const voiceCap = (): number => { const n = Number(cfg?.daily_chars); return Number.isFinite(n) && n >= 0 ? n : DAILY_CHARS; };
/** May this be spoken in the paid voice? Yes if it has been heard before (it costs nothing), or if today's allowance covers it. */
export const voiceAllowed = (text: string, e: Engine | null = cfg): boolean => !!e && (known(text, e) || voiceUsed() + text.trim().length <= voiceCap());
/** Counts a phrase that was just made. A phrase heard before is not counted again. */
export const voiceSpent = (text: string, e: Engine | null = cfg): void => {
  if (!e || known(text, e)) return;
  const n = voiceUsed() + text.trim().length;
  write(DAY, { d: today(), n });
  write(KNOWN, [...read<string[]>(KNOWN, []), key(text, e)].slice(-KEEP));
  const h = hassOf();
  if (cfg?.count && h?.states[cfg.count]) void Promise.resolve(h.callService('input_number', 'set_value', { value: n }, { entity_id: cfg.count })).catch(() => { /* the screen's own count still holds */ });
};

/* ---------------- speaking ---------------- */
const within = <T>(p: Promise<T>, ms: number): Promise<T> => new Promise<T>((ok, no) => { const t = window.setTimeout(() => no(new Error('timeout')), ms); p.then((v) => { clearTimeout(t); ok(v); }, (x) => { clearTimeout(t); no(x); }); });
const full = (h: Hass, u: string): string => /^(https?|data|blob):/.test(u) ? u : h.hassUrl ? h.hassUrl(u) : u;
/** What Home Assistant is asked for when it makes speech. */
export const speechBody = (text: string, e: Engine): Record<string, unknown> => ({ engine_id: e.tts, message: text, cache: true, ...(e.language ? { language: e.language } : {}), ...(e.voice ? { options: { voice: e.voice } } : {}) });
/**
 * The address of `text` spoken in the house voice (or in `e`), or '' when there is no such voice, today's allowance
 * is used up, or Home Assistant does not answer in time. `url` is for this screen; `abs` is the full address a speaker can fetch.
 */
export async function voiceUrl(text: string, e: Engine | null = cfg, ms = 8000): Promise<{ url: string; abs: string }> {
  const h = hassOf(), none = { url: '', abs: '' };
  if (!e?.tts || !h?.callApi || !text.trim() || !voiceAllowed(text, e)) return none;
  try {
    const r = await within(Promise.resolve(h.callApi<{ url?: string; path?: string }>('POST', 'tts_get_url', speechBody(text, e))), ms);
    const url = r?.path ?? r?.url;
    if (!url) return none;
    return { url: full(h, String(url)), abs: String(r?.url ?? full(h, String(url))) };
  } catch { return none; }
}
/**
 * For a speaker, which cannot tell us that the sound never came: make the speech and fetch it here first. Only a sound
 * that really arrived is counted and handed on; anything else (no credit left, the engine down) returns '' so the caller
 * can use the built-in voice instead.
 */
export async function voiceReady(text: string, e: Engine | null = cfg, ms = 9000): Promise<string> {
  const u = await voiceUrl(text, e, ms);
  if (!u.url) return '';
  try {
    const r = await within(fetch(u.url), ms);
    if (!r.ok || !(await within(r.blob(), ms)).size) return '';
    voiceSpent(text, e);
    return u.abs;
  } catch { return ''; }
}

/* ---------------- recorded lines ---------------- */
/** The media id of a recorded line, or '' when no recordings are set. */
export const lineFile = (line: Line): string => cfg?.files && cfg.files.includes('{line}') ? cfg.files.replace('{line}', line) : '';
const fileSeen = new Map<string, { at: number; ok: boolean }>();
/** The recorded line's media id if the file is really there (asked of Home Assistant, remembered for ten minutes), otherwise ''. */
export async function lineReady(line: Line): Promise<string> {
  const id = lineFile(line), h = hassOf();
  if (!id || !h?.callWS) return '';
  const was = fileSeen.get(id);
  if (was && Date.now() - was.at < 600_000) return was.ok ? id : '';
  let ok = false;
  try {
    const r = await within(h.callWS<{ url?: string }>({ type: 'media_source/resolve_media', media_content_id: id }), 6000);
    // Home Assistant gives an address for a file that is not there, and answers HEAD with 200 for it (seen on the real system, 14 Nov 2026):
    // only asking for the first few bytes tells a real recording from a missing one
    if (r?.url) { const res = await within(fetch(full(h, r.url), { headers: { Range: 'bytes=0-15' } }), 6000); ok = res.ok && (await within(res.blob(), 6000)).size > 0; }
  } catch { ok = false; }
  fileSeen.set(id, { at: Date.now(), ok });
  return ok ? id : '';
}
/** Forget what is known about the recordings (after a settings change, and in tests). */
export const forgetLines = (): void => fileSeen.clear();

/* ---------------- keeping Home Assistant's side in step ---------------- */
/**
 * Home Assistant speaks by itself too (the announce script, Ask's spoken conversations), and cannot read the card. So the choice is
 * copied to where it can: two text helpers, and Ask's Assist pipeline. Called when the card has its settings and Home Assistant;
 * it writes only what differs, so it is safe to call often. Returns what it changed (for the tests).
 */
export async function voiceSync(h: Hass | undefined, pipeline?: string): Promise<string[]> {
  const c = cfg, s = c?.sync, did: string[] = [];
  if (!h || !c || !s) return did;
  const put = async (id: string | undefined, value: string): Promise<void> => {
    if (!id || !h.states[id] || h.states[id].state === value) return;
    try { await h.callService('input_text', 'set_value', { value }, { entity_id: id }); did.push(id); } catch { /* tried again next time */ }
  };
  await put(s.voice, c.voice ?? ''); await put(s.files, c.files ?? '');
  if (s.pipeline && pipeline && c.voice && h.user?.is_admin && h.callWS) {
    try {
      const all = await h.callWS<{ pipelines: (Record<string, unknown> & { id: string; tts_engine?: string; tts_voice?: string })[] }>({ type: 'assist_pipeline/pipeline/list' });
      const p = all.pipelines.find((x) => x.id === pipeline);
      if (p && p.tts_engine === c.tts && p.tts_voice !== c.voice) { const { id, ...rest } = p; await h.callWS({ type: 'assist_pipeline/pipeline/update', pipeline_id: id, ...rest, tts_voice: c.voice }); did.push('pipeline'); }
    } catch { /* Ask's typed answers still use the house voice */ }
  }
  return did;
}
