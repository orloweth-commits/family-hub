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
  // (since 0.38.26 Scene has a switch too, on unless the list leaves it out)
  ok('with a switch each for Scene (on), Dial, Desk, Crate and List (off)', await sw.count() === 5 && (await sw.evaluateAll((n) => n.map((x) => x.getAttribute('aria-checked')))).join(',') === 'true,false,false,false,false', await sw.count());
  await box.getByRole('switch', { name: 'Desk view' }).click(); await page.waitForTimeout(200);
  await box.getByRole('switch', { name: 'Dial view' }).click(); await page.waitForTimeout(200);
  const draft = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.music_views);
  ok('switching two on writes them to the card, in the page’s order', JSON.stringify(draft) === '["dial","desk"]', draft);
  await box.getByRole('switch', { name: 'Desk view' }).click(); await box.getByRole('switch', { name: 'Dial view' }).click(); await page.waitForTimeout(200);
  ok('and switching them off again leaves nothing behind', await page.evaluate(() => !('music_views' in document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft)));
  // 0.38.26 (the second review's cut, item 6): Scene off writes the whole list, House and the others; on again goes back to the list of the others alone
  const dr = () => page.evaluate(() => JSON.stringify(document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.music_views ?? null));
  await box.getByRole('switch', { name: 'Desk view' }).click(); await box.getByRole('switch', { name: 'List view' }).click(); await box.getByRole('switch', { name: 'Scene view' }).click(); await page.waitForTimeout(200);
  ok('0.38.26: Desk and List on, Scene off: the list is House, Desk and List', await dr() === '["house","desk","list"]' && await box.getByRole('switch', { name: 'Scene view' }).getAttribute('aria-checked') === 'false', await dr());
  await box.getByRole('switch', { name: 'Scene view' }).click(); await page.waitForTimeout(200);
  ok('0.38.26: Scene on again: the list is Desk and List alone, as before', await dr() === '["desk","list"]', await dr());
  await shut(page); }
{ const offer = async (v) => { const page = await open(`page=music&mviews=${v}`); const o = await mus(page, (m) => m._offered.join(',')); await shut(page); return o; };
  const live = await offer('house,desk,list'), old = await offer('desk,list'), withScene = await offer('house,scene,desk');
  ok('0.38.26: music_views [house, desk, list] offers House, Desk and List: no Scene', live === 'house,desk,list', live);
  ok('0.38.26: a list of the others alone keeps Scene, as before', old === 'house,scene,desk,list', old);
  ok('0.38.26: a whole list naming Scene offers it', withScene === 'house,scene,desk', withScene); }

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
  ok('the four moment pads are offered (they stand beside the House now, with the Desk off)', /moment pad/.test(await sheet.innerText()) && await sheet.getByRole('button', { name: /^Put it on the .* pad/ }).count() === 4);
  await sheet.locator('.setrow').first().getByRole('button', { name: 'Pin', exact: true }).click(); await page.waitForTimeout(600);
  const c = await calls(page, /todo\.add_item/);
  ok('and pins it there', c.length === 1 && /todo\.family_music/.test(c[0]), c);
  await shut(page); }
{ const page = await open('page=music&mview=house&mviews=all&nopin=1');
  await M(page).getByRole('button', { name: 'Pin what is playing to a shelf' }).click(); await page.waitForTimeout(300);
  ok('with the Desk switched on the pin sheet still offers the pads', /moment pad/.test(await M(page).getByRole('dialog', { name: 'Pin to a shelf' }).innerText()));
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

// 9. one bar on every tab (the polish block, batch 2)
{ const page = await open('page=music&calm=1'); await page.waitForTimeout(12600); // the three first-visit coach marks have gone
  const box = async (sel) => M(page).locator(sel).first().boundingBox();
  const tabsAt = async () => { const b = await box('.mhead .tabs'); return b && [Math.round(b.x), Math.round(b.y)]; };
  const at0 = await tabsAt(); const seen = [];
  for (const t of ['Shelves', 'Jukebox', 'Radio', 'Call a room', 'Rooms']) { await M(page).getByRole('tab', { name: t }).click(); await page.waitForTimeout(350); seen.push({ t, at: await tabsAt(), stage: await M(page).locator('.stage').isVisible(), now: await M(page).locator('.mhead .nowbar').count(), words: await M(page).locator('.mhead .tabs button span').first().isVisible() }); }
  ok('the tabs stand in the same place on every tab', seen.every((x) => x.at && x.at[0] === at0[0] && x.at[1] === at0[1]), [at0, seen.map((x) => x.at)]);
  ok('with their words', seen.every((x) => x.words));
  ok('every tab is a full page: the big player is away', seen.every((x) => !x.stage));
  ok('and the small player is in the bar on every tab', seen.every((x) => x.now === 1), seen.map((x) => x.now));
  await M(page).getByRole('tab', { name: 'Shelves' }).click(); await page.waitForTimeout(350);
  const rec = await box('.covers .st .img'); ok('a full page gives the shelf bigger records (170 px or more)', !!rec && rec.width >= 170, rec && Math.round(rec.width));
  await M(page).getByRole('button', { name: 'Show the full player' }).click(); await page.waitForTimeout(400);
  const st = await box('.stage'), pn = await box('.panel');
  ok('the small player opens the full one over the page, not beside it', !!st && !!pn && st.x >= pn.x && st.x + st.width <= pn.x + pn.width + 1 && Math.abs((await tabsAt())[0] - at0[0]) < 1, st && [Math.round(st.x), Math.round(st.width)]);
  await M(page).getByRole('button', { name: 'Hide the player', exact: true }).first().click(); await page.waitForTimeout(350);
  ok('and its ✕ puts it away', !(await M(page).locator('.stage').isVisible()));
  await M(page).getByRole('button', { name: 'Show the full player' }).click(); await page.waitForTimeout(300); await M(page).locator('.pscrim').click({ position: { x: 40, y: 300 } }); await page.waitForTimeout(350);
  ok('so does a tap beside it', !(await M(page).locator('.stage').isVisible()));
  // the moment pads beside the House
  await M(page).getByRole('tab', { name: 'Rooms' }).click(); await page.waitForTimeout(350);
  const pads = M(page).locator('.hpads .hpad'); ok('four moment pads stand beside the House', await pads.count() === 4, await pads.allInnerTexts());
  const pb = await pads.first().boundingBox(); ok('each big enough for a finger (44 px)', !!pb && pb.height >= 44 && pb.width >= 44, pb && [Math.round(pb.width), Math.round(pb.height)]);
  const before = await page.evaluate(() => (window.__calls ?? []).length);
  await pads.first().click(); await page.waitForTimeout(900);
  const calls = await page.evaluate((n) => (window.__calls ?? []).slice(n).join(' ~ '), before);
  ok('a tap on a pad starts its music', /play_media/.test(calls), calls.slice(0, 200));
  // a tap while the hint shows is not lost (the row must not move under the finger)
  const p2 = await open('page=music'); await p2.waitForTimeout(600);
  await M(p2).getByRole('tab', { name: 'Radio' }).click(); await p2.waitForTimeout(400);
  ok('a tap on a tab while the first-visit hint is showing lands', await M(p2).getByRole('tab', { name: 'Radio' }).getAttribute('aria-selected') === 'true');
  await p2.context().close(); await page.context().close(); }

// 10. the rest of batch 2: three coach marks, the names in the bar while carrying, the side shelf, Radio and Call a room on a full page
{ const page = await open('page=music'); await page.waitForTimeout(500);
  const hint = () => M(page).locator('.hint[data-on]').innerText().catch(() => ''), teach = () => M(page).locator('.panel').getAttribute('data-teach');
  const ring = (sel) => M(page).locator(sel).first().evaluate((e) => getComputedStyle(e).outlineStyle !== 'none' && parseFloat(getComputedStyle(e).outlineWidth) >= 2).catch(() => false);
  const h1 = await hint();
  ok('the House opens on the first of three coach marks, and it names the tap before the drag', /^1 of 3/.test(h1) && /Tap a quiet room, then Move the music\. Or carry/.test(h1), h1);
  ok('what the mark is about wears a ring: the quiet rooms', await teach() === 'move' && await ring('.mzone:not([data-live]) .zname') && !(await ring('.mzone[data-live] .zname')), await teach());
  ok('the mark is a line in the bar, never over the view', await M(page).locator('.hint[data-on]').evaluate((h) => !!h.closest('.mhead') && h.getBoundingClientRect().bottom <= h.getRootNode().querySelector('.body').getBoundingClientRect().top + 1));
  await page.waitForTimeout(4000); const h2 = await hint();
  ok('four seconds on, the second: volume, by a tap or a slide', /^2 of 3/.test(h2) && /Tap the speaker buttons/.test(h2) && /slide/.test(h2) && await teach() === 'vol' && await ring('.mzone .vstep'), h2);
  await page.waitForTimeout(4000); const h3 = await hint();
  ok('then the third: pinning, by a tap or by carrying onto a name', /^3 of 3/.test(h3) && /Tap the pin, then a name/.test(h3) && /carry it onto a name/.test(h3) && await teach() === 'pin' && await ring('.pinb') && await ring('.swho i'), h3);
  ok('no mark is cut or runs past two lines', await M(page).locator('.hint[data-on]').evaluate((h) => h.scrollHeight <= h.clientHeight + 1 && h.offsetHeight <= 37));
  await page.waitForTimeout(4300);
  ok('and then they go by themselves, the rings with them', await M(page).locator('.hint[data-on]').count() === 0 && await teach() === null && !(await ring('.pinb')));
  const q = M(page).getByRole('button', { name: 'How this view works' });
  await q.click(); await page.waitForTimeout(250); const a1 = await hint();
  await q.click(); await page.waitForTimeout(250); const a2 = await hint();
  await q.click(); await page.waitForTimeout(250); const a3 = await hint();
  await q.click(); await page.waitForTimeout(250);
  ok('"?" plays them again, and a tap on it while one shows goes on to the next', /^1 of 3/.test(a1) && /^2 of 3/.test(a2) && /^3 of 3/.test(a3) && await M(page).locator('.hint[data-on]').count() === 0, [a1.slice(0, 6), a2.slice(0, 6), a3.slice(0, 6)]);
  await q.click(); await page.waitForTimeout(250); await M(page).locator('.mzone[data-zone="media_player.office"] .zname').click(); await page.waitForTimeout(300);
  ok('a touch anywhere else puts them away, and the touch still lands', await M(page).locator('.hint[data-on]').count() === 0 && await M(page).locator('.mzone[data-zone="media_player.office"]').getAttribute('data-focus') !== null);
  await q.click(); await page.waitForTimeout(250); const pk = await mid(M(page).locator('.mzone[data-zone="media_player.kitchen"] .puck')); await page.mouse.move(pk[0], pk[1]); await page.mouse.down(); await page.waitForTimeout(150); const gone = await M(page).locator('.hint[data-on]').count() === 0; await page.mouse.up(); await page.waitForTimeout(300);
  ok('so does a finger coming down on the record in a room', gone);
  await shut(page);
  const sc = await open('page=music&mview=scene'); await sc.waitForTimeout(500);
  const ringS = (sel) => M(sc).locator(sel).evaluateAll((els) => els.length > 0 && els.every((e) => getComputedStyle(e).outlineStyle !== 'none' && parseFloat(getComputedStyle(e).outlineWidth) >= 2)).catch(() => false);
  const s1 = await M(sc).locator('.hint[data-on]').innerText(), t1 = await M(sc).locator('.panel').getAttribute('data-teach'), r1 = await ringS('.actor:not([data-offline]) .aname');
  await sc.waitForTimeout(4000); const s2 = await M(sc).locator('.hint[data-on]').innerText();
  const r2 = await ringS('.actor:not([data-live]):not([data-offline]) .aname'), r2live = await ringS('.actor[data-live] .aname');
  ok('the Scene has three too: its own game first, then the tap', /^1 of 3/.test(s1) && /together/.test(s1) && /^2 of 3/.test(s2) && /Tap a quiet room, then Move the music/.test(s2), [s1, s2]);
  ok('the Scene\'s first mark rings every name it is about, the second the quiet ones (backlog 149)', t1 === 'join' && r1 && r2 && !r2live, [t1, r1, r2, r2live]);
  await shut(sc);
  const dl = await open('page=music&mview=dial'); await dl.waitForTimeout(500);
  ok('a view with one line shows it without a count', await M(dl).locator('.hint[data-on]').count() === 1 && await M(dl).locator('.hstep').count() === 0, await M(dl).locator('.hint[data-on]').innerText().catch(() => ''));
  await shut(dl); }
{ const page = await open('page=music&calm=1'); await page.waitForTimeout(12600);
  const bx = async (sel) => M(page).locator(sel).first().boundingBox();
  // the strip of names while something is carried
  const head = await bx('.mhead'), tabs0 = await bx('.mhead .tabs');
  const puck = M(page).locator('.mzone[data-zone="media_player.kitchen"] .puck'), p0 = await mid(puck);
  const seen = await drag(page, p0, [p0[0] + 60, p0[1] - 120], async () => ({ strip: await bx('.pinstrip'), tabs: await bx('.mhead .tabs'), tabsShown: await M(page).locator('.mhead .tabs').evaluate((e) => getComputedStyle(e).visibility), now: await M(page).locator('.mhead .nowbar').evaluate((e) => getComputedStyle(e).visibility),
    dark: await M(page).locator('.pinstrip').evaluate((e) => getComputedStyle(e).backgroundColor), names: await M(page).locator('.pinto').evaluateAll((n) => n.map((e) => e.offsetHeight)), over: await M(page).locator('.pinstrip').evaluate((e) => e.getBoundingClientRect().bottom - e.getRootNode().querySelector('.body').getBoundingClientRect().top) }));
  ok('while something is carried the names stand in the bar’s own row', !!seen?.strip && Math.abs(seen.strip.y - head.y) < 3 && Math.abs(seen.strip.height - head.height) < 4 && Math.abs(seen.strip.x - head.x) < 3, seen && [seen.strip, head]);
  ok('and never over the page under it', !!seen && seen.over <= 1, seen?.over);
  ok('the tabs step back without moving, and the small player stays', seen?.tabsShown === 'hidden' && seen?.now === 'visible' && Math.abs(seen.tabs.x - tabs0.x) < 1 && Math.abs(seen.tabs.y - tabs0.y) < 1, seen && [seen.tabsShown, seen.now]);
  ok('each name is a target of 44 px or more', !!seen && seen.names.length === 4 && seen.names.every((h) => h >= 44), seen?.names);
  ok('the strip wears the page’s glass, not a black pill', !!seen && !/rgba?\(15, 15, 20/.test(seen.dark), seen?.dark);
  ok('and when the finger lifts the bar is back', await M(page).locator('.pinstrip').count() === 0 && await M(page).locator('.mhead .tabs').evaluate((e) => getComputedStyle(e).visibility) === 'visible');
  // the side shelf beside the House
  const zoom = await M(page).locator('.mshelf').evaluate((e) => e.getBoundingClientRect().width / e.offsetWidth);
  const rec3 = await M(page).locator('.srec .puck').first().evaluate((e) => e.offsetWidth), grid3 = await M(page).locator('.srecs').evaluate((e) => [getComputedStyle(e).getPropertyValue('--cols').trim(), getComputedStyle(e).getPropertyValue('--rows').trim(), e.children.length]);
  ok('three records beside the House stand in one row, bigger than before the pads (96 px or more; they were 77)', grid3.join() === '3,1,3' && rec3 >= 96, [grid3, rec3, zoom.toFixed(2)]);
  const lab = await M(page).locator('.srec span').evaluateAll((n) => n.every((e) => e.scrollHeight <= e.clientHeight + 1 && e.getBoundingClientRect().bottom <= e.closest('.srecs').getBoundingClientRect().bottom + 1));
  ok('with every name whole and inside the shelf', lab);
  const fit = await mus(page, (m) => { const box = m.renderRoot.querySelector('.srecs'), out = {}; const one = box.children[0];
    for (const n of [1, 2, 4, 5, 6, 7, 8, 9]) { while (box.children.length < n) box.appendChild(one.cloneNode(true)); while (box.children.length > n) box.lastElementChild.remove(); m._fitShelf();
      const p = box.querySelector('.puck'); out[n] = [Number(box.style.getPropertyValue('--cols')), Number(box.style.getPropertyValue('--rows')), p.offsetWidth, [...box.children].every((c) => c.getBoundingClientRect().bottom <= box.getBoundingClientRect().bottom + 1 && c.getBoundingClientRect().right <= box.getBoundingClientRect().right + 1)]; }
    return out; });
  ok('however many are pinned, the grid chosen keeps every record inside the shelf', Object.values(fit).every((v) => v[3] && v[0] * v[1] >= 1), fit);
  ok('four to six keep to two rows at 80 px or more; nine stay a finger wide (44 px)', fit[4][1] === 2 && fit[4][2] >= 80 && fit[6][1] === 2 && fit[6][2] >= 80 && fit[9][2] >= 44, [fit[4], fit[6], fit[9]]);
  const padsB = await bx('.hpads'), whole = await bx('.wholeh'), shelf = await bx('.mshelf');
  ok('the pads and Whole house still stand under them, inside the shelf', !!padsB && !!whole && whole.y + whole.height <= shelf.y + shelf.height + 1 && padsB.y + padsB.height <= whole.y + 1);
  const map = await bx('.map'); ok('and the House keeps at least two thirds of the page', map.width >= (map.width + shelf.width) * .66, Math.round(map.width / (map.width + shelf.width) * 100));
  // Radio on a full page
  await M(page).getByRole('tab', { name: 'Radio' }).click(); await page.waitForTimeout(450);
  const stn = await M(page).locator('.presets .st .img').first().evaluate((e) => e.offsetWidth), body = await bx('.panel > .body'), last = await M(page).locator('.presets .st').last().boundingBox();
  ok('Radio on a full page: stations of 150 px or more', stn >= 150, stn);
  ok('standing low on the page, like the records on Shelves', !!last && body.y + body.height - (last.y + last.height) < 40, last && Math.round(body.y + body.height - (last.y + last.height)));
  ok('and a station still plays on a tap', await (async () => { await clear(page); await M(page).locator('.presets .st').first().click(); await page.waitForTimeout(500); return (await calls(page, /play_media/)).length > 0; })());
  // Call a room on a full page
  await M(page).getByRole('tab', { name: 'Call a room' }).click(); await page.waitForTimeout(450);
  const row = await bx('.callrow'), mapB = await bx('.callside .map'), bub = await M(page).locator('.bubble').evaluateAll((n) => n.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.height), Math.round(r.bottom)]; })), mz = await M(page).locator('.callside .mz').first().evaluate((e) => e.offsetHeight);
  ok('Call a room on a full page: the ready messages share the height (each 90 px or more on the wall)', bub.length === 6 && bub.every((b) => b[0] >= 90) && Math.max(...bub.map((b) => b[1])) >= row.y + row.height - 2, bub.map((b) => b[0]));
  ok('and so does the little house (rooms 120 px or more tall)', mz >= 120 && mapB.height >= row.height * .6, [mz, Math.round(mapB.height), Math.round(row.height)]);
  await clear(page); await M(page).locator('.callside .mz').first().click(); await M(page).locator('.bubble').first().click(); await page.waitForTimeout(200);
  ok('a room and a message can still be chosen there', await M(page).locator('.callside .mz[aria-pressed="true"]').count() === 1 && await M(page).locator('.bubble[aria-pressed="true"]').count() === 1);
  await M(page).locator('.sayrow .field').click(); await page.waitForTimeout(400);
  ok('and the keys still come up over it, with Say it in reach', await M(page).locator('.rchips').count() === 1 && await M(page).locator('.sayit').isVisible());
  await shut(page); }
// 11. batch 3 (0.38.3): the moment pads are only beside the House; the coach marks show the first time Music is opened each day on a screen
{ const page = await open('page=music&mview=desk&mviews=all'); await page.waitForTimeout(400);
  ok('the Desk has its faders and its wheel, and no moment pads', await M(page).locator('.desk .jog').count() === 1 && await M(page).locator('.desk .strip').count() >= 2 && await M(page).locator('.mpad, .pads').count() === 0, await M(page).locator('.mpad').count());
  await shut(page);
  const h = await open('page=music&mviews=all'); await h.waitForTimeout(400);
  ok('with the Desk switched on as well, the pads are still beside the House: one place', await M(h).locator('.hpads .hpad').count() === 4);
  await shut(h); }
{ const page = await open('page=music'); await page.waitForTimeout(500);
  const on = (pg) => M(pg).locator('.hint[data-on]').count(), text = (pg) => M(pg).locator('.hint[data-on]').innerText().catch(() => '');
  const first = await text(page);
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('fh-music-coach') || '{}'));
  ok('the first time Music is opened today the marks play, and the screen remembers the day and the view', /^1 of 3/.test(first) && kept.d === await page.evaluate(() => new Date().toDateString()) && (kept.v || []).join() === 'house', [first.slice(0, 6), kept]);
  await page.clock.runFor(13000); await page.waitForTimeout(300);
  // leave Music and come back, the same day
  await page.evaluate(() => { document.querySelector('family-hub-card')._page = 'planner'; }); await page.waitForTimeout(400);
  await page.evaluate(() => { document.querySelector('family-hub-card')._page = 'music'; }); await page.waitForTimeout(700);
  ok('opened again the same day, they do not play by themselves', await on(page) === 0, await text(page));
  await page.reload(); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(900);
  ok('nor after the page is loaded again that day', await on(page) === 0, await text(page));
  await M(page).locator('.helpb').click(); await page.waitForTimeout(300);
  ok('"?" still plays them whenever it is asked', /^1 of 3/.test(await text(page)), await text(page));
  await page.clock.runFor(13000); await page.waitForTimeout(300);
  // overnight: the page is left showing Music, and nothing plays to an empty kitchen
  await page.clock.fastForward('09:00:00'); await page.waitForTimeout(400);
  ok('left showing overnight, they do not play at midnight', await on(page) === 0 && await page.evaluate(() => new Date().getDate()) === 11, await text(page));
  await page.evaluate(() => { document.querySelector('family-hub-card')._page = 'planner'; }); await page.waitForTimeout(400);
  await page.evaluate(() => { document.querySelector('family-hub-card')._page = 'music'; }); await page.waitForTimeout(700);
  ok('the first time Music is opened the next day, they play again', /^1 of 3/.test(await text(page)), await text(page));
  await shut(page); }
// 12. batch 4c (0.38.18): what was left of Music
{ const page = await open('page=music&mview=house'); await page.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music'); m._coach = false; }); await page.waitForTimeout(300);
  const bx = (sel) => M(page).locator(sel).first().boundingBox();
  // the full player over the House stops at the shelf, which stays in reach
  await M(page).getByRole('button', { name: 'Show the full player' }).click(); await page.waitForTimeout(400);
  const st = await bx('.stage'), sh = await bx('.mshelf');
  ok('the full player over the House stops short of the shelf (backlog 102)', !!st && !!sh && st.x + st.width <= sh.x + 1, st && sh && [Math.round(st.x + st.width), Math.round(sh.x)]);
  await clear(page); await M(page).locator('.mshelf .srec').first().click(); await page.waitForTimeout(500);
  ok('and a record on the shelf still plays on a tap while it is open', (await calls(page, /play_media/)).length > 0 && await M(page).locator('.stage').isVisible());
  // the TV's sound is in the full player, not in the bar
  const tv = M(page).locator('.stage .tvsnd button');
  ok('the TV sound switches are in the full player (backlog 101)', await tv.count() === 2 && /Night (on|off)/.test(await tv.first().innerText()), await tv.allInnerTexts());
  await clear(page); await tv.first().click(); await page.waitForTimeout(300);
  ok('and Night switches the Sonos night sound', (await calls(page, /switch\.turn_on/)).some((c) => /night_sound/.test(c)), await calls(page, /switch\./));
  await M(page).getByRole('button', { name: 'Hide the player', exact: true }).first().click(); await page.waitForTimeout(300);
  ok('nothing about the TV in the bar', await M(page).locator('.mhead .tvsnd, .acts .tvsnd').count() === 0);
  // the swap to the Scene fades up from a dimmed page, never from nothing
  await viewBtn(page).click(); await page.waitForTimeout(60);
  const from = await page.evaluate(() => { const b = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot.querySelector('.panel > .body'); const a = b.getAnimations()[0]; return a ? Number(a.effect.getKeyframes()[0].opacity) : -1; });
  ok('House to Scene: the page fades up from a dimmed view, not from blank (backlog 64)', from >= 0.3, from);
  await page.waitForTimeout(500);
  // the moment pads at the end of the Scene's shelf
  const pads = M(page).locator('.vscene .sshelf .hpad');
  ok('the Scene has the four moment pads at the end of its shelf (backlog 102)', await pads.count() === 4, await pads.allInnerTexts());
  const pb = await pads.first().boundingBox(), sc = await bx('.vscene');
  ok('each a finger wide, inside the scene', !!pb && pb.height >= 44 && pb.width >= 44 && pb.y + pb.height <= sc.y + sc.height + 1, pb && [Math.round(pb.width), Math.round(pb.height)]);
  await clear(page); await pads.nth(1).click(); await page.waitForTimeout(900);
  ok('and one tap starts its music', (await calls(page, /play_media/)).length > 0);
  await shut(page); }
{ const page = await open('page=music&mtab=shelves&shelf=Family'); await page.waitForTimeout(500);
  ok('Shelves: no little house beside the records until it is wanted (backlog 107)', await M(page).locator('.map.snug').count() === 0);
  const rb = M(page).locator('.crate .roomb');
  ok('the row of names says where a tap plays', await rb.count() === 1 && /Kitchen/.test(await rb.innerText()), await rb.innerText().catch(() => 'none'));
  await rb.click(); await page.waitForTimeout(300);
  ok('a tap on the room brings the little house up', await M(page).locator('.roompop .mz').count() >= 4);
  await M(page).locator('.roompop .mz[data-zone="media_player.office"]').click(); await page.waitForTimeout(300);
  ok('choosing a room there puts it away and the row names it', await M(page).locator('.roompop').count() === 0 && /Office/.test(await rb.innerText()), await rb.innerText());
  await clear(page); await M(page).locator('.covers .st').first().click(); await page.waitForTimeout(500);
  ok('and a tapped record plays there', (await calls(page, /play_media/)).some((c) => /media_player\.office/.test(c)), await calls(page, /play_media/));
  await rb.click(); await page.waitForTimeout(200); await M(page).locator('.crate .pchip').first().click(); await page.waitForTimeout(250);
  ok('a tap anywhere else puts the little house away', await M(page).locator('.roompop').count() === 0);
  // carrying a record brings it up to let go on
  const rec = await mid(M(page).locator('.covers .st').nth(1)); await clear(page);
  const seen = await drag(page, rec, async () => mid(M(page).locator('.roompop .mz[data-zone="media_player.lounge_room_sonos"]')), async () => M(page).locator('.roompop[data-carrying]').count());
  ok('carrying a record brings the little house up, and letting go on a room plays it there', seen === 1 && (await calls(page, /play_media/)).some((c) => /lounge_room_sonos/.test(c)) && await M(page).locator('.roompop').count() === 0, [seen, await calls(page, /play_media/)]);
  await shut(page); }
{ const page = await open('page=music'); await page.waitForTimeout(300); await M(page).getByRole('tab', { name: 'Radio' }).click(); await page.waitForTimeout(500);
  const rb = M(page).locator('.rhead .roomb');
  ok('Radio: the line names the room and lets it be changed there (backlog 105)', await rb.count() === 1 && /Kitchen/.test(await rb.innerText()) && !/Rooms tab/.test(await M(page).locator('.body').innerText()), await rb.innerText().catch(() => 'none'));
  await rb.click(); await page.waitForTimeout(300); await M(page).locator('.roompop .mz[data-zone="media_player.office"]').click(); await page.waitForTimeout(300);
  await clear(page); await M(page).locator('.presets .st').first().click(); await page.waitForTimeout(500);
  ok('a station then plays in the room chosen', /Office/.test(await rb.innerText()) && (await calls(page, /play_media/)).some((c) => /media_player\.office/.test(c)), await calls(page, /play_media/));
  const body = await M(page).locator('.panel > .body').boundingBox(), sts = await M(page).locator('.presets .st').evaluateAll((n) => n.map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.width]; }));
  const mid0 = (Math.min(...sts.map((x) => x[0])) + Math.max(...sts.map((x) => x[1]))) / 2;
  ok('a few stations stand together in the middle, larger', sts.length <= 4 && Math.abs(mid0 - (body.x + body.width / 2)) < 30 && sts.every((x) => x[2] >= 200), [Math.round(mid0 - (body.x + body.width / 2)), sts.map((x) => Math.round(x[2]))]);
  await shut(page); }
{ const page = await open('page=music&mtab=juke'); await page.waitForTimeout(500);
  const w = await M(page).locator('.picks .pickrow .art').first().evaluate((e) => e.offsetWidth).catch(() => 0);
  ok('the Jukebox on a full page: the night’s picks are records as big as the shelves’ (160 px or more)', w >= 160, w);
  await shut(page); }
for (const qs of ['page=music&mtab=shelves&shelf=Family&dark=1', 'page=music&mview=desk&mviews=all&dark=1', 'page=music&mview=list&mviews=all&dark=1']) { const page = await open(qs); await page.waitForTimeout(500);
  if (/shelves/.test(qs)) { const d = await M(page).locator('.covers .disc').first().evaluate((e) => getComputedStyle(e).boxShadow);
    ok('dark: the record behind each sleeve has a rim (backlog 115)', /inset/.test(d), d.slice(0, 60)); }
  if (/desk/.test(qs)) { const l = await M(page).locator('.lamp[aria-pressed="false"]:not([data-other])').first().evaluate((e) => getComputedStyle(e).backgroundColor);
    ok('dark: the Desk’s OFF lamp is not the light grey of the day (backlog 119)', l !== 'rgb(91, 100, 114)', l); }
  if (/list/.test(qs)) { const b = await M(page).locator('.stage').evaluate((e) => getComputedStyle(e).backgroundColor);
    ok('dark: the List’s player wears the theme’s deep tone, not black (backlog 119)', b !== 'rgb(17, 17, 17)', b); }
  await shut(page); }
console.log(`\n${pass} passed, ${fails.length} failed${fails.length ? ': ' + fails.join(' | ') : ''}`);
console.log('errors:', errs.length ? errs.join('\n') : 'none');

await browser.close(); srv.close(); process.exit(fails.length ? 1 : 0);
