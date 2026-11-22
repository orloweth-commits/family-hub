// R1.5, "a health sheet behind the PIN": Settings, Health (More, House info, the cog, the PIN) shows everything the panel depends on, each
// with a tick or a plain word: Home Assistant, the internet, each calendar, each speaker, the voice, the phones, the last snapshot, this
// screen (its build and where it came from, a newer build waiting, its last reload and why, what its watchdog is waiting for) and every
// screen's health lines this week. It only reads; it names what is wrong at the top; it stays readable with Home Assistant away.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4871] node scripts/tests/health.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.json': 'application/json' };
const PORT = Number(process.env.PORT || 4871);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x');
  // a new build's file, for "a newer build is waiting"
  const p = u.pathname === '/' ? path.join(PREV, 'index.html') : u.pathname === '/next/family-hub.js' ? path.join(ROOT, 'dist/family-hub.js') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };

const WIRED = 'trust=1&digest=two&approve=1&voice=1&health=1';
/** `net`: whether the two sites asked for the internet answer. `before`: a script run before the page (localStorage). */
/** `voices`: the voices this screen's browser has (0.38.28's row names the one it falls back to); by default one Australian voice,
 *  as the house's Windows Chrome has (headless Chrome may have none). `null` leaves the browser's own list. */
const AU = [{ name: 'Microsoft James - English (Australia)', lang: 'en-AU', localService: true }];
const open = async (qs, { net = true, before = null, time = '2026-11-10T16:20', w = 1920, h = 1080, voices = AU } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.route(/cdn\.jsdelivr\.net|api\.rainviewer\.com/, (r) => (net ? r.fulfill({ status: 200, body: 'ok' }) : r.abort('internetdisconnected')));
  if (voices) await page.addInitScript((vs) => { try { speechSynthesis.getVoices = () => vs; } catch { /* no speech */ } }, voices);
  if (before) await page.addInitScript(before);
  await page.clock.install({ time: new Date(`${time}:00+08:00`) });
  await page.goto('http://localhost:' + PORT + '/?' + qs + '&net=off&calm=1'); await page.waitForFunction('window.__ready === true', null, { timeout: 20000 }); await page.waitForTimeout(600);
  return page;
};
const run = async (page, ms) => { await page.clock.runFor(ms); await page.waitForTimeout(250); };
const S = (page, fn, arg) => page.evaluate(([src, arg]) => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings'); return new Function('s', 'arg', `return (${src})(s, arg)`)(s, arg); }, [fn.toString(), arg]);
/** Open Settings on Health straight away (the getting-there is tested once, by hand, in 1) and wait for the reads. */
const health = async (page) => {
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c._sheet = 'settings'; await c.updateComplete; const s = c.shadowRoot.querySelector('fh-settings'); s._pane = 'health'; await s.updateComplete; });
  await settled(page);
};
const settled = async (page) => { for (let i = 0; i < 40; i++) { await run(page, 1000); if (await S(page, (s) => !!s._hreads && !s._hbusy)) break; } await page.waitForTimeout(200); };
const rows = (page) => S(page, (s) => [...s.shadowRoot.querySelectorAll('.hrow')].map((r) => ({ id: r.dataset.row, mark: r.dataset.mark, name: r.querySelector('b').textContent, words: r.querySelector('span:last-child').textContent })));
const row = async (page, id) => (await rows(page)).find((r) => r.id === id);
const groups = (page) => S(page, (s) => [...s.shadowRoot.querySelectorAll('.scard[data-group]')].map((g) => g.dataset.group));
const summary = (page) => S(page, (s) => { const h = s.shadowRoot.querySelector('.hsum'); return h ? { mark: h.dataset.mark, text: h.innerText.replace(/\s+/g, ' ').trim() } : null; });
const again = async (page) => { await S(page, (s) => s.shadowRoot.querySelector('[data-act="health-again"]').click()); await settled(page); };

// 1. getting there: More, House info, the cog, the PIN; Health is a section of Settings, read only
{ const page = await open(`page=planner&${WIRED}`); const card = page.locator('family-hub-card');
  await card.locator('header .hb[data-act="more"]').click(); await page.waitForTimeout(400);
  await card.locator('.sheet[data-sheet="more"] .morebtn[data-act="info"]').click(); await page.waitForTimeout(400);
  await card.locator('.sheet[data-sheet="sitter"] [data-act="settings"]').click(); await page.waitForTimeout(400);
  ok('the cog on House info asks for the PIN first', await page.evaluate(() => document.querySelector('family-hub-card')._pinAsk?.reason) === 'Open Settings?');
  for (const d of '1234') await card.locator('fh-pin').getByRole('button', { name: d, exact: true }).click();
  await page.waitForTimeout(600);
  const nav = await S(page, (s) => [...s.shadowRoot.querySelectorAll('.snav button')].map((b) => b.dataset.pane));
  ok('Settings lists Health, just before Advanced', nav.indexOf('health') === nav.length - 2 && nav.at(-1) === 'advanced', nav);
  await card.locator('fh-settings .snav button[data-pane="health"]').click();
  await settled(page);
  ok('Health opens with its summary at the top', !!(await summary(page)));
  const foot = await S(page, (s) => ({ say: s.shadowRoot.querySelector('.sft .sstate')?.textContent.trim(), done: !!s.shadowRoot.querySelector('.sft [data-act="done"]'), save: !!s.shadowRoot.querySelector('.sft [data-act="save"]'), off: s.shadowRoot.querySelector('fieldset.spane').disabled }));
  ok('it has nothing to save: Done, not Save', foot.say === 'Nothing to save on this page.' && foot.done && !foot.save && !foot.off, foot);
  ok('the section heading says what it is for', /Whether everything the panel needs is answering/.test(await S(page, (s) => s.shadowRoot.querySelector('.shd').textContent)));
  await page.context().close(); }

// 2. all well: every row a tick, in its group, and the summary says so
{ const page = await open(`page=planner&${WIRED}`);
  await page.evaluate(() => { window.__calls = []; });
  await health(page);
  const g = await groups(page), r = await rows(page), s = await summary(page);
  ok('the groups: Home Assistant and the internet, calendars, speakers, the voice, phones, backups, this screen and every screen', g.join(',') === 'house,cals,speakers,voice,phones,backup,screen,log', g);
  ok('every row is a tick', r.every((x) => x.mark === 'ok'), r.filter((x) => x.mark !== 'ok'));
  ok('the summary says everything is answering, with a tick', s?.mark === 'ok' && /Everything the panel needs is answering/.test(s.text), s);
  ok('Home Assistant and the internet are answering', /^Answering/.test((await row(page, 'ha')).words) && (await row(page, 'net')).words === 'Answering.');
  ok('each of the six calendars was read just now', r.filter((x) => x.id.startsWith('cal:')).length === 6 && r.filter((x) => x.id.startsWith('cal:')).every((x) => /^Read (just now|\d+ min ago)\.$/.test(x.words)));
  ok('each speaker in the house map is named and answering (six)', r.filter((x) => x.id.startsWith('spk:')).length === 6 && r.some((x) => x.name === 'Kitchen' && /playing now/.test(x.words)), r.filter((x) => x.id.startsWith('spk:')).map((x) => x.name));
  ok('the voice is ready, and today’s allowance is counted', (await row(page, 'voice')).mark === 'ok' && /^0 of 1,500 new characters used\.$/.test((await row(page, 'allowance')).words), [await row(page, 'voice'), await row(page, 'allowance')]);
  const alex = await row(page, 'phone:mobile_app_alex');
  ok('a phone with its app’s sensors: last heard from, and what it gets', alex?.name === 'Alex' && /^Last heard from 5 min ago\. It gets the evening digest and approvals\.$/.test(alex.words), alex);
  ok('a phone with nothing more to go on: Home Assistant can send to it', /^Home Assistant can send to it \(the evening digest\)\.$/.test((await row(page, 'phone:mobile_app_sam'))?.words ?? ''), await row(page, 'phone:mobile_app_sam'));
  ok('the emergency alert’s phones are there too', !!(await row(page, 'phone:mobile_app_demo_one')) && /the emergency alert/.test((await row(page, 'phone:mobile_app_demo_one')).words));
  ok('last night’s snapshot', /^Points and the jar copied last night \(2026-11-10\)\.$/.test((await row(page, 'snap')).words), await row(page, 'snap'));
  const scr = await row(page, 'screen');
  ok('this screen: its own name and when its page loaded', /^Called [a-z0-9]{4}\. This page loaded at 4:20\s?pm/.test(scr.words), scr);
  ok('this build: its version, loaded from Home Assistant', /^0\.38\.\d+ \(\/dist\/family-hub\.js\), loaded from Home Assistant\.$/.test((await row(page, 'build')).words), await row(page, 'build'));
  ok('no newer build waiting', (await row(page, 'next')).words === 'None waiting: this is the build the dashboard names.');
  ok('no reload yet, and the watchdog has nothing to do', (await row(page, 'reload')).words === 'It has not needed to reload itself.' && (await row(page, 'watch')).words === 'Watching: nothing to do.');
  const log = r.filter((x) => x.id.startsWith('log:'));
  ok('every screen’s health lines this week, newest first; not the use counts, not one older than a week', log.length === 2 && /^Today, screen wxyz$/.test(log[0].name) && /nightly fresh start/.test(log[0].words) && /^Yesterday, screen wxyz$/.test(log[1].name) && /stopped drawing/.test(log[1].words), log);
  ok('one fault healed by a reload is a tick (the watchdog working)', log[1].mark === 'ok');
  const now = await page.evaluate(() => (window.__calls ?? []).slice(0));
  ok('it only reads: nothing in Home Assistant is called to change', !now.some((c) => /^[a-z_]+\.[a-z_]+ /.test(c) && !/^fetch /.test(c)), now);
  const text = await page.evaluate(() => window.__fhHealth?.());
  ok('the same rows as plain text for Claude on a real screen (window.__fhHealth())', /^Home Assistant and the internet\n {2}\[ok\] Home Assistant: Answering/.test(text ?? '') && /\[ok\] The nightly snapshot:/.test(text), (text ?? '').slice(0, 120));
  ok('each mark says what it means to a screen reader', await S(page, (s) => [...s.shadowRoot.querySelectorAll('.hmark')].every((m) => m.getAttribute('role') === 'img' && /^(Working|Worth a look|Not working|Checking or waiting)$/.test(m.getAttribute('aria-label')))));
  // a minute later it asks again by itself
  const at = await S(page, (s) => s._hreads.at); await run(page, 62_000); await settled(page);
  ok('it asks again by itself each minute while open', await S(page, (s) => s._hreads.at) > at);
  await page.context().close(); }

// 3. things wrong: each named, with a plain word, and the worst at the top
{ const page = await open(`page=planner&${WIRED}&moff=office&phone=old&snap=old&held=1`, { net: false });
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c.hass.states['calendar.sam'] = { ...c.hass.states['calendar.sam'], state: 'unavailable' }; c.hass = { ...c.hass }; });
  await health(page);
  const r = await rows(page), s = await summary(page);
  ok('the internet: not answering, and what needs it', (await row(page, 'net')).mark === 'bad' && /^Not answering\. The rain radar, the wind map, the house voice, Ask and new builds need it; the rest of the panel does not\.$/.test((await row(page, 'net')).words));
  ok('a calendar Home Assistant has lost', (await row(page, 'cal:calendar.sam')).mark === 'bad' && /Can’t be reached/.test((await row(page, 'cal:calendar.sam')).words));
  ok('a speaker that can’t be reached', r.find((x) => x.name === 'Office')?.mark === 'bad' && r.find((x) => x.name === 'Office')?.words === 'Can’t be reached.');
  const alex = await row(page, 'phone:mobile_app_alex');
  ok('a phone not heard from for three days is worth a look, and says why it matters', alex.mark === 'warn' && /^Not heard from for 3 days: it may be off, or its Home Assistant app signed out\. It gets the evening digest and approvals\.$/.test(alex.words), alex);
  ok('a snapshot that stopped: the newest, and that it has not run since', (await row(page, 'snap')).mark === 'bad' && /^The newest is from Sat 7 Nov \(2026-11-07\): the snapshot at 2:15 am has not run since\.$/.test((await row(page, 'snap')).words), await row(page, 'snap'));
  const held = r.find((x) => x.id.startsWith('log:') && /Held back/.test(x.words));
  ok('a reload held back on any screen needs a person', held?.mark === 'bad' && /a person should look/.test(held.words), held);
  ok('the summary counts them and names each at the top', s.mark === 'bad' && /^5 things are not working, and one is worth a look\. Not working: The internet; Sam \(calendars\); Office \(speakers\); The nightly snapshot \(backups\); and 1 more\. Worth a look: Alex \(phones\)\./.test(s.text), s);
  await page.context().close(); }
{ const page = await open(`page=planner&${WIRED}&snap=none`); await health(page);
  ok('no snapshot at all: there isn’t one yet', (await row(page, 'snap')).mark === 'bad' && /^There isn’t one yet/.test((await row(page, 'snap')).words));
  await page.context().close(); }
// two fault reloads by one screen in a day are worth a look
{ const page = await open(`page=planner&${WIRED}`);
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'), d = new Date(), y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    for (const t of ['09:10', '11:40']) await c.hass.callService('todo', 'add_item', { item: `${y} abcd reloaded at ${t}: the same error kept coming back` }, { entity_id: 'todo.family_hub_use' }); });
  await health(page);
  const twice = (await rows(page)).filter((x) => x.id.startsWith('log:') && /screen abcd/.test(x.name));
  ok('two fault reloads on one screen in a day: each worth a look', twice.length === 2 && twice.every((x) => x.mark === 'warn' && /more than once that day/.test(x.words)), twice);
  await page.context().close(); }

// 4. this screen: a newer build waiting, its last reload and why, and what the watchdog waits for
{ const page = await open(`page=planner&${WIRED}`, { before: `localStorage.setItem('fh-reloads', JSON.stringify([{ at: ${new Date('2026-11-10T16:05:00+08:00').getTime()}, why: 'socket', logged: true }]))` });
  await health(page);
  ok('its last reload and why, in the health log’s words', /^Today at 4:05\s?pm: Home Assistant was answering but this screen’s link to it would not come back\.$/.test((await row(page, 'reload')).words), await row(page, 'reload'));
  await page.evaluate(() => { window.__resources = [{ id: 'fh', type: 'module', url: '/next/family-hub.js' }]; });
  await again(page);
  ok('a newer build: waiting, named, taken at the next quiet moment', (await row(page, 'next')).mark === 'wait' && /^Waiting \(\/next\/family-hub\.js\): this screen takes it by itself at its next quiet moment\.$/.test((await row(page, 'next')).words), await row(page, 'next'));
  await run(page, 16_000);
  const w = await row(page, 'watch');
  ok('the watchdog: will reload for the new build, waiting until nobody is using the screen (the sheet is open)', w.mark === 'wait' && /^Will reload \(a new build was ready\), waiting until nobody has touched the screen for three minutes and nothing is open\.$/.test(w.words), w);
  ok('a waiting build is not a fault: the summary still has nothing not working', (await summary(page)).mark !== 'bad', await summary(page));
  ok('and no reload happened under the open sheet', !(await page.evaluate(() => (window.__reloads ?? []).length)));
  await page.context().close(); }

// 5. Home Assistant away: the sheet stays readable and says what it cannot check
{ const page = await open(`page=planner&${WIRED}`);
  await health(page);
  await page.evaluate(() => window.__haDown(true)); await run(page, 15_000);
  const ha = await row(page, 'ha');
  ok('Home Assistant: not answering since when, and for how long', ha.mark === 'bad' && /^Not answering since 4:2\d\s?pm \(1 min\)\. The panel shows what it last had, and reconnects by itself\.$/.test(ha.words), ha);
  const g = await rows(page);
  ok('what comes from Home Assistant says it can’t be checked, once per group (calendars, speakers, the voice, phones), not a cross per row', g.filter((x) => x.id === 'away').length === 4 && !g.some((x) => x.id.startsWith('cal:') || x.id.startsWith('spk:')), g.map((x) => x.id));
  await again(page);
  ok('a fresh check while away: the snapshot, the log and the build say they can’t be read, nothing throws', /while Home Assistant isn’t answering/.test((await row(page, 'snap')).words) && /while Home Assistant isn’t answering/.test((await row(page, 'log')).words) && /while Home Assistant isn’t answering/.test((await row(page, 'next')).words));
  ok('the pane can still be read and scrolled (not greyed out with the rest)', await S(page, (s) => !s.shadowRoot.querySelector('fieldset.spane').disabled));
  await page.evaluate(() => window.__haDown(false)); await run(page, 3000); await again(page);
  ok('back: Home Assistant answering and every row a tick again', (await row(page, 'ha')).mark === 'ok' && (await rows(page)).every((x) => x.mark === 'ok'), (await rows(page)).filter((x) => x.mark !== 'ok'));
  await page.context().close(); }

// 6. the voice's allowance used up; a house without the trust guards or a voice; a screen that cannot save
{ const page = await open(`page=planner&${WIRED}&vcap=10`, { before: `localStorage.setItem('fh-voice-day', JSON.stringify({ d: '2026-11-10', n: 24 }))` });
  await health(page);
  const a = await row(page, 'allowance');
  ok('today’s allowance used up: worth a look, and what happens instead', a.mark === 'warn' && /^Used up \(24 of 10 new characters\): new lines are spoken in the screen’s own voice until midnight\.$/.test(a.words), a);
  await page.context().close(); }
{ const page = await open('page=planner'); await health(page);
  const g = await groups(page);
  ok('a house without the snapshot, the health log or a voice: those groups are simply not there', g.join(',') === 'house,cals,speakers,phones,screen', g);
  await page.context().close(); }
{ const page = await open(`page=planner&${WIRED}&admin=0`); await health(page);
  ok('on a screen that cannot save, Health is still open to read', await S(page, (s) => s._pane === 'health' && !s.shadowRoot.querySelector('fieldset.spane').disabled && s.shadowRoot.querySelectorAll('.hrow').length > 10));
  await page.context().close(); }
{ const page = await open(`page=planner&${WIRED}&nopin=1`); await health(page);
  ok('with no PIN set yet, Health can be read (as Advanced can)', await S(page, (s) => s._pane === 'health' && s.shadowRoot.querySelectorAll('.hrow').length > 10), await S(page, (s) => s._pane));
  await page.context().close(); }

// 6b. this screen's own voice (0.38.28): named in the voice group; Australian or British a tick, American or none worth a look.
// The list is read whenever the sheet asks again, so a voice that loads later is seen.
{ const page = await open(`page=planner&${WIRED}`); await health(page);
  const r = await row(page, 'ownvoice'), g = await S(page, (s) => [...s.shadowRoot.querySelectorAll('.scard[data-group="voice"] .hrow')].map((x) => x.dataset.row));
  ok('the voice group names this screen’s own voice: Australian, a tick', r?.mark === 'ok' && r.words === 'James - English (Australia) (Australian): it speaks when the house voice can’t.' && g.join(',') === 'voice,allowance,ownvoice', [r, g]);
  await page.context().close(); }
for (const [label, vs, mark, re] of [
  ['an American voice first in the list, a British one later: the British one, a tick', [{ name: 'Google US English', lang: 'en-US', localService: false }, { name: 'Microsoft Hazel - English (United Kingdom)', lang: 'en-GB', localService: true }], 'ok', /^Hazel - English \(United Kingdom\) \(British\): it speaks when the house voice can’t\. No Australian voice on this screen\.$/],
  ['both Australian and American: the Australian one, whatever the order', [{ name: 'Microsoft David - English (United States)', lang: 'en-US', localService: true }, { name: 'Karen', lang: 'en_AU', localService: true }], 'ok', /^Karen \(Australian\)/],
  ['only American voices: worth a look, and what to do', [{ name: 'Microsoft David - English (United States)', lang: 'en-US', localService: true }, { name: 'Microsoft Zira - English (United States)', lang: 'en-US', localService: true }], 'warn', /^David - English \(United States\) \(American\): no Australian or British voice on this screen\. Add the English \(Australia\) speech pack\.$/],
  ['no English voice at all: worth a look', [{ name: 'Microsoft Hortense - French (France)', lang: 'fr-FR', localService: true }], 'warn', /^None in English on this screen/]]) {
  const page = await open(`page=planner&${WIRED}`, { voices: vs }); await health(page);
  const r = await row(page, 'ownvoice');
  ok(`this screen’s own voice, ${label}`, r?.mark === mark && re.test(r.words), r);
  await page.context().close(); }
{ const page = await open(`page=planner&${WIRED}`); await page.evaluate(() => window.__haDown(true)); await run(page, 12000); await health(page);
  const r = await row(page, 'ownvoice');
  ok('this screen’s own voice is still named while Home Assistant is away (it is the screen’s, not the house’s)', r?.mark === 'ok', r);
  await page.evaluate(() => window.__haDown(false)); await page.context().close(); }

// 7. fit: at the wall's size every row's name and words are whole and inside the pane, in light and in dark; and on a phone
for (const [label, qs, w, h] of [['glass, wall', 'look=glass', 1920, 1080], ['glass dark, wall', 'look=glass&dark=1', 1920, 1080], ['obsidian, wall', 'look=obsidian', 1920, 1080], ['phone', 'look=glass', 390, 844]]) {
  const page = await open(`page=planner&${WIRED}&moff=office&phone=old&held=1&${qs}`, { w, h }); await health(page);
  const fit = await S(page, (s) => { const pane = s.shadowRoot.querySelector('fieldset.spane').getBoundingClientRect(), bad = [];
    for (const el of s.shadowRoot.querySelectorAll('.hrow > b, .hrow > span, .hsum b, .hsum .hwhich')) { const r = el.getBoundingClientRect(); if (r.left < pane.left - 1 || r.right > pane.right + 1 || el.scrollWidth > el.clientWidth + 1) bad.push(el.textContent.slice(0, 40)); }
    return bad; });
  ok(`${label}: every name and word is whole and inside the pane`, !fit.length, fit);
  const ink = await S(page, (s) => [...s.shadowRoot.querySelectorAll('.hmark')].map((m) => getComputedStyle(m).color));
  ok(`${label}: a tick, a warning and a cross are drawn in different colours`, new Set(ink).size >= 3, [...new Set(ink)]);
  await page.context().close();
}

console.log(`\n${pass} passed, ${fails.length} failed`);
if (fails.length) console.log('failed:\n - ' + fails.join('\n - '));
console.log('errors:', errs.length ? '\n - ' + [...new Set(errs)].join('\n - ') : 'none');
await browser.close(); srv.close();
process.exit(fails.length ? 1 : 0);
