'use client';

import React from 'react';
import { Customer } from '../_types/customer.types';
import { Icons } from '@/shared/_components/icons';

interface CustomerDeleteDialogProps {
  isOpen: boolean;
  target: {
    customer: Customer;
    invoiceCount: number;
  } | null;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  isSubmitting: boolean;
}

export const CustomerDeleteDialog: React.FC<CustomerDeleteDialogProps> = ({
  isOpen,
  target,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  if (!isOpen || !target) return null;

  const { customer, invoiceCount } = target;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
        {/* Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Icons.trash size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Pelanggan?
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Tindakan ini akan menghapus data kontak dari IndexedDB perangkat ini.
            </p>
          </div>
        </div>

        {/* Customer Identity Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Nama:</span>
            <span className="font-bold text-slate-900 dark:text-white">{customer.name}</span>
          </div>
          {customer.companyName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Perusahaan:</span>
              <span className="text-slate-700 dark:text-zinc-300 font-medium">
                {customer.companyName}
              </span>
            </div>
          )}
        </div>

        {/* Warning if invoices exist */}
        {invoiceCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <Icons.alertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Perhatian: Klien Memiliki {invoiceCount} Faktur</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400 leading-normal">
                Pelanggan ini tercatat pada {invoiceCount} faktur. Faktur lama Anda tetap tersimpan
                namun tautan pelanggan akan menjadi referensi statis.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>Ya, Hapus Pelanggan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
