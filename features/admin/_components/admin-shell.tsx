'use client';

import React from 'react';
import { AdminHeader } from './admin-header';

export interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      <AdminHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-slate-800/80 bg-slate-950/40 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Ficco Invoice & Expense Management. Protected Administrative Zone.</p>
          <p className="text-[11px] font-mono text-slate-600">Local-First Zero-Knowledge Architecture</p>
        </div>
      </footer>
    </div>
  );
}
