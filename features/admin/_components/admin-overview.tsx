'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '@/shared/_components/icons';
import { useAdminAuth } from '../_hooks/use-admin-auth';

export function AdminOverview() {
  const { user, logout } = useAdminAuth();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sesi Otentikasi Admin Terverifikasi
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Panel Kendali Lisensi Ficco
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Area manajemen lisensi komersial dan aktivasi perangkat. Masuk sebagai{' '}
              <span className="font-semibold text-blue-400 font-mono">
                {user?.username || 'admin'}
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Aplikasi Pengguna</span>
              <Icons.arrowUpRight size={14} />
            </Link>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.logout size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & Architecture Guardrail Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/40 border border-blue-800/50 text-blue-200 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
          <Icons.shield size={22} />
        </div>
        <div className="flex-1 space-y-0.5 text-xs">
          <div className="font-semibold text-white flex items-center gap-2">
            <span>Prinsip Keamanan Zero-Knowledge & Local-First Terpenuhi</span>
            <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              Aktif
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Data transaksi keuangan pengguna (faktur, pengeluaran, daftar pelanggan, laporan laba-rugi) tersimpan 100% di IndexedDB perangkat pengguna. Panel Admin ini secara eksklusif hanya mengelola registrasi kunci lisensi dan status aktivasi perangkat.
          </p>
        </div>
      </div>

      {/* Blueprint Preview for Step 23 / 24 / 25 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Icons.key size={16} className="text-blue-400" />
            <span>Ringkasan Metrik Lisensi (Step 23 Preview)</span>
          </h2>
          <span className="text-xs text-slate-400">Database Supabase</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <span className="text-xs font-medium text-slate-400 block">Total Lisensi Dibuat</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white font-mono">—</span>
              <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Step 23 Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Total kunci lisensi yang terdaftar di database Supabase</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <span className="text-xs font-medium text-slate-400 block">Lisensi Digunakan (Used)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-400 font-mono">—</span>
              <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Aktivasi Perangkat
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Lisensi yang telah diaktivasi pada perangkat pelanggan</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <span className="text-xs font-medium text-slate-400 block">Lisensi Belum Terpakai</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400 font-mono">—</span>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Tersedia Dijual
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Kunci siap dikirim manual ke pembeli/pelanggan baru</p>
          </div>
        </div>
      </div>

      {/* Next Steps Card */}
      <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Icons.checkCircle size={18} className="text-emerald-400" />
          <span>Langkah Selanjutnya dalam Blueprint</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-1">
            <span className="font-semibold text-blue-300 block">Step 23: Admin Dashboard</span>
            <p className="text-slate-400">Menghubungkan metrik statistik lisensi Supabase real-time.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-1">
            <span className="font-semibold text-blue-300 block">Step 24: Add License</span>
            <p className="text-slate-400">Form pembuatan kunci lisensi baru dengan generator acak aman.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-1">
            <span className="font-semibold text-blue-300 block">Step 25: License List</span>
            <p className="text-slate-400">Tabel manajemen, pencarian, filter, salin kunci, dan hapus lisensi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
