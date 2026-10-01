'use client';

import React, { useState } from 'react';
import { Payment } from '@/infrastructure/database/schema';
import { Icons } from '@/shared/_components/icons';
import { PaymentService } from '../_services/payment-service';

interface PaymentHistoryCardProps {
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  isCancelled: boolean;
  payments: Payment[];
  onRecordPaymentClick: () => void;
  onPaymentChange: () => void;
}

export const PaymentHistoryCard: React.FC<PaymentHistoryCardProps> = ({
  invoiceId,
  invoiceNumber,
  total,
  totalPaid,
  remainingBalance,
  isFullyPaid,
  isCancelled,
  payments,
  onRecordPaymentClick,
  onPaymentChange,
}) => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute percentage
  const percentPaid = total > 0 ? Math.min(100, Math.round((totalPaid / total) * 100)) : 0;

  const handleDeletePayment = async (paymentId: string) => {
    setIsDeleting(true);
    try {
      await PaymentService.deletePayment(paymentId);
      setDeleteTargetId(null);
      onPaymentChange();
    } catch (err) {
      console.error('Failed to delete payment', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Icons.creditCard size={16} className="text-blue-600 dark:text-blue-400" />
            Riwayat Pembayaran & Pelunasan
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Lacak cicilan, pelunasan, dan status penagihan pelanggan secara lokal.
          </p>
        </div>

        {!isCancelled && !isFullyPaid && (
          <button
            type="button"
            onClick={onRecordPaymentClick}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Icons.plus size={14} />
            <span>+ Catat Pembayaran</span>
          </button>
        )}
      </div>

      {/* Progress & Balances */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline text-xs">
          <span className="font-semibold text-slate-600 dark:text-zinc-400">
            Progress Pelunasan: <span className="text-slate-900 dark:text-white font-bold">{percentPaid}%</span>
          </span>
          <span className="text-slate-500 dark:text-zinc-400">
            Sisa: <span className="font-bold text-blue-600 dark:text-blue-400">Rp {remainingBalance.toLocaleString('id-ID')}</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFullyPaid
                ? 'bg-emerald-500'
                : percentPaid > 0
                ? 'bg-blue-600'
                : 'bg-transparent'
            }`}
            style={{ width: `${percentPaid}%` }}
          />
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">Total Tagihan</span>
            <span className="font-bold text-slate-900 dark:text-white block mt-0.5 truncate">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">Total Terbayar</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5 truncate">
              Rp {totalPaid.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">Sisa Saldo</span>
            <span className={`font-bold block mt-0.5 truncate ${remainingBalance > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              Rp {remainingBalance.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Payments History List */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
          Catatan Transaksi Masuk ({payments.length})
        </span>

        {payments.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400 dark:text-zinc-500">
            Belum ada pembayaran yang dicatat untuk faktur ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
            {payments.map((p) => (
              <div
                key={p.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {p.paymentDate}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                      {p.paymentMethod}
                    </span>
                  </div>
                  {p.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {p.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    + Rp {p.amount.toLocaleString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(p.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Hapus Catatan Pembayaran"
                  >
                    <Icons.trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Catatan Pembayaran?
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Menghapus pembayaran ini akan mengembalikan sisa tagihan dan status faktur secara otomatis.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetId(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeletePayment(deleteTargetId)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
