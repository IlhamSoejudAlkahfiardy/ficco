'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icons, DatabaseIcon } from '@/shared/_components/icons';
import { useAdminAuth } from '../_hooks/use-admin-auth';
import { useAdminDashboard } from '../_hooks/use-admin-dashboard';
import { CreateLicenseModal } from './create-license-modal';
import { AdminLicenseList } from './admin-license-list';
import type { License } from '@/features/license';

export function AdminDashboardView() {
  const { user, logout } = useAdminAuth();
  const { stats, isLoading, isRefreshing, error, refresh, seedDemoData } = useAdminDashboard();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const handleLicenseCreated = (license: License) => {
    refresh();
    setListRefreshKey((prev) => prev + 1);
    setSuccessBanner(`Kunci lisensi ${license.licenseKey} berhasil dibuat dan disimpan.`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleSeed = async () => {
    await seedDemoData();
    setListRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sesi Admin Aktif
              </span>

              {stats && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  stats.isLiveSupabase
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                }`}>
                  {stats.isLiveSupabase ? 'Supabase Cloud Live' : 'Server Development Mock'}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Dasbor Manajemen Lisensi Ficco
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Pusat kendali lisensi komersial dan aktivasi perangkat. Masuk sebagai{' '}
              <span className="font-semibold text-blue-400 font-mono">
                {user?.username || 'admin'}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Step 24: Primary Add License Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              data-testid="open-create-license-modal-btn"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/30 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
            >
              <Icons.plus size={14} />
              <span>Buat Lisensi Baru</span>
            </button>

            <button
              type="button"
              onClick={() => refresh()}
              disabled={isLoading || isRefreshing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="Perbarui data statistik dari Supabase"
            >
              <Icons.loader size={14} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
              <span>{isRefreshing ? 'Memuat...' : 'Segarkan Data'}</span>
            </button>

            <Link
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Aplikasi Pengguna</span>
              <Icons.arrowUpRight size={14} />
            </Link>

            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.logout size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-fadeIn"
          data-testid="success-banner"
        >
          <div className="flex items-center gap-2.5">
            <Icons.checkCircle size={18} className="text-emerald-400 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-3">
          <Icons.alertCircle size={18} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold block">Gagal memuat statistik lisensi:</span>
            {error}
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="px-3 py-1 rounded-lg bg-red-900/60 hover:bg-red-900 text-white font-medium cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Blueprint Step 23: The 3 Key Display Metrics (Total, Available/Unused, Used) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Icons.key size={16} className="text-blue-400" />
            <span>Metrik Lisensi Komersial (Supabase Database)</span>
          </h2>
          {stats && (
            <span className="text-[11px] text-slate-400 font-mono">
              Terakhir sinkron: {new Date(stats.timestamp).toLocaleTimeString('id-ID')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Total Licenses */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md space-y-3 relative overflow-hidden group hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Licenses
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Icons.key size={16} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                data-testid="stat-total"
                className="text-3xl font-extrabold text-white font-mono tracking-tight"
              >
                {isLoading ? '...' : (stats?.total ?? 0)}
              </span>
              <span className="text-xs text-slate-400">kunci terdaftar</span>
            </div>

            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
              <span>Basis data Supabase</span>
              <span className="text-blue-400 font-medium">100% Tercatat</span>
            </div>
          </div>

          {/* 2. Unused / Available Licenses */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md space-y-3 relative overflow-hidden group hover:border-emerald-600/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Unused Licenses (Available)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Icons.checkCircle size={16} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                data-testid="stat-unused"
                className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight"
              >
                {isLoading ? '...' : (stats?.unused ?? 0)}
              </span>
              <span className="text-xs text-slate-400">siap dijual</span>
            </div>

            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status: Belum Terpakai</span>
              <span className="text-emerald-400 font-medium">Siap Dikirim</span>
            </div>
          </div>

          {/* 3. Used Licenses */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md space-y-3 relative overflow-hidden group hover:border-amber-600/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Used Licenses
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Icons.shield size={16} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                data-testid="stat-used"
                className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight"
              >
                {isLoading ? '...' : (stats?.used ?? 0)}
              </span>
              <span className="text-xs text-slate-400">telah aktif</span>
            </div>

            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
              <span>Aktivasi Perangkat</span>
              <span className="text-amber-400 font-medium">
                {stats?.activationRate ?? 0}% Rasio
              </span>
            </div>
          </div>
        </div>

        {/* Activation Rate Progress Bar */}
        {stats && stats.total > 0 && (
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Tingkat Utilisasi Lisensi (Activation Rate)</span>
              <span className="font-mono font-semibold text-white">
                {stats.used} dari {stats.total} lisensi aktif ({stats.activationRate}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-amber-500 transition-all duration-500"
                style={{ width: `${stats.activationRate}%` }}
              />
              <div
                className="h-full bg-emerald-500/80 transition-all duration-500"
                style={{ width: `${100 - stats.activationRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Terpakai: {stats.used}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Tersedia: {stats.unused}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Developer Seeder Button in Dev Mode */}
      {process.env.NEXT_PUBLIC_DEVELOPMENT === 'TRUE' && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-dashed border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Icons.key size={14} />
              <span>Development Seed Helper (Step 23 Testing)</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Buat 5 lisensi demo otomatis (3 digunakan + 2 tersedia) untuk menguji kalkulasi metrik secara instan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSeed}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <DatabaseIcon size={14} />
            <span>Seed 5 Lisensi Demo</span>
          </button>
        </div>
      )}

      {/* Step 25: Full License Management List (Search, Filter, Copy, Toggle Used, Delete) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Icons.key size={16} className="text-blue-400" />
            <span>Aktivitas Lisensi Terbaru — Manajemen & Daftar Kunci Lisensi (Step 25)</span>
          </h3>
          <span className="text-xs text-slate-400">Pencarian, Filter & Kendali Penuh</span>
        </div>

        <AdminLicenseList
          key={listRefreshKey}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onStatsRefreshNeeded={refresh}
        />
      </div>

      {/* Blueprint Architecture Guardrail Note */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-blue-200 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
          <Icons.shield size={20} />
        </div>
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-white block">
            Kepatuhan Arsitektur Local-First & Zero-Knowledge
          </span>
          <p className="text-slate-300 leading-relaxed">
            Statistik dan daftar lisensi di atas berasal secara eksklusif dari tabel <code className="px-1 py-0.5 rounded bg-blue-900/60 font-mono">public.licenses</code> Supabase. Seluruh data transaksi bisnis penyewa (faktur, pengeluaran, daftar pelanggan, laporan) disimpan secara lokal di IndexedDB masing-masing perangkat dan tidak pernah ditransmisikan ke server.
          </p>
        </div>
      </div>

      {/* Step 24: Create License Modal */}
      <CreateLicenseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLicenseCreated={handleLicenseCreated}
      />
    </div>
  );
}
