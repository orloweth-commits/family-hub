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
console.log('add-event typed:', await page.locator('fh-add-event input').inputValue()); await shot(page, 'c-add-fridge');
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
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close(); srv.close();
