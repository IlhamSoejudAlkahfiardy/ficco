'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { invoiceRepository } from '@/infrastructure/database/repositories/invoice-repository';
import { customerRepository } from '@/infrastructure/database/repositories/customer-repository';
import { Invoice, Customer } from '@/infrastructure/database/schema';
import { INVOICE_STATUS_CONFIG } from '../_types/invoice.types';
import { Icons } from '@/shared/_components/icons';

interface InvoiceWithCustomer {
  invoice: Invoice;
  customer?: Customer;
}

export const InvoiceListView: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allInvoices, allCustomers] = await Promise.all([
        invoiceRepository.getAll(),
        customerRepository.getAll(),
      ]);

      const customerMap = new Map(allCustomers.map((c) => [c.id, c]));

      // Sort newest first
      const mapped = allInvoices
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((inv) => ({
          invoice: inv,
          customer: customerMap.get(inv.customerId),
        }));

      setInvoices(mapped);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Summary metrics
  const stats = React.useMemo(() => {
    const totalCount = invoices.length;
    const totalAmount = invoices.reduce((sum, item) => sum + (item.invoice.total || 0), 0);
    const draftCount = invoices.filter((item) => item.invoice.status === 'draft').length;
    const paidCount = invoices.filter((item) => item.invoice.status === 'paid').length;
    const pendingCount = invoices.filter(
      (item) => item.invoice.status === 'sent' || item.invoice.status === 'pending'
    ).length;

    return { totalCount, totalAmount, draftCount, paidCount, pendingCount };
  }, [invoices]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Faktur Penjualan
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Kelola pembuatan, pelacakan, dan status penagihan faktur secara lokal.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs hover:shadow-sm transition-all self-start sm:self-auto"
        >
          <Icons.plus size={16} />
          <span>Buat Faktur Baru</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Faktur
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {stats.totalCount}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Tersimpan di IndexedDB</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Nilai Tagihan
          </p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 truncate">
            Rp {stats.totalAmount.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Akumulasi seluruh faktur</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Menunggu Pembayaran
          </p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {stats.pendingCount + stats.draftCount}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            {stats.draftCount} draf, {stats.pendingCount} terbit
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Sudah Lunas
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.paidCount}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Pembayaran terverifikasi</p>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 dark:text-zinc-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Memuat daftar faktur dari IndexedDB...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Icons.invoices size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Belum Ada Faktur
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                Mulai terbitkan faktur pertama Anda untuk menagih pembayaran ke pelanggan dengan cepat.
              </p>
            </div>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Icons.plus size={14} />
              <span>Buat Faktur Pertama</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/75 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nomor Faktur</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Tgl Terbit</th>
                  <th className="py-3.5 px-4">Jatuh Tempo</th>
                  <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {invoices.map(({ invoice, customer }) => {
                  const statusMeta = INVOICE_STATUS_CONFIG[invoice.status] || {
                    label: invoice.status,
                    colorClass: 'text-slate-600',
                    bgClass: 'bg-slate-100',
                    borderClass: 'border-slate-200',
                  };

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-zinc-200">
                          {customer?.name || 'Pelanggan Tidak Dikenal'}
                        </div>
                        {customer?.companyName && (
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                            {customer.companyName}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                        {invoice.issueDate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                        {invoice.dueDate}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        Rp {invoice.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.colorClass} ${statusMeta.bgClass} ${statusMeta.borderClass}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
