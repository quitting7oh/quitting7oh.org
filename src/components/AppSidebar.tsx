import * as React from 'react';
import { BookOpen, ChevronDown, Pin } from 'lucide-react';
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

function categoryIsCurrent(slug: string, currentPath: string) {
  return currentPath === `/${slug}` || currentPath.startsWith(`/${slug}/`);
}

function PageLink({ item, currentPath }: { item: SidebarItem; currentPath: string }) {
  const active = item.href === currentPath;
  return (
    <li>
      <a
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative block rounded-md border-l-2 px-3 py-1.5 text-[0.86rem] leading-snug transition-colors',
          active
            ? 'border-primary bg-sidebar-accent/55 font-bold text-primary'
            : 'border-transparent text-sidebar-foreground/72 hover:bg-sidebar-accent/45 hover:text-sidebar-foreground',
        )}
      >
        {item.title}
      </a>
    </li>
  );
}

function Navigation({ categories, pinned, currentPath }: Props) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  return (
    <nav aria-label="Guide index" className="px-3 pb-8 pt-5">
      <div className="mb-5 flex items-center gap-2 px-2 text-sidebar-foreground">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-primary">
          <BookOpen className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">Guide index</p>
          <p className="text-[0.7rem] text-muted-foreground">All topics and tools</p>
        </div>
      </div>

      <section className="mb-7">
        <h2 className="mb-2 flex items-center gap-2 px-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <Pin className="size-3" aria-hidden="true" />
          Most used
        </h2>
        <ul className="space-y-0.5">
          {pinned.map((item) => <PageLink key={item.href} item={item} currentPath={currentPath} />)}
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
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
  const top = link.offsetTop - container.clientHeight / 2 + link.clientHeight / 2;
  container.scrollTop = Math.max(0, top);
}

export function AppSidebar(props: Props) {
  const mobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const desktopRef = React.useRef<HTMLDivElement>(null);
  const mobileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const toggle = () => setOpen((value) => !value);
    window.addEventListener('toggle-sidebar', toggle);
    return () => window.removeEventListener('toggle-sidebar', toggle);
  }, []);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => centerCurrent(mobile ? mobileRef.current : desktopRef.current));
    return () => cancelAnimationFrame(frame);
  }, [mobile, open, props.currentPath]);

  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[min(88vw,21rem)] gap-0 border-0 bg-sidebar p-0 shadow-2xl">
          <SheetHeader className="sr-only"><SheetTitle>Guide navigation</SheetTitle></SheetHeader>
          <div ref={mobileRef} className="h-full overflow-y-auto overscroll-contain pt-4">
            <Navigation {...props} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside aria-label="Guide navigation" className="hidden w-[17rem] shrink-0 bg-sidebar/58 shadow-[inset_-1px_0_0_hsl(var(--sidebar-border)/0.42)] lg:block">
      <div ref={desktopRef} className="scrollbar-none sticky top-[4.5rem] max-h-[calc(100vh-4.5rem)] overflow-y-auto overscroll-contain">
        <Navigation {...props} />
      </div>
    </aside>
  );
}
