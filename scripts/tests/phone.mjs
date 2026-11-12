// Phone check at 390x844: confirms the phone arrangement is on, nothing scrolls sideways or sits off the right edge.
// LOOK=glass|fridge|orbit|sports picks the look (default glass); PAGES= a comma-separated list of page queries.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(4783);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'Australia/Perth', locale: 'en-AU' });
const errs = [];
for (const pg of (process.env.PAGES || 'planner,kid&kid=1,kid&kid=2,groceries,music,music&mtab=search&find=Bluey,home,doodle,planner&sheet=themes,planner&view=month').split(',')) {
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(pg + ': ' + String(e)));
  await page.clock.setFixedTime(new Date('2026-11-10T16:20:00+08:00'));
  await page.goto(`http://localhost:4783/?look=${process.env.LOOK || 'glass'}&page=${pg}`); await page.waitForFunction('window.__ready === true').catch(() => {}); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => { const c = document.querySelector('family-hub-card'), fh = c.shadowRoot.querySelector('.fh'); let wide = 0; const walk = (root) => root.querySelectorAll('*').forEach((e) => { const b = e.getBoundingClientRect(); if (b.width > 1 && b.right > innerWidth + 3 && !e.closest('.week,.dock,.tabs,.brushes') ) wide++; if (e.shadowRoot) walk(e.shadowRoot); }); walk(c.shadowRoot);
    return { phone: c.hasAttribute('data-phone'), z: getComputedStyle(fh).zoom, pageH: document.documentElement.scrollHeight, sideways: document.documentElement.scrollWidth > innerWidth + 2, offRight: wide, view: c._view }; });
  console.log(pg.padEnd(30), JSON.stringify(r));
  await page.screenshot({ path: path.join(PREV, 'shots', `ph-${pg.replace(/[^a-z0-9]+/gi, '_')}.png`), fullPage: false });
  await page.close();
}
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close();
