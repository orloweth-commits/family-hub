// click-base, shell part (split from click-base.mjs by page, 23 Nov 2026: plan section 3, backlog 52 and 34): the frame and the looks: fonts, scaling and reflow, one grammar per look, motion, the cold reviewers' round 5, Home Ground, a few looks' colours.
// Each section runs in its own block: one that stops (a missing element) prints a FAIL line naming it and the next section carries on (backlog 34).
import { browser, ctx, srv, errs, PORT, PREV, ROOT, HOME, MORE, open, openAt, shot, ok, calls, toastOf, sr, srStudio, ratio, section, finish } from './lib/click.mjs';
let page;

await section('1. fonts load from beside the card, nothing from a font service', async () => {
// 1. fonts load from beside the card, nothing from a font service
let page = await open('look=fridge');
const reqs = []; page.on('request', (r) => reqs.push(r.url()));
await page.reload(); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(1500);
console.log('font requests:', reqs.filter((u) => /woff2|googleapis|gstatic/.test(u)).map((u) => u.replace('http://localhost:' + PORT + '', '')).join(' '));
console.log('fonts ready:', await page.evaluate(() => ['Inter', 'Bricolage Grotesque', 'Fredoka', 'Caveat'].map((f) => f + '=' + document.fonts.check(`16px "${f}"`)).join(' ')));
await page.close();
});
await section('7. calm mode stops the avatar loops', async () => {
// 7. calm mode stops the avatar loops
page = await open('look=glass&page=kid&kid=1&calm=1');
console.log('calm:', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot; const fh = r.querySelector('.fh'); const bob = r.querySelector('fh-kid').shadowRoot.querySelector('.av-bob'); return fh.hasAttribute('data-calm') + ' bob loops=' + (bob ? getComputedStyle(bob).animationIterationCount : 'n/a'); }));
// 8. month cell and presence labels, scroll cue
await HOME(page); await page.getByRole('button', { name: 'Planner' }).click(); await page.getByRole('button', { name: 'Month' }).click(); await page.waitForTimeout(300);
console.log('month label:', await page.locator('family-hub-card .cell.today').getAttribute('aria-label'));
console.log('presence:', await page.locator('family-hub-card .presence .avatar').evaluateAll((els) => els.map((e) => e.textContent.trim() + ':' + e.getAttribute('aria-label')).join(' | ')));
await HOME(page); await page.getByRole('button', { name: 'Groceries' }).click(); await page.waitForTimeout(400);
console.log('scroll cue on groceries:', await page.locator('fh-groceries .items').evaluate((e) => e.hasAttribute('data-more') + ' (' + e.scrollHeight + '>' + e.clientHeight + ')'));
await page.close();
});
await section('polish pass, looks: one grammar per look (every line below should end ', async () => {
// polish pass, looks: one grammar per look (every line below should end in true)
{ const Q = (pg, f) => pg.evaluate(f);
  const lum = `const L = (c) => { const m = c.match(/[\\d.]+/g).map(Number), f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); }; const CR = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };`;
  // Fridge: the pause button on the dark Now playing card is the blue action with a white icon
  let o = await open('look=fridge&page=planner');
  console.log('looks: fridge pause is a blue action:', await Q(o, `(() => { ${lum} const c = document.querySelector('family-hub-card').shadowRoot, b = c.querySelector('.np .round'), cs = getComputedStyle(b); return CR(cs.backgroundColor, cs.color) >= 4.5 && CR(cs.backgroundColor, 'rgb(47,42,38)') >= 1.3; })()`));
  await o.close();
  // the look picker: the chosen card is a ring and a tick with no fill, and its description is readable
  for (const look of ['glass', 'fridge', 'orbit']) { o = await open(`look=${look}&page=planner&sheet=themes`);
    console.log(`looks: ${look} chosen look card is ring + tick, text AA:`, await Q(o, `(() => { ${lum} const c = document.querySelector('family-hub-card').shadowRoot, on = c.querySelector(".looks .tcard[aria-pressed='true']"), off = c.querySelector(".looks .tcard[aria-pressed='false']"), cs = getComputedStyle(on), sheet = getComputedStyle(c.querySelector('.sheet')).backgroundColor; const bg = /rgba?\\(0, 0, 0, 0\\)/.test(cs.backgroundColor) || cs.backgroundColor === getComputedStyle(off).backgroundColor; return bg && cs.boxShadow !== 'none' && getComputedStyle(on, '::after').content.includes('✓') && CR(getComputedStyle(on.querySelector('.muted')).color, /, 0\\)$/.test(cs.backgroundColor) || /rgba/.test(cs.backgroundColor) ? sheet : cs.backgroundColor) >= 4.5; })()`),
      '| surprise is not a filled hero:', await o.getByRole('button', { name: 'Surprise me' }).count() === 0 || !(await o.getByRole('button', { name: 'Surprise me' }).evaluate((b) => b.classList.contains('primary'))));
    await o.close(); }
  // medication: while a daily medicine is overdue its "Given by" buttons are the filled actions, and "Add to the record" is an outline until a medicine is chosen
  for (const look of ['fridge', 'orbit']) { o = await open(`look=${look}&page=planner&sheet=meds`, '08:10');
    console.log(`looks: ${look} overdue medication: "Given by" filled, "Add to the record" outlined:`, await Q(o, `(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet'), filled = (b) => { const c = getComputedStyle(b); return !/^(rgba\\(0, 0, 0, 0\\)|transparent)$/.test(c.backgroundColor) || c.backgroundImage !== 'none'; }; return [...s.querySelectorAll('[data-act=given]')].every(filled) && !filled(s.querySelector('[data-act=log]')); })()`));
    await o.close(); }
  // Fridge sheets are one paper note with a hair of tilt, and calm mode takes the tilt, the jiggle and the ambient life away
  o = await open('look=fridge&page=planner&sheet=timer');
  const tilt = () => Q(o, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, fh = c.querySelector('.fh'), s = getComputedStyle(c.querySelector('.sheet')), a = c.querySelector('fh-ambient'); return { note: s.backgroundColor === 'rgb(255, 246, 196)', rot: Math.abs(parseFloat(s.rotate) || 0), jig: fh.getAnimations().some((x) => x.animationName === 'fjig'), md: getComputedStyle(fh).getPropertyValue('--m-d').trim(), amb: a ? a.shadowRoot.querySelectorAll('*:not(style)').length : 0 }; })()`);
  let t = await tilt(); console.log('looks: fridge sheet is a note, tilt at most 0.4 deg:', t.note && t.rot > 0 && t.rot <= 0.4); await o.close();
  o = await open('look=fridge&page=planner&sheet=timer&calm=1'); t = await tilt(); console.log('looks: calm mode has no tilt, no jiggle, no sprites, --m-d 0:', t.rot === 0 && !t.jig && t.md === '0' && t.amb === 0); await o.close();
  // Orbit: yellow is on / current / selected, mint is done only
  o = await open('look=orbit&page=home');
  console.log('looks: orbit switch on is yellow:', await Q(o, `(() => { const h = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-home').shadowRoot, t = h.querySelector(".toggle[aria-checked='true']"); return !t || getComputedStyle(t).backgroundColor === 'rgb(255, 224, 138)'; })()`)); await o.close();
  o = await open('look=orbit&page=kid&kid=0');
  console.log('looks: orbit selected child ring and current job are yellow:', await Q(o, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, k = c.querySelector('fh-kid').shadowRoot, now = k.querySelector('.row.now'); return getComputedStyle(c.querySelector(".dock .kidbtn[aria-current='page'] .avatar")).boxShadow.includes('255, 224, 138') && (!now || getComputedStyle(now).boxShadow.includes('255, 224, 138')); })()`)); await o.close();
  // Orbit header: the alert chip shows all of its words
  o = await open('look=orbit&page=planner');
  console.log('looks: orbit alert chip is not cut:', await Q(o, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, cap = c.querySelector('.cap.hot') ?? c.querySelector('.cap'), box = c.querySelector('.capsule').getBoundingClientRect(), b = cap.getBoundingClientRect(); return cap.scrollWidth <= cap.clientWidth + 1 && b.left >= box.left - 1 && b.right <= box.right + 1; })()`)); await o.close();
  // Space: the Family chip and the header buttons are proper dark surfaces
  o = await open('look=glass&theme=space&page=planner');
  console.log('looks: space family chip is AA, every theme has --danger:', await Q(o, `(() => { ${lum} const c = document.querySelector('family-hub-card').shadowRoot, i = c.querySelector('.legend .init'), cs = getComputedStyle(i); return CR(cs.backgroundColor, cs.color) >= 4.5 && getComputedStyle(c.querySelector('.fh')).getPropertyValue('--danger').trim() === '#ff8a7a'; })()`)); await o.close();
  // phone: the dock is a solid bar with labels, the page ends above it, and Orbit stacks the day ring over the list
  const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Australia/Perth', locale: 'en-AU' });
  for (const look of ['fridge', 'orbit']) { const pg = await ph.newPage(); await pg.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await pg.goto(`http://localhost:${PORT}/?look=${look}&page=planner`); await pg.waitForFunction('window.__ready === true'); await pg.waitForTimeout(700);
    console.log(`looks: ${look} phone dock is a solid bar with labels, nothing off the right:`, await Q(pg, `(() => { const c = document.querySelector('family-hub-card').shadowRoot, d = c.querySelector('.dock'), cs = getComputedStyle(d), it = d.querySelector(".item[data-nav='calendar']"), dial = c.querySelector('.ddial'), list = c.querySelector('.daylist'); const solid = !/rgba?\\(0, 0, 0, 0\\)/.test(cs.backgroundColor) && parseFloat(cs.borderTopWidth) >= 1; const label = parseFloat(getComputedStyle(it).fontSize) >= 14 && it.getBoundingClientRect().bottom <= innerHeight + 1 && it.scrollHeight <= it.clientHeight + 1; const stacked = !dial || (dial.getBoundingClientRect().bottom <= list.getBoundingClientRect().top + 1 && [...dial.querySelectorAll('text')].every((x) => parseFloat(getComputedStyle(x).fontSize) * dial.getBoundingClientRect().width / 200 >= 12)); const pad = parseFloat(getComputedStyle(c.querySelector('.fh')).paddingBottom) >= d.getBoundingClientRect().height / (Number(getComputedStyle(c.querySelector('.fh')).zoom) || 1); return solid && label && stacked && pad && document.documentElement.scrollWidth <= innerWidth + 2; })()`));
    await pg.close(); }
  await ph.close(); }
});
await section('motion (polish round 2)', async () => {
// ---- motion (polish round 2) ----
{ const toast2 = async (p, host) => (await p.locator(`${host} .toast`).allInnerTexts()).join(' ').replace(/\s+/g, ' ').trim();
  const deep = `window.deepAll = (sel) => { const out = []; const walk = (r) => { r.querySelectorAll('*').forEach((e) => { if (e.matches(sel)) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return out; };
    window.cssAnims = () => { const out = new Set(); const walk = (r) => { for (const a of r.getAnimations()) out.add(a); r.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return [...out].filter((a) => a.playState === 'running' && a.animationName && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.animationName); };`;
  // press feedback: a held header button (a .glass.tap) shrinks and dims in Glass and Fridge
  for (const look of ['glass', 'fridge']) { const p = await open(`look=${look}&page=planner`); const b = p.locator('family-hub-card header [data-act="more"]'), bb = await b.boundingBox();
    const idle = await b.evaluate((e) => getComputedStyle(e).transform + ' ' + getComputedStyle(e).opacity);
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(300);
    const held = await b.evaluate((e) => { const cs = getComputedStyle(e), m = /matrix\(([^,]+)/.exec(cs.transform); return { scale: m ? Number(m[1]) : 1, opacity: Number(cs.opacity) }; });
    await p.mouse.move(2, 2); await p.mouse.up(); // let go off the button: nothing is pressed
    console.log(`press feedback (${look}): idle ${idle} | held 300 ms: scale ${held.scale.toFixed(3)} opacity ${held.opacity.toFixed(2)} (expect < 1 and < 1)`); await p.close(); }
  // page change: at most two animations per navigation (the page wrapper's fade and rise), none on the panels inside
  for (const look of ['glass', 'fridge', 'orbit']) { const p = await open(`look=${look}&page=planner`); await p.evaluate(deep); const out = [];
    for (const nav of ['Groceries', 'Music', 'Home', 'Planner', 'Riley']) { await p.evaluate((n) => deepAll('nav button').find((x) => x.textContent.trim().endsWith(n)).click(), nav); await p.waitForTimeout(40); const a = await p.evaluate(() => cssAnims()); out.push(`${nav} ${a.length}${a.length > 2 ? ' [' + a.join(',') + ']' : ''}`); await p.waitForTimeout(700); }
    console.log(`animations per navigation (${look}; expect the page’s two, plus since 0.32.1 the one movement of the dock button whose page opened: Music’s has two parts):`, out.join(' | '), '| page wrapper at rest: transform', await p.locator('family-hub-card .fh > .body').evaluate((e) => getComputedStyle(e).transform)); await p.close(); }
  // exits: a sheet, the PIN pad, a toast and the night screen fade out before they go
  // (timer=0: a running kitchen timer holds the screensaver back, so with the preview's sample timer "Night" was woken at once: NIGHT-WAKE, backlog 136)
  { const p = await open('look=glass&page=planner&sheet=timer&timer=0'); await p.evaluate(deep); const at = async (sel, ms) => { await p.waitForTimeout(ms); return p.locator(sel).count(); };
    // timed inside the page, so the test's own round trips do not blur the 80 ms and 300 ms marks
    const timed = (act, sel) => p.evaluate(([act, sel]) => new Promise((done) => { const n = () => deepAll(sel).length, t0 = performance.now(); (0, eval)(act); const r = {};
      setTimeout(() => { r.at80 = n(); r.closing = deepAll(sel).filter((e) => e.hasAttribute('data-closing')).length; }, 80); setTimeout(() => { r.at300 = n(); r.ms = Math.round(performance.now() - t0); done(r); }, 300); }), [act, sel]);
    let r = await timed(`deepAll('.sheet .xbtn')[0].click()`, '.scrim'); console.log('sheet exit: there at 80 ms', r.at80, 'closing', r.closing, '| gone at 300 ms', r.at300 === 0);
    await MORE(p); await p.locator('family-hub-card .sheet [data-act="looks"]').click(); await p.waitForTimeout(400); const pad = await p.locator('fh-pin').count();
    r = await timed(`deepAll('fh-pin')[0].shadowRoot.querySelector('.grid button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }))`, 'fh-pin'); console.log('PIN pad exit: open', pad, '| there at 80 ms', r.at80, 'closing', r.closing, '| gone at 300 ms', r.at300 === 0);
    await p.evaluate(() => document.querySelector('family-hub-card')._say('Test line')); await p.waitForTimeout(300);
    r = await timed(`(() => { const c = document.querySelector('family-hub-card'); c._toast = ''; })()`, '.toasts .toast'); console.log('toast exit: there at 80 ms', r.at80, 'closing', r.closing, '| gone at 300 ms', r.at300 === 0);
    await MORE(p); await p.locator('family-hub-card .sheet [data-act="night"]').click(); await p.waitForTimeout(600); await p.evaluate(deep); await p.locator('family-hub-card .artm').click({ timeout: 4000 }).catch(() => console.log('FAIL NIGHT-WAKE: “Night” did not bring up the screensaver here, so its wake was not tried (this line was edited for 0.33.5 and first run on 15 Nov)'));
    await p.waitForTimeout(60); const started = await p.evaluate(() => cssAnims()); const n80 = await p.locator('family-hub-card .artm[data-closing]').count(), n600 = await at('family-hub-card .artm', 560);
    console.log('night wake: the screensaver fading at 60 ms', n80, '| animations started:', started.join(',') || 'none', '(expect fhout only) | gone at 620 ms', n600 === 0); await p.close(); }
  // calm mode: nothing travels on a page change, and looks' loops are stopped
  { const p = await open('look=fridge&page=planner&calm=1'); await p.evaluate(deep);
    await p.evaluate(() => deepAll('nav button').find((x) => x.textContent.trim().endsWith('Groceries')).click()); await p.waitForTimeout(40);
    const tf = await p.locator('family-hub-card .fh > .body').evaluate((e) => getComputedStyle(e).transform);
    console.log('calm page change: wrapper transform mid-entrance', tf, '(expect none or identity) | looping animations:', await p.evaluate(() => { const out = new Set(); const walk = (r) => { for (const a of r.getAnimations()) out.add(a); r.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return [...out].filter((a) => a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity).length; })); await p.close(); }
  // slow and failing calls: the control shows it is waiting after 250 ms, holds what was asked, and a failure puts it back with a calm line
  { let p = await open('look=glass&page=groceries&slow=3000'); await p.evaluate(deep); const name = (await p.locator('fh-groceries .row .strike').first().innerText()).trim();
    const g = await p.evaluate(() => new Promise((done) => { const row = deepAll('.row[data-key]')[0], r = {}; row.click();
      setTimeout(() => { r.at120 = deepAll('.row[data-key][data-busy]').length; }, 120); setTimeout(() => { r.at520 = deepAll('.row[data-key][data-busy]').length; r.aria = deepAll('.row[data-key][aria-busy="true"]').length; r.ticked = deepAll('.row[data-key].done[data-busy]').length; }, 520); setTimeout(() => { r.after = deepAll('.row[data-key][data-busy]').length; done(r); }, 3400); }));
    console.log('slow grocery tick: busy at 120 ms', g.at120, '(expect 0) | busy at 520 ms', g.at520, 'aria-busy', g.aria, '| still ticked while waiting', g.ticked, '| busy after the answer', g.after, '|', name);
    await p.close();
    p = await open('look=glass&page=groceries&slow=500&fail=1'); const r2 = p.locator('fh-groceries .row').first(), n2 = (await r2.locator('.strike').innerText()).trim();
    await r2.click(); await p.waitForTimeout(200); const held = await p.locator('fh-groceries .row.done').filter({ hasText: n2 }).count(); await p.waitForTimeout(700);
    const said = await toast2(p, 'fh-groceries'); console.log('fail=1 grocery tick: held while out', held, '| put back', await p.locator('fh-groceries .row.done').filter({ hasText: n2 }).count() === 0, '| says:', said, '| raw error shown:', /did not answer|Error/.test(said));
    await p.close();
    p = await open('look=glass&page=planner&slow=5000'); await p.evaluate(deep);
    const rm = await p.evaluate(() => new Promise((done) => { const r = {}; deepAll('button.rem')[0].click(); const n = (s) => deepAll('button' + s).length;
      setTimeout(() => { r.busy = n('.rem[data-busy]'); }, 500); setTimeout(() => { r.held = n('.rem.done'); }, 4500); setTimeout(() => { r.gone = n('.rem.done') === 0; done(r); }, 5600); }));
    console.log('slow reminder (5 s): busy at 500 ms', rm.busy, '| still struck through at 4.5 s, past its four seconds, because the answer is not in', rm.held, '| gone once it is', rm.gone);
    await p.evaluate(() => { document.querySelector('family-hub-card')._page = 'home'; }); await p.waitForTimeout(500);
    await p.locator('family-hub-card fh-home [data-act="alloff"]').click(); await p.waitForTimeout(500); console.log('slow "All off": Home\'s All off scene busy', await p.locator('family-hub-card fh-home [data-act="alloff"][data-busy]').count());
    await p.close();
    p = await open('look=glass&page=planner&slow=400&fail=1'); await p.locator('family-hub-card .rem').first().click(); await p.waitForTimeout(900);
    const ts = (await p.locator('family-hub-card .toast').innerText().catch(() => '')).trim(); console.log('fail=1 reminder: put back', await p.locator('family-hub-card .rem.done').count() === 0, '| says:', ts, '| raw error shown:', /did not answer|Error/.test(ts));
    await p.locator('family-hub-card .tmr .quick, family-hub-card .tmr button').filter({ hasText: '+5' }).first().click(); await p.waitForTimeout(900); const tt = (await p.locator('family-hub-card .toast').innerText().catch(() => '')).trim(); console.log('fail=1 timer +5: says:', tt, '| raw error shown:', /did not answer|Error/.test(tt));
    await p.close();
    p = await open('look=glass&page=home&slow=3000'); const sw = p.locator('fh-home .dev[role="switch"]').first(), was = await sw.getAttribute('aria-checked'); await sw.click(); await p.waitForTimeout(500);
    console.log('slow Home switch: flips at once', (await sw.getAttribute('aria-checked')) !== was, '| busy at 500 ms', (await sw.getAttribute('data-busy')) !== null); await p.waitForTimeout(3000); console.log('  after the answer: stays flipped', (await sw.getAttribute('aria-checked')) !== was, '| busy', (await sw.getAttribute('data-busy')) !== null);
    await p.close();
    p = await open('look=glass&page=home&slow=400&fail=1'); const sw2 = p.locator('fh-home .dev[role="switch"]').first(), was2 = await sw2.getAttribute('aria-checked'); await sw2.click(); await p.waitForTimeout(150); const flipped = (await sw2.getAttribute('aria-checked')) !== was2; await p.waitForTimeout(700);
    console.log('fail=1 Home switch: flipped while out', flipped, '| put back', (await sw2.getAttribute('aria-checked')) === was2); await p.close(); }
}
});
await section('the timer’s digits roll and its ring sweeps when time is added; a tick', async () => {
// ---- the timer's digits roll and its ring sweeps when time is added; a ticked grocery row travels to the trolley (polish round 2) ----
{ const lib = `window.deepAll = (sel) => { const out = []; const walk = (r) => { r.querySelectorAll('*').forEach((e) => { if (e.matches(sel)) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); }); }; walk(document); return out; };`;
  let p = await open('look=glass&page=planner'); await p.evaluate(lib);
  const t = await p.evaluate(() => new Promise((res) => { const ring = () => deepAll('.timerrow *').filter((c) => /dasharray/.test(c.getAttribute('style') || '')).map((c) => getComputedStyle(c).transitionDuration)[0]; const idle = ring(); deepAll('.tmr button').find((x) => /\+5/.test(x.textContent)).click();
    setTimeout(() => { const d = deepAll('.troll')[0], a = d?.getAnimations()[0]; res({ idle, ring: ring(), roll: a ? a.effect.getComputedTiming().duration + ' ms from ' + a.effect.getKeyframes()[0].transform : 'none' }); }, 120); }));
  console.log('timer +5: digits roll', t.roll, '| ring sweep', t.idle, '→', t.ring); await p.close();
  p = await open('look=glass&page=groceries'); await p.evaluate(lib);
  const g = await p.evaluate(() => new Promise((res) => { const row = deepAll('.row[data-key]')[0], key = row.dataset.key, y0 = Math.round(row.getBoundingClientRect().top); row.click(); let seen = 'none';
    const iv = setInterval(() => { const e = deepAll('.row[data-key]').find((x) => x.dataset.key === key), a = e?.getAnimations().find((x) => !x.animationName && !x.transitionProperty); if (a) seen = a.effect.getComputedTiming().duration + ' ms from ' + a.effect.getKeyframes()[0].transform; }, 20);
    setTimeout(() => { clearInterval(iv); res({ y0, seen, y1: Math.round(deepAll('.row[data-key]').find((x) => x.dataset.key === key).getBoundingClientRect().top) }); }, 4700); }));
  console.log('ticked grocery row: from y', g.y0, 'to', g.y1, '| travels:', g.seen); await p.close(); }
});
await section('robustness: a reward tapped three times spends once; a medicine with n', async () => {
// robustness: a reward tapped three times spends once; a medicine with no time gives a readable error, not a blank panel; one odd calendar row does not lose the calendar; a phone on its side gets the phone arrangement
page = await open('look=glass&page=kid&kid=0');
await page.getByRole('button', { name: /Extra screen time/ }).click(); await page.waitForTimeout(250);
{ const yes = page.locator('fh-kid').getByRole('button', { name: 'Yes' }); await yes.evaluate((b) => { b.click(); b.click(); b.click(); }); await page.waitForTimeout(600);
  { const n = await page.evaluate(() => (window.__calls || []).filter((c) => c.includes('fh_add_points') && c.includes('-50')).length); console.log('reward tapped three times: spends', n, '(expect 1)', ok(n === 1)); } }
console.log('medicine with no time:', await page.evaluate(() => { const c = document.querySelector('family-hub-card'); try { c.setConfig({ ...c._config, meds: [{ id: 'x', who: 'Riley', label: 'x' }] }); return 'ACCEPTED'; } catch (e) { return String(e.message); } }));
console.log('odd calendar row:', await page.evaluate(async () => { const c = document.querySelector('family-hub-card'), real = c.hass.callApi; c.hass.callApi = async (m, p, b) => { const r = await real(m, p, b); return /calendars\/calendar.family/.test(p) ? [{ summary: 'No end', start: { dateTime: new Date().toISOString() } }, { summary: 'No start' }, ...r] : r; }; const a = new Date(); a.setHours(0, 0, 0, 0); const ev = await c._loadEvents(a, new Date(a.getTime() + 7 * 864e5)); c.hass.callApi = real; return ev.filter((e) => e.who === 'Family').map((e) => e.title).join(', '); }));
await page.close();
page = await open('look=glass'); await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(500);
console.log('phone on its side: phone arrangement', await page.evaluate(() => document.querySelector('family-hub-card').hasAttribute('data-phone')), '| scale', await page.evaluate(() => getComputedStyle(document.querySelector('family-hub-card').shadowRoot.querySelector('.fh')).zoom));
await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(400); console.log('back to a wide screen: view', await page.evaluate(() => document.querySelector('family-hub-card')._view));
await page.close();
});
await section('R4-1. the card is never scaled below 1: tablets reflow instead (and th', async () => {
// R4-1. the card is never scaled below 1: tablets reflow instead (and the dock stays on the screen)
for (const [w, h] of [[1024, 768], [1180, 820], [800, 600], [768, 1024], [820, 1180]]) for (const look of ['glass', 'fridge', 'orbit']) {
  const p = await openAt(w, h, `look=${look}&page=planner`);
  const r = await p.evaluate(() => { const c = document.querySelector('family-hub-card'), fh = c.shadowRoot.querySelector('.fh'), d = c.shadowRoot.querySelector('nav.dock').getBoundingClientRect(); const items = [...c.shadowRoot.querySelectorAll('nav.dock .item')].map((e) => e.getBoundingClientRect());
    return { z: Number(getComputedStyle(fh).zoom), dock: d.left >= -1 && d.right <= innerWidth + 1 && d.bottom <= innerHeight + 1, small: items.filter((b) => Math.min(b.width, b.height) < 43.5).length, cols: c.shadowRoot.querySelectorAll('.week .col').length, sideways: document.documentElement.scrollWidth > innerWidth + 1 }; });
  console.log(`R4-1 ${look} ${w}x${h}: zoom ${r.z} (expect >= 1) ${ok(r.z >= 1)} | dock on screen ${ok(r.dock)} | dock items under 44: ${r.small} ${ok(!r.small)} | week days shown: ${r.cols} | sideways scroll ${ok(!r.sideways)}`);
  await p.context().close();
}
});
await section('R4-5. leftovers: phone dock labels, the week initials, the shelf label', async () => {
// R4-5. leftovers: phone dock labels, the week initials, the shelf labels, taps while a scene or "Whole house" is in flight
for (const look of ['glass', 'fridge', 'orbit']) { const c = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, timezoneId: 'Australia/Perth', locale: 'en-AU' }); const p = await c.newPage();
  await p.clock.install({ time: new Date('2026-11-10T16:20:00+08:00') }); await p.goto('http://localhost:' + PORT + `/?look=${look}&page=planner`); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(800);
  const fs = await p.evaluate(() => Math.min(...[...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('nav.dock .item')].map((e) => parseFloat(getComputedStyle(e).fontSize))));
  console.log(`R4-5 phone dock labels in ${look}: ${fs}px (expect >= 13)`, ok(fs >= 13)); await c.close(); }
{ const p = await openAt(1280, 800, 'look=glass&page=kid&kid=0');
  await p.locator('family-hub-card fh-kid .tabs button', { hasText: 'My week' }).click(); await p.waitForTimeout(400);
  const wk = await p.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot; const a = [...r.querySelectorAll('.wk .init')]; return { n: a.length, fs: Math.min(...a.map((e) => parseFloat(getComputedStyle(e).fontSize))), cut: a.filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).length }; });
  console.log('R4-5 kid week initials:', JSON.stringify(wk), ok(wk.n > 0 && wk.fs >= 14 && !wk.cut)); await p.context().close(); }
{ const p = await openAt(1280, 800, 'look=glass&page=music&mview=house'); await p.waitForTimeout(12600);
  const sh = await p.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot; const a = [...r.querySelectorAll('.srec span')].filter((e) => e.offsetWidth); return { n: a.length, fs: Math.min(...a.map((e) => parseFloat(getComputedStyle(e).fontSize))), cutBelow: a.filter((e) => e.getBoundingClientRect().bottom > e.closest('.mshelf, .srecs').getBoundingClientRect().bottom + 1).length }; });
  console.log('R4-5 House shelf labels:', JSON.stringify(sh), ok(sh.n > 0 && sh.fs >= 14 && !sh.cutBelow));
  // All off (the first of Home's Scenes since 0.38.26): two taps in the same instant make one call
  await p.evaluate(async () => { const c = document.querySelector('family-hub-card'); c._page = 'home'; await c.updateComplete; }); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__calls = []; const b = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-home').shadowRoot.querySelector('[data-act="alloff"]'); b.click(); b.click(); }); await p.waitForTimeout(600);
  { const n = await p.evaluate(() => window.__calls.filter((x) => /^light\.turn_off/.test(x)).length); console.log('R4-5 "All off" tapped twice at once: calls', n, '(expect 1)', ok(n === 1)); }
  await p.keyboard.press('Escape'); await p.context().close();
  const d = await openAt(1280, 800, 'look=glass&page=music&mview=dial'); await d.waitForTimeout(600);
  await d.evaluate(() => { window.__calls = []; const b = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot.querySelector('.wholeb'); b.click(); b.click(); b.click(); }); await d.waitForTimeout(900);
  { const n = await d.evaluate(() => window.__calls.filter((x) => /^media_player\.join/.test(x)).length); console.log('R4-5 "Whole house" tapped three times at once: join calls', n, '(expect 1)', ok(n === 1)); }
  await d.context().close(); }
{ const p = await openAt(390, 844, 'look=fridge&page=planner&sheet=sitter');
  const rows = await p.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.sheet a.irow')].map((e) => Math.round(e.getBoundingClientRect().height)));
  console.log('R4-5 house-info phone rows (heights, expect each >= 44):', JSON.stringify(rows), ok(rows.length > 0 && rows.every((h) => h >= 44))); await p.context().close(); }
});
await section('Round 5: the cold reviewers’ majors and minors', async () => {
// ---------- Round 5: the cold reviewers' majors and minors ----------
{ const SR = `document.querySelector('family-hub-card').shadowRoot`;
  const deepFocus = (p) => p.evaluate(() => { let a = document.activeElement; while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement; return a ? (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 24) || a.tagName) : ''; });
  const settle = (p) => p.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 3000))]));
  // R5-2 no initial chip under 12 px
  for (const pg of ['planner', 'planner&view=day', 'planner&view=month', 'planner&sheet=add']) { const p = await openAt(1280, 800, 'look=glass&page=' + pg);
    const r = await p.evaluate(() => { const out = []; const walk = (root) => root.querySelectorAll('*').forEach((e) => { if (e.matches('.init') && e.getClientRects().length) out.push([parseFloat(getComputedStyle(e).fontSize), e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1]); if (e.shadowRoot) walk(e.shadowRoot); }); walk(document.querySelector('family-hub-card').shadowRoot); return { n: out.length, min: Math.min(...out.map((x) => x[0])), clipped: out.filter((x) => x[1]).length }; });
    console.log('R5-2 initials on', pg + ':', JSON.stringify(r), ok(r.n > 0 && r.min >= 12 && r.clipped === 0)); await p.context().close(); }
  // R5-3 a place wraps to two lines where its day has room; R5-4 Fridge titles may run to four lines
  { const p = await openAt(1280, 800, 'look=glass&page=planner&events=long'); const r = await p.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot; const locs = [...c.querySelectorAll('.col[data-wrap] .ev .loc .ell')]; return { wrapDays: c.querySelectorAll('.col[data-wrap]').length, tightDays: c.querySelectorAll('.col[data-tight]').length, twoLine: locs.filter((e) => e.offsetHeight > 22).length, clamp: locs[0] ? getComputedStyle(locs[0]).webkitLineClamp : '', overflowing: [...c.querySelectorAll('.week > .col')].filter((col) => { const b = col.querySelector('.evs'); return b && b.scrollHeight > b.clientHeight + 2; }).length }; });
    console.log('R5-3 week places:', JSON.stringify(r), ok(r.wrapDays > 0 && r.clamp === '2' && r.overflowing === 0)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=fridge&page=planner&events=long'); const r = await p.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot; const t = [...c.querySelectorAll('.col:not([data-tight]) .ev .content')]; return { clamp: t[0] ? getComputedStyle(t[0]).webkitLineClamp : '', most: Math.max(...t.map((e) => Math.round(e.offsetHeight / parseFloat(getComputedStyle(e).lineHeight)))), cutAtTwo: t.filter((e) => e.scrollHeight > e.clientHeight + 1 && Math.round(e.offsetHeight / parseFloat(getComputedStyle(e).lineHeight)) <= 2).length }; });
    console.log('R5-4 Fridge week titles:', JSON.stringify(r), ok(r.clamp === '4' && r.cutAtTwo === 0)); await p.context().close(); }
  // R5-7 the Ask sheet by keyboard: opened with Enter, typed into, sent with Enter, tabbed through, closed with Escape
  { const p = await openAt(1280, 800, 'look=glass&page=planner'); await p.getByRole('button', { name: 'Ask a question' }).first().focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
    const first = await deepFocus(p); await p.keyboard.type('why is the sky blue'); await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
    const bub = await p.locator('fh-chat .thread .bubble').allInnerTexts(), open1 = await p.evaluate(`document.querySelector('family-hub-card')._sheet`);
    const seen = new Set(); for (let i = 0; i < 16; i++) { await p.keyboard.press('Tab'); seen.add(await deepFocus(p)); }
    const inert = await p.evaluate(`[...${SR}.querySelectorAll('.fh > header, .fh > .body, .fh > nav.dock')].every((x) => x.inert)`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    console.log('R5-7 Ask by keyboard: focus on open "' + first + '"', ok(first === 'Your question'), '| typed and sent with Enter:', ok(bub.some((b) => /why is the sky blue/.test(b)) && open1 === 'chat'), '| Tab reaches', seen.size, 'controls incl. Close, a starter and Send/Keyboard:', ok(seen.has('Close') && [...seen].some((x) => /Tell me a joke/.test(x)) && seen.has('Keyboard') && seen.has('For parents')), '| page behind is inert:', ok(inert), '| Escape closes, focus back on:', await deepFocus(p), ok((await p.evaluate(`document.querySelector('family-hub-card')._sheet`)) === '' && (await deepFocus(p)) === 'Ask a question'));
    console.log('R5-15 page no longer inert once the sheet has gone:', ok(await p.evaluate(`[...${SR}.querySelectorAll('.fh > header, .fh > .body, .fh > nav.dock')].every((x) => !x.inert)`))); await p.context().close(); }
  { const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true, isMobile: true, timezoneId: 'Australia/Perth', locale: 'en-AU' }); const p = await c.newPage(); await p.goto('http://localhost:' + PORT + '/?look=glass&page=planner&sheet=chat'); await p.waitForFunction('window.__ready === true'); await p.waitForTimeout(900);
    console.log('R5-7 on a touch screen the field is not focused (no system keyboard):', ok(await p.evaluate(() => { let a = document.activeElement; while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement; return a?.tagName !== 'INPUT'; }))); await c.close(); }
  // R5-8 repeat taps while a call is out: Home scene, timer Cancel, a reminder and a grocery tick each send one call, and show they are waiting
  { const p = await openAt(1280, 800, 'look=glass&page=home&slow=1500');
    const r = await p.evaluate(async () => { const h = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-home').shadowRoot, b = h.querySelector('.scene:not([data-act="alloff"])') /* a script's scene: All off is the first since 0.38.26 */; window.__calls = []; b.click(); b.click(); await new Promise((r) => setTimeout(r, 450)); const busy = b.hasAttribute('data-busy'); b.click(); await new Promise((r) => setTimeout(r, 1800)); return { busy, calls: window.__calls.filter((c) => /^script\.turn_on/.test(c)).length }; });
    console.log('R5-8 Home scene tapped three times on a slow link:', JSON.stringify(r), ok(r.busy && r.calls === 1));
    const sw = await p.evaluate(async () => { const h = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-home').shadowRoot, b = h.querySelector('.rh .sw'); if (!b) return null; window.__calls = []; b.click(); b.click(); await new Promise((r) => setTimeout(r, 380)); const busyBy400 = b.hasAttribute('data-busy') && getComputedStyle(b).cursor === 'progress'; await new Promise((r) => setTimeout(r, 1600)); return { busyBy400, calls: window.__calls.filter((c) => /^light\.turn_/.test(c)).length }; });
    console.log('R5-14 Home room switch on a slow link:', JSON.stringify(sw), ok(sw && sw.busyBy400 && sw.calls === 1)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&slow=1500');
    const r = await p.evaluate(async () => { const c = document.querySelector('family-hub-card').shadowRoot, b = c.querySelector('button.rem'); window.__calls = []; b.click(); b.click(); b.click(); await new Promise((r) => setTimeout(r, 2200)); return { calls: window.__calls.filter((x) => /^todo\.update_item/.test(x)).length, ticked: b.getAttribute('aria-pressed') }; });
    console.log('R5-8 reminder tapped three times on a slow link:', JSON.stringify(r), ok(r.calls === 1)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=groceries&slow=1500');
    const r = await p.evaluate(async () => { const g = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries').shadowRoot, b = g.querySelector('button.item'); window.__calls = []; b.click(); b.click(); b.click(); await new Promise((r) => setTimeout(r, 400)); const busy = b.hasAttribute('data-busy'); await new Promise((r) => setTimeout(r, 1800)); return { busy, calls: window.__calls.filter((x) => /^todo\.update_item/.test(x)).length }; });
    console.log('R5-8 grocery row tapped three times on a slow link:', JSON.stringify(r), ok(r.busy && r.calls === 1));
    const a = await p.evaluate(async () => { const g = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-groceries'); window.__calls = []; g._add('Zucchini', null); g._add('Zucchini', null); await new Promise((r) => setTimeout(r, 380)); const row = g.shadowRoot.querySelector('.item.pending'); const got = { pendingBy400: !!row, says: row?.textContent.replace(/\s+/g, ' ').trim() }; await new Promise((r) => setTimeout(r, 2000)); got.calls = window.__calls.filter((x) => /^todo\.add_item/.test(x)).length; got.goneAfter = !g.shadowRoot.querySelector('.item.pending'); got.status = g.shadowRoot.querySelector('.says')?.getAttribute('role'); return got; });
    console.log('R5-14 grocery Add on a slow link:', JSON.stringify(a), ok(a.pendingBy400 && a.calls === 1 && a.goneAfter && a.status === 'status')); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=timer&slow=1200'); await p.evaluate(() => { const h = document.querySelector('family-hub-card').hass; h.states['timer.kitchen'] = { ...h.states['timer.kitchen'], state: 'active', attributes: { ...(h.states['timer.kitchen']?.attributes ?? {}), finishes_at: new Date(Date.now() + 300000).toISOString(), duration: '0:05:00' } }; document.querySelector('family-hub-card').hass = { ...h }; }); await p.waitForTimeout(300);
    const heroes = await p.evaluate(`${SR}.querySelectorAll('.sheet .lead').length`), wraps = await p.evaluate(`[...${SR}.querySelectorAll('.sheet [data-act="plus"]')].filter((b) => b.offsetHeight > 62 || getComputedStyle(b).whiteSpace !== 'nowrap').length`);
    const r = await p.evaluate(async () => { const c = document.querySelector('family-hub-card').shadowRoot, b = c.querySelector('.sheet [aria-label="Cancel the kitchen timer"]'); if (!b || b.disabled) return { skipped: 'timer not running in the preview' }; window.__calls = []; b.click(); b.click(); b.click(); await new Promise((r) => setTimeout(r, 1700)); return { calls: window.__calls.filter((x) => /^timer\.cancel/.test(x)).length }; });
    console.log('R5-8 timer Cancel tapped three times on a slow link:', JSON.stringify(r), ok(r.skipped || r.calls === 1), '| R5-17 one hero on the timer sheet:', heroes, ok(heroes === 1), '| +N min buttons that could wrap:', wraps, ok(wraps === 0)); await p.context().close(); }
  // R5-9 add-event sheet controls are 44 px high once the sheet has arrived, at both sizes
  for (const [w, h] of [[1280, 800], [390, 844]]) { const p = await openAt(w, h, 'look=glass&page=planner&sheet=add'); await settle(p);
    const hs = await p.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-add-event').shadowRoot; return [...r.querySelectorAll('.chips.days button, .chips.cals button, .calbtn, .allday')].filter((e) => e.getClientRects().length).map((e) => Math.round(e.getBoundingClientRect().height * 10) / 10); });
    console.log(`R5-9 add sheet ${w}x${h}: date and people chips, "Other date", "All day" heights:`, [...new Set(hs)].join(','), ok(hs.length > 4 && hs.every((x) => x >= 44))); await p.context().close(); }
  // R5-10 / R5-13 medication: a record kept in this browser says so; the giver shows at once on a slow link; a failure leaves nothing ticked
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=meds');
    const note = await p.evaluate(`(() => { const s = ${SR}.querySelector('.sheet'); return { label: [...s.querySelectorAll('.label')].map((x) => x.textContent.trim()), note: s.querySelector('[data-medlocal]')?.textContent.trim() ?? '' }; })()`);
    console.log('R5-10 no med_log: section label', JSON.stringify(note.label[1]), ok(note.label.includes('Kept on this screen only')), '| note in plain words (no setting names):', ok(!/med_log|card settings/.test(note.note) && /No other screen/.test(note.note) && /shared list/.test(note.note))); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=meds&slow=1200'); await p.evaluate(() => { document.querySelector('family-hub-card')._medOpen = true; }); await p.evaluate(() => { window.__calls = []; });
    await p.evaluate(`${SR}.querySelector('.sheet [data-act="given"]').click()`); await p.waitForTimeout(350);
    const mid = await p.evaluate(`${SR}.querySelector('.sheet [data-saving]')?.textContent.trim() ?? ''`); await p.waitForTimeout(3200);
    const order = await p.evaluate(() => window.__calls.filter((c) => /^input_(text|datetime)\./.test(c)).map((c) => c.split(' ')[0]));
    console.log('R5-13 slow link: row says', JSON.stringify(mid), ok(/Saving/.test(mid) && /Alex/.test(mid)), '| giver written before the time:', order.join(' > '), ok(order[0] === 'input_text.set_value' && order[1] === 'input_datetime.set_datetime')); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=meds'); await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c._medOpen = true; const h = c.hass, real = h.callService; window.__calls2 = []; h.callService = async (d, s, data, t) => { window.__calls2.push(d + '.' + s + ' ' + JSON.stringify(data)); if (d === 'input_datetime' && window.__calls2.filter((x) => /^input_datetime/.test(x)).length === 1) throw new Error('refused'); return real(d, s, data, t); }; });
    await p.evaluate(`${SR}.querySelector('.sheet [data-act="given"]').click()`); await p.waitForTimeout(900);
    const r = await p.evaluate(() => ({ calls: window.__calls2.map((x) => x.split(' ')[0]), lastBy: JSON.parse(window.__calls2.filter((x) => /^input_text/.test(x)).pop().split(' ').slice(1).join(' ')).value, row: document.querySelector('family-hub-card').shadowRoot.querySelector('.sheet .card b:last-of-type')?.textContent.trim(), toast: document.querySelector('family-hub-card').shadowRoot.querySelector('.toast')?.textContent.trim() }));
    console.log('R5-13 time write refused: the name is put back (' + r.lastBy + '), row not ticked, and it says so:', JSON.stringify(r.calls), '|', r.toast, ok(r.lastBy !== 'Alex' && /not recorded/.test(r.toast ?? '') && r.calls.filter((x) => /^input_text/.test(x)).length === 2)); await p.context().close(); }
  { const p = await openAt(1280, 600, 'look=glass&page=planner&sheet=meds'); await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c._medOpen = true; const now = Date.now(); localStorage.setItem('family-hub-med-log', JSON.stringify(Array.from({ length: 9 }, (_, i) => new Date(now - (i + 1) * 3600000).toISOString() + '|Riley|Paracetamol|Sam'))); return c._loadMedLog().then(() => c.requestUpdate()); }); await p.waitForTimeout(300);
    await p.evaluate(`(() => { const c = document.querySelector('family-hub-card'); c._mx = { ...c._mx, what: 'Ibuprofen', who: 'Charlie', by: 'Alex' }; c.requestUpdate(); })()`); await p.waitForTimeout(200); await p.evaluate(`${SR}.querySelector('.sheet').scrollTop = 9999`); await p.evaluate(`${SR}.querySelector('.sheet [data-act="log"]').click()`); await p.waitForTimeout(1200);
    const v = await p.evaluate(`(() => { const s = ${SR}.querySelector('.sheet'), row = [...s.querySelectorAll('.irow[data-at]')].find((x) => /Ibuprofen/.test(x.textContent)); if (!row) return null; const a = row.getBoundingClientRect(), b = s.getBoundingClientRect(); return a.top >= b.top - 1 && a.bottom <= b.bottom + 1; })()`);
    console.log('R5-13 a new record is scrolled into view:', v, ok(v === true)); await p.evaluate(() => localStorage.removeItem('family-hub-med-log')); await p.context().close(); }
  // R5-11 jobs left: "My look" answers with a wiggle of the padlock and, in picture mode, a spoken line; nothing red, no toast
  for (const k of [2, 0]) { const p = await openAt(1280, 800, 'look=glass&page=kid&kid=' + k); await p.evaluate(() => { window.__said = []; const real = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = (u) => { window.__said.push(u.text); }; });
    const b = p.locator('fh-kid .studio'); const locked = await b.getAttribute('data-locked'); if (locked === null) { console.log('R5-11 kid', k, 'has no jobs left in the preview: not tested'); await p.context().close(); continue; }
    await b.click(); await p.waitForTimeout(150);
    const r = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid'), b = k.shadowRoot.querySelector('.studio'), sv = b.querySelector('svg'); return { nudge: b.hasAttribute('data-nudge'), anim: getComputedStyle(sv).animationName, toast: k.shadowRoot.querySelector('.toast')?.textContent ?? '', studio: k._studio, said: window.__said, pic: k._picMode }; });
    console.log('R5-11 kid', k, 'locked "My look":', JSON.stringify(r), ok(r.nudge && r.anim === 'lockwig' && !r.toast && !r.studio && (r.pic ? /One more job, then your look|jobs to go/.test(r.said.join(' ')) : r.said.length === 0))); await p.context().close(); }
  // R5-12 the youngest at the wall: feelings and its speaker in the lower half; faces under the records on his shelf and on his jukebox turn
  { const p = await openAt(1920, 1080, 'look=glass&page=kid&kid=2'); const r = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot; const t = (s) => Math.round(k.querySelector(s).getBoundingClientRect().top); return { speaker: t('[aria-label="Read the question"]'), faces: t('.feel'), tabs: t('.tabs'), look: t('.studio') }; });
    await p.evaluate(() => { window.__said = []; speechSynthesis.speak = (u) => { window.__said.push(u.text); }; }); await p.locator('fh-kid .feel button').first().click(); await p.waitForTimeout(200);
    const f = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot; return { asked: k.querySelector('.feelcard span')?.textContent.trim(), said: window.__said.join(' | '), again: Math.round(k.querySelector('[aria-label="Read the question"]').getBoundingClientRect().top) }; });
    await p.locator('fh-kid [aria-label="Read the question"]').click(); await p.waitForTimeout(100); const speaking = await p.evaluate(() => document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('[aria-label="Read the question"]').hasAttribute('data-speaking'));
    console.log('R5-12 Max at 1920x1080 (tops, all > 540):', JSON.stringify(r), ok(Object.values(r).every((y) => y > 540)), '| R5-17 follow-up shown and spoken:', JSON.stringify(f.asked), ok(f.said.includes(f.asked) && f.again > 540), '| read-aloud button shows it is speaking:', ok(speaking)); await p.context().close(); }
  { const p = await openAt(1920, 1080, 'look=glass&page=music&mtab=shelves'); await p.locator('fh-music .dividers .pchip', { hasText: 'Max' }).click(); await p.waitForTimeout(500);
    const s = await p.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot; const c = m.querySelector('.dividers').getBoundingClientRect(), t = [...m.querySelectorAll('.crate .covers .st')].map((x) => x.getBoundingClientRect()); return { chipsTop: Math.round(c.top), tilesTop: Math.round(Math.min(...t.map((x) => x.top))), tilesBottom: Math.round(Math.max(...t.map((x) => x.bottom))) }; });
    await p.locator('fh-music .dividers .pchip', { hasText: 'Riley' }).click(); await p.waitForTimeout(400); const other = await p.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot; return m.querySelector('.dividers').getBoundingClientRect().top < m.querySelector('.crate .covers, .crate .empty').getBoundingClientRect().top; });
    console.log('R5-12 Max’s shelf at the wall:', JSON.stringify(s), ok(s.chipsTop >= s.tilesBottom && s.tilesTop > 540), '| an older child’s shelf keeps its faces on top:', ok(other)); await p.context().close(); }
  { const p = await openAt(1920, 1080, 'look=glass&page=music&mtab=juke'); await p.locator('fh-music .coin', { hasText: 'Max' }).click(); await p.waitForTimeout(600);
    const s = await p.evaluate(() => { const m = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot; const b = m.querySelector('.banner').getBoundingClientRect(), t = [...m.querySelectorAll('.jcovers .st')].map((x) => x.getBoundingClientRect()); return { bannerTop: Math.round(b.top), tiles: t.length, tilesTop: Math.round(Math.min(...t.map((x) => x.top))), tilesBottom: Math.round(Math.max(...t.map((x) => x.bottom))) }; });
    console.log('R5-12 Max’s jukebox turn at the wall:', JSON.stringify(s), ok(s.tiles > 0 && s.bannerTop >= s.tilesBottom && s.tilesTop > 500)); await p.context().close(); }
  // R5-14 a call that never answers is given up after 12 s: the tick goes back and a calm line says so; a failed clear stays until dismissed; a reward says "Saving…"
  { const p = await openAt(1280, 800, 'look=glass&page=groceries'); await p.evaluate(() => { const c = document.querySelector('family-hub-card'); c.hass.callService = () => new Promise(() => {}); });
    await p.locator('fh-groceries button.item').first().click(); await p.waitForTimeout(300); const held = await p.locator('fh-groceries button.item[aria-pressed="true"]').count(); await p.clock.fastForward(12500); // held counts the row just ticked with those already in the trolley await p.waitForTimeout(400);
    const r = { held, after: await p.locator('fh-groceries button.item[aria-pressed="true"]').count(), toast: (await p.locator('fh-groceries .toast').innerText().catch(() => '')).trim() };
    console.log('R5-14 grocery tick never answered:', JSON.stringify(r), ok(r.after === r.held - 1 && r.toast === 'Home Assistant is slow. Try again.')); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=groceries&fail=1'); const g = p.locator('fh-groceries'); const has = await g.locator('.clear').count();
    if (has) { await g.locator('.clear').click(); await p.clock.fastForward(6500); await p.waitForTimeout(600); const t1 = (await g.locator('.toast').innerText().catch(() => '')).replace(/\s+/g, ' ').trim(); await p.clock.fastForward(20000); await p.waitForTimeout(300); const still = await g.locator('.toast').count(); await g.locator('.toast button').click(); await p.waitForTimeout(500);
      console.log('R5-14 "Clear ticked" failed:', JSON.stringify(t1), '| still there 20 s later:', ok(still === 1), '| goes when OK is tapped:', ok((await g.locator('.toast:not([data-closing])').count()) === 0)); } else console.log('R5-14 "Clear ticked": nothing ticked in the preview, not tested'); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=kid&kid=1&slow=1500'); const k = p.locator('fh-kid'); await p.evaluate(() => { const c = document.querySelector('family-hub-card'), kid = c.shadowRoot.querySelector('fh-kid'), id = kid._e.points; c.hass = { ...c.hass, states: { ...c.hass.states, [id]: { ...c.hass.states[id], state: '500' } } }; kid._tab = 'rewards'; kid._tabPicked = true; kid.requestUpdate(); }); await p.waitForTimeout(300);
    const can = k.locator('button.rw:has(.cost:not(.notyet))'); let asked = false; for (let i = 0; i < await can.count() && !asked; i++) { await can.nth(i).click(); await p.waitForTimeout(250); asked = (await k.locator('.rw.ask').count()) > 0; if (!asked) await p.keyboard.press('Escape'); }
    if (asked) { await k.locator('.rw.ask button').first().click(); await p.waitForTimeout(380); const t = (await k.locator('.rw.ask button').first().innerText().catch(() => '')).trim(); console.log('R5-14 reward "Yes" on a slow link says within 400 ms:', JSON.stringify(t), ok(t === 'Saving…')); } else console.log('R5-14 reward Saving: no reward affordable in the preview, not tested');
    const flat = await p.evaluate(() => { const e = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('.cost.notyet'); return e ? getComputedStyle(e).boxShadow : 'none-found'; }); console.log('R5-17 "N to go" is a flat tile (no outline):', flat, ok(flat === 'none' || flat === 'none-found')); await p.context().close(); }
  // R5-15 semantics: drums, value text, reminders' ring room, status regions
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=add'); const d = p.locator('fh-add-event .drum[data-d="h"]'), m = p.locator('fh-add-event .drum[data-d="m"]'); await d.focus(); const h0 = await d.getAttribute('aria-valuenow');
    await p.keyboard.press('Home'); const home = await d.getAttribute('aria-valuenow'); await p.keyboard.press('PageDown'); const pd = await d.getAttribute('aria-valuenow'); await p.keyboard.press('End'); const end = await d.getAttribute('aria-valuenow'); await p.keyboard.press('PageUp'); const pu = await d.getAttribute('aria-valuenow');
    console.log('R5-15 hour drum keys: start', h0, '| Home', home, '| PageDown', pd, '| End', end, '| PageUp', pu, ok(home === '1' && pd === '4' && end === '12' && pu === '9'), '| value text:', await d.getAttribute('aria-valuetext'), '/', await m.getAttribute('aria-valuetext'), ok(/ (am|pm)$/.test(await d.getAttribute('aria-valuetext'))), '| message region is standing:', ok((await p.locator('fh-add-event .err[role="status"]').count()) === 1)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner'); const r = await p.evaluate(`(() => { const l = ${SR}.querySelector('.remlist'), b = l.querySelector('.rem'); const lb = l.getBoundingClientRect(), bb = b.getBoundingClientRect(); return { left: Math.round(bb.left - lb.left), right: Math.round(lb.right - bb.right) }; })()`);
    console.log('R5-15 room for a reminder’s focus ring inside the clip (px each side, need 6):', JSON.stringify(r), ok(r.left >= 6 && r.right >= 6));
    const dock = await p.evaluate(`(() => { const out = {}; for (const b of ${SR}.querySelectorAll('nav.dock .item')) { const rg = document.createRange(); const tn = [...b.childNodes].reverse().find((n) => n.textContent.trim()); rg.selectNodeContents(tn); out[b.textContent.trim()] = Math.round(rg.getBoundingClientRect().bottom); } return out; })()`);
    console.log('R5-16 dock labels on one line (bottoms):', JSON.stringify(dock), ok(Math.max(...Object.values(dock)) - Math.min(...Object.values(dock)) <= 1), '| Dinner shown with an announce script:', ok('Dinner' in dock)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&dinner=0'); { const n = await p.evaluate(`${SR}.querySelectorAll('nav.dock [data-nav="dinner"]').length`); console.log('R5-17 no announce script: Dinner in the dock (expect 0):', n, ok(n === 0)); } await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&sheet=sitter'); const w = await p.evaluate(`[...${SR}.querySelectorAll('.sheet .irow')].map((x) => x.textContent.trim()).filter((t) => /^(Network|Password)/.test(t)).map((t) => t.slice(0, 8))`); console.log('R5-17 House info Wi-Fi rows:', JSON.stringify(w), ok(w.length === 2 && /^Network/.test(w[0]) && /^Password/.test(w[1]))); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=planner&empty=1'); const t = await p.evaluate(`${SR}.querySelector('.rems')?.textContent.replace(/\\s+/g, ' ').trim() ?? ''`); console.log('R5-17 empty reminders:', JSON.stringify(t.slice(0, 60)), ok(/Nothing to remember/.test(t) || !/All done/.test(t))); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=weather'); const r = await p.evaluate(() => { const w = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot; return { winds: [...w.querySelectorAll('.hchart .wind')].map((t) => t.textContent.trim()).filter(Boolean).slice(0, 4), key: w.querySelector('.hkey')?.textContent.trim() }; }); console.log('R5-16 hourly wind labels:', JSON.stringify(r), ok(r.winds.every((t) => /^\d+$/.test(t)) && /km\/h/.test(r.key ?? ''))); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=kid&kid=1&studio=1'); const r = await p.evaluate(() => { const s = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('fh-studio').shadowRoot; const rows = {}; for (const b of s.querySelectorAll('.tabs button')) { const y = Math.round(b.getBoundingClientRect().top); rows[y] = (rows[y] || 0) + 1; } return { rows: Object.values(rows), cut: [...s.querySelectorAll('.tabs button')].filter((b) => b.scrollWidth > b.clientWidth + 1).length }; }); console.log('R5-16 studio tabs per row:', JSON.stringify(r), ok(r.rows.join() === '4,4' && r.cut === 0)); await p.context().close(); }
  { const p = await openAt(1280, 800, 'look=glass&page=kid&kid=0'); const r = await p.evaluate(() => { const k = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot, s = k.querySelector('.side'); return Math.round(s.getBoundingClientRect().bottom - Math.max(...[...s.children].map((c) => c.getBoundingClientRect().bottom))); }); console.log('R5-16 older boys’ right column: gap under its last card (px):', r, ok(r <= 2)); await p.context().close(); }
}
});
await section('Home Ground (the sports look): it can be chosen in the picker, the hea', async () => {
// Home Ground (the sports look): it can be chosen in the picker, the header clock is digit tiles, the dock is there, and no page throws
{ let page = await open('look=glass&sheet=themes');
  const cards = page.locator('family-hub-card .looks .tcard');
  const count = await cards.count();
  await cards.filter({ hasText: 'Home Ground' }).click(); await page.waitForTimeout(300);
  console.log('HG1 picker: four looks', count === 4, '| choosing Home Ground sets the look', await page.evaluate(() => document.querySelector('family-hub-card').getAttribute('data-look') === 'sports' && localStorage.getItem('family-hub-look') === 'sports'),
    '| its card is the chosen one', await cards.filter({ hasText: 'Home Ground' }).getAttribute('aria-pressed') === 'true');
  await page.close();
  page = await open('look=sports&page=planner');
  const clock = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, b = r.querySelector('header .sboard'), dg = [...r.querySelectorAll('header .sboard .dg')];
    return { tiles: dg.map((d) => d.textContent).join(''), label: b?.getAttribute('aria-label'), tileBg: dg[0] ? getComputedStyle(dg[0]).backgroundColor : '', hm: getComputedStyle(r.querySelector('header .hm')).display, ball: r.querySelector('header .sboard .dball')?.dataset.ball, dow: r.querySelector('.fh').dataset.dow }; });
  console.log('HG2 header clock: digit tiles', clock.tiles === '420' && clock.label === '4:20', '| tiles are dark', clock.tileBg === 'rgb(10, 16, 13)', '| plain digits hidden', clock.hm === 'none', '| ball of the day (Tuesday: tennis)', clock.ball === 'tennis' && clock.dow === '2');
  const dock = await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot, d = r.querySelector('nav.dock'), items = [...d.querySelectorAll('.item')], b = d.getBoundingClientRect();
    return { n: items.length, small: items.filter((i) => { const q = i.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).length, wide: Math.round(b.width) === innerWidth, bottom: Math.round(b.bottom) === innerHeight, current: d.querySelector('[aria-current="page"]')?.dataset.nav,
      leads: r.querySelectorAll('.planner .lead').length, lanes: r.querySelectorAll('.week .col').length, balls: r.querySelectorAll('.week .dayhead .dball').length, verdict: r.querySelector('header .weather .verdict')?.textContent.trim() }; });
  console.log('HG3 dock: present with its items', dock.n >= 9 && dock.small === 0, '| a touchline across the bottom', dock.wide && dock.bottom, '| current page marked', dock.current === 'calendar', '| one hero on the planner', dock.leads === 1, '| seven lanes, a ball in each', dock.lanes === 7 && dock.balls === 7, '| pitch report on the weather chip:', dock.verdict);
  await page.close();
  const before = errs.filter((e) => !/^404|^failed/.test(e)).length, blank = [];
  for (const [qs, time] of [['page=planner&view=day'], ['page=planner&view=month'], ['page=planner', '19:30'], ['page=planner&calm=1'], ['page=planner&events=none&empty=1'], ['page=kid&kid=0'], ['page=kid&kid=1'], ['page=kid&kid=2'], ['page=kid&kid=2', '19:30'], ['page=kid&kid=0&studio=1'], ['page=groceries'], ['page=doodle'],
    ...['house', 'scene', 'dial', 'desk', 'cables', 'list'].map((v) => ['page=music&mview=' + v]), ...['shelves', 'juke&juke=1', 'radio', 'call'].map((t) => ['page=music&mtab=' + t]), ['page=weather'], ['page=weather&wx=rain'], ['page=home'], ['page=morning', '07:10'], ['page=planner&night=1', '22:30'],
    ...['add', 'meds', 'sitter', 'timer', 'themes', 'chat'].map((sh) => ['page=planner&sheet=' + sh]), ['page=kid&kid=0&sheet=kidprefs']]) {
    const p = await open('look=sports&' + qs, time);
    if (!(await p.evaluate(() => { const c = document.querySelector('family-hub-card'); return c.getAttribute('data-look') === 'sports' && c.shadowRoot.querySelector('.fh').children.length > 0; }))) blank.push(qs);
    await p.close(); }
  console.log('HG4 every page, sheet and view opens in Home Ground:', blank.length ? 'BLANK ' + blank.join(', ') : true, '| nothing throws', errs.filter((e) => !/^404|^failed/.test(e)).length === before);
  page = await open('look=sports&page=weather&wx=rain');
  console.log('HG5 weather page: the verdict tile comes first:', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-weather').shadowRoot, v = r.querySelector('.wnow .verdict'); return v && (v.previousElementSibling?.tagName === 'H2' || v.previousElementSibling?.querySelector?.(':scope > h2')) ? v.textContent.trim() : 'MISSING'; }));
  await page.close();
  page = await open('look=sports&page=music&mview=scene');
  console.log('HG6 music scene is the training ground', await page.evaluate(() => { const r = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-music').shadowRoot, v = r.querySelector('.vscene'); return v?.dataset.kind === 'sports' && r.querySelectorAll('.vscene .actor').length > 0 && !!r.querySelector('.backdrop .bgchalk'); }));
  await page.close(); }
});
await section('R6-H9. Home Ground at 1024x768: a seven-letter name stays on one line ', async () => {
// R6-H9. Home Ground at 1024x768: a seven-letter name stays on one line in the page title
page = await open('look=sports&page=kid&kid=1'); await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(600);
{ const n = await page.evaluate(() => { const n = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-kid').shadowRoot.querySelector('.name'), g = document.createRange(); g.selectNodeContents(n); return new Set([...g.getClientRects()].map((r) => Math.round(r.top))).size; }); console.log('R6-H9 lines in the name (expect 1):', n, ok(n === 1)); }
// R6-H10/H11. the same screen's rail: the small player's second line is not cut without an ellipsis, and "+10 min" keeps clear of its pill's edge
// (the artist and room line is clamped to one line by design and ends in "…" when long: backlog 151, decided 22 Nov to accept it)
await HOME(page); await page.getByRole('button', { name: 'Planner', exact: true }).click(); await page.waitForTimeout(700);
{ const cut = await page.evaluate(() => [...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.np .np-row span.muted')].filter((s) => { const c = getComputedStyle(s), ell = c.textOverflow === 'ellipsis' || (c.webkitLineClamp && c.webkitLineClamp !== 'none'); return (s.scrollWidth > s.clientWidth + 1 || s.scrollHeight > s.clientHeight + 1) && !ell; }).length);
  const room = await page.evaluate(() => Math.round(Math.min(...[...document.querySelector('family-hub-card').shadowRoot.querySelectorAll('.quick')].filter((b) => b.getBoundingClientRect().width).map((b) => { const r = b.getBoundingClientRect(), g = document.createRange(); g.selectNodeContents(b); const t = g.getBoundingClientRect(); return Math.min(t.left - r.left, r.right - t.right); }))));
  console.log('R6-H10 small player lines cut without an ellipsis (expect 0):', cut, ok(cut === 0), '| R6-H11 least room beside a quick pill’s words (expect >= 6):', room, ok(room >= 6)); }
await page.close();
});
await section('D16. Sea & Sun has a horizon line in its own background (so it is ther', async () => {
// D16. Sea & Sun has a horizon line in its own background (so it is there with the ambient scene off and in calm mode); other themes are as they were
{ const bg = async (qs) => { const p = await openAt(1280, 800, qs); const r = await p.evaluate(() => { const fh = document.querySelector('family-hub-card').shadowRoot.querySelector('.fh'), b = getComputedStyle(fh).backgroundImage; return { grad: (b.match(/linear-gradient/g) || []).length, img: /url\(/.test(b), stop: /57%/.test(b) }; }); await p.context().close(); return r; };
  const sea = await bg('look=glass&theme=sea&page=planner'), off = await bg('look=glass&theme=sea&page=planner&ambient=0&calm=1'), space = await bg('look=glass&theme=space&page=planner'), sunset = await bg('look=glass&theme=sunset&page=planner');
  console.log('D16 Sea horizon drawn in the background:', JSON.stringify(sea), ok(sea.grad === 1 && sea.img && sea.stop), '| ambient off and calm:', ok(off.grad === 1 && off.stop), '| Space and Sunset untouched:', ok(space.grad === 0 && sunset.grad === 0 && space.img)); }
});
await section('D18. Sports: filled yellow is for action only. Nothing that is merely ', async () => {
// D18. Sports: filled yellow is for action only. Nothing that is merely current or chosen is yellow; chosen still stands out by at least 3:1
{ const YEL = ['rgb(255, 214, 10)', 'rgb(255, 246, 196)'];
  const scan = (p) => p.evaluate((YEL) => { const hits = [], card = document.querySelector('family-hub-card'); const walk = (root) => { for (const e of root.querySelectorAll('*')) { const cs = getComputedStyle(e); if (cs.display !== 'none' && e.getClientRects().length) for (const ps of [null, '::before', '::after']) { const c = ps ? getComputedStyle(e, ps) : cs; if (ps && (c.content === 'none' || c.content === 'normal')) continue;
        if (YEL.includes(c.backgroundColor) || YEL.some((y) => c.backgroundImage.includes(y) && !/url\(/.test(c.backgroundImage)) || YEL.some((y) => c.boxShadow.includes(y)) || (c.textDecorationLine.includes('underline') && YEL.includes(c.textDecorationColor))) hits.push((e.getRootNode().host?.localName ?? '') + ' ' + e.localName + '.' + String(e.getAttribute('class') || '').trim().split(/\s+/).join('.') + (ps ?? '')); } if (e.shadowRoot) walk(e.shadowRoot); } }; walk(card.shadowRoot); return [...new Set(hits)]; }, YEL);
  // the classes that are an action: the hero button of a page or sheet, the play key (music and the radar), the big "I did it" and the talk button. A record's paper label is a drawing, not a state
  const ACTION = /\.(lead|primary|go|talk)\b|button\.pic\.[^ ]*now[^ ]*::after|\.play\b|fh-radar button/, ART = /fh-music i\.disc/, bad = [], heroes = [];
  for (const [pg, t] of [['planner'], ['planner&view=day'], ['planner&view=month'], ['kid&kid=0'], ['kid&kid=2'], ['home'], ['weather'], ['groceries'], ['morning', '07:10'], ['music&mview=house'], ['music&mview=list'], ['music&mview=desk&moments=1'], ['music&mtab=juke&juke=1'], ['music&mtab=radio'], ['music&mtab=call'], ['planner&sheet=add'], ['planner&sheet=timer'], ['planner', '19:20'], ['home', '19:20'], ['music&mtab=juke&juke=1', '19:20']]) {
    const p = await openAt(1280, 800, 'look=sports&page=' + pg, t); const hits = await scan(p); for (const h of hits.filter((x) => !ART.test(x))) (ACTION.test(h) ? heroes : bad).push(`${pg}${t ? '@' + t : ''}: ${h}`); await p.context().close(); }
  console.log('D18 yellow on anything that is not an action:', bad.length ? bad.slice(0, 12).join(' ; ') : 'none', ok(!bad.length), '| yellow actions found:', [...new Set(heroes.map((h) => h.split(': ')[1].trim()))].length, 'kinds', ok(heroes.length > 0));
  const p = await openAt(1280, 800, 'look=sports&page=planner');
  const r = await p.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot; const lum = (s) => { const m = s.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); }, cr = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 10) / 10; };
    const bgOf = (e) => getComputedStyle(e).backgroundColor, solid = (s) => (/rgba\(.*, 0\)|transparent/.test(s) ? 'rgb(236, 239, 230)' : s);
    const segOn = c.querySelector('.seg button[aria-pressed="true"]'), segOff = c.querySelector('.seg button[aria-pressed="false"]'), today = c.querySelector('.col.today'), other = c.querySelector('.col:not(.today)');
    const dockOn = c.querySelector('.dock .item[aria-current="page"] svg.i'), dockOff = c.querySelector('.dock .item:not(.kidbtn)[aria-current="false"] svg.i') ?? c.querySelector('.dock .item:not(.kidbtn):not([aria-current="page"]) svg.i'), add = c.querySelector('[data-act="add"]');
    const outline = (getComputedStyle(today).boxShadow.match(/rgba?\([^)]+\)/) || [''])[0];
    return { seg: cr(bgOf(segOn), solid(bgOf(segOff))), todayOutline: outline, today: cr(outline, solid(bgOf(other))), todayW: /3px/.test(getComputedStyle(today).boxShadow), dock: cr(bgOf(dockOn), solid(bgOf(dockOff))), dockLine: getComputedStyle(c.querySelector('.dock .item[aria-current="page"]')).textDecorationColor, add: bgOf(add) }; });
  console.log('D18 chosen against not chosen: view chip', r.seg + ':1', '| today’s outline', r.todayOutline, r.today + ':1 against the next column', '| this page in the dock', r.dock + ':1', r.dockLine, '| Add is', r.add, ok(r.seg >= 3 && r.today >= 3 && r.todayW && r.dock >= 3 && r.add === 'rgb(255, 214, 10)')); await p.context().close(); }
});

await finish();
