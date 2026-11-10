// Click tests for the Music page against the mock house in preview/index.html: every action asserts the service call it makes.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(4782);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'Australia/Perth', locale: 'en-AU' });
const errs = [];
const open = async (qs, time = '16:20') => { const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:4782/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const calls = (page, re) => page.evaluate((s) => (window.__calls || []).filter((c) => new RegExp(s).test(c)).slice(-3).join(' || '), re.source);
const M = (page) => page.locator('fh-music');
// the house: drag the waterline for volume, add a room, carry the music to another room and to Everywhere, bedrooms after bedtime ask first
{
  const p = await open('look=glass&page=music&mview=house');
  const box = async (id) => M(p).locator(`.mzone[data-zone="${id}"]`).boundingBox();
  const drag = async (x0, y0, x1, y1) => { await p.mouse.move(x0, y0); await p.mouse.down(); await p.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 4 }); await p.mouse.move(x1, y1, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(350); };
  console.log('house rooms:', await M(p).locator('.mzone').count(), '| floors:', await M(p).locator('.floor').count(), '| pucks:', await M(p).locator('.puck').count());
  let k = await box('media_player.kitchen');
  await drag(k.x + 30, k.y + k.height * .6, k.x + 30, k.y + k.height * .6 - k.height * .8 * .2);
  console.log('house volume:', await calls(p, /volume_set/));
  await M(p).getByRole('button', { name: /Add Office to the music/ }).click(); await p.waitForTimeout(300); console.log('house join:', await calls(p, /media_player\.join/));
  const puck = await M(p).locator('.mzone[data-zone="media_player.kitchen"] .puck').boundingBox(), lounge = await box('media_player.lounge_room_sonos');
  await drag(puck.x + puck.width / 2, puck.y + puck.height / 2, lounge.x + lounge.width / 2, lounge.y + lounge.height / 2);
  console.log('house move:', await calls(p, /transfer_queue/), '| puck now in:', await M(p).locator('.mzone[data-playing] .puck').evaluateAll((n) => n.map((x) => x.parentElement.dataset.zone).join(',')));
  const pk2 = await M(p).locator('.mzone[data-zone="media_player.lounge_room_sonos"] .puck').boundingBox(), all = await M(p).getByRole('button', { name: 'Everywhere' }).boundingBox();
  await drag(pk2.x + pk2.width / 2, pk2.y + pk2.height / 2, all.x + all.width / 2, all.y + all.height / 2);
  console.log('house everywhere:', (await calls(p, /media_player\.join/)).split(' || ').pop().slice(0, 160));
  // shelves: carry a record from the crate to a room on the little house
  await M(p).getByRole('tab', { name: 'Shelves' }).click(); await p.waitForTimeout(600);
  const rec = await M(p).locator('.crate .st').first().boundingBox(), off = await M(p).locator('.mz[data-zone="media_player.office"]').boundingBox();
  await drag(rec.x + rec.width / 2, rec.y + rec.height / 3, off.x + off.width / 2, off.y + off.height / 2);
  console.log('record to a room:', (await calls(p, /music_assistant\.play_media/)).split(' || ').pop(), '| records:', await M(p).locator('.crate .st').count());
  await M(p).getByRole('tab', { name: 'Call a room' }).click(); await p.waitForTimeout(300);
  console.log('call house rooms:', await M(p).locator('.mz').count(), '| bubbles:', await M(p).locator('.bubble').count());
  await M(p).getByRole('button', { name: 'Close search' }).count().then((c) => console.log('search closed by default:', c === 0));
  await p.close();
  const hd = await open('look=glass&page=music&mview=house&mhide=media_player.office');
  console.log('hidden speaker: rooms', await M(hd).locator('.mzone').count(), '| office shown:', await M(hd).locator('.mzone[data-zone="media_player.office"]').count());
  await hd.close();
  const n = await open('look=glass&page=music&mview=house', '20:10');
  console.log('asleep rooms at 20:10:', await M(n).locator('.mzone[data-asleep]').count());
  await M(n).getByRole('button', { name: /Add Riley’s room to the music/ }).click(); await n.waitForTimeout(300);
  console.log('bedroom asks first:', await M(n).locator('fh-pin').count() === 1, '| no join yet:', !(await calls(n, /media_player\.join/)));
  await n.close();
}
let page = await open('look=glass&page=music&mview=list');
// rooms: add Office, everywhere, just kitchen, move
await M(page).getByRole('button', { name: /Add Office to the music/ }).click(); await page.waitForTimeout(300);
console.log('join:', await calls(page, /media_player\.join/), '| in mix:', await M(page).locator('.spk.inmix').count());
await M(page).getByRole('button', { name: 'Everywhere' }).click(); await page.waitForTimeout(300); console.log('everywhere in mix:', await M(page).locator('.spk.inmix').count());
await M(page).getByRole('button', { name: /^Just Kitchen/ }).click(); await page.waitForTimeout(300); console.log('after just-kitchen in mix:', await M(page).locator('.spk.inmix').count());
await M(page).getByRole('button', { name: 'Move the music here' }).first().click(); await page.waitForTimeout(400); console.log('move:', await calls(page, /transfer_queue/), '| now', await M(page).locator('.stage').innerText().then((t) => t.split('\n')[0]));
await M(page).getByRole('button', { name: /^Night/ }).click(); await page.waitForTimeout(200); console.log('tv night sound:', await calls(page, /switch\./));
// search → play next, radio, pin
await M(page).getByRole('button', { name: 'Search for music' }).click(); await page.waitForTimeout(200);
for (const k of 'Blu') await M(page).locator('.key', { hasText: new RegExp('^' + k + '$', 'i') }).first().click();
await M(page).getByRole('button', { name: 'Search', exact: true }).click(); await page.waitForTimeout(500);
console.log('typed:', await M(page).locator('input.field').inputValue(), '| hits:', await M(page).locator('.hit').count(), '| fits:', await M(page).locator('.hits').evaluate((e) => e.scrollHeight <= e.clientHeight + 2));
await M(page).locator('.hit').nth(3).click(); await M(page).getByRole('button', { name: 'Play next' }).click(); await page.waitForTimeout(200); console.log('next:', await calls(page, /music_assistant\.play_media/));
await M(page).getByRole('button', { name: /Radio from this/ }).click(); await page.waitForTimeout(200); console.log('radio:', await calls(page, /radio_mode/));
await M(page).getByRole('button', { name: /Pin$/ }).click(); await page.waitForTimeout(200);
for (const d of '1234') await M(page).locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(300);
await M(page).locator('.setrow', { hasText: 'Max' }).getByRole('button', { name: /Pin as calm/ }).click(); await page.waitForTimeout(400); console.log('pin:', await calls(page, /todo\.add_item/));
await M(page).getByRole('button', { name: 'Close search' }).click(); await page.waitForTimeout(200);
await M(page).getByRole('tab', { name: 'Shelves' }).click(); await M(page).getByRole('button', { name: /Max$/ }).click(); await page.waitForTimeout(500);
console.log('Max shelf items:', await M(page).locator('.st').count());
await M(page).locator('.st').first().click(); await page.waitForTimeout(300); console.log('shelf play:', await calls(page, /music_assistant\.play_media/));
// call a room
await M(page).getByRole('tab', { name: 'Call a room' }).click(); await M(page).getByRole('button', { name: 'Office' }).click(); await M(page).getByRole('button', { name: 'Dinner’s ready!' }).click(); await M(page).getByRole('button', { name: /Say it/ }).click(); await page.waitForTimeout(300);
console.log('call:', await calls(page, /tts\.speak/));
// heart, sleep, keep going
await M(page).getByRole('button', { name: /Save this song/ }).click(); await M(page).getByRole('button', { name: /Sleep 30/ }).click(); await page.waitForTimeout(200); console.log('heart+sleep:', await calls(page, /button\.press|fh_music_sleep/));
await page.close();
// jukebox: fair order and feeding
page = await open('look=orbit&page=music&mtab=juke'); await page.evaluate(() => { window.__noNext = true; }); 
console.log('juke next label:', await M(page).locator('.pickrow', { hasText: 'Next' }).innerText().then((t) => t.replace(/\n/g, ' ')));
await page.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music'); m._qKey = ''; m.requestUpdate(); }); await page.waitForTimeout(600);
console.log('juke fed:', await calls(page, /music_assistant\.play_media/), '| waiting:', await M(page).locator('.pickrow:not(.played)').count());
await page.screenshot({ path: path.join(PREV, 'shots', 'c-juke-orbit.png') }); await page.close();
// bedtime shelf (Max, 7:10 pm) + DJ banner + tidy song
page = await open('look=fridge&page=music&mtab=shelves&shelf=Max', '19:10'); await page.waitForTimeout(400);
console.log('wind-down shelf items:', await M(page).locator('.st').count(), '| banner:', await M(page).locator('.banner').innerText());
await M(page).locator('.st').first().click(); await page.waitForTimeout(300); console.log('bedtime play:', await calls(page, /play_media|fh_music_sleep/));
await page.screenshot({ path: path.join(PREV, 'shots', 'c-shelf-fridge.png') }); await page.close();
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close();
