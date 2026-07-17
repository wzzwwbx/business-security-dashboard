---
name: Obsidian Command
colors:
  surface: '#10131b'
  surface-dim: '#10131b'
  surface-bright: '#363942'
  surface-container-lowest: '#0b0e16'
  surface-container-low: '#181b23'
  surface-container: '#1c1f28'
  surface-container-high: '#272a32'
  surface-container-highest: '#32353d'
  on-surface: '#e0e2ed'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e0e2ed'
  inverse-on-surface: '#2d3039'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#afc6ff'
  primary: '#afc6ff'
  on-primary: '#002d6c'
  primary-container: '#528dff'
  on-primary-container: '#00275f'
  inverse-primary: '#0059c7'
  secondary: '#bfc6de'
  on-secondary: '#293043'
  secondary-container: '#3f465a'
  on-secondary-container: '#aeb4cc'
  tertiary: '#ffb695'
  on-tertiary: '#571e00'
  tertiary-container: '#ee681b'
  on-tertiary-container: '#4c1a00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001a43'
  on-primary-fixed-variant: '#004398'
  secondary-fixed: '#dbe2fb'
  secondary-fixed-dim: '#bfc6de'
  on-secondary-fixed: '#141b2d'
  on-secondary-fixed-variant: '#3f465a'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#10131b'
  on-background: '#e0e2ed'
  surface-variant: '#32353d'
  bg-deep-navy: '#0a0f1d'
  surface-navy: '#141b2d'
  success-emerald: '#52c41a'
  warning-amber: '#faad14'
  danger-crimson: '#ff4d4f'
  border-subtle: '#262e3f'
  text-muted: '#8c96a8'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-page: 24px
  card-padding: 12px
  density-tight: 4px
  density-comfortable: 12px
---

## Brand & Style

The design system is a high-performance, operations-focused interface designed for 24/7 mission-critical monitoring. It prioritizes information density, technical precision, and rapid situational awareness. The aesthetic leans into a **Corporate / Modern** framework with **Minimalist** efficiency, utilizing a deep navy backdrop to reduce eye strain in low-light operations centers.

The emotional response should be one of "Controlled Authority"—users must feel they are viewing an objective, real-time digital twin of their security infrastructure. The visual language uses clean lines, subtle glows for active status indicators, and high-contrast color-coding for critical alerts, ensuring that the most important data points emerge naturally from the dense information layer.

## Colors

This design system utilizes a "Deep Navy" monochromatic foundation to establish depth and hierarchy.
- **Background**: The base layer uses `#0a0f1d`, providing a non-distracting void that makes data-driven elements pop.
- **Surface**: Containers and cards use `#141b2d` to create subtle separation from the background without harsh contrast.
- **Accents**: Primary actions and active states use Electric Blue. 
- **Status Semantic**: Statuses follow standard Ops conventions (Emerald for Healthy, Amber for Warning, Crimson for Danger). 

Use subtle glows (0-4px blur) for active status LEDs and critical alert icons to simulate hardware dashboard indicators.

## Typography

Typography is bifurcated by purpose: **Inter** handles all UI chrome, navigational elements, and descriptive text for maximum legibility. **JetBrains Mono** is reserved for all variable data, timestamps, IP addresses, and telemetry values. This distinction allows the eye to immediately separate "labels" from "live data."

For high-density displays, use `data-label` in uppercase with slight tracking for metadata. Critical metrics should use `data-display` to ensure they are readable from a distance in a command center environment.

## Layout & Spacing

The system follows a **Fixed Grid** philosophy for dashboarding to ensure predictable data alignment. 
- **Grid**: A 12-column layout with 16px gutters.
- **Density**: High-density is the default. Information is packed using a 4px base increment. 
- **Structure**: Navigation is fixed to a narrow left-hand rail (64px width) to maximize horizontal real estate for charts and maps. 
- **Responsiveness**: On tablet scales, secondary telemetry sidebars collapse into drawers. On mobile, the grid reflows to a single column, prioritizing the "Critical Status" and "Alert Feed" over complex topology maps.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layers** rather than heavy shadows. 
- **Level 0 (Background)**: `#0a0f1d` - The bottom layer.
- **Level 1 (Panels)**: `#141b2d` - Main content containers with a 1px border of `#262e3f`.
- **Level 2 (Popovers/Modals)**: `#1c253a` - Lifted elements using a subtle 8px ambient shadow with a blue tint (`rgba(0, 0, 0, 0.4)`).

For "active" states (like a selected server node), use a 1px `primary-color` border with a `0 0 8px rgba(22, 119, 255, 0.3)` outer glow to simulate a lit-up console.

## Shapes

The design uses a consistent **8px (Rounded)** corner radius for all primary containers and buttons. This strikes a balance between the "rugged" look of professional equipment and the modern friendliness of SaaS platforms. 

- **Small elements** (Chips, Tags): 4px radius.
- **Status indicators**: Circular (fully rounded) for pulse animations or square for static state icons.

## Components

- **Buttons**: Primary buttons are solid `#1677ff`. Ghost buttons use a 1px border of `#262e3f` and gain a blue border on hover.
- **Status Chips**: Low-saturation backgrounds with high-saturation text (e.g., Danger chip: background `rgba(255, 77, 79, 0.1)`, text `#ff4d4f`).
- **Data Cards**: No external padding on the card itself; use internal 12px padding. Headers should have a subtle bottom border.
- **Input Fields**: Background `#0a0f1d` with `#262e3f` borders. On focus, the border transitions to Primary Blue with a 2px outer glow.
- **Monitors/Charts**: Use sparklines for trend data within lists. Area charts should use gradients that fade into the surface color.
- **Topology Nodes**: Square icons with 4px radius, featuring a centered status dot in the upper right corner.