'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  ExpenseWithCategory,
  EXPENSE_PAYMENT_METHODS,
} from '../_types/expense.types';
import { Icons } from '@/shared/_components/icons';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  expense: ExpenseWithCategory | null;
  onClose: () => void;
  onEdit: (expense: ExpenseWithCategory) => void;
  onDelete: (expense: ExpenseWithCategory) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  expense,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !expense) return null;

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
      return format(parsed, 'dd MMMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const paymentMethodObj = EXPENSE_PAYMENT_METHODS.find(
    (m) => m.value === expense.paymentMethod
  );
  const paymentMethodLabel = paymentMethodObj?.label || expense.paymentMethod;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
              <Icons.expenses size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Rincian Pengeluaran
              </h2>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                {expense.id}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icons.close size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Main Amount Callout */}
          <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-700/80 dark:text-rose-400 font-medium">
                Nominal Beban Usaha
              </p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-0.5">
                {formatRupiah(expense.amount)}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                {expense.categoryName || 'Tanpa Kategori'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 dark:text-zinc-500 font-medium">
                Tanggal Transaksi
              </span>
              <p className="font-semibold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-1.5">
                <Icons.calendar size={14} className="text-slate-400" />
                {formatDateDisplay(expense.date)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 dark:text-zinc-500 font-medium">
                Metode Pembayaran
              </span>
              <p className="font-semibold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-1.5">
                <Icons.creditCard size={14} className="text-slate-400" />
                {paymentMethodLabel}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1 text-xs">
            <span className="text-slate-400 dark:text-zinc-500 font-medium">
              Deskripsi Pengeluaran
            </span>
            <p className="text-slate-900 dark:text-white text-sm font-medium leading-relaxed bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
              {expense.description}
            </p>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="space-y-1 text-xs">
              <span className="text-slate-400 dark:text-zinc-500 font-medium">
                Catatan / Nomor Struk / Vendor
              </span>
              <p className="text-slate-700 dark:text-zinc-300 text-xs whitespace-pre-wrap bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                {expense.notes}
              </p>
            </div>
          )}

          {/* Timestamp info */}
          <div className="pt-2 text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800">
            <span>Dicatat: {expense.createdAt ? format(parseISO(expense.createdAt), 'dd/MM/yyyy HH:mm') : '-'}</span>
            <span>Local IndexedDB</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDelete(expense)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Icons.trash size={15} />
            <span>Hapus</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => onEdit(expense)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Icons.edit size={15} />
              <span>Edit Pengeluaran</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
