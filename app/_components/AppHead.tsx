'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Heading, Label } from '@/app/_components/Typography';
import { FiIcon } from '@/app/_components/Icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import imgLogoApp from '@/assets/images/logo-app.png';
import { useUserAuth } from '@/app/_hooks/useUserAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/_components/DropdownMenu';
import type { Session } from 'next-auth';
import { navItems } from '@/app/_constants/navItems';
import { useNavbar } from '@/app/_contexts/NavbarContext';
import api from '@/lib/api-client';

type AppHeadProps = {
  session: Session | null;
};

const AppHead: React.FC<AppHeadProps> = ({ session }) => {
  const userAuth = useUserAuth(session);
  const { openDrawer } = useNavbar();
  const [unreadCount, setUnreadCount] = useState(0);

  const pathname = usePathname();
  const currentNavItem = navItems.find((item) => pathname === item.href);
  const heading = currentNavItem ? currentNavItem.label : 'Dashboard';
  const isPayAsStudent = pathname?.startsWith('/pay-as-student');

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api<{ unread_count: number }>('/api/notifications/unread-count/');
      setUnreadCount(data.unread_count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [session, fetchUnreadCount]);

  // Calculate user initials from name
  const getUserInitials = (name: string): string => {
    if (!name || name.trim() === '') {
      console.warn('No name provided for initials calculation');
      return 'U'; // Default to 'U' for User if no name
    }

    const trimmedName = name.trim();
    const nameParts = trimmedName.split(' ').filter((part) => part.length > 0);

    if (nameParts.length === 0) {
      return 'U';
    } else if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else {
      // Use first and last name initials
      return (
        nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
      ).toUpperCase();
    }
  };

  return (
    <>
      {pathname == '/app' && <div className="dashboard-bg"></div>}
      <header className="flex h-12 items-center justify-between border-b border-neutral-200 px-4">
        <div className="flex items-center gap-3">
          {isPayAsStudent && !session ? (
            <Link href="/dashboard">
              <Image
                src={imgLogoApp}
                alt="HelloIvy Logo"
                className="h-6 w-auto"
                priority
              />
            </Link>
          ) : (
            <>
              {/* Hamburger menu — visible below lg */}
              <button
                aria-label="Open menu"
                className="rounded-md p-1 transition hover:bg-neutral-100 lg:hidden"
                onClick={openDrawer}
              >
                <FiIcon name="menu-burger" className="block h-5 w-5 text-neutral-700" />
              </button>
              <Heading level={3} className="font-extrabold bg-linear-to-r from-teal-500 via-emerald-500 to-blue-400 bg-clip-text text-2xl text-transparent md:text-2xl">
                {heading}
              </Heading>
            </>
          )}
        </div>
        {!isPayAsStudent && (
        <div className="flex items-center gap-4">
          <Link
            href="/documents"
            className="rounded-md p-1.5 transition hover:bg-neutral-100"
            aria-label="Documents"
          >
            <FiIcon name="document" className="block h-5 w-5 text-neutral-700" />
          </Link>
          <Link
            href="/notifications"
            className="relative rounded-md p-1.5 transition hover:bg-neutral-100"
            aria-label="Notifications"
          >
            <FiIcon name="bell" className="block h-5 w-5 text-neutral-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 outline-none transition-colors hover:bg-neutral-100 focus:ring-2 focus:ring-blue-500/20">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
                  <Label size="sm">
                    {getUserInitials(userAuth.userDetails.name)}
                  </Label>
                </div>
                <FiIcon
                  name="angle-small-down"
                  className="block h-4 w-4 text-neutral-800"
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-48"
              sideOffset={8}
              align="end"
            >
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
                  <Label size="sm">
                    {getUserInitials(userAuth.userDetails.name)}
                  </Label>
                </div>
                <div className="flex flex-col">
                  <Label size="md" className="font-semibold text-neutral-900">
                    {userAuth.userDetails.name || userAuth.userDetails.email}
                  </Label>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile/personal/edit">My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/change-password">Change Password</Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem> */}
              <DropdownMenuItem asChild>
                <Link href="/faq">FAQs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/legal">Legal</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-red-600 focus:text-red-600">
                <Link href="/logout">Log Out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        )}
      </header>
    </>
  );
};

export default AppHead;
