import { css, html, nothing, svg } from 'lit';
import { dot, field, spots, type Scene } from './types';


export const fridge: Scene = {
  css: css`
    .wings { transform-box: fill-box; transform-origin: center; animation: wings .22s ease-in-out infinite alternate; }
    @keyframes wings { from { transform: scaleX(1); } to { transform: scaleX(.35); } }
    .march { animation: march .3s steps(2, jump-none) infinite alternate; } .march.late { animation-delay: -.15s; } @keyframes march { to { transform: translateY(-1.5px); } }
  `,
  always: (c) => nothing,
  cast: [
    { id: 'ant', ms: 26000, move: 'across foot', art: svg`<svg viewBox="0 0 120 16" width="112" fill="#2b2118"><g class="march"><circle cx="8" cy="9" r="3"/><circle cx="14" cy="9" r="2.4"/><circle cx="20" cy="8.5" r="3.4"/></g><g class="march late"><circle cx="48" cy="9" r="3"/><circle cx="54" cy="9" r="2.4"/><circle cx="60" cy="8.5" r="3.4"/></g><g class="march"><circle cx="90" cy="9" r="3"/><circle cx="96" cy="9" r="2.4"/><circle cx="102" cy="8.5" r="3.4"/></g></svg>` },
    { id: 'fly', ms: 9000, move: 'buzz', art: svg`<svg viewBox="0 0 24 20" width="20"><g class="wings"><ellipse cx="8" cy="7" rx="6" ry="3.4" fill="#cfd8e6" opacity=".8"/><ellipse cx="16" cy="7" rx="6" ry="3.4" fill="#cfd8e6" opacity=".8"/></g><ellipse cx="12" cy="12" rx="4.2" ry="5.4" fill="#2b2b33"/></svg>`, flip: false, y: [4, 14] },
    { id: 'gecko', ms: 9000, move: 'peek', art: svg`<svg viewBox="0 0 70 60" width="64"><path d="M70 30C52 22 40 14 26 16c-8 1-12 8-10 14s8 10 18 9c12-1 24-5 36-9z" fill="#7cb518"/><path d="M34 16l-6-10M46 20l-2-12M34 39l-6 12M48 36l0 12" stroke="#5c8a12" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="24" r="4" fill="#fff"/><circle cx="21" cy="24" r="2" fill="#123"/><circle cx="24" cy="34" r="4" fill="#fff"/><circle cx="23" cy="34" r="2" fill="#123"/></svg>`, flip: false, y: [20, 65] },
  ],
};
