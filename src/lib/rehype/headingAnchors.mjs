/**
 * Rehype plugin: wrap heading text with an anchor link to the heading's id
 * (GitHub-style — link icon revealed on hover via CSS).
 *
 * Assumes a slug plugin has already added `id` to headings.
 */
import { visit } from 'unist-util-visit';

const HEADING_TAGS = new Set(['h2', 'h3', 'h4']);

export default function rehypeHeadingAnchors() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!HEADING_TAGS.has(node.tagName)) return;
      const id = node.properties?.id;
      if (!id) return;
      // Don't double-wrap.
      if (
        node.children.length === 1 &&
        node.children[0].type === 'element' &&
        node.children[0].tagName === 'a' &&
        node.children[0].properties?.className?.includes?.('heading-link')
      ) {
        return;
      }
      // Append an empty anchor pointing to #id. The visible "#" is rendered
      // via the .heading-anchor::before pseudo-element in CSS so it never
      // appears as text in the DOM — that prevents Astro's heading extractor
      // from picking it up as part of the heading title for the TOC.
      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          href: `#${id}`,
          className: ['heading-anchor'],
          'aria-label': 'Link to this section',
        },
        children: [],
      });
    });
  };
}
