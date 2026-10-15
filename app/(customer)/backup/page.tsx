import React from 'react';
import { BackupExportCard, BackupImportCard } from '@/features/backup';

export default function BackupPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Cadangan & Pemulihan Data
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Ekspor dan pulihkan seluruh snapshot database lokal dalam format JSON portabel dan aman.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs text-slate-600 dark:text-zinc-300 self-start sm:self-auto border border-slate-200 dark:border-zinc-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local-First (IndexedDB Offline)</span>
        </div>
      </div>

      <div className="space-y-8">
        <BackupExportCard />
        <BackupImportCard />
      </div>
    </div>
  );
}

