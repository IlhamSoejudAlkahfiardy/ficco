'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../icons';
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '../../_constants/navigation';
import { useShellStore } from '../../_hooks/use-shell-store';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useShellStore();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300 ease-in-out select-none z-30 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
            F
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight truncate leading-tight">
                Ficco
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                Invoice & Expense
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          {isSidebarCollapsed ? (
            <Icons.chevronRight size={18} />
          ) : (
            <Icons.chevronLeft size={18} />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!isSidebarCollapsed && (
          <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Menu
          </p>
        )}
        {MAIN_NAV_ITEMS.map((item) => {
          const active = isLinkActive(item.href);
          const Icon = Icons[item.iconName];

          return (
            <Link
              key={item.key}
              href={item.href}
              title={isSidebarCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}>
                <Icon size={20} />
              </span>
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Management Divider */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800 space-y-1">
          {!isSidebarCollapsed && (
            <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              System
            </p>
          )}
          {SECONDARY_NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            const Icon = Icons[item.iconName];

            return (
              <Link
                key={item.key}
                href={item.href}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <span className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}>
                  <Icon size={20} />
                </span>
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer / Local-First Status Indicator */}
      <div className="p-3 border-t border-slate-100 dark:border-zinc-800">
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500 dark:text-zinc-400 ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}
          title="Ficco runs locally on your browser using IndexedDB"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-slate-700 dark:text-zinc-300">Local-First</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">IndexedDB Storage</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
