import { LitElement, html, css, nothing, svg, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LOOKS, LOOK_KEY, LookController } from './looks';
import { THEMES } from './themes';
import { icon } from './icons';
import { keyboard, keysCss, typeKey } from './keys';
import { kidEntities, slotVar, type ColourSlot, type Hass, type KidConfig, type MedConfig, type MomentConfig, type RewardConfig } from './types';
import { getShape, inTime, sfx, SlowError, SLOW_SAY, type Chore } from './util';
import { isPin, isTime } from './validate';
import { checkAccess, choreForm, choreItem, clone, dashPath, draftErrors, getNote, history, medId, onePic, paneWanted, pinMark, resumeSoon, same, saveCard, setNote, StaleError, wantPane,
  type Access, type Blocked, type Cfg, type ChoreForm, type Version } from './settings-store';

/* ------------------------------------------------------------------ *
 * Settings: the grown-ups' page behind the cog on the house-info sheet.
 * A list of sections on the left (a row of tabs on a phone), one pane on the
 * right, and one Save per pane. What it edits is the card's own configuration,
 * saved back into the dashboard that hosts the card (settings-store.ts); job
 * lists are Home Assistant to-do lists and are changed there straight away.
 * Children are edited one at a time and never shown side by side.
 * ------------------------------------------------------------------ */

type PaneId = 'children' | 'rewards' | 'morning' | 'medicines' | 'pin' | 'house' | 'music' | 'people' | 'advanced';
const PANES: { id: PaneId; name: string; sub: string; ic: string }[] = [
  { id: 'children', name: 'Children', sub: 'Bedtimes, jobs and how each page looks', ic: 'kid' },
  { id: 'rewards', name: 'Rewards', sub: 'What points can be spent on', ic: 'star' },
  { id: 'morning', name: 'Morning', sub: 'Leaving times, school days and the routine', ic: 'sun' },
  { id: 'medicines', name: 'Medicines', sub: 'Names and times on the medication sheet', ic: 'pill' },
  { id: 'pin', name: 'PIN', sub: 'The parent PIN and what it guards', ic: 'lock' },
  { id: 'house', name: 'House', sub: 'Night screen, bins, lights, look and sounds', ic: 'home' },
  { id: 'music', name: 'Music', sub: 'Moments, the sleep timer and calls', ic: 'music' },
  { id: 'people', name: 'People and safety', sub: 'Parents, the babysitter page and alerts', ic: 'info' },
  { id: 'advanced', name: 'Advanced', sub: 'What is wired up, and earlier versions', ic: 'cog' }
];
const KID_IC = svg`<path d="M12 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 20c.5-4 3.300-6 7-6s6.5 2 7 6"></path>`;
const paneIcon = (ic: string, size = 22): TemplateResult => ic === 'kid' ? html`<svg class="i" aria-hidden="true" viewBox="0 0 24 24" style="--s:${size}px">${KID_IC}</svg>` : icon(ic, size);
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], WEEK = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri']] as const;
const BIN_COL: Record<string, string> = { green: '#2e9e4f', yellow: '#f2c230', red: '#d93a3a', blue: '#2f7fd6', purple: '#8b5cf6' };
const ROW = 44, HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const pad = (n: number): string => String(n).padStart(2, '0');
/** "19:30" as a family says it: 7:30 pm. */
const t12 = (t: string | undefined): string => { if (!isTime(t)) return t ? String(t) : 'Not set'; const [h, m] = String(t).split(':').map(Number); return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`; };
const when = (iso: string): string => { const d = new Date(iso), n = new Date(), day = d.toDateString() === n.toDateString() ? 'Today' : d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }); return `${day}, ${d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).toLowerCase()}`; };
const cut = (s: string, n = 80): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
/** The parts of the card configuration that are wiring: shown in Advanced, changed in YAML. */
const WIRING: [string, string][] = [['weather', 'Weather'], ['weather_page', 'Weather page'], ['calendars', 'Calendars'], ['add_calendar', 'Calendar for new events'], ['people', 'People and who is home'], ['reminders', 'Reminders list'], ['groceries', 'Shopping list'],
  ['grocery_recipients', 'Who the shopping list is sent to'], ['music_player', 'Main speaker'], ['music_players', 'Speakers'], ['music_map', 'Music house map'], ['music_hide', 'Speakers left out'], ['music_lock', 'Only speakers on the map'], ['radio', 'Radio stations'],
  ['radio_source', 'Radio source'], ['announce_script', 'Dinner announcement script'], ['med_log', 'Record of other medicines'], ['photos', 'Photo frame'], ['photo_minutes', 'Minutes per photo'], ['idle_seconds', 'Seconds until the panel goes home'],
  ['chat', 'Ask: helper and voice'], ['jar', 'Family jar'], ['bring_rules', 'What to bring, by calendar'], ['home_hide', 'Hidden on the Home page'], ['call_language', 'Call language'], ['call_voice', 'Call voice'], ['scale', 'Screen scale']];
const BLOCKED: Record<Blocked, [string, string]> = {
  admin: ['You can look, but not change anything here', 'Changing settings needs a Home Assistant administrator. This screen is signed in as someone who is not one. Open the panel on a phone or computer signed in as an administrator, or change the card in the dashboard editor.'],
  yaml: ['This dashboard is kept in a YAML file', 'Home Assistant will not let a card save into a YAML dashboard, so these settings can only be read here. Change them in the YAML file, under the Family Hub card.'],
  nocard: ['This card could not be found in the dashboard', 'Settings saves into the dashboard that shows the card, and no Family Hub card was found there (a dashboard that builds itself, or a card kept somewhere else). Change the card where it is written.'],
  many: ['There is more than one Family Hub card here', 'This dashboard has several Family Hub cards and Settings cannot tell which one this is. Change the card in the dashboard editor.'],
  offline: ['Home Assistant did not answer', 'The dashboard could not be read, so nothing can be saved for now. Close Settings and try again in a moment.']
};

interface TimeAsk { title: string; get: () => string; set: (v: string) => void }
interface Field { get: () => string; set: (v: string) => void; digits?: boolean }
interface JobEdit { entity: string; uid: string | null; form: ChoreForm; was?: ChoreForm }

export class FhSettings extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, keysCss, css`
    :host { position: absolute; inset: 0; z-index: 30; display: flex; align-items: stretch; justify-content: center; padding: 16px; background: var(--scrim, rgba(6,16,28,.52)); animation: scrimin var(--m-2, 160ms) var(--e-out, ease) backwards; }
    :host([data-closing]) { animation: fhout var(--m-2, 160ms) var(--e-in, ease-in) forwards; pointer-events: none; }
    :host([data-phone]) { position: fixed; padding: 8px 6px calc(8px + env(safe-area-inset-bottom, 0px)); }
    .sheet.sbox, :host([data-phone]) .sheet.sbox { width: min(1240px, 100%); height: 100%; max-height: none; padding: 0; gap: 0; overflow: visible; display: grid; grid-template-columns: 264px minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto; }
    .shd { grid-column: 1 / -1; display: flex; align-items: center; gap: 14px; padding: 16px 18px 12px 24px; }
    .shd h2 { display: flex; align-items: center; gap: 10px; }
    .shd .muted { font-size: 15px; font-weight: var(--w-semi, 600); }
    .shd .xbtn { margin-left: auto; width: 52px; height: 52px; flex-shrink: 0; }
    /* the list of sections */
    .snav { display: flex; flex-direction: column; gap: 4px; padding: 4px 12px 16px 16px; overflow-y: auto; scrollbar-width: none; min-height: 0; }
    .snav::-webkit-scrollbar { display: none; }
    .snav button { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 6px 12px; border-radius: 16px; text-align: left; font-size: 16px; font-weight: var(--w-semi, 600); color: var(--ink); }
    .snav button > span { flex: 1; min-width: 0; }
    .snav button[aria-current='page'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .snav button[aria-disabled='true'] { opacity: .5; }
    .snav .sdot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); flex-shrink: 0; animation: spop var(--m-3, 240ms) var(--e-spring, ease) backwards; }
    @keyframes spop { from { transform: scale(calc(1 - var(--m-d, 1))); opacity: 0; } }
    /* the pane */
    .spane { min-width: 0; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 4px 24px 20px 12px; display: flex; flex-direction: column; gap: 14px; border: 0; margin: 0; animation: pgfade var(--m-2, 160ms) var(--e-out, ease) backwards, pgmove var(--m-3, 240ms) var(--e-out, ease) backwards; }
    .spane > * { flex-shrink: 0; }
    .spane:focus { outline: none; }
    .sintro { font-size: 15px; font-weight: var(--w-semi, 600); color: var(--ink2); line-height: 1.4; max-width: 70ch; }
    .scard { border-radius: 20px; background: var(--chip-soft, rgba(255,255,255,.3)); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    .scard > h3 { margin: 0; font-size: 17px; font-weight: var(--w-heavy, 800); display: flex; align-items: center; gap: 8px; }
    .scard > h3 > span.muted { font-size: 14px; font-weight: var(--w-semi, 600); }
    .shint { font-size: 14px; font-weight: 500; color: var(--ink2); line-height: 1.35; }
    .srow { display: flex; align-items: center; justify-content: space-between; gap: 12px 20px; min-height: 52px; flex-wrap: wrap; }
    .srow > .slabel { flex: 1 1 220px; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; font-size: 16px; font-weight: var(--w-bold, 700); }
    .srow > .slabel > span { font-size: 14px; font-weight: 500; color: var(--ink2); }
    .srow > .sctl { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; min-width: 0; max-width: 100%; }
    .srow.wide > .sctl { flex: 1 1 320px; justify-content: stretch; }
    .srow.wide > .sctl > .sin { flex: 1; }
    .srow + .srow, .sitem + .sitem { border-top: 1px solid color-mix(in srgb, var(--ink2) 18%, transparent); padding-top: 10px; }
    /* text boxes */
    .sin { height: 48px; min-width: 0; width: 240px; max-width: 100%; border-radius: 14px; border: 0; padding: 0 14px; font: inherit; font-size: 17px; font-weight: var(--w-semi, 600); color: var(--ink); background: var(--chip-strong); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--ink2) 35%, transparent); text-overflow: ellipsis; }
    .sin.on { box-shadow: inset 0 0 0 3px var(--primary); }
    .sin.short { width: 96px; text-align: center; } .sin.pic { width: 60px; text-align: center; padding: 0 4px; font-size: 22px; } .sin.long { width: 100%; }
    .sin[type='date'] { width: 176px; }
    .sin[aria-invalid='true'] { box-shadow: inset 0 0 0 3px var(--danger, #c62828); }
    /* chips that choose, the time button, steppers, switches */
    .schips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .schips > button, .stime { min-height: 44px; padding: 0 14px; border-radius: 999px; background: var(--chip-strong); box-shadow: inset 0 0 0 1.5px var(--ink3); font-size: 15px; font-weight: var(--w-semi, 600); display: inline-flex; align-items: center; gap: 8px; }
    .schips > button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring), inset 0 0 0 2.5px var(--primary); font-weight: var(--w-heavy, 800); }
    .schips > button .sw6 { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 1.5px rgba(0,0,0,.25); }
    .stime { font-size: 17px; font-weight: var(--w-bold, 700); font-variant-numeric: tabular-nums; min-width: 116px; justify-content: center; }
    .sstep { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; background: var(--chip-strong); box-shadow: inset 0 0 0 1.5px var(--ink3); padding: 2px; }
    .sstep button { width: 44px; height: 44px; border-radius: 50%; font-size: 24px; font-weight: var(--w-bold, 700); line-height: 1; display: inline-flex; align-items: center; justify-content: center; }
    .sstep output { min-width: 64px; text-align: center; font-size: 17px; font-weight: var(--w-bold, 700); font-variant-numeric: tabular-nums; white-space: nowrap; padding: 0 2px; }
    .sswitch { min-width: 56px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
    .sswitch > i { width: 50px; height: 30px; border-radius: 15px; background: var(--track); box-shadow: inset 0 0 0 1.5px var(--ink3); position: relative; flex-shrink: 0; transition: background-color var(--m-2, 160ms); }
    .sswitch > i::after { content: ''; position: absolute; top: 4px; left: 4px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.25); transition: transform var(--mt-2, 160ms) var(--e-spring, ease); }
    .sswitch[aria-checked='true'] > i { background: var(--ok); box-shadow: none; }
    .sswitch[aria-checked='true'] > i::after { transform: translateX(20px); }
    .srange { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; }
    .srange input { width: 220px; max-width: 46vw; height: 44px; margin: 0; accent-color: var(--primary); background: transparent; }
    .srange output { min-width: 52px; text-align: right; font-size: 17px; font-weight: var(--w-bold, 700); font-variant-numeric: tabular-nums; }
    /* lists that are edited a row at a time */
    .sitem { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 52px; }
    .sitem > .sgrow { flex: 1 1 180px; min-width: 0; }
    .sitem > .sin.sgrow { width: auto; }
    .sitem .sname { font-size: 16px; font-weight: var(--w-bold, 700); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sico { width: 44px; height: 44px; border-radius: 50%; background: var(--chip-strong); box-shadow: inset 0 0 0 1.5px var(--ink3); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px; line-height: 1; }
    .sico.bad { color: var(--danger, #c62828); }
    .stag { display: inline-flex; align-items: center; height: 28px; padding: 0 10px; border-radius: 999px; background: var(--chip-strong); font-size: 14px; font-weight: var(--w-bold, 700); white-space: nowrap; }
    .sjob { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 52px; padding: 4px 6px 4px 10px; border-radius: 14px; background: var(--chip); text-align: left; }
    .sjob .spic { width: 32px; text-align: center; font-size: 22px; line-height: 1; flex-shrink: 0; }
    .sjobs { display: flex; flex-direction: column; gap: 6px; }
    .sjobs > .label { margin-top: 6px; }
    .sform { border-radius: 18px; padding: 12px 14px; background: var(--chip-strong); box-shadow: inset 0 0 0 2.5px var(--primary); display: flex; flex-direction: column; gap: 8px; animation: fadeIn var(--m-3, 240ms) var(--e-out, ease); }
    .sform .srow { min-height: 48px; }
    .sbtns { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: flex-end; }
    .pill.danger { color: var(--danger, #c62828); }
    .snote { border-radius: 16px; padding: 12px 14px; background: color-mix(in srgb, var(--accent) 16%, var(--chip-strong)); color: var(--ink); font-size: 15px; font-weight: var(--w-semi, 600); line-height: 1.4; display: flex; flex-direction: column; gap: 8px; }
    .snote b { font-weight: var(--w-heavy, 800); }
    .snote code, .sadv code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 14px; overflow-wrap: anywhere; }
    .snote.ro { background: color-mix(in srgb, var(--ink2) 14%, var(--chip-strong)); }
    .spick { max-height: 232px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 6px; padding: 3px; margin: -3px; }
    .spick button { min-height: 48px; padding: 4px 12px; border-radius: 14px; background: var(--chip); text-align: left; display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: var(--w-semi, 600); min-width: 0; }
    .spick button > span { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; overflow: hidden; }
    .spick button small { font-size: 13px; font-weight: 500; color: var(--ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .spick button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: inset 0 0 0 2.5px var(--primary); font-weight: var(--w-heavy, 800); }
    .sbox2 { width: 22px; height: 22px; border-radius: 7px; box-shadow: inset 0 0 0 2px var(--ink2); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    [aria-pressed='true'] > .sbox2 { background: var(--primary); color: var(--on-primary); box-shadow: none; }
    .sadv { display: grid; grid-template-columns: minmax(150px, 240px) minmax(0, 1fr); gap: 6px 16px; font-size: 15px; }
    .sadv > b { font-weight: var(--w-bold, 700); } .sadv > span { color: var(--ink2); font-weight: 500; overflow-wrap: anywhere; }
    /* the foot: where the pane stands, and its one Save */
    .sft { grid-column: 2; display: flex; align-items: center; gap: 12px; padding: 12px 24px 16px 12px; border-top: 1px solid color-mix(in srgb, var(--ink2) 20%, transparent); min-height: 82px; }
    .sft .sstate { flex: 1; min-width: 0; font-size: 15px; font-weight: var(--w-semi, 600); line-height: 1.3; display: flex; align-items: center; gap: 10px; }
    .sft .sstate.bad { color: var(--danger, #c62828); font-weight: var(--w-bold, 700); }
    .sft .lead { min-width: 132px; }
    .sft .lead[disabled] { background: var(--chip-strong); color: var(--ink2); opacity: 1; box-shadow: inset 0 0 0 1.5px var(--ink3) !important; }
    .sft .sdot { width: 12px; height: 12px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
    /* the keyboard sits under the pane on a touch panel */
    .skeys { grid-column: 1 / -1; padding: 10px 16px 14px; border-top: 1px solid color-mix(in srgb, var(--ink2) 20%, transparent); display: flex; gap: 10px; align-items: flex-end; justify-content: center; animation: fadeIn var(--m-3, 240ms) var(--e-out, ease); }
    .skeys .keys { flex: 1; max-width: 900px; }
    .skeys .keys .key { flex: 1 1 0; width: auto; min-width: 0; height: 48px; }
    .skeys .keys .key.wide { flex: 1.5 1 0; } .skeys .keys .key.space { flex: 0 1 62%; }
    .skeys .sdig { display: grid; grid-template-columns: repeat(3, 72px); gap: 8px; }
    .skeys .sdig .key { width: 72px; height: 52px; }
    /* the time dial: the same two drums as the add-event sheet */
    .sveil { position: absolute; inset: 0; z-index: 5; border-radius: inherit; background: rgba(0,0,0,.28); animation: scrimin var(--m-2, 160ms) var(--e-out, ease) backwards; }
    .sdial { position: absolute; z-index: 6; left: 50%; top: 50%; translate: -50% -50%; width: 340px; max-width: 94%; border-radius: 26px; padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 14px; align-items: center; background: var(--sheet-bg, var(--chip-strong)); color: var(--ink); box-shadow: 0 20px 50px rgba(0,0,0,.35); -webkit-backdrop-filter: blur(22px); backdrop-filter: blur(22px); animation: sheet var(--m-3, 240ms) var(--e-spring, ease) backwards; }
    .sdial h3 { margin: 0; font-size: 17px; font-weight: var(--w-heavy, 800); align-self: flex-start; }
    .sdial .sdrow { display: flex; align-items: center; gap: 12px; }
    .drums { position: relative; display: flex; align-items: center; gap: 2px; height: ${ROW * 3}px; border-radius: 16px; background: var(--chip-strong); padding: 0 8px; box-shadow: inset 0 2px 8px rgba(0,0,0,.14), inset 0 0 0 1.5px var(--ink3); }
    .drums::before { content: ''; position: absolute; left: 6px; right: 6px; top: ${ROW}px; height: ${ROW}px; border-radius: 10px; background: color-mix(in srgb, var(--primary) 16%, transparent); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 55%, transparent); pointer-events: none; }
    .drum { position: relative; width: 64px; height: 100%; overflow-y: scroll; scroll-snap-type: y mandatory; scrollbar-width: none; overscroll-behavior: contain; touch-action: pan-y; -webkit-mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent); mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent); outline: none; }
    .drum::-webkit-scrollbar { display: none; }
    .drum:focus-visible { box-shadow: inset 0 0 0 3px var(--primary); border-radius: 10px; outline: none; }
    .drum i { display: flex; align-items: center; justify-content: center; height: ${ROW}px; scroll-snap-align: center; font-style: normal; font-size: 30px; font-weight: var(--w-heavy, 800); font-variant-numeric: tabular-nums; color: var(--ink2); }
    .drum i[data-on] { color: var(--ink); }
    .drum::before, .drum::after { content: ''; display: block; height: ${ROW}px; }
    .scolon { font-size: 30px; font-weight: 800; padding-bottom: 4px; }
    .sampm { display: flex; flex-direction: column; gap: 6px; }
    .sampm button { width: 64px; height: 48px; border-radius: 12px; background: var(--chip-strong); box-shadow: inset 0 0 0 1.5px var(--ink3); font-size: 16px; font-weight: var(--w-bold, 700); }
    .sampm button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: inset 0 0 0 2.5px var(--primary); font-weight: var(--w-heavy, 800); }
    .sdial .lead { align-self: stretch; }
    .toast.toast { z-index: 8; bottom: 96px; }
    /* a narrower tablet: a slimmer list */
    :host([data-n2]) .sheet.sbox { grid-template-columns: 216px minmax(0, 1fr); }
    :host([data-n2]) .snav button { padding: 6px 10px; gap: 10px; font-size: 15px; }
    /* a portrait tablet and a phone: the sections become a row of tabs across the top */
    :host([data-shape='tall']) .sheet.sbox, :host([data-phone]) .sheet.sbox { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto minmax(0, 1fr) auto; }
    :host([data-shape='tall']) .snav, :host([data-phone]) .snav { flex-direction: row; overflow-x: auto; overflow-y: hidden; padding: 4px 12px 10px; gap: 6px; scroll-snap-type: x proximity; }
    :host([data-shape='tall']) .snav button, :host([data-phone]) .snav button { flex: 0 0 auto; min-height: 48px; padding: 0 14px; border-radius: 999px; background: var(--chip); scroll-snap-align: center; white-space: nowrap; gap: 8px; }
    :host([data-shape='tall']) .spane, :host([data-phone]) .spane { padding: 4px 14px 16px; }
    :host([data-shape='tall']) .sft, :host([data-phone]) .sft { grid-column: 1; padding: 10px 14px 12px; }
    :host([data-phone]) .shd { padding: 12px 10px 8px 16px; gap: 8px; }
    :host([data-phone]) .shd .muted { display: none; }
    :host([data-phone]) .sft { flex-wrap: wrap; min-height: 0; }
    :host([data-phone]) .sft .sstate { flex: 1 1 100%; }
    :host([data-phone]) .sft .lead, :host([data-phone]) .sft .pill { flex: 1; }
    :host([data-phone]) .srow > .sctl { justify-content: flex-start; }
    :host([data-phone]) .sin { width: 100%; } :host([data-phone]) .sin.short { width: 96px; } :host([data-phone]) .sin.pic { width: 60px; }
    :host([data-phone]) .sadv { grid-template-columns: 1fr; gap: 0 0; } :host([data-phone]) .sadv > span { margin-bottom: 8px; }
    :host([data-phone]) .skeys { display: none; }
  `];
  static properties = { hass: { attribute: false }, config: { attribute: false }, forceKeys: { type: Boolean }, _pane: { state: true }, _draft: { state: true }, _access: { state: true }, _busy: { state: true }, _err: { state: true }, _ask: { state: true },
    _kid: { state: true }, _ktab: { state: true }, _time: { state: true }, _kb: { state: true }, _caps: { state: true }, _lists: { state: true }, _job: { state: true }, _pin: { state: true }, _find: { state: true }, _tick: { state: true }, _sure: { state: true }, _hist: { state: true } };
  hass?: Hass;
  config!: Cfg;
  /** show the on-screen keyboard whatever the pointer is (the preview and the tests) */
  forceKeys = false;
  private _pane: PaneId = 'children';
  private _draft!: Cfg;
  private _access: Access | null = null;
  private _busy = '';
  private _err = '';
  /** leaving with unsaved changes: what to do once they are saved or thrown away */
  private _ask: (() => void) | null = null;
  private _kid = 0;
  private _ktab: 'about' | 'jobs' = 'about';
  private _time: TimeAsk | null = null;
  private _kb = '';
  private _caps = true;
  private _lists: Record<string, Chore[] | 'fail' | undefined> = {};
  private _job: JobEdit | null = null;
  private _pin = { cur: '', next: '', again: '' };
  private _find = '';
  private _tick = 0;
  /** a second tap needed: 'restore:<time>', 'test' */
  private _sure = '';
  private _hist: Version[] = [];
  private _fields = new Map<string, Field>();
  private _spin: Record<string, number> = {};
  private _closed = false;
  private _noteT = 0;
  private _from: Cfg | null = null;

  /* ---------------- life ---------------- */

  connectedCallback(): void {
    super.connectedCallback();
    const want = paneWanted() as PaneId; if (PANES.some((p) => p.id === want)) this._pane = want;
    this._hist = history();
    window.addEventListener('keydown', this._keys, true);
    this._noteT = window.setInterval(() => { this._tick++; }, 1000);
    pinMark();
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._keys, true); clearInterval(this._noteT);
    // closed by a grown-up: the PIN window starts now. Taken away by the dashboard drawing itself again: Settings comes back on the same pane.
    pinMark(); wantPane(this._closed ? '' : this._pane); if (!this._closed) resumeSoon();
  }
  protected willUpdate(ch: PropertyValues): void {
    if (ch.has('config') && this.config) {
      // a new configuration arrives after a save, or from the dashboard: the draft follows it unless there are edits here
      if (!this._draft || !this._from || same(this._draft, this._from)) this._draft = clone(this.config);
      this._from = this.config;
      if (this._kid >= (this.config.kids ?? []).length) this._kid = 0;
    }
    if ((ch.has('hass') || ch.has('config')) && this.hass && !this._access && !this._checking) void this._check();
    if (!this.config?.parent_pin && this._access?.ok && this._pane !== 'pin' && this._pane !== 'advanced') this._pane = 'pin';
  }
  private _checking = false;
  private async _check(): Promise<void> {
    this._checking = true;
    this._access = await checkAccess(this.hass, this.config);
    this._checking = false;
  }
  protected firstUpdated(): void { this.renderRoot.querySelector<HTMLElement>('.snav button[aria-current="page"]')?.focus({ preventScroll: true }); }
  protected updated(ch: PropertyValues): void {
    if (ch.has('_pane')) { const p = this.renderRoot.querySelector<HTMLElement>('.spane'); if (p) p.scrollTop = 0; this.renderRoot.querySelector<HTMLElement>('.snav button[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    if (ch.has('_time') && this._time) this.renderRoot.querySelector<HTMLElement>('.drum')?.focus({ preventScroll: true });
    if (ch.has('_ask') && this._ask) this.renderRoot.querySelector<HTMLElement>('.sft [data-act="stay"]')?.focus({ preventScroll: true });
    if (ch.has('_kb') && this._kb) this.renderRoot.querySelector<HTMLElement>(`[data-f="${this._kb}"]`)?.scrollIntoView({ block: 'nearest' });
    // keep each drum resting on its value (unless a finger is spinning it)
    if (this._time) { const [h, m] = this._hmOf(); for (const [which, list, v] of [['h', HOURS, h % 12 || 12], ['m', this._mins(m), m]] as const) {
      const el = this.renderRoot.querySelector<HTMLElement>(`.drum[data-d='${which}']`); if (!el || this._spin[which]) continue;
      const top = (list as number[]).indexOf(v) * ROW; if (Math.abs(el.scrollTop - top) > 1) el.scrollTo({ top, behavior: el.dataset.set ? 'smooth' : 'auto' }); el.dataset.set = '1'; } }
    this._wantLists();
  }

  /* ---------------- where things stand ---------------- */

  private get _ro(): boolean { return !this._access?.ok; }
  private get _pinDirty(): boolean { return !!(this._pin.cur || this._pin.next || this._pin.again); }
  private get _dirty(): boolean { return !!this._draft && (!same(this._draft, this.config) || this._pinDirty); }
  private get _osk(): boolean { return this.forceKeys || (getShape() !== 'phone' && typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches); }
  private _edit(fn: (d: Cfg) => void): void { const d = clone(this._draft); fn(d); this._draft = d; this._err = ''; this._awake(); }
  /** Typing on a real keyboard counts as using the panel (the card watches for touches to know it is not idle). */
  private _awake(): void { this.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true })); }
  private _say(msg: string, o: { bad?: boolean; undo?: { back: Cfg; from: Cfg } | null; ms?: number } = {}): void { setNote({ msg, bad: o.bad, undo: o.undo ?? null, until: Date.now() + (o.ms ?? (o.undo ? 12_000 : Math.max(4500, msg.split(/\s+/).length * 450))) }); if (o.bad) sfx('error'); this._tick++; }

  /* ---------------- leaving, saving, undoing ---------------- */

  private _guard(run: () => void): void { if (this._dirty && !this._ro) { this._ask = run; sfx('locked'); } else run(); }
  private _go(p: PaneId): void {
    if (p === this._pane) return;
    if (!this.config.parent_pin && !this._ro && p !== 'advanced' && p !== 'pin') { this._say('Set a parent PIN first: Settings is for grown-ups.'); return; }
    this._guard(() => { this._pane = p; this._job = null; this._err = ''; this._kb = ''; this._sure = ''; this._find = ''; sfx('nav'); });
  }
  private _close(): void { this._guard(() => { this._closed = true; this.dispatchEvent(new CustomEvent('close')); }); }
  private _discard(): void { this._draft = clone(this.config); this._pin = { cur: '', next: '', again: '' }; this._err = ''; }
  /** The draft with the PIN fields applied, or a sentence saying what is wrong with them. */
  private _next(): Cfg | string {
    const next = clone(this._draft), p = this._pin, has = this.config.parent_pin !== undefined && this.config.parent_pin !== null && String(this.config.parent_pin) !== '';
    if (this._pinDirty) {
      if (has && p.cur !== String(this.config.parent_pin)) return 'That is not the current PIN.';
      if (!isPin(p.next)) return 'A PIN is 4 to 8 digits.';
      if (p.next !== p.again) return 'The two new PINs are not the same.';
      next.parent_pin = p.next;
    }
    const errs = draftErrors(next); if (errs.length) { const e = errs.find((x) => x.pane === this._pane) ?? errs[0]; return e.pane === this._pane ? e.msg : `${e.msg} (Fix this under ${PANES.find((x) => x.id === e.pane)?.name ?? 'Advanced'}.)`; }
    return next;
  }
  private async _save(then?: () => void): Promise<void> {
    if (this._busy || this._ro || !this.hass) return;
    const next = this._next();
    if (typeof next === 'string') { this._err = next; this._ask = null; sfx('error'); return; }
    const from = this.config, what = PANES.find((p) => p.id === this._pane)?.name ?? 'Settings';
    this._busy = 'save'; this._err = '';
    try {
      await saveCard(this.hass, from, next, what);
      this._adopt(from, next);
      sfx('set'); this._say(`Saved: ${what}.`, { undo: { back: from, from: next } });
      this._ask = null; then?.();
    } catch (e) { this._ask = null; this._failed(e, 'Nothing was saved. Your changes are still here.'); }
    this._busy = '';
  }
  private _failed(e: unknown, tail: string): void {
    if (e instanceof StaleError) { this._access = { ...(this._access ?? { ok: true }), latest: e.latest }; this._err = 'This card was changed on another screen, so nothing was saved here.'; }
    else this._err = e instanceof SlowError ? `${SLOW_SAY} ${tail}` : `That did not save: Home Assistant did not answer. ${tail}`;
    sfx('error');
  }
  /** The running card takes the new configuration at once; this screen's own choices of look and sound follow what was just set. */
  private _adopt(from: Cfg, next: Cfg): void {
    try {
      const ls = localStorage;
      if (from.look !== next.look) { if (next.look) ls.setItem(LOOK_KEY, next.look); else ls.removeItem(LOOK_KEY); }
      if (from.theme !== next.theme) { if (next.theme) ls.setItem('family-hub-theme', next.theme); else ls.removeItem('family-hub-theme'); }
      if (from.sounds !== next.sounds) ls.removeItem('family-hub-sounds');
      const key = (n: string): string => `family-hub-kid-${n.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      (next.kids ?? []).forEach((k, i) => { const was = (from.kids ?? [])[i]; if (!was) return;
        const saved = JSON.parse(ls.getItem(key(was.name)) || '{}') as Record<string, unknown>;
        for (const [cfg, pref] of [['look_id', 'look'], ['font', 'font'], ['calm', 'calm'], ['sound_level', 'sound'], ['focus', 'focus']] as const) if (was[cfg] !== k[cfg]) delete saved[pref];
        if (was.name !== k.name) ls.removeItem(key(was.name));
        if (Object.keys(saved).length) ls.setItem(key(k.name), JSON.stringify(saved)); else ls.removeItem(key(k.name)); });
    } catch { /* storage unavailable */ }
    this._draft = clone(next); this._from = next; this._pin = { cur: '', next: '', again: '' }; this._hist = history(); this._sure = '';
    this._access = { ...(this._access ?? { ok: true }), latest: undefined, previous: { t: new Date().toISOString(), what: 'Kept in the dashboard', config: from, from: 'dashboard' } };
    wantPane(this._pane); resumeSoon();
    this.dispatchEvent(new CustomEvent('fh-config', { detail: next, bubbles: true, composed: true }));
  }
  private async _put(back: Cfg, said: string): Promise<void> {
    if (this._busy || !this.hass) return;
    const from = this.config;
    this._busy = 'undo';
    try { await saveCard(this.hass, from, back, 'Before an undo'); this._adopt(from, back); this._say(said); }
    catch (e) { this._failed(e, 'Nothing was changed.'); this._say(this._err, { bad: true }); }
    this._busy = '';
  }
  private _undo(): void { const n = getNote(); if (!n?.undo) return; const { back } = n.undo; setNote(null); sfx('undo'); void this._put(back, 'Put back as it was.'); }
  /** An earlier version comes back whole, except the PIN: earlier versions are kept without it, so the PIN stays as it is now. */
  private _restore(v: Version): void { const back = { ...clone(v.config), ...(this.config.parent_pin !== undefined ? { parent_pin: this.config.parent_pin } : {}) } as Cfg; this._sure = ''; this._guard(() => void this._put(back, `Restored the version from ${when(v.t)}.`)); }
  private _loadLatest(): void { const l = this._access?.latest; if (!l) return; this._from = null; this._access = { ...this._access!, latest: undefined }; this._err = ''; this._pin = { cur: '', next: '', again: '' }; this.dispatchEvent(new CustomEvent('fh-config', { detail: l, bubbles: true, composed: true })); this._draft = clone(l); this._say('Loaded what the dashboard has now.'); }

  private _keys = (e: KeyboardEvent): void => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey) this._awake();
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (this._time) this._time = null; else if (this._kb) { this._kb = ''; } else if (this._ask) this._ask = null; else if (this._job) this._job = null; else this._close();
    } else if (e.key === 'Tab') { // focus stays in Settings while it is open (in the time dial while that is open)
      const root = this._time ? this.renderRoot.querySelector('.sdial') : this.renderRoot;
      const all = [...(root?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]') ?? [])].filter((x) => x.offsetParent !== null && !x.closest('.skeys') && !x.closest('fieldset[disabled]'));
      const at = all.indexOf((this.renderRoot as ShadowRoot).activeElement as HTMLElement);
      if (all.length && (at < 0 || (e.shiftKey ? at === 0 : at === all.length - 1))) { e.preventDefault(); all[e.shiftKey ? all.length - 1 : 0].focus(); }
    } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void this._save(); }
  };

  /* ---------------- the controls every pane is built from ---------------- */

  private _row(label: string, hint: string, ctl: TemplateResult | typeof nothing, wide = false): TemplateResult {
    return html`<div class="srow ${wide ? 'wide' : ''}"><span class="slabel">${label}${hint ? html`<span>${hint}</span>` : nothing}</span><span class="sctl">${ctl}</span></div>`;
  }
  private _txt(id: string, label: string, value: string, set: (v: string) => void, o: { ph?: string; cls?: string; digits?: boolean; secret?: boolean; bad?: boolean; max?: number; pic?: boolean } = {}): TemplateResult {
    this._fields.set(id, { get: () => value, set, digits: o.digits });
    const osk = this._osk;
    return html`<input class="sin ${o.cls ?? ''} ${this._kb === id ? 'on' : ''}" data-f=${id} type=${o.secret ? 'password' : 'text'} autocomplete=${o.secret ? 'new-password' : 'off'} autocapitalize=${o.pic || o.digits ? 'off' : 'sentences'} spellcheck="false" maxlength=${o.max ?? 120}
      inputmode=${osk ? 'none' : o.digits ? 'numeric' : 'text'} aria-label=${label} aria-invalid=${o.bad ? 'true' : 'false'} placeholder=${o.ph ?? ''} .value=${value}
      @focus=${() => { if (osk) { this._kb = id; this._caps = !value.length; } }} @input=${(e: Event) => { const el = e.target as HTMLInputElement; const v = o.digits ? el.value.replace(/\D/g, '') : o.pic ? onePic(el.value) : el.value; if (v !== el.value) el.value = v; set(v); }}>`;
  }
  private _tm(title: string, get: () => string | undefined, set: (v: string) => void, fallback = ''): TemplateResult {
    const v = get() ?? fallback;
    return html`<button class="stime tap" aria-haspopup="dialog" aria-label=${`${title}: ${t12(v)}. Change`} aria-invalid=${v && !isTime(v) ? 'true' : 'false'} @click=${() => { this._kb = ''; this._time = { title, get: () => get() ?? fallback, set }; }}>${t12(v)}</button>`;
  }
  private _sw(label: string, on: boolean, flip: () => void): TemplateResult {
    return html`<button class="sswitch tap" role="switch" aria-checked=${String(on)} aria-label=${label} @click=${flip}><i aria-hidden="true"></i></button>`;
  }
  private _seg<T extends string | number | boolean>(label: string, value: T | undefined, opts: [T, string][], set: (v: T) => void): TemplateResult {
    return html`<div class="seg" role="group" aria-label=${label}>${opts.map(([v, n]) => html`<button class="tap" aria-pressed=${String(value === v)} @click=${() => { if (value !== v) set(v); }}>${n}</button>`)}</div>`;
  }
  private _step(label: string, value: number, set: (v: number) => void, o: { min?: number; max?: number; step?: number; unit?: string; say?: (v: number) => string } = {}): TemplateResult {
    const min = o.min ?? 0, max = o.max ?? 999, st = o.step ?? 1, go = (d: number): void => { const v = Math.max(min, Math.min(max, value + d)); if (v !== value) { sfx('step'); set(v); } };
    const text = o.say ? o.say(value) : `${value}${o.unit ? ` ${o.unit}` : ''}`;
    return html`<span class="sstep" role="group" aria-label=${label}><button class="tap" data-hush aria-label=${`${label}: less`} ?disabled=${value <= min} @click=${() => go(-st)}>−</button><output aria-live="polite">${text}</output><button class="tap" data-hush aria-label=${`${label}: more`} ?disabled=${value >= max} @click=${() => go(st)}>+</button></span>`;
  }
  private _range(label: string, value: number, set: (v: number) => void): TemplateResult {
    return html`<span class="srange"><input type="range" min="0" max="100" step="5" aria-label=${label} aria-valuetext=${`${value} per cent`} .value=${String(value)} @input=${(e: Event) => { sfx('slide'); set(Number((e.target as HTMLInputElement).value)); }}><output>${value}%</output></span>`;
  }
  private _del(label: string, run: () => void): TemplateResult { return html`<button class="sico tap bad" aria-label=${label} @click=${run}>${icon('bin', 20)}</button>`; }
  private _move(label: string, i: number, n: number, run: (to: number) => void): TemplateResult {
    return html`<button class="sico tap" aria-label=${`Move ${label} up`} ?disabled=${i === 0} @click=${() => run(i - 1)}><svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="--s:20px"><path d="M6 15l6-6 6 6"></path></svg></button>
      <button class="sico tap" aria-label=${`Move ${label} down`} ?disabled=${i >= n - 1} @click=${() => run(i + 1)}><svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="--s:20px"><path d="M6 9l6 6 6-6"></path></svg></button>`;
  }
  /** A short list of words (names, things to bring): each can be changed or removed, and one more added. */
  private _strs(id: string, what: string, list: string[], set: (l: string[]) => void, ph = ''): TemplateResult {
    return html`${list.map((s, i) => html`<div class="sitem">${this._txt(`${id}.${i}`, `${what} ${i + 1}`, s, (v) => set(list.map((x, j) => (j === i ? v : x))), { cls: 'sgrow' })}${this._del(`Remove ${s || what}`, () => set(list.filter((_, j) => j !== i)))}</div>`)}
      <div><button class="pill tap" @click=${() => { set([...list, '']); this._focusSoon(`${id}.${list.length}`); }}>${icon('plus', 18)}Add ${what}</button></div>`;
  }
  private _focusSoon(id: string): void { void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLElement>(`[data-f="${id}"]`)?.focus()); }
  private _kidChips(label: string): TemplateResult {
    const kids = this._draft.kids ?? [];
    return html`<div class="schips" role="group" aria-label=${label}>${kids.map((k, i) => html`<button class="tap" aria-pressed=${String(this._kid === i)} @click=${() => { this._kid = i; this._job = null; }}><i class="sw6" style="background:${slotVar(k.colour)}" aria-hidden="true"></i>${k.name || `Child ${i + 1}`}</button>`)}</div>`;
  }
  private _name(id: string): string { const s = this.hass?.states[id]; return (s?.attributes.friendly_name as string | undefined) ?? id; }

  /* ---------------- the time dial ---------------- */

  private _hmOf(): [number, number] { const v = this._time?.get() ?? ''; const [h, m] = isTime(v) ? v.split(':').map(Number) : [7, 0]; return [h, m]; }
  private _mins(m: number): number[] { const l = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]; return l.includes(m) ? l : [...l, m].sort((a, b) => a - b); }
  private _setTime(h: number, m: number): void { const [h0, m0] = this._hmOf(); if (h === h0 && m === m0) return; sfx('step'); this._time?.set(`${pad(h)}:${pad(m)}`); this.requestUpdate(); }
  private _drumTo(which: 'h' | 'm', i: number): void {
    const [h, m] = this._hmOf(), pm = h >= 12;
    if (which === 'h') { const v = HOURS[Math.max(0, Math.min(11, i))]; this._setTime((v % 12) + (pm ? 12 : 0), m); } else { const l = this._mins(m); this._setTime(h, l[Math.max(0, Math.min(l.length - 1, i))]); }
  }
  private _drum(which: 'h' | 'm'): TemplateResult {
    const [h, m] = this._hmOf(), list = which === 'h' ? HOURS : this._mins(m), v = which === 'h' ? h % 12 || 12 : m, at = list.indexOf(v);
    return html`<div class="drum" data-d=${which} tabindex="0" role="spinbutton" aria-label=${which === 'h' ? 'Hour' : 'Minutes'} aria-valuenow=${v} aria-valuetext=${which === 'h' ? `${v} ${h < 12 ? 'am' : 'pm'}` : `${pad(v)} minutes`} aria-valuemin=${list[0]} aria-valuemax=${list[list.length - 1]}
      @scroll=${(e: Event) => { const el = e.currentTarget as HTMLElement; clearTimeout(this._spin[which]); this._spin[which] = window.setTimeout(() => { this._spin[which] = 0; this._drumTo(which, Math.round(el.scrollTop / ROW)); }, 90); }}
      @keydown=${(e: KeyboardEvent) => { const d = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : e.key === 'PageUp' ? -3 : e.key === 'PageDown' ? 3 : 0;
        if (d) { e.preventDefault(); this._drumTo(which, Math.abs(d) === 1 ? (at + d + list.length) % list.length : at + d); } else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); this._drumTo(which, e.key === 'Home' ? 0 : list.length - 1); } else if (e.key === 'Enter') { e.preventDefault(); this._time = null; } }}>
      ${list.map((n, i) => html`<i ?data-on=${n === v} @click=${() => this._drumTo(which, i)}>${which === 'h' ? n : pad(n)}</i>`)}</div>`;
  }
  private _dial(): TemplateResult {
    const t = this._time!, [h, m] = this._hmOf(), pm = h >= 12;
    return html`<div class="sveil" @click=${() => { this._time = null; }}></div>
      <div class="sdial" role="dialog" aria-modal="true" aria-label=${t.title}>
        <h3>${t.title}</h3>
        <div class="sdrow"><div class="drums">${this._drum('h')}<span class="scolon" aria-hidden="true">:</span>${this._drum('m')}</div>
          <div class="sampm" role="group" aria-label="Morning or afternoon"><button class="tap" aria-pressed=${String(!pm)} @click=${() => this._setTime(h % 12, m)}>am</button><button class="tap" aria-pressed=${String(pm)} @click=${() => this._setTime((h % 12) + 12, m)}>pm</button></div></div>
        <button class="lead tap" data-act="time-done" @click=${() => { this._time = null; }}>Done: ${t12(t.get())}</button>
      </div>`;
  }

  /* ---------------- jobs (Home Assistant to-do lists) ---------------- */

  private _listFor = '';
  private _wantLists(): void {
    const k = (this._draft?.kids ?? [])[this._kid], show = k && ((this._pane === 'children' && this._ktab === 'jobs') || this._pane === 'morning');
    const id = show ? kidEntities(this.config.kids?.[this._kid] ?? k).chores : '';
    if (id && id !== this._listFor) { this._listFor = id; void this._loadList(id); } else if (!id) this._listFor = '';
  }
  private async _loadList(id: string): Promise<void> {
    if (!this.hass?.states[id]) { this._lists = { ...this._lists, [id]: 'fail' }; return; }
    try { const r = await inTime(this.hass.callWS<{ items: Chore[] }>({ type: 'todo/item/list', entity_id: id })); this._lists = { ...this._lists, [id]: (r.items ?? []).filter((x) => x && typeof x.summary === 'string') }; }
    catch { this._lists = { ...this._lists, [id]: 'fail' }; }
  }
  private async _jobCall(id: string, run: () => Promise<unknown>, ok: string, undo?: () => Promise<unknown>): Promise<boolean> {
    if (this._busy) return false;
    this._busy = 'job';
    try { await inTime(run()); await this._loadList(id); this._busy = ''; setNote(null); this._say(ok); if (undo) { this._jobUndo = undo; this._jobUndoId = id; } else this._jobUndo = null; return true; }
    catch (e) { this._busy = ''; this._say(e instanceof SlowError ? `${SLOW_SAY} The list was not changed.` : 'That did not save: Home Assistant did not answer. The list was not changed.', { bad: true }); return false; }
  }
  private _jobUndo: (() => Promise<unknown>) | null = null; private _jobUndoId = '';
  private async _saveJob(): Promise<void> {
    const j = this._job; if (!j || !this.hass) return;
    if (!j.form.name.trim()) { this._say('Give the job a name first.', { bad: true }); return; }
    const it = choreItem(j.form), h = this.hass;
    const ok = await this._jobCall(j.entity, () => j.uid ? h.callService('todo', 'update_item', { item: j.uid, rename: it.summary, description: it.description }, { entity_id: j.entity }) : h.callService('todo', 'add_item', { item: it.summary, description: it.description }, { entity_id: j.entity }), j.uid ? `Changed: ${it.summary}.` : `Added: ${it.summary}.`);
    if (ok) this._job = null;
  }
  private async _removeJob(entity: string, c: Chore): Promise<void> {
    const h = this.hass!;
    const ok = await this._jobCall(entity, () => h.callService('todo', 'remove_item', { item: c.uid }, { entity_id: entity }), `Removed: ${c.summary}.`, () => h.callService('todo', 'add_item', { item: c.summary, description: c.description ?? '' }, { entity_id: entity }));
    if (ok) this._job = null;
  }
  private async _moveJob(entity: string, list: Chore[], i: number, to: number): Promise<void> {
    const h = this.hass!, uid = list[i].uid, order = list.filter((_, j) => j !== i); order.splice(to, 0, list[i]);
    const prev = order[to - 1]?.uid;
    await this._jobCall(entity, () => h.callWS({ type: 'todo/item/move', entity_id: entity, uid, ...(prev ? { previous_uid: prev } : {}) }), 'Moved.');
  }
  /** The job list of the child being edited. `only` keeps it to one part of the day (the Morning pane shows the morning routine). */
  private _jobs(k: KidConfig, only?: 'am'): TemplateResult {
    const entity = kidEntities(this.config.kids?.[this._kid] ?? k).chores, raw = this._lists[entity], st = this.hass?.states[entity];
    if (raw === 'fail') return html`<div class="snote ro" role="note"><span><b>${k.name}’s job list could not be read.</b> Home Assistant has ${st ? 'not answered for' : 'no to-do list called'} <code>${entity}</code>. ${st ? 'Try again in a moment.' : 'Make a to-do list with that name in Home Assistant (Settings, Devices and services, Helpers, To-do list), then come back.'}</span></div>`;
    if (!raw) return html`<span class="shint" role="status">Reading ${k.name}’s list…</span>`;
    const feats = Number(st?.attributes.supported_features ?? 0), canMove = (feats & 8) === 8 && !only, ro = this._ro;
    const SLOTS: [ChoreForm['slot'], string][] = [['am', 'Morning'], ['after', 'After school'], ['bed', 'Bedtime'], ['any', 'Any time']], LANE: Record<string, string> = { routine: 'Routine', job: 'Job', grow: 'Practice' };
    const form = (j: JobEdit): TemplateResult => { const f = j.form, set = (p: Partial<ChoreForm>): void => { this._job = { ...j, form: { ...f, ...p } }; };
      return html`<div class="sform" role="group" aria-label=${j.uid ? `Change ${f.name}` : 'New job'}>
        ${this._row('Name', '', html`${this._txt('job.pic', 'Picture (an emoji)', f.pic, (v) => set({ pic: v }), { cls: 'pic', ph: '🙂', pic: true, max: 16 })}${this._txt('job.name', 'Job name', f.name, (v) => set({ name: v }), { ph: 'e.g. Feed the fish' })}`, true)}
        ${this._row('Kind', f.lane === 'routine' ? 'Part of the day’s routine.' : f.lane === 'job' ? 'Earns points.' : 'Practice: earns a growth mark, not points.', this._seg('Kind', f.lane, [['routine', 'Routine'], ['job', 'Job'], ['grow', 'Practice']], (v) => set({ lane: v })))}
        ${only ? nothing : this._row('When', '', this._seg('When', f.slot, SLOTS, (v) => set({ slot: v })))}
        ${f.lane === 'grow' ? nothing : this._row('Points', '', this._step('Points', f.pts, (v) => set({ pts: v }), { max: 500, step: 5 }))}
        ${this._row('Timer', 'A timed job shows a start button.', this._step('Timer minutes', f.minutes, (v) => set({ minutes: v, song: v ? f.song : false }), { max: 120, step: 5, say: (v) => (v ? `${v} min` : 'None') }))}
        ${f.minutes ? this._row('Music while the timer runs', 'The music stops when time is up.', this._sw('Music while the timer runs', f.song, () => set({ song: !f.song }))) : nothing}
        <div class="sbtns">${j.uid ? html`<button class="pill tap danger" data-act="job-remove" ?disabled=${!!this._busy} @click=${() => { const c = (raw as Chore[]).find((x) => x.uid === j.uid); if (c) void this._removeJob(entity, c); }}>${icon('bin', 18)}Remove</button>` : nothing}
          <span style="flex:1"></span><button class="pill tap" @click=${() => { this._job = null; }}>Cancel</button>
          <button class="pill tap primary" data-act="job-save" ?data-busy=${this._busy === 'job'} ?disabled=${!!this._busy} @click=${() => void this._saveJob()}>${j.uid ? 'Save this job' : 'Add this job'}</button></div></div>`; };
    const rowOf = (c: Chore, i: number): TemplateResult => { const f = choreForm(c);
      if (this._job?.uid === c.uid && this._job.entity === entity) return form(this._job);
      return html`<div class="sitem" style="border:0;padding:0"><button class="sjob tap sgrow" ?disabled=${ro} aria-label=${`Change ${f.name}`} @click=${() => { this._job = { entity, uid: c.uid, form: f }; }}>
        <span class="spic" aria-hidden="true">${f.pic || '•'}</span><span class="sname sgrow">${f.name}</span>
        ${f.minutes ? html`<span class="stag">${f.minutes} min${f.song ? ' ♪' : ''}</span>` : nothing}<span class="stag">${LANE[f.lane]}</span>${f.pts ? html`<span class="stag">+${f.pts}</span>` : nothing}</button>
        ${canMove && !ro ? this._move(f.name, i, (raw as Chore[]).length, (to) => void this._moveJob(entity, raw as Chore[], i, to)) : nothing}</div>`; };
    const items = (raw as Chore[]).map((c, i) => ({ c, i, f: choreForm(c) })), shown = only ? items.filter((x) => x.f.slot === only) : items;
    const adding = this._job && this._job.uid === null && this._job.entity === entity ? form(this._job) : nothing;
    return html`<div class="sjobs">
      ${only ? shown.map((x) => rowOf(x.c, x.i)) : SLOTS.map(([s, n]) => { const part = shown.filter((x) => x.f.slot === s); return part.length ? html`<span class="label">${n}</span>${part.map((x) => rowOf(x.c, x.i))}` : nothing; })}
      ${shown.length ? nothing : html`<span class="shint">Nothing here yet.</span>`}
      ${adding}
      ${this._jobUndo && this._jobUndoId === entity ? html`<div><button class="pill tap" data-act="job-undo" @click=${() => { const u = this._jobUndo!; this._jobUndo = null; sfx('undo'); void this._jobCall(entity, u, 'Put back.'); }}>Put the removed job back</button></div>` : nothing}
      ${this._job || ro ? nothing : html`<div><button class="pill tap" data-act="job-add" @click=${() => { this._job = { entity, uid: null, form: { name: '', lane: only ? 'routine' : 'job', slot: only ?? 'any', pts: only ? 0 : 10, minutes: 0, pic: '', song: false, rest: '' } }; this._focusSoon('job.name'); }}>${icon('plus', 18)}${only ? 'Add a morning step' : 'Add a job'}</button></div>`}
      <span class="shint">Jobs are kept in Home Assistant (<code>${entity}</code>), so a change here is saved straight away, not with the Save button.</span></div>`;
  }

  /* ---------------- panes ---------------- */

  private _children(): TemplateResult {
    const d = this._draft, kids = d.kids ?? [], k = kids[this._kid];
    if (!k) return html`<p class="sintro">There are no children on this panel yet. A child needs helpers in Home Assistant (a job list and points), so the first one is added in YAML. See the README.</p>`;
    const i = this._kid, set = (fn: (k: KidConfig) => void): void => this._edit((x) => fn(x.kids![i])), orig = this.config.kids?.[i];
    const renamed = !!orig && orig.name !== k.name;
    const about = html`
      <div class="scard"><h3>About ${k.name || 'this child'}</h3>
        ${this._row('Name', renamed ? `Jobs, points and history stay with the helpers made for ${orig!.name}. Calendars, medicines and bedrooms that name ${orig!.name} are renamed too.` : '', this._txt(`kid.${i}.name`, 'Name', k.name, (v) => this._rename(i, v), { max: 24 }), true)}
        ${this._row('Colour', 'Used for this child everywhere on the panel.', html`<div class="schips" role="group" aria-label="Colour">${([1, 2, 3, 4, 5] as ColourSlot[]).map((c) => html`<button class="tap" aria-pressed=${String(k.colour === c)} aria-label=${`Colour ${c}`} @click=${() => set((x) => { x.colour = c; })}><i class="sw6" style="background:${slotVar(c)};width:24px;height:24px" aria-hidden="true"></i></button>`)}</div>`)}
        ${this._row('Reading', 'Pictures suits a child who cannot read yet: big pictures, stars and read-aloud.', this._seg('Reading', k.mode ?? 'mixed', [['picture', 'Pictures'], ['mixed', 'Both'], ['text', 'Words']], (v) => set((x) => { x.mode = v; })))}
        ${(k.mode ?? 'mixed') === 'picture' ? this._row('Points for one star', 'Stars are shown instead of numbers.', this._step('Points for one star', k.star ?? 10, (v) => set((x) => { x.star = v; }), { min: 1, max: 100, step: 1 })) : nothing}
        ${this._row('Character size', 'How tall the character on the page is drawn.', this._seg('Character size', k.age ?? 'mid', [['kid', 'Little'], ['mid', 'Middle'], ['teen', 'Big']], (v) => set((x) => { x.age = v; })))}
      </div>
      <div class="scard"><h3>Bedtime</h3>
        ${this._row('School nights', 'Wind-down starts an hour before; music in the bedroom goes quiet at bedtime.', this._tm(`${k.name}’s bedtime`, () => this._draft.kids?.[i]?.bedtime, (v) => set((x) => { x.bedtime = v; }), '20:00'))}
        ${this._row('Friday and Saturday nights', 'How much later bedtime is. This is the same for every child.', this._step('Later on Friday and Saturday', d.bedtime_weekend_extra ?? 30, (v) => this._edit((x) => { x.bedtime_weekend_extra = v; }), { max: 120, step: 15, say: (v) => (v ? `+${v} min` : 'Same time') }))}
      </div>
      <div class="scard"><h3>${k.name}’s page <span class="muted">what it starts with</span></h3>
        ${this._row('Look', '', html`<div class="schips" role="group" aria-label="Look">${[['', 'Same as the panel'], ...LOOKS.map((l) => [l.id, l.name])].map(([id, n]) => html`<button class="tap" aria-pressed=${String((k.look_id ?? '') === id)} @click=${() => set((x) => { if (id) x.look_id = id as KidConfig['look_id']; else delete x.look_id; })}>${n}</button>`)}</div>`)}
        ${this._row('Calm mode', 'No looping motion or tilted cards.', this._sw('Calm mode', k.calm ?? true, () => set((x) => { x.calm = !(x.calm ?? true); })))}
        ${this._row('Sounds', 'Timers and alarms always sound.', this._seg('Sounds', k.sound_level ?? 'full', [['off', 'Off'], ['soft', 'Soft'], ['full', 'On']], (v) => set((x) => { x.sound_level = v; })))}
        ${this._row('One job at a time', 'Shows Now, Next and Later instead of the whole list.', this._sw('One job at a time', k.focus ?? (k.mode ?? 'mixed') !== 'text', () => set((x) => { x.focus = !(x.focus ?? (x.mode ?? 'mixed') !== 'text'); })))}
        ${this._row('Time together', 'A promise shown on the page, never for sale. Leave empty for none.', this._txt(`kid.${i}.special`, 'Time together', k.special_time ?? '', (v) => set((x) => { if (v) x.special_time = v; else delete x.special_time; }), { ph: 'e.g. Sat 10:00 with Dad' }), true)}
        <span class="shint">${k.name} can still change his own character in the style studio, without the PIN. Saving here also resets these four choices on this screen.</span>
      </div>`;
    return html`<p class="sintro">One child at a time. Pick who, then change what you need.</p>
      ${this._kidChips('Which child')}
      ${this._seg('Part', this._ktab, [['about', 'About'], ['jobs', 'Jobs and routines']], (v) => { this._ktab = v; this._job = null; })}
      ${this._ktab === 'about' ? about : html`<div class="scard"><h3>${k.name}’s jobs and routines</h3>${this._jobs(k)}</div>`}`;
  }
  /** A new name keeps the child's helpers (through `id`) and follows him where the configuration names him. */
  private _rename(i: number, v: string): void {
    this._edit((d) => { const k = d.kids![i], was = k.name, first = this.config.kids?.[i]?.name ?? was;
      k.name = v;
      const slug = (n: string): string => n.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (v !== first && !k.id) k.id = slug(first); else if (k.id && slug(v) === k.id && !this.config.kids?.[i]?.id) delete k.id;
      if (!was || !v) return;
      for (const m of d.meds ?? []) if (m.who === was) m.who = v;
      for (const p of d.people ?? []) if (p.name === was) p.name = v;
      for (const c of d.calendars ?? []) if (c.name === was) c.name = v;
      for (const f of d.music_map ?? []) for (const r of f.rooms ?? []) if (r.kids) r.kids = r.kids.map((n) => (n === was ? v : n));
      for (const r of d.bring_rules ?? []) if (r.kid === was) r.kid = v; });
  }

  private _rewards(): TemplateResult {
    const d = this._draft, kids = d.kids ?? [], k = kids[this._kid], i = this._kid;
    const DEFAULTS: RewardConfig[] = [{ name: 'Pick the family movie', cost: 100 }, { name: 'Choose Friday dinner', cost: 80 }];
    const list = k?.rewards, set = (fn: (l: RewardConfig[]) => void): void => this._edit((x) => { const kk = x.kids![i]; kk.rewards = kk.rewards ?? clone(DEFAULTS); fn(kk.rewards); });
    const jar = d.jar ?? {};
    return html`<p class="sintro">Each child has his own list. A reward costs points; the bigger ones can ask for a grown-up first.</p>
      ${k ? html`${this._kidChips('Whose rewards')}
      <div class="scard"><h3>${k.name}’s rewards ${list ? nothing : html`<span class="muted">the two starter rewards, until you change them</span>`}</h3>
        ${(list ?? DEFAULTS).map((r, n, all) => html`<div class="sitem" data-reward=${n}>
          ${this._txt(`rw.${i}.${n}.icon`, `Picture for ${r.name || 'this reward'} (an emoji)`, r.icon ?? '', (v) => set((l) => { if (v) l[n].icon = v; else delete l[n].icon; }), { cls: 'pic', ph: '🎁', pic: true, max: 16 })}
          ${this._txt(`rw.${i}.${n}.name`, `Reward ${n + 1} name`, r.name, (v) => set((l) => { l[n].name = v; }), { cls: 'sgrow', ph: 'Name of the reward', bad: !r.name.trim() })}
          ${this._step(`Cost of ${r.name || 'this reward'}`, r.cost, (v) => set((l) => { l[n].cost = v; }), { max: 5000, step: 5, unit: 'pts' })}
          <span class="schips"><button class="tap" aria-pressed=${String(r.approve ?? r.cost >= 60)} aria-label=${`${r.name || 'This reward'} needs a grown-up’s PIN`} @click=${() => set((l) => { l[n].approve = !(l[n].approve ?? l[n].cost >= 60); })}><span class="sbox2" aria-hidden="true">${(r.approve ?? r.cost >= 60) ? icon('check', 16) : nothing}</span>Needs PIN</button></span>
          ${this._move(r.name || 'reward', n, all.length, (to) => set((l) => { const [x] = l.splice(n, 1); l.splice(to, 0, x); }))}
          ${this._del(`Remove ${r.name || 'this reward'}`, () => set((l) => { l.splice(n, 1); }))}</div>`)}
        <div><button class="pill tap" data-act="reward-add" @click=${() => { const n = (list ?? DEFAULTS).length; set((l) => { l.push({ name: '', cost: 50 }); }); this._focusSoon(`rw.${i}.${n}.name`); }}>${icon('plus', 18)}Add a reward</button></div>
        <span class="shint">Without a tick, a reward under 60 points is spent by the child alone and one of 60 or more asks for the PIN. A reward named like “DJ” makes the child tonight’s DJ on the Music page.</span>
      </div>` : nothing}
      <div class="scard"><h3>${icon('jar', 20)}Family jar <span class="muted">shared by everyone</span></h3>
        ${this._row('Points to fill the jar', '', this._step('Points to fill the jar', jar.target ?? 200, (v) => this._edit((x) => { x.jar = { ...(x.jar ?? {}), target: v }; }), { min: 10, max: 5000, step: 10, unit: 'pts' }))}
        ${this._row('What a full jar earns', '', this._txt('jar.reward', 'What a full jar earns', jar.reward ?? '', (v) => this._edit((x) => { x.jar = { ...(x.jar ?? {}), reward: v }; if (!v) delete x.jar!.reward; }), { ph: 'e.g. Family movie night' }), true)}
      </div>`;
  }

  private _morning(): TemplateResult {
    const d = this._draft, m = d.morning ?? {}, kids = d.kids ?? [], k = kids[this._kid], i = this._kid;
    const setM = (fn: (m: NonNullable<Cfg['morning']>) => void): void => this._edit((x) => { x.morning = x.morning ?? {}; fn(x.morning); });
    const terms = d.school_terms ?? [], hols = d.public_holidays ?? [];
    const date = (id: string, label: string, v: string, set: (v: string) => void): TemplateResult => html`<input class="sin" type="date" data-f=${id} aria-label=${label} .value=${v} @input=${(e: Event) => set((e.target as HTMLInputElement).value)}>`;
    return html`<p class="sintro">The “Out the door” board takes over the panel on school mornings.</p>
      <div class="scard"><h3>School mornings</h3>
        ${this._row('The board shows from', '', html`${this._tm('Morning board starts', () => this._draft.morning?.start, (v) => setM((x) => { x.start = v; }), '06:30')}<span class="muted">to</span>${this._tm('Morning board ends', () => this._draft.morning?.end, (v) => setM((x) => { x.end = v; }), '08:45')}`)}
        ${this._row('Everyone leaves at', 'Unless a child has his own time below.', this._tm('Leaving time', () => this._draft.morning?.leave_by, (v) => setM((x) => { x.leave_by = v; }), '08:15'))}
        ${this._row('Travel time', 'Leave this long before a child’s first morning event.', this._step('Travel time', m.travel ?? 15, (v) => setM((x) => { x.travel = v; }), { max: 90, step: 5, unit: 'min' }))}
      </div>
      ${k ? html`<div class="scard"><h3>One child’s morning</h3>
        ${this._kidChips('Whose morning')}
        ${this._row(`${k.name} leaves at`, '', html`<div class="schips"><button class="tap" aria-pressed=${String(!k.leave_by)} @click=${() => this._edit((x) => { delete x.kids![i].leave_by; })}>With everyone (${t12(m.leave_by ?? '08:15')})</button></div>
          ${this._tm(`${k.name} leaves at`, () => this._draft.kids?.[i]?.leave_by, (v) => this._edit((x) => { x.kids![i].leave_by = v; }), m.leave_by ?? '08:15')}`)}
        <span class="label">Morning routine</span>
        ${this._jobs(k, 'am')}
        <span class="label">Things to bring, by day</span>
        ${WEEK.map(([key, name]) => { const list = k.bring?.[key] ?? [];
          return this._row(name, '', html`${list.map((s, n) => html`<span class="sitem" style="border:0;padding:0;min-height:0">${this._txt(`bring.${i}.${key}.${n}`, `${name}: thing ${n + 1}`, s, (v) => this._edit((x) => { x.kids![i].bring![key][n] = v; }), { cls: 'sgrow', ph: 'e.g. Library bag' })}${this._del(`Remove ${s || 'this'}`, () => this._edit((x) => { const b = x.kids![i].bring!; b[key].splice(n, 1); if (!b[key].length) delete b[key]; if (!Object.keys(b).length) delete x.kids![i].bring; }))}</span>`)}
            <button class="pill tap" aria-label=${`Add something to bring on ${name}`} @click=${() => { this._edit((x) => { const kk = x.kids![i]; kk.bring = kk.bring ?? {}; (kk.bring[key] = kk.bring[key] ?? []).push(''); }); this._focusSoon(`bring.${i}.${key}.${list.length}`); }}>${icon('plus', 18)}Add</button>`, true); })}
      </div>` : nothing}
      <div class="scard"><h3>School days</h3>
        <span class="shint">School days are Monday to Friday inside a term, except public holidays. With no terms listed, every weekday counts.</span>
        ${terms.map(([a, b], n) => html`<div class="sitem"><span class="sname">Term ${n + 1}</span><span class="sgrow"></span>${date(`term.${n}.a`, `Term ${n + 1} first day`, a, (v) => this._edit((x) => { x.school_terms![n][0] = v; }))}<span class="muted">to</span>${date(`term.${n}.b`, `Term ${n + 1} last day`, b, (v) => this._edit((x) => { x.school_terms![n][1] = v; }))}
          ${this._del(`Remove term ${n + 1}`, () => this._edit((x) => { x.school_terms!.splice(n, 1); if (!x.school_terms!.length) delete x.school_terms; }))}</div>`)}
        <div><button class="pill tap" @click=${() => this._edit((x) => { const y = new Date().getFullYear(); (x.school_terms = x.school_terms ?? []).push([`${y}-02-01`, `${y}-04-10`]); })}>${icon('plus', 18)}Add a term</button></div>
        <span class="label">Public holidays and days off for everyone</span>
        ${hols.map((h, n) => html`<div class="sitem"><span class="sgrow"></span>${date(`hol.${n}`, `Holiday ${n + 1}`, h, (v) => this._edit((x) => { x.public_holidays![n] = v; }))}${this._del('Remove this holiday', () => this._edit((x) => { x.public_holidays!.splice(n, 1); if (!x.public_holidays!.length) delete x.public_holidays; }))}</div>`)}
        <div><button class="pill tap" @click=${() => this._edit((x) => { const t = new Date(); (x.public_holidays = x.public_holidays ?? []).push(`${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`); })}>${icon('plus', 18)}Add a holiday</button></div>
      </div>`;
  }

  private _helpers(m: MedConfig): [string, string] { return [`input_datetime.fh_med_${m.id}`, `input_text.fh_med_${m.id}_by`]; }
  private async _makeHelpers(m: MedConfig): Promise<void> {
    if (this._busy || !this.hass) return;
    const [dt, tx] = this._helpers(m), S = this.hass.states;
    this._busy = `mk:${m.id}`;
    try {
      // Home Assistant names a helper's entity after the name it is given, so the name is the id the card looks for
      if (!S[dt]) { const r = await inTime(this.hass.callWS<{ id?: string }>({ type: 'input_datetime/create', name: `fh_med_${m.id}`, has_date: true, has_time: true, icon: 'mdi:pill' })); if (r?.id && r.id !== `fh_med_${m.id}`) throw new Error('name taken'); }
      if (!S[tx]) { const r = await inTime(this.hass.callWS<{ id?: string }>({ type: 'input_text/create', name: `fh_med_${m.id}_by`, max: 100, icon: 'mdi:account-check' })); if (r?.id && r.id !== `fh_med_${m.id}_by`) throw new Error('name taken'); }
      this._say(`Made the helpers for ${m.label}. It can be recorded now.`);
    } catch (e) { this._say(e instanceof SlowError ? `${SLOW_SAY} The helpers were not made.` : 'The helpers could not be made from here. Make the two listed in Home Assistant by hand.', { bad: true }); }
    this._busy = '';
  }
  private _medicines(): TemplateResult {
    const d = this._draft, meds = d.meds ?? [], kids = d.kids ?? [], extras = d.med_extras ?? ['Paracetamol', 'Ibuprofen'], S = this.hass?.states ?? {};
    const set = (fn: (l: MedConfig[]) => void): void => this._edit((x) => { fn(x.meds = x.meds ?? []); });
    const saved = new Set((this.config.meds ?? []).map((m) => m.id));
    return html`<p class="sintro">The medication sheet shows each of these when it is due and records who gave it. A medicine here is only a name and a time of day: amounts are never kept on the panel.</p>
      <div class="scard"><h3>Daily medicines</h3>
        ${meds.map((m, n) => { const [dt, tx] = this._helpers(m), miss = [dt, tx].filter((id) => !S[id]), isNew = !saved.has(m.id);
          return html`<div class="sitem" data-med=${n} style="align-items:flex-start">
            <div class="sgrow" style="display:flex;flex-direction:column;gap:8px">
              <div class="sitem" style="border:0;padding:0">${this._txt(`med.${n}.label`, `Medicine ${n + 1} name`, m.label, (v) => set((l) => { l[n].label = v; }), { cls: 'sgrow', ph: 'Name shown on the panel', bad: !m.label.trim() })}
                ${this._tm(`Time for ${m.label || 'this medicine'}`, () => this._draft.meds?.[n]?.time, (v) => set((l) => { l[n].time = v; }), '07:00')}${this._del(`Remove ${m.label || 'this medicine'}`, () => set((l) => { l.splice(n, 1); }))}</div>
              <div class="schips" role="group" aria-label=${`Who ${m.label || 'this medicine'} is for`}>${[...kids.map((k) => k.name), ''].map((who) => html`<button class="tap" aria-pressed=${String((m.who ?? '') === who)} @click=${() => set((l) => { if (who) l[n].who = who; else delete l[n].who; })}>${who || 'Anyone'}</button>`)}</div>
              ${isNew ? html`<span class="shint" role="note">New. After you save, it needs two helpers in Home Assistant before it can be recorded; Settings will offer to make them.</span>`
                : miss.length ? html`<div class="snote" role="note"><span><b>Not ready yet.</b> Home Assistant needs ${miss.length === 2 ? 'two helpers' : 'one more helper'} for this medicine, or it cannot be recorded:</span>
                  ${miss.map((id) => html`<span><code>${id}</code> ${id.startsWith('input_datetime') ? '(a date and time helper)' : '(a text helper)'}</span>`)}
                  <div class="sbtns" style="justify-content:flex-start"><button class="pill tap" data-act="med-helpers" ?data-busy=${this._busy === `mk:${m.id}`} ?disabled=${!!this._busy} @click=${() => void this._makeHelpers(m)}>Make ${miss.length === 2 ? 'them' : 'it'} now</button><span class="shint">Or make ${miss.length === 2 ? 'them' : 'it'} by hand: Settings, Devices and services, Helpers.</span></div></div>`
                : html`<span class="shint">${icon('check', 16)} Ready: its helpers are in Home Assistant.</span>`}
            </div></div>`; })}
        ${meds.length ? nothing : html`<span class="shint">No daily medicines yet.</span>`}
        <div><button class="pill tap" data-act="med-add" @click=${() => { const who = kids[0]?.name ?? ''; set((l) => { l.push({ id: medId(who, `med ${l.length + 1}`, l.map((x) => x.id)), label: '', time: '07:00', ...(who ? { who } : {}) }); }); this._focusSoon(`med.${meds.length}.label`); }}>${icon('plus', 18)}Add a medicine</button></div>
      </div>
      <div class="scard"><h3>Something else given</h3>
        <span class="shint">The names offered when a grown-up records another medicine. Names only.</span>
        ${this._strs('extra', 'medicine name', extras, (l) => this._edit((x) => { x.med_extras = l; }))}
      </div>`;
  }

  private _pinPane(): TemplateResult {
    const d = this._draft, has = !!this.config.parent_pin, p = this._pin, set = (k: 'cur' | 'next' | 'again') => (v: string): void => { this._pin = { ...p, [k]: v.slice(0, 8) }; this._err = ''; };
    const o = { digits: true, secret: true, cls: 'short', max: 8 } as const;
    return html`
      ${has ? html`<p class="sintro">The parent PIN opens Settings and guards the grown-ups’ jobs on the panel.</p>` : html`<div class="snote" role="note"><span><b>First, set a parent PIN.</b> Settings is for grown-ups, and the PIN is what keeps it that way. Choose 4 to 8 digits, then press Set the PIN. The other sections open once it is set.</span></div>`}
      <div class="scard"><h3>${has ? 'Change the PIN' : 'Set a parent PIN'}</h3>
        ${has ? this._row('Current PIN', '', this._txt('pin.cur', 'Current PIN', p.cur, set('cur'), o)) : nothing}
        ${this._row('New PIN', '4 to 8 digits.', this._txt('pin.next', 'New PIN', p.next, set('next'), { ...o, bad: !!p.next && !isPin(p.next) }))}
        ${this._row('New PIN again', '', this._txt('pin.again', 'New PIN again', p.again, set('again'), { ...o, bad: !!p.again && p.again !== p.next }))}
        <span class="shint">The PIN is kept in the card’s configuration, where it already lives. Anyone who can edit the dashboard can read it.</span>
      </div>
      ${has ? html`<div class="scard"><h3>What the PIN guards</h3>
        ${this._row('Recording medicine', 'Ask for the PIN before a medicine is recorded or a record is removed.', this._sw('PIN for recording medicine', d.meds_pin !== false, () => this._edit((x) => { if (x.meds_pin === false) delete x.meds_pin; else x.meds_pin = false; })))}
        ${d.chat?.agent ? this._row(`${d.chat.name || 'Ask'} after bedtime`, 'After any child’s bedtime and in quiet hours, the helper opens only with the PIN.', this._sw('PIN for Ask after bedtime', d.chat.pin_after_bedtime !== false, () => this._edit((x) => { if (x.chat!.pin_after_bedtime === false) delete x.chat!.pin_after_bedtime; else x.chat!.pin_after_bedtime = false; }))) : nothing}
        <span class="shint">Always behind the PIN: Settings, the look of the panel, a child’s settings, doors and garage, unticking an old job, and rewards marked “Needs PIN”.</span>
      </div>` : nothing}`;
  }

  /** Pick things Home Assistant knows about, by their own names. */
  private _picker(id: string, what: string, chosen: string[], domains: string[], set: (l: string[]) => void): TemplateResult {
    const S = this.hass?.states ?? {}, E = this.hass?.entities ?? {}, A = this.hass?.areas ?? {}, q = this._find.trim().toLowerCase();
    const all = Object.keys(S).filter((e) => domains.includes(e.split('.')[0]) && !E[e]?.hidden).map((e) => ({ id: e, name: this._name(e), area: A[E[e]?.area_id ?? '']?.name ?? '' }));
    for (const e of chosen) if (!S[e]) all.push({ id: e, name: e, area: 'Not found in Home Assistant' });
    const on = (e: string): boolean => chosen.includes(e);
    const shown = all.filter((x) => !q || `${x.name} ${x.area} ${x.id}`.toLowerCase().includes(q)).sort((a, b) => Number(on(b.id)) - Number(on(a.id)) || a.name.localeCompare(b.name));
    return html`<div class="sitem" style="border:0;padding:0"><span style="line-height:0;color:var(--ink2)">${icon('search', 22)}</span>${this._txt(`${id}.find`, `Search ${what}`, this._find, (v) => { this._find = v; }, { cls: 'sgrow', ph: `Search ${what}` })}<span class="stag" role="status">${chosen.length} chosen</span></div>
      <div class="spick" role="group" aria-label=${what}>${shown.map((x) => html`<button class="tap" data-e=${x.id} aria-pressed=${String(on(x.id))} @click=${() => set(on(x.id) ? chosen.filter((e) => e !== x.id) : [...chosen, x.id])}><span class="sbox2" aria-hidden="true">${on(x.id) ? icon('check', 16) : nothing}</span><span><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.name}</b>${x.area ? html`<small>${x.area}</small>` : nothing}</span></button>`)}</div>
      ${shown.length ? nothing : html`<span class="shint">Nothing matches “${this._find}”.</span>`}`;
  }
  private _house(): TemplateResult {
    const d = this._draft, night = d.night, q = d.quiet ?? {}, bins = d.bins, look = d.look ?? 'glass';
    const setBins = (fn: (b: NonNullable<Cfg['bins']>) => void): void => this._edit((x) => { x.bins = x.bins ?? { day: 1 }; fn(x.bins); });
    const names = [...new Set([...Object.keys(BIN_COL), ...(bins?.always ?? []), ...(bins?.alternate ?? [])].map((s) => s.toLowerCase()))];
    const binChips = (label: string, list: string[], set: (l: string[]) => void): TemplateResult => html`<div class="schips" role="group" aria-label=${label}>${names.map((n) => html`<button class="tap" aria-pressed=${String(list.map((s) => s.toLowerCase()).includes(n))} @click=${() => set(list.map((s) => s.toLowerCase()).includes(n) ? list.filter((s) => s.toLowerCase() !== n) : [...list, n])}><i class="sw6" style="background:${BIN_COL[n] ?? 'var(--ink2)'}" aria-hidden="true"></i>${n[0].toUpperCase() + n.slice(1)}</button>`)}</div>`;
    return html`
      <div class="scard"><h3>${icon('moon', 20)}Night</h3>
        ${this._row('Night screen', 'The panel goes dark between these times, and wakes for ten minutes when touched.', html`${this._sw('Night screen', !!night, () => this._edit((x) => { if (x.night) delete x.night; else x.night = { start: '21:00', end: '06:00' }; }))}
          ${night ? html`${this._tm('Night screen starts', () => this._draft.night?.start, (v) => this._edit((x) => { x.night!.start = v; }))}<span class="muted">to</span>${this._tm('Night screen ends', () => this._draft.night?.end, (v) => this._edit((x) => { x.night!.end = v; }))}` : nothing}`)}
        ${this._row('Quiet hours', 'Sounds are muted; the lights and Ask count as “after bedtime”.', html`${this._tm('Quiet hours start', () => this._draft.quiet?.start, (v) => this._edit((x) => { x.quiet = { ...(x.quiet ?? {}), start: v }; }), '20:00')}<span class="muted">to</span>${this._tm('Quiet hours end', () => this._draft.quiet?.end, (v) => this._edit((x) => { x.quiet = { ...(x.quiet ?? {}), end: v }; }), '06:30')}`)}
        <span class="shint">${q.start || q.end ? '' : 'Quiet hours are 8:00 pm to 6:30 am until you change them.'}</span>
      </div>
      <div class="scard"><h3>${icon('bin', 20)}Bin night</h3>
        ${this._row('Bins go out', 'Shown on the planner the evening before collection.', this._sw('Show bin night', !!bins, () => this._edit((x) => { if (x.bins) delete x.bins; else x.bins = { day: 1, always: ['green'], alternate: ['yellow', 'red'] }; })))}
        ${bins ? html`
          ${this._row('Collection day', '', html`<div class="schips" role="group" aria-label="Collection day">${DAYS.map((n, i) => html`<button class="tap" aria-pressed=${String(bins.day === i)} @click=${() => setBins((b) => { b.day = i; })}>${n.slice(0, 3)}</button>`)}</div>`)}
          ${this._row('Every week', '', binChips('Bins every week', bins.always ?? [], (l) => setBins((b) => { b.always = l; })))}
          ${this._row('Taking turns', (bins.alternate ?? []).length > 1 ? `In this order: ${(bins.alternate ?? []).join(', then ')}.` : 'Bins that go out week about.', binChips('Bins taking turns', bins.alternate ?? [], (l) => setBins((b) => { b.alternate = l; })))}
          ${(bins.alternate ?? []).length > 1 ? this._row(`A week the ${bins.alternate![0]} bin went out`, 'Any collection day it went out on: the turns are counted from there.', html`<input class="sin" type="date" aria-label="A collection day the first bin went out" .value=${bins.anchor ?? ''} @input=${(e: Event) => setBins((b) => { b.anchor = (e.target as HTMLInputElement).value; })}>`) : nothing}` : nothing}
      </div>
      <div class="scard"><h3>${icon('bulbOff', 20)}All off leaves these on</h3>
        <span class="shint">A night light or a fish tank that “All off” on the dock should never switch off.</span>
        ${this._picker('keep', 'lights and switches', d.keep_on ?? [], ['light', 'switch'], (l) => this._edit((x) => { if (l.length) x.keep_on = l; else delete x.keep_on; }))}
      </div>
      <div class="scard"><h3>${icon('palette', 20)}Look and feel <span class="muted">what a screen starts with</span></h3>
        ${this._row('Look', '', html`<div class="schips" role="group" aria-label="Look">${LOOKS.map((l) => html`<button class="tap" aria-pressed=${String(look === l.id)} @click=${() => this._edit((x) => { x.look = l.id; })}>${l.name}</button>`)}</div>`)}
        ${LOOKS.find((l) => l.id === look)?.themed ? this._row('Background', '', html`<div class="schips" role="group" aria-label="Background">${THEMES.map((t) => html`<button class="tap" aria-pressed=${String((d.theme ?? 'sea') === t.id)} @click=${() => this._edit((x) => { x.theme = t.id; })}>${t.name}</button>`)}</div>`) : nothing}
        ${this._row('Touch sounds', 'Timers and alarms always sound.', this._seg('Touch sounds', d.sounds === false ? 'off' : d.sounds === 'quiet' ? 'soft' : 'on', [['off', 'Off'], ['soft', 'Soft'], ['on', 'On']], (v) => this._edit((x) => { if (v === 'on') delete x.sounds; else x.sounds = v === 'off' ? false : 'quiet'; })))}
        ${this._row('Life behind the page', 'Twinkling stars, glints on the water, now and then a visitor.', this._sw('Life behind the page', d.ambient !== false, () => this._edit((x) => { if (x.ambient === false) delete x.ambient; else x.ambient = false; })))}
        ${this._row('Calm mode', 'No looping motion and no tilt.', this._seg('Calm mode', d.calm === true ? 'all' : d.calm === false ? 'never' : 'kids', [['kids', 'Children’s pages'], ['all', 'Everywhere'], ['never', 'Never']], (v) => this._edit((x) => { if (v === 'kids') delete x.calm; else x.calm = v === 'all'; })))}
        <span class="shint">Each screen can pick its own look and sounds with the palette button. Saving here sets this screen to match.</span>
      </div>
      <div class="scard"><h3>Words</h3>
        ${this._row('The family is called', 'Used in the greeting, as in “Good morning, everyone”.', this._txt('fam', 'What the family is called', d.family_name ?? '', (v) => this._edit((x) => { if (v) x.family_name = v; else delete x.family_name; }), { ph: 'everyone' }), true)}
        <span class="label">Private words</span><span class="shint">A calendar event with one of these words shows only as a discreet chip.</span>
        ${this._strs('priv', 'private word', d.private ?? [], (l) => this._edit((x) => { if (l.length) x.private = l; else delete x.private; }))}
        <span class="label">The usual shopping</span><span class="shint">One-tap suggestions on the shopping page.</span>
        ${this._strs('usual', 'usual item', d.grocery_usuals ?? [], (l) => this._edit((x) => { if (l.length) x.grocery_usuals = l; else delete x.grocery_usuals; }))}
      </div>`;
  }

  private _speakers(): string[] {
    const d = this._draft, ids = new Set<string>(d.music_players ?? []);
    for (const f of d.music_map ?? []) for (const r of f.rooms ?? []) { if (r.player) ids.add(r.player); for (const z of r.zones ?? []) ids.add(z.player); }
    if (!ids.size) for (const e of Object.keys(this.hass?.states ?? {})) if (e.startsWith('media_player.') && (this.hass?.entities?.[e] as { platform?: string } | undefined)?.platform === 'music_assistant') ids.add(e);
    for (const m of d.music_moments ?? []) if (Array.isArray(m.rooms)) m.rooms.forEach((r) => ids.add(r));
    return [...ids];
  }
  private _music(): TemplateResult {
    const d = this._draft, DEFAULTS: MomentConfig[] = [{ name: 'Dinner', find: 'dinner' }, { name: 'Dance', find: 'dance hits' }, { name: 'Tidy-up', find: 'motivation' }, { name: 'Wind down', find: 'sleep sounds' }];
    const list = d.music_moments, shown = list?.length ? list : DEFAULTS, spk = this._speakers();
    const set = (fn: (l: MomentConfig[]) => void): void => this._edit((x) => { if (!x.music_moments?.length) x.music_moments = clone(DEFAULTS); fn(x.music_moments); });
    return html`<p class="sintro">A moment is one press on the mixing desk that plays something for an occasion.</p>
      <div class="scard"><h3>Moments ${list?.length ? nothing : html`<span class="muted">the four starters, until you change them</span>`}</h3>
        ${shown.slice(0, 4).map((m, n, all) => { const where = m.rooms === 'all' ? 'all' : Array.isArray(m.rooms) && m.rooms.length ? 'some' : 'focus', rooms = Array.isArray(m.rooms) ? m.rooms : [];
          return html`<div class="sitem" data-moment=${n} style="align-items:flex-start"><div class="sgrow" style="display:flex;flex-direction:column;gap:8px">
            <div class="sitem" style="border:0;padding:0">${this._txt(`mo.${n}.icon`, `Picture for ${m.name || 'this moment'} (an emoji)`, m.icon ?? '', (v) => set((l) => { if (v) l[n].icon = v; else delete l[n].icon; }), { cls: 'pic', ph: '🎵', pic: true, max: 16 })}
              ${this._txt(`mo.${n}.name`, `Moment ${n + 1} name`, m.name, (v) => set((l) => { l[n].name = v; }), { cls: 'sgrow', ph: 'Name', bad: !m.name.trim() })}
              ${this._move(m.name || 'moment', n, all.length, (to) => set((l) => { const [x] = l.splice(n, 1); l.splice(to, 0, x); }))}${this._del(`Remove ${m.name || 'this moment'}`, () => set((l) => { l.splice(n, 1); }))}</div>
            ${this._row('What to play', m.uri ? 'This moment plays one exact thing (set in YAML). Typing here searches instead.' : 'Searched for in your music: a playlist unless you choose otherwise.', html`${this._txt(`mo.${n}.find`, `What ${m.name || 'this moment'} plays`, m.find ?? (m.uri ? '' : ''), (v) => set((l) => { l[n].find = v; if (v) delete l[n].uri; }), { ph: m.uri ? cut(m.uri, 30) : 'e.g. dinner jazz' })}
              ${this._seg(`Kind of music for ${m.name}`, m.kind ?? 'playlist', [['playlist', 'Playlist'], ['album', 'Album'], ['artist', 'Artist'], ['radio', 'Radio']], (v) => set((l) => { if (v === 'playlist') delete l[n].kind; else l[n].kind = v; }))}`, true)}
            ${this._row('Where', where === 'focus' ? 'Plays in the room chosen on the Music page.' : '', html`${this._seg(`Where ${m.name} plays`, where, [['focus', 'Room in focus'], ['all', 'Every room'], ['some', 'Chosen rooms']], (v) => set((l) => { if (v === 'focus') delete l[n].rooms; else if (v === 'all') l[n].rooms = 'all'; else l[n].rooms = spk.slice(0, 1); }))}`)}
            ${where === 'some' ? html`<div class="schips" role="group" aria-label=${`Rooms for ${m.name}`}>${spk.map((id) => html`<button class="tap" aria-pressed=${String(rooms.includes(id))} @click=${() => set((l) => { const r = Array.isArray(l[n].rooms) ? (l[n].rooms as string[]) : []; l[n].rooms = r.includes(id) ? r.filter((x) => x !== id) : [...r, id]; })}>${this._name(id)}</button>`)}</div>` : nothing}
            ${this._row('Volume', m.volume === undefined ? 'Left as the room already is.' : '', html`<div class="schips"><button class="tap" aria-pressed=${String(m.volume === undefined)} aria-label=${`Leave the volume as it is for ${m.name}`} @click=${() => set((l) => { if (l[n].volume === undefined) l[n].volume = 30; else delete l[n].volume; })}>As it is</button></div>
              ${m.volume === undefined ? nothing : this._range(`Volume for ${m.name}`, m.volume, (v) => set((l) => { l[n].volume = v; }))}`)}
            ${this._row('Shuffle', '', this._sw(`Shuffle ${m.name}`, !!m.shuffle, () => set((l) => { if (l[n].shuffle) delete l[n].shuffle; else l[n].shuffle = true; })))}
          </div></div>`; })}
        ${shown.length < 4 ? html`<div><button class="pill tap" data-act="moment-add" @click=${() => { const n = shown.length; set((l) => { l.push({ name: '', find: '' }); }); this._focusSoon(`mo.${n}.name`); }}>${icon('plus', 18)}Add a moment</button></div>` : html`<span class="shint">The desk has room for four moments.</span>`}
        <span class="shint">A pad that was given different music on a screen’s own Music page keeps that music on that screen.</span>
      </div>
      <div class="scard"><h3>Timers and calls</h3>
        ${this._row('Sleep timer', 'How long the Music page’s sleep timer runs.', this._step('Sleep timer', d.music_sleep_minutes ?? 30, (v) => this._edit((x) => { x.music_sleep_minutes = v; }), { min: 5, max: 180, step: 5, unit: 'min' }))}
        ${this._row('Call volume', 'How loudly “Call a room” speaks.', this._range('Call volume', d.call_volume ?? 70, (v) => this._edit((x) => { x.call_volume = v; })))}
        ${this._row('Tidy-up music', 'The song or playlist for timed jobs with music.', this._txt('tidy', 'Tidy-up music', d.tidy_song ?? '', (v) => this._edit((x) => { if (v) x.tidy_song = v; else delete x.tidy_song; }), { ph: 'e.g. Housework Hits' }), true)}
      </div>`;
  }

  /** The babysitter page as two plain lists, however it was written (lines such as "Dad: 0400 000 000" are contacts). */
  private _sitter(): { contacts: { name: string; phone: string }[]; notes: string[] } {
    const b = this._draft.babysitter ?? {}, phone = /^(.{1,40}?):\s*(\+?[\d ()-]{8,})$/;
    return { contacts: [...(b.contacts ?? []), ...(b.lines ?? []).map((l) => phone.exec(l)).filter((m): m is RegExpExecArray => !!m).map((m) => ({ name: m[1], phone: m[2].trim() }))], notes: [...(b.lines ?? []).filter((l) => !phone.test(l)), ...(b.notes ?? [])] };
  }
  private _setSitter(fn: (s: { contacts: { name: string; phone: string }[]; notes: string[] }) => void): void {
    const s = this._sitter(); fn(s);
    this._edit((x) => { const b = (x.babysitter = x.babysitter ?? {}); delete b.lines; if (s.contacts.length) b.contacts = s.contacts; else delete b.contacts; if (s.notes.length) b.notes = s.notes; else delete b.notes; });
  }
  private async _testAlert(): Promise<void> {
    const e = this._draft.emergency; if (!e?.notify?.length || !this.hass || this._busy) return;
    this._busy = 'test'; this._sure = '';
    const res = await Promise.allSettled(e.notify.map((svc) => { const [dom, s] = svc.includes('.') ? svc.split('.') : ['notify', svc]; return inTime(this.hass!.callService(dom, s, { title: 'Family Hub test', message: 'This is only a test of the alert button on the family panel. Nothing is wrong.' })); }));
    const bad = res.filter((r) => r.status === 'rejected').length;
    this._busy = '';
    this._say(bad ? `${bad} of ${res.length} phones did not get the test. Check the names below.` : `Test sent to ${res.length} phone${res.length === 1 ? '' : 's'}.`, { bad: !!bad });
  }
  private _people(): TemplateResult {
    const d = this._draft, b = d.babysitter ?? {}, e = d.emergency, s = this._sitter();
    const svcs = Object.keys(this.hass?.services?.notify ?? {}).filter((n) => !['notify', 'persistent_notification', 'send_message'].includes(n)).map((n) => `notify.${n}`), to = e?.notify ?? [];
    const setE = (fn: (e: NonNullable<Cfg['emergency']>) => void): void => this._edit((x) => { x.emergency = x.emergency ?? { notify: [] }; fn(x.emergency); if (!x.emergency.notify.length && !x.emergency.who && !x.emergency.message) delete x.emergency; });
    const setB = (fn: (b: NonNullable<Cfg['babysitter']>) => void): void => this._edit((x) => { fn(x.babysitter = x.babysitter ?? {}); });
    return html`
      <div class="scard"><h3>Parents</h3>
        <span class="shint">The grown-ups whose names are offered when a medicine is recorded.</span>
        ${this._strs('parent', 'parent', d.parents ?? [], (l) => this._edit((x) => { x.parents = l; }))}
      </div>
      <div class="scard"><h3>${icon('info', 20)}The house-info page <span class="muted">for babysitters and visitors</span></h3>
        ${this._row('Title', '', this._txt('sit.title', 'Title of the house-info page', b.title ?? '', (v) => setB((x) => { if (v) x.title = v; else delete x.title; }), { ph: 'House info' }), true)}
        ${this._row('Address', 'Read out to emergency services: “You are at …”.', this._txt('sit.addr', 'Address', b.address ?? '', (v) => setB((x) => { if (v) x.address = v; else delete x.address; }), { ph: 'Street address' }), true)}
        <span class="label">Who to ring</span>
        ${s.contacts.map((c, n) => html`<div class="sitem">${this._txt(`sit.c.${n}.name`, `Contact ${n + 1} name`, c.name, (v) => this._setSitter((x) => { x.contacts[n].name = v; }), { cls: 'sgrow', ph: 'Name' })}${this._txt(`sit.c.${n}.phone`, `Contact ${n + 1} number`, c.phone, (v) => this._setSitter((x) => { x.contacts[n].phone = v; }), { cls: 'sgrow', ph: 'Phone number' })}${this._del(`Remove ${c.name || 'this contact'}`, () => this._setSitter((x) => { x.contacts.splice(n, 1); }))}</div>`)}
        <div><button class="pill tap" @click=${() => { this._setSitter((x) => { x.contacts.push({ name: '', phone: '' }); }); this._focusSoon(`sit.c.${s.contacts.length}.name`); }}>${icon('plus', 18)}Add a contact</button></div>
        <span class="label">Wi-Fi for visitors</span>
        ${this._row('Network', '', this._txt('sit.wifi', 'Wi-Fi network', b.wifi?.name ?? '', (v) => setB((x) => { if (v) x.wifi = { ...(x.wifi ?? {}), name: v }; else delete x.wifi; })), true)}
        ${b.wifi ? this._row('Password', 'Shown in plain words on the house-info page.', this._txt('sit.wifipw', 'Wi-Fi password', b.wifi.password ?? '', (v) => setB((x) => { if (v) x.wifi!.password = v; else delete x.wifi!.password; })), true) : nothing}
        <span class="label">Good to know</span>
        ${this._strs('sit.note', 'note', s.notes, (l) => this._setSitter((x) => { x.notes = l; }))}
      </div>
      <div class="scard"><h3>${icon('alert', 20)}The alert button</h3>
        <span class="shint">The red hold-to-send button on the house-info page. It sounds on these phones even on silent.</span>
        ${this._row('It says “Alert …”', '', this._txt('sos.who', 'Who the alert button names', e?.who ?? '', (v) => setE((x) => { if (v) x.who = v; else delete x.who; }), { ph: 'the parents' }), true)}
        <span class="label">Phones to alert</span>
        <div class="spick" role="group" aria-label="Phones to alert">${[...new Set([...svcs, ...to])].map((id) => html`<button class="tap" aria-pressed=${String(to.includes(id))} @click=${() => setE((x) => { x.notify = x.notify.includes(id) ? x.notify.filter((n) => n !== id) : [...x.notify, id]; })}><span class="sbox2" aria-hidden="true">${to.includes(id) ? icon('check', 16) : nothing}</span><span><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${id.replace(/^notify\.(mobile_app_)?/, '').replace(/_/g, ' ')}</b><small>${svcs.includes(id) ? id : 'Not found in Home Assistant'}</small></span></button>`)}</div>
        ${svcs.length || to.length ? nothing : html`<span class="shint">Home Assistant has no phones to notify yet. Install the Home Assistant app on a phone and sign in; it then appears here.</span>`}
        ${to.length ? this._sure === 'test'
          ? html`<div class="snote" role="alertdialog" aria-label="Send a test alert"><span><b>Send a test to ${to.length} phone${to.length === 1 ? '' : 's'} now?</b> It is an ordinary message that says it is only a test.</span><div class="sbtns" style="justify-content:flex-start"><button class="pill tap primary" data-act="test-send" ?disabled=${!!this._busy} @click=${() => void this._testAlert()}>Send the test</button><button class="pill tap" @click=${() => { this._sure = ''; }}>Cancel</button></div></div>`
          : html`<div><button class="pill tap" data-act="test" ?disabled=${!!this._busy || this._dirty} @click=${() => { this._sure = 'test'; }}>Send a test…</button>${this._dirty ? html` <span class="shint">Save first.</span>` : nothing}</div>` : nothing}
      </div>
      <div class="scard"><h3>${icon('ask', 20)}Ask and the internet</h3>
        ${d.chat?.agent ? this._row('The helper is called', 'The name on the speech-bubble button.', this._txt('chat.name', 'What the helper is called', d.chat.name ?? '', (v) => this._edit((x) => { if (v) x.chat!.name = v; else delete x.chat!.name; }), { ph: 'Ask' }), true) : html`<span class="shint">Ask (the children’s AI helper) is not set up. It is added in YAML, with a conversation agent from Home Assistant.</span>`}
        ${d.chat?.agent ? html`<span class="shint">What the helper may talk about is set in Home Assistant, on the agent itself. Whether it needs the PIN after bedtime is under PIN.</span>` : nothing}
        ${this._row('Look up places', 'When adding an event, search for addresses on the internet as they are typed.', this._sw('Look up places on the internet', d.address_search !== false, () => this._edit((x) => { if (x.address_search === false) delete x.address_search; else x.address_search = false; })))}
      </div>`;
  }

  private _advanced(): TemplateResult {
    const c = this.config as unknown as Record<string, unknown>, a = this._access, kids = this.config.kids ?? [];
    const say = (v: unknown): string => v === undefined ? 'Not set' : typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v)
      : Array.isArray(v) ? (v.length ? cut(v.map((x) => (typeof x === 'string' ? x : (x as { entity?: string; name?: string })?.entity ?? (x as { name?: string })?.name ?? '…')).join(', '), 160) : 'None') : cut(Object.entries(v as Record<string, unknown>).filter(([k]) => !/password|pin/i.test(k)).map(([k, x]) => `${k}: ${typeof x === 'object' ? '…' : String(x)}`).join(', '), 160);
    const versions = [...this._hist, ...(a?.previous && !this._hist.some((h) => same(h.config, a.previous!.config)) ? [a.previous] : [])];
    const path = this.hass ? dashPath(this.hass) : null;
    return html`<p class="sintro">These are the wires behind the panel: which calendars, lists, speakers and scripts it uses. They are changed in the card’s YAML (edit the dashboard, then the Family Hub card), not here.</p>
      <div class="scard"><h3>Where this is saved</h3>
        <div class="sadv"><b>Dashboard</b><span>${path ?? 'The default dashboard'}</span><b>You are</b><span>${this.hass?.user?.name ?? 'Unknown'}${this.hass?.user?.is_admin ? ' (administrator)' : ' (not an administrator)'}</span><b>Settings can save</b><span>${a ? (a.ok ? 'Yes' : `No: ${BLOCKED[a.why ?? 'offline'][0].toLowerCase()}`) : 'Checking…'}</span></div>
      </div>
      <div class="scard"><h3>Restore an earlier version</h3>
        <span class="shint">Before every save the card is kept as it was: the last five on this screen, and the one before the latest change in the dashboard itself. Restoring never changes the PIN.</span>
        ${versions.map((v) => { const id = `restore:${v.from}:${v.t}`; return html`<div class="sitem" data-version=${v.t}><span class="sgrow" style="display:flex;flex-direction:column;line-height:1.3"><span class="sname">${when(v.t)}</span><span class="shint">${v.from === 'dashboard' ? 'Kept in the dashboard: the card before the latest change' : `Before a change to ${v.what}`}</span></span>
          ${this._sure === id ? html`<button class="pill tap primary" data-act="restore-yes" ?disabled=${!!this._busy || this._ro} @click=${() => this._restore(v)}>Yes, restore it</button><button class="pill tap" @click=${() => { this._sure = ''; }}>Cancel</button>` : html`<button class="pill tap" data-act="restore" ?disabled=${!!this._busy || this._ro} @click=${() => { this._sure = id; }}>Restore…</button>`}</div>`; })}
        ${versions.length ? nothing : html`<span class="shint">Nothing has been changed from Settings yet.</span>`}
      </div>
      <div class="scard"><h3>Wired up in YAML</h3>
        <div class="sadv">${WIRING.filter(([k]) => c[k] !== undefined).map(([k, n]) => html`<b>${n}</b><span><code>${k}</code>: ${say(c[k])}</span>`)}
          ${kids.map((k) => { const e = kidEntities(k); return html`<b>${k.name}’s helpers</b><span>${[e.chores, e.points, e.lifetime, e.streak, e.avatar, e.calendar].map((id) => html`<code>${id}</code>${this.hass?.states[id] ? '' : ' (missing)'} `)}</span>`; })}</div>
        <span class="shint">Adding or removing a child, a calendar or a speaker is also done in YAML: each needs entities in Home Assistant first.</span>
      </div>`;
  }

  /* ---------------- the page ---------------- */

  private _foot(): TemplateResult {
    const ro = this._ro, a = this._access, busy = this._busy === 'save' || this._busy === 'undo', noPin = !this.config.parent_pin;
    if (!a) return html`<div class="sft"><span class="sstate" role="status">Checking that this screen can save…</span></div>`;
    if (ro) return html`<div class="sft"><span class="sstate" role="status">${icon('lock', 20)}<span>Read only: ${BLOCKED[a.why ?? 'offline'][0].toLowerCase()}.</span></span><button class="lead tap" data-act="done" @click=${() => this._close()}>Close</button></div>`;
    if (a.latest) return html`<div class="sft"><span class="sstate bad" role="alert">This card was changed on another screen. Load what the dashboard has now; changes not saved here will be lost.</span><button class="lead tap" data-act="latest" @click=${() => this._loadLatest()}>Load the latest</button></div>`;
    if (this._ask) return html`<div class="sft" role="alertdialog" aria-label="Unsaved changes"><span class="sstate"><i class="sdot" aria-hidden="true"></i><span><b>You have unsaved changes.</b> Save them before leaving?</span></span>
      <button class="pill tap" data-act="stay" @click=${() => { this._ask = null; }}>Keep editing</button><button class="pill tap danger" data-act="discard" @click=${() => { const run = this._ask!; this._ask = null; this._discard(); run(); }}>Discard</button>
      <button class="lead tap" data-act="save" ?data-busy=${busy} ?disabled=${busy} @click=${() => { const run = this._ask!; void this._save(run); }}>${busy ? 'Saving…' : 'Save'}</button></div>`;
    const dirty = this._dirty;
    return html`<div class="sft"><span class="sstate ${this._err ? 'bad' : ''}" role=${this._err ? 'alert' : 'status'}>${this._err ? this._err : dirty ? html`<i class="sdot" aria-hidden="true"></i>Unsaved changes` : this._pane === 'advanced' ? 'Nothing to save on this page.' : html`${icon('check', 20)}All saved`}</span>
      ${dirty ? html`<button class="pill tap" data-act="discard" ?disabled=${busy} @click=${() => this._discard()}>Discard</button>` : nothing}
      ${this._pane === 'advanced' && !dirty ? html`<button class="lead tap" data-act="done" @click=${() => this._close()}>Done</button>` : html`<button class="lead tap" data-act="save" ?data-busy=${busy} aria-busy=${busy ? 'true' : 'false'} ?disabled=${!dirty || busy} @click=${() => void this._save()}>${busy ? 'Saving…' : noPin ? 'Set the PIN' : 'Save'}</button>`}</div>`;
  }
  private _keysView(): TemplateResult | typeof nothing {
    const f = this._fields.get(this._kb); if (!this._kb || !f || !this._osk) return nothing;
    const type = (k: string): void => { const cur = this._fields.get(this._kb); if (!cur) return; const [t, caps] = typeKey(cur.get(), k, this._caps); cur.set(cur.digits ? t.replace(/\D/g, '') : t); this._caps = caps; this.requestUpdate(); };
    const done = html`<button class="pill tap" data-act="keys-done" style="height:48px" @click=${() => { this._kb = ''; }}>Done</button>`;
    if (f.digits) return html`<div class="skeys" @pointerdown=${(e: Event) => e.preventDefault()}><div class="sdig" role="group" aria-label="Number keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => k ? html`<button class="key" aria-label=${k === 'del' ? 'Delete' : k} @click=${() => { sfx(k === 'del' ? 'del' : 'pin'); type(k); }}>${k === 'del' ? icon('backspace', 24) : k}</button>` : html`<span></span>`)}</div>${done}</div>`;
    return html`<div class="skeys" @pointerdown=${(e: Event) => e.preventDefault()}>${keyboard(type, this._caps, () => { this._caps = !this._caps; }, true, true, true)}${done}</div>`;
  }
  render() {
    if (!this._draft) return nothing;
    this._fields.clear();
    const p = PANES.find((x) => x.id === this._pane)!, ro = this._ro, a = this._access, locked = !this.config.parent_pin && !ro;
    const body = this._pane === 'children' ? this._children() : this._pane === 'rewards' ? this._rewards() : this._pane === 'morning' ? this._morning() : this._pane === 'medicines' ? this._medicines() : this._pane === 'pin' ? this._pinPane() : this._pane === 'house' ? this._house() : this._pane === 'music' ? this._music() : this._pane === 'people' ? this._people() : this._advanced();
    const note = getNote(); void this._tick;
    const dirty = this._dirty;
    return html`<div class="glass sheet sbox" role="dialog" aria-modal="true" aria-label="Settings" @click=${(e: Event) => e.stopPropagation()}>
      <div class="shd"><div style="min-width:0"><h2 class="t-head"><span style="color:var(--accent);line-height:0">${icon('cog', 26)}</span>Settings</h2><span class="muted">For grown-ups. ${p.sub}.</span></div>
        <button class="round tap xbtn" aria-label="Close settings" @click=${() => this._close()}>${icon('close', 20)}</button></div>
      <nav class="snav" aria-label="Sections">${PANES.map((x) => { const off = locked && x.id !== 'pin' && x.id !== 'advanced';
        return html`<button class="tap" data-pane=${x.id} aria-current=${x.id === this._pane ? 'page' : 'false'} aria-disabled=${off ? 'true' : 'false'} aria-label=${`${x.name}${off ? ' (set a PIN first)' : x.id === this._pane && dirty ? ', unsaved changes' : ''}`} @click=${() => this._go(x.id)}>${paneIcon(x.ic)}<span>${x.name}</span>${x.id === this._pane && dirty && !ro ? html`<i class="sdot" aria-hidden="true"></i>` : nothing}</button>`; })}</nav>
      <fieldset class="spane" data-pane=${this._pane} aria-label=${p.name} ?disabled=${(ro && this._pane !== 'advanced') || this._busy === 'save' || this._busy === 'undo'}>
        ${ro && a ? html`<div class="snote ro" role="note"><span><b>${BLOCKED[a.why ?? 'offline'][0]}.</b> ${BLOCKED[a.why ?? 'offline'][1]}</span></div>` : nothing}
        ${body}
      </fieldset>
      ${this._foot()}
      ${this._keysView()}
      ${this._time ? this._dial() : nothing}
      ${note ? html`<div class="toast" role="status" data-bad=${note.bad ? '1' : nothing}><span>${note.msg}</span>${note.undo && !this._ro ? html`<button class="tap" data-act="undo" ?disabled=${!!this._busy} @click=${() => this._undo()}>Undo</button>` : nothing}</div>` : nothing}
    </div>`;
  }
}
if (!customElements.get('fh-settings')) customElements.define('fh-settings', FhSettings);
