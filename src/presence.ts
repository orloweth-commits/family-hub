/* ------------------------------------------------------------------ *
 * "Is someone in front of the panel?", from the screen's own camera.
 * Everything happens in this browser: a tiny picture (48 x 36) is taken
 * twice a second, compared with the one before, and thrown away. No
 * picture is kept, uploaded or sent to Home Assistant; all that leaves
 * this file is "something moved" (true or false) and how much.
 * ------------------------------------------------------------------ */

/** Why the camera cannot be used, in a word; Settings turns each into a sentence. */
export type CamFault = '' | 'insecure' | 'nocamera' | 'denied' | 'busy';
export interface CamOptions { /** 1 (only big movement) to 10 (the slightest) */ sensitivity?: number; /** per cent of each edge of the picture to ignore */ margin?: number }

const W = 48, H = 36, EVERY = 500;
/** the share of the watched area that must change for "something moved": from 8 % at sensitivity 1 down to 0.4 % at 10 */
export const threshold = (sensitivity = 5): number => 0.08 * Math.pow(0.05, (Math.max(1, Math.min(10, sensitivity)) - 1) / 9);
/** How much of the watched area differs between two grey pictures (0 to 1). Exported for the tests. */
export const moved = (a: Uint8ClampedArray | Uint8Array, b: Uint8ClampedArray | Uint8Array, w = W, h = H, margin = 10): number => {
  const mx = Math.min(w / 2 - 1, Math.round((w * Math.max(0, margin)) / 100)), my = Math.min(h / 2 - 1, Math.round((h * Math.max(0, margin)) / 100));
  let n = 0, all = 0;
  for (let y = my; y < h - my; y++) for (let x = mx; x < w - mx; x++) { const i = y * w + x; all++; if (Math.abs(a[i] - b[i]) > 22) n++; }
  return all ? n / all : 0;
};
export const cameraFault = (): CamFault => (!window.isSecureContext ? 'insecure' : !navigator.mediaDevices?.getUserMedia ? 'nocamera' : '');

export class CameraWatch {
  fault: CamFault = '';
  /** how much moved in the last look (0 to 1), for the meter in Settings */
  level = 0;
  /** the live picture, for the preview in Settings only */
  video?: HTMLVideoElement;
  private _stream?: MediaStream; private _t?: number; private _last?: Uint8ClampedArray; private _ctx?: CanvasRenderingContext2D | null;
  constructor(private opts: () => CamOptions, private onMove: (level: number) => void, private onState: () => void = () => {}) {}
  get running(): boolean { return !!this._stream; }
  async start(): Promise<void> {
    if (this._stream || this._starting) return;
    this.fault = cameraFault();
    if (this.fault) { this.onState(); return; }
    this._starting = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 5, max: 10 } }, audio: false });
      if (this._stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
      this._stream = stream;
      const v = this.video = document.createElement('video'); v.muted = true; v.playsInline = true; v.srcObject = stream; await v.play().catch(() => {});
      const c = document.createElement('canvas'); c.width = W; c.height = H; this._ctx = c.getContext('2d', { willReadFrequently: true });
      this._t = window.setInterval(() => this._look(), EVERY);
    } catch (e) {
      const n = (e as { name?: string })?.name ?? '';
      this.fault = n === 'NotAllowedError' || n === 'SecurityError' ? 'denied' : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'nocamera' : 'busy';
    } finally { this._starting = false; this.onState(); }
  }
  private _starting = false; private _stopped = false;
  private _look(): void {
    const g = this._ctx, v = this.video;
    if (!g || !v || v.readyState < 2) return;
    g.drawImage(v, 0, 0, W, H);
    const px = g.getImageData(0, 0, W, H).data, grey = new Uint8ClampedArray(W * H);
    for (let i = 0; i < grey.length; i++) grey[i] = (px[i * 4] * 3 + px[i * 4 + 1] * 6 + px[i * 4 + 2]) / 10;
    const o = this.opts();
    if (this._last) { this.level = moved(this._last, grey, W, H, o.margin ?? 10); if (this.level >= threshold(o.sensitivity)) this.onMove(this.level); }
    this._last = grey;
  }
  stop(): void {
    this._stopped = true; clearInterval(this._t); this._t = undefined;
    this._stream?.getTracks().forEach((t) => t.stop()); this._stream = undefined;
    if (this.video) { this.video.srcObject = null; this.video = undefined; }
    this._last = undefined; this.level = 0;
  }
}
