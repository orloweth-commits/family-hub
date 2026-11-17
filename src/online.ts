/* ------------------------------------------------------------------ *
 * The few things the panel takes from the internet (the rain radar, the wind map, a voice made in the cloud).
 * Everything else comes from Home Assistant, in the house, so the panel starts and works with the internet down.
 * Those few ask here first whether the internet answers, and say so plainly when it does not.
 * ------------------------------------------------------------------ */

const seen = new Map<string, { at: number; ok: boolean }>();
const KEEP = 60_000;

/**
 * Whether `url`'s site answers, within `ms`. Asked without reading the answer (no-cors), so any site will do; only a
 * failure to connect at all counts as "no". Remembered for a minute per site, so a page drawn twice asks once.
 */
export async function reachable(url: string, ms = 6000): Promise<boolean> {
  let host = url;
  try { host = new URL(url).origin; } catch { /* asked as given */ }
  const was = seen.get(host);
  if (was && Date.now() - was.at < KEEP) return was.ok;
  let ok = false;
  const stop = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = window.setTimeout(() => stop?.abort(), ms);
  try { await fetch(url, { mode: 'no-cors', cache: 'no-store', referrerPolicy: 'no-referrer', signal: stop?.signal }); ok = true; } catch { ok = false; }
  clearTimeout(t);
  seen.set(host, { at: Date.now(), ok });
  return ok;
}
/** Forget what is known (in tests, and when the page is told the network came back). */
export const forgetReach = (): void => seen.clear();
if (typeof window !== 'undefined') window.addEventListener('online', forgetReach);

/** The plain line for a part of the page that needs the internet when it cannot be had. */
export const NO_INTERNET = (what: string): string => `${what} comes from the internet, which is not answering just now. It will try again in a few minutes.`;
