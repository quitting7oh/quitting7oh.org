import * as React from 'react';
import { AppSidebar, type SidebarCategory, type SidebarItem } from '~/components/AppSidebar';

interface Props {
  categories: SidebarCategory[];
  pinned: SidebarItem[];
  currentPath: string;
  children: React.ReactNode;
}

/** Lays out the sidebar + main content side by side. On mobile the sidebar
 *  is hidden in a Sheet drawer that the Astro hamburger in Header opens via
 *  a 'toggle-sidebar' custom event. */
export function SidebarShell({ categories, pinned, currentPath, children }: Props) {
  return (
    <div className="mx-auto flex max-w-[88rem] gap-8 px-4 sm:px-6 lg:px-8">
      <AppSidebar categories={categories} pinned={pinned} currentPath={currentPath} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
