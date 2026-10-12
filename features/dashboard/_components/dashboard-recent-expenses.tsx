'use client';

import React from 'react';
import Link from 'next/link';
import { RecentExpenseItem } from '../_types/dashboard.types';
import { Icons } from '@/shared/_components/icons';

interface DashboardRecentExpensesProps {
  expenses: RecentExpenseItem[];
  isLoading?: boolean;
}

export const DashboardRecentExpenses: React.FC<DashboardRecentExpensesProps> = ({
  expenses,
  isLoading = false,
}) => {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Transfer Bank';
      case 'cash':
        return 'Tunai';
      case 'e_wallet':
        return 'E-Wallet';
      case 'credit_card':
        return 'Kartu Kredit';
      case 'qris':
        return 'QRIS';
      default:
        return method || 'Lainnya';
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Icons.expenses size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Pengeluaran Terbaru
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              5 transaksi biaya operasional terakhir
            </p>
          </div>
        </div>
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
        >
          Lihat Semua
          <Icons.arrowUpRight size={14} />
        </Link>
      </div>

      <div className="flex-1 mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-slate-100 dark:bg-zinc-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mb-3">
              <Icons.expenses size={24} />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Belum ada pengeluaran
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-xs">
              Catat biaya operasional dan pengeluaran usaha untuk memantau arus kas Anda.
            </p>
            <Link
              href="/expenses"
              className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
            >
              + Catat Pengeluaran
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition -mx-2"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {exp.description}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shrink-0">
                      {exp.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                    <span>{formatDate(exp.date)}</span>
                    <span>•</span>
                    <span>{formatPaymentMethod(exp.paymentMethod)}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    -{formatRupiah(exp.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
