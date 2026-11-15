import type { FamilyHubConfig, Hass } from './types';
import { kidEntities } from './types';

/* ------------------------------------------------------------------ *
 * End of term: unspent points become marbles (F5; UX review 5.2).
 * Points only hold their value if they cannot be hoarded for ever, so
 * on the last day of each school term each child's points are turned
 * into marbles for the family jar: what he saved goes to the thing
 * everyone is building together. Optional, and off until a rate is set.
 *
 *   jar.term_points   points for one marble (10, say). Absent or 0: off, and no automation exists.
 *
 * One automation, built by `haTerm()` from the card's settings. At 4 pm on a day that is the last day of a term it takes
 * whole marbles' worth of points from each child (what is left over stays his) and adds the marbles to the jar, up to
 * the jar's own maximum. It needs `school_terms` to know the day.
 * ------------------------------------------------------------------ */
export const TERM_ID = 'family_hub_term';
export const JAR = 'input_number.family_jar';
type Cfg = FamilyHubConfig | undefined;
export const termRate = (cfg: Cfg): number => { const n = Number((cfg?.jar as { term_points?: number } | undefined)?.term_points); return Number.isFinite(n) && n >= 1 ? Math.round(n) : 0; };
export const termEnds = (cfg: Cfg): string[] => [...new Set((cfg?.school_terms ?? []).map(([, z]) => z).filter((z) => /^\d{4}-\d{2}-\d{2}$/.test(String(z))))].sort();
export const termOn = (cfg: Cfg): boolean => termRate(cfg) > 0 && termEnds(cfg).length > 0 && (cfg?.kids ?? []).length > 0;
export const termEntity = (hass: Hass | undefined): string | undefined => Object.keys(hass?.states ?? {}).find((e) => e.startsWith('automation.') && hass!.states[e].attributes.id === TERM_ID);
const j = (v: unknown): string => JSON.stringify(v);

/** The automation, as Home Assistant's config API takes it; null when it is off. */
export const haTerm = (cfg: Cfg): Record<string, unknown> | null => {
  if (!cfg || !termOn(cfg)) return null;
  const rate = termRate(cfg), kids = (cfg.kids ?? []).map((k) => { const e = kidEntities(k); return { n: k.name, k: e.slug, p: e.points }; });
  return {
    alias: 'Family Hub: end-of-term points into the jar',
    description: `At 4 pm on the last day of a school term, each child’s unspent points become marbles in the family jar: ${rate} points for one marble. What is left over stays his. Written by the card from its own settings: change them in Settings, Rewards.`,
    mode: 'single',
    triggers: [{ trigger: 'time', at: '16:00:00' }],
    conditions: [{ condition: 'template', value_template: `{{ now().strftime('%Y-%m-%d') in ${j(termEnds(cfg))} }}` }],
    actions: [
      { variables: { KIDS: `{{ ${j(kids)} }}` } },
      // what each child gives: whole marbles only, worked out before anything is changed
      { variables: { give: `{%- set ns = namespace(g=[]) -%}{%- for k in KIDS -%}{%- set m = ((states(k.p) | float(0)) // ${rate}) | int -%}{%- if has_value(k.p) and m > 0 -%}{%- set ns.g = ns.g + [{'k': k.k, 'n': k.n, 'm': m}] -%}{%- endif -%}{%- endfor -%}{{ ns.g }}` } },
      { variables: { total: "{{ (give | map(attribute='m') | sum) if (give is iterable and give is not string) else 0 }}" } },
      { if: [{ condition: 'template', value_template: '{{ total | int(0) < 1 }}' }], then: [{ stop: 'No child has enough points for a marble.' }] },
      { repeat: { for_each: '{{ give }}', sequence: [
        { action: 'script.fh_add_points', data: { kid: '{{ repeat.item.k }}', points: `{{ 0 - (repeat.item.m | int) * ${rate} }}`, lifetime: false, jar: 0, grow: 0, reason: 'End of term: {{ repeat.item.m }} marbles for the family jar' }, continue_on_error: true }
      ] } },
      { action: 'input_number.set_value', target: { entity_id: JAR }, data: { value: `{{ [(states(${j(JAR)}) | float(0)) + (total | int), (state_attr(${j(JAR)}, 'max') | float(100000))] | min }}` }, continue_on_error: true }
    ]
  };
};
/** Writes the automation (a new one starts switched on), or switches it off when the setting is off. */
export const syncTerm = async (hass: Hass, cfg: FamilyHubConfig): Promise<'made' | 'updated' | 'off' | 'none'> => {
  const want = haTerm(cfg), ent = termEntity(hass);
  if (!want) { if (ent && hass.states[ent].state === 'on') { await hass.callService('automation', 'turn_off', { stop_actions: false }, { entity_id: ent }); return 'off'; } return 'none'; }
  await hass.callApi('POST', `config/automation/config/${TERM_ID}`, { id: TERM_ID, ...want });
  if (ent && hass.states[ent].state === 'off') await hass.callService('automation', 'turn_on', {}, { entity_id: ent });
  return ent ? 'updated' : 'made';
};
