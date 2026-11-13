// Clearance and alignment audit: every look, page and screen size, with ordinary words and with long ones.
//  - TEXT OUT    words that reach past the box that holds them
//  - TIGHT       words closer to the edge of their box than MIN_X / MIN_Y (a card: MIN_CARD)
//  - CLIPPED     words cut off with no "…" to say so
//  - OFF-CENTRE  words meant to sit in the middle of a small box that do not
//  - UNEVEN      things of one kind in one row whose tops or heights differ, or stacked ones whose sides differ
// "…" on purpose (TRUNC) is listed only with SHOW=trunc.
// STRESS=1 gives every name the panel shows a much longer one (children, rewards, events, rooms, songs, reminders).
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [LOOKS=glass,fridge,orbit,sports] [VP=wall:1920x1080,…] [PAGES=…] [STRESS=1] node scripts/tests/clearance.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4779);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const LOOKS = (process.env.LOOKS || 'glass,fridge,orbit,sports').split(',');
const VP = (process.env.VP || 'wall:1920x1080,ipad:1180x820,phone:390x844').split(',').map((s) => { const [n, d] = s.split(':'); const [w, h] = d.split('x').map(Number); return { n, w, h }; });
const PAGES = (process.env.PAGES || ['planner', 'planner&view=day', 'planner&view=month', 'planner&events=many', 'kid&kid=0', 'kid&kid=1', 'kid&kid=2', 'kid&kid=0&studio=1', 'kid&kid=0&painted=1&studio=1', 'kid&kid=2&painted=1',
  'groceries', 'groceries&long=1', 'doodle', 'music', 'music&mview=scene', 'music&mview=dial', 'music&mview=desk', 'music&mview=cables', 'music&mview=list', 'music&mtab=shelves', 'music&mtab=juke&juke=1', 'music&mtab=radio', 'music&mtab=call',
  'weather', 'home', 'morning@07:10', 'planner&sheet=add', 'planner&sheet=themes', 'planner&sheet=meds', 'planner&sheet=sitter', 'planner&sheet=timer', 'planner&sheet=chat', 'planner&sheet=settings&pane=children', 'planner&sheet=settings&pane=house',
  'planner&sheet=settings&pane=pictures&artn=3', 'planner&art=1&artn=3', 'planner&night=1@22:30'].join(',')).split(',');
const STRESS = !!process.env.STRESS, SHOW = (process.env.SHOW || '').split(',');
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const found = new Map(); const errs = [];
for (const look of LOOKS) for (const v of VP) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, timezoneId: 'Australia/Perth', locale: 'en-AU' });
  for (const pg0 of PAGES) {
    const [pg, time = '16:20'] = pg0.split('@');
    const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(`${look} ${v.n} ${pg}: ${e}`));
    await page.clock.setFixedTime(new Date(`2026-11-10T${time}:00+08:00`));
    await page.goto(`http://localhost:${PORT}/?look=${look}&page=${pg}${STRESS ? '&stress=1' : ''}`); await page.waitForFunction('window.__ready === true').catch(() => {}); await page.waitForTimeout(1300);
    await page.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 2500))]));
    const r = await page.evaluate(() => {
      const MIN_X = 4, MIN_Y = 2, MIN_CARD = 6, out = [];
      const card = document.querySelector('family-hub-card');
      const nm = (e) => { const host = e.getRootNode().host; const cls = String(e.className?.baseVal ?? e.className ?? '').trim().split(/\s+/).filter((c) => c && !['glass', 'tap', 'fade', 'scrolly'].includes(c)).slice(0, 3).join('.'); return `${host ? host.localName.replace('family-hub-card', 'card') : ''} ${e.localName}${cls ? '.' + cls : ''}${e.dataset?.act ? `[${e.dataset.act}]` : ''}`; };
      const alpha = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return c && c !== 'transparent' ? 1 : 0; const p = m[1].split(/[,/ ]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };
      const parentOf = (e) => e.parentElement ?? (e.parentNode instanceof ShadowRoot ? e.parentNode.host : e.assignedSlot ?? null);
      const shown = (e) => { for (let x = e; x; x = parentOf(x)) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility !== 'visible' || Number(cs.opacity) < 0.05) return false; } return true; };
      // a box is something painted: a fill, an edge all the way round, or a shadow (a row with only a rule above it is not one)
      const edge = (cs, s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && alpha(cs[`border${s}Color`]) > 0.1;
      const isBox = (e, cs) => !e.matches('h1, h2, h3') && (e.matches('.card, .sheet, input') || alpha(cs.backgroundColor) > 0.06 || cs.backgroundImage !== 'none' || ['Top', 'Right', 'Bottom', 'Left'].every((s) => edge(cs, s)) || (cs.boxShadow !== 'none' && !/^rgba?\([^)]*\) 0px 0px 0px 0px$/.test(cs.boxShadow)));
      /** turned on purpose (a note pinned a little crooked): its outline is not its edge */
      const turned = (e) => { for (let x = e, d = 0; x && d < 4; x = parentOf(x), d++) { const cs = getComputedStyle(x); if ((cs.rotate && cs.rotate !== 'none') || (cs.translate && cs.translate !== 'none') || /matrix\((?!1, 0, 0, 1,)/.test(cs.transform)) return true; } return false; };
      /** the part of a box that can be seen: cut by every scroller and clip above it */
      const clipOf = (e, self = false) => { let r = { l: 0, t: 0, r: innerWidth, b: innerHeight }; for (let x = self ? e : parentOf(e); x; x = parentOf(x)) { const cs = getComputedStyle(x); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) { const b = x.getBoundingClientRect(); r = { l: Math.max(r.l, b.left), t: Math.max(r.t, b.top), r: Math.min(r.r, b.right), b: Math.min(r.b, b.bottom) }; } } return r; };
      const texts = [];
      const walk = (root) => { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n; while ((n = tw.nextNode())) { if (n.nodeType === 1) { if (n.shadowRoot) walk(n.shadowRoot); continue; } if (n.nodeValue.trim().length && n.parentElement && !n.parentElement.closest('svg, style, script, [aria-hidden="true"].ghost')) texts.push(n); } };
      walk(card.shadowRoot);
      const seen = new Set();
      for (const t of texts) {
        const el = t.parentElement; if (!shown(el)) continue;
        const rg = document.createRange(); rg.selectNodeContents(t); const rects = [...rg.getClientRects()].filter((q) => q.width > 0.5 && q.height > 0.5); if (!rects.length) continue;
        // the rectangle of a run of text is the font's full height; the ink of letters and digits sits about an eighth of the font size inside it, top and bottom
        const fs = parseFloat(getComputedStyle(el).fontSize) || 16, ink = /\p{Extended_Pictographic}/u.test(t.nodeValue) ? 0 : fs * 0.12;
        const tr = { l: Math.min(...rects.map((q) => q.left)), t: Math.min(...rects.map((q) => q.top)) + ink, r: Math.max(...rects.map((q) => q.right)), b: Math.max(...rects.map((q) => q.bottom)) - ink };
        const clip = clipOf(el, true);
        // out of sight inside a scroller: it will be measured when it is scrolled to, not now
        if (tr.r < clip.l + 1 || tr.l > clip.r - 1 || tr.b < clip.t + 1 || tr.t > clip.b - 1) continue;
        const word = t.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 26);
        // cut off: with "…" (or a set number of lines) it is TRUNC; with nothing to say so it is CLIPPED. Something that scrolls is neither.
        const full = { l: Math.min(...rects.map((q) => q.left)), r: Math.max(...rects.map((q) => q.right)), t: Math.min(...rects.map((q) => q.top)), b: Math.max(...rects.map((q) => q.bottom)) };
        const overX = Math.max(clip.l - full.l, full.r - clip.r), overY = Math.max(clip.t - (full.t + ink), (full.b - ink) - clip.b);
        if (overX > 2 || overY > 3) {
          let said = false, scrolls = false, by = null;
          for (let x = el; x; x = parentOf(x)) { const cs = getComputedStyle(x); if (cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none')) said = true;
            if (/(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) { const bb = x.getBoundingClientRect(); if (full.r > bb.right + 2 || full.l < bb.left - 2 || full.b - ink > bb.bottom + 3 || full.t + ink < bb.top - 3) { by = x; scrolls = /(auto|scroll)/.test(cs.overflowX + cs.overflowY) || !!x.closest?.('.scrolly'); break; } } }
          if (by && !scrolls && by.getBoundingClientRect().right <= innerWidth + 1) { const k = `${said ? 'TRUNC' : 'CLIPPED'}|${nm(by)}|${word}`; if (!seen.has(k)) { seen.add(k); out.push(k + `|${Math.round(Math.max(overX, overY))}px ${overX > 2 ? 'sideways' : 'down'}`); } }
          if (by) continue;
        }
        // the box that holds it
        let box = null, bcs = null; for (let x = el; x && x !== card; x = parentOf(x)) { const cs = getComputedStyle(x); if (cs.display === 'inline' && !x.matches('button, input')) continue; if (isBox(x, cs) && x.getBoundingClientRect().width > 0) { box = x; bcs = cs; break; } }
        if (!box || turned(box)) continue;
        const b = box.getBoundingClientRect(), big = b.width > 420 || b.height > 220;
        const c = { l: tr.l - b.left, r: b.right - tr.r, t: tr.t - b.top, b: b.bottom - tr.b };
        const vis = { l: Math.max(tr.l, clip.l), r: Math.min(tr.r, clip.r) };
        const round = (n) => Math.round(n * 10) / 10;
        if (Math.min(c.l, c.r) < -1 || Math.min(c.t, c.b) < -3) { const k = `TEXT OUT|${nm(box)}|${word}`; if (!seen.has(k)) { seen.add(k); out.push(k + `|l${round(c.l)} r${round(c.r)} t${round(c.t)} b${round(c.b)}`); } continue; }
        if (vis.r - vis.l < tr.r - tr.l - 1) continue; // partly behind a scroller's edge
        const emoji = /^\p{Extended_Pictographic}/u.test(word);
        const minX = word.length < 2 ? 1.5 : box.matches('.card, .sheet') || big ? MIN_CARD : MIN_X, minY = emoji ? MIN_Y : box.matches('.card, .sheet') || big ? MIN_CARD : MIN_Y;
        // a line of words that fills a wrapping box touches the right edge by nature: only the left and a line that cannot wrap count there
        const oneLine = rects.length === 1;
        const small = b.height < 26; /* a letter in a little round chip: a pixel is its room */
        if (c.l < minX || (oneLine && c.r < minX) || c.t < (small ? 1 : minY) || c.b < (small ? 1 : minY)) { const k = `TIGHT|${nm(box)}|${word}`; if (!seen.has(k)) { seen.add(k); out.push(k + `|l${round(c.l)} r${round(c.r)} t${round(c.t)} b${round(c.b)}`); } }
        // meant to be in the middle
        const only = box.textContent.trim() === t.nodeValue.trim() && !box.querySelector('svg, img, fh-pic, i, input') && box.getAttribute('role') !== 'switch' && getComputedStyle(box, '::before').content === 'none' && getComputedStyle(box, '::after').content === 'none';
        if (only && oneLine && b.width <= 200 && (bcs.textAlign === 'center' || (/flex|grid/.test(bcs.display) && /center/.test(bcs.justifyContent + bcs.justifyItems + bcs.placeItems)))) {
          if (Math.abs(c.l - c.r) > 4 || (/center/.test(bcs.alignItems + bcs.placeItems) && Math.abs(c.t - c.b) > 4)) { const k = `OFF-CENTRE|${nm(box)}|${word}`; if (!seen.has(k)) { seen.add(k); out.push(k + `|l${round(c.l)} r${round(c.r)} t${round(c.t)} b${round(c.b)}`); } } }
      }
      // the kitchen panel is a 24 inch 1920 x 1080 touch screen: 531 mm wide, so one pixel is 0.277 mm. Fingers (a child's included) want 12 mm; words read at arm's length want 4.5 mm.
      if (innerWidth === 1920 && innerHeight === 1080) {
        const MM = 531.4 / 1920, btns = [];
        const each = (root) => root.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) each(e.shadowRoot); if (e.matches('button, [role="button"], [role="switch"], [role="tab"], input, a[href]') && shown(e) && !e.disabled && !e.closest('[inert]')) btns.push(e); });
        each(card.shadowRoot);
        for (const e of btns) { const q = e.getBoundingClientRect(); if (q.width < 2 || q.height < 2) continue; const c2 = clipOf(e); if (q.bottom < c2.t || q.top > c2.b || q.right < c2.l || q.left > c2.r) continue;
          const mm = Math.min(q.width, q.height) * MM; if (mm < 12) out.push(`SMALL|${nm(e)}|${(e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 24)}|${mm.toFixed(1)} mm`); }
        for (const t of texts) { const el = t.parentElement; if (!shown(el) || t.nodeValue.trim().length < 3) continue; const q = el.getBoundingClientRect(); if (!q.width) continue; const c2 = clipOf(el, true); if (q.bottom < c2.t || q.top > c2.b) continue;
          const mm = parseFloat(getComputedStyle(el).fontSize) * (Number(getComputedStyle(card.shadowRoot.querySelector('.fh')).zoom) || 1) * MM; if (mm > 0.5 && mm < 4.4) { const k = `SMALL|${nm(el)}|words`; if (!seen.has(k)) { seen.add(k); out.push(`SMALL|${nm(el)}|${t.nodeValue.trim().slice(0, 24)}|words ${mm.toFixed(1)} mm`); } } }
      }
      // things of one kind, side by side or stacked
      const groups = (root) => { root.querySelectorAll('*').forEach((p) => { if (p.shadowRoot) groups(p.shadowRoot);
        const by = new Map(); /* the Fridge look pins things up by hand, a little unevenly, on purpose; a scene's shelf is a constellation */ if (p.closest('svg') || card.getAttribute('data-look') === 'fridge' || p.matches('.sitems')) return; for (const k of p.children) { const cls = String(k.className?.baseVal ?? k.className ?? '').trim(); if (!cls || !shown(k) || turned(k) || k.matches('[data-next], [data-now], [data-hot], [data-focus], [data-live]') || k.getAnimations().some((a) => a.playState === 'running') || ['true', 'page'].includes(k.getAttribute('aria-pressed') ?? k.getAttribute('aria-selected') ?? k.getAttribute('aria-current') ?? '')) continue; /* the chosen one of a set may stand proud of the rest */ const key = k.localName + '.' + cls.split(/\s+/).filter((c) => !['on', 'done', 'now', 'today', 'hot', 'past', 'next', 'locked', 'shimmer', 'playing', 'sel', 'out'].includes(c)).sort().join('.'); (by.get(key) ?? by.set(key, []).get(key)).push(k); }
        for (const [key, list] of by) { if (list.length < 2 || list.length > 40 || [...p.children].some((k) => k.matches('[data-now], [data-next]'))) continue; const rs = list.map((k) => k.getBoundingClientRect()).filter((q) => q.width > 4 && q.height > 4); if (rs.length < 2) continue;
          const clip = clipOf(list[0]); const inView = rs.filter((q) => q.top >= clip.t - 1 && q.bottom <= clip.b + 1 && q.left >= clip.l - 1 && q.right <= clip.r + 1); if (inView.length < 2) continue;
          // one row: every pair overlaps up and down
          const a = inView[0]; const row = inView.filter((q) => Math.abs((q.top + q.bottom) / 2 - (a.top + a.bottom) / 2) < Math.min(q.height, a.height) / 2);
          if (row.length >= 2 && getComputedStyle(p).alignItems !== 'baseline') { const tops = row.map((q) => q.top), hs = row.map((q) => q.height); const dt = Math.max(...tops) - Math.min(...tops), dh = Math.max(...hs) - Math.min(...hs);
            if (dt > 1.5 && dh < 1.5) out.push(`UNEVEN|${nm(p)} > ${key}|row|tops differ ${Math.round(dt * 10) / 10}px`); }
          const col = inView.filter((q) => q.left < a.right - 2 && q.right > a.left + 2 && q !== a && (q.top >= a.bottom - 1 || q.bottom <= a.top + 1));
          if (col.length >= 1) { const all = [a, ...col], ls = all.map((q) => q.left), ws = all.map((q) => q.width); const dl = Math.max(...ls) - Math.min(...ls), dw = Math.max(...ws) - Math.min(...ws);
            if (dl > 1.5 && dw < 1.5) out.push(`UNEVEN|${nm(p)} > ${key}|column|left edges differ ${Math.round(dl * 10) / 10}px`); } } }); };
      groups(card.shadowRoot);
      return out;
    }).catch((e) => [`ERROR|${String(e).slice(0, 120)}||`]);
    for (const line of r) { const [kind, where, word, detail] = line.split('|'); if (kind === 'TRUNC' && !SHOW.includes('trunc')) continue; const key = `${kind}|${where}`; const f = found.get(key) ?? found.set(key, { kind, where, n: 0, at: new Set(), eg: [] }).get(key); f.n++; f.at.add(`${look}/${v.n}/${pg.split('&sheet=').pop().slice(0, 28)}`); if (f.eg.length < 2) f.eg.push(`"${word}" ${detail}`); }
    await page.close();
  }
  await ctx.close();
}
const order = ['ERROR', 'TEXT OUT', 'CLIPPED', 'TIGHT', 'OFF-CENTRE', 'UNEVEN', 'SMALL', 'TRUNC'];
const list = [...found.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || b.n - a.n);
for (const f of list) console.log(`${f.kind.padEnd(10)} ${f.where}  x${f.n}\n            ${f.eg.join('  ·  ')}\n            ${[...f.at].slice(0, 5).join(', ')}${f.at.size > 5 ? ` … +${f.at.size - 5}` : ''}`);
const tot = {}; for (const f of list) tot[f.kind] = (tot[f.kind] ?? 0) + 1;
console.log(`\n${STRESS ? 'Long words' : 'Ordinary words'}: ${Object.entries(tot).map(([k, n]) => `${k} ${n}`).join(', ') || 'nothing found'}`);
if (errs.length) console.log('page errors:\n - ' + [...new Set(errs)].slice(0, 10).join('\n - '));
await browser.close(); srv.close();
