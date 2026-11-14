// Guards the type scale (the --fs-* steps at the top of src/styles.ts): six sizes for words, five for numerals and pictures.
// A font-size anywhere in src/ must name a step. The few that may not are listed here with the reason, so a new size is a decision.
//   * sizes worked out from the space there is: clamp(), calc(), a ${…} in a template, a look's own token
//   * the four clock and picture heroes above the scale, and two labels on Orbit's day ring at phone size
import fs from 'node:fs'; import path from 'node:path';
const dir = new URL('../src/', import.meta.url).pathname;
const ALLOW = new Set(['112', '124', '148', '168', '10.5', '9.5']);
const errors = []; const steps = new Set();
for (const f of fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.ts'))) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const m of src.matchAll(/font-size:\s*([^;}"'`<]+)/g)) {
    const v = m[1].trim(), line = src.slice(0, m.index).split('\n').length;
    const px = /^(\d+(?:\.\d+)?)px/.exec(v);
    if (px && !ALLOW.has(px[1])) errors.push(`${f}:${line}: font-size ${px[1]}px is not a step of the scale – use var(--fs-1 … --fs-6) for words, var(--fs-d1 … --fs-d5) for numerals and pictures`);
    for (const s of v.matchAll(/var\(--(fs-d?\d)\)/g)) steps.add(s[1]);
  }
  for (const m of src.matchAll(/var\(--(fs-[\w-]+)/g)) if (!/^fs-(d[1-5]|[1-6])$/.test(m[1])) errors.push(`${f}: --${m[1]} is not a step of the scale`);
}
if (errors.length) { console.error(`Type check failed:\n - ${errors.join('\n - ')}`); process.exit(1); }
console.log(`Type check passed: ${steps.size} steps in use (${[...steps].sort().join(', ')}).`);
