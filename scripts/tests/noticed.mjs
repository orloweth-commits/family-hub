// F3 item 5, "I noticed": a parent leaves a short note from a child's settings (behind the PIN); it is one line on the asks list
// that nothing in Home Assistant acts on; it waits over his page until he taps Thanks; it gives no points; the bell, the digest
// and the approvals automation all pass it by.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4871] node scripts/tests/noticed.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4871);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs) => { const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const C = (page) => page.locator('family-hub-card');
const K = (page) => page.locator('family-hub-card fh-kid');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re.source);
const state = (page, id) => page.evaluate((e) => document.querySelector('family-hub-card').hass.states[e]?.state, id);
const list = (page, id = 'todo.family_hub_asks') => page.evaluate((e) => document.querySelector('family-hub-card').hass.callWS({ type: 'todo/item/list', entity_id: e }).then((r) => r.items.map((x) => ({ uid: x.uid, summary: x.summary, description: x.description, status: x.status }))), id);
const toast = (page) => page.evaluate(() => document.querySelector('family-hub-card')._toast ?? '');
const pin = async (page) => { for (const d of '1234') await C(page).locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500); };
const card = (page) => K(page).locator('[data-noticed]');
const shown = (page) => card(page).waitFor({ state: 'visible', timeout: 6000 }).then(() => page.waitForTimeout(150)).catch(() => {});
const gone = (page) => card(page).waitFor({ state: 'detached', timeout: 6000 }).catch(() => {});
const settings = async (page) => { await C(page).locator('header [data-act="looks"]').click(); await page.waitForTimeout(300); await pin(page); };
const add = (page, kid, who, text, id, t = 1) => page.evaluate(async ([kid, who, text, id, t]) => { const h = document.querySelector('family-hub-card').hass; await h.callService('todo', 'add_item', { item: who + ': a note from a parent', description: 'note ' + JSON.stringify({ v: 1, id, kid, who, text, t }) }, { entity_id: 'todo.family_hub_asks' }); }, [kid, who, text, id, t]);
const PTS = 'input_number.charlie_points';

// 1. a parent leaves a note; the child sees it and says thanks
{ const page = await open('look=glass&page=kid&kid=1&approve=1&shuffle=0'); const before = await state(page, PTS);
  ok('nothing is over his page to begin with', await card(page).count() === 0);
  await settings(page);
  const rowBtn = C(page).locator('.sheet[data-sheet="kidprefs"] [data-act="note-open"]');
  ok('his settings, behind the PIN, offer “Leave a note”', await rowBtn.count() === 1);
  await rowBtn.click(); await page.waitForTimeout(300);
  const sheet = C(page).locator('.sheet[data-sheet="noticed"]');
  ok('the sheet has ready lines, a field for a parent’s own words and the keys', await sheet.locator('[data-act="note-say"]').count() === 6 && await sheet.locator('[data-act="note-text"]').count() === 1 && await sheet.locator('.keys').count() === 1 && /A note for Charlie/.test(await sheet.innerText()), (await sheet.innerText().catch(() => '')).slice(0, 80));
  ok('“Leave it” waits for words', await sheet.locator('[data-act="note-send"]').isDisabled());
  ok('nothing is written by looking', (await list(page)).length === 0);
  await sheet.locator('[data-act="note-say"]').nth(1).click(); await shown(page);
  let items = await list(page); const rec = JSON.parse((items[0]?.description ?? 'note {}').slice(5));
  ok('one tap on a ready line writes one line to the list', items.length === 1 && /^note \{/.test(items[0].description) && rec.v === 1 && rec.kid === 'charlie' && rec.text === 'I noticed how hard you tried today.' && /^n[a-z0-9]{6}$/.test(rec.id) && items[0].summary === 'Charlie: a note from a parent', items);
  ok('the sheet closes and the parent is told where it went', await sheet.count() === 0 && /^Left on Charlie’s page\./.test(await toast(page)), await toast(page));
  ok('no phone is told, no points move, no automation is written', (await calls(page, /^notify\.|fh_add_points|api\.POST|api\.event/)).length === 0 && await state(page, PTS) === before);
  ok('the note is over his page, in the parent’s words, with Thanks', await card(page).count() === 1 && /I noticed how hard you tried today\./.test(await card(page).innerText()) && /A NOTE FROM A PARENT/i.test(await card(page).innerText()) && await card(page).locator('[data-act="note-thanks"]').count() === 1, await card(page).innerText().catch(() => ''));
  const box = await card(page).locator('.cbox').boundingBox();
  ok('it fits inside 1920 x 1080', !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 1920 && box.y + box.height <= 1080, box);
  await card(page).locator('[data-act="note-thanks"]').click(); await gone(page); await page.waitForTimeout(300);
  ok('Thanks puts it away and takes the line off the list', await card(page).count() === 0 && (await list(page)).length === 0 && await state(page, PTS) === before, await list(page));
  // a parent's own words, typed on the panel's keys
  await settings(page); await C(page).locator('[data-act="note-open"]').click(); await page.waitForTimeout(300);
  for (const k of ['g', 'r', 'e', 'a', 't', ' ', 'c', 'a', 't', 'c', 'h']) await sheet.locator('.keys .key').filter({ hasText: new RegExp(`^${k === ' ' ? '(space|\\s*)' : k}$`, 'i') }).first().click();
  const typed = await sheet.locator('[data-act="note-text"]').inputValue();
  ok('the keys type into the field, the first letter a capital', /^Great ?catch$/.test(typed), typed);
  await sheet.locator('[data-act="note-send"]').click(); await shown(page);
  ok('a parent’s own words arrive as written', new RegExp(typed).test(await card(page).innerText()), await card(page).innerText().catch(() => ''));
  // two waiting: one at a time, oldest first
  await add(page, 'charlie', 'Charlie', 'Second note.', 'nsecond', 9e12); await page.waitForFunction(() => /more note/.test(document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('[data-noticed]')?.textContent ?? ''), null, { timeout: 6000 }).catch(() => {});
  ok('a second note waits its turn, and the card says so', new RegExp(typed).test(await card(page).innerText()) && /One more note after this/.test(await card(page).innerText()), await card(page).innerText());
  await card(page).locator('[data-act="note-thanks"]').click(); await page.waitForTimeout(600);
  ok('after Thanks the next one comes up', /Second note\./.test(await card(page).innerText().catch(() => '')) && (await list(page)).length === 1, await card(page).innerText().catch(() => ''));
  await page.context().close(); }

// 2. whose it is, and what passes it by
{ const page = await open('look=glass&page=kid&kid=0&approve=1&shuffle=0');
  await add(page, 'charlie', 'Charlie', 'For Charlie only.', 'ncharl1'); await page.waitForTimeout(600);
  ok('a note for one child is not shown on, or cleared by, his brother’s page', await card(page).count() === 0 && (await list(page)).length === 1);
  await page.locator('family-hub-card nav.dock[data-kid] .item, family-hub-card nav.dock .item').filter({ hasText: /Home$/ }).first().click(); await page.waitForTimeout(600);
  ok('the bell does not count a note', await C(page).locator('header [data-act="bell"]').count() === 0);
  const words = await page.evaluate(() => { const out = []; const walk = (r) => { for (const n of r.querySelectorAll('*')) if (n.shadowRoot) walk(n.shadowRoot); out.push(r.textContent ?? ''); }; walk(document.querySelector('family-hub-card').shadowRoot); return out.join(' '); });
  ok('nothing about it shows on the shared pages', !/For Charlie only/.test(words));
  await C(page).locator('nav.dock .item').filter({ hasText: /Charlie$/ }).first().click(); await shown(page);
  ok('it is there when his own page is opened', /For Charlie only\./.test(await card(page).innerText().catch(() => '')));
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=2&notes=1&shuffle=0');
  await add(page, 'max', 'Max', 'I noticed you packed your bag.', 'nmax001'); await shown(page);
  ok('the youngest’s note has a button that reads it to him', await card(page).locator('[aria-label="Read the note"]').count() === 1 && /packed your bag/.test(await card(page).innerText()));
  await settings(page);
  ok('notes need the list, not a phone: “Leave a note” is offered with no phone named', await C(page).locator('[data-act="note-open"]').count() === 1);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=1&shuffle=0'); await settings(page);
  ok('with no list in Home Assistant there is nothing to offer', await C(page).locator('.sheet[data-sheet="kidprefs"]').count() === 1 && await C(page).locator('[data-act="note-open"]').count() === 0);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=1&notes=1&shuffle=0');
  await page.evaluate(async () => { const h = document.querySelector('family-hub-card').hass; const L = { entity_id: 'todo.family_hub_asks' };
    await h.callService('todo', 'add_item', { item: 'junk', description: 'note not json' }, L);
    await h.callService('todo', 'add_item', { item: 'empty', description: 'note {"v":1,"id":"nempty1","kid":"charlie","who":"Charlie","text":"   ","t":1}' }, L);
    await h.callService('todo', 'add_item', { item: 'long', description: 'note ' + JSON.stringify({ v: 1, id: 'nlong01', kid: 'charlie', who: 'Charlie', text: 'x'.repeat(400), t: 2 }) }, L); }); await shown(page);
  const txt = await card(page).locator('[data-note]').innerText().catch(() => '');
  ok('a line that is not a note, or says nothing, is passed by; a very long one is cut to 140 characters', await card(page).locator('[data-note]').getAttribute('data-note') === 'nlong01' && txt.length === 140 && !/more note/.test(await card(page).innerText()), txt.length);
  await page.evaluate(() => { window.__todoFail = 'todo.family_hub_asks'; });
  await settings(page); await C(page).locator('[data-act="note-open"]').click(); await page.waitForTimeout(300); await C(page).locator('[data-act="note-say"]').first().click(); await page.waitForTimeout(700);
  ok('if Home Assistant will not keep the note the parent is told and the sheet stays', /was not kept/.test(await toast(page)) && await C(page).locator('.sheet[data-sheet="noticed"]').count() === 1, await toast(page));
  await page.context().close(); }

// 3. what Home Assistant runs passes a note by (rendered by the stand-in)
{ const HOUSE = { type: 'x', kids: [{ name: 'Riley', colour: 3 }], approve: { notify: ['notify.mobile_app_alex'] }, digest: { notify: ['notify.mobile_app_alex'] } };
  const page = await open('look=glass&page=planner&approve=1');
  const built = await page.evaluate((house) => { const F = customElements.get('family-hub-card'); return { approve: F.approve.haApprove(house), digest: F.digest.haDigest(house) }; }, HOUSE);
  await page.context().close();
  const note = { uid: 'u-n1', summary: 'Riley: a note from a parent', status: 'needs_action', description: 'note ' + JSON.stringify({ v: 1, id: 'nabc123', kid: 'riley', who: 'Riley', text: 'I noticed.', t: 1 }) };
  const scenarios = [
    { name: 'button', now: '2026-11-10T17:00:00+08:00', states: { 'input_number.riley_points': { state: '300', attributes: {} } }, vars: { trigger: { event: { data: { action: 'FH_OK_nabc123' } } } }, responses: { asks: { 'todo.family_hub_asks': { items: [note] } } }, automation: built.approve },
    { name: 'digest', now: '2026-11-13T19:30:00+08:00', states: {}, responses: { waiting: { 'todo.family_hub_asks': { items: [note] } } }, automation: built.digest }
  ];
  const py = spawnSync('python3', [path.join(ROOT, 'scripts/tests/digest_render.py')], { input: JSON.stringify({ automation: built.approve, scenarios }), encoding: 'utf8' });
  if (py.status !== 0 && /No module named|ENOENT|not found/i.test(String(py.stderr) + String(py.error ?? ''))) console.log('skip what Home Assistant does with a note was NOT checked here: python3 with jinja2 is needed');
  else { let R = {}; try { R = Object.fromEntries(JSON.parse(py.stdout).map((r) => [r.name, r])); } catch { /* reported below */ }
    ok('the stand-in for Home Assistant ran both cases', Object.keys(R).length === 2 && Object.values(R).every((r) => !r.error), Object.values(R).filter((r) => r.error).map((r) => r.error).join(' | ') || String(py.stderr).slice(-300));
    ok('the approvals automation cannot be made to act on a note', R.button?.skipped === true && (R.button?.sent ?? []).length === 0, R.button);
    ok('the evening digest does not list a note as waiting for an answer', !/Waiting for your answer/.test(String(R.digest?.message ?? '')) && !/note from a parent/.test(String(R.digest?.message ?? '')), R.digest?.message); } }

await browser.close(); srv.close();
console.log(`\n${pass} passed, ${fails.length} failed${errs.length ? `, ${errs.length} page errors` : ''}`);
for (const f of fails) console.log('FAILED: ' + f);
for (const e of [...new Set(errs)].slice(0, 10)) console.log('ERROR: ' + e);
process.exit(fails.length || errs.length ? 1 : 0);
