'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Icons } from '../icons';
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '../../_constants/navigation';
import { useShellStore } from '../../_hooks/use-shell-store';
import { useTheme } from '../../_hooks/use-theme';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { toggleMobileNav, isOnline, isCheckingConnectivity, checkConnectivity } =
    useShellStore();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    // Auto-check connectivity against server endpoint upon client mount
    checkConnectivity();
  }, [checkConnectivity]);

  const getPageTitle = () => {
    const allItems = [...MAIN_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];
    const match = allItems.find((item) =>
      item.href === '/dashboard'
        ? pathname === '/dashboard' || pathname === '/'
        : pathname.startsWith(item.href)
    );
    return match ? match.label : 'Ficco';
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileNav}
          className="md:hidden p-2.5 -ml-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 dark:active:bg-zinc-700 focus:outline-none transition-colors touch-manipulation cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Icons.menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg text-slate-900 dark:text-white">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right: Offline/Online Status Indicator (Clickable to Re-probe) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => checkConnectivity()}
          disabled={isCheckingConnectivity}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            !mounted
              ? 'bg-slate-100 text-slate-500 border border-slate-200'
              : isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40'
          }`}
          title="Click to check connection status"
        >
          {isCheckingConnectivity ? (
            <span className="inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin mr-0.5" />
          ) : isOnline ? (
            <Icons.wifi size={14} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Icons.wifiOff size={14} className="text-amber-600 dark:text-amber-400" />
          )}

          <span>
            {isCheckingConnectivity
              ? 'Checking...'
              : isOnline
              ? 'Online'
              : 'Offline Mode'}
          </span>
        </button>
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
          aria-label="Toggle theme mode"
        >
          {isDark ? (
            <Icons.sun size={18} className="text-amber-400" />
          ) : (
            <Icons.moon size={18} className="text-slate-600 dark:text-zinc-300" />
          )}
        </button>
      </div>
    </header>
  );
};
