// Buttons checks (0.32.1): the header's and the dock's buttons are drawings with a hue each; hues come in four families across the
// places; Medicine, Looks and House info stay plain; a press moves one button once, a page that opens moves its place once, and
// only Music keeps moving, and only while music plays; nothing moves in calm mode; sizes and the header's height are unchanged.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4826] node scripts/tests/buttons.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4826);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, time = '16:20', { w = 1920, h = 1080 } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const read = (page) => page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, z = Number(getComputedStyle(r.querySelector('.fh')).zoom) || 1;
  const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const one = (b) => { const s = b.querySelector('svg.pic2'), cs = s ? getComputedStyle(s) : null, q = b.getBoundingClientRect(), sq = s?.getBoundingClientRect();
    return { id: b.dataset.nav ?? b.dataset.act, ic: s?.dataset.ic ?? '', bg: cs?.backgroundColor ?? '', line: cs?.color ?? '', radius: cs?.borderRadius ?? '', contrast: cs && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) ? Math.round(ratio(cs.backgroundColor, cs.color) * 10) / 10 : 0,
      w: Math.round(q.width / z), h: Math.round(q.height / z), tile: sq ? Math.round(sq.width / z) : 0, moving: (s ? s.getAnimations({ subtree: true }) : []).filter((a) => a.animationName && a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity).length, loops: (s ? s.getAnimations({ subtree: true }) : []).filter((a) => a.animationName && a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length, just: b.hasAttribute('data-just'), arrive: b.hasAttribute('data-arrive'), label: b.textContent.trim() }; };
  const dock = r.querySelector('nav.dock').getBoundingClientRect();
  return { dock: [...r.querySelectorAll('nav.dock .item:not(.kidbtn)')].map(one), head: [...r.querySelectorAll('.right > .hb')].map(one), headH: Math.round(r.querySelector('header').getBoundingClientRect().height / z), dockIn: dock.left >= 0 && dock.right <= innerWidth,
    labels: [...new Set([...r.querySelectorAll('nav.dock .item:not(.kidbtn)')].map((b) => { const t = [...b.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim()).pop() ?? b.querySelector('.lb')?.firstChild; const g = document.createRange(); g.selectNodeContents(t); return Math.round(g.getBoundingClientRect().bottom); }).filter((y) => y > 0))] }; });
const by = (list, id) => list.find((x) => x.id === id);
const C = (page) => page.locator('family-hub-card');

// 1. drawings and hues, in every look
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const page = await open(`look=${look}&page=planner`, '07:10'); const b = await read(page);
  ok(`${look}: every dock button is a drawing of its own`, b.dock.length === 10 && new Set(b.dock.map((x) => x.ic)).size === 10 && b.dock.map((x) => x.ic).join(',') === 'morning,planner,groceries,doodle,music,weather,home,allon,alloff,dinner', b.dock.map((x) => x.ic));
  ok(`${look}: Ask in the header is a drawing; More is three dots (since 0.33.0 the other drawings are in the More sheet)`, b.head.map((x) => x.id).join(',') === 'ask,more' && b.head[0].ic === 'ask', b.head.map((x) => x.id));
  { const mp = await open(`look=${look}&page=planner&sheet=more`, '07:10'); ok(`${look}: More's buttons are drawings of their own`, (await mp.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.sheet[data-sheet="more"] .morebtn svg.pic2')].map((x) => x.dataset.ic))).join(',') === 'looks,medicine,info,night'); await mp.context().close(); }
  ok(`${look}: every button is still 44 px or more, and the header is no taller`, [...b.dock, ...b.head].filter((x) => x.w > 0).every((x) => x.w >= 44 && x.h >= 44) && b.head.every((x) => x.h <= 52), [...b.dock, ...b.head].map((x) => `${x.id} ${x.w}x${x.h}`));
  ok(`${look}: the dock is inside the screen and its labels rest on one line`, b.dockIn && b.labels.length === 1, b.labels);
  ok(`${look}: nothing moves at rest`, [...b.dock, ...b.head].every((x) => x.moving === 0), [...b.dock, ...b.head].filter((x) => x.moving).map((x) => x.id));
  await page.context().close(); }
{ const page = await open('look=glass&page=settingsless', '07:10'); await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c._page = 'none'; await c.updateComplete; }); await page.waitForTimeout(300); const b = await read(page), d = (id) => by(b.dock, id);
  ok('Glass: four hue families across the seven places (warm, blue, green, violet)', d('sun').bg === d('home').bg && d('calendar').bg === d('cloud').bg && d('cart').bg === d('music').bg && new Set(['sun', 'calendar', 'cart', 'pencil', 'music', 'cloud', 'home'].map((i) => d(i).bg)).size === 4, b.dock.map((x) => x.bg));
  ok('Glass: neighbours in the dock never share a hue', b.dock.every((x, i) => i === 0 || x.bg !== b.dock[i - 1].bg));
  ok('Glass: a place is a rounded square, a house action a circle', ['sun', 'calendar', 'cart', 'pencil', 'music', 'cloud', 'home'].every((id) => d(id).radius === '12px') && ['lights-on', 'lights-off', 'dinner'].every((id) => d(id).radius === '50%'), b.dock.map((x) => x.radius));
  ok('Glass: the line on every tile is 4.5:1 or better', b.dock.every((x) => x.contrast >= 4.5), b.dock.map((x) => `${x.id} ${x.contrast}`));
  ok('Glass: the page you are on fills its tile', await (async () => { const gp = await open('look=glass&page=groceries'); await gp.clock.runFor(1500); await gp.waitForTimeout(200); await gp.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelectorAll('nav.dock svg').forEach((x) => x.getAnimations().forEach((a) => { try { a.finish(); } catch { /* endless */ } }))); return (await read(gp)).dock.find((x) => x.id === 'cart').bg; })() === 'rgb(20, 89, 44)');
  ok('Glass: red appears once in the dock, on Dinner', b.dock.filter((x) => /rgb\(198, 40, 40\)/.test(x.bg)).map((x) => x.id).join() === 'dinner');
  const hp = await open('look=glass&page=planner', '07:10'), hb = await read(hp), h = (id) => by(hb.head, id);
  ok('Glass: in the header Ask carries a hue and More does not', h('ask').contrast >= 4.5 && h('more').contrast === 0, hb.head.map((x) => `${x.id} ${x.bg}`));
  await hp.evaluate(() => { document.querySelector('family-hub-card')._sheet = 'more'; }); await hp.waitForTimeout(400);
  ok('Medicine is plain: no tile, no hue, the same colours as Looks beside it, and no moving part', await hp.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, m = getComputedStyle(r.querySelector('.morebtn[data-act="meds"] svg')), l = getComputedStyle(r.querySelector('.morebtn[data-act="looks"] svg')); return m.backgroundColor === l.backgroundColor && m.color === l.color && r.querySelectorAll('.morebtn[data-act="meds"] svg [class*="p-"]').length === 0; }));
  await page.context().close(); }

// 2. movement: one button, once
{ const page = await open('look=glass&page=planner&timer=0'); const card = C(page);
  await card.locator('nav.dock .item[data-nav="cart"]').click(); await page.waitForTimeout(120); let b = await read(page);
  ok('a place that opens plays its arrival, and only it moves', by(b.dock, 'cart').arrive && !by(b.dock, 'cart').just && by(b.dock, 'cart').moving >= 1 && [...b.dock, ...b.head].filter((x) => x.moving).length === 1, by(b.dock, 'cart'));
  await page.clock.runFor(1000); await page.waitForTimeout(200); b = await read(page);
  ok('then it is still again', [...b.dock, ...b.head].every((x) => x.moving === 0 && !x.arrive && !x.just));
  await card.locator('nav.dock .item[data-nav="cart"]').click(); await page.waitForTimeout(120); b = await read(page);
  ok('a press on the page you are on answers the finger', by(b.dock, 'cart').just && by(b.dock, 'cart').moving >= 1);
  await card.locator('nav.dock .item[data-nav="calendar"]').click(); await page.waitForTimeout(120); b = await read(page);
  ok('a second button takes the movement from the first: never two at once', [...b.dock, ...b.head].filter((x) => x.just || x.arrive).map((x) => x.id).join() === 'calendar');
  await page.clock.runFor(1000); await card.locator('.right .hb[data-act="more"]').click(); await page.waitForTimeout(120); b = await read(page);
  ok('a header button answers the finger too', by(b.head, 'more').just);
  await page.context().close(); }
{ // Music sways only while music plays, and never in calm mode
  let page = await open('look=glass&page=planner'); let b = await read(page);
  ok('at rest with nothing playing in the house player… the preview has the lounge playing: Music is the only loop', [...b.dock, ...b.head].filter((x) => x.loops).map((x) => x.id).join() === (await page.evaluate(() => { const c = document.querySelector('family-hub-card'); return c.hass.states[c._config.music_player]?.state === 'playing' ? 'music' : ''; })), [...b.dock, ...b.head].filter((x) => x.loops).map((x) => x.id));
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'), id = c._config.music_player; c.hass = { ...c.hass, states: { ...c.hass.states, [id]: { ...c.hass.states[id], state: 'paused' } } }; }); await page.waitForTimeout(300); b = await read(page);
  ok('when the music stops, so does the sway', [...b.dock, ...b.head].every((x) => x.loops === 0 && x.moving === 0));
  await page.context().close();
  page = await open('look=glass&page=planner&calm=1'); await C(page).locator('nav.dock .item[data-nav="cart"]').click(); await page.waitForTimeout(150); b = await read(page);
  ok('calm mode: no loop, and a press travels nowhere', [...b.dock, ...b.head].every((x) => x.loops === 0) && await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot; return [...r.querySelectorAll('nav.dock svg.pic2, .right svg.pic2')].flatMap((s) => s.getAnimations({ subtree: true })).filter((a) => a.animationName && a.playState === 'running' && Number(a.effect.getComputedTiming().duration) > 1).map((a) => a.animationName + ' ' + a.effect.getComputedTiming().duration).join(); }) === '', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot; return [...r.querySelectorAll('nav.dock svg.pic2, .right svg.pic2')].flatMap((s) => s.getAnimations({ subtree: true })).map((a) => `${a.animationName ?? a.transitionProperty} ${a.playState} ${a.effect.getComputedTiming().duration}`).join(); }));
  await page.context().close(); }
// 3. small screens: the dock still fits with the morning's place and long names
for (const look of ['glass', 'fridge', 'orbit']) for (const [w, h] of [[1180, 820], [1024, 768]]) { const page = await open(`look=${look}&page=morning&stress=1`, '07:10', { w, h }); const b = await read(page);
  ok(`${look} at ${w} x ${h}, long names, morning: the dock is inside the screen, labels on one line`, b.dockIn && b.labels.length === 1 && b.dock.every((x) => x.w >= 44), b.labels); await page.context().close(); }
ok('the bundle carries its version', /0\.3\d\.\d/.test(fs.readFileSync(path.join(ROOT, 'dist', 'family-hub.js'), 'utf8')));
console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILED` : `\nall ${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
