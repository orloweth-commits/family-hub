import { svg, html, type TemplateResult } from 'lit';

const P: Record<string, string> = {
  calendar: 'M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v12.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 10h17M8 3v4M16 3v4',
  cart: 'M3 5h2.5l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8.5H6.3M10 20h.01M17 20h.01',
  pencil: 'M4 20l1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20zM13.5 7.3l3.2 3.2',
  music: 'M9 18V5.5l11-2V16M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  home: 'M3.5 11L12 4l8.5 7M5.5 9.5V20h13V9.5M10 20v-5.5h4V20',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z',
  bulbOff: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3zM3.5 3.5l17 17',
  megaphone: 'M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  cloud: 'M7 18a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 11 3.5 3.5 0 0 1 18 18z',
  rain: 'M7 15a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 8 3.5 3.5 0 0 1 18 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3',
  palette: 'M12 3a9 9 0 0 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.3-.6-2.1 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4C21 6.9 17 3 12 3zM7.5 11h.01M10 7h.01M14.5 7h.01',
  close: 'M6 6l12 12M18 6L6 18',
  shuffle: 'M3 7h3l9 10h3M3 17h3l3-3.3M15 7h3M18 4l3 3-3 3M18 14l3 3-3 3',
  star: 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z'
};
const F: Record<string, string> = {
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  prev: 'M6 6h2v12H6zM20 6v12L9.5 12z',
  next: 'M16 6h2v12h-2zM4 6v12l10.5-6z'
};

export const icon = (name: string, size = 22): TemplateResult =>
  html`<svg class="i" aria-hidden="true" viewBox="0 0 24 24" style="width:${size}px;height:${size}px">${svg`<path d=${P[name] ?? ''}></path>`}</svg>`;
export const solid = (name: string, size = 22): TemplateResult =>
  html`<svg aria-hidden="true" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:currentColor">${svg`<path d=${F[name] ?? ''}></path>`}</svg>`;

export const weatherIcon = (cond: string): string =>
  /rain|pour|storm|lightning/.test(cond) ? 'rain' : /cloud|fog/.test(cond) ? 'cloud' : /night/.test(cond) ? 'moon' : 'sun';
