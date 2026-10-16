import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ficco — Invoice & Expense Management',
    short_name: 'Ficco',
    description: 'Private, offline-ready local-first invoice and expense manager',
    start_url: '/dashboard',
    id: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    orientation: 'any',
    scope: '/',
    categories: ['finance', 'productivity', 'business'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Buat Faktur Baru',
        short_name: 'Faktur Baru',
        description: 'Buat tagihan/faktur baru untuk pelanggan',
        url: '/invoices/new',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Catat Pengeluaran',
        short_name: 'Pengeluaran',
        description: 'Catat pengeluaran bisnis baru',
        url: '/expenses',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Laporan Keuangan',
        short_name: 'Laporan',
        description: 'Lihat ringkasan laba rugi dan arus kas',
        url: '/reports',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
