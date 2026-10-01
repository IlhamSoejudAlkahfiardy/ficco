import { format, addDays } from 'date-fns';
import type { CustomerFormData } from '@/features/customers';
import type { ProductFormData } from '@/features/products';
import type { InvoiceFormData, InvoiceItemFormData } from '@/features/invoices';
import type { PaymentFormData } from '@/features/invoices';

const SAMPLE_NAMES = [
  'Budi Santoso',
  'Siti Rahmawati',
  'Hendra Wijaya',
  'Dewi Sartika',
  'Rian Hidayat',
  'Maya Anggraini',
  'Andi Pratama',
  'Fitri Handayani',
];

const SAMPLE_COMPANIES = [
  'PT Nusantara Digital Solusindo',
  'CV Sinar Mandiri Abadi',
  'PT Inovasi Teknologi Berkah',
  'CV Media Kreatif Indonesia',
  'PT Mega Solusi Pratama',
  'PT Global Logistik Nusantara',
];

const SAMPLE_CITIES = [
  'Jakarta Selatan',
  'Bandung',
  'Surabaya',
  'Semarang',
  'Yogyakarta',
  'Tangerang Selatan',
];

const SAMPLE_PRODUCTS: Array<{
  name: string;
  sku: string;
  description: string;
  unit: string;
  price: number;
  taxRate: number;
}> = [
  {
    name: 'Jasa Desain UI/UX & Design System',
    sku: 'SRV-UIX-001',
    description: 'Perancangan antarmuka pengguna web/mobile dan standarisasi komponen desain',
    unit: 'paket',
    price: 6500000,
    taxRate: 11,
  },
  {
    name: 'Jasa Pengembangan Web & API',
    sku: 'SRV-DEV-002',
    description: 'Implementasi aplikasi web responsif dan integrasi RESTful API terpadu',
    unit: 'jam',
    price: 350000,
    taxRate: 11,
  },
  {
    name: 'Paket Maintenance & Cloud VPS',
    sku: 'SRV-MNT-003',
    description: 'Pemeliharaan server berkala, backup otomatis harian, dan monitoring SLA 99.9%',
    unit: 'bulan',
    price: 2500000,
    taxRate: 11,
  },
  {
    name: 'Laptop Bisnis ThinkPad L14 Gen 4',
    sku: 'HW-LTP-004',
    description: 'Core i7, 16GB RAM, 512GB NVMe SSD, Layar IPS 14 inch Full HD',
    unit: 'unit',
    price: 14750000,
    taxRate: 11,
  },
  {
    name: 'Printer Laser Multifungsi EcoTank',
    sku: 'HW-PRN-005',
    description: 'Print, Scan, Copy dengan konektivitas Wi-Fi Direct dan tangki tinta hemat',
    unit: 'unit',
    price: 3250000,
    taxRate: 11,
  },
  {
    name: 'Kertas HVS A4 80gr Rim',
    sku: 'ATK-HVS-006',
    description: 'Kertas dokumen berkualitas tinggi, putih bersih, 500 lembar per rim',
    unit: 'rim',
    price: 580000,
    taxRate: 0,
  },
  {
    name: 'Sesi Konsultasi Bisnis & Perpajakan',
    sku: 'SRV-KNS-007',
    description: 'Konsultasi perencanaan pajak dan laporan kepatuhan keuangan korporat',
    unit: 'sesi',
    price: 1500000,
    taxRate: 0,
  },
];

const SAMPLE_PAYMENT_METHODS = [
  'Transfer Bank',
  'QRIS',
  'Tunai',
  'Kartu Kredit',
  'e-Wallet',
];

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate dummy Customer form data
 */
export function generateCustomerDummy(): CustomerFormData {
  const name = getRandomItem(SAMPLE_NAMES);
  const companyName = getRandomItem(SAMPLE_COMPANIES);
  const city = getRandomItem(SAMPLE_CITIES);
  const slug = name.toLowerCase().replace(/\s+/g, '.');
  const randNum = getRandomInt(10, 99);

  return {
    name,
    companyName,
    email: `${slug}${randNum}@example.com`,
    phone: `081${getRandomInt(10000000, 99999999)}`,
    address: `Jl. Melati No. ${getRandomInt(1, 150)}, ${city}`,
    taxNumber: `01.${getRandomInt(100, 999)}.${getRandomInt(100, 999)}.${getRandomInt(1, 9)}-${getRandomInt(100, 999)}.000`,
    notes: 'Klien aktif hasil generasi data otomatis.',
  };
}

/**
 * Generate dummy Product form data
 */
export function generateProductDummy(): ProductFormData {
  const template = getRandomItem(SAMPLE_PRODUCTS);
  const randNum = getRandomInt(10, 99);

  return {
    name: `${template.name} #${randNum}`,
    sku: `${template.sku}-${randNum}`,
    description: template.description,
    unit: template.unit,
    price: template.price,
    taxRate: template.taxRate,
    active: true,
  };
}

/**
 * Generate dummy Invoice form data
 */
export function generateInvoiceDummy(
  existingCustomerIds: string[] = []
): InvoiceFormData {
  const now = new Date();
  const dueDate = addDays(now, 14);
  const randNum = getRandomInt(100, 999);
  const invNumber = `INV/${format(now, 'yyyy/MM')}/${randNum}`;

  // Pick 2 random products
  const shuffled = [...SAMPLE_PRODUCTS].sort(() => 0.5 - Math.random());
  const selectedProducts = shuffled.slice(0, 2);

  const items: InvoiceItemFormData[] = selectedProducts.map((p) => ({
    description: `${p.name} - ${p.description}`,
    quantity: getRandomInt(1, 3),
    unitPrice: p.price,
    discount: getRandomItem([0, 0, 50000, 100000]),
    taxRate: p.taxRate,
  }));

  return {
    invoiceNumber: invNumber,
    customerId: existingCustomerIds.length > 0 ? getRandomItem(existingCustomerIds) : '',
    issueDate: format(now, 'yyyy-MM-dd'),
    dueDate: format(dueDate, 'yyyy-MM-dd'),
    status: 'draft',
    notes: 'Terima kasih atas kerja samanya. Pembayaran dapat ditransfer ke rekening BCA 1234567890 a/n PT Ficco Nusantara.',
    discount: 0,
    tax: 0,
    items,
  };
}

/**
 * Generate dummy Payment form data
 */
export function generatePaymentDummy(
  invoiceId: string,
  remainingBalance: number
): PaymentFormData {
  const method = getRandomItem(SAMPLE_PAYMENT_METHODS);
  // Either full payment (if small or random) or 50% partial payment
  const isFull = Math.random() > 0.5 || remainingBalance <= 1000000;
  const amount = isFull ? remainingBalance : Math.round(remainingBalance * 0.5);

  return {
    invoiceId,
    amount: Math.max(1000, amount),
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: method,
    notes: `Pembayaran via ${method} (Generated Data).`,
  };
}
