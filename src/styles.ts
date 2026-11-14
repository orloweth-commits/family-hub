import { css } from 'lit';
import { lookCss } from './looks';

export const styles = css`
  :host { display: block; height: 100%;
    /* The type scale: six sizes for words and five for numerals and pictures. Every font-size in the card names a step
       (scripts/check-type.mjs keeps it that way), so a page never shows a seventh size by accident. */
    --fs-1: 13px; --fs-2: 15px; --fs-3: 17px; --fs-4: 20px; --fs-5: 26px; --fs-6: 32px;
    --fs-d1: 44px; --fs-d2: 50px; --fs-d3: 64px; --fs-d4: 72px; --fs-d5: 88px; }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; border: 0; background: transparent; cursor: pointer; padding: 0; }
  h1, h2, .display { font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif; letter-spacing: -0.025em; margin: 0; }
  /* Type roles. Templates name a role; a look restyles the role through its tokens (--t-* sizes, --w-* weights),
     so no look ever has to fight an inline size. Weights everywhere go through --w-heavy / --w-bold / --w-semi. */
  .t-hero { font-size: var(--t-hero, var(--fs-6)); font-weight: var(--w-title, 800); }
  .t-title { font-size: var(--t-title, var(--fs-5)); font-weight: var(--w-title, 800); }
  .t-head { font-size: var(--t-head, var(--fs-5)); font-weight: var(--w-title, 800); }
  .t-sub { font-size: var(--t-sub, var(--fs-4)); font-weight: var(--w-sub, 700); }

  .fh {
    position: relative; overflow: hidden; overflow: clip; isolation: isolate;
    zoom: var(--z, 1); height: calc((100vh - var(--header-height, 0px)) / var(--z, 1)); min-height: 600px;
    padding: var(--pad-y) var(--pad-x); display: flex; flex-direction: column; gap: var(--gap);
    font-family: 'Inter', system-ui, -apple-system, sans-serif; color: var(--ink);
    background: var(--bg) center / cover no-repeat; -webkit-font-smoothing: antialiased;
    transition: color var(--m-4) ease;
  }
  .fh::before { content: ''; position: absolute; inset: 0; background: var(--tod, transparent); pointer-events: none; transition: background 60s linear; }
  .fh.rainy::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .18;
    background: repeating-linear-gradient(105deg, transparent 0 18px, rgba(255,255,255,.55) 18px 19px, transparent 19px 46px); animation: rain 1.4s linear infinite; animation-iteration-count: var(--loops, infinite); }
  @keyframes rain { from { background-position: 0 0; } to { background-position: -40px 120px; } }
  .fh > header, .fh > .body, .fh > nav { position: relative; }
  /* calm mode: looping motion (avatar bob and blink, rain, pulses) runs once and settles; looks drop their tilt */
  /* one grammar under the three looks (claude/family-hub-foreground-spec.md): timings, the selected style, the lead action */
  .fh { --m-1: 80ms; --m-2: 160ms; --m-3: 240ms; --m-4: 400ms; --m-5: 900ms; --e-out: cubic-bezier(.2,.8,.2,1); --e-spring: cubic-bezier(.2,1.4,.4,1); --e-in: cubic-bezier(.4,0,1,1); --m-d: 1; --press: .03; --ring-halo: #fff;
    --mt-1: calc(var(--m-1) * var(--m-d)); --mt-2: calc(var(--m-2) * var(--m-d)); --mt-3: calc(var(--m-3) * var(--m-d)); --mt-4: calc(var(--m-4) * var(--m-d)); --mt-5: calc(var(--m-5) * var(--m-d));
    /* a look whose primary colour means ACTION only (Home Ground's yellow) sets --mark / --on-mark for things that are merely current (the next pick, a level, a room that is live) and --art-none for music with no picture; left unset, those use the primary */
    /* selected: a filled tint with no border, so it never reads as an outlined action */ --sel-bg: color-mix(in srgb, var(--primary) 26%, var(--chip-strong)); --sel-ink: var(--ink); --sel-ring: none; --danger: #c62828;
    /* sizes: three control heights, the gutters, the right rail, and where sheets may sit (below the header, above the dock) */
    --ctl: 44px; --ctl-2: 52px; --ctl-3: 60px; --pad-y: 20px; --pad-x: 24px; --gap: 16px; --rail: 272px; --top: 110px; --bot: 122px; --scrim: rgba(6,16,28,.52); }
  /* a screen too small for the design canvas is never shrunk: the frame tightens instead, so controls keep their size and words stay readable */
  .fh[data-compact] { --pad-y: 12px; --pad-x: 12px; --gap: 12px; --rail: 236px; }
  .fh[data-calm] { --loops: 0; --tilt: 0; --motion: paused; --m-d: 0; }
  @media (prefers-reduced-motion: reduce) { .fh { --m-d: 0; } }
  .fh.idle *, .fh.idle::after { animation-play-state: paused !important; }
  /* reduce-motion: animations end at once and run once. Transitions need no blanket rule (it used to give every element a transition
     of everything): fades keep their --m-* length and anything that travels uses --mt-*, which is zero here and in calm mode. */
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; } }
  .glass {
    background: var(--glass); -webkit-backdrop-filter: blur(28px) saturate(170%); backdrop-filter: blur(28px) saturate(170%);
    border: 1px solid var(--glass-line); box-shadow: inset 0 1px 0 var(--glass-line), var(--shadow);
    transition: background-color var(--m-4, 400ms) ease, border-color var(--m-4, 400ms) ease;
  }
  /* one entrance per navigation: the page wrapper fades in (--m-2) and rises 8 px (--m-3); the panels inside do not animate,
     so nothing holds a transform after it ends and a press is always answered. A look may swap the rise (--pg-from). */
  .body[data-in] { animation: pgfade var(--m-2) var(--e-out) backwards, pgmove var(--m-3) var(--e-out) backwards; }
  @keyframes pgfade { from { opacity: 0; } }
  @keyframes pgmove { from { transform: var(--pg-from, translateY(calc(8px * var(--m-d, 1)))); } }
  @keyframes rise { from { opacity: 0; transform: translateY(calc(14px * var(--m-d, 1))); } }
  /* leaving: sheets (with their scrim), the PIN pad, toasts and the night screen fade out before they go */
  .scrim[data-closing], .toast[data-closing], .night[data-closing], .sheetwrap[data-closing] { animation: fhout var(--m-2, 160ms) var(--e-in, ease-in) forwards; pointer-events: none; }
  .night[data-closing] { animation-duration: var(--m-4, 400ms); }
  @keyframes fhout { to { opacity: 0; } }
  /* waiting for Home Assistant: a control whose call is still out after 250 ms dims until the answer comes */
  [data-busy] { opacity: .6; cursor: progress; }
  /* a touch answers within 80 ms and stays visible for a glancing tap (the release waits 60 ms); wide things do not shrink */
  .tap { transition: transform var(--m-2, 160ms) var(--e-spring, ease) 60ms, opacity var(--m-3, 240ms) ease 60ms, background-color var(--m-3) ease, box-shadow var(--m-3) ease; }
  .tap:active { transform: scale(calc(1 - var(--press, .03) * var(--m-d, 1))); opacity: .84; transition: transform var(--m-1, 80ms) var(--e-out, ease), opacity var(--m-1, 80ms) ease; }
  .row.tap:active, .job.tap:active, .pic.tap:active, .dev.tap:active, .room.tap:active, .st.tap:active, .card.tap:active { transform: none; }
  /* the tick: the same small sequence wherever a row is ticked off. The row carries data-just for a moment after the touch:
     the check pops, the tick is drawn in one stroke, and the words are struck through from the left. */
  [data-just] .check { animation: tkpop var(--m-3, 240ms) var(--e-spring, ease); }
  @keyframes tkpop { 45% { transform: scale(calc(1 + .16 * var(--m-d, 1))); } }
  [data-just] .check svg path { stroke-dasharray: 1; animation: tkdraw var(--m-2, 160ms) var(--e-out, ease) 40ms both; }
  @keyframes tkdraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  .strike { background: linear-gradient(currentColor, currentColor) left 56% / 0 2px no-repeat; transition: background-size var(--m-3, 240ms) var(--e-out, ease), color var(--m-2, 160ms) ease; }
  .done .strike { background-size: 100% 2px; color: var(--ink-done, var(--ink3)); text-decoration: none; }
  /* planner reminders: rows you can tick */
  .rem { width: calc(100% + 12px); min-height: 44px; height: 44px; padding: 0 6px; margin: 0 -6px; border-radius: 12px; text-align: left; }
  .rem .check { width: 28px; height: 28px; border-width: 2.5px; display: inline-flex; align-items: center; justify-content: center; color: var(--on-ok, #fff); transition: background-color var(--m-1, 80ms) ease, border-color var(--m-1, 80ms) ease; }
  .rem.done .check { background: var(--ok); border-color: var(--ok); }
  .rem .content { flex: 1; min-width: 0; }
  .rem.tap:active { transform: none; }
  /* the lead action: the one thing a page or sheet is for */
  .lead { height: 52px; padding: 0 20px; border-radius: 999px; background: var(--primary); color: var(--on-primary); font-size: var(--fs-3); font-weight: var(--w-bold, 700); display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--primary) 35%, transparent), inset 0 1px 0 rgba(255,255,255,.35); }
  /* one focus ring and one disabled style for every control, in every component that shares this sheet */
  :is(button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex='-1']), [role='slider'], [role='tab'], [role='switch'], [role='spinbutton']):focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; box-shadow: 0 0 0 3px var(--ring-halo, #fff); }
  /* the ring has two tones: ink, with a halo of the opposite tone inside it (--ring-halo), so it shows on any coloured surface.
     Rows and tiles that sit in a box that clips (lists that scroll, grids, the dock) carry the ring inside their own edge instead. */
  :is(.ev, .dayrow, .rem, .row, .job, .more, .dcoin, .pchip, .pic, .dev, .sw, .auto, .scene, .mz, .puck, .st, .snap, .tile, .heart, .hit, .spk .rsel, .who, .cap, .actor > svg, .sleeve, .coin, .mpad, .item, .avbtn, .tabs > button):focus-visible:focus-visible:focus-visible { outline-offset: -3px; box-shadow: inset 0 0 0 5px var(--ring-halo, #fff); }
  input[type='range']:focus-visible { outline: 3px solid var(--ink); outline-offset: 4px; border-radius: 8px; box-shadow: 0 0 0 4px var(--ring-halo, #fff); }
  /* words waiting in an empty field read as text, in every theme */
  input::placeholder, textarea::placeholder { color: var(--ink2); opacity: 1; }
  :is(button, input)[disabled], [aria-disabled='true'] { opacity: .45; cursor: default; box-shadow: none !important; }
  .ghost { background: transparent; box-shadow: inset 0 0 0 2px var(--ink2); }
  .fade { animation: fadeIn var(--m-3, 240ms) var(--e-out, ease); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(calc(8px * var(--m-d, 1))); } }
  .live { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); animation: live 2s ease-out infinite; animation-iteration-count: var(--loops, infinite); flex-shrink: 0; }
  @keyframes live { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ok) 60%, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }
  .muted { color: var(--ink2); }
  .label { font-size: var(--fs-2); font-weight: var(--w-semi, 600); color: var(--ink2); text-transform: uppercase; letter-spacing: .05em; }
  .pill { height: 44px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: var(--fs-2); font-weight: var(--w-semi, 600); display: inline-flex; align-items: center; gap: 6px; }
  .round { width: 44px; height: 44px; border-radius: 50%; background: var(--chip); display: inline-flex; align-items: center; justify-content: center; }
  .primary { background: var(--primary); color: var(--on-primary); }
  .avatar { border-radius: 50%; color: var(--on-person); font-weight: var(--w-bold, 700); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  svg.i { width: var(--s, 22px); height: var(--s, 22px); fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

  /* header */
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; }
  .clock { display: flex; flex-direction: column; min-width: 230px; flex-shrink: 0; }
  .fh[data-compact] header { min-height: 56px; height: 56px; }
  .fh[data-compact] .clock { min-width: 0; }
  .fh[data-compact] .clock .greet { display: none; }
  .fh[data-compact] .clock .hm { font-size: var(--fs-d1); }
  .fh[data-compact] .clock > svg { width: 52px; height: 52px; }
  .fh[data-compact] .clock { max-height: 56px; }
  .clock .hm { font-size: var(--fs-d2); font-weight: var(--w-bold, 700); line-height: 1; }
  .kids { display: flex; gap: 6px; padding: 6px; border-radius: 999px; }
  .kid { display: flex; align-items: center; gap: 10px; padding: 6px 16px 6px 6px; border-radius: 999px; background: var(--chip); font-weight: var(--w-semi, 600); font-size: var(--fs-2); }
  .right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .right > .round { width: 52px; height: 52px; }
  /* each header button says what it is: the picture over one word, as the dock does. Where the header is short (compact, phone) the word goes and the round button stays */
  .right > .round .rl { display: none; }
  .fh:not([data-compact]) .right > .round.hb { width: auto; min-width: 58px; height: 52px; padding: 4px 9px 5px; border-radius: 18px; flex-direction: column; justify-content: center; gap: 1px; }
  .fh:not([data-compact]) .right > .round.hb .rl { display: block; font-size: var(--fs-1); line-height: 1.15; font-weight: var(--w-semi, 600); white-space: nowrap; }
  .fh:not([data-compact]) .right > .round.hb > svg { width: 22px; height: 22px; flex-shrink: 0; }
  /* when the row is too full the weather chip and who-is-home give way, a step at a time (data-fit is set after measuring) */
  header[data-fit~='nobadge'] .weather .badge, header[data-fit~='slim'] .weather .wsub, header[data-fit~='slim'] .weather .wtop { display: none; }
  header[data-fit~='nowho'] .presence, header[data-fit~='nowx'] .weather { display: none; }
  /* while a medication chip is showing, the round pill button (it opens the same sheet) makes room */
  header[data-medchip] .right > [data-act='meds'] { display: none; }
  .weather { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 16px; border-radius: 999px; text-align: left; white-space: nowrap; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 999px; background: color-mix(in srgb, #f59e0b 22%, var(--chip)); font-size: var(--fs-2); font-weight: var(--w-heavy, 800); white-space: nowrap; }
  .badge.hot { background: color-mix(in srgb, #dc2626 22%, var(--chip)); }
  /* one row that never wraps: a chip that does not fit is taken out whole (lowest priority first), never cut through its words */
  .capsule { flex: 1; min-width: 0; display: flex; flex-wrap: nowrap; align-items: center; justify-content: center; gap: 12px; height: 68px; padding: 8px; margin: -8px; overflow: hidden; }
  .cap { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 16px; border-radius: 999px; background: var(--glass); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
    border: 1px solid var(--glass-line); font-size: var(--fs-3); font-weight: var(--w-bold, 700); white-space: nowrap; max-width: 380px; min-width: 0; }
  .cap[hidden] { display: none; }
  /* the names on a medication chip never shrink away (a look may cap the chip at the row's width): the row then counts as too full, and lesser things step aside first */
  .capsule[data-one] .cap { flex-shrink: 1; overflow: hidden; }
  .capsule[data-one] .cap > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .cap b { font-variant-numeric: tabular-nums; font-size: var(--fs-3); }
  /* urgent: the chip keeps its full colour (the words stay AA) and a soft ring breathes round it */
  .cap.hot { background: #c81e1e; color: #fff; border-color: #c81e1e; animation: hotring 1.4s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  @keyframes hotring { 50% { box-shadow: 0 0 0 5px color-mix(in srgb, #c81e1e 38%, transparent); } }
  /* still waiting after the first hour: amber, steady (no breathing ring), dark ink that reads on it in every look */
  .cap[data-warm] { background: #f5b301; color: #2a1a00; border-color: #f5b301; }
  .cap.ok { background: color-mix(in srgb, var(--ok) 25%, var(--glass)); }
  .presence { display: flex; align-items: center; gap: 4px; height: 52px; padding: 0 10px; border-radius: 999px; }
  .presence .phome { display: flex; color: var(--ink2); padding: 0 2px 0 4px; }
  .sos { display: flex; gap: 12px; align-items: stretch; }
  .sos000 { flex: 1; min-width: 0; border-radius: 20px; padding: 12px 16px; background: #fee2e2; color: #7f1d1d; display: flex; flex-direction: column; gap: 2px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); }
  .sos000 > b { font-size: var(--fs-4); font-weight: var(--w-heavy, 800); }
  .sosaddr { margin-top: 4px; font-size: var(--fs-3); }
  .sosbtn { position: relative; overflow: hidden; flex: 0 0 290px; min-height: 84px; border-radius: 20px; padding: 0 18px; background: #c81e1e; color: #fff; display: flex; align-items: center; gap: 12px; text-align: left; box-shadow: 0 6px 0 #7f1212, 0 12px 18px rgba(127,18,18,.35); touch-action: none; -webkit-user-select: none; user-select: none; }
  .sosbtn b { display: block; font-size: var(--fs-4); font-weight: var(--w-heavy, 800); line-height: 1.15; } .sosbtn small { font-size: var(--fs-2); font-weight: var(--w-semi, 600); }
  .sosbtn > span { position: relative; }
  .sosbtn > i { position: absolute; inset: 0; background: rgba(255,255,255,.3); transform: scaleX(0); transform-origin: left; }
  .sosbtn[data-s='hold'] { transform: translateY(4px); box-shadow: 0 2px 0 #7f1212; }
  .sosbtn[data-s='hold'] > i { transform: scaleX(1); transition: transform 1.5s linear; }
  .sosbtn[data-s='sent'] { background: #166534; box-shadow: 0 6px 0 #0d3d20; }
  .sosnote { font-size: var(--fs-2); font-weight: var(--w-bold, 700); }
  .sosnote:empty { display: none; }
  .bin { display: inline-block; width: 12px; height: 15px; border-radius: 3px 3px 4px 4px; box-shadow: inset 0 3px 0 rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.18); flex-shrink: 0; margin: 0 1px; }
  .med2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 26px; }
  .mrow { display: flex; flex-wrap: wrap; gap: 8px; }
  .mchip { height: 44px; padding: 0 16px; border-radius: 999px; background: var(--chip-strong); box-shadow: inset 0 0 0 1.5px var(--ink3); font-size: var(--fs-2); font-weight: var(--w-semi, 600); }
  .mchip[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
  :host([data-phone]) .med2 { grid-template-columns: 1fr; }
  /* a phone's sheet header has room for one word beside the title */
  :host([data-phone]) .shead .lt30 { display: none; }
  /* house info: sections flow into up to three columns that end level */
  .info2 { columns: 3 250px; column-gap: 24px; }
  .info2 > .icol { break-inside: avoid; margin-bottom: 12px; }
  .icol { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .med2 .icol .label { margin-top: 8px; }
  .med2 .icol > .label:first-child { margin-top: 0; }
  .irow { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 8px 12px; border-radius: 12px; background: var(--chip); font-size: var(--fs-3); font-weight: var(--w-semi, 600); }
  .irow b { font-weight: var(--w-bold, 700); min-width: 0; }
  a.irow { color: inherit; text-decoration: none; min-height: 48px; box-sizing: border-box; align-items: center; }
  a.irow .display { text-decoration: underline; text-underline-offset: 3px; }
  .iline { font-size: var(--fs-2); font-weight: var(--w-semi, 600); line-height: 1.35; padding: 2px 2px; }
  :host([data-phone]) .sos { flex-direction: column; } :host([data-phone]) .sosbtn { flex: none; } 
  .presence .avatar { width: 32px; height: 32px; font-size: var(--fs-1); background: var(--c); }
  /* who is home, as faces: home in full colour with the person's ring; away grey with a dashed ring */
  .presence .pface { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0; display: inline-flex; background: var(--chip); box-shadow: 0 0 0 2px var(--c); }
  .presence .pface img { width: 100%; height: 100%; object-fit: cover; }
  .presence .pface.away { filter: grayscale(1); opacity: .7; box-shadow: none; outline: 2px dashed var(--ink2); outline-offset: 0; }
  .presence .pname { font-size: var(--fs-2); font-weight: var(--w-bold, 700); white-space: nowrap; padding: 0 6px 0 2px; }
  .presence .pname.away { color: var(--ink2); font-weight: var(--w-semi, 600); }
  /* away: still fully there to read, but grey and dashed */
  .presence .avatar.away { background: var(--chip); color: var(--ink); filter: grayscale(1); outline: 2px dashed var(--ink2); outline-offset: -2px; }

  /* body */
  .body { display: flex; gap: var(--gap); flex: 1; min-height: 0; }
  /* a page never pushes the body wider than the screen: it gives way and reflows inside */
  .body > * { min-width: 0; }
  .planner { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
  .bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .seg { display: flex; padding: 3px; border-radius: 12px; background: var(--track); }
  .seg button { height: 44px; min-width: 56px; padding: 0 16px; border-radius: 9px; font-size: var(--fs-2); font-weight: 500; color: var(--ink2); }
  .seg button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); color: var(--ink2); }
  /* how fresh the calendars are: a quiet word at the end of the legend, or a plain warning on a line of its own */
  .calnote { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
  .calnote[data-warn] { flex: 1 1 100%; margin-left: 0; white-space: normal; color: var(--ink); background: var(--chip-strong); border-radius: 12px; padding: 6px 6px 6px 12px; }
  .calnote[data-warn] > span { flex: 1; min-width: 0; }
  .calnote[data-warn] > svg { flex-shrink: 0; color: var(--warn, var(--accent)); }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
  /* a person's colour never stands alone: the chip carries their initial too */
  .init { min-width: 19px; height: 19px; padding: 0 4px; border-radius: 6px; background: var(--c, var(--p-family)); color: var(--on-person, #fff); font-size: var(--fs-1); font-weight: var(--w-heavy, 800); line-height: 1; letter-spacing: 0;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-style: normal; text-transform: none; }
  .init.sm { min-width: 17px; height: 17px; padding: 0 2px; border-radius: 5px; font-size: var(--fs-1); }
  /* a list with more below fades out at the bottom edge instead of cutting a row in half */
  .scrolly[data-more] { -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 44px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 44px), transparent); }

  .week { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
  .col { display: flex; flex-direction: column; gap: 6px; padding: 8px 6px; border-radius: 16px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .col.today { background: var(--chip-strong); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
  .dayhead { display: flex; align-items: center; gap: 6px; padding: 2px 2px 4px; }
  .num { font-size: var(--fs-3); font-weight: var(--w-heavy, 800); padding: 0 4px; }
  .pchip { margin-left: auto; font-size: var(--fs-1); opacity: .7; }
  .today .num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: var(--on-primary); display: inline-flex; align-items: center; justify-content: center; padding: 0; font-size: var(--fs-2); }
  .ev { border-radius: 12px; padding: 7px 9px 7px 10px; display: flex; flex-direction: column; gap: 2px; background: color-mix(in srgb, var(--c) 24%, var(--chip-soft)); border-left: 5px solid var(--c); }
  /* an event is a button: it opens its details */
  button.ev, button.dayrow { width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer; }
  button.ev { align-items: stretch; }
  .ev.tap:active, .dayrow.tap:active { transform: none; opacity: .8; }
  .cap.evcap { cursor: pointer; color: inherit; font-family: inherit; }
  /* the details of one event: read-only */
  .evtitle { overflow-wrap: anywhere; }
  .evd { display: flex; flex-direction: column; gap: 10px; padding-left: 14px; border-left: 6px solid var(--c, var(--p-family)); }
  .evrow { display: flex; align-items: flex-start; gap: 12px; font-size: var(--fs-3); font-weight: var(--w-semi, 600); line-height: 1.3; }
  .evrow .evic { flex: 0 0 26px; display: flex; justify-content: center; padding-top: 1px; color: var(--ink2); }
  .evrow .evtx { min-width: 0; overflow-wrap: anywhere; }
  .evrow.evday { font-size: var(--fs-4); font-weight: var(--w-bold, 700); }
  .evpart { font-size: var(--fs-3); }
  /* the calendar's notes: plain text under a small label, line breaks kept; a long note scrolls inside its own box so the sheet keeps its shape */
  .evnotebox { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; } .evnotebox .label { font-size: var(--fs-1); }
  .evnotes { margin: 0; padding: 12px 14px; border-radius: 16px; background: var(--chip); font-size: var(--fs-3); line-height: 1.4; font-weight: 500; white-space: pre-line; overflow-wrap: anywhere; max-height: min(260px, 34vh); overflow-y: auto; overscroll-behavior: contain; }
  .ev .t { font-size: var(--fs-2); font-weight: var(--w-bold, 700); color: var(--ink2); }
  .ev .n { font-size: var(--fs-2); font-weight: var(--w-bold, 700); line-height: 1.2; overflow-wrap: break-word; hyphens: manual; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .evs { position: relative; flex: 0 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 6px; overflow: hidden; padding: 3px; margin: -3px; }
  .evs > .ev { flex-shrink: 0; }
  .ell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .evcap { min-width: 0; max-width: 100%; }
  .ev .w { font-size: var(--fs-2); font-weight: var(--w-semi, 600); color: var(--ink2); }
  .ev.priv { flex-direction: row; align-items: center; gap: 6px; background: transparent; border-left: 0; padding: 2px 6px; color: var(--ink2); }
  /* finished: paler card, quieter words, still readable */
  .ev.past { background: color-mix(in srgb, var(--c) 8%, var(--chip-soft)); border-left-color: color-mix(in srgb, var(--c) 45%, transparent); }
  .ev.past .t, .ev.past .n, .ev.past .w, .dayrow.past .content, .dayrow.past .muted { color: var(--ink-past, color-mix(in srgb, var(--ink) 30%, var(--ink2))); font-weight: var(--w-semi, 600); }
  .col.today .ev.past .w { display: none; }
  .ev.next { box-shadow: inset 0 0 0 2px var(--primary); }
  .dayrow.past { background: color-mix(in srgb, var(--c, transparent) 8%, transparent); border-left-color: color-mix(in srgb, var(--c, transparent) 45%, transparent); }
  /* "+N more": a small pill directly under the last event shown; the button around it is a full 44 px target that reaches into the column's padding */
  .more { height: 44px; margin-bottom: -14px; flex-shrink: 0; padding: 0; background: transparent; text-align: left; display: flex; align-items: flex-start; }
  .more .mpill { display: inline-flex; align-items: center; height: 30px; padding: 0 12px; border-radius: 999px; background: var(--chip-strong); color: var(--ink); font-size: var(--fs-2); font-weight: var(--w-bold, 700); white-space: nowrap; }
  .ev .loc, .dayrow .loc { display: flex; align-items: center; gap: 4px; min-width: 0; font-size: var(--fs-2); font-weight: var(--w-semi, 600); color: var(--ink2); line-height: 1.2; }
  .ev .loc svg, .dayrow .loc svg { flex: 0 0 auto; }
  .col[data-tight] .ev .loc { display: none; }
  .col[data-wrap] .ev .loc { align-items: flex-start; } .col[data-wrap] .ev .loc svg { margin-top: 1px; }
  .col[data-wrap] .ev .loc .ell { white-space: normal; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .xpbar { height: 8px; border-radius: 4px; background: var(--track); overflow: hidden; }
  .xpbar > div { height: 100%; background: linear-gradient(90deg, var(--mark, var(--primary)), var(--mark, var(--accent))); border-radius: 4px; transition: width var(--mt-5); }

  .daylist { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
  .daylist[data-fit] { gap: 6px; }
  .daylist[data-fit] .dayrow { padding: 8px 14px; }
  .daylist[data-fit='2'], .daylist[data-fit='3'] { display: grid; grid-template-columns: 1fr 1fr; align-content: start; }
  .dayview { flex: 1; min-height: 0; display: flex; align-items: stretch; gap: 22px; }
  .dayview .dayart { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; padding: 0 6px; line-height: 0; }
  .dayview .daylist { min-width: 0; }
  .dayrow .content, .dayrow .evwho, .ev .w { overflow-wrap: anywhere; }
  /* only a word too long for its column is hyphenated (12 letters or more, where the browser can limit it); shorter words move to the next line whole */
  .ev .n[data-hy], .dayrow .content[data-hy] { hyphens: auto; -webkit-hyphens: auto; hyphenate-limit-chars: 12 4 4; }
  /* a title with a word wider than its column is set a step smaller first, so most such words stay whole */
  .ev .n[data-hy] { font-size: var(--fs-1); }
  .dayrow.next .dwhen { color: var(--ink); }
  .dayrow { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 16px; background: color-mix(in srgb, var(--c, transparent) 22%, transparent); border-left: 6px solid var(--c, transparent); }

  .month { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); gap: 6px; }
  .mhead { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); color: var(--ink2); padding: 0 6px; }
  .cell { display: flex; flex-direction: column; gap: 3px; padding: 6px 7px; border-radius: 12px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .cell.out { background: var(--chip-faint); color: var(--ink3); }
  .cell.today { background: var(--chip-strong); }
  .cell .mev { display: flex; align-items: center; gap: 5px; flex-shrink: 0; min-width: 0; height: 18px; line-height: 18px; font-size: var(--fs-2); font-weight: 500; white-space: nowrap; }
  /* a cell with lines to spare lets a title run to a second line instead of cutting it */
  .cell .mev.two { height: auto; max-height: 39px; align-items: flex-start; white-space: normal; }
  .cell .mev.two > .ell { white-space: normal; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .cell .mev.two > .init { margin-top: 1.5px; }
  .cell .mev > .ell { flex: 1; }
  .cell .mtop { display: flex; align-items: center; justify-content: space-between; gap: 4px; height: 20px; flex-shrink: 0; font-size: var(--fs-2); font-weight: var(--w-bold, 700); }
  .cell .mmore { padding: 0 7px; height: 20px; line-height: 20px; border-radius: 999px; background: var(--ink); color: var(--ring-halo, #fff); font-size: var(--fs-2); font-weight: var(--w-heavy, 800); font-variant-numeric: tabular-nums; }

  .empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--ink2); }
  .empty .pic { color: var(--accent); line-height: 0; }
  .weekwrap { position: relative; flex: 1; min-height: 0; display: flex; }
  .weekwrap > .quiet { position: absolute; left: 50%; top: 56%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 14px; padding: 10px 12px 10px 20px; border-radius: 999px; background: var(--chip-strong); font-size: var(--fs-3); font-weight: var(--w-semi, 600); color: var(--ink); white-space: nowrap; }

  aside { width: var(--rail); flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
  .card { border-radius: 24px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  aside > .card { padding: 12px 14px; gap: 8px; flex-shrink: 0; }
  aside > .card.np .art { width: 44px; height: 44px; border-radius: 10px; }
  aside > .card.np .ctl { display: flex; align-items: center; justify-content: center; gap: 18px; }
  /* the hint under the buttons keeps the same room below it as the label has above, in every look (a look's timer can be taller) */
  aside > .card.tmr { padding-bottom: 16px; }
  aside > .card.jar { flex-direction: row; align-items: center; gap: 10px; padding: 8px 14px; min-height: 44px; }
  aside > .card.rems { flex: 1 1 0; min-height: 0; overflow: hidden; }
  /* the padding (taken back by the margin) leaves room for a row's focus ring inside the clip */
  .remlist { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 6px 12px; margin: -6px -12px; }
  .remmore { height: 16px; line-height: 16px; font-size: var(--fs-2); font-weight: var(--w-bold, 700); color: var(--ink2); flex-shrink: 0; }
  .troll { display: inline-block; animation: troll var(--m-2) var(--e-out); }
  @keyframes troll { from { transform: translateY(calc(12px * var(--m-d, 1))); opacity: 0; } }
  [data-bump] { --ring-t: var(--mt-3); --ring-e: var(--e-out); }
  .tread { display: inline-flex; align-items: center; min-height: 44px; padding: 0 6px; margin: 0 -6px; border-radius: 12px; font-size: var(--fs-6); font-weight: var(--w-bold, 700); font-variant-numeric: tabular-nums; }
  /* compact frame: now playing is one row (the Music page has the rest) */
  .fh[data-compact] aside > .card.np { flex-direction: row; align-items: center; }
  .fh[data-compact] aside > .card.np .np-main { flex: 1; min-width: 0; }
  .fh[data-compact] aside > .card.np .ctl button:not(.round) { display: none; }
  .art { width: 56px; height: 56px; border-radius: 12px; background: var(--pic, var(--art-none, linear-gradient(135deg, var(--accent), var(--primary)))) center / cover; flex-shrink: 0; }
  .progress { height: 4px; border-radius: 2px; background: var(--track); }
  .progress > div { height: 4px; border-radius: 2px; background: var(--ink); }
  .timerrow { display: flex; align-items: center; gap: 10px; }
  .timerrow .tcancel { margin-left: auto; padding: 0 10px; font-size: var(--fs-2); font-weight: var(--w-bold, 700); color: var(--ink2); }
  .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .np button.tap, .timerrow button { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .grid3 button:not(.lead) { height: 44px; border-radius: 12px; background: var(--chip); font-size: var(--fs-2); font-weight: var(--w-semi, 600); }
  .rem { display: flex; align-items: center; gap: 10px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); flex-shrink: 0; }
  .rem .content { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2; }
  .ring { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--ink3); flex-shrink: 0; }

  /* dock */
  nav.dock { align-self: center; display: flex; align-items: center; gap: 4px; padding: 8px; border-radius: 26px; }
  /* every label rests on the same line, whatever stands above it (an icon or a child's face) */
  .dock .item { min-width: 74px; height: 68px; padding: 0 6px 6px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); }
  /* an icon in a wrapper takes no more room than a bare one, so every label sits on one line across the dock */
  .dock .item > span:not(.lb):not(.avatar) { display: flex; line-height: 0; }
  .grid3 button { white-space: nowrap; padding: 0 2px; }
  .fh[data-compact] .grid3 button:not(.lead) { font-size: var(--fs-1); }
  /* ---- the header's and the dock's buttons: a filled drawing each, and where the card knows something true, the drawing shows it ----
     (today's date, today's sky, the record playing, how much is on the list, lights on, tonight's moon: see art.ts).
     Each button still names its hue once: --bt (a pale tint), --bl (the same hue, deep) and --bo (the hue as light, for a dark sky);
     a look may use it for a magnet or a ring. The drawings carry their own colours and need no tile. */
  svg.i.pic2 { stroke: none; fill: none; overflow: visible; box-sizing: border-box; font-family: inherit; }
  svg.pic2 text { font-family: inherit; font-variant-numeric: tabular-nums; }
  .dock .item:is([data-nav='sun'], [data-nav='home']) { --bt: #ffe7c2; --bl: #7a3a06; --bo: #ffcf9a; }
  .dock .item:is([data-nav='calendar'], [data-nav='cloud']) { --bt: #d6e4ff; --bl: #1d3f8f; --bo: #a9c1ff; }
  .dock .item:is([data-nav='cart'], [data-nav='music']) { --bt: #d3efdb; --bl: #14592c; --bo: #9be3b1; }
  .dock .item[data-nav='pencil'] { --bt: #e6dbff; --bl: #4a2a99; --bo: #c9b6ff; }
  .dock .item[data-nav='lights-on'] { --bt: #ffd75a; --bl: #3d2c00; --bo: #ffe08a; }
  .dock .item[data-nav='lights-off'] { --bt: #3a4250; --bl: #ffffff; --bo: #e8ecf7; }
  .dock .item[data-nav='dinner'] { --bt: #c62828; --bl: #ffffff; --bo: #ff8a7a; }
  .right > .hb[data-act='ask'] { --bt: #d9f2ef; --bl: #0c5a52; --bo: #6ee7c0; }
  /* the parts of a drawing turn and grow about their own middle, unless they hang from an edge */
  svg.pic2 [class^='p-'], svg.pic2 [class*=' p-'] { transform-box: fill-box; transform-origin: center; }
  svg.pic2 .p-band { transform-origin: center top; } svg.pic2 .p-fork, svg.pic2 .p-knife { transform-origin: center bottom; } svg.pic2 .p-door { transform-origin: left center; } svg.pic2 .p-pencil { transform-origin: center bottom; }
  svg.pic2 .p-ray { transform-box: view-box; transform-origin: 20px 18px; } svg.pic2[data-ic='weather'] .p-ray { transform-box: fill-box; transform-origin: center; }
  @keyframes bPop { 45% { transform: scale(calc(1 + .22 * var(--m-d, 1))); } }
  @keyframes bTwinkle { 45% { transform: scale(calc(1 + .3 * var(--m-d, 1))) rotate(calc(20deg * var(--m-d, 1))); } }
  @keyframes bHop { 40% { transform: translateY(calc(-3px * var(--m-d, 1))); } }
  @keyframes bRock { 50% { transform: rotate(calc(-14deg * var(--m-d, 1))); } }
  @keyframes bRise { from { transform: translateY(calc(5px * var(--m-d, 1))); } }
  @keyframes bFlip { 50% { transform: scaleY(calc(1 - .5 * var(--m-d, 1))); } }
  @keyframes bDropIn { from { transform: translateY(calc(-6px * var(--m-d, 1))); opacity: 0; } }
  @keyframes bWig { 30% { transform: rotate(calc(-9deg * var(--m-d, 1))); } 70% { transform: rotate(calc(7deg * var(--m-d, 1))); } }
  @keyframes bDraw { from { stroke-dashoffset: 1; } }
  @keyframes bDrift { 50% { transform: translateX(calc(2.5px * var(--m-d, 1))); } }
  @keyframes bDoor { 50% { transform: scaleX(calc(1 - .7 * var(--m-d, 1))); } }
  @keyframes bDim { 50% { opacity: .35; } }
  @keyframes bTurn { to { transform: rotate(calc(360deg * var(--m-d, 1))); } }
  /* pressed (data-just): the drawing answers the finger once. Medicine has no moving part */
  .hb[data-just] [data-ic='ask'] .p-star, .morebtn[data-just] [data-ic='night'] .p-star { animation: bTwinkle var(--mt-3) var(--e-spring); }
  .item[data-just] [data-ic='morning'] .p-ray { animation: bPop var(--mt-3) var(--e-spring); }
  .item[data-just] [data-ic='planner'] .p-day { animation: bPop var(--mt-3) var(--e-spring); }
  .item:is([data-just], [data-arrive]) [data-ic='groceries'] .p-item { animation: bDropIn var(--mt-4) var(--e-out); }
  .item[data-just] [data-ic='doodle'] .p-pencil { animation: bWig var(--mt-4) var(--e-out); }
  .item:is([data-just], [data-arrive]) [data-ic='music'] .p-disc { animation: bTurn var(--mt-5) var(--e-out); }
  .item:is([data-just], [data-arrive]) [data-ic='weather'] .p-cloud { animation: bDrift var(--mt-4) var(--e-out); }
  .item[data-just] [data-ic='home'] .p-door { animation: bDoor var(--mt-4) var(--e-out); }
  .item[data-just] [data-ic='allon'] .p-ray { animation: bPop var(--mt-4) var(--e-spring); }
  .item[data-just] [data-ic='alloff'] .p-bulb { animation: bDim var(--mt-4) var(--e-out); }
  .item[data-just] [data-ic='dinner'] .p-fork { animation: bWig var(--mt-4) var(--e-out); } .item[data-just] [data-ic='dinner'] .p-knife { animation: bWig var(--mt-4) var(--e-out) reverse; }
  .item[data-just] [data-ic='dinner'] .p-ring { animation: bPop var(--mt-4) var(--e-out); }
  /* arrived (data-arrive): the place whose page has just opened */
  .item[data-arrive] [data-ic='morning'] .p-sun { animation: bRise var(--mt-4) var(--e-out); }
  .item[data-arrive] [data-ic='planner'] .p-band { animation: bFlip var(--mt-4) var(--e-out); }
  .item[data-arrive] [data-ic='doodle'] .p-squiggle { stroke-dasharray: 1; animation: bDraw var(--mt-4) var(--e-out); }
  .item[data-arrive] [data-ic='home'] .p-roof { animation: bHop var(--mt-3) var(--e-spring); }
  /* the one thing that keeps moving, and only while music is playing: the record turns (calm mode and reduce-motion stop it; the little bars beside it say "playing" without moving) */
  .item[data-playing]:not([data-just]):not([data-arrive]) [data-ic='music'] .p-disc { animation: bTurn 6s linear infinite; animation-iteration-count: var(--loops, infinite); animation-play-state: var(--motion, running); }
  .dock .item .lb { display: inline-flex; flex-direction: column; align-items: center; max-width: 100%; }
  .dock .item .lb::after { content: attr(data-t); height: 0; overflow: hidden; visibility: hidden; font-weight: var(--w-heavy, 800); pointer-events: none; }
  /* a child's button: his picture is taller than an icon, so it sits closer to his name; a long name widens the button before it is cut.
     His name rests on the same line as every other label (the same 6 px under it): the picture, not the name, gives up the 2 px, rising into the dock's own padding */
  .dock .item.kidbtn { gap: 2px; } .dock .item .kn { flex-shrink: 0; }
  .dock .item .kn { display: block; max-width: 132px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; overflow-wrap: anywhere; }
  .dock .item .kn::after { display: block; }
  .dock .item[aria-current='page'] { background: var(--chip-strong); font-weight: var(--w-heavy, 800); }
  .dock .kidbtn { min-width: 80px; }
  .dock .kidbtn .avatar { overflow: hidden; }
  .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 1.5px var(--chip-strong), 0 0 0 4px var(--kidc); }
  .dock .called { color: var(--ok); }
  .dock .sep { width: 1px; height: 36px; background: var(--track); margin: 0 6px; }
  /* places to go and things done to the whole house are two groups: a wider gap stands between them */
  .dock .sep.wide { margin: 0 18px; }
  :host([data-n1]) .dock .sep.wide { margin: 0 8px; } :host([data-phone]) .dock .sep.wide { margin: 0 10px; }
  .hb[data-act='more'] svg.i { stroke-width: 3.4; }
  /* the More sheet: what left the header, as big named buttons */
  .moregrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .morebtn { display: flex; align-items: center; gap: 14px; min-height: 76px; padding: 12px 16px; border-radius: 20px; background: var(--chip); text-align: left; }
  .morebtn > span { display: flex; flex-direction: column; gap: 2px; min-width: 0; } .morebtn b { font-size: var(--fs-3); font-weight: var(--w-bold, 700); } .morebtn .muted { font-size: var(--fs-2); font-weight: var(--w-semi, 600); }
  .morebtn svg.i { flex-shrink: 0; }
  :host([data-phone]) .moregrid { grid-template-columns: 1fr; }
  /* the planner at rest: today is larger (its column is widened where the week is drawn) and the other days step back */
  .week { transition: grid-template-columns var(--mt-4) var(--e-out); }
  .week .col { transition: opacity var(--m-4) ease; }
  .week[data-rest] .col:not(.today) { opacity: .5; }
  .dock .cta { height: 60px; padding: 0 20px; border-radius: 18px; display: flex; align-items: center; gap: 10px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); }

  /* sheets, toasts, night */
  /* one sheet system: a dark scrim, a sheet that the page does not read through, three widths, and never over the header or the dock */
  .scrim { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; padding: var(--top) var(--pad-x) var(--bot); background: var(--scrim); animation: scrimin var(--m-2, 160ms) var(--e-out, ease) backwards; }
  @keyframes scrimin { from { opacity: 0; } }
  .sheet { position: relative; width: min(1000px, 100%); max-height: 100%; overflow-y: auto; overscroll-behavior: contain; border-radius: 32px; padding: 22px 26px; display: flex; flex-direction: column; gap: 16px; outline: none; animation: sheet var(--m-3, 240ms) var(--e-spring, ease) backwards; }
  .sheet > * { flex-shrink: 0; }
  .sheet[data-w='s'] { width: min(640px, 100%); } .sheet[data-w='m'] { width: min(860px, 100%); } .sheet[data-w='l'] { width: min(1000px, 100%); }
  .sheet.glass { background: linear-gradient(var(--glass), var(--glass)), linear-gradient(var(--glass), var(--glass)), var(--glass); }
  .sheet .xbtn { width: 52px; height: 52px; flex-shrink: 0; }
  .shead { display: flex; align-items: flex-start; gap: 16px; }
  .shead h2 { display: flex; align-items: center; gap: 10px; }
  /* what a sheet is for sits in its footer; on a phone the footer stays in reach while the sheet scrolls */
  .sfoot { display: flex; align-items: center; gap: 16px; }
  .sfoot > .muted { flex: 1; min-width: 0; font-size: var(--fs-1); line-height: 1.35; }
  .sfoot > .lead, .sfoot > .pill { flex-shrink: 0; }
  .sfoot .evdel { color: var(--danger, #b3261e); } .sfoot .evgo { background: var(--danger, #b3261e); color: #fff; } .sfoot.evask { flex-wrap: wrap; justify-content: flex-end; } .sfoot.evask.rep .evq { flex-basis: 100%; } .sfoot.evask .evq { flex: 1 1 240px; font-size: var(--fs-3); font-weight: var(--w-semi, 600); color: var(--ink); }
  .sfoot > .pill { display: inline-flex; align-items: center; gap: 6px; }
  .sheet.chatsheet { width: min(1180px, 100%); height: min(736px, 100%); gap: 14px; overflow: hidden; }
  /* on a short screen the chat gives way inside the sheet (its side column scrolls) instead of being cut off by it */
  .sheet.chatsheet > fh-chat { flex-shrink: 1; }
  /* the note about the helper sits directly under the subtitle, so it is read before anything is asked */
  /* Ask, set by child: who is asking? One big face each, low enough for the smallest, and a grown-up's way in */
  .askwho { flex: 1; min-height: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; align-content: center; gap: 18px; }
  .whobtn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-width: 168px; min-height: 176px; padding: 16px 14px; border-radius: 28px; background: var(--chip); font-size: var(--fs-4); font-weight: var(--w-bold, 700); color: var(--ink); }
  .whobtn .avatar { overflow: hidden; flex-shrink: 0; }
  .whobtn .wn { max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  :host([data-phone]) .whobtn { min-width: 132px; min-height: 150px; }
  .ainote { margin: -10px 0 0; font-size: var(--fs-2); line-height: 1.3; font-weight: var(--w-semi, 600); color: var(--ink); flex-shrink: 0; }
  .chatsheet .shead .muted { color: var(--ink); }
  :host([data-phone]) .sheet.chatsheet { height: auto; overflow-y: auto; }
  /* a short screen with the on-screen keys open: the Ask sheet takes the full height and drops its two lines of introduction, so the whole keyboard and a few lines of conversation fit */
  @media (max-height: 720px) {
    :host(:not([data-phone])) .sheet.chatsheet[data-kb] { height: min(736px, calc(100% + var(--top) + var(--bot) - 24px)); max-height: none; margin: calc(12px - var(--top)) 0 calc(12px - var(--bot)); }
    :host(:not([data-phone])) .chatsheet[data-kb] .ainote, :host(:not([data-phone])) .chatsheet[data-kb] .shead .muted { display: none; }
  }
  @keyframes sheet { from { opacity: 0; transform: scale(calc(1 - .06 * var(--m-d, 1))) translateY(calc(12px * var(--m-d, 1))); } }
  .themes { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
  .tcard { display: flex; flex-direction: column; gap: 6px; padding: 8px 8px 12px; border-radius: 22px; background: var(--chip); text-align: left; }
  .tcard[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); background: var(--sel-bg); color: var(--sel-ink); }
  .tprev { height: 96px; border-radius: 16px; display: flex; align-items: flex-end; gap: 5px; padding: 10px; background: var(--bg) center / cover; }
  .tprev span { width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,.85); }
  .looks { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  /* a child's own picker: "Same as the panel" and every look */
  .kidlooks { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
  .opt { min-width: 56px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .setrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 52px; }
  .setlabel { display: flex; flex-direction: column; line-height: 1.25; font-size: var(--fs-3); }
  .setlabel .muted { font-size: var(--fs-2); font-weight: 500; }
  .opt .sw { width: 46px; height: 28px; border-radius: 14px; background: var(--track); position: relative; flex-shrink: 0; transition: background-color var(--m-2); }
  .opt .sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform var(--mt-2); }
  .opt[aria-checked='true'] .sw { background: var(--ok); }
  .opt[aria-checked='true'] .sw::after { transform: translateX(18px); }
  /* toasts: centred in a strip that lets touches through; only the toast's own box takes a tap */
  .toasts { position: absolute; left: 0; right: 0; bottom: calc(var(--bot) + 4px); z-index: 44; display: flex; justify-content: center; padding: 0 16px; pointer-events: none; }
  /* a standing place for spoken messages: it is always in the page, so a screen reader hears what is put into it */
  .says { position: absolute; inset: 0; pointer-events: none; }
  /* a read-aloud button while its words are being spoken */
  [data-speaking] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: 0 0 0 3px var(--ink); }
  .toast:empty { display: none; }
  .toast { display: flex; align-items: center; gap: 14px; max-width: min(100%, 720px); box-sizing: border-box; text-align: center; pointer-events: auto; padding: 14px 22px; border-radius: 26px; background: rgba(15,15,20,.92); color: #fff; font-size: var(--fs-3); font-weight: var(--w-semi, 600); animation: fadeIn var(--m-3, 240ms) var(--e-out, ease) backwards; }
  /* a page's own toast (it has no strip around it) sits centred above the dock; pages sit inside the card's body, so this is measured from the page's own bottom edge */
  :host(:not(family-hub-card)) .toast { position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content; max-width: min(90%, 720px); bottom: 16px; z-index: 44; }
  :host([data-phone]:not(family-hub-card)) .toast { position: fixed; bottom: calc(92px + env(safe-area-inset-bottom, 0px)); }
  .toast button { flex-shrink: 0; height: 44px; padding: 0 18px; margin: -6px -10px -6px 0; border-radius: 999px; background: #fff; color: #111; font-size: var(--fs-2); font-weight: var(--w-bold, 700); }
  .toast button:focus-visible { outline-color: #fff; }
  .flash { position: absolute; inset: 0; z-index: 30; background: var(--chip-strong); pointer-events: none; animation: flash var(--m-5) ease forwards; }
  @keyframes flash { from { opacity: .9; } to { opacity: 0; } }
  .night { position: absolute; inset: 0; z-index: 40; padding: 56px 64px; display: flex; flex-direction: column; justify-content: space-between; color: #ffb26b; text-align: left;
    background: #000; animation: scrimin var(--m-4, 400ms) ease backwards;
    /* drawings a look adds here are redrawn in the same dim amber as the digits */
    --ink: #ffb26b; --ink2: rgba(255,178,107,.75); --ink3: rgba(255,178,107,.5); --paper: transparent; --track: rgba(255,178,107,.2); --accent: #ffb26b; --danger: #ffb26b; --ground: #000; }
  .night .nwander { flex: 1; display: flex; flex-direction: column; justify-content: space-between; transform: translate(var(--dx, 0px), var(--dy, 0px)); transition: transform calc(55s * var(--m-d, 1)) linear; }
  /* a phone has little margin to wander in: the clock keeps inside it */
  :host([data-phone]) .night .nwander { transform: translate(calc(var(--dx, 0px) * .3), calc(var(--dy, 0px) * .5)); }
  .night .nclock { display: flex; align-items: center; gap: 40px; }
  .night .nart { line-height: 0; opacity: .8; }
  .night .big { font-size: 168px; font-weight: 300; line-height: .9; font-variant-numeric: tabular-nums; opacity: .78; }
  .night .ndate { font-size: var(--fs-5); font-weight: 500; margin-top: 10px; opacity: .6; }
  .night .dglass { background: rgba(255,178,107,.06); border: 1px solid rgba(255,178,107,.18); -webkit-backdrop-filter: none; backdrop-filter: none; }
  .alarm { position: absolute; inset: 0; z-index: 45; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #fff;
    background: radial-gradient(circle, #f97316, #b91c1c); animation: alarmbg 1s ease-in-out infinite alternate !important; animation-play-state: running !important; }
  @keyframes alarmbg { from { filter: brightness(.9); } to { filter: brightness(1.15); } }
  .dglass { background: rgba(20,20,22,.42); -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,.12); }
  .breathe { animation: breathe 4s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  @keyframes breathe { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
  @keyframes pulse { 50% { opacity: .75; } }

  /* portrait tablets: the same parts, stacked */
  :host([data-shape='tall']) header { flex-wrap: wrap; row-gap: 10px; }
  :host([data-shape='tall']) .capsule { order: 3; flex-basis: 100%; justify-content: flex-start; }
  :host([data-shape='tall']) .body { flex-direction: column; }
  :host([data-shape='tall']) aside { width: auto; flex-direction: row; flex-wrap: wrap; }
  :host([data-shape='tall']) aside > section { flex: 1 1 0; min-width: 200px; }
  :host([data-shape='tall']) aside > .card.rems { min-height: 150px; }
  :host([data-shape='tall']) nav.dock { gap: 0; max-width: 100%; }
  :host([data-shape='tall']) .dock .item { min-width: 62px; }
  :host([data-shape='tall']) .dock .sep { margin: 0 3px; }
  :host([data-shape='tall']) .themes { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  :host([data-shape='tall']) .looks { grid-template-columns: repeat(2, minmax(0, 1fr)); }

  /* tablets narrower than the canvas (data-n1 under 1240 px, data-n2 under 1100 px, data-n3 under 900 px): nothing is scaled down;
     the rail narrows, the dock closes up, toolbars wrap and the week shows fewer days (the card decides how many) */
  /* under 1240 px a child's name in the dock gets less room: with the morning's extra place and three long names the dock used to be a few pixels wider than the screen */
  :host([data-n1]) .dock .item .kn { max-width: 84px; }
  :host([data-n2]) .fh { --rail: 224px; }
  :host([data-n2]) nav.dock { gap: 0; max-width: 100%; }
  :host([data-n2]) .dock .item { min-width: 62px; } :host([data-n2]) .dock .item .kn { max-width: 80px; }
  :host([data-n2]) .dock .sep { margin: 0 3px; }
  :host([data-n3]) .dock .item { min-width: 44px; padding: 0 4px; font-size: var(--fs-2); white-space: nowrap; }
  :host([data-n3]) .dock .item .kn { max-width: 60px; }
  :host([data-n3]) nav.dock { padding: 6px; }
  :host([data-n3]) .planner { padding: 12px 14px 14px; gap: 10px; border-radius: 22px; }
  :host([data-n3]) .bar { gap: 8px; }
  :host([data-n3]) .bar > div:first-child { min-width: 0 !important; flex: 1 1 150px; }
  :host([data-n3]) .legend { gap: 6px 12px; }
  /* a short month keeps every day a full target and scrolls inside the planner */
  :host([data-n3]) .month, :host([data-n2]) .month { grid-auto-rows: minmax(44px, 1fr); overflow-y: auto; }
  :host([data-shape='wide'][data-n2]) aside { overflow-y: auto; scrollbar-width: none; }
  :host([data-shape='wide'][data-n2]) aside > .card.rems { min-height: 120px; }
  :host([data-n2]) .themes { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  :host([data-n3]) .themes { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  :host([data-n3]) .sheet { padding: 18px 18px; border-radius: 26px; }
  :host([data-n3]) .info2 { columns: 2 220px; }
  :host([data-n3]) .sosbtn { flex-basis: 240px; }
  /* portrait and narrower than its canvas: the header keeps one row of controls and puts its chips on a second */
  :host([data-shape='tall']) .fh[data-compact] header { height: auto; max-height: none; }
  :host([data-shape='tall'][data-n3]) .weather .wsub, :host([data-shape='tall'][data-n3]) .weather .wtop, :host([data-shape='tall'][data-n3]) .weather .badge, :host([data-shape='tall'][data-n3]) .presence { display: none; }
  :host([data-shape='tall'][data-n3]) .right { gap: 8px; }
  :host([data-shape='tall'][data-n3]) aside > .card.rems { min-height: 100px; }
  :host([data-shape='tall']) .planner { min-height: 0; }

  /* phones: one column that scrolls, with the dock fixed along the bottom. Nothing here applies to any other screen. */
  :host([data-phone]) { height: auto; }
  :host([data-phone]) .fh { height: auto; min-height: calc((100vh - var(--header-height, 0px)) / var(--z, 1)); overflow: visible; padding: 12px 12px 92px; gap: 12px; }
  :host([data-phone]) header { min-height: 0; gap: 8px; }
  :host([data-phone]) .clock { min-width: 0; flex: 1 1 auto; }
  :host([data-phone]) .clock .hm { font-size: var(--fs-d1); }
  :host([data-phone]) .right { flex-wrap: wrap; justify-content: flex-end; gap: 6px; flex: 1 1 auto; }
  :host([data-phone]) .right > button.round { width: 44px !important; height: 44px !important; min-width: 0 !important; padding: 0 !important; border-radius: 50% !important; }
  :host([data-phone]) .right > .round .rl { display: none !important; }
  :host([data-phone]) .weather { padding: 0 12px; height: 44px; }
  :host([data-phone]) .weather .wsub, :host([data-phone]) .weather .wtop { display: none; }
  :host([data-phone]) .weather .badge, :host([data-phone]) .presence { display: none; }
  :host([data-phone]) header { flex-wrap: wrap; }
  :host([data-phone]) .capsule { height: auto; min-height: 0; flex-wrap: wrap; flex-basis: 100%; gap: 8px; }
  :host([data-phone]) .cap { max-width: 100%; height: 44px; font-size: var(--fs-2); flex-shrink: 1; overflow: hidden; }
  :host([data-phone]) .body { flex: none; }
  :host([data-phone]) .planner { padding: 14px 12px; border-radius: 22px; }
  :host([data-phone]) .bar { gap: 8px; }
  :host([data-phone]) .bar > div:first-child { min-width: 0; flex: 1 1 100%; }
  /* on a phone a choice of several fills the row, and wraps when its words are too long for one */
  :host([data-phone]) .seg { flex: 1 1 100%; flex-wrap: wrap; height: auto; }
  :host([data-phone]) .seg button { flex: 1 1 auto; min-width: 0; height: auto; min-height: 44px; padding: 6px 10px; line-height: 1.15; }
  :host([data-phone]) .legend { gap: 6px 10px; font-size: var(--fs-2); }
  :host([data-phone]) .week { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; min-height: 400px; }
  :host([data-phone]) .week .col { flex: 0 0 47%; scroll-snap-align: start; }
  :host([data-phone]) .daylist { overflow: visible; flex: none; display: flex !important; }
  :host([data-phone]) .dayrow { gap: 10px; padding: 10px 12px; }
  :host([data-phone]) .dayrow > span:first-child { width: 64px !important; font-size: var(--fs-2) !important; }
  :host([data-phone]) .month { min-height: 380px; }
  :host([data-phone]) .cell .mev { font-size: 0; gap: 0; }
  :host([data-phone]) .cell .mmore { padding: 0 3px; font-size: var(--fs-1); }
  :host([data-phone]) aside { flex-direction: column; }
  :host([data-phone]) nav.dock { position: fixed; left: 8px; right: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); z-index: 9; max-width: none; overflow-x: auto; justify-content: flex-start; padding: 6px; border-radius: 22px; scrollbar-width: none; }
  :host([data-phone]) nav.dock::-webkit-scrollbar { display: none; }
  :host([data-phone]) .dock .item { min-width: 60px; height: 58px; flex-shrink: 0; font-size: var(--fs-1); }
  :host([data-phone]) nav.dock[data-more] { -webkit-mask-image: linear-gradient(to left, transparent, #000 36px); mask-image: linear-gradient(to left, transparent, #000 36px); }
  :host([data-phone]) .dock .kidbtn .avatar { width: 34px !important; height: 34px !important; }

  :host([data-phone]) .scrim, :host([data-phone]) .night, :host([data-phone]) .alarm { position: fixed; }
  :host([data-phone]) .scrim { padding: 12px 10px calc(84px + env(safe-area-inset-bottom, 0px)); }
  :host([data-phone]) .sheet, :host([data-phone]) .sheet[data-w] { width: 100%; max-height: 100%; padding: 18px 16px; border-radius: 24px; }
  :host([data-phone]) .sfoot { position: sticky; bottom: -18px; z-index: 2; flex-direction: column; align-items: stretch; gap: 6px; margin: 0 -16px -18px; padding: 10px 16px 14px; background: var(--foot-bg, var(--chip-strong)); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); box-shadow: 0 -8px 18px rgba(0,0,0,.14); }
  :host([data-phone]) aside { width: auto; }
  :host([data-phone]) aside > .card.rems { flex: none; overflow: visible; }
  :host([data-phone]) .remlist { overflow: visible; }
  :host([data-phone]) .themes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  :host([data-phone]) .toasts { position: fixed; bottom: calc(92px + env(safe-area-inset-bottom, 0px)); padding: 0 10px; }
  :host([data-phone]) .toast { border-radius: 20px; }
  :host([data-phone]) .night { padding: 32px 24px; }
  :host([data-phone]) .night .big { font-size: var(--fs-d5); }
  :host([data-phone]) .night .nclock { flex-direction: column; align-items: flex-start; gap: 16px; }
  :host([data-phone]) .keys { display: none; }

  ${lookCss}

  @media (forced-colors: active) {
    button, .pill, .cap, .key, input, .field, [role='switch'], [role='tab'], [role='slider'] { border: 1px solid ButtonText; }
    [aria-pressed='true'], [aria-selected='true'], [aria-current='page'], [aria-checked='true'], .ev.next, .dayrow.next { forced-color-adjust: none; background: Highlight; color: HighlightText; border-color: Highlight; box-shadow: none; }
    [aria-pressed='true'] *, [aria-selected='true'] *, [aria-current='page'] *, [aria-checked='true'] *, .ev.next *, .dayrow.next * { color: HighlightText; text-decoration: none; }
    :is(button, input)[disabled], [aria-disabled='true'] { opacity: 1; color: GrayText; border-color: GrayText; }
  }
`;
