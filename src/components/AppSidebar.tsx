import * as React from 'react';
import { BookOpen, ChevronDown, PanelLeftClose, PanelLeftOpen, Pin } from 'lucide-react';
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
  items: SidebarItem[];
  groups?: SidebarGroup[];
}

interface Props {
  categories: SidebarCategory[];
  pinned: SidebarItem[];
  currentPath: string;
}

interface NavigationProps extends Props {
  onCollapse?: () => void;
  onCollapsePointerDown?: () => void;
  collapseButtonRef?: React.Ref<HTMLButtonElement>;
}

const DESKTOP_SIDEBAR_STORAGE_KEY = 'desktop-sidebar-collapsed';

function categoryIsCurrent(slug: string, currentPath: string) {
  return currentPath === `/${slug}` || currentPath.startsWith(`/${slug}/`);
}

function PageLink({
  item,
  currentPath,
  shortcut = false,
}: {
  item: SidebarItem;
  currentPath: string;
  shortcut?: boolean;
}) {
  const active = item.href === currentPath;
  return (
    <li>
      <a
        href={item.href}
        aria-current={active && !shortcut ? 'page' : undefined}
        className={cn(
          'relative flex min-h-11 items-center rounded-md border-l-2 px-3 py-2 text-[0.86rem] leading-snug transition-colors lg:min-h-0 lg:py-1.5',
          active && shortcut
            ? 'border-transparent font-semibold text-primary before:absolute before:left-1 before:size-1 before:rounded-full before:bg-primary'
            : active
            ? 'border-primary bg-sidebar-accent/55 font-bold text-primary'
            : 'border-transparent text-sidebar-foreground/72 hover:bg-sidebar-accent/45 hover:text-sidebar-foreground',
        )}
      >
        {item.title}
      </a>
    </li>
  );
}

function Navigation({ categories, pinned, currentPath, onCollapse, onCollapsePointerDown, collapseButtonRef }: NavigationProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  return (
    <nav aria-label="Guide index" className="px-3 pb-12 lg:px-6">
      <div className="sidebar-nav-head sticky top-0 z-10 -mx-3 mb-5 flex items-center gap-2 px-5 pb-3 pt-5 text-sidebar-foreground lg:-mx-6 lg:px-8">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-primary">
          <BookOpen className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">Guide index</p>
          <p className="text-[0.7rem] text-muted-foreground">All topics and tools</p>
        </div>
        {onCollapse && (
          <button
            ref={collapseButtonRef}
            type="button"
            onPointerDown={onCollapsePointerDown}
            onClick={onCollapse}
            aria-controls="desktop-guide-navigation"
            aria-expanded="true"
            aria-label="Collapse guide navigation"
            title="Collapse guide navigation"
            className="ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelLeftClose className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <section className="mb-7">
        <h2 className="mb-2 flex items-center gap-2 px-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <Pin className="size-3" aria-hidden="true" />
          Most used
        </h2>
        <ul className="space-y-0.5">
          {pinned.map((item) => <PageLink key={item.href} item={item} currentPath={currentPath} shortcut />)}
        </ul>
      </section>

      <div className="space-y-1">
        {categories.map((category, index) => {
          const current = categoryIsCurrent(category.slug, currentPath);
          const open = expanded[category.slug] ?? current;
          const Icon = getCategoryIcon(category.slug);
          const section = getCategorySection(category.slug);
          const previousSection = index > 0 ? getCategorySection(categories[index - 1].slug) : undefined;
          const beginsReference = section === 'reference' && previousSection !== 'reference';
          const sectionId = `guide-section-${category.slug}`;

          return (
            <React.Fragment key={category.slug}>
              {beginsReference && (
                <p className="mb-2 mt-7 px-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Reference library
                </p>
              )}
              <section className={cn(current && 'rounded-lg bg-sidebar-accent/18')}>
                <div className="flex items-center gap-1.5 p-1">
                  <button
                    type="button"
                    onClick={() => setExpanded((state) => ({ ...state, [category.slug]: !open }))}
                    aria-expanded={open}
                    aria-controls={sectionId}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground lg:size-8"
                  >
                    <ChevronDown className={cn('size-3.5 transition-transform', !open && '-rotate-90')} aria-hidden="true" />
                    <span className="sr-only">{open ? 'Collapse' : 'Expand'} {category.title}</span>
                  </button>
                  <a
                    href={`/${category.slug}`}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-2 text-sm font-bold text-sidebar-foreground hover:text-primary',
                      current && 'text-primary',
                    )}
                  >
                    {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{category.title}</span>
                  </a>
                </div>

                {open && (
                  <div id={sectionId} className="pb-3 pl-5 pr-1">
                    {category.groups?.length ? (
                      <div className="space-y-3">
                        {category.groups.map((group) => (
                          <div key={group.name}>
                            <p className="mb-1 px-3 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted-foreground/75">{group.name}</p>
                            <ul className="space-y-0.5">
                              {group.items.map((item) => <PageLink key={item.href} item={item} currentPath={currentPath} />)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-0.5">
                        {category.items.map((item) => <PageLink key={item.href} item={item} currentPath={currentPath} />)}
                      </ul>
                    )}
                  </div>
                )}
              </section>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}

function centerCurrent(container: HTMLDivElement | null) {
  const link = container?.querySelector<HTMLElement>('a[aria-current="page"]');
  if (!container || !link) return;
  const inset = 76;
  const linkTop = link.offsetTop;
  const linkBottom = linkTop + link.clientHeight;
  const visibleTop = container.scrollTop + inset;
  const visibleBottom = container.scrollTop + container.clientHeight - inset;

  if (linkTop < visibleTop) {
    container.scrollTop = Math.max(0, linkTop - inset);
  } else if (linkBottom > visibleBottom) {
    container.scrollTop = linkBottom - container.clientHeight + inset;
  }
  // Assigning scrollTop from script does not always fire a scroll event
  // before paint, so the sticky header's opaque state is derived here as
  // well as in the onScroll handler.
  syncScrolledState(container);
}

function syncScrolledState(container: HTMLElement) {
  if (container.scrollTop > 4) {
    container.dataset.sidebarScrolled = 'true';
  } else {
    delete container.dataset.sidebarScrolled;
  }
}

function preservePageScroll(initialScroll: number, duration = 360) {
  const root = document.documentElement;
  root.dataset.sidebarTransitioning = 'true';
  const started = performance.now();
  const stabilize = (now: number) => {
    if (Math.abs(window.scrollY - initialScroll) > 0.5) {
      window.scrollTo({ top: initialScroll, behavior: 'instant' });
    }
    if (now - started < duration) {
      requestAnimationFrame(stabilize);
    } else {
      delete root.dataset.sidebarTransitioning;
    }
  };
  requestAnimationFrame(stabilize);
}

export function AppSidebar(props: Props) {
  const mobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);
  const desktopRef = React.useRef<HTMLDivElement>(null);
  const mobileRef = React.useRef<HTMLDivElement>(null);
  const desktopCollapseButtonRef = React.useRef<HTMLButtonElement>(null);
  const desktopExpandButtonRef = React.useRef<HTMLButtonElement>(null);

  const openerRef = React.useRef<HTMLElement | null>(null);
  const pageScrollRef = React.useRef(0);
  const pointerScrollRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const toggle = () => {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      pageScrollRef.current = window.scrollY;
      setOpen((value) => !value);
    };
    window.addEventListener('toggle-sidebar', toggle);
    return () => window.removeEventListener('toggle-sidebar', toggle);
  }, []);

  React.useEffect(() => {
    setDesktopCollapsed(document.documentElement.dataset.sidebarCollapsed === 'true');
  }, []);

  const setDesktopSidebarCollapsed = (collapsed: boolean) => {
    const root = document.documentElement;
    const pageScroll = pointerScrollRef.current ?? window.scrollY;
    pointerScrollRef.current = null;
    preservePageScroll(pageScroll);
    if (collapsed) {
      root.dataset.sidebarCollapsed = 'true';
    } else {
      delete root.dataset.sidebarCollapsed;
    }

    setDesktopCollapsed(collapsed);
    try {
      if (collapsed) {
        localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, '1');
      } else {
        localStorage.removeItem(DESKTOP_SIDEBAR_STORAGE_KEY);
      }
    } catch {
      // Storage can be blocked; the control still works for this page view.
    }

    requestAnimationFrame(() => {
      (collapsed ? desktopExpandButtonRef.current : desktopCollapseButtonRef.current)?.focus({ preventScroll: true });
    });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
  };

  const handleSidebarScroll = (event: React.UIEvent<HTMLDivElement>) => {
    syncScrolledState(event.currentTarget);
  };

  React.useEffect(() => {
    if (!mobile && desktopCollapsed) return;
    let readyFrame = 0;
    const revealCurrent = () => {
      const container = mobile ? mobileRef.current : desktopRef.current;
      if (!container) return;
      // The sticky header's fade is gated on `data-sidebar-ready`. Clearing it
      // before the jump means the opaque state paints in the same frame as the
      // scroll instead of fading in over rows that are already beneath it. A
      // persisting container (the desktop rail across page changes or collapse
      // toggles) snaps the same way as a freshly mounted drawer.
      delete container.dataset.sidebarReady;
      centerCurrent(container);
      cancelAnimationFrame(readyFrame);
      readyFrame = requestAnimationFrame(() => {
        container.dataset.sidebarReady = 'true';
      });
    };
    const frame = requestAnimationFrame(revealCurrent);
    // Hydration and font metrics can settle after the first frame. The fallback
    // makes sure the canonical entry is visible without moving an already
    // visible link.
    const timer = window.setTimeout(revealCurrent, 160);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(readyFrame);
      window.clearTimeout(timer);
    };
  }, [mobile, open, desktopCollapsed, props.currentPath]);

  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="left"
          className="w-[min(88vw,21rem)] gap-0 border-0 bg-sidebar p-0 shadow-2xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus({ preventScroll: true });
            requestAnimationFrame(() => {
              if (Math.abs(window.scrollY - pageScrollRef.current) > 1) {
                window.scrollTo({ top: pageScrollRef.current, behavior: 'auto' });
              }
            });
          }}
        >
          <SheetHeader className="sr-only"><SheetTitle>Guide navigation</SheetTitle></SheetHeader>
          <div ref={mobileRef} onScroll={handleSidebarScroll} className="h-full overflow-y-auto overscroll-contain">
            <Navigation {...props} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      aria-label="Guide navigation"
      className="desktop-sidebar-rail hidden min-w-0 w-[17rem] shrink-0 motion-reduce:transition-none lg:order-first lg:grid"
    >
      <div
        id="desktop-guide-navigation"
        ref={desktopRef}
        onScroll={handleSidebarScroll}
        aria-hidden={desktopCollapsed}
        className="desktop-sidebar-expanded scrollbar-none sticky top-[4.5rem] max-h-[calc(100vh-4.5rem)] overflow-x-hidden overflow-y-auto overscroll-contain"
      >
        <Navigation
          {...props}
          onCollapsePointerDown={() => {
            pointerScrollRef.current = window.scrollY;
          }}
          onCollapse={() => setDesktopSidebarCollapsed(true)}
          collapseButtonRef={desktopCollapseButtonRef}
        />
      </div>
      <div aria-hidden={!desktopCollapsed} className="desktop-sidebar-collapsed sticky top-[4.5rem] justify-start pt-5">
        <button
          ref={desktopExpandButtonRef}
          type="button"
          onPointerDown={() => {
            pointerScrollRef.current = window.scrollY;
          }}
          onClick={() => setDesktopSidebarCollapsed(false)}
          aria-controls="desktop-guide-navigation"
          aria-expanded={!desktopCollapsed}
          aria-label="Expand guide navigation"
          title="Expand guide navigation"
          className="inline-flex h-12 w-11 items-center justify-center rounded-r-xl border border-l-0 border-border/70 bg-card/95 text-primary shadow-[0_8px_24px_-16px_hsl(var(--foreground)/0.75)] backdrop-blur-sm transition-colors hover:border-primary/45 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <PanelLeftOpen className="size-5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
