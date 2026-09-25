import React from 'react';
import { Metadata } from 'next';
import { InvoiceListView } from '@/features/invoices';

export const metadata: Metadata = {
  title: 'Faktur Penjualan — Ficco',
  description: 'Kelola pembuatan, pelacakan, dan status penagihan faktur secara lokal.',
};

export default function InvoicesPage() {
  return <InvoiceListView />;
}

