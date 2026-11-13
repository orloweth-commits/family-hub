// Click tests for changing and deleting calendar events from the event sheet (behind the parent PIN).
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4811] node scripts/tests/events.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4811);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, { w = 1280, h = 800 } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await page.goto('http://localhost:' + PORT + '/?page=planner&' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(600); return page; };
const C = (page) => page.locator('family-hub-card');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re);
const tapEv = async (page, title) => { await C(page).locator('.planner button', { hasText: title }).first().click(); await page.waitForTimeout(400); };
const pin = async (page) => { for (const d of '1234') await C(page).locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500); };
const act = (page, a) => C(page).locator(`.sheet [data-act="${a}"]`);
const toast = async (page) => (await C(page).locator('.toast span').first().innerText().catch(() => '')).trim();
const shown = (page, title) => C(page).locator('.planner button', { hasText: title }).count();

// 1. delete an ordinary event: PIN, then a question, then gone
let page = await open('');
await tapEv(page, 'Pizza night');
ok('an event in a calendar that allows it has Delete and Change', await act(page, 'ev-delete').count() === 1 && await act(page, 'ev-edit').count() === 1);
{ const b = await act(page, 'ev-delete').boundingBox(), e = await act(page, 'ev-edit').boundingBox(); ok('both are full-size touch targets', b.height >= 44 && e.height >= 44, [b.height, e.height]); }
await act(page, 'ev-delete').click(); await page.waitForTimeout(300);
ok('Delete asks for the parent PIN first', await C(page).locator('fh-pin').count() === 1);
ok('nothing sent yet', (await calls(page, 'calendar/event/delete')).length === 0);
await pin(page);
ok('then it asks before deleting', await act(page, 'ev-del-all').count() === 1 && /Delete this event/.test(await C(page).locator('.evask .evq').innerText()));
await act(page, 'ev-keep').click(); await page.waitForTimeout(200);
ok('Keep it goes back, nothing sent', await act(page, 'ev-delete').count() === 1 && (await calls(page, 'calendar/event/delete')).length === 0);
await act(page, 'ev-delete').click(); await page.waitForTimeout(300); await pin(page); await act(page, 'ev-del-all').click(); await page.waitForTimeout(900);
{ const c = await calls(page, 'calendar/event/delete'); ok('one delete, for that event in its own calendar', c.length === 1 && /calendar\.family/.test(c[0]) && /"uid":"family-0"/.test(c[0]) && !/recurrence_id/.test(c[0]), c); }
ok('the sheet closes and it says so', await C(page).locator('.sheet').count() === 0 && /^Deleted: Pizza night/.test(await toast(page)), await toast(page));
ok('it is off the planner', await shown(page, 'Pizza night') === 0);
await page.close();

// 2. change an event in a calendar that cannot update in place: add the new one, then remove the old
page = await open('');
await tapEv(page, 'Pizza night'); await act(page, 'ev-edit').click(); await page.waitForTimeout(300); await pin(page);
const A = (p) => p.locator('fh-add-event');
ok('Change opens the add sheet as "Change this event"', await A(page).locator('h2').innerText() === 'Change this event');
ok('filled in: title', await A(page).locator('.what input').first().inputValue() === 'Pizza night');
{ const sum = await A(page).locator('.sum').first().innerText(); ok('filled in: day, time, length and calendar', /Fri 13 Nov/.test(sum) && /6:30 pm/.test(sum) && /1 h/.test(sum) && /Family/.test(sum), sum); }
await A(page).locator('.what input').first().fill('Pizza and film night'); await A(page).locator('.durs button', { hasText: '2 h' }).click();
ok('the button says Save', (await A(page).locator('button.lead').first().innerText()).trim() === 'Save');
await A(page).locator('button.lead').first().click(); await page.waitForTimeout(1200);
{ const all = await calls(page, 'calendar'); const i = all.findIndex((c) => /create_event/.test(c)), j = all.findIndex((c) => /event\/delete/.test(c));
  ok('the new one is added before the old one is removed', i >= 0 && j > i && /Pizza and film night/.test(all[i]) && /family-0/.test(all[j]), all); }
ok('it says Changed', /^Changed: Pizza and film night/.test(await toast(page)), await toast(page));
ok('the planner shows the new one only', await shown(page, 'Pizza and film night') === 1 && await shown(page, 'Pizza night') === 0);
await page.close();

// 3. a calendar that can update in place is updated, and keeps its odd length
page = await open('');
await tapEv(page, 'Call the plumber'); await act(page, 'ev-edit').click(); await page.waitForTimeout(300); await pin(page);
ok('an odd length is offered as its own choice', await A(page).locator('.durs button[aria-pressed="true"]').innerText() === '15 min');
await A(page).locator('.what input').first().fill('Call the electrician'); await A(page).locator('button.lead').first().click(); await page.waitForTimeout(1200);
{ const u = await calls(page, 'event/update'), cr = await calls(page, 'create_event'); ok('one update in place, nothing added or deleted', u.length === 1 && cr.length === 0 && (await calls(page, 'event/delete')).length === 0 && /Call the electrician/.test(u[0]) && /alex-2/.test(u[0]), u); }
ok('the planner shows the new title', await shown(page, 'Call the electrician') >= 1);
await page.close();

// 4. one of a repeating series: delete just this one or all; no Change
page = await open('');
await tapEv(page, 'Kindy');
ok('a repeating event has Delete and Change, and says it repeats', await act(page, 'ev-delete').count() === 1 && await act(page, 'ev-edit').count() === 1 && /repeats/.test(await C(page).locator('.sheet .sfoot .muted').innerText()));
await act(page, 'ev-delete').click(); await page.waitForTimeout(300); await pin(page);
ok('it offers just this one, this and later ones, or all of them', await act(page, 'ev-del-one').count() === 1 && await act(page, 'ev-del-future').count() === 1 && (await act(page, 'ev-del-all').innerText()).trim() === 'All of them');
await act(page, 'ev-del-one').click(); await page.waitForTimeout(900);
{ const c = await calls(page, 'event/delete'); ok('just this one names which one', c.length === 1 && /recurrence_id/.test(c[0]), c); }
ok('the other Kindy morning is still there', await shown(page, 'Kindy') === 1, await shown(page, 'Kindy'));
await page.close();

// 5. a read-only calendar: no buttons, and it says where to change it
page = await open('calro=1');
await tapEv(page, 'Pizza night');
ok('read-only calendar: no Delete or Change', await act(page, 'ev-delete').count() === 0 && await act(page, 'ev-edit').count() === 0 && /own app/.test(await C(page).locator('.sheet .sfoot .muted').innerText()));
await page.close();

// 6. a delete that fails says so and keeps the sheet
page = await open('nopin=1');
await tapEv(page, 'Pizza night'); await act(page, 'ev-delete').click(); await page.waitForTimeout(300);
ok('with no PIN set, it goes straight to the question', await C(page).locator('fh-pin').count() === 0 && await act(page, 'ev-del-all').count() === 1);
await page.evaluate(() => { window.__evFail = 'delete'; }); await act(page, 'ev-del-all').click(); await page.waitForTimeout(900);
ok('a failed delete says so, and the event stays', /was not deleted/.test(await toast(page)) && await C(page).locator('.sheet').count() === 1, await toast(page));
await page.close();

// 7. a change whose second step fails says exactly what is left to do
page = await open('nopin=1');
await tapEv(page, 'Pizza night'); await act(page, 'ev-edit').click(); await page.waitForTimeout(400);
await A(page).locator('.what input').first().fill('Pasta night'); await page.evaluate(() => { window.__evFail = 'delete'; }); await A(page).locator('button.lead').first().click(); await page.waitForTimeout(1200);
ok('new one added, old one not removed: it says so plainly', /could not be removed/.test(await toast(page)) && await shown(page, 'Pasta night') === 1, await toast(page));
await page.close();

// 8. the delete question fits on a phone and in every look
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { page = await open(`nopin=1&look=${look}`, { w: 390, h: 844 });
  if (!(await C(page).locator('button', { hasText: 'Kindy' }).count())) { await C(page).locator('.planner button[aria-label="Next"]').first().click(); await page.waitForTimeout(600); }
  await C(page).locator('button', { hasText: 'Kindy' }).first().click(); await page.waitForTimeout(400); await act(page, 'ev-delete').click(); await page.waitForTimeout(400);
  const r = await page.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet'), f = s.querySelector('.sfoot'); const sb = s.getBoundingClientRect(); return [...f.querySelectorAll('button')].map((b) => { const x = b.getBoundingClientRect(); return x.left >= sb.left - 1 && x.right <= sb.right + 1 && x.height >= 44 && b.scrollWidth <= b.clientWidth + 1; }); });
  ok(`${look} phone: all four choices fit, full size, words whole`, r.length === 4 && r.every(Boolean), r); await page.close(); }

// 9. a new repeating event: a ready-made choice
const R = (p, a) => A(p).locator(`[data-act="${a}"]`);
const made = async (p) => (await calls(p, 'event/create')).map((c) => JSON.parse(c.slice(c.indexOf('{'))).event);
page = await open('nopin=1');
await C(page).locator('[data-act="add"]').first().click(); await page.waitForTimeout(400);
await A(page).locator('.what input').first().fill('Trumpet practice');
ok('the add sheet has a Repeat button and a Notes field', await R(page, 'repeat').count() === 1 && await A(page).locator('input.notes').count() === 1);
await R(page, 'repeat').click(); await page.waitForTimeout(300);
{ const names = await A(page).locator('.rlist button').allInnerTexts(); ok('the choices are worded for the day chosen (Tuesday 10 November)', names.join('|') === 'Does not repeat|Every day|Every week on Tue|Every fortnight on Tue|Every month on the 10th|Every month on the second Tuesday|Every year on 10 November|Every weekday (Mon to Fri)|Custom…', names); }
{ const fit = await page.evaluate(() => { const a = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-add-event').shadowRoot, box = a.querySelector('.box').getBoundingClientRect(), pop = a.querySelector('.month.rep').getBoundingClientRect(); return pop.top >= box.top - 1 && pop.bottom <= box.bottom + 1 && [...a.querySelectorAll('.month.rep button')].every((b) => b.getBoundingClientRect().height >= 44 && b.scrollWidth <= b.clientWidth + 1); }); ok('the picker fits inside the sheet, every choice full size with its words whole', fit); }
await R(page, 'rep-1').click(); await R(page, 'rep-done').click(); await page.waitForTimeout(200);
ok('the button and the summary say how it repeats', /Every week on Tue/.test(await R(page, 'repeat').innerText()) && /Every week on Tue/.test(await A(page).locator('.sum').first().innerText()));
await A(page).locator('button.lead', { hasText: 'Add' }).first().click(); await page.waitForTimeout(1000);
{ const m = await made(page); ok('it is added with its rule', m.length === 1 && m[0].summary === 'Trumpet practice' && m[0].rrule === 'FREQ=WEEKLY;BYDAY=TU' && /^2026-11-10T\d\d:00:00$/.test(m[0].dtstart) && (await calls(page, 'create_event')).length === 0, m); }
await page.close();

// 10. a custom one: every 2 weeks on Monday and Wednesday, six times
page = await open('nopin=1');
await C(page).locator('[data-act="add"]').first().click(); await page.waitForTimeout(400);
await A(page).locator('.what input').first().fill('Swim squad'); await A(page).locator('input.notes').fill('Bring goggles');
await R(page, 'repeat').click(); await R(page, 'rep-custom').click(); await page.waitForTimeout(200);
await A(page).getByRole('button', { name: 'How many: more' }).click();
await A(page).getByRole('button', { name: 'Monday', exact: true }).click(); await A(page).getByRole('button', { name: 'Wednesday', exact: true }).click(); await A(page).getByRole('button', { name: 'Tuesday', exact: true }).click();
await R(page, 'end-after').click(); for (let i = 0; i < 4; i++) await A(page).getByRole('button', { name: 'How many times: fewer' }).click();
ok('the picker says it in words', (await A(page).locator('.rhead .muted').innerText()) === 'Every fortnight on Mon and Wed, 6 times', await A(page).locator('.rhead .muted').innerText());
await R(page, 'rep-done').click(); await A(page).locator('button.lead', { hasText: 'Add' }).first().click(); await page.waitForTimeout(1000);
{ const m = await made(page); ok('custom rule and the notes are sent', m.length === 1 && m[0].rrule === 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=6' && m[0].description === 'Bring goggles', m); }
await page.close();

// 11. ends on a date; and notes on an ordinary event
page = await open('nopin=1');
await C(page).locator('[data-act="add"]').first().click(); await page.waitForTimeout(400);
await A(page).locator('.what input').first().fill('Reading'); await R(page, 'repeat').click(); await R(page, 'rep-0').click(); await R(page, 'end-on').click(); await page.waitForTimeout(200);
await R(page, 'end-date').click(); await page.waitForTimeout(300);
ok('the last-day calendar opens on top of the picker', await page.evaluate(() => { const a = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-add-event').shadowRoot, m = a.querySelector('.month.top'), r = m.getBoundingClientRect(); return a.elementFromPoint(r.left + r.width / 2, r.top + 20) && m.contains(a.elementFromPoint(r.left + r.width / 2, r.top + 20)); }));
await A(page).locator('.month.top .mgrid button', { hasText: /^20$/ }).first().click(); await page.waitForTimeout(300);
ok('back in the picker with the day chosen', await R(page, 'end-date').count() === 1 && /20 /.test(await R(page, 'end-date').innerText()), await R(page, 'end-date').innerText().catch(() => ''));
await R(page, 'rep-done').click(); await A(page).locator('button.lead', { hasText: 'Add' }).first().click(); await page.waitForTimeout(1000);
{ const m = await made(page); ok('the rule ends at the end of that day (in UTC)', m.length === 1 && /^FREQ=DAILY;UNTIL=20\d{6}T155959Z$/.test(m[0].rrule), m); }
await C(page).locator('[data-act="add"]').first().click(); await page.waitForTimeout(400);
await A(page).locator('.what input').first().fill('Dentist'); await A(page).locator('input.notes').fill('Take the form'); await A(page).locator('button.lead', { hasText: 'Add' }).first().click(); await page.waitForTimeout(1000);
{ const c = await calls(page, 'create_event'); ok('an event that does not repeat is added the ordinary way, with its notes', c.length === 1 && /Take the form/.test(c[0]) && (await made(page)).length === 1, c); }
await page.close();

// 12. change one of a series: this and later ones
page = await open('');
await tapEv(page, 'Kindy'); await act(page, 'ev-edit').click(); await page.waitForTimeout(300); await pin(page);
ok('Change on a repeating event asks which', await act(page, 'ev-edit-one').count() === 1 && await act(page, 'ev-edit-future').count() === 1);
await act(page, 'ev-edit-future').click(); await page.waitForTimeout(400);
ok('the sheet knows how it repeats', /Every week on Wed/.test(await R(page, 'repeat').innerText()), await R(page, 'repeat').innerText());
await A(page).locator('.what input').first().fill('Kindy (new room)'); await A(page).locator('button.lead').first().click(); await page.waitForTimeout(1200);
{ const m = await made(page), d = await calls(page, 'event/delete'); ok('a new series is added, then this and later ones of the old are removed', m.length === 1 && m[0].rrule === 'FREQ=WEEKLY;BYDAY=WE' && d.length === 1 && /THISANDFUTURE/.test(d[0]) && /recurrence_id/.test(d[0]), [m, d]); }
await page.close();

// 13. change just this one
page = await open('nopin=1');
await tapEv(page, 'Kindy'); await act(page, 'ev-edit').click(); await page.waitForTimeout(300); await act(page, 'ev-edit-one').click(); await page.waitForTimeout(400);
ok('just this one: no Repeat button', await R(page, 'repeat').count() === 0);
await A(page).locator('.what input').first().fill('Kindy excursion'); await A(page).locator('button.lead').first().click(); await page.waitForTimeout(1200);
{ const c = await calls(page, 'create_event'), d = await calls(page, 'event/delete'); ok('one ordinary event is added and only that morning is removed', c.length === 1 && (await made(page)).length === 0 && d.length === 1 && /recurrence_id/.test(d[0]) && !/THISANDFUTURE/.test(d[0]), [c, d]); }
await page.close();

// 14. the picker on a phone, in every look
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { page = await open(`nopin=1&look=${look}`, { w: 390, h: 844 });
  await C(page).locator('[data-act="add"]').first().click(); await page.waitForTimeout(500); await R(page, 'repeat').click(); await R(page, 'rep-custom').click(); await R(page, 'end-after').click(); await page.waitForTimeout(300);
  const r = await page.evaluate(() => { const a = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-add-event').shadowRoot, pop = a.querySelector('.month.rep'), pr = pop.getBoundingClientRect(); const b = [...pop.querySelectorAll('button')]; return { inside: pr.left >= 0 && pr.right <= innerWidth + 1, n: b.length, ok: b.every((x) => { const q = x.getBoundingClientRect(); return q.height >= 44 && q.width >= 44 && q.left >= pr.left - 1 && q.right <= pr.right + 1 && x.scrollWidth <= x.clientWidth + 1; }) }; });
  ok(`${look} phone: the custom picker fits, every control full size`, r.inside && r.ok && r.n > 20, r); await page.close(); }

console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILED` : `\nall ${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
