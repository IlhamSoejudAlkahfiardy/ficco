import React from 'react';
import { AppShell } from '@/shared';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
