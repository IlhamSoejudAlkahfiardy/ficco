import React from 'react';
import { Metadata } from 'next';
import { AdminShell, AdminOverview } from '@/features/admin';

export const metadata: Metadata = {
  title: 'Dashboard Admin — Ficco Admin Portal',
  description: 'Panel kendali lisensi dan aktivasi perangkat Ficco',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <AdminOverview />
    </AdminShell>
  );
}
