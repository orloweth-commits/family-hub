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
  callService(domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>): Promise<unknown>;
  callApi<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T>;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  services?: Record<string, Record<string, unknown>>;
  connection?: { subscribeMessage<T>(cb: (msg: T) => void, msg: Record<string, unknown>): Promise<() => void> };
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
  /** this child's own speaker (default: the room whose name contains theirs) and the song for timed jobs tagged @song */
  speaker?: string; tidy_song?: string;
  /** to-do list of chores; each item's description holds its points, e.g. "+10" */
  chores?: string; points?: string; lifetime?: string; streak?: string; avatar?: string; calendar?: string;
  /** picture = big icons and stars (pre-readers), mixed, or text */
  mode?: 'picture' | 'mixed' | 'text';
  rewards?: RewardConfig[];
  theme?: ThemeId;
  /** starting look, e.g. "h=quiff;hc=e3b85c" */
  look?: string;
  /** catalogue item ids this kid loves – shown first as the next unlock */
  favourites?: string[];
  /** school-night bedtime, e.g. "19:00" (+30 min on Fri/Sat) */
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
  /** this child's own look for his page: glass | fridge | orbit (default: same as the panel) */
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

export interface FamilyHubConfig {
  /** UI scale. Omit for automatic (1280×800 design, scaled up on bigger screens). */
  scale?: number;
  type: string;
  family_name?: string;
  theme?: ThemeId;
  /** calm mode (no looping motion, no tilt): true = everywhere, false = never; default is on for the kids' pages only */
  calm?: boolean;
  /** whole design language: glass (default), fridge or orbit; the panel's palette button changes it */
  look?: LookId;
  weather?: string;
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
  parent_pin?: string;
  music_players?: string[];
  /** the house as the Music page draws it: floors from the top down, rooms left to right (without it, one room per speaker) */
  music_map?: MapFloorConfig[];
  /** speakers to leave off the Music page altogether, e.g. a TV that already plays through another speaker */
  music_hide?: string[];
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
  /** grown-ups who can give meds / approve */
  parents?: string[];
  school_terms?: [string, string][];
  public_holidays?: string[];
  morning?: { start?: string; end?: string; leave_by?: string; /** minutes to leave before a child's first morning event */ travel?: number };
  bring_rules?: BringRule[];
  jar?: { target?: number; reward?: string; script?: string };
  /** lights switched by "All on" (defaults to every light) */
  all_on?: string[];
  quiet?: { start?: string; end?: string };
  babysitter?: { title?: string; lines?: string[] };
  home_hide?: string[];
  /** calendar used by the quick-add sheet */
  add_calendar?: string;
}

export interface CalEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  colour: ColourSlot;
  who: string;
}

export const slotVar = (c: ColourSlot | undefined): string => (c === 'family' || c === undefined ? 'var(--p-family)' : `var(--p-${c})`);

const slug = (n: string): string => n.toLowerCase().replace(/[^a-z0-9]+/g, '_');
/** Kid entity ids, defaulting to <name>_points etc. */
export const kidEntities = (k: KidConfig) => {
  const s = slug(k.name);
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
