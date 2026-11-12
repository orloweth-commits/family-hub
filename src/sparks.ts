/* ------------------------------------------------------------------ *
 * Sparks: the small foreground effects of the Family Hub (the touch, the tick, the rare earned surprise).
 *
 *   spark(kind, at, opts?)  →  Animation | null
 *
 * `at` is the element the effect belongs to (or a point in client coordinates). The look comes from the nearest
 * host's `data-look` (or `opts.look`), the colours from the CSS variables on `at`, and calm mode from `--m-d`
 * (0 = nothing travels or scales: the effect is a brief change of opacity instead).
 * Everything is drawn in one fixed, pointer-events-none overlay in the shadow root `at` lives in: created on first
 * use, reused, removed when empty. Web Animations on transform and opacity only; every node is removed when it ends.
 * Never throws, never takes a touch, and never has more than 40 pieces alive at once (an effect that would go over
 * the cap is dropped and returns null). The Animation returned is the effect's lead piece: await `.finished` to chain.
 *
 *   spark('tick', checkEl)                       a checklist row ticked (from the check's centre)
 *   spark('points', badgeEl, { text: '+10' })    a chip rising 24 px and fading
 *   spark('done', listEl)                        a whole list finished, confined to listEl; { soft: true } for a repeat
 *   spark('add', rowEl)                          something was added (grocery item, event, minutes on the timer)
 *   spark('marble', jarEl, { colour })           one marble drops into the jar, the jar wobbles
 *   spark('ring', timerChipEl)                   the kitchen timer finished or was dismissed
 *   spark('sweep', el)                           the first touch of the day
 *   spark('party', nameEl, { colour })           a birthday balloon; { burst: true } for 12 pieces of confetti from it
 *   spark('stomp', choreCardEl)                  dinosaur footprints across a finished chore card
 *   spark('puff', streakChipEl)                  a small dragon puffs when a run of good days continues
 *   spark('truck', groceryListEl)                a truck delivers the last grocery item
 *   spark('tada', rowEl, { variant: 'clarinet' }) a trumpet (or clarinet) flourish when practice is ticked
 *   spark('bounce', eventEl)                     a tennis ball bounces along today's sports event
 *   spark('zip', leaveChipEl)                    a scooter zips along the "ready to go" chip
 *   spark('splash', eventEl)                     a splash for swimming
 *   spark('salute', jarEl)                       a tiny knight pops up and salutes when the family jar is full
 *   spark('rocket', timerChipEl)                 a rocket lifts off when the kitchen timer is started
 *   spark('book', rowEl)                         a book opens and lets out three stars when reading is ticked
 *   spark('quokka', cardEl)                      a quokka pops up, looks about and grins when everyone is ready on time
 *   spark('paint', el)                           a brush paints a rainbow stripe when a doodle is saved to the fridge
 *   spark('moon', rowEl)                         a sleepy moon and three stars when the bedtime list is finished
 *   spark('medal', rewardEl)                     a medal swings in on its ribbon when a reward is claimed
 * ------------------------------------------------------------------ */

export type SparkLook = 'glass' | 'fridge' | 'orbit';
export type SparkKind = 'tick' | 'points' | 'done' | 'add' | 'marble' | 'ring' | 'sweep' | 'party' | 'stomp' | 'puff' | 'truck' | 'tada' | 'bounce' | 'zip' | 'splash' | 'salute' | 'rocket' | 'book' | 'quokka' | 'paint' | 'moon' | 'medal';
export type SparkAt = Element | { x: number; y: number };
export interface SparkOpts {
  /** override the look read from the host's `data-look` */ look?: SparkLook;
  /** `points`: the words on the chip (default "+10") */ text?: string;
  /** `done`, `stomp`: the smaller repeat */ soft?: boolean;
  /** `party`: 12 pieces of confetti from where the balloon floats, instead of the balloon */ burst?: boolean;
  /** `marble`, `party`, and the tint of the invented effects (default: the child's colour `--kid`, else `--c`, else `--primary`) */ colour?: string;
  /** `tada`: 'trumpet' (default) or 'clarinet' */ variant?: string;
  /** `party`: how long the balloon bobs, in ms (default 4200); travelling effects: 1 = left to right (default), -1 = right to left */ ms?: number; dir?: 1 | -1;
  /** force the calm form on or off (default: read from `--m-d` and the device's reduce-motion setting) */ calm?: boolean;
}

/** the most pieces alive at once, over every overlay */
export const SPARK_CAP = 40;
export const SPARK_KINDS: SparkKind[] = ['tick', 'points', 'done', 'add', 'marble', 'ring', 'sweep', 'party', 'stomp', 'puff', 'truck', 'tada', 'bounce', 'zip', 'splash', 'salute', 'rocket', 'book', 'quokka', 'paint', 'moon', 'medal'];

const OUT = 'cubic-bezier(.2,.8,.2,1)', SPRING = 'cubic-bezier(.2,1.4,.4,1)', IN = 'cubic-bezier(.4,0,1,1)', GOLD = '#f6b90f';
const CSS = `
.spk-layer{position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;contain:layout style}
.spk-fx{position:absolute;transform-origin:0 0;pointer-events:none}
.spk-fx *{pointer-events:none}
.spk-p,.spk-q{position:absolute;left:0;top:0}
.spk-p{opacity:0}
.spk-clip{position:absolute;overflow:hidden}
.spk-fx svg{position:absolute;left:0;top:0;overflow:visible}
.spk-f{fill:var(--c);stroke:rgba(255,255,255,.9);stroke-width:1;stroke-linejoin:round}
.spk-l{fill:none;stroke:var(--c);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.spk-w{fill:#fff}
.spk-d{fill:var(--ink)}
.spk-fridge .spk-f{stroke:var(--ink);stroke-width:1.5}
.spk-fridge .spk-l{stroke:var(--ink)}
.spk-orbit .spk-f{fill:var(--gd);stroke:var(--c);stroke-width:1.3}
.spk-orbit .spk-w{fill:var(--c)}
.spk-orbit .spk-d{fill:var(--c)}
.spk-orbit .spk-sh,.spk-fridge .spk-sh{display:none}
.spk-orbit .spk-g{fill:var(--gd);stroke:var(--ac);stroke-width:1.3}
`;

type F = [transform: string, opacity: number, offset?: number, easing?: string];
type Plan = [el: Element, frames: Keyframe[], timing: KeyframeAnimationOptions];
interface E {
  look: SparkLook; calm: boolean; o: SparkOpts; w: HTMLElement; W: number; H: number; target: Element | null; rad: string; font: string;
  kid: string; pal: string[]; plans: Plan[]; own: Plan[]; dir: 1 | -1;
}

const layers = new Set<HTMLElement>();
const byRoot = new WeakMap<Node, HTMLElement>();
const R = (a: number, b: number): number => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const K = (f: F[]): Keyframe[] => f.map(([transform, opacity, offset, easing]) => ({ transform, opacity, ...(offset != null ? { offset } : {}), ...(easing ? { easing } : {}) }));
/** opacity only: in, hold, out */
const blink = (peak = 1): Keyframe[] => [{ opacity: 0 }, { opacity: peak, offset: 0.25 }, { opacity: peak, offset: 0.7 }, { opacity: 0 }];

/** how many pieces are alive right now, everywhere */
export const sparkCount = (): number => { let n = 0; for (const l of layers) { if (!l.isConnected) layers.delete(l); else n += l.querySelectorAll('[data-p]').length; } return n; };

/* ---- building blocks ---- */
const el = (e: E, css: string, inner = '', parent: Element = e.w, piece = true): HTMLElement => {
  const d = document.createElement('div'); d.className = piece ? 'spk-p' : 'spk-q'; if (piece) d.setAttribute('data-p', ''); d.style.cssText = css; if (inner) d.innerHTML = inner; parent.appendChild(d); return d;
};
const circle = (e: E, x: number, y: number, d: number, css: string, parent?: Element): HTMLElement => el(e, `left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px;border-radius:50%;box-sizing:border-box;${css}`, '', parent);
const svg = (w: number, h: number, inner: string, css = ''): string => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="${css}">${inner}</svg>`;
const art = (e: E, x: number, y: number, w: number, h: number, inner: string, css = '', parent?: Element, piece = true): HTMLElement => el(e, `left:${x}px;top:${y}px;width:${w}px;height:${h}px;${css}`, svg(w, h, inner), parent, piece);
const clip = (e: E, x: number, y: number, w: number, h: number): HTMLElement => { const d = document.createElement('div'); d.className = 'spk-clip'; d.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`; e.w.appendChild(d); return d; };
const A = (e: E, node: Element, frames: Keyframe[], ms: number, delay = 0, easing = 'linear', more?: KeyframeAnimationOptions): void => {
  /* with more than two keyframes an easing over the whole run would rush the fade: ease the first leg only */
  if (frames.length > 2 && easing !== 'linear' && !more) { if (!frames[0].easing) frames[0].easing = easing; easing = 'linear'; }
  e.plans.push([node, frames, { duration: ms, delay, easing, fill: 'both', ...more }]); };
/** a small movement of the target itself, added on top of whatever transform it already has */
const T = (e: E, rot: number[], ms: number, delay = 0): void => { if (e.target && !e.calm) e.own.push([e.target, rot.map((r) => ({ transform: `rotate(${r}deg)` })), { duration: ms, delay, easing: 'ease-in-out', composite: 'add' }]); };
const confine = (e: E): void => { e.w.style.overflow = 'hidden'; e.w.style.borderRadius = e.rad; };
const wash = (e: E, css: string, peak: number, ms = 700): void => { A(e, el(e, `width:${e.W}px;height:${e.H}px;border-radius:${e.rad};box-sizing:border-box;${css}`), blink(peak), ms); };

/** a throw under gravity, sampled from the real curve as straight legs (seconds, px/s, px/s²); `flip` tumbles the piece like paper */
const toss = (vx: number, vy: number, g: number, sec: number, spin = 0, flip = 0, n = 6): Keyframe[] => Array.from({ length: n + 1 }, (_, i) => {
  const t = (i / n) * sec;
  return { transform: `translate(${(vx * t).toFixed(1)}px,${(vy * t + (g * t * t) / 2).toFixed(1)}px) rotate(${Math.round((spin * i) / n)}deg) scale(${i ? 1 : 0.4},${(i ? Math.cos(i * flip) : 0.4).toFixed(2)})`, opacity: i === 0 || i === n ? 0 : 1 };
});
/** a curled scrap of paper in two tones */
const paper = (e: E, x: number, y: number, i: number): HTMLElement => {
  const c = e.pal[i % e.pal.length], w = R(8, 12), o = e.look === 'orbit';
  return art(e, x, y, 10, 8, `<path d="M0 2Q5-.5 10 2V5Q5 2.500 0 5z" fill="${o ? 'none' : c}" stroke="${o ? c : 'none'}"/><path d="M0 5Q5 2.500 10 5L8.500 7.500Q5 5.800 1.500 7.500z" fill="${o ? 'none' : `color-mix(in srgb,${c} 68%,#000)`}" stroke="${o ? c : 'none'}" stroke-width=".8"/>`, `scale:${(w / 10).toFixed(2)}`);
};

/* ---- drawings (classes: spk-f filled shape, spk-l line, spk-w white detail, spk-d dark detail; each look styles them) ---- */
const STAR = 'M10 1l2.7 5.7 6.2.7-4.6 4.2 1.3 6.1L10 14.6l-5.6 3.1 1.3-6.1L1.1 7.4l6.2-.7z';
const FOIL = '<defs><linearGradient id="spk-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe98a"/><stop offset=".42" stop-color="#f6b90f"/><stop offset=".56" stop-color="#fff4b8"/><stop offset=".7" stop-color="#f2b20a"/><stop offset="1" stop-color="#cf9004"/></linearGradient></defs>';
/** a gold foil star sticker: soft shadow, white edge, a band of shine and one point curling up off the paper */
const star = (e: E): string => e.look === 'orbit' ? `<path d="${STAR}" fill="none" stroke="var(--ac)" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 6.500v6M7 9.500h6" stroke="var(--ac)" stroke-width="1" stroke-linecap="round" opacity=".7"/>`
  : `${FOIL}<path d="${STAR}" transform="translate(.9 1.500)" fill="#000" opacity=".2" stroke="#000" stroke-width="3" stroke-linejoin="round"/><path d="${STAR}" fill="#fff" stroke="#fff" stroke-width="3.400" stroke-linejoin="round"/><path d="${STAR}" fill="url(#spk-g)" stroke="#c98a00" stroke-width=".6" stroke-linejoin="round"/>`
  + '<path d="M19.800 7.200l-5.200-.5 2.300 3.600z" fill="#000" opacity=".22"/><path d="M18.900 7.400l-4.500-.6 1.800 3.200c1.500-.3 2.500-1.300 2.700-2.600z" fill="#fff6c8" stroke="#c98a00" stroke-width=".5" stroke-linejoin="round"/>';
const FOOT = '<path class="spk-f" d="M12 25.500C8.500 22 4 14 2.500 6c3.500 1.500 5.800 4.500 6.800 7.500C9.800 8.500 10.800 4 12 .5c1.200 3.500 2.200 8 2.700 13 1-3 3.300-6 6.800-7.500C20 14 15.500 22 12 25.500z"/>';
const BALLOON = '<path class="spk-f" d="M13 1C6 1 1.500 6 1.500 13c0 8 6.500 16 9.500 18l-1.500 2.500h7L15 31c3-2 9.500-10 9.500-18C24.500 6 20 1 13 1z"/><path class="spk-sh" d="M21 5c3 6 1 17-7 25.500 5-3.500 10.500-10.500 10.500-17.500 0-3-1.300-6-3.500-8z" opacity=".16"/><path d="M6.500 9c.8-2.800 2.800-4.600 5-5" fill="none" stroke="#fff" stroke-width="2.200" stroke-linecap="round" opacity=".8"/><circle cx="6" cy="12.500" r="1" fill="#fff" opacity=".6"/>';
const STRING = '<path class="spk-l" style="stroke-width:1.100" d="M2.500 0c-3 4 3 7 0 12"/>';
const MARBLE = '<circle class="spk-f" cx="7" cy="7" r="6.300"/><path d="M2.300 9.500C5 4 9 10 11.800 4.800" fill="none" stroke="#fff" stroke-width="1.700" stroke-linecap="round" opacity=".75"/><path class="spk-sh" d="M3.300 11.300C6.500 7.300 9.500 12 12.300 8" fill="none" stroke="#000" stroke-width="1.300" stroke-linecap="round" opacity=".28"/>';
const GLOSS = '<defs><radialGradient id="spk-m" cx=".34" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></radialGradient></defs><circle class="spk-sh" cx="7" cy="7" r="6.300" fill="url(#spk-m)"/><ellipse cx="4.700" cy="4.200" rx="1.600" ry="1" fill="#fff" transform="rotate(-35 4.700 4.200)"/>';
const ROCKET = '<path class="spk-f" d="M3.500 17L.5 24h3.500zM14.500 17l3 7H14z"/><path class="spk-f" style="--c:#f4f6fb" d="M9 1C4.500 5 3.500 11 3.500 17v5.500h11V17C14.500 11 13.500 5 9 1z"/><path class="spk-f" d="M9 1C7 2.800 5.800 5 5 7.500h8C12.200 5 11 2.800 9 1z"/><circle class="spk-f" style="--c:#7cc4f0" cx="9" cy="12.500" r="2.400"/><path class="spk-sh" d="M12 4.500c1.800 3.500 2.500 8 2.500 12.500v5.500H12z" opacity=".13"/>';
const FLAME = '<path class="spk-f" style="--c:#ff9d2e" d="M1 0h8c0 4.500-2 8-4 10C3 8 1 4.500 1 0z"/><path d="M3.200 0h3.600c0 2.500-.8 4.500-1.800 5.800C4 4.500 3.200 2.500 3.200 0z" fill="#ffe680"/>';
const PAGE = '<path class="spk-f" d="M0 4.500Q8 1 15.500 4.500V21Q8 18 0 21z"/><path class="spk-f" style="--c:#fffdf5" d="M1.500 3Q8 .3 15.500 3.500V19Q8 16 1.500 18.500z"/><path class="spk-l" style="--c:#9aa3b2;stroke-width:1" d="M4 6.500q4-1.300 9 0M4 9.800q4-1.300 9 0M4 13.100q3-1 6-.4"/>';
const TWINK = '<path class="spk-g" fill="url(#spk-g)" stroke="#c98a00" stroke-width=".5" stroke-linejoin="round" d="M5.500 0l1.500 4L11 5.500 7 7l-1.500 4L4 7 0 5.500 4 4z"/>';
const QUOKKA = [6.5, 23.5].map((x) => `<ellipse class="spk-f" cx="${x}" cy="7.500" rx="3.300" ry="3.900"/><ellipse cx="${x}" cy="7.900" rx="1.500" ry="2.100" fill="#6b4a38"/>`).join('')
  + '<path class="spk-f" d="M15 4.500c5.500 0 9 3.300 10.200 7.800 1.500 5.500-1.700 14.200-10.200 14.200S3.300 17.800 4.800 12.300C6 7.800 9.500 4.500 15 4.500z"/><path class="spk-f" style="--c:#e6cdaa;stroke:none" d="M15 14.500c4 0 7.500 2.500 7.500 6s-3.500 5-7.500 5-7.500-1.500-7.500-5 3.500-6 7.500-6z"/><path class="spk-d" d="M12.300 15.600h5.400c.6 0 .9.700.5 1.200L15.800 19.200c-.4.400-1.200.4-1.600 0L11.800 16.800c-.4-.5-.1-1.200.5-1.200z"/>'
  + '<path class="spk-l" style="--c:var(--ink);stroke-width:1.200" d="M8.800 19.500c1.500 3.300 5 3.500 6.200.3 1.200 3.200 4.700 3 6.200-.3"/><circle class="spk-d" cx="10.300" cy="12.300" r="1.350"/><circle class="spk-d" cx="19.700" cy="12.300" r="1.350"/><path class="spk-f" style="--c:#6aa84f" d="M20 22.500c2.500-3 6.500-3.300 9-1.200-2 3-6.200 3.700-9 1.200z"/>';
const BRUSH = '<path class="spk-f" style="--c:#c98f52" d="M9 3.200h16.500a1.800 1.800 0 010 3.600H9z"/><path class="spk-f" style="--c:#cfd6e0" d="M5.500 2.500H9.500v5H5.500z"/><path class="spk-f" d="M5.500 2.300C3 2.300.8 3.500 0 6c2 .9 4 1.500 5.500 1.500z"/>';
const MOON = FOIL + '<path class="spk-g" fill="url(#spk-g)" stroke="#c98a00" stroke-width=".6" d="M14 1.500A10 10 0 0014 21.500A14 14 0 0114 1.500z"/><path d="M5.400 10.800q1.200 1.300 2.500 0" fill="none" stroke="#8a5a00" stroke-width="1" stroke-linecap="round"/><path d="M6.300 14.800q1.200.8 2.300 0" fill="none" stroke="#8a5a00" stroke-width=".9" stroke-linecap="round"/><path class="spk-sh" d="M4.500 7c1-2 2.500-3.200 4.500-4" fill="none" stroke="#fff" stroke-width="1.300" stroke-linecap="round" opacity=".8"/>';
const MEDAL = FOIL + '<path class="spk-f" d="M3 0h6l3 13H7z"/><path class="spk-f" style="--c:color-mix(in srgb,var(--c0) 65%,#000)" d="M11 0h6l-4 13H8z"/><circle class="spk-g" cx="10" cy="20.500" r="8" fill="url(#spk-g)" stroke="#c98a00" stroke-width=".8"/><circle cx="10" cy="20.500" r="5.600" fill="none" stroke="#c98a00" stroke-width=".7" opacity=".7"/><path d="M10 16.300l1.300 2.700 2.900.3-2.200 2 .7 2.900-2.700-1.500-2.700 1.500.7-2.900-2.200-2 2.900-.3z" fill="#fff6c8" stroke="#c98a00" stroke-width=".5" stroke-linejoin="round"/><path class="spk-sh" d="M4.500 17.500c1-1.800 2.500-3 4.500-3.500" fill="none" stroke="#fff" stroke-width="1.200" stroke-linecap="round" opacity=".85"/>';
const DRAGON = '<path class="spk-f" style="--c:#f4dfa8" d="M9 6L7 0l5 4zM15 4.500L16.500 0l2.500 4.500z"/>'
  + '<path class="spk-f" d="M3 27V14C3 8 7.500 4 13 4h4c3 0 5 1.500 7 3.200l5 2.300c2.500 1.200 2.500 5 0 6.200L24 17.500c-2 1.200-4 2-6 2.500l-1 7z"/>'
  + '<circle class="spk-w" cx="15" cy="10.500" r="3.200"/><circle class="spk-d" cx="16" cy="10.800" r="1.500"/><circle class="spk-d" cx="27.500" cy="11.200" r=".9"/><path class="spk-l" style="--c:var(--ink);stroke-width:1.200" d="M21 15.500c2 .8 4 .6 6-.4"/>';
const TRUCK = '<path class="spk-f" d="M1 12.500h25v5.500H1z"/><path class="spk-f" d="M26 18V5.500h8.500L41 11v7z"/><path class="spk-w" d="M29 7.500h4.700l4 3.500H29z"/><path class="spk-l" d="M41 16.500h2"/>';
const WHEEL = '<circle cx="5" cy="5" r="4.200" class="spk-f" style="--c:#3a3d45"/><path class="spk-l" style="--c:#fff;stroke-width:1.300" d="M5 2.200v5.600M2.200 5h5.600"/>';
const BOX = '<path class="spk-f" d="M.8.8h9.400v8.400H.8z"/><path class="spk-l" style="stroke-width:1.100" d="M5.500.8v8.400"/>';
const TRUMPET = '<path class="spk-l" style="stroke-width:2.200" d="M1 10h4M10 10v5a2 2 0 002 2h9a2 2 0 002-2v-5"/><path class="spk-f" d="M5 8.600h20c4 0 8-2.600 10.500-7.600v18c-2.500-5-6.500-7.600-10.500-7.600H5z"/>'
  + [12, 16.500, 21].map((x) => `<path class="spk-f" d="M${x - 1.400} 3.500h2.800v5h-2.800z"/>`).join('');
const CLARINET = '<path class="spk-f" style="--c:#2b2d36" d="M5 3.200h29v4.600H5zM34 3l6-2v9l-6-2zM5 3.600L0 5.500l5 1.900z"/><path class="spk-w" d="M8 3.200h1.300v4.600H8zM30.500 3.200h1.300v4.600h-1.300z"/>'
  + [12, 15.500, 19, 23, 26.500].map((x) => `<circle class="spk-w" cx="${x}" cy="5.500" r="1"/>`).join('');
const NOTE = '<path class="spk-l" style="stroke-width:1.500" d="M6.300 10V1.500l3.200 1.800"/><ellipse class="spk-f" cx="3.800" cy="10.200" rx="2.900" ry="2.200" transform="rotate(-20 3.800 10.200)"/>';
const BALL = '<circle class="spk-f" cx="7" cy="7" r="6.300"/><path d="M2.600 2.600c2.800 2.400 2.800 6.400 0 8.800M11.400 2.600c-2.800 2.400-2.800 6.400 0 8.800" fill="none" stroke="#fff" stroke-width="1.200" stroke-linecap="round"/>';
const SCOOTER = '<path class="spk-l" style="--c:var(--ink);opacity:.45;stroke-width:1.500" d="M-16 9h9M-20 14.500h11M-14 20h7"/><path class="spk-f" d="M24.500 5.500l-9 1.200 6.500 3.300z"/>'
  + '<path class="spk-l" style="stroke-width:2.600" d="M6 19.500h18.500L28.500 20M27.800 19.500L24 3.500M20.500 3.500h7"/><path class="spk-l" style="stroke-width:1.500" d="M1.500 17.500c1-2.500 4.500-3 6.500-1"/>'
  + '<circle class="spk-f" style="--c:#3a3d45" cx="5" cy="21" r="3.200"/><circle class="spk-f" style="--c:#3a3d45" cx="29" cy="21" r="3.200"/>';
const KNIGHT = '<path class="spk-f" d="M14 4c0-4 6-5 8.500-1.500-3.500 0-4.500 2-5.500 4z"/><path class="spk-f" style="--c:#b9c2cf" d="M4 31v-8c0-3 3-5.500 6-5.500h8c3 0 6 2.500 6 5.500v8z"/>'
  + '<path class="spk-f" style="--c:#cfd6e0" d="M6 18v-5.500a8 8 0 0116 0V18z"/><path class="spk-d" d="M8.500 11.500h11v2.200h-11z"/><path class="spk-f" d="M1 20h9.500v5c0 3-2.700 5.200-4.700 6.200C3.700 30.200 1 28 1 25z"/><path d="M3.500 23.500l2.300 2.300 2.300-2.300" fill="none" stroke="#fff" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"/>';
const ARM = '<path class="spk-f" style="--c:#b9c2cf" d="M.7 2.500a2 2 0 014 0V11a2 2 0 01-4 0z"/>';
const LINES = '<path class="spk-l" style="--c:var(--ink);stroke-width:2" d="M7 1C3.500 4 3.500 10 7 13M2.500 3.500c-2 2.500-2 5 0 7"/>';

/* ---- the effects ---- */
const FX: Record<SparkKind, (e: E) => void> = {
  tick(e) {
    const x = e.W / 2, y = e.H / 2;
    if (e.calm) { A(e, circle(e, x, y, 26, 'border:2px solid var(--ok)'), blink(), 420); return; }
    if (e.look === 'glass') for (let i = 0; i < 6; i++) {
      const a = ((i * 60 + R(-14, 14) - 90) * Math.PI) / 180, d = R(6, 10), up = R(14, 24), dx = Math.cos(a) * 7;
      const b = circle(e, x + Math.cos(a) * 12, y + Math.sin(a) * 9, d, 'border:1.5px solid #fff;box-shadow:0 0 0 1px color-mix(in srgb,var(--pr) 45%,transparent);background:radial-gradient(circle at 32% 30%,#fff 0 18%,rgba(255,255,255,.35) 24%,color-mix(in srgb,var(--pr) 40%,transparent))');
      const wob = (i % 2 ? 1 : -1) * R(1.5, 3);
      A(e, b, K([['translate(0,0) scale(.2)', 0, 0, OUT], [`translate(${dx * 0.3 + wob}px,${-up * 0.3}px) scale(1)`, 1, 0.25, 'ease-in-out'], [`translate(${dx * 0.65 - wob}px,${-up * 0.68}px) scale(.96)`, 1, 0.55, 'ease-in-out'], [`translate(${dx + wob * 0.5}px,${-up}px) scale(1)`, 1, 0.8], [`translate(${dx}px,${-up - 1}px) scale(1.28)`, 1, 0.9], [`translate(${dx}px,${-up - 1}px) scale(1.9)`, 0]]), R(560, 680), i * 34 + R(0, 20));
    } else if (e.look === 'fridge') {
      [-78, -45, -12].forEach((a, i) => {
        const r = (a * Math.PI) / 180, s = el(e, `left:${x + Math.cos(r) * 13}px;top:${y + Math.sin(r) * 13 - 1.5}px;width:${i === 1 ? 12 : 9}px;height:3px;border-radius:2px;background:var(--ok);transform-origin:0 50%`);
        A(e, s, K([[`rotate(${a}deg) scaleX(0)`, 1], [`rotate(${a}deg) scaleX(1)`, 1, 0.3], [`rotate(${a}deg) scaleX(1)`, 1, 0.8], [`rotate(${a}deg) scaleX(1)`, 0]]), 600 - i * 60, i * 60, 'ease-out');
      });
      A(e, art(e, x - 22, y - 21, 20, 20, star(e), 'transform-origin:50% 50%'), K([['rotate(-50deg) scale(0)', 0], ['rotate(-12deg) scale(.78)', 1, 0.4, SPRING], ['rotate(-12deg) scale(.7)', 1, 0.8], ['rotate(-12deg) scale(.7)', 0]]), 520, 120);
    } else {
      A(e, circle(e, x, y, 44, 'border:1.5px solid var(--ok)'), K([['scale(.25)', 1], ['scale(.8)', 0.8, 0.6], ['scale(1)', 0]]), 600, 0, 'ease-out');
      for (let i = 0; i < 5; i++) {
        const a = i * 72 - 90 + R(-10, 10), s = el(e, `left:${x}px;top:${y - 0.75}px;width:8px;height:1.5px;border-radius:1px;background:var(--ac);transform-origin:0 50%`);
        A(e, s, K([[`rotate(${a}deg) translateX(9px) scaleX(.3)`, 0], [`rotate(${a}deg) translateX(17px) scaleX(1)`, 1, 0.3], [`rotate(${a}deg) translateX(25px) scaleX(1)`, 1, 0.7], [`rotate(${a}deg) translateX(29px) scaleX(.2)`, 0]]), 560, 40, 'ease-out');
      }
    }
  },

  points(e) {
    const look = e.look, css = look === 'glass' ? `font:800 15px/1 ${e.font};padding:5px 10px;border-radius:99px;background:rgba(255,255,255,.94);color:var(--ok);box-shadow:0 2px 6px rgba(0,0,0,.16)`
      : look === 'fridge' ? "font:700 28px/1 'Caveat','Fredoka',cursive;color:var(--ok);rotate:-6deg;text-shadow:0 0 2px var(--pp),0 0 3px var(--pp),0 1px 3px var(--pp)"
        : "font:600 14px/1 'Outfit',sans-serif;letter-spacing:.06em;padding:4px 10px;border-radius:99px;border:1px solid var(--ac);color:var(--ac);background:var(--gd)";
    const p = el(e, `left:${e.W / 2}px;top:-3px`), s = document.createElement('span');
    s.style.cssText = `position:absolute;left:0;bottom:0;translate:-50% 0;white-space:nowrap;${css}`; s.textContent = (e.o.text ?? '+10').slice(0, 24); p.appendChild(s);
    if (e.calm) A(e, p, blink(), 900);
    else A(e, p, K([['translateY(8px) scale(.7)', 0], ['translateY(0) scale(1.08)', 1, 0.2], ['translateY(-3px) scale(1)', 1, 0.32], ['translateY(-16px) scale(1)', 1, 0.75], ['translateY(-24px) scale(1)', 0]]), 900, 0, 'ease-out');
  },

  done(e) {
    confine(e);
    const { W, H, look } = e, soft = !!e.o.soft;
    if (look === 'fridge') {
      const n = soft ? 3 : 5, s = soft ? 24 : clamp(H * 0.36, 26, 36);
      for (let i = 0; i < n; i++) {
        const r = R(-20, 20), p = art(e, (W * (i + 1)) / (n + 1) - s / 2 + R(-5, 5), H / 2 - s / 2 + (i % 2 ? 1 : -1) * Math.min(7, H * 0.08), s, s, star(e)), t = (k: number, sc: string): string => `rotate(${r + k}deg) scale(${sc})`;
        (p.firstElementChild as SVGElement).setAttribute('viewBox', '-2 -2 24 25');
        if (e.calm) A(e, p, K([[t(0, '1'), 0], [t(0, '1'), 1, 0.25], [t(0, '1'), 1, 0.7], [t(0, '1'), 0]]), 800);
        /* held above the paper, pressed down hard (it squashes), then it springs back and settles */
        else A(e, p, K([[t(14, '2.3'), 0], [t(10, '2.1'), 1, 0.07, IN], [t(0, '.86,.9'), 1, 0.17, 'ease-out'], [t(-2, '1.06'), 1, 0.25, 'ease-in-out'], [t(0, '1'), 1, 0.33], [t(0, '1'), 1, 0.82], [t(0, '1'), 0]]), 1000 - i * 105, i * 105 + R(0, 20));
      }
    } else if (look === 'orbit') {
      const ly = H - 8, line = el(e, `left:${W * 0.06}px;top:${ly - 0.75}px;width:${W * 0.88}px;height:1.5px;background:var(--ok);transform-origin:0 50%`);
      if (e.calm) { A(e, line, blink(), 700); return; }
      A(e, line, K([['scaleX(0)', 1], ['scaleX(1)', 1, 0.5], ['scaleX(1)', 1, 0.72], ['scaleX(1)', 0]]), 900, 0, 'ease-in-out', {});
      const n = soft ? 7 : 17, cols = ['var(--ac)', 'var(--ok)', 'var(--pr)'];
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, d = R(3.5, 6);
        /* each spark is thrown off the line as its drawing end passes, and falls back */
        A(e, circle(e, W * (0.06 + 0.88 * t), ly, d, `background:${cols[i % 3]}`), toss(R(-22, 30), -R(60, 130), 420, 0.46), 460, 30 + 420 * (0.5 - Math.cos(Math.PI * t) / 2));
      }
    } else {
      if (e.calm) { wash(e, 'background:var(--ok)', 0.18); return; }
      const n = soft ? 8 : 24, sec = 0.66, fall = clamp(H * 0.55, 26, 72);
      for (let i = 0; i < n; i++) A(e, paper(e, R(4, W - 14), R(-8, H * 0.28), i), toss(R(-34, 34), R(0, 26), (2 * fall * R(0.55, 1)) / (sec * sec), sec, R(-260, 260), R(0.9, 1.7)), sec * 1000, R(0, 230));
    }
  },

  add(e) {
    const x = e.W / 2, y = e.H / 2, look = e.look;
    if (look === 'fridge') {
      const pin = circle(e, x, 3, 13, `background:radial-gradient(circle at 34% 30%,#fff 0 13%,transparent 17%),${e.kid};border:1.5px solid var(--ink);box-shadow:0 2px 2px rgba(0,0,0,.25)`);
      if (e.calm) { A(e, pin, blink(), 600); return; }
      A(e, pin, K([['translateY(-18px)', 0], ['translateY(-14px)', 1, 0.12, IN], ['translateY(0)', 1, 0.36, 'ease-out'], ['translateY(-5px)', 1, 0.52, 'ease-in'], ['translateY(0)', 1, 0.66], ['translateY(0)', 1, 0.85], ['translateY(0)', 0]]), 720);
      [-1, 1].forEach((s) => A(e, el(e, `left:${x + s * 11 - 3.5}px;top:1px;width:7px;height:2.5px;border-radius:2px;background:var(--ink)`), K([[`rotate(${s * 25}deg) scaleX(.2)`, 0], [`rotate(${s * 25}deg) translateX(${s * 3}px) scaleX(1)`, 1, 0.4], [`rotate(${s * 25}deg) translateX(${s * 6}px) scaleX(.4)`, 0]]), 300, 250));
      T(e, [0, 1.6, -1.1, 0.5, 0], 440, 260);
    } else {
      const d = clamp(Math.min(e.W, e.H) * 1.2, 38, 66), orbit = look === 'orbit', ring = orbit ? 'border:1.5px solid var(--ac)' : 'border:2px solid #fff;box-shadow:0 0 0 1.5px color-mix(in srgb,var(--pr) 55%,transparent),inset 0 0 0 1.5px color-mix(in srgb,var(--pr) 55%,transparent)';
      if (e.calm) { A(e, circle(e, x, y, d * 0.6, ring), blink(), 600); return; }
      [0, 150].forEach((dl, i) => A(e, circle(e, x, y, d, ring), K([['scale(.2)', 0], ['scale(.45)', 1 - i * 0.35, 0.2], ['scale(1)', 0.7 - i * 0.3, 0.7], ['scale(1.2)', 0]]), 640, dl, 'ease-out'));
      if (orbit) A(e, circle(e, x, y, 6, 'background:var(--ac)'), K([['scale(.4)', 0], ['scale(1.2)', 1, 0.2], ['scale(1)', 1, 0.6], ['scale(1)', 0]]), 620);
    }
  },

  marble(e) {
    const c = e.kid, x = e.W / 2 - 7, y = Math.min(e.H * 0.3, 16) - 7;
    const m = el(e, `left:${x}px;top:${y}px;width:14px;height:14px;--c:${c}`), roll = art(e, 0, 0, 14, 14, MARBLE, 'transform-origin:50% 50%', m, false);
    art(e, 0, 0, 14, 14, GLOSS, '', m, false);
    if (e.calm) { A(e, m, blink(), 520); return; }
    /* it hangs for a moment, falls faster and faster, squashes as it lands, hops once and sinks into the jar */
    A(e, m, K([['translateY(-23px) scale(.6)', 0, 0, OUT], ['translateY(-21px) scale(1)', 1, 0.14, IN], ['translateY(0) scale(1.14,.84)', 1, 0.48, 'ease-out'], ['translateY(-6px) scale(.97,1.03)', 1, 0.62, 'ease-in'], ['translateY(0) scale(1.06,.94)', 1, 0.75], ['translateY(0) scale(1)', 1, 0.82], ['translateY(5px) scale(.8)', 0]]), 680);
    A(e, roll, [{ transform: 'rotate(-40deg)' }, { transform: `rotate(${e.dir * 250}deg)` }], 680, 0, 'ease-out', { fill: 'both' });
    T(e, [0, -2.6, 1.9, -1, 0.4, 0], 380, 320);
  },

  ring(e) {
    const { W, H, look } = e, x = W / 2, y = H / 2, box = `width:${W}px;height:${H}px;border-radius:${e.rad};box-sizing:border-box;`;
    if (e.calm) { A(e, el(e, box + `border:2px solid ${look === 'glass' ? 'rgba(255,255,255,.95)' : 'var(--ac)'}`), blink(), 700); return; }
    if (look === 'glass') [0, 170, 340].forEach((dl) => A(e, el(e, box + 'border:2px solid rgba(255,255,255,.95)'), K([['scale(1)', 0], [`scale(${1 + 6 / Math.max(W, 30)},${1 + 6 / Math.max(H, 20)})`, 0.95, 0.2], [`scale(${1 + 28 / Math.max(W, 30)},${1 + 28 / Math.max(H, 20)})`, 0]]), 560, dl, 'ease-out'));
    else if (look === 'fridge') {
      T(e, [0, -8, 8, -8, 8, -7, 6, 0], 860);
      [-1, 1].forEach((s) => A(e, art(e, s < 0 ? -13 : W + 4, y - 7, 9, 14, LINES, s > 0 ? 'scale:-1 1' : ''), K([['translateX(0)', 0], [`translateX(${s * 3}px)`, 1, 0.2], [`translateX(${s * 3}px)`, 1, 0.75], [`translateX(${s * 6}px)`, 0]]), 860));
    } else {
      const d = Math.max(H, 34) + 10;
      A(e, circle(e, x, y, d, 'border:1.5px solid var(--ac)'), K([['scale(1)', 0], ['scale(1)', 1, 0.14, IN], ['scale(.1)', 1, 0.48], ['scale(.1)', 0, 0.56], ['scale(.1)', 0]]), 900);
      A(e, circle(e, x, y, 6, 'background:var(--ac)'), [{ opacity: 0 }, { opacity: 0, offset: 0.42 }, { opacity: 1, offset: 0.48 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], 900);
      A(e, circle(e, x, y, d * 1.5, 'border:1.5px solid var(--ac)'), K([['scale(.06)', 1], ['scale(.7)', 0.8, 0.6], ['scale(1)', 0]]), 460, 440, 'ease-out');
    }
  },

  sweep(e) {
    const { W, H, look } = e;
    if (e.calm) { wash(e, look === 'glass' ? 'background:#fff' : look === 'fridge' ? 'background:var(--ac)' : 'border:1.5px solid var(--ac)', look === 'glass' ? 0.35 : look === 'fridge' ? 0.2 : 1); return; }
    if (look === 'glass') {
      confine(e);
      const bw = Math.max(40, W * 0.4);
      A(e, el(e, `top:-20%;width:${bw}px;height:140%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5) 40%,rgba(255,255,255,.8) 50%,rgba(255,255,255,.5) 60%,transparent)`), K([[`translateX(${-bw}px)`, 0], [`translateX(${-bw * 0.6}px)`, 1, 0.12], [`translateX(${W - bw * 0.4}px)`, 1, 0.88], [`translateX(${W}px)`, 0]]), 900, 0, 'ease-in-out');
    } else if (look === 'fridge') {
      T(e, [0, -5, 5, -4, 4, 0], 600);
      [-1, 1].forEach((s) => A(e, art(e, s < 0 ? -12 : W + 3, -4, 9, 14, LINES, s > 0 ? 'scale:-1 1' : ''), K([['translateY(2px)', 0], ['translateY(0)', 1, 0.25], ['translateY(0)', 1, 0.7], ['translateY(-2px)', 0]]), 600));
    } else {
      const g = 4, w = W + g * 2, h = H + g * 2, P = 2 * (w + h), a = w / P, b = (w + h) / P, c = (2 * w + h) / P, D = 0.74;
      const edge = (css: string, ax: string, from: number, to: number): void => A(e, el(e, css + ';background:var(--ac)'), K([[`scale${ax}(0)`, 1], [`scale${ax}(0)`, 1, from * D], [`scale${ax}(1)`, 1, to * D], [`scale${ax}(1)`, 1, 0.84], [`scale${ax}(1)`, 0]]), 900);
      edge(`left:${-g}px;top:${-g}px;width:${w}px;height:1.5px;transform-origin:0 50%`, 'X', 0, a);
      edge(`left:${W + g - 1.5}px;top:${-g}px;width:1.5px;height:${h}px;transform-origin:50% 0`, 'Y', a, b);
      edge(`left:${-g}px;top:${H + g - 1.5}px;width:${w}px;height:1.5px;transform-origin:100% 50%`, 'X', b, c);
      edge(`left:${-g}px;top:${-g}px;width:1.5px;height:${h}px;transform-origin:50% 100%`, 'Y', c, 1);
      A(e, circle(e, -g, -g, 5, 'background:#fff'), K([['translate(0,0)', 1], [`translate(${w}px,0)`, 1, a * D], [`translate(${w}px,${h}px)`, 1, b * D], [`translate(0,${h}px)`, 1, c * D], ['translate(0,0)', 1, D], ['translate(0,0)', 0, D + 0.08], ['translate(0,0)', 0]]), 900);
    }
  },

  party(e) {
    const x = e.W / 2, c = e.kid;
    if (e.o.burst) {
      for (let i = 0; i < 12; i++) {
        const a = ((i * 30 + R(-13, 13)) * Math.PI) / 180, v = R(70, 150), p = paper(e, x - 5, -36, i);
        if (e.calm) { p.style.translate = `${Math.cos(a) * v * 0.25}px ${Math.sin(a) * v * 0.2}px`; A(e, p, blink(), 700); } else A(e, p, toss(Math.cos(a) * v, Math.sin(a) * v * 0.8 - 70, 560, 0.9, R(-300, 300), R(0.8, 1.6)), 850, R(0, 50));
      }
      return;
    }
    const hold = clamp(e.o.ms ?? 4200, 600, 20000), total = 700 + hold + 500, p = el(e, `left:${x - 13}px;top:-46px;width:26px;height:48px`), n = Math.max(2, Math.round(total / 1370));
    const b = el(e, `width:26px;height:48px;transform-origin:50% 100%;--c:${c}`, svg(26, 34, BALLOON), p, false), st = art(e, 10.5, 33.5, 5, 13, STRING, 'transform-origin:50% 0', b, false);
    if (e.calm) { A(e, p, [{ opacity: 0 }, { opacity: 1, offset: 300 / total }, { opacity: 1, offset: 1 - 400 / total }, { opacity: 0 }], total); return; }
    /* squeezed out of the name, it stretches as it rises, overshoots and settles; the string swings a beat behind the balloon */
    A(e, p, K([['translateY(26px) scale(.3,.2)', 0, 0, OUT], ['translateY(-5px) scale(.92,1.1)', 1, 420 / total, 'ease-in-out'], ['translateY(2px) scale(1.04,.97)', 1, 580 / total, 'ease-in-out'], ['translateY(0) scale(1)', 1, 700 / total], ['translateY(0) scale(1)', 1, (700 + hold) / total, 'ease-in'], ['translateY(-22px) scale(1)', 0]]), total);
    A(e, b, [{ transform: 'rotate(-5deg)' }, { transform: 'rotate(5deg) translateY(-2px)' }], 1370, 0, 'ease-in-out', { iterations: n, direction: 'alternate', fill: 'none' });
    A(e, st, [{ transform: 'rotate(14deg)' }, { transform: 'rotate(-14deg)' }], (total - 270) / n, 260, 'ease-in-out', { iterations: n, direction: 'alternate', fill: 'both' });
  },

  /* ---- of our own invention ---- */
  stomp(e) {
    confine(e);
    const { W, H } = e, n = e.o.soft ? 3 : 5, x0 = W * 0.1, x1 = W * 0.9, y0 = H * 0.7, y1 = H * 0.36, head = (Math.atan2(y1 - y0, (x1 - x0) * e.dir) * 180) / Math.PI + 90;
    const col = e.look === 'glass' ? `color-mix(in srgb,${e.kid} 70%,transparent)` : e.look === 'fridge' ? '#9a6a3a' : 'var(--ok)';
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5, side = i % 2 ? 1 : -1, r = head + side * 9, px = (e.dir > 0 ? x0 + (x1 - x0) * t : x1 - (x1 - x0) * t) - 10, py = y0 + (y1 - y0) * t - 11 + side * 7;
      const p = art(e, px - 2, py - 3, 24, 26, FOOT, `--c:${col};transform-origin:50% 70%`);
      if (e.look === 'glass') p.querySelectorAll('.spk-f').forEach((q) => q.setAttribute('style', 'stroke:none'));
      if (e.calm) A(e, p, K([[`rotate(${r}deg)`, 0], [`rotate(${r}deg)`, 0.9, 0.25], [`rotate(${r}deg)`, 0.9, 0.7], [`rotate(${r}deg)`, 0]]), 800);
      else A(e, p, K([[`rotate(${r}deg) scale(1.7)`, 0], [`rotate(${r}deg) scale(.92)`, 0.95, 0.2, IN], [`rotate(${r}deg) scale(1)`, 0.9, 0.3], [`rotate(${r}deg) scale(1)`, 0.85, 0.7], [`rotate(${r}deg) scale(1)`, 0]]), 700, i * 115);
    }
  },

  puff(e) {
    const d = e.dir, box = clip(e, d > 0 ? -4 : e.W - 30, -27, 34, 27), look = e.look;
    const head = art(e, 1, 0, 32, 27, DRAGON, `--c:var(--ok);${d < 0 ? 'scale:-1 1;' : ''}`, box);
    if (e.calm) { A(e, head, blink(), 900); return; }
    A(e, head, K([['translateY(27px)', 1], ['translateY(0)', 1, 0.22, 'ease-out'], ['translateY(3px)', 1, 0.3], ['translateY(0)', 1, 0.36], ['translateY(0)', 1, 0.84, IN], ['translateY(27px)', 1]]), 1150, 0, SPRING);
    const sx = d > 0 ? 30 : e.W - 30, css = look === 'glass' ? 'background:rgba(255,255,255,.9);box-shadow:0 0 0 1px rgba(0,0,0,.08)' : look === 'fridge' ? 'background:var(--pp);border:1.5px solid var(--ink)' : 'border:1.3px solid var(--ok);background:var(--gd)';
    [[9, 16, -3], [12, 30, -9], [15, 46, -5]].forEach(([s, dx, dy], i) => A(e, circle(e, sx, -15, s, css), K([['translate(0,0) scale(.2)', 0], [`translate(${d * dx * 0.5}px,${dy * 0.5}px) scale(.9)`, 0.95, 0.35], [`translate(${d * dx}px,${dy}px) scale(1.25)`, 0]]), 520, 400 + i * 110, OUT));
    [[14, -12], [22, 2]].forEach(([dx, dy], i) => A(e, circle(e, sx, -15, 4, 'background:var(--ac)'), K([['translate(0,0) scale(.4)', 0], [`translate(${d * dx * 0.5}px,${dy * 0.5}px) scale(1)`, 1, 0.4], [`translate(${d * dx}px,${dy}px) scale(.3)`, 0]]), 380, 420 + i * 150, OUT));
  },

  truck(e) {
    confine(e);
    const { W, H } = e, d = e.dir, stop = W / 2 - 14, off = W + 12, gy = H - 25, ms = 1180;
    const flipX = (x: number): number => (d > 0 ? x : W - 44 - x), tx = (x: number): string => `translateX(${d * x}px)`;
    const g = el(e, `left:${flipX(0)}px;top:${gy}px;width:44px;height:24px`);
    const inner = el(e, `width:44px;height:24px;${d < 0 ? 'scale:-1 1' : ''}`, '', g, false);
    const body = art(e, 0, 0, 44, 24, TRUCK, '--c:var(--pr)', inner, false);
    const wheels = [5, 28].map((x) => art(e, x, 14, 10, 10, WHEEL, 'transform-origin:50% 50%', inner, false));
    const box = art(e, 7, 3.5, 11, 10, BOX, '--c:var(--ac);transform-origin:50% 50%', inner);
    if (e.calm) { g.style.translate = `${flipX(stop) - flipX(0)}px 0`; A(e, g, blink(), 800); box.style.opacity = '1'; box.removeAttribute('data-p'); return; }
    const a = 0.36, b = 0.56;
    A(e, g, [{ transform: tx(-50), opacity: 1, easing: OUT }, { transform: tx(stop), opacity: 1, offset: a }, { transform: tx(stop), opacity: 1, offset: b, easing: IN }, { transform: tx(off), opacity: 1 }], ms);
    /* the box rides, hops off the back, and stays where it landed while the truck drives on (the same easing over the same span cancels the truck's travel) */
    A(e, box, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: 'translate(0,0) rotate(0deg)', offset: a, easing: 'ease-out' }, { transform: 'translate(-9px,-8px) rotate(-50deg)', offset: (a + b) / 2, easing: 'ease-in' },
      { transform: 'translate(-17px,9px) rotate(-90deg)', offset: b, easing: IN }, { opacity: 1, offset: 0.86 }, { transform: `translate(${-17 - (off - stop)}px,9px) rotate(-90deg)`, opacity: 0 }], ms);
    wheels.forEach((w) => A(e, w, [{ transform: 'rotate(0deg)', opacity: 1, easing: OUT }, { transform: 'rotate(500deg)', offset: a }, { transform: 'rotate(500deg)', offset: b, easing: IN }, { transform: 'rotate(1100deg)', opacity: 1 }], ms));
    A(e, body, [{ transform: 'translateY(0)' }, { transform: 'translateY(-1.2px)' }], 130, 0, 'ease-in-out', { iterations: 8, direction: 'alternate', fill: 'none' });
    [0, 90].forEach((dl, i) => A(e, circle(e, flipX(stop) + (d > 0 ? 0 : 44), H - 5, 7 + i * 3, e.look === 'orbit' ? 'border:1.2px solid var(--pr)' : 'background:color-mix(in srgb,var(--ink) 30%,transparent)'), K([['translate(0,0) scale(.3)', 0], [`translate(${-d * 5}px,-3px) scale(1)`, 0.8, 0.35], [`translate(${-d * 12}px,-7px) scale(1.4)`, 0]]), 380, ms * b + dl, OUT));
  },

  tada(e) {
    const clar = e.o.variant === 'clarinet', d = e.dir, w = clar ? 40 : 37, h = clar ? 11 : 20, x = d > 0 ? e.W * 0.6 - w / 2 : e.W * 0.4 - w / 2, y = -h / 2 - 2, tilt = clar ? -22 : -14;
    const p = el(e, `left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform-origin:${d > 0 ? 0 : 100}% 50%`);
    art(e, 0, 0, w, h, clar ? (e.look === 'orbit' ? CLARINET.replace('#2b2d36', 'var(--pr)') : CLARINET) : TRUMPET, `--c:${GOLD};${d < 0 ? 'scale:-1 1' : ''}`, p, false);
    const r = (s: number, k = 1): string => `rotate(${d * tilt * k}deg) scale(${s})`;
    if (e.calm) { A(e, p, K([[r(1), 0], [r(1), 1, 0.25], [r(1), 1, 0.7], [r(1), 0]]), 900); return; }
    A(e, p, K([[r(0.3, 2.2), 0], [r(1.1), 1, 0.16], [r(1), 1, 0.24], [r(1.14, 1.3), 1, 0.36], [r(1), 1, 0.48], [r(1.14, 1.3), 1, 0.6], [r(1), 1, 0.72], [r(1), 1, 0.86], [r(0.85, 0.4), 0]]), 1050);
    const bx = d > 0 ? x + w + 1 : x - 12, by = y + h / 2 + Math.sin((tilt * Math.PI) / 180) * w - 8, cols = [e.kid, 'var(--ac)', 'var(--ok)'];
    [[10, -15, -14], [21, -6, 12], [15, -27, 4]].forEach(([dx, dy, rot], i) => A(e, art(e, bx, by, 10, 13, NOTE, `--c:${e.look === 'fridge' ? 'var(--ink)' : cols[i]}`), K([['translate(0,0) scale(.3)', 0], [`translate(${d * dx * 0.55}px,${dy * 0.6}px) rotate(${rot}deg) scale(1)`, 1, 0.35], [`translate(${d * dx * 0.85}px,${dy * 0.9}px) rotate(${rot}deg) scale(1)`, 1, 0.7], [`translate(${d * dx}px,${dy - 4}px) rotate(${rot * 1.4}deg) scale(.9)`, 0]]), 560, 250 + i * 130, OUT));
  },

  bounce(e) {
    const d = e.dir, run = clamp(e.W * 0.5, 50, 96), x = d > 0 ? Math.max(4, e.W * 0.12) : Math.min(e.W - 18, e.W * 0.88 - 14);
    const p = el(e, `left:${x}px;top:-12px;width:14px;height:14px`);
    const sh = el(e, 'left:1px;top:12.5px;width:12px;height:3px;border-radius:50%;background:rgba(0,0,0,.22)', '', p, false);
    const ball = art(e, 0, 0, 14, 14, BALL, `--c:${e.look === 'orbit' ? 'var(--gd)' : '#d7e63c'};transform-origin:50% 50%`, p, false);
    if (e.look === 'orbit') { ball.querySelector('circle')!.setAttribute('style', '--c:var(--ok)'); ball.querySelectorAll('path').forEach((q) => q.setAttribute('stroke', 'var(--ok)')); sh.style.background = 'var(--ok)'; sh.style.height = '1.5px'; }
    if (e.calm) { A(e, p, blink(), 800); return; }
    A(e, p, K([['translateX(0)', 0], [`translateX(${d * run * 0.08}px)`, 1, 0.08], [`translateX(${d * run * 0.86}px)`, 1, 0.86], [`translateX(${d * run}px)`, 0]]), 1080);
    const hop = (y: number, rot: number, offset: number, easing?: string): Keyframe => ({ transform: `translateY(${-y}px) rotate(${d * rot}deg)`, offset, ...(easing ? { easing } : {}) });
    A(e, ball, [hop(26, 0, 0, 'ease-in'), hop(0, 150, 0.2, 'ease-out'), hop(17, 290, 0.37, 'ease-in'), hop(0, 420, 0.54, 'ease-out'), hop(8, 520, 0.66, 'ease-in'), hop(0, 610, 0.78), hop(0, 760, 1)], 1080);
    const s = (k: number, offset: number, easing?: string): Keyframe => ({ transform: `scaleX(${k})`, opacity: k, offset, ...(easing ? { easing } : {}) });
    A(e, sh, [s(0.3, 0, 'ease-in'), s(1, 0.2, 'ease-out'), s(0.5, 0.37, 'ease-in'), s(1, 0.54, 'ease-out'), s(0.75, 0.66, 'ease-in'), s(1, 0.78), s(1, 1)], 1080);
  },

  zip(e) {
    const d = e.dir, W = e.W, x = d > 0 ? 0 : W - 34, p = el(e, `left:${x}px;top:-25px;width:34px;height:25px;transform-origin:${d > 0 ? 15 : 85}% 100%`);
    art(e, 0, 0, 34, 25, SCOOTER, `--c:${e.kid};${d < 0 ? 'scale:-1 1' : ''}`, p, false);
    if (e.calm) { A(e, p, blink(), 800); return; }
    const far = Math.max(40, W - 34), m = (k: number, rot: number): string => `translateX(${d * far * k}px) rotate(${d * rot}deg)`;
    A(e, p, K([[m(-0.08, -16), 0], [m(0.04, -16), 1, 0.14], [m(0.3, 0), 1, 0.4], [m(0.86, 0), 1, 0.86], [m(1.02, 0), 0]]), 760, 0, 'cubic-bezier(.45,0,.4,1)');
    A(e, circle(e, d > 0 ? 6 : W - 6, -4, 9, e.look === 'orbit' ? 'border:1.2px solid var(--pr)' : 'background:color-mix(in srgb,var(--ink) 28%,transparent)'), K([['translate(0,0) scale(.3)', 0], [`translate(${-d * 5}px,-2px) scale(1)`, 0.8, 0.4], [`translate(${-d * 11}px,-6px) scale(1.5)`, 0]]), 420, 120, OUT);
  },

  splash(e) {
    const x = e.W / 2, look = e.look, drop = look === 'glass' ? 'background:radial-gradient(circle at 35% 30%,#fff 0 25%,color-mix(in srgb,var(--pr) 40%,#fff));border:1px solid color-mix(in srgb,var(--pr) 55%,#fff)' : look === 'fridge' ? 'background:#4a9fe0;border:1.4px solid var(--ink)' : 'border:1.3px solid var(--pr);background:var(--gd)';
    const rip = el(e, `left:${x - 22}px;top:-5px;width:44px;height:10px;border-radius:50%;box-sizing:border-box;border:${look === 'orbit' ? 1.3 : 2}px solid ${look === 'glass' ? 'rgba(255,255,255,.95)' : look === 'fridge' ? '#4a9fe0' : 'var(--pr)'}`);
    if (e.calm) { A(e, rip, blink(), 600); return; }
    A(e, rip, K([['scale(.15)', 1], ['scale(.9)', 0.8, 0.6], ['scale(1.3)', 0]]), 640, 60, 'ease-out');
    for (let i = 0; i < 7; i++) {
      const a = ((-158 + i * 22.7 + R(-6, 6)) * Math.PI) / 180, r = R(17, 30), dx = Math.cos(a) * r, dy = Math.sin(a) * r - 4, s = R(4.5, 7.5);
      A(e, el(e, `left:${x - s / 2}px;top:${-s / 2}px;width:${s}px;height:${s * 1.25}px;box-sizing:border-box;border-radius:50% 50% 50% 50%/40% 40% 60% 60%;${drop}`), toss(dx * 2.6, -R(170, 215), 640, 0.62), 620, R(0, 90));
    }
  },

  salute(e) {
    const d = e.dir, box = clip(e, clamp(e.W * (d > 0 ? 0.68 : 0.32) - 20, 0, Math.max(0, e.W - 40)), -32, 40, 32);
    const k = el(e, `left:6px;width:28px;height:32px;${d < 0 ? 'scale:-1 1' : ''}`, svg(28, 32, KNIGHT), box);
    k.style.setProperty('--c', e.kid);
    const arm = art(e, 19.5, 17.5, 5.4, 13.5, ARM, 'transform-origin:50% 2.5px', k, false);
    if (e.calm) { arm.style.rotate = '-200deg'; A(e, k, blink(), 1000); return; }
    A(e, k, K([['translateY(32px)', 1], ['translateY(0)', 1, 0.24, 'ease-out'], ['translateY(2px)', 1, 0.3], ['translateY(0)', 1, 0.36], ['translateY(0)', 1, 0.84, IN], ['translateY(32px)', 1]]), 1180, 0, SPRING);
    A(e, arm, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(0deg)', offset: 0.32, easing: SPRING }, { transform: 'rotate(-200deg)', offset: 0.46 }, { transform: 'rotate(-200deg)', offset: 0.72, easing: 'ease-in' }, { transform: 'rotate(0deg)', offset: 0.82 }, { transform: 'rotate(0deg)' }], 1180, 0, 'linear', { fill: 'none' });
  },

  rocket(e) {
    const x = e.W / 2, p = el(e, `left:${x - 9}px;top:-25px;width:18px;height:25px;transform-origin:50% 100%`), fl = art(e, 4, 21.5, 10, 10, FLAME, 'transform-origin:50% 0', p, false);
    art(e, 0, 0, 18, 25, ROCKET, '', p, false);
    if (e.calm) { fl.style.opacity = '0'; A(e, p, blink(), 800); return; }
    /* it squats and trembles on the pad, then goes, slowly at first */
    A(e, p, K([['translate(0,6px) scale(.7)', 0], ['translate(0,0) scale(1)', 1, 0.12], ['translate(-.8px,1.5px) scale(1.06,.9)', 1, 0.22], ['translate(.8px,1.5px) scale(1.06,.9)', 1, 0.3], ['translate(-.6px,1px) scale(1.04,.93)', 1, 0.38, 'cubic-bezier(.6,0,.9,.5)'], ['translate(0,-34px) scale(.97,1.05)', 1, 0.86], ['translate(0,-50px) scale(.95,1.06)', 0]]), 1050);
    A(e, fl, K([['scaleY(0)', 0], ['scaleY(0)', 0, 0.16], ['scaleY(.5)', 1, 0.24], ['scaleY(.8)', 1, 0.38], ['scaleY(1.5)', 1, 0.6], ['scaleY(1.2)', 1]]), 1050);
    const css = e.look === 'glass' ? 'background:rgba(255,255,255,.92);box-shadow:0 0 0 1px rgba(0,0,0,.07)' : e.look === 'fridge' ? 'background:var(--pp);border:1.4px solid var(--ink)' : 'border:1.2px solid var(--pr);background:var(--gd)';
    [[-1, 9], [1, 11], [-1, 7], [1, 8]].forEach(([sd, d], i) => A(e, circle(e, x + sd * 3, -3, d, css), K([['translate(0,0) scale(.2)', 0, 0, OUT], [`translate(${sd * (8 + i * 2)}px,${-1 - i}px) scale(1)`, 0.95, 0.4], [`translate(${sd * (15 + i * 3)}px,${-5 - i * 2}px) scale(1.3)`, 0]]), 520, 230 + i * 85));
  },

  book(e) {
    const d = e.dir, x = d > 0 ? e.W * 0.62 - 16 : e.W * 0.38 - 16, p = el(e, `left:${x}px;top:-15px;width:32px;height:22px;transform-origin:50% 100%;--c:${e.kid}`);
    const pg = [1, -1].map((sd) => art(e, sd > 0 ? 16 : 0.5, 0, 15.5, 22, PAGE, `transform-origin:${sd > 0 ? 0 : 100}% 50%`, p, false));
    (pg[1].firstElementChild as SVGElement).style.scale = '-1 1';
    if (e.calm) { A(e, p, blink(), 900); return; }
    /* it lands shut, the covers swing open (the far one a beat later), and three stars float up out of the pages */
    A(e, p, K([['translateY(8px) scale(.6)', 0, 0, SPRING], ['translateY(0) scale(1)', 1, 0.16], ['translateY(1px) scale(1.05,.95)', 1, 0.3], ['translateY(0) scale(1)', 1, 0.4], ['translateY(0) scale(1)', 1, 0.86], ['translateY(3px) scale(.9)', 0]]), 1100);
    pg.forEach((g, i) => A(e, g, [{ transform: 'scaleX(.06)' }, { transform: 'scaleX(.06)', offset: 0.2 + i * 0.04, easing: SPRING }, { transform: 'scaleX(1)', offset: 0.42 + i * 0.05 }, { transform: 'scaleX(1)' }], 1100, 0, 'linear', { fill: 'both' }));
    [[-13, -24, 9], [2, -31, 12], [15, -22, 8]].forEach(([dx, dy, sz], i) => A(e, art(e, x + 16 - sz / 2, -8 - sz / 2, 11, 11, FOIL + TWINK, `scale:${sz / 11};transform-origin:50% 50%`), K([['translate(0,0) rotate(-40deg) scale(.2)', 0, 0, 'ease-out'], [`translate(${dx * 0.7}px,${dy * 0.75}px) rotate(10deg) scale(1.15)`, 1, 0.4, 'ease-in-out'], [`translate(${dx * 0.95}px,${dy}px) rotate(25deg) scale(.9)`, 1, 0.75], [`translate(${dx}px,${dy - 3}px) rotate(40deg) scale(.3)`, 0]]), 600, 400 + i * 95));
  },

  quokka(e) {
    const d = e.dir, box = clip(e, clamp(e.W * (d > 0 ? 0.7 : 0.3) - 19, 0, Math.max(0, e.W - 38)), -27, 38, 27);
    const q = art(e, 4, 1, 30, 26, QUOKKA, `--c:#9c7c5e;transform-origin:50% 100%`, box);
    if (e.calm) { A(e, q, blink(), 1000); return; }
    /* up it pops (a bit too far), it looks one way, then the other, and ducks */
    A(e, q, K([['translateY(27px)', 1, 0, 'ease-out'], ['translateY(-2px) scale(.96,1.06)', 1, 0.2, 'ease-in-out'], ['translateY(1px) scale(1.03,.97)', 1, 0.28], ['translateY(0) rotate(0deg)', 1, 0.34, 'ease-in-out'], [`translateY(0) rotate(${-9 * d}deg)`, 1, 0.48, 'ease-in-out'], [`translateY(0) rotate(${9 * d}deg)`, 1, 0.68, 'ease-in-out'], ['translateY(-1px) rotate(0deg)', 1, 0.8, IN], ['translateY(27px)', 1]]), 1180);
  },

  paint(e) {
    const { W, H } = e, d = e.dir, L = Math.max(30, W - 8), cols = [e.pal[1 % e.pal.length], GOLD, e.pal[0]], ease = 'cubic-bezier(.45,0,.3,1)';
    const bands = cols.map((c, i) => el(e, `left:4px;top:${H - 3 + i * 3}px;width:${L}px;height:${e.look === 'orbit' ? 1.5 : 3.4}px;border-radius:2px;background:${c};transform-origin:${d > 0 ? 0 : 100}% 50%`));
    if (e.calm) { bands.forEach((b) => A(e, b, blink(), 800)); return; }
    /* the lower stripes start a touch later and end a touch short, as bristles do */
    bands.forEach((b, i) => A(e, b, K([['scaleX(0)', 1, 0, ease], [`scaleX(${1 - i * 0.03})`, 1, 0.62], [`scaleX(${1 - i * 0.03})`, 1, 0.82], [`scaleX(${1 - i * 0.03})`, 0]]), 1000 - i * 25, i * 25));
    const br = art(e, d > 0 ? 2 : W - 30, H - 4, 28, 10, BRUSH, `--c:${cols[0]};transform-origin:${d > 0 ? 0 : 100}% 50%;${d < 0 ? 'scale:-1 1' : ''}`), r = -24 * d;
    A(e, br, K([[`translate(0,-6px) rotate(${r - 16}deg)`, 0], [`translate(0,0) rotate(${r}deg)`, 1, 0.08, ease], [`translate(${d * L}px,0) rotate(${r + 8 * d}deg)`, 1, 0.62, 'ease-out'], [`translate(${d * (L + 5)}px,-8px) rotate(${r - 20 * d}deg)`, 1, 0.76], [`translate(${d * (L + 5)}px,-10px) rotate(${r - 20 * d}deg)`, 0]]), 1000);
  },

  moon(e) {
    const d = e.dir, x = d > 0 ? e.W * 0.7 - 11 : e.W * 0.3 - 11, m = art(e, x, -27, 23, 23, MOON, `transform-origin:50% 50%;${d < 0 ? 'scale:-1 1' : ''}`);
    if (e.calm) { A(e, m, blink(), 1000); return; }
    A(e, m, K([['translateY(16px) rotate(-50deg) scale(.6)', 0, 0, OUT], ['translateY(-2px) rotate(6deg) scale(1)', 1, 0.3, 'ease-in-out'], ['translateY(0) rotate(-4deg) scale(1)', 1, 0.48, 'ease-in-out'], ['translateY(0) rotate(0deg) scale(1)', 1, 0.6], ['translateY(0) rotate(0deg) scale(1)', 1, 0.86], ['translateY(-3px) rotate(8deg) scale(.9)', 0]]), 1150);
    [[-15, -22, 9], [25, -30, 11], [31, -11, 7]].forEach(([dx, dy, sz], i) => A(e, art(e, x + (d > 0 ? dx : 12 - dx), dy, 11, 11, FOIL + TWINK, `scale:${sz / 11};transform-origin:50% 50%`), K([['rotate(-60deg) scale(0)', 0, 0, SPRING], ['rotate(0deg) scale(1.2)', 1, 0.3], ['rotate(10deg) scale(.8)', 1, 0.5, 'ease-in-out'], ['rotate(0deg) scale(1)', 1, 0.7], ['rotate(20deg) scale(0)', 0]]), 600, 330 + i * 130));
  },

  medal(e) {
    const d = e.dir, x = d > 0 ? e.W * 0.72 - 10 : e.W * 0.28 - 10, m = art(e, x, -31, 20, 30, MEDAL, 'transform-origin:50% 0');
    if (e.calm) { A(e, m, blink(), 1000); return; }
    /* it drops in on its ribbon and swings like a pendulum, each swing smaller than the last */
    A(e, m, K([[`rotate(${-48 * d}deg) scale(.5)`, 0, 0, 'ease-in'], [`rotate(${-34 * d}deg) scale(1)`, 1, 0.1, 'ease-in-out'], [`rotate(${24 * d}deg)`, 1, 0.3, 'ease-in-out'], [`rotate(${-14 * d}deg)`, 1, 0.47, 'ease-in-out'], [`rotate(${7 * d}deg)`, 1, 0.62, 'ease-in-out'], [`rotate(${-3 * d}deg)`, 1, 0.74, 'ease-in-out'], ['rotate(0deg)', 1, 0.84], ['rotate(0deg) scale(.9)', 0]]), 1180);
    A(e, art(e, x + 12, -18, 11, 11, FOIL + TWINK.replace('url(#spk-g)', '#fff'), 'transform-origin:50% 50%'), K([['rotate(-30deg) scale(0)', 0], ['rotate(0deg) scale(1)', 1, 0.4], ['rotate(30deg) scale(0)', 0]]), 300, 800);
  }
};

/* ---- the stage ---- */
const deepest = (x: number, y: number): Element | null => { let n = document.elementFromPoint(x, y); while (n?.shadowRoot) { const m = n.shadowRoot.elementFromPoint(x, y); if (!m || m === n) break; n = m; } return n; };
const lookOf = (n: Element): SparkLook => {
  let c: Element | null = n;
  while (c) { const h: Element | null = c.closest('[data-look]'); if (h) { const l = h.getAttribute('data-look'); return l === 'fridge' || l === 'orbit' ? l : 'glass'; } const r = c.getRootNode(); c = r instanceof ShadowRoot ? r.host : null; }
  return 'glass';
};
const layerFor = (root: Node): HTMLElement => {
  let l = byRoot.get(root);
  if (l && l.parentNode === root && l.isConnected) return l;
  l = document.createElement('div'); l.className = 'spk-layer'; l.setAttribute('aria-hidden', 'true');
  const st = document.createElement('style'); st.textContent = CSS; l.appendChild(st);
  root.appendChild(l); byRoot.set(root, l); layers.add(l); return l;
};

export function spark(kind: SparkKind, at: SparkAt, opts: SparkOpts = {}): Animation | null {
  try {
    const fx = FX[kind];
    if (!fx || !at || typeof document === 'undefined' || !('animate' in Element.prototype)) return null;
    const point = at instanceof Element ? null : at, target = point ? deepest(point.x, point.y) ?? document.body : (at as Element);
    if (!target.isConnected) return null;
    const cs = getComputedStyle(target), v = (n: string, d = ''): string => cs.getPropertyValue(n).trim() || d;
    const rn = target.getRootNode(), root: Node = rn instanceof ShadowRoot ? rn : document.body;
    const look = opts.look ?? lookOf(target);
    const calm = opts.calm ?? (parseFloat(v('--m-d', '1')) === 0 || !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const layer = layerFor(root), lr = layer.getBoundingClientRect(), r = target.getBoundingClientRect();
    /* the card is scaled with CSS zoom (--z): draw at the same scale; older engines report zoomed boxes in unzoomed units */
    const z = parseFloat(v('--z', '1')) || 1, ow = (target as HTMLElement).offsetWidth;
    const k = z !== 1 && ow > 8 && Math.abs(r.width / ow - 1) < Math.abs(r.width / ow - z) ? z : 1;
    const ink = v('--ink', '#1b2430'), pr = v('--primary', '#0b5fa5'), kid = opts.colour || v('--kid') || v('--c') || pr;
    const w = document.createElement('div'); w.className = `spk-fx spk-${look}`; w.setAttribute('data-kind', kind);
    const X = point ? point.x - lr.left : r.left * k - lr.left, Y = point ? point.y - lr.top : r.top * k - lr.top, W = point ? 0 : (r.width * k) / z, H = point ? 0 : (r.height * k) / z;
    w.style.cssText = `left:${X}px;top:${Y}px;width:${W}px;height:${H}px;transform:scale(${z});--ink:${ink};--ok:${v('--ok', '#0f8a5f')};--ac:${v('--accent', '#c26a00')};--pr:${pr};--pp:${v('--paper', '#fff')};--gd:${v('--ground', '#0a0f1e')};--c:${kid};--c0:${kid}`;
    const e: E = { look, calm, o: opts, w, W, H, target: point ? null : target, rad: point ? '0' : cs.borderRadius || '0', font: cs.fontFamily || 'sans-serif', kid, dir: opts.dir === -1 ? -1 : 1,
      pal: ['--p-1', '--p-2', '--p-3', '--p-4', '--p-5', '--accent', '--primary'].map((n) => v(n)).filter(Boolean), plans: [], own: [] };
    if (!e.pal.length) e.pal = [pr, kid, GOLD];
    fx(e);
    const clean = (): void => { if (!layer.querySelector('.spk-fx')) { layer.remove(); layers.delete(layer); } };
    if (!e.plans.length || sparkCount() + w.querySelectorAll('[data-p]').length > SPARK_CAP) { clean(); return null; }
    layer.appendChild(w);
    const anims: Animation[] = [];
    for (const [node, frames, timing] of e.plans) { try { anims.push(node.animate(frames, timing)); } catch { /* skip this piece */ } }
    for (const [node, frames, timing] of e.own) { try { node.animate(frames, timing); } catch { /* an engine without additive animations: the target stays still */ } }
    const end = (): void => { w.remove(); clean(); };
    if (!anims.length) { end(); return null; }
    Promise.allSettled(anims.map((a) => a.finished)).then(end, end);
    return anims[0];
  } catch { return null; }
}

/* for the demo page (preview/sparks.html) and for trying things from the console */
try { (globalThis as { fhSpark?: typeof spark }).fhSpark ??= spark; (globalThis as { fhSparkCount?: typeof sparkCount }).fhSparkCount ??= sparkCount; } catch { /* no window */ }
