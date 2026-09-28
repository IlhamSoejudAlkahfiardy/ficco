import React from 'react';
import { Metadata } from 'next';
import { InvoiceDetailView } from '@/features/invoices';

export const metadata: Metadata = {
  title: 'Rincian Faktur — Ficco',
  description: 'Rincian dokumen faktur penagihan, status pembayaran, dan rincian item.',
};

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  return <InvoiceDetailView invoiceId={id} />;
}
