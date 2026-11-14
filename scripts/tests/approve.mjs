// F3 item 2, approve from a phone: a reward that needs a grown-up can be sent to a parent's phone from the child's page; nothing is
// spent until the answer; the page says it is waiting and then what was said; the PIN at the wall still works; Home Assistant's
// automation (rendered by the stand-in, scripts/tests/digest_render.py) takes the points and writes the ledger only for a real,
// affordable, unanswered ask; Settings sets it up on a save.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4862] node scripts/tests/approve.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4862);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs) => { const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const K = (page) => page.locator('family-hub-card fh-kid');
const S = (page) => page.locator('fh-settings');
const A = (page) => S(page).locator('[data-card="approve"]');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re.source);
const state = (page, id) => page.evaluate((e) => document.querySelector('family-hub-card').hass.states[e]?.state, id);
const list = (page, id) => page.evaluate((e) => document.querySelector('family-hub-card').hass.callWS({ type: 'todo/item/list', entity_id: e }).then((r) => r.items.map((x) => ({ uid: x.uid, summary: x.summary, description: x.description, status: x.status }))), id);
const msg = async (page) => (await K(page).evaluate((k) => k._msg)) ?? '';
const toast = async (page) => ((await S(page).locator('.toast').count()) ? (await S(page).locator('.toast span').first().innerText()).trim() : '');
const pin = async (page) => { for (const d of '1234') await K(page).locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500); };
const row = (page, name) => K(page).locator('.rw').filter({ hasText: name });
const ASKS = 'todo.family_hub_asks', OWED = 'todo.rewards_owed', PTS = 'input_number.riley_points';
const rich = (page) => page.evaluate(async () => { const c = document.querySelector('family-hub-card'); await c.hass.callService('input_number', 'set_value', { value: 300 }, { entity_id: 'input_number.riley_points' }); await c.updateComplete; });
// what Home Assistant does when the phone answers, done here by hand on the pretend lists
const answer = (page, verdict) => page.evaluate(async (v) => { const c = document.querySelector('family-hub-card'), h = c.hass, items = (await h.callWS({ type: 'todo/item/list', entity_id: 'todo.family_hub_asks' })).items, it = items.find((x) => x.status === 'needs_action');
  await h.callService('todo', 'update_item', { item: it.uid, status: 'completed', description: it.description.replace(/^ask /, v + ' ') }, { entity_id: 'todo.family_hub_asks' }); }, verdict);

// 1. the child's page
{ const page = await open('look=glass&page=kid&kid=0&approve=1&shuffle=0'); await rich(page); await page.waitForTimeout(300);
  const big = row(page, 'Pick the family movie'), small = row(page, 'Extra screen time');
  await small.click(); await page.waitForTimeout(250);
  ok('a small reward is as before: “Spend 50 points?”, no phone', await K(page).locator('.rw.ask[data-ask]').count() === 0 && /Spend 50 points/.test(await K(page).locator('.rw.ask').innerText()), await K(page).locator('.rw.ask').innerText().catch(() => ''));
  await K(page).locator('.rw.ask .save').click(); await page.waitForTimeout(200);
  await big.click(); await page.waitForTimeout(250);
  const ask = K(page).locator('.rw.ask[data-ask]');
  ok('a big reward offers to ask a grown-up: Ask, the PIN for one standing here, or Not now', await ask.count() === 1 && /Ask a grown-up\?/.test(await ask.innerText()) && await ask.locator('button').count() === 3 && await K(page).locator('fh-pin').count() === 0, await ask.innerText().catch(() => ''));
  ok('nothing has been sent or spent by looking', (await calls(page, /^notify\.|fh_add_points|todo\.add_item todo\.(family_hub_asks|rewards_owed)/)).length === 0 && Number(await state(page, PTS)) === 300, await state(page, PTS));
  await ask.locator('[data-act="ask-no"]').click(); await page.waitForTimeout(200);
  ok('“Not now” puts the row back', await K(page).locator('.rw.ask').count() === 0);
  await big.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-send"]').click(); await page.waitForTimeout(600);
  const sent = await calls(page, /^notify\.mobile_app_alex/), items = await list(page, ASKS), rec = JSON.parse((items[0]?.description ?? 'ask {}').slice(4));
  ok('“Ask” writes one line to the asks list', items.length === 1 && items[0].summary === 'Riley: Pick the family movie' && items[0].status === 'needs_action' && /^ask \{/.test(items[0].description) && rec.v === 1 && rec.k === 'reward' && rec.kid === 'riley' && rec.cost === 100 && /^a[a-z0-9]{6}$/.test(rec.id), items);
  ok('and sends the phone one notice', sent.length === 1 && /Riley would like a reward/.test(sent[0]), sent);
  const full = await page.evaluate(() => window.__notified?.slice(-1)[0] ?? null);
  ok('no points are spent and the ledger is untouched until a grown-up answers', await state(page, PTS) === '300' && (await list(page, OWED)).length === 0 && (await calls(page, /fh_add_points/)).length === 0);
  ok('the page says it has asked', /^Asked! A grown-up will answer on their phone\.$/.test(await msg(page)), await msg(page));
  ok('the reward’s row and a line above the list say it is waiting', (await K(page).locator('[data-asks]').innerText()).includes('Asked a grown-up: Pick the family movie') && await big.locator('[data-asked]').count() === 1, await K(page).locator('[data-asks]').innerText().catch(() => ''));
  await big.click(); await page.waitForTimeout(250);
  ok('asking again for the same thing does not send a second notice', (await calls(page, /^notify\./)).length === 1 && (await list(page, ASKS)).length === 1 && /^Asked\. Waiting for a grown-up/.test(await msg(page)), await msg(page));
  // not yet
  await answer(page, 'no'); await page.waitForTimeout(600);
  ok('“Not yet” is told kindly, costs nothing, and clears the waiting line', /^Not yet for Pick the family movie\. Your points are safe\.$/.test(await msg(page)) && await K(page).locator('[data-asks]').count() === 0 && await state(page, PTS) === '300', await msg(page));
  ok('the answered line is cleared from the list', (await list(page, ASKS)).length === 0, await list(page, ASKS));
  // approve
  await big.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-send"]').click(); await page.waitForTimeout(500);
  await answer(page, 'ok'); await page.waitForTimeout(600);
  ok('“Approve” is told as a yes', /^A grown-up said yes: Pick the family movie\.$/.test(await msg(page)) && await K(page).locator('[data-asks]').count() === 0, await msg(page));
  ok('the page itself spends nothing for a yes (Home Assistant has already taken the points)', (await calls(page, /fh_add_points/)).length === 0);
  // short
  await big.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-send"]').click(); await page.waitForTimeout(500);
  await answer(page, 'short'); await page.waitForTimeout(600);
  ok('a yes that came after the points were gone is said plainly', /^Not enough points for Pick the family movie now\. Nothing was spent\.$/.test(await msg(page)), await msg(page));
  // a grown-up at the wall
  await big.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-here"]').click(); await page.waitForTimeout(300);
  ok('a grown-up standing there can still use the PIN', await K(page).locator('fh-pin').count() === 1);
  await pin(page); await page.waitForTimeout(600);
  ok('and the PIN spends at once, as before', await state(page, PTS) === '200' && (await list(page, OWED)).some((x) => x.summary === 'Riley: Pick the family movie'), [await state(page, PTS), await list(page, OWED)]);
  // a phone that will not take it
  await page.evaluate(() => { window.__notifyFail = true; }); const paint = row(page, 'Warhammer paint pot');
  await paint.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-send"]').click(); await page.waitForTimeout(500);
  ok('when no phone takes the message the child is sent to find a grown-up (the ask stays on the list for the digest)', /no phone took the message\. Find a grown-up\.$/.test(await msg(page)) && (await list(page, ASKS)).length === 1, await msg(page));
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0&shuffle=0'); await rich(page); await page.waitForTimeout(300);
  await row(page, 'Pick the family movie').click(); await page.waitForTimeout(300);
  ok('with no phone named, a big reward goes straight to the PIN, as before', await K(page).locator('fh-pin').count() === 1 && await K(page).locator('.rw.ask[data-ask]').count() === 0);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0&approve=nolist&shuffle=0'); await rich(page); await page.waitForTimeout(300);
  await row(page, 'Pick the family movie').click(); await page.waitForTimeout(300);
  ok('a phone named but nothing set up in Home Assistant yet: the PIN, not an ask that could never be answered', await K(page).locator('fh-pin').count() === 1);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=2&approve=1'); 
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'), h = c.hass; await h.callService('todo', 'add_item', { item: 'Riley: Pick the family movie', description: 'ask {"v":1,"id":"aother1","k":"reward","kid":"riley","who":"Riley","name":"Pick the family movie","cost":100,"t":1}' }, { entity_id: 'todo.family_hub_asks' }); }); await page.waitForTimeout(500);
  ok('one child’s ask is not shown on, or cleared by, his brother’s page', await K(page).locator('[data-asks]').count() === 0 && (await list(page, ASKS)).length === 1);
  await page.context().close(); }

// 2. the automation Home Assistant runs
const HOUSE = { type: 'x', kids: [{ name: 'Riley', colour: 3 }, { name: 'Max', colour: 5, points: 'input_number.maxs_stars' }], approve: { notify: ['notify.mobile_app_alex', 'notify.mobile_app_sam'] } };
const page0 = await open('look=glass&page=planner&approve=1');
const built = await page0.evaluate((house) => { const C = customElements.get('family-hub-card'); return { own: document.querySelector('family-hub-card').approveSetup(), house: C.approve.haApprove(house), none: C.approve.haApprove({ ...house, approve: {} }),
  digest: C.digest.haDigest({ ...house, digest: { notify: ['notify.mobile_app_alex'] } }), digestOff: C.digest.haDigest({ ...house, approve: undefined, digest: { notify: ['notify.mobile_app_alex'] } }),
  bad: [{ approve: 3 }, { approve: { notify: ['x'] } }, { approve: { notify: ['notify.a'], list: 'list' } }].map((d) => { try { document.createElement('family-hub-card').setConfig({ type: 'x', ...d }); return ''; } catch (e) { return String(e.message); } }) }; }, HOUSE);
await page0.context().close();
const AU = built.house;
ok('one automation, triggered by a button on a phone’s notice, and only by this card’s own buttons', AU?.alias === 'Family Hub: approve from a phone' && AU.triggers.length === 1 && AU.triggers[0].event_type === 'mobile_app_notification_action' && /FH_\(OK\|NO\)_a/.test(AU.conditions[0].value_template), AU?.triggers);
ok('with no phone named there is nothing to set up', built.none === null && built.own?.alias === AU.alias);
ok('an approve setting that is not a list of notify services, or not a to-do list, is refused in words', built.bad.every((m) => /^Family Hub: approve/.test(m)), built.bad);
const line = (id, extra = {}) => ({ uid: 'u-' + id, summary: 'Riley: Pick the family movie', status: 'needs_action', description: 'ask ' + JSON.stringify({ v: 1, id, k: 'reward', kid: 'riley', who: 'Riley', name: 'Pick the family movie', cost: 100, t: 1, ...extra }) });
const st = (state) => ({ state, attributes: {} });
const sc = (name, action, items, states = { 'input_number.riley_points': st('300'), 'input_number.maxs_stars': st('40') }) => ({ name, now: '2026-11-10T17:00:00+08:00', states, vars: { trigger: { event: { data: { action } } } }, responses: { asks: { [ASKS]: { items } } } });
const scenarios = [
  sc('yes', 'FH_OK_aabc123', [line('azzz999'), line('aabc123')]),
  sc('no', 'FH_NO_aabc123', [line('aabc123')]),
  sc('short', 'FH_OK_aabc123', [line('aabc123')], { 'input_number.riley_points': st('60') }),
  sc('gone', 'FH_OK_aabc123', [line('aother1')]),
  sc('foreign', 'SOMETHING_ELSE', [line('aabc123')]),
  sc('number-like', 'FH_OK_123456', [line('123456')]),
  sc('stranger', 'FH_OK_aabc123', [line('aabc123', { kid: 'nobody' })]),
  sc('negative', 'FH_OK_aabc123', [line('aabc123', { cost: -500 })]),
  sc('other-entity', 'FH_OK_aabc123', [{ ...line('aabc123', { kid: 'max', who: 'Max', cost: 30 }), summary: 'Max: Pick which park' }]),
  { name: 'digest', now: '2026-11-13T19:30:00+08:00', states: {}, responses: { waiting: { [ASKS]: { items: [line('aabc123'), { summary: 'junk', description: 'not an ask' }] } } }, automation: built.digest }
];
const py = spawnSync('python3', [path.join(ROOT, 'scripts/tests/digest_render.py')], { input: JSON.stringify({ automation: AU, scenarios }), encoding: 'utf8' });
if (py.status !== 0 && /No module named|ENOENT|not found/i.test(String(py.stderr) + String(py.error ?? ''))) console.log('skip the automation’s answers were NOT checked here: python3 with jinja2 is needed to render its templates');
else {
  let R = {}; try { R = Object.fromEntries(JSON.parse(py.stdout).map((r) => [r.name, r])); } catch { /* reported below */ }
  ok('the stand-in for Home Assistant ran every case', Object.keys(R).length === scenarios.length && Object.values(R).every((r) => !r.error), Object.values(R).filter((r) => r.error).map((r) => `${r.name}: ${r.error}`).join(' | ') || String(py.stderr).slice(-400));
  const to = (n, a) => (R[n]?.sent ?? []).filter((s) => s.to === a);
  const y = R.yes ?? {};
  ok('Approve takes exactly the reward’s points from that child', to('yes', 'script.fh_add_points').length === 1 && to('yes', 'script.fh_add_points')[0].kid === 'riley' && to('yes', 'script.fh_add_points')[0].points === -100 && to('yes', 'script.fh_add_points')[0].lifetime === false, to('yes', 'script.fh_add_points'));
  ok('and writes the reward ledger with today’s date, as the wall does', to('yes', 'todo.add_item').length === 1 && to('yes', 'todo.add_item')[0].item === 'Riley: Pick the family movie' && /^10\/11\/2026 · 100 pts/.test(to('yes', 'todo.add_item')[0].description) && to('yes', 'todo.add_item')[0].target.entity_id === OWED, to('yes', 'todo.add_item'));
  ok('the right line (of two waiting) is marked answered, with its verdict in front', to('yes', 'todo.update_item').length === 1 && to('yes', 'todo.update_item')[0].item === 'u-aabc123' && to('yes', 'todo.update_item')[0].status === 'completed' && /^ok \{"v":1,"id":"aabc123"/.test(to('yes', 'todo.update_item')[0].description), to('yes', 'todo.update_item'));
  ok('every phone is told the outcome, in place of the notice with the buttons', to('yes', 'notify.mobile_app_alex').length === 1 && to('yes', 'notify.mobile_app_sam').length === 1 && to('yes', 'notify.mobile_app_alex')[0].title === 'Approved' && to('yes', 'notify.mobile_app_alex')[0].data.tag === 'fh-ask-aabc123' && /100 points were spent/.test(to('yes', 'notify.mobile_app_alex')[0].message), to('yes', 'notify.mobile_app_alex'));
  ok('Not yet spends nothing and writes no ledger line; the line is marked “no”', to('no', 'script.fh_add_points').length === 0 && to('no', 'todo.add_item').length === 0 && /^no \{/.test(to('no', 'todo.update_item')[0]?.description ?? '') && to('no', 'notify.mobile_app_alex')[0]?.title === 'Not yet', R.no?.sent);
  ok('Approve when the points have since gone spends nothing and says so', to('short', 'script.fh_add_points').length === 0 && /^short \{/.test(to('short', 'todo.update_item')[0]?.description ?? '') && to('short', 'notify.mobile_app_alex')[0]?.title === 'Not enough points now', R.short?.sent);
  ok('a second answer to the same ask (the other parent, a double tap) does nothing', R.gone?.stopped && R.gone.sent.length === 0, R.gone);
  ok('another app’s notification button is ignored', R.foreign?.skipped === true && R['number-like']?.skipped === true, [R.foreign, R['number-like']]);
  ok('an ask naming a child the card does not have spends nothing', to('stranger', 'script.fh_add_points').length === 0 && /^short /.test(to('stranger', 'todo.update_item')[0]?.description ?? ''), R.stranger?.sent);
  ok('an ask with a negative cost cannot add points', to('negative', 'script.fh_add_points').length === 0, R.negative?.sent);
  ok('a child whose points live in a differently named helper is read from that helper', to('other-entity', 'script.fh_add_points')[0]?.points === -30 && to('other-entity', 'script.fh_add_points')[0]?.kid === 'max', R['other-entity']?.sent);
  ok('the evening digest lists what is still waiting for an answer, and only real asks', String(R.digest?.message ?? '').split('\n').includes('Waiting for your answer: Riley: Pick the family movie.'), R.digest?.message);
  ok('without approvals the digest does not ask for that list', built.digestOff.actions.filter((a) => a.response_variable === 'waiting').length === 0 && built.digest.actions.filter((a) => a.response_variable === 'waiting').length === 1);
}

// 3. Settings
{ const page = await open('look=glass&page=planner&sheet=settings&pane=people');
  ok('Settings, People and safety has the approvals card with the phones Home Assistant knows', await A(page).count() === 1 && await A(page).locator('[data-ap]').count() === 2);
  await A(page).locator('[data-ap="notify.mobile_app_alex"]').click(); await page.waitForTimeout(200);
  ok('nothing is made before the save', (await calls(page, /api\.POST/)).length === 0 && /Save, and Home Assistant is set up/.test(await A(page).innerText()));
  await S(page).locator('.sft [data-act="save"]').click(); await page.waitForTimeout(900);
  const made = await page.evaluate(() => ({ calls: (window.__calls ?? []).filter((c) => /api\.POST/.test(c)), body: window.__approve, cfg: document.querySelector('family-hub-card')._config.approve, list: !!document.querySelector('family-hub-card').hass.states['todo.family_hub_asks'] }));
  ok('the save makes the list and the automation, and only those', made.calls.join() === 'api.POST config/config_entries/flow,api.POST config/config_entries/flow/flow1,api.POST config/automation/config/family_hub_approve' && made.body?.id === 'family_hub_approve' && made.list && JSON.stringify(made.cfg) === '{"notify":["notify.mobile_app_alex"]}', made.calls);
  ok('the save’s own message stands and the card says it is on', /^Saved: People and safety\.$/.test(await toast(page)) && /\bOn\b/.test(await A(page).locator('.srow').last().innerText()) && /Nothing answered yet/.test(await A(page).innerText()), [await toast(page), await A(page).innerText()]);
  ok('the digest was not touched by an approvals save when there is no digest', (await calls(page, /family_hub_digest/)).length === 0);
  await A(page).locator('[data-ap="notify.mobile_app_alex"]').click(); await page.waitForTimeout(200); await page.evaluate(() => { window.__calls = []; }); await S(page).locator('.sft [data-act="save"]').click(); await page.waitForTimeout(900);
  ok('unticking the last phone and saving switches the automation off (the PIN is back)', (await calls(page, /automation\.turn_off automation\.family_hub_approve_from_a_phone/)).length === 1, await calls(page, /automation/));
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&approve=nolist&sheet=settings&pane=people');
  ok('a phone named in YAML with nothing in Home Assistant: “Set it up”', await A(page).locator('[data-act="ap-sync"]').innerText() === 'Set it up');
  await page.evaluate(() => { window.__autoFail = true; }); await A(page).locator('[data-act="ap-sync"]').click(); await page.waitForTimeout(600);
  ok('Home Assistant refusing is said plainly', /would not set it up/.test(await toast(page)), await toast(page));
  await page.context().close(); }

await browser.close(); srv.close();
console.log(`\n${pass} passed, ${fails.length} failed${errs.length ? `, ${errs.length} page errors` : ''}`);
for (const f of fails) console.log('FAILED: ' + f);
for (const e of [...new Set(errs)].slice(0, 10)) console.log('ERROR: ' + e);
process.exit(fails.length || errs.length ? 1 : 0);
