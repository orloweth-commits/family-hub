// Phase 1 ("quick and safe") checks: the medication chip says how many and never who, wind-down keeps no score, All off waits,
// the PIN pad's numbers move, the header buttons say what they are, a calendar's own word filter, and the studio's "paints left today".
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4823] node scripts/tests/phase1.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4823);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
const open = async (qs, time = '16:20', { w = 1920, h = 1080 } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date(`2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const C = (page) => page.locator('family-hub-card');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re);
const pin = async (page) => { for (const d of '1234') await C(page).locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500); };
const toast = async (page) => (await C(page).locator('.toast span').first().innerText().catch(() => '')).trim();
const med = (page) => C(page).locator('.cap[data-kind="med"]');
const bg = (loc) => loc.evaluate((e) => getComputedStyle(e).backgroundColor);
const NAMES = /Riley|Charlie|Max/;

// 1. the medication chip: a count, never a name; red for the first overdue hour, then amber
for (const look of ['glass', 'fridge', 'orbit', 'sports']) {
  let page = await open(`look=${look}&page=planner&timer=0`, '07:30');
  let txt = (await med(page).innerText()).replace(/\s+/g, ' ').trim(), label = await med(page).getAttribute('aria-label');
  ok(`${look}: 7:30 am, the chip reads "2 overdue" and names nobody`, txt === '2 overdue' && !NAMES.test(txt + label) && label === 'Medicine: 2 overdue', `${txt} / ${label}`);
  ok(`${look}: in its first overdue hour it is the urgent chip`, await med(page).evaluate((e) => e.classList.contains('hot') && !e.hasAttribute('data-warm')));
  const head = (await C(page).locator('header').innerText()).replace(/\s+/g, ' ');
  ok(`${look}: no child is named anywhere in the header`, !NAMES.test(head), head);
  await page.context().close();
  page = await open(`look=${look}&page=planner&timer=0`, '16:20');
  txt = (await med(page).innerText()).replace(/\s+/g, ' ').trim();
  const c = await bg(med(page)), ink = await med(page).evaluate((e) => getComputedStyle(e).color);
  ok(`${look}: by the afternoon it has settled to amber with dark ink, and no longer pulses`, txt === '2 overdue' && c === 'rgb(245, 179, 1)' && ink === 'rgb(42, 26, 0)' && await med(page).evaluate((e) => !e.classList.contains('hot') && getComputedStyle(e).animationName === 'none'), `${c} ${ink}`);
  await page.context().close();
}
{ const page = await open('look=glass&page=planner&timer=0', '06:00');
  const txt = (await med(page).innerText()).replace(/\s+/g, ' ').trim();
  ok('before the time it reads "2 due", plain', txt === '2 due' && await med(page).evaluate((e) => !e.classList.contains('hot') && !e.hasAttribute('data-warm')), txt);
  await page.context().close(); }

// 2. "Later" in the sheet: behind the PIN, puts the chip away for half an hour on this screen, and can be brought back
{ const page = await open('look=glass&page=planner&timer=0', '07:30');
  await med(page).click(); await page.waitForTimeout(400);
  const later = C(page).locator('.sheet [data-act="med-later"]');
  ok('the sheet offers "Later (30 min)"', await later.count() === 1 && /Later\s\(30 min\)/.test(await later.innerText()));
  ok('names are inside the sheet', NAMES.test(await C(page).locator('.sheet').innerText()));
  await later.click(); await page.waitForTimeout(300);
  ok('Later asks for the parent PIN', await C(page).locator('fh-pin').count() === 1);
  await pin(page); await page.waitForTimeout(1000);
  ok('then the chip is gone, the sheet has closed and a line says when it comes back', await med(page).count() === 0 && await C(page).locator('.sheet').count() === 0 && /back at 8:00\sam/.test(await toast(page)), await toast(page));
  ok('the round Medicine button is there while the chip is away', await C(page).locator('header [data-act="meds"]').isVisible());
  await C(page).locator('header [data-act="meds"]').click(); await page.waitForTimeout(400);
  const back = C(page).locator('.sheet [data-act="med-back"]');
  ok('the sheet says when it is back, and offers it now', await back.count() === 1 && /8:00\sam/.test(await back.innerText()), await back.innerText().catch(() => ''));
  await back.click(); await page.waitForTimeout(300);
  ok('"show now" brings the chip back', await med(page).count() === 1);
  await page.context().close();
  // and by itself after half an hour
  const p2 = await open('look=glass&page=planner&timer=0', '07:30');
  await p2.evaluate(() => { const c = document.querySelector('family-hub-card'); c._medSnooze(30); }); await p2.waitForTimeout(300);
  const gone = await med(p2).count(); await p2.clock.fastForward(31 * 60_000); await p2.waitForTimeout(400);
  ok('it comes back by itself after half an hour', gone === 0 && await med(p2).count() === 1);
  await p2.context().close(); }

// 3. plain words in the medication sheet
{ const page = await open('look=glass&page=planner&sheet=meds&meds=missing');
  const t = await C(page).locator('.sheet').innerText();
  ok('no helper or setting names reach the screen', !/med_log|input_datetime|input_text|fh_med|card settings/.test(t) && /Not set up yet/.test(t) && /Settings, under Medicines/.test(t), t.replace(/\s+/g, ' ').slice(0, 160));
  await page.context().close(); }

// 4. wind-down keeps no score
for (const [kid, name, time] of [[0, 'Riley', '19:20'], [1, 'Charlie', '19:20'], [2, 'Max', '18:50']]) {
  const page = await open(`look=glass&page=kid&kid=${kid}`, time);
  const k = C(page).locator('fh-kid'), hero = k.locator('.hero');
  const t = (await hero.innerText()).replace(/\s+/g, ' ');
  ok(`${name} at wind-down: no rank, points, stars or progress bars on his card`, await hero.locator('.rank, .xp, .stat, .stats, .starjar').count() === 0 && !/points|stars|more to|to go/i.test(t), t);
  ok(`${name} at wind-down: his jobs show no stars or point values`, await k.locator('.stars, .plus:not(.grow)').count() === 0);
  const day = await open(`look=glass&page=kid&kid=${kid}`, '16:20');
  // since 0.31.0 (Phase 2) his card counts nothing by day either: what he has to spend is in the Rewards tab, which wind-down shuts
  await C(day).locator('fh-kid .tab[data-tab="rewards"]').click(); await day.waitForTimeout(250);
  ok(`${name} by day: what he has to spend is in the Rewards tab (and at wind-down that tab is shut)`, await C(day).locator('fh-kid .tabbody').locator('.ptsline, .stat').count() === 1 && await k.locator('.ptsline, .tabbody .stat').count() === 0);
  await day.context().close(); await page.context().close();
}

// 5. All off waits three seconds, with Cancel; Undo is kept
{ const page = await open('look=glass&page=planner&offwait=3');
  const off = C(page).locator('.dock [data-nav=lights-off]');
  await page.evaluate(() => { window.__calls = []; }); await off.click(); await page.waitForTimeout(500);
  const box = C(page).locator('[data-offwait]');
  ok('one tap turns nothing off: a countdown with Cancel', await box.count() === 1 && /Lights off in 3/.test(await box.innerText()) && !(await calls(page, '^light\\.turn_off')).length, (await box.innerText().catch(() => '')).replace(/\s+/g, ' '));
  await box.getByRole('button', { name: 'Cancel' }).click(); await page.clock.fastForward(4000); await page.waitForTimeout(400);
  ok('Cancel leaves every light on, and says so', !(await calls(page, '^light\\.turn_off')).length && await box.count() === 0 && /lights stay on/.test(await toast(page)), await toast(page));
  await off.click(); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await page.clock.fastForward(4000); await page.waitForTimeout(300);
  ok('Escape cancels too', !(await calls(page, '^light\\.turn_off')).length && await box.count() === 0);
  await off.click(); await page.waitForTimeout(200); await off.click({ force: true }).catch(() => {}); await page.clock.fastForward(1500); await page.waitForTimeout(200);
  const mid = (await calls(page, '^light\\.turn_off')).length; await page.clock.fastForward(2000); await page.waitForTimeout(600);
  ok('left alone, the lights go off once, after the three seconds', mid === 0 && (await calls(page, '^light\\.turn_off')).length === 1 && await box.count() === 0, { mid, after: (await calls(page, '^light\\.turn_off')).length });
  ok('and Undo is still offered', /Undo/.test(await C(page).locator('.toast').innerText()), await toast(page));
  await page.context().close();
  const none = await open('look=glass&page=planner&offwait=0'); await none.evaluate(() => { window.__calls = []; });
  await C(none).locator('.dock [data-nav=lights-off]').click(); await none.waitForTimeout(500);
  ok('all_off_wait: 0 goes at once', (await calls(none, '^light\\.turn_off')).length === 1 && await C(none).locator('[data-offwait]').count() === 0);
  await none.context().close(); }

// 6. the PIN pad: the numbers move each time, every digit is there once, and the PIN still works; pin_shuffle: false keeps the usual order
{ const order = (page) => page.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelector('fh-pin').shadowRoot.querySelectorAll('.grid button')].map((b) => b.getAttribute('aria-label')).join(''));
  const page = await open('look=glass&page=planner&sheet=meds', '07:30'); const seen = new Set();
  for (let i = 0; i < 6; i++) { await C(page).locator('.sheet [data-act="med-later"]').click(); await page.waitForTimeout(250); seen.add(await order(page)); await C(page).locator('fh-pin button[aria-label="Cancel"]').click(); await page.waitForTimeout(350); }
  const all = [...seen];
  ok('every opening has all ten digits once and Delete last', all.every((o) => o.endsWith('Delete') && o.replace('Delete', '').split('').sort().join('') === '0123456789'), all[0]);
  ok('the order is never the usual one, and changes between openings', all.every((o) => o !== '1234567890Delete') && seen.size >= 4, seen.size);
  await C(page).locator('.sheet [data-act="med-later"]').click(); await page.waitForTimeout(250); await pin(page);
  ok('the right PIN still opens it, wherever the digits are', await C(page).locator('fh-pin').count() === 0 && await med(page).count() === 0);
  await page.context().close();
  const plain = await open('look=glass&page=planner&sheet=meds&shuffle=0', '07:30'); await C(plain).locator('.sheet [data-act="med-later"]').click(); await plain.waitForTimeout(250);
  ok('pin_shuffle: false keeps 1 to 9 then 0', await order(plain) === '1234567890Delete', await order(plain));
  await plain.context().close();
  const s = await open('look=glass&page=planner&sheet=settings&pane=pin'); await s.waitForTimeout(600);
  const sw = C(s).locator('fh-settings').getByRole('switch', { name: 'Numbers move on the PIN pad' });
  ok('Settings, PIN: "Numbers move on the PIN pad", on by default', await sw.count() === 1 && await sw.getAttribute('aria-checked') === 'true');
  await s.context().close(); }

// 7. header buttons say what they are; who is home is faces or names, never initials
for (const look of ['glass', 'fridge', 'orbit', 'sports']) {
  const page = await open(`look=${look}&page=planner&faces=1`);
  const r = await page.evaluate(() => { const hd = document.querySelector('family-hub-card').shadowRoot.querySelector('header');
    const btns = [...hd.querySelectorAll('.right > .round.hb')].filter((b) => getComputedStyle(b).display !== 'none').map((b) => { const l = b.querySelector('.rl'), br = b.getBoundingClientRect(), lr = l.getBoundingClientRect(); return { act: b.dataset.act, word: l.textContent.trim(), shown: getComputedStyle(l).display !== 'none' && lr.width > 0, inside: lr.left >= br.left + 2 && lr.right <= br.right - 2 && lr.bottom <= br.bottom - 2, size: parseFloat(getComputedStyle(l).fontSize), h: br.height, w: br.width }; });
    const p = hd.querySelector('.presence'); return { btns, faces: p.querySelectorAll('.pface img').length, names: [...p.querySelectorAll('.pname')].map((n) => n.textContent.trim()), initials: p.querySelectorAll('.avatar').length, over: hd.scrollWidth > hd.clientWidth + 1, hh: hd.getBoundingClientRect().height }; });
  const words = Object.fromEntries(r.btns.map((b) => [b.act, b.word]));
  ok(`${look}: Ask, Looks, House info and Night each carry their word`, words.ask === 'Ask' && words.looks === 'Looks' && words.info === 'House info' && words.night === 'Night' && r.btns.every((b) => b.shown && b.inside && b.size >= 13 && b.h >= 52 && b.w >= 52), r.btns);
  ok(`${look}: who is home shows a face where Home Assistant has a picture, a name where it has none, and no lone initials`, r.faces === 1 && r.names.join('|') === 'Sam · out' && r.initials === 0 && !r.over, r);
  await page.context().close();
}
{ const page = await open('look=glass&page=planner', '16:20', { w: 390, h: 844 });
  ok('on a phone the header buttons stay round, with no words', await page.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('header .right > .round.hb')].every((b) => { const r = b.getBoundingClientRect(); return getComputedStyle(b).display === 'none' || (Math.abs(r.width - r.height) < 1 && r.width >= 44 && getComputedStyle(b).borderRadius === '50%' && getComputedStyle(b.querySelector('.rl')).display === 'none'); })));
  await page.context().close(); }

// 8. a calendar's own word filter
{ const titles = async (qs) => { const page = await open('look=glass&page=planner&' + qs); const t = (await C(page).locator('.planner').innerText()); await page.context().close(); return ['Canberra Day', 'Western Australia Day', 'Melbourne Cup'].filter((x) => t.includes(x)); };
  ok('with no filter the holidays calendar shows everything', (await titles('hol=1')).length === 3);
  ok('hide: drops the events with those words (capitals do not matter)', (await titles('hol=hide')).join() === 'Western Australia Day', await titles('hol=hide'));
  ok('only: keeps just the events with those words', (await titles('hol=only')).join() === 'Western Australia Day');
  const page = await open('look=glass&page=planner');
  const bad = await page.evaluate(() => { const c = document.querySelector('family-hub-card'); const t = (x) => { try { c.setConfig({ ...c._config, ...x }); return ''; } catch (e) { return String(e.message); } };
    return [t({ calendars: [{ entity: 'calendar.family', colour: 'family', hide: 'Canberra' }] }), t({ all_off_wait: -1 }), t({ pin_shuffle: 'yes' }), t({ calendars: [{ entity: 'calendar.family', colour: 'family', only: ['WA'] }], all_off_wait: 0, pin_shuffle: false })]; });
  ok('the configuration rules catch a filter that is not a list, a negative wait and a shuffle that is not true or false, and accept good ones', /hide on/.test(bad[0]) && /all_off_wait/.test(bad[1]) && /pin_shuffle/.test(bad[2]) && bad[3] === '', bad);
  await page.context().close(); }

// 9. the studio says how many paints are left today
{ const page = await open('look=glass&page=kid&kid=0&painted=1&studio=1&artn=0'); await page.waitForTimeout(800);
  const note = C(page).locator('fh-kid fh-studio .pnote');
  ok('before he has changed anything: "3 paints left today"', /3 paints left today/.test(await note.innerText()), await note.innerText());
  await page.context().close();
  const np = await open('look=glass&page=kid&kid=0&painted=1&studio=1&nopainter=1'); await np.waitForTimeout(800);
  ok('with no painter set up it says nothing about paints', !/paints? left/.test(await C(np).locator('fh-kid fh-studio .pnote').innerText()));
  await np.context().close(); }

console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILED` : `\nall ${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
