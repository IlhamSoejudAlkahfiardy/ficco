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

interface ReportsRevenueTabProps {
  data: ReportsData | null;
  isLoading?: boolean;
}

export const ReportsRevenueTab: React.FC<ReportsRevenueTabProps> = ({
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

  const { revenue } = data;

  return (
    <div className="space-y-6">
      {/* 1. Summary KPI Cards */}
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
              {formatRupiah(revenue.totalRevenue)}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {revenue.invoicesPaidCount} faktur telah dilunasi
            </p>
          </div>
        </div>

        {/* Total Invoiced */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Ditagihkan
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <Icons.invoices size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(revenue.totalInvoiced)}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Dari {revenue.totalInvoicesCount} faktur penjualan diterbitkan
            </p>
          </div>
        </div>

        {/* Collection Efficiency Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Tingkat Pelunasan
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/40">
              <Icons.check size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 tracking-tight">
              {revenue.collectionRate}%
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Rasio tagihan yang berhasil dicairkan
            </p>
          </div>
        </div>

        {/* Average Invoice Value */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Rata-rata Nilai Faktur
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
              <Icons.wallet size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(revenue.averageInvoiceValue)}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Ukuran rata-rata transaksi per faktur
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual Revenue Timeline Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Tren Penerimaan Pendapatan
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Grafik arus pendapatan kas masuk berdasarkan periode waktu
          </p>
        </div>

        {revenue.periodicTrend.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
            Belum ada penerimaan pendapatan pada periode ini
          </div>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue.periodicTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="periodLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatShortRupiah}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatRupiah(Number(val) || 0), 'Pendapatan']}
                  contentStyle={{
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    borderColor: '#3f3f46',
                    borderRadius: '12px',
                    color: '#f4f4f5',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Revenue By Customer Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pendapatan Berdasarkan Pelanggan
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Peringkat kontribusi klien terhadap total pendapatan bisnis
            </p>
          </div>
        </div>

        {revenue.byCustomer.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada transaksi pendapatan per pelanggan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                  <th className="py-3 px-3">Nama Pelanggan</th>
                  <th className="py-3 px-3 text-center">Total Faktur</th>
                  <th className="py-3 px-3 text-center">Faktur Lunas</th>
                  <th className="py-3 px-3 text-right">Total Pendapatan</th>
                  <th className="py-3 px-3 text-right">Kontribusi (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-slate-800 dark:text-zinc-200">
                {revenue.byCustomer.map((c) => (
                  <tr key={c.customerId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-3 font-semibold">{c.customerName}</td>
                    <td className="py-3 px-3 text-center text-slate-500 dark:text-zinc-400">
                      {c.invoicesCount}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 dark:text-zinc-400">
                      {c.paidInvoicesCount}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(c.totalRevenue)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(c.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold w-9 text-right">{c.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Revenue By Product / Service Table */}
      {revenue.byProduct.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pendapatan Berdasarkan Produk & Layanan
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Volume penjualan dan nilai perolehan per item barang atau jasa
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                  <th className="py-3 px-3">Produk / Layanan</th>
                  <th className="py-3 px-3 text-center">Kuantitas Terjual</th>
                  <th className="py-3 px-3 text-right">Total Nilai Penjualan</th>
                  <th className="py-3 px-3 text-right">Pangsa (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-slate-800 dark:text-zinc-200">
                {revenue.byProduct.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-3 font-semibold">{p.productName}</td>
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-zinc-300 font-medium">
                      {p.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatRupiah(p.totalRevenue)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${Math.min(p.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold w-9 text-right">{p.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
