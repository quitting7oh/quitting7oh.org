/**
 * Rehype plugin: mark external links with rel/target + a CSS class so we can
 * append an icon via CSS. Internal links (relative, or same-host) are left alone.
 */
import { visit } from 'unist-util-visit';

const INTERNAL_HOSTS = new Set(['quitting7oh.org', 'www.quitting7oh.org']);

export default function rehypeExternalLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string') return;
      if (href.startsWith('#') || href.startsWith('/') || href.startsWith('.')) return;
      let host = '';
      try {
        host = new URL(href).hostname;
      } catch {
        return;
      }
      if (!host || INTERNAL_HOSTS.has(host)) return;

      node.properties.target = '_blank';
      node.properties.rel = 'noopener noreferrer';
      const cls = node.properties.className;
      const list = Array.isArray(cls) ? cls : cls ? [cls] : [];
      list.push('external-link');
      node.properties.className = list;
    });
  };
}
