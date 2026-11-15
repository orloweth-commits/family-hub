// F4, spoken cues: Home Assistant says a short line on a child's OWN speaker when the school morning starts, ten minutes before
// he leaves and when his wind-down starts; never in a shared room, never after his bedtime, off until switched on for that child,
// through the announce script, under the house voice's daily allowance. Settings, Children, switches it on and a save writes
// the automation. "Start with me" is a two-minute wedge on the job he is on now; it ticks nothing.
// The automation is rendered by the stand-in (scripts/tests/digest_render.py); the real thing is tried on the live system.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4873] node scripts/tests/cues.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4873);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, touch = true) => { const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: touch }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404|no-such-sound/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const C = (page) => page.locator('family-hub-card');
const K = (page) => page.locator('family-hub-card fh-kid');
const S = (page) => page.locator('fh-settings');
const Q = (page) => S(page).locator('[data-card="cues"]');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re.source);
const msg = async (page) => (await K(page).evaluate((k) => k._msg)) ?? '';
const toast = async (page) => ((await S(page).locator('.toast').count()) ? (await S(page).locator('.toast span').first().innerText()).trim() : '');
const sw = (page, name) => Q(page).getByRole('switch', { name, exact: true });
const save = async (page) => { await S(page).locator('.sft [data-act="save"]').click(); await page.waitForTimeout(900); };

// 1. the automation Home Assistant runs
const MAP = [{ name: 'Up', rooms: [{ name: 'Riley', player: 'media_player.riley_room', kids: ['Riley'] }, { name: 'Shared', player: 'media_player.shared_room', kids: ['Charlie', 'Max'] }, { name: 'Sam', player: 'media_player.sam_room', kids: ['Sam'] }] },
  { name: 'Down', rooms: [{ name: 'Kitchen and lounge', zones: [{ name: 'Kitchen', player: 'media_player.kitchen' }, { name: 'Lounge', player: 'media_player.lounge' }] }, { name: 'Office', player: 'media_player.office' }] }];
const kid = (name, extra = {}) => ({ name, colour: 3, bedtime: '20:00', leave_by: '07:50', ...extra });
const HOUSE = { type: 'x', music_map: MAP, morning: { start: '06:30', end: '08:45' }, school_terms: [['2026-10-12', '2026-12-10']], public_holidays: ['2026-11-11'],
  voice: { tts: 'tts.demo', voice: 'v', count: 'input_number.fh_voice_chars', daily_chars: 200 },
  kids: [kid('Riley', { cues: { on: true, speaker: 'media_player.riley_room' } }), kid('Charlie', { cues: { on: true, speaker: 'media_player.shared_room' } }), kid('Max', { bedtime: '19:30', cues: { on: true, speaker: 'media_player.kitchen' } }), kid('Sam', { cues: { speaker: 'media_player.sam_room' } })] };
const page0 = await open('look=glass&page=planner');
const built = await page0.evaluate((house) => { const F = customElements.get('family-hub-card'), h = F.cues.haCues, on = (i, c) => ({ ...house, kids: house.kids.map((k, n) => (n === i ? { ...k, cues: c } : k)) });
  return { house: h(house), none: h({ ...house, kids: house.kids.map((k) => ({ ...k, cues: { ...k.cues, on: false } })) }), own: document.querySelector('family-hub-card').cuesSetup(),
    two: h(on(3, { on: true, speaker: 'media_player.sam_room' })), same: h(on(3, { on: true, speaker: 'media_player.riley_room' })), zone: h({ ...house, kids: [{ ...house.kids[0], cues: { on: true, speaker: 'media_player.office' } }] }),
    nomap: h({ ...house, music_map: undefined }), flat: h({ ...house, bedtime_weekend_extra: 0 }), only: h(on(0, { on: true, speaker: 'media_player.riley_room', morning: false, leave: false })), nocount: h({ ...house, voice: undefined }),
    block: house.kids.map((k) => F.cues.cueBlock(house, k)),
    bad: [{ cues: 3 }, { cues: { script: 'x' } }, { cues: { volume: 3 } }, { kids: [{ name: 'A', colour: 1, cues: { speaker: 'light.x' } }] }].map((d) => { try { document.createElement('family-hub-card').setConfig({ type: 'x', ...d }); return ''; } catch (e) { return String(e.message); } }) }; }, HOUSE);
await page0.context().close();
const AU = built.house, trig = (a) => Object.fromEntries((a?.triggers ?? []).map((t) => [t.id, t.at ?? t.event_type]));
ok('one automation, with a time for each cue of each child whose cues are on', AU?.alias === 'Family Hub: spoken cues' && JSON.stringify(trig(AU)) === JSON.stringify({ morning: '06:30:00', leave_0: '07:40:00', wind_0_a: '19:00:00', wind_0_b: '19:30:00', try: 'family_hub_cue' }), trig(AU));
ok('a child in a shared room, a child given a shared space’s speaker and a child whose cues are off get none', (AU?.actions?.[0]?.variables?.KIDS ?? '').includes('"n":"Riley"') && !/Charlie|Max|Sam/.test(AU.actions[0].variables.KIDS), AU?.actions?.[0]?.variables?.KIDS);
ok('Settings is told why, in words', built.block[0] === '' && /no room of his own/.test(built.block[1]) && /no room of his own/.test(built.block[2]), built.block);
ok('with no child switched on there is no automation at all (and the sample house has none)', built.none === null && built.own === null);
ok('two children who name the same speaker: neither is spoken to', built.same === null);
ok('a speaker in a shared space cannot be a child’s own, whatever the settings say', built.zone === null);
ok('with no Music map there is no room that is his alone, so no cues', built.nomap === null);
ok('with no later bedtime at the weekend there is one wind-down time', JSON.stringify(Object.keys(trig(built.flat))) === JSON.stringify(['morning', 'leave_0', 'wind_0_x', 'try']), Object.keys(trig(built.flat)));
ok('a cue switched off has no time', JSON.stringify(Object.keys(trig(built.only))) === JSON.stringify(['wind_0_a', 'wind_0_b', 'try']), Object.keys(trig(built.only)));
ok('a cues setting of the wrong shape is refused in words', built.bad.every((m) => /^Family Hub: /.test(m) && /cues/.test(m)), built.bad);
const st = (state, extra = {}) => ({ state, attributes: {}, ...extra });
const SP = { 'media_player.riley_room': st('idle'), 'media_player.sam_room': st('idle'), 'input_number.fh_voice_chars': st('0', { last_changed: '2026-11-10T05:00:00+08:00' }) };
const sc = (name, now, id, states = SP, automation = AU) => ({ name, now, states, vars: { trigger: id.startsWith('ev:') ? { platform: 'event', id: 'try', event: { data: { cue: id.slice(3) } } } : { platform: 'time', id } }, automation });
const scenarios = [
  sc('morning', '2026-11-10T06:30:00+08:00', 'morning'),
  sc('saturday', '2026-11-14T06:30:00+08:00', 'morning'),
  sc('holiday', '2026-11-11T06:30:00+08:00', 'morning'),
  sc('out-of-term', '2026-12-15T06:30:00+08:00', 'morning'),
  sc('leave', '2026-11-10T07:40:00+08:00', 'leave_0'),
  sc('leave-sat', '2026-11-14T07:40:00+08:00', 'leave_0'),
  sc('wind', '2026-11-10T19:00:00+08:00', 'wind_0_a'),
  sc('wind-late-on-weekday', '2026-11-10T19:30:00+08:00', 'wind_0_b'),
  sc('wind-fri-early', '2026-11-13T19:00:00+08:00', 'wind_0_a'),
  sc('wind-fri', '2026-11-13T19:30:00+08:00', 'wind_0_b'),
  sc('wind-sunday', '2026-11-15T19:00:00+08:00', 'wind_0_a'),
  sc('after-bed', '2026-11-10T20:05:00+08:00', 'ev:wind_0_a'),
  sc('at-bed', '2026-11-10T20:00:00+08:00', 'ev:wind_0_a'),
  sc('small-hours', '2026-11-10T04:00:00+08:00', 'ev:morning'),
  sc('try', '2026-11-10T16:00:00+08:00', 'ev:wind_0_a'),
  sc('junk-event', '2026-11-10T16:00:00+08:00', 'ev:all_speakers'),
  sc('junk-id', '2026-11-10T16:00:00+08:00', 'something'),
  sc('other-index', '2026-11-10T07:40:00+08:00', 'leave_5'),
  sc('spent', '2026-11-10T06:30:00+08:00', 'morning', { ...SP, 'input_number.fh_voice_chars': st('190', { last_changed: '2026-11-10T06:00:00+08:00' }) }),
  sc('yesterdays-count', '2026-11-10T06:30:00+08:00', 'morning', { ...SP, 'input_number.fh_voice_chars': st('190', { last_changed: '2026-11-09T18:00:00+08:00' }) }),
  sc('speaker-gone', '2026-11-10T06:30:00+08:00', 'morning', { ...SP, 'media_player.riley_room': st('unavailable') }),
  sc('two', '2026-11-10T06:30:00+08:00', 'morning', SP, built.two),
  sc('two-wind', '2026-11-10T19:00:00+08:00', 'wind_1_a', SP, built.two),
  sc('no-count', '2026-11-10T06:30:00+08:00', 'morning', SP, built.nocount)
];
const py = spawnSync('python3', [path.join(ROOT, 'scripts/tests/digest_render.py')], { input: JSON.stringify({ automation: AU, scenarios }), encoding: 'utf8' });
if (py.status !== 0 && /No module named|ENOENT|not found/i.test(String(py.stderr) + String(py.error ?? ''))) console.log('skip the automation’s cues were NOT checked here: python3 with jinja2 is needed to render its templates');
else {
  let R = {}; try { R = Object.fromEntries(JSON.parse(py.stdout).map((r) => [r.name, r])); } catch { /* reported below */ }
  ok('the stand-in for Home Assistant ran every case', Object.keys(R).length === scenarios.length && Object.values(R).every((r) => !r.error), Object.values(R).filter((r) => r.error).map((r) => `${r.name}: ${r.error}`).join(' | ') || String(py.stderr).slice(-400));
  const said = (n) => (R[n]?.sent ?? []).filter((s) => s.to === 'script.fh_announce'), counted = (n) => (R[n]?.sent ?? []).filter((s) => s.to === 'input_number.set_value');
  const quiet = (n) => said(n).length === 0 && counted(n).length === 0;
  const m = said('morning')[0];
  ok('a school morning: one line, to him by name', said('morning').length === 1 && m.message === 'Good morning, Riley. Time to start your morning jobs.', said('morning'));
  ok('on his own speaker and no other, at the set gentle volume, and never “everywhere”', JSON.stringify(m?.speakers) === '["media_player.riley_room"]' && m.volume === 0.4 && !('everywhere' in m), m);
  ok('the house voice’s count goes up by the length of what was said', counted('morning').length === 1 && counted('morning')[0].value === m.message.length && counted('morning')[0].target.entity_id === 'input_number.fh_voice_chars', counted('morning'));
  ok('not on a Saturday, a public holiday or outside term', quiet('saturday') && quiet('holiday') && quiet('out-of-term') && quiet('leave-sat'), [R.saturday?.stopped, R.holiday?.stopped, R['out-of-term']?.stopped]);
  ok('ten minutes before he leaves', said('leave').length === 1 && said('leave')[0].message === 'Riley, ten minutes until it is time to leave.' && JSON.stringify(said('leave')[0].speakers) === '["media_player.riley_room"]', said('leave'));
  ok('wind-down: an hour before bedtime on a school night', said('wind').length === 1 && said('wind')[0].message === 'Riley, it is wind-down time. One hour until bed.' && quiet('wind-late-on-weekday'), [said('wind'), said('wind-late-on-weekday')]);
  ok('and at the later time on a Friday, once', quiet('wind-fri-early') && said('wind-fri').length === 1, [said('wind-fri-early'), said('wind-fri')]);
  ok('wind-down is spoken on a Sunday too (it is not a school-morning cue)', said('wind-sunday').length === 1);
  ok('never at or after his bedtime, and never before 5 am, even when tried by hand', quiet('after-bed') && quiet('at-bed') && quiet('small-hours'), [R['after-bed']?.stopped, R['small-hours']?.stopped]);
  ok('a cue tried by hand goes through the same rules and speaks', said('try').length === 1 && JSON.stringify(said('try')[0].speakers) === '["media_player.riley_room"]');
  ok('an event that names anything else, or another trigger, is ignored', R['junk-event']?.skipped === true && R['junk-id']?.skipped === true, [R['junk-event'], R['junk-id']]);
  ok('a time for a child who is not in the list speaks to nobody', quiet('other-index'));
  ok('past the day’s allowance the cue is not spoken and nothing is counted', quiet('spent'), R.spent?.sent);
  ok('yesterday’s count is not today’s: the cue is spoken and the count starts again', said('yesterdays-count').length === 1 && counted('yesterdays-count')[0]?.value === m.message.length, counted('yesterdays-count'));
  ok('a speaker Home Assistant cannot reach is not spoken to', quiet('speaker-gone'));
  const two = said('two');
  ok('two children, each with a room of his own: each hears his own line on his own speaker', two.length === 2 && /Riley/.test(two[0].message) && JSON.stringify(two[0].speakers) === '["media_player.riley_room"]' && /Sam/.test(two[1].message) && JSON.stringify(two[1].speakers) === '["media_player.sam_room"]', two);
  ok('and one child’s wind-down time speaks only to him', said('two-wind').length === 1 && /Sam/.test(said('two-wind')[0].message) && JSON.stringify(said('two-wind')[0].speakers) === '["media_player.sam_room"]', said('two-wind'));
  ok('with no shared count the cue is spoken and nothing is counted', said('no-count').length === 1 && counted('no-count').length === 0);
  ok('no cue ever names a shared speaker', Object.values(R).flatMap((r) => r.sent ?? []).every((s) => s.to !== 'script.fh_announce' || (s.speakers.length === 1 && ['media_player.riley_room', 'media_player.sam_room'].includes(s.speakers[0]))));
}

// 2. Settings, Children
{ const page = await open('look=glass&page=planner&sheet=settings&pane=children');
  ok('the first child has a room of his own: a card with one switch, off', await Q(page).count() === 1 && await sw(page, 'Spoken cues').getAttribute('aria-checked') === 'false' && await Q(page).getByRole('switch').count() === 1, await Q(page).innerText().catch(() => ''));
  await sw(page, 'Spoken cues').click(); await page.waitForTimeout(250);
  ok('switched on, each cue has its own switch and says its words and time', await Q(page).getByRole('switch').count() === 4 && /Good morning, Riley/.test(await Q(page).innerText()) && /ten minutes until it is time to leave/.test(await Q(page).innerText()) && /One hour until bed/.test(await Q(page).innerText()) && /7:00 pm/.test(await Q(page).innerText()), await Q(page).innerText());
  ok('nothing is made before the save', (await calls(page, /api\.POST/)).length === 0);
  await save(page);
  const made = await page.evaluate(() => ({ calls: (window.__calls ?? []).filter((c) => /api\.POST/.test(c)), body: window.__cues, cfg: document.querySelector('family-hub-card')._config.kids[0].cues }));
  ok('the save writes the cues automation, and only that', made.calls.join() === 'api.POST config/automation/config/family_hub_cues' && made.body?.id === 'family_hub_cues' && made.body.triggers.length === 5, made.calls);
  ok('with his own room’s speaker', JSON.stringify(made.cfg) === '{"on":true,"speaker":"media_player.rileys_homepod"}' && made.body.actions[0].variables.KIDS.includes('media_player.rileys_homepod'), made.cfg);
  ok('the card says it is on', /^On\.$/.test((await Q(page).locator('[data-cue="state"]').innerText()).trim()), await Q(page).locator('[data-cue="state"]').innerText().catch(() => ''));
  await sw(page, 'Before leaving').click(); await page.waitForTimeout(200); await page.evaluate(() => { window.__calls = []; }); await save(page);
  ok('switching one cue off and saving rewrites it without that time', (await calls(page, /api\.POST config\/automation\/config\/family_hub_cues/)).length === 1 && await page.evaluate(() => window.__cues.triggers.every((t) => !String(t.id).startsWith('leave'))));
  await sw(page, 'Spoken cues').click(); await page.waitForTimeout(200); await page.evaluate(() => { window.__calls = []; }); await save(page);
  ok('switching his cues off and saving switches the automation off', (await calls(page, /automation\.turn_off automation\.family_hub_spoken_cues/)).length === 1 && (await calls(page, /api\.POST/)).length === 0, await calls(page, /automation|api\./));
  // a child who shares a room
  await S(page).locator('.schips[aria-label="Which child"] button').filter({ hasText: 'Charlie' }).click(); await page.waitForTimeout(300);
  ok('a child who shares a room has no switch, and is told why', await Q(page).getByRole('switch').count() === 0 && /no room of his own/.test(await Q(page).locator('[data-cue="none"]').innerText()), await Q(page).innerText());
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&twin=1&sheet=settings&pane=children');
  await sw(page, 'Spoken cues').click(); await page.waitForTimeout(250);
  const chips = Q(page).locator('[data-spk]');
  ok('a speaker Home Assistant has under two names: both are offered, the other name first and chosen', await chips.count() === 2 && await chips.first().getAttribute('data-spk') === 'media_player.rileys_rileys_homepod' && await chips.first().getAttribute('aria-pressed') === 'true', await chips.evaluateAll((b) => b.map((x) => x.getAttribute('data-spk'))));
  ok('no other speaker in the house is offered', (await chips.evaluateAll((b) => b.map((x) => x.getAttribute('data-spk')))).every((e) => /rileys/.test(e)));
  await page.evaluate(() => { window.__autoFail = true; }); await save(page);
  ok('Home Assistant refusing is said plainly', /would not set up the spoken cues/.test(await toast(page)), await toast(page));
  await page.context().close(); }

// 3. "Start with me": two minutes on the job he is on now
{ const page = await open('look=glass&page=kid&kid=0&nownext=1&voice=1', false);
  const wedge = K(page).locator('[data-act="wedge"]');
  ok('the job he is on now, and only that one, offers “Start with me”', await wedge.count() === 1 && /Start with me/.test(await wedge.innerText()) && await K(page).locator('.job.row.now [data-act="wedge"]').count() === 1, await wedge.count());
  const now = K(page).locator('.job.row.now'), name = (await now.locator('.t.content').innerText()).trim(), pts = await page.evaluate(() => document.querySelector('family-hub-card').hass.states['input_number.riley_points'].state);
  await wedge.click(); await page.waitForTimeout(400);
  ok('a tap starts two minutes on that job, and says so', await now.locator('.play.going[data-wedge]').count() === 1 && /^[12]:\d\d$/.test((await now.locator('.play.going span').innerText()).trim()) && new RegExp(`^Two minutes\\. Let’s start: ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.$`).test(await msg(page)), [await msg(page), await now.locator('.play.going span').innerText().catch(() => '')]);
  ok('nothing is ticked and no points move', await now.locator('.hit').getAttribute('aria-pressed') === 'false' && (await calls(page, /fh_add_points|todo\.update_item/)).length === 0);
  ok('a child whose cues are off is not spoken to', (await calls(page, /tts_get_url/)).length === 0);
  ok('while it runs no second one is offered', await K(page).locator('[data-act="wedge"]').count() === 0);
  await page.clock.runFor('01:58'); await page.waitForFunction(() => /^Two minutes done/.test(document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid')._msg ?? ''), null, { timeout: 8000 }).catch(() => {});
  ok('when the two minutes are up it says so, ticks nothing, and the button is back', /^Two minutes done\. You’ve started: keep going!$/.test(await msg(page)) && await now.locator('.hit').getAttribute('aria-pressed') === 'false' && await K(page).locator('[data-act="wedge"]').count() === 1 && await page.evaluate(() => document.querySelector('family-hub-card').hass.states['input_number.riley_points'].state) === pts, [await msg(page), await now.locator('.hit').getAttribute('aria-pressed'), await K(page).locator('[data-act="wedge"]').count(), await K(page).evaluate((k) => JSON.stringify(k._practice))]);
  await K(page).locator('[data-act="wedge"]').click(); await page.waitForTimeout(300); await now.locator('.play.going').click(); await page.waitForTimeout(300);
  ok('a tap on the running wedge stops it', await now.locator('.play.going').count() === 0 && await K(page).locator('[data-act="wedge"]').count() === 1);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0&nownext=1&voice=1&cues=1', false);
  await K(page).locator('[data-act="wedge"]').click(); await page.waitForTimeout(900);
  ok('a child whose cues are on hears it start, in the house voice', (await calls(page, /tts_get_url.*Two minutes/)).length === 1, await calls(page, /tts_get_url/));
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0', false);
  ok('with the whole list showing there is still only one, on the job that is now', await K(page).locator('[data-act="wedge"]').count() <= 1 && await K(page).locator('.job.row:not(.now) [data-act="wedge"]').count() === 0, await K(page).locator('[data-act="wedge"]').count());
  ok('a timed job keeps its own timer and gets no wedge', await K(page).locator('.job.row').filter({ hasText: /practice/i }).locator('[data-act="wedge"]').count() === 0);
  await page.context().close(); }

await browser.close(); srv.close();
console.log(`\n${pass} passed, ${fails.length} failed${errs.length ? `, ${errs.length} page errors` : ''}`);
for (const f of fails) console.log('FAILED: ' + f);
for (const e of [...new Set(errs)].slice(0, 10)) console.log('ERROR: ' + e);
process.exit(fails.length || errs.length ? 1 : 0);
