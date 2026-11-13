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
export interface RewardConfig { name: string; cost: number; icon?: string; /** needs a grown-up; defaults to true when cost >= 60 */ approve?: boolean; /** makes the child tonight's DJ on the Music page (default: any reward named like "DJ" or "dinner music") */ dj?: boolean }
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
  /** calm mode on his page (default true) */
  calm?: boolean;
  /** interface sounds on his page: full (default) | soft | off */
  sound_level?: 'full' | 'soft' | 'off';
  /** one job at a time (Now / Next / Later); default true except in text mode */
  focus?: boolean;
}
export interface MedConfig { id: string; label: string; time: string; who?: string }
export interface BringRule { match: string; item: string; kid?: string }
export interface StationConfig { name: string; match?: string; id?: string }
export interface GroceryRecipient { name: string; colour: ColourSlot; notify?: string }
export interface CalendarConfig { entity: string; colour: ColourSlot; name?: string }

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
  /** calm mode (no looping motion, no tilt): true = everywhere, false = never; default is on for the kids' pages only */
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
  /** bin night: `day` 0 (Sunday) to 6, bins that go out every week, bins that take turns, and a date on which the first of `alternate` went out */
  bins?: { day: number; always?: string[]; alternate?: string[]; anchor?: string };
  /** grown-ups who can give meds / approve */
  parents?: string[];
  school_terms?: [string, string][];
  public_holidays?: string[];
  morning?: { start?: string; end?: string; leave_by?: string; /** minutes to leave before a child's first morning event */ travel?: number };
  bring_rules?: BringRule[];
  jar?: { target?: number; reward?: string; script?: string };
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
  chat?: { agent: string; pipeline?: string; name?: string; pin_after_bedtime?: boolean };
  /** the screensaver, the nightly artwork and the painted characters (Settings, Pictures) */
  art?: import('./artlib').ArtConfig;
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
}

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
