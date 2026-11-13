// Guards the contract between the base interface and the looks (see the note at the top of src/looks.ts).
//  1. A look may only style classes listed in HOOKS (shared roles, or parts owned by one component).
//  2. A rule may not mix parts from different components, and may not select by position.
//  3. Every hook must still exist: roles somewhere in the base, parts in the component that owns them.
//  4. A look never forces a value with !important: the base keeps sizes and weights in classes and tokens.
import fs from 'node:fs';
import path from 'node:path';

const dir = new URL('../src/', import.meta.url).pathname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const looks = read('looks.ts');
const names = (txt) => [...txt.replace(/\/\/[^\n]*/g, '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
const hooksSrc = /export const HOOKS[\s\S]*?\n\};/.exec(looks)[0];
const roles = new Set(names(/roles: \[([^\]]+)\]/s.exec(hooksSrc)[1]));
const owner = new Map(), partsByTag = {};
for (const m of /parts: \{([\s\S]*)\n  \}/.exec(hooksSrc)[1].matchAll(/'([\w-]+)': \[([^\]]+)\]/g)) {
  partsByTag[m[1]] = names(m[2]);
  for (const n of partsByTag[m[1]]) owner.set(n, [...(owner.get(n) ?? []), m[1]]);
}
const FILES = { 'family-hub-card': 'family-hub.ts', 'fh-kid': 'kid.ts', 'fh-groceries': 'groceries.ts', 'fh-music': ['music.ts', 'musicviews.ts'], 'fh-home': 'home.ts', 'fh-doodle': 'doodle.ts', 'fh-morning': 'morning.ts', 'fh-weather': 'weather.ts', 'fh-studio': 'studio.ts', 'fh-add-event': 'addevent.ts', 'fh-pin': 'pin.ts', 'fh-chat': 'chat.ts' };
const base = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'looks.ts').map(read).join('\n');
const drawings = looks.slice(looks.indexOf('little drawings the looks add'), looks.indexOf('look styles (shared by every component)'));
const has = (txt, n) => new RegExp(`(?<![\\w-])${n}(?![\\w-])`).test(txt);

const errors = [];
for (const [id, tag] of [['GLASS', '@G'], ['FRIDGE', '@F'], ['ORBIT', '@O'], ['SPORTS', '@S']]) {
  const css = new RegExp(`const ${id} = \`([\\s\\S]*?)\`;`).exec(looks)[1].replace(/\/\*[\s\S]*?\*\//g, '');
  if (css.includes('@keyframes')) errors.push(`${id}: keep @keyframes in KEYFRAMES, not in the look's rules`);
  for (const m of css.matchAll(/([^{}]+)\{[^{}]*!important[^{}]*\}/g)) errors.push(`${id}: no !important – if the base sets this inline, move it to a class or a token: "${m[1].trim()}"`);
  for (const rule of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) for (const raw of rule[1].split(',')) {
    const sel = raw.trim();
    // the tag may carry host state and a width limit: @O[data-phone] …, @O<700 …
    if (!new RegExp(`^${tag}(<\\d+)?(\\[[\\w-]+(=[^\\]]*)?\\])*\\s`).test(sel)) { errors.push(`${id}: selector is not scoped to the look: "${sel}"`); continue; }
    if (/:nth-(last-)?(child|of-type)\((?!even|odd|\d*n)/.test(sel)) errors.push(`${id}: selects by position – use a data-nav / data-act id: "${sel}"`);
    let owners = null;
    for (const m of sel.replace(/\[[^\]]*\]/g, '').matchAll(/\.([a-zA-Z][\w-]*)/g)) {
      const n = m[1];
      if (roles.has(n)) continue;
      if (!owner.has(n)) { errors.push(`${id}: ".${n}" is not a hook – use a role or add it to HOOKS: "${sel}"`); continue; }
      owners = owners ? owners.filter((x) => owner.get(n).includes(x)) : owner.get(n);
    }
    if (owners && owners.length !== 1) errors.push(`${id}: parts from ${owners.length ? 'several' : 'different'} components in one selector: "${sel}"`);
  }
}
for (const r of roles) if (!has(base, r)) errors.push(`role "${r}" is no longer used anywhere in the base – remove it from HOOKS and the looks`);
for (const [tag, list] of Object.entries(partsByTag)) {
  const src = FILES[tag] ? [].concat(FILES[tag]).map(read).join('\n') + (tag === 'family-hub-card' ? drawings : '') : '';
  if (!src) errors.push(`HOOKS names an unknown component "${tag}"`);
  for (const n of list) if (!has(src, n)) errors.push(`part "${n}" no longer exists in ${FILES[tag]} – update HOOKS and the looks that style it`);
}
if (errors.length) { console.error(`Looks check failed:\n - ${errors.join('\n - ')}`); process.exit(1); }
console.log(`Looks check passed: ${roles.size} roles, ${owner.size} parts, 4 looks.`);
