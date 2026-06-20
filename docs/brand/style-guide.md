# quitting7oh.org — Brand & Style Guide

A reference for anyone building something under the quitting7oh.org name —
an app, a companion tool, a microsite — who needs it to look and feel like
the main site. Every value here is pulled from the live codebase
(`src/styles/global.css`, `src/components/Logo.astro`), so matching these
matches the site exactly.

**The 30-second version:** warm and calm, not clinical or corporate.
Body text in **IBM Plex Sans**, headings in **Fraunces** (a serif). The
default palette is **stone** (warm beige/brown). The logo is the **Lift
Cup** — a coffee cup with an up-arrow rising out of it. Rounded corners at
**8px**. Everything supports light and dark.

---

## 1. Voice & tone

The audience is people in recovery from 7-OH and kratom dependence, often
reading mid-withdrawal at 3 a.m. The brand's whole job is to feel calm,
plain, and trustworthy. Carry this into the app's copy:

- **Calm and factual.** No marketing language, no hype, no urgency
  tricks, no judgment.
- **Plain words.** Short sentences. Say the thing directly.
- **Meet people where they are.** No shame, no gatekeeping, no assuming
  someone is ready to quit.
- **No dark patterns.** No ads, no growth-hack nudges, no manipulative
  retention. The site takes no money from anyone it links; keep that
  spirit.

The full house-style ruleset lives in [`CLAUDE.md`](../../CLAUDE.md) at the
repo root if you want the long version.

---

## 2. Logo — the "Lift Cup"

A coffee cup with an arrow rising out of it: the daily ritual plus moving
upward. Ready-made files are in [`docs/brand/logo/`](./logo/):

| File | Use |
|---|---|
| [`logo/lift-cup-themed.svg`](./logo/lift-cup-themed.svg) | Two-tone mark. Colors itself from theme variables when inlined; falls back to brand colors otherwise. |
| [`logo/lift-cup-mono.svg`](./logo/lift-cup-mono.svg) | Single-color mark following `currentColor`. Use on photos, solid fills, anywhere one color is cleaner. |

The mark is a 64×64 viewBox, three stroked paths at `stroke-width="8"`,
`stroke-linecap="round"`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <!-- cup: uses foreground color -->
  <path d="M20 33 V39 a12 12 0 0 0 24 0 V33" stroke-width="8" stroke-linecap="round"/>
  <!-- arrow stem: uses primary color -->
  <path d="M32 37 V14" stroke-width="8" stroke-linecap="round"/>
  <!-- arrowhead: uses primary color -->
  <path d="M23 24 L32 11 L41 24" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### Color mapping

| Part | Token | Stone light | Stone dark |
|---|---|---|---|
| Cup | `foreground` | `#261f17` | `#f6f5f3` |
| Arrow (stem + head) | `primary` | `#604020` | `#d5b890` |

The two-tone version is the default. On a busy or colored background, use
the mono version in a single safe color.

### Wordmark lockup

The full lockup is the mark + the wordmark `quitting7oh.org`:

- Wordmark in **Fraunces, weight 600**, letter-spacing `-0.01em`.
- `quitting` and `oh` use **foreground**; the **`7`** uses **primary**.
- `.org` is smaller (0.45em of the wordmark), in **IBM Plex Sans weight
  500**, colored **muted-foreground**.
- Mark and wordmark sit in a flex row, vertically centered, `gap: 0.5em`.
  The mark height is ~1.7× the wordmark's font size.

### Clear space & sizing

- Keep clear space around the lockup of at least the cup's width.
- Minimum mark size ~20px; below that drop the wordmark and show the mark
  alone (`wordmark={false}` in the component).
- The mark is square — never stretch it. Don't recolor outside the
  token mapping, don't add gradients or shadows, don't rotate it.

### App icon / favicon

Pre-rendered icons exist per theme in
[`public/favicons/<theme>/`](../../public/favicons/) (`favicon.svg`,
`favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`,
`icon-maskable-512.png`, `site.webmanifest`). For the default look use the
[`stone`](../../public/favicons/stone/) set. The open-graph share image is
[`public/og-image.png`](../../public/og-image.png) (1200×630). See
[`THEME-ICONS-README.md`](./THEME-ICONS-README.md) for the full icon
breakdown.

---

## 3. Color

### How the system works

Colors are **semantic tokens**, not raw values. You style with roles
(`background`, `foreground`, `primary`, `muted`, `border`…) and the actual
color is swapped underneath by theme. This is what lets the same UI render
in 8 color variants × light/dark.

In CSS each token is stored as a bare HSL triple and wrapped at use:

```css
:root { --primary: 30 50% 25%; }
.button { background: hsl(var(--primary)); }
```

For a non-CSS app (React Native, Flutter, native), just use the **hex
tables below** — pick one variant (almost certainly `stone`, the site
default) and wire its light/dark sets to your theme.

### Default palette — `stone` (this is the site default)

If you only implement one palette, implement this one.

**Light**

| Token | HSL | Hex | Role |
|---|---|---|---|
| `background` | `35 38% 94%` | `#f6f1ea` | Page background |
| `foreground` | `30 25% 12%` | `#261f17` | Primary text |
| `card` | `35 42% 99%` | `#fefdfb` | Card / raised surface |
| `primary` | `30 50% 25%` | `#604020` | Brand actions, links, the "7" |
| `primary-foreground` | `35 30% 98%` | `#fbfaf8` | Text on primary |
| `secondary` | `35 30% 91%` | `#efe9e1` | Secondary surface |
| `muted` | `35 25% 92%` | `#f0ebe6` | Subtle fill |
| `muted-foreground` | `30 15% 40%` | `#756657` | Secondary / hint text |
| `accent` | `35 40% 88%` | `#ede2d4` | Hover / highlight fill |
| `accent-foreground` | `30 35% 18%` | `#3e2e1e` | Text on accent |
| `destructive` | `0 84% 60%` | `#ef4343` | Errors, destructive actions |
| `border` | `35 25% 84%` | `#e0d8cc` | Borders, dividers |
| `ring` | `30 50% 35%` | `#86592d` | Focus ring |
| `sidebar` | `35 28% 96%` | `#f8f5f2` | Nav surface |

**Dark**

| Token | HSL | Hex | Role |
|---|---|---|---|
| `background` | `30 25% 6%` | `#130f0b` | Page background |
| `foreground` | `35 15% 96%` | `#f6f5f3` | Primary text |
| `card` | `30 25% 9%` | `#1d1711` | Card / raised surface |
| `primary` | `35 45% 70%` | `#d5b890` | Brand actions, links, the "7" |
| `primary-foreground` | `30 35% 12%` | `#291f14` | Text on primary |
| `secondary` | `30 25% 18%` | `#392e22` | Secondary surface |
| `muted` | `30 20% 14%` | `#2b241d` | Subtle fill |
| `muted-foreground` | `30 15% 65%` | `#b3a698` | Secondary / hint text |
| `accent` | `30 25% 20%` | `#403326` | Hover / highlight fill |
| `accent-foreground` | `35 40% 88%` | `#ede2d4` | Text on accent |
| `destructive` | `0 62% 30%` | `#7c1d1d` | Errors, destructive actions |
| `border` | `30 25% 22%` | `#46382a` | Borders, dividers |
| `ring` | `35 45% 58%` | `#c49c64` | Focus ring |
| `sidebar` | `30 25% 8%` | `#1a140f` | Nav surface |

> Note: dark mode is **not** an inversion. Backgrounds are near-black with
> a warm tint, primary lightens to a soft tan so it stays legible on dark.
> Use the dark hex set directly rather than computing it.

### The 8 variants (quick reference)

Users can switch the whole site between these. `stone` is the default. If
your app supports a theme picker, mirror this set; otherwise stone is
enough. Background / foreground / primary shown per mode — full token sets
for every variant are in [`src/styles/global.css`](../../src/styles/global.css).

| Variant | Hue | Light (bg / fg / primary) | Dark (bg / fg / primary) |
|---|---|---|---|
| `stone` *(default)* | warm brown | `#f6f1ea` / `#261f17` / `#604020` | `#130f0b` / `#f6f5f3` / `#d5b890` |
| `accent-teal` | teal | `#eef7f5` / `#0f1a17` / `#1d7260` | `#09110f` / `#f3f6f6` / `#53c6ad` |
| `zinc` | cool gray | `#eeeef1` / `#121216` / `#2a2a32` | `#0c0c0e` / `#f5f5f5` / `#f0f0f0` |
| `slate` | blue-gray | `#eaeff5` / `#121821` / `#1f3451` | `#0a0e15` / `#f3f5f6` / `#94b2db` |
| `neutral` | pure gray | `#f2f2f2` / `#1a1a1a` / `#262626` | `#0d0d0d` / `#f5f5f5` / `#ebebeb` |
| `rose` | pink-red | `#f8edef` / `#30171d` / `#d61f49` | `#150a0c` / `#f7f3f4` / `#e64c70` |
| `blue` | blue | `#edf0f8` / `#151b28` / `#195ae6` | `#0a0d15` / `#f3f4f6` / `#5588f6` |
| `green` | green | `#eef7f1` / `#122117` / `#1d8743` | `#08110c` / `#f3f6f4` / `#2dd269` |

### Legacy accent scale

Older components use a fixed muted-teal hex scale (independent of the theme
variant). New work should prefer the semantic tokens above, but these still
exist:

`50 #effaf7` · `100 #d6f1e7` · `200 #aee2d0` · `300 #7fcdb4` ·
`400 #4eb195` · `500 #2f947a` · `600 #207863` · `700 #1b6052` ·
`800 #184d43` · `900 #143f37` · `950 #0a2520`

---

## 4. Typography

Two families, both free and self-hosted on the site via
[Fontsource](https://fontsource.org/); both are also on Google Fonts.

| Role | Family | Notes |
|---|---|---|
| Body / UI | **IBM Plex Sans** (variable) | All body text, buttons, nav, labels. `@fontsource-variable/ibm-plex-sans` |
| Headings / display | **Fraunces** (variable) | Page titles and content headings (h1–h4), and the logo wordmark. `@fontsource-variable/fraunces` |
| Mono | system mono stack | Code only: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` |

Font stacks as defined:

```
--font-sans:    'IBM Plex Sans Variable', ui-sans-serif, system-ui, -apple-system,
                'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-display: 'Fraunces Variable', Georgia, 'Times New Roman', serif;
--font-mono:    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
                'Liberation Mono', 'Courier New', monospace;
```

### Rules that matter

- **Headings are Fraunces at weight 600**, never 700 (it gets blobby at
  display sizes). Letter-spacing `tracking-tight` (~`-0.01em`) on large
  titles. This serif/sans split — serif headings over sans body — is the
  single most recognizable type signature of the brand.
- **Body is IBM Plex Sans**, normal weight, **line-height 1.7** for
  running prose (looser than typical UI; it's a reading site).
- Body copy column maxes at **52rem (832px)** for readability — don't run
  prose full-bleed on wide screens.

### Type scale (as used on the site)

| Element | Size | Weight | Family |
|---|---|---|---|
| Page title (h1) | `text-3xl` → `text-4xl` (1.875 → 2.25rem) | 600 | Fraunces |
| Section (h2) | `text-2xl` → `text-3xl` (1.5 → 1.875rem) | 600 | Fraunces |
| Subsection (h3) | `text-xl` (1.25rem) | 600 | Fraunces |
| Body | 1rem | 400 | IBM Plex Sans |
| Small / hint | `text-sm` (0.875rem) | 400 | IBM Plex Sans, muted-foreground |

---

## 5. Shape, spacing, focus

- **Border radius:** base `--radius: 0.5rem` (8px). Derived steps:
  `lg = 8px`, `md = 6px`, `sm = 4px`. Cards, inputs, and buttons use the
  8px radius.
- **Focus ring:** 2px outline in the `ring` token color, 2px offset.
  Always keep a visible focus state — accessibility matters for this
  audience.
- **Surfaces:** page sits on `background`; cards and raised elements use
  `card` (slightly lighter in light mode, slightly lighter than bg in
  dark). Separate with `border`, not heavy shadows. The site uses shadows
  sparingly.

---

## 6. Components

### Buttons

- **Primary:** `background: primary`, `text: primary-foreground`, 8px
  radius. This is the main call-to-action color.
- **Secondary / ghost:** transparent or `secondary` fill, `foreground`
  text, `border` outline for the bordered variant.
- **Destructive:** `destructive` background for irreversible actions.

### Callouts

The site uses three callout styles, each a card with a **4px left border**
and a tinted background + matching icon. These colors are fixed (Tailwind
palette), independent of the theme variant:

| Type | Meaning | Border | Bg (light) | Icon | Default title |
|---|---|---|---|---|---|
| `info` | Neutral note | sky `#0ea5e9` | sky-50 `#f0f9ff` | sky-600 `#0284c7` | "Note" |
| `warning` | Caution | amber `#f59e0b` | amber-50 `#fffbeb` | amber-600 `#d97706` | "Warning" |
| `medical` | Not medical advice / safety | rose `#f43f5e` | rose-50 `#fff1f2` | rose-600 `#e11d48` | "Not medical advice" |

In dark mode the backgrounds become the same hue at ~950/40% opacity, with
lighter borders (400) and icons (300). Icons are from
[Lucide](https://lucide.dev/) (`Info`, `AlertTriangle`, `Stethoscope`) —
Lucide is the icon set the whole site uses; match it in the app.

### Cards

`card` background, `border` outline, 8px radius, comfortable padding. Title
in Fraunces if it's a content heading, otherwise IBM Plex Sans semibold.

---

## 7. Theme mechanics (only if you want full parity)

The web app applies theme via attributes on the root `<html>` and stores
choices in `localStorage`:

| Concern | Mechanism | Values | Default |
|---|---|---|---|
| Light/dark | `.dark` class on `<html>` | present = dark | follows OS (`system`) |
| Color variant | `data-theme="<variant>"` on `<html>` | the 8 names | `stone` (attribute omitted) |
| Mode storage | `localStorage["theme"]` | `system` \| `light` \| `dark` | `system` |
| Variant storage | `localStorage["theme-variant"]` | the 8 names | `stone` |

Two details worth copying:

- **Stone is the "no attribute" state.** When the variant is stone, the
  code *removes* `data-theme` rather than setting `data-theme="stone"`; the
  bare `:root` rule is stone. Same for mode: `system` removes the key.
- **Apply before first paint** to avoid a flash. The site runs a tiny
  inline script in `<head>` that reads localStorage + `prefers-color-scheme`
  and sets the class/attribute synchronously before the page renders. Do
  the equivalent in the app's startup.

A native app doesn't need the attribute plumbing — just map "light/dark"
and (optionally) "variant" to the hex tables in section 3.

---

## 8. Asset index

| What | Where |
|---|---|
| Logo, themed two-tone | [`docs/brand/logo/lift-cup-themed.svg`](./logo/lift-cup-themed.svg) |
| Logo, mono | [`docs/brand/logo/lift-cup-mono.svg`](./logo/lift-cup-mono.svg) |
| Icons / favicons (per theme) | [`public/favicons/<theme>/`](../../public/favicons/) |
| OG share image | [`public/og-image.png`](../../public/og-image.png) |
| Color tokens (source of truth) | [`src/styles/global.css`](../../src/styles/global.css) |
| Logo component | [`src/components/Logo.astro`](../../src/components/Logo.astro) |
| Theme coverage preview | [`docs/brand/theme-coverage.html`](./theme-coverage.html) |
| Icon details | [`docs/brand/THEME-ICONS-README.md`](./THEME-ICONS-README.md) |
| Voice / house style | [`CLAUDE.md`](../../CLAUDE.md) |

---

## Quick start: the minimum to look on-brand

1. Fonts: **Fraunces** for headings/titles (weight 600), **IBM Plex Sans**
   for everything else.
2. Colors: use the **stone light + dark** hex tables (section 3). Page =
   `background`, text = `foreground`, buttons/links/accents = `primary`.
3. Logo: drop in [`lift-cup-themed.svg`](./logo/lift-cup-themed.svg);
   color the cup with your foreground and the arrow with your primary.
4. Corners: **8px**. Borders over shadows. Keep a visible focus ring.
5. Tone: calm, plain, no marketing. When unsure, do less.
