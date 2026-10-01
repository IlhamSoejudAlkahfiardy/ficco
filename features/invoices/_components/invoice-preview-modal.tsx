'use client';

import React, { useState, useEffect } from 'react';
import { InvoiceFullDetails } from '../_services/invoice-domain-service';
import { InvoicePreviewSheet } from './invoice-preview-sheet';
import { useInvoicePdf } from '../_hooks/use-invoice-pdf';
import { SettingsService } from '@/features/settings/_services/settings-service';
import { CompanyProfile } from '@/features/settings/_types/settings.types';
import { Icons } from '@/shared/_components/icons';

export interface InvoicePreviewModalProps {
  isOpen: boolean;
  details: InvoiceFullDetails | null;
  onClose: () => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  details,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');
  const { isGenerating, downloadPdf, printInvoice } = useInvoicePdf();

  useEffect(() => {
    if (isOpen) {
      // Load company profile & invoice defaults
      SettingsService.loadAll()
        .then(({ company, invoiceDefaults }) => {
          setCompanyProfile(company);
          setPaymentInstructions(invoiceDefaults.paymentInstructions || '');
        })
        .catch((err) => {
          console.error('Failed to load settings for invoice preview', err);
        });
    }
  }, [isOpen]);

  if (!isOpen || !details) return null;

  const handleDownload = async () => {
    await downloadPdf(details);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 15, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 15, 60));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white shrink-0 shadow-md print:hidden">
        {/* Left: Document Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Icons.fileText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pratinjau Faktur
              </span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-300">
                {details.invoice.invoiceNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Format Dokumen Standar A4 (210 × 297 mm)
            </p>
          </div>
        </div>

        {/* Center: Zoom Controls (Visible on medium+ screens) */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 60}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40"
            title="Perkecil (-15%)"
          >
            <Icons.zoomOut size={15} />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white rounded transition-colors"
            title="Reset ke 100%"
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 150}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40"
            title="Perbesar (+15%)"
          >
            <Icons.zoomIn size={15} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Download PDF button */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleDownload}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icons.download size={15} />
            )}
            <span>{isGenerating ? 'Menghasilkan...' : 'Unduh PDF'}</span>
          </button>

          {/* Print button */}
          <button
            type="button"
            onClick={printInvoice}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <Icons.printer size={15} />
            <span className="hidden sm:inline">Cetak Faktur</span>
          </button>

          {/* Close modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup Pratinjau (Esc)"
          >
            <Icons.close size={20} />
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll View */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
        <div
          className="transition-transform duration-150 origin-top w-full max-w-[210mm]"
          style={{
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
          }}
        >
          <InvoicePreviewSheet
            details={details}
            companyProfile={companyProfile}
            paymentInstructions={paymentInstructions}
          />
        </div>
      </div>
    </div>
  );
};
