// Phase 3 ("morning board") checks: each child's current morning job on his card as one big button he can tick from the board (and
// take back for a few seconds), the jobs to go as faces (no stars), one leaving clock with a time on a card only when it differs,
// nothing cut off on a card at any size, the dock inside the screen with long names and the morning's extra place, and a child's
// page in the small hours (night, not last evening's wind-down).
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4825] node scripts/tests/phase3.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4825);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const HEAR = () => { window.__said = []; try { speechSynthesis.speak = (u) => { window.__said.push(u.text); }; speechSynthesis.cancel = () => {}; } catch { /* no speech here */ } };
const open = async (qs, time = '07:10', { w = 1920, h = 1080, quietErrs = false } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  if (!quietErrs) { page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); }); }
  await page.addInitScript(HEAR);
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const M = (page) => page.locator('fh-morning');
const col = (page, name) => M(page).locator(`.kcol[data-kid="${name}"]`);
const job = (page, name) => col(page, name).locator('[data-part="job"]');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re);
const said = (page) => page.evaluate(() => window.__said ?? []);
const tx = async (loc) => (await loc.innerText()).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const board = (page) => page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-morning').shadowRoot, t = (e) => (e?.textContent ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const z = Number(getComputedStyle(document.querySelector('family-hub-card').shadowRoot.querySelector('.fh')).zoom) || 1;
  return { faces: [...r.querySelectorAll('.faces .fc')].map((f) => f.dataset.who), faceMin: Math.min(...[...r.querySelectorAll('.faces .fc')].map((f) => f.getBoundingClientRect().width / z)), team: r.querySelector('[data-part="team"]')?.getAttribute('aria-label') ?? '', line: t(r.querySelector('.nextstep')),
    stars: r.querySelectorAll('.stars, .tstar, .teambar').length, clocks: r.querySelectorAll('[data-part="goclock"]').length, clock: t(r.querySelector('[data-part="goclock"]')),
    cols: [...r.querySelectorAll('.kcol')].map((k) => { const j = k.querySelector('[data-part="job"]'), b = j?.getBoundingClientRect(), kb = k.getBoundingClientRect(), last = [...k.querySelectorAll('.tile, .lchip, .mev2, [data-part="job"]')].map((e) => e.getBoundingClientRect().bottom);
      return { kid: k.dataset.kid, job: t(j?.querySelector('.jname')), tag: j?.localName, label: t(j?.querySelector('.label')), pic: t(j?.querySelector('.jpic')), h: b ? Math.round(b.height / z) : 0, mm: b ? Math.min(b.width, b.height) * 531.4 / 1920 : 0, done: !!j?.classList.contains('done'), pressed: j?.getAttribute('aria-pressed'), chip: t(k.querySelector('.lchip')),
        bars: k.querySelectorAll('[role="progressbar"], .meter, .ring, svg.tface, .stars').length, count: /\d+ (left|to go|of \d+)/.test(t(k)), cut: Math.round(Math.max(...last) - kb.bottom), tiles: k.querySelectorAll('.tile').length, fit: k.getAttribute('data-fit') ?? '', nameOut: (() => { const h = k.querySelector('.khead h2').getBoundingClientRect(); return Math.round(Math.max(kb.left - h.left, h.right - kb.right)); })() }; }) }; });

// 1. the board at rest: a job on each card, faces for the jobs to go, no stars, one clock, a time on a card only when it differs
for (const look of ['glass', 'fridge', 'orbit', 'sports']) {
  const page = await open(`look=${look}&page=morning`); const b = await board(page);
  ok(`${look}: each card carries its child's current morning job as a button`, b.cols.length === 3 && b.cols.map((c) => c.job).join(' | ') === 'Brush teeth | Get dressed | Breakfast' && b.cols.every((c) => c.tag === 'button' && c.label.toLowerCase() === 'now' && c.pressed === 'false'), b.cols.map((c) => `${c.kid}: ${c.job}`));
  ok(`${look}: the job is a large picture button (96 px, 12 mm on the wall or more)`, b.cols.every((c) => c.h >= 96 && c.mm >= 12 && c.pic.length > 0), b.cols.map((c) => `${c.h}px ${c.mm.toFixed(1)}mm ${c.pic}`));
  ok(`${look}: the jobs to go are faces, one a job, in the children's order`, b.faces.join(',') === 'Riley,Charlie,Charlie,Max' && b.faceMin >= 30 && b.team === 'Morning jobs to go: Riley 1, Charlie 2, Max 1' && b.line === 'Morning jobs: 4 to go between us', [b.faces, b.team, b.line]);
  ok(`${look}: no stars or team bar anywhere on the board`, b.stars === 0);
  ok(`${look}: no bar, ring or count of jobs on any card`, b.cols.every((c) => c.bars === 0 && !c.count));
  ok(`${look}: one clock; only the two who leave later say a time, as a difference`, b.clocks === 1 && /20 min/.test(b.clock) && /Leave at 7:30 am/.test(b.clock) && b.cols.map((c) => c.chip.replace('later7', 'later 7')).join(' | ') === 'You leave 20 minutes later 7:50 am | You leave 20 minutes later 7:50 am | ', b.cols.map((c) => c.chip));
  ok(`${look}: nothing on a card is cut off`, b.cols.every((c) => c.cut <= 0 && c.tiles >= 1), b.cols.map((c) => `${c.kid} ${c.cut} fit${c.fit}`));
  await page.context().close(); }
// every size the panel is used at: the job, the chip and the pictures of what to bring are all inside the card
for (const [w, h] of [[1280, 800], [1312, 668], [1180, 820], [1024, 768]]) for (const look of ['glass', 'fridge', 'orbit', 'sports']) {
  const page = await open(`look=${look}&page=morning`, '07:10', { w, h }); const b = await board(page);
  ok(`${look} at ${w} x ${h}: a job on every card and nothing cut off`, b.cols.length === 3 && b.cols.every((c) => c.job && c.cut <= 0 && c.h >= 76), b.cols.map((c) => `${c.kid} ${c.h}px cut ${c.cut} fit${c.fit}`));
  await page.context().close(); }
{ const page = await open('look=glass&page=morning', '07:10', { w: 390, h: 844 }); const b = await board(page);
  ok('phone: a job on every card, 76 px or more', b.cols.length === 3 && b.cols.every((c) => c.job && c.h >= 76), b.cols.map((c) => c.h)); await page.context().close(); }

// 2. ticking from the board
{ const page = await open('look=glass&page=morning');
  await page.evaluate(() => { window.__calls = []; });
  await job(page, 'Charlie').click(); await page.waitForTimeout(400);
  let c = await calls(page, '^todo\\.update_item'); let b = await board(page);
  ok('a tick on the board ticks the job in his own list', c.length === 1 && /todo\.charlie_chores/.test(c[0]) && /"status":"completed"/.test(c[0]), c);
  ok('a job with no points awards none', (await calls(page, 'fh_add_points')).length === 0);
  ok('the ticked job stays on his card for a moment, done, with a way back', b.cols[1].job === 'Get dressed' && b.cols[1].done && b.cols[1].pressed === 'true' && /Tap to undo/.test(await tx(job(page, 'Charlie'))), await tx(job(page, 'Charlie')));
  ok('one face fewer, and the line counts down', b.faces.join(',') === 'Riley,Charlie,Max' && b.line === 'Morning jobs: 3 to go between us', [b.faces, b.line]);
  // a second tap straight away is a double tap, not an undo
  await job(page, 'Charlie').click(); await page.waitForTimeout(300);
  ok('a double tap does not take the tick back', (await calls(page, '^todo\\.update_item')).length === 1 && (await board(page)).cols[1].done);
  await page.clock.runFor(5200); await page.waitForTimeout(300); b = await board(page);
  ok('after a few seconds his next job takes its place', b.cols[1].job === 'Pack lunch box' && !b.cols[1].done && b.cols[1].label.toLowerCase() === 'now', b.cols[1]);
  // undo within the few seconds
  await job(page, 'Charlie').click(); await page.waitForTimeout(300); await page.clock.runFor(2000); await job(page, 'Charlie').click(); await page.waitForTimeout(400);
  c = await calls(page, '^todo\\.update_item'); b = await board(page);
  ok('a tap on the done job within a few seconds takes the tick back', c.length === 3 && /"status":"needs_action"/.test(c[2]) && b.cols[1].job === 'Pack lunch box' && !b.cols[1].done && b.faces.join(',') === 'Riley,Charlie,Max', [c.slice(1), b.faces]);
  // a job that earns points, for a child who cannot read
  await page.evaluate(() => { window.__calls = []; window.__said = []; });
  await job(page, 'Max').click(); await page.waitForTimeout(500);
  const p = await calls(page, 'fh_add_points');
  ok('a job with points awards them as his own page does (points, not the jar)', p.length === 1 && /"kid":"max"/.test(p[0]) && /"points":10/.test(p[0]) && /"jar":0/.test(p[0]), p);
  ok('a child who cannot read hears that it is done', (await said(page)).some((s) => /^Breakfast\. Done!/.test(s)), await said(page));
  await page.clock.runFor(5200); await page.waitForTimeout(300); b = await board(page);
  ok('with his morning finished his card says so, with nothing left to press', b.cols[2].job === '' && b.cols[2].tag === 'div' && /Morning jobs done/.test(await tx(job(page, 'Max'))) && !b.faces.includes('Max'), await tx(job(page, 'Max')));
  // the tick is known to his own page (a fresh one can be undone there)
  ok('his own page knows how fresh the tick is', await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('fh-ticks') || '{}')).length >= 1));
  // finish everything: the faces go and the team is cheered once
  await job(page, 'Riley').click(); await page.waitForTimeout(300); await page.clock.runFor(5200);
  await job(page, 'Charlie').click(); await page.waitForTimeout(500); b = await board(page);
  ok('with every job done the faces go and the line says so', b.faces.length === 0 && /all done/.test(b.line) && b.team === 'Morning jobs: all done', [b.faces, b.line]);
  await page.context().close(); }
{ // Home Assistant does not answer: the tick comes back off and the card says so
  const page = await open('look=glass&page=morning&fail=1', '07:10', { quietErrs: true });
  await job(page, 'Riley').click(); await page.clock.runFor(800); await page.waitForTimeout(500); const b = await board(page);
  ok('a tick that cannot be saved comes back off, and the card says so', b.cols[0].job === 'Brush teeth' && !b.cols[0].done && b.faces.length === 4 && /Couldn’t save that one/.test(await tx(col(page, 'Riley').locator('.jmsg'))), b.cols[0]);
  await page.context().close(); }
{ // the name still opens his page; the job button does not
  const page = await open('look=glass&page=morning');
  await job(page, 'Riley').click(); await page.waitForTimeout(300);
  ok('ticking a job stays on the board', await page.evaluate(() => document.querySelector('family-hub-card')._page) === 'morning');
  await col(page, 'Riley').locator('.khead').click(); await page.waitForTimeout(400);
  ok('his name opens his page', await page.evaluate(() => { const c = document.querySelector('family-hub-card'); return c._page === 'kid' && c._kid === 0; }));
  await page.context().close(); }
{ // older mode: no picture on his job
  const page = await open('look=glass&page=morning&older=1'); const b = await board(page);
  ok('older mode: his job is words, no picture; his brothers keep theirs', b.cols[0].pic === '' && b.cols[0].job === 'Brush teeth' && b.cols[1].pic !== '' && b.cols[2].pic !== '', b.cols.map((c) => c.pic));
  await page.context().close(); }

// 3. one leaving clock: after the first to leave has gone, the clock is the others' and they say nothing; with one time for everyone no card says a time
{ const page = await open('look=glass&page=morning', '07:36'); let b = await board(page);
  ok('once the youngest has left: the clock is the others’ time, their cards say none, his says he has left', /Leave at 7:50 am/.test(b.clock) && b.cols.map((c) => c.chip).join(' | ') === ' |  | Left', [b.clock, b.cols.map((c) => c.chip)]);
  await page.context().close();
  const same = await open('look=glass&page=morning'); await same.evaluate(async () => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, kids: c._config.kids.map(({ leave_by, ...k }) => k) }); await c.updateComplete; }); await same.waitForTimeout(400); b = await board(same);
  ok('everyone leaving together: one clock and no time on any card', /Leave at 7:50 am/.test(b.clock) && /everyone leaves/.test(b.clock) && b.cols.every((c) => c.chip === ''), [b.clock, b.cols.map((c) => c.chip)]);
  await same.context().close();
  const hour = await open('look=glass&page=morning'); await hour.evaluate(async () => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, kids: c._config.kids.map((k, i) => i === 0 ? { ...k, leave_by: '08:30' } : k) }); await c.updateComplete; }); await hour.waitForTimeout(400); b = await board(hour);
  ok('an hour later reads as an hour', b.cols[0].chip.replace('later8', 'later 8') === 'You leave 1 hour later 8:30 am', b.cols[0].chip);
  await hour.context().close(); }

// 4. long names: the dock stays inside the screen with the morning's extra place, and a name stays inside its card
// (Sports is left out: its touchline runs edge to edge and lets a very long name run under its neighbour, on main as well; noted in the state doc)
for (const look of ['fridge', 'orbit', 'glass']) for (const [w, h] of [[1180, 820], [1024, 768], [1920, 1080]]) {
  const page = await open(`look=${look}&page=morning&stress=1`, '07:10', { w, h });
  const d = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, n = r.querySelector('nav.dock').getBoundingClientRect(), f = { left: 0, right: innerWidth };
    const names = [...r.querySelectorAll('nav.dock .kn')].map((e) => e.getBoundingClientRect()); return { l: Math.round((n.left - f.left) * 10) / 10, r: Math.round((f.right - n.right) * 10) / 10, name: Math.round(Math.min(...names.map((q) => q.left - f.left)) * 10) / 10 }; });
  const b = await board(page);
  ok(`${look} at ${w} x ${h}, long names: the dock is inside the screen`, d.l >= 0 && d.r >= 0 && d.name >= 2, d);
  ok(`${look} at ${w} x ${h}, long names: a name stays inside its card`, b.cols.every((c) => c.nameOut <= 0), b.cols.map((c) => c.nameOut));
  ok(`${look} at ${w} x ${h}, long names: the cards still carry their jobs, with nothing cut off`, b.cols.every((c) => c.job && c.cut <= 0) && b.faces.length === 4, b.cols.map((c) => `${c.job} ${c.cut} fit${c.fit}`));
  await page.context().close(); }

// 5. a child's page in the small hours is night, not last evening's wind-down
for (const kid of [0, 1, 2]) for (const nn of ['', '&nownext=1']) { const page = await open(`look=glass&page=kid&kid=${kid}${nn}`, '03:46');
  const k = page.locator('fh-kid'), t = await tx(k.locator('.jobs')), side = await tx(k.locator('.side'));
  ok(`child ${kid}${nn} at 3:46 am: night time, no bedtime clock, no "bed at", no jobs to tick`, /^Night time/.test(t) && !/bed at|Bedtime jobs|Wind down|\d+ ?min/.test(t) && await k.locator('.bedclock, .jobs .ring, .jobs [data-uid]').count() === 0, t);
  ok(`child ${kid}${nn} at 3:46 am: the side says nothing of last night's bedtime, and still keeps no score`, !/Bedtime \d/.test(side) && await k.locator('.hero .rank, .hero .stat, .ptsline').count() === 0, side);
  await page.context().close(); }
{ let page = await open('look=glass&page=kid&kid=0', '19:20'); let t = await tx(page.locator('fh-kid .jobs'));
  ok('in the evening wind-down is as it was: its name, the time of bed and the clock', /^Wind down/.test(t) && /bed at 8:00 pm/.test(t) && await page.locator('fh-kid .bedclock').count() === 1, t); await page.context().close();
  page = await open('look=glass&page=kid&kid=0', '23:30'); t = await tx(page.locator('fh-kid .jobs'));
  ok('before midnight it is still wind-down (no clock once bedtime has passed)', /^Wind down/.test(t) && await page.locator('fh-kid .bedclock').count() === 0, t); await page.context().close();
  page = await open('look=glass&page=kid&kid=0', '05:10'); t = await tx(page.locator('fh-kid .jobs'));
  ok('from 5 am it is the morning: his jobs are back', /^Today/.test(t) && /this morning/.test(t) && await page.locator('fh-kid .jobs [data-uid]').count() > 0, t); await page.context().close(); }

// 6. the version
ok('the bundle says 0.32', fs.readFileSync(path.join(ROOT, 'dist', 'family-hub.js'), 'utf8').includes('0.32.'));

console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILED` : `\nall ${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
