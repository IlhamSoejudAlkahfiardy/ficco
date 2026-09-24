'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../icons';
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '../../_constants/navigation';
import { useShellStore } from '../../_hooks/use-shell-store';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const { isMobileNavOpen, closeMobileNav } = useShellStore();

  // Close ONLY when route genuinely changes, not on mount
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      closeMobileNav();
      prevPathname.current = pathname;
    }
  }, [pathname, closeMobileNav]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileNavOpen) {
        closeMobileNav();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen, closeMobileNav]);

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
        isMobileNavOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
      aria-hidden={!isMobileNavOpen}
    >
      {/* Backdrop */}
      <div
        onClick={closeMobileNav}
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isMobileNavOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white dark:bg-zinc-900 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-zinc-800">
          <Link
            href="/dashboard"
            onClick={closeMobileNav}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              F
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Ficco
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Invoice & Expense
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={closeMobileNav}
            aria-label="Close menu"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Icons.close size={20} />
          </button>
        </div>

        {/* Links List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            const Icon = Icons[item.iconName];

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={closeMobileNav}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}>
                  <Icon size={20} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800 space-y-1">
            <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              System
            </p>
            {SECONDARY_NAV_ITEMS.map((item) => {
              const active = isLinkActive(item.href);
              const Icon = Icons[item.iconName];

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={closeMobileNav}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}>
                    <Icon size={20} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Local-first Badge in Drawer Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
            <span>Local-First (Zero Cloud Storage)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
