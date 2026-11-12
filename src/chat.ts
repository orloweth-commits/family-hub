import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import type { Hass } from './types';
import { keyboard, keysCss, typeKey } from './keys';
import { getShape, hush, say, sfx } from './util';

/* ------------------------------------------------------------------ *
 * Ask: a chat with an AI helper, for the children. The helper's own
 * instructions (what it may talk about, how it speaks to a child) live in
 * Home Assistant, on the conversation agent. This component only sends the
 * child's words (typed, tapped or spoken) and shows the answer: no names,
 * no location, nothing about the house.
 * ------------------------------------------------------------------ */

interface Bubble { id: number; from: 'child' | 'helper'; text: string; calm?: boolean }
interface LogEntry { q: string; a: string; t: number }
interface ConvResult { conversation_id?: string | null; response?: { speech?: { plain?: { speech?: string } } } }
interface PipeEvent { type: string; data?: Record<string, any> }

const STARTERS: [string, string][] = [
  ['😂', 'Tell me a joke'], ['📖', 'Tell me a short story'], ['🐨', 'Tell me an animal fact'],
  ['🚀', 'Tell me a space fact'], ['🎲', 'Play a guessing game'], ['🌤️', 'Why is the sky blue?']
];
const SORRY = 'I could not get an answer just now. Try again in a moment.';
const NOT_HEARD = 'I did not hear anything. Tap and try again.';
const NO_MIC = 'I cannot use the microphone on this screen. You can still type.';
const MAX_CHARS = 300, ANSWER_MS = 20_000, LISTEN_MS = 15_000, IDLE_MS = 180_000;

/* ---------------- the grown-ups' record: the last 30 questions and answers, on this panel only ---------------- */
const LOG_KEY = 'fh-chat-log', LOG_MAX = 30;
const readLog = (): LogEntry[] => { try { const l = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch { return []; } };
const addLog = (q: string, a: string): void => { try { localStorage.setItem(LOG_KEY, JSON.stringify([...readLog(), { q, a, t: Date.now() }].slice(-LOG_MAX))); } catch { /* storage unavailable */ } };
const clearLog = (): void => { try { localStorage.removeItem(LOG_KEY); } catch { /* storage unavailable */ } };

/** Answers are read by children and read aloud: drop the markdown marks a language model likes to add. */
const plain = (s: unknown): string => String(s ?? '').replace(/[*_#`]+/g, '').replace(/[ \t]+\n/g, '\n').trim();
/** A promise that gives up after `ms`, so a call that never answers cannot leave the helper thinking for ever. */
const within = <T>(p: Promise<T>, ms: number): Promise<T> => new Promise<T>((ok, no) => { const t = window.setTimeout(() => no(new Error('timeout')), ms); p.then((v) => { clearTimeout(t); ok(v); }, (e) => { clearTimeout(t); no(e); }); });

/* ---------------- microphone: capture, 16 kHz mono 16-bit PCM, framed for Home Assistant's Assist pipeline ---------------- */
/** Browsers only hand out the microphone on a secure page (https, or the companion app). */
export const canListen = (): boolean => { try { return !!window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia === 'function'; } catch { return false; } };
const openMic = (): Promise<MediaStream> => navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
/** Float samples at any rate → 16 kHz 16-bit PCM (each output sample is the average of the input samples it covers). */
export const toPcm16k = (samples: Float32Array, rate: number): Int16Array => {
  const step = Math.max(1, rate / 16000), n = Math.floor(samples.length / step), out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * step), b = Math.max(a + 1, Math.min(samples.length, Math.floor((i + 1) * step)));
    let sum = 0; for (let j = a; j < b; j++) sum += samples[j];
    const v = Math.max(-1, Math.min(1, sum / (b - a)));
    out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  return out;
};
/** One binary websocket frame: the pipeline's handler id, then the sound. With no sound it means "that is all". */
export const audioFrame = (handlerId: number, pcm?: Int16Array): Uint8Array => {
  const out = new Uint8Array(1 + (pcm?.byteLength ?? 0));
  out[0] = handlerId;
  if (pcm) out.set(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength), 1);
  return out;
};
/** Starts capturing; `onPcm` gets each chunk. Returns the function that stops it and lets go of the microphone. */
const startCapture = (stream: MediaStream, onPcm: (pcm: Int16Array) => void): (() => void) => {
  const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  let ac: AudioContext;
  try { ac = new AC({ sampleRate: 16000 }); } catch { ac = new AC(); }
  const src = ac.createMediaStreamSource(stream);
  // a ScriptProcessor is old-fashioned but needs no second file, and the wall tablets' browsers all have it
  const tap = ac.createScriptProcessor(2048, 1, 1), mute = ac.createGain();
  mute.gain.value = 0;
  tap.onaudioprocess = (e) => { try { onPcm(toPcm16k(e.inputBuffer.getChannelData(0), ac.sampleRate)); } catch { /* one lost chunk */ } };
  src.connect(tap); tap.connect(mute); mute.connect(ac.destination);
  if (ac.state === 'suspended') ac.resume().catch(() => { /* stays silent */ });
  return () => {
    try { tap.onaudioprocess = null; src.disconnect(); tap.disconnect(); mute.disconnect(); } catch { /* already apart */ }
    releaseMic(stream);
    try { ac.close().catch(() => { /* already closed */ }); } catch { /* already closed */ }
  };
};
const releaseMic = (stream: MediaStream | null | undefined): void => { try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* already stopped */ } };

export class FhChat extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, keysCss, css`
    :host { display: flex; gap: 18px; flex: 1; min-height: 0; }
    .conv { flex: 2 1 0; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
    .thread { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 24px; background: var(--chip-soft, var(--chip)); overscroll-behavior: contain; }
    .thread > :first-child { margin-top: auto; }
    .bubble { max-width: 80%; padding: 13px 18px; border-radius: 24px; border-bottom-left-radius: 8px; align-self: flex-start; background: var(--chip-strong); color: var(--ink); font-size: 20px; line-height: 1.4; font-weight: 500; white-space: pre-wrap; overflow-wrap: anywhere; animation: fhc-in var(--m-3, 240ms) var(--e-out, ease) both; }
    .bubble.asker { align-self: flex-end; border-radius: 24px; border-bottom-right-radius: 8px; background: var(--primary); color: var(--on-primary); }
    .bubble.wait { display: inline-flex; gap: 8px; align-items: center; min-height: 28px; padding: 18px 20px; }
    .bubble.wait i { width: 12px; height: 12px; border-radius: 50%; background: currentColor; opacity: .7; animation: fhc-bounce 1.1s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); animation-play-state: var(--motion, running); }
    .bubble.wait i:nth-child(2) { animation-delay: .15s; } .bubble.wait i:nth-child(3) { animation-delay: .3s; }
    @keyframes fhc-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes fhc-bounce { 0%, 60%, 100% { transform: none; } 30% { transform: translateY(-7px); } }
    @keyframes fhc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--danger) 55%, transparent); } 50% { box-shadow: 0 0 0 16px color-mix(in srgb, var(--danger) 0%, transparent); } }
    .send { display: flex; gap: 10px; align-items: center; }
    .field { flex: 1; min-width: 0; height: 56px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 22px; font-weight: var(--w-semi, 600); color: var(--ink); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); }
    .field::placeholder { color: var(--ink2); font-weight: 500; }
    .send .lead { height: 56px; padding: 0 26px; font-size: 18px; }
    button[disabled] { opacity: .45; }
    .pill.opt[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-bold, 700); }
    .keys { align-items: center; }
    .ctl { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
    .voice { display: flex; align-items: center; gap: 16px; min-height: 100px; }
    .talk { width: 96px; height: 96px; border-radius: 50%; flex-shrink: 0; background: var(--primary); color: var(--on-primary); display: inline-flex; align-items: center; justify-content: center; }
    .talk[aria-pressed='true'] { background: var(--danger); color: #fff; animation: fhc-pulse 1.4s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); animation-play-state: var(--motion, running); }
    .voice b { font-size: 20px; font-weight: var(--w-bold, 700); line-height: 1.25; }
    .nomic { font-size: 15px; font-weight: 500; line-height: 1.35; color: var(--ink2); padding: 10px 14px; border-radius: 16px; background: var(--chip-soft, var(--chip)); }
    .starters { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .starter { display: flex; align-items: center; gap: 10px; min-height: 72px; padding: 8px 12px; border-radius: 20px; background: var(--chip-strong); color: var(--ink); text-align: left; font-size: 15px; line-height: 1.2; font-weight: var(--w-semi, 600); }
    .starter span { font-size: 40px; line-height: 1; width: 44px; flex-shrink: 0; text-align: center; }
    .opts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; }
    .opts .pill { font-size: 15px; }
    .small { font-size: 13px; line-height: 1.35; color: var(--ink2); }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    .rec { display: flex; flex-direction: column; gap: 4px; padding: 10px 14px; border-radius: 16px; background: var(--chip-strong); font-size: 16px; line-height: 1.35; }
    .rec .small { font-weight: var(--w-semi, 600); }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .conv { flex: 1 1 0; min-height: 0; }
    :host([data-shape='tall']) .ctl { flex: 0 0 auto; }
    :host([data-shape='tall']) .starters { grid-template-columns: repeat(3, 1fr); }
    :host([data-shape='tall']) .opts { margin-top: 0; }
    :host([data-phone]) { flex: none; gap: 14px; }
    :host([data-phone]) .conv { flex: none; }
    :host([data-phone]) .thread { flex: none; height: 42vh; min-height: 220px; padding: 12px; border-radius: 18px; }
    :host([data-phone]) .bubble { max-width: 88%; }
    :host([data-phone]) .starters { grid-template-columns: 1fr 1fr; }
    :host([data-phone]) .send .lead { padding: 0 18px; }
    :host([data-phone]) .keys, :host([data-phone]) .kb { display: none; }
  `];

  static properties = {
    agent: {}, pipeline: {}, helper: {}, pin: { type: Boolean },
    _bubbles: { state: true }, _typed: { state: true }, _caps: { state: true }, _keys: { state: true }, _busy: { state: true }, _listening: { state: true }, _read: { state: true }, _grown: { state: true }, _log: { state: true }
  };

  /** not reactive: nothing here is drawn from Home Assistant's state */
  hass?: Hass;
  agent = '';
  pipeline = '';
  helper = 'Ask';
  /** true when the panel has a parent PIN: the grown-ups' record then sits behind it */
  pin = false;
  private _bubbles: Bubble[] = [];
  private _typed = '';
  private _caps = true;
  private _keys = false;
  private _busy = false;
  private _listening = false;
  private _read = true;
  private _grown = false;
  private _log: LogEntry[] = [];
  private _cid: string | undefined;
  private _n = 0;
  /** goes up whenever the conversation is cleared or the sheet closes, so a late answer is dropped */
  private _gen = 0;
  private _idleT = 0;
  private _voice: { stop?: () => void; unsub?: Promise<() => unknown>; handler?: number; held: Int16Array[]; listenT?: number; waitT?: number; heard?: string; reply?: string; spoke?: boolean; done?: boolean } | null = null;
  private _audio: HTMLAudioElement | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('pointerdown', this._poke, { capture: true }); this.addEventListener('keydown', this._poke, { capture: true });
    this._poke();
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerdown', this._poke, { capture: true }); this.removeEventListener('keydown', this._poke, { capture: true });
    clearTimeout(this._idleT);
    this._reset();
  }
  protected updated(c: PropertyValues): void {
    if (c.has('_bubbles') || c.has('_busy') || c.has('_keys')) { const t = this.renderRoot.querySelector('.thread'); if (t) t.scrollTop = t.scrollHeight; }
  }

  /** Three minutes without a touch or an answer: the sheet closes itself and the conversation is gone. */
  private _poke = (): void => { clearTimeout(this._idleT); this._idleT = window.setTimeout(() => this.dispatchEvent(new CustomEvent('close')), IDLE_MS); };
  private _add(from: Bubble['from'], text: string, calm = false): void { this._bubbles = [...this._bubbles, { id: ++this._n, from, text, calm }]; this._poke(); }
  private _quiet(): void { hush(); try { this._audio?.pause(); } catch { /* not playing */ } this._audio = null; }
  /** Forgets the conversation: the bubbles, the thread with the helper, anything being said or heard. */
  private _reset(): void {
    this._gen++; this._quiet(); this._endVoice();
    this._bubbles = []; this._cid = undefined; this._busy = false; this._typed = ''; this._caps = true;
  }

  // ---------- typed and tapped questions ----------
  private async _ask(raw: string): Promise<void> {
    const text = raw.trim().slice(0, MAX_CHARS);
    if (!text || this._busy || !this.hass || !this.agent) return;
    const gen = this._gen;
    this._busy = true; this._grown = false; this._typed = ''; this._caps = true;
    this._quiet(); sfx('tap');
    this._add('child', text);
    let reply = '';
    try {
      const r = await within(this.hass.callWS<ConvResult>({ type: 'conversation/process', text, agent_id: this.agent, conversation_id: this._cid, language: 'en-AU' }), ANSWER_MS);
      if (gen !== this._gen) return;
      reply = plain(r?.response?.speech?.plain?.speech);
      if (r?.conversation_id) this._cid = r.conversation_id;
      if (!reply) throw new Error('no answer');
      this._add('helper', reply);
      if (this._read) say(reply);
    } catch (e) {
      if (gen !== this._gen) return;
      console.warn('Family Hub: the helper did not answer', e);
      this._add('helper', SORRY, true);
    } finally {
      if (gen === this._gen) { this._busy = false; addLog(text, reply); }
    }
  }
  private _press(k: string): void { [this._typed, this._caps] = typeKey(this._typed, k, this._caps); this._typed = this._typed.slice(0, MAX_CHARS); }

  // ---------- spoken questions: Home Assistant's Assist pipeline, speech to text → the helper → text to speech ----------
  private async _talk(): Promise<void> {
    if (this._listening) { this._stopListening(); return; }
    if (this._busy || !this.hass?.connection || !this.pipeline) return;
    const gen = this._gen, v: NonNullable<FhChat['_voice']> = { held: [] };
    this._busy = true; this._listening = true; this._grown = false; this._voice = v;
    this._quiet();
    let stream: MediaStream | null = null;
    try {
      stream = await openMic();
      if (gen !== this._gen || this._voice !== v) { releaseMic(stream); return; }
      v.stop = startCapture(stream, (pcm) => this._sendPcm(v, pcm));
      v.listenT = window.setTimeout(() => this._stopListening(), LISTEN_MS);
      v.unsub = this.hass.connection.subscribeMessage<PipeEvent>((e) => { try { this._onPipe(v, e); } catch (err) { console.warn('Family Hub: voice event', err); } },
        { type: 'assist_pipeline/run', start_stage: 'stt', end_stage: 'tts', input: { sample_rate: 16000 }, pipeline: this.pipeline, conversation_id: this._cid });
      await v.unsub;
    } catch (e) {
      console.warn('Family Hub: could not start listening', e);
      if (!v.stop) releaseMic(stream);
      if (gen === this._gen && this._voice === v) { this._endVoice(); this._add('helper', stream ? SORRY : NO_MIC, true); }
    }
  }
  /** Sends one chunk of sound; chunks wait (a few seconds at most) until the pipeline has said where to send them. */
  private _sendPcm(v: NonNullable<FhChat['_voice']>, pcm: Int16Array): void {
    if (this._voice !== v || !this._listening) return;
    if (v.handler === undefined) { if (v.held.length < 40) v.held.push(pcm); return; }
    try { this.hass?.connection?.socket?.send(audioFrame(v.handler, pcm)); } catch { /* the socket is reconnecting */ }
  }
  /** The child tapped again, the pipeline heard the end of the sentence, or 15 seconds are up: let go of the microphone and say "that is all". */
  private _stopListening(): void {
    const v = this._voice;
    if (!v || !this._listening) return;
    this._listening = false;
    clearTimeout(v.listenT);
    try { v.stop?.(); } catch { /* already stopped */ } v.stop = undefined;
    if (v.handler !== undefined) { try { this.hass?.connection?.socket?.send(audioFrame(v.handler)); } catch { /* the socket is reconnecting */ } }
    // the answer still has to come: give it the same 20 seconds a typed question gets
    v.waitT = window.setTimeout(() => { if (this._voice === v) { this._endVoice(); this._add('helper', SORRY, true); } }, ANSWER_MS);
  }
  private _onPipe(v: NonNullable<FhChat['_voice']>, e: PipeEvent): void {
    if (this._voice !== v) return;
    const d = e.data ?? {};
    this._poke();
    switch (e.type) {
      case 'run-start': {
        const id = d.runner_data?.stt_binary_handler_id;
        if (typeof id === 'number') { v.handler = id; const held = v.held; v.held = []; for (const pcm of held) this._sendPcm(v, pcm); }
        break;
      }
      case 'stt-end': {
        this._stopListening();
        v.heard = String(d.stt_output?.text ?? '').trim().slice(0, MAX_CHARS);
        if (v.heard) this._add('child', v.heard);
        break;
      }
      case 'intent-end': {
        const out = d.intent_output ?? {};
        if (out.conversation_id) this._cid = out.conversation_id;
        v.reply = plain(out.response?.speech?.plain?.speech);
        if (v.reply) this._add('helper', v.reply); else this._add('helper', SORRY, true);
        break;
      }
      case 'tts-end': {
        const url = d.tts_output?.url;
        if (url && this._read && v.reply) { v.spoke = true; this._play(String(url)); }
        break;
      }
      case 'error': {
        console.warn('Family Hub: voice pipeline', d.code, d.message);
        if (!v.reply) this._add('helper', d.code === 'stt-no-text-recognized' ? NOT_HEARD : SORRY, true);
        v.done = true; this._endVoice();
        break;
      }
      case 'run-end': {
        // the pipeline made no speech of its own (no voice set up): the panel reads the answer instead
        if (v.reply && this._read && !v.spoke) say(v.reply);
        v.done = true; this._endVoice();
        break;
      }
    }
  }
  /** Plays the pipeline's spoken answer. A path from Home Assistant is made into a full address first. */
  private _play(url: string): void {
    try {
      const a = new Audio(/^https?:/.test(url) ? url : this.hass?.hassUrl ? this.hass.hassUrl(url) : url);
      this._audio = a;
      a.play().catch((e) => console.warn('Family Hub: could not play the answer', e));
    } catch (e) { console.warn('Family Hub: could not play the answer', e); }
  }
  /** Always safe to call: stops the microphone, the timers and the subscription, and records what was said. */
  private _endVoice(): void {
    const v = this._voice;
    if (!v) return;
    this._voice = null; this._listening = false; this._busy = false;
    clearTimeout(v.listenT); clearTimeout(v.waitT);
    try { v.stop?.(); } catch { /* already stopped */ }
    v.unsub?.then((u) => Promise.resolve(u()).catch(() => { /* already unsubscribed */ })).catch(() => { /* never subscribed */ });
    if (v.heard) addLog(v.heard, v.reply ?? '');
  }

  // ---------- the grown-ups' record ----------
  private _openLog(): void {
    const run = (): void => { this._log = readLog().reverse(); this._grown = true; };
    if (this.pin) this.dispatchEvent(new CustomEvent('pin', { detail: { reason: 'See what was asked?', run } })); else run();
  }

  render(): TemplateResult {
    const voice = !!this.pipeline && canListen(), last = [...this._bubbles].reverse().find((b) => b.from === 'helper');
    const thinking = this._busy && !this._listening, phone = getShape() === 'phone';
    return html`
      <div class="conv">
        ${this._grown ? this._logView() : html`<div class="thread" role="log" aria-label="Conversation" tabindex="0">
          ${!this._bubbles.length ? html`<div class="bubble">Hello! Ask me a question${voice ? ', tap the microphone,' : ''} or tap a picture.</div>` : nothing}
          ${this._bubbles.map((b) => html`<div class="bubble ${b.from === 'child' ? 'asker' : ''}"><span class="sr">${b.from === 'child' ? 'You asked: ' : `${this.helper} said: `}</span>${b.text}</div>`)}
          ${thinking ? html`<div class="bubble wait" role="status" aria-label="Thinking"><i></i><i></i><i></i></div>` : nothing}
        </div>`}
        <div class="sr" aria-live="polite">${last?.text ?? ''}</div>
        <form class="send" @submit=${(e: Event) => { e.preventDefault(); this._ask(this._typed); }}>
          <input class="field" .value=${this._typed} maxlength=${MAX_CHARS} inputmode=${phone ? 'text' : 'none'} enterkeyhint="send" autocomplete="off" autocapitalize="sentences" placeholder="Type a question…" aria-label="Your question"
            @focus=${() => { this._keys = true; }} @click=${() => { this._keys = true; }}
            @input=${(e: InputEvent) => { this._typed = (e.target as HTMLInputElement).value.slice(0, MAX_CHARS); }} />
          <button type="button" class="pill tap opt kb" style="height:56px;padding:0 16px" aria-pressed=${String(this._keys)} @click=${() => { this._keys = !this._keys; }}>Keyboard</button>
          <button type="submit" class="tap lead" ?disabled=${this._busy || !this._typed.trim()}>Send</button>
        </form>
        ${this._keys ? keyboard((k) => this._press(k), this._caps, () => { this._caps = !this._caps; }, true) : nothing}
      </div>
      <div class="ctl">
        ${voice ? html`<div class="voice">
          <button class="talk tap" aria-pressed=${String(this._listening)} aria-label=${this._listening ? 'Listening. Tap to stop' : 'Tap to talk'} ?disabled=${this._busy && !this._listening} @click=${() => this._talk()}>${icon('mic', 46)}</button>
          <b aria-hidden="true">${this._listening ? 'Listening… tap to stop' : thinking ? 'Thinking…' : 'Tap to talk'}</b>
        </div>` : this.pipeline ? html`<p class="nomic">Talking needs a secure connection on this screen. You can still type.</p>` : nothing}
        <div class="starters" role="group" aria-label="Things to ask">
          ${STARTERS.map(([pic, label]) => html`<button class="starter tap" ?disabled=${this._busy} @click=${() => this._ask(label)}><span aria-hidden="true">${pic}</span>${label}</button>`)}
        </div>
        <div class="opts">
          <button class="pill tap opt" aria-pressed=${String(this._read)} @click=${() => { this._read = !this._read; if (!this._read) this._quiet(); }}>${this._read ? '🔊' : '🔇'} Read it to me</button>
          <button class="pill tap" @click=${() => { this._reset(); this._grown = false; }}>Start again</button>
          <button class="pill tap opt" aria-pressed=${String(this._grown)} @click=${() => { if (this._grown) this._grown = false; else this._openLog(); }}>For grown-ups</button>
        </div>
        <p class="small">Answers come from an AI helper on the internet. It can be wrong. Ask a grown-up about anything important.</p>
      </div>`;
  }

  private _logView(): TemplateResult {
    const when = (t: number): string => new Date(t).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    return html`<div class="thread" role="region" aria-label="What was asked" tabindex="0" style="gap:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-top:0">
        <div style="flex:1"><b style="font-size:18px">What was asked</b><div class="small">The last ${LOG_MAX} questions and answers, kept on this screen only.</div></div>
        <button class="pill tap" ?disabled=${!this._log.length} @click=${() => { clearLog(); this._log = []; }}>Clear</button>
        <button class="pill tap" @click=${() => { this._grown = false; }}>Back</button>
      </div>
      ${this._log.length ? this._log.map((l) => html`<div class="rec"><span class="small">${when(l.t)}</span><b>${l.q}</b><span>${l.a || 'No answer.'}</span></div>`)
        : html`<div class="empty"><span>Nothing has been asked yet.</span></div>`}
    </div>`;
  }
}

if (!customElements.get('fh-chat')) customElements.define('fh-chat', FhChat);
