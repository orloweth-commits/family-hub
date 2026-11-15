// The Obsidian look (the parents' look for an evening with guests): it loads on every page, shows no faces and no cartoons, is
// chosen by hand for the panel and never by or for a child, and its motion (the band of light, the header's pulse, the ring round
// today, the glint, the dock's blade, the clock's spark, the one bloom on focus) runs as its brief says and stops when asked.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4811] node scripts/tests/obsidian.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4811);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
// The clock is fixed, not installed: an installed clock freezes animations, and this suite is about them.
const open = async (qs, { store = {}, look = 'obsidian', reduce = false, w = 1920, h = 1080 } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', reducedMotion: reduce ? 'reduce' : 'no-preference' });
  await ctx.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, store);
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(`${qs}: ${String(e)}`)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(`${qs}: ${m.text()}`); });
  await page.clock.setFixedTime(new Date('2026-11-10T16:20:00+08:00')); await page.goto(`http://localhost:${PORT}/?look=${look}&${qs}`); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(900); return page; };
/** Run `f` in the page with every element of every shadow root. */
const deep = (page, f, arg) => page.evaluate(`((arg) => { const all = []; const walk = (r) => { for (const e of r.querySelectorAll('*')) { all.push(e); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document); return (${f})(all, arg); })(${JSON.stringify(arg ?? null)})`);
/** Every animation on the page: its name, its length, how often it repeats and whether it is running. */
const anims = (page) => page.evaluate(() => { const seen = new Set(), out = []; const take = (r) => { for (const a of r.getAnimations()) { if (seen.has(a)) continue; seen.add(a); const t = a.effect?.getComputedTiming() ?? {};
  out.push({ name: a.animationName ?? '', ms: Number(t.duration) || 0, n: t.iterations, state: a.playState }); } }; const walk = (r) => { take(r); for (const e of r.querySelectorAll('*')) if (e.shadowRoot) walk(e.shadowRoot); }; walk(document); return out; });
const shut = (page) => page.context().close();

// 1. it loads on every page, and the panel wears it
const PAGES = ['page=planner', 'page=planner&view=day', 'page=planner&view=month', 'page=kid&kid=0', 'page=kid&kid=1', 'page=kid&kid=2', 'page=morning', 'page=groceries', 'page=doodle', 'page=weather', 'page=home',
  'page=music&mview=house', 'page=music&mview=scene', 'page=music&mtab=shelves', 'page=planner&sheet=more', 'page=planner&sheet=themes', 'page=planner&sheet=settings&pane=house', 'page=planner&approve=1'];
for (const qs of PAGES) { const page = await open(qs);
  const look = await page.evaluate(() => document.querySelector('family-hub-card').getAttribute('data-look'));
  // 2. no faces and no cartoons: no painted or drawn character, no drawing with a filled picture, on any page
  const seen = await deep(page, `(all) => { const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    return { faces: all.filter((e) => (e.matches('.avwrap:not(.avmono)') || e.tagName === 'FH-PIC') && vis(e)).length, drawings: all.filter((e) => e.matches('svg.pic2') && vis(e)).length,
      wheel: all.filter((e) => e.matches('.pinw') && vis(e)).map((e) => getComputedStyle(e).backgroundImage).filter((b) => /255, 93, 93/.test(b)).length,
      sleeves: all.filter((e) => e.matches('.puck.onshelf, .sleeve') && /--p-\\d/.test(e.getAttribute('style') || '')).length }; }`);
  ok(`${qs}: loads in Obsidian with no face, cartoon drawing, rainbow wheel or coloured blank sleeve`, look === 'obsidian' && seen.faces === 0 && seen.drawings === 0 && seen.wheel === 0 && seen.sleeves === 0, { look, ...seen });
  await shut(page); }

// 2b. a person is a letter on a disc of their colour; emoji are line glyphs in the colour of the words
{ const page = await open('page=morning');
  const mono = await deep(page, `(all) => all.filter((e) => e.matches('.avmono')).map((e) => e.textContent.trim() + ':' + (e.getAttribute('aria-label') || ''))`);
  ok('the morning board names each child by a letter, with the name for a screen reader', mono.length >= 3 && mono.every((m) => /^[A-Z]:/.test(m)), mono.slice(0, 6));
  const font = await page.evaluate(async () => { await document.fonts.load("300 24px 'Noto Emoji'", '🎁'); const c = document.querySelector('family-hub-card'); return { has: document.fonts.check("300 24px 'Noto Emoji'", '🎁'), fam: getComputedStyle(c.shadowRoot.querySelector('.fh')).fontFamily, faces: [...document.fonts].filter((f) => /Noto Emoji/.test(f.family)).map((f) => f.status) }; });
  ok('the line-emoji font is loaded and sits after the look’s text family', font.has && font.faces.includes('loaded') && /Jost.*Noto Emoji/.test(font.fam), font);
  await shut(page); }
{ const page = await open('page=morning', { look: 'glass' });
  const n = await deep(page, `(all) => ({ mono: all.filter((e) => e.matches('.avmono')).length, faces: all.filter((e) => e.matches('.avwrap:not(.avmono)')).length })`);
  ok('another look keeps its faces (the base asks the look, it does not change for everyone)', n.mono === 0 && n.faces >= 3, n);
  const emo = await page.evaluate(() => [...document.fonts].some((f) => /Noto Emoji/.test(f.family)));
  ok('and does not fetch the line-emoji font', emo === false);
  await shut(page); }

// 3. chosen by hand for the panel; never by or for a child
{ const page = await open('page=planner&sheet=themes');
  const cards = await deep(page, `(all) => all.filter((e) => e.matches('.tcard')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim().slice(0, 24) + '|' + e.getAttribute('aria-pressed'))`);
  ok('More, Looks offers Obsidian, and shows it chosen', cards.some((c) => /^Obsidian.*\|true$/.test(c)), cards);
  await shut(page); }
{ const page = await open('page=kid&kid=0&sheet=kidprefs', { look: 'glass' });
  const cards = await deep(page, `(all) => all.filter((e) => e.matches('.kidlooks .tcard')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim().slice(0, 18))`);
  ok('a child’s own look picker has every other look and not Obsidian', cards.length >= 5 && cards.some((c) => /^Orbit/.test(c)) && !cards.some((c) => /Obsidian/.test(c)), cards);
  await shut(page); }
{ const page = await open('page=planner&sheet=settings&pane=children', { look: 'glass' });
  const chips = await deep(page, `(all) => all.filter((e) => e.matches('[role="group"][aria-label="Look"] button')).map((e) => e.textContent.trim())`);
  ok('Settings, Children offers a child every other look and not Obsidian', chips.includes('Same as the panel') && chips.includes('Orbit') && !chips.includes('Obsidian'), chips);
  await shut(page); }
{ const page = await open('page=planner&sheet=settings&pane=house', { look: 'glass' });
  const chips = await deep(page, `(all) => all.filter((e) => e.matches('[role="group"][aria-label="Look"] button')).map((e) => e.textContent.trim())`);
  ok('Settings, House (the panel’s own look) does offer Obsidian', chips.includes('Obsidian'), chips);
  await shut(page); }
{ const own = { 'family-hub-kid-riley': JSON.stringify({ look: 'orbit' }) };
  let page = await open('page=kid&kid=0', { look: 'glass', store: own });
  ok('a child with his own look keeps it on an ordinary day', await page.evaluate(() => document.querySelector('family-hub-card').getAttribute('data-look')) === 'orbit'); await shut(page);
  page = await open('page=kid&kid=0', { store: own });
  ok('while the panel is in Obsidian, his page wears Obsidian too', await page.evaluate(() => document.querySelector('family-hub-card').getAttribute('data-look')) === 'obsidian');
  ok('and his saved choice is untouched for the morning', await page.evaluate(() => JSON.parse(localStorage.getItem('family-hub-kid-riley')).look) === 'orbit'); await shut(page);
  page = await open('page=kid&kid=0', { look: 'glass', store: { 'family-hub-kid-riley': JSON.stringify({ look: 'obsidian' }) } });
  ok('a saved setting can never give a child Obsidian as his own', await page.evaluate(() => document.querySelector('family-hub-card').getAttribute('data-look')) === 'glass'); await shut(page); }
{ const page = await open('page=planner');
  const key = await page.evaluate(async () => { const before = localStorage.getItem('family-hub-look'); const c = document.querySelector('family-hub-card'); c._now = new Date('2026-11-11T07:00:00+08:00'); c.requestUpdate(); await c.updateComplete; return [before, localStorage.getItem('family-hub-look'), c.getAttribute('data-look')]; });
  ok('it stays on until someone changes it: the next morning it is still Obsidian', key.every((k) => k === 'obsidian'), key);
  await shut(page); }

// 4. motion, as the brief gives it
const WANT = { obSweepX: 14000, obFlow: 9000, obEdge: 12000, obGlint: 7000, obPulse: 3600, obSpark: 60000 };
{ const page = await open('page=planner'); const list = await anims(page);
  for (const [name, ms] of Object.entries(WANT)) { const a = list.filter((x) => x.name === name);
    ok(`${name} runs, ${ms / 1000} s a turn, without end`, a.length > 0 && a.every((x) => x.ms === ms && x.n === Infinity && x.state === 'running'), a.slice(0, 2)); }
  // the band of light is one clock on the whole panel: it waits off the left edge, then crosses to the right, and every panel reads the same clock
  const band = await page.evaluate(async () => { const fh = document.querySelector('family-hub-card').shadowRoot.querySelector('.fh'); const a = fh.getAnimations().find((x) => x.animationName === 'obSweepX'); const at = (t) => { a.pause(); a.currentTime = t; return parseFloat(getComputedStyle(fh).getPropertyValue('--ob-x')); };
    const v = [at(1000), at(7000), at(9800), at(11200), at(13000)]; a.play(); const col = fh.querySelector('.col'); return { v, fixed: getComputedStyle(col).backgroundAttachment, own: col.getAnimations().map((x) => x.animationName) }; });
  ok('the band of light waits off the left edge for half its turn, then crosses the screen from left to right', band.v[0] === band.v[1] && band.v[1] < band.v[2] && band.v[2] < band.v[3] && band.v[3] <= band.v[4] && Math.abs(band.v[0] + 1.7 * 1920) < 2 && Math.abs(band.v[4] + 0.3 * 1920) < 2, band.v);
  ok('each panel is lit by that one band, fixed to the screen, with no clock of its own', /fixed/.test(band.fixed) && !band.own.includes('obSweepX'), { fixed: band.fixed, own: band.own });
  // one bloom when something becomes chosen: amber, once, about a second and a half
  const day = page.locator('family-hub-card').getByRole('button', { name: 'Day', exact: true }); await day.click(); await page.waitForTimeout(120);
  const bloom = await deep(page, `(all) => all.filter((e) => e.matches('.seg button[aria-pressed="true"]')).flatMap((e) => e.getAnimations().map((a) => ({ name: a.animationName, ms: a.effect.getComputedTiming().duration, n: a.effect.getComputedTiming().iterations })))`);
  ok('choosing something blooms once in amber, 1.44 s', bloom.some((b) => b.name === 'obBloomA' && b.n === 1 && Math.abs(b.ms - 1440) < 2), bloom);
  await shut(page); }
{ const page = await open('page=home'); await page.waitForTimeout(300);
  const sw = page.locator('family-hub-card fh-home').locator('[role="switch"][aria-checked="false"], .lamp[aria-pressed="false"], .dev:not(.on)').first();
  if (await sw.count()) { await sw.click(); await page.waitForTimeout(150);
    const b = await deep(page, `(all) => all.flatMap((e) => e.getAnimations ? e.getAnimations().map((a) => a.animationName) : []).filter((n) => /obBloom/.test(n))`);
    ok('switching something on blooms once in blue', b.includes('obBloomB'), b); } else ok('switching something on blooms once in blue', false, 'nothing to switch on the Home page');
  await shut(page); }
// calm mode and reduce-motion stop it
{ const page = await open('page=planner&calm=1'); const run = (await anims(page)).filter((x) => x.state === 'running');
  ok('calm mode: nothing loops and nothing blooms (no band, pulse, ring, glint, blade, spark or bloom)', run.length === 0, run.slice(0, 4));
  const day = page.locator('family-hub-card').getByRole('button', { name: 'Day', exact: true }); await day.click(); await page.waitForTimeout(120);
  const after = (await anims(page)).filter((x) => x.state === 'running' && /^ob/.test(x.name));
  ok('calm mode: choosing something does not bloom', after.length === 0, after.slice(0, 3));
  await shut(page); }
{ const page = await open('page=music&mview=house&calm=1'); const run = (await anims(page)).filter((x) => x.state === 'running');
  ok('calm mode on Music: nothing loops', run.length === 0, run.slice(0, 4)); await shut(page); }
{ const page = await open('page=planner', { reduce: true }); const list = await anims(page); const long = list.filter((x) => x.state === 'running' && (x.ms > 1 || x.n > 1));
  ok('reduce-motion: nothing runs for longer than an instant', long.length === 0, long.slice(0, 4));
  const day = page.locator('family-hub-card').getByRole('button', { name: 'Day', exact: true }); await day.click(); await page.waitForTimeout(60);
  const bloom = await deep(page, `(all) => all.filter((e) => e.matches('.seg button[aria-pressed="true"]')).flatMap((e) => e.getAnimations().filter((a) => /obBloom/.test(a.animationName ?? '')).map((a) => a.effect.getComputedTiming().duration))`);
  ok('reduce-motion: no bloom either', bloom.every((ms) => ms <= 1), bloom);
  await shut(page); }
// the screensaver at night wears it, with the chronograph, and wakes
// (with no pictures: with pictures the screen is a matted picture and a caption, and the chronograph stays off it)
{ const page = await open('page=planner&idle=1&night=1&artn=0'); await page.waitForTimeout(1500);
  const art = await deep(page, `(all) => { const m = all.find((e) => e.matches('.artm')); return m ? { night: m.hasAttribute('data-night'), chrono: !!m.querySelector('.chrono') || all.some((e) => e.matches('.chrono') && m.contains(e.getRootNode().host ?? e)) } : null; }`);
  ok('the screensaver at its night level shows the look’s chronograph', !!art && art.night && art.chrono, art);
  await shut(page); }

console.log(`\n${pass} passed, ${fails.length} failed${fails.length ? ': ' + fails.join(' | ') : ''}`);
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
