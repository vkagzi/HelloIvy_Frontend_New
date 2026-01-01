'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiIcon } from '@/app/_components/Icons';
import imgLogoApp from '@/assets/images/logo-app.png';
import imgIcon from '@/assets/images/icon.png';
import Image from 'next/image';
import { Label } from '@/app/_components/Typography';

type NavItem = {
  label: string;
  icon: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: 'My Dashboard', icon: 'sr-apps', href: '/dashboard' },
  { label: 'Career Discovery', icon: 'briefcase', href: '/career' },
  { label: 'College Selector', icon: 'school', href: '/college' },
  {
    label: 'Essay Brainstorm',
    icon: 'brain-circuit',
    href: '/essay-brainstorm/intro',
  },
  {
    label: 'Essay Evaluator',
    icon: 'list-check',
    href: '/essay-evaluator',
  },
  {
    label: 'Interview Preparation',
    icon: 'videoconference',
    href: '/interview-prep',
  },
  {
    label: 'Degree Selector',
    icon: 'graduation-cap',
    href: '/degree',
  },
  {
    label: 'Recommendations',
    icon: 'diploma',
    href: '/recommendations',
  },
  { label: 'Resources', icon: 'resources', href: '/resources' },
  { label: 'Resume Builder', icon: 'CV', href: '/resume' },
  { label: 'Application', icon: 'form', href: '/application' },
  { label: 'Starred', icon: 'star', href: '/starred' },
];

const Navbar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const pathname = usePathname();

  return (
    <nav
      className={`relative flex flex-col bg-white transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-50 border-r border-neutral-200'
      } my-3 min-h-screen px-3`}
    >
      <div className="flex h-12 items-center justify-between pb-3">
        <Image
          src={collapsed ? imgIcon : imgLogoApp}
          alt="HelloIvy Logo"
          className={`h-6 w-auto transition-all duration-200`}
        />
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="overflow-clip rounded-full bg-neutral-100 p-1 leading-none transition hover:bg-neutral-300"
          onClick={() => setCollapsed((v) => !v)}
        >
          <FiIcon
            name={
              collapsed ? 'angle-double-small-right' : 'angle-double-small-left'
            }
            className="block h-4 w-4"
          />
        </button>
      </div>
      <ul className="mt-2 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="h-10">
              <Link
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all ${
                  active
                    ? 'bg-action-gradient-800 font-semibold text-white'
                    : 'hover:bg-purple-50'
                } ${collapsed ? 'w-11' : ''}`}
              >
                <FiIcon
                  name={item.icon}
                  className={
                    active
                      ? 'h-5 w-5 text-lg leading-none text-white'
                      : 'from-action-gradient-800-left to-action-gradient-800-right h-5 w-5 bg-gradient-to-r bg-clip-text text-lg leading-none text-transparent'
                  }
                />

                {!collapsed && (
                  <Label
                    size="sm"
                    className={`overflow-clip text-nowrap text-ellipsis`}
                  >
                    {item.label}
                  </Label>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navbar;
