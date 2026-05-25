# `src/content/`, site content

Every file in this tree becomes a page on quitting7oh.org. The folder is the
category. The filename (without the `.md` extension) is the URL slug.

```
src/content/start-here/welcome.md   →   quitting7oh.org/start-here/welcome
src/content/resources/telehealth.md  →   quitting7oh.org/resources/telehealth
```

## Adding a new page in 5 steps

1. Decide which category the page belongs in. The categories are the folder
   names you see in this directory. Don't invent a new one, if a page
   doesn't fit, ask in the Discord.
2. Create a new `.md` file in that category folder. Use a short, descriptive
   slug as the filename, lowercase, hyphen-separated: e.g.
   `withdrawal-day-1.md`, not `Withdrawal Day 1.md`.
3. Paste this front matter at the top of the file and fill it in:

       ---
       title: "Your page title"
       description: "One sentence summary, around 120-160 characters."
       category: "category-slug" # must match the folder name
       last_updated: "2026-05-23" # ISO date (YYYY-MM-DD)
       ---

4. Write the page body in standard markdown below the front matter. Headings
   start at `##` (the `title:` field becomes the `<h1>`, so don't add one
   yourself).
5. Commit the file. The site rebuilds automatically when changes land on
   `main`.

## Front matter reference

| Field | Required | Description |
| ---------------- | -------- | ------------------------------------------------------------- |
| `title` | yes | Page title. Becomes `<h1>` and the `<title>` tag. |
| `description` | no | Short summary. Used for meta tags and the category listing. |
| `category` | yes | Must match the folder name (a known category slug). |
| `last_updated` | no | ISO date. Shown at the bottom of the page. |
| `sort` | no | Sort order within a category. Lower numbers float to the top. |
| `draft` | no | If `true`, the page is excluded from the build. |
| `wide` | no | If `true`, the page renders without the left category sidebar or right TOC, the main column gets the full container width. Use for reference docs (charts, tables, diagrams) that need horizontal space. |

## Markdown features available

- Standard CommonMark + GitHub-flavored markdown (tables, task lists,
  fenced code blocks, footnotes, strikethrough).
- Internal links to other pages: `[link text](/category/slug)`.
- External links automatically open in a new tab with an indicator icon.
- Headings get auto-generated anchor links (hover a heading to see the `#`).
- Blockquotes (`> ...`) render as info callouts by default. For warning or
  medical-advice callouts, use the MDX components in an `.mdx` file:

       ---
       title: "Page Title"
       category: "start-here"
       ---
       import Callout from '~/components/Callout.astro';

       <Callout type="warning" title="Be careful here">
       Body text.
       </Callout>

       <Callout type="medical">
       Not medical advice.
       </Callout>

  (Files with MDX components must have the `.mdx` extension, not `.md`.)

## Don't

- Don't put an `<h1>` in the body, the front-matter `title:` handles that.
- Don't use HTML directly in `.md` files unless you need to.
- Don't add affiliate links or external sponsorship of any kind.
