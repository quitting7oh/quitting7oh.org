#!/usr/bin/env node
/**
 * Discord channel export → Astro content collection markdown.
 *
 * Usage:
 *   node scripts/ingest-discord.mjs                       Default: read from /imports/, write to src/content/
 *   node scripts/ingest-discord.mjs --in <dir>            Custom input dir
 *   node scripts/ingest-discord.mjs --out <dir>           Custom output dir (content collection root)
 *   node scripts/ingest-discord.mjs --file <path>         Process a single file
 *   node scripts/ingest-discord.mjs --dry-run             Print planned output without writing
 *   node scripts/ingest-discord.mjs --verbose             Verbose logging
 *
 * What this script does:
 *   1. Reads markdown export files from the input directory (default `/imports/`).
 *      Each file represents one or more Discord channels concatenated. Multi-channel
 *      exports are detected via `# #channel-name` headers separated by `---`.
 *   2. For each channel block: strips per-message metadata (`### Author — Date, Time`,
 *      `*(edited)*`, "*N pinned message(s).*"), normalizes Discord-specific syntax
 *      (channel cross-references, emoji shortcodes, @mentions), and concatenates the
 *      message bodies in reverse-chronological order — Discord's export order is
 *      newest-first, so we reverse to get oldest-first reading order.
 *   3. Derives front matter from a channel-mapping config and the most recent message
 *      timestamp, and writes a clean markdown file to
 *      `src/content/{category}/{slug}.md`.
 *   4. Is idempotent: re-running overwrites previous outputs in place. Use
 *      `--dry-run` to see what would change.
 *
 * Unmapped channels are written to `src/content/uncategorized/` with a warning.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ---------------- CLI ----------------
const args = process.argv.slice(2);
function flag(name) {
  return args.includes(`--${name}`);
}
function value(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
}

const INPUT_DIR = path.resolve(PROJECT_ROOT, value('in', 'imports'));
const OUTPUT_DIR = path.resolve(PROJECT_ROOT, value('out', 'src/content'));
const SINGLE_FILE = value('file', null);
const DRY_RUN = flag('dry-run');
const VERBOSE = flag('verbose');

// ---------------- Helpers ----------------
const log = (...m) => console.log(...m);
const warn = (...m) => console.warn('⚠ ', ...m);
const vlog = (...m) => VERBOSE && console.log('·', ...m);

async function loadMapping() {
  const p = path.join(__dirname, 'channel-mapping.json');
  const raw = await fs.readFile(p, 'utf8');
  return JSON.parse(raw);
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Split an export file into channel blocks.
 * A channel block starts at `# #channel-name` on its own line.
 * Sections may optionally be separated by a `---` rule.
 */
function splitChannels(content) {
  const lines = content.split('\n');
  const blocks = [];
  let current = null;

  // Allow optional leading "#" then "#" (e.g. `# #channel-name`).
  const headerRe = /^#\s+#([a-z0-9][a-z0-9-_]*)\s*$/i;

  for (const raw of lines) {
    const m = headerRe.exec(raw);
    if (m) {
      if (current) blocks.push(current);
      current = { channel: m[1].toLowerCase(), lines: [] };
      continue;
    }
    if (current) {
      // A bare "---" separator between channels just becomes blank content.
      if (raw.trim() === '---' && current.lines.length === 0) continue;
      current.lines.push(raw);
    } else {
      // Content before any channel header is dropped (e.g. export preamble).
      // If you need that text, add a default header to the file.
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

// `### Author — Apr 29, 2026, 6:52 PM`  (em dash or hyphen; Discord uses both)
// Some exports append ` *(edited)*` to the header line itself; allow that.
const MESSAGE_HEADER_RE =
  /^###\s+([^\n—–-]+?)\s*[—–-]\s*([A-Z][a-z]{2,9}\s+\d{1,2},\s+\d{4}(?:,\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)(?:\s+\*\(edited\)\*)?\s*$/;
const EDITED_MARKER_RE = /\s*\*\(edited\)\*\s*/g;
const PINNED_NOTE_RE = /^\*\d+\s+pinned messages?\.\*\s*$/i;

const MONTHS = {
  Jan: 0, January: 0, Feb: 1, February: 1, Mar: 2, March: 2, Apr: 3, April: 3,
  May: 4, Jun: 5, June: 5, Jul: 6, July: 6, Aug: 7, August: 7,
  Sep: 8, Sept: 8, September: 8, Oct: 9, October: 9, Nov: 10, November: 10,
  Dec: 11, December: 11,
};

function parseDiscordDate(s) {
  // "Apr 29, 2026, 6:52 PM"  or  "Apr 29, 2026"
  const m = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})(?:,\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/.exec(s);
  if (!m) return null;
  const month = MONTHS[m[1]];
  if (month == null) return null;
  const day = Number(m[2]);
  const year = Number(m[3]);
  let hour = m[4] ? Number(m[4]) : 0;
  const minute = m[5] ? Number(m[5]) : 0;
  if (m[6] === 'PM' && hour < 12) hour += 12;
  if (m[6] === 'AM' && hour === 12) hour = 0;
  return new Date(Date.UTC(year, month, day, hour, minute));
}

/**
 * Walk a channel block's lines and return an array of {date, body} messages.
 * Lines that aren't inside any message (e.g. floating pinned-count notes) are dropped.
 */
function parseMessages(lines) {
  const messages = [];
  let current = null;
  let inFence = false;
  let fenceChar = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code fences so we don't mis-parse `### foo` inside a code block.
    const fenceMatch = /^(\s*)(```|~~~)/.exec(line);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceMatch[2];
      } else if (line.includes(fenceChar)) {
        inFence = false;
      }
    }

    if (!inFence && PINNED_NOTE_RE.test(line.trim())) {
      vlog('dropped pinned-note line');
      continue;
    }

    const headerMatch = !inFence ? MESSAGE_HEADER_RE.exec(line) : null;
    if (headerMatch) {
      if (current) messages.push(current);
      current = {
        author: headerMatch[1].trim(),
        date: parseDiscordDate(headerMatch[2].trim()),
        body: [],
      };
      continue;
    }

    if (current) current.body.push(line);
  }
  if (current) messages.push(current);
  return messages;
}

function stripEditedMarkers(body) {
  return body.replace(EDITED_MARKER_RE, '');
}

// Discord renders lines that start with `-# ` as small "subtext". On the
// static site those lines are typically channel-meta ("see #foo for
// discussion") rather than content, and they don't render correctly in
// CommonMark — drop them.
function stripDiscordSubtext(line) {
  return /^\s*-#\s/.test(line) ? null : line;
}

// Discord exports may include per-message reaction summaries (`*Reactions:* 👍 3`).
// These are noise on a static site — drop them.
function stripReactionLine(line) {
  return /^\s*\*?Reactions:\*?\s/i.test(line) ? null : line;
}

/**
 * Normalize a channel slug for fuzzy lookup. Discord channel names vary in
 * how they're written: `mgm-15` vs `mgm15`, `7-oh` vs `7oh`. Strip all
 * non-alphanumeric chars and lowercase to compare them as one identity.
 */
function normChannel(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function replaceEmoji(body, emojiMap) {
  return body.replace(/:([a-z0-9_+-]+):/gi, (full, name) => {
    const key = `:${name}:`;
    return emojiMap[key] ?? full;
  });
}

function anonymizeMentions(body) {
  // Remove Discord <@123> mentions and bare @usernames.
  return body
    .replace(/<@!?\d+>/g, '')
    .replace(/(^|[^a-zA-Z0-9_])@([a-zA-Z0-9_.-]{2,})/g, (_m, pre) => `${pre}@someone`);
}

/**
 * Convert `**#channel-name**` and bare `#channel-name` references to internal links.
 *
 * Linking rule: a reference is linked only when a page for that channel WILL
 * exist on the site after this ingest run (i.e., the channel appears in
 * `knownChannels`). References to Discord discussion channels that don't have
 * a corresponding site page (`#sos`, `#daily-check-in`, etc.) are left as-is.
 *
 * Lookup is fuzzy: `#mgm-15` matches `mgm15`, `#7oh` matches `7-oh`, etc.
 *
 * @param {string} body
 * @param {Map<string, {slug: string, category: string}>} knownChannels
 *        Map keyed by `normChannel(slug)` → resolved {slug, category}.
 */
function convertChannelRefs(body, knownChannels) {
  const resolve = (name) => knownChannels.get(normChannel(name));
  // Bold form first: **#name**
  body = body.replace(/\*\*#([a-z0-9][a-z0-9-_]+)\*\*/gi, (_m, name) => {
    const target = resolve(name);
    if (!target) return `**#${name}**`;
    return `[#${name}](/${target.category}/${target.slug})`;
  });
  // Bare form: #name (not at start of line — those are headings).
  // Note: exclude `[` from preceding char so we don't re-match the `#name`
  // that lives inside a markdown link we just produced above.
  body = body.replace(/(^|[^\w!`#\[])#([a-z0-9][a-z0-9-_]+)\b/gi, (m, pre, name) => {
    if (pre === '') return m; // Start-of-line: that's a heading, leave it.
    const target = resolve(name);
    if (!target) return m;
    return `${pre}[#${name}](/${target.category}/${target.slug})`;
  });
  return body;
}

/**
 * Process body line-by-line so we can skip lines inside fenced code blocks.
 *
 * @param {string} body
 * @param {object} mapping     - The full channel-mapping.json contents.
 * @param {Map}    knownChannels - Map from normChannel(slug) -> {slug,category}.
 */
function transformBody(body, mapping, knownChannels) {
  const lines = body.split('\n');
  const out = [];
  let inFence = false;
  let fenceChar = '';
  for (const line of lines) {
    const fenceMatch = /^(\s*)(```|~~~)/.exec(line);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceMatch[2];
      } else if (line.includes(fenceChar)) {
        inFence = false;
      }
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    if (stripDiscordSubtext(line) === null) continue;
    if (stripReactionLine(line) === null) continue;
    let t = line;
    t = stripEditedMarkers(t);
    t = replaceEmoji(t, mapping.emojiMap || {});
    t = anonymizeMentions(t);
    t = convertChannelRefs(t, knownChannels);
    out.push(t);
  }
  return out.join('\n');
}

function trimBlankLines(s) {
  return s.replace(/^\s*\n+/, '').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
}

function stripCodeFences(body) {
  // Remove fenced code blocks entirely so subsequent regex scans don't
  // accidentally match `# ...` lines inside code (Python comments, etc).
  const lines = body.split('\n');
  const out = [];
  let inFence = false;
  let fenceChar = '';
  for (const line of lines) {
    const fenceMatch = /^(\s*)(```|~~~)/.exec(line);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceMatch[2];
        continue;
      }
      if (line.includes(fenceChar)) {
        inFence = false;
        continue;
      }
    }
    if (!inFence) out.push(line);
  }
  return out.join('\n');
}

function deriveTitle(body, channel, mapping) {
  const override = mapping.channels[channel]?.title_override;
  if (override) return override;
  // First H1 outside any code fence wins.
  const h1 = /^#\s+(.+?)\s*$/m.exec(stripCodeFences(body));
  if (h1) return h1[1].trim();
  // Else: titleized channel name.
  return channel
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function deriveDescription(body) {
  // Strip code fences and the first H1 (we use it for title); then find the
  // first paragraph.
  const noFences = stripCodeFences(body);
  const noH1 = noFences.replace(/^#\s+.+?$/m, '').trim();
  const noBlockquote = noH1.replace(/^>.*$/gm, '').trim();
  const para = noBlockquote.split(/\n\s*\n/)[0] || '';
  const oneLine = para.replace(/\s+/g, ' ').trim();
  // Strip basic markdown markers for the description.
  const plain = oneLine
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '');
  if (plain.length <= 160) return plain;
  const cut = plain.slice(0, 160);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

function stripLeadingH1(body) {
  // The H1 is hoisted into the front-matter title. Remove the first H1 so the
  // page doesn't render two of them.
  return body.replace(/^#\s+.+?\n+/, '');
}

function buildFrontMatter(fm) {
  const out = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    if (v == null) continue;
    if (typeof v === 'string') {
      const escaped = v.replace(/"/g, '\\"');
      out.push(`${k}: "${escaped}"`);
    } else {
      out.push(`${k}: ${v}`);
    }
  }
  out.push('---', '');
  return out.join('\n');
}

async function processFile(filePath, mapping, knownChannels) {
  vlog('reading', filePath);
  const raw = await fs.readFile(filePath, 'utf8');
  const channels = splitChannels(raw);
  if (channels.length === 0) {
    warn(`no channels detected in ${filePath} — expecting a "# #channel-name" header`);
    return [];
  }

  const results = [];
  for (const block of channels) {
    const messages = parseMessages(block.lines);
    if (messages.length === 0) {
      warn(`channel #${block.channel} contained no parseable messages`);
      continue;
    }

    // Sort by timestamp (oldest → newest) so the document reads chronologically.
    // Different export tools produce different orderings; sorting handles both.
    // Messages without parseable dates keep their original relative order.
    const ordered = messages
      .map((m, i) => ({ ...m, _i: i }))
      .sort((a, b) => {
        const ta = a.date?.getTime();
        const tb = b.date?.getTime();
        if (ta == null && tb == null) return a._i - b._i;
        if (ta == null) return -1;
        if (tb == null) return 1;
        return ta - tb;
      });
    const joined = ordered.map((m) => m.body.join('\n').trim()).join('\n\n');

    const transformed = transformBody(joined, mapping, knownChannels);
    const cleanedBody = trimBlankLines(stripLeadingH1(transformed));

    // Derive title and description from the *transformed* body so we don't
    // leak Discord-specific syntax like `*(edited)*` into the front matter.
    const title = deriveTitle(transformed, block.channel, mapping);
    const description = deriveDescription(transformed);
    const mostRecent = messages
      .map((m) => m.date)
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const target = mapping.channels[block.channel];
    const category = target?.category;
    const slug = slugify(block.channel);

    const outCategory = category || 'uncategorized';
    if (!category) {
      warn(
        `channel #${block.channel} is not in scripts/channel-mapping.json — writing to src/content/uncategorized/ for review`,
      );
    }

    const fm = {
      title,
      description,
      category: outCategory,
      last_updated: mostRecent ? mostRecent.toISOString().slice(0, 10) : undefined,
      source_channel: `#${block.channel}`,
    };

    const fileContent = buildFrontMatter(fm) + cleanedBody;
    const outDir = path.join(OUTPUT_DIR, outCategory);
    const outPath = path.join(outDir, `${slug}.md`);
    results.push({ channel: block.channel, outPath, fileContent });
  }
  return results;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExistsAndIsSame(p, content) {
  try {
    const existing = await fs.readFile(p, 'utf8');
    return existing === content;
  } catch {
    return false;
  }
}

async function main() {
  const mapping = await loadMapping();

  let inputFiles = [];
  if (SINGLE_FILE) {
    inputFiles = [path.resolve(PROJECT_ROOT, SINGLE_FILE)];
  } else {
    try {
      const dirents = await fs.readdir(INPUT_DIR, { withFileTypes: true });
      inputFiles = dirents
        .filter(
          (e) =>
            e.isFile() &&
            /\.(md|txt)$/i.test(e.name) &&
            // Files prefixed with `_` are treated as fixtures/drafts — skip
            // them unless an explicit `--file` was passed.
            !e.name.startsWith('_') &&
            // README and similar docs files in the imports folder aren't
            // exports — skip them. `index.md` is a manifest produced by the
            // Discord exporter listing the channels in a multi-file dump.
            !/^readme\.md$/i.test(e.name) &&
            !/^index\.md$/i.test(e.name),
        )
        .map((e) => path.join(INPUT_DIR, e.name));
    } catch (e) {
      if (e.code === 'ENOENT') {
        warn(`input directory does not exist: ${INPUT_DIR}`);
        return;
      }
      throw e;
    }
  }

  if (inputFiles.length === 0) {
    log(`No input files found in ${INPUT_DIR}. Drop a Discord export there and re-run.`);
    return;
  }

  // ---- Discovery pass ----
  // Walk every input file to find which channel slugs will produce site pages
  // after this run. Also walk existing pages in OUTPUT_DIR so that re-running
  // on a subset of imports still produces working cross-links to pages that
  // already exist on disk.
  //
  // The result is a Map keyed by `normChannel(slug)` so refs with cosmetic
  // variants (`#mgm-15` vs `#mgm15`, `#7oh` vs `#7-oh`) all resolve to the
  // same canonical page.
  const knownChannels = new Map();
  const registerChannel = (slug, category) => {
    const norm = normChannel(slug);
    if (!norm) return;
    if (knownChannels.has(norm)) return;
    knownChannels.set(norm, { slug, category });
  };

  // 1. Channels discoverable from current input files.
  for (const f of inputFiles) {
    try {
      const raw = await fs.readFile(f, 'utf8');
      for (const block of splitChannels(raw)) {
        const target = mapping.channels[block.channel];
        const category = target?.category || 'uncategorized';
        registerChannel(slugify(block.channel), category);
      }
    } catch {
      // Read errors will surface in the processing pass.
    }
  }

  // 2. Channels already present on disk under OUTPUT_DIR (so partial reruns
  //    still cross-link correctly to previously-ingested or hand-authored
  //    pages).
  try {
    const cats = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
    for (const cat of cats) {
      if (!cat.isDirectory()) continue;
      const files = await fs.readdir(path.join(OUTPUT_DIR, cat.name));
      for (const file of files) {
        if (!/\.(md|mdx)$/i.test(file) || /^readme/i.test(file)) continue;
        const slug = file.replace(/\.(md|mdx)$/i, '');
        registerChannel(slug, cat.name);
      }
    }
  } catch {
    // Output dir doesn't exist yet; fine on first run.
  }

  vlog(`known channels (${knownChannels.size}):`, [...knownChannels.values()].map((c) => `#${c.slug}`).join(', '));

  let written = 0;
  let unchanged = 0;
  for (const f of inputFiles) {
    const outputs = await processFile(f, mapping, knownChannels);
    for (const out of outputs) {
      const sameAsExisting = await fileExistsAndIsSame(out.outPath, out.fileContent);
      if (DRY_RUN) {
        log(`[dry-run] would write ${path.relative(PROJECT_ROOT, out.outPath)} (#${out.channel})${sameAsExisting ? ' [unchanged]' : ''}`);
        continue;
      }
      if (sameAsExisting) {
        unchanged++;
        vlog(`unchanged: ${path.relative(PROJECT_ROOT, out.outPath)}`);
        continue;
      }
      await ensureDir(path.dirname(out.outPath));
      await fs.writeFile(out.outPath, out.fileContent, 'utf8');
      written++;
      log(`wrote ${path.relative(PROJECT_ROOT, out.outPath)} (#${out.channel})`);
    }
  }

  if (!DRY_RUN) {
    log(`\nDone. ${written} file(s) written, ${unchanged} unchanged.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
