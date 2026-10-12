'use client';

import React from 'react';
import Link from 'next/link';
import { RecentInvoiceItem } from '../_types/dashboard.types';
import { Icons } from '@/shared/_components/icons';

interface DashboardRecentInvoicesProps {
  invoices: RecentInvoiceItem[];
  isLoading?: boolean;
}

export const DashboardRecentInvoices: React.FC<DashboardRecentInvoicesProps> = ({
  invoices,
  isLoading = false,
}) => {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Lunas',
          classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        };
      case 'partially_paid':
        return {
          label: 'Sebagian',
          classes: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        };
      case 'overdue':
        return {
          label: 'Jatuh Tempo',
          classes: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
        };
      case 'sent':
        return {
          label: 'Terkirim',
          classes: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        };
      case 'cancelled':
        return {
          label: 'Dibatalkan',
          classes: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200 dark:border-zinc-700',
        };
      case 'draft':
      default:
        return {
          label: 'Draft',
          classes: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
        };
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Icons.invoices size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Faktur Terbaru
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              5 transaksi penjualan terakhir
            </p>
          </div>
        </div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          Lihat Semua
          <Icons.arrowUpRight size={14} />
        </Link>
      </div>

      <div className="flex-1 mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-slate-100 dark:bg-zinc-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mb-3">
              <Icons.invoices size={24} />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Belum ada faktur penjualan
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-xs">
              Buat faktur penagihan pertama untuk mulai melacak pendapatan Anda.
            </p>
            <Link
              href="/invoices/create"
              className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              + Buat Faktur
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {invoices.map((inv) => {
              const badge = getStatusBadge(inv.status);
              return (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="group flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition -mx-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                        {inv.customerName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right pl-3 shrink-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatRupiah(inv.total)}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                      Jatuh tempo: {formatDate(inv.dueDate)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
