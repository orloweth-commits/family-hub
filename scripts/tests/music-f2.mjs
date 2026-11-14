// Music, the working part (F2): House and Scene are the two views and one tap swaps them, the other four are switched on in
// Settings; everything a drag does a tap does too (moving the music to a room, pinning); and something carried onto a name is
// pinned to that person's shelf, behind the PIN.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4807] node scripts/tests/music-f2.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4807);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, { store = {}, w = 1920, h = 1080 } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU' });
  await ctx.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, store);
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await page.goto('http://localhost:' + PORT + '/?look=glass&calm=1&' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const M = (page) => page.locator('fh-music');
const mus = (page, f) => page.evaluate(`(${f})(document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music'))`);
const calls = (page, re) => page.evaluate((s) => (window.__calls || []).filter((c) => new RegExp(s).test(c)), re.source);
const clear = (page) => page.evaluate(() => { (window.__calls ??= []).length = 0; });
const pin = async (page) => { for (const d of '1234') await M(page).locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(700); };
const mid = async (loc) => { const b = await loc.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
/** Press at one place, travel, and let go at another; `during` runs with the finger still down. */
const drag = async (page, from, to, during) => { await page.mouse.move(from[0], from[1]); await page.mouse.down(); const fn = typeof to === 'function'; await page.mouse.move(fn ? from[0] + 30 : (from[0] + to[0]) / 2, fn ? from[1] - 40 : (from[1] + to[1]) / 2, { steps: 5 }); await page.waitForTimeout(150);
  const aim = fn ? await to() : to; await page.mouse.move(aim[0], aim[1], { steps: 5 }); await page.waitForTimeout(120); const seen = during ? await during() : undefined; await page.mouse.up(); await page.waitForTimeout(450); return seen; };
const toast = (page) => M(page).locator('.toast').innerText().catch(() => '');
const shut = (page) => page.context().close();
const viewBtn = (page) => M(page).getByRole('button', { name: 'Change the view', exact: true });

// 1. two views, one tap
{ const page = await open('page=music');
  ok('the Music page opens on the House', await M(page).locator('.maprow').count() === 1);
  await viewBtn(page).click(); await page.waitForTimeout(500);
  ok('one tap on the view button shows the Scene, with no picker', await M(page).locator('.vscene').count() === 1 && await M(page).locator('.vcard').count() === 0);
  await viewBtn(page).click(); await page.waitForTimeout(500);
  ok('and one more is the House again', await M(page).locator('.maprow').count() === 1 && await M(page).locator('.vscene').count() === 0);
  ok('the choice is remembered on this screen', await page.evaluate(() => localStorage.getItem('fh-music-view')) === '"house"', await page.evaluate(() => localStorage.getItem('fh-music-view')));
  await shut(page); }
{ const page = await open('page=music', { store: { 'fh-music-view': '"desk"' } });
  ok('a screen that was left on the Desk comes back on the House', await M(page).locator('.maprow').count() === 1 && await M(page).locator('.vdesk, .desk').count() === 0);
  await shut(page); }
{ const page = await open('page=music&mviews=dial,desk');
  await viewBtn(page).click(); await page.waitForTimeout(400);
  const cards = await M(page).locator('.vcard b').allInnerTexts();
  ok('with two more switched on in Settings the button opens the picker with four', cards.join(',') === 'House,Scene,Dial,Desk', cards);
  await M(page).locator('.vcard', { hasText: 'Desk' }).click(); await page.waitForTimeout(500);
  ok('and a view picked there is shown', await mus(page, (m) => m._mode) === 'desk');
  await shut(page); }

// 2. the four other views are switches in Settings, Music
{ const page = await open('page=planner&sheet=settings&pane=music');
  const S = page.locator('fh-settings'), box = S.locator('[data-views]');
  ok('Settings, Music has a card for the ways to see the rooms', await box.count() === 1);
  const sw = box.getByRole('switch');
  ok('with a switch each for Dial, Desk, Crate and List, all off', await sw.count() === 4 && (await sw.evaluateAll((n) => n.map((x) => x.getAttribute('aria-checked')))).every((v) => v === 'false'), await sw.count());
  await box.getByRole('switch', { name: 'Desk view' }).click(); await page.waitForTimeout(200);
  await box.getByRole('switch', { name: 'Dial view' }).click(); await page.waitForTimeout(200);
  const draft = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.music_views);
  ok('switching two on writes them to the card, in the page’s order', JSON.stringify(draft) === '["dial","desk"]', draft);
  await box.getByRole('switch', { name: 'Desk view' }).click(); await box.getByRole('switch', { name: 'Dial view' }).click(); await page.waitForTimeout(200);
  ok('and switching them off again leaves nothing behind', await page.evaluate(() => !('music_views' in document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft)));
  await shut(page); }

// 3. a tap for carrying the music to a room, in both views
for (const view of ['house', 'scene']) { const page = await open(`page=music&mview=${view}`);
  ok(`${view}: no "Move the music" while the room in focus has the music`, await M(page).locator('.moveh').count() === 0);
  if (view === 'house') await M(page).locator('.mzone[data-zone="media_player.office"] .zname').click(); else await M(page).locator('.actor[data-zone="media_player.office"] .atx').click();
  await page.waitForTimeout(300);
  const b = M(page).locator('.moveh');
  ok(`${view}: tap a quiet room’s name and "Move the music to" it is offered`, await b.count() === 1 && /Move the music to Office/.test(await b.innerText().catch(() => '')), await b.innerText().catch(() => 'none'));
  await clear(page); await b.click(); await page.waitForTimeout(500);
  const c = await calls(page, /transfer_queue/);
  ok(`${view}: one tap moves it there`, c.length === 1 && /media_player\.office/.test(c[0]) && /source_player":"media_player\.kitchen/.test(c[0]), c);
  ok(`${view}: and the offer goes once the music is there`, await M(page).locator('.moveh').count() === 0);
  await shut(page); }

// 4. carry what is playing onto a name: the PIN, then it is pinned; Undo takes it off
{ const page = await open('page=music&mview=house');
  const puck = M(page).locator('.mzone[data-zone="media_player.kitchen"] .puck');
  ok('no shelf names float over the page until something is carried', await M(page).locator('.pinstrip').count() === 0);
  await clear(page);
  const p0 = await mid(puck), names = await drag(page, p0, [p0[0], p0[1] - 90], async () => M(page).locator('.pinstrip .pinto b').allInnerTexts());
  ok('carrying the music shows every shelf by name', (names ?? []).join(',') === 'Family,Riley,Charlie,Max', names);
  ok('letting go in its own room pins nothing and leaves the music where it was', (await calls(page, /todo\.add_item|transfer_queue/)).length === 0 && await M(page).locator('fh-pin').count() === 0);
  const hot = await drag(page, await mid(puck), () => mid(M(page).locator('.pinto[data-pin="Max"]')), async () => M(page).locator('.pinto[data-pin="Max"]').getAttribute('data-hot'));
  ok('the name under the finger lights up', hot !== null);
  ok('letting go on a name asks for the PIN, naming the shelf', await M(page).locator('fh-pin').count() === 1 && /Max’s shelf/.test(await M(page).locator('fh-pin h2').innerText()), await M(page).locator('fh-pin h2').innerText().catch(() => ''));
  ok('nothing is pinned before the PIN', (await calls(page, /todo\.add_item/)).length === 0);
  await pin(page);
  const c = await calls(page, /todo\.add_item/);
  ok('the PIN pins it to that shelf', c.length === 1 && /todo\.max_music/.test(c[0]), c);
  ok('and the page says so, with Undo', /Pinned to Max’s shelf/.test(await toast(page)) && await M(page).locator('.toast button').count() === 1, await toast(page));
  ok('carrying it did not pause the music or move it', (await calls(page, /media_play_pause|transfer_queue/)).length === 0);
  await M(page).locator('.toast button').click(); await page.waitForTimeout(500);
  ok('Undo takes it off the shelf', (await calls(page, /todo\.remove_item/)).length === 1 && /taken off Max’s shelf/.test(await toast(page)), await toast(page));
  // a short press is still a tap
  await clear(page); await puck.click(); await page.waitForTimeout(300);
  ok('a tap on the music still pauses it', (await calls(page, /media_play_pause/)).length === 1);
  await shut(page); }

// 5. a record from the shelf beside the house onto a face; twice is refused; with no PIN set it pins straight away
{ const page = await open('page=music&mview=house&nopin=1');
  const rec = M(page).locator('.mshelf .srec').first(), name = (await rec.getAttribute('aria-label')).split('. Tap')[0];
  await clear(page);
  await drag(page, await mid(rec), await mid(M(page).locator('.swho[data-pin="Riley"]')));
  let c = await calls(page, /todo\.add_item/);
  ok('a family record carried onto a face is pinned to that child’s shelf (no PIN set: at once)', c.length === 1 && /todo\.riley_music/.test(c[0]) && c[0].includes(name.slice(0, 12)), c);
  ok('and it was not played', (await calls(page, /play_media/)).length === 0);
  await clear(page); await page.waitForTimeout(500);
  await drag(page, await mid(rec), await mid(M(page).locator('.swho[data-pin="Riley"]')));
  ok('a second time it says it is already there', (await calls(page, /todo\.add_item/)).length === 0 && /already on Riley’s shelf/.test(await toast(page)), await toast(page));
  await clear(page); await page.waitForTimeout(500); await rec.click(); await page.waitForTimeout(400);
  ok('a tap on a record still plays it', (await calls(page, /play_media/)).length === 1);
  await shut(page); }

// 6. the tap for pinning what is playing
{ const page = await open('page=music&mview=house');
  const b = M(page).getByRole('button', { name: 'Pin what is playing to a shelf' });
  ok('a pin button stands with the view’s tools while music is on', await b.count() === 1);
  await clear(page); await b.click(); await page.waitForTimeout(300);
  ok('it asks for the PIN', await M(page).locator('fh-pin').count() === 1); await pin(page);
  const sheet = M(page).getByRole('dialog', { name: 'Pin to a shelf' });
  ok('then asks whose shelf', await sheet.count() === 1 && await sheet.locator('.setrow').count() === 4);
  ok('the Desk’s pads are not offered while the Desk is switched off', !/moment pad/.test(await sheet.innerText()));
  await sheet.locator('.setrow').first().getByRole('button', { name: 'Pin', exact: true }).click(); await page.waitForTimeout(600);
  const c = await calls(page, /todo\.add_item/);
  ok('and pins it there', c.length === 1 && /todo\.family_music/.test(c[0]), c);
  await shut(page); }
{ const page = await open('page=music&mview=house&mviews=all&nopin=1');
  await M(page).getByRole('button', { name: 'Pin what is playing to a shelf' }).click(); await page.waitForTimeout(300);
  ok('with the Desk switched on the pin sheet offers its pads', /moment pad/.test(await M(page).getByRole('dialog', { name: 'Pin to a shelf' }).innerText()));
  await shut(page); }

// 7. Scene: the music in the middle is carried onto a name the same way
{ const page = await open('page=music&mview=scene&nopin=1'); await clear(page);
  await drag(page, await mid(M(page).locator('.puck.spot')), () => mid(M(page).locator('.pinto[data-pin="Charlie"]')));
  const c = await calls(page, /todo\.add_item/);
  ok('scene: the music carried onto a name is pinned', c.length === 1 && /todo\.charlie_music/.test(c[0]), c);
  await shut(page); }

// 8. Shelves: a record onto a name; in Edit a pin button does the same by tap
{ const page = await open('page=music&mtab=shelves&shelf=Max'); await clear(page);
  const rec = M(page).locator('.covers .st').first();
  await drag(page, await mid(rec), await mid(M(page).locator('.pchip[data-pin="Family"]')));
  ok('shelves: a record carried onto a name asks for the PIN', await M(page).locator('fh-pin').count() === 1 && /the family shelf/.test(await M(page).locator('fh-pin h2').innerText()));
  await pin(page);
  let c = await calls(page, /todo\.add_item/);
  ok('shelves: and is pinned to that shelf too', c.length === 1 && /todo\.family_music/.test(c[0]), c);
  ok('shelves: the name it was dropped on was not opened (still on Max’s shelf)', await mus(page, (m) => m._shelf) === 'Max');
  await page.waitForTimeout(400); await M(page).getByRole('button', { name: 'Edit', exact: true }).click(); await page.waitForTimeout(200); if (await M(page).locator('fh-pin').count()) await pin(page);
  const px = M(page).locator('.covers .st .pinx').first();
  ok('shelves, Edit: each record has a pin button', await px.count() === 1);
  await px.click(); await page.waitForTimeout(300);
  ok('shelves, Edit: it opens "whose shelf?"', await M(page).getByRole('dialog', { name: 'Pin to a shelf' }).count() === 1);
  await shut(page); }

// 9. Search: a result onto a name; a tap still selects it
{ const page = await open('page=music&mtab=search&find=Bluey&nopin=1'); await page.waitForTimeout(600); await clear(page);
  const hit = M(page).locator('.hits .hit').first(), title = await hit.locator('.tx b').innerText();
  await drag(page, await mid(hit), () => mid(M(page).locator('.pinto[data-pin="Max"]')));
  const c = await calls(page, /todo\.add_item/);
  ok('search: a result carried onto a name is pinned', c.length === 1 && /todo\.max_music/.test(c[0]) && c[0].includes(title.slice(0, 10)), c);
  await page.waitForTimeout(500); await hit.click(); await page.waitForTimeout(200);
  ok('search: a tap on a result still selects it', await hit.getAttribute('aria-pressed') === 'true');
  await shut(page); }

console.log(`\n${pass} passed, ${fails.length} failed${fails.length ? ': ' + fails.join(' | ') : ''}`);
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close(); process.exit(fails.length ? 1 : 0);
