import { html, type TemplateResult } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

/**
 * The header's and the dock's buttons as small two-tone drawings a child can name without reading. Each is drawn with the
 * line in currentColor and two fills a look sets: --ic-a (the body) and --ic-b (the accent). Parts that move when the button
 * is pressed, or when its page opens, carry a p-… class (the motion is in styles.ts). Medicine has no moving part, on purpose.
 */
const A: Record<string, string> = {
  ask: '<path class="fa p-bubble" d="M5.5 4h13A2.5 2.5 0 0 1 21 6.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3.5V17h-1A2.5 2.5 0 0 1 3 14.5v-8A2.5 2.5 0 0 1 5.5 4z"/><path class="fb p-star" stroke-width="1.2" d="M12 6.2c.5 2.6 1.7 3.8 4.3 4.3-2.6.5-3.8 1.7-4.3 4.3-.5-2.6-1.7-3.8-4.3-4.3 2.6-.5 3.8-1.7 4.3-4.3z"/>',
  looks: '<path class="fa p-pal" d="M12 3a9 9 0 0 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.3-.6-2.1 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4C21 6.9 17 3 12 3z"/><circle class="fb p-dot d1" stroke="none" cx="7.6" cy="11.4" r="1.6"/><circle class="p-dot d2" fill="currentColor" stroke="none" cx="10.6" cy="7.4" r="1.6"/><circle class="fb p-dot d3" stroke="none" cx="15.4" cy="7.8" r="1.6"/>',
  medicine: '<path fill="none" d="M4.6 13.4l8.8-8.8a4.24 4.24 0 0 1 6 6l-8.8 8.8a4.24 4.24 0 0 1-6-6z"/><path class="fa" d="M9 9l6 6-4.4 4.4a4.24 4.24 0 0 1-6-6z"/>',
  info: '<circle class="fa p-disc" cx="12" cy="12" r="9"/><path class="p-i" fill="none" stroke-width="2.2" d="M12 11v5.5"/><circle class="p-dot" fill="currentColor" stroke="none" cx="12" cy="7.5" r="1.3"/>',
  night: '<path class="fa p-moon" d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/><path class="fb p-star" stroke-width="1.1" d="M16.8 2.6c.35 1.9 1.2 2.75 3.1 3.1-1.9.35-2.75 1.2-3.1 3.1-.35-1.9-1.2-2.75-3.1-3.1 1.9-.35 2.75-1.2 3.1-3.1z"/>',
  morning: '<path class="p-ray" fill="none" d="M12 9.6V7.4M17.6 12.4l1.6-1.6M6.4 12.4l-1.6-1.6"/><path class="fa p-sun" d="M6.3 18a5.7 5.7 0 0 1 11.4 0z"/><path fill="none" d="M2.5 18h19"/><path class="sb p-ground" fill="none" d="M7 21h10"/>',
  planner: '<path fill="none" d="M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.500 19z"/><path class="fa p-band" d="M3.5 10V6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5V10z"/><path class="p-ring" fill="none" d="M8 3v3.6M16 3v3.6"/><rect class="fb p-day" stroke-width="1.2" x="12.6" y="12.4" width="4.6" height="4.6" rx="1.2"/>',
  groceries: '<circle class="fb p-item" stroke-width="1.4" cx="13.6" cy="6.6" r="2.6"/><path class="fa p-cart" d="M6.3 8.5H21l-1.7 6.8a2 2 0 0 1-2 1.500H9.700a2 2 0 0 1-2-1.6z"/><path fill="none" d="M3 5h2.5l.8 3.5"/><path class="p-wheel" fill="none" stroke-width="2.8" d="M10 20.200h.01M17 20.200h.01"/>',
  doodle: '<path class="p-squiggle" pathLength="1" fill="none" d="M11.500 20.200c1.4-1.700 2.600 1.300 4.100 0s2.700 1.300 4.200 0"/><path class="fa p-pencil" d="M4 20l1-4.200L15.600 5.200a2 2 0 0 1 2.800 0l.4.4a2 2 0 0 1 0 2.800L8.200 19 4 20z"/><path class="fb p-tip" stroke-width="1.2" d="M4 20l1-4.200 3.200 3.200z"/><path fill="none" d="M13.500 7.300l3.200 3.200"/>',
  music: '<path class="fb p-beam" d="M9 5.500l11-2v3.200l-11 2z"/><path fill="none" d="M9 18V5.500M20 16V3.500"/><path class="fa p-note" d="M9 18a2.500 2.500 0 1 1-5 0 2.500 2.500 0 0 1 5 0zM20 16a2.500 2.500 0 1 1-5 0 2.500 2.500 0 0 1 5 0z"/>',
  weather: '<path class="p-ray" fill="none" d="M9 2.200v1.600M2.800 8.800h1.600M4.600 4.400l1.100 1.100M13.400 4.400l-1.100 1.100"/><circle class="fb p-sun" cx="9" cy="8.800" r="3.300"/><path class="fa p-cloud" d="M8 20a4.200 4.200 0 1 1 .9-8.300A5.600 5.600 0 0 1 19.600 13.500 3.300 3.300 0 0 1 18.200 20z"/>',
  home: '<path class="fa p-house" d="M5.500 10v10h13V10L12 4.600z"/><path class="p-roof" fill="none" d="M3.500 11L12 4l8.500 7"/><path class="fb p-door" d="M10 20v-5.500h4V20z"/>',
  allon: '<path class="p-ray" fill="none" d="M12 1.200v1.700M4.300 4.300l1.200 1.200M19.700 4.300l-1.200 1.200M1.800 11h1.700M20.500 11h1.700"/><path class="fa p-glow" d="M12 5.200a5.300 5.300 0 0 0-3.200 9.500c.6.500 1 1.200 1 2h4.400c0-.8.4-1.500 1-2A5.300 5.300 0 0 0 12 5.200z"/><path fill="none" d="M9.900 19h4.200M10.700 21.300h2.600"/>',
  alloff: '<path class="fb p-bulb" d="M12 3.500a6 6 0 0 0-3.600 10.800c.7.500 1.100 1.300 1.100 2.200h5c0-.9.4-1.700 1.100-2.200A6 6 0 0 0 12 3.500z"/><path fill="none" d="M9.500 18.700h5M10.500 21.200h3"/><path class="p-slash" pathLength="1" fill="none" stroke-width="2.2" d="M4 3.500l16 17"/>',
  dinner: '<path class="p-ring" fill="none" d="M3.200 8.600a9.800 9.800 0 0 1 2.300-3.200M20.800 8.600a9.800 9.800 0 0 0-2.300-3.200"/><path class="fa p-lid" d="M4.300 17a7.700 7.700 0 0 1 15.400 0z"/><circle class="fb p-knob" cx="12" cy="7.600" r="1.600"/><path fill="none" d="M2.300 19.800h19.400"/>'
};
/** Which drawing stands for an outline icon's name (the names the dock and header already use). */
const FOR: Record<string, string> = { sun: 'morning', calendar: 'planner', cart: 'groceries', pencil: 'doodle', music: 'music', cloud: 'weather', home: 'home', bulb: 'allon', bulbOff: 'alloff', megaphone: 'dinner', ask: 'ask', palette: 'looks', pill: 'medicine', info: 'info', moon: 'night' };
export const hasArt = (name: string): boolean => !!A[FOR[name] ?? name];
export const art = (name: string, size = 22): TemplateResult => { const n = FOR[name] ?? name;
  return html`<svg class="i pic2" data-ic=${n} aria-hidden="true" viewBox="0 0 24 24" style="--s:${size}px">${unsafeSVG(A[n] ?? '')}</svg>`; };
