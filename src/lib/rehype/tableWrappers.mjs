import { SKIP, visit } from 'unist-util-visit';

/**
 * Wrap Markdown tables in a focusable scrolling region. The wrapper keeps
 * comparison columns readable on narrow screens without adding client-side JS.
 */
export default function rehypeTableWrappers() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || typeof index !== 'number' || !parent) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-wrapper'],
          role: 'region',
          tabIndex: 0,
          'aria-label': 'Scrollable data table',
        },
        children: [node],
      };

      return SKIP;
    });
  };
}
