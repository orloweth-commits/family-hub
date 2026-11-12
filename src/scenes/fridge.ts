import { css, html, nothing, svg, unsafeCSS, type TemplateResult } from 'lit';
import { field, type Ctx, type Scene } from './types';

/**
 * The fridge door. Nothing here is sky: the stage is the door, its edges and the kitchen you can imagine around it.
 * Always there: sun through the kitchen window with gum-leaf shadows by day, sunset through the blind in the evening,
 * the glow of the fridge light at night, dust in the light, a spider's thread, and fairy lights in December.
 * The notes are opaque paper, so the life behind the page plays in the header band, the bottom corners and the bottom edge;
 * a few small quick things (`front`) cross over the notes.
 *
 * Most visitors use `fr-st`: the guest becomes a full-size stage and its actors (`fr-a`) carry their own keyframes.
 * A flipped stage is mirrored whole, so one drawing serves both sides.
 */

// marker inks, plastic and fur
const INK = '#26272b', BLUE = '#24408e', RED = '#c62a22', GREEN = '#17703d', GINGER = '#e39a45', FUR = '#b96f24';
const pen = (c: string, w = 3): string => `fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round`;

/** a meat ant in profile: red-brown head and thorax, dark gaster with a purple sheen; the legs walk as two tripods */
const ant = (x: number, more: unknown = nothing, late = false, head = ''): TemplateResult => svg`<g transform="translate(${x} 12)">
  <ellipse cx="15" cy="17.6" rx="13" ry="1.5" fill="#000" opacity=".14"/>
  <g class="fr-tri ${late ? 'fr-tri2' : ''}" style=${pen('#5b3a2a', .9)}><path d="M20 10.5l3 3 1 4M17 10.5l1 3.5-1 3.5M15 10.5l-4 2.5-2 4.5"/></g>
  <g class="fr-tri ${late ? '' : 'fr-tri2'}" style=${pen('#2a1a14', 1.1)}><path d="M19.5 10.5l3.5 2.5 2 4.5M17.5 10.5l0 3.5-2 3.5M15.5 10.5l-3 2-4 5"/></g>
  <ellipse cx="6.5" cy="9" rx="6" ry="4.3" fill="#241c2b"/><path d="M2.5 7.5q4-3 8-.5" style=${pen('#6b5a80', 1.2)}/><path d="M5 5.2v7.6M8.5 5.4v7.3" stroke="#3a2f45" stroke-width=".6"/>
  <circle cx="13" cy="9.8" r="1.5" fill="#5a2a1a"/><ellipse cx="17.5" cy="9" rx="4" ry="2.7" fill="#8c3b22"/><path d="M14.5 7.8q3-1.5 6 0" style=${pen('#c06a45', .9)}/>
  <g class="${head}" style="transform-box:fill-box;transform-origin:0 70%"><ellipse cx="24" cy="8" rx="3.2" ry="3" fill="#8c3b22"/><path d="M22.5 6.5q1.5-1 3 0" style=${pen('#c06a45', .8)}/><circle cx="25" cy="7.6" r=".8" fill="#1c1210"/><path d="M26.5 9.5l2 1.5M25 6l3-4 3.5 1.5M24.5 6l1.5-5 3.5.5" style=${pen('#2a1a14', .8)}/>${more}</g></g>`;

/** a house fly from above */
const flyArt = html`<svg viewBox="0 0 30 30" width="27" style="overflow:visible"><ellipse cx="17" cy="19" rx="6" ry="8" fill="#000" opacity=".13"/>
  <g class="fr-fw" fill="#eef3f8" fill-opacity=".55" stroke="#7d8896" stroke-width=".5"><ellipse cx="5" cy="13" rx="8" ry="3.6"/><ellipse cx="25" cy="13" rx="8" ry="3.6"/></g>
  <path d="M12 9l-5-4M18 9l5-4M11.5 14l-7 1M18.5 14l7 1M12 18l-5 6M18 18l5 6" style=${pen('#1d1d22', .8)}/><path class="fr-rub" d="M13.8 4.5l-1.4-4M16.2 4.5l1.4-4" style=${pen('#1d1d22', .9)}/>
  <ellipse cx="15" cy="18.5" rx="4.3" ry="6" fill="#6f6a5c"/><path d="M11.5 17h7M11.3 19.5h7.4M12 22h6" stroke="#3a372f" stroke-width=".8"/><path d="M15 13v11" stroke="#2c2a25" stroke-width="1.1"/>
  <ellipse cx="15" cy="11" rx="4.2" ry="4" fill="#4b4d52"/><path d="M13.4 7.5v6.5M16.6 7.5v6.5" stroke="#23242a" stroke-width="1"/><path d="M12 9.5q3-2 6 0" style=${pen('#8d9199', .7)}/>
  <ellipse cx="12.7" cy="5.6" rx="2.3" ry="2.6" fill="#7a2a1e"/><ellipse cx="17.3" cy="5.6" rx="2.3" ry="2.6" fill="#7a2a1e"/><circle cx="12.2" cy="4.8" r=".7" fill="#c9705e"/><circle cx="16.8" cy="4.8" r=".7" fill="#c9705e"/>
  <g class="fr-ff" fill="#eef3f8" fill-opacity=".5" stroke="#7d8896" stroke-width=".5"><path d="M13.5 10Q6 16 8 27q6-4 6.5-17zM16.5 10Q24 16 22 27q-6-4-6.5-17z"/><path d="M13 12l-3.5 12M17 12l3.5 12" fill="none"/></g></svg>`;

/** a marbled gecko from above, head down, tail off the top of the door */
const toes = (x: number, y: number, r: number): TemplateResult => svg`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0l-5 3M0 0l-3 5M0 0l0 6M0 0l3 5M0 0l5 2" style=${pen('#8e8272', 1.5)}/><g fill="#cfc4b0"><circle cx="-5" cy="3" r="1.5"/><circle cx="-3" cy="5.3" r="1.5"/><circle cy="6.3" r="1.5"/><circle cx="3" cy="5.3" r="1.5"/><circle cx="5" cy="2.2" r="1.4"/></g></g>`;
const geckoArt = html`<svg viewBox="0 0 64 120" width="58" style="overflow:visible"><path d="M36 2q7 20 5 42 6 18 0 36 4 12 0 24-4 12-6 12-10-6-10-22-6-22 0-40-2-26 5-50z" fill="#000" opacity=".12" transform="translate(4 3)"/>
  <path class="fr-tng" d="M32 108v20" style=${pen('#d98a94', 2.6)}/>
  <g class="fr-gla"><path d="M26 73l-11 5-4 9" style=${pen('#978a78', 4.2)}/>${toes(11, 88, 20)}<path d="M38 46l11-6 4-9" style=${pen('#978a78', 4.2)}/>${toes(53, 30, 200)}</g>
  <g class="fr-glb"><path d="M38 73l11 5 4 9" style=${pen('#978a78', 4.2)}/>${toes(53, 88, -20)}<path d="M26 46l-11-6-4-9" style=${pen('#978a78', 4.2)}/>${toes(11, 30, 160)}</g>
  <g class="fr-gt"><path d="M26.5 42Q25 18 31 0h2q6 18 4.5 42z" fill="#a39683"/><path d="M27.5 36h9M28 27h8M29 18h6M30 10h4" style=${pen('#6d6254', 2.2)}/><path d="M29.5 40Q28 20 31.5 3" style=${pen('#c9bea9', 1)}/></g>
  <path d="M26 40q-7 19-1 39h14q6-20-1-39z" fill="#a39683"/><path d="M27 42q-5 18 0 36" style=${pen('#c9bea9', 1.4)}/><path d="M38 44q4 16 0 32" style=${pen('#857968', 1.8)}/>
  <g fill="#6d6254"><path d="M28 46q4-3 7 1-3 3-7-1zM31 55q5-2 6 3-5 2-6-3zM27 63q4-2 6 2-4 3-6-2zM32 70q4-1 5 3-4 2-5-3z"/></g><g fill="#d6ccb8"><circle cx="35" cy="50" r="1.2"/><circle cx="28" cy="57" r="1.3"/><circle cx="35" cy="65" r="1.2"/><circle cx="29" cy="73" r="1.1"/></g>
  <g class="fr-gh"><path d="M25 78q-4 10-1 20 3 9 8 10.5 5-1.5 8-10.5 3-10-1-20z" fill="#ab9e8a"/><path d="M27 82q4-3 10 0-5 4-10 0z" fill="#6d6254"/><path d="M26 86q-2 8 1 14" style=${pen('#cdc2ad', 1.3)}/><path d="M30 105h.1M34 105h.1" style=${pen('#5c5246', 1.2)}/>
    <ellipse cx="25.3" cy="94" rx="2.9" ry="3.5" fill="#17130f" stroke="#c9a65a" stroke-width=".9"/><ellipse cx="38.7" cy="94" rx="2.9" ry="3.5" fill="#17130f" stroke="#c9a65a" stroke-width=".9"/><circle cx="26" cy="92.6" r=".9" fill="#fff"/><circle cx="39.4" cy="92.6" r=".9" fill="#fff"/></g></svg>`;

/** a ginger tabby's tail: the base sways, the tip follows late */
const tailArt = html`<svg class="fr-sway" viewBox="0 0 60 104" width="54" style="overflow:visible"><path d="M33 104Q28 70 32 52" style=${pen('#00000022', 17)} transform="translate(5 2)"/>
  <path d="M30 104Q25 70 29 50" style=${pen(GINGER, 16)}/><path d="M25 100Q21 72 25 52" style=${pen('#f0b566', 4)}/><path d="M22 90l15-2M21 76l15-1M22 62l14 1" style=${pen(FUR, 4.5)}/>
  <g class="fr-tip"><path d="M29 52Q32 30 20 16" style=${pen(GINGER, 15)}/><path d="M25 50Q27 32 17 20" style=${pen('#f0b566', 4)}/><path d="M23 44l13 3M24 31l11 6" style=${pen(FUR, 4.5)}/><path d="M21 17l-3-3" style=${pen('#f7ead2', 14)}/></g></svg>`;

const note = svg`<path d="M0 13a3.6 3 0 1 0 5 2.6V5l8-2.4v7.6a3.6 3 0 1 0 2 2.8V0L3 3v10z"/>`;
const starPath = 'M18 2l4.7 10.4 11.3 1.2-8.4 7.7 2.3 11.2L18 26.8 8.1 32.5l2.3-11.2L2 13.6l11.3-1.2z';
/** a gold foil star sticker */
const star = (x = 0, y = 0): TemplateResult => svg`<g transform="translate(${x} ${y})"><path d=${starPath} fill="#000" opacity=".16" transform="translate(1.5 2.5)"/><path d=${starPath} fill="#f3b61b" stroke="#fff8e0" stroke-width="2" stroke-linejoin="round"/><path d="M18 2l4.7 10.4L18 18zM34 13.6l-8.4 7.7L18 18zM27.9 32.5L18 26.8V18zM8.1 32.5l2.3-11.2L18 18zM2 13.6l11.3-1.2L18 18z" fill="#ffe588" opacity=".85"/><path d="M18 2l-4.7 10.4L18 18z" fill="#d99a06" opacity=".55"/></g>`;
/** a marker stick person: head at 30,16; hips at 30,58 */
const stick = (c: string, hat: unknown = nothing): TemplateResult => svg`<g style=${pen(c)}><circle cx="30" cy="16" r="9"/><path d="M30 25v33M30 58l-9 26h-6M30 58l9 26h6"/></g><circle cx="33" cy="14" r="1.6" fill=${c}/>${hat}`;

const knight = (x: number, s: number, col: string, cls = ''): TemplateResult => svg`<g transform="translate(${x} ${(46 * (1 - s)).toFixed(1)}) scale(${s})"><g class="fr-rock ${cls}"><ellipse cx="16" cy="43.5" rx="13" ry="2.5" fill="#000" opacity=".2"/><path d="M8 43v-3h16v3z" fill="#3b3f46"/><path d="M11 40v-9h4v9zM17 40v-9h4v9z" fill="#7d8591"/><path d="M8 33V21q8-5 16 0v12z" fill=${col}/><path d="M9 20v-8q7-9 14 0v8z" fill="#b9c1cc"/><path d="M11 18v-6q2-4 5-5" style=${pen('#e6ebf2', 1.6)}/><path d="M12 14h9" style=${pen(INK, 2.2)}/><path d="M16 5q5-7 9-1-5-1-8 3z" fill=${RED}/><g class="fr-arm ${cls}"><path d="M24 25l5 2" style=${pen('#b9c1cc', 3)}/><path d="M29 36V3" style=${pen('#8a6d3b', 2)}/><path d="M29 3l-3 5h6z" fill="#cfd6df"/><path d="M29 9l8 2-8 3z" fill=${col}/></g><path d="M1 23h9v8q-4.5 5-9 0z" fill="#e9c46a" stroke="#8a6d1d"/></g></g>`;

type K = [number, number, number];
const kf = (name: string, f: [number, string][]): string => `@keyframes ${name}{${f.map(([p, t]) => `${p}%{transform:${t}}`).join('')}}`;
const body = (f: K[]): [number, string][] => f.map(([p, y, r]) => [p, `translateY(${y}%) rotate(${r}deg)`]);
// the gecko's walk: a few quick steps with the body swinging side to side, then dead still
const DOWN: K[] = [[0, -105, 0], [5, -92, 5], [10, -80, -5], [15, -68, 5], [20, -58, -3], [30, -58, -3], [34, -48, 4], [38, -40, -4], [42, -34, 0]], UP: K[] = [[86, -34, 0], [90, -58, 5], [94, -82, -5], [100, -105, 0]];
const GECKO = [
  kf('fr-gk', body([...DOWN, ...UP])),
  kf('fr-gk2', body([...DOWN, [50, -34, 0], [51.5, -29, 0], [53, -34, 0], [60, -34, 0], [62, -33, 0], [64, -34, 0], ...UP])),
  kf('fr-gla', [0, 10, 20, 30, 38, 42, 86, 94, 100].map((p): [number, string] => [p, 'translateY(0)']).concat([5, 15, 34, 90].map((p): [number, string] => [p, 'translateY(3.5px)'])).sort((a, b) => a[0] - b[0])),
  kf('fr-glb', [0, 5, 15, 30, 34, 42, 86, 90, 100].map((p): [number, string] => [p, 'translateY(0)']).concat([10, 20, 38, 94].map((p): [number, string] => [p, 'translateY(3.5px)'])).sort((a, b) => a[0] - b[0])),
  kf('fr-gtk', ([[0, 0], [5, -12], [10, 12], [15, -12], [20, 8], [30, 3], [34, -10], [38, 10], [42, 0], [60, 6], [75, -5], [86, 0], [90, -12], [94, 12], [100, 0]] as [number, number][]).map(([p, r]): [number, string] => [p, `rotate(${r}deg)`])),
].join('\n');

export const fridge: Scene = {
  css: css`
    ${unsafeCSS(GECKO)}
    /* always there */
    .fr-win, .fr-eve, .fr-glow, .fr-dust, .fr-web, .fr-xmas { position: absolute; pointer-events: none; }
    .fr-win { top: -6vh; width: 52vw; height: 112vh; animation: fr-drift 173s ease-in-out infinite alternate; }
    .fr-win svg, .fr-eve svg { width: 100%; height: 100%; display: block; }
    @keyframes fr-drift { from { transform: translateX(-2.5vw); } to { transform: translateX(2.5vw); } }
    .fr-lf { transform-box: view-box; transform-origin: 100% 0; animation: fr-lf 23s ease-in-out infinite alternate; }
    .fr-lf2 { animation-duration: 31s; animation-delay: -9s; }
    @keyframes fr-lf { from { transform: rotate(-2.6deg) translateY(-6px); } to { transform: rotate(2.4deg) translateY(8px); } }
    .fr-eve { left: -8vw; bottom: -6vh; width: 86vw; height: 62vh; animation: fr-breathe 41s ease-in-out infinite alternate; }
    .fr-bars { animation: fr-bars 97s ease-in-out infinite alternate; }
    @keyframes fr-bars { from { transform: translate(-14px, 10px); } to { transform: translate(22px, -12px); } }
    @keyframes fr-breathe { from { opacity: .72; } to { opacity: 1; } }
    .fr-glow { top: 0; right: 0; width: 30vw; height: 100%; background: linear-gradient(to left, rgba(255,246,220,.95) 0, rgba(255,244,214,.5) 7px, rgba(255,244,214,.16) 24%, transparent); animation: fr-breathe 13s ease-in-out infinite alternate; }
    .fr-dust { left: 0; top: 0; width: 2px; height: 2px; border-radius: 50%; animation: fr-dust 61s linear infinite; }
    @keyframes fr-dust { from { transform: translate(0, 0); opacity: 0; } 12%, 85% { opacity: 1; } to { transform: translate(-4vw, -9vh); opacity: 0; } }
    .fr-web { top: 0; left: 3px; transform-origin: 50% 0; animation: fr-web 9.7s ease-in-out infinite alternate; }
    @keyframes fr-web { from { transform: rotate(-5deg); } to { transform: rotate(6deg); } }
    .fr-xmas { left: 0; top: 0; width: 100%; height: 30px; }
    .fr-xmas i { position: absolute; inset: 0; }
    .fr-xmas .fr-w { background: linear-gradient(#2c4a36, #2c4a36) 0 6px / 100% 2px no-repeat; }
    .fr-b1 { background: radial-gradient(circle at 30px 14px, #e2433a 5.5px, transparent 6.5px) 0 0 / 231px 30px repeat-x; animation: fr-tw 3.7s ease-in-out infinite alternate; }
    .fr-b2 { background: radial-gradient(circle at 107px 17px, #f2b824 5.5px, transparent 6.5px) 0 0 / 231px 30px repeat-x; animation: fr-tw 5.3s ease-in-out -2s infinite alternate; }
    .fr-b3 { background: radial-gradient(circle at 184px 13px, #2f9e62 5.5px, transparent 6.5px) 0 0 / 231px 30px repeat-x; animation: fr-tw 4.4s ease-in-out -1s infinite alternate; }
    @keyframes fr-tw { from { opacity: .45; } to { opacity: 1; } }

    /* a stage the size of the door; its actors move themselves */
    .fr-st { left: 0; top: 0; width: 100%; height: 100%; will-change: auto; }
    .fr-st[data-flip] { transform: scaleX(-1); }
    .fr-st[data-flip] svg { transform: none; }
    .fr-a { position: absolute; left: 0; top: 0; display: block; }
    .fr-a svg, .fr-blk { display: block; }
    .fr-top { left: calc(26.5vw + var(--x) * .05); }
    .fr-cnr { left: auto; top: auto; right: 0; bottom: 0; }
    .fr-low { top: auto; bottom: 3px; }
    .fr-edge { top: auto; bottom: -1px; }

    /* small parts shared by the cast */
    .fr-tri { transform-box: fill-box; transform-origin: 50% 0; animation: fr-tri .24s ease-in-out infinite alternate; } .fr-tri2 { animation-direction: alternate-reverse; }
    @keyframes fr-tri { from { transform: skewX(-18deg); } to { transform: skewX(18deg); } }
    .fr-wob { transform-box: fill-box; transform-origin: 50% 100%; animation: fr-wob .7s ease-in-out infinite alternate; }
    @keyframes fr-wob { from { transform: rotate(-5deg); } to { transform: rotate(6deg); } }
    .fr-sway { transform-origin: 50% 100%; animation: fr-sway 1.9s ease-in-out infinite alternate; }
    @keyframes fr-sway { from { rotate: -9deg; } to { rotate: 8deg; } }
    .fr-tip { transform-box: view-box; transform-origin: 48% 50%; animation: fr-tipk 1.9s ease-in-out -.55s infinite alternate; }
    @keyframes fr-tipk { from { transform: rotate(-16deg); } to { transform: rotate(20deg); } }
    .fr-fw { transform-box: fill-box; transform-origin: center; animation: fr-flap .11s ease-in-out infinite alternate; }
    @keyframes fr-flap { from { transform: scaleX(1); } to { transform: scaleX(.45); } }
    .fr-leg { transform-box: fill-box; transform-origin: 50% 0; animation: fr-leg .42s ease-in-out infinite alternate; } .fr-leg2 { animation-direction: alternate-reverse; }
    @keyframes fr-leg { from { transform: rotate(-17deg); } to { transform: rotate(17deg); } }
    .fr-stomp { animation: fr-stomp .42s ease-in-out infinite alternate; transform-origin: 50% 100%; }
    @keyframes fr-stomp { from { transform: translateY(0) rotate(-2deg); } to { transform: translateY(-4px) rotate(3deg); } }
    .fr-spin { transform-box: fill-box; transform-origin: center; animation: fr-spin .8s linear infinite; }
    @keyframes fr-spin { to { transform: rotate(360deg); } }
    .fr-run { animation: fr-run var(--t) linear both; }
    @keyframes fr-run { from { transform: translateX(-100px); } to { transform: translateX(calc(100vw + 20px)); } }

    /* ants */
    .fr-look { animation: fr-look var(--t) linear both; }
    @keyframes fr-look { 0%, 36% { transform: translateX(0); } 50% { transform: translateX(calc(-.14 * (100vw + 260px))); } 62%, 100% { transform: translateX(0); } }
    .fr-hup { animation: fr-hup var(--t) ease-in-out both; }
    @keyframes fr-hup { 0%, 37%, 52%, 100% { transform: rotate(0deg); } 40%, 43% { transform: rotate(-34deg); } 46% { transform: rotate(-18deg); } 49% { transform: rotate(-34deg); } }

    /* fly */
    .fr-flyp { animation: fr-flyp var(--t) linear both; }
    @keyframes fr-flyp { 0% { transform: translate(-30px, 70px) rotate(60deg); } 7%, 9% { transform: translate(8vw, 20px) rotate(75deg); } 15%, 17% { transform: translate(16vw, 62px) rotate(120deg); } 24%, 26% { transform: translate(23vw, 22px) rotate(60deg); } 32%, 41% { transform: translate(27vw, 54px) rotate(0deg); } 43%, 51% { transform: translate(28.2vw, 47px) rotate(-40deg); } 53%, 65% { transform: translate(29.6vw, 52px) rotate(25deg); } 73%, 75% { transform: translate(40vw, 10px) rotate(70deg); } 86%, 87% { transform: translate(62vw, 58px) rotate(115deg); } 100% { transform: translate(calc(100vw + 40px), 14px) rotate(75deg); } }
    .fr-fly .fr-fw, .fr-gf .fr-fw { animation: fr-flap .11s ease-in-out infinite alternate, fr-air var(--t) linear both; }
    .fr-fly .fr-ff { animation: fr-land var(--t) linear both; }
    @keyframes fr-air { 0%, 31.9%, 65.1%, 100% { opacity: 1; } 32%, 65% { opacity: 0; } }
    @keyframes fr-land { 0%, 31.9%, 65.1%, 100% { opacity: 0; } 32%, 65% { opacity: 1; } }
    .fr-rub { transform-box: fill-box; transform-origin: 50% 100%; animation: fr-rub .28s ease-in-out infinite alternate; }
    @keyframes fr-rub { from { transform: scaleX(1); } to { transform: scaleX(.25); } }

    /* gecko */
    .fr-tng { transform-box: fill-box; transform-origin: 50% 0; transform: scaleY(0); animation: fr-tng var(--t) linear both; }
    @keyframes fr-tng { 0%, 79%, 82.5%, 100% { transform: scaleY(0); } 80%, 81.5% { transform: scaleY(.5); } }
    .fr-gk { transform-origin: 50% 0; animation: fr-gk var(--t) ease-in-out both; }
    .fr-gla { animation: fr-gla var(--t) ease-in-out both; } .fr-glb { animation: fr-glb var(--t) ease-in-out both; }
    .fr-gt { transform-box: fill-box; transform-origin: 50% 100%; animation: fr-gtk var(--t) ease-in-out .15s both; }
    .fr-gh { transform-box: fill-box; transform-origin: 50% 0; animation: fr-gh var(--t) ease-in-out both; }
    @keyframes fr-gh { 0%, 52%, 79%, 100% { transform: rotate(0deg); } 56%, 62% { transform: rotate(-15deg); } 68%, 74% { transform: rotate(13deg); } }
    .fr-gf .fr-gk { left: calc(29vw - 15px); animation-name: fr-gk2; }
    .fr-gf .fr-gh { animation: none; }
    .fr-gf .fr-tng { animation-name: fr-tng2; }
    @keyframes fr-tng2 { 0%, 50.8%, 54%, 100% { transform: scaleY(0); } 51.6%, 52.6% { transform: scaleY(1); } }
    .fr-gf .fr-flyp { animation-name: fr-flyq; }
    @keyframes fr-flyq { 0% { transform: translate(-30px, 20px) rotate(80deg); } 6%, 8% { transform: translate(10vw, 60px) rotate(100deg); } 13%, 15% { transform: translate(22vw, 22px) rotate(60deg); } 20%, 52% { transform: translate(29vw, 76px) rotate(0deg) scale(1); opacity: 1; } 53.4%, 100% { transform: translate(29vw, 58px) scale(.3); opacity: 0; } }
    .fr-gf .fr-fw { animation-name: fr-flap, fr-airq; } .fr-gf .fr-ff { animation: fr-landq var(--t) linear both; }
    @keyframes fr-airq { 0%, 19.9% { opacity: 1; } 20%, 100% { opacity: 0; } }
    @keyframes fr-landq { 0%, 19.9% { opacity: 0; } 20%, 100% { opacity: 1; } }

    /* paper aeroplane */
    .fr-pl { animation: fr-pl var(--t) linear both; }
    @keyframes fr-pl { 0% { transform: translate(-70px, 52px); } 34% { transform: translate(25vw, 62px); } 58% { transform: translate(31vw, 62px); } 100% { transform: translate(calc(100vw + 70px), 30px); } }
    .fr-flut { transform-box: fill-box; transform-origin: 50% 100%; animation: fr-flutk .31s ease-in-out infinite alternate; }
    @keyframes fr-flutk { from { transform: scaleY(1); } to { transform: scaleY(.72); } }
    .fr-lp { transform-origin: 50% -15px; animation: fr-lp var(--t) ease-in-out both; }
    @keyframes fr-lp { 0%, 34% { transform: rotate(4deg); } 58% { transform: rotate(-360deg); } 100% { transform: rotate(-364deg); } }

    /* tennis ball and the paw that misses it */
    .fr-bx { top: auto; bottom: 8px; animation: fr-bx var(--t) linear both; }
    @keyframes fr-bx { from { transform: translateX(-50px); } to { transform: translateX(calc(100vw + 50px)); } }
    .fr-by { animation: fr-by .47s cubic-bezier(.2, .6, .5, 1) infinite alternate; }
    @keyframes fr-by { from { transform: translateY(0); } to { transform: translateY(-62px); } }
    .fr-bs { left: 2px; top: auto; bottom: -5px; width: 26px; height: 6px; border-radius: 50%; background: #000; animation: fr-bs .47s cubic-bezier(.2, .6, .5, 1) infinite alternate; }
    @keyframes fr-bs { from { transform: scale(1); opacity: .22; } to { transform: scale(.45); opacity: .07; } }
    .fr-paw { left: 88vw; top: auto; bottom: -4px; transform-origin: 50% 100%; animation: fr-paw var(--t) ease-in-out both; }
    @keyframes fr-paw { 0%, 60%, 100% { transform: translateY(105%); } 70% { transform: translateY(14%) rotate(-8deg); } 74% { transform: translateY(12%) rotate(-15deg); } 78% { transform: translateY(14%) rotate(-7deg); } 82% { transform: translateY(12%) rotate(-16deg); } 86% { transform: translateY(16%) rotate(-22deg); } 90% { transform: translateY(4%) rotate(30deg); } 93% { transform: translateY(8%) rotate(20deg); } 95% { transform: translateY(10%) rotate(24deg); } }

    /* gold star */
    .fr-hand { left: auto; top: auto; right: 0; bottom: 14px; transform-origin: 100% 50%; animation: fr-hand var(--t) ease-in-out both; }
    @keyframes fr-hand { 0%, 64%, 100% { transform: translate(105%, 26px) rotate(8deg); } 24% { transform: translate(6px, -4px) rotate(-2deg); } 29% { transform: translate(0, 0) rotate(0deg); } 32% { transform: translate(-3px, 1px) rotate(-1.5deg); } 36%, 40% { transform: translate(0, 0) rotate(0deg); } 46% { transform: translate(14px, -3px) rotate(2deg); } }
    .fr-hs { animation: fr-hs var(--t) linear both; } @keyframes fr-hs { 0%, 31% { opacity: 1; } 31.1%, 100% { opacity: 0; } }
    .fr-star { left: auto; top: auto; right: 104px; bottom: 44px; animation: fr-star var(--t) linear both; }
    @keyframes fr-star { 0%, 31% { opacity: 0; transform: scale(1); } 31.1% { opacity: 1; transform: scale(1); } 33% { transform: scale(.94); } 36%, 90% { transform: scale(1); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
    .fr-glint { left: auto; top: auto; right: 104px; bottom: 66px; animation: fr-pop var(--t) linear both; }

    /* drip and cloth */
    .fr-drop { animation: fr-drop var(--t) ease-in-out both; }
    @keyframes fr-drop { 0% { transform: translateY(-22px); opacity: 1; } 8%, 16% { transform: translateY(12px); } 26%, 35% { transform: translateY(40px); } 46%, 63% { transform: translateY(66px); opacity: 1; } 64%, 100% { transform: translateY(66px); opacity: 0; } }
    .fr-trail { left: 5px; width: 3px; height: 74px; border-radius: 2px; background: rgba(255,255,255,.6); box-shadow: 1px 0 0 rgba(70,110,140,.25); transform-origin: 50% 0; animation: fr-trail var(--t) ease-in-out both; }
    @keyframes fr-trail { 0% { transform: scaleY(0); opacity: 1; } 8%, 16% { transform: scaleY(.2); } 26%, 35% { transform: scaleY(.58); } 46%, 63% { transform: scaleY(.94); opacity: 1; } 64%, 100% { transform: scaleY(.94); opacity: 0; } }
    .fr-cloth { left: -26px; animation: fr-cloth var(--t) ease-in-out both; }
    @keyframes fr-cloth { 0%, 50% { transform: translate(70px, -70px); } 58% { transform: translate(22px, 0) rotate(-12deg); } 63% { transform: translate(-22px, 30px) rotate(10deg); } 68% { transform: translate(20px, 40px) rotate(-10deg); } 73% { transform: translate(-18px, 22px) rotate(8deg); } 78% { transform: translate(10px, 8px) rotate(-4deg); } 90%, 100% { transform: translate(60px, -80px); } }
    .fr-shine { left: -4px; top: 30px; animation: fr-pop var(--t) linear both; }
    @keyframes fr-pop { 0%, 76%, 96%, 100% { transform: scale(0) rotate(0deg); } 82% { transform: scale(1.2) rotate(30deg); } 90% { transform: scale(.9) rotate(60deg); } }

    /* marker doodles */
    .fr-roar { animation: fr-roar var(--t) linear both; }
    @keyframes fr-roar { 0%, 24%, 34%, 62%, 72%, 100% { opacity: 0; } 26%, 32%, 64%, 70% { opacity: 1; } }
    .fr-jaw { transform-box: fill-box; transform-origin: 0 0; animation: fr-jaw var(--t) linear both; }
    @keyframes fr-jaw { 0%, 24%, 34%, 62%, 72%, 100% { transform: rotate(-16deg); } 26%, 32%, 64%, 70% { transform: rotate(6deg); } }
    .fr-dg { animation: fr-dg var(--t) ease-in-out both; }
    @keyframes fr-dg { 0% { transform: translate(-100px, 30px); } 24% { transform: translate(26vw, 16px); } 36% { transform: translate(26vw, 26px); } 48% { transform: translate(26vw, 16px) rotate(-5deg); } 60% { transform: translate(26vw, 26px); } 72% { transform: translate(26vw, 18px); } 100% { transform: translate(52vw, -90px) rotate(-24deg); } }
    .fr-wing { transform-box: fill-box; transform-origin: 50% 100%; animation: fr-wing .5s ease-in-out infinite alternate; }
    @keyframes fr-wing { from { transform: scaleY(1); } to { transform: scaleY(.25); } }
    .fr-puff { transform-box: fill-box; transform-origin: 0 50%; animation: fr-puff var(--t) ease-out both; }
    @keyframes fr-puff { 0%, 44% { transform: scale(.1); opacity: 0; } 46% { transform: scale(.4); opacity: 1; } 60% { transform: translate(16px, -8px) scale(1.2); opacity: .8; } 70%, 100% { transform: translate(26px, -16px) scale(1.5); opacity: 0; } }
    .fr-trk { left: 0; top: auto; bottom: 1px; width: 100%; height: 8px; overflow: hidden; animation: fr-trk var(--t) linear both; }
    .fr-trk i { display: block; height: 100%; background: repeating-linear-gradient(90deg, #26272b 0 7px, transparent 7px 12px) 0 0 / 100% 2.5px no-repeat, repeating-linear-gradient(90deg, #26272b 0 7px, transparent 7px 12px) 6px 5px / 100% 2.5px no-repeat; opacity: .5; animation: fr-trki var(--t) linear both; }
    @keyframes fr-trk { 0% { transform: translateX(calc(-100% - 100px)); opacity: 1; } 78% { opacity: 1; } 100% { transform: translateX(20px); opacity: 0; } }
    @keyframes fr-trki { 0% { transform: translateX(calc(100% + 100px)); } 100% { transform: translateX(-20px); } }
    .fr-hop { transform-origin: 20% 100%; animation: fr-hop var(--t) ease-in-out both; }
    @keyframes fr-hop { 0%, 40%, 58%, 100% { transform: translateY(0) rotate(0deg); } 46% { transform: translateY(-24px) rotate(-14deg); } 52% { transform: translateY(-20px) rotate(6deg); } }
    .fr-kick { transform-box: fill-box; transform-origin: 100% 0; animation: fr-kick .5s ease-in-out infinite alternate; }
    @keyframes fr-kick { from { transform: rotate(-20deg); } to { transform: rotate(34deg); } }

    /* the band */
    .fr-pop { left: 34px; top: auto; bottom: -2px; transform-origin: 50% 100%; animation: fr-popup var(--t) ease-in-out both; }
    @keyframes fr-popup { 0%, 100% { transform: translateY(108%); } 12%, 26% { transform: translateY(0) rotate(0deg); } 30%, 38% { transform: rotate(-7deg); } 42%, 50% { transform: rotate(-3deg); } 54%, 66% { transform: rotate(-11deg); } 74% { transform: rotate(0deg); } 80% { transform: rotate(16deg); } 86% { transform: translateY(0) rotate(0deg); } }
    .fr-n { top: auto; left: 116px; bottom: 74px; opacity: 0; animation: fr-n 2.2s ease-out both; }
    @keyframes fr-n { 0% { transform: translate(0, 0) scale(.5); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(40px, -30px) scale(1.2) rotate(16deg); opacity: 0; } }
    .fr-bird { left: 46px; top: auto; bottom: 86px; animation: fr-bird var(--t) ease-in-out both; }
    @keyframes fr-bird { 0% { transform: translate(190px, -120px); } 34% { transform: translate(0, 0); } 40%, 48%, 56%, 64%, 72% { transform: translate(0, 0); } 44%, 52%, 60%, 68% { transform: translate(0, -6px) rotate(-8deg); } 100% { transform: translate(-160px, -140px); } }

    /* rogue magnet: slips, hangs on, creeps back up in hitches */
    .fr-mag { animation: fr-mag var(--t) linear both; }
    @keyframes fr-mag { 0% { transform: translateY(-70px) rotate(0deg); } 6% { transform: translateY(-34px) rotate(0deg); } 12%, 17% { transform: translateY(-30px) rotate(-5deg); } 19% { transform: translateY(-28px) rotate(-7deg); animation-timing-function: ease-in; } 27% { transform: translateY(38px) rotate(16deg); animation-timing-function: ease-out; } 30% { transform: translateY(33px) rotate(8deg); } 33%, 52% { transform: translateY(35px) rotate(11deg); } 57%, 60% { transform: translateY(22px) rotate(4deg); } 65%, 68% { transform: translateY(9px) rotate(9deg); } 73%, 76% { transform: translateY(-4px) rotate(2deg); } 81%, 84% { transform: translateY(-17px) rotate(6deg); } 89%, 91% { transform: translateY(-30px) rotate(0deg); } 100% { transform: translateY(-80px) rotate(0deg); } }

    /* fruit sticker */
    .fr-stk { animation: fr-stk var(--t) ease-in-out both; }
    @keyframes fr-stk { 0% { transform: translateY(-50px); } 6% { transform: translateY(8px); } 11%, 15% { transform: translateY(12px) rotate(-3deg); } 21% { transform: translateY(38px) rotate(-7deg); } 25%, 62% { transform: translateY(40px) rotate(-6deg); } 67% { transform: translateY(38px) rotate(-16deg); animation-timing-function: ease-in; } 80% { transform: translate(-34px, 90px) rotate(-120deg); } 100% { transform: translate(-70px, 220px) rotate(-260deg); } }
    .fr-peel { transform-box: fill-box; transform-origin: 70% 60%; animation: fr-peel var(--t) ease-in-out both; }
    @keyframes fr-peel { 0%, 28% { transform: scale(0); } 34% { transform: scale(1); } 39% { transform: scale(.45); } 44% { transform: scale(1); } 49% { transform: scale(.45); } 54% { transform: scale(1); } 59% { transform: scale(.6); } 64%, 100% { transform: scale(1.1); } }
    .fr-tumble { animation: fr-tumble var(--t) linear both; }
    @keyframes fr-tumble { 0%, 67% { transform: scaleX(1); } 73% { transform: scaleX(.25); } 79% { transform: scaleX(1); } 85% { transform: scaleX(.25); } 91% { transform: scaleX(1); } 100% { transform: scaleX(.3); } }

    /* christmas beetle */
    .fr-bt { animation: fr-bt var(--t) ease-in-out both; }
    @keyframes fr-bt { 0% { transform: translate(-50px, 30px) rotate(12deg); } 7% { transform: translate(8vw, 62px) rotate(-10deg); } 14% { transform: translate(17vw, 18px) rotate(14deg); } 20% { transform: translate(25vw, 38px) rotate(20deg); } 22% { transform: translate(27vw, 58px) rotate(0deg); } 23.5% { transform: translate(27vw, 50px) rotate(-5deg); } 25%, 28% { transform: translate(27vw, 54px) rotate(0deg); } 32%, 34% { transform: translate(28.4vw, 54px) rotate(0deg); } 38%, 73% { transform: translate(29.8vw, 54px) rotate(0deg); } 76% { transform: translate(30vw, 48px) rotate(-10deg); } 82% { transform: translate(36vw, 22px) rotate(-22deg); } 90% { transform: translate(50vw, 40px) rotate(6deg); } 100% { transform: translate(72vw, -70px) rotate(-30deg); } }
    .fr-broll { animation: fr-broll var(--t) ease-in-out both; }
    @keyframes fr-broll { 0%, 40% { transform: scaleY(1) rotate(0deg); } 41.5% { transform: scaleY(1) rotate(-8deg); } 43% { transform: scaleY(.1) rotate(0deg); } 44.5% { transform: scaleY(1) rotate(8deg); } 48% { transform: rotate(-13deg); } 52% { transform: rotate(12deg); } 56% { transform: rotate(-14deg); } 60% { transform: rotate(15deg); } 64% { transform: scaleY(1) rotate(-18deg); } 65.5% { transform: scaleY(.1) rotate(0deg); } 67%, 100% { transform: scaleY(1) rotate(0deg); } }
    .fr-bfl { animation: fr-bfl var(--t) linear both; } @keyframes fr-bfl { 0%, 21.9%, 75%, 100% { opacity: 1; } 22%, 74.9% { opacity: 0; } }
    .fr-bld { animation: fr-bld var(--t) linear both; } @keyframes fr-bld { 0%, 21.9%, 43%, 65.4%, 75%, 100% { opacity: 0; } 22%, 42.9%, 65.5%, 74.9% { opacity: 1; } }
    .fr-bun { animation: fr-bun var(--t) linear both; } @keyframes fr-bun { 0%, 42.9%, 65.5%, 100% { opacity: 0; } 43%, 65.4% { opacity: 1; } }
    .fr-bw { transform-box: fill-box; transform-origin: 50% 100%; animation: fr-wing .09s ease-in-out infinite alternate; } .fr-bw2 { transform-origin: 50% 0; }
    .fr-bwk { transform-box: fill-box; transform-origin: center; animation: fr-bwk var(--t) linear both; }
    @keyframes fr-bwk { 0%, 28%, 34%, 38%, 100% { transform: skewX(0deg); } 29%, 31%, 35%, 37% { transform: skewX(16deg); } 30%, 32%, 36% { transform: skewX(-16deg); } }
    .fr-bkick { transform-box: fill-box; transform-origin: center; animation: fr-tri .21s ease-in-out infinite alternate; }

    /* feather */
    .fr-fth { transform-origin: 20% 50%; animation: fr-fth 2.3s ease-in-out infinite alternate; }
    @keyframes fr-fth { from { translate: 0 -12px; rotate: -24deg; } to { translate: 0 12px; rotate: 26deg; } }

    /* mouse and tail */
    .fr-mouse { left: auto; top: auto; right: 0; bottom: 4px; animation: fr-mouse var(--t) ease-in-out both; }
    @keyframes fr-mouse { 0%, 66%, 100% { transform: translateX(110%); } 10%, 20% { transform: translateX(56%); } 25%, 31% { transform: translateX(30%); } 35%, 53% { transform: translateX(6%); } 55%, 59% { transform: translateX(10%) scale(.96, 1.03); } 60% { transform: translateX(14%); animation-timing-function: ease-in; } }
    .fr-nose { transform-box: fill-box; transform-origin: 100% 50%; animation: fr-wob .23s ease-in-out infinite alternate; }
    .fr-ear { transform-box: fill-box; transform-origin: 60% 100%; animation: fr-ear var(--t) ease-in-out both; }
    @keyframes fr-ear { 0%, 50%, 100% { transform: rotate(0deg) scaleY(1); } 14%, 17% { transform: rotate(-8deg); } 53%, 70% { transform: rotate(38deg) scaleY(.75); } }
    .fr-mt { left: auto; top: auto; right: 118px; bottom: -8px; animation: fr-mt var(--t) ease-in-out both; }
    @keyframes fr-mt { 0%, 38%, 100% { transform: translateY(105%); } 52%, 82% { transform: translateY(0); } }

    /* knights */
    .fr-kn { top: auto; bottom: 2px; animation: fr-kn var(--t) linear both; }
    @keyframes fr-kn { 0% { transform: translateX(-150px); } 28%, 70% { transform: translateX(18px); } 100% { transform: translateX(-150px); } }
    .fr-rock { transform-box: fill-box; transform-origin: 50% 100%; animation: fr-rock .91s ease-in-out 4 both, fr-rock .91s ease-in-out calc(var(--t) * .7) 4 forwards; }
    .fr-rock.fr-late { animation-delay: -.2s, calc(var(--t) * .7 - .2s); }
    @keyframes fr-rock { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-7deg); } 75% { transform: rotate(7deg); } }
    .fr-arm { transform-box: fill-box; transform-origin: 0 60%; animation: fr-arm var(--t) ease-in-out both; }
    .fr-arm.fr-late { animation-name: fr-arm2; }
    @keyframes fr-arm { 0%, 36%, 62%, 100% { transform: rotate(0deg); } 42%, 56% { transform: rotate(38deg); } }
    @keyframes fr-arm2 { 0%, 44%, 68%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-30deg); } 55%, 63% { transform: rotate(38deg); } }

    /* pencil on a string */
    .fr-pen { transform-origin: 50% 0; animation: fr-pen var(--t) ease-in-out both; }
    @keyframes fr-pen { 0%, 100% { transform: translateY(-104%); } 10% { transform: translateY(0) rotate(0deg); } 18% { transform: rotate(24deg); } 28% { transform: rotate(-20deg); } 38% { transform: rotate(16deg); } 48% { transform: rotate(-12deg); } 57% { transform: rotate(8deg); } 66% { transform: rotate(-5deg); } 74% { transform: rotate(2deg); } 82%, 86% { transform: translateY(0) rotate(0deg); } 90% { transform: translateY(-30%); } 93% { transform: translateY(-26%); } }

    /* steam, shadows, swimmer, moth */
    .fr-wisp { top: 0; opacity: 0; animation: fr-wisp 6.7s ease-in-out 2 both; }
    @keyframes fr-wisp { 0% { transform: translate(0, 100px) scaleX(.6); opacity: 0; } 30% { opacity: 1; } 70% { opacity: .8; } 100% { transform: translate(34px, -100px) scaleX(1.5); opacity: 0; } }
    .fr-fl { transform-box: fill-box; transform-origin: 50% 60%; animation: fr-wing .62s ease-in-out infinite alternate; }
    .fr-crawl { transform-box: fill-box; transform-origin: 0 50%; animation: fr-spin 1.2s linear infinite; }
    .fr-splash { animation: fr-tw .3s ease-in-out infinite alternate; }
    .fr-mw { transform-box: fill-box; transform-origin: 100% 60%; animation: fr-mwk .15s ease-in-out infinite alternate; } .fr-mw2 { transform-origin: 0 60%; animation-delay: -.02s; }
    @keyframes fr-mwk { from { transform: scaleX(1); } to { transform: scaleX(.2); } }
    .fr-str { transform-box: fill-box; transform-origin: 50% 0; animation: fr-wob 2.9s ease-in-out infinite alternate; }
  `,

  always: (c: Ctx) => {
    const h = c.mins / 60, sun = Math.min(1, Math.max(0, (h - 6) / 12));
    const dec = c.month === 12 ? html`<i class="fr-xmas"><i class="fr-w"></i><i class="fr-b1"></i><i class="fr-b2"></i><i class="fr-b3"></i></i>` : nothing;
    const web = html`<svg class="fr-web" viewBox="0 0 16 64" width="16"><path d="M8 0v50" stroke="#fff" stroke-width=".9" opacity=".75"/><path d="M8 50l-5 3M8 52l5 2M8 55l-5 4M8 56l5 5" style=${pen('#3a3a40', 1)}/><ellipse cx="8" cy="54.5" rx="3.6" ry="4.4" fill="#3a3a40"/><circle cx="6.6" cy="57" r="1" fill="#fff"/><circle cx="9.4" cy="57" r="1" fill="#fff"/></svg>`;
    const leaf = (x: number, y: number, r: number, s = 1): TemplateResult => svg`<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 0q22 44 6 96q-20-46-6-96z"/>`;
    if (c.tod === 'day') return html`
      <i class="fr-win" style="left:${(58 - sun * 56).toFixed(0)}vw"><svg viewBox="0 0 480 800" preserveAspectRatio="none">
        <g transform="skewX(-12)" fill="#fff" opacity=".45"><rect x="170" y="-30" width="140" height="340"/><rect x="324" y="-30" width="140" height="340"/><rect x="170" y="324" width="140" height="330"/><rect x="324" y="324" width="140" height="330"/></g>
        <g class="fr-lf" fill="#4d6470" opacity=".13"><path d="M480 30Q380 60 300 40T150 90" style=${pen('#4d6470', 5)}/>${leaf(400, 46, 8)}${leaf(340, 48, -6, 1.2)}${leaf(290, 40, 14)}${leaf(240, 52, -4, .9)}${leaf(190, 74, 10, 1.1)}</g>
        <g class="fr-lf fr-lf2" fill="#4d6470" opacity=".09"><path d="M480 250Q400 262 330 300T200 330" style=${pen('#4d6470', 4)}/>${leaf(420, 256, -8, 1.3)}${leaf(360, 282, 12)}${leaf(300, 312, -2, 1.2)}${leaf(240, 326, 16, .9)}</g>
      </svg></i>
      <i class="fr-dust" style="box-shadow:${field(26, 7, 'rgba(255,255,255,.95)')}"></i>${web}${dec}`;
    if (c.tod === 'eve') return html`
      <i class="fr-eve"><svg viewBox="0 0 600 400" preserveAspectRatio="none"><defs><radialGradient id="fr-g1" cx=".32" cy="1" r=".72"><stop offset="0" stop-color="#ffb65c" stop-opacity=".5"/><stop offset="1" stop-color="#ffb65c" stop-opacity="0"/></radialGradient><linearGradient id="fr-g2"><stop offset="0" stop-color="#ffd596" stop-opacity="0"/><stop offset=".3" stop-color="#ffd596" stop-opacity=".34"/><stop offset=".7" stop-color="#ffd596" stop-opacity=".3"/><stop offset="1" stop-color="#ffd596" stop-opacity="0"/></linearGradient></defs>
        <rect width="600" height="400" fill="url(#fr-g1)"/><g class="fr-bars" transform="rotate(-9 300 200)" fill="url(#fr-g2)">${[150, 196, 242, 288, 334, 380].map((y) => svg`<rect x="10" y=${y} width="500" height="22"/>`)}</g></svg></i>
      <i class="fr-dust" style="box-shadow:${field(22, 11, 'rgba(255,226,170,.8)')}"></i>${web}${dec}`;
    return html`<i class="fr-glow"></i>${web}${dec}`;
  },

  cast: [
    // ── along the bottom edge ──
    { id: 'ants', ms: 30000, move: 'across fr-edge', weight: 5, art: html`<svg viewBox="0 0 200 32" width="200" style="overflow:visible">
      <g class="fr-look">${ant(4, nothing, false, 'fr-hup')}</g>${ant(58, nothing, true)}
      ${ant(106, svg`<g class="fr-wob"><path d="M27 8l2-9 8-5 9 2 4 8-4 7-10 2z" fill="#e9d5a3"/><path d="M29-1l8-5 9 2-7 3z" fill="#fbf0cc"/><path d="M46 4l4 4-4 7-10 2 6-5z" fill="#c9ab72"/><circle cx="36" cy="5" r="1" fill="#c9ab72"/><circle cx="41" cy="1" r=".8" fill="#c9ab72"/></g>`)}${ant(162, nothing, true)}</svg>` },
    { id: 'pizza', ms: 34000, move: 'across fr-edge', weight: 4, when: (c) => c.weekday === 5, art: html`<svg viewBox="0 0 132 60" width="132" style="overflow:visible">
      <g transform="translate(0 28)">${ant(6)}${ant(36, nothing, true)}${ant(66)}${ant(98, nothing, true)}</g>
      <g class="fr-wob"><path d="M10 12Q4 24 12 38L126 30z" fill="#000" opacity=".13" transform="translate(2 4)"/><path d="M10 10Q4 22 12 36L126 27z" fill="#f2c14e"/><path d="M12 30l114-3-114 9q-2-3 0-6z" fill="#d79a33"/><path d="M30 13q20 2 40 8M40 28q20-2 40-2" style=${pen('#f9de8c', 2.4)}/><path d="M10 9Q3 22 12 37" style=${pen('#c98a3c', 8)}/><path d="M8 12Q4 22 9 32" style=${pen('#e9b566', 2.4)}/>
        <g fill="#b3362a"><circle cx="34" cy="20" r="5.5"/><circle cx="60" cy="24" r="4.8"/><circle cx="84" cy="24" r="3.8"/><circle cx="47" cy="30" r="2.8"/></g><g fill="#d8594a"><circle cx="32.5" cy="18.5" r="2"/><circle cx="58.8" cy="22.8" r="1.7"/><circle cx="83" cy="23" r="1.3"/></g><path d="M22 14l5 2M70 17l5 2M98 26l5-1" style=${pen('#3f7d3a', 2.2)}/></g></svg>` },
    { id: 'tail', ms: 14000, move: 'across fr-low', weight: 3, art: tailArt },
    { id: 'knights', ms: 13000, move: 'fr-st', weight: 2, art: html`<i class="fr-a fr-kn"><svg viewBox="0 0 140 48" width="140">${knight(4, .66, '#2f9e62', 'fr-late')}${knight(44, .84, '#e07b1f')}${knight(92, 1, BLUE)}</svg></i>` },
    { id: 'mouse', ms: 10000, move: 'fr-st', weight: 1.5, art: html`<i class="fr-a fr-mt">${tailArt}</i>
      <i class="fr-a fr-mouse"><svg viewBox="0 0 74 48" width="72"><path d="M6 36Q12 22 28 18q20-6 46 4v26H18Q8 44 6 36z" fill="#000" opacity=".12" transform="translate(-2 2)"/>
        <g class="fr-ear"><ellipse cx="47" cy="13" rx="7.5" ry="8.5" fill="#8a776d"/></g><path d="M4 34Q10 20 26 16q20-6 48 4v26H16Q6 42 4 34z" fill="#96877a"/><path d="M12 24q14-9 34-8 16 0 28 6v-2Q48 8 26 16q-9 3-14 8z" fill="#7b6d62"/><path d="M8 38q16 6 66 2v6H16q-7-3-8-8z" fill="#d8cec3"/>
        <g class="fr-ear"><ellipse cx="34" cy="13" rx="9" ry="10" fill="#a8968b"/><ellipse cx="33.5" cy="13.5" rx="6" ry="7" fill="#dcb3ab"/><path d="M30 9q3-3 6 0" style=${pen('#f0d3cc', 1.2)}/></g>
        <circle cx="17" cy="27" r="2.7" fill="#15120f"/><circle cx="16.2" cy="26.1" r=".9" fill="#fff"/><g class="fr-nose"><circle cx="4.5" cy="34" r="2.3" fill="#d98c96"/><path d="M8 35l-11 5M8 33l-12-2M9 37l-8 9M9 32l-8-8" style=${pen('#efe8e0', .7)}/></g><path d="M24 46q-5-2-7 2h9z" fill="#e2b3ad"/></svg></i>` },
    { id: 'star', ms: 9000, move: 'fr-st', weight: 2, art: html`
      <i class="fr-a fr-star"><svg viewBox="0 0 38 38" width="38">${star()}</svg></i>
      <i class="fr-a fr-glint"><svg viewBox="0 0 16 16" width="16"><path d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff"/></svg></i>
      <i class="fr-a fr-hand"><svg viewBox="0 0 142 84" width="142"><path d="M142 30H108L72 26 38 22q-9 0-9 7t9 7l22 3q-6 12 4 20 14 8 44 4h38z" fill="#000" opacity=".13" transform="translate(-3 5)"/>
        <g class="fr-hs">${star(2, 10)}</g>
        <path d="M142 24h-30q-5 0-6 4v36q1 4 6 4h30z" fill="#2a8c82"/><path d="M142 24h-30q-5 0-6 4v6q10-4 36-3z" fill="#3fa79c"/><path d="M142 60q-24 2-36-2v6q1 4 6 4h30z" fill="#1d6c64"/><path d="M106 28h8v36h-8z" fill="#1d6c64"/><path d="M108.5 30v32M111.5 30v32" stroke="#3fa79c" stroke-width="1"/>
        <path d="M107 30Q90 22 74 27l-6 5q-6 14 2 26 16 10 37 5z" fill="#e0ac86"/><path d="M107 58q-18 5-34-2l-3 2q16 10 37 5z" fill="#c48c68"/><path d="M78 29q12-4 26 2" style=${pen('#f0c8a8', 2.2)}/>
        <path d="M74 27L37 23q-8 0-8 6t8 6l33 3z" fill="#e6b490"/><path d="M36 33.5l34 3.5v2l-33-3q-3-.5-1-2.5z" fill="#c48c68"/><path d="M30.5 26q0-2.5 4-2.5l5 .5v6l-6 .5q-3-.5-3-4.5z" fill="#f4d9c6"/>
        <path d="M60 39q10-3 16 2 2 6-4 8-10 2-14-3-2-5 2-7zM62 49q10-2 15 3 1 6-5 7-9 1-12-4-1-4 2-6zM68 58q8-1 12 3 0 5-6 5-7 0-8-4 0-3 2-4z" fill="#dba27c"/><path d="M60 40q8-2 14 1M63 50q7-1 12 2M69 59q6-1 9 2" style=${pen('#f0c8a8', 1.6)}/>
        <path d="M84 62q-12 12-24 6-5-4 0-8 12 2 18-8z" fill="#e6b490"/><path d="M60 68q-5-4 0-8l4 .5q-4 3 0 6z" fill="#f4d9c6"/></svg></i>` },
    { id: 'trumpet', ms: 10000, move: 'fr-st', weight: 2, art: html`
      ${[2.9, 4.1, 5.4].map((d, i) => html`<i class="fr-a fr-n" style="animation-delay:${d}s;margin-bottom:${i * 9}px"><svg viewBox="0 0 16 19" width=${19 + i * 5} fill=${INK}>${note}</svg></i>`)}
      <i class="fr-a fr-pop"><svg viewBox="0 0 96 96" width="92">${stick(INK, svg`<path d="M20 9h20l-2-13H22z" fill=${RED} stroke=${INK} stroke-width="2" stroke-linejoin="round"/><path d="M30-4q2-9 9-8" style=${pen('#f2b824', 3.4)}/>`)}<path d="M30 34l14-8 8-6M30 38l22-12" style=${pen(INK)}/><path d="M39 17h34l14-9v24l-14-9H39z" fill="#f2b824" stroke="#8a6d1d" stroke-width="1.8" stroke-linejoin="round"/><path d="M52 11v8M59 11v8M66 11v8" style=${pen('#8a6d1d', 3)}/></svg></i>` },
    { id: 'clarinet', ms: 11000, move: 'fr-st', weight: 2, art: html`
      ${[3.4, 5, 6.6].map((d, i) => html`<i class="fr-a fr-n" style="animation-delay:${d}s;left:104px;bottom:${30 + i * 8}px"><svg viewBox="0 0 16 19" width=${15 + i * 4} fill=${BLUE}>${note}</svg></i>`)}
      <i class="fr-a fr-pop"><svg viewBox="0 0 96 96" width="92">${stick(BLUE)}<path d="M38 20l32 42" style=${pen('#1d1d22', 6.5)}/><path d="M67 58l9 12-12-2z" fill="#1d1d22" stroke="#1d1d22" stroke-width="3" stroke-linejoin="round"/><path d="M46 31h.1M52 39h.1M58 47h.1" style=${pen('#d8dde5', 3.4)}/><path d="M30 34l18 2M30 40l26 6" style=${pen(BLUE)}/></svg></i>
      <i class="fr-a fr-bird"><svg viewBox="0 0 32 24" width="30"><path d="M4 12q2-9 11-8t9 9q-1 8-11 8-8 0-9-9z" fill="#f4f1e6" stroke=${INK} stroke-width="2.2"/><path d="M4 11l-4 2 4 2" fill="#f2b824" stroke=${INK} stroke-width="1.6" stroke-linejoin="round"/><circle cx="9" cy="9.5" r="1.5" fill=${INK}/><path d="M14 12q5 5 9 0M24 14l7 4M15 21v3M19 21v3" style=${pen(INK, 2)}/></svg></i>` },

    // ── the header band ──
    { id: 'fly', ms: 10000, move: 'fr-st fr-fly', weight: 5, flip: false, art: html`<i class="fr-a fr-flyp">${flyArt}</i>` },
    { id: 'gecko', ms: 11000, move: 'fr-st', weight: 4, flip: false, art: html`<i class="fr-a fr-top fr-gk">${geckoArt}</i>` },
    { id: 'geckofly', ms: 12000, move: 'fr-st fr-gf', weight: .5, flip: false, art: html`<i class="fr-a fr-flyp">${flyArt}</i><i class="fr-a fr-gk">${geckoArt}</i>` },
    { id: 'plane', ms: 9000, move: 'fr-st', weight: 4, flip: false, art: html`<i class="fr-a fr-pl"><svg class="fr-lp fr-blk" viewBox="0 0 64 36" width="62" style="overflow:visible"><path d="M4 22l56 3-34 8z" fill="#000" opacity=".1"/>
      <g class="fr-flut"><path d="M2 5l58 9-38 3z" fill="#fdfdfb"/><path d="M2 5l26 6 32 3z" fill="#eef1f4"/></g><path d="M22 17l38-3-33 14z" fill="#d3dae2"/><path d="M2 5l20 12-5 9z" fill="#b4bfcb"/><path d="M22 17l5 11-10-2z" fill="#9aa7b5"/><path d="M2 5l58 9" stroke="#8793a0" stroke-width=".7"/></svg></i>` },
    { id: 'pencil', ms: 12000, move: 'fr-st', weight: 3, flip: false, art: html`<i class="fr-a fr-top fr-pen"><svg viewBox="0 0 26 94" width="25"><path d="M9 33h10v44l-5 15-5-15z" fill="#000" opacity=".14" transform="translate(3 2)"/><path d="M12 0q-2 16 0 30" style=${pen('#f4efe2', 1.3)}/><ellipse cx="12" cy="31" rx="3" ry="2" style=${pen('#f4efe2', 1.3)}/>
      <path d="M7 31q5-3 10 0v7H7z" fill="#e58a98"/><path d="M7 31q2-1.5 4-1.5V38H7z" fill="#f3aab4"/><path d="M7 38h10v6H7z" fill="#aab3bf"/><path d="M7 39.5h10M7 42h10" stroke="#7d8794" stroke-width=".8"/><path d="M7 38h3v6H7z" fill="#d3dae3"/>
      <path d="M7 44h10v32H7z" fill="#f0b81f"/><path d="M7 44h3.3v32H7z" fill="#f8d354"/><path d="M13.7 44H17v32h-3.3z" fill="#c9920f"/><path d="M7 76h10l-5 15z" fill="#e8c79a"/><path d="M7 76h3.3L12 91z" fill="#f4dcb8"/><path d="M10.3 86h3.4L12 91z" fill="#2e3136"/></svg></i>` },
    { id: 'drip', ms: 11000, move: 'fr-st', weight: 3, flip: false, art: html`<i class="fr-a fr-top">
      <i class="fr-a fr-trail"></i><i class="fr-a fr-drop"><svg viewBox="0 0 16 22" width="14"><path d="M9 3q6 9 6 13a6 6 0 0 1-12 0q0-4 6-13z" fill="#000" opacity=".12"/><path d="M7 1q6 9 6 13a6 6 0 0 1-12 0q0-4 6-13z" fill="#bfe0f2" fill-opacity=".8"/><path d="M7 20a6 6 0 0 0 6-6q-1 4-6 4t-6-4a6 6 0 0 0 6 6z" fill="#6fa9cc" fill-opacity=".8"/><path d="M4.3 13q0 3 2.2 4" style=${pen('#fff', 1.6)}/><circle cx="8.5" cy="9" r=".9" fill="#fff"/></svg></i>
      <i class="fr-a fr-shine"><svg viewBox="0 0 16 16" width="22"><path d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff"/></svg></i>
      <i class="fr-a fr-cloth"><svg viewBox="0 0 74 56" width="70"><path d="M6 14q10-12 24-8t26-2q10 6 8 20t-10 22q-14 6-26 0T8 40Q0 26 6 14z" fill="#000" opacity=".13" transform="translate(4 5)"/><path d="M6 14q10-12 24-8t26-2q10 6 8 20t-10 22q-14 6-26 0T8 40Q0 26 6 14z" fill="#5fa3d3"/><path d="M8 40q8 6 20 6t26 0q8-8 10-22-6 16-22 18T8 40z" fill="#4384b3"/><path d="M10 14q10-9 20-5t24-2" style=${pen('#9ccbed', 3)}/><path d="M22 8q8 14 2 38M40 6q8 16 4 42" style=${pen('#4384b3', 2.4)}/><path d="M8 24q28-8 56 0M8 35q26-8 54 0" style=${pen('#e8f3fb', 1.6)} opacity=".8"/></svg></i></i>` },
    { id: 'magnet', ms: 12000, move: 'fr-st', weight: 2, flip: false, art: html`<i class="fr-a fr-top fr-mag"><svg viewBox="0 0 50 62" width="46"><path d="M9 13h30L10 47h30" style=${pen('#00000033', 11)} transform="translate(2.5 4.5)"/><path d="M9 13h30L10 47h30" style=${pen('#b63f1c', 11)} transform="translate(0 1.5)"/><path d="M9 13h30L10 47h30" style=${pen('#e4572e', 11)}/><path d="M8 10.5h29M27 21L10 42" style=${pen('#ff9d78', 2.4)}/><path d="M12 50h27" style=${pen('#c4461f', 2)}/></svg></i>` },
    { id: 'sticker', ms: 10000, move: 'fr-st', weight: 2, flip: false, art: html`<i class="fr-a fr-top fr-stk"><svg class="fr-tumble fr-blk" viewBox="0 0 50 38" width="48"><ellipse cx="26" cy="21" rx="21" ry="15" fill="#000" opacity=".15"/><ellipse cx="24" cy="18" rx="21" ry="15" fill="#fbf8ee"/><ellipse cx="24" cy="18" rx="18" ry="12" style=${pen('#c8372d', 1.8)}/><path d="M8 13q8-9 20-9" style=${pen('#fff', 2)}/>
      <path d="M24 12q-8-3-9 5t7 10q2 1 4 0 8-3 6-11-2-6-8-4z" fill="#d43a2f"/><path d="M17 16q1-3 4-3" style=${pen('#f08a7a', 1.6)}/><path d="M24 12q0-4 3-5" style=${pen('#6b4a2a', 1.4)}/><path d="M26 9q5-4 8 0-5 3-8 0z" fill="#4e9a3e"/>
      <path class="fr-peel" d="M33 31q8-3 11-9l-10-1z" fill="#d9d3c2"/></svg></i>` },
    { id: 'dragon', ms: 12000, move: 'fr-st', weight: 2, flip: false, art: html`<i class="fr-a fr-dg"><svg viewBox="0 0 122 72" width="112" style="overflow:visible"><path class="fr-wing" d="M56 40L44 6l17 13 10-15 3 24" style=${pen(RED)} fill="#c62a22" fill-opacity=".22"/><path d="M12 52q12-16 26-6t22-6q10-8 18-20" style=${pen(RED, 9)}/><path d="M14 51L2 44l3 13z" fill=${RED}/><path d="M76 17q6-11 18-7l18 6q3 4-2 6l-18 4q-10 2-16-9z" fill="#e8574f" stroke=${RED} stroke-width="3" stroke-linejoin="round"/><path d="M44 48v9M62 42v10M82 11l-5-9M89 9l-1-8M24 42l3-7 4 6M35 42l4-7 3 7M94 21l14-2" style=${pen(RED)}/><circle cx="90" cy="14.5" r="2.2" fill="#fff"/><path class="fr-puff" d="M116 20q3-9 9-4 6-7 10 1 7 1 4 8 2 7-6 6-5 6-10 1-8 2-7-12z" fill="#fff" fill-opacity=".7" stroke="#5c5f66" stroke-width="2.4" stroke-linejoin="round"/></svg></i>` },
    { id: 'swimmer', ms: 15000, move: 'across', weight: 2, y: [4, 6], art: html`<svg viewBox="0 0 156 46" width="156"><path d="M2 32q9-9 18 0t18 0 18 0 18 0 18 0 18 0 18 0 18 0" style=${pen(BLUE)}/><path class="fr-splash" d="M44 24l-5-7M52 22l-1-9M60 24l4-7" style=${pen(BLUE, 2.2)}/><path d="M66 31l36-3" style=${pen(INK)}/><path class="fr-crawl" d="M102 28h19" style=${pen(INK)}/><circle cx="114" cy="24" r="8" fill="#fff7ea" stroke=${INK} stroke-width="2.6"/><path d="M106.5 21q7-9 15 0z" fill=${RED} stroke=${INK} stroke-width="2"/><path d="M111 25h9" style=${pen(BLUE, 4)}/></svg>` },
    { id: 'steam', ms: 17000, move: 'fr-st', weight: 3, flip: false, when: (c) => c.mins >= 345 && c.mins <= 570, art: html`${[0, 1, 2].map((i) => html`<i class="fr-a fr-wisp" style="left:${30 + i * 4.5}vw;animation-delay:${i * 1.9}s"><svg viewBox="0 0 40 110" width=${34 + i * 6}><path d="M20 110q-20-22-4-44t-4-44q-4-12 8-22 14 12 8 24 16 22 0 42t-4 44z" fill="#5f7885" fill-opacity=".3"/><path d="M20 104q-12-20 0-40t-2-42q-2-10 2-16 6 8 3 18 12 22 0 40t-3 40z" fill="#fff" fill-opacity=".85"/></svg></i>`)}` },
    { id: 'balloon', ms: 22000, move: 'across bobbing', weight: 3, y: [3, 4], when: (c) => c.month === 12, art: html`<svg viewBox="0 0 56 112" width="54"><defs><radialGradient id="fr-bal" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff8f84"/><stop offset=".45" stop-color="#d9342f"/><stop offset="1" stop-color="#8f1b1c"/></radialGradient></defs><ellipse cx="32" cy="34" rx="21" ry="26" fill="#000" opacity=".1"/>
      <path class="fr-str" d="M27 60q-8 12 0 24t-3 26" style=${pen('#f4f1e6', 1.3)}/><ellipse cx="27" cy="29" rx="22" ry="27" fill="url(#fr-bal)"/><path d="M23 54h8l-2 5h-4z" fill="#a52222"/><path d="M13 20q2-9 9-12" style=${pen('#ffd0c9', 3)}/></svg>` },
    { id: 'feather', ms: 17000, move: 'across', weight: 2.5, y: [3, 6], art: html`<svg class="fr-fth" viewBox="0 0 78 26" width="74"><path d="M8 17Q30 4 62 8q10 2 12 6-10 8-32 8-20 0-34-5z" fill="#000" opacity=".1" transform="translate(2 3)"/><path d="M8 13Q30 0 62 4q10 2 12 6-10 8-32 8-20 0-34-5z" fill="#1d1f24"/><path d="M8 13Q20 6 34 3.5L32 18Q18 17 8 13z" fill="#f2f0ea"/><path d="M74 10Q52 9 8 13" style=${pen('#3a3d44', 1)}/><path d="M36 4l-3 8M46 3.5l-3 8M56 4l-3 7M40 17l3-6M52 17l3-6M64 14l2-4" stroke="#3d4047" stroke-width=".7"/><path d="M14 9l4 3M22 6l3 6M16 15l4-3" stroke="#cfccc4" stroke-width=".7"/><path d="M8 13l-7 1.5" style=${pen('#e9e4d6', 1.4)}/></svg>` },
    { id: 'beetle', ms: 13000, move: 'fr-st', weight: 3, flip: false, when: (c) => c.tod !== 'day' && (c.month >= 11 || c.month <= 1), art: html`<i class="fr-a fr-bt"><svg class="fr-broll fr-blk" viewBox="0 0 50 40" width="46" style="overflow:visible"><defs><linearGradient id="fr-btg" x2="0" y2="1"><stop offset="0" stop-color="#f2d894"/><stop offset=".45" stop-color="#c9953c"/><stop offset="1" stop-color="#8b5e1f"/></linearGradient></defs>
      <ellipse cx="25" cy="24" rx="17" ry="10" fill="#000" opacity=".14"/>
      <g class="fr-bfl"><g fill="#f4efe0" fill-opacity=".6" stroke="#9b8f78" stroke-width=".5"><ellipse class="fr-bw" cx="19" cy="6" rx="13" ry="6" transform="rotate(-12 19 6)"/><ellipse class="fr-bw fr-bw2" cx="19" cy="34" rx="13" ry="6" transform="rotate(12 19 34)"/></g><ellipse cx="20" cy="11" rx="10" ry="4.5" transform="rotate(-34 20 11)" fill="url(#fr-btg)"/><ellipse cx="20" cy="29" rx="10" ry="4.5" transform="rotate(34 20 29)" fill="url(#fr-btg)"/><ellipse cx="20" cy="20" rx="9" ry="5" fill="#6d4a22"/></g>
      <g class="fr-bld"><path class="fr-bwk" d="M30 13l4-7 4-1M22 12l-1-8-4-2M14 13l-6-6-4 1M30 27l4 7 4 1M22 28l-1 8-4 2M14 27l-6 6-4-1" style=${pen('#4a3216', 1.5)}/><ellipse cx="20" cy="20" rx="13" ry="9.5" fill="url(#fr-btg)"/><path d="M7 20h26" stroke="#7a521b" stroke-width=".9"/><path d="M11 14q8-4 18-1" style=${pen('#fbeec0', 1.8)}/><path d="M12 17h16M12 23h16M13 26h14" stroke="#b38230" stroke-width=".6"/></g>
      <ellipse cx="33.5" cy="20" rx="6" ry="8" fill="#b9832f"/><path d="M30 15q4-2 6 1" style=${pen('#f2d894', 1.4)}/><ellipse cx="40.5" cy="20" rx="3.5" ry="4.5" fill="#70481c"/><path d="M42 17l4-4 2 .5M42 23l4 4 2-.5" style=${pen('#4a3216', 1.2)}/>
      <g class="fr-bun"><path class="fr-bkick" d="M30 14l5-8 3 2M22 12l0-9 3-1M14 13l-5-8-3 2M30 26l5 8 3-2M22 28l0 9 3 1M14 27l-5 8-3-2" style=${pen('#4a3216', 1.5)}/><ellipse cx="20" cy="20" rx="13" ry="9.5" fill="#5a3b1a"/><path d="M12 14v12M16 12.5v15M20 12v16M24 12.5v15" stroke="#3d2710" stroke-width=".9"/><ellipse cx="33.5" cy="20" rx="6.2" ry="8.2" fill="#6d4a22"/><ellipse cx="40.5" cy="20" rx="3.7" ry="4.7" fill="#4d3418"/><path d="M29 20h9" stroke="#3d2710" stroke-width=".9"/></g></svg></i>` },
    { id: 'shadow', ms: 6000, move: 'across', weight: 3, y: [0, 3], when: (c) => c.tod === 'day', art: html`<svg viewBox="0 0 230 110" width="230" fill="#3d4f5a" opacity=".17">${[[0, 30, 1], [90, 0, .8], [130, 60, .7]].map(([x, y, s]) => svg`<g transform="translate(${x} ${y}) scale(${s})"><path class="fr-fl" d="M0 22Q22 0 44 20q8-9 14-1Q80 0 100 22 76 14 56 32l-6 14-6-14Q24 14 0 22z"/></g>`)}</svg>` },

    // ── in front of the notes: small, quick, never stopping ──
    { id: 'ball', ms: 7000, move: 'fr-st', weight: 4, front: true, art: html`
      <i class="fr-a fr-paw"><svg viewBox="0 0 60 88" width="54"><defs><linearGradient id="fr-fur"><stop offset="0" stop-color="#eeb065"/><stop offset=".6" stop-color="#e09643"/><stop offset="1" stop-color="#c47a2c"/></linearGradient></defs><path d="M20 88V40q0-12 14-12t14 12v48zM10 28q-2-12 8-14 2-9 10-8 7-5 13 0 9-1 10 8 9 3 6 14-2 12-23 12T10 28z" fill="#000" opacity=".14"/>
        <path d="M14 88V36q0-10 14-10t14 10v52z" fill="url(#fr-fur)"/><path d="M14 76q8-4 12 0M30 64q7-4 12 0M14 52q7-4 11 0M31 42q6-3 11 1" style=${pen(FUR, 4)}/>
        <path d="M5 24Q3 13 12 11q2-9 10-8 6-5 12 0 9-1 10 8 9 2 7 13-2 12-23 12T5 24z" fill="#eeb468"/><path d="M7 28q4 8 21 8t21-9q-6 5-21 5T7 28z" fill="#cf8a3a"/><path d="M18 12q1 5 0 9M28 9v10M38 12q-1 5 0 9" style=${pen('#b96f24', 1.6)}/><path d="M12 6q4-3 8 0M24 3q4-3 8 0M36 6q4-2 7 1" style=${pen('#f8e7c9', 2.6)}/><path d="M9 17q2-5 7-5M24 6q4-3 8 0" style=${pen('#fffaf0', 1.8)}/></svg></i>
      <i class="fr-a fr-bx"><i class="fr-a fr-bs"></i><i class="fr-by fr-blk"><svg class="fr-spin" viewBox="0 0 30 30" width="30"><defs><radialGradient id="fr-felt" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#eef86e"/><stop offset=".55" stop-color="#cfe033"/><stop offset="1" stop-color="#93a51c"/></radialGradient></defs><circle cx="15" cy="15" r="13.5" fill="url(#fr-felt)"/><path d="M4 7q11 8 4 19M26 6q-10 9-3 20" style=${pen('#f7f9e8', 2.2)}/></svg></i></i>` },
    { id: 'dino', ms: 11000, move: 'fr-st', weight: 2, front: true, art: html`<i class="fr-a fr-low fr-run"><svg class="fr-stomp" viewBox="0 0 96 64" width="72"><g style=${pen(GREEN)}><path d="M3 32q15 0 27-8 10-8 20-8l2-8q10-5 22-2 6 3 4 9l-16 2"/><path class="fr-jaw" d="M62 17l12 6-16 3"/><path d="M58 26q-2 9-10 15-10 6-20 0Q16 36 3 32M50 30l8 3-1 5M13 29l3-6 4 5 3-7 4 5 4-7"/><path class="fr-leg" d="M38 43l2 14h8"/><path class="fr-leg fr-leg2" d="M28 42l-2 15h8"/><path class="fr-roar" d="M84 8l8-5M86 16h9M84 24l8 5"/></g><circle cx="66" cy="11" r="2" fill=${GREEN}/></svg></i>` },
    { id: 'truck', ms: 9000, move: 'fr-st', weight: 2, front: true, art: html`<i class="fr-a fr-trk"><i></i></i>
      <i class="fr-a fr-low fr-run"><svg class="fr-stomp" style="animation-duration:.19s" viewBox="0 0 88 52" width="70"><path d="M12 12q6-9 12-1 6-8 12 0 5-6 10 0" style=${pen('#8a5a2b')}/><g style=${pen(BLUE)}><path d="M4 32L8 12h42v20zM54 16h14l12 11v9H2M58 20h8l7 7H58z"/><g class="fr-spin"><circle cx="20" cy="41" r="8"/><path d="M12 41h16M20 33v16"/></g><g class="fr-spin"><circle cx="66" cy="41" r="8"/><path d="M58 41h16M66 33v16"/></g></g></svg></i>` },
    { id: 'scooter', ms: 8000, move: 'fr-st', weight: 2, front: true, art: html`<i class="fr-a fr-low fr-run"><svg class="fr-hop fr-blk" viewBox="0 0 64 72" width="62"><path d="M2 20h11M0 30h9M3 40h8" style=${pen('#66625b', 2)}/><g style=${pen(INK)}><circle cx="12" cy="65" r="4.5"/><circle cx="50" cy="65" r="4.5"/><path d="M12 62h34l5-33M46 29h10"/><circle cx="31" cy="16" r="8"/><path d="M31 24l-2 20 4 17M30 30l19 1"/><path class="fr-kick" d="M29 44L18 59"/></g><path d="M22.5 14q1-10 9-10t9 10z" fill=${RED} stroke=${INK} stroke-width="2"/><circle cx="35" cy="17" r="1.4" fill=${INK}/></svg></i>` },
    { id: 'moth', ms: 9000, move: 'flit', weight: 4, front: true, y: [16, 50], when: (c) => c.tod !== 'day', art: html`<svg viewBox="0 0 48 36" width="40"><g class="fr-mw"><path d="M24 15Q14 2 3 4q-3 8 2 15 8 6 19 2z" fill="#8a7458"/><path d="M24 15Q14 2 3 4q8 2 12 8z" fill="#a8916f"/><path d="M24 21q-8 2-13 9 7 5 13-2z" fill="#cdbb9b"/><path d="M8 9q5 0 9 5M6 14q5 1 8 4" style=${pen('#5c4a35', 1.3)}/><circle cx="13" cy="12" r="1.8" fill="#e2d2b3"/></g>
      <g class="fr-mw fr-mw2"><path d="M24 15Q34 2 45 4q3 8-2 15-8 6-19 2z" fill="#8a7458"/><path d="M24 15Q34 2 45 4q-8 2-12 8z" fill="#a8916f"/><path d="M24 21q8 2 13 9-7 5-13-2z" fill="#cdbb9b"/><path d="M40 9q-5 0-9 5M42 14q-5 1-8 4" style=${pen('#5c4a35', 1.3)}/><circle cx="35" cy="12" r="1.8" fill="#e2d2b3"/></g>
      <ellipse cx="24" cy="19" rx="3.6" ry="10" fill="#6a563f"/><ellipse cx="24" cy="13" rx="4.4" ry="4.6" fill="#93805f"/><path d="M22.5 9.5q1.5-1.5 3 0" style=${pen('#c9b792', 1)}/><path d="M23 8Q20 3 15 2M25 8q3-5 8-6" style=${pen('#6a563f', 1)}/></svg>` },
  ],
};
