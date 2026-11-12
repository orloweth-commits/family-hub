// Click tests for the base panel: fonts, days off, row tapping, practice timer, keyboard, bedtime, calm mode, labels.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(4779);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'Australia/Perth', locale: 'en-AU' });
const errs = [];
const open = async (qs, time = '16:20') => { const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  page.on('requestfailed', (r) => errs.push('failed ' + r.url())); page.on('response', (r) => { if (r.status() === 404 && !/favicon/.test(r.url())) errs.push('404 ' + r.url()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:4779/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const shot = (page, n) => page.screenshot({ path: path.join(PREV, 'shots', n + '.png') });

// 1. fonts load from beside the card, nothing from a font service
let page = await open('look=fridge');
const reqs = []; page.on('request', (r) => reqs.push(r.url()));
await page.reload(); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(1500);
console.log('font requests:', reqs.filter((u) => /woff2|googleapis|gstatic/.test(u)).map((u) => u.replace('http://localhost:4779', '')).join(' '));
console.log('fonts ready:', await page.evaluate(() => ['Inter', 'Bricolage Grotesque', 'Fredoka', 'Caveat'].map((f) => f + '=' + document.fonts.check(`16px "${f}"`)).join(' ')));
await page.close();

// 2. days off: not a button on the child's page any more; it lives in the child's settings (behind the PIN), then one big button per day
page = await open('look=glass&page=kid&kid=0');
console.log('good days is a button (expect 0):', await page.getByRole('button', { name: /Good days/ }).count(), '| empty day slots (expect 0):', await page.locator('fh-kid .dots i:not(.g)').count());
await page.getByRole('button', { name: 'Riley’s settings' }).click(); await page.waitForTimeout(300);
for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Mark days off' }).click(); await page.waitForTimeout(400);
console.log('days sheet open:', await page.getByRole('dialog', { name: 'Days off' }).count());
const wed = page.getByRole('button', { name: /^Wed/ }); const box = await wed.boundingBox(); console.log('day button size:', Math.round(box.width) + 'x' + Math.round(box.height));
await shot(page, 'c-days'); await page.getByRole('button', { name: 'Done' }).click();

// 3. the whole chore row ticks the job (tap the far right of the row, on the points chip)
const row = page.locator('fh-kid .job').filter({ hasText: 'Unpack the dishwasher' }); const rb = await row.boundingBox();
await page.mouse.click(rb.x + rb.width - 30, rb.y + rb.height / 2); await page.waitForTimeout(500);
console.log('row tap ticks job:', await row.evaluate((e) => e.classList.contains('done')));

// 4. practice timer shows a wedge and can be stopped
await page.getByRole('button', { name: 'Show all' }).click().catch(() => {});
const play = page.getByRole('button', { name: /Start 15 minute timer/ });
if (await play.count()) { await play.scrollIntoViewIfNeeded(); await play.click(); await page.waitForTimeout(600);
  console.log('practice wedge:', await page.locator('fh-kid .play.going svg.tface').count(), 'label:', await page.locator('fh-kid .play.going').getAttribute('aria-label')); await shot(page, 'c-practice'); }
else console.log('practice button not found');
await page.close();

// 5. shared keyboard: groceries and add-event type the same way
page = await open('look=orbit&page=groceries');
for (const k of ['R', 'i', 'c', 'e']) await page.locator('fh-groceries .key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
console.log('groceries typed:', await page.locator('fh-groceries input').inputValue());
await page.getByRole('button', { name: 'Delete' }).click(); console.log('after delete:', await page.locator('fh-groceries input').inputValue());
await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(300); console.log('added Ric:', await page.locator('fh-groceries .item', { hasText: 'Ric' }).count());
await page.close();
page = await open('look=fridge&sheet=add');
for (const k of ['s', 'w', 'i', 'm']) await page.locator('fh-add-event .key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
console.log('add-event typed:', await page.locator('fh-add-event input').first().inputValue()); await shot(page, 'c-add-fridge');
await page.close();

// 6. wind-down: bedtime wedge (Max's bedtime 7:30 pm, at 7:10 pm)
page = await open('look=orbit&page=kid&kid=2', '19:10');
console.log('bed wedge:', await page.locator('fh-kid .bedclock').getAttribute('aria-label').catch(() => 'missing')); await shot(page, 'c-wind');
await page.close();

// 7. calm mode stops the avatar loops
page = await open('look=glass&page=kid&kid=1');
console.log('calm:', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot; const fh = r.querySelector('.fh'); const bob = r.querySelector('fh-kid').shadowRoot.querySelector('.av-bob'); return fh.hasAttribute('data-calm') + ' bob loops=' + (bob ? getComputedStyle(bob).animationIterationCount : 'n/a'); }));
// 8. month cell and presence labels, scroll cue
await page.getByRole('button', { name: 'Planner' }).click(); await page.getByRole('button', { name: 'Month' }).click(); await page.waitForTimeout(300);
console.log('month label:', await page.locator('family-hub-card .cell.today').getAttribute('aria-label'));
console.log('presence:', await page.locator('family-hub-card .presence .avatar').evaluateAll((els) => els.map((e) => e.textContent.trim() + ':' + e.getAttribute('aria-label')).join(' | ')));
await page.getByRole('button', { name: 'Groceries' }).click(); await page.waitForTimeout(400);
console.log('scroll cue on groceries:', await page.locator('fh-groceries .items').evaluate((e) => e.hasAttribute('data-more') + ' (' + e.scrollHeight + '>' + e.clientHeight + ')'));
await page.close();

// 9. weather: the header chip opens the page; now, hours, week and the two maps; without the Bureau's sensors it still stands
page = await open('look=glass&wx=rain');
await page.getByRole('button', { name: 'Weather', exact: true }).first().click(); await page.waitForTimeout(600);
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

// 10. the notes of 12 November: time dial, date picker, place finder, emergency button, tidy the fridge, who is home
page = await open('look=glass&sheet=add', '14:20');
const ae = (sel, o) => page.locator('fh-add-event ' + sel, o);
console.log('add: time chips gone:', await ae('.chips button', { hasText: /^\d\d:\d\d$/ }).count() === 0, '| drums:', await ae('.drum').count(), '| starts at:', await ae('.drum i[data-on]').allInnerTexts(), await ae('.ampm button[aria-pressed=true]').innerText());
await ae('.drum').first().evaluate((d) => { d.scrollTop += 44 * 2; }); await page.waitForTimeout(500);
await ae('.ampm button', { hasText: /^am$/ }).click();
console.log('add: after spinning two hours and am:', await ae('.drum i[data-on]').allInnerTexts(), await ae('.ampm button[aria-pressed=true]').innerText());
await ae('.calbtn').click(); await page.waitForTimeout(200);
console.log('add: month picker:', await ae('.month .mnav b').innerText(), '| days:', await ae('.month .mgrid button').count());
await ae('.month button[aria-label="Year after"]').first().click().catch(() => console.log('add: no year step'));
await ae('.month .mgrid button:not(:disabled)', { hasText: /^17$/ }).first().click(); await page.waitForTimeout(200);
console.log('add: far date chip:', await ae('.days button[aria-pressed=true]').innerText());
await ae('input[aria-label="Where"]').focus();
for (const k of ['B', 'e', 'a', 't']) await ae('.key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
await page.waitForTimeout(900);
console.log('add: places offered:', await ae('.places button').allInnerTexts());
await ae('.places button').first().click(); console.log('add: where is now:', await ae('input[aria-label="Where"]').inputValue());
await ae('input[aria-label="What’s on"]').focus();
for (const k of ['S', 'w', 'i', 'm']) await ae('.key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
await page.evaluate(() => { window.__calls = []; }); await ae('button.lead').click(); await page.waitForTimeout(400);
console.log('add: saved as:', await page.evaluate(() => (window.__calls || []).filter((c) => /create_event/.test(c)).join(' ')));
await page.close();
page = await open('look=glass&sheet=sitter', '18:20');
const sos = page.locator('family-hub-card .sosbtn');
console.log('info: contacts:', await page.locator('family-hub-card .irow').count(), '| address:', await page.locator('family-hub-card .sosaddr').innerText(), '| button:', await sos.getAttribute('aria-label'));
await page.evaluate(() => { window.__calls = []; });
await sos.dispatchEvent('pointerdown'); await page.waitForTimeout(400); await sos.dispatchEvent('pointerup'); await page.waitForTimeout(200);
console.log('info: a short press sends:', await page.evaluate(() => (window.__calls || []).filter((c) => /notify/.test(c)).length), '|', await page.locator('family-hub-card .sosnote').innerText());
await sos.dispatchEvent('pointerdown'); await page.waitForTimeout(1900);
console.log('info: a held press sends:', await page.evaluate(() => (window.__calls || []).filter((c) => /notify/.test(c)).map((c) => c.slice(0, 90)).join(' || ')), '|', await page.locator('family-hub-card .sosnote').innerText());
await page.close();
page = await open('look=glass');
await page.locator('family-hub-card .presence').click(); await page.waitForTimeout(200);
console.log('who is home says:', await page.locator('family-hub-card .toast').first().innerText());
await page.close();
page = await open('look=fridge&page=doodle');
await page.evaluate(() => localStorage.setItem('family-hub-fridge', JSON.stringify([{ title: 'doodle-20261110-101010-max', url: 'data:image/png;base64,iVBORw0KGgo=' }, { title: 'doodle-20261109-101010', url: 'data:image/png;base64,iVBORw0KGgo=' }])));
await page.close(); page = await open('look=fridge&page=doodle');
const dd = (sel) => page.locator('fh-doodle ' + sel);
console.log('doodle: on the fridge:', await dd('.snap').count(), '| crosses before PIN:', await dd('.down').count());
await dd('.tidy').click(); await page.waitForTimeout(200); console.log('doodle: PIN asked:', await page.locator('fh-doodle fh-pin').count());
for (const k of ['1', '2', '3', '4']) await page.locator('fh-doodle fh-pin button', { hasText: new RegExp('^' + k + '$') }).first().click();
await page.waitForTimeout(300); console.log('doodle: crosses after PIN:', await dd('.down').count());
await dd('.down').first().click(); await page.waitForTimeout(300); console.log('doodle: after taking one down:', await dd('.snap').count());
await dd('.clearall').click(); await page.waitForTimeout(300); console.log('doodle: after taking all down:', await dd('.snap').count());
await page.close();

// 11. the medication pill and record; bin night
page = await open('look=glass', '19:40');
console.log('bins:', await page.evaluate(() => { const c = document.querySelector('family-hub-card'); const f = (y, m, d) => { const r = c._bins(new Date(y, m, d)); return r.night.toDateString().slice(0, 10) + '=' + r.bins.join('+'); }; return [f(2026, 10, 9), f(2026, 10, 12), f(2026, 10, 16), f(2026, 10, 23), f(2026, 10, 3)].join(' | '); }));
await page.getByRole('button', { name: 'Medication', exact: true }).click(); await page.waitForTimeout(300);
const md = (sel, o) => page.locator('family-hub-card .sheet ' + sel, o);
console.log('meds: daily rows:', await md('.card').count(), '|', (await md('.card b').first().innerText()), '| due:', await md('.card .muted').first().innerText());
await md('.lead').click(); await page.waitForTimeout(300); console.log('meds: PIN asked before writing:', await page.locator('family-hub-card fh-pin').count()); for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(400); console.log('meds: nothing chosen:', await page.locator('family-hub-card .toast').first().innerText());
await md('.mchip', { hasText: 'Paracetamol' }).click(); await md('.mchip', { hasText: 'Charlie' }).click();
await md('.mchip', { hasText: '− 5 min' }).click(); await md('.mchip', { hasText: '− 5 min' }).click(); await md('.mchip', { hasText: /^Sam$/ }).click();
await md('.lead').click(); await page.waitForTimeout(400);
console.log('meds: record:', (await md('.irow').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ')).join(' || '));
await md('.mchip', { hasText: 'Other' }).click();
for (const k of ['Z', 'y', 'r']) await md('.key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
await md('.mchip', { hasText: 'Riley' }).click(); await md('.lead').click(); await page.waitForTimeout(400);
console.log('meds: records now:', await md('.irow').count(), '| newest:', (await md('.irow').first().innerText()).replace(/\s+/g, ' '));
await md('.irow button').first().click(); await page.waitForTimeout(300); console.log('meds: after removing one:', await md('.irow').count());
await page.close();

// 12. medication: one chip for two boys; a helper nobody has set is not a dose; a missing helper says so; "Given by" records and clears the chip
page = await open('look=glass', '08:10');
const cap = () => page.locator('family-hub-card .capsule .cap').filter({ hasText: '💊' });
console.log('meds chip, two overdue:', await cap().count(), '|', (await cap().first().innerText()).replace(/\s+/g, ' '));
await cap().first().click(); await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Given by Alex' }).first().click(); await page.waitForTimeout(300); for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500);
console.log('meds after one given:', (await cap().first().innerText()).replace(/\s+/g, ' '), '| row:', (await page.locator('family-hub-card .sheet .med2 .card b').nth(1).innerText()));
await page.close();
page = await open('look=glass&meds=new&sheet=meds', '08:10');
console.log('meds never set: rows read', (await page.locator('family-hub-card .sheet .med2 .card').allInnerTexts()).map((t) => /Overdue/.test(t) && /Given by/.test(t) ? 'overdue with buttons' : 'WRONG: ' + t.replace(/\s+/g, ' ')).join(' | '));
await page.close();
page = await open('look=glass&meds=missing&sheet=meds', '08:10');
console.log('meds helper missing:', (await page.locator('family-hub-card .sheet .med2 .card').first().innerText()).replace(/\s+/g, ' ').slice(0, 140), '| buttons:', await page.getByRole('button', { name: /Given by/ }).count());
await page.close();
// ---- pages polish: groceries, doodle, home, weather, kid pages, morning board ----
{
const calls = (p) => p.evaluate(() => (window.__calls ?? []).join('\n'));
const toastOf = async (p, host) => (await p.locator(`${host} .toast`).allInnerTexts()).join(' ').replace(/\s+/g, ' ').trim();
// groceries on a phone: the Add button stays on the screen and the page does not widen (finding 4)
{ const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'Australia/Perth', locale: 'en-AU' });
  for (const look of ['glass', 'fridge', 'orbit']) { const p = await ph.newPage(); await p.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await p.goto(`http://localhost:4779/?look=${look}&page=groceries`); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(700);
    const add = await p.getByRole('button', { name: 'Add', exact: true }).boundingBox(), dock = await p.locator('family-hub-card nav.dock').boundingBox();
    console.log(`phone groceries ${look}: Add right edge ${Math.round(add.x + add.width)} (≤ 390), page width ${await p.evaluate(() => document.documentElement.scrollWidth)} (≤ 392), dock ${Math.round(dock.x)}..${Math.round(dock.x + dock.width)}`); await p.close(); }
  await ph.close(); }
// groceries: clear with Undo, empty add, tick stays 4 s, failed load, failed add (finding 5)
page = await open('look=glass&page=groceries');
const gDone = () => page.locator('fh-groceries button.item.done').count();
const clear = page.getByRole('button', { name: /Clear ticked/ }); const cb = await clear.boundingBox();
console.log('clear button:', (await clear.innerText()).trim(), Math.round(cb.height) + ' px high', '| usual chip height:', Math.round((await page.getByRole('button', { name: 'Add Milk' }).boundingBox()).height));
await clear.click(); await page.waitForTimeout(300);
console.log('after clear: ticked rows', await gDone(), '| toast:', await toastOf(page, 'fh-groceries'), '| removed in Home Assistant yet:', /remove_/.test(await calls(page)));
await page.getByRole('button', { name: 'Undo' }).click(); await page.waitForTimeout(300);
console.log('after undo: ticked rows', await gDone(), '(expect 2) | removed:', /remove_/.test(await calls(page)));
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
console.log('list not reachable:', (await page.locator('fh-groceries .list').innerText()).replace(/\s+/g, ' ').slice(0, 80));
await page.evaluate(() => { window.__listOk = true; }); await page.getByRole('button', { name: 'Try again' }).click(); await page.waitForTimeout(400);
console.log('after Try again: rows', await page.locator('fh-groceries button.item').count());
await page.close();
page = await open('look=glass&page=groceries&fail=1');
await page.getByRole('button', { name: 'Add Bread' }).click(); await page.waitForTimeout(800);
console.log('failed add says:', await toastOf(page, 'fh-groceries'));
await page.close();
// doodle: the hero is one line at 52 px, artists sign with their faces, new stamps (finding 6)
for (const look of ['glass', 'fridge', 'orbit']) { page = await open(`look=${look}&page=doodle`);
  const st = page.getByRole('button', { name: /Stick it up/ }), sb = await st.boundingBox(), pad = await page.locator('fh-doodle .easel').boundingBox();
  const faces = await page.locator('fh-doodle .artist .avatar').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width) + (e.querySelector('svg') ? ' drawn' : ' letter')));
  console.log(`doodle ${look}: hero "${(await st.innerText()).trim()}" ${Math.round(sb.height)} px high, inside the easel ${sb.x >= pad.x && sb.x + sb.width <= pad.x + pad.width + 1 && sb.y + sb.height <= pad.y + pad.height + 1} | faces: ${faces.join(', ')} | stamps: ${await page.getByRole('button', { name: / stamp$/ }).count()}`);
  await page.close(); }
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
// weather: without Bureau data the UV line makes sense; picture tips with a speaker; whole hour columns; a lost entity is not a set-up message (findings 1 to 3)
page = await open('look=glass&page=weather&bom=0');
const wx = async () => (await page.locator('fh-weather section').allInnerTexts()).join(' ').replace(/\s+/g, ' ');
console.log('no Bureau data:', /Cover up today/.test(await wx()), '| "No sun protection needed" shown:', /No sun protection/.test(await wx()));
console.log('tips:', await page.locator('fh-weather .tipone').evaluateAll((els) => els.map((e) => e.textContent.trim() + ' ' + parseFloat(getComputedStyle(e.querySelector('svg')).width) + 'px').join(', ')), '| speaker:', await page.getByRole('button', { name: 'Read the advice aloud' }).count());
console.log('hour strip:', await page.locator('fh-weather .hscroll').evaluate((e) => { const n = e.querySelectorAll(':scope > svg > circle').length, w = e.querySelector('svg').getBoundingClientRect().width / n, k = e.getBoundingClientRect().width / w; return `${k.toFixed(2)} columns in view, fade ${e.hasAttribute('data-more-r')}`; }));
await page.close(); page = await open('look=glass&page=weather');
console.log('fire danger in full:', await page.locator('fh-weather .wfact b', { hasText: /^Mod/ }).evaluate((e) => e.textContent + ' ' + (e.scrollWidth <= e.clientWidth + 1)));
await page.evaluate(() => { const c = document.querySelector('family-hub-card'), h = c.hass; c.hass = { ...h, states: { ...h.states, 'weather.home': { ...h.states['weather.home'], state: 'unavailable' } } }; }); await page.waitForTimeout(500);
console.log('weather entity lost:', (await wx()).slice(0, 40));
await page.close();
// rewards: one tap never spends; the row asks, and both answers are 52 px (finding 8)
page = await open('look=glass&page=kid&kid=0');
const spent = async () => /"points":-50/.test(await calls(page));
await page.getByRole('button', { name: /Extra screen time/ }).click(); await page.waitForTimeout(300);
const yes = page.locator('fh-kid .rw.ask').getByRole('button', { name: 'Yes' }), no = page.locator('fh-kid .rw.ask').getByRole('button', { name: 'Not now' });
console.log('reward tapped once: spent', await spent(), '| asks:', (await page.locator('fh-kid .rw.ask .q').innerText()).replace(/\s+/g, ' '), '| buttons', Math.round((await yes.boundingBox()).height), Math.round((await no.boundingBox()).height));
await no.click(); await page.waitForTimeout(200); console.log('not now: spent', await spent(), '| chip reads:', (await page.locator('fh-kid .rw .cost').first().innerText()).trim());
await page.getByRole('button', { name: /Extra screen time/ }).click(); await page.waitForTimeout(200); await page.locator('fh-kid .rw.ask').getByRole('button', { name: 'Yes' }).click(); await page.waitForTimeout(300);
console.log('yes: spent', await spent());
// one job ticked with others left is not "everything" (finding 10); a touch answers on the way down, and a swallowed second tap wiggles (finding 12)
const hw = page.locator('fh-kid .job').filter({ hasText: 'Homework' });
await page.waitForTimeout(3000); await hw.dispatchEvent('pointerdown'); console.log('pointer-down answers at once:', await hw.evaluate((e) => e.hasAttribute('data-just')));
await hw.click(); await page.waitForTimeout(500);
console.log('one job ticked, toast:', JSON.stringify(await toastOf(page, 'fh-kid')), '(not "everything")');
await hw.click(); console.log('tap inside the 2 s guard wiggles:', await hw.evaluate((e) => e.hasAttribute('data-nope')));
console.log('filled buttons on the page:', await page.locator('fh-kid').evaluate((k) => { const probe = document.createElement('i'); probe.style.background = 'var(--primary)'; k.shadowRoot.querySelector('.jobs').appendChild(probe); const c = getComputedStyle(probe).backgroundColor; probe.remove(); return [...k.shadowRoot.querySelectorAll('button')].filter((b) => getComputedStyle(b).backgroundColor === c).map((b) => b.textContent.trim().slice(0, 16)).join(',') || 'none'; }), '(at most the current job’s timer) | small targets:', await page.locator('fh-kid').evaluate((k) => [...k.shadowRoot.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height < 43.5 && b.getBoundingClientRect().height > 0).map((b) => b.className).join(',') || 'none'));
// feelings: the note is real and nothing promises a visit (finding 11)
await page.evaluate(() => { window.__chat = []; document.addEventListener('fh-kid-wants-chat', (e) => window.__chat.push(e.detail)); });
await page.locator('fh-kid').getByRole('button', { name: 'sad' }).click(); await page.waitForTimeout(200); await page.getByRole('button', { name: /Chat later/ }).click(); await page.waitForTimeout(300);
console.log('chat: event', JSON.stringify(await page.evaluate(() => window.__chat)), '| child reads:', await toastOf(page, 'fh-kid'), '| note:', (await calls(page)).split('\n').filter((c) => /persistent_notification/.test(c)).join('').replace(/.*"message":"([^"]*)".*/, '$1'));
await page.close();
// Max: his aids are low, "jobs first" is kept, and all done is a picture with one big button (finding 9)
{ const wall = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU' }); const p = await wall.newPage(); await p.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await p.goto('http://localhost:4779/?look=glass&page=kid&kid=2'); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(900);
  await p.getByRole('button', { name: /My stars/ }).click(); await p.waitForTimeout(300);
  const rd = await p.getByRole('button', { name: 'Read my jobs' }).boundingBox(), tabs = await p.locator('fh-kid .tabcard').boundingBox(), feel = await p.locator('fh-kid section[aria-label="How are you feeling"]').boundingBox();
  console.log('Max on the wall: reader', Math.round(rd.width) + ' px, centre y', Math.round(rd.y + rd.height / 2), '(> 540) | stars panel below feelings:', tabs.y > feel.y, '| reward pictures:', (await p.locator('fh-kid .rw .rpic').allInnerTexts()).join(' '), '| reward stars drawn:', await p.locator('fh-kid .rw .sstar').count());
  await p.getByRole('button', { name: /My look/ }).click(); await p.waitForTimeout(300);
  console.log('My look with a job left: studio open', await p.locator('fh-studio').count(), '| says:', await toastOf(p, 'fh-kid'));
  await p.locator('fh-kid .pic.big').click(); await p.waitForTimeout(1200);
  const see = p.getByRole('button', { name: 'See what I did' }), sb2 = await see.boundingBox(), tb = await p.locator('fh-kid .toast').boundingBox().catch(() => null);
  console.log('Max all done: picture', await p.locator('fh-kid .party svg').count() > 0, '| button', Math.round(sb2.height) + ' px high | toast over the button:', !!tb && tb.y < sb2.y + sb2.height && tb.y + tb.height > sb2.y && tb.x < sb2.x + sb2.width && tb.x + tb.width > sb2.x);
  await wall.close(); }
// morning board: nothing per child about how far through the morning he is (finding 13)
page = await open('look=glass&page=morning', '07:10');
const mb = (await page.locator('fh-morning section, fh-morning .kcol').allInnerTexts()).join(' ').replace(/\s+/g, ' ');
console.log('morning board: "All set" or "Next" in a column:', /All set|Next\b/.test(mb), '| pooled line:', (/Morning jobs: \d+ to go between us/.exec(mb) ?? ['MISSING'])[0]);
await page.close();
}
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close();
