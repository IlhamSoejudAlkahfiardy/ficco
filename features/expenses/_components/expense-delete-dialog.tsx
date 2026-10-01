'use client';

import React from 'react';
import { ExpenseWithCategory } from '../_types/expense.types';
import { Icons } from '@/shared/_components/icons';

interface ExpenseDeleteDialogProps {
  isOpen: boolean;
  expense: ExpenseWithCategory | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export const ExpenseDeleteDialog: React.FC<ExpenseDeleteDialogProps> = ({
  isOpen,
  expense,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !expense) return null;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
          <Icons.trash size={24} />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Hapus Catatan Pengeluaran?
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Tindakan ini akan menghapus data pengeluaran secara permanen dari IndexedDB lokal Anda.
          </p>
        </div>

        {/* Expense Info Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-semibold">
            <span className="text-slate-700 dark:text-zinc-200 truncate max-w-[200px]">
              {expense.description}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              {formatRupiah(expense.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-[11px]">
            <span>{expense.categoryName || 'Kategori Lain'}</span>
            <span>{expense.date}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Icons.trash size={14} />
                <span>Hapus Pengeluaran</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
