// F5, the remaining pages' working part: Groceries (the list first, the keys when the box is touched, aisle headings, "Say it"),
// Weather (what to wear and bring first, the parents' readings behind More), Home (a child's bedroom needs a hold from anyone
// else, and the PIN after his bedtime), the dinner line (one line a day, feeding the shopping list), and end-of-term points
// into the jar (optional, off; its automation rendered by the stand-in).
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4875] node scripts/tests/f5.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4875);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, at = '2026-11-10T16:20:00+08:00') => { const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true, permissions: ['microphone'] }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404|ERR_/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date(at) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const C = (page) => page.locator('family-hub-card');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re.source);
const list = (page, id) => page.evaluate((e) => document.querySelector('family-hub-card').hass.callWS({ type: 'todo/item/list', entity_id: e }).then((r) => r.items.map((x) => ({ uid: x.uid, summary: x.summary, description: x.description, status: x.status }))), id);
const toastOf = (page) => page.evaluate(() => document.querySelector('family-hub-card')._toast ?? '');
const pin = async (page, root = C(page)) => { for (const d of '1234') await root.locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500); };
const typeKeys = async (root, word) => { for (const k of word) await root.locator('.keys .key').filter({ hasText: new RegExp(`^${k === ' ' ? 'space' : k === ',' ? ',' : k}$`, 'i') }).first().click(); };

// 1. Groceries
{ const page = await open('look=glass&page=groceries&long=1'); const G = page.locator('fh-groceries');
  ok('the list comes first: no keys until the box is touched, and a line says how', await G.locator('.keys').count() === 0 && await G.locator('[data-keyhint]').count() === 1);
  const heads = await G.locator('[data-aisle]').evaluateAll((h) => h.map((x) => x.getAttribute('data-aisle')));
  ok('the list is grouped by aisle, each group under its heading, in order', heads.length >= 3 && JSON.stringify(heads) === JSON.stringify([...heads].sort()) && new Set(heads).size === heads.length, heads);
  const order = await G.locator('.items > *').evaluateAll((n) => n.map((x) => (x.hasAttribute('data-aisle') ? '#' + x.getAttribute('data-aisle') : x.classList.contains('item') ? x.querySelector('.strike')?.textContent : '')).filter(Boolean));
  ok('every heading has something under it', order.every((x, i) => !x.startsWith('#') || (order[i + 1] && !order[i + 1].startsWith('#'))), order.slice(0, 8));
  await G.locator('.entry .field').dispatchEvent('pointerdown'); await page.waitForTimeout(250);
  ok('touching the box brings the keys up', await G.locator('.keys').count() === 1 && await G.locator('[data-keyhint]').count() === 0);
  await typeKeys(G, 'kiwi'); 
  ok('the keys type into the box', await G.locator('.entry .field').inputValue() === 'Kiwi', await G.locator('.entry .field').inputValue());
  await G.locator('.entry .lead').click(); await page.waitForTimeout(500);
  ok('Add puts it on the list and keeps the keys for the next thing', (await calls(page, /todo\.add_item todo\.shopping_list.*Kiwi/)).length === 1 && await G.locator('.keys').count() === 1);
  await G.locator('[data-act="hide-keys"]').click(); await page.waitForTimeout(200);
  ok('“Hide the keys” gives the room back', await G.locator('.keys').count() === 0);
  await G.locator('.usuals .quick').filter({ hasText: 'Cheese' }).click(); await page.waitForTimeout(400);
  ok('a usual is still one tap, with no keys', ((await calls(page, /todo\.add_item todo\.shopping_list.*Cheese/)).length === 1 || /already on the list/.test(await G.evaluate((g) => g._toast))) && await G.locator('.keys').count() === 0, await G.evaluate((g) => g._toast));
  // say it
  const say = G.locator('[data-act="say"]');
  ok('where the browser gives the microphone, “Say it” is offered', await say.count() === 1);
  await page.evaluate(() => { window.__sttText = 'Some oat milk and eggs, and the sourdough loaf.'; window.__calls = []; });
  await say.click();
  await page.waitForFunction(() => /^Heard: /.test(document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries')._toast ?? ''), null, { timeout: 12000 }).catch(() => {});
  const heard = await G.evaluate((g) => g._toast), adds = await calls(page, /todo\.add_item todo\.shopping_list/), run = await calls(page, /assist_pipeline\/run/);
  ok('it listens once, for the words only (nothing is asked of the helper)', run.length === 1 && /"end_stage":"stt"/.test(run[0]), run);
  ok('each thing that was said goes on the list; what is already there is not added twice', /^Heard: oat milk, eggs, sourdough loaf$/.test(heard) && adds.length >= 1 && adds.length <= 2 && /Oat milk/.test(adds[0]) && !adds.some((a) => /Sourdough/.test(a)), [heard, adds]);
  await page.evaluate(() => { window.__sttText = ''; }); await say.click();
  await page.waitForFunction(() => /did not catch/.test(document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries')._toast ?? ''), null, { timeout: 12000 }).catch(() => {});
  ok('nothing heard is said plainly and adds nothing', /did not catch that/.test(await G.evaluate((g) => g._toast)) && (await calls(page, /todo\.add_item todo\.shopping_list/)).length === adds.length, await G.evaluate((g) => g._toast));
  await page.context().close(); }
{ const page = await open('look=glass&page=groceries&chat=off');
  ok('with no speech pipeline there is no “Say it”', await page.locator('fh-groceries [data-act="say"]').count() === 0);
  await page.context().close(); }

// 2. Weather
{ const page = await open('look=glass&page=weather'); const W = page.locator('fh-weather'), now = W.locator('.wnow');
  const order = await now.evaluate((n) => [...n.children].map((c) => c.className.split(' ')[0] || c.tagName.toLowerCase()));
  ok('what to wear and bring is the first thing under the heading, before the temperature', order.indexOf('wtip') >= 0 && order.indexOf('wtip') < order.indexOf('top') && await now.locator('.wtip[data-first] .tipone').count() >= 1, order);
  const before = await now.innerText();
  ok('humidity, fire danger and sunrise wait behind More', !/Humidity|Fire danger|Sunrise to sunset/.test(before) && await now.locator('[data-act="wmore"]').getAttribute('aria-expanded') === 'false', before.replace(/\n/g, ' | ').slice(0, 200));
  await now.locator('[data-act="wmore"]').click(); await page.waitForTimeout(250);
  ok('More shows them, and Less puts them away', /Fire danger/.test(await now.innerText()) && /Sunrise to sunset/.test(await now.innerText()) && (await now.locator('[data-act="wmore"]').innerText()).trim() === 'Less', (await now.innerText()).replace(/\n/g, ' | ').slice(0, 300));
  ok('the advice can still be read aloud', await now.locator('.wtip .speak').count() === 1);
  await page.context().close(); }

// 3. Home: a child's bedroom
{ const page = await open('look=glass&page=home'); const H = page.locator('fh-home');
  const guards = await H.locator('.room').evaluateAll((r) => Object.fromEntries(r.map((x) => [x.getAttribute('data-room'), x.querySelector('[data-rguard]')?.getAttribute('data-rguard') ?? 'free'])));
  ok('by day each child’s bedroom says “Hold to switch”; the shared rooms do not', guards.riley === 'hold' && guards.charlie === 'hold' && guards.max === 'hold' && guards.kitchen === 'free' && guards.lounge === 'free', guards);
  const dev = H.locator('.room[data-room="riley"] .dev[role="switch"]').first(), was = await dev.getAttribute('aria-checked');
  await dev.click(); await page.waitForTimeout(300);
  ok('a tap there switches nothing and says to hold', await dev.getAttribute('aria-checked') === was && (await calls(page, /homeassistant\.toggle/)).length === 0 && /Hold to switch that: it is Riley’s room/.test(await toastOf(page)), await toastOf(page));
  const box = await dev.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(250);
  ok('letting go early switches nothing', (await calls(page, /homeassistant\.toggle/)).length === 0); await page.mouse.up(); await page.waitForTimeout(200);
  await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(400);
  ok('a hold switches it, once', (await calls(page, /homeassistant\.toggle/)).length === 1 && await dev.getAttribute('aria-checked') !== was, await calls(page, /homeassistant\.toggle/));
  const kdev = H.locator('.room[data-room="kitchen"] .dev[role="switch"]').first(); await kdev.click(); await page.waitForTimeout(300);
  ok('a shared room is one tap, as before', (await calls(page, /homeassistant\.toggle/)).length === 2);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0'); 
  await page.locator('family-hub-card nav.dock[data-kid] .item, family-hub-card nav.dock .item').filter({ hasText: /Home$/ }).first().click(); await page.waitForTimeout(700);
  await page.locator('family-hub-card nav.dock .item').filter({ hasText: /^\s*Home\s*$/ }).last().click(); await page.waitForTimeout(700);
  const H = page.locator('fh-home');
  const guards = await H.locator('.room').evaluateAll((r) => Object.fromEntries(r.map((x) => [x.getAttribute('data-room'), x.querySelector('[data-rguard]')?.getAttribute('data-rguard') ?? 'free'])));
  ok('the Home page opened straight after a child’s own page: his room is his to switch, his brothers’ are not', guards.riley === 'free' && guards.charlie === 'hold', [guards, await page.evaluate(() => document.querySelector('family-hub-card')._page)]);
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c._page = 'planner'; }); await page.waitForTimeout(300); await page.clock.runFor('02:30'); await page.keyboard.press('Shift'); await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c._art?.wake?.(); c._page = 'home'; }); await page.waitForTimeout(500);
  ok('a few minutes later it is anyone’s visit again: his room needs the hold', await H.locator('.room[data-room="riley"] [data-rguard="hold"]').count() === 1);
  await page.context().close(); }
{ const page = await open('look=glass&page=home', '2026-11-10T20:30:00+08:00'); const H = page.locator('fh-home');
  await page.evaluate(() => document.querySelector('family-hub-card')._art?.wake?.()); await page.waitForTimeout(300);
  const dev = H.locator('.room[data-room="riley"] .dev[role="switch"]').first();
  ok('after his bedtime his room is marked for parents', await H.locator('.room[data-room="riley"] [data-rguard="pin"]').count() === 1);
  await dev.click(); await page.waitForTimeout(400);
  ok('and a tap asks for the PIN, saying why', await H.locator('fh-pin').count() === 1 && (await calls(page, /homeassistant\.toggle/)).length === 0 && /after Riley’s bedtime/.test(await H.locator('fh-pin').getAttribute('reason') ?? ''), await H.locator('fh-pin').getAttribute('reason').catch(() => ''));
  await pin(page, H); await page.waitForTimeout(400);
  ok('the PIN switches it', (await calls(page, /homeassistant\.toggle/)).length === 1);
  await page.context().close(); }

// 4. the dinner line
{ const page = await open('look=glass&page=planner&notes=1'); const row = C(page).locator('[data-act="dinner"]');
  ok('the Reminders card carries the dinner line, unset', await row.count() === 1 && /Dinner tonight\?/.test(await row.innerText()));
  await row.click(); await page.waitForTimeout(400);
  const sheet = C(page).locator('.sheet[data-sheet="dinner"]');
  ok('a tap shows the week: seven days, tonight first', await sheet.locator('[data-day]').count() === 7 && /Tonight/.test(await sheet.locator('[data-day]').first().innerText()) && await sheet.locator('[data-day]').first().getAttribute('data-day') === '2026-11-10');
  await sheet.locator('[data-day]').first().click(); await page.waitForTimeout(400);
  ok('changing a dinner is a parent’s job: the PIN', await C(page).locator('fh-pin').count() === 1);
  await pin(page); await page.waitForTimeout(300);
  await typeKeys(sheet, 'tacos');
  await sheet.locator('[data-act="dn-buy"]').dispatchEvent('pointerdown'); await page.waitForTimeout(150); await typeKeys(sheet, 'mince, milk');
  ok('two boxes, one set of keys: the dinner, and what to buy for it', await sheet.locator('[data-act="dn-text"]').inputValue() === 'Tacos' && await sheet.locator('[data-act="dn-buy"]').inputValue() === 'mince, milk', [await sheet.locator('[data-act="dn-text"]').inputValue(), await sheet.locator('[data-act="dn-buy"]').inputValue()]);
  await sheet.locator('[data-act="dn-save"]').click(); await page.waitForTimeout(900);
  const asks = await list(page, 'todo.family_hub_asks'), shop = await list(page, 'todo.shopping_list');
  ok('Save keeps one line for that day', asks.length === 1 && asks[0].description === 'dinner {"v":1,"d":"2026-11-10","text":"Tacos"}', asks);
  ok('what it needs goes on the shopping list, but not what is already there', shop.filter((x) => x.summary === 'Mince').length === 1 && shop.filter((x) => /^milk$/i.test(x.summary)).length === 1 && /1 thing added to the shopping list/.test(await toastOf(page)), [await toastOf(page), shop.map((x) => x.summary)]);
  ok('the week shows it, and so does the planner', /Tacos/.test(await sheet.locator('[data-day]').first().innerText()) && /Dinner: Tacos/.test((await row.innerText()).replace(/\s+/g, ' ')), await row.innerText());
  ok('the bell does not count a dinner', await C(page).locator('header [data-act="bell"]').count() === 0);
  await sheet.locator('[data-day]').nth(1).click(); await page.waitForTimeout(300);
  ok('once the PIN has been given, the next day opens without it', await C(page).locator('fh-pin').count() === 0 && await sheet.locator('[data-act="dn-text"]').count() === 1);
  await sheet.locator('[data-act="dn-back"]').click(); await page.waitForTimeout(200);
  await sheet.locator('[data-day]').first().click(); await page.waitForTimeout(300);
  for (let i = 0; i < 5; i++) await sheet.locator('.keys .key[aria-label="Delete"]').click();
  await sheet.locator('[data-act="dn-save"]').click(); await page.waitForTimeout(800);
  ok('emptying it clears the day', (await list(page, 'todo.family_hub_asks')).length === 0 && /Dinner tonight\?/.test(await row.innerText()), await list(page, 'todo.family_hub_asks'));
  await page.context().close(); }
{ const page = await open('look=glass&page=morning&notes=1', '2026-11-10T07:00:00+08:00');
  await page.evaluate(async () => { const h = document.querySelector('family-hub-card').hass; const L = { entity_id: 'todo.family_hub_asks' };
    await h.callService('todo', 'add_item', { item: 'old', description: 'dinner {"v":1,"d":"2026-11-01","text":"Old soup"}' }, L);
    await h.callService('todo', 'add_item', { item: 'd', description: 'dinner {"v":1,"d":"2026-11-10","text":"Fish and chips"}' }, L); }); await page.waitForTimeout(900);
  const M = page.locator('fh-morning');
  ok('the morning board says what is for dinner tonight', await M.count() === 1 && /Dinner tonight: Fish and chips/.test(await M.locator('[data-part="dinner"]').innerText().catch(() => '')), await M.locator('.board').innerText().catch(() => '').then((t) => t.slice(0, 120)));
  ok('a dinner from days ago is taken off the list', (await list(page, 'todo.family_hub_asks')).length === 1);
  await page.context().close(); }
{ const page = await open('look=glass&page=planner');
  ok('with nowhere to keep it, there is no dinner line', await C(page).locator('[data-act="dinner"]').count() === 0);
  await page.context().close(); }

// 5. end of term: points into the jar (optional, off)
{ const HOUSE = { type: 'x', kids: [{ name: 'Riley', colour: 3 }, { name: 'Max', colour: 5, points: 'input_number.maxs_stars' }, { name: 'Sam', colour: 2 }], school_terms: [['2026-10-12', '2026-12-10'], ['2027-02-01', '2027-04-01']], jar: { target: 120, term_points: 10 } };
  const page = await open('look=glass&page=planner&terms=1&sheet=settings&pane=rewards');
  const built = await page.evaluate((house) => { const F = customElements.get('family-hub-card'); return { on: F.term.haTerm(house), off: F.term.haTerm({ ...house, jar: { target: 120 } }), noterms: F.term.haTerm({ ...house, school_terms: [] }), own: document.querySelector('family-hub-card').termSetup() }; }, HOUSE);
  ok('off unless a rate is set, and it needs the terms: no automation', built.off === null && built.noterms === null && built.own === null);
  ok('on: one automation at 4 pm, only on the last day of a term', built.on?.alias === 'Family Hub: end-of-term points into the jar' && built.on.triggers[0].at === '16:00:00' && /2026-12-10/.test(built.on.conditions[0].value_template) && /2027-04-01/.test(built.on.conditions[0].value_template) && !/2026-10-12/.test(built.on.conditions[0].value_template));
  const st = (state, attributes = {}) => ({ state, attributes });
  const S = { 'input_number.riley_points': st('57'), 'input_number.maxs_stars': st('8'), 'input_number.sam_points': st('120'), 'input_number.family_jar': st('84', { max: 200 }) };
  const scenarios = [{ name: 'last', now: '2026-12-10T16:00:00+08:00', states: S }, { name: 'ordinary', now: '2026-12-09T16:00:00+08:00', states: S }, { name: 'full', now: '2026-12-10T16:00:00+08:00', states: { ...S, 'input_number.family_jar': st('195', { max: 200 }) } },
    { name: 'none', now: '2026-12-10T16:00:00+08:00', states: { ...S, 'input_number.riley_points': st('3'), 'input_number.sam_points': st('unavailable') } }];
  const py = spawnSync('python3', [path.join(ROOT, 'scripts/tests/digest_render.py')], { input: JSON.stringify({ automation: built.on, scenarios }), encoding: 'utf8' });
  if (py.status !== 0 && /No module named|ENOENT|not found/i.test(String(py.stderr) + String(py.error ?? ''))) console.log('skip the end-of-term automation was NOT checked here: python3 with jinja2 is needed');
  else { let R = {}; try { R = Object.fromEntries(JSON.parse(py.stdout).map((r) => [r.name, r])); } catch { /* reported below */ }
    ok('the stand-in for Home Assistant ran every case', Object.keys(R).length === 4 && Object.values(R).every((r) => !r.error), Object.values(R).filter((r) => r.error).map((r) => `${r.name}: ${r.error}`).join(' | ') || String(py.stderr).slice(-300));
    const pts = (n) => (R[n]?.sent ?? []).filter((s) => s.to === 'script.fh_add_points'), jar = (n) => (R[n]?.sent ?? []).filter((s) => s.to === 'input_number.set_value');
    ok('whole marbles only: 57 points gives 5 and keeps 7; 8 points gives none; 120 gives 12', pts('last').length === 2 && pts('last')[0].kid === 'riley' && pts('last')[0].points === -50 && pts('last')[1].kid === 'sam' && pts('last')[1].points === -120 && pts('last').every((p) => p.lifetime === false && p.jar === 0), pts('last'));
    ok('the jar gets them all at once', jar('last').length === 1 && jar('last')[0].value === 101 && jar('last')[0].target.entity_id === 'input_number.family_jar', jar('last'));
    ok('on any other day nothing happens', R.ordinary?.skipped === true);
    ok('the jar never goes past its own top', jar('full')[0]?.value === 200, jar('full'));
    ok('with no child holding a marble’s worth, nothing is touched', (R.none?.sent ?? []).length === 0 && !!R.none?.stopped, R.none); }
  // Settings
  const S2 = page.locator('fh-settings'), sw = S2.getByRole('switch', { name: 'End of term: points into the jar', exact: true });
  ok('Settings, Rewards has the switch, off', await sw.count() === 1 && await sw.getAttribute('aria-checked') === 'false');
  await sw.click(); await page.waitForTimeout(250); await S2.locator('.sft [data-act="save"]').click(); await page.waitForTimeout(900);
  const made = await page.evaluate(() => ({ calls: (window.__calls ?? []).filter((c) => /api\.POST/.test(c)), body: window.__term, jar: document.querySelector('family-hub-card')._config.jar }));
  ok('switching it on and saving writes the automation, at 10 points a marble', made.calls.join() === 'api.POST config/automation/config/family_hub_term' && made.body?.id === 'family_hub_term' && made.jar.term_points === 10, [made.calls, made.jar]);
  await page.context().close(); }

await browser.close(); srv.close();
console.log(`\n${pass} passed, ${fails.length} failed${errs.length ? `, ${errs.length} page errors` : ''}`);
for (const f of fails) console.log('FAILED: ' + f);
for (const e of [...new Set(errs)].slice(0, 10)) console.log('ERROR: ' + e);
process.exit(fails.length || errs.length ? 1 : 0);
