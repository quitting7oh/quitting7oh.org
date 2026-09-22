# README artwork

The root README uses these local assets for its banner, navigation cards,
and site previews. Keep the `-light` and `-dark` filename pairs together.

| Asset | Source and size |
| --- | --- |
| `readme-banner-{light,dark}.svg` | Editable SVG, 1200 × 350. Uses the site's Lift Cup mark and Field Guide palette. |
| `nav-{read,start,code,agents}-{light,dark}.svg` | Editable SVG, 560 × 132. The README supplies each card's link and alt text. |
| `badge-minisearch-{light,dark}.svg` | Editable SVG, 142 × 28. A search icon, 32-pixel icon panel, and text padding matched to the stack badges. |
| `site-desktop-{light,dark}.jpg` | Local production preview at a 1280 × 720 viewport, captured September 21, 2026. |
| `site-mobile-{light,dark}.jpg` | Local production preview at a 390 × 844 viewport, captured September 21, 2026. |

To refresh the screenshots, build the site and open its production preview
on port 4321. Capture the homepage in both themes at each listed size, with
menus closed and the page at the top. Use the appearance menu at desktop
width to select each theme before capturing the phone viewport. Keep the
two images for each size at the same scroll position.

The README displays light and dark screenshots side by side. Its decorative
SVGs select a matching palette through `<picture>`. Preserve descriptive alt
text and a light fallback image when editing those blocks. Update both SVG
versions when changing their text or layout.

Workflow badges read status from GitHub Actions; activity badges read from
the repository. Stack badges identify tools. Screenshots are snapshots, so
their meeting times, dates, and online counts will age. Recapture them after
visible site changes and update the capture date here.
