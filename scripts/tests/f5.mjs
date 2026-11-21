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
  const order = await G.locator('.items > :not(.grp), .items > .grp > *').evaluateAll((n) => n.map((x) => (x.hasAttribute('data-aisle') ? '#' + x.getAttribute('data-aisle') : x.classList.contains('item') ? x.querySelector('.strike')?.textContent : '')).filter(Boolean));
  ok('every heading has something under it', order.every((x, i) => !x.startsWith('#') || (order[i + 1] && !order[i + 1].startsWith('#'))), order.slice(0, 8));
  // 0.38.3, the layout: the list has the room, the usuals are large chips, the keys slide up over the lower part of the page
  const box = (sel) => G.locator(sel).first().evaluate((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, b: b.bottom, r: b.right }; });
  const L0 = await box('.list'), A0 = await box('.add'), chips = await G.locator('.usuals .quick').evaluateAll((n) => n.map((x) => x.getBoundingClientRect().height));
  ok('the list has the room: well over half the page, the panel beside it narrow', L0.w > 2 * A0.w && L0.w > 1100, [Math.round(L0.w), Math.round(A0.w)]);
  ok('the list is laid out in three columns or more, and goes down the page, not sideways', await G.locator('.items').evaluate((e) => new Set([...e.querySelectorAll('button.item')].map((b) => Math.round(b.getBoundingClientRect().x))).size >= 3 && e.scrollWidth <= e.clientWidth + 1));
  ok('the usuals are large chips', chips.length >= 6 && chips.every((h) => h >= 85), chips.map(Math.round));
  await G.locator('.entry .field').dispatchEvent('pointerdown'); await page.waitForTimeout(600);
  ok('touching the box brings the keys up', await G.locator('.keys').count() === 1 && await G.locator('[data-keyhint]').count() === 0);
  await G.evaluate((g) => g.shadowRoot.getAnimations().forEach((x) => x.finish())); // a fake clock holds the slide where it is
  { const T = await box('.tray'), L1 = await box('.list'), H = await G.evaluate((g) => g.getBoundingClientRect());
    ok('the keys are a tray over the lower part of the page: full width, under half its height, down at the bottom', Math.abs(T.w - H.width) < 2 && T.h < H.height * 0.52 && Math.abs(T.b - H.bottom) < 2 && T.y > H.y + H.height * 0.45, [Math.round(T.y), Math.round(T.h), Math.round(H.height)]);
    ok('the list keeps its full width and place with the keys up', Math.abs(L1.w - L0.w) < 1 && Math.abs(L1.x - L0.x) < 1 && Math.abs(L1.h - L0.h) < 1, [Math.round(L0.w), Math.round(L1.w)]);
    ok('the box goes with the keys, and there is one box', await G.locator('.tray .entry .field').count() === 1 && await G.locator('.entry .field').count() === 1 && await G.evaluate((g) => g.shadowRoot.activeElement?.classList.contains('field'))); }
  await typeKeys(G, 'kiwi'); 
  ok('the keys type into the box', await G.locator('.entry .field').inputValue() === 'Kiwi', await G.locator('.entry .field').inputValue());
  await G.locator('.entry .lead').click(); await page.waitForTimeout(500);
  ok('Add puts it on the list and keeps the keys for the next thing', (await calls(page, /todo\.add_item todo\.shopping_list.*Kiwi/)).length === 1 && await G.locator('.keys').count() === 1);
  await G.locator('[data-act="hide-keys"]').click(); await page.waitForTimeout(200);
  ok('“Hide the keys” gives the room back', await G.locator('.keys').count() === 0);
  await page.waitForFunction(() => !document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries').shadowRoot.querySelector('.tray'), null, { timeout: 3000 }).catch(() => {});
  ok('the tray goes away again and the box is back in its panel', await G.locator('.tray').count() === 0 && await G.locator('.add .entry .field').count() === 1 && await G.locator('[data-keyhint]').count() === 1);
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
  // 0.38.3, the layout: the radar is large only while rain is about
  const area = (sel) => W.locator(sel).evaluate((e) => { const b = e.getBoundingClientRect(); return Math.round(b.width * b.height); });
  const dry = { attr: await W.evaluate((w) => w.hasAttribute('data-dry')), size: await W.locator('.wmaps').getAttribute('data-size'), map: await area('.wmaps'), week: await area('.wweek'), line: await W.locator('[data-dryline]').count(), seg: await W.locator('.wmaps .seg').count() };
  ok('on a dry day the radar is a small card that says so, and the week has the room', dry.attr && dry.size === 'small' && dry.line === 1 && dry.seg === 0 && dry.week > dry.map * 1.3, dry);
  ok('the week then reads across the page, a column a day', await W.locator('.wday').evaluateAll((d) => d.length === 7 && new Set(d.map((x) => Math.round(x.getBoundingClientRect().y))).size === 1 && d.every((x) => x.scrollWidth <= x.clientWidth + 1)));
  await W.locator('[data-act="mapsize"]').click(); await page.waitForTimeout(300);
  ok('“Bigger map” makes it the large piece, with the wind map beside it; “Smaller map” puts it back', await W.locator('.wmaps').getAttribute('data-size') === 'large' && !(await W.evaluate((w) => w.hasAttribute('data-dry'))) && await W.locator('.wmaps .seg').count() === 1 && (await W.locator('[data-act="mapsize"]').innerText()).trim() === 'Smaller map');
  await W.locator('[data-act="mapsize"]').click(); await page.waitForTimeout(300);
  ok('and small again', await W.locator('.wmaps').getAttribute('data-size') === 'small');
  await page.context().close(); }
{ const page = await open('look=glass&page=weather&wx=rain'); const W = page.locator('fh-weather');
  const area = (sel) => W.locator(sel).evaluate((e) => { const b = e.getBoundingClientRect(); return Math.round(b.width * b.height); });
  ok('while rain is about the radar is the large piece in the middle, with no button to shrink it', await W.locator('.wmaps').getAttribute('data-size') === 'large' && !(await W.evaluate((w) => w.hasAttribute('data-dry'))) && await W.locator('[data-act="mapsize"]').count() === 0 && await area('.wmaps') > await area('.whours'));
  ok('rain about is worked out from now, the warnings and the next six hours', await W.evaluate((w) => { const keep = w._hours, st = w.hass.states; const dryNow = { ...st, [w.entity]: { ...st[w.entity], state: 'cloudy' }, [w._warnId]: { ...st[w._warnId], attributes: { warnings: [] } } }; const h = (n, p) => [{ datetime: new Date(Date.now() + 3600000).toISOString(), precipitation_probability: 0, condition: 'cloudy' }, { datetime: new Date(Date.now() + n * 3600000).toISOString(), precipitation_probability: p, condition: 'cloudy' }];
    const was = w.hass; w.hass = { ...was, states: dryNow }; w._hours = h(2, 70); const soon = w._rainAbout(); w._hours = h(9, 90); const later = w._rainAbout(); w._hours = h(2, 20); const slight = w._rainAbout(); w._hours = keep; w.hass = was; return soon === true && later === false && slight === false; }));
  await page.context().close(); }

// 3. Home: a child's bedroom
{ const page = await open('look=glass&page=home'); const H = page.locator('fh-home');
  const guards = await H.locator('.room').evaluateAll((r) => Object.fromEntries(r.map((x) => [x.getAttribute('data-room'), x.querySelector('[data-rguard]')?.getAttribute('data-rguard') ?? 'free'])));
  ok('by day each child’s bedroom says “Hold to switch”; the shared rooms do not', guards.riley === 'hold' && guards.charlie === 'hold' && guards.max === 'hold' && guards.kitchen === 'free' && guards.lounge === 'free', guards);
  ok('a room named after one of two children who share it (the Music map says so) is the other’s room too', await H.evaluate((h) => { const o = h._owners({ id: 'charlie', name: 'Charlie’s room', ents: [] }); return o.includes('Charlie') && o.includes('Max') && o.length === 2; }));
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

// 6. polish batch 4d: Groceries keeps a short aisle whole and gives a long one "…, more" at the top of each column it carries into;
// with the keys up every usual is still above the tray; Weather keeps "Bigger map" per screen and humidity behind More; Home's
// hold chip only on a room with something to switch (133)
{ const page = await open('look=glass&page=groceries&long=1'); const G = page.locator('fh-groceries');
  const cols = () => G.evaluate((g) => [...g.shadowRoot.querySelectorAll('.grp')].map((x) => ({ g: x.dataset.g, whole: x.hasAttribute('data-whole'), cols: new Set([...x.querySelectorAll('.row[data-key]')].map((r) => r.offsetLeft)).size, cont: [...x.querySelectorAll('.cont')].map((c) => ({ top: !c.previousElementSibling || c.previousElementSibling.offsetLeft !== c.offsetLeft, withNext: c.nextElementSibling?.offsetLeft === c.offsetLeft })) })));
  const a = await cols();
  ok('a short aisle stays whole in one column', a.filter((x) => x.whole).length >= 4 && a.filter((x) => x.whole).every((x) => x.cols === 1 && !x.cont.length), a);
  for (const n of ['Pears', 'Grapes', 'Lettuce', 'Onions', 'Potatoes', 'Lemons', 'Avocado', 'Spinach', 'Cucumber', 'Kiwi fruit']) await page.evaluate((item) => document.querySelector('family-hub-card').hass.callService('todo', 'add_item', { item }, { entity_id: 'todo.shopping_list' }), n);
  await page.waitForTimeout(900);
  const b = await cols(), fv = b.find((x) => x.g === 'Fruit & veg');
  ok('a long aisle carries on under “…, more” at the top of each column it reaches, and nowhere else', !!fv && !fv.whole && fv.cols >= 2 && fv.cont.length === fv.cols - 1 && fv.cont.every((c) => c.top && c.withNext) && b.filter((x) => x !== fv).every((x) => !x.cont.length), fv);
  ok('the “…, more” heading is for the eye only (a screen reader reads the list as one)', await G.locator('.cont').evaluateAll((c) => c.length > 0 && c.every((x) => x.getAttribute('aria-hidden') === 'true' && !x.hasAttribute('role'))) && /Fruit & veg, more/i.test(await G.locator('.cont').first().innerText()));
  await G.locator('.entry .field').dispatchEvent('pointerdown'); await page.waitForTimeout(600); await G.evaluate((g) => g.shadowRoot.getAnimations().forEach((x) => x.finish()));
  const u = await G.evaluate((g) => { const t = g.shadowRoot.querySelector('.tray').getBoundingClientRect().top; return [...g.shadowRoot.querySelectorAll('.usuals .quick')].map((c) => Math.round(t - c.getBoundingClientRect().bottom)); });
  ok('with the keys up every usual is above the tray, in reach', u.length >= 6 && u.every((d) => d >= 0), u);
  await page.context().close(); }
{ const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage(); await page.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') });
  const go = async (qs) => { await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page.locator('fh-weather'); };
  let W = await go('look=glass&page=weather');
  await W.locator('[data-act="mapsize"]').click(); await page.waitForTimeout(300);
  W = await go('look=glass&page=weather');
  ok('“Bigger map” is kept on this screen: the next visit opens with the large map', await W.locator('.wmaps').getAttribute('data-size') === 'large' && (await W.locator('[data-act="mapsize"]').innerText()).trim() === 'Smaller map');
  await W.locator('[data-act="mapsize"]').click(); await page.waitForTimeout(300);
  W = await go('look=glass&page=weather');
  ok('and “Smaller map” is kept too', await W.locator('.wmaps').getAttribute('data-size') === 'small');
  for (const look of ['glass', 'obsidian', 'sports', 'fridge', 'orbit']) {
    W = await go(`look=${look}&page=weather`); const now = W.locator('.wnow');
    await now.locator('[data-act="wmore"]').click(); await page.waitForTimeout(300);
    const r = await now.evaluate((n) => { const shown = (e) => e.offsetParent !== null; const smalls = [...n.querySelectorAll('.wfact')].filter(shown).map((f) => f.querySelector('small')?.textContent ?? ''); const b = n.querySelector('[data-act="wmore"]').getBoundingClientRect(), nb = n.getBoundingClientRect(); return { smalls, inside: b.bottom <= nb.bottom && b.top >= nb.top, head: !!n.querySelector('.nhead [data-act="wmore"]'), over: n.scrollHeight - n.clientHeight }; });
    ok(`${look}: with More open, humidity, fire danger and sunrise all show, and Less sits beside the heading inside the card`, ['Humidity', 'Fire danger', 'Sunrise to sunset'].every((k) => r.smalls.includes(k)) && r.inside && r.head && r.over <= 1, r); }
  W = await go('look=glass&page=weather&wx=rain');
  ok('while rain is about the map is large whatever was chosen', await W.locator('.wmaps').getAttribute('data-size') === 'large' && await W.locator('[data-act="mapsize"]').count() === 0);
  await ctx.close(); }
{ const page = await open('look=glass&page=home'); const H = page.locator('fh-home');
  ok('a child’s room with something a tap switches has its chip', await H.locator('.room[data-room="riley"] [data-rguard="hold"]').count() === 1);
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'), st = { ...c.hass.states }; for (const id of Object.keys(st)) if (c.hass.entities?.[id]?.area_id === 'riley' || /riley/.test(id)) if (/^(light|switch|fan|input_boolean|climate)\./.test(id)) st[id] = { ...st[id], state: 'unavailable' }; c.hass = { ...c.hass, states: st }; });
  await page.waitForTimeout(400);
  ok('one with nothing a tap switches (only speakers, or nothing answering) has none', await H.locator('.room[data-room="riley"]').count() === 1 && await H.locator('.room[data-room="riley"] .rguard').count() === 0 && await H.locator('.room[data-room="charlie"] .rguard').count() === 1);
  await page.context().close(); }

await browser.close(); srv.close();
console.log(`\n${pass} passed, ${fails.length} failed${errs.length ? `, ${errs.length} page errors` : ''}`);
for (const f of fails) console.log('FAILED: ' + f);
for (const e of [...new Set(errs)].slice(0, 10)) console.log('ERROR: ' + e);
process.exit(fails.length || errs.length ? 1 : 0);
