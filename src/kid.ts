import { LitElement, html, svg, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { styles } from './styles';
import { LookController, getLook, lookArt } from './looks';
import { icon } from './icons';
import {
  avatarCss, decodeLook, levelInfo, nextUnlock, prevThreshold, renderAvatar, unlocksBetween, growBetween, applyItem, type Look, type Unlock
} from './avatar';
import { confetti, fxCss } from './fx';
import { addDays, fmtDow, fmtTime, sameDay, startOfDay } from './dates';
import { kidEntities, num, slotVar, type Hass, type KidConfig, type RewardConfig } from './types';
import { spark } from './sparks';
import { bedtimeFor, hm, changed, linger, watched, inTime, SlowError, SLOW_SAY, daySlot, FitController, minsNow, parseChore, say, scrollCue, sfx, windDown, type Chore, type ParsedChore, type Sfx, type Slot } from './util';
import './studio';
import './pin';

interface KEvent { title: string; start: Date; allDay: boolean; family: boolean }

/** Picture-mode icons for common jobs (first keyword match wins). */
const PICS: [RegExp, string][] = [
  [/teeth|tooth/i, '🪥'], [/hair|comb/i, '💇'], [/hands|soap/i, '🧼'], [/toilet|wee\b/i, '🚽'], [/pyjama|pjs/i, '🩳'], [/dress|clothes|uniform/i, '👕'],
  [/jumper|jacket|coat/i, '🧥'], [/lunch/i, '🥪'], [/drink bottle|water bottle|bottle/i, '🥤'], [/bowl|breakfast|dish(?!washer)|plate|sink/i, '🥣'], [/toy|lego/i, '🧸'],
  [/shoe|sock/i, '👟'], [/hat|sunscreen/i, '🧢'], [/story|book|read|library/i, '📚'], [/make (my |your )?bed|\bbed\b/i, '🛏️'], [/bath|shower|wash/i, '🛁'],
  [/dishwasher/i, '🍽️'], [/table/i, '🍽️'], [/bag|pack/i, '🎒'], [/trumpet/i, '🎺'], [/piano|keyboard/i, '🎹'], [/guitar/i, '🎸'], [/clarinet|practice|music/i, '🎵'],
  [/homework|school|spelling|maths/i, '✏️'], [/tidy|clean|room/i, '🧹'], [/scooter|bike/i, '🛴'], [/swim/i, '🏊'], [/soccer|footy|training|sport/i, '⚽'],
  [/dog|cat|pet|feed/i, '🐾'], [/plant|garden|water/i, '🪴'], [/bin|rubbish|recycling/i, '🗑️'], [/light/i, '💡']
];
/** A job's picture: the one chosen for it, else the first keyword match. */
export const picFor = (s: string | { summary: string; pic?: string }): string => (typeof s === 'string' ? undefined : s.pic) ?? PICS.find(([re]) => re.test(typeof s === 'string' ? s : s.summary))?.[1] ?? '⭐';
const t12 = (s: string): string => { const m = hm(s), h = Math.floor(m / 60) % 24; return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
const SLOT_NAME: Record<Slot, string> = { am: 'Morning', after: 'After school', bed: 'Bedtime', any: 'Any time' };
const FEELINGS: [string, string][] = [['😄', 'great'], ['🙂', 'good'], ['😐', 'okay'], ['😟', 'worried'], ['😢', 'sad']];
/** Pre-readers get three big faces and hear the question. */
const FEELINGS_3: [string, string][] = [['😄', 'happy'], ['😐', 'okay'], ['😢', 'sad']];
const FEEL_KIND = (f: string): 'up' | 'mid' | 'down' => (['great', 'good', 'happy'].includes(f) ? 'up' : f === 'okay' ? 'mid' : 'down');
const UNDO_MS = 10 * 60_000;

const DEFAULT_REWARDS: RewardConfig[] = [{ name: 'Pick the family movie', cost: 100 }, { name: 'Choose Friday dinner', cost: 80 }];

/** Pictures for rewards that have none of their own: each row gets a different one, so a non-reader can tell them apart. */
const REWARD_PICS = ['🎬', '🍕', '🎈', '🍦', '🧩', '🚲', '🎨', '⚽'];
/* drawn, so they keep their shape and contrast in every look: a star (filled or empty), a tick, a cross, a speaker and a ticked list */
const starSvg = (on: boolean, s = 20): TemplateResult => html`<svg class="sstar ${on ? 'lit' : ''}" viewBox="0 0 24 24" width=${s} height=${s} aria-hidden="true"><path d="M12 2.800l2.850 5.900 6.450.900-4.700 4.550 1.150 6.450L12 17.500l-5.750 3.100 1.150-6.450L2.700 9.600l6.450-.900z"></path></svg>`;
const tickSvg = (s = 16): TemplateResult => html`<svg viewBox="0 0 24 24" width=${s} height=${s} fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path pathLength="1" d="M5 12.500l4.500 4.500L19 7.500"></path></svg>`;
const crossSvg = html`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>`;
const speakerSvg = (s = 26): TemplateResult => html`<svg viewBox="0 0 24 24" width=${s} height=${s} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="currentColor"></path><path d="M15.500 9a4.500 4.500 0 0 1 0 6M18 6.500a8 8 0 0 1 0 11"></path></svg>`;
const listSvg = html`<svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="5" width="32" height="38" rx="5" fill="#fff" stroke="#3d4a5c" stroke-width="2.500"></rect><path d="M14 16l3 3 5-6M14 27l3 3 5-6" stroke="#15803d" stroke-width="3.500"></path><path d="M27 17h8M27 28h8M15 37h20" stroke="#3d4a5c" stroke-width="2.500"></path></svg>`;

const lsGet = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) as T; } catch { return d; } };
/** What the feelings card asks next, shown and (for a child who cannot read) spoken. */
const FEEL_ASK: Record<'up' | 'mid' | 'down', string> = { up: 'Lovely! Want to tell someone about it?', mid: 'Thanks for telling me. Anything you need?', down: 'Thanks for telling me. That sounds hard. A hug or a chat might help.' };
const lsSet = (k: string, v: unknown): void => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

export class FhKid extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .hero { width: 330px; flex-shrink: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; inset: -40% -20% auto; height: 70%; background: radial-gradient(closest-side, color-mix(in srgb, var(--kid) 45%, transparent), transparent); pointer-events: none; }
    .name { font-size: 34px; font-weight: var(--w-heavy, 800); line-height: 1; min-width: 0; overflow-wrap: anywhere; }
    .rank { padding: 6px 12px; border-radius: 999px; background: var(--kid); color: #fff; font-size: 14px; font-weight: var(--w-heavy, 800); letter-spacing: .02em; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
    .stat { border-radius: 18px; background: var(--chip); padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; position: relative; }
    .stat b { font-family: 'Bricolage Grotesque', sans-serif; font-size: 28px; font-weight: var(--w-heavy, 800); line-height: 1; font-variant-numeric: tabular-nums; }
    .stat span { font-size: 14px; font-weight: var(--w-semi, 600); color: var(--ink2); }
    /* good days: one filled dot for each day earned, and nothing drawn for the days that were not */
    .dots { display: flex; gap: 5px; min-height: 14px; }
    .dots i { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ink2); }
    .dots i.g { background: var(--ok); border-color: var(--ok); }
    .daybtns { display: grid; grid-template-columns: repeat(7, 76px); gap: 10px; }
    .daybtns button { height: 84px; border-radius: 18px; background: var(--chip); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 15px; font-weight: var(--w-bold, 700); }
    .daybtns button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    .daybtns button span { font-size: 14px; font-weight: var(--w-semi, 600); }
    .nextup { width: 100%; display: flex; align-items: center; gap: 10px; border-radius: 18px; background: var(--chip); padding: 8px 12px 8px 8px; }
    .jobs { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
    .list { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 2px; }
    /* a long list tightens before it scrolls: closer rows, then two columns */
    .list[data-fit] { gap: 5px; }
    .list[data-fit] .sec { margin-top: 1px; }
    .list[data-fit] .job { min-height: 46px; padding-top: 4px; padding-bottom: 4px; }
    .list[data-fit] .job .box { width: 28px; height: 28px; }
    .list[data-fit] .job .t { font-size: 16px; }
    .list[data-fit] .pic { min-height: 148px; }
    .list[data-fit] .pic .e { font-size: 72px; }
    .list[data-fit='2'], .list[data-fit='3'] { display: grid; grid-template-columns: 1fr 1fr; column-gap: 10px; align-content: start; }
    .list[data-fit='2'] > :not(.job), .list[data-fit='3'] > :not(.job), .list[data-fit='2'] > .job:has(.play), .list[data-fit='3'] > .job:has(.play) { grid-column: 1 / -1; }
    :host([data-shape='tall']) { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto minmax(0, 1fr); }
    :host([data-shape='tall']) .hero { width: auto; grid-column: 1; grid-row: 1; }
    :host([data-shape='tall']) .side { width: auto; grid-column: 2; grid-row: 1; max-height: 560px; }
    :host([data-shape='tall']) .jobs { grid-column: 1 / -1; grid-row: 2; }
    /* tablets narrower than the canvas: the side columns narrow first; under 900 px the jobs come first at full width and the page scrolls */
    :host([data-shape='wide'][data-n1]) .hero { width: 290px; }
    :host([data-shape='wide'][data-n1]) .side { width: 272px; }
    :host([data-shape='wide'][data-n2]) .hero { width: 256px; padding: 14px 12px; }
    :host([data-shape='wide'][data-n2]) .side { width: 256px; }
    :host([data-shape='wide'][data-n2]) .side > .card { padding: 12px; }
    :host([data-n1]) .feel button, :host([data-n1]) .side .round { flex-shrink: 0; min-width: 44px; }
    :host([data-shape='wide'][data-n3]) { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: minmax(max-content, 1fr) max-content; overflow-y: auto; gap: 12px; scrollbar-width: none; }
    :host([data-shape='wide'][data-n3]) .jobs { grid-column: 1 / -1; grid-row: 1; }
    :host([data-shape='wide'][data-n3]) .hero { width: auto; grid-column: 1; grid-row: 2; }
    :host([data-shape='wide'][data-n3]) .side { width: auto; grid-column: 2; grid-row: 2; max-height: none; overflow: visible; }
    :host([data-shape='wide'][data-n3]) .list, :host([data-shape='wide'][data-n3]) .focus { overflow: visible; flex: none; }
    :host([data-shape='wide'][data-n3]) .side > .tabcard { overflow: visible; }
    /* portrait and shorter than its canvas: the jobs keep a usable height (the side column scrolls inside itself), and the page scrolls a little if it must */
    :host([data-shape='tall'][data-n3]:not([data-phone])) { grid-template-rows: max-content minmax(400px, 1fr); overflow-y: auto; gap: 12px; scrollbar-width: none; }
    :host([data-shape='tall'][data-n3]:not([data-phone])) .side { max-height: 440px; }
    :host([data-phone]) { display: flex; flex-direction: column; gap: 12px; flex: none; }
    :host([data-phone]) .jobs { order: 1; flex: none; }
    :host([data-phone]) .hero { order: 2; }
    :host([data-phone]) .side { order: 3; max-height: none; overflow: visible; }
    :host([data-phone]) .list, :host([data-phone]) .focus { overflow: visible; flex: none; display: flex !important; }
    :host([data-phone]) .picwrap { min-height: 230px; flex: none; }
    :host([data-phone]) .celebrate { position: fixed; border-radius: 0; }
    :host([data-phone]) .daybtns { grid-template-columns: repeat(4, 1fr); }
    .sec { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; }
    .sec h2 { font-size: 18px; font-weight: var(--w-heavy, 800); }
    .sec span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .job { display: flex; align-items: center; gap: 14px; padding: 10px 14px; min-height: 54px; flex-shrink: 0; border-radius: 18px; background: var(--chip); text-align: left; width: 100%; position: relative; }
    /* the touch is answered on the way down, before Home Assistant or even the click: the tile lights and the check pops */
    .job[data-just], .pic[data-just] { background: var(--chip-strong); }
    .pic[data-just] .e { transform: scale(.94); }
    /* a tap the double-tap guard swallowed still gets an answer: the check shakes its head */
    [data-nope] .check, [data-nope] .tick { animation: nope var(--m-4, 400ms) ease; }
    @keyframes nope { 20%, 60% { transform: translateX(calc(-5px * var(--m-d, 1))); } 40%, 80% { transform: translateX(calc(5px * var(--m-d, 1))); } }
    .job .box { width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid var(--ink2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--on-ok, #fff); font-weight: var(--w-heavy, 800); transition: background-color var(--m-2, 160ms) ease, border-color var(--m-2, 160ms) ease, transform var(--mt-3, 240ms) var(--e-spring, ease); }
    /* a tap anywhere on the row ticks the job (the row listens; the button inside keeps it reachable by keyboard and screen reader) */
    .job { cursor: pointer; }
    .job > .hit { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; text-align: left; min-height: 44px; }
    .job.now { box-shadow: inset 0 0 0 2.5px var(--kid); }
    .pic.now { box-shadow: 0 0 0 4px var(--kid); }
    .focus { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px; overflow: hidden; padding: 6px; margin: -6px; }
    .focus .label { font-size: 14px; margin-top: 4px; }
    .label { font-size: 14px; }
    .pill { font-size: 15px; }
    .job.big { min-height: 96px; padding: 16px 18px; }
    .job.big .box { width: 52px; height: 52px; font-size: 26px; }
    .job.big .t { font-size: 28px; font-weight: var(--w-bold, 700); }
    .job.soonjob { opacity: .82; }
    /* the current picture job, with its "read it to me" button in the lower corner where a small child can reach it */
    .picwrap { position: relative; display: flex; flex: 4 1 0; min-height: 204px; max-height: 300px; }
    .picwrap > .pic { flex: 1; width: 100%; min-height: 0; }
    .readme { position: absolute; right: 14px; bottom: 14px; width: 72px; height: 72px; border-radius: 50%; background: var(--chip-strong); color: var(--ink); box-shadow: inset 0 0 0 2.500px var(--ink2), 0 4px 10px rgba(0,0,0,.14); display: flex; align-items: center; justify-content: center; z-index: 1; }
    .readrow { display: flex; justify-content: flex-end; }
    .readrow .readme { position: static; }
    .pic.big .e { font-size: 124px; }
    .pic.big .pt { font-size: 28px; }
    .pic.small { min-height: 0; flex: 0 0 112px; flex-direction: row; justify-content: flex-start; gap: 16px; padding: 10px 20px; opacity: .85; }
    .pic.small .e { font-size: 72px; }
    .pic.small .pt { font-size: 20px; }
    .allset { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; }
    .allset .big-e { font-size: 72px; animation: hooray var(--m-5, 900ms) cubic-bezier(.3,1.6,.5,1) both; }
    @keyframes hooray { from { transform: scale(calc(1 - .7 * var(--m-d, 1))) rotate(calc(-20deg * var(--m-d, 1))); opacity: 0; } }
    button.later { width: 100%; min-height: 48px; align-items: center; text-align: left; font-size: 15px; }
    /* all done, in pictures: the child's own character celebrating, and one big button to look back at the day */
    .party { position: relative; display: flex; align-items: center; justify-content: center; line-height: 0; }
    .party .burstart { position: absolute; inset: -18px -70px; width: calc(100% + 140px); height: calc(100% + 36px); }
    .seedone { display: flex; align-items: center; gap: 14px; min-height: 96px; padding: 12px 28px 12px 18px; border-radius: 26px; background: var(--chip-strong); box-shadow: inset 0 0 0 2.500px var(--ink2); font-size: 22px; font-weight: var(--w-heavy, 800); }
    .feel.three { justify-content: space-around; }
    .feel.three button { font-size: 46px; width: 72px; height: 72px; }
    .job.done .box { background: var(--ok); border-color: var(--ok); transform: scale(1.08); }
    .job.done .t { color: var(--ink-done, var(--ink3)); text-decoration: line-through; }
    .job .t { flex: 1; font-size: 18px; font-weight: var(--w-semi, 600); }
    .plus { font-size: 14px; font-weight: var(--w-heavy, 800); padding: 5px 10px; border-radius: 999px; background: color-mix(in srgb, var(--kid) 22%, transparent); white-space: nowrap; }
    .grow { background: color-mix(in srgb, var(--ok) 18%, transparent); }
    /* one filled button on the page: the timer of the job to do now. Any other timer is an outlined one. */
    .play { height: 44px; /* token */ padding: 0 16px; border-radius: 999px; background: var(--chip-strong); color: var(--ink); box-shadow: inset 0 0 0 2px var(--primary); font-weight: var(--w-bold, 700); font-size: 15px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
    .now .play:not(.going) { background: var(--primary); color: var(--on-primary); box-shadow: none; }
    .play.going { height: auto; min-height: 44px; padding: 4px 14px 4px 4px; background: var(--chip-strong); color: var(--ink); font-variant-numeric: tabular-nums; font-size: 16px; }
    .later { padding: 10px 14px; border-radius: 16px; background: var(--chip-soft); font-size: 15px; font-weight: var(--w-semi, 600); color: var(--ink2); display: flex; justify-content: space-between; }
    .pics { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; align-content: start; }
    .pic { border-radius: 24px; background: var(--chip); padding: 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; min-height: 190px; justify-content: center; }
    .pic .pt { font-size: 17px; font-weight: var(--w-bold, 700); text-align: center; }
    .pic .e { font-size: 96px; line-height: 1.1; transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.6,.4,1); }
    .pic.done { background: color-mix(in srgb, var(--ok) 25%, var(--chip)); }
    .pic.done .e { transform: scale(.85) rotate(-8deg); opacity: .6; }
    .pic .tick { position: absolute; top: 10px; right: 10px; width: 38px; height: 38px; border-radius: 50%; background: var(--ok); color: var(--on-ok, #fff); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: var(--w-heavy, 800); animation: avPop var(--m-4, 400ms) cubic-bezier(.2,1.4,.4,1); }
    .stars { display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 2px; line-height: 0; }
    .sstar path { fill: none; stroke: var(--ink2); stroke-width: 1.800; stroke-linejoin: round; }
    .sstar.lit path { fill: #f5b301; stroke: #8a5a00; stroke-width: 1.500; }
    .avph { display: block; width: 186px; max-width: 100%; aspect-ratio: 200 / 240; border-radius: 22px; background: var(--chip-soft); }
    .lowrow { display: flex; gap: 8px; width: 100%; flex-shrink: 0; z-index: 1; }
    .askbtn { flex: 1 1 0; min-width: 0; min-height: 72px; flex-shrink: 0; border-radius: 22px; background: var(--chip-strong); color: var(--ink); box-shadow: inset 0 0 0 2.5px var(--ink2); display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 22px; font-weight: var(--w-heavy, 800); z-index: 1; }
    .studio { box-shadow: inset 0 0 0 2px var(--ink2); background: var(--chip-strong); }
    .avbtn { position: relative; flex: 0 1 223px; min-height: 110px; display: flex; justify-content: center; }
    .avbtn .avwrap, .avbtn svg { height: 100% !important; width: auto !important; max-height: 223px; }
    .starjar { display: grid; grid-template-columns: repeat(5, 24px); gap: 2px 3px; line-height: 0; }
    .side { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; min-height: 0; overflow-y: auto; scrollbar-width: none; border-radius: 24px; }
    .side::-webkit-scrollbar { display: none; }
    .side > .card { flex-shrink: 0; }
    /* a small child's controls sit low: the jar card above them takes up the spare height, so there is no empty band between the cards */
    .side.low > .card:first-child { flex: 1 0 auto; justify-content: center; }
    /* the youngest reaches the lower half of a wall panel only: his feelings card sits at the very bottom of the column, and the two tab buttons come down to meet it, under their list */
    :host(:not([data-phone]):not([data-shape='tall'])) .side.low > .feelcard { order: 3; }
    :host(:not([data-phone]):not([data-shape='tall'])) .side.low > .tabcard { order: 2; justify-content: flex-end; }
    :host(:not([data-phone]):not([data-shape='tall'])) .side.low > .tabcard > .tabs { order: 9; }
    .side > .tabcard { flex: 0 1 auto; min-height: 180px; overflow-y: auto; scrollbar-width: none; gap: 8px; }
    /* a reward: the whole row is the button. Its cost is an outlined chip, and spending always takes a second, deliberate tap. */
    .rw { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 56px; padding: 6px 8px 6px 10px; flex-shrink: 0; border-radius: 14px; background: var(--chip); text-align: left; }
    .rw .n { flex: 1; min-width: 0; font-size: 15px; font-weight: var(--w-semi, 600); line-height: 1.2; display: flex; flex-direction: column; gap: 4px; }
    .rw .rpic { font-size: 24px; flex-shrink: 0; }
    .rw.picrow .rpic { font-size: 40px; }
    .rw .stars { max-width: 100px; }
    .rw .cost { min-height: 32px; padding: 0 12px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 15px; font-weight: var(--w-bold, 700); white-space: nowrap; box-shadow: inset 0 0 0 2px var(--ink); }
    /* "80 to go" is a status, not something to press: a flat tile with no outline */
    .rw .cost.notyet { box-shadow: none; background: var(--track); color: var(--ink); font-weight: var(--w-semi, 600); }
    .owedline { display: flex; align-items: center; gap: 8px; flex-shrink: 0; min-height: 44px; padding: 6px 12px; border-radius: 14px; font-size: 15px; font-weight: var(--w-semi, 600); line-height: 1.25; color: var(--ink); box-shadow: inset 0 0 0 2px var(--line, color-mix(in srgb, var(--ink) 30%, transparent)); overflow-wrap: anywhere; }
    .rw.ask[data-held] { pointer-events: none; }
    @keyframes lockwig { 0%, 100% { rotate: 0deg; } 25% { rotate: calc(-16deg * var(--m-d, 1)); } 60% { rotate: calc(12deg * var(--m-d, 1)); } 82% { rotate: calc(-6deg * var(--m-d, 1)); } }
    .studio[data-nudge] svg { transform-origin: 50% 20%; animation: lockwig var(--m-4, 400ms) var(--e-out, ease) 1; }
    .rw.ask { flex-wrap: wrap; box-shadow: var(--sel-ring); background: var(--sel-bg); color: var(--sel-ink); } .rw.ask button { color: var(--ink); }
    .rw.ask .q { flex: 1 1 100%; font-size: 16px; font-weight: var(--w-bold, 700); line-height: 1.25; }
    .rw button { flex: 1; height: 52px; /* token */ padding: 0 12px; border-radius: 999px; font-size: 16px; font-weight: var(--w-bold, 700); background: var(--chip-strong); box-shadow: inset 0 0 0 2.500px var(--ink); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
    .rw button.save { background: var(--chip); box-shadow: inset 0 0 0 1.500px var(--ink2); color: var(--ink); }
    .jar { display: flex; align-items: center; gap: 12px; }
    .wk { display: flex; gap: 10px; font-size: 14px; align-items: baseline; }
    .wk .init { min-width: 22px; height: 22px; font-size: 14px; }
    .wk .d { width: 78px; flex-shrink: 0; font-weight: var(--w-bold, 700); color: var(--ink2); font-size: 14px; }
    .bedclock { display: inline-flex; align-items: center; gap: 8px; line-height: 0; }
    .bedclock b { display: flex; flex-direction: column; align-items: center; font-size: 20px; font-weight: var(--w-heavy, 800); line-height: 1; font-variant-numeric: tabular-nums; }
    .bedclock b span { font-size: 14px; font-weight: var(--w-bold, 700); color: var(--ink2); margin-top: 2px; }
    .ring { position: relative; width: 52px; height: 52px; }
    .ring svg { transform: rotate(-90deg); }
    .ring b { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: var(--w-heavy, 800); }
    .feel { display: flex; justify-content: space-between; }
    .tabs { display: flex; gap: 6px; padding: 4px; border-radius: 999px; background: var(--chip-soft); }
    .tab { flex: 1; height: 44px; /* token */ border-radius: 999px; font-size: 15px; font-weight: var(--w-bold, 700); color: var(--ink); }
    /* the page's messages sit at the top here, clear of the buttons a child is reaching for */
    :host(:not([data-phone])) .toast { bottom: auto; top: 4px; }
    .tab[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .feel button { font-size: 30px; width: 46px; height: 46px; border-radius: 50%; }
    .feel button:active { background: var(--chip-strong); }
    .celebrate { position: absolute; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); border-radius: 28px; }
    .cbox { border-radius: 32px; padding: 26px 30px; display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: 720px; animation: sheet var(--m-4, 400ms) cubic-bezier(.2,1.3,.3,1) both; }
    .unl { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .unl > div { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 14px; font-weight: var(--w-bold, 700); animation: avPop var(--m-5, 900ms) cubic-bezier(.2,1.4,.4,1) both; }
    @keyframes avPop { from { opacity: 0; transform: scale(calc(1 - .6 * var(--m-d, 1))); } }
    .wind { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--ink2); }
    ${unsafeCSS(avatarCss)}
    ${unsafeCSS(fxCss)}
  `];

  private _nowUid = '';
  static properties = {
    hass: { attribute: false }, kid: { attribute: false }, familyCalendars: { attribute: false }, pin: {}, owed: {}, jarTarget: { type: Number }, jarReward: {},
    privateWords: { attribute: false }, quiet: { type: Boolean }, ask: { type: Boolean }, oneAtATime: { type: Boolean }, _showAll: { state: true }, _tabPicked: { state: true },
    _chores: { state: true }, _events: { state: true }, _saving: { state: true }, _jump: { state: true }, _bursts: { state: true }, _confetti: { state: true },
    _studio: { state: true }, _celebrate: { state: true }, _pinAsk: { state: true }, _msg: { state: true }, _practice: { state: true }, _now: { state: true }, _feel: { state: true }, _tab: { state: true }, _days: { state: true },
    _drawn: { state: true }, _spend: { state: true }, _held: { state: true }, _owed: { state: true }
  };

  hass?: Hass;
  kid!: KidConfig;
  familyCalendars: string[] = [];
  pin = '';
  owed = 'todo.rewards_owed';
  jarTarget = 120;
  jarReward = 'a family treat';
  privateWords: string[] = [];
  quiet = false;
  /** the helper is set up: a picture-mode child gets an "Ask" button on his own page */
  ask = false;
  /** one job at a time: Now / Next / Later, and "first jobs, then studio" */
  oneAtATime = false;
  private _showAll = false;
  private _tabPicked = false;
  private _chores: ParsedChore[] = [];
  private _events: KEvent[] = [];
  private _jump = 0;
  private _bursts: { id: number; text: string }[] = [];
  private _confetti = 0;
  private _studio = false;
  private _lookSaid = false;
  private _celebrate: Unlock[] | null = null;
  private _pinAsk: { reason: string; run: () => void } | null = null;
  private _days = false;
  /** false for the first frame of a visit: the avatar and the other heavy drawings wait, so the page answers a touch at once */
  private _drawn = false;
  /** the reward being asked about ("Spend 50 points?") */
  private _spend = '';
  /** the reward whose "Yes" was just tapped: its row keeps its place for a moment, so a second tap cannot land on the row below */
  private _held = '';
  private _heldAt = 0;
  /** rewards this child has spent on that still wait for a grown-up */
  private _owed: string[] = [];
  private _owedSeen = '';
  private async _loadOwed(): Promise<void> {
    const id = this.owed, name = this.kid.name;
    if (!id || !this.hass?.states[id]) return;
    try {
      const res = await this.hass.callWS<{ items: { summary: string; status: string }[] }>({ type: 'todo/item/list', entity_id: id });
      if (name !== this.kid.name) return;
      const mine = res.items.filter((i) => i.status === 'needs_action' && i.summary.startsWith(`${name}: `)).map((i) => i.summary.slice(name.length + 2));
      this._owed = [...new Set(mine)].filter((n) => this._needsAdult(n));
    } catch { /* the line is simply left as it was */ }
  }
  private _needsAdult(name: string): boolean { const r = (this.kid.rewards ?? DEFAULT_REWARDS).find((x) => x.name === name); return !r || (r.approve ?? r.cost >= 60); }
  private _msg = '';
  private _practice: { uid: string; end: number; mins: number } | null = null;
  private _now = new Date();
  private _feel = '';
  private _tab: 'rewards' | 'week' = 'rewards';
  private _unsub?: () => void;
  private _subFor = '';
  private _subGen = 0;
  private _evFor = '';
  private _busy = new Set<string>();
  private _tick?: number;

  connectedCallback(): void {
    super.connectedCallback();
    this._tick = window.setInterval(() => { this._now = new Date(); this._checkPractice(); }, 1000);
  }
  disconnectedCallback(): void { super.disconnectedCallback(); this._unsub?.(); this._unsub = undefined; this._subFor = ''; clearInterval(this._tick); }

  private get _e() { return kidEntities(this.kid); }
  private get _star(): number { return this.kid.star ?? 10; }
  private get _picMode(): boolean { return this.kid.mode === 'picture'; }
  private get _life(): number { return num(this.hass, this._e.lifetime); }
  private get _grow(): number { return num(this.hass, this._e.grow); }
  private _lookCache: [string, Look] | null = null;
  private get _look(): Look {
    const raw = this.hass?.states[this._e.avatar]?.state ?? '';
    // keyed by child as well: the same page element is reused when you switch between children
    const key = `${this.kid.name}|${raw}`;
    if (this._lookCache?.[0] !== key) this._lookCache = [key, decodeLook(raw, this.kid.look ? decodeLook(this.kid.look) : {})];
    return this._lookCache[1];
  }
  private get _wind(): boolean { return windDown(this.kid.bedtime, this._now); }

  protected shouldUpdate(ch: PropertyValues): boolean {
    if (ch.size === 1 && ch.has('hass') && this.kid) {
      const e = this._e;
      return changed(ch.get('hass') as Hass | undefined, this.hass, [e.points, e.lifetime, e.week, e.goal, e.grow, e.avatar, 'input_number.family_jar']);
    }
    if (ch.size === 1 && ch.has('_now')) return this._now.getSeconds() === 0 || !!this._practice;
    return true;
  }

  protected updated(ch: PropertyValues): void {
    if (!this.hass || !this.kid) return;
    const e = this._e;
    if (this._subFor !== e.chores && this.hass.connection) {
      this._unsub?.(); this._unsub = undefined; this._subFor = e.chores; this._chores = [];
      const gen = ++this._subGen, list = e.chores;
      this.hass.connection.subscribeMessage<{ items: Chore[] }>((m) => { if (gen === this._subGen) this._chores = m.items.map(parseChore); }, { type: 'todo/item/subscribe', entity_id: list })
        .then((u) => { if (gen === this._subGen) this._unsub = u; else u(); }).catch(() => { this._chores = []; });
      this._practice = lsGet(`fh-practice-${e.slug}`, null);
    }
    if (this._evFor !== this.kid.name) { this._evFor = this.kid.name; this._tab = 'rewards'; this._tabPicked = false; this._showAll = false; this._feel = ''; this._days = false; this._spend = ''; this._held = ''; this._owed = []; this._owedSeen = ''; this._lookSaid = false; this._loadWeek(); }
    { const key = `${this.kid.name}|${this.hass.states[this.owed]?.state ?? ''}`; if (key !== this._owedSeen) { this._owedSeen = key; void this._loadOwed(); } }
    if (!this._drawn && !this._drawWait) { this._drawWait = true; const go = (): void => { this._drawWait = false; this._drawn = true; };
      if ('requestIdleCallback' in window) (window as any).requestIdleCallback(go, { timeout: 200 }); else requestAnimationFrame(() => requestAnimationFrame(go)); }
    if (ch.has('hass')) this._checkUnlocks();
    this.renderRoot.querySelectorAll('.scrolly').forEach(scrollCue);
  }

  private _drawWait = false;
  protected willUpdate(ch: PropertyValues): void { if (ch.has('kid') && ch.get('kid') && (ch.get('kid') as KidConfig).name !== this.kid?.name) this._drawn = false; }
  /** Pointer-down on a job: the tile answers now (data-just), whatever the click does a moment later. */
  private _press(e: Event): void { const el = e.currentTarget as HTMLElement; el.setAttribute('data-just', ''); window.setTimeout(() => el.removeAttribute('data-just'), 700); }
  private _nope(uid: string): void { const el = this.renderRoot.querySelector(`[data-uid="${CSS.escape(uid)}"]`); if (!el) return; el.removeAttribute('data-nope'); void (el as HTMLElement).offsetWidth; el.setAttribute('data-nope', ''); window.setTimeout(() => el.removeAttribute('data-nope'), 450); }

  /* ---------------- unlock celebrations (high-water marks, never replay) ---------------- */
  private _checkUnlocks(): void {
    if (this._celebrate || !this.hass?.states[this._e.lifetime]) return;
    const life = this._life, grow = this._grow, slug = this._e.slug;
    const seen = lsGet<number | null>(`family-hub-seen-${slug}`, null), seenG = lsGet<number | null>(`family-hub-seen-grow-${slug}`, null);
    if (seen === null || seenG === null) { lsSet(`family-hub-seen-${slug}`, Math.max(seen ?? 0, life)); lsSet(`family-hub-seen-grow-${slug}`, Math.max(seenG ?? 0, grow)); return; }
    const fresh = [...unlocksBetween(seen, life), ...growBetween(seenG, grow)];
    if (fresh.length) {
      const f = this.kid.favourites ?? [];
      this._celebrate = [...fresh].sort((a, b) => Number(f.includes(b.id)) - Number(f.includes(a.id)));
      this._confetti++;
      this._sound('unlock');
      if (this._picMode) say(`Wow ${this.kid.name}! You unlocked ${fresh[0].label}!`);
    }
  }
  private _closeCelebrate(open: boolean): void {
    const slug = this._e.slug;
    lsSet(`family-hub-seen-${slug}`, Math.max(lsGet(`family-hub-seen-${slug}`, 0), this._life));
    lsSet(`family-hub-seen-grow-${slug}`, Math.max(lsGet(`family-hub-seen-grow-${slug}`, 0), this._grow));
    this._celebrate = null;
    if (open && !this._wind) this._studio = true;
  }

  private async _loadWeek(): Promise<void> {
    if (!this.hass) return;
    const a = startOfDay(new Date()), b = addDays(a, 8), kid = this.kid.name;
    const cals = [{ id: this._e.calendar, family: false }, ...this.familyCalendars.map((id) => ({ id, family: true }))].filter((c) => this.hass!.states[c.id]);
    const out: KEvent[] = [];
    const priv = this.privateWords.map((w) => w.toLowerCase());
    await Promise.all(cals.map(async (c) => {
      try {
        const rows = await this.hass!.callApi<any[]>('GET', `calendars/${c.id}?start=${encodeURIComponent(a.toISOString())}&end=${encodeURIComponent(b.toISOString())}`);
        for (const r of rows) {
          const title: string = String(r.summary ?? '').trim() || '(busy)';
          if (priv.some((w) => title.toLowerCase().includes(w))) continue;
          out.push({ title, start: r.start?.date ? new Date(`${r.start.date}T00:00:00`) : new Date(r.start.dateTime), allDay: !!r.start?.date, family: c.family });
        }
      } catch { /* ignore */ }
    }));
    if (kid !== this.kid.name) return;
    out.sort((x, y) => x.start.getTime() - y.start.getTime());
    this._events = out;
  }

  /* ---------------- ticking ---------------- */
  private _sound(s: Sfx): void { if (!this.quiet && !this._wind) sfx(s); else if (s === 'tick') sfx('tap'); }
  private _award(c: ParsedChore, sign: 1 | -1): Promise<unknown> {
    const data: Record<string, unknown> = { kid: this._e.slug, points: sign * c.pts, lifetime: true, jar: c.lane === 'job' ? sign : 0, grow: c.lane === 'grow' ? sign : 0, reason: `${sign > 0 ? '' : 'un-ticked '}${c.summary}` };
    if (!c.pts && c.lane !== 'job' && c.lane !== 'grow') return Promise.resolve();
    return this.hass!.callService('script', 'fh_add_points', data);
  }

  private _toggle(c: ParsedChore, viaPin = false): void {
    if (!this.hass) return;
    if (this._busy.has(c.uid)) { this._nope(c.uid); return; }
    const done = c.status === 'completed';
    const ticks = lsGet<Record<string, number>>('fh-ticks', {});
    if (done && Date.now() - (ticks[c.uid] ?? 0) < 2000) { this._nope(c.uid); return; } // double-tap guard: a fresh tick can't be undone by the same flurry, but the tap still gets an answer
    if (done && !viaPin && Date.now() - (ticks[c.uid] ?? 0) > UNDO_MS) {
      if (this.pin) this._pinAsk = { reason: `Untick “${c.summary}”?`, run: () => this._toggle(c, true) };
      else this._say('Need to change that? Ask a grown-up.');
      return;
    }
    this._doToggle(c, done, ticks);
  }

  private async _doToggle(c: ParsedChore, done: boolean, ticks: Record<string, number>): Promise<void> {
    this._busy.add(c.uid);
    const rowOf = (): Element | null => this.renderRoot.querySelector(`[data-uid="${CSS.escape(c.uid)}"]`);
    const slow = window.setTimeout(() => { const r = rowOf(); r?.setAttribute('data-busy', ''); r?.setAttribute('aria-busy', 'true'); }, 250);
    const prev = this._chores;
    this._chores = prev.map((x) => x.uid === c.uid ? { ...x, status: done ? 'needs_action' : 'completed' } : x);
    // the sound and the spark answer the touch, not Home Assistant
    if (!done) { const row = this.renderRoot.querySelector(`[data-uid="${CSS.escape(c.uid)}"]`), at = row?.querySelector('.check') ?? row;
      if (at) { spark('tick', at); const words = c.summary.toLowerCase();
        if (c.pts && !this._picMode) spark('points', at, { text: `+${c.pts}` });
        if (row && /trumpet|clarinet|piano|practice|music/.test(words)) spark('tada', row, { variant: /clarinet/.test(words) ? 'clarinet' : undefined });
        else if (row && /read|book|library/.test(words)) spark('book', row); } }
    this._sound(done ? 'untick' : c.lane === 'job' ? 'coin' : 'tick');
    try {
      await inTime(this.hass!.callService('todo', 'update_item', { item: c.uid, status: done ? 'needs_action' : 'completed' }, { entity_id: this._e.chores }));
      await inTime(this._award(c, done ? -1 : 1));
      if (done) { delete ticks[c.uid]; lsSet('fh-ticks', ticks); return; }
      ticks[c.uid] = Date.now(); lsSet('fh-ticks', ticks);
      this._jump++;
      const id = Date.now();
      const text = c.lane === 'grow' ? '🌱' : c.pts ? (this._picMode ? '★'.repeat(Math.max(1, Math.round(c.pts / this._star))) : `+${c.pts}`) : '✓';
      if (this._picMode || !c.pts) { this._bursts = [...this._bursts, { id, text }]; setTimeout(() => { this._bursts = this._bursts.filter((b) => b.id !== id); }, 1300); }
      if (this._picMode) say(`${c.summary}. Done! ${c.pts ? 'Here’s a star!' : ''}`);
      this._maybeAllDone();
    } catch (err) {
      console.warn('Family Hub: chore update failed', err);
      this._chores = prev;
      this._say(err instanceof SlowError ? SLOW_SAY : 'Couldn’t save that one – try again');
    } finally { this._busy.delete(c.uid); clearTimeout(slow); const r = rowOf(); r?.removeAttribute('data-busy'); r?.removeAttribute('aria-busy'); }
  }

  private _maybeAllDone(): void {
    const slot = daySlot(bedtimeFor(this.kid.bedtime, this._now), this._now);
    const now = this._chores.filter((c) => c.lane === 'routine' && (c.slot === slot));
    const jobs = this._chores.filter((c) => c.lane === 'job');
    const set = now.length ? now : jobs;
    if (!set.length || set.some((c) => c.status !== 'completed')) return;
    // "that's everything" is only true when nothing on the page is left to do: one part finished with other jobs waiting stays quiet
    if (this._block().todo.length) return;
    const key = `fh-alldone-${this._e.slug}-${new Date().toDateString()}-${slot}`;
    if (lsGet(key, false)) return;
    lsSet(key, true);
    const n = this.kid.name;
    const card = this.renderRoot.querySelector('.jobs');
    if (!this._wind) { if (card) { spark('done', card); window.setTimeout(() => spark(slot === 'bed' ? 'moon' : 'stomp', card), 700); } else this._confetti++; this._sound(((this.kid.sound as Sfx) ?? 'done')); setTimeout(() => this._sound('done'), 700); }
    if (this._picMode) say(slot === 'am' ? `You did your whole morning, ${n}!` : slot === 'bed' ? `All ready for bed, ${n}. Sleep well!` : `All done, ${n}!`);
    this._say(slot === 'bed' ? `All set for bed, ${n}. Sleep well.` : [`All done, ${n}. You stuck with it today.`, `That’s everything, ${n}. Nice and steady.`, `Legend effort, ${n}.`][Math.floor(Math.random() * 3)]);
  }

  /* ---------------- practice timer ---------------- */
  private _startPractice(c: ParsedChore): void {
    this._practice = { uid: c.uid, end: Date.now() + c.minutes * 60_000, mins: c.minutes };
    lsSet(`fh-practice-${this._e.slug}`, this._practice);
    this._sound('tap');
    this._say(c.song ? `${c.minutes} minutes of music. Go!` : `${c.minutes} minutes on the clock. You’ve got this.`);
    if (c.song) this._song(c.minutes);
  }
  /** A timed job tagged @song plays music for as long as its timer runs: when the music stops, time is up. */
  private _song(minutes: number): void { this.dispatchEvent(new CustomEvent('song', { detail: { minutes }, bubbles: true, composed: true })); }
  private _stopPractice(): void {
    if (this._chores.find((x) => x.uid === this._practice?.uid)?.song) this._song(0);
    this._practice = null; lsSet(`fh-practice-${this._e.slug}`, null);
  }
  private _checkPractice(): void {
    const p = this._practice;
    if (!p || Date.now() < p.end) return;
    const c = this._chores.find((x) => x.uid === p.uid);
    this._stopPractice();
    if (c?.song) this._say('Time’s up! All done? Tick it off.');
    else if (c && c.status !== 'completed') { this._doToggle(c, false, lsGet('fh-ticks', {})); this._say(`Practice done – ${p.mins} minutes. Sounding good!`); }
  }

  /* ---------------- rewards ---------------- */
  /** What a reward costs, in the child's own words: "50 points" or "5 stars". */
  private _costWords(r: RewardConfig): string { const n = Math.max(1, Math.round(r.cost / this._star)); return this._picMode ? `${n} star${n === 1 ? '' : 's'}` : `${r.cost} points`; }
  /** First tap on a reward: never spends. It says where the child stands, or asks "Spend 50 points?" in the row (or for the PIN, for the big ones). */
  private _rewardTap(r: RewardConfig): void {
    if (Date.now() - this._heldAt < 600) return; // a second tap straight after "Yes" is not a choice
    const have = num(this.hass, this._e.points);
    if (have < r.cost) {
      this._sound('locked');
      if (this._picMode) say(`${r.name}. Not yet! ${Math.ceil((r.cost - have) / this._star)} more stars.`);
      this._say(`Saving up: ${this._picMode ? `${Math.ceil((r.cost - have) / this._star)} more stars` : `${r.cost - have} to go`}. You’ll get there.`);
      return;
    }
    this._sound('tap');
    if ((r.approve ?? r.cost >= 60) && this.pin) { if (this._picMode) say(`${r.name}. Ask a grown-up.`); this._redeem(r); return; }
    this._spend = r.name;
    if (this._picMode) say(`${r.name}. Spend ${this._costWords(r)}? Yes, or not now.`);
  }
  private _redeeming = false;
  /** the reward whose points are on their way to Home Assistant: its row says "Saving…" until the answer comes */
  private _saving = '';
  private async _redeem(r: RewardConfig, checked = false): Promise<void> {
    const have = num(this.hass, this._e.points);
    this._spend = '';
    if (have < r.cost || this._redeeming) return;
    const needs = r.approve ?? r.cost >= 60;
    if (needs && this.pin && !checked) { this._pinAsk = { reason: `${this.kid.name}: ${r.name}?`, run: () => { void this._redeem(r, true); } }; return; }
    // one spend at a time, and no celebration until Home Assistant has taken the points
    this._redeeming = true; this._saving = r.name;
    try {
      await inTime(this.hass!.callService('script', 'fh_add_points', { kid: this._e.slug, points: -r.cost, lifetime: false, reason: `reward: ${r.name}` }));
    } catch (err) { this._say(err instanceof SlowError ? SLOW_SAY : 'That did not go through, so no points were spent. Try again in a moment.'); return; } finally { this._saving = ''; window.setTimeout(() => { this._redeeming = false; }, 1500); }
    if (this.owed && this.hass!.states[this.owed]) {
      this.hass!.callService('todo', 'add_item', { item: `${this.kid.name}: ${r.name}`, description: `${new Date().toLocaleDateString('en-AU')} · ${r.cost} pts${needs && !this.pin ? ' · needs a grown-up OK' : ''}` }, { entity_id: this.owed }).catch(() => undefined);
    }
    this._confetti++; this._jump++; this._sound('unlock');
    // a DJ reward hands tonight's jukebox to this child (the Music page reads this)
    if (r.dj ?? /\bdj\b|dinner music/i.test(r.name)) lsSet('fh-dj', { kid: this.kid.name, day: new Date().toDateString() });
    if (this._picMode) say(`Yay! ${r.name}!`);
    this._say(needs ? `Nice saving, ${this.kid.name}. A grown-up will sort out: ${r.name}.` : `Nice saving, ${this.kid.name}! ${r.name} – your pick.`);
    if (needs && !this._owed.includes(r.name)) this._owed = [...this._owed, r.name];
  }

  private _feelPick(f: string): void {
    this._feel = f; this._sound('tap');
    // a child who cannot read hears the follow-up question that the card now shows
    if (this._picMode) say(FEEL_ASK[FEEL_KIND(f)]);
  }
  private _feelReply(kind: 'hug' | 'chat' | 'ok' | 'share'): void {
    const n = this.kid.name;
    if (kind === 'chat' || kind === 'share') {
      // the note is real: a notification in Home Assistant, and an event the card can turn into a chip for the parents. Nothing here promises that someone is on the way.
      Promise.resolve(this.hass?.callService('persistent_notification', 'create', { title: kind === 'share' ? `${n} has something good to share` : `${n} would like a chat`,
        message: this._feel ? `${n} is feeling ${this._feel} and would like ${kind === 'share' ? 'to tell a grown-up about it' : 'a chat later'}.` : `${n} would like a chat with a grown-up${this._wind ? ' before bed' : ''}.`, notification_id: `fh_chat_${this._e.slug}` })).catch(() => { /* the event below still reaches the card */ });
      this.dispatchEvent(new CustomEvent('fh-kid-wants-chat', { bubbles: true, composed: true, detail: { name: n, kind, feeling: this._feel } }));
    }
    const msg = kind === 'hug' ? 'Go find a grown-up for a big hug 🤗' : kind === 'ok' ? 'Good to know. Thanks for sharing.' : 'I’ve left a note for a grown-up.';
    this._say(msg); if (this._picMode) say(msg.replace(' 🤗', ''));
    this._feel = '';
  }

  /** Days off are a grown-up's call: the sheet (one big button per day) opens from the child's settings, which sit behind the PIN. */
  openDays(): void { this._days = true; }
  private _dayOff(i: number): void {
    const w = (this.hass?.states[this._e.week]?.state ?? '-------').padEnd(7, '-').slice(0, 7);
    const n = w[i] === 'O' ? '-' : 'O';
    this.hass!.callService('input_text', 'set_value', { entity_id: this._e.week, value: w.slice(0, i) + n + w.slice(i + 1) });
    this._say(n === 'O' ? 'Marked as a day off.' : 'Day off removed.');
  }
  private _daysSheet(): TemplateResult {
    const w = (this.hass?.states[this._e.week]?.state ?? '-------').padEnd(7, '-').slice(0, 7);
    return html`<div class="celebrate" @click=${(e: Event) => { if (e.target === e.currentTarget) this._days = false; }}>
      <div class="glass cbox" role="dialog" aria-modal="true" aria-label="Days off">
        <h2 class="t-head">Days off this week</h2>
        <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600);text-align:center">A day off never counts against ${this.kid.name}’s week.</span>
        <div class="daybtns">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => html`<button class="tap" aria-pressed=${String(w[i] === 'O')} @click=${() => this._dayOff(i)}>${d}<span>${w[i] === 'O' ? 'Day off' : w[i] === 'G' ? 'Good day' : '–'}</span></button>`)}</div>
        <button class="pill tap primary" style="height:52px;padding:0 28px;font-size:16px" @click=${() => { this._days = false; }}>Done</button>
      </div></div>`;
  }

  private _msgTimer?: number;
  private _say(m: string): void { this._msg = m; clearTimeout(this._msgTimer); this._msgTimer = window.setTimeout(() => { this._msg = ''; }, 2800); }

  /* ---------------- render ---------------- */
  render(): TemplateResult | typeof nothing {
    if (!this.kid || !this.hass) return nothing;
    const [msg, msgOut] = linger(this, 'msg', this._msg);
    if (this._studio) return html`<fh-studio .hass=${this.hass} .kid=${this.kid} .look=${this._look} .life=${this._life} .grow=${this._grow} @close=${() => { this._studio = false; this._jump++; }}></fh-studio>`;
    const e = this._e, h = this.hass;
    const missing = !h.states[e.points] || !h.states[e.chores];
    return html`<div style="display:contents;--kid:${slotVar(this.kid.colour)}">
      ${this._hero()}
      ${missing ? html`<section class="glass jobs"><div class="empty"><h2 class="t-sub">Set up ${this.kid.name}’s page</h2>
        <span>Create <b>${e.chores}</b> and <b>${e.points}</b> in Home Assistant.</span></div></section>` : this._jobs()}
      <div class="side scrolly ${this._picMode && !this._wind ? 'low' : ''}" @scroll=${scrollCue}>${this._wind ? html`${this._windCard()}<section class="glass card">${this._weekBody()}</section>${this._jar()}${this._windChat()}`
        // a small child's own controls sit low on a wall panel: his stars and what is coming up go under the feelings card, the jar (nothing to press) goes on top
        : this._picMode ? html`${this._jar()}${this._feelCard()}${this._tabs()}` : html`${this._tabs()}${this._jar()}${this._feelCard()}`}</div>
      ${this._bursts.map((b) => html`<span class="burst" style="left:150px;top:260px">${b.text}</span>`)}
      ${this._confetti && !this._wind ? keyed(this._confetti, confetti(this._confetti)) : nothing}
      ${this._celebrate ? this._celebration() : nothing}
      ${this._days ? this._daysSheet() : nothing}
      ${this._pinAsk ? html`<fh-pin .pin=${String(this.pin)} reason=${this._pinAsk.reason} @ok=${() => { const r = this._pinAsk!.run; this._pinAsk = null; r(); }} @cancel=${() => { this._pinAsk = null; }}></fh-pin>` : nothing}
      <div class="says" role="status" aria-live="polite">${msg ? html`<div class="toast" ?data-closing=${msgOut}>${msg}</div>` : nothing}</div>
    </div>`;
  }

  private _hero(): TemplateResult {
    const e = this._e, h = this.hass!, life = this._life, look = this._look, pts = num(h, e.points);
    const li = levelInfo(life), goal = h.states[e.goal]?.state;
    const nx = nextUnlock(life, this.kid.favourites, goal && goal !== 'unknown' ? goal : undefined), from = prevThreshold(life);
    const pct = nx ? Math.max(4, Math.round(((life - from) / Math.max(1, nx.req - from)) * 100)) : 100;
    const w = (h.states[e.week]?.state ?? '-------').padEnd(7, '-').slice(0, 7);
    const todayIdx = (this._now.getDay() + 6) % 7;
    const goodToday = this._goodToday();
    const goodCount = [...w].filter((c, i) => c === 'G' || (i === todayIdx && goodToday)).length;
    return html`<section class="glass hero" aria-label="${this.kid.name}’s avatar">
      <button class="tap avbtn" aria-label="Make ${this.kid.name} jump" @click=${() => { this._jump++; this._sound((this.kid.sound as Sfx) ?? 'tap'); if (this._picMode) say(`Hi ${this.kid.name}! You have ${Math.floor(pts / this._star)} stars.`); }}>
        ${this._drawn ? renderAvatar(look, { size: 186, jump: this._jump, label: `${this.kid.name}’s avatar`, age: this.kid.age }) : html`<span class="avph"></span>`}</button>
      <div style="display:flex;align-items:center;gap:10px;z-index:1"><h1 class="name">${this.kid.name}</h1>${this._picMode ? nothing : html`<span class="rank">${li.rank}</span>`}</div>
      ${this._picMode ? html`
        <div class="stat" style="width:100%;align-items:center;flex-direction:row;gap:12px"><span style="font-size:40px">🫙</span>
          <span style="display:flex;flex-direction:column;gap:2px">${(() => { const n = Math.floor(pts / this._star); return n > 10 ? html`<b style="display:inline-flex;align-items:center;gap:6px;font-size:30px">${starSvg(true, 30)} ${n}</b>` : n ? html`<span class="starjar">${Array.from({ length: n }, () => starSvg(true, 24))}</span>` : starSvg(false, 28); })()}
          <span>${Math.floor(pts / this._star)} stars in my jar</span></span></div>`
      : html`
        <div style="width:100%;display:flex;flex-direction:column;gap:5px"><div class="xp meter"><div style="width:${Math.round((li.into / li.need) * 100)}%"></div></div>
          <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600);text-align:right">${li.need - li.into} more to ${li.nextRank}</span></div>
        <div class="stats">
          <div class="stat"><b>${pts || '✨'}</b><span>${pts ? 'points to spend' : 'Ready to start'}</span></div>
          <div class="stat" role="group" aria-label="Good days: ${goodCount} this week"><span>Good days</span>
            <div class="dots" aria-hidden="true">${Array.from({ length: goodCount }, () => html`<i class="g"></i>`)}</div>
            <span>${goodCount >= 5 ? 'Full week ⭐' : goodCount ? `${goodCount} this week` : 'A fresh week'}</span></div>
        </div>`}
      ${this._wind ? html`<div class="nextup"><span style="font-size:14px;font-weight:var(--w-bold, 700);padding:6px">🌙 Studio opens in the morning</span></div>`
        : nx ? html`<div class="nextup">
        <span class="shimmer" style="border-radius:50%;line-height:0;width:46px;height:46px;flex-shrink:0">${this._drawn ? renderAvatar(applyItem(look, nx.cat, nx.id, nx.swatch), { size: 46, crop: 'head', still: true, age: this.kid.age }) : nothing}</span>
        <span style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0"><span style="font-size:14px;font-weight:var(--w-bold, 700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${goal === nx.id ? '♥ Saving for' : 'Next'}: ${nx.label}</span>
          <div class="xp meter" style="height:7px"><div style="width:${pct}%"></div></div>
          ${this._picMode ? nothing : html`<span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">${nx.req - life} to go</span>`}</span>
      </div>` : html`<div class="nextup"><span style="font-size:14px;font-weight:var(--w-bold, 700);padding:6px">You’ve unlocked the whole collection! New gear drops next term.</span></div>`}
      ${this.kid.special_time && !this._picMode ? html`<span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">💛 Your time: ${this.kid.special_time}</span>` : nothing}
      ${this._wind ? nothing : (() => {
        const left = this._block().todo.length, wait = this.oneAtATime && left > 0;
        // a child who cannot read reaches the helper from his own page: one big picture button, low enough for a four-year-old at the wall
        const askOn = this._picMode && this.ask;
        return html`${wait ? html`<span class="muted" style="font-size:14px;font-weight:var(--w-bold, 700);margin-top:auto">First jobs, then ${this._picMode ? 'my look' : 'studio'}</span>` : nothing}
          <div class="lowrow" style=${wait ? '' : 'margin-top:auto'}>${askOn ? html`<button class="askbtn tap" data-act="ask" aria-label="Ask a question" @click=${() => { this._sound('tap'); this.dispatchEvent(new CustomEvent('ask', { bubbles: true, composed: true })); }}>${icon('ask', 40)}<span>Ask</span></button>` : nothing}
          <button class="pill tap studio" ?data-locked=${wait} aria-label=${wait ? `${this._picMode ? 'My look' : 'Style studio'}: ${left} job${left === 1 ? '' : 's'} to go first` : nothing} style="height:${askOn ? 72 : 52}px;flex:1 1 0;min-width:0;justify-content:center;font-size:16px;flex-shrink:0" @click=${(e: Event) => {
            // the words above the button are a promise, so the button keeps it: jobs first. Nothing pops up; a child who cannot read hears it once.
            // not yet: the padlock gives a small wiggle and, for a child who cannot read, the reason is spoken. Nothing red, no error message.
            if (wait) { this._sound('locked'); const b = e.currentTarget as HTMLElement; b.removeAttribute('data-nudge'); void b.offsetWidth; b.setAttribute('data-nudge', ''); if (this._picMode) say(left === 1 ? 'One more job, then your look.' : `${left} jobs to go.`); return; }
            this._studio = true; this._sound('tap'); }}>${wait ? html`${icon('lock', 20)}${left} job${left === 1 ? '' : 's'} to go` : html`${icon('palette', 20)}${this._picMode ? 'My look' : 'Style studio'}`}</button></div>`;
      })()}
    </section>`;
  }

  private _goodToday(): boolean {
    const r = this._chores.filter((c) => c.lane === 'routine'), j = this._chores.filter((c) => c.lane === 'job');
    const rd = r.filter((c) => c.status === 'completed' && c.slot !== 'bed').length, rAll = r.filter((c) => c.slot !== 'bed').length;
    const jd = j.filter((c) => c.status === 'completed').length;
    return (r.length + j.length) > 0 && rd === rAll && (j.length === 0 || jd >= Math.min(2, j.length));
  }

  /** What is on for this part of the day. */
  private _block() {
    const bt = bedtimeFor(this.kid.bedtime, this._now);
    const slot = daySlot(bt, this._now);
    const list = this._chores;
    const routineNow = list.filter((c) => c.lane === 'routine' && (c.slot === slot || (c.slot === 'any' && !this._wind)));
    const jobs = this._wind ? [] : list.filter((c) => c.lane === 'job' && (c.slot === 'any' || c.slot === slot || (slot === 'after' && c.slot === 'am')));
    const grow = this._wind ? list.filter((c) => c.lane === 'grow' && c.slot === 'bed') : list.filter((c) => c.lane === 'grow' && c.slot !== 'bed' || (c.lane === 'grow' && slot === 'bed'));
    const later = list.filter((c) => c.lane === 'routine' && c.status !== 'completed' && c.slot !== slot && c.slot !== 'any' && ((slot === 'am') || (slot === 'after' && c.slot === 'bed')));
    // picture mode shows the routine only
    const visible = this._picMode ? routineNow : [...routineNow, ...jobs, ...grow];
    const todo = visible.filter((c) => c.status !== 'completed');
    return { bt, slot, routineNow, jobs, grow, later, visible, todo, done: visible.length - todo.length, total: visible.length };
  }

  private _jobs(): TemplateResult {
    const { bt, slot, routineNow, jobs, grow, later, visible, todo, done, total } = this._block();
    // the one thing to do now: the first job that is not ticked yet
    this._nowUid = todo[0]?.uid ?? '';
    const left = total - done;
    const C = 2 * Math.PI * 22, frac = total ? done / total : 0;
    const sub = this._wind ? (left ? `Bedtime jobs: ${left} left · bed at ${t12(bt)}` : 'All set for bed. Sleep well 🌙')
      : left ? `${left} left ${slot === 'am' ? 'this morning' : slot === 'after' ? 'this afternoon' : 'tonight'}` : later.length ? 'All done for now 🎉' : 'All done – fresh start tomorrow';
    const one = this.oneAtATime && !this._showAll;
    const toBed = Math.min(60, hm(bt) - minsNow(this._now));
    return html`<section class="glass jobs" aria-label="Jobs">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="flex:1"><h1 class="t-title">${this._wind ? 'Wind down' : this._picMode ? (slot === 'am' ? 'My morning' : slot === 'bed' ? 'My bedtime' : 'My jobs') : 'Today'}</h1>
          <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">${sub}</span></div>
        ${this.oneAtATime && this._showAll ? html`<button class="pill tap" @click=${() => { this._showAll = false; }}>One at a time</button>` : nothing}

        ${this._wind && toBed > 0 ? html`<span class="bedclock" role="img" aria-label="${toBed} minutes until bed">${lookArt(getLook(), 'timer', { frac: toBed / 60, size: 52 })}<b>${toBed}<span>min</span></b></span>` : nothing}
        <div class="ring" role="img" aria-label="${done} of ${total} done"><svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="var(--track)" stroke-width="6"></circle>
          <circle cx="26" cy="26" r="22" fill="none" stroke="var(--ok)" stroke-width="6" stroke-linecap="round" stroke-dasharray=${C} stroke-dashoffset=${C * (1 - frac)} style="transition:stroke-dashoffset var(--mt-5, 900ms) cubic-bezier(.2,.8,.2,1)"></circle></svg><b>${done}/${total}</b></div>
      </div>
      ${one ? this._focusList(todo, done, later.length) : html`<div class="list scrolly" data-fits @scroll=${scrollCue}>
        ${this._picMode ? html`<div class="pics">${routineNow.map((c) => this._pic(c))}</div>${routineNow.length ? html`<div class="readrow">${this._reader()}</div>` : nothing}`
          : html`
            ${routineNow.length ? html`<div class="sec"><h2>${SLOT_NAME[slot]} routine</h2><span>just what we do</span></div>${routineNow.map((c) => this._row(c))}` : nothing}
            ${jobs.length ? html`<div class="sec"><h2>Family jobs</h2><span>earn points · fill the jar</span></div>${jobs.map((c) => this._row(c))}` : nothing}
            ${grow.length ? html`<div class="sec"><h2>Growing</h2><span>for you – surprises along the way</span></div>${grow.map((c) => this._row(c))}` : nothing}`}
        ${later.length && !this._wind ? html`<div class="later"><span>Later: ${SLOT_NAME[later[0].slot]} (${later.length})</span><span>${later.map((c) => this._picMode ? picFor(c) : '').join(' ')}</span></div>` : nothing}
        ${!visible.length ? html`<div class="wind"><span style="font-size:44px">🌤️</span><span>Nothing right now. Enjoy!</span></div>` : nothing}
      </div>`}
    </section>`;
  }

  /** One job at a time: Now, Next, and the rest tucked away. */
  private _focusList(todo: ParsedChore[], done: number, laterToday: number): TemplateResult {
    const [now, next, ...rest] = todo;
    // a child who cannot read gets a picture, not an empty card: his own character celebrating, and one big button to look back
    if (!now && this._picMode && done && !this._wind) return html`<div class="focus"><div class="allset">
      <div class="party"><svg class="burstart" viewBox="0 0 340 276" aria-hidden="true">${[[40, 60, 30, '#f5b301'], [300, 50, 26, '#ef476f'], [20, 170, 22, '#06d6a0'], [318, 180, 28, '#f5b301'], [80, 240, 18, '#118ab2'], [262, 244, 20, '#ef476f'], [170, 14, 20, '#06d6a0']].map(([x, y, s, c]) => svg`<path transform="translate(${x} ${y}) scale(${(s as number) / 24}) translate(-12 -12)" d="M12 2.800l2.850 5.900 6.450.900-4.700 4.550 1.150 6.450L12 17.500l-5.750 3.100 1.150-6.450L2.700 9.600l6.450-.900z" fill=${c} stroke="rgba(0,0,0,.25)" stroke-width="1"></path>`)}</svg>
        ${this._drawn ? renderAvatar(this._look, { size: 180, jump: this._jump, label: `${this.kid.name} celebrating: all done`, age: this.kid.age }) : html`<span class="avph"></span>`}</div>
      <h2 class="t-head">All done!</h2>
      <button class="seedone tap" @click=${() => { this._showAll = true; this._sound('tap'); say('Here is everything you did.'); }}>${listSvg}<span>See what I did</span></button></div></div>`;
    if (!now) return html`<div class="focus"><div class="allset"><span class="big-e">${this._wind ? '🌙' : '🎉'}</span>
      <h2 class="t-head">${this._wind ? 'All set for bed' : done ? 'All done!' : 'Nothing right now'}</h2>
      <span class="muted" style="font-size:16px;font-weight:var(--w-semi, 600)">${this._wind ? 'Sleep well.' : done ? (laterToday ? 'More later. Enjoy your free time!' : 'Great work today.') : 'Enjoy!'}</span>
      ${done ? html`<button class="pill tap" @click=${() => { this._showAll = true; }}>See what I did</button>` : nothing}</div></div>`;
    const more = rest.length;
    return html`<div class="focus">
      <span class="label">Now</span>
      ${this._picMode ? html`<div class="picwrap">${this._pic(now, 'big')}${this._reader()}</div>` : this._row(now, true)}
      ${next ? html`<span class="label">Next</span>${this._picMode ? this._pic(next, 'small') : this._row(next, false, true)}` : nothing}
      <span style="flex:1"></span>
      ${more || done ? html`<button class="later tap" @click=${() => { this._showAll = true; this._sound('tap'); }}>
        <span>${more ? `Later: ${more} more` : 'That’s the last one!'}${done ? ` · ${done} done ✓` : ''}</span><span>Show all</span></button>` : nothing}
    </div>`;
  }

  private _row(c: ParsedChore, big = false, soon = false): TemplateResult {
    const d = c.status === 'completed', p = this._practice?.uid === c.uid ? this._practice : null;
    const left = p ? Math.max(0, p.end - this._now.getTime()) : 0;
    return html`<div class="job row ${d ? 'done' : ''} ${c.uid === this._nowUid ? 'now' : ''} ${big ? 'big' : ''} ${soon ? 'soonjob' : ''}" data-uid=${c.uid} style="padding-right:10px" @pointerdown=${this._press} @click=${() => this._toggle(c)}>
      <button class="tap hit" aria-pressed=${String(d)}>
        <span class="box check">${d ? tickSvg(big ? 26 : 18) : nothing}</span>
        ${this.kid.mode === 'mixed' ? html`<span style="font-size:${big ? 40 : 28}px" aria-hidden="true">${picFor(c)}</span>` : nothing}
        <span class="t content">${c.summary}</span></button>
      ${(c.lane === 'grow' || c.song) && c.minutes && !d ? (p ? html`<button class="play tap going" aria-label="Stop the timer, ${Math.max(1, Math.round(left / 60000))} minutes left" @click=${(e: Event) => { e.stopPropagation(); this._stopPractice(); }}>${lookArt(getLook(), 'timer', { frac: left / (p.mins * 60_000), size: big ? 56 : 36 })}<span>${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}</span></button>`
        : html`<button class="play tap" aria-label="Start ${c.minutes} minute timer" @pointerdown=${(e: Event) => e.stopPropagation()} @click=${(e: Event) => { e.stopPropagation(); this._startPractice(c); }}>▶ ${c.minutes} min</button>`) : nothing}
      ${c.lane === 'job' ? html`<span class="plus">+${c.pts}</span>` : c.lane === 'grow' && (d || !c.minutes) ? html`<span class="plus grow">🌱</span>` : nothing}
    </div>`;
  }

  private _pic(c: ParsedChore, size: '' | 'big' | 'small' = ''): TemplateResult {
    const d = c.status === 'completed', stars = Math.max(1, Math.round(c.pts / this._star));
    return html`<button class="pic tap ${d ? 'done' : ''} ${c.uid === this._nowUid ? 'now' : ''} ${size}" data-uid=${c.uid} aria-pressed=${String(d)} @pointerdown=${this._press} @click=${() => this._toggle(c)}>
      <span class="e" aria-hidden="true">${picFor(c)}</span><span class="pt">${c.summary}</span>
      ${c.pts && size !== 'small' ? html`<span class="stars" role="img" aria-label="${stars} star${stars === 1 ? '' : 's'}">${Array.from({ length: stars }, () => starSvg(true, size === 'big' ? 26 : 20))}</span>` : nothing}${d ? html`<span class="tick">${tickSvg(22)}</span>` : nothing}</button>`;
  }
  /** "Read my jobs", for a child who cannot: 72 px, in the lower corner of the job he is looking at. */
  private _reader(): TemplateResult {
    return html`<button class="readme tap" aria-label="Read my jobs" @click=${(e: Event) => { const by = e.currentTarget as Element, left = this._block().routineNow.filter((c) => c.status !== 'completed').map((c) => c.summary); this._sound('tap'); say(left.length ? left.join('. Then, ') + '.' : 'All done! Great job!', by); }}>${speakerSvg(36)}</button>`;
  }

  private _rewards(): TemplateResult {
    const have = num(this.hass, this._e.points), list = this.kid.rewards ?? DEFAULT_REWARDS, st = this._star;
    return html`${this._owed.length ? html`<div class="owedline" role="status"><span aria-hidden="true">⏳</span><span>Waiting for a grown-up: ${this._owed.join(', ')}</span></div>` : nothing}${list.map((r, i) => {
        const ok = have >= r.cost, pic = r.icon ?? (this._picMode ? REWARD_PICS[i % REWARD_PICS.length] : '🎁'), words = this._costWords(r);
        const total = Math.max(1, Math.round(r.cost / st)), got = Math.min(total, Math.floor(have / st));
        const saving = this._saving === r.name, held = this._held === r.name || saving;
        if ((this._spend === r.name && ok) || held) return html`<div class="rw ask ${this._picMode ? 'picrow' : ''}" role="group" aria-label="Spend ${words} on ${r.name}?" ?data-held=${held} aria-busy=${saving ? 'true' : nothing}>
          <span class="rpic" aria-hidden="true">${pic}</span><span class="q">Spend ${words}?<br><span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600)">${r.name}</span></span>
          <button class="tap" ?disabled=${held} @click=${() => { this._held = r.name; this._heldAt = Date.now(); window.setTimeout(() => { if (this._held === r.name) this._held = ''; }, 600); void this._redeem(r); }}>${saving ? 'Saving…' : html`${tickSvg(18)}Yes`}</button><button class="tap save" ?disabled=${held} @click=${() => { this._spend = ''; this._sound('tap'); }}>${crossSvg}Not now</button></div>`;
        // for a child who cannot read: a different picture on every row, and the cost as stars: filled for the ones already saved, empty for the ones still to earn
        return html`<button class="rw tap ${this._picMode ? 'picrow' : ''}" aria-label="${r.name}: ${ok ? `spend ${words}` : this._picMode ? `${got} of ${total} stars saved` : `${r.cost - have} points to go`}" @click=${() => this._rewardTap(r)}>
          <span class="rpic" aria-hidden="true">${pic}</span>
          <span class="n">${r.name}${this._picMode ? html`<span class="stars" style="justify-content:flex-start" aria-hidden="true">${total > 12 ? html`${starSvg(ok, 20)}<b style="font-size:15px;line-height:20px;margin-left:4px">${got} / ${total}</b>` : Array.from({ length: total }, (_, k) => starSvg(k < got, 18))}</span>` : nothing}</span>
          ${this._picMode ? nothing : html`<span class="cost ${ok ? '' : 'notyet'}">${ok ? `Spend ${r.cost}` : `${r.cost - have} to go`}</span>`}</button>`;
      })}`;
  }

  private _tabs(): TemplateResult {
    const wait = this.oneAtATime && !this._tabPicked && this._block().todo.length > 0;
    const t = wait ? 'week' : this._tab, tab = (id: 'rewards' | 'week', label: string) => html`<button class="tab tap" aria-pressed=${String(t === id)} @click=${() => { this._tab = id; this._tabPicked = true; this._sound('tap'); if (this._picMode) say(label); }}>${label}</button>`;
    return html`<section class="glass card tabcard" aria-label=${t === 'rewards' ? 'Rewards' : 'Week'}>
      <div class="tabs">${tab('rewards', this._picMode ? '⭐ My stars' : '🎁 Rewards')}${tab('week', this._picMode ? '📅 Coming up' : '📅 My week')}</div>
      ${t === 'rewards' ? this._rewards() : this._weekBody()}</section>`;
  }

  private _windCard(): TemplateResult {
    return html`<section class="glass card"><span class="label">Rewards</span><span style="font-size:15px;font-weight:var(--w-semi, 600)">The shop opens again in the morning 🌙</span>
      <span class="muted" style="font-size:14px">Bedtime ${t12(bedtimeFor(this.kid.bedtime, this._now))}</span></section>`;
  }

  private _jar(): TemplateResult {
    const n = num(this.hass, 'input_number.family_jar'), t = this.jarTarget || 120, f = Math.min(1, n / t);
    if (!this.hass?.states['input_number.family_jar']) return html``;
    return html`<section class="glass card" aria-label="Family jar"><div class="jar">
      <svg width="34" height="42" viewBox="0 0 48 60" aria-hidden="true"><rect x="8" y="2" width="32" height="7" rx="3" fill="var(--ink3)"></rect>
        <path d="M6 12 H42 V52 a6 6 0 0 1 -6 6 H12 a6 6 0 0 1 -6 -6 Z" fill="var(--chip-strong)" stroke="var(--ink3)" stroke-width="2"></path>
        <clipPath id="jc"><path d="M8 14 H40 V52 a4 4 0 0 1 -4 4 H12 a4 4 0 0 1 -4 -4 Z"></path></clipPath>
        <rect clip-path="url(#jc)" x="6" y=${58 - 44 * f} width="36" height=${44 * f} fill="var(--accent)" style="transition:y var(--mt-5, 900ms) var(--e-out, ease), height var(--mt-5, 900ms) var(--e-out, ease)"></rect></svg>
      <span style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="label">Family jar</span>
        <span style="font-size:15px;font-weight:var(--w-bold, 700)">${n >= t ? 'Full! Time for ' + this.jarReward : `${t - n} marbles to ${this.jarReward}`}</span>
      </span></div></section>`;
  }

  private _feelCard(): TemplateResult {
    const faces = this._picMode ? FEELINGS_3 : FEELINGS, kind = this._feel ? FEEL_KIND(this._feel) : 'mid';
    const big = this._picMode ? 'height:56px;font-size:18px' : '';
    const ask = FEEL_ASK[kind];
    return html`<section class="glass card feelcard" aria-label="How are you feeling">
      ${this._feel ? html`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span style="font-size:15px;font-weight:var(--w-semi, 600)">${ask}</span>
            ${this._picMode ? html`<button class="round tap" style="font-size:20px;flex-shrink:0" aria-label="Read the question" @click=${(e: Event) => say(ask, e.currentTarget as Element)}>🔊</button>` : nothing}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${kind === 'up'
          ? html`<button class="pill tap" style=${big} @click=${() => this._feelReply('share')}>💬 Leave a note</button><button class="pill tap" style=${big} @click=${() => this._feelReply('ok')}>👍 All good</button>`
          : html`<button class="pill tap" style=${big} @click=${() => this._feelReply('hug')}>🤗 Hug</button><button class="pill tap" style=${big} @click=${() => this._feelReply('chat')}>💬 Chat later</button><button class="pill tap" style=${big} @click=${() => this._feelReply('ok')}>I’m OK</button>`}</div>`
        : html`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span class="label">How are you feeling?</span>
            ${this._picMode ? html`<button class="round tap" style="font-size:20px" aria-label="Read the question" @click=${(e: Event) => say('How are you feeling?', e.currentTarget as Element)}>🔊</button>` : nothing}</div>
          <div class="feel ${this._picMode ? 'three' : ''}">${faces.map(([e, w]) => html`<button class="tap" aria-label=${w} @click=${() => this._feelPick(w)}>${e}</button>`)}</div>`}
    </section>`;
  }

  /** Worries often come up at bedtime: a quiet way to ask for a grown-up during wind-down. */
  private _windChat(): TemplateResult {
    return html`<section class="glass card" aria-label="Ask for a grown-up"><span style="font-size:15px;font-weight:var(--w-semi, 600)">Something on your mind?</span>
      <button class="pill tap" style="height:52px;justify-content:center;font-size:16px" @click=${() => { this._feel = ''; this._feelReply('chat'); }}>💬 Ask for a chat</button></section>`;
  }

  private _weekBody(): TemplateResult {
    const today = new Date(), evs = this._events.filter((e) => e.allDay ? e.start >= startOfDay(today) : e.start.getTime() > today.getTime() - 3_600_000).slice(0, 5);
    const label = (d: Date): string => {
      if (sameDay(d, today)) return 'Today';
      const n = Math.round((startOfDay(d).getTime() - startOfDay(today).getTime()) / 86_400_000);
      if (this._picMode) return `${n} sleep${n > 1 ? 's' : ''}`;
      return n === 1 ? 'Tomorrow' : fmtDow(d);
    };
    return html`${this._wind ? html`<span class="label">${this._picMode ? 'Coming up' : `${this.kid.name}’s week`}</span>` : nothing}
      ${evs.length ? evs.map((e, i) => html`<div class="wk"><span class="d">${i && label(evs[i - 1].start) === label(e.start) ? '' : label(e.start)}</span>
        <span style="flex:1;font-weight:var(--w-semi, 600);display:flex;gap:6px;align-items:baseline"><span class="init sm" style="--c:${e.family ? 'var(--p-family)' : 'var(--kid)'};align-self:center" role="img" aria-label=${e.family ? 'Family' : this.kid.name}>${e.family ? 'F' : this.kid.name[0]}</span>
          <span>${e.title}${e.allDay ? '' : html` <span class="muted" style="font-weight:500">· ${fmtTime(e.start)}</span>`}</span></span></div>`)
        : html`<span class="muted" style="font-size:15px">Nothing on this week.</span>`}`;
  }

  private _celebration(): TemplateResult {
    const items = this._celebrate!, look = this._look;
    return html`<div class="celebrate" @click=${(e: Event) => { if (e.target === e.currentTarget) this._closeCelebrate(false); }}>
      <div class="glass cbox" role="dialog" aria-label="New unlocks">
        <span class="rank" style="font-size:14px">${items.some((u) => GROW_IDS.has(u.id)) ? 'SURPRISE!' : `NEW UNLOCK${items.length > 1 ? 'S' : ''}`}</span>
        <h1 class="t-hero" style="text-align:center">${this.kid.name}, you unlocked ${items.length > 1 ? `${items.length} things` : items[0].label}!</h1>
        <div class="unl">${items.slice(0, 8).map((u, i) => html`<div style="animation-delay:${0.15 + i * 0.12}s">
          ${renderAvatar(applyItem(look, u.cat, u.id, u.swatch), { size: 96, crop: u.cat.crop, still: true, age: this.kid.age })}${u.label}</div>`)}</div>
        <div style="display:flex;gap:12px"><button class="pill tap" style="height:52px;padding:0 20px" @click=${() => this._closeCelebrate(false)}>Later</button>
          ${this._wind ? nothing : html`<button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" @click=${() => this._closeCelebrate(true)}>${icon('star', 18)}Try it on</button>`}</div>
      </div>
    </div>`;
  }
}
import { GROW_UNLOCKS } from './avatar';
const GROW_IDS = new Set(GROW_UNLOCKS.map((u) => u.id));
if (!customElements.get('fh-kid')) customElements.define('fh-kid', FhKid);
