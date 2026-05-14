'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FiIcon } from '@/app/_components/Icons';
import imgLogoApp from '@/assets/images/logo-app.png';
import imgIcon from '@/assets/images/icon.png';
import Image from 'next/image';
import { Label } from '@/app/_components/Typography';
import { useNavbar } from '@/app/_contexts/NavbarContext';

interface NavItem {
  label: string;
  icon: string;
  href: string;
  children?: { label: string; href: string }[];
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', icon: 'sr-apps', href: '/admin' },
  {
    label: 'Users',
    icon: 'users',
    href: '/admin/users',
    children: [
      { label: 'All Users', href: '/admin/users' },
      { label: 'B2C Users', href: '/admin/users?type=b2c' },
      { label: 'Admin Users', href: '/admin/users?type=admin' },
    ],
  },
  { label: 'Schools', icon: 'building', href: '/admin/schools' },
  {
    label: 'Payments',
    icon: 'credit-card',
    href: '/admin/payments/b2c',
    children: [
      { label: 'B2C Payments', href: '/admin/payments/b2c' },
      { label: 'School Payments', href: '/admin/payments/schools' },
    ],
  },
  { label: 'Pricing', icon: 'badge-dollar', href: '/admin/pricing' },
];

const AdminNavbar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isDrawerOpen, closeDrawer } = useNavbar();
  const visibleNavItems = adminNavItems;

  // Auto-expand parent if a child route is active
  useEffect(() => {
    const typeParam = searchParams?.get('type') ?? null;
    if (pathname === '/admin/users' && typeParam) {
      if (typeParam === 'schoolusers') {
        setExpandedItem('/admin/schools');
      } else {
        setExpandedItem('/admin/users');
      }
    } else if (pathname?.startsWith('/admin/schools')) {
      setExpandedItem('/admin/schools');
    } else if (pathname?.startsWith('/admin/payments')) {
      setExpandedItem('/admin/payments/b2c');
    }
  }, [pathname, searchParams]);

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
          className="hidden cursor-pointer overflow-clip rounded-full bg-neutral-100 p-1 leading-none transition hover:bg-neutral-300 lg:block"
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
          className="cursor-pointer overflow-clip rounded-full bg-neutral-100 p-1 leading-none transition hover:bg-neutral-300 lg:hidden"
          onClick={closeDrawer}
        >
          <FiIcon name="cross-small" className="block h-4 w-4" />
        </button>
      </div>

      {/* Admin badge */}
      <div className={`mb-3 ${collapsed ? 'lg:hidden' : ''}`}>
        <div className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-center text-sm font-bold tracking-wide text-purple-900">
          Admin
        </div>
      </div>

      <ul className="mt-2 flex-1">
        {visibleNavItems.map((item) => {
          const currentType = searchParams?.get('type') ?? null;
          const isExpanded = expandedItem === item.href;
          const hasChildren = item.children && item.children.length > 0;
          const hasActiveChild = !!item.children?.some((child) => {
            const childUrl = new URL(child.href, 'http://x');
            const childType = childUrl.searchParams.get('type');
            return pathname === childUrl.pathname && currentType === childType;
          });
          const active = (pathname === item.href && !currentType) || hasActiveChild;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={hasChildren ? (e) => {
                  e.preventDefault();
                  setExpandedItem(isExpanded ? null : item.href);
                } : undefined}
                className={`flex h-10 items-center gap-2 rounded-md px-3 py-2 transition-all ${
                  active
                    ? 'bg-action-gradient-800 font-semibold text-white'
                    : 'hover:bg-purple-50'
                } ${collapsed ? 'lg:w-11' : ''}`}
              >
                <FiIcon
                  name={item.icon}
                  className={
                    active
                      ? 'h-5 w-5 shrink-0 text-lg leading-none text-white'
                      : 'from-action-gradient-800-left to-action-gradient-800-right h-5 w-5 shrink-0 bg-linear-to-r bg-clip-text text-lg leading-none text-transparent'
                  }
                />
                <Label
                  size="sm"
                  className={`flex-1 overflow-clip text-nowrap text-ellipsis ${collapsed ? 'lg:hidden' : ''}`}
                >
                  {item.label}
                </Label>
                {hasChildren && !collapsed && (
                  <FiIcon
                    name={isExpanded ? 'angle-small-up' : 'angle-small-down'}
                    className={`block h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-neutral-400'}`}
                  />
                )}
              </Link>
              {hasChildren && isExpanded && !collapsed && (
                <ul className="ml-6 border-l border-neutral-200 pl-2">
                  {item.children!.map((child) => {
                    const childUrl = new URL(child.href, 'http://x');
                    const childType = childUrl.searchParams.get('type');
                    const childActive =
                      pathname === childUrl.pathname && currentType === childType;
                    return (
                      <li key={child.href} className="h-8">
                        <Link
                          href={child.href}
                          className={`flex items-center rounded-md px-3 py-1.5 text-sm transition-all ${
                            childActive
                              ? 'font-semibold text-purple-700 bg-purple-50'
                              : 'text-neutral-600 hover:bg-purple-50 hover:text-neutral-800'
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
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
