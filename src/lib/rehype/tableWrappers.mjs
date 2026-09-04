import { SKIP, visit } from 'unist-util-visit';

function textContent(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  if (!Array.isArray(node.children)) return '';
  return node.children.map(textContent).join('').replace(/\s+/g, ' ').trim();
}

function appendClass(node, className) {
  const existing = node.properties?.className;
  const classNames = Array.isArray(existing)
    ? existing
    : typeof existing === 'string'
      ? existing.split(/\s+/)
      : [];

  node.properties = {
    ...node.properties,
    className: [...classNames, className],
  };
}

function tableHeaders(table) {
  const thead = table.children?.find(
    (child) => child.type === 'element' && child.tagName === 'thead',
  );
  const row = thead?.children?.find(
    (child) => child.type === 'element' && child.tagName === 'tr',
  );

  return (row?.children ?? [])
    .filter(
      (child) =>
        child.type === 'element' &&
        (child.tagName === 'th' || child.tagName === 'td'),
    )
    .map(textContent);
}

function isComparisonTable(headers) {
  if (headers.length >= 5) return true;
  if (headers.length < 3) return false;

  const normalized = headers.map((header) => header.toLowerCase().trim());
  const first = normalized[0];
  const remaining = normalized.slice(1);

  if (!first) return true;
  if (first === 'property' || first === 'study and system') return true;
  if (remaining.some((header) => /\b(?:lower|higher) target\b/.test(header))) return true;
  if (first === 'day' && remaining.some((header) => /\b\d+\s*-?\s*day\b/.test(header))) {
    return true;
  }

  if (
    first === 'compound' &&
    remaining.filter((header) => /\b(?:ki|kᵢ|ec50|ec₅₀|emax|mor|dor|nm)\b/.test(header))
      .length >= 2
  ) {
    return true;
  }

  return false;
}

function isCell(node) {
  return (
    node?.type === 'element' && (node.tagName === 'td' || node.tagName === 'th')
  );
}

/**
 * Wrap each cell's content in a single span. On narrow screens the record
 * layout turns every cell into a two-column grid (label, value). Without a
 * wrapper, a cell that mixes text with inline elements (a link, bold, code)
 * contributes several grid items and the extras wrap into the label column.
 * One wrapper means one value item, so the sentence stays together.
 */
function wrapCellValues(table) {
  visit(table, 'element', (node) => {
    if (!isCell(node) || !Array.isArray(node.children) || node.children.length === 0) {
      return;
    }

    node.children = [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['responsive-table__value'] },
        children: node.children,
      },
    ];

    return SKIP;
  });
}

function enhanceRecordCells(table, headers) {
  const tbody = table.children?.find(
    (child) => child.type === 'element' && child.tagName === 'tbody',
  );
  const ordinalFirstColumn = headers[0]?.trim() === '#';

  for (const row of tbody?.children ?? []) {
    if (row.type !== 'element' || row.tagName !== 'tr') continue;

    const cells = row.children.filter(
      (child) =>
        child.type === 'element' &&
        (child.tagName === 'td' || child.tagName === 'th'),
    );

    cells.forEach((cell, index) => {
      cell.properties = {
        ...cell.properties,
        'data-label': headers[index] || `Column ${index + 1}`,
      };

      if (ordinalFirstColumn && index === 0) appendClass(cell, 'responsive-table__ordinal');
      if (index === (ordinalFirstColumn ? 1 : 0)) {
        appendClass(cell, 'responsive-table__primary');
      }
    });
  }
}

/**
 * Give Markdown tables one of two narrow-screen reading modes while keeping
 * native table markup intact. Record tables become compact editorial rows;
 * genuine comparison matrices keep their axes and get a focused swipe area.
 */
export default function rehypeTableWrappers() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || typeof index !== 'number' || !parent) return;

      const headers = tableHeaders(node);
      const kind = isComparisonTable(headers) ? 'matrix' : 'records';

      wrapCellValues(node);
      if (kind === 'records') enhanceRecordCells(node, headers);

      const scrollRegion = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['responsive-table__scroll'],
          ...(kind === 'matrix'
            ? {
                role: 'region',
                tabIndex: 0,
                'aria-label': `Scrollable comparison table: ${headers.filter(Boolean).join(', ')}`,
              }
            : {}),
        },
        children: [node],
      };

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['responsive-table', `responsive-table--${kind}`],
          'data-table-kind': kind,
          'data-column-count': String(headers.length),
        },
        children:
          kind === 'matrix'
            ? [
                {
                  type: 'element',
                  tagName: 'p',
                  properties: {
                    className: ['responsive-table__hint'],
                    'aria-hidden': 'true',
                  },
                  children: [{ type: 'text', value: 'Swipe across to compare' }],
                },
                scrollRegion,
              ]
            : [scrollRegion],
      };

      return SKIP;
    });
  };
}
