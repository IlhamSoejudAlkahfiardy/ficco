'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../icons';
import { useShellStore } from '../../_hooks/use-shell-store';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { toggleMobileNav } = useShellStore();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Icons.dashboard },
    { label: 'Invoices', href: '/invoices', icon: Icons.invoices },
    { label: 'Expenses', href: '/expenses', icon: Icons.expenses },
    { label: 'Reports', href: '/reports', icon: Icons.reports },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 z-30 flex items-center justify-around px-2 select-none"
    >
      {navItems.map((item) => {
        const active = isLinkActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              active
                ? 'text-blue-600 dark:text-blue-400 font-medium'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Icon size={20} className={active ? 'scale-110 transition-transform' : ''} />
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
          </Link>
        );
      })}

      {/* Menu / More Button */}
      <button
        type="button"
        onClick={toggleMobileNav}
        aria-label="More navigation options"
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors touch-manipulation cursor-pointer"
      >
        <Icons.menu size={20} />
        <span className="text-[10px] mt-1 tracking-tight">More</span>
      </button>
    </nav>
  );
};
