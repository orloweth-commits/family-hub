import type { FamilyHubConfig, Hass } from './types';
import { kidEntities } from './types';

/* ------------------------------------------------------------------ *
 * Approve from a phone (F3, the parents' loop). A reward that needs a
 * grown-up no longer needs the grown-up at the wall:
 *
 *   the child asks      his page writes one line to the "asks" list and sends the phones a notice
 *                       with two buttons, Approve and Not yet
 *   a parent answers    Home Assistant hears the button, and for Approve takes the points and writes
 *                       the reward ledger itself (no screen has to be on); the line is marked answered
 *   the child is told   his page shows the answer the next time it is looked at, and clears the line
 *
 * The answering is one automation, built by `haApprove()` from the card's
 * own configuration (as the digest's is), so no household's names are in
 * this repository. An ask carries what it is for; the automation decides
 * what an Approve does from its own list of children, never from the ask.
 * ------------------------------------------------------------------ */

export interface ApproveConfig {
  /** the phones that are asked: notify services such as notify.mobile_app_dads_phone. With none, big rewards ask for the PIN at the wall, as before */
  notify?: string[];
  /** the to-do list that holds what is waiting for an answer (default todo.family_hub_asks) */
  list?: string;
}
export const APPROVE_ID = 'family_hub_approve';
export const ASK_LIST = 'todo.family_hub_asks';
export const ASK_PREFIX = 'ask ';
export type Verdict = 'ok' | 'no' | 'short';
/** One request. `id` always starts with a letter, so Home Assistant never reads it as a number. */
export interface Ask { v: 1; id: string; k: 'reward'; kid: string; who: string; name: string; cost: number; t: number }

const NOTIFY = /^notify\.[a-z0-9_]+$/;
export const askList = (cfg: FamilyHubConfig | undefined): string => cfg?.approve?.list ?? ASK_LIST;
export const askPhones = (cfg: FamilyHubConfig | undefined): string[] => [...new Set((cfg?.approve?.notify ?? []).filter((n) => NOTIFY.test(n)))];
/** Approvals are wanted (a phone is named). Whether they can work yet also needs the list: see `askReady`. */
export const approveOn = (cfg: FamilyHubConfig | undefined): boolean => askPhones(cfg).length > 0;
export const askReady = (hass: Hass | undefined, a: { notify?: string[]; list?: string } | undefined): boolean => !!a && (a.notify ?? []).length > 0 && !!hass?.states[a.list ?? ASK_LIST];
export const approveEntity = (hass: Hass | undefined): string | undefined => Object.keys(hass?.states ?? {}).find((e) => e.startsWith('automation.') && hass!.states[e].attributes.id === APPROVE_ID);

export const newAskId = (): string => 'a' + Math.random().toString(36).slice(2, 8).padEnd(6, '0');
export const askText = (a: Ask): string => ASK_PREFIX + JSON.stringify(a);
/** Reads a line of the asks list: an open ask, or an answered one with its verdict. Null for anything else. */
export const askParse = (description: string | null | undefined): { ask: Ask; verdict?: Verdict } | null => {
  const m = /^(ask|ok|no|short) (\{.*\})\s*$/s.exec(String(description ?? ''));
  if (!m) return null;
  try { const a = JSON.parse(m[2]) as Ask; return a && a.v === 1 && typeof a.id === 'string' && typeof a.kid === 'string' ? { ask: a, ...(m[1] === 'ask' ? {} : { verdict: m[1] as Verdict }) } : null; } catch { return null; }
};

/** The child asks: one line on the list, then a notice to each phone with Approve and Not yet. Resolves to how many phones took it. */
export const sendAsk = async (hass: Hass, a: { notify?: string[]; list?: string }, ask: Ask, have: number): Promise<number> => {
  await hass.callService('todo', 'add_item', { item: `${ask.who}: ${ask.name}`, description: askText(ask) }, { entity_id: a.list ?? ASK_LIST });
  const res = await Promise.allSettled((a.notify ?? []).filter((n) => NOTIFY.test(n)).map((svc) => hass.callService('notify', svc.slice(7), {
    title: `${ask.who} would like a reward`, message: `${ask.name}, for ${ask.cost} points. ${ask.who} has ${Math.round(have)}. Press and hold for Approve or Not yet.`, // (an iPhone hides a notice's buttons until it is held)
    data: { tag: `fh-ask-${ask.id}`, group: 'family-hub', actions: [{ action: `FH_OK_${ask.id}`, title: 'Approve' }, { action: `FH_NO_${ask.id}`, title: 'Not yet' }] } })));
  return res.filter((r) => r.status === 'fulfilled').length;
};

const j = (v: unknown): string => JSON.stringify(v);

/** The automation that hears the phone's answer, as Home Assistant's config API takes it; null when no phone is named. */
export const haApprove = (cfg: FamilyHubConfig | undefined, owedEntity = 'todo.rewards_owed'): Record<string, unknown> | null => {
  if (!cfg || !approveOn(cfg)) return null;
  const list = askList(cfg), to = askPhones(cfg);
  const kids = Object.fromEntries((cfg.kids ?? []).map((k) => { const e = kidEntities(k); return [e.slug, e.points]; }));
  return {
    alias: 'Family Hub: approve from a phone',
    description: 'Hears Approve or Not yet from a parent’s phone for a reward a child has asked for. Approve takes the points and writes the reward ledger; Not yet changes nothing. Either way the child’s page is told. Written by the card from its own settings: change them in Settings, People and safety.',
    mode: 'queued', max: 10,
    triggers: [{ trigger: 'event', event_type: 'mobile_app_notification_action' }],
    conditions: [{ condition: 'template', value_template: "{{ trigger.event.data.action is defined and trigger.event.data.action is string and trigger.event.data.action is match('FH_(OK|NO)_a[a-z0-9]+$') }}" }],
    actions: [
      { action: 'todo.get_items', target: { entity_id: list }, data: { status: ['needs_action'] }, response_variable: 'asks' },
      { variables: { aid: "{{ trigger.event.data.action.split('_')[2] }}", yes: "{{ trigger.event.data.action.startswith('FH_OK_') }}" } },
      // (the line is found by its id; one already answered, by the other parent or twice by the same thumb, is not on the open list any more)
      { variables: { hit: `{{ (asks[${j(list)}]['items'] | selectattr('description', 'string') | selectattr('description', 'search', '^ask .*"id":"' ~ aid ~ '"') | list) if (asks is defined and asks is mapping and ${j(list)} in asks) else [] }}` } },
      { if: [{ condition: 'template', value_template: '{{ hit | count == 0 }}' }], then: [{ stop: 'That one has already been answered.' }] },
      // (the ask's own text is never kept in a variable: Home Assistant would turn it into a map, and it must go back on the list as text)
      { variables: { uid: '{{ hit[0].uid }}', line: '{{ hit[0].summary }}', rec: `{{ hit[0].description[${ASK_PREFIX.length}:] | from_json }}` } },
      { variables: { pe: `{{ ${j(kids)}.get(rec.kid, '') if rec is mapping else '' }}` } },
      { variables: { can: "{{ yes and rec is mapping and rec.k == 'reward' and pe != '' and (rec.cost | float(-1)) >= 0 and (states(pe) | float(0)) >= (rec.cost | float(0)) }}" } },
      { variables: { verdict: "{{ 'ok' if can else ('short' if yes else 'no') }}" } },
      { if: [{ condition: 'template', value_template: '{{ can }}' }], then: [
        { action: 'script.fh_add_points', data: { kid: '{{ rec.kid }}', points: '{{ 0 - (rec.cost | int) }}', lifetime: false, reason: 'reward: {{ rec.name }}' } },
        { action: 'todo.add_item', target: { entity_id: owedEntity }, data: { item: '{{ line }}', description: "{{ now().strftime('%d/%m/%Y') }} · {{ rec.cost | int }} pts · approved from a phone" }, continue_on_error: true }
      ] },
      { action: 'todo.update_item', target: { entity_id: list }, data: { item: '{{ uid }}', status: 'completed', description: `{{ verdict }} {{ hit[0].description[${ASK_PREFIX.length}:] }}` } },
      ...to.map((svc) => ({ action: svc, data: { title: "{{ {'ok': 'Approved', 'no': 'Not yet', 'short': 'Not enough points now'}[verdict] }}", message: "{{ line }}. {{ (rec.cost | int) ~ ' points were spent.' if verdict == 'ok' else 'No points were spent.' }}", data: { tag: 'fh-ask-{{ aid }}', group: 'family-hub' } }, continue_on_error: true }))
    ]
  };
};

/** Makes the asks list if Home Assistant has none, and writes the automation (a new one starts switched on); with no phone left, switches it off. */
export const syncApprove = async (hass: Hass, cfg: FamilyHubConfig): Promise<'made' | 'updated' | 'off' | 'none'> => {
  const want = haApprove(cfg), ent = approveEntity(hass);
  if (!want) { if (ent && hass.states[ent].state === 'on') { await hass.callService('automation', 'turn_off', { stop_actions: false }, { entity_id: ent }); return 'off'; } return 'none'; }
  const list = askList(cfg);
  if (!hass.states[list] && list === ASK_LIST) {
    const f = await hass.callApi<{ flow_id?: string }>('POST', 'config/config_entries/flow', { handler: 'local_todo', show_advanced_options: false });
    if (f?.flow_id) await hass.callApi('POST', `config/config_entries/flow/${f.flow_id}`, { todo_list_name: 'Family Hub asks' });
  }
  await hass.callApi('POST', `config/automation/config/${APPROVE_ID}`, { id: APPROVE_ID, ...want });
  return ent ? 'updated' : 'made';
};
