import type { ThemeId } from './themes';
import type { LookId } from './looks';

/** Minimal slice of Home Assistant's frontend `hass` object that the card uses. */
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}
export interface Hass {
  states: Record<string, HassEntity>;
  user?: { name: string; is_admin: boolean };
  /** the dashboard being shown, and what Home Assistant knows about each dashboard (Settings uses both to find where the card is saved) */
  panelUrl?: string; panels?: Record<string, { config?: { mode?: string } | null; title?: string | null }>;
  config?: { latitude?: number; longitude?: number };
  callService(domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>): Promise<unknown>;
  callApi<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T>;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  services?: Record<string, Record<string, unknown>>;
  connection?: { subscribeMessage<T>(cb: (msg: T) => void, msg: Record<string, unknown>): Promise<() => unknown>; /** the websocket itself, for the binary sound frames of a voice pipeline */ socket?: { send(data: ArrayBufferLike | ArrayBufferView): void } };
  /** makes a path from Home Assistant (such as spoken audio) into a full address */
  hassUrl?: (path?: string) => string;
  fetchWithAuth?: (path: string, init?: RequestInit) => Promise<Response>;
  areas?: Record<string, { area_id: string; name: string; icon?: string | null }>;
  devices?: Record<string, { id: string; area_id?: string | null; name?: string | null; name_by_user?: string | null }>;
  entities?: Record<string, { entity_id: string; device_id?: string | null; area_id?: string | null; hidden?: boolean; entity_category?: string | null; name?: string | null; labels?: string[] }>;
}

/** Colour slot: 1–5 map to --p-1…--p-5 in every theme, 'family' to --p-family. */
export type ColourSlot = 1 | 2 | 3 | 4 | 5 | 'family';

export interface PersonConfig { name: string; entity?: string; colour: ColourSlot }
export interface RewardConfig { name: string; cost: number; icon?: string; /** needs a grown-up; defaults to true when cost >= 60 */ approve?: boolean; /** makes the child tonight's DJ on the Music page (default: any reward named like "DJ" or "dinner music") */ dj?: boolean;
  /** a limit: at most this many times a week, Monday to Sunday (e.g. `weekly: 1` on a screen-time reward). When it is used up the row says when it comes back. */ weekly?: number }
/** A speaker's patch of an open-plan room. */
export interface MapZoneConfig { name?: string; player: string }
/** A room on the Music page's house view. `zones` splits one open room between speakers; `kids` makes it a bedroom that goes quiet at their bedtime; `stairs` draws a stairwell. */
export interface MapRoomConfig { name?: string; player?: string; zones?: MapZoneConfig[]; size?: number; kids?: string[]; stairs?: boolean }
export interface MapFloorConfig { name?: string; rooms: MapRoomConfig[] }
export interface KidConfig {
  name: string; colour: ColourSlot;
  /** the name this child's helpers were made under, when it is not his name now (Settings writes it when a child is renamed, so todo.<id>_chores, input_number.<id>_points and the rest stay his) */
  id?: string;
  /** this child's own speaker (default: the room whose name contains theirs) and the song for timed jobs tagged @song */
  speaker?: string; tidy_song?: string;
  /** to-do list of chores; each item's description holds its points, e.g. "+10" */
  chores?: string; points?: string; lifetime?: string; streak?: string; avatar?: string; calendar?: string;
  /** picture = big icons and stars (pre-readers), mixed, or text */
  mode?: 'picture' | 'mixed' | 'text';
  rewards?: RewardConfig[];
  /** a list being worked on in Settings, Rewards: the child's page never shows it. "Put this draft live" there makes it his `rewards`. */
  rewards_draft?: RewardConfig[];
  theme?: ThemeId;
  /** starting look, e.g. "h=quiff;hc=e3b85c". For a painted character, "img=<file>" names his picture in Home Assistant's media. */
  look?: string;
  /** a painted character: his character sheet (a file in Home Assistant's media) and a few words about him for the painter. With a sheet, his studio paints his looks instead of drawing them. Keep both out of any public repository. */
  sheet?: string; about?: string;
  /** what he likes, for the nightly artwork, e.g. "swimming, clarinet, painting miniatures" */
  likes?: string;
  /** catalogue item ids this kid loves – shown first as the next unlock */
  favourites?: string[];
  /** school-night bedtime, e.g. "19:00" (later on Fri/Sat by `bedtime_weekend_extra`, 30 min unless set) */
  bedtime?: string;
  /** signature sound: clarinet | trumpet | roar */
  sound?: string;
  /** guaranteed one-to-one time, never purchasable, e.g. "Sat 10:00 with Dad" */
  special_time?: string;
  /** things to bring, by weekday (mon..fri) */
  bring?: Record<string, string[]>;
  /** age band for avatar proportions: kid | mid | teen */
  age?: 'kid' | 'mid' | 'teen';
  /** default school-morning leave time, e.g. "07:50" */
  leave_by?: string;
  /** points per star for pre-readers (stars = points / star) */
  star?: number;
  /* The next five are defaults; a grown-up can change each one on the panel (palette button on the child's page, behind the PIN). */
  /** this child's own look for his page: glass | fridge | orbit | sports (default: same as the panel) */
  look_id?: LookId;
  /** print (default) or hand, where the look offers handwriting */
  font?: 'print' | 'hand';
  /** calm mode on his page: no looping motion and nothing travels (default false: his page is animated until calm is chosen, here or in his own settings) */
  calm?: boolean;
  /** interface sounds on his page: full (default) | soft | off */
  sound_level?: 'full' | 'soft' | 'off';
  /** one job at a time (Now / Next, with "Show all" one tap away); default true for every child */
  focus?: boolean;
  /** older mode: a plainer page for a child who has outgrown stars and ranks. No rank names, no pictures on his jobs, his week first, and a private "ask for a chat" in place of the feelings faces */
  older?: boolean;
  /** Ask (the AI helper) for this child: `pictures` (picture prompts only: no typing, no talking), `full`, or `off`. Unset: pictures for a child in picture mode, full otherwise.
   *  As soon as any child has `ask` or `ask_minutes`, the Ask button asks who is asking, and each child gets his own kind of Ask and his own daily time. */
  ask?: 'pictures' | 'full' | 'off';
  /** minutes of Ask a day for this child (default 15; 0 = no limit) */
  ask_minutes?: number;
}
export interface MedConfig { id: string; label: string; time: string; who?: string }
export interface BringRule { match: string; item: string; kid?: string }
export interface StationConfig { name: string; match?: string; id?: string }
export interface GroceryRecipient { name: string; colour: ColourSlot; notify?: string }
/** A calendar on the planner. `only` keeps just the events whose title has one of these words; `hide` drops the events whose title has one of them (both ignore capitals). For a shared holidays calendar: `hide: [Canberra Day, Melbourne Cup]`. */
export interface CalendarConfig { entity: string; colour: ColourSlot; name?: string; only?: string[]; hide?: string[] }
/** Whether a calendar's own word filter lets an event through. */
export const calShows = (c: Pick<CalendarConfig, 'only' | 'hide'>, title: string): boolean => {
  const t = title.toLowerCase(), has = (w: string): boolean => !!w.trim() && t.includes(w.trim().toLowerCase());
  if (c.only?.length && !c.only.some(has)) return false;
  return !(c.hide ?? []).some(has);
};

/**
 * The card's configuration. Most of it can be changed on the panel, in Settings (the "i" button, then the cog; parents only): children,
 * rewards, mornings, medicines, the PIN, the house, music moments, and people and safety. The wiring (which calendars, lists, speakers
 * and scripts) is changed here in YAML and is shown read-only under Settings, Advanced.
 */
export interface FamilyHubConfig {
  /** UI scale. Omit for automatic (1280×800 design, scaled up on bigger screens). */
  scale?: number;
  type: string;
  family_name?: string;
  theme?: ThemeId;
  /** calm mode (no looping motion, no tilt): true = everywhere. Otherwise each child's page follows his own choice (animated unless he, or a grown-up, has chosen calm) and the shared pages move */
  calm?: boolean;
  /** whole design language: glass (default), fridge, orbit or sports (Home Ground); the panel's palette button changes it */
  look?: LookId;
  weather?: string;
  /** the Weather page: where to find the hourly forecast, the Bureau's sensors, and whether to show the radar and wind maps; false leaves the page out */
  weather_page?: import('./weather').WeatherPageConfig | false;
  people?: PersonConfig[];
  kids?: KidConfig[];
  calendars?: CalendarConfig[];
  music_player?: string;
  reminders?: string;
  announce_script?: string;
  groceries?: string;
  grocery_usuals?: string[];
  grocery_recipients?: GroceryRecipient[];
  night?: { start: string; end: string };
  /** the grown-ups' PIN, 4–8 digits in quotes. It opens Settings (the cog on the house-info sheet), where it can also be changed. */
  parent_pin?: string;
  /** how many minutes later every child's bedtime is on Friday and Saturday nights (default 30; 0 keeps the same time all week) */
  bedtime_weekend_extra?: number;
  music_players?: string[];
  /** the house as the Music page draws it: floors from the top down, rooms left to right (without it, one room per speaker) */
  music_map?: MapFloorConfig[];
  /** speakers to leave off the Music page altogether, e.g. a TV that already plays through another speaker */
  music_hide?: string[];
  /** with a music_map, show only the speakers it names (so speakers discovered elsewhere never appear) and keep one that cannot be reached in its place, marked offline. On unless set to false. */
  music_lock?: boolean;
  /** the extra ways of seeing the rooms offered by the Music page's view button, beside House and Scene which are always there: any of dial, desk, cables (the Crate) and list. None unless named. */
  music_views?: string[];
  /** touch sounds from the panel's own speaker (taps, ticks, keys): true (default), 'quiet' (softer) or false. The kitchen timer's alarm always sounds. Each screen can also choose in the look sheet. */
  sounds?: boolean | 'quiet';
  /** quiet life behind the page (twinkling stars, glints on the water, now and then a visitor); false turns it off. Calm mode and the device's "reduce motion" setting always turn it off. */
  ambient?: boolean;
  /** show one visitor straight away (for the preview and tests) */
  ambient_demo?: string;
  /** Call a room: how loud a call is spoken (0–100, default 70; Music Assistant speakers only), and the voice: a language such as en-AU (the default) and, optionally, one of that language's voices by name */
  call_volume?: number; call_language?: string; call_voice?: string;
  /** the moment pads on the mixing desk (up to four): what each one plays, where, and how loud */
  music_moments?: MomentConfig[];
  /** song or playlist (name or URI) for timed jobs tagged @song, and how long the Music page's sleep timer runs */
  tidy_song?: string; music_sleep_minutes?: number;
  radio?: (string | StationConfig)[];
  radio_source?: string;
  photos?: string;
  photo_minutes?: number;
  idle_seconds?: number;
  /** calendar events containing these words are shown only as a discreet chip */
  private?: string[];
  meds?: MedConfig[];
  /** Ask for the parent PIN before recording or removing medicine (default true when a PIN is set). */
  meds_pin?: boolean;
  /** a to-do list that keeps the record of other medicine given (paracetamol and the like), so every screen shows the same record; without it the record stays on this screen only */
  med_log?: string;
  /** the medicines offered when logging something else; Paracetamol and Ibuprofen unless set */
  med_extras?: string[];
  /** bin night: `day` is the NIGHT the bins go out, 0 (Sunday) to 6, which is the evening before the truck comes (a Tuesday-morning collection is `day: 1`, Monday); bins that go out every week, bins that take turns, and a date on which the first of `alternate` went out */
  bins?: { day: number; always?: string[]; alternate?: string[]; anchor?: string };
  /** grown-ups who can give meds / approve */
  parents?: string[];
  school_terms?: [string, string][];
  public_holidays?: string[];
  morning?: { start?: string; end?: string; leave_by?: string; /** minutes to leave before a child's first morning event */ travel?: number };
  bring_rules?: BringRule[];
  jar?: { target?: number; reward?: string; script?: string };
  /** the PIN pad puts its digits in a new order each time it opens, so the PIN cannot be learnt by watching where a finger goes (default true) */
  pin_shuffle?: boolean;
  /** seconds "All off" waits, with a Cancel button, before the lights go out (default 3; 0 = at once) */
  all_off_wait?: number;
  /** lights switched by "All on" (defaults to every light) */
  all_on?: string[];
  /** things "All off" leaves on (a night light, a fish tank): entity ids. A group named here keeps everything in it on. Absent: All off turns every light off. */
  keep_on?: string[];
  /** quiet hours: lights and Ask count as "after bedtime". `mute: true` also silences the panel's touch sounds in those hours (default: they keep playing). */
  quiet?: { start?: string; end?: string; mute?: boolean };
  /** the house-info sheet (the "i" button). `lines` like "Dad: 0400 000 000" become contacts; other lines are notes. */
  babysitter?: { title?: string; lines?: string[]; address?: string; contacts?: { name: string; phone: string }[]; wifi?: { name: string; password?: string }; notes?: string[] };
  /** the red hold-to-send button on the house-info sheet: notify services to alert (e.g. notify.mobile_app_dads_phone), as a critical alert that sounds through silent mode */
  emergency?: { notify: string[]; who?: string; message?: string };
  home_hide?: string[];
  /** Ask: a chat with an AI helper for the children (the speech-bubble button in the header). `agent` is a conversation entity; `pipeline` is the id of an Assist pipeline, for talking instead of typing; `name` is what the helper is called (default "Ask"). After any child's bedtime and in quiet hours it opens only with the parent PIN, unless `pin_after_bedtime` is false. What the helper may talk about is set in Home Assistant, on the agent itself. */
  chat?: { agent: string; pipeline?: string; name?: string; pin_after_bedtime?: boolean; /** a text-to-speech entity (say tts.openai_tts): Ask speaks its typed and tapped answers in that voice, falling back to the screen's own voice if it cannot */ tts?: string; /** one of that engine's voices */ tts_voice?: string; /** the language and accent it speaks, such as en-AU */ tts_language?: string };
  /** the screensaver, the nightly artwork and the painted characters (Settings, Pictures) */
  art?: import('./artlib').ArtConfig;
  /** trust guards: calendar freshness, the wall panel's heartbeat, the nightly snapshot and the private use counts (trust.ts) */
  health?: import('./trust').HealthConfig;
  /** the house voice: one Home Assistant text-to-speech engine and voice for everything said aloud (read-aloud on the children's pages, Ask unless `chat.tts` says otherwise, Call a room, the dinner call). `files` is where the recorded fixed lines live, a media id with {line} in it; `daily_chars` caps the new characters a day (default 1500); `count` is an input_number holding today's count, shared by every screen. See voice.ts */
  voice?: import('./voice').VoiceConfig;
  /** calendar used by the quick-add sheet */
  add_calendar?: string;
  /** when adding an event, look places and addresses up on the internet as they are typed (Photon, OpenStreetMap data, Australia only); false keeps the Where box to plain typing */
  address_search?: boolean;
}

export interface CalEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  colour: ColourSlot;
  who: string;
  /** where it is, when the calendar says */
  location?: string;
  /** the calendar's own notes about it, shown as plain text when the event is opened */
  description?: string;
  /** where it lives, so it can be changed or deleted: the calendar entity, the event's id, and (for one of a repeating series) which one */
  entity?: string;
  uid?: string;
  recurrenceId?: string;
  repeats?: boolean;
  /** how it repeats, when the calendar says (an RRULE) */
  rrule?: string;
}

/** Whether Ask is set by child: true once any child has `ask` or `ask_minutes`. Until then Ask opens for anyone, as it always did. */
export const askByChild = (kids: KidConfig[] | undefined): boolean => (kids ?? []).some((k) => k.ask !== undefined || k.ask_minutes !== undefined);
/** A child's kind of Ask and his minutes a day (0 = no limit). */
export const askFor = (k: KidConfig): { mode: 'pictures' | 'full' | 'off'; minutes: number } => ({ mode: k.ask ?? (k.mode === 'picture' ? 'pictures' : 'full'), minutes: Math.max(0, Number.isFinite(k.ask_minutes) ? Number(k.ask_minutes) : 15) });

export const slotVar = (c: ColourSlot | undefined): string => (c === 'family' || c === undefined ? 'var(--p-family)' : `var(--p-${c})`);

const slug = (n: string): string => n.toLowerCase().replace(/[^a-z0-9]+/g, '_');
/** Kid entity ids, defaulting to <name>_points etc. */
export const kidEntities = (k: KidConfig) => {
  const s = slug(k.id ?? k.name);
  return {
    chores: k.chores ?? `todo.${s}_chores`, points: k.points ?? `input_number.${s}_points`,
    lifetime: k.lifetime ?? `input_number.${s}_lifetime_points`, streak: k.streak ?? `input_number.${s}_streak`,
    avatar: k.avatar ?? `input_text.${s}_avatar`, calendar: k.calendar ?? `calendar.${s}`,
    week: `input_text.${s}_week`, goal: `input_text.${s}_goal`, grow: `input_number.${s}_grow`, slug: s
  };
};
export const num = (hass: Hass | undefined, id: string): number => {
  const v = Number(hass?.states[id]?.state);
  return Number.isFinite(v) ? v : 0;
};

/** A moment pad: one press plays something for an occasion. `find` is searched for (a playlist unless `kind` says otherwise) or `uri` is played as it is; `rooms` are speakers (the first leads, the rest join it) or `all` for every room, and without them it plays in the room in focus. */
export interface MomentConfig { name: string; icon?: string; find?: string; uri?: string; kind?: string; rooms?: string[] | 'all'; volume?: number; shuffle?: boolean }

/** The bins a household has here: red (general waste), yellow (recycling) and green (garden). Anything else saved is not a bin. */
export const BINS: Record<string, { col: string; what: string }> = { red: { col: '#d93a3a', what: 'general waste' }, yellow: { col: '#f2c230', what: 'recycling' }, green: { col: '#2e9e4f', what: 'garden' } };
export const isBin = (n: string): boolean => Object.prototype.hasOwnProperty.call(BINS, String(n).toLowerCase());
