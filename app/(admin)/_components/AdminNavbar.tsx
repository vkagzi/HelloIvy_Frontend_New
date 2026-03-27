'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiIcon } from '@/app/_components/Icons';
import imgLogoApp from '@/assets/images/logo-app.png';
import imgIcon from '@/assets/images/icon.png';
import Image from 'next/image';
import { Label } from '@/app/_components/Typography';
import { useNavbar } from '@/app/_contexts/NavbarContext';
import { useSession } from 'next-auth/react';

const adminNavItems: { label: string; icon: string; href: string; roles?: string[] }[] = [
  { label: 'Dashboard', icon: 'sr-apps', href: '/admin', roles: ['superadmin', 'operationadmin'] },
  { label: 'Users', icon: 'users', href: '/admin/users', roles: ['superadmin', 'operationadmin'] },
  { label: 'Schools', icon: 'building', href: '/admin/schools', roles: ['superadmin', 'operationadmin'] },
  { label: 'School Dashboard', icon: 'sr-apps', href: '/admin/school-dashboard', roles: ['schooladmin'] },
  { label: 'Students', icon: 'users', href: '/admin/school-students', roles: ['schooladmin'] },
];

const AdminNavbar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const pathname = usePathname();
  const { isDrawerOpen, closeDrawer } = useNavbar();
  const { data: session } = useSession();
  const userRole = session?.user?.role ?? 'student';

  const visibleNavItems = adminNavItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

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
      <div className="flex h-12 items-center justify-between pb-3">
        <Link href="/admin">
          <Image
            src={collapsed ? imgIcon : imgLogoApp}
            alt="HelloIvy Logo"
            className="h-6 w-auto transition-all duration-200"
          />
        </Link>
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden overflow-clip rounded-full bg-neutral-100 p-1 leading-none transition hover:bg-neutral-300 lg:block"
          onClick={() => setCollapsed((v) => !v)}
        >
          <FiIcon
            name={
              collapsed
                ? 'angle-double-small-right'
                : 'angle-double-small-left'
            }
            className="block h-4 w-4"
          />
        </button>
        <button
          aria-label="Close menu"
          className="overflow-clip rounded-full bg-neutral-100 p-1 leading-none transition hover:bg-neutral-300 lg:hidden"
          onClick={closeDrawer}
        >
          <FiIcon name="cross-small" className="block h-4 w-4" />
        </button>
      </div>

      {/* Admin badge */}
      <div className={`mb-2 ${collapsed ? 'lg:hidden' : ''}`}>
        <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
          Admin
        </span>
      </div>

      <ul className="mt-2 flex-1">
        {visibleNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="h-10">
              <Link
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all ${
                  active
                    ? 'bg-action-gradient-800 font-semibold text-white'
                    : 'hover:bg-purple-50'
                } ${collapsed ? 'lg:w-11' : ''}`}
              >
                <FiIcon
                  name={item.icon}
                  className={
                    active
                      ? 'h-5 w-5 text-lg leading-none text-white'
                      : 'from-action-gradient-800-left to-action-gradient-800-right h-5 w-5 bg-gradient-to-r bg-clip-text text-lg leading-none text-transparent'
                  }
                />
                <Label
                  size="sm"
                  className={`overflow-clip text-nowrap text-ellipsis ${collapsed ? 'lg:hidden' : ''}`}
                >
                  {item.label}
                </Label>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Back to App link at bottom */}
      <div className={`border-t border-neutral-200 pt-3 pb-4 ${collapsed ? 'lg:hidden' : ''}`}>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-500 transition hover:bg-purple-50 hover:text-neutral-700"
        >
          <FiIcon name="arrow-small-left" className="h-4 w-4" />
          <span>Back to App</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className={`relative hidden min-h-screen flex-col bg-white px-2 transition-all duration-200 lg:flex ${
          collapsed ? 'w-14' : 'w-50 border-r border-neutral-200'
        }`}
      >
        {sidebarContent}
      </nav>

      {/* Mobile/Tablet overlay drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <nav className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white px-2 shadow-xl">
            {sidebarContent}
          </nav>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;
