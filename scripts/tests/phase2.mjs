// Phase 2 ("children's pages") checks: two measures on a child's page (today's ring and the family jar), Now / Next for every child,
// older mode, the youngest's Coming up as pictures with sleeps, Ask by child (pictures, full or off, and minutes a day), the note about
// the helper read aloud once a day, the studio's next three locked things, a reward with a weekly limit, a drafted rewards list in
// Settings, and the two leftovers (the children's names on the dock's line; Sports timer pills at 15 px on a compact screen).
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4824] node scripts/tests/phase2.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PORT = Number(process.env.PORT || 4824);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
// what the panel says aloud is kept in window.__said, so a test can tell what a child who cannot read was told
const HEAR = () => { window.__said = []; try { speechSynthesis.speak = (u) => { window.__said.push(u.text); }; speechSynthesis.cancel = () => {}; } catch { /* no speech here */ } };
const open = async (qs, time = '16:20', { w = 1920, h = 1080, ctx } = {}) => { ctx = ctx ?? await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await page.addInitScript(HEAR);
  await page.clock.install({ time: new Date(time.includes('T') ? time : `2026-11-10T${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700); return page; };
const C = (page) => page.locator('family-hub-card');
const K = (page) => page.locator('fh-kid');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re);
const said = (page) => page.evaluate(() => window.__said ?? []);
const pin = async (page) => { for (const d of '1234') await C(page).locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500); };
const kidEl = 'document.querySelector("family-hub-card").shadowRoot.querySelector("fh-kid")';
const tab = async (page, id) => { await K(page).locator(`.tab[data-tab="${id}"]`).click(); await page.waitForTimeout(250); };
const NOTE = 'Answers come from an AI helper on the internet. It can be wrong. Ask a grown-up about anything important.';

// 1. two measures on the page: today's ring and the family jar. Nothing else is counted there
for (const look of ['glass', 'fridge', 'orbit', 'sports']) for (const kid of [0, 1, 2]) {
  const page = await open(`look=${look}&page=kid&kid=${kid}&nownext=1`);
  const r = await page.evaluate(`(() => { const k = ${kidEl}.shadowRoot, hero = k.querySelector('.hero'); return {
    hero: [...hero.querySelectorAll('.rank, .stats, .stat, .xp, .meter, .dots, .nextup, .starjar')].length, heroText: hero.innerText.replace(/\\s+/g, ' ').trim(),
    ring: k.querySelectorAll('.jobs .ring').length, jar: k.querySelectorAll('.side [aria-label="Family jar"]').length, rank: k.querySelectorAll('.rank').length }; })()`);
  ok(`${look}, child ${kid}: his card counts nothing (no rank, bar, points, good days or next unlock)`, r.hero === 0 && !/\d+ (more|to go|points|stars)|Good days|Next:|Ranger|Explorer/.test(r.heroText), r.heroText);
  ok(`${look}, child ${kid}: the page keeps the day ring and the family jar`, r.ring === 1 && r.jar === 1 && r.rank === 0, r);
  await page.context().close(); }
{ // points are in the Rewards tab, where they are spent
  let page = await open('look=glass&page=kid&kid=0'); await tab(page, 'rewards');
  let t = (await K(page).locator('.tabbody .ptsline').innerText()).replace(/\s+/g, ' ').trim();
  ok('eldest: the Rewards tab says what he has to spend', t === '120 points to spend', t);
  await tab(page, 'week'); ok('eldest: My week says nothing about points', (await K(page).locator('.tabbody .ptsline').count()) === 0);
  await page.context().close();
  page = await open('look=glass&page=kid&kid=2'); await tab(page, 'rewards');
  t = (await K(page).locator('.tabbody .stat').innerText()).replace(/\s+/g, ' ').trim();
  ok('youngest: his stars are in My stars, in his jar', /stars in my jar/.test(t) && (await K(page).locator('.hero .stat').count()) === 0, t);
  await page.context().close();
  // rank and the next unlock are in the studio (for a child who reads, and is not in older mode)
  for (const [kid, qs, want] of [[1, '', true], [0, '', true], [0, '&older=1', false], [2, '', false]]) { page = await open(`look=glass&page=kid&kid=${kid}&studio=1${qs}`);
    const s = K(page).locator('fh-studio'), n = await s.locator('.rankline .rank').count(), txt = n ? (await s.locator('.rankline').innerText()).replace(/\s+/g, ' ').trim() : '';
    ok(`studio, child ${kid}${qs}: rank ${want ? 'is shown here' : 'is not shown'}`, want ? n === 1 && /\d+ more to /.test(txt) : n === 0, txt);
    if (kid !== 2) ok(`studio, child ${kid}${qs}: the next unlock is here`, /Next unlock|Saving for/.test(await s.locator('.mirror').innerText()));
    await page.context().close(); } }

// 2. Now / Next is every child's default, "Show all" one tap away
for (const kid of [0, 1, 2]) { const page = await open(`look=glass&page=kid&kid=${kid}&nownext=1`);
  ok(`child ${kid}: opens on Now / Next`, (await K(page).locator('.focus').count()) === 1 && (await K(page).locator('.list').count()) === 0 && (await K(page).locator('.focus .label').first().innerText()).trim().toLowerCase() === 'now');
  await K(page).getByRole('button', { name: /Show all/ }).click(); await page.waitForTimeout(300);
  ok(`child ${kid}: "Show all" is one tap away, and "One at a time" brings it back`, (await K(page).locator('.list').count()) === 1 && (await K(page).getByRole('button', { name: 'One at a time' }).count()) === 1);
  await K(page).getByRole('button', { name: 'One at a time' }).click(); await page.waitForTimeout(300);
  ok(`child ${kid}: back to Now / Next`, (await K(page).locator('.focus').count()) === 1);
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&nownext=1&sheet=settings&pane=children&skid=0');
  const sw = C(page).locator('fh-settings').getByRole('switch', { name: 'One job at a time' });
  ok('Settings: "One job at a time" starts on for a child who reads words', (await sw.getAttribute('aria-checked')) === 'true');
  await page.context().close(); }

// 3. older mode: a plainer page, his week first, a private "Ask for a chat"
{ let page = await open('look=glass&page=kid&kid=0&nownext=1&older=1');
  const tabs = await K(page).locator('.tab').evaluateAll((l) => l.map((b) => [b.textContent.trim(), b.getAttribute('aria-pressed')]));
  ok('older: My week is the first tab and the one that is open', JSON.stringify(tabs) === JSON.stringify([['My week', 'true'], ['Rewards', 'false']]), tabs);
  ok('older: no feelings faces; a private "Ask for a chat" instead', (await K(page).locator('.feel').count()) === 0 && (await K(page).locator('.feelcard[data-private]').count()) === 1 && /Nothing shows on the wall/.test(await K(page).locator('.feelcard').innerText()));
  await K(page).getByRole('button', { name: /Show all/ }).click(); await page.waitForTimeout(300);
  const secs = await K(page).locator('.sec').evaluateAll((l) => l.map((x) => x.innerText.replace(/\s+/g, ' ').trim()));
  ok('older: plain section names (no "surprises along the way")', secs.length >= 2 && secs.every((x) => !/just what we do|surprises|fill the jar|Growing/.test(x)), secs);
  ok('older: no emoji in his rows or tabs', !/\p{Emoji_Presentation}/u.test((await K(page).locator('.list').innerText()) + tabs.join('')));
  await K(page).locator('[data-act="chat-note"]').click(); await page.waitForTimeout(400);
  const note = await calls(page, 'persistent_notification.create');
  ok('older: asking for a chat leaves a note in Home Assistant', note.length === 1 && /Riley would like a chat/.test(note[0]), note);
  ok('older: it says so, plainly', /Nothing shows on the wall/.test((await K(page).locator('.toast').innerText()).trim()));
  await C(page).locator('nav.dock [data-nav="calendar"]').click(); await page.waitForTimeout(500);
  ok('older: nothing about it appears on the shared pages', (await C(page).locator('.cap[data-kind="chat"]').count()) === 0);
  await page.context().close();
  // the younger two keep the faces, and their note still shows as a chip for the parents
  page = await open('look=glass&page=kid&kid=1');
  ok('not older: the feelings faces stay', (await K(page).locator('.feel button').count()) === 5 && (await K(page).locator('.feelcard[data-private]').count()) === 0);
  await K(page).getByRole('button', { name: 'sad' }).click(); await page.waitForTimeout(250); await K(page).getByRole('button', { name: /Chat later/ }).click(); await page.waitForTimeout(300);
  await C(page).locator('nav.dock [data-nav="calendar"]').click(); await page.waitForTimeout(500);
  ok('not older: the parents’ chip still appears', (await C(page).locator('.cap[data-kind="chat"]').count()) === 1);
  await page.context().close();
  // Settings can switch it
  page = await open('look=glass&page=planner&sheet=settings&pane=children&skid=0');
  const sv = C(page).locator('fh-settings'), sw = sv.getByRole('switch', { name: 'Older mode' });
  const before = await sw.getAttribute('aria-checked'); await sw.click(); await page.waitForTimeout(250);
  const drafted = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.kids[0].older);
  ok('Settings, Children: "Older mode" is a switch, off until chosen', before === 'false' && (await sw.getAttribute('aria-checked')) === 'true' && drafted === true, { before, drafted });
  await page.context().close(); }

// 4. the youngest: Coming up is three pictures with sleeps
for (const [w, h] of [[1920, 1080], [1280, 800], [1024, 768]]) { const page = await open('look=glass&page=kid&kid=2', '16:20', { w, h }); await tab(page, 'week');
  const r = await page.evaluate(`(() => { const k = ${kidEl}.shadowRoot, body = k.querySelector('.tabbody').getBoundingClientRect(), card = k.querySelector('.tabcard').getBoundingClientRect();
    return { rows: k.querySelectorAll('.wk').length, pics: [...k.querySelectorAll('.soonpic')].map((b) => { const r = b.getBoundingClientRect(); return { label: b.getAttribute('aria-label'), pic: b.querySelector('.e').textContent.trim(), moons: b.querySelectorAll('.moons span').length, sun: b.querySelector('.moons').textContent.includes('☀'), words: b.querySelector('.sl').textContent.trim(), inside: r.bottom <= card.bottom + 0.5 && r.top >= card.top - 0.5 && r.right <= body.right + 0.5, h: Math.round(r.height), w: Math.round(r.width) }; }) }; })()`);
  ok(`${w}x${h}: Coming up is pictures, not a list of words`, r.rows === 0 && r.pics.length === 3 && r.pics.every((p) => p.pic && p.pic !== '📅'), r.pics.map((p) => p.pic + ' ' + p.label));
  ok(`${w}x${h}: one moon for each sleep (a sun for today)`, r.pics.every((p) => { const n = Number(/(\d+) sleep/.exec(p.label)?.[1] ?? 0); return n ? p.moons === n && p.words === `${n} sleep${n > 1 ? 's' : ''}` : p.sun && p.words === 'Today'; }), r.pics.map((p) => `${p.words}:${p.moons}`));
  ok(`${w}x${h}: all three are in view, each big enough to tap`, r.pics.every((p) => p.inside && p.h >= 60 && p.w >= 60), r.pics.map((p) => `${p.w}x${p.h} ${p.inside}`));
  if (w === 1920) { await K(page).locator('.soonpic').nth(1).click(); await page.waitForTimeout(250); const s = await said(page); ok('a tap reads it out', s.some((x) => /^Kindy\. 1 sleep\.$/.test(x)), s.slice(-2)); }
  await page.context().close(); }

// 5. Ask by child
{ // not set for anyone: Ask opens for anyone, as it always did
  let page = await open('look=glass&page=planner'); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(500);
  ok('Ask not set by child: it opens straight away, the full helper, with no clock', (await C(page).locator('.askwho').count()) === 0 && (await C(page).locator('fh-chat .send').count()) === 1 && (await C(page).locator('fh-chat .left').count()) === 0);
  await page.context().close();
  // set by child: a shared page asks who is asking
  page = await open('look=glass&page=planner&ask=1'); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(500);
  let who = await C(page).locator('.askwho .whobtn').evaluateAll((l) => l.map((b) => b.innerText.trim()));
  ok('set by child, shared page: "Who is asking?" with each child and a grown-up', JSON.stringify(who) === JSON.stringify(['Riley', 'Charlie', 'Max', 'A grown-up']) && (await C(page).locator('fh-chat').count()) === 0, who);
  ok('the note about the helper is on the sheet from the start', (await C(page).locator('.chatsheet .ainote').innerText()).trim() === NOTE);
  const sz = await C(page).locator('.askwho .whobtn').evaluateAll((l) => l.map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); }));
  ok('each face is a big target', sz.every((x) => x >= 120), sz);
  await C(page).locator('.askwho .whobtn', { hasText: 'Max' }).click(); await page.waitForTimeout(600);
  let chat = C(page).locator('fh-chat');
  ok('the youngest: pictures only (no field, no keys, no microphone)', (await chat.getAttribute('pics')) !== null && (await chat.locator('.send, .keys, .talk, .nomic').count()) === 0 && (await chat.locator('.starter').count()) === 6);
  ok('the youngest: the sheet says "Tap a picture."', /Tap a picture\./.test(await C(page).locator('.chatsheet .shead').innerText()));
  ok('his time for the day is shown', /15 min of Ask left today/.test(await chat.locator('.left').innerText()));
  await chat.locator('.starter').first().click(); await page.waitForTimeout(1200);
  ok('a picture still asks the helper', (await calls(page, 'ws.conversation/process')).length === 1 && (await chat.locator('.bubble').count()) >= 2);
  await page.context().close();
  // a grown-up goes through the PIN and has no clock
  page = await open('look=glass&page=planner&ask=1'); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(500);
  await C(page).locator('.askwho .whobtn', { hasText: 'A grown-up' }).click(); await page.waitForTimeout(400);
  ok('a grown-up is asked for the PIN', (await C(page).locator('fh-pin').count()) === 1 && (await C(page).locator('fh-chat').count()) === 0);
  await pin(page); chat = C(page).locator('fh-chat');
  ok('then gets the full helper with no clock', (await chat.locator('.send').count()) === 1 && (await chat.locator('.left').count()) === 0 && (await chat.getAttribute('pics')) === null);
  await page.context().close();
  // on his own page it is his Ask, with no question about who
  page = await open('look=glass&page=kid&kid=2&ask=1'); await K(page).locator('[data-act="ask"]').click(); await page.waitForTimeout(600);
  ok('on the youngest’s page his button opens his pictures', (await C(page).locator('.askwho').count()) === 0 && (await C(page).locator('fh-chat[pics]').count()) === 1);
  await page.context().close();
  page = await open('look=glass&page=kid&kid=1&ask=1'); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(600);
  ok('on the middle child’s page: the full helper, his 15 minutes', (await C(page).locator('fh-chat .send').count()) === 1 && (await C(page).locator('fh-chat[pics]').count()) === 0 && /15 min/.test(await C(page).locator('fh-chat .left').innerText()));
  await page.context().close();
  // off: no way in from his page, and he is not offered on a shared page
  page = await open('look=glass&page=kid&kid=2&ask=off');
  ok('Ask off for a child: no Ask button on his page, in the card or the header', (await K(page).locator('[data-act="ask"]').count()) === 0 && (await C(page).locator('header [data-act="ask"]').count()) === 0);
  await C(page).locator('nav.dock [data-nav="calendar"]').click(); await page.waitForTimeout(400); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(500);
  who = await C(page).locator('.askwho .whobtn').evaluateAll((l) => l.map((b) => b.innerText.trim()));
  ok('Ask off for a child: he is not among the faces', JSON.stringify(who) === JSON.stringify(['Riley', 'Charlie', 'A grown-up']), who);
  await page.context().close();
  // the day's time: it counts down while his Ask is open, runs out kindly, and stays out until tomorrow
  page = await open('look=glass&page=kid&kid=0&ask=1&askmin=1'); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(600); chat = C(page).locator('fh-chat');
  ok('a one-minute allowance starts at 1 min', /1 min of Ask left today/.test(await chat.locator('.left').innerText()));
  await page.clock.runFor(62_000); await page.waitForTimeout(400);
  ok('when it runs out, Ask says so', /No Ask time left today/.test(await chat.locator('.left').innerText()) && /That is all the Ask time for today/.test(await chat.locator('.bubble').last().innerText()));
  ok('…and nothing more can be asked', (await chat.locator('.starter:not([disabled])').count()) === 0 && (await chat.locator('.send .lead').isDisabled()));
  ok('…and it is said aloud', (await said(page)).some((x) => /That is all the Ask time for today/.test(x)));
  const before = (await calls(page, 'ws.conversation/process')).length;
  await page.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-chat'); c._ask('Tell me a joke'); }); await page.waitForTimeout(900);
  ok('…even if asked another way', (await calls(page, 'ws.conversation/process')).length === before);
  await C(page).locator('.chatsheet').getByRole('button', { name: 'Close' }).click(); await page.waitForTimeout(400);
  await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(600);
  ok('opened again the same day: still out', /No Ask time left today/.test(await C(page).locator('fh-chat .left').innerText()));
  await C(page).locator('.chatsheet').getByRole('button', { name: 'Close' }).click(); await page.waitForTimeout(400);
  await C(page).locator('nav.dock .kidbtn').nth(1).click(); await page.waitForTimeout(500); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(600);
  ok('his brother’s time is his own', /15 min of Ask left today/.test(await C(page).locator('fh-chat .left').innerText()));
  await page.context().close();
  // a wrong setting is refused with words
  page = await open('look=glass&page=planner');
  const bad = await page.evaluate(() => { const c = document.querySelector('family-hub-card'), cfg = JSON.parse(JSON.stringify(c._config)); const tryIt = (fn) => { const x = JSON.parse(JSON.stringify(cfg)); fn(x); try { document.createElement('family-hub-card').setConfig(x); return ''; } catch (e) { return String(e.message); } };
    return [tryIt((x) => { x.kids[0].ask = 'maybe'; }), tryIt((x) => { x.kids[0].ask_minutes = -5; }), tryIt((x) => { x.kids[0].rewards[0].weekly = 'often'; }), tryIt((x) => { x.kids[0].ask = 'pictures'; x.kids[0].ask_minutes = 0; x.kids[0].rewards[0].weekly = 2; })]; });
  ok('a wrong ask, ask_minutes or weekly is refused in plain words; right ones pass', /pictures, full or off/.test(bad[0]) && /ask_minutes/.test(bad[1]) && /weekly/.test(bad[2]) && bad[3] === '', bad);
  await page.context().close();
  // Settings, Children
  page = await open('look=glass&page=planner&sheet=settings&pane=children&skid=2'); const sv = C(page).locator('fh-settings'), card = sv.locator('[data-card="ask"]');
  const on = await card.getByRole('group', { name: 'Ask' }).locator('[aria-pressed="true"]').innerText();
  ok('Settings, Children: a child who cannot read starts on "Pictures only"', on.trim() === 'Pictures only', on);
  await card.getByRole('group', { name: 'Ask' }).getByRole('button', { name: 'Off' }).click(); await page.waitForTimeout(250);
  const d = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.kids[2].ask);
  ok('Settings, Children: choosing sets it for that child, and Off hides the minutes', d === 'off' && (await card.getByRole('group', { name: 'Ask time a day' }).count()) === 0 && /first asks who is asking/.test(await card.locator('.shint').innerText()), d);
  await page.context().close(); }

// 6. the note about the helper is read aloud the first time each day
{ const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true });
  let page = await open('look=glass&page=planner', '16:20', { ctx }); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(600);
  ok('first use today: the note is read aloud', (await said(page)).filter((x) => x === NOTE).length === 1, await said(page));
  await C(page).locator('.chatsheet').getByRole('button', { name: 'Close' }).click(); await page.waitForTimeout(400); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(600);
  ok('second use today: not again', (await said(page)).filter((x) => x === NOTE).length === 1);
  await page.close();
  page = await open('look=glass&page=planner', '2026-11-11T07:10:00+08:00', { ctx }); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(600);
  ok('the next day: read aloud again', (await said(page)).filter((x) => x === NOTE).length === 1, await said(page));
  await page.close();
  // by child: each hears it on his own first use
  page = await open('look=glass&page=kid&kid=2&ask=1', '2026-11-11T07:20:00+08:00', { ctx }); await K(page).locator('[data-act="ask"]').click(); await page.waitForTimeout(600);
  ok('set by child: the youngest hears it on his first use, though the panel was used already', (await said(page)).filter((x) => x === NOTE).length === 1);
  await ctx.close();
  // quiet hours set to silence the panel: it cannot be heard, so it is not counted as heard
  page = await open('look=glass&page=planner&quietmute=1', '20:40'); await page.clock.runFor(16_000); await page.waitForTimeout(300); await C(page).locator('header [data-act="ask"]').click(); await page.waitForTimeout(400); await pin(page); await page.waitForTimeout(400);
  const told = await page.evaluate(() => localStorage.getItem('fh-ask-told'));
  ok('while the panel is silenced for the night it is not counted as heard', (await C(page).locator('fh-chat').count()) === 1 && (await said(page)).filter((x) => x === NOTE).length === 0 && !/panel/.test(told ?? ''), told);
  await page.context().close(); }

// 7. the studio shows the next three locked things in each group
for (const [kid, qs] of [[1, ''], [0, '&painted=1'], [2, '']]) { const page = await open(`look=glass&page=kid&kid=${kid}&studio=1${qs}`); const s = K(page).locator('fh-studio'); const out = []; let hid = 0;
  const n = await s.locator('.tabs button').count();
  for (let i = 0; i < n; i++) { await s.locator('.tabs button').nth(i).click(); await page.waitForTimeout(200);
    const r = await s.evaluate((el) => { const r = el.shadowRoot; return { locked: r.querySelectorAll('.tile.locked').length, sw: r.querySelectorAll('.sw button.locked').length, more: r.querySelector('.cell.more')?.getAttribute('aria-label') ?? '', tiles: r.querySelectorAll('.tile').length }; });
    out.push(r); if (r.more) hid++; }
  ok(`studio, child ${kid}${qs}: no group shows more than three locked things (or three locked colours)`, out.every((r) => r.locked <= 3 && r.sw <= 3 && r.tiles >= 1), out.map((r) => `${r.locked}/${r.sw}`).join(' '));
  ok(`studio, child ${kid}${qs}: where more are hidden it says how many are still to come`, hid >= 1 && out.every((r) => !r.more || /^\d+ more to discover later$/.test(r.more)), out.map((r) => r.more).filter(Boolean));
  await page.context().close(); }
{ // what he is saving for stays in view however far off it is
  const page = await open('look=glass&page=kid&kid=1&studio=1');
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'); c.hass = { ...c.hass, states: { ...c.hass.states, 'input_text.charlie_goal': { entity_id: 'input_text.charlie_goal', state: 'mullet', attributes: {} } } }; }); await page.waitForTimeout(300);
  const s = K(page).locator('fh-studio'); const t = await s.locator('.tile.locked').evaluateAll((l) => l.map((b) => b.innerText.replace(/\s+/g, ' ').trim()));
  ok('studio: a far-off thing he is saving for is still shown', t.some((x) => /Mullet/.test(x)), t);
  await page.context().close(); }

// 8. a reward with a weekly limit
{ const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true });
  let page = await open('look=glass&page=kid&kid=0&weekly=1', '16:20', { ctx }); await tab(page, 'rewards');
  const row = () => K(page).locator('.rw', { hasText: 'Extra screen time' });
  ok('before it is had: an ordinary reward', (await row().getAttribute('data-capped')) === null && /Spend 50/.test(await row().innerText()));
  await row().click(); await page.waitForTimeout(300); await K(page).locator('.rw.ask button').first().click(); await page.waitForTimeout(1200);
  ok('spent once', (await calls(page, 'script.fh_add_points.*-50')).length === 1, await calls(page, 'fh_add_points'));
  ok('then it says when it comes back', (await row().getAttribute('data-capped')) !== null && /Back Monday/.test(await row().innerText()) && /had this week\. Back on Monday/.test(await row().getAttribute('aria-label')), await row().innerText());
  await page.waitForTimeout(700); await row().click(); await page.waitForTimeout(400);
  ok('a tap explains, and spends nothing', /comes back on Monday/.test(await K(page).locator('.toast').innerText()) && (await K(page).locator('.rw.ask').count()) === 0 && (await calls(page, 'script.fh_add_points.*-50')).length === 1);
  ok('the other rewards are untouched', (await K(page).locator('.rw[data-capped]').count()) === 1);
  await page.close();
  page = await open('look=glass&page=kid&kid=0&weekly=1', '2026-11-13T16:20:00+08:00', { ctx }); await tab(page, 'rewards');
  ok('later the same week (this screen’s own note): still "Back Monday"', /Back Monday/.test(await row().innerText()));
  await page.close();
  page = await open('look=glass&page=kid&kid=0&weekly=1', '2026-11-16T07:00:00+08:00', { ctx }); await tab(page, 'rewards');
  ok('on Monday it is back', (await row().getAttribute('data-capped')) === null && !/Back Monday/.test(await row().innerText()), await row().innerText());
  await ctx.close();
  // the rewards list in Home Assistant counts too (another screen, or this one after its storage is cleared)
  page = await open('look=glass&page=kid&kid=0&weekly=1');
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'); return c.hass.callService('todo', 'add_item', { item: 'Riley: Extra screen time', description: '09/11/2026 · 50 pts' }, { entity_id: 'todo.rewards_owed' }); });
  await page.evaluate(`${kidEl}._loadOwed()`); await page.waitForTimeout(400); await tab(page, 'rewards');
  ok('a line in the rewards list from this week counts', /Back Monday/.test(await row().innerText()));
  await page.evaluate(() => { const c = document.querySelector('family-hub-card'); return c.hass.callService('todo', 'add_item', { item: 'Riley: Pick the family movie', description: '02/11/2026 · 100 pts' }, { entity_id: 'todo.rewards_owed' }); });
  await page.context().close();
  page = await open('look=glass&page=kid&kid=0'); await tab(page, 'rewards');
  ok('with no limit set, nothing is capped', (await K(page).locator('.rw[data-capped]').count()) === 0);
  await page.context().close(); }

// 9. Settings, Rewards: "Once a week", and a drafted list that is not live until it is put live
{ let page = await open('look=glass&page=planner&sheet=settings&pane=rewards&skid=0'); let sv = C(page).locator('fh-settings');
  const once = sv.locator('[data-reward="0"] [data-act="weekly"]');
  ok('Settings, Rewards: no draft, no draft card', (await sv.locator('[data-card="rewards-draft"]').count()) === 0 && (await once.getAttribute('aria-pressed')) === 'false');
  await once.click(); await page.waitForTimeout(250);
  let d = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.kids[0].rewards[0]);
  ok('"Once a week" sets the limit', d.weekly === 1 && (await once.getAttribute('aria-pressed')) === 'true', d);
  await once.click(); await page.waitForTimeout(250); d = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.kids[0].rewards[0]);
  ok('…and takes it off again', d.weekly === undefined, d);
  await page.context().close();
  page = await open('look=glass&page=kid&kid=0&rwdraft=1'); await tab(page, 'rewards');
  const live = await K(page).locator('.rw .n').evaluateAll((l) => l.map((x) => x.textContent.trim()));
  ok('a drafted list is not on the child’s page', JSON.stringify(live) === JSON.stringify(['Extra screen time', 'Pick the family movie', 'Warhammer paint pot']), live);
  await page.context().close();
  page = await open('look=glass&page=planner&rwdraft=1&sheet=settings&pane=rewards&skid=0'); sv = C(page).locator('fh-settings');
  const names = () => sv.locator('.scard[data-list] .sitem input[aria-label$="name"]').evaluateAll((l) => l.map((x) => x.value));
  ok('Settings, Rewards: the draft is waiting, marked as not live', (await sv.locator('[data-card="rewards-draft"]').count()) === 1 && /not live yet/.test(await sv.locator('[data-card="rewards-draft"] h3').innerText()) && (await sv.locator('.scard[data-list]').getAttribute('data-list')) === 'draft');
  ok('…and it is the list being edited', JSON.stringify(await names()) === JSON.stringify(['Choose the bedtime story', 'Screen time, 20 minutes']), await names());
  ok('…with its weekly limit showing', (await sv.locator('[data-reward="1"] [data-act="weekly"]').getAttribute('aria-pressed')) === 'true');
  await sv.getByRole('group', { name: 'Which list' }).getByRole('button', { name: /Live now/ }).click(); await page.waitForTimeout(250);
  ok('the live list can be looked at beside it', (await names()).length === 3 && (await sv.locator('.scard[data-list]').getAttribute('data-list')) === 'live', await names());
  await sv.getByRole('group', { name: 'Which list' }).getByRole('button', { name: /Draft/ }).click(); await page.waitForTimeout(250);
  // an edit to the draft stays in the draft
  await sv.locator('[data-reward="0"] [data-act="weekly"]').click(); await page.waitForTimeout(250);
  let k = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.kids[0]);
  ok('editing the draft leaves the live list alone', k.rewards_draft[0].weekly === 1 && k.rewards.length === 3 && k.rewards[0].name === 'Extra screen time' && k.rewards[0].weekly === undefined, k.rewards_draft);
  await sv.locator('[data-act="draft-live"]').click(); await page.waitForTimeout(300);
  k = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.kids[0]);
  ok('"Put this draft live" makes it his list and removes the draft', k.rewards_draft === undefined && k.rewards.length === 2 && k.rewards[0].name === 'Choose the bedtime story' && k.rewards[0].weekly === 1 && k.rewards[1].weekly === 1 && (await sv.locator('[data-card="rewards-draft"]').count()) === 0, k.rewards);
  await sv.locator('[data-act="save"]').click(); await page.waitForTimeout(1200);
  const saved = await page.evaluate(() => { const c = document.querySelector('family-hub-card')._config.kids[0]; return { n: c.rewards.map((r) => r.name), draft: c.rewards_draft }; });
  ok('…and Save writes it to the dashboard', (await calls(page, 'ws.lovelace/config/save')).length === 1 && saved.n.length === 2 && saved.draft === undefined, saved);
  await page.context().close();
  page = await open('look=glass&page=planner&rwdraft=1&sheet=settings&pane=rewards&skid=0'); sv = C(page).locator('fh-settings');
  await sv.locator('[data-act="draft-drop"]').click(); await page.waitForTimeout(300);
  k = await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.kids[0]);
  ok('"Discard the draft" drops it and keeps the live list', k.rewards_draft === undefined && k.rewards.length === 3);
  await page.context().close(); }

// 10. the two leftovers from before Phase 1
for (const look of ['glass', 'fridge', 'orbit', 'sports']) for (const [w, h] of [[1920, 1080], [1280, 800], [1024, 768]]) { const page = await open(`look=${look}&page=planner`, '16:20', { w, h });
  const dock = await page.evaluate(() => { const out = {}; for (const b of document.querySelector('family-hub-card').shadowRoot.querySelectorAll('nav.dock .item')) { const rg = document.createRange(); const tn = [...b.childNodes].reverse().find((n) => n.textContent.trim()); rg.selectNodeContents(tn); out[b.textContent.trim()] = Math.round(rg.getBoundingClientRect().bottom * 10) / 10; } return out; });
  const v = Object.values(dock); ok(`${look} ${w}x${h}: the children’s names rest on the same line as every other dock label`, v.length >= 9 && Math.max(...v) - Math.min(...v) <= 0.5, `${Math.min(...v)}..${Math.max(...v)}`);
  await page.context().close(); }
{ const page = await open('look=sports&page=planner', '16:20', { w: 1024, h: 768 });
  const q = await page.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.quick')].map((b) => { const g = document.createRange(); g.selectNodeContents(b); const t = g.getBoundingClientRect(), o = b.getBoundingClientRect(); return { text: b.textContent.trim(), lines: Math.round(t.height / parseFloat(getComputedStyle(b).fontSize)), gap: Math.round(Math.min(t.left - o.left, o.right - t.right) * 10) / 10, fs: parseFloat(getComputedStyle(b).fontSize), h: Math.round(o.height) }; }));
  ok('Sports at 1024 x 768: the timer pills are 15 px, on one line, 6 px clear of the ring', q.length === 3 && q.every((x) => x.lines === 1 && x.gap >= 6 && x.fs >= 15 && x.h >= 44), q.map((x) => `${x.text} ${x.fs}px ${x.gap}`));
  await page.context().close(); }

console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILED` : `\nall ${pass} passed`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
