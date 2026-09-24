import React from 'react';

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Revenue breakdowns, expense distributions, and cashflow charts.
          </p>
        </div>
      </div>

      <div className="p-12 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center text-slate-400 dark:text-zinc-500 shadow-xs">
        <p className="text-sm font-medium">Reports Module</p>
        <p className="text-xs mt-1">Recharts and financial report generation will be integrated in Step 12.</p>
      </div>
    </div>
  );
}
