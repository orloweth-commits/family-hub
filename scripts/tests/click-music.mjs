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
  const pk2 = await M(p).locator('.mzone[data-zone="media_player.lounge_room_sonos"] .puck').boundingBox(), all = await M(p).locator('.wholeh').boundingBox();
  await drag(pk2.x + pk2.width / 2, pk2.y + pk2.height / 2, all.x + all.width / 2, all.y + all.height / 2);
  console.log('house everywhere:', (await calls(p, /media_player\.join/)).split(' || ').pop().slice(0, 160));
  // the shelf beside the house: a record to a room, a record to the whole house, a tap plays in the room in focus, ripples where music plays
  await p.evaluate(() => { window.__calls.length = 0; });
  const sr = async (i) => { const b = await M(p).locator('.mshelf .srec').nth(i).boundingBox(); return [b.x + b.width / 2, b.y + b.width / 2]; };
  const of = await box('media_player.office'); let s0 = await sr(0);
  await drag(s0[0], s0[1], of.x + of.width / 2, of.y + of.height * .6);
  console.log('shelf records:', await M(p).locator('.mshelf .srec').count(), '| record to a room:', (await calls(p, /music_assistant\.play_media/)).split(' || ').pop());
  const wh = await M(p).locator('.wholeh').boundingBox(); s0 = await sr(1); await p.evaluate(() => { window.__calls.length = 0; });
  await drag(s0[0], s0[1], wh.x + wh.width / 2, wh.y + wh.height / 2);
  console.log('record to the whole house:', (await calls(p, /music_assistant\.play_media/)).slice(0, 90), '+', (await calls(p, /media_player\.join/)).slice(0, 40));
  await p.waitForTimeout(450); await p.evaluate(() => { window.__calls.length = 0; }); await M(p).locator('.mshelf .srec').nth(2).click(); await p.waitForTimeout(300);
  console.log('shelf tap:', (await calls(p, /play_media/)).slice(0, 90), '| ripples:', await M(p).locator('.mzone[data-playing] .zspk').count());
  await M(p).getByRole('button', { name: 'Max’s shelf' }).click(); await p.waitForTimeout(300); console.log('Max’s shelf on the map:', await M(p).locator('.mshelf .srec').count());
  // shelves: carry a record from the crate to a room on the little house
  await M(p).getByRole('tab', { name: 'Shelves' }).click(); await p.waitForTimeout(600);
  const rec = await M(p).locator('.crate .st').first().boundingBox(), off = await M(p).locator('.mz[data-zone="media_player.office"]').boundingBox();
  await drag(rec.x + rec.width / 2, rec.y + rec.height / 3, off.x + off.width / 2, off.y + off.height / 2);
  console.log('record to a room:', (await calls(p, /music_assistant\.play_media/)).split(' || ').pop(), '| records:', await M(p).locator('.crate .st').count());
  await M(p).getByRole('tab', { name: 'Call a room' }).click(); await p.waitForTimeout(300);
  console.log('call house rooms:', await M(p).locator('.mz').count(), '| bubbles:', await M(p).locator('.bubble').count());
  await M(p).getByRole('button', { name: 'Close search' }).count().then((c) => console.log('search closed by default:', c === 0));
  await p.close();
  // the other ways of seeing the rooms: each one changes a volume by dragging, and adds a room
  for (const [view, grab, add] of [['dial', '.darc[data-zone="media_player.kitchen"] .dknob', null], ['desk', '.strip[data-zone="media_player.kitchen"] .fcap', /Add Office to the music/], ['cables', '.cab[data-zone="media_player.kitchen"] .cone', /Add Office to the music/], ['scene', '.actor[data-zone="media_player.kitchen"] .agrab', null]]) {
    const v = await open('look=glass&page=music&mview=' + view); await v.evaluate(() => { (window.__calls ||= []).length = 0; });
    const g = await M(v).locator(grab).boundingBox(), cx = g.x + g.width / 2, cy = g.y + g.height / 2;
    await v.mouse.move(cx, cy); await v.mouse.down(); await v.mouse.move(cx + (view === 'dial' ? -14 : 0), cy - 20, { steps: 4 }); await v.mouse.move(cx + (view === 'dial' ? -30 : 0), cy - (view === 'dial' ? 30 : 44), { steps: 4 }); await v.mouse.up(); await v.waitForTimeout(300);
    let out = `${view} volume: ${(await calls(v, /volume_set/)).split(' || ').pop().slice(-60)}`;
    if (add) { await M(v).getByRole('button', { name: add }).click(); await v.waitForTimeout(300); out += ` | add: ${(await calls(v, /media_player\.join/)).slice(0, 70)}`; }
    else { await M(v).locator(view === 'dial' ? '.darc[data-zone="media_player.office"]' : '.actor[data-zone="media_player.office"] > svg').focus(); await v.keyboard.press('Enter'); await v.waitForTimeout(300); out += ` | add by key: ${(await calls(v, /media_player\.join/)).slice(0, 70)}`; }
    await M(v).locator(view === 'dial' ? '.darc[data-zone="media_player.kitchen"]' : view === 'desk' ? '.strip[data-zone="media_player.kitchen"] .fader' : view === 'cables' ? '.cab[data-zone="media_player.kitchen"] .chit' : '.actor[data-zone="media_player.kitchen"] > svg').focus();
    await v.keyboard.press('ArrowDown'); await v.waitForTimeout(200); out += ` | key: ${(await calls(v, /volume_set/)).split(' || ').pop().slice(-28)}`;
    const box = await M(v).locator('.body').evaluate((e) => [...e.querySelectorAll('.bigdial, .desk, .rig, .vscene')].map((x) => { const r = x.getBoundingClientRect(), b = e.getBoundingClientRect(); return r.bottom <= b.bottom + 1 && r.height > 120; })[0]);
    console.log(out, '| fits:', box);
    if (view === 'scene') {
      // bring two rooms together to share the music, pull one away to stop it
      const mid = async (id) => { const b = await M(v).locator(`.actor[data-zone="${id}"] > svg`).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
      const haul = async (from, to) => { await v.mouse.move(...from); await v.mouse.down(); await v.mouse.move((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, { steps: 5 }); await v.mouse.move(...to, { steps: 5 }); await v.mouse.up(); await v.waitForTimeout(900); };
      await v.evaluate(() => { window.__calls.length = 0; });
      const al = await mid('media_player.alexs_homepod'), ki = await mid('media_player.kitchen'); await haul(al, [ki[0] + 30, ki[1] + 10]);
      console.log('scene together:', (await calls(v, /media_player\.join/)).slice(0, 110));
      const al2 = await mid('media_player.alexs_homepod'), sb = await M(v).locator('.vscene').boundingBox(); await haul(al2, [sb.x + sb.width - 60, sb.y + 50]);
      console.log('scene apart:', (await calls(v, /media_player\.unjoin/)).slice(0, 70));
      const sp = await open('look=glass&theme=space&page=music&mview=scene'); await sp.evaluate(() => { (window.__calls ||= []).length = 0; });
      const centre = await M(sp).locator('.core').boundingBox(), pl = await M(sp).locator('.actor.planet[data-zone="media_player.office"] > svg').boundingBox(), stage = await M(sp).locator('.vscene').boundingBox();
      const cx = centre.x + centre.width / 2, cy = centre.y + centre.height / 2, from = [pl.x + pl.width / 2, pl.y + pl.height / 2], on = [cx - stage.height * 0.36, cy];
      await sp.mouse.move(...from); await sp.mouse.down(); await sp.mouse.move((from[0] + on[0]) / 2, (from[1] + on[1]) / 2, { steps: 5 }); await sp.mouse.move(...on, { steps: 5 }); await sp.mouse.up(); await sp.waitForTimeout(600);
      console.log('orbit join:', (await calls(sp, /media_player\.join/)).slice(0, 110), '| rings:', await M(sp).locator('.ring').count(), '| moving:', await M(sp).locator('.arm[data-moving]').count());
      await sp.close();
      const pk = await M(v).locator('.puck.spot').boundingBox(), to = await M(v).locator('.actor[data-zone="media_player.lounge_room_sonos"]').boundingBox();
      await v.mouse.move(pk.x + 30, pk.y + 30); await v.mouse.down(); await v.mouse.move(pk.x + 120, pk.y + 100, { steps: 4 }); await v.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 5 }); await v.mouse.up(); await v.waitForTimeout(400);
      console.log('scene carry:', await calls(v, /transfer_queue/)); }
    if (view === 'cables') {
      // the record crate: flick with the keys, tap the front record to play it, carry one to the turntable; a sideways drag flicks and does not play
      await v.evaluate(() => { window.__calls.length = 0; });
      const front = () => M(v).locator('.cpick b').innerText();
      const first = await front(); await M(v).getByRole('button', { name: 'Flick forward' }).click(); await v.waitForTimeout(300);
      const f = await M(v).locator('.sleeve[data-front]').boundingBox(), fx = f.x + f.width / 2, fy = f.y + f.height / 2;
      await v.mouse.move(fx, fy); await v.mouse.down(); await v.mouse.move(fx + 40, fy + 3, { steps: 4 }); await v.mouse.move(fx + 70, fy + 4, { steps: 4 }); await v.mouse.up(); await v.waitForTimeout(500);
      console.log('crate sleeves:', await M(v).locator('.sleeve').count(), '| flicked forward then dragged back to the first:', (await front()) === first, '| flick played nothing:', !(await calls(v, /play_media/)));
      await M(v).locator('.sleeve[data-front]').click(); await v.waitForTimeout(300); console.log('crate tap front:', (await calls(v, /play_media/)).slice(0, 100));
      const s2 = await M(v).locator('.sleeve[data-front]').boundingBox(), tt = await M(v).locator('.ttable').boundingBox(); await v.evaluate(() => { window.__calls.length = 0; });
      await v.mouse.move(s2.x + s2.width / 2, s2.y + 30); await v.mouse.down(); await v.mouse.move(s2.x + s2.width / 2 + 8, s2.y - 30, { steps: 4 }); await v.mouse.move(tt.x + tt.width / 2, tt.y + tt.height / 2, { steps: 5 }); await v.mouse.up(); await v.waitForTimeout(400);
      console.log('crate record to the turntable:', (await calls(v, /play_media/)).slice(0, 100), '| wires:', await M(v).locator('.wire').count());
      await M(v).getByRole('button', { name: 'Max', exact: true }).click(); await v.waitForTimeout(300); console.log('crate divider:', await M(v).locator('.clabel b').innerText()); }
    if (view === 'desk') {
      // the jog wheel: a quarter turn clockwise moves the song on thirty seconds; the arrow keys move it ten
      await v.evaluate(() => { window.__calls.length = 0; });
      const jb = await M(v).locator('.jog').boundingBox(), jx = jb.x + jb.width / 2, jy = jb.y + jb.height / 2, R = jb.width * .36;
      await v.mouse.move(jx, jy - R); await v.mouse.down(); for (const a of [-70, -50, -30, -10, 0]) await v.mouse.move(jx + R * Math.cos(a * Math.PI / 180), jy + R * Math.sin(a * Math.PI / 180), { steps: 2 }); await v.mouse.up(); await v.waitForTimeout(300);
      let out2 = `jog quarter turn: ${(await calls(v, /media_seek/)).slice(-40)}`;
      await M(v).locator('.jog').focus(); await v.keyboard.press('ArrowLeft'); await v.waitForTimeout(200); out2 += ` | key: ${(await calls(v, /media_seek/)).split(' || ').pop().slice(-24)}`;
      console.log(out2);
      // the moment pads: a press finds the playlist and plays it; a pad with rooms plays there, lets other rooms go, sets the volume and joins the rest
      await v.evaluate(() => { window.__calls.length = 0; }); await M(v).getByRole('button', { name: 'Dance' }).click(); await v.waitForTimeout(700);
      console.log('pad in the room in focus:', (await calls(v, /music_assistant\.play_media/)).slice(0, 120), '| pads:', await M(v).locator('.mpad').count(), '| lit:', await M(v).locator('.mpad[data-on]').innerText().then((t) => t.trim().split('\n').pop()));
      const pv = await open('look=glass&page=music&mview=desk&moments=1'); await pv.evaluate(() => { (window.__calls ||= []).length = 0; });
      await M(pv).getByRole('button', { name: 'Dinner' }).click(); await pv.waitForTimeout(700);
      console.log('pad on a named speaker:', await pv.evaluate(() => window.__calls.filter((c) => /play_media|join|volume_set/.test(c)).map((c) => c.slice(0, 104)).join(' || ')));
      await pv.evaluate(() => { window.__calls.length = 0; }); await M(pv).getByRole('button', { name: 'Wind down' }).click(); await pv.waitForTimeout(700);
      console.log('pad in two rooms:', await pv.evaluate(() => window.__calls.filter((c) => /play_media|join|volume_set/.test(c)).map((c) => c.slice(0, 104)).join(' || ')));
      await pv.close();
      const nv = await open('look=glass&page=music&mview=desk&moments=1', '20:10'); await M(nv).getByRole('button', { name: 'Wind down' }).click(); await nv.waitForTimeout(500);
      console.log('bedroom pad asks first at night:', await M(nv).locator('fh-pin').count() === 1, '| nothing played yet:', !(await calls(nv, /play_media/))); await nv.close();
      const m = await M(v).locator('.strip.master .fcap').boundingBox(); await v.mouse.move(m.x + 20, m.y + 10); await v.mouse.down(); await v.mouse.move(m.x + 20, m.y - 20, { steps: 4 }); await v.mouse.up(); await v.waitForTimeout(300);
      console.log('desk master moves:', (await v.evaluate(() => window.__calls.filter((c) => /volume_set/.test(c)).slice(-2).map((c) => c.split(' ')[1]).join(', ')))); }
    await M(v).getByRole('button', { name: /Change how the rooms are shown/ }).click(); await v.waitForTimeout(200);
    if (view === 'dial') console.log('picker cards:', await M(v).locator('.vcard').count());
    await v.close();
  }
  const hd = await open('look=glass&page=music&mview=house&mhide=media_player.office');
  console.log('hidden speaker: rooms', await M(hd).locator('.mzone').count(), '| office shown:', await M(hd).locator('.mzone[data-zone="media_player.office"]').count());
  await hd.close();
  const n = await open('look=glass&page=music&mview=house', '20:10');
  console.log('asleep rooms at 20:10:', await M(n).locator('.mzone[data-asleep]').count());
  await M(n).getByRole('button', { name: /Add Riley’s room to the music/ }).click(); await n.waitForTimeout(300);
  console.log('bedroom asks first:', await M(n).locator('fh-pin').count() === 1, '| no join yet:', !(await calls(n, /media_player\.join/)));
  await M(n).locator('fh-pin').getByRole('button', { name: /Cancel|Close/ }).first().click().catch(() => {}); await n.waitForTimeout(200);
  await M(n).locator('.wholeh').click(); await n.waitForTimeout(300);
  console.log('whole house asks first at night:', await M(n).locator('fh-pin').count() === 1, '| no join yet:', !(await calls(n, /media_player\.join/)));
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
