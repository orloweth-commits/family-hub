// Screenshot every look on every screen with sample data, so a base change can be checked in all looks at once.
// Needs Playwright (not a dependency of the card): npm i -D playwright && npx playwright install chromium
// Usage: npm run build && node scripts/shots.mjs [looks] [pages] [HH:MM]   → preview/shots/<look>-<page>.png
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('..', import.meta.url).pathname, OUT = path.join(ROOT, 'preview/shots'), PORT = 4790;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg' };
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const p = path.join(ROOT, u.pathname === '/' ? 'preview/index.html' : u.pathname);
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); });
}).listen(PORT);
const [looks = 'glass,fridge,orbit', pages = 'planner,planner?view=day,planner?view=month,planner?sheet=themes,kid?kid=0,kid?kid=1,kid?kid=2,groceries,doodle,music,home', hhmm = '16:20'] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ['--no-sandbox'] } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'en-AU' });
for (const look of looks.split(',')) for (const pg of pages.split(',')) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('page error:', String(e).slice(0, 300)));
  const now = new Date(); now.setHours(Number(hhmm.slice(0, 2)), Number(hhmm.slice(3)), 0, 0);
  await page.clock.setFixedTime(now);
  const [p, extra = ''] = pg.split('?');
  await page.goto(`http://localhost:${PORT}/?look=${look}&page=${p}${extra ? '&' + extra : ''}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 15000 }).catch(() => console.log('not ready'));
  await page.waitForTimeout(2000);
  const file = path.join(OUT, `${look}-${p}${extra ? '-' + extra.replace(/[^a-z0-9]+/gi, '_') : ''}.png`);
  await page.screenshot({ path: file }); console.log('shot', path.relative(ROOT, file));
  await page.close();
}
await browser.close(); srv.close();
