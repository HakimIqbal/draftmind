# Design System

DraftMind uses a CSS Variables-based design system with 7 tweakable parameters controlled via a Zustand store. All tokens are defined in `src/styles/tokens.css` and mapped into Tailwind via `tailwind.config.ts`.

---

## 10 Design Tenets

These tenets are mandatory. Every component must comply.

1. **Dark mode default** -- Login and Public Share pages use light mode. All other pages default to dark. Users can toggle via the Tweaks panel.

2. **Accent budget max 5% pixel ember** -- Accent color (ember `#e8743c`) is used in only 4 places: primary CTA fill (rare), status dot, AI sigil, and active tab underline. Everything else is monochrome.

3. **Status pill format** -- All status indicators use the standard pill: colored dot + label, transparent background, 1px border, 4-10px padding, 4px radius. No filled/colored background pills.

4. **Iconography monochrome** -- All icons are Lucide line glyphs at 1.5px stroke weight, `currentColor`. No other icon library is permitted.

5. **No emoji UI icons** -- Emoji may only appear in user-authored content (e.g., comment text). Never in navigation, buttons, or status indicators.

6. **VSCode collapsible panels** -- The editor uses collapsible side panels with a chevron handle and a 44px icon rail when collapsed. Panels follow a left/right split layout.

7. **Density compact default** -- Row height 44px, padding 16-20px, body text 13-14px. The "cozy" alternative increases spacing for users who prefer it.

8. **Typography discipline** -- Maximum 1 display serif heading per page. Metadata and technical content uses monospace. Body text uses the configured sans-serif.

9. **Editorial polish** -- PDF exports include: sigil top-left, brand top-right, page number bottom-right. These decorations do NOT appear in the app UI.

10. **Forbidden patterns** -- No saturated colored backgrounds, no centered modal loading spinners, no playful illustrations, no bright gradients, no heavy drop shadows.

---

## Token Categories

### 1. Theme (Tweaks Parameter 1)

| Value            | Description                                |
| ---------------- | ------------------------------------------ |
| `dark` (default) | Dark canvas `#16130f`, light ink `#f2efe8` |
| `light`          | Light canvas `#faf7f2`, dark ink `#1a1a1a` |
| `mixed`          | Reserved for hybrid layouts                |

Applied via `data-theme` attribute on `<html>`.

### 2. Font (Tweaks Parameter 2)

| Value                      | Display          | Body          | Mono           |
| -------------------------- | ---------------- | ------------- | -------------- |
| `fraunces-inter` (default) | Fraunces         | Inter Tight   | IBM Plex Mono  |
| `playfair-inter`           | Playfair Display | Inter Tight   | IBM Plex Mono  |
| `sans-inter`               | Inter Display    | Inter         | JetBrains Mono |
| `sans-geist`               | Geist            | Geist         | Geist Mono     |
| `sans-ibmplex`             | IBM Plex Sans    | IBM Plex Sans | IBM Plex Mono  |
| `dmserif-dmsans`           | DM Serif Display | DM Sans       | DM Mono        |

Applied via `data-font` attribute. Fonts are self-hosted in `public/fonts/`.

### 3. Density (Tweaks Parameter 3)

| Value               | Row Height | Card Padding | Body Size | Helper Size |
| ------------------- | ---------- | ------------ | --------- | ----------- |
| `compact` (default) | 44px       | 16px         | 14px      | 12px        |
| `cozy`              | 56px       | 24px         | 15px      | 13px        |

Applied via `data-density` attribute.

### 4. Accent (Tweaks Parameter 4)

| Value             | Color           |
| ----------------- | --------------- |
| `ember` (default) | `#e8743c`       |
| `forest`          | Green variant   |
| `deep-blue`       | Blue variant    |
| `plum`            | Purple variant  |
| `charcoal`        | Neutral variant |

The accent is mapped to `--accent` and `--accent-deep` CSS variables.

### 5. Radius (Tweaks Parameter 5)

| Value     | sm  | md   | lg   | xl   |
| --------- | --- | ---- | ---- | ---- |
| `sharp`   | 2px | 4px  | 4px  | 6px  |
| `default` | 4px | 6px  | 8px  | 12px |
| `rounded` | 6px | 10px | 12px | 16px |

Applied via `data-radius` attribute.

### 6. Copilot Position (Tweaks Parameter 6)

Controls the AI copilot panel placement: `right` (default), `left`, or `bottom`.

### 7. Panel State (Tweaks Parameter 7)

Controls whether editor side panels start `expanded` or `collapsed`.

---

## CSS Variable Reference

### Backgrounds

- `--bg-canvas` -- Page background
- `--bg-surface` -- Card/panel background
- `--bg-elevated` -- Elevated elements (dropdowns, popovers)
- `--bg-rail` -- Sidebar rail background

### Ink (Text)

- `--ink-primary` -- Primary text
- `--ink-secondary` -- Secondary/muted text
- `--ink-tertiary` -- Tertiary/placeholder text
- `--ink-quaternary` -- Disabled text

### Accent

- `--accent` -- Primary accent (ember)
- `--accent-deep` -- Darker accent for hover/active

### Semantic Colors

- `--amber-muted` -- Warning/attention
- `--sage-muted` -- Success/positive
- `--red-muted` -- Error/destructive

### Borders

- `--border-subtle` -- 6% opacity, for container grouping
- `--border-default` -- 10% opacity, standard borders
- `--border-strong` -- 16% opacity, emphasis borders

### Spacing

- `--gap-xs` through `--gap-xl` -- Density-responsive spacing scale
- `--row-height` -- Standard row height (44px compact, 56px cozy)
- `--card-padding` -- Card internal padding

### Typography

- `--font-display` -- Display/heading font family
- `--font-body` -- Body text font family
- `--font-mono` -- Monospace font family
- `--font-body-size` -- Body text size
- `--font-helper-size` -- Helper/caption text size

### Radius

- `--radius-sm` through `--radius-xl` -- Border radius scale

---

## Component Inventory (21 Primitives)

All components live in `src/components/ui/` and are built on Radix UI primitives with CVA (class-variance-authority) for variant management.

| Component     | File                | Description                                                      |
| ------------- | ------------------- | ---------------------------------------------------------------- |
| Button        | `button.tsx`        | Variants: primary-fill (rare), outline, ghost, link, destructive |
| Input         | `input.tsx`         | Text input with label, helper text, error state                  |
| Textarea      | `textarea.tsx`      | Multi-line text input                                            |
| Select        | `select.tsx`        | Dropdown select (Radix-based)                                    |
| Checkbox      | `checkbox.tsx`      | Standard checkbox                                                |
| Radio Card    | `radio-card.tsx`    | Card-style radio for onboarding and export modal                 |
| Chip          | `chip.tsx`          | Filter chip, text-only with underline active state               |
| Pill          | `pill.tsx`          | Status pill: dot + label, transparent bg, 1px border             |
| Card          | `card.tsx`          | Content container with surface background                        |
| Dialog        | `dialog.tsx`        | Modal dialog (Radix-based)                                       |
| Popover       | `popover.tsx`       | Floating popover (Radix-based)                                   |
| Dropdown Menu | `dropdown-menu.tsx` | Context/action menu (Radix-based)                                |
| Tabs          | `tabs.tsx`          | Underline-style tab navigation only                              |
| Tooltip       | `tooltip.tsx`       | Hover tooltip for icon buttons and truncated text                |
| Avatar        | `avatar.tsx`        | Initials-based avatar, deterministic color from seed             |
| Progress Bar  | `progress-bar.tsx`  | Thin 2px bar in accent color                                     |
| Progress Ring | `progress-ring.tsx` | Circular progress for health score display                       |
| Skeleton      | `skeleton.tsx`      | Loading placeholder with subtle pulse animation                  |
| Separator     | `separator.tsx`     | Hairline 1px divider at ink 6% opacity                           |
| Sigil         | `sigil.tsx`         | Section marker: monospace "section NN" with dot prefix           |
| Kbd           | `kbd.tsx`           | Keyboard shortcut hint in monospace                              |

---

## Usage Guidelines

### Accent Budget

- Maximum 5% of any screen's pixels should be the accent color.
- Accent is permitted only on: primary CTA button fill (sparingly), status dots, AI sigil markers, and active tab underlines.
- All other interactive elements use outline, ghost, or monochrome variants.

### Status Pills

- Always use the `Pill` component for status indicators.
- Format: colored dot (4px) + label text.
- Background: transparent. Border: 1px `--border-default`. Padding: 4-10px horizontal. Radius: 4px.
- Never use filled/colored background status badges.

### Icons

- Only use `lucide-react` icons throughout the application.
- Stroke: 1.5px, size: 24x24 (default) or 16x16 (inline).
- Color: always `currentColor` (inherits from parent text color).
- If Lucide lacks a needed icon, create a custom SVG in `src/components/icons/` matching Lucide style (1.5px stroke, 24x24 viewBox, currentColor).
- Provider brand icons (`src/components/icons/provider/`) are monochrome line glyphs, not colored logos.

### Typography

- One display/serif heading per page maximum.
- Body text uses the configured sans-serif font.
- Metadata, timestamps, version numbers, and technical identifiers use monospace.
- Never mix more than 2 font families on a single page (display + body, with mono for metadata).
