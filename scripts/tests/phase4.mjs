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
// (since 0.38.25 the medicine chip is amber to 8:30 am and off the header after noon: the urgent one is looked at at 8 am; since 0.38.30
//  Ask is off the header until the morning window ends, 8:45 in the preview: it is read beside the weather at 8:46 in section 6)
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const page = await open(`look=${look}&page=planner&timer=0`, '08:00'); const h = await head(page);
  ok(`${look}: beside the weather the header keeps More (Ask stands down on a school morning), and nothing else`, h.right.join(',') === 'weather,more', h.right);
  ok(`${look}: two things at most in the middle: the most urgent, and what is next`, h.chips.join(',') === 'med,next', h.chips);
  ok(`${look}: the header's parts are still 52 px high`, h.h <= 52, h.h);
  await page.context().close(); }
const noMeds = async (page) => { await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); const { meds, med_log, ...rest } = c._config; c.setConfig(rest); await c.updateComplete; }); await page.waitForTimeout(300); };
{ let page = await open('look=glass&page=groceries'); await noMeds(page); let h = await head(page);
  ok('with no medicine due the timer takes the urgent place', h.chips.join(',') === 'timer,next', h.chips);
  { const mp = await open('look=glass&page=groceries', '07:10'); const mh = await head(mp); ok('0.38.25 (the second review, item 3): a running timer outranks a dose that is due, and both outrank the next event', mh.chips.join(',') === 'timer,med', mh.chips); await mp.context().close(); } await page.context().close();
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
  await page.context().close(); }
// More, night: on a page with no kitchen timer running. A running timer holds the screensaver back (it must stay in sight), so with the
// preview's sample timer the screensaver came up and was woken at the next second's tick, and the line depended on the moment it ran (backlog 136)
{ const page = await open('look=glass&page=planner&timer=0'); const card = C(page);
  await page.evaluate(() => { document.querySelector('family-hub-card')._sheet = 'more'; }); await page.waitForTimeout(400);
  await card.locator('.sheet[data-sheet="more"] .morebtn[data-act="night"]').click();
  await page.waitForFunction(() => { const c = document.querySelector('family-hub-card'); return c._art.on && !!c.shadowRoot.querySelector('.artm[data-night]'); }, null, { timeout: 4000 }).catch(() => {}); await page.waitForTimeout(1500);
  ok('More, night: the screensaver comes up at its night level (and stays past the next tick)', await page.evaluate(() => { const c = document.querySelector('family-hub-card'); return c._nightManual === true && c._sheet === '' && c._art.on && !!c.shadowRoot.querySelector('.artm[data-night]'); }));
  await page.context().close();
  const nomed = await open('look=glass&page=planner&meds=missing'); await nomed.evaluate(async () => { const c = document.querySelector('family-hub-card'); const { meds, med_log, ...rest } = c._config; c.setConfig(rest); c._sheet = 'more'; await c.updateComplete; }); await nomed.waitForTimeout(400);
  ok('a house with no medicines set up has no Medicine in More', (await C(nomed).locator('.sheet[data-sheet="more"] .morebtn').evaluateAll((els) => els.map((e) => e.dataset.act))).join(',') === 'looks,info,night'); await nomed.context().close(); }

// 3. a child's page: his face and Home
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const page = await open(`look=${look}&page=kid&kid=1`); const card = C(page);
  const d = await card.locator('nav.dock .item').evaluateAll((els) => els.map((e) => e.textContent.trim()));
  ok(`${look}, a child's page: the dock is his face and Everyone (0.38.26: not a second "Home"), drawn as the planner`, d.length === 2 && d[0] === 'Charlie' && /Everyone$/.test(d[1]) && await card.locator('nav.dock[data-kid] .item[data-nav="home"] svg.pic2[data-ic="planner"]').count() === 1, d);
  ok(`${look}, a child's page: the header keeps Ask and his Settings`, (await head(page)).right.join(',') === 'ask,looks', (await head(page)).right);
  await card.locator('nav.dock .item[data-nav="home"]').click(); await page.waitForTimeout(400);
  ok(`${look}: Everyone goes back to the family's page, with the whole dock`, await page.evaluate(() => document.querySelector('family-hub-card')._page) === 'planner' && await card.locator('nav.dock .item').count() >= 10);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=2', '07:10'); await C(page).locator('nav.dock .item[data-nav="home"]').click(); await page.waitForTimeout(400);
  ok('on a school morning Everyone is the morning board', await page.evaluate(() => document.querySelector('family-hub-card')._page) === 'morning'); await page.context().close(); }

// 4. places and house actions stand apart
for (const [w, h, min] of [[1920, 1080, 30], [1180, 820, 14]]) { const page = await open('look=glass&page=planner', '07:10', { w, h });
  const g = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, z = Number(getComputedStyle(r.querySelector('.fh')).zoom) || 1, a = r.querySelector('nav.dock .item[data-nav="home"]').getBoundingClientRect(), b = r.querySelector('nav.dock .item[data-nav="dinner"]').getBoundingClientRect(), d = r.querySelector('nav.dock').getBoundingClientRect(), p = r.querySelector('nav.dock .item[data-nav="sun"]').getBoundingClientRect(), q = r.querySelector('nav.dock .item[data-nav="cart"]').getBoundingClientRect();
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
// 6. 0.38.26 (the second review's cut, items 4 and 5): a school morning stays on the morning board (no screensaver, no Ask; since 0.38.30
//    to the window's end, 8:45 in the preview, not the last child's leaving time); Morning takes Planner's place in the dock while the morning
//    window lasts; All on is gone and All off is the first of Home's Scenes
{ const dockOf = (page) => page.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('nav.dock .item:not(.kidbtn)')].map((b) => b.dataset.nav));
  const askOf = (page) => page.evaluate(() => !!document.querySelector('family-hub-card').shadowRoot.querySelector('header [data-act="ask"]'));
  const artUp = async (page) => { await page.evaluate(() => { document.querySelector('family-hub-card')._lastTouch = Date.now() - 200_000; }); for (let i = 0; i < 8; i++) { await page.clock.runFor(5000); await page.waitForTimeout(100); } return page.evaluate(() => !!document.querySelector('family-hub-card')._art.on); };
  let page = await open('look=glass&page=morning&art=1&artn=3&timer=0', '07:10');
  let d = await dockOf(page);
  ok('6 7:10 on a school day: Morning stands where Planner does (no Planner, nothing inserted)', d.join(',') === 'sun,cart,pencil,music,cloud,home,dinner', d);
  ok('6 7:10: no Ask in the header', !(await askOf(page)));
  ok('6 7:10: left untouched past three minutes, the screensaver does not come up', !(await artUp(page)));
  await page.context().close();
  page = await open('look=glass&page=kid&kid=0&calm=1', '07:49'); ok('6 7:49, a child\'s page: no Ask', !(await askOf(page))); await page.context().close();
  page = await open('look=glass&page=morning&art=1&artn=3&timer=0', '07:51');
  ok('6 7:51, once the last child has left: still no Ask (0.38.30: the hold lasts the morning window)', !(await askOf(page)));
  d = await dockOf(page); ok('6 7:51: Morning still holds Planner\'s place while the morning window lasts', d[0] === 'sun' && !d.includes('calendar'), d);
  ok('6 7:51: still no screensaver (0.38.30)', !(await artUp(page)));
  await page.context().close();
  page = await open('look=glass&page=kid&kid=0&calm=1', '08:44'); ok('6 8:44, a child\'s page: still no Ask (the window ends at 8:45)', !(await askOf(page))); await page.context().close();
  page = await open('look=glass&page=planner&art=1&artn=3&timer=0', '08:46');
  ok('6 8:46, once the morning window has ended: Ask is back', await askOf(page));
  d = await dockOf(page); ok('6 8:46: Planner is back in its place', d[0] === 'calendar' && !d.includes('sun'), d);
  ok('6 8:46: the screensaver comes up as usual', await artUp(page));
  await page.context().close();
  page = await open('look=glass&page=planner&timer=0');
  d = await dockOf(page); ok('6 4:20 pm: Planner and no Morning; neither All on nor All off in the dock', d.join(',') === 'calendar,cart,pencil,music,cloud,home,dinner', d);
  await page.context().close();
  page = await open('look=glass&page=home&offwait=0'); await page.evaluate(() => { window.__calls = []; });
  await C(page).locator('fh-home [data-act="alloff"]').click(); await page.waitForTimeout(600);
  const off = await page.evaluate(() => (window.__calls || []).filter((c) => /^light\.turn_off/.test(c)).length), t = (await C(page).locator('.toast').innerText().catch(() => '')).replace(/\s+/g, ' ');
  ok('6 Home\'s All off turns the lights off once and offers Undo', off === 1 && /Undo/.test(t), { off, t });
  await page.context().close(); }
ok('the bundle carries its version', /0\.3\d\.\d/.test(fs.readFileSync(path.join(ROOT, 'dist', 'family-hub.js'), 'utf8')));
console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILED` : `\nall ${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
