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
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7',
  star: 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z',
  pill: 'M4.6 13.4l8.8-8.8a4.24 4.24 0 0 1 6 6l-8.8 8.8a4.24 4.24 0 0 1-6-6zM9 9l6 6',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5.5M12 7.5h.01',
  pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  lock: 'M6 10.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19v-7A1.5 1.5 0 0 1 6 10.5zM8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5',
  bin: 'M5 7.5h14M9 7.5V4.5h6v3M6.5 7.5l1 13h9l1-13M10 11.5v5.5M14 11.5v5.5',
  timer: 'M12 6.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM12 10v4l2.5 2M9.5 3h5M12 3v3.5M18.5 6.5L20 5',
  thermo: 'M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0zM12 9v7.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  backspace: 'M9 5.5h10.5A1.5 1.5 0 0 1 21 7v10a1.5 1.5 0 0 1-1.5 1.5H9L3 12zM12 9.5l5 5M17 9.5l-5 5',
  alert: 'M12 3.5l9.5 16.5h-19zM12 10v4.5M12 17.5h.01',
  jar: 'M8 3.5h8M7.5 3.5v2.2C6 6.6 5 8 5 9.8V18a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V9.8c0-1.8-1-3.2-2.5-4.1V3.5M5 12h14',
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.7-4.7',
  sleeve: 'M3.5 5h11v14h-11zM14.5 7.5a4.5 4.5 0 0 1 0 9M14.5 12h.01M7 9h4',
  jukebox: 'M6 21V10a6 6 0 0 1 12 0v11zM6 14h12M9.5 17.5h5M12 7.5v3',
  radio: 'M4 9h16v11H4zM7.5 9l8.5-5M8.5 12.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM14 13h3.5M14 16h3.5',
  dial: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 3v2.5',
  desk: 'M6 4v16M12 4v16M18 4v16M4 9h4M10 15h4M16 7h4',
  plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4',
  scene: 'M3 18h18M5.5 18l1.5 3h10l1.5-3M12 4v14M12 5l6 9h-6',
  list: 'M4 6h16M4 12h16M4 18h16'
};
const F: Record<string, string> = {
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  prev: 'M6 6h2v12H6zM20 6v12L9.5 12z',
  next: 'M16 6h2v12h-2zM4 6v12l10.5-6z'
};

export const icon = (name: string, size = 22): TemplateResult =>
  html`<svg class="i" aria-hidden="true" viewBox="0 0 24 24" style="--s:${size}px">${svg`<path d=${P[name] ?? ''}></path>`}</svg>`;
export const solid = (name: string, size = 22): TemplateResult =>
  html`<svg aria-hidden="true" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;fill:currentColor">${svg`<path d=${F[name] ?? ''}></path>`}</svg>`;

export const weatherIcon = (cond: string): string =>
  /rain|pour|storm|lightning/.test(cond) ? 'rain' : /cloud|fog/.test(cond) ? 'cloud' : /night/.test(cond) ? 'moon' : 'sun';
