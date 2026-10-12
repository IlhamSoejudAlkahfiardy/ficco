'use client';

import React from 'react';
import { useReports } from '../_hooks/use-reports';
import { ReportsFilterBar } from './reports-filter-bar';
import { ReportsProfitLossTab } from './reports-profit-loss-tab';
import { ReportsRevenueTab } from './reports-revenue-tab';
import { ReportsExpenseTab } from './reports-expense-tab';
import {
  exportProfitLossCsv,
  exportRevenueCsv,
  exportExpenseCsv,
} from '../_utils/reports-csv-export';
import { Icons } from '@/shared/_components/icons';

export const ReportsView: React.FC = () => {
  const {
    data,
    isLoading,
    error,
    preset,
    setPreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    activeTab,
    setActiveTab,
    refresh,
  } = useReports();

  const handleExportCsv = () => {
    if (!data) return;
    switch (activeTab) {
      case 'profit_loss':
        exportProfitLossCsv(data);
        break;
      case 'revenue':
        exportRevenueCsv(data);
        break;
      case 'expenses':
        exportExpenseCsv(data);
        break;
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Toolbar, Navigation Tabs & Date Range Filter */}
      <ReportsFilterBar
        preset={preset}
        setPreset={setPreset}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={refresh}
        onExportCsv={handleExportCsv}
        onPrint={handlePrint}
        isLoading={isLoading}
      />

      {/* Error Notice if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icons.alertCircle size={20} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 2. Active Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'profit_loss' && (
          <ReportsProfitLossTab data={data} isLoading={isLoading} />
        )}
        {activeTab === 'revenue' && (
          <ReportsRevenueTab data={data} isLoading={isLoading} />
        )}
        {activeTab === 'expenses' && (
          <ReportsExpenseTab data={data} isLoading={isLoading} />
        )}
      </div>

      {/* 3. Footer Offline Guarantee Note */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Laporan dihitung 100% secara lokal dari IndexedDB (Zero-Knowledge Server).</span>
        </div>
        {data && (
          <span>
            Rentang aktif: {data.startDate} s/d {data.endDate}
          </span>
        )}
      </div>
    </div>
  );
};
