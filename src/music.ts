import { LitElement, html, css, nothing, unsafeCSS, type PropertyValues, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { styles } from './styles';
import { LookController, getLook, lookArt } from './looks';
import { icon, solid } from './icons';
import { kidEntities, slotVar, type ColourSlot, type Hass, type HassEntity, type KidConfig, type MapFloorConfig, type MomentConfig, type StationConfig } from './types';
import { bedtimeFor, getNarrow, getShape, FitController, hm, isQuiet, minsNow, scrollCue, linger, motion, sfx, shortNames, windDown, inTime, SlowError, SLOW_SAY } from './util';
import { spark } from './sparks';
import { keyboard, keysCss, typeKey } from './keys';
import { findOne, findRoom, hasMa, kidSpeaker, loadShelf, pinToShelf, play, queue, rooms, search, shelfEntity, sibling, sleepIn, sleepOff, type MediaHit, type QueueInfo, type ShelfItem } from './ma';
import { VIEWS, crateView, deskView, dialView, miniKeys, sceneView, stepBtn, viewHint, viewPicker, viewsCss, volCtl, volKey, TAP_SLOP, type Ctx, type Room, type ViewId } from './musicviews';
import { avatarCss, decodeLook, renderAvatar } from './avatar';
import './pin';

type Tab = 'rooms' | 'search' | 'shelves' | 'juke' | 'radio' | 'call';
interface Pick extends MediaHit { who: string; t: number; done?: boolean }
interface Juke { day: string; on: boolean; who: string; picks: Pick[] }
interface MapZone { name: string; p: HassEntity }
interface MapFloor { name: string; rooms: { name: string; size: number; stairs: boolean; asleep: boolean; zones: MapZone[] }[] }
/** Survives page switches: radio lookup is a 1,500-row browse, so do it once per session. */
const CACHE: { thumbs: Record<string, string>; res: Record<string, string>; key: string } = { thumbs: {}, res: {}, key: '' };
const LAST: Record<string, string> = {};
const DEFAULT_STATIONS: StationConfig[] = [{ name: 'ABC Kids listen', match: 'ABC Kids listen' }, { name: 'ABC Jazz', match: 'ABC Jazz' }];
/** The moment pads, when the card sets none: each plays in the room in focus. */
const MOMENTS: MomentConfig[] = [{ name: 'Dinner', find: 'dinner' }, { name: 'Dance', find: 'dance hits' }, { name: 'Tidy-up', find: 'motivation' }, { name: 'Wind down', find: 'sleep sounds' }];
const MOMENT_ICON: [RegExp, string][] = [[/dinner|eat|meal|breakfast|lunch/i, '🍽️'], [/danc|party|disco/i, '🪩'], [/tidy|clean|chore|job/i, '🧹'], [/wind|sleep|bed|calm|night/i, '🌙'], [/morning|wake/i, '☀️'], [/read|story|homework|study/i, '📚']];
const clock = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const CALLS = ['Dinner’s ready!', 'Time to get ready, please.', 'Please come to the kitchen.', 'Five minutes until bedtime.', 'Time to leave – shoes on!', 'I love you!'];
/** A small picture for each ready message, so someone who cannot read yet can choose one: plate, clock, kitchen, moon, shoes, heart. */
const CALL_PIC = ['🍽️', '⏰', '🍳', '🌙', '👟', '❤️'];
/** The views whose hint has been shown since the page was loaded: each shows once, then only when "?" is tapped. */
const HINTED = new Set<string>();
const TYPE_LABEL: Record<string, string> = { track: 'Song', album: 'Album', playlist: 'Playlist', artist: 'Artist', radio: 'Radio', podcast: 'Podcast', audiobook: 'Story' };
const today = (): string => new Date().toDateString();
const ls = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) as T; } catch { return d; } };
const lsSet = (k: string, v: unknown): void => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* blocked */ } };

/** The shape the Music page arranges itself for: a landscape screen under 900 px wide takes the portrait arrangement and scrolls. */
const shp = (): 'wide' | 'tall' | 'phone' => { const s = getShape(); return s === 'wide' && getNarrow() >= 3 ? 'tall' : s; };
/**
 * Music: what is playing and where, one search across every service, a shelf of favourites per child,
 * a take-turns jukebox, radio, and a way to call a room.
 */
export class FhMusic extends LitElement {
  readonly stackNarrow = true;
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, keysCss, css`${unsafeCSS(avatarCss)}`, viewsCss, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .stage { width: 380px; flex-shrink: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden; color: #fff; background: #111; }
    /* the cover, blurred and darkened behind the player. The blur is a backdrop filter over the picture, so nothing hangs outside the player and white text keeps its contrast on a bright cover. */
    .stage .bg { position: absolute; inset: 0; background: var(--art) center / cover; transition: background var(--m-5, 900ms); }
    .stage .bg::after { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,.64); -webkit-backdrop-filter: blur(40px) saturate(120%); backdrop-filter: blur(40px) saturate(120%); }
    .stage { --ring-halo: #111; } .stage :is(button, [role='slider'], [role='switch'], [tabindex]):focus-visible { outline-color: #fff; }
    .stage > *:not(.bg) { position: relative; }
    .deck { flex: 1 1 0; min-height: 120px; display: flex; align-items: center; justify-content: center; }
    .cover { height: 100%; max-height: 250px; aspect-ratio: 1; border-radius: 22px; background: var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 20px 50px -12px rgba(0,0,0,.6); transition: transform var(--mt-4, 400ms) cubic-bezier(.2,1.2,.3,1); }
    .cover.paused { transform: scale(.9); }
    .bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,.25); overflow: hidden; }
    .bar > i { display: block; height: 100%; background: #fff; border-radius: 2px; transition: width calc(1s * var(--m-d, 1)) linear; }
    .ctl { display: flex; align-items: center; justify-content: space-between; }
    .ctl button { color: #fff; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .ctl button[aria-pressed='true'] { background: rgba(255,255,255,.22); }
    .ctl .go { width: 66px; height: 66px; background: #fff; color: #111; }
    .upnext { display: flex; align-items: center; gap: 8px; min-height: 30px; font-size: 14px; font-weight: var(--w-semi, 600); white-space: nowrap; overflow: hidden; }
    .mini { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px; }
    .mini .tog { height: 44px; padding: 0 12px; border-radius: 999px; background: rgba(0,0,0,.35); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.4); color: #fff; font-size: 15px; font-weight: var(--w-bold, 700); white-space: nowrap; }
    .mini .tog[aria-pressed='true'] { background: #fff; color: #111; }
    .stage .vs { --vc: #fff; --rail: rgba(255,255,255,.3); } .stage .vstep, .stage .vnum { color: #fff; } .stage .vrail:focus-visible, .stage .vstep:focus-visible { outline-color: #fff; }
    .panel { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
    .mhead { display: flex; align-items: center; gap: 16px; }
    /* one row on a wide screen: the view gets the height */
    .panel[data-one] { padding: 8px 10px; gap: 8px; }
    .mhead[data-one] { gap: 8px; } .mhead[data-one] h1 { display: none; } /* the section is named "Music" for assistive technology instead */
    .mhead[data-one] .finder { height: 48px; padding: 0 16px; flex: 1 1 120px; } .mhead[data-one] .nowbar { max-width: 28%; flex: 0 1 auto; }
    .mhead[data-one] .pill, .mhead[data-one] .viewbtn, .mhead[data-one] .offnote { flex-shrink: 0; }
    .helpb, .peekb { width: 48px; height: 48px; flex-shrink: 0; font-size: 20px; font-weight: var(--w-heavy, 800); }
    .helpb { color: var(--ink); }
    .body { position: relative; }
    /* the hint: one quiet line in the toolbar beside "?", shown for four seconds the first time a view is opened and whenever "?" is tapped. It is never laid over the view. On a wide screen it borrows the search field's place while it shows. */
    .hint { flex: 1 1 0; min-width: 0; max-height: 36px; font-size: 15px; line-height: 18px; font-weight: var(--w-semi, 600); color: var(--ink2); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; opacity: 0; visibility: hidden; transition: opacity var(--m-3, 240ms) ease; }
    .hint[data-on] { opacity: 1; visibility: visible; }
    .mhead[data-one] .hint:not([data-on]) { display: none; }
    /* the hint is never cut, and never takes a row of its own on a wide screen (a tap takes the hint away, and a row that vanished under the finger would lose the tap):
       the tab words go first, then the small player beside it, and the buttons after it in the row wait while it shows */
    .mhead[data-hintwide] .nowbar { display: none; }
    :host([data-shape='wide']) .acts .hint[data-on] ~ * { display: none; }
    .hint[data-wrap] { max-height: none; display: block; }
    .mhead[data-one][data-hinting] .finder { display: none; }
    :host([data-full]) .stage { display: none; }
    .tabs.inline { flex: 0 0 auto; } .tabs.inline button { flex: 0 0 52px; height: 48px; padding: 0; } .tabs.inline button span { display: none; }
    .nowbar { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 46%; padding: 4px 6px 4px 4px; border-radius: 999px; background: var(--chip); }
    .nthumb { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; background: var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 0 0 2px var(--chip-strong); }
    .nthumb[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); }
    .ntx { min-width: 0; display: flex; flex-direction: column; line-height: 1.15; padding-right: 4px; } .ntx b, .ntx span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ntx b { font-size: 14px; font-weight: var(--w-bold, 700); } .ntx span { font-size: 12px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .ntx b { font-size: 15px; } .ntx span { font-size: 14px; }
    .acts .hint { flex: 1 1 0; min-width: 0; } .acts .hint:not([data-on]) { display: none; } :host([data-phone]) .acts .hint { flex: 1 1 100%; order: 9; }
    /* a home speaker that cannot be reached keeps its place, greyed, and the page says how many */
    .offnote { height: 44px; padding: 0 14px 0 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: var(--w-bold, 700); white-space: nowrap; background: color-mix(in srgb, var(--accent) 26%, var(--chip-strong)); box-shadow: inset 0 0 0 2px var(--accent); }
    /* offline: the picture fades, the words stay readable */
    [data-offline] { filter: grayscale(1); }
    [data-offline] :is(svg, .puck, .thumb, .cone, .well, .dtrack, .dfill, .dknob, .vs, .cvol) { opacity: .45; }
    .mzone[data-offline], .mz[data-offline] { background: repeating-linear-gradient(135deg, transparent 0 10px, var(--track) 10px 12px); }
    :host([data-phone]) .nowbar { max-width: 100%; flex: 1 1 100%; order: 8; } :host([data-phone]) .tabs.inline { flex: 1 1 100%; }
    .panel { position: relative; }
    .body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; }
    /* search is a field, not a tab: it is always in the same place and looks like somewhere to type */
    .finder { flex: 1; min-width: 0; height: 54px; padding: 0 22px; border-radius: 27px; display: flex; align-items: center; gap: 12px; text-align: left; font-size: 17px; font-weight: var(--w-semi, 600); color: var(--ink2);
      background: var(--chip-strong); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 45%, transparent), 0 6px 14px -8px rgba(0,0,0,.35); transition: box-shadow var(--m-2, 160ms); }
    .finder:active { box-shadow: inset 0 0 0 3px var(--primary); }
    .finder span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sbar { flex: 1; min-width: 0; display: flex; gap: 10px; animation: fadeIn var(--m-2, 160ms) ease-out; }
    .sbar .field { border-radius: 27px; padding: 0 22px; }
    /* calling: speech bubbles and a house to tap */
    .callrow { flex: 1; min-height: 0; display: flex; gap: 16px; }
    .callside, .dropside { flex: 0 0 50%; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
    .bubbles { flex: 1; min-width: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; align-content: start; }
    .bubble { display: flex; align-items: center; gap: 10px; min-height: 62px; padding: 8px 14px; border-radius: 22px 22px 22px 6px; background: var(--chip); font-size: 16px; font-weight: var(--w-semi, 600); text-align: left; line-height: 1.2; transition: transform var(--mt-2, 160ms) cubic-bezier(.2,1.4,.4,1), background var(--m-2, 160ms); }
    .bubble:nth-child(even) { border-radius: 22px 22px 6px 22px; }
    .bubble[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); transform: scale(1.03); }
    .sayit { height: 52px; padding: 0 24px; font-size: 16px; display: inline-flex; align-items: center; gap: 8px; }
    .map.snug { flex: none; }
    .map.snug .floor { flex: none; height: 100px; min-height: 0; }
    .map.snug .mstairs { flex-basis: 36px; }
    /* the little house: each room is a button, so the room leaves space for its focus ring */
    .map.snug .mroom { overflow: visible; } .map.snug .mz:first-child { border-radius: 16px 0 0 16px; } .map.snug .mz:last-child { border-radius: 0 16px 16px 0; } .map.snug .mz:only-child { border-radius: 16px; }
    .mz { flex: 1 1 0; min-width: 0; padding: 4px 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font-size: 15px; position: relative; transition: background var(--m-2, 160ms); }
    .mz + .mz { border-left: 2px dashed var(--track); }
    .mz b { max-width: 100%; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-align: center; line-height: 1.1; font-size: 16px; font-weight: var(--w-bold, 700); }
    .mz[data-live] { background: linear-gradient(to top, color-mix(in srgb, var(--primary) 30%, transparent) 28%, transparent 28%); }
    .mz[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    .mz[data-hot] { background: var(--chip-strong); box-shadow: inset 0 0 0 4px var(--primary); color: var(--ink); }
    .shout { display: flex; animation: shout .7s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    @keyframes shout { from { transform: rotate(-8deg) scale(.95); } to { transform: rotate(6deg) scale(1.1); } }
    /* shelves: a crate of records next to the house */
    .shelfrow { flex: 1; min-height: 0; display: flex; gap: 16px; }
    .crate { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
    .chiprow.dividers { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: 4px 3px 3px; margin: -4px -3px -3px; } .chiprow.dividers .pchip { flex: 0 1 auto; min-width: 44px; white-space: nowrap; }
    .dividers .pchip { border-radius: 16px 16px 6px 6px; box-shadow: inset 0 -4px 0 var(--c); margin-left: 0; opacity: 1; }
    .dividers .pchip[aria-pressed='true'] { background: var(--c); color: var(--on-person, #fff); box-shadow: none; transform: translateY(-3px); }
    :host(:not([data-phone])) .crate.low .chiprow { order: 9; } :host(:not([data-phone])) .crate.low .covers, :host(:not([data-phone])) .jcovers.low { align-content: safe end; }
    :host(:not([data-phone])) .crate.low .dividers .pchip { border-radius: 6px 6px 16px 16px; box-shadow: inset 0 4px 0 var(--c); } :host(:not([data-phone])) .crate.low .dividers .pchip[aria-pressed='true'] { box-shadow: none; transform: translateY(3px); }
    .crate .st { touch-action: pan-y; background: transparent; padding: 0 14px 0 0; }
    .crate .st .img { position: relative; box-shadow: 0 8px 16px -8px rgba(0,0,0,.5); transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.2,.3,1); }
    .disc { position: absolute; top: 3%; right: 14px; width: calc(100% - 14px); aspect-ratio: 1; border-radius: 50%; transform: translateX(11%) scale(.94); transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.2,.3,1);
      background: radial-gradient(circle, #f4efe3 0 3%, var(--accent) 3.5% 16%, #17140f 16.5% 100%); }
    .crate .st:active .disc, .crate .st[data-lifted] .disc { transform: translateX(26%) scale(.94) rotate(40deg); }
    .crate .st[data-lifted] .img { transform: scale(.94); }
    .presets .st { background: transparent; align-items: center; text-align: center; }
    .presets .st .img { width: 100%; border-radius: 50%; box-shadow: 0 0 0 4px var(--chip-strong), 0 8px 16px -8px rgba(0,0,0,.5); }
    .presets .st.on { box-shadow: none; }
    .presets .st.on .img { box-shadow: 0 0 0 5px var(--ok), 0 8px 16px -8px rgba(0,0,0,.5); }
    :host([data-phone]) .callrow, :host([data-phone]) .shelfrow { flex-direction: column; flex: none; }
    :host([data-phone]) .callside, :host([data-phone]) .dropside { flex: none; }
    :host([data-phone]) .bubbles { grid-template-columns: 1fr; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .mhead { flex-wrap: wrap; }
    :host([data-phone]) .tabs { flex-wrap: nowrap; overflow-x: auto; max-width: 100%; scrollbar-width: none; }
    :host([data-phone]) .tabs button { flex: 1 1 auto; padding: 0 12px; }
    :host([data-phone]) .tabs button:not([aria-selected='true']) span { display: none; }
    :host([data-phone]) .body { flex: none; }
    :host([data-phone]) .mhead .finder, :host([data-phone]) .sbar { flex: 1 1 100%; }
    :host([data-phone]) .acts .soft { flex: 1 1 100%; order: 9; }
    :host([data-shape='tall']) .acts .hint { flex: 1 1 100%; order: 9; }
    :host([data-phone]) .stage { flex-direction: column; flex-wrap: nowrap; align-items: stretch; border-radius: 22px; }
    :host([data-phone]) .deck { flex: 0 0 auto; height: 210px; }
    :host([data-phone]) .panel { padding: 14px; border-radius: 22px; min-height: 320px; }
    :host([data-phone]) .grid, :host([data-phone]) .hits, :host([data-phone]) .covers, :host([data-phone]) .picks { overflow: visible; flex: none; }
    :host([data-phone]) .hits { grid-template-columns: 1fr; }
    :host([data-phone]) .msgs { grid-template-columns: 1fr 1fr; }
    /* the places on the page: a picture each, and the one you are in stands up */
    .tabs { display: flex; gap: 8px; }
    .tabs button { flex: 1 1 0; min-width: 0; height: 56px; padding: 0 10px; border-radius: 18px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); display: flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap;
      transition: background var(--m-2, 160ms), color var(--m-2, 160ms); }
    /* the selected tab changes colour and ring only: it never moves, so the row keeps one line */
    .tabs button[aria-selected='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .tabs button[data-nod] .i { animation: nod var(--m-4, 400ms) ease-out; }
    .acts .seg button { height: 44px; color: var(--ink); }
    .acts .seg button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    @keyframes nod { 30% { transform: rotate(calc(-14deg * var(--m-d, 1))) scale(calc(1 + .2 * var(--m-d, 1))); } 65% { transform: rotate(calc(8deg * var(--m-d, 1))); } }
    .grid { flex: 1; min-height: 0; overflow: auto; padding: 4px; margin: -4px; display: grid; grid-template-columns: repeat(auto-fill, minmax(264px, 1fr)); gap: 10px; align-content: start; }
    .grid[data-fit] { gap: 6px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .spk { border-radius: 20px; background: var(--chip); padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; --rail: var(--track); }
    .spk.focus { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .spk.inmix { box-shadow: 0 0 0 3px var(--ok); }
    .spk .sn2 { font-size: 16px; line-height: 1.15; font-weight: var(--w-bold, 700); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
    .spk .top { display: flex; align-items: center; gap: 10px; }
    .spk .rsel { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; text-align: left; min-height: 44px; }
    .rtx { display: flex; flex-direction: column; min-width: 0; gap: 2px; } .rst { font-size: 15px; color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .moveb { height: 44px; font-size: 15px; align-self: flex-start; }
    .thumb { width: 44px; height: 44px; border-radius: 12px; background: var(--art, var(--track)) center / cover; flex-shrink: 0; display: flex; align-items: flex-end; justify-content: center; gap: 3px; padding-bottom: 7px; }
    .eq i { width: 4px; border-radius: 2px; background: #fff; animation: eq .9s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); box-shadow: 0 0 4px rgba(0,0,0,.4); }
    .eq i:nth-child(2) { animation-delay: .3s; } .eq i:nth-child(3) { animation-delay: .6s; }
    @keyframes eq { from { height: 4px; } to { height: 20px; } }
    .join { width: 44px; height: 44px; border-radius: 50%; background: var(--track); font-size: 20px; font-weight: var(--w-heavy, 800); flex-shrink: 0; }
    .join[aria-pressed='true'] { background: var(--ok); color: var(--on-ok, #fff); }
    .field { flex: 1; min-width: 0; height: 52px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 16px; font: inherit; font-size: 20px; font-weight: var(--w-semi, 600); color: var(--ink); outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); }
    .hits { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; align-content: start; }
    .hits[data-fit] { gap: 3px 10px; }
    .hit { display: flex; align-items: center; gap: 10px; padding: 6px 10px 6px 6px; min-height: 52px; border-radius: 14px; background: var(--chip); text-align: left; min-width: 0; }
    .hits[data-fit] .hit { min-height: 46px; padding: 3px 10px 3px 4px; }
    .hit[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .hit .art, .pickrow .art { width: 40px; height: 40px; border-radius: 9px; background: var(--art, var(--track)) center / cover; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--ink2); }
    .hit .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
    .hit .tx b, .hit .tx span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hit .tx b { font-size: 15px; font-weight: var(--w-bold, 700); }
    .hit .tx span { font-size: 12px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .kind { font-size: 12px; font-weight: var(--w-heavy, 800); padding: 3px 8px; border-radius: 999px; background: var(--track); color: var(--ink); flex-shrink: 0; }
    .acts { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .covers { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 12px; align-content: start; }
    .crate .covers { gap: 14px 6px; padding: 6px; }
    .covers[data-fit] { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
    .st { border-radius: 20px; background: var(--chip); padding: 10px; display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 15px; font-weight: var(--w-bold, 700); position: relative; min-width: 0; }
    .st .img { aspect-ratio: 1; border-radius: 14px; background: var(--art, linear-gradient(135deg, color-mix(in srgb, var(--p-1) 62%, #000), color-mix(in srgb, var(--p-3) 62%, #000))) center / cover no-repeat, #3b3f58; display: flex; align-items: center; justify-content: center; font-family: 'Bricolage Grotesque', sans-serif; font-size: 30px; font-weight: var(--w-heavy, 800); color: #fff; }
    .st .lbl { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; }
    .st.on { box-shadow: 0 0 0 3px var(--ok); }
    .st .x { position: absolute; top: 4px; right: 4px; width: 36px; height: 36px; border-radius: 50%; background: #dc2626; color: #fff; font-size: 18px; font-weight: var(--w-heavy, 800); }
    .chiprow { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .pchip { height: 44px; padding: 0 14px 0 8px; border-radius: 999px; background: var(--chip); display: inline-flex; align-items: center; gap: 8px; font-size: 15px; font-weight: var(--w-semi, 600); }
    .pchip[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--c, var(--primary)); }
    .pchip .avatar { width: 32px; height: 32px; font-size: 13px; background: var(--c); overflow: hidden; }
    /* jukebox: a coin each, and the night's picks as a line of records */
    .coins { display: flex; align-items: flex-end; gap: 6px; flex-wrap: wrap; }
    .coins .soft { align-self: center; margin-right: 6px; }
    /* a family with a child who cannot read yet, on a tall wide screen (the wall panel): he reaches the lower half only, so the coins and "adds a song" go under the night's picks */
    @media (min-height: 900px) { :host(:not([data-phone]):not([data-shape='tall'])) .coins.jlow { order: 5; } :host(:not([data-phone]):not([data-shape='tall'])) .acts.jlow { order: 6; } }
    .coin { min-width: 66px; padding: 6px 6px 2px; display: flex; flex-direction: column; align-items: center; gap: 3px; border-radius: 16px; }
    .coin .face { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--c); color: var(--on-person, #fff); font-size: 19px; font-weight: var(--w-heavy, 800);
      box-shadow: inset 0 -4px 0 rgba(0,0,0,.18), 0 3px 6px rgba(0,0,0,.22); transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.4,.4,1), box-shadow var(--m-2, 160ms); }
    .coin[aria-pressed='true'] .face { transform: translateY(-5px) scale(1.1); box-shadow: inset 0 -4px 0 rgba(0,0,0,.18), 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--c), 0 10px 14px -6px rgba(0,0,0,.4); }
    .coin .cname { font-size: 14px; font-weight: var(--w-bold, 700); }
    .coin[aria-pressed='true'] .cname { text-decoration: underline; text-underline-offset: 3px; }
    .coin .face { position: relative; } .fpic { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    /* someone with a song waiting wears its cover, not a tick */
    .coin .has { position: absolute; right: -6px; bottom: -6px; width: 26px; height: 26px; border-radius: 7px; background: var(--art, linear-gradient(135deg, var(--p-1), var(--p-5))) center / cover; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px var(--chip-strong), 0 2px 4px rgba(0,0,0,.3); }
    .coin .cnext { height: 16px; font-size: 14px; font-weight: var(--w-heavy, 800); color: var(--ink); }
    .coin[data-next] .face { box-shadow: inset 0 -4px 0 rgba(0,0,0,.18), 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--ink); }
    .jcovers { flex: 1; min-height: 0; }
    .field:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
    .jsw { height: 48px; padding: 0 16px 0 10px; border-radius: 999px; background: var(--chip); display: inline-flex; align-items: center; gap: 10px; font-size: 15px; font-weight: var(--w-semi, 600); }
    .jsw i { width: 50px; height: 30px; border-radius: 15px; background: var(--ink3); position: relative; transition: background var(--m-2, 160ms); flex-shrink: 0; }
    .jsw i::after { content: ''; position: absolute; left: 3px; top: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.35); transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.4,.4,1); }
    .jsw[aria-checked='true'] i { background: var(--ok); }
    .jsw[aria-checked='true'] i::after { transform: translateX(20px); }
    .picks { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 14px 10px; align-content: start; padding: 6px 2px 2px; }
    .picks[data-fit] { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
    .pickrow { display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 18px; background: var(--chip); font-size: 15px; font-weight: var(--w-bold, 700); min-width: 0; transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.2,.3,1); }
    .pickrow[data-next] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); animation: nextup 1.6s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    @keyframes nextup { to { transform: translateY(-4px); } }
    .pickrow.played .pcover { opacity: .55; }
    .pickrow.played .art { filter: grayscale(.8); }
    .pickrow.played .nm .muted { color: var(--ink2); }
    .pcover { position: relative; display: block; padding-right: 12px; }
    .pcover .disc { right: 0; width: calc(100% - 12px); top: 3%; }
    .pickrow[data-next] .disc { transform: translateX(13%) scale(.94); animation: puck 6s linear infinite; animation-iteration-count: var(--loops, infinite); }
    .pickrow .pcover .art { position: relative; width: 100%; height: auto; aspect-ratio: 1; border-radius: 12px; box-shadow: 0 8px 14px -8px rgba(0,0,0,.5); background: var(--art, linear-gradient(135deg, var(--p-1), var(--p-5))) center / cover; color: #fff; }
    .pcover .init { position: absolute; left: -4px; top: -4px; width: 30px; height: 30px; border-radius: 50%; overflow: hidden; background: var(--c); font-size: 13px; box-shadow: 0 0 0 2.5px var(--chip-strong); }
    .pickrow .nm { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; min-height: 2.4em; }
    .when { align-self: flex-start; min-height: 24px; padding: 2px 10px 2px 7px; border-radius: 999px; background: var(--track); color: var(--ink); font-size: 14px; font-weight: var(--w-heavy, 800); display: inline-flex; align-items: center; gap: 5px; }
    .when i { font-style: normal; display: inline-flex; }
    .pickrow[data-next] .when { background: var(--primary); color: var(--on-primary); }
    .banner { padding: 10px 14px; border-radius: 16px; background: color-mix(in srgb, var(--accent) 24%, var(--chip)); font-size: 15px; font-weight: var(--w-bold, 700); display: flex; align-items: center; gap: 10px; }
    .msgs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .msgs button { min-height: 52px; padding: 6px 12px; border-radius: 16px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); text-align: left; }
    .msgs button[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .soft { color: var(--ink2); font-size: 14px; font-weight: var(--w-semi, 600); }

    /* ---- the house: rooms you can see, music you can pick up ---- */
    .map { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; position: relative; user-select: none; -webkit-user-select: none; }
    .floor { flex: 1 1 0; min-height: 96px; display: flex; gap: 8px; }
    .flabel { flex: 0 0 22px; writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-size: 14px; font-weight: var(--w-bold, 700); letter-spacing: .08em; text-transform: uppercase; color: var(--ink2); }
    .mroom { flex: var(--size, 1) 1 0; min-width: 0; display: flex; border-radius: 20px; background: var(--chip-soft); overflow: hidden; }
    /* the stairs: treads seen from above between two rails (level lines, so they never look like the slanted hatch of a speaker that is offline) */
    .mstairs { flex: 0 0 54px; border-radius: 10px; background: repeating-linear-gradient(to bottom, var(--ink3) 0 2.5px, transparent 2.5px 16px) 9px 0 / calc(100% - 18px) 100% no-repeat, var(--chip-soft); box-shadow: inset 5px 0 0 var(--ink3), inset -5px 0 0 var(--ink3); }
    .mzone { flex: 1 1 0; min-width: 0; position: relative; touch-action: none; container: zone / size; --c: var(--stream, var(--primary)); }
    :host([data-phone]) .mzone { touch-action: pan-y; }
    .mzone + .mzone { border-left: 2px dashed var(--track); }
    .mzone[data-focus] { background: var(--chip-strong); box-shadow: inset 0 0 0 3px var(--primary); }
    .mzone[data-hot] { box-shadow: inset 0 0 0 4px var(--c); }
    .mzone[data-asleep] .zname b { opacity: .7; }
    .pool { position: absolute; left: 0; right: 0; bottom: 0; height: var(--lvl); background: color-mix(in srgb, var(--c) 40%, transparent); transition: height var(--mt-2, 160ms) ease-out; pointer-events: none; }
    .pool::before { content: ''; position: absolute; left: 0; right: 0; bottom: 100%; height: 8px; background: radial-gradient(circle at 12px 14px, color-mix(in srgb, var(--c) 40%, transparent) 11px, transparent 12px) 0 0 / 24px 8px repeat-x; }
    .mzone[data-playing] .pool::before { animation: wave 1.5s linear infinite; animation-iteration-count: var(--loops, infinite); }
    @keyframes wave { to { background-position-x: 24px; } }
    /* the sound takes the shape of the theme (Glass only; the other looks dress it themselves) */
    .pool::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
    :host([data-look='glass'][data-theme='sea']) .pool::after { inset: auto 0 100% 0; height: 12px; opacity: .6; background: radial-gradient(circle at 18px 21px, color-mix(in srgb, var(--c) 40%, transparent) 17px, transparent 18px) 0 0 / 36px 12px repeat-x; }
    :host([data-look='glass'][data-theme='sea']) .mzone[data-playing] .pool::after { animation: wave2 2.7s linear infinite reverse; animation-iteration-count: var(--loops, infinite); }
    @keyframes wave2 { to { background-position-x: 36px; } }
    :host([data-look='glass'][data-theme='reef']) .pool::after { background: radial-gradient(circle at 18px 100px, transparent 3px, rgba(255,255,255,.85) 3.5px 5px, transparent 5.5px), radial-gradient(circle at 62px 40px, transparent 5px, rgba(255,255,255,.7) 5.5px 7px, transparent 7.5px), radial-gradient(circle at 84px 84px, rgba(255,255,255,.75) 2px, transparent 2.5px); background-size: 96px 120px; }
    :host([data-look='glass'][data-theme='reef']) .mzone[data-playing] .pool::after { animation: bubbles 4.5s linear infinite; animation-iteration-count: var(--loops, infinite); }
    @keyframes bubbles { to { background-position-y: -120px; } }
    :host([data-look='glass'][data-theme='space']) .pool { background: linear-gradient(to top, color-mix(in srgb, var(--c) 46%, transparent), color-mix(in srgb, var(--c) 8%, transparent)); }
    :host([data-look='glass'][data-theme='space']) .pool::before { height: 3px; background: var(--c); box-shadow: 0 0 14px 3px var(--c); animation: none; }
    :host([data-look='glass'][data-theme='space']) .pool::after { background: radial-gradient(circle at 14px 20px, #fff 1.4px, transparent 2px), radial-gradient(circle at 52px 58px, #fff 1px, transparent 1.6px), radial-gradient(circle at 70px 14px, #fff 1.8px, transparent 2.4px), radial-gradient(circle at 30px 70px, #fff 1px, transparent 1.6px); background-size: 86px 84px; }
    :host([data-look='glass'][data-theme='space']) .mzone[data-playing] .pool::after { animation: twinkle 1.7s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    @keyframes twinkle { from { opacity: .25; } to { opacity: 1; } }
    :host([data-look='glass'][data-theme='bush']) .pool::before { height: 14px; background: radial-gradient(circle at 26px 30px, color-mix(in srgb, var(--c) 40%, transparent) 27px, transparent 28px) 0 0 / 52px 14px repeat-x; animation-duration: var(--m-5, 900ms); }
    :host([data-look='glass'][data-theme='bush']) .pool::after { background: radial-gradient(circle at 20px 30px, #fff3a8 2.2px, transparent 3.4px), radial-gradient(circle at 78px 62px, #fff3a8 1.8px, transparent 3px), radial-gradient(circle at 50px 12px, #fff3a8 1.6px, transparent 2.8px); background-size: 104px 80px; }
    :host([data-look='glass'][data-theme='bush']) .mzone[data-playing] .pool::after { animation: fireflies 3.2s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    @keyframes fireflies { from { opacity: .15; background-position: 0 0; } to { opacity: 1; background-position: 14px -10px; } }
    :host([data-look='glass'][data-theme='sunset']) .pool::before { height: 4px; background: linear-gradient(90deg, transparent, rgba(255,226,160,.95), transparent) 0 0 / 180px 4px repeat-x; animation: shimmer 3.4s linear infinite; animation-iteration-count: var(--loops, infinite); animation-play-state: paused; }
    :host([data-look='glass'][data-theme='sunset']) .mzone[data-playing] .pool::before { animation-play-state: running; }
    :host([data-look='glass'][data-theme='sunset']) .pool::after { background: repeating-linear-gradient(to bottom, rgba(255,226,160,.34) 0 2px, transparent 2px 16px); }
    :host([data-look='glass'][data-theme='sunset']) .mzone[data-playing] .pool::after { animation: bands 2.6s linear infinite; animation-iteration-count: var(--loops, infinite); }
    @keyframes shimmer { to { background-position-x: 180px; } }
    @keyframes bands { to { background-position-y: 16px; } }
    @keyframes scribble { to { background-position: 5px 0, 0 0; } }
    .zname { position: absolute; left: 6px; top: 6px; right: 56px; min-height: 48px; padding: 4px 8px; display: flex; flex-direction: column; justify-content: center; gap: 1px; text-align: left; border-radius: 14px; }
    .zname b, .zname span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zname b { font-size: 16px; font-weight: var(--w-bold, 700); }
    .zname span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .mzone > .join { position: absolute; right: 12px; top: 6px; }
    .grab { position: absolute; right: 6px; bottom: var(--lvl); width: 56px; height: 44px; margin-bottom: -22px; display: flex; align-items: center; justify-content: center; touch-action: none; cursor: ns-resize; outline: none; border-radius: 12px; transition: bottom var(--mt-2, 160ms) ease-out; z-index: 1; }
    .grab i { display: block; width: 52px; height: 14px; box-sizing: border-box; border-radius: 7px; background: var(--knob, #fff); box-shadow: inset 0 0 0 3px var(--c), 0 2px 5px rgba(0,0,0,.3); transition: transform var(--m-2, 160ms) var(--e-spring, ease); }
    .mzone:not([data-live]) .grab i { background: var(--knob-quiet, var(--chip-strong)); box-shadow: inset 0 0 0 3px var(--ink3); }
    .mzone:not([data-live]):not([data-offline])::after { content: ''; position: absolute; right: 31px; bottom: var(--r0); top: var(--r1); width: 6px; border-radius: 3px; background: var(--track); pointer-events: none; }
    /* Orbit keeps mint for "done": a paused room's handle is grey, and the jukebox switch is yellow when on */
    :host([data-look='orbit']) .mzone[data-live]:not([data-playing]) .grab i { box-shadow: inset 0 0 0 3px var(--ink2), 0 2px 5px rgba(0,0,0,.3); }
    :host([data-look='orbit']) .jsw[aria-checked='true'] i { background: var(--accent); }
    .mzone[data-held] .grab { transition: none; } .mzone[data-held] .pool { transition: none; }
    .puck { position: absolute; left: 50%; bottom: 12px; width: 68px; height: 68px; margin-left: -40px; border-radius: 50%; border: 3px solid #fff; box-sizing: border-box; touch-action: none; cursor: grab;
      background: radial-gradient(circle, #fff 0 7%, transparent 8%), var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 8px 20px -6px rgba(0,0,0,.55); }
    .mzone[data-playing] .puck { animation: puck 8s linear infinite; animation-iteration-count: var(--loops, infinite); }
    @keyframes puck { to { transform: rotate(360deg); } }
    .puck[data-lifted] { opacity: .3; animation: none; }
    .puck.fly { margin: -42px 0 0 -42px; width: 84px; height: 84px; bottom: auto; pointer-events: none; z-index: 5; animation: lift var(--m-2, 160ms) ease-out; box-shadow: 0 20px 32px -8px rgba(0,0,0,.6); }
    @keyframes lift { from { transform: scale(calc(1 - .3 * var(--m-d, 1))); } }
    .acts .pill[data-hot] { box-shadow: 0 0 0 4px var(--accent); }
    /* the map with its shelf: records to carry to a room, and somewhere to drop music for the whole house */
    .maprow { flex: 1; min-height: 0; display: flex; gap: 12px; }
    .maprow > .map { min-width: 0; }
    .mshelf { flex: 0 0 clamp(236px, 25%, 310px); min-width: 0; border-radius: 22px; background: var(--chip); padding: 12px; display: flex; flex-direction: column; gap: 10px; user-select: none; -webkit-user-select: none; }
    .shead { display: flex; align-items: center; justify-content: flex-start; gap: 4px; flex-wrap: wrap; }
    .shead b { flex: 1 1 100%; min-width: 0; font-size: 14px; font-weight: var(--w-bold, 700); letter-spacing: .09em; text-transform: uppercase; color: var(--ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .swho { width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .swho i { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: var(--c); color: var(--on-person, #fff); font-style: normal; font-size: 13px; font-weight: var(--w-heavy, 800); display: flex; align-items: center; justify-content: center; transform: scale(.88); transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.4,.4,1); }
    .swho[aria-pressed='true'] i { transform: scale(1.12); box-shadow: 0 0 0 2.5px var(--chip-strong), 0 0 0 5px var(--c); }
    .srecs { flex: 1; min-height: 0; container-type: size; display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 8px; align-content: start; justify-items: center; --row: calc((100cqh - (var(--rows) - 1) * 8px) / var(--rows)); }
    /* the label has the whole column (the record alone is sized by the row), so a long name is not cut */
    .srec { width: 100%; min-width: 44px; display: flex; flex-direction: column; align-items: center; gap: 4px; touch-action: none; border-radius: 14px; }
    .srec .puck.onshelf { width: min(100%, max(44px, calc(var(--row) - 49px))); }
    .puck.onshelf { position: static; margin: 0; width: 100%; height: auto; aspect-ratio: 1; display: block; transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.4,.4,1); }
    .srec:active .puck.onshelf { transform: scale(1.08) rotate(14deg); }
    .srec[data-lifted] .puck.onshelf { opacity: .3; }
    .srec span { max-width: 100%; height: 45px; font-size: 14px; line-height: 15px; font-weight: var(--w-semi, 600); text-align: center; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
    .srec.more { justify-content: center; align-self: stretch; background: var(--chip-strong); font-size: 15px; font-weight: var(--w-bold, 700); }
    .snone { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; font-size: 14px; font-weight: var(--w-semi, 600); color: var(--ink2); }
    .wholeh { min-height: 58px; padding: 6px 12px; border-radius: 18px; border: 2.5px dashed var(--ink3); display: flex; align-items: center; justify-content: center; gap: 10px; text-align: left; line-height: 1.15; transition: background var(--m-2, 160ms), border-color var(--m-2, 160ms), transform var(--mt-2, 160ms) cubic-bezier(.2,1.4,.4,1); }
    .wholeh b { display: block; font-size: 16px; font-weight: var(--w-bold, 700); } .wholeh span span { display: block; font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .wholeh[data-joined] { border-style: solid; border-color: var(--ink2); background: var(--sel-bg); color: var(--sel-ink); } .wholeh[data-joined] span span { color: inherit; }
    .wholeb[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    .wholeh[data-open] { border-color: var(--primary); animation: landp 1.1s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    .wholeh[data-hot] { border-style: solid; border-color: var(--primary); background: color-mix(in srgb, var(--primary) 22%, transparent); transform: scale(1.03); animation: none; }
    /* each room's speaker: louder music sends its ripples further */
    .zspk { position: absolute; right: 30px; top: 28px; width: 0; height: 0; pointer-events: none; }
    .zspk i { position: absolute; left: -22px; top: -22px; width: 44px; height: 44px; border-radius: 50%; box-sizing: border-box; border: 2.5px solid var(--c); opacity: 0; }
    .zspk b { position: absolute; left: -9px; top: -9px; width: 18px; height: 18px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 3px var(--chip-strong); }
    .mzone[data-playing] .zspk i { animation: zrip 2.4s ease-out infinite; animation-iteration-count: var(--loops, infinite); }
    .mzone[data-playing] .zspk i + i { animation-delay: -1.2s; }
    @keyframes zrip { from { transform: scale(.5); opacity: .85; } to { transform: scale(var(--amp, 1.8)); opacity: 0; } }
    /* while something is being carried, every room shows where it can land */
    .land { position: absolute; left: 50%; top: 60%; width: 58px; height: 58px; margin: -29px 0 0 -29px; border-radius: 50%; box-sizing: border-box; border: 2.5px dashed var(--c); pointer-events: none; animation: landp 1.1s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    .mzone[data-hot] .land { border-style: solid; background: color-mix(in srgb, var(--c) 28%, transparent); }
    @keyframes landp { from { transform: scale(.94); } to { transform: scale(1.06); } }
    :host([data-phone]) .maprow, :host([data-shape='tall']) .maprow { flex-direction: column; }
    :host([data-phone]) .maprow { flex: none; }
    :host([data-phone]) .mshelf, :host([data-shape='tall']) .mshelf { flex: none; }
    :host([data-phone]) .srecs, :host([data-shape='tall']) .srecs { flex: none; container-type: normal; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); --row: 126px; }
    /* on a tall screen the shelf is a strip under the house: whose shelf, the records, the whole house */
    :host([data-shape='tall']:not([data-phone])) .mshelf { flex-direction: row; align-items: center; gap: 14px; }
    :host([data-shape='tall']:not([data-phone])) .shead { flex: 0 0 108px; }
    :host([data-shape='tall']:not([data-phone])) .srecs { flex: 1 1 0; min-width: 0; }
    :host([data-shape='tall']:not([data-phone])) .snone { flex-direction: row; text-align: left; }
    :host([data-shape='tall']:not([data-phone])) .wholeh { flex: 0 0 176px; align-self: stretch; }
    :host([data-phone]) .map { flex: none; }
    :host([data-phone]) .map:not(.snug) .floor { flex: none; flex-wrap: wrap; }
    :host([data-phone]) .map:not(.snug) .mroom { flex: var(--size, 1) 1 calc(var(--size, 1) * 140px); height: 236px; } :host([data-phone]) .zname b { white-space: normal; flex-wrap: wrap; line-height: 1.1; }
    :host([data-phone]) .mstairs { display: none; }
    .map[data-fit] .floor { min-height: 78px; }
    .map[data-fit] .puck { width: 56px; height: 56px; margin-left: -28px; }
    :host([data-shape='tall']) { flex-direction: column; }
    /* a landscape tablet under 900 px wide: the same stack, and the page scrolls so the panel keeps a usable height */
    :host([data-stack]) { overflow-y: auto; gap: 12px; scrollbar-width: none; }
    :host([data-stack]) .panel { flex: 0 0 780px; }
    :host([data-stack]) .stage { order: 2; }
    :host([data-shape='tall']) .stage { width: auto; flex-direction: row; flex-wrap: wrap; align-items: center; }
    :host([data-shape='tall']) .stage > *:not(.bg) { flex: 1 1 100%; }
    :host([data-shape='tall']) .stage { gap: 6px; padding: 14px 18px; flex: 0 0 auto; }
    :host([data-shape='tall']) .panel { min-height: 0; }
    :host([data-shape='tall']) .deck { flex: 0 0 140px; height: 140px; min-height: 0; }
    :host([data-shape='tall']) .stage .titles { flex: 1 1 0; min-width: 0; }
    /* ---- polish pass ---- */
    /* the tab pictures in the title row get their words when the page is wide enough */
    .panel { container: panel / inline-size; }
    .tabs.inline[data-words] button { flex: 0 0 auto; padding: 0 12px; gap: 6px; } .tabs.inline[data-words] button span { display: inline; }
    /* Whole house is a plain button: play is the one filled key in the toolbar */
    .wholeb { background: var(--chip-strong); box-shadow: inset 0 0 0 2px var(--track); font-size: 15px; font-weight: var(--w-bold, 700); flex-shrink: 0; }
    .acts .pill[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    /* the house: a room's volume is a level you can see, with its number inside and a bar to hold. The level runs between the quieter button at the bottom and the louder button under the ＋. */
    .pool, .grab, .zvol, .mzone::after { --r0: 56px; --r1: 104px; --lvl: calc(var(--r0) + (100% - var(--r0) - var(--r1)) * var(--v, 0) / 100); }
    @container zone (max-height: 219px) { .pool, .grab, .zvol, .mzone::after { --r0: 14px; --r1: 58px; } .mzone > .vstep { display: none; } }
    @container zone (max-width: 139px) { .puck { left: 44%; } }
    .zvol { position: absolute; left: 12px; bottom: 8px; font-size: 20px; line-height: 1; font-weight: var(--w-bold, 700); font-variant-numeric: tabular-nums; pointer-events: none; transform-origin: left bottom; transition: transform var(--m-2, 160ms) var(--e-spring, ease); }
    .mzone:not([data-live]) .zvol { color: var(--ink2); }
    .mzone[data-held] .zvol { transform: scale(1.4); } .mzone[data-held] .grab i { transform: scale(1.15); }
    .mzone > .vstep { position: absolute; right: 12px; z-index: 1; } .mzone > .vstep[data-step='up'] { top: 54px; } .mzone > .vstep[data-step='down'] { bottom: 6px; }
    .zname b { display: flex; align-items: center; } .zname b .linkd { flex-shrink: 0; }
    /* calling: a picture on every ready message; with the keyboard up the rooms and the messages stay in reach */
    .bpic { font-size: 26px; line-height: 1; flex-shrink: 0; }
    .sayrow { display: flex; gap: 10px; align-items: center; } .qpics { display: flex; gap: 4px; flex-shrink: 0; }
    .qpic { width: 44px; height: 44px; border-radius: 12px; background: var(--chip); font-size: 22px; display: inline-flex; align-items: center; justify-content: center; } .qpic[aria-pressed='true'] { background: var(--sel-bg); box-shadow: var(--sel-ring); }
    .rchips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; } .rchip { font-size: 15px; } .rchip[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-bold, 700); }
    :host([data-phone]) .sayrow { flex-wrap: wrap; } :host([data-phone]) .qpics { flex: 1 1 100%; justify-content: space-between; }
    /* calm mode and "reduce motion": nothing on the Music page moves by itself, not even once */
    :host([data-still]) *, :host([data-still]) *::before, :host([data-still]) *::after { animation: none !important; }
  `];

  static properties = { hass: { attribute: false }, players: { attribute: false }, stations: { attribute: false }, source: {}, preferred: {}, kids: { attribute: false }, people: { attribute: false }, pin: {}, quiet: { attribute: false }, sleepMinutes: { type: Number }, map: { attribute: false }, hide: { attribute: false }, lock: { type: Boolean }, moments: { attribute: false }, callVolume: { type: Number }, callLanguage: {}, callVoice: {}, _jog: { state: true }, _sleepAt: { state: true }, _momentOn: { state: true }, _padSet: { state: true }, _momentBusy: { state: true }, theme: { reflect: true, attribute: 'data-theme' }, _view: { state: true }, _dv: { state: true }, _held: { state: true }, _viewAsk: { state: true }, _sd: { state: true }, _peek: { state: true }, _carry: { state: true }, _shelfTo: { state: true }, _crateAt: { state: true },
    _tab: { state: true }, _focus: { state: true }, _thumbs: { state: true }, _resolved: { state: true }, _msg: { state: true }, _q: { state: true }, _text: { state: true }, _caps: { state: true }, _hits: { state: true }, _busy: { state: true }, _keys: { state: true },
    _sel: { state: true }, _shelf: { state: true }, _items: { state: true }, _edit: { state: true }, _juke: { state: true }, _keep: { state: true }, _callTo: { state: true }, _calling: { state: true }, _callMsg: { state: true }, _pinAsk: { state: true }, _pinTo: { state: true }, _adding: { state: true }, _jpick: { state: true }, _now: { state: true }, _ckeys: { state: true }, _coach: { state: true } };
  hass?: Hass;
  players: string[] = [];
  stations: (string | StationConfig)[] = [];
  source = 'media-source://radio_browser/country/AU';
  preferred = '';
  kids: KidConfig[] = [];
  people: { name: string; colour: ColourSlot }[] = [];
  pin = '';
  quiet: { start?: string; end?: string } = {};
  sleepMinutes = 30;
  map: MapFloorConfig[] = [];
  hide: string[] = [];
  /** with a house map: only the speakers it names, and the ones that cannot be reached stay in place, offline */
  lock = true;
  moments: MomentConfig[] = [];
  /** how loud a call to a room is spoken (0–100), and in which language and voice */
  callVolume = 70;
  callLanguage = 'en-AU';
  callVoice = '';
  /** how far the jog wheel has been turned in this gesture, in degrees */
  private _jog: number | null = null;
  private _momentOn: { name: string; lead: string } | null = null;
  private _momentBusy = '';
  /** a sleep fade started from this panel: which speaker and when it ends */
  private _sleepAt: { id: string; until: number } | null = null;
  /** music put on a pad from this panel (behind the PIN): it replaces what the pad looks for, and keeps the pad's rooms and volume */
  private _padSet = ls<Record<string, { uri: string; title: string }>>('fh-moments', {});
  private get _pads(): MomentConfig[] { return (this.moments.length ? this.moments : MOMENTS).slice(0, 4); }
  private _padPut(pad: string, m: MediaHit | null): void {
    const { [pad]: _old, ...rest } = this._padSet;
    this._padSet = m ? { ...rest, [pad]: { uri: m.uri, title: m.name } } : rest; lsSet('fh-moments', this._padSet);
    this._say(m ? `${pad} now plays ${m.name}` : `${pad} is back to its own music`);
  }
  /** the photo theme, so the sound in each room can take its shape (waves, bubbles, stars…) */
  theme = '';
  private _view: ViewId | '' = ls<ViewId | ''>('fh-music-view', '');
  /** volumes being dragged, shown until Home Assistant reports them */
  private _dv: Record<string, number> = {};
  /** the room whose volume is being dragged right now (its thumb grows and its number shows) */
  private _held = '';
  private _viewAsk = false;
  /** the full player, brought back beside a full-page view */
  private _peek = false;
  private _sd: { id: string; x: number; y: number } | null = null;
  private _shelfAsked = false;
  /** which record is at the front of the crate */
  private _crateAt = 0;
  private _carry: { from?: string; item?: ShelfItem; art?: string; x: number; y: number; over: string } | null = null;
  private _carried = 0;
  private _prev: Tab = 'rooms';
  private _shelfTo = '';
  private _tab: Tab = 'rooms';
  private _focus = '';
  /** The bedroom a grown-up has just allowed (set only while that one action runs). */
  private _cleared = '';
  private _thumbs: Record<string, string> = {};
  private _resolved: Record<string, string> = {};
  private _loaded = false;
  private _radioTried = 0;
  private _msg = '';
  private _t?: number;
  private _q: QueueInfo | null = null;
  private _qKey = '';
  private _text = '';
  private _caps = true;
  private _hits: MediaHit[] | null = null;
  private _busy = false;
  private _keys = true;
  private _sel = '';
  private _shelf = 'Family';
  private _items: Record<string, ShelfItem[]> = {};
  private _edit = false;
  private _juke: Juke = ((j: Juke) => (j.day === today() ? j : { day: today(), on: false, who: '', picks: [] }))(ls<Juke>('fh-juke', { day: '', on: false, who: '', picks: [] }));
  private _keep = ls('fh-keep', false);
  private _callTo: string[] = [];
  private _callMsg = '';
  private _pinAsk: { reason: string; run: () => void } | null = null;
  private _pinTo: MediaHit | null = null;
  private _adding = false;
  /** Someone is choosing a jukebox song from pictures. */
  private _jpick = false;
  private _ckeys = false;
  private _now = Date.now();
  private _tick?: number;
  private _was = '';
  private _lastUri = '';
  private _lastCall = 0;
  private _fedFor = '';
  private _fedName = '';

  connectedCallback(): void { super.connectedCallback(); this._tick = window.setInterval(() => { this._calm(); if (this._cur?.state === 'playing' || this._sleepAt) this._now = Date.now(); }, 1000); }
  disconnectedCallback(): void { super.disconnectedCallback(); clearInterval(this._tick); }
  protected firstUpdated(): void {
    // remember the control last pressed, so a slow answer from Home Assistant can be shown on it
    const note = (e: Event): void => { const el = (e.composedPath() as EventTarget[]).find((n): n is Element => n instanceof Element && n.matches('button, [role=button], [role=slider], [role=switch], [role=tab]')); if (el) { this._pressEl = el; this._pressAt = Date.now(); } };
    for (const t of ['pointerdown', 'pointerup', 'keydown']) this.renderRoot.addEventListener(t, note, true);
    this._calm();
  }
  /** Calm mode and "reduce motion": nothing on this page moves by itself (see :host([data-still]) in the styles). */
  private _calm(): void { this.toggleAttribute('data-still', getComputedStyle(this).getPropertyValue('--loops').trim() === '0' || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)); }
  private _pressEl: Element | null = null; private _pressAt = 0; private _hx?: Hass;
  /** Home Assistant, watched: a control whose call is still out after 250 ms shows it (data-busy) until the answer comes. */
  private get _h(): Hass {
    const real = this.hass!;
    if (!this._hx || Object.getPrototypeOf(this._hx) !== real) { this._hx = Object.create(real) as Hass; this._hx.callService = (d, s, data, target) => {
      // the same request is never sent twice while the first is still out: a second tap on Pause, "+" or Whole house waits for the answer
      const key = `${d}.${s} ${JSON.stringify(data ?? {})} ${JSON.stringify(target ?? {})}`, out = this._out.get(key); if (out) return out as ReturnType<Hass['callService']>;
      const p = this._watch(inTime(real.callService(d, s, data, target))), clear = (): void => { this._out.delete(key); }; this._out.set(key, p); p.then(clear, clear); return p; }; }
    return this._hx;
  }
  private _out = new Map<string, Promise<unknown>>();
  private _watch<T>(p: Promise<T>): Promise<T> {
    const el = Date.now() - this._pressAt < 1200 ? this._pressEl : null;
    if (el) { const t = window.setTimeout(() => { el.setAttribute('data-busy', ''); el.setAttribute('aria-busy', 'true'); }, 250), done = (): void => { clearTimeout(t); el.removeAttribute('data-busy'); el.removeAttribute('aria-busy'); }; p.then(done, done); }
    return p;
  }
  private _undoLabel = 'Undo';
  private _say(m: string, undo?: () => void, label = 'Undo'): void { this._msg = m; this._undo = undo ?? null; this._undoLabel = label; clearTimeout(this._t); this._t = window.setTimeout(() => { this._msg = ''; this._undo = null; }, undo ? 7000 : Math.max(4000, m.split(/\s+/).length * 450)); }
  /** Something did not work: say so plainly and calmly, and keep the detail for the console. */
  private _oops(what: string, e?: unknown): void { if (e) console.warn('Family Hub:', what, e); sfx('error'); this._say(e instanceof SlowError ? SLOW_SAY : `${what}. Try again in a moment.`); }
  private _undo: (() => void) | null = null;

  private get _list(): HassEntity[] {
    if (!this.hass?.states) return []; // Home Assistant is reconnecting
    const h = this.hass, found = rooms(h, this.players);
    let all = found;
    if (this.lock && this.map.length) {
      // the house map is the whole list: a speaker found elsewhere is not shown, and one that cannot be reached keeps its place
      const want = this.map.flatMap((f) => (f.rooms ?? []).flatMap((r) => (r.zones ?? (r.player ? [{ player: r.player, name: r.name }] : [])).map((z) => ({ id: z.player ?? '', name: z.name ?? r.name ?? '' })))).filter((z) => z.id);
      const seen = new Set<string>();
      all = want.map((z) => findRoom(h, found, z.id) ?? h.states[z.id] ?? ({ entity_id: z.id, state: 'unavailable', attributes: { friendly_name: z.name || z.id.split('.').pop() } } as unknown as HassEntity))
        .filter((p) => !seen.has(p.entity_id) && !!seen.add(p.entity_id));
    }
    if (!this.hide.length) return all;
    const gone = new Set(this.hide.map((id) => findRoom(h, all, id)?.entity_id ?? id));
    return all.filter((p) => !gone.has(p.entity_id));
  }
  private _off(p?: HassEntity): boolean { return !p || p.state === 'unavailable'; }
  /** Home speakers that cannot be reached right now. */
  private get _offline(): HassEntity[] { return this._list.filter((p) => this._off(p)); }
  private get _cur(): HassEntity | undefined {
    const l = this._list;
    if (!this.hass) return undefined; // before Home Assistant has connected there is no room to show
    return l.find((p) => p.entity_id === this._focus) ?? findRoom(this.hass, l, this.preferred) ?? l.find((p) => p.state === 'playing') ?? l.find((p) => !this._off(p)) ?? l[0];
  }
  private get _stations(): StationConfig[] {
    const s = this.stations.length ? this.stations : DEFAULT_STATIONS;
    return s.map((x) => typeof x === 'string' ? { name: x, match: x } : x);
  }
  private get _everyone(): { name: string; colour: ColourSlot }[] { return [...this.people.filter((p) => !this.kids.some((k) => k.name === p.name)), ...this.kids.map((k) => ({ name: k.name, colour: k.colour }))]; }
  /** Tonight's DJ, if a child has cashed in the reward. */
  private get _dj(): string { const d = ls<{ kid: string; day: string } | null>('fh-dj', null); return d && d.day === today() ? d.kid : ''; }
  /** What the family calls it: the room's name on the map, else the speaker's own name. */
  private _name(p?: HassEntity): string { if (!p) return 'a speaker'; for (const f of this._floors) for (const r of f.rooms) for (const z of r.zones) if (z.p.entity_id === p.entity_id) return z.name || r.name; return String(p.attributes.friendly_name ?? 'a speaker'); }
  private _mix(p?: HassEntity): string[] { return ((p?.attributes.group_members as string[] | undefined) ?? []).filter((id) => id !== p?.entity_id); }
  private _guard(reason: string, run: () => void): void { if (this.pin) this._pinAsk = { reason, run }; else run(); }

  private async _loadRadio(): Promise<void> {
    const key = this.source + JSON.stringify(this.stations);
    if (CACHE.key === key) { this._thumbs = CACHE.thumbs; this._resolved = CACHE.res; return; }
    if (this._loaded || !this.hass || Date.now() - this._radioTried < 30_000) return; // after a failure, wait before asking again
    this._loaded = true; this._radioTried = Date.now();
    try {
      const r = await this.hass.callWS<{ children: { title: string; media_content_id: string; thumbnail?: string }[] }>({ type: 'media_source/browse_media', media_content_id: this.source });
      const thumbs: Record<string, string> = {}, res: Record<string, string> = {};
      for (const st of this._stations) {
        const want = st.id ? (st.id.startsWith('media-source://') ? st.id : `media-source://radio_browser/${st.id}`) : '';
        const hit = r.children.find((c) => want ? c.media_content_id === want : c.title.toLowerCase().includes((st.match ?? st.name).toLowerCase()));
        if (hit) { res[st.name] = hit.media_content_id; if (hit.thumbnail) thumbs[st.name] = hit.thumbnail; } else if (want) res[st.name] = want;
      }
      this._thumbs = thumbs; this._resolved = res;
      Object.assign(CACHE, { thumbs, res, key });
    } catch (e) { console.warn('Family Hub: radio browse failed', e); this._loaded = false; }
  }


  /** A room view other than the list takes the whole page: the player steps aside and its controls move into the bar above the view. */
  private get _full(): boolean { return this._tab === 'rooms' && this._mode !== 'list' && !this._peek && !!this._cur; }
  protected willUpdate(): void { this.toggleAttribute('data-full', !!this.hass && this._full); }
  /** Beside a full-page view the tabs are icons; they get their words back whenever the row has room for them (the search field may shrink to make it). */
  private _fitTabs(): void {
    const tabs = this.renderRoot.querySelector<HTMLElement>('.mhead[data-one] .tabs.inline'), head = tabs?.parentElement;
    if (!tabs || !head) return;
    tabs.setAttribute('data-words', '');
    const fin = head.querySelector<HTMLElement>('.finder'), nb = head.querySelector<HTMLElement>('.nowbar');
    // the search field and the hint share one place: whichever is showing must keep at least 118 px, so the words do not come and go with the hint
    const slot = fin?.offsetParent ? fin : head.querySelector<HTMLElement>('.hint[data-on]');
    // the hint is never cut: the tab words go first, and if it is still cut it takes a row of its own
    const hint = head.querySelector<HTMLElement>('.hint[data-on]'), cut = (): boolean => !!hint && hint.scrollHeight > hint.clientHeight + 1;
    const ok = head.scrollWidth <= head.clientWidth + 1 && (!slot || slot.offsetWidth >= 118) && (!nb || nb.offsetWidth >= 230) && !cut();
    if (!ok) tabs.removeAttribute('data-words');
  }
  /** A hint that is still cut after that borrows the small player's place; as a last resort it runs to a third line where it is. */
  private _fitHint(): void {
    const hint = this.renderRoot.querySelector<HTMLElement>('.hint[data-on]'), cut = (): boolean => !!hint && hint.scrollHeight > hint.clientHeight + 1;
    if (cut()) hint!.closest('.mhead')?.setAttribute('data-hintwide', '');
    if (cut()) hint!.setAttribute('data-wrap', '');
  }
  protected updated(ch: PropertyValues): void {
    // a change of tab fades its body in and its icon nods; arriving on the page does neither (the page itself is what arrives)
    if (ch.has('_tab') && ch.get('_tab') !== undefined) { const m = motion(this, '--m-3');
      this.renderRoot.querySelector('.panel > .body')?.animate([{ opacity: 0, transform: `translateY(${m.travel ? 8 : 0}px)` }, { opacity: 1, transform: 'none' }], { duration: m.ms || 240, easing: 'ease-out' });
      this.renderRoot.querySelectorAll('.tabs button').forEach((b) => b.toggleAttribute('data-nod', b.getAttribute('aria-selected') === 'true')); }
    this.renderRoot.querySelectorAll('.hint[data-wrap]').forEach((h) => h.removeAttribute('data-wrap')); this.renderRoot.querySelector('.mhead[data-hintwide]')?.removeAttribute('data-hintwide');
    this._fitTabs(); this._fitHint();
    const p = this._cur;
    if (!this.hass || !p) return;
    // refresh "up next" when the track or the room changes
    const key = `${p.entity_id}|${p.attributes.media_content_id ?? ''}|${p.state === 'playing'}`;
    if (key !== this._qKey) { this._qKey = key; queue(this.hass, p.entity_id).then((q) => { this._q = q; this._feed(); }); }
    if (ch.has('hass')) {
      // the music ran out: the jukebox plays the next pick, otherwise "keep it going" starts a radio from the last thing played
      const state = `${p.entity_id}:${p.state}`;
      if (this._was === `${p.entity_id}:playing` && p.state === 'idle') { if (!this._feed(true) && this._keep && this._lastUri) play(this._h, p.entity_id, this._lastUri, 'play', true).catch(() => { /* this service has no radio mode */ }); }
      this._was = state;
    }
  }

  private _play(st: StationConfig): void {
    const p = this._cur, id = this._resolved[st.name];
    if (!p) return;
    if (!id) { this._say(`Couldn’t find ${st.name} – check the station list`); return; }
    sfx('static'); // between two stations
    this._gentle(p.entity_id, () => { this._h.callService('media_player', 'play_media', { entity_id: p.entity_id, media_content_id: id, media_content_type: 'music' })
      .then(() => { LAST[p.entity_id] = st.name; this.requestUpdate(); this._say(`${st.name} in ${this._name(p)}`); })
      .catch((e: unknown) => this._oops(`${this._name(p)} couldn’t play that`, e)); });
  }

  /* ---------------- transport ---------------- */
  /** Every way music can start goes through _gentle, so a bedroom after bedtime always asks a grown-up first. Pausing, turning down and leaving never ask. */
  private _svc(service: string, data: Record<string, unknown> = {}, id = this._cur?.entity_id): void {
    if (!id) return;
    const p = this._list.find((x) => x.entity_id === id) ?? this.hass!.states[id], st = p?.state, starts = service === 'media_play' || (service === 'media_play_pause' && st !== 'playing' && st !== 'buffering');
    if (this._off(p)) { this._say(`${this._name(p)} is offline`); return; }
    const run = (): void => { this._h.callService('media_player', service, { entity_id: id, ...data }).catch((e: unknown) => this._oops(`${this._name(p)} didn’t answer`, e)); };
    if (starts) this._gentle(id, run); else run();
  }
  private _start(m: MediaHit, mode: 'play' | 'next' | 'add' = 'play', radio = false, room = this._cur): void {
    if (!room) { this._say('No speaker to play on'); return; }
    this._gentle(room.entity_id, () => { this._lastUri = m.uri;
    play(this._h, room.entity_id, m.uri, mode, radio)
      .then(() => this._say(mode === 'play' ? `${radio ? 'Radio from ' : ''}${m.name} on ${this._name(room)}` : mode === 'next' ? `${m.name} plays next` : `${m.name} added to the queue`))
      .catch((e: unknown) => this._oops(`${this._name(room)} couldn’t play that`, e)); });
  }
  private _heart(): void {
    const b = this._cur && sibling(this.hass!, this._cur.entity_id, /^button\..*favou?rite_current_song$/);
    if (!b || this.hass!.states[b].state === 'unavailable') { this._say('Nothing playing to save'); return; }
    this._h.callService('button', 'press', {}, { entity_id: b }); this._say('Saved to favourites ♥');
  }
  private _sleepLeft(p?: HassEntity): number | null { const s = this._sleepAt; return p && s && s.id === p.entity_id && s.until > Date.now() ? Math.max(1, Math.ceil((s.until - Date.now()) / 60_000)) : null; }
  /** Start a sleep fade in the room in the player, or call it off if one is running there. Not for a speaker that cannot be reached. */
  private _sleep(): void {
    const p = this._cur; if (!p) return;
    if (this._off(p)) { this._say(`${this._name(p)} is offline`); return; }
    const cancel = (): void => { const off = sleepOff(this._h, p.entity_id); this._sleepAt = null; this._say(off ? `Sleep fade cancelled in ${this._name(p)}` : 'Couldn’t cancel the sleep fade'); };
    if (this._sleepLeft(p) !== null) { cancel(); return; }
    const ok = sleepIn(this._h, p.entity_id, this.sleepMinutes);
    if (ok) this._sleepAt = { id: p.entity_id, until: Date.now() + this.sleepMinutes * 60_000 };
    this._say(ok ? `${this._name(p)} will fade out in ${this.sleepMinutes} minutes` : 'The sleep timer needs the Family Hub sleep script in Home Assistant', ok ? cancel : undefined);
  }

  /* ---------------- rooms ---------------- */
  /** The speakers leading everything that is playing right now. */
  private get _playing(): HassEntity[] { const seen = new Set<string>(); return this._list.map((p) => this._leader(p)).filter((l): l is HassEntity => !!l && l.state === 'playing' && !seen.has(l.entity_id) && !!seen.add(l.entity_id)); }
  /** The music to spread: what is playing. If two different things are playing, the one in the selected room. Nothing playing: nothing to spread (a silent room is never spread). */
  private _source(): HassEntity | undefined { const cur = this._cur, mine = cur && this._leader(cur), all = this._playing; return (mine && all.find((l) => l.entity_id === mine.entity_id)) ?? all[0]; }
  /** A piece of music's rooms: the speaker that leads it, then the ones grouped with it. */
  private _group(lead?: HassEntity): string[] { return lead ? [lead.entity_id, ...this._mix(lead)] : []; }
  /** Add a room to the music, or take it out. The music is what the player shows; when the selected room is silent it is whatever is playing, so a room is never joined to silence. */
  private _join(id: string): void {
    const cur = this._cur, mine = cur && this._leader(cur), src = mine ?? this._source();
    if (!src) { this._focus = id; this._say('Nothing is playing yet'); return; }
    if (id === src.entity_id) { if (mine) this._svc('media_play_pause', {}, id); else this._focus = id; return; }
    if (this._group(src).includes(id)) { if (mine) this._h.callService('media_player', 'unjoin', {}, { entity_id: id }).catch((e: unknown) => this._oops('Couldn’t take that room out', e)); else this._focus = id; return; }
    this._gentle(id, () => { this._h.callService('media_player', 'join', { group_members: [id] }, { entity_id: src.entity_id })
      .then(() => { if (!mine) this._say(`${this._name(this.hass!.states[id])} joined the music in ${this._name(src)}`); }).catch((e: unknown) => this._oops('Couldn’t add that room', e)); });
  }
  /** Music for every room at once reaches the bedrooms too: after bedtime that needs a grown-up. */
  private _wholeHouse(run: () => void): void { if (this._floors.some((f) => f.rooms.some((r) => r.asleep && r.zones.length))) this._guard('Some bedrooms are asleep. Play in the whole house anyway?', () => { this._cleared = '*'; try { run(); } finally { this._cleared = ''; } }); else run(); }
  /** The Whole house button, wherever it is: spread the music that is playing, whichever room is selected. */
  /** True when the music that is playing is already in every room that can be reached. */
  /** The speakers that count as "the whole house": the ones on the house map when there is one. A speaker Home Assistant has found that is not on the map
   *  (a neighbour's, or one on another network the laptop has joined) can still be played to by itself, but never by "Whole house", "Everyone" or an "all rooms" pad. */
  private get _homeList(): HassEntity[] {
    const list = this._list; if (!this.map?.length || !this.hass) return list;
    const ids = new Set<string>();
    for (const f of this.map) for (const r of f.rooms ?? []) for (const z of r.zones ?? (r.player ? [{ player: r.player }] : [])) { const p = findRoom(this.hass, list, z.player); if (p) ids.add(p.entity_id); }
    return ids.size ? list.filter((p) => ids.has(p.entity_id)) : list;
  }
  private get _allJoined(): boolean {
    const src = this._source(); if (!src) return false;
    const lead = this._leader(src) ?? src, mix = this._mix(lead), others = this._homeList.filter((x) => !this._off(x) && x.entity_id !== lead.entity_id);
    return others.length > 0 && others.every((x) => mix.includes(x.entity_id));
  }
  private _spread(): void {
    const src = this._source();
    if (!src) { this._say('Nothing is playing yet'); return; }
    if (this._allJoined) { this._say(`Already playing in the whole house. “Just ${this._name(this._leader(src) ?? src)}” takes the other rooms out.`); return; }
    this._wholeHouse(() => { this._focus = src.entity_id; this._everywhere(true, src); });
  }
  private _everywhere(on: boolean, p = this._cur): void {
    if (!p) return;
    if (this._off(p)) { this._say(`${this._name(p)} is offline`); return; }
    if (!on) { for (const id of this._mix(p)) this._h.callService('media_player', 'unjoin', {}, { entity_id: id }).catch((e: unknown) => this._oops('Couldn’t take that room out', e)); return; }
    const h = this._h, was = this._mix(p), ids = this._homeList.filter((x) => !this._off(x)).map((x) => x.entity_id).filter((id) => id !== p.entity_id), off = this._offline.map((x) => this._name(x));
    if (!ids.length) { this._say(off.length ? 'Every other speaker is offline' : 'There is only one speaker'); return; }
    // what each other room was doing, so one tap can put it back
    const groups = this._list.filter((x) => x.entity_id !== p.entity_id && !was.includes(x.entity_id) && this._leader(x)?.entity_id === x.entity_id).map((x) => ({ id: x.entity_id, members: this._mix(x), playing: x.state === 'playing' }));
    // one join at a time: a second tap while Home Assistant is still answering is ignored (it would group the rooms twice and say so twice)
    if (this._wholeBusy) return;
    this._wholeBusy = true;
    h.callService('media_player', 'join', { group_members: ids }, { entity_id: p.entity_id })
      .then(() => this._say(`Playing in the whole house${off.length ? `, except ${off.join(' and ')} (offline)` : ''}`, () => {
        for (const id of ids) if (!was.includes(id)) h.callService('media_player', 'unjoin', {}, { entity_id: id }).catch(() => { /* said below if it matters */ });
        window.setTimeout(() => { for (const g of groups) { if (g.members.length) h.callService('media_player', 'join', { group_members: g.members }, { entity_id: g.id }).catch(() => { /* best effort */ }); if (g.playing) h.callService('media_player', 'media_play', {}, { entity_id: g.id }).catch(() => { /* best effort */ }); } }, 600);
        this._say('Put back as it was');
      })).catch((e: unknown) => this._oops('Couldn’t reach every room', e)).finally(() => { this._wholeBusy = false; });
  }
  private _wholeBusy = false;
  private _move(to: HassEntity, from = this._cur): void {
    if (!from) return;
    if (this._asleep(to.entity_id) && this._cleared !== to.entity_id && this._cleared !== '*') { this._gentle(to.entity_id, () => this._move(to, from)); return; }
    if (!hasMa(this.hass!)) { this._h.callService('media_player', 'join', { group_members: [to.entity_id] }, { entity_id: from.entity_id }).then(() => this._say(`${this._name(to)} added (moving music needs Music Assistant)`)).catch((e: unknown) => this._oops(`Couldn’t add that room`, e)); return; }
    this._h.callService('music_assistant', 'transfer_queue', { source_player: from.entity_id, auto_play: true }, { entity_id: to.entity_id })
      .then(() => { this._focus = to.entity_id; this._say(`Music moved to ${this._name(to)}`); }).catch((e: unknown) => this._oops(`Couldn’t move the music`, e));
  }


  /* ---------------- the house ---------------- */
  private get _mode(): ViewId { return VIEWS.some((v) => v.id === this._view) ? this._view as ViewId : this.map.length ? 'house' : 'list'; }
  /** A room's volume as shown: the one being dragged or just sent, else what Home Assistant reports. */
  private _volOf(p?: HassEntity): number | null { if (!p) return null; const id = p.entity_id; return id in this._dv ? this._dv[id] : typeof p.attributes.volume_level === 'number' ? Math.round(p.attributes.volume_level * 100) : null; }
  /** Show a volume while it is dragged; on `commit` send it. If Home Assistant refuses, the thumb glides back to what the speaker really has and the page says so. */
  private _volFrom: Record<string, number> = {};
  private _setVol(id: string, to: number, commit: boolean, back = false): void {
    const v = Math.max(0, Math.min(100, Math.round(to)));
    const p = this._list.find((x) => x.entity_id === id), real = typeof p?.attributes.volume_level === 'number' ? Math.round(p.attributes.volume_level * 100) : null;
    // where a drag started, so a slip of more than 30 points can be taken back
    if (!commit && !(id in this._volFrom) && real !== null) this._volFrom[id] = real;
    // a soft detent every ten points while it slides, and one small note when it is let go
    const shown = this._dv[id] ?? real; if (!commit && shown !== null && shown !== undefined && Math.floor(shown / 10) !== Math.floor(v / 10)) sfx('slide');
    this._dv = { ...this._dv, [id]: v }; this._held = commit ? '' : id;
    if (!commit) return;
    if (!back) sfx('set');
    const from = this._volFrom[id]; delete this._volFrom[id];
    if (!back && from !== undefined && Math.abs(v - from) > 30) this._say(`${this._name(p)}: volume ${from} to ${v}`, () => this._setVol(id, from, true, true), `Back to ${from}`);
    const clear = (): void => { if (this._dv[id] === v) { const { [id]: _gone, ...rest } = this._dv; this._dv = rest; } };
    this._h.callService('media_player', 'volume_set', { entity_id: id, volume_level: v / 100 })
      .then(() => { window.setTimeout(clear, 900); }, (e: unknown) => { clear(); this._oops(`Couldn’t change the volume in ${this._name(this._list.find((x) => x.entity_id === id))}`, e); }); // hold the new level until Home Assistant reports it
  }
  /** A drag that was called off (the page scrolled instead): forget what was shown. */
  private _volDrop(id: string): void { const { [id]: _gone, ...rest } = this._dv; this._dv = rest; this._held = ''; delete this._volFrom[id]; }
  private _volStep(id: string, by: number): void { const v = this._volOf(this._list.find((x) => x.entity_id === id)); if (v !== null) this._setVol(id, v + by, true); }
  /** A person's face: a child's avatar, head only (as in the dock); an initial for anyone without one. */
  private _face(name: string, size: number): TemplateResult | string {
    const k = this.kids.find((x) => x.name === name);
    if (k) { const raw = this.hass?.states[kidEntities(k).avatar]?.state, look = raw || k.look ? decodeLook(raw, k.look ? decodeLook(k.look) : {}) : null;
      if (look) return renderAvatar(look, { size, crop: 'head', still: true, label: name, age: k.age, ring: slotVar(k.colour) }); }
    return shortNames([...this._everyone.map((x) => x.name), 'Family'])[name] ?? name[0];
  }
  /** What the other room views draw from, and the few things they can do. */
  private _vctx(): Ctx {
    const cur = this._cur, curLead = cur && this._leader(cur), grp = this._group(curLead), a = cur?.attributes ?? {};
    const others = [...new Set(this._list.map((p) => this._leader(p)?.entity_id).filter((id): id is string => !!id && id !== curLead?.entity_id))];
    const rooms: Room[] = this._floors.flatMap((f) => f.rooms.flatMap((r) => r.zones.map((z) => {
      const p = z.p, id = p.entity_id, lead = this._leader(p), vol = this._volOf(p), on = grp.includes(id);
      return { id, name: z.name, stream: lead?.entity_id ?? '', vol: vol ?? 0, hasVol: vol !== null, live: !!lead, playing: lead?.state === 'playing', focus: id === cur?.entity_id, on, inmix: on && id !== curLead?.entity_id, linked: !!lead && this._group(lead).length > 1, offline: this._off(p),
        asleep: r.asleep, lead: lead?.entity_id === id, colour: lead && lead.entity_id !== curLead?.entity_id ? `var(--p-${[3, 5, 4, 2][others.indexOf(lead.entity_id) % 4]})` : '', title: String(lead?.attributes.media_title ?? '') };
    })));
    const dur = Number(a.media_duration) || 0, at = a.media_position_updated_at ? new Date(a.media_position_updated_at).getTime() : 0, playing = cur?.state === 'playing';
    const pos = dur ? Math.min(dur, (Number(a.media_position) || 0) + (playing && at ? (this._now - at) / 1000 : 0)) : 0, frac = dur ? pos / dur : 0;
    const pads = this._pads, jog = this._jog, lit = this._momentOn && this.hass!.states[this._momentOn.lead]?.state === 'playing' ? this._momentOn.name : '';
    if (!this._shelfAsked) { this._shelfAsked = true; this._loadShelves(); }
    const kid = this.kids.find((k) => k.name === this._shelf), wind = !!kid && windDown(kid.bedtime), mine = this._items[this._shelf] ?? [], crate = wind ? mine.filter((x) => x.calm) : mine;
    const front = Math.max(0, Math.min(crate.length - 1, this._crateAt));
    if (this._mode === 'dial') this._loadRadio();
    // what plays next: tonight's jukebox picks in the order they will be taken, else whatever the queue holds
    const j = this._juke, turns = (w: string): number => j.picks.filter((x) => x.done && x.who === w).length;
    const waiting = j.on ? j.picks.filter((x) => !x.done).sort((p1, p2) => Number(p2.who === this._dj) - Number(p1.who === this._dj) || turns(p1.who) - turns(p2.who) || p1.t - p2.t) : [];
    const upNext = waiting.length ? waiting.slice(0, 3).map((x) => ({ title: x.name, sub: `${x.who}’s pick`, art: x.img ?? '' })) : this._q?.next ? [{ title: this._q.next.name, sub: this._q.next.sub ?? 'From the queue', art: this._q.next.img ?? '' }] : [];
    const people = this._everyone, asked = new Set(waiting.map((x) => x.who));
    const chooser = [...people].sort((p1, p2) => Number(asked.has(p1.name)) - Number(asked.has(p2.name)) || turns(p1.name) - turns(p2.name))[0]?.name ?? '';
    const favs = (this._items.Family ?? []).slice(0, 4), stns = this._stations.filter((st) => !favs.some((m) => m.name.toLowerCase() === st.name.toLowerCase())).slice(0, Math.max(0, 7 - favs.length)), station = cur && playing ? LAST[cur.entity_id] : '';
    const stops = [...favs.map((m) => ({ name: m.name, on: playing && !station && this._lastUri === m.uri, go: () => { if (cur) this._gentle(cur.entity_id, () => { delete LAST[cur.entity_id]; this._shelfPlay(m, cur); }); } })), ...stns.map((st) => ({ name: st.name, on: station === st.name, go: () => { if (cur) this._gentle(cur.entity_id, () => this._play(st)); } }))];
    const shape = shp();
    return { rooms, dial: { next: upNext, more: waiting.length ? Math.max(0, waiting.length - 3) : Math.max(0, (this._q?.items ?? 0) - 2), turn: people.map((x) => ({ name: x.name, face: html`${this._face(x.name, 48)}`, colour: slotVar(x.colour), now: x.name === chooser })), chooser,
        choose: (name) => { this._saveJuke({ who: name }); this._prev = 'rooms'; this._tab = 'juke'; this._jpick = true; },
        sleep: { mins: this.sleepMinutes, left: this._sleepLeft(cur), room: this._name(cur), can: !!cur && !this._off(cur) }, sleepGo: () => this._sleep(), stops: stops.map((x) => ({ name: x.name, on: x.on })),
        // the station or favourite already playing is left alone: tuning to it again would start it from the top
        tune: (i) => { if (stops[i] && !stops[i].on) { sfx('tune'); stops[i].go(); } } },
      moments: pads.map((m) => ({ name: m.name, icon: m.icon ?? MOMENT_ICON.find(([re]) => re.test(m.name))?.[1] ?? '🎵', on: lit === m.name, busy: this._momentBusy === m.name })), moment: (i) => { if (!this._momentBusy && pads[i]) { sfx('pad'); this._moment(pads[i]); } },
      jog: { turn: jog, at: pos, read: jog === null ? (dur ? clock(pos) : '') : dur ? clock(Math.max(0, Math.min(dur, pos + (jog / 360) * 120))) : Math.abs(jog) < 60 ? '' : jog > 0 ? 'Next' : 'Back', len: dur, says: dur ? `${clock(pos)} of ${clock(dur)}` : 'No length' },
      jogTo: (turn, commit) => this._jogTo(turn, commit, pos, dur), seekBy: (sec) => { if (dur) this._svc('media_seek', { seek_position: Math.max(0, Math.min(dur - 1, Math.round(pos + sec))) }); else this._svc(sec > 0 ? 'media_next_track' : 'media_previous_track'); },
      prev: () => this._svc('media_previous_track'), next: () => this._svc('media_next_track'),
      crate: { tabs: this._shelfNames.map((n) => ({ name: n, colour: slotVar(this.kids.find((k) => k.name === n)?.colour ?? 'family') })), who: this._shelf, pick: (n) => { if (n !== this._shelf) sfx('sleeve'); this._shelf = n; this._crateAt = 0; }, items: crate, at: front, calm: wind, room: this._name(cur),
        play: (m) => { if (Date.now() - this._carried < 400 || !cur) return; this._gentle(cur.entity_id, () => this._shelfPlay(m, cur)); }, flick: (i) => { if (i !== this._crateAt) sfx('sleeve'); this._crateAt = i; }, tap: (i) => { if (Date.now() - this._carried < 400) return; if (i !== front) { sfx('sleeve'); this._crateAt = i; } else if (cur && crate[i]) this._gentle(cur.entity_id, () => this._shelfPlay(crate[i], cur)); } }, streams: [...(curLead ? [curLead.entity_id] : []), ...others], sdrag: this._sd, setDrag: (d) => { this._sd = d; },
      join: (id, lead) => { if (id !== lead) this._gentle(id, () => { this._h.callService('media_player', 'join', { group_members: [id] }, { entity_id: lead }).catch((e: unknown) => this._oops('Couldn’t add that room', e)); }); },
      leave: (id) => { this._h.callService('media_player', 'unjoin', {}, { entity_id: id }).catch((e: unknown) => this._oops('Couldn’t take that room out', e)); },
      look: getLook(), theme: this.theme, phone: shape === 'phone', narrow: shape === 'phone' || shape === 'tall', over: this._carry?.over ?? '', lifted: this._carry?.from ?? '', liftedItem: this._carry?.item ?? null, shelf: this._items.Family ?? [],
      now: { title: String(a.media_title ?? (curLead ? 'Music' : 'Nothing playing')), artist: String(a.media_artist ?? a.media_album_name ?? ''), art: a.entity_picture ? String(a.entity_picture) : '', playing, frac, lead: curLead?.entity_id ?? '' },
      vol: (id, v, commit) => this._setVol(id, v, commit), step: (id, by) => this._volStep(id, by), drop: (id) => this._volDrop(id), held: this._held,
      toggle: (id) => { if (this._mode === 'scene') sfx('poke'); this._join(id); },
      focus: (id) => { this._focus = id; }, playPause: () => this._svc('media_play_pause'), all: () => this._spread(),
      carry: (e, id) => { const p = this.hass!.states[id]; if (p) this._carryDown(e, { lead: p }); },
      carryItem: (e, m, flick) => this._carryDown(e, { item: m, flick }), playItem: (m) => { if (Date.now() - this._carried > 400) this._start(m); } };
  }
  /** One press for an occasion: find the music, set the rooms and the volume, play. */
  private _moment(m: MomentConfig): void {
    const h = this._h, list = this._list, cur = this._cur;
    const all = m.rooms === 'all', ask: string[] = Array.isArray(m.rooms) ? m.rooms : [], put = this._padSet[m.name];
    const gone = (all ? this._homeList : ask.map((id) => findRoom(h, list, id)).filter((p): p is HassEntity => !!p)).filter((p) => this._off(p)).map((p) => this._name(p));
    const named = ask.map((id) => findRoom(h, list, id) ?? (h.states[id]?.entity_id.startsWith('media_player.') ? h.states[id] : undefined)).filter((p): p is HassEntity => !!p);
    // every room: the one in focus leads and the others join it
    const home = this._homeList, rooms = (all ? [...(cur && home.includes(cur) ? [cur] : []), ...home.filter((p) => p.entity_id !== cur?.entity_id)] : named.length ? named : cur ? [cur] : []).filter((p) => !this._off(p));
    if (!rooms.length) { this._say(this._offline.length ? 'Those speakers are offline' : 'No speaker to play on'); return; }
    if (named.length < ask.length) console.warn('Family Hub: a moment names a speaker that was not found', m);
    const run = async (): Promise<void> => {
      this._momentBusy = m.name;
      try {
        const found = put ? { name: put.title, uri: put.uri } : m.uri ? { name: m.name, uri: m.uri } : await findOne(h, m.find ?? m.name, m.kind ?? 'playlist');
        if (!found) { this._say(`Couldn’t find “${m.find ?? m.name}” to play`); return; }
        const lead = rooms[0], ids = rooms.map((r) => r.entity_id);
        // only the rooms this moment names: anything else still grouped with the leader is let go first
        for (const id of this._mix(lead)) if (!ids.includes(id)) h.callService('media_player', 'unjoin', {}, { entity_id: id });
        if (typeof m.volume === 'number') for (const id of ids) this._svc('volume_set', { volume_level: Math.max(0, Math.min(100, m.volume)) / 100 }, id);
        if (m.shuffle) this._svc('shuffle_set', { shuffle: true }, lead.entity_id);
        this._lastUri = found.uri;
        await play(h, lead.entity_id, found.uri, 'play');
        if (ids.length > 1) await h.callService('media_player', 'join', { group_members: ids.slice(1) }, { entity_id: lead.entity_id }).catch((e: unknown) => this._oops(`Couldn’t add every room`, e));
        this._focus = lead.entity_id; this._momentOn = { name: m.name, lead: lead.entity_id };
        this._say(`${m.name}: ${found.name === m.name ? '' : `${found.name} `}in ${all ? 'the whole house' : rooms.map((r) => this._name(r)).join(' and ')}${gone.length ? ` (${gone.join(' and ')} offline)` : ''}`);
      } catch (e: unknown) { this._oops(`${m.name} couldn’t start`, e); }
      finally { this._momentBusy = ''; }
    };
    if (rooms.some((r) => this._asleep(r.entity_id))) this._guard(`${m.name} plays in a bedroom after bedtime. Play anyway?`, () => { run(); }); else run();
  }
  /** The jog wheel: a turn moves through the song (a full turn is two minutes); past either end it skips. Music with no length skips a track each way. */
  /** The jog wheel: a turn moves through the song (a full turn is two minutes); past either end it skips. Music with no length skips a track each way. A tap, or a turn of a few degrees, is not a turn: the song stays where it is. */
  private _jogTo(turn: number, commit: boolean, pos: number, dur: number): void {
    if (!commit) { this._jog = turn; return; }
    this._jog = null;
    if (Math.abs(turn) < 4) return;
    if (!dur) { if (Math.abs(turn) >= 60) this._svc(turn > 0 ? 'media_next_track' : 'media_previous_track'); return; }
    const to = pos + (turn / 360) * 120;
    if (to >= dur - 1) this._svc('media_next_track'); else if (to < 0 && pos < 5) this._svc('media_previous_track'); else this._svc('media_seek', { seek_position: Math.max(0, Math.round(to)) });
  }
  /** The speaker a room's music comes from, if anything is on there (playing or paused). */
  private _leader(p: HassEntity): HassEntity | undefined {
    const mem = (x: HassEntity): string[] => (x.attributes.group_members as string[] | undefined) ?? [];
    const own = mem(p);
    let lead = p;
    if (!(own.length > 1 && own[0] === p.entity_id)) {
      const up = this._list.filter((x) => x.entity_id !== p.entity_id && mem(x).includes(p.entity_id));
      // a speaker that is itself playing is its own source when no real leader claims it (a stale group left behind elsewhere must not hide its music)
      lead = up.find((x) => mem(x)[0] === x.entity_id) ?? (['playing', 'paused', 'buffering'].includes(p.state) ? p : up[0]) ?? p;
    }
    return ['playing', 'paused', 'buffering'].includes(lead.state) ? lead : undefined;
  }
  /** Floors, top one first. Speakers the settings do not place go on a last row, so none can go missing. */
  private get _floors(): MapFloor[] {
    const h = this.hass!, list = this._list, used = new Set<string>(), now = minsNow(), wake = hm(this.quiet.end ?? '06:30');
    const find = (id?: string): HassEntity | undefined => { const p = findRoom(h, list, id); if (p) used.add(p.entity_id); return p; };
    const floors: MapFloor[] = this.map.map((f) => ({ name: f.name ?? '', rooms: (f.rooms ?? []).map((r) => {
      const zones = (r.zones ?? (r.player ? [{ player: r.player, name: r.name }] : [])).map((z) => ({ name: z.name ?? '', p: find(z.player) })).filter((z): z is MapZone => !!z.p)
        .map((z) => ({ ...z, name: z.name || String(z.p.attributes.friendly_name ?? '') }));
      const beds = (r.kids ?? []).map((n) => this.kids.find((k) => k.name === n)).filter((k): k is KidConfig => !!k).map((k) => hm(bedtimeFor(k.bedtime)));
      return { name: r.name ?? zones[0]?.name ?? '', size: r.size ?? Math.max(1, zones.length), stairs: !!r.stairs, asleep: beds.length > 0 && (now >= Math.min(...beds) || now < wake), zones };
    }).filter((r) => r.stairs || r.zones.length) })).filter((f) => f.rooms.some((r) => r.zones.length));
    const rest = list.filter((p) => !used.has(p.entity_id)).map((p) => ({ name: String(p.attributes.friendly_name ?? ''), size: 1, stairs: false, asleep: false, zones: [{ name: String(p.attributes.friendly_name ?? ''), p }] }));
    if (rest.length) floors.push({ name: floors.length ? 'Other' : '', rooms: rest });
    return floors;
  }
  private _asleep(id: string): boolean { return this._floors.some((f) => f.rooms.some((r) => r.asleep && r.zones.some((z) => z.p.entity_id === id))); }
  /** Bedrooms after bedtime need a grown-up (when a PIN is set) before music goes there. */
  private _gentle(id: string, run: () => void): void { if (this._off(this._list.find((p) => p.entity_id === id) ?? this.hass!.states[id])) { this._say(`${this._name(this._list.find((p) => p.entity_id === id))} is offline`); return; } if (this._asleep(id) && this._cleared !== id && this._cleared !== '*') this._guard(`${this._name(this.hass!.states[id])} is in a bedroom after bedtime. Play there anyway?`, () => { this._cleared = id; try { run(); } finally { this._cleared = ''; } }); else run(); }
  /** The house: slide up or down anywhere in a room for its volume. Nothing changes until the finger has gone 10 px up or down (a sideways start is not a volume change); on a phone only the bar itself slides, so the page can scroll. */
  private _volDown(e: PointerEvent, p: HassEntity): void {
    const t = e.target as HTMLElement, v0 = this._volOf(p);
    if (!e.isPrimary || t.closest('.zname, .join, .puck, .vstep') || v0 === null || this._off(p)) return;
    if (shp() === 'phone' && !t.closest('.grab')) return;
    const el = e.currentTarget as HTMLElement, id = p.entity_id, x0 = e.clientX, y0 = e.clientY, g = el.querySelector<HTMLElement>('.grab'), cs = g ? getComputedStyle(g) : null;
    // the level runs between the two end buttons: the same length the styles use (--r0 and --r1)
    const h = Math.max(40, el.getBoundingClientRect().height - (cs ? (parseFloat(cs.getPropertyValue('--r0')) || 0) + (parseFloat(cs.getPropertyValue('--r1')) || 0) : 72));
    let moved = false, dead = false, v = v0;
    const move = (m: PointerEvent): void => {
      if (dead) return;
      if (!moved) { const dx = Math.abs(m.clientX - x0), dy = Math.abs(m.clientY - y0); if (dx >= 10 && dx > dy) { dead = true; return; } if (dy < 10) return; moved = true; }
      v = Math.max(0, Math.min(100, Math.round(v0 + ((y0 - m.clientY) / h) * 100))); this._setVol(id, v, false);
    };
    const up = (ev: PointerEvent): void => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      if (ev.type === 'pointercancel' || dead) { if (moved) this._volDrop(id); return; }
      if (moved) this._setVol(id, v, true);
    };
    el.setPointerCapture(e.pointerId); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  /** Pick something up and carry it to a room: the music itself (a tap pauses or plays it), or a record from a shelf. A press that moves less than 16 px is a tap. */
  private _carryDown(e: PointerEvent, what: { lead?: HassEntity; item?: ShelfItem; flick?: (dx: number) => void }): void {
    if (!e.isPrimary) return;
    const lead = what.lead, item = what.item; let flicking = false, far = 0;
    if (lead) e.stopPropagation();
    const el = e.currentTarget as HTMLElement, panel = this.renderRoot.querySelector('.panel') as HTMLElement, x0 = e.clientX, y0 = e.clientY;
    // the crate's own box, measured now: flicking redraws the sleeves, and the one under the finger may not be the one that was pressed
    const box = what.flick ? el.closest('.cratecol')?.getBoundingClientRect() : undefined;
    const art = String(lead?.attributes.entity_picture ?? item?.img ?? '');
    const under = (x: number, y: number): string => {
      const inside = (n: Element): boolean => { const r = n.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
      if ([...this.renderRoot.querySelectorAll('[data-drop="all"]')].some(inside)) return 'all';
      const deck = item ? this.renderRoot.querySelector('[data-drop="deck"]') : null;
      if (deck && inside(deck)) return 'deck';
      return [...this.renderRoot.querySelectorAll<HTMLElement>('[data-zone]')].find(inside)?.dataset.zone ?? '';
    };
    const move = (m: PointerEvent): void => {
      const r = panel.getBoundingClientRect();
      far = Math.max(far, Math.hypot(m.clientX - x0, m.clientY - y0));
      if (!this._carry && !flicking && far < TAP_SLOP) return;
      // a sideways slide that stays in the crate flicks through it; one that leaves the crate is the record being carried to the turntable or a speaker
      const out = !!box && (m.clientX < box.left || m.clientX > box.right || m.clientY < box.top || m.clientY > box.bottom);
      if (flicking && out) { flicking = false; what.flick!(0); }
      if (!this._carry && !flicking && !out && far < 60 && what.flick && Math.abs(m.clientX - x0) > Math.abs(m.clientY - y0) * 1.4) flicking = true;
      if (flicking) { what.flick!(m.clientX - x0); return; }
      this._carry = { from: lead?.entity_id, item, art, x: ((m.clientX - r.left) / r.width) * 100, y: ((m.clientY - r.top) / r.height) * 100, over: under(m.clientX, m.clientY) };
    };
    const up = (ev: PointerEvent): void => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      let d = this._carry; this._carry = null;
      if (ev.type === 'pointercancel') { if (flicking) what.flick!(0); return; }
      if (flicking) { this._carried = Date.now(); return; }
      // small fingers wobble: a short slide that lands on nothing new was meant as a tap
      if (d && far < 40 && (!d.over || d.over === lead?.entity_id)) d = null;
      if (!d) { if (lead) { this._focus = lead.entity_id; this._svc('media_play_pause', {}, lead.entity_id); } return; } // a record that was only tapped is played by its click
      this._carried = Date.now();
      const to = d.over && d.over !== 'all' ? this._list.find((x) => x.entity_id === d!.over) ?? this.hass!.states[d.over] : undefined;
      if (lead && d.over === 'all') this._wholeHouse(() => { this._focus = lead.entity_id; this._everywhere(true, lead); });
      else if (item && d.over === 'all') this._wholeHouse(() => { const room = this._off(this._cur) ? this._list.find((x) => !this._off(x)) : this._cur; if (room) { this._shelfPlay(item, room); this._everywhere(true, room); } });
      else if (lead && to && to.entity_id !== lead.entity_id) this._gentle(to.entity_id, () => this._move(to, lead));
      else if (item && d.over === 'deck') { const room = this._cur; if (room) this._gentle(room.entity_id, () => this._shelfPlay(item, room)); }
      else if (item && to) this._gentle(to.entity_id, () => { this._focus = to.entity_id; this._shelfPlay(item, to); });
    };
    el.setPointerCapture(e.pointerId); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  /** The house in small: rooms as buttons, for choosing where to call or where a record goes. */
  private _mini(on: (id: string) => boolean, tap: (id: string) => void, call = false): TemplateResult {
    return html`<div class="map snug">${this._floors.map((f) => html`<div class="floor">
      ${f.rooms.map((r) => r.stairs ? html`<div class="mstairs" role="img" aria-label="Stairs"></div>` : html`<div class="mroom" style="--size:${r.size}">${r.zones.map((z) => {
        const id = z.p.entity_id, sel = on(id);
        return html`<button class="mz tap" data-zone=${id} ?data-offline=${this._off(z.p)} aria-pressed=${String(sel)} aria-label=${z.name} ?data-live=${!!this._leader(z.p)} ?data-hot=${this._carry?.over === id} @click=${() => tap(id)}>
          ${call && sel ? html`<span class="shout">${icon('megaphone', 22)}</span>` : nothing}<b>${r.asleep ? '☾ ' : ''}${z.name}</b></button>`;
      })}</div>`)}</div>`)}</div>`;
  }

  private _house(): TemplateResult {
    const cur = this._cur, mine = cur && this._leader(cur), grp = this._group(mine), floors = this._floors, drag = this._carry;
    const others = [...new Set(this._list.map((p) => this._leader(p)?.entity_id).filter((id): id is string => !!id && id !== mine?.entity_id))];
    const zone = (z: MapZone, asleep: boolean): TemplateResult => {
      const p = z.p, id = p.entity_id, lead = this._leader(p), playing = lead?.state === 'playing', focus = id === cur?.entity_id, inmix = grp.includes(id) && id !== mine?.entity_id;
      const vol = this._volOf(p), offline = this._off(p), can = vol !== null && !offline, linked = !!lead && this._group(lead).length > 1;
      const colour = lead && lead.entity_id !== mine?.entity_id ? `--c:var(--p-${[3, 5, 4, 2][others.indexOf(lead.entity_id) % 4]});` : '';
      const what = offline ? 'Offline' : lead ? (playing ? String(lead.attributes.media_title ?? 'Music') : 'Paused') : asleep ? 'Asleep' : 'Quiet';
      const art = lead?.attributes.entity_picture ? `--art:url(${lead.attributes.entity_picture})` : '';
      return html`<div class="mzone" data-zone=${id} ?data-offline=${offline} ?data-focus=${focus} ?data-live=${!!lead} ?data-playing=${playing} ?data-asleep=${asleep} ?data-linked=${linked} ?data-held=${this._held === id} ?data-hot=${drag?.over === id && drag.from !== id} style="${colour}--v:${vol ?? 0}" @pointerdown=${(e: PointerEvent) => this._volDown(e, p)}>
        ${lead && can ? html`<span class="pool"></span>` : nothing}
        ${lead ? html`<span class="zspk" aria-hidden="true" style="--amp:${(1.15 + (vol ?? 40) / 100 * 1.5).toFixed(2)}"><i></i><i></i>${focus ? html`<b></b>` : nothing}</span>` : nothing}
        ${drag && lead?.entity_id !== id ? html`<span class="land" aria-hidden="true"></span>` : nothing}
        <button class="zname tap" aria-pressed=${String(focus)} aria-label="${z.name}: ${what}${vol !== null ? `, volume ${vol}` : ''}${linked ? ', linked with another room' : ''}" @click=${() => { this._focus = id; }}><b>${asleep ? '☾ ' : ''}${z.name}${linked ? html`<i class="linkd" aria-hidden="true"></i>` : nothing}</b><span>${what}</span></button>
        ${id === mine?.entity_id || offline ? nothing : html`<button class="join tap" aria-pressed=${String(inmix)} aria-label="${inmix ? 'Remove' : 'Add'} ${z.name} ${inmix ? 'from' : 'to'} the music" @click=${() => this._join(id)}>${inmix ? '✓' : '＋'}</button>`}
        ${can ? html`${stepBtn(z.name, vol!, true, () => this._volStep(id, 5))}
          <span class="grab" role="slider" tabindex="0" aria-label="Volume in ${z.name}" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${vol!} aria-valuetext="${vol} per cent${lead ? '' : ', quiet'}" @keydown=${volKey(vol!, (v) => this._setVol(id, v, true))}><i></i></span>
          ${stepBtn(z.name, vol!, false, () => this._volStep(id, -5))}<b class="zvol" aria-hidden="true">${vol}</b>` : nothing}
        ${lead?.entity_id === id ? html`<span class="puck" role="button" tabindex="0" ?data-lifted=${drag?.from === id} style=${art} aria-label="${lead.attributes.media_title ?? 'Music'} in ${z.name}. Tap to ${playing ? 'pause' : 'play'}, drag to move it to another room."
          @pointerdown=${(e: PointerEvent) => this._carryDown(e, { lead })} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._focus = id; this._svc('media_play_pause', {}, id); } }}></span>` : nothing}
      </div>`;
    };
    return html`<div class="maprow"><div class="map" data-fits>
      ${floors.map((f) => html`<div class="floor">${floors.length > 1 ? html`<span class="flabel">${f.name}</span>` : nothing}
        ${f.rooms.map((r) => r.stairs ? html`<div class="mstairs" role="img" aria-label="Stairs"></div>` : html`<div class="mroom" style="--size:${r.size}" role="group" aria-label=${r.name}>${r.zones.map((z) => zone(z, r.asleep))}</div>`)}</div>`)}
    </div>${this._sideShelf()}</div>`;
  }
  /** Beside the house: a shelf of records to tap or carry to a room, and a place to drop music for the whole house. */
  private _sideShelf(): TemplateResult {
    const ma = hasMa(this.hass!), cur = this._cur, drag = this._carry;
    if (ma && !this._shelfAsked) { this._shelfAsked = true; this._loadShelves(); }
    const kid = this.kids.find((k) => k.name === this._shelf), wind = !!kid && windDown(kid.bedtime);
    const all = this._items[this._shelf] ?? [], list = wind ? all.filter((x) => x.calm) : all, MAX = 9, show = list.length > MAX ? list.slice(0, MAX - 1) : list, cols = list.length <= 4 ? 2 : 3;
    const colour = (n: string): string => slotVar(this.kids.find((k) => k.name === n)?.colour ?? 'family');
    const tap = (m: ShelfItem): void => { if (Date.now() - this._carried < 400 || !cur) return; this._gentle(cur.entity_id, () => this._shelfPlay(m, cur)); };
    return html`<div class="mshelf" role="group" aria-label="Shelf">
      ${ma ? html`<div class="shead"><b>${wind ? '🌙 ' : ''}${this._shelf === 'Family' ? 'Family shelf' : `${this._shelf}’s shelf`}</b>
          ${this._shelfNames.map((n) => html`<button class="swho tap" style="--c:${colour(n)}" aria-pressed=${String(this._shelf === n)} aria-label=${n === 'Family' ? 'Family shelf' : `${n}’s shelf`} @click=${() => { this._shelf = n; }}><i>${n === 'Family' ? icon('home', 20) : this._face(n, 36)}</i></button>`)}</div>
        ${show.length ? html`<div class="srecs" style="--cols:${cols};--rows:${Math.ceil(Math.min(list.length, MAX) / cols)}">${show.map((m, i) => html`<button class="srec tap" ?data-lifted=${drag?.item === m} aria-label="${m.name}. Tap to play in ${this._name(cur)}, or drag it onto a room."
              @pointerdown=${(e: PointerEvent) => this._carryDown(e, { item: m })} @click=${() => tap(m)}>
              <i class="puck onshelf" style="--art:${m.img ? `url(${m.img})` : `linear-gradient(135deg, var(--p-${(i % 5) + 1}), var(--p-${((i + 2) % 5) + 1}))`}"></i><span>${m.name}</span></button>`)}
            ${list.length > MAX ? html`<button class="srec more tap" aria-label="See the whole shelf" @click=${() => { this._tab = 'shelves'; }}>＋${list.length - show.length}<span>more</span></button>` : nothing}</div>`
          : html`<div class="snone">${icon('sleeve', 34)}<span>${wind ? 'Nothing calm pinned yet.' : 'Nothing pinned yet.'}<br>Search for music, then tap Pin.</span></div>`}` : html`<span style="flex:1"></span>`}
      <button class="wholeh tap" data-drop="all" aria-pressed=${String(this._allJoined)} ?data-joined=${this._allJoined} ?data-open=${!!drag} ?data-hot=${drag?.over === 'all'} @click=${() => this._spread()}>
        ${this._allJoined ? icon('check', 26) : icon('home', 26)}<span><b>Whole house</b><span>${drag ? 'Drop it here' : this._allJoined ? 'Playing in every room' : 'Drop music here'}</span></span></button>
    </div>`;
  }

  /* ---------------- search ---------------- */
  private async _search(): Promise<void> {
    const text = this._text.trim(); if (!text || this._busy) return;
    this._busy = true; this._sel = '';
    try { this._hits = await search(this.hass!, text, this._cur?.entity_id); this._keys = false; }
    catch (e: unknown) { this._hits = []; this._oops('Search didn’t work', e); }
    finally { this._busy = false; }
  }

  /* ---------------- shelves ---------------- */
  private get _shelfNames(): string[] { return ['Family', ...this.kids.map((k) => k.name)]; }
  private async _loadShelves(): Promise<void> {
    const out: Record<string, ShelfItem[]> = {};
    for (const n of this._shelfNames) out[n] = await loadShelf(this.hass!, shelfEntity(n));
    this._items = out;
  }
  /** Where a tapped record plays: the room picked on the little house, else the child's own speaker, else the room in focus. */
  private _shelfRoom(kid?: KidConfig): HassEntity | undefined { return (this._shelfTo ? this.hass!.states[this._shelfTo] : undefined) ?? (kid && kidSpeaker(this.hass!, kid, this._list)) ?? this._cur; }
  private _shelfPlay(m: ShelfItem, to?: HassEntity): void {
    const kid = this.kids.find((k) => k.name === this._shelf);
    const room = to ?? this._shelfRoom(kid);
    if (!room) { this._start(m, 'play', false, room); return; }
    this._gentle(room.entity_id, () => {
      sfx('needle'); this._start(m, 'play', false, room);
      // at wind-down a child's shelf plays quietly towards sleep (the fade can be called off from the player)
      if (kid && windDown(kid.bedtime)) { if (sleepIn(this._h, room.entity_id, this.sleepMinutes)) { this._sleepAt = { id: room.entity_id, until: Date.now() + this.sleepMinutes * 60_000 }; window.setTimeout(() => this._say(`Fading out in ${this.sleepMinutes} minutes. Sleep well.`), 3400); } }
    });
  }
  private _pin(to: string, calm: boolean): void {
    const m = this._pinTo, e = shelfEntity(to); if (!m) return;
    this._pinTo = null;
    if (!this.hass!.states[e]) { this._say(`Create the to-do list ${e} in Home Assistant first`); return; }
    pinToShelf(this._h, e, m, calm).then(() => { this._say(`Pinned to ${to === 'Family' ? 'the family shelf' : `${to}’s shelf`}`); this._loadShelves(); }).catch((err: unknown) => this._oops('Couldn’t pin that', err));
  }
  /** Take a record off a shelf. The toast offers Undo, which pins it again. */
  private _unpin(m: ShelfItem): void {
    const e = shelfEntity(this._shelf), whose = this._shelf === 'Family' ? 'the family shelf' : `${this._shelf}’s shelf`;
    this._h.callService('todo', 'remove_item', { item: m.uid }, { entity_id: e }).then(() => { this._loadShelves();
      this._say(`${m.name} removed from ${whose}`, () => { pinToShelf(this._h, e, m, m.calm).then(() => { this._say(`${m.name} is back on ${whose}`); this._loadShelves(); }).catch((err: unknown) => this._oops('Couldn’t put it back', err)); });
    }).catch((err: unknown) => this._oops('Couldn’t remove that', err));
  }

  /* ---------------- jukebox ---------------- */
  private _saveJuke(j: Partial<Juke>): void { this._juke = { ...this._juke, ...j }; lsSet('fh-juke', this._juke); }
  /** Whose pick is next: tonight's DJ first, then whoever has had the fewest turns. */
  private _nextPick(): Pick | undefined {
    const pend = this._juke.picks.filter((p) => !p.done), turns = (w: string): number => this._juke.picks.filter((p) => p.done && p.who === w).length;
    return pend.sort((a, b) => Number(b.who === this._dj) - Number(a.who === this._dj) || turns(a.who) - turns(b.who) || a.t - b.t)[0];
  }
  /** Keep exactly one pick queued ahead, so the order can stay fair as people add songs. */
  private _feed(ended = false): boolean {
    const p = this._cur, j = this._juke;
    if (!j.on || !p || !this.hass) return false;
    const idle = p.state !== 'playing' && p.state !== 'buffering', track = String(p.attributes.media_content_id ?? '');
    if (idle && this._asleep(p.entity_id)) return false; // never starts by itself in a bedroom after bedtime
    // what follows the current song is already one of tonight's picks: nothing to do yet
    const ours = !!this._q?.next && this._q.next.name === this._fedName;
    if (!(ended || idle) && (!this._q || ours)) return false;
    if (!ended && !idle && this._fedFor === track) return false; // one pick queued per song: the queue has not caught up yet
    const n = this._nextPick(); if (!n) return false;
    this._fedFor = track; this._fedName = n.name;
    n.done = true; this._saveJuke({ picks: [...j.picks] }); this._lastUri = n.uri;
    // nothing playing: start it. Otherwise it follows the current song, replacing whatever else was queued.
    play(this._h, p.entity_id, n.uri, ended || idle ? 'play' : this._q?.next ? 'replace_next' : 'add').catch((e: unknown) => this._oops(`Couldn’t queue ${n.name}`, e));
    this._qKey = '';
    return true;
  }
  private _addPick(m: MediaHit): void {
    const who = this._juke.who || this._everyone[0]?.name || 'Someone';
    this._saveJuke({ on: true, picks: [...this._juke.picks, { ...m, who, t: Date.now() }] }); sfx('slot');
    this._say(`${who} added ${m.name}`); this._adding = false; this._jpick = false; this._tab = this._prev === 'rooms' ? 'rooms' : 'juke'; this._feed();
  }

  /* ---------------- call a room ---------------- */
  /** A bedroom after its own child's bedtime: from the house map, or because it is that child's own speaker. */
  private _abed(id: string): boolean {
    if (this._asleep(id)) return true;
    const now = minsNow(), wake = hm(this.quiet.end ?? '06:30');
    return this.kids.some((k) => kidSpeaker(this.hass!, k, this._list)?.entity_id === id && (now >= hm(bedtimeFor(k.bedtime)) || now < wake));
  }
  private _calling = false;
  private async _call(checked = false): Promise<void> {
    if (this._calling) return;
    const msg = this._callMsg.trim(), to = this._callTo.length ? this._callTo : [];
    const tts = Object.keys(this.hass!.states).filter((e) => e.startsWith('tts.')).sort((a, b) => Number(b.includes('cloud')) - Number(a.includes('cloud')))[0];
    if (!to.length) { this._say('Choose a room first'); return; }
    if (!msg) { this._say('Choose or type a message first'); return; }
    if (!tts) { this._say('Home Assistant has no voice set up for speaking'); return; }
    if (Date.now() - this._lastCall < 15_000) { this._say('Give it a moment before calling again'); return; }
    // each room's own bedtime comes first; the household's quiet time covers the rest
    const quiet = isQuiet(new Date(), this.quiet.start ?? '20:00', this.quiet.end ?? '06:30'), abed = to.filter((id) => this._abed(id)), typed = !CALLS.includes(msg);
    if (!checked && this.pin && (quiet || abed.length || typed)) { this._pinAsk = { reason: abed.length ? `${this._name(this.hass!.states[abed[0]])} is asleep. Call anyway?` : quiet ? 'Quiet time. Call anyway?' : 'A typed message needs a grown-up.', run: () => void this._call(true) }; return; }
    this._lastCall = Date.now();
    const h = this._h, lang = this.callLanguage, voice = this.callVoice ? { options: { voice: this.callVoice } } : {}, vol = Math.max(0, Math.min(100, Math.round(this.callVolume)));
    // each room answers true when Home Assistant took the call; the toast says "Calling" only for rooms that did
    // the plain way: Home Assistant speaks on the speaker at whatever volume it is set to. If the voice has no such language, it speaks in its own.
    const speak = (id: string): Promise<boolean> => Promise.resolve(h.callService('tts', 'speak', { media_player_entity_id: id, message: msg, cache: true, ...(lang ? { language: lang } : {}), ...voice }, { entity_id: tts }))
      .catch(() => h.callService('tts', 'speak', { media_player_entity_id: id, message: msg, cache: true }, { entity_id: tts })).then(() => true, (e: unknown) => { console.warn('Family Hub: call failed', id, e); return false; });
    // Music Assistant speakers can be told how loud to say it: make the speech once, then announce it in each room at the call volume
    const ma = to.filter((id) => !!h.services?.music_assistant?.play_announcement && (h.entities?.[id] as { platform?: string } | undefined)?.platform === 'music_assistant');
    const jobs: Promise<boolean>[] = to.filter((id) => !ma.includes(id)).map(speak);
    if (ma.length) { const url = Promise.resolve(h.callApi<{ url?: string }>('POST', 'tts_get_url', { engine_id: tts, message: msg, cache: true, ...(lang ? { language: lang } : {}), ...voice })).then((r) => r?.url ?? '', () => '');
      for (const id of ma) jobs.push(url.then((u) => u ? Promise.resolve(h.callService('music_assistant', 'play_announcement', { url: u, announce_volume: vol }, { entity_id: id })).then(() => true, () => speak(id)) : speak(id))); }
    this._calling = true;
    const done = await Promise.all(jobs), okIds = to.filter((id) => done[[...to.filter((x) => !ma.includes(x)), ...ma].indexOf(id)]);
    this._calling = false;
    if (!this.isConnected) return;
    const nm = (ids: string[]): string => ids.length === 1 ? this._name(h.states[ids[0]]) : `${ids.length} rooms`;
    if (okIds.length === to.length) this._say(`Calling ${nm(to)}`);
    else { this._lastCall = 0; this._say(okIds.length ? `Calling ${nm(okIds)}. ${nm(to.filter((id) => !okIds.includes(id)))} didn’t answer` : `The call didn’t go through. Try again in a moment.`); }
  }

  /* ---------------- render ---------------- */
  render(): TemplateResult | typeof nothing {
    if (!this.hass) return nothing;
    const [msg, msgOut] = linger(this, 'msg', this._msg ? { m: this._msg, undo: !!this._undo } : null);
    const p = this._cur, ma = hasMa(this.hass);
    const tabs: [Tab, string, string][] = [['rooms', 'Rooms', 'home'], ...(ma ? [['shelves', 'Shelves', 'sleeve'], ['juke', 'Jukebox', 'jukebox']] as [Tab, string, string][] : []), ['radio', 'Radio', 'radio'], ['call', 'Call a room', 'megaphone']];
    const open = (id: Tab): void => { if (id === 'search' && this._tab !== 'search') { this._prev = this._tab; this._keys = true; } this._tab = id; this._adding = false; if (id === 'radio') this._loadRadio(); if (id === 'shelves') this._loadShelves(); };
    const searching = this._tab === 'search', c = this._carry, full = this._full, one = this._one && !searching;
    // the hint shows by itself once for each view, the first time it is opened after the page loads
    if (this._tab === 'rooms' && !this._viewAsk && !HINTED.has(this._mode)) { HINTED.add(this._mode); window.setTimeout(() => this._showCoach(), 0); }
    const tabrow = html`<div class="tabs ${full ? 'inline' : ''}" role="tablist">${tabs.map(([id, l, ic]) => html`<button class="tap" role="tab" aria-label=${l} aria-selected=${String(this._tab === id)} @click=${() => open(id)}>${icon(ic, 26)}<span>${l}</span></button>`)}</div>`;
    return html`${p ? this._hero(p) : html`<section class="glass stage"><div class="deck">No speakers found</div></section>`}
      <section class="glass panel" aria-label="Music" ?data-one=${one} @pointerdown=${(e: PointerEvent) => { if (this._coach && !(e.target as HTMLElement).closest('.helpb')) { clearTimeout(this._coachT); this._coach = false; } }}>
        <div class="mhead" ?data-one=${one} ?data-hinting=${one && this._coach}><h1 class="t-title">Music</h1>${one ? this._tools() : nothing}
          ${searching ? this._searchBar() : ma ? html`<button class="finder tap" aria-label="Search for music" @click=${() => open('search')}>${icon('search', 24)}<span>${one ? 'Search…' : 'Search songs, stories…'}</span></button>` : html`<span style="flex:1"></span>`}${one ? this._oneNow() : nothing}${full && !searching ? tabrow : nothing}</div>
        ${searching || full ? nothing : tabrow}
        ${keyed(this._tab, html`<div class="body">${this._tab === 'rooms' ? this._rooms() : this._tab === 'search' ? this._searchTab() : this._tab === 'shelves' ? this._shelves() : this._tab === 'juke' ? this._jukeTab() : this._tab === 'radio' ? this._radio() : this._callTab()}</div>`)}
        ${c ? html`<span class="puck fly" style="left:${c.x}%;top:${c.y}%;${c.art ? `--art:url(${c.art})` : ''}"></span>` : nothing}
      </section>
      ${this._pinTo ? this._pinSheet() : nothing}
      ${this._pinAsk ? html`<fh-pin .pin=${String(this.pin)} reason=${this._pinAsk.reason} @ok=${() => { const r = this._pinAsk!.run; this._pinAsk = null; r(); }} @cancel=${() => { this._pinAsk = null; }}></fh-pin>` : nothing}
      <div class="toast" role="status" ?data-closing=${msgOut}>${msg?.m || nothing}${msg?.undo ? html` <button class="pill tap" style="height:44px;margin-left:12px;background:#fff;color:#111" @click=${() => { const u = this._undo; this._msg = ''; this._undo = null; sfx('undo'); u?.(); }}>${this._undoLabel}</button>` : nothing}</div>`;
  }

  private _hero(p: HassEntity): TemplateResult {
    const a = p.attributes, playing = p.state === 'playing', art = a.entity_picture ? `url(${a.entity_picture})` : '';
    const vol = this._volOf(p), mix = this._mix(p).length, q = this._q;
    const dur = Number(a.media_duration) || 0, at = a.media_position_updated_at ? new Date(a.media_position_updated_at).getTime() : 0;
    const pos = dur ? Math.min(dur, (Number(a.media_position) || 0) + (playing && at ? (this._now - at) / 1000 : 0)) : 0, frac = dur ? pos / dur : 0;
    const deck = lookArt(getLook(), 'player', { img: a.entity_picture, frac, playing });
    return html`<section class="glass stage" style=${art ? `--art:${art}` : ''} aria-label="Now playing">
      <div class="bg"></div>
      <div style="display:flex;align-items:center;gap:8px"><span class="live" style="${playing ? '' : 'animation:none;background:rgba(255,255,255,.5)'}"></span>
        <span style="font-size:13px;font-weight:var(--w-bold, 700);text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${playing ? 'Playing in' : 'Ready in'} ${this._name(p)}${mix ? ` + ${mix} more` : ''}</span></div>
      <div class="deck">${deck === nothing ? html`<div class="cover ${playing ? '' : 'paused'}"></div>` : deck}</div>
      <div class="titles" style="display:flex;flex-direction:column;gap:2px;min-width:0">
        <span class="display" style="font-size:24px;font-weight:var(--w-heavy, 800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.media_title ?? (p.state === 'off' ? 'Off' : 'Nothing playing')}</span>
        <span style="font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.media_artist ?? a.media_album_name ?? 'Search, pick from a shelf or tap a station'}</span>
      </div>
      ${dur ? html`<div class="bar" role="progressbar" aria-label="Track progress" aria-valuenow=${Math.round(frac * 100)} aria-valuemin="0" aria-valuemax="100"><i style="width:${frac * 100}%"></i></div>` : nothing}
      <div class="ctl">
        <button class="tap" aria-label="Shuffle" aria-pressed=${String(!!a.shuffle)} @click=${() => this._svc('shuffle_set', { shuffle: !a.shuffle })}>${icon('shuffle', 22)}</button>
        <button class="tap" aria-label="Previous" @click=${() => this._svc('media_previous_track')}>${solid('prev', 28)}</button>
        <button class="tap go" aria-label=${playing ? 'Pause' : 'Play'} @click=${() => this._svc('media_play_pause')}>${solid(playing ? 'pause' : 'play', 30)}</button>
        <button class="tap" aria-label="Next" @click=${() => this._svc('media_next_track')}>${solid('next', 28)}</button>
        <button class="tap" aria-label="Save this song to favourites" @click=${() => this._heart()}>♥</button>
      </div>
      <div class="upnext">${q?.next ? html`<span>Up next</span><b style="overflow:hidden;text-overflow:ellipsis">${q.next.name}</b>${q.items > 2 ? html`<span>+${q.items - 2} more</span>` : nothing}` : this._juke.on ? html`<span>🎶 Jukebox is on · ${this._juke.picks.filter((x) => !x.done).length} waiting</span>` : nothing}</div>
      <div class="mini">
        <button class="tog tap" aria-pressed=${String(this._keep)} title="When the music runs out, carry on with similar songs" @click=${() => { this._keep = !this._keep; lsSet('fh-keep', this._keep); this._say(this._keep ? 'When the music runs out, I’ll keep it going' : 'The music will stop at the end'); }}>∞ Keep going</button>
        ${this._off(p) ? nothing : html`<button class="tog tap" aria-pressed=${String(this._sleepLeft(p) !== null)} @click=${() => this._sleep()}>🌙 ${this._sleepLeft(p) !== null ? `${this._name(p)}: ${this._sleepLeft(p)} min left · Cancel` : `Sleep ${this.sleepMinutes}`}</button>`}
      </div>
      ${vol !== null && !this._off(p) ? volCtl({ name: this._name(p), v: vol, live: !!this._leader(p), held: this._held === p.entity_id, set: (v, commit) => this._setVol(p.entity_id, v, commit), drop: () => this._volDrop(p.entity_id) }) : nothing}
    </section>`;
  }

  /** A wide screen showing one of the full room views: the title row carries everything, so the view gets the height. */
  private get _one(): boolean { return this._full && shp() !== 'phone' && shp() !== 'tall'; }
  private _coach = false; private _coachT = 0;
  /** The view's own tools, the same on every layout: Switcheroo, Whole house, "Just this room", the offline note, "?" and the hint beside it. */
  private _tools(): TemplateResult {
    const cur = this._cur, mine = cur && this._leader(cur), mode = this._mode, off = this._offline;
    return html`
        <button class="viewbtn tap" aria-haspopup="dialog" aria-label="Change the view" @click=${() => { sfx('tap'); this._viewAsk = true; }}><i class="pinw" aria-hidden="true"></i>Switcheroo</button>
        ${mode === 'house' ? nothing : html`<button class="pill tap wholeb" data-drop="all" aria-pressed=${String(this._allJoined)} ?data-hot=${this._carry?.over === 'all'} @click=${() => this._spread()}>${this._allJoined ? icon('check', 20) : icon('home', 20)}Whole house</button>`}
        ${mine && this._mix(mine).length ? html`<button class="pill tap" style="font-size:15px" @click=${() => this._everywhere(false, mine)}>Just ${this._name(mine)}</button>` : nothing}
        ${off.length ? html`<button class="offnote tap" data-offnote @click=${() => this._say(`Offline: ${off.map((p) => this._name(p)).join(', ')}`)}>${icon('plug', 18)}${off.length === this._list.length ? 'Every speaker is offline' : `${off.length} ${off.length === 1 ? 'speaker' : 'speakers'} offline`}</button>` : nothing}
        <button class="round tap helpb" aria-label="How this view works" aria-expanded=${String(this._coach)} @click=${() => this._showCoach(true)}>?</button>
        <span class="hint" role="note" ?data-on=${this._coach}>${viewHint(mode, getLook(), this.theme)}</span>`;
  }
  /** The small player: what is playing where, and three keys of one shape. Shown with the House, which has no player of its own in the picture. */
  private _nowbar(cur: HassEntity): TemplateResult {
    return html`<div class="nowbar"><button class="nthumb tap" aria-pressed=${String(this._peek)} aria-label=${this._peek ? 'Hide the player' : 'Show the full player'} style=${cur.attributes.entity_picture ? `--art:url(${cur.attributes.entity_picture})` : ''} @click=${() => { this._peek = !this._peek; }}></button>
          <span class="ntx"><b>${cur.attributes.media_title ?? 'Nothing playing'}</b><span>${this._name(cur)}</span></span>
          ${miniKeys(cur.state === 'playing', () => this._svc('media_previous_track'), () => this._svc('media_play_pause'), () => this._svc('media_next_track'))}</div>`;
  }
  /** What stands in for the player beside a full-page view: the small player with the House; with the others (which show what is playing themselves) only a way to the full player. */
  private _oneNow(): TemplateResult | typeof nothing {
    const cur = this._cur;
    if (this._mode !== 'house') return html`<button class="round tap peekb" aria-label="Show the full player" @click=${() => { this._peek = true; }}>${icon('music', 22)}</button>`;
    return cur ? this._nowbar(cur) : nothing;
  }
  private _showCoach(toggle = false): void { clearTimeout(this._coachT); this._coach = toggle ? !this._coach : true; if (this._coach) this._coachT = window.setTimeout(() => { this._coach = false; }, 4000); }

  private _rooms(): TemplateResult {
    const cur = this._cur, mine = cur && this._leader(cur), grp = this._group(mine), ma = hasMa(this.hass!);
    const sonos = Object.keys(this.hass!.states).find((id) => id.startsWith('media_player.') && (this.hass!.entities?.[id] as { platform?: string } | undefined)?.platform === 'sonos');
    const tv = sonos && this.hass!.states[sonos].attributes.source === 'TV' ? sonos : '';
    const sw = (re: RegExp, label: string): TemplateResult | typeof nothing => {
      const id = tv && sibling(this.hass!, tv, re); if (!id) return nothing;
      const on = this.hass!.states[id].state === 'on';
      return html`<button class="pill tap" style="font-size:15px" aria-pressed=${String(on)} @click=${() => { this._h.callService('switch', on ? 'turn_off' : 'turn_on', {}, { entity_id: id }).catch((e: unknown) => this._oops('The TV sound didn’t change', e)); }}>${label} ${on ? 'on' : 'off'}</button>`;
    };
    const mode = this._mode;
    return html`${this._viewAsk ? viewPicker(mode, (v) => { const was = this._view; this._view = v; lsSet('fh-music-view', v); this._viewAsk = false; if (v !== was) { clearTimeout(this._coachT); this._coach = false; this.updateComplete.then(() => { const b = this.renderRoot.querySelector('.viewbtn'); if (b) spark('party', b, { burst: true }); sfx('done');
      // the stage cross-fades to the new view (opacity only, --m-3)
      this.renderRoot.querySelector('.panel > .body')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion(this, '--m-3').ms || 240, easing: 'ease-out' }); }); } }, () => { this._viewAsk = false; }) : nothing}${this._one ? nothing : html`<div class="acts">
        ${this._tools()}
        ${mode === 'house' && cur ? this._nowbar(cur) : mode !== 'list' && cur ? this._oneNow() : nothing}
        ${tv ? html`<span class="soft">TV sound</span>${sw(/^switch\..*night_sound$/, 'Night')}${sw(/^switch\..*speech_enhancement$/, 'Clear speech')}` : nothing}
      </div>`}
      ${mode === 'house' ? this._house() : mode === 'dial' ? dialView(this._vctx()) : mode === 'desk' ? deskView(this._vctx()) : mode === 'cables' ? crateView(this._vctx()) : mode === 'scene' ? sceneView(this._vctx()) : html`<div class="grid scrolly" data-fits @scroll=${scrollCue}>${this._list.map((p) => {
      const a = p.attributes, id = p.entity_id, lead = this._leader(p), playing = p.state === 'playing', focus = id === cur?.entity_id, inmix = grp.includes(id) && id !== mine?.entity_id;
      const vol = this._volOf(p), name = this._name(p), offline = this._off(p), linked = !!lead && this._group(lead).length > 1;
      const what = offline ? 'Offline' : inmix ? `With ${this._name(mine)}` : lead ? (lead.state === 'playing' ? String(lead.attributes.media_title ?? 'Playing') : 'Paused') : this._asleep(id) ? 'Asleep' : 'Quiet';
      return html`<div class="spk ${focus ? 'focus' : inmix ? 'inmix' : ''}" data-zone=${id} ?data-offline=${offline}>
        <div class="top"><button class="rsel tap" aria-pressed=${String(focus)} @click=${() => { this._focus = id; }}>
          <span class="thumb ${playing ? 'eq' : ''}" style=${a.entity_picture ? `--art:url(${a.entity_picture})` : ''}>${playing ? html`<i></i><i></i><i></i>` : icon('music', 20)}</span>
          <span class="rtx"><span class="sn2">${name}${linked ? html`<i class="linkd" role="img" aria-label="linked with another room"></i>` : nothing}</span><span class="rst">${what}</span></span></button>
          ${id === mine?.entity_id || offline ? nothing : html`<button class="join tap" aria-pressed=${String(inmix)} aria-label="${inmix ? 'Remove' : 'Add'} ${name} ${inmix ? 'from' : 'to'} the music" @click=${() => this._join(id)}>${inmix ? '✓' : '＋'}</button>`}</div>
        ${vol !== null && !offline ? volCtl({ name, v: vol, live: !!lead, held: this._held === id, set: (v, commit) => this._setVol(id, v, commit), drop: () => this._volDrop(id) }) : nothing}
        ${!focus && !inmix && !offline && ma && cur?.state === 'playing' ? html`<button class="pill tap moveb" @click=${() => this._move(p)}>Move the music here</button>` : nothing}
      </div>`;
    })}</div>`}`;
  }

  private _searchBar(): TemplateResult {
    const hits = this._hits;
    return html`<div class="sbar"><input class="field" inputmode=${shp() === 'phone' ? 'text' : 'none'} aria-label="Search for music" placeholder="A song, an album, a story…" .value=${this._text}
          @focus=${() => { this._keys = true; }} @input=${(e: Event) => { this._text = (e.target as HTMLInputElement).value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._search(); }}>
        <button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" ?disabled=${this._busy} @click=${() => this._search()}>${this._busy ? 'Looking…' : 'Search'}</button>
        ${hits ? html`<button class="pill tap" style="height:52px;padding:0 16px;font-size:15px;flex-shrink:0" aria-label=${this._keys ? 'Hide the keyboard' : 'Show the keyboard'} aria-pressed=${String(this._keys)} @click=${() => { this._keys = !this._keys; }}>Keyboard</button>` : nothing}
        <button class="round tap" style="width:52px;height:52px" aria-label="Close search" @click=${() => { this._tab = this._adding ? 'juke' : this._prev; this._adding = false; }}>${icon('close', 22)}</button></div>`;
  }

  private _searchTab(): TemplateResult {
    const hits = this._hits, sel = hits?.find((h) => h.uri === this._sel);
    return html`${this._adding ? html`<div class="banner">🎶 Adding to the jukebox for ${this._juke.who || 'everyone'}<span style="flex:1"></span><button class="pill tap" style="height:44px;font-size:15px" @click=${() => { this._adding = false; this._tab = 'juke'; }}>Back</button></div>` : nothing}
      ${this._keys && !hits ? html`<div class="empty" style="flex:1"><span style="color:var(--ink2)">${icon('search', 44)}</span><span>Songs, albums, playlists, stories and radio, from every service at once.</span></div>` : nothing}
      ${this._keys ? html`<div style="margin:auto 0">${keyboard((k) => { [this._text, this._caps] = typeKey(this._text, k, this._caps); }, this._caps, () => { this._caps = !this._caps; }, true)}</div>` : nothing}
      ${hits && !this._keys ? (hits.length ? html`<div class="hits scrolly" data-fits @scroll=${scrollCue}>${hits.map((h) => html`<button class="hit tap" aria-pressed=${String(h.uri === this._sel)} @click=${() => { this._sel = h.uri; }}>
          <span class="art" style=${h.img ? `--art:url(${h.img})` : ''}>${h.img ? '' : icon('music', 18)}</span>
          <span class="tx"><b>${h.name}</b><span>${h.sub ?? ''}</span></span><span class="kind">${TYPE_LABEL[h.type] ?? h.type}</span></button>`)}</div>
        <div class="acts">${sel ? (this._adding ? html`<button class="pill tap primary" style="height:48px;padding:0 20px" @click=${() => this._addPick(sel)}>＋ Add to the jukebox</button>`
          : html`<button class="pill tap primary" style="height:48px;padding:0 20px" @click=${() => this._start(sel)}>▶ Play in ${this._name(this._cur)}</button>
            <button class="pill tap" style="height:48px" @click=${() => this._start(sel, 'next')}>Play next</button>
            <button class="pill tap" style="height:48px" @click=${() => this._start(sel, 'add')}>＋ Queue</button>
            <button class="pill tap" style="height:48px" @click=${() => this._start(sel, 'play', true)}>∞ Radio from this</button>
            <button class="pill tap" style="height:48px" @click=${() => this._guard('Pin to a shelf?', () => { this._pinTo = sel; })}>📌 Pin</button>`) : html`<span class="soft">Tap a result to play it, queue it or pin it to a shelf.</span>`}</div>`
        : html`<div class="empty"><span>Nothing found for “${this._text}”. Try fewer words.</span></div>`) : nothing}`;
  }

  private _pinSheet(): TemplateResult {
    const m = this._pinTo!;
    return html`<div class="scrim" style="border-radius:28px" @click=${(e: Event) => { if (e.target === e.currentTarget) this._pinTo = null; }}>
      <section class="glass sheet" role="dialog" aria-modal="true" aria-label="Pin to a shelf" style="width:min(560px,92%);gap:12px">
        <h2 class="t-head">Pin “${m.name}”</h2><span class="soft">Whose shelf? Calm picks are the only ones offered at wind-down.</span>
        ${this._shelfNames.map((n) => html`<div class="setrow"><b style="font-size:17px">${n === 'Family' ? 'Family shelf' : `${n}’s shelf`}</b><span style="display:flex;gap:8px">
          <button class="pill tap primary" @click=${() => this._pin(n, false)}>Pin</button><button class="pill tap" @click=${() => this._pin(n, true)}>🌙 Pin as calm</button></span></div>`)}
        <span class="soft" style="margin-top:6px">Or put it on a moment pad on the Desk. It plays where that pad plays.</span>
        <div class="acts">${this._pads.map((p) => { const on = this._padSet[p.name]; return html`<button class="pill tap" style="height:44px" aria-label="Put it on the ${p.name} pad${on ? `, which now plays ${on.title}` : ''}" @click=${() => { this._padPut(p.name, m); this._pinTo = null; }}>${p.name}</button>
          ${on ? html`<button class="pill tap" style="height:44px" aria-label="Put the ${p.name} pad back to its own music instead of ${on.title}" @click=${() => this._padPut(p.name, null)}>↺</button>` : nothing}`; })}</div>
        <button class="pill tap" style="align-self:flex-end" @click=${() => { this._pinTo = null; }}>Cancel</button></section></div>`;
  }

  private _shelves(): TemplateResult {
    const kid = this.kids.find((k) => k.name === this._shelf), wind = !!kid && windDown(kid.bedtime);
    const all = this._items[this._shelf] ?? [], list = wind ? all.filter((x) => x.calm) : all;
    const room = this._shelfRoom(kid);
    const colour = (n: string): string => slotVar(this.kids.find((k) => k.name === n)?.colour ?? 'family');
    // the youngest reaches the lower half of a wall panel only: on his shelf the records sit low and the row of faces goes under them
    return html`<div class="shelfrow"><div class="crate ${kid?.mode === 'picture' ? 'low' : ''}">
      <div class="chiprow dividers">${this._shelfNames.map((n) => html`<button class="pchip tap" style="--c:${colour(n)}" aria-pressed=${String(this._shelf === n)} @click=${() => { this._shelf = n; this._edit = false; this._shelfTo = ''; }}>
        <span class="avatar" aria-hidden="true">${n === 'Family' ? icon('home', 18) : this._face(n, 32)}</span>${n}</button>`)}
</div>
      ${wind ? html`<div class="banner">🌙 Wind-down: calm picks only, fading out after ${this.sleepMinutes} minutes.</div>` : nothing}
      ${list.length ? html`<div class="covers scrolly" data-fits @scroll=${scrollCue}>${list.map((m) => html`<button class="st tap" ?data-lifted=${this._carry?.item === m} @pointerdown=${(e: PointerEvent) => { if (!this._edit) this._carryDown(e, { item: m }); }} @click=${() => { if (!this._edit && Date.now() - this._carried > 400) this._shelfPlay(m); }}>
          <i class="disc"></i><span class="img" style=${m.img ? `--art:url(${m.img})` : ''}>${m.img ? '' : m.name[0]}</span><span class="lbl">${m.calm ? '🌙 ' : ''}${m.name}</span>
          ${this._edit ? html`<span class="x tap" role="button" tabindex="0" aria-label="Remove ${m.name}" @click=${(e: Event) => { e.stopPropagation(); this._unpin(m); }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); this._unpin(m); } }}>✕</span>` : nothing}</button>`)}</div>`
        : html`<div class="empty"><span style="font-size:40px">📚</span><h2 class="t-sub">${wind ? 'Nothing calm pinned yet' : 'Nothing pinned yet'}</h2>
          <span>${this.hass!.states[shelfEntity(this._shelf)] ? 'Search for an album, a playlist or a story, then tap Pin.' : `This shelf needs the to-do list ${shelfEntity(this._shelf)} in Home Assistant.`}</span></div>`}</div>
      <div class="dropside"><span class="soft" style="font-size:14px">Drag a record to a room, or tap it to play in <b>${this._name(room)}</b>.</span>
        ${this._mini((id) => id === room?.entity_id, (id) => { this._shelfTo = id; })}
        <span style="flex:1"></span><span style="align-self:flex-end">
        ${all.length ? html`<button class="pill tap" style="font-size:15px" @click=${() => { if (this._edit) this._edit = false; else this._guard('Change this shelf?', () => { this._edit = true; }); }}>${this._edit ? 'Done' : 'Edit'}</button>` : nothing}</span></div></div>`;
  }

  private _jukeTab(): TemplateResult {
    const j = this._juke, col = (n: string): string => slotVar(this._everyone.find((p) => p.name === n)?.colour ?? 'family');
    const next = this._nextPick(), turns = (w: string): number => j.picks.filter((p) => p.done && p.who === w).length;
    if (!this._shelfAsked) { this._shelfAsked = true; this._loadShelves(); }
    const asked = new Set(j.picks.filter((p) => !p.done).map((p) => p.who)), chooser = [...this._everyone].sort((a, b) => Number(asked.has(a.name)) - Number(asked.has(b.name)) || turns(a.name) - turns(b.name))[0]?.name ?? '';
    const search = (): void => { this._jpick = false; this._adding = true; this._prev = this._prev === 'rooms' ? 'rooms' : 'juke'; this._tab = 'search'; this._keys = true; this._hits = null; this._text = ''; this._caps = true; };
    if (this._jpick && j.who) {
      // a turn starts with pictures: that person's own shelf, then the family's. No reading, no typing.
      const seen = new Set<string>(), list = [...(this._items[j.who] ?? []), ...(this._items.Family ?? [])].filter((m) => !seen.has(m.uri) && !!seen.add(m.uri));
      const low = this.kids.find((k) => k.name === j.who)?.mode === 'picture';
      const banner = html`<div class="banner">🎶 ${j.who}: tap a picture to add it<span style="flex:1"></span><button class="pill tap" style="height:44px;font-size:15px" @click=${search}>${icon('search', 18)} Search instead</button><button class="pill tap" style="height:44px;font-size:15px" @click=${() => { this._jpick = false; if (this._prev === 'rooms') this._tab = 'rooms'; }}>Back</button></div>`;
      // on the youngest's turn the pictures sit low, with the words and the way back under them
      return html`${low ? nothing : banner}
        ${list.length ? html`<div class="covers scrolly jcovers ${low ? 'low' : ''}" data-fits @scroll=${scrollCue}>${list.map((m) => html`<button class="st tap" aria-label="Add ${m.name}" @click=${() => this._addPick(m)}>
          <i class="disc"></i><span class="img" style=${m.img ? `--art:url(${m.img})` : ''}>${m.img ? '' : m.name[0]}</span><span class="lbl">${m.name}</span></button>`)}</div>`
        : html`<div class="empty"><span style="font-size:40px">📚</span><h2 class="t-sub">Nothing pinned to choose from yet</h2><span>A grown-up can pin music from Search. Until then, use Search instead.</span></div>`}${low ? banner : nothing}`;
    }
    const waiting = j.picks.filter((p) => !p.done).sort((a, b) => Number(b === next) - Number(a === next) || a.t - b.t), played = j.picks.filter((p) => p.done).sort((a, b) => b.t - a.t);
    // each state has its own picture as well as its word: a play mark for the next one, an hourglass for waiting, a tick for played
    const when = (p: Pick): TemplateResult => p.done ? (this._q?.next?.name === p.name ? html`<i aria-hidden="true">${solid('next', 14)}</i>Up next` : html`<i aria-hidden="true">✓</i>Played`) : p === next ? html`<i aria-hidden="true">${solid('play', 14)}</i>Next` : html`<i aria-hidden="true">⏳</i>Waiting`;
    const card = (p: Pick): TemplateResult => html`<div class="pickrow ${p.done ? 'played' : ''}" ?data-next=${p === next}>
      <span class="pcover"><i class="disc"></i><span class="art" style=${p.img ? `--art:url(${p.img})` : ''}>${p.img ? '' : icon('music', 26)}</span>
        <span class="init avatar" style="--c:${col(p.who)}" role="img" aria-label=${p.who}>${this._face(p.who, 30)}</span></span>
      <span class="nm">${p.name}${p.sub ? html` <span class="muted" style="font-weight:var(--w-semi, 600)">· ${p.sub}</span>` : nothing}</span>
      <span class="when">${when(p)}</span></div>`;
    // whose song is waiting: that person's coin wears its cover (never a count of how many each has had)
    const theirs = (n: string): Pick | undefined => waiting.find((p) => p.who === n);
    const jlow = this.kids.some((k) => k.mode === 'picture') ? 'jlow' : '';
    return html`${this._dj ? html`<div class="banner">🎧 ${this._dj} is the DJ tonight: ${this._dj}’s picks play first.</div>` : nothing}
      <div class="coins ${jlow}" role="group" aria-label="Who’s choosing?"><span class="soft" style="font-size:14px">Who’s choosing?</span>${this._everyone.map((p) => { const w = theirs(p.name); return html`<button class="coin tap" style="--c:${slotVar(p.colour)}" aria-pressed=${String(j.who === p.name)} ?data-next=${p.name === chooser} aria-label="${p.name}${p.name === chooser ? ', chooses next' : ''}${w ? `, ${w.name} is waiting` : ''}" @click=${() => { this._saveJuke({ who: p.name }); this._prev = 'juke'; this._jpick = true; }}>
        <span class="face"><span class="fpic">${this._face(p.name, 50)}</span>${w ? html`<i class="has" style=${w.img ? `--art:url(${w.img})` : ''}>${w.img ? nothing : solid('play', 12)}</i>` : nothing}</span><span class="cname">${p.name}</span><span class="cnext">${p.name === chooser ? 'Next' : ''}</span></button>`; })}</div>
      <div class="acts ${jlow}"><button class="pill tap primary" style="height:48px;padding:0 20px;font-size:15px" ?disabled=${!j.who} @click=${() => { this._prev = 'juke'; this._jpick = true; }}>＋ ${j.who ? `${j.who} adds a song` : 'Pick who’s choosing'}</button>
        <button class="jsw tap" role="switch" aria-checked=${String(j.on)} style="font-size:15px" @click=${() => { this._saveJuke({ on: !j.on }); if (!j.on) this._feed(); }}><i></i>${j.on ? 'Jukebox is on' : 'Jukebox is off'}</button>
        <span class="soft" style="flex:1;font-size:14px">Everyone gets a turn.</span>
        ${j.picks.length ? html`<button class="pill tap" style="font-size:15px" @click=${() => { const was = j.picks; this._saveJuke({ picks: [] }); this._say('Jukebox cleared', () => this._saveJuke({ picks: was })); }}>Clear</button>` : nothing}</div>
      ${j.picks.length ? html`<div class="picks scrolly" data-fits @scroll=${scrollCue}>${waiting.map(card)}${played.map(card)}</div>`
        : html`<div class="empty"><span style="color:var(--ink2)">${icon('jukebox', 48)}</span><h2 class="t-sub">The jukebox is empty</h2><span>Pick who’s choosing, then add a song.</span></div>`}`;
  }

  private _radio(): TemplateResult {
    const cur = this._cur, playingName = cur && cur.state === 'playing' ? LAST[cur.entity_id] : '';
    return html`<span class="muted" style="font-size:14px">Tap a station to play it in <b>${this._name(cur)}</b>. Pick a different room in the Rooms tab.</span>
      <div class="grid presets" style="grid-template-columns:repeat(auto-fill,minmax(132px,1fr));padding:6px;margin:-6px">${this._stations.map((s) => {
        const th = this._thumbs[s.name], on = playingName === s.name;
        return html`<button class="st tap ${on ? 'on' : ''}" @click=${() => this._play(s)}>
          <span class="img" style=${th ? `--art:url(${th})` : `background:linear-gradient(135deg, color-mix(in srgb, var(--p-${(s.name.length % 5) + 1}) 72%, #000), color-mix(in srgb, var(--p-${(s.name.length % 5) + 1}) 46%, #000));color:#fff`}>${th ? '' : s.name.split(' ').map((w) => w[0]).join('').slice(0, 3)}</span>${s.name}</button>`;
      })}</div>`;
  }

  /** Call a room. The rooms and the ready messages are always in reach: as a little house and speech bubbles, or, while the keyboard is up, as a row of room chips and a row of pictures. */
  private _callTab(): TemplateResult {
    const all = this._homeList.filter((p) => !this._off(p)).map((p) => p.entity_id), every = all.length > 0 && all.every((id) => this._callTo.includes(id));
    const flip = (id: string): void => { this._callTo = this._callTo.includes(id) ? this._callTo.filter((x) => x !== id) : [...this._callTo, id]; };
    // a ready message chosen before any room: say what is missing straight away, not after "Say it"
    const pick = (m: string): void => { this._callMsg = m; if (!this._callTo.length) this._say('Choose a room first'); };
    const everyone = html`<button class="pill tap rchip" aria-pressed=${String(every)} @click=${() => { this._callTo = every ? [] : all; }}>Everyone</button>`;
    return html`${this._ckeys ? html`<div class="rchips" role="group" aria-label="Rooms to call">${this._list.map((p) => html`<button class="pill tap rchip" ?disabled=${this._off(p)} aria-pressed=${String(this._callTo.includes(p.entity_id))} @click=${() => flip(p.entity_id)}>${this._abed(p.entity_id) ? '☾ ' : ''}${this._name(p)}</button>`)}${everyone}</div>` : html`<div class="callrow">
        <div class="callside"><span class="soft" style="font-size:14px">Tap the rooms to call</span>
          ${this._mini((id) => this._callTo.includes(id), flip, true)}
          <span style="align-self:flex-start">${everyone}</span></div>
        <div class="bubbles">${CALLS.map((m, i) => html`<button class="bubble tap" aria-pressed=${String(this._callMsg === m)} @click=${() => pick(m)}><span class="bpic" aria-hidden="true">${CALL_PIC[i]}</span>${m}</button>`)}</div></div>`}
      <div class="sayrow">${this._ckeys ? html`<span class="qpics" role="group" aria-label="Ready messages">${CALLS.map((m, i) => html`<button class="qpic tap" aria-pressed=${String(this._callMsg === m)} aria-label=${m} @click=${() => pick(m)}>${CALL_PIC[i]}</button>`)}</span>` : nothing}
        <input class="field" inputmode=${shp() === 'phone' ? 'text' : 'none'} aria-label="Message to say" placeholder="Or type what to say…" .value=${this._callMsg} @focus=${() => { this._ckeys = true; }} @input=${(e: Event) => { this._callMsg = (e.target as HTMLInputElement).value; }}>
        <button class="pill tap primary sayit" ?disabled=${this._calling} ?data-busy=${this._calling} aria-busy=${this._calling ? 'true' : nothing} @click=${() => void this._call()}>${icon('megaphone', 22)} Say it</button>
        ${this._ckeys ? html`<button class="round tap" style="width:52px;height:52px;flex-shrink:0" aria-label="Hide the keyboard" @click=${() => { this._ckeys = false; }}>${icon('close', 22)}</button>` : nothing}</div>
      ${this._ckeys ? html`<div style="margin:auto 0 0">${keyboard((k) => { [this._callMsg, this._caps] = typeKey(this._callMsg, k, this._caps); }, this._caps, () => { this._caps = !this._caps; }, true)}</div>`
        : html`<span class="soft" style="font-size:14px">It is spoken over the music in that room, then the music carries on.</span>`}`;
  }
}
if (!customElements.get('fh-music')) customElements.define('fh-music', FhMusic);
