# quitting7oh.org — brand context for AI agents

Paste this into your own project — as `AGENTS.md`, `CLAUDE.md`, a
`.cursorrules`, or whatever your agent reads — when you want an AI coding
agent to build something (an app, a companion tool, a microsite) that
matches the look and feel of quitting7oh.org.

It's also published, copy-pasteable, at <https://quitting7oh.org/brand>.

---

You are building software that must match the visual identity of
**quitting7oh.org**, a calm, harm-reduction recovery reference. Follow
this brand.

## Authoritative sources — read these first

Pull exact values from these rather than guessing:

- Rendered brand guide: https://quitting7oh.org/brand
- Written brand guide (Markdown): https://github.com/quitting7oh/quitting7oh.org/blob/main/docs/brand/style-guide.md
- Color tokens (source of truth): https://github.com/quitting7oh/quitting7oh.org/blob/main/src/styles/global.css
- Logo component: https://github.com/quitting7oh/quitting7oh.org/blob/main/src/components/Logo.astro
- Logo SVGs: https://github.com/quitting7oh/quitting7oh.org/tree/main/docs/brand/logo
- Favicons & app icons: https://github.com/quitting7oh/quitting7oh.org/tree/main/public/favicons

**If you can fetch URLs**, read the brand guide and `global.css` for the
exact tokens before you write any UI.

**If your tools can't fetch the web, don't guess — get the values another
way:**

- Use a headless browser to load the rendered guide and read it:

  ```sh
  npm i -D playwright && npx playwright install chromium
  ```

  Then script Playwright to open `https://quitting7oh.org/brand`, read
  computed styles (background, color, font-family on sample elements),
  screenshot the palette, and extract the colors and fonts.

- Or clone the repo and read the files directly:

  ```sh
  git clone https://github.com/quitting7oh/quitting7oh.org
  # read docs/brand/style-guide.md and src/styles/global.css
  ```

## Non-negotiables (apply even before you fetch anything)

- **Type:** titles and major sections use **Newsreader**; body text,
  controls, and subsections use **Atkinson Hyperlegible Next**. Both are
  self-hosted variable fonts. The role split must stay visible.
- **Palette:** warm paper and brown-charcoal ink with laurel green for
  links and ordinary actions. Light: background `hsl(43 38% 97%)`, text
  `hsl(22 16% 14%)`, primary `hsl(145 29% 32%)`. Dark: background
  `hsl(22 14% 8%)`, text `hsl(42 28% 92%)`, primary
  `hsl(143 35% 69%)`. Use the dark values directly.
- **Style by role, not raw hex:** background, foreground, card, primary,
  secondary, muted, accent, border, destructive — each with a light and a
  dark value. Support both modes.
- **Logo is the "Lift Cup":** a coffee cup with an up-arrow rising out of
  it. The cup is stroked in the foreground color, the arrow in primary.
  Don't recolor outside that mapping, don't stretch or rotate it, don't
  add gradients or shadows. SVGs and favicons are in the repo.
- **Shape:** small radii, fine borders, and little or no shadow. Always
  keep a visible focus ring.
- **Voice:** calm, plain, factual. No marketing language, no hype, no
  urgency tricks, no dark patterns. The audience is people in recovery,
  often reading mid-withdrawal. When unsure, do less.

## How to work

- Prefer exact token values from `global.css` over approximations.
- Match the component feel from the rendered guide: buttons, cards,
  callouts, inputs, focus rings.
- When you make a brand decision, note which source you based it on.
