// Dark mode for the Glass look: every page wears it in every theme but Space; the choice (Light, Dark, Auto) is kept per screen and is
// in More, Looks and in Settings, House; Auto follows the sun and, where there is a reading, the room's light, with a margin, a wait and
// never while a finger is down; the tokens keep their contrast floors; and no pale surface from light mode is left on a dark page.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4823] node scripts/tests/dark.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4823);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
/** Open the preview. `clock`: 'fixed' holds the time still; 'run' installs a clock the test can run forward. A context each, as the preview keeps the theme in the browser. */
const open = async (qs, { time = '16:20', clock = 'fixed', store = null, touch = false } = {}) => { const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: touch });
  if (store) await ctx.addInitScript((s) => { window.__store = s; }, store);
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(`${qs}: ${String(e)}`)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(`${qs}: ${m.text()}`); });
  const at = new Date(`2026-11-10T${time}:00+08:00`);
  if (clock === 'run') await page.clock.install({ time: at }); else await page.clock.setFixedTime(at);
  await page.goto(`http://localhost:${PORT}/?look=glass&${qs}`); await page.waitForFunction('window.__ready === true');
  if (clock === 'run') await page.clock.runFor(1500); else await page.waitForTimeout(/art=1|night=1/.test(qs) ? 3500 : 900); return page; };
const shut = (page) => page.context().close();
/** What the panel is wearing. */
const state = (page) => page.evaluate(() => { const c = document.querySelector('family-hub-card'), fh = c.shadowRoot.querySelector('.fh'), cs = getComputedStyle(fh);
  const kids = [...c.shadowRoot.querySelectorAll('*')].filter((e) => e.localName.startsWith('fh-') && e.localName !== 'fh-ambient' && e.localName !== 'fh-pic' && e.shadowRoot);
  return { dark: fh.hasAttribute('data-dark'), host: c.hasAttribute('data-dark'), fade: fh.hasAttribute('data-dkfade'), ink: cs.getPropertyValue('--ink').trim(), glass: cs.getPropertyValue('--glass').trim(), tod: cs.getPropertyValue('--tod').trim(),
    dim: Number(getComputedStyle(fh.querySelector('.dkdim') ?? fh).opacity), hasDim: !!fh.querySelector('.dkdim'), kids: kids.map((e) => `${e.localName}:${e.hasAttribute('data-dark')}`), mode: c._dkMode, saved: localStorage.getItem('family-hub-dark') }; });
/** Give Home Assistant a new state for one entity (the sun, the room's light). */
const setState = (page, id, st, attrs = {}) => page.evaluate(([id, st, attrs]) => { const c = document.querySelector('family-hub-card'); c.hass = { ...c.hass, states: { ...c.hass.states, [id]: { entity_id: id, state: String(st), attributes: attrs } } }; }, [id, st, attrs]);
const LIGHT_INK = { sea: '#0b2236', sunset: '#2b1408', reef: '#03252b', bush: '#1c2a12' };
const lum = (hex) => { const n = parseInt(hex.slice(1), 16), f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };

/* ---------- 1. every page wears it, in every theme but Space ---------- */
const PAGES = fs.readFileSync(new URL('./clearance.mjs', import.meta.url), 'utf8').match(/const PAGES = \(process\.env\.PAGES \|\| \[([\s\S]*?)\]\.join/)[1].match(/'[^']+'/g).map((s) => s.slice(1, -1));
ok('the page list is the fit check\'s own 37', PAGES.length === 37, PAGES.length);
/** A pale surface left from light mode: something painted, not small, nearly opaque and light, that is not one of the things meant to be light on a dark page. */
const pale = (page) => page.evaluate(() => { const out = new Map();
  // meant to be light: the chosen segment and chip (pale fill, dark ink), the filled action, a switch's knob, paper to draw on, pictures and their plates, record covers and labels, a person's disc, the tick of the chosen card, keys' caps lock
  const MEANT = '.home, .ink, .snap, .snap *, .fcap, .go, .bar button, .lead, .primary, [aria-pressed="true"], [aria-current], [aria-selected="true"], [aria-checked="true"], [data-go], canvas, img, svg, svg *, .avatar, .avwrap, .avwrap *, fh-pic, .knob, .sw, .sw *, .tog, .tog *, .cover, .art, .puck, .sleeve, .rec, .lookprev, .lookprev *, .tprev, .tprev *, .badge, .dot, .sw6, .swatch, .col, .cap.hot, .cap[data-warm], .sosbtn, .live, .check, .paper, .pad, .board, .hstep, [data-paper], .mat, .aframe, .aframe *, .artm, .artm *, .toast button, .thumb, input[type="range"], .bar > i, .meter > i, .fill, .lvl, .pin, .hpad, .mpad, .st, .stn, .coin, .dcoin, .ring, .now, .today, .dnum, .num, .n, .count, .bub, .me, .tint, .key[data-on], .ampm *, .tile[aria-pressed], .heart, .star, .marble, .jar, .jar *, .kite, .actor, .actor *, .pool, .pool *, .bulb, .lamp, .on, [data-on], [data-playing] > i, .sdot, .pdot, .cdot, .chipdot, .legend i, .who i, .c, .sun, .moon';
  const lumOf = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const p = m[1].split(/[,/ ]+/).filter(Boolean).map(Number); const a = p.length > 3 ? p[3] : 1; if (a < 0.6) return null; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]); };
  const parentOf = (e) => e.parentElement ?? (e.parentNode instanceof ShadowRoot ? e.parentNode.host : null);
  const shown = (e) => { for (let x = e; x; x = parentOf(x)) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility !== 'visible' || Number(cs.opacity) < 0.3) return false; } return true; };
  const walk = (root) => { for (const e of root.querySelectorAll('*')) { if (e.shadowRoot) walk(e.shadowRoot); if (e.localName === 'fh-ambient' || e.matches(MEANT) || e.closest?.(MEANT)) continue;
    const r = e.getBoundingClientRect(); if (r.width * r.height < 1600 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
    const l = lumOf(getComputedStyle(e).backgroundColor); if (l === null || l < 0.55 || !shown(e)) continue;
    const host = e.getRootNode().host?.localName ?? ''; const k = `${host} ${e.localName}.${String(e.className?.baseVal ?? e.className ?? '').trim().split(/\s+/).slice(0, 3).join('.')}`; out.set(k, (out.get(k) ?? 0) + 1); } };
  walk(document.querySelector('family-hub-card').shadowRoot); return [...out].map(([k, n]) => `${k} x${n}`); });
for (const pg0 of PAGES) { const [pg, time = '16:20'] = pg0.split('@');
  const page = await open(`theme=sea&page=${pg}&dark=1`, { time }); const s = await state(page);
  ok(`${pg}: wears dark (the root, the card and every component inside it), light ink, the photo dimmed`, s.dark && s.host && s.ink !== LIGHT_INK.sea && lum(s.ink) > 0.7 && s.dim === 1 && s.kids.every((k) => k.endsWith(':true')), { ink: s.ink, dim: s.dim, kids: s.kids.filter((k) => !k.endsWith(':true')) });
  const p = await pale(page); ok(`${pg}: no pale surface from light mode is left`, p.length === 0, p.slice(0, 6).join(' | '));
  await shut(page); }
for (const theme of ['sunset', 'reef', 'bush']) for (const pg of ['planner', 'kid&kid=0', 'groceries', 'music', 'weather', 'home', 'planner&sheet=sitter', 'planner&sheet=settings&pane=house']) {
  const page = await open(`theme=${theme}&page=${pg}&dark=1`); const s = await state(page);
  ok(`${theme}, ${pg}: wears its own dark set`, s.dark && lum(s.ink) > 0.7 && s.ink !== LIGHT_INK[theme], s.ink);
  const p = await pale(page); ok(`${theme}, ${pg}: no pale surface from light mode is left`, p.length === 0, p.slice(0, 6).join(' | ')); await shut(page); }
{ const inks = new Set(); for (const theme of ['sea', 'sunset', 'reef', 'bush']) { const page = await open(`theme=${theme}&page=planner&dark=1`); const s = await state(page); inks.add(s.glass); await shut(page); }
  ok('the four dark themes are four places, not one navy: each has its own glass', inks.size === 4, [...inks]); }

/* ---------- 2. what does not change ---------- */
{ const page = await open('theme=space&page=planner&dark=1'); const s = await state(page);
  ok('Space is dark already: it is not counted as dark mode and keeps its own set', !s.dark && !s.host && s.ink === '#f4f6ff' && !s.hasDim, s); await shut(page); }
for (const look of ['fridge', 'orbit', 'sports', 'obsidian']) { const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } }); const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-11-10T16:20:00+08:00')); await page.goto(`http://localhost:${PORT}/?look=${look}&page=planner&dark=1`); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(600);
  const s = await state(page); ok(`${look}: not touched by dark mode`, !s.dark && !s.host && !s.hasDim, { dark: s.dark, dim: s.hasDim }); await ctx.close(); }
{ const page = await open('theme=sea&page=planner'); const s = await state(page);
  ok('with nothing chosen a screen is Light: the light set, the layer clear, the tint of the hour as it was', !s.dark && s.ink === LIGHT_INK.sea && s.dim === 0 && s.mode === 'light', s); await shut(page); }
{ const page = await open('theme=sea&page=planner&dark=1', { time: '21:30' }); const s = await state(page);
  ok('in the dark the tint of the hour is not laid over the dimmed photo', s.dark && s.tod === 'transparent', s.tod); await shut(page); }
{ const page = await open('theme=sea&page=kid&kid=0&dark=1'); const s = await state(page);
  ok('a child\'s page follows the panel into the dark', s.dark && s.kids.every((k) => k.endsWith(':true')), s.kids); await shut(page); }

/* ---------- 3. the setting: More, Looks and Settings, House; kept on this screen ---------- */
{ const page = await open('theme=sea&page=planner&sheet=themes');
  const seg = () => page.evaluate(() => { const g = document.querySelector('family-hub-card').shadowRoot.querySelector('.seg[data-set="dark"]'); return g ? [...g.querySelectorAll('button')].map((b) => `${b.textContent.trim()}:${b.getAttribute('aria-pressed')}`) : null; });
  ok('More, Looks has one control with three choices: Light, Dark, Auto', JSON.stringify(await seg()) === JSON.stringify(['Light:true', 'Dark:false', 'Auto:false']), await seg());
  const tap = (word) => page.evaluate((w) => { [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.seg[data-set="dark"] button')].find((b) => b.textContent.trim() === w).click(); }, word);
  await tap('Dark'); await page.waitForTimeout(200); let s = await state(page);
  ok('Dark: the panel goes dark at once (with the fade), and the choice is kept on this screen', s.dark && s.fade && s.saved === 'dark' && s.mode === 'dark', s);
  const prev = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot; return { glass: r.querySelector('.lookprev[data-prev="glass"]').hasAttribute('data-dark'), sea: r.querySelector('.tprev').hasAttribute('data-dark'), space: [...r.querySelectorAll('.tprev')].pop().hasAttribute('data-dark') }; });
  ok('the pictures in the Looks sheet show what will be worn: Glass and the backgrounds dimmed, Space as it is', prev.glass && prev.sea && !prev.space, prev);
  await page.waitForTimeout(2100); s = await state(page); ok('the fade ends by itself', s.dark && !s.fade, s.fade);
  await tap('Light'); await page.waitForTimeout(200); s = await state(page); ok('Light: back again, and kept', !s.dark && s.saved === 'light', s);
  await shut(page); }
{ // the preview clears the saved choice when it is not in the address: so "kept" is read from the card's own start
  const page = await open('theme=sea&page=planner&dark=auto&sun=below'); const s = await state(page);
  ok('a saved Auto is read when the screen loads, and with the sun down it is dark from the first frame, with no fade', s.mode === 'auto' && s.dark && !s.fade, s); await shut(page); }
{ const page = await open('theme=sea&page=planner&darkdef=auto&sun=below'); const s = await state(page);
  ok('a screen that has not chosen takes the house\'s default (dark: auto in the card)', s.mode === 'auto' && s.dark && s.saved === null, s); await shut(page); }
{ const page = await open('theme=sea&page=planner&darkdef=auto&dark=light&sun=below'); const s = await state(page);
  ok('a screen\'s own choice wins over the house\'s default', s.mode === 'light' && !s.dark, s); await shut(page); }
{ const page = await open('theme=sea&page=planner&sheet=settings&pane=house');
  const got = await page.evaluate(async () => { const c = document.querySelector('family-hub-card'), st = c.shadowRoot.querySelector('fh-settings'); const card = st.shadowRoot.querySelector('.scard[data-screen]'); if (!card) return null;
    const btns = [...card.querySelectorAll('button')].filter((b) => ['Light', 'Dark', 'Auto'].includes(b.textContent.trim())); const before = btns.map((b) => `${b.textContent.trim()}:${b.getAttribute('aria-pressed')}`);
    btns.find((b) => b.textContent.trim() === 'Dark').click(); await new Promise((r) => setTimeout(r, 250)); return { before, dark: c.shadowRoot.querySelector('.fh').hasAttribute('data-dark'), st: st.hasAttribute('data-dark'), saved: localStorage.getItem('family-hub-dark'), dirty: /unsaved|not saved/i.test(st.shadowRoot.textContent) && !/All saved/.test(st.shadowRoot.textContent) }; });
  ok('Settings, House, "This screen" has the same three choices, and Dark there darkens the panel behind it at once', !!got && got.before.join() === 'Light:true,Dark:false,Auto:false' && got.dark && got.st && got.saved === 'dark', got);
  ok('it is this screen\'s own: it does not make Settings ask to be saved', !!got && !got.dirty, got?.dirty); await shut(page); }
{ const page = await open('theme=space&page=planner&sheet=themes'); const t = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('.seg[data-set="dark"]')?.closest('.setrow')?.textContent ?? '');
  ok('on Space the control says Space is always dark', /Space Mission is always dark/.test(t), t.slice(0, 80)); await shut(page); }
{ const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } }); const page = await ctx.newPage(); await page.clock.setFixedTime(new Date('2026-11-10T16:20:00+08:00')); await page.goto(`http://localhost:${PORT}/?look=orbit&page=planner&sheet=themes`); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(500);
  ok('a look with no dark mode does not offer the control', await page.evaluate(() => !document.querySelector('family-hub-card').shadowRoot.querySelector('.seg[data-set="dark"]'))); await ctx.close(); }

/* ---------- 4. Auto: the sun, the room, the margin, the wait, the finger ---------- */
{ const page = await open('theme=sea&page=planner&dark=auto&sun=above', { clock: 'run' }); let s = await state(page);
  ok('Auto with the sun up: light', s.mode === 'auto' && !s.dark, s);
  await setState(page, 'sun.sun', 'below_horizon', { elevation: -1 }); await page.clock.runFor(5000); s = await state(page);
  ok('sunset: nothing changes in the first seconds (the wish must stand)', !s.dark, s.dark);
  await page.clock.runFor(27000); s = await state(page);
  ok('half a minute after sunset the panel goes dark, in one slow fade', s.dark && s.fade, s);
  await page.clock.runFor(2500); s = await state(page); ok('and the fade ends', s.dark && !s.fade, s.fade);
  await setState(page, 'sun.sun', 'above_horizon', { elevation: 1 }); await page.clock.runFor(32000); s = await state(page);
  ok('sunrise: light again', !s.dark, s.dark); await shut(page); }
{ const page = await open('theme=sea&page=planner&dark=auto&sun=above', { clock: 'run' });
  await page.mouse.move(960, 20); await page.mouse.down(); await setState(page, 'sun.sun', 'below_horizon'); await page.clock.runFor(45000); let s = await state(page);
  ok('never while a finger is down: sunset with a finger on the glass changes nothing', !s.dark, s.dark);
  await page.mouse.up(); await page.clock.runFor(1500); s = await state(page);
  ok('it changes when the finger lifts', s.dark, s.dark); await shut(page); }
{ const page = await open('theme=sea&page=planner&dark=auto&sun=above&lux=200', { clock: 'run' }); let s = await state(page);
  const lux = async (n, secs) => { await setState(page, 'sensor.kitchen_light', n, { unit_of_measurement: 'lx' }); await page.clock.runFor(secs * 1000); return state(page); };
  ok('Auto by day in a bright room: light', !s.dark, s.dark);
  s = await lux(4, 10); ok('a shadow over the sensor for ten seconds changes nothing', !s.dark, s.dark);
  s = await lux(200, 35); ok('…and the room bright again leaves it light', !s.dark, s.dark);
  s = await lux(4, 35); ok('a dim room by day (4 lux) goes dark after the wait', s.dark, s.dark);
  s = await lux(20, 40); ok('the margin: 20 lux is not bright enough to go back (it would flicker at dusk)', s.dark, s.dark);
  s = await lux(45, 40); ok('a lamp-lit room (45 lux) is light again', !s.dark, s.dark);
  s = await lux(20, 40); ok('and 20 lux from the light side stays light', !s.dark, s.dark);
  await setState(page, 'sun.sun', 'below_horizon'); s = await lux(300, 40); ok('after sunset it is dark however bright the kitchen lights are', s.dark, s.dark);
  await shut(page); }
{ const page = await open('theme=sea&page=planner&dark=auto', { time: '20:10' }); const a = await state(page); await shut(page);
  const page2 = await open('theme=sea&page=planner&dark=auto', { time: '12:00' }); const b = await state(page2); await shut(page2);
  ok('with no sun in Home Assistant Auto goes by the clock: dark at 8:10 pm, light at noon', a.dark && !b.dark, { evening: a.dark, noon: b.dark }); }
{ const page = await open('theme=sea&page=planner&dark=auto&sun=above', { clock: 'run' });
  await page.evaluate(() => { [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.dock .item')].find((b) => /Weather$/.test(b.textContent.trim())).click(); }); await page.clock.runFor(800);
  const before = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather')?.shadowRoot.querySelector('fh-radar')?.hasAttribute('dark') ?? null);
  await setState(page, 'sun.sun', 'below_horizon'); await page.clock.runFor(33000);
  const after = await page.evaluate(() => { const w = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather'); return { host: w?.hasAttribute('data-dark'), radar: w?.shadowRoot.querySelector('fh-radar')?.hasAttribute('dark') ?? null }; });
  ok('a page that is open follows: Weather and its radar map go dark with the panel', before === false && after.host === true && after.radar === true, { before, after }); await shut(page); }

/* ---------- 5. contrast floors, from the tokens the panel is wearing ---------- */
for (const theme of ['sea', 'sunset', 'reef', 'bush']) { const page = await open(`theme=${theme}&page=planner&dark=1`);
  const r = await page.evaluate(() => { const fh = document.querySelector('family-hub-card').shadowRoot.querySelector('.fh'), cs = getComputedStyle(fh), v = (n) => cs.getPropertyValue(n).trim();
    const parse = (c) => { if (c.startsWith('#')) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255, 1]; } const p = /rgba?\(([^)]+)\)/.exec(c)[1].split(/[,/ ]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; };
    const over = (top, under) => { const [r, g, b, a] = parse(top); return under.map((u, i) => (i < 3 ? [r, g, b][i] * a + u * (1 - a) : 1)); };
    const L = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    // the worst the dimmed, blurred photo can be under a panel: nearly black, and a dim mid tone (the brightest patch of any of the four after its layer)
    const out = {}; for (const [name, back] of [['darkest', [4, 8, 14, 1]], ['lightest', [70, 62, 60, 1]]]) { const glass = over(v('--glass'), back), chip = over(v('--chip'), glass), strong = over(v('--chip-strong'), glass), soft = over(v('--chip-soft'), glass);
      out[name] = { ink: cr(parse(v('--ink')), glass), inkChip: cr(parse(v('--ink')), strong), ink2: Math.min(cr(parse(v('--ink2')), glass), cr(parse(v('--ink2')), chip), cr(parse(v('--ink2')), strong)), ink3: Math.min(cr(parse(v('--ink3')), glass), cr(parse(v('--ink3')), soft)), done: Math.min(cr(parse(v('--ink-done')), glass), cr(parse(v('--ink-done')), soft)),
        primary: cr(parse(v('--primary')), glass), accent: cr(parse(v('--accent')), glass), okc: cr(parse(v('--ok')), glass), danger: cr(parse(v('--danger')), glass), wet: cr(parse(v('--wet')), glass), sel: cr(parse(v('--sel-bg')), chip) }; }
    out.pairs = { onPrimary: cr(parse(v('--on-primary')), parse(v('--primary'))), sel: cr(parse(v('--sel-ink')), parse(v('--sel-bg'))), onOk: cr(parse(v('--on-ok')), parse(v('--ok'))), onDanger: cr(parse(v('--on-danger')), parse(v('--danger'))), family: cr([255, 255, 255, 1], parse(v('--p-family'))), halo: cr(parse(v('--ring-halo')), parse(v('--ink'))) };
    return out; });
  const w = (k) => Math.min(r.darkest[k], r.lightest[k]), f1 = (n) => Math.round(n * 100) / 100;
  ok(`${theme}: words keep 4.5:1 on the panels and the chips (the main ink 7:1)`, w('ink') >= 7 && w('inkChip') >= 4.5 && w('ink2') >= 4.5 && w('ink3') >= 4.5 && w('done') >= 4.5, { ink: f1(w('ink')), ink2: f1(w('ink2')), ink3: f1(w('ink3')), done: f1(w('done')) });
  ok(`${theme}: fills and marks keep 3:1 against the panel (the action, the accent, done, danger, rain, the chosen segment)`, ['primary', 'accent', 'okc', 'danger', 'wet', 'sel'].every((k) => w(k) >= 3), Object.fromEntries(['primary', 'accent', 'okc', 'danger', 'wet', 'sel'].map((k) => [k, f1(w(k))])));
  ok(`${theme}: ink on each fill keeps 4.5:1 (the action, the chosen segment, done, danger, the Family disc), and the focus ring has two tones`, r.pairs.onPrimary >= 4.5 && r.pairs.sel >= 4.5 && r.pairs.onOk >= 4.5 && r.pairs.onDanger >= 4.5 && r.pairs.family >= 4.5 && r.pairs.halo >= 7, Object.fromEntries(Object.entries(r.pairs).map(([k, n]) => [k, f1(n)])));
  await shut(page); }

/* ---------- 6. the fade is a fade of colour: it has no travel, so calm mode keeps it ---------- */
{ const page = await open('theme=sea&page=planner&sheet=themes&calm=1');
  await page.evaluate(() => { [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.seg[data-set="dark"] button')].find((b) => b.textContent.trim() === 'Dark').click(); }); await page.waitForTimeout(150);
  const t = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot; const cs = getComputedStyle(r.querySelector('.fh > .body')); return { prop: cs.transitionProperty, dur: cs.transitionDuration, dim: getComputedStyle(r.querySelector('.dkdim')).transitionDuration }; });
  ok('while it changes, every colour crosses over 1.6 s (and nothing but colour)', /background-color/.test(t.prop) && !/transform|all/.test(t.prop) && /1\.6s/.test(t.dur) && /1\.6s/.test(t.dim), t); await shut(page); }

await browser.close(); srv.close();
console.log(`\n${pass} passed, ${fails.length} failed`);
console.log(errs.length ? `page errors:\n${[...new Set(errs)].map((e) => ' - ' + e.slice(0, 300)).join('\n')}` : 'page errors: none');
process.exit(fails.length || errs.length ? 1 : 0);
