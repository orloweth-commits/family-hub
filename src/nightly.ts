import type { FamilyHubConfig, Hass, KidConfig } from './types';
import { artListOf, artOf, ART_DEFAULTS } from './artlib';
import { painter } from './media';

/* ------------------------------------------------------------------ *
 * The nightly artwork: three new pictures a night, painted unattended.
 *
 * It runs in Home Assistant itself, as an ordinary automation that
 * Settings writes from the card's own configuration (the children, their
 * character sheets, their calendars). Nothing else is installed: no
 * custom integration, no add-on, so it moves to another Home Assistant
 * by pressing "Set up" again. The key never leaves Home Assistant.
 *
 *  02:00, and again whenever Home Assistant starts (so a night it was
 *  switched off is caught up next morning):
 *   1. read the record (a to-do list); stop if tonight's pictures are
 *      there, if painting is off, or if the month's limit is reached
 *   2. read today's calendar and the weather
 *   3. ask the AI Task for three scenes, as fields. This step is also
 *      the safety check: only its wording of the scene reaches the
 *      painter, never a calendar title as typed
 *   4. paint each scene from the boys' character sheets (pictures land
 *      in Home Assistant's own media), and note it in the record
 *   5. write what happened on the record's "_status" line
 *
 * The record also carries a "_settings" line, written by the panel:
 * the monthly limit, the reckoned cost of a picture, the style.
 * ------------------------------------------------------------------ */

export const NIGHTLY_ID = 'family_hub_nightly_art';
export const NIGHTLY_ENTITY_HINT = /family hub.*art/i;

/** Adventures to rotate through. Six are offered each night, moving along the list, and the scene writer picks from them. */
export const ADVENTURES = [
  'riding friendly dragons over mountains', 'sailing a pirate ship to a treasure island', 'flying a home-made spaceship past ringed planets', 'exploring a jungle with a treasure map',
  'a deep-sea submarine among glowing fish', 'a dinosaur safari in a jeep', 'building a giant robot in a workshop', 'a hot-air balloon race over patchwork fields', 'knights guarding a storybook castle',
  'surfing a huge friendly wave with dolphins', 'a snowball fight with yeti cubs', 'a rocket-powered billy-cart race', 'camping under the Milky Way in the outback', 'a wizard school potion class gone bubbly',
  'riding giant turtles on a coral reef', 'a moon picnic with a view of the Earth', 'a circus with juggling and a human cannonball in a helmet', 'a candy land with lollipop trees', 'explorers on a rope bridge over a canyon',
  'a monster-truck rally with silly trucks', 'a cloud kingdom reached by beanstalk', 'a superhero team of their own invention saving a cat from a tree', 'a train ride through a land of giant books', 'time travellers meeting woolly mammoths',
  'a skate park on the rings of Saturn', 'a quokka tea party on an island', 'racing paper planes as big as gliders', 'a lighthouse rescue in a little red boat', 'inventors flying pedal-powered machines', 'a band playing on a floating stage at sunset',
  'a cricket match against kangaroos', 'gold prospecting in the outback with a wombat', 'a paddle down a river among black swans', 'a fossil dig that finds a whole dinosaur', 'kite flying on a windy headland with enormous kites', 'a treehouse city joined by zip-lines'
];
/** Every look is a flat cartoon (Oliver, 14 Nov 2026: the polished, half-real pictures sat in the uncanny valley); a look only changes its colours and line. */
const CARTOON = 'a flat 2D cartoon: simple shapes, clean outlines and flat colour, like a children’s animated series. Never photographic, never 3D-rendered, never semi-realistic, no realistic skin or lighting';
const STYLES: Record<string, string> = {
  house: `${CARTOON}, in bright, warm colours`,
  glass: `${CARTOON}, in bright, warm colours`,
  fridge: `${CARTOON}, drawn as if with felt pens and cut paper`,
  orbit: `${CARTOON}, in deep blues with warm highlights, like a retro space-age poster`,
  sports: `${CARTOON}, in bold floodlit colours, like a vintage sports poster`
};

const firstName = (k: KidConfig): string => k.name;
const kidCal = (k: KidConfig): string => k.calendar ?? `calendar.${(k.id ?? k.name).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

/** Why the nightly artwork cannot be set up yet; empty when it can. */
export const nightlyMissing = (hass: Hass | undefined, c: FamilyHubConfig): string => {
  if (!painter(hass, artOf(c).painter)) return 'Home Assistant has no AI Task entity that can paint pictures.';
  if (!hass?.states[artListOf(c)]) return 'The picture list has not been made yet.';
  if (!(c.kids ?? []).some((k) => k.sheet)) return 'No child has a character sheet yet.';
  return '';
};

/** The automation, as Home Assistant's automation editor would save it. */
export const nightlyAutomation = (hass: Hass | undefined, c: FamilyHubConfig): Record<string, unknown> => {
  const list = artListOf(c), ai = painter(hass, artOf(c).painter), kids = (c.kids ?? []).filter((k) => k.sheet);
  const boys = kids.map((k) => ({ name: firstName(k), sheet: `media-source://media_source/local/${k.sheet}`, mime: /\.png$/i.test(k.sheet ?? '') ? 'image/png' : 'image/jpeg', about: k.about ?? '', likes: k.likes ?? '' }));
  const cals = [...new Set([...kids.map(kidCal), ...(c.calendars ?? []).filter((x) => x.colour === 'family').map((x) => x.entity)])].filter((e) => !!hass?.states[e]);
  const names = boys.map((b) => b.name).join(', ');
  const field = (description: string): Record<string, unknown> => ({ description, required: true, selector: { text: {} } });
  const structure: Record<string, unknown> = {};
  for (const n of [1, 2, 3]) {
    structure[`scene${n}`] = field(`Picture ${n}: one or two sentences describing the scene, what each boy in it is doing, and the setting. No names of real places, brands or other people.`);
    structure[`who${n}`] = field(`Picture ${n}: the names of the boys in it, separated by commas. Only from: ${names}.`);
    structure[`theme${n}`] = field(`Picture ${n}: its theme in two to four words.`);
    structure[`event${n}`] = field(`Picture ${n}: the calendar event it is about, in a few words, or an empty string when it is an adventure.`);
  }
  const plan = [
    'You plan three cheerful pictures for a family’s kitchen display. They will be painted for young children to enjoy over breakfast.',
    `The boys who can appear: ${boys.map((b) => `${b.name}${b.likes ? ` (likes ${b.likes})` : ''}`).join('; ')}.`,
    'Today is {{ now().strftime("%A %-d %B") }}. The weather: {{ weather }}.',
    'What is on today’s calendar (it may be empty): {{ events | join("; ") if events else "nothing" }}.',
    'Adventures to choose from tonight: {{ offer | join("; ") }}.',
    'Themes used lately, which you must not repeat: {{ recent | join("; ") if recent else "none" }}.',
    'Rules: picture 1 is about something real from today’s calendar or the boys’ interests, the weather or the season (if the calendar is empty, use an interest). Picture 2 is one of tonight’s adventures. Picture 3 is your choice of either.',
    'Across the three pictures use one boy, two boys and all three boys at least once where you can, and give each boy a fair turn.',
    'Everything must be gentle, funny and safe for a four-year-old: nothing frightening, no danger that looks real, no weapons, no injuries, nothing rude. If a calendar entry is about anything medical, private, sad or adult, ignore it and use an interest instead.',
    'Give each boy only his own interests: never hand one boy another boy’s instrument, sport or toy. In each scene say by name who is holding or doing what (“Sam holds the trumpet; Riley rides the scooter”), so the painter cannot swap them.',
    'Describe each scene in your own words. Never copy a calendar entry as it is written, and never include a surname, an address, a school name, a brand or a licensed character.'
  ].join('\n');
  const paintWords = [
    'Paint one wide picture for a family’s kitchen display. {{ sc.scene }}',
    'The boys in it are exactly the boys on the attached character sheets, one sheet each, in this order: {{ sc.cast | map(attribute="name") | join(", ") }}. Keep each one’s face, hair, skin, build and age true to his sheet, so his family knows him at once.',
    '{% for b in sc.cast %}{{ b.name }}: {{ b.about }} {% endfor %}',
    'Style: {{ style }}. The boys stay recognisable in that style.',
    'Composition: a wide landscape picture. Every boy’s whole head sits inside the middle 70 per cent of the picture, well clear of the top and of both sides, because the edges are trimmed to fit the screen; calm, uncluttered space towards the edges.',
    'Bright, warm, kind and funny. Nothing frightening. No other people in the foreground.',
    'No text, letters, numbers, logos, brand names, flags or licensed characters anywhere in the picture. Books, signs, clothes and packets show pictures or plain colour only, never words.'
  ].join('\n');
  return {
    alias: 'Family Hub: nightly art',
    description: 'Paints three new pictures for the Family Hub screensaver each night. Written by the panel (Settings, Pictures): change it there, not here.',
    mode: 'single',
    triggers: [{ trigger: 'time', at: '02:00:00' }, { trigger: 'homeassistant', event: 'start' }],
    conditions: [],
    variables: {
      list, painter: ai, boys, adventures: ADVENTURES, styles: STYLES,
      defaults: { cap: ART_DEFAULTS.cap, cost: ART_DEFAULTS.cost }
    },
    actions: [
      { if: [{ condition: 'template', value_template: '{{ trigger is defined and trigger.platform == "homeassistant" }}' }], then: [{ delay: { minutes: 3 } }] },
      { action: 'todo.get_items', target: { entity_id: list }, data: { status: ['needs_action', 'completed'] }, response_variable: 'rec' },
      { variables: {
        items: '{{ rec[list]["items"] }}',
        today: '{{ now().strftime("%Y-%m-%d") }}',
        sdesc: '{% set ns = namespace(d="") %}{% for i in rec[list]["items"] %}{% if i.summary == "_settings" %}{% set ns.d = i.description or "" %}{% endif %}{% endfor %}{{ ns.d }}'
      } },
      { variables: {
        made: '{% set ns = namespace(n=0) %}{% for i in items %}{% set d = i.description or "" %}{% if ("\\"d\\":\\"" ~ today ~ "\\"") in d and "\\"kind\\":\\"art\\"" in d %}{% set ns.n = ns.n + 1 %}{% endif %}{% endfor %}{{ ns.n }}',
        month: '{% set ns = namespace(n=0) %}{% for i in items %}{% if ("\\"d\\":\\"" ~ today[:7]) in (i.description or "") %}{% set ns.n = ns.n + 1 %}{% endif %}{% endfor %}{{ ns.n }}',
        cap: '{{ (sdesc | regex_findall("\\"cap\\":([0-9.]+)") | first | default(defaults.cap)) | float(defaults.cap) }}',
        cost: '{{ (sdesc | regex_findall("\\"cost\\":([0-9.]+)") | first | default(defaults.cost)) | float(defaults.cost) }}',
        look: '{{ sdesc | regex_findall("\\"style\\":\\"([a-z]+)\\"") | first | default("house") }}',
        recent: '{% set ns = namespace(t=[]) %}{% for i in items %}{% set d = i.description or "" %}{% set m = d | regex_findall("\\"theme\\":\\"([^\\"]+)\\"") %}{% if m and "\\"kind\\":\\"art\\"" in d %}{% set ns.t = ns.t + [m[0]] %}{% endif %}{% endfor %}{{ ns.t[-12:] }}',
        offer: '{% set n = adventures | count %}{% set o = (now().strftime("%j") | int * 6) % n %}{{ ((adventures + adventures)[o:o + 6]) }}'
      } },
      { variables: { style: '{{ styles.get(look, styles.house) }}' } },
      { if: [{ condition: 'template', value_template: '{{ made | int > 0 }}' }], then: [{ stop: 'Tonight’s pictures are already painted.' }] },
      { if: [{ condition: 'template', value_template: '{{ (month | int + 3) * cost > cap }}' }], then: [
        { action: 'todo.update_item', target: { entity_id: list }, data: { item: '_status', description: '{{ {"d": today, "made": 0, "note": "The month’s limit has been reached, so nothing was painted."} | to_json }}' }, continue_on_error: true },
        { stop: 'The month’s limit has been reached.' }] },
      ...(cals.length ? [{ action: 'calendar.get_events', target: { entity_id: cals }, data: { start_date_time: '{{ today_at("00:00").isoformat() }}', end_date_time: '{{ (today_at("00:00") + timedelta(days=1)).isoformat() }}' }, response_variable: 'cal', continue_on_error: true }] : []),
      { variables: {
        events: cals.length ? '{% set ns = namespace(e=[]) %}{% if cal is defined %}{% for k, v in cal.items() %}{% for e in v.events %}{% set ns.e = ns.e + [(state_attr(k, "friendly_name") or "Family") ~ ": " ~ e.summary] %}{% endfor %}{% endfor %}{% endif %}{{ ns.e[:12] }}' : '{{ [] }}',
        weather: c.weather ? `{{ states("${c.weather}") | replace("-", " ") }}, {{ state_attr("${c.weather}", "temperature") }} degrees` : 'unknown'
      } },
      { action: 'ai_task.generate_data', data: { entity_id: ai, task_name: 'Family Hub art plan', instructions: plan, structure }, response_variable: 'plan', continue_on_error: true },
      { variables: {
        scenes: '{% set pd = plan.data if (plan is defined and plan.data is defined) else {} %}{% set ns = namespace(s=[]) %}{% for n in [1, 2, 3] %}{% set who = (pd["who" ~ n] | default("")) | lower %}{% set mine = namespace(c=[]) %}{% for b in boys %}{% if b.name | lower in who %}{% set mine.c = mine.c + [b] %}{% endif %}{% endfor %}{% if not mine.c %}{% set mine.c = [boys[(now().day + n) % (boys | count)]] %}{% endif %}{% set ns.s = ns.s + [{"n": n, "scene": pd["scene" ~ n] | default("The boys are enjoying " ~ offer[n - 1] ~ "."), "theme": pd["theme" ~ n] | default(offer[n - 1]), "event": pd["event" ~ n] | default(""), "cast": mine.c}] %}{% endfor %}{{ ns.s }}'
      } },
      { repeat: { for_each: '{{ scenes }}', sequence: [
        { variables: { sc: '{{ repeat.item }}' } },
        { action: 'ai_task.generate_image', data: { entity_id: ai, task_name: 'Family Hub art {{ today }} {{ sc.n }}', instructions: paintWords, attachments: '{% set ns = namespace(a=[]) %}{% for b in sc.cast %}{% set ns.a = ns.a + [{"media_content_id": b.sheet, "media_content_type": b.mime}] %}{% endfor %}{{ ns.a }}' }, response_variable: 'img', continue_on_error: true },
        // a picture that failed leaves the one before it in `img`: only a picture named for this scene is noted
        { if: [{ condition: 'template', value_template: '{{ img is defined and img.media_source_id is defined and img.media_source_id is search("_" ~ sc.n ~ "\\\\.[a-z]+$") }}' }], then: [
          { action: 'todo.add_item', target: { entity_id: list }, data: { item: '{{ img.media_source_id }}', description: '{{ {"d": today, "kind": "art", "who": sc.cast | map(attribute="name") | list, "theme": sc.theme, "event": sc.event, "look": look, "p": sc.scene} | to_json }}' } }] }
      ] } },
      { action: 'todo.get_items', target: { entity_id: list }, data: { status: ['needs_action', 'completed'] }, response_variable: 'rec2' },
      { action: 'todo.update_item', target: { entity_id: list }, continue_on_error: true, data: { item: '_status', description: '{% set ns = namespace(n=0) %}{% for i in rec2[list]["items"] %}{% set d = i.description or "" %}{% if ("\\"d\\":\\"" ~ today ~ "\\"") in d and "\\"kind\\":\\"art\\"" in d %}{% set ns.n = ns.n + 1 %}{% endif %}{% endfor %}{{ {"d": today, "made": ns.n, "note": ("" if ns.n >= 3 else "Only " ~ ns.n ~ " of 3 pictures could be painted. The painter may have been busy.")} | to_json }}' } }
    ]
  };
};

/** What the panel tells the automation, kept on the record's "_settings" line, and what the automation reports back on "_status". */
export interface NightStatus { d?: string; made?: number; note?: string }
type Raw = { uid: string; summary: string; description?: string | null };
export const syncNightly = async (hass: Hass | undefined, c: FamilyHubConfig, look: string): Promise<NightStatus | null> => {
  const list = artListOf(c);
  if (!hass?.states[list]) return null;
  const a = artOf(c), want = JSON.stringify({ cap: a.cap ?? ART_DEFAULTS.cap, cost: a.cost ?? ART_DEFAULTS.cost, style: a.style === 'house' ? 'house' : look });
  try {
    const items = (await hass.callWS<{ items: Raw[] }>({ type: 'todo/item/list', entity_id: list })).items ?? [];
    const set = items.find((i) => i.summary === '_settings'), status = items.find((i) => i.summary === '_status');
    if (hass.user?.is_admin) {
      if (!set) await hass.callService('todo', 'add_item', { item: '_settings', description: want }, { entity_id: list });
      else if ((set.description ?? '') !== want) await hass.callService('todo', 'update_item', { item: set.uid, description: want }, { entity_id: list });
      if (!status) await hass.callService('todo', 'add_item', { item: '_status', description: '{}' }, { entity_id: list });
    }
    try { return JSON.parse(status?.description || '{}') as NightStatus; } catch { return {}; }
  } catch { return null; }
};
