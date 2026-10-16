'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePwaStore } from '@/infrastructure/pwa';
import { PwaInstallButton } from '@/shared';

export const PwaSettingsView: React.FC = () => {
  const {
    isSupported,
    isStandalone,
    canInstall,
    isSwRegistered,
    hasUpdate,
    updateServiceWorker,
  } = usePwaStore();

  const [cacheClearStatus, setCacheClearStatus] = useState<string | null>(null);

  const handleClearCache = async () => {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      setCacheClearStatus('Cache aplikasi berhasil dibersihkan! Memuat ulang dalam 2 detik...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      setCacheClearStatus('Gagal membersihkan cache.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-4 -mr-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-xs border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Progressive Web App (PWA) & Offline Shell</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Ficco Bekerja Sepenuhnya Tanpa Internet
          </h2>
          <p className="text-sm text-blue-100 leading-relaxed">
            Ficco dirancang dengan arsitektur <strong>Local-First</strong>.
            Aplikasi ini dapat diinstal di komputer, tablet, maupun smartphone Anda
            seperti aplikasi native dan dapat dibuka kapan saja meskipun Anda sedang offline.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <PwaInstallButton />
            <Link
              href="/offline"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20 transition-colors"
            >
              Uji Halaman Offline
            </Link>
          </div>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Display Mode */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-1">
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Mode Tampilan</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {isStandalone ? 'PWA Standalone' : 'Browser Web Tab'}
          </p>
          <span
            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              isStandalone
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
            }`}
          >
            {isStandalone ? 'Terinstal di Perangkat' : 'Dapat Diinstal'}
          </span>
        </div>

        {/* Card 2: Service Worker */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-1">
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Service Worker</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {isSwRegistered ? 'Aktif & Berjalan' : isSupported ? 'Didukung Browser' : 'Tidak Didukung'}
          </p>
          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            Cache Shell v1.0.0
          </span>
        </div>

        {/* Card 3: Storage Type */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-1">
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Penyimpanan Bisnis</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">IndexedDB (Dexie)</p>
          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            Zero-Knowledge Local
          </span>
        </div>

        {/* Card 4: Status Install */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-1">
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Status Pemasangan</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {isStandalone ? 'Sudah Terpasang' : canInstall ? 'Siap Dipasang' : 'Tersedia di Browser'}
          </p>
          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            {canInstall ? 'Prompt Tersedia' : 'Standar PWA'}
          </span>
        </div>
      </div>

      {/* Notifications / Updates */}
      {hasUpdate && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              Pembaruan Aplikasi Tersedia
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Versi terbaru service worker telah siap. Muat ulang untuk menerapkan versi terbaru.
            </p>
          </div>
          <button
            onClick={updateServiceWorker}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Terapkan Pembaruan
          </button>
        </div>
      )}

      {cacheClearStatus && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          {cacheClearStatus}
        </div>
      )}

      {/* Installation Guide & Diagnostics Accordion / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Instructions Guide */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Panduan Memasang Ficco di Berbagai Perangkat
          </h3>
          <ul className="text-xs text-slate-600 dark:text-zinc-400 space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-bold text-slate-900 dark:text-white min-w-4">1.</span>
              <span>
                <strong>Komputer (Chrome / Edge / Brave):</strong> Klik ikon <em>Install</em> di sisi kanan address bar peramban Anda, atau tekan tombol <em>Pasang Aplikasi</em> di atas.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-slate-900 dark:text-white min-w-4">2.</span>
              <span>
                <strong>iPhone & iPad (Safari):</strong> Buka menu <em>Bagikan (Share)</em> di bagian bawah Safari, lalu pilih <strong>&quot;Tambahkan ke Layar Utama (Add to Home Screen)&quot;</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-slate-900 dark:text-white min-w-4">3.</span>
              <span>
                <strong>Android (Chrome):</strong> Tekan menu tiga titik di pojok kanan atas, lalu pilih <strong>&quot;Pasang Aplikasi (Install app)&quot;</strong> atau <em>Tambahkan ke Layar Utama</em>.
              </span>
            </li>
          </ul>
        </div>

        {/* Maintenance & Diagnostics */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            Pemeliharaan Cache & Diagnostik
          </h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Jika tampilan antarmuka tidak terbarui setelah update, Anda dapat membersihkan cache browser secara aman tanpa menghapus data faktur di IndexedDB.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={handleClearCache}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors"
            >
              Bersihkan Cache Aplikasi
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
