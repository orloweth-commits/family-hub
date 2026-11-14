// F3, the evening digest: the automation Home Assistant runs is built from the card's own settings; what it sends on made-up evenings
// (events, leaving times, bins, medicine, rewards, marbles, warnings) reads right; Settings names the phones and the time, a save
// writes the automation and nothing else does; "Send one now" asks Home Assistant to run it.
// The words are made by a Home Assistant template. Here it is rendered by scripts/tests/digest_render.py, a stand-in that needs
// python3 with jinja2; without them those checks are skipped (said plainly, not counted as passing).
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4861] node scripts/tests/digest.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4861);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, time = '16:20') => { const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(600); return page; };
const S = (page) => page.locator('fh-settings');
const D = (page) => S(page).locator('[data-card="digest"]');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re.source);
const toast = async (page) => ((await S(page).locator('.toast').count()) ? (await S(page).locator('.toast span').first().innerText()).trim() : '');
const save = async (page) => { await S(page).locator('.sft [data-act="save"]').click(); await page.waitForTimeout(700); };

// 1. the automation, from the card's settings
const HOUSE = {
  type: 'custom:family-hub-card',
  kids: [{ name: 'Riley', colour: 3 }, { name: 'Charlie', colour: 4 }, { name: 'Max', colour: 5, leave_by: '07:30' }],
  calendars: [{ entity: 'calendar.family', colour: 'family', name: 'Family' }, { entity: 'calendar.sam', colour: 2, name: 'Sam' }, { entity: 'calendar.riley', colour: 3, name: 'Riley' },
    { entity: 'calendar.holidays', colour: 'family', name: 'Holidays', hide: ['Melbourne Cup', ' canberra '] }, { entity: 'calendar.birthdays', colour: 'family', only: ['birthday'] }],
  private: ['Paediatrician'], morning: { leave_by: '07:50', travel: 15 },
  school_terms: [['2026-10-12', '2026-12-10']], public_holidays: ['2026-11-18'],
  meds: [{ id: 'riley_am', who: 'Riley', label: 'Morning dose', time: '06:30' }, { id: 'charlie_am', who: 'Charlie', label: 'Morning dose', time: '06:30' }, { id: 'late', label: 'Night drops', time: '21:30' }],
  bins: { day: 1, always: ['green', 'purple'], alternate: ['yellow', 'red'], anchor: '2026-11-09' },
  jar: { target: 120 }, health: { heartbeat: 'input_datetime.fh_panel_seen', backup: 'todo.family_hub_backup' },
  digest: { notify: ['notify.mobile_app_alex', 'notify.mobile_app_sam'] }
};
const page0 = await open('look=glass&page=planner&digest=1&trust=1');
const built = await page0.evaluate((house) => { const C = customElements.get('family-hub-card'), c = document.querySelector('family-hub-card');
  return { own: c.digestSetup(), house: C.digest.haDigest(house), none: C.digest.haDigest({ ...house, digest: {} }), early: C.digest.haDigest({ ...house, digest: { notify: ['notify.mobile_app_alex'], time: '6:05' } }),
    same: C.digest.haDigest({ type: 'x', kids: [{ name: 'Riley', colour: 3 }, { name: 'Charlie', colour: 4 }], calendars: house.calendars, morning: house.morning, digest: house.digest }),
    bare: C.digest.haDigest({ type: 'x', digest: { notify: ['notify.mobile_app_alex'] } }),
    bad: ['digest: 5', { digest: { notify: 'notify.x' } }, { digest: { notify: ['mobile_app_x'] } }, { digest: { notify: ['notify.a'], time: '25:00' } }].map((d) => { try { document.createElement('family-hub-card').setConfig({ type: 'x', ...(typeof d === 'string' ? { digest: 5 } : d) }); return ''; } catch (e) { return String(e.message); } }) }; }, HOUSE);
const A = built.house, text = JSON.stringify(A);
ok('the running card offers its digest as one automation, sent at 7:30 pm unless a time is set', built.own?.alias === 'Family Hub: evening digest' && built.own.triggers.length === 1 && built.own.triggers[0].at === '19:30:00' && built.early.triggers[0].at === '06:05:00', built.own?.triggers);
ok('with no phone named there is no digest', built.none === null);
ok('it reads and tells, and does nothing else: three look-ups, then one message a phone', A.actions.filter((a) => a.response_variable).map((a) => a.action).join() === 'calendar.get_events,todo.get_items,todo.get_items' && A.actions.filter((a) => /^notify\./.test(a.action ?? '')).map((a) => a.action).join() === 'notify.mobile_app_alex,notify.mobile_app_sam' && A.actions.every((a) => a.variables || a.response_variable || /^notify\./.test(a.action)), A.actions.map((a) => a.action ?? 'variables'));
ok('a look-up that fails, or one phone that is off, does not stop the rest', A.actions.filter((a) => a.action).every((a) => a.continue_on_error === true));
ok('each night’s message takes the place of the last on the phone', A.actions.filter((a) => /^notify\./.test(a.action ?? '')).every((a) => a.data.data.tag === 'family-hub-digest'));
ok('a household with nothing but a phone still gets an automation', !!built.bare && built.bare.actions.filter((a) => a.response_variable).length === 1, built.bare?.actions.length);
ok('a digest setting that is not a list of notify services, or not a time, is refused in words', built.bad.every((m) => /^Family Hub: digest/.test(m)), built.bad);
await page0.context().close();

// 2. what it says, on made-up evenings
const ts = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const st = (state, attributes = {}) => ({ state, attributes });
const calStates = { 'calendar.family': st('off'), 'calendar.sam': st('off'), 'calendar.riley': st('off'), 'calendar.holidays': st('off'), 'calendar.birthdays': st('off') };
const ev = (summary, start) => ({ summary, start, end: start });
const OWED = 'todo.rewards_owed', BACK = 'todo.family_hub_backup';
const scenarios = [
  { name: 'monday', now: '2026-11-09T19:30:00+08:00',
    states: { ...calStates, 'input_number.family_jar': st('84'), 'input_datetime.fh_panel_seen': st('x', { timestamp: 0 }),
      'input_datetime.fh_med_riley_am': st('x', { timestamp: ts('2026-11-09T06:40:00+08:00') }), 'input_text.fh_med_riley_am_by': st('Alex'),
      'input_datetime.fh_med_charlie_am': st('x', { timestamp: ts('2026-11-09T00:00:00+08:00') }), 'input_text.fh_med_charlie_am_by': st('unknown'),
      'input_datetime.fh_med_late': st('x', { timestamp: ts('2026-11-08T21:40:00+08:00') }), 'input_text.fh_med_late_by': st('Sam') },
    responses: {
      cal: { 'calendar.family': { events: [ev('Dentist', '2026-11-10T15:30:00+08:00'), ev('Paediatrician review', '2026-11-10T11:00:00+08:00'), ev('Riley basketball', '2026-11-10T17:00:00+08:00')] },
        'calendar.sam': { events: [ev('Dentist', '2026-11-10T15:30:00+08:00'), ev('Night shift', '2026-11-09T22:00:00+08:00')] },
        'calendar.riley': { events: [ev('Swim squad', '2026-11-10T06:45:00+08:00')] },
        'calendar.holidays': { events: [ev('Melbourne Cup Day', '2026-11-10'), ev('Canberra thing', '2026-11-10'), ev('Remembrance week', '2026-11-10')] },
        'calendar.birthdays': { events: [ev('Nan’s birthday', '2026-11-10'), ev('Anniversary', '2026-11-10')] } },
      owed: { [OWED]: { items: [{ summary: 'Riley: Pick the family movie' }, { summary: 'Max: Dinosaur sticker' }] } },
      had: { [BACK]: { items: [{ summary: '2026-11-08', description: 'snap {"v":1,"d":"2026-11-08","jar":70,"kids":{},"owed":[]}' }, { summary: '2026-11-09', description: 'snap {"v":1,"d":"2026-11-09","jar":81,"kids":{},"owed":[]}' }] } } } },
  { name: 'friday', now: '2026-11-13T19:30:00+08:00',
    states: { ...calStates, 'input_number.family_jar': st('84'), 'input_datetime.fh_panel_seen': st('x', { timestamp: ts('2026-11-13T19:27:00+08:00') }),
      'input_datetime.fh_med_riley_am': st('x', { timestamp: ts('2026-11-13T06:31:00+08:00') }), 'input_text.fh_med_riley_am_by': st('Alex'),
      'input_datetime.fh_med_charlie_am': st('x', { timestamp: ts('2026-11-13T06:32:00+08:00') }), 'input_text.fh_med_charlie_am_by': st('Alex') },
    responses: { cal: Object.fromEntries(Object.keys(calStates).map((k) => [k, { events: [] }])), owed: { [OWED]: { items: [] } }, had: { [BACK]: { items: [{ summary: '2026-11-13', description: 'snap {"v":1,"d":"2026-11-13","jar":84,"kids":{},"owed":[]}' }] } } } },
  { name: 'sunday', now: '2026-11-15T19:30:00+08:00',
    states: { ...calStates, 'calendar.sam': st('unavailable'), 'input_number.family_jar': st('90'), 'input_datetime.fh_panel_seen': st('x', { timestamp: ts('2026-11-15T15:10:00+08:00') }),
      'input_datetime.fh_med_riley_am': st('x', { timestamp: ts('2026-11-14T06:31:00+08:00') }), 'input_text.fh_med_riley_am_by': st('Alex'),
      'input_datetime.fh_med_charlie_am': st('x', { timestamp: ts('2026-11-14T06:31:00+08:00') }), 'input_text.fh_med_charlie_am_by': st('Alex') },
    responses: { cal: { 'calendar.family': { events: [ev('Assembly', '2026-11-16T09:00:00+08:00')] } }, owed: null, had: { [BACK]: { items: [{ summary: '2026-11-15', description: null }] } } } },
  { name: 'busy', now: '2026-11-11T19:30:00+08:00', states: { ...calStates, 'input_datetime.fh_panel_seen': st('x', { timestamp: ts('2026-11-09T08:00:00+08:00') }) },
    responses: { cal: { 'calendar.family': { events: Array.from({ length: 11 }, (_, i) => ev(`Thing ${String.fromCharCode(65 + i)}`, `2026-11-12T${String(8 + i).padStart(2, '0')}:00:00+08:00`)) } }, owed: { [OWED]: { items: Array.from({ length: 6 }, (_, i) => ({ summary: `Riley: reward ${i + 1}` })) } } } },
  { name: 'unread', now: '2026-11-10T19:30:00+08:00', states: { ...calStates }, responses: { cal: null, owed: null, had: null } },
  { name: 'holiday', now: '2026-11-17T19:30:00+08:00', states: { ...calStates, 'input_datetime.fh_panel_seen': st('2026-11-17 00:00:00', { timestamp: ts('2026-11-17T00:00:00+08:00') }) }, responses: { cal: { 'calendar.family': { events: [] } } } },
  { name: 'out-of-term', now: '2026-12-14T19:30:00+08:00', states: { ...calStates }, responses: { cal: { 'calendar.family': { events: [] } } } },
  { name: 'together', now: '2026-11-11T19:30:00+08:00', states: { ...calStates }, responses: { cal: { 'calendar.family': { events: [ev('Charlie excursion', '2026-11-12T10:30:00+08:00')] } } }, automation: built.same },
  { name: 'bare', now: '2026-11-10T19:30:00+08:00', states: {}, responses: {}, automation: built.bare }
];
const py = spawnSync('python3', [path.join(ROOT, 'scripts/tests/digest_render.py')], { input: JSON.stringify({ automation: A, scenarios }), encoding: 'utf8' });
if (py.status !== 0 && /No module named|ENOENT|not found/i.test(String(py.stderr) + String(py.error ?? ''))) console.log('skip the digest’s words were NOT checked here: python3 with jinja2 is needed to render the template');
else {
  let R = {}; try { R = Object.fromEntries(JSON.parse(py.stdout).map((r) => [r.name, r])); } catch { /* reported below */ }
  ok('the stand-in for Home Assistant rendered every evening', Object.keys(R).length === scenarios.length && Object.values(R).every((r) => !r.error), Object.values(R).filter((r) => r.error).map((r) => `${r.name}: ${r.error}`).join(' | ') || String(py.stderr).slice(-300));
  const L = (n) => String(R[n]?.message ?? '').split('\n'), has = (n, re) => L(n).some((l) => re.test(l));
  const mon = L('monday');
  console.log('--- Monday 9 Nov, 7:30 pm ---\n' + (R.monday?.title ?? '') + '\n' + mon.join('\n') + '\n---');
  ok('the title says which day it is about', R.monday?.title === 'Tomorrow, Tuesday 10 November' && R.friday?.title === 'Tomorrow, Saturday 14 November', R.monday?.title);
  ok('it asks the calendars for tomorrow, midnight to midnight', /^2026-11-10T00:00:00/.test(R.monday?.asked[0].data.start_date_time) && /^2026-11-11T00:00:00/.test(R.monday?.asked[0].data.end_date_time), R.monday?.asked[0].data);
  ok('both phones get the same message', R.monday?.sent.length === 2 && R.monday.sent.every((s) => s.message === R.monday.message && s.title === R.monday.title && s.data.tag === 'family-hub-digest'));
  ok('events in time order, all-day first, with a child’s name on what is his', mon.indexOf('All day: Nan’s birthday') >= 0 && mon.indexOf('6:45 am Swim squad (Riley)') > mon.indexOf('All day: Remembrance week') && mon.indexOf('3:30 pm Dentist') > mon.indexOf('6:45 am Swim squad (Riley)') && mon.indexOf('5:00 pm Riley basketball') > mon.indexOf('3:30 pm Dentist'), mon);
  ok('the same event in two calendars is said once', mon.filter((l) => /Dentist/.test(l)).length === 1);
  ok('each calendar’s own word filter applies (hide, only)', !has('monday', /Melbourne Cup|Canberra|Anniversary/));
  ok('a private event keeps its time and loses its words', mon.includes('11:00 am Private event') && !has('monday', /Paediatrician/));
  ok('an event that began today is not given tomorrow’s time', mon.includes('Continues: Night shift'));
  ok('leaving times on a school day: an early event of his own pulls one child earlier, and says why', mon.includes('Leave by: 6:30 am Riley (Swim squad); 7:30 am Max; 7:50 am Charlie.'), mon.find((l) => /^Leave/.test(l)));
  ok('bin night tonight: the weekly bin and the one whose turn it is; a colour that is not a bin is left out', mon.includes('Bins out tonight: green and yellow.'), mon.find((l) => /^Bins/.test(l)));
  ok('medicine: only the daily one with no record today; a helper never set is not a dose; one not yet due is not chased', mon.includes('Medicine not recorded today: Charlie.'), mon.find((l) => /^Medicine/.test(l)));
  ok('rewards waiting are listed as the ledger has them', mon.includes('Rewards waiting: Riley: Pick the family movie; Max: Dinosaur sticker.'));
  ok('marbles added today is the jar less this morning’s snapshot', mon.includes('Marbles: 3 added today, 84 of 120.'), mon.find((l) => /^Marbles/.test(l)));
  ok('no warning on a good evening', !has('monday', /^Check:/));
  ok('a quiet Friday is one line: no leaving times before a Saturday, no bins, no medicine, no rewards, no marbles', R.friday?.message === 'Nothing in the calendars.', R.friday?.message);
  const sun = L('sunday');
  ok('a calendar that can’t be reached is named first, and “nothing on” is not claimed', sun[0] === 'Check: the Sam calendar can’t be reached, so tomorrow may be missing something.', sun[0]);
  ok('a wall panel that has gone quiet is reported with the time it was last seen', sun.includes('Check: the wall panel hasn’t checked in since 3:10 pm.'), sun.find((l) => /wall panel/.test(l)));
  ok('the rest of the calendars are still read', sun.includes('9:00 am Assembly'));
  ok('one leaving time when nobody leaves early… except the child with his own time', sun.includes('Leave by: 7:30 am Max; 7:50 am Riley and Charlie.'), sun.find((l) => /^Leave/.test(l)));
  ok('bins the night before: the other bin’s turn the following week', sun.includes('Bins out tomorrow night: green and red.'), sun.find((l) => /^Bins/.test(l)));
  ok('yesterday’s dose is not today’s', sun.includes('Medicine not recorded today: Riley and Charlie.'), sun.find((l) => /^Medicine/.test(l)));
  ok('a ledger or a snapshot that can’t be read costs only its own line', !has('sunday', /^Rewards|^Marbles/));
  const busy = L('busy');
  ok('a full day is cut at eight events with a count of the rest', busy.filter((l) => /Thing/.test(l)).length === 8 && busy.includes('+3 more'), busy.filter((l) => /more/.test(l)));
  ok('a long ledger is cut at four', busy.includes('Rewards waiting: Riley: reward 1; Riley: reward 2; Riley: reward 3; Riley: reward 4 (+2 more).'));
  ok('a panel last seen on another day is given its day', busy.includes('Check: the wall panel hasn’t checked in since Monday at 8:00 am.'), busy.find((l) => /wall panel/.test(l)));
  ok('a heartbeat no screen has ever stamped (it reads as midnight today) is not a panel that has stopped', !has('holiday', /wall panel/), L('holiday'));
  ok('calendars that could not be read at all are said so, not shown as an empty day', L('unread')[0] === 'Check: the calendars could not be read tonight.' && !has('unread', /Nothing in the calendars/), L('unread'));
  ok('no leaving times before a public holiday or out of term', !has('holiday', /leave/i) && !has('out-of-term', /leave/i) && has('holiday', /^Nothing in the calendars\.$/), [L('holiday'), L('out-of-term')]);
  ok('everyone leaving together is one plain line', L('together').includes('Everyone leaves by 7:50 am.') && !has('together', /^Bins|^Medicine/), L('together'));
  ok('a household with nothing configured still gets a message that is never empty', typeof R.bare?.sent?.[0]?.message === 'string' && R.bare.sent[0].message.trim().length > 0, R.bare?.sent?.[0]?.message);
  ok('no line could be mistaken by Home Assistant for a number or a list', Object.values(R).every((r) => typeof r.message === 'string' && typeof r.title === 'string'));
}

// 3. Settings: the phones, the time, and a save writes the automation
{ const page = await open('look=glass&page=planner&sheet=settings&pane=people');
  ok('Settings, People and safety has the digest’s card, with the phones Home Assistant knows', await D(page).count() === 1 && await D(page).locator('[data-dg]').count() === 2, await D(page).locator('[data-dg]').allInnerTexts());
  ok('with no phone chosen there is no time, no button and nothing in Home Assistant', await D(page).locator('.stime').count() === 0 && await D(page).locator('button.pill').count() === 0 && (await calls(page, /automation/)).length === 0);
  await D(page).locator('[data-dg="notify.mobile_app_alex"]').click(); await page.waitForTimeout(200);
  ok('choosing a phone offers the time (7:30 pm) and says a save is what tells Home Assistant', (await D(page).locator('.stime').innerText()).replace(/\s/g, ' ').trim() === '7:30 pm' && /Save, and Home Assistant is told/.test(await D(page).locator('[data-dg-state]').innerText()), await D(page).locator('.stime').innerText());
  ok('nothing is written before the save', (await calls(page, /api\.POST config\/automation/)).length === 0);
  await save(page);
  const posted = await page.evaluate(() => ({ calls: (window.__calls ?? []).filter((c) => /api\.POST config\/automation/.test(c)), body: window.__digest, cfg: document.querySelector('family-hub-card')._config.digest }));
  ok('the save writes the card’s setting and the one automation', posted.calls.join() === 'api.POST config/automation/config/family_hub_digest' && posted.body?.id === 'family_hub_digest' && posted.body.triggers[0].at === '19:30:00' && JSON.stringify(posted.cfg) === '{"notify":["notify.mobile_app_alex"]}', [posted.calls, posted.cfg]);
  ok('the save’s own message stands (the digest is quiet when it works)', /^Saved: People and safety\.$/.test(await toast(page)), await toast(page));
  const row = D(page).locator('.srow').last();
  ok('the card now says it is on and when, and offers “Send one now”', /On: every night at 7:30 pm/.test(await row.innerText()) && /Not sent yet/.test(await row.innerText()) && await D(page).locator('[data-act="dg-now"]').count() === 1 && await D(page).locator('[data-act="dg-sync"]').count() === 0, await row.innerText());
  await page.evaluate(() => { window.__calls = []; }); await D(page).locator('[data-act="dg-now"]').click(); await page.waitForTimeout(500);
  ok('“Send one now” runs the automation in Home Assistant, and says so', (await calls(page, /automation\.trigger automation\.family_hub_evening_digest/)).length === 1 && /^Sent\./.test(await toast(page)) && /Last sent/.test(await row.innerText()), [await calls(page, /automation/), await toast(page)]);
  // a change elsewhere that changes what the digest says rewrites it; one that does not, does not
  await page.evaluate(() => { window.__calls = []; }); await S(page).getByRole('switch', { name: 'Look up places on the internet' }).click(); await page.waitForTimeout(200); await save(page);
  ok('a save that changes nothing the digest says does not rewrite it', (await calls(page, /api\.POST config\/automation/)).length === 0 && /^Saved/.test(await toast(page)), await calls(page, /api\.POST/));
  await S(page).locator('.snav button[data-pane="house"]').click(); await page.waitForTimeout(300);
  const binDay = S(page).getByRole('group', { name: 'Night the bins go out' }).getByRole('button', { name: 'Wed' });
  if (await binDay.count()) { await binDay.click(); await page.waitForTimeout(200); await save(page);
    ok('a save that does (bin night moved) rewrites it at once', (await calls(page, /api\.POST config\/automation\/config\/family_hub_digest/)).length === 1, await calls(page, /api\.POST/)); }
  else ok('a save that does (bin night moved) rewrites it at once: the bin-night control was found', false);
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&digest=1&sheet=settings&pane=people');
  ok('named in the configuration but not yet in Home Assistant: the card offers “Set it up”', /Not set up in Home Assistant yet/.test(await D(page).innerText()) && await D(page).locator('[data-act="dg-sync"]').innerText() === 'Set it up');
  await page.evaluate(() => { window.__autoFail = true; }); await D(page).locator('[data-act="dg-sync"]').click(); await page.waitForTimeout(500);
  ok('Home Assistant refusing is said plainly and nothing is claimed', /would not save the evening digest/.test(await toast(page)) && /Not set up in Home Assistant yet/.test(await D(page).innerText()), await toast(page));
  await page.evaluate(() => { window.__autoFail = false; }); await page.waitForTimeout(300); await D(page).locator('[data-act="dg-sync"]').click(); await page.waitForTimeout(600);
  ok('“Set it up” makes it, switched on, and says when the first one comes', /^Set up\. The first one comes at 7:30 pm\.$/.test(await toast(page)) && /On: every night at 7:30 pm/.test(await D(page).innerText()), await toast(page));
  // the settings move on without a save through Settings (YAML): the card notices and offers to update
  await page.evaluate(() => { window.__digest = { ...window.__digest, triggers: [{ trigger: 'time', at: '18:00:00' }] }; });
  await S(page).locator('.snav button[data-pane="advanced"]').click(); await page.waitForTimeout(200);
  await page.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings'); s._dgHeld = undefined; }); await S(page).locator('.snav button[data-pane="people"]').click(); await page.waitForTimeout(500);
  ok('an automation that no longer matches the settings is called out, with “Update it”', /The settings have changed since it was written/.test(await D(page).innerText()) && await D(page).locator('[data-act="dg-sync"]').innerText() === 'Update it', await D(page).innerText());
  await D(page).locator('[data-act="dg-sync"]').click(); await page.waitForTimeout(600);
  ok('“Update it” rewrites it from the settings', await page.evaluate(() => window.__digest.triggers[0].at) === '19:30:00' && await D(page).locator('[data-act="dg-sync"]').count() === 0, await toast(page));
  // taking the last phone away and saving switches it off; it is not deleted
  await D(page).locator('[data-dg="notify.mobile_app_alex"]').click(); await page.waitForTimeout(200);
  ok('with the last phone unticked the card says a save stops it', /Save, and Home Assistant stops sending it/.test(await D(page).innerText()));
  await page.evaluate(() => { window.__calls = []; }); await save(page);
  ok('saving with no phone switches the automation off', (await calls(page, /automation\.turn_off automation\.family_hub_evening_digest/)).length === 1 && await page.evaluate(() => document.querySelector('family-hub-card').hass.states['automation.family_hub_evening_digest'].state) === 'off' && await page.evaluate(() => document.querySelector('family-hub-card')._config.digest) === undefined, await calls(page, /automation/));
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&digest=two&dgtime=18:45&sheet=settings&pane=people');
  ok('the saved time and both phones show in Settings', (await D(page).locator('.stime').innerText()).replace(/\s/g, ' ').trim() === '6:45 pm' && await D(page).locator('[data-dg][aria-pressed="true"]').count() === 2);
  ok('nothing about the digest is on the panel itself: no chip, no dock button, no sheet', await page.evaluate(() => { const c = document.querySelector('family-hub-card'); return !/digest/i.test([...c.shadowRoot.querySelectorAll('header, nav')].map((n) => n.textContent).join(' ')); }));
  await page.context().close(); }

await browser.close(); srv.close();
console.log(`\n${pass} passed, ${fails.length} failed${errs.length ? `, ${errs.length} page errors` : ''}`);
for (const f of fails) console.log('FAILED: ' + f);
for (const e of [...new Set(errs)].slice(0, 10)) console.log('ERROR: ' + e);
process.exit(fails.length || errs.length ? 1 : 0);
