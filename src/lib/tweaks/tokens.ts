import type {
  TweaksTheme,
  TweaksFont,
  TweaksDensity,
  TweaksAccent,
  TweaksRadius,
} from '@/stores/tweaks-store';

export const THEME_OPTIONS: { value: TweaksTheme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export const FONT_OPTIONS: { value: TweaksFont; label: string }[] = [
  { value: 'fraunces-inter', label: 'Fraunces + Inter' },
  { value: 'playfair-inter', label: 'Playfair + Inter' },
  { value: 'sans-inter', label: 'Inter Tight' },
  { value: 'sans-geist', label: 'Geist' },
  { value: 'sans-ibmplex', label: 'IBM Plex' },
  { value: 'dmserif-dmsans', label: 'DM Serif + DM Sans' },
];

export const DENSITY_OPTIONS: { value: TweaksDensity; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'cozy', label: 'Cozy' },
];

export const ACCENT_OPTIONS: { value: TweaksAccent; label: string }[] = [
  { value: 'ember', label: 'Ember' },
  { value: 'forest', label: 'Forest' },
  { value: 'deep-blue', label: 'Deep Blue' },
  { value: 'plum', label: 'Plum' },
  { value: 'charcoal', label: 'Charcoal' },
];

export const RADIUS_OPTIONS: { value: TweaksRadius; label: string }[] = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'default', label: 'Default' },
  { value: 'rounded', label: 'Rounded' },
];
