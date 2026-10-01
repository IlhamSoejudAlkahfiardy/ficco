'use client';

import { useState, useCallback } from 'react';
import { InvoiceFullDetails } from '../_services/invoice-domain-service';
import { downloadInvoicePdf } from '@/infrastructure/pdf';
import { SettingsService } from '@/features/settings/_services/settings-service';

export interface UseInvoicePdfReturn {
  isGenerating: boolean;
  error: string | null;
  downloadPdf: (details: InvoiceFullDetails, filename?: string) => Promise<void>;
  printInvoice: () => void;
}

export function useInvoicePdf(): UseInvoicePdfReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadPdf = useCallback(
    async (details: InvoiceFullDetails, filename?: string) => {
      setIsGenerating(true);
      setError(null);

      try {
        // Fetch up-to-date company profile and invoice default settings
        const { company, invoiceDefaults } = await SettingsService.loadAll();

        await downloadInvoicePdf(
          {
            invoice: details.invoice,
            items: details.items,
            customer: details.customer,
            company,
            calculation: details.calculation,
            paymentSummary: details.paymentSummary,
            payments: details.payments,
            paymentInstructions: invoiceDefaults.paymentInstructions,
          },
          filename
        );
      } catch (err) {
        console.error('Failed to generate or download invoice PDF:', err);
        setError((err as Error).message || 'Gagal menghasilkan dokumen PDF.');
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const printInvoice = useCallback(() => {
    window.print();
  }, []);

  return {
    isGenerating,
    error,
    downloadPdf,
    printInvoice,
  };
}
