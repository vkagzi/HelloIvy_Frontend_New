'use client';

import React from 'react';
import { Heading, Label } from '@/app/_components/Typography';
import { FiIcon } from '@/app/_components/Icons';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/_components/DropdownMenu';
import type { Session } from 'next-auth';
import { useNavbar } from '@/app/_contexts/NavbarContext';

const adminNavItems = [
  { label: 'Admin Dashboard', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Schools', href: '/admin/schools' },
];

type AdminHeadProps = {
  session: Session | null;
};

const TYPE_HEADINGS: Record<string, string> = {
  b2c: 'B2C Users',
  schoolusers: 'School Users',
  admin: 'Admin Users',
};

const AdminHead: React.FC<AdminHeadProps> = ({ session }) => {
  const { openDrawer } = useNavbar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get('type') ?? null;
  const currentNavItem = adminNavItems.find((item) => pathname === item.href);
  const heading = (() => {
    if (pathname === '/admin/users' && typeParam && TYPE_HEADINGS[typeParam]) {
      return TYPE_HEADINGS[typeParam];
    }
    if (currentNavItem) return currentNavItem.label;
    if (pathname?.startsWith('/admin/users/')) return 'User Details';
    return 'Admin';
  })();

  const getUserInitials = (name: string): string => {
    if (!name || name.trim() === '') return 'A';
    const parts = name.trim().split(' ').filter((p) => p.length > 0);
    if (parts.length === 0) return 'A';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const displayName = session?.user?.name || session?.user?.email || '';

  return (
    <header className="flex h-12 items-center justify-between border-b border-neutral-200 px-4">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open menu"
          className="cursor-pointer rounded-md p-1 transition hover:bg-neutral-100 lg:hidden"
          onClick={openDrawer}
        >
          <FiIcon name="menu-burger" className="block h-5 w-5 text-neutral-700" />
        </button>
        <Heading level={3} className="font-extrabold">
          {heading}
        </Heading>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex cursor-pointer items-center gap-2 rounded-lg p-1 outline-none transition-colors hover:bg-neutral-100 focus:ring-2 focus:ring-blue-500/20">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
                <Label size="sm">{getUserInitials(displayName)}</Label>
              </div>
              <FiIcon
                name="angle-small-down"
                className="block h-4 w-4 text-neutral-800"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-48" sideOffset={8} align="end">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
                <Label size="sm">{getUserInitials(displayName)}</Label>
              </div>
              <div className="flex flex-col">
                <Label size="md" className="font-semibold text-neutral-900">
                  {displayName}
                </Label>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Back to App</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/change-password">Change Password</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-red-600 focus:text-red-600">
              <Link href="/logout">Log Out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminHead;
