import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';
import { useSidebar } from '~/components/ui/sidebar';

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

/** Listens for the global 'toggle-sidebar' custom event from the Astro hamburger
 *  (which lives outside this React tree in Header.astro). Toggles the mobile
 *  drawer when fired. */
function useToggleEventBridge() {
  const { setOpenMobile, isMobile } = useSidebar();
  React.useEffect(() => {
    const handler = () => {
      if (isMobile) setOpenMobile((prev) => !prev);
    };
    window.addEventListener('toggle-sidebar', handler);
    return () => window.removeEventListener('toggle-sidebar', handler);
  }, [setOpenMobile, isMobile]);
}

export function AppSidebar({ categories, currentPath }: Props) {
  useToggleEventBridge();

  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarContent>
        {categories.map((cat) => (
          <SidebarGroup key={cat.slug}>
            <SidebarGroupLabel asChild>
              <a href={`/${cat.slug}`} className="flex items-center gap-2">
                <span aria-hidden="true">{cat.emoji}</span>
                <span>{cat.title}</span>
              </a>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {cat.items.length === 0 ? (
                  <SidebarMenuItem>
                    <span className="px-2 py-1 text-sm italic text-muted-foreground">
                      No pages yet.
                    </span>
                  </SidebarMenuItem>
                ) : (
                  cat.items.map((item) => {
                    const isActive = currentPath === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <a href={item.href}>{item.title}</a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
