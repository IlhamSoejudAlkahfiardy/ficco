import React from 'react';
import { Metadata } from 'next';
import { ExpenseListView } from '@/features/expenses';

export const metadata: Metadata = {
  title: 'Pengeluaran — Ficco',
  description: 'Kelola dan pantau seluruh beban operasional usaha secara lokal di IndexedDB.',
};

export default function ExpensesPage() {
  return <ExpenseListView />;
}
