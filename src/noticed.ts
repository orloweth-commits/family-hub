import type { Hass } from './types';

/* ------------------------------------------------------------------ *
 * "I noticed" (F3, the parents' loop): praise from a person, not from
 * the machine. A parent leaves a short note; it waits on the child's
 * page until he taps Thanks.
 *
 *   a parent writes    his page's settings (behind the PIN), "Leave a note": one tap on a ready line, or a few words
 *   it is kept         one line on the asks list (approve.ts), `note {…}`: no new list, and nothing Home Assistant runs
 *                      reads it (the bell, the digest and the approvals automation only read lines that start `ask `)
 *   the child sees it  a card over his page the next time it is looked at; Thanks takes the line off the list
 *
 * A note gives no points and counts nothing.
 * ------------------------------------------------------------------ */

export const NOTE_PREFIX = 'note ';
export const NOTE_MAX = 140;
/** One note. `id` always starts with a letter, so Home Assistant never reads it as a number. */
export interface Note { v: 1; id: string; kid: string; who: string; text: string; t: number; uid?: string }
/** Ready lines: what was seen, not a mark out of ten. A parent's own words do more; these are for one tap. */
export const NOTICED: string[] = [
  'I noticed you got ready without being asked.',
  'I noticed how hard you tried today.',
  'I noticed you helped without being asked.',
  'I noticed you kept going when it was hard.',
  'I noticed how kind you were to your brother.',
  'Thank you for your help today.'
];
export const noteClean = (text: string): string => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX);
export const noteParse = (description: string | null | undefined): Note | null => {
  const m = /^note (\{.*\})\s*$/s.exec(String(description ?? ''));
  if (!m) return null;
  try { const n = JSON.parse(m[1]) as Note; return n && n.v === 1 && typeof n.id === 'string' && typeof n.kid === 'string' && typeof n.text === 'string' && !!noteClean(n.text) ? { ...n, text: noteClean(n.text) } : null; } catch { return null; }
};
/** Notes can be kept: the list is there. (It is made with "Approve from a phone"; notes need no phone.) */
export const notesReady = (hass: Hass | undefined, list: string | undefined): boolean => !!list && !!hass?.states[list];
/** A parent leaves a note for one child. Resolves to false when there was nothing to say. */
export const leaveNote = async (hass: Hass, list: string, kid: { slug: string; name: string }, text: string): Promise<boolean> => {
  const t = noteClean(text); if (!t) return false;
  const n: Note = { v: 1, id: 'n' + Math.random().toString(36).slice(2, 8).padEnd(6, '0'), kid: kid.slug, who: kid.name, text: t, t: Date.now() };
  await hass.callService('todo', 'add_item', { item: `${kid.name}: a note from a parent`, description: NOTE_PREFIX + JSON.stringify(n) }, { entity_id: list });
  return true;
};
/** The notes waiting for one child, oldest first. */
export const notesFor = async (hass: Hass, list: string, slug: string): Promise<Note[]> => {
  const res = await hass.callWS<{ items: { uid?: string; status: string; description?: string | null }[] }>({ type: 'todo/item/list', entity_id: list });
  const out: Note[] = [];
  for (const i of res.items) { if (i.status !== 'needs_action') continue; const n = noteParse(i.description); if (n && n.kid === slug) out.push({ ...n, uid: i.uid }); }
  return out.sort((a, b) => a.t - b.t);
};
