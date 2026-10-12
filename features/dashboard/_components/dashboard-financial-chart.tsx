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
import {
  MonthlyFinancialTrend,
  ExpenseCategoryShare,
} from '../_types/dashboard.types';
import { Icons } from '@/shared/_components/icons';

interface DashboardFinancialChartProps {
  monthlyTrend: MonthlyFinancialTrend[];
  categoryBreakdown: ExpenseCategoryShare[];
  isLoading?: boolean;
}

export const DashboardFinancialChart: React.FC<DashboardFinancialChartProps> = ({
  monthlyTrend,
  categoryBreakdown,
  isLoading = false,
}) => {
  const formatRupiah = (val: number) => {
    if (val >= 1_000_000_000) {
      return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
    }
    if (val >= 1_000_000) {
      return `Rp ${(val / 1_000_000).toFixed(1)} jt`;
    }
    if (val >= 1_000) {
      return `Rp ${(val / 1_000).toFixed(0)} rb`;
    }
    return `Rp ${val}`;
  };

  const formatTooltipValue = (value: unknown) => {
    const num = typeof value === 'number' ? value : Number(value) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const hasTrendData = monthlyTrend.some((t) => t.revenue > 0 || t.expenses > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart: Arus Kas 6 Bulan Terakhir */}
      <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tren Keuangan (6 Bulan Terakhir)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Komparasi arus pendapatan, beban operasional, dan laba bersih
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
            Lokal
          </span>
        </div>

        {hasTrendData ? (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrend}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#88888820"
                />
                <XAxis
                  dataKey="label"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatRupiah}
                />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => {
                    const labelName =
                      name === 'revenue'
                        ? 'Pendapatan'
                        : name === 'expenses'
                        ? 'Pengeluaran'
                        : 'Laba Bersih';
                    return [formatTooltipValue(value), labelName];
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    fontSize: '12px',
                    color: '#ffffff',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const labelName =
                      value === 'revenue'
                        ? 'Pendapatan'
                        : value === 'expenses'
                        ? 'Pengeluaran'
                        : 'Laba Bersih';
                    return (
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 mr-2">
                        {labelName}
                      </span>
                    );
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="expenses"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="netProfit"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
            <Icons.reports size={32} className="opacity-50 mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
              Belum ada riwayat transaksi 6 bulan terakhir
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs mt-1">
              Catat faktur dan pengeluaran pertama Anda untuk melihat grafik arus kas otomatis.
            </p>
          </div>
        )}
      </div>

      {/* Breakdown Kategori Pengeluaran */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4 flex flex-col">
        <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Distribusi Pengeluaran
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Kategori belanja dominan periode ini
          </p>
        </div>

        {categoryBreakdown.length > 0 ? (
          <div className="space-y-3.5 flex-1 pt-1">
            {categoryBreakdown.map((item, idx) => {
              // Curated color pills
              const barColors = [
                'bg-blue-600',
                'bg-purple-600',
                'bg-amber-500',
                'bg-emerald-500',
                'bg-rose-500',
              ];
              const colorClass = barColors[idx % barColors.length];

              return (
                <div key={item.categoryId} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-800 dark:text-zinc-200 truncate max-w-[140px]">
                      {item.name}
                    </span>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0,
                        }).format(item.amount)}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500 min-w-[36px] text-right font-mono">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
            <Icons.tag size={28} className="opacity-50 mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
              Belum ada data pengeluaran
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Distribusi kategori akan muncul saat beban tercatat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
