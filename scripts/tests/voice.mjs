// "Will across the whole app" (0.33.3) and Oliver's decisions of 14 Nov: one house voice for everything said aloud, with a
// daily allowance and a fallback each time; ready messages and the dinner call played from recordings; a child's page animated
// unless calm is chosen; bin night named for the night the bins go out.
// Usage: npm run build && PLAYWRIGHT=<playwright index.mjs> [CHROME=<binary>] [PORT=4835] node scripts/tests/voice.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const ROOT = new URL('../..', import.meta.url).pathname, PREV = path.join(ROOT, 'preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.json': 'application/json' };
const PORT = Number(process.env.PORT || 4835);
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const p = u.pathname === '/' ? path.join(PREV, 'index.html') : path.join(ROOT, u.pathname.replace(/^\/preview\/\.\./, ''));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : b); }); }).listen(PORT);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const errs = []; let pass = 0; const fails = [];
const ok = (name, cond, got = '') => { if (cond) pass++; else fails.push(name); console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${got !== '' ? `  [${typeof got === 'string' ? got : JSON.stringify(got)}]` : ''}`); };
// the screen's own voice is recorded, not heard
const SPY = () => { window.__said = []; try { speechSynthesis.speak = (u) => { window.__said.push(u.text); }; speechSynthesis.cancel = () => {}; } catch { /* no speech */ } };
const open = async (qs, { time = '2026-11-10T16:20', w = 1920, h = 1080, before = null, keep = false } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, timezoneId: 'Australia/Perth', locale: 'en-AU', hasTouch: true }); const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/404|no-such/.test(m.text())) errs.push(m.text()); });
  await page.addInitScript(SPY); if (before) await page.addInitScript(before);
  await page.clock.install({ time: new Date(`${time}:00+08:00`) }); await page.goto('http://localhost:' + PORT + '/?' + qs); await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(700);
  if (!keep) await page.evaluate(() => { window.__calls = []; window.__said = []; }); return page; };
const C = (page) => page.locator('family-hub-card'), K = (page) => page.locator('family-hub-card fh-kid'), M = (page) => page.locator('family-hub-card fh-music');
const calls = (page, re) => page.evaluate((src) => (window.__calls ?? []).filter((c) => new RegExp(src).test(c)), re.source);
const said = (page) => page.evaluate(() => window.__said);
const used = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('fh-voice-day') || '{}').n ?? 0);
const pin = async (page, root) => { for (const d of '1234') await root.locator('fh-pin').getByRole('button', { name: d, exact: true }).click(); await page.waitForTimeout(500); };
const JOBS = 'family-hub-card fh-kid .readme';

// 1. read-aloud on a child's page speaks in the house voice
{ const page = await open('look=glass&page=kid&kid=2&voice=1');
  await page.locator(JOBS).click(); await page.waitForTimeout(900);
  const t = await calls(page, /tts_get_url/);
  ok('with a house voice, read-aloud asks Home Assistant for that engine, voice and language', t.length === 1 && /"engine_id":"tts.demo_voice"/.test(t[0]) && /"voice":"demo-voice"/.test(t[0]) && /"language":"en"/.test(t[0]) && /"cache":true/.test(t[0]), t);
  ok('and the screen’s own voice stays quiet', (await said(page)).length === 0, await said(page));
  const n1 = await used(page);
  ok('the new phrase is counted against today’s allowance, once', n1 > 5, n1);
  await page.locator(JOBS).click(); await page.waitForTimeout(900);
  ok('the same phrase again costs nothing more', await used(page) === n1 && (await calls(page, /tts_get_url/)).length === 2, await used(page));
  ok('the button stops showing that it is speaking when the words end', await page.locator(JOBS + '[data-speaking]').count() === 0);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=2'); await page.locator(JOBS).click(); await page.waitForTimeout(500);
  ok('with no house voice set, the screen reads it itself, as before', (await calls(page, /tts_get_url/)).length === 0 && (await said(page)).length === 1, await said(page));
  await page.context().close(); }

// 2. the daily allowance, and what happens beyond it
{ const page = await open('look=glass&page=kid&kid=2&voice=1&vcap=5'); await page.locator(JOBS).click(); await page.waitForTimeout(600);
  ok('past the day’s allowance a new phrase is not sent to the engine: the screen’s own voice says it', (await calls(page, /tts_get_url/)).length === 0 && (await said(page)).length === 1 && await used(page) === 0, [await calls(page, /tts_get_url/), await said(page)]);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=2&voice=1'); await page.locator(JOBS).click(); await page.waitForTimeout(900); const n = await used(page);
  // the allowance now stands exactly at what was used: nothing new fits, but what has been heard before still plays
  await page.evaluate(async (n) => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, voice: { ...c._config.voice, daily_chars: n } }); await c.updateComplete; window.__calls = []; window.__said = []; }, n);
  await page.locator(JOBS).click(); await page.waitForTimeout(900);
  ok('a phrase heard before still plays in the house voice when the allowance is used up (Home Assistant kept the sound)', (await calls(page, /tts_get_url/)).length === 1 && (await said(page)).length === 0, await said(page));
  await K(page).locator('.avbtn').click(); await page.waitForTimeout(600);
  ok('a new phrase then falls to the screen’s own voice', (await calls(page, /tts_get_url/)).length === 1 && (await said(page)).length === 1, await said(page));
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=2&voice=1'); await page.evaluate(() => { window.__ttsFail = true; }); await page.locator(JOBS).click(); await page.waitForTimeout(1200);
  ok('if the engine’s sound never arrives, the screen’s own voice says it and nothing is counted', (await said(page)).length === 1 && await used(page) === 0, [await said(page), await used(page)]);
  await page.evaluate(() => { window.__ttsFail = 'throw'; window.__said = []; }); await page.locator(JOBS).click(); await page.waitForTimeout(700);
  ok('the same when Home Assistant refuses outright', (await said(page)).length === 1, await said(page));
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=2&voice=1&vcount=1'); await page.locator(JOBS).click(); await page.waitForTimeout(900);
  const n = await used(page), st = await page.evaluate(() => document.querySelector('family-hub-card').hass.states['input_number.fh_voice_chars'].state);
  ok('with a shared counter, the count is written to Home Assistant so every screen shares one allowance', n > 0 && Number(st) === n, [n, st]);
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c.hass = { ...c.hass, states: { ...c.hass.states, 'input_number.fh_voice_chars': { ...c.hass.states['input_number.fh_voice_chars'], state: '99999', last_changed: new Date().toISOString() } } }; await c.updateComplete; window.__calls = []; window.__said = []; });
  await K(page).locator('.avbtn').click(); await page.waitForTimeout(600);
  ok('another screen having used the allowance stops this one too', (await calls(page, /tts_get_url/)).length === 0 && (await said(page)).length === 1, await said(page));
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'), d = new Date(Date.now() - 86400000 * 1.5).toISOString(); c.hass = { ...c.hass, states: { ...c.hass.states, 'input_number.fh_voice_chars': { ...c.hass.states['input_number.fh_voice_chars'], state: '99999', last_changed: d } } }; localStorage.removeItem('fh-voice-day'); await c.updateComplete; window.__calls = []; window.__said = []; });
  await page.locator('family-hub-card fh-kid .seedone, family-hub-card fh-kid .avbtn').first().click(); await page.waitForTimeout(900);
  ok('yesterday’s count is not today’s: the allowance starts again each day', (await calls(page, /tts_get_url/)).length >= 1, await calls(page, /tts_get_url/));
  await page.context().close(); }

// 3. Call a room
const room = async (page, msg, typed = false) => { await M(page).getByRole('tab', { name: 'Call a room' }).click(); await M(page).getByRole('button', { name: 'Office' }).click();
  if (typed) await M(page).evaluate((m, t) => { m._callMsg = t; }, msg); else await M(page).getByRole('button', { name: msg }).click();
  await page.evaluate(() => { window.__calls = []; }); await M(page).getByRole('button', { name: /Say it/ }).click(); await page.waitForTimeout(600); };
{ const page = await open('look=glass&page=music&voice=1'); await room(page, 'Time to leave – shoes on!');
  const pm = await calls(page, /media_player\.play_media|play_announcement/), sp = await calls(page, /tts\.speak|tts_get_url/);
  ok('a ready message is played from its recording, as an announcement', pm.length === 1 && /line-leave\.mp3/.test(pm[0]) && /"announce":true/.test(pm[0]), pm);
  ok('and nothing is sent to a voice engine for it', sp.length === 0, sp);
  ok('the toast says who is being called', /Calling Office/.test(await M(page).evaluate((m) => m._msg)), await M(page).evaluate((m) => m._msg));
  await page.context().close(); }
for (const [vf, why] of [['missing', 'the recording is not there'], ['none', 'no recordings are set']]) { const page = await open(`look=glass&page=music&voice=1&vfiles=${vf}`); await room(page, 'I love you!');
  const all = await calls(page, /media_player\.play_media|play_announcement|tts\.speak|tts_get_url/);
  ok(`when ${why}, the house voice says the line live`, all.some((c) => /tts_get_url/.test(c) && /tts.demo_voice/.test(c)) && all.some((c) => /play_announcement|tts\.speak tts\.demo_voice|tts\.speak .*demo/.test(c)) && !all.some((c) => /play_media/.test(c)) && !all.some((c) => /home_assistant_cloud/.test(c)), all);
  await page.context().close(); }
{ const page = await open('look=glass&page=music&voice=1'); await room(page, 'Uncle Kit is at the door', true);
  ok('a typed message still asks a grown-up first', await M(page).locator('fh-pin').count() === 1 && (await calls(page, /tts|play_/)).length === 0);
  await pin(page, M(page)); await page.waitForTimeout(500);
  const all = await calls(page, /media_player\.play_media|play_announcement|tts\.speak|tts_get_url/);
  ok('then it is spoken live in the house voice, and counted', all.some((c) => /tts_get_url/.test(c) && /tts.demo_voice/.test(c)) && !all.some((c) => /home_assistant_cloud/.test(c)) && await used(page) === 'Uncle Kit is at the door'.length, [all, await used(page)]);
  await page.context().close(); }
{ const page = await open('look=glass&page=music&voice=1&vcap=3'); await room(page, 'Uncle Kit is at the door', true); await pin(page, M(page)); await page.waitForTimeout(500);
  const all = await calls(page, /media_player\.play_media|play_announcement|tts\.speak|tts_get_url/);
  ok('past the allowance a typed call uses the built-in voice instead', all.length > 0 && all.every((c) => !/demo_voice/.test(c)) && all.some((c) => /home_assistant_cloud/.test(c)), all);
  await page.context().close(); }
{ const page = await open('look=glass&page=music&voice=1&vfiles=none'); await page.evaluate(() => { window.__ttsFail = true; }); await room(page, 'I love you!');
  const all = await calls(page, /play_announcement|tts\.speak|api\.tts_get_url/);
  ok('if the house voice’s sound never arrives (no credit, engine down), the call goes out in the built-in voice', all.some((c) => /home_assistant_cloud/.test(c)) && !all.some((c) => /tts\.speak tts\.demo_voice/.test(c)) && await used(page) === 0, all);
  ok('and the room is still told it was called', /Calling Office/.test(await M(page).evaluate((m) => m._msg)));
  await page.context().close(); }
{ const page = await open('look=glass&page=music'); await room(page, 'I love you!');
  const all = await calls(page, /media_player\.play_media|play_announcement|tts\.speak|tts_get_url/);
  ok('with no house voice set, Call a room speaks in the built-in voice exactly as before', all.length > 0 && all.every((c) => !/demo_voice|play_media/.test(c)) && all.some((c) => /home_assistant_cloud/.test(c)), all);
  await page.context().close(); }

// 4. the dinner call
const dinner = async (qs) => { const page = await open(qs); await page.evaluate(() => document.querySelector('family-hub-card')._dinnerGo()); await page.waitForTimeout(500); const c = await calls(page, /script\.turn_on/); await page.context().close(); return c; };
{ let c = await dinner('look=glass&page=planner&voice=1');
  ok('the dinner call tells the script which recording to play', c.length === 1 && /"fh_line":"dinner"/.test(c[0]) && /"fh_file":"media-source:\/\/media_source\/local\/line-dinner\.mp3"/.test(c[0]), c);
  c = await dinner('look=glass&page=planner&voice=1&vfiles=missing');
  ok('when the recording is missing it says so (an empty fh_file), so the script speaks the line instead', c.length === 1 && /"fh_file":""/.test(c[0]), c);
  c = await dinner('look=glass&page=planner');
  ok('with no house voice the script is called as before, with nothing added', c.length === 1 && !/variables/.test(c[0]), c); }

// 5. Ask speaks in the house voice unless it has its own
{ const page = await open('look=glass&page=planner&voice=1'); await page.evaluate(() => { document.querySelector('family-hub-card')._sheet = 'chat'; }); await page.waitForTimeout(600);
  const p = await page.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-chat'); return c ? [c.tts, c.ttsVoice, c.ttsLanguage] : null; });
  ok('Ask takes the house voice when it has none of its own', p && p[0] === 'tts.demo_voice' && p[1] === 'demo-voice' && p[2] === 'en', p);
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, chat: { ...c._config.chat, tts: 'tts.other', tts_voice: 'nova' } }); await c.updateComplete; });
  const o = await page.evaluate(() => { const c = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-chat'); return [c.tts, c.ttsVoice, c.ttsLanguage]; });
  ok('and keeps its own when one is set', o[0] === 'tts.other' && o[1] === 'nova' && o[2] === '', o);
  await page.context().close(); }
{ const page = await open('look=glass&page=planner');
  const bad = await page.evaluate(() => { const el = document.createElement('family-hub-card'), c = document.querySelector('family-hub-card')._config; const t = (v) => { try { el.setConfig({ ...c, voice: v }); return ''; } catch (e) { return String(e.message); } }; return [t({ tts: 'nope' }), t({ tts: 'tts.x', files: 'a.mp3' }), t({ tts: 'tts.x', daily_chars: -1 }), t({ tts: 'tts.x', count: 'sensor.x' }), t({ tts: 'tts.x', voice: 'v', language: 'en', files: 'media-source://media_source/local/l-{line}.mp3', daily_chars: 100, count: 'input_number.n' })]; });
  ok('a voice setting that cannot work is refused in words; a good one is accepted', bad.slice(0, 4).every((m) => /^Family Hub: voice/.test(m)) && bad[4] === '', bad);
  await page.context().close(); }

// 6. a child's page is animated unless calm is chosen (Oliver, 14 Nov)
for (const look of ['glass', 'fridge', 'orbit', 'sports']) { const page = await open(`look=${look}&page=kid&kid=0`); const kid = K(page);
  ok(`${look}: a child’s page starts animated, not calm`, await C(page).evaluate((c) => !c.shadowRoot.querySelector('.fh').hasAttribute('data-calm')));
  await kid.locator('.job.row', { hasText: 'Unpack the dishwasher' }).click(); await page.waitForTimeout(120);
  const fly = await kid.locator('.marble.fly').count();
  ok(`${look}: with nothing chosen, the marble flies from the ticked family job to the jar`, fly === 1 && (await calls(page, /script\.fh_add_points .*"jar":1/)).length === 1, fly);
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0', { before: () => { try { localStorage.setItem('family-hub-kid-riley', JSON.stringify({ calm: true })); } catch { /* blocked */ } } }); const kid = K(page);
  ok('calm stays a choice: a child who has chosen it has a calm page', await C(page).evaluate((c) => c.shadowRoot.querySelector('.fh').hasAttribute('data-calm')));
  await kid.locator('.job.row', { hasText: 'Unpack the dishwasher' }).click(); await page.waitForTimeout(200);
  ok('and for him nothing flies; the marble is still added', await kid.locator('.marble.fly').count() === 0 && (await calls(page, /script\.fh_add_points .*"jar":1/)).length === 1);
  await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, calm: false }); await c.updateComplete; });
  ok('his choice holds even where an older configuration says “never”', await C(page).evaluate((c) => c.shadowRoot.querySelector('.fh').hasAttribute('data-calm')));
  await page.context().close(); }
{ const page = await open('look=glass&page=kid&kid=0&calm=1');
  ok('“Everywhere” still calms a child’s page', await C(page).evaluate((c) => c.shadowRoot.querySelector('.fh').hasAttribute('data-calm')));
  await page.context().close();
  const s = await open('look=glass&page=planner&sheet=settings&pane=children'); const S = s.locator('fh-settings');
  ok('Settings shows calm as off for a child until it is chosen', await S.getByRole('switch', { name: 'Calm mode' }).getAttribute('aria-checked') === 'false');
  await s.context().close();
  const hs = await open('look=glass&page=planner&sheet=settings&pane=house'); const H = hs.locator('fh-settings');
  const opts = await H.getByRole('group', { name: 'Calm mode' }).locator('button').evaluateAll((els) => els.map((e) => e.textContent.trim() + (e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-checked') === 'true' ? '*' : '')));
  ok('the house setting offers “Each child chooses” or “Everywhere”', opts.join('|') === 'Each child chooses*|Everywhere', opts);

  // 7. bin night says what it means
  const g = H.getByRole('group', { name: 'Night the bins go out' });
  ok('Settings asks for the night the bins go out', await g.count() === 1 && (await g.locator('[aria-pressed="true"]').innerText()).trim() === 'Mon' && await H.getByRole('group', { name: 'Collection day' }).count() === 0);
  const txt = await H.evaluate((el) => el.shadowRoot.textContent.replace(/\s+/g, ' '));
  ok('and spells out the morning after', /Out on Monday night, collected Tuesday morning\./.test(txt), (/Out on[^.]*\./.exec(txt) ?? [''])[0]);
  await g.getByRole('button', { name: 'Thu' }).click(); await hs.waitForTimeout(150);
  ok('the words follow the choice', /Out on Thursday night, collected Friday morning\./.test(await H.evaluate((el) => el.shadowRoot.textContent.replace(/\s+/g, ' '))));
  await hs.context().close(); }
{ // Monday 9 November 2026 is bin night in the preview (day 1)
  const mon = await open('look=glass&page=planner', { time: '2026-11-09T17:30' });
  // the header says only its most urgent thing: with no medicine due, that is the bins
  await mon.evaluate(async () => { const c = document.querySelector('family-hub-card'); c.setConfig({ ...c._config, meds: [] }); await c.updateComplete; }); await mon.waitForTimeout(200);
  ok('on Monday evening the planner’s header says the bins go out tonight', /Bins tonight/.test(await C(mon).evaluate((c) => c.shadowRoot.querySelector('.cap[data-kind="bin"]')?.textContent ?? '')), await C(mon).evaluate((c) => c.shadowRoot.querySelector('.cap[data-kind="bin"]')?.getAttribute('aria-label')));
  ok('the screensaver line says tonight', (await C(mon).evaluate((c) => c._artLines())).some((l) => /^Bins out tonight: /.test(l)), await C(mon).evaluate((c) => c._artLines()));
  await C(mon).evaluate((c) => { c._sheet = 'sitter'; }); await mon.waitForTimeout(500);
  ok('House info says tonight', /Bin night\s*Tonight/.test(await C(mon).evaluate((c) => c.shadowRoot.querySelector('.sheet').textContent.replace(/\s+/g, ' '))));
  await mon.context().close();
  const sun = await open('look=glass&page=planner&sheet=sitter', { time: '2026-11-08T15:00' });
  ok('on Sunday the screensaver line says tomorrow night', (await C(sun).evaluate((c) => c._artLines())).some((l) => /^Bins out tomorrow night: /.test(l)), await C(sun).evaluate((c) => c._artLines()));
  ok('and House info names Monday night', /Bin night\s*Monday night/.test(await C(sun).evaluate((c) => c.shadowRoot.querySelector('.sheet').textContent.replace(/\s+/g, ' '))), (/Bin night.{0,40}/.exec(await C(sun).evaluate((c) => c.shadowRoot.querySelector('.sheet').textContent.replace(/\s+/g, ' '))) ?? [''])[0]);
  await sun.context().close();
  const tue = await open('look=glass&page=planner', { time: '2026-11-10T07:00' });
  ok('on Tuesday morning, collection day, nothing says the bins go out today', await C(tue).evaluate((c) => !c.shadowRoot.querySelector('.cap[data-kind="bin"]') && !c._artLines().some((l) => /Bins out to(night|morrow)/.test(l)) && c._bins(new Date()).night.getDay() === 1));
  await tue.context().close(); }

// 8. a list of voices, one in use (0.34.1): everything follows the choice, and Home Assistant's side is kept in step
{ const page = await open('look=glass&page=kid&kid=2&voice=1&voices=Robin', { keep: true }); await page.waitForTimeout(400);
  const sync = await calls(page, /input_text\.set_value|pipeline\/update/);
  ok('on loading, the voice in use is copied to Home Assistant’s helper', sync.some((c) => /input_text\.fh_voice_id/.test(c) && /demo-robin/.test(c)), sync);
  ok('and its recordings: this voice has none, so that helper is emptied', sync.some((c) => /input_text\.fh_voice_files/.test(c) && /"value":""/.test(c)), sync);
  ok('and Ask’s pipeline is given the same voice', sync.some((c) => /pipeline\/update/.test(c) && /"tts_voice":"demo-robin"/.test(c) && /"pipeline_id":"demo"/.test(c) && /"conversation_engine"/.test(c)), sync.filter((c) => /pipeline/.test(c)));
  await page.locator(JOBS).click(); await page.waitForTimeout(600);
  const c = await calls(page, /tts_get_url/);
  ok('read-aloud speaks in the voice in use', c.length >= 1 && c.every((x) => /"voice":"demo-robin"/.test(x)), c.slice(0, 1));
  await page.evaluate(() => { (window.__calls ??= []).length = 0; document.querySelector('family-hub-card').requestUpdate(); }); await page.waitForTimeout(400);
  ok('once in step, nothing is written again', (await calls(page, /input_text\.set_value|pipeline\/update/)).length === 0);
  await page.context().close(); }
{ let c = await dinner('look=glass&page=planner&voice=1&voices=Robin');
  ok('the dinner call in a voice with no recording sends no file and names the voice, so the script speaks it', c.length === 1 && /"fh_file":""/.test(c[0]) && /"fh_voice":"demo-robin"/.test(c[0]), c);
  c = await dinner('look=glass&page=planner&voice=1&voices=Wren');
  ok('and in a voice that has recordings it sends that voice’s recording', c.length === 1 && /line-dinner\.mp3/.test(c[0]), c); }
{ const page = await open('look=glass&page=music&voice=1&voices=Robin'); await room(page, 'Time to leave – shoes on!');
  const sp = await calls(page, /tts_get_url/), pl = await calls(page, /play_media|play_announcement/);
  ok('Call a room: a ready message in a voice with no recording is spoken live in that voice', sp.some((x) => /demo-robin/.test(x)) && !pl.some((x) => /line-leave/.test(x)), [sp.slice(0, 1), pl.slice(0, 1)]);
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&voice=1&voices=Wren&sheet=settings&pane=house'); await page.waitForTimeout(500);
  const S = page.locator('fh-settings'), box = S.locator('[data-voice]');
  ok('Settings, House has "The house voice" with every named voice', await box.count() === 1 && (await box.getByRole('button').allInnerTexts()).join(',') === 'Wren,Robin', await box.getByRole('button').allInnerTexts().catch(() => []));
  ok('the one in use is marked, and its recordings are mentioned', await box.getByRole('button', { name: 'Wren' }).getAttribute('aria-pressed') === 'true' && /Wren has recordings/.test(await box.innerText()));
  await box.getByRole('button', { name: 'Robin' }).click(); await page.waitForTimeout(250);
  const d = await page.evaluate(() => { const v = document.querySelector('family-hub-card').shadowRoot.querySelector('fh-settings')._draft.voice; return [v.use, v.voices.length, v.voices[0].files]; });
  ok('choosing another changes only which is in use: both voices and the first one’s recordings stay', d[0] === 'Robin' && d[1] === 2 && /line-\{line\}/.test(d[2]), d);
  ok('and the words say this one is spoken fresh', /Robin has no recordings/.test(await box.innerText()));
  await page.context().close(); }
{ const page = await open('look=glass&page=planner&voice=1');
  ok('with no list of voices Settings shows no choice', await page.evaluate(async () => { const c = document.querySelector('family-hub-card'); c._sheet = 'settings'; await c.updateComplete; await new Promise((r) => setTimeout(r, 500)); return !c.shadowRoot.querySelector('fh-settings')?.shadowRoot?.querySelector('[data-voice]') && !c.shadowRoot.querySelector('fh-settings')?.querySelector?.('[data-voice]'); }));
  const bad = await page.evaluate(() => { const el = document.createElement('family-hub-card'), c = document.querySelector('family-hub-card')._config; const t = (v) => { try { el.setConfig({ ...c, voice: { tts: 'tts.x', ...v } }); return ''; } catch (e) { return String(e.message); } };
    return [t({ voices: [] }), t({ voices: [{ name: 'A' }] }), t({ voices: [{ name: 'A', voice: '1' }, { name: 'a', voice: '2' }] }), t({ voices: [{ name: 'A', voice: '1' }], use: 'B' }), t({ sync: { voice: 'sensor.x' } }), t({ voices: [{ name: 'A', voice: '1', files: 'm-{line}.mp3' }, { name: 'B', voice: '2' }], use: 'B', sync: { voice: 'input_text.a', files: 'input_text.b', pipeline: true } })]; });
  ok('a list of voices that cannot work is refused in words; a good one is accepted', bad.slice(0, 5).every((m) => /^Family Hub: /.test(m)) && bad[5] === '', bad);
  await page.context().close(); }

console.log(`\n${pass} passed, ${fails.length} failed${errs.length ? `, ${errs.length} page errors` : ''}`);
if (errs.length) console.log('page errors:\n - ' + [...new Set(errs)].slice(0, 8).join('\n - '));
await browser.close(); srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
