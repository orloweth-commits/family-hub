import { css, html, svg } from 'lit';
import { rnd, type Ctx, type Scene } from './types';

/**
 * OBSIDIAN: the cabin at night. Behind the Obsidian look, never in front of it.
 *  - a starlight headliner: fine pinpoints across the top of the screen, a few of them breathing very slowly
 *  - a horizon far below: one line of champagne light, and under it a floor of hairline perspective lines that slide gently towards you
 *  - now and then, one quiet visitor: a shooting star across the headliner, a far-off aircraft's lights, or a light trail racing the horizon
 * Everything is hairline-thin and low in contrast so the panels on top stay the brightest thing on the screen.
 */

const pins = (n: number, seed: number, colours: string[], y1: number): string => {
  const r = rnd(seed);
  return Array.from({ length: n }, () => `${(r() * 100).toFixed(2)}vw ${(r() * y1).toFixed(2)}vh 0 ${r() < 0.12 ? 0.5 : 0}px ${colours[Math.floor(r() * colours.length)]}`).join(',');
};
const STILL = pins(120, 41, ['rgba(255,248,235,.42)', 'rgba(255,240,214,.3)', 'rgba(220,235,255,.32)'], 46);
const BREATH = pins(26, 77, ['rgba(255,246,226,.85)', 'rgba(214,236,255,.8)'], 40);
const BREATH2 = pins(18, 913, ['rgba(255,236,200,.8)', '#fff'], 34);

/** the floor: lines that run to a vanishing point at the horizon, and cross lines that slide towards the viewer */
const FLOOR = svg`
  ${Array.from({ length: 25 }, (_, i) => { const x = -60 + i * 9; return svg`<line x1="50" y1="0" x2=${x} y2="40" class="ob-ray" opacity=${0.55 - Math.abs(i - 12) * 0.03}></line>`; })}`;

export const obsidian: Scene = {
  css: css`
    .ob-w { position: absolute; inset: 0; }
    .ob-w i { position: absolute; display: block; left: 0; top: 0; width: 1px; height: 1px; border-radius: 50%; }
    .ob-p1 { opacity: .8; }
    .ob-p2 { animation: ob-tw 9s ease-in-out infinite alternate; }
    .ob-p3 { width: 1.5px; height: 1.5px; animation: ob-tw 13s ease-in-out -5s infinite alternate; }
    @keyframes ob-tw { from { opacity: .15; } to { opacity: .95; } }
    /* the headliner fades out before it reaches the page's middle */
    .ob-head { position: absolute; inset: 0; -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 22%, transparent 52%); mask-image: linear-gradient(to bottom, #000 0, #000 22%, transparent 52%); }
    /* the horizon and the floor */
    .ob-hz { position: absolute; left: 0; right: 0; top: 78%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,170,40,.22) 22%, rgba(255,214,140,.42) 50%, rgba(255,170,40,.22) 78%, transparent); box-shadow: 0 0 24px 2px rgba(255,170,40,.12); }
    .ob-hz::after { content: ''; position: absolute; top: -1px; height: 3px; width: 18%; left: -20%; border-radius: 2px; background: linear-gradient(90deg, transparent, rgba(56,182,255,.9), #fff, rgba(255,170,40,.9), transparent); filter: blur(.5px); box-shadow: 0 0 14px rgba(56,182,255,.6); animation: ob-zip 11s cubic-bezier(.5,0,.3,1) infinite; }
    @keyframes ob-zip { 0%, 30% { left: -20%; opacity: 0; } 35% { opacity: 1; } 75% { opacity: 1; } 80%, 100% { left: 102%; opacity: 0; } }
    .ob-glow { position: absolute; left: 10%; right: 10%; top: calc(78% - 70px); height: 140px; background: radial-gradient(50% 50% at 50% 50%, rgba(255,170,40,.07), transparent 70%); }
    .ob-floor { position: absolute; left: 0; right: 0; top: 78%; bottom: 0; overflow: hidden; -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,.9), transparent 85%); mask-image: linear-gradient(to bottom, rgba(0,0,0,.9), transparent 85%); perspective: 300px; }
    .ob-floor svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .ob-ray { stroke: rgba(56,182,255,.18); stroke-width: .08; vector-effect: non-scaling-stroke; }
    .ob-grid { position: absolute; left: -10%; right: -10%; top: 0; height: 200%; transform-origin: 50% 0; transform: rotateX(62deg);
      background: repeating-linear-gradient(to bottom, rgba(56,182,255,.16) 0 1px, transparent 1px 46px); animation: ob-run 7s linear infinite; }
    @keyframes ob-run { from { background-position: 0 0; } to { background-position: 0 46px; } }
    /* visitors */
    .ob-star { width: 180px; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,246,226,.0) 10%, rgba(255,246,226,.85)); border-radius: 1px; filter: drop-shadow(0 0 3px rgba(255,214,140,.8)); }
    .ob-plane { animation: ob-blink 1.6s steps(1) infinite; }
    @keyframes ob-blink { 0%, 70% { opacity: 1; } 71%, 100% { opacity: .25; } }
    .ob-trail { left: 0; top: 77.6%; animation: ob-race var(--t) cubic-bezier(.45,0,.2,1) both; }
    @keyframes ob-race { from { transform: translateX(-30vw); } to { transform: translateX(130vw); } }
    .ob-trail i { position: static; width: 26vw; height: 2px; border-radius: 1px; background: linear-gradient(90deg, transparent, rgba(56,182,255,.15) 30%, rgba(56,182,255,.9) 96%, #fff); box-shadow: 0 0 10px rgba(56,182,255,.6); }
  `,
  always: (c: Ctx) => html`<div class="ob-w" style=${c.tod === 'day' ? '' : 'opacity:.8'}>
    <div class="ob-head"><i class="ob-p1" style="box-shadow:${STILL}"></i><i class="ob-p2" style="box-shadow:${BREATH}"></i><i class="ob-p3" style="box-shadow:${BREATH2}"></i></div>
    <div class="ob-glow"></div>
    <div class="ob-floor"><div class="ob-grid"></div><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">${FLOOR}</svg></div>
    <div class="ob-hz"></div>
  </div>`,
  gap: [70_000, 200_000],
  cast: [
    { id: 'shooting-star', ms: 2600, move: 'streak', y: [2, 12], weight: 2, art: html`<div class="ob-star"></div>` },
    { id: 'far-aircraft', ms: 70_000, move: 'across', y: [4, 14], weight: 1,
      art: html`<svg class="ob-plane" width="22" height="8" viewBox="0 0 22 8" aria-hidden="true"><circle cx="3" cy="4" r="1.2" fill="#ff6b5e"></circle><circle cx="19" cy="4" r="1.2" fill="#38b6ff"></circle><circle cx="11" cy="4" r=".9" fill="#fff"></circle></svg>` },
    { id: 'light-trail', ms: 5200, move: 'ob-trail', flip: false, weight: 1, when: (c) => c.tod !== 'day', art: html`<i></i>` }
  ]
};
