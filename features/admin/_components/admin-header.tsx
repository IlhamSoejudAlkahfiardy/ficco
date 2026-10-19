'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/shared/_components/icons';
import { useAdminAuth } from '../_hooks/use-admin-auth';
import { ADMIN_OBSCURE_PATH } from '../_services/admin-auth-service';

export function AdminHeader() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAdminAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link
            href={ADMIN_OBSCURE_PATH}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Icons.shield size={20} />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
                Ficco <span className="text-blue-400 font-semibold">Admin</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1">
                License & Device Control
              </span>
            </div>
          </Link>

          {/* Obscure route badge */}
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            {ADMIN_OBSCURE_PATH}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href={ADMIN_OBSCURE_PATH}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === ADMIN_OBSCURE_PATH
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <span>Aplikasi Pengguna</span>
            <Icons.arrowUpRight size={13} />
          </Link>
        </nav>

        {/* User Info & Logout Button */}
        <div className="flex items-center gap-3">
          {/* User badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-medium font-mono">
              {user?.username || 'admin'}
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] bg-blue-500/10 text-blue-400 font-medium">
              Super Admin
            </span>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={logout}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Keluar dari sesi admin"
          >
            <Icons.logout size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
