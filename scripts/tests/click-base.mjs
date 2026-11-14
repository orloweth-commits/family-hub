// Click tests for the base panel: fonts, days off, row tapping, practice timer, keyboard, bedtime, calm mode, labels, medication, Ask.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const PORT = Number(process.env.PORT || 4779); // PORT= moves the test server when another run holds the usual port
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'Australia/Perth', locale: 'en-AU' });
const errs = [];
// since 0.33.0 (Phase 4): a child's page has only his face and Home in the dock, and Looks, Medicine, House info, Night and who-is-home are in the More sheet
const HOME = async (p) => { if (await p.locator('family-hub-card nav.dock[data-kid]').count()) { await p.locator('family-hub-card nav.dock [data-nav="home"]').click(); await p.waitForTimeout(400); } };
const MORE = async (p) => { await p.evaluate(() => { document.querySelector('family-hub-card')._sheet = 'more'; }); await p.waitForTimeout(400); };
const open = async (qs, time = '16:20') => { const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  page.on('requestfailed', (r) => errs.push('failed ' + r.url())); page.on('response', (r) => { if (r.status() === 404 && !/favicon/.test(r.url())) errs.push('404 ' + r.url()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const shot = (page, n) => page.screenshot({ path: path.join(PREV, 'shots', n + '.png') });

// 1. fonts load from beside the card, nothing from a font service
let page = await open('look=fridge');
const reqs = []; page.on('request', (r) => reqs.push(r.url()));
await page.reload(); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(1500);
console.log('font requests:', reqs.filter((u) => /woff2|googleapis|gstatic/.test(u)).map((u) => u.replace('http://localhost:' + PORT + '', '')).join(' '));
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
await HOME(page); await page.getByRole('button', { name: 'Planner' }).click(); await page.getByRole('button', { name: 'Month' }).click(); await page.waitForTimeout(300);
console.log('month label:', await page.locator('family-hub-card .cell.today').getAttribute('aria-label'));
console.log('presence:', await page.locator('family-hub-card .presence .avatar').evaluateAll((els) => els.map((e) => e.textContent.trim() + ':' + e.getAttribute('aria-label')).join(' | ')));
await HOME(page); await page.getByRole('button', { name: 'Groceries' }).click(); await page.waitForTimeout(400);
console.log('scroll cue on groceries:', await page.locator('fh-groceries .items').evaluate((e) => e.hasAttribute('data-more') + ' (' + e.scrollHeight + '>' + e.clientHeight + ')'));
await page.close();

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

// 10. the notes of 12 November: time dial, date picker, place finder, emergency button, tidy the fridge, who is home
page = await open('look=glass&sheet=add', '14:20');
const ae = (sel, o) => page.locator('fh-add-event ' + sel, o);
console.log('add: time chips gone:', await ae('.chips button', { hasText: /^\d\d:\d\d$/ }).count() === 0, '| drums:', await ae('.drum').count(), '| starts at:', await ae('.drum i[data-on]').allInnerTexts(), await ae('.ampm button[aria-pressed=true]').innerText());
await ae('.drum').first().evaluate((d) => { d.scrollTop += 44 * 2; }); await page.waitForTimeout(500);
await ae('.ampm button', { hasText: /^am$/ }).click();
console.log('add: after spinning two hours and am:', await ae('.drum i[data-on]').allInnerTexts(), await ae('.ampm button[aria-pressed=true]').innerText());
await ae('.calbtn:not(.repbtn)').click(); await page.waitForTimeout(200);
console.log('add: month picker:', await ae('.month .mnav b').innerText(), '| days:', await ae('.month .mgrid button').count());
await ae('.month button[aria-label="Year after"]').first().click().catch(() => console.log('add: no year step'));
await ae('.month .mgrid button:not(:disabled)', { hasText: /^17$/ }).first().click(); await page.waitForTimeout(200);
console.log('add: far date chip:', await ae('.farchip').innerText());
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
await MORE(page); await page.locator('family-hub-card .presence').click(); await page.waitForTimeout(200); await page.evaluate(() => { document.querySelector('family-hub-card')._sheet = ''; }); await page.waitForTimeout(300);
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
console.log('meds: round pill button hidden beside the chip:', await page.locator('family-hub-card header [data-act=meds]').isHidden());
await page.locator('family-hub-card .capsule .cap[data-kind=med]').click(); await page.waitForTimeout(300);
const md = (sel, o) => page.locator('family-hub-card .sheet ' + sel, o);
console.log('meds: daily rows:', await md('.card').count(), '|', (await md('.card b').first().innerText()), '| due:', await md('.card .muted').first().innerText());
await md('[data-act=log]').click(); await page.waitForTimeout(300); console.log('meds: PIN asked before writing:', await page.locator('family-hub-card fh-pin').count()); for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(400); console.log('meds: nothing chosen:', await page.locator('family-hub-card .toast').first().innerText());
await md('.mchip', { hasText: 'Paracetamol' }).click(); await md('.mchip', { hasText: 'Charlie' }).click();
await md('.mchip', { hasText: '− 5 min' }).click(); await md('.mchip', { hasText: '− 5 min' }).click(); await md('.mchip', { hasText: /^Sam$/ }).click();
await md('[data-act=log]').click(); await page.waitForTimeout(400);
console.log('meds: record:', (await md('.irow').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ')).join(' || '));
await md('.mchip', { hasText: 'Other' }).click();
for (const k of ['Z', 'y', 'r']) await md('.key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
await md('.mchip', { hasText: 'Riley' }).click(); await md('[data-act=log]').click(); await page.waitForTimeout(400);
console.log('meds: records now:', await md('.irow').count(), '| newest:', (await md('.irow').first().innerText()).replace(/\s+/g, ' '));
await md('.irow button').first().click(); await page.waitForTimeout(300); console.log('meds: after removing one:', await md('.irow').count());
await page.close();

// 12. medication: one chip for two boys; a helper nobody has set is not a dose; a missing helper says so; "Given by" records and clears the chip
page = await open('look=glass', '08:10');
const cap = () => page.locator('family-hub-card .capsule .cap[data-kind=med]');
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
for (const d of '1234') await page.locator('family-hub-card fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(400);
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
console.log('chat on a picture-mode child’s page: buttons (expect 2: the header’s and the big Ask in reach):', await page.getByRole('button', { name: 'Ask a question' }).count());
await page.close();
page = await open('look=glass&chat=off');
console.log('chat=off: Ask button:', await page.getByRole('button', { name: 'Ask a question' }).count(), '| old microphone button:', await page.locator('family-hub-card [data-act="assist"]').count());
await page.close();

// 13. header: one row, chips whole or absent, a due medication chip beside the running timer at 7:10 am, "1 overdue" (never a name) not cut in Orbit
const hdr = () => page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, hd = r.querySelector('header'), vis = (e) => e.offsetParent !== null;
  const caps = [...hd.querySelectorAll('.capsule .cap')].filter(vis), top = hd.getBoundingClientRect().top;
  return { chips: caps.map((e) => e.innerText.replace(/\s+/g, ' ').trim()).join(' | '), wrapped: caps.filter((e) => e.getBoundingClientRect().top - top > 40).length, cut: caps.filter((e) => e.scrollWidth > e.clientWidth + 1 || [...e.querySelectorAll('span,b')].some((x) => x.scrollWidth > x.clientWidth + 1 && !x.classList.contains('ell'))).length,
    heights: [...new Set([...hd.querySelectorAll('.capsule .cap, .right > *')].filter(vis).map((e) => e.offsetHeight))].join(','), over: hd.scrollWidth - hd.clientWidth, pill: !!hd.querySelector('[data-act=meds]') && vis(hd.querySelector('[data-act=meds]')) }; });
for (const lk of ['glass', 'fridge', 'orbit']) for (const [w, h] of [[1280, 800], [1312, 668], [1920, 1080]]) {
  page = await open('look=' + lk, '07:10'); await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
  const r = await hdr(); console.log(`header ${lk} ${w}x${h} 7:10:`, /due/.test(r.chips) && /\d:\d\d/.test(r.chips) && !r.wrapped && !r.cut && r.heights === '52' && r.over <= 0 && !r.pill ? 'ok' : 'WRONG', JSON.stringify(r)); await page.close(); }
page = await open('look=orbit', '08:10'); await page.setViewportSize({ width: 1280, height: 800 });
await page.evaluate(() => { const c = document.querySelector('family-hub-card'), h = c.hass, S = { ...h.states }; S['input_datetime.fh_med_riley_am'] = { ...S['input_datetime.fh_med_riley_am'], attributes: { timestamp: Date.now() / 1000 } }; S['input_text.fh_med_riley_am_by'] = { ...S['input_text.fh_med_riley_am_by'], state: 'Alex' }; c.hass = { ...h, states: S }; }); await page.waitForTimeout(400);
{ const r = await hdr(); console.log('header orbit, one overdue (a count, no name):', /(^|\| )1 overdue/.test(r.chips) && !/Charlie|Riley/.test(r.chips) && !r.cut && !r.wrapped ? 'ok' : 'WRONG', JSON.stringify(r)); }
await page.setViewportSize({ width: 1280, height: 800 }); await page.close();

// 14. planner: a failed load is not an empty week; empty week and empty day say so; Try again loads
page = await open('look=glass');
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); window.__api = c.hass.callApi; c.hass.callApi = async () => { throw new Error('offline'); }; c._fetchedKey = ''; c._refresh(); }); await page.waitForTimeout(400);
console.log('calendars failed:', (await page.locator('family-hub-card .calfail').innerText()).replace(/\s+/g, ' '), '| empty state shown:', await page.locator('family-hub-card .quiet, family-hub-card .freeday').count());
await page.evaluate(() => { document.querySelector('family-hub-card').hass.callApi = window.__api; }); await page.getByRole('button', { name: 'Try again' }).click(); await page.waitForTimeout(400);
console.log('after Try again: events', await page.locator('family-hub-card .week .ev').count(), '| error left:', await page.locator('family-hub-card .calfail').count());
await page.close(); page = await open('look=glass&events=none');
console.log('empty week:', (await page.locator('family-hub-card .quiet').innerText()).replace(/\s+/g, ' '));
await page.getByRole('button', { name: 'Day', exact: true }).click(); await page.waitForTimeout(400);
console.log('empty day:', (await page.locator('family-hub-card .freeday').innerText()).replace(/\s+/g, ' '), '| picture:', await page.locator('family-hub-card .freeday svg').count());
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, calendars: [] }); }); await page.waitForTimeout(300);
console.log('no calendars: Add buttons on the planner:', await page.locator('family-hub-card .planner [data-act=add], family-hub-card .planner .quiet').count());
await page.close();

// 15. right rail: three reminders at 1280x800, "+N more" when they are cut, and a list that cannot load says so
page = await open('look=glass'); const rail = (sel) => page.locator('family-hub-card aside ' + sel);
console.log('reminders shown:', await rail('.rem').count(), '| jar is its own card:', await rail('.jar').count(), await rail('.rems .jarpic').count() === 0);
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c._reminders = Array.from({ length: 8 }, (_, i) => ({ uid: 'x' + i, summary: 'Reminder ' + (i + 1) })); }); await page.waitForTimeout(400);
console.log('eight reminders:', await rail('.rem').count(), 'shown,', await rail('.remmore').innerText(), '| cut off:', await rail('.remlist').evaluate((e) => e.scrollHeight > e.clientHeight + 1));
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c.hass.callWS = async () => { throw new Error('offline'); }; return c._loadReminders(); }); await page.waitForTimeout(300);
console.log('reminders failed:', (await rail('.remfail').innerText()).replace(/\s+/g, ' '), '| says All done:', await rail('.rems').getByText('All done').count());
await page.evaluate(() => { const c = document.querySelector('family-hub-card'), S = { ...c.hass.states }; delete S['todo.reminders']; c.hass = { ...c.hass, states: S }; return c._loadReminders(); }); await page.waitForTimeout(300);
console.log('reminders list missing:', (await rail('.remfail').innerText()).replace(/\s+/g, ' '));
await page.close();

// 16. kitchen timer: Cancel with Undo, the readout opens the sheet, a failure says so, a missing timer says so
page = await open('look=glass'); await page.evaluate(() => { window.__calls = []; });
await rail('.tcancel').click(); await page.waitForTimeout(300);
console.log('timer cancel:', await page.evaluate(() => window.__calls.filter((c) => /^timer\./.test(c)).join(' ')), '| toast:', (await page.locator('family-hub-card .toast').innerText()).replace(/\s+/g, ' '));
await page.locator('family-hub-card .toast button').click(); await page.waitForTimeout(300);
console.log('timer undo:', await page.evaluate(() => window.__calls.filter((c) => /timer\.start/.test(c)).join(' ')), '| toast:', await page.locator('family-hub-card .toast').innerText());
await rail('.tread').click(); await page.waitForTimeout(300);
console.log('readout opens the sheet:', await page.getByRole('dialog', { name: 'Kitchen timer' }).count(), '| Cancel there too:', await page.locator('family-hub-card .sheet').getByRole('button', { name: 'Cancel the kitchen timer' }).innerText());
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.evaluate(() => { const c = document.querySelector('family-hub-card'), S = { ...c.hass.states }; delete S['timer.kitchen']; c.hass = { ...c.hass, states: S }; }); await page.waitForTimeout(300);
console.log('no timer helper:', (await rail('.tmr').innerText()).replace(/\s+/g, ' '), '| buttons:', await rail('.tmr button').count());
await page.close(); page = await open('look=glass&fail=1'); const toast = async () => (await page.locator('family-hub-card .toast').innerText().catch(() => '(no toast)')).replace(/\s+/g, ' ');
await rail('.quick').first().click(); await page.waitForTimeout(700); console.log('timer add fails:', await toast());
await rail('.tcancel').click(); await page.waitForTimeout(700); console.log('timer cancel fails:', await toast());
await page.locator('family-hub-card [data-nav=lights-on]').click(); await page.waitForTimeout(700); console.log('all on fails:', await toast());
await page.locator('family-hub-card [data-nav=lights-off]').click(); await page.waitForTimeout(700); console.log('all off fails:', await toast());
await page.getByRole('button', { name: 'Pause' }).click(); await page.waitForTimeout(700); console.log('pause fails:', await toast());
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, announce_script: 'script.dinner' }); return c._dinnerGo(); }); await page.waitForTimeout(300); console.log('dinner fails:', await toast());
await page.close();

// 17. sheets: focus goes in, Escape closes, focus goes back to the opener; no sheet over the header or the dock; toasts
page = await open('look=glass');
await page.locator('family-hub-card header [data-act="more"]').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400); const info = page.locator('family-hub-card .sheet [data-act="info"]'); await info.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
const where = () => page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, a = r.activeElement; return a ? (a.closest('.sheet') ? 'in the sheet' : a.getAttribute('aria-label') || a.className) : 'nowhere'; });
console.log('sheet open:', await page.getByRole('dialog', { name: 'House info' }).count(), '| focus:', await where(), '| phone links:', await page.locator('family-hub-card .sheet a[href^="tel:"]').count());
await page.keyboard.press('Escape'); await page.waitForTimeout(300); console.log('after Escape: sheets', await page.locator('family-hub-card .sheet').count(), '| focus:', await where());
for (const s of ['sitter', 'meds', 'timer', 'themes']) { await page.evaluate((x) => { document.querySelector('family-hub-card')._sheet = x; }, s); await page.waitForTimeout(500);
  console.log(`sheet ${s} between header and dock:`, await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, b = r.querySelector('.scrim > .sheet').getBoundingClientRect(), h = r.querySelector('header').getBoundingClientRect(), d = r.querySelector('nav.dock').getBoundingClientRect(); return b.top >= h.bottom - 1 && b.bottom <= d.top + 1 ? 'ok' : `WRONG ${Math.round(b.top)}–${Math.round(b.bottom)} vs ${Math.round(h.bottom)}–${Math.round(d.top)}`; }), '| close button:', await page.locator('family-hub-card .sheet .xbtn').evaluate((e) => e.offsetWidth + 'x' + e.offsetHeight)); }
await page.keyboard.press('Escape'); await MORE(page); await page.locator('family-hub-card .presence').click(); await page.waitForTimeout(300); await page.evaluate(() => { document.querySelector('family-hub-card')._sheet = ''; }); await page.waitForTimeout(300);
console.log('toast:', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, w = r.querySelector('.toasts'), t = w.querySelector('.toast').getBoundingClientRect(), f = r.querySelector('.fh').getBoundingClientRect(); return `role=${w.getAttribute('role')} live=${w.getAttribute('aria-live')} off-centre=${Math.round(Math.abs((t.left + t.right) / 2 - (f.left + f.right) / 2))}px strip-takes-taps=${getComputedStyle(w).pointerEvents !== 'none'}`; }));
await page.close();

// 18. add sheet: the error clears on typing, the toast reads like the summary, two quick taps add one event
page = await open('look=glass&sheet=add&slow=500', '14:20');
await ae('button.lead').click(); await page.waitForTimeout(200); console.log('add: no title:', await ae('.err').innerText());
for (const k of ['S', 'w', 'i', 'm']) await ae('.key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
console.log('add: error after typing:', (await ae('.err').innerText()).trim().length, '| summary:', await ae('.sum').first().innerText(), '| chip heights:', await ae('.chips button, .durs button, .ampm button, .allday').evaluateAll((els) => [...new Set(els.map((e) => e.offsetHeight))].join(',')));
await page.evaluate(() => { window.__calls = []; }); const sum = await ae('.sum').first().innerText();
await ae('button.lead').dblclick(); await ae('button.lead').click({ force: true, timeout: 500 }).catch(() => {}); await page.waitForTimeout(1500);
console.log('add: events created by three quick taps:', await page.evaluate(() => window.__calls.filter((c) => /create_event/.test(c)).length), '| toast matches summary:', (await page.locator('family-hub-card .toast').innerText()).trim() === 'Added: ' + sum);
await page.close();

// 19. PIN pad: says what it unlocks, typed digits and Backspace work, a wrong PIN is told in words, Escape cancels
page = await open('look=glass&page=kid&kid=0'); const pin = (sel) => page.locator('family-hub-card > fh-pin ' + sel).or(page.locator('family-hub-card fh-pin ' + sel)).first();
await page.locator('family-hub-card [data-act=looks]').click(); await page.waitForTimeout(300);
console.log('pin: reason:', await pin('h2').innerText(), '| focus inside:', await page.evaluate(() => !!document.querySelector('family-hub-card').shadowRoot.querySelector('fh-pin').shadowRoot.activeElement));
await page.keyboard.type('12'); await page.keyboard.press('Backspace'); await page.waitForTimeout(100); console.log('pin: after 1, 2, Backspace:', await pin('.dots').getAttribute('aria-label'));
await page.keyboard.type('999'); await page.waitForTimeout(600); console.log('pin: wrong:', await pin('.note').innerText(), '|', await pin('.dots').getAttribute('aria-label'));
await page.keyboard.press('Escape'); await page.waitForTimeout(300); console.log('pin: after Escape:', await page.locator('family-hub-card fh-pin').count(), 'pads,', await page.locator('family-hub-card .sheet').count(), 'sheets');
await page.locator('family-hub-card [data-act=looks]').click(); await page.waitForTimeout(300); await page.keyboard.type('1234'); await page.waitForTimeout(400);
console.log('pin: right PIN typed opens:', await page.locator('family-hub-card .sheet').getAttribute('aria-label'));
await page.close();

// polish pass, looks: one grammar per look (every line below should end in true)
{ const Q = (pg, f) => pg.evaluate(f);
  const lum = `const L = (c) => { const m = c.match(/[\\d.]+/g).map(Number), f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); }; const CR = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };`;
  // Fridge: the pause button on the dark Now playing card is the blue action with a white icon
  let o = await open('look=fridge&page=planner');
  console.log('looks: fridge pause is a blue action:', await Q(o, `(() => { ${lum} const c = document.querySelector('family-hub-card').shadowRoot, b = c.querySelector('.np .round'), cs = getComputedStyle(b); return CR(cs.backgroundColor, cs.color) >= 4.5 && CR(cs.backgroundColor, 'rgb(47,42,38)') >= 1.3; })()`));
  await o.close();
  // the look picker: the chosen card is a ring and a tick with no fill, and its description is readable
  for (const look of ['glass', 'fridge', 'orbit']) { o = await open(`look=${look}&page=planner&sheet=themes`);
    console.log(`looks: ${look} chosen look card is ring + tick, text AA:`, await Q(o, `(() => { ${lum} const c = document.querySelector('family-hub-card').shadowRoot, on = c.querySelector(".looks .tcard[aria-pressed='true']"), off = c.querySelector(".looks .tcard[aria-pressed='false']"), cs = getComputedStyle(on), sheet = getComputedStyle(c.querySelector('.sheet')).backgroundColor; const bg = /rgba?\\(0, 0, 0, 0\\)/.test(cs.backgroundColor) || cs.backgroundColor === getComputedStyle(off).backgroundColor; return bg && cs.boxShadow !== 'none' && getComputedStyle(on, '::after').content.includes('✓') && CR(getComputedStyle(on.querySelector('.muted')).color, /, 0\\)$/.test(cs.backgroundColor) || /rgba/.test(cs.backgroundColor) ? sheet : cs.backgroundColor) >= 4.5; })()`),
      '| surprise is not a filled hero:', await o.getByRole('button', { name: 'Surprise me' }).count() === 0 || !(await o.getByRole('button', { name: 'Surprise me' }).evaluate((b) => b.classList.contains('primary'))));
    await o.close(); }
  // medication: while a daily medicine is overdue its "Given by" buttons are the filled actions, and "Add to the record" is an outline until a medicine is chosen
  for (const look of ['fridge', 'orbit']) { o = await open(`look=${look}&page=planner&sheet=meds`, '08:10');
    console.log(`looks: ${look} overdue medication: "Given by" filled, "Add to the record" outlined:`, await Q(o, `(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet'), filled = (b) => { const c = getComputedStyle(b); return !/^(rgba\\(0, 0, 0, 0\\)|transparent)$/.test(c.backgroundColor) || c.backgroundImage !== 'none'; }; return [...s.querySelectorAll('[data-act=given]')].every(filled) && !filled(s.querySelector('[data-act=log]')); })()`));
    await o.close(); }
  // Fridge sheets are one paper note with a hair of tilt, and calm mode takes the tilt, the jiggle and the ambient life away
  o = await open('look=fridge&page=planner&sheet=timer');
  const tilt = () => Q(o, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, fh = c.querySelector('.fh'), s = getComputedStyle(c.querySelector('.sheet')), a = c.querySelector('fh-ambient'); return { note: s.backgroundColor === 'rgb(255, 246, 196)', rot: Math.abs(parseFloat(s.rotate) || 0), jig: fh.getAnimations().some((x) => x.animationName === 'fjig'), md: getComputedStyle(fh).getPropertyValue('--m-d').trim(), amb: a ? a.shadowRoot.querySelectorAll('*:not(style)').length : 0 }; })()`);
  let t = await tilt(); console.log('looks: fridge sheet is a note, tilt at most 0.4 deg:', t.note && t.rot > 0 && t.rot <= 0.4); await o.close();
  o = await open('look=fridge&page=planner&sheet=timer&calm=1'); t = await tilt(); console.log('looks: calm mode has no tilt, no jiggle, no sprites, --m-d 0:', t.rot === 0 && !t.jig && t.md === '0' && t.amb === 0); await o.close();
  // Orbit: yellow is on / current / selected, mint is done only
  o = await open('look=orbit&page=home');
  console.log('looks: orbit switch on is yellow:', await Q(o, `(() => { const h = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-home').shadowRoot, t = h.querySelector(".toggle[aria-checked='true']"); return !t || getComputedStyle(t).backgroundColor === 'rgb(255, 224, 138)'; })()`)); await o.close();
  o = await open('look=orbit&page=kid&kid=0');
  console.log('looks: orbit selected child ring and current job are yellow:', await Q(o, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, k = c.querySelector('fh-kid').shadowRoot, now = k.querySelector('.row.now'); return getComputedStyle(c.querySelector(".dock .kidbtn[aria-current='page'] .avatar")).boxShadow.includes('255, 224, 138') && (!now || getComputedStyle(now).boxShadow.includes('255, 224, 138')); })()`)); await o.close();
  // Orbit header: the alert chip shows all of its words
  o = await open('look=orbit&page=planner');
  console.log('looks: orbit alert chip is not cut:', await Q(o, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, cap = c.querySelector('.cap.hot') ?? c.querySelector('.cap'), box = c.querySelector('.capsule').getBoundingClientRect(), b = cap.getBoundingClientRect(); return cap.scrollWidth <= cap.clientWidth + 1 && b.left >= box.left - 1 && b.right <= box.right + 1; })()`)); await o.close();
  // Space: the Family chip and the header buttons are proper dark surfaces
  o = await open('look=glass&theme=space&page=planner');
  console.log('looks: space family chip is AA, every theme has --danger:', await Q(o, `(() => { ${lum} const c = document.querySelector('family-hub-card').shadowRoot, i = c.querySelector('.legend .init'), cs = getComputedStyle(i); return CR(cs.backgroundColor, cs.color) >= 4.5 && getComputedStyle(c.querySelector('.fh')).getPropertyValue('--danger').trim() === '#ff8a7a'; })()`)); await o.close();
  // phone: the dock is a solid bar with labels, the page ends above it, and Orbit stacks the day ring over the list
  const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Australia/Perth', locale: 'en-AU' });
  for (const look of ['fridge', 'orbit']) { const pg = await ph.newPage(); await pg.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await pg.goto(`http://localhost:${PORT}/?look=${look}&page=planner`); await pg.waitForFunction('window.__ready === true'); await pg.waitForTimeout(700);
    console.log(`looks: ${look} phone dock is a solid bar with labels, nothing off the right:`, await Q(pg, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, d = c.querySelector('.dock'), cs = getComputedStyle(d), it = d.querySelector(".item[data-nav='calendar']"), dial = c.querySelector('.ddial'), list = c.querySelector('.daylist'); const solid = !/rgba?\\(0, 0, 0, 0\\)/.test(cs.backgroundColor) && parseFloat(cs.borderTopWidth) >= 1; const label = parseFloat(getComputedStyle(it).fontSize) >= 14 && it.getBoundingClientRect().bottom <= innerHeight + 1 && it.scrollHeight <= it.clientHeight + 1; const stacked = !dial || (dial.getBoundingClientRect().bottom <= list.getBoundingClientRect().top + 1 && [...dial.querySelectorAll('text')].every((x) => parseFloat(getComputedStyle(x).fontSize) * dial.getBoundingClientRect().width / 200 >= 12)); const pad = parseFloat(getComputedStyle(c.querySelector('.fh')).paddingBottom) >= d.getBoundingClientRect().height / (Number(getComputedStyle(c.querySelector('.fh')).zoom) || 1); return solid && label && stacked && pad && document.documentElement.scrollWidth <= innerWidth + 2; })()`));
    await pg.close(); }
  await ph.close(); }

// ---- pages polish: groceries, doodle, home, weather, kid pages, morning board ----
{
const calls = (p) => p.evaluate(() => (window.__calls ?? []).join('\n'));
const toastOf = async (p, host) => (await p.locator(`${host} .toast`).allInnerTexts()).join(' ').replace(/\s+/g, ' ').trim();
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
{ const wall = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU' }); const p = await wall.newPage(); await p.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await p.goto('http://localhost:' + PORT + '/?look=glass&page=kid&kid=2'); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(900);
  await p.getByRole('button', { name: /My stars/ }).click(); await p.waitForTimeout(300);
  const rd = await p.getByRole('button', { name: 'Read my jobs' }).boundingBox(), tabs = await p.locator('fh-kid .tabcard').boundingBox(), feel = await p.locator('fh-kid section[aria-label="How are you feeling"]').boundingBox();
  console.log('Max on the wall: reader', Math.round(rd.width) + ' px, centre y', Math.round(rd.y + rd.height / 2), '(> 540) | feelings card under the stars panel, in the lower half:', feel.y > tabs.y && feel.y > 540, '| reward pictures:', (await p.locator('fh-kid .rw .rpic').allInnerTexts()).join(' '), '| reward stars drawn:', await p.locator('fh-kid .rw .sstar').count());
  await p.getByRole('button', { name: /My look/ }).click(); await p.waitForTimeout(300);
  console.log('My look with a job left: studio open', await p.locator('fh-studio').count(), '| toast (expect none):', JSON.stringify(await toastOf(p, 'fh-kid')), '| button reads:', (await p.locator('fh-kid .studio').innerText()).trim(), '| padlock:', await p.locator('fh-kid .studio[data-locked] svg').count());
  await p.locator('fh-kid .pic.big').click(); await p.waitForTimeout(1200);
  const see = p.getByRole('button', { name: 'See what I did' }), sb2 = await see.boundingBox(), tb = await p.locator('fh-kid .toast').boundingBox().catch(() => null);
  console.log('Max all done: picture', await p.locator('fh-kid .party svg').count() > 0, '| button', Math.round(sb2.height) + ' px high | toast over the button:', !!tb && tb.y < sb2.y + sb2.height && tb.y + tb.height > sb2.y && tb.x < sb2.x + sb2.width && tb.x + tb.width > sb2.x);
  await wall.close(); }
// morning board: since 0.32.0 each card carries its child's current job (one button, "Now"), with no bar, score or count of jobs on a card; the count is said once, pooled
page = await open('look=glass&page=morning', '07:10');
const mb = (await page.locator('fh-morning section, fh-morning .kcol').allInnerTexts()).join(' ').replace(/\s+/g, ' ');
console.log('morning board: a count of jobs or "Next" in a column:', /\d+ (left|to go|of \d+)|Next\b/.test((await page.locator('fh-morning .kcol').allInnerTexts()).join(' ')), '| pooled line:', (/Morning jobs: \d+ to go between us/.exec(mb) ?? ['MISSING'])[0]);
await page.close();
}
// ---- motion (polish round 2) ----
{ const toast2 = async (p, host) => (await p.locator(`${host} .toast`).allInnerTexts()).join(' ').replace(/\s+/g, ' ').trim();
  const deep = `window.deepAll = (sel) => { const out = []; const walk = (r) => { r.querySelectorAll('*').forEach((e) => { if (e.matches(sel)) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return out; };
    window.cssAnims = () => { const out = new Set(); const walk = (r) => { for (const a of r.getAnimations()) out.add(a); r.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return [...out].filter((a) => a.playState === 'running' && a.animationName && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.animationName); };`;
  // press feedback: a held header button (a .glass.tap) shrinks and dims in Glass and Fridge
  for (const look of ['glass', 'fridge']) { const p = await open(`look=${look}&page=planner`); const b = p.locator('family-hub-card header [data-act="more"]'), bb = await b.boundingBox();
    const idle = await b.evaluate((e) => getComputedStyle(e).transform + ' ' + getComputedStyle(e).opacity);
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(300);
    const held = await b.evaluate((e) => { const cs = getComputedStyle(e), m = /matrix\(([^,]+)/.exec(cs.transform); return { scale: m ? Number(m[1]) : 1, opacity: Number(cs.opacity) }; });
    await p.mouse.move(2, 2); await p.mouse.up(); // let go off the button: nothing is pressed
    console.log(`press feedback (${look}): idle ${idle} | held 300 ms: scale ${held.scale.toFixed(3)} opacity ${held.opacity.toFixed(2)} (expect < 1 and < 1)`); await p.close(); }
  // page change: at most two animations per navigation (the page wrapper's fade and rise), none on the panels inside
  for (const look of ['glass', 'fridge', 'orbit']) { const p = await open(`look=${look}&page=planner`); await p.evaluate(deep); const out = [];
    for (const nav of ['Groceries', 'Music', 'Home', 'Planner', 'Riley']) { await p.evaluate((n) => deepAll('nav button').find((x) => x.textContent.trim() === n).click(), nav); await p.waitForTimeout(40); const a = await p.evaluate(() => cssAnims()); out.push(`${nav} ${a.length}${a.length > 2 ? ' [' + a.join(',') + ']' : ''}`); await p.waitForTimeout(700); }
    console.log(`animations per navigation (${look}; expect the page’s two, plus since 0.32.1 the one movement of the dock button whose page opened: Music’s has two parts):`, out.join(' | '), '| page wrapper at rest: transform', await p.locator('family-hub-card .fh > .body').evaluate((e) => getComputedStyle(e).transform)); await p.close(); }
  // exits: a sheet, the PIN pad, a toast and the night screen fade out before they go
  { const p = await open('look=glass&page=planner&sheet=timer'); await p.evaluate(deep); const at = async (sel, ms) => { await p.waitForTimeout(ms); return p.locator(sel).count(); };
    // timed inside the page, so the test's own round trips do not blur the 80 ms and 300 ms marks
    const timed = (act, sel) => p.evaluate(([act, sel]) => new Promise((done) => { const n = () => deepAll(sel).length, t0 = performance.now(); (0, eval)(act); const r = {};
      setTimeout(() => { r.at80 = n(); r.closing = deepAll(sel).filter((e) => e.hasAttribute('data-closing')).length; }, 80); setTimeout(() => { r.at300 = n(); r.ms = Math.round(performance.now() - t0); done(r); }, 300); }), [act, sel]);
    let r = await timed(`deepAll('.sheet .xbtn')[0].click()`, '.scrim'); console.log('sheet exit: there at 80 ms', r.at80, 'closing', r.closing, '| gone at 300 ms', r.at300 === 0);
    await MORE(p); await p.locator('family-hub-card .sheet [data-act="looks"]').click(); await p.waitForTimeout(400); const pad = await p.locator('fh-pin').count();
    r = await timed(`deepAll('fh-pin')[0].shadowRoot.querySelector('.grid button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }))`, 'fh-pin'); console.log('PIN pad exit: open', pad, '| there at 80 ms', r.at80, 'closing', r.closing, '| gone at 300 ms', r.at300 === 0);
    await p.evaluate(() => document.querySelector('family-hub-card')._say('Test line')); await p.waitForTimeout(300);
    r = await timed(`(() => { const c = document.querySelector('family-hub-card'); c._toast = ''; })()`, '.toasts .toast'); console.log('toast exit: there at 80 ms', r.at80, 'closing', r.closing, '| gone at 300 ms', r.at300 === 0);
    await MORE(p); await p.locator('family-hub-card .sheet [data-act="night"]').click(); await p.waitForTimeout(600); await p.evaluate(deep); await p.locator('family-hub-card .night').click();
    await p.waitForTimeout(60); const started = await p.evaluate(() => cssAnims()); const n80 = await p.locator('family-hub-card .night[data-closing]').count(), n600 = await at('family-hub-card .night', 560);
    console.log('night wake: black layer fading at 60 ms', n80, '| animations started:', started.join(',') || 'none', '(expect fhout only) | gone at 620 ms', n600 === 0); await p.close(); }
  // calm mode: nothing travels on a page change, and looks' loops are stopped
  { const p = await open('look=fridge&page=planner&calm=1'); await p.evaluate(deep);
    await p.evaluate(() => deepAll('nav button').find((x) => x.textContent.trim() === 'Groceries').click()); await p.waitForTimeout(40);
    const tf = await p.locator('family-hub-card .fh > .body').evaluate((e) => getComputedStyle(e).transform);
    console.log('calm page change: wrapper transform mid-entrance', tf, '(expect none or identity) | looping animations:', await p.evaluate(() => { const out = new Set(); const walk = (r) => { for (const a of r.getAnimations()) out.add(a); r.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return [...out].filter((a) => a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity).length; })); await p.close(); }
  // slow and failing calls: the control shows it is waiting after 250 ms, holds what was asked, and a failure puts it back with a calm line
  { let p = await open('look=glass&page=groceries&slow=3000'); await p.evaluate(deep); const name = (await p.locator('fh-groceries .row .strike').first().innerText()).trim();
    const g = await p.evaluate(() => new Promise((done) => { const row = deepAll('.row[data-key]')[0], r = {}; row.click();
      setTimeout(() => { r.at120 = deepAll('.row[data-key][data-busy]').length; }, 120); setTimeout(() => { r.at520 = deepAll('.row[data-key][data-busy]').length; r.aria = deepAll('.row[data-key][aria-busy="true"]').length; r.ticked = deepAll('.row[data-key].done[data-busy]').length; }, 520); setTimeout(() => { r.after = deepAll('.row[data-key][data-busy]').length; done(r); }, 3400); }));
    console.log('slow grocery tick: busy at 120 ms', g.at120, '(expect 0) | busy at 520 ms', g.at520, 'aria-busy', g.aria, '| still ticked while waiting', g.ticked, '| busy after the answer', g.after, '|', name);
    await p.close();
    p = await open('look=glass&page=groceries&slow=500&fail=1'); const r2 = p.locator('fh-groceries .row').first(), n2 = (await r2.locator('.strike').innerText()).trim();
    await r2.click(); await p.waitForTimeout(200); const held = await p.locator('fh-groceries .row.done').filter({ hasText: n2 }).count(); await p.waitForTimeout(700);
    const said = await toast2(p, 'fh-groceries'); console.log('fail=1 grocery tick: held while out', held, '| put back', await p.locator('fh-groceries .row.done').filter({ hasText: n2 }).count() === 0, '| says:', said, '| raw error shown:', /did not answer|Error/.test(said));
    await p.close();
    p = await open('look=glass&page=planner&slow=5000'); await p.evaluate(deep);
    const rm = await p.evaluate(() => new Promise((done) => { const r = {}; deepAll('button.rem')[0].click(); const n = (s) => deepAll('button' + s).length;
      setTimeout(() => { r.busy = n('.rem[data-busy]'); }, 500); setTimeout(() => { r.held = n('.rem.done'); }, 4500); setTimeout(() => { r.gone = n('.rem.done') === 0; done(r); }, 5600); }));
    console.log('slow reminder (5 s): busy at 500 ms', rm.busy, '| still struck through at 4.5 s, past its four seconds, because the answer is not in', rm.held, '| gone once it is', rm.gone);
    await p.locator('family-hub-card nav [data-nav="lights-off"]').click(); await p.waitForTimeout(500); console.log('slow "All off": dock button busy', await p.locator('family-hub-card nav [data-nav="lights-off"][data-busy]').count());
    await p.close();
    p = await open('look=glass&page=planner&slow=400&fail=1'); await p.locator('family-hub-card .rem').first().click(); await p.waitForTimeout(900);
    const ts = (await p.locator('family-hub-card .toast').innerText().catch(() => '')).trim(); console.log('fail=1 reminder: put back', await p.locator('family-hub-card .rem.done').count() === 0, '| says:', ts, '| raw error shown:', /did not answer|Error/.test(ts));
    await p.locator('family-hub-card .tmr .quick, family-hub-card .tmr button').filter({ hasText: '+5' }).first().click(); await p.waitForTimeout(900); const tt = (await p.locator('family-hub-card .toast').innerText().catch(() => '')).trim(); console.log('fail=1 timer +5: says:', tt, '| raw error shown:', /did not answer|Error/.test(tt));
    await p.close();
    p = await open('look=glass&page=home&slow=3000'); const sw = p.locator('fh-home .dev[role="switch"]').first(), was = await sw.getAttribute('aria-checked'); await sw.click(); await p.waitForTimeout(500);
    console.log('slow Home switch: flips at once', (await sw.getAttribute('aria-checked')) !== was, '| busy at 500 ms', (await sw.getAttribute('data-busy')) !== null); await p.waitForTimeout(3000); console.log('  after the answer: stays flipped', (await sw.getAttribute('aria-checked')) !== was, '| busy', (await sw.getAttribute('data-busy')) !== null);
    await p.close();
    p = await open('look=glass&page=home&slow=400&fail=1'); const sw2 = p.locator('fh-home .dev[role="switch"]').first(), was2 = await sw2.getAttribute('aria-checked'); await sw2.click(); await p.waitForTimeout(150); const flipped = (await sw2.getAttribute('aria-checked')) !== was2; await p.waitForTimeout(700);
    console.log('fail=1 Home switch: flipped while out', flipped, '| put back', (await sw2.getAttribute('aria-checked')) === was2); await p.close(); }
}
// ---- a child asks for a chat: a chip for the grown-ups on the shared pages (polish round 2) ----
{ const p = await open('look=glass&page=kid&kid=0');
  await p.locator('fh-kid').getByRole('button', { name: 'sad' }).click(); await p.waitForTimeout(200); await p.getByRole('button', { name: /Chat later/ }).click(); await p.waitForTimeout(400);
  const chip = p.locator('family-hub-card .capsule [data-kind="chat"]'), onKid = await chip.count();
  await HOME(p); await p.locator('family-hub-card nav .kidbtn').nth(1).click(); await p.waitForTimeout(400); const onOther = await chip.count();
  await HOME(p); await p.getByRole('button', { name: 'Planner' }).click(); await p.waitForTimeout(500);
  const label = await chip.getAttribute('aria-label').catch(() => 'MISSING'), h = (await chip.boundingBox().catch(() => null))?.height;
  await HOME(p); await p.getByRole('button', { name: 'Groceries' }).click(); await p.waitForTimeout(400); const kept = await chip.count();
  await chip.click(); await p.waitForTimeout(300);
  console.log('chat chip: on his own page', onKid, '| on a brother’s page', onOther, '(expect 0 0) | on the planner:', label, '| height', Math.round(h ?? 0), '| still there on Groceries', kept, '| after a tap', await chip.count());
  await p.close();
  // the studio: the goal heart is a button of its own (not inside the tile), and the tabs say which is chosen
  const s = await open('look=glass&page=kid&kid=1&studio=1'); const heart = s.locator('fh-studio button.heart').first(), hb = await heart.boundingBox();
  const nested = await s.locator('fh-studio .tile .heart').count(), name0 = await heart.getAttribute('aria-label'); await heart.focus(); await s.keyboard.press('Enter'); await s.waitForTimeout(300);
  console.log('studio heart: a button', await s.locator('fh-studio button.heart').count() > 0, '| inside a tile', nested, '(expect 0) | size', Math.round(hb.width) + 'x' + Math.round(hb.height), '| name:', name0, '→', await heart.getAttribute('aria-label'), '| pressed', await heart.getAttribute('aria-pressed'),
    '| tabs selected:', await s.locator('fh-studio [role=tab][aria-selected="true"]').count(), 'of', await s.locator('fh-studio [role=tab]').count(), '| swatch', await s.locator('fh-studio .sw button').first().evaluate((e) => e.offsetWidth + 'x' + e.offsetHeight).catch(() => 'none on this tab'));
  await s.close();
  const k = await open('look=glass&page=kid&kid=2'); console.log('My look icons (expect 1 drawn, no emoji):', await k.locator('fh-kid .studio svg').count(), '|', (await k.locator('fh-kid .studio').innerText()).trim()); await k.close(); }
// ---- the timer's digits roll and its ring sweeps when time is added; a ticked grocery row travels to the trolley (polish round 2) ----
{ const lib = `window.deepAll = (sel) => { const out = []; const walk = (r) => { r.querySelectorAll('*').forEach((e) => { if (e.matches(sel)) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return out; };`;
  let p = await open('look=glass&page=planner'); await p.evaluate(lib);
  const t = await p.evaluate(() => new Promise((res) => { const ring = () => deepAll('.timerrow *').filter((c) => /dasharray/.test(c.getAttribute('style') || '')).map((c) => getComputedStyle(c).transitionDuration)[0]; const idle = ring(); deepAll('.tmr button').find((x) => /\+5/.test(x.textContent)).click();
    setTimeout(() => { const d = deepAll('.troll')[0], a = d?.getAnimations()[0]; res({ idle, ring: ring(), roll: a ? a.effect.getComputedTiming().duration + ' ms from ' + a.effect.getKeyframes()[0].transform : 'none' }); }, 120); }));
  console.log('timer +5: digits roll', t.roll, '| ring sweep', t.idle, '→', t.ring); await p.close();
  p = await open('look=glass&page=groceries'); await p.evaluate(lib);
  const g = await p.evaluate(() => new Promise((res) => { const row = deepAll('.row[data-key]')[0], key = row.dataset.key, y0 = Math.round(row.getBoundingClientRect().top); row.click(); let seen = 'none';
    const iv = setInterval(() => { const e = deepAll('.row[data-key]').find((x) => x.dataset.key === key), a = e?.getAnimations().find((x) => !x.animationName && !x.transitionProperty); if (a) seen = a.effect.getComputedTiming().duration + ' ms from ' + a.effect.getKeyframes()[0].transform; }, 20);
    setTimeout(() => { clearInterval(iv); res({ y0, seen, y1: Math.round(deepAll('.row[data-key]').find((x) => x.dataset.key === key).getBoundingClientRect().top) }); }, 4700); }));
  console.log('ticked grocery row: from y', g.y0, 'to', g.y1, '| travels:', g.seen); await p.close(); }

// robustness: a reward tapped three times spends once; a medicine with no time gives a readable error, not a blank panel; one odd calendar row does not lose the calendar; a phone on its side gets the phone arrangement
page = await open('look=glass&page=kid&kid=0');
await page.getByRole('button', { name: /Extra screen time/ }).click(); await page.waitForTimeout(250);
{ const yes = page.locator('fh-kid').getByRole('button', { name: 'Yes' }); await yes.evaluate((b) => { b.click(); b.click(); b.click(); }); await page.waitForTimeout(600);
  console.log('reward tapped three times: spends', await page.evaluate(() => (window.__calls || []).filter((c) => c.includes('fh_add_points') && c.includes('-50')).length), '(expect 1)'); }
console.log('medicine with no time:', await page.evaluate(() => { const c = document.querySelector('family-hub-card'); try { c.setConfig({ ...c._config, meds: [{ id: 'x', who: 'Riley', label: 'x' }] }); return 'ACCEPTED'; } catch (e) { return String(e.message); } }));
console.log('odd calendar row:', await page.evaluate(async () => { const c = document.querySelector('family-hub-card'), real = c.hass.callApi; c.hass.callApi = async (m, p, b) => { const r = await real(m, p, b); return /calendars\/calendar.family/.test(p) ? [{ summary: 'No end', start: { dateTime: new Date().toISOString() } }, { summary: 'No start' }, ...r] : r; }; const a = new Date(); a.setHours(0, 0, 0, 0); const ev = await c._loadEvents(a, new Date(a.getTime() + 7 * 864e5)); c.hass.callApi = real; return ev.filter((e) => e.who === 'Family').map((e) => e.title).join(', '); }));
await page.close();
page = await open('look=glass'); await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(500);
console.log('phone on its side: phone arrangement', await page.evaluate(() => document.querySelector('family-hub-card').hasAttribute('data-phone')), '| scale', await page.evaluate(() => getComputedStyle(document.querySelector('family-hub-card').shadowRoot.querySelector('.fh')).zoom));
await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(400); console.log('back to a wide screen: view', await page.evaluate(() => document.querySelector('family-hub-card')._view));
await page.close();
// ---- round 3 ----
{ const calls = (p) => p.evaluate(() => (window.__calls ?? []).join('\n'));
const toastOf = async (p, host) => (await p.locator(`${host} .toast`).allInnerTexts()).join(' ').replace(/\s+/g, ' ').trim();
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
// R2. add event: "where" is kept and shown; a save that fails after the sheet is closed is said by the card; a save that hangs times out
page = await open('look=glass&page=planner&sheet=add');
{ const A = (s) => page.locator('fh-add-event ' + s);
  await A('input[aria-label="What’s on"]').fill('Swim meet'); await A('input[aria-label="Where"]').fill('Sample pool, 3 Example Road'); await page.waitForTimeout(200);
  console.log('R2a summary line:', (await A('.sum').first().innerText()).trim());
  await A('input[aria-label="What’s on"]').focus(); await A('button.lead').click(); await page.waitForTimeout(700);
  console.log('R2a toast:', await toastOf(page, 'family-hub-card'));
  await page.locator('family-hub-card .seg button', { hasText: 'Day' }).click(); await page.waitForTimeout(600);
  console.log('R2a day rows with a place:', (await page.locator('family-hub-card .dayrow .loc').allInnerTexts()).map((t) => t.trim()).join(' | '));
  await page.locator('family-hub-card .seg button', { hasText: 'Week' }).click(); await page.waitForTimeout(600);
  console.log('R2a week cards with a place:', await page.locator('family-hub-card .ev .loc').count(), '| none taller than two lines:', await page.locator('family-hub-card .ev .loc').evaluateAll((els) => els.filter((e) => e.offsetParent).every((e) => e.offsetHeight < 38)), '| none cut where its day has room:', await page.locator('family-hub-card .col[data-wrap] .ev .loc .ell').evaluateAll((els) => els.every((e) => e.scrollHeight <= e.clientHeight + 1 || e.offsetHeight > 30))); }
await page.close(); page = await open('look=glass&page=planner&sheet=add&slow=1500&fail=1');
{ const A = (s) => page.locator('fh-add-event ' + s);
  await A('input[aria-label="What’s on"]').fill('Dentist'); await A('button.lead').click(); await A('.xbtn').click(); await page.waitForTimeout(600);
  console.log('R2b sheet closed while saving:', await page.locator('fh-add-event').count() === 0, '| toast yet:', JSON.stringify(await toastOf(page, 'family-hub-card')));
  await page.waitForTimeout(1600); console.log('R2b after the save failed:', await toastOf(page, 'family-hub-card')); }
await page.close(); page = await open('look=glass&page=planner&sheet=add&slow=40000');
{ const A = (s) => page.locator('fh-add-event ' + s);
  await A('input[aria-label="What’s on"]').fill('Dentist'); await A('button.lead').click(); await page.waitForTimeout(300);
  const busy = await A('button.lead').isDisabled(); await page.clock.fastForward(15_500); await page.waitForTimeout(300);
  console.log('R2c hanging save: Add off while waiting', busy, '| after 15 s:', (await A('.err').innerText()).trim(), '| Add back on:', !(await A('button.lead').isDisabled())); }
await page.close();
// R3. undo where a tap cannot be taken back: a reminder, "Given by", and All on
page = await open('look=glass&page=planner');
{ const rems = () => page.locator('family-hub-card button.rem').count(), tb = page.locator('family-hub-card .toast button', { hasText: 'Undo' });
  const n0 = await rems(); await page.locator('family-hub-card button.rem').first().click(); await page.waitForTimeout(400);
  console.log('R3a reminder ticked: toast', JSON.stringify(await toastOf(page, 'family-hub-card')), '| Undo button:', await tb.count());
  await page.clock.fastForward(4300); await page.waitForTimeout(500);
  console.log('R3a after 4 s the row has left:', await rems() === n0 - 1, '| Undo still offered:', await tb.count());
  await tb.click(); await page.waitForTimeout(600);
  console.log('R3a after Undo: rows', await rems(), 'of', n0, '| put back in the list:', /update_item[^\n]*needs_action/.test(await calls(page)), '|', await toastOf(page, 'family-hub-card'));
  await page.locator('family-hub-card button.rem').first().click(); await page.waitForTimeout(300); await page.clock.fastForward(8300); await page.waitForTimeout(400);
  console.log('R3a Undo gone after 8 s:', await tb.count() === 0); }
await page.close(); page = await open('look=glass&sheet=meds', '08:10');
{ const st = () => page.evaluate(() => { const s = document.querySelector('family-hub-card').hass.states; return [s['input_datetime.fh_med_riley_am'].attributes.timestamp, s['input_text.fh_med_riley_am_by'].state].join(' '); }), was = await st();
  const hero = await page.locator('family-hub-card .sheet [data-act=given]').first().evaluate((b) => getComputedStyle(b).backgroundColor + getComputedStyle(b).backgroundImage), log = page.locator('family-hub-card .sheet [data-act=log]');
  const filled = (c) => !/^(rgba\(0, 0, 0, 0\)|transparent)none$/.test(c);
  console.log('R13 overdue medicine: "Given by" filled', filled(hero), '| "Add to the record" filled before a medicine is chosen:', filled(await log.evaluate((b) => getComputedStyle(b).backgroundColor + getComputedStyle(b).backgroundImage)));
  await page.locator('family-hub-card .sheet .mchip', { hasText: 'Paracetamol' }).click(); await page.waitForTimeout(700);
  console.log('R13 after choosing a medicine: "Add to the record" filled', filled(await log.evaluate((b) => getComputedStyle(b).backgroundColor + getComputedStyle(b).backgroundImage)));
  await page.getByRole('button', { name: 'Given by Alex' }).first().click(); await page.waitForTimeout(300); for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500);
  const tb = page.locator('family-hub-card .toast button', { hasText: 'Undo' });
  console.log('R3b given: toast', JSON.stringify(await toastOf(page, 'family-hub-card')), '| Undo:', await tb.count(), '| helpers changed:', (await st()) !== was);
  await page.clock.fastForward(6000); await page.waitForTimeout(200); console.log('R3b Undo still there after 6 s:', await tb.count());
  await tb.click(); await page.waitForTimeout(600);
  console.log('R3b after Undo: helpers back to before', (await st()) === was, '| no second PIN in the same session:', await page.locator('family-hub-card fh-pin').count() === 0, '| row:', (await page.locator('family-hub-card .sheet .med2 .card').first().innerText()).replace(/\s+/g, ' ').slice(0, 60), '|', await toastOf(page, 'family-hub-card'));
  await page.getByRole('button', { name: 'Given by Alex' }).first().click(); await page.waitForTimeout(500); await page.locator('family-hub-card .sheet').press('Escape'); await page.waitForTimeout(400);
  await tb.click(); await page.waitForTimeout(400); console.log('R3b Undo after the sheet is closed asks for the PIN:', await page.locator('family-hub-card fh-pin').count()); }
await page.close(); page = await open('look=glass&page=home');
{ const lit = () => page.evaluate(() => Object.values(document.querySelector('family-hub-card').hass.states).filter((s) => s.entity_id.startsWith('light.') && s.state === 'on').map((s) => s.entity_id).sort().join(',')), on0 = await lit();
  const allOn = page.locator('family-hub-card .dock [data-nav=lights-on]'), tb = page.locator('family-hub-card .toast button', { hasText: 'Undo' });
  await allOn.click(); await page.waitForTimeout(600); const on1 = await lit();
  console.log('R3c All on: lights on', on0.split(',').filter(Boolean).length, '->', on1.split(',').length, '| Undo:', await tb.count());
  await tb.click(); await page.waitForTimeout(600); const on2 = await lit();
  console.log('R3c Undo turns off only what it turned on:', on2 === on0, '| turn_off named:', ((await calls(page)).split('\n').filter((c) => /light\.turn_off/.test(c)).pop() || '').slice(0, 110)); }
await page.close(); page = await open('look=glass&page=home&slow=1200');
{ await page.evaluate(() => { window.__calls = []; }); const allOn = page.locator('family-hub-card .dock [data-nav=lights-on]'), allOff = page.locator('family-hub-card .dock [data-nav=lights-off]');
  await allOn.click(); await page.waitForTimeout(100); await allOn.click(); await allOff.click(); await page.waitForTimeout(1800);
  console.log('R3c three taps while in flight: calls sent', (await calls(page)).split('\n').filter((c) => /^light\./.test(c)).length); }
await page.close(); page = await open('look=glass&page=home', '19:45');
{ await page.evaluate(() => { window.__calls = []; }); await page.locator('family-hub-card .dock [data-nav=lights-on]').click(); await page.waitForTimeout(400);
  console.log('R3c All on after a bedtime: PIN pad', await page.locator('family-hub-card > fh-pin, family-hub-card fh-pin').count(), (await page.locator('family-hub-card fh-pin h2').first().innerText()).trim(), '| called before the PIN:', /light\.turn_on/.test(await calls(page)));
  for (const d of '1234') await page.locator('family-hub-card fh-pin').first().getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(600);
  console.log('R3c after the PIN:', /light\.turn_on/.test(await calls(page)), '|', await toastOf(page, 'family-hub-card')); }
await page.close();
// R4. rewards: after Yes the row keeps its place and a second tap in the list does nothing for 600 ms; a spend that needs a grown-up leaves a line
page = await open('look=glass&page=kid&kid=0');
{ const K = (s) => page.locator('fh-kid ' + s), spends = async () => ((await calls(page)).match(/fh_add_points[^\n]*"points":-/g) || []).length;
  await page.getByRole('button', { name: /Extra screen time/ }).click(); await page.waitForTimeout(300);
  const ask = await K('.rw.ask').boundingBox(), next = await K('.rw').nth(1).boundingBox();
  await K('.rw.ask').getByRole('button', { name: 'Yes' }).click(); await page.mouse.click(next.x + next.width / 2, next.y + next.height / 2); await page.waitForTimeout(150);
  const after = await K('.rw').first().boundingBox(), n1 = await K('.rw').nth(1).boundingBox();
  console.log('R4 straight after Yes: row keeps its height', Math.round(after.height) === Math.round(ask.height), '| next row has not moved:', Math.round(n1.y) === Math.round(next.y), '| second tap opened another ask or PIN:', (await K('.rw.ask:not([data-held])').count()) + (await page.locator('fh-kid fh-pin, family-hub-card > fh-pin').count()), '| spends:', await spends());
  await page.waitForTimeout(1900); console.log('R4 after 600 ms the row is back to one line:', Math.round((await K('.rw').first().boundingBox()).height) < Math.round(ask.height), '| waiting line for a small reward:', await K('.owedline').count());
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'), h = c.hass, id = Object.keys(h.states).find((k) => /riley.*points$/.test(k) && !/life|total/.test(k)); c.hass = { ...h, states: { ...h.states, [id]: { ...h.states[id], state: '300' } } }; }); await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Pick the family movie/ }).click(); await page.waitForTimeout(300); for (const d of '1234') await page.locator('fh-pin').first().getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(700);
  console.log('R4 a reward that needs a grown-up:', (await K('.owedline').innerText().catch(() => 'NO LINE')).replace(/\s+/g, ' ').trim()); }
await page.close();
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
  await H.getByRole('button', { name: /Grown-ups/ }).click(); await page.waitForTimeout(300); console.log('R5 automations inside the window: PIN asked', await pad(), '| list open:', await H.getByRole('button', { name: 'Hide' }).count());
  await page.clock.fastForward(20_000); await page.waitForTimeout(1200); const t1 = (await H.locator('.unl b').innerText()).trim();
  await H.locator('.unl').getByRole('button', { name: 'Lock now' }).click(); await page.waitForTimeout(300);
  console.log('R5 countdown after 20 s:', t1, '| Lock now: chip gone', await H.locator('.unl').count() === 0);
  await H.getByRole('button', { name: /Garage door/ }).click(); await page.waitForTimeout(300); console.log('R5 after Lock now the garage asks again:', await pad()); }
await page.close();
// R6. planner week: nothing is hidden while it would fit, and "+N more" is a pill directly under the last event shown
for (const q of ['look=glass&page=planner&events=long', 'look=orbit&page=planner&events=long', 'look=fridge&page=planner&events=many', 'look=glass&page=planner&events=many']) { page = await open(q);
  console.log('R6', q.replace(/look=|&page=planner&events=/g, ' ').trim() + ':', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot; return [...r.querySelectorAll('.week > .col')].map((c) => { const evs = [...c.querySelectorAll('.ev')], shown = evs.filter((e) => e.style.display !== 'none'), hid = evs.filter((e) => e.style.display === 'none'), pill = c.querySelector('.more .mpill'); if (!hid.length) return null;
    const top = (e) => { let t = 0; for (let x = e; x && x !== c; x = x.offsetParent) t += x.offsetTop; return t; }, bot = (e) => top(e) + e.offsetHeight, bottom = c.clientHeight - parseFloat(getComputedStyle(c).paddingBottom), last = shown.length ? shown[shown.length - 1] : null, free = bottom - bot(pill), smallest = Math.min(...hid.map((e) => { e.style.display = ''; const h = e.offsetHeight; e.style.display = 'none'; return h; }));
    return `${shown.length} shown, ${pill.textContent.trim()} (${parseFloat(getComputedStyle(pill).fontSize)} px), pill ${last ? Math.round(top(pill) - bot(last)) : 0} px under the last event, a hidden event would fit: ${smallest + 6 <= free}`; }).filter(Boolean).join(' ; ') || 'nothing hidden'; }));
  await page.close(); }
// R11. Music: Whole house shows that it is joined; a volume jump of more than 30 in one drag can be taken back
page = await open('look=glass&page=music&mview=dial');
{ const M = page.locator('fh-music'), wh = M.locator('.wholeb');
  console.log('R11 tab words beside the icons at 1280x800 (Dial; while the hint shows they give way to it):', await M.locator('.tabs.inline[data-words] button span').evaluateAll((els) => els.filter((e) => e.offsetWidth > 0).map((e) => e.textContent).join(', ')), '| row overflows:', await M.locator('.mhead').evaluate((h) => h.scrollWidth > h.clientWidth + 1));
  // R4-5: while the hint shows it is never cut (the tab words give way first); the words come back when it goes
  console.log('R4-5 hint cut while showing (expect false):', await M.locator('.hint[data-on]').evaluateAll((els) => els.some((h) => h.scrollHeight > h.clientHeight + 1)));
  await page.waitForTimeout(4600);
  console.log('R4-5 tab words once the hint has gone:', await M.locator('.tabs.inline[data-words] button span').evaluateAll((els) => els.filter((e) => e.offsetWidth > 0).map((e) => e.textContent).join(', ')));
  const before = await wh.getAttribute('aria-pressed'); await wh.click(); await page.waitForTimeout(900);
  console.log('R11 Whole house: pressed before', before, '| after joining', await wh.getAttribute('aria-pressed'), '|', (await toastOf(page, 'fh-music')).slice(0, 40));
  const r = await page.evaluate(async () => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music'), id = 'media_player.office', v0 = Math.round(m.hass.states[id].attributes.volume_level * 100);
    m._setVol(id, v0 + 10, false); m._setVol(id, v0 + 45, false); m._setVol(id, v0 + 45, true); await new Promise((r) => setTimeout(r, 500)); const btn = m.shadowRoot.querySelector('.toast button'), label = btn?.textContent.trim(); btn?.click(); await new Promise((r) => setTimeout(r, 500));
    return { v0, label, back: Math.round(m.hass.states[id].attributes.volume_level * 100) }; });
  console.log('R11 volume dragged from', r.v0, 'to', r.v0 + 45, ': toast offers', JSON.stringify(r.label), '| after tapping it:', r.back); }
await page.close();
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
// R16. Ask: the AI note is under the subtitle and in view; the keyboard has punctuation and digits; the three options share a row
for (const [w, h] of [[1280, 800], [1312, 668]]) { page = await open('look=glass&page=planner&sheet=chat'); await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
  // measured before the keys open: on a short screen (under 720 px high) the two lines of introduction step aside while the keys are up (round 7)
  const n = await page.locator('family-hub-card .ainote').boundingBox(), sub = await page.locator('family-hub-card .chatsheet .shead .muted').boundingBox();
  await page.locator('fh-chat input.field').click(); await page.waitForTimeout(300);
  const tops = await page.locator('fh-chat .opts .pill').evaluateAll((els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top)))].length);
  for (const k of ['Question mark', 'Full stop']) await page.locator('fh-chat .keys').getByRole('button', { name: k }).click(); await page.locator('fh-chat .keys .key', { hasText: /^7$/ }).click();
  console.log(`R16 ${w}x${h}: note`, parseFloat(await page.locator('family-hub-card .ainote').evaluate((e) => getComputedStyle(e).fontSize)), 'px,', Math.round(n.y - (sub.y + sub.height)), 'px under the subtitle, in view:', n.y + n.height <= h, '| option rows:', tops, '| typed with the keys:', JSON.stringify(await page.locator('fh-chat input.field').inputValue()));
  await page.setViewportSize({ width: 1280, height: 800 }); await page.close(); }
// R17. small things: the PIN pad does not open over a sheet that did not ask; a stale timer is over; the weather chip has words
page = await open('look=glass&page=planner&sheet=timer', '19:45');
{ await page.evaluate(() => document.querySelector('family-hub-card')._allOn()); await page.waitForTimeout(400); // the dock is under the scrim; a toast's Undo is the way a PIN could be asked for over a sheet
  console.log('R17 a PIN asked for while the timer sheet is open: PIN pad', await page.locator('family-hub-card fh-pin').count(), '| says:', await toastOf(page, 'family-hub-card'));
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'), h = c.hass; c.hass = { ...h, states: { ...h.states, 'timer.kitchen': { ...h.states['timer.kitchen'], state: 'active', attributes: { ...h.states['timer.kitchen'].attributes, finishes_at: new Date(Date.now() - 90_000).toISOString() } }, 'weather.home': { ...h.states['weather.home'], state: 'unavailable' } } }; }); await page.waitForTimeout(500);
  console.log('R17 timer that finished 90 s ago: treated as running', await page.evaluate(() => document.querySelector('family-hub-card')._timerLeft() !== null), '| weather chip:', (await page.locator('family-hub-card header .wsub').innerText().catch(() => '(chip hidden)')).trim()); }
await page.close();
}

// ---- round 4 ----
const openAt = async (w, h, qs, time = '16:20') => { const c = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU' }); const p = await c.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await p.goto('http://localhost:' + PORT + '/?' + qs); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(900); return p; };
const ok = (b) => (b ? 'ok' : 'FAIL');
// R4-1. the card is never scaled below 1: tablets reflow instead (and the dock stays on the screen)
for (const [w, h] of [[1024, 768], [1180, 820], [800, 600], [768, 1024], [820, 1180]]) for (const look of ['glass', 'fridge', 'orbit']) {
  const p = await openAt(w, h, `look=${look}&page=planner`);
  const r = await p.evaluate(() => { const c = document.querySelector('family-hub-card'), fh = c.shadowRoot.querySelector('.fh'), d = c.shadowRoot.querySelector('nav.dock').getBoundingClientRect(); const items = [...c.shadowRoot.querySelectorAll('nav.dock .item')].map((e) => e.getBoundingClientRect());
    return { z: Number(getComputedStyle(fh).zoom), dock: d.left >= -1 && d.right <= innerWidth + 1 && d.bottom <= innerHeight + 1, small: items.filter((b) => Math.min(b.width, b.height) < 43.5).length, cols: c.shadowRoot.querySelectorAll('.week .col').length, sideways: document.documentElement.scrollWidth > innerWidth + 1 }; });
  console.log(`R4-1 ${look} ${w}x${h}: zoom ${r.z} (expect >= 1) ${ok(r.z >= 1)} | dock on screen ${ok(r.dock)} | dock items under 44: ${r.small} ${ok(!r.small)} | week days shown: ${r.cols} | sideways scroll ${ok(!r.sideways)}`);
  await p.context().close();
}
// R4-2 and R4-3. events open a read-only sheet; overnight and multi-day events read honestly on their later days
{ const p = await openAt(1280, 800, 'look=glass&page=planner');
  const inject = () => p.evaluate(async () => { const c = document.querySelector('family-hub-card'), h = c.hass, api = h.callApi;
    c.hass = { ...h, callApi: async (m, path, body) => { const r = await api(m, path, body); if (!/^calendars\/calendar\.family/.test(path)) return r;
      return [...r, { summary: 'Night shift', description: 'Bring <b>ID</b><br>Gate 3 &amp; sign in', location: 'Depot', start: { dateTime: '2026-11-10T22:00:00+08:00' }, end: { dateTime: '2026-11-11T06:00:00+08:00' } },
        { summary: 'School camp', start: { dateTime: '2026-11-11T10:00:00+08:00' }, end: { dateTime: '2026-11-13T15:00:00+08:00' } }, { summary: 'Grandma visits', start: { date: '2026-11-12' }, end: { date: '2026-11-15' } },
        { summary: 'Road works', start: { dateTime: '2026-11-09T22:00:00+08:00' }, end: { dateTime: '2026-11-10T06:00:00+08:00' } }]; } };
    c._fetchedKey = ''; c._refresh(); await c._loadSoon(); await new Promise((r) => setTimeout(r, 300)); });
  await inject(); await p.waitForTimeout(500);
  const week = (day) => p.evaluate((day) => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll(`.evs[data-day="${day}"] .ev`)].map((e) => `${e.querySelector('.t')?.textContent.trim().replace(/ /g, ' ')}|${e.querySelector('.n')?.textContent.trim() ?? ''}`), day);
  const tue = await week('2026-11-10'), wed = await week('2026-11-11'), thu = await week('2026-11-12'), fri = await week('2026-11-13');
  console.log('R4-3 week Tue has "10:00 pm|Night shift":', ok(tue.includes('10:00 pm|Night shift')), '| Tue "until 6:00 am|Road works" first:', ok(tue[0] === 'until 6:00 am|Road works'));
  console.log('R4-3 week Wed:', wed.join(' ; '), '| "until 6:00 am|Night shift" before every start time:', ok(wed.includes('until 6:00 am|Night shift') && wed.findIndex((x) => x.startsWith('until')) < wed.findIndex((x) => /^\d/.test(x)) && !wed.includes('10:00 pm|Night shift')));
  console.log('R4-3 week Thu:', thu.join(' ; '), '| camp "continues", all-day "Day 1 of 3":', ok(thu.includes('continues|School camp') && thu.includes('Day 1 of 3|Grandma visits')), '| Fri "until 3:00 pm" and "Day 2 of 3":', ok(fri.includes('until 3:00 pm|School camp') && fri.includes('Day 2 of 3|Grandma visits')));
  // the event is a button with a full name; it opens a sheet with one action
  const card = p.locator('family-hub-card');
  const ns = card.locator('.evs[data-day="2026-11-10"] button.ev', { hasText: 'Night shift' });
  console.log('R4-2 week card name:', await ns.getAttribute('aria-label'), ok((await ns.getAttribute('aria-label')).replace(/\u00a0/g, ' ') === 'Night shift, Tuesday 10:00 pm, Family, at Depot'));
  await ns.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  const sheet = () => p.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet[data-sheet="event"]'); if (!s) return null; const b = s.getBoundingClientRect();
    return { text: s.innerText.replace(/ /g, ' ').replace(/\s+/g, ' '), buttons: [...s.querySelectorAll('button, a[href], input')].map((x) => x.innerText.trim()), markup: !!s.querySelector('.evnotes *'), notes: s.querySelector('.evnotes')?.textContent ?? '', label: s.getAttribute('aria-label'), inside: b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight }; });
  let sh = await sheet();
  console.log('R4-2 Enter opens the sheet:', ok(!!sh), '| title, day, span, who, place:', ok(!!sh && /Night shift/.test(sh.text) && /Tuesday 10 November/.test(sh.text) && /Tue, 10 Nov 10:00 pm to Wed, 11 Nov 6:00 am/.test(sh.text) && /Family/.test(sh.text) && /Depot/.test(sh.text)), '| notes as plain text:', JSON.stringify(sh?.notes), ok(!!sh && !sh.markup && sh.notes === 'Bring ID\nGate 3 & sign in'), '| one action, "Close":', JSON.stringify(sh?.buttons), ok(!!sh && sh.buttons.length === 1 && sh.buttons[0] === 'Close'), '| dialog name:', sh?.label);
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  console.log('R4-2 Escape closes it and focus returns to the event:', ok((await sheet()) === null && await p.evaluate(() => document.querySelector('family-hub-card').shadowRoot.activeElement?.classList.contains('ev'))));
  await card.locator('.evs[data-day="2026-11-11"] button.ev', { hasText: 'Night shift' }).click(); await p.waitForTimeout(400); sh = await sheet();
  console.log('R4-2 opened from its second day: says Wednesday and "until 6:00 am":', ok(!!sh && /Wednesday 11 November/.test(sh.text) && /until 6:00 am/.test(sh.text)));
  await card.locator('.sheet[data-sheet="event"] button', { hasText: 'Close' }).click(); await p.waitForTimeout(500);
  console.log('R4-2 Close closes it:', ok((await sheet()) === null));
  // the "next up" chip in the header
  const chip = card.locator('header button.cap[data-kind="next"]');
  if (await chip.count() && await chip.isVisible()) { await chip.click(); await p.waitForTimeout(400); sh = await sheet(); console.log('R4-2 header "next up" chip opens its event:', await chip.getAttribute('aria-label'), ok(!!sh)); await p.keyboard.press('Escape'); await p.waitForTimeout(500); }
  else console.log('R4-2 header "next up" chip: not showing in this state (a button when it shows:', await p.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('header .cap[data-kind="next"]')?.tagName ?? 'absent'), ')');
  // day view
  await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c._anchor = new Date(2026, 10, 11); c._view = 'day'; }); await p.waitForTimeout(700);
  const rows = await p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('button.dayrow')].map((e) => `${e.querySelector('.dwhen').textContent.trim().replace(/ /g, ' ')}|${e.querySelector('.content').textContent.trim()}`));
  console.log('R4-3 day view Wed:', rows.join(' ; '), ok(rows[0] === 'until 6:00 am|Night shift' && rows.includes('10:00 am|School camp')));
  await card.locator('button.dayrow', { hasText: 'School camp' }).click(); await p.waitForTimeout(400); sh = await sheet();
  console.log('R4-2 day row opens the sheet with the whole span:', ok(!!sh && /Wed, 11 Nov 10:00 am to Fri, 13 Nov 3:00 pm/.test(sh.text)), '| name:', await card.locator('button.dayrow', { hasText: 'School camp' }).getAttribute('aria-label'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c._anchor = new Date(2026, 10, 12); }); await p.waitForTimeout(700);
  const thuRows = await p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('button.dayrow')].map((e) => `${e.querySelector('.dwhen').textContent.trim()}|${e.querySelector('.content').textContent.trim()}`));
  console.log('R4-3 day view Thu:', thuRows.join(' ; '), ok(thuRows.includes('continues|School camp') && thuRows.includes('Day 1 of 3|Grandma visits')));
  // month view: lines carry the same words, in the same order, and a line opens its event
  await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c._view = 'month'; }); await p.waitForTimeout(900);
  const mon = await p.evaluate(() => { const cell = [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.month .cell')].find((x) => /Wednesday 11 November/.test(x.getAttribute('aria-label'))); return [...cell.querySelectorAll('.mev')].map((e) => e.getAttribute('title').replace(/ /g, ' ')); });
  console.log('R4-3 month Wed first line:', mon[0], ok(/^Night shift, Wednesday until 6:00 am/.test(mon[0] ?? '')));
  await p.evaluate(() => { const cell = [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.month .cell')].find((x) => /Wednesday 11 November/.test(x.getAttribute('aria-label'))); cell.querySelector('.mev .ell').click(); }); await p.waitForTimeout(400); sh = await sheet();
  console.log('R4-2 month line opens the sheet:', ok(!!sh && /Night shift/.test(sh.text)), '| view stays month:', await p.evaluate(() => document.querySelector('family-hub-card')._view));
  await p.context().close();
  // the morning board: what runs on from yesterday says so; family events once, across the top
  const m = await openAt(1920, 1080, 'look=glass&page=morning', '07:10');
  await m.evaluate(async () => { const c = document.querySelector('family-hub-card'), h = c.hass, api = h.callApi;
    c.hass = { ...h, callApi: async (mm, path, body) => { const r = await api(mm, path, body);
      if (/^calendars\/calendar\.family/.test(path)) return [...r, { summary: 'Road works', start: { dateTime: '2026-11-09T22:00:00+08:00' }, end: { dateTime: '2026-11-10T06:00:00+08:00' } }];
      if (/^calendars\/calendar\.riley/.test(path)) return [...r, { summary: 'Camp', start: { dateTime: '2026-11-09T10:00:00+08:00' }, end: { dateTime: '2026-11-11T15:00:00+08:00' } }]; return r; } };
    await c._loadSoon(); await new Promise((r) => setTimeout(r, 300)); }); await m.waitForTimeout(500);
  const mb = await m.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-morning').shadowRoot, z = Number(getComputedStyle(document.querySelector('family-hub-card').shadowRoot.querySelector('.fh')).zoom) || 1;
    const tx = (e) => e.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim(), tiles = [...r.querySelectorAll('.tile')].map((e) => e.getBoundingClientRect()), bars = [...r.querySelectorAll('.kcol .kgo, .kcol .gobar, .kcol [role="timer"], .kcol svg.tface')], clocks = r.querySelectorAll('[data-part="goclock"]').length;
    return { fam: [...r.querySelectorAll('.fam .fev')].map(tx), cols: [...r.querySelectorAll('.kcol')].map((k) => [...k.querySelectorAll('.mev2')].map(tx).join(' ; ')), tiles: tiles.length, tileMin: Math.round(Math.min(...tiles.map((b) => Math.min(b.width, b.height))) / z), tileTop: Math.round(Math.min(...tiles.map((b) => b.top))), bars: bars.length, clocks, kids: r.querySelectorAll('.kcol').length, gotx: [...r.querySelectorAll('.kcol .lchip')].map(tx), half: innerHeight / 2, progress: r.querySelectorAll('.kcol .stars, .kcol .teambar, .kcol [role="progressbar"]').length }; });
  console.log('R4-3 morning board family strip:', mb.fam.join(' ; '), ok(mb.fam.some((x) => /^until 6:00 am ?Road works/.test(x))), '| Riley:', mb.cols[0], ok(/continues ?Camp/.test(mb.cols[0])));
  console.log('R4-4a family events once across the top, not in the columns:', ok(mb.fam.some((x) => /Bins out/.test(x)) && !mb.cols.some((c) => /Bins out|Road works/.test(c))), '| picture tiles:', mb.tiles, 'smallest', mb.tileMin, 'px (expect >= 72)', ok(mb.tiles > 0 && mb.tileMin >= 72), '| tiles in the lower half: top', mb.tileTop, '>', mb.half, ok(mb.tileTop > mb.half),
    '| D4 one clock for the family, none in a column:', mb.clocks, 'clock,', mb.bars, 'bars in columns,', mb.gotx.join(' ; '), ok(mb.clocks === 1 && mb.bars === 0 && mb.gotx.length === mb.kids - 1 && mb.gotx.every((x) => /^You leave 20 minutes later ?7:50 am/.test(x) && !/%/.test(x))), '| per-child job progress (expect 0):', mb.progress);
  await m.context().close();
  // on the wall the header has room for the "next up" chip: it is a button that opens its event
  const w = await openAt(1920, 1080, 'look=glass&page=planner'); const chip2 = w.locator('family-hub-card header button.cap[data-kind="next"]');
  if (await chip2.count() && await chip2.isVisible()) { const nm = await chip2.getAttribute('aria-label'); await chip2.click(); await w.waitForTimeout(400);
    console.log('R4-2 header "next up" chip at 1920x1080:', nm.replace(/\u00a0/g, ' '), '| opens its event:', ok(await w.evaluate(() => !!document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet[data-sheet="event"]')))); }
  else console.log('R4-2 header "next up" chip at 1920x1080: not showing');
  await w.context().close(); }
// R4-4b and c. a child who cannot read reaches Ask, the chat's pictures and the doodle colours in the lower half of the wall panel
{ const p = await openAt(1920, 1080, 'look=glass&page=kid&kid=2'); const half = 540;
  const kid = () => p.evaluate(() => { const b = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('.askbtn'), z = Number(getComputedStyle(document.querySelector('family-hub-card').shadowRoot.querySelector('.fh')).zoom) || 1; if (!b) return null; const r = b.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height / z), text: b.innerText.trim(), name: b.getAttribute('aria-label'), svg: !!b.querySelector('svg') }; });
  const a = await kid();
  console.log('R4-4b Ask button on a picture-mode page:', JSON.stringify(a), ok(!!a && a.top > half && a.h >= 72 && a.text === 'Ask' && a.svg));
  await p.locator('family-hub-card fh-kid .askbtn').click(); await p.waitForTimeout(600);
  const ch = await p.evaluate(() => { const c = document.querySelector('family-hub-card'), r = c.shadowRoot.querySelector('fh-chat')?.shadowRoot; if (!r) return null; const top = (e) => Math.round(e.getBoundingClientRect().top), talk = r.querySelector('.talk'), th = r.querySelector('.thread').getBoundingClientRect();
    return { sheet: c._sheet, low: c.shadowRoot.querySelector('fh-chat').hasAttribute('low'), talk: talk ? top(talk) : null, starters: [...r.querySelectorAll('.starter')].map(top), threadBottom: Math.round(th.bottom), kb: getComputedStyle(r.querySelector('.send .kb')).fontSize, bottom: Math.round(Math.max(...[...r.querySelectorAll('.starter, .opts button')].map((e) => e.getBoundingClientRect().bottom))), vh: innerHeight }; });
  console.log('R4-4b Ask opens the chat:', ch?.sheet, '| microphone top', ch?.talk, '| six pictures tops', JSON.stringify(ch?.starters), '> ', half, ok(!!ch && ch.low && ch.starters.length === 6 && ch.starters.every((y) => y > half) && (ch.talk === null || ch.talk > half)), '| conversation above them:', ok(!!ch && ch.threadBottom <= Math.min(...ch.starters)), '| all on screen:', ok(!!ch && ch.bottom <= ch.vh), '| "Keyboard" label', ch?.kb, ok(!!ch && parseFloat(ch.kb) >= 15));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await HOME(p); await p.locator('family-hub-card nav.dock [data-nav="pencil"]').click(); await p.waitForTimeout(900);
  const dd = () => p.evaluate(() => { const d = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-doodle'), tops = [...d.shadowRoot.querySelectorAll('.brushes button')].map((e) => e.getBoundingClientRect()); return { low: d.hasAttribute('low'), n: tops.length, minTop: Math.round(Math.min(...tops.map((b) => b.top))), maxBottom: Math.round(Math.max(...tops.map((b) => b.bottom))), small: tops.filter((b) => Math.min(b.width, b.height) < 43.5).length, pad: Math.round(d.shadowRoot.querySelector('.pad').getBoundingClientRect().height), vh: innerHeight }; });
  let d = await dd();
  console.log('R4-4c Doodle opened from his page: colours and brushes along the bottom:', JSON.stringify(d), ok(d.low && d.minTop > half && d.maxBottom <= d.vh && !d.small && d.pad > 250));
  await HOME(p); await p.locator('family-hub-card nav.dock [data-nav="calendar"]').click(); await p.waitForTimeout(500); await p.locator('family-hub-card nav.dock [data-nav="pencil"]').click(); await p.waitForTimeout(900); d = await dd();
  console.log('R4-4c Doodle opened from the planner keeps its side palette:', ok(!d.low));
  await p.context().close(); }
// R4-5. leftovers: phone dock labels, the week initials, the shelf labels, taps while a scene or "Whole house" is in flight
for (const look of ['glass', 'fridge', 'orbit']) { const c = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, timezoneId: 'Australia/Perth', locale: 'en-AU' }); const p = await c.newPage();
  await p.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await p.goto('http://localhost:' + PORT + `/?look=${look}&page=planner`); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(800);
  const fs = await p.evaluate(() => Math.min(...[...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('nav.dock .item')].map((e) => parseFloat(getComputedStyle(e).fontSize))));
  console.log(`R4-5 phone dock labels in ${look}: ${fs}px (expect >= 13)`, ok(fs >= 13)); await c.close(); }
{ const p = await openAt(1280, 800, 'look=glass&page=kid&kid=0');
  await p.locator('family-hub-card fh-kid .tabs button', { hasText: 'My week' }).click(); await p.waitForTimeout(400);
  const wk = await p.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot; const a = [...r.querySelectorAll('.wk .init')]; return { n: a.length, fs: Math.min(...a.map((e) => parseFloat(getComputedStyle(e).fontSize))), cut: a.filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).length }; });
  console.log('R4-5 kid week initials:', JSON.stringify(wk), ok(wk.n > 0 && wk.fs >= 14 && !wk.cut)); await p.context().close(); }
{ const p = await openAt(1280, 800, 'look=glass&page=music&mview=house'); await p.waitForTimeout(4600);
  const sh = await p.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot; const a = [...r.querySelectorAll('.srec span')].filter((e) => e.offsetWidth); return { n: a.length, fs: Math.min(...a.map((e) => parseFloat(getComputedStyle(e).fontSize))), cutBelow: a.filter((e) => e.getBoundingClientRect().bottom > e.closest('.mshelf, .srecs').getBoundingClientRect().bottom + 1).length }; });
  console.log('R4-5 House shelf labels:', JSON.stringify(sh), ok(sh.n > 0 && sh.fs >= 14 && !sh.cutBelow));
  // the dock scenes: two taps in the same instant make one call
  await p.evaluate(() => { window.__calls = []; const b = document.querySelector('family-hub-card').shadowRoot.querySelector('nav.dock [data-nav="lights-off"]'); b.click(); b.click(); }); await p.waitForTimeout(600);
  console.log('R4-5 "All off" tapped twice at once: calls', await p.evaluate(() => window.__calls.filter((x) => /^light\.turn_off/.test(x)).length), '(expect 1)');
  await p.keyboard.press('Escape'); await p.context().close();
  const d = await openAt(1280, 800, 'look=glass&page=music&mview=dial'); await d.waitForTimeout(600);
  await d.evaluate(() => { window.__calls = []; const b = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot.querySelector('.wholeb'); b.click(); b.click(); b.click(); }); await d.waitForTimeout(900);
  console.log('R4-5 "Whole house" tapped three times at once: join calls', await d.evaluate(() => window.__calls.filter((x) => /^media_player\.join/.test(x)).length), '(expect 1)');
  await d.context().close(); }
{ const p = await openAt(390, 844, 'look=fridge&page=planner&sheet=sitter');
  const rows = await p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.sheet a.irow')].map((e) => Math.round(e.getBoundingClientRect().height)));
  console.log('R4-5 house-info phone rows (heights, expect each >= 44):', JSON.stringify(rows), ok(rows.length > 0 && rows.every((h) => h >= 44))); await p.context().close(); }

// ---------- Round 5: the cold reviewers' majors and minors ----------
{ const SR = `document.querySelector('family-hub-card').shadowRoot`;
  const deepFocus = (p) => p.evaluate(() => { let a = document.activeElement; while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement; return a ? (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 24) || a.tagName) : ''; });
  const settle = (p) => p.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 3000))]));
  // R5-2 no initial chip under 12 px
  for (const pg of ['planner', 'planner&view=day', 'planner&view=month', 'planner&sheet=add']) { const p = await openAt(1280, 800, 'look=glass&page=' + pg);
    const r = await p.evaluate(() => { const out = []; const walk = (root) => root.querySelectorAll('*').forEach((e) => { if (e.matches('.init') && e.getClientRects().length) out.push([parseFloat(getComputedStyle(e).fontSize), e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1]); if (e.shadowRoot) walk(e.shadowRoot); }); walk(document.querySelector('family-hub-card').shadowRoot); return { n: out.length, min: Math.min(...out.map((x) => x[0])), clipped: out.filter((x) => x[1]).length }; });
    console.log('R5-2 initials on', pg + ':', JSON.stringify(r), ok(r.n > 0 && r.min >= 12 && r.clipped === 0)); await p.context().close(); }
  // R5-3 a place wraps to two lines where its day has room; R5-4 Fridge titles may run to four lines
  { const p = await openAt(1280, 800, 'look=glass&page=planner&events=long'); const r = await p.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot; const locs = [...c.querySelectorAll('.col[data-wrap] .ev .loc .ell')]; return { wrapDays: c.querySelectorAll('.col[data-wrap]').length, tightDays: c.querySelectorAll('.col[data-tight]').length, twoLine: locs.filter((e) => e.offsetHeight > 22).length, clamp: locs[0] ? getComputedStyle(locs[0]).webkitLineClamp : '', overflowing: [...c.querySelectorAll('.week > .col')].filter((col) => { const b = col.querySelector('.evs'); return b && b.scrollHeight > b.clientHeight + 2; }).length }; });
    console.log('R5-3 week places:', JSON.stringify(r), ok(r.wrapDays > 0 && r.clamp === '2' && r.overflowing === 0)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=fridge&page=planner&events=long'); const r = await p.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot; const t = [...c.querySelectorAll('.col:not([data-tight]) .ev .content')]; return { clamp: t[0] ? getComputedStyle(t[0]).webkitLineClamp : '', most: Math.max(...t.map((e) => Math.round(e.offsetHeight / parseFloat(getComputedStyle(e).lineHeight)))), cutAtTwo: t.filter((e) => e.scrollHeight > e.clientHeight + 1 && Math.round(e.offsetHeight / parseFloat(getComputedStyle(e).lineHeight)) <= 2).length }; });
    console.log('R5-4 Fridge week titles:', JSON.stringify(r), ok(r.clamp === '4' && r.cutAtTwo === 0)); await p.context().close(); }
  // R5-7 the Ask sheet by keyboard: opened with Enter, typed into, sent with Enter, tabbed through, closed with Escape
  { const p = await openAt(1280, 800, 'look=glass&page=planner'); await p.getByRole('button', { name: 'Ask a question' }).first().focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
    const first = await deepFocus(p); await p.keyboard.type('why is the sky blue'); await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
    const bub = await p.locator('fh-chat .thread .bubble').allInnerTexts(), open1 = await p.evaluate(`document.querySelector('family-hub-card')._sheet`);
    const seen = new Set(); for (let i = 0; i < 16; i++) { await p.keyboard.press('Tab'); seen.add(await deepFocus(p)); }
    const inert = await p.evaluate(`[...${SR}.querySelectorAll('.fh > header, .fh > .body, .fh > nav.dock')].every((x) => x.inert)`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    console.log('R5-7 Ask by keyboard: focus on open "' + first + '"', ok(first === 'Your question'), '| typed and sent with Enter:', ok(bub.some((b) => /why is the sky blue/.test(b)) && open1 === 'chat'), '| Tab reaches', seen.size, 'controls incl. Close, a starter and Send/Keyboard:', ok(seen.has('Close') && [...seen].some((x) => /Tell me a joke/.test(x)) && seen.has('Keyboard') && seen.has('For grown-ups')), '| page behind is inert:', ok(inert), '| Escape closes, focus back on:', await deepFocus(p), ok((await p.evaluate(`document.querySelector('family-hub-card')._sheet`)) === '' && (await deepFocus(p)) === 'Ask a question'));
    console.log('R5-15 page no longer inert once the sheet has gone:', ok(await p.evaluate(`[...${SR}.querySelectorAll('.fh > header, .fh > .body, .fh > nav.dock')].every((x) => !x.inert)`))); await p.context().close(); }
  { const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true, isMobile: true, timezoneId: 'Australia/Perth', locale: 'en-AU' }); const p = await c.newPage(); await p.goto('http://localhost:' + PORT + '/?look=glass&page=planner&sheet=chat'); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(900);
    console.log('R5-7 on a touch screen the field is not focused (no system keyboard):', ok(await p.evaluate(() => { let a = document.activeElement; while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement; return a?.tagName !== 'INPUT'; }))); await c.close(); }
  // R5-8 repeat taps while a call is out: Home scene, timer Cancel, a reminder and a grocery tick each send one call, and show they are waiting
  { const p = await openAt(1280, 800, 'look=glass&page=home&slow=1500');
    const r = await p.evaluate(async () => { const h = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-home').shadowRoot, b = h.querySelector('.scene'); window.__calls = []; b.click(); b.click(); await new Promise((r) => setTimeout(r, 450)); const busy = b.hasAttribute('data-busy'); b.click(); await new Promise((r) => setTimeout(r, 1800)); return { busy, calls: window.__calls.filter((c) => /^script\.turn_on/.test(c)).length }; });
    console.log('R5-8 Home scene tapped three times on a slow link:', JSON.stringify(r), ok(r.busy && r.calls === 1));
    const sw = await p.evaluate(async () => { const h = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-home').shadowRoot, b = h.querySelector('.rh .sw'); if (!b) return null; window.__calls = []; b.click(); b.click(); await new Promise((r) => setTimeout(r, 380)); const busyBy400 = b.hasAttribute('data-busy') && getComputedStyle(b).cursor === 'progress'; await new Promise((r) => setTimeout(r, 1600)); return { busyBy400, calls: window.__calls.filter((c) => /^light\.turn_/.test(c)).length }; });
    console.log('R5-14 Home room switch on a slow link:', JSON.stringify(sw), ok(sw && sw.busyBy400 && sw.calls === 1)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&slow=1500');
    const r = await p.evaluate(async () => { const c = document.querySelector('family-hub-card').shadowRoot, b = c.querySelector('button.rem'); window.__calls = []; b.click(); b.click(); b.click(); await new Promise((r) => setTimeout(r, 2200)); return { calls: window.__calls.filter((x) => /^todo\.update_item/.test(x)).length, ticked: b.getAttribute('aria-pressed') }; });
    console.log('R5-8 reminder tapped three times on a slow link:', JSON.stringify(r), ok(r.calls === 1)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=groceries&slow=1500');
    const r = await p.evaluate(async () => { const g = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries').shadowRoot, b = g.querySelector('button.item'); window.__calls = []; b.click(); b.click(); b.click(); await new Promise((r) => setTimeout(r, 400)); const busy = b.hasAttribute('data-busy'); await new Promise((r) => setTimeout(r, 1800)); return { busy, calls: window.__calls.filter((x) => /^todo\.update_item/.test(x)).length }; });
    console.log('R5-8 grocery row tapped three times on a slow link:', JSON.stringify(r), ok(r.busy && r.calls === 1));
    const a = await p.evaluate(async () => { const g = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries'); window.__calls = []; g._add('Zucchini', null); g._add('Zucchini', null); await new Promise((r) => setTimeout(r, 380)); const row = g.shadowRoot.querySelector('.item.pending'); const got = { pendingBy400: !!row, says: row?.textContent.replace(/\s+/g, ' ').trim() }; await new Promise((r) => setTimeout(r, 2000)); got.calls = window.__calls.filter((x) => /^todo\.add_item/.test(x)).length; got.goneAfter = !g.shadowRoot.querySelector('.item.pending'); got.status = g.shadowRoot.querySelector('.says')?.getAttribute('role'); return got; });
    console.log('R5-14 grocery Add on a slow link:', JSON.stringify(a), ok(a.pendingBy400 && a.calls === 1 && a.goneAfter && a.status === 'status')); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=timer&slow=1200'); await p.evaluate(() => { const h = document.querySelector('family-hub-card').hass; h.states['timer.kitchen'] = { ...h.states['timer.kitchen'], state: 'active', attributes: { ...(h.states['timer.kitchen']?.attributes ?? {}), finishes_at: new Date(Date.now() + 300000).toISOString(), duration: '0:05:00' } }; document.querySelector('family-hub-card').hass = { ...h }; }); await p.waitForTimeout(300);
    const heroes = await p.evaluate(`${SR}.querySelectorAll('.sheet .lead').length`), wraps = await p.evaluate(`[...${SR}.querySelectorAll('.sheet [data-act="plus"]')].filter((b) => b.offsetHeight > 62 || getComputedStyle(b).whiteSpace !== 'nowrap').length`);
    const r = await p.evaluate(async () => { const c = document.querySelector('family-hub-card').shadowRoot, b = c.querySelector('.sheet [aria-label="Cancel the kitchen timer"]'); if (!b || b.disabled) return { skipped: 'timer not running in the preview' }; window.__calls = []; b.click(); b.click(); b.click(); await new Promise((r) => setTimeout(r, 1700)); return { calls: window.__calls.filter((x) => /^timer\.cancel/.test(x)).length }; });
    console.log('R5-8 timer Cancel tapped three times on a slow link:', JSON.stringify(r), ok(r.skipped || r.calls === 1), '| R5-17 one hero on the timer sheet:', heroes, ok(heroes === 1), '| +N min buttons that could wrap:', wraps, ok(wraps === 0)); await p.context().close(); }
  // R5-9 add-event sheet controls are 44 px high once the sheet has arrived, at both sizes
  for (const [w, h] of [[1280, 800], [390, 844]]) { const p = await openAt(w, h, 'look=glass&page=planner&sheet=add'); await settle(p);
    const hs = await p.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-add-event').shadowRoot; return [...r.querySelectorAll('.chips.days button, .chips.cals button, .calbtn, .allday')].filter((e) => e.getClientRects().length).map((e) => Math.round(e.getBoundingClientRect().height * 10) / 10); });
    console.log(`R5-9 add sheet ${w}x${h}: date and people chips, "Other date", "All day" heights:`, [...new Set(hs)].join(','), ok(hs.length > 4 && hs.every((x) => x >= 44))); await p.context().close(); }
  // R5-10 / R5-13 medication: a record kept in this browser says so; the giver shows at once on a slow link; a failure leaves nothing ticked
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=meds');
    const note = await p.evaluate(`(() => { const s = ${SR}.querySelector('.sheet'); return { label: [...s.querySelectorAll('.label')].map((x) => x.textContent.trim()), note: s.querySelector('[data-medlocal]')?.textContent.trim() ?? '' }; })()`);
    console.log('R5-10 no med_log: section label', JSON.stringify(note.label[1]), ok(note.label.includes('Kept on this screen only')), '| note in plain words (no setting names):', ok(!/med_log|card settings/.test(note.note) && /No other screen/.test(note.note) && /shared list/.test(note.note))); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=meds&slow=1200'); await p.evaluate(() => { document.querySelector('family-hub-card')._medOpen = true; }); await p.evaluate(() => { window.__calls = []; });
    await p.evaluate(`${SR}.querySelector('.sheet [data-act="given"]').click()`); await p.waitForTimeout(350);
    const mid = await p.evaluate(`${SR}.querySelector('.sheet [data-saving]')?.textContent.trim() ?? ''`); await p.waitForTimeout(3200);
    const order = await p.evaluate(() => window.__calls.filter((c) => /^input_(text|datetime)\./.test(c)).map((c) => c.split(' ')[0]));
    console.log('R5-13 slow link: row says', JSON.stringify(mid), ok(/Saving/.test(mid) && /Alex/.test(mid)), '| giver written before the time:', order.join(' > '), ok(order[0] === 'input_text.set_value' && order[1] === 'input_datetime.set_datetime')); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=meds'); await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c._medOpen = true; const h = c.hass, real = h.callService; window.__calls2 = []; h.callService = async (d, s, data, t) => { window.__calls2.push(d + '.' + s + ' ' + JSON.stringify(data)); if (d === 'input_datetime' && window.__calls2.filter((x) => /^input_datetime/.test(x)).length === 1) throw new Error('refused'); return real(d, s, data, t); }; });
    await p.evaluate(`${SR}.querySelector('.sheet [data-act="given"]').click()`); await p.waitForTimeout(900);
    const r = await p.evaluate(() => ({ calls: window.__calls2.map((x) => x.split(' ')[0]), lastBy: JSON.parse(window.__calls2.filter((x) => /^input_text/.test(x)).pop().split(' ').slice(1).join(' ')).value, row: document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet .card b:last-of-type')?.textContent.trim(), toast: document.querySelector('family-hub-card').shadowRoot.querySelector('.toast')?.textContent.trim() }));
    console.log('R5-13 time write refused: the name is put back (' + r.lastBy + '), row not ticked, and it says so:', JSON.stringify(r.calls), '|', r.toast, ok(r.lastBy !== 'Alex' && /not recorded/.test(r.toast ?? '') && r.calls.filter((x) => /^input_text/.test(x)).length === 2)); await p.context().close(); }
  { const p = await openAt(1280, 600, 'look=glass&page=planner&sheet=meds'); await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c._medOpen = true; const now = Date.now(); localStorage.setItem('family-hub-med-log', JSON.stringify(Array.from({ length: 9 }, (_, i) => new Date(now - (i + 1) * 3600000).toISOString() + '|Riley|Paracetamol|Sam'))); return c._loadMedLog().then(() => c.requestUpdate()); }); await p.waitForTimeout(300);
    await p.evaluate(`(() => { const c = document.querySelector('family-hub-card'); c._mx = { ...c._mx, what: 'Ibuprofen', who: 'Charlie', by: 'Alex' }; c.requestUpdate(); })()`); await p.waitForTimeout(200); await p.evaluate(`${SR}.querySelector('.sheet').scrollTop = 9999`); await p.evaluate(`${SR}.querySelector('.sheet [data-act="log"]').click()`); await p.waitForTimeout(1200);
    const v = await p.evaluate(`(() => { const s = ${SR}.querySelector('.sheet'), row = [...s.querySelectorAll('.irow[data-at]')].find((x) => /Ibuprofen/.test(x.textContent)); if (!row) return null; const a = row.getBoundingClientRect(), b = s.getBoundingClientRect(); return a.top >= b.top - 1 && a.bottom <= b.bottom + 1; })()`);
    console.log('R5-13 a new record is scrolled into view:', v, ok(v === true)); await p.evaluate(() => localStorage.removeItem('family-hub-med-log')); await p.context().close(); }
  // R5-11 jobs left: "My look" answers with a wiggle of the padlock and, in picture mode, a spoken line; nothing red, no toast
  for (const k of [2, 0]) { const p = await openAt(1280, 800, 'look=glass&page=kid&kid=' + k); await p.evaluate(() => { window.__said = []; const real = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = (u) => { window.__said.push(u.text); }; });
    const b = p.locator('fh-kid .studio'); const locked = await b.getAttribute('data-locked'); if (locked === null) { console.log('R5-11 kid', k, 'has no jobs left in the preview: not tested'); await p.context().close(); continue; }
    await b.click(); await p.waitForTimeout(150);
    const r = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid'), b = k.shadowRoot.querySelector('.studio'), sv = b.querySelector('svg'); return { nudge: b.hasAttribute('data-nudge'), anim: getComputedStyle(sv).animationName, toast: k.shadowRoot.querySelector('.toast')?.textContent ?? '', studio: k._studio, said: window.__said, pic: k._picMode }; });
    console.log('R5-11 kid', k, 'locked "My look":', JSON.stringify(r), ok(r.nudge && r.anim === 'lockwig' && !r.toast && !r.studio && (r.pic ? /One more job, then your look|jobs to go/.test(r.said.join(' ')) : r.said.length === 0))); await p.context().close(); }
  // R5-12 the youngest at the wall: feelings and its speaker in the lower half; faces under the records on his shelf and on his jukebox turn
  { const p = await openAt(1920, 1080, 'look=glass&page=kid&kid=2'); const r = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot; const t = (s) => Math.round(k.querySelector(s).getBoundingClientRect().top); return { speaker: t('[aria-label="Read the question"]'), faces: t('.feel'), tabs: t('.tabs'), look: t('.studio') }; });
    await p.evaluate(() => { window.__said = []; speechSynthesis.speak = (u) => { window.__said.push(u.text); }; }); await p.locator('fh-kid .feel button').first().click(); await p.waitForTimeout(200);
    const f = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot; return { asked: k.querySelector('.feelcard span')?.textContent.trim(), said: window.__said.join(' | '), again: Math.round(k.querySelector('[aria-label="Read the question"]').getBoundingClientRect().top) }; });
    await p.locator('fh-kid [aria-label="Read the question"]').click(); await p.waitForTimeout(100); const speaking = await p.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('[aria-label="Read the question"]').hasAttribute('data-speaking'));
    console.log('R5-12 Max at 1920x1080 (tops, all > 540):', JSON.stringify(r), ok(Object.values(r).every((y) => y > 540)), '| R5-17 follow-up shown and spoken:', JSON.stringify(f.asked), ok(f.said.includes(f.asked) && f.again > 540), '| read-aloud button shows it is speaking:', ok(speaking)); await p.context().close(); }
  { const p = await openAt(1920, 1080, 'look=glass&page=music&mtab=shelves'); await p.locator('fh-music .dividers .pchip', { hasText: 'Max' }).click(); await p.waitForTimeout(500);
    const s = await p.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot; const c = m.querySelector('.dividers').getBoundingClientRect(), t = [...m.querySelectorAll('.crate .covers .st')].map((x) => x.getBoundingClientRect()); return { chipsTop: Math.round(c.top), tilesTop: Math.round(Math.min(...t.map((x) => x.top))), tilesBottom: Math.round(Math.max(...t.map((x) => x.bottom))) }; });
    await p.locator('fh-music .dividers .pchip', { hasText: 'Riley' }).click(); await p.waitForTimeout(400); const other = await p.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot; return m.querySelector('.dividers').getBoundingClientRect().top < m.querySelector('.crate .covers, .crate .empty').getBoundingClientRect().top; });
    console.log('R5-12 Max’s shelf at the wall:', JSON.stringify(s), ok(s.chipsTop >= s.tilesBottom && s.tilesTop > 540), '| an older child’s shelf keeps its faces on top:', ok(other)); await p.context().close(); }
  { const p = await openAt(1920, 1080, 'look=glass&page=music&mtab=juke'); await p.locator('fh-music .coin', { hasText: 'Max' }).click(); await p.waitForTimeout(600);
    const s = await p.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot; const b = m.querySelector('.banner').getBoundingClientRect(), t = [...m.querySelectorAll('.jcovers .st')].map((x) => x.getBoundingClientRect()); return { bannerTop: Math.round(b.top), tiles: t.length, tilesTop: Math.round(Math.min(...t.map((x) => x.top))), tilesBottom: Math.round(Math.max(...t.map((x) => x.bottom))) }; });
    console.log('R5-12 Max’s jukebox turn at the wall:', JSON.stringify(s), ok(s.tiles > 0 && s.bannerTop >= s.tilesBottom && s.tilesTop > 500)); await p.context().close(); }
  // R5-14 a call that never answers is given up after 12 s: the tick goes back and a calm line says so; a failed clear stays until dismissed; a reward says "Saving…"
  { const p = await openAt(1280, 800, 'look=glass&page=groceries'); await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c.hass.callService = () => new Promise(() => {}); });
    await p.locator('fh-groceries button.item').first().click(); await p.waitForTimeout(300); const held = await p.locator('fh-groceries button.item[aria-pressed="true"]').count(); await p.clock.fastForward(12500); // held counts the row just ticked with those already in the trolley await p.waitForTimeout(400);
    const r = { held, after: await p.locator('fh-groceries button.item[aria-pressed="true"]').count(), toast: (await p.locator('fh-groceries .toast').innerText().catch(() => '')).trim() };
    console.log('R5-14 grocery tick never answered:', JSON.stringify(r), ok(r.after === r.held - 1 && r.toast === 'Home Assistant is slow. Try again.')); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=groceries&fail=1'); const g = p.locator('fh-groceries'); const has = await g.locator('.clear').count();
    if (has) { await g.locator('.clear').click(); await p.clock.fastForward(6500); await p.waitForTimeout(600); const t1 = (await g.locator('.toast').innerText().catch(() => '')).replace(/\s+/g, ' ').trim(); await p.clock.fastForward(20000); await p.waitForTimeout(300); const still = await g.locator('.toast').count(); await g.locator('.toast button').click(); await p.waitForTimeout(500);
      console.log('R5-14 "Clear ticked" failed:', JSON.stringify(t1), '| still there 20 s later:', ok(still === 1), '| goes when OK is tapped:', ok((await g.locator('.toast:not([data-closing])').count()) === 0)); } else console.log('R5-14 "Clear ticked": nothing ticked in the preview, not tested'); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=kid&kid=1&slow=1500'); const k = p.locator('fh-kid'); await p.evaluate(() => { const c = document.querySelector('family-hub-card'), kid = c.shadowRoot.querySelector('fh-kid'), id = kid._e.points; c.hass = { ...c.hass, states: { ...c.hass.states, [id]: { ...c.hass.states[id], state: '500' } } }; kid._tab = 'rewards'; kid._tabPicked = true; kid.requestUpdate(); }); await p.waitForTimeout(300);
    const can = k.locator('button.rw:has(.cost:not(.notyet))'); let asked = false; for (let i = 0; i < await can.count() && !asked; i++) { await can.nth(i).click(); await p.waitForTimeout(250); asked = (await k.locator('.rw.ask').count()) > 0; if (!asked) await p.keyboard.press('Escape'); }
    if (asked) { await k.locator('.rw.ask button').first().click(); await p.waitForTimeout(380); const t = (await k.locator('.rw.ask button').first().innerText().catch(() => '')).trim(); console.log('R5-14 reward "Yes" on a slow link says within 400 ms:', JSON.stringify(t), ok(t === 'Saving…')); } else console.log('R5-14 reward Saving: no reward affordable in the preview, not tested');
    const flat = await p.evaluate(() => { const e = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('.cost.notyet'); return e ? getComputedStyle(e).boxShadow : 'none-found'; }); console.log('R5-17 "N to go" is a flat tile (no outline):', flat, ok(flat === 'none' || flat === 'none-found')); await p.context().close(); }
  // R5-15 semantics: drums, value text, reminders' ring room, status regions
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=add'); const d = p.locator('fh-add-event .drum[data-d="h"]'), m = p.locator('fh-add-event .drum[data-d="m"]'); await d.focus(); const h0 = await d.getAttribute('aria-valuenow');
    await p.keyboard.press('Home'); const home = await d.getAttribute('aria-valuenow'); await p.keyboard.press('PageDown'); const pd = await d.getAttribute('aria-valuenow'); await p.keyboard.press('End'); const end = await d.getAttribute('aria-valuenow'); await p.keyboard.press('PageUp'); const pu = await d.getAttribute('aria-valuenow');
    console.log('R5-15 hour drum keys: start', h0, '| Home', home, '| PageDown', pd, '| End', end, '| PageUp', pu, ok(home === '1' && pd === '4' && end === '12' && pu === '9'), '| value text:', await d.getAttribute('aria-valuetext'), '/', await m.getAttribute('aria-valuetext'), ok(/ (am|pm)$/.test(await d.getAttribute('aria-valuetext'))), '| message region is standing:', ok((await p.locator('fh-add-event .err[role="status"]').count()) === 1)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner'); const r = await p.evaluate(`(() => { const l = ${SR}.querySelector('.remlist'), b = l.querySelector('.rem'); const lb = l.getBoundingClientRect(), bb = b.getBoundingClientRect(); return { left: Math.round(bb.left - lb.left), right: Math.round(lb.right - bb.right) }; })()`);
    console.log('R5-15 room for a reminder’s focus ring inside the clip (px each side, need 6):', JSON.stringify(r), ok(r.left >= 6 && r.right >= 6));
    const dock = await p.evaluate(`(() => { const out = {}; for (const b of ${SR}.querySelectorAll('nav.dock .item')) { const rg = document.createRange(); const tn = [...b.childNodes].reverse().find((n) => n.textContent.trim()); rg.selectNodeContents(tn); out[b.textContent.trim()] = Math.round(rg.getBoundingClientRect().bottom); } return out; })()`);
    console.log('R5-16 dock labels on one line (bottoms):', JSON.stringify(dock), ok(Math.max(...Object.values(dock)) - Math.min(...Object.values(dock)) <= 1), '| Dinner shown with an announce script:', ok('Dinner' in dock)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&dinner=0'); console.log('R5-17 no announce script: Dinner in the dock (expect 0):', await p.evaluate(`${SR}.querySelectorAll('nav.dock [data-nav="dinner"]').length`)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=sitter'); const w = await p.evaluate(`[...${SR}.querySelectorAll('.sheet .irow')].map((x) => x.textContent.trim()).filter((t) => /^(Network|Password)/.test(t)).map((t) => t.slice(0, 8))`); console.log('R5-17 House info Wi-Fi rows:', JSON.stringify(w), ok(w.length === 2 && /^Network/.test(w[0]) && /^Password/.test(w[1]))); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&empty=1'); const t = await p.evaluate(`${SR}.querySelector('.rems')?.textContent.replace(/\\s+/g, ' ').trim() ?? ''`); console.log('R5-17 empty reminders:', JSON.stringify(t.slice(0, 60)), ok(/Nothing to remember/.test(t) || !/All done/.test(t))); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=weather'); const r = await p.evaluate(() => { const w = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot; return { winds: [...w.querySelectorAll('.hchart .wind')].map((t) => t.textContent.trim()).filter(Boolean).slice(0, 4), key: w.querySelector('.hkey')?.textContent.trim() }; }); console.log('R5-16 hourly wind labels:', JSON.stringify(r), ok(r.winds.every((t) => /^\d+$/.test(t)) && /km\/h/.test(r.key ?? ''))); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=kid&kid=1&studio=1'); const r = await p.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('fh-studio').shadowRoot; const rows = {}; for (const b of s.querySelectorAll('.tabs button')) { const y = Math.round(b.getBoundingClientRect().top); rows[y] = (rows[y] || 0) + 1; } return { rows: Object.values(rows), cut: [...s.querySelectorAll('.tabs button')].filter((b) => b.scrollWidth > b.clientWidth + 1).length }; }); console.log('R5-16 studio tabs per row:', JSON.stringify(r), ok(r.rows.join() === '4,4' && r.cut === 0)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=kid&kid=0'); const r = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot, s = k.querySelector('.side'); return Math.round(s.getBoundingClientRect().bottom - Math.max(...[...s.children].map((c) => c.getBoundingClientRect().bottom))); }); console.log('R5-16 older boys’ right column: gap under its last card (px):', r, ok(r <= 2)); await p.context().close(); }
}

// Home Ground (the sports look): it can be chosen in the picker, the header clock is digit tiles, the dock is there, and no page throws
{ let page = await open('look=glass&sheet=themes');
  const cards = page.locator('family-hub-card .looks .tcard');
  const count = await cards.count();
  await cards.filter({ hasText: 'Home Ground' }).click(); await page.waitForTimeout(300);
  console.log('HG1 picker: four looks', count === 4, '| choosing Home Ground sets the look', await page.evaluate(() => document.querySelector('family-hub-card').getAttribute('data-look') === 'sports' && localStorage.getItem('family-hub-look') === 'sports'),
    '| its card is the chosen one', await cards.filter({ hasText: 'Home Ground' }).getAttribute('aria-pressed') === 'true');
  await page.close();
  page = await open('look=sports&page=planner');
  const clock = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, b = r.querySelector('header .sboard'), dg = [...r.querySelectorAll('header .sboard .dg')];
    return { tiles: dg.map((d) => d.textContent).join(''), label: b?.getAttribute('aria-label'), tileBg: dg[0] ? getComputedStyle(dg[0]).backgroundColor : '', hm: getComputedStyle(r.querySelector('header .hm')).display, ball: r.querySelector('header .sboard .dball')?.dataset.ball, dow: r.querySelector('.fh').dataset.dow }; });
  console.log('HG2 header clock: digit tiles', clock.tiles === '420' && clock.label === '4:20', '| tiles are dark', clock.tileBg === 'rgb(10, 16, 13)', '| plain digits hidden', clock.hm === 'none', '| ball of the day (Tuesday: tennis)', clock.ball === 'tennis' && clock.dow === '2');
  const dock = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, d = r.querySelector('nav.dock'), items = [...d.querySelectorAll('.item')], b = d.getBoundingClientRect();
    return { n: items.length, small: items.filter((i) => { const q = i.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).length, wide: Math.round(b.width) === innerWidth, bottom: Math.round(b.bottom) === innerHeight, current: d.querySelector('[aria-current="page"]')?.dataset.nav,
      leads: r.querySelectorAll('.planner .lead').length, lanes: r.querySelectorAll('.week .col').length, balls: r.querySelectorAll('.week .dayhead .dball').length, verdict: r.querySelector('header .weather .verdict')?.textContent.trim() }; });
  console.log('HG3 dock: present with its items', dock.n >= 9 && dock.small === 0, '| a touchline across the bottom', dock.wide && dock.bottom, '| current page marked', dock.current === 'calendar', '| one hero on the planner', dock.leads === 1, '| seven lanes, a ball in each', dock.lanes === 7 && dock.balls === 7, '| pitch report on the weather chip:', dock.verdict);
  await page.close();
  const before = errs.filter((e) => !/^404|^failed/.test(e)).length, blank = [];
  for (const [qs, time] of [['page=planner&view=day'], ['page=planner&view=month'], ['page=planner', '19:30'], ['page=planner&calm=1'], ['page=planner&events=none&empty=1'], ['page=kid&kid=0'], ['page=kid&kid=1'], ['page=kid&kid=2'], ['page=kid&kid=2', '19:30'], ['page=kid&kid=0&studio=1'], ['page=groceries'], ['page=doodle'],
    ...['house', 'scene', 'dial', 'desk', 'cables', 'list'].map((v) => ['page=music&mview=' + v]), ...['shelves', 'juke&juke=1', 'radio', 'call'].map((t) => ['page=music&mtab=' + t]), ['page=weather'], ['page=weather&wx=rain'], ['page=home'], ['page=morning', '07:10'], ['page=planner&night=1', '22:30'],
    ...['add', 'meds', 'sitter', 'timer', 'themes', 'chat'].map((sh) => ['page=planner&sheet=' + sh]), ['page=kid&kid=0&sheet=kidprefs']]) {
    const p = await open('look=sports&' + qs, time);
    if (!(await p.evaluate(() => { const c = document.querySelector('family-hub-card'); return c.getAttribute('data-look') === 'sports' && c.shadowRoot.querySelector('.fh').children.length > 0; }))) blank.push(qs);
    await p.close(); }
  console.log('HG4 every page, sheet and view opens in Home Ground:', blank.length ? 'BLANK ' + blank.join(', ') : true, '| nothing throws', errs.filter((e) => !/^404|^failed/.test(e)).length === before);
  page = await open('look=sports&page=weather&wx=rain');
  console.log('HG5 weather page: the verdict tile comes first:', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot, v = r.querySelector('.wnow .verdict'); return v && v.previousElementSibling?.tagName === 'H2' ? v.textContent.trim() : 'MISSING'; }));
  await page.close();
  page = await open('look=sports&page=music&mview=scene');
  console.log('HG6 music scene is the training ground', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot, v = r.querySelector('.vscene'); return v?.dataset.kind === 'sports' && r.querySelectorAll('.vscene .actor').length > 0 && !!r.querySelector('.backdrop .bgchalk'); }));
  await page.close(); }
// R6-G1. wind-down (19:30): every card of the kid page's side column fits, "Ask for a chat" included, on a short panel in every look and on the wall sizes
{ const bad = [];
  for (const [w, h, look, kids] of [[1312, 668, 'glass&theme=sea', [0, 1, 2]], [1312, 668, 'fridge', [0, 1, 2]], [1312, 668, 'orbit', [0, 1, 2]], [1312, 668, 'sports', [0, 1, 2]], [1280, 800, 'sports', [0]], [1920, 1080, 'sports', [0]]]) for (const kid of kids) {
    const p = await openAt(w, h, `look=${look}&page=kid&kid=${kid}`, '19:30');
    const r = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot, s = k.querySelector('.side'), sb = s.getBoundingClientRect(), last = s.lastElementChild.getBoundingClientRect(), chat = [...s.querySelectorAll('button')].find((b) => /Ask for a chat/.test(b.textContent))?.getBoundingClientRect();
      return { over: s.scrollHeight - s.clientHeight, last: Math.round(last.bottom - Math.min(sb.bottom, innerHeight)), chat: chat ? Math.round(chat.bottom - Math.min(sb.bottom, innerHeight)) : 999 }; });
    if (r.over > 2 || r.last > 1 || r.chat > 0) bad.push(`${w}x${h} ${look.split('&')[0]} kid${kid} ${JSON.stringify(r)}`);
    await p.context().close(); }
  console.log('R6-G1 wind-down side column fits with nothing cut off', ok(!bad.length), bad.join(' | ')); }
// R6-G2. one job at a time on a tablet: Now, Next and "Show all" are inside the jobs card in the Sports look too (it grows; the page scrolls)
{ const bad = [];
  for (const [w, h] of [[820, 1180], [768, 1024]]) for (const kid of [1, 2]) { const p = await openAt(w, h, `look=sports&page=kid&kid=${kid}`);
    const r = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot, f = k.querySelector('.focus'), l = k.querySelector('.later'), j = k.querySelector('.jobs').getBoundingClientRect();
      return { clip: f.scrollHeight - f.clientHeight, later: l ? Math.round(l.getBoundingClientRect().bottom - j.bottom) : 999 }; });
    if (r.clip > 2 || r.later > 0) bad.push(`${w}x${h} kid${kid} ${JSON.stringify(r)}`); await p.context().close(); }
  console.log('R6-G2 tablet: the Sports Now card and "Show all" are not clipped', ok(!bad.length), bad.join(' | ')); }
// R6-G3. the chosen brush size looks chosen in every look, and the choice moves when another size is tapped
{ const bad = [];
  for (const look of ['glass&theme=sea', 'fridge', 'orbit', 'sports']) { const p = await openAt(1280, 800, `look=${look}&page=doodle`);
    const read = () => p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelector('fh-doodle').shadowRoot.querySelectorAll('button.size[aria-label^="Brush"]')].map((b) => { const cs = getComputedStyle(b); return { on: b.getAttribute('aria-pressed') === 'true', bg: cs.backgroundColor, look: cs.backgroundColor + ' ' + cs.boxShadow, dot: getComputedStyle(b.querySelector('i')).backgroundColor }; }));
    const a = await read(); await p.locator('fh-doodle button.size[aria-label="Brush 22"]').click(); await p.waitForTimeout(150); const b = await read();
    const clear = (v) => v.filter((x) => x.on).length === 1 && v.filter((x) => !x.on).every((x) => x.look !== v.find((y) => y.on).look) && v.find((x) => x.on).dot !== v.find((x) => x.on).bg;
    if (!clear(a) || !clear(b) || !b[2].on || a[2].on) bad.push(look.split('&')[0]); await p.context().close(); }
  console.log('R6-G3 the selected brush size is visibly selected', ok(!bad.length), bad.join(' ')); }
// R6-G4. Sports: the small bib's initial is 12 px
{ const p = await openAt(1280, 800, 'look=sports&page=kid&kid=0', '19:30');
  const fs = await p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelectorAll('.init.sm')].map((e) => parseFloat(getComputedStyle(e).fontSize)));
  console.log('R6-G4 Sports small bib initial is at least 12 px', ok(fs.length > 0 && Math.min(...fs) >= 12), Math.min(...fs)); await p.context().close(); }
// Round 6 (builder B)
// R6-H2. Ask with the on-screen keys open: no key lies under the pictures, and "dogs ok" can be typed by tapping, from the youngest's page and on a portrait tablet
for (const [look, pg, w, h] of [['sports', 'kid&kid=2', 1280, 800], ['glass', 'kid&kid=2', 1024, 768], ['fridge', 'kid&kid=2', 1920, 1080], ['orbit', 'planner', 820, 1180], ['sports', 'planner', 768, 1024]]) {
  page = await open(`look=${look}&page=${pg}`); await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
  await page.getByRole('button', { name: /^Ask/ }).first().click(); await page.waitForTimeout(700);
  await page.locator('fh-chat').getByRole('button', { name: 'Keyboard' }).click(); await page.waitForTimeout(500);
  const kb = await page.evaluate(() => { const sr = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-chat').shadowRoot, keys = [...sr.querySelectorAll('.key')];
    const covered = keys.filter((k) => { const r = k.getBoundingClientRect(), e = sr.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(e === k || k.contains(e)) || r.bottom > innerHeight; }).length;
    return { keys: keys.length, covered, thread: Math.round(sr.querySelector('.thread').getBoundingClientRect().height) }; });
  for (const c of 'dogs ok') { const pt = await page.evaluate((c) => { const sr = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-chat').shadowRoot, k = [...sr.querySelectorAll('.key')].find((k) => c === ' ' ? k.classList.contains('space') : k.textContent.trim().toLowerCase() === c), r = k.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, c); await page.mouse.click(pt[0], pt[1]); await page.waitForTimeout(60); }
  const typed = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-chat').shadowRoot.querySelector('.field').value);
  console.log(`R6-H2 ${look} ${pg} ${w}x${h}: keys covered (expect 0 of 44):`, kb.covered, 'of', kb.keys, '| typed by tapping:', JSON.stringify(typed), typed.toLowerCase() === 'dogs ok', '| conversation at least 80 px high:', kb.thread >= 80, kb.thread);
  await page.locator('fh-chat').getByRole('button', { name: 'Keyboard' }).click(); await page.waitForTimeout(300);
  console.log('   keys closed: the pictures are back:', await page.evaluate(() => { const st = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-chat').shadowRoot.querySelector('.starters'); return getComputedStyle(st).display !== 'none' && st.getBoundingClientRect().height > 60; }));
  await page.close(); }
// R6-H3. "Spend 50 points?" reads on its row in every look (it was white on white in Home Ground, Fridge and Orbit), by day and in the evening
for (const look of ['sports', 'fridge', 'orbit', 'glass']) for (const time of ['16:20', '18:10']) { page = await open(`look=${look}&page=kid&kid=0`, time);
  await page.locator('fh-kid button.rw').first().click(); await page.waitForTimeout(1500);
  const cr = await page.evaluate(() => { const row = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('.rw.ask'); if (!row) return ['no spend row'];
    const par = (n) => n.parentElement || (n.getRootNode() instanceof ShadowRoot ? n.getRootNode().host : null), cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgb = (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const bg = (e) => { const stack = []; for (let n = e; n; n = par(n)) { const c = rgb(getComputedStyle(n).backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] >= 1) break; } } let out = [255, 255, 255]; for (const c of stack.reverse()) out = out.map((v, i) => v * (1 - c[3]) + c[i] * c[3]); return out; };
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    return [...row.querySelectorAll('.q, button')].map((e) => { const a = lum(rgb(getComputedStyle(e).color)), b = lum(bg(e)); return Number(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2)); }); });
  console.log(`R6-H3 ${look} ${time}: spend question and its two buttons at 4.5:1 or better:`, cr.length === 3 && cr.every((x) => x >= 4.5), cr.join(' '));
  await page.close(); }
// R6-H4. the youngest on the wall panel (1920x1080) reaches the lower half only: his studio's way back, colours and kinds of thing, and the jukebox's coins and "adds a song", are all below the middle
page = await open('look=sports&page=kid&kid=2&studio=1'); await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(700);
console.log('R6-H4 studio tops (expect all >= 540):', JSON.stringify(await page.evaluate(() => { const sr = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('fh-studio').shadowRoot, y = (q) => Math.round(sr.querySelector(q).getBoundingClientRect().top); return { back: y('[aria-label^="Back"]'), surprise: y('[aria-label="Surprise look"]'), kinds: y('.tabs'), colours: y('.sw'), done: y('.sfoot') }; })));
await page.close();
page = await open('look=sports&page=kid&kid=0&studio=1'); await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(700);
console.log('   an older child’s studio keeps its tabs and Back at the top:', await page.evaluate(() => { const sr = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('fh-studio').shadowRoot, y = (q) => sr.querySelector(q).getBoundingClientRect().top; return y('.tabs') < 300 && y('[aria-label^="Back"]') < 300; }));
await page.close();
page = await open('look=sports&page=music&mtab=juke&juke=1'); await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(700);
console.log('R6-H4 jukebox tops (expect both >= 540):', JSON.stringify(await page.evaluate(() => { const sr = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot, y = (q) => Math.round(sr.querySelector(q).getBoundingClientRect().top); return { coins: y('.coin'), adds: y('.acts .primary') }; })));
await page.close();
// R6-H6. five quick ticks on a slow connection (each answer takes 3 s): the count of done jobs never goes back, and every tick is kept
for (const kid of [0, 1]) { page = await open(`look=sports&page=kid&kid=${kid}&slow=3000`);
  const jobs = () => page.evaluate(() => { const rows = [...document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelectorAll('[data-uid]')]; return { done: rows.filter((r) => r.classList.contains('done')).length, left: rows.filter((r) => !r.classList.contains('done')).map((r) => r.dataset.uid) }; });
  const first = await jobs(), seen = [first.done]; let taps = 0;
  for (let i = 0; i < 5; i++) { const now = await jobs(); if (!now.left.length) break; await page.evaluate((u) => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector(`[data-uid="${u}"]`).click(), now.left[0]); taps++; for (let k = 0; k < 3; k++) { await page.waitForTimeout(500); seen.push((await jobs()).done); } }
  for (let k = 0; k < 14; k++) { await page.waitForTimeout(500); seen.push((await jobs()).done); }
  const calls = await page.evaluate(() => (window.__calls || []).filter((c) => /update_item/.test(c) && /completed/.test(c)).length);
  console.log(`R6-H6 kid ${kid}: ${taps} quick ticks on a slow connection; done count never goes back:`, kid === 1 || seen.every((n, i) => !i || n >= seen[i - 1]), '| every tick reached Home Assistant:', calls === taps, `${calls}/${taps}`, '| none left unticked on the page:', (await jobs()).left.length === (kid === 1 ? 0 : first.left.length - taps));
  await page.close(); }
// R6-H8. a text field on the add sheet shows a focus ring in the looks that draw it as an underline
for (const look of ['sports', 'fridge', 'orbit']) { page = await open(`look=${look}&page=planner&sheet=add`);
  console.log(`R6-H8 ${look}: the focused field has a 3 px outline:`, await page.evaluate(() => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-add-event').shadowRoot.querySelector('input.field'); f.focus(); const c = getComputedStyle(f); return c.outlineStyle === 'solid' && c.outlineWidth === '3px'; }));
  await page.close(); }
// R6-H9. Home Ground at 1024x768: a seven-letter name stays on one line in the page title
page = await open('look=sports&page=kid&kid=1'); await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(600);
console.log('R6-H9 lines in the name (expect 1):', await page.evaluate(() => { const n = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('.name'), g = document.createRange(); g.selectNodeContents(n); return new Set([...g.getClientRects()].map((r) => Math.round(r.top))).size; }));
// R6-H10/H11. the same screen's rail: the small player's second line is not cut, and "+10 min" keeps clear of its pill's edge
await HOME(page); await page.getByRole('button', { name: 'Planner', exact: true }).click(); await page.waitForTimeout(700);
console.log('R6-H10 small player lines cut (expect 0):', await page.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.np .np-row span.muted')].filter((s) => s.scrollWidth > s.clientWidth + 1 || s.scrollHeight > s.clientHeight + 1).length),
  '| R6-H11 least room beside a quick pill’s words (expect >= 6):', await page.evaluate(() => Math.round(Math.min(...[...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.quick')].filter((b) => b.getBoundingClientRect().width).map((b) => { const r = b.getBoundingClientRect(), g = document.createRange(); g.selectNodeContents(b); const t = g.getBoundingClientRect(); return Math.min(t.left - r.left, r.right - t.right); })))));
await page.close();
// ---------- round 7 ----------
const sr = (sel) => `document.querySelector('family-hub-card').shadowRoot.querySelector('${sel}').shadowRoot`;
const srStudio = `${sr('fh-kid')}.querySelector('fh-studio').shadowRoot`;
const ratio = `(a, b) => { const l = (c) => { let m = c.match(/[\\d.]+/g).map(Number); if (/^color\\(srgb/.test(c)) m = m.map((v, i) => (i < 3 ? v * 255 : v)); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); }; const A = l(a), B = l(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); }`;
// R7-M2. the reward's name under "Spend … ?" is readable on the selected row in every Glass theme and every look (it was 1.01:1 in Space)
{ const bad = [];
  for (const look of ['glass&theme=sea', 'glass&theme=sunset', 'glass&theme=reef', 'glass&theme=bush', 'glass&theme=space', 'fridge', 'orbit', 'sports']) for (const time of ['16:20', '18:10']) { const p = await openAt(1280, 800, `look=${look}&page=kid&kid=0`, time);
    await p.locator('fh-kid button.rw', { hasText: 'Extra screen time' }).click(); await p.waitForTimeout(400);
    const c = await p.evaluate(`(() => { const ratio = ${ratio}; const row = ${sr('fh-kid')}.querySelector('.rw.ask'); if (!row) return 0; const m = row.querySelector('.q .muted'); let bg = ''; for (let x = row; x && !bg; x = x.parentElement) { const v = getComputedStyle(x).backgroundColor, n = v.match(/[\\d.]+/g); if (n && (n.length < 4 || +n[3] > 0.5)) bg = v; } return ratio(getComputedStyle(m).color, bg || 'rgb(255,255,255)'); })()`);
    if (c < 4.5) bad.push(`${look} ${time} ${c.toFixed(2)}`); await p.context().close(); }
  console.log('R7-M2 spend confirmation: the reward name is at least 4.5:1 everywhere', ok(!bad.length), bad.join(' | ')); }
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
// R7-M4. Ask with the on-screen keys on a short screen (1312x668): every key is whole and inside the sheet, a sentence with a space can be typed by tapping, the conversation keeps 90 px or more, and the options' words fit their buttons
{ const bad = [];
  for (const look of ['glass', 'fridge', 'orbit', 'sports']) for (const [w, h, from] of [[1312, 668, 'page=planner'], [1312, 668, 'page=kid&kid=0'], [1312, 668, 'page=kid&kid=2'], [1024, 768, 'page=planner'], [1280, 800, 'page=kid&kid=2']]) { const p = await openAt(w, h, `look=${look}&${from}`);
    await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c._openChat(); }); await p.waitForTimeout(600);
    await p.locator('fh-chat input.field').click(); await p.waitForTimeout(500);
    for (const k of ['h', 'i', ' ', 'm', 'u', 'm']) await (k === ' ' ? p.locator('fh-chat .key.space') : p.locator('fh-chat .key', { hasText: new RegExp('^' + k + '$', 'i') }).first()).click();
    const r = await p.evaluate(`(() => { const R = ${sr('fh-chat')}, sheet = document.querySelector('family-hub-card').shadowRoot.querySelector('.chatsheet').getBoundingClientRect(); let cut = 0;
      for (const k of R.querySelectorAll('.key')) { const b = k.getBoundingClientRect(), e = R.elementFromPoint(b.left + b.width / 2, b.bottom - 3); if (b.bottom > Math.min(sheet.bottom, innerHeight) + 0.5 || b.top < sheet.top || b.height < 43.5 || b.width < 43.5 || (e !== k && !k.contains(e))) cut++; }
      const wide = [...R.querySelectorAll('.opts .pill')].filter((b) => { const g = document.createRange(); g.selectNodeContents(b); return g.getBoundingClientRect().width > b.getBoundingClientRect().width + 1; }).length;
      return { typed: R.querySelector('input').value, keys: R.querySelectorAll('.key').length, cut, thread: Math.round(R.querySelector('.thread').getBoundingClientRect().height), starters: [...R.querySelectorAll('.starter')].filter((s) => s.getClientRects().length).length, wide }; })()`);
    if (r.typed !== 'Hi mum' || r.keys < 40 || r.cut || r.wide || (h < 720 && (r.thread < 90 || r.starters))) bad.push(`${look} ${w}x${h} ${from} ${JSON.stringify(r)}`); await p.context().close(); }
  console.log('R7-M4 Ask keys on a short screen: none cut, typing works, 90 px of conversation, option words fit', ok(!bad.length), bad.join(' | ')); }
// R7-M5. the youngest's "Coming up" at 1312x668 (pictures since 0.31.0; the older boys' week is rows): the first one is inside the card, the list scrolls with its fade, and both tabs stay in view; the older boys' studio button is not cut by the hero card
{ const bad = [];
  for (const look of ['glass', 'fridge', 'orbit', 'sports']) for (const kid of [2, 1]) { const p = await openAt(1312, 668, `look=${look}&page=kid&kid=${kid}`);
    await p.locator('fh-kid button.tab', { hasText: /Coming up|My week/ }).click(); await p.waitForTimeout(400);
    const r = await p.evaluate(`(() => { const R = ${sr('fh-kid')}, card = R.querySelector('.tabcard'), c = card.getBoundingClientRect(), body = card.querySelector('.tabbody'), first = card.querySelector('.wk, .soonpic').getBoundingClientRect();
      const tabs = [...card.querySelectorAll('button.tab')].every((b) => { const t = b.getBoundingClientRect(), e = R.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2); return t.top >= c.top && t.bottom <= c.bottom + 1 && (e === b || b.contains(e)); });
      const st = R.querySelector('button.studio'), hero = R.querySelector('.hero').getBoundingClientRect();
      return { first: Math.round(first.top - c.top), inBody: first.top >= body.getBoundingClientRect().top - 1, scrolls: body.scrollHeight > body.clientHeight + 6, cue: body.hasAttribute('data-more'), tabs, studioCut: st ? Math.max(0, Math.round(st.getBoundingClientRect().bottom - hero.bottom)) : 0 }; })()`);
    if (r.first < 0 || !r.inBody || !r.tabs || r.scrolls !== r.cue || r.studioCut > 1) bad.push(`${look} kid${kid} ${JSON.stringify(r)}`); await p.context().close(); }
  console.log('R7-M5 kid page at 1312x668: first "Coming up" row inside the card, tabs in view, studio button whole', ok(!bad.length), bad.join(' | ')); }
// R7-M6. the youngest's studio on the wall panel: every tile of every kind is in the lower half, in one row that moves sideways with an arrow; an older boy's studio keeps its grid
{ const bad = [];
  for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const p = await openAt(1920, 1080, `look=${look}&page=kid&kid=2&studio=1`);
    const n = await p.locator('fh-studio [role=tab]').count();
    for (let i = 0; i < n; i++) { await p.locator('fh-studio [role=tab]').nth(i).click(); await p.waitForTimeout(250);
      const r = await p.evaluate(`(() => { const R = ${srStudio}, g = R.querySelector('.grid'), tops = [...R.querySelectorAll('.tile')].map((t) => t.getBoundingClientRect().top); return { high: tops.filter((t) => t < innerHeight / 2).length, rows: new Set(tops.map(Math.round)).size, wide: g.scrollWidth > g.clientWidth + 6, fwd: getComputedStyle(R.querySelector('.rowgo.fwd')).visibility === 'visible' || g.scrollLeft > 6 }; })()`);
      if (r.high || r.rows !== 1 || (r.wide && !r.fwd)) bad.push(`${look} tab${i} ${JSON.stringify(r)}`); }
    await p.locator('fh-studio [role=tab]').nth(1).click(); await p.waitForTimeout(250);
    const x0 = await p.evaluate(`${srStudio}.querySelector('.grid').scrollLeft`); await p.locator('fh-studio .rowgo.fwd').click(); await p.waitForTimeout(900);
    const x1 = await p.evaluate(`${srStudio}.querySelector('.grid').scrollLeft`); if (!(x1 > x0 + 100)) bad.push(`${look} arrow ${x0}->${x1}`);
    await p.context().close(); }
  { const p = await openAt(1920, 1080, 'look=glass&page=kid&kid=0&studio=1'); const rows = await p.evaluate(`new Set([...${srStudio}.querySelectorAll('.tile')].map((t) => Math.round(t.getBoundingClientRect().top))).size`); if (rows < 2) bad.push('kid0 grid became a row'); await p.context().close(); }
  console.log('R7-M6 the youngest’s studio on the wall: every tile in the lower half, one sliding row with an arrow', ok(!bad.length), bad.join(' | ')); }
// R7-m10. a timed event that has finished leaves "Coming up"; in the evening the youngest still has Ask within reach on the wall
{ const p = await openAt(1920, 1080, 'look=glass&page=kid&kid=2', '19:30');
  const r = await p.evaluate(`(() => { const R = ${sr('fh-kid')}; const a = R.querySelector('button.askbtn'); return { today: [...R.querySelectorAll('.wk')].filter((w) => /Today/.test(w.textContent)).map((w) => w.textContent.replace(/\\s+/g, ' ').trim()), ask: a ? Math.round(a.getBoundingClientRect().top) : -1 }; })()`);
  console.log('R7-m10 at 7:30 pm nothing that has finished is under Today:', JSON.stringify(r.today), ok(!r.today.some((t) => /7:00 pm/.test(t))), '| the youngest’s Ask button is in the lower half:', r.ask, ok(r.ask >= 540)); await p.context().close(); }
// R7-N. the event sheet shows the calendar's notes as words only: line breaks kept, markup never becomes an element, nothing runs
{ const p = await openAt(1280, 800, 'look=glass&page=planner&view=day'); const out = [];
  for (const [title, want] of [['Swimming squad', /^Bring:\ngoggles and cap\ntowel\nMeet at the far end of pool 2\.\nTimetable: https:\/\/example\.org\/squad$/], ['Clarinet lesson', /^Bring the blue book and a spare reed$/]]) {
    await p.evaluate((title) => { const c = document.querySelector('family-hub-card'); const ev = [...(c._events ?? []), ...(c._soon ?? [])].find((e) => e.title === title); c._openEvent(ev, ev.start); }, title); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet[data-sheet="event"]'), n = s?.querySelector('.evnotes'); return n ? { text: n.textContent, kids: n.querySelectorAll('*').length, bad: s.querySelectorAll('img, script, a[href], iframe').length, label: s.querySelector('.evnotebox .label')?.textContent, ws: getComputedStyle(n).whiteSpace, fs: parseFloat(getComputedStyle(n).fontSize), pwned: window.__pwned ?? 0 } : null; });
    out.push(`${title}: ${JSON.stringify(r?.text)} ${ok(!!r && want.test(r.text) && !r.kids && !r.bad && r.label === 'Notes' && r.ws === 'pre-line' && r.fs >= 15 && !r.pwned)}`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400); }
  await p.evaluate(() => { const c = document.querySelector('family-hub-card'); const ev = [...(c._events ?? []), ...(c._soon ?? [])].find((e) => e.title === 'Gym'); c._openEvent(ev, ev.start); }); await p.waitForTimeout(400);
  out.push('no notes, no block: ' + ok(await p.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet[data-sheet="event"]'); return !!s && !s.querySelector('.evnotebox'); })));
  console.log('R7-N event notes as plain text |', out.join(' | ')); await p.context().close(); }

// ---- owner's decisions of 13 November (0.27.0) ----
// D3. a child's rank is in his own studio and nowhere else (since 0.31.0 not on his page either): not on a brother's page, the dock, the morning board, the jukebox or any other page (words and spoken labels)
{ const RANK = /\b(Explorer|Ranger|Navigator|Captain|Commander|Admiral|Legend|Mythic|Cosmic)\b/;
  const words = (p) => p.evaluate(() => { const out = []; const walk = (root) => { for (const e of root.querySelectorAll('*')) { for (const a of ['aria-label', 'title', 'alt', 'aria-valuetext']) { const v = e.getAttribute(a); if (v) out.push(v); } for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) out.push(n.textContent); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document.querySelector('family-hub-card').shadowRoot); return out.join(' \n '); });
  const p = await openAt(1280, 800, 'look=glass&page=kid&kid=0'); const out = [], own = [];
  for (let k = 0; k < 3; k++) { await p.evaluate((k) => { const c = document.querySelector('family-hub-card'), kid = c.shadowRoot.querySelector('fh-kid'); if (kid) kid._studio = false; c._kid = k; c._page = 'kid'; }, k); await p.waitForTimeout(500);
    const page = RANK.exec(await words(p));
    await p.evaluate(() => { document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid')._studio = true; }); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot, st = c.querySelector('fh-kid').shadowRoot.querySelector('fh-studio').shadowRoot; return { chips: [...st.querySelectorAll('.rankline .rank')].map((e) => e.textContent.trim()), outside: [...c.querySelectorAll('header, nav.dock')].map((e) => e.innerText).join(' ') }; });
    own.push(r.chips.join('/') || '(none: pictures)'); out.push(ok(r.chips.length <= 1 && !RANK.test(r.outside) && !page)); }
  const seen = [];
  for (const [pg, t] of [['planner'], ['planner&view=day'], ['planner&view=month'], ['morning', '07:10'], ['groceries'], ['doodle'], ['home'], ['weather'], ['music&mtab=juke&juke=1'], ['music&mview=house'], ['music&mtab=shelves'], ['music&mtab=call'], ['planner&sheet=themes'], ['planner&sheet=sitter']]) {
    const q = await openAt(1280, 800, 'look=glass&page=' + pg, t); const m = RANK.exec(await words(q)); if (m) seen.push(pg + ': ' + m[0]); await q.context().close(); }
  const src = fs.readdirSync(path.join(ROOT, 'src')).filter((f) => f.endsWith('.ts') && !['studio.ts', 'avatar.ts'].includes(f)).filter((f) => /levelInfo|\bRANKS\b|nextRank/.test(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')));
  console.log('D3 rank in the child’s own studio only (not on his page) | own studios:', own.join(' ; '), out.join(' '), '| a rank read on any other page:', seen.join(' ; ') || 'none', ok(!seen.length), '| other source files that read ranks:', src.join(', ') || 'none', ok(!src.length)); await p.context().close(); }

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

// D10. keep_on: All off leaves those on (and anything in a group named there, and any group holding one), and says how many it kept
{ const run = async (qs) => { const p = await openAt(1280, 800, 'look=glass&page=planner' + qs); await p.evaluate(() => { window.__calls = []; }); await p.locator('family-hub-card .dock [data-nav=lights-off]').click(); await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ off: (window.__calls || []).filter((c) => /^light\.turn_off/.test(c)).join(' || '), toast: (document.querySelector('family-hub-card').shadowRoot.querySelector('.toast')?.innerText ?? '').replace(/\s+/g, ' ').trim() })); await p.context().close(); return r; };
  const none = await run(''), one = await run('&keep=1'), grp = await run('&keep=group');
  console.log('D10 no keep_on (as before):', none.toast, ok(/^Lights off/.test(none.toast) && /light\.max/.test(none.off)));
  console.log('D10 keep_on: [light.max]:', one.toast, '|', one.off.slice(0, 120), ok(/^All off \(1 thing kept on\)/.test(one.toast) && /Undo/.test(one.toast) && !/light\.max/.test(one.off) && /light\.kitchen/.test(one.off) && /light\.lounge/.test(one.off)));
  console.log('D10 keep_on: a group:', grp.toast, '|', grp.off.slice(0, 120), ok(/^All off \(2 things kept on\)/.test(grp.toast) && !/light\.(max|stairs_night|night_lights|bedrooms)/.test(grp.off) && /light\.kitchen/.test(grp.off) && /light\.lounge/.test(grp.off)));
  const p = await openAt(1280, 800, 'look=glass&page=planner&keep=1');
  const v = await p.evaluate(() => { const c = document.querySelector('family-hub-card'), tryIt = (k) => { try { document.createElement('family-hub-card').setConfig({ ...c._config, keep_on: k }); return 'accepted'; } catch (e) { return String(e.message); } }; return [tryIt('light.max'), tryIt([1, 2]), tryIt([]), tryIt(['light.a'])]; });
  console.log('D10 setConfig: a string', JSON.stringify(v[0]), '| numbers', JSON.stringify(v[1]), '| empty list', v[2], '| list of ids', v[3], ok(/keep_on should be a list/.test(v[0]) && /keep_on should be a list/.test(v[1]) && v[2] === 'accepted' && v[3] === 'accepted'));
  // everything kept: nothing to switch, and it says so
  await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, keep_on: ['light.max', 'light.kitchen', 'light.lounge', 'light.panel_backlight'] }); window.__calls = []; }); await p.locator('family-hub-card .dock [data-nav=lights-off]').click(); await p.waitForTimeout(500);
  const t = await p.evaluate(() => ({ toast: (document.querySelector('family-hub-card').shadowRoot.querySelector('.toast')?.innerText ?? '').trim(), n: (window.__calls || []).filter((c) => /^light\.turn_off/.test(c)).length }));
  console.log('D10 every light that is on is kept:', t.toast, '| calls', t.n, ok(/^Nothing else to turn off \(4 things kept on\)$/.test(t.toast) && t.n === 0)); await p.context().close(); }

// D16. Sea & Sun has a horizon line in its own background (so it is there with the ambient scene off and in calm mode); other themes are as they were
{ const bg = async (qs) => { const p = await openAt(1280, 800, qs); const r = await p.evaluate(() => { const fh = document.querySelector('family-hub-card').shadowRoot.querySelector('.fh'), b = getComputedStyle(fh).backgroundImage; return { grad: (b.match(/linear-gradient/g) || []).length, img: /url\(/.test(b), stop: /57%/.test(b) }; }); await p.context().close(); return r; };
  const sea = await bg('look=glass&theme=sea&page=planner'), off = await bg('look=glass&theme=sea&page=planner&ambient=0&calm=1'), space = await bg('look=glass&theme=space&page=planner'), sunset = await bg('look=glass&theme=sunset&page=planner');
  console.log('D16 Sea horizon drawn in the background:', JSON.stringify(sea), ok(sea.grad === 1 && sea.img && sea.stop), '| ambient off and calm:', ok(off.grad === 1 && off.stop), '| Space and Sunset untouched:', ok(space.grad === 0 && sunset.grad === 0 && space.img)); }

// D18. Sports: filled yellow is for action only. Nothing that is merely current or chosen is yellow; chosen still stands out by at least 3:1
{ const YEL = ['rgb(255, 214, 10)', 'rgb(255, 246, 196)'];
  const scan = (p) => p.evaluate((YEL) => { const hits = [], card = document.querySelector('family-hub-card'); const walk = (root) => { for (const e of root.querySelectorAll('*')) { const cs = getComputedStyle(e); if (cs.display !== 'none' && e.getClientRects().length) for (const ps of [null, '::before', '::after']) { const c = ps ? getComputedStyle(e, ps) : cs; if (ps && (c.content === 'none' || c.content === 'normal')) continue;
        if (YEL.includes(c.backgroundColor) || YEL.some((y) => c.backgroundImage.includes(y) && !/url\(/.test(c.backgroundImage)) || YEL.some((y) => c.boxShadow.includes(y)) || (c.textDecorationLine.includes('underline') && YEL.includes(c.textDecorationColor))) hits.push((e.getRootNode().host?.localName ?? '') + ' ' + e.localName + '.' + String(e.getAttribute('class') || '').trim().split(/\s+/).join('.') + (ps ?? '')); } if (e.shadowRoot) walk(e.shadowRoot); } }; walk(card.shadowRoot); return [...new Set(hits)]; }, YEL);
  // the classes that are an action: the hero button of a page or sheet, the play key (music and the radar), the big "I did it" and the talk button. A record's paper label is a drawing, not a state
  const ACTION = /\.(lead|primary|go|talk)\b|button\.pic\.[^ ]*now[^ ]*::after|\.play\b|fh-radar button/, ART = /fh-music i\.disc/, bad = [], heroes = [];
  for (const [pg, t] of [['planner'], ['planner&view=day'], ['planner&view=month'], ['kid&kid=0'], ['kid&kid=2'], ['home'], ['weather'], ['groceries'], ['morning', '07:10'], ['music&mview=house'], ['music&mview=list'], ['music&mview=desk&moments=1'], ['music&mtab=juke&juke=1'], ['music&mtab=radio'], ['music&mtab=call'], ['planner&sheet=add'], ['planner&sheet=timer'], ['planner', '19:20'], ['home', '19:20'], ['music&mtab=juke&juke=1', '19:20']]) {
    const p = await openAt(1280, 800, 'look=sports&page=' + pg, t); const hits = await scan(p); for (const h of hits.filter((x) => !ART.test(x))) (ACTION.test(h) ? heroes : bad).push(`${pg}${t ? '@' + t : ''}: ${h}`); await p.context().close(); }
  console.log('D18 yellow on anything that is not an action:', bad.length ? bad.slice(0, 12).join(' ; ') : 'none', ok(!bad.length), '| yellow actions found:', [...new Set(heroes.map((h) => h.split(': ')[1].trim()))].length, 'kinds', ok(heroes.length > 0));
  const p = await openAt(1280, 800, 'look=sports&page=planner');
  const r = await p.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot; const lum = (s) => { const m = s.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); }, cr = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 10) / 10; };
    const bgOf = (e) => getComputedStyle(e).backgroundColor, solid = (s) => (/rgba\(.*, 0\)|transparent/.test(s) ? 'rgb(236, 239, 230)' : s);
    const segOn = c.querySelector('.seg button[aria-pressed="true"]'), segOff = c.querySelector('.seg button[aria-pressed="false"]'), today = c.querySelector('.col.today'), other = c.querySelector('.col:not(.today)');
    const dockOn = c.querySelector('.dock .item[aria-current="page"] svg.i'), dockOff = c.querySelector('.dock .item:not(.kidbtn)[aria-current="false"] svg.i') ?? c.querySelector('.dock .item:not(.kidbtn):not([aria-current="page"]) svg.i'), add = c.querySelector('[data-act="add"]');
    const outline = (getComputedStyle(today).boxShadow.match(/rgba?\([^)]+\)/) || [''])[0];
    return { seg: cr(bgOf(segOn), solid(bgOf(segOff))), todayOutline: outline, today: cr(outline, solid(bgOf(other))), todayW: /3px/.test(getComputedStyle(today).boxShadow), dock: cr(bgOf(dockOn), solid(bgOf(dockOff))), dockLine: getComputedStyle(c.querySelector('.dock .item[aria-current="page"]')).textDecorationColor, add: bgOf(add) }; });
  console.log('D18 chosen against not chosen: view chip', r.seg + ':1', '| today’s outline', r.todayOutline, r.today + ':1 against the next column', '| this page in the dock', r.dock + ':1', r.dockLine, '| Add is', r.add, ok(r.seg >= 3 && r.today >= 3 && r.todayW && r.dock >= 3 && r.add === 'rgb(255, 214, 10)')); await p.context().close(); }

// leftovers: the Orbit medication chip says how many and names nobody at 1024 x 768 (0.30.0: names are inside the sheet); the Sports timer pills keep "+10 min" on one line there
{ for (const v of ['day', 'week']) { const p = await openAt(1024, 768, 'look=orbit&page=planner&view=' + v);
    const r = await p.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('.cap[data-kind="med"]'); return m ? { text: m.textContent.replace(/\s+/g, ' ').trim(), label: m.getAttribute('aria-label'), cut: m.scrollWidth > m.clientWidth + 1, capCut: m.parentElement.scrollWidth > m.parentElement.clientWidth + 1 } : null; });
    console.log(`leftover: Orbit medication chip at 1024 x 768 (${v}):`, JSON.stringify(r), ok(!!r && r.text === '2 overdue' && !/Riley|Charlie/.test(r.text + r.label) && !r.cut && !r.capCut)); await p.context().close(); }
  const p = await openAt(1024, 768, 'look=sports&page=planner');
  const q = await p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.quick')].map((b) => { const g = document.createRange(); g.selectNodeContents(b); const t = g.getBoundingClientRect(), o = b.getBoundingClientRect(); return { text: b.textContent.trim(), lines: Math.round(t.height / parseFloat(getComputedStyle(b).fontSize)), gap: Math.round(Math.min(t.left - o.left, o.right - t.right) * 10) / 10, fs: parseFloat(getComputedStyle(b).fontSize), h: Math.round(o.height) }; }));
  console.log('leftover: Sports timer pills at 1024 x 768:', q.map((x) => `${x.text} ${x.lines} line, ${x.gap} px clear, ${x.fs} px`).join(' ; '), ok(q.length === 3 && q.every((x) => x.lines === 1 && x.gap >= 6 && x.fs >= 15 && x.h >= 44))); await p.context().close(); }
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close();
