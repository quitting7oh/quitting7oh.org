# `/imports/` — Discord export drop folder

This folder is where Discord channel exports go *before* they get processed
into site content. The processing step is one command (`npm run ingest`) and
the output appears in `src/content/<category>/<channel>.md`.

If you are not a developer, you only need to know the workflow below.

## Adding a new page from a Discord export

1. In Discord, copy the channel content (or export it via your usual tool —
   our exports are plain markdown, with `### Username — Date, Time` headers
   for each message).
2. Save it as a markdown file in this folder. Use a sensible filename like
   `quickmd-info.md` — the filename itself isn't important but it helps to
   match the channel name.
3. The file should start with the channel header on the **first non-blank
   line**, like this:

       # #quickmd-info

   That tells the importer which channel the content is from.

4. Open `../scripts/channel-mapping.json` and add an entry for that channel
   if it isn't already there. The category must be one of:
   `start-here`, `active-withdrawal`, `compounds`, `mat-suboxone`,
   `other-tools`, `post-acute`, `resources`.

5. From the project root, run:

       npm run ingest

   This processes every file in `imports/` and writes the cleaned-up content
   to the right folder under `src/content/`.

   If you want to see what *would* happen without writing anything, run
   `npm run ingest:dry` first.

6. Open the resulting file at `src/content/<category>/<channel>.md` and
   double-check the front matter (title, description, last_updated) makes
   sense. Edit by hand if needed.

7. Commit both the new content file AND the updated channel mapping.

## Multi-channel exports

A single file can contain multiple channels. Just add another
`# #channel-name` header (preceded by a `---` separator) and the importer
will split it into multiple output files.

## Re-importing

The importer is **idempotent**: re-running it on the same input produces
the same output, and only rewrites a file if its content actually changed.
You can safely run it as many times as you want.

### Protecting editorially-edited pages

Some pages get restructured by hand after import — a quick-reference table
added at the top, sections reordered, paragraphs combined. To protect that
work from being clobbered by a future re-ingest, add `manual: true` to the
page's front matter:

```yaml
---
title: "..."
category: "..."
manual: true   # ← ingest will not overwrite this file
---
```

The ingest will log a `skipped` line for any file with this flag set. To
re-pull from the import, set the flag back to `false` (or remove the line)
and re-run.

## Test fixtures

Files in this folder whose names start with `_` (e.g. `_test-edge-cases.md`)
are skipped by default. They're for testing the importer without polluting
the real content tree.
