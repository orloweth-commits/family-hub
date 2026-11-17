// R1.2, "Home Assistant unreachable": the panel with Home Assistant gone away and back.
// The page keeps showing the last calendar, jobs, list and weather it had, dated in one plain line; a tap that would change something says it
// cannot yet and changes nothing; when Home Assistant answers again everything is read afresh by itself, with no reload.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4862] node scripts/tests/hadown.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.json': 'application/json' };
const PORT = Number(process.env.PORT || 4862);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };

const open = async (qs, { time = '2026-11-10T10:20' } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.clock.install({ time: new Date(`${time}:00+08:00`) });
  await page.goto('http://localhost:' + PORT + '/?' + qs + '&net=off&calm=1'); await page.waitForFunction('window.__ready === true', null, { timeout: 20000 }); await page.waitForTimeout(600);
  return page;
};
const card = 'document.querySelector("family-hub-card")';
const R = (page, js, arg) => page.evaluate(js, arg);
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 150 }); return true; } catch { return false; } };
const go = async (page, p, kid) => { await page.evaluate(([p, kid]) => { const c = document.querySelector('family-hub-card'); c._sheet = ''; if (kid !== undefined) c._kid = kid; c._page = p; }, [p, kid]); await page.waitForTimeout(400); await page.clock.runFor(500); await page.waitForTimeout(300); };
const run = async (page, ms) => { await page.clock.runFor(ms); await page.waitForTimeout(250); };
const line = (page) => R(page, () => document.querySelector('family-hub-card').shadowRoot.querySelector('.cap.house')?.textContent?.trim() ?? '');
const calls = (page, re) => R(page, (re) => (window.__calls ?? []).filter((c) => new RegExp(re).test(c)), re.source);
const down = (page, d) => page.evaluate((d) => window.__haDown(d), d);

// 1. the planner: the week, the reminders and today's top stay; one line says so, from ten seconds on
{ const page = await open('page=planner');
  await page.evaluate(() => { window.__same = document.querySelector('family-hub-card'); });
  const before = await R(page, () => { const c = document.querySelector('family-hub-card'); return { ev: c._events.length, rem: c._reminders.length, top: c._wx.max }; });
  ok('the planner has its week, its reminders and today’s top before', before.ev > 5 && before.rem === 3 && before.top !== undefined, before);
  await run(page, 2000);
  await down(page, true);
  await run(page, 3000);
  ok('a blip of a few seconds says nothing', (await line(page)) === '');
  // the five-minute poll runs while Home Assistant is away
  await R(page, () => { const c = document.querySelector('family-hub-card'); c._fetchedKey = ''; c._refresh(); c._loadSoon(); });
  await run(page, 8000);
  const st = await R(page, () => { const c = document.querySelector('family-hub-card'), r = c.shadowRoot; return { ev: c._events.length, soon: c._soon.length, rem: c._reminders.length, top: c._wx.max, calfail: !!r.querySelector('.calfail'), drawn: r.querySelectorAll('.planner .ev, .planner [data-ev], .planner button.ev').length, remRows: r.querySelectorAll('button.rem').length }; });
  ok('a poll while it is away keeps the week (no "Can’t reach the calendars")', st.ev === before.ev && !st.calfail && st.soon > 0, st);
  ok('and the reminders and today’s top', st.rem === 3 && st.remRows === 3 && st.top === before.top, st);
  const l = await line(page);
  ok('after ten seconds one plain line says Home Assistant is not answering, as at when it last answered', /Home Assistant isn’t answering/.test(l) && /as at 10:20\s?am/.test(l), l);
  ok('the line takes the place of the header’s chips', await R(page, () => document.querySelector('family-hub-card').shadowRoot.querySelectorAll('header .capsule .cap').length === 1));
  // the calendars answer over plain web requests even when only the socket is lost: that is not the house back
  await page.evaluate(() => { window.__restUp = true; }); await R(page, () => { const c = document.querySelector('family-hub-card'); c._fetchedKey = ''; c._refresh(); c._loadSoon(); }); await run(page, 3000);
  ok('a calendar read over the web while the socket is down does not end the line', /isn’t answering/.test(await line(page)));
  await page.evaluate(() => { window.__restUp = false; });
  ok('no calendar warning on top of it', await R(page, () => !document.querySelector('family-hub-card').shadowRoot.querySelector('.calnote[data-warn]')));
  // the line is whole at the wall's size (it may wrap, it is never cut)
  const fit = await R(page, () => { const b = document.querySelector('family-hub-card').shadowRoot.querySelector('.cap.house'), s = b.querySelector('span:last-child'), r = b.getBoundingClientRect(), h = b.closest('header').getBoundingClientRect(); return { cut: s.scrollWidth > s.clientWidth + 1 || s.scrollHeight > s.clientHeight + 1, inHeader: r.top >= h.top - 1 && r.bottom <= h.bottom + 1, w: Math.round(r.width) }; });
  ok('the line is whole and inside the header at 1920 × 1080', !fit.cut && fit.inHeader, fit);
  await page.locator('family-hub-card .cap.house').click();
  ok('a tap on it says changes wait and that it reconnects by itself, with no reload', /no need to reload/.test(await R(page, () => document.querySelector('family-hub-card')._toast)));
  // a reminder ticked while it is away
  await page.evaluate(() => { window.__calls = []; });
  await page.locator('family-hub-card button.rem').first().click(); await page.waitForTimeout(200);
  const t = await R(page, () => document.querySelector('family-hub-card')._toast);
  ok('ticking a reminder says it cannot change yet, and nothing is sent', /isn’t answering, so that didn’t change/.test(t) && (await calls(page, /update_item/)).length === 0, t);
  ok('and the reminder stays on the list', await R(page, () => document.querySelector('family-hub-card').shadowRoot.querySelectorAll('button.rem').length === 3));
  // back: no reload, the line goes, the calendar and reminders are read again
  await page.evaluate(() => { window.__calls = []; });
  await down(page, false);
  await run(page, 3000);
  ok('when it answers again the line goes by itself', (await line(page)) === '');
  ok('and the same page carries on (no reload)', await R(page, () => window.__same === document.querySelector('family-hub-card') && window.__ready === true));
  await page.evaluate(() => { window.__calls = []; });
  ok('a reminder ticks again', await (async () => { await page.locator('family-hub-card button.rem').first().click(); await page.waitForTimeout(300); return (await calls(page, /update_item/)).length === 1; })());
  await page.context().close(); }

// 2. a child's page, opened while Home Assistant is away: his jobs as last read; a tick is refused and not shown as done
{ const page = await open('page=kid&kid=0');
  const jobs = await R(page, () => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid')._chores.length);
  await go(page, 'planner');
  await down(page, true); await run(page, 11000);
  await go(page, 'kid', 0); await run(page, 600);
  const k = await R(page, () => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid'); return { n: f._chores.length, open: f._chores.filter((c) => c.status === 'needs_action').length, tiles: f.shadowRoot.querySelectorAll('[data-uid]').length }; });
  ok('his jobs show, as they were last read (not an empty page)', k.n === jobs && k.n > 0 && k.tiles > 0, { ...k, jobs });
  ok('his page has the same one line', /Home Assistant isn’t answering/.test(await line(page)));
  await page.evaluate(() => { window.__calls = []; });
  const uid = await R(page, () => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid')._chores.find((c) => c.status === 'needs_action' && c.lane !== 'job')?.uid);
  await page.locator(`family-hub-card fh-kid [data-uid="${uid}"]`).first().click(); await page.waitForTimeout(200);
  const after = await R(page, (uid) => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid'); return { st: f._chores.find((c) => c.uid === uid)?.status, msg: f._msg }; }, uid);
  ok('a tick while it is away is refused: the job stays open and he is told why', after.st === 'needs_action' && /isn’t answering/.test(after.msg) && (await calls(page, /update_item|fh_add_points/)).length === 0, after);
  // back, with the library's own re-made subscriptions dead: his page follows afresh and hears a change made elsewhere
  await page.evaluate(() => { window.__resubDies = true; }); await down(page, false); await run(page, 3000);
  await page.evaluate((uid) => window.__haDown && document.querySelector('family-hub-card').hass.callService('todo', 'update_item', { item: uid, status: 'completed' }, { entity_id: 'todo.riley_chores' }), uid);
  await run(page, 400);
  ok('back: his list is followed afresh and shows a tick made elsewhere', await until(page, (uid) => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid')._chores.find((c) => c.uid === uid)?.status === 'completed', uid, 4000));
  await page.context().close(); }

// 2b. a child's page whose list was never read on this screen: said plainly, never "All done"
{ const page = await open('page=planner');
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('fh-kept-list:todo.charlie')) localStorage.removeItem(k); });
  await down(page, true); await run(page, 11000); await go(page, 'kid', 1); await run(page, 600);
  const t = await R(page, () => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid'); return f.shadowRoot.querySelector('.jobs')?.textContent.replace(/\s+/g, ' ').trim() ?? ''; });
  ok('a child’s page with nothing kept says his jobs can’t be read just now, not "All done"', /can’t be read just now/.test(t) && !/All done|Nothing right now/.test(t), t);
  await down(page, false); await run(page, 3000);
  ok('and his jobs fill in by themselves when Home Assistant is back', await until(page, () => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid'); return f._chores.length > 0 && !f.shadowRoot.querySelector('[data-act="nolist"]'); }, null, 4000));
  await page.context().close(); }

// 3. the shopping list: kept in the browser; adding while away keeps the words in the box; back, it is followed afresh
{ const page = await open('page=groceries');
  const n = await R(page, () => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries')._items.length);
  ok('the list is kept in this browser as it is read', await R(page, () => Object.keys(localStorage).some((k) => k === 'fh-kept-list:todo.shopping_list')));
  await go(page, 'planner'); await down(page, true); await run(page, 11000); await go(page, 'groceries');
  const g = await R(page, () => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries'); return { n: f._items.length, failed: f._failed }; });
  ok('opened while away, the list shows as last read (not "Can’t reach the shopping list")', g.n === n && !g.failed, { ...g, n0: n });
  await page.evaluate(() => { window.__calls = []; const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries'); f._typed = 'Lemons'; });
  await page.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries')._add()); await page.waitForTimeout(200);
  const a = await R(page, () => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries'); return { typed: f._typed, toast: f._toast }; });
  ok('adding while away says it cannot yet and keeps the words in the box', a.typed === 'Lemons' && /isn’t answering/.test(a.toast) && (await calls(page, /add_item/)).length === 0, a);
  await page.evaluate(() => { window.__resubDies = true; }); await down(page, false); await run(page, 3000);
  await page.evaluate(() => document.querySelector('family-hub-card').hass.callService('todo', 'add_item', { item: 'Added on a phone' }, { entity_id: 'todo.shopping_list' }));
  ok('back: the list is followed afresh and shows a thing added on a phone', await until(page, () => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries')._items.some((i) => i.summary === 'Added on a phone'), null, 4000));
  await page.context().close(); }

// 4. the morning board: the jobs stay; a tick is refused
{ const page = await open('page=morning', { time: '2026-11-10T07:10' });
  await go(page, 'planner'); await down(page, true); await run(page, 11000); await go(page, 'morning');
  const m = await R(page, () => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-morning'); return f ? Object.values(f._items).reduce((n, l) => n + l.length, 0) : -1; });
  ok('the morning board keeps the jobs as last read', m > 5, m);
  await page.context().close(); }

// 5. the weather page: the forecast as last read, the line on top
{ const page = await open('page=weather');
  const d = await R(page, () => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather')._days.length);
  await go(page, 'planner'); await down(page, true); await run(page, 11000); await go(page, 'weather'); await run(page, 600);
  const w = await R(page, () => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather'); return { days: f._days.length, hours: f._hours.length, failed: f._failed, off: !!f.shadowRoot.querySelector('section.off') }; });
  ok('opened while away, the week and the hours show as last read', w.days === d && d > 0 && w.hours > 0 && !w.failed && !w.off, w);
  await page.context().close(); }

// 6. a socket that stays "open" to a computer that has gone: two pings unanswered, and it is dropped so a new one is made
{ const page = await open('page=planner');
  await page.evaluate(() => { window.__calls = []; window.__hung = true; });
  await run(page, 61000); await run(page, 11000);
  ok('one unanswered ping is not enough', (await calls(page, /ws\.reconnect/)).length === 0);
  await run(page, 50000); await run(page, 11000);
  ok('two in a row: the socket is dropped and made again', (await calls(page, /ws\.reconnect/)).length === 1);
  await run(page, 3000);
  ok('and the house is back, with no line', (await line(page)) === '' && await R(page, () => document.querySelector('family-hub-card').hass.connected !== false));
  await page.context().close(); }

// 7. nothing kept at all (a page never opened before): the plain "can't reach" pages as before, and the line
{ const page = await open('page=planner');
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('fh-kept-list:todo.shopping')) localStorage.removeItem(k); });
  await down(page, true); await run(page, 11000); await go(page, 'groceries'); await run(page, 600);
  ok('a list never read says it cannot be reached (nothing made up)', await R(page, () => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries')._failed === true));
  await page.evaluate(() => { window.__resubDies = false; }); await down(page, false); await run(page, 3000);
  ok('and fills in by itself when Home Assistant is back', await until(page, () => { const f = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries'); return !f._failed && f._items.length > 0; }, null, 4000));
  await page.context().close(); }

console.log(`\nerrors: ${errs.length ? '\n' + [...new Set(errs)].map((e) => ' - ' + e).join('\n') : 'none'}`);
console.log(`\n${pass} passed, ${fails.length} failed${fails.length ? ':\n - ' + fails.join('\n - ') : ''}`);
await browser.close(); srv.close(); process.exit(fails.length || errs.length ? 1 : 0);
