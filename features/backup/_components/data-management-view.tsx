'use client';

import React, { useState } from 'react';
import { BackupExportCard } from './backup-export-card';
import { BackupImportCard } from './backup-import-card';
import { useBackupExport } from '../_hooks/use-backup-export';
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, APP_VERSION } from '../_types/backup.types';
import { Icons } from '@/shared/_components/icons';

interface DataManagementViewProps {
  onImportSuccess?: () => void;
  defaultActiveAction?: 'export' | 'import' | 'all';
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  onImportSuccess,
  defaultActiveAction = 'all',
}) => {
  const [activeSegment, setActiveSegment] = useState<'all' | 'export' | 'import'>(defaultActiveAction);
  const [showFaq, setShowFaq] = useState<boolean>(false);

  const {
    stats,
    isLoadingStats,
    isExporting,
    exportData,
    refreshStats,
  } = useBackupExport();

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const formatTimestamp = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleImportCompleted = () => {
    void refreshStats();
    if (onImportSuccess) {
      onImportSuccess();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb & Architectural Guarantee */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300">
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200">Settings</span>
            <span>→</span>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
              Data Management
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Manajemen Data & Cadangan
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Pusat kendali basis data lokal Anda. Cadangkan seluruh data bisnis (faktur, pengeluaran, pelanggan, dan produk) ke berkas JSON portabel atau pulihkan data kapan saja dengan aman.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <button
                type="button"
                onClick={() => exportData()}
                disabled={isExporting || isLoadingStats}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mengekspor JSON...</span>
                  </>
                ) : (
                  <>
                    <Icons.download size={16} />
                    <span>Export All Data</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSegment('import')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Icons.upload size={16} />
                <span>Import Data</span>
              </button>
            </div>
          </div>

          {/* Privacy & Zero-Knowledge Badge */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Penyimpanan Lokal IndexedDB (Offline-Ready)</span>
            </div>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400">Zero-Knowledge: Data finansial tidak pernah diunggah ke server</span>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bar (Blueprint Step 19: Last Backup, Backup File Format, Data Size) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Last Backup */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Last Backup
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Icons.backup size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {isLoadingStats
                ? 'Memeriksa...'
                : stats?.lastBackupDate
                ? formatTimestamp(stats.lastBackupDate)
                : 'Belum pernah'}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  stats?.lastBackupDate ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>
                {stats?.lastBackupDate
                  ? 'Cadangan tercatat di IndexedDB'
                  : 'Disarankan ekspor secara berkala'}
              </span>
            </p>
          </div>
        </div>

        {/* Metric 2: Backup File Format */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Backup File Format
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Icons.download size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              JSON (Schema v{BACKUP_SCHEMA_VERSION})
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Format: <code className="font-mono text-[11px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{BACKUP_FORMAT}</code> (v{APP_VERSION})
            </p>
          </div>
        </div>

        {/* Metric 3: Data Size */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Data Size
            </span>
            <button
              type="button"
              onClick={refreshStats}
              title="Segarkan Metrik"
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className={isLoadingStats ? 'animate-spin' : ''}>
                <Icons.refresh size={14} />
              </div>
            </button>
          </div>
          <div className="mt-3">
            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">
              {isLoadingStats ? 'Menghitung...' : formatFileSize(stats?.dataSizeBytes || 0)}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {isLoadingStats ? 'Memuat data...' : `${stats?.totalRecords || 0} Record di 9 Tabel`}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Intuitive Visual Workflow Guide ("Understandable without documentation") */}
      <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
              Alur Kerja Cadangan Data (Backup Workflow)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
          >
            {showFaq ? 'Sembunyikan Panduan & FAQ ▲' : 'Lihat Panduan & FAQ ▼'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-zinc-300 pt-1">
          <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-bold text-slate-800 dark:text-zinc-100">Simpan di Perangkat</p>
              <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                Semua faktur & biaya otomatis tersimpan di IndexedDB browser Anda tanpa perlu internet.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-bold text-slate-800 dark:text-zinc-100">Ekspor Berkala</p>
              <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                Unduh berkas JSON dengan tombol <strong>Export All Data</strong> untuk disimpan di flash disk atau cloud pribadi.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-bold text-slate-800 dark:text-zinc-100">Pulihkan Kapan Saja</p>
              <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                Saat berganti laptop atau HP, unggah berkas cadangan melalui <strong>Import Data</strong> untuk pemulihan instan.
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible FAQ Section */}
        {showFaq && (
          <div className="pt-3 border-t border-blue-200/60 dark:border-blue-900/40 space-y-3 text-xs animate-in fade-in">
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Apakah data saya aman jika saya berganti browser atau laptop?
              </p>
              <p className="text-slate-600 dark:text-zinc-300">
                Karena Ficco berbasis Local-First, data berada di browser perangkat yang bersangkutan. Agar data dapat dibuka di laptop atau browser lain, Anda cukup melakukan <strong>Export All Data</strong> dari perangkat lama, lalu melakukan <strong>Import Data</strong> di perangkat baru.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Apakah ada risiko data hilang saat melakukan Impor data?
              </p>
              <p className="text-slate-600 dark:text-zinc-300">
                Proses impor menggunakan transaksi atomik Dexie. Berkas JSON akan divalidasi dengan Zod terlebih dahulu. Jika berkas rusak atau proses dibatalkan, seluruh database saat ini tetap aman dan tidak akan terpotong.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Action Segment Controller */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 gap-6">
        <button
          type="button"
          onClick={() => setActiveSegment('all')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeSegment === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          Semua Modul (Ekspor & Impor)
        </button>
        <button
          type="button"
          onClick={() => setActiveSegment('export')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeSegment === 'export'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          Ekspor Data (Export All Data)
        </button>
        <button
          type="button"
          onClick={() => setActiveSegment('import')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeSegment === 'import'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          Impor Data (Import Data)
        </button>
      </div>

      {/* 5. Actions Viewports */}
      <div className="space-y-8">
        {(activeSegment === 'all' || activeSegment === 'export') && (
          <div className="space-y-3">
            {activeSegment === 'all' && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Aksi 1: Ekspor Seluruh Basis Data (Export All Data)</span>
              </div>
            )}
            <BackupExportCard />
          </div>
        )}

        {(activeSegment === 'all' || activeSegment === 'import') && (
          <div className="space-y-3">
            {activeSegment === 'all' && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Aksi 2: Pulihkan Basis Data dari Berkas (Import Data)</span>
              </div>
            )}
            <BackupImportCard onImportComplete={handleImportCompleted} />
          </div>
        )}
      </div>
    </div>
  );
};
