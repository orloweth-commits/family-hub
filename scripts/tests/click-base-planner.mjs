// click-base, planner part (split from click-base.mjs by page, 23 Nov 2026: plan section 3, backlog 52 and 34): the planner and the shared header and sheets: the time dial, date picker, place finder, emergency button, medicine, Ask, the header, a failed read, the rail, the kitchen timer, sheets, the add sheet, the PIN pad, undo, events.
// Each section runs in its own block: one that stops (a missing element) prints a FAIL line naming it and the next section carries on (backlog 34).
import fs from 'node:fs'; import path from 'node:path';
import { browser, ctx, srv, errs, PORT, PREV, ROOT, HOME, MORE, open, openAt, shot, ok, calls, toastOf, sr, srStudio, ratio, section, finish } from './lib/click.mjs';
let page;

await section('10. the notes of 12 November: time dial, date picker, place finder, em', async () => {
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
});
await section('11. the medication pill and record; bin night (since 0.38.25 the chip ', async () => {
// 11. the medication pill and record; bin night (since 0.38.25 the chip is off the header after noon: opened at 9:10 am, while it is the plain "not recorded" line)
page = await open('look=glass', '09:10');
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
});
await section('13. Ask: the children’s chat. The microphone button is gone; starters,', async () => {
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
await page.getByRole('button', { name: 'For parents' }).click(); await page.waitForTimeout(300); console.log('chat: parents record asks for the PIN:', await page.getByRole('dialog', { name: 'Parent PIN' }).count());
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
{ const n = await page.getByRole('button', { name: 'Ask a question' }).count(); console.log('chat on a picture-mode child’s page: buttons (expect 2: the header’s and the big Ask in reach):', n, ok(n === 2)); }
await page.close();
page = await open('look=glass&chat=off');
console.log('chat=off: Ask button:', await page.getByRole('button', { name: 'Ask a question' }).count(), '| old microphone button:', await page.locator('family-hub-card [data-act="assist"]').count());
await page.close();
});
await section('13. header: one row, chips whole or absent, a due medication chip besi', async () => {
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
});
await section('14. planner: a failed load is not an empty week; empty week and empty ', async () => {
// 14. planner: a failed load is not an empty week; empty week and empty day say so; Try again loads
// (since R1.2 a read that fails keeps the week this browser last read; a week never read here says it cannot reach the calendars)
page = await open('look=glass');
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); window.__api = c.hass.callApi; c.hass.callApi = async () => { throw new Error('offline'); }; c._fetchedKey = ''; c._refresh(); }); await page.waitForTimeout(400);
{ const n = await page.locator('family-hub-card .week .ev').count(), f = await page.locator('family-hub-card .calfail').count(); console.log('calendars failed after a good read: the week kept', n > 0 && f === 0 ? 'ok' : 'FAIL', `(events ${n}, error ${f})`); }
await page.close(); page = await open('look=glass', '16:20', () => { for (const k of Object.keys(localStorage)) if (k.startsWith('fh-kept-cal:')) localStorage.removeItem(k); window.__calFail = 'all'; });
console.log('calendars failed:', (await page.locator('family-hub-card .calfail').innerText()).replace(/\s+/g, ' '), '| empty state shown:', await page.locator('family-hub-card .quiet, family-hub-card .freeday').count());
await page.evaluate(() => { window.__calFail = []; }); await page.getByRole('button', { name: 'Try again' }).click(); await page.waitForTimeout(400);
console.log('after Try again: events', await page.locator('family-hub-card .week .ev').count(), '| error left:', await page.locator('family-hub-card .calfail').count());
await page.close(); page = await open('look=glass&events=none');
console.log('empty week:', (await page.locator('family-hub-card .quiet').innerText()).replace(/\s+/g, ' '));
await page.getByRole('button', { name: 'Day', exact: true }).click(); await page.waitForTimeout(400);
console.log('empty day:', (await page.locator('family-hub-card .freeday').innerText()).replace(/\s+/g, ' '), '| picture:', await page.locator('family-hub-card .freeday svg').count());
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, calendars: [] }); }); await page.waitForTimeout(300);
console.log('no calendars: Add buttons on the planner:', await page.locator('family-hub-card .planner [data-act=add], family-hub-card .planner .quiet').count());
await page.close();
});
await section('15. right rail: three reminders at 1280x800, "+N more" when they are c', async () => {
// 15. right rail: three reminders at 1280x800, "+N more" when they are cut, and a list that cannot load says so
page = await open('look=glass'); const rail = (sel) => page.locator('family-hub-card aside ' + sel);
console.log('reminders shown:', await rail('.rem').count(), '| jar is its own card:', await rail('.jar').count(), await rail('.rems .jarpic').count() === 0);
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c._reminders = Array.from({ length: 8 }, (_, i) => ({ uid: 'x' + i, summary: 'Reminder ' + (i + 1) })); }); await page.waitForTimeout(400);
console.log('eight reminders:', await rail('.rem').count(), 'shown,', await rail('.remmore').innerText(), '| cut off:', await rail('.remlist').evaluate((e) => e.scrollHeight > e.clientHeight + 1));
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c.hass.callWS = async () => { throw new Error('offline'); }; return c._loadReminders(); }); await page.waitForTimeout(300);
{ const n = await rail('.rem:not(.dinline)').count(), f = await rail('.remfail').count(); console.log('reminders failed after a good read: the list kept', n > 0 && f === 0 ? 'ok' : 'FAIL', `(rows ${n}, error ${f})`); }
await page.close(); page = await open('look=glass', '16:20', () => { for (const k of Object.keys(localStorage)) if (k.startsWith('fh-kept-rem:')) localStorage.removeItem(k); window.__listFail = ['todo.reminders']; });
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
// (since 0.38.26 All on is gone and All off is the first of Home's Scenes)
await page.evaluate(() => { document.querySelector('family-hub-card')._page = 'home'; }); await page.waitForTimeout(500);
await page.locator('family-hub-card fh-home [data-act=alloff]').click(); await page.waitForTimeout(700); console.log('all off fails:', await toast());
await page.evaluate(() => { document.querySelector('family-hub-card')._page = 'planner'; }); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Pause' }).click(); await page.waitForTimeout(700); console.log('pause fails:', await toast());
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, announce_script: 'script.dinner' }); return c._dinnerGo(); }); await page.waitForTimeout(300); console.log('dinner fails:', await toast());
await page.close();
});
await section('17. sheets: focus goes in, Escape closes, focus goes back to the opene', async () => {
const ae = (sel, o) => page.locator('fh-add-event ' + sel, o); // (from the time dial's section, before the split)
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
});
await section('R2. add event: "where" is kept and shown; a save that fails after the ', async () => {
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
});
await section('R3. undo where a tap cannot be taken back: a reminder, "Given by", and', async () => {
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
// (since 0.38.26 All on is gone; All off, the first of Home's Scenes, keeps its Undo)
{ const lit = () => page.evaluate(() => Object.values(document.querySelector('family-hub-card').hass.states).filter((s) => s.entity_id.startsWith('light.') && s.state === 'on').map((s) => s.entity_id).sort().join(',')), on0 = await lit();
  const allOff = page.locator('family-hub-card fh-home [data-act=alloff]'), tb = page.locator('family-hub-card .toast button', { hasText: 'Undo' });
  await allOff.click(); await page.waitForTimeout(600); const on1 = await lit();
  console.log('R3c All off: lights on', on0.split(',').filter(Boolean).length, '->', on1.split(',').filter(Boolean).length, '| Undo:', await tb.count(), ok(on0.length > 0 && on1 === '' && await tb.count() === 1));
  await tb.click(); await page.waitForTimeout(600); const on2 = await lit();
  console.log('R3c Undo turns on only what it turned off:', on2 === on0, ok(on2 === on0)); }
await page.close(); page = await open('look=glass&page=home&slow=1200');
{ await page.evaluate(() => { window.__calls = []; }); const allOff = page.locator('family-hub-card fh-home [data-act=alloff]');
  await allOff.click(); await page.waitForTimeout(100); await allOff.click(); await allOff.click(); await page.waitForTimeout(1800);
  const n = (await calls(page)).split('\n').filter((c) => /^light\./.test(c)).length; console.log('R3c three taps while in flight: calls sent', n, '(expect 1)', ok(n === 1)); }
await page.close();
});
await section('R6. planner week: nothing is hidden while it would fit, and "+N more" ', async () => {
// R6. planner week: nothing is hidden while it would fit, and "+N more" is a pill directly under the last event shown
for (const q of ['look=glass&page=planner&events=long', 'look=orbit&page=planner&events=long', 'look=fridge&page=planner&events=many', 'look=glass&page=planner&events=many']) { page = await open(q);
  console.log('R6', q.replace(/look=|&page=planner&events=/g, ' ').trim() + ':', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot; return [...r.querySelectorAll('.week > .col')].map((c) => { const evs = [...c.querySelectorAll('.ev')], shown = evs.filter((e) => e.style.display !== 'none'), hid = evs.filter((e) => e.style.display === 'none'), pill = c.querySelector('.more .mpill'); if (!hid.length) return null;
    const top = (e) => { let t = 0; for (let x = e; x && x !== c; x = x.offsetParent) t += x.offsetTop; return t; }, bot = (e) => top(e) + e.offsetHeight, bottom = c.clientHeight - parseFloat(getComputedStyle(c).paddingBottom), last = shown.length ? shown[shown.length - 1] : null, free = bottom - bot(pill), smallest = Math.min(...hid.map((e) => { e.style.display = ''; const h = e.offsetHeight; e.style.display = 'none'; return h; }));
    return `${shown.length} shown, ${pill.textContent.trim()} (${parseFloat(getComputedStyle(pill).fontSize)} px), pill ${last ? Math.round(top(pill) - bot(last)) : 0} px under the last event, a hidden event would fit: ${smallest + 6 <= free}`; }).filter(Boolean).join(' ; ') || 'nothing hidden'; }));
  await page.close(); }
});
await section('R16. Ask: the AI note is under the subtitle and in view; the keyboard ', async () => {
// R16. Ask: the AI note is under the subtitle and in view; the keyboard has punctuation and digits; the three options share a row
for (const [w, h] of [[1280, 800], [1312, 668]]) { page = await open('look=glass&page=planner&sheet=chat'); await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
  // measured before the keys open: on a short screen (under 720 px high) the two lines of introduction step aside while the keys are up (round 7)
  const n = await page.locator('family-hub-card .ainote').boundingBox(), sub = await page.locator('family-hub-card .chatsheet .shead .muted').boundingBox();
  await page.locator('fh-chat input.field').click(); await page.waitForTimeout(300);
  const tops = await page.locator('fh-chat .opts .pill').evaluateAll((els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top)))].length);
  for (const k of ['Question mark', 'Full stop']) await page.locator('fh-chat .keys').getByRole('button', { name: k }).click(); await page.locator('fh-chat .keys .key', { hasText: /^7$/ }).click();
  console.log(`R16 ${w}x${h}: note`, parseFloat(await page.locator('family-hub-card .ainote').evaluate((e) => getComputedStyle(e).fontSize)), 'px,', Math.round(n.y - (sub.y + sub.height)), 'px under the subtitle, in view:', n.y + n.height <= h, '| option rows:', tops, '| typed with the keys:', JSON.stringify(await page.locator('fh-chat input.field').inputValue()));
  await page.setViewportSize({ width: 1280, height: 800 }); await page.close(); }
});
await section('R17. small things: the PIN pad does not open over a sheet that did not', async () => {
// R17. small things: the PIN pad does not open over a sheet that did not ask; a stale timer is over; the weather chip has words
page = await open('look=glass&page=planner&sheet=timer', '19:45');
{ await page.evaluate(() => document.querySelector('family-hub-card')._openWaiting()); await page.waitForTimeout(400); // (the bell's PIN since 0.38.26: All on, which this used, is gone) the dock is under the scrim; a toast's Undo is the way a PIN could be asked for over a sheet
  console.log('R17 a PIN asked for while the timer sheet is open: PIN pad', await page.locator('family-hub-card fh-pin').count(), '| says:', await toastOf(page, 'family-hub-card'));
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'), h = c.hass; c.hass = { ...h, states: { ...h.states, 'timer.kitchen': { ...h.states['timer.kitchen'], state: 'active', attributes: { ...h.states['timer.kitchen'].attributes, finishes_at: new Date(Date.now() - 90_000).toISOString() } }, 'weather.home': { ...h.states['weather.home'], state: 'unavailable' } } }; }); await page.waitForTimeout(500);
  console.log('R17 timer that finished 90 s ago: treated as running', await page.evaluate(() => document.querySelector('family-hub-card')._timerLeft() !== null), '| weather chip:', (await page.locator('family-hub-card header .wsub').innerText().catch(() => '(chip hidden)')).trim()); }
await page.close();
});
await section('R4-2 and R4-3. events open a read-only sheet; overnight and multi-day ', async () => {
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
  console.log('R4-4a family events once across the top, not in the columns:', ok(mb.fam.some((x) => /Bin collection/.test(x)) /* (23 Nov: the preview's bin event is collection morning) */ && !mb.cols.some((c) => /Bin collection|Road works/.test(c))), '| picture tiles:', mb.tiles, 'smallest', mb.tileMin, 'px (expect >= 72)', ok(mb.tiles > 0 && mb.tileMin >= 72), '| tiles in the lower half: top', mb.tileTop, '>', mb.half, ok(mb.tileTop > mb.half),
    '| D4 one clock for the family, none in a column:', mb.clocks, 'clock,', mb.bars, 'bars in columns,', mb.gotx.join(' ; '), ok(mb.clocks === 1 && mb.bars === 0 && mb.gotx.length === mb.kids - 1 && mb.gotx.every((x) => /^You leave 20 minutes later ?7:50 am/.test(x) && !/%/.test(x))), '| per-child job progress (expect 0):', mb.progress, ok(!mb.progress));
  await m.context().close();
  // on the wall the header has room for the "next up" chip: it is a button that opens its event
  const w = await openAt(1920, 1080, 'look=glass&page=planner'); const chip2 = w.locator('family-hub-card header button.cap[data-kind="next"]');
  if (await chip2.count() && await chip2.isVisible()) { const nm = await chip2.getAttribute('aria-label'); await chip2.click(); await w.waitForTimeout(400);
    console.log('R4-2 header "next up" chip at 1920x1080:', nm.replace(/\u00a0/g, ' '), '| opens its event:', ok(await w.evaluate(() => !!document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet[data-sheet="event"]')))); }
  else console.log('R4-2 header "next up" chip at 1920x1080: not showing');
  await w.context().close(); }
});
await section('R6-H8. a text field on the add sheet shows a focus ring in the looks t', async () => {
// R6-H8. a text field on the add sheet shows a focus ring in the looks that draw it as an underline
for (const look of ['sports', 'fridge', 'orbit']) { page = await open(`look=${look}&page=planner&sheet=add`);
  console.log(`R6-H8 ${look}: the focused field has a 3 px outline:`, await page.evaluate(() => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-add-event').shadowRoot.querySelector('input.field'); f.focus(); const c = getComputedStyle(f); return c.outlineStyle === 'solid' && c.outlineWidth === '3px'; }));
  await page.close(); }
});
await section('R7-M4. Ask with the on-screen keys on a short screen (1312x668): every', async () => {
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
});
await section('R7-N. the event sheet shows the calendar’s notes as words only: line b', async () => {
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
});
await section('leftovers: the Orbit medication chip says how many and names nobody at', async () => {
// leftovers: the Orbit medication chip says how many and names nobody at 1024 x 768 (0.30.0: names are inside the sheet); the Sports timer pills keep "+10 min" on one line there
{ for (const v of ['day', 'week']) { const p = await openAt(1024, 768, 'look=orbit&page=planner&view=' + v, '08:00'); // (0.38.25: the chip is amber "2 overdue" to 8:30 am, off the header after noon)
    const r = await p.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('.cap[data-kind="med"]'); return m ? { text: m.textContent.replace(/\s+/g, ' ').trim(), label: m.getAttribute('aria-label'), cut: m.scrollWidth > m.clientWidth + 1, capCut: m.parentElement.scrollWidth > m.parentElement.clientWidth + 1 } : null; });
    console.log(`leftover: Orbit medication chip at 1024 x 768 (${v}):`, JSON.stringify(r), ok(!!r && r.text === '2 overdue' && !/Riley|Charlie/.test(r.text + r.label) && !r.cut && !r.capCut)); await p.context().close(); }
  const p = await openAt(1024, 768, 'look=sports&page=planner');
  const q = await p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.quick')].map((b) => { const g = document.createRange(); g.selectNodeContents(b); const t = g.getBoundingClientRect(), o = b.getBoundingClientRect(); return { text: b.textContent.trim(), lines: Math.round(t.height / parseFloat(getComputedStyle(b).fontSize)), gap: Math.round(Math.min(t.left - o.left, o.right - t.right) * 10) / 10, fs: parseFloat(getComputedStyle(b).fontSize), h: Math.round(o.height) }; }));
  console.log('leftover: Sports timer pills at 1024 x 768:', q.map((x) => `${x.text} ${x.lines} line, ${x.gap} px clear, ${x.fs} px`).join(' ; '), ok(q.length === 3 && q.every((x) => x.lines === 1 && x.gap >= 6 && x.fs >= 15 && x.h >= 44))); await p.context().close(); }
});

await finish();
