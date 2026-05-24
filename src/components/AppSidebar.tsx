import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { useIsMobile } from '~/hooks/use-mobile';
import { cn } from '~/lib/utils';

export interface SidebarCategory {
  slug: string;
  title: string;
  emoji: string;
  items: { href: string; title: string }[];
}

interface Props {
  categories: SidebarCategory[];
  currentPath: string;
}

function NavContent({ categories, currentPath }: Props) {
  return (
    <nav className="px-4 py-6 lg:px-6">
      {categories.map((cat) => (
        <section key={cat.slug} className="mb-6 last:mb-0">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span aria-hidden="true">{cat.emoji}</span>
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
      ))}
    </nav>
  );
}

export function AppSidebar({ categories, currentPath }: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  // The mobile hamburger lives in Header.astro (outside this React tree)
  // and dispatches 'toggle-sidebar' which we toggle from here.
  React.useEffect(() => {
    const handler = () => setOpen((prev) => !prev);
    window.addEventListener('toggle-sidebar', handler);
    return () => window.removeEventListener('toggle-sidebar', handler);
  }, []);

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

  // Desktop: aside stretches to the full height of the flex container
  // (matches the main column's height, so it runs as long as the article).
  // The inner scrollable div is sticky so the nav stays in view as the
  // reader scrolls. On mount, scroll the active page into view within the
  // sidebar — otherwise a long sidebar starts at the top and the user has
  // to scan to find where they are.
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    // Use the container's geometry to compute the desired scrollTop so
    // we don't fight the page's own scroll (scrollIntoView would do that).
    const cRect = container.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const offsetTop = aRect.top - cRect.top + container.scrollTop;
    // Center the active item vertically within the visible area.
    container.scrollTop = offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
  }, [currentPath]);

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
