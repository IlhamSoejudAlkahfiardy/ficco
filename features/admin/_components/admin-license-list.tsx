'use client';

import React, { useState } from 'react';
import type { License } from '@/features/license';
import { Icons, CopyIcon } from '@/shared/_components/icons';
import { useLicenseList } from '../_hooks/use-license-list';

interface AdminLicenseListProps {
  onOpenCreateModal: () => void;
  onStatsRefreshNeeded?: () => void;
}

export function AdminLicenseList({
  onOpenCreateModal,
  onStatsRefreshNeeded,
}: AdminLicenseListProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deletingLicense, setDeletingLicense] = useState<License | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const {
    filteredLicenses,
    totalCount,
    usedCount,
    unusedCount,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    mutatingId,
    refresh,
    toggleUsed,
    deleteLicense,
  } = useLicenseList(() => {
    if (onStatsRefreshNeeded) {
      onStatsRefreshNeeded();
    }
  });

  const handleCopyKey = (key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(key).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleUsed = async (lic: License) => {
    const targetState = !lic.used;
    const ok = await toggleUsed(lic.id, lic.used);
    if (ok) {
      setActionSuccessMessage(
        `Kunci ${lic.licenseKey} diubah menjadi: ${targetState ? 'Digunakan' : 'Belum Digunakan'}`
      );
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLicense) return;
    const key = deletingLicense.licenseKey;
    const ok = await deleteLicense(deletingLicense.id);
    if (ok) {
      setActionSuccessMessage(`Kunci lisensi ${key} berhasil dihapus.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setDeletingLicense(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Success Toast/Banner */}
      {actionSuccessMessage && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-200 text-xs flex items-center justify-between gap-3 animate-fadeIn"
          data-testid="list-action-banner"
        >
          <div className="flex items-center gap-2">
            <Icons.checkCircle size={16} className="text-blue-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-blue-400 hover:text-blue-300 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <Icons.alertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-900 text-white font-medium cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Toolbar: Search & Filter Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Icons.search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kunci lisensi, nama pelanggan, atau email..."
            data-testid="license-search-input"
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <Icons.close size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills and Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              data-testid="filter-tab-all"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unused')}
              data-testid="filter-tab-unused"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'unused'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Belum Digunakan ({unusedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('used')}
              data-testid="filter-tab-used"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'used'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Digunakan ({usedCount})
            </button>
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Segarkan daftar lisensi"
          >
            <Icons.refresh size={16} className={isLoading ? 'animate-spin text-blue-400' : ''} />
          </button>

          {/* Add License Button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            data-testid="table-add-license-btn"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Icons.plus size={14} />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2 text-xs">
            <Icons.loader size={20} className="animate-spin text-blue-400" />
            <span>Memuat data lisensi dari Supabase...</span>
          </div>
        ) : filteredLicenses.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-750 text-slate-400 mx-auto flex items-center justify-center">
              <Icons.key size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {searchQuery || filter !== 'all'
                ? 'Tidak ada lisensi yang cocok dengan filter / pencarian'
                : 'Belum ada kunci lisensi di database'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || filter !== 'all'
                ? 'Coba ganti kata kunci pencarian atau ubah filter status di atas.'
                : 'Klik tombol di bawah untuk membuat kunci lisensi komersial pertama.'}
            </p>
            {searchQuery || filter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="mt-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 cursor-pointer"
              >
                Reset Filter
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Icons.plus size={14} />
                <span>Buat Lisensi Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-900/60 text-slate-400 uppercase text-[11px] font-semibold">
                  <th className="py-3 px-4">Kunci Lisensi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Aktivasi / Perangkat</th>
                  <th className="py-3 px-4">Tanggal Dibuat</th>
                  <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-200">
                {filteredLicenses.map((lic) => {
                  const isMutating = mutatingId === lic.id;

                  return (
                    <tr
                      key={lic.id}
                      data-testid={`license-row-${lic.id}`}
                      className="hover:bg-slate-750/50 transition-colors"
                    >
                      {/* 1. License Key Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-blue-400 tracking-wide select-all">
                            {lic.licenseKey}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(lic.licenseKey)}
                            title="Salin kunci lisensi"
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                            data-testid={`copy-btn-${lic.id}`}
                          >
                            <CopyIcon size={12} />
                          </button>
                          {copiedKey === lic.licenseKey && (
                            <span className="text-[10px] text-emerald-400 font-medium animate-fadeIn">
                              Tersalin!
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Status Column */}
                      <td className="py-3 px-4">
                        {lic.used ? (
                          <span
                            data-testid={`status-badge-used-${lic.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Digunakan
                          </span>
                        ) : (
                          <span
                            data-testid={`status-badge-unused-${lic.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Belum Digunakan (Tersedia)
                          </span>
                        )}
                      </td>

                      {/* 3. Customer Info */}
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-medium text-white block">
                            {lic.customerName || '—'}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {lic.customerEmail || '—'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Activation Info */}
                      <td className="py-3 px-4">
                        {lic.used ? (
                          <div className="space-y-0.5">
                            <span className="text-[11px] text-slate-300 font-mono block">
                              {lic.deviceFingerprint || 'Device ID Tercatat'}
                            </span>
                            {lic.activatedAt && (
                              <span className="text-[10px] text-slate-500 block">
                                {new Date(lic.activatedAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Belum diaktivasi</span>
                        )}
                      </td>

                      {/* 5. Created Date */}
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(lic.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* 6. Management Actions: Toggle Used State & Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Used State (Step 25) */}
                          <button
                            type="button"
                            onClick={() => handleToggleUsed(lic)}
                            disabled={isMutating}
                            data-testid={`toggle-used-btn-${lic.id}`}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                              lic.used
                                ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50'
                            }`}
                            title={
                              lic.used
                                ? 'Ubah status menjadi Belum Digunakan'
                                : 'Tandai status sebagai Sudah Digunakan'
                            }
                          >
                            {isMutating ? (
                              <Icons.loader size={11} className="animate-spin" />
                            ) : (
                              <Icons.check size={11} />
                            )}
                            <span>{lic.used ? 'Tandai Tersedia' : 'Tandai Digunakan'}</span>
                          </button>

                          {/* Delete License Button (Step 25) */}
                          <button
                            type="button"
                            onClick={() => setDeletingLicense(lic)}
                            disabled={isMutating}
                            data-testid={`delete-btn-${lic.id}`}
                            className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-950/60 border border-transparent hover:border-red-800/50 transition-colors cursor-pointer disabled:opacity-50"
                            title="Hapus lisensi ini"
                          >
                            <Icons.trash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Step 25) */}
      {deletingLicense && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                <Icons.trash size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Hapus Kunci Lisensi?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Apakah Anda yakin ingin menghapus kunci lisensi{' '}
                  <span className="font-mono font-semibold text-blue-400">
                    {deletingLicense.licenseKey}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>
                {deletingLicense.customerName && (
                  <p className="text-[11px] text-slate-400">
                    Pemesan:{' '}
                    <span className="text-slate-200">{deletingLicense.customerName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingLicense(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                data-testid="confirm-delete-btn"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors cursor-pointer shadow-md"
              >
                Hapus Lisensi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
