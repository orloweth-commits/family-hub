// click-base, pages part (split from click-base.mjs by page, 23 Nov 2026: plan section 3, backlog 52 and 34): the other shared pages: Groceries and the shared keys, Weather, Home, Doodle, the morning board, Music's Whole house.
// Each section runs in its own block: one that stops (a missing element) prints a FAIL line naming it and the next section carries on (backlog 34).
import { browser, ctx, srv, errs, PORT, PREV, ROOT, HOME, MORE, open, openAt, shot, ok, calls, toastOf, sr, srStudio, ratio, section, finish } from './lib/click.mjs';
let page;

await section('5. shared keyboard: groceries and add-event type the same way', async () => {
// 5. shared keyboard: groceries and add-event type the same way
page = await open('look=orbit&page=groceries');
await page.locator('fh-groceries .entry .field').dispatchEvent('pointerdown'); await page.waitForTimeout(250); // (0.37.0: the keys come up when the box is touched)
for (const k of ['R', 'i', 'c', 'e']) await page.locator('fh-groceries .key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
console.log('groceries typed:', await page.locator('fh-groceries input').inputValue());
await page.getByRole('button', { name: 'Delete' }).click(); console.log('after delete:', await page.locator('fh-groceries input').inputValue());
await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(300); console.log('added Ric:', await page.locator('fh-groceries .item', { hasText: 'Ric' }).count());
await page.close();
page = await open('look=fridge&sheet=add');
for (const k of ['s', 'w', 'i', 'm']) await page.locator('fh-add-event .key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
console.log('add-event typed:', await page.locator('fh-add-event input').first().inputValue()); await shot(page, 'c-add-fridge');
await page.close();
});
await section('9. weather: the header chip opens the page; now, hours, week and the t', async () => {
// 9. weather: the header chip opens the page; now, hours, week and the two maps; without the Bureau's sensors it still stands
page = await open('look=glass&wx=rain');
await HOME(page); await page.getByRole('button', { name: 'Weather', exact: true }).first().click(); await page.waitForTimeout(600);
const wx = (sel) => page.locator('fh-weather ' + sel);
console.log('weather now:', (await wx('.wtemp').innerText()).replace(/\s+/g, ''), '|', await wx('.cond').innerText(), '| warn:', await wx('.wwarn').innerText(), '| tip:', await wx('.wtip').innerText());
console.log('weather facts:', await wx('.wfact').count(), '| hours:', await wx('.hchart .tv').count(), '| days:', await wx('.wday').count(), '| today first:', await wx('.wday').first().getAttribute('aria-label'));
console.log('radar frames:', await page.locator('fh-radar .ticks i').count(), '| zoom buttons:', await page.locator('fh-radar .zoom button').count());
await page.getByRole('button', { name: 'Pause the radar' }).click(); console.log('radar paused:', await page.getByRole('button', { name: 'Play the radar' }).count());
await page.getByRole('button', { name: 'Wind', exact: true }).click(); await page.waitForTimeout(200);
console.log('wind map:', await wx('iframe').evaluate((f) => { const u = new URL(f.src); return u.host + ' lat=' + u.searchParams.get('lat') + ' lon=' + u.searchParams.get('lon'); }));
console.log('weather clipped:', await wx('section').evaluateAll((els) => els.filter((e) => !e.classList.contains('wnow') && e.scrollHeight > e.clientHeight + 1).map((e) => e.className).join(',') || 'none'));
await page.close();
page = await open('look=orbit&page=weather&bom=0');
console.log('weather without sensors:', (await page.locator('fh-weather .wtemp').innerText()).replace(/\s+/g, ''), '| facts:', await page.locator('fh-weather .wfact').count(), '| days:', await page.locator('fh-weather .wday').count());
await page.close();
});
await section('groceries on a phone: the Add button stays on the screen and the page ', async () => {
// groceries on a phone: the Add button stays on the screen and the page does not widen (finding 4)
{ const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'Australia/Perth', locale: 'en-AU' });
  for (const look of ['glass', 'fridge', 'orbit']) { const p = await ph.newPage(); await p.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await p.goto(`http://localhost:${PORT}/?look=${look}&page=groceries`); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(700);
    const add = await p.getByRole('button', { name: 'Add', exact: true }).boundingBox(), dock = await p.locator('family-hub-card nav.dock').boundingBox();
    console.log(`phone groceries ${look}: Add right edge ${Math.round(add.x + add.width)} (≤ 390), page width ${await p.evaluate(() => document.documentElement.scrollWidth)} (≤ 392), dock ${Math.round(dock.x)}..${Math.round(dock.x + dock.width)}`); await p.close(); }
  await ph.close(); }
// groceries: clear with Undo, empty add, tick stays 4 s, failed load, failed add (finding 5)
page = await open('look=glass&page=groceries');
const gDone = () => page.locator('fh-groceries button.item.done').count();
const clear = page.getByRole('button', { name: /Clear ticked/ }); const cb = await clear.boundingBox();
console.log('clear button:', (await clear.innerText()).trim(), Math.round(cb.height) + ' px high', '| usual chip height:', Math.round((await page.getByRole('button', { name: 'Add Bread' }) /* (0.38.27: Milk is on the preview's list, so its usual reads "Milk: on the list already") */.boundingBox()).height));
await clear.click(); await page.waitForTimeout(300);
console.log('after clear: ticked rows', await gDone(), '| toast:', await toastOf(page, 'fh-groceries'), '| removed in Home Assistant yet:', /remove_/.test(await calls(page)));
await page.getByRole('button', { name: 'Undo' }).click(); await page.waitForTimeout(300);
{ const n = await gDone(), rm = /remove_/.test(await calls(page)); console.log('after undo: ticked rows', n, '(expect 2) | removed:', rm, ok(n === 2 && !rm)); }
await page.getByRole('button', { name: /Clear ticked/ }).click(); await page.waitForTimeout(6600);
console.log('clear left alone: ticked rows', await gDone(), '| call:', (await calls(page)).split('\n').filter((c) => /remove_/.test(c)).join(' ; ').slice(0, 120));
await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(200);
console.log('empty add says:', await toastOf(page, 'fh-groceries'));
const gw = async () => Math.round((await page.locator('fh-groceries .list').boundingBox()).width); const w0 = await gw();
await page.getByRole('button', { name: 'Add Cheese' }).click(); await page.getByRole('button', { name: 'Add Coffee' }).click(); await page.getByRole('button', { name: 'Add Bread' }).click(); await page.waitForTimeout(300);
console.log('list width as it grows:', w0, '→', await gw(), w0 === await gw() ? '(same)' : 'CHANGED');
await page.locator('fh-groceries button.item', { hasText: 'Milk' }).click(); await page.waitForTimeout(600);
const before = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries').shadowRoot; const it = [...r.querySelectorAll('.items > *')]; return it.findIndex((e) => /Milk/.test(e.textContent)) < it.findIndex((e) => e.classList.contains('trolley')) || !r.querySelector('.trolley'); });
await page.waitForTimeout(4200);
const after = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries').shadowRoot; const it = [...r.querySelectorAll('.items > *')]; return it.findIndex((e) => /Milk/.test(e.textContent)) > it.findIndex((e) => e.classList.contains('trolley')); });
console.log('ticked row keeps its place at first:', before, '| in the trolley after 4 s:', after);
await page.close();
page = await open('look=glass&page=groceries&listfail=1');
{ const n = await page.locator('fh-groceries button.item').count(), f = await page.locator('fh-groceries .retry').count(); console.log('list not reachable after a good read: the list kept', n > 0 && f === 0 ? 'ok' : 'FAIL', `(rows ${n}, Try again ${f})`); }
await page.close(); page = await open('look=glass&page=groceries&listfail=1', '16:20', () => { for (const k of Object.keys(localStorage)) if (k.startsWith('fh-kept-list:')) localStorage.removeItem(k); });
console.log('list not reachable:', (await page.locator('fh-groceries .list').innerText()).replace(/\s+/g, ' ').slice(0, 80));
await page.evaluate(() => { window.__listOk = true; }); await page.getByRole('button', { name: 'Try again' }).click(); await page.waitForTimeout(400);
console.log('after Try again: rows', await page.locator('fh-groceries button.item').count());
await page.close();
page = await open('look=glass&page=groceries&fail=1');
await page.getByRole('button', { name: 'Add Bread' }).click(); await page.waitForTimeout(800);
console.log('failed add says:', await toastOf(page, 'fh-groceries'));
await page.close();
});
await section('doodle: the hero is one line at 52 px, artists sign with their faces, ', async () => {
// doodle: the hero is one line at 52 px, artists sign with their faces, new stamps (finding 6)
for (const look of ['glass', 'fridge', 'orbit']) { page = await open(`look=${look}&page=doodle`);
  const st = page.getByRole('button', { name: /Stick it up/ }), sb = await st.boundingBox(), pad = await page.locator('fh-doodle .easel').boundingBox();
  const faces = await page.locator('fh-doodle .artist .avatar').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width) + (e.querySelector('svg') ? ' drawn' : ' letter')));
  console.log(`doodle ${look}: hero "${(await st.innerText()).trim()}" ${Math.round(sb.height)} px high, inside the easel ${sb.x >= pad.x && sb.x + sb.width <= pad.x + pad.width + 1 && sb.y + sb.height <= pad.y + pad.height + 1} | faces: ${faces.join(', ')} | stamps: ${await page.getByRole('button', { name: / stamp$/ }).count()}`);
  await page.close(); }
});
await section('home: the garage asks for the PIN, a scene says what happened, toggles', async () => {
// home: the garage asks for the PIN, a scene says what happened, toggles are switches (finding 7)
page = await open('look=glass&page=home');
await page.getByRole('button', { name: /Garage door/ }).click(); await page.waitForTimeout(300);
console.log('garage: PIN pad', await page.locator('fh-home fh-pin').count(), '| called before PIN:', /cover\./.test(await calls(page)));
for (const d of '1234') await page.locator('fh-home fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500);
console.log('garage after PIN:', (await calls(page)).split('\n').filter((c) => /cover\./.test(c)).join(' ; ').slice(0, 60), '| toast:', await toastOf(page, 'family-hub-card'));
await page.getByRole('button', { name: 'Bedtime' }).click(); await page.waitForTimeout(400);
console.log('scene toast:', await toastOf(page, 'family-hub-card'));
const swb = await page.getByRole('switch', { name: 'Kitchen lights' }).boundingBox(), trk = await page.locator('fh-home .room .toggle').first().boundingBox();
console.log('room switch:', (await page.getByRole('switch', { name: 'Kitchen lights' }).innerText()).trim(), Math.round(swb.height) + ' px hit area, track', Math.round(trk.width) + 'x' + Math.round(trk.height), '| switches:', await page.getByRole('switch').count(), '| All on/off on the page:', await page.locator('fh-home').getByRole('button', { name: /^All o/ }).count());
await page.close();
page = await open('look=glass&page=home&slow=1500');
await page.getByRole('switch', { name: 'Bench' }).click(); await page.waitForTimeout(600);
console.log('slow call marks the tile busy:', await page.locator('fh-home .dev[data-busy]').count());
await page.evaluate(() => { const c = document.querySelector('family-hub-card'), h = c.hass; c.hass = { ...h, states: { ...h.states, 'light.patio': { ...h.states['light.patio'], state: 'unavailable' } } }; }); await page.waitForTimeout(1500);
console.log('dropped-off device:', (await page.locator('fh-home .dev.gone').innerText()).replace(/\s+/g, ' '));
await page.evaluate(() => { const c = document.querySelector('family-hub-card'), h = c.hass; c.hass = { ...h, areas: {} }; }); await page.waitForTimeout(400);
console.log('no areas:', (await page.locator('fh-home .none').innerText()).replace(/\s+/g, ' ').slice(0, 60));
await page.close();
});
await section('weather: without Bureau data the UV line makes sense; picture tips wit', async () => {
// weather: without Bureau data the UV line makes sense; picture tips with a speaker; whole hour columns; a lost entity is not a set-up message (findings 1 to 3)
page = await open('look=glass&page=weather&bom=0');
const wx = async () => (await page.locator('fh-weather section').allInnerTexts()).join(' ').replace(/\s+/g, ' ');
console.log('no Bureau data:', /Cover up today/.test(await wx()), '| "No sun protection needed" shown:', /No sun protection/.test(await wx()));
console.log('tips:', await page.locator('fh-weather .tipone').evaluateAll((els) => els.map((e) => e.textContent.trim() + ' ' + parseFloat(getComputedStyle(e.querySelector('svg')).width) + 'px').join(', ')), '| speaker:', await page.getByRole('button', { name: 'Read the advice aloud' }).count());
console.log('hour strip:', await page.locator('fh-weather .hscroll').evaluate((e) => { const n = e.querySelectorAll(':scope > svg > circle').length, w = e.querySelector('svg').getBoundingClientRect().width / n, k = e.getBoundingClientRect().width / w; return `${k.toFixed(2)} columns in view, fade ${e.hasAttribute('data-more-r')}`; }));
await page.close(); page = await open('look=glass&page=weather');
await page.locator('fh-weather [data-act="wmore"]').click(); await page.waitForTimeout(250); // (0.37.0: the fire danger is behind More)
console.log('fire danger in full:', await page.locator('fh-weather .wfact b', { hasText: /^Mod/ }).evaluate((e) => e.textContent + ' ' + (e.scrollWidth <= e.clientWidth + 1)));
await page.evaluate(() => { const c = document.querySelector('family-hub-card'), h = c.hass; c.hass = { ...h, states: { ...h.states, 'weather.home': { ...h.states['weather.home'], state: 'unavailable' } } }; }); await page.waitForTimeout(500);
console.log('weather entity lost:', (await wx()).slice(0, 40));
await page.close();
});
await section('morning board: since 0.32.0 each card carries its child’s current job ', async () => {
// morning board: since 0.32.0 each card carries its child's current job (one button, "Now"), with no bar, score or count of jobs on a card; the count is said once, pooled
page = await open('look=glass&page=morning', '07:10');
const mb = (await page.locator('fh-morning section, fh-morning .kcol').allInnerTexts()).join(' ').replace(/\s+/g, ' ');
console.log('morning board: a count of jobs or "Next" in a column:', /\d+ (left|to go|of \d+)|Next\b/.test((await page.locator('fh-morning .kcol').allInnerTexts()).join(' ')), '| pooled line:', (/Morning jobs: \d+ to go between us/.exec(mb) ?? ['MISSING'])[0]);
await page.close();
});
await section('R1. a call that fails does not claim success: the grocery list to a ph', async () => {
// R1. a call that fails does not claim success: the grocery list to a phone, and Call a room
page = await open('look=glass&page=groceries&fail=1');
await page.locator('fh-groceries .who', { hasText: 'Sam' }).click(); await page.waitForTimeout(900);
console.log('R1 send list, call fails: says', JSON.stringify(await toastOf(page, 'fh-groceries')), '| claims sent:', /List sent/.test(await toastOf(page, 'fh-groceries')));
await page.close(); page = await open('look=glass&page=groceries&slow=1200');
await page.locator('fh-groceries .who', { hasText: 'Sam' }).click(); await page.waitForTimeout(500);
console.log('R1 send list, slow: both buttons off while sending', await page.locator('fh-groceries .who:disabled').count(), '| toast yet:', JSON.stringify(await toastOf(page, 'fh-groceries')));
await page.waitForTimeout(1200); console.log('R1 send list, answered:', await toastOf(page, 'fh-groceries'), '| buttons back:', await page.locator('fh-groceries .who:disabled').count() === 0);
await page.close(); page = await open('look=glass&page=music&mtab=call&fail=1');
{ const M = page.locator('fh-music'); await M.getByRole('button', { name: 'Office' }).click(); await M.getByRole('button', { name: 'Dinner’s ready!' }).click(); await M.getByRole('button', { name: /Say it/ }).click(); await page.waitForTimeout(1600);
  const t = await toastOf(page, 'fh-music'); console.log('R1 call a room, call fails: says', JSON.stringify(t), '| claims calling:', /^Calling/.test(t)); }
await page.close(); page = await open('look=glass&page=music&mtab=call&slow=1000');
{ const M = page.locator('fh-music'); await M.getByRole('button', { name: 'Office' }).click(); await M.getByRole('button', { name: 'Dinner’s ready!' }).click(); await M.getByRole('button', { name: /Say it/ }).click(); await page.waitForTimeout(400);
  console.log('R1 call a room, slow: Say it off while calling', await M.locator('.sayit:disabled').count(), '| toast yet:', JSON.stringify(await toastOf(page, 'fh-music')));
  await page.waitForTimeout(2600); console.log('R1 call a room, answered:', await toastOf(page, 'fh-music')); }
await page.close();
});
await section('R5. Home: one PIN does not open the front door; the window shows, coun', async () => {
// R5. Home: one PIN does not open the front door; the window shows, counts down and can be closed
page = await open('look=glass&page=home');
{ const H = page.locator('fh-home'), pad = () => H.locator('fh-pin').count(), type = async () => { for (const d of '1234') await H.locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500); };
  await H.getByRole('button', { name: /Garage door/ }).click(); await page.waitForTimeout(300); await type();
  console.log('R5 after the PIN for the garage: chip', JSON.stringify((await H.locator('.unl').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()));
  await page.evaluate(() => { window.__calls = []; }); await H.getByRole('button', { name: /Front door/ }).click(); await page.waitForTimeout(300);
  console.log('R5 front door inside the window: PIN asked again', await pad(), '| lock called without it:', /lock\./.test(await calls(page)));
  await H.locator('fh-pin').getByRole('button', { name: /Cancel|Close/ }).first().click().catch(() => page.keyboard.press('Escape')); await page.waitForTimeout(300);
  await H.getByRole('button', { name: /Garage door/ }).click(); await page.waitForTimeout(300);
  console.log('R5 the same garage door again inside the window: PIN asked', await pad(), '| cover called:', /cover\./.test(await calls(page)));
  await H.getByRole('button', { name: /Parents/ }).click(); await page.waitForTimeout(300); console.log('R5 automations inside the window: PIN asked', await pad(), '| list open:', await H.getByRole('button', { name: 'Hide' }).count());
  await page.clock.fastForward(20_000); await page.waitForTimeout(1200); const t1 = (await H.locator('.unl b').innerText()).trim();
  await H.locator('.unl').getByRole('button', { name: 'Lock now' }).click(); await page.waitForTimeout(300);
  console.log('R5 countdown after 20 s:', t1, '| Lock now: chip gone', await H.locator('.unl').count() === 0);
  await H.getByRole('button', { name: /Garage door/ }).click(); await page.waitForTimeout(300); console.log('R5 after Lock now the garage asks again:', await pad()); }
await page.close();
});
await section('R11. Music: Whole house shows that it is joined; a volume jump of more', async () => {
// R11. Music: Whole house shows that it is joined; a volume jump of more than 30 in one drag can be taken back
page = await open('look=glass&page=music&mview=dial');
{ const M = page.locator('fh-music'), wh = M.locator('.wholeb');
  console.log('R11 tab words beside the icons at 1280x800 (Dial; while the hint shows they give way to it):', await M.locator('.tabs.inline[data-words] button span').evaluateAll((els) => els.filter((e) => e.offsetWidth > 0).map((e) => e.textContent).join(', ')), '| row overflows:', await M.locator('.mhead').evaluate((h) => h.scrollWidth > h.clientWidth + 1));
  // R4-5: while the hint shows it is never cut (the tab words give way first); the words come back when it goes
  { const cut = await M.locator('.hint[data-on]').evaluateAll((els) => els.some((h) => h.scrollHeight > h.clientHeight + 1)); console.log('R4-5 hint cut while showing (expect false):', cut, ok(!cut)); }
  await page.waitForTimeout(4600);
  console.log('R4-5 tab words once the hint has gone:', await M.locator('.tabs.inline[data-words] button span').evaluateAll((els) => els.filter((e) => e.offsetWidth > 0).map((e) => e.textContent).join(', ')));
  const before = await wh.getAttribute('aria-pressed'); await wh.click(); await page.waitForTimeout(900);
  console.log('R11 Whole house: pressed before', before, '| after joining', await wh.getAttribute('aria-pressed'), '|', (await toastOf(page, 'fh-music')).slice(0, 40));
  const r = await page.evaluate(async () => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music'), id = 'media_player.office', v0 = Math.round(m.hass.states[id].attributes.volume_level * 100);
    m._setVol(id, v0 + 10, false); m._setVol(id, v0 + 45, false); m._setVol(id, v0 + 45, true); await new Promise((r) => setTimeout(r, 500)); const btn = m.shadowRoot.querySelector('.toast button'), label = btn?.textContent.trim(); btn?.click(); await new Promise((r) => setTimeout(r, 500));
    return { v0, label, back: Math.round(m.hass.states[id].attributes.volume_level * 100) }; });
  console.log('R11 volume dragged from', r.v0, 'to', r.v0 + 45, ': toast offers', JSON.stringify(r.label), '| after tapping it:', r.back); }
await page.close();
});
await section('R15. Doodle: Stick it up with no artist asks who drew it; Escape close', async () => {
// R15. Doodle: Stick it up with no artist asks who drew it; Escape closes the question and the viewer
page = await open('look=glass&page=doodle');
{ const D = page.locator('fh-doodle'), pad = await D.locator('canvas').boundingBox();
  await page.mouse.move(pad.x + 80, pad.y + 80); await page.mouse.down(); await page.mouse.move(pad.x + 200, pad.y + 160, { steps: 5 }); await page.mouse.up();
  await D.getByRole('button', { name: /Stick it up/ }).click(); await page.waitForTimeout(300);
  console.log('R15 no artist chosen: asks', JSON.stringify(await D.locator('.whobox h2').innerText().catch(() => '')), '| faces:', await D.locator('.whobox .artist').count(), '| stuck up yet:', await D.locator('.easel.stick').count());
  await page.keyboard.press('Escape'); await page.waitForTimeout(200); console.log('R15 Escape closes the question:', await D.locator('.whobox').count() === 0);
  await D.locator('.snap').first().click(); await page.waitForTimeout(200); const open1 = await D.locator('button.view').count(); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  console.log('R15 viewer open', open1, '| after Escape:', await D.locator('button.view').count()); }
await page.close();
});
await section('R6-G3. the chosen brush size looks chosen in every look, and the choic', async () => {
// R6-G3. the chosen brush size looks chosen in every look, and the choice moves when another size is tapped
{ const bad = [];
  for (const look of ['glass&theme=sea', 'fridge', 'orbit', 'sports']) { const p = await openAt(1280, 800, `look=${look}&page=doodle`);
    const read = () => p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelector('fh-doodle').shadowRoot.querySelectorAll('button.size[aria-label^="Brush"]')].map((b) => { const cs = getComputedStyle(b); return { on: b.getAttribute('aria-pressed') === 'true', bg: cs.backgroundColor, look: cs.backgroundColor + ' ' + cs.boxShadow, dot: getComputedStyle(b.querySelector('i')).backgroundColor }; }));
    const a = await read(); await p.locator('fh-doodle button.size[aria-label="Brush 22"]').click(); await p.waitForTimeout(150); const b = await read();
    const clear = (v) => v.filter((x) => x.on).length === 1 && v.filter((x) => !x.on).every((x) => x.look !== v.find((y) => y.on).look) && v.find((x) => x.on).dot !== v.find((x) => x.on).bg;
    if (!clear(a) || !clear(b) || !b[2].on || a[2].on) bad.push(look.split('&')[0]); await p.context().close(); }
  console.log('R6-G3 the selected brush size is visibly selected', ok(!bad.length), bad.join(' ')); }
});
await section('R7-M3/m9. doodle: the chosen size, stamp and eraser stand out from the', async () => {
// R7-M3/m9. doodle: the chosen size, stamp and eraser stand out from their neighbours (3:1 or more) in every Glass theme and look; the three sizes show the tool they belong to
{ const bad = []; let sizes = '';
  for (const look of ['glass&theme=sea', 'glass&theme=sunset', 'glass&theme=reef', 'glass&theme=bush', 'glass&theme=space', 'fridge', 'orbit', 'sports']) { const p = await openAt(1280, 800, `look=${look}&page=doodle`);
    for (const pick of ['Brush 22', 'Dinosaur stamp', 'Eraser']) { await p.locator(`fh-doodle button.size[aria-label="${pick}"]`).click(); await p.waitForTimeout(450);
      const r = await p.evaluate(`(() => { const ratio = ${ratio}; const R = ${sr('fh-doodle')}; const bs = [...R.querySelectorAll('button.size')]; const bgOf = (e) => { for (let x = e; x; x = x.parentElement) { const v = getComputedStyle(x).backgroundColor, n = v.match(/[\\d.]+/g); if (n && (n.length < 4 || +n[3] > 0.3)) return v; } return 'rgb(255,255,255)'; };
        const on = bs.filter((b) => b.getAttribute('aria-pressed') === 'true'), off = bs.find((b) => b.getAttribute('aria-pressed') !== 'true'); return { lit: on.map((b) => b.getAttribute('aria-label')), least: Math.min(...on.map((b) => ratio(getComputedStyle(b).backgroundColor, bgOf(off)))) }; })()`);
      if (r.least < 3 || !r.lit.includes(pick) || r.lit.length !== (pick === 'Brush 22' ? 1 : 2) || (pick !== 'Brush 22' && !r.lit.some((n) => n.startsWith(pick === 'Eraser' ? 'Eraser size' : 'Stamp size')))) bad.push(`${look} ${pick} ${JSON.stringify(r)}`); }
    if (look === 'fridge') { await p.locator('fh-doodle button.size[aria-label="Dinosaur stamp"]').click(); sizes = await p.evaluate(`[...${sr('fh-doodle')}.querySelectorAll('button.size[aria-label^="Stamp size"] .sz')].map((e) => e.textContent.trim() + getComputedStyle(e).fontSize).join(' ')`); }
    await p.context().close(); }
  console.log('R7-M3 doodle: the chosen tool and size are 3:1 or more against their neighbours', ok(!bad.length), bad.join(' | '), '| R7-m9 with a stamp chosen the sizes show that stamp, small to big:', sizes, ok(/🦖14px 🦖21px 🦖28px/.test(sizes))); }
});
await section('D4. the morning board: ONE clock for the family (a face that empties, ', async () => {
// D4. the morning board: ONE clock for the family (a face that empties, minutes, the time in numerals and words); no bar, countdown or percentage in any column (since 0.32.0 a card says a time only when its child leaves at a different one, as so many minutes later); calm mode never animates it
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const p = await openAt(1280, 800, `look=${look}&page=morning`, '07:10');
  const read = () => p.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-morning').shadowRoot, g = r.querySelectorAll('[data-part="goclock"]'), c = g[0], tx = (e) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const cols = [...r.querySelectorAll('.kcol')], chips = cols.map((k) => k.querySelector('.lchip')).filter(Boolean), face = c?.querySelector('svg.tface')?.getBoundingClientRect();
    return { clocks: g.length, role: c?.getAttribute('role'), label: (c?.getAttribute('aria-label') ?? '').replace(/\s+/g, ' '), text: tx(c), face: face ? Math.round(face.width) : 0, colBars: r.querySelectorAll('.kcol .gobar, .kcol .kgo, .kcol svg.tface, .kcol [role="progressbar"], .kcol .meter').length,
      colText: cols.map((k) => tx(k)).join(' | '), chips: chips.length, chipW: [...new Set(chips.map((e) => Math.round(e.getBoundingClientRect().width)))].length, chipBg: [...new Set(chips.map((e) => getComputedStyle(e).backgroundColor))].length, cut: (() => { const w = c?.querySelector('.words'), b = c?.getBoundingClientRect(), o = r.querySelector('.board')?.getBoundingClientRect(); return !w || !b || !o || w.scrollWidth > w.clientWidth + 1 || b.right > o.right + 0.5 || b.bottom > o.bottom + 0.5 || b.left < o.left - 0.5; })() }; });
  const a = await read();
  console.log(`D4 ${look} one family clock:`, a.clocks, a.role, '|', a.label, '|', a.text, '| face', a.face, 'px', ok(a.clocks === 1 && a.role === 'timer' && /^Time to leave: 20 minutes until Max leaves at 7:30 am$/.test(a.label) && /20 min/.test(a.text) && /Leave at 7:30 am/.test(a.text) && /half past seven/.test(a.text) && a.face >= 88 && !a.cut),
    '| columns: bars', a.colBars, '| a countdown or % in a column:', /\d+ ?min\b|\d+ ?%/.test(a.colText), '| only the two who leave later carry a chip, the same width and colour:', ok(a.colBars === 0 && !/\d+ ?min\b|\d+ ?%/.test(a.colText) && a.chips === 2 && a.chipW === 1 && a.chipBg === 1));
  if (look === 'glass') { await p.clock.runFor(61_000); await p.waitForTimeout(300); const b = await read(); await p.clock.runFor(26 * 60_000); await p.waitForTimeout(300); const c2 = await read();
    console.log('D4 the clock counts down, then moves on to the next time anyone leaves:', b.text, ok(/19 min/.test(b.text)), '|', c2.text, ok(/1[34] min/.test(c2.text) && /Leave at 7:50 am/.test(c2.text) && /ten to eight/.test(c2.text) && /Riley & Charlie leave/.test(c2.text))); }
  await p.context().close(); }
{ const p = await openAt(1280, 800, 'look=glass&page=morning&calm=1', '07:10');
  const r = await p.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-morning'), ring = m.shadowRoot.querySelector('[data-part="goclock"] svg.tface circle[stroke-dasharray]');
    const loops = m.shadowRoot.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length; return { loops, ringT: getComputedStyle(ring).transitionDuration, calm: !!document.querySelector('family-hub-card').shadowRoot.querySelector('.fh[data-calm]') }; });
  console.log('D4 calm mode: looping animations on the board', r.loops, '| the face changes in', r.ringT, '(a plain update, no sweep)', ok(r.calm && r.loops === 0 && parseFloat(r.ringT) === 0)); await p.context().close(); }
});
await section('D10. keep_on: All off leaves those on (and anything in a group named t', async () => {
// D10. keep_on: All off leaves those on (and anything in a group named there, and any group holding one), and says how many it kept
{ const run = async (qs) => { const p = await openAt(1280, 800, 'look=glass&page=home' + qs); await p.evaluate(() => { window.__calls = []; }); await p.locator('family-hub-card fh-home [data-act=alloff]').click(); await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ off: (window.__calls || []).filter((c) => /^light\.turn_off/.test(c)).join(' || '), toast: (document.querySelector('family-hub-card').shadowRoot.querySelector('.toast')?.innerText ?? '').replace(/\s+/g, ' ').trim() })); await p.context().close(); return r; };
  const none = await run(''), one = await run('&keep=1'), grp = await run('&keep=group');
  console.log('D10 no keep_on (as before):', none.toast, ok(/^Lights off/.test(none.toast) && /light\.max/.test(none.off)));
  console.log('D10 keep_on: [light.max]:', one.toast, '|', one.off.slice(0, 120), ok(/^All off \(1 thing kept on\)/.test(one.toast) && /Undo/.test(one.toast) && !/light\.max/.test(one.off) && /light\.kitchen/.test(one.off) && /light\.lounge/.test(one.off)));
  console.log('D10 keep_on: a group:', grp.toast, '|', grp.off.slice(0, 120), ok(/^All off \(2 things kept on\)/.test(grp.toast) && !/light\.(max|stairs_night|night_lights|bedrooms)/.test(grp.off) && /light\.kitchen/.test(grp.off) && /light\.lounge/.test(grp.off)));
  const p = await openAt(1280, 800, 'look=glass&page=home&keep=1');
  const v = await p.evaluate(() => { const c = document.querySelector('family-hub-card'), tryIt = (k) => { try { document.createElement('family-hub-card').setConfig({ ...c._config, keep_on: k }); return 'accepted'; } catch (e) { return String(e.message); } }; return [tryIt('light.max'), tryIt([1, 2]), tryIt([]), tryIt(['light.a'])]; });
  console.log('D10 setConfig: a string', JSON.stringify(v[0]), '| numbers', JSON.stringify(v[1]), '| empty list', v[2], '| list of ids', v[3], ok(/keep_on should be a list/.test(v[0]) && /keep_on should be a list/.test(v[1]) && v[2] === 'accepted' && v[3] === 'accepted'));
  // everything kept: nothing to switch, and it says so
  await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, keep_on: ['light.max', 'light.kitchen', 'light.lounge', 'light.panel_backlight'] }); window.__calls = []; }); await p.locator('family-hub-card fh-home [data-act=alloff]').click(); await p.waitForTimeout(500);
  const t = await p.evaluate(() => ({ toast: (document.querySelector('family-hub-card').shadowRoot.querySelector('.toast')?.innerText ?? '').trim(), n: (window.__calls || []).filter((c) => /^light\.turn_off/.test(c)).length }));
  console.log('D10 every light that is on is kept:', t.toast, '| calls', t.n, ok(/^Nothing else to turn off \(4 things kept on\)$/.test(t.toast) && t.n === 0)); await p.context().close(); }
});

await finish();
