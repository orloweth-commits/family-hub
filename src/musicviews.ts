import { html, svg, css, nothing, type TemplateResult } from 'lit';
import { icon, solid } from './icons';
import type { ShelfItem } from './ma';

/* ------------------------------------------------------------------ *
 * Ways to see the rooms on the Music page. Each one is a drawing and a
 * set of gestures over the same few actions (Ctx): set a room's volume,
 * add or drop a room, pause or play, carry the music or a record to a room.
 * The house and the list live in music.ts; the others are here.
 * Every volume control, whatever its shape, is one family (see volCtl).
 * ------------------------------------------------------------------ */

export type ViewId = 'house' | 'dial' | 'desk' | 'cables' | 'scene' | 'list';
export const VIEWS: { id: ViewId; name: string; icon: string; about: string; hint: string }[] = [
  { id: 'house', name: 'House', icon: 'home', about: 'Rooms where they are', hint: 'Carry the music to a room. Slide for volume.' },
  { id: 'scene', name: 'Scene', icon: 'scene', about: 'The theme comes alive', hint: '' },
  { id: 'dial', name: 'Dial', icon: 'dial', about: 'One big knob and a tuner', hint: 'Drag round an arc for volume. Tap it to add the room.' },
  { id: 'desk', name: 'Desk', icon: 'desk', about: 'Faders, a jog wheel and pads', hint: 'Slide a fader for volume. Turn the wheel to move the song.' },
  { id: 'cables', name: 'Crate', icon: 'sleeve', about: 'Records, a turntable and cables', hint: 'Flick through the crate. Drop a record on the turntable.' },
  { id: 'list', name: 'List', icon: 'list', about: 'Plain tiles', hint: 'Tap a room to control it. ＋ adds it to the music.' }
];
const SCENE_HINT: Record<string, string> = { sea: 'Sail two boats together to share the music.', reef: 'Swim two fish together to share the music.', space: 'Drag a planet onto an orbit to join that music.', bush: 'Move two fires together to share the music.',
  sunset: 'Fly two kites together to share the music.', fridge: 'Push two magnets together to share the music.', orbit: 'Drag a planet onto an orbit to join that music.' };
export const sceneKind = (look: string, theme: string): string => (look === 'glass' ? (SCENE_HINT[theme] ? theme : 'sea') : look === 'fridge' ? 'fridge' : 'orbit');
export const viewHint = (id: ViewId, look: string, theme: string): string => (id === 'scene' ? SCENE_HINT[sceneKind(look, theme)] : VIEWS.find((v) => v.id === id)?.hint ?? '');

export interface Room { id: string; name: string; /** the speaker this room's music comes from, or '' */ stream: string; vol: number; hasVol: boolean; live: boolean; playing: boolean; focus: boolean; inmix: boolean; /** plays the music in the player (the room that leads it included) */ on: boolean; /** grouped with at least one other room, whichever room is selected */ linked: boolean; /** a home speaker that cannot be reached right now */ offline: boolean; asleep: boolean; lead: boolean; colour: string; title: string }
export interface Ctx {
  rooms: Room[]; look: string; theme: string; /** a narrow screen: the shelf runs along the bottom, so the rooms have the full width */ phone: boolean; /** a phone or a portrait tablet: rooms stand in rows rather than one line */ narrow: boolean; over: string; lifted: string; liftedItem: ShelfItem | null;
  /** the pieces of music playing, the one in the player first (each named by its leading speaker) */
  streams: string[];
  /** a room being carried round the scene, in percent of the scene */
  sdrag: { id: string; x: number; y: number } | null; setDrag(d: { id: string; x: number; y: number } | null): void;
  join(id: string, lead: string): void; leave(id: string): void;
  now: { title: string; artist: string; art: string; playing: boolean; frac: number; lead: string };
  shelf: ShelfItem[];
  /** the record crate: a divider per person, that person's records, and which one is at the front */
  crate: { tabs: { name: string; colour: string }[]; who: string; pick(name: string): void; items: ShelfItem[]; at: number; tap(i: number): void; play(m: ShelfItem): void; flick(i: number): void; calm: boolean; room: string };
  prev(): void; next(): void;
  /** the big dial's surroundings: what plays next, whose turn it is to choose, the sleep fade, and a tuner across favourites and stations */
  dial: { next: { title: string; sub: string; art: string }[]; more: number; turn: { name: string; face: TemplateResult; colour: string; now: boolean }[]; chooser: string; choose(name: string): void;
    sleep: { mins: number; left: number | null; /** the room that will fade */ room: string; /** false when that speaker cannot be reached */ can: boolean }; sleepGo(): void; stops: { name: string; on: boolean }[]; tune(i: number): void };
  /** the mixing desk: four moment pads and a jog wheel */
  moments: { name: string; icon: string; on: boolean; busy: boolean }[]; moment(i: number): void;
  jog: { turn: number | null; at: number; read: string; len: number; says: string }; jogTo(turn: number, commit: boolean): void; seekBy(seconds: number): void;
  /** show a volume while dragging, then keep it */
  vol(id: string, v: number, commit: boolean): void;
  /** one step louder or quieter (the end buttons of every volume control) */
  step(id: string, by: number): void;
  /** a drag that was called off (the page scrolled instead): show what the speaker really has */
  drop(id: string): void;
  /** the room whose volume is being dragged right now */
  held: string;
  /** add the room to the music, or take it out */
  toggle(id: string): void; focus(id: string): void; playPause(): void; all(): void;
  carry(e: PointerEvent, id: string): void; carryItem(e: PointerEvent, m: ShelfItem, flick?: (dx: number) => void): void; playItem(m: ShelfItem): void;
}

const clamp = (v: number): number => Math.max(0, Math.min(100, Math.round(v)));
/** A finger must travel this far before a press stops being a tap. */
export const TAP_SLOP = 16;
/** Follow one finger from press to release. `end` hears whether it moved (a press that did not move is a tap) and whether the browser took the gesture away (a scroll). */
const track = (e: PointerEvent, move: (m: PointerEvent) => void, end: (moved: boolean, m: PointerEvent, cancelled: boolean) => void, slop = 6): void => {
  const el = e.currentTarget as Element, x0 = e.clientX, y0 = e.clientY; let moved = false;
  const mv = (ev: Event): void => { const m = ev as PointerEvent; if (!moved && Math.hypot(m.clientX - x0, m.clientY - y0) < slop) return; moved = true; move(m); };
  const up = (ev: Event): void => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); end(moved, ev as PointerEvent, ev.type === 'pointercancel'); };
  el.setPointerCapture(e.pointerId); el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
};

/* ---------------- one family of volume controls ---------------- *
 * Whatever the drawing (a rail, a fader, a knob, an arc, a waterline), a volume control has: a 44 px place to
 * touch, a fill up to the value (--v), a 32 px thumb, the number beside it, and a quieter and a louder button
 * at its ends that step by 5. A room with no music has a hollow thumb and no fill. Nothing changes until the
 * finger has travelled 10 px along the control, so a scroll that starts on one stays a scroll.               */
const INTENT = 10, STEP = 5;
/** The end icons: a speaker with a minus, a speaker with a plus. */
export const spk = (loud: boolean): TemplateResult => html`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5v5h3.2L11 18.5v-13L6.2 9.5z" fill="currentColor"></path><path d=${loud ? 'M15 12h6M18 9v6' : 'M15 12h6'}></path></svg>`;
export const stepBtn = (name: string, v: number, loud: boolean, go: () => void): TemplateResult => html`<button class="vstep tap" data-notrack data-step=${loud ? 'up' : 'down'} aria-label="${loud ? 'Louder' : 'Quieter'} in ${name}" ?disabled=${loud ? v >= 100 : v <= 0}
  @pointerdown=${(e: Event) => e.stopPropagation()} @click=${(e: Event) => { e.stopPropagation(); go(); }}>${spk(loud)}</button>`;
/** Arrow keys step by 5, Page keys by 10, Home and End go to the ends. Any other key goes to `more`. */
export const volKey = (v: number, set: (v: number) => void, more?: (e: KeyboardEvent) => void) => (e: KeyboardEvent): void => {
  const k = e.key, to = k === 'ArrowUp' || k === 'ArrowRight' ? v + STEP : k === 'ArrowDown' || k === 'ArrowLeft' ? v - STEP : k === 'PageUp' ? v + 10 : k === 'PageDown' ? v - 10 : k === 'Home' ? 0 : k === 'End' ? 100 : null;
  if (to !== null) { e.preventDefault(); e.stopPropagation(); set(clamp(to)); } else more?.(e);
};
export interface Vol { name: string; v: number; /** music is on in this room */ live: boolean; vert?: boolean; held?: boolean; set(v: number, commit: boolean): void; /** the gesture was taken away: forget what was shown */ drop?(): void }
/** Follow a finger along a rail. A tap sets the value where it landed; a drag starts after 10 px along the rail and is dropped if the finger goes across it first. */
const railDown = (o: Vol) => (e: PointerEvent): void => {
  if (!e.isPrimary || e.button > 0) return;
  const rail = e.currentTarget as HTMLElement, b = rail.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY, onThumb = !!(e.target as Element).closest('.fcap'), T = 16;
  const at = (m: PointerEvent): number => (o.vert ? (b.bottom - T - m.clientY) / Math.max(1, b.height - 2 * T) : (m.clientX - b.left - T) / Math.max(1, b.width - 2 * T)) * 100;
  const off = onThumb ? o.v - at(e) : 0; let on = false, dead = false, v = o.v;
  const mv = (ev: Event): void => {
    const m = ev as PointerEvent, dx = Math.abs(m.clientX - x0), dy = Math.abs(m.clientY - y0), along = o.vert ? dy : dx, across = o.vert ? dx : dy;
    if (dead) return;
    if (!on) { if (across >= INTENT && across > along) { dead = true; return; } if (along < INTENT) return; on = true; }
    v = clamp(at(m) + off); o.set(v, false);
  };
  const up = (ev: Event): void => {
    rail.removeEventListener('pointermove', mv); rail.removeEventListener('pointerup', up); rail.removeEventListener('pointercancel', up);
    if (ev.type === 'pointercancel' || dead) { if (on) o.drop?.(); return; }
    if (on) o.set(v, true); else if (!onThumb) o.set(clamp(at(ev as PointerEvent)), true);
  };
  rail.setPointerCapture(e.pointerId); rail.addEventListener('pointermove', mv); rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up);
};
/** The plain member of the family: quieter, a rail with its fill and thumb, louder, the number. Lying down by default; `vert` stands it up (a fader). */
export const volCtl = (o: Vol): TemplateResult => html`<div class="vs" ?data-vert=${!!o.vert} ?data-idle=${!o.live} ?data-held=${!!o.held} style="--v:${o.v}">
  ${stepBtn(o.name, o.v, false, () => o.set(clamp(o.v - STEP), true))}
  <div class="vrail" role="slider" tabindex="0" aria-label="Volume in ${o.name}" aria-orientation=${o.vert ? 'vertical' : 'horizontal'} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${o.v} aria-valuetext="${o.v}${o.live ? '' : ', quiet'}"
    @pointerdown=${railDown(o)} @keydown=${volKey(o.v, (v) => o.set(v, true))}><i class="slot"></i><i class="vfill"></i><i class="fcap"><b aria-hidden="true">${o.v}</b></i></div>
  ${stepBtn(o.name, o.v, true, () => o.set(clamp(o.v + STEP), true))}
  <b class="vnum" aria-hidden="true">${o.v}</b></div>`;
const roomVol = (c: Ctx, r: Room, vert = false): TemplateResult => volCtl({ name: r.name, v: r.vol, live: r.live, vert, held: c.held === r.id, set: (v, commit) => c.vol(r.id, v, commit), drop: () => c.drop(r.id) });
const steps = (c: Ctx, r: Room): [TemplateResult, TemplateResult] => [stepBtn(r.name, r.vol, false, () => c.step(r.id, -STEP)), stepBtn(r.name, r.vol, true, () => c.step(r.id, STEP))];
/** Up and down changes a room's volume once the finger has clearly set off that way; a tap does `tap`. */
const slide = (c: Ctx, r: Room, len: (el: Element) => number, tap?: () => void) => (e: PointerEvent): void => {
  if (!e.isPrimary || (e.target as Element).closest('[data-notrack]')) return;
  if (!r.hasVol) { track(e, () => { /* nothing to slide */ }, (moved, _m, cancelled) => { if (!moved && !cancelled) tap?.(); }, TAP_SLOP); return; }
  const v0 = r.vol, y0 = e.clientY, h = Math.max(40, len(e.currentTarget as Element)), at = (m: PointerEvent): number => clamp(v0 + ((y0 - m.clientY) / h) * 100);
  track(e, (m) => c.vol(r.id, at(m), false), (moved, m, cancelled) => { if (cancelled) c.drop(r.id); else if (moved) c.vol(r.id, at(m), true); else tap?.(); }, INTENT);
};
/** Keys on a room's volume control: the arrows change the volume, Enter adds or drops the room. */
const keys = (c: Ctx, r: Room) => (e: KeyboardEvent): void => {
  const enter = (k: KeyboardEvent): void => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); c.toggle(r.id); } };
  if (r.hasVol) volKey(r.vol, (v) => c.vol(r.id, v, true), enter)(e); else enter(e);
};
/** One word for what a room is doing. A room with nothing on is "Quiet" in every view. */
const state = (r: Room): string => (r.offline ? 'Offline' : r.live ? (r.playing ? 'Playing' : 'Paused') : r.asleep ? 'Asleep' : 'Quiet');
const vtext = (r: Room): string => `${r.vol}, ${state(r).toLowerCase()}`;
const col = (r: Room): string => (r.colour ? `--c:${r.colour}` : '');
/** Rooms that play together carry this mark, whichever room is selected. */
const link = (r: Room): TemplateResult | typeof nothing => (r.linked ? html`<i class="linkd" role="img" aria-label="linked with another room"></i>` : nothing);
/** Previous, play and next: the same three round keys wherever a small player is shown. */
export const miniKeys = (playing: boolean, prev: () => void, toggle: () => void, next: () => void): TemplateResult => html`<span class="mkeys"><button class="mkey tap" aria-label="Previous" @click=${prev}>${solid('prev', 22)}</button>
  <button class="mkey go ngo tap" aria-label=${playing ? 'Pause' : 'Play'} @click=${toggle}>${solid(playing ? 'pause' : 'play', 22)}</button>
  <button class="mkey tap" aria-label="Next" @click=${next}>${solid('next', 22)}</button></span>`;

/* ---------------- the big dial ---------------- */
const pol = (r: number, deg: number): [number, number] => [200 + r * Math.cos((deg * Math.PI) / 180), 200 + r * Math.sin((deg * Math.PI) / 180)];
const arc = (r: number, a0: number, a1: number): string => { const [x0, y0] = pol(r, a0), [x1, y1] = pol(r, a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };

export const dialView = (c: Ctx): TemplateResult => {
  const n = c.rooms.length, seg = 360 / Math.max(n, 3), gap = 9, C = 2 * Math.PI * 106;
  const down = (r: Room, a0: number, span: number) => (e: PointerEvent): void => {
    const box = (e.currentTarget as SVGElement).ownerSVGElement!;
    const at = (m: PointerEvent): number => {
      const b = box.getBoundingClientRect(), a = (Math.atan2(m.clientY - (b.top + b.height / 2), m.clientX - (b.left + b.width / 2)) * 180) / Math.PI;
      const rel = (((a - a0) % 360) + 360) % 360;
      return clamp(((rel > span + (360 - span) / 2 ? 0 : Math.min(rel, span)) / span) * 100);
    };
    if (!r.hasVol) { track(e, () => { /* fixed volume */ }, (moved, _m, cancelled) => { if (!moved && !cancelled) c.toggle(r.id); }, TAP_SLOP); return; }
    track(e, (m) => c.vol(r.id, at(m), false), (moved, m, cancelled) => { if (cancelled) c.drop(r.id); else if (moved) c.vol(r.id, at(m), true); else c.toggle(r.id); }, INTENT);
  };
  const d = c.dial, ns = d.stops.length, onAt = d.stops.findIndex((s) => s.on), stopX = (i: number): number => ((i + 0.5) / Math.max(1, ns)) * 100;
  // the tuner: slide the needle along the strip; it settles on the nearest stop and plays it (unless that one is already playing). A tap on a stop does the same.
  const tuneDown = (e: PointerEvent): void => {
    const el = e.currentTarget as HTMLElement, needle = el.querySelector<HTMLElement>('.tneedle'), b = el.getBoundingClientRect();
    const frac = (m: PointerEvent): number => Math.max(0, Math.min(1, (m.clientX - b.left) / b.width)), nearest = (m: PointerEvent): number => Math.max(0, Math.min(ns - 1, Math.round(frac(m) * ns - 0.5)));
    if (!ns) return;
    track(e, (m) => { if (needle) { needle.style.transition = 'none'; needle.style.left = `${frac(m) * 100}%`; } }, (_moved, m, cancelled) => { const to = cancelled ? onAt : nearest(m); if (needle) { needle.style.transition = ''; needle.style.left = `${to < 0 ? 2 : stopX(to)}%`; } if (!cancelled) d.tune(to); }, 4);
  };
  const tuneKey = (e: KeyboardEvent): void => { const s = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0; if (s && ns) { e.preventDefault(); d.tune(Math.max(0, Math.min(ns - 1, (onAt < 0 ? (s > 0 ? -1 : ns) : onAt) + s))); } };
  const left = d.sleep.left, wedge = left === null ? 0 : Math.max(0.02, Math.min(1, left / Math.max(1, d.sleep.mins))), wa = wedge * 2 * Math.PI, wx = 20 + 16 * Math.sin(wa), wy = 20 - 16 * Math.cos(wa);
  return html`<div class="dialwrap">
    <section class="dcard dnext" aria-label="Up next"><h3>Up next</h3>
      ${d.next.length ? d.next.map((n) => html`<div class="dn"><i class="puck onshelf" style="--art:${n.art ? `url(${n.art})` : 'linear-gradient(135deg, var(--p-3), var(--p-5))'}"></i><span><b>${n.title}</b><span>${n.sub}</span></span></div>`)
        : html`<p class="dnone">Nothing queued. Slide the tuner, or let someone choose.</p>`}
      ${d.more > 0 ? html`<p class="dnone">+${d.more} more after that</p>` : nothing}</section>
    <div class="dmid"><div class="bigdial" data-fits>
    <svg viewBox="0 0 400 400">
      <circle class="dplate" cx="200" cy="200" r="184"></circle>
      ${c.now.playing ? svg`<circle class="dripple" cx="200" cy="200" r="100"></circle><circle class="dripple late" cx="200" cy="200" r="100"></circle>` : nothing}
      ${c.rooms.map((r, i) => {
        const a0 = -90 + i * seg + gap / 2, span = seg - gap, a1 = a0 + span * Math.max(0.03, r.vol / 100), [kx, ky] = pol(152, a1);
        return svg`<g class="darc" data-zone=${r.id} ?data-live=${r.live} ?data-playing=${r.playing} ?data-asleep=${r.asleep} ?data-offline=${r.offline} ?data-focus=${r.focus} ?data-hot=${c.over === r.id} ?data-held=${c.held === r.id} style=${col(r)} role="slider" tabindex="0" aria-label="Volume in ${r.name}"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow=${r.vol} aria-valuetext="${vtext(r)}. Enter ${r.on ? 'drops' : 'adds'} the room." @pointerdown=${down(r, a0, span)} @keydown=${keys(c, r)}>
          <path class="dhit" d=${arc(152, a0, a0 + span)}></path><path class="dtrack" d=${arc(152, a0, a0 + span)}></path>
          ${r.hasVol ? svg`${r.live ? svg`<path class="dfill" d=${arc(152, a0, a1)}></path>` : nothing}<circle class="dknob" cx=${kx} cy=${ky} r="15"></circle>` : nothing}</g>`;
      })}
      <circle class="dprogt" cx="200" cy="200" r="106"></circle>
      <circle class="dprog" cx="200" cy="200" r="106" stroke-dasharray="${c.now.frac * C} ${C}" transform="rotate(-90 200 200)"></circle>
    </svg>
    <button class="dcover tap" ?data-playing=${c.now.playing} style=${c.now.art ? `--art:url(${c.now.art})` : ''} aria-label=${c.now.playing ? 'Pause' : 'Play'} @click=${() => c.playPause()}><span>${solid(c.now.playing ? 'pause' : 'play', 30)}</span></button>
    <div class="dlabels">${c.rooms.map((r, i) => {
      const am = -90 + i * seg + seg / 2, co = Math.cos((am * Math.PI) / 180), si = Math.sin((am * Math.PI) / 180), [quieter, louder] = steps(c, r);
      const tx = co > 0.3 ? '0' : co < -0.3 ? '-100%' : '-50%', ty = Math.abs(co) > 0.3 ? '-50%' : si > 0 ? '0' : '-100%';
      return html`<div class="dlabel" data-side=${co > 0.3 ? 'r' : co < -0.3 ? 'l' : 'm'} ?data-held=${c.held === r.id} ?data-offline=${r.offline} style="left:${50 + 50.5 * co}%;top:${50 + 50.5 * si}%;transform:translate(${tx},${ty})">
        <button class="dname tap" aria-pressed=${String(r.focus)} aria-label="Show ${r.name} in the player" @click=${() => c.focus(r.id)}><b>${r.asleep ? '☾ ' : ''}${r.name}${link(r)}</b><span>${state(r)}</span></button>
        ${r.hasVol && !r.offline ? html`<span class="dstep">${quieter}<b class="vnum" aria-hidden="true">${r.vol}</b>${louder}</span>` : nothing}</div>`;
    })}</div>
  </div></div>
    <section class="dcard dturn" aria-label="Whose turn"><h3>Whose turn</h3>
      <div class="dcoins">${d.turn.map((t) => html`<button class="dcoin tap" style="--c:${t.colour}" ?data-now=${t.now} aria-label="${t.name} chooses a song${t.now ? ' (their turn)' : ''}" @click=${() => d.choose(t.name)}>${t.face}</button>`)}</div>
      <p class="dwho">${d.chooser ? html`<b>${d.chooser}</b> chooses next` : 'Tap a face to choose a song'}</p>
      ${d.sleep.can ? html`<button class="dsleep tap" ?data-on=${left !== null} aria-pressed=${String(left !== null)} @click=${() => d.sleepGo()}>
        <svg viewBox="0 0 40 40" aria-hidden="true"><circle class="swt" cx="20" cy="20" r="17"></circle>${left !== null ? svg`<path class="sww" d="M20 20 L20 4 A16 16 0 ${wa > Math.PI ? 1 : 0} 1 ${wx.toFixed(2)} ${wy.toFixed(2)} Z"></path>` : nothing}</svg>
        <span><b>Sleep fade · ${d.sleep.room}</b><span>${left !== null ? `${left} min left · tap to cancel` : `Fade out in ${d.sleep.mins} min`}</span></span></button>` : nothing}</section>
    <div class="tuner" role="slider" tabindex="0" aria-label="Tuner. Slide to a favourite or a station to play it." aria-valuemin="1" aria-valuemax=${Math.max(1, ns)} aria-valuenow=${onAt < 0 ? 1 : onAt + 1} aria-valuetext=${onAt < 0 ? 'Not tuned' : d.stops[onAt].name} @pointerdown=${tuneDown} @keydown=${tuneKey}>
      <i class="tticks" aria-hidden="true"></i>
      ${d.stops.map((s, i) => html`<span class="tstop" ?data-on=${s.on} style="left:${stopX(i)}%;max-width:${(100 / ns - 2).toFixed(1)}%">${s.name}</span>`)}
      ${ns ? html`<i class="tneedle" aria-hidden="true" ?data-on=${onAt >= 0} style="left:${onAt < 0 ? 2 : stopX(onAt)}%"></i>` : html`<span class="tstop" style="left:50%">Pin music or add stations to fill the tuner</span>`}
    </div></div>`;
};

/* ---------------- the mixing desk ---------------- */
export const deskView = (c: Ctx): TemplateResult => {
  const live = c.rooms.filter((r) => r.live && r.hasVol && !r.offline), avg = live.length ? Math.round(live.reduce((s, r) => s + r.vol, 0) / live.length) : 0;
  // the master fader moves every room with music by the same amount
  const start = live.map((r) => [r.id, r.vol] as [string, number]);
  const master = volCtl({ name: 'the whole house', v: avg, live: live.length > 0, vert: true, set: (v, commit) => { for (const [id, v0] of start) c.vol(id, clamp(v0 + v - avg), commit); }, drop: () => { for (const [id] of start) c.drop(id); } });
  const strip = (r: Room): TemplateResult => {
    const lit = r.live ? Math.max(1, Math.round(r.vol / 10)) : 0;
    // a lamp says ON only for a room playing the music on this desk; a room with other music shows a note
    const lamp = r.offline ? '–' : r.on ? 'ON' : r.live ? '♪' : r.asleep ? '☾' : 'OFF';
    const says = r.offline ? `${r.name} is offline` : r.on ? (r.lead ? `ON: ${r.name} plays this music. ${r.playing ? 'Pause' : 'Play'}` : `ON. Remove ${r.name} from the music`) : r.live ? `${r.name} has other music. Swap it for this music` : `OFF. Add ${r.name} to the music`;
    return html`<div class="strip" data-zone=${r.id} ?data-live=${r.live} ?data-playing=${r.playing} ?data-asleep=${r.asleep} ?data-offline=${r.offline} ?data-focus=${r.focus} ?data-hot=${c.over === r.id} style=${col(r)}>
      <button class="sname tap" aria-pressed=${String(r.focus)} aria-label="Show ${r.name} in the player" @click=${() => c.focus(r.id)}><span>${r.name}</span>${link(r)}</button>
      <button class="lamp tap" aria-pressed=${String(r.on)} ?data-other=${r.live && !r.on} ?disabled=${r.offline} aria-label=${says} @click=${() => c.toggle(r.id)}>${lamp}</button>
      <div class="well"><span class="vu" aria-hidden="true">${Array.from({ length: 10 }, (_, k) => html`<i ?data-lit=${9 - k < lit} ?data-peak=${9 - k >= lit - 2 && 9 - k < lit}></i>`)}</span>
        ${r.hasVol && !r.offline ? roomVol(c, r, true) : html`<span class="sval">${r.offline ? 'Offline' : '–'}</span>`}</div></div>`;
  };
  // the jog wheel: follow the finger round the centre, adding up how far it has turned. A tap is not a turn: it leaves the song where it is.
  const jogDown = (e: PointerEvent): void => {
    const b = (e.currentTarget as Element).getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, ang = (m: PointerEvent): number => (Math.atan2(m.clientY - cy, m.clientX - cx) * 180) / Math.PI;
    let last = ang(e), turn = 0, begun = false;
    const step = (m: PointerEvent): number => { const a = ang(m); let d = a - last; if (d > 180) d -= 360; else if (d < -180) d += 360; last = a; turn += d; return turn; };
    track(e, (m) => { begun = true; c.jogTo(step(m), false); }, (moved, m, cancelled) => { if (moved && !cancelled) c.jogTo(step(m), true); else if (begun) c.jogTo(0, true); }, 6);
  };
  const jogKey = (e: KeyboardEvent): void => { const s = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 10 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -10 : 0; if (s) { e.preventDefault(); c.seekBy(s); } };
  const j = c.jog, spin = j.at * 3 + (j.turn ?? 0);
  return html`<div class="desk" data-fits>
    <div class="dside">
      <div class="dnow"><span class="dart" ?data-playing=${c.now.playing} style=${c.now.art ? `--art:url(${c.now.art})` : ''} aria-hidden="true"><i></i></span>
        <span class="dtx"><i>${c.now.playing ? 'Now playing' : c.now.lead ? 'Paused' : 'Ready'}</i><b>${c.now.title}</b><span>${c.now.artist}</span></span></div>
      <div class="tkeys"><button class="tkey tap" aria-label="Previous" @click=${() => c.prev()}>${solid('prev', 26)}</button>
        <button class="tkey go tap" data-go aria-label=${c.now.playing ? 'Pause' : 'Play'} @click=${() => c.playPause()}>${solid(c.now.playing ? 'pause' : 'play', 28)}</button>
        <button class="tkey tap" aria-label="Next" @click=${() => c.next()}>${solid('next', 26)}</button></div>
      <div class="dplay">
        <div class="jog" role="slider" tabindex="0" aria-label="Jog wheel. Turn it to move through the song; past the end it skips to the next." aria-valuemin="0" aria-valuemax=${Math.round(j.len)} aria-valuenow=${Math.round(j.at)} aria-valuetext=${j.says}
          ?data-held=${j.turn !== null} @pointerdown=${jogDown} @keydown=${jogKey}><i class="jring" style="transform:rotate(${spin.toFixed(1)}deg)"><i></i></i><b>${j.read}</b></div>
        <div class="pads">${c.moments.map((m, i) => html`<button class="mpad tap" style="--c:var(--p-${[2, 5, 3, 4][i % 4]})" ?data-on=${m.on} ?data-busy=${m.busy} aria-pressed=${String(m.on)} @click=${() => c.moment(i)}><span aria-hidden="true">${m.icon}</span>${m.name}</button>`)}</div>
      </div>
    </div>
    <div class="dstrips">${c.rooms.map(strip)}
    <div class="strip master" ?data-live=${live.length > 0}>
      <span class="sname"><span>Whole house</span></span>
      <button class="lamp tap" data-drop="all" ?data-hot=${c.over === 'all'} aria-label="Whole house: play this music in every room" @click=${() => c.all()}>${icon('home', 22)}</button>
      <div class="well">${live.length ? master : html`<span class="sval">–</span>`}</div></div></div></div>`;
};

/* ---------------- the record crate ---------------- */
const CRATE_SHOWS = 6;
/** A crate of records to flick through, a turntable to drop them on, and a speaker for every room on the end of a cable. */
export const crateView = (c: Ctx): TemplateResult => {
  const k = c.crate, n = k.items.length, at = Math.max(0, Math.min(n - 1, k.at)), start = Math.max(0, Math.min(at - 2, n - CRATE_SHOWS)), win = k.items.slice(start, start + CRATE_SHOWS), sel = k.items[at];
  const y = (j: number): number => ((j + 0.5) / c.rooms.length) * 100;
  const whose = k.who === 'Family' ? 'Family crate' : `${k.who}’s crate`;
  const cab = (r: Room, j: number): TemplateResult => { const [quieter, louder] = steps(c, r);
    return html`<div class="cab" data-zone=${r.id} ?data-live=${r.live} ?data-playing=${r.playing} ?data-asleep=${r.asleep} ?data-offline=${r.offline} ?data-focus=${r.focus} ?data-hot=${c.over === r.id} ?data-held=${c.held === r.id} style="--top:${y(j)}%;--n:${c.rooms.length};${col(r)}">
    <button class="chit tap" aria-pressed=${String(r.focus)} aria-label="Show ${r.name} in the player" @click=${() => c.focus(r.id)}><span class="cone" aria-hidden="true"><i></i></span>
      <span class="ctext"><b>${r.asleep ? '☾ ' : ''}${r.name}${link(r)}</b><span>${r.hasVol && !r.offline ? html`<b class="vnum">${r.vol}</b> ` : nothing}${state(r)}</span></span></button>
    ${r.hasVol && !r.offline ? html`<span class="cvol">${quieter}<span class="cknob" role="slider" tabindex="0" aria-label="Volume in ${r.name}" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${r.vol} aria-valuetext=${vtext(r)} ?data-idle=${!r.live}
      style="--v:${r.vol}" @pointerdown=${slide(c, r, () => 150)} @keydown=${keys(c, r)}><i></i></span>${louder}</span>` : nothing}
    <button class="sock tap" data-notrack aria-pressed=${String(r.on)} ?disabled=${r.offline} aria-label="${r.on ? 'Remove' : 'Add'} ${r.name} ${r.on ? 'from' : 'to'} the music" @click=${() => c.toggle(r.id)}>${r.on ? '' : '＋'}</button></div>`; };
  const on = c.rooms.map((r, j) => [r, j] as [Room, number]).filter(([r]) => r.on), jackY = (i: number): number => 39 + (i - (on.length - 1) / 2) * Math.min(9, 60 / Math.max(1, on.length));
  const wires = on.map(([r, j], i) => { const x0 = 64.6, y0 = jackY(i), x1 = 70, y1 = y(j), sag = 9 + Math.abs(y1 - y0) * 0.18;
    return svg`<path class="wire" ?data-playing=${r.playing} style="${col(r)};animation-delay:${-i * 0.4}s" d="M${x0} ${y0} C${x0 + 3.4} ${y0 + sag}, ${x1 - 3.4} ${y1 + sag}, ${x1} ${y1}"></path>`; });
  const sleeve = (m: ShelfItem, w: number): TemplateResult => { const i = start + w, front = i === at, spread = 0.5 + (w - (win.length - 1) / 2) / Math.max(3, win.length - 1);
    return html`<button class="sleeve tap" ?data-front=${front} ?data-lifted=${c.liftedItem === m} style="z-index:${10 - Math.abs(i - at)};--x:${spread};--tilt:${(-9 + 17 * spread).toFixed(1)}deg;--art:${m.img ? `url(${m.img})` : `linear-gradient(135deg, var(--p-${(i % 5) + 1}), var(--p-${((i + 2) % 5) + 1}))`}"
      aria-label="${m.name}. ${front ? `Tap to play in ${k.room}` : 'Tap to bring it to the front'}, or drag it to the turntable or a speaker."
      @pointerdown=${(e: PointerEvent) => c.carryItem(e, m, (dx) => k.flick(Math.max(0, Math.min(n - 1, at - Math.round(dx / 52)))))} @click=${() => k.tap(i)}><span class="sart">${m.img ? '' : m.name[0]}</span></button>`; };
  return html`<div class="rig" data-fits>
    <svg class="wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${wires}</svg>
    <div class="cratecol">
      <div class="ctabs" role="group" aria-label="Whose crate">${k.tabs.map((t) => html`<button class="ctab tap" style="--c:${t.colour}" aria-pressed=${String(t.name === k.who)} @click=${() => k.pick(t.name)}>${t.name}</button>`)}</div>
      <div class="sleeves">${win.map(sleeve)}</div>
      <div class="cbox">
        <div class="clabel">${n > 1 ? html`<button class="cnav tap" aria-label="Flick back" ?disabled=${at === 0} @click=${() => k.flick(at - 1)}>${solid('prev', 20)}</button>` : nothing}
          <b>${k.calm ? '🌙 ' : ''}${whose}</b>${n > 1 ? html`<button class="cnav tap" aria-label="Flick forward" ?disabled=${at === n - 1} @click=${() => k.flick(at + 1)}>${solid('next', 20)}</button>` : nothing}</div>
        ${sel ? html`<span class="cpick"><b>${sel.name}</b><span>${n > 1 ? `${at + 1} of ${n} · ` : ''}tap it to play in ${k.room}</span></span>`
          : html`<span class="cpick"><b>${k.calm ? 'Nothing calm pinned yet' : 'Nothing pinned yet'}</b><span>Search for music, then tap Pin.</span></span>`}
      </div>
    </div>
    <div class="tdeck">
      <div class="ttable" data-drop="deck" ?data-hot=${c.over === 'deck'}>
        <div class="tplat"><button class="cdisc tap" ?data-playing=${c.now.playing} style=${c.now.art ? `--art:url(${c.now.art})` : ''} aria-label=${c.now.playing ? 'Pause' : 'Play'} @click=${() => c.playPause()}></button>
          <i class="tarm" aria-hidden="true" style="--arm:${c.now.lead ? (12 + 18 * c.now.frac).toFixed(1) : 0}deg"><i></i></i><i class="tpivot" aria-hidden="true"></i></div>
        <span class="ttitle"><b>${c.now.title}</b><span>${c.now.artist || (c.now.lead ? '' : 'Drop a record here')}</span></span>
        ${on.map((_, i) => html`<i class="jack" aria-hidden="true" style="top:${(jackY(i) / 78) * 100}%"></i>`)}
      </div>
      <div class="tkeys"><button class="tkey tap" aria-label="Previous" @click=${() => c.prev()}>${solid('prev', 28)}</button>
        <button class="tkey go tap" data-go aria-label=${c.now.playing ? 'Pause' : 'Play'} @click=${() => c.playPause()}>${solid(c.now.playing ? 'pause' : 'play', 30)}</button>
        <button class="tkey tap" aria-label="Next" @click=${() => c.next()}>${solid('next', 28)}</button></div>
    </div>
    ${c.rooms.map(cab)}</div>`;
};

/* ---------------- the living scene ---------------- */
const moon = svg`<path class="amoon" d="M66 22a11 11 0 1 0 8 17 8.5 8.5 0 0 1-8-17z"></path>`;
/** Every creature is at least 44 px across, quiet or loud, so it can always be picked up. */
const ACTORS: Record<string, (r: Room, v: number) => TemplateResult> = {
  sea: (r, v) => { const h = 22 + 62 * v; return svg`<g class="bob">
    <path class="ahull" d="M12 98H88L76 114H24Z"></path><path class="aline" d="M50 98V14"></path>
    ${r.live ? svg`<path class="afill" d="M54 92V${92 - h}L${54 + h * 0.52} 92Z"></path><path class="afill soft" d="M46 92V${92 - h * 0.7}L${46 - h * 0.32} 92Z"></path>${r.playing ? svg`<path class="aflag" d="M50 14l18 6-18 6z"></path>` : nothing}`
      : svg`<rect class="aidle" x="46" y="30" width="8" height="62" rx="4"></rect>`}</g>`; },
  reef: (r, v) => { const s = 22 + 20 * v; return svg`<g class="swim">
    <path class=${r.live ? 'afill' : 'aidle'} d="M${50 - s} 70L${50 - s * 1.8} ${70 - s * 0.62}V${70 + s * 0.62}Z"></path>
    <ellipse class=${r.live ? 'afill edge' : 'aidle edge'} cx="50" cy="70" rx=${s * 1.15} ry=${s * 0.74}></ellipse>
    <circle class="aeye" cx=${50 + s * 0.6} cy=${70 - s * 0.16} r=${Math.max(3, s * 0.15)}></circle><circle class="apupil" cx=${50 + s * 0.65} cy=${70 - s * 0.16} r=${Math.max(1.5, s * 0.07)}></circle></g>
    ${r.playing ? svg`<circle class="abub" cx=${58 + s} cy="52" r="3"></circle><circle class="abub late" cx=${66 + s} cy="60" r="4.5"></circle>` : nothing}`; },
  space: (r, v) => { const p = 23 + 11 * v; return svg`${r.playing ? svg`<circle class="aglow" cx="50" cy="68" r=${p + 9}></circle>` : nothing}
    <circle class=${r.live ? 'afill' : 'aidle edge'} cx="50" cy="68" r=${p}></circle>
    ${r.live ? svg`<ellipse class="aring" cx="50" cy="68" rx=${Math.min(49, p * 1.5)} ry=${p * 0.36}></ellipse>` : nothing}`; },
  bush: (r, v) => { const h = 18 + 66 * v; return svg`<path class="alog" d="M26 112l44-12 4 8-44 12z"></path><path class="alog" d="M74 112l-44-12-4 8 44 12z"></path>
    ${r.live ? svg`<g class="flick"><path class="aflame" d="M50 ${106 - h}C${50 + h * 0.5} ${106 - h * 0.42},${50 + h * 0.34} 106,50 106C${50 - h * 0.34} 106,${50 - h * 0.5} ${106 - h * 0.42},50 ${106 - h}Z"></path>
      <path class="aflame in" d="M50 ${106 - h * 0.56}C${50 + h * 0.26} ${106 - h * 0.22},${50 + h * 0.18} 106,50 106C${50 - h * 0.18} 106,${50 - h * 0.26} ${106 - h * 0.22},50 ${106 - h * 0.56}Z"></path></g>` : svg`<circle class="aember" cx="50" cy="102" r="5"></circle>`}`; },
  sunset: (r, v) => { const y = r.live ? 88 - 62 * v : 92; return svg`<path class="aline thin" d="M50 ${y + 26}Q${56} ${(y + 140) / 2} 50 116"></path>
    <g class="sway"><path class=${r.live ? 'afill edge' : 'aidle edge'} d="M50 ${y - 26}L73 ${y}L50 ${y + 26}L27 ${y}Z"></path><path class="aline thin" d="M50 ${y - 26}V${y + 26}M27 ${y}H73"></path></g>`; },
  fridge: (r, v) => { const y = 96 - 72 * (r.hasVol ? v : 0); return svg`<path class="aline" d="M50 14C53 44 47 76 50 106"></path>${[0, 1, 2, 3, 4].map((k) => svg`<path class="aline thin" d="M43 ${18 + k * 21}h14"></path>`)}
    <g class="jig"><circle class="ashade" cx="52" cy=${y + 4} r="23"></circle><circle class=${r.live ? 'afill' : 'aidle'} cx="50" cy=${y} r="23"></circle><text class="ainit" x="50" y=${y + 7}>${r.name[0]}</text></g>`; },
  orbit: (r, v) => { const p = 23 + 9 * v; return svg`<circle class="aorbit" cx="50" cy="68" r="38"></circle>${r.playing ? svg`<circle class="aglow" cx="50" cy="68" r=${p + 8}></circle>` : nothing}
    <circle class=${r.live ? 'afill' : 'aidle edge'} cx="50" cy="68" r=${p}></circle>`; }
};
const BACKDROP: Record<string, TemplateResult> = {
  sea: svg`<path class="bg1 drift" d="M-40 62q10 -5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0"></path><path class="bg2 drift slow" d="M-40 80q10 -5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0"></path>`,
  reef: svg`<path class="bgweed" d="M6 100q-5 -14 1 -26q-6 -10 1 -22"></path><path class="bgweed b" d="M94 100q5 -12 -1 -24q5 -10 -1 -20"></path>`,
  space: svg`${[[8, 14], [22, 40], [40, 8], [63, 22], [81, 12], [93, 44], [52, 50]].map(([x, y], i) => svg`<circle class="bgstar" style="animation-delay:${-i * 0.5}s" cx=${x} cy=${y} r=".7"></circle>`)}`,
  bush: svg`<path class="bg2" d="M0 96h100"></path>${[[12, 30], [88, 22], [50, 14], [70, 44]].map(([x, y], i) => svg`<circle class="bgfly" style="animation-delay:${-i * 0.8}s" cx=${x} cy=${y} r=".8"></circle>`)}`,
  sunset: svg`<path class="bg2" d="M0 96q25 -8 50 0t50 0"></path>`,
  fridge: svg``, orbit: svg``
};

/** Where each room floats, in percent of the scene. Wide: rooms sharing music sail together along the top, beside what is playing, and the quiet ones wait in a line below, across the whole width. Narrow: every room has a place in rows, the ones with music first. The CSS keeps each one whole inside the edge. */
const spots = (c: Ctx): Record<string, [number, number]> => {
  const out: Record<string, [number, number]> = {}, live = c.rooms.filter((r) => r.stream), idle = c.rooms.filter((r) => !r.stream);
  if (c.narrow) {
    const order = [...c.streams.flatMap((s) => live.filter((r) => r.stream === s).sort((p, q) => Number(q.lead) - Number(p.lead))), ...idle], per = c.phone ? 2 : 3, rows = Math.max(1, Math.ceil(order.length / per));
    order.forEach((r, i) => { const row = Math.floor(i / per), inRow = Math.min(per, order.length - row * per); out[r.id] = [(((i % per) + 0.5) / inRow) * 100, 27 + ((row + 0.5) / rows) * 55]; });
    return out;
  }
  const from = 31, span = 67, gap = 5, step = Math.min(16, (span - gap * Math.max(0, c.streams.length - 1)) / Math.max(1, live.length)); let x = from;
  for (const s of c.streams) { const mem = live.filter((r) => r.stream === s).sort((p, q) => Number(q.lead) - Number(p.lead)); mem.forEach((r, j) => { out[r.id] = [x + (j + 0.5) * step, (idle.length ? 23 : 40) + (step < 13 && j % 2 ? 7 : 0)]; }); x += mem.length * step + gap; }
  idle.forEach((r, i) => { out[r.id] = [2 + ((i + 0.5) / idle.length) * 96, live.length ? 60 : 45]; });
  return out;
};
const SHELF_NAME: Record<string, string> = { sea: 'buoys', reef: 'shells', space: 'stars', orbit: 'stars', bush: 'lanterns', sunset: 'beach balls', fridge: 'photos' };
/** Previous, play and next, small, beside the title. */
const sceneKeys = (c: Ctx): TemplateResult => miniKeys(c.now.playing, () => c.prev(), () => c.playPause(), () => c.next());
/** The shelf, drawn into the world along the bottom of the scene: buoys on the sea, shells on the reef, a constellation in space, lanterns in the bush, beach balls at sunset, photos pegged up on the fridge. Carry one to a room or to the music; tap it to play in the room in focus. */
const sceneShelf = (c: Ctx, kind: string): TemplateResult => {
  const k = c.crate, items = k.items.slice(0, 7), names = k.tabs.map((t) => t.name), next = names[(names.indexOf(k.who) + 1) % Math.max(1, names.length)];
  const whose = k.who === 'Family' ? 'Family' : `${k.who}’s`, n = Math.max(1, items.length);
  const at = (i: number): string => `${((i + 0.5) / n) * 100} ${i % 2 ? 62 : 38}`, stars = kind === 'space' || kind === 'orbit', strung = kind === 'fridge' || kind === 'bush';
  const line = stars ? `M${items.map((_, i) => at(i)).join(' L')}` : 'M0 6 Q50 20 100 6';
  return html`<div class="sshelf" data-kind=${kind}>
    <button class="slabel tap" aria-label="${whose} ${SHELF_NAME[kind] ?? 'shelf'}. Show ${next === 'Family' ? 'the family' : `${next}’s`} shelf" @click=${() => k.pick(next)}><b>${k.calm ? '🌙 ' : ''}${whose} ${SHELF_NAME[kind] ?? 'shelf'}</b><span>${items.length ? 'Carry one to a room' : 'Pin music from Search'}</span></button>
    <div class="sitems" style="--n:${n}">${items.length > 1 && (stars || strung) ? html`<svg class="sline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d=${line}></path></svg>` : nothing}${items.map((m, i) => html`<button class="sitem tap" style="--i:${i};animation-delay:${-i * 0.55}s" ?data-lifted=${c.liftedItem === m} aria-label="${m.name}. Tap to play in ${k.room}, or drag it to a room or to the music."
      @pointerdown=${(e: PointerEvent) => c.carryItem(e, m)} @click=${() => k.play(m)}><i class="sdeco" aria-hidden="true"></i><i class="puck onshelf" style="--art:${m.img ? `url(${m.img})` : `linear-gradient(135deg, var(--p-${(i % 5) + 1}), var(--p-${((i + 2) % 5) + 1}))`}"></i></button>`)}</div>
  </div>`;
};
const sun = (c: Ctx): TemplateResult => html`<button class="puck spot" data-drop="deck" ?data-hot=${c.over === 'deck'} ?data-playing=${c.now.playing} ?data-lifted=${!!c.lifted && c.lifted === c.now.lead} style=${c.now.art ? `--art:url(${c.now.art})` : ''}
  aria-label="${c.now.title}. Tap to ${c.now.playing ? 'pause' : 'play'}${c.now.lead ? ', drag onto a room to move the music there' : ''}." @pointerdown=${(e: PointerEvent) => { if (c.now.lead) c.carry(e, c.now.lead); }} @click=${() => { if (!c.now.lead) c.playPause(); }}></button>`;
/** A room in the scene: its creature (pick it up to move it; a tap adds or drops it), a 44 px volume handle with a speaker on it, and a name chip that nothing shows through, with quieter and louder at its ends. */
const figure = (c: Ctx, r: Room, draw: (r: Room, v: number) => TemplateResult, vb = '0 0 100 120'): TemplateResult => { const [quieter, louder] = steps(c, r), vol = r.hasVol && !r.offline;
  return html`
  <svg viewBox=${vb} role="button" tabindex="0" aria-label="${r.on ? 'Remove' : 'Add'} ${r.name} ${r.on ? 'from' : 'to'} the music" @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.toggle(r.id); } }}>${r.asleep ? moon : nothing}${draw(r, r.vol / 100)}</svg>
  ${vol ? html`<span class="agrab" role="slider" tabindex="0" aria-label="Volume in ${r.name}" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${r.vol} aria-valuetext=${vtext(r)} ?data-idle=${!r.live}
    @pointerdown=${(e: PointerEvent) => { e.stopPropagation(); slide(c, r, () => 150)(e); }} @keydown=${keys(c, r)}><i>${spk(true)}</i></span>` : nothing}
  <span class="aname" data-notrack>${vol ? quieter : nothing}<button class="atx tap" aria-pressed=${String(r.focus)} aria-label="Show ${r.name} in the player" @pointerdown=${(e: Event) => e.stopPropagation()} @click=${() => c.focus(r.id)}><b>${r.name}${link(r)}</b><span>${vol ? html`<b class="vnum">${r.vol}</b> ` : nothing}${state(r)}</span></button>${vol ? louder : nothing}</span>`; };
const pct = (m: PointerEvent, b: DOMRect): [number, number] => [((m.clientX - b.left) / b.width) * 100, ((m.clientY - b.top) / b.height) * 100];
/** Pick a room up by its body. A press that moves less than 16 px is a tap, and adds or drops it; where it is let go decides the rest. */
const lift = (c: Ctx, r: Room, drop: (m: PointerEvent, b: DOMRect) => void) => (e: PointerEvent): void => {
  if (!e.isPrimary || (e.target as Element).closest('[data-notrack]')) return;
  const stage = (e.currentTarget as Element).closest('.vscene')!;
  track(e, (m) => { const [x, y] = pct(m, stage.getBoundingClientRect()); c.setDrag({ id: r.id, x, y }); }, (moved, m, cancelled) => { c.setDrag(null); if (cancelled) return; if (moved) drop(m, stage.getBoundingClientRect()); else c.toggle(r.id); }, TAP_SLOP);
};

/** Sea, Reef, Bush, Sunset and Fridge door: rooms float free. Bring two together and they share the music; pull one away and it stops. */
const swimScene = (c: Ctx, kind: string): TemplateResult => {
  const draw = ACTORS[kind], at = spots(c), d = c.sdrag;
  const drop = (r: Room) => (m: PointerEvent, b: DOMRect): void => {
    const far = (o: Room): number => Math.hypot(((at[o.id][0] - ((m.clientX - b.left) / b.width) * 100) / 100) * b.width, ((at[o.id][1] - ((m.clientY - b.top) / b.height) * 100) / 100) * b.height);
    const near = c.rooms.filter((o) => o.id !== r.id).sort((p, q) => far(p) - far(q))[0];
    if (near && far(near) < 96) {
      if (near.stream && near.stream !== r.stream) c.join(r.id, near.stream); // swim up to a room with music: join it
      else if (!near.stream && r.stream) c.join(near.id, r.stream);          // bring the music to a quiet room
    } else if (r.stream && !r.lead && !c.rooms.some((o) => o.id !== r.id && o.stream === r.stream && far(o) < 170)) c.leave(r.id);
  };
  return html`<div class="vscene" data-kind=${kind} ?data-narrow=${c.narrow} data-fits>
    <svg class="backdrop" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${BACKDROP[kind]}
      ${c.streams.map((s) => { const mem = c.rooms.filter((r) => r.stream === s && d?.id !== r.id); return mem.length > 1 ? svg`<path class="tie" style="--c:${mem[0].colour || 'var(--stream, var(--primary))'}" d="M${mem.map((r) => `${at[r.id][0]} ${at[r.id][1]}`).join(' L')}"></path>` : nothing; })}</svg>
    <div class="sun">${sun(c)}<span class="suntx"><b>${c.now.title}</b><span>${c.now.artist || (c.now.lead ? 'Drag me to a room' : 'Pick something to play')}</span>${sceneKeys(c)}</span></div>
    ${c.rooms.map((r, i) => { const p = d?.id === r.id ? [d.x, d.y] : at[r.id];
      return html`<div class="actor free" data-zone=${r.id} ?data-live=${r.live} ?data-playing=${r.playing} ?data-asleep=${r.asleep} ?data-offline=${r.offline} ?data-focus=${r.focus} ?data-held=${d?.id === r.id} ?data-vheld=${c.held === r.id} ?data-hot=${c.over === r.id && c.lifted !== r.id}
        style="${col(r)};--x:${p[0]}%;--y:${p[1]}%;animation-delay:${-i * 0.45}s" @pointerdown=${lift(c, r, drop(r))}>${figure(c, r, draw)}</div>`; })}
    ${sceneShelf(c, kind)}
  </div>`;
};

/** Space and Orbit: the music is the sun. Each piece of music has its own orbit and the rooms playing it circle on it; quiet rooms wait on the outer ring. */
const RINGS = [36, 58], PARK = 82, ORBIT_BOX = '0 22 100 92';
const orbitScene = (c: Ctx, kind: string): TemplateResult => {
  const draw = ACTORS[kind], d = c.sdrag, ringOf = (s: string): number => RINGS[Math.min(RINGS.length - 1, c.streams.indexOf(s))];
  const drop = (r: Room) => (m: PointerEvent, b: DOMRect): void => {
    // the same sums as the CSS: where the centre is, how flat the orbits are, and how big one orbit unit is
    const st = (m.target as Element).closest('.vscene') ?? document.body, g = getComputedStyle(st), sq = Number(g.getPropertyValue('--sq')) || 0.42, k = Number(g.getPropertyValue('--k')) || 1, cy = Number(g.getPropertyValue('--cy')) || 0.4, uh = Number(g.getPropertyValue('--uh')) || 1;
    const rp = (Math.hypot(m.clientX - (b.left + b.width / 2), (m.clientY - (b.top + b.height * cy)) / sq) / Math.min(b.height * uh, b.width * 0.56)) * 100 / k;
    const opts: [number, string][] = [...c.streams.map((s) => [ringOf(s), s] as [number, string]), [PARK, '']];
    const [, to] = opts.sort((p, q) => Math.abs(p[0] - rp) - Math.abs(q[0] - rp))[0];
    if (to && to !== r.stream) c.join(r.id, to); else if (!to && r.stream && !r.lead) c.leave(r.id);
  };
  const parked = c.rooms.filter((r) => !r.stream);
  const arm = (r: Room): TemplateResult => {
    const mem = r.stream ? c.rooms.filter((o) => o.stream === r.stream) : parked, j = mem.indexOf(r), k = r.stream ? c.streams.indexOf(r.stream) : 0;
    const a = r.stream ? (k * 137 + (j * 360) / mem.length) % 360 : (100 + (j * 360) / Math.max(1, mem.length)) % 360;
    return html`<div class="arm" ?data-moving=${r.playing} ?data-away=${d?.id === r.id} style="--a:${a};--r:${r.stream ? ringOf(r.stream) : PARK};--t:${r.stream ? 70 + k * 40 : 0}s"><div class="hold"><div class="unspin"><div class="unsquash">
      <div class="actor planet" data-zone=${r.id} ?data-live=${r.live} ?data-playing=${r.playing} ?data-asleep=${r.asleep} ?data-offline=${r.offline} ?data-focus=${r.focus} ?data-vheld=${c.held === r.id} ?data-hot=${c.over === r.id && c.lifted !== r.id} style=${col(r)} @pointerdown=${lift(c, r, drop(r))}>${figure(c, r, draw, ORBIT_BOX)}</div></div></div></div></div>`;
  };
  const held = d ? c.rooms.find((r) => r.id === d.id) : undefined;
  return html`<div class="vscene orbits" data-kind=${kind} ?data-narrow=${c.narrow} data-fits>
    <svg class="backdrop" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${BACKDROP[kind]}</svg>
    ${c.streams.slice(0, RINGS.length).map((s, k) => html`<span class="ring" style="--r:${RINGS[k]};--c:${k ? 'var(--p-3)' : 'var(--stream, var(--primary))'}"></span>`)}<span class="ring park" style="--r:${PARK}"></span>
    <div class="sun">${html`<span class="suntx"><b>${c.now.title}</b><span>${c.now.artist || (c.now.lead ? 'Same orbit, same music' : 'Pick something to play')}</span>${sceneKeys(c)}</span>`}</div>
    <div class="core">${sun(c)}</div>
    <div class="plane">${c.rooms.map(arm)}</div>
    ${held && d ? html`<div class="actor free clone" data-held ?data-live=${held.live} style="${col(held)};--x:${d.x}%;--y:${d.y}%">${figure(c, held, draw, ORBIT_BOX)}</div>` : nothing}
    ${sceneShelf(c, kind)}
  </div>`;
};

export const sceneView = (c: Ctx): TemplateResult => { const kind = sceneKind(c.look, c.theme); return kind === 'space' || kind === 'orbit' ? orbitScene(c, kind) : swimScene(c, kind); };

/** The picker: a card for each way of seeing the rooms. */
export const viewPicker = (current: ViewId, pick: (v: ViewId) => void, close: () => void): TemplateResult => html`<div class="scrim" style="border-radius:28px" @click=${(e: Event) => { if (e.target === e.currentTarget) close(); }}>
  <section class="glass sheet" role="dialog" aria-modal="true" aria-label="Switcheroo: change the view" style="width:min(640px,94%);gap:14px">
    <h2 class="t-head" style="display:flex;align-items:center;gap:12px"><i class="pinw" aria-hidden="true"></i>Switcheroo!</h2><span class="muted" style="margin-top:-8px">Pick a way to see the rooms.</span>
    <div class="vgrid">${VIEWS.map((v) => html`<button class="vcard tap" aria-pressed=${String(v.id === current)} @click=${() => pick(v.id)}>${icon(v.icon, 34)}<b>${v.name}</b><span>${v.about}</span></button>`)}</div>
    <button class="pill tap" style="align-self:flex-end" @click=${close}>Close</button></section></div>`;

export const viewsCss = css`
  /* Switcheroo: the one button that changes how the rooms are shown. Same name, same pinwheel, on every view. */
  .viewbtn { height: 48px; padding: 0 18px 0 8px; border-radius: 999px; background: var(--chip-strong); display: inline-flex; align-items: center; gap: 10px; font-size: 16px; font-weight: var(--w-heavy, 800); letter-spacing: -.01em; box-shadow: inset 0 0 0 2.5px color-mix(in srgb, var(--primary) 55%, transparent), 0 4px 12px -4px rgba(0,0,0,.3); flex-shrink: 0; }
  .pinw { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: conic-gradient(#ff5d5d 0 60deg, #ffb13d 0 120deg, #ffe14a 0 180deg, #4fd27a 0 240deg, #45b7f5 0 300deg, #a877f2 0); box-shadow: inset 0 0 0 2px rgba(255,255,255,.75), 0 1px 3px rgba(0,0,0,.3); position: relative; animation: pinw 9s linear infinite; animation-play-state: var(--motion, running); }
  .pinw::after { content: ''; position: absolute; inset: 11px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.15); }
  .viewbtn:active .pinw { animation-duration: var(--m-4, 400ms); }
  @keyframes pinw { to { transform: rotate(360deg); } }
  .vgrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .vcard { min-height: 112px; padding: 12px 10px; border-radius: 20px; background: var(--chip); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center; transition: transform var(--mt-2, 160ms) cubic-bezier(.2,1.4,.4,1); }
  .vcard b { font-size: 16px; font-weight: var(--w-bold, 700); } .vcard span { font-size: 12.5px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .vcard[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); transform: translateY(calc(-3px * var(--m-d, 1))); } .vcard[aria-pressed='true'] span { color: inherit; }
  :host([data-phone]) .vgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  /* ---- one family of volume controls: 44 px to touch, a fill up to the value (--v), a 32 px thumb, the number, quieter and louder at the ends ---- */
  .vs { display: flex; align-items: center; gap: 2px; min-width: 0; --rail-w: 8px; --vc: var(--c, var(--stream, var(--primary))); }
  .vstep { width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--ink); touch-action: manipulation; }
  .vstep[disabled] { opacity: .38; }
  .vstep:focus-visible, .vrail:focus-visible, .cknob:focus-visible, .agrab:focus-visible, .grab:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
  .vrail { flex: 1 1 0; min-width: 56px; height: 44px; position: relative; touch-action: pan-y; cursor: pointer; border-radius: 12px; outline: none; }
  .vrail .slot { position: absolute; left: 4px; right: 4px; top: calc(50% - var(--rail-w) / 2); height: var(--rail-w); border-radius: 99px; background: var(--rail, var(--track)); }
  .vfill { position: absolute; left: 4px; top: calc(50% - var(--rail-w) / 2); width: calc(12px + (100% - 32px) * var(--v) / 100); height: var(--rail-w); border-radius: 99px; background: var(--vc); transition: width var(--m-3, 240ms) var(--e-out, ease), height var(--m-3, 240ms) var(--e-out, ease); }
  .vs .fcap { position: absolute; left: calc((100% - 32px) * var(--v) / 100); top: 6px; width: 32px; height: 32px; box-sizing: border-box; border-radius: 50%; background: var(--knob, #fff); box-shadow: inset 0 0 0 3px var(--vc), 0 2px 5px rgba(0,0,0,.3);
    transition: left var(--m-3, 240ms) var(--e-out, ease), bottom var(--m-3, 240ms) var(--e-out, ease), transform var(--m-2, 160ms) var(--e-spring, ease); }
  .fcap b { position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translateX(-50%); padding: 2px 9px; border-radius: 10px; background: rgba(15,15,20,.9); color: #fff; font-size: 18px; font-weight: var(--w-heavy, 800); font-variant-numeric: tabular-nums; opacity: 0; pointer-events: none; transition: opacity var(--m-2, 160ms); z-index: 4; }
  .vs[data-held] .fcap { transform: scale(1.15); transition: transform var(--m-2, 160ms) var(--e-spring, ease); } .vs[data-held] .vfill { transition: none; } .vs[data-held] .fcap b { opacity: 1; }
  .vs[data-idle] .vfill { display: none; } .vs[data-idle] .fcap { background: transparent; box-shadow: inset 0 0 0 3px var(--ink3); }
  .vnum { display: inline-block; min-width: 2ch; font-size: 18px; font-weight: var(--w-bold, 700); font-variant-numeric: tabular-nums; text-align: center; color: var(--ink); transition: transform var(--m-2, 160ms) var(--e-spring, ease); }
  .vs > .vnum { min-width: 32px; text-align: right; }
  /* standing up (a fader): louder at the top, quieter at the bottom, the number underneath */
  .vs[data-vert] { flex-direction: column-reverse; min-height: 0; } .vs[data-vert] > .vnum { order: -1; text-align: center; min-height: 22px; }
  .vs[data-vert] .vrail { flex: 1 1 0; width: 44px; min-width: 0; height: auto; min-height: 56px; touch-action: none; }
  .vs[data-vert] .slot { left: calc(50% - var(--rail-w) / 2); right: auto; top: 4px; bottom: 4px; width: var(--rail-w); height: auto; }
  .vs[data-vert] .vfill { left: calc(50% - var(--rail-w) / 2); top: auto; bottom: 4px; width: var(--rail-w); height: calc(12px + (100% - 32px) * var(--v) / 100); }
  .vs[data-vert] .fcap { left: 6px; top: auto; bottom: calc((100% - 32px) * var(--v) / 100); }
  .vs[data-vert] .fcap b { left: auto; right: calc(100% + 8px); bottom: 2px; transform: none; }
  /* on a phone the page scrolls up and down: a standing rail lets it, and only the thumb itself drags */
  :host([data-phone]) .vs[data-vert] .vrail { touch-action: pan-y; } :host([data-phone]) .vs[data-vert] .fcap { touch-action: none; }
  /* rooms that play together: two linked rings in the colour of their music */
  .linkd { display: inline-block; width: 18px; height: 10px; margin-left: 6px; flex-shrink: 0; vertical-align: middle; background: radial-gradient(circle at 5px 5px, transparent 2.4px, var(--c, var(--stream, var(--primary))) 2.9px 4.7px, transparent 5.2px), radial-gradient(circle at 13px 5px, transparent 2.4px, var(--c, var(--stream, var(--primary))) 2.9px 4.7px, transparent 5.2px); }
  /* the small player: three round keys of one shape, play the only filled one */
  .mkeys { display: inline-flex; gap: 6px; flex-shrink: 0; }
  .mkey { width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; background: var(--chip-strong); box-shadow: inset 0 0 0 1.5px var(--track); display: inline-flex; align-items: center; justify-content: center; color: var(--ink); }
  .mkey.go { background: var(--primary); color: var(--on-primary); box-shadow: none; }
  /* a control waiting on Home Assistant (set after 250 ms) */
  [data-busy] { opacity: .55; cursor: progress; }

  /* ---- dial ---- */
  .dialwrap { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(150px, 1fr) auto minmax(150px, 1fr); grid-template-rows: minmax(0, 1fr) auto; gap: 10px 8px; container-type: size; }
  .dmid { grid-column: 2; grid-row: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 136px; }
  /* the dial is as big as its row allows less 20 px above and below, and never over 520 px; the cards beside it share one height and one centre line */
  .bigdial { height: min(100% - 40px, 520px); aspect-ratio: 1; flex-shrink: 0; position: relative; user-select: none; -webkit-user-select: none; }
  .dcard { grid-row: 1; align-self: center; box-sizing: border-box; height: min(100% - 40px, 330px); min-width: 0; border-radius: 24px; background: var(--chip); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
  .dcard h3 { margin: 0; font-size: 14px; font-weight: var(--w-bold, 700); letter-spacing: .09em; text-transform: uppercase; color: var(--ink2); }
  .dnext { grid-column: 1; justify-self: end; width: min(100%, 270px); } .dturn { grid-column: 3; justify-self: start; width: min(100%, 270px); }
  .dn { display: flex; align-items: center; gap: 12px; min-width: 0; } .dn .puck.onshelf { width: 46px; flex: 0 0 46px; border-width: 2.5px; }
  .dn > span { min-width: 0; display: flex; flex-direction: column; line-height: 1.2; } .dn b, .dn span span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dn b { font-size: 15px; font-weight: var(--w-bold, 700); } .dn span span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .dnone { margin: 0; font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); line-height: 1.3; }
  .dcoins { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .dcoin { width: 48px; height: 48px; padding: 0; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; background: var(--c); color: var(--on-person, #fff); font-size: 15px; font-weight: var(--w-heavy, 800); box-shadow: inset 0 -3px 0 rgba(0,0,0,.18); transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.4,.4,1); }
  .dcoin[data-now] { transform: scale(1.18); box-shadow: inset 0 -3px 0 rgba(0,0,0,.18), 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--c); animation: lamp2 1.1s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); margin: 0 6px; }
  .dwho { margin: 0; font-size: 15px; font-weight: var(--w-semi, 600); } .dwho b { font-weight: var(--w-heavy, 800); }
  .dsleep { min-height: 52px; display: flex; align-items: center; gap: 12px; text-align: left; border-radius: 16px; padding: 4px 8px 4px 4px; }
  .dsleep svg { width: 48px; height: 48px; flex-shrink: 0; } .swt { fill: var(--track); stroke: var(--ink2); stroke-width: 1.5; } .sww { fill: var(--accent); }
  .dsleep > span { display: flex; flex-direction: column; line-height: 1.2; } .dsleep b { font-size: 15px; font-weight: var(--w-bold, 700); } .dsleep span span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .dsleep[data-on] { background: var(--chip-strong); }
  /* the tuner: ticks like a radio dial, a stop for each favourite and station, and a needle to slide */
  .tuner { grid-column: 1 / -1; grid-row: 2; justify-self: center; width: min(100%, 720px); height: 62px; position: relative; border-radius: 20px; background: var(--chip); touch-action: none; cursor: ew-resize; outline: none; user-select: none; -webkit-user-select: none; }
  .tuner:focus-visible { box-shadow: 0 0 0 3px var(--ink); }
  .tticks { position: absolute; left: 3%; right: 3%; top: 8px; height: 12px; background: repeating-linear-gradient(90deg, var(--ink2) 0 1.5px, transparent 1.5px 14.4px); opacity: .7; -webkit-mask-image: linear-gradient(#000 0 6px, transparent 6px), repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 86.4px); -webkit-mask-composite: source-over; mask-image: linear-gradient(#000 0 6px, transparent 6px), repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 86.4px); }
  .tstop { position: absolute; bottom: 9px; transform: translateX(-50%); font-size: 15px; font-weight: var(--w-bold, 700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
  .tstop[data-on] { text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; }
  .tstop:only-of-type { max-width: 90%; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .tneedle { position: absolute; top: 4px; width: 6px; height: 30px; margin-left: -3px; border-radius: 3px; background: var(--danger, #c62a22); transition: left var(--mt-4, 400ms) cubic-bezier(.2,1.3,.4,1); pointer-events: none; opacity: .55; }
  .tneedle::before { content: ''; position: absolute; left: -6px; top: -5px; width: 18px; height: 18px; border-radius: 50%; background: inherit; }
  .tneedle[data-on] { opacity: 1; }
  .bigdial > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; touch-action: none; }
  .dplate { fill: var(--chip); }
  .darc { --c: var(--stream, var(--primary)); cursor: grab; touch-action: none; outline: none; }
  .darc:focus-visible .dtrack { stroke: var(--ink); stroke-opacity: 1; } .darc:focus-visible .dknob { stroke: var(--ink); stroke-width: 5; }
  .tuner:focus-visible, .jog:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
  .dhit { fill: none; stroke: transparent; stroke-width: 46; }
  .dtrack { fill: none; stroke: var(--track); stroke-width: 26; stroke-linecap: round; }
  .dfill { fill: none; stroke: var(--ink3); stroke-width: 26; stroke-linecap: round; opacity: .55; transition: stroke var(--m-2, 160ms); }
  .darc[data-live] .dfill { stroke: var(--c); opacity: 1; }
  .darc[data-playing] .dfill { animation: breathe 2.2s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  .dknob { fill: transparent; stroke: var(--ink3); stroke-width: 4; transform-box: fill-box; transform-origin: center; transition: transform var(--m-2, 160ms) var(--e-spring, ease); }
  .darc[data-live] .dknob { fill: #fff; stroke: var(--c); } .darc[data-held] .dknob { transform: scale(1.15); }
  .darc[data-hot] .dtrack, .darc:focus-visible .dtrack { stroke: var(--chip-strong); filter: drop-shadow(0 0 0 var(--primary)); stroke-width: 30; }
  .darc:focus-visible .dknob { stroke: var(--ink); stroke-width: 5; }
  .dprogt { fill: none; stroke: var(--track); stroke-width: 6; }
  .dprog { fill: none; stroke: var(--accent); stroke-width: 6; stroke-linecap: round; transition: stroke-dasharray calc(1s * var(--m-d, 1)) linear; }
  .dripple { fill: none; stroke: var(--accent); stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: dripple 2.8s ease-out infinite; animation-iteration-count: var(--loops, infinite); }
  .dripple.late { animation-delay: -1.4s; }
  @keyframes dripple { from { transform: scale(1); opacity: .7; } to { transform: scale(1.22); opacity: 0; } }
  .dcover { position: absolute; left: 26%; top: 26%; width: 48%; height: 48%; border-radius: 50%; background: radial-gradient(circle, rgba(0,0,0,.28), rgba(0,0,0,.28)), var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 0 0 3px #fff, 0 12px 26px -10px rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; }
  .dcover span { width: 40px; height: 40px; border-radius: 50%; background: #fff; color: #111; display: flex; align-items: center; justify-content: center; transition: transform var(--mt-2, 160ms) cubic-bezier(.2,1.4,.4,1); }
  .dcover:active span { transform: scale(.9); }
  .dlabels { position: absolute; inset: 0; pointer-events: none; } .dlabels > * { pointer-events: auto; }
  .dlabel { position: absolute; display: flex; flex-direction: column; align-items: center; line-height: 1.15; white-space: nowrap; }
  .dlabel[data-side='r'] { align-items: flex-start; text-align: left; } .dlabel[data-side='l'] { align-items: flex-end; text-align: right; }
  .dname { min-width: 44px; min-height: 44px; padding: 2px 8px; display: flex; flex-direction: column; justify-content: center; align-items: inherit; text-align: inherit; border-radius: 12px; }
  .dname b { font-size: clamp(16px, 4.2cqh, 19px); font-weight: var(--w-bold, 700); display: inline-flex; align-items: center; } .dname span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .dname[aria-pressed='true'] b { text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; }
  .dstep { display: inline-flex; align-items: center; } .dlabel[data-held] .vnum { transform: scale(1.3); }
  :host([data-shape='tall']:not([data-phone])) .dialwrap { grid-template-columns: 1fr 1fr; grid-template-rows: minmax(0, 1fr) auto auto; }
  :host([data-shape='tall']:not([data-phone])) .dmid { grid-column: 1 / -1; grid-row: 1; }
  :host([data-shape='tall']:not([data-phone])) .dcard { grid-row: 2; width: auto; height: auto; justify-self: stretch; align-self: stretch; }
  :host([data-shape='tall']:not([data-phone])) .dturn { grid-column: 2; } :host([data-shape='tall']:not([data-phone])) .tuner { grid-row: 3; }
  :host([data-phone]) .dialwrap { flex: none; display: flex; flex-direction: column; container-type: normal; gap: 12px; } :host([data-phone]) .dmid { padding: 0; }
  :host([data-phone]) .bigdial { height: auto; aspect-ratio: auto; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px; } :host([data-phone]) .bigdial > svg { position: static; width: 250px; height: 250px; }
  :host([data-phone]) .dcover { left: calc(50% - 60px); top: 65px; width: 120px; height: 120px; }
  :host([data-phone]) .dlabels { position: static; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } :host([data-phone]) .dlabel { position: static; transform: none !important; align-items: center; text-align: center; }
  :host([data-phone]) .dcard { width: auto; height: auto; align-self: stretch; } :host([data-phone]) .tuner { order: -1; width: 100%; } :host([data-phone]) .tstop { font-size: 13px; }

  /* ---- desk ---- */
  /* three rows that always fit: what is playing, the keys, then the wheel and the pads (the pads are never cut by the edge) */
  .dside { flex: 0 0 27%; min-width: 0; min-height: 0; display: grid; grid-template-rows: minmax(60px, 1fr) clamp(52px, 13cqh, 64px) minmax(108px, 1.3fr); gap: 12px; padding: 4px 8px 4px 4px; }
  .dstrips { flex: 1; min-width: 0; display: flex; gap: 6px; }
  .dnow { min-height: 0; display: flex; align-items: center; gap: 12px; }
  .dart { height: 100%; max-height: 150px; aspect-ratio: 1; flex-shrink: 0; border-radius: 20px; background: var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 8px 16px -8px rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; }
  .dart i { width: 22%; height: 22%; border-radius: 50%; background: rgba(255,255,255,.7); box-shadow: 0 0 0 2px rgba(0,0,0,.15); opacity: 0; }
  .dart[data-playing] i { opacity: 1; animation: thump .5s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  .dtx { min-width: 0; display: flex; flex-direction: column; gap: 2px; line-height: 1.15; }
  .dtx i { font-style: normal; font-size: 14px; font-weight: var(--w-bold, 700); letter-spacing: .09em; text-transform: uppercase; color: var(--ink2); }
  .dtx b { font-size: clamp(17px, 6cqh, 26px); font-weight: var(--w-heavy, 800); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .dtx span { font-size: 15px; color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .desk .tkeys { flex: none; min-height: 0; }
  .dplay { min-height: 0; display: flex; align-items: center; gap: 12px; }
  .jog { height: 100%; max-height: 136px; aspect-ratio: 1; flex-shrink: 0; position: relative; border-radius: 50%; background: var(--chip-strong); box-shadow: inset 0 0 0 2px var(--track), 0 6px 0 rgba(0,0,0,.16); touch-action: none; cursor: grab; outline: none; display: flex; align-items: center; justify-content: center; }
  .jog[data-held] { cursor: grabbing; box-shadow: inset 0 0 0 3px var(--primary), 0 3px 0 rgba(0,0,0,.16); }
  .jog:focus-visible { box-shadow: inset 0 0 0 3px var(--ink), 0 6px 0 rgba(0,0,0,.16); }
  .jring { position: absolute; inset: 11%; border-radius: 50%; border: 0.5em dotted var(--track); transition: transform calc(1s * var(--m-d, 1)) linear; pointer-events: none; }
  .jog[data-held] .jring { transition: none; }
  .jring i { position: absolute; right: 8%; top: 8%; width: 20%; height: 20%; border-radius: 50%; background: var(--track); box-shadow: inset 0 2px 3px rgba(0,0,0,.2); }
  .jog b { position: relative; font-size: clamp(15px, 5cqh, 20px); font-weight: var(--w-heavy, 800); font-variant-numeric: tabular-nums; }
  .pads { flex: 1; min-width: 0; min-height: 0; align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: minmax(44px, 1fr); gap: 8px; padding-bottom: 6px; }
  .mpad { min-width: 0; min-height: 44px; padding: 0 4px; text-align: center; border-radius: 14px; background: var(--c); color: var(--on-person, #fff); font-size: 15px; font-weight: var(--w-bold, 700); line-height: 1.05; overflow-wrap: anywhere; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; box-shadow: 0 6px 0 rgba(0,0,0,.22); transition: transform var(--mt-1, 80ms), box-shadow var(--m-1, 80ms); }
  .mpad span { font-size: clamp(16px, 4.4cqh, 24px); line-height: 1; }
  .mpad:active, .mpad[data-busy] { transform: translateY(4px); box-shadow: 0 2px 0 rgba(0,0,0,.22); }
  .mpad[data-on] { box-shadow: 0 6px 0 rgba(0,0,0,.22), 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--c); animation: lamp2 .9s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes lamp2 { to { filter: brightness(1.15); } }
  .desk { container-type: size; flex: 1; min-height: 0; display: flex; gap: 6px; padding: 10px; border-radius: 22px; background: var(--chip); user-select: none; -webkit-user-select: none; }
  .strip { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 2px; border-radius: 14px; --c: var(--stream, var(--primary)); }
  .strip[data-focus] { background: var(--chip-strong); }
  .strip[data-hot] { box-shadow: inset 0 0 0 3px var(--c); }
  .strip.master { background: var(--chip-soft); --c: var(--accent); margin-left: 4px; }
  .sname { width: 100%; min-height: 44px; box-sizing: border-box; padding: 2px 4px; border-radius: 8px; background: var(--chip-strong); font-size: 16px; font-weight: var(--w-bold, 700); line-height: 1.1; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; text-align: center; overflow-wrap: anywhere; }
  .lamp { width: 48px; height: 48px; border-radius: 50%; background: #5b6472; color: #fff; font-size: 15px; font-weight: var(--w-heavy, 800); flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 -3px 0 rgba(0,0,0,.2); transition: background var(--m-2, 160ms), box-shadow var(--m-2, 160ms); } .lamp[disabled] { opacity: .5; }
  .lamp[aria-pressed='true'] { background: #15803d; color: #fff; box-shadow: inset 0 -3px 0 rgba(0,0,0,.2), 0 0 0 4px color-mix(in srgb, var(--ok) 30%, transparent); }
  .strip[data-playing] .lamp[aria-pressed='true'] { animation: lamp 1.4s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes lamp { to { box-shadow: inset 0 -3px 0 rgba(0,0,0,.2), 0 0 0 8px color-mix(in srgb, var(--ok) 12%, transparent); } }
  .lamp[data-other] { background: var(--c); font-size: 18px; }
  .master .lamp { background: var(--chip-strong); color: var(--ink); box-shadow: inset 0 0 0 2.5px var(--accent); }
  .master .lamp[data-hot] { box-shadow: 0 0 0 5px var(--accent); }
  .well { flex: 1; min-height: 60px; width: 100%; display: flex; justify-content: center; gap: 2px; }
  .vu { width: 10px; display: flex; flex-direction: column; gap: 3px; margin: 48px 0 70px; }
  .vu i { flex: 1; border-radius: 3px; background: var(--track); }
  .vu i[data-lit] { background: var(--ok); } .vu i[data-lit]:nth-child(-n+4) { background: var(--accent); } .vu i[data-lit]:nth-child(-n+2) { background: var(--danger, #c62a22); }
  .strip[data-playing] .vu i[data-peak] { animation: vu .45s steps(2, jump-none) infinite alternate; animation-iteration-count: var(--loops, infinite); }
  .strip[data-playing] .vu i[data-peak] + i[data-peak] { animation-delay: -.2s; }
  @keyframes vu { to { opacity: .3; } }
  .sval { align-self: center; font-size: 15px; font-weight: var(--w-bold, 700); color: var(--ink2); }
  .desk[data-fit] .vu { display: none; }
  :host([data-shape='tall']:not([data-phone])) .desk { flex-direction: column; gap: 12px; }
  :host([data-shape='tall']:not([data-phone])) .dside { flex: 0 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: 130px 64px; gap: 12px 16px; padding: 4px; }
  :host([data-shape='tall']:not([data-phone])) .dnow { grid-column: 1; grid-row: 1; } :host([data-shape='tall']:not([data-phone])) .desk .tkeys { grid-column: 1; grid-row: 2; }
  :host([data-shape='tall']:not([data-phone])) .dplay { grid-column: 2; grid-row: 1 / 3; } :host([data-shape='tall']:not([data-phone])) .dstrips { min-height: 0; }
  :host([data-phone]) .desk { flex: none; container-type: normal; flex-direction: column; gap: 14px; } :host([data-phone]) .dside { flex: none; display: flex; flex-direction: column; gap: 12px; padding: 4px; } :host([data-phone]) .dnow { flex: none; height: 110px; } :host([data-phone]) .dplay { flex: none; height: 150px; }
  :host([data-phone]) .desk .tkeys { flex: 0 0 60px; } :host([data-phone]) .dstrips { flex: none; height: 360px; overflow-x: auto; } :host([data-phone]) .strip { flex: 0 0 76px; }

  /* ---- crate ---- */
  .rig { flex: 1; min-height: 230px; position: relative; user-select: none; -webkit-user-select: none; container-type: size; --S: min(13cqw, 38cqh); --P: min(23cqw, 54cqh); }
  .wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 1; }
  .wire { fill: none; stroke: var(--c, var(--stream, var(--primary))); stroke-width: 7px; stroke-linecap: round; vector-effect: non-scaling-stroke; --c: var(--stream, var(--primary)); }
  .wire[data-playing] { animation: wire 1.3s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes wire { to { transform: translateY(1.6px); } }
  /* the crate: dividers behind, sleeves fanned in the box */
  .cratecol { position: absolute; left: 0; top: 0; bottom: 0; width: 31%; }
  .ctabs { position: absolute; left: 4%; right: 4%; top: 0; height: 27%; display: flex; gap: 5px; align-items: flex-start; }
  .ctab { flex: 1 1 0; min-width: 0; max-width: 96px; height: 100%; margin-top: 5%; padding: 9px 2px 0; border-radius: 10px 10px 0 0; background: var(--c); color: var(--on-person, #fff); font-size: 16px; font-weight: var(--w-bold, 700); display: flex; align-items: flex-start; justify-content: center; white-space: nowrap; overflow: hidden;
    transition: margin-top var(--mt-3, 240ms) cubic-bezier(.2,1.4,.4,1); }
  .ctab[aria-pressed='true'] { margin-top: 0; box-shadow: 0 -3px 0 var(--chip-strong); }
  .sleeves { position: absolute; z-index: 1; left: 7%; right: 7%; top: 26%; height: var(--S); }
  .sleeve { position: absolute; left: calc(var(--x) * (100% - var(--S))); top: 0; width: var(--S); height: var(--S); transform-origin: 50% 110%; transform: rotate(var(--tilt)); touch-action: none; border-radius: 8px;
    transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.3,.4,1); }
  .sleeve[data-front] { transform: rotate(var(--tilt)) translateY(-9%); }
  .sart { position: absolute; inset: 0; border-radius: 8px; background: var(--art, none) center / cover no-repeat, #3b3f58; box-shadow: inset 0 0 0 2px rgba(255,255,255,.55), -4px 4px 10px -4px rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Bricolage Grotesque', sans-serif; font-size: calc(var(--S) * .3); font-weight: var(--w-heavy, 800); font-style: normal; }
  .sleeve[data-lifted] { opacity: .35; }
  .sleeve:focus-visible .sart { box-shadow: 0 0 0 3px var(--ink); }
  .cbox { position: absolute; left: 0; right: 0; top: calc(26% + var(--S) - 12px); bottom: 0; z-index: 2; border-radius: 14px; background: var(--chip-strong); box-shadow: 0 8px 0 rgba(0,0,0,.14), inset 0 0 0 1.5px rgba(255,255,255,.6); padding: 10px 14px; display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; gap: 4px; overflow: hidden;
    background-image: linear-gradient(var(--track), var(--track)), linear-gradient(var(--track), var(--track)); background-size: calc(100% - 28px) 2px; background-repeat: no-repeat; background-position: 14px 8px, 14px calc(100% - 8px); }
  .clabel { display: flex; align-items: center; gap: 8px; max-width: 100%; }
  .clabel b { min-width: 0; padding: 6px 14px; border-radius: 6px; background: #fff; color: #17140f; font-size: 15px; font-weight: var(--w-bold, 700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
  .cnav { width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; background: var(--chip); display: flex; align-items: center; justify-content: center; } .cnav[disabled] { opacity: .35; }
  .cpick { max-width: 100%; display: flex; flex-direction: column; align-items: center; line-height: 1.2; text-align: center; }
  .cpick b { max-width: 100%; font-size: 16px; font-weight: var(--w-heavy, 800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .cpick span { font-size: 12.5px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .rig[data-fit] .cpick span { display: none; }
  /* the turntable */
  .tdeck { position: absolute; left: 34%; width: 30.6%; top: 0; bottom: 0; display: flex; flex-direction: column; gap: 3.5%; }
  .ttable { flex: 1; min-height: 0; position: relative; border-radius: 26px; background: var(--chip); padding: 3% 4% 2%; display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; transition: box-shadow var(--m-2, 160ms), background var(--m-2, 160ms); }
  .ttable[data-hot] { background: var(--chip-strong); box-shadow: inset 0 0 0 4px var(--stream, var(--primary)); }
  .tplat { position: relative; width: var(--P); height: var(--P); margin-right: calc(var(--P) * .1); flex-shrink: 0; }
  .cdisc { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 6px 0 rgba(0,0,0,.18), 0 14px 22px -10px rgba(0,0,0,.6);
    background: radial-gradient(circle closest-side, #f4efe3 0 2.6%, transparent 3%), radial-gradient(circle closest-side, transparent 34%, #17140f 34.6% 46%, #3a342b 46.4% 47.2%, #17140f 47.6% 59%, #3a342b 59.4% 60.2%, #17140f 60.6% 72%, #3a342b 72.4% 73.2%, #17140f 73.6% 85%, #3a342b 85.4% 86.2%, #17140f 86.6% 100%), var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / 70% 70% no-repeat, #17140f; }
  .cdisc[data-playing] { animation: puck 3.6s linear infinite; animation-iteration-count: var(--loops, infinite); }
  .cdisc:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
  .tpivot { position: absolute; left: 102.5%; top: 7.5%; width: 13%; height: 13%; margin: -6.5% 0 0 -6.5%; border-radius: 50%; background: radial-gradient(circle, #8b8477 0 34%, #26272b 36%); pointer-events: none; }
  .tarm { position: absolute; left: 102.5%; top: 7.5%; width: 0; height: 0; transform: rotate(var(--arm)); transition: transform var(--mt-5, 900ms) cubic-bezier(.3,1.2,.5,1); pointer-events: none; }
  .tarm::before { content: ''; position: absolute; left: calc(var(--P) * -.017); top: 0; width: calc(var(--P) * .034); height: calc(var(--P) * .6); border-radius: 4px; background: #8b8477; box-shadow: 2px 3px 4px rgba(0,0,0,.3); }
  .tarm i { position: absolute; left: calc(var(--P) * -.048); top: calc(var(--P) * .56); width: calc(var(--P) * .096); height: calc(var(--P) * .13); border-radius: 5px; background: #26272b; box-shadow: 2px 3px 4px rgba(0,0,0,.3); }
  .ttitle { max-width: 100%; display: flex; flex-direction: column; align-items: center; line-height: 1.2; text-align: center; }
  .ttitle b { max-width: 100%; font-size: clamp(15px, 5.4cqh, 22px); font-weight: var(--w-heavy, 800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .ttitle span { max-width: 100%; min-height: 1.2em; font-size: 15px; color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .jack { position: absolute; right: -9px; width: 18px; height: 18px; margin-top: -9px; border-radius: 50%; background: var(--stream, var(--primary)); box-shadow: 0 0 0 3px var(--chip-strong); z-index: 2; }
  .tkeys { flex: 0 0 clamp(56px, 17cqh, 76px); display: flex; gap: 8px; }
  .tkey { flex: 1 1 0; border-radius: 20px; background: var(--chip-strong); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 0 rgba(0,0,0,.2); margin-bottom: 6px; transition: transform var(--mt-1, 80ms), box-shadow var(--m-1, 80ms); }
  .tkey.go { flex-grow: 1.3; background: var(--primary); color: var(--on-primary); }
  .tkey:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(0,0,0,.2); }
  /* a speaker for every room, on the end of a cable */
  /* a speaker for every room, on the end of a cable: a tile in the look's own material, its volume a 44 px knob with a ring that fills */
  .cab { position: absolute; right: 0; top: var(--top); width: 30%; height: min(88px, calc(100% / var(--n) - 8px)); min-height: 52px; box-sizing: border-box; transform: translateY(-50%); border-radius: 16px; background: var(--chip); color: var(--ink); display: flex; align-items: center; gap: 2px; padding: 0 2px 0 28px; --c: var(--stream, var(--primary)); box-shadow: inset 0 0 0 1.5px var(--track), 0 6px 12px -8px rgba(0,0,0,.4); }
  .cab[data-focus] { background: var(--chip-strong); box-shadow: inset 0 0 0 3px var(--c), 0 6px 12px -8px rgba(0,0,0,.4); } .cab[data-hot] { box-shadow: inset 0 0 0 4px var(--accent); } .chit { flex: 1; min-width: 0; align-self: stretch; display: flex; align-items: center; gap: 8px; border-radius: 12px; text-align: left; }
  .cone { height: min(40px, 70%); aspect-ratio: 1; border-radius: 50%; background: var(--ink); box-shadow: inset 0 0 0 2px var(--glass-line, rgba(255,255,255,.28)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cone i { width: 56%; height: 56%; border-radius: 50%; background: var(--ink3); box-shadow: inset 0 0 0 5px rgba(0,0,0,.25); } .cab[data-live] .cone i { background: var(--c); }
  .cab[data-playing] .cone i { animation: thump .5s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes thump { from { transform: scale(.82); } to { transform: scale(1.14); } }
  .ctext { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
  .ctext b, .ctext > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .ctext > b { font-size: 16px; font-weight: 700; } .ctext > span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); } .ctext .vnum { min-width: 0; } .cab[data-held] .vnum { transform: scale(1.3); }
  .cvol { display: inline-flex; align-items: center; flex-shrink: 0; }
  .cknob { width: 44px; height: 44px; border-radius: 50%; position: relative; flex-shrink: 0; touch-action: none; cursor: ns-resize; outline: none; background: conic-gradient(from -135deg, var(--c) calc(var(--v) * 2.7deg), var(--track) 0 270deg, transparent 0); transition: transform var(--m-2, 160ms) var(--e-spring, ease); }
  .cknob::before { content: ''; position: absolute; inset: 6px; border-radius: 50%; background: var(--knob, #fff); box-shadow: inset 0 0 0 1.5px var(--ink3), 0 2px 4px rgba(0,0,0,.25); }
  .cknob i { position: absolute; inset: 6px; border-radius: 50%; transform: rotate(calc(-135deg + var(--v) * 2.7deg)); transition: transform var(--m-3, 240ms) var(--e-out, ease); }
  .cknob i::after { content: ''; position: absolute; left: calc(50% - 2px); top: 3px; width: 4px; height: 11px; border-radius: 2px; background: var(--c); }
  .cknob[data-idle] { background: conic-gradient(from -135deg, var(--track) 0 270deg, transparent 0); } .cknob[data-idle]::before { background: transparent; box-shadow: inset 0 0 0 3px var(--ink3); } .cknob[data-idle] i::after { background: var(--ink3); }
  .cab[data-held] .cknob { transform: scale(1.15); }
  .sock[disabled] { opacity: .4; }
  .sock { position: absolute; top: 50%; left: -22px; width: 44px; height: 44px; margin-top: -22px; border-radius: 50%; background: var(--chip-strong); color: var(--ink); font-size: 18px; font-weight: 800; box-shadow: inset 0 0 0 3px var(--ink3); z-index: 2; }
  .sock[aria-pressed='true'] { background: var(--c); box-shadow: inset 0 0 0 3px rgba(255,255,255,.6); }
  :host([data-phone]) .rig { flex: none; display: flex; flex-direction: column; gap: 14px; container-type: normal; --S: 138px; --P: 200px; }
  :host([data-phone]) .cratecol { position: relative; width: auto; height: 330px; }
  :host([data-phone]) .tdeck { position: relative; left: auto; width: auto; height: 400px; gap: 12px; }
  :host([data-phone]) .tkeys { flex-basis: 64px; } :host([data-phone]) .ttitle b { font-size: 19px; }
  :host([data-phone]) .cab { position: relative; top: auto; width: auto; height: 64px; transform: none; padding: 0 52px 0 8px; }
  :host([data-phone]) .sock { left: auto; right: 6px; } :host([data-phone]) .wires, :host([data-phone]) .jack { display: none; }

  /* ---- scene ---- */
  .vscene { flex: 1; min-height: 250px; position: relative; border-radius: 22px; overflow: hidden; user-select: none; -webkit-user-select: none; container-type: size; --sq: .3; --k: .9; --cy: .4; --uh: 1.25; /* one orbit unit: a slice of the height, or less when the scene is narrow, so the orbits use the width */ --u: min(1.25cqh, .56cqw); /* a room's width, and the strip along the bottom the shelf stands on */ --aw: clamp(112px, 30cqh, 164px); --shelf-h: 88px; }
  .vscene[data-narrow] { --sq: .62; --k: .72; }
  .backdrop { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .backdrop path { fill: none; vector-effect: non-scaling-stroke; stroke-linecap: round; }
  .bg1 { stroke: color-mix(in srgb, var(--primary) 55%, transparent); stroke-width: 3px; } .bg2 { stroke: var(--track); stroke-width: 3px; }
  .tie { stroke: var(--c); stroke-width: 4px; stroke-dasharray: 2 9; opacity: .8; stroke-linejoin: round; }
  .drift { animation: sdrift 7s linear infinite; animation-iteration-count: var(--loops, infinite); } .drift.slow { animation-duration: var(--m-5, 900ms); }
  @keyframes sdrift { to { transform: translateX(-20%); } }
  .bgweed { stroke: #0f766e; stroke-width: 9px; opacity: .6; transform-box: fill-box; transform-origin: bottom; animation: weed 3.6s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); } .bgweed.b { stroke: #ea580c; animation-delay: -1.5s; }
  @keyframes weed { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
  .bgstar { fill: #fff; animation: twinkle 2s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); } .bgfly { fill: #fff3a8; animation: twinkle 2.6s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  .sun { position: absolute; left: 14px; top: 10px; max-width: 29%; display: flex; align-items: center; gap: 12px; z-index: 2; } .vscene[data-narrow] .sun { max-width: none; }
  .puck.spot { position: static; margin: 0; width: clamp(64px, 18cqh, 96px); height: clamp(64px, 18cqh, 96px); flex-shrink: 0; }
  .puck.spot[data-playing] { animation: puck 8s linear infinite; animation-iteration-count: var(--loops, infinite); }
  .suntx { min-width: 0; display: flex; flex-direction: column; line-height: 1.2; } .suntx b { font-size: 17px; font-weight: var(--w-heavy, 800); } .suntx span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .actor { width: var(--aw); display: flex; flex-direction: column; align-items: center; gap: 0; border-radius: 18px; touch-action: none; cursor: grab; --c: var(--stream, var(--primary)); }
  /* a free room stands where it is told, but whole: never cut by the edge of the scene, never on the shelf */
  .actor.free { position: absolute; --half: calc(max(var(--aw), 180px) / 2 + 6px); --halfh: calc(var(--aw) * .43 + 28px); left: clamp(var(--half), var(--x), 100% - var(--half)); top: clamp(var(--halfh), var(--y), 100% - var(--halfh) - var(--shelf-h)); transform: translate(-50%, -50%); transition: left var(--mt-5, 900ms) cubic-bezier(.3,1.3,.5,1), top var(--mt-5, 900ms) cubic-bezier(.3,1.3,.5,1); }
  .actor.free[data-held] { left: var(--x); top: var(--y); }
  .actor[data-held] { transition: none; z-index: 5; cursor: grabbing; filter: drop-shadow(0 14px 12px rgba(0,0,0,.3)); }
  .actor[data-held] > svg { transform: scale(1.12); }
  .actor > svg { width: 93%; height: auto; aspect-ratio: 108 / 98; margin-bottom: -8px; overflow: visible; outline: none; transition: transform var(--mt-2, 160ms); }
  .actor > svg:focus-visible { border-radius: 14px; outline: 3px solid var(--ink); outline-offset: -3px; }
  .actor[data-hot] { background: var(--chip-strong); box-shadow: inset 0 0 0 4px var(--c); } .actor[data-focus] .aname { box-shadow: 0 0 0 2.5px var(--c), 0 1px 4px rgba(0,0,0,.18); }
  /* the volume handle: 44 px, a speaker on it; up is louder */
  .agrab { position: absolute; right: -8px; top: 6px; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: ns-resize; touch-action: none; outline: none; z-index: 1; }
  .agrab i { width: 44px; height: 44px; box-sizing: border-box; border-radius: 50%; background: var(--knob, #fff); color: #17140f; box-shadow: inset 0 0 0 3px var(--c), 0 2px 5px rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; transition: transform var(--m-2, 160ms) var(--e-spring, ease); }
  .agrab[data-idle] i { box-shadow: inset 0 0 0 3px var(--ink3), 0 2px 5px rgba(0,0,0,.25); }
  .actor[data-vheld] .agrab i { transform: scale(1.15); } .actor[data-vheld] .vnum { transform: scale(1.3); }
  /* the name chip: opaque, so no orbit, string or wave shows through the words (the second background is for browsers that can work out a colour opposite the ink) */
  .aname { position: relative; z-index: 1; max-width: 200px; min-height: 44px; border-radius: 14px; display: flex; align-items: center; line-height: 1.15; background: var(--chip-strong); background: linear-gradient(var(--chip-strong), var(--chip-strong)), hsl(from var(--ink) h s calc((50 - l) * 1000)); box-shadow: 0 1px 4px rgba(0,0,0,.18); }
  .vscene[data-kind='space'] .aname { background: #1b1e45; background: linear-gradient(var(--chip-strong), var(--chip-strong)), hsl(from var(--ink) h s calc((50 - l) * 1000)); }
  .atx { min-width: 60px; min-height: 44px; padding: 2px 8px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .atx > b { font-size: 16px; font-weight: var(--w-bold, 700); white-space: nowrap; display: inline-flex; align-items: center; } .atx > span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; } .atx[aria-pressed='true'] > b { text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; }
  /* the shelf in the world */
  .skeys { display: flex; gap: 6px; margin-top: 6px; } .suntx .mkeys { margin-top: 6px; }
  .puck.spot[data-hot] { box-shadow: 0 0 0 5px var(--accent), 0 8px 20px -6px rgba(0,0,0,.55); transform: scale(1.08); }
  /* the shelf stands on a strip along the bottom, so the rooms have the whole width above it */
  .sshelf { position: absolute; left: 0; right: 0; bottom: 0; height: var(--shelf-h); box-sizing: border-box; z-index: 3; display: flex; align-items: center; gap: 16px; padding: 0 14px 6px; pointer-events: none; }
  .sshelf > *, .sitem { pointer-events: auto; }
  .sitems { flex: 0 1 calc(var(--n) * 86px); min-width: 0; align-self: stretch; display: flex; align-items: center; justify-content: space-around; gap: 6px; position: relative; pointer-events: none; }
  .sline { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
  .sline path { fill: none; stroke: var(--ink2); stroke-width: 2px; vector-effect: non-scaling-stroke; stroke-linecap: round; stroke-linejoin: round; opacity: .7; }
  .sitem { width: min(56px, 12cqh); min-width: 44px; flex-shrink: 0; position: relative; display: flex; flex-direction: column; align-items: center; touch-action: none; border-radius: 50%; }
  .sitem[data-lifted] .puck { opacity: .3; }
  .sitem:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
  .sdeco { display: none; }
  .slabel { min-height: 44px; flex-shrink: 0; max-width: 46%; padding: 4px 14px; border-radius: 14px; background: var(--chip-strong); display: flex; flex-direction: column; justify-content: center; text-align: left; line-height: 1.15; }
  .slabel b { font-size: 16px; font-weight: var(--w-bold, 700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .slabel span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* sea: buoys, each with a little flag, bobbing on the swell */
  .sshelf[data-kind='sea'] .sitems { padding-top: 14px; }
  .sshelf[data-kind='sea'] .sitem { animation: abob 3s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  .sshelf[data-kind='sea'] .sdeco { display: block; position: absolute; left: 50%; bottom: 96%; width: 3px; height: 34%; margin-left: -1.5px; border-radius: 2px; background: var(--ink); }
  .sshelf[data-kind='sea'] .sdeco::after { content: ''; position: absolute; left: 3px; top: 0; border: 6px solid transparent; border-left: 10px solid var(--accent); border-right: 0; }
  .sshelf[data-kind='sea'] .puck { border-color: #fff; box-shadow: 0 0 0 3px #d9482b, 0 8px 12px -6px rgba(0,0,0,.5); }
  /* reef: each record rests in an open shell on the sea floor */
  .sshelf[data-kind='reef'] .sdeco { display: block; position: absolute; left: -14%; right: -14%; bottom: -8%; height: 62%; border-radius: 0 0 999px 999px; background: repeating-conic-gradient(from -90deg at 50% 0, #ffd9c2 0 12deg, #f6b89a 12deg 24deg); box-shadow: inset 0 -3px 0 rgba(0,0,0,.14); }
  .sshelf[data-kind='reef'] .puck { position: relative; left: auto; bottom: auto; margin-bottom: 14%; }
  /* space and orbit: a constellation of favourites */
  .sshelf[data-kind='space'] .sitem, .sshelf[data-kind='orbit'] .sitem { width: min(50px, 11cqh); }
  .sshelf[data-kind='space'] .sitem:nth-of-type(odd), .sshelf[data-kind='orbit'] .sitem:nth-of-type(odd) { transform: translateY(-16%); }
  .sshelf[data-kind='space'] .puck, .sshelf[data-kind='orbit'] .puck { box-shadow: 0 0 14px 3px color-mix(in srgb, var(--accent) 70%, transparent); animation: twinkle2 2.4s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  @keyframes twinkle2 { from { filter: brightness(.82); } to { filter: brightness(1.12); } }
  .sshelf[data-kind='space'] .sline path, .sshelf[data-kind='orbit'] .sline path { stroke: var(--ink); stroke-dasharray: 1 7; opacity: .8; }
  /* bush: lanterns strung between the trees */
  .sshelf[data-kind='bush'] .sdeco { display: block; position: absolute; left: 50%; bottom: 96%; width: 2px; height: 30%; margin-left: -1px; background: var(--ink2); }
  .sshelf[data-kind='bush'] .puck { box-shadow: 0 0 16px 4px rgba(255,214,102,.75); border-color: #ffe9a8; animation: twinkle2 1.8s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  /* sunset: beach balls on the sand */
  .sshelf[data-kind='sunset'] .sdeco { display: block; position: absolute; inset: -7%; border-radius: 50%; background: conic-gradient(#e11d48 0 60deg, #fff 60deg 120deg, #f59e0b 120deg 180deg, #fff 180deg 240deg, #0ea5e9 240deg 300deg, #fff 300deg); box-shadow: 0 6px 8px -4px rgba(0,0,0,.4); }
  .sshelf[data-kind='sunset'] .puck { position: relative; left: auto; bottom: auto; border: 0; box-shadow: none; transform: scale(.74); }
  .sshelf[data-kind='sunset'] .sitem:active .sdeco { transform: rotate(40deg); transition: transform var(--mt-3, 240ms); }
  /* fridge door: photos pegged on a string */
  .sshelf[data-kind='fridge'] .sitem { border-radius: 3px; transform: rotate(calc((var(--i) - 3) * 1.5deg)); margin-top: 10px; }
  .sshelf[data-kind='fridge'] .puck { border-radius: 3px; border: 4px solid #fff; border-bottom-width: 13px; background: var(--art) center / cover; box-shadow: 0 4px 6px rgba(0,0,0,.28); }
  .sshelf[data-kind='fridge'] .sdeco { display: block; position: absolute; left: 50%; top: -9%; width: 9px; height: 16px; margin-left: -4.5px; border-radius: 2px; background: #c9a36a; box-shadow: 0 1px 2px rgba(0,0,0,.3); z-index: 1; }
  .sshelf[data-kind='fridge'] .slabel { background: var(--note, #fff6c4); border-radius: 2px; transform: rotate(-1.5deg); box-shadow: 0 3px 5px rgba(0,0,0,.2); }
  :host([data-phone]) .vscene { --shelf-h: 112px; --aw: 96px; } :host([data-phone]) .sshelf { gap: 8px; padding: 0 8px 6px; } :host([data-phone]) .sitems { flex: 1; flex-wrap: wrap; align-content: center; justify-content: flex-start; } :host([data-phone]) .sitem { width: 44px; } :host([data-phone]) .slabel { max-width: 34%; } :host([data-phone]) .slabel span, :host([data-phone]) .sline { display: none; }
  /* orbits */
  .ring { position: absolute; left: 50%; top: calc(var(--cy) * 100%); width: calc(var(--r) * var(--k) * 2 * var(--u)); height: calc(var(--r) * var(--k) * var(--sq) * 2 * var(--u)); transform: translate(-50%, -50%); border-radius: 50%; border: 2.5px solid color-mix(in srgb, var(--c) 70%, transparent); pointer-events: none; }
  .ring.park { border: 2px dashed var(--track); }
  .core { position: absolute; left: 50%; top: calc(var(--cy) * 100%); transform: translate(-50%, -50%); z-index: 1; border-radius: 50%; box-shadow: 0 0 34px 8px color-mix(in srgb, var(--accent) 55%, transparent); }
  .plane { position: absolute; left: 50%; top: calc(var(--cy) * 100%); width: 0; height: 0; transform: scaleY(var(--sq)); }
  .arm { position: absolute; left: 0; top: 0; width: 0; height: 0; transform: rotate(calc(var(--a) * 1deg)); }
  .arm[data-moving] { animation: orbit var(--t) linear infinite; animation-delay: calc(var(--a) / 360 * var(--t) * -1); animation-play-state: var(--motion, running); }
  @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .hold { position: absolute; left: 0; top: 0; width: 0; height: 0; transform: translateX(calc(var(--r) * var(--k) * var(--u))); }
  .unspin { width: 0; height: 0; transform: rotate(calc(var(--a) * -1deg)); }
  .arm[data-moving] .unspin { animation: orbit var(--t) linear infinite reverse; animation-delay: calc(var(--a) / 360 * var(--t) * -1); animation-play-state: var(--motion, running); }
  .unsquash { width: 0; height: 0; transform: scaleY(calc(1 / var(--sq))); }
  .actor.planet { position: absolute; left: 0; top: 0; transform: translate(-50%, -42%); }
  .arm[data-away] { opacity: .25; } .actor.clone { pointer-events: none; }
  .orbits { --aw: clamp(108px, 24cqh, 150px); } .orbits .actor > svg { aspect-ratio: 100 / 92; margin-bottom: -6px; }
  .afill { fill: var(--c); } .afill.soft { opacity: .6; } .afill.edge, .aidle.edge { stroke: #fff; stroke-width: 2.5; }
  .aidle { fill: var(--ink3); opacity: .75; } .ahull { fill: #fff; stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
  .aline { fill: none; stroke: var(--ink); stroke-width: 3.5; stroke-linecap: round; } .aline.thin { stroke-width: 1.8; opacity: .7; }
  .aflag { fill: var(--accent); } .amoon { fill: #f6d77a; stroke: rgba(0,0,0,.25); stroke-width: 1; }
  .aeye { fill: #fff; } .apupil { fill: #0b2236; } .abub { fill: none; stroke: #fff; stroke-width: 2; } .aring { fill: none; stroke: #fff; stroke-width: 2.5; opacity: .85; }
  .aglow { fill: var(--c); opacity: .3; transform-box: fill-box; transform-origin: center; animation: aglow 1.6s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes aglow { from { transform: scale(.9); } to { transform: scale(1.2); opacity: .12; } }
  .aorbit { display: none; }
  .alog { fill: #6b4a2b; stroke: #3d2a18; stroke-width: 1.5; } .aflame { fill: var(--c); } .aflame.in { fill: #ffd166; } .aember { fill: #b45309; opacity: .8; }
  .ashade { fill: rgba(0,0,0,.2); } .ainit { fill: #fff; font-size: 20px; font-weight: 700; text-anchor: middle; }
  .bob, .swim, .flick, .sway, .jig { transform-box: fill-box; transform-origin: 50% 100%; }
  .actor[data-playing] .bob { animation: abob 2.6s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  @keyframes abob { from { transform: translateY(-3px) rotate(-3deg); } to { transform: translateY(3px) rotate(3deg); } }
  .actor[data-playing] .swim { transform-origin: center; animation: aswim 2.8s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  @keyframes aswim { from { transform: translateX(-6px) rotate(-4deg); } to { transform: translateX(6px) rotate(4deg); } }
  .actor[data-playing] .abub { animation: abub 2.4s ease-in infinite; animation-iteration-count: var(--loops, infinite); } .abub.late { animation-delay: -1.2s; }
  @keyframes abub { from { transform: translateY(0); opacity: 0; } 20% { opacity: 1; } to { transform: translateY(-46px); opacity: 0; } }
  .actor[data-playing] .flick { animation: aflick .5s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes aflick { from { transform: scale(.96, 1.04) skewX(-3deg); } to { transform: scale(1.04, .95) skewX(3deg); } }
  .actor[data-playing] .sway { transform-origin: center; animation: asway 2.2s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  @keyframes asway { from { transform: translateX(-5px) rotate(-8deg); } to { transform: translateX(5px) rotate(8deg); } }
  .actor[data-playing] .jig { transform-origin: center; animation: ajig .5s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes ajig { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
  .vscene[data-kind='space'] .aidle, .vscene[data-kind='orbit'] .aidle { fill: transparent; stroke: var(--ink2); stroke-width: 2; opacity: 1; }
  :host([data-phone]) .vscene { flex: none; height: 720px; --k: .5; --sq: .9; }
  /* two rooms side by side on a phone: the name may take two lines so the chips never overlap */
  :host([data-phone]) .actor.free { --half: 90px; } :host([data-phone]) .aname { max-width: 176px; } :host([data-phone]) .atx { min-width: 0; padding: 2px; } :host([data-phone]) .atx > b { white-space: normal; flex-wrap: wrap; justify-content: center; text-align: center; max-width: 84px; line-height: 1.05; }
`;
