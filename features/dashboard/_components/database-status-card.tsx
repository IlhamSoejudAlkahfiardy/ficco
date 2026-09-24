'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  db,
  customerRepository,
  invoiceRepository,
  productRepository,
  runDatabaseDiagnostics,
  type DiagnosticReport,
} from '@/infrastructure/database';

export const DatabaseStatusCard: React.FC = () => {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'manual'>('diagnostic');
  const [tableCounts, setTableCounts] = useState<{ customers: number; products: number; invoices: number }>({
    customers: 0,
    products: 0,
    invoices: 0,
  });
  const [latestRecords, setLatestRecords] = useState<{
    customers: unknown[];
    invoices: unknown[];
  }>({
    customers: [],
    invoices: [],
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshLiveStats = useCallback(async () => {
    try {
      const [cCount, pCount, iCount, custs, invs] = await Promise.all([
        customerRepository.count(),
        productRepository.count(),
        invoiceRepository.count(),
        customerRepository.getAll(),
        invoiceRepository.getAll(),
      ]);
      setTableCounts({ customers: cCount, products: pCount, invoices: iCount });
      setLatestRecords({
        customers: custs.slice(-3).reverse(),
        invoices: invs.slice(-3).reverse(),
      });
    } catch (err) {
      console.error('Failed to load live database stats', err);
    }
  }, []);

  const executeDiagnostic = useCallback(async () => {
    setIsRunning(true);
    try {
      const res = await runDatabaseDiagnostics();
      setReport(res);
      await refreshLiveStats();
    } finally {
      setIsRunning(false);
    }
  }, [refreshLiveStats]);

  useEffect(() => {
    executeDiagnostic();
    refreshLiveStats();
  }, [executeDiagnostic, refreshLiveStats]);

  // Manual CRUD Handlers
  const handleAddCustomer = async () => {
    const id = `cust-${Date.now().toString().slice(-6)}`;
    await customerRepository.create({
      id,
      name: `Pelanggan Test ${Math.floor(Math.random() * 900 + 100)}`,
      companyName: 'PT Sukses Mandiri',
      email: `client.${id}@example.com`,
      phone: '0812' + Math.floor(Math.random() * 89999999 + 10000000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setActionMessage(`Berhasil menambahkan Customer baru (ID: ${id}) ke IndexedDB!`);
    await refreshLiveStats();
  };

  const handleAddInvoice = async () => {
    const id = `inv-${Date.now().toString().slice(-6)}`;
    const num = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    await invoiceRepository.createWithItems(
      {
        id,
        invoiceNumber: num,
        customerId: `cust-sample`,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        status: 'pending',
        subtotal: 500000,
        discount: 50000,
        tax: 49500,
        total: 499500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      [
        {
          id: `item-${Date.now()}-1`,
          invoiceId: id,
          description: 'Layanan Konsultasi IT',
          quantity: 2,
          unitPrice: 250000,
          discount: 50000,
          taxRate: 11,
          subtotal: 450000,
          total: 499500,
        },
      ]
    );
    setActionMessage(`Berhasil membuat Faktur ${num} dengan transaksi 2 tabel ke IndexedDB!`);
    await refreshLiveStats();
  };

  const handleClearAll = async () => {
    if (confirm('Yakin ingin membersihkan seluruh data di IndexedDB lokal?')) {
      await db.clearAllTables();
      setActionMessage('Semua tabel IndexedDB berhasil dibersihkan.');
      await refreshLiveStats();
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              IndexedDB / Dexie Foundation
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              v{db.verno} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Database lokal: <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{db.name}</code> (9 Object Stores).
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('diagnostic')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'diagnostic'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Diagnostik Otomatis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Playground Manual
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900/60 flex items-center justify-between animate-in fade-in">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-blue-500 hover:text-blue-800 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab 1: Diagnostik Otomatis */}
      {activeTab === 'diagnostic' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Hasil Verifikasi Acceptance Criteria
            </span>
            <button
              type="button"
              onClick={executeDiagnostic}
              disabled={isRunning}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRunning ? 'Menguji...' : 'Uji Ulang'}
            </button>
          </div>

          <div className="space-y-2">
            {report?.results.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-slate-800 dark:text-zinc-200">
                    {item.step}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {item.message}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0 ${
                    item.passed
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {item.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>

          {report && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span>Waktu eksekusi: {report.durationMs}ms</span>
              <span>Tabel terdaftar: {report.tablesCount}/9</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Playground Manual */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 text-center">
              <span className="text-[11px] text-slate-500">Tabel Customers</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{tableCounts.customers}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 text-center">
              <span className="text-[11px] text-slate-500">Tabel Invoices</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{tableCounts.invoices}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 text-center">
              <span className="text-[11px] text-slate-500">Tabel Products</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{tableCounts.products}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleAddCustomer}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors cursor-pointer"
            >
              + Tambah Sample Customer
            </button>
            <button
              type="button"
              onClick={handleAddInvoice}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-colors cursor-pointer"
            >
              + Tambah Sample Invoice + Items
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer ml-auto"
            >
              Kosongkan Semua Tabel
            </button>
          </div>

          {/* Live Data Preview */}
          <div className="space-y-3 pt-2">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5">
                Data Customer Terkini di IndexedDB:
              </p>
              {latestRecords.customers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada data customer tersimpan.</p>
              ) : (
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-36">
                  {JSON.stringify(latestRecords.customers, null, 2)}
                </pre>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5">
                Data Invoice Terkini di IndexedDB:
              </p>
              {latestRecords.invoices.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada data invoice tersimpan.</p>
              ) : (
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-36">
                  {JSON.stringify(latestRecords.invoices, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
