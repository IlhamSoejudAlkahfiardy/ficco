'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InvoiceDomainService, InvoiceFullDetails } from '../_services/invoice-domain-service';
import { settingsRepository } from '@/infrastructure/database/repositories/settings-repository';
import { INVOICE_STATUS_CONFIG, InvoiceStatus } from '../_types/invoice.types';
import { Icons } from '@/shared/_components/icons';
import { PaymentModal } from './payment-modal';
import { PaymentHistoryCard } from './payment-history-card';

interface InvoiceDetailViewProps {
  invoiceId: string;
  isDrawer?: boolean;
  onClose?: () => void;
  onInvoiceUpdated?: () => void;
  onInvoiceDeleted?: () => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoiceId,
  isDrawer = false,
  onClose,
  onInvoiceUpdated,
  onInvoiceDeleted,
}) => {
  const router = useRouter();

  const [details, setDetails] = useState<InvoiceFullDetails | null>(null);
  const [companyProfile, setCompanyProfile] = useState<{
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invoiceDetails, profile] = await Promise.all([
        InvoiceDomainService.getFullDetails(invoiceId),
        settingsRepository.get<any>('company_profile'),
      ]);

      if (!invoiceDetails) {
        setError('Faktur tidak ditemukan atau telah dihapus.');
      } else {
        setDetails(invoiceDetails);
        setCompanyProfile(profile);
      }
    } catch (err) {
      console.error('Failed to load invoice details', err);
      setError((err as Error).message || 'Gagal memuat rincian faktur.');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copy invoice number
  const handleCopyInvoiceNumber = () => {
    if (details?.invoice.invoiceNumber) {
      navigator.clipboard.writeText(details.invoice.invoiceNumber);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  // Change status (e.g. Sent, Cancelled)
  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    setIsProcessing(true);
    try {
      await InvoiceDomainService.updateStatus(invoiceId, newStatus);
      await loadData();
      if (onInvoiceUpdated) onInvoiceUpdated();
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async () => {
    setIsProcessing(true);
    try {
      await InvoiceDomainService.deleteInvoice(invoiceId);
      setShowDeleteConfirm(false);
      if (onInvoiceDeleted) {
        onInvoiceDeleted();
      } else {
        router.push('/invoices');
      }
    } catch (err) {
      console.error('Failed to delete invoice', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px] space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          Memuat rincian dokumen faktur...
        </p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <Icons.alertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Dokumen Tidak Ditemukan
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {error || 'Faktur yang Anda minta tidak tersedia di database lokal IndexedDB.'}
          </p>
        </div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors"
        >
          <Icons.arrowLeft size={14} />
          <span>Kembali ke Daftar Faktur</span>
        </Link>
      </div>
    );
  }

  const { invoice, items, customer, calculation, paymentSummary } = details;
  const statusConfig = INVOICE_STATUS_CONFIG[invoice.status] || {
    label: invoice.status,
    colorClass: 'text-slate-600',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
    description: '',
  };

  return (
    <div className={`space-y-6 ${isDrawer ? 'p-6' : 'max-w-4xl mx-auto pb-16'} animate-in fade-in duration-300`}>
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-zinc-800 print:hidden">
        <div className="flex items-center gap-3">
          {isDrawer ? (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Tutup Panel"
            >
              <Icons.close size={18} />
            </button>
          ) : (
            <Link
              href="/invoices"
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Kembali ke Daftar Faktur"
            >
              <Icons.arrowLeft size={18} />
            </Link>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {invoice.invoiceNumber}
              </h1>
              <button
                type="button"
                onClick={handleCopyInvoiceNumber}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                title="Salin Nomor Faktur"
              >
                {copiedNumber ? <Icons.check size={14} className="text-emerald-500" /> : <Icons.fileText size={14} />}
              </button>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.colorClass} ${statusConfig.bgClass} ${statusConfig.borderClass}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Diterbitkan: {invoice.issueDate} • Jatuh Tempo: {invoice.dueDate}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Record Payment Button */}
          {invoice.status !== 'cancelled' && !paymentSummary.isFullyPaid && (
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Icons.creditCard size={14} />
              <span>Catat Pembayaran</span>
            </button>
          )}

          {/* Print / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Icons.reports size={14} />
            <span>Cetak Faktur</span>
          </button>

          {/* Edit */}
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Icons.edit size={14} />
            <span>Edit</span>
          </Link>

          {/* Status Quick Actions */}
          {invoice.status === 'draft' && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleStatusChange('sent')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Icons.check size={14} />
              <span>Tandai Terbit</span>
            </button>
          )}

          {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleStatusChange('cancelled')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors disabled:opacity-50"
            >
              Batalkan
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Hapus Faktur"
          >
            <Icons.trash size={16} />
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header (Seller & Document Info) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start pb-6 border-b border-slate-100 dark:border-zinc-800">
          {/* Seller / Company */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Penerbit Faktur
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {companyProfile?.companyName || 'Usaha / Perusahaan Anda'}
            </h2>
            {companyProfile?.address && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                {companyProfile.address}
              </p>
            )}
            <div className="pt-1 text-xs text-slate-500 dark:text-zinc-400 space-y-0.5">
              {companyProfile?.phone && <p>Telp: {companyProfile.phone}</p>}
              {companyProfile?.email && <p>Email: {companyProfile.email}</p>}
              {companyProfile?.taxNumber && <p>NPWP: {companyProfile.taxNumber}</p>}
            </div>
          </div>

          {/* Invoice Meta Box */}
          <div className="sm:text-right space-y-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              FAKTUR
            </h3>
            <p className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
              {invoice.invoiceNumber}
            </p>
            <div className="pt-2 text-xs text-slate-500 dark:text-zinc-400 space-y-1">
              <div className="flex sm:justify-end gap-2">
                <span className="font-semibold text-slate-600 dark:text-zinc-300">Tanggal Terbit:</span>
                <span>{invoice.issueDate}</span>
              </div>
              <div className="flex sm:justify-end gap-2">
                <span className="font-semibold text-slate-600 dark:text-zinc-300">Jatuh Tempo:</span>
                <span className={paymentSummary.isOverdue ? 'font-bold text-rose-600' : ''}>
                  {invoice.dueDate}
                </span>
              </div>
              <div className="flex sm:justify-end gap-2">
                <span className="font-semibold text-slate-600 dark:text-zinc-300">Status:</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">{statusConfig.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Customer Section */}
        <div className="space-y-1 pb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Ditagihkan Kepada (Klien):
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {customer?.name || 'Pelanggan'}
          </h3>
          {customer?.companyName && (
            <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              {customer.companyName}
            </p>
          )}
          {customer?.address && (
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm">
              {customer.address}
            </p>
          )}
          <div className="pt-1 text-xs text-slate-500 dark:text-zinc-400 flex flex-wrap gap-x-4 gap-y-0.5">
            {customer?.email && <span>Email: {customer.email}</span>}
            {customer?.phone && <span>Telp: {customer.phone}</span>}
            {customer?.taxNumber && <span>NPWP: {customer.taxNumber}</span>}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-2 w-8 text-center">#</th>
                <th className="py-2.5 px-3">Deskripsi Item / Jasa</th>
                <th className="py-2.5 px-3 text-right">Kuantitas</th>
                <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                <th className="py-2.5 px-3 text-right">Diskon</th>
                <th className="py-2.5 px-3 text-right">Pajak</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                  <td className="py-3 px-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{item.description}</p>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-zinc-300">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-zinc-300">
                    Rp {item.unitPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-500">
                    {item.discount > 0 ? `Rp ${item.discount.toLocaleString('id-ID')}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-500">
                    {item.taxRate > 0 ? `${item.taxRate}%` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    Rp {item.total.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Notes & Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 items-start border-t border-slate-100 dark:border-zinc-800">
          {/* Notes (7 Cols) */}
          <div className="md:col-span-7 space-y-3">
            {invoice.notes ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Catatan & Ketentuan Pembayaran:
                </span>
                <p className="text-xs text-slate-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed font-mono">
                  {invoice.notes}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Tidak ada catatan penagihan khusus.</p>
            )}

            {/* Payment Balance Box */}
            <div className="p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-[11px]">
                Status Pembayaran:
              </span>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Total Terbayar:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Rp {paymentSummary.totalPaid.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Sisa Tagihan:</span>
                <span className={`font-bold ${paymentSummary.remainingBalance > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                  Rp {paymentSummary.remainingBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Totals Summary (5 Cols) */}
          <div className="md:col-span-5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                Rp {calculation.subtotal.toLocaleString('id-ID')}
              </span>
            </div>

            {calculation.totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Total Diskon:</span>
                <span className="font-semibold">
                  - Rp {calculation.totalDiscount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Dasar Pengenaan Pajak (DPP):</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                Rp {calculation.taxableAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Total PPN / Pajak:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                Rp {calculation.totalTax.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="pt-3 border-t-2 border-slate-200 dark:border-zinc-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Grand Total:
              </span>
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                Rp {calculation.grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History & Management Section (Hidden during Print) */}
      <div className="print:hidden">
        <PaymentHistoryCard
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          total={invoice.total}
          totalPaid={paymentSummary.totalPaid}
          remainingBalance={paymentSummary.remainingBalance}
          isFullyPaid={paymentSummary.isFullyPaid}
          isCancelled={invoice.status === 'cancelled'}
          payments={details.payments || []}
          onRecordPaymentClick={() => setIsPaymentModalOpen(true)}
          onPaymentChange={() => {
            loadData();
            if (onInvoiceUpdated) onInvoiceUpdated();
          }}
        />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        customerName={customer?.name}
        totalAmount={invoice.total}
        remainingBalance={paymentSummary.remainingBalance}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={() => {
          loadData();
          if (onInvoiceUpdated) onInvoiceUpdated();
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                <Icons.trash size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Faktur Ini?
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Tindakan ini permanen dan akan menghapus seluruh data item terkait di IndexedDB.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 text-xs space-y-1">
              <p><span className="font-semibold">Nomor:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-semibold">Klien:</span> {customer?.name || '—'}</p>
              <p><span className="font-semibold">Total:</span> Rp {invoice.total.toLocaleString('id-ID')}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDeleteInvoice}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                {isProcessing ? 'Menghapus...' : 'Ya, Hapus Faktur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
