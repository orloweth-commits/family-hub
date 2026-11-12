// Deeper checks used by audit.mjs: cut-off text, clipped outlines and focus rings, measured contrast, small touch targets.
// run(page, checks) returns { text: [...], ring: [...], contrast: [...], target: [...] } as printable lines.

// Shared helpers, injected into the page once.
const HELPERS = () => {
  if (window.__fhAudit) return;
  const card = document.querySelector('family-hub-card');
  const all = () => { const out = []; const walk = (root) => root.querySelectorAll('*').forEach((e) => { out.push(e); if (e.shadowRoot) walk(e.shadowRoot); }); walk(card.shadowRoot); return out; };
  const up = (e) => e.parentElement || (e.getRootNode() && e.getRootNode().host) || null;
  const name = (e) => { const host = e.getRootNode().host; const cls = String(e.getAttribute('class') || '').trim().split(/\s+/).filter((c) => c && !['glass', 'tap', 'fade', 'scrolly', 'card'].includes(c)).slice(0, 2).join('.');
    return (host ? host.tagName.toLowerCase().replace('family-hub-card', 'card') + ' ' : '') + e.tagName.toLowerCase() + (cls ? '.' + cls : ''); };
  const label = (e) => (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
  const shown = (e) => { for (let x = e; x; x = up(x)) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false; } const b = e.getBoundingClientRect(); return b.width > 0.5 && b.height > 0.5 && b.right > 0 && b.bottom > 0 && b.left < innerWidth && b.top < innerHeight; };
  // The box an ancestor leaves visible: every clipping ancestor's padding box, intersected. scrollers: 'skip' ignores an axis that scrolls.
  const clipBox = (e, scrollers) => { const box = { l: 0, t: 0, r: innerWidth, b: innerHeight, by: {} };
    for (let x = up(e); x; x = up(x)) { const cs = getComputedStyle(e.getRootNode() === x.shadowRoot ? x : x); if (getComputedStyle(e).position === 'fixed') break;
      const b = x.getBoundingClientRect(), bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
      const cx = /(hidden|clip)/.test(cs.overflowX) || (scrollers !== 'skip' && /(auto|scroll)/.test(cs.overflowX)), cy = /(hidden|clip)/.test(cs.overflowY) || (scrollers !== 'skip' && /(auto|scroll)/.test(cs.overflowY));
      if (cx) { if (b.left + bl > box.l) { box.l = b.left + bl; box.by.l = x; } if (b.right - br < box.r) { box.r = b.right - br; box.by.r = x; } }
      if (cy) { if (b.top + bt > box.t) { box.t = b.top + bt; box.by.t = x; } if (b.bottom - bb < box.b) { box.b = b.bottom - bb; box.by.b = x; } }
      if (cs.position === 'fixed') break; }
    return box; };
  const textRect = (e) => { let l = 1e9, t = 1e9, r = -1e9, b = -1e9, any = false; const rg = document.createRange();
    for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { rg.selectNodeContents(n); for (const q of rg.getClientRects()) { if (q.width < 0.5) continue; any = true; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); } }
    return any ? { l, t, r, b } : null; };
  window.__fhAudit = { card, all, up, name, label, shown, clipBox, textRect };
};

const TEXT = () => { const A = window.__fhAudit, out = [];
  for (const e of A.all()) { if (!A.shown(e)) continue; const cs = getComputedStyle(e);
    if (cs.textOverflow === 'ellipsis' && /(hidden|clip)/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 1) { out.push(`${A.name(e)} shortened with "…": "${A.label(e)}"`); continue; }
    if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none' && e.scrollHeight > e.clientHeight + 2) { out.push(`${A.name(e)} cut after ${cs.webkitLineClamp} lines: "${A.label(e)}"`); continue; }
    const tr = A.textRect(e); if (!tr) continue; const box = A.clipBox(e, 'skip');
    const lost = { l: box.l - tr.l, t: box.t - tr.t, r: tr.r - box.r, b: tr.b - box.b }; const worst = Object.entries(lost).sort((a, b) => b[1] - a[1])[0];
    const gone = tr.r <= box.l || tr.l >= box.r || tr.b <= box.t || tr.t >= box.b;
    if (worst[1] > 3 && !gone && box.by[worst[0]] && !box.by[worst[0]].matches('.fh')) out.push(`${A.name(e)} "${A.label(e)}" cut ${Math.round(worst[1])}px at the ${{ l: 'left', t: 'top', r: 'right', b: 'bottom' }[worst[0]]} by ${A.name(box.by[worst[0]])}`); }
  return [...new Set(out)]; };

const RING = () => { const A = window.__fhAudit, now = [], focus = {};
  const sel = 'button,a[href],input,select,textarea,[role=button],[role=tab],[role=switch],[role=slider],[role=checkbox],[tabindex]:not([tabindex="-1"])';
  for (const e of A.all()) { if (!A.shown(e)) continue; const cs = getComputedStyle(e), b = e.getBoundingClientRect(); const box = A.clipBox(e);
    const over = (grow) => Math.max(box.l - (b.left - grow), box.t - (b.top - grow), (b.right + grow) - box.r, (b.bottom + grow) - box.b);
    const inside = b.left >= box.l - 1 && b.top >= box.t - 1 && b.right <= box.r + 1 && b.bottom <= box.b + 1; if (!inside) continue; // already cut: the fit and text checks report that
    let grow = 0; if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) grow = parseFloat(cs.outlineWidth) + Math.max(0, parseFloat(cs.outlineOffset) || 0);
    for (const m of cs.boxShadow.matchAll(/(inset\s+)?rgba?\([^)]*\)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(\s+inset)?/g)) if (!m[1] && !m[6] && Number(m[4]) === 0 && Number(m[5]) > 0 && Number(m[2]) === 0 && Number(m[3]) === 0) grow = Math.max(grow, Number(m[5]));
    if (grow && over(grow) > 1) now.push(`${A.name(e)} "${A.label(e)}" outline cut ${Math.round(over(grow))}px`);
    if (e.matches(sel) && !e.disabled && over(6) > 1.5) { const k = A.name(e); (focus[k] ??= { n: 0, px: 0, eg: A.label(e) }).n++; focus[k].px = Math.max(focus[k].px, Math.round(over(6))); } }
  return [...new Set(now), ...Object.entries(focus).map(([k, v]) => `${k} ×${v.n} (e.g. "${v.eg}") has no room for a focus ring: short by ${v.px}px`)]; };

const TARGET = () => { const A = window.__fhAudit, small = {};
  const sel = 'button,a[href],input:not([type=hidden]),select,[role=button],[role=tab],[role=switch],[role=slider],[role=checkbox]';
  for (const e of A.all()) { if (!e.matches(sel) || !A.shown(e) || e.disabled) continue; const b = e.getBoundingClientRect(); if (Math.min(b.width, b.height) >= 43.5) continue;
    if (e.closest('label') && Math.min(e.closest('label').getBoundingClientRect().width, e.closest('label').getBoundingClientRect().height) >= 43.5) continue;
    const k = A.name(e); (small[k] ??= { n: 0, w: 1e9, h: 1e9, eg: A.label(e) }).n++; small[k].w = Math.min(small[k].w, Math.round(b.width)); small[k].h = Math.min(small[k].h, Math.round(b.height)); }
  return Object.entries(small).map(([k, v]) => `${k} ×${v.n} (e.g. "${v.eg}") is ${v.w}×${v.h}`); };

// Contrast, stage 1: note every piece of text, then make all text see-through so a screenshot shows only what is behind it.
const CONTRAST_COLLECT = () => { const A = window.__fhAudit, items = [];
  for (const e of A.all()) { if (!A.shown(e) || e.closest('svg')) continue; const tr = A.textRect(e); if (!tr) continue; const cs = getComputedStyle(e); if (cs.webkitBackgroundClip === 'text') continue;
    const box = A.clipBox(e, 'skip'); const r = { l: Math.max(tr.l, box.l, 0), t: Math.max(tr.t, box.t, 0), r: Math.min(tr.r, box.r, innerWidth), b: Math.min(tr.b, box.b, innerHeight) }; if (r.r - r.l < 3 || r.b - r.t < 3) continue;
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color ? cs.webkitTextFillColor : cs.color); if (!m) continue;
    let a = m[4] === undefined ? 1 : Number(m[4]); for (let x = e; x; x = A.up(x)) a *= Number(getComputedStyle(x).opacity);
    const z = e.currentCSSZoom || 1, px = parseFloat(cs.fontSize) * z, bold = Number(cs.fontWeight) >= 700;
    items.push({ r, c: [Number(m[1]), Number(m[2]), Number(m[3])], a, px: Math.round(px * 10) / 10, big: px >= 24 || (px >= 18.66 && bold), who: A.name(e), eg: A.label(e) }); }
  const css = '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}::placeholder{color:transparent!important;-webkit-text-fill-color:transparent!important}';
  const roots = [A.card.shadowRoot]; A.all().forEach((e) => { if (e.shadowRoot) roots.push(e.shadowRoot); });
  window.__fhHide = roots.map((root) => { const s = document.createElement('style'); s.textContent = css; root.appendChild(s); return s; });
  return items; };
// Stage 2: read the pixels behind each piece of text and work out the ratio against the worst of them (ignoring the odd 5%).
const CONTRAST_MEASURE = async ({ items, png }) => { window.__fhHide.forEach((s) => s.remove()); delete window.__fhHide;
  const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const k = img.width / innerWidth, lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }, lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const bad = {};
  for (const it of items) { const x = Math.floor(it.r.l * k), y = Math.floor(it.r.t * k), w = Math.max(1, Math.floor((it.r.r - it.r.l) * k)), h = Math.max(1, Math.floor((it.r.b - it.r.t) * k)); const d = g.getImageData(x, y, w, h).data; const rs = []; const step = Math.max(1, Math.floor(Math.sqrt(w * h / 600)));
    for (let j = 0; j < h; j += step) for (let i = 0; i < w; i += step) { const o = (j * w + i) * 4, bg = [d[o], d[o + 1], d[o + 2]], fg = it.c.map((v, n) => v * it.a + bg[n] * (1 - it.a)), a = lum(fg), b = lum(bg); rs.push((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)); }
    rs.sort((a, b) => a - b); const ratio = rs[Math.floor(rs.length * 0.05)], need = it.big ? 3 : 4.5; if (ratio >= need) continue;
    const key = it.who + '|' + it.c.join(',') + '|' + it.px; const e = (bad[key] ??= { n: 0, ratio: 99, it }); e.n++; if (ratio < e.ratio) { e.ratio = ratio; e.it = it; } }
  return Object.values(bad).sort((a, b) => a.ratio - b.ratio).map((e) => `${e.ratio.toFixed(2)}:1 (needs ${e.it.big ? 3 : 4.5}) ${e.it.who} ×${e.n} ${e.it.px}px "${e.it.eg}"`); };

export async function run(page, checks) {
  const out = {}; await page.evaluate(HELPERS);
  if (checks.includes('text')) out.text = await page.evaluate(TEXT);
  if (checks.includes('ring')) out.ring = await page.evaluate(RING);
  if (checks.includes('target')) out.target = await page.evaluate(TARGET);
  if (checks.includes('contrast')) { const items = await page.evaluate(CONTRAST_COLLECT); const png = (await page.screenshot({ animations: 'disabled' })).toString('base64'); out.contrast = await page.evaluate(CONTRAST_MEASURE, { items, png }); }
  return out;
}
