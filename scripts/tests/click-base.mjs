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
  // medication: one filled action; in Fridge and Orbit "Given by" is an outline
  for (const look of ['fridge', 'orbit']) { o = await open(`look=${look}&page=planner&sheet=meds`, '08:10');
    console.log(`looks: ${look} medication has one filled action:`, await Q(o, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, s = c.querySelector('.sheet'), prim = getComputedStyle(s.querySelector('.lead')).backgroundColor; return [...s.querySelectorAll('button')].filter((b) => getComputedStyle(b).backgroundColor === prim).length === 1; })()`));
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
  for (const look of ['fridge', 'orbit']) { const pg = await ph.newPage(); await pg.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await pg.goto(`http://localhost:4779/?look=${look}&page=planner`); await pg.waitForFunction('window.__ready === true'); await pg.waitForTimeout(700);
    console.log(`looks: ${look} phone dock is a solid bar with labels, nothing off the right:`, await Q(pg, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, d = c.querySelector('.dock'), cs = getComputedStyle(d), it = d.querySelector(".item[data-nav='calendar']"), dial = c.querySelector('.ddial'), list = c.querySelector('.daylist'); const solid = !/rgba?\\(0, 0, 0, 0\\)/.test(cs.backgroundColor) && parseFloat(cs.borderTopWidth) >= 1; const label = parseFloat(getComputedStyle(it).fontSize) >= 14 && it.getBoundingClientRect().bottom <= innerHeight + 1 && it.scrollHeight <= it.clientHeight + 1; const stacked = !dial || (dial.getBoundingClientRect().bottom <= list.getBoundingClientRect().top + 1 && [...dial.querySelectorAll('text')].every((x) => parseFloat(getComputedStyle(x).fontSize) * dial.getBoundingClientRect().width / 200 >= 12)); const pad = parseFloat(getComputedStyle(c.querySelector('.fh')).paddingBottom) >= d.getBoundingClientRect().height / (Number(getComputedStyle(c.querySelector('.fh')).zoom) || 1); return solid && label && stacked && pad && document.documentElement.scrollWidth <= innerWidth + 2; })()`));
    await pg.close(); }
  await ph.close(); }
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close();
