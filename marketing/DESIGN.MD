---
name: Warm Editorial Utility
colors:
  surface: '#f5f6f8'
  surface-dim: '#d2daf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e0e8ff'
  surface-container-highest: '#dae2f9'
  on-surface: '#131b2c'
  on-surface-variant: '#5a413b'
  inverse-surface: '#283042'
  inverse-on-surface: '#edf0ff'
  outline: '#8e7069'
  outline-variant: '#e2bfb6'
  surface-tint: '#b22c09'
  primary: '#ae2a06'
  on-primary: '#ffffff'
  primary-container: '#d1421f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a2'
  secondary: '#555e74'
  on-secondary: '#ffffff'
  secondary-container: '#d7dff9'
  on-secondary-container: '#5a6278'
  tertiary: '#1c4cde'
  on-tertiary: '#ffffff'
  tertiary-container: '#4067f8'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a2'
  on-primary-fixed: '#3c0700'
  on-primary-fixed-variant: '#8a1c00'
  secondary-fixed: '#d9e2fc'
  secondary-fixed-dim: '#bdc6e0'
  on-secondary-fixed: '#121b2e'
  on-secondary-fixed-variant: '#3e475b'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#b8c4ff'
  on-tertiary-fixed: '#001454'
  on-tertiary-fixed-variant: '#0036ba'
  background: '#f9f9ff'
  on-background: '#131b2c'
  surface-variant: '#dae2f9'
  paper: '#fffdf8'
  surface-subtle: '#eef0f4'
  line: '#dfe3ea'
  line-strong: '#c8ced9'
  ink: '#172033'
  muted: '#687084'
  muted-subtle: '#8790a2'
  orange-dark: '#cf3f1f'
  orange-soft: '#fff0ea'
  blue-soft: '#edf1ff'
  green: '#1c9b6c'
  green-soft: '#e8f8f1'
  yellow: '#f5c84b'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 4.5rem
    fontWeight: '800'
    lineHeight: '0.95'
    letterSpacing: -0.06em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 3.1rem
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.05em
  headline-xl:
    fontFamily: Inter
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: -0.055em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: '1.05'
    letterSpacing: -0.045em
  headline-lg:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.045em
  headline-md:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.035em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.025em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: '1.45'
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.08em
  micro-caption:
    fontFamily: Inter
    fontSize: 0.5625rem
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.375rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4.5rem
  space-4xl: 6.5rem
  container-max: 73.75rem
  nav-height: 4.75rem
---

## Brand & Style

This design system blends crisp technical utility with warm, approachable editorial character. Built for high-frequency collaborative workflows and companion interfaces, the visual philosophy centers on humane focus, spatial clarity, and tactile reassurance.

The aesthetic fuses modern software minimalism with an inviting warmth: an off-white cream backdrop replaces the sterile glare of cold zinc surfaces, grounded by deep navy typography, energetic vermilion accents, and a triad of functional chromatic signals (cobalt blue, mint green, and warm sun yellow). It creates a calm, focused environment that balances productivity with visual friendliness.

## Colors

The palette establishes hierarchy through distinct roles:
- **Canvas & Surfaces**: The base canvas is `#fffdf8` (paper), evoking clean editorial stationery. Cards and floating panels adopt pure `#ffffff` to stand out with soft contrast. Secondary regions and inset rails step down to `#f5f6f8`.
- **Text & Structure**: Pure black is avoided. Primary text and deep CTA elements employ `#172033` (ink), delivering contrast without harshness. Secondary commentary and metadata use `#687084` (muted).
- **Brand & Accent Energy**: Vermilion `#f45b36` serves as the primary action color, paired with `#cf3f1f` for pressed/hover states and `#fff0ea` for ambient container tints.
- **Categorical Signal Triad**: Structured features, avatar tracks, and context modes map consistently across:
  - Vermilion (`#f45b36` / `#fff0ea`)
  - Cobalt Blue (`#3a62f3` / `#edf1ff`)
  - Mint Green (`#1c9b6c` / `#e8f8f1`)
- **Accent Highlight**: Warm gold `#f5c84b` is reserved for playful emphasis strokes, markers, and celebratory highlights.

## Typography

Typography relies on `Inter` across all structural roles, emphasizing tight tracking and disciplined weight shifts:
- **Headings & Hero Displays**: Headings use negative letter-spacing (`-0.045em` to `-0.06em`) and compact line heights (`0.95` to `1.1`), giving large editorial statements a solid, graphic presence.
- **Editorial Quotations**: When an editorial pause or testimonial voice is needed, a classic serif pairing (`Georgia, serif`) may be introduced at large display sizes to introduce warm conversational texture.
- **Eyebrows & Kicker Badges**: Uppercase eyebrows utilize `label-sm` with expanded letter-spacing (`0.08em` to `0.12em`) and bold weights to organize sections.
- **Compact UI Roles**: Dense companion components (e.g., chat streams, breadcrumbs, simulation cards) scale down to `0.6875rem` and `0.5625rem` while retaining high legibility via medium-to-bold weights and generous line-height cushions.

## Layout & Spacing

The layout is anchored by a centered container bounded at `73.75rem` (1180px) with fluid horizontal gutters (`min(calc(100% - 40px), 1180px)` on desktop, adapting to `calc(100% - 24px)` on mobile screens).

Key spatial principles:
- **Section Rhythm**: Generous vertical spacing sets a measured cadence (`6.5rem` desktop padding down to `4rem` on mobile devices).
- **Split Hero & Feature Grids**: Two-column responsive splits use asymmetric weighting (e.g., 52% text copy to 48% interactive viewport preview) with a `3.5rem` column gutter.
- **Internal Card Padding**: Compact informational cards conform to tight 12px–16px inner paddings, whereas structural feature shells take 28px–32px (expanding to 48px–64px in callout banners).
- **Responsive Stack Rules**: Below the `768px` breakpoint, multi-column feature comparisons and side-by-side demonstration splits drop into single-column flows, keeping status tags and pill actions pinned to top-left positions.

## Elevation & Depth

Visual hierarchy combines clean tonal surfaces, subtle structural borders, and diffused ambient drop shadows:
- **Layering & Borders**: Surfaces rely primarily on `#dfe3ea` 1px borders to define boundaries rather than dark heavy drop shadows. High-emphasis frames (e.g., outer app mockups, active textareas) elevate contrast with `#c8ced9`.
- **Soft Ambient Shadows**:
  - Floating application mockups: `0 20px 60px rgba(23, 32, 51, 0.12)`
  - Elevated status toasts and hover cards: `0 10px 30px rgba(23, 32, 51, 0.08)`
  - Interactive primary buttons: `0 8px 20px rgba(244, 91, 54, 0.22)` or `0 8px 20px rgba(23, 32, 51, 0.16)`
- **Glassmorphic Floating Bars**: Sticky navigation headers and modal overlays use `backdrop-filter: blur(16px)` with semi-transparent paper surfaces (`rgba(255, 253, 248, 0.88)`), creating depth as underlying content rolls underneath.
- **Focus Rings**: Focused inputs and interactive blocks use dual-layer outlines: 1px border shift to accent color plus a diffused ring `0 0 0 3px rgba(244, 91, 54, 0.12)`.

## Shapes

The shape system balances modern rounded software shells with pill-shaped badges:
- **Pill Radius (`999px`)**: Standard for operational badges, filter chips, state tags, and avatar status markers.
- **Standard UI Elements (`12px`)**: Buttons, text input bars, step indicators, and small cards use `12px` corner rounding for a friendly hand-held feel.
- **Macro Enclosures (`18px` to `24px`)**: Application window mockups, mode cards, and major hero callouts feature generous `18px` to `24px` radii, softening large content footprints.
- **Chat Bubbles & Directional Radius**: Directional message bubbles utilize asymmetric corners (e.g., `10px 10px 3px 10px` for outgoing notes and `10px 10px 10px 3px` for incoming responses) to reinforce visual directionality.

## Components

### Buttons
- **Primary Vermilion**: Fill `#f45b36`, text `#ffffff`, border none, border-radius `12px`, padding `10px 20px`, font-weight 700. On hover: background `#cf3f1f`, subtle upward lift of `-1px`, shadow `0 8px 20px rgba(244, 91, 54, 0.22)`.
- **Dark Ink CTA**: Fill `#172033`, text `#ffffff`, border-radius `12px`, padding `10px 20px`. On hover: background `#0c1321`, shadow `0 8px 20px rgba(23, 32, 51, 0.16)`.
- **Secondary / Ghost**: Fill `rgba(255, 253, 248, 0.7)`, border `1px solid #c8ced9`, text `#172033`. On hover: background `#ffffff`, border-color `#172033`.

### Badges & Pill Chips
- Full rounded `999px` geometry with `4px 10px` internal padding and uppercase letter-spacing.
- **Status Green**: Background `#e8f8f1`, text `#0e8158`, border `1px solid #b7ead6`.
- **Context Blue**: Background `#edf1ff`, text `#3a62f3`, border `1px solid #dfe4f7`.
- **Active Orange**: Background `#fff0ea`, text `#cf3f1f`, border `1px solid #ffd5c2`.

### Inputs & Composer Fields
- Background `#ffffff`, border `1px solid #dfe3ea`, border-radius `12px`, padding `10px 14px`, text color `#172033`, placeholder `#a6acb8`.
- Focus state: border-color `#f45b36` (or `#3a62f3` in companion sidebars), with outer glow `0 0 0 3px rgba(244, 91, 54, 0.1)`.

### Cards & Container Panels
- White cards (`#ffffff`) over cream paper (`#fffdf8`), outlined by a crisp hairline border `1px solid #dfe3ea` and corner radius `18px`.
- Interactive cards elevate with a `-1px` translate and border transition to `#c8ced9` over `150ms ease`.

### Message & Activity Feeds
- Compact micro-layout: 32px avatar units (color-coded to orange, blue, or green), 12px name labels in `#333b4b`, and conversational speech bubbles nested with 8px–10px radii.
