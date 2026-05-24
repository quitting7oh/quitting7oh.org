import * as React from 'react';
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar';
import { AppSidebar, type SidebarCategory } from '~/components/AppSidebar';

interface Props {
  categories: SidebarCategory[];
  currentPath: string;
  children: React.ReactNode;
}

/** Wraps the page's main content area in a SidebarProvider so the
 *  SidebarTrigger and the AppSidebar share context. The Astro hamburger
 *  in Header.astro toggles the mobile drawer via a 'toggle-sidebar' event
 *  that AppSidebar listens for. */
export function SidebarShell({ categories, currentPath, children }: Props) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar categories={categories} currentPath={currentPath} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
