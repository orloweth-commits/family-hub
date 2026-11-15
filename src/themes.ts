// Generated theme tokens – edit here, every view reads these CSS variables.
import sea from '../assets/bg-sea.jpg';
import sunset from '../assets/bg-sunset.jpg';
import reef from '../assets/bg-reef.jpg';
import bush from '../assets/bg-bush.jpg';
import space from '../assets/bg-space.jpg';

export type ThemeId = 'sea' | 'sunset' | 'reef' | 'bush' | 'space';
export interface ThemeDef { id: ThemeId; name: string; tagline: string; bg: string; vars: Record<string, string>;
  /** dark mode: the same place after dark. A second set of the theme's variables, laid over `vars` (dark.ts says when), and the layer that dims the photo behind the panels. Space has none: it is dark already. */
  dark?: Record<string, string>; dim?: string; }
const BG: Record<ThemeId, string> = { sea, sunset, reef, bush, space };

export const THEMES: ThemeDef[] = [
  { id: 'sea', name: 'Sea & Sun', tagline: 'Bright beach day', bg: BG.sea, vars: { '--ink': '#0b2236', '--ink2': '#2c4a63', '--ink3': '#566e82', '--glass': 'rgba(255,255,255,0.56)', '--glass-line': 'rgba(255,255,255,0.78)', '--shadow': '0 12px 32px rgba(8,40,70,0.12)', '--chip': 'rgba(255,255,255,0.74)', '--chip-strong': 'rgba(255,255,255,0.94)', '--chip-soft': 'rgba(255,255,255,0.36)', '--chip-faint': 'rgba(255,255,255,0.14)', '--track': 'rgba(11,34,54,0.13)', '--primary': '#0b5fa5', '--on-primary': '#ffffff', '--accent': '#c26a00', '--ok': '#0b7a52', '--p-1': '#0b5fa5', '--p-2': '#c2410c', '--p-3': '#a16207', '--p-4': '#0f766e', '--p-5': '#be185d', '--p-family': '#475569', '--on-person': '#ffffff', '--danger': '#c62828', '--ink-done': '#3d566b', '--wet': '#0f4c81' } },
  { id: 'sunset', name: 'Cottesloe Sunset', tagline: 'Warm and golden', bg: BG.sunset, vars: { '--ink': '#2b1408', '--ink2': '#5a3a26', '--ink3': '#765644', '--glass': 'rgba(255,250,244,0.58)', '--glass-line': 'rgba(255,255,255,0.75)', '--shadow': '0 12px 32px rgba(60,30,10,0.12)', '--chip': 'rgba(255,255,255,0.72)', '--chip-strong': 'rgba(255,255,255,0.92)', '--chip-soft': 'rgba(255,255,255,0.34)', '--chip-faint': 'rgba(255,255,255,0.12)', '--track': 'rgba(43,20,8,0.13)', '--primary': '#9a3412', '--on-primary': '#ffffff', '--accent': '#b45309', '--ok': '#15803d', '--p-1': '#1d4ed8', '--p-2': '#be123c', '--p-3': '#b45309', '--p-4': '#15803d', '--p-5': '#7e22ce', '--p-family': '#57534e', '--on-person': '#ffffff', '--danger': '#c62828', '--ink-done': '#5a3a26', '--wet': '#0f4c81' } },
  { id: 'reef', name: 'Coral Reef', tagline: 'Under the sea', bg: BG.reef, vars: { '--ink': '#03252b', '--ink2': '#1d4a51', '--ink3': '#2c555c', '--glass': 'rgba(236,255,255,0.66)', '--glass-line': 'rgba(255,255,255,0.6)', '--shadow': '0 12px 32px rgba(0,40,50,0.18)', '--chip': 'rgba(255,255,255,0.72)', '--chip-strong': 'rgba(255,255,255,0.94)', '--chip-soft': 'rgba(255,255,255,0.34)', '--chip-faint': 'rgba(255,255,255,0.12)', '--track': 'rgba(3,37,43,0.14)', '--primary': '#0e7490', '--on-primary': '#ffffff', '--accent': '#ea580c', '--ok': '#047857', '--p-1': '#1e40af', '--p-2': '#be185d', '--p-3': '#c2410c', '--p-4': '#047857', '--p-5': '#7c3aed', '--p-family': '#475569', '--on-person': '#ffffff', '--danger': '#c62828', '--ink-done': '#1d4a51', '--wet': '#0f4c81' } },
  { id: 'bush', name: 'Aussie Bush', tagline: 'Gum trees and red dirt', bg: BG.bush, vars: { '--ink': '#1c2a12', '--ink2': '#33432a', '--ink3': '#3f4f33', '--glass': 'rgba(252,250,238,0.7)', '--glass-line': 'rgba(255,255,255,0.7)', '--shadow': '0 12px 32px rgba(40,40,10,0.12)', '--chip': 'rgba(255,255,250,0.74)', '--chip-strong': 'rgba(255,255,250,0.94)', '--chip-soft': 'rgba(255,255,250,0.36)', '--chip-faint': 'rgba(255,255,250,0.14)', '--track': 'rgba(28,42,18,0.13)', '--primary': '#3f6212', '--on-primary': '#ffffff', '--accent': '#b45309', '--ok': '#15803d', '--p-1': '#1d4ed8', '--p-2': '#9d174d', '--p-3': '#b45309', '--p-4': '#4d7c0f', '--p-5': '#6d28d9', '--p-family': '#57534e', '--on-person': '#ffffff', '--danger': '#c62828', '--ink-done': '#33432a', '--wet': '#0f4c81' } },
  { id: 'space', name: 'Space Mission', tagline: 'Dark mode – blast off', bg: BG.space, vars: { '--ring-halo': '#0b0d2a', '--ink': '#f4f6ff', '--ink2': '#d8dcf8', '--ink3': '#b3b9e2', '--glass': 'rgba(22,24,58,0.72)', '--glass-line': 'rgba(255,255,255,0.14)', '--shadow': '0 12px 32px rgba(0,0,0,0.35)', '--chip': 'rgba(64,70,140,0.66)', '--chip-strong': 'rgba(84,92,172,0.82)', '--chip-soft': 'rgba(64,70,140,0.36)', '--chip-faint': 'rgba(64,70,140,0.16)', '--track': 'rgba(255,255,255,0.18)', '--primary': '#ffd166', '--on-primary': '#1a1640', '--accent': '#ffd166', '--ok': '#4ade80', '--p-1': '#7aa2ff', '--p-2': '#ff8fab', '--p-3': '#ffb86b', '--p-4': '#6ee7b7', '--p-5': '#c4a1ff', '--p-family': '#56607a', '--on-person': '#ffffff', '--danger': '#ff8a7a', '--ink-done': '#ccd1f2', '--wet': '#9fd4ff', '--on-ok': '#0b2414', '--on-danger': '#2a0b08', /* selected: a pale fill with dark ink; the tinted mix used by the light themes fell under AA here */ '--sel-bg': '#d6daff', '--sel-ink': '#14163a' } },
];

/** Person colours stay the same in every theme so each child is always recognisable. Each theme keeps its own `--p-family`, dark enough for the white initial on it. */
const PEOPLE: Record<string, string> = { '--p-1': '#2563eb', '--p-2': '#db2777', '--p-3': '#0f766e', '--p-4': '#c2410c', '--p-5': '#7c3aed', '--on-person': '#ffffff' };
for (const t of THEMES) Object.assign(t.vars, PEOPLE);

/**
 * Dark mode: each light theme after dark (Space needs none). The same keys as Space, so every page that reads the theme's variables follows.
 * Person colours are not here: they are the same in every theme, light or dark.
 * `dim` is laid over the photo, so the place is still that place at night and never a flat black.
 */
const DARK: Partial<Record<ThemeId, { vars: Record<string, string>; dim: string }>> = {
  sea: { dim: 'linear-gradient(rgba(6,16,30,.66), rgba(6,16,30,.76))', vars: { '--ring-halo': '#06121f', '--ink': '#eef5fb', '--ink2': '#cddbe8', '--ink3': '#a9bccd', '--glass': 'rgba(14,30,48,0.74)', '--glass-line': 'rgba(255,255,255,0.14)', '--shadow': '0 12px 32px rgba(0,0,0,0.35)', '--chip': 'rgba(52,84,118,0.66)', '--chip-strong': 'rgba(70,108,148,0.84)', '--chip-soft': 'rgba(52,84,118,0.36)', '--chip-faint': 'rgba(52,84,118,0.16)', '--track': 'rgba(255,255,255,0.18)', '--primary': '#7cc4ff', '--on-primary': '#06213a', '--accent': '#ffc46b', '--ok': '#4ade80', '--p-family': '#56677c', '--danger': '#ff8a7a', '--ink-done': '#c0cfdd', '--wet': '#9fd4ff', '--on-ok': '#0b2414', '--on-danger': '#2a0b08', '--sel-bg': '#cfe6fb', '--sel-ink': '#0b2236', '--mat': '#16202b', '--mat-lip': '#263443', '--mat-ink': 'rgba(255,255,255,.74)' } },
  sunset: { dim: 'linear-gradient(rgba(24,10,14,.66), rgba(24,10,14,.76))', vars: { '--ring-halo': '#1c0c0c', '--ink': '#fdf3ea', '--ink2': '#ead6c6', '--ink3': '#cbb3a2', '--glass': 'rgba(44,24,26,0.74)', '--glass-line': 'rgba(255,255,255,0.14)', '--shadow': '0 12px 32px rgba(0,0,0,0.35)', '--chip': 'rgba(110,66,62,0.66)', '--chip-strong': 'rgba(136,84,78,0.84)', '--chip-soft': 'rgba(110,66,62,0.36)', '--chip-faint': 'rgba(110,66,62,0.16)', '--track': 'rgba(255,255,255,0.18)', '--primary': '#ffb37a', '--on-primary': '#3a1606', '--accent': '#ffd166', '--ok': '#4ade80', '--p-family': '#6b5a55', '--danger': '#ff8a7a', '--ink-done': '#dcc6b6', '--wet': '#9fd4ff', '--on-ok': '#0b2414', '--on-danger': '#2a0b08', '--sel-bg': '#ffe1c9', '--sel-ink': '#2b1408', '--mat': '#221816', '--mat-lip': '#362824', '--mat-ink': 'rgba(255,255,255,.74)' } },
  reef: { dim: 'linear-gradient(rgba(2,18,24,.66), rgba(2,18,24,.76))', vars: { '--ring-halo': '#04161a', '--ink': '#ecfbfb', '--ink2': '#c8e2e4', '--ink3': '#a3c4c8', '--glass': 'rgba(8,36,42,0.74)', '--glass-line': 'rgba(255,255,255,0.14)', '--shadow': '0 12px 32px rgba(0,0,0,0.35)', '--chip': 'rgba(36,96,106,0.66)', '--chip-strong': 'rgba(50,120,132,0.84)', '--chip-soft': 'rgba(36,96,106,0.36)', '--chip-faint': 'rgba(36,96,106,0.16)', '--track': 'rgba(255,255,255,0.18)', '--primary': '#6fe0e6', '--on-primary': '#03252b', '--accent': '#ffa07a', '--ok': '#4ade80', '--p-family': '#52666c', '--danger': '#ff8a7a', '--ink-done': '#bcd8db', '--wet': '#9fd4ff', '--on-ok': '#0b2414', '--on-danger': '#2a0b08', '--sel-bg': '#c9f1f3', '--sel-ink': '#03252b', '--mat': '#121e20', '--mat-lip': '#213235', '--mat-ink': 'rgba(255,255,255,.74)' } },
  bush: { dim: 'linear-gradient(rgba(12,16,8,.66), rgba(12,16,8,.76))', vars: { '--ring-halo': '#0f140a', '--ink': '#f5f6ea', '--ink2': '#d9dcc6', '--ink3': '#b6bba0', '--glass': 'rgba(28,36,22,0.76)', '--glass-line': 'rgba(255,255,255,0.14)', '--shadow': '0 12px 32px rgba(0,0,0,0.35)', '--chip': 'rgba(78,96,60,0.66)', '--chip-strong': 'rgba(98,120,76,0.84)', '--chip-soft': 'rgba(78,96,60,0.36)', '--chip-faint': 'rgba(78,96,60,0.16)', '--track': 'rgba(255,255,255,0.18)', '--primary': '#c5e47a', '--on-primary': '#1c2a12', '--accent': '#ffb86b', '--ok': '#4ade80', '--p-family': '#5d6456', '--danger': '#ff8a7a', '--ink-done': '#cdd1b9', '--wet': '#9fd4ff', '--on-ok': '#0b2414', '--on-danger': '#2a0b08', '--sel-bg': '#e3f0c4', '--sel-ink': '#1c2a12', '--mat': '#1a1e16', '--mat-lip': '#2b3124', '--mat-ink': 'rgba(255,255,255,.74)' } },
};
for (const t of THEMES) { const d = DARK[t.id]; if (d) { t.dark = d.vars; t.dim = d.dim; } }

const DIM = 'linear-gradient(rgba(8,12,22,.66), rgba(8,12,22,.74))';
export const themeById = (id: string): ThemeDef => THEMES.find((t) => t.id === id) ?? THEMES[0];
/**
 * Sea & Sun has a horizon you can find at a glance: the sky pales down to one crisp line and the sea begins under it
 * (the picture alone fades from cloud to water over a wide blur). It is drawn over the picture as part of the background, so it is there
 * with the ambient scene off, in calm mode and in the theme's thumbnail. It only ever LIGHTENS: pale sky is laid over the blur above the
 * line and nothing is laid over the sea, so no ink written over the picture can lose contrast. The line sits where the picture's water
 * has reached its full blue (57% down); the time-of-day tint goes over it in the evening like the rest of the picture.
 */
const HORIZON: Partial<Record<ThemeId, string>> = {
  sea: 'linear-gradient(to bottom, rgba(228,244,253,0) 42%, rgba(228,244,253,.97) 51%, rgba(232,246,254,.98) 56.7%, rgba(255,255,255,.98) 56.7%, rgba(255,255,255,.98) 57%, rgba(255,255,255,0) 57%)',
};
/** Does this theme have a dark version to wear? */
export const hasDark = (t: ThemeDef): boolean => !!t.dark;
/** The theme as inline variables. `--dim` is the layer that dims the photo and the world drawn over it in the dark (styles.ts: .dkdim); it is given in the light as well, so the two can fade into each other. `photo` is a family photo standing in for the theme's picture. */
export const themeStyle = (t: ThemeDef, dark = false, photo = ''): string => {
  const dk = dark && !!t.dark, vars = dk ? { ...t.vars, ...t.dark } : t.vars;
  return Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';') + `${t.dark ? `;--dim:${t.dim ?? DIM}` : ''};--bg:${photo ? `url('${photo}')` : `${HORIZON[t.id] ? `${HORIZON[t.id]}, ` : ''}url(${t.bg})`}`;
};
