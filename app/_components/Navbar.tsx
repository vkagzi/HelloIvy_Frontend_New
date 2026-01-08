'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiIcon } from '@/app/_components/Icons';
import imgLogoApp from '@/assets/images/logo-app.png';
import imgIcon from '@/assets/images/icon.png';
import Image from 'next/image';
import { Label } from '@/app/_components/Typography';
import { sidebarNavItems } from '@/app/_constants/navItems';

const Navbar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const pathname = usePathname();

  return (
    <nav
      className={`relative flex flex-col bg-white transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-50 border-r border-neutral-200'
      }  min-h-screen px-2`}
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
        {sidebarNavItems.map((item) => {
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
