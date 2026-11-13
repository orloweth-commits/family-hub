import { CATALOGUE, DEFAULT_LOOK, type Category, type Item, type Look } from './avatar';

/* ------------------------------------------------------------------ *
 * The wardrobe of a child whose character is a painted picture.
 * He picks the parts (hat, face, clothes, something to hold, a buddy, a
 * place, hair), and the picture is painted from his character sheet and
 * these words. Every word that reaches the painter is written here: a
 * child never types anything.
 *  [id, label, points needed, growing-milestone count?] as in the drawn
 *  catalogue, then PAINT gives each one its tile picture and its words.
 * ------------------------------------------------------------------ */

type Row = [id: string, label: string, pts: number, emoji: string, words: string, grow?: number];
const cat = (id: string, emoji: string, label: string, key: keyof Look, rows: Row[], swatch?: Category['swatch']): [Category, Row[]] =>
  [{ id, emoji, label, key, crop: 'full', items: rows.map((r): Item => (r[5] ? [r[0], r[1], r[2], r[5]] : [r[0], r[1], r[2]])), swatch }, rows];

const HATS: Row[] = [
  ['none', 'No hat', 0, '🙂', ''],
  ['cap', 'Cap', 0, '🧢', 'a plain baseball cap'],
  ['backcap', 'Backwards cap', 60, '🧢', 'a plain baseball cap worn backwards'],
  ['party', 'Party hat', 80, '🥳', 'a shiny cone party hat with a pom-pom'],
  ['beanie', 'Beanie', 150, '🧶', 'a chunky knitted beanie with a bobble'],
  ['swimcap', 'Swim cap', 200, '🏊', 'a bright silicone swimming cap'],
  ['propeller', 'Propeller cap', 250, '🚁', 'a rainbow cap with a little spinning propeller on top'],
  ['bucket', 'Bucket hat', 300, '🪣', 'a floppy bucket hat'],
  ['chef', 'Chef’s hat', 350, '👨‍🍳', 'a tall white puffy chef’s hat'],
  ['dinohood', 'Dino hood', 400, '🦖', 'a soft green dinosaur hood with felt teeth and spikes'],
  ['shark', 'Shark hat', 450, '🦈', 'a soft toy shark hat that looks as if the shark is gently chomping his head'],
  ['pirate', 'Pirate hat', 500, '🏴‍☠️', 'a pirate captain’s tricorn hat with a feather and no skull'],
  ['headphones', 'Headphones', 550, '🎧', 'big over-ear headphones'],
  ['cowboy', 'Cowboy hat', 600, '🤠', 'a wide cowboy hat'],
  ['pineapple', 'Pineapple hat', 650, '🍍', 'a hat shaped like a whole pineapple with spiky leaves on top'],
  ['viking', 'Viking helmet', 700, '🪓', 'a play Viking helmet with two curly horns'],
  ['knight', 'Knight helm', 750, '🛡️', 'a shiny knight’s helmet with the visor up so his whole face shows'],
  ['cone', 'Traffic cone', 800, '🚧', 'an orange traffic cone worn as a hat'],
  ['wizard', 'Wizard hat', 900, '🧙', 'a tall pointy wizard’s hat covered in stars'],
  ['jester', 'Jester hat', 1000, '🃏', 'a floppy jester’s hat with bells'],
  ['unicorn', 'Unicorn horn', 1100, '🦄', 'a headband with a sparkly unicorn horn and ears'],
  ['tophat', 'Top hat', 1200, '🎩', 'a tall magician’s top hat'],
  ['akubra', 'Akubra', 1300, '🤠', 'an Australian bush hat with a wide brim'],
  ['explorer', 'Explorer helmet', 1500, '🧭', 'an explorer’s pith helmet with a little head torch'],
  ['octopus', 'Octopus hat', 1800, '🐙', 'a friendly purple toy octopus sitting on his head with its arms dangling down'],
  ['crown', 'Crown', 2200, '👑', 'a golden crown with coloured jewels'],
  ['helmet', 'Space helmet', 3000, '🧑‍🚀', 'an astronaut’s helmet with the clear visor open so his whole face shows']
];
const FACE: Row[] = [
  ['none', 'Nothing', 0, '🙂', ''],
  ['round', 'Round sunnies', 50, '🕶️', 'round sunglasses pushed up on his forehead so his eyes show'],
  ['zinc', 'Zinc stripe', 100, '🏖️', 'a bright stripe of zinc sunscreen across his nose'],
  ['clown', 'Clown nose', 150, '🔴', 'a round red clown nose'],
  ['swim', 'Swim goggles', 200, '🥽', 'swimming goggles pushed up on his forehead'],
  ['moustache', 'Moustache', 300, '🥸', 'a big curly stick-on moustache that is obviously fake'],
  ['hearts', 'Heart sunnies', 400, '😍', 'heart-shaped sunglasses pushed up on his forehead'],
  ['patch', 'Eye patch', 500, '🏴‍☠️', 'a play pirate eye patch flipped up on his forehead'],
  ['aviator', 'Aviators', 650, '😎', 'aviator sunglasses'],
  ['tiger', 'Tiger face paint', 750, '🐯', 'cheerful orange tiger face paint with whiskers'],
  ['monocle', 'Monocle', 850, '🧐', 'a gold monocle on a chain'],
  ['threed', '3D glasses', 950, '🎬', 'cardboard 3D glasses with one red and one blue lens'],
  ['shutter', 'Shutter shades', 1000, '🕺', 'shutter shades'],
  ['hero', 'Hero mask', 1100, '🦸', 'a simple plain-coloured superhero eye mask with no symbol'],
  ['ski', 'Ski goggles', 1200, '⛷️', 'ski goggles pushed up on his forehead'],
  ['snorkel', 'Snorkel', 1400, '🤿', 'a diving mask pushed up on his forehead with a snorkel beside his cheek'],
  ['star', 'Star sunnies', 1700, '🤩', 'star-shaped sunglasses'],
  ['giant', 'Giant glasses', 2000, '👓', 'enormous joke glasses three times too big']
];
const TOPS: Row[] = [
  ['tee', 'T-shirt', 0, '👕', 'a plain {c} t-shirt'],
  ['pjs', 'Rocket pyjamas', 100, '🚀', '{c} pyjamas patterned with little rockets'],
  ['hoodie', 'Hoodie', 200, '🧥', 'a plain {c} hoodie'],
  ['island', 'Island shirt', 250, '🌺', 'a {c} island shirt covered in big flowers'],
  ['polo', 'Tennis polo', 300, '🎾', 'a plain {c} tennis polo'],
  ['rashie', 'Rashie', 300, '🏄', 'a {c} surf rashie'],
  ['band', 'Band jacket', 0, '🎺', 'a {c} marching-band jacket with gold braid and buttons', 20],
  ['raincoat', 'Raincoat', 350, '☔', 'a shiny {c} raincoat with the hood down'],
  ['chefs', 'Chef whites', 400, '🍳', 'a white chef’s jacket with a {c} neckerchief'],
  ['karate', 'Karate suit', 450, '🥋', 'a white karate suit with a {c} belt'],
  ['dino', 'Dino onesie', 500, '🦕', 'a cosy {c} dinosaur onesie with a spiky tail'],
  ['sharkie', 'Shark onesie', 550, '🦈', 'a cosy grey shark onesie with a fin on the back'],
  ['explorer', 'Explorer vest', 600, '🧭', 'a khaki explorer’s vest with lots of pockets over a {c} shirt'],
  ['cloak', 'Hooded cloak', 650, '🧝', 'a long {c} hooded cloak with the hood down'],
  ['labcoat', 'Mad scientist', 700, '🧪', 'a white lab coat with bubbling test tubes in the pocket and a {c} bow tie'],
  ['pirate', 'Pirate coat', 800, '🏴‍☠️', 'a pirate captain’s {c} coat with brass buttons and a striped shirt'],
  ['footy', 'Footy jumper', 900, '🏉', 'a sleeveless {c} football jumper with plain stripes and no logo or number'],
  ['banana', 'Banana suit', 1000, '🍌', 'a silly whole-body banana costume with his face showing'],
  ['racer', 'Racing suit', 1100, '🏎️', 'a {c} racing driver’s suit with plain stripes and no logos'],
  ['wetsuit', 'Wetsuit', 1200, '🤿', 'a {c} and black wetsuit'],
  ['tux', 'Tuxedo', 1300, '🤵', 'a smart black tuxedo with a {c} bow tie'],
  ['hero', 'Hero suit', 1500, '🦸', 'a {c} superhero suit with a flowing cape and a plain star on the chest, his own made-up hero'],
  ['robot', 'Robot suit', 1650, '🤖', 'a home-made cardboard-box robot costume painted silver with {c} buttons and dials'],
  ['armour', 'Battle armour', 1800, '⚔️', 'shining fantasy knight’s armour with {c} trim'],
  ['wizardrobe', 'Wizard robe', 2100, '🪄', 'a flowing {c} wizard’s robe covered in silver moons and stars'],
  ['dragonrider', 'Dragon rider', 2500, '🐲', '{c} leather dragon-rider gear with a fur collar and flying goggles round his neck'],
  ['astro', 'Space suit', 3000, '🧑‍🚀', 'a white astronaut’s space suit with {c} trim and no flags or logos']
];
const TOP_COLOURS: Item[] = [['#0b5fa5', 'Blue', 0], ['#1d4ed8', 'Royal blue', 0], ['#38bdf8', 'Sky blue', 0], ['#1e293b', 'Navy', 0], ['#0f766e', 'Teal', 0], ['#16a34a', 'Green', 0], ['#c2410c', 'Orange', 0], ['#be185d', 'Pink', 0], ['#6d28d9', 'Purple', 0], ['#334155', 'Charcoal', 0], ['#f5b301', 'Yellow', 0], ['#dc2626', 'Red', 0]];
const COLOUR_WORD: Record<string, string> = { '#0b5fa5': 'blue', '#1d4ed8': 'royal blue', '#38bdf8': 'sky blue', '#1e293b': 'navy', '#0f766e': 'teal', '#16a34a': 'green', '#c2410c': 'orange', '#be185d': 'pink', '#6d28d9': 'purple', '#334155': 'charcoal grey', '#f5b301': 'yellow', '#dc2626': 'red' };
const GEAR: Row[] = [
  ['none', 'Nothing', 0, '👐', ''],
  ['trumpet', 'Trumpet', 0, '🎺', 'a shiny brass trumpet', 5],
  ['clarinet', 'Clarinet', 0, '🎼', 'a black clarinet', 5],
  ['books', 'Book stack', 0, '📚', 'a tall wobbly stack of picture books', 5],
  ['truck', 'Toy truck', 100, '🚚', 'a chunky toy dump truck'],
  ['racquet', 'Tennis racquet', 150, '🎾', 'a tennis racquet and a ball'],
  ['bubbles', 'Bubble wand', 200, '🫧', 'a giant bubble wand with huge bubbles drifting off it'],
  ['scooter', 'Scooter', 250, '🛴', 'a kick scooter'],
  ['lollipop', 'Giant lollipop', 300, '🍭', 'a swirly lollipop as big as his head'],
  ['kite', 'Kite', 350, '🪁', 'a diamond kite with a long ribbon tail'],
  ['chicken', 'Rubber chicken', 400, '🐔', 'a floppy yellow rubber chicken'],
  ['bat', 'Cricket bat', 450, '🏏', 'a cricket bat'],
  ['miniature', 'Painted miniature', 500, '🧙', 'a tiny hand-painted fantasy knight figurine and a fine paintbrush'],
  ['magnifier', 'Magnifying glass', 550, '🔍', 'a big magnifying glass that makes one of his eyes look huge'],
  ['pizza', 'Pizza slice', 600, '🍕', 'an enormous slice of pizza with stretchy cheese'],
  ['footy', 'Footy', 700, '🏉', 'a plain red oval football with no logo'],
  ['rod', 'Fishing rod', 750, '🎣', 'a fishing rod with a surprised little fish on the line'],
  ['surfboard', 'Surfboard', 850, '🏄', 'a surfboard'],
  ['map', 'Treasure map', 900, '🗺️', 'an old treasure map with a dotted trail and a big X and no writing'],
  ['skateboard', 'Skateboard', 1000, '🛹', 'a skateboard'],
  ['telescope', 'Telescope', 1100, '🔭', 'a brass telescope'],
  ['guitar', 'Electric guitar', 1250, '🎸', 'a bright electric guitar with no brand name'],
  ['sword', 'Foam sword', 1400, '🗡️', 'a chunky foam play sword'],
  ['wand', 'Magic wand', 1600, '🪄', 'a magic wand trailing sparkles'],
  ['trophy', 'Golden trophy', 2000, '🏆', 'a big golden trophy cup with no writing'],
  ['jetpack', 'Jetpack', 2600, '🚀', 'a home-made jetpack on his back made of two soft-drink bottles with paper flames']
];
const BUDDY: Row[] = [
  ['none', 'No buddy', 0, '🫥', ''],
  ['puppy', 'Puppy', 150, '🐶', 'a scruffy little puppy'],
  ['kitten', 'Kitten', 200, '🐱', 'a fluffy kitten'],
  ['snail', 'Giant snail', 250, '🐌', 'a friendly snail the size of a football'],
  ['quokka', 'Quokka', 350, '🐹', 'a smiling quokka'],
  ['owl', 'Book owl', 0, '🦉', 'a small owl wearing tiny reading glasses', 15],
  ['crab', 'Hermit crab', 400, '🦀', 'a hermit crab in a painted shell'],
  ['kookaburra', 'Kookaburra', 450, '🐦', 'a laughing kookaburra perched on his shoulder'],
  ['dino', 'Dinosaur', 500, '🦕', 'a small friendly green dinosaur'],
  ['penguin', 'Penguin', 550, '🐧', 'a little penguin'],
  ['joey', 'Kangaroo joey', 600, '🦘', 'a kangaroo joey'],
  ['turtle', 'Turtle', 700, '🐢', 'a sea turtle'],
  ['koala', 'Koala', 750, '🐨', 'a sleepy koala clinging to his arm'],
  ['cockatoo', 'Cockatoo', 800, '🦜', 'a cheeky white cockatoo with its yellow crest up, on his shoulder'],
  ['wombat', 'Wombat', 850, '🐻', 'a round wombat'],
  ['raven', 'Raven', 950, '🐦‍⬛', 'a glossy raven on his shoulder'],
  ['sloth', 'Sloth', 1000, '🦥', 'a smiling sloth hanging off his shoulder'],
  ['llama', 'Llama', 1100, '🦙', 'a fluffy llama wearing a little scarf'],
  ['axolotl', 'Axolotl', 1200, '🦎', 'a pink axolotl floating in a round bowl'],
  ['robot', 'Robot buddy', 1300, '🤖', 'a small friendly round robot with glowing eyes'],
  ['dragon', 'Dragon', 1400, '🐉', 'a small friendly dragon'],
  ['flyingpig', 'Flying pig', 1500, '🐷', 'a little pink pig with tiny wings, hovering'],
  ['monster', 'Fluffy monster', 1650, '👾', 'a round, fluffy, friendly blue monster with one big eye and a goofy grin'],
  ['trex', 'Baby T-rex', 1800, '🦖', 'a baby T-rex with tiny arms and a big friendly grin'],
  ['alien', 'Alien blob', 2000, '👽', 'a wobbly, friendly green alien blob with three eyes on stalks'],
  ['unicorn', 'Unicorn', 2300, '🦄', 'a small unicorn with a rainbow mane'],
  ['yeti', 'Yeti cub', 2700, '❄️', 'a fluffy white yeti cub with a big smile']
];
const SCENE: Row[] = [
  ['plain', 'Sky', 0, '☁️', 'a soft plain sky-blue studio backdrop'],
  ['beach', 'Beach', 0, '🏖️', 'a sunny Western Australian beach with turquoise water and white sand'],
  ['pool', 'Pool', 200, '🏊', 'an outdoor swimming pool with lane ropes'],
  ['court', 'Tennis court', 200, '🎾', 'a blue tennis court'],
  ['library', 'Library', 0, '📚', 'a cosy library with shelves of colourful books whose spines have no writing', 10],
  ['skatepark', 'Skate park', 300, '🛹', 'a sunny concrete skate park'],
  ['rottnest', 'Rottnest', 400, '🏝️', 'a sheltered island bay with pale limestone, turquoise water and a lighthouse far off'],
  ['sunset', 'Sunset', 500, '🌅', 'a glowing orange sunset over the ocean'],
  ['outback', 'Outback', 550, '🏜️', 'red outback country with spinifex and a huge sky'],
  ['reef', 'Reef', 600, '🐠', 'underwater on a bright coral reef with little fish, as if he can breathe there'],
  ['circus', 'Circus tent', 650, '🎪', 'inside a striped circus tent with strings of lights'],
  ['jungle', 'Jungle', 700, '🌴', 'a leafy green jungle with vines and big flowers'],
  ['volcano', 'Dino valley', 750, '🌋', 'a prehistoric valley with ferns, a far-off smoking volcano and friendly long-necked dinosaurs in the distance'],
  ['candy', 'Candy land', 850, '🍬', 'a land made of sweets with lollipop trees and jelly hills'],
  ['stadium', 'Stadium', 1000, '🏟️', 'a floodlit sports oval at night with a blurred crowd and no signs'],
  ['castle', 'Castle', 1100, '🏰', 'a storybook castle on a green hill'],
  ['pirateship', 'Pirate ship', 1200, '⛵', 'the deck of a wooden pirate ship at sea with plain sails'],
  ['snow', 'Snowy mountain', 1300, '🏔️', 'a sparkling snowy mountain top'],
  ['stage', 'Concert stage', 1400, '🎤', 'a concert stage with coloured spotlights and a blurred cheering crowd'],
  ['forge', 'Forge', 1500, '🔥', 'a warm fantasy blacksmith’s forge with a glowing fire'],
  ['clouds', 'Cloud kingdom', 1700, '🌈', 'a kingdom on top of fluffy clouds with a rainbow'],
  ['workshop', 'Robot workshop', 1850, '🔧', 'an inventor’s workshop full of friendly half-built robots'],
  ['space', 'Space', 2000, '🌌', 'outer space with stars, a ringed planet and a little rocket'],
  ['atlantis', 'Underwater city', 2400, '🫧', 'a glowing city of glass domes under the sea'],
  ['moon', 'The Moon', 2800, '🌙', 'the surface of the Moon with the Earth in the black sky behind him']
];
const HAIR: Row[] = [
  ['own', 'My own hair', 0, '💇', ''],
  ['spikes', 'Spiked up', 100, '⚡', 'his own hair gelled straight up into tall spikes'],
  ['blue', 'Electric blue', 700, '🔵', 'his own haircut dyed electric blue'],
  ['mohawk', 'Mohawk', 1100, '🦔', 'his hair styled into a tall mohawk'],
  ['pink', 'Hot pink', 1400, '🩷', 'his own haircut dyed hot pink'],
  ['mullet', 'Mullet', 1600, '🎸', 'his hair in a cheeky mullet'],
  ['green', 'Slime green', 2000, '🟢', 'his own haircut dyed slime green'],
  ['rainbow', 'Rainbow', 2400, '🌈', 'his own haircut dyed in rainbow stripes'],
  ['glitter', 'Glitter', 2800, '✨', 'his own haircut full of sparkling gold glitter']
];
const MOOD: Row[] = [
  ['smile', 'Smile', 0, '🙂', 'his own warm, natural smile, as on his character sheet'],
  ['cheeky', 'Cheeky', 0, '😏', 'a cheeky closed-mouth grin with one eyebrow up'],
  ['wow', 'Wow', 0, '😮', 'a look of delighted amazement'],
  ['laugh', 'Laughing', 0, '😄', 'laughing happily'],
  ['brave', 'Brave', 0, '😤', 'a brave, determined look'],
  ['wink', 'Wink', 0, '😉', 'a friendly wink'],
  ['silly', 'Silly', 0, '🤪', 'pulling a goofy, cross-eyed silly face']
];

const BUILT = [
  cat('hats', '🧢', 'Hats', 'hat', HATS), cat('eyewear', '🕶️', 'Face', 'eyewear', FACE),
  cat('tops', '👕', 'Clothes', 'top', TOPS, { key: 'topColour', label: 'Colour', items: TOP_COLOURS }),
  cat('gear', '🎺', 'Gear', 'gear', GEAR), cat('buddy', '🐉', 'Buddies', 'buddy', BUDDY), cat('scene', '🏝️', 'Places', 'scene', SCENE),
  cat('hair', '💇', 'Hair', 'hair', HAIR), cat('face', '🙂', 'Mood', 'mouth', MOOD)
];
/** What a painted child can choose from. */
export const WARDROBE: Category[] = BUILT.map(([c]) => c);
const PAINT = new Map<string, { emoji: string; words: string }>(BUILT.flatMap(([c, rows]) => rows.map((r): [string, { emoji: string; words: string }] => [`${c.key}:${r[0]}`, { emoji: r[3], words: r[4] }])));
/** The little picture on an item's tile. */
export const itemEmoji = (c: Category, id: string): string => PAINT.get(`${c.key}:${id}`)?.emoji ?? c.emoji;
/** The catalogue a child chooses from: the wardrobe when his character is painted, the drawn catalogue otherwise. */
export const catalogueOf = (painted: boolean): Category[] => (painted ? WARDROBE : CATALOGUE);

/** The parts of a look that the painter sees, with anything it does not know put back to plain. */
const PARTS: (keyof Look)[] = ['hat', 'eyewear', 'top', 'topColour', 'gear', 'buddy', 'scene', 'hair', 'mouth'];
const PLAIN: Partial<Look> = { hat: 'none', eyewear: 'none', top: 'tee', topColour: '#0b5fa5', gear: 'none', buddy: 'none', scene: 'plain', hair: 'own', mouth: 'smile' };
export const paintedParts = (l: Look): Record<string, string> => Object.fromEntries(PARTS.map((k) => {
  const v = String(l[k] ?? ''), ok = k === 'topColour' ? !!COLOUR_WORD[v] : PAINT.has(`${k}:${v}`);
  return [k, ok ? v : String(PLAIN[k])];
}));
/** A look with its parts made ones the wardrobe knows (a look saved by the drawn studio may name hair or a mouth it has not got). */
export const wardrobeLook = (l: Look): Look => ({ ...DEFAULT_LOOK, ...l, ...paintedParts(l) } as Look);

/** One short name for a combination of parts: the same parts always give the same name, so a look made once is never made twice. */
export const lookKey = (l: Look): string => {
  const s = JSON.stringify(paintedParts(l)); let a = 0x811c9dc5, b = 0x1b873593;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193); b = Math.imul(b ^ c, 0x85ebca6b) + a; }
  return ((a >>> 0).toString(36) + (b >>> 0).toString(36)).slice(0, 10);
};
/** The file a look is kept in. `who` is the child's helper name, or a code a grown-up has set for him. */
export const lookFile = (who: string, l: Look): string => `fhlook-${who.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'kid'}-${lookKey(l)}.jpg`;

/** The words for the painter. `about` is the family's own description of the child (kept in the dashboard, never in the repository). */
export const lookPrompt = (l: Look, about = ''): string => {
  const p = paintedParts(l), w = (k: keyof Look): string => PAINT.get(`${k}:${p[k]}`)?.words ?? '';
  const colour = COLOUR_WORD[p.topColour] ?? 'blue';
  const lines = [
    'Paint one picture of the boy on the attached character sheet. He must be exactly the same character: the same face, eyes, skin, build, age and drawing style as on the sheet, so that his family knows him at once.',
    about ? `About him: ${about}` : '',
    `Hair: ${w('hair') || 'exactly his own hair as on the sheet, the same cut and colour'}.`,
    `He is wearing ${w('top').replace('{c}', colour)}.`,
    w('hat') ? `On his head: ${w('hat')}. His face stays fully visible.` : 'Nothing on his head.',
    w('eyewear') ? `Also: ${w('eyewear')}.` : '',
    w('gear') ? `He is holding ${w('gear')}.` : '',
    w('buddy') ? `With him, close beside him and looking friendly: ${w('buddy')}.` : '',
    `Behind him: ${w('scene')}, softly out of focus.`,
    `His expression: ${w('mouth')}.`,
    'Framing: a square picture, one boy only, seen from the chest up, facing the viewer, his face exactly in the middle from left to right. His face is about one third of the picture’s width and his eyes sit one third of the way down the picture. His whole head, and anything on it, is inside the picture with a little space above; what he holds and any buddy fit in beside and below him.',
    'It is a picture for a young child’s own profile: bright, warm, kind and funny. Nothing frightening, no weapons that look real, no other people.',
    'No text, letters, numbers, logos, brand names, flags or licensed characters anywhere in the picture.'
  ];
  return lines.filter(Boolean).join('\n');
};
