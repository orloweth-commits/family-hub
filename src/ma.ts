import type { Hass, HassEntity, KidConfig } from './types';

/* ------------------------------------------------------------------ *
 * Music helpers. When Music Assistant is installed its players are used
 * (they can search every service, queue, group and announce); otherwise
 * the page falls back to whatever media players the card was given.
 * ------------------------------------------------------------------ */

export interface MediaHit { name: string; uri: string; type: string; img?: string; sub?: string }
export interface QueueInfo { items: number; shuffle: boolean; repeat: string; current?: MediaHit; next?: MediaHit }
export interface ShelfItem extends MediaHit { uid: string; calm: boolean }

const platform = (h: Hass, id: string): string => ((h.entities?.[id] as { platform?: string } | undefined)?.platform ?? '');
const alive = (s?: HassEntity): s is HassEntity => !!s && s.state !== 'unavailable';

/** Music Assistant's own players (empty when it is not installed). */
export const maPlayers = (h: Hass): HassEntity[] =>
  Object.keys(h.states).filter((id) => id.startsWith('media_player.') && platform(h, id) === 'music_assistant' && !h.entities?.[id]?.hidden).map((id) => h.states[id]).filter(alive);
export const hasMa = (h: Hass): boolean => !!h.services?.music_assistant && maPlayers(h).length > 0;

/** The rooms the page offers: Music Assistant's players when present, else the configured (or all) media players. */
export const rooms = (h: Hass, configured: string[]): HassEntity[] => {
  const ma = maPlayers(h);
  if (ma.length) return ma.sort((a, b) => String(a.attributes.friendly_name).localeCompare(String(b.attributes.friendly_name)));
  const ids = configured.length ? configured : Object.keys(h.states).filter((id) => id.startsWith('media_player.'));
  return ids.map((id) => h.states[id]).filter(alive);
};

/** Find a configured player in the room list: by id, else by name (the card may name the native player, the list holds Music Assistant's twin). */
export const findRoom = (h: Hass, list: HassEntity[], id?: string): HassEntity | undefined => {
  if (!id) return undefined;
  const name = String(h.states[id]?.attributes.friendly_name ?? '').toLowerCase().trim();
  return list.find((p) => p.entity_id === id) ?? (name ? list.find((p) => String(p.attributes.friendly_name ?? '').toLowerCase().trim() === name) : undefined);
};

/** A child's own speaker: `speaker:` in their config, else the room whose name contains theirs. */
export const kidSpeaker = (h: Hass, kid: KidConfig, list: HassEntity[]): HassEntity | undefined => {
  const set = (kid as KidConfig & { speaker?: string }).speaker;
  return findRoom(h, list, set) ?? (set && alive(h.states[set]) ? h.states[set] : undefined) ?? list.find((p) => String(p.attributes.friendly_name ?? '').toLowerCase().includes(kid.name.toLowerCase()));
};

const hit = (x: any, type: string): MediaHit => ({
  name: x.name ?? x.title ?? '', uri: x.uri ?? x.media_content_id ?? '', type: x.media_type ?? type,
  img: typeof x.image === 'string' ? x.image : x.image?.path?.startsWith?.('http') ? x.image.path : x.thumbnail ?? undefined,
  sub: [(x.artists ?? []).map((a: any) => a.name).join(', '), x.album?.name].filter(Boolean).join(' · ') || undefined
});

let entryId: string | null | undefined;
const entry = async (h: Hass): Promise<string | null> => {
  if (entryId !== undefined) return entryId;
  try { entryId = (await h.callWS<{ entry_id: string }[]>({ type: 'config_entries/get', domain: 'music_assistant' }))[0]?.entry_id ?? null; } catch { entryId = null; }
  return entryId;
};
const respond = <T>(h: Hass, domain: string, service: string, service_data: Record<string, unknown>, target?: Record<string, unknown>): Promise<T> =>
  h.callWS<{ response: T }>({ type: 'call_service', domain, service, service_data, ...(target ? { target } : {}), return_response: true }).then((r) => r.response);

/** How many of each kind to show, so one screen of results covers every kind without scrolling. */
const ORDER: [string, number][] = [['tracks', 4], ['albums', 3], ['playlists', 3], ['artists', 1], ['radio', 2], ['podcasts', 1], ['audiobooks', 2]];
/** One search across every connected service. Falls back to the player's own search when the entry cannot be read. */
export const search = async (h: Hass, text: string, player?: string): Promise<MediaHit[]> => {
  const id = await entry(h);
  if (id) {
    const r = await respond<Record<string, any[]>>(h, 'music_assistant', 'search', { config_entry_id: id, name: text, limit: 6 });
    return ORDER.flatMap(([k, n]) => (r[k] ?? []).map((x) => hit(x, k.replace(/s$/, ''))).filter((x) => x.uri).slice(0, n));
  }
  if (!player) return [];
  const r = await respond<Record<string, { result?: any[] }>>(h, 'media_player', 'search_media', { search_query: text }, { entity_id: player });
  return (Object.values(r)[0]?.result ?? []).map((x) => hit(x, x.media_content_type ?? 'music')).filter((x) => x.uri);
};

export type Enqueue = 'play' | 'next' | 'add' | 'replace_next';
export const play = (h: Hass, player: string, uri: string, enqueue: Enqueue = 'play', radio = false): Promise<unknown> =>
  h.services?.music_assistant && platform(h, player) === 'music_assistant'
    ? h.callService('music_assistant', 'play_media', { media_id: uri, enqueue, ...(radio ? { radio_mode: true } : {}) }, { entity_id: player })
    : h.callService('media_player', 'play_media', { media_content_id: uri, media_content_type: 'music', ...(enqueue === 'play' ? {} : { enqueue }) }, { entity_id: player });

export const queue = async (h: Hass, player: string): Promise<QueueInfo | null> => {
  if (platform(h, player) !== 'music_assistant') return null;
  try {
    const q = Object.values(await respond<Record<string, any>>(h, 'music_assistant', 'get_queue', {}, { entity_id: player }))[0];
    const item = (x: any): MediaHit | undefined => (x ? hit({ ...(x.media_item ?? {}), name: x.media_item?.name ?? x.name, image: x.media_item?.image ?? x.image }, 'track') : undefined);
    return q ? { items: q.items ?? 0, shuffle: !!q.shuffle_enabled, repeat: q.repeat_mode ?? 'off', current: item(q.current_item), next: item(q.next_item) } : null;
  } catch { return null; }
};

/** Other entities on the same device as a player, e.g. its "favourite this song" button or the Sonos night-sound switch. */
export const sibling = (h: Hass, player: string, re: RegExp): string | undefined => {
  const dev = h.entities?.[player]?.device_id;
  return dev ? Object.values(h.entities ?? {}).find((e) => e.device_id === dev && re.test(e.entity_id) && !!h.states[e.entity_id])?.entity_id : undefined;
};

/** Fade a room out and stop it after some minutes. Runs in Home Assistant, so it finishes even if the panel reloads. */
export const sleepIn = (h: Hass, player: string, minutes: number): boolean => {
  if (h.states['script.fh_music_sleep']) { h.callService('script', 'fh_music_sleep', { player, minutes }); return true; }
  if (platform(h, player) === 'sonos') { h.callService('sonos', 'set_sleep_timer', { sleep_time: minutes * 60 }, { entity_id: player }); return true; }
  return false;
};

/** A shelf is a to-do list: the item's name is the title, its description holds "uri | picture | @calm". */
export const shelfEntity = (name: string): string => `todo.${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_music`;
export const loadShelf = async (h: Hass, entity: string): Promise<ShelfItem[]> => {
  if (!h.states[entity]) return [];
  try {
    const r = await h.callWS<{ items: { uid: string; summary: string; description?: string; status: string }[] }>({ type: 'todo/item/list', entity_id: entity });
    return r.items.filter((i) => i.status !== 'completed').map((i) => {
      const parts = (i.description ?? '').split('|').map((s) => s.trim());
      return { uid: i.uid, name: i.summary, uri: parts.find((p) => p.includes('://') && !/^(https?:|data:)/.test(p)) ?? parts[0] ?? '', img: parts.find((p) => /^(https?:|data:image)/.test(p)), type: 'shelf', calm: /@calm/.test(i.description ?? '') };
    }).filter((x) => x.uri);
  } catch { return []; }
};
export const pinToShelf = (h: Hass, entity: string, m: MediaHit, calm = false): Promise<unknown> =>
  h.callService('todo', 'add_item', { item: m.name.slice(0, 80), description: [m.uri, m.img, calm ? '@calm' : ''].filter(Boolean).join(' | ') }, { entity_id: entity });
