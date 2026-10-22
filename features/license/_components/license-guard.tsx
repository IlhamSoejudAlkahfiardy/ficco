'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLicenseGuard } from '../_hooks/use-license-guard';
import { Icons } from '@/shared/_components/icons';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export function LicenseGuard({ children }: LicenseGuardProps) {
  const router = useRouter();
  const { pathname, isHydrated, isActivated, isProtected, isAllowed } =
    useLicenseGuard();

  useEffect(() => {
    // Only redirect once client state has finished hydrating from localStorage
    if (isProtected && isHydrated && !isActivated) {
      const targetUrl = `/license?from=${encodeURIComponent(pathname)}`;
      router.replace(targetUrl);
    }
  }, [isProtected, isHydrated, isActivated, pathname, router]);

  // Unprotected routes (like /license, /offline) are always immediately accessible
  if (!isProtected) {
    return <>{children}</>;
  }

  // If client-side check has determined the user is NOT allowed, render the gate barrier
  if (isProtected && isHydrated && !isAllowed) {
    return (
      <div
        data-testid="license-gate-barrier"
        className="max-w-xl mx-auto my-12 p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm text-center space-y-5 animate-in fade-in duration-300"
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Icons.lock size={28} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>Aktivasi Diperlukan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Fitur Ini Memerlukan Lisensi Aktif
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
            Aplikasi Ficco beroperasi secara privat dan lokal (Local-First). Aktifkan perangkat Anda dengan kunci lisensi komersial untuk membuka akses penuh ke seluruh fitur pembukuan dan keuangan.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/license?from=${encodeURIComponent(pathname)}`}
            data-testid="gate-redirect-license-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-sm active:scale-95"
          >
            <Icons.key size={16} />
            <span>Aktivasi Perangkat Sekarang</span>
          </Link>
        </div>
      </div>
    );
  }

  // License is active or SSR phase: render application
  return <>{children}</>;
}
