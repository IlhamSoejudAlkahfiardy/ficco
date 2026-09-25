import { Product } from '@/infrastructure/database/schema';

export type { Product };

export interface ProductWithUsageCount {
  product: Product;
  invoiceUsageCount: number;
}

export type ProductFilterStatus = 'all' | 'active' | 'inactive';

export type ProductSortBy =
  | 'name_asc'
  | 'name_desc'
  | 'price_desc'
  | 'price_asc'
  | 'created_desc'
  | 'created_asc';

export interface ProductStats {
  totalProducts: number;
  activeCount: number;
  inactiveCount: number;
}

export const COMMON_UNITS = [
  { label: 'Pcs (Pieces)', value: 'pcs' },
  { label: 'Unit', value: 'unit' },
  { label: 'Jam (Hours)', value: 'jam' },
  { label: 'Hari (Days)', value: 'hari' },
  { label: 'Bulan (Months)', value: 'bulan' },
  { label: 'Tahun (Years)', value: 'tahun' },
  { label: 'Paket (Package)', value: 'paket' },
  { label: 'Sesi (Session)', value: 'sesi' },
  { label: 'Proyek (Project)', value: 'proyek' },
  { label: 'Orang / Hari (Mandays)', value: 'mandays' },
  { label: 'Kg (Kilogram)', value: 'kg' },
  { label: 'Meter (m)', value: 'm' },
  { label: 'Box', value: 'box' },
];
