// click-base, kid part (split from click-base.mjs by page, 23 Nov 2026: plan section 3, backlog 52 and 34): a child's page: days off, the row tap, practice, wind-down, rewards, feelings, the youngest's page, the studio, a chat asked for, Ask from his page.
// Each section runs in its own block: one that stops (a missing element) prints a FAIL line naming it and the next section carries on (backlog 34).
import { browser, ctx, srv, errs, PORT, PREV, ROOT, HOME, MORE, open, openAt, shot, ok, calls, toastOf, sr, srStudio, ratio, section, finish } from './lib/click.mjs';
let page;

await section('2. days off: not a button on the child’s page any more; it lives in th', async () => {
// 2. days off: not a button on the child's page any more; it lives in the child's settings (behind the PIN), then one big button per day
page = await open('look=glass&page=kid&kid=0');
{ const a = await page.getByRole('button', { name: /Good days/ }).count(), b = await page.locator('fh-kid .dots i:not(.g)').count(); console.log('good days is a button (expect 0):', a, '| empty day slots (expect 0):', b, ok(a === 0 && b === 0)); }
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
});
await section('6. wind-down: bedtime wedge (Max’s bedtime 7:30 pm, at 7:10 pm)', async () => {
// 6. wind-down: bedtime wedge (Max's bedtime 7:30 pm, at 7:10 pm)
page = await open('look=orbit&page=kid&kid=2', '19:10');
console.log('bed wedge:', await page.locator('fh-kid .bedclock').getAttribute('aria-label').catch(() => 'missing')); await shot(page, 'c-wind');
await page.close();
});
await section('rewards: one tap never spends; the row asks, and both answers are 52 p', async () => {
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
  console.log('My look with a job left: studio open', await p.locator('fh-studio').count(), '| toast (expect none):', JSON.stringify(await toastOf(p, 'fh-kid')), ok(!(await toastOf(p, 'fh-kid'))), '| button reads:', (await p.locator('fh-kid .studio').innerText()).trim(), '| padlock:', await p.locator('fh-kid .studio[data-locked] svg').count());
  await p.locator('fh-kid .pic.big').click(); await p.waitForTimeout(1200);
  const see = p.getByRole('button', { name: 'See what I did' }), sb2 = await see.boundingBox(), tb = await p.locator('fh-kid .toast').boundingBox().catch(() => null);
  console.log('Max all done: picture', await p.locator('fh-kid .party svg').count() > 0, '| button', Math.round(sb2.height) + ' px high | toast over the button:', !!tb && tb.y < sb2.y + sb2.height && tb.y + tb.height > sb2.y && tb.x < sb2.x + sb2.width && tb.x + tb.width > sb2.x);
  await wall.close(); }
});
await section('a child asks for a chat: a chip for the parents on the shared pages (p', async () => {
// ---- a child asks for a chat: a chip for the parents on the shared pages (polish round 2) ----
{ const p = await open('look=glass&page=kid&kid=0');
  await p.locator('fh-kid').getByRole('button', { name: 'sad' }).click(); await p.waitForTimeout(200); await p.getByRole('button', { name: /Chat later/ }).click(); await p.waitForTimeout(400);
  const chip = p.locator('family-hub-card .capsule [data-kind="chat"]'), onKid = await chip.count();
  await HOME(p); await p.locator('family-hub-card nav .kidbtn').nth(1).click(); await p.waitForTimeout(400); const onOther = await chip.count();
  await HOME(p); await p.getByRole('button', { name: 'Planner' }).click(); await p.waitForTimeout(500);
  const label = await chip.getAttribute('aria-label').catch(() => 'MISSING'), h = (await chip.boundingBox().catch(() => null))?.height;
  await HOME(p); await p.getByRole('button', { name: 'Groceries' }).click(); await p.waitForTimeout(400); const kept = await chip.count();
  await chip.click(); await p.waitForTimeout(300);
  console.log('chat chip: on his own page', onKid, '| on a brother’s page', onOther, '(expect 0 0)', ok(onKid === 0 && onOther === 0), '| on the planner:', label, '| height', Math.round(h ?? 0), '| still there on Groceries', kept, '| after a tap', await chip.count());
  await p.close();
  // the studio: the goal heart is a button of its own (not inside the tile), and the tabs say which is chosen
  const s = await open('look=glass&page=kid&kid=1&studio=1'); const heart = s.locator('fh-studio button.heart').first(), hb = await heart.boundingBox();
  const nested = await s.locator('fh-studio .tile .heart').count(), name0 = await heart.getAttribute('aria-label'); await heart.focus(); await s.keyboard.press('Enter'); await s.waitForTimeout(300);
  console.log('studio heart: a button', await s.locator('fh-studio button.heart').count() > 0, '| inside a tile', nested, '(expect 0)', ok(nested === 0), '| size', Math.round(hb.width) + 'x' + Math.round(hb.height), '| name:', name0, '→', await heart.getAttribute('aria-label'), '| pressed', await heart.getAttribute('aria-pressed'),
    '| tabs selected:', await s.locator('fh-studio [role=tab][aria-selected="true"]').count(), 'of', await s.locator('fh-studio [role=tab]').count(), '| swatch', await s.locator('fh-studio .sw button').first().evaluate((e) => e.offsetWidth + 'x' + e.offsetHeight).catch(() => 'none on this tab'));
  await s.close();
  const k = await open('look=glass&page=kid&kid=2'); { const n = await k.locator('fh-kid .studio svg').count(), t = (await k.locator('fh-kid .studio').innerText()).trim(); console.log('My look icons (expect 1 drawn, no emoji):', n, '|', t, ok(n === 1 && !/\p{Extended_Pictographic}/u.test(t))); } await k.close(); }
});
await section('R4. rewards: after Yes the row keeps its place and a second tap in the', async () => {
// R4. rewards: after Yes the row keeps its place and a second tap in the list does nothing for 600 ms; a spend that needs a parent leaves a line
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
  console.log('R4 a reward that needs a parent:', (await K('.owedline').innerText().catch(() => 'NO LINE')).replace(/\s+/g, ' ').trim()); }
await page.close();
});
await section('R4-4b and c. a child who cannot read reaches Ask, the chat’s pictures ', async () => {
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
});
await section('R6-G1. wind-down (19:30): every card of the kid page’s side column fit', async () => {
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
});
await section('R6-G4. Sports: the small bib’s initial is 12 px', async () => {
// R6-G4. Sports: the small bib's initial is 12 px
{ const p = await openAt(1280, 800, 'look=sports&page=kid&kid=0', '19:30');
  const fs = await p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelectorAll('.init.sm')].map((e) => parseFloat(getComputedStyle(e).fontSize)));
  console.log('R6-G4 Sports small bib initial is at least 12 px', ok(fs.length > 0 && Math.min(...fs) >= 12), Math.min(...fs)); await p.context().close(); }
});
await section('Round 6 (builder B)', async () => {
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
  console.log(`R6-H2 ${look} ${pg} ${w}x${h}: keys covered (expect 0 of 44):`, kb.covered, 'of', kb.keys, ok(kb.covered === 0), '| typed by tapping:', JSON.stringify(typed), ok(typed.toLowerCase() === 'dogs ok'), '| conversation at least 80 px high:', kb.thread, ok(kb.thread >= 80));
  await page.locator('fh-chat').getByRole('button', { name: 'Keyboard' }).click(); await page.waitForTimeout(300);
  console.log('   keys closed: the pictures are back:', await page.evaluate(() => { const st = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-chat').shadowRoot.querySelector('.starters'); return getComputedStyle(st).display !== 'none' && st.getBoundingClientRect().height > 60; }));
  await page.close(); }
});
await section('R6-H3. "Spend 50 points?" reads on its row in every look (it was white', async () => {
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
});
await section('R6-H4. the youngest on the wall panel (1920x1080) reaches the lower ha', async () => {
// R6-H4. the youngest on the wall panel (1920x1080) reaches the lower half only: his studio's way back, colours and kinds of thing, and the jukebox's coins and "adds a song", are all below the middle
page = await open('look=sports&page=kid&kid=2&studio=1'); await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(700);
{ const t = await page.evaluate(() => { const sr = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('fh-studio').shadowRoot, y = (q) => Math.round(sr.querySelector(q).getBoundingClientRect().top); return { back: y('[aria-label^="Back"]'), surprise: y('[aria-label="Surprise look"]'), kinds: y('.tabs'), colours: y('.sw'), done: y('.sfoot') }; }); console.log('R6-H4 studio tops (expect all >= 540):', JSON.stringify(t), ok(Object.values(t).every((y) => y >= 540))); }
await page.close();
page = await open('look=sports&page=kid&kid=0&studio=1'); await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(700);
console.log('   an older child’s studio keeps its tabs and Back at the top:', await page.evaluate(() => { const sr = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('fh-studio').shadowRoot, y = (q) => sr.querySelector(q).getBoundingClientRect().top; return y('.tabs') < 300 && y('[aria-label^="Back"]') < 300; }));
await page.close();
page = await open('look=sports&page=music&mtab=juke&juke=1'); await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(700);
{ const t = await page.evaluate(() => { const sr = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot, y = (q) => Math.round(sr.querySelector(q).getBoundingClientRect().top); return { coins: y('.coin'), adds: y('.acts .primary') }; }); console.log('R6-H4 jukebox tops (expect both >= 540):', JSON.stringify(t), ok(Object.values(t).every((y) => y >= 540))); }
await page.close();
});
await section('R6-H6. five quick ticks on a slow connection (each answer takes 3 s): ', async () => {
// R6-H6. five quick ticks on a slow connection (each answer takes 3 s): the count of done jobs never goes back, and every tick is kept
for (const kid of [0, 1]) { page = await open(`look=sports&page=kid&kid=${kid}&slow=3000`);
  const jobs = () => page.evaluate(() => { const rows = [...document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelectorAll('[data-uid]')]; return { done: rows.filter((r) => r.classList.contains('done')).length, left: rows.filter((r) => !r.classList.contains('done')).map((r) => r.dataset.uid) }; });
  const first = await jobs(), seen = [first.done]; let taps = 0;
  for (let i = 0; i < 5; i++) { const now = await jobs(); if (!now.left.length) break; await page.evaluate((u) => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector(`[data-uid="${u}"]`).click(), now.left[0]); taps++; for (let k = 0; k < 3; k++) { await page.waitForTimeout(500); seen.push((await jobs()).done); } }
  for (let k = 0; k < 14; k++) { await page.waitForTimeout(500); seen.push((await jobs()).done); }
  const calls = await page.evaluate(() => (window.__calls || []).filter((c) => /update_item/.test(c) && /completed/.test(c)).length);
  console.log(`R6-H6 kid ${kid}: ${taps} quick ticks on a slow connection; done count never goes back:`, kid === 1 || seen.every((n, i) => !i || n >= seen[i - 1]), '| every tick reached Home Assistant:', calls === taps, `${calls}/${taps}`, '| none left unticked on the page:', (await jobs()).left.length === (kid === 1 ? 0 : first.left.length - taps));
  await page.close(); }
});
await section('R7-M2. the reward’s name under "Spend … ?" is readable on the selected', async () => {
// R7-M2. the reward's name under "Spend … ?" is readable on the selected row in every Glass theme and every look (it was 1.01:1 in Space)
{ const bad = [];
  for (const look of ['glass&theme=sea', 'glass&theme=sunset', 'glass&theme=reef', 'glass&theme=bush', 'glass&theme=space', 'fridge', 'orbit', 'sports']) for (const time of ['16:20', '18:10']) { const p = await openAt(1280, 800, `look=${look}&page=kid&kid=0`, time);
    await p.locator('fh-kid button.rw', { hasText: 'Extra screen time' }).click(); await p.waitForTimeout(400);
    const c = await p.evaluate(`(() => { const ratio = ${ratio}; const row = ${sr('fh-kid')}.querySelector('.rw.ask'); if (!row) return 0; const m = row.querySelector('.q .muted'); let bg = ''; for (let x = row; x && !bg; x = x.parentElement) { const v = getComputedStyle(x).backgroundColor, n = v.match(/[\\d.]+/g); if (n && (n.length < 4 || +n[3] > 0.5)) bg = v; } return ratio(getComputedStyle(m).color, bg || 'rgb(255,255,255)'); })()`);
    if (c < 4.5) bad.push(`${look} ${time} ${c.toFixed(2)}`); await p.context().close(); }
  console.log('R7-M2 spend confirmation: the reward name is at least 4.5:1 everywhere', ok(!bad.length), bad.join(' | ')); }
});
await section('R7-M5. the youngest’s "Coming up" at 1312x668 (pictures since 0.31.0; ', async () => {
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
});
await section('R7-M6. the youngest’s studio on the wall panel: every tile of every ki', async () => {
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
});
await section('R7-m10. a timed event that has finished leaves "Coming up"; in the eve', async () => {
// R7-m10. a timed event that has finished leaves "Coming up"; in the evening the youngest still has Ask within reach on the wall
{ const p = await openAt(1920, 1080, 'look=glass&page=kid&kid=2', '19:30');
  const r = await p.evaluate(`(() => { const R = ${sr('fh-kid')}; const a = R.querySelector('button.askbtn'); return { today: [...R.querySelectorAll('.wk')].filter((w) => /Today/.test(w.textContent)).map((w) => w.textContent.replace(/\\s+/g, ' ').trim()), ask: a ? Math.round(a.getBoundingClientRect().top) : -1 }; })()`);
  console.log('R7-m10 at 7:30 pm nothing that has finished is under Today:', JSON.stringify(r.today), ok(!r.today.some((t) => /7:00 pm/.test(t))), '| the youngest’s Ask button is in the lower half:', r.ask, ok(r.ask >= 540)); await p.context().close(); }
});
await section('owner’s decisions of 13 November (0.27.0)', async () => {
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
});

await finish();
