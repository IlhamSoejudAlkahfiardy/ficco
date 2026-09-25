'use client';

import React from 'react';
import { useProducts } from '../_hooks/use-products';
import { ProductFormModal } from './product-form-modal';
import { ProductDeleteDialog } from './product-delete-dialog';
import { ProductFilterStatus, ProductSortBy } from '../_types/product.types';
import { Icons } from '@/shared/_components/icons';
import { AppSelect } from '@/shared';

export const ProductListView: React.FC = () => {
  const {
    products,
    isLoading,
    isSubmitting,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    stats,
    notification,
    clearNotification,
    // Modals
    isFormOpen,
    editingProduct,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveProduct,
    // Delete
    deleteTarget,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    // Quick Actions
    toggleStatus,
    seedSampleData,
  } = useProducts();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const statusOptions = [
    { label: 'Semua Status', value: 'all' },
    { label: 'Hanya Aktif', value: 'active' },
    { label: 'Hanya Non-Aktif', value: 'inactive' },
  ];

  const sortOptions = [
    { label: 'Terbaru Ditambahkan', value: 'created_desc' },
    { label: 'Terlama', value: 'created_asc' },
    { label: 'Nama (A - Z)', value: 'name_asc' },
    { label: 'Nama (Z - A)', value: 'name_desc' },
    { label: 'Harga: Tertinggi ke Terendah', value: 'price_desc' },
    { label: 'Harga: Terendah ke Tertinggi', value: 'price_asc' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Katalog Produk & Layanan
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Kelola daftar barang, jasa, SKU, satuan unit, dan tarif pajak default di IndexedDB.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {products.length === 0 && !isLoading && (
            <button
              type="button"
              onClick={seedSampleData}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              + Muat Contoh Data
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Icons.plus size={16} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Total Katalog</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalProducts}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Icons.products size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Produk Aktif</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.activeCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            ✓
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Non-Aktif</p>
            <p className="text-2xl font-bold text-slate-400 dark:text-zinc-500 mt-1">
              {stats.inactiveCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center font-bold text-xs">
            ✕
          </div>
        </div>
      </div>

      {/* Notifications */}
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
            className="font-bold ml-4 hover:opacity-75 transition-opacity cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
            <Icons.search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama produk, SKU, atau deskripsi..."
            className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-transparent bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-slate-200 dark:focus:border-zinc-700 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter & Sort controls using shared AppSelect */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:inline">Status:</span>
            <AppSelect<ProductFilterStatus>
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={statusOptions}
              className="w-36"
              placeholder="Status"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:inline">Urutkan:</span>
            <AppSelect<ProductSortBy>
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={sortOptions}
              className="w-48"
              placeholder="Urutkan"
            />
          </div>
        </div>
      </div>

      {/* Main Products Display */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <span className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Memuat katalog produk dari IndexedDB...</p>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-4">
            <Icons.products size={28} />
          </div>
          {searchQuery || statusFilter !== 'all' ? (
            <>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tidak ada produk yang cocok
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Filter saat ini tidak menemukan item. Coba ganti kata kunci atau pilih semua status.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Katalog produk masih kosong
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Tambahkan barang atau layanan jasa Anda agar dapat langsung dipilih saat menerbitkan faktur.
              </p>
              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={seedSampleData}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Muat Contoh Data
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                >
                  + Tambah Produk Pertama
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Nama Produk / Layanan</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Satuan</th>
                  <th className="py-3.5 px-4 text-right">Harga Satuan</th>
                  <th className="py-3.5 px-4 text-center">PPN (%)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Name & Description */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          {p.name}
                        </span>
                        {p.description && (
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                      {p.sku || <span className="text-slate-400 italic font-sans">-</span>}
                    </td>

                    {/* Unit */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium text-[11px] uppercase">
                        {p.unit}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(p.price)}
                    </td>

                    {/* Tax Rate */}
                    <td className="py-3.5 px-4 text-center text-slate-600 dark:text-zinc-300">
                      {p.taxRate > 0 ? (
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {p.taxRate}%
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">0%</span>
                      )}
                    </td>

                    {/* Active State (With Toggle Action) */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleStatus(p)}
                        title={p.active ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          p.active
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{p.active ? 'Aktif' : 'Non-Aktif'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          title="Edit Produk"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                        >
                          <Icons.edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(p)}
                          title="Hapus Produk"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Icons.trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {p.name}
                    </h3>
                    {p.sku && (
                      <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                        SKU: {p.sku}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800"
                    >
                      <Icons.edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteDialog(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800"
                    >
                      <Icons.trash size={16} />
                    </button>
                  </div>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {p.description}
                  </p>
                )}

                {/* Price & Unit Details */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Harga Satuan</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.price)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 ml-1">
                      / {p.unit}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStatus(p)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      p.active
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.active ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{p.active ? 'Aktif' : 'Non-Aktif'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals & Dialogs */}
      <ProductFormModal
        isOpen={isFormOpen}
        editingProduct={editingProduct}
        onClose={closeFormModal}
        onSubmit={saveProduct}
        isSubmitting={isSubmitting}
      />

      <ProductDeleteDialog
        isOpen={Boolean(deleteTarget)}
        target={deleteTarget}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
