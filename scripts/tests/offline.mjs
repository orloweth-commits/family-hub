// R1.1, "no internet needed to start": the panel with every site outside the house refused.
// The card and its fonts come from where the card was loaded (Home Assistant's own /local/ on the real system, this test's server here);
// the few parts that need the internet (the rain radar, the wind map, a voice made in the cloud) say so plainly and nothing is lost.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4861] node scripts/tests/offline.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.json': 'application/json' };
const PORT = Number(process.env.PORT || 4861);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const local = (u) => { try { const h = new URL(u).hostname; return h === 'localhost' || h === '127.0.0.1'; } catch { return true; } };

/** Opens the preview with the internet "unplugged": every request to a site outside this machine fails as a lost connection would.
 *  `online` names sites that answer anyway (to see the other side of a check). */
const open = async (qs, { time = '2026-11-10T10:20', online = [], before = null } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true });
  const page = await ctx.newPage(), outside = [], fonts = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await ctx.route('**/*', (route) => { const u = route.request().url();
    if (local(u) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    outside.push(new URL(u).hostname);
    if (online.some((h) => u.includes(h))) return route.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' });
    return route.abort('internetdisconnected'); });
  page.on('requestfinished', (r) => { if (/\.woff2/.test(r.url())) fonts.push(r.url()); });
  if (before) await page.addInitScript(before);
  await page.clock.install({ time: new Date(`${time}:00+08:00`) });
  await page.goto('http://localhost:' + PORT + '/?' + qs + '&net=off'); await page.waitForFunction('window.__ready === true', null, { timeout: 20000 }); await page.waitForTimeout(900);
  return { page, outside, fonts };
};
const W = (page) => page.locator('family-hub-card fh-weather'), M = (page) => page.locator('family-hub-card fh-music');
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 200 }); return true; } catch { return false; } };

// 1. the panel starts with the internet down: the planner draws, in every look, and its fonts come from beside the card
for (const [look, families] of [['glass', ['Inter']], ['obsidian', ['Jost', 'Cormorant Garamond', 'Noto Emoji']], ['fridge', []], ['orbit', []], ['sports', []]]) {
  const { page, outside, fonts } = await open(`look=${look}&page=planner`);
  await page.clock.runFor(3000);
  const drawn = await page.evaluate(() => { const r = document.querySelector('family-hub-card')?.shadowRoot; return !!r && (r.textContent ?? '').length > 200 && !!r.querySelector('.fh'); });
  ok(`${look}: the planner draws with no internet`, drawn);
  if (families.length) {
    // (a face is fetched only when its characters are drawn: ask for each with a sample, as drawing it would)
    const loaded = await page.evaluate(async (fs) => Promise.all(fs.map(async (f) => { try { await document.fonts.load(`300 20px "${f}"`, f === 'Noto Emoji' ? '\u{1F33F}' : 'Aa'); } catch { /* reported below */ } return [f, [...document.fonts].some((x) => x.family.replace(/['"]/g, '') === f && x.status === 'loaded')]; })), families);
    ok(`${look}: its fonts load (${families.join(', ')})`, loaded.every(([, l]) => l), loaded);
    ok(`${look}: and every font file came from beside the card, not from a font service`, fonts.length > 0 && fonts.every(local), fonts.map((f) => f.replace(/^https?:\/\/[^/]+/, '')));
  }
  ok(`${look}: nothing outside the house is asked for to start`, outside.length === 0, [...new Set(outside)]);
  await page.context().close();
}

// 2. the rain radar says plainly that it needs the internet (with rain about, it is the large map)
{ const { page } = await open('look=glass&page=weather&wx=rain');
  const said = await until(page, () => /internet/.test(document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot.querySelector('fh-radar')?.shadowRoot?.querySelector('.msg')?.textContent ?? ''));
  const msg = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot.querySelector('fh-radar')?.shadowRoot?.querySelector('.msg')?.textContent ?? '');
  ok('the rain radar says it needs the internet and will try again', said && /try again/.test(msg), msg);
  // 3. the wind map: a plain line in place of the browser's own error page
  await W(page).getByRole('button', { name: 'Wind', exact: true }).click();
  const wind = await until(page, () => !!document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot.querySelector('[data-nonet]'));
  const w = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot; return { line: r.querySelector('[data-nonet]')?.textContent ?? '', frames: r.querySelectorAll('iframe').length }; });
  ok('the wind map says it needs the internet, and no frame is shown with the browser’s error in it', wind && /wind map comes from the internet/i.test(w.line) && w.frames === 0, w);
  // it asks again by itself, and shows the map once the internet answers
  await page.context().route('**embed.windy.com**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' }));
  await page.clock.runFor(3 * 60000 + 2000);
  const back = await until(page, () => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot.querySelectorAll('iframe').length === 1);
  ok('three minutes on, with the internet back, the wind map comes back by itself', back);
  await page.context().close(); }
{ const { page } = await open('look=glass&page=weather&wx=rain', { online: ['embed.windy.com'] });
  await W(page).getByRole('button', { name: 'Wind', exact: true }).click();
  ok('with the internet up the wind map shows as before', await until(page, () => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot.querySelectorAll('iframe').length === 1));
  await page.context().close(); }
// a dry day: the radar is the small card and still says so
{ const { page } = await open('look=glass&page=weather');
  ok('on a dry day the small radar says the same', await until(page, () => /internet/.test(document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot.querySelector('fh-radar')?.shadowRoot?.querySelector('.msg')?.textContent ?? '')));
  await page.context().close(); }

// 4. Call a room when no voice can be made at all (the house voice and the built-in voice both need the internet)
const room = async (page, msg) => { await M(page).getByRole('tab', { name: 'Call a room' }).click(); await M(page).getByRole('button', { name: 'Office' }).click(); await M(page).getByRole('button', { name: msg }).click();
  await page.evaluate(() => { window.__calls = []; }); await M(page).getByRole('button', { name: /Say it/ }).click(); await page.waitForTimeout(900); };
{ const { page } = await open('look=glass&page=music&voice=1&vfiles=none'); await page.evaluate(() => { window.__ttsFail = 'all'; }); await room(page, 'I love you!');
  const sent = await page.evaluate(() => (window.__calls ?? []).filter((c) => /tts\.speak|play_announcement|play_media/.test(c)));
  const msg = await M(page).evaluate((m) => m._msg);
  ok('with no voice to be had, nothing is sent to the speaker', sent.length === 0, sent);
  ok('and the screen says the call did not go through, and why, instead of "Calling"', /didn’t go through/.test(msg) && /internet/.test(msg) && !/^Calling/.test(msg), msg);
  await page.context().close(); }
{ const { page } = await open('look=glass&page=music&voice=1&vfiles=none'); await page.evaluate(() => { window.__ttsFail = true; }); await room(page, 'I love you!');
  const sent = await page.evaluate(() => (window.__calls ?? []).filter((c) => /tts\.speak|play_announcement|tts_get_url/.test(c)).map((c) => c.slice(0, 90)));
  ok('when only the house voice fails, the call still goes out in the built-in voice', sent.some((c) => /tts_get_url.*home_assistant_cloud/.test(c)) && sent.some((c) => /tts\.speak|play_announcement/.test(c)) && /Calling Office/.test(await M(page).evaluate((m) => m._msg)), sent);
  await page.context().close(); }

// 5. the screen's own voice: one made on the internet that fails is said again in a voice that lives on the screen
const FAKE = () => {
  window.__said = [];
  const vs = [{ name: 'Online (Australia)', lang: 'en-AU', localService: false, voiceURI: 'online', default: false }, { name: 'On the screen (Australia)', lang: 'en-AU', localService: true, voiceURI: 'local', default: false }];
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => vs, cancel() {}, speak(u) { window.__said.push(`${u.voice?.name}: ${u.text}`); setTimeout(() => (u.voice?.localService ? u.onend?.({}) : u.onerror?.({ error: 'network' })), 5); } } });
};
{ const { page } = await open('look=glass&page=kid&kid=2', { before: FAKE });
  await page.locator('family-hub-card fh-kid .readme').click(); await page.clock.runFor(300); await page.waitForTimeout(200);
  const said = await page.evaluate(() => window.__said);
  ok('read-aloud tries the Australian voice from the internet, then says it again in the one on the screen', said.length === 2 && /^Online/.test(said[0]) && /^On the screen/.test(said[1]) && said[0].split(': ')[1] === said[1].split(': ')[1], said);
  await page.locator('family-hub-card fh-kid .readme').click(); await page.clock.runFor(300); await page.waitForTimeout(200);
  ok('and only once each time (no endless retrying)', (await page.evaluate(() => window.__said)).length === 4, await page.evaluate(() => window.__said));
  await page.context().close(); }

console.log(`\nerrors: ${errs.length ? '\n' + [...new Set(errs)].map((e) => ' - ' + e).join('\n') : 'none'}`);
console.log(`\n${pass} passed, ${fails.length} failed${fails.length ? ':\n - ' + fails.join('\n - ') : ''}`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
