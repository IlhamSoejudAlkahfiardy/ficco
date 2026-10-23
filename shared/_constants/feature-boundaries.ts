/**
 * Ficco Feature Execution Boundaries (Step 29 - Add offline/online boundary handling)
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Step 29 & Section 31)
 *
 * Core Blueprint Principle:
 * - Local features: always available (IndexedDB / Client runtime)
 * - Server features: require network (License activation, future WhatsApp backup)
 */

export type FeatureExecutionTier = 'local' | 'server';

export interface FeatureBoundaryDefinition {
  id: string;
  name: string;
  tier: FeatureExecutionTier;
  alwaysAvailableOffline: boolean;
  requiresNetwork: boolean;
  description: string;
  storageTarget: 'IndexedDB' | 'localStorage' | 'Supabase' | 'RemoteServer';
  failureFallback?: string;
}

export const FEATURE_BOUNDARIES: Record<string, FeatureBoundaryDefinition> = {
  invoices: {
    id: 'invoices',
    name: 'Faktur & Penjualan (Invoices)',
    tier: 'local',
    alwaysAvailableOffline: true,
    requiresNetwork: false,
    description: 'Pembuatan, perhitungan pajak/diskon, penyimpanan, dan status pembayaran faktur.',
    storageTarget: 'IndexedDB',
  },
  expenses: {
    id: 'expenses',
    name: 'Pencatatan Pengeluaran (Expenses)',
    tier: 'local',
    alwaysAvailableOffline: true,
    requiresNetwork: false,
    description: 'Pencatatan beban usaha, kategori pengeluaran, dan pelacakan arus kas keluar.',
    storageTarget: 'IndexedDB',
  },
  customers: {
    id: 'customers',
    name: 'Manajemen Pelanggan (Customers)',
    tier: 'local',
    alwaysAvailableOffline: true,
    requiresNetwork: false,
    description: 'Daftar kontak pelanggan, alamat, NPWP, dan riwayat transaksi.',
    storageTarget: 'IndexedDB',
  },
  products: {
    id: 'products',
    name: 'Katalog Produk & Jasa (Products)',
    tier: 'local',
    alwaysAvailableOffline: true,
    requiresNetwork: false,
    description: 'Katalog barang dan jasa, penetapan harga jual, SKU, dan tarif pajak.',
    storageTarget: 'IndexedDB',
  },
  reports: {
    id: 'reports',
    name: 'Laporan Keuangan & Grafik (Reports)',
    tier: 'local',
    alwaysAvailableOffline: true,
    requiresNetwork: false,
    description: 'Laporan laba rugi, tren pendapatan, dan ringkasan distribusi biaya.',
    storageTarget: 'IndexedDB',
  },
  pdf_generation: {
    id: 'pdf_generation',
    name: 'Unduh & Cetak PDF Faktur',
    tier: 'local',
    alwaysAvailableOffline: true,
    requiresNetwork: false,
    description: 'Pembuatan vector PDF invoice secara instan di peramban tanpa server rendering.',
    storageTarget: 'IndexedDB',
  },
  backup_data: {
    id: 'backup_data',
    name: 'Cadangan & Pemulihan JSON (Backup & Restore)',
    tier: 'local',
    alwaysAvailableOffline: true,
    requiresNetwork: false,
    description: 'Ekspor dan impor seluruh database lokal dalam format JSON terenkripsi/tervalidasi.',
    storageTarget: 'IndexedDB',
  },
  license_verification: {
    id: 'license_verification',
    name: 'Pemeriksaan Lisensi Lokal (Access Gate)',
    tier: 'local',
    alwaysAvailableOffline: true,
    requiresNetwork: false,
    description: 'Verifikasi status aktivasi perangkat dari Zustand store lokal tanpa request ke server.',
    storageTarget: 'localStorage',
  },
  license_activation: {
    id: 'license_activation',
    name: 'Aktivasi Lisensi Komersial (License Activation)',
    tier: 'server',
    alwaysAvailableOffline: false,
    requiresNetwork: true,
    description: 'Validasi kriptografis kunci lisensi satu kali ke server lisensi Supabase.',
    storageTarget: 'Supabase',
    failureFallback: 'Menampilkan pesan jaringan jelas; jika perangkat telah teraktivasi, operasional lokal tetap berlanjut.',
  },
  whatsapp_backup: {
    id: 'whatsapp_backup',
    name: 'Cadangan Cloud WhatsApp (WhatsApp Backup - Future)',
    tier: 'server',
    alwaysAvailableOffline: false,
    requiresNetwork: true,
    description: 'Pengiriman cadangan terenkripsi otomatis via pesan WhatsApp (Roadmap masa depan).',
    storageTarget: 'RemoteServer',
    failureFallback: 'Cadangan lokal JSON tetap tersedia 100% tanpa jaringan.',
  },
};

export const LOCAL_FEATURES = Object.values(FEATURE_BOUNDARIES).filter(
  (f) => f.tier === 'local'
);

export const SERVER_FEATURES = Object.values(FEATURE_BOUNDARIES).filter(
  (f) => f.tier === 'server'
);

/**
 * Checks whether an operation requires an active internet connection.
 */
export function requiresNetwork(featureId: string): boolean {
  return FEATURE_BOUNDARIES[featureId]?.requiresNetwork ?? false;
}
