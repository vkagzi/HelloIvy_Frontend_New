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

type Headings = {
  heading: string;
  href: string;
};

const navItems: Headings[] = [
  { heading: 'Dashboard', href: '/dashboard' },
  { heading: 'Career Discovery', href: '/career' },
  {
    heading: 'Degree Selector',
    href: '/degree',
  },
  { heading: 'College Selector', href: '/college' },
  {
    heading: 'Essay Brainstorm',
    href: '/essay-brainstorm/intro',
  },
  {
    heading: 'Essay Evaluator',
    href: '/essay-evaluator',
  },
  {
    heading: 'Recommendations',
    href: '/recommendations',
  },
  { heading: 'Resources', href: '/resources' },
  { heading: 'Resume Builder', href: '/resume' },
  {
    heading: 'Interview Preparation',
    href: '/interview-prep',
  },
  { heading: 'Application', href: '/application' },
  { heading: 'Starred', href: '/starred' },
  { heading: 'Personal Details', href: '/profile/personal/edit' },
];

type AppHeadProps = {
  session: Session | null;
};

const AppHead: React.FC<AppHeadProps> = ({ session }) => {
  const userAuth = useUserAuth(session);

  const pathname = usePathname();
  const currentNavItem = navItems.find((item) => pathname === item.href);
  const heading = currentNavItem ? currentNavItem.heading : 'Dashboard';

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
      <header className="flex h-12 items-center justify-between border-b border-neutral-200 px-4 pb-3">
        <div>
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
              <DropdownMenuItem asChild>
                <Link href="/profile/personal/edit">My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>FAQs</DropdownMenuItem>
              <DropdownMenuItem>Legal</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => signOut()}
              >
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
};

export default AppHead;
