// Click tests for Settings (the cog on the house-info sheet): the PIN gate, every pane, saving into the pretend dashboard, validation,
// failure, Undo, earlier versions, read-only modes, jobs in to-do lists, and that a child still reaches the style studio without a PIN.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4798] node scripts/tests/settings.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4798);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'Australia/Perth', locale: 'en-AU' });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, time = '16:20') => { const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(500); return page; };
const S = (page) => page.locator('fh-settings');
const cfg = (page, f) => page.evaluate(f ? `(${f})(document.querySelector('family-hub-card')._config)` : `document.querySelector('family-hub-card')._config`);
const dashCard = (page, f) => page.evaluate(`(${f})(window.__dash.views[0].sections[0].cards[1].cards[0])`);
const kidText = (page) => page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.textContent);
const saves = (page) => page.evaluate(() => window.__saves || 0);
const go = async (page, pane) => { await S(page).locator(`.snav button[data-pane="${pane}"]`).click(); await page.waitForTimeout(250); };
const save = async (page) => { await S(page).locator('.sft [data-act="save"]').click(); await page.waitForTimeout(450); };
const state = async (page) => (await S(page).locator('.sft .sstate').innerText()).trim();
const toast = async (page) => ((await S(page).locator('.toast').count()) ? (await S(page).locator('.toast span').first().innerText()).trim() : '');
const pin = async (page, digits) => { for (const d of digits) await page.locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(450); };
/** Opens the time dial behind a time button and moves the hour by `dh` and the minutes by `dm` steps with the arrow keys. */
const dial = async (page, button, dh = 0, dm = 0, half = '') => { await button.click(); await page.waitForTimeout(250);
  const h = S(page).locator('.drum[data-d="h"]'), m = S(page).locator('.drum[data-d="m"]');
  await h.focus(); for (let i = 0; i < Math.abs(dh); i++) await page.keyboard.press(dh < 0 ? 'ArrowUp' : 'ArrowDown');
  await m.focus(); for (let i = 0; i < Math.abs(dm); i++) await page.keyboard.press(dm < 0 ? 'ArrowUp' : 'ArrowDown');
  if (half) await S(page).locator('.sampm button', { hasText: half }).click();
  await S(page).locator('[data-act="time-done"]').click(); await page.waitForTimeout(250); };

// 1. the PIN gate: the cog on the house-info sheet asks for the PIN every time, except within a minute of the last time
let page = await open('look=glass');
await page.getByRole('button', { name: 'House info' }).click(); await page.waitForTimeout(300);
const cog = page.getByRole('button', { name: 'Settings, for grown-ups' });
ok('the house-info sheet has a cog', await cog.count() === 1);
{ const b = await cog.boundingBox(); ok('the cog is a full-size target', b.width >= 44 && b.height >= 44, `${Math.round(b.width)}x${Math.round(b.height)}`); }
await cog.click(); await page.waitForTimeout(300);
ok('the cog asks for the PIN', await page.locator('fh-pin').count() === 1 && await S(page).count() === 0);
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
ok('cancelling the PIN does not open Settings', await S(page).count() === 0 && await page.locator('fh-pin').count() === 0);
await cog.click(); await page.waitForTimeout(300); await pin(page, '1111');
ok('a wrong PIN does not open Settings', await S(page).count() === 0);
await page.waitForTimeout(500); await pin(page, '1234');
ok('the right PIN opens Settings', await page.getByRole('dialog', { name: 'Settings' }).count() === 1);
ok('focus is inside Settings', await page.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings'); return !!s.shadowRoot.activeElement; }));
ok('what is behind Settings is out of reach', await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('.fh > header').inert));
// Tab stays inside
{ for (let i = 0; i < 60; i++) await page.keyboard.press('Tab'); ok('Tab stays inside Settings', await page.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot; return c.activeElement?.localName === 'fh-settings'; })); }
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
ok('Escape closes Settings when nothing is unsaved', await S(page).count() === 0);
ok('focus goes back to the info button', await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.activeElement?.getAttribute('data-act')) === 'info');
await page.getByRole('button', { name: 'House info' }).click(); await page.waitForTimeout(300); await cog.click(); await page.waitForTimeout(400);
ok('inside the PIN window Settings opens without asking', await page.locator('fh-pin').count() === 0 && await S(page).count() === 1);
await S(page).getByRole('button', { name: 'Close settings' }).click(); await page.waitForTimeout(400);
await page.clock.fastForward(61_000); await page.waitForTimeout(200);
await page.getByRole('button', { name: 'House info' }).click(); await page.waitForTimeout(300); await cog.click(); await page.waitForTimeout(300);
ok('after a minute the PIN is asked again', await page.locator('fh-pin').count() === 1);
await pin(page, '1234');

// 2. every pane loads what is set now
ok('Children: name', await S(page).getByLabel('Name', { exact: true }).inputValue() === 'Riley');
ok('Children: bedtime', (await S(page).getByRole('button', { name: /Riley’s bedtime/ }).innerText()).trim() === '8:00 pm');
ok('Children: one child at a time (one name field)', await S(page).locator('input[aria-label="Name"]').count() === 1);
await go(page, 'rewards');
ok('Rewards: first reward', await S(page).getByLabel('Reward 1 name').inputValue() === 'Extra screen time' && (await S(page).locator('[data-reward="0"] output').innerText()).trim() === '50 pts');
await go(page, 'morning');
ok('Morning: board and leaving time', (await S(page).locator('.stime').allInnerTexts()).slice(0, 3).join(' ') === '6:30 am 8:45 am 7:50 am');
await go(page, 'medicines');
ok('Medicines: name and time', await S(page).getByLabel('Medicine 1 name').inputValue() === 'Morning dose' && (await S(page).locator('[data-med="0"] .stime').innerText()).trim() === '6:30 am');
ok('Medicines: who it is for', (await S(page).locator('[data-med="0"] .schips button[aria-pressed="true"]').innerText()).trim() === 'Riley');
// the hard rule: a medicine is a name and a time, nothing about amounts
{ const labels = await S(page).locator('.spane input').evaluateAll((els) => els.map((e) => `${e.getAttribute('aria-label')} | ${e.placeholder}`));
  ok('Medicines: no dose, strength or advice field', labels.length > 0 && !labels.some((l) => /dose|dosage|strength|\bmg\b|\bml\b|amount|advice|how much|how many/i.test(l)), labels.length + ' fields');
  const kinds = await S(page).locator('.spane input').evaluateAll((els) => [...new Set(els.map((e) => e.type))]); ok('Medicines: only text boxes (no number boxes)', kinds.join() === 'text', kinds.join()); }
await go(page, 'pin');
ok('PIN: the medicine switch is on', await S(page).getByRole('switch', { name: 'PIN for recording medicine' }).getAttribute('aria-checked') === 'true');
ok('PIN: Ask after bedtime switch is there', await S(page).getByRole('switch', { name: 'PIN for Ask after bedtime' }).count() === 1);
ok('PIN: the PIN itself is never shown', !(await S(page).locator('.sheet').innerText()).includes('1234') && (await S(page).locator('input[type="password"]').count()) === 3);
await go(page, 'house');
ok('House: bin day', (await S(page).getByRole('group', { name: 'Collection day' }).locator('[aria-pressed="true"]').innerText()).trim() === 'Mon');
ok('House: night screen is off (none set)', await S(page).getByRole('switch', { name: 'Night screen' }).getAttribute('aria-checked') === 'false');
await go(page, 'music');
ok('Music: starter moments shown', (await S(page).locator('[data-moment] .sname').allInnerTexts()).join() === 'Dinner,Dance,Tidy-up,Wind down');
await go(page, 'people');
ok('People: parents and address', await S(page).getByLabel('parent 1').inputValue() === 'Alex' && await S(page).getByLabel('Address').inputValue() === '1 Example Street, Sampleton');
ok('People: contacts read from the old lines', await S(page).getByLabel('Contact 3 name').inputValue() === 'Nan next door' && await S(page).getByLabel('Contact 3 number').inputValue() === '0400 000 003');
await go(page, 'advanced');
{ const t = await S(page).locator('.spane').innerText(); ok('Advanced: the wiring is shown read-only', /weather\.home/.test(t) && /calendar\.family/.test(t) && /todo\.riley_chores/.test(t) && await S(page).locator('.spane input').count() === 0);
  ok('Advanced: never shows the PIN', !/1234/.test(t)); }
ok('nothing was saved by looking', await saves(page) === 0 && (await state(page)) === 'Nothing to save on this page.');

// 3. bedtime: edit, Save, and the running card has it at once (Settings stays open on the same pane)
await go(page, 'children');
await dial(page, S(page).getByRole('button', { name: /Riley’s bedtime/ }), -1, 6);
ok('bedtime edit is staged', (await S(page).getByRole('button', { name: /Riley’s bedtime/ }).innerText()).trim() === '7:30 pm' && (await state(page)) === 'Unsaved changes' && await saves(page) === 0);
await save(page);
ok('bedtime saved to the dashboard', await dashCard(page, '(c) => c.kids[0].bedtime') === '19:30' && await saves(page) === 1);
ok('the running card adopted it', await cfg(page, '(c) => c.kids[0].bedtime') === '19:30');
ok('Settings is still open on Children, all saved', await S(page).locator('.snav [aria-current="page"]').getAttribute('data-pane') === 'children' && (await state(page)) === 'All saved', await toast(page));
ok('the previous version is kept in the dashboard, without the PIN', await page.evaluate(() => { const p = window.__dash.family_hub_previous; return p.card.kids[0].bedtime === '20:00' && !('parent_pin' in p.card) && !!p.saved; }));
ok('and on this screen, without the PIN', await page.evaluate(() => { const h = JSON.parse(localStorage.getItem('family-hub-settings-history')); return h.length === 1 && h[0].config.kids[0].bedtime === '20:00' && !JSON.stringify(h).includes('1234'); }));
ok('other cards in the dashboard are untouched', await page.evaluate(() => window.__dash.views[0].sections[0].cards[0].type === 'markdown' && window.__dash.title === 'Home'));

// 4. Undo on the toast puts it back
ok('the toast offers Undo', (await toast(page)) === 'Saved: Children.' && await S(page).locator('.toast [data-act="undo"]').count() === 1);
await S(page).locator('.toast [data-act="undo"]').click(); await page.waitForTimeout(500);
ok('Undo restores the bedtime', await cfg(page, '(c) => c.kids[0].bedtime') === '20:00' && await dashCard(page, '(c) => c.kids[0].bedtime') === '20:00' && (await S(page).getByRole('button', { name: /Riley’s bedtime/ }).innerText()).trim() === '8:00 pm', await toast(page));

// 5. leaving with unsaved changes is guarded
await S(page).getByRole('switch', { name: 'Calm mode' }).click(); await page.waitForTimeout(150);
await S(page).locator('.snav button[data-pane="rewards"]').click(); await page.waitForTimeout(250);
ok('changing section with unsaved changes asks first', await S(page).getByRole('alertdialog', { name: 'Unsaved changes' }).count() === 1 && await S(page).locator('.snav [aria-current="page"]').getAttribute('data-pane') === 'children');
await S(page).locator('[data-act="stay"]').click(); await page.waitForTimeout(150);
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
ok('Escape with unsaved changes asks too (Settings stays)', await S(page).count() === 1 && await S(page).getByRole('alertdialog', { name: 'Unsaved changes' }).count() === 1);
await S(page).locator('.sft [data-act="discard"]').click(); await page.waitForTimeout(500);
ok('Discard throws the edit away and leaves', await S(page).count() === 0 && await cfg(page, '(c) => c.kids[0].calm') === undefined);
await page.close();

// 6. rewards: add, edit, remove, reorder
page = await open('look=glass&sheet=settings&pane=rewards');
await S(page).locator('[data-act="reward-add"]').click(); await page.waitForTimeout(200);
await page.keyboard.type('Ice cream'); await S(page).getByRole('button', { name: 'Cost of Ice cream: more' }).click(); await S(page).getByRole('button', { name: 'Cost of Ice cream: more' }).click();
await S(page).getByLabel('Picture for Ice cream (an emoji)').fill('🍦 yum');
await save(page);
ok('reward added', await cfg(page, '(c) => JSON.stringify(c.kids[0].rewards[3])') === '{"name":"Ice cream","cost":60,"icon":"🍦"}', await cfg(page, '(c) => JSON.stringify(c.kids[0].rewards[3])'));
await S(page).getByLabel('Reward 1 name').fill('More screen time'); await S(page).getByRole('button', { name: 'More screen time needs a grown-up’s PIN' }).click();
await save(page);
ok('reward edited (name and PIN flag)', await cfg(page, '(c) => c.kids[0].rewards[0].name + c.kids[0].rewards[0].approve') === 'More screen timetrue');
await S(page).getByRole('button', { name: 'Remove Pick the family movie' }).click(); await S(page).getByRole('button', { name: 'Move Ice cream up' }).click(); await page.waitForTimeout(150);
await save(page);
ok('reward removed and reordered', await cfg(page, '(c) => c.kids[0].rewards.map((r) => r.name).join()') === 'More screen time,Ice cream,Warhammer paint pot', await cfg(page, '(c) => c.kids[0].rewards.map((r) => r.name).join()'));
await S(page).getByLabel('Reward 2 name').fill(''); await save(page);
ok('a reward with no name is not saved', /no name/.test(await state(page)) && await cfg(page, '(c) => c.kids[0].rewards[1].name') === 'Ice cream', await state(page));
await S(page).locator('.sft [data-act="discard"]').click();
// a child without a list of his own shows the starters; changing them makes the list his
await S(page).getByRole('group', { name: 'Whose rewards' }).getByRole('button', { name: 'Charlie' }).click(); await page.waitForTimeout(150);
ok('Charlie shows the starter rewards', await S(page).getByLabel('Reward 1 name').inputValue() === 'Pick the family movie' && await cfg(page, '(c) => c.kids[1].rewards') === undefined);
await S(page).getByRole('button', { name: 'Cost of Pick the family movie: less' }).click(); await save(page);
ok('editing a starter makes the list his own', await cfg(page, '(c) => c.kids[1].rewards.map((r) => r.cost).join()') === '95,80');
await S(page).getByRole('button', { name: 'Close settings' }).click(); await page.waitForTimeout(400);
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c._kid = 0; c._page = 'kid'; }); await page.waitForTimeout(600);
ok('the child’s page shows the new reward', (await kidText(page)).includes('Ice cream'));
await page.close();

// 7. a medicine's name and time; a new one says which helpers it needs and can make them
page = await open('look=glass&sheet=settings&pane=medicines');
await S(page).getByLabel('Medicine 1 name').fill('Morning tablet'); await dial(page, S(page).locator('[data-med="0"] .stime'), 1, 3);
await save(page);
ok('medicine name and time saved', await cfg(page, '(c) => JSON.stringify(c.meds[0])') === '{"id":"riley_am","who":"Riley","label":"Morning tablet","time":"07:45"}', await cfg(page, '(c) => JSON.stringify(c.meds[0])'));
await S(page).locator('[data-act="med-add"]').click(); await page.waitForTimeout(200); await page.keyboard.type('Evening tablet');
await S(page).locator('[data-med="2"]').getByRole('button', { name: 'Max' }).click();
ok('a new medicine says it will need helpers', /needs two helpers/.test(await S(page).locator('[data-med="2"]').innerText()));
await save(page);
{ const m = await cfg(page, '(c) => c.meds[2]'); ok('new medicine saved with a usable id', /^[a-z0-9_]+$/.test(m.id) && m.label === 'Evening tablet' && m.who === 'Max' && m.time === '07:00', m);
  const t = await S(page).locator('[data-med="2"]').innerText(); ok('it lists the helpers to make, by name', t.includes(`input_datetime.fh_med_${m.id}`) && t.includes(`input_text.fh_med_${m.id}_by`) && /Not ready yet/.test(t));
  await S(page).locator('[data-med="2"] [data-act="med-helpers"]').click(); await page.waitForTimeout(500);
  ok('“Make them now” makes both helpers', (await page.evaluate(() => window.__calls.filter((c) => /\/create/.test(c)).join(' | '))) === `ws.input_datetime/create fh_med_${m.id} | ws.input_text/create fh_med_${m.id}_by` && /Ready/.test(await S(page).locator('[data-med="2"]').innerText())); }
await S(page).getByRole('button', { name: 'Remove Evening tablet' }).click(); await S(page).getByLabel('medicine name 1').fill('Antihistamine'); await save(page);
ok('medicine removed; “something else” list saved', await cfg(page, '(c) => c.meds.length + c.med_extras.join()') === '2Antihistamine,Ibuprofen');
await S(page).getByLabel('Medicine 2 name').fill(''); await save(page);
ok('a medicine with no name is not saved', /needs a name/.test(await state(page)) && await cfg(page, '(c) => c.meds[1].label') === 'Morning dose');
await page.close();

// 8. validation: a bad time (through the page, and through the shared rules) and a 3-digit PIN never reach the dashboard
page = await open('look=glass&sheet=settings&pane=morning');
await dial(page, S(page).getByRole('button', { name: /Morning board starts/ }), 0, 0, 'pm');
await save(page);
ok('a morning that ends before it starts is blocked', (await state(page)) === 'The morning board has to end after it starts.' && await saves(page) === 0);
await S(page).locator('.sft [data-act="discard"]').click(); await go(page, 'house');
await page.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings'); s._draft = { ...s._draft, night: { start: '25:00', end: '06:00' } }; }); await page.waitForTimeout(150);
await save(page);
ok('a time that is not a time is blocked', /night screen needs times/.test(await state(page)) && await saves(page) === 0, await state(page));
ok('the same rules guard the card (setConfig refuses what Settings refuses)', await page.evaluate(() => { const c = document.querySelector('family-hub-card'); try { c.setConfig({ ...c._config, night: { start: 'late', end: '06:00' } }); return false; } catch (e) { return /night start and end/.test(String(e)); } }));
await S(page).locator('.sft [data-act="discard"]').click(); await go(page, 'pin');
await S(page).getByLabel('Current PIN').fill('1234'); await S(page).getByLabel('New PIN', { exact: true }).fill('123'); await S(page).getByLabel('New PIN again').fill('123');
await save(page);
ok('a 3-digit PIN is blocked', (await state(page)) === 'A PIN is 4 to 8 digits.' && await saves(page) === 0 && await cfg(page, '(c) => c.parent_pin') === '1234');
await S(page).getByLabel('New PIN', { exact: true }).fill('4321'); await S(page).getByLabel('New PIN again').fill('4322'); await save(page);
ok('two different new PINs are blocked', (await state(page)) === 'The two new PINs are not the same.' && await saves(page) === 0);
await S(page).getByLabel('Current PIN').fill('9999'); await S(page).getByLabel('New PIN again').fill('4321'); await save(page);
ok('a wrong current PIN is blocked', (await state(page)) === 'That is not the current PIN.' && await saves(page) === 0);

// 9. changing the PIN: the old one stops working, the new one works
await S(page).getByLabel('Current PIN').fill('1234'); await save(page);
ok('PIN changed', await cfg(page, '(c) => c.parent_pin') === '4321' && (await state(page)) === 'All saved' && await S(page).getByLabel('New PIN', { exact: true }).inputValue() === '');
ok('the PIN is in no earlier version', await page.evaluate(() => !localStorage.getItem('family-hub-settings-history').includes('1234') && !JSON.stringify(window.__dash.family_hub_previous).includes('1234')));
await S(page).getByRole('switch', { name: 'PIN for recording medicine' }).click(); await S(page).getByRole('switch', { name: 'PIN for Ask after bedtime' }).click(); await save(page);
ok('PIN switches saved', await cfg(page, '(c) => `${c.meds_pin} ${c.chat.pin_after_bedtime}`') === 'false false');
await S(page).getByRole('button', { name: 'Close settings' }).click(); await page.waitForTimeout(400); await page.clock.fastForward(61_000);
await page.getByRole('button', { name: 'House info' }).click(); await page.waitForTimeout(300); await page.getByRole('button', { name: 'Settings, for grown-ups' }).click(); await page.waitForTimeout(300);
await pin(page, '1234');
ok('the old PIN no longer opens Settings', await S(page).count() === 0 && await page.locator('fh-pin').count() === 1);
await page.waitForTimeout(500); await pin(page, '4321');
ok('the new PIN does', await S(page).count() === 1);
await page.close();

// 10. House: night hours, what All off leaves on, look and sounds
page = await open('look=glass&sheet=settings&pane=house');
await S(page).getByRole('switch', { name: 'Night screen' }).click(); await page.waitForTimeout(150);
await dial(page, S(page).getByRole('button', { name: /Night screen starts/ }), 1, 6);
await save(page);
ok('night hours saved', await cfg(page, '(c) => JSON.stringify(c.night)') === '{"start":"22:30","end":"06:00"}', await cfg(page, '(c) => JSON.stringify(c.night)'));
await S(page).getByLabel('Search lights and switches').fill('patio'); await page.waitForTimeout(150);
ok('the picker searches by friendly name', (await S(page).locator('.spick [data-e]').evaluateAll((e) => e.map((x) => x.dataset.e).join())) === 'light.patio' && /Patio lights/.test(await S(page).locator('.spick').first().innerText()));
await S(page).locator('.spick [data-e="light.patio"]').click(); await S(page).getByLabel('Search lights and switches').fill('night sound'); await page.waitForTimeout(150); await S(page).locator('.spick [data-e="switch.sonos_night_sound"]').click();
await save(page);
ok('keep_on saved', await cfg(page, '(c) => (c.keep_on || []).join()') === 'light.patio,switch.sonos_night_sound');
await S(page).getByRole('group', { name: 'Look' }).getByRole('button', { name: /Orbit/i }).click(); await S(page).getByRole('group', { name: 'Touch sounds' }).getByRole('button', { name: 'Soft' }).click(); await S(page).getByRole('switch', { name: 'Life behind the page' }).click();
await S(page).getByRole('group', { name: 'Collection day' }).getByRole('button', { name: 'Thu' }).click();
await save(page);
ok('look, sounds, ambient and bin day saved', await cfg(page, '(c) => `${c.look} ${c.sounds} ${c.ambient} ${c.bins.day}`') === 'orbit quiet false 4');
ok('this screen follows the new look at once', await page.evaluate(() => document.querySelector('family-hub-card')._look) === 'orbit' && await S(page).getAttribute('data-look') === 'orbit');
await page.close();

// 11. a music moment's volume
page = await open('look=glass&sheet=settings&pane=music&moments=1');
await S(page).getByRole('button', { name: 'Change Dinner' }).click(); await page.waitForTimeout(200);
await S(page).getByRole('slider', { name: 'Volume for Dinner' }).focus(); for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
await S(page).getByRole('button', { name: 'Sleep timer: more' }).click();
await save(page);
ok('moment volume and sleep timer saved', await cfg(page, '(c) => `${c.music_moments[0].volume} ${c.music_moments[0].name} ${c.music_sleep_minutes}`') === '40 Dinner 35', await cfg(page, '(c) => `${c.music_moments[0].volume} ${c.music_sleep_minutes}`'));
await page.close();

// 12. a save that fails, or hangs, says so and keeps the edits
page = await open('look=glass&sheet=settings&pane=children');
await dial(page, S(page).getByRole('button', { name: /Riley’s bedtime/ }), -1, 0);
await page.evaluate(() => { window.__saveFail = true; }); await save(page);
ok('a failed save says it did not save', /did not save/.test(await state(page)) && /still here/.test(await state(page)), await state(page));
ok('and keeps the edit, unsaved', (await S(page).getByRole('button', { name: /Riley’s bedtime/ }).innerText()).trim() === '7:00 pm' && await cfg(page, '(c) => c.kids[0].bedtime') === '20:00' && await S(page).locator('.sft [data-act="save"]').isEnabled());
await page.evaluate(() => { window.__saveFail = false; window.__saveSlow = 60_000; });
await S(page).locator('.sft [data-act="save"]').click(); await page.waitForTimeout(300);
ok('while saving, the button says so', (await S(page).locator('.sft [data-act="save"]').innerText()).trim() === 'Saving…');
await page.clock.fastForward(13_000); await page.waitForTimeout(300);
ok('a save that hangs is given up honestly', /Home Assistant is slow/.test(await state(page)) && /Nothing was saved/.test(await state(page)) && (await S(page).getByRole('button', { name: /Riley’s bedtime/ }).innerText()).trim() === '7:00 pm', await state(page));
await page.evaluate(() => { window.__saveSlow = 0; }); await page.clock.fastForward(60_000); await page.waitForTimeout(200);
await page.close();
page = await open('look=glass&sheet=settings&pane=children&fail=1');
await S(page).getByRole('switch', { name: 'Calm mode' }).click(); await save(page);
ok('&fail=1 fails the save too', /did not save/.test(await state(page)) && await saves(page) === 0);
await page.close();

// 13. restore an earlier version (Advanced)
page = await open('look=glass'); await page.evaluate(() => localStorage.removeItem('family-hub-settings-history')); await page.close();
page = await open('look=glass&sheet=settings&pane=children');
await dial(page, S(page).getByRole('button', { name: /Riley’s bedtime/ }), -1, 0); await save(page);
await go(page, 'house'); await S(page).getByLabel('What the family is called').fill('team'); await save(page);
await go(page, 'advanced');
ok('earlier versions are listed with their times', await S(page).locator('[data-version]').count() === 2 && /Before a change to House/.test(await S(page).locator('[data-version]').first().innerText()), (await S(page).locator('[data-version]').allInnerTexts()).join(' / ').replace(/\n/g, ' '));
await S(page).locator('[data-version]').nth(1).locator('[data-act="restore"]').click(); await page.waitForTimeout(150);
ok('restoring asks first', await cfg(page, '(c) => c.kids[0].bedtime') === '19:00');
await S(page).locator('[data-act="restore-yes"]').click(); await page.waitForTimeout(500);
ok('the earlier version is back, PIN kept', await cfg(page, '(c) => `${c.kids[0].bedtime} ${c.family_name} ${c.parent_pin}`') === '20:00 everyone 1234' && await dashCard(page, '(c) => c.kids[0].bedtime') === '20:00', await toast(page));
await page.close();

// 14. read-only: not an administrator, a YAML dashboard, no card to be found
for (const [q, why] of [['admin=0', /administrator/], ['yaml=1', /YAML file/], ['nodash=1', /did not answer|could not be found/]]) {
  page = await open(`look=glass&sheet=settings&pane=children&${q}`);
  const note = await S(page).locator('.snote.ro').innerText();
  ok(`${q}: explains why in plain words`, why.test(note), note.slice(0, 70));
  ok(`${q}: values are shown but cannot be changed`, await S(page).getByLabel('Name', { exact: true }).inputValue() === 'Riley' && await S(page).locator('fieldset.spane').evaluate((f) => f.disabled) && await S(page).getByRole('switch', { name: 'Calm mode' }).isDisabled());
  ok(`${q}: there is no Save`, await S(page).locator('.sft [data-act="save"]').count() === 0 && /Read only/.test(await state(page)));
  await go(page, 'rewards'); ok(`${q}: other panes can still be read`, await S(page).getByLabel('Reward 1 name').inputValue() === 'Extra screen time' && await S(page).getByLabel('Reward 1 name').isDisabled());
  await page.close();
}

// 15. no PIN yet: Settings opens on its first step
page = await open('look=glass&nopin=1');
await page.getByRole('button', { name: 'House info' }).click(); await page.waitForTimeout(300); await page.getByRole('button', { name: 'Settings, for grown-ups' }).click(); await page.waitForTimeout(500);
ok('with no PIN, Settings opens on “Set a parent PIN”', await page.locator('fh-pin').count() === 0 && await S(page).locator('.snav [aria-current="page"]').getAttribute('data-pane') === 'pin' && /First, set a parent PIN/.test(await S(page).locator('.spane').innerText()));
await S(page).locator('.snav button[data-pane="children"]').click({ force: true }); await page.waitForTimeout(200);
ok('the other sections wait for a PIN', await S(page).locator('.snav [aria-current="page"]').getAttribute('data-pane') === 'pin' && /Set a parent PIN first/.test(await toast(page)));
await S(page).getByLabel('New PIN', { exact: true }).fill('2468'); await S(page).getByLabel('New PIN again').fill('2468');
ok('the one action is “Set the PIN”', (await S(page).locator('.sft .lead').innerText()).trim() === 'Set the PIN');
await save(page);
ok('the PIN is set and the sections open', await cfg(page, '(c) => c.parent_pin') === '2468' && await S(page).locator('.snav button[aria-disabled="true"]').count() === 0);
await page.close();

// 16. the dashboard draws the card again after a save: Settings comes back open on the same pane, with its toast
page = await open('look=glass&sheet=settings&pane=house&rebuild=1');
await page.evaluate(() => { window.__first = document.querySelector('family-hub-card'); });
await S(page).getByLabel('What the family is called').fill('crew'); await save(page); await page.waitForTimeout(600);
ok('a new card was drawn', await page.evaluate(() => document.querySelector('family-hub-card') !== window.__first));
ok('Settings is open again on House, saved, with Undo', await S(page).count() === 1 && await S(page).locator('.snav [aria-current="page"]').getAttribute('data-pane') === 'house' && await S(page).getByLabel('What the family is called').inputValue() === 'crew' && (await toast(page)) === 'Saved: House.', await toast(page));
await page.close();

// 17. jobs live in Home Assistant to-do lists: fields instead of tags, saved straight away
page = await open('look=glass&sheet=settings&pane=children&stab=jobs');
ok('jobs are grouped by part of the day', (await S(page).locator('.sjobs > .label').allInnerTexts()).join() === 'MORNING,AFTER SCHOOL,BEDTIME,ANY TIME', (await S(page).locator('.sjobs > .label').allInnerTexts()).join());
ok('no raw tags are shown', !/@job|@routine|@after|\+10/.test(await S(page).locator('.sjobs').innerText().then((t) => t.replace(/\+\d+/g, ''))) && /Unpack the dishwasher/.test(await S(page).locator('.sjobs').innerText()));
await S(page).getByRole('button', { name: 'Change Unpack the dishwasher' }).click(); await page.waitForTimeout(200);
await S(page).getByRole('button', { name: 'Points: more' }).click(); await S(page).getByLabel('Job name').fill('Empty the dishwasher'); await S(page).getByRole('group', { name: 'When' }).getByRole('button', { name: 'After school' }).click();
await S(page).locator('[data-act="job-save"]').click(); await page.waitForTimeout(500);
ok('a job is changed through todo.update_item', (await page.evaluate(() => window.__calls.filter((c) => c.startsWith('todo.update_item')).pop())).includes('"rename":"Empty the dishwasher","description":"+15 @job @after"'), await page.evaluate(() => window.__calls.filter((c) => c.startsWith('todo.update_item')).pop()));
ok('the card’s configuration was not touched', await saves(page) === 0);
await S(page).locator('[data-act="job-add"]').click(); await page.waitForTimeout(200); await page.keyboard.type('Water the plants');
await S(page).getByLabel('Picture (an emoji)').fill('🪴'); await S(page).getByRole('button', { name: 'Timer minutes: more' }).click(); await S(page).getByRole('switch', { name: 'Music while the timer runs' }).click();
await S(page).locator('[data-act="job-save"]').click(); await page.waitForTimeout(500);
ok('a job is added with its tags written for it', (await page.evaluate(() => window.__calls.filter((c) => c.startsWith('todo.add_item')).pop())).includes('{"item":"Water the plants","description":"+10 @job 5 min @icon:🪴 @song"}'), await page.evaluate(() => window.__calls.filter((c) => c.startsWith('todo.add_item')).pop()));
await S(page).getByRole('button', { name: 'Move Make bed down' }).click(); await page.waitForTimeout(500);
ok('a job can be moved', (await S(page).locator('.sjobs .sname').allInnerTexts()).slice(0, 2).join() === 'Pack school bag,Make bed');
await S(page).getByRole('button', { name: 'Change Water the plants' }).click(); await page.waitForTimeout(200); await S(page).locator('[data-act="job-remove"]').click(); await page.waitForTimeout(500);
ok('a job is removed, and can be put back', !(await S(page).locator('.sjobs').innerText()).includes('Water the plants') && await S(page).locator('[data-act="job-undo"]').count() === 1);
await S(page).locator('[data-act="job-undo"]').click(); await page.waitForTimeout(500);
ok('put back', (await S(page).locator('.sjobs').innerText()).includes('Water the plants'));
await page.close();
page = await open('look=glass&sheet=settings&pane=children&stab=jobs&fail=1');
await S(page).getByRole('button', { name: 'Change Unpack the dishwasher' }).click(); await S(page).getByRole('button', { name: 'Points: more' }).click(); await S(page).locator('[data-act="job-save"]').click(); await page.waitForTimeout(600);
ok('a job change that fails says so and keeps the form', /did not save/.test(await toast(page)) && await S(page).locator('[data-act="job-save"]').count() === 1, await toast(page));
await page.close();

// 18. renaming a child keeps his helpers and follows him through the configuration
page = await open('look=glass&sheet=settings&pane=children');
await S(page).getByLabel('Name', { exact: true }).fill('Ry'); await save(page);
ok('rename keeps the helpers and renames him elsewhere', await cfg(page, '(c) => `${c.kids[0].name} ${c.kids[0].id} ${c.meds[0].who} ${c.people[2].name} ${c.calendars[3].name} ${c.music_map[0].rooms[1].kids[0]}`') === 'Ry riley Ry Ry Ry Ry', await cfg(page, '(c) => `${c.kids[0].name} ${c.kids[0].id} ${c.meds[0].who} ${c.people[2].name} ${c.calendars[3].name} ${c.music_map[0].rooms[1].kids[0]}`'));
await S(page).getByRole('button', { name: 'Close settings' }).click(); await page.waitForTimeout(400);
await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c._kid = 0; c._page = 'kid'; }); await page.waitForTimeout(700);
ok('his page still has his jobs and points', (await kidText(page)).includes('Unpack the dishwasher') && (await kidText(page)).includes('120'));
await page.close();

// 19. on a touch panel the on-screen keyboard types into the field in focus
page = await open('look=glass&sheet=settings&pane=people&keys=1');
await S(page).getByLabel('parent 1').click(); await page.waitForTimeout(250);
ok('the keyboard appears for the field in focus', await S(page).locator('.skeys .key').count() > 30);
await S(page).locator('.skeys .key', { hasText: /^x$/i }).click(); await page.waitForTimeout(100);
ok('a key types into it', await S(page).getByLabel('parent 1').inputValue() === 'Alexx');
await S(page).locator('[data-act="keys-done"]').click(); await page.waitForTimeout(150); ok('Done puts the keyboard away', await S(page).locator('.skeys').count() === 0);
await go(page, 'pin'); await S(page).locator('.sft [data-act="discard"]').click(); await go(page, 'pin'); await S(page).getByLabel('New PIN', { exact: true }).click(); await page.waitForTimeout(200);
ok('PIN fields get number keys', await S(page).locator('.skeys .sdig .key').count() === 11);
await page.close();

// 20. the children's own say: the style studio opens from a child's page without the PIN, and nothing in Settings stands in its way
page = await open('look=glass&page=kid&kid=0');
await page.locator('fh-kid .studio').click(); await page.waitForTimeout(500);
ok('a child opens the style studio with no PIN', await page.locator('fh-studio').count() === 1 && await page.locator('fh-pin').count() === 0);
ok('a child’s page has no way into Settings', await page.getByRole('button', { name: 'House info' }).count() === 0 && await S(page).count() === 0);
await page.close();

// 21. the sizes: nothing off the edge, the section list becomes a row of tabs on a phone
for (const [w, h] of [[1920, 1080], [1312, 668], [1024, 768], [768, 1024], [390, 844]]) {
  const c2 = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: w < 500, isMobile: w < 500 }); const p = await c2.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await p.goto(`http://localhost:${PORT}/?look=glass&sheet=settings&pane=rewards`); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(700);
  const r = await p.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings').shadowRoot; const box = s.querySelector('.sbox').getBoundingClientRect(); let off = 0, small = 0;
    s.querySelectorAll('button, input').forEach((e) => { const b = e.getBoundingClientRect(); if (!b.width) return; if (b.right > innerWidth + 1 || b.left < -1) { if (!e.closest('.snav')) off++; } if (e.matches('button') && (b.width < 43.5 || b.height < 43.5)) small++; });
    return { fits: box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1 && box.top >= -1, off, small, nav: getComputedStyle(s.querySelector('.snav')).flexDirection, save: !!s.querySelector('.sft [data-act="save"]').getBoundingClientRect().width, sideways: s.querySelector('.spane').scrollWidth > s.querySelector('.spane').clientWidth + 2 }; });
  ok(`${w}x${h}: fits, nothing off the side, targets 44 px, Save in view`, r.fits && !r.off && !r.small && r.save && !r.sideways && r.nav === (w <= 768 ? 'row' : 'column'), r);
  await c2.close();
}

console.log(`\n${pass} passed, ${fails.length} failed${fails.length ? ':\n - ' + fails.join('\n - ') : ''}`);
console.log('errors:', errs.length ? [...new Set(errs)].join('\n') : 'none');
await browser.close(); srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
