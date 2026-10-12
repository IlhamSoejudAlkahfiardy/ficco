import React from 'react';
import { Metadata } from 'next';
import { ReportsView } from '@/features/reports';

export const metadata: Metadata = {
  title: 'Laporan Keuangan — Ficco',
  description: 'Laporan laba rugi, rincian pendapatan faktur, dan distribusi beban operasional usaha secara offline.',
};

export default function ReportsPage() {
  return <ReportsView />;
}
