/**
 * Document layouts own the single page-level h1. Demote legacy Markdown h1s
 * at render time so source content remains untouched and heading structure
 * stays valid inside the article.
 */
import { visit } from 'unist-util-visit';

export default function rehypeNormalizeHeadings() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'h1') node.tagName = 'h2';
    });
  };
}
