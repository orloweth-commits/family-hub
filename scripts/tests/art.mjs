// Click tests for the screensaver (art mode), presence wake, the painted characters and their studio, and the Pictures pane in Settings.
// Everything runs against the preview's pretend Home Assistant: a pretend media folder, a pretend painter and a pretend record.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4797] node scripts/tests/art.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4797);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, { time = '16:20', w = 1280, h = 800 } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(500); return page; };
const card = (page, f) => page.evaluate(`(${f})(document.querySelector('family-hub-card'))`);
const artUp = (page) => page.locator('family-hub-card .artm:not([data-closing])').count();
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re);
const ahead = async (page, t) => { await page.clock.fastForward(t); await page.waitForTimeout(1300); };

// 1. it comes up after the idle time, and only then
let page = await open('idle=3&artn=4');
ok('no artwork while the panel is in use', await artUp(page) === 0);
await ahead(page, '02:30'); ok('none at two and a half minutes', await artUp(page) === 0);
await ahead(page, '00:45'); ok('the artwork is up after three minutes', await artUp(page) === 1);
await page.waitForTimeout(600);
ok('it shows a picture from the record', await page.locator('family-hub-card .artm img.aimg').count() >= 1);
ok('it shows the time', /\d{1,2}:\d{2}/.test(await page.locator('family-hub-card .artm .atime').innerText()), await page.locator('family-hub-card .artm .atime').innerText());
{ const lines = await page.locator('family-hub-card .artm .ainfo').allInnerTexts(); ok('a line or two of news, never more', lines.length >= 1 && lines.length <= 2, lines); }
ok('the page behind is out of reach', await card(page, (c) => c.shadowRoot.querySelector('.fh > .body').inert));
{ const a = await page.locator('family-hub-card .artm').evaluate((e) => getComputedStyle(e).animationDuration); ok('it fades in slowly (2.5 s)', a.startsWith('2.5s'), a); }

// 2. the touch that wakes it presses nothing underneath
{ const g = await card(page, (c) => { const b = [...c.shadowRoot.querySelectorAll('nav.dock .item')].find((x) => /Groceries/.test(x.textContent)); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await page.mouse.click(g[0], g[1]); await page.waitForTimeout(120);
  ok('a touch wakes the panel at once', await artUp(page) === 0);
  ok('the leaving layer fades fast (about 250 ms)', await page.locator('family-hub-card .artm[data-closing]').count() === 1 ? (await page.locator('family-hub-card .artm[data-closing]').evaluate((e) => parseFloat(getComputedStyle(e).animationDuration))) <= 0.3 : true);
  await page.waitForTimeout(600);
  ok('the button under the finger was not pressed', await card(page, (c) => c._page) === 'planner', await card(page, (c) => c._page));
  ok('the layer has gone', await page.locator('family-hub-card .artm').count() === 0);
  await page.mouse.click(g[0], g[1]); await page.waitForTimeout(300);
  ok('the next touch works as usual', await card(page, (c) => c._page) === 'groceries'); }
// a slow press (finger held down past the fade) is swallowed too
await card(page, (c) => { c._page = 'planner'; }); await ahead(page, '03:10'); ok('up again after another three minutes', await artUp(page) === 1);
{ const g = await card(page, (c) => { const b = [...c.shadowRoot.querySelectorAll('nav.dock .item')].find((x) => /Groceries/.test(x.textContent)); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await page.mouse.move(g[0], g[1]); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); await page.waitForTimeout(300);
  ok('a slow press wakes it and presses nothing', await artUp(page) === 0 && await card(page, (c) => c._page) === 'planner', await card(page, (c) => c._page)); }
// the keyboard wakes it as well
await ahead(page, '03:10'); await page.locator('family-hub-card .artm').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
ok('a key wakes it', await artUp(page) === 0);
await page.close();

// 3. it never covers something that is going on
page = await open('idle=1&artn=2&timer=1');
await card(page, (c) => { c.hass = { ...c.hass, states: { ...c.hass.states, 'timer.kitchen': { entity_id: 'timer.kitchen', state: 'active', attributes: { finishes_at: new Date(Date.now() + 9 * 60000).toISOString() } } } }; });
await ahead(page, '01:30'); ok('not over a running kitchen timer', await artUp(page) === 0);
await page.close();
page = await open('idle=1&artn=2&sheet=timer'); await ahead(page, '01:30'); ok('not over an open sheet', await artUp(page) === 0); await page.close();
page = await open('idle=1&artn=2'); await ahead(page, '01:10'); ok('up when nothing is going on', await artUp(page) === 1);
await card(page, (c) => { c._sheet = 'sitter'; }); await page.waitForTimeout(1300); ok('it gives way when something opens', await artUp(page) === 0); await page.close();

// 4. pictures change, and a hidden picture is never shown
page = await open('idle=1&artn=4&every=1');
await ahead(page, '01:10'); await page.waitForTimeout(500);
const first = await page.locator('family-hub-card .artm img.aimg').last().getAttribute('src');
await ahead(page, '01:05'); await page.waitForTimeout(700);
const second = await page.locator('family-hub-card .artm img.aimg').last().getAttribute('src');
ok('the picture changes after its minute', !!first && !!second && first !== second);
ok('the old picture cross-fades under the new one', await page.locator('family-hub-card .artm img.aimg').count() === 2);
await page.close();

// 4b. new pictures from the painter's folder are brought into local media, each under its own name
page = await open('idle=1&artn=0');
await page.evaluate(() => { for (const n of [1, 2, 3]) { const f = `2026-11-10_02010${n}_family_hub_art_2026_11_10_${n}.png`; window.__media[f] = window.__media['sheet-x'] ?? Object.values(window.__media)[0] ?? ''; } });
await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); const any = document.createElement('canvas'); any.width = 300; any.height = 200; any.getContext('2d').fillRect(0, 0, 300, 200); const url = any.toDataURL('image/png');
  for (const n of [1, 2, 3]) { const f = `2026-11-10_02010${n}_family_hub_art_2026_11_10_${n}.png`; window.__media[f] = url; await c.hass.callService('todo', 'add_item', { item: 'media-source://ai_task/image/' + f, description: JSON.stringify({ d: '2026-11-10', kind: 'art', who: ['Riley'], theme: 'T' + n }) }, { entity_id: 'todo.family_hub_art' }); } });
await ahead(page, '01:10'); await page.waitForTimeout(1500);
{ const names = (await page.evaluate(() => Object.keys(window.__media))).filter((n) => /^fhart-20261110-/.test(n));
  ok('three new pictures become three files of their own', names.length === 3 && new Set(names).size === 3, names); }
await page.close();

// 5. no artwork yet: the clock on the panel's own wallpaper
page = await open('idle=1&artn=0'); await ahead(page, '01:10');
ok('with no pictures it still comes up, bare', await page.locator('family-hub-card .artm[data-bare]').count() === 1 && await page.locator('family-hub-card .artm img.aimg').count() === 0);
await page.close();

// 6. after the earliest bedtime: a dim clock, no artwork, no news
page = await open('idle=1&artn=3', { time: '19:45' }); await ahead(page, '01:10');
ok('after the youngest’s bedtime it is the night clock', await page.locator('family-hub-card .artm[data-night]').count() === 1);
ok('no artwork at night', await page.locator('family-hub-card .artm img.aimg').count() === 0);
ok('no news at night', await page.locator('family-hub-card .artm .ainfo').count() === 0);
await page.close();
page = await open('idle=1&artn=3', { time: '19:10' }); await ahead(page, '01:10');
ok('before bedtime it is still the artwork', await page.locator('family-hub-card .artm:not([data-night])').count() === 1); await page.close();

// 7. presence: a sensor keeps the hub up, and wakes it
page = await open('idle=1&artn=2&presence=sensor');
const setSensor = (v) => card(page, `(c) => { c.hass = { ...c.hass, states: { ...c.hass.states, 'binary_sensor.kitchen_presence': { entity_id: 'binary_sensor.kitchen_presence', state: '${v}', attributes: {} } } }; }`);
await setSensor('on'); await ahead(page, '01:30'); ok('someone standing there: no artwork', await artUp(page) === 0);
await setSensor('off'); await ahead(page, '01:10'); ok('they leave: the artwork comes up after the idle time', await artUp(page) === 1);
await setSensor('on'); await page.waitForTimeout(1400); ok('someone walks up: the hub is back', await artUp(page) === 0);
await page.close();
// the camera: it starts on a secure page, and movement keeps the hub up (Chrome's pretend camera always moves)
page = await open('idle=1&artn=2&presence=camera'); await page.waitForTimeout(2500);
ok('the camera starts without a fault', await card(page, (c) => c._art.camFault) === '' && await card(page, (c) => !!c._art._cam?.running), await card(page, (c) => c._art.camFault));
await page.close();

// 8. the backlight entity: lower with the artwork, full on waking; nothing at all without the entity
page = await open('idle=1&artn=2&backlight=1'); await ahead(page, '01:10');
ok('the backlight goes down with the artwork', (await calls(page, 'light.turn_on light.panel_backlight .*"brightness_pct":70')).length === 1, await calls(page, 'panel_backlight'));
await page.mouse.click(640, 300); await page.waitForTimeout(1400);
ok('and back to full on waking', (await calls(page, 'light.turn_on light.panel_backlight .*"brightness_pct":100')).length === 1);
await page.close();
page = await open('idle=1&artn=2'); await ahead(page, '01:10'); ok('no backlight entity: no calls', (await calls(page, 'brightness_pct')).length === 0); await page.close();

// 9. painted characters: the picture stands in for the drawing everywhere
page = await open('painted=1');
ok('the dock shows the pictures', await page.locator('family-hub-card nav.dock fh-pic').count() === 3);
ok('no drawn avatar is left on the dock', await page.locator('family-hub-card nav.dock .avatar svg').count() === 0);
await page.close();
page = await open('look=glass'); ok('a family without pictures keeps the drawn avatars', await page.locator('family-hub-card nav.dock .avatar svg').count() === 3 && await page.locator('family-hub-card nav.dock fh-pic').count() === 0); await page.close();

// 10. the studio paints looks: once each, three new ones a day, and a look made before is free
page = await open('painted=1&page=kid&kid=0&studio=1&paint=300');
const studio = page.locator('fh-studio'), paintBtn = studio.locator('[data-act="paint"]');
ok('the studio opens on what he is wearing', (await paintBtn.innerText()).trim() === 'Done', await paintBtn.innerText());
// since 0.31.0 a group shows what he has and the next three locked things; the rest are counted on the "more to discover" tile
{ const shown = await studio.locator('.tile').count(), more = Number(/^(\d+) more/.exec((await studio.locator('.cell.more').getAttribute('aria-label').catch(() => '')) ?? '')?.[1] ?? 0);
  ok('the wardrobe is bigger than the drawn catalogue', shown + more > 20 && await studio.locator('.tile.locked').count() <= 3, `${shown} shown, ${more} more`); }
const pick = async (tab, item) => { await studio.locator('[role=tab]', { hasText: tab }).click(); await page.waitForTimeout(150); await studio.locator('.tile', { hasText: item }).first().click(); await page.waitForTimeout(150); };
const make = async () => { await paintBtn.click(); await page.waitForTimeout(200); await page.clock.runFor(1500); await page.waitForTimeout(900); };
await pick('Hats', 'Party hat');
ok('a new combination offers to be painted', /Paint it/.test(await paintBtn.innerText()), await paintBtn.innerText());
ok('and says how many are left today', /3 paints left today/.test(await studio.locator('.pnote').innerText()), await studio.locator('.pnote').innerText());
await paintBtn.click(); await page.waitForTimeout(150);
ok('while it paints he is told so', await studio.locator('.wet').count() === 1 && await paintBtn.isDisabled());
await page.clock.runFor(1500); await page.waitForTimeout(900);
{ const c = await calls(page, 'ai_task.generate_image');
  ok('the painter was asked once, with his sheet', c.length === 1 && /sheet-riley\.png/.test(c[0]), c.length);
  ok('the words name what he picked', /party hat/.test(c[0]) && /About him: A tall twelve-year-old\./.test(c[0]));
  ok('nothing a child typed reaches the painter (there is nowhere to type)', await studio.locator('input').count() === 0); }
ok('the picture is kept in Home Assistant’s media', (await page.evaluate(() => Object.keys(window.__media))).some((n) => /^fhlook-riley-[a-z0-9]+\.jpg$/.test(n)));
ok('it is noted in the record', (await calls(page, 'todo.add_item todo.family_hub_art .*fhlook-riley-.*kind.*look')).length === 1);
ok('and he is wearing it', /img=fhlook-riley-[a-z0-9]+\.jpg/.test(await card(page, (c) => c.hass.states['input_text.riley_avatar'].state)));
ok('the button says Done again', (await paintBtn.innerText()).trim() === 'Done', await paintBtn.innerText());
// back to a look made before: no painting
await pick('Hats', 'No hat'); await pick('Hats', 'Party hat');
ok('going back to a look he is wearing needs nothing', (await paintBtn.innerText()).trim() === 'Done');
await pick('Buddies', 'Puppy'); await make();
await pick('Buddies', 'Kitten'); await make();
await pick('Hats', 'No hat'); await pick('Buddies', 'No buddy');
ok('his plain look is the picture he started with: free', /Wear this look/.test(await paintBtn.innerText()), await paintBtn.innerText());
ok('three looks painted so far', (await calls(page, 'ai_task.generate_image')).length === 3, (await calls(page, 'ai_task.generate_image')).length);
await pick('Hats', 'Party hat');
ok('a look made before is offered at once', /Wear this look/.test(await paintBtn.innerText()), await paintBtn.innerText());
await paintBtn.click(); await page.waitForTimeout(500);
ok('wearing it again asks the painter for nothing', (await calls(page, 'ai_task.generate_image')).length === 3);
await pick('Hats', 'Cap');
ok('a fourth new look today is not offered', await paintBtn.isDisabled() && /all the new looks for today/.test(await studio.locator('.pnote').innerText()), await studio.locator('.pnote').innerText());
await page.close();
// the painter fails: he is told, nothing is saved
page = await open('painted=1&page=kid&kid=1&studio=1&paint=200'); await page.evaluate(() => { window.__paintFail = true; });
await page.locator('fh-studio .tile', { hasText: 'Party hat' }).first().click(); await page.locator('fh-studio [data-act="paint"]').click(); await page.waitForTimeout(150); await page.clock.runFor(1000); await page.waitForTimeout(700);
ok('a painter that fails says so', /couldn’t finish/.test(await page.locator('fh-studio .toast').innerText().catch(() => '')));
ok('and nothing is saved', (await calls(page, 'input_text.set_value input_text.charlie_avatar')).length === 0);
await page.close();
// no painter set up: the studio says so and paints nothing
page = await open('painted=1&nopainter=1&page=kid&kid=0&studio=1');
await page.locator('fh-studio .tile', { hasText: 'Party hat' }).first().click(); await page.waitForTimeout(300);
ok('with no painter the child is told to ask a grown-up', /Ask a grown-up/.test(await page.locator('fh-studio .pnote').innerText()) && await page.locator('fh-studio [data-act="paint"]').isDisabled());
await page.close();
// a child with a drawn avatar keeps the drawn studio
page = await open('page=kid&kid=0&studio=1');
ok('a drawn avatar keeps the drawn studio', await page.locator('fh-studio .easel').count() === 0 && await page.locator('fh-studio .avwrap svg').count() > 5);
await page.close();

// 11. Settings, Pictures
page = await open('painted=1&sheet=settings&pane=pictures&artn=5');
const S = page.locator('fh-settings');
ok('the Pictures pane is there', await S.locator('.spane[data-pane="pictures"]').count() === 1);
await S.locator('[aria-label="Show the artwork after"] button', { hasText: /^5 min$/ }).click(); await page.waitForTimeout(150);
await S.locator('[aria-label="Presence source"] button', { hasText: 'A sensor' }).click(); await page.waitForTimeout(150);
await S.locator('.sft [data-act="save"]').click(); await page.waitForTimeout(500);
ok('a sensor source with no sensor chosen is not saved', /Choose the sensor/.test(await S.locator('.sft .sstate').innerText()), await S.locator('.sft .sstate').innerText());
await S.locator('.spick button[data-e="binary_sensor.kitchen_presence"]').click(); await page.waitForTimeout(150);
await S.locator('.sft [data-act="save"]').click(); await page.waitForTimeout(700);
{ const a = await page.evaluate(() => window.__dash.views[0].sections[0].cards[1].cards[0].art);
  ok('saved: idle time, source and sensor', a.idle_minutes === 5 && a.presence === 'sensor' && a.presence_entity === 'binary_sensor.kitchen_presence', a); }
ok('every picture is listed', await S.locator('.sart').count() === 5);
await S.locator('.sart').first().locator('[aria-label="Hide it from the screensaver"]').click(); await page.waitForTimeout(500);
ok('hiding one ticks it off in the record', (await calls(page, 'todo.update_item todo.family_hub_art')).length >= 1 && await S.locator('.sart[data-hidden]').count() === 1);
await S.locator('.sart').nth(1).locator('.sico.bad').click(); await page.waitForTimeout(200);
ok('deleting asks twice', await S.locator('.sart').count() === 5 && /Sure/.test(await S.locator('.sart').nth(1).locator('.sico.bad').innerText()));
await S.locator('.sart').nth(1).locator('.sico.bad').click(); await page.waitForTimeout(600);
ok('then removes the line and the file', await S.locator('.sart').count() === 4 && (await calls(page, 'ws.media remove')).length === 1);
// the nightly automation is written from the saved configuration
await S.locator('[data-act="night-setup"]').click(); await page.waitForTimeout(2200);
{ const b = await page.evaluate(() => window.__apiBody);
  ok('the nightly automation is posted to Home Assistant', !!b && b.triggers?.length === 2 && b.actions?.length > 8, b && Object.keys(b));
  const txt = JSON.stringify(b);
  ok('it paints from the saved character sheets', /sheet-riley\.png/.test(txt) && /sheet-max\.png/.test(txt));
  ok('it asks for three scenes as fields', ['scene1', 'who2', 'theme3', 'event3'].every((k) => txt.includes(k)));
  ok('it stops at the month’s limit and when tonight’s are done', /limit has been reached/.test(txt) && /already painted/.test(txt));
  ok('a new one is left switched off', (await calls(page, 'automation.turn_off')).length === 1); }
await page.close();
// the camera pane explains an insecure page (the test page is secure, so the fault is forced)
page = await open('sheet=settings&pane=pictures&presence=camera');
await page.locator('fh-settings').evaluate((el) => { el._camFault = 'insecure'; el.requestUpdate(); }); await page.waitForTimeout(200);
ok('a page that is not secure gets both fixes spelled out', /https/.test(await page.locator('fh-settings .snote').first().innerText()) && /OverrideSecurityRestrictionsOnInsecureOrigin/.test(await page.locator('fh-settings .snote').first().innerText()));
await page.locator('fh-settings').evaluate((el) => { el._camFault = ''; el.requestUpdate(); });
await page.locator('fh-settings [data-act="cam-test"]').click(); await page.waitForTimeout(1800);
ok('the camera test shows its picture and a meter', await page.locator('fh-settings .scam video').count() === 1 && /%/.test(await page.locator('fh-settings .smeter').innerText()), await page.locator('fh-settings .smeter').innerText().catch(() => ''));
await page.locator('fh-settings [data-act="cam-test"]').click(); await page.waitForTimeout(200);
ok('and stops the camera when asked', await page.locator('fh-settings .scam').count() === 0);
await page.close();

// 12. sizes: the clock is inside the screen on the wall panel, an iPad and a phone
for (const [name, w, h] of [['wall panel', 1920, 1080], ['iPad', 1180, 820], ['iPad upright', 820, 1180], ['phone', 390, 844]]) {
  page = await open('art=1&artn=3', { w, h }); await page.waitForTimeout(700);
  const r = await page.locator('family-hub-card .artm .aplate').boundingBox();
  ok(`${name}: the clock is whole and on the screen`, !!r && r.x >= 0 && r.y >= 0 && r.x + r.width <= w + 1 && r.y + r.height <= h + 1, r && [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]);
  const fs2 = await page.locator('family-hub-card .artm .atime .big').evaluate((e) => e.getBoundingClientRect().height);
  ok(`${name}: the time is large`, fs2 >= (w < 600 ? 60 : 110), Math.round(fs2));
  await page.close();
}

console.log(`\n${pass} passed, ${fails.length} failed${fails.length ? ':\n - ' + fails.join('\n - ') : ''}`);
if (errs.length) console.log('page errors:\n - ' + [...new Set(errs)].join('\n - '));
await browser.close(); srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
