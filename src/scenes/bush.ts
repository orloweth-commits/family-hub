import { css, html, nothing, svg, unsafeCSS, type TemplateResult } from 'lit';
import { rnd, type Ctx, type Scene, type Visitor } from './types';

/**
 * The West Australian bush, breathing. Sky across the top band, red dirt along the bottom edge.
 * Ground-dwellers keep to the bottom strip and tell their story in a bottom corner (the only clear ground);
 * fliers keep to the top band. Everything is drawn facing right; the stage manager mirrors it when it comes from the right,
 * and `--bd` (1 or -1) mirrors the journey. Drawn as a field guide would: true proportions, a base, a shadow and a highlight
 * on each surface, a soft shadow on the ground, no outlines.
 */

// ---- the seasons (southern hemisphere) -------------------------------------------------------------------------------
const season = (m: number): 'spring' | 'summer' | 'autumn' | 'winter' => (m >= 9 && m <= 11 ? 'spring' : m === 12 || m <= 2 ? 'summer' : m <= 5 ? 'autumn' : 'winter');
const GRASS = { spring: ['#6f8236', '#a3ad54', '#c9c77a'], summer: ['#a88a40', '#d2b868', '#ead9a0'], autumn: ['#8f7c40', '#bda65c', '#dccb92'], winter: ['#4f7a30', '#7fa046', '#b4c878'] };

/** One corner's tussock: long blades in three tones, and whatever is flowering this season. Drawn for the left corner; the right one is mirrored. */
const tussock = (seed: number, m: number, back: boolean): TemplateResult => {
  const r = rnd(seed), s = season(m), g = GRASS[s], out: TemplateResult[] = [];
  for (let i = 0; i < (back ? 13 : 19); i++) {
    const x = (back ? 8 : 2) + i * (back ? 13 : 9.4) + r() * 6, h = ((i < 7 ? 52 : 28) * (0.5 + r() * 0.6) * (1 - i / 44)) * (back ? 1.25 : 1), lean = (r() - 0.38) * 18, w = 1.6 + r() * 1.8;
    out.push(svg`<path d="M${x.toFixed(0)} 90q${(lean / 4).toFixed(0)}-${(h * 0.55).toFixed(0)} ${lean.toFixed(0)}-${h.toFixed(0)}" stroke=${g[back ? 0 : 1 + (i % 2)]} stroke-width=${w.toFixed(1)}/>`);
    if (back || i % 3 !== 1 || i > 14) continue;
    const fx = (x + lean).toFixed(0), fy = (90 - h - 2).toFixed(0);
    // kangaroo paw: a red felted stem, a fan of red-and-green claws
    if (s === 'spring' && i % 2) out.push(svg`<g transform="translate(${fx} ${fy})"><path d="M0 12V3" stroke="#a02a26" stroke-width="2"/><path d="M0 4c-6-2-8-8-6-13M0 4c-2-5-1-11 1-15M0 4c3-4 8-7 11-7M0 4c5-1 9-1 11 2" stroke="#c2332b" stroke-width="2.8"/><path d="M-6-9l-.6-3.400M1-11l.6-3.400M11-3l3-1.200M11 6l3 .8" stroke="#5f8f38" stroke-width="2.4"/><path d="M-5-4c-.6-2-.6-4 0-5M3-1c2-2 4-3 6-3" stroke="#e8685a" stroke-width="1" opacity=".8"/></g>`);
    // everlasting: papery rays round a yellow disc
    else if (s === 'spring') out.push(svg`<g transform="translate(${fx} ${fy})" stroke="none"><path d="M0-8l2 4.500l4.5-3.200l-1 5l5.2.700l-4 3l4 3l-5.2.700l1 5l-4.5-3.200l-2 4.500l-2-4.500l-4.5 3.200l1-5l-5.2-.700l4-3l-4-3l5.2-.700l-1-5l4.5 3.200z" fill=${i % 4 ? '#f39cbb' : '#fff8ea'}/><circle r="4.8" fill=${i % 4 ? '#ffd0e0' : '#fff1c4'}/><circle r="2.6" fill="#eaa820"/><circle cx="-.6" cy="-.7" r="1.2" fill="#f8d060"/></g>`);
    // wattle
    else if (s === 'winter') out.push(svg`<g transform="translate(${fx} ${fy})" stroke="none"><circle r="3.6" fill="#e6bd22"/><circle cx="-5" cy="5" r="3.2" fill="#f2d040"/><circle cx="4" cy="7" r="3" fill="#e6bd22"/><circle cx="-1" cy="-1" r="1.6" fill="#fbe98a"/><circle cx="-6" cy="4" r="1.3" fill="#fbe98a"/></g>`);
    // seed heads
    else out.push(svg`<path d="M${fx} ${fy}q2 5 0 11" stroke=${g[2]} stroke-width="4.4" stroke-dasharray="2.2 1.2"/>`);
  }
  return svg`<svg viewBox="0 0 180 90" width="180" height="90" fill="none" stroke-linecap="round">${out}</svg>`;
};

// ---- small shared drawings -------------------------------------------------------------------------------------------
/** a sickle-shaped gum leaf: blade, shaded half, midrib */
const leafArt = (c1: string, c2: string, w = 30): TemplateResult => svg`<svg viewBox="0 0 46 16" width=${w}><path d="M1 12Q12-2 45 5Q22 18 1 12z" fill=${c1}/><path d="M1 12Q22 9 45 5Q22 18 1 12z" fill=${c2} opacity=".55"/><path d="M1 12Q20 8 45 5" stroke="#f0e6b8" stroke-width=".8" fill="none" opacity=".7"/></svg>`;
const fluff = svg`<svg viewBox="-10 -10 20 26" width="15"><path d="M0 0v13M0 0l-8-3M0 0l-6-7M0 0l-2-9M0 0l3-9M0 0l7-6M0 0l8-2" stroke="#fffdf2" stroke-width=".8" stroke-linecap="round" opacity=".9"/><ellipse cy="14" rx="1.2" ry="2.2" fill="#7a5c30"/></svg>`;
const cloud = (w: number, c: string): TemplateResult => svg`<svg viewBox="0 0 200 50" width=${w} fill=${c}><ellipse cx="70" cy="34" rx="68" ry="9"/><ellipse cx="126" cy="26" rx="70" ry="10"/><ellipse cx="60" cy="22" rx="30" ry="12"/><ellipse cx="104" cy="15" rx="36" ry="14"/><ellipse cx="146" cy="19" rx="24" ry="9"/></svg>`;
const dots = (n: number, seed: number, c: string, y1: number): string => { const r = rnd(seed); return Array.from({ length: n }, () => `${(r() * 100).toFixed(1)}vw ${(r() * y1).toFixed(1)}vh 0 ${r() < 0.3 ? 1.5 : 0.7}px ${c}`).join(','); };
const STARS1 = dots(26, 11, 'rgba(255,250,228,.95)', 13), STARS2 = dots(20, 23, 'rgba(226,236,255,.9)', 15), MOTES = dots(22, 37, 'rgba(255,246,214,.75)', 100);
const FLIES: [number, number, number][] = [[4, 84, 0], [95, 87, 3.1], [47, 6, 5.3], [13, 93, 7.9], [89, 95, 1.7], [31, 10, 9.4]];
/** a top-to-bottom gradient: lit from above */
const G = (id: string, a: string, b: string): TemplateResult => svg`<linearGradient id=${id} x2="0" y2="1"><stop stop-color=${a}/><stop offset="1" stop-color=${b}/></linearGradient>`;
/** the soft shadow a creature stands on */
const SH = (cx: number, cy: number, rx: number, cls = ''): TemplateResult => svg`<ellipse class=${cls} cx=${cx} cy=${cy} rx=${rx} ry="3.4" fill="#2e1408" opacity=".3"/>`;

// ---- how the walkers keep time ---------------------------------------------------------------------------------------
/** A step cycle `k`, each step `f` of the visit long, repeated only while the walker is moving (`spans` are parts of the visit, 0 to 1). */
const gait = (k: string, f: number, spans: [number, number][], ease = 'linear', off = 0): ReturnType<typeof unsafeCSS> =>
  unsafeCSS(spans.map(([a, b]) => `${k} calc(var(--t)*${f}) ${ease} calc(var(--t)*${(a + off * f).toFixed(4)}) ${Math.round((b - a) / f)}`).join(','));
const FAR: [number, number][] = [[0, 0.48], [0.82, 1.02]], NEAR: [number, number][] = [[0, 0.16], [0.36, 1.02]], ALL: [number, number][] = [[0, 1.02]];
/** legs, body bob and anything else that keeps step, for a walker with class `c` */
const walker = (c: string, f: number, spans: [number, number][]): ReturnType<typeof unsafeCSS> => unsafeCSS(
  `.${c} .bush-la{animation:${gait('bush-swa', f, spans)}}.${c} .bush-lb{animation:${gait('bush-swb', f, spans)}}.${c} .bush-bb{animation:${gait('bush-bob', f / 2, spans, 'ease-in-out')}}.${c} .bush-ct{animation:${gait('bush-ctr', f, spans, 'ease-in-out')}}`);

// ---- the cast's shared parts -------------------------------------------------------------------------------------------
const light = (c: Ctx): boolean => c.tod !== 'night', sunny = (c: Ctx): boolean => c.tod === 'day', dusk = (c: Ctx): boolean => c.tod !== 'day';
const summer = (c: Ctx): boolean => c.month === 12 || c.month <= 2;
const L = (cls: string, d: string, c: string, w = 3.4, st = ''): TemplateResult => svg`<path class=${cls} style=${st} d=${d} stroke=${c} stroke-width=${w} stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const eye = (x: number, y: number, r = 1.6, iris = '#2a1a10'): TemplateResult => svg`<circle cx=${x} cy=${y} r=${r} fill=${iris}/><circle cx=${x} cy=${y} r=${r * 0.55} fill="#0e0907"/><circle cx=${x + r * 0.35} cy=${y - r * 0.4} r=${r * 0.28} fill="#fff" opacity=".85"/>`;
/** a black-and-tan kelpie, 64 by 42, nose to the right, trotting on diagonal pairs */
const DOG = svg`${L('bush-lb', 'M17 25L15 31L12 40', '#1c1512', 3.4)}${L('bush-la', 'M44 24L43 32L41 40', '#1c1512', 3.2)}
  <g class="bush-wag"><path d="M11 19Q3 19 1 28" stroke="#2a211d" stroke-width="3.6" stroke-linecap="round" fill="none"/><path d="M4 22Q2 25 1 28" stroke="#4a3d36" stroke-width="1.2" stroke-linecap="round" fill="none"/></g>
  <path d="M9 21Q10 13 22 14L40 13Q48 14 49 21Q47 28 39 27Q28 23 19 27Q9 28 9 21z" fill="#2a211d"/><path d="M12 16Q26 12 45 14.5" stroke="#5d4f47" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".7"/><path d="M40 26Q47 26 49 20Q50 27 43 29z" fill="#b06e38"/><path d="M19 27Q28 23 39 27Q28 26 19 27z" fill="#120d0b"/>
  ${L('bush-la', 'M19 25L22 32L21 40', '#2a211d', 3.6)}<path class="bush-lb" d="M45 24L48 32L48 40" stroke="#9a5f30" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M42 16L48 6Q52 2 55 6L61 10Q64 12 62 14.500L55 18L47 22z" fill="#2a211d"/><path d="M48 7L46.5-2L52.5 4z" fill="#1c1512"/><path d="M48.5 5L48-.5L51 3.500z" fill="#6b4a3a"/><path d="M55 12.500L62 13Q63 15 61 15.500L55 17.500z" fill="#b06e38"/><path d="M51 6.500l2-.8l1 1.300z" fill="#b06e38"/>
  ${eye(53.5, 8.8, 1.2, '#a8682c')}<ellipse cx="62.2" cy="13" rx="1.3" ry="1.1" fill="#0e0907"/><path d="M55.5 17q1 4.5 3 4.500q1.2-2 .2-5z" fill="#e8848e"/><circle class="bush-mb" cx="60" cy="16.5" r="4.4" fill="#cfe23a"/><path class="bush-mb" d="M57 14q3 2.5 0 5" stroke="#f4f7d8" stroke-width=".9" fill="none"/>`;
/** an echidna's spines: a fan of quills from the middle of its back; the far tips dark */
const SPINES = (r1: number, r2: number, step = 11.7, cy = 42): string => Array.from({ length: Math.floor(164 / step) + 1 }, (_, i) => { const a = (-172 + i * step) * Math.PI / 180, r = i % 2 ? r1 : r2; return `M${(40 + 13 * Math.cos(a)).toFixed(0)} ${(cy + 13 * Math.sin(a)).toFixed(0)}L${(40 + r * Math.cos(a)).toFixed(0)} ${(cy + r * Math.sin(a) * 0.86).toFixed(0)}`; }).join('');
/** a quokka sitting up to eat: grizzled grey-brown, buff underneath, a short broad face; in summer, ready for a swim at Rottnest */
const quokka = (swim: boolean): TemplateResult => html`<svg viewBox="0 0 92 90" width="80"><defs>${G('bush-g-quo', '#9a8468', '#62503c')}</defs>
  <path d="M60 80Q78 84 88 78" stroke="#4f4032" stroke-width="4.6" stroke-linecap="round" fill="none"/><path d="M62 79Q78 82 87 77" stroke="#7a6650" stroke-width="1.4" stroke-linecap="round" fill="none"/>
  <path d="M16 90Q10 58 30 46Q46 40 58 50Q72 64 66 90z" fill="url(#bush-g-quo)"/><path d="M26 90Q22 66 34 56Q44 52 50 60Q56 72 52 90z" fill="#d9c7a6"/><path d="M52 52Q64 62 63 82" stroke="#b39c7e" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>
  <path d="M48 76Q62 72 66 82Q68 90 60 90L44 90Q42 80 48 76z" fill="#6e5a44"/>
  ${swim ? svg`<path d="M12 70Q40 84 68 70L68 80Q40 94 12 80z" fill="#f6c62e"/><path d="M12 70Q40 84 68 70L68 73Q40 87 12 73z" fill="#fde588"/><path d="M24 76.500l0 10M40 79.500l0 10M56 76.500l0 10" stroke="#de4a32" stroke-width="5"/>` : nothing}
  <g class="bush-p bush-qh"><g class="bush-p bush-qe"><ellipse cx="22" cy="16" rx="7" ry="8" fill="#6e5a44"/><ellipse cx="22.5" cy="17" rx="4" ry="5" fill="#a8857a"/></g><g class="bush-p bush-qe" style="animation-delay:-1.3s"><ellipse cx="50" cy="13" rx="7" ry="8" fill="#7a654c"/><ellipse cx="50" cy="14" rx="4" ry="5" fill="#b08d80"/></g>
  <path d="M16 30Q16 14 36 12Q54 12 58 26L66 36Q68 42 62 44Q50 50 34 48Q16 46 16 30z" fill="url(#bush-g-quo)"/><path d="M22 20Q34 12 52 18" stroke="#b9a384" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>
  <path d="M40 38Q52 30 60 34L66 37Q68 42 62 44Q52 48 42 46Q38 42 40 38z" fill="#c9b594"/><path d="M61 33.500Q67 34 67 38.500Q64 40 61 38z" fill="#2a1e17"/><path d="M48 43.500Q56 45 63 41" stroke="#4a372a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <g class="bush-eye">${eye(48, 27, 2.4, '#2a1a10')}</g>
  ${swim ? svg`<path d="M17 26L58 24" stroke="#1f5fa5" stroke-width="3"/><ellipse cx="48" cy="27" rx="7.5" ry="6.5" fill="rgba(150,215,255,.4)" stroke="#1f5fa5" stroke-width="2.2"/><path d="M43 24q3-2 6-1" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>` : nothing}</g>
  <g class="bush-p bush-qa"><path d="M44 56Q54 56 60 50" stroke="#5f4d3a" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M38 58Q48 60 56 54" stroke="#7a654c" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M54 50Q66 36 76 44Q70 56 56 56z" fill="#7da33f"/><path d="M54 50Q66 36 76 44Q64 46 56 56z" fill="#5c8030"/><path d="M56 54Q66 46 76 44" stroke="#c7dc8a" stroke-width=".8" fill="none"/><ellipse cx="57" cy="53" rx="3.4" ry="2.8" fill="#4a3a2c"/></g></svg>`;
/** Carnaby's black cockatoo on the wing: long tail with its white panel, pale cheek, slow deep beats */
const cocky = (x: number, y: number, k: number, d: number): TemplateResult => svg`<g transform="translate(${x} ${y}) scale(${k})" opacity=${k < 0.8 ? 0.8 : 1}><path d="M4 8L-17 4.500L-18 13.500L4 11z" fill="#1f1c1a"/><path d="M-14 5.300L-5 6.600L-5 11.300L-15 12.600z" fill="#efe9d8"/><path d="M2 8Q12 2 28 3Q36 4 38 8Q32 14 18 13Q8 13 2 8z" fill="#2a2623"/><path d="M8 10q3 2 6 0M15 10.500q3 2 6 0M22 10q3 2 6 0M12 7q3 2 6 0M19 7q3 2 6 0" stroke="#5a534b" stroke-width=".7" fill="none"/>
  <path d="M33 3Q40 0 44 5Q45 9 41 11Q35 11 33 3z" fill="#2a2623"/><path d="M36 2Q38-3.5 42.5-1.500Q40 0 39.5 3z" fill="#1f1c1a"/><ellipse cx="39" cy="7.6" rx="2.3" ry="1.8" fill="#e9e2cf"/><path d="M43 4.500Q47.5 5 46 10.500Q44 9 43 8z" fill="#6a645c"/><circle cx="41.2" cy="5" r=".8" fill="#7a2e22"/>
  <g class="bush-wng" style="--d:-${d}s;--wb:.47s"><path d="M12 7Q16-18 35-23Q32-8 28 6z" fill="#221f1c"/><path d="M17-6Q24-16 33-20M15 0Q22-8 31-12M14 5Q20 0 29-3" stroke="#4f4841" stroke-width=".8" fill="none"/></g></g>`;
/** an Australian ringneck ("twenty-eight"): green, black head, yellow collar */
const ringneck = (x: number, y: number, d: number): TemplateResult => svg`<g transform="translate(${x} ${y})"><g class="bush-und" style="--d:-${d}s"><path d="M2 6L-25 3.500L-27 8L2 9.500z" fill="#2f7f5a"/><path d="M-12 5L-25 3.500L-27 8L-12 8z" fill="#2a5fa8"/><path d="M0 6Q10 0 26 1Q34 2 36 6Q30 11 18 11Q8 11 0 6z" fill="#3f9a4a"/><path d="M4 5Q14 1 28 2.5" stroke="#7fcc7a" stroke-width="1" fill="none" opacity=".8"/><path d="M12 9.500Q22 12.5 31 8Q26 11.5 18 11.500z" fill="#e6d23a"/>
  <path d="M30 1Q37-2 41 3Q42 7 38 8.500Q32 8 30 1z" fill="#1a1a1c"/><path d="M30 1.500Q33.5 5 32.5 9.500L30.5 9Q31 5 29 2.500z" fill="#f0d430"/><ellipse cx="36" cy="5.8" rx="2" ry="1.3" fill="#3a6fd0"/><path d="M39.5 1.300l2.3 1l-1.6 1z" fill="#d2362e"/><path d="M41 3.600Q43.8 4.4 42.4 7.200Q41 6.8 40.6 5.600z" fill="#cfd3d0"/><circle cx="38.3" cy="3.6" r=".7" fill="#6a3a20"/>
  <g class="bush-pw" style="--d:-${d}s"><path d="M8 5Q10-14 26-17Q26-6 22 5z" fill="#2f8a44"/><path d="M21-15Q26-17 26-8L24 0z" fill="#2a5fa8"/><path d="M11-2Q16-10 23-13" stroke="#7fcc7a" stroke-width=".8" fill="none"/></g></g></g>`;
const gumleaf = (x: number, y: number, r: number, k = 1): TemplateResult => svg`<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})"><path d="M0 0Q9 10 4 34Q-5 16 0 0z" fill="#7c9460"/><path d="M0 0Q2 16 4 34Q-5 16 0 0z" fill="#56703f"/></g>`;

const style = css`
  .bush-a { position: absolute; pointer-events: none; }
  .bush-p { transform-box: fill-box; }
  /* sky */
  .bush-sun { width: 300px; height: 300px; margin: -150px; border-radius: 50%; background: radial-gradient(circle, rgba(255,250,226,.95) 0 9%, rgba(255,236,170,.5) 12%, rgba(255,226,150,.16) 34%, transparent 62%); animation: bush-breathe 23s ease-in-out infinite alternate; }
  .bush-sun.bush-low { background: radial-gradient(circle, rgba(255,214,150,.95) 0 10%, rgba(255,150,70,.5) 14%, rgba(255,130,60,.2) 38%, transparent 66%); }
  .bush-moon { width: 240px; height: 240px; margin: -120px; border-radius: 50%; background: radial-gradient(circle, rgba(236,242,255,.22) 0 20%, transparent 60%); }
  @keyframes bush-breathe { from { transform: scale(.92); opacity: .8; } to { transform: scale(1.08); opacity: 1; } }
  .bush-cloud { left: 0; animation: bush-drift 173s linear infinite; }
  @keyframes bush-drift { from { transform: translateX(-420px); } to { transform: translateX(100vw); } }
  .bush-dap { width: 70vmax; height: 46vmax; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,243,196,.32), rgba(255,243,196,.12) 55%, transparent); animation: bush-dap 47s ease-in-out infinite alternate; }
  @keyframes bush-dap { from { transform: translate(-9vw, -4vh) scale(.9); opacity: .25; } 55% { opacity: 1; } to { transform: translate(11vw, 6vh) scale(1.12); opacity: .55; } }
  .bush-warm { inset: 0; background: linear-gradient(98deg, rgba(255,150,60,.3), rgba(255,170,90,.1) 45%, transparent 75%); animation: bush-breathe 31s ease-in-out infinite alternate; }
  .bush-motes { left: 0; top: 0; width: 2px; height: 2px; border-radius: 50%; animation: bush-motes 61s ease-in-out infinite alternate; }
  @keyframes bush-motes { from { transform: translate(-3vw, 3vh); opacity: .35; } 50% { opacity: 1; } to { transform: translate(4vw, -5vh); opacity: .5; } }
  .bush-stars { left: 0; top: 0; width: 2px; height: 2px; border-radius: 50%; animation: bush-twinkle 5.3s ease-in-out infinite alternate; }
  @keyframes bush-twinkle { from { opacity: .35; } to { opacity: 1; } }
  /* a bough of gum leaves hangs in from the top edge and stirs */
  .bush-bough { left: max(21.5%, 290px); top: -4px; transform-origin: 40% 0; animation: bush-bough 8.3s ease-in-out infinite alternate; }
  @keyframes bush-bough { from { transform: rotate(-3.5deg); } to { transform: rotate(4deg); } }
  /* breeze: a gust carries a few leaves across, then a long lull */
  .bush-gust { left: 0; top: var(--y); animation: bush-gust 43s linear infinite; animation-delay: var(--d); }
  @keyframes bush-gust { from { transform: translate(-60px, 0) rotate(0deg); } 9% { transform: translate(30vw, 3vh) rotate(250deg); } 17% { transform: translate(64vw, -2vh) rotate(430deg); } 27%, to { transform: translate(104vw, 4vh) rotate(700deg); } }
  .bush-fluff { left: 0; top: var(--y); animation: bush-fluff 67s linear infinite; animation-delay: var(--d); }
  @keyframes bush-fluff { from { transform: translate(-30px, 2vh) rotate(-12deg); } 25% { transform: translate(26vw, -2vh) rotate(14deg); } 50% { transform: translate(52vw, 1.5vh) rotate(-10deg); } 75% { transform: translate(78vw, -1.5vh) rotate(12deg); } to { transform: translate(104vw, 1vh) rotate(-8deg); } }
  /* ground */
  .bush-tus { bottom: -8px; transform-origin: 50% 100%; animation: bush-sway 6.1s ease-in-out infinite alternate; }
  @keyframes bush-sway { from { transform: skewX(-5deg); } to { transform: skewX(6deg); } }
  .bush-tus.bush-r { right: 0; animation-name: bush-swayr; animation-duration: 7.3s; }
  @keyframes bush-swayr { from { transform: scaleX(-1) skewX(4deg); } to { transform: scaleX(-1) skewX(-6deg); } }
  .bush-tus.bush-bk { animation-duration: 9.7s; animation-delay: -3s; opacity: .8; }
  .bush-mill { right: 6px; bottom: 14px; opacity: .6; }
  .bush-vane { transform-box: fill-box; transform-origin: 50% 50%; animation: bush-spin 19s linear infinite; }
  @keyframes bush-spin { to { transform: rotate(360deg); } }
  .bush-fire { left: 6px; bottom: 0; }
  .bush-glow { transform-box: fill-box; transform-origin: 50% 60%; animation: bush-breathe 3.7s ease-in-out infinite alternate; }
  .bush-flame { transform-box: fill-box; transform-origin: 50% 100%; animation: bush-flame 1.3s ease-in-out infinite alternate; }
  .bush-flame2 { transform-box: fill-box; transform-origin: 50% 100%; animation: bush-flame .9s ease-in-out -.4s infinite alternate-reverse; }
  @keyframes bush-flame { from { transform: scale(.94, .86) skewX(-4deg); } to { transform: scale(1.04, 1.1) skewX(5deg); } }
  .bush-spark { transform-box: fill-box; animation: bush-spark 4.1s ease-out infinite; }
  @keyframes bush-spark { from { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; } to { transform: translate(9px, -46px); opacity: 0; } }
  .bush-fly { left: var(--x); top: var(--y); width: 5px; height: 5px; border-radius: 50%; background: #fff3a8; box-shadow: 0 0 9px 3px rgba(255,238,150,.7); animation: bush-fly 11.3s ease-in-out infinite; animation-delay: var(--d); }
  @keyframes bush-fly { from, to { transform: translate(0, 0); opacity: .05; } 22% { transform: translate(18px, -12px); opacity: 1; } 45% { transform: translate(34px, 4px); opacity: .1; } 70% { transform: translate(12px, 14px); opacity: .95; } }
  .bush-owl { right: 6px; bottom: 84px; animation: bush-owl 53s linear infinite; }
  @keyframes bush-owl { from, 58%, to { opacity: 0; } 62%, 94% { opacity: 1; } }
  .bush-lid { transform-box: fill-box; transform-origin: 50% 0; animation: bush-blink 5.9s linear infinite; }
  @keyframes bush-blink { from, 88%, to { transform: scaleY(0); } 92%, 95% { transform: scaleY(1); } }

  /* journeys along the ground: ease into the stop, ease away from it */
  .bush-far, .bush-near { animation: bush-far var(--t) linear both; }
  .bush-near { animation-name: bush-near; }
  [data-flip].bush-far, [data-flip].bush-near, [data-flip].bush-dig, [data-flip].bush-wrn { left: auto; right: 0; --bd: -1; }
  @keyframes bush-far { from { transform: translateX(calc(var(--bd, 1) * -190px)); animation-timing-function: cubic-bezier(.3,.4,.5,1); } 48% { transform: translateX(calc(var(--bd, 1) * (100vw - 180px))); } 82% { transform: translateX(calc(var(--bd, 1) * (100vw - 180px))); animation-timing-function: cubic-bezier(.5,0,.8,.7); } to { transform: translateX(calc(var(--bd, 1) * (100vw + 320px))); } }
  @keyframes bush-near { from { transform: translateX(calc(var(--bd, 1) * -150px)); animation-timing-function: cubic-bezier(.3,.4,.5,1); } 16% { transform: translateX(calc(var(--bd, 1) * 58px)); } 36% { transform: translateX(calc(var(--bd, 1) * 58px)); animation-timing-function: cubic-bezier(.4,0,.7,.7); } to { transform: translateX(calc(var(--bd, 1) * (100vw + 30px))); } }
  /* a step: legs swing from the hip, the body rises between footfalls, tails and heads swing against it */
  .bush-la, .bush-lb { transform-box: fill-box; transform-origin: 50% 4%; }
  .bush-bb, .bush-ct { transform-box: fill-box; }
  @keyframes bush-swa { from, to { transform: rotate(0deg); } 25% { transform: rotate(var(--sw, 26deg)); } 75% { transform: rotate(calc(var(--sw, 26deg) * -1)); } }
  @keyframes bush-swb { from, to { transform: rotate(0deg); } 25% { transform: rotate(calc(var(--sw, 26deg) * -1)); } 75% { transform: rotate(var(--sw, 26deg)); } }
  @keyframes bush-bob { from, to { transform: translateY(0); } 50% { transform: translateY(var(--bob, -2.5px)); } }
  @keyframes bush-ctr { from, to { transform: rotate(0deg); } 25% { transform: rotate(var(--ct, 5deg)); } 75% { transform: rotate(calc(var(--ct, 5deg) * -1)); } }
  ${walker('bush-gF', 0.02, FAR)} ${walker('bush-gN', 0.015, NEAR)} ${walker('bush-gD', 0.025, [[0, 0.3]])} ${walker('bush-gA', 0.02, ALL)}
  .bush-eye { transform-box: fill-box; transform-origin: 50% 50%; animation: bush-wink 4.3s linear infinite; }
  @keyframes bush-wink { from, 90%, to { transform: scaleY(1); } 94% { transform: scaleY(.1); } }

  /* kangaroo: crouch, spring, the tail swinging up against the pitch of the body, the feet trailing then reaching */
  .bush-roo { transform-origin: 40% 94%; animation: ${gait('bush-hop', 0.04, FAR)}; }
  @keyframes bush-hop { from, to { transform: translateY(0) rotate(0deg); } 12% { transform: translateY(2.5px) rotate(-3deg); } 50% { transform: translateY(-25px) rotate(9deg); animation-timing-function: ease-in; } 88% { transform: translateY(0) rotate(3deg); } }
  .bush-rtl { transform-origin: 96% 14%; animation: ${gait('bush-rtl', 0.04, FAR, 'ease-in-out')}; }
  @keyframes bush-rtl { from, to { transform: rotate(0deg); } 14% { transform: rotate(8deg); } 55% { transform: rotate(-19deg); } 90% { transform: rotate(7deg); } }
  .bush-rleg { transform-origin: 30% 14%; animation: ${gait('bush-rleg', 0.04, FAR, 'ease-in-out')}; }
  @keyframes bush-rleg { from, to { transform: rotate(0deg); } 12% { transform: rotate(-5deg); } 36% { transform: rotate(40deg); } 78% { transform: rotate(-22deg); } }
  .bush-rshd { transform-box: fill-box; transform-origin: 50% 50%; animation: ${gait('bush-rshd', 0.04, FAR)}; }
  @keyframes bush-rshd { from, to { transform: scale(1); opacity: .3; } 50% { transform: scale(.7); opacity: .16; } }
  .bush-rear { transform-origin: 50% 100%; animation: bush-rtw var(--t) ease-in-out both, ${gait('bush-rlag', 0.04, FAR, 'ease-in-out')}; }
  @keyframes bush-rlag { from, to { transform: rotate(0deg); } 30% { transform: rotate(-16deg); } 75% { transform: rotate(7deg); } }
  @keyframes bush-rtw { from, 51%, 60%, 74%, to { transform: rotate(0deg); } 53%, 76% { transform: rotate(-14deg); } 55%, 78% { transform: rotate(8deg); } }
  .bush-rarm { transform-origin: 14% 10%; animation: bush-rarm var(--t) ease-in-out both; }
  @keyframes bush-rarm { from, 50%, 72%, to { transform: rotate(0deg); } 53%, 57%, 61%, 65%, 69% { transform: rotate(-112deg); } 55%, 59%, 63%, 67% { transform: rotate(-92deg); } }
  .bush-rhead { transform-origin: 14% 92%; animation: bush-rhead var(--t) ease-in-out both; }
  @keyframes bush-rhead { from, 49%, 73%, to { transform: rotate(0deg); } 53%, 69% { transform: rotate(13deg); } 80% { transform: rotate(-5deg); } }
  .bush-joey { animation: bush-joey var(--t) ease-in-out both; }
  @keyframes bush-joey { from, 57%, 81%, to { transform: translate(-14px, 4px); } 61%, 78% { transform: translate(0, 0); } 66%, 72% { transform: translate(0, 0) rotate(10deg); } 69% { transform: translate(0, 0) rotate(-8deg); } }
  /* emu */
  .bush-epk { transform-origin: 8% 100%; animation: bush-epk var(--t) ease-in-out both; }
  @keyframes bush-epk { from, 50%, 60%, 70%, 79%, to { transform: rotate(0deg); } 55%, 65% { transform: rotate(98deg); } 74%, 77% { transform: rotate(-14deg); } }
  /* bobtail */
  .bush-jaw { transform-origin: 0 100%; animation: bush-jaw var(--t) ease-in-out both; }
  @keyframes bush-jaw { from, 19%, 33%, to { transform: rotate(0deg); } 21%, 31% { transform: rotate(-22deg); } }
  .bush-tng { transform-origin: 0 50%; animation: bush-tng var(--t) ease-in-out both; }
  @keyframes bush-tng { from, 21%, 32%, to { transform: scaleX(0); } 23%, 25%, 27%, 30% { transform: scaleX(1); } 24%, 26%, 28.5% { transform: scaleX(.6) rotate(8deg); } }
  .bush-brear { transform-origin: 30% 100%; animation: bush-brear var(--t) ease-in-out both; }
  @keyframes bush-brear { from, 18%, 34%, to { transform: rotate(0deg); } 21%, 31% { transform: rotate(-7deg); } }
  /* echidna: trundle in, tuck into a ball, dig straight down */
  .bush-dig { animation: bush-dig var(--t) linear both; }
  @keyframes bush-dig { from { transform: translate(calc(var(--bd, 1) * -120px), 0); animation-timing-function: ease-out; } 30%, 64% { transform: translate(calc(var(--bd, 1) * 66px), 0); } 70% { transform: translate(calc(var(--bd, 1) * 66px), 8px) rotate(-5deg); } 76% { transform: translate(calc(var(--bd, 1) * 66px), 18px) rotate(5deg); } 82% { transform: translate(calc(var(--bd, 1) * 66px), 29px) rotate(-5deg); } 88% { transform: translate(calc(var(--bd, 1) * 66px), 41px) rotate(5deg); } to { transform: translate(calc(var(--bd, 1) * 66px), 72px); } }
  .bush-tuck { transform-origin: 0 100%; animation: bush-tuck var(--t) ease-in-out both; }
  @keyframes bush-tuck { from, 34%, 54%, 59% { transform: scale(1); } 40%, 50%, 62%, to { transform: scale(0); } }
  .bush-eball { transform-origin: 50% 100%; animation: bush-rnd var(--t) ease-in-out both; }
  @keyframes bush-rnd { from, 34%, 54%, 59% { transform: scale(1); } 40%, 50%, 62%, to { transform: scale(.84, 1.14); } 44%, 48% { transform: scale(.84, 1.14) rotate(-4deg); } 46% { transform: scale(.84, 1.14) rotate(4deg); } }
  .bush-clod { animation: bush-clod calc(var(--t) * .06) ease-out calc(var(--t) * .66) 5 both; }
  @keyframes bush-clod { from { transform: translate(0, 0); opacity: 0; } 20% { opacity: 1; } to { transform: translate(var(--cx, 22px), -26px); opacity: 0; } }
  /* quokka and the bush band rise out of the grass in a corner */
  .bush-pop { top: auto; bottom: 0; left: 70px; animation: bush-pop var(--t) cubic-bezier(.3,1.2,.5,1) both; } [data-flip].bush-pop { left: auto; right: 70px; }
  @keyframes bush-pop { from, to { transform: translateY(105%); } 10%, 90% { transform: translateY(6px); } }
  .bush-qh { transform-origin: 40% 95%; animation: bush-qh var(--t) ease-in-out both; }
  @keyframes bush-qh { from, 14%, 30%, 80%, to { transform: rotate(0deg); } 17%, 21%, 25% { transform: rotate(-9deg); } 19%, 23% { transform: rotate(-5deg); } 40%, 46%, 52%, 58%, 64% { transform: rotate(7deg); } 43%, 49%, 55%, 61% { transform: rotate(4deg); } 72% { transform: rotate(-8deg); } }
  .bush-qa { transform-origin: 10% 20%; animation: bush-qa var(--t) ease-in-out both; }
  @keyframes bush-qa { from, 32%, 68%, to { transform: rotate(0deg); } 38%, 64% { transform: rotate(-26deg) translateY(-4px); } }
  .bush-qe { transform-origin: 50% 100%; animation: bush-qe 3.1s ease-in-out infinite; }
  @keyframes bush-qe { from, 80%, to { transform: rotate(0deg); } 86% { transform: rotate(-18deg); } 92% { transform: rotate(8deg); } }
  /* frilled lizard */
  .bush-frl { transform-origin: 30% 62%; animation: bush-frl var(--t) cubic-bezier(.3,1.6,.5,1) both; }
  @keyframes bush-frl { from, 50% { transform: scale(.22); } 54%, 62%, 70%, to { transform: scale(1); } 58%, 66% { transform: scale(1.1) rotate(-5deg); } }
  .bush-fj { transform-origin: 0 0; animation: bush-fj var(--t) ease-in-out both; }
  @keyframes bush-fj { from, 51% { transform: rotate(0deg); } 54%, to { transform: rotate(24deg); } }
  .bush-frr { transform-origin: 40% 80%; animation: bush-frr var(--t) ease-in-out both; }
  @keyframes bush-frr { from, 47%, 82%, to { transform: rotate(0deg); } 52%, 78% { transform: rotate(-14deg); } }
  /* thorny devil: the rocking walk, then three ants */
  .bush-rock { animation: bush-rock var(--t) ease-in-out both; }
  @keyframes bush-rock { from, 17%, 35%, to { transform: translateX(0); } 18.5%, 21.5%, 25%, 29%, 33% { transform: translateX(-2.5px); } 20%, 23%, 27%, 31% { transform: translateX(2.5px); } }
  .bush-dtg { transform-origin: 0 50%; animation: bush-dtg var(--t) linear both; }
  @keyframes bush-dtg { from, 22.6%, 23.8%, 26.6%, 27.8%, 30.6%, 31.8%, to { transform: scaleX(0); } 23.2%, 27.2%, 31.2% { transform: scaleX(1); } }
  .bush-ant { animation: bush-ant var(--t) linear both; animation-delay: var(--d, 0s); }
  @keyframes bush-ant { from, 15% { opacity: 0; } 18%, 23% { opacity: 1; } 23.4%, to { opacity: 0; } }
  /* ute and road train */
  .bush-jig { animation: bush-jig .43s ease-in-out infinite alternate; }
  @keyframes bush-jig { from { transform: translateY(0); } to { transform: translateY(-1.4px); } }
  .bush-dst { transform-box: fill-box; transform-origin: 100% 100%; animation: bush-dst 1.3s ease-out infinite; animation-delay: var(--d, 0s); }
  @keyframes bush-dst { from { transform: scale(.3); opacity: .9; } to { transform: scale(1.2) translate(-10px, -4px); opacity: 0; } }
  .bush-whl { transform-box: fill-box; transform-origin: 50% 50%; animation: bush-spin .7s linear infinite; }
  .bush-flp { transform-box: fill-box; transform-origin: 100% 100%; animation: bush-flp .27s ease-in-out infinite alternate; }
  @keyframes bush-flp { from { transform: rotate(-8deg); } to { transform: rotate(14deg); } }
  /* scooter and dog */
  .bush-kick { transform-box: fill-box; transform-origin: 90% 2%; animation: ${gait('bush-kick', 0.06, FAR, 'ease-in-out')}; }
  @keyframes bush-kick { from, to { transform: rotate(-6deg); } 45% { transform: rotate(38deg); } }
  .bush-kbd { transform-origin: 30% 100%; animation: ${gait('bush-kbd', 0.06, FAR, 'ease-in-out')}; }
  @keyframes bush-kbd { from, to { transform: rotate(0deg); } 45% { transform: rotate(5deg); } }
  .bush-dj { animation: bush-dj var(--t) ease-out both; }
  @keyframes bush-dj { from, 52%, 60%, 68%, 76%, to { transform: translateY(0); } 56%, 64%, 72% { transform: translateY(-11px) rotate(-14deg); } }
  .bush-wag { transform-box: fill-box; transform-origin: 100% 20%; animation: bush-wag .31s ease-in-out infinite alternate; }
  @keyframes bush-wag { from { transform: rotate(-20deg); } to { transform: rotate(22deg); } }
  .bush-mb { opacity: 0; }
  /* cyclist and magpie */
  .bush-crk { transform-box: fill-box; transform-origin: 50% 50%; animation: ${gait('bush-spin', 0.04, FAR)}; }
  .bush-wsp { transform-box: fill-box; transform-origin: 50% 50%; animation: ${gait('bush-spin', 0.04, FAR)}; }
  .bush-duck { transform-origin: 0 100%; animation: bush-duck var(--t) ease-in-out both; }
  @keyframes bush-duck { from, 50%, 62%, 74%, to { transform: rotate(0deg); } 55%, 58%, 67%, 70% { transform: rotate(26deg); } }
  .bush-mag { position: absolute; left: 14px; top: -14px; animation: bush-mag var(--t) ease-in-out both; }
  @keyframes bush-mag { from, 46% { translate: calc(var(--bd, 1) * -46px) -34px; rotate: 0deg; } 56% { translate: calc(var(--bd, 1) * 34px) 10px; rotate: calc(var(--bd, 1) * 26deg); } 62% { translate: calc(var(--bd, 1) * 74px) -40px; rotate: calc(var(--bd, 1) * -22deg); } 63% { translate: calc(var(--bd, 1) * -50px) -44px; rotate: 0deg; } 68.5% { translate: calc(var(--bd, 1) * 34px) 10px; rotate: calc(var(--bd, 1) * 26deg); } 76% { translate: calc(var(--bd, 1) * 64px) -36px; rotate: calc(var(--bd, 1) * -14deg); } 82%, to { translate: calc(var(--bd, 1) * -40px) -30px; rotate: 0deg; } }
  .bush-wng { transform-box: fill-box; transform-origin: 50% 100%; animation: bush-wng var(--wb, .34s) ease-in-out infinite alternate; animation-delay: var(--d, 0s); }
  @keyframes bush-wng { from { transform: scaleY(1); } to { transform: scaleY(-.75); } }
  /* tennis ball and dog */
  .bush-tb { position: absolute; left: 104px; bottom: 2px; animation: ${gait('bush-bnc', 0.04, [[0, 0.52]], 'ease-out')}, bush-lift var(--t) ease-in-out both; }
  [data-flip] .bush-tb { left: auto; right: 104px; }
  @keyframes bush-bnc { from, to { translate: 0 0; } 50% { translate: 0 -40px; } }
  @keyframes bush-lift { from, 54.5% { transform: translate(0, 0); } 57.5%, to { transform: translate(calc(var(--bd, 1) * 4px), -17px); } }
  .bush-dogb { animation: bush-pnc var(--t) ease-in-out both; }
  @keyframes bush-pnc { from, 52% { translate: 0 0; } 55% { translate: calc(var(--bd, 1) * 22px) -14px; } 57.5%, to { translate: calc(var(--bd, 1) * 46px) 0; } }
  /* meat ants on parade */
  .bush-ma { animation: bush-ma .46s steps(2, jump-none) infinite alternate; } .bush-mz { animation: bush-ma .46s steps(2, jump-none) -.46s infinite alternate; }
  @keyframes bush-ma { from { transform: translateY(0); } to { transform: translateY(-2px); } }
  .bush-late { animation: bush-late 7.3s ease-in-out infinite; }
  @keyframes bush-late { from, to { transform: translateX(0); } 45% { transform: translateX(-16px); } 55% { transform: translateX(-16px) rotate(-8deg); } 70% { transform: translateX(3px); } }
  /* things that come down from the top edge: the kookaburra's branch, the possum, the frogmouth */
  .bush-perch { left: calc(15% + var(--x) * .72); top: 0; animation: bush-perch var(--t) ease-in-out both; }
  @keyframes bush-perch { from, to { transform: translateY(-105%); } 7%, 93% { transform: translateY(0); } }
  .bush-kb { animation: bush-kb var(--t) ease-out both; }
  @keyframes bush-kb { from, 8% { transform: translate(-130px, -80px); } 20% { transform: translate(0, 0); } 22% { transform: translate(0, 2px); } 24%, 79% { transform: translate(0, 0); } 81% { transform: translate(0, 3px); animation-timing-function: ease-in; } 93%, to { transform: translate(160px, -100px); } }
  .bush-kw { animation: bush-kw var(--t) linear both; }
  @keyframes bush-kw { from, 19%, 82%, to { opacity: 1; } 21%, 81% { opacity: 0; } }
  .bush-kh { transform-origin: 20% 80%; animation: bush-kh var(--t) ease-in-out both; }
  @keyframes bush-kh { from, 28%, 34%, 68%, to { transform: rotate(0deg); } 31% { transform: rotate(14deg); } 40%, 44%, 48%, 52%, 56%, 60% { transform: rotate(-54deg); } 42%, 46%, 50%, 54%, 58% { transform: rotate(-42deg); } }
  .bush-kj { transform-origin: 0 0; animation: bush-kj var(--t) ease-in-out both; }
  @keyframes bush-kj { from, 38%, 62%, to { transform: rotate(0deg); } 40%, 44%, 48%, 52%, 56%, 60% { transform: rotate(17deg); } 42%, 46%, 50%, 54%, 58% { transform: rotate(5deg); } }
  .bush-kt { transform-origin: 80% 0; animation: bush-kt var(--t) ease-in-out both; }
  @keyframes bush-kt { from, 20%, 38%, 62%, to { transform: rotate(0deg); } 23% { transform: rotate(-16deg); } 26% { transform: rotate(6deg); } 40%, 44%, 48%, 52%, 56%, 60% { transform: rotate(-12deg); } 42%, 46%, 50%, 54%, 58% { transform: rotate(-3deg); } }
  .bush-hang { left: calc(15% + var(--x) * .72); top: 0; animation: bush-hang var(--t) ease-in-out both; }
  @keyframes bush-hang { from { transform: translateY(-105%); } 10% { transform: translateY(0); } 86% { transform: translateY(0); animation-timing-function: ease-in; } 90%, to { transform: translateY(-105%); } }
  .bush-tsw { transform-origin: 50% 0; animation: bush-tsw 2.9s ease-in-out infinite alternate; }
  @keyframes bush-tsw { from { transform: rotate(-8deg); } to { transform: rotate(9deg); } }
  .bush-ttip { transform-origin: 80% 0; animation: bush-tsw 2.9s ease-in-out -.7s infinite alternate; }
  .bush-pk { animation: bush-pk var(--t) ease-in-out both; }
  @keyframes bush-pk { from, 30%, 78%, to { transform: translateY(-52px); } 38%, 72% { transform: translateY(0); } 50% { transform: translateY(0) rotate(7deg); } 60% { transform: translateY(0) rotate(-5deg); } }
  .bush-fe1, .bush-fe2 { transform-origin: 50% 50%; animation: bush-fe1 var(--t) ease-in-out both; } .bush-fe2 { animation-name: bush-fe2; }
  @keyframes bush-fe1 { from, 20%, 44%, 56%, 76%, to { transform: scaleY(1); } 24%, 40%, 60%, 72% { transform: scaleY(0); } }
  @keyframes bush-fe2 { from, 56%, 76%, to { transform: scaleY(1); } 60%, 72% { transform: scaleY(0); } }
  .bush-fp { animation: bush-fp var(--t) ease-in-out both; }
  @keyframes bush-fp { from, 26%, 38%, 60%, to { transform: translateX(0); } 29%, 31% { transform: translateX(-1.6px); } 34%, 36% { transform: translateX(1.6px); } 64%, 70% { transform: translateX(1.2px); } }
  .bush-fst { transform-origin: 50% 100%; animation: bush-fst var(--t) ease-in-out both; }
  @keyframes bush-fst { from, 54%, 80%, to { transform: scaleY(1); } 59%, 74% { transform: scaleY(1.07) rotate(-3deg); } }
  /* willy-willy */
  .bush-ww1 { animation: bush-ww 1.3s ease-in-out infinite alternate; } .bush-ww2 { animation: bush-ww 1.7s ease-in-out -1s infinite alternate-reverse; }
  @keyframes bush-ww { from { transform: translateX(-5px); } to { transform: translateX(5px); } }
  .bush-wl { animation: bush-wl 1.1s ease-in-out infinite alternate; animation-delay: var(--d); }
  @keyframes bush-wl { from { transform: translateX(-22px) rotate(-40deg); } to { transform: translateX(22px) rotate(200deg); } }
  /* small fliers in front of the page */
  .bush-flap { transform-box: fill-box; transform-origin: center; animation: bush-flap .26s ease-in-out infinite alternate; }
  @keyframes bush-flap { from { transform: scaleX(1); } to { transform: scaleX(.25); } }
  .bush-hum { transform-box: fill-box; transform-origin: 30% 100%; animation: bush-hum .09s linear infinite alternate; }
  @keyframes bush-hum { from { transform: rotate(-16deg); opacity: .8; } to { transform: rotate(22deg); opacity: .5; } }
  .bush-bee { animation: bush-bee var(--t) linear both; } [data-flip].bush-bee { animation-name: bush-beeb; }
  @keyframes bush-bee { from { transform: translate(-40px, 5vh); } 22% { transform: translate(24vw, 1vh); } 36% { transform: translate(40vw, 4vh); } 42% { transform: translate(45vw, 0); } 47% { transform: translate(41vw, -4vh); } 52% { transform: translate(37vw, 0); } 58% { transform: translate(42vw, 4vh); } 76% { transform: translate(70vw, 0); } to { transform: translate(calc(100vw + 30px), 4vh); } }
  @keyframes bush-beeb { from { transform: translate(calc(100vw + 30px), 5vh); } 22% { transform: translate(76vw, 1vh); } 36% { transform: translate(60vw, 4vh); } 42% { transform: translate(55vw, 0); } 47% { transform: translate(59vw, -4vh); } 52% { transform: translate(63vw, 0); } 58% { transform: translate(58vw, 4vh); } 76% { transform: translate(30vw, 0); } to { transform: translate(-40px, 4vh); } }
  /* the band */
  .bush-sw1 { transform-origin: 50% 100%; animation: bush-nod 1.3s ease-in-out infinite alternate; } .bush-sw2 { transform-origin: 50% 100%; animation: bush-nod 1.1s ease-in-out -.4s infinite alternate-reverse; }
  @keyframes bush-nod { from { transform: rotate(-5deg); } to { transform: rotate(6deg); } }
  .bush-thr { transform-origin: 50% 50%; animation: bush-thr .65s ease-in-out infinite alternate; }
  @keyframes bush-thr { from { transform: scale(.7); } to { transform: scale(1.15); } }
  .bush-nt { animation: bush-nt 2.3s ease-out infinite; animation-delay: var(--d); }
  @keyframes bush-nt { from { transform: translate(0, 8px) scale(.5); opacity: 0; } 25% { opacity: 1; } to { transform: translate(8px, -26px) scale(1); opacity: 0; } }
  /* wedge-tailed eagle: one wide slow circle, far up */
  .bush-soar { animation: bush-soar var(--t) linear both; }
  @keyframes bush-soar { from { transform: translate(-100px, 7vh) scale(.95); } 20% { transform: translate(24vw, 1vh) scale(.75); } 34% { transform: translate(44vw, -1vh) scale(.62); } 44% { transform: translate(54vw, 1.5vh) scale(.72); } 53% { transform: translate(53vw, 5.5vh) scale(.95); } 62% { transform: translate(44vw, 6vh) scale(1); } 70% { transform: translate(39vw, 2.5vh) scale(.82); } 78% { transform: translate(46vw, -.5vh) scale(.66); } to { transform: translate(calc(100vw + 60px), -3vh) scale(.45); } }
  .bush-bank { animation: bush-bank var(--t) ease-in-out both; }
  @keyframes bush-bank { from { rotate: -12deg; } 30% { rotate: -4deg; } 40% { rotate: 20deg; } 49% { rotate: 80deg; } 58% { rotate: 170deg; } 66% { rotate: 225deg; } 74% { rotate: 300deg; } 82% { rotate: 350deg; } to { rotate: 354deg; } }
  .bush-tipf { transform-box: fill-box; transform-origin: 50% 50%; animation: bush-tipf 3.7s ease-in-out infinite alternate; }
  @keyframes bush-tipf { from { transform: scaleX(1); } to { transform: scaleX(.93); } }
  /* a far mob of kangaroos */
  .bush-mh { transform-box: fill-box; transform-origin: 40% 100%; animation: bush-mh .62s ease-in-out infinite; animation-delay: var(--d); }
  @keyframes bush-mh { from, to { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-9px) rotate(7deg); } }
  /* fairy-wren: hops, cocks its tail, pecks, hops, and is gone */
  .bush-wrn { animation: bush-wrn var(--t) linear both; }
  @keyframes bush-wrn { from { transform: translate(calc(var(--bd, 1) * -40px), 0); } 4% { transform: translate(calc(var(--bd, 1) * -8px), -14px); } 8%, 14% { transform: translate(calc(var(--bd, 1) * 24px), 0); } 17% { transform: translate(calc(var(--bd, 1) * 40px), -12px); } 20%, 34% { transform: translate(calc(var(--bd, 1) * 56px), 0); } 37% { transform: translate(calc(var(--bd, 1) * 70px), -12px); } 40%, 62% { transform: translate(calc(var(--bd, 1) * 84px), 0); } 65% { transform: translate(calc(var(--bd, 1) * 96px), -11px); } 68%, 80% { transform: translate(calc(var(--bd, 1) * 108px), 0); animation-timing-function: ease-in; } to { transform: translate(calc(var(--bd, 1) * 330px), -190px); } }
  .bush-wtl { transform-origin: 100% 100%; animation: bush-wtl 1.9s ease-in-out infinite; }
  @keyframes bush-wtl { from, 60%, to { transform: rotate(0deg); } 70% { transform: rotate(22deg); } 80% { transform: rotate(-10deg); } }
  .bush-wpk { transform-origin: 30% 80%; animation: bush-wpk var(--t) ease-in-out both; }
  @keyframes bush-wpk { from, 22%, 32%, 42%, 60%, to { transform: rotate(0deg); } 24%, 28%, 44%, 48%, 52% { transform: rotate(48deg); } 26%, 30%, 46%, 50% { transform: rotate(30deg); } 56% { transform: rotate(-12deg); } 74% { transform: rotate(-14deg); } }
  .bush-wfl { animation: bush-wfl var(--t) linear both; }
  .bush-wsh { animation: bush-wfl var(--t) linear both reverse; }
  @keyframes bush-wfl { from, 79% { opacity: 0; } 81%, to { opacity: 1; } }
  /* boobook: three slow beats and a long glide */
  .bush-owg { transform-box: fill-box; transform-origin: 50% 100%; animation: bush-owg 2.9s ease-in-out infinite; }
  @keyframes bush-owg { from, 48%, to { transform: scaleY(1); } 8%, 24%, 40% { transform: scaleY(-.55); } 16%, 32% { transform: scaleY(1); } }
  .bush-owb { animation: bush-owb 2.9s ease-in-out infinite; }
  @keyframes bush-owb { from, to { translate: 0 0; } 44% { translate: 0 -9px; } }
  /* ringneck parrots: a burst of beats, then wings shut and a dip */
  .bush-und { animation: bush-und 1.05s ease-in-out infinite; animation-delay: var(--d, 0s); }
  @keyframes bush-und { from, to { transform: translateY(8px); } 50% { transform: translateY(-8px); } }
  .bush-pw { transform-box: fill-box; transform-origin: 50% 100%; animation: bush-pw 1.05s linear infinite; animation-delay: var(--d, 0s); }
  @keyframes bush-pw { from, 10%, 22%, 34%, 46% { transform: scaleY(1); opacity: 1; } 4%, 16%, 28%, 40% { transform: scaleY(-.7); opacity: 1; } 52%, 96% { transform: scaleY(.1); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
`;

const sky = (c: Ctx): TemplateResult => {
  // facing north, as you do for the sun in Perth: it rises on the right and sets on the left
  const f = Math.min(1, Math.max(0, (c.mins - 360) / 720)), sx = c.tod === 'eve' ? 7 : 88 - 76 * f, sy = c.tod === 'eve' ? 8 + Math.min(6, (c.mins - 1080) / 30) : 9.5 - 7 * Math.sin(Math.PI * f);
  const cc = c.tod === 'night' ? 'rgba(206,216,236,.16)' : c.tod === 'eve' ? 'rgba(255,208,170,.42)' : 'rgba(255,255,255,.44)';
  return html`
    ${c.tod === 'night' ? html`<i class="bush-a bush-moon" style="left:49%;top:5.5%"><svg viewBox="0 0 40 40" width="40" style="margin:100px"><circle cx="20" cy="20" r="17" fill="#f3f1e2"/><path d="M20 3a17 17 0 1 0 0 34a21 21 0 0 1 0-34z" fill="#c9cbc4" opacity=".5"/><circle cx="25" cy="13" r="3.2" fill="#d9d7c8"/><circle cx="29" cy="24" r="2.2" fill="#d9d7c8"/><circle cx="22" cy="28" r="1.6" fill="#dddbcd"/></svg></i>`
      : html`<i class="bush-a bush-sun ${c.tod === 'eve' ? 'bush-low' : ''}" style="left:${sx.toFixed(1)}%;top:${sy.toFixed(1)}%"></i>`}
    <i class="bush-a bush-cloud" style="top:-1%;animation-delay:-58s">${cloud(300, cc)}</i>
    <i class="bush-a bush-cloud" style="top:4.5%;animation-duration:251s;animation-delay:-171s;opacity:.75">${cloud(190, cc)}</i>`;
};
/** a spray of gum leaves from the top edge; red flowering-gum blossom in summer, gumnuts the rest of the year */
const bough = (m: number, night: boolean): TemplateResult => {
  const a = night ? '#4f6248' : '#7c9460', b = night ? '#34452f' : '#56703f', lf = (x: number, y: number, r: number, k = 1): TemplateResult => svg`<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})"><path d="M0 0Q9 10 4 34Q-5 16 0 0z" fill=${a}/><path d="M0 0Q2 16 4 34Q-5 16 0 0z" fill=${b}/></g>`;
  return svg`<svg class="bush-a bush-bough" viewBox="0 0 96 84" width="92"><path d="M40-2Q38 16 52 26Q66 34 82 32M46 20Q34 30 18 30" stroke="#6b5340" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M40-2Q38 16 52 26" stroke="#8d745c" stroke-width="1" fill="none"/>
    ${lf(18, 30, 14)}${lf(28, 29, -8, 0.9)}${lf(40, 24, 6, 1.1)}${lf(54, 27, -14)}${lf(66, 31, 4, 1.15)}${lf(80, 32, -20, 0.9)}${lf(84, 32, 18, 0.8)}
    ${m === 12 || m <= 2 ? svg`<g fill="#d8362c"><circle cx="34" cy="34" r="5"/><circle cx="60" cy="36" r="5.5"/><circle cx="46" cy="30" r="4"/></g><g fill="#f4d04a"><circle cx="34" cy="34" r="1.5"/><circle cx="60" cy="36" r="1.7"/><circle cx="46" cy="30" r="1.2"/></g>` : svg`<g fill="#7a6048"><path d="M32 30l-3 7h6zM58 31l-3 8h6.500zM47 26l-2 6h5z"/></g><g fill="#4f3c2c"><ellipse cx="32" cy="37" rx="3" ry="1.2"/><ellipse cx="58.2" cy="39" rx="3.2" ry="1.3"/><ellipse cx="47.5" cy="32" rx="2.5" ry="1"/></g>`}</svg>`;
};
const MILL = svg`<svg class="bush-a bush-mill" viewBox="0 0 54 92" width="44"><g stroke="#5e4c40" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M27 24L16 91M27 24L38 91M24 44h6M21.5 60h11M19 76h16M24 44l8.5 16M30 44l-8.5 16M21.5 60l13.5 16M32.5 60l-13.5 16"/><path d="M27 22h20" stroke-width="1.2"/></g><path d="M42 16h11l-3 6l3 6h-11z" fill="#6e5a4c"/>
  <g class="bush-vane"><circle cx="27" cy="22" r="12" fill="none" stroke="#7d6a5c" stroke-width="12" stroke-dasharray="4.4 1.880"/><circle cx="27" cy="22" r="18.5" fill="none" stroke="#5e4c40" stroke-width=".9"/></g><circle cx="27" cy="22" r="2.6" fill="#4a3a30"/></svg>`;
const FIRE = (embers: boolean): TemplateResult => svg`<svg class="bush-a bush-fire" viewBox="0 0 64 70" width="66"><circle class="bush-glow" cx="32" cy="46" r="30" fill=${embers ? 'rgba(255,140,60,.2)' : 'rgba(255,170,70,.3)'}/>
  <ellipse cx="32" cy="65" rx="26" ry="4" fill="#2e1408" opacity=".3"/><path d="M12 62l36-10" stroke="#4a3122" stroke-width="5.5" stroke-linecap="round"/><path d="M52 62l-36-10" stroke="#3a2619" stroke-width="5.5" stroke-linecap="round"/><path d="M14 61l32-9" stroke="#7a5a40" stroke-width="1.2" stroke-linecap="round"/>
  ${embers ? svg`<g class="bush-flame"><path d="M32 40Q40 50 36 56Q32 60 28 56Q24 50 32 40z" fill="#f08a2a"/></g><path d="M22 57h20" stroke="#ff9a3a" stroke-width="3" stroke-linecap="round" opacity=".8"/>` : svg`<g class="bush-flame"><path d="M32 16Q48 38 40 54Q32 62 24 54Q16 38 32 16z" fill="#f2761c"/><path d="M26 30Q20 42 24 54Q30 58 30 50z" fill="#e2541a" opacity=".7"/></g><g class="bush-flame2"><path d="M33 32Q41 46 37 55Q32 59 28 55Q25 46 33 32z" fill="#ffc94a"/><path d="M32 44Q35 51 33 56Q31 57 30 55z" fill="#fff0b0"/></g><circle class="bush-spark" cx="34" cy="20" r="1.3" fill="#ffd27a"/>`}
  <g fill="#8d8279"><path d="M6 66q4-8 10 0zM18 68q5-8 11 0zM33 68q5-8 11 0zM46 66q5-7 10 0z"/></g><g fill="#b3a79c" opacity=".7"><path d="M8 63q3-3 5 0zM21 64q3-3 6 0zM36 64q3-3 6 0zM48 63q3-3 5 0z"/></g></svg>`;
const OWL = svg`<svg class="bush-a bush-owl" viewBox="0 0 46 40" width="44"><path d="M4 38Q0 12 23 9Q46 12 42 38z" fill="#4a392c"/><path d="M8 34Q6 16 23 14Q40 16 38 34z" fill="#6b5442"/><path d="M10 15Q17 17 22 22Q15 14 12 12zM36 15Q29 17 24 22Q31 14 34 12z" fill="#e8dcc4"/><g fill="#d9c9a8" opacity=".8"><circle cx="12" cy="31" r="1.3"/><circle cx="18" cy="35" r="1.3"/><circle cx="28" cy="35" r="1.3"/><circle cx="34" cy="31" r="1.3"/></g>
  <circle cx="15" cy="23" r="5.6" fill="#d9c436"/><circle cx="31" cy="23" r="5.6" fill="#d9c436"/><circle cx="15" cy="23" r="3" fill="#15100c"/><circle cx="31" cy="23" r="3" fill="#15100c"/><circle cx="16" cy="22" r=".9" fill="#fff"/><circle cx="32" cy="22" r=".9" fill="#fff"/><g class="bush-lid" fill="#6b5442"><rect x="9" y="17" width="12" height="12"/><rect x="25" y="17" width="12" height="12"/></g><path d="M23 25l-2.2 4.500h4.400z" fill="#b9b3a4"/></svg>`;

export const bush: Scene = {
  css: style,
  always: (c) => {
    const day = c.tod === 'day', night = c.tod === 'night', midday = day && c.mins > 630 && c.mins < 930;
    const lc = season(c.month) === 'summer' || season(c.month) === 'autumn' ? ['#b08d3e', '#7a5f24'] : ['#8a9a5b', '#5f6f3a'];
    return html`
      ${sky(c)}
      ${night ? html`<i class="bush-a bush-stars" style="box-shadow:${STARS1}"></i><i class="bush-a bush-stars" style="box-shadow:${STARS2};animation-duration:7.9s"></i>
        <svg class="bush-a" viewBox="-40 -40 80 80" width="84" style="left:30%;top:.5%;rotate:${((c.mins / 4) % 360).toFixed(0)}deg" fill="#fffbe6"><circle cx="0" cy="-26" r="2.3"/><circle cx="-3" cy="27" r="2.8"/><circle cx="-17" cy="-3" r="2.4"/><circle cx="14" cy="-8" r="2.1"/><circle cx="6" cy="4" r="1.2"/><circle cx="-30" cy="24" r="2.6" fill="#ffe9b0"/><circle cx="-36" cy="6" r="2.4"/></svg>${OWL}` : nothing}
      ${day ? html`<i class="bush-a bush-dap" style="left:-8%;top:8%"></i><i class="bush-a bush-dap" style="left:42%;top:30%;animation-duration:61s;animation-delay:-19s"></i>
        <i class="bush-a bush-gust" style="--y:5%;--d:-3s">${leafArt(lc[0], lc[1])}</i><i class="bush-a bush-gust" style="--y:9%;--d:-1.6s">${leafArt(lc[0], lc[1], 22)}</i><i class="bush-a bush-gust" style="--y:91%;--d:-.4s">${leafArt('#a8854a', '#7a5f24', 26)}</i>
        <i class="bush-a bush-fluff" style="--y:6%;--d:-12s">${fluff}</i><i class="bush-a bush-fluff" style="--y:2%;--d:-41s;animation-duration:89s">${fluff}</i>
        ${midday ? html`<i class="bush-a bush-motes" style="box-shadow:${MOTES}"></i>` : nothing}`
      : html`${c.tod === 'eve' ? html`<i class="bush-a bush-warm"></i>` : nothing}
        ${FLIES.slice(0, night ? 4 : 3).map(([x, y, d]) => html`<i class="bush-a bush-fly" style="--x:${x}%;--y:${y}%;--d:-${d}s"></i>`)}`}
      ${bough(c.month, night)}${MILL}
      <i class="bush-a bush-tus bush-bk" style="left:0">${tussock(31, c.month, true)}</i>
      <i class="bush-a bush-tus" style="left:0">${tussock(7, c.month, false)}</i><i class="bush-a bush-tus bush-r">${tussock(19, c.month, false)}</i>
      ${day ? nothing : FIRE(night)}`;
  },
  cast: [
    // --- on the ground --------------------------------------------------------------------------------------------------
    { id: 'roo', ms: 16000, move: 'bush-far foot', weight: 3, art: html`<svg viewBox="0 -12 134 114" width="120"><defs>${G('bush-g-roo', '#a99d8e', '#74685d')}</defs>
      ${SH(58, 98, 40, 'bush-rshd')}
      <g class="bush-p bush-roo">
      <g class="bush-p bush-rtl"><path d="M42 50Q20 58 6 84Q3 92 9 91Q28 78 46 72z" fill="url(#bush-g-roo)"/><path d="M40 56Q22 64 9 86" stroke="#bfb3a3" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/><path d="M12 78Q5 86 6 90Q8 92 11 90Q14 84 12 78z" fill="#4a4039"/></g>
      <g class="bush-p bush-joey"><path d="M74 60Q72 50 76 46Q79 50 78 58zM78 58Q80 49 85 47Q86 53 82 59z" fill="#857a6e"/><path d="M72 62Q76 56 84 58L92 63Q93 67 89 67L78 68Q72 67 72 62z" fill="#9a8e80"/><path d="M88 62.500l4 1q1 3-2 3.500z" fill="#4f453d"/>${eye(82, 61, 1.2)}</g>
      <path d="M30 66Q28 46 48 36Q62 28 78 30Q87 34 85 45Q81 57 71 63Q60 77 44 81Q32 79 30 66z" fill="url(#bush-g-roo)"/>
      <path d="M53 78Q72 65 80 46Q87 45 84 52Q78 62 70 67Q62 77 53 78z" fill="#d8ccba"/><path d="M36 46Q52 33 77 31.5" stroke="#c4b8a8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>
      <g class="bush-p bush-rleg"><path d="M31 63Q39 50 54 56Q63 64 59 77L50 84Q35 81 31 63z" fill="#857a6e"/><path d="M36 60Q44 54 53 59" stroke="#a4988a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/><path d="M48 76L59 78L56 90L81 94.500Q85 97 80 98L50 98Q46 96 48 90z" fill="#7a6f64"/><path d="M57 91l23 4" stroke="#9c9082" stroke-width="1.2" fill="none" opacity=".7"/><path d="M68 95l12 0q4 1.5 0 3l-13 0z" fill="#463c35"/></g>
      <g class="bush-p bush-rhead"><path d="M70 37Q78 24 88 18L97 26Q88 35 82 45z" fill="url(#bush-g-roo)"/><path d="M84 40Q90 33 95 28L97 26Q88 35 82 45z" fill="#d8ccba" opacity=".8"/>
        <g class="bush-p bush-rear"><path d="M89 15Q84 2 88-8Q95 0 95 14z" fill="#7d7166"/><path d="M94 14Q95 0 102-6Q106 4 100 15z" fill="#93877a"/><path d="M96.5 12Q97.5 3 101-1Q102.5 5 99.5 13z" fill="#d1bfaf"/></g>
        <path d="M86 16Q96 8 105 15L115 23.500Q117 28 112 29.500L98 30Q88 28 86 16z" fill="url(#bush-g-roo)"/><path d="M92 27q8 3 17 2.500l-11 .5q-4-1-6-3z" fill="#d8ccba"/><path d="M110 21.500l5 2q2 5-3 6l-4 0q3.5-3 2-8z" fill="#4f453d"/>${eye(100.5, 18.6, 2, '#3a2416')}</g>
      <g class="bush-p bush-rarm"><path d="M73 44Q81 52 88 60Q91 66 86 65Q77 60 70 51z" fill="#7d7166"/><path d="M84.5 60q5 4 2 6l-4.5-3z" fill="#463c35"/></g></g></svg>` },
    { id: 'emu', ms: 13000, move: 'bush-far foot', weight: 3, when: light, art: html`<svg class="bush-gF" viewBox="0 -4 112 120" width="98"><defs>${G('bush-g-emu', '#75604e', '#3a2c23')}</defs>
      ${SH(46, 113, 30)}
      <g class="bush-bb" style="--bob:-3px">
      <path class="bush-lb" style="--sw:32deg" d="M48 72L55 92L51 111M51 111l9 2M51 111l7-2" stroke="#4a4034" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M16 52Q3 62 4 84Q10 86 16 78Q22 70 26 60z" fill="#33261e"/>
      <path d="M11 57Q9 37 37 34Q63 33 71 49Q73 63 61 73Q45 81 27 77Q13 73 11 57z" fill="url(#bush-g-emu)"/>
      <path d="M14 66q2 13-1 20q7-5 9-13q1 11 5 15q3-7 3-14q4 10 9 12q0-8-1-13q6 8 11 8q-2-7-4-11q7 4 13 2L60 69z" fill="#33261e"/>
      <path d="M20 45q8 10 6 26M31 39q9 13 6 32M43 38q8 13 5 29M55 42q6 9 3 21" stroke="#9a8068" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".4"/><path d="M26 40q8 11 6 28M38 37q8 13 5 30M50 39q6 11 3 24" stroke="#2c211a" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5"/>
      <path class="bush-la" style="--sw:32deg" d="M39 74L48 93L43 111M43 111l10 2M43 111l8-2M43 111l-4 1.5" stroke="#6f6150" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <g class="bush-p bush-epk"><g class="bush-ct" style="--ct:5deg;transform-origin:8% 100%"><path d="M62 47Q72 32 74 15" stroke="#3f3129" stroke-width="8.5" stroke-linecap="round" fill="none"/><path d="M66 40Q72 28 74 16" stroke="#7b93a6" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M68 34Q71 26 72.5 18" stroke="#a9bfcc" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".7"/><path d="M58 50q5-10 10-13l-1 14z" fill="#4a3a2f"/>
        <g class="bush-ct" style="--ct:-6deg;transform-origin:20% 90%"><path d="M69 9Q73 2.5 81 5.500L85.5 9.500Q82 15 74 16Q68 14 69 9z" fill="#55687a"/><path d="M69 9Q73 2.5 81 5.500Q75 5.5 70.5 11z" fill="#241c18"/><path d="M83 7.500L96 11.500Q97 13.5 95.5 14L83.5 14.500z" fill="#2b2724"/><path d="M84 11.500l11 1.2" stroke="#5a544e" stroke-width=".7" fill="none"/>${eye(79, 9, 1.7, '#b4562a')}</g></g></g></g></svg>` },
    { id: 'bobtail', ms: 36000, move: 'bush-near foot', weight: 3, when: sunny, art: html`<svg class="bush-gN" viewBox="0 0 124 44" width="112"><defs>${G('bush-g-bob', '#5b4434', '#2f2219')}<pattern id="bush-p-bob" width="7" height="6" patternUnits="userSpaceOnUse"><path d="M0 6q3.5-6 7 0" fill="none" stroke="#1f1610" stroke-width=".9" opacity=".7"/><path d="M-3.5 3q3.5-6 7 0M3.5 3q3.5-6 7 0" fill="none" stroke="#7a604c" stroke-width=".6" opacity=".6"/></pattern></defs>
      ${SH(52, 40, 46)}
      <g class="bush-bb" style="--bob:-1.2px">
      ${L('bush-lb', 'M28 30l-5 6l-2 4', '#241a13', 4.2, '--sw:30deg')}${L('bush-la', 'M70 30l5 6l3 4', '#241a13', 4.2, '--sw:30deg')}
      <g class="bush-p bush-tng"><path d="M90 21h24q8 4 0 8h-24z" fill="#2f6fd6"/><path d="M92 22.500h22q3 1 3 2.500h-25z" fill="#6aa0f0" opacity=".8"/></g>
      <g class="bush-p bush-brear">
      <path d="M4 25Q1 15 13 13Q26 6 48 6Q72 6 88 14L89 32Q66 38 44 37Q18 38 4 25z" fill="url(#bush-g-bob)"/><path d="M4 25Q1 15 13 13Q26 6 48 6Q72 6 88 14L89 32Q66 38 44 37Q18 38 4 25z" fill="url(#bush-p-bob)"/>
      <path d="M21 10Q24 20 20 33l5 2Q30 20 27 8zM38 7Q42 20 37 37l6 0Q47 20 44 6zM56 6Q60 20 56 37l6-1Q65 20 62 7zM73 9Q76 20 73 34l5-1Q81 20 79 11z" fill="#d7b98a" opacity=".85"/><path d="M8 17q4 8 1 14" stroke="#d7b98a" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/>
      <path d="M14 14Q30 7 50 7.500Q70 8 86 15" stroke="#8d7460" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>
      <path d="M86 23L108 22.500Q104 32 87 32z" fill="#3a2a20"/><path d="M88 24h17q-3 5-16 6z" fill="#e39aa2"/>
      <g class="bush-p bush-jaw"><path d="M85 14Q98 10 109 21L87 24.500z" fill="#4a3628"/><path d="M88 15Q98 12.5 106 19" stroke="#7a604c" stroke-width="1.2" fill="none" opacity=".7"/>${eye(96, 17, 1.6, '#c9902c')}</g></g>
      ${L('bush-la', 'M34 31l-3 6l1 3.5', '#4a3628', 4.4, '--sw:30deg')}${L('bush-lb', 'M64 31l4 6l4 3.5', '#4a3628', 4.4, '--sw:30deg')}</g></svg>` },
    { id: 'echidna', ms: 20000, move: 'bush-dig foot', weight: 2, art: html`<svg class="bush-gD" viewBox="-14 -6 122 66" width="112"><defs>${G('bush-g-ech', '#5e4636', '#2e2018')}</defs>
      ${SH(42, 55, 36)}
      <g fill="#8a4f2e"><circle class="bush-p bush-clod" cx="14" cy="50" r="2.6" style="--cx:-24px"/><circle class="bush-p bush-clod" cx="66" cy="50" r="2.2" style="--cx:22px;animation-delay:calc(var(--t)*.69)"/><circle class="bush-p bush-clod" cx="24" cy="50" r="1.8" style="--cx:-12px;animation-delay:calc(var(--t)*.72)"/></g>
      <g class="bush-p bush-tuck"><path d="M64 36Q80 34 94 47L94 50L62 50z" fill="#6e5847"/><path d="M68 37Q80 37 92 46" stroke="#9a8472" stroke-width="1.2" fill="none" opacity=".7"/><ellipse cx="93.5" cy="48.3" rx="1.3" ry="1.5" fill="#1a120e"/>${eye(70, 39.5, 1.4)}</g>
      <g class="bush-p bush-eball"><path d=${SPINES(33, 27)} stroke="#2a1d15" stroke-width="3.6" stroke-linecap="round"/><path d=${SPINES(32, 26)} stroke="#e9d9aa" stroke-width="2.4" stroke-linecap="round"/><path d=${SPINES(34, 28, 6)} stroke="#2a1d15" stroke-width=".1"/>
        <path d="M10 52Q6 27 40 25Q74 27 70 52z" fill="url(#bush-g-ech)"/><path d=${SPINES(24, 18, 5.9, 44)} stroke="#f1e4bc" stroke-width="2.2" stroke-linecap="round"/><path d=${SPINES(15, 10, 9, 47)} stroke="#d9c690" stroke-width="2" stroke-linecap="round"/></g>
      ${L('bush-la', 'M22 48l-2 6h7', '#2a1d15', 4.4)}${L('bush-lb', 'M58 48l2 6h7', '#2a1d15', 4.4)}</svg>` },
    { id: 'quokka', ms: 14000, move: 'bush-pop', weight: 3, when: (c) => !summer(c), art: quokka(false) },
    { id: 'swimmer', ms: 14000, move: 'bush-pop', weight: 3, when: summer, art: quokka(true) },
    { id: 'frilly', ms: 12000, move: 'bush-far foot', weight: 2, when: sunny, art: html`<svg class="bush-gF" viewBox="0 -8 126 98" width="110"><defs>${G('bush-g-fri', '#b9a078', '#73603f')}</defs>
      ${SH(56, 87, 26)}
      <g class="bush-bb" style="--bob:-3px">
      <g class="bush-ct" style="--ct:7deg;transform-origin:100% 40%"><path d="M50 54Q30 62 14 56Q6 52 1 42Q8 51 17 50Q32 52 49 45z" fill="url(#bush-g-fri)"/><path d="M38 51l1 7M29 53l0 6M20 51l-1 6M12 48l-2 5" stroke="#5e4a30" stroke-width="1.8" opacity=".55" fill="none"/></g>
      <path class="bush-lb" style="--sw:36deg" d="M53 57L63 67L55 82L66 84" stroke="#6b5638" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <g class="bush-p bush-frr">
      <path d="M44 58Q42 45 56 35Q68 27 79 31L81 39Q72 51 60 60Q50 64 44 58z" fill="url(#bush-g-fri)"/><path d="M50 60Q64 54 77 39L81 39Q72 51 60 60Q54 63 50 60z" fill="#e3d6b6"/><path d="M50 47l5 3M57 41l5 3M64 36l5 3" stroke="#6b5638" stroke-width="1.8" opacity=".55" stroke-linecap="round" fill="none"/>
      <path d="M68 44L76 54L82 52" stroke="#8a744e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <g class="bush-p bush-frl"><path d="M78 31L60 7Q80-8 102 4Q113 20 103 43Q88 51 72 45z" fill="#cf5a28"/><path d="M78 31L66 13Q80 2 98 8Q105 20 98 37Q88 43 76 41z" fill="#eb9a36"/><path d="M78 31L85 22Q91 22 93 29Q91 35 85 37z" fill="#f6d874"/><path d="M78 31L63 10M78 31L80 0M78 31L100 9M78 31L106 33M78 31L85 47" stroke="#8a3a1c" stroke-width="1.1" opacity=".65" fill="none"/></g>
      <path d="M76 33L101 30L100 32.500L78 35.500z" fill="#f0b8a0"/>
      <g class="bush-p bush-fj"><path d="M74 34L101 31Q99 38 87 40Q77 40 74 34z" fill="#8f7854"/></g>
      <path d="M72 29Q82 19 98 24.500L102.5 28.500L74 34z" fill="#ab926c"/><path d="M76 27Q84 21 96 25" stroke="#d3c09c" stroke-width="1.3" fill="none" opacity=".7" stroke-linecap="round"/>${eye(87, 26.6, 1.6, '#c98a2c')}</g>
      <path class="bush-la" style="--sw:36deg" d="M48 58L55 70L50 84L63 86" stroke="#9a8460" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g></svg>` },
    { id: 'devil', ms: 34000, move: 'bush-near foot', weight: 2, when: sunny, art: html`<svg class="bush-gN" viewBox="-2 0 116 52" width="112"><defs>${G('bush-g-dev', '#e6c684', '#a6722c')}</defs>
      ${SH(46, 48, 40)}
      <g fill="#33160f"><ellipse class="bush-ant" cx="97" cy="46" rx="2" ry="1.2"/><ellipse class="bush-ant" style="--d:calc(var(--t)*.04)" cx="102" cy="45.5" rx="2" ry="1.2"/><ellipse class="bush-ant" style="--d:calc(var(--t)*.08)" cx="107" cy="46.2" rx="2" ry="1.2"/></g>
      <g class="bush-p bush-rock">
      <g class="bush-p bush-dtg"><path d="M86 39.500L98 44.5" stroke="#e8848e" stroke-width="1.7" stroke-linecap="round"/></g>
      <g class="bush-bb" style="--bob:-1.6px">
      ${L('bush-lb', 'M30 35L24 41L24 47', '#7a5226', 3)}${L('bush-la', 'M60 35L66 41L67 47', '#7a5226', 3)}
      <path d="M21 33Q8 31 6 15Q11 27 23 26z" fill="url(#bush-g-dev)"/><path d="M6 20l-4.5-2l4.5-1.500zM9 27l-4.5 1l4 2.500zM14 31l-2.5 4.500l5.5-2.500z" fill="#f3e2b4"/>
      <path d="M18 25l2-10l4 7l3-11l4 9l4-11l4 10l4-11l4 10l4-10l4 10l3-9l4 10l3-7l3 9z" fill="#f3e2b4"/><path d="M20 15l1 9M27 11l1 12M35 9l1 13M43 8l1 13M51 8l0 13M58 9l0 12M65 12l0 10" stroke="#b08a4a" stroke-width="1" opacity=".7" fill="none"/>
      <path d="M14 32Q16 20 40 18Q62 18 70 28L71 37Q42 43 14 37z" fill="url(#bush-g-dev)"/>
      <path d="M22 22q7 8 1 16l8 0q5-8-1-17zM40 19q8 10 1 22l9-1q5-10-2-21zM57 21q6 8 1 17l7-1q3-8-1-14z" fill="#74361c" opacity=".85"/><path d="M17 29q26-7 51 0" stroke="#fff3cf" stroke-width="1.3" opacity=".8" fill="none"/>
      <path d="M20 37l2 4.500l3-4.500l3 4.500l3-4.500l3 4.500l3-4.500l3 4.500l3-4.500l3 4.500l3-4.500l3 4.500l3-4.500l3 3.500l3-4.500z" fill="#d6ae62"/>
      <path d="M63 24q4-8 9-1z" fill="#c4904a"/><path d="M66 21l1-5l2.5 5z" fill="#f3e2b4"/>
      <path d="M68 27Q78 23 87.5 34Q85 41 70 40z" fill="#dab066"/><path d="M71 28Q78 26 85 33" stroke="#f3e2b4" stroke-width="1.1" fill="none" opacity=".8"/><path d="M73 26l-1-11l5.5 9zM79 27l3-10l2.5 11z" fill="#f3e2b4"/><path d="M73 26l-1-11l2 10z" fill="#b08a4a"/>${eye(79.5, 32, 1.3)}
      ${L('bush-la', 'M34 37L29 43L30 47.5', '#b88a44', 3.4)}${L('bush-lb', 'M56 37L61 43L63 47.5', '#b88a44', 3.4)}</g></g></svg>` },
    { id: 'ute', ms: 13000, move: 'across foot', weight: 3, art: html`<svg viewBox="0 0 176 60" width="138"><defs>${G('bush-g-ute', '#fdfaf2', '#c4bcae')}</defs>
      <g fill="rgba(214,150,104,.6)"><circle class="bush-dst" cx="54" cy="46" r="9"/><circle class="bush-dst" style="--d:-.45s" cx="36" cy="42" r="12"/><circle class="bush-dst" style="--d:-.9s" cx="16" cy="38" r="10"/></g>
      ${SH(112, 55, 52)}
      <g class="bush-jig"><g transform="translate(64 -1) scale(.6)">${DOG}</g>
      <path d="M60 25h53v16H60z" fill="url(#bush-g-ute)"/><path d="M60 19h53M61.5 25v-6M111.5 25v-12" stroke="#7d8388" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M60 29h53" stroke="#b3ab9e" stroke-width=".8"/>
      <path d="M113 41V20Q115 10 125 10h12q8 1 13 12l13 3q5 2 5 8v8z" fill="url(#bush-g-ute)"/><path d="M120 14h15q6 2 10 9.500h-25z" fill="#2c3e4c"/><path d="M122 15.500h8l-4 6.500h-4z" fill="#9dbdd0" opacity=".7"/><path d="M118 25v14M143 25v14" stroke="#aaa294" stroke-width=".8"/><path d="M137 28h4" stroke="#55504a" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M60 36h108v5H60z" fill="#b8683f" opacity=".42"/><path d="M61 41h106v3H61z" fill="#37312d"/><path d="M162 27.500h5v4h-5z" fill="#ffe9a8"/><path d="M168 26v15M171.5 30v11M168 31h4" stroke="#33302d" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path class="bush-flp" d="M152 22l3-19" stroke="#3a3a3a" stroke-width=".9" stroke-linecap="round"/></g>
      <path d="M67 44a11 11 0 0 1 22 0zM135 44a11 11 0 0 1 22 0z" fill="#2a2522"/><circle cx="78" cy="46" r="8.6" fill="#1d1a18"/><circle cx="146" cy="46" r="8.6" fill="#1d1a18"/>
      <g class="bush-whl"><circle cx="78" cy="46" r="4.4" fill="#bdb7ae"/><path d="M78 42v8M74 46h8" stroke="#6a655e" stroke-width="1.2"/></g><g class="bush-whl"><circle cx="146" cy="46" r="4.4" fill="#bdb7ae"/><path d="M146 42v8M142 46h8" stroke="#6a655e" stroke-width="1.2"/></g></svg>` },
    { id: 'roadtrain', ms: 24000, move: 'across foot', weight: 1.2, art: html`<svg viewBox="0 0 200 60" width="200"><defs>${G('bush-g-tnk', '#f3f6f8', '#87929b')}${G('bush-g-cab', '#d64a3c', '#86221a')}</defs>
      <circle class="bush-dst" cx="8" cy="46" r="9" fill="rgba(214,150,104,.6)"/>${SH(100, 55, 97)}
      <g class="bush-jig"><path d="M4 41h50v3H4z" fill="#544e48"/>
      <path d="M13 41Q5 41 3 35Q10 36 15 33z" fill="#4f8a4a"/><path d="M12 41Q10 28 25 26Q39 26 41 37L41 41z" fill="#5e9a58"/><path d="M16 41Q16 33 26 32Q36 33 38 41z" fill="#8cc07e" opacity=".6"/><path d="M19 36v5h5.500v-5zM31 36v5h5.500v-5z" fill="#477f44"/>
      <g class="bush-p bush-sw1"><path d="M35 33Q44 22 44 10L48.5 10Q50 24 42 37z" fill="#5e9a58"/><path d="M43 11Q44 5 52 6Q56.5 8 54 11.500Q50 13 44 12.500z" fill="#6aa862"/><circle cx="50.5" cy="8.3" r=".9" fill="#14100c"/><path d="M38 30Q45 20 45.5 11" stroke="#9ad08c" stroke-width="1" fill="none" opacity=".7"/></g>
      <path d="M21 26.500v14.500M33 27v14" stroke="#eeb030" stroke-width="1.6"/>
      <rect x="58" y="19" width="46" height="21" rx="9.5" fill="url(#bush-g-tnk)"/><rect x="110" y="19" width="46" height="21" rx="9.5" fill="url(#bush-g-tnk)"/><path d="M65 23.500h32M117 23.500h32" stroke="#fff" stroke-width="1.5" opacity=".85" stroke-linecap="round"/><path d="M70 19v21M81 19v21M92 19v21M122 19v21M133 19v21M144 19v21" stroke="#75808a" stroke-width=".7"/><path d="M78 17h8v2h-8zM130 17h8v2h-8z" fill="#75808a"/><path d="M58 40h46v3H58zM110 40h46v3h-46zM52 41h8M104 41h8M156 41h8" fill="#544e48" stroke="#37312d" stroke-width="1"/>
      <path d="M162 44V15h14q9 2 11 15l9 2q2 1 2 4v8z" fill="url(#bush-g-cab)"/><path d="M177 18.500h5q3 4 4 10.500h-9z" fill="#2c3e4c"/><path d="M178 20h3l1 4h-4z" fill="#9dbdd0" opacity=".7"/><path d="M162 30h36" stroke="#f3e2c8" stroke-width="1.2" opacity=".7"/><path d="M166 15V3M170.5 15V6" stroke="#bcc4ca" stroke-width="2.4" stroke-linecap="round"/><path d="M198 33v11" stroke="#bcc4ca" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="171" cy="42" rx="6" ry="3" fill="#bcc4ca"/></g>
      <path d="M12 50h.1M22 50h.1M42 50h.1M64 50h.1M74 50h.1M90 50h.1M100 50h.1M116 50h.1M126 50h.1M142 50h.1M152 50h.1M168 50h.1M184 50h.1M193 50h.1" stroke="#1d1a18" stroke-width="9.5" stroke-linecap="round"/><path d="M12 50h.1M22 50h.1M42 50h.1M64 50h.1M74 50h.1M90 50h.1M100 50h.1M116 50h.1M126 50h.1M142 50h.1M152 50h.1M168 50h.1M184 50h.1M193 50h.1" stroke="#a9a49c" stroke-width="3.4" stroke-linecap="round"/></svg>` },
    { id: 'scooter', ms: 15000, move: 'bush-far foot', weight: 2, when: light, art: html`<svg class="bush-gF" viewBox="0 0 140 96" width="122">
      ${SH(104, 92, 30)}${SH(30, 92, 24)}
      <g transform="translate(0 50)"><g class="bush-p bush-dj"><g class="bush-bb">${DOG}</g></g></g>
      <circle cx="84" cy="87" r="4.6" fill="#221f1c"/><circle cx="126" cy="86.5" r="5" fill="#221f1c"/><circle cx="84" cy="87" r="1.6" fill="#c9c4bc"/><circle cx="126" cy="86.5" r="1.8" fill="#c9c4bc"/><path d="M82 83h36l6-2v3l-6 2h-36z" fill="#2a8f86"/><path d="M83 83.500h34" stroke="#6cc8be" stroke-width=".8"/><path d="M123 82L118 44" stroke="#c9ced2" stroke-width="2.6" stroke-linecap="round"/><path d="M113 44h10" stroke="#262626" stroke-width="3" stroke-linecap="round"/>
      <g class="bush-kick"><path d="M95 58L88 73" stroke="#2c3a54" stroke-width="7.5" stroke-linecap="round"/><path d="M88 73L83 85" stroke="#c99672" stroke-width="4.4" stroke-linecap="round"/><path d="M78.5 85.500h8.500l1 3.500h-10z" fill="#e9e6de"/></g>
      <path d="M96 58L100 72" stroke="#3d4d6c" stroke-width="8" stroke-linecap="round"/><path d="M100 72L99.5 81" stroke="#e0ab84" stroke-width="4.6" stroke-linecap="round"/><path d="M96 80.500h9.500l1 3h-10.500z" fill="#f4f1ea"/>
      <g class="bush-p bush-kbd"><path d="M95 59Q96 44 103 36" stroke="#d98f2b" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M99 55Q100 45 105 38" stroke="#f4c064" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/><path d="M103 39L112 47L118 45" stroke="#e0ab84" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M103 39L108 43.5" stroke="#d98f2b" stroke-width="5.6" stroke-linecap="round"/>
        <circle cx="106" cy="27" r="7.2" fill="#e0ab84"/><path d="M112.5 26.500l2.6 2l-2.6 1z" fill="#e0ab84"/><path d="M98 27.500Q98 15 108 16Q115.5 18 114.5 25.500L106 24Q101 24 98 27.500z" fill="#c8352e"/><path d="M102 19.500q5-2.5 9.5 .5" stroke="#f08a80" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M104 24.500l2 9" stroke="#262626" stroke-width=".9"/><circle cx="110.8" cy="27" r=".8" fill="#2a1a10"/><path d="M110.5 31.200q1.8 .8 3-.5" stroke="#8a4a3a" stroke-width=".8" fill="none" stroke-linecap="round"/></g></svg>` },
    { id: 'magpie', ms: 15000, move: 'bush-far foot', weight: 2, when: (c) => sunny(c) && c.month >= 8 && c.month <= 11, art: html`<svg class="bush-gF" viewBox="0 -8 96 94" width="88">
      ${SH(47, 82, 44)}
      <circle cx="20" cy="64" r="16" fill="none" stroke="#1c1a18" stroke-width="2.6"/><circle cx="74" cy="64" r="16" fill="none" stroke="#1c1a18" stroke-width="2.6"/><circle cx="20" cy="64" r="14" fill="none" stroke="#a9a9a9" stroke-width=".7"/><circle cx="74" cy="64" r="14" fill="none" stroke="#a9a9a9" stroke-width=".7"/>
      <g class="bush-wsp" stroke="#b9b9b9" stroke-width=".5"><path d="M6 64h28M20 50v28M10 54l20 20M30 54l-20 20"/></g><g class="bush-wsp" stroke="#b9b9b9" stroke-width=".5"><path d="M60 64h28M74 50v28M64 54l20 20M84 54l-20 20"/></g>
      <path class="bush-lb" style="--sw:13deg" d="M39 33L50 47L46 67" stroke="#14161c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M20 64L40 40L62 40L74 64M40 40L48 64L62 40M48 64L20 64M62 40L64 33L70 33.500M40 40L38 34" stroke="#1f8f84" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M33 33.500h10" stroke="#1c1c1c" stroke-width="3.2" stroke-linecap="round"/>
      <g class="bush-crk"><path d="M43 58L53 70M41 58h4M51 70h4" stroke="#4a4a4a" stroke-width="1.8" stroke-linecap="round"/></g>
      <path class="bush-la" style="--sw:13deg" d="M39 33L52 46L52 69" stroke="#262a36" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <g class="bush-p bush-duck"><path d="M39 32Q48 20 60 19" stroke="#d8452f" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M44 25Q51 18 60 17" stroke="#f08a6a" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".7"/><path d="M58 21L66 33" stroke="#d9a37c" stroke-width="3.6" stroke-linecap="round"/>
        <circle cx="66" cy="13" r="6.6" fill="#d9a37c"/><path d="M59 12.500Q60 3 68 4Q74.5 6 73.5 12.500L66 11Q62 11 59 12.500z" fill="#f3f1ea"/><path d="M62 7l8 1.500M61 9.500l10 1.5" stroke="#b9b5aa" stroke-width=".8"/><path d="M63 5l-2-7.500M66 4l0-8.500M69 5l3-7.500M71.5 8l5-5.5" stroke="#161616" stroke-width=".9" stroke-linecap="round"/><path d="M68 12.800h5" stroke="#111" stroke-width="2.2" stroke-linecap="round"/><path d="M68.5 17.500q1.5 1.2 2.5 0" stroke="#7a2e2a" stroke-width="1.3" fill="none"/></g></svg>
      <svg class="bush-mag" viewBox="-5 -18 62 40" width="52"><path d="M8 12L-4 15L-3 19.500L10 15z" fill="#17161a"/><path d="M11 11L3 13L4 16.500L12 14.500z" fill="#f2f0ea"/><path d="M6 12Q16 4 32 6Q40 8 42 12Q34 18 20 17Q10 17 6 12z" fill="#17161a"/><path d="M12 14Q22 17.5 36 14" stroke="#3a3a46" stroke-width="1" fill="none"/><path d="M28 6Q34 5 38 9L32 11.500Q29 9 28 6z" fill="#f2f0ea"/>
        <path d="M36 6Q42 3 46 8Q46 12 41 13Q36 12 36 6z" fill="#17161a"/><path d="M45 8L55 10.500L45 12.200z" fill="#cfd6da"/><path d="M52 9.800l3 .7l-3 .6z" fill="#2a2a2a"/><circle cx="42.6" cy="8" r="1" fill="#a8442a"/>
        <g class="bush-wng" style="--wb:.3s"><path d="M14 11Q14-10 30-15Q36-4 34 10z" fill="#17161a"/><path d="M18 4Q22-4 30-8L32 0Q26 4 20 8z" fill="#f2f0ea"/></g></svg>` },
    { id: 'ball', ms: 14000, move: 'bush-far foot', weight: 1.6, when: light, art: html`<svg class="bush-gF bush-dogb" viewBox="0 -4 68 48" width="78">${SH(30, 41, 24)}<g class="bush-bb">${DOG}</g></svg>
      <svg class="bush-tb" viewBox="0 0 16 16" width="17"><circle cx="8" cy="8" r="7.4" fill="#cfe23a"/><path d="M8 .6a7.4 7.4 0 0 1 0 14.800a9 9 0 0 0 0-14.800z" fill="#a9bc22" opacity=".7"/><path d="M3 2.600q5 5.4 0 10.8" stroke="#f4f7d8" stroke-width="1" fill="none"/></svg>` },
    { id: 'ants', ms: 30000, move: 'across foot', weight: 2, art: html`<svg viewBox="0 0 176 34" width="176" stroke-linecap="round">
      ${[0, 1, 2, 3, 4, 5].map((i) => { const x = 20 + i * 26; return svg`<g class=${i === 0 ? 'bush-late' : ''}><g class=${i % 2 ? 'bush-ma' : 'bush-mz'}><ellipse cx=${x + 6} cy="31.5" rx="10" ry="1.3" fill="#2e1408" opacity=".25"/>
        <path d="M${x + 5} 25l-5 5M${x + 6.5} 25l-1 6M${x + 8} 25l5 5M${x + 5} 24l-3-1l-3 4M${x + 8} 24l4-1l4 4" fill="none" stroke="#3a1a12" stroke-width=".9"/><path d="M${x + 13} 20q3-5 6-3M${x + 12} 20q1-6 4-6" fill="none" stroke="#3a1a12" stroke-width=".7"/>
        <ellipse cx=${x - 1} cy="23" rx="5.4" ry="3.8" fill="#241a2a"/><path d="M${x - 4} 21q3-1.6 6 0" stroke="#6a5a7a" stroke-width=".9" fill="none"/><ellipse cx=${x + 6.5} cy="23.5" rx="3.4" ry="2.3" fill="#8a3220"/><ellipse cx=${x + 12} cy="22" rx="3.3" ry="3" fill="#9a3a24"/><circle cx=${x + 13} cy="21.3" r=".7" fill="#1a0e0a"/><path d="M${x + 10} 20.300q2-1 4 0" stroke="#d0705a" stroke-width=".7" fill="none"/>
        ${i === 5 ? svg`<path d="M${x + 12} 20V7" stroke="#6f8a3a" stroke-width="1.2"/><g transform="translate(${x + 12} 6)"><path d="M0-6l1.5 3.400l3.4-2.400l-.8 3.800l3.9.5l-3 2.200l3 2.200l-3.9.5l.8 3.800l-3.4-2.400l-1.5 3.400l-1.5-3.400l-3.4 2.400l.8-3.800l-3.9-.5l3-2.200l-3-2.200l3.9-.5l-.8-3.800l3.4 2.400z" fill="#f39cbb"/><circle r="2" fill="#eaa820"/></g>`
    : i === 0 ? svg`<path d="M${x + 4} 17l-2-7h9l-2 7z" fill="#7a6048"/><ellipse cx=${x + 6.5} cy="10" rx="4.6" ry="1.8" fill="#4f3c2c"/>`
    : i === 3 ? svg`<ellipse cx=${x + 8} cy="15" rx="5" ry="3" fill="#e9d9aa" transform="rotate(-20 ${x + 8} 15)"/>`
    : svg`<path d="M${x - 2} 18Q${x + 6} ${6 - (i % 2) * 3} ${x + 16} 14Q${x + 6} 21 ${x - 2} 18z" fill=${i % 2 ? '#8fae4a' : '#6f9a3a'}/><path d="M${x - 2} 18Q${x + 7} 15 ${x + 16} 14" stroke="#d6e6a0" stroke-width=".6" fill="none"/>`}</g></g>`; })}</svg>` },
    { id: 'mob', ms: 22000, move: 'across foot', weight: 2, when: dusk, art: html`<svg viewBox="0 0 200 40" width="200" fill="#5f4f46" opacity=".88">
      ${[[150, 1, 0], [112, 0.86, 0.21], [78, 0.94, 0.4], [40, 0.8, 0.13], [14, 0.5, 0.33]].map(([x, k, d]) => svg`<ellipse cx=${x + 14 * k} cy="37.5" rx=${13 * k} ry="1.6" fill="#2e1408" opacity=".3"/><g transform="translate(${x} ${37 - 24 * k}) scale(${k})"><path class="bush-mh" style="--d:-${d}s" d="M0 17Q7 12 11 9Q15 5 20 5L23 1.500L24.5-1.500L25.5 2.500L28 4.500Q29.5 6.5 27 7L24 7.500Q23 12.5 19 15.500L22 21.500L26 22.500L26 24L18.5 24L15.5 18.500Q11 18.5 8 15.500Q4 15.5 0 17z"/></g>`)}</svg>` },
    { id: 'wren', ms: 14000, move: 'bush-wrn foot', weight: 2, when: sunny, art: html`<svg viewBox="0 -8 54 48" width="46">${SH(24, 37, 10, 'bush-wsh')}
      <g class="bush-p bush-wtl"><path d="M14 22L3 1L8 0L19 20z" fill="#2b4aa8"/><path d="M14 22L3 1L5.5 .5z" fill="#6a90e8"/></g>
      <path d="M22 28L21 36M21 36l4 .6M26 28L27 36M27 36l4 .4" stroke="#3a2e28" stroke-width="1" fill="none" stroke-linecap="round"/>
      <path d="M12 22Q14 12 26 12Q36 13 36 22Q34 30 24 30Q14 30 12 22z" fill="#2f5fd0"/><path d="M15 26Q24 32 35 24Q33 30 24 30Q18 30 15 26z" fill="#86b6f4"/><path d="M15 20Q20 14 30 17Q27 25 18 25z" fill="#34509c"/><path d="M17 20Q22 16 29 18" stroke="#6a90e8" stroke-width=".9" fill="none"/><path d="M30 14Q36 18 35 24L32 22.500Q33 18 29 15z" fill="#141a2e"/>
      <g class="bush-p bush-wpk"><circle cx="34" cy="12" r="6.4" fill="#3f7fe8"/><path d="M28.5 9.500Q34 3.5 39.5 8Q34 7 28.5 9.500z" fill="#9fd0ff"/><ellipse cx="33.5" cy="14" rx="3" ry="2.2" fill="#a9d8ff"/><path d="M28 12Q33 10 40 11.600L40 12.800Q33 12 28 13.400z" fill="#141a2e"/><path d="M39.6 10.800L45.5 12L39.6 13.200z" fill="#141414"/><circle cx="36.6" cy="11.5" r="1" fill="#0e0907"/><circle cx="37" cy="11.2" r=".3" fill="#fff"/></g>
      <g class="bush-wfl"><path class="bush-hum" d="M18 18Q14 2 27 0Q31 9 26 18z" fill="#4a6fd0"/></g></svg>` },
    // --- in the sky band --------------------------------------------------------------------------------------------------
    { id: 'cockies', ms: 21000, move: 'across bobbing', weight: 3, when: light, y: [0, 3], art: html`<svg viewBox="-20 -26 240 112" width="210">${cocky(160, 34, 1, 0)}${cocky(110, 10, 0.86, 0.13)}${cocky(104, 58, 0.92, 0.22)}${cocky(56, 30, 0.74, 0.07)}${cocky(4, 50, 0.62, 0.3)}</svg>` },
    { id: 'kooka', ms: 17000, move: 'bush-perch', weight: 3, when: light, flip: false, art: html`<svg viewBox="0 0 160 116" width="146"><defs>${G('bush-g-kk', '#f6eedc', '#c9bb9c')}</defs>
      <path d="M100-2Q94 34 62 52Q42 60 14 56" stroke="#5f4a3a" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M98 0Q92 32 61 49.500Q42 57 16 54" stroke="#927862" stroke-width="1.6" stroke-linecap="round" fill="none"/>
      ${gumleaf(20, 57, 12)}${gumleaf(32, 59, -10, 0.9)}${gumleaf(90, 30, -16, 0.9)}${gumleaf(96, 18, 20, 0.7)}
      <g class="bush-kb">
      <g class="bush-kw"><g class="bush-wng" style="--wb:.2s"><path d="M54 36L22 0Q40 2 62 24zM64 32L94-4Q86 14 70 32z" fill="#5f4634"/><path d="M40 18L30 8Q40 8 50 18z" fill="#5fb0d8"/></g></g>
      <g class="bush-p bush-kt"><path d="M50 46L38 73L47 72L56 50z" fill="#9a5a34"/><path d="M44 60l7 2M42 65l7 2" stroke="#4a2a18" stroke-width="1.7" fill="none"/><path d="M38 73l9-1l-1-3l-7 1z" fill="#f1e7d0"/></g>
      <path d="M46 48Q43 24 62 21Q78 23 76 42Q72 55 57 56Q48 55 46 48z" fill="url(#bush-g-kk)"/><path d="M58 50q4 2 8 0M62 45q4 2 8 0" stroke="#b5a78a" stroke-width=".8" fill="none"/>
      <path d="M47 46Q47 28 61 28Q69 38 62 52Q52 54 47 46z" fill="#5f4634"/><path d="M53 36q4-3 8 1l-3 5q-4 1-6-2z" fill="#5fb0d8"/><circle cx="52" cy="44" r="1.2" fill="#8fd0ee"/><circle cx="57" cy="46" r="1" fill="#8fd0ee"/><path d="M49 42Q52 50 60 51" stroke="#3f2e22" stroke-width="1" fill="none"/>
      <path d="M58 55v4.500M64 54v4.5" stroke="#6a5a4a" stroke-width="2" stroke-linecap="round"/>
      <g class="bush-p bush-kh"><path d="M56 22Q56 4 73 5Q86 9 83 24Q72 31 59 28z" fill="url(#bush-g-kk)"/><path d="M60 10Q69 2 79 8L72 11Q66 9 60 13z" fill="#6f4f38"/><path d="M62 9l5-2M68 7l5 0" stroke="#a88464" stroke-width=".8" fill="none"/><path d="M64 15L81 15L80 20L66 21z" fill="#4a3426"/>${eye(73.5, 17, 1.9, '#3a2416')}
        <g class="bush-p bush-kj"><path d="M80 20L105 19L80 25z" fill="#d9bd8a"/></g><path d="M79 12L108 17.500L80 20.500z" fill="#2f2c2a"/><path d="M82 14L104 17.5" stroke="#6a655e" stroke-width=".8" fill="none"/></g></g></svg>` },
    { id: 'twentyeight', ms: 9000, move: 'across', weight: 2, when: light, y: [1, 6], art: html`<svg viewBox="-30 -30 150 80" width="130">${ringneck(60, 6, 0)}${ringneck(4, 22, 0.4)}</svg>` },
    { id: 'wedgie', ms: 34000, move: 'bush-soar', weight: 1.4, when: sunny, flip: false, y: [0, 2], art: html`<svg class="bush-bank" viewBox="-42 -54 80 108" width="74" opacity=".85"><g class="bush-tipf">
      ${[1, -1].map((s) => svg`<g transform="scale(1 ${s})"><path d="M13-3Q17-14 11-30Q7-41 3-50L0-46L-2-51L-5-46L-7-50L-10-45L-12-48L-15-42Q-17-28-14-14L-11-3z" fill="#3a2c22"/><path d="M8-5Q10-16 5-30L-7-30Q-9-18-6-5z" fill="#7a6248" opacity=".85"/><path d="M4-32L1-46M-2-32L-5-46M-8-32L-10-45" stroke="#1f1712" stroke-width=".8" fill="none"/></g>`)}</g>
      <path d="M-12-4L-33-9Q-40 0-33 9L-12 4z" fill="#2c211a"/><path d="M-15 0Q-4-6 12-4Q18-2.5 22 0Q18 2.5 12 4Q-4 6-15 0z" fill="#3a2c22"/><ellipse cx="21" cy="0" rx="5" ry="3.6" fill="#6b5642"/><path d="M25-1.200l5 1.200l-5 1.200z" fill="#d9c9a8"/></svg>` },
    { id: 'boobook', ms: 15000, move: 'across', weight: 2, when: (c) => c.tod === 'night', y: [1, 5], art: html`<svg class="bush-owb" viewBox="-8 -28 74 56" width="70"><path d="M8 8L-5 5.500L-5 13.500L8 12z" fill="#5a4434"/><path d="M-2 6v7M2 6.500v6" stroke="#cbb89a" stroke-width="1" opacity=".7"/>
      <path d="M6 8Q14 0 32 1Q44 2 48 8Q42 16 26 16Q12 15 6 8z" fill="#6b5240"/><path d="M12 11Q26 17.5 44 10Q40 16 26 16Q16 15 12 11z" fill="#cbb89a"/><path d="M18 12.500l1 2.500M24 13.500l1 2M30 13.500l1 2M36 12.500l1 2" stroke="#6b5240" stroke-width=".9"/>
      <circle cx="46" cy="6" r="8" fill="#6b5240"/><ellipse cx="49" cy="6.5" rx="5" ry="6" fill="#8f765e"/><path d="M45 1Q50 2 53 5" stroke="#e8dcc4" stroke-width="1" fill="none"/><circle cx="50" cy="5.5" r="2" fill="#c9d04a"/><circle cx="50.3" cy="5.5" r="1.1" fill="#0e0907"/><path d="M53.5 7.500l2.6 1.600l-2.8 1z" fill="#a9b0ae"/>
      <g class="bush-owg"><path d="M16 6Q15-20 36-25Q45-12 38 6z" fill="#5a4434"/><path d="M19-4Q26-14 37-18" stroke="#8f765e" stroke-width="1.2" fill="none"/><g fill="#e8dcc4" opacity=".85"><circle cx="24" cy="-6" r="1.2"/><circle cx="30" cy="-11" r="1.2"/><circle cx="27" cy="0" r="1.1"/><circle cx="33" cy="-4" r="1.1"/><circle cx="36" cy="-13" r="1"/></g></g></svg>` },
    { id: 'possum', ms: 15000, move: 'bush-hang', weight: 2, when: dusk, art: html`<svg viewBox="0 0 108 110" width="94"><defs>${G('bush-g-pos', '#c2bdb6', '#86817b')}</defs>
      <g class="bush-pk"><ellipse cx="52" cy="2" rx="5" ry="3.4" fill="#e8a9b0"/><ellipse cx="94" cy="2" rx="5" ry="3.4" fill="#e8a9b0"/>
        <path d="M59 20Q52 34 56 43Q65 37 67 24z" fill="#86817b"/><path d="M87 20Q94 34 90 43Q81 37 79 24z" fill="#86817b"/><path d="M60 24Q56 33 58 39Q64 34 65 26zM86 24Q90 33 88 39Q82 34 81 26z" fill="#e8a9b0"/>
        <path d="M54 0Q52 22 73 25Q94 22 92 0z" fill="url(#bush-g-pos)"/><ellipse cx="73" cy="8" rx="9.5" ry="6.5" fill="#e9e5dd"/><ellipse cx="73" cy="4.8" rx="3.6" ry="2.5" fill="#e8848e"/><path d="M73 7.300v3M70 11q3 1.5 6 0" stroke="#7a5a5a" stroke-width=".8" fill="none"/>
        <ellipse cx="63.5" cy="16" rx="5.8" ry="5.4" fill="#5f5a55"/><ellipse cx="82.5" cy="16" rx="5.8" ry="5.4" fill="#5f5a55"/><g class="bush-eye"><circle cx="63.5" cy="16" r="4.2" fill="#2a1a10"/><circle cx="82.5" cy="16" r="4.2" fill="#2a1a10"/><circle cx="63.5" cy="16" r="2.6" fill="#0e0907"/><circle cx="82.5" cy="16" r="2.6" fill="#0e0907"/><circle cx="65" cy="17.5" r="1.2" fill="#fff"/><circle cx="84" cy="17.5" r="1.2" fill="#fff"/></g>
        <path d="M64 8h-13M64 10l-12 4M82 8h13M82 10l12 4" stroke="#f1eee8" stroke-width=".7" fill="none"/></g>
      <g class="bush-p bush-tsw"><path d="M32-4Q26 40 36 64Q44 82 32 90Q22 92 22 82" stroke="#1f1a17" stroke-width="15" stroke-linecap="round" fill="none"/><path d="M32-4Q28 18 30 36" stroke="#8d8882" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M30 36Q32 52 37 64" stroke="#4a443f" stroke-width="13" stroke-linecap="butt" fill="none" opacity=".6"/>
        <path d="M27 6Q24 30 30 52M36 60Q42 76 34 84" stroke="#5f5953" stroke-width="1.6" stroke-linecap="round" fill="none" stroke-dasharray="5 4"/></g></svg>` },
    { id: 'frogmouth', ms: 18000, move: 'bush-perch', weight: 1.6, when: dusk, art: html`<svg viewBox="0 0 124 106" width="106"><defs>${G('bush-g-fm', '#aaa297', '#6a6258')}</defs>
      <path d="M16-2Q30 46 106 66" stroke="#55423a" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M19 0Q33 43 104 62.5" stroke="#8a7462" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M26 22l4 3M40 40l5 1M60 51l5 0M82 60l5 0" stroke="#3a2c26" stroke-width="1.4" stroke-linecap="round"/>
      <g class="bush-p bush-fst"><path d="M58 64L54 82L63 82L69 67z" fill="#6a6258"/><path d="M56 73h8M55 78h9" stroke="#3f3932" stroke-width="1.3"/>
        <path d="M54 62Q44 34 54 16Q60 8 68 14Q80 34 74 64Q64 70 54 62z" fill="url(#bush-g-fm)"/><path d="M66 24Q77 40 73 61Q68 50 66 24z" fill="#5f574e"/>
        <path d="M56 30l1 9M61 27l1 11M57 44l1 9M63 46l0 9M60 56l0 6M53 38l1 8M69 44l0 8" stroke="#3f3932" stroke-width="1.1" stroke-linecap="round"/><g fill="#d9d2c4" opacity=".7"><circle cx="59" cy="41" r="1.1"/><circle cx="64" cy="42" r="1"/><circle cx="56" cy="55" r="1"/><circle cx="66" cy="57" r="1.1"/><circle cx="62" cy="33" r=".9"/></g>
        <path d="M50 20Q61 13 72 20Q61 25 50 20z" fill="#7d756b"/><path d="M51 20Q61 22.5 71 20" stroke="#3f3932" stroke-width=".8" fill="none"/><path d="M60 14l1-6M62.5 14l2-5M58 14l-1-5" stroke="#5f574e" stroke-width=".9" stroke-linecap="round"/>
        <circle cx="55.5" cy="16.5" r="3.6" fill="#f0b21e"/><circle cx="66.5" cy="16.5" r="3.6" fill="#f0b21e"/><g class="bush-fp"><circle cx="55.5" cy="16.5" r="1.7" fill="#0e0907"/><circle cx="66.5" cy="16.5" r="1.7" fill="#0e0907"/></g>
        <ellipse class="bush-p bush-fe1" cx="55.5" cy="16.5" rx="4.3" ry="4.3" fill="#9a9287"/><ellipse class="bush-p bush-fe2" cx="66.5" cy="16.5" rx="4.3" ry="4.3" fill="#9a9287"/></g></svg>` },
    // --- weather, and music --------------------------------------------------------------------------------------------
    { id: 'willy', ms: 15000, move: 'across foot', weight: 2, when: sunny, art: html`<svg viewBox="0 0 80 104" width="74" fill="rgba(222,172,130,.2)" stroke="rgba(196,138,96,.5)" stroke-width="1.6">
      <g class="bush-ww1"><ellipse cx="40" cy="97" rx="6" ry="2.6"/><ellipse cx="40" cy="74" rx="12" ry="4.4"/><ellipse cx="40" cy="50" rx="19" ry="6"/><ellipse cx="40" cy="26" rx="27" ry="7"/></g><g class="bush-ww2"><ellipse cx="40" cy="86" rx="9" ry="3.6"/><ellipse cx="40" cy="62" rx="15.5" ry="5.2"/><ellipse cx="40" cy="38" rx="23" ry="6.6"/><ellipse cx="40" cy="12" rx="32" ry="8"/></g>
      <ellipse cx="40" cy="100" rx="20" ry="3" fill="rgba(214,150,104,.5)" stroke="none"/>
      <g stroke="none"><path class="bush-wl" style="--d:-.2s" d="M33 24q7-6 14 0q-7 6-14 0z" fill="#8a9a5b"/><path class="bush-wl" style="--d:-.9s" d="M34 52q6-5 12 0q-6 5-12 0z" fill="#b08d3e"/><path class="bush-wl" style="--d:-1.500s" d="M36 80q4-4 8 0q-4 4-8 0z" fill="#8a9a5b"/><circle class="bush-wl" style="--d:-.6s" cx="40" cy="38" r="1.6" fill="#7a5c30"/></g></svg>` },
    { id: 'band', ms: 16000, move: 'bush-pop', weight: 3, when: (c) => c.tod !== 'night' && (c.weekday === 5 || c.weekday === 6 || c.weekday === 0), art: html`<svg viewBox="0 0 146 92" width="124" style="margin:0 -20px"><defs>${G('bush-g-frg', '#86b44e', '#44742a')}${G('bush-g-brs', '#f8e08a', '#a2761c')}</defs>
      <g fill="#fffdf2" opacity=".85"><g class="bush-nt" style="--d:-.3s"><path d="M70 18v-16l10 3.500v4l-8-2.500v11z"/><ellipse cx="66.5" cy="18.5" rx="4.4" ry="3.3"/></g><g class="bush-nt" style="--d:-1.400s"><path d="M108 16v-15l10 3.500v4l-8-2.500v10z"/><ellipse cx="104.5" cy="16.5" rx="4.4" ry="3.3"/></g></g>
      <g class="bush-p bush-sw1"><path d="M8 92Q2 74 16 68Q30 70 32 92z" fill="#3f6a28"/><path d="M6 92Q0 62 20 54Q40 50 50 62Q56 74 50 92z" fill="url(#bush-g-frg)"/><path d="M30 92Q28 72 40 65Q50 67 50 92z" fill="#ece5c2"/><g fill="#c9a844" opacity=".75"><ellipse cx="16" cy="66" rx="5" ry="3"/><ellipse cx="26" cy="58" rx="4" ry="2.4"/><ellipse cx="12" cy="78" rx="3" ry="4"/></g>
        <path d="M18 51Q22 37 40 37Q54 39 58 49Q52 57 38 58Q24 59 18 51z" fill="url(#bush-g-frg)"/><path d="M24 53Q40 58 57 49Q52 57 38 58Q28 58.5 24 53z" fill="#ece5c2"/><path d="M22 47Q34 41 54 46" stroke="#2f4a1c" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="42" cy="40" r="5.2" fill="#6a9a3e"/><circle cx="43" cy="40.5" r="3" fill="#c9a02c"/><ellipse cx="43" cy="40.5" rx="2" ry="1" fill="#0e0907"/><circle cx="44" cy="39.5" r=".7" fill="#fff"/>
        <ellipse class="bush-p bush-thr" cx="45" cy="60" rx="6" ry="5" fill="#f4eed4"/>
        <path d="M57 49L84 41" stroke="#a87e22" stroke-width="3.6" stroke-linecap="round"/><path d="M58 48.300L84 40.5" stroke="#f8e69a" stroke-width="1" stroke-linecap="round"/><path d="M62 48.500Q60 55 70 53L80 50" stroke="#b8902a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M82 35Q92 31 98 26L100 47Q92 45 84 45z" fill="url(#bush-g-brs)"/><ellipse cx="99" cy="36.5" rx="2.4" ry="10.5" fill="#7a5a14"/><path d="M64 46.500v-7M69 45v-7M74 43.500v-7" stroke="#c9a02c" stroke-width="2.6" stroke-linecap="round"/><g fill="#fbf3d4"><circle cx="64" cy="39" r="1.5"/><circle cx="69" cy="37.5" r="1.5"/><circle cx="74" cy="36" r="1.5"/></g>
        <path d="M40 63L54 53L60 52" stroke="#6a9a3e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
      <g class="bush-p bush-sw2"><path d="M120 76L110 92M127 76L138 92M119 62L108 74M128 62L139 72" stroke="#6a9238" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M118 92Q112 66 120 48L126 48Q134 66 128 92z" fill="#7fa83e"/><path d="M123 50Q120 70 123 92" stroke="#b9d87a" stroke-width="1" fill="none"/><path d="M118 92Q112 66 120 48Q116 68 122 92z" fill="#5a8230"/>
        <path d="M121 48L122.5 31L127.5 31L126 48z" fill="#8ab848"/><path d="M118.5 31Q125 22 131.5 31L125 35.500z" fill="#9ac858"/><circle cx="120.5" cy="29.5" r="2.3" fill="#c9b84a"/><circle cx="129.5" cy="29.5" r="2.3" fill="#c9b84a"/><circle cx="120.8" cy="29.8" r=".8" fill="#2a1a10"/><circle cx="129.2" cy="29.8" r=".8" fill="#2a1a10"/><path d="M122 25Q118 16 112 14M128 25Q132 16 138 15" stroke="#6a9238" stroke-width=".8" fill="none"/>
        <path d="M122 34L107 71" stroke="#17171a" stroke-width="4.6" stroke-linecap="round"/><path d="M123 35L109 69" stroke="#55555c" stroke-width=".9"/><path d="M108 68L100 77L111 80.500L111.5 72z" fill="#17171a"/><path d="M118.5 40l3.6 1.500M114 51.500l3.6 1.500M109.5 63l3.6 1.5" stroke="#d9dde0" stroke-width="1.3"/><g fill="#d9dde0"><circle cx="117.5" cy="46" r="1"/><circle cx="115" cy="57" r="1"/><circle cx="112.5" cy="59.5" r=".9"/></g>
        <path d="M123 37L113 45L111 53M124.5 41L116 54L113 61" stroke="#8ab848" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g></svg>` },
    // --- small, quick, and in front of the page ---------------------------------------------------------------------
    { id: 'butterfly', ms: 11000, move: 'flit', weight: 2, front: true, flip: false, when: sunny, y: [4, 12], art: html`<svg viewBox="0 0 56 46" width="38"><g class="bush-flap">${[0, 1].map((i) => svg`<g transform=${i ? 'translate(56) scale(-1 1)' : ''}><path d="M27 21Q14 2 4 6Q-1 14 8 23Q18 25 27 23z" fill="#1c1410"/><path d="M26 21Q15 6 7 9Q5 14 10 20.500Q18 22 26 21z" fill="#e8791e"/><path d="M26 21L8 10M26 21L7 16" stroke="#1c1410" stroke-width=".9"/><path d="M27 23Q14 25 10 33Q14 44 22 39Q29 33 27 23z" fill="#1c1410"/><path d="M26 25Q16 27 13 33Q16 39 21 37Q26 32 26 25z" fill="#f0902a"/><path d="M26 25L14 33M26 25L20 37" stroke="#1c1410" stroke-width=".8"/><g fill="#fff"><circle cx="5" cy="9" r=".9"/><circle cx="4.5" cy="13" r=".8"/><circle cx="6" cy="17" r=".8"/><circle cx="12" cy="36" r=".8"/><circle cx="16" cy="40" r=".8"/><circle cx="9" cy="6.5" r=".7"/></g></g>`)}</g><ellipse cx="28" cy="23" rx="1.9" ry="10" fill="#1c1410"/><path d="M27.5 14Q25 7 22 5M28.5 14Q31 7 34 5" stroke="#1c1410" stroke-width=".7" fill="none"/><g fill="#fff"><circle cx="28" cy="15" r=".6"/><circle cx="28" cy="18" r=".6"/></g></svg>` },
    { id: 'leaf', ms: 11000, move: 'down', weight: 2, front: true, flip: false, art: html`${leafArt('#8a9a5b', '#5f6f3a', 32)}` },
    { id: 'bee', ms: 9000, move: 'bush-bee', weight: 1.6, front: true, when: sunny, y: [5, 9], art: html`<svg viewBox="0 0 36 28" width="28"><path class="bush-hum" d="M18 12Q8-2 4 2Q4 9 16 13z" fill="#fff"/><path class="bush-hum" style="animation-delay:-.04s" d="M20 12Q16-3 11-1Q10 6 18 13z" fill="#eaf4ff"/>
      <path d="M12 21l-2 4M16 22l0 4M21 21l2 4" stroke="#17171a" stroke-width=".9" stroke-linecap="round"/><ellipse cx="12" cy="16" rx="8.5" ry="5.8" fill="#17171a"/><path d="M6.5 11.500q-1.2 4.5 0 9M10.3 10.400q-1.2 5.6 0 11.200M14.3 10.600q-1 5.4 0 10.800M17.8 12q-.7 4 0 8" stroke="#7fd0f0" stroke-width="1.7" fill="none"/>
      <circle cx="22.5" cy="14.5" r="5.6" fill="#c98a2a"/><path d="M19 11.500q3.5-2.5 7 0" stroke="#f0c060" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="29" cy="15" r="3.7" fill="#2a2a22"/><ellipse cx="30" cy="14.3" rx="1.9" ry="2.5" fill="#9ac04a"/><path d="M31 12q3-3 4-2M30.5 18l1.5 4" stroke="#17171a" stroke-width=".7" fill="none" stroke-linecap="round"/></svg>` },
  ] as Visitor[],
};
