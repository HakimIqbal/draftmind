import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TweaksTheme = 'dark' | 'light';
export type TweaksFont =
  | 'fraunces-inter'
  | 'playfair-inter'
  | 'sans-inter'
  | 'sans-geist'
  | 'sans-ibmplex'
  | 'dmserif-dmsans';
export type TweaksDensity = 'compact' | 'cozy';
export type TweaksAccent = 'ember' | 'forest' | 'deep-blue' | 'plum' | 'charcoal';
export type TweaksRadius = 'sharp' | 'default' | 'rounded';
export type TweaksCopilotPosition = 'right' | 'left' | 'bottom';
export type TweaksPanelState = 'expanded' | 'collapsed';

interface TweaksState {
  theme: TweaksTheme;
  font: TweaksFont;
  density: TweaksDensity;
  accent: TweaksAccent;
  radius: TweaksRadius;
  copilotPosition: TweaksCopilotPosition;
  panelState: TweaksPanelState;
}

interface TweaksActions {
  setTweak: <K extends keyof TweaksState>(key: K, value: TweaksState[K]) => void;
  reset: () => void;
}

const defaults: TweaksState = {
  theme: 'light',
  font: 'fraunces-inter',
  density: 'compact',
  accent: 'ember',
  radius: 'default',
  copilotPosition: 'right',
  panelState: 'expanded',
};

export const useTweaksStore = create<TweaksState & TweaksActions>()(
  persist(
    (set) => ({
      ...defaults,
      setTweak: (key, value) => set({ [key]: value }),
      reset: () => set(defaults),
    }),
    { name: 'draftmind-tweaks' },
  ),
);
