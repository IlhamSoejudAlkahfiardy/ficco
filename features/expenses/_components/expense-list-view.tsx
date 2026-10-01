'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { useExpenses } from '../_hooks/use-expenses';
import { ExpenseFormModal } from './expense-form-modal';
import { ExpenseCategoryModal } from './expense-category-modal';
import { ExpenseDetailModal } from './expense-detail-modal';
import { ExpenseDeleteDialog } from './expense-delete-dialog';
import {
  EXPENSE_PAYMENT_METHODS,
  ExpenseDateRangePreset,
  ExpenseSortBy,
} from '../_types/expense.types';
import { AppSelect } from '@/shared/_components/select';
import { Icons } from '@/shared/_components/icons';

export const ExpenseListView: React.FC = () => {
  const {
    expenses,
    paginatedExpenses,
    categories,
    stats,
    isLoading,
    page,
    totalPages,
    setPage,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    paymentMethod,
    setPaymentMethod,
    dateRange,
    setDateRange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortBy,
    setSortBy,
    handleResetFilter,
    isFormModalOpen,
    setIsFormModalOpen,
    editingExpense,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveExpense,
    isDetailModalOpen,
    setIsDetailModalOpen,
    viewingExpense,
    handleOpenDetail,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingExpense,
    handleOpenDelete,
    handleConfirmDelete,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    handleCreateCategory,
    handleUpdateCategory,
    handleToggleCategoryActive,
    handleDeleteCategory,
    handleSeedSampleData,
    feedback,
    clearFeedback,
  } = useExpenses();

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parsed = parseISO(dateStr);
      return format(parsed, 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  // Filter options for AppSelect
  const categoryFilterOptions = [
    { value: 'all', label: 'Semua Kategori' },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name + (c.active ? '' : ' (Non-aktif)'),
    })),
  ];

  const dateRangeOptions = [
    { value: 'this_month', label: 'Bulan Ini' },
    { value: 'last_month', label: 'Bulan Lalu' },
    { value: 'this_year', label: 'Tahun Ini' },
    { value: 'all', label: 'Semua Waktu' },
    { value: 'custom', label: 'Rentang Kustom' },
  ];

  const paymentMethodFilterOptions = [
    { value: 'all', label: 'Semua Pembayaran' },
    ...EXPENSE_PAYMENT_METHODS.map((m) => ({
      value: m.value,
      label: m.label,
    })),
  ];

  const sortOptions = [
    { value: 'date_desc', label: 'Tanggal Terbaru' },
    { value: 'date_asc', label: 'Tanggal Terlama' },
    { value: 'amount_desc', label: 'Nominal Tertinggi' },
    { value: 'amount_asc', label: 'Nominal Terendah' },
  ];

  const hasActiveFilters =
    search !== '' ||
    categoryId !== 'all' ||
    paymentMethod !== 'all' ||
    dateRange !== 'this_month' ||
    startDate !== '' ||
    endDate !== '';

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm shadow-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <Icons.check size={18} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Icons.alertTriangle size={18} className="text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={clearFeedback}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Icons.close size={16} />
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Pengeluaran
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
              Lokal IndexedDB
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Catat dan pantau seluruh beban operasional usaha secara mandiri dan aman di browser Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Icons.tag size={16} />
            <span>Kategori</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-colors flex items-center gap-2 shadow-xs"
          >
            <Icons.plus size={16} />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bulan Ini */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Beban Bulan Ini</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Icons.expenses size={18} />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatRupiah(stats?.thisMonthAmount || 0)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            {stats && stats.lastMonthAmount > 0 ? (
              <span
                className={`font-semibold ${
                  stats.monthOverMonthDiff > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {stats.monthOverMonthDiff > 0 ? '+' : ''}
                {stats.monthOverMonthDiff}%
              </span>
            ) : (
              <span className="text-slate-400">vs bulan lalu</span>
            )}
            <span>dibandingkan bulan lalu</span>
          </div>
        </div>

        {/* Card 2: Jumlah Transaksi */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Total Transaksi</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Icons.receipt size={18} />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {stats?.totalCount || 0} <span className="text-sm font-normal text-slate-500">transaksi</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {stats?.thisMonthCount || 0} transaksi tercatat bulan ini
          </p>
        </div>

        {/* Card 3: Kategori Terbesar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Kategori Terbesar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Icons.tag size={18} />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {stats?.topCategory ? stats.topCategory.name : '-'}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {stats?.topCategory
              ? `${formatRupiah(stats.topCategory.amount)} (${stats.topCategory.percentage}%)`
              : 'Belum ada data'}
          </p>
        </div>

        {/* Card 4: Rata-rata per Pengeluaran */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Rata-rata Pengeluaran</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Icons.wallet size={18} />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatRupiah(stats?.averageExpense || 0)}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Dari total {formatRupiah(stats?.totalAmount || 0)}
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none">
              <Icons.search size={16} />
            </span>
            <input
              type="text"
              placeholder="Cari pengeluaran, vendor, catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <Icons.close size={14} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div>
            <AppSelect
              options={categoryFilterOptions}
              value={categoryId}
              onChange={(val) => setCategoryId(val as string)}
              className="w-full"
            />
          </div>

          {/* Date range filter */}
          <div>
            <AppSelect
              options={dateRangeOptions}
              value={dateRange}
              onChange={(val) => setDateRange(val as ExpenseDateRangePreset)}
              className="w-full"
            />
          </div>

          {/* Payment method filter */}
          <div>
            <AppSelect
              options={paymentMethodFilterOptions}
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val as string)}
              className="w-full"
            />
          </div>

          {/* Sort By */}
          <div>
            <AppSelect
              options={sortOptions}
              value={sortBy}
              onChange={(val) => setSortBy(val as ExpenseSortBy)}
              className="w-full"
            />
          </div>
        </div>

        {/* Custom date range picker if custom selected */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs animate-in fade-in">
            <span className="font-semibold text-slate-600 dark:text-zinc-400">
              Rentang Tanggal:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {/* Reset filter button if active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-zinc-400">
            <span>Ditemukan {expenses.length} transaksi yang sesuai kriteria</span>
            <button
              type="button"
              onClick={handleResetFilter}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Icons.refresh size={12} />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-rose-600/30 border-t-rose-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Memuat catatan pengeluaran dari IndexedDB...
          </p>
        </div>
      ) : expenses.length === 0 ? (
        /* Empty State */
        <div className="p-16 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
            <Icons.expenses size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {hasActiveFilters
                ? 'Tidak ada pengeluaran yang sesuai filter'
                : 'Belum ada catatan pengeluaran'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {hasActiveFilters
                ? 'Coba ubah kata kunci pencarian, rentang tanggal, atau reset filter Anda.'
                : 'Mulai catat beban operasional bisnis Anda, seperti sewa kantor, software, gaji, atau iklan digital.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors"
              >
                Reset Semua Filter
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Icons.plus size={16} />
                  <span>Catat Pengeluaran Pertama</span>
                </button>
                <button
                  type="button"
                  onClick={handleSeedSampleData}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors flex items-center gap-1.5"
                >
                  <Icons.sparkles size={15} />
                  <span>Muat Data Contoh</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Expenses Table & Mobile Card List */
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 font-semibold text-slate-500 dark:text-zinc-400">
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Deskripsi Pengeluaran</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Metode Bayar</th>
                    <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                    <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {paginatedExpenses.map((exp) => {
                    const method = EXPENSE_PAYMENT_METHODS.find(
                      (m) => m.value === exp.paymentMethod
                    );
                    return (
                      <tr
                        key={exp.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDetail(exp)}
                      >
                        {/* Tanggal */}
                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                          {formatDateDisplay(exp.date)}
                        </td>

                        {/* Deskripsi */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {exp.description}
                          </div>
                          {exp.notes && (
                            <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate max-w-xs mt-0.5">
                              {exp.notes}
                            </div>
                          )}
                        </td>

                        {/* Kategori */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40">
                            {exp.categoryName || 'Kategori Lain'}
                          </span>
                        </td>

                        {/* Metode Pembayaran */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                            {method?.label || exp.paymentMethod}
                          </span>
                        </td>

                        {/* Nominal */}
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap text-sm">
                          {formatRupiah(exp.amount)}
                        </td>

                        {/* Aksi */}
                        <td
                          className="py-3.5 px-4 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(exp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Lihat Rincian"
                            >
                              <Icons.eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(exp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Edit Pengeluaran"
                            >
                              <Icons.edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(exp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Hapus Pengeluaran"
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
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {paginatedExpenses.map((exp) => {
              const method = EXPENSE_PAYMENT_METHODS.find(
                (m) => m.value === exp.paymentMethod
              );
              return (
                <div
                  key={exp.id}
                  onClick={() => handleOpenDetail(exp)}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                        {formatDateDisplay(exp.date)}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {exp.description}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                        {formatRupiah(exp.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40">
                      {exp.categoryName || 'Kategori'}
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
                      {method?.label || exp.paymentMethod}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500 dark:text-zinc-400">
              <div>
                Halaman <span className="font-semibold text-slate-900 dark:text-white">{page}</span> dari{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span> ({expenses.length} transaksi)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals & Dialogs */}
      <ExpenseFormModal
        isOpen={isFormModalOpen}
        editingExpense={editingExpense}
        categories={categories}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSaveExpense}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
      />

      <ExpenseCategoryModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        onClose={() => setIsCategoryModalOpen(false)}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onToggleActive={handleToggleCategoryActive}
        onDeleteCategory={handleDeleteCategory}
      />

      <ExpenseDetailModal
        isOpen={isDetailModalOpen}
        expense={viewingExpense}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(exp) => {
          setIsDetailModalOpen(false);
          handleOpenEdit(exp);
        }}
        onDelete={(exp) => {
          setIsDetailModalOpen(false);
          handleOpenDelete(exp);
        }}
      />

      <ExpenseDeleteDialog
        isOpen={isDeleteDialogOpen}
        expense={deletingExpense}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
