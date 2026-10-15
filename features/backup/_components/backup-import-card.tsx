'use client';

import React, { useRef, useState } from 'react';
import { useBackupImport } from '../_hooks/use-backup-import';
import { Icons } from '@/shared/_components/icons';

interface BackupImportCardProps {
  onImportComplete?: () => void;
}

export const BackupImportCard: React.FC<BackupImportCardProps> = ({ onImportComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    selectedFile,
    isValidating,
    isImporting,
    validationResult,
    importResult,
    errorMessage,
    isConfirmOpen,
    handleFileSelect,
    openConfirmation,
    closeConfirmation,
    confirmAndRestore,
    clearError,
    clearSuccess,
    reset,
  } = useBackupImport(onImportComplete);

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

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const preview = validationResult?.preview;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40 shrink-0">
            <Icons.upload size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Pulihkan Cadangan Data (.json)
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Pulihkan data faktur, pengeluaran, pelanggan, dan konfigurasi dari berkas JSON hasil ekspor.
            </p>
          </div>
        </div>

        {selectedFile && (
          <button
            type="button"
            onClick={reset}
            disabled={isImporting || isValidating}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Pilih Berkas Lain
          </button>
        )}
      </div>

      {/* 2. Success Banner */}
      {importResult && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-bold">Pemulihan Data Berhasil!</h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Sebanyak {importResult.totalRecords} rekaman data berhasil dipulihkan secara transaksional ke IndexedDB lokal pada{' '}
                  {formatTimestamp(importResult.restoredAt)}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearSuccess}
              title="Tutup pemberitahuan"
              aria-label="Tutup pemberitahuan sukses"
              className="p-1.5 rounded-xl text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer shrink-0"
            >
              <Icons.close size={16} />
            </button>
          </div>

          <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Rekomendasi: Muat ulang halaman agar perubahan data tampil langsung pada seluruh modul.
            </span>
            <button
              type="button"
              onClick={handleReload}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Muat Ulang Halaman Sekarang
            </button>
          </div>
        </div>
      )}

      {/* 3. Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100 space-y-2 animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 flex-1">
              <div className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                <Icons.alertCircle size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold">Gagal Memproses Berkas</h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{errorMessage}</p>

                {validationResult?.details && validationResult.details.length > 0 && (
                  <ul className="mt-2 text-[11px] list-disc list-inside text-rose-600 dark:text-rose-400 space-y-0.5 max-h-32 overflow-y-auto">
                    {validationResult.details.map((detail, idx) => (
                      <li key={idx} className="font-mono">
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={clearError}
              title="Tutup pesan error"
              aria-label="Tutup pesan error"
              className="p-1.5 rounded-xl text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer shrink-0"
            >
              <Icons.close size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Dropzone / File Picker (when no file selected yet or after reset) */}
      {!selectedFile && !importResult && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={onFileInputChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 bg-slate-50/50 dark:bg-zinc-800/30'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400">
                <Icons.upload size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  Pilih atau seret berkas cadangan ke sini
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Mendukung berkas JSON terenkapsulasi (<code className="font-mono text-slate-700 dark:text-zinc-300">.json</code>)
                </p>
              </div>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors shadow-2xs"
              >
                Pilih Berkas JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Validation In Progress */}
      {isValidating && (
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-600 dark:text-zinc-300">
            Menganalisis berkas dan memverifikasi integritas 9 tabel database...
          </p>
        </div>
      )}

      {/* 6. Preview Table & Summary (when file is parsed and validated successfully) */}
      {preview && !importResult && (
        <div className="space-y-5 animate-in fade-in">
          {/* Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 block">
                Nama Berkas
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate block mt-0.5" title={preview.filename}>
                {preview.filename}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 block">
                Ukuran Berkas
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mt-0.5">
                {formatFileSize(preview.fileSizeBytes)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 block">
                Waktu Cadangan Dibuat
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mt-0.5">
                {formatTimestamp(preview.exportedAt)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 block">
                Total Rekaman Data
              </span>
              <span className="text-sm font-extrabold text-amber-900 dark:text-amber-200 block mt-0.5">
                {preview.totalRecords} Baris
              </span>
            </div>
          </div>

          {/* Table Breakdown Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Rincian Entitas Data yang Terdeteksi
              </h3>
              <span className="text-[11px] text-slate-400">9 Tabel Siap Dimuat</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {preview.tableSummaries.map((table) => (
                <div
                  key={table.tableKey}
                  className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs"
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {table.label}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                      table.count > 0
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {table.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-zinc-300">
              <Icons.alertCircle size={16} className="text-amber-600 shrink-0" />
              <span>
                Data telah divalidasi dan siap dipulihkan ke database IndexedDB lokal.
              </span>
            </div>

            <button
              type="button"
              onClick={openConfirmation}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Icons.upload size={15} />
              <span>Pulihkan Data Sekarang...</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Explicit Confirmation Modal */}
      {isConfirmOpen && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                <Icons.alertTriangle size={24} />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Konfirmasi Penggantian Seluruh Database
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Tindakan ini memerlukan konfirmasi tegas sebelum dieksekusi.
                </p>
              </div>
            </div>

            {/* Warning Message Box */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-xs space-y-2">
              <p className="font-semibold">
                PERINGATAN: Seluruh data lokal yang ada saat ini akan DIKOSONGKAN dan DIGANTIKAN sepenuhnya dengan data dari berkas cadangan ini.
              </p>
              <p className="text-amber-800 dark:text-amber-200 text-[11px] leading-relaxed">
                Operasi ini dieksekusi secara <strong>atomik (Database Transaction)</strong>. Jika terjadi gangguan atau kegagalan saat proses pemulihan, sistem akan membatalkan seluruh perubahan sehingga database Anda tetap aman.
              </p>
            </div>

            {/* Target Summary Details */}
            <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                <span>Berkas Sumber:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-100 truncate max-w-[200px]">
                  {preview.filename}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                <span>Waktu Cadangan:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-100">
                  {formatTimestamp(preview.exportedAt)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                <span>Total Data Baru:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {preview.totalRecords} Rekaman
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={isImporting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batalkan
              </button>

              <button
                type="button"
                onClick={confirmAndRestore}
                disabled={isImporting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memulihkan Database...</span>
                  </>
                ) : (
                  <>
                    <Icons.upload size={15} />
                    <span>Ya, Timpa & Pulihkan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
