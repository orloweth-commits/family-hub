// Phase 4c ("trust guards and clarity fixes") checks: the planner says how fresh the calendars are and warns plainly when one stops
// answering or is unavailable (and recovers); only the wall panel stamps the heartbeat; the snapshot record restores every number and
// the reward ledger; use counts are numbers per page and nothing else; a ticked family job adds exactly one marble and says so, a
// routine adds none; Settings offers three bin colours; the Wi-Fi password sits behind the PIN.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4833] node scripts/tests/trust.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4833);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, time = '16:20', { w = 1920, h = 1080, before = null } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  if (before) await page.addInitScript(before);
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const C = (page) => page.locator('family-hub-card');
const K = (page) => page.locator('family-hub-card fh-kid');
const pin = async (page) => { for (const d of '1234') await C(page).locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500); };
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re.source);
const state = (page, id) => page.evaluate((e) => document.querySelector('family-hub-card').hass.states[e]?.state, id);
const list = (page, id) => page.evaluate((e) => document.querySelector('family-hub-card').hass.callWS({ type: 'todo/item/list', entity_id: e }).then((r) => r.items.map((x) => ({ summary: x.summary, description: x.description, status: x.status }))), id);
const settle = (page) => page.evaluate(() => { const walk = (r) => { r.getAnimations?.().forEach((a) => { try { a.finish(); } catch { /* endless */ } }); r.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); });

// 1. calendar health
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const page = await open(`look=${look}&page=planner&trust=1`);
  ok(`${look}: the planner says quietly how fresh the calendars are`, /^Updated (just now|1 min ago)$/.test((await C(page).locator('.legend [data-act="cal-age"]').innerText()).trim()), await C(page).locator('.legend .calnote').allInnerTexts());
  ok(`${look}: no warning while every calendar answers`, await C(page).locator('.calnote[data-warn]').count() === 0);
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&trust=1'); const card = C(page);
  await page.evaluate(() => { window.__calFail = ['calendar.sam']; });
  await page.clock.runFor('12:00'); await page.waitForTimeout(300);
  ok('one calendar missing two polls is not yet a warning (the limit is 30 minutes)', await card.locator('.calnote[data-warn]').count() === 0, await card.locator('.legend .calnote').allInnerTexts());
  ok('the quiet line counts from the calendar that is furthest behind', /^Updated 1[0-4] min ago$/.test((await card.locator('.legend [data-act="cal-age"]').innerText()).trim()), await card.locator('.legend .calnote').allInnerTexts());
  await page.clock.runFor('21:00'); await page.waitForTimeout(300);
  const warn = (await card.locator('.calnote[data-warn] > span').innerText().catch(() => '')).trim();
  ok('a calendar that has not answered for half an hour gets a plain warning, by name', /^The Sam calendar hasn’t updated for 3\d min\. What’s shown may be out of date\.$/.test(warn), warn);
  ok('the warning is a status for a screen reader, and carries words and a picture, not colour alone', await card.locator('.calnote[data-warn][role="status"] svg').count() === 1);
  ok('the rest of the week is still on screen', await card.locator('.calfail').count() === 0);
  ok('the warning stays inside the planner card', await card.evaluate((c) => { const n = c.shadowRoot.querySelector('.calnote[data-warn]').getBoundingClientRect(), p = c.shadowRoot.querySelector('.calnote[data-warn]').closest('section').getBoundingClientRect(); return n.left >= p.left && n.right <= p.right + 0.5 && n.height < 80; }));
  await page.evaluate(() => { window.__calFail = []; });
  await card.locator('.calnote [data-act="cal-retry"]').click(); await page.waitForTimeout(500);
  ok('“Try again” brings it back: the warning goes and the quiet line returns', await card.locator('.calnote[data-warn]').count() === 0 && /^Updated just now$/.test((await card.locator('.legend [data-act="cal-age"]').innerText()).trim()), await card.locator('.legend .calnote').allInnerTexts());
  // unavailable
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c.hass = { ...c.hass, states: { ...c.hass.states, 'calendar.riley': { ...c.hass.states['calendar.riley'], state: 'unavailable' } } }; await c.updateComplete; });
  await page.waitForTimeout(200);
  const down = (await card.locator('.calnote[data-warn] > span').innerText().catch(() => '')).trim();
  ok('a calendar Home Assistant calls unavailable is named at once', down === 'The Riley calendar can’t be reached. What’s shown may be out of date.', down);
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c._nightManual = true; await c.updateComplete; });
  ok('no warning at night', await page.evaluate(() => { const c = document.querySelector('family-hub-card'); return c._isNight() && !c.shadowRoot.querySelector('.calnote[data-warn]'); }));
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&trust=1&calmin=10'); await page.evaluate(() => { window.__calFail = ['calendar.family']; }); await page.clock.runFor('11:30'); await page.waitForTimeout(300);
  ok('the limit comes from the configuration (health.calendar_minutes)', /^The Family calendar hasn’t updated for 1\d min\./.test((await C(page).locator('.calnote[data-warn] > span').innerText().catch(() => '')).trim()));
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&trust=1', '16:20', { w: 390, h: 844 }); await page.evaluate(() => { window.__calFail = ['calendar.sam']; }); await page.clock.runFor('31:00'); await page.waitForTimeout(300);
  ok('on a phone the warning wraps inside the screen', await C(page).evaluate((c) => { const n = c.shadowRoot.querySelector('.calnote[data-warn]'); if (!n) return false; const r = n.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 0.5; }));
  await page.context().close(); }

// 2. panel liveness
{ const page = await open('look=glass&page=planner&trust=1'); await page.clock.runFor('11:00');
  ok('a screen that is not the wall panel never stamps the heartbeat', (await calls(page, /input_datetime\.set_datetime input_datetime\.fh_panel_seen/)).length === 0);
  await page.context().close();
  const wall = await open('look=glass&page=planner&trust=1', '16:20', { before: () => { try { localStorage.setItem('fh-wall', 'true'); } catch { /* blocked */ } } });
  await wall.clock.runFor('00:31');
  const first = await calls(wall, /input_datetime\.set_datetime input_datetime\.fh_panel_seen/);
  ok('the wall panel stamps the heartbeat soon after it starts', first.length === 1, first);
  ok('the stamp is the time now', Math.abs(await wall.evaluate(() => document.querySelector('family-hub-card').hass.states['input_datetime.fh_panel_seen'].attributes.timestamp - Date.now() / 1000)) < 60);
  await wall.clock.runFor('10:30');
  const n = (await calls(wall, /input_datetime\.set_datetime input_datetime\.fh_panel_seen/)).length;
  ok('and again every five minutes, no more often', n === 3, n);
  await wall.context().close();
  const none = await open('look=glass&page=planner', '16:20', { before: () => { try { localStorage.setItem('fh-wall', 'true'); } catch { /* blocked */ } } }); await none.clock.runFor('06:00');
  ok('with no heartbeat in the configuration nothing is stamped', (await calls(none, /input_datetime\.set_datetime/)).length === 0);
  await none.context().close(); }
{ const page = await open('look=glass&page=planner&trust=1&sheet=settings&pane=house'); const S = page.locator('fh-settings');
  const sw = S.getByRole('switch', { name: 'This screen is the wall panel' });
  ok('Settings, House: one switch says which screen is the wall panel, off to begin with', await sw.count() === 1 && await sw.getAttribute('aria-checked') === 'false');
  await sw.click(); await page.waitForTimeout(200);
  ok('switching it on is kept on this screen (not in the saved configuration)', await sw.getAttribute('aria-checked') === 'true' && await page.evaluate(() => localStorage.getItem('fh-wall')) === 'true' && await page.evaluate(() => !JSON.stringify(document.querySelector('family-hub-card')._config).includes('wall')));
  await page.context().close();
  const plain = await open('look=glass&page=planner&sheet=settings&pane=house');
  ok('a house with no heartbeat set up has no such switch', await plain.locator('fh-settings').getByRole('switch', { name: 'This screen is the wall panel' }).count() === 0);
  await plain.context().close(); }

// 3. never lose a point: the snapshot record, wiped and restored
{ const page = await open('look=glass&page=planner&trust=1');
  const r = await page.evaluate(async () => { const c = document.querySelector('family-hub-card'), T = customElements.get('family-hub-card').trust, h = () => c.hass;
    await h().callService('todo', 'add_item', { item: 'Riley: Pick the family movie (100) 2026-11-10' }, { entity_id: 'todo.rewards_owed' });
    const owed = async () => (await h().callWS({ type: 'todo/item/list', entity_id: 'todo.rewards_owed' })).items.filter((x) => x.status === 'needs_action').map((x) => x.summary);
    const ids = ['input_number.family_jar', 'input_number.riley_points', 'input_number.riley_lifetime_points', 'input_number.charlie_points', 'input_number.max_points', 'input_number.max_grow', 'input_text.riley_week', 'input_number.charlie_streak'];
    const read = () => Object.fromEntries(ids.map((id) => [id, h().states[id].state]));
    const before = read(), snap = T.snapshotOf(h(), c._config, await owed(), '2026-11-10'), text = T.snapText(snap);
    await h().callService('todo', 'add_item', { item: snap.d, description: text }, { entity_id: 'todo.family_hub_backup' });
    // the accident: a child's points, the jar and the ledger all wiped
    for (const id of ids.filter((x) => x.startsWith('input_number.'))) await h().callService('input_number', 'set_value', { value: 0 }, { entity_id: id });
    await h().callService('input_text', 'set_value', { value: '' }, { entity_id: 'input_text.riley_week' });
    const line = (await h().callWS({ type: 'todo/item/list', entity_id: 'todo.rewards_owed' })).items[0]; await h().callService('todo', 'remove_item', { item: line.uid }, { entity_id: 'todo.rewards_owed' });
    const wiped = read(), wipedOwed = await owed();
    const kept = (await h().callWS({ type: 'todo/item/list', entity_id: 'todo.family_hub_backup' })).items.find((x) => x.summary === '2026-11-10');
    const back = T.snapParse(kept.description), todo = T.restoreCalls(back, c._config, await owed());
    for (const k of todo) await h().callService(k.domain, k.service, k.data, k.target);
    const after = read(), afterOwed = await owed();
    const again = T.restoreCalls(back, c._config, await owed());
    return { before, wiped, after, text, wipedOwed, afterOwed, kids: Object.keys(snap.kids), twice: again.filter((k) => k.domain === 'todo').length, bad: T.snapParse('snap {not json'), n: todo.length }; });
  ok('the record holds every child, the jar and the ledger, as one line of text', r.kids.join(',') === 'riley,charlie,max' && r.text.startsWith('snap {"v":1,"d":"2026-11-10","jar":84,') && r.text.includes('"owed":["Riley: Pick the family movie (100) 2026-11-10"]'), r.text.slice(0, 120));
  ok('the wipe really wiped', r.wiped['input_number.riley_points'] === '0' && r.wiped['input_number.family_jar'] === '0' && r.wipedOwed.length === 0, r.wiped);
  ok('the restore puts every number and word back exactly', JSON.stringify(Object.entries(r.after).map(([k, v]) => [k, /number/.test(k) ? Number(v) : v])) === JSON.stringify(Object.entries(r.before).map(([k, v]) => [k, /number/.test(k) ? Number(v) : v])), r.after);
  ok('and the reward a child was owed is back on the ledger, once', r.afterOwed.join('|') === 'Riley: Pick the family movie (100) 2026-11-10' && r.twice === 0, r.afterOwed);
  ok('a record that cannot be read restores nothing', r.bad === null);
  const ha = await page.evaluate(() => document.querySelector('family-hub-card').trustSetup());
  const snapA = JSON.stringify(ha.automations.family_hub_snapshot ?? {}), rest = JSON.stringify(ha.scripts.fh_restore_points ?? {}), watch = ha.automations.family_hub_panel_watch;
  ok('Home Assistant’s nightly snapshot is built from this configuration: every child, the jar, the ledger, at 2:15 am', ['riley', 'charlie', 'max'].every((k) => snapA.includes(`input_number.${k}_points`) && snapA.includes(`input_number.${k}_lifetime_points`)) && snapA.includes('input_number.family_jar') && snapA.includes('todo.rewards_owed') && snapA.includes('02:15:00') && snapA.includes('todo.family_hub_backup'));
  ok('old snapshots and old counts are cleared by the same automation (nothing for a parent to tidy)', snapA.includes('timedelta(days=35)') && snapA.includes('timedelta(days=62)') && snapA.includes('todo.family_hub_use'));
  ok('one restore script, with an optional date, that sets every child’s numbers', ['riley', 'charlie', 'max'].every((k) => rest.includes(`input_number.${k}_points`)) && rest.includes('"date"') && rest.includes('input_number.set_value') && rest.includes('No snapshot for that date.'));
  ok('the panel watch tells one parent once, in waking hours only', !!watch && watch.triggers.length === 1 && watch.triggers[0].trigger === 'template' && /1200/.test(watch.triggers[0].value_template) && /390/.test(watch.triggers[0].value_template) && watch.actions[0].action === 'notify.mobile_app_demo_one');
  ok('the helpers it needs are listed', ha.helpers.map((x) => `${x.kind}:${x.entity}`).join(',') === 'local_todo:todo.family_hub_backup,local_todo:todo.family_hub_use,input_datetime:input_datetime.fh_panel_seen', ha.helpers);
  await page.context().close();
  const bare = await open('look=glass&page=planner'); const none = await bare.evaluate(() => document.querySelector('family-hub-card').trustSetup());
  ok('with no health settings there is nothing to set up', none.helpers.length === 0 && Object.keys(none.automations).length === 0 && Object.keys(none.scripts).length === 0);
  await bare.context().close(); }

// 4. private use counts
{ const page = await open('look=glass&page=planner&trust=1&timer=0'); const card = C(page);
  await card.locator('nav.dock .item').filter({ hasText: /Groceries$/ }).click(); await page.waitForTimeout(400);
  const field = card.locator('fh-groceries input').first(); await field.click(); await field.fill('secret birthday cake'); await page.waitForTimeout(200);
  await card.locator('header .hb[data-act="more"]').click(); await page.waitForTimeout(400);
  await page.clock.runFor('01:10'); await page.waitForTimeout(300);
  let items = await list(page, 'todo.family_hub_use');
  ok('after a minute the counts are written as one line for this screen and day', items.length === 1 && /^2026-11-10 [a-z0-9]{4}$/.test(items[0].summary), items);
  const rec = JSON.parse(items[0]?.description || '{}');
  ok('opens and taps are counted per page', rec.v === 1 && rec.p.planner?.[0] === 1 && rec.p.groceries?.[0] === 1 && rec.p.groceries?.[1] >= 1 && rec.p['s-more']?.[0] === 1 && rec.p.planner?.[1] >= 1, rec);
  ok('numbers only: page names and counts, nothing that was typed or read', /^\{"v":1,"p":\{("[a-z0-9-]+":\[\d+,\d+\],?)+\}\}$/.test(items[0]?.description ?? '') && !/secret|cake|Riley|Charlie|Max/i.test(JSON.stringify(items)), items[0]?.description);
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c._sheet = ''; c._kid = 0; c._page = 'kid'; await c.updateComplete; c._kid = 1; await c.updateComplete; });
  await page.waitForTimeout(300); await K(page).locator('.job.row').first().click({ position: { x: 300, y: 10 } }).catch(() => {}); await page.clock.runFor('10:10'); await page.waitForTimeout(300);
  items = await list(page, 'todo.family_hub_use'); const rec2 = JSON.parse(items[0]?.description || '{}');
  ok('the next write updates the same line', items.length === 1 && rec2.p.kid?.[0] === 1, items);
  ok('a child’s page is one page: no count says which child', Object.keys(rec2.p).every((k) => /^(planner|groceries|kid|s-more|morning)$/.test(k)), Object.keys(rec2.p));
  const tot = await page.evaluate(async () => { const T = customElements.get('family-hub-card').trust, h = document.querySelector('family-hub-card').hass; await h.callService('todo', 'add_item', { item: '2026-11-10 zzzz', description: '{"v":1,"p":{"planner":[2,5]}}' }, { entity_id: 'todo.family_hub_use' }); return T.useTotals((await h.callWS({ type: 'todo/item/list', entity_id: 'todo.family_hub_use' })).items, '2026-11-10'); });
  ok('a readout adds the screens together', tot.planner[0] === 3 && tot.planner[1] >= 6, tot);
  await page.context().close();
  const off = await open('look=glass&page=planner'); await off.clock.runFor('01:10');
  ok('with no list in the configuration nothing is counted in Home Assistant', (await list(off, 'todo.family_hub_use')).length === 0);
  await off.context().close(); }

// 5. the jar, tied to the jobs
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const page = await open(`look=${look}&page=kid&kid=0`, '16:20', { before: () => { try { localStorage.setItem('family-hub-kid-riley', JSON.stringify({ calm: false })); } catch { /* blocked */ } } }); const kid = K(page);
  const rows = await kid.locator('.job.row').evaluateAll((els) => els.map((e) => ({ t: e.querySelector('.t').textContent.trim(), mb: e.querySelector('.mb')?.textContent.trim() ?? '', label: e.querySelector('.mb')?.getAttribute('aria-label') ?? '', pts: e.querySelector('.plus')?.textContent.trim() ?? '' })));
  const job = rows.find((x) => x.t === 'Unpack the dishwasher'), routine = rows.find((x) => x.t === 'Homework'), grow = rows.find((x) => /Clarinet/.test(x.t));
  ok(`${look}: a family job carries a marble and “+1”, with its points beside it`, job?.mb === '+1' && job.label === 'Adds one marble to the family jar' && job.pts === '+10', job);
  ok(`${look}: routines and growing carry no marble`, routine?.mb === '' && grow?.mb === '', [routine, grow]);
  ok(`${look}: the lane says where marbles come from`, (await kid.locator('.sec', { hasText: 'Family jobs' }).innerText()).replace(/\s+/g, ' ').trim() === 'Family jobs each one adds a marble to the jar');
  const jar = (await kid.locator('section[aria-label="Family jar"]').innerText()).replace(/\s+/g, ' ').trim();
  ok(`${look}: the jar card says it in marbles, with one family total for today`, /^Family jar 3 added today 36 marbles to .+ Every family job adds a marble\. Routines and growing add none\.$/i.test(jar), jar);
  if (look === 'glass') {
    await kid.locator('.job.row', { hasText: 'Homework' }).click(); await page.waitForTimeout(500);
    ok('ticking a routine adds no marble', (await calls(page, /script\.fh_add_points/)).length === 0 && await state(page, 'input_number.family_jar') === '84' && await kid.locator('.marble.fly').count() === 0);
    await kid.locator('.job.row', { hasText: 'Clarinet' }).locator('.hit').click(); await page.waitForTimeout(500);
    ok('ticking a growing job adds no marble', (await calls(page, /script\.fh_add_points .*"jar":1/)).length === 0 && await state(page, 'input_number.family_jar') === '84');
    await kid.locator('.job.row', { hasText: 'Unpack the dishwasher' }).click(); await page.waitForTimeout(150);
    ok('ticking a family job sends a marble on its way from the row', await kid.locator('.marble.fly').count() === 1);
    await page.waitForTimeout(500); await settle(page); await page.waitForTimeout(300);
    const adds = await calls(page, /script\.fh_add_points .*"jar":1/);
    ok('and adds exactly one marble', adds.length === 1 && await state(page, 'input_number.family_jar') === '85', adds);
    ok('the marble lands and is cleared away', await kid.locator('.marble.fly').count() === 0);
    const jar2 = (await kid.locator('section[aria-label="Family jar"]').innerText()).replace(/\s+/g, ' ').trim();
    ok('the jar card counts it: one fewer to go, one more today, and the first-use line has done its job', /^Family jar 4 added today 35 marbles to .+ Every family job adds a marble\.$/i.test(jar2), jar2);
    ok('the points still go to the child who did it', await state(page, 'input_number.riley_points') === '130');
  }
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0'); const kid = K(page); // a child's page is calm until he chooses otherwise
  await kid.locator('.job.row', { hasText: 'Unpack the dishwasher' }).click(); await page.waitForTimeout(200);
  ok('in calm mode (how a child’s page starts) nothing flies; the marble is still added', await kid.locator('.marble.fly').count() === 0 && (await calls(page, /script\.fh_add_points .*"jar":1/)).length === 1);
  await page.context().close();
  const nohist = await open('look=glass&page=kid&kid=0&jarbase=none');
  const j = (await K(nohist).locator('section[aria-label="Family jar"]').innerText()).replace(/\s+/g, ' ').trim();
  ok('without history the card makes no claim about today', /Every family job adds a marble\. Routines/.test(j) && !/added today/.test(j), j);
  await nohist.context().close();
  const older = await open('look=glass&page=kid&kid=0&older=1');
  ok('an older child reads the same rule', (await K(older).locator('.sec', { hasText: 'Family jobs' }).innerText()).replace(/\s+/g, ' ').trim() === 'Family jobs each one adds a marble to the jar' && /Routines and practice add none\./.test(await K(older).locator('section[aria-label="Family jar"]').innerText()));
  await older.context().close();
  const all = await open('look=glass&page=kid&kid=1'); const t = await all.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot; return r.querySelector('section[aria-label="Family jar"]').textContent; });
  ok('the total is the family’s: no name beside it', /3 added today/.test(t) && !/Riley|Charlie|Max/.test(t), t.replace(/\s+/g, ' ').trim());
  await all.context().close();
  const small = await open('look=glass&page=kid&kid=0', '16:20', { w: 1312, h: 668 }); const sj = (await K(small).locator('section[aria-label="Family jar"]').innerText()).replace(/\s+/g, ' ').trim();
  ok('on a smaller screen the jar card stays as short as it was: today’s count, no extra line', /^Family jar 3 added today 36 marbles to [^.]+$/i.test(sj), sj);
  ok('and the rule is still on the lane and on each job', (await K(small).locator('.sec', { hasText: 'Family jobs' }).innerText()).includes('each one adds a marble to the jar') && await K(small).locator('.job.row .mb').count() >= 2);
  await small.context().close();
  const wind = await open('look=glass&page=kid&kid=0', '19:20'); const w = (await K(wind).locator('section[aria-label="Family jar"]').innerText()).replace(/\s+/g, ' ').trim();
  ok('near bedtime the jar card is its short self: nothing to earn, nothing to count', /^Family jar 36 marbles to [^.]+$/i.test(w), w);
  await wind.context().close(); }
{ const page = await open('look=glass&page=planner&sheet=settings&pane=rewards'); const txt = await page.locator('fh-settings').evaluate((e) => e.shadowRoot.textContent);
  ok('Settings says marbles too', /Marbles to fill the jar/.test(txt) && /\d+ marbles/.test(txt) && !/Points to fill the jar/.test(txt));
  await page.context().close(); }

// 6. three bin colours
{ const page = await open('look=glass&page=planner&sheet=settings&pane=house'); const S = page.locator('fh-settings');
  for (const g of ['Bins every week', 'Bins taking turns']) { const c = await S.getByRole('group', { name: g }).locator('button').evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    ok(`Settings, ${g}: exactly red, yellow and green, each with what it is for`, c.join('|') === 'Redgeneral waste|Yellowrecycling|Greengarden' || c.join('|') === 'Red general waste|Yellow recycling|Green garden', c); }
  ok('no leftover note when only real bins are saved', await S.locator('[data-act="bin-extra"]').count() === 0);
  await page.context().close();
  const old = await open('look=glass&page=planner&bins=old&sheet=settings&pane=house'); const O = old.locator('fh-settings');
  ok('colours saved from the older list are named once as not bins', (await O.locator('[data-act="bin-extra"]').innerText()).trim() === 'Blue and Purple: not a bin here. They go when you save.', await O.locator('[data-act="bin-extra"]').allInnerTexts());
  ok('and still not offered', await O.getByRole('group', { name: 'Bins every week' }).locator('button').count() === 3);
  await O.getByRole('group', { name: 'Collection day' }).getByRole('button', { name: 'Tue' }).click(); await old.waitForTimeout(200);
  await O.locator('.sft [data-act="save"]').click(); await old.waitForTimeout(700);
  const saved = await old.evaluate(() => window.__dash.views[0].sections[0].cards[1].cards[0].bins);
  ok('saving drops them', saved.always.join(',') === 'green' && saved.alternate.join(',') === 'yellow,red' && saved.day === 2, saved);
  await old.context().close();
  const pl = await open('look=glass&page=planner&bins=old&sheet=sitter'); const txt = await C(pl).evaluate((c) => c.shadowRoot.querySelector('.sheet').textContent);
  ok('the house-info bin line reads only real bins', /green/.test(txt) && !/blue|purple/i.test(txt));
  ok('the planner’s bin line reads only real bins on every week', await pl.evaluate(() => { const c = document.querySelector('family-hub-card'); return [0, 7, 14, 21].every((n) => { const d = new Date(); d.setDate(d.getDate() + n); return c._bins(d).bins.every((b) => ['red', 'yellow', 'green'].includes(b)) && c._bins(d).bins.length === 2; }); }));
  await pl.context().close(); }

// 7. the Wi-Fi password behind the PIN
{ const page = await open('look=glass&page=planner&sheet=sitter'); const card = C(page); const text = () => card.evaluate((c) => c.shadowRoot.querySelector('.sheet').textContent);
  ok('House info names the network but not the password', /Example-Guest/.test(await text()) && !/welcome-in/.test(await text()));
  ok('everything else is still there at once', /In an emergency call 000/.test(await text()) && /Who to ring/.test(await text()) && /Bin night/.test(await text()));
  const show = card.locator('.sheet [data-act="wifi-show"]');
  ok('“Show” is a full-size button', await show.evaluate((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)) >= 44);
  await show.click(); await page.waitForTimeout(400);
  ok('it asks for the PIN', await page.evaluate(() => document.querySelector('family-hub-card')._pinAsk?.reason) === 'Show the Wi-Fi password?');
  await pin(page);
  ok('the right PIN shows the password', /welcome-in/.test(await text()));
  await page.clock.runFor('02:05'); await page.waitForTimeout(200);
  ok('two minutes later it is hidden again', !/welcome-in/.test(await text()) && await show.count() === 1);
  await show.click(); await page.waitForTimeout(300); await pin(page);
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c._sheet = ''; await c.updateComplete; c._sheet = 'sitter'; await c.updateComplete; });
  ok('closing the sheet hides it too', !/welcome-in/.test(await text()));
  await page.context().close();
  const open1 = await open('look=glass&page=planner&sheet=sitter&nopin=1');
  ok('a house with no PIN shows it as before', /welcome-in/.test(await C(open1).evaluate((c) => c.shadowRoot.querySelector('.sheet').textContent)));
  await open1.context().close(); }

await browser.close(); srv.close();
console.log(`\n${pass} passed, ${fails.length} failed${errs.length ? `, ${errs.length} page errors` : ''}`);
for (const f of fails) console.log('FAILED: ' + f);
for (const e of [...new Set(errs)].slice(0, 10)) console.log('ERROR: ' + e);
process.exit(fails.length || errs.length ? 1 : 0);
