import { svg, html, nothing, type SVGTemplateResult, type TemplateResult } from 'lit';

/* ------------------------------------------------------------------ *
 * Avatar model, catalogue and renderer.
 * Looks are stored in a Home Assistant input_text as "k=v;k=v" (<255).
 * ------------------------------------------------------------------ */

export interface Look {
  skin: string; hair: string; hairColour: string; eyes: string; mouth: string;
  hat: string; eyewear: string; top: string; topColour: string; gear: string; buddy: string; scene: string;
  /** iris colour; 'none' keeps the classic dark cartoon eyes */
  eyeColour: string; freckles: string; mole: string;
}

export const DEFAULT_LOOK: Look = {
  skin: '#f1c7a5', hair: 'short', hairColour: '#5a3825', eyes: 'normal', mouth: 'smile',
  hat: 'none', eyewear: 'none', top: 'tee', topColour: '#0b5fa5', gear: 'none', buddy: 'none', scene: 'plain',
  eyeColour: 'none', freckles: 'no', mole: 'no'
};

const KEYS: [keyof Look, string][] = [['skin', 's'], ['hair', 'h'], ['hairColour', 'hc'], ['eyes', 'e'], ['mouth', 'm'], ['hat', 'a'], ['eyewear', 'u'], ['top', 't'], ['topColour', 'tc'], ['gear', 'g'], ['buddy', 'b'], ['scene', 'sc'], ['eyeColour', 'ec'], ['freckles', 'fr'], ['mole', 'mo']];
export const encodeLook = (l: Look): string => KEYS.map(([k, s]) => `${s}=${String(l[k]).replace('#', '')}`).join(';');
export const decodeLook = (raw: string | undefined, fallback: Partial<Look> = {}): Look => {
  const out: Look = { ...DEFAULT_LOOK, ...fallback };
  if (!raw || raw === 'unknown' || !raw.includes('=')) return out;
  const map = Object.fromEntries(raw.split(';').map((p) => p.split('=')));
  for (const [k, s] of KEYS) if (map[s]) (out as any)[k] = /colour|skin/i.test(k) && /^[0-9a-f]{3,8}$/i.test(map[s]) ? `#${map[s]}` : map[s];
  return out;
};

/* ---------------- catalogue: [id, label, lifetime points needed] ---------------- */
/** [id, label, lifetime points needed, optional Growing-milestone count (surprise unlock)] */
export type Item = [string, string, number, number?];
export interface Category { id: string; label: string; emoji: string; key: keyof Look; crop: 'head' | 'full'; items: Item[]; swatch?: { key: keyof Look; label: string; items: Item[] } }

export const CATALOGUE: Category[] = [
  { id: 'hair', emoji: '💇', label: 'Hair', key: 'hair', crop: 'head',
    items: [['fringe', 'Side fringe', 0], ['styled', 'Styled spikes', 0], ['crop', 'Textured crop', 0], ['mop', 'Messy mop', 0], ['short', 'Short', 0], ['quiff', 'Styled quiff', 0], ['swept', 'Swept', 0], ['pageboy', 'Page boy', 0], ['spiky', 'Spiky', 0], ['curly', 'Curly', 0], ['buzz', 'Buzz cut', 0], ['surfer', 'Surfer', 300], ['mohawk', 'Mohawk', 1100], ['mullet', 'Mullet', 1600]],
    swatch: { key: 'hairColour', label: 'Colour', items: [['#5a3825', 'Brown', 0], ['#3a2a1f', 'Deep brown', 0], ['#2a1d16', 'Dark brown', 0], ['#a87445', 'Golden brown', 0], ['#b38b55', 'Dirty blond', 0], ['#c49a5c', 'Golden blond', 0], ['#151110', 'Black', 0], ['#e3b85c', 'Blonde', 0], ['#c0592b', 'Ginger', 0], ['#2f6fe0', 'Electric blue', 700], ['#e2559b', 'Hot pink', 1400], ['#22c55e', 'Slime green', 2000]] } },
  { id: 'face', emoji: '🙂', label: 'Face', key: 'eyes', crop: 'head',
    items: [['eyes:normal', 'Bright eyes', 0], ['eyes:happy', 'Happy eyes', 0], ['eyes:wink', 'Wink', 0], ['eyeColour:#5b8db8', 'Blue eyes', 0], ['eyeColour:#6b7f86', 'Grey-blue eyes', 0], ['eyeColour:#7a6a3a', 'Hazel eyes', 0], ['eyeColour:#6b4428', 'Brown eyes', 0], ['eyeColour:none', 'Cartoon eyes', 0],
      ['mouth:smile', 'Smile', 0], ['mouth:cheeky', 'Cheeky grin', 0], ['mouth:grin', 'Big grin', 0], ['mouth:smirk', 'Smirk', 0], ['mouth:wow', 'Wow', 0], ['freckles:yes', 'Freckles', 0], ['freckles:no', 'No freckles', 0]],
    swatch: { key: 'skin', label: 'Skin', items: [['#f6d9c2', 'Skin 1', 0], ['#f1c7a5', 'Skin 2', 0], ['#e0ac84', 'Skin 3', 0], ['#c98b5e', 'Skin 4', 0], ['#8d5a3b', 'Skin 5', 0], ['#5c3a24', 'Skin 6', 0]] } },
  { id: 'hats', emoji: '🧢', label: 'Hats', key: 'hat', crop: 'head',
    items: [['none', 'No hat', 0], ['cap', 'Cap', 0], ['backcap', 'Backwards cap', 60], ['beanie', 'Beanie', 150], ['swimcap', 'Swim cap', 200], ['bucket', 'Bucket hat', 300], ['dinohood', 'Dino hood', 400], ['headphones', 'Headphones', 550], ['knight', 'Knight helm', 750], ['wizard', 'Wizard hat', 900], ['akubra', 'Akubra', 1300], ['crown', 'Crown', 2200], ['helmet', 'Space helmet', 3000]] },
  { id: 'eyewear', emoji: '🕶️', label: 'Sunnies', key: 'eyewear', crop: 'head',
    items: [['none', 'None', 0], ['round', 'Round sunnies', 50], ['zinc', 'Zinc stripe', 100], ['swim', 'Swim goggles', 200], ['aviator', 'Aviators', 650], ['shutter', 'Shutter shades', 1000], ['ski', 'Ski goggles', 1200], ['star', 'Star sunnies', 1700]] },
  { id: 'tops', emoji: '👕', label: 'Tops', key: 'top', crop: 'full',
    items: [['tee', 'T-shirt', 0], ['hoodie', 'Hoodie', 200], ['island', 'Island shirt', 250], ['polo', 'Tennis polo', 300], ['rashie', 'Rashie', 300], ['band', 'Band jacket', 0, 20], ['cloak', 'Hooded cloak', 650], ['footy', 'Footy jumper', 900], ['wetsuit', 'Wetsuit', 1200], ['armour', 'Battle armour', 1800], ['astro', 'Space suit', 3000]],
    swatch: { key: 'topColour', label: 'Colour', items: [['#0b5fa5', 'Blue', 0], ['#1d4ed8', 'Royal blue', 0], ['#38bdf8', 'Sky blue', 0], ['#1e293b', 'Navy', 0], ['#0f766e', 'Teal', 0], ['#16a34a', 'Green', 0], ['#c2410c', 'Orange', 0], ['#be185d', 'Pink', 0], ['#6d28d9', 'Purple', 0], ['#334155', 'Charcoal', 0], ['#f5b301', 'Yellow', 0]] } },
  { id: 'gear', emoji: '🎺', label: 'Gear', key: 'gear', crop: 'full',
    items: [['none', 'Nothing', 0], ['trumpet', 'Trumpet', 0, 5], ['clarinet', 'Clarinet', 0, 5], ['books', 'Book stack', 0, 5], ['racquet', 'Tennis racquet', 150], ['truck', 'Toy truck', 100], ['scooter', 'Scooter', 250], ['bat', 'Cricket bat', 450], ['miniature', 'Painted miniature', 500], ['footy', 'Footy', 700], ['surfboard', 'Surfboard', 850], ['skateboard', 'Skateboard', 1000]] },
  { id: 'buddy', emoji: '🐉', label: 'Buddies', key: 'buddy', crop: 'full',
    items: [['none', 'No buddy', 0], ['quokka', 'Quokka', 350], ['owl', 'Book owl', 0, 15], ['dino', 'Dinosaur', 500], ['turtle', 'Turtle', 700], ['raven', 'Raven', 950], ['dragon', 'Dragon', 1400]] },
  { id: 'scene', emoji: '🏝️', label: 'Scenes', key: 'scene', crop: 'full',
    items: [['plain', 'Sky', 0], ['beach', 'Beach', 0], ['pool', 'Pool', 200], ['court', 'Tennis court', 200], ['library', 'Library', 0, 10], ['rottnest', 'Rottnest', 400], ['sunset', 'Sunset', 500], ['reef', 'Reef', 600], ['volcano', 'Dino valley', 750], ['stadium', 'Stadium', 1000], ['castle', 'Castle', 1100], ['forge', 'Forge', 1500], ['space', 'Space', 2000]] }
];

export interface Unlock { cat: Category; id: string; label: string; req: number; swatch?: boolean }
export const ALL_UNLOCKS: Unlock[] = CATALOGUE.flatMap((c) => [
  ...c.items.filter((i) => i[2] > 0 && !i[3]).map((i) => ({ cat: c, id: i[0], label: i[1], req: i[2] })),
  ...(c.swatch?.items.filter((i) => i[2] > 0).map((i) => ({ cat: c, id: i[0], label: `${i[1]} ${c.id === 'hair' ? 'hair' : ''}`.trim(), req: i[2], swatch: true })) ?? [])
]).sort((a, b) => a.req - b.req);

export const unlocksBetween = (from: number, to: number): Unlock[] => ALL_UNLOCKS.filter((u) => u.req > from && u.req <= to);
/** Growing-milestone surprises, unlocked by count of practice/reading/homework logs. */
export const GROW_UNLOCKS: Unlock[] = CATALOGUE.flatMap((c) => c.items.filter((i) => i[3]).map((i) => ({ cat: c, id: i[0], label: i[1], req: i[3]! })));
export const growBetween = (from: number, to: number): Unlock[] => GROW_UNLOCKS.filter((u) => u.req > from && u.req <= to);
export const isUnlocked = (it: Item, life: number, grow: number): boolean => it[3] ? grow >= it[3] : life >= it[2];

/** Levels on a curve: level n costs 100 + 50(n-1) points. Named ranks, two levels each. */
const RANKS = ['Explorer', 'Ranger', 'Navigator', 'Captain', 'Commander', 'Admiral', 'Legend', 'Mythic', 'Cosmic'];
export interface LevelInfo { level: number; rank: string; into: number; need: number; nextRank: string }
export const levelInfo = (life: number): LevelInfo => {
  let lv = 1, base = 0, cost = 100;
  while (life >= base + cost) { base += cost; lv++; cost = 100 + 50 * (lv - 1); }
  const r = Math.min(RANKS.length - 1, Math.floor((lv - 1) / 2));
  return { level: lv, rank: `${RANKS[r]}${(lv - 1) % 2 ? ' II' : ''}`, into: life - base, need: cost, nextRank: lv % 2 ? `${RANKS[r]} II` : RANKS[Math.min(RANKS.length - 1, r + 1)] };
};
export const nextUnlock = (life: number, favs: string[] = [], goal?: string): Unlock | undefined => {
  if (goal) { const g = ALL_UNLOCKS.find((u) => u.id === goal && u.req > life); if (g) return g; }
  const first = ALL_UNLOCKS.find((u) => u.req > life);
  if (!first) return undefined;
  const fav = ALL_UNLOCKS.filter((u) => u.req > life && favs.includes(u.id)).sort((a, b) => a.req - b.req)[0];
  return fav && fav.req <= first.req + 100 ? fav : first;
};
export const prevThreshold = (life: number): number => ALL_UNLOCKS.filter((u) => u.req <= life).reduce((m, u) => Math.max(m, u.req), 0);
export const level = (life: number): number => levelInfo(life).level;

/** Apply an item (or "eyes:happy" style face item, or a swatch colour) to a look. */
export const applyItem = (look: Look, cat: Category, id: string, swatch = false): Look => {
  if (swatch && cat.swatch) return { ...look, [cat.swatch.key]: id };
  if (id.includes(':')) { const [k, v] = id.split(':'); return { ...look, [k]: v }; }
  return { ...look, [cat.key]: id };
};
export const isWorn = (look: Look, cat: Category, id: string): boolean => {
  if (id.includes(':')) { const [k, v] = id.split(':'); return (look as any)[k] === v; }
  return look[cat.key] === id;
};

/* ---------------- renderer ---------------- */
const star = (cx: number, cy: number, r: number): string => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; p.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`); }
  return `M${p.join(' L')} Z`;
};
const BODY = 'M30 240 C32 190 62 166 100 166 C138 166 168 190 170 240 Z';

type L = (l: Look) => SVGTemplateResult;

const SCENES: Record<string, L> = {
  plain: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#dbeafe"></rect><circle cx="100" cy="120" r="82" fill="#bfdbfe"></circle></g>`,
  beach: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#9fd8f5"></rect><circle cx="162" cy="46" r="18" fill="#ffd166"></circle><rect y="150" width="200" height="40" fill="#3a9ad9"></rect><rect y="168" width="200" height="4" fill="#bfe6f7"></rect><rect y="190" width="200" height="50" fill="#f1d39b"></rect></g>`,
  pool: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#38bdf8"></rect><rect y="40" width="200" height="6" fill="#e0f2fe"></rect><rect y="100" width="200" height="6" fill="#e0f2fe"></rect><rect y="160" width="200" height="6" fill="#e0f2fe"></rect><rect y="70" width="200" height="4" fill="#ef4444" opacity=".7"></rect><rect y="130" width="200" height="4" fill="#ef4444" opacity=".7"></rect><rect y="190" width="200" height="4" fill="#ef4444" opacity=".7"></rect></g>`,
  court: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#2563eb"></rect><rect x="12" y="12" width="176" height="216" fill="none" stroke="#fff" stroke-width="3"></rect><rect x="12" y="118" width="176" height="4" fill="#fff"></rect><rect x="98" y="12" width="4" height="216" fill="#fff" opacity=".6"></rect><circle cx="40" cy="60" r="7" fill="#d9f99d"></circle></g>`,
  library: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#7c2d12"></rect>${[30, 80, 130, 180].map((y) => svg`<rect y=${y + 34} width="200" height="6" fill="#451a03"></rect>${[8, 22, 34, 48, 60, 150, 162, 176, 188].map((x, i) => svg`<rect x=${x} y=${y} width="10" height="34" fill=${['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed'][(i + y) % 5]}></rect>`)}`)}</g>`,
  sunset: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#f7a35c"></rect><rect y="96" width="200" height="144" fill="#e76f51"></rect><circle cx="100" cy="150" r="56" fill="#ffd166"></circle><rect y="190" width="200" height="50" fill="#9c3d54"></rect></g>`,
  reef: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#1aa3b8"></rect><rect y="196" width="200" height="44" fill="#0e7490"></rect><circle cx="30" cy="60" r="6" fill="none" stroke="#d6fbff" stroke-width="2"></circle><circle cx="40" cy="40" r="4" fill="none" stroke="#d6fbff" stroke-width="2"></circle><circle cx="170" cy="80" r="7" fill="none" stroke="#d6fbff" stroke-width="2"></circle><path d="M12 240 C14 214 22 206 28 200 C30 214 26 226 30 240 Z" fill="#fb7185"></path><path d="M176 240 C178 220 186 208 192 204 C194 220 188 230 192 240 Z" fill="#fbbf24"></path></g>`,
  volcano: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#fde68a"></rect><path d="M110 150 L150 40 L170 40 L200 150 Z" fill="#57534e"></path><path d="M150 40 L170 40 L164 70 L156 60 Z" fill="#f97316"></path><circle cx="162" cy="24" r="10" fill="#a8a29e" opacity=".7"></circle><rect y="150" width="200" height="90" fill="#65a30d"></rect><path d="M0 170 C20 150 30 170 40 160 C50 150 60 170 70 158" fill="none" stroke="#3f6212" stroke-width="5"></path></g>`,
  stadium: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#1e293b"></rect><rect y="160" width="200" height="80" fill="#16a34a"></rect><rect y="196" width="200" height="6" fill="#86efac"></rect><circle cx="28" cy="28" r="10" fill="#fff7c2"></circle><circle cx="172" cy="28" r="10" fill="#fff7c2"></circle><rect x="26" y="38" width="4" height="122" fill="#64748b"></rect><rect x="170" y="38" width="4" height="122" fill="#64748b"></rect></g>`,
  castle: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#c7d2fe"></rect><rect x="20" y="70" width="34" height="120" fill="#94a3b8"></rect><rect x="146" y="70" width="34" height="120" fill="#94a3b8"></rect><rect x="20" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="34" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="46" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="146" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="158" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="172" y="60" width="8" height="12" fill="#94a3b8"></rect><path d="M162 60 V30 L180 38 L162 46" fill="#dc2626" stroke="#475569" stroke-width="2"></path><rect y="190" width="200" height="50" fill="#4d7c0f"></rect></g>`,
  rottnest: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#7dd3fc"></rect><rect y="140" width="200" height="50" fill="#22d3ee"></rect><rect y="152" width="200" height="38" fill="#0ea5e9"></rect><path d="M0 190 C40 176 70 184 100 180 C140 174 170 182 200 176 L200 240 L0 240 Z" fill="#fde7b0"></path><rect x="150" y="96" width="10" height="46" fill="#f5f5f4"></rect><path d="M146 96 L164 96 L155 84 Z" fill="#dc2626"></path><circle cx="40" cy="40" r="14" fill="#fde047"></circle></g>`,
  forge: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#292524"></rect><rect y="180" width="200" height="60" fill="#44403c"></rect><path d="M120 180 L130 130 L190 130 L200 180 Z" fill="#57534e"></path><ellipse cx="160" cy="150" rx="22" ry="10" fill="#f97316" class="av-flame"></ellipse><ellipse cx="160" cy="146" rx="12" ry="6" fill="#fde047" class="av-flame"></ellipse><rect x="18" y="40" width="40" height="26" rx="3" fill="#78716c"></rect><rect x="24" y="66" width="6" height="40" fill="#78716c"></rect>${[[30, 20], [80, 30], [176, 24]].map(([x, y]) => svg`<circle cx=${x} cy=${y} r="2" fill="#fb923c"></circle>`)}</g>`,
  space: () => svg`<g class="av-pop"><rect width="200" height="240" fill="#14163a"></rect><circle cx="38" cy="48" r="16" fill="#f0a35e"></circle><ellipse cx="38" cy="48" rx="27" ry="6" fill="none" stroke="#ffd7a8" stroke-width="2.5"></ellipse>${[[150, 30], [176, 74], [120, 18], [20, 120], [182, 140], [70, 22], [14, 190]].map(([x, y]) => svg`<circle cx=${x} cy=${y} r="1.6" fill="#fff"></circle>`)}</g>`
};
const TINT: Record<string, string> = { rottnest: '#7dd3fc', forge: '#57534e', plain: '#dbeafe', beach: '#9fd8f5', pool: '#38bdf8', court: '#2563eb', library: '#7c2d12', sunset: '#f7a35c', reef: '#1aa3b8', volcano: '#fde68a', stadium: '#16a34a', castle: '#c7d2fe', space: '#14163a' };

const GEAR_BEHIND: Record<string, L> = {
  surfboard: () => svg`<g class="av-pop d6"><g transform="rotate(-16 158 150)"><ellipse cx="158" cy="150" rx="17" ry="82" fill="#f97316"></ellipse><rect x="155" y="70" width="6" height="160" fill="#fff" opacity=".85"></rect></g></g>`,
  skateboard: () => svg`<g class="av-pop d6"><g transform="rotate(18 40 160)"><rect x="30" y="90" width="22" height="124" rx="11" fill="#7c3aed"></rect><rect x="34" y="98" width="14" height="108" rx="7" fill="#a78bfa"></rect><circle cx="28" cy="112" r="5" fill="#f5b301"></circle><circle cx="54" cy="112" r="5" fill="#f5b301"></circle><circle cx="28" cy="192" r="5" fill="#f5b301"></circle><circle cx="54" cy="192" r="5" fill="#f5b301"></circle></g></g>`,
  bat: () => svg`<g class="av-pop d6"><g transform="rotate(-24 160 150)"><rect x="152" y="70" width="8" height="40" rx="3" fill="#7c4a1e"></rect><rect x="146" y="106" width="20" height="104" rx="6" fill="#f3d9a4" stroke="#c9a46a" stroke-width="2"></rect></g></g>`,
  racquet: () => svg`<g class="av-pop d6"><g transform="rotate(24 160 120)"><ellipse cx="160" cy="98" rx="24" ry="30" fill="rgba(255,255,255,.25)" stroke="#16a34a" stroke-width="6"></ellipse><path d="M140 98 H180 M160 70 V126 M150 74 V122 M170 74 V122 M142 86 H178 M142 110 H178" stroke="#e5e7eb" stroke-width="1.4"></path><rect x="156" y="128" width="8" height="46" rx="3" fill="#111827"></rect></g><circle cx="182" cy="168" r="9" fill="#d9f99d" stroke="#a3e635" stroke-width="2"></circle></g>`,
  scooter: () => svg`<g class="av-pop d6"><rect x="20" y="118" width="6" height="104" rx="3" fill="#94a3b8" transform="rotate(-8 23 170)"></rect><rect x="6" y="114" width="30" height="7" rx="3.5" fill="#0f172a"></rect><rect x="18" y="220" width="72" height="9" rx="4.5" fill="#ef4444"></rect><circle cx="26" cy="232" r="7" fill="#111"></circle><circle cx="84" cy="232" r="7" fill="#111"></circle></g>`,
  clarinet: () => svg`<g class="av-pop d6"><g transform="rotate(20 150 180)"><rect x="146" y="112" width="10" height="114" rx="4" fill="#1f2937"></rect><rect x="148" y="104" width="6" height="10" rx="2" fill="#111"></rect><path d="M140 224 L162 224 L168 240 L134 240 Z" fill="#111827"></path>${[132, 150, 168, 186, 204].map((y) => svg`<circle cx="151" cy=${y} r="2.6" fill="#d1d5db"></circle>`)}</g></g>`
};
const GEAR_FRONT: Record<string, L> = {
  footy: () => svg`<g class="av-pop d6"><g transform="rotate(-28 150 212)"><ellipse cx="150" cy="212" rx="24" ry="15" fill="#b91c1c"></ellipse><path d="M140 212 H160 M144 208 V216 M150 208 V216 M156 208 V216" stroke="#fff" stroke-width="2" stroke-linecap="round"></path></g></g>`,
  trumpet: () => svg`<g class="av-pop d6"><g transform="rotate(-18 150 206)"><rect x="104" y="202" width="66" height="8" rx="3" fill="#e0a800"></rect><path d="M166 190 L192 178 L192 234 L166 222 Z" fill="#f5c400" stroke="#c99700" stroke-width="1.5"></path><rect x="124" y="190" width="6" height="13" rx="2" fill="#c99700"></rect><rect x="134" y="190" width="6" height="13" rx="2" fill="#c99700"></rect><rect x="144" y="190" width="6" height="13" rx="2" fill="#c99700"></rect><rect x="98" y="200" width="8" height="12" rx="3" fill="#a16207"></rect></g></g>`,
  books: () => svg`<g class="av-pop d6"><rect x="36" y="214" width="56" height="12" rx="2" fill="#f59e0b"></rect><rect x="32" y="202" width="56" height="12" rx="2" fill="#dc2626"></rect><rect x="38" y="190" width="50" height="12" rx="2" fill="#2563eb"></rect><rect x="34" y="178" width="54" height="12" rx="2" fill="#16a34a"></rect><rect x="40" y="181" width="40" height="2" fill="#bbf7d0"></rect><rect x="38" y="205" width="40" height="2" fill="#fecaca"></rect></g>`,
  truck: () => svg`<g class="av-pop d6"><path d="M124 204 L162 196 L164 224 L126 224 Z" fill="#facc15" stroke="#ca8a04" stroke-width="2"></path><rect x="162" y="202" width="26" height="24" rx="4" fill="#f97316"></rect><rect x="168" y="206" width="14" height="9" rx="2" fill="#bae6fd"></rect><circle cx="138" cy="230" r="8" fill="#111"></circle><circle cx="178" cy="230" r="8" fill="#111"></circle><circle cx="138" cy="230" r="3" fill="#9ca3af"></circle><circle cx="178" cy="230" r="3" fill="#9ca3af"></circle></g>`,
  miniature: () => svg`<g class="av-pop d6"><ellipse cx="160" cy="232" rx="20" ry="5" fill="#334155"></ellipse><path d="M150 230 L152 202 L168 202 L170 230 Z" fill="#7c3aed"></path><path d="M146 206 L154 206 L154 222 L146 222 Z" fill="#b91c1c" stroke="#fde68a" stroke-width="1.5"></path><circle cx="160" cy="194" r="9" fill="#9ca3af"></circle><rect x="153" y="192" width="14" height="3" fill="#1f2937"></rect><rect x="170" y="176" width="3" height="40" fill="#e5e7eb"></rect><rect x="166" y="206" width="11" height="3" fill="#a16207"></rect></g>`
};
const BUDDY: Record<string, L> = {
  quokka: () => svg`<g class="av-pop d6"><ellipse cx="32" cy="214" rx="20" ry="22" fill="#a16207"></ellipse><ellipse cx="32" cy="220" rx="11" ry="13" fill="#d6b88a"></ellipse><circle cx="32" cy="186" r="14" fill="#a16207"></circle><circle cx="22" cy="176" r="5" fill="#a16207"></circle><circle cx="42" cy="176" r="5" fill="#a16207"></circle><circle cx="27" cy="184" r="2" fill="#111"></circle><circle cx="37" cy="184" r="2" fill="#111"></circle><ellipse cx="32" cy="191" rx="4" ry="3" fill="#3f2a14"></ellipse><path d="M27 195 Q32 200 37 195" fill="none" stroke="#3f2a14" stroke-width="1.6"></path></g>`,
  raven: () => svg`<g class="av-pop d6"><ellipse cx="32" cy="210" rx="16" ry="22" fill="#111827"></ellipse><circle cx="34" cy="184" r="11" fill="#111827"></circle><path d="M43 184 L58 188 L43 191 Z" fill="#78716c"></path><circle cx="37" cy="181" r="2.2" fill="#fbbf24"></circle><path d="M18 204 C6 214 10 230 20 232 Z" fill="#1f2937"></path><path d="M26 230 L22 240 M36 230 L38 240" stroke="#78716c" stroke-width="2.5"></path></g>`,
  owl: () => svg`<g class="av-pop d6"><ellipse cx="30" cy="206" rx="20" ry="24" fill="#a16207"></ellipse><ellipse cx="30" cy="212" rx="12" ry="14" fill="#fde68a"></ellipse><circle cx="22" cy="196" r="7" fill="#fff"></circle><circle cx="38" cy="196" r="7" fill="#fff"></circle><circle cx="22" cy="196" r="3" fill="#111"></circle><circle cx="38" cy="196" r="3" fill="#111"></circle><path d="M27 203 L33 203 L30 208 Z" fill="#f97316"></path><path d="M12 184 L18 176 L22 186 M48 184 L42 176 L38 186" fill="#a16207"></path></g>`,
  dino: () => svg`<g class="av-pop d6"><path d="M6 236 L18 202 C22 184 38 176 52 182 L66 166 C76 160 86 166 82 176 L72 186 C76 200 72 216 60 224 L60 238 L50 238 L48 228 L32 228 L30 238 L20 238 Z" fill="#0d9488"></path><circle cx="74" cy="171" r="2.4" fill="#111"></circle><path d="M30 186 L36 176 L40 186 M42 182 L48 172 L52 182" fill="#5eead4"></path><path d="M66 192 L58 198" stroke="#0f766e" stroke-width="3" stroke-linecap="round"></path></g>`,
  turtle: () => svg`<g class="av-pop d6"><ellipse cx="34" cy="220" rx="26" ry="15" fill="#16a34a"></ellipse><path d="M14 220 L54 220 M24 208 L28 232 M44 208 L40 232" stroke="#14532d" stroke-width="2"></path><circle cx="64" cy="216" r="8" fill="#4ade80"></circle><circle cx="66" cy="214" r="1.8" fill="#111"></circle><ellipse cx="16" cy="234" rx="6" ry="3" fill="#4ade80"></ellipse><ellipse cx="50" cy="234" rx="6" ry="3" fill="#4ade80"></ellipse></g>`,
  dragon: () => svg`<g class="av-pop d6"><path d="M8 236 C2 210 14 188 34 190 L52 160 L56 186 C70 194 70 218 56 230 L56 238 L44 238 L42 232 L26 232 L24 238 Z" fill="#16a34a"></path><path d="M24 192 L4 162 L34 182 Z" fill="#86efac"></path><path d="M36 190 L30 150 L50 178 Z" fill="#4ade80"></path><circle cx="56" cy="164" r="12" fill="#22c55e"></circle><circle cx="60" cy="161" r="2.6" fill="#111"></circle><path d="M50 152 L52 142 L56 152 M58 152 L62 143 L64 154" fill="#facc15"></path><path d="M66 168 C74 166 78 160 84 162" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" class="av-flame"></path></g>`
};
const HAIR_BEHIND: Record<string, L> = {
  mullet: (l) => svg`<g class="av-pop d3" fill=${l.hairColour}><path d="M54 96 L48 156 C58 164 70 158 74 146 L74 100 Z"></path><path d="M146 96 L152 156 C142 164 130 158 126 146 L126 100 Z"></path></g>`,
  surfer: (l) => svg`<g class="av-pop d3" fill=${l.hairColour}><path d="M52 98 C46 136 52 162 66 166 L74 108 Z"></path><path d="M148 98 C154 136 148 162 134 166 L126 108 Z"></path></g>`,
  pageboy: (l) => svg`<path class="av-pop d3" fill=${l.hairColour} d="M52 92 C48 120 50 140 58 148 L142 148 C150 140 152 120 148 92 Z"></path>`
};
const shine = (d: string): SVGTemplateResult => svg`<path d=${d} fill="none" stroke="rgba(255,255,255,.28)" stroke-width="3.5" stroke-linecap="round"></path>`;
const HAIR: Record<string, L> = {
  fringe: (l) => svg`<g class="av-pop d3"><path fill=${l.hairColour} d="M55 102 C51 64 76 47 103 47 C131 47 151 65 146 102 C143 92 139 86 133 81 C122 87 106 90 90 88 C79 87 70 88 62 91 C59 94 57 98 55 102 Z"></path>
    <path fill=${l.hairColour} d="M60 90 C68 79 84 73 104 75 C96 80 90 85 86 89 C77 89 68 89 60 90 Z" opacity=".9"></path>
    ${shine('M72 62 C84 53 100 51 116 54')}<path d="M92 86 C98 80 108 76 120 76" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="2" stroke-linecap="round"></path></g>`,
  styled: (l) => svg`<g class="av-pop d3"><path fill=${l.hairColour} opacity=".5" d="M56 104 C55 90 57 80 63 74 L68 96 Z M144 104 C145 90 143 80 137 74 L132 96 Z"></path>
    <path fill=${l.hairColour} d="M60 89 C59 74 66 63 77 57 Q76 50 80 45 Q84 51 87 54 Q88 45 94 40 Q96 48 98 52 Q102 42 109 38 Q109 47 110 52 Q115 44 123 42 Q120 49 121 55 Q127 51 133 52 Q129 57 130 61 C137 68 141 77 140 89 C132 80 118 76 100 76 C82 76 68 80 60 89 Z"></path>
    <path d="M80 68 Q85 60 90 52 M96 66 Q100 57 105 47 M111 66 Q115 58 120 50 M123 70 Q127 64 131 58" fill="none" stroke="rgba(0,0,0,.13)" stroke-width="2" stroke-linecap="round"></path>
    ${shine('M82 63 C90 55 100 50 112 48')}</g>`,
  crop: (l) => svg`<g class="av-pop d3"><path fill=${l.hairColour} opacity=".55" d="M56 102 C55 90 57 82 62 76 L66 96 Z M144 102 C145 90 143 82 138 76 L134 96 Z"></path>
    <path fill=${l.hairColour} d="M60 90 C59 71 72 58 87 54 Q90 47 94 47 Q97 51 99 53 Q102 45 106 45 Q109 50 111 53 Q115 48 119 48 Q121 53 121 56 L129 55 C139 63 142 75 141 90 C133 81 118 76 100 76 C82 76 68 81 60 90 Z"></path>
    <path d="M80 66 Q84 61 88 59 M98 63 Q101 58 104 56 M114 63 Q118 59 122 58" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="2" stroke-linecap="round"></path>${shine('M80 60 C92 54 106 52 120 56')}</g>`,
  mop: (l) => svg`<g class="av-pop d3"><path fill=${l.hairColour} d="M51 106 C45 70 66 44 98 42 C131 40 155 64 149 106 C145 97 141 92 136 89 L133 97 C128 86 117 80 104 82 C92 80 81 84 71 91 L67 99 C61 96 55 99 51 106 Z"></path>
    <path fill=${l.hairColour} d="M84 48 C80 42 82 37 88 35 C87 40 90 44 95 46 Z M104 45 C103 38 107 33 113 33 C110 37 110 41 113 45 Z M120 50 C124 44 129 42 134 43 C130 46 127 50 126 55 Z"></path>
    <path d="M84 84 C88 76 94 72 100 72 M110 82 C114 76 120 74 126 76" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="2" stroke-linecap="round"></path>${shine('M74 58 C86 50 102 48 118 52')}</g>`,
  short: (l) => svg`<path class="av-pop d3" fill=${l.hairColour} d="M56 98 C55 62 78 50 100 50 C124 50 146 62 145 99 C138 84 126 76 100 76 C78 76 64 83 56 98 Z"></path>`,
  quiff: (l) => svg`<path class="av-pop d3" fill=${l.hairColour} d="M56 98 C55 66 70 54 88 52 C92 32 126 26 142 44 C132 44 124 48 121 55 C138 62 146 76 145 99 C138 84 126 76 100 76 C78 76 64 83 56 98 Z"></path>`,
  swept: (l) => svg`<path class="av-pop d3" fill=${l.hairColour} d="M55 100 C52 64 76 48 104 48 C132 48 150 66 145 100 C140 86 130 78 118 76 C100 73 82 84 64 70 C61 80 58 90 55 100 Z"></path>`,
  pageboy: (l) => svg`<path class="av-pop d3" fill=${l.hairColour} d="M54 102 C52 62 78 48 100 48 C122 48 148 62 146 102 C142 92 130 90 100 90 C70 90 58 92 54 102 Z"></path>`,
  spiky: (l) => svg`<path class="av-pop d3" fill=${l.hairColour} d="M56 99 L57 70 L70 78 L73 50 L88 66 L98 40 L109 64 L123 47 L127 72 L141 64 L145 99 C134 83 120 76 100 76 C80 76 66 83 56 99 Z"></path>`,
  curly: (l) => svg`<g class="av-pop d3" fill=${l.hairColour}><path d="M57 98 C56 70 78 58 100 58 C124 58 145 70 144 98 C136 86 124 80 100 80 C78 80 64 86 57 98 Z"></path><circle cx="64" cy="82" r="14"></circle><circle cx="77" cy="63" r="15"></circle><circle cx="95" cy="54" r="16"></circle><circle cx="114" cy="55" r="16"></circle><circle cx="131" cy="66" r="15"></circle><circle cx="141" cy="84" r="13"></circle></g>`,
  buzz: (l) => svg`<path class="av-pop d3" fill=${l.hairColour} opacity=".88" d="M58 93 C60 64 80 55 100 55 C122 55 140 64 142 93 C130 81 116 77 100 77 C84 77 70 81 58 93 Z"></path>`,
  surfer: (l) => svg`<path class="av-pop d3" fill=${l.hairColour} d="M55 102 C50 64 80 45 104 47 C133 50 151 70 145 104 C133 80 112 74 92 80 C77 85 63 93 55 102 Z"></path>`,
  mohawk: (l) => svg`<g class="av-pop d3" fill=${l.hairColour}><path opacity=".45" d="M60 94 C62 72 80 62 100 62 C120 62 138 72 140 94 C130 84 116 80 100 80 C84 80 70 84 60 94 Z"></path><path d="M88 82 L90 40 L100 24 L110 40 L112 82 Z"></path></g>`,
  mullet: (l) => svg`<path class="av-pop d3" fill=${l.hairColour} d="M56 98 C55 62 78 50 100 50 C124 50 146 62 145 99 C138 84 126 76 100 76 C78 76 64 83 56 98 Z"></path>`
};
const TOPS: Record<string, L> = {
  island: (l) => svg`<g class="av-pop d1"><path d=${BODY} fill=${l.topColour}></path>${[[60, 200], [96, 214], [130, 196], [146, 224], [74, 228], [112, 186]].map(([x, y]) => svg`<circle cx=${x} cy=${y} r="6" fill="#fde047" opacity=".9"></circle><circle cx=${x} cy=${y} r="2.5" fill="#f97316"></circle>`)}<path d="M84 168 L100 190 L116 168" fill="none" stroke="#fff" stroke-width="3"></path></g>`,
  cloak: (l) => svg`<g class="av-pop d1"><path d="M22 240 C26 186 56 150 100 150 C144 150 174 186 178 240 Z" fill="#1f2937"></path><path d=${BODY} fill=${l.topColour}></path><path d="M100 166 L100 240" stroke="#111827" stroke-width="3"></path><circle cx="100" cy="176" r="5" fill="#d4af37"></circle></g>`,
  armour: () => svg`<g class="av-pop d1"><path d=${BODY} fill="#64748b"></path><path d="M60 182 C80 172 120 172 140 182 L134 230 L66 230 Z" fill="#94a3b8" stroke="#475569" stroke-width="2"></path><path d="M100 178 L100 230" stroke="#475569" stroke-width="2"></path><circle cx="48" cy="196" r="16" fill="#94a3b8" stroke="#475569" stroke-width="2"></circle><circle cx="152" cy="196" r="16" fill="#94a3b8" stroke="#475569" stroke-width="2"></circle><path d="M86 200 L100 192 L114 200 L100 212 Z" fill="#b91c1c"></path></g>`,
  tee: (l) => svg`<g class="av-pop d1"><path d=${BODY} fill=${l.topColour}></path><path d="M84 168 Q100 182 116 168" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3" stroke-linecap="round"></path></g>`,
  hoodie: (l) => svg`<g class="av-pop d1"><path d=${BODY} fill=${l.topColour}></path><path d="M66 174 Q100 146 134 174 Q100 194 66 174 Z" fill="rgba(0,0,0,.22)"></path><path d="M92 182 L90 206 M108 182 L110 206" stroke="#fff" stroke-width="3" stroke-linecap="round"></path><rect x="74" y="212" width="52" height="22" rx="8" fill="rgba(0,0,0,.12)"></rect></g>`,
  polo: (l) => svg`<g class="av-pop d1"><path d=${BODY} fill="#f8fafc"></path><path d="M80 168 L100 186 L120 168 L114 164 L100 176 L86 164 Z" fill=${l.topColour}></path><circle cx="100" cy="194" r="2" fill="#94a3b8"></circle><circle cx="100" cy="204" r="2" fill="#94a3b8"></circle><path d="M44 214 L60 210" stroke=${l.topColour} stroke-width="4"></path></g>`,
  rashie: (l) => svg`<g class="av-pop d1"><path d=${BODY} fill=${l.topColour}></path><path d="M40 216 C70 200 130 200 160 216" fill="none" stroke="#fff" stroke-width="5" opacity=".8"></path><path d="M90 168 L100 176 L110 168" fill="none" stroke="#fff" stroke-width="3"></path></g>`,
  band: (l) => svg`<g class="av-pop d1"><path d=${BODY} fill="#7f1d1d"></path><rect x="92" y="170" width="16" height="70" fill="#991b1b"></rect>${[184, 198, 212, 226].map((y) => svg`<circle cx="88" cy=${y} r="3" fill="#facc15"></circle><circle cx="112" cy=${y} r="3" fill="#facc15"></circle>`)}<path d="M50 196 L70 182 M150 196 L130 182" stroke="#facc15" stroke-width="4" stroke-linecap="round"></path></g>`,
  footy: () => svg`<g class="av-pop d1"><clipPath id="fhBody"><path d=${BODY}></path></clipPath><g clip-path="url(#fhBody)"><rect y="160" width="200" height="80" fill="#1e3a8a"></rect><rect y="186" width="200" height="12" fill="#f5b301"></rect><rect y="210" width="200" height="12" fill="#f5b301"></rect></g><path d="M84 168 Q100 180 116 168" fill="none" stroke="#f5b301" stroke-width="4" stroke-linecap="round"></path></g>`,
  wetsuit: () => svg`<g class="av-pop d1"><path d=${BODY} fill="#111827"></path><path d="M40 240 C44 204 58 186 72 180 L78 240 Z" fill="#0ea5e9"></path><path d="M160 240 C156 204 142 186 128 180 L122 240 Z" fill="#0ea5e9"></path></g>`,
  astro: () => svg`<g class="av-pop d1"><path d=${BODY} fill="#e5e7eb"></path><rect x="78" y="196" width="44" height="30" rx="6" fill="#cbd5e1"></rect><circle cx="90" cy="211" r="4" fill="#ef4444"></circle><circle cx="104" cy="211" r="4" fill="#22c55e"></circle><rect x="112" y="207" width="6" height="8" rx="2" fill="#3b82f6"></rect></g>`
};
const iris = (c: string, x: number): SVGTemplateResult => svg`<ellipse cx=${x} cy="104" rx="5.2" ry="6.2" fill="#fff"></ellipse><circle cx=${x} cy="104.6" r="4.4" fill=${c}></circle><circle cx=${x} cy="104.6" r="2.2" fill="#141414"></circle><circle cx=${x + 1.6} cy="102.6" r="1.3" fill="#fff"></circle>`;
const EYES: Record<string, L> = {
  normal: (l) => l.eyeColour && l.eyeColour !== 'none' ? svg`<g class="av-pop d4">${iris(l.eyeColour, 84)}${iris(l.eyeColour, 116)}</g>` : svg`<g class="av-pop d4"><ellipse cx="84" cy="104" rx="5" ry="6.2" fill="#1d1d1f"></ellipse><ellipse cx="116" cy="104" rx="5" ry="6.2" fill="#1d1d1f"></ellipse><circle cx="86" cy="101.5" r="1.6" fill="#fff"></circle><circle cx="118" cy="101.5" r="1.6" fill="#fff"></circle></g>`,
  happy: () => svg`<g class="av-pop d4" fill="none" stroke="#1d1d1f" stroke-width="3.4" stroke-linecap="round"><path d="M77 106 Q84 97 91 106"></path><path d="M109 106 Q116 97 123 106"></path></g>`,
  wink: (l) => svg`<g class="av-pop d4">${l.eyeColour && l.eyeColour !== 'none' ? iris(l.eyeColour, 84) : svg`<ellipse cx="84" cy="104" rx="5" ry="6.2" fill="#1d1d1f"></ellipse><circle cx="86" cy="101.5" r="1.6" fill="#fff"></circle>`}<path d="M109 105 Q116 99 123 105" fill="none" stroke="#1d1d1f" stroke-width="3.4" stroke-linecap="round"></path></g>`
};
const MOUTH: Record<string, L> = {
  smile: () => svg`<path class="av-pop d4" d="M88 122 Q100 133 112 122" fill="none" stroke="#3b1f14" stroke-width="3.4" stroke-linecap="round"></path>`,
  cheeky: () => svg`<g class="av-pop d4"><path d="M86 119 Q100 134 114 119 Q100 122.5 86 119 Z" fill="#5b2a22"></path><path d="M89.5 120 Q100 122.4 110.5 120 L109.5 123 Q100 124.6 90.5 123 Z" fill="#fffaf0"></path><path d="M93 129.5 Q100 132 107 129.5" fill="none" stroke="#e8857a" stroke-width="2" stroke-linecap="round" opacity=".6"></path></g>`,
  grin: () => svg`<g class="av-pop d4"><path d="M83 118 Q100 140 117 118 Q100 122 83 118 Z" fill="#4a2018"></path><path d="M86.5 119.2 Q100 122.4 113.5 119.2 L112 124 Q100 126 88 124 Z" fill="#fff"></path><path d="M92 132 Q100 135 108 132" fill="none" stroke="#e8857a" stroke-width="2" stroke-linecap="round" opacity=".7"></path></g>`,
  smirk: () => svg`<path class="av-pop d4" d="M89 125 Q103 129 113 119" fill="none" stroke="#3b1f14" stroke-width="3.4" stroke-linecap="round"></path>`,
  wow: () => svg`<ellipse class="av-pop d4" cx="100" cy="124" rx="5.5" ry="6.5" fill="#3b1f14"></ellipse>`
};
const EYEWEAR: Record<string, L> = {
  zinc: () => svg`<g class="av-pop d5"><path d="M93 104 Q100 100 107 104 L105 118 Q100 121 95 118 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"></path><path d="M70 112 L80 110 M120 110 L130 112" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"></path></g>`,
  round: () => svg`<g class="av-pop d5"><circle cx="84" cy="104" r="11" fill="rgba(20,22,34,.88)" stroke="#111" stroke-width="2.5"></circle><circle cx="116" cy="104" r="11" fill="rgba(20,22,34,.88)" stroke="#111" stroke-width="2.5"></circle><path d="M95 103 Q100 99 105 103" fill="none" stroke="#111" stroke-width="2.5"></path><path d="M79 99 L84 96" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"></path></g>`,
  swim: () => svg`<g class="av-pop d5"><path d="M52 102 H148" stroke="#0ea5e9" stroke-width="4"></path><ellipse cx="84" cy="104" rx="11" ry="8" fill="rgba(125,211,252,.85)" stroke="#0369a1" stroke-width="3"></ellipse><ellipse cx="116" cy="104" rx="11" ry="8" fill="rgba(125,211,252,.85)" stroke="#0369a1" stroke-width="3"></ellipse><path d="M95 104 H105" stroke="#0369a1" stroke-width="3"></path></g>`,
  aviator: () => svg`<g class="av-pop d5"><path d="M71 97 H97 Q97 118 84 118 Q71 118 71 97 Z" fill="rgba(30,44,70,.88)" stroke="#c9a227" stroke-width="2.2"></path><path d="M103 97 H129 Q129 118 116 118 Q103 118 103 97 Z" fill="rgba(30,44,70,.88)" stroke="#c9a227" stroke-width="2.2"></path><path d="M97 99 H103 M60 99 H71 M129 99 H140" stroke="#c9a227" stroke-width="2.2"></path></g>`,
  shutter: () => svg`<g class="av-pop d5" fill="none" stroke="#f5b301" stroke-width="3"><rect x="69" y="95" width="62" height="19" rx="5"></rect><path d="M71 101 H129 M71 107 H129 M100 95 V114"></path></g>`,
  ski: () => svg`<g class="av-pop d5"><path d="M50 104 H150" stroke="#111827" stroke-width="7"></path><rect x="67" y="92" width="66" height="24" rx="12" fill="rgba(80,200,255,.75)" stroke="#111827" stroke-width="3.5"></rect><path d="M76 98 L90 98" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"></path></g>`,
  star: () => svg`<g class="av-pop d5" fill="#ff4fa3" stroke="#be185d" stroke-width="2" stroke-linejoin="round"><path d=${star(84, 104, 13)}></path><path d=${star(116, 104, 13)}></path><path d="M95 104 H105" stroke-width="2.5"></path></g>`
};
const HATS: Record<string, L> = {
  knight: () => svg`<g class="av-pop d5"><path d="M52 112 C48 60 72 40 100 40 C128 40 152 60 148 112 L140 112 L140 98 L60 98 L60 112 Z" fill="#94a3b8" stroke="#475569" stroke-width="2.5"></path><rect x="96" y="40" width="8" height="58" fill="#64748b"></rect><path d="M100 40 C96 22 112 16 120 24 C110 26 104 32 104 40 Z" fill="#b91c1c"></path></g>`,
  cap: () => svg`<g class="av-pop d5"><path d="M53 90 C53 58 76 45 100 45 C124 45 147 58 147 90 Z" fill="#d62d20"></path><path d="M100 84 L170 90 C168 99 150 99 100 93 Z" fill="#b91c1c"></path></g>`,
  backcap: () => svg`<g class="av-pop d5"><path d="M53 90 C53 58 76 45 100 45 C124 45 147 58 147 90 Z" fill="#2563eb"></path><path d="M58 86 L30 80 C30 72 44 70 58 76 Z" fill="#1d4ed8"></path><rect x="122" y="70" width="18" height="10" rx="4" fill="#bfdbfe"></rect></g>`,
  beanie: () => svg`<g class="av-pop d5"><path d="M53 94 C53 56 76 43 100 43 C124 43 147 56 147 94 Z" fill="#0f766e"></path><rect x="50" y="84" width="100" height="14" rx="7" fill="#115e59"></rect><circle cx="100" cy="40" r="9" fill="#f5b301"></circle></g>`,
  swimcap: () => svg`<g class="av-pop d5"><path d="M54 98 C52 58 76 44 100 44 C124 44 148 58 146 98 C136 90 120 86 100 86 C80 86 64 90 54 98 Z" fill="#0ea5e9"></path><path d="M70 64 Q100 52 130 64" fill="none" stroke="#e0f2fe" stroke-width="3" opacity=".7"></path></g>`,
  bucket: () => svg`<g class="av-pop d5"><path d="M64 84 C66 54 80 45 100 45 C120 45 134 54 136 84 Z" fill="#d6c38f"></path><ellipse cx="100" cy="86" rx="58" ry="11" fill="#c2ad74"></ellipse><rect x="65" y="74" width="70" height="7" fill="#8b7a4a"></rect></g>`,
  dinohood: () => svg`<g class="av-pop d5"><path d="M50 108 C46 60 74 40 100 40 C126 40 154 60 150 108 C146 92 132 82 100 82 C68 82 54 92 50 108 Z" fill="#16a34a"></path><path d="M70 46 L76 30 L84 42 L92 26 L100 40 L108 26 L116 42 L124 30 L130 46" fill="#facc15"></path><circle cx="76" cy="62" r="5" fill="#fff"></circle><circle cx="124" cy="62" r="5" fill="#fff"></circle><circle cx="76" cy="62" r="2.4" fill="#111"></circle><circle cx="124" cy="62" r="2.4" fill="#111"></circle></g>`,
  headphones: () => svg`<g class="av-pop d5"><path d="M52 106 C50 48 150 48 148 106" fill="none" stroke="#111827" stroke-width="7" stroke-linecap="round"></path><rect x="44" y="94" width="18" height="28" rx="8" fill="#ef4444"></rect><rect x="138" y="94" width="18" height="28" rx="8" fill="#ef4444"></rect></g>`,
  wizard: () => svg`<g class="av-pop d5"><ellipse cx="100" cy="80" rx="60" ry="11" fill="#312e81"></ellipse><path d="M66 80 L100 4 L134 80 Z" fill="#4338ca"></path><path d=${star(100, 48, 8)} fill="#facc15"></path><circle cx="86" cy="66" r="2.5" fill="#fde68a"></circle><circle cx="116" cy="30" r="2" fill="#fde68a"></circle></g>`,
  akubra: () => svg`<g class="av-pop d5"><ellipse cx="100" cy="82" rx="72" ry="13" fill="#7a4a24"></ellipse><path d="M66 82 C66 54 78 42 100 42 C122 42 134 54 134 82 Z" fill="#8b5a2b"></path><rect x="66" y="70" width="68" height="9" fill="#3b2414"></rect></g>`,
  crown: () => svg`<g class="av-pop d5"><path d="M63 72 L68 38 L85 58 L100 30 L115 58 L132 38 L137 72 Z" fill="#f5b301" stroke="#b27f00" stroke-width="2.5" stroke-linejoin="round"></path><circle cx="100" cy="60" r="5" fill="#ef4444"></circle><circle cx="80" cy="64" r="3.5" fill="#3b82f6"></circle><circle cx="120" cy="64" r="3.5" fill="#22c55e"></circle></g>`,
  helmet: () => svg`<g class="av-pop d5"><circle cx="100" cy="98" r="62" fill="rgba(186,230,253,.28)" stroke="#e5e7eb" stroke-width="7"></circle><path d="M62 72 Q76 50 100 46" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"></path></g>`
};

export interface AvatarOpts { size?: number; crop?: 'full' | 'head'; still?: boolean; label?: string; jump?: number; age?: 'kid' | 'mid' | 'teen'; ring?: string }

/** Render an avatar as inline SVG. Each item is its own template, so swapping an item re-mounts it and replays its pop-in. */
export function renderAvatar(look: Look, o: AvatarOpts = {}): TemplateResult {
  const size = o.size ?? 200, head = o.crop === 'head';
  const w = size, h = head ? size : Math.round(size * 1.2);
  const jumpCls = o.jump ? (o.jump % 2 ? 'av-jump-a' : 'av-jump-b') : '';
  const age = o.age ?? 'mid';
  // younger: bigger head, smaller body; teen: slightly narrower face and longer neck
  const headT = age === 'kid' ? 'translate(100 104) scale(1.1) translate(-100 -104)' : '';
  const faceRx = age === 'kid' ? 44 : 46, faceRy = age === 'teen' ? 46 : 44;
  const nose = svg`<path d=${age === 'kid' ? 'M99 111 Q97 115 100 116 Q102 116 103 114.5' : 'M98.5 108 Q95.5 115 99.5 116.5 Q102.5 117 104 114.5'} fill="none" stroke="rgba(150,80,60,.45)" stroke-width="2" stroke-linecap="round"></path>`;
  const brows = age !== 'kid' ? svg`<g class="av-pop d4" stroke=${look.hairColour} stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".9"><path d=${age === 'teen' ? 'M76 94.5 Q83 92 91 93.5' : 'M77 94 Q84 90 91 93'}></path><path d=${age === 'teen' ? 'M109 93.5 Q117 92 124 94.5' : 'M109 93 Q116 90 123 94'}></path></g>` : nothing;
  return html`<span class="avwrap ${jumpCls}" style="display:inline-block;line-height:0;flex-shrink:0">
    <svg viewBox=${head ? '36 28 128 128' : '0 0 200 240'} width=${w} height=${h} role="img" aria-label=${o.label ?? 'Avatar'}
      style="display:block;overflow:hidden;border-radius:${head ? '50%' : `${Math.round(size * 0.12)}px`}">
      ${head ? svg`<circle cx="100" cy="92" r="64" fill=${TINT[look.scene] ?? TINT.plain}></circle>` : (SCENES[look.scene] ?? SCENES.plain)(look)}
      ${o.ring && head ? svg`<circle cx="100" cy="92" r="60" fill="none" stroke=${o.ring} stroke-width="7"></circle>` : nothing}
      <g class=${o.still ? '' : 'av-bob'}>
        ${!head && GEAR_BEHIND[look.gear] ? GEAR_BEHIND[look.gear](look) : nothing}
        ${HAIR_BEHIND[look.hair] ? HAIR_BEHIND[look.hair](look) : nothing}
        ${(TOPS[look.top] ?? TOPS.tee)(look)}
        <rect x="88" y=${age === 'teen' ? 130 : 136} width="24" height=${age === 'teen' ? 40 : 34} rx="10" fill=${look.skin}></rect>
        <g transform=${headT}>
        <g class="av-pop d2">
          <circle cx="57" cy="104" r="9" fill=${look.skin}></circle><circle cx="143" cy="104" r="9" fill=${look.skin}></circle>
          <ellipse cx="100" cy="100" rx=${faceRx} ry=${faceRy} fill=${look.skin}></ellipse>
          <circle cx="74" cy="118" r="6.5" fill="rgba(255,110,110,.22)"></circle><circle cx="126" cy="118" r="6.5" fill="rgba(255,110,110,.22)"></circle>
        </g>
        <g class=${o.still ? '' : 'av-blink'}>${(EYES[look.eyes] ?? EYES.normal)(look)}</g>
        ${brows}
        ${look.freckles === 'yes' ? svg`<g fill="#b9734f" opacity=".5">${[[91, 113], [95, 110.5], [105, 110.5], [109, 113], [77, 114], [81, 117], [74, 118], [119, 117], [123, 114], [126, 118]].map(([x, y]) => svg`<circle cx=${x} cy=${y} r="1.15"></circle>`)}</g>` : nothing}
        ${nose}
        ${look.mole === 'yes' ? svg`<circle cx="81" cy="121" r="1.2" fill="#6b4532" opacity=".75"></circle>` : nothing}
        ${(MOUTH[look.mouth] ?? MOUTH.smile)(look)}
        ${(HAIR[look.hair] ?? HAIR.short)(look)}
        ${EYEWEAR[look.eyewear] ? EYEWEAR[look.eyewear](look) : nothing}
        ${HATS[look.hat] ? HATS[look.hat](look) : nothing}
        </g>
        ${!head && GEAR_FRONT[look.gear] ? GEAR_FRONT[look.gear](look) : nothing}
        ${!head && BUDDY[look.buddy] ? BUDDY[look.buddy](look) : nothing}
      </g>
    </svg></span>`;
}

/** Shared avatar animation CSS (include in any element that renders avatars). */
export const avatarCss = `
  .avwrap svg g.av-pop { transform-box: fill-box; transform-origin: center; animation: avPop .55s cubic-bezier(.2,1.4,.4,1) both; }
  .avwrap svg g.av-pop.d1, .avwrap svg path.av-pop.d1 { animation-delay: .02s; }
  .avwrap svg .av-pop.d2 { animation-delay: .06s; } .avwrap svg .av-pop.d3 { animation-delay: .1s; }
  .avwrap svg .av-pop.d4 { animation-delay: .14s; } .avwrap svg .av-pop.d5 { animation-delay: .18s; } .avwrap svg .av-pop.d6 { animation-delay: .22s; }
  .avwrap svg path.av-pop, .avwrap svg ellipse.av-pop { transform-box: fill-box; transform-origin: center; animation: avPop .55s cubic-bezier(.2,1.4,.4,1) both; }
  @keyframes avPop { from { opacity: 0; transform: scale(.4) translateY(10px); } to { opacity: 1; transform: none; } }
  .avwrap svg .av-bob { animation: avBob 3.2s ease-in-out infinite; }
  @keyframes avBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  .avwrap svg .av-blink { transform-box: fill-box; transform-origin: center; animation: avBlink 5.5s infinite; }
  @keyframes avBlink { 0%, 95%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
  .avwrap svg .av-flame { animation: avFlame .8s ease-in-out infinite alternate; }
  @keyframes avFlame { from { opacity: .4; } to { opacity: 1; } }
  .avwrap.av-jump-a { animation: avJumpA .7s cubic-bezier(.3,1.6,.5,1); }
  .avwrap.av-jump-b { animation: avJumpB .7s cubic-bezier(.3,1.6,.5,1); }
  @keyframes avJumpA { 0% { transform: none; } 35% { transform: translateY(-22px) rotate(-4deg) scale(1.04); } 70% { transform: translateY(2px) scale(.98, 1.02); } 100% { transform: none; } }
  @keyframes avJumpB { 0% { transform: none; } 35% { transform: translateY(-22px) rotate(4deg) scale(1.04); } 70% { transform: translateY(2px) scale(.98, 1.02); } 100% { transform: none; } }
`;
