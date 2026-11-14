// The screensaver's working part (F1): it starts after three untouched minutes on every page and in every look; each thing that
// must hold it back does, and lets go; only a touch, a key or presence counts as someone being there; Night starts it at once, and
// night shows the same pictures, dimmer; a picture never zooms; the screen's brightness follows the sun and the room, slowly.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4806] node scripts/tests/screensaver.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4806);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, { time = '16:20', w = 1920, h = 1080 } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU' }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(400); return page; };
const card = (page, f) => page.evaluate(`(${f})(document.querySelector('family-hub-card'))`);
const up = (page) => page.locator('family-hub-card .artm:not([data-closing])').count();
const ahead = async (page, t) => { await page.clock.fastForward(t); await page.waitForTimeout(1250); };
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re);
const shut = (page) => page.context().close();

// 1. three minutes, every page, every look
{ const late = [], early = [];
  for (const look of ['glass', 'fridge', 'orbit', 'sports']) for (const [pg, time] of [['planner'], ['kid&kid=0'], ['kid&kid=2'], ['groceries'], ['doodle'], ['music'], ['weather'], ['home'], ['morning', '07:10']]) {
    const page = await open(`look=${look}&page=${pg}&idle=3&artn=3`, { time: time ?? '16:20' });
    await ahead(page, '02:40'); if (await up(page)) early.push(`${look}/${pg}`);
    await ahead(page, '00:30'); if (!await up(page)) late.push(`${look}/${pg}`);
    await shut(page); }
  ok('not before three minutes, on any page in any look', !early.length, early);
  ok('up after three minutes on every page in every look (9 pages, 4 looks)', !late.length, late); }

// 2. what holds it back, and lets go
{ const page = await open('page=planner&idle=3&artn=3');
  await card(page, (c) => { c._sheet = 'more'; }); await ahead(page, '03:30');
  ok('an open sheet holds it', await up(page) === 0);
  await card(page, (c) => { c._sheet = ''; }); await ahead(page, '00:05');
  ok('and it comes up once the sheet has gone', await up(page) === 1); await shut(page); }
{ const page = await open('page=planner&idle=3&artn=3&timer=1'); await ahead(page, '03:30');
  ok('a running kitchen timer holds it', await card(page, (c) => c._timerLeft() !== null) ? await up(page) === 0 : true, await card(page, (c) => c._timerLeft())); await shut(page); }
{ const page = await open('page=music&idle=3&artn=3'); await page.mouse.click(960, 620); await ahead(page, '03:30');
  ok('Music, touched, with something playing: held', await up(page) === 0);
  await ahead(page, '07:00'); ok('and let go ten minutes after the last touch', await up(page) === 1); await shut(page); }
{ const page = await open('page=music&idle=3&artn=3');
  await card(page, (c) => { const st = {}; for (const [k, v] of Object.entries(c.hass.states)) st[k] = k.startsWith('media_player.') ? { ...v, state: 'idle' } : v; c.hass = { ...c.hass, states: st }; for (const x of c.shadowRoot.querySelectorAll('*')) if ('hass' in x) x.hass = c.hass; });
  await page.mouse.click(960, 620); await ahead(page, '03:30');
  ok('Music, touched, with nothing playing: three minutes as anywhere else', await up(page) === 1); await shut(page); }

// 3. who counts as being there
{ const page = await open('page=planner&idle=3&artn=3'); await ahead(page, '02:00');
  await page.mouse.move(300, 300); await page.mouse.move(900, 500, { steps: 8 }); await ahead(page, '01:10');
  ok('a mouse moving, or resting, is not a touch', await up(page) === 1);
  await page.mouse.move(700, 400, { steps: 5 }); await page.waitForTimeout(200);
  ok('and moving it does not wake the panel', await up(page) === 1);
  await page.keyboard.press('Shift'); await page.waitForTimeout(200);
  ok('a key wakes it', await up(page) === 0); await shut(page); }
{ const page = await open('page=planner&idle=3&artn=3'); await ahead(page, '02:00'); await page.keyboard.press('Shift'); await ahead(page, '01:30');
  ok('a key is a touch: the three minutes start again', await up(page) === 0);
  await ahead(page, '01:40'); ok('and run out again', await up(page) === 1); await shut(page); }

// 4. Night: one thing, the screensaver
{ const page = await open('page=planner&idle=3&artn=3');
  await page.locator('family-hub-card header .right button', { hasText: 'More' }).click(); await page.waitForTimeout(450);
  await page.locator('family-hub-card .sheet[data-sheet="more"] [data-act="night"]').click(); await page.waitForTimeout(900);
  ok('Night (in More) starts the screensaver at once', await up(page) === 1);
  ok('at its night level', await page.locator('family-hub-card .artm[data-night]').count() === 1);
  ok('with pictures, not a black screen', await page.locator('family-hub-card .artm img.aimg').count() >= 1);
  ok('the pictures are dimmer and warmer', /brightness\(0\.\d+\).*sepia/.test(await page.locator('family-hub-card .artm img.aimg').last().evaluate((e) => getComputedStyle(e).filter)));
  ok('there is no separate night screen', await page.locator('family-hub-card .night').count() === 0 && await card(page, (c) => typeof c._night === 'undefined' && !('_awakeUntil' in c)));
  await ahead(page, '00:20'); ok('it stays up', await up(page) === 1);
  await page.mouse.click(960, 500); await page.waitForTimeout(1300);
  ok('a touch wakes it', await up(page) === 0);
  ok('and Night is over until asked for again', await card(page, (c) => c._nightManual) === false);
  ok('by day it then comes back as the day artwork', (await ahead(page, '03:10'), await page.locator('family-hub-card .artm:not([data-night])').count()) === 1); await shut(page); }
{ const page = await open('page=planner&idle=3&artn=3', { time: '22:30' });
  await card(page, (c) => c.setConfig({ ...c._config, night: { start: '21:30', end: '06:00' } })); await page.waitForTimeout(300);
  ok('in the night window the panel is still the panel', await up(page) === 0 && await page.locator('family-hub-card .planner').count() === 1);
  await ahead(page, '02:40'); ok('it waits three minutes as by day', await up(page) === 0);
  await ahead(page, '00:30'); ok('then the screensaver, at its night level', await page.locator('family-hub-card .artm[data-night]:not([data-closing])').count() === 1); await shut(page); }
{ const page = await open('page=planner&idle=0&artn=3', { time: '22:30' }); await ahead(page, '03:10');
  ok('with the screensaver switched off, night still brings it up after three minutes', await page.locator('family-hub-card .artm[data-night]').count() === 1); await shut(page); }
{ const page = await open('page=planner&idle=0&artn=3'); await ahead(page, '06:00');
  ok('with the screensaver switched off, the day stays as it was', await up(page) === 0); await shut(page); }
{ const page = await open('page=planner&night=1&artn=0&idle=3', { time: '22:30' }); await page.waitForTimeout(700);
  ok('night with no pictures: the clock on black', await page.locator('family-hub-card .artm[data-night][data-bare]').count() === 1); await shut(page); }

// 5. a picture is still
{ const page = await open('page=planner&idle=1&artn=3'); await ahead(page, '01:10'); await page.waitForTimeout(600);
  const a = await page.locator('family-hub-card .artm img.aimg').last().evaluate((e) => { const cs = getComputedStyle(e); return { names: cs.animationName, pos: cs.objectPosition, fit: cs.objectFit }; });
  ok('no zoom or pan: the only movement is the fade', a.names === 'afade', a.names);
  ok('cropping keeps the top of the picture, where the heads are', a.fit === 'cover' && /^50% 30%/.test(a.pos), a.pos); await shut(page); }

// 6. the brightness target
{ const page = await open('page=planner&idle=1&artn=2&backlight=1');
  const b = (i) => page.evaluate((i) => customElements.get('family-hub-card').bright(i), i);
  ok('no sun and no room reading: full, as before', await b({}) === 100);
  ok('the floor from six degrees below the horizon', await b({ elevation: -6 }) === 30 && await b({ elevation: -40 }) === 30, await b({ elevation: -6 }));
  ok('the ceiling from thirty degrees up', await b({ elevation: 30 }) === 100 && await b({ elevation: 70 }) === 100);
  { const lo = await b({ elevation: 5 }), hi = await b({ elevation: 20 }); ok('rising with the sun between', lo > 30 && hi > lo && hi < 100, [lo, hi]); }
  { const mid = await b({ elevation: 12 }), dark = await b({ elevation: 12, lux: 1 }), bright = await b({ elevation: 12, lux: 900 }); ok('a dark room lowers it and a bright room raises it, by no more than twenty', dark < mid && bright > mid && mid - dark <= 20 && bright - mid <= 20, [dark, mid, bright]); }
  ok('never below the floor or above the ceiling', await b({ elevation: -20, lux: 0 }) === 30 && await b({ elevation: 60, lux: 5000 }) === 100 && await b({ elevation: 60, floor: 20, ceiling: 80 }) === 80 && await b({ elevation: -30, floor: 20, ceiling: 80 }) === 20);
  ok('a room reading alone will do', (await b({ lux: 1 })) < (await b({ lux: 500 })));
  // on the card: the first reading as it is, then slowly; the artwork and night at once
  const sun = (e) => card(page, `(c) => { c.hass = { ...c.hass, states: { ...c.hass.states, 'sun.sun': { entity_id: 'sun.sun', state: ${e} > 0 ? 'above_horizon' : 'below_horizon', attributes: { elevation: ${e} } } } }; }`);
  const last = async () => { const all = await calls(page, 'light.turn_on light.panel_backlight'); return all.length ? Number(/"brightness_pct":(\d+)/.exec(all[all.length - 1])[1]) : null; };
  await sun(40); await page.mouse.click(960, 500); await ahead(page, '00:03');
  const start = await last(); ok('in use under a high sun: full', start === 100, start);
  await sun(-10); await ahead(page, '00:30'); ok('the sun goes: nothing moves inside a minute', await last() === 100, await last());
  await page.mouse.click(960, 500); await ahead(page, '00:35'); { const v = await last(); ok('after a minute, one small step', v !== null && v < 100 && 100 - v <= 6, v); }
  for (let i = 0; i < 4; i++) { await page.mouse.click(960, 500); await ahead(page, '00:55'); }
  { const v = await last(); ok('and on down, a step a minute, never a jump', v !== null && v < 94 && v >= 100 - 6 * 6, v); }
  const hub = await last(), n0 = (await calls(page, 'panel_backlight')).length; await page.mouse.click(960, 500); await ahead(page, '00:20');
  ok('never more than one change in a minute', (await calls(page, 'panel_backlight')).length - n0 <= 1);
  await ahead(page, '01:10');
  { const v = await last(); ok('the artwork is a share of it (seven tenths), at once', await up(page) === 1 && v !== null && v <= Math.round(hub * 0.7) && v >= Math.round((hub - 18) * 0.7) - 1, [hub, v]); }
  await shut(page); }
{ const page = await open('page=planner&idle=1&artn=2&backlight=1', { time: '22:30' }); await ahead(page, '01:10');
  const all = await calls(page, 'light.turn_on light.panel_backlight'); ok('at night the artwork is at the lowest level', /"brightness_pct":12\b/.test(all[all.length - 1] ?? ''), all.slice(-1)); await shut(page); }
{ const page = await open('page=planner&idle=1&artn=2'); await ahead(page, '01:10'); ok('no brightness entity: nothing is called', (await calls(page, 'brightness_pct')).length === 0); await shut(page); }

console.log(`\nerrors: ${[...new Set(errs)].join('\n') || 'none'}\n`);
console.log(fails.length ? `${fails.length} FAILED\n - ${fails.join('\n - ')}` : `${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length ? 1 : 0);
