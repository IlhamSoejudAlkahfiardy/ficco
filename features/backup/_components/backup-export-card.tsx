'use client';

import React from 'react';
import { useBackupExport } from '../_hooks/use-backup-export';
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, APP_VERSION } from '../_types/backup.types';
import { Icons } from '@/shared/_components/icons';

export const BackupExportCard: React.FC = () => {
  const {
    isExporting,
    isLoadingStats,
    error,
    stats,
    lastResult,
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

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0">
            <Icons.download size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Ekspor Cadangan Data (.json)
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Simpan seluruh database lokal ke dalam satu berkas JSON terstruktur untuk pemulihan aman.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshStats}
            disabled={isLoadingStats || isExporting}
            title="Segarkan Statistik Data"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors shadow-2xs disabled:opacity-50"
          >
            <div className={isLoadingStats ? 'animate-spin' : ''}>
              <Icons.refresh size={16} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => exportData()}
            disabled={isExporting || isLoadingStats}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Membuat Berkas JSON...</span>
              </>
            ) : (
              <>
                <Icons.download size={16} />
                <span>Unduh Cadangan Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Success Banner if just exported */}
      {lastResult && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </span>
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                Berkas cadangan berhasil diunduh ke perangkat Anda!
              </p>
              <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                Nama Berkas: <code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">{lastResult.filename}</code> • Ukuran: {formatFileSize(lastResult.sizeBytes)} • {lastResult.totalRecords} record tersimpan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Error Banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
          <Icons.alertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 4. Specifications and Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Format & Versi Cadangan
          </p>
          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1">
            {BACKUP_FORMAT} (v{BACKUP_SCHEMA_VERSION})
          </p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
            Aplikasi Ficco v{APP_VERSION}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Cadangan Terakhir
          </p>
          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1">
            {stats?.lastBackupDate ? formatTimestamp(stats.lastBackupDate) : 'Belum pernah dicadangkan'}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
            Tersimpan di IndexedDB lokal
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Total Record Database
          </p>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {isLoadingStats ? 'Menghitung...' : `${stats?.totalRecords || 0} Record`}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
            9 Tabel bisnis aktif
          </p>
        </div>
      </div>

      {/* 5. Breakdown of Included Tables */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Cakupan Tabel yang Disertakan dalam Berkas Cadangan:
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5">
          {stats?.tableSummaries.map((table) => (
            <div
              key={table.tableKey}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-850 text-xs"
            >
              <span className="text-slate-600 font-medium">
                {table.label}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                {table.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Offline Guarantee Note */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
        <p className="leading-relaxed">
          <strong>Jaminan Keamanan & Privasi Offline:</strong> Proses ekspor dilakukan 100% di browser Anda menggunakan IndexedDB. Tidak ada data finansial, faktur, atau pelanggan yang dikirim ke server (Zero-Knowledge Architecture).
        </p>
      </div>
    </div>
  );
};
