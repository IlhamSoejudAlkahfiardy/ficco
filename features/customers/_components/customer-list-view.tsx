'use client';

import React from 'react';
import { useCustomers } from '../_hooks/use-customers';
import { CustomerFormModal } from './customer-form-modal';
import { CustomerDetailDrawer } from './customer-detail-drawer';
import { CustomerDeleteDialog } from './customer-delete-dialog';
import { CustomerSortBy } from '../_types/customer.types';
import { Icons } from '@/shared/_components/icons';
import { AppSelect } from '@/shared';

export const CustomerListView: React.FC = () => {
  const {
    customers,
    isLoading,
    isSubmitting,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    stats,
    notification,
    clearNotification,
    // Modals
    isFormOpen,
    editingCustomer,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveCustomer,
    // Detail
    isDetailOpen,
    selectedSummary,
    isLoadingDetail,
    openDetail,
    closeDetail,
    // Delete
    deleteTarget,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    // Seed
    seedSampleData,
  } = useCustomers();

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Manajemen Pelanggan
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Direktori kontak, informasi penagihan, dan histori faktur tersimpan di IndexedDB.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {customers.length === 0 && !isLoading && (
            <button
              type="button"
              onClick={seedSampleData}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
            >
              + Muat Contoh Data
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Icons.plus size={16} />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Total Pelanggan</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalCustomers}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Icons.customers size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Klien Perusahaan</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.withCompanyCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Icons.building size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Tercatat Email</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.withEmailCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Icons.mail size={20} />
          </div>
        </div>
      </div>

      {/* Feedback Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">{notification.type === 'success' ? '✓' : '⚠'}</span>
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={clearNotification}
            className="font-bold ml-4 hover:opacity-75 transition-opacity"
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
            <Icons.search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelanggan berdasarkan nama, perusahaan, email, atau telepon..."
            className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-transparent bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-slate-200 dark:focus:border-zinc-700 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:inline">Urutkan:</span>
          <AppSelect<CustomerSortBy>
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={[
              { value: 'created_desc', label: 'Terbaru Ditambahkan' },
              { value: 'created_asc', label: 'Terlama' },
              { value: 'name_asc', label: 'Nama (A - Z)' },
              { value: 'name_desc', label: 'Nama (Z - A)' },
            ]}
            className="w-48"
            placeholder="Pilih Urutan"
          />
        </div>
      </div>

      {/* Main Customers Display */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <span className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Memuat daftar pelanggan dari IndexedDB...</p>
        </div>
      ) : customers.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-4">
            <Icons.customers size={28} />
          </div>
          {searchQuery ? (
            <>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tidak ada hasil yang cocok
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Pencarian untuk &quot;{searchQuery}&quot; tidak menemukan pelanggan. Coba gunakan kata kunci lain.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Hapus Pencarian
              </button>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Belum ada data pelanggan
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Tambahkan pelanggan atau klien pertama Anda untuk memudahkan proses pembuatan invoice.
              </p>
              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={seedSampleData}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Muat Contoh Data
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  + Tambah Pelanggan Pertama
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile screens) */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Perusahaan</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4">Tanggal Daftar</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {customers.map((c) => {
                  const initials = c.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200/50 dark:border-blue-900/50">
                            {initials}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => openDetail(c)}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors cursor-pointer"
                            >
                              {c.name}
                            </button>
                            {c.taxNumber && (
                              <p className="text-[11px] text-slate-400 font-normal">
                                NPWP: {c.taxNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-zinc-300">
                        {c.companyName ? (
                          <span className="font-medium">{c.companyName}</span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Contact Channels */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline block truncate max-w-[180px]"
                            >
                              {c.email}
                            </a>
                          )}
                          {c.phone && (
                            <span className="text-[11px] text-slate-600 dark:text-zinc-400 block">
                              {c.phone}
                            </span>
                          )}
                          {!c.email && !c.phone && (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-zinc-400">
                        {formatDate(c.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDetail(c)}
                            title="Lihat Detail"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Icons.eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            title="Edit Pelanggan"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          >
                            <Icons.edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(c)}
                            title="Hapus Pelanggan"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Icons.trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (Optimized for small screens) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {customers.map((c) => {
              const initials = c.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm shrink-0 border border-blue-200/50 dark:border-blue-900/50">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openDetail(c)}
                          className="font-bold text-sm text-slate-900 dark:text-white truncate block text-left"
                        >
                          {c.name}
                        </button>
                        {c.companyName && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                            {c.companyName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800"
                      >
                        <Icons.edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteDialog(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800"
                      >
                        <Icons.trash size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Badges */}
                  <div className="flex flex-wrap gap-2 text-xs pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      >
                        <Icons.phone size={12} className="text-slate-400" />
                        <span>{c.phone}</span>
                      </a>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 truncate max-w-[200px]"
                      >
                        <Icons.mail size={12} />
                        <span className="truncate">{c.email}</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>Terdaftar: {formatDate(c.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => openDetail(c)}
                      className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Lihat Detail</span>
                      <Icons.chevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals & Overlays */}
      <CustomerFormModal
        isOpen={isFormOpen}
        editingCustomer={editingCustomer}
        onClose={closeFormModal}
        onSubmit={saveCustomer}
        isSubmitting={isSubmitting}
      />

      <CustomerDetailDrawer
        isOpen={isDetailOpen}
        summary={selectedSummary}
        isLoading={isLoadingDetail}
        onClose={closeDetail}
        onEdit={() => {
          if (selectedSummary?.customer) {
            closeDetail();
            openEditModal(selectedSummary.customer);
          }
        }}
        onDelete={() => {
          if (selectedSummary?.customer) {
            openDeleteDialog(selectedSummary.customer);
          }
        }}
      />

      <CustomerDeleteDialog
        isOpen={Boolean(deleteTarget)}
        target={deleteTarget}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
