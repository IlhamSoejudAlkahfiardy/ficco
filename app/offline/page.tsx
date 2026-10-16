'use client';

import React from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-zinc-100">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl p-6 sm:p-8 text-center space-y-6">
        {/* Offline Badge Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.166a1 1 0 111.414 1.414M3 3l18 18"
            />
          </svg>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
            Koneksi Internet Terputus
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mode Offline Ficco
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            Perangkat Anda saat ini sedang tidak terhubung ke jaringan internet.
            Namun jangan khawatir, karena Ficco dirancang secara <strong>Local-First</strong>,
            seluruh data faktur, pengeluaran, dan pelanggan Anda tetap aman tersimpan di IndexedDB perangkat ini.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-4 text-left border border-slate-100 dark:border-zinc-800 space-y-2 text-xs text-slate-600 dark:text-zinc-300">
          <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-zinc-200">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Semua transaksi tetap bisa dibuat dan disimpan secara lokal.</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-zinc-200">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Laporan laba rugi dan ringkasan keuangan tetap dapat diakses.</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-zinc-200">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Data akan tetap utuh tanpa risiko terhapus atau hilang.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            Buka Dashboard Lokal
          </Link>
          <button
            onClick={handleReload}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-sm bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    </div>
  );
}
