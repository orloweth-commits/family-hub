// What the click-base parts share (click-base-shell, -kid, -planner, -pages): the test server, the browser, opening a page, and the
// small helpers that were at the top of click-base.mjs and in its rounds 3, 4 and 7. Split from click-base.mjs on 23 Nov 2026 (plan section 3).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
export const ROOT = new URL('../../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
export const PORT = Number(process.env.PORT || 4779); // PORT= moves the test server when another run holds the usual port
export const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
export const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
export const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'Australia/Perth', locale: 'en-AU' });
export const errs = [];
const card = "document.querySelector('family-hub-card')";
/** Every animation that has started and ends has ended (at most 2 s). Used after a wait that let the page draw: under the fake clock
 *  (`clock.install`) the page's own frames and timers are faked too, so "nothing is moving" can be read before anything has been drawn.
 *  That is why open() and openAt() keep their fixed 700 and 900 ms (tried without them on 23 Nov: R5-9 measured a sheet mid-arrival and
 *  R5-14 tapped a list not yet read). */
export const settle = (p) => p.evaluate(() => Promise.race([
  (async () => { await document.fonts.ready; const c = document.querySelector('family-hub-card'); for (let i = 0; i < 40 && !c?.shadowRoot?.querySelector('.fh'); i++) await new Promise((r) => requestAnimationFrame(r));
    const fin = () => document.getAnimations().filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().endTime));
    await Promise.all(fin().map((a) => a.finished.catch(() => {}))); })(),
  new Promise((r) => setTimeout(r, 2000))]));
// since 0.33.0 (Phase 4): a child's page has only his face and Everyone in the dock, and Looks, Medicine, House info, Night and who-is-home are in the More sheet
export const HOME = async (p) => { if (await p.locator('family-hub-card nav.dock[data-kid]').count()) { await p.locator('family-hub-card nav.dock [data-nav="home"]').click();
  await p.waitForFunction(`!${card}.shadowRoot.querySelector('nav.dock[data-kid]')`, null, { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(400); } };
export const MORE = async (p) => { await p.evaluate(() => { document.querySelector('family-hub-card')._sheet = 'more'; });
  await p.waitForFunction(`!!${card}.shadowRoot.querySelector('.sheet[data-sheet="more"]')`, null, { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(400); };
const watch = (page) => { page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  page.on('requestfailed', (r) => errs.push('failed ' + r.url())); page.on('response', (r) => { if (r.status() === 404 && !/favicon/.test(r.url())) errs.push('404 ' + r.url()); }); };
// `init`: a script run before the page's own (since R1.2 a read that fails shows what this browser kept, so "never read here" starts the page with its kept copies forgotten: backlog 131)
export const open = async (qs, time = '16:20', init) => { const page = await ctx.newPage(); if (init) await page.addInitScript(init); watch(page);
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
/** A page in a context of its own at a given size (round 4 on). */
export const openAt = async (w, h, qs, time = '16:20') => { const c = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU' }); const p = await c.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await p.goto('http://localhost:' + PORT + '/?' + qs); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(900); return p; };
export const shot = (page, n) => page.screenshot({ path: path.join(PREV, 'shots', n + '.png') });
// a printed value checked against its expectation says ok or FAIL, so the check reads it (an unmet "expect" printed no FAIL until 22 Nov: backlog 151)
export const ok = (b) => (b ? 'ok' : 'FAIL');
export const calls = (p) => p.evaluate(() => (window.__calls ?? []).join('\n'));
export const toastOf = async (p, host) => (await p.locator(`${host} .toast`).allInnerTexts()).join(' ').replace(/\s+/g, ' ').trim();
// round 7's
export const sr = (sel) => `document.querySelector('family-hub-card').shadowRoot.querySelector('${sel}').shadowRoot`;
export const srStudio = `${sr('fh-kid')}.querySelector('fh-studio').shadowRoot`;
export const ratio = `(a, b) => { const l = (c) => { let m = c.match(/[\\d.]+/g).map(Number); if (/^color\\(srgb/.test(c)) m = m.map((v, i) => (i < 3 ? v * 255 : v)); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); }; const A = l(a), B = l(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); }`;
/** One section in a block of its own: if it stops (an element not found, a page closed under it) it says so with a FAIL line and the
 *  next section carries on (backlog 34). Pages it left open are closed. */
export const section = async (name, fn) => { const t0 = Date.now();
  try { await fn(); } catch (e) { console.log(`FAIL [${name}] stopped: ${String(e?.message ?? e).split('\n')[0].slice(0, 200)}`); }
  for (const c of browser.contexts()) for (const p of c.pages()) await p.close().catch(() => {});
  for (const c of browser.contexts()) if (c !== ctx) await c.close().catch(() => {});
  if (process.env.TIMES) console.log(`  (${name}: ${((Date.now() - t0) / 1000).toFixed(1)} s)`); };
export const finish = async () => { console.log('errors:', errs.length ? errs.join('\n') : 'none'); await browser.close(); srv.close(); };
