'use client';

import type { FC, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, LogOut, FolderHeart } from 'lucide-react';
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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useUser, useAuth } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

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
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/plans'}
                tooltip="My Plans"
              >
                <Link href="/plans">
                  <FolderHeart />
                  <span>My Plans</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {user && (
             <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 text-left">
                  <Avatar className="size-8">
                    {user.photoURL && <AvatarImage src={user.photoURL} alt="User avatar" />}
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{user.displayName || user.email}</p>
                  </div>
                </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent side="right" align="end" className="w-56">
               <DropdownMenuLabel className='truncate'>{user.displayName || user.email}</DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={handleLogout}>
                 <LogOut className="mr-2 h-4 w-4" />
                 <span>Log out</span>
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-emerald-600 px-4 text-primary-foreground backdrop-blur-sm lg:px-6">
          <div className="flex items-center">
            <SidebarTrigger className="text-primary-foreground md:hidden" />
            <h1 className="font-headline text-xl font-semibold">
              {pathname === '/dashboard' ? 'Dashboard' : pathname === '/plans' ? 'My Plans' : 'Wellness Assistant'}
            </h1>
          </div>
          {!user && !isUserLoading && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hover:bg-emerald-700">
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="outline" asChild className="border-emerald-400 bg-emerald-600 hover:bg-emerald-700">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};
