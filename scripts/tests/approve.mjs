// F3 item 2, approve from a phone: a reward that needs a parent can be sent to a parent's phone from the child's page; nothing is
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

// an answer reaches the page through Home Assistant: wait for the words, not for a fixed time (a busy machine is slow)
const told = (page, re) => page.waitForFunction((src) => new RegExp(src).test(document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid')._msg ?? ''), re.source, { timeout: 8000 }).then(() => page.waitForTimeout(250)).catch(() => {});
// 1. the child's page
{ const page = await open('look=glass&page=kid&kid=0&approve=1&shuffle=0'); await rich(page); await page.waitForTimeout(300);
  const big = row(page, 'Pick the family movie'), small = row(page, 'Extra screen time');
  await small.click(); await page.waitForTimeout(250);
  ok('a small reward is as before: “Spend 50 points?”, no phone', await K(page).locator('.rw.ask[data-ask]').count() === 0 && /Spend 50 points/.test(await K(page).locator('.rw.ask').innerText()), await K(page).locator('.rw.ask').innerText().catch(() => ''));
  await K(page).locator('.rw.ask .save').click(); await page.waitForTimeout(200);
  await big.click(); await page.waitForTimeout(250);
  const ask = K(page).locator('.rw.ask[data-ask]');
  ok('a big reward offers to ask a parent: Ask, the PIN for one standing here, or Not now', await ask.count() === 1 && /Ask a parent\?/.test(await ask.innerText()) && await ask.locator('button').count() === 3 && await K(page).locator('fh-pin').count() === 0, await ask.innerText().catch(() => ''));
  ok('nothing has been sent or spent by looking', (await calls(page, /^notify\.|fh_add_points|todo\.add_item todo\.(family_hub_asks|rewards_owed)/)).length === 0 && Number(await state(page, PTS)) === 300, await state(page, PTS));
  await ask.locator('[data-act="ask-no"]').click(); await page.waitForTimeout(200);
  ok('“Not now” puts the row back', await K(page).locator('.rw.ask').count() === 0);
  await big.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-send"]').click(); await page.waitForTimeout(600);
  const sent = await calls(page, /^notify\.mobile_app_alex/), items = await list(page, ASKS), rec = JSON.parse((items[0]?.description ?? 'ask {}').slice(4));
  ok('“Ask” writes one line to the asks list', items.length === 1 && items[0].summary === 'Riley: Pick the family movie' && items[0].status === 'needs_action' && /^ask \{/.test(items[0].description) && rec.v === 1 && rec.k === 'reward' && rec.kid === 'riley' && rec.cost === 100 && /^a[a-z0-9]{6}$/.test(rec.id), items);
  ok('and sends the phone one notice', sent.length === 1 && /Riley would like a reward/.test(sent[0]), sent);
  const full = await page.evaluate(() => window.__notified?.slice(-1)[0] ?? null);
  ok('no points are spent and the ledger is untouched until a parent answers', await state(page, PTS) === '300' && (await list(page, OWED)).length === 0 && (await calls(page, /fh_add_points/)).length === 0);
  ok('the page says it has asked', /^Asked! A parent will answer on their phone\.$/.test(await msg(page)), await msg(page));
  ok('the reward’s row and a line above the list say it is waiting', (await K(page).locator('[data-asks]').innerText()).includes('Asked a parent: Pick the family movie') && await big.locator('[data-asked]').count() === 1, await K(page).locator('[data-asks]').innerText().catch(() => ''));
  await big.click(); await page.waitForTimeout(250);
  ok('asking again for the same thing does not send a second notice', (await calls(page, /^notify\./)).length === 1 && (await list(page, ASKS)).length === 1 && /^Asked\. Waiting for a parent/.test(await msg(page)), await msg(page));
  // not yet
  await answer(page, 'no'); await told(page, /^Not yet/);
  ok('“Not yet” is told kindly, costs nothing, and clears the waiting line', /^Not yet for Pick the family movie\. Your points are safe\.$/.test(await msg(page)) && await K(page).locator('[data-asks]').count() === 0 && await state(page, PTS) === '300', await msg(page));
  ok('the answered line is cleared from the list', (await list(page, ASKS)).length === 0, await list(page, ASKS));
  // approve
  await big.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-send"]').click(); await page.waitForTimeout(500);
  await answer(page, 'ok'); await told(page, /said yes/);
  ok('“Approve” is told as a yes', /^A parent said yes: Pick the family movie\.$/.test(await msg(page)) && await K(page).locator('[data-asks]').count() === 0, await msg(page));
  ok('the page itself spends nothing for a yes (Home Assistant has already taken the points)', (await calls(page, /fh_add_points/)).length === 0);
  // short
  await big.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-send"]').click(); await page.waitForTimeout(500);
  await answer(page, 'short'); await told(page, /^Not enough/);
  ok('a yes that came after the points were gone is said plainly', /^Not enough points for Pick the family movie now\. Nothing was spent\.$/.test(await msg(page)), await msg(page));
  // a parent at the wall
  await big.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-here"]').click(); await page.waitForTimeout(300);
  ok('a parent standing there can still use the PIN', await K(page).locator('fh-pin').count() === 1);
  await pin(page); await page.waitForTimeout(600);
  ok('and the PIN spends at once, as before', await state(page, PTS) === '200' && (await list(page, OWED)).some((x) => x.summary === 'Riley: Pick the family movie'), [await state(page, PTS), await list(page, OWED)]);
  // a phone that will not take it
  await page.evaluate(() => { window.__notifyFail = true; }); const paint = row(page, 'Warhammer paint pot');
  await paint.click(); await page.waitForTimeout(200); await K(page).locator('[data-act="ask-send"]').click(); await page.waitForTimeout(500);
  ok('when no phone takes the message the child is sent to find a parent (the ask stays on the list for the digest)', /no phone took the message\. Find a parent\.$/.test(await msg(page)) && (await list(page, ASKS)).length === 1, await msg(page));
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
const jline = (id, extra = {}) => ({ uid: 'u-' + id, summary: 'Riley: Mow the lawn', status: 'needs_action', description: 'ask ' + JSON.stringify({ v: 1, id, k: 'job', kid: 'riley', who: 'Riley', name: 'Mow the lawn', cost: 20, t: 1, list: 'todo.riley_chores', uid: 'c-9', ...extra }) });
const cline = (id, extra = {}) => ({ uid: 'u-' + id, summary: 'Riley: would like a chat', status: 'needs_action', description: 'ask ' + JSON.stringify({ v: 1, id, k: 'chat', kid: 'riley', who: 'Riley', name: 'would like a chat', cost: 0, t: 1, ...extra }) });
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
  { ...sc('job-yes', 'FH_OK_ajob111', [jline('ajob111')]), responses: { asks: { [ASKS]: { items: [jline('ajob111')] } }, jobs: { 'todo.riley_chores': { items: [{ uid: 'c-9', summary: 'Mow the lawn', status: 'needs_action', description: '+20 @job @after' }, { uid: 'c-1', summary: 'Other', status: 'needs_action', description: '+5' }] } } } },
  { ...sc('job-inflated', 'FH_OK_ajob111', [jline('ajob111', { cost: 9999 })]), responses: { asks: { [ASKS]: { items: [jline('ajob111', { cost: 9999 })] } }, jobs: { 'todo.riley_chores': { items: [{ uid: 'c-9', summary: 'Mow the lawn', status: 'needs_action', description: '20' }] } } } },
  { ...sc('job-no', 'FH_NO_ajob111', [jline('ajob111')]), responses: { asks: { [ASKS]: { items: [jline('ajob111')] } }, jobs: { 'todo.riley_chores': { items: [{ uid: 'c-9', summary: 'Mow the lawn', status: 'needs_action', description: '+20 @job' }] } } } },
  { ...sc('job-gone', 'FH_OK_ajob111', [jline('ajob111')]), responses: { asks: { [ASKS]: { items: [jline('ajob111')] } }, jobs: { 'todo.riley_chores': { items: [] } } } },
  { ...sc('job-other-list', 'FH_OK_ajob111', [jline('ajob111', { list: 'todo.shopping_list' })]), responses: { asks: { [ASKS]: { items: [jline('ajob111', { list: 'todo.shopping_list' })] } }, jobs: { 'todo.riley_chores': { items: [{ uid: 'c-9', summary: 'Mow the lawn', status: 'needs_action', description: '+20 @job' }] } } } },
  { ...sc('job-routine', 'FH_OK_ajob111', [jline('ajob111')]), responses: { asks: { [ASKS]: { items: [jline('ajob111')] } }, jobs: { 'todo.riley_chores': { items: [{ uid: 'c-9', summary: 'Mow the lawn', status: 'needs_action', description: '+20 @routine' }] } } } },
  sc('chat-seen', 'FH_OK_achat01', [cline('achat01'), line('aabc123')]),
  sc('chat-no', 'FH_NO_achat01', [cline('achat01')]),
  sc('chat-stranger', 'FH_OK_achat01', [cline('achat01', { kid: 'nobody', cost: -900 })]),
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
  const jy = to('job-yes', 'script.fh_add_points')[0], ju = to('job-yes', 'todo.update_item');
  ok('Approve for a job ticks that job on the child’s own list', ju.some((u) => u.target.entity_id === 'todo.riley_chores' && u.item === 'c-9' && u.status === 'completed'), ju);
  ok('and gives its points, with a marble, as a tick does', jy?.kid === 'riley' && jy.points === 20 && jy.lifetime === true && jy.jar === 1, jy);
  ok('the points come from the job itself, not from what the ask claims', to('job-inflated', 'script.fh_add_points')[0]?.points === 20, to('job-inflated', 'script.fh_add_points'));
  ok('the phone is told what was given', /20 points given/.test(to('job-yes', 'notify.mobile_app_alex')[0]?.message ?? '') && to('job-yes', 'notify.mobile_app_alex')[0]?.title === 'Approved', to('job-yes', 'notify.mobile_app_alex'));
  ok('Not yet leaves the job unticked and gives nothing', to('job-no', 'script.fh_add_points').length === 0 && !to('job-no', 'todo.update_item').some((u) => u.target.entity_id === 'todo.riley_chores') && /^no \{/.test(to('job-no', 'todo.update_item')[0]?.description ?? '') && /stays unticked/.test(to('job-no', 'notify.mobile_app_alex')[0]?.message ?? ''), R['job-no']?.sent);
  ok('a job that has gone, or is already ticked, gives nothing', to('job-gone', 'script.fh_add_points').length === 0 && /^short /.test(to('job-gone', 'todo.update_item')[0]?.description ?? ''), R['job-gone']?.sent);
  ok('an ask that names a list which is not that child’s job list touches nothing', to('job-other-list', 'script.fh_add_points').length === 0 && to('job-other-list', 'todo.update_item').every((u) => u.target.entity_id === ASKS), R['job-other-list']?.sent);
  ok('a routine with points gives the points and no marble', to('job-routine', 'script.fh_add_points')[0]?.jar === 0 && to('job-routine', 'script.fh_add_points')[0]?.points === 20, to('job-routine', 'script.fh_add_points'));
  ok('a reward’s answer is unchanged by the job branch', to('yes', 'script.fh_add_points').length === 1 && !to('yes', 'todo.update_item').some((u) => u.target.entity_id !== ASKS));
  const cu = to('chat-seen', 'todo.update_item');
  ok('Seen for a chat only marks that line: no points, no ledger, no job list read for a tick', cu.length === 1 && cu[0].item === 'u-achat01' && cu[0].target.entity_id === ASKS && /^ok \{"v":1,"id":"achat01","k":"chat"/.test(cu[0].description) && to('chat-seen', 'script.fh_add_points').length === 0 && to('chat-seen', 'todo.add_item').length === 0, R['chat-seen']?.sent);
  ok('and the notice is taken off every phone, not replaced by a verdict', to('chat-seen', 'notify.mobile_app_alex').length === 1 && to('chat-seen', 'notify.mobile_app_sam').length === 1 && to('chat-seen', 'notify.mobile_app_alex')[0].message === 'clear_notification' && to('chat-seen', 'notify.mobile_app_alex')[0].data.tag === 'fh-ask-achat01' && !to('chat-seen', 'notify.mobile_app_alex')[0].title, to('chat-seen', 'notify.mobile_app_alex'));
  ok('a chat cannot be refused: the other button marks it seen as well', /^ok \{/.test(to('chat-no', 'todo.update_item')[0]?.description ?? '') && to('chat-no', 'script.fh_add_points').length === 0, R['chat-no']?.sent);
  ok('a chat line naming an unknown child and a negative cost still spends and gives nothing', to('chat-stranger', 'script.fh_add_points').length === 0 && to('chat-stranger', 'todo.add_item').length === 0 && to('chat-stranger', 'todo.update_item').length === 1, R['chat-stranger']?.sent);
  ok('the evening digest lists what is still waiting for an answer, and only real asks', String(R.digest?.message ?? '').split('\n').includes('Waiting for your answer: Riley: Pick the family movie.'), R.digest?.message);
  ok('without approvals the digest does not ask for that list', built.digestOff.actions.filter((a) => a.response_variable === 'waiting').length === 0 && built.digest.actions.filter((a) => a.response_variable === 'waiting').length === 1);
}

// 2b. jobs worth enough points wait for a parent, and the bell
{ const page = await open('look=glass&page=kid&kid=0&approve=1&jobsfrom=10&shuffle=0'); const before = Number(await state(page, PTS));
  const job = K(page).locator('.job.row').filter({ hasText: 'Set the table' }), small = K(page).locator('.job.row').filter({ hasText: 'Homework' });
  await job.locator('.hit').click(); await page.waitForTimeout(600);
  const items = await list(page, ASKS), rec = JSON.parse((items[0]?.description ?? 'ask {}').slice(4));
  ok('ticking a job worth 10 or more asks a parent: one line, one notice, no tick, no points', items.length === 1 && rec.k === 'job' && rec.list === 'todo.riley_chores' && !!rec.uid && rec.cost === 10 && (await calls(page, /^notify\.mobile_app_alex.*says a job is done/)).length === 1 && Number(await state(page, PTS)) === before && await job.locator('.hit').getAttribute('aria-pressed') === 'false' && (await calls(page, /fh_add_points/)).length === 0, [items, await calls(page, /^notify\./)]);
  ok('the row says it has asked, and the page says so', await job.locator('[data-asked]').count() === 1 && /^Asked a parent to check: Set the table\.$/.test(await msg(page)), await msg(page));
  await job.locator('.hit').click(); await page.waitForTimeout(400);
  ok('a second tap is for a parent standing there: the PIN, not a second notice', await K(page).locator('fh-pin').count() === 1 && (await calls(page, /^notify\./)).length === 1);
  await K(page).locator('fh-pin').getByRole('button', { name: /cancel|close/i }).first().click().catch(() => page.keyboard.press('Escape')); await page.waitForTimeout(400);
  await small.locator('.hit').click(); await page.waitForTimeout(500);
  ok('a job with no points is ticked at once, as before', await small.locator('.hit').getAttribute('aria-pressed') === 'true' && (await list(page, ASKS)).length === 1);
  // the bell, on the shared pages
  await page.locator('family-hub-card nav.dock[data-kid] .item, family-hub-card nav.dock .item').filter({ hasText: /Home$/ }).first().click(); await page.waitForTimeout(600);
  const C = page.locator('family-hub-card'), bell = C.locator('header [data-act="bell"]');
  ok('the header has a bell that says how many are waiting', await bell.count() === 1 && /1 waiting for a parent/.test(await bell.getAttribute('aria-label') ?? ''), await bell.getAttribute('aria-label').catch(() => ''));
  await bell.click(); await page.waitForTimeout(400);
  ok('the bell opens behind the PIN', await C.locator('fh-pin').count() === 1 && await C.locator('.sheet[data-sheet="waiting"]').count() === 0);
  for (const d of '1234') await C.locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(600);
  const rowW = C.locator('.sheet[data-sheet="waiting"] .waitrow');
  ok('it lists what is waiting, with Approve and Not yet', await rowW.count() === 1 && /Riley/.test(await rowW.innerText()) && /Set the table/.test(await rowW.innerText()) && await rowW.locator('button').count() === 2, await rowW.innerText().catch(() => ''));
  await rowW.locator('[data-act="wait-ok"]').click(); await page.waitForTimeout(900);
  ok('Approve on the panel sends the same answer a phone’s button does', (await calls(page, /^api\.event FH_OK_a[a-z0-9]+$/)).length === 1, await calls(page, /api\.event/));
  ok('the job is ticked, the points are given, the sheet closes and the bell goes', Number(await state(page, PTS)) === before + 10 && await C.locator('.sheet[data-sheet="waiting"]').count() === 0 && await bell.count() === 0 && (await list(page, 'todo.riley_chores')).find((x) => x.summary === 'Set the table')?.status === 'completed', [await state(page, PTS)]);
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&approve=1');
  ok('no bell when nothing is waiting', await page.locator('family-hub-card header [data-act="bell"]').count() === 0);
  await page.evaluate(async () => { const h = document.querySelector('family-hub-card').hass; await h.callService('todo', 'add_item', { item: 'Riley: Pick the family movie', description: 'ask {"v":1,"id":"abell01","k":"reward","kid":"riley","who":"Riley","name":"Pick the family movie","cost":100,"t":1}' }, { entity_id: 'todo.family_hub_asks' }); }); await page.waitForTimeout(600);
  const C = page.locator('family-hub-card'), bell = C.locator('header [data-act="bell"]');
  ok('an ask made on another screen brings the bell up here', await bell.count() === 1);
  await bell.click(); await page.waitForTimeout(300); for (const d of '1234') await C.locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(600);
  await page.evaluate(() => { window.__eventFail = true; }); await C.locator('[data-act="wait-no"]').click(); await page.waitForTimeout(600);
  ok('if Home Assistant will not take the answer the row stays and the panel says so', await C.locator('.waitrow').count() === 1 && /did not take that/.test(await page.evaluate(() => document.querySelector('family-hub-card')._toast ?? '')), await page.evaluate(() => document.querySelector('family-hub-card')._toast ?? ''));
  await page.evaluate(() => { window.__eventFail = false; }); await C.locator('[data-act="wait-no"]').click(); await page.waitForTimeout(800);
  ok('Not yet on the panel answers it and spends nothing', (await calls(page, /^api\.event FH_NO_abell01$/)).length === 2 && await bell.count() === 0 && (await list(page, ASKS))[0]?.description.startsWith('no '), await list(page, ASKS));
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0&approve=1&shuffle=0'); 
  await K(page).locator('.job.row').filter({ hasText: 'Set the table' }).locator('.hit').click(); await page.waitForTimeout(500);
  ok('with the usual 15 points, a 10-point job is ticked at once', (await list(page, ASKS)).length === 0 && await K(page).locator('.job.row').filter({ hasText: 'Set the table' }).locator('.hit').getAttribute('aria-pressed') === 'true');
  await page.context().close(); }

// 2c. a chat asked for: to the phone and on the bell (F3 item 4)
{ const page = await open('look=glass&page=kid&kid=1&approve=1&shuffle=0'); const C = page.locator('family-hub-card'), before = await state(page, 'input_number.charlie_points');
  await K(page).locator('.feelcard .feel button').first().click(); await page.waitForTimeout(300);
  await K(page).locator('.feelcard button').filter({ hasText: /Chat later|Leave a note/i }).first().click(); await page.waitForTimeout(700);
  let items = await list(page, ASKS); const rec = JSON.parse((items[0]?.description ?? 'ask {}').slice(4)), sent = await page.evaluate(() => (window.__calls ?? []).filter((c) => /^notify\./.test(c)));
  ok('asking for a chat writes one line to the asks list', items.length === 1 && rec.k === 'chat' && rec.kid === 'charlie' && rec.cost === 0 && /^Charlie: (would like a chat|has something good to share)$/.test(items[0].summary), items);
  ok('and sends the phone one notice', sent.length === 1 && /^notify\.mobile_app_alex/.test(sent[0]) && /Charlie (would like a chat|has something good to share)/.test(sent[0]), sent);
  ok('the page says a note was left, and nothing else on it changes', /left a note for a parent/.test(await msg(page)) && await K(page).locator('[data-asks]').count() === 0 && await state(page, 'input_number.charlie_points') === before, await msg(page));
  ok('with the phone and the bell, no chip with his name is put in the header and Home Assistant gets no second notification', (await calls(page, /persistent_notification/)).length === 0 && (await page.evaluate(() => document.querySelector('family-hub-card')._wantsChat.length)) === 0);
  await K(page).locator('.feelcard .feel button').first().click(); await page.waitForTimeout(300);
  await K(page).locator('.feelcard button').filter({ hasText: /Chat later|Leave a note/i }).first().click(); await page.waitForTimeout(600);
  ok('asking again while one waits sends nothing more', (await list(page, ASKS)).length === 1 && (await calls(page, /^notify\./)).length === 1);
  await page.locator('family-hub-card nav.dock[data-kid] .item, family-hub-card nav.dock .item').filter({ hasText: /Home$/ }).first().click(); await page.waitForTimeout(600);
  const bell = C.locator('header [data-act="bell"]');
  ok('the bell counts it', await bell.count() === 1 && /1 waiting for a parent/.test(await bell.getAttribute('aria-label') ?? ''));
  ok('the header shows the count only: no name', !/Charlie/.test(await C.locator('header').innerText()), await C.locator('header').innerText());
  await bell.click(); await page.waitForTimeout(300); for (const d of '1234') await C.locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(600);
  const rowW = C.locator('.sheet[data-sheet="waiting"] .waitrow');
  ok('behind the PIN the sheet names him, with one button, Seen', await rowW.count() === 1 && /Charlie/.test(await rowW.innerText()) && await rowW.locator('button').count() === 1 && (await rowW.locator('button').innerText()).trim() === 'Seen', await rowW.innerText().catch(() => ''));
  await rowW.locator('[data-act="wait-seen"]').click(); await page.waitForTimeout(900);
  items = await list(page, ASKS);
  ok('Seen answers it as a phone would, the bell goes, and no points move', (await calls(page, /^api\.event FH_OK_a[a-z0-9]+$/)).length === 1 && await bell.count() === 0 && items[0]?.description.startsWith('ok ') && (await calls(page, /fh_add_points/)).length === 0 && await state(page, 'input_number.charlie_points') === before, items);
  await C.locator('nav.dock .item').filter({ hasText: /Charlie$/ }).first().click(); await told(page, /seen your note/);
  ok('his page tells him once that a parent has seen it, and clears the line', /^A parent has seen your note\.$/.test(await msg(page)) && (await list(page, ASKS)).length === 0, await msg(page));
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0&older=1&approve=1&shuffle=0'); const C = page.locator('family-hub-card');
  await K(page).locator('[data-act="chat-note"]').click(); await page.waitForTimeout(700);
  ok('older mode: the note goes to the phone and the list, and the page says nothing shows on the wall', (await list(page, ASKS)).length === 1 && (await calls(page, /^notify\.mobile_app_alex/)).length === 1 && /Nothing shows on the wall/.test(await msg(page)), await msg(page));
  ok('his own page shows nothing waiting', await K(page).locator('[data-asks]').count() === 0 && await K(page).locator('[data-asked]').count() === 0);
  await page.locator('family-hub-card nav.dock[data-kid] .item, family-hub-card nav.dock .item').filter({ hasText: /Home$/ }).first().click(); await page.waitForTimeout(600);
  const shown = await page.evaluate(() => { const out = []; const walk = (r) => { for (const n of r.querySelectorAll('*')) { if (n.shadowRoot) walk(n.shadowRoot); } out.push(r.textContent ?? ''); }; walk(document.querySelector('family-hub-card').shadowRoot); return out.join(' '); });
  ok('on the shared pages only the bell’s count shows: the word chat is nowhere', await C.locator('header [data-act="bell"]').count() === 1 && !/would like a chat/i.test(shown));
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=1&shuffle=0');
  await K(page).locator('.feelcard .feel button').first().click(); await page.waitForTimeout(300);
  await K(page).locator('.feelcard button').filter({ hasText: /Chat later|Leave a note/i }).first().click(); await page.waitForTimeout(600);
  ok('with no phone named it is as before: a notification in Home Assistant and a chip on the shared pages', (await calls(page, /persistent_notification/)).length === 1 && (await page.evaluate(() => document.querySelector('family-hub-card')._wantsChat.length)) === 1);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=1&approve=1&shuffle=0'); await page.evaluate(() => { window.__todoFail = 'todo.family_hub_asks'; });
  await K(page).locator('.feelcard .feel button').first().click(); await page.waitForTimeout(300);
  await K(page).locator('.feelcard button').filter({ hasText: /Chat later|Leave a note/i }).first().click(); await page.waitForTimeout(600);
  ok('if the list will not take the line, the note still goes the old way', (await calls(page, /persistent_notification/)).length === 1 && (await page.evaluate(() => document.querySelector('family-hub-card')._wantsChat.length)) === 1, await calls(page, /persistent|notify/));
  await page.context().close(); }

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
