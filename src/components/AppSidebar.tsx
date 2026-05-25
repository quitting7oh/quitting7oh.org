import * as React from 'react';
import { ChevronRight, Pin } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { useIsMobile } from '~/hooks/use-mobile';
import { getCategoryIcon, getCategorySection } from '~/lib/categories';
import { cn } from '~/lib/utils';

export interface SidebarItem {
  href: string;
  title: string;
}

export interface SidebarGroup {
  name: string;
  items: SidebarItem[];
}

export interface SidebarCategory {
  slug: string;
  title: string;
  /** Flat list, used when the category has no sub-groups. */
  items: SidebarItem[];
  /** When present, the sidebar renders these instead of the flat items
   *  list — each group gets its own sub-heading. */
  groups?: SidebarGroup[];
}

interface Props {
  categories: SidebarCategory[];
  pinned: SidebarItem[];
  currentPath: string;
}

/** True if currentPath sits under this category. Used to decide which
 *  category opens by default on each page load. */
function isCategoryCurrent(slug: string, currentPath: string): boolean {
  return currentPath === `/${slug}` || currentPath.startsWith(`/${slug}/`);
}

interface ItemLinkProps {
  item: SidebarItem;
  currentPath: string;
  /** Indent the link to sit under a group sub-heading. */
  indented?: boolean;
}

function ItemLink({ item, currentPath, indented }: ItemLinkProps) {
  const isActive = currentPath === item.href;
  return (
    <li>
      <a
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'block rounded px-2 py-1 text-sm transition',
          indented && 'ml-3',
          isActive
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground',
        )}
      >
        {item.title}
      </a>
    </li>
  );
}

interface NavContentProps extends Props {
  expanded: Record<string, boolean>;
  toggle: (slug: string) => void;
}

function NavContent({ categories, pinned, currentPath, expanded, toggle }: NavContentProps) {
  return (
    <nav className="px-4 py-6 lg:px-6">
      {/* Pinned: quick links to the highest-traffic pages, persistent
          across categories. Mirrors the homepage funnel. */}
      {pinned.length > 0 && (
        <section className="mb-6 border-b border-border pb-4">
          <h2 className="mb-2 flex items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            <Pin className="h-3 w-3 shrink-0" aria-hidden={true} />
            Quick links
          </h2>
          <ul className="space-y-0.5">
            {pinned.map((item) => (
              <ItemLink key={item.href} item={item} currentPath={currentPath} />
            ))}
          </ul>
        </section>
      )}

      {categories.map((cat, idx) => {
        const Icon = getCategoryIcon(cat.slug);
        const userToggled = expanded[cat.slug];
        const isOpen =
          userToggled !== undefined
            ? userToggled
            : isCategoryCurrent(cat.slug, currentPath);
        const listId = `sidebar-section-${cat.slug}`;

        // Draw a labeled separator when the section flips from
        // 'recovery' (active what-to-do content) to 'reference'
        // (compound details, pharmacology, external links, meta).
        const thisSection = getCategorySection(cat.slug);
        const prevSection =
          idx > 0 ? getCategorySection(categories[idx - 1].slug) : undefined;
        const showSeparator =
          thisSection === 'reference' && prevSection !== 'reference';

        const hasGroups = cat.groups && cat.groups.length > 0;
        const hasItems = hasGroups || cat.items.length > 0;

        return (
          <React.Fragment key={cat.slug}>
            {showSeparator && (
              <div className="mb-6 border-t border-border pt-4">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Reference
                </p>
              </div>
            )}
            <section className="mb-6 last:mb-0">
              <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <button
                  type="button"
                  onClick={() => toggle(cat.slug)}
                  aria-expanded={isOpen}
                  aria-controls={listId}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      isOpen && 'rotate-90',
                    )}
                    aria-hidden={true}
                  />
                  <span className="sr-only">
                    {isOpen ? 'Collapse' : 'Expand'} {cat.title}
                  </span>
                </button>
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden={true} />}
                <a href={`/${cat.slug}`} className="hover:text-foreground">
                  {cat.title}
                </a>
              </h2>
              {isOpen && (
                !hasItems ? (
                  <p id={listId} className="text-sm italic text-muted-foreground/70">
                    No pages yet.
                  </p>
                ) : hasGroups ? (
                  <div id={listId} className="space-y-3">
                    {cat.groups!.map((group) => (
                      <div key={group.name}>
                        <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/55">
                          {group.name}
                        </p>
                        <ul className="space-y-0.5">
                          {group.items.map((item) => (
                            <ItemLink
                              key={item.href}
                              item={item}
                              currentPath={currentPath}
                              indented
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul id={listId} className="space-y-1">
                    {cat.items.map((item) => (
                      <ItemLink key={item.href} item={item} currentPath={currentPath} />
                    ))}
                  </ul>
                )
              )}
            </section>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/** Scroll the given overflow-y-auto container so its active page link
 *  is centered. No-op if there is no active link, or if it is already
 *  fully visible. Only touches the container's own scrollTop, never the
 *  document. */
function scrollActiveIntoCenter(container: HTMLDivElement | null) {
  if (!container) return;
  const active = container.querySelector<HTMLElement>(
    'a[aria-current="page"]',
  );
  if (!active) return;
  const cRect = container.getBoundingClientRect();
  const aRect = active.getBoundingClientRect();
  if (aRect.top >= cRect.top && aRect.bottom <= cRect.bottom) return;
  const offsetTop = aRect.top - cRect.top + container.scrollTop;
  const target =
    offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
  container.style.scrollBehavior = 'auto';
  container.scrollTop = Math.max(0, target);
}

export function AppSidebar({ categories, pinned, currentPath }: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const mobileScrollRef = React.useRef<HTMLDivElement>(null);

  // Per-category expand/collapse state. Entries are user-set overrides;
  // the default for any unset slug is "expanded iff this category
  // contains the current page." That gives a sensible first render
  // (current section open, others closed) and lets users override.
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const toggle = React.useCallback(
    (slug: string) =>
      setExpanded((prev) => ({
        ...prev,
        [slug]:
          prev[slug] === undefined
            ? !isCategoryCurrent(slug, currentPath)
            : !prev[slug],
      })),
    [currentPath],
  );

  // The mobile hamburger lives in Header.astro (outside this React tree)
  // and dispatches 'toggle-sidebar' which we toggle from here.
  React.useEffect(() => {
    const handler = () => setOpen((prev) => !prev);
    window.addEventListener('toggle-sidebar', handler);
    return () => window.removeEventListener('toggle-sidebar', handler);
  }, []);

  // Scroll the desktop sidebar so the active page is centered in view.
  // Without this, a long sidebar always starts at the top and readers
  // have to scan to find where they are. Skips on mobile (the Sheet
  // doesn't use scrollContainerRef).
  //
  // Double-RAF before measuring: the Lucide SVG icons in each category
  // header render at their intrinsic 24×24 before Tailwind's h-3.5
  // applies, so measuring on the first frame after hydration sometimes
  // catches a stale layout. Two frames lets the CSS settle.
  //
  // We set container.scrollTop directly (not scrollIntoView) because
  // scrollIntoView with block:'center' also scrolls the document to
  // bring the link into viewport-center, which causes a visible
  // page-level jump on every refresh.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isMobile) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        scrollActiveIntoCenter(scrollContainerRef.current);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [currentPath, isMobile]);

  // Mobile: when the Sheet opens, center the active page in the drawer.
  // Runs on every open (and whenever the page changes while the drawer
  // is open) so the user always sees where they are. The double-RAF
  // gives Radix's open animation time to settle the layout before we
  // measure.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isMobile) return;
    if (!open) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        scrollActiveIntoCenter(mobileScrollRef.current);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [isMobile, open, currentPath]);

  // Mobile: Sheet drawer (Radix Dialog under the hood — focus trap, ESC,
  // scroll lock, ARIA all handled).
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Site navigation</SheetTitle>
          </SheetHeader>
          <div ref={mobileScrollRef} className="h-full overflow-y-auto pt-4">
            <NavContent categories={categories} pinned={pinned} currentPath={currentPath} expanded={expanded} toggle={toggle} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      aria-label="Site navigation"
      className="hidden w-64 shrink-0 border-r border-border lg:block"
    >
      <div
        ref={scrollContainerRef}
        className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
      >
        <NavContent categories={categories} pinned={pinned} currentPath={currentPath} expanded={expanded} toggle={toggle} />
      </div>
    </aside>
  );
}
