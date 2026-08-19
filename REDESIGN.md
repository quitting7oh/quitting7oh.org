# Field Guide redesign

This branch rebuilds the user interface for readers who may have shaky hands,
little sleep, and a small phone. It keeps urgent help close and long articles
easy to scan.

## Design intent

Fine rules, numbered section markers, paper-like surfaces, and an editorial
serif separate navigation from article text. Large tap targets and direct
labels shorten the path to withdrawal help and meetings.

The homepage starts with withdrawal help and a comparison of quitting options.
Search and the next meeting appear in the opening view. A compact topic index
replaces the old card grid. It uses category names and page counts without
repeating each category description.

## Type

- **Atkinson Hyperlegible Next Variable** handles body text, controls, tables,
  and labels. Its open letterforms keep doses and medication names legible at
  small sizes.
- **Newsreader Variable** handles titles and section headings. Its moderate
  contrast adds warmth without turning the site into a magazine layout.
- The reading column tops out at 48rem. Body copy is 17px on larger screens
  and 16px on phones, with a 1.72 line height. Dose and schedule data use
  tabular numerals.
- Content-page titles run from 2.1rem to 2.5rem. Article section headings stay
  near 1.55rem. The larger display scale is reserved for the homepage.
- Lists use familiar disc and decimal markers with restrained mulberry color.
  The first pass's ring bullets and zero-padded counters were removed because
  they drew attention away from the text.

Both font families ship with the site. Pages do not contact a font service.

## Color

The palette avoids blue. Light mode uses warm paper and brown-charcoal ink;
dark mode uses warm graphite and parchment text. Both modes have their own
surface and contrast values.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Page | `hsl(43 38% 97%)` | `hsl(22 14% 8%)` | Reading background |
| Ink | `hsl(22 16% 14%)` | `hsl(42 28% 92%)` | Body and headings |
| Mulberry | `hsl(345 38% 35%)` | `hsl(348 52% 72%)` | Links, navigation, ordinary action |
| Amber | `hsl(35 88% 46%)` | `hsl(38 90% 58%)` | Crisis and time-sensitive status |
| Sage | `hsl(132 28% 34%)` | `hsl(132 36% 58%)` | Live meetings and available support |

Mulberry carries navigation and ordinary actions. Amber identifies urgency in
the banner, floating crisis control, and high-risk callouts.

## Space and layout

Spacing follows a four-pixel base with larger editorial jumps between reading
sections. Controls have a minimum height of 44px. Cards use a small radius and
a one-pixel rule instead of deep shadows.

Page headers use short vertical padding and share the reading column's measure.
The footer uses a tonal paper surface in both themes instead of reversing to a
high-contrast block.

On phones, the page has one reading column, an expandable contents list, and a
full-height guide drawer. Wide screens gain a 17rem guide index and a 15rem
contents rail around the reading column. The contents rail caps its height to
the viewport, hides its scrollbar, and follows the active heading inside its
own scroll area.

Wide data tables stay tables. Their containing card scrolls on the horizontal
axis, keeps the day column visible, and uses tabular numerals. Calculators use
the same field, summary, chart, and schedule treatments as the meeting tools.

## Components

The implementation uses Astro for the static shell and React only where browser
state is necessary. Custom components use Radix primitives for focus handling,
dialogs, menus, select controls, and sheets. The project no longer relies on
the generated shadcn visual layer. This keeps the proven keyboard behavior and
lets the Field Guide tokens control every rendered surface.

Lucide supplies the icon set. Icons use a 1.5px to 2px stroke and sit next to a
text label when the action might be ambiguous. Crisis actions keep a text label.

## Motion

Color and border changes use short transitions. The meeting status dot, drawer,
dialogs, and disclosure chevrons carry the only noticeable motion. The
`prefers-reduced-motion` rule removes animation and smooth scrolling across the
site.

## Preserved behavior

- All content collection routes and slugs remain intact. The project still
  emits static HTML through `output: 'static'`.
- Pagefind indexes the built pages and powers the keyboard search dialog.
- The pre-paint theme script supports system, light, and dark modes.
- Meeting widgets and schedule tables still read `src/data/meetings.ts`.
- Taper and SOWS components keep their existing dose and scoring math.
- The scheduling banner keeps its dismissal key behavior.
- Crisis help, breadcrumbs, category pagination, timestamps, changelog sync,
  the mobile drawer, and active contents tracking remain in place.

No feature was deferred.

## Toolchain

The redesign removes the npm 10 lockfile constraint. The package now declares
Node 22.22.2 or newer, npm 12.0.2 or newer, and `npm@12.0.2` as the package
manager. Local verification used Node 26.7.0 and npm 12.0.2.

| Package | Main branch | Redesign |
| --- | --- | --- |
| Astro | 5.18.1 | 7.2.3 |
| Vite | Transitive | 8.2.1 direct |
| React | 19.2.6 | 19.2.8 |
| Tailwind CSS | 4.3.0 | 4.3.3 |
| Pagefind | 1.1.1 | 1.5.2 |
| TypeScript | 5.5.0 | 7.0.2 |

Astro 7 uses the supported `@astrojs/markdown-remark` processor so the existing
external-link and heading plugins run without deprecated configuration.
The static build inlines its compact compiled stylesheet, which removes a
render-blocking request on first load. Font faces include the Latin variable
subsets used by the interface.

## Verification set

The committed files under `docs/redesign-shots/` cover the homepage, a long
content page, and meeting schedules at mobile and desktop sizes in both color
modes. The browse-through also covers a compound page, the changelog, a taper
calculator, search navigation, appearance switching, the guide drawer, and
390px horizontal overflow.

The final mobile Lighthouse run on `/other-tools/helper-meds` scored 95 for
performance and 100 for accessibility. It recorded a 2.3 second Largest
Contentful Paint, 0ms Total Blocking Time, and no horizontal overflow.
