// Ask's voice (0.32.2): with a text-to-speech entity set (chat.tts) typed and tapped answers are spoken through Home Assistant
// (falling back to the screen's own voice), and "Keep talking" opens the microphone again after each spoken answer until nothing is heard.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4827] node scripts/tests/ask.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4827);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
// the screen's own voice and every sound file played are recorded; a played file "ends" after 300 ms
const FAKE = () => { window.__said = []; window.__played = []; try { speechSynthesis.speak = (u) => { window.__said.push(u.text); }; speechSynthesis.cancel = () => {}; } catch { /* no speech */ }
  window.Audio = class extends EventTarget { constructor(src) { super(); this.src = src; } play() { window.__played.push(this.src); if (window.__audioFail) return Promise.reject(new Error('no')); setTimeout(() => this.dispatchEvent(new Event('ended')), 300); return Promise.resolve(); } pause() {} }; };
const open = async (qs, { tts = true } = {}) => { const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', permissions: ['microphone'] }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.addInitScript(FAKE); await page.addInitScript(() => { try { localStorage.setItem('fh-ask-told', JSON.stringify({ day: new Date().toDateString(), who: ['', 'riley', 'charlie', 'max'] })); } catch {} });
  await page.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(500);
  if (tts) await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, chat: { ...c._config.chat, tts: 'tts.demo_voice', tts_voice: 'nova', tts_language: 'en-AU' } }); await c.updateComplete; });
  await page.evaluate(() => { document.querySelector('family-hub-card')._sheet = 'chat'; }); await page.waitForTimeout(600); await page.evaluate(() => { window.__said = []; window.__played = []; window.__calls = []; }); return page; };
const CH = (page) => page.locator('fh-chat');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re);
const st = (page) => page.evaluate(() => ({ said: window.__said, played: window.__played }));

{ const page = await open('look=glass&page=planner');
  await CH(page).locator('.starter').first().click(); await page.waitForTimeout(1800);
  const t = await calls(page, 'tts_get_url'), s = await st(page);
  ok('with a voice set, an answer is spoken through Home Assistant in that voice', t.length === 1 && /"engine_id":"tts.demo_voice"/.test(t[0]) && /"voice":"nova"/.test(t[0]) && /"language":"en-AU"/.test(t[0]) && s.played.length === 1 && s.said.length === 0, [t, s]);
  await page.context().close(); }
{ const page = await open('look=glass&page=planner', { tts: false });
  await CH(page).locator('.starter').first().click(); await page.waitForTimeout(1800);
  const s = await st(page);
  ok('with no voice set, the screen reads the answer itself, as before', (await calls(page, 'tts_get_url')).length === 0 && s.said.length === 1 && s.played.length === 0, s);
  await page.context().close(); }
{ const page = await open('look=glass&page=planner'); await page.evaluate(() => { window.__audioFail = true; });
  await CH(page).locator('.starter').first().click(); await page.waitForTimeout(1800);
  const s = await st(page);
  ok('if the voice cannot be played, the screen reads the answer instead', s.said.length === 1, s);
  await page.context().close(); }
{ // keep talking
  const page = await open('look=glass&page=planner'); const c = CH(page);
  ok('the microphone and "Keep talking" are offered where the screen may listen', await c.locator('.talk').count() === 1 && (await c.locator('[data-act="convo"]').getAttribute('aria-pressed')) === 'false');
  await c.locator('.talk').click(); await page.waitForTimeout(3500);
  ok('one spoken question, one answer, and the microphone rests', (await calls(page, 'assist_pipeline/run')).length === 1 && (await st(page)).played.length === 1 && (await c.locator('.talk').getAttribute('aria-pressed')) === 'false');
  await c.locator('[data-act="convo"]').click(); await page.evaluate(() => { window.__calls = []; window.__played = []; });
  await c.locator('.talk').click(); await page.waitForTimeout(6000);
  const runs = (await calls(page, 'assist_pipeline/run')).length;
  ok('with "Keep talking" on, the microphone opens again after each spoken answer', runs >= 2 && (await c.locator('[data-act="convo"]').getAttribute('aria-pressed')) === 'true', runs);
  await c.locator('[data-act="convo"]').click(); await page.waitForTimeout(4000); const after = (await calls(page, 'assist_pipeline/run')).length; await page.waitForTimeout(3000);
  ok('switched off, it finishes the answer and listens no more', (await calls(page, 'assist_pipeline/run')).length === after, after);
  ok('the choice is remembered on this screen', await page.evaluate(() => localStorage.getItem('fh-ask-convo')) === '');
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&voice=silent'); const c = CH(page);
  await c.locator('[data-act="convo"]').click(); await c.locator('.talk').click(); await page.waitForTimeout(4500);
  ok('when nothing is heard the conversation rests: it does not keep the microphone open', (await calls(page, 'assist_pipeline/run')).length === 1 && (await c.locator('[data-act="convo"]').getAttribute('aria-pressed')) === 'false' && (await c.locator('.talk').getAttribute('aria-pressed')) === 'false', await calls(page, 'assist_pipeline/run'));
  await page.context().close(); }
// (picture mode has no microphone at all: phase2.mjs holds that, and "Keep talking" lives beside the microphone)
console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILED` : `\nall ${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
