'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardDateRangePreset } from '../_types/dashboard.types';
import { AppSelect } from '@/shared/_components/select';
import { Icons } from '@/shared/_components/icons';

interface DashboardQuickActionsProps {
  dateRange: DashboardDateRangePreset;
  setDateRange: (range: DashboardDateRangePreset) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const DATE_OPTIONS = [
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'this_year', label: 'Tahun Ini' },
  { value: 'all', label: 'Semua Periode' },
  { value: 'custom', label: 'Pilih Rentang Tanggal' },
];

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  dateRange,
  setDateRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Ringkasan Keuangan
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Pantau arus kas, kinerja faktur, dan efisiensi pengeluaran usaha secara real-time.
        </p>
      </div>

      {/* Action Controls & Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Date Filter Dropdown */}
        <div className="w-44">
          <AppSelect
            value={dateRange}
            onChange={(val) => setDateRange(val as DashboardDateRangePreset)}
            options={DATE_OPTIONS}
            placeholder="Pilih Periode"
          />
        </div>

        {/* Custom Date Pickers if 'custom' is selected */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-2 py-1 shadow-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-transparent text-slate-800 dark:text-zinc-200 outline-hidden"
              placeholder="Dari"
            />
            <span className="text-xs text-slate-400 dark:text-zinc-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-transparent text-slate-800 dark:text-zinc-200 outline-hidden"
              placeholder="Sampai"
            />
          </div>
        )}

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Segarkan Data"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors shadow-xs disabled:opacity-50"
        >
          <div className={isLoading ? 'animate-spin' : ''}>
            <Icons.refresh size={16} />
          </div>
        </button>

        {/* Quick Action: Catat Pengeluaran */}
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors shadow-xs"
        >
          <Icons.expenses size={15} />
          <span>+ Biaya</span>
        </Link>

        {/* Quick Action: Buat Faktur */}
        <Link
          href="/invoices/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs shadow-blue-500/20"
        >
          <Icons.plus size={15} />
          <span>+ Faktur Baru</span>
        </Link>
      </div>
    </div>
  );
};
