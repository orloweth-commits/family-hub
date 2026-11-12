import { html, type TemplateResult } from 'lit';

/** Confetti burst: at most 24 pieces that fall and spin inside the box they are rendered in, done within --m-5 (900 ms).
 *  Nothing falls in calm mode or with reduce-motion. Re-render with a new `seed` to replay. */
export const confetti = (seed: number, count = 24): TemplateResult => {
  count = Math.min(24, count);
  const cols = ['var(--p-1)', 'var(--p-2)', 'var(--p-3)', 'var(--p-4)', 'var(--p-5)', 'var(--accent)', 'var(--primary)'];
  let r = seed * 9301 + 49297;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  return html`<div class="confetti" aria-hidden="true">${Array.from({ length: count }, () => {
    const x = rnd() * 100, d = 0.65 + rnd() * 0.25, delay = rnd() * 0.1, w = 6 + rnd() * 8, rot = rnd() * 720 - 360, drift = rnd() * 160 - 80;
    return html`<i style="left:${x}%;width:${w}px;height:${w * (rnd() > 0.5 ? 0.45 : 1)}px;background:${cols[Math.floor(rnd() * cols.length)]};border-radius:${rnd() > 0.6 ? '50%' : '2px'};
      animation-duration:calc(var(--m-5, 900ms) * ${d.toFixed(2)});animation-delay:calc(var(--m-5, 900ms) * ${delay.toFixed(2)});--rot:${rot}deg;--drift:${drift}px"></i>`;
  })}</div>`;
};

export const fxCss = `
  .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 50; container-type: size; opacity: var(--m-d, 1); }
  .confetti i { position: absolute; top: -20px; animation-name: fall; animation-timing-function: cubic-bezier(.25,.6,.45,1); animation-fill-mode: forwards; opacity: 0; }
  @keyframes fall { 0% { opacity: 1; transform: translate(0, 0) rotate(0); } 85% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--drift), calc(100cqh + 20px)) rotate(var(--rot)); } }
  .burst { position: absolute; pointer-events: none; font-family: 'Bricolage Grotesque', sans-serif; font-weight: var(--w-heavy, 800); font-size: 30px; color: var(--ok);
    text-shadow: 0 2px 10px rgba(0,0,0,.18); animation: burst var(--m-5, 900ms) cubic-bezier(.2,.8,.2,1) forwards; z-index: 20; }
  @keyframes burst { 0% { opacity: 0; transform: translateY(calc(10px * var(--m-d, 1))) scale(calc(1 - .4 * var(--m-d, 1))); } 20% { opacity: 1; transform: translateY(calc(-6px * var(--m-d, 1))) scale(calc(1 + .15 * var(--m-d, 1))); } 100% { opacity: 0; transform: translateY(calc(-70px * var(--m-d, 1))); } }
  .shake { animation: shake var(--m-4, 400ms); }
  @keyframes shake { 20%, 60% { transform: translateX(calc(-6px * var(--m-d, 1))) rotate(calc(-2deg * var(--m-d, 1))); } 40%, 80% { transform: translateX(calc(6px * var(--m-d, 1))) rotate(calc(2deg * var(--m-d, 1))); } }
  .shimmer { position: relative; overflow: hidden; }
  .shimmer::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.45) 50%, transparent 70%); transform: translateX(-100%); animation: shimmer 2.8s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  @keyframes shimmer { 60%, 100% { transform: translateX(100%); } }
  .xp { height: 10px; border-radius: 5px; background: var(--track); overflow: hidden; }
  .xp > div { height: 100%; border-radius: 5px; background: linear-gradient(90deg, var(--primary), var(--accent)); transition: width var(--mt-5, 900ms) cubic-bezier(.2,.8,.2,1); }
`;
