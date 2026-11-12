// Guards the motion grammar (the --m-* tokens in src/styles.ts):
//  1. No `transition: all`: a transition names what it moves.
//  2. No duration literal in an animation or transition. Durations are tokens: --m-1 … --m-5 for fades and colour,
//     --mt-1 … --mt-5 for anything that travels (the same lengths, times --m-d, so calm mode and reduce-motion stop the travel).
//     Allowed literals: looping scenery (a declaration that says `infinite`: it obeys --loops and --motion), everything in
//     src/scenes and src/ambient.ts, linear durations of a second or more that mirror live state (clock hands, progress,
//     a held button), a delay of 100 ms or less after a token duration, and zero (or 1 ms).
import fs from 'node:fs';
import path from 'node:path';

const dir = new URL('../src/', import.meta.url).pathname;
const SKIP = new Set(['ambient.ts']);
const TIME = /(?<![\w.#-])(\d*\.?\d+)(ms|s)\b/g;
/** split on commas that are not inside brackets */
export const segments = (v) => { const out = []; let d = 0, cur = ''; for (const c of v) { if (c === '(') d++; if (c === ')') d--; if (c === ',' && d === 0) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };
/** the declarations of a source text: [property, value, offset of the value] */
export const declarations = (txt) => [...txt.matchAll(/(?<![\w-])(animation|transition)(-duration)?\s*:\s*([^;}"`]*)/g)].map((m) => [m[1] + (m[2] ?? ''), m[3], m.index + m[0].length - m[3].length]);
/** the first literal duration of one segment that the rules do not allow, or null */
export const offender = (seg) => {
  if (/\binfinite\b/.test(seg)) return null;
  const bare = seg.replace(/var\(--mt?-\d\s*(,[^()]*)?\)/g, ' TOKEN ').replace(/\$\{[^}]*\}/g, ' ');
  const times = [...bare.matchAll(new RegExp(`TOKEN|${TIME.source}`, 'g'))];
  for (const [i, t] of times.entries()) {
    if (t[0] === 'TOKEN') continue;
    const ms = Number(t[1]) * (t[2] === 's' ? 1000 : 1);
    if (ms <= 1) continue; // zero, or the 1 ms that reduce-motion forces
    if (i > 0 && ms <= 100) continue; // a short delay after the duration
    if (i === 0 && ms >= 1000 && /\blinear\b/.test(seg)) continue; // mirrors live state
    return t[0];
  }
  return null;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.ts') && !SKIP.has(x))) {
    const txt = fs.readFileSync(path.join(dir, f), 'utf8');
    const line = (at) => txt.slice(0, at).split('\n').length;
    for (const [prop, value, at] of declarations(txt)) {
      if (prop === 'transition' && /(^|,)\s*all\b/.test(value)) errors.push(`${f}:${line(at)} "transition: all": name the properties – ${value.trim().slice(0, 70)}`);
      for (const seg of segments(value)) { const bad = offender(seg); if (bad) errors.push(`${f}:${line(at)} duration literal ${bad} – use a token (--m-1 … --m-5, or --mt-* for travel): ${prop}: ${seg.trim().slice(0, 70)}`); }
    }
  }
  if (errors.length) { console.error(`Motion check failed (${errors.length}):\n - ${errors.join('\n - ')}`); process.exit(1); }
  console.log('Motion check passed: durations are tokens, no "transition: all".');
}
