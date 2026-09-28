import React from 'react';
import { Metadata } from 'next';
import { InvoiceEditView } from '@/features/invoices';

export const metadata: Metadata = {
  title: 'Edit Faktur — Ficco',
  description: 'Perbarui rincian item, kuantitas, harga, dan ketentuan faktur pelanggan.',
};

interface EditInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params;
  return <InvoiceEditView invoiceId={id} />;
}
