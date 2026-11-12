// Fit audit: every page at several screen sizes; reports anything that scrolls, clips or sits off-screen,
// and (CHECKS=text,ring,contrast,target; all on by default, CHECKS=fit for the old behaviour) cut-off text, outlines and focus rings
// that an overflow would clip, text under WCAG AA contrast measured from the painted pixels, and touch targets under 44 px.
// TIME=HH:MM sets the clock; THEME= picks a Glass theme; MAX= caps the lines printed per check (default 8).
// Usage: npm run build && PLAYWRIGHT=<path to playwright index.mjs> [CHROME=<chrome binary>] [VP=name:WxH,…] [PAGES=…] [LOOK=glass|fridge|orbit|sports] [SHOT=1] node scripts/tests/audit.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(4781);
const VP = (process.env.VP || 'wall:1920x1080,laptop-in-HA:1312x668,design:1280x800,ipad-air:1180x820,ipad-old:1024x768,ipad-portrait:820x1180,phone:390x844').split(',').map((s) => { const [n, d] = s.split(':'); const [w, h] = d.split('x').map(Number); return { n, w, h }; });
const PAGES = (process.env.PAGES || 'planner,planner&view=day,planner&view=month,kid&kid=0,kid&kid=1,kid&kid=2,groceries,doodle,music,home,planner&sheet=add,planner&sheet=themes').split(',');
const CHECKS = (process.env.CHECKS || 'fit,text,ring,contrast,target').split(','), MAX = Number(process.env.MAX || 8), totals = {};
const deep = await import('./deep.mjs');
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
for (const v of VP) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, timezoneId: 'Australia/Perth', locale: 'en-AU' });
  console.log(`\n=== ${v.n} ${v.w}x${v.h}`);
  for (const pg of PAGES) {
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date(`2026-11-10T${process.env.TIME || '16:20'}:00+08:00`));
    await page.goto(`http://localhost:4781/?look=${process.env.LOOK || 'glass'}${process.env.THEME ? '&theme=' + process.env.THEME : ''}&page=${pg}`); await page.waitForFunction('window.__ready === true').catch(() => {}); await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const out = [], card = document.querySelector('family-hub-card'), fh = card.shadowRoot.querySelector('.fh');
      const z = Number(getComputedStyle(fh).zoom) || 1;
      const name = (e) => { const host = e.getRootNode().host; return (host ? host.tagName.toLowerCase().replace('family-hub-card', 'card') + ' ' : '') + '.' + String(e.className).trim().split(/\s+/).filter((c) => !['glass', 'tap', 'fade', 'scrolly', 'card'].includes(c)).slice(0, 2).join('.'); };
      const walk = (root) => { root.querySelectorAll('*').forEach((e) => {
        const cs = getComputedStyle(e);
        const sy = e.scrollHeight - e.clientHeight, sx = e.scrollWidth - e.clientWidth;
        if (/(auto|scroll)/.test(cs.overflowY) && sy > 6) out.push(`${name(e)} scrolls down ${sy}px`);
        if (/(auto|scroll)/.test(cs.overflowX) && sx > 6 && !/(auto|scroll)/.test(cs.overflowY) ) out.push(`${name(e)} scrolls sideways ${sx}px`);
        else if (/(auto|scroll)/.test(cs.overflowX) && sx > 6) out.push(`${name(e)} scrolls sideways ${sx}px`);
        if (/(hidden|clip)/.test(cs.overflowY) && sy > 8 && e.clientHeight > 30 && !e.matches('.fh,.ell,.evs,.col,.cell,.capsule,.mev,.n,.content')) out.push(`${name(e)} CLIPS ${sy}px`);
        if (e.shadowRoot) walk(e.shadowRoot); }); };
      walk(card.shadowRoot);
      const fr = fh.getBoundingClientRect();
      const body = fh.scrollHeight - fh.clientHeight;
      // anything sticking out past the right or bottom edge of the panel
      let off = 0; const edge = (root) => root.querySelectorAll('button,.glass').forEach((e) => { const b = e.getBoundingClientRect(); if (b.width && (b.right > innerWidth + 2 || b.bottom > innerHeight + 2)) off++; if (e.shadowRoot) edge(e.shadowRoot); });
      edge(card.shadowRoot); card.shadowRoot.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) edge(e.shadowRoot); });
      return { z, panel: Math.round(fr.width) + 'x' + Math.round(fr.height), inner: body > 6 ? `panel content taller than screen by ${body}px` : '', off, out: [...new Set(out)] };
    });
    console.log(`${pg.padEnd(22)} zoom ${r.z.toFixed(2)}  ${[r.inner, r.off ? `${r.off} controls off-screen` : '', ...r.out].filter(Boolean).join(' | ') || 'fits'}`);
    for (const [k, lines] of Object.entries(await deep.run(page, CHECKS))) { totals[k] = (totals[k] || 0) + lines.length; if (lines.length) console.log(`    ${k} (${lines.length}): ` + lines.slice(0, MAX).join('\n      ') + (lines.length > MAX ? `\n      … and ${lines.length - MAX} more` : '')); }
    if (process.env.SHOT) await page.screenshot({ path: path.join(PREV, 'shots', `au-${v.n}-${pg.replace(/[^a-z0-9]+/gi, '_')}.png`) });
    await page.close();
  }
  await ctx.close();
}
console.log('\nTotals: ' + (Object.entries(totals).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'));
await browser.close(); srv.close();
