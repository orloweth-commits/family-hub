/* ------------------------------------------------------------------ *
 * The family jar, as both its cards draw it (a child's page and the planner's rail, polish batch 4d).
 *
 * One drawing (a glass jar that fills), one count for today (the jar as it stood at midnight, from Home Assistant's
 * history: one family total, never whose marbles they were), and the rule in words. The midnight reading is asked
 * for once a day per screen and kept (house.ts), so it is still there while Home Assistant is away.
 * ------------------------------------------------------------------ */
import { html, type TemplateResult } from 'lit';
import { houseUp, keep, kept } from './house';
import type { Hass } from './types';

export const JAR = 'input_number.family_jar';
/** The rule, in the words both cards use. */
export const JAR_RULE = 'Every family job adds a marble.';

/** The jar, filled to `f` (0 to 1). `id` names its clip, which must be unique within one shadow root. */
export const jarPic = (f: number, w = 34, h = 42, id = 'jc'): TemplateResult => {
  const k = Math.max(0, Math.min(1, f));
  return html`<svg width=${w} height=${h} viewBox="0 0 48 60" aria-hidden="true"><rect x="8" y="2" width="32" height="7" rx="3" fill="var(--ink3)"></rect>
    <path d="M6 12 H42 V52 a6 6 0 0 1 -6 6 H12 a6 6 0 0 1 -6 -6 Z" fill="var(--chip-strong)" stroke="var(--ink3)" stroke-width="2"></path>
    <clipPath id=${id}><path d="M8 14 H40 V52 a4 4 0 0 1 -4 4 H12 a4 4 0 0 1 -4 -4 Z"></path></clipPath>
    <rect clip-path="url(#${id})" x="6" y=${58 - 44 * k} width="36" height=${44 * k} fill="var(--accent)" style="transition:y var(--mt-5, 900ms) var(--e-out, ease), height var(--mt-5, 900ms) var(--e-out, ease)"></rect></svg>`;
};

type Base = { day: string; v: number };
let asking: Promise<void> | null = null, askedFor = '', retryAt = 0;
/**
 * The jar as it stood at midnight on `day` (YYYY-MM-DD), or null when it is not known (no history, or not yet read).
 * The first call of a day asks Home Assistant once for the whole screen; `then` runs when the answer is in.
 */
export function jarBase(hass: Hass | undefined, day: string, then?: () => void): number | null {
  const k = kept<Base>('jar-base');
  if (k && k.v.day === day) return k.v.v;
  if (hass?.states[JAR] && !asking && (askedFor !== day || (retryAt && Date.now() >= retryAt))) {
    askedFor = day; retryAt = 0;
    asking = (async () => {
      try {
        const a = new Date(); a.setHours(0, 0, 0, 0);
        const r = await hass.callWS<Record<string, { s?: string; state?: string }[]>>({ type: 'history/history_during_period', start_time: a.toISOString(), entity_ids: [JAR], minimal_response: true, no_attributes: true, significant_changes_only: false });
        const first = r?.[JAR]?.[0], v = Number(first?.s ?? first?.state);
        if (Number.isFinite(v)) keep<Base>('jar-base', { day, v });
      } catch { if (!houseUp()) retryAt = Date.now() + 60_000; /* Home Assistant away: asked again a minute later. No history at all: not asked again today, and the card simply does not say how many */ }
      asking = null;
      then?.();
    })();
  }
  return null;
}
/** How many marbles have gone in today, or 0 when that is not known. */
export const jarAdded = (now: number, base: number | null): number => (base === null ? 0 : Math.max(0, Math.round(now - base)));
