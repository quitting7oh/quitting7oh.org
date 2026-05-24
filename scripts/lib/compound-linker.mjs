/**
 * Compound auto-linker.
 *
 * Walks markdown body text and turns the *first* mention of each known
 * compound (per page) into a link to that compound's page.
 *
 * Design notes:
 *   - Only the first occurrence is linked. Linking every mention turns the
 *     text into link soup and ruins readability.
 *   - Skipped: code fences, inline code, existing markdown links, headings,
 *     blockquotes. Linking inside any of those would either break
 *     formatting or be redundant.
 *   - Variants are matched case-insensitively with word-boundary anchors.
 *     The actual matched text is preserved in the link label (so the page
 *     reads "7-OH" or "7oh" exactly as the author wrote it).
 *   - Compounds are matched longest-pattern-first so "7-hydroxymitragynine"
 *     wins over "7-OH" if both appear at the same position.
 *   - Self-links are skipped: when processing /compounds/7-oh.md, a "7-OH"
 *     mention does NOT get linked to its own page.
 */

/**
 * @typedef {Object} CompoundDef
 * @property {string}   url       Absolute site path to the compound's page.
 * @property {string[]} patterns  Regex source strings (no anchors). The first
 *                                pattern is the canonical label that wraps
 *                                the matched text in the link if the actual
 *                                source text isn't preferred.
 */

/** @type {CompoundDef[]} */
export const COMPOUNDS = [
  {
    url: '/compounds/7-oh',
    patterns: ['7-hydroxymitragynine', '7-OH', '7OH', '7-oh', '7oh'],
  },
  {
    url: '/compounds/mgm15',
    patterns: ['MGM-15', 'MGM15', 'mgm-15', 'mgm15'],
  },
  {
    url: '/compounds/mit-a-dhm',
    patterns: ['MIT-A/DHM', 'MIT-A', 'mit-a/dhm', 'mit-a', 'dihydromitragynine'],
  },
  {
    url: '/compounds/pseudo',
    patterns: ['mitragynine pseudoindoxyl', 'pseudoindoxyl', 'pseudo'],
  },
  {
    url: '/compounds/cats-claw',
    patterns: ["Cat's Claw", "cat's claw", 'cats claw', 'rhynchophylline'],
  },
];

// Skip linking inside these patterns. Each is a regex matching a region we
// should leave alone (code fences, inline code, headings, existing links,
// blockquotes).
const SKIP_PATTERNS = [
  /^```[\s\S]*?^```/gm,    // fenced code blocks
  /^~~~[\s\S]*?^~~~/gm,    // fenced code blocks (tilde)
  /`[^`]+`/g,              // inline code
  /^#{1,6}\s.*$/gm,        // headings
  /\[[^\]]*\]\([^)]+\)/g,  // existing markdown links
  /^>.*$/gm,               // blockquotes
];

// Mask token uses U+0000 so it can't appear in source markdown and can't
// be matched by the compound regex's \b word boundaries.
const TOKEN_RE = /\x00SKIP(\d+)\x00/g;
const mkToken = (i) => `\x00SKIP${i}\x00`;

/**
 * Mask regions of the body that should not be touched.
 *
 * Masks can NEST — a blockquote line that contains a markdown link, for
 * example. The link gets masked first, then the (now-masked) blockquote is
 * itself masked, so the blockquote stash entry contains the link's token
 * as part of its text. Restoration loops until no tokens remain so nested
 * masks unwind correctly.
 */
function maskSkipRegions(body) {
  let masked = body;
  const stash = [];
  for (const re of SKIP_PATTERNS) {
    masked = masked.replace(re, (m) => {
      const token = mkToken(stash.length);
      stash.push(m);
      return token;
    });
  }
  const restore = (s) => {
    let prev;
    do {
      prev = s;
      s = s.replace(TOKEN_RE, (_m, i) => stash[Number(i)]);
    } while (s !== prev);
    return s;
  };
  return { masked, restore };
}

/**
 * Build a single combined regex matching any compound variant. Sorted by
 * length descending so longer/more-specific patterns win.
 */
function buildCompoundRegex(compounds) {
  const flat = [];
  for (const c of compounds) {
    for (const p of c.patterns) flat.push({ pattern: p, compound: c });
  }
  flat.sort((a, b) => b.pattern.length - a.pattern.length);
  const escaped = flat.map((f) => `(?:${escapeRegex(f.pattern)})`);
  const combined = new RegExp(
    String.raw`\b(?:${escaped.join('|')})\b`,
    'gi',
  );
  const lookup = new Map(
    flat.map((f) => [f.pattern.toLowerCase(), f.compound]),
  );
  return { regex: combined, lookup };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Link the first occurrence of each compound in the given markdown body.
 *
 * @param {string} body
 * @param {object} [opts]
 * @param {string} [opts.selfUrl]   The URL of the page being processed.
 *                                  Compounds matching this URL are skipped
 *                                  (no self-links from /compounds/7-oh to
 *                                  its own /compounds/7-oh page).
 * @param {CompoundDef[]} [opts.compounds]  Override the compound list.
 * @returns {string}
 */
export function linkCompounds(body, opts = {}) {
  if (!body) return body;
  const { selfUrl, compounds = COMPOUNDS } = opts;
  const { masked, restore } = maskSkipRegions(body);
  const { regex, lookup } = buildCompoundRegex(compounds);

  const linkedCompounds = new Set();
  if (selfUrl) linkedCompounds.add(selfUrl); // skip linking self

  const result = masked.replace(regex, (match) => {
    const compound = lookup.get(match.toLowerCase());
    if (!compound) return match;
    if (linkedCompounds.has(compound.url)) return match;
    linkedCompounds.add(compound.url);
    return `[${match}](${compound.url})`;
  });

  return restore(result);
}
