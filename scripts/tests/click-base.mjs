// Click tests for the base panel: fonts, days off, row tapping, practice timer, keyboard, bedtime, calm mode, labels, medication, Ask.
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

// 2. days off: PIN, then one big button per day
page = await open('look=glass&page=kid&kid=0');
await page.getByRole('button', { name: /Good days/ }).click(); await page.waitForTimeout(300);
for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click();
await page.waitForTimeout(400);
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

// 13. Ask: the children's chat. The microphone button is gone; starters, the on-screen keyboard, a failing call, the PIN after bedtime, and no button without the config
page = await open('look=glass');
const CH = (s, o) => page.locator('fh-chat ' + s, o), bubbles = async () => (await CH('.thread .bubble').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
console.log('chat: old microphone button:', await page.locator('family-hub-card [data-act="assist"]').count(), '| Ask a question:', await page.getByRole('button', { name: 'Ask a question' }).count(), '| size:', await page.getByRole('button', { name: 'Ask a question' }).boundingBox().then((b) => Math.round(b.width) + 'x' + Math.round(b.height)));
await page.getByRole('button', { name: 'Ask a question' }).click(); await page.waitForTimeout(600);
console.log('chat: sheet open:', await page.getByRole('dialog', { name: 'Ask' }).count(), '| starters:', await CH('.starter').count(), '| bubble text:', await CH('.bubble').first().evaluate((e) => getComputedStyle(e).fontSize + '/' + (parseFloat(getComputedStyle(e).lineHeight) / parseFloat(getComputedStyle(e).fontSize)).toFixed(1)));
await CH('.starter', { hasText: 'animal fact' }).click(); await page.waitForTimeout(250);
console.log('chat: after a starter:', (await bubbles()).join(' || '), '| thinking:', await CH('.bubble.wait').count(), '| Send disabled:', await CH('.send .lead').isDisabled());
await CH('.starter', { hasText: 'joke' }).click({ force: true }); await page.waitForTimeout(900);
console.log('chat: reply:', (await bubbles()).join(' || ').slice(0, 170), '| announced:', (await CH('[aria-live="polite"]').innerText()).slice(0, 30));
await CH('.field').click(); await page.waitForTimeout(200);
for (const k of ['W', 'h', 'y']) await CH('.key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
await CH('.key.space').click(); for (const k of 'sky') await CH('.key', { hasText: new RegExp('^' + k + '$') }).first().click();
console.log('chat: typed on the keys:', await CH('.field').inputValue(), '| smallest starter:', await CH('.starter').evaluateAll((els) => Math.min(...els.map((e) => Math.round(e.getBoundingClientRect().height)))) + 'px high', '| microphone:', await CH('.talk').boundingBox().then((b) => Math.round(b.width) + 'x' + Math.round(b.height)), '| smallest control:', await page.locator('fh-chat button').evaluateAll((els) => Math.min(...els.map((e) => Math.round(Math.min(e.getBoundingClientRect().height, e.getBoundingClientRect().width))))) + 'px', '| unnamed controls:', await page.locator('fh-chat button, fh-chat input').evaluateAll((els) => els.filter((e) => !(e.getAttribute('aria-label') || e.innerText.trim())).length));
await CH('.send .lead').click(); await page.waitForTimeout(1000);
console.log('chat: after Send:', (await bubbles()).slice(-2).join(' || ').slice(0, 120), '| field emptied:', (await CH('.field').inputValue()) === '');
await CH('.field').pressSequentially('moons'); await CH('.field').press('Enter'); await page.waitForTimeout(1000);
const sent = await page.evaluate(() => (window.__calls || []).filter((c) => c.startsWith('ws.conversation')).map((c) => JSON.parse(c.slice(c.indexOf('{')))));
console.log('chat: Enter on a real keyboard:', (await bubbles()).slice(-2)[0], '| calls:', sent.length, '| only these go to Home Assistant:', Object.keys(sent[2]).sort().join(','), '| thread kept:', sent[2].conversation_id, '| one call for two quick taps:', sent.filter((c) => /animal|joke/.test(c.text)).length === 1);
await shot(page, 'c-chat');
await page.getByRole('button', { name: 'For grown-ups' }).click(); await page.waitForTimeout(300); console.log('chat: grown-ups record asks for the PIN:', await page.getByRole('dialog', { name: 'Parent PIN' }).count());
for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(400);
console.log('chat: record rows:', await CH('.rec').count(), '| stored keys:', await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('fh-chat-log'))[0]).join(',')));
await CH('.pill', { hasText: 'Clear' }).click(); await page.waitForTimeout(200); console.log('chat: after Clear:', await CH('.rec').count(), '| stored:', await page.evaluate(() => localStorage.getItem('fh-chat-log')));
await CH('.pill', { hasText: 'Back' }).click(); await CH('.pill', { hasText: 'Start again' }).click(); await page.waitForTimeout(200); console.log('chat: Start again leaves', (await bubbles()).length, 'bubble (the greeting)');
await page.clock.fastForward(181000); await page.waitForTimeout(300); console.log('chat: closes itself after 3 quiet minutes:', await page.locator('fh-chat').count() === 0);
await page.close();
page = await open('look=glass&fail=1&sheet=chat');
const before = errs.length;
await CH('.starter').first().click(); await page.waitForTimeout(1100);
console.log('chat: failing call:', (await bubbles()).pop(), '| page errors:', errs.length - before, '| can ask again:', await CH('.starter').first().isEnabled());
await page.close();
page = await open('look=glass', '20:30');
await page.getByRole('button', { name: 'Ask a question' }).click(); await page.waitForTimeout(400);
console.log('chat at 20:30: PIN pad:', await page.getByRole('dialog', { name: 'Parent PIN' }).count(), (await page.locator('fh-pin h2').innerText()), '| sheet before the PIN:', await page.locator('fh-chat').count());
for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500);
console.log('chat at 20:30: sheet after the PIN:', await page.locator('fh-chat').count());
await page.close();
page = await open('look=glass&page=kid&kid=2');
console.log('chat on a child’s page: button:', await page.getByRole('button', { name: 'Ask a question' }).count());
await page.close();
page = await open('look=glass&chat=off');
console.log('chat=off: Ask button:', await page.getByRole('button', { name: 'Ask a question' }).count(), '| old microphone button:', await page.locator('family-hub-card [data-act="assist"]').count());
await page.close();
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close();
