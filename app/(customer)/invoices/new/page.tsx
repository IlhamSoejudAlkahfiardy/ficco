import React from 'react';
import { Metadata } from 'next';
import { InvoiceCreateView } from '@/features/invoices';

export const metadata: Metadata = {
  title: 'Buat Faktur Baru — Ficco',
  description: 'Terbitkan faktur baru dengan kalkulasi otomatis dan penyimpanan lokal IndexedDB.',
};

export default function NewInvoicePage() {
  return <InvoiceCreateView />;
}
