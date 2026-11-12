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

// 13. header: one row, chips whole or absent, a due medication chip beside the running timer at 7:10 am, "overdue 6:30 am" not cut in Orbit
const hdr = () => page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, hd = r.querySelector('header'), vis = (e) => e.offsetParent !== null;
  const caps = [...hd.querySelectorAll('.capsule .cap')].filter(vis), top = hd.getBoundingClientRect().top;
  return { chips: caps.map((e) => e.innerText.replace(/\s+/g, ' ').trim()).join(' | '), wrapped: caps.filter((e) => e.getBoundingClientRect().top - top > 40).length, cut: caps.filter((e) => e.scrollWidth > e.clientWidth + 1 || [...e.querySelectorAll('span,b')].some((x) => x.scrollWidth > x.clientWidth + 1 && !x.classList.contains('ell'))).length,
    heights: [...new Set([...hd.querySelectorAll('.capsule .cap, .right > *')].filter(vis).map((e) => e.offsetHeight))].join(','), over: hd.scrollWidth - hd.clientWidth, pill: !!hd.querySelector('[data-act=meds]') && vis(hd.querySelector('[data-act=meds]')) }; });
for (const lk of ['glass', 'fridge', 'orbit']) for (const [w, h] of [[1280, 800], [1312, 668], [1920, 1080]]) {
  page = await open('look=' + lk, '07:10'); await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
  const r = await hdr(); console.log(`header ${lk} ${w}x${h} 7:10:`, /due/.test(r.chips) && /\d:\d\d/.test(r.chips) && !r.wrapped && !r.cut && r.heights === '52' && r.over <= 0 && !r.pill ? 'ok' : 'WRONG', JSON.stringify(r)); await page.close(); }
page = await open('look=orbit', '08:10'); await page.setViewportSize({ width: 1280, height: 800 });
await page.evaluate(() => { const c = document.querySelector('family-hub-card'), h = c.hass, S = { ...h.states }; S['input_datetime.fh_med_riley_am'] = { ...S['input_datetime.fh_med_riley_am'], attributes: { timestamp: Date.now() / 1000 } }; S['input_text.fh_med_riley_am_by'] = { ...S['input_text.fh_med_riley_am_by'], state: 'Alex' }; c.hass = { ...h, states: S }; }); await page.waitForTimeout(400);
{ const r = await hdr(); console.log('header orbit, one overdue:', /Overdue 6:30 am · Charlie/.test(r.chips) && !r.cut && !r.wrapped ? 'ok' : 'WRONG', JSON.stringify(r)); }
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
const info = page.getByRole('button', { name: 'House info' }); await info.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
const where = () => page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, a = r.activeElement; return a ? (a.closest('.sheet') ? 'in the sheet' : a.getAttribute('aria-label') || a.className) : 'nowhere'; });
console.log('sheet open:', await page.getByRole('dialog', { name: 'House info' }).count(), '| focus:', await where(), '| phone links:', await page.locator('family-hub-card .sheet a[href^="tel:"]').count());
await page.keyboard.press('Escape'); await page.waitForTimeout(300); console.log('after Escape: sheets', await page.locator('family-hub-card .sheet').count(), '| focus:', await where());
for (const s of ['sitter', 'meds', 'timer', 'themes']) { await page.evaluate((x) => { document.querySelector('family-hub-card')._sheet = x; }, s); await page.waitForTimeout(500);
  console.log(`sheet ${s} between header and dock:`, await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, b = r.querySelector('.scrim > .sheet').getBoundingClientRect(), h = r.querySelector('header').getBoundingClientRect(), d = r.querySelector('nav.dock').getBoundingClientRect(); return b.top >= h.bottom - 1 && b.bottom <= d.top + 1 ? 'ok' : `WRONG ${Math.round(b.top)}–${Math.round(b.bottom)} vs ${Math.round(h.bottom)}–${Math.round(d.top)}`; }), '| close button:', await page.locator('family-hub-card .sheet .xbtn').evaluate((e) => e.offsetWidth + 'x' + e.offsetHeight)); }
await page.keyboard.press('Escape'); await page.locator('family-hub-card .presence').click(); await page.waitForTimeout(300);
console.log('toast:', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, w = r.querySelector('.toasts'), t = w.querySelector('.toast').getBoundingClientRect(), f = r.querySelector('.fh').getBoundingClientRect(); return `role=${w.getAttribute('role')} live=${w.getAttribute('aria-live')} off-centre=${Math.round(Math.abs((t.left + t.right) / 2 - (f.left + f.right) / 2))}px strip-takes-taps=${getComputedStyle(w).pointerEvents !== 'none'}`; }));
await page.close();

// 18. add sheet: the error clears on typing, the toast reads like the summary, two quick taps add one event
page = await open('look=glass&sheet=add&slow=500', '14:20');
await ae('button.lead').click(); await page.waitForTimeout(200); console.log('add: no title:', await ae('.err').innerText());
for (const k of ['S', 'w', 'i', 'm']) await ae('.key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
console.log('add: error after typing:', await ae('.err').count(), '| summary:', await ae('.sum').first().innerText(), '| chip heights:', await ae('.chips button, .durs button, .ampm button, .allday').evaluateAll((els) => [...new Set(els.map((e) => e.offsetHeight))].join(',')));
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
  console.log('Max on the wall: reader', Math.round(rd.width) + ' px, centre y', Math.round(rd.y + rd.height / 2), '(> 540) | stars panel below feelings:', tabs.y > feel.y, '| reward pictures:', (await p.locator('fh-kid .rw .rpic').allInnerTexts()).join(' '), '| reward stars drawn:', await p.locator('fh-kid .rw .sstar').count());
  await p.getByRole('button', { name: /My look/ }).click(); await p.waitForTimeout(300);
  console.log('My look with a job left: studio open', await p.locator('fh-studio').count(), '| toast (expect none):', JSON.stringify(await toastOf(p, 'fh-kid')), '| button reads:', (await p.locator('fh-kid .studio').innerText()).trim(), '| padlock:', await p.locator('fh-kid .studio[data-locked] svg').count());
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
// ---- motion (polish round 2) ----
{ const toast2 = async (p, host) => (await p.locator(`${host} .toast`).allInnerTexts()).join(' ').replace(/\s+/g, ' ').trim();
  const deep = `window.deepAll = (sel) => { const out = []; const walk = (r) => { r.querySelectorAll('*').forEach((e) => { if (e.matches(sel)) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return out; };
    window.cssAnims = () => { const out = new Set(); const walk = (r) => { for (const a of r.getAnimations()) out.add(a); r.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return [...out].filter((a) => a.playState === 'running' && a.animationName && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.animationName); };`;
  // press feedback: a held header button (a .glass.tap) shrinks and dims in Glass and Fridge
  for (const look of ['glass', 'fridge']) { const p = await open(`look=${look}&page=planner`); const b = p.locator('family-hub-card header [data-act="night"]'), bb = await b.boundingBox();
    const idle = await b.evaluate((e) => getComputedStyle(e).transform + ' ' + getComputedStyle(e).opacity);
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(300);
    const held = await b.evaluate((e) => { const cs = getComputedStyle(e), m = /matrix\(([^,]+)/.exec(cs.transform); return { scale: m ? Number(m[1]) : 1, opacity: Number(cs.opacity) }; });
    await p.mouse.move(2, 2); await p.mouse.up(); // let go off the button: nothing is pressed
    console.log(`press feedback (${look}): idle ${idle} | held 300 ms: scale ${held.scale.toFixed(3)} opacity ${held.opacity.toFixed(2)} (expect < 1 and < 1)`); await p.close(); }
  // page change: at most two animations per navigation (the page wrapper's fade and rise), none on the panels inside
  for (const look of ['glass', 'fridge', 'orbit']) { const p = await open(`look=${look}&page=planner`); await p.evaluate(deep); const out = [];
    for (const nav of ['Groceries', 'Music', 'Home', 'Planner', 'Riley']) { await p.evaluate((n) => deepAll('nav button').find((x) => x.textContent.trim() === n).click(), nav); await p.waitForTimeout(40); const a = await p.evaluate(() => cssAnims()); out.push(`${nav} ${a.length}${a.length > 2 ? ' [' + a.join(',') + ']' : ''}`); await p.waitForTimeout(700); }
    console.log(`animations per navigation (${look}; expect at most 2 each):`, out.join(' | '), '| page wrapper at rest: transform', await p.locator('family-hub-card .fh > .body').evaluate((e) => getComputedStyle(e).transform)); await p.close(); }
  // exits: a sheet, the PIN pad, a toast and the night screen fade out before they go
  { const p = await open('look=glass&page=planner&sheet=timer'); await p.evaluate(deep); const at = async (sel, ms) => { await p.waitForTimeout(ms); return p.locator(sel).count(); };
    // timed inside the page, so the test's own round trips do not blur the 80 ms and 300 ms marks
    const timed = (act, sel) => p.evaluate(([act, sel]) => new Promise((done) => { const n = () => deepAll(sel).length, t0 = performance.now(); (0, eval)(act); const r = {};
      setTimeout(() => { r.at80 = n(); r.closing = deepAll(sel).filter((e) => e.hasAttribute('data-closing')).length; }, 80); setTimeout(() => { r.at300 = n(); r.ms = Math.round(performance.now() - t0); done(r); }, 300); }), [act, sel]);
    let r = await timed(`deepAll('.sheet .xbtn')[0].click()`, '.scrim'); console.log('sheet exit: there at 80 ms', r.at80, 'closing', r.closing, '| gone at 300 ms', r.at300 === 0);
    await p.locator('family-hub-card header [data-act="looks"]').click(); await p.waitForTimeout(400); const pad = await p.locator('fh-pin').count();
    r = await timed(`deepAll('fh-pin')[0].shadowRoot.querySelector('.grid button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }))`, 'fh-pin'); console.log('PIN pad exit: open', pad, '| there at 80 ms', r.at80, 'closing', r.closing, '| gone at 300 ms', r.at300 === 0);
    await p.evaluate(() => document.querySelector('family-hub-card')._say('Test line')); await p.waitForTimeout(300);
    r = await timed(`(() => { const c = document.querySelector('family-hub-card'); c._toast = ''; })()`, '.toasts .toast'); console.log('toast exit: there at 80 ms', r.at80, 'closing', r.closing, '| gone at 300 ms', r.at300 === 0);
    await p.getByRole('button', { name: 'Night mode' }).click(); await p.waitForTimeout(600); await p.evaluate(deep); await p.locator('family-hub-card .night').click();
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
  await p.locator('family-hub-card nav .kidbtn').nth(1).click(); await p.waitForTimeout(400); const onOther = await chip.count();
  await p.getByRole('button', { name: 'Planner' }).click(); await p.waitForTimeout(500);
  const label = await chip.getAttribute('aria-label').catch(() => 'MISSING'), h = (await chip.boundingBox().catch(() => null))?.height;
  await p.getByRole('button', { name: 'Groceries' }).click(); await p.waitForTimeout(400); const kept = await chip.count();
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
  console.log('R2a week cards with a place:', await page.locator('family-hub-card .ev .loc').count(), '| each on one line:', await page.locator('family-hub-card .ev .loc').evaluateAll((els) => els.filter((e) => e.offsetParent).every((e) => e.offsetHeight < 22))); }
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
  await page.locator('fh-chat input.field').click(); await page.waitForTimeout(300);
  const n = await page.locator('family-hub-card .ainote').boundingBox(), sub = await page.locator('family-hub-card .chatsheet .shead .muted').boundingBox(), tops = await page.locator('fh-chat .opts .pill').evaluateAll((els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top)))].length);
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
    const tx = (e) => e.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim(), tiles = [...r.querySelectorAll('.tile')].map((e) => e.getBoundingClientRect()), bars = [...r.querySelectorAll('.kgo')].map((e) => e.getBoundingClientRect());
    return { fam: [...r.querySelectorAll('.fam .fev')].map(tx), cols: [...r.querySelectorAll('.kcol')].map((k) => [...k.querySelectorAll('.mev2')].map(tx).join(' ; ')), tiles: tiles.length, tileMin: Math.round(Math.min(...tiles.map((b) => Math.min(b.width, b.height))) / z), tileTop: Math.round(Math.min(...tiles.map((b) => b.top))), bars: bars.length, barTop: Math.round(Math.min(...bars.map((b) => b.top))), kids: r.querySelectorAll('.kcol').length, gotx: [...r.querySelectorAll('.kgo .lchip')].map(tx), half: innerHeight / 2, progress: r.querySelectorAll('.kcol .stars, .kcol .teambar, .kcol [role="progressbar"]').length }; });
  console.log('R4-3 morning board family strip:', mb.fam.join(' ; '), ok(mb.fam.some((x) => /^until 6:00 am ?Road works/.test(x))), '| Riley:', mb.cols[0], ok(/continues ?Camp/.test(mb.cols[0])));
  console.log('R4-4a family events once across the top, not in the columns:', ok(mb.fam.some((x) => /Bins out/.test(x)) && !mb.cols.some((c) => /Bins out|Road works/.test(c))), '| picture tiles:', mb.tiles, 'smallest', mb.tileMin, 'px (expect >= 72)', ok(mb.tiles > 0 && mb.tileMin >= 72), '| tiles in the lower half: top', mb.tileTop, '>', mb.half, ok(mb.tileTop > mb.half),
    '| a countdown for each child:', mb.bars, 'of', mb.kids, mb.gotx.join(' ; '), ok(mb.bars === mb.kids && mb.barTop > mb.half && mb.gotx.every((x) => /Leave \d/.test(x))), '| per-child job progress (expect 0):', mb.progress);
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
  await p.locator('family-hub-card nav.dock [data-nav="pencil"]').click(); await p.waitForTimeout(900);
  const dd = () => p.evaluate(() => { const d = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-doodle'), tops = [...d.shadowRoot.querySelectorAll('.brushes button')].map((e) => e.getBoundingClientRect()); return { low: d.hasAttribute('low'), n: tops.length, minTop: Math.round(Math.min(...tops.map((b) => b.top))), maxBottom: Math.round(Math.max(...tops.map((b) => b.bottom))), small: tops.filter((b) => Math.min(b.width, b.height) < 43.5).length, pad: Math.round(d.shadowRoot.querySelector('.pad').getBoundingClientRect().height), vh: innerHeight }; });
  let d = await dd();
  console.log('R4-4c Doodle opened from his page: colours and brushes along the bottom:', JSON.stringify(d), ok(d.low && d.minTop > half && d.maxBottom <= d.vh && !d.small && d.pad > 250));
  await p.locator('family-hub-card nav.dock [data-nav="calendar"]').click(); await p.waitForTimeout(500); await p.locator('family-hub-card nav.dock [data-nav="pencil"]').click(); await p.waitForTimeout(900); d = await dd();
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
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close();
