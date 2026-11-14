import { html, type TemplateResult } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

/**
 * The header's and the dock's buttons as small filled illustrations on a 40 x 40 grid, lit from the top left. A drawing shows
 * something true about this house at this moment where the card already knows it: today's date on the calendar, today's weather,
 * the record that is playing, how much is on the grocery list, whether lights are on, tonight's moon. Where it knows nothing,
 * the drawing is simply a drawing: nothing is made up.
 * Parts that move when the button is pressed, or when its page opens, carry a p-… class (the motion is in styles.ts).
 * Medicine has no moving part and no colour, on purpose.
 */
export interface ArtData {
  /** planner: the day of the month and the weekday, as on a tear-off calendar */
  day?: number; dow?: string;
  /** weather: Home Assistant's condition, and whether it is night */
  cond?: string; dark?: boolean;
  /** music: whether something is playing, and its cover */
  playing?: boolean; cover?: string;
  /** groceries: things still on the list */
  count?: number;
  /** home, all on, all off: lights that are on */
  lit?: number;
  /** morning: how far the morning has got, 0 to 1 */
  frac?: number;
  /** night: the moon's age as a fraction of its month (0 new, 0.5 full), and whether this is the southern sky */
  moon?: number; south?: boolean;
}

const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
const n1 = (n: number): string => (Math.round(n * 10) / 10).toString();
/** a soft highlight, upper left, on a round thing */
const shine = (cx: number, cy: number, r: number, o = 0.38): string => `<ellipse cx="${n1(cx - r * 0.32)}" cy="${n1(cy - r * 0.38)}" rx="${n1(r * 0.42)}" ry="${n1(r * 0.26)}" fill="#fff" opacity="${o}" transform="rotate(-28 ${n1(cx - r * 0.32)} ${n1(cy - r * 0.38)})"/>`;
/** a little count in a round badge, upper right: how many, said as a number as well as by the drawing */
const badge = (n: number, fill: string): string => { const t = n > 99 ? '99+' : String(n), w = t.length > 2 ? 17 : t.length > 1 ? 14 : 12;
  return `<g class="p-badge"><rect x="${n1(38 - w)}" y="1" width="${w}" height="12" rx="6" fill="${fill}" stroke="#fff" stroke-width="1.5"/><text x="${n1(38 - w / 2)}" y="10.2" text-anchor="middle" font-size="8.5" font-weight="800" fill="#fff">${t}</text></g>`; };

const cloud = (x: number, y: number, s: number, top: string, under: string, cls = 'p-cloud'): string =>
  `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls}"><path d="M7.500 20a6.500 6.500 0 0 1-.6-12.970A9 9 0 0 1 24.200 8.300 5.900 5.900 0 0 1 23.500 20z" fill="${under}"/><path d="M7.500 18.200a5.600 5.600 0 0 1-.3-11.190A8.100 8.100 0 0 1 22.900 8.500a4.900 4.900 0 0 1 .6 9.700z" fill="${top}"/></g></g>`;
const sun = (cx: number, cy: number, r: number): string => {
  const rays = Array.from({ length: 8 }, (_, i) => `<rect x="${n1(cx - 1.3)}" y="${n1(cy - r - 5.600)}" width="2.600" height="4" rx="1.300" fill="#ffab1a" transform="rotate(${i * 45} ${cx} ${cy})"/>`).join('');
  return `<g class="p-ray">${rays}</g><circle class="p-sun" cx="${cx}" cy="${cy}" r="${r}" fill="#ffc933"/>${shine(cx, cy, r, 0.5)}`; };
/** The moon as it stands tonight: the lit part is on the left while it grows in the southern sky, on the right in the northern. */
const moonArt = (cx: number, cy: number, r: number, age = 0.12, south = true): string => {
  const p = Math.min(0.93, Math.max(0.07, ((age % 1) + 1) % 1)), k = (1 - Math.cos(2 * Math.PI * p)) / 2, waxing = p < 0.5, right = waxing !== south;
  const rx = n1(Math.abs(Math.cos(2 * Math.PI * p)) * r), limb = right ? 1 : 0, term = k < 0.5 ? (right ? 0 : 1) : (right ? 1 : 0);
  const litPath = k > 0.985 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffe28a"/>` : k < 0.02 ? '' : `<path d="M${cx} ${cy - r}A${r} ${r} 0 0 ${limb} ${cx} ${cy + r}A${rx} ${r} 0 0 ${term} ${cx} ${cy - r}z" fill="#ffe28a"/>`;
  return `<g class="p-moon"><circle cx="${cx}" cy="${cy}" r="${n1(r + 0.8)}" fill="#39415c"/>${litPath}<circle cx="${n1(cx + r * 0.3)}" cy="${n1(cy + r * 0.25)}" r="${n1(r * 0.16)}" fill="#000" opacity=".08"/><circle cx="${n1(cx - r * 0.25)}" cy="${n1(cy - r * 0.3)}" r="${n1(r * 0.11)}" fill="#000" opacity=".07"/></g>`; };
/** A plain crescent: the sign for a clear night on the Weather button (the Night button shows the real moon). */
const crescent = (cx: number, cy: number, r: number): string => `<g class="p-moon"><path d="M${n1(cx + r * 0.55)} ${n1(cy + r * 0.72)}A${r} ${r} 0 1 1 ${n1(cx + r * 0.1)} ${n1(cy - r * 0.98)}a${n1(r * 0.8)} ${n1(r * 0.8)} 0 0 0 ${n1(r * 0.45)} ${n1(r * 1.7)}z" fill="#ffd866" stroke="#e0a82e" stroke-width=".8" stroke-linejoin="round"/></g>`;
const star4 = (cx: number, cy: number, r: number, fill: string, cls = 'p-star'): string => { const q = n1(r * 0.3);
  return `<path class="${cls}" d="M${cx} ${n1(cy - r)}Q${n1(cx + +q)} ${n1(cy - +q)} ${n1(cx + r)} ${cy}Q${n1(cx + +q)} ${n1(cy + +q)} ${cx} ${n1(cy + r)}Q${n1(cx - +q)} ${n1(cy + +q)} ${n1(cx - r)} ${cy}Q${n1(cx - +q)} ${n1(cy - +q)} ${cx} ${n1(cy - r)}z" fill="${fill}"/>`; };

/** What kind of sky a Home Assistant condition is. */
export const skyOf = (cond = '', dark = false): 'sun' | 'partly' | 'cloud' | 'rain' | 'storm' | 'night' | 'nightcloud' | 'fog' | 'wind' | 'snow' =>
  /lightning|storm|hail/.test(cond) ? 'storm' : /rain|pour/.test(cond) ? 'rain' : /snow/.test(cond) ? 'snow' : /fog/.test(cond) ? 'fog' : /wind/.test(cond) ? 'wind'
    : /night/.test(cond) ? 'night' : /partly/.test(cond) ? (dark ? 'nightcloud' : 'partly') : /cloud/.test(cond) ? 'cloud' : dark ? 'night' : 'sun';

const DRAW: Record<string, (d: ArtData) => string> = {
  planner: (d) => `<rect x="5.500" y="8.500" width="29" height="28" rx="6" fill="#0b1f44" opacity=".16"/><rect x="5.500" y="7" width="29" height="28" rx="6" fill="#fff"/>
    <path class="p-band" d="M5.500 17v-4a6 6 0 0 1 6-6h17a6 6 0 0 1 6 6v4z" fill="#2f6fed"/><path d="M5.500 17h29v1.600h-29z" fill="#0b1f44" opacity=".1"/>
    <rect x="11.500" y="3.500" width="3.400" height="7.500" rx="1.700" fill="#16233b"/><rect x="25.100" y="3.500" width="3.400" height="7.500" rx="1.700" fill="#16233b"/>
    ${d.dow ? `<text x="20" y="15.300" text-anchor="middle" font-size="6.200" font-weight="800" letter-spacing=".5" fill="#fff">${esc(d.dow.toUpperCase())}</text>` : ''}
    ${d.day ? `<text class="p-day" x="20" y="31.200" text-anchor="middle" font-size="14.500" font-weight="800" fill="#16233b">${Math.round(d.day)}</text>` : `<rect class="p-day" x="14" y="22" width="12" height="8" rx="2.500" fill="#2f6fed" opacity=".35"/>`}`,
  groceries: (d) => { const full = (d.count ?? 1) > 0;
    return `<path d="M12 17a8 8 0 0 1 16 0" fill="none" stroke="#b8731c" stroke-width="3" stroke-linecap="round"/>
    ${full ? `<g class="p-item"><rect x="20.500" y="5.500" width="5.200" height="15" rx="2.600" fill="#f3cf96" transform="rotate(24 23.100 13)"/><path d="M21.600 8.600l3.300 1.500M20.700 11.400l3.300 1.500" stroke="#c99a52" stroke-width="1.100" stroke-linecap="round" transform="rotate(4 23 10)"/><circle cx="14.200" cy="14.800" r="5" fill="#59b96a"/><path d="M14.200 10.200c.3-1.500 1.300-2.300 2.600-2.500" fill="none" stroke="#2f7d3f" stroke-width="1.400" stroke-linecap="round"/>${shine(14.2, 14.8, 5, 0.45)}</g>` : ''}
    <path d="M5.500 17.500h29l-2.700 14.200a4 4 0 0 1-3.900 3.300H12.100a4 4 0 0 1-3.900-3.300z" fill="#e9a23b"/><path d="M5.500 17.500h29l-.7 3.700H6.200z" fill="#f6c36d"/>
    <path d="M13 23.500v8M20 23.500v8M27 23.500v8" stroke="#b8731c" stroke-width="1.800" stroke-linecap="round" opacity=".75"/>
    <rect x="3.500" y="15.500" width="33" height="4.200" rx="2.100" fill="#c8811f"/>${d.count && d.count > 0 ? badge(d.count, '#14592c') : ''}`; },
  doodle: () => `<path class="p-squiggle" pathLength="1" d="M17 33.500c2.500-3.200 4.600 2.400 7.300 0s4.700 2.400 7.400 0 3.300-1.300 4.300-.2" fill="none" stroke="#7c5cff" stroke-width="2.800" stroke-linecap="round"/>
    <g transform="rotate(45 20 20)"><g class="p-pencil"><rect x="15" y="-1" width="10" height="27" rx="2.500" fill="#ff5fa2"/><rect x="15" y="-1" width="3.600" height="27" rx="1.800" fill="#fff" opacity=".28"/><rect x="15" y="7" width="10" height="9" fill="#ffd0e3"/><path d="M15 9.500h10M15 13.500h10" stroke="#ff5fa2" stroke-width="1.200"/><path d="M15 26h10l-5 9z" fill="#f6c98e"/><path d="M17.800 31h4.400L20 35z" fill="#ff5fa2"/></g></g>`,
  music: (d) => `<circle cx="20" cy="21.200" r="16" fill="#0b1020" opacity=".18"/><g class="p-disc"><circle cx="20" cy="20" r="16" fill="#1c2130"/>
    <circle cx="20" cy="20" r="12.800" fill="none" stroke="#fff" stroke-width=".7" opacity=".14"/><circle cx="20" cy="20" r="10.200" fill="none" stroke="#fff" stroke-width=".7" opacity=".1"/>
    <path d="M20 4a16 16 0 0 1 11.300 4.700L20 20z" fill="#fff" opacity=".1"/><path d="M20 36a16 16 0 0 1-11.300-4.700L20 20z" fill="#fff" opacity=".06"/>
    ${d.cover ? `<clipPath id="fhrec"><circle cx="20" cy="20" r="7"/></clipPath><circle cx="20" cy="20" r="7" fill="#ff7a59"/><image href="${esc(d.cover)}" x="13" y="13" width="14" height="14" preserveAspectRatio="xMidYMid slice" clip-path="url(#fhrec)"/>` : `<circle cx="20" cy="20" r="7" fill="#ff7a59"/><path d="M20 13a7 7 0 0 1 7 7h-7z" fill="#ffb199"/>`}
    <circle cx="20" cy="20" r="1.500" fill="#f4f6fb"/></g>
    ${d.playing ? `<g class="p-eq"><rect x="26" y="25" width="13" height="13" rx="6.500" fill="#14592c" stroke="#fff" stroke-width="1.500"/><rect x="29.300" y="30" width="1.800" height="4.500" rx=".9" fill="#fff"/><rect x="31.600" y="28" width="1.800" height="6.500" rx=".9" fill="#fff"/><rect x="33.900" y="29.300" width="1.800" height="5.200" rx=".9" fill="#fff"/></g>` : ''}`,
  weather: (d) => { const k = skyOf(d.cond, d.dark);
    const drops = (n: number, fill: string): string => Array.from({ length: n }, (_, i) => `<rect class="p-drop" x="${n1(11.5 + i * 7)}" y="${n1(29.5 + (i % 2) * 1.5)}" width="2.800" height="6.500" rx="1.400" fill="${fill}" transform="rotate(18 ${n1(13 + i * 7)} 33)"/>`).join('');
    const lines = (ys: number[]): string => ys.map((y, i) => `<rect x="${7 + i * 3}" y="${y}" width="${24 - i * 5}" height="2.800" rx="1.400" fill="#9fb0c6"/>`).join('');
    if (k === 'sun') return sun(20, 20, 9);
    if (k === 'partly') return `${sun(14.5, 14, 6.800)}${cloud(8, 13.5, 1.05, '#ffffff', '#cdd8e8')}`;
    if (k === 'cloud') return `${cloud(15, 5, 0.75, '#e3eaf4', '#b9c6d8', 'p-back')}${cloud(4.5, 11.5, 1.1, '#ffffff', '#cdd8e8')}`;
    if (k === 'rain') return `${cloud(5, 4.500, 1.08, '#c3cfdf', '#93a3b9')}${drops(3, '#3b82f6')}`;
    if (k === 'storm') return `${cloud(5, 4.500, 1.08, '#8f9db3', '#66758d')}<path class="p-bolt" d="M21.500 23h-6l-2.500 7.500h4.200L15.500 38l9-10h-4.800z" fill="#ffc933" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>`;
    if (k === 'snow') return `${cloud(5, 4.500, 1.08, '#e3eaf4', '#b9c6d8')}<circle cx="13" cy="32" r="2" fill="#8fc7ff"/><circle cx="20" cy="34.500" r="2" fill="#8fc7ff"/><circle cx="27" cy="32" r="2" fill="#8fc7ff"/>`;
    if (k === 'fog') return `${cloud(6.500, 3, 1, '#e3eaf4', '#b9c6d8')}${lines([26, 31])}`;
    if (k === 'wind') return `${cloud(15, 3, 0.8, '#e3eaf4', '#b9c6d8')}<path class="p-cloud" d="M5 24h19a4 4 0 1 0-3.800-5.200M5 30h25a3.500 3.500 0 1 1-3.300 4.600" fill="none" stroke="#7f93ad" stroke-width="2.800" stroke-linecap="round"/>`;
    if (k === 'nightcloud') return `${crescent(15, 14, 9)}${star4(31, 8, 3.200, '#ffe28a')}${cloud(8.500, 14.500, 1.02, '#e3eaf4', '#b9c6d8')}`;
    return `${crescent(19, 20.500, 13)}${star4(32.500, 8.500, 4, '#ffd866')}${star4(8, 33, 2.600, '#ffe28a', 'p-star2')}`; },
  home: (d) => { const lit = d.lit ?? 0, win = (x: number, on: boolean): string => `<rect x="${x}" y="21" width="5.600" height="5.600" rx="1.300" fill="${on ? '#ffd24a' : '#93a6bd'}"/>${on ? `<path d="M${x + 2.8} 21v5.600M${x} ${23.8}h5.600" stroke="#e39a12" stroke-width=".9"/>` : `<path d="M${x + 2.8} 21v5.600M${x} ${23.8}h5.600" stroke="#6f8199" stroke-width=".9"/>`}`;
    return `<rect x="27" y="7.500" width="4.600" height="8" rx="1.200" fill="#a8502a"/><path d="M8.500 19h23v14.500a2.500 2.500 0 0 1-2.500 2.500H11a2.500 2.500 0 0 1-2.500-2.500z" fill="#fff4e3"/><path d="M8.500 19h23v3.200h-23z" fill="#0b1f44" opacity=".08"/>
    <path class="p-roof" d="M3.900 20.300L18 6.600a2.900 2.900 0 0 1 4 0l14.100 13.700a1.700 1.700 0 0 1-1.200 2.900H5.100a1.700 1.700 0 0 1-1.200-2.900z" fill="#e0703c"/><path d="M6.500 19.800L19.100 7.600a1.300 1.300 0 0 1 1.800 0l3.300 3.200L13.800 20z" fill="#fff" opacity=".22"/>
    ${win(11.2, lit >= 1)}${win(23.2, lit >= 2)}<rect class="p-door" x="17.200" y="25.500" width="5.600" height="10.500" rx="1.400" fill="#8a5630"/><circle cx="21.400" cy="31" r=".8" fill="#f6c36d"/>`; },
  morning: (d) => { const f = Math.max(0, Math.min(1, d.frac ?? 0.5)), cy = n1(27 - f * 11);
    return `<clipPath id="fhsky"><rect x="0" y="0" width="40" height="28"/></clipPath><g clip-path="url(#fhsky)">${sun(20, +cy, 9)}</g>
    <path d="M2 28c5-3.200 9.500-3.200 14.500-.6s9.800 2.700 14 .4 5.500-2.300 7.500-1.800v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="#6fbf73"/><path d="M2 28c5-3.200 9.500-3.200 14.500-.6s9.800 2.700 14 .4 5.500-2.300 7.500-1.800v2.600c-2-.5-3.300-.5-7.500 1.800s-9 2.200-14-.4-9.500-2.600-14.500.6z" fill="#9bdc8f"/>`; },
  allon: () => `<g class="p-ray">${[-60, -30, 0, 30, 60].map((a) => `<rect x="18.700" y="1" width="2.600" height="4.600" rx="1.300" fill="#ffab1a" transform="rotate(${a} 20 18)"/>`).join('')}</g>
    <path class="p-glow" d="M20 7.500a10.300 10.300 0 0 0-6.100 18.600c1 .8 1.600 1.900 1.700 3.100h8.800c.1-1.200.7-2.300 1.700-3.100A10.300 10.300 0 0 0 20 7.500z" fill="#ffd24a"/>${shine(20, 17, 9.5, 0.55)}
    <path d="M17.300 22.500l2.700-4 2.700 4" fill="none" stroke="#e39a12" stroke-width="1.500" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="15.200" y="29.200" width="9.600" height="6" rx="2" fill="#8792a2"/><path d="M15.200 32.200h9.600" stroke="#5f6b7c" stroke-width="1.200"/><rect x="17.200" y="35.200" width="5.600" height="2.300" rx="1.150" fill="#5f6b7c"/>`,
  alloff: (d) => `<path class="p-bulb" d="M20 7.500a10.300 10.300 0 0 0-6.100 18.600c1 .8 1.600 1.900 1.700 3.100h8.800c.1-1.200.7-2.300 1.700-3.100A10.300 10.300 0 0 0 20 7.500z" fill="#aab5c4"/>${shine(20, 17, 9.5, 0.3)}
    <path d="M17.300 22.500l2.700-4 2.700 4" fill="none" stroke="#7b8799" stroke-width="1.500" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="15.200" y="29.200" width="9.600" height="6" rx="2" fill="#8792a2"/><path d="M15.200 32.200h9.600" stroke="#5f6b7c" stroke-width="1.200"/><rect x="17.200" y="35.200" width="5.600" height="2.300" rx="1.150" fill="#5f6b7c"/>
    <g class="p-slash"><rect x="17.600" y="1.500" width="4.800" height="37" rx="2.400" fill="#fff" transform="rotate(-45 20 20)"/><rect x="18.500" y="2.500" width="3" height="35" rx="1.500" fill="#3a4250" transform="rotate(-45 20 20)"/></g>${d.lit && d.lit > 0 ? badge(d.lit, '#3a4250') : ''}`,
  dinner: () => `<path class="p-ring" d="M9.500 6.500a15 15 0 0 1 4-3.200M30.500 6.500a15 15 0 0 0-4-3.200" fill="none" stroke="#e39a12" stroke-width="2.600" stroke-linecap="round"/>
    <g class="p-bell"><circle cx="20" cy="24.700" r="11.500" fill="#0b1f44" opacity=".16"/><circle cx="20" cy="23.500" r="11.500" fill="#fff"/><circle cx="20" cy="23.500" r="10.300" fill="none" stroke="#e5484d" stroke-width="1.700"/><circle cx="20" cy="23.500" r="6.800" fill="#eef1f6"/>
    <path d="M12.800 16.500a9.800 9.800 0 0 1 6.200-2.700" fill="none" stroke="#fff" stroke-width="1.400" stroke-linecap="round" opacity=".9"/></g>
    <g class="p-fork"><rect x="2.600" y="20" width="3" height="16.500" rx="1.500" fill="#7d8899"/><path d="M1 10.500v6.200a3.100 3.100 0 0 0 6.200 0v-6.200" fill="none" stroke="#7d8899" stroke-width="1.700" stroke-linecap="round"/><path d="M4.100 10.500v7" stroke="#7d8899" stroke-width="1.700" stroke-linecap="round"/></g>
    <g class="p-knife"><rect x="34.400" y="20" width="3" height="16.500" rx="1.500" fill="#7d8899"/><path d="M34.400 22.500v-11.300c0-1 1-1.400 1.700-.7 1.700 1.800 2.400 4.400 2.400 7.200v4.800z" fill="#a9b3c1"/></g>`,
  ask: () => `<path class="p-bubble" d="M9 5.500h22a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H19.500l-7.800 6.300a1 1 0 0 1-1.700-.8V29.500H9a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6z" fill="#12a594"/><path d="M9 5.500h22a6 6 0 0 1 6 6v1.500H3v-1.500a6 6 0 0 1 6-6z" fill="#fff" opacity=".18"/>${star4(20, 17.500, 8, '#fff')}${star4(29.500, 11, 2.600, '#d5fff8', 'p-star2')}`,
  night: (d) => `${moonArt(19, 20.500, 13, d.moon ?? 0.12, d.south ?? true)}${star4(33.500, 8, 4, '#ffcc4d')}`,
  looks: () => `<path class="p-pal" d="M20 4.500C10.600 4.500 3.500 11 3.500 19.800c0 8.300 6.700 15.700 15.700 15.700 2.200 0 3.300-1.400 3.300-3 0-1.700-1.200-2.400-1.200-4 0-1.700 1.400-2.900 3.100-2.900h4.300c4.300 0 7.800-3.400 7.800-7.700C36.500 10 29.300 4.500 20 4.500z" fill="#f4d9a8"/><path d="M20 4.500C10.600 4.500 3.500 11 3.500 19.800c0 2 .4 4 1.100 5.800C5.500 14.500 12 8.500 22 7.500c4 .2 7.500 1.200 10 2.800C29 6.600 24.800 4.500 20 4.500z" fill="#fff" opacity=".4"/>
    <circle class="p-dot d1" cx="11" cy="20" r="3.200" fill="#3b82f6"/><circle class="p-dot d2" cx="15.500" cy="12.300" r="3.200" fill="#59b96a"/><circle class="p-dot d3" cx="24" cy="10.800" r="3.200" fill="#ffc933"/><circle class="p-dot d4" cx="30.300" cy="16.200" r="3.200" fill="#ff5fa2"/><circle cx="13.500" cy="28" r="2.600" fill="#c9a46a"/>`,
  medicine: () => `<g transform="rotate(-45 20 20)"><rect x="5" y="12.500" width="30" height="15" rx="7.500" fill="#eef1f5" stroke="#8792a2" stroke-width="1.600"/><path d="M20 12.500h7.500a7.500 7.500 0 0 1 0 15H20z" fill="#b9c2ce" stroke="#8792a2" stroke-width="1.600"/></g>`,
  info: () => `<circle cx="20" cy="21" r="15.500" fill="#0b1f44" opacity=".16"/><circle class="p-disc" cx="20" cy="20" r="15.500" fill="#3b6fd9"/>${shine(20, 20, 15.5, 0.3)}<circle class="p-dot" cx="20" cy="12.300" r="2.600" fill="#fff"/><rect class="p-i" x="17.600" y="17" width="4.800" height="12.500" rx="2.400" fill="#fff"/>`
};

/** Which drawing stands for an outline icon's name (the names the dock and header already use). */
const FOR: Record<string, string> = { sun: 'morning', calendar: 'planner', cart: 'groceries', pencil: 'doodle', music: 'music', cloud: 'weather', home: 'home', bulb: 'allon', bulbOff: 'alloff', megaphone: 'dinner', ask: 'ask', palette: 'looks', pill: 'medicine', info: 'info', moon: 'night' };
/** The inside of a drawing as SVG markup (the contact sheet uses this). */
export const drawing = (name: string, data: ArtData = {}): string => (DRAW[FOR[name] ?? name] ?? (() => ''))(data);
export const hasArt = (name: string): boolean => !!DRAW[FOR[name] ?? name];
/** The moon's age tonight as a fraction of its month: 0 new, 0.25 first quarter, 0.5 full. */
export const moonAge = (d = new Date()): number => { const days = d.getTime() / 86_400_000 - 10_962.76; return (((days / 29.530_588_853) % 1) + 1) % 1; };
export const art = (name: string, size = 22, data: ArtData = {}): TemplateResult => { const n = FOR[name] ?? name;
  return html`<svg class="i pic2" data-ic=${n} aria-hidden="true" viewBox="0 0 40 40" style="--s:${size}px">${unsafeSVG((DRAW[n] ?? (() => ''))(data))}</svg>`; };
