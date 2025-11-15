'use client';

import type { FC, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard } from 'lucide-react';
import { HandInHeart } from '@/components/icons/hand-in-heart';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:bg-primary/10"
              asChild
            >
              <Link href="/">
                <HandInHeart className="size-6" />
              </Link>
            </Button>
            <div className="flex flex-col">
              <h2 className="font-headline text-lg font-semibold tracking-tight">
                DAMII
              </h2>
              <p className="text-xs text-muted-foreground">
                Wellness Assistant
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip="Wellness Assistant"
              >
                <Link href="/">
                  <Home />
                  <span>Wellness Assistant</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip="Dashboard"
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-start border-b bg-emerald-600 px-4 text-primary-foreground backdrop-blur-sm lg:px-6">
          <SidebarTrigger className="text-primary-foreground md:hidden" />
          <h1 className="font-headline text-xl font-semibold">
            {pathname === '/dashboard' ? 'Dashboard' : 'Wellness Assistant'}
          </h1>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};
