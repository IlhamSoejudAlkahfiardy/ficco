import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Overview of your financial performance and active operations.
          </p>
        </div>
      </div>

      {/* Placeholder Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Revenue', value: 'Rp 0', sub: 'From paid invoices' },
          { title: 'Total Expenses', value: 'Rp 0', sub: 'Across all categories' },
          { title: 'Net Profit', value: 'Rp 0', sub: 'Revenue minus expenses' },
          { title: 'Pending Invoices', value: '0', sub: 'Awaiting payment' },
        ].map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {card.title}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {card.value}
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder Content Area */}
      <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center text-slate-400 dark:text-zinc-500 shadow-xs">
        <p className="text-sm font-medium">Step 4 Application Shell Active</p>
        <p className="text-xs mt-1">Domain business logic and Dexie persistence will be attached in subsequent steps.</p>
      </div>
    </div>
  );
}
