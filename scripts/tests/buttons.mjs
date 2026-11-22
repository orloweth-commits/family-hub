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
  ok(`${look}: every dock button is a drawing of its own`, b.dock.length === 7 && new Set(b.dock.map((x) => x.ic)).size === 7 && b.dock.map((x) => x.ic).join(',') === 'morning,groceries,doodle,music,weather,home,dinner', b.dock.map((x) => x.ic));
  // (since 0.38.26 a school morning before the last child leaves has no Ask: More alone; Ask's drawing is read at 4:20 pm below)
  ok(`${look}: More in the header is a drawing (a tray of tiles since 4e); on a school morning Ask stands down`, b.head.map((x) => x.id).join(',') === 'more' && b.head[0].ic === 'more', b.head.map((x) => `${x.id} ${x.ic}`));
  { const mp = await open(`look=${look}&page=planner&sheet=more`, '07:10'); ok(`${look}: More's buttons are drawings of their own`, (await mp.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.sheet[data-sheet="more"] .morebtn svg.pic2')].map((x) => x.dataset.ic))).join(',') === 'looks,medicine,info,night'); await mp.context().close(); }
  ok(`${look}: every button is still 44 px or more, and the header is no taller`, [...b.dock, ...b.head].filter((x) => x.w > 0).every((x) => x.w >= 44 && x.h >= 44) && b.head.every((x) => x.h <= 52), [...b.dock, ...b.head].map((x) => `${x.id} ${x.w}x${x.h}`));
  ok(`${look}: the dock is inside the screen and its labels rest on one line`, b.dockIn && b.labels.length === 1, b.labels);
  ok(`${look}: nothing moves at rest`, [...b.dock, ...b.head].every((x) => x.moving === 0), [...b.dock, ...b.head].filter((x) => x.moving).map((x) => x.id));
  await page.context().close(); }
{ const page = await open('look=glass&page=settingsless', '07:10'); await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c._page = 'none'; await c.updateComplete; }); await page.waitForTimeout(300); const b = await read(page), d = (id) => by(b.dock, id);
  // since 0.33.1 the drawings are filled illustrations that carry their own colour (no tile behind them), and several show something true about the house
  const art = (pg, t = '16:20', vp) => open(pg, t, vp).then(async (p2) => { /* the page's entrance must be over before the frame is measured (backlog 33): finish it, do not wait and hope */ await p2.evaluate(() => { const walk = (r) => { r.getAnimations?.().forEach((a) => { try { a.finish(); } catch { /* endless */ } }); r.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); }); const r = await p2.evaluate(() => { const root = document.querySelector('family-hub-card').shadowRoot, out = {}; for (const b of root.querySelectorAll('nav.dock .item:not(.kidbtn)')) { const s = b.querySelector('svg.pic2'); out[b.dataset.nav] = { text: [...s.querySelectorAll('text')].map((x) => x.textContent.trim()).join(' '), fills: new Set([...s.querySelectorAll('[fill]')].map((x) => x.getAttribute('fill')).filter((f) => f && f !== 'none')).size, html: s.innerHTML.length, tile: getComputedStyle(s).backgroundColor, tab: Math.round(b.getBoundingClientRect().height) }; }
      const hw = root.querySelector('header .weather svg.pic2'); out.headWx = hw ? hw.innerHTML : ''; out.dockWx = root.querySelector('nav.dock .item[data-nav="cloud"] svg.pic2').innerHTML; const g = (sel) => root.querySelector(sel).getBoundingClientRect(); const h = g('header'), bd = g('.fh > .body'), dk = g('nav.dock');
      out.frame = { left: [h.left, bd.left, dk.left].map(Math.round), right: [h.right, bd.right, dk.right].map(Math.round), joinTop: Math.round(bd.top - h.bottom), joinBottom: Math.round(dk.top - bd.bottom) }; return out; }); await p2.context().close(); return r; });
  const a1 = await art('look=glass&page=planner');
  ok('Glass: every dock drawing is a filled illustration with no tile behind it', Object.entries(a1).filter(([k]) => !['headWx', 'dockWx', 'frame'].includes(k)).every(([, v]) => v.fills >= 3 && /rgba\(0, 0, 0, 0\)|transparent/.test(v.tile)), Object.fromEntries(Object.entries(a1).filter(([k]) => !['headWx', 'dockWx', 'frame'].includes(k)).map(([k, v]) => [k, v.fills])));
  ok('Planner shows today: the date and the weekday', /\b10\b/.test(a1.calendar.text) && /TUE/i.test(a1.calendar.text), a1.calendar.text);
  ok('Groceries shows how many things are on the list', /\b8\b/.test(a1.cart.text), a1.cart.text);
  // (since 0.38.26 All off is the first of Home's Scenes, not in the dock)
  { const hm = await open('look=glass&page=home'); const t = await hm.evaluate(() => { const b = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-home').shadowRoot.querySelector('.scenes > .scene:first-child'); return { act: b?.dataset.act, ic: b?.querySelector('svg.pic2')?.dataset.ic, text: b?.querySelector('svg.pic2')?.textContent.trim(), dock: [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('nav.dock .item')].map((x) => x.dataset.nav).filter((n) => /^lights/.test(n)) }; });
    ok('All off is the first of Home\'s Scenes, its drawing saying how many lights are on, and neither All on nor All off is in the dock', t.act === 'alloff' && t.ic === 'alloff' && /\d/.test(t.text) && t.dock.length === 0, t); await hm.context().close(); }
  const a2 = await art('look=glass&page=planner&wx=rain'), a3 = await (async () => { const p3 = await open('look=glass&page=planner'); await p3.evaluate(async () => { const c = document.querySelector('family-hub-card'), id = c._config.groceries; /* into the preview's own states (shared by reference), so its next hass of its own does not put the 8 back (backlog 39) */ c.hass.states[id] = { ...c.hass.states[id], state: '0' }; c.hass = { ...c.hass }; await c.updateComplete; }); await p3.waitForTimeout(300); /* the dock's drawing is redrawn a moment after the count: wait for it (beside another suite 300 ms was not enough) */ await p3.waitForFunction(() => ![...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('nav.dock .item[data-nav="cart"] svg.pic2 text')].some((x) => x.textContent.trim()), null, { timeout: 5000 }).catch(() => {}); await p3.evaluate(() => { const walk = (r) => { r.getAnimations?.().forEach((a) => { try { a.finish(); } catch { /* endless */ } }); r.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); }); const r = await p3.evaluate(() => { const s2 = document.querySelector('family-hub-card').shadowRoot.querySelector('nav.dock .item[data-nav="cart"] svg.pic2'); return { cart: { text: [...s2.querySelectorAll('text')].map((x) => x.textContent.trim()).join(' '), html: s2.innerHTML.length } }; }); await p3.context().close(); return r; })();
  ok('Weather is today’s sky: rain is drawn differently from sun', a2.dockWx !== a1.dockWx);
  // (since 0.38.25 the preview's rain carries a Bureau warning, which takes the header's weather chip: no sky drawn there then)
  ok('the header’s weather is the same drawing as the dock’s (with a warning in force, the warning takes its place)', a1.headWx === a1.dockWx && a2.headWx === '' && a1.dockWx !== a2.dockWx);
  ok('an empty grocery list is an empty basket with no count', a3.cart.text === '' && a3.cart.html !== a1.cart.html, a3.cart.text);
  ok('Glass, wide: the page you are on is a tab that stands taller than its neighbours', a1.calendar.tab > a1.cart.tab + 4, [a1.calendar.tab, a1.cart.tab]);
  ok('Glass, wide: header, page and dock share their left and right edges and meet with no gap (one frame)', new Set(a1.frame.left).size === 1 && new Set(a1.frame.right).size === 1 && Math.abs(a1.frame.joinTop) <= 1 && Math.abs(a1.frame.joinBottom) <= 1, a1.frame);
  for (const lk of ['fridge', 'orbit', 'sports']) { const o = await art(`look=${lk}&page=planner`); ok(`${lk}: keeps its own shell (the frame is Glass's)`, Math.abs(o.frame.joinTop) > 1 || new Set(o.frame.left).size > 1, o.frame); }
  const hp = await open('look=glass&page=planner', '07:10'), hb = await read(hp), h = (id) => by(hb.head, id);
  ok('on a school morning before the last child leaves, the header has More and no Ask (0.38.26)', hb.head.map((x) => x.id).join(',') === 'more');
  { const ap = await open('look=glass&page=planner'), ab = await read(ap); ok('by afternoon the header keeps Ask (a drawing) and More', ab.head.map((x) => x.id).join(',') === 'ask,more' && by(ab.head, 'ask').ic === 'ask'); await ap.context().close(); }
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
// 4. batch 4e: the frame and the drawings
{ const q = (page, f) => page.evaluate(f);
  let page = await open('look=glass&page=planner');
  const g = await q(page, () => { const r = document.querySelector('family-hub-card').shadowRoot, z = Number(getComputedStyle(r.querySelector('.fh')).zoom) || 1, x = (s) => r.querySelector(s)?.getBoundingClientRect();
    const it = [...r.querySelectorAll('nav.dock > *')].map((e) => e.getBoundingClientRect()), gaps = it.slice(1).map((b, i) => Math.round((b.left - it[i].right) / z));
    return { wx: x('.right > .weather').left, cap: x('.capsule').left, ask: x('.right > [data-act=ask]').left, gaps, uv: !!r.querySelector('.weather .badge svg.pic2[data-ic=uv]'), timer: r.querySelectorAll('.capsule [data-kind=timer] svg.pic2').length,
      body: getComputedStyle(r.querySelector('.fh > .body')).paddingLeft, pl: x('.planner').left - x('.fh > .body').left }; });
  ok('4e Glass: the weather stands beside the clock, before the chips and the buttons', g.wx < g.cap && g.cap < g.ask, g);
  ok('4e Glass: the dock has no long empty stretch (every gap under 40 px)', Math.max(...g.gaps) < 40, g.gaps);
  ok('4e Glass: the page\'s cards sit 8 px into the panel', g.body === '8px' && g.pl > 0, g.body);
  ok('4e: the UV badge carries a drawn sun', g.uv);
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, private: ['Gym'] }); }); await page.waitForTimeout(500);
  ok('4e: a private reminder\'s lock on the week is a drawing', await q(page, () => document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.week .pchip svg.pic2[data-ic=lock], .week .ev.priv svg.pic2[data-ic=lock]').length > 0));
  await page.context().close();
  page = await open('look=glass&page=kid&kid=0');
  const k = await q(page, () => { const r = document.querySelector('family-hub-card').shadowRoot, d = r.querySelector('nav.dock').getBoundingClientRect(), f = r.querySelector('.fh').getBoundingClientRect(); return { w: d.width / f.width, left: d.left - f.left }; });
  ok('4e Glass: a child\'s dock is a tab under his card, not a full-width bar', k.w < 0.4 && k.left < 120, k); await page.context().close();
  page = await open('look=obsidian&page=planner');
  ok('4e Obsidian: More stays a line icon (no drawings in the parents\' look)', await q(page, () => !document.querySelector('family-hub-card').shadowRoot.querySelector('.right [data-act=more] svg.pic2'))); await page.context().close();
  page = await open('look=obsidian&page=morning&stress=1', '07:10');
  ok('4e Obsidian (132): with the morning\'s place and long names the dock stays inside the screen', await q(page, () => { const d = document.querySelector('family-hub-card').shadowRoot.querySelector('nav.dock').getBoundingClientRect(); return d.left >= 0 && d.right <= innerWidth; })); await page.context().close();
  page = await open('look=glass&page=planner', '16:20', { w: 1280, h: 800 });
  const sm = await q(page, () => { const r = document.querySelector('family-hub-card').shadowRoot; return { badge: r.querySelector('.dock [data-nav=cart] .p-badge text').getBoundingClientRect().height, dow: getComputedStyle(r.querySelector('.dock [data-nav=calendar] .p-dow')).opacity }; });
  ok('4e at 1280 x 800: the badge\'s count grows (about 12 px), the calendar\'s weekday gives way', sm.badge >= 11 && sm.dow === '0', sm); await page.context().close();
  page = await open('look=glass&page=planner');
  ok('4e at 1920: the calendar keeps its weekday', await q(page, () => getComputedStyle(document.querySelector('family-hub-card').shadowRoot.querySelector('.dock [data-nav=calendar] .p-dow')).opacity === '1')); await page.context().close(); }
ok('the bundle carries its version', /0\.3\d\.\d/.test(fs.readFileSync(path.join(ROOT, 'dist', 'family-hub.js'), 'utf8')));
console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILED` : `\nall ${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
