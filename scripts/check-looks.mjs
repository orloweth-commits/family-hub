// Guards the contract between the base interface and the looks (see src/looks.ts).
//  1. A look may only style classes listed in HOOKS.
//  2. Every hook must still exist in the base templates or drawings.
//  3. Looks must not select by position (nth-child etc.) or name a page component.
import fs from 'node:fs';
import path from 'node:path';

const dir = new URL('../src/', import.meta.url).pathname;
const looks = fs.readFileSync(path.join(dir, 'looks.ts'), 'utf8');
const list = (name) => [...new RegExp(`${name}: \\[([^\\]]+)\\]`, 's').exec(looks)[1].replace(/\/\/[^\n]*/g, '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
const hooks = new Set([...list('roles'), ...list('parts')]);
const base = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'looks.ts').map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const drawings = looks.slice(0, looks.indexOf('look styles (shared by every component)'));

const errors = [];
for (const [id, tag] of [['FRIDGE', '@F'], ['ORBIT', '@O']]) {
  const css = new RegExp(`const ${id} = \`([\\s\\S]*?)\`;`).exec(looks)[1].replace(/\/\*[\s\S]*?\*\//g, '');
  for (const rule of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    const sel = rule[1].trim();
    if (sel.startsWith('@keyframes') || /^(from|to|\d+%)/.test(sel)) continue;
    if (!sel.includes(tag)) { errors.push(`${id}: rule is not scoped to the look: "${sel}"`); continue; }
    if (/:nth-(last-)?(child|of-type)\((?!even|odd|\d*n)/.test(sel)) errors.push(`${id}: selects by position, use a data-nav/data-act id instead: "${sel}"`);
    for (const m of sel.replace(/\[[^\]]*\]/g, '').matchAll(/\.([a-zA-Z][\w-]*)/g)) {
      if (!hooks.has(m[1])) errors.push(`${id}: ".${m[1]}" is not a hook (add it to HOOKS or use a role): "${sel}"`);
    }
  }
}
for (const h of hooks) {
  const re = new RegExp(`(class=|class \\$\\{|['"\` ])[^<>]*\\b${h.replace('-', '\\-')}\\b`);
  if (!new RegExp(`\\b${h}\\b`).test(base) && !new RegExp(`\\b${h}\\b`).test(drawings.replace(/HOOKS[\s\S]*?\};/, ''))) errors.push(`hook "${h}" no longer exists in the base interface – remove it from HOOKS and from the looks`);
  void re;
}
if (errors.length) { console.error(`Looks check failed:\n - ${errors.join('\n - ')}`); process.exit(1); }
console.log(`Looks check passed: ${hooks.size} hooks, 2 looks.`);
