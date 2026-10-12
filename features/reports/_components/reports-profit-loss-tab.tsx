'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ReportsData } from '../_types/reports.types';
import { Icons } from '@/shared/_components/icons';

interface ReportsProfitLossTabProps {
  data: ReportsData | null;
  isLoading?: boolean;
}

export const ReportsProfitLossTab: React.FC<ReportsProfitLossTabProps> = ({
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
        <div className="h-80 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 animate-pulse" />
      </div>
    );
  }

  const { profitLoss, periodicRows } = data;

  return (
    <div className="space-y-6">
      {/* 1. Executive Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
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
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(profitLoss.revenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span
                className={`font-semibold ${
                  profitLoss.revenueGrowth >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {profitLoss.revenueGrowth > 0 ? '+' : ''}
                {profitLoss.revenueGrowth}%
              </span>
              <span className="text-slate-400 dark:text-zinc-500">vs periode lalu</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Beban Operasional
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
              <Icons.trendingDown size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(profitLoss.expenses)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span
                className={`font-semibold ${
                  profitLoss.expenseGrowth > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {profitLoss.expenseGrowth > 0 ? '+' : ''}
                {profitLoss.expenseGrowth}%
              </span>
              <span className="text-slate-400 dark:text-zinc-500">vs periode lalu</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
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
              className={`text-2xl font-bold tracking-tight ${
                profitLoss.netProfit >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatRupiah(profitLoss.netProfit)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span
                className={`font-semibold ${
                  profitLoss.netProfitGrowth >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {profitLoss.netProfitGrowth > 0 ? '+' : ''}
                {profitLoss.netProfitGrowth}%
              </span>
              <span className="text-slate-400 dark:text-zinc-500">vs periode lalu</span>
            </div>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Margin Keuntungan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
              <Icons.clock size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {profitLoss.profitMargin}%
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Rasio laba bersih terhadap pendapatan
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual Trend Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Grafik Komparasi Pendapatan vs Beban vs Laba Bersih
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Visualisasi historis performa laba rugi per periode bulanan
            </p>
          </div>
        </div>

        {periodicRows.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            Belum ada data transaksi dalam periode terpilih
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodicRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="periodLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatShortRupiah}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatRupiah(Number(val) || 0), '']}
                  contentStyle={{
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    borderColor: '#3f3f46',
                    borderRadius: '12px',
                    color: '#f4f4f5',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Beban Operasional" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" name="Laba Bersih" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Detailed P&L Periodic Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tabel Rincian Laba Rugi Per Periode
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Rincian angka pendapatan, beban, laba, margin, dan volume transaksi
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                <th className="py-3 px-3">Periode</th>
                <th className="py-3 px-3 text-right">Pendapatan</th>
                <th className="py-3 px-3 text-right">Beban Operasional</th>
                <th className="py-3 px-3 text-right">Laba/Rugi Bersih</th>
                <th className="py-3 px-3 text-right">Margin (%)</th>
                <th className="py-3 px-3 text-center">Faktur Terbit</th>
                <th className="py-3 px-3 text-center">Transaksi Beban</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-slate-800 dark:text-zinc-200">
              {periodicRows.map((row) => (
                <tr key={row.periodKey} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                  <td className="py-3 px-3 font-semibold">{row.periodLabel}</td>
                  <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(row.revenue)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-rose-600 dark:text-rose-400">
                    {formatRupiah(row.expenses)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold ${
                      row.netProfit >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatRupiah(row.netProfit)}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold">
                    {row.profitMargin}%
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500 dark:text-zinc-400">
                    {row.invoicesCount}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500 dark:text-zinc-400">
                    {row.expensesCount}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-zinc-700 font-bold bg-slate-50/50 dark:bg-zinc-800/30 text-slate-900 dark:text-white">
                <td className="py-3.5 px-3">TOTAL KESELURUHAN</td>
                <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(profitLoss.revenue)}
                </td>
                <td className="py-3.5 px-3 text-right text-rose-600 dark:text-rose-400">
                  {formatRupiah(profitLoss.expenses)}
                </td>
                <td
                  className={`py-3.5 px-3 text-right ${
                    profitLoss.netProfit >= 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatRupiah(profitLoss.netProfit)}
                </td>
                <td className="py-3.5 px-3 text-right">{profitLoss.profitMargin}%</td>
                <td className="py-3.5 px-3 text-center text-slate-600 dark:text-zinc-300">
                  {data.revenue.totalInvoicesCount}
                </td>
                <td className="py-3.5 px-3 text-center text-slate-600 dark:text-zinc-300">
                  {data.expenses.totalTransactions}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
