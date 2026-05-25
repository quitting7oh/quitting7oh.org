import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { useIsMobile } from '~/hooks/use-mobile';
import { getCategoryIcon } from '~/lib/categories';
import { cn } from '~/lib/utils';

export interface SidebarCategory {
  slug: string;
  title: string;
  items: { href: string; title: string }[];
}

interface Props {
  categories: SidebarCategory[];
  currentPath: string;
}

function NavContent({ categories, currentPath }: Props) {
  return (
    <nav className="px-4 py-6 lg:px-6">
      {categories.map((cat) => {
        const Icon = getCategoryIcon(cat.slug);
        return (
        <section key={cat.slug} className="mb-6 last:mb-0">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden={true} />}
            <a href={`/${cat.slug}`} className="hover:text-foreground">
              {cat.title}
            </a>
          </h2>
          {cat.items.length === 0 ? (
            <p className="text-sm italic text-muted-foreground/70">No pages yet.</p>
          ) : (
            <ul className="space-y-1">
              {cat.items.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'block rounded px-2 py-1 text-sm transition',
                        isActive
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground',
                      )}
                    >
                      {item.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        );
      })}
    </nav>
  );
}

export function AppSidebar({ categories, currentPath }: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isMobile) return;
    // Defer to next paint so the DOM is fully laid out before measuring.
    const raf = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const active = container.querySelector<HTMLElement>(
        'a[aria-current="page"]',
      );
      if (!active) return;
      const cRect = container.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      // If already fully visible, don't move.
      if (aRect.top >= cRect.top && aRect.bottom <= cRect.bottom) return;
      // Position of the active item in the container's content coord space.
      const offsetTop = aRect.top - cRect.top + container.scrollTop;
      const target =
        offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
      // Bypass the page's CSS scroll-behavior: smooth so this lands
      // instantly on page load instead of animating in.
      container.style.scrollBehavior = 'auto';
      container.scrollTop = Math.max(0, target);
    });
    return () => cancelAnimationFrame(raf);
  }, [currentPath, isMobile]);

  // Mobile: Sheet drawer (Radix Dialog under the hood — focus trap, ESC,
  // scroll lock, ARIA all handled).
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Site navigation</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-y-auto pt-4">
            <NavContent categories={categories} currentPath={currentPath} />
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
        <NavContent categories={categories} currentPath={currentPath} />
      </div>
    </aside>
  );
}
