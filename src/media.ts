import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import type { Hass } from './types';

/* ------------------------------------------------------------------ *
 * Pictures kept in Home Assistant's own media, never in the repository:
 * the children's characters, their looks, and the nightly artwork.
 *  - names: a bare file name means Home Assistant's local media ("My media")
 *  - signed addresses: looked up once, kept for half a day
 *  - <fh-pic>: an image that looks its own address up
 *  - making a picture (the AI Task action), squaring it, and keeping it
 * ------------------------------------------------------------------ */

const LOCAL = 'media-source://media_source/local';
let hassRef: Hass | undefined;
/** The card hands the connection over; pictures anywhere in the panel use it. */
export const setMediaHass = (h: Hass | undefined): void => { if (!h) return; const first = !hassRef; hassRef = h; if (first) for (const p of pics) p.again(); };
export const mediaHass = (): Hass | undefined => hassRef;

/** A file name, a media-source id, or a plain address, as a media-source id (or the address itself). */
export const mediaId = (name: string): string => (/^(media-source:|https?:|data:|blob:|\/)/.test(name) ? name : `${LOCAL}/${name}`);
const isUrl = (id: string): boolean => /^(https?:|data:|blob:|\/)/.test(id);

const urls = new Map<string, { url: string; at: number }>(), waiting = new Map<string, Promise<string>>();
const HALF_DAY = 12 * 3_600_000;
/** The address a picture can be shown from. Empty when it cannot be found. */
export const mediaUrl = (name: string, hass: Hass | undefined = hassRef): Promise<string> => {
  const id = mediaId(name);
  if (isUrl(id)) return Promise.resolve(id);
  const hit = urls.get(id);
  if (hit && Date.now() - hit.at < HALF_DAY) return Promise.resolve(hit.url);
  if (!hass) return Promise.resolve('');
  let p = waiting.get(id);
  if (!p) {
    p = hass.callWS<{ url: string }>({ type: 'media_source/resolve_media', media_content_id: id, expires: 86_400 })
      .then((r) => { const url = hass.hassUrl && r.url.startsWith('/') ? hass.hassUrl(r.url) : r.url; urls.set(id, { url, at: Date.now() }); return url; }, () => '')
      .finally(() => { waiting.delete(id); });
    waiting.set(id, p);
  }
  return p;
};
/** Forget an address (the file behind a name has been replaced). */
export const forgetMedia = (name: string): void => { urls.delete(mediaId(name)); };

let files: { names: Set<string>; at: number } | null = null;
/** The names of the files in local media (kept for a minute). */
export const localFiles = async (hass: Hass | undefined = hassRef, fresh = false): Promise<Set<string>> => {
  if (files && !fresh && Date.now() - files.at < 60_000) return files.names;
  if (!hass) return new Set();
  try {
    const r = await hass.callWS<{ children?: { title: string; media_class?: string }[] }>({ type: 'media_source/browse_media', media_content_id: LOCAL });
    files = { names: new Set((r.children ?? []).map((c) => c.title)), at: Date.now() };
  } catch { files = { names: new Set(), at: Date.now() }; }
  return files.names;
};

/** Keep a picture in local media under this name. */
export const keepMedia = async (hass: Hass, name: string, blob: Blob): Promise<boolean> => {
  if (!hass.fetchWithAuth) return false;
  const fd = new FormData();
  fd.append('media_content_id', `${LOCAL}/.`); fd.append('file', new File([blob], name, { type: blob.type || 'image/jpeg' }));
  try { const r = await hass.fetchWithAuth('/api/media_source/local_source/upload', { method: 'POST', body: fd }); if (r.ok) { files?.names.add(name); forgetMedia(name); } return r.ok; } catch { return false; }
};
/** Remove a picture from local media. False when Home Assistant would not. */
export const dropMedia = async (hass: Hass, name: string): Promise<boolean> => {
  try { await hass.callWS({ type: 'media_source/local_source/remove', media_content_id: mediaId(name) }); files?.names.delete(name); forgetMedia(name); return true; } catch { return false; }
};

/** Cut a picture to a shape (width over height) and save it as a JPEG of the given width. `anchor` says how much of what is cut off comes off the top (0 keeps the top, 1 the bottom). */
export const cropJpeg = async (blob: Blob, width: number, ratio = 1, anchor = 0.5): Promise<Blob> => {
  const bmp = await createImageBitmap(blob);
  let sw = bmp.width, sh = Math.round(sw / ratio);
  if (sh > bmp.height) { sh = bmp.height; sw = Math.round(sh * ratio); }
  const sx = Math.round((bmp.width - sw) / 2), sy = Math.round((bmp.height - sh) * anchor);
  const c = document.createElement('canvas'); c.width = width; c.height = Math.round(width / ratio);
  const g = c.getContext('2d')!; g.imageSmoothingQuality = 'high'; g.drawImage(bmp, sx, sy, sw, sh, 0, 0, c.width, c.height);
  bmp.close?.();
  return new Promise<Blob>((yes, no) => c.toBlob((b) => (b ? yes(b) : no(new Error('no picture'))), 'image/jpeg', 0.9));
};

export interface Made { url: string; width: number; height: number; model?: string; media_source_id?: string }
/** The AI Task entity that makes pictures: the one named, or the first there is. */
export const painter = (hass: Hass | undefined, named?: string): string => named && hass?.states[named] ? named : Object.keys(hass?.states ?? {}).find((e) => e.startsWith('ai_task.')) ?? '';
/**
 * Ask Home Assistant to paint a picture (its AI Task action; the key stays on the Home Assistant side). `refs` are pictures
 * in local media to keep a likeness by. Takes half a minute or so. Throws with Home Assistant's own words when it cannot.
 */
export const paint = async (hass: Hass, entity: string, name: string, instructions: string, refs: string[] = []): Promise<Made> => {
  const call = hass.callService as unknown as (d: string, s: string, data: object, target: undefined, notify: boolean, ret: boolean) => Promise<{ response?: Made } & Partial<Made>>;
  const r = await call.call(hass, 'ai_task', 'generate_image', {
    entity_id: entity, task_name: name, instructions,
    ...(refs.length ? { attachments: refs.map((f) => ({ media_content_id: mediaId(f), media_content_type: /\.png$/i.test(f) ? 'image/png' : 'image/jpeg' })) } : {})
  }, undefined, false, true);
  const made = (r?.response ?? r) as Made | undefined;
  if (!made?.url) throw new Error('No picture came back');
  return { ...made, url: hass.hassUrl && made.url.startsWith('/') ? hass.hassUrl(made.url) : made.url };
};

const pics = new Set<FhPic>();
/** A picture from Home Assistant's media. `zoom` and `at` frame a face for a small round chip. */
export class FhPic extends LitElement {
  static styles = css`
    :host { display: block; overflow: hidden; background: rgba(127,127,127,.18); }
    img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: var(--pic-at, 50% 50%); transform: scale(var(--pic-zoom, 1)); transform-origin: var(--pic-at, 50% 50%); opacity: 0; transition: opacity var(--m-3, 240ms) ease; }
    img[data-in] { opacity: 1; }
  `;
  static properties = { media: {}, label: {}, _url: { state: true }, _in: { state: true } };
  media = ''; label = '';
  private _url = ''; private _in = false; private _for = '';
  connectedCallback(): void { super.connectedCallback(); pics.add(this); }
  disconnectedCallback(): void { super.disconnectedCallback(); pics.delete(this); }
  /** look the address up again (the connection has only just arrived) */
  again(): void { if (!this._url) { this._for = ''; this.requestUpdate(); } }
  protected willUpdate(): void {
    if (this.media === this._for) return;
    const want = this._for = this.media;
    if (!want) { this._url = ''; return; }
    void mediaUrl(want).then((u) => { if (this._for === want) { if (u !== this._url) this._in = false; this._url = u; } });
  }
  render(): TemplateResult | typeof nothing {
    return this._url ? html`<img src=${this._url} alt=${this.label} draggable="false" ?data-in=${this._in} @load=${() => { this._in = true; }} @error=${() => { forgetMedia(this.media); }}>` : nothing;
  }
}
if (!customElements.get('fh-pic')) customElements.define('fh-pic', FhPic);
