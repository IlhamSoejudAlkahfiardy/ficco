import React from 'react';
import { Metadata } from 'next';
import { DashboardView } from '@/features/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard — Ficco',
  description: 'Ringkasan performa finansial, arus kas, faktur piutang, dan pengeluaran usaha.',
};

export default function DashboardPage() {
  return <DashboardView />;
}
