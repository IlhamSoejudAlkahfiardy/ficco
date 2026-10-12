'use client';

import React from 'react';
import { DashboardMetrics } from '../_types/dashboard.types';
import { Icons } from '@/shared/_components/icons';

interface DashboardMetricsGridProps {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
}

const DEFAULT_METRICS: DashboardMetrics = {
  revenue: 0,
  expenses: 0,
  netProfit: 0,
  profitMargin: 0,
  outstandingAmount: 0,
  outstandingCount: 0,
  overdueAmount: 0,
  overdueCount: 0,
  paidInvoicesAmount: 0,
  paidInvoicesCount: 0,
  totalInvoicesCount: 0,
  totalExpensesCount: 0,
  revenueMoMDiff: 0,
  expenseMoMDiff: 0,
};

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({
  metrics: incomingMetrics,
  isLoading = false,
}) => {
  const metrics = incomingMetrics || DEFAULT_METRICS;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-24" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800" />
            </div>
            <div className="h-7 bg-slate-200 dark:bg-zinc-800 rounded w-36" />
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* 1. Pendapatan (Revenue) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Pendapatan
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
            <Icons.trendingUp size={18} />
          </div>
        </div>

        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatRupiah(metrics.revenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            {metrics.revenueMoMDiff !== 0 ? (
              <span
                className={`font-semibold flex items-center gap-0.5 ${
                  metrics.revenueMoMDiff > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {metrics.revenueMoMDiff > 0 ? '+' : ''}
                {metrics.revenueMoMDiff}%
              </span>
            ) : (
              <span className="text-slate-400">0%</span>
            )}
            <span className="text-slate-400 dark:text-zinc-500">vs periode lalu</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800">
          Dari pembayaran & faktur lunas
        </div>
      </div>

      {/* 2. Pengeluaran (Expenses) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Beban
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
            <Icons.trendingDown size={18} />
          </div>
        </div>

        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatRupiah(metrics.expenses)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            {metrics.expenseMoMDiff !== 0 ? (
              <span
                className={`font-semibold ${
                  metrics.expenseMoMDiff > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {metrics.expenseMoMDiff > 0 ? '+' : ''}
                {metrics.expenseMoMDiff}%
              </span>
            ) : (
              <span className="text-slate-400">0%</span>
            )}
            <span className="text-slate-400 dark:text-zinc-500">vs periode lalu</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800">
          {metrics.totalExpensesCount} transaksi tercatat
        </div>
      </div>

      {/* 3. Laba Bersih (Net Profit) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Laba Bersih
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
            <Icons.wallet size={18} />
          </div>
        </div>

        <div>
          <div
            className={`text-xl font-bold tracking-tight ${
              metrics.netProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatRupiah(metrics.netProfit)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Margin {metrics.profitMargin}%
            </span>
            <span className="text-slate-400 dark:text-zinc-500">keuntungan</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800">
          Pendapatan dikurangi beban
        </div>
      </div>

      {/* 4. Tagihan Tertunda (Outstanding) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Sisa Tagihan
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
            <Icons.clock size={18} />
          </div>
        </div>

        <div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {formatRupiah(metrics.outstandingAmount)}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {metrics.outstandingCount} faktur belum lunas
          </p>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800">
          Menunggu pelunasan klien
        </div>
      </div>

      {/* 5. Jatuh Tempo (Overdue) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Jatuh Tempo
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
            <Icons.alertCircle size={18} />
          </div>
        </div>

        <div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
            {formatRupiah(metrics.overdueAmount)}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {metrics.overdueCount} faktur melewati tempo
          </p>
        </div>

        <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium pt-1 border-t border-slate-100 dark:border-zinc-800">
          {metrics.overdueCount > 0 ? 'Perlu tindak lanjut penagihan' : 'Tidak ada tunggakan tempo'}
        </div>
      </div>
    </div>
  );
};
