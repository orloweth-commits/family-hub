import { css, html, nothing, svg } from 'lit';
import { dot, field, spots, type Scene } from './types';

const STARS = [field(46, 7, '#fff'), field(38, 91, '#dfe6ff'), field(30, 333, '#fff6d6')];

export const space: Scene = {
  css: css`
    .layer { position: absolute; left: 0; top: 0; width: 1px; height: 1px; border-radius: 50%; animation: twinkle var(--t, 4s) ease-in-out infinite alternate; }
    @keyframes twinkle { from { opacity: .15; } to { opacity: .95; } }
    .blink circle { animation: blink 1s steps(2, jump-none) infinite alternate; } .blink circle:nth-child(even) { animation-delay: -.5s; }
    @keyframes blink { to { opacity: .25; } }
    .flame { transform-box: fill-box; transform-origin: right center; animation: flame .16s linear infinite alternate; } @keyframes flame { to { transform: scaleX(.55); } }
  `,
  always: (c) => html`${STARS.map((b, i) => html`<i class="layer" style="box-shadow:${b};--t:${[3.1, 4.7, 6.3][i]}s;animation-delay:${-i * 1.3}s"></i>`)}`,
  cast: [
    { id: 'shoot', ms: 1400, move: 'streak', art: svg`<svg viewBox="0 0 120 8" width="150"><defs><linearGradient id="sg"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="120" height="2" y="3" rx="1" fill="url(#sg)"/><circle cx="118" cy="4" r="2.4" fill="#fff"/></svg>`, weight: 3 },
    { id: 'saucer', ms: 16000, move: 'across wobble', art: svg`<svg viewBox="0 0 90 48" width="84"><ellipse cx="45" cy="20" rx="17" ry="13" fill="#bfe9ff" opacity=".85"/><circle cx="41" cy="17" r="4" fill="#9ae6b4"/><circle cx="39.5" cy="16" r="1" fill="#123"/><circle cx="42.5" cy="16" r="1" fill="#123"/><ellipse cx="45" cy="28" rx="40" ry="10" fill="#8d96b8"/><ellipse cx="45" cy="26" rx="40" ry="8" fill="#c7cde6"/><g class="blink"><circle cx="17" cy="28" r="2.6" fill="#ffd166"/><circle cx="35" cy="31" r="2.6" fill="#ff6b6b"/><circle cx="55" cy="31" r="2.6" fill="#7bdff2"/><circle cx="73" cy="28" r="2.6" fill="#ffd166"/></g></svg>` },
    { id: 'rocket', ms: 11000, move: 'across', art: svg`<svg viewBox="0 0 70 34" width="62"><path class="flame" d="M14 17l-13-6 5 6-5 6z" fill="#ffb703"/><path d="M12 9h30c12 0 22 5 26 8-4 3-14 8-26 8H12z" fill="#eef1fb"/><path d="M12 9l-8-7h14zM12 25l-8 7h14z" fill="#e63946"/><circle cx="44" cy="17" r="5" fill="#7bdff2" stroke="#34405e" stroke-width="2"/></svg>` },
    { id: 'comet', ms: 7000, move: 'streak', art: svg`<svg viewBox="0 0 160 30" width="170"><defs><linearGradient id="cg"><stop offset="0" stop-color="#9bdcff" stop-opacity="0"/><stop offset="1" stop-color="#d9f3ff" stop-opacity=".9"/></linearGradient></defs><path d="M0 15L140 6v18z" fill="url(#cg)"/><circle cx="144" cy="15" r="8" fill="#eaf8ff"/></svg>` },
  ],
};
