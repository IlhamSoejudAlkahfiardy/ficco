'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ReportsData } from '../_types/reports.types';
import { Icons } from '@/shared/_components/icons';

interface ReportsExpenseTabProps {
  data: ReportsData | null;
  isLoading?: boolean;
}

export const ReportsExpenseTab: React.FC<ReportsExpenseTabProps> = ({
  data,
  isLoading = false,
}) => {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatShortRupiah = (val: number) => {
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`;
    return `Rp ${val}`;
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3 animate-pulse"
            >
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-7 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { expenses } = data;
  const topCategory = expenses.byCategory[0];

  return (
    <div className="space-y-6">
      {/* 1. Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
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
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(expenses.totalExpenses)}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Seluruh pengeluaran operasional
            </p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Jumlah Transaksi
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <Icons.expenses size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {expenses.totalTransactions}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Struk & pencatatan biaya tersimpan
            </p>
          </div>
        </div>

        {/* Average Expense */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Rata-rata Pengeluaran
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
              <Icons.wallet size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(expenses.averageExpense)}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Nilai per satu transaksi pengeluaran
            </p>
          </div>
        </div>

        {/* Top Category */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Kategori Terbesar
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40">
              <Icons.tag size={18} />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {topCategory ? topCategory.categoryName : '-'}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
              {topCategory ? `${formatRupiah(topCategory.totalAmount)} (${topCategory.percentage}%)` : 'Belum ada data'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual Expense Timeline Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Tren Beban Pengeluaran Bulanan
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Grafik arus beban biaya keluar berdasarkan periode waktu
          </p>
        </div>

        {expenses.periodicTrend.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
            Belum ada beban pengeluaran pada periode ini
          </div>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenses.periodicTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="periodLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatShortRupiah}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatRupiah(Number(val) || 0), 'Beban']}
                  contentStyle={{
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    borderColor: '#3f3f46',
                    borderRadius: '12px',
                    color: '#f4f4f5',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Category & Payment Method Side-by-Side Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Category Breakdown Table */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pengeluaran per Kategori
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Alokasi biaya operasional menurut jenis pos
              </p>
            </div>
          </div>

          {expenses.byCategory.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada data pengeluaran per kategori
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Transaksi</th>
                    <th className="py-2.5 px-3 text-right">Total Beban</th>
                    <th className="py-2.5 px-3 text-right">Pangsa (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-slate-800 dark:text-zinc-200">
                  {expenses.byCategory.map((c) => (
                    <tr key={c.categoryId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold">{c.categoryName}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500 dark:text-zinc-400">
                        {c.transactionCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatRupiah(c.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full"
                              style={{ width: `${Math.min(c.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold w-8 text-right">{c.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Method Breakdown Table */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Metode Pembayaran
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Kanal transaksi yang digunakan saat pembayaran beban
              </p>
            </div>
          </div>

          {expenses.byPaymentMethod.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada data metode pembayaran
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                    <th className="py-2.5 px-3">Metode Bayar</th>
                    <th className="py-2.5 px-3 text-center">Transaksi</th>
                    <th className="py-2.5 px-3 text-right">Total Beban</th>
                    <th className="py-2.5 px-3 text-right">Porsi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-slate-800 dark:text-zinc-200">
                  {expenses.byPaymentMethod.map((m) => (
                    <tr key={m.method} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold">{m.methodLabel}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500 dark:text-zinc-400">
                        {m.count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatRupiah(m.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${Math.min(m.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold w-8 text-right">{m.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
