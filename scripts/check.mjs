// One command for the checks, sized to the change.
//
//   npm run check             the checks this change needs (about 10 minutes): the build, the suites that cover the files changed
//                             since main, and the fit check (clearance) on the pages those files draw, ordinary words only
//   npm run check -- --broad  the same plus the two long click suites (click-base is 17 minutes by itself): for a phase that
//                             reshapes the shell or a whole page. They also join by themselves when a page's own file changes
//   npm run check -- --full   everything, ordinary and long words (about 40 minutes): for a release candidate, and for any change
//                             to the shared styles, the looks or the type scale
//
// What it does that running the suites by hand did not:
//   * picks the suites from the files that changed (RULES below), and says which it left out and why
//   * runs two at a time (the machine has two cores), each on its own port, longest first
//   * reads every result itself: a failing line that is on the known list (scripts/tests/known.json, faults in the tests
//     that main has too) is reported as known, not as a failure
//   * runs a failed suite once more by itself before calling it a failure (most false alarms are a busy machine)
//   * keeps each suite's output in preview/shots/logs/ and how long each took in timings.json there
//
// Options: --full   --broad   --base <ref> (default origin/main)   --only a,b   --pages 'planner&sheet=sitter,…' (narrow the fit check by
// hand; the summary says so)   --list (show the plan and stop)   --jobs <n>
import { spawn, execSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname, T = path.join(ROOT, 'scripts/tests'), LOGS = path.join(ROOT, 'preview/shots/logs');
const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? undefined : process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true; };
const FULL = !!arg('full'), BROAD = !!arg('broad'), BASE = typeof arg('base') === 'string' ? arg('base') : 'origin/main', JOBS = Number(arg('jobs')) || 2;
const sh = (c) => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };

/* ---------------- what changed ---------------- */
const changed = [...new Set([...sh(`git diff --name-only ${BASE}...HEAD`).split('\n'), ...sh('git status --porcelain').split('\n').map((l) => l.slice(3))].map((s) => s.trim()).filter(Boolean))]
  .filter((f) => !/^(dist\/|package(-lock)?\.json$|README|LICENSE|preview\/shots\/)/.test(f));
const hit = (re) => changed.some((f) => re.test(f));

/* ---------------- which suite covers which files ---------------- */
// `when`: the suite runs if any changed file matches. `alone`: it needs the machine to itself (it times things).
const SHELL = 'family-hub', LOOKS = 'styles|looks|fonts|themes';
// (the preview page is the tests' own stand-in for Home Assistant: a change there is exercised by the suite that needed it)
const src = (names) => new RegExp(`^src/(${names})\\.ts$`);
const RULES = [
  { suite: 'voice', when: src(`voice|util|chat|music|settings|kid|${SHELL}`) },
  { suite: 'ask', when: src('chat|voice') },
  { suite: 'trust', when: src(`trust|kid|settings|util|types|${SHELL}`) },
  { suite: 'events', when: src(`addevent|repeat|dates|${SHELL}`) },
  { suite: 'phase1', when: src(`pin|kid|morning|${SHELL}`) },
  { suite: 'phase2', when: src(`kid|rewards|chat|util|${SHELL}`) },
  { suite: 'phase3', when: src(`morning|${SHELL}`) },
  { suite: 'phase4', when: src(`${SHELL}|${LOOKS}`) },
  { suite: 'buttons', when: src(`art|icons|${SHELL}|${LOOKS}`) },
  { suite: 'phone', when: src(`${SHELL}|${LOOKS}`) },
  // the two long ones are the broad safety net over every page. A change to the shell alone (family-hub.ts is touched by nearly every
  // phase) does not call them: the suites above cover what a phase adds, --broad adds these, and the release candidate runs everything
  { suite: 'click-base', long: true, when: src(`${LOOKS}|kid|groceries|doodle|weather|home|morning|keys|pin|avatar|studio|wardrobe|sparks|fx|ambient|radar|sound|icons|art`) },
  { suite: 'click-music', long: true, when: src(`music|musicviews|ma|media|${LOOKS}`) },
  { suite: 'settings', when: src('settings|settings-store|validate|types') },
  { suite: 'art', when: src('artmode|artlib|nightly|presence|studio|avatar') },
  { suite: 'screensaver', when: src(`artmode|artlib|${SHELL}`) },
  { suite: 'sounds', when: src('sound|soundtrim') },
  { suite: 'sports', when: /^src\/scenes\//, },
];
// the fit check walks pages, so it is narrowed to the pages the changed files draw; the shared styles and looks mean every page
const PAGES = [
  [src(`${LOOKS}|keys|icons|art|sparks`), null], // null: every page
  [src(SHELL), ['planner', 'planner&view=day', 'planner&view=month', 'planner&events=many', 'planner&sheet=themes', 'planner&sheet=meds', 'planner&sheet=sitter', 'planner&sheet=timer', 'planner&art=1&artn=3', 'planner&night=1@22:30']],
  [src('kid|avatar|studio|wardrobe|rewards|util'), ['kid&kid=0', 'kid&kid=1', 'kid&kid=2', 'kid&kid=0&studio=1', 'kid&kid=0&painted=1&studio=1', 'kid&kid=2&painted=1']],
  [src('music|musicviews|ma'), ['music', 'music&mview=scene', 'music&mview=dial', 'music&mview=desk', 'music&mview=cables', 'music&mview=list', 'music&mtab=shelves', 'music&mtab=juke&juke=1', 'music&mtab=radio', 'music&mtab=call']],
  [src('settings'), ['planner&sheet=settings&pane=children', 'planner&sheet=settings&pane=house', 'planner&sheet=settings&pane=pictures&artn=3']],
  [src('groceries'), ['groceries', 'groceries&long=1']], [src('doodle'), ['doodle']], [src('weather|radar'), ['weather']], [src('home'), ['home']],
  [src('morning'), ['morning@07:10']], [src('chat'), ['planner&sheet=chat']], [src('addevent|repeat'), ['planner&sheet=add']], [src('artmode|artlib'), ['planner&art=1&artn=3']],
];
const ALL = ['click-base', 'click-music', 'events', 'phone', 'phase1', 'phase2', 'phase3', 'phase4', 'buttons', 'ask', 'trust', 'voice', 'settings', 'art', 'screensaver'];

let pages = null, byHand = false;
if (typeof arg('pages') === 'string') { pages = arg('pages').split(','); byHand = true; }
else if (!FULL) { const set = new Set(); let every = false; for (const [re, list] of PAGES) if (hit(re)) { if (!list) every = true; else list.forEach((p) => set.add(p)); } pages = every ? null : [...set]; }
const only = typeof arg('only') === 'string' ? arg('only').split(',') : null;
const exists = (s) => fs.existsSync(path.join(T, `${s}.mjs`));
const plan = []; const left = [];
for (const s of FULL ? ALL : RULES.map((r) => r.suite)) { const r = RULES.find((x) => x.suite === s) ?? {};
  if (!exists(s)) continue;
  if (only ? only.includes(s) : FULL || hit(r.when) || (BROAD && r.long) || changed.includes(`scripts/tests/${s}.mjs`)) plan.push({ name: s, file: s, alone: !!r.alone, env: {} }); else left.push(s); }
const fit = !only || only.includes('clearance');
if (fit && (FULL || pages === null || pages.length)) {
  const env = pages ? { PAGES: pages.join(',') } : {};
  plan.push({ name: 'clearance', file: 'clearance', env, fit: true });
  if (FULL || (pages === null && hit(src(LOOKS)))) plan.push({ name: 'clearance (long words)', file: 'clearance', env: { ...env, STRESS: '1' }, fit: true });
}

console.log(`${FULL ? 'Full check' : 'Check sized to the change'} against ${BASE}`);
console.log(`Changed: ${changed.length ? changed.join(', ') : 'nothing'}`);
console.log(`Running: ${plan.map((p) => p.name).join(', ') || 'only the build'}`);
if (!FULL) console.log(`Left out (their files did not change): ${left.join(', ') || 'none'}${pages ? `\nFit check on ${pages.length} of 37 pages${byHand ? ', narrowed by hand' : ''}; ordinary words` : ''}`);
if (arg('list')) process.exit(0);

/* ---------------- run ---------------- */
fs.mkdirSync(LOGS, { recursive: true });
const known = JSON.parse(fs.readFileSync(path.join(T, 'known.json'), 'utf8')).map((k) => ({ ...k, re: new RegExp(k.match) }));
const envBase = { ...process.env, PLAYWRIGHT: process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright-core/index.mjs', CHROME: process.env.CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : '') };
let port = 4900;
const run = (p) => new Promise((done) => { const t0 = Date.now(); let out = '';
  const c = spawn('node', [path.join(T, `${p.file}.mjs`)], { cwd: ROOT, env: { ...envBase, ...p.env, PORT: String(port++) } });
  c.stdout.on('data', (d) => { out += d; }); c.stderr.on('data', (d) => { out += d; });
  c.on('close', (code) => { fs.writeFileSync(path.join(LOGS, `${p.name.replace(/[^a-z0-9-]+/gi, '_')}.log`), out); done({ ...judge(p, out, code), secs: Math.round((Date.now() - t0) / 1000) }); }); });
/** A suite's verdict from what it printed: lines that say FAIL, page errors, a crash; known faults are set aside. */
function judge(p, out, code) {
  const lines = out.split('\n'), bad = [];
  for (const l of lines) if (/\bFAIL\b/.test(l)) bad.push(l.trim().slice(0, 220));
  // page errors are printed as a block after "errors:". A 404 there is the preview having no such picture (radar tiles, a sound made to fail on purpose): not an error
  const at = lines.findIndex((l) => /^(errors|page errors):/.test(l));
  if (at >= 0) for (const l of [lines[at].replace(/^(errors|page errors):\s*/, ''), ...lines.slice(at + 1, lines.findIndex((l, i) => i > at && !l.trim()) < 0 ? undefined : lines.findIndex((l, i) => i > at && !l.trim()))]) { const t = l.replace(/^ - /, '').trim(); if (t && t !== 'none' && !/^404 |status of 404/.test(t)) bad.push(`page error: ${t.slice(0, 200)}`); }
  if (p.fit && !/nothing found/.test(out)) bad.push(...lines.filter((l) => /^(Ordinary|Long) words:/.test(l)));
  const isKnown = (l) => known.find((k) => (!k.suite || k.suite === p.file) && k.re.test(l));
  const real = bad.filter((l) => !isKnown(l)), set = bad.filter(isKnown);
  // a crash is a non-zero exit that no failing line explains
  if (code !== 0 && !bad.length) real.push(`stopped with exit code ${code}: ${lines.filter(Boolean).slice(-2).join(' | ').slice(0, 240)}`);
  const m = /(\d+) passed/.exec(out);
  return { name: p.name, pass: m ? Number(m[1]) : null, real, known: set };
}
const t0 = Date.now(); const results = [];
const step = (label, cmd) => { process.stdout.write(`${label}… `); try { execSync(cmd, { cwd: ROOT, stdio: 'pipe' }); console.log('ok'); return true; } catch (e) { console.log('FAILED\n' + String(e.stdout ?? '') + String(e.stderr ?? '')); return false; } };
if (!arg('nobuild') && !step('Build (types, looks, motion, bundle)', 'npm run build')) process.exit(1);
const pool = async (list, n) => { const q = [...list]; await Promise.all(Array.from({ length: n }, async () => { for (let p = q.shift(); p; p = q.shift()) { const r = await run(p); results.push({ ...r, p }); console.log(`  ${r.real.length ? 'FAIL ' : 'ok   '} ${r.name} (${r.secs}s)`); } })); };
// longest first (from the last run's times), so the long suites start at once and the short ones fill in beside them
const took = (() => { try { return JSON.parse(fs.readFileSync(path.join(LOGS, 'timings.json'), 'utf8')); } catch { return {}; } })();
const guess = { 'click-base': 1020, 'click-music': 480, clearance: 780, 'clearance (long words)': 780, settings: 330, art: 300 };
plan.sort((a, b) => (took[b.name] ?? guess[b.name] ?? 90) - (took[a.name] ?? guess[a.name] ?? 90));
await pool(plan, JOBS);
// a second go, alone, for anything that failed: a busy machine is the usual cause
for (const r of results.filter((x) => x.real.length)) { process.stdout.write(`  again, alone: ${r.name}… `); const again = await run(r.p); console.log(again.real.length ? 'still failing' : 'passes alone'); if (!again.real.length) { r.flaky = r.real; r.real = []; r.known = again.known; } else r.real = again.real; r.secs += again.secs; }

/* ---------------- report ---------------- */
const secs = Math.round((Date.now() - t0) / 1000);
console.log('\nSuite                      Result   Time   Notes');
for (const r of results.sort((a, b) => a.name.localeCompare(b.name))) console.log(`${r.name.padEnd(26)} ${(r.real.length ? 'FAIL' : 'pass').padEnd(8)} ${String(r.secs + 's').padEnd(6)} ${[r.pass !== null ? `${r.pass} checks` : '', r.known.length ? `${r.known.length} known` : '', r.flaky ? `${r.flaky.length} failed beside another suite, passed alone` : ''].filter(Boolean).join('; ')}`);
for (const r of results) { for (const l of r.real) console.log(`\nFAIL ${r.name}: ${l}`); for (const l of r.flaky ?? []) console.log(`\nflaky ${r.name}: ${l}`); }
const kn = [...new Set(results.flatMap((r) => r.known.map((l) => known.find((k) => k.re.test(l)).name)))];
if (kn.length) console.log(`\nKnown faults in the tests (main has them too): ${kn.join('; ')}`);
try { const f = path.join(LOGS, 'timings.json'), was = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}; for (const r of results) was[r.name] = r.secs; fs.writeFileSync(f, JSON.stringify(was, null, 1)); } catch { /* timings are a convenience */ }
const failed = results.filter((r) => r.real.length).length;
console.log(`\n${failed ? `${failed} suite${failed > 1 ? 's' : ''} failing` : 'All clear'} in ${Math.floor(secs / 60)} min ${secs % 60} s. Logs: preview/shots/logs/`);
process.exit(failed ? 1 : 0);
