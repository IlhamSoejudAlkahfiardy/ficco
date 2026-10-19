import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { AdminLoginForm } from '@/features/admin';
import { Icons } from '@/shared/_components/icons';

export const metadata: Metadata = {
  title: 'Login Admin — Ficco Admin Portal',
  description: 'Area masuk terproteksi administrator lisensi Ficco',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Icons.loader size={28} className="animate-spin text-blue-400" />
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
