'use client';

import React from 'react';
import { InvoiceFullDetails } from '../_services/invoice-domain-service';
import { CompanyProfile } from '@/features/settings/_types/settings.types';
import { INVOICE_STATUS_CONFIG } from '../_types/invoice.types';

export interface InvoicePreviewSheetProps {
  details: InvoiceFullDetails;
  companyProfile?: Partial<CompanyProfile> | null;
  paymentInstructions?: string | null;
  className?: string;
}

export const InvoicePreviewSheet: React.FC<InvoicePreviewSheetProps> = ({
  details,
  companyProfile,
  paymentInstructions,
  className = '',
}) => {
  const { invoice, items, customer, calculation, paymentSummary, payments = [] } = details;

  const statusConfig = INVOICE_STATUS_CONFIG[invoice.status] || {
    label: invoice.status,
    colorClass: 'text-slate-600',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
    description: '',
  };

  const isOverdue = paymentSummary.isOverdue;

  return (
    <div
      className={`bg-white text-slate-900 shadow-xl border border-slate-200/90 rounded-sm w-full max-w-[210mm] min-h-[297mm] mx-auto p-10 sm:p-12 font-sans flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0 printable-invoice-sheet ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Top Content */}
      <div className="space-y-7">
        {/* Top Accent Bar */}
        <div className="h-1.5 -mx-10 sm:-mx-12 -mt-10 sm:-mt-12 bg-blue-600 print:hidden" />

        {/* 1. Header: Seller & Invoice Document Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
          {/* Seller / Company */}
          <div className="space-y-2 max-w-sm">
            {companyProfile?.logo && (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyProfile.logo}
                  alt={companyProfile.name || 'Company Logo'}
                  className="h-12 max-w-[180px] object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                {companyProfile?.name || companyProfile?.legalName || 'Ficco Local Business'}
              </h1>
              {companyProfile?.legalName && companyProfile.legalName !== companyProfile.name && (
                <p className="text-xs text-slate-500 font-medium">{companyProfile.legalName}</p>
              )}
            </div>

            {companyProfile?.address && (
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {companyProfile.address}
              </p>
            )}

            <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
              {companyProfile?.phone && <span>Telp: {companyProfile.phone}</span>}
              {companyProfile?.email && <span>Email: {companyProfile.email}</span>}
              {companyProfile?.taxNumber && <span>NPWP: {companyProfile.taxNumber}</span>}
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="sm:text-right space-y-2 shrink-0">
            <h2 className="text-2xl font-black uppercase tracking-wider text-blue-900">
              FAKTUR PENJUALAN
            </h2>
            <p className="font-mono text-base font-bold text-blue-600">
              {invoice.invoiceNumber}
            </p>

            <div className="inline-block sm:ml-auto">
              <span
                className={`px-3 py-1 rounded-md text-xs font-bold border ${statusConfig.colorClass} ${statusConfig.bgClass} ${statusConfig.borderClass}`}
              >
                {statusConfig.label.toUpperCase()}
              </span>
            </div>

            <div className="pt-2 text-xs space-y-1 text-slate-600">
              <div className="flex sm:justify-end gap-3">
                <span className="font-semibold text-slate-700">Tanggal Terbit:</span>
                <span>{invoice.issueDate}</span>
              </div>
              <div className="flex sm:justify-end gap-3">
                <span className="font-semibold text-slate-700">Jatuh Tempo:</span>
                <span className={isOverdue ? 'font-bold text-rose-600' : ''}>
                  {invoice.dueDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Customer Section (Bill To) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            DITAGIHKAN KEPADA (BILL TO):
          </p>
          <h3 className="text-sm font-bold text-slate-900">
            {customer?.name || 'Pelanggan Tunai / Langsung'}
          </h3>
          {customer?.companyName && (
            <p className="text-xs font-semibold text-slate-700">{customer.companyName}</p>
          )}
          {customer?.address && (
            <p className="text-xs text-slate-600 leading-relaxed max-w-lg">{customer.address}</p>
          )}
          <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-0.5 pt-0.5">
            {customer?.email && <span>Email: {customer.email}</span>}
            {customer?.phone && <span>Telp: {customer.phone}</span>}
            {customer?.taxNumber && <span>NPWP: {customer.taxNumber}</span>}
          </div>
        </div>

        {/* 3. Items Table */}
        <div className="overflow-hidden border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-3">Deskripsi Item / Jasa</th>
                <th className="py-2.5 px-3 text-right w-16">Qty</th>
                <th className="py-2.5 px-3 text-right w-28">Harga Satuan</th>
                <th className="py-2.5 px-3 text-right w-24">Diskon</th>
                <th className="py-2.5 px-3 text-right w-16">Pajak</th>
                <th className="py-2.5 px-3 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-slate-900">{item.description}</p>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                    Rp {item.unitPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-500">
                    {item.discount > 0 ? `Rp ${item.discount.toLocaleString('id-ID')}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-500">
                    {item.taxRate > 0 ? `${item.taxRate}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    Rp {item.total.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Notes & Financial Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2 items-start">
          {/* Left Column (7 cols): Notes, Bank Info, Payment History */}
          <div className="sm:col-span-7 space-y-3">
            {invoice.notes && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Catatan & Ketentuan:
                </p>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                  {invoice.notes}
                </p>
              </div>
            )}

            {paymentInstructions && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                  Informasi Rekening Pembayaran:
                </p>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                  {paymentInstructions}
                </p>
              </div>
            )}

            {payments.length > 0 && (
              <div className="p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Riwayat Pembayaran Diterima:
                </p>
                <div className="space-y-1 text-slate-600">
                  {payments.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex justify-between text-[11px]">
                      <span>
                        {p.paymentDate} • {p.paymentMethod.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-900">
                        Rp {p.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Totals & Payment Balance */}
          <div className="sm:col-span-5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">
                Rp {calculation.subtotal.toLocaleString('id-ID')}
              </span>
            </div>

            {calculation.totalDiscount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Total Diskon:</span>
                <span className="font-semibold">
                  - Rp {calculation.totalDiscount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Dasar Pengenaan Pajak (DPP):</span>
              <span className="font-semibold text-slate-900">
                Rp {calculation.taxableAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Total PPN / Pajak:</span>
              <span className="font-semibold text-slate-900">
                Rp {calculation.totalTax.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Grand Total:</span>
              <span className="text-lg font-black text-blue-700">
                Rp {calculation.grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Payment Balance Box */}
            <div className="pt-2">
              <div
                className={`p-3 rounded-xl border ${paymentSummary.isFullyPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} space-y-1.5`}
              >
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Total Terbayar:</span>
                  <span className="font-bold text-emerald-700">
                    Rp {paymentSummary.totalPaid.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 text-xs font-bold pt-1 border-t border-slate-200/60">
                  <span>Sisa Tagihan:</span>
                  <span
                    className={
                      paymentSummary.remainingBalance > 0 ? 'text-blue-700' : 'text-slate-900'
                    }
                  >
                    Rp {paymentSummary.remainingBalance.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="pt-8 mt-8 border-t border-slate-200 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>
          Faktur ini diterbitkan secara sah dan disimpan secara lokal via Ficco Local-First
          System.
        </p>
        <p className="font-medium text-slate-500">Halaman 1 dari 1</p>
      </div>
    </div>
  );
};
