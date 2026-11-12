// Inventory: a screenshot of every page, sheet, view and state in every look, Glass theme and screen size.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] node scripts/tests/inventory.mjs [outdir] [filter]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, [OUT = path.join(ROOT, 'preview/shots/inventory'), FILTER = ''] = process.argv.slice(2), PREV = path.join(ROOT, 'preview');
const PORT = Number(process.env.PORT || 4795);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const LOOKS = [['glass', 'look=glass&theme=sea'], ['fridge', 'look=fridge'], ['orbit', 'look=orbit']];
const THEMES = ['sunset', 'reef', 'bush', 'space'].map((t) => ['glass-' + t, 'look=glass&theme=' + t]);
const ALL = [
  ['planner-week', 'page=planner'], ['planner-day', 'page=planner&view=day'], ['planner-month', 'page=planner&view=month'],
  ['sheet-add', 'page=planner&sheet=add'], ['sheet-sitter', 'page=planner&sheet=sitter'], ['sheet-meds', 'page=planner&sheet=meds'], ['sheet-timer', 'page=planner&sheet=timer'], ['sheet-themes', 'page=planner&sheet=themes'],
  ['kid0', 'page=kid&kid=0'], ['kid1', 'page=kid&kid=1'], ['kid2', 'page=kid&kid=2'], ['kid0-studio', 'page=kid&kid=0&studio=1'],
  ['groceries', 'page=groceries'], ['groceries-long', 'page=groceries&long=1'], ['doodle', 'page=doodle'],
  ...['house', 'scene', 'dial', 'desk', 'cables', 'list'].map((v) => ['music-' + v, 'page=music&mview=' + v]),
  ['music-shelves', 'page=music&mtab=shelves'], ['music-juke', 'page=music&mtab=juke&juke=1'], ['music-radio', 'page=music&mtab=radio'], ['music-search', 'page=music&mtab=search&find=blu'], ['music-call', 'page=music&mtab=call'],
  ['music-offline', 'page=music&mview=house&moff=kitchen,office'], ['music-moments', 'page=music&mview=desk&moments=1'],
  ['weather', 'page=weather'], ['weather-rain', 'page=weather&wx=rain'], ['weather-nobom', 'page=weather&bom=0'], ['planner-rain', 'page=planner&wx=rain'],
  ['home', 'page=home'], ['morning', 'page=morning', '07:10'], ['night', 'page=planner&night=1', '22:30'], ['planner-calm', 'page=planner&calm=1'],
  ['planner-bedtime', 'page=planner', '19:45'], ['kid2-bedtime', 'page=kid&kid=2', '19:45'], ['music-house-quiet', 'page=music&mview=house', '20:30'], ['music-scene-quiet', 'page=music&mview=scene', '20:30'], ['music-call-quiet', 'page=music&mtab=call', '20:30'], ['planner-morning', 'page=planner', '06:45'],
  ['planner-many', 'page=planner&events=many'], ['planner-day-many', 'page=planner&view=day&events=many'], ['planner-month-many', 'page=planner&view=month&events=many'], ['planner-long', 'page=planner&events=long'], ['planner-none', 'page=planner&events=none&empty=1'], ['groceries-empty', 'page=groceries&empty=1'],
];
const CORE = ['planner-week', 'sheet-add', 'kid0', 'kid2', 'groceries', 'music-house', 'music-scene', 'weather-rain', 'home', 'sheet-meds', 'sheet-sitter'];
const SIZES = [['wall', 1920, 1080], ['ha', 1312, 668], ['tall', 820, 1180], ['phone', 390, 844]];
const jobs = [];
for (const [ln, lq] of LOOKS) for (const [n, q, t] of ALL) jobs.push({ f: `${ln}/${n}`, q: `${lq}&${q}`, t, w: 1280, h: 800 });
for (const [ln, lq] of THEMES) for (const [n, q, t] of ALL.filter((a) => CORE.includes(a[0]) || /music-(dial|desk|cables)|doodle|kid1/.test(a[0]))) jobs.push({ f: `${ln}/${n}`, q: `${lq}&${q}`, t, w: 1280, h: 800 });
for (const [sn, w, h] of SIZES) for (const [ln, lq] of LOOKS) for (const [n, q, t] of ALL.filter((a) => CORE.includes(a[0]))) jobs.push({ f: `${sn}-${ln}/${n}`, q: `${lq}&${q}`, t, w, h });
const todo = jobs.filter((j) => j.f.includes(FILTER));
console.log(todo.length, 'shots');
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = [];
async function one(j) {
  const ctx = await browser.newContext({ viewport: { width: j.w, height: j.h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: j.w < 500, isMobile: j.w < 500 });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(j.f + ' ERR ' + String(e).slice(0, 200)));
  await page.clock.setFixedTime(new Date(`2026-11-10T${j.t || '16:20'}:00+08:00`));
  try { await page.goto(`http://localhost:${PORT}/?${j.q}`); await page.waitForFunction('window.__ready === true', null, { timeout: 15000 }); await page.waitForTimeout(1800);
    const file = path.join(OUT, j.f + '.png'); fs.mkdirSync(path.dirname(file), { recursive: true }); await page.screenshot({ path: file }); }
  catch (e) { errs.push(j.f + ' FAIL ' + String(e).slice(0, 160)); }
  await ctx.close();
}
let i = 0; await Promise.all(Array.from({ length: 6 }, async () => { while (i < todo.length) await one(todo[i++]); }));
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(jobs, null, 1));
console.log(errs.join('\n') || 'no page errors'); await browser.close(); srv.close();
