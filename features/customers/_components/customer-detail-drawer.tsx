'use client';

import React from 'react';
import { CustomerWithInvoiceSummary } from '../_types/customer.types';
import { Icons } from '@/shared/_components/icons';

interface CustomerDetailDrawerProps {
  isOpen: boolean;
  summary: CustomerWithInvoiceSummary | null;
  isLoading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  isOpen,
  summary,
  isLoading,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen) return null;

  const customer = summary?.customer;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const initials = customer?.name
    ? customer.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'C';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 shadow-2xl border-l border-slate-200 dark:border-zinc-800 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Detail Pelanggan
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Icons.close size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading || !customer ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Memuat data pelanggan...</p>
              </div>
            ) : (
              <>
                {/* Profile Card Header */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-200/50 dark:border-blue-500/30">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {customer.name}
                    </h3>
                    {customer.companyName && (
                      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <Icons.building size={13} className="shrink-0 text-slate-400" />
                        <span>{customer.companyName}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                      Terdaftar sejak {formatDate(customer.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Invoicing Summary Stats */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                    Aktivitas Faktur
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">Total Faktur</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        {summary?.invoiceCount ?? 0}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">Total Ditagihkan</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                        {formatCurrency(summary?.totalInvoiced ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Informasi Kontak
                  </h4>

                  {/* Email */}
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                      <Icons.mail size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 block">
                        Email
                      </span>
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {customer.email}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum dicatat</span>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Icons.phone size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 block">
                        Telepon / WhatsApp
                      </span>
                      {customer.phone ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`tel:${customer.phone}`}
                            className="text-xs text-slate-900 dark:text-white font-medium hover:underline"
                          >
                            {customer.phone}
                          </a>
                          <a
                            href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-200 transition-colors"
                          >
                            WhatsApp
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum dicatat</span>
                      )}
                    </div>
                  </div>

                  {/* Tax ID */}
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                      <Icons.fileText size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 block">
                        NPWP / Tax ID
                      </span>
                      <span className="text-xs text-slate-800 dark:text-zinc-200">
                        {customer.taxNumber || <span className="text-slate-400 italic">Belum ada</span>}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                      <Icons.mapPin size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 block">
                        Alamat Penagihan
                      </span>
                      <span className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {customer.address || <span className="text-slate-400 italic">Belum dicatat</span>}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {customer.notes && (
                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-800/30">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 block mb-1">
                        Catatan Internal
                      </span>
                      <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Actions */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20">
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <Icons.trash size={15} />
              <span>Hapus</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                <Icons.edit size={14} />
                <span>Edit Kontak</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
