import React from 'react';
import { AppShell } from '@/shared';
import { LicenseGuard } from '@/features/license';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <LicenseGuard>{children}</LicenseGuard>
    </AppShell>
  );
}
