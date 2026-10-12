'use client';

import React, { useState } from 'react';
import { useDashboard } from '../_hooks/use-dashboard';
import { DashboardQuickActions } from './dashboard-quick-actions';
import { DashboardMetricsGrid } from './dashboard-metrics-grid';
import { DashboardFinancialChart } from './dashboard-financial-chart';
import { DashboardRecentInvoices } from './dashboard-recent-invoices';
import { DashboardRecentExpenses } from './dashboard-recent-expenses';
import { DatabaseStatusCard } from './database-status-card';
import { Icons } from '@/shared/_components/icons';

export const DashboardView: React.FC = () => {
  const {
    data,
    isLoading,
    error,
    dateRange,
    setDateRange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    refresh,
  } = useDashboard();

  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Toolbar & Date Range Controls */}
      <DashboardQuickActions
        dateRange={dateRange}
        setDateRange={setDateRange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onRefresh={refresh}
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

      {/* 2. Executive KPI Metrics Grid */}
      <DashboardMetricsGrid
        metrics={data?.metrics}
        isLoading={isLoading}
      />

      {/* 3. Financial Trend Charts & Category Breakdown */}
      <DashboardFinancialChart
        monthlyTrend={data?.monthlyTrend || []}
        categoryBreakdown={data?.categoryBreakdown || []}
        isLoading={isLoading}
      />

      {/* 4. Recent Transactions: Invoices & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <DashboardRecentInvoices
          invoices={data?.recentInvoices || []}
          isLoading={isLoading}
        />
        <DashboardRecentExpenses
          expenses={data?.recentExpenses || []}
          isLoading={isLoading}
        />
      </div>

      {/* 5. Offline Local-First Diagnostic Accordion */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Database Lokal Offline (IndexedDB / Dexie) — 100% Berjalan Lokal
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className="text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
          >
            {showDiagnostics ? 'Sembunyikan Diagnostik ▲' : 'Tampilkan Diagnostik Database ▼'}
          </button>
        </div>

        {showDiagnostics && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <DatabaseStatusCard />
          </div>
        )}
      </div>
    </div>
  );
};
