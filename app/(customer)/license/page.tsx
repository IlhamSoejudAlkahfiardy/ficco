import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { LicenseActivationView } from '@/features/license';

export const metadata: Metadata = {
  title: 'Aktivasi Lisensi | Ficco',
  description: 'Aktivasi lisensi perangkat komersial aplikasi Ficco',
};

export default function LicensePage() {
  return (
    <Suspense fallback={null}>
      <LicenseActivationView />
    </Suspense>
  );
}
