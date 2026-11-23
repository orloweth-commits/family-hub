// One command for the checks, sized to the change.
//
//   npm run check             the checks this change needs (about 10 minutes): the build, the suites that cover the files changed
//                             since main, and the fit check (clearance) on the pages those files draw, ordinary words only
//   npm run check -- --broad  the same plus the long click suites (click-base's four parts and click-music): for a phase that
//                             reshapes the shell or a whole page. They also join by themselves when a page's own file changes
//   npm run check -- --batch  for a batch of the polish block (about 15 minutes): the suites that cover the files changed, and the
//                             fit check at 1920 x 1080 (and the iPad, for a change's own pages), in all five looks, ordinary and long words.
//                             Other sizes wait for the full check at the end of the block and on the release candidate
//   npm run check -- --full   everything, ordinary and long words (about 40 minutes): for a release candidate, and for any change
//                             to the shared styles, the looks or the type scale
//
// What it does that running the suites by hand did not:
//   * picks the suites from the files that changed (RULES below), and says which it left out and why
//   * runs two at a time (the machine has two cores), each on its own port, longest first
//   * reads every result itself: a failing line that is on the known list (scripts/tests/known.json, faults in the tests
//     that main has too) is reported as known, not as a failure
//   * runs a failed suite once more by itself before calling it a failure (most false alarms are a busy machine); a fit check
//     with a finding walks only the looks, sizes and pages that had one, not everything again
//   * does not count a change to family-hub.ts that is only its version line
//   * keeps each suite's output in preview/shots/logs/ and how long each took in timings.json there
//
// Options: --full   --broad   --base <ref> (default origin/main)   --only a,b   --pages 'planner&sheet=sitter,…' (narrow the fit check by
// hand; the summary says so)   --list (show the plan and stop)   --jobs <n>   --nobuild   --sizes more (the fit check also walks 1280 x 800,
// 1312 x 668 and 1024 x 768: backlog 35)   --help (this comment, and stop)
//
// One check per piece (23 Nov): run `--batch` once when the piece is ready, not a narrowed check first and the batch check after (the batch
// check runs the same suites again; it already reruns a failure alone). While working, run the one suite being changed by hand.
// The full check once on a release candidate, not twice: a second full run repeats 80 minutes to catch what "again, alone" already catches.
// Since 23 Nov: watchdog and screensaver follow a change to family-hub.ts only where its changed lines touch what they test (`shell` in RULES).
//
// Since 23 Nov: a batch's fit check walks the iPad as well as the wall when it is narrowed to the pages a change draws (the full check found
// two iPad faults older than four batches); a change to the fit check itself (clearance.mjs, or a "fit" entry in known.json) walks every page;
// click-base is four parts by page (click-base-shell, -kid, -planner, -pages), each run like any other suite.
import { spawn, execSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname, T = path.join(ROOT, 'scripts/tests'), LOGS = path.join(ROOT, 'preview/shots/logs');
const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? undefined : process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true; };
// an option it does not know stops it (until 23 Nov `--help` ran the whole check)
{ const KNOWN_OPTS = ['full', 'broad', 'batch', 'base', 'only', 'pages', 'list', 'jobs', 'nobuild', 'sizes', 'help'];
  const bad = process.argv.slice(2).filter((a) => a.startsWith('--') && !KNOWN_OPTS.includes(a.slice(2)));
  if (bad.length || process.argv.includes('--help')) { const head = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n'); console.log(head.slice(0, head.findIndex((l) => !l.startsWith('//'))).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    if (bad.length) console.log(`\nNot an option: ${bad.join(' ')}`); process.exit(bad.length ? 2 : 0); } }
const FULL = !!arg('full'), BROAD = !!arg('broad'), BATCH = !!arg('batch') && !arg('full'), BASE = typeof arg('base') === 'string' ? arg('base') : 'origin/main', JOBS = Number(arg('jobs')) || 2;
const sh = (c) => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };

/* ---------------- what changed ---------------- */
const changed = [...new Set([...sh(`git diff --name-only ${BASE}...HEAD`).split('\n'), ...sh('git status --porcelain').split('\n').map((l) => l.slice(3))].map((s) => s.trim()).filter(Boolean))]
  .filter((f) => !/^(dist\/|package(-lock)?\.json$|README|LICENSE|preview\/shots\/)/.test(f))
  // every release changes the version line in the shell, and the shell calls nine suites: a change that is only that line does not count
  .filter((f) => f !== 'src/family-hub.ts' || sh(`git diff -U0 ${BASE} -- src/family-hub.ts`).split('\n').filter((l) => /^[+-][^+-]/.test(l)).some((l) => !/const VERSION = /.test(l)));
const hit = (re) => changed.some((f) => re.test(f));
// the shell's changed lines, for a suite that follows only part of it (`shell` in RULES)
const shellLines = sh(`git diff -U0 ${BASE} -- src/family-hub.ts`).split('\n').filter((l) => /^[+-][^+-]/.test(l)).join('\n');
const hitRule = (r) => !r.shell ? hit(r.when) : changed.some((f) => f !== 'src/family-hub.ts' && r.when.test(f)) || (changed.includes('src/family-hub.ts') && r.shell.test(shellLines));
const FIVE = 'glass,glass-dark,fridge,orbit,sports,obsidian' /* five looks, Glass in light and in dark */, WALL = 'wall:1920x1080', IPAD = 'ipad:1180x820';
const MORE_SIZES = arg('sizes') === 'more' ? ',small:1280x800,short:1312x668,tab:1024x768' : '';
// a change to the fit check itself, or to what it sets aside, is checked on every page (a change to test files only gave it none: backlog 106)
const fitChanged = changed.includes('scripts/tests/clearance.mjs') || sh(`git diff -U0 ${BASE} -- scripts/tests/known.json`).split('\n').some((l) => /^[+-]\s*"(fit|kind|where|look|vp|page|word)"/.test(l));

/* ---------------- which suite covers which files ---------------- */
// `when`: the suite runs if any changed file matches. `alone`: it needs the machine to itself (it times things).
const SHELL = 'family-hub', LOOKS = 'styles|looks|fonts|themes|dark';
// (the preview page is the tests' own stand-in for Home Assistant: a change there is exercised by the suite that needed it)
const src = (names) => new RegExp(`^src/(${names})\\.ts$`);
const RULES = [
  { suite: 'voice', when: src(`voice|util|chat|music|settings|kid|${SHELL}`) },
  { suite: 'ask', when: src('chat|voice') },
  { suite: 'trust', when: src(`trust|kid|settings|util|types|jar|${SHELL}`) },
  { suite: 'events', when: src(`addevent|repeat|dates|${SHELL}`) },
  { suite: 'phase1', when: src(`pin|kid|morning|${SHELL}`) },
  { suite: 'phase2', when: src(`kid|rewards|chat|util|jar|${SHELL}`) },
  { suite: 'phase3', when: src(`morning|${SHELL}`) },
  { suite: 'phase4', when: src(`${SHELL}|${LOOKS}`) },
  { suite: 'buttons', when: src(`art|icons|${SHELL}|${LOOKS}`) },
  { suite: 'phone', when: src(`${SHELL}|${LOOKS}`) },
  // the broad safety net over every page, split by page on 23 Nov 2026 (it was click-base.mjs, 19 minutes in one; backlog 52): each part
  // runs when its own pages' files change, and all four when what they share (scripts/tests/lib/click.mjs) does. Only the planner's part
  // follows the shell (family-hub.ts draws the planner, the header and the sheets); --broad adds all four
  { suite: 'click-base-shell', long: true, when: src(`${LOOKS}|icons|art|sparks|fx|ambient|sound`), lib: 'click' },
  { suite: 'click-base-kid', long: true, when: src(`${LOOKS}|kid|avatar|studio|wardrobe|rewards|sparks|fx|pin|keys|chat`), lib: 'click' },
  { suite: 'click-base-planner', long: true, when: src(`${LOOKS}|${SHELL}|addevent|repeat|dates|pin|keys|chat|icons|art|jar`), lib: 'click' },
  { suite: 'click-base-pages', long: true, when: src(`${LOOKS}|groceries|doodle|weather|home|morning|keys|radar|ambient|music|musicviews|icons|art`), lib: 'click' },
  { suite: 'music-f2', when: src('music|musicviews|ma|media|settings') },
  { suite: 'click-music', long: true, when: src(`music|musicviews|ma|media|${LOOKS}`) },
  { suite: 'digest', when: src('digest|settings|trust|validate') },
  { suite: 'approve', when: src(`approve|kid|rewards|settings|digest|validate|${SHELL}`) }, // (the bell's sheet is in the shell: 0.38.25)
  { suite: 'noticed', when: src('noticed|approve|kid|digest') },
  { suite: 'cues', when: src('cues|kid|settings|voice|validate|digest') },
  { suite: 'f5', when: src('groceries|weather|home|dinner|term|chat|morning|settings') },
  { suite: 'settings', when: src('settings|settings-store|validate|types') },
  { suite: 'art', when: src('artmode|artlib|nightly|presence|studio|avatar') },
  // (screensaver and watchdog follow the shell only where its change touches what they test: the screensaver's layer, touches, the morning
  // hold, the house link, reloads. Until 23 Nov they ran on any change to family-hub.ts, 17 minutes, and 5 of the 6 pieces before touched none of it)
  { suite: 'screensaver', when: src(`artmode|artlib|${SHELL}`), shell: /_art\b|_art\.|_artBlocked|_lastTouch|_morningHold|_onTick|_nightManual|idle|screensaver/ },
  { suite: 'sounds', when: src('sound|soundtrim') },
  { suite: 'sports', when: /^src\/scenes\//, },
  { suite: 'dark', when: src(`${LOOKS}|settings|ambient|weather|radar|${SHELL}`) },
  { suite: 'offline', when: src(`online|radar|weather|voice|util|music|fonts`) },
  { suite: 'hadown', when: src(`house|util|kid|morning|groceries|weather|${SHELL}`) },
  { suite: 'watchdog', when: src(`watchdog|house|artmode|trust|${SHELL}`), shell: /_art\b|_art\.|_artBlocked|_lastTouch|_morningHold|houseUp|_houseEval|shouldUpdate|watchdog|reload|idle/ },
  { suite: 'health', when: src(`health|watchdog|house|settings|trust|voice|online|types`) },
  { suite: 'obsidian', when: src(`${LOOKS}|art|avatar|music|musicviews|scenes/obsidian|${SHELL}`) },
];
// the fit check walks pages, so it is narrowed to the pages the changed files draw; the shared styles and looks mean every page
const PAGES = [
  [src(`${SHELL}|approve`), ['planner&house=1&asks=reward-job-chat', 'planner&asks=reward-job-chat&sheet=waiting']], [src('noticed|kid'), ['kid&kid=0&note=You helped Max without being asked.', 'kid&kid=0&sheet=noticed']], [src('groceries'), ['groceries&house=1']],
  [src(`${LOOKS}|keys|icons|art|sparks`), null], // null: every page
  [src(SHELL), ['planner', 'planner&view=day', 'planner&view=month', 'planner&events=many', 'planner&sheet=themes', 'planner&sheet=meds', 'planner&sheet=sitter', 'planner&sheet=timer', 'planner&art=1&artn=3', 'planner&night=1@22:30']],
  [src('kid|avatar|studio|wardrobe|rewards|util'), ['kid&kid=0', 'kid&kid=1', 'kid&kid=2', 'kid&kid=0&studio=1', 'kid&kid=0&painted=1&studio=1', 'kid&kid=2&painted=1']],
  [src('music|musicviews|ma'), ['music', 'music&mview=scene', 'music&mview=dial', 'music&mview=desk', 'music&mview=cables', 'music&mview=list', 'music&mtab=shelves', 'music&mtab=juke&juke=1', 'music&mtab=radio', 'music&mtab=call']],
  [src('settings'), ['planner&sheet=settings&pane=children', 'planner&sheet=settings&pane=rewards', 'planner&sheet=settings&pane=house', 'planner&sheet=settings&pane=pictures&artn=3', 'planner&sheet=settings&pane=people', 'planner&sheet=settings&pane=health&trust=1&digest=two&approve=1&voice=1&health=1']],
  [src('groceries'), ['groceries', 'groceries&long=1']], [src('doodle'), ['doodle']], [src('weather|radar'), ['weather']], [src('home'), ['home']],
  [src('morning'), ['morning@07:10']], [src('chat'), ['planner&sheet=chat']], [src('addevent|repeat'), ['planner&sheet=add']], [src('artmode|artlib'), ['planner&art=1&artn=3']],
];
const ALL = ['click-base-shell', 'click-base-kid', 'click-base-planner', 'click-base-pages', 'click-music', 'events', 'phone', 'phase1', 'phase2', 'phase3', 'phase4', 'buttons', 'ask', 'trust', 'voice', 'settings', 'art', 'screensaver', 'music-f2', 'digest', 'approve', 'noticed', 'cues', 'f5', 'obsidian', 'dark', 'offline', 'hadown', 'watchdog', 'health', 'sports']; // (sports since 23 Nov: it passes, so a red sports means something)

let pages = null, byHand = false;
if (typeof arg('pages') === 'string') { pages = arg('pages').split(','); byHand = true; }
else if (!FULL) { const set = new Set(); let every = fitChanged; for (const [re, list] of PAGES) if (hit(re)) { if (!list) every = true; else list.forEach((p) => set.add(p)); } pages = every ? null : [...set]; }
const only = typeof arg('only') === 'string' ? arg('only').split(',') : null;
const exists = (s) => fs.existsSync(path.join(T, `${s}.mjs`));
const plan = []; const left = [];
for (const s of FULL ? ALL : RULES.map((r) => r.suite)) { const r = RULES.find((x) => x.suite === s) ?? {};
  if (!exists(s)) continue;
  // (until 23 Nov a batch left click-base, 19 minutes in one, to the full check; its four parts run like any other suite)
  const ownFile = changed.includes(`scripts/tests/${s}.mjs`) || (r.lib && changed.includes(`scripts/tests/lib/${r.lib}.mjs`));
  if (only ? only.includes(s) : FULL || hitRule(r) || (BROAD && r.long) || ownFile) plan.push({ name: s, file: s, alone: !!r.alone, env: {} }); else left.push(s); }
const fit = !only || only.includes('clearance');
if (fit && (FULL || pages === null || pages.length)) {
  // a batch walks the wall, and the iPad too where it is narrowed to a change's pages; every page in six walks stays at the wall (time)
  const bvp = process.env.VP || (pages ? `${WALL},${IPAD}` : WALL) + MORE_SIZES;
  const env = { ...(pages ? { PAGES: pages.join(',') } : {}), ...(BATCH ? { LOOKS: FIVE, VP: bvp } : FULL ? { LOOKS: FIVE, ...(MORE_SIZES ? { VP: `wall:1920x1080,ipad:1180x820,phone:390x844${MORE_SIZES}` } : {}) } : {}) }; // (Obsidian was not in the fit check's own list)
  plan.push({ name: 'clearance', file: 'clearance', env, fit: true });
  if (FULL || BATCH || (pages === null && hit(src(LOOKS)))) plan.push({ name: 'clearance (long words)', file: 'clearance', env: { ...env, STRESS: '1' }, fit: true });
}

console.log(`${FULL ? 'Full check' : BATCH ? `Batch check (${pages ? '1920 x 1080 and the iPad' : '1920 x 1080'}, five looks, Glass in light and in dark)` : 'Check sized to the change'} against ${BASE}`);
console.log(`Changed: ${changed.length ? changed.join(', ') : 'nothing'}`);
console.log(`Running: ${plan.map((p) => p.name).join(', ') || 'only the build'}`);
if (!FULL) console.log(`Left out (their files did not change): ${left.join(', ') || 'none'}${pages ? `\nFit check on ${pages.length} of 43 pages${byHand ? ', narrowed by hand' : ''}; ordinary ${BATCH ? 'and long ' : ''}words` : ''}${BATCH ? `\nLeft to the full check: the fit check at ${pages ? 'a phone\'s size' : 'the iPad\'s and a phone\'s sizes'}` : ''}${fitChanged && !byHand && !FULL ? '\nThe fit check itself changed: every page' : ''}`);
if (arg('list')) process.exit(0);

/* ---------------- run ---------------- */
fs.mkdirSync(LOGS, { recursive: true });
const known = JSON.parse(fs.readFileSync(path.join(T, 'known.json'), 'utf8')).filter((k) => k.match).map((k) => ({ ...k, re: new RegExp(k.match) })); // (entries with "fit" are the fit check's own: clearance.mjs reads them)
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
  // (a suite that prints "errors: none" and then carries on has no block to read: the lines after it are its next results)
  if (at >= 0 && !/:\s*none\s*$/.test(lines[at])) for (const l of [lines[at].replace(/^(errors|page errors):\s*/, ''), ...lines.slice(at + 1, lines.findIndex((l, i) => i > at && !l.trim()) < 0 ? undefined : lines.findIndex((l, i) => i > at && !l.trim()))]) { const t = l.replace(/^ - /, '').trim(); if (t && t !== 'none' && !/^404 |status of 404/.test(t)) bad.push(`page error: ${t.slice(0, 200)}`); }
  if (p.fit && !/nothing found/.test(out)) bad.push(...lines.filter((l) => /^(Ordinary|Long) words:/.test(l)));
  // (a known line's suite "click-base" covers its four parts)
  const isKnown = (l) => known.find((k) => (!k.suite || k.suite === p.file || p.file.startsWith(k.suite + '-')) && k.re.test(l));
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
const guess = { 'click-base-shell': 300, 'click-base-kid': 300, 'click-base-planner': 300, 'click-base-pages': 300, 'click-music': 480, clearance: 780, 'clearance (long words)': 780, settings: 330, art: 300 };
plan.sort((a, b) => (took[b.name] ?? guess[b.name] ?? 90) - (took[a.name] ?? guess[a.name] ?? 90));
await pool(plan, JOBS);
// a second go, alone, for anything that failed: a busy machine is the usual cause
for (const r of results.filter((x) => x.real.length)) { // (a fit check says where it found something: "again: {looks, vp, pages}"; the second go walks only those)
  let p2 = r.p; if (r.p.fit) { try { const log = fs.readFileSync(path.join(LOGS, `${r.name.replace(/[^a-z0-9-]+/gi, '_')}.log`), 'utf8'); const m = /^again: (\{.*\})$/m.exec(log); if (m) { const a = JSON.parse(m[1]); p2 = { ...r.p, env: { ...r.p.env, LOOKS: a.looks.join(','), VP: a.vp.join(','), PAGES: a.pages.join(',') } }; } } catch { /* walk it all again */ } }
  process.stdout.write(`  again, alone${p2 !== r.p ? ', where it found something' : ''}: ${r.name}… `); const again = await run(p2); console.log(again.real.length ? 'still failing' : 'passes alone'); if (!again.real.length) { r.flaky = r.real; r.real = []; r.known = again.known; } else r.real = again.real; r.secs += again.secs; }

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
