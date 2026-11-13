// Phase 4 ("calmer shell") checks: the header says two things at most beside the clock and the weather (the most urgent thing, and
// what is next) and keeps Ask and More; Looks, Medicine, House info, Night and who-is-home are in the More sheet; a child's page has
// his face and Home in the dock; places and house actions stand apart; the planner at rest enlarges today and fades the other days.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4828] node scripts/tests/phase4.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4828);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, time = '16:20', { w = 1920, h = 1080 } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const C = (page) => page.locator('family-hub-card');
const head = (page) => page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, z = Number(getComputedStyle(r.querySelector('.fh')).zoom) || 1;
  return { right: [...r.querySelectorAll('header .right > *')].map((e) => e.dataset.act ?? [...e.classList].find((c) => ['weather', 'presence'].includes(c)) ?? e.localName), chips: [...r.querySelectorAll('header .capsule > *')].filter((e) => !e.hidden && e.getBoundingClientRect().width > 0).map((e) => e.dataset.kind),
    h: Math.round(Math.max(...[...r.querySelectorAll('header .right > .hb')].map((e) => e.getBoundingClientRect().height)) / z), sheet: document.querySelector('family-hub-card')._sheet || (document.querySelector('family-hub-card')._pinAsk ? 'pin:' + document.querySelector('family-hub-card')._pinAsk.reason : '') }; });

// 1. the header
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const page = await open(`look=${look}&page=planner`); const h = await head(page);
  ok(`${look}: beside the weather the header keeps Ask and More, and nothing else`, h.right.join(',') === 'weather,ask,more', h.right);
  ok(`${look}: two things at most in the middle: the most urgent, and what is next`, h.chips.join(',') === 'med,next', h.chips);
  ok(`${look}: the header's parts are still 52 px high`, h.h <= 52, h.h);
  await page.context().close(); }
const noMeds = async (page) => { await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); const { meds, med_log, ...rest } = c._config; c.setConfig(rest); await c.updateComplete; }); await page.waitForTimeout(300); };
{ let page = await open('look=glass&page=groceries'); await noMeds(page); let h = await head(page);
  ok('with no medicine due the timer takes the urgent place', h.chips.join(',') === 'timer,next', h.chips);
  { const mp = await open('look=glass&page=groceries', '07:10'); const mh = await head(mp); ok('a dose that is due outranks a running timer (unless the timer is in its last minute)', mh.chips.join(',') === 'med,next', mh.chips); await mp.context().close(); } await page.context().close();
  page = await open('look=glass&page=planner&timer=0'); await noMeds(page); h = await head(page);
  ok('with nothing urgent, what is next stands alone (or with the next most useful thing)', h.chips.includes('next') && h.chips.length <= 2 && !h.chips.includes('timer'), h.chips); await page.context().close(); }

// 2. More
{ const page = await open('look=glass&page=planner'); const card = C(page);
  await card.locator('header .hb[data-act="more"]').click(); await page.waitForTimeout(400);
  const acts = await card.locator('.sheet[data-sheet="more"] .morebtn').evaluateAll((els) => els.map((e) => `${e.dataset.act}:${e.querySelector('b').textContent}`));
  ok('More holds Looks, Medicine, House info and Night, each with its name', acts.join(',') === 'looks:Looks,meds:Medicine,info:House info,night:Night', acts);
  ok('More says who is home', await card.locator('.sheet[data-sheet="more"] .presence').count() === 1);
  ok('every button in More is 12 mm or more on the wall', (await card.locator('.sheet[data-sheet="more"] .morebtn').evaluateAll((els) => Math.min(...els.map((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height))))) * 531.4 / 1920 >= 12);
  for (const [act, want] of [['looks', 'pin:Change the look?'], ['meds', 'meds'], ['info', 'sitter']]) { await page.evaluate(() => { document.querySelector('family-hub-card')._pinAsk = null; }); if ((await head(page)).sheet !== 'more') { await card.locator('header .hb[data-act="more"]').click({ force: true }).catch(() => {}); await page.evaluate(() => { document.querySelector('family-hub-card')._sheet = 'more'; }); await page.waitForTimeout(350); }
    await card.locator(`.sheet[data-sheet="more"] .morebtn[data-act="${act}"]`).click(); await page.waitForTimeout(450);
    ok(`More, ${act}: opens ${act === 'looks' ? 'the looks (behind the PIN here)' : 'its sheet'}`, (await head(page)).sheet === want, (await head(page)).sheet); await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c._pinAsk = null; c._sheet = 'more'; }); await page.waitForTimeout(350); }
  await card.locator('.sheet[data-sheet="more"] .morebtn[data-act="night"]').click(); await page.waitForTimeout(500);
  ok('More, night: the night screen comes up', await page.evaluate(() => { const c = document.querySelector('family-hub-card'); return c._nightManual === true && c._sheet === ''; }));
  await page.context().close();
  const nomed = await open('look=glass&page=planner&meds=missing'); await nomed.evaluate(async () => { const c = document.querySelector('family-hub-card'); const { meds, med_log, ...rest } = c._config; c.setConfig(rest); c._sheet = 'more'; await c.updateComplete; }); await nomed.waitForTimeout(400);
  ok('a house with no medicines set up has no Medicine in More', (await C(nomed).locator('.sheet[data-sheet="more"] .morebtn').evaluateAll((els) => els.map((e) => e.dataset.act))).join(',') === 'looks,info,night'); await nomed.context().close(); }

// 3. a child's page: his face and Home
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const page = await open(`look=${look}&page=kid&kid=1`); const card = C(page);
  const d = await card.locator('nav.dock .item').evaluateAll((els) => els.map((e) => e.textContent.trim()));
  ok(`${look}, a child's page: the dock is his face and Home`, d.join(',') === 'Charlie,Home', d);
  ok(`${look}, a child's page: the header keeps Ask and his Settings`, (await head(page)).right.join(',') === 'ask,looks', (await head(page)).right);
  await card.locator('nav.dock .item[data-nav="home"]').click(); await page.waitForTimeout(400);
  ok(`${look}: Home goes back to the family's page, with the whole dock`, await page.evaluate(() => document.querySelector('family-hub-card')._page) === 'planner' && await card.locator('nav.dock .item').count() >= 12);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=2', '07:10'); await C(page).locator('nav.dock .item[data-nav="home"]').click(); await page.waitForTimeout(400);
  ok('on a school morning Home is the morning board', await page.evaluate(() => document.querySelector('family-hub-card')._page) === 'morning'); await page.context().close(); }

// 4. places and house actions stand apart
for (const [w, h, min] of [[1920, 1080, 30], [1180, 820, 14]]) { const page = await open('look=glass&page=planner', '07:10', { w, h });
  const g = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, z = Number(getComputedStyle(r.querySelector('.fh')).zoom) || 1, a = r.querySelector('nav.dock .item[data-nav="home"]').getBoundingClientRect(), b = r.querySelector('nav.dock .item[data-nav="lights-on"]').getBoundingClientRect(), d = r.querySelector('nav.dock').getBoundingClientRect(), p = r.querySelector('nav.dock .item[data-nav="calendar"]').getBoundingClientRect(), q = r.querySelector('nav.dock .item[data-nav="cart"]').getBoundingClientRect();
    return { gap: Math.round((b.left - a.right) / z), between: Math.round((q.left - p.right) / z), inside: d.left >= 0 && d.right <= innerWidth }; });
  ok(`${w} x ${h}: the gap before the house actions is wider than between places, and the dock is inside the screen`, g.gap >= min && g.gap > g.between + 8 && g.inside, g); await page.context().close(); }

// 5. the planner at rest
{ const page = await open('look=glass&page=planner&timer=0'); const card = C(page);
  const cols = () => page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot; r.getAnimations().forEach((x) => { try { x.finish(); } catch { /* endless */ } }); return { rest: r.querySelector('.week').hasAttribute('data-rest'), today: Math.round(r.querySelector('.week .col.today').getBoundingClientRect().width), other: Math.round(r.querySelector('.week .col:not(.today)').getBoundingClientRect().width), fade: getComputedStyle(r.querySelector('.week .col:not(.today)')).opacity, todayFade: getComputedStyle(r.querySelector('.week .col.today')).opacity }; });
  const a = await cols(); await page.clock.runFor(62_000); for (let i = 0; i < 6 && !(await cols()).rest; i++) { await page.clock.runFor(3000); await page.waitForTimeout(200); } await page.clock.runFor(3000); await page.waitForTimeout(300); await page.clock.runFor(1000); const b = await cols();
  ok('in use, every day is shown fully', !a.rest && a.fade === '1', a);
  ok('after a minute untouched: today is larger and the other days step back', b.rest && b.today > a.today * 1.2 && Number(b.fade) <= 0.55 && b.todayFade === '1', b);
  await card.locator('.week').click({ position: { x: 5, y: 5 } }); await page.waitForTimeout(300); await page.clock.runFor(3000); await page.waitForTimeout(300); await page.clock.runFor(1000); const c = await cols();
  ok('a touch brings the whole week back', !c.rest && c.fade === '1' && Math.abs(c.today - a.today) <= 2, c);
  await page.context().close(); }
ok('the bundle says 0.33.0', fs.readFileSync(path.join(ROOT, 'dist', 'family-hub.js'), 'utf8').includes('0.33.0'));
console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILED` : `\nall ${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
