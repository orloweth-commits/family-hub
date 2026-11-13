// Home Ground (the Sports look): the moving world, the scheduler and the sounds. Run after `npm run build`.
//   PLAYWRIGHT=… CHROME=… [PORT=4787] node scripts/tests/sports.mjs        exits 1 if anything fails
// The world is forced with the preview's `&scene=sports`, so this runs whether or not the look itself is chosen.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview'), PORT = Number(process.env.PORT || 4787);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let fails = 0;
const ok = (cond, what, detail = '') => { if (!cond) fails++; console.log(`${cond ? 'ok  ' : 'FAIL'} ${what}${detail ? ' – ' + detail : ''}`); };
/** a page at a size and a time of day; `clock: 'run'` installs a clock the test can wind on, `init` runs before the card loads */
const open = async (qs, { w = 1280, h = 800, time = '16:20', day = '2026-11-10', clock = 'fixed', init } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: w < 500, isMobile: w < 500 });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(String(e)));
  const at = new Date(`${day}T${time}:00+08:00`);
  if (clock === 'run') await page.clock.install({ time: at }); else await page.clock.setFixedTime(at);
  if (init) await page.addInitScript(init);
  await page.goto(`http://localhost:${PORT}/?${qs}`); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(500); return page;
};
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, run = (k) => !ONLY || ONLY.includes(k);
const BALLS = ['soccer', 'punt', 'torpedo', 'rally', 'skim', 'floorball'], SURPRISES = ['flagknock', 'gull', 'sprinkler', 'marker', 'dog'];

/** in the page: show one visitor through `demo`, then report what animates and where it is at ten moments */
const fly = (page, id) => page.evaluate(async (id) => {
  const c = document.querySelector('family-hub-card').shadowRoot, ambs = [...c.querySelectorAll('fh-ambient')], box = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
  /* what a drawing really covers: its shapes, not the 1 px svg they overflow */
  const drawn = (svg) => [...svg.querySelectorAll('path, circle, ellipse, rect')].map(box).filter((r) => r[2] > r[0] || r[3] > r[1]).reduce((a, r) => [Math.min(a[0], r[0]), Math.min(a[1], r[1]), Math.max(a[2], r[2]), Math.max(a[3], r[3])], [1e9, 1e9, -1e9, -1e9]);
  for (const a of ambs) a.demo = ''; await Promise.all(ambs.map((a) => a.updateComplete));
  for (const a of ambs) a.demo = id; await Promise.all(ambs.map((a) => a.updateComplete));
  const guests = ambs.flatMap((a) => [...a.shadowRoot.querySelectorAll('.guest')]); if (!guests.length) return { guests: 0 };
  const g = guests[0], root = g.getRootNode(), ms = parseFloat(g.style.getPropertyValue('--t')), anims = root.getAnimations();
  const props = [...new Set(anims.flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))))].filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k));
  const clock = box(c.querySelector('header .clock')), buttons = [...c.querySelectorAll('nav button, nav a')].map(box), hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  let overClock = 0, overDock = 0, seen = 0; const W = innerWidth, H = innerHeight;
  for (let i = 0; i < 10; i++) {
    for (const a of anims) { a.pause(); a.currentTime = Math.min(ms * (i + 0.5) / 10, a.effect.getComputedTiming().endTime - 1); }
    for (const e of g.querySelectorAll('.gd-b svg, .gd-p svg')) { const r = drawn(e); if (r[2] > 0 && r[0] < W && r[3] > 0 && r[1] < H) seen++; if (hit(r, clock)) overClock++; if (buttons.some((b) => hit(r, b))) overDock++; }
  }
  const out = { guests: guests.length, front: root.host.front, masked: !!g.closest('.keep'), lane: !!g.closest('.lane'), anims: anims.length, props, overClock, overDock, seen, ms, buttons: buttons.length };
  for (const a of anims) a.cancel(); for (const a of ambs) a.demo = ''; return out;
}, id);
const guests = (page) => page.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('fh-ambient')].flatMap((a) => [...a.shadowRoot.querySelectorAll('.guest')].map((g) => g.dataset.kind)));

// 1. every visitor, at three sizes: transform and opacity only, clear of the clock and of the dock's buttons
if (run('fly')) for (const [w, h] of [[1280, 800], [1920, 1080], [1312, 668], [1024, 768]]) {
  const page = await open('look=glass&scene=sports&page=planner', { w, h });
  for (const id of [...BALLS, ...SURPRISES]) {
    const r = await fly(page, id), only = r.guests === 1 && r.props.every((p) => p === 'transform' || p === 'opacity');
    ok(only && r.anims > 0 && r.overClock === 0 && (r.front ? r.overDock === 0 && r.lane : r.masked) && r.seen > 0, `${w}x${h} ${id}`, JSON.stringify(r));
  }
  await page.close();
}

// 2. one at a time: a second visitor (on the other layer) takes the first one's place
if (run('one')) { const page = await open('look=glass&scene=sports&page=planner');
  const n = await page.evaluate(async () => { const ambs = [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('fh-ambient')], out = [];
    for (const id of ['soccer', 'rally', 'floorball', 'skim', 'dog', 'punt']) { for (const a of ambs) a.demo = ''; await Promise.all(ambs.map((a) => a.updateComplete)); for (const a of ambs) a.demo = id; await Promise.all(ambs.map((a) => a.updateComplete)); await new Promise((r) => setTimeout(r, 60));
      out.push(ambs.reduce((k, a) => k + a.shadowRoot.querySelectorAll('.guest').length, 0)); } return out; });
  ok(n.every((x) => x === 1), 'one visitor at a time when fired back to back', n.join(' '));
  // 3. hold (a sheet, the night screen, an alarm) sends the ball away and lets none start
  const held = await page.evaluate(async () => { const ambs = [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('fh-ambient')], count = () => ambs.reduce((k, a) => k + a.shadowRoot.querySelectorAll('.guest').length, 0);
    for (const a of ambs) a.demo = ''; await Promise.all(ambs.map((a) => a.updateComplete)); for (const a of ambs) a.demo = 'floorball'; await Promise.all(ambs.map((a) => a.updateComplete)); const before = count();
    for (const a of ambs) a.hold = true; await new Promise((r) => setTimeout(r, 400)); const after = count();
    for (const a of ambs) a.demo = ''; await Promise.all(ambs.map((a) => a.updateComplete)); for (const a of ambs) a.demo = 'soccer'; await Promise.all(ambs.map((a) => a.updateComplete)); const refused = count();
    for (const a of ambs) { a.hold = false; a.demo = ''; } return { before, after, refused }; });
  ok(held.before === 1 && held.after === 0 && held.refused === 0, 'hold clears a ball and refuses the next', JSON.stringify(held));
  // the card itself holds while a sheet is open
  await page.evaluate(() => { document.querySelector('family-hub-card')._sheet = 'themes'; }); await page.waitForTimeout(300);
  const card = await page.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('fh-ambient')].map((a) => a.hold));
  ok(card.length === 2 && card.every(Boolean), 'the card sets hold on both layers while a sheet is open', card.join(' '));
  await page.close(); }

// 4. calm mode: the still ground stays, nothing comes, nothing runs
if (run('one')) { const page = await open('look=glass&scene=sports&page=planner&calm=1');
  for (const id of BALLS) await fly(page, id);
  const r = await page.evaluate(() => { const ambs = [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('fh-ambient')]; return { guests: ambs.reduce((k, a) => k + a.shadowRoot.querySelectorAll('.guest').length, 0), running: ambs.reduce((k, a) => k + a.shadowRoot.getAnimations().length, 0), world: !!ambs[0].shadowRoot.querySelector('.gd-world svg') }; });
  ok(r.guests === 0 && r.running === 0 && r.world, 'calm=1: no visitors, no running animations, the ground still drawn', JSON.stringify(r));
  await page.close(); }

// 5. the scheduler over twenty minutes of wound-on time: never two at once, never the same ball twice running, gaps of 20 s or more, gone when the tab is hidden
if (run('plan')) { const page = await open('look=glass&scene=sports&page=planner', { clock: 'run' });
  const seen = []; let most = 0, last = '', quiet = 0, gaps = [];
  for (let s = 0; s < 1200; s++) { await page.clock.runFor(1000); const g = await guests(page); most = Math.max(most, g.length); if (g.length) { if (g[0] !== last) { seen.push(g[0]); if (last === '' && seen.length > 1) gaps.push(quiet); } last = g[0]; quiet = 0; } else { last = ''; quiet++; } }
  const repeat = seen.some((x, i) => i && x === seen[i - 1]);
  ok(most === 1 && seen.length >= 8 && !repeat && Math.min(...gaps) >= 19 && Math.max(...gaps) <= 92, 'scheduler: one at a time, no ball twice running, quiet gaps of 20 to 90 s', `${seen.length} visits (${[...new Set(seen)].join(' ')}); gaps ${Math.min(...gaps)}–${Math.max(...gaps)} s; most at once ${most}`);
  const odd = seen.filter((x) => !BALLS.includes(x));
  ok(odd.every((x) => x === 'flagknock') && odd.length <= 1, 'no surprise outside its window (Tuesday 4.20 pm: only the corner flag may come, once an hour)', odd.join(' '));
  await page.evaluate(async () => { const ambs = [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('fh-ambient')]; for (const a of ambs) a.demo = 'floorball'; await Promise.all(ambs.map((a) => a.updateComplete)); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); await Promise.all(ambs.map((a) => a.updateComplete)); });
  let hidden = (await guests(page)).length; for (let s = 0; s < 200; s++) { await page.clock.runFor(1000); hidden += (await guests(page)).length; }
  ok(hidden === 0, 'tab hidden: the ball goes and none comes for 200 s');
  await page.close(); }

// 6. surprises keep to their windows and limits: Saturday from 3.50 pm for three hours of wound-on time
if (run('plan')) { const page = await open('look=glass&scene=sports&page=planner', { clock: 'run', time: '15:50', day: '2026-11-14' });
  const at = []; let was = '';
  for (let s = 0; s < 3 * 1800; s++) { await page.clock.runFor(2000); const g = (await guests(page))[0] ?? ''; if (g && g !== was && SURPRISES.concat('sprinkler-pm').includes(g)) at.push([g, 15 * 60 + 50 + Math.round((s * 2) / 60)]); was = g; }
  const names = at.map((x) => x[0]), close = at.some((x, i) => i && x[1] - at[i - 1][1] < 10);
  ok(at.length >= 1 && names.filter((n) => n === 'dog').length <= 1 && at.length <= 6 && !close && at.every((x) => x[1] < 18 * 60 + 31) && !names.includes('gull') && !names.includes('marker'), 'surprises: each at most once a day, ten minutes apart, none after 6.30 pm', at.map((x) => `${x[0]}@${Math.floor(x[1] / 60)}:${String(x[1] % 60).padStart(2, '0')}`).join(' ') || 'none came');
  await page.close(); }

// 7. the other worlds are as they were: their visitors come through the masks, and hold does not touch them
if (run('others')) for (const [qs, id] of [['look=fridge&page=planner&guest=ants', 'ants'], ['look=orbit&page=planner&guest=saucer', 'saucer'], ['look=glass&theme=sea&page=planner&guest=gulls', 'gulls'], ['look=glass&theme=space&page=planner&guest=shoot', 'shoot']]) {
  const page = await open(qs);
  const r = await page.evaluate(async () => { const ambs = [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('fh-ambient')], g = () => ambs.flatMap((a) => [...a.shadowRoot.querySelectorAll('.cast > .keep > .guest')].map((x) => x.dataset.kind + (x.getAttribute('style').includes('--aw') ? '!' : '')));
    const before = g(); for (const a of ambs) a.hold = true; await new Promise((r) => setTimeout(r, 400)); return { before, after: g() }; });
  ok(r.before.join() === id && r.after.join() === id, `${qs.split('&page')[0]}: ${id} comes as before and stays through hold`, JSON.stringify(r));
  await page.close();
}

// ---- sounds: a pretend AudioContext that writes down every node ----
const STUB = () => {
  const log = (window.__audio = []); let now = 0;
  const param = (v) => ({ value: v, events: [], setValueAtTime(x, t) { this.events.push([t, x]); }, exponentialRampToValueAtTime(x, t) { this.events.push([t, x]); }, linearRampToValueAtTime(x, t) { this.events.push([t, x]); } });
  const node = (kind, more = {}) => { const n = { kind, to: [], connect(d) { this.to.push(d.kind ?? 'param'); if (d.kind && this.kind !== 'gain') d.fed = (d.fed ?? 0) + 1; return d; }, start(t) { this.t0 = t; }, stop(t) { this.t1 = t; }, ...more }; log.push(n); return n; };
  window.AudioContext = class { get currentTime() { return now; } get sampleRate() { return 48000; } state = 'running'; destination = { kind: 'out' }; resume() {}
    createOscillator() { return node('osc', { type: 'sine', frequency: param(440) }); } createGain() { return node('gain', { gain: param(1) }); }
    createBiquadFilter() { return node('filter', { type: 'lowpass', frequency: param(350), Q: param(1) }); } createBufferSource() { return node('noise', { buffer: null, loop: false }); }
    createBuffer(ch, len, rate) { (window.__buffers ??= []).push(len / rate); return { sampleRate: rate, length: len, getChannelData: () => new Float32Array(len) }; } };
  window.webkitAudioContext = window.AudioContext;
};
/** in the page: play one sound and sum up what was built */
const play = (page, s) => page.evaluate((s) => { window.__audio.length = 0; window.fhSfx(s); const L = window.__audio, src = L.filter((n) => n.kind === 'osc' || n.kind === 'noise'), gains = L.filter((n) => n.kind === 'gain' && n.to.includes('out') || (n.kind === 'gain' && n.to.includes('filter')));
  const peak = (g) => Math.max(0, ...g.gain.events.map((e) => e[1])) * Math.max(1, g.fed ?? 1), spans = gains.map((g) => { const ev = g.gain.events; return [ev[0]?.[0] ?? 0, ev[ev.length - 1]?.[0] ?? 0, peak(g)]; });
  const loud = Math.max(0, ...spans.map(([a]) => spans.filter(([b, c]) => b <= a + 0.001 && c > a + 0.001).reduce((n, x) => n + x[2], 0)));
  return { nodes: L.length, osc: L.filter((n) => n.kind === 'osc').map((o) => `${o.type}:${o.frequency.events[0]?.[1] ?? o.frequency.value}`), noise: L.filter((n) => n.kind === 'noise').length, filters: L.filter((n) => n.kind === 'filter').map((f) => `${f.type}:${f.frequency.events[0]?.[1] ?? f.frequency.value}`), end: Math.max(0, ...src.map((n) => n.t1 ?? 0)), longest: Math.max(0, ...src.map((n) => (n.t1 ?? 0) - (n.t0 ?? 0))), loud: +loud.toFixed(3), buffers: window.__buffers ?? [] }; }, s);
const SOUNDS = ['tap', 'tick', 'untick', 'done', 'unlock', 'locked', 'coin', 'jar', 'alarm'], PLAIN = { tap: 0.08, tick: 0.14, untick: 0.08, done: 0.13, unlock: 0.12, locked: 0.06, coin: 0.06, jar: 0.12, alarm: 0.12 };
// what the plain look builds today (from src/util.ts as it was before the Sports forms): oscillators only
const WAS = { tap: ['triangle:660'], tick: ['triangle:880', 'triangle:1320'], untick: ['sine:520'], coin: ['square:988', 'square:1319'], locked: ['sawtooth:180'], jar: ['sine:1200', 'sine:1600', 'sine:2100'], done: ['triangle:523', 'triangle:659', 'triangle:784', 'triangle:1047'],
  unlock: ['triangle:392', 'triangle:523', 'triangle:659', 'triangle:784', 'triangle:1047', 'triangle:1319', 'sine:1568'], alarm: Array.from({ length: 6 }, () => ['square:1046', 'square:1318']).flat(), clarinet: ['square:587', 'square:698', 'square:880'], trumpet: ['sawtooth:523', 'sawtooth:523', 'sawtooth:784'], roar: ['sawtooth:140', 'square:210'] };

// 8. Sports sounds by day: each builds nodes, is done within a second (the alarm: each whistle), and is no louder than the plain one
if (run('sound')) { const page = await open('look=glass&scene=sports&page=planner', { init: STUB });
  for (const s of SOUNDS) { const r = await play(page, s), short = s === 'alarm' ? r.longest < 1 && r.end < 3.2 : r.end < 1;
    ok(r.nodes > 0 && short && r.loud <= PLAIN[s] + 1e-6 && JSON.stringify(r.osc) !== JSON.stringify(WAS[s]), `sound ${s}`, `${r.nodes} nodes, ${r.osc.length} osc, ${r.noise} noise, ends ${r.end.toFixed(2)} s, peak ${r.loud} (plain ${PLAIN[s]})`); }
  for (const s of ['clarinet', 'trumpet', 'roar']) { const r = await play(page, s); ok(JSON.stringify(r.osc) === JSON.stringify(WAS[s]) && !r.noise, `sound ${s} is left as it is`, r.osc.join(' ')); }
  const b = (await play(page, 'tap')).buffers; ok(b.length === 1 && Math.abs(b[0] - 0.2) < 1e-6, 'one shared 0.2 s noise buffer', b.join(' '));
  await page.close(); }
// 9. quiet hours (9 pm): everything silent but the alarm, which whistles once, at 60%, through a low-pass
if (run('sound')) { const page = await open('look=glass&scene=sports&page=planner&night=0', { init: STUB, time: '20:40' });
  await page.waitForTimeout(1500); // the card looks at the clock once a second
  const made = []; for (const s of SOUNDS.filter((x) => x !== 'alarm')) made.push((await play(page, s)).nodes);
  const a = await play(page, 'alarm');
  ok(made.every((n) => n === 0), 'quiet hours: no Sports sound but the alarm', made.join(' '));
  ok(a.osc.filter((o) => o.startsWith('sine:23')).length === 2 && Math.abs(a.loud - 0.06) < 1e-6 && a.filters.join() === 'lowpass:2500' && a.osc.length === 3 && a.end < 1, 'quiet hours: the alarm once, at 60%, through a 2.5 kHz low-pass', JSON.stringify(a));
  await page.close(); }
// 10. the other looks sound exactly as before, by day and in quiet hours
if (run('sound')) { const page = await open('look=fridge&page=planner', { init: STUB });
  const diff = []; for (const s of Object.keys(WAS)) { const r = await play(page, s); if (JSON.stringify(r.osc) !== JSON.stringify(WAS[s]) || r.noise || r.filters.length || r.nodes !== 2 * WAS[s].length) diff.push(s); }
  ok(!diff.length, 'Fridge: all twelve sounds build the same oscillators as before', diff.join(' '));
  await page.close();
  const late = await open('look=orbit&page=planner', { init: STUB, time: '20:40' });
  await late.waitForTimeout(1500);
  const n = []; for (const s of Object.keys(WAS)) n.push((await play(late, s)).nodes);
  ok(n.filter(Boolean).length === 1 && (await play(late, 'alarm')).nodes === 24, 'Orbit in quiet hours: only the alarm, as before', n.join(' '));
  await late.close(); }

// 11. round 6 (H1): on tablets the whole touchline is on the screen, by day and with the morning's extra place: every place at least 44 px, no two labels touching
if (run('dock')) for (const [w, h] of [[1024, 768], [768, 1024], [820, 1180], [1180, 820]]) for (const time of ['16:20', '07:10']) { const page = await open('look=sports&page=planner', { w, h, time });
  const r = await page.evaluate(() => { const nav = document.querySelector('family-hub-card').shadowRoot.querySelector('nav.dock'), b = [...nav.querySelectorAll('.item, .cta')].map((e) => { const r = e.getBoundingClientRect(), g = document.createRange(); g.selectNodeContents(e.querySelector('.lb') || e); const t = g.getBoundingClientRect(); return { n: e.textContent.trim(), l: r.left, r: r.right, b: r.bottom, w: r.width, h: r.height, tl: t.left, tr: t.right }; });
    return { n: b.length, off: b.filter((x) => x.l < -0.5 || x.r > innerWidth + 0.5 || x.b > innerHeight + 0.5).map((x) => x.n), small: b.filter((x) => x.w < 43.5 || x.h < 43.5).map((x) => x.n), touch: b.filter((x, i) => i && x.tl < b[i - 1].tr + 1).map((x) => x.n), scrolls: nav.scrollWidth > nav.clientWidth + 1 }; });
  ok(r.n >= (time === '07:10' ? 13 : 12) && !r.off.length && !r.small.length && !r.touch.length && !r.scrolls, `dock ${w}x${h} at ${time}: all ${r.n} places on the screen`, JSON.stringify(r));
  await page.close(); }

console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails || errs.length ? `FAILED: ${fails} check(s)` : 'all passed');
await browser.close(); srv.close();
process.exit(fails || errs.length ? 1 : 0);
