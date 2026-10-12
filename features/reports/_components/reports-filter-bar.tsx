'use client';

import React from 'react';
import { ReportDatePreset } from '../_types/reports.types';
import { ReportTab } from '../_hooks/use-reports';
import { AppSelect } from '@/shared/_components/select';
import { Icons } from '@/shared/_components/icons';

interface ReportsFilterBarProps {
  preset: ReportDatePreset;
  setPreset: (preset: ReportDatePreset) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  activeTab: ReportTab;
  setActiveTab: (tab: ReportTab) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
  isLoading?: boolean;
}

const PRESET_OPTIONS = [
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'this_quarter', label: 'Kuartal Ini' },
  { value: 'this_year', label: 'Tahun Ini' },
  { value: 'all', label: 'Semua Periode' },
  { value: 'custom', label: 'Rentang Kustom' },
];

export const ReportsFilterBar: React.FC<ReportsFilterBarProps> = ({
  preset,
  setPreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  activeTab,
  setActiveTab,
  onRefresh,
  onExportCsv,
  onPrint,
  isLoading = false,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Header Title & Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Analisis menyeluruh pendapatan, beban operasional, dan ringkasan laba rugi usaha.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Segarkan Data"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors shadow-2xs disabled:opacity-50"
          >
            <div className={isLoading ? 'animate-spin' : ''}>
              <Icons.refresh size={16} />
            </div>
          </button>

          {/* Unduh CSV Button */}
          <button
            type="button"
            onClick={onExportCsv}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors shadow-2xs"
          >
            <Icons.download size={15} />
            <span>Ekspor CSV</span>
          </button>

          {/* Cetak / PDF Print Button */}
          <button
            type="button"
            onClick={onPrint}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors shadow-2xs"
          >
            <Icons.printer size={15} />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Bar: Navigation Tabs & Date Range Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-zinc-800/60 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('profit_loss')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'profit_loss'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Ringkasan Laba Rugi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'revenue'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Laporan Pendapatan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'expenses'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Laporan Pengeluaran
          </button>
        </div>

        {/* Date Filter & Custom Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <AppSelect
              value={preset}
              onChange={(val) => setPreset(val as ReportDatePreset)}
              options={PRESET_OPTIONS}
              placeholder="Pilih Periode"
            />
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs bg-transparent text-slate-800 dark:text-zinc-200 outline-hidden"
              />
              <span className="text-xs text-slate-400 dark:text-zinc-500">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs bg-transparent text-slate-800 dark:text-zinc-200 outline-hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
