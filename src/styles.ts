import { css } from 'lit';
import { lookCss } from './looks';

export const styles = css`
  :host { display: block; height: 100%; }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; border: 0; background: transparent; cursor: pointer; padding: 0; }
  h1, h2, .display { font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif; letter-spacing: -0.025em; margin: 0; }

  .fh {
    position: relative; overflow: hidden; overflow: clip;
    zoom: var(--z, 1); height: calc((100vh - var(--header-height, 0px)) / var(--z, 1)); min-height: 600px;
    padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif; color: var(--ink);
    background: var(--bg) center / cover no-repeat; -webkit-font-smoothing: antialiased;
    transition: color .45s ease;
  }
  .fh::before { content: ''; position: absolute; inset: 0; background: var(--tod, transparent); pointer-events: none; transition: background 60s linear; }
  .fh.rainy::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .18;
    background: repeating-linear-gradient(105deg, transparent 0 18px, rgba(255,255,255,.55) 18px 19px, transparent 19px 46px); animation: rain 1.4s linear infinite; }
  @keyframes rain { from { background-position: 0 0; } to { background-position: -40px 120px; } }
  .fh > header, .fh > .body, .fh > nav { position: relative; }
  /* calm mode: looping motion runs once, looks drop their tilt */
  .fh[data-calm] { --loops: 1; --tilt: 0; }
  .fh.idle *, .fh.idle::after { animation-play-state: paused !important; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .001s !important; animation-iteration-count: 1 !important; transition-duration: .001s !important; } }
  .glass {
    background: var(--glass); -webkit-backdrop-filter: blur(28px) saturate(170%); backdrop-filter: blur(28px) saturate(170%);
    border: 1px solid var(--glass-line); box-shadow: inset 0 1px 0 var(--glass-line), var(--shadow);
    transition: background-color .45s ease, border-color .45s ease;
    animation: rise .6s cubic-bezier(.2,.8,.2,1) both;
  }
  @keyframes rise { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: none; } }
  .tap { transition: transform .18s ease, background-color .3s ease, box-shadow .25s ease; }
  .tap:active { transform: scale(0.95); }
  .fade { animation: fadeIn .35s cubic-bezier(.2,.8,.2,1); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .live { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); animation: live 2s ease-out infinite; animation-iteration-count: var(--loops, infinite); flex-shrink: 0; }
  @keyframes live { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ok) 60%, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }
  .muted { color: var(--ink2); }
  .label { font-size: 12px; font-weight: 600; color: var(--ink2); text-transform: uppercase; letter-spacing: .05em; }
  .pill { height: 44px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
  .round { width: 44px; height: 44px; border-radius: 50%; background: var(--chip); display: inline-flex; align-items: center; justify-content: center; }
  .primary { background: var(--primary); color: var(--on-primary); }
  .avatar { border-radius: 50%; color: var(--on-person); font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  svg.i { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

  /* header */
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; }
  .clock { display: flex; flex-direction: column; min-width: 230px; }
  .clock .hm { font-size: 54px; font-weight: 700; line-height: 1; }
  .kids { display: flex; gap: 6px; padding: 6px; border-radius: 999px; }
  .kid { display: flex; align-items: center; gap: 10px; padding: 6px 16px 6px 6px; border-radius: 999px; background: var(--chip); font-weight: 600; font-size: 15px; }
  .right { display: flex; align-items: center; gap: 10px; }
  .weather { display: flex; align-items: center; gap: 10px; padding: 9px 16px; border-radius: 999px; }
  .badge { padding: 5px 10px; border-radius: 999px; background: color-mix(in srgb, #f59e0b 22%, var(--chip)); font-size: 13px; font-weight: 800; white-space: nowrap; }
  .badge.hot { background: color-mix(in srgb, #dc2626 22%, var(--chip)); }
  /* one row: chips that do not fit wrap out of sight, lowest priority first */
  .capsule { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-content: flex-start; justify-content: center; gap: 8px; height: 46px; overflow: hidden; }
  .cap { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 16px; border-radius: 999px; background: var(--glass); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
    border: 1px solid var(--glass-line); font-size: 16px; font-weight: 700; white-space: nowrap; max-width: 380px; overflow: hidden; text-overflow: ellipsis; animation: fadeIn .4s ease both; }
  .cap b { font-variant-numeric: tabular-nums; font-size: 18px; }
  .cap.hot { background: #dc2626; color: #fff; border-color: #dc2626; animation: pulse 1.2s ease-in-out infinite; }
  .cap.ok { background: color-mix(in srgb, var(--ok) 25%, var(--glass)); }
  .presence { display: flex; gap: 4px; padding: 7px 8px; border-radius: 999px; }

  /* body */
  .body { display: flex; gap: 16px; flex: 1; min-height: 0; }
  .planner { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
  .bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .seg { display: flex; padding: 3px; border-radius: 12px; background: var(--track); }
  .seg button { height: 40px; min-width: 56px; padding: 0 16px; border-radius: 9px; font-size: 14px; font-weight: 500; color: var(--ink2); }
  .seg button[aria-pressed='true'] { background: var(--chip-strong); color: var(--ink); font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; font-weight: 600; color: var(--ink2); }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

  .week { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
  .col { display: flex; flex-direction: column; gap: 6px; padding: 8px 6px; border-radius: 16px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .col.today { background: var(--chip-strong); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
  .dayhead { display: flex; align-items: center; gap: 6px; padding: 2px 2px 4px; }
  .num { font-size: 17px; font-weight: 800; padding: 0 4px; }
  .pchip { margin-left: auto; font-size: 13px; opacity: .7; }
  .today .num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: var(--on-primary); display: inline-flex; align-items: center; justify-content: center; padding: 0; font-size: 14px; }
  .ev { border-radius: 12px; padding: 7px 9px 7px 10px; display: flex; flex-direction: column; gap: 2px; background: color-mix(in srgb, var(--c) 24%, var(--chip-soft)); border-left: 5px solid var(--c); }
  .ev .t { font-size: 12px; font-weight: 700; color: var(--ink2); }
  .ev .n { font-size: 15px; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; hyphens: auto; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .evs { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
  .evs > .ev { flex-shrink: 0; }
  .ell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .evcap { min-width: 0; max-width: 100%; }
  .ev .w { font-size: 12px; font-weight: 600; color: var(--ink2); }
  .ev.priv { flex-direction: row; gap: 6px; background: transparent; border-left: 0; padding: 2px 6px; opacity: .6; }
  .ev.past { opacity: .55; }
  .col.today .ev.past .w { display: none; }
  .ev.next { box-shadow: 0 0 0 2px var(--primary); }
  .dayrow.past { opacity: .55; }
  .more { font-size: 13px; font-weight: 700; color: var(--ink2); min-height: 40px; padding: 6px 6px; border-radius: 10px; background: var(--chip-soft); text-align: left; }
  .xpbar { height: 8px; border-radius: 4px; background: var(--track); overflow: hidden; }
  .xpbar > div { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 4px; transition: width .8s; }

  .daylist { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
  .dayrow { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 16px; }

  .month { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); gap: 6px; }
  .mhead { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink2); padding: 0 6px; }
  .cell { display: flex; flex-direction: column; gap: 3px; padding: 6px 7px; border-radius: 12px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .cell.out { background: var(--chip-faint); color: var(--ink3); }
  .cell.today { background: var(--chip-strong); }
  .cell .mev { display: flex; align-items: center; gap: 5px; flex-shrink: 0; line-height: 1.3; font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--ink2); }

  aside { width: 272px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
  .card { border-radius: 24px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .art { width: 56px; height: 56px; border-radius: 12px; background: linear-gradient(135deg, var(--accent), var(--primary)) center / cover; flex-shrink: 0; }
  .progress { height: 4px; border-radius: 2px; background: var(--track); }
  .progress > div { height: 4px; border-radius: 2px; background: var(--ink); }
  .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .np button.tap, .timerrow button { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .grid3 button { height: 44px; border-radius: 12px; background: var(--chip); font-size: 14px; font-weight: 600; }
  .rem { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; }
  .ring { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--ink3); flex-shrink: 0; }

  /* dock */
  nav.dock { align-self: center; display: flex; align-items: center; gap: 4px; padding: 8px; border-radius: 26px; }
  .dock .item { min-width: 74px; height: 68px; padding: 0 6px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 13px; font-weight: 600; }
  .dock .item[aria-current='page'] { background: var(--chip-strong); font-weight: 800; }
  .dock .kidbtn { min-width: 80px; gap: 2px; }
  .dock .kidbtn .avatar { overflow: hidden; }
  .dock .kidbtn[aria-current='page'] { box-shadow: inset 0 0 0 3px var(--kidc); }
  .dock .called { color: var(--ok); }
  .dock .sep { width: 1px; height: 36px; background: var(--track); margin: 0 6px; }
  .dock .cta { height: 60px; padding: 0 20px; border-radius: 18px; display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; }

  /* sheets, toasts, night */
  .scrim { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.3); }
  .sheet { position: relative; width: min(1000px, 92%); border-radius: 32px; padding: 26px 28px 24px; display: flex; flex-direction: column; gap: 18px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
  @keyframes sheet { from { opacity: 0; transform: scale(.94) translateY(12px); } to { opacity: 1; transform: none; } }
  .themes { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
  .tcard { display: flex; flex-direction: column; gap: 6px; padding: 8px 8px 12px; border-radius: 22px; background: var(--chip); text-align: left; }
  .tcard[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); }
  .tprev { height: 120px; border-radius: 16px; display: flex; align-items: flex-end; gap: 5px; padding: 10px; background: var(--bg) center / cover; }
  .tprev span { width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,.85); }
  .looks { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .opt { min-width: 56px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .setrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 52px; }
  .setlabel { display: flex; flex-direction: column; line-height: 1.25; font-size: 16px; }
  .setlabel .muted { font-size: 13px; font-weight: 500; }
  .opt .sw { width: 46px; height: 28px; border-radius: 14px; background: var(--track); position: relative; flex-shrink: 0; transition: background-color .2s; }
  .opt .sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .2s; }
  .opt[aria-checked='true'] .sw { background: var(--ok); }
  .opt[aria-checked='true'] .sw::after { transform: translateX(18px); }
  .lprev { align-items: center; justify-content: center; }
  .lprev .lp { width: 46%; height: 62%; border-radius: 14px; box-shadow: none; background: rgba(255,255,255,.6); border: 1px solid rgba(255,255,255,.85); }
  .lprev .lp-fridge { border-radius: 2px; background: #fff2a1; border: 0; box-shadow: 0 5px 7px rgba(0,0,0,.2); transform: rotate(-3deg); }
  .lprev .lp-orbit { width: 78px; height: 78px; border-radius: 50%; background: transparent; border: 8px solid rgba(255,255,255,.16); border-top-color: #ffe08a; border-right-color: #7cb7ff; }
  .toast { position: absolute; left: 50%; bottom: 120px; transform: translateX(-50%); z-index: 20; padding: 14px 22px; border-radius: 999px; background: rgba(15,15,20,.88); color: #fff; font-size: 16px; font-weight: 600; animation: fadeIn .3s ease both; }
  .flash { position: absolute; inset: 0; z-index: 30; background: var(--chip-strong); pointer-events: none; animation: flash .7s ease forwards; }
  @keyframes flash { from { opacity: .9; } to { opacity: 0; } }
  .night { position: absolute; inset: 0; z-index: 40; padding: 56px 64px; display: flex; flex-direction: column; justify-content: space-between; color: #ffb26b; text-align: left;
    background: #000; animation: fadeIn .8s ease both; }
  .night .big { font-size: 168px; font-weight: 300; line-height: .9; font-variant-numeric: tabular-nums; opacity: .78; }
  .night .ndate { font-size: 26px; font-weight: 500; margin-top: 10px; opacity: .6; }
  .night .dglass { background: rgba(255,178,107,.06); border: 1px solid rgba(255,178,107,.18); -webkit-backdrop-filter: none; backdrop-filter: none; }
  .alarm { position: absolute; inset: 0; z-index: 45; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #fff;
    background: radial-gradient(circle, #f97316, #b91c1c); animation: alarmbg 1s ease-in-out infinite alternate !important; animation-play-state: running !important; }
  @keyframes alarmbg { from { filter: brightness(.9); } to { filter: brightness(1.15); } }
  .dglass { background: rgba(20,20,22,.42); -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,.12); }
  .breathe { animation: breathe 4s ease-in-out infinite; }
  @keyframes breathe { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
  @keyframes pulse { 50% { opacity: .75; } }

  ${lookCss}
`;
