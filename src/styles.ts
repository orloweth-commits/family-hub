import { css } from 'lit';

export const styles = css`
  :host { display: block; height: 100%; }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; border: 0; background: transparent; cursor: pointer; padding: 0; }
  h1, h2, .display { font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif; letter-spacing: -0.025em; margin: 0; }

  .fh {
    position: relative; overflow: hidden;
    height: calc(100vh - var(--header-height, 0px)); min-height: 640px;
    padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif; color: var(--ink);
    background: var(--bg) center / cover no-repeat; -webkit-font-smoothing: antialiased;
    transition: color .45s ease;
  }
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
  .live { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); animation: live 2s ease-out infinite; flex-shrink: 0; }
  @keyframes live { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ok) 60%, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }
  .muted { color: var(--ink2); }
  .label { font-size: 12px; font-weight: 600; color: var(--ink2); text-transform: uppercase; letter-spacing: .05em; }
  .pill { height: 40px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
  .round { width: 40px; height: 40px; border-radius: 50%; background: var(--chip); display: inline-flex; align-items: center; justify-content: center; }
  .primary { background: var(--primary); color: var(--on-primary); }
  .avatar { border-radius: 50%; color: var(--on-person); font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  svg.i { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

  /* header */
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; }
  .clock { display: flex; flex-direction: column; min-width: 250px; }
  .clock .hm { font-size: 48px; font-weight: 700; line-height: 1; }
  .kids { display: flex; gap: 6px; padding: 6px; border-radius: 999px; }
  .kid { display: flex; align-items: center; gap: 10px; padding: 6px 16px 6px 6px; border-radius: 999px; background: var(--chip); font-weight: 600; font-size: 15px; }
  .right { display: flex; align-items: center; gap: 10px; }
  .weather { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 999px; }
  .presence { display: flex; gap: 4px; padding: 7px 8px; border-radius: 999px; }

  /* body */
  .body { display: flex; gap: 16px; flex: 1; min-height: 0; }
  .planner { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
  .bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .seg { display: flex; padding: 3px; border-radius: 12px; background: var(--track); }
  .seg button { height: 34px; padding: 0 16px; border-radius: 9px; font-size: 14px; font-weight: 500; color: var(--ink2); }
  .seg button[aria-pressed='true'] { background: var(--chip-strong); color: var(--ink); font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: var(--ink2); }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

  .week { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
  .col { display: flex; flex-direction: column; gap: 6px; padding: 8px 6px; border-radius: 16px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .col.today { background: var(--chip-strong); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
  .dayhead { display: flex; align-items: center; gap: 6px; padding: 2px 2px 4px; }
  .num { font-size: 15px; font-weight: 700; padding: 0 4px; }
  .today .num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: var(--on-primary); display: inline-flex; align-items: center; justify-content: center; padding: 0; font-size: 14px; }
  .ev { border-radius: 12px; padding: 7px 9px; display: flex; flex-direction: column; gap: 2px; }
  .ev .t { font-size: 11px; font-weight: 600; color: var(--ink2); }
  .ev .n { font-size: 13px; font-weight: 600; line-height: 1.2; }
  .ev .w { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--ink2); }
  .more { font-size: 12px; font-weight: 600; color: var(--ink2); padding: 2px 4px; }

  .daylist { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
  .dayrow { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 16px; }

  .month { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); gap: 6px; }
  .mhead { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink2); padding: 0 6px; }
  .cell { display: flex; flex-direction: column; gap: 3px; padding: 6px 7px; border-radius: 12px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .cell.out { background: var(--chip-faint); color: var(--ink3); }
  .cell.today { background: var(--chip-strong); }
  .cell .mev { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--ink2); }

  aside { width: 272px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
  .card { border-radius: 24px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .art { width: 56px; height: 56px; border-radius: 12px; background: linear-gradient(135deg, var(--accent), var(--primary)) center / cover; flex-shrink: 0; }
  .progress { height: 4px; border-radius: 2px; background: var(--track); }
  .progress > div { height: 4px; border-radius: 2px; background: var(--ink); }
  .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .grid3 button { height: 40px; border-radius: 12px; background: var(--chip); font-size: 14px; font-weight: 600; }
  .rem { display: flex; align-items: center; gap: 10px; font-size: 14px; }
  .ring { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--ink3); flex-shrink: 0; }

  /* dock */
  nav.dock { align-self: center; display: flex; align-items: center; gap: 4px; padding: 8px; border-radius: 26px; }
  .dock .item { width: 76px; height: 60px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 500; }
  .dock .item[aria-current='page'] { background: var(--chip-strong); font-weight: 700; }
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
  .toast { position: absolute; left: 50%; bottom: 120px; transform: translateX(-50%); z-index: 20; padding: 14px 22px; border-radius: 999px; background: rgba(15,15,20,.88); color: #fff; font-size: 16px; font-weight: 600; animation: fadeIn .3s ease both; }
  .flash { position: absolute; inset: 0; z-index: 30; background: var(--chip-strong); pointer-events: none; animation: flash .7s ease forwards; }
  @keyframes flash { from { opacity: .9; } to { opacity: 0; } }
  .night { position: absolute; inset: 0; z-index: 40; padding: 56px 64px; display: flex; flex-direction: column; justify-content: space-between; color: #f5f5f7; text-align: left;
    background: linear-gradient(rgba(6,10,20,.66), rgba(6,10,20,.66)), var(--bg) center / cover no-repeat; animation: fadeIn .6s ease both; }
  .night .big { font-size: 168px; font-weight: 300; line-height: .9; font-variant-numeric: tabular-nums; }
  .dglass { background: rgba(20,20,22,.42); -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,.12); }
  .breathe { animation: breathe 4s ease-in-out infinite; }
  @keyframes breathe { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
  .timer-done { animation: pulse 1s ease-in-out infinite; }
  @keyframes pulse { 50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 45%, transparent); } }
`;
