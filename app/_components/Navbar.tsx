'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiIcon } from '@/app/_components/Icons';
import { IvyWithoutBGLottie } from '@/app/_components/LottieAnimation';
import { Label } from '@/app/_components/Typography';
import { sidebarNavItems } from '@/app/_constants/navItems';
import { useNavbar } from '@/app/_contexts/NavbarContext';
import { useSession } from 'next-auth/react';

const Navbar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const pathname = usePathname();
  const { isDrawerOpen, closeDrawer } = useNavbar();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role ?? 'student';
  const isAdmin = ['superadmin', 'operationadmin'].includes(userRole);
  const isSchoolAdmin = ['schooladmin', 'schoolopsadmin'].includes(userRole);
  const isB2BStudent = userRole === 'student' && !!session?.user?.school_id;

  const filteredNavItems = useMemo(() => {
    return sidebarNavItems
      .map((item) =>
        isSchoolAdmin && item.href === '/subscription'
          ? { ...item, href: '/school/subscription' }
          : item
      );
  }, [isSchoolAdmin]);

  // Close drawer on route change
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const sidebarContent = (
    <>
      {/* HEADER SECTION */}
      <div
        className={`flex h-12 items-center pb-3 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2 select-none">
          <IvyWithoutBGLottie className="h-9 w-9 flex-shrink-0" />
          {!collapsed && (
            <span className="font-work-sans text-2xl font-medium tracking-tight text-neutral-800">
              hello<span className="font-bold text-neutral-900">ivy</span>
            </span>
          )}
        </Link>

        {/* Collapse toggle button */}
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden rounded-full bg-neutral-100 p-1 transition hover:bg-neutral-300 lg:block"
          onClick={() => setCollapsed((v) => !v)}
        >
          <FiIcon
            name={
              collapsed
                ? 'angle-double-small-right'
                : 'angle-double-small-left'
            }
            className="h-4 w-4"
          />
        </button>

        {/* Close button for mobile drawer */}
        <button
          aria-label="Close menu"
          className="rounded-full bg-neutral-100 p-1 transition hover:bg-neutral-300 lg:hidden"
          onClick={closeDrawer}
        >
          <FiIcon name="cross-small" className="h-4 w-4" />
        </button>
      </div>

      {/* NAV ITEMS */}
      <ul className="mt-2 flex-1">
        {filteredNavItems.map((item) => {
          const active = pathname === item.href;

          return (
            <li key={item.href} className="h-10">
              <Link
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all ${
                  active
                    ? 'bg-action-gradient-800 font-semibold text-white'
                    : 'hover:bg-purple-50'
                } ${collapsed ? 'lg:w-11 justify-center' : ''}`}
              >
                <FiIcon
                  name={item.icon}
                  className={`leading-none ${
                    collapsed ? 'h-4 w-4' : 'h-6 w-6'
                  } ${
                    active
                      ? 'text-white'
                      : 'from-action-gradient-800-left to-action-gradient-800-right bg-linear-to-r bg-clip-text text-transparent'
                  }`}
                />

                {/* Hide labels when collapsed */}
                {!collapsed && (
                  <Label
                    size="sm"
                    className="overflow-hidden text-nowrap text-ellipsis"
                  >
                    {item.label}
                  </Label>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Admin link at bottom for admins */}
      {isAdmin && (
        <div className={`border-t border-neutral-200 pt-3 pb-4 ${collapsed ? 'lg:hidden' : ''}`}>
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-500 transition hover:bg-purple-50 hover:text-neutral-700"
          >
            <FiIcon name="settings" className="h-4 w-4" />
            <span>Admin Panel</span>
          </Link>
        </div>
      )}

      {/* School Admin link at bottom for school admins */}
      {isSchoolAdmin && (
        <div className={`border-t border-neutral-200 pt-3 pb-4 ${collapsed ? 'lg:hidden' : ''}`}>
          <Link
            href="/school/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-500 transition hover:bg-purple-50 hover:text-neutral-700"
          >
            <FiIcon name="arrow-small-left" className="h-4 w-4" />
            <span>Back to School Admin</span>
          </Link>
        </div>
      )}
    </>
  );

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className={`relative hidden min-h-screen flex-col bg-white px-2 transition-all duration-200 lg:flex ${
          collapsed ? 'w-16' : 'w-60 border-r border-neutral-200'
        }`}
      >
        {sidebarContent}
      </nav>

      {/* Mobile drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeDrawer}
          />

          <nav className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white px-2 shadow-xl">
            {sidebarContent}
          </nav>
        </div>
      )}
    </>
  );
};

export default Navbar;