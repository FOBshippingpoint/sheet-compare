---
name: Sheet Compare Design System
colors:
  surface: "#fbf9fa"
  surface-dim: "#dbd9db"
  surface-bright: "#fbf9fa"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f5f3f5"
  surface-container: "#efedef"
  surface-container-high: "#eae7e9"
  surface-container-highest: "#e4e2e4"
  on-surface: "#1b1b1d"
  on-surface-variant: "#44474c"
  inverse-surface: "#303032"
  inverse-on-surface: "#f2f0f2"
  outline: "#75777d"
  outline-variant: "#c5c6cd"
  surface-tint: "#515f74"
  primary: "#1d2b3e"
  on-primary: "#ffffff"
  primary-container: "#334155"
  on-primary-container: "#9eadc5"
  inverse-primary: "#b9c7e0"
  secondary: "#505f76"
  on-secondary: "#ffffff"
  secondary-container: "#d0e1fb"
  on-secondary-container: "#54647a"
  tertiary: "#38270a"
  on-tertiary: "#ffffff"
  tertiary-container: "#503d1e"
  on-tertiary-container: "#c3a881"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#d5e3fd"
  primary-fixed-dim: "#b9c7e0"
  on-primary-fixed: "#0d1c2f"
  on-primary-fixed-variant: "#3a485c"
  secondary-fixed: "#d3e4fe"
  secondary-fixed-dim: "#b7c8e1"
  on-secondary-fixed: "#0b1c30"
  on-secondary-fixed-variant: "#38485d"
  tertiary-fixed: "#fcdeb3"
  tertiary-fixed-dim: "#dfc299"
  on-tertiary-fixed: "#281901"
  on-tertiary-fixed-variant: "#574424"
  background: "#fbf9fa"
  on-background: "#1b1b1d"
  surface-variant: "#e4e2e4"
typography:
  h1:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 24px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
  body:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
  data-cell:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
  label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 16px
spacing:
  base: 4px
  xs: 2px
  sm: 4px
  md: 8px
  lg: 12px
  container-padding: 16px
  row-height-dense: 24px
  row-height-standard: 32px
---

## Brand & Style

The design system is rooted in **Modern Minimalism** with a focus on functional efficiency. It is built for technical users who prioritize data throughput over visual flair. The aesthetic is "Tool-First"—meaning the interface should disappear to let the data lead.

The emotional response is one of reliability, precision, and objectivity. By removing shadows, gradients, and rounded corners, the system conveys a structured, logical environment. It mimics the efficiency of a command-line interface but provides the discoverability of a graphical one.

## Colors

The palette is intentionally restrained to maintain high signal-to-noise ratios.

- **Foundation:** A light gray background ensures the white data cells pop, creating clear visual boundaries without needing heavy lines.
- **Primary Action:** A professional Slate (#334155) is used for primary buttons and active navigation states, providing a grounded, authoritative feel.
- **Status Tints:** Status colors use a "Wash and Ink" approach—light background tints for cell highlighting and high-contrast ink for text or icons. This ensures that even in dense tables, the status of a row is immediately scannable.
- **Neutrality:** Mid-grays are reserved for non-interactive metadata and secondary iconography to prevent visual clutter.

## Typography

This design system utilizes a dual-font strategy to separate interface logic from data values.

- **Interface (Inter):** Used for navigation, headers, and labels. It provides a clean, neutral tone that works well at small sizes.
- **Data (JetBrains Mono):** All technical data, ID strings, and values are rendered in monospaced type. This ensures vertical alignment across rows, making it easier for users to spot character differences in diffs or logs.
- **Scale:** The scale is compressed. A maximum size of 18px ensures that headers do not take up valuable vertical real estate. 12px is the standard for data density.

## Layout & Spacing

The layout utilizes a **Fluid Grid** approach, allowing the data tables to expand to the full width of the browser to maximize column visibility.

- **Density:** We use a strict 4px baseline grid.
- **Component Padding:** Padding is kept to a minimum (4px to 8px). Interactive elements like table rows have a fixed height to prevent "layout shift" during data loading.
- **Table Structure:** Tables are the primary layout container. Headers must remain sticky to the top of the viewport or container.
- **Gutters:** 1px borders act as the primary separator between columns, replacing the need for wide gutters.

## Elevation & Depth

The design system is strictly **Flat**. There are no shadows or Z-axis depth effects.

- **Hierarchy through Contrast:** Elevation is communicated via tonal layers. Background surfaces are `#f8fafc`, while primary content areas (like table bodies) are `#ffffff`.
- **Ghost Borders:** Interactive regions and containers are defined by 1px solid borders (`#e2e8f0`).
- **Focus States:** High-contrast outlines (2px Slate) are used for keyboard navigation and focus, ensuring the "flat" look does not compromise accessibility.

## Shapes

The shape language is **Sharp (0px)**.

Every UI element—including buttons, input fields, and status tags—uses 90-degree corners. This reinforces the utilitarian and technical nature of the tool, maximizing every pixel of space and aligning perfectly with the underlying grid. This "rectilinear" approach ensures that borders between cells are crisp and clean.

## Components

- **Buttons:** Rectangular, flat color fills for primary actions. Secondary actions use 1px borders with no fill. Padding: `4px 12px`.
- **Data Tables:** The core component. Features include sticky headers with a subtle border-bottom, zebra-striping (optional, using `#f1f5f9`), and hover states (`#f1f5f9`).
- **Status Badges:** Small, rectangular blocks of color. Text is always uppercase at 11px.
- **Input Fields:** 1px border, 0px border-radius. Inactive state: `#e2e8f0`. Focus state: `#334155`.
- **Tabs:** Underline style. Active tabs use a 2px bottom border in the primary Slate color.
- **Tree Views/Lists:** Used for file structures or nested data. Indentation is strictly 12px per level, using thin vertical guide lines to show nesting.
- **Diff Views:** Uses the defined Addition/Deletion/Update colors for full-row backgrounds. Text within these rows remains monospaced.
