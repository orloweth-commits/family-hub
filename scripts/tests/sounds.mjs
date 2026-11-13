// The interaction sounds (src/sound.ts), measured rather than heard. Run after `npm run build`.
//   PLAYWRIGHT=… CHROME=… [PORT=4793] node scripts/tests/sounds.mjs              exits 1 if anything fails
//   … node scripts/tests/sounds.mjs --calibrate    re-measures every sound before its trim and rewrites src/soundtrim.ts (then build again)
//   VERBOSE=1 prints every palette for every sound; ONLY=measure,rules,page picks sections
// Every palette x every sound is rendered through an OfflineAudioContext by the same build() the panel uses, then measured:
// length, peak, loudest 20 ms, first and last sample, share of energy under 250 Hz, spectral centroid, and how palettes differ.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview'), PORT = Number(process.env.PORT || 4793);
const CAL = process.argv.includes('--calibrate'), VERBOSE = !!process.env.VERBOSE;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const errs = []; let fails = 0;
const ok = (cond, what, detail = '') => { if (!cond) fails++; console.log(`${cond ? 'ok  ' : 'FAIL'} ${what}${detail ? ' – ' + detail : ''}`); };
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, run = (k) => !ONLY || ONLY.includes(k);
const dB = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity), f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '-inf');

/** in the page: render one palette's sounds and measure each */
const MEASURE = async ({ palette, raw }) => {
  const S = window.fhSound, R = 48000, out = {};
  const fft = (re, im) => { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; } }
    for (let len = 2; len <= n; len <<= 1) { const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } };
  for (const e of S.EVENTS) {
    const x = await S.render(palette, e, { raw });
    let peak = 0, end = 0, clip = 0, en = 0, tc = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > peak) peak = a; if (a > 1e-5) end = i; if (a >= 0.999) clip++; en += a * a; tc += a * a * i; }
    // the loudest 20 ms
    const w = R * 0.02, hop = R * 0.005; let rms = 0; for (let s = 0; s + w <= x.length; s += hop) { let q = 0; for (let i = s; i < s + w; i++) q += x[i] * x[i]; rms = Math.max(rms, Math.sqrt(q / w)); }
    let n = 1; while (n < x.length) n <<= 1; const re = new Float64Array(n), im = new Float64Array(n); re.set(x); fft(re, im);
    let all = 0, low = 0, high = 0, msum = 0, mf = 0; for (let k = 1; k < n / 2; k++) { const f = (k * R) / n, p = re[k] * re[k] + im[k] * im[k], m = Math.sqrt(p); all += p; if (f < 250) low += p; if (f > 8000) high += p; msum += m; mf += m * f; }
    // the outline of the sound in 10 ms steps, for telling palettes apart
    const env = []; for (let s = 0; s < x.length; s += R * 0.01) { let q = 0; for (let i = s; i < Math.min(x.length, s + R * 0.01); i++) q += x[i] * x[i]; env.push(Math.sqrt(q)); }
    out[e] = { dur: (end + 1) / R, peak, rms, first: Math.abs(x[0]), lastv: Math.abs(x[x.length - 1]), clip, low: all ? low / all : 0, high: all ? high / all : 0, centroid: msum ? mf / msum : 0, tc: en ? tc / en / R : 0, env, nan: x.some((v) => !Number.isFinite(v)) };
  }
  return out;
};

const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage(); page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(`http://localhost:${PORT}/preview/sounds.html`); await page.waitForFunction('!!window.fhSound', null, { timeout: 15000 });
const meta = await page.evaluate(() => ({ EVENTS: [...window.fhSound.EVENTS], PALETTES: [...window.fhSound.PALETTES], CLASS: window.fhSound.CLASS, LIMITS: window.fhSound.LIMITS }));
const { EVENTS, PALETTES, CLASS, LIMITS } = meta;
const M = {}; for (const p of PALETTES) M[p] = await page.evaluate(MEASURE, { palette: p, raw: CAL });

if (CAL) {
  // each sound is brought to its class's loudness (the loudest 20 ms), and never over its class's peak (half a decibel under)
  const trim = {}; for (const p of PALETTES) trim[p] = EVENTS.map((e) => { const m = M[p][e], L = LIMITS[CLASS[e]]; return +Math.min(10 ** (L.rms / 20) / m.rms, 10 ** ((L.cap - 0.5) / 20) / m.peak).toPrecision(4); });
  fs.writeFileSync(path.join(ROOT, 'src/soundtrim.ts'), `/* Made by \`node scripts/tests/sounds.mjs --calibrate\` (do not edit by hand): the level of every sound, so each sits at its class's loudness.\n * One row per palette, in the order of EVENTS in sound.ts. */\nexport const TRIM: Record<string, number[]> = {\n${PALETTES.map((p) => `  ${p}: [${trim[p].join(', ')}]`).join(',\n')}\n};\n`);
  console.log('src/soundtrim.ts written. Now `npm run build` and run this again without --calibrate.');
  await browser.close(); srv.close(); process.exit(0);
}

// ---- 1. every palette x every sound against its class ----
if (run('measure')) {
  const bad = { dur: [], peak: [], silent: [], clip: [], ends: [], low: [], high: [], centroid: [], nan: [] };
  for (const p of PALETTES) for (const e of EVENTS) { const m = M[p][e], L = LIMITS[CLASS[e]], id = `${p}/${e}`;
    if (m.nan) bad.nan.push(id);
    if (m.dur > L.max + 0.0005) bad.dur.push(`${id} ${(m.dur * 1000).toFixed(0)} ms > ${L.max * 1000}`);
    if (dB(m.peak) > L.cap + 0.05) bad.peak.push(`${id} ${f1(dB(m.peak))} > ${L.cap}`);
    if (dB(m.peak) <= -40) bad.silent.push(`${id} ${f1(dB(m.peak))}`);
    if (m.clip) bad.clip.push(id);
    if (m.first > 1e-3 || m.lastv > 1e-3) bad.ends.push(`${id} ${m.first.toExponential(1)}/${m.lastv.toExponential(1)}`);
    // the boys' own three keep the notes they have always had (the roar is a low growl): reported, not held to the small-speaker band
    if (CLASS[e] !== 'own') { if (m.high >= 0.05) bad.high.push(`${id} ${(m.high * 100).toFixed(1)}%`); if (m.low >= 0.15) bad.low.push(`${id} ${(m.low * 100).toFixed(0)}%`); if (m.centroid < 400 || m.centroid > 6000) bad.centroid.push(`${id} ${m.centroid.toFixed(0)} Hz`); } }
  const n = PALETTES.length * EVENTS.length;
  ok(!bad.nan.length, `${n} sounds render (${PALETTES.length} palettes x ${EVENTS.length} sounds)`, bad.nan.join(' '));
  ok(!bad.dur.length, 'length within the class limit', bad.dur.join('; '));
  const tiny = PALETTES.flatMap((p) => EVENTS.filter((e) => M[p][e].dur < 0.012).map((e) => `${p}/${e} ${(M[p][e].dur * 1000).toFixed(0)} ms`));
  ok(!tiny.length, 'none shorter than 12 ms (a sound, not a speck)', tiny.join('; '));
  ok(!bad.peak.length, 'peak at or under the class cap', bad.peak.join('; '));
  ok(!bad.silent.length, 'none silent (peak above -40 dBFS)', bad.silent.join('; '));
  ok(!bad.clip.length, 'no clipping', bad.clip.join(' '));
  ok(!bad.ends.length, 'first and last sample are zero (no click)', bad.ends.join('; '));
  ok(!bad.low.length, 'under 15% of the energy is below 250 Hz', bad.low.join('; '));
  ok(!bad.high.length, 'under 5% of the energy is above 8 kHz (nothing piercing)', bad.high.join('; '));
  ok(!bad.centroid.length, 'spectral centroid between 400 Hz and 6 kHz', bad.centroid.join('; '));
  // keys are quieter than buttons; done is the longest and brightest of the ordinary sounds; the alarm is the loudest
  const keyOver = PALETTES.filter((p) => ['key', 'space', 'del'].some((k) => M[p][k].rms >= M[p].tap.rms || M[p][k].peak >= M[p].tap.peak));
  ok(!keyOver.length, 'keys are quieter than buttons in every palette', keyOver.join(' '));
  const ordinary = EVENTS.filter((e) => !['own', 'alarm', 'done'].includes(CLASS[e]));
  const doneShort = PALETTES.filter((p) => ordinary.some((e) => M[p][e].dur >= M[p].done.dur || M[p][e].rms >= M[p].done.rms));
  ok(!doneShort.length, '"done" is longer and louder than every ordinary sound in its palette', doneShort.join(' '));
  const alarmSoft = PALETTES.filter((p) => EVENTS.some((e) => e !== 'alarm' && M[p][e].rms >= M[p].alarm.rms));
  ok(!alarmSoft.length, 'the alarm is the loudest sound in every palette', alarmSoft.join(' '));
  // the grammar: tick rises and untick falls (the pitch of the second half against the first)
  const half = await page.evaluate(async ({ PALETTES }) => { const S = window.fhSound, out = {};
    // the pitch of each half: zero crossings per second, halved
    const zc = (x, a, b) => { let n = 0; for (let i = a + 1; i < b; i++) if ((x[i - 1] < 0) !== (x[i] < 0)) n++; return n / ((b - a) / 48000) / 2; };
    for (const p of PALETTES) { out[p] = {}; for (const e of ['tick', 'untick', 'listen', 'heard']) { const x = await S.render(p, e); let end = 0; for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > 1e-5) end = i; const mid = end >> 1; out[p][e] = [Math.round(zc(x, 0, mid)), Math.round(zc(x, mid, end))]; } } return out; }, { PALETTES });
  const wrong = PALETTES.filter((p) => !(half[p].tick[1] > half[p].tick[0] && half[p].untick[1] < half[p].untick[0] && half[p].listen[1] > half[p].listen[0] && half[p].heard[1] < half[p].heard[0]));
  ok(!wrong.length, 'grammar: tick and "listening" rise, untick and "stopped listening" fall, in every palette (pitch of the second half against the first)', wrong.map((p) => `${p} ${JSON.stringify(half[p])}`).join(' '));

  // palettes differ: for the same sound, every pair of palettes is apart in pitch colour (centroid), in length, or in outline
  const LOOK = EVENTS.filter((e) => !['own'].includes(CLASS[e]) && !['sleeve', 'needle', 'slot', 'tune', 'static', 'pad', 'stamp', 'rub', 'stick'].includes(e));
  const outline = (a, b) => { const n = Math.max(a.length, b.length); let ab = 0, aa = 0, bb = 0; for (let i = 0; i < n; i++) { const x = a[i] ?? 0, y = b[i] ?? 0; ab += x * y; aa += x * x; bb += y * y; } return aa && bb ? ab / Math.sqrt(aa * bb) : 0; };
  const same = []; let closest = { d: 9, id: '' };
  for (const e of LOOK) for (let i = 0; i < PALETTES.length; i++) for (let j = i + 1; j < PALETTES.length; j++) { const a = M[PALETTES[i]][e], b = M[PALETTES[j]][e];
    const cent = Math.abs(Math.log2(a.centroid / b.centroid)), len = Math.abs(Math.log2(a.dur / b.dur)), shape = 1 - outline(a.env, b.env);
    const apart = cent > 0.12 || len > 0.2 || shape > 0.1, d = Math.max(cent / 0.12, len / 0.2, shape / 0.1);
    if (d < closest.d) closest = { d, id: `${e}: ${PALETTES[i]} / ${PALETTES[j]} (centroid ${a.centroid.toFixed(0)} against ${b.centroid.toFixed(0)} Hz, ${(a.dur * 1000).toFixed(0)} against ${(b.dur * 1000).toFixed(0)} ms, outline ${(1 - shape).toFixed(2)} alike)` };
    if (!apart) same.push(`${e}: ${PALETTES[i]}=${PALETTES[j]}`); }
  ok(!same.length, `palettes differ: ${LOOK.length} sounds x ${(PALETTES.length * (PALETTES.length - 1)) / 2} pairs, each apart by centroid (over 8.7%), length (over 15%) or outline`, `${same.length}: ${same.slice(0, 40).join('; ')}`);
  console.log(`     closest pair: ${closest.id}`);
  // the things on screen are the same thing everywhere, only muffled under water
  const things = ['sleeve', 'needle', 'slot', 'static', 'stick'], wet = things.filter((e) => !(M.sea[e].centroid < M.fridge[e].centroid * 0.95 && M.reef[e].centroid < M.fridge[e].centroid * 0.97));
  ok(!wet.length, 'things on screen are duller under water (Sea, Reef) than on the Fridge', wet.join(' '));

  // the quiet-hours alarm: one round, softer, nothing above the low-pass
  const q = await page.evaluate(async (PALETTES) => { const S = window.fhSound, o = {}; for (const p of PALETTES) { const x = await S.render(p, 'alarm', { indoors: true }), y = await S.render(p, 'alarm'); let pk = 0, end = 0, py = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > pk) pk = a; if (a > 1e-5) end = i; } for (const v of y) py = Math.max(py, Math.abs(v)); o[p] = [end / 48000, pk, py]; } return o; }, PALETTES);
  const loudQ = PALETTES.filter((p) => !(q[p][0] <= 0.42 && q[p][1] < q[p][2] * 0.75 && dB(q[p][1]) > -40));
  ok(!loudQ.length, 'quiet-hours alarm: one round (under 0.42 s), at least 2.5 dB under the daytime alarm, not silent', loudQ.map((p) => `${p} ${q[p][0].toFixed(2)} s ${f1(dB(q[p][1]))}`).join('; '));

  // ---- the table ----
  const col = (s, n) => String(s).padEnd(n), cell = (m) => `${String(Math.round(m.dur * 1000)).padStart(4)} ${f1(dB(m.peak)).padStart(5)} ${String(Math.round(m.centroid)).padStart(4)}`;
  console.log(`\n${col('sound', 9)}${col('class', 7)}${col('limit', 13)}| ${VERBOSE ? PALETTES.map((p) => col(p, 15)).join('| ') : 'length ms (min–max) | peak dBFS (min–max) | loudest 20 ms dB | centroid Hz (min–max) | under 250 Hz (max) | over 8 kHz (max)'}`);
  for (const e of EVENTS) { const L = LIMITS[CLASS[e]], ms = PALETTES.map((p) => M[p][e]), mm = (f) => [Math.min(...ms.map(f)), Math.max(...ms.map(f))];
    const d = mm((m) => m.dur * 1000), pk = mm((m) => dB(m.peak)), r = mm((m) => dB(m.rms)), c = mm((m) => m.centroid), lw = Math.max(...ms.map((m) => m.low)), hi = Math.max(...ms.map((m) => m.high));
    console.log(`${col(e, 9)}${col(CLASS[e], 7)}${col(`${L.max * 1000}ms ${L.cap}dB`, 13)}| ${VERBOSE ? ms.map(cell).join(' | ') : `${String(Math.round(d[0])).padStart(4)}–${String(Math.round(d[1])).padEnd(11)} | ${f1(pk[0]).padStart(5)} to ${f1(pk[1]).padEnd(9)} | ${f1(r[0]).padStart(5)} to ${f1(r[1]).padEnd(6)} | ${String(Math.round(c[0])).padStart(4)}–${String(Math.round(c[1])).padEnd(15)} | ${(lw * 100).toFixed(1).padStart(5)}%             | ${(hi * 100).toFixed(1)}%`}`); }
  if (VERBOSE) console.log('     (each cell: length ms, peak dBFS, centroid Hz)');
  console.log('');
}

// ---- 2. the audition page ----
if (run('page')) {
  await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
  const g = await page.evaluate(() => ({ cells: document.querySelectorAll('td button[data-e]').length, all: document.querySelectorAll('button[data-all]').length, vol: !!document.querySelector('#vol'), named: [...document.querySelectorAll('td button[data-e]')].every((b) => b.getAttribute('aria-label')), filled: [...document.querySelectorAll('td button[data-e] span')].every((s) => / ms · /.test(s.textContent)) }));
  ok(g.cells === EVENTS.length * PALETTES.length && g.all === PALETTES.length && g.vol && g.named && g.filled, 'audition page: a named button for every palette x sound, "play all" per palette, a volume slider', JSON.stringify(g));
  // a real click plays on the live context without an error, and the volume slider reaches the master gain
  await page.click('td button[data-p="reef"][data-e="tick"]'); await page.click('td button[data-p="sports"][data-e="done"]'); await page.waitForTimeout(300);
  const st = await page.evaluate(() => { const v = document.querySelector('#vol'); v.value = '50'; v.dispatchEvent(new Event('input')); return { ctx: window.fhSound.state().context, label: document.querySelector('#volv').textContent, last: document.querySelector('#last').textContent }; });
  ok(st.ctx === 'running' && /^50%/.test(st.label) && /Sports/.test(st.last), 'audition page: clicking a cell plays on the live context; the slider works', JSON.stringify(st));
}
await page.close();

// ---- 3. the quiet rules, in the card itself ----
const open = async (qs, { time = '16:20', day = '2026-11-10' } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'Australia/Perth', locale: 'en-AU' });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.clock.setFixedTime(new Date(`${day}T${time}:00+08:00`));
  await pg.goto(`http://localhost:${PORT}/?${qs}`); await pg.waitForFunction('window.__ready === true'); await pg.waitForTimeout(500); return pg;
};
/** ask for sounds one by one (far enough apart to pass the re-trigger gap is not needed: each is a different sound) and say which were played */
const tryAll = (pg, list) => pg.evaluate((list) => list.filter((s) => { const n = window.fhSound.stats.played; window.fhSfx(s); return window.fhSound.stats.played > n; }), list);
if (run('rules')) {
  const SOME = ['tap', 'key', 'nav', 'open', 'tick', 'done', 'error', 'poke', 'needle', 'clarinet', 'alarm'];
  { const pg = await open('look=fridge&page=planner');
    const day = await tryAll(pg, SOME); ok(day.length === SOME.length, 'by day every sound plays', day.join(' '));
    await pg.waitForTimeout(1300);
    const pal = await pg.evaluate(() => window.fhSound.state().palette); ok(pal === 'fridge', 'the Fridge look plays the Fridge palette', pal);
    await pg.waitForTimeout(500);
    const burst = await pg.evaluate(() => { const n = window.fhSound.stats.played; for (let i = 0; i < 8; i++) window.fhSfx('tap'); return window.fhSound.stats.played - n; });
    ok(burst === 1, 'eight taps in one moment sound once (the re-trigger gap)', String(burst));
    const never = await pg.evaluate(() => { try { window.fhSfx('nonsense'); window.fhSfx(undefined); return true; } catch { return false; } }); ok(never, 'an unknown sound is ignored, never an error');
    // the card's own setting: off (the alarm still sounds), quiet, and a wrong value is refused without breaking a config that has none
    const cfg = await pg.evaluate(async () => { const c = document.querySelector('family-hub-card'), base = { ...c._config }; let threw = ''; try { c.setConfig({ ...base, sounds: 'loud' }); } catch (e) { threw = String(e.message); }
      c.setConfig({ ...base, sounds: false }); await c.updateComplete; const off = window.fhSound.state().mode; const n = window.fhSound.stats.played; await new Promise((r) => setTimeout(r, 300)); window.fhSfx('tick'); const tickOff = window.fhSound.stats.played > n; window.fhSfx('alarm'); const alarmOff = window.fhSound.stats.played > n;
      c.setConfig({ ...base, sounds: 'quiet' }); await c.updateComplete; const quiet = window.fhSound.state().mode; c.setConfig(base); await c.updateComplete; return { threw, off, tickOff, alarmOff, quiet, back: window.fhSound.state().mode }; });
    ok(/sounds/.test(cfg.threw) && cfg.off === 'off' && !cfg.tickOff && cfg.alarmOff && cfg.quiet === 'quiet' && cfg.back === 'on', 'config `sounds`: false silences all but the alarm, "quiet" softens, a wrong value is refused, none = on', JSON.stringify(cfg));
    // the switch in the look sheet
    await pg.goto(`http://localhost:${PORT}/?look=fridge&page=planner&sheet=themes`); await pg.waitForFunction('window.__ready === true'); await pg.waitForTimeout(400);
    const sw = await pg.evaluate(async () => { const c = document.querySelector('family-hub-card'), seg = c.shadowRoot.querySelector('.sheet [data-set="sounds"]'); if (!seg) return { found: false }; const b = [...seg.querySelectorAll('button')]; b[0].click(); await c.updateComplete; const off = window.fhSound.state().mode, kept = localStorage.getItem('family-hub-sounds');
      b[2].click(); await c.updateComplete; return { found: true, n: b.length, off, kept, on: window.fhSound.state().mode, pressed: b.map((x) => x.getAttribute('aria-pressed')).join() }; });
    ok(sw.found && sw.n === 3 && sw.off === 'off' && sw.kept === 'off' && sw.on === 'on' && sw.pressed === 'false,false,true', 'the look sheet has a Sounds choice (Off, Soft, On) that is kept on this screen', JSON.stringify(sw));
    await pg.close(); }
  for (const [qs, want] of [['look=glass&theme=reef&page=planner', 'reef'], ['look=glass&theme=space&page=planner', 'space'], ['look=orbit&page=planner', 'orbit'], ['look=sports&page=planner', 'sports'], ['look=glass&theme=sea&scene=sports&page=planner', 'sports']]) {
    const pg = await open(qs), pal = await pg.evaluate(() => window.fhSound.state().palette); ok(pal === want, `${qs.split('&page')[0]} plays the ${want} palette`, pal); await pg.close(); }
  { const pg = await open('look=glass&theme=sea&page=planner&night=0', { time: '20:40' }); await pg.waitForTimeout(1500);
    const late = await tryAll(pg, SOME); ok(late.join() === 'alarm', 'quiet hours: nothing but the alarm', late.join(' ') || 'none');
    await pg.close(); }
  // what a touch says: the dock changes page, a sheet opens and closes, a plain button taps, a key is a key
  { const pg = await open('look=glass&theme=sea&page=planner');
    const heard = async (act) => { await pg.waitForTimeout(450); await pg.evaluate(() => { window.__said = []; const f = window.fhSound.stats; window.__n = f.played; }); await act(); await pg.waitForTimeout(250); return pg.evaluate(() => window.fhSound.stats.last + ':' + (window.fhSound.stats.played - window.__n)); };
    const card = pg.locator('family-hub-card');
    const nav = await heard(() => card.locator('nav button[data-nav]').nth(1).click()); ok(nav === 'nav:1', 'a dock button says "nav", once', nav);
    const back = await heard(() => card.locator('nav button[data-nav]').first().click()); ok(back === 'nav:1', 'and again on the way back', back);
    await pg.close(); }
  { const pg = await open('look=fridge&page=planner&sheet=themes'); await pg.waitForTimeout(500);
    const r = await pg.evaluate(async () => { const c = document.querySelector('family-hub-card'), S = window.fhSound.stats, wait = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
      let n = S.played; c.shadowRoot.querySelector('.sheet .xbtn').click(); await wait(300); out.close = `${S.last}:${S.played - n}`;
      await wait(300); n = S.played; c._sheet = 'themes'; await wait(300); out.open = `${S.last}:${S.played - n}`;
      await wait(300); n = S.played; [...c.shadowRoot.querySelectorAll('.sheet .tcard')].find((b) => b.getAttribute('aria-pressed') === 'false').click(); await wait(300); out.look = `${S.last}:${S.played - n}`; return out; });
    ok(r.close === 'close:1' && r.open === 'open:1' && r.look === 'look:1', 'a sheet closing says "close", opening says "open", and a new look plays its signature (one sound each)', JSON.stringify(r));
    await pg.close(); }
}

// what the keyboard, a switch and a plain button say (the card adds "tap" only where nothing else spoke)
if (run('rules')) {
  const said = async (pg, act) => { await pg.waitForTimeout(450); await pg.evaluate(() => { window.__n = window.fhSound.stats.played; }); await act(); await pg.waitForTimeout(250); return pg.evaluate(() => window.fhSound.stats.last + ':' + (window.fhSound.stats.played - window.__n)); };
  { const pg = await open('look=fridge&page=planner&sheet=add'), keys = pg.locator('family-hub-card .keys');
    const k = await said(pg, () => keys.locator('button.key', { hasText: /^[a-z]$/i }).first().click()), sp = await said(pg, () => keys.locator('button.key.space').click()), del = await said(pg, () => keys.locator('button[aria-label="Delete"]').click());
    ok(k === 'key:1' && sp === 'space:1' && del === 'del:1', 'on-screen keyboard: a letter says "key", the space bar "space", delete "del" (one sound each)', [k, sp, del].join(' '));
    await pg.close(); }
  { const pg = await open('look=glass&theme=sea&page=home'), home = pg.locator('family-hub-card fh-home');
    const sw = home.locator('[role="switch"]').first(), was = await sw.getAttribute('aria-checked'), r = await said(pg, () => sw.click());
    ok(r === (was === 'true' ? 'off:1' : 'on:1'), 'a switch says "on" or "off" by where it is going', `was ${was}: ${r}`);
    const plain = await said(pg, () => home.locator('button.scene.tap').first().click());
    ok(plain === 'tap:1', 'a plain button says "tap", once', plain);
    await pg.close(); }
  // a child's page near bedtime keeps quiet: no tap from plain buttons either
  { const pg = await open('look=glass&theme=sea&page=kid&kid=2', { time: '18:50' }); await pg.waitForTimeout(600);
    const r = await pg.evaluate(async () => { const c = document.querySelector('family-hub-card'), k = c.shadowRoot.querySelector('fh-kid'); if (!k) return { found: false }; const b = k.shadowRoot.querySelector('button.tap:not([disabled])'), n = window.fhSound.stats.played; b?.click(); await new Promise((r) => setTimeout(r, 200)); return { found: true, hush: k.hasAttribute('data-hush'), played: window.fhSound.stats.played - n, muted: window.fhSound.state().muted }; });
    ok(r.found && r.hush && r.played === 0, `a child's page at wind-down is hushed (data-hush ${r.hush}): a plain button makes no sound`, JSON.stringify(r));
    await pg.close(); }
}

console.log('errors:', errs.length ? errs.join('\n') : 'none'); if (errs.length) fails++;
console.log(fails ? `\n${fails} FAILED` : '\nall passed');
await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
