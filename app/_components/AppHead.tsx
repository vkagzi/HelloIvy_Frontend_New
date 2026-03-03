'use client';
import React, { useEffect } from 'react';
import { Heading, Label } from '@/app/_components/Typography';
import { FiIcon } from '@/app/_components/Icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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

type AppHeadProps = {
  session: Session | null;
};

const AppHead: React.FC<AppHeadProps> = ({ session }) => {
  const userAuth = useUserAuth(session);
  const { openDrawer } = useNavbar();

  const pathname = usePathname();
  const currentNavItem = navItems.find((item) => pathname === item.href);
  const heading = currentNavItem ? currentNavItem.label : 'Dashboard';

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

  // Debug logging to track user data
  useEffect(() => {
    console.log('User auth data:', userAuth.userDetails);
    console.log(
      'Calculated initials:',
      getUserInitials(userAuth.userDetails.name)
    );
  }, [userAuth.userDetails]);

  function signOut(): void {
    userAuth.logout();
    window.location.href = '/';
  }

  return (
    <>
      {pathname == '/app' && <div className="dashboard-bg"></div>}
      <header className="flex h-12 items-center justify-between border-b border-neutral-200 px-4">
        <div className="flex items-center gap-3">
          {/* Hamburger menu — visible below lg */}
          <button
            aria-label="Open menu"
            className="rounded-md p-1 transition hover:bg-neutral-100 lg:hidden"
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
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>FAQs</DropdownMenuItem>
              <DropdownMenuItem>Legal</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-red-600 focus:text-red-600">
                <Link href="/logout">Log Out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
};

export default AppHead;
