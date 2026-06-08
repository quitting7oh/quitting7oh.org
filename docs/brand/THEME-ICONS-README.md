# quitting7oh.org — Lift Cup theme coverage

Your site ships **8 themes** (`accent-teal`, `zinc`, `slate`, `stone`, `neutral`, `rose`, `blue`, `green`)
in light and dark — 16 states. This package covers all of them.

## 1. In-page logo (covers every theme automatically)

`logo/lift-cup-themed.svg` colors itself from your theme tokens:

- cup -> `--foreground`
- arrow -> `--primary`

It only inherits CSS variables if the SVG is **inlined in the DOM** (an `<img src>` cannot
read page variables). Paste the markup into your header/component, or import the file as a
component. Brand fallbacks (`#243b40` / `#dd8a35`) render if no theme is set.

Override per placement if needed:

```css
.site-header .logo { --logo-cup: var(--foreground); --logo-arrow: var(--primary); }
```

`logo/lift-cup-mono.svg` is a single-color version that follows `currentColor`.

## 2. Favicons & app icons (one folder per theme)

`favicons/<theme>/` each contains:

| file | purpose |
|---|---|
| `favicon.svg` | open mark, auto light/dark, tuned to that theme |
| `favicon.ico` | tiled (primary), 16/32/48, legacy fallback |
| `apple-touch-icon.png` | 180px iOS home screen |
| `icon-192.png` / `icon-512.png` | Android / PWA |
| `icon-maskable-512.png` | Android adaptive (safe zone) |
| `site.webmanifest` | per-theme `theme_color` + `background_color` |

### Default head (pick your default theme, e.g. accent-teal)

```html
<link rel="icon" href="/favicons/accent-teal/favicon.ico" sizes="any">
<link rel="icon" href="/favicons/accent-teal/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicons/accent-teal/apple-touch-icon.png">
<link rel="manifest" href="/favicons/accent-teal/site.webmanifest">
<meta name="theme-color" content="#1d7260">
```

### Make the favicon follow the active theme (optional)

Browser tabs don't read your `data-theme`, but you can sync them. Include
`favicons/theme-sync.js` — it swaps the SVG favicon and `theme-color` whenever
`data-theme` (or the dark class / OS scheme) changes.

## 3. Theme reference

| theme | primary (light) | primary (dark) | background (light) | background (dark) |
|---|---|---|---|---|
| `accent-teal` | `#1d7260` | `#53c6ad` | `#eef7f5` | `#09110f` |
| `zinc` | `#2a2a32` | `#f0f0f0` | `#eeeef1` | `#0c0c0e` |
| `slate` | `#1f3451` | `#94b2db` | `#eaeff5` | `#0a0e15` |
| `stone` | `#604020` | `#d5b890` | `#f6f1ea` | `#130f0b` |
| `neutral` | `#262626` | `#ebebeb` | `#f2f2f2` | `#0d0d0d` |
| `rose` | `#d61f49` | `#e64c70` | `#f8edef` | `#150a0c` |
| `blue` | `#195ae6` | `#5588f6` | `#edf0f8` | `#0a0d15` |
| `green` | `#1d8743` | `#2dd269` | `#eef7f1` | `#08110c` |

`theme-coverage.html` renders the logo in all 16 states for visual sign-off.
