// Design tokens reconstructed from the Linen Paper Co. bundle (PNG renders).
// Page size: PNG export is 3240x2430 @3x  ->  CSS canvas 1080x810.
export const PAGE_W = 1080;
export const PAGE_H = 810;

// Shared cream paper (sampled from the bundle). Same across every palette.
export const PAPER = '#F5EFE6';

// Six palettes. `mid` = the accent color sampled from 04 _ Palettes.png.
// tint/deep/ink are derived (the real swatches are tints/shades of the accent).
export const THEMES = [
  { id: 'greige',   name: 'Greige',   mid: '#8A7B62', pantone: '14-1108' },
  { id: 'sage',     name: 'Sage',     mid: '#6E8059', pantone: '16-0424' },
  { id: 'lavender', name: 'Lavender', mid: '#8473A0', pantone: '16-3617' },
  { id: 'sky',      name: 'Sky',      mid: '#6F8DA4', pantone: '16-4214' },
  { id: 'blush',    name: 'Blush',    mid: '#A87567', pantone: '14-1511' },
  { id: 'clay',     name: 'Clay',     mid: '#9A6243', pantone: '16-1338' }
];

export const DEFAULT_THEME = 'greige';

// Fonts: bundle had no source .jsx, so exact families are unknown. These
// approximate the elegant high-contrast serif (display/dates/italics) and the
// light letter-spaced sans (labels/inputs) seen in the renders.
export const FONTS = [
  { family: 'Cormorant Garamond', weights: '400;500;600', italic: true },
  { family: 'Jost', weights: '300;400;500', italic: false }
];
