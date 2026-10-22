'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLicenseStore } from '@/features/license';
import { Icons } from '@/shared/_components/icons';

export default function HomePage() {
  const router = useRouter();
  const isHydrated = useLicenseStore((state) => state.isHydrated);
  const isActivated = useLicenseStore((state) => state.isActivated);

  useEffect(() => {
    if (!isHydrated) return;

    if (isActivated) {
      router.replace('/dashboard');
    } else {
      router.replace('/license');
    }
  }, [isHydrated, isActivated, router]);

  return (
    <div
      data-testid="home-page-router"
      className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20 animate-pulse">
          <Icons.shield size={24} />
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          Memuat aplikasi Ficco...
        </p>
      </div>
    </div>
  );
}
