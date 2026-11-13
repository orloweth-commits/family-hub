import { css, html, nothing, unsafeCSS, type TemplateResult } from 'lit';
import { rnd, type Ctx, type Scene, type Visitor } from './types';

/**
 * Home Ground: the world behind the Sports look.
 *
 * `always` is the still ground: sky, tree line, the oval with its chalk, and the turf the dock stands on. A wash of the wall colour
 * lies over all of it except the turf along the bottom, so the middle of the page and the header stay quiet. Day and floodlit evening.
 * Nothing in it moves, so it stays in calm mode.
 *
 * `cast` is six balls, one at a time, each flying the way its game does, and five rare surprises. Every path is written against the
 * page's real furniture (the lengths `--aw --ah --at --ab --dl --dr --dt --db --sy` that the layer measures), so it holds on any screen:
 *   behind the panels: soccer (long curl), punt (rugby, end over end), torpedo (Aussie rules), floorball (floats and wobbles);
 *   in front, only in the free lanes: rally (tennis, along the top of the dock) and skim (hockey, along the strip under it).
 * Flights are baked into keyframes once, when this file loads. Transform and opacity only.
 */

/* ---- lengths as sums of the page's measures, so one path fits every screen ---- */
type Form = Record<string, number>;
/** the page the paths were drawn on (1280 x 800): used only to work out which way a ball points */
const REF: Form = { px: 1, aw: 1280, ah: 800, at: 110, ab: 678, dt: 694, db: 780, dl: 133, dr: 1147, cx: 563.2, gx: 976, am: 8, sy: 790 };
const F = (px: number, o: Form = {}): Form => ({ ...o, px });
const mix = (parts: [number, Form][]): Form => { const r: Form = {}; for (const [k, f] of parts) for (const n in f) r[n] = (r[n] ?? 0) + k * f[n]; return r; };
const add = (f: Form, px: number): Form => mix([[1, f], [1, F(px)]]);
const at = (f: Form): number => Object.entries(f).reduce((n, [k, v]) => n + v * (REF[k] ?? 0), 0);
const N = (n: number, d = 2): number => +n.toFixed(d);
const len = (f: Form): string => { const t = Object.entries(f).filter(([, v]) => Math.abs(v) > 1e-4).map(([n, v]) => (n === 'px' ? `${N(v, 1)}px` : `var(--${n})*${N(v, 4)}`)); return t.length > 1 || (t[0] ?? '').includes('*') ? `calc(${t.join(' + ')})` : t[0] ?? '0px'; };
const bez = (p: Form[], u: number): Form => { const v = 1 - u; return mix([[v * v * v, p[0]], [3 * v * v * u, p[1]], [3 * v * u * u, p[2]], [u * u * u, p[3]]]); };
const move = (x: Form, y: Form, more = ''): string => `transform:translate(${len(x)},${len(y)})${more}`;
/** keyframes from [time 0…1, declarations, easing to the next step?] */
const kf = (name: string, steps: [number, string, string?][]): string => `@keyframes ${name}{${steps.map(([t, d, e]) => `${N(t * 100)}%{${d}${e ? `;animation-timing-function:${e}` : ''}}`).join('')}}`;
/** the same from times in ms */
const kt = (name: string, ms: number, steps: [number, string, string?][]): string => kf(name, steps.map(([t, d, e]) => [t / ms, d, e]));
const span = (n: number): number[] => Array.from({ length: n + 1 }, (_, i) => i / n);
const QO = 'cubic-bezier(.333,.667,.667,1)', QI = 'cubic-bezier(.333,0,.667,.333)', SM = 'cubic-bezier(.333,0,.667,1)', OUT = 'cubic-bezier(.2,.8,.2,1)', SPRING = 'cubic-bezier(.2,1.4,.4,1)', IN = 'cubic-bezier(.4,0,1,1)', EIO = 'ease-in-out';

/* ---- the measures the paths use ---- */
const W: Form = { aw: 1 }, H: Form = { ah: 1 }, TOP: Form = { at: 1 }, DT: Form = { dt: 1 }, DL: Form = { dl: 1 };
/** a tennis ball's centre as it touches the top of the dock */
const YC = add(DT, -5);

/* ---- the flights ---- */
const soccerPath = [[mix([[0.5, { dr: 1 }], [0.5, W]]), add(H, 40)], [add(W, 30), { ah: 0.25 }], [{ aw: 0.77 }, F(-150)], [{ cx: 1 }, add(TOP, 70)]];
const torpedoPath = [[add(W, 60), { at: 0.76 }], [{ aw: 0.86 }, F(-10)], [{ aw: 0.625 }, F(10)], [{ cx: 1 }, add(TOP, 120)]];
const torpedoAt = (t: number): Form[] => { const u = 1 - Math.pow(1 - t, 1.2); return [bez(torpedoPath.map((p) => p[0]), u), bez(torpedoPath.map((p) => p[1]), u)]; };
/** three shots of a rally: [from, to, where it bounces] as shares of the width, 900 ms each with 300 ms between */
const SHOTS: [Form, Form, Form][] = [[F(-20), add(W, 20), { aw: 0.47 }], [add(W, 20), F(-20), { aw: 0.59 }], [F(-20), add(W, 20), { aw: 0.37 }]];
const rallyY = (): [number, string][] => {
  const out: [number, string][] = [];
  SHOTS.forEach(([a, b, c], i) => {
    const t0 = i * 1200, fb = (at(c) - at(a)) / (at(b) - at(a)), tb = t0 + 900 * fb, y = (k: number): Form => mix([[1, YC], [k, { am: 1 }]]);
    for (const p of span(5)) out.push([t0 + 900 * fb * p * 0.94, `transform:translateY(${len(y(-1 + p * 0.94 * (p * 0.94)))})`]);
    out.push([tb - 20, `transform:translateY(${len(y(-0.03))})`], [tb, `transform:translateY(${len(YC)}) scale(1.08,.92)`], [tb + 70, `transform:translateY(${len(y(-0.3))})`]);
    for (const q of span(5).slice(1)) { const r = 0.14 + 0.86 * q; out.push([tb + (t0 + 900 - tb) * r, `transform:translateY(${len(y(-1.15 * (2 * r - r * r)))})`]); }
  });
  return out.sort((m, n) => m[0] - n[0]);
};
const FLAGX = add(DL, -44), FLAGY = add(H, -24);
const gullAt = (p: number): Form[] => [mix([[1 - p, add(W, 50)], [p, add({ cx: 1 }, -60)]]), mix([[0.5 + 0.9 * p * p, TOP], [1, F(-30 * Math.sin(Math.PI * p))]])];

const KEYFRAMES = [
  kf('gd-soccer', span(24).map((t) => { const u = 1 - Math.pow(1 - t, 1.5); return [t, move(bez(soccerPath.map((p) => p[0]), u), bez(soccerPath.map((p) => p[1]), u), ` scale(${N(1.3 - 0.5 * u)})`)]; })),
  kf('gd-punt', [[0, move({ cx: 1 }, add(TOP, 140))], [1, move({ aw: 0.86 }, add(TOP, 140))]]),
  kf('gd-punt-y', [[0, 'transform:translateY(0) scale(.65)', QO], [0.5, `transform:translateY(${len(mix([[-1, TOP], [1, F(-110)]]))}) scale(1.2)`, QI], [1, 'transform:translateY(0) scale(.65)']]),
  kf('gd-torpedo', span(20).map((t) => { const [x, y] = torpedoAt(t), [x1, y1] = torpedoAt(Math.max(0, t - 0.01)), [x2, y2] = torpedoAt(Math.min(1, t + 0.01)); return [t, move(x, y, ` rotate(${N((Math.atan2(at(y2) - at(y1), at(x2) - at(x1)) * 180) / Math.PI - 180, 1)}deg) scale(${N(1.15 - 0.45 * t)})`)]; })),
  kt('gd-rally', 3300, SHOTS.flatMap(([a, b], i): [number, string][] => [[i * 1200, `transform:translateX(${len(a)})`], [i * 1200 + 900, `transform:translateX(${len(b)})`]])),
  kt('gd-rally-y', 3300, rallyY()),
  kf('gd-skim', [[0, move(F(-20), { sy: 1 }), QO], [1, move(add(W, 20), { sy: 1 })]]),
  kf('gd-float', [[0, move({ aw: 0.93 }, F(-30), ' scale(1)'), SM], [0.36, move({ gx: 1 }, add(TOP, 40), ' scale(.9)'), SM], [0.8, move({ gx: 1 }, add({ ab: 1 }, -6), ' scale(1.08)'), SM], [1, move(add({ gx: 1 }, 108), mix([[0.5, DT], [0.5, { db: 1 }]]), ' scale(.94)')]]),
  /* the corner flag knocked by the last shot of a rally */
  kt('gd-knock', 2300, [...span(5).map((p): [number, string] => [650 * p, move(mix([[1, DL], [1, F(536 - 470 * p)]]), add(YC, -9 + 9 * p * p))]), ...span(6).slice(1).map((p): [number, string] => [650 + 400 * p, move(add(DL, 66 - 102 * p), add(YC, -50 * p + 77 * p * p))]),
    ...span(5).slice(1).map((p): [number, string] => [1050 + 450 * p, move(add(DL, -36 + 16 * p), add(YC, 27 + 112 * p * p))]), [2300, move(add(DL, -20), add(YC, 139))]]),
  kt('gd-knock-sq', 2300, [[0, 'transform:scale(1,1)'], [620, 'transform:scale(1,1)'], [650, 'transform:scale(1.08,.92)'], [720, 'transform:scale(1,1)'], [2300, 'transform:scale(1,1)']]),
  kt('gd-flag', 2300, [[0, 'transform:rotate(0deg)'], [1050, 'transform:rotate(0deg)', OUT], [1170, 'transform:rotate(-16deg)', EIO], [1420, 'transform:rotate(10deg)', EIO], [1660, 'transform:rotate(-6deg)', EIO], [1900, 'transform:rotate(3deg)', EIO], [2100, 'transform:rotate(0deg)'], [2300, 'transform:rotate(0deg)']]),
  /* the gull with a chip, and the ball that chases it */
  kt('gd-gull', 2300, [...span(14).map((p): [number, string] => { const [x, y] = gullAt(p); return [2050 * p, move(x, y)]; }), [2300, move(add({ cx: 1 }, -60), { at: 1.4 })]]),
  kt('gd-chase', 2300, [[0, move(add(W, 120), { at: 0.6 }, ' scale(.6)')], ...span(18).map((p): [number, string] => { const [x, y] = gullAt(p); return [250 + 2050 * p, move(x, add(y, 8 - 16 * Math.abs(Math.sin(3 * Math.PI * p))), ' scale(.6)')]; })]),
  /* sprinkler, line marker, dog */
  kt('gd-head', 2300, [[0, 'transform:translateY(18px)', SPRING], [240, 'transform:translateY(0)'], [2050, 'transform:translateY(0)', IN], [2250, 'transform:translateY(18px)'], [2300, 'transform:translateY(18px)']]),
  kt('gd-sweep', 2300, [[0, 'transform:rotate(-52deg)'], [240, 'transform:rotate(-52deg)', EIO], [1070, 'transform:rotate(52deg)', EIO], [1900, 'transform:rotate(-52deg)'], [2300, 'transform:rotate(-52deg)']]),
  kt('gd-spray', 2300, [[0, 'opacity:0'], [240, 'opacity:0'], [340, 'opacity:1'], [1900, 'opacity:1'], [2050, 'opacity:0'], [2300, 'opacity:0']]),
  kt('gd-bow', 2300, [[0, 'opacity:0'], [600, 'opacity:0'], [1050, 'opacity:.8'], [1650, 'opacity:.8'], [2000, 'opacity:0'], [2300, 'opacity:0']]),
  kt('gd-chalk', 2300, [[0, 'transform:scaleX(0);opacity:1'], [190, 'transform:scaleX(0);opacity:1'], [2000, 'transform:scaleX(.97);opacity:1'], [2300, 'transform:scaleX(1);opacity:0']]),
  kt('gd-cart', 2300, [[0, `${move(F(-44), add(DT, 3))};opacity:1`], [2000, `${move(add({ aw: 0.4 }, -20), add(DT, 3))};opacity:1`], [2300, `${move(add({ aw: 0.4 }, 61), add(DT, 3))};opacity:0`]]),
  kf('gd-dog', [[0, move(F(-60), add(DT, 4))], [1, move(add(W, 60), add(DT, 4))]]),
].join('');

/* ---- drawings: the illustrator's balls and gear on a 64 x 64 box; markings sit in .gd-m so they can turn under a fixed shade ---- */
const INK = '#2b2f36', CHALK = '#f6f3e7', HV = '#d9e63a', OR = '#f47b20', YL = '#f5c531', ST = '#9aa5b1', SL = '#4a525e';
const pol = (r: number, a: number, cx = 32, cy = 32): string => `${N(cx + r * Math.cos((a * Math.PI) / 180), 1)} ${N(cy + r * Math.sin((a * Math.PI) / 180), 1)}`;
const shade = (R: number): string => `<path d="M${pol(R, -35)}A${R} ${R} 0 0 1 ${pol(R, 145)}A${N(R * 1.35, 1)} ${N(R * 1.35, 1)} 0 0 0 ${pol(R, -35)}z" opacity=".13"/>`;
const soccerArt = ((): string => { const pent: string[] = []; let lines = '', patches = ''; for (let k = 0; k < 5; k++) { const t = -90 + 72 * k; pent.push(pol(9.5, t)); lines += `M${pol(9.5, t)}L${pol(15.5, t)}M${pol(19.5, t + 19)}L${pol(19.5, t + 53)}`; patches += `M${pol(15.5, t)}L${pol(19.5, t - 19)}L${pol(24, t - 13)}A24 24 0 0 1 ${pol(24, t + 13)}L${pol(19.5, t + 19)}z`; }
  return `<circle cx="32" cy="32" r="24" fill="#fff"/><g class="gd-m"><path d="M${pent.join('L')}z${patches}" fill="${INK}"/><path d="${lines}" stroke="${INK}" stroke-width="1.6" fill="none"/></g>${shade(24)}<circle cx="32" cy="32" r="24" fill="none" stroke="${INK}" stroke-width="1.6"/>`; })();
const tennisArt = `<circle cx="32" cy="32" r="22" fill="${HV}"/><g class="gd-m"><path d="M${pol(22, 217)}Q27 32 ${pol(22, 143)}M${pol(22, -37)}Q37 32 ${pol(22, 37)}" stroke="#fff" stroke-width="3" fill="none"/></g>${shade(22)}<circle cx="32" cy="32" r="22" fill="none" stroke="#98a31f" stroke-width="1.6"/>`;
const rugbyArt = `<path d="M4 32C6 19 19 14 32 14C45 14 58 19 60 32C58 45 45 50 32 50C19 50 6 45 4 32z" fill="${CHALK}"/><path d="M14.5 19.5Q10 32 14.5 44.500M49.500 19.500Q54 32 49.500 44.500" stroke="${INK}" stroke-width="3.800" fill="none"/><path d="M21 32H43" stroke="#b5713a" stroke-width="1.400"/><path d="M25 29.400v5.200M29.700 29.400v5.200M34.300 29.400v5.200M39 29.400v5.200" stroke="${INK}" stroke-width="1.200"/><path d="M4 32C6 19 19 14 32 14C45 14 58 19 60 32C58 45 45 50 32 50C19 50 6 45 4 32z" fill="none" stroke="${INK}" stroke-width="1.500"/>`;
const FOOTY = 'M5 32C13 11 51 11 59 32C51 53 13 53 5 32z';
const footyArt = `<defs><clipPath id="gd-fc"><path d="${FOOTY}"/></clipPath></defs><path d="${FOOTY}" fill="#c8372d"/><path d="M17.500 22.500Q14 32 17.500 41.500M46.500 22.500Q50 32 46.500 41.500" stroke="#000" stroke-opacity=".22" stroke-width="1.300" fill="none"/><g clip-path="url(#gd-fc)"><g class="gd-lace"><path d="M25.500 32h13M27 29.200v5.600M30.300 29.200v5.600M33.700 29.200v5.600M37 29.200v5.600" stroke="${CHALK}" stroke-width="1.700" stroke-linecap="round"/></g></g><path d="${FOOTY}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="1.200"/>`;
const hockeyArt = ((): string => { let d = ''; for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) { const x = i * 6 + (j & 1 ? 3 : 0), y = j * 5.2; if (Math.hypot(x, y) < 11.6) d += `M${N(32 + x, 1)} ${N(32 + y, 1)}h.01`; }
  return `<circle cx="32" cy="32" r="15" fill="#fff"/><g class="gd-m"><path d="${d}" stroke="#a9b1bb" stroke-width="2.400" stroke-linecap="round"/></g>${shade(15)}<circle cx="32" cy="32" r="15" fill="none" stroke="${INK}" stroke-opacity=".6" stroke-width="1.800"/>`; })();
const floorArt = ((): string => { let h = '<circle cx="32" cy="32" r="4.300"/>'; for (let k = 0; k < 6; k++) { const a = pol(12.3, k * 60), b = pol(19.3, k * 60 + 30); h += `<ellipse cx="${a.split(' ')[0]}" cy="${a.split(' ')[1]}" rx="3" ry="3.900" transform="rotate(${k * 60} ${a})"/><ellipse cx="${b.split(' ')[0]}" cy="${b.split(' ')[1]}" rx="1.500" ry="3.400" transform="rotate(${k * 60 + 30} ${b})"/>`; }
  return `<circle cx="32" cy="32" r="22" fill="#fff"/><g class="gd-m" fill="#56606c">${h}</g>${shade(22)}<circle cx="32" cy="32" r="22" fill="none" stroke="${INK}" stroke-opacity=".6" stroke-width="1.500"/>`; })();
const BALLS: Record<string, [art: string, size: number]> = { soccer: [soccerArt, 40], rugby: [rugbyArt, 43], footy: [footyArt, 43], tennis: [tennisArt, 20], hockey: [hockeyArt, 0], floorball: [floorArt, 32] };
/** a ball: .gd-b carries where it is, .gd-k its hop, squash and nearness, .gd-spin its turn */
const ball = (kind: string, cls = ''): string => { const [art, s] = BALLS[kind]; return `<i class="gd-b gd-${kind} ${cls}"${s ? ` style="--s:${s}px"` : ''}><i class="gd-k"><i class="gd-spin"><svg viewBox="0 0 64 64">${art}</svg></i></i></i>`; };
/** a prop drawn about its foot at (x, y) */
const prop = (cls: string, x: Form, y: Form, art: string): string => `<i class="gd-p ${cls}" style="left:${len(x)};top:${len(y)}"><svg viewBox="0 0 1 1" width="1" height="1">${art}</svg></i>`;
const stage = (inner: string): TemplateResult => html`<i class="gd-in" .innerHTML=${inner}></i>`;

const FLAG = `<path d="M0 0V-64" stroke="${YL}" stroke-width="3" stroke-linecap="round"/><path d="M1-63 21-55 1-47z" fill="${OR}"/><path d="M1-55 21-55 1-47z" opacity=".12"/>`;
const GULL = `<ellipse rx="15" ry="6.500" fill="#fff" stroke="#8b9299"/><circle cx="-14" cy="-4" r="5" fill="#fff" stroke="#8b9299"/><circle cx="-15.500" cy="-5" r="1" fill="${INK}"/><path d="M-19-3.500-26-2-19-1z" fill="#f2a31b"/><rect x="-33" y="-3.200" width="9" height="2.600" rx="1" fill="#f4d35e" stroke="#b98a1a" stroke-width=".6"/><g class="gd-wing"><path d="M-6-2Q4-26 20-20Q10-14 8-2z" fill="#aeb4ba" stroke="#5a6068"/></g><path d="M14 0 24-3 22 3z" fill="#5a6068"/>`;
const HEAD = `<rect x="-5" y="-12" width="10" height="14" rx="2" fill="${INK}"/><rect x="-7" y="-14" width="14" height="4" rx="2" fill="#5a6068"/>`;
const SPRAY = [16, 26, 36, 46, 56].map((d, i) => `<circle cy="${-d}" r="${N(1.6 + i * 0.25)}" fill="#e3f4ff"/><circle cx="${i % 2 ? 4 : -4}" cy="${-d + 5}" r="1.300" fill="#e3f4ff" opacity=".8"/>`).join('');
const BOW = [['#e2574c', 38], ['#f4d35e', 34.5], ['#58b368', 31], ['#4f9bd9', 27.5]].map(([c, r]) => `<path d="M${-r} 0A${r} ${r} 0 0 1 ${r} 0" fill="none" stroke="${c}" stroke-width="3"/>`).join('');
const CART = `<path d="M22-12 40-24" stroke="${INK}" stroke-width="2.400" stroke-linecap="round"/><rect x="2" y="-20" width="22" height="13" rx="3" fill="${OR}" stroke="${INK}" stroke-width="1.200"/><path d="M8-7 6-1h8l-2-6z" fill="${CHALK}"/><g class="gd-wheel"><circle cx="20" cy="-5" r="5" fill="${INK}"/><path d="M20-9v8M16-5h8" stroke="${CHALK}" stroke-width="1"/></g>`;
const DOG = `<path class="gd-tail" d="M-14-16Q-22-22-20-28" stroke="#8a5a2b" stroke-width="3.200" fill="none" stroke-linecap="round"/><g class="gd-l1"><path d="M-10-10V0M10-10V0" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/></g><g class="gd-l2"><path d="M-6-10V0M14-10V0" stroke="#6f4620" stroke-width="3" stroke-linecap="round"/></g><rect x="-16" y="-20" width="32" height="12" rx="6" fill="#b9814f" stroke="#6f4620"/><circle cx="19" cy="-21" r="6.500" fill="#b9814f" stroke="#6f4620"/><path d="M15-26 12-18 18-20z" fill="#6f4620"/><circle cx="21" cy="-22.500" r="1" fill="${INK}"/><circle cx="27" cy="-18.500" r="3.600" fill="${HV}" stroke="#7f8c18" stroke-width=".8"/>`;

/* ---- the still world (the illustrator's sky, far and field layers on 1920 x 1080; the gear is set in the corners beside the dock) ---- */
const P = (X: number, Z: number): [number, number] => [N(960 + (830 * X) / Z, 1), N(250 + 8300 / Z, 1)];
const world = (eve: boolean): string => {
  const T = eve ? { s0: '#131b33', s1: '#3b4673', hill: '#263a52', t1: '#1e3f3d', t2: '#173231', far: '#2a6d47', g1: '#2f7a4b', g2: '#2b7146', chalk: 0.46, wall: '#b9b3a6', roof: '#3a2b2a', court: '#2f6c84', steel: '#55607a', lamp: '#fff3c4', post: '#f6f3e7' }
    : { s0: '#cbe7f4', s1: '#e6f4f2', hill: '#a8d1b3', t1: '#63a56f', t2: '#4a8d5c', far: '#62b36c', g1: '#58ad63', g2: '#51a55c', chalk: 0.52, wall: '#f1e7d0', roof: '#8a5226', court: '#5fa6c4', steel: '#8b96a3', lamp: '#f6f3e7', post: '#ffffff' };
  const trees = (seed: number, y: number, lo: number, hi: number, step: number): string => { const r = rnd(seed); let d = ''; for (let x = -30; x < 1960; x += step * (0.7 + r() * 0.6)) { const R = Math.round(lo + r() * (hi - lo)); d += `M${Math.round(x - R)} ${Math.round(y - R * 0.5 - r() * 10)}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`; } return d; };
  const tower = (x: number, base: number, top: number, s: number): string => `<path d="M${x} ${base}V${top}M${x - 9 * s} ${base}L${x} ${base - 60 * s}L${x + 9 * s} ${base}" fill="none" stroke="${T.steel}" stroke-width="${N(4.5 * s, 1)}" stroke-linecap="round"/>${eve ? `<circle cx="${x}" cy="${top}" r="${N(44 * s, 1)}" fill="url(#gd-glow)"/>` : ''}<rect x="${N(x - 24 * s, 1)}" y="${N(top - 11 * s, 1)}" width="${N(48 * s, 1)}" height="${N(22 * s, 1)}" rx="${N(3 * s, 1)}" fill="${T.steel}"/><path d="M${N(x - 16 * s, 1)} ${N(top - 4.5 * s, 1)}h${N(32 * s, 1)}M${N(x - 16 * s, 1)} ${N(top + 4.5 * s, 1)}h${N(32 * s, 1)}" stroke="${T.lamp}" stroke-width="${N(6 * s, 1)}" stroke-linecap="round" stroke-dasharray=".01 ${N(10.66 * s)}"/>`;
  const cloud = (x: number, y: number, s: number): string => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0h120a16 16 0 0 0 0-32h-14a26 26 0 0 0-50-8a20 20 0 0 0-36 12h-20a14 14 0 0 0 0 28z"/>`;
  let stars = ''; if (eve) { const r = rnd(7); for (let i = 0; i < 26; i++) stars += `M${N(r() * 1920, 1)} ${N(16 + r() * 190, 1)}h.01`; }
  const sky = `<rect width="1920" height="380" fill="url(#gd-sky)"/>${eve ? `<path d="${stars}" stroke="#fff" stroke-opacity=".4" stroke-width="2.600" stroke-linecap="round"/>` : `<g fill="#fff" opacity=".75">${cloud(380, 214, 1.1)}${cloud(1500, 196, 0.9)}${cloud(930, 222, 0.6)}</g>`}`;
  let fence = ''; for (let x = 6; x <= 546; x += 60) fence += `M${x} 290V358`;
  const far = `<path d="M0 262Q240 214 520 244T1020 236T1500 246T1920 226V320H0z" fill="${T.hill}"/><path d="${trees(11, 292, 34, 54, 78)}" fill="${T.t1}"/><path d="${trees(29, 306, 26, 40, 96)}" fill="${T.t2}"/><rect y="300" width="1920" height="80" fill="${T.far}"/>`
    + `<path d="M30 352L112 310H436L508 352z" fill="${T.court}"/><path d="M62 346L126 315H422L478 346zM94 330.500H450" fill="none" stroke="${CHALK}" stroke-opacity="${T.chalk}" stroke-width="2"/><path d="M84 331V320M460 331V320" stroke="${T.steel}" stroke-width="3"/><path d="M84 321H460" stroke="${T.post}" stroke-opacity=".85" stroke-width="2.500"/><path d="M84 322H460V330H84z" fill="${INK}" opacity=".2"/>`
    + `<path d="M6 292H546V356H6z" fill="${T.steel}" opacity=".16"/><path d="${fence}M6 292H546" fill="none" stroke="${T.steel}" stroke-width="2.500"/>`
    + `<path d="M1196 352V318M1324 352V318" stroke="${T.steel}" stroke-width="5"/><path d="M1180 258H1340V330H1180z" fill="${T.wall}"/><path d="M1180 258H1340V266H1180z" opacity=".14"/><path d="M1166 260L1260 228L1354 260z" fill="${T.roof}"/><rect x="1192" y="272" width="136" height="46" rx="3" fill="#23272e"/><path d="M1204 284H1320M1204 295H1320M1204 306H1320" stroke="${eve ? '#ffd65a' : '#59626e'}" stroke-opacity="${eve ? 0.9 : 1}" stroke-width="4.500" stroke-linecap="round" stroke-dasharray=".01 ${eve ? 16 : 8}"/>`
    + `<path d="M560 358H1920" stroke="${T.post}" stroke-opacity="${eve ? 0.55 : 0.8}" stroke-width="2.500"/><path d="M560 362H1920" stroke="${T.post}" stroke-opacity="${eve ? 0.5 : 0.75}" stroke-width="8" stroke-dasharray="2.500 27.500"/>${tower(600, 366, 214, 0.62)}${tower(1452, 366, 214, 0.62)}`;
  let bands = ''; for (let Z = 10, i = 0; Z < 70; Z += 5, i++) if (i % 2) bands += `M0 ${P(0, Z)[1]}H1920V${P(0, Z + 5)[1]}H0z`;
  let arc = ''; for (let a = -90; a <= 90; a += 15) arc += (a === -90 ? 'M' : 'L') + P(-34 + 9 * Math.cos((a * Math.PI) / 180), 43 + 9 * Math.sin((a * Math.PI) / 180));
  const yF = P(0, 70)[1];
  let posts = ''; for (const [Z, h] of [[48, 5.6], [45, 9.5], [42, 9.5], [39, 5.6]]) { const [x, y] = P(34, Z), s = 830 / Z; posts += `<path d="M${x} ${y}V${N(y - h * s, 1)}" stroke="${T.post}" stroke-width="${N(0.3 * s, 1)}" stroke-linecap="round"/><path d="M${x} ${y}V${N(y - 1.5 * s, 1)}" stroke="${OR}" stroke-width="${N(0.55 * s, 1)}" stroke-linecap="round"/>`; }
  const [g1x, g1y] = P(-34, 41.5), [g2x, g2y] = P(-34, 44.5), b1 = P(-37.5, 41.5), b2 = P(-37.5, 44.5), h1 = N((3.4 * 830) / 41.5, 1), h2 = N((3.4 * 830) / 44.5, 1);
  const goal = `<path d="M${g1x} ${N(g1y - h1, 1)}L${b1}L${b2}L${g2x} ${N(g2y - h2, 1)}V${g2y}L${g1x} ${g1y}z" fill="${T.post}" opacity=".3"/><path d="M${g1x} ${g1y}V${N(g1y - h1, 1)}L${g2x} ${N(g2y - h2, 1)}V${g2y}" fill="none" stroke="${T.post}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
  const field = `<rect y="${yF - 4}" width="1920" height="${N(1084 - yF, 1)}" fill="${T.g1}"/><path d="${bands}" fill="${T.g2}"/><g fill="none" stroke="${CHALK}" stroke-opacity="${T.chalk}" stroke-width="3.500" stroke-linejoin="round"><path d="M${P(-34, 29.4)}L${P(-34, 70)}L${P(34, 70)}L${P(34, 29.4)}M960 ${yF}V942"/><ellipse cx="960" cy="538" rx="166" ry="58"/><path d="M${P(34, 42)}L${P(27, 42)}L${P(27, 45)}L${P(34, 45)}"/><path d="${arc}"/><path d="M0 942H1920" stroke-width="6"/></g>${goal}${posts}${tower(92, 384, 192, 1)}${tower(1828, 384, 192, 1)}`;
  return `<svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="gd-sky" x2="0" y2="1"><stop offset=".35" stop-color="${T.s0}"/><stop offset="1" stop-color="${T.s1}"/></linearGradient>${eve ? '<radialGradient id="gd-glow"><stop stop-color="#fff3c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>' : ''}</defs>${sky}${far}${field}</svg>`;
};
const WORLD: Record<string, string> = {};
/** the kit bag with a soccer ball by it, and a stack of cones: they stand in the corners beside the dock when there is room */
const BAG = `<svg viewBox="0 0 64 64"><ellipse cx="34" cy="57" rx="30" ry="4" opacity=".14"/><path d="M20 30Q20 11 32 11Q44 11 44 30" fill="none" stroke="#b5713a" stroke-width="3.600" stroke-linecap="round"/><rect x="5" y="25" width="54" height="30" rx="12" fill="#35506b"/><path d="M25 25h14v30H25z" fill="${OR}"/><path d="M12 31H52" stroke="${ST}" stroke-width="1.600" stroke-dasharray="2.500 2"/><path d="M5 43Q5 55 17 55H47Q59 55 59 43Q57 50 47 50H17Q7 50 5 43z" opacity=".22"/><path d="M27 20h10" stroke="#8a5226" stroke-width="5" stroke-linecap="round"/><g transform="translate(40 36) scale(.42)">${soccerArt}</g></svg>`;
const CONE = `<rect x="9" y="50" width="46" height="8" rx="2.500" fill="${OR}"/><path d="M9 54h46v1.500Q55 58 52.500 58H11.500Q9 58 9 55.500z" opacity=".16"/><path d="M26 12Q32 7 38 12L49 51H15z" fill="${OR}"/><path d="M22 26H42L44.300 34H19.700z" fill="${CHALK}"/><path d="M32 8.500Q35.500 9 38 12L49 51H32z" opacity=".1"/>`;
const CONES = `<svg viewBox="0 -14 64 78"><ellipse cx="32" cy="60" rx="28" ry="3.500" opacity=".14"/><g id="gd-cone">${CONE}</g><use href="#gd-cone" y="-7"/><use href="#gd-cone" y="-14"/></svg>`;

const always = (c: Ctx): TemplateResult => {
  const eve = c.tod !== 'day', key = eve ? 'eve' : 'day', gear = !!c.lay && !c.lay.phone && c.lay.corner >= 110;
  return html`<div class="gd-world ${eve ? 'gd-eve' : ''}"><div class="gd-art" .innerHTML=${(WORLD[key] ??= world(eve))}></div><div class="gd-wash"></div>${gear ? html`<i class="gd-gear gd-bag" .innerHTML=${BAG}></i><i class="gd-gear gd-cones" .innerHTML=${CONES}></i>` : nothing}</div>`;
};

/* ---- who comes ---- */
/** the ball of the day is twice as likely: Monday soccer, Tuesday tennis, Wednesday hockey, Thursday floorball, Friday rugby, Saturday Aussie rules, Sunday any */
const TODAY = ['', 'soccer', 'rally', 'skim', 'floorball', 'punt', 'torpedo'];
const likely = (id: string, w: number) => (c: Ctx): number => (TODAY[c.weekday] === id ? 2 * w : w);
const wide = (c: Ctx): boolean => !c.lay?.phone;
const gutter = (c: Ctx): boolean => !!c.lay && !c.lay.phone && c.lay.gutter >= 10;
const corner = (c: Ctx): boolean => !!c.lay && !c.lay.phone && c.lay.corner >= 110 && c.lay.gutter >= 10;
const SPRINKLER = stage(prop('gd-bow', add({ dr: 1 }, 46), add(H, -30), BOW) + `<i class="gd-p gd-spray" style="left:${len(add({ dr: 1 }, 46))};top:${len(add(H, -20))}"><i class="gd-sweep"><svg viewBox="0 0 1 1" width="1" height="1">${SPRAY}</svg></i></i>` + prop('gd-head', add({ dr: 1 }, 46), add(H, -6), HEAD));

const cast: Visitor[] = [
  { id: 'soccer', ms: 5600, move: 'gd-st', flip: false, weight: likely('soccer', 4), when: wide, art: stage(ball('soccer')) },
  { id: 'punt', ms: 5200, move: 'gd-st', flip: false, weight: likely('punt', 4), when: wide, art: stage(ball('rugby')) },
  { id: 'torpedo', ms: 3600, move: 'gd-st', flip: false, weight: likely('torpedo', 4), when: wide, art: stage(ball('footy')) },
  { id: 'rally', ms: 3300, move: 'gd-st', flip: false, front: true, lane: true, weight: likely('rally', 4), when: gutter, art: stage(ball('tennis')) },
  { id: 'skim', ms: 2400, move: 'gd-st', flip: false, front: true, lane: true, weight: likely('skim', 4), when: (c) => !!c.lay && !c.lay.phone && (c.lay.strip >= 10 || c.lay.gutter >= 10), art: stage(ball('hockey')) },
  { id: 'floorball', ms: 9000, move: 'gd-st', flip: false, weight: likely('floorball', 3), art: stage(ball('floorball')) },
  /* the surprises: each rare on its own, and together at most one in ten minutes, six a day, none after 6.30 pm (see `rare` below) */
  { id: 'flagknock', ms: 2300, move: 'gd-st gd-fade', flip: false, front: true, lane: true, weight: 0.5, max: 'hour', when: corner, art: stage(prop('gd-flag', FLAGX, FLAGY, FLAG) + ball('tennis', 'gd-knock')) },
  { id: 'gull', ms: 2300, move: 'gd-st gd-fade', flip: false, weight: 3, max: 'day', when: (c) => wide(c) && ((c.mins >= 720 && c.mins < 810) || (c.weekday === 5 && c.mins >= 1020 && c.mins < 1110)), art: stage(`<i class="gd-b gd-gull"><svg viewBox="0 0 1 1" width="1" height="1">${GULL}</svg></i>` + ball('soccer', 'gd-chase')) },
  { id: 'sprinkler', ms: 2300, move: 'gd-st gd-fade', flip: false, front: true, lane: true, weight: 3, max: 'day', when: (c) => corner(c) && !c.rainy && c.mins >= 360 && c.mins < 450, art: SPRINKLER },
  { id: 'sprinkler-pm', ms: 2300, move: 'gd-st gd-fade', flip: false, front: true, lane: true, weight: 3, max: 'day', when: (c) => corner(c) && !c.rainy && c.mins >= 1050, art: SPRINKLER },
  { id: 'marker', ms: 2300, move: 'gd-st gd-fade', flip: false, front: true, lane: true, weight: 3, max: 'day', when: (c) => gutter(c) && (c.weekday === 6 || c.weekday === 1) && c.mins < 540, art: stage(`<i class="gd-line"></i><i class="gd-b gd-cart"><svg viewBox="0 0 1 1" width="1" height="1">${CART}</svg></i>`) },
  { id: 'dog', ms: 2300, move: 'gd-st gd-fade', flip: false, front: true, lane: true, weight: 3, max: 'day', when: (c) => gutter(c) && (c.weekday === 0 || c.weekday === 6) && c.mins >= 780 && c.mins < 1020, art: stage(`<i class="gd-b gd-dog"><i class="gd-k"><svg viewBox="0 0 1 1" width="1" height="1">${DOG}</svg></i></i>`) },
];

export const sports: Scene = {
  gap: [20_000, 90_000], solo: true, still: true, rare: { every: 600_000, day: 6, until: 1110 },
  css: css`
    .gd-world, .gd-art, .gd-wash { position: absolute; inset: 0; }
    .gd-world { --gd-wall: var(--ground, #ecefe6); }
    .gd-world.gd-eve { --gd-wall: var(--ground, #0d1411); }
    .gd-art svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    /* the wall: thin over the sky, nearly whole over the oval, gone where the turf meets the dock */
    .gd-wash { background: linear-gradient(to bottom, color-mix(in srgb, var(--gd-wall) 80%, transparent) 0, color-mix(in srgb, var(--gd-wall) 91%, transparent) var(--top, 110px), color-mix(in srgb, var(--gd-wall) 91%, transparent) calc(100% - var(--bot, 122px) - 16px), transparent calc(100% - var(--bot, 122px) + 6px)); }
    /* under lights: two soft pools from the towers, kept dim so the header reads */
    .gd-eve .gd-wash { background: radial-gradient(52% 44% at 100% -8%, rgba(255,243,196,.13), transparent 72%), radial-gradient(52% 44% at 0 -8%, rgba(255,243,196,.09), transparent 72%), linear-gradient(to bottom, color-mix(in srgb, var(--gd-wall) 86%, transparent) 0, color-mix(in srgb, var(--gd-wall) 90%, transparent) var(--top, 110px), color-mix(in srgb, var(--gd-wall) 90%, transparent) calc(100% - var(--bot, 122px) - 16px), color-mix(in srgb, var(--gd-wall) 30%, transparent) calc(100% - var(--bot, 122px) + 6px)); }
    .gd-gear { position: absolute; bottom: 5px; display: block; }
    .gd-gear svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .gd-bag { left: calc(var(--pad-x, 24px) - 6px); width: 64px; height: 64px; }
    .gd-cones { right: calc(var(--pad-x, 24px) - 4px); width: 42px; height: 51px; }
    .gd-eve .gd-gear { opacity: .8; }

    .gd-st { left: 0; top: 0; width: 100%; height: 100%; will-change: auto;
      --cx: max(calc(var(--aw) * .44), 480px); --gx: max(calc(var(--aw) - var(--pad-x, 24px) - var(--rail, 272px) - var(--gap, 16px) / 2), calc(var(--aw) * .72)); --am: clamp(6px, calc(var(--dt) - var(--ab) - 8px), 14px); }
    .gd-fade { animation: gd-fade var(--t) linear both; }
    @keyframes gd-fade { 0%, 100% { opacity: 0; } 7%, 93% { opacity: 1; } }
    .gd-in { position: absolute; inset: 0; display: block; }
    .gd-b, .gd-p, .gd-line { position: absolute; left: 0; top: 0; display: block; will-change: transform, opacity; }
    .gd-b, .gd-p { width: 0; height: 0; }
    .gd-b i, .gd-p i { position: absolute; left: 0; top: 0; width: 0; height: 0; display: block; }
    .gd-st svg { position: absolute; left: 0; top: 0; display: block; overflow: visible; }
    .gd-spin svg { width: var(--s); height: var(--s); left: calc(var(--s) / -2); top: calc(var(--s) / -2); }
    .gd-m, .gd-lace { transform-origin: 32px 32px; }

    .gd-soccer { animation: gd-soccer var(--t) linear both; }
    .gd-soccer .gd-m { animation: gd-turn var(--t) cubic-bezier(.2,.6,.4,1) both; --a: -560deg; }
    .gd-rugby { animation: gd-punt var(--t) linear both; }
    .gd-rugby .gd-k { animation: gd-punt-y var(--t) linear both; }
    .gd-rugby .gd-spin { animation: gd-turn var(--t) linear both; --a: 1260deg; }
    .gd-footy { animation: gd-torpedo var(--t) linear both; }
    .gd-footy .gd-lace { animation: gd-lace calc(var(--t) / 12) linear 12 both; }
    .gd-tennis { --s: 20px; animation: gd-rally var(--t) linear both; }
    .gd-tennis .gd-k { animation: gd-rally-y var(--t) linear both; }
    .gd-tennis .gd-m { animation: gd-turn var(--t) linear both; --a: 2160deg; }
    .gd-hockey { --s: calc(max(8px, min(12px, var(--ah) - var(--db) - 4px)) * 2.13); animation: gd-skim var(--t) linear both; }
    .gd-hockey .gd-m { animation: gd-turn var(--t) cubic-bezier(.1,.7,.3,1) both; --a: 1800deg; }
    .gd-floorball { animation: gd-float var(--t) linear both; }
    .gd-floorball .gd-k { animation: gd-wx calc(var(--t) / 10) ease-in-out 10 alternate both; }
    .gd-floorball .gd-spin { animation: gd-wy calc(var(--t) / 14) ease-in-out 14 alternate both; }
    .gd-floorball .gd-m { animation: gd-rock calc(var(--t) / 5) ease-in-out 5 alternate both; }
    @keyframes gd-turn { from { transform: rotate(0deg); } to { transform: rotate(var(--a)); } }
    @keyframes gd-lace { from { transform: translateY(-16px); } to { transform: translateY(16px); } }
    @keyframes gd-wx { from { transform: translateX(-15px); } to { transform: translateX(15px); } }
    @keyframes gd-wy { from { transform: translateY(-6px); } to { transform: translateY(6px); } }
    @keyframes gd-rock { from { transform: rotate(-22deg); } to { transform: rotate(30deg); } }

    .gd-knock { animation: gd-knock var(--t) linear both; }
    .gd-knock .gd-k { animation: gd-knock-sq var(--t) linear both; }
    .gd-knock .gd-m { animation: gd-turn var(--t) linear both; --a: -900deg; }
    .gd-flag { animation: gd-flag var(--t) linear both; }
    .gd-gull { animation: gd-gull var(--t) linear both; }
    .gd-wing { transform-origin: 0 -2px; animation: gd-flap 250ms ease-in-out 9 both; }
    @keyframes gd-flap { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(-.5); } }
    .gd-chase { animation: gd-chase var(--t) linear both; }
    .gd-chase .gd-m { animation: gd-turn var(--t) linear both; --a: -700deg; }
    .gd-head { animation: gd-head var(--t) linear both; }
    .gd-spray { animation: gd-spray var(--t) linear both; }
    .gd-sweep { animation: gd-sweep var(--t) linear both; }
    .gd-bow { animation: gd-bow var(--t) linear both; }
    .gd-line { top: calc(var(--dt) - 2px); width: calc(var(--aw) * .4); height: 3px; border-radius: 2px; background: #f7f5ee; transform-origin: 0 50%; animation: gd-chalk var(--t) linear both; }
    .gd-cart { animation: gd-cart var(--t) linear both; }
    .gd-cart svg, .gd-dog svg { scale: var(--gk, 1); transform-origin: 0 0; }
    .gd-wheel { transform-origin: 20px -5px; animation: gd-roll 230ms linear 10 both; }
    @keyframes gd-roll { to { transform: rotate(360deg); } }
    .gd-dog { animation: gd-dog var(--t) linear both; }
    .gd-dog .gd-k { animation: gd-bob 82ms ease-in-out 28 alternate both; }
    @keyframes gd-bob { to { transform: translateY(-2.2px); } }
    .gd-l1, .gd-l2, .gd-tail { animation: gd-leg 164ms ease-in-out 14 both; }
    .gd-l1 { transform-origin: 0 -10px; --a: 26deg; } .gd-l2 { transform-origin: 4px -10px; --a: -26deg; } .gd-tail { transform-origin: -14px -16px; --a: -16deg; }
    @keyframes gd-leg { 0%, 100% { transform: rotate(var(--a)); } 50% { transform: rotate(calc(var(--a) * -1)); } }
    ${unsafeCSS(KEYFRAMES)}
  `,
  always,
  cast,
};
