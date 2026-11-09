import type { ThemeId } from './themes';

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
}

/** Colour slot: 1–5 map to --p-1…--p-5 in every theme, 'family' to --p-family. */
export type ColourSlot = 1 | 2 | 3 | 4 | 5 | 'family';

export interface PersonConfig { name: string; entity?: string; colour: ColourSlot }
export interface KidConfig { name: string; colour: ColourSlot }
export interface CalendarConfig { entity: string; colour: ColourSlot; name?: string }

export interface FamilyHubConfig {
  type: string;
  family_name?: string;
  theme?: ThemeId;
  weather?: string;
  people?: PersonConfig[];
  kids?: KidConfig[];
  calendars?: CalendarConfig[];
  music_player?: string;
  reminders?: string;
  announce_script?: string;
  night?: { start: string; end: string };
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
