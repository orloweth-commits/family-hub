// R1.3, "a stuck or strange screen heals itself": the watchdog in the card (src/watchdog.ts).
// A false reload of a healthy screen is the failure designed against, so half of this suite is a healthy screen left alone for hours,
// shown and hidden, used, with Home Assistant blinking, with other code's errors and memory spikes, and nothing must reload it.
// The other half: each fault (drawing stopped, an error repeating, memory climbing, the link that will not come back, the nightly fresh start)
// reloads once, only when nobody is using the screen and Home Assistant can be reached, not again too soon, and the reload is written to the health log.
// The preview records a reload in window.__reloads instead of making it. This file's own server answers a websocket at /api/websocket
// ("auth_required", as Home Assistant greets a new link) unless told not to, and can stop answering for the card's own file.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4864] node scripts/tests/watchdog.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.json': 'application/json' };
const PORT = Number(process.env.PORT || 4864);
const net = { ws: 'greet', self: true, next: true, probes: 0, heads: [] };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x');
  if (req.method === 'HEAD') net.heads.push(u.pathname);
  // R1.4: a new build's file, as a deploy leaves it (/next/family-hub.js); net.next = false: not there (yet)
  if (u.pathname === '/next/family-hub.js') u.pathname = net.next ? '/dist/family-hub.js' : '/nothing-here';
  const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  if (!net.self && u.pathname === '/dist/family-hub.js' && req.method === 'HEAD') { res.writeHead(404); res.end(); return; }
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : b); }); }).listen(PORT);
// a minimal websocket: the handshake, then Home Assistant's first message to a new link
srv.on('upgrade', (req, sock) => {
  net.probes++;
  if (net.ws !== 'greet' || !req.url.startsWith('/api/websocket')) { sock.destroy(); return; }
  const acc = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acc}\r\n\r\n`);
  const msg = Buffer.from(JSON.stringify({ type: 'auth_required', ha_version: '2026.11.0' }));
  sock.write(Buffer.concat([Buffer.from([0x81, msg.length]), msg]));
  sock.on('error', () => undefined); sock.on('data', () => undefined); setTimeout(() => sock.destroy(), 2000);
});
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };

const open = async (qs = 'page=planner', { time = '2026-11-10T10:20', init } = {}) => {
  net.ws = 'greet'; net.self = true; net.next = true; net.heads = [];
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(`${time}:00+08:00`) });
  await page.goto(`http://localhost:${PORT}/?${qs}&net=off&calm=1&trust=1`); await page.waitForFunction('window.__ready === true', null, { timeout: 20000 }); await page.waitForTimeout(500);
  return page;
};
const R = (page, js, arg) => page.evaluate(js, arg);
const reloads = (page) => R(page, () => (window.__reloads ?? []).map((r) => r.why));
const state = (page) => R(page, () => ({ ...window.__fhWatchdog.state }));
/** fake time forward in steps (the real event loop gets a turn between steps, for the probe and the file check) */
const run = async (page, ms, step = 60_000) => { for (let t = 0; t < ms; t += step) { await page.clock.runFor(Math.min(step, ms - t)); await page.waitForTimeout(40); } await page.waitForTimeout(300); };
const until = async (page, fn, arg, ms = 6000) => { try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); return true; } catch { return false; } };
const touch = (page) => page.keyboard.press('Shift');
const T0 = (t = '2026-11-10T10:20') => new Date(`${t}:00+08:00`).getTime();
const healthLines = (page) => R(page, async () => ((await document.querySelector('family-hub-card').hass.callWS({ type: 'todo/item/list', entity_id: 'todo.family_hub_use' })).items ?? []).filter((x) => / reloaded at | held back /.test(x.summary)).map((x) => x.summary));
const ourError = (page, msg = 'Cannot read properties of undefined (reading \'x\')') => R(page, (msg) => { const e = new Error(msg); e.stack = `Error: ${msg}\n    at FamilyHubCard._onTick (${location.origin}/dist/family-hub.js:1:2345)`; window.dispatchEvent(new ErrorEvent('error', { error: e, message: msg, filename: `${location.origin}/dist/family-hub.js` })); }, msg);
const hide = (page, hidden) => R(page, (hidden) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);
const heap = (page, mb) => R(page, (mb) => { window.__heap = mb * 1e6; if (!window.__heapSet) { window.__heapSet = true; Object.defineProperty(performance, 'memory', { configurable: true, get: () => ({ usedJSHeapSize: window.__heap, totalJSHeapSize: window.__heap, jsHeapSizeLimit: 4.29e9 }) }); } }, mb);

/* ================= a healthy screen is never reloaded ================= */

// 1. the planner, left alone for two and a half hours by day: the screensaver comes and goes, the house blinks for a few seconds now and then
{ const page = await open();
  await page.evaluate(() => { window.__same = document.querySelector('family-hub-card'); });
  await run(page, 40 * 60_000);
  ok('a healthy screen left alone for 40 minutes: no reload', (await reloads(page)).length === 0, await reloads(page));
  ok('and the watchdog wishes for nothing', (await state(page)).wish === '', await state(page));
  // Home Assistant restarts (a minute away), twice, as an update does
  for (let i = 0; i < 2; i++) { await R(page, () => window.__haDown(true)); await run(page, 90_000, 15_000); await R(page, () => window.__haDown(false)); await run(page, 20 * 60_000); }
  ok('Home Assistant away for a minute and a half, twice: no reload', (await reloads(page)).length === 0, await reloads(page));
  // someone uses it for ten minutes, a touch every 30 seconds, moving between pages
  for (let i = 0; i < 20; i++) { await touch(page); await R(page, (i) => { document.querySelector('family-hub-card')._page = ['planner', 'groceries', 'weather', 'kid'][i % 4]; }, i); await run(page, 30_000, 15_000); }
  await run(page, 60 * 60_000);
  ok('used for ten minutes, then left for an hour: no reload', (await reloads(page)).length === 0, await reloads(page));
  ok('the same page all along', await R(page, () => window.__same === document.querySelector('family-hub-card')));
  ok('nothing written to the health log', (await healthLines(page)).length === 0, await healthLines(page));
  await page.context().close(); }

// 2. errors that are not the card's own, and the browser's harmless one, a thousand times
{ const page = await open();
  await run(page, 4 * 60_000);
  for (let i = 0; i < 40; i++) {
    await R(page, () => { const e = new Error('other card broke'); e.stack = `Error: other card broke\n    at x (${location.origin}/hacsfiles/other-card.js:1:1)`; window.dispatchEvent(new ErrorEvent('error', { error: e, message: e.message, filename: `${location.origin}/hacsfiles/other-card.js` })); });
    await R(page, () => window.dispatchEvent(new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications.', filename: `${location.origin}/dist/family-hub.js` })));
    await R(page, () => { const ev = new Event('unhandledrejection'); ev.reason = { code: 3, message: 'Connection lost' }; window.dispatchEvent(ev); });
    await run(page, 10_000, 10_000);
  }
  ok('another card’s errors, the ResizeObserver note and Home Assistant’s plain rejections, 40 times each: no reload', (await reloads(page)).length === 0, await reloads(page));
  // the card's own error, nine times in five minutes (under the limit)
  for (let i = 0; i < 9; i++) { await ourError(page); await run(page, 30_000, 15_000); }
  ok('the card’s own error 9 times in 5 minutes: no reload', (await reloads(page)).length === 0, await reloads(page));
  // a burst of twelve that then stops: by the time anyone is away from the screen it has stopped
  await touch(page);
  for (let i = 0; i < 12; i++) await ourError(page);
  await run(page, 2 * 60_000, 15_000);
  ok('a burst of 12 while someone is at the screen: no reload', (await reloads(page)).length === 0, await reloads(page));
  await run(page, 4 * 60_000, 15_000);
  ok('and none once it has stopped (no error in the last minute)', (await reloads(page)).length === 0, await reloads(page));
  // the card's own errors while Home Assistant is away (calls fail): not counted
  await R(page, () => window.__haDown(true));
  for (let i = 0; i < 30; i++) { await ourError(page, 'Connection lost'); await run(page, 5000, 5000); }
  await R(page, () => window.__haDown(false));
  await run(page, 20_000, 10_000);
  ok('30 errors while Home Assistant was away: not counted', (await state(page)).wish === '' && (await reloads(page)).length === 0, await state(page));
  await page.context().close(); }

// 3. memory: a spike for a few minutes, and a page that settles higher but steadily, are left alone
{ const page = await open();
  await heap(page, 80);
  await run(page, 32 * 60_000);
  await heap(page, 950); await run(page, 6 * 60_000);
  await heap(page, 120); await run(page, 3 * 60_000);
  ok('a spike to 950 MB for six minutes: no reload', (await reloads(page)).length === 0, await reloads(page));
  await heap(page, 300); await run(page, 45 * 60_000);
  ok('settled at 300 MB (under four times where it started) for 45 minutes: no reload', (await reloads(page)).length === 0, await reloads(page));
  await page.context().close(); }

// 4. Home Assistant really gone (no new link is answered) for an hour, the screen also stuck and erroring: never reloaded, the page would not come back
{ const page = await open();
  await run(page, 4 * 60_000);
  net.ws = 'refuse';
  await R(page, () => window.__haDown(true));
  await R(page, () => { document.querySelector('family-hub-card').shouldUpdate = () => false; });
  for (let i = 0; i < 6; i++) { for (let j = 0; j < 12; j++) await ourError(page); await run(page, 10 * 60_000, 15_000); }
  ok('Home Assistant really gone for an hour, the screen stuck: no reload', (await reloads(page)).length === 0, await reloads(page));
  ok('it waits for the house (or for a new link to be answered)', ['house', 'not answering', 'probe'].includes((await state(page)).wait), await state(page));
  ok('it did try a new link of its own, not more than every two minutes', net.probes >= 2 && net.probes <= 32, net.probes);
  await page.context().close(); }

// 5. a hidden page (Home Assistant drops its own link there on purpose) is left alone, and its count starts again when shown
{ const page = await open();
  await run(page, 4 * 60_000);
  await hide(page, true);
  await R(page, () => window.__haDown(true));
  await R(page, () => { window.__w = document.querySelector('family-hub-card'); window.__w.shouldUpdate = () => false; });
  await run(page, 30 * 60_000);
  ok('hidden for half an hour, without its link and not drawing: no reload', (await reloads(page)).length === 0, await reloads(page));
  ok('the watchdog says it is waiting because the page is hidden', (await state(page)).wait === 'hidden', await state(page));
  await R(page, () => { delete window.__w.shouldUpdate; window.__haDown(false); });
  await hide(page, false);
  await run(page, 20 * 60_000);
  ok('shown again and healthy: no reload', (await reloads(page)).length === 0, await reloads(page));
  await page.context().close(); }

// 6. time jumps (the computer asleep for an hour): nothing counted across it
{ const page = await open();
  await run(page, 4 * 60_000);
  await R(page, () => { document.querySelector('family-hub-card').shouldUpdate = () => false; });
  await page.clock.fastForward(60 * 60_000); await page.waitForTimeout(200);
  await run(page, 30_000, 15_000);
  ok('an hour of sleep is not an hour without drawing (it starts counting again)', (await reloads(page)).length === 0, await reloads(page));
  await page.context().close(); }

/* ================= each fault heals, once, at a quiet moment ================= */

// 7. drawing stops: after three minutes, once nobody is touching; not while someone is
{ const page = await open();
  await run(page, 4 * 60_000);
  await R(page, () => { document.querySelector('family-hub-card').shouldUpdate = () => false; });
  await run(page, 2 * 60_000, 15_000);
  ok('two minutes without drawing: not yet', (await reloads(page)).length === 0);
  // someone is at it: never under a finger
  for (let i = 0; i < 8; i++) { await touch(page); await run(page, 30_000, 15_000); }
  ok('stuck, but someone keeps touching it: no reload', (await reloads(page)).length === 0, await state(page));
  await run(page, 3.5 * 60_000, 15_000);
  ok('left alone for three minutes: reloaded, because it had stopped drawing', JSON.stringify(await reloads(page)) === '["stalled"]', await reloads(page));
  ok('the line for it goes to the health log', await until(page, () => document.querySelector('family-hub-card').hass.callWS({ type: 'todo/item/list', entity_id: 'todo.family_hub_use' }).then((r) => r.items.some((x) => /^2026-11-10 [a-z0-9]{4} reloaded at \d\d:\d\d: the screen had stopped drawing$/.test(x.summary)))), await healthLines(page));
  await run(page, 6 * 60_000, 15_000);
  ok('still stuck: not again within ten minutes', (await reloads(page)).length === 1, await reloads(page));
  await page.context().close(); }

// 8. stuck, but a timer is running, or something is being typed: it waits for them
{ const page = await open();
  await run(page, 4 * 60_000);
  await R(page, () => { const c = document.querySelector('family-hub-card'); c.hass.states['timer.kitchen'] = { entity_id: 'timer.kitchen', state: 'active', attributes: { duration: '0:20:00', finishes_at: new Date(Date.now() + 12 * 60_000).toISOString(), remaining: '0:12:00' } }; c.hass = { ...c.hass }; });
  await R(page, () => { document.querySelector('family-hub-card').shouldUpdate = () => false; });
  await run(page, 10 * 60_000, 15_000);
  ok('stuck while the kitchen timer runs: no reload', (await reloads(page)).length === 0, await state(page));
  ok('it says it is waiting for the screen to be free', (await state(page)).wait === 'in use', await state(page));
  await R(page, () => { const c = document.querySelector('family-hub-card'); c.hass.states['timer.kitchen'] = { entity_id: 'timer.kitchen', state: 'idle', attributes: { duration: '0:20:00' } }; c.hass = { ...c.hass }; });
  await run(page, 60_000, 15_000);
  ok('the timer done: reloaded', JSON.stringify(await reloads(page)) === '["stalled"]', await reloads(page));
  await page.context().close(); }

// 9. the same error again and again from the card's own code (a real one, thrown each time it draws, every 15 seconds)
{ const page = await open();
  await run(page, 4 * 60_000);
  await R(page, () => { const c = document.querySelector('family-hub-card'); c._fitFrame = () => { throw new Error('boom from a test'); }; });
  await run(page, 2 * 60_000, 15_000);
  ok('eight of them in two minutes: not yet', (await reloads(page)).length === 0, await reloads(page));
  await run(page, 90_000, 15_000);
  ok('the card’s own error every second: reloaded', JSON.stringify(await reloads(page)) === '["errors"]', await reloads(page));
  ok('and written down with the error', await until(page, () => document.querySelector('family-hub-card').hass.callWS({ type: 'todo/item/list', entity_id: 'todo.family_hub_use' }).then((r) => r.items.some((x) => / reloaded at \d\d:\d\d: the same error kept coming back$/.test(x.summary) && /boom from a test/.test(x.description)))));
  // it keeps coming back after each reload: 10 minutes, then 20 (doubled), never sooner
  await run(page, 8 * 60_000, 15_000);
  ok('not again within ten minutes', (await reloads(page)).length === 1, await reloads(page));
  await run(page, 2.5 * 60_000, 15_000);
  ok('again after ten', (await reloads(page)).length === 2, await reloads(page));
  await run(page, 15 * 60_000, 15_000);
  ok('the third waits twenty minutes, not ten', (await reloads(page)).length === 2, await reloads(page));
  await run(page, 7 * 60_000, 15_000);
  ok('and comes after twenty', (await reloads(page)).length === 3, await reloads(page));
  await page.context().close(); }

// 10. six reloads today already: it holds back and says so once, for a person
{ const page = await open('page=planner', { init: `localStorage.setItem('fh-reloads', ${JSON.stringify(JSON.stringify([5, 4, 3, 2, 1.5, 1].map((h) => ({ at: T0() - h * 3_600_000, why: 'errors', logged: true }))))})` });
  await run(page, 4 * 60_000);
  await R(page, () => { const c = document.querySelector('family-hub-card'); c._fitFrame = () => { throw new Error('boom again'); }; });
  await run(page, 30 * 60_000, 15_000);
  ok('six today already: no seventh', (await reloads(page)).length === 0, await reloads(page));
  const held = (await healthLines(page)).filter((l) => / held back a reload: the same error kept coming back, 6 times today already$/.test(l));
  ok('one "held back" line in the health log, once', held.length === 1, await healthLines(page));
  await page.context().close(); }

// 11. memory climbing and staying up for half an hour
{ const page = await open();
  await heap(page, 90);
  await run(page, 32 * 60_000);
  await heap(page, 520); await run(page, 25 * 60_000);
  ok('at 520 MB for 25 minutes: not yet', (await reloads(page)).length === 0, await reloads(page));
  await run(page, 8 * 60_000);
  ok('for half an hour without a dip: reloaded', JSON.stringify(await reloads(page)) === '["memory"]', await reloads(page));
  await page.context().close(); }

// 12. the link will not come back although Home Assistant answers a new one
{ const page = await open();
  await run(page, 4 * 60_000);
  await R(page, () => window.__haDown(true));
  await run(page, 4.5 * 60_000, 15_000);
  ok('four and a half minutes without the link: not yet', (await reloads(page)).length === 0, await reloads(page));
  // the card's own file must answer too
  net.self = false;
  await run(page, 2 * 60_000, 15_000);
  ok('with the card’s own file not answering: no reload (the page would not come back)', (await reloads(page)).length === 0, await state(page));
  net.self = true;
  await run(page, 3 * 60_000, 15_000);
  ok('Home Assistant answers a new link and the file is there: reloaded', JSON.stringify(await reloads(page)) === '["socket"]', await reloads(page));
  ok('the line waits until the house answers again (not written while it is away)', await R(page, () => localStorage.getItem('fh-reload') === '1'));
  await R(page, () => window.__haDown(false));
  await run(page, 30_000, 15_000);
  ok('then it is', (await healthLines(page)).filter((l) => /this screen’s link to it would not come back$/.test(l)).length === 1, await healthLines(page));
  await page.context().close(); }

// 13. the nightly fresh start: at 3 am with the screensaver up, once; not on a page loaded within the hour
{ const page = await open('page=planner', { time: '2026-11-10T01:40' });
  await run(page, 78 * 60_000);
  ok('at 2:58: not yet', (await reloads(page)).length === 0, await reloads(page));
  await run(page, 7 * 60_000);
  ok('at 3 am, with the screensaver up: reloaded once', JSON.stringify(await reloads(page)) === '["nightly"]', await reloads(page));
  await run(page, 55 * 60_000);
  ok('and not again that night', (await reloads(page)).length === 1, await reloads(page));
  ok('the night line in the health log', (await healthLines(page)).some((l) => /reloaded at 03:0\d: the nightly fresh start$/.test(l)), await healthLines(page));
  await page.context().close(); }
{ const page = await open('page=planner', { time: '2026-11-10T02:30' });
  await run(page, 70 * 60_000);
  ok('a page loaded at 2:30 is fresh enough: no nightly reload', (await reloads(page)).length === 0, await reloads(page));
  await page.context().close(); }
{ const page = await open('page=planner', { time: '2026-11-10T01:50' });
  await run(page, 65 * 60_000);
  for (let i = 0; i < 120; i++) { await touch(page); await run(page, 30_000, 15_000); }
  ok('someone using the screen from 2:55 to 3:55 am: no nightly reload', (await reloads(page)).length === 0, await reloads(page));
  await page.context().close(); }

// 14. after a reload the screensaver comes straight back (as it was), and a stale note is ignored
{ const page = await open('page=planner', { time: '2026-11-10T03:00', init: `sessionStorage.setItem('fh-resume', '${JSON.stringify({ at: T0('2026-11-10T03:00'), on: true, night: true, manual: false })}')` });
  ok('reloaded with the screensaver up: it is up at once', await R(page, () => document.querySelector('family-hub-card')._art.on === true));
  ok('the note is used once', await R(page, () => sessionStorage.getItem('fh-resume') === null));
  await page.context().close(); }
{ const page = await open('page=planner', { init: `sessionStorage.setItem('fh-resume', '${JSON.stringify({ at: T0() - 10 * 60_000, on: true })}')` });
  ok('a note from ten minutes ago is ignored (the planner shows)', await R(page, () => document.querySelector('family-hub-card')._art.on === false));
  await page.context().close(); }

// 14b. the screensaver's layer moves (its fade-in is not held by the hub's idle pause), whether it came back after a reload or came up by itself
const artMoves = (page) => R(page, () => { const r = document.querySelector('family-hub-card').shadowRoot, a = r.querySelector('.artm'); return { idle: r.querySelector('.fh').classList.contains('idle'), art: !!a, states: a ? a.getAnimations().map((x) => x.playState) : [] }; });
{ const page = await open('page=planner&art=1&artn=3', { init: `sessionStorage.setItem('fh-resume', '${JSON.stringify({ at: T0(), on: true, night: false, manual: false })}')` });
  await run(page, 30_000, 15_000);
  const m = await artMoves(page);
  ok('back after a reload, the screensaver is drawn and moving once the hub goes idle', m.idle && m.art && m.states.length > 0 && m.states.every((x) => x !== 'paused'), m);
  await page.context().close(); }
{ const page = await open('page=planner&art=1&artn=3');
  await run(page, 2 * 60_000, 15_000);
  ok('the hub is idle a minute after the last touch', (await artMoves(page)).idle);
  await run(page, 75_000, 15_000);
  const m = await artMoves(page);
  ok('the screensaver coming up by itself on an idle hub is moving, not held on its first frame', m.art && m.states.length > 0 && m.states.every((x) => x !== 'paused'), m);
  await page.context().close(); }

// 15. a reload written by the page that came back, once
{ const init = `if (!localStorage.getItem('fh-reloads')) { localStorage.setItem('fh-reloads', '${JSON.stringify([{ at: T0() - 30_000, why: 'memory', logged: false, note: '700 MB, settled at 90 MB' }])}'); localStorage.setItem('fh-reload', '1'); }`;
  const page = await open('page=planner', { init });
  await run(page, 30_000, 15_000);
  const l = await healthLines(page);
  ok('the page that came back writes the line', l.length === 1 && /^2026-11-10 [a-z0-9]{4} reloaded at 10:19: its memory had kept climbing$/.test(l[0]), l);
  ok('and marks it written', await R(page, () => localStorage.getItem('fh-reload') === '0' && JSON.parse(localStorage.getItem('fh-reloads'))[0].logged === true));
  await page.reload(); await page.waitForFunction('window.__ready === true'); await run(page, 30_000, 15_000);
  ok('so a later load does not write it again', (await healthLines(page)).length === 0, await healthLines(page));
  await page.context().close(); }

/* ================= R1.4: a new build takes itself ================= */

const deploy = (page, url = '/next/family-hub.js') => R(page, (url) => { window.__resources = [{ id: 'fh', type: 'module', url }, { id: 'k', type: 'module', url: '/local/community/kiosk-mode.js' }]; }, url);
const buildLines = async (page) => (await healthLines(page)).filter((l) => /a new build/.test(l));

// 16. the dashboard still names this page's own file, hours on end: nothing to do (and the dashboard is read, not hammered)
{ const page = await open();
  await R(page, () => { window.__resRead = 0; });
  await run(page, 60 * 60_000);
  ok('the dashboard names this page’s own file for an hour: no reload, no build waiting', (await reloads(page)).length === 0 && (await state(page)).build === '', await state(page));
  const n = await R(page, () => window.__resRead);
  ok('it reads the dashboard’s resources about every five minutes, no more', n >= 9 && n <= 14, n);
  // nonsense from Home Assistant, a refusal, two other files at once: never a guess
  await R(page, () => { window.__resources = [{ url: '/local/a/family-hub.js', type: 'module' }, { url: '/local/b/family-hub.js', type: 'module' }]; }); await run(page, 12 * 60_000, 15_000);
  ok('two other files for the card at once: left alone', (await reloads(page)).length === 0 && (await state(page)).build === '', await state(page));
  await R(page, () => { window.__resources = [{ url: '/next/family-hub.css', type: 'css' }]; }); await run(page, 12 * 60_000, 15_000);
  ok('no file for the card at all: left alone', (await reloads(page)).length === 0, await state(page));
  await R(page, () => { window.__resources = undefined; window.__resFail = true; }); await run(page, 12 * 60_000, 15_000);
  ok('the resources refused: left alone', (await reloads(page)).length === 0, await state(page));
  await page.context().close(); }

// 17. a deploy: the dashboard now names a new file. Not under a finger; at the first quiet moment, the new file answering first; written down once
{ const page = await open();
  await run(page, 4 * 60_000);
  for (let i = 0; i < 6; i++) { await touch(page); await run(page, 30_000, 15_000); }
  await deploy(page);
  for (let i = 0; i < 16; i++) { await touch(page); await run(page, 30_000, 15_000); }
  ok('a new build while someone is using the screen: no reload', (await reloads(page)).length === 0, await state(page));
  ok('but it knows the new build is there', /\/next\/family-hub\.js$/.test((await state(page)).build) && (await state(page)).wish === 'build', await state(page));
  // the new file not there yet (a deploy half done): it waits, though the old one answers
  net.next = false;
  await run(page, 4 * 60_000, 15_000);
  ok('the new build’s file not answering: no reload', (await reloads(page)).length === 0 && (await state(page)).wait === 'file', await state(page));
  ok('it asked the new file, not the old one', net.heads.includes('/next/family-hub.js'), [...new Set(net.heads)]);
  net.next = true;
  await run(page, 60_000, 15_000);
  ok('the new file answers and nobody is touching: reloaded for the new build', JSON.stringify(await reloads(page)) === '["build"]', await reloads(page));
  ok('the line for it goes to the health log, naming the build', await until(page, () => document.querySelector('family-hub-card').hass.callWS({ type: 'todo/item/list', entity_id: 'todo.family_hub_use' }).then((r) => r.items.some((x) => /^2026-11-10 [a-z0-9]{4} reloaded at \d\d:\d\d: a new build was ready$/.test(x.summary) && /next\/family-hub\.js/.test(x.description)))), await healthLines(page));
  await page.context().close(); }

// 18. Home Assistant away: no reading, no reload; and a new build is not a fault (outside the six-a-day cap and the doubling)
{ const page = await open('page=planner', { init: `localStorage.setItem('fh-reloads', ${JSON.stringify(JSON.stringify([5, 4, 3, 2, 1.5, 0.5].map((h) => ({ at: T0() - h * 3_600_000, why: 'errors', logged: true }))))})` });
  await run(page, 4 * 60_000);
  await R(page, () => window.__haDown(true));
  await deploy(page);
  await run(page, 4 * 60_000, 15_000);
  ok('a new build while Home Assistant is away: no reload', (await reloads(page)).length === 0, await state(page));
  await R(page, () => window.__haDown(false));
  await run(page, 10 * 60_000, 15_000);
  ok('Home Assistant back, six fault reloads today already: the new build still comes in', JSON.stringify(await reloads(page)) === '["build"]', await reloads(page));
  ok('and nothing "held back" for it', (await healthLines(page)).every((l) => !/held back/.test(l)), await healthLines(page));
  await page.context().close(); }

// 19. the preview cannot load the new file, so the page "comes back" on the old one (as a stuck cache would): once more after ten minutes, then held back with one line
{ const page = await open();
  await run(page, 4 * 60_000);
  await deploy(page);
  await run(page, 9 * 60_000, 15_000);
  ok('the first reload for the new build', JSON.stringify(await reloads(page)) === '["build"]', await reloads(page));
  await run(page, 3 * 60_000, 15_000);
  ok('still on the old file: not again within ten minutes', (await reloads(page)).length === 1, await reloads(page));
  await run(page, 2.5 * 60_000, 15_000);
  ok('a second try after ten', JSON.stringify(await reloads(page)) === '["build","build"]', await reloads(page));
  await run(page, 60 * 60_000, 15_000);
  ok('then no more for that build', (await reloads(page)).length === 2, await reloads(page));
  const held = (await healthLines(page)).filter((l) => /held back a reload: a new build was ready \(\/next\/family-hub\.js\), but this screen came back on the old one 2 times$/.test(l));
  ok('one "held back" line for a person', held.length === 1, await healthLines(page));
  // a later deploy (another file) is tried afresh
  await deploy(page, '/dist/../next/./family-hub.js?v=2');
  await run(page, 10 * 60_000, 15_000);
  ok('a later build is tried afresh', (await reloads(page)).length === 3, await reloads(page));
  await page.context().close(); }

// 20. a rollback is a new file too; and a page whose build is the dashboard's is left alone after it comes back
{ const init = `if (!localStorage.getItem('fh-build')) { localStorage.setItem('fh-build', JSON.stringify({ url: location.origin + '/dist/family-hub.js', n: 1 })); }`;
  const page = await open('page=planner', { init });
  await run(page, 40 * 60_000);
  ok('the page came back on the build it was reloaded for: left alone', (await reloads(page)).length === 0 && (await state(page)).build === '', await state(page));
  await page.context().close(); }

await browser.close(); srv.close();
console.log(`\n${pass} passed, ${fails.length} failed${fails.length ? ':\n  ' + fails.join('\n  ') : ''}`);
process.exit(fails.length ? 1 : 0);
