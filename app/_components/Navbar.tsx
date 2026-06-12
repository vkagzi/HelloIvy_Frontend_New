'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiIcon } from '@/app/_components/Icons';
import { IvyWithoutBGLottie } from '@/app/_components/LottieAnimation';
import { Label } from '@/app/_components/Typography';
import { sidebarNavItems } from '@/app/_constants/navItems';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import { useNavbar } from '@/app/_contexts/NavbarContext';
import { useModuleAccess } from '@/app/_contexts/ModuleAccessContext';
import { useSession } from 'next-auth/react';

/** Map sidebar href → backend module_name for lock/unlock display */
const HREF_TO_MODULE: Record<string, string> = {
  '/domain-discovery': 'domain_discovery',
  '/career-discovery': 'career_discovery',
  '/college-selector': 'college_selector',
};

const Navbar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();
  const { isDrawerOpen, closeDrawer } = useNavbar();
  const { data: session, status } = useSession();
  const { hasAccess, loading: modulesLoading } = useModuleAccess();
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

  // Append dynamic custom modules from backend (e.g., modules created via admin)
  const { modules: dynamicModules = [] } = useModuleChoices();

  const sidebarWithCustom = useMemo(() => {
    const desiredOrder = [
      '/dashboard',
      '/domain-discovery',
      '/career-discovery',
      '/college-selector',
      '/counselor-connect',
      '/pay-as-student',
    ];

    const sortNavItems = (items: (typeof sidebarNavItems[0])[]) => {
      return [...items].sort((a, b) => {
        const idxA = desiredOrder.indexOf(a.href);
        const idxB = desiredOrder.indexOf(b.href);
        if (idxA !== -1 && idxB !== -1) {
          return idxA - idxB;
        }
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    };

    if (!dynamicModules || dynamicModules.length === 0) {
      return sortNavItems(filteredNavItems).filter(
        (item) => !item.href.includes('resume') && !item.label.toLowerCase().includes('resume')
      );
    }

    // Map backend modules to NavItem shape and avoid duplicates
    const extra: (typeof sidebarNavItems[0])[] = [];
    const activeModuleValues = new Set(dynamicModules.map(m => m.value));

    // Filter out static items that are not active
    const activeStaticItems = filteredNavItems.filter(item => {
      const moduleName = HREF_TO_MODULE[item.href];
      // If it's a tracked module, check if it's in active set. 
      // If it's NOT a tracked module (like /dashboard), keep it.
      if (moduleName && !activeModuleValues.has(moduleName)) {
        return false;
      }
      return true;
    });

    for (const m of dynamicModules) {
      // Map database/backend underscores to frontend url hyphens
      let href = `/${m.value}`;
      if (m.value === 'college_selector') href = '/college-selector';
      if (m.value === 'career_discovery') href = '/career-discovery';
      if (m.value === 'domain_discovery') href = '/domain-discovery';

      const exists = sidebarNavItems.some(
        (s) => s.href === href || s.label.trim() === m.label.trim()
      );
      if (!exists) {
        extra.push({ label: m.label, icon: m.icon || 'briefcase', href });
      }
    }

    // Insert extras after the college selector if present, otherwise append
    const insertAfter = '/college-selector';
    const idx = activeStaticItems.findIndex((i) => i.href === insertAfter);
    let combined: (typeof sidebarNavItems[0])[];
    if (idx >= 0) {
      const copy = [...activeStaticItems];
      copy.splice(idx + 1, 0, ...extra);
      combined = copy;
    } else {
      combined = [...activeStaticItems, ...extra];
    }
    return sortNavItems(combined).filter(
      (item) => !item.href.includes('resume') && !item.label.toLowerCase().includes('resume')
    );
  }, [dynamicModules, filteredNavItems]);

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
        {sidebarWithCustom.map((item) => {
          const isExpanded = expandedItem === item.href;
          const hasChildren = item.children && item.children.length > 0;
          const active = pathname === item.href || (hasChildren && item.children?.some(c => pathname === c.href));

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

                {!collapsed && (
                  <>
                    <Label
                      size="sm"
                      className="flex-1 overflow-hidden text-nowrap text-ellipsis"
                    >
                      {item.label}
                    </Label>
                    {(() => {
                      const moduleName = HREF_TO_MODULE[item.href];
                      if (!moduleName || modulesLoading) return null;
                      
                      // Custom logic: College Selector is locked for non-admins,
                      // others are unlocked for everyone as previously requested.
                      const isCollegeSelector = item.href === '/college-selector';
                      const unlocked = isCollegeSelector ? isAdmin : true;
                      
                      const iconColor = unlocked ? '#15803d' : '#4b5563'; // Dark Green and Dark Grey
                      
                      return (
                        <span
                          title={unlocked ? 'Module unlocked' : 'Module locked'}
                          className="ml-auto flex-shrink-0"
                        >
                          {unlocked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={iconColor} stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 9.9-1" fill="none" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={iconColor} stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" />
                            </svg>
                          )}
                        </span>
                      );
                    })()}
                  </>
                )}
                {hasChildren && !collapsed && (
                  <FiIcon
                    name={isExpanded ? 'angle-small-up' : 'angle-small-down'}
                    className={`block h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-neutral-400'}`}
                  />
                )}
              </Link>

              {hasChildren && isExpanded && !collapsed && (
                <ul className="ml-8 mt-1 border-l border-neutral-200 pl-2 space-y-1">
                  {item.children!.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={`flex items-center rounded-md px-3 py-1.5 text-xs transition-all ${
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
          collapsed ? 'w-16' : 'w-72 border-r border-neutral-200'
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

          <nav className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white px-2 shadow-xl">
            {sidebarContent}
          </nav>
        </div>
      )}
    </>
  );
};

export default Navbar;