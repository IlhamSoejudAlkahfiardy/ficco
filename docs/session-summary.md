# Rangkuman Perkembangan Proyek Ficco — Session Summary

> **Dokumen Sumber Kebenaran (Source of Truth):** [`docs/invoice-expense-prd-blueprint.md`](file:///d:/DOT%20Indonesia/Project/ficco/docs/invoice-expense-prd-blueprint.md)  
> **Status:** Step 1 sampai Step 8 Selesai  
> **Arsitektur:** Local-First / Zero-Knowledge Server (IndexedDB via Dexie)  
> **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS + Zustand + React Hook Form + Zod  

---

## 1. Konfigurasi Otomatisasi Pemahaman Blueprint (`AGENTS.md`)

* **Permintaan Pengguna:** Bagaimana caranya agar asisten AI langsung memahami dan mematuhi [docs/invoice-expense-prd-blueprint.md](file:///d:/DOT%20Indonesia/Project/ficco/docs/invoice-expense-prd-blueprint.md) pada setiap prompt tanpa harus di-mention secara manual (`@...`).
* **Implementasi:**
  - Memanfaatkan fitur **Workspace Rules** Antigravity yang disuntikkan secara otomatis ke setiap turn prompt (`<user_rules>`).
  - Menambahkan direktif permanen pada file [`AGENTS.md`](file:///d:/DOT%20Indonesia/Project/ficco/AGENTS.md) di luar blok bawaan Next.js.
  - Menetapkan aturan paten:
    1. **Authoritative Specification:** Menjadikan `invoice-expense-prd-blueprint.md` sebagai acuan utama.
    2. **Local-First Business Data:** Data bisnis (faktur, pengeluaran, pelanggan, produk, laporan) 100% berada di client (IndexedDB / Dexie), server tidak menyimpan data bisnis.
    3. **Peran Server:** Terbatas pada validasi lisensi, aktivasi perangkat, dan administrasi.
    4. **Alur Arsitektur:** `UI → Feature Hooks → Feature Services/Repositories → Infrastructure (Dexie)`.
    5. **Konvensi Direktori:** `features/`, `shared/`, dan `infrastructure/`.

---

## 2. Pengerjaan Step 3 — Establish Architecture

* **Tujuan:** Membangun fondasi arsitektur modular yang memisahkan antara layer domain, shared utilities, dan low-level infrastructure.
* **Implementasi:**
  - **`features/`**: Modul domain mandiri dengan konvensi *private folder* (`_components/`, `_hooks/`, `_services/`, `_schemas/`, `_types/`, `_utils/`) dan public API `index.ts`:
    - `dashboard/`, `invoices/`, `expenses/`, `customers/`, `products/`, `reports/`, `settings/`, `backup/`, `license/`.
    - Dokumentasi aturan isolasi modul di [`features/README.md`](file:///d:/DOT%20Indonesia/Project/ficco/features/README.md).
  - **`shared/`**: Kode reusable antar-fitur (*Rule of Three*):
    - `_components/`, `_hooks/`, `_utils/`, `_types/`, `_constants/`, dan public API `index.ts`.
    - Dokumentasi boundary di [`shared/README.md`](file:///d:/DOT%20Indonesia/Project/ficco/shared/README.md).
  - **`infrastructure/`**: Layanan teknis perangkat dan persistensi:
    - `database/`, `pdf/`, `storage/`, `pwa/`, dan public API `index.ts`.
    - Dokumentasi di [`infrastructure/README.md`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/README.md).
* **Klarifikasi Pemisahan dari `/app`:**
  - Menjelaskan bahwa `/app` murni menangani *Routing & Delivery* (`layout.tsx`, `page.tsx`, route groups `(customer)` dan `(admin)`), sedangkan bisnis logic terpusat di `/features` agar tidak terjadi tabrakan rute (routing collision) pada Next.js App Router.

---

## 3. Pengerjaan Step 4 — Build Application Shell

* **Tujuan:** Membangun antarmuka utama (shell) aplikasi yang responsif untuk desktop dan smartphone, navigasi lengkap, serta status konektivitas tanpa business logic.
* **Implementasi:**
  - **Set Ikon SVG Ringan:** Dibuat di [`shared/_components/icons.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx) untuk performa cepat dan bebas dependensi tambahan.
  - **Konstanta Navigasi:** Menu utama dan sekunder di [`shared/_constants/navigation.ts`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_constants/navigation.ts).
  - **Zustand Shell Store:** Dibuat di [`shared/_hooks/use-shell-store.ts`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_hooks/use-shell-store.ts) untuk mengelola status sidebar collapse, drawer mobile, dan status online/offline.
  - **Komponen Shell:**
    - [`Sidebar`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/shell/sidebar.tsx): Navigasi desktop yang dapat di-collapse, logo Ficco, dan indikator *Local-First*.
    - [`Header`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/shell/header.tsx): Header sticky, judul halaman dinamis, trigger hamburger mobile, dan badge status *Online / Offline Mode*.
    - [`MobileNav`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/shell/mobile-nav.tsx): Slide-over drawer navigasi untuk layar kecil dengan backdrop blur.
    - [`BottomNav`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/shell/bottom-nav.tsx): Mobile bottom navigation bar untuk akses cepat satu tangan pada smartphone (*Dashboard, Invoices, Expenses, Reports, More*).
    - [`AppShell`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/shell/app-shell.tsx): Komponen pembungkus master layout dengan integrasi Ant Design `ConfigProvider` (`#2563eb`).
  - **Rute Halaman (`app/`):**
    - Root redirect [`app/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/page.tsx) menuju `/dashboard`.
    - Customer shell layout di [`app/(customer)/layout.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/layout.tsx).
    - Halaman placeholder terhubung: `/dashboard`, `/invoices`, `/expenses`, `/customers`, `/products`, `/reports`, `/settings`, `/backup`, `/license`.
    - Stub admin portal: [`app/(admin)/sk-11312301239/login/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(admin)/sk-11312301239/login/page.tsx).

---

## 4. Investigasi & Solusi Masalah Mobile / Ngrok Tunnel

Saat pengguna menguji aplikasi di smartphone melalui Ngrok tunnel, ditemukan dua kendala yang kemudian diselesaikan:

1. **Hamburger Menu Tidak Merespons:**
   - **Penyebab:** Pada `MobileNav`, terdapat kondisi `if (!isMobileNavOpen) return null;` yang dipadukan dengan `useEffect` pemanggil `closeMobileNav()`. Setiap kali menu ditekan, komponen baru di-*mount* ke DOM dan `useEffect` langsung menutupnya kembali dalam 0 milidetik.
   - **Solusi:** Menggunakan `useRef(pathname)` agar drawer hanya tertutup saat URL benar-benar berubah, serta mengganti metode unmount dengan transisi CSS (`transform -translate-x-full` → `translate-x-0` & `opacity`).
2. **Terdeteksi "Offline Mode" & Kendala Akses Ngrok:**
   - **Penyebab:** API `navigator.onLine` pada browser ponsel sering bernilai `false` saat berada di balik reverse proxy / tethering. Selain itu, Next.js dev server memblokir dev origin cross-origin jika belum diizinkan.
   - **Solusi:**
     - Menambahkan konfigurasi `allowedDevOrigins` di [`next.config.ts`](file:///d:/DOT%20Indonesia/Project/ficco/next.config.ts) untuk `*.ngrok-free.app`, `*.ngrok-free.dev`, dan `*.ngrok.io`.
     - Membuat endpoint probe ringan [`app/api/ping/route.ts`](file:///d:/DOT%20Indonesia/Project/ficco/app/api/ping/route.ts).
     - Memperbarui `useShellStore` agar melakukan active ping probe ke server lokal sehingga status online terdeteksi akurat.
     - Mengingatkan perlunya restart dev server dan flag `--host-header="localhost:3000"` pada Ngrok.

---

## 5. Pengerjaan Step 5 — Implement IndexedDB/Dexie Foundation

* **Tujuan:** Membangun layer database lokal yang kuat, terisolasi, aman dari SSR, mendukung versioning skema, dan membungkus seluruh query dalam repository layer.
* **Implementasi:**
  - **Skema 9 Entitas Bisnis:** Didefinisikan di [`infrastructure/database/schema.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/schema.ts):
    1. `Company` (profil usaha, legal name, logo, NPWP, mata uang)
    2. `Customer` (pelanggan, kontak, alamat, NPWP, catatan)
    3. `Product` (katalog barang/jasa, SKU, harga, pajak, status aktif)
    4. `Invoice` (nomor faktur, relasi pelanggan, tanggal, status, subtotal, diskon, pajak, total)
    5. `InvoiceItem` (baris item faktur)
    6. `Expense` (pengeluaran, kategori, nominal, tanggal, metode pembayaran)
    7. `ExpenseCategory` (kategori pengeluaran)
    8. `Payment` (pembayaran invoice)
    9. `AppSetting` (pengaturan lokal key-value)
  - **Dexie Database Instance:** [`infrastructure/database/db.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/db.ts) dengan nama database `ficco_business_db`, singleton `db`, dan mengekspos `window.ficcoDb` untuk kemudahan debugging console.
  - **Versioning & Migrasi:** [`infrastructure/database/migrations/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/migrations/index.ts) dengan `CURRENT_DB_VERSION = 1` dan pipeline `applyMigrations()`.
  - **Error Handling:** [`infrastructure/database/errors.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/errors.ts) dengan error model terstandar (`DatabaseError`, `NotFoundError`, `DuplicateKeyError`, `ValidationError`).
  - **Repository Layer:** Pemisahan total query database dari UI components:
    - [`BaseRepository`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/repositories/base-repository.ts) (CRUD generik, count, clear, bulkAdd).
    - `CustomerRepository`, `ProductRepository`, `InvoiceRepository` (mendukung transaksi atomik multi-tabel invoice + item), `ExpenseRepository`, `ExpenseCategoryRepository`, `PaymentRepository`, `CompanyRepository`, dan `SettingsRepository`.
  - **Verifikasi & Manual Testing Playground:**
    - Self-diagnostics otomatis di [`infrastructure/database/diagnostics.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/diagnostics.ts).
    - Komponen UI kartu diagnostik di [`features/dashboard/_components/database-status-card.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_components/database-status-card.tsx) yang menyediakan tab pengujian otomatis (semua kriteria PASSED) dan tab *Playground Manual* untuk mencoba menambah Customer, Invoice, dan melihat live JSON di IndexedDB.

---

## 6. Pengerjaan Step 6 — Implement Company/Business Settings

* **Tujuan:** Menyediakan antarmuka dan layanan penyimpanan profil usaha lokal, logo, mata uang, dan konfigurasi default faktur yang tersimpan permanen di IndexedDB.
* **Implementasi:**
  - **Tipe & Nilai Awal:** [`features/settings/_types/settings.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_types/settings.types.ts) (`CompanyProfile`, `InvoiceDefaults`, daftar 8 mata uang populer, nilai default invoice).
  - **Validasi Zod:** [`features/settings/_schemas/settings.schemas.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_schemas/settings.schemas.ts) untuk `companyProfileSchema` dan `invoiceDefaultsSchema`.
  - **Service Layer:** [`features/settings/_services/settings-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_services/settings-service.ts) menangani penyimpanan data profil ke `companyRepository` dan default faktur ke `settingsRepository`.
  - **Custom Hook:** [`features/settings/_hooks/use-company-settings.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_hooks/use-company-settings.ts) mengintegrasikan state loading, saving, dan validasi formulir.
  - **Komponen Formulir:**
    - [`LogoUploader`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_components/logo-uploader.tsx): Kompresi gambar client-side otomatis via HTML5 Canvas (maks 400×400px base64 data URL), preview visual, dan tombol hapus.
    - [`CompanyProfileForm`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_components/company-profile-form.tsx): Nama bisnis, badan usaha, NPWP, mata uang, email, telepon/WA, dan alamat lengkap.
    - [`InvoiceDefaultsForm`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_components/invoice-defaults-form.tsx): Prefix faktur (misal: `INV`), nomor urut selanjutnya, live preview format nomor (`INV-2026-0001`), jatuh tempo default (hari), tarif PPN default (%), instruksi rekening bank, dan catatan kaki faktur.
    - [`SettingsView`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_components/settings-view.tsx): Tampilan tab terpadu antara *Profil Usaha* dan *Default Faktur*, dilengkapi badge status offline IndexedDB.
  - **Integrasi Halaman:** Terhubung langsung pada halaman pengaturan [`app/(customer)/settings/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/settings/page.tsx).

---

## 7. Pengerjaan Step 7 — Implement Customer Management

* **Tujuan:** Menyediakan manajemen direktori pelanggan lengkap (CRUD), pencarian multi-kolom, pengurutan, validasi data penagihan, tampilan detail kontak interaktif, serta ringkasan aktivitas faktur tersimpan 100% lokal di IndexedDB.
* **Implementasi:**
  - **Definisi Tipe Data & Skema Validasi:**
    - [`features/customers/_types/customer.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_types/customer.types.ts): Re-export entitas `Customer`, `CustomerWithInvoiceSummary` (agregasi faktur), `CustomerStats`, dan `CustomerSortBy`.
    - [`features/customers/_schemas/customer.schemas.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_schemas/customer.schemas.ts): Validasi Zod v4 untuk form pelanggan (`name` wajib diisi, format `email`, batasan panjang karakter untuk `phone`, `taxNumber`/NPWP, `companyName`, `address`, dan `notes`).
  - **Service Layer (Local-First IndexedDB):**
    - [`features/customers/_services/customer-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_services/customer-service.ts):
      - `getAll(search, sortBy)`: Query pencarian multi-kolom (nama, perusahaan, email, nomor HP) via `customerRepository` dan in-memory sorting (`name_asc`, `name_desc`, `created_desc`, `created_asc`).
      - `create(data)` & `update(id, data)`: Mengelola ID unik (`cust_...`) dan timestamp ISO `createdAt` serta `updatedAt`.
      - `delete(id)`: Menghapus pelanggan dari Dexie table `customers`.
      - `getWithSummary(id)`: Mengagregasi jumlah faktur, total nominal penagihan, dan saldo belum lunas via `invoiceRepository.getByCustomerId()`.
      - `seedSampleCustomers()`: Generator data dummy 3 profil pelanggan untuk keperluan demo dan testing langsung.
  - **State Management & Custom Hook:**
    - [`features/customers/_hooks/use-customers.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_hooks/use-customers.ts): Mengontrol sinkronisasi query pencarian, filter, modal formulir, slide-over drawer detail, dialog hapus dengan deteksi relasi faktur, notifikasi feedback, dan komputasi statistik.
  - **Komponen UI Modular & Responsif:**
    - [`CustomerListView`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_components/customer-list-view.tsx): Kontainer utama dengan kartu ringkasan (Total Pelanggan, Klien Korporat, Kontak Ber-Email), bilah pencarian & filter, tabel data desktop dengan avatar inisial & tag NPWP, mobile cards view ramah layar sentuh, serta empty state interaktif dengan tombol muat sample data.
    - [`CustomerFormModal`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_components/customer-form-modal.tsx): Modal buat/edit pelanggan dengan React Hook Form, autofocus, penanganan loading state, dan validasi inline.
    - [`CustomerDetailDrawer`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_components/customer-detail-drawer.tsx): Slide-over drawer menampilkan kartu identitas klien, tautan aksi langsung (hubungi via telepon, WhatsApp instan, kirim email), kartu ringkasan histori transaksi faktur, serta tombol pintas edit/hapus.
    - [`CustomerDeleteDialog`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_components/customer-delete-dialog.tsx): Dialog konfirmasi hapus yang menampilkan peringatan khusus jika pelanggan memiliki keterkaitan dengan faktur yang sudah diterbitkan.
  - **Ikon & Integrasi Rute:**
    - [`shared/_components/icons.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx): Menambahkan 13 ikon utilitas UI (`search`, `plus`, `edit`, `trash`, `eye`, `mail`, `phone`, `mapPin`, `building`, `fileText`, `check`, `alertTriangle`, `user`).
    - [`features/customers/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/index.ts): Public API barrel export modul pelanggan.
    - [`app/(customer)/customers/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/customers/page.tsx): Integrasi langsung me-render `CustomerListView`.

---

## 8. Refaktor Global Select Ant Design & Sinkronisasi Tema (Dark / Light Mode)

* **Tujuan:** Menggantikan seluruh elemen native `<select>` dengan komponen kustom terpusat berbasis Ant Design yang dapat dicari (*searchable*), berukuran default medium, meneruskan seluruh props ke child component, serta otomatis beradaptasi dengan mode gelap (*dark mode*) dan terang (*light mode*).
* **Implementasi:**
  - **Komponen Shared Global (`AppSelect`):**
    - Dibuat di [`shared/_components/select.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/select.tsx) dan diekspor via [`shared/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/shared/index.ts).
    - Membungkus komponen `Select` Ant Design dengan:
      - **Searchable Select:** `showSearch: true` aktif secara bawaan dengan fungsi filter case-insensitive berbasis `label`.
      - **Default Size Medium:** Ukuran bawaan diatur ke `'middle'` (medium Ant Design) dan dapat diubah dinamis via prop `size` (`'small' | 'middle' | 'large' | 'medium'`).
      - **Pass-through Props:** Meneruskan seluruh properti asli Ant Design (`options`, `value`, `onChange`, `placeholder`, `allowClear`, `disabled`, `status`, dll.).
  - **Penggantian Komponen di Seluruh Proyek:**
    - [`features/customers/_components/customer-list-view.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_components/customer-list-view.tsx): Opsi pengurutan data pelanggan (*SortBy*).
    - [`features/settings/_components/company-profile-form.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_components/company-profile-form.tsx): Pemilihan mata uang utama usaha yang diintegrasikan dengan `Controller` dari React Hook Form.
  - **Penyelarasan Tema (Dark / Light Mode Synchronization):**
    - **Akar Masalah:** Sebelumnya `ConfigProvider` pada `AppShell` menggunakan `antdTheme.defaultAlgorithm` secara statis, menyebabkan elemen select dan dropdown popover selalu berwarna putih meski antarmuka dalam mode gelap.
    - **Custom Hook `useTheme`:** Dibuat di [`shared/_hooks/use-theme.ts`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_hooks/use-theme.ts) untuk mendeteksi preferensi sistem (`prefers-color-scheme: dark`), class `.dark` pada `<html>`, dan menyimpan preferensi ke `localStorage` (`ficco_theme`).
    - **Theme-Aware AppSelect & AppShell:** `AppSelect` dan [`shared/_components/shell/app-shell.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/shell/app-shell.tsx) kini menerapkan `antdTheme.darkAlgorithm` atau `antdTheme.defaultAlgorithm` secara dinamis, dengan token warna Tailwind Zinc (`#18181b` untuk latar belakang container dan popup, `#27272a` untuk border, `#f4f4f5` untuk teks).
    - **Toggle Button Tema di Header:** Ditambahkan tombol toggle tema (ikon Matahari ☀️ / Bulan 🌙) di navbar [`shared/_components/shell/header.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/shell/header.tsx).
    - **CSS Styling:** Menambahkan `@custom-variant dark (&:where(.dark, .dark *));` dan CSS variable `:root.dark` di [`app/globals.css`](file:///d:/DOT%20Indonesia/Project/ficco/app/globals.css).

---

## 9. Pengerjaan Step 8 — Implement Product/Service Management

* **Tujuan:** Membangun manajemen katalog produk dan layanan (CRUD) dengan penentuan harga satuan, kode SKU, satuan unit terstandarisasi, tarif pajak PPN default, toggle status aktif/non-aktif, serta kesiapan referensi baris item faktur (*invoice items*) tersimpan lokal di IndexedDB.
* **Implementasi:**
  - **Definisi Tipe Data & Skema Validasi:**
    - [`features/products/_types/product.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/products/_types/product.types.ts): Re-export entitas `Product`, daftar 13 satuan standar ([`COMMON_UNITS`](file:///d:/DOT%20Indonesia/Project/ficco/features/products/_types/product.types.ts#L22): `pcs`, `unit`, `jam`, `hari`, `bulan`, `tahun`, `paket`, `sesi`, `proyek`, `mandays`, `kg`, `m`, `box`), `ProductFilterStatus`, `ProductSortBy`, dan `ProductStats`.
    - [`features/products/_schemas/product.schemas.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/products/_schemas/product.schemas.ts): Validasi berbasis Zod v4 untuk form produk (`name` wajib 1-120 karakter, `sku` opsional maks 50 karakter, `unit` wajib, `price` angka non-negatif, `taxRate` 0-100%, `description` maks 500 karakter, dan boolean `active`).
  - **Service Layer (Local-First IndexedDB):**
    - [`features/products/_services/product-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/products/_services/product-service.ts):
      - `getAll(search, status, sortBy)`: Query pencarian multi-kolom (nama, SKU, deskripsi) via `productRepository`, filter status (`all`, `active`, `inactive`), dan multi-sorting (harga tertinggi/terendah, nama A-Z/Z-A, tanggal penambahan).
      - `getActiveProducts()`: Query produk aktif yang siap direferensikan pada pembuatan faktur.
      - `create(data)` & `update(id, data)`: Mengelola ID unik (`prod_...`), normalisasi data (SKU uppercase, unit lowercase), dan ISO timestamp.
      - `toggleActive(id, currentActive)`: Aksi cepat satu klik untuk mengaktifkan/menonaktifkan item katalog.
      - `getInvoiceUsageCount(productId)`: Memeriksa apakah produk sudah pernah dipakai pada baris item faktur (`invoiceItems`).
      - `delete(id)`: Menghapus produk dari Dexie table `products`.
      - `seedSampleProducts()`: Generator 4 data dummy (pengembangan web, konsultasi UI/UX, maintenance server, lisensi pro) untuk pengujian instan.
  - **State Management & Custom Hook:**
    - [`features/products/_hooks/use-products.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/products/_hooks/use-products.ts): Mengelola state reaktif katalog, query pencarian, filter status, pengurutan, modal buat/edit, dialog konfirmasi hapus dengan deteksi relasi faktur, dan aksi toggle status aktif.
  - **Komponen UI Modular & Responsif:**
    - [`ProductListView`](file:///d:/DOT%20Indonesia/Project/ficco/features/products/_components/product-list-view.tsx): Tampilan utama katalog dengan 3 kartu metrik statistik (Total Katalog, Produk Aktif, Non-Aktif), bilah pencarian & filter menggunakan `AppSelect`, tabel data desktop berfitur badge unit, format mata uang rupiah (`Rp`), switch badge status interaktif, mobile cards view ramah layar sentuh, serta empty state interaktif.
    - [`ProductFormModal`](file:///d:/DOT%20Indonesia/Project/ficco/features/products/_components/product-form-modal.tsx): Modal buat/edit produk menggunakan React Hook Form + Zod, terintegrasi dengan `AppSelect` untuk pemilihan satuan unit.
    - [`ProductDeleteDialog`](file:///d:/DOT%20Indonesia/Project/ficco/features/products/_components/product-delete-dialog.tsx): Konfirmasi hapus yang menampilkan rincian harga serta peringatan jika produk telah digunakan pada faktur yang diterbitkan sebelumnya.
  - **Routing & Integrasi Halaman:**
    - [`features/products/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/products/index.ts): Public API barrel export modul produk.
    - [`app/(customer)/products/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/products/page.tsx): Integrasi langsung me-render `ProductListView`.

---

---

## 10. Pengerjaan Step 9 — Implement Invoice Domain

* **Tujuan:** Membangun lapisan domain dan logika bisnis utama faktur (*invoice domain*) sesuai dengan mandat Blueprint PRD Bagian 9 & 10, mencakup skema data faktur & baris item (*Zod validation*), mesin kalkulasi finansial terpusat (*zero calculation duplication*), mitigasi presisi *floating point*, generator penomoran faktur berurutan tanpa tabrakan (*collision-free sequential numbering*), penentuan status siklus hidup faktur otomatis, serta rangkaian pengujian unit (*unit tests*).
* **Implementasi:**
  - **Pembaruan Skema Status Faktur (Database Infrastructure):**
    - [`infrastructure/database/schema.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/schema.ts): Memperluas tipe `InvoiceStatus` agar mencakup status lengkap: `'draft' | 'sent' | 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'` sesuai spesifikasi Bagian 10 PRD Blueprint.
  - **Tipe Data & Metadata Domain:**
    - [`features/invoices/_types/invoice.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_types/invoice.types.ts):
      - Mendefinisikan antarmuka `CalculatedInvoiceItem`, `InvoiceCalculationInput`, `InvoiceCalculationResult`, `InvoiceStatusParams`, dan `InvoicePaymentSummary`.
      - Menyediakan konfigurasi visual terpusat `INVOICE_STATUS_CONFIG` dengan label, palet warna, badge background, dan deskripsi status dalam Bahasa Indonesia yang ramah mode gelap (*dark mode*) dan terang.
  - **Skema Validasi Zod v4:**
    - [`features/invoices/_schemas/invoice.schemas.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_schemas/invoice.schemas.ts):
      - `invoiceItemSchema`: Memvalidasi deskripsi (1-250 karakter), kuantitas (>= 0.0001), harga satuan (>= 0), diskon item (>= 0), dan tarif pajak (0-100%).
      - `invoiceSchema`: Memvalidasi nomor faktur unik, ID pelanggan terpilih, format tanggal ISO `YYYY-MM-DD`, diskon faktur, pajak faktur, dan minimal 1 baris item faktur. Dilengkapi aturan `.refine()` untuk memastikan `dueDate >= issueDate` (tanggal jatuh tempo tidak boleh mendahului tanggal penerbitan).
  - **Mesin Kalkulasi Finansial Terpusat (Pure Calculation Engine):**
    - [`features/invoices/_utils/invoice-calculations.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_utils/invoice-calculations.ts):
      - **Aturan Bebas Duplikasi:** Seluruh form, preview cetak, detail drawer, PDF, dashboard, dan laporan diwajibkan menggunakan utilitas kalkulasi ini tanpa menuliskan rumus matematika terpisah di komponen UI.
      - `roundCurrency(amount, decimals = 2)`: Memitigasi ketidakakuratan *floating-point* JavaScript (misal anomali `0.1 + 0.2 = 0.30000000000000004`).
      - `calculateLineItem()`: Menghitung subtotal item (`qty * unitPrice`), membatasi diskon tidak melebihi subtotal, menghitung nilai pajak item setelah diskon (`taxAmount = afterDiscount * (taxRate / 100)`), dan total item.
      - `calculateInvoiceTotals()`: Menjumlahkan seluruh baris item, menerapkan diskon faktur global setelah diskon item, menghitung dasar pengenaan pajak (*taxable amount*), pajak global, dan grand total akhir (`subtotal - totalDiscount + totalTax`).
      - `calculateInvoiceStatus()`: Mengimplementasikan aturan prioritas siklus hidup faktur:
        1. Faktur berstatus `cancelled` tetap dibatalkan.
        2. `totalPaid >= total` -> `paid` (Lunas).
        3. `0 < totalPaid < total` -> `partially_paid` jika belum jatuh tempo, atau `overdue` jika tanggal referensi telah melewati `dueDate`.
        4. Belum lunas dan tanggal referensi melewati `dueDate` -> `overdue` (Jatuh Tempo).
        5. Faktur berstatus `draft` tetap draf sampai dipublikasikan.
        6. Faktur belum lunas dalam masa tenggang -> `sent` atau `pending`.
      - `calculatePaymentBalance()`: Menghitung total terbayar, sisa tagihan (*remaining balance*), serta flag status pelunasan.
  - **Generator Penomoran Faktur Berurutan:**
    - [`features/invoices/_utils/invoice-number-generator.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_utils/invoice-number-generator.ts):
      - `formatInvoiceNumber()`: Memformat pola standar terpadu `PREFIX-YYYY-0001` (contoh: `INV-2026-0001`) dengan padding angka yang dapat dikonfigurasi.
      - `parseInvoiceNumber()`: Mengekstrak prefix, tahun kalender, dan nomor urut dari format faktur dengan atau tanpa tahun.
      - `generateNextInvoiceNumber()`: Menginspeksi seluruh riwayat faktur yang ada di IndexedDB pada prefix dan tahun berjalan, mencari nomor urut tertinggi, dan menghasilkan nomor urut berikutnya secara otomatis tanpa resiko nomor ganda/tabrakan.
  - **Service Domain Transaksional (IndexedDB Local-First):**
    - [`features/invoices/_services/invoice-domain-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_services/invoice-domain-service.ts):
      - `getNextInvoiceNumber(prefixOverride)`: Mengambil konfigurasi default dari `settingsRepository` dan mencocokkan dengan data `invoiceRepository`.
      - `calculateTotals(input)`: Entry point kalkulasi faktur.
      - `getFullDetails(id)`: Mengambil faktur, seluruh baris item, data profil pelanggan terkait, dan kalkulasi pembayaran secara paralel.
      - `refreshStatus(id)`: Memperbarui status faktur secara otomatis saat ada pencatatan pembayaran baru atau saat tanggal jatuh tempo terlampaui.
      - `createInvoice(formData)`: Memvalidasi data dengan Zod, menghitung seluruh total finansial, menyimpan faktur dan baris item secara atomik via transaksi Dexie `saveWithItems`, serta memperbarui urutan nomor berikutnya di pengaturan perusahaan.
  - **Rangkaian Pengujian Unit (Unit Tests Suite) & Self-Diagnostics:**
    - [`features/invoices/_utils/invoice-calculations.test.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_utils/invoice-calculations.test.ts):
      - Memuat 12 pengujian mandiri yang terbagi ke dalam 5 suite:
        1. *Suite 1 — Line Item Calculation*: Subtotal dasar, kalkulasi diskon item, kalkulasi pajak setelah diskon, pembatasan diskon maksimal.
        2. *Suite 2 — Invoice Totals Calculation*: Agregasi multi-item, diskon level faktur, pajak global, mitigasi presisi desimal.
        3. *Suite 3 — Invoice Status Calculation*: Status lunas/overpaid, cicilan/partially_paid, keterlambatan/overdue, persistensi cancelled, persistensi draft.
        4. *Suite 4 — Payment Balance Calculation*: Akumulasi riwayat pembayaran dan sisa saldo tagihan.
        5. *Suite 5 — Invoice Number Generation*: Pemformatan standar, parsing token penomoran, penentuan urutan tanpa tabrakan.
      - Menghasilkan laporan terstruktur `runInvoiceDomainUnitTests()` (total, passedCount, failedCount, hasil per pengujian).
    - **Integrasi Self-Diagnostics Otomatis:**
      - [`infrastructure/database/diagnostics.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/diagnostics.ts): Mendaftarkan eksekusi pengujian unit domain faktur sebagai langkah ke-7 pada diagnostik sistem lokal di dashboard, memastikan seluruh rumus kalkulasi terverifikasi secara berkala langsung di browser klien.
  - **Public Module Export:**
    - [`features/invoices/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/index.ts): Barrel export untuk tipe, skema, utilitas kalkulasi, generator nomor, pengujian, dan domain service.

---

---

---

## 11. Pengerjaan Step 10 — Implement Invoice Creation

* **Tujuan & Ruang Lingkup:**
  Membangun antarmuka dan alur penerbitan faktur (*invoice creation form*) secara menyeluruh sesuai mandat Blueprint PRD Bagian 10. Fitur mencakup pemilihan pelanggan, manipulasi baris item dinamis (*dynamic line items*), pemilihan produk katalog dengan pengisian otomatis (*auto-fill*), kalkulasi finansial reaktif tanpa duplikasi rumus (*zero duplication live totals*), penomoran faktur berurutan otomatis tanpa tabrakan (*collision-free sequential numbering*), pembuatan pelanggan baru instan di dalam form (*quick customer creation modal*), penyimpanan status draf atau terbit, serta persistensi transaksional ke IndexedDB.

* **Detail Arsitektur & Implementasi Teknis:**
  1. **Custom Hook Pengendali Formulir Faktur ([`useInvoiceForm`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_hooks/use-invoice-form.ts)):**
     - Mengintegrasikan `useForm`, `useFieldArray`, dan `useWatch` dari **React Hook Form**.
     - **Inisialisasi Data Master Paralel:**
       - Mengambil seluruh kontak pelanggan aktif via `customerRepository.getAll()`.
       - Mengambil katalog barang/jasa aktif via `productRepository.getAll()`.
       - Mengambil konfigurasi default usaha (`invoice_defaults`: `prefix`, `dueDays`, `notes`, `paymentInstructions`, default `taxRate`) via `settingsRepository`.
       - Mengambil nomor urut faktur berikutnya via [`InvoiceDomainService.getNextInvoiceNumber()`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_services/invoice-domain-service.ts#L44).
     - **Manipulasi & Format Tanggal ([`date-fns`](file:///d:/DOT%20Indonesia/Project/ficco/package.json#L13)):**
       - Menghitung tanggal terbit hari ini (`yyyy-MM-dd`) dan default tanggal jatuh tempo (+14 hari atau berdasarkan preferensi usaha) menggunakan `format`, `addDays`, dan `parseISO` dari `date-fns` sesuai Bagian 4.7 PRD Blueprint.
     - **Kalkulasi Finansial Real-Time (*Zero Duplication Rule*):**
       - Memantau perubahan kuantitas, harga, diskon, dan pajak tiap baris serta diskon faktur global secara reaktif via `useWatch`.
       - Seluruh perhitungan diproses murni melalui fungsi domain terpusat [`calculateInvoiceTotals()`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_utils/invoice-calculations.ts#L69). Komponen UI tidak melakukan kalkulasi matematika sendiri.
     - **Auto-Fill Produk Katalog:**
       - Fungsi `handleSelectProduct(index, productId)` secara otomatis mengisi nama deskripsi item, harga satuan, dan tarif PPN dari katalog barang/jasa, dengan kuantitas default 1.
     - **Preset Jatuh Tempo Cepat:**
       - Menyediakan tombol jalan pintas (+7, +14, +30, +45 hari) yang menghitung dan memperbarui nilai `dueDate` secara instan.
     - **Penyimpanan Status Draf & Terbit:**
       - Tombol *"Simpan Draf"* menetapkan status `draft`.
       - Tombol *"Terbitkan Faktur"* menetapkan status `sent`.
       - Validasi form dilakukan menggunakan Zod [`invoiceSchema`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_schemas/invoice.schemas.ts#L30) (termasuk validasi tanggal `dueDate >= issueDate`).
       - Data disimpan atomik melalui transaksi multi-tabel Dexie [`InvoiceDomainService.createInvoice()`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_services/invoice-domain-service.ts#L142).

  2. **Antarmuka Pembuatan Faktur Modern ([`InvoiceCreateView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-create-view.tsx)):**
     - **Bilah Aksi & Navigasi:** Tombol kembali ke daftar faktur ([`Icons.arrowLeft`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx#L208)), badge penanda status *"Lokal IndexedDB"*, tombol sekunder *"Simpan Draf"*, dan tombol primer *"Terbitkan Faktur"*.
     - **Pemilihan & Preview Pelanggan:**
       - Menggunakan komponen global [`AppSelect`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/select.tsx) dengan pencarian live (*searchable*) dan adaptasi tema gelap/terang.
       - Tombol *"+ Pelanggan Baru"* memicu modal pembuatan pelanggan instan ([`CustomerFormModal`](file:///d:/DOT%20Indonesia/Project/ficco/features/customers/_components/customer-form-modal.tsx)) sehingga pengguna dapat mendaftarkan klien baru di tengah pengisian faktur tanpa kehilangan draf yang telah diisi.
       - Kartu preview detail kontak pelanggan menampilkan nama perusahaan, email, nomor telepon, dan alamat penagihan secara terformat.
     - **Identifikasi Faktur & Tanggal:**
       - Bidang nomor faktur otomatis dengan tombol segarkan (*refresh*) untuk memeriksa nomor urut terbaru dari IndexedDB.
       - Input tanggal terbit (`issueDate`) dan tanggal jatuh tempo (`dueDate`).
       - Deretan tombol preset jatuh tempo cepat (+7, +14, +30, +45 Hari).
     - **Tabel Baris Item Dinamis:**
       - Dropdown pemilihan katalog produk terintegrasi.
       - Bidang deskripsi item kustom.
       - Bidang kuantitas (`step="any"`, `min="0.0001"`).
       - Bidang harga satuan Rupiah.
       - Bidang diskon per baris item (Rp).
       - Bidang tarif PPN (%).
       - Tampilan live subtotal dan total baris item terhitung langsung via [`calculateLineItem()`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_utils/invoice-calculations.ts#L29).
       - Tombol tambah baris item (*"+ Tambah Baris Item"*) dan tombol hapus item per baris (dilindungi agar minimal menyisakan 1 baris item).
     - **Catatan & Instruksi Pembayaran:**
       - Textarea multi-baris monospace untuk mencantumkan rincian rekening transfer bank dan syarat penagihan (dimuat otomatis dari template pengaturan bisnis).
     - **Kartu Ringkasan Finansial Terpusat (Live Totals Card):**
       - Menampilkan rincian Subtotal Kotor, Total Diskon Item, input Diskon Faktur Global, DPP (Dasar Pengenaan Pajak), Total PPN, dan Grand Total akhir dengan tipografi besar dan kontras warna yang jelas.

  3. **Tampilan Daftar Faktur & Pengujian Persistensi ([`InvoiceListView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-list-view.tsx)):**
     - Menyediakan 4 kartu metrik ringkasan (Total Faktur, Total Nilai Tagihan, Menunggu Pembayaran, Sudah Lunas).
     - Menampilkan tabel faktur tersimpan di IndexedDB dengan nomor faktur, nama pelanggan, tanggal terbit & jatuh tempo, total tagihan (Rp), dan badge status visual berbasis [`INVOICE_STATUS_CONFIG`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_types/invoice.types.ts#L70).
     - *Empty state* interaktif dengan tombol *"Buat Faktur Pertama"* yang mengarahkan pengguna ke form pembuatan.

  4. **Routing & Integrasi Halaman:**
     - [`app/(customer)/invoices/new/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/invoices/new/page.tsx): Route utama halaman pembuatan faktur baru (`/invoices/new`).
     - [`app/(customer)/invoices/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/invoices/page.tsx): Menghubungkan tampilan `InvoiceListView` dengan tombol *"Buat Faktur Baru"* yang mengarah ke `/invoices/new`.
     - [`features/invoices/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/index.ts): Barrel export untuk `useInvoiceForm`, `InvoiceCreateView`, dan `InvoiceListView`.
     - [`shared/_components/icons.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx): Penambahan ikon `arrowLeft` untuk navigasi kembali.

---

## 12. Pengerjaan Step 11 — Implement Invoice List/Detail

* **Tujuan & Ruang Lingkup:**
  Membangun manajemen daftar faktur dan tampilan rincian dokumen (*invoice list & detail view*) secara menyeluruh sesuai mandat Blueprint PRD Bagian 11. Fitur mencakup pencarian multi-kolom (*search*), filter status siklus hidup (*status filter*), pengurutan multi-kriteria (*sorting*), paginasi (*pagination*), panel laci rincian faktur instan (*sliding detail drawer*), halaman detail mandiri siap cetak/PDF, alur edit faktur (*edit flow*), pembatalan faktur (*cancellation*), serta penghapusan aman dengan kaskade data (*cascading delete*) di IndexedDB.

* **Detail Arsitektur & Implementasi Teknis:**
  1. **Peningkatan Manajemen Database & Repositori ([`invoiceRepository`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/repositories/invoice-repository.ts)):**
     - Menambahkan fungsi [`saveWithItems(invoice, items)`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/repositories/invoice-repository.ts#L64-L78) yang melakukan transaksi atomik Dexie (`put` invoice, pembersihan item lama, dan `bulkAdd` item baru) untuk mendukung pembaruan/edit faktur tanpa meninggalkan *orphan records*.
     - Menyempurnakan [`InvoiceDomainService`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_services/invoice-domain-service.ts) dengan metode:
       - `updateInvoice(id, formData)`: Validasi Zod, rekalkulasi finansial terpusat, dan pembaruan atomik di IndexedDB.
       - `cancelInvoice(id)`: Mengubah status menjadi `'cancelled'`.
       - `updateStatus(id, newStatus)`: Mengubah status siklus hidup (misal: draf -> terbit).
       - `deleteInvoice(id)`: Penghapusan kaskade faktur, seluruh baris item, dan riwayat pembayaran via `deleteWithItems`.

  2. **Dukungan Mode Edit pada Form Faktur ([`useInvoiceForm`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_hooks/use-invoice-form.ts)):**
     - Opsi `invoiceId` memungkinkan inisialisasi form dalam **Mode Edit** dengan mengambil data faktur dan seluruh baris itemnya via `InvoiceDomainService.getFullDetails(id)`.
     - Menyimpan perubahan dengan memanggil `updateInvoice` secara otomatis ketika dalam mode edit, atau `createInvoice` ketika dalam mode pembuatan baru.
     - Komponen form ([`InvoiceCreateView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-create-view.tsx)) dan aliasnya ([`InvoiceEditView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-create-view.tsx#L625)) secara dinamis menyesuaikan judul, lencana (*badge*), dan label tombol aksi ("Perbarui & Simpan").

  3. **Tampilan Daftar Faktur Terpadu ([`InvoiceListView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-list-view.tsx)):**
     - **Metrik Statistik Real-Time:** 4 kartu metrik (Total Faktur, Total Tagihan, Menunggu Pembayaran/Draf, Sudah Lunas) yang dihitung dari seluruh rekaman di IndexedDB.
     - **Pencarian Multi-Kolom (*Live Search*):** Mencari berdasarkan nomor faktur, nama klien/perusahaan, dan catatan penagihan dengan tombol reset instan.
     - **Filter Status Siklus Hidup:** Dropdown berbasis `AppSelect` yang memfilter: *Semua Status, Draf, Terkirim, Menunggu Pembayaran, Dibayar Sebagian, Lunas, Jatuh Tempo, dan Dibatalkan*.
     - **Pengurutan Fleksibel (*Multi-Sorting*):** Opsi urutkan berdasarkan *Terbaru Ditambahkan, Terlama Ditambahkan, Jatuh Tempo Terdekat, Nilai Tertinggi, dan Nilai Terendah*.
     - **Tampilan Responsif Desktop & Mobile:**
       - Tabel desktop elegan dengan efek hover, badge status visual berbasis `INVOICE_STATUS_CONFIG`, dan tombol aksi cepat per baris.
       - Tampilan kartu seluler (*mobile card list*) yang nyaman disentuh pada layar smartphone.
     - **Paginasi Cerdas (*Client Pagination*):** Membatasi 10 faktur per halaman dengan kontrol navigasi halaman (sebelumnya, nomor halaman, berikutnya).

  4. **Panel Laci Detail Instan & Halaman Dokumen Mandiri:**
     - **Sliding Detail Drawer ([`InvoiceDetailDrawer`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-detail-drawer.tsx)):**
       - Membuka laci geser dari sisi kanan layar saat mengklik baris faktur, memungkinkan pengguna memeriksa rincian lengkap tanpa berpindah halaman atau kehilangan filter pencarian.
     - **Dokumen Faktur Siap Cetak/PDF ([`InvoiceDetailView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-detail-view.tsx)):**
       - Menampilkan identitas penerbit (profil usaha dari `company_profile`), identitas klien/pelanggan, tanggal terbit & jatuh tempo dengan peringatan jatuh tempo (*overdue alert*).
       - Tabel itemized lengkap dengan kuantitas, harga satuan, diskon, dan tarif pajak per baris.
       - Ringkasan finansial terpusat: Subtotal, Diskon, DPP, PPN, dan Grand Total.
       - Ringkasan pelunasan: Total Terbayar dan Sisa Tagihan (*remaining balance*).
       - Catatan dan instruksi transfer bank.
       - Tombol aksi dokumen: *Cetak Faktur* (`window.print()` dengan CSS `@media print`), *Edit*, *Tandai Terbit*, *Batalkan*, dan *Hapus Faktur* dengan modal konfirmasi aman.
     - **Halaman Detail Mandiri ([`app/(customer)/invoices/[id]/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/invoices/[id]/page.tsx)):** Route URL permanen `/invoices/[id]`.
     - **Halaman Edit Mandiri ([`app/(customer)/invoices/[id]/edit/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/invoices/[id]/edit/page.tsx)):** Route URL permanen `/invoices/[id]/edit`.

---

## 13. Pengerjaan Step 12 — Implement Payments

* **Tujuan & Ruang Lingkup:**
  Membangun manajemen pencatatan pembayaran faktur (*payment recording and tracking*) secara menyeluruh sesuai mandat Blueprint PRD Bagian 12. Fitur mencakup:
  - Pencatatan pembayaran faktur (pembayaran penuh maupun bertahap/sebagian — *partial & full payments*).
  - Dukungan metode pembayaran lengkap: Transfer Bank, Tunai, Kartu Kredit, QRIS, e-Wallet, Giro/Cek, dan Lainnya.
  - Pembaruan status faktur otomatis (*automatic invoice status transition*) berdasarkan rekalkulasi saldo pembayaran:
    - Belum ada pembayaran: status tetap draf/terkirim/menunggu (atau *overdue* jika melewati tanggal jatuh tempo).
    - Pembayaran sebagian (`0 < totalPaid < grandTotal`): status otomatis menjadi `partially_paid` (atau *overdue* jika melewati tanggal jatuh tempo).
    - Pembayaran lunas (`totalPaid >= grandTotal`): status otomatis menjadi `paid`.
    - Pembatalan/penghapusan transaksi pembayaran: status dikembalikan (*rollback*) secara otomatis ke status sebelumnya yang valid.
  - Riwayat pembayaran per faktur (*payment history*) dengan rincian tanggal pembayaran, metode, catatan/referensi transaksi, serta aksi penghapusan dengan modal konfirmasi aman.
  - Integrasi antarmuka pada tampilan daftar faktur ([`InvoiceListView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-list-view.tsx)), laci rincian ([`InvoiceDetailDrawer`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-detail-drawer.tsx)), dan halaman dokumen faktur ([`InvoiceDetailView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-detail-view.tsx)).

* **Detail Arsitektur & Implementasi Teknis:**
  1. **Schema & Tipe Domain:**
     - [`payment.schemas.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_schemas/payment.schemas.ts): Validasi Zod v4 `paymentFormSchema` dengan validasi jumlah pembayaran positif (`amount > 0`), pilihan metode pembayaran valid, tanggal pembayaran ISO string, serta catatan/referensi opsional.
     - [`payment.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_types/payment.types.ts): Ekspor tipe domain `Payment`, `PaymentFormData`, konstanta opsi `PAYMENT_METHODS`, dan interface ringkasan saldo `PaymentSummary`.
  2. **Payment Domain Service ([`PaymentService`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_services/payment-service.ts)):**
     - `recordPayment(formData)`: Memvalidasi form, menyimpan data transaksi ke tabel IndexedDB `payments` via `paymentRepository`, dan otomatis memicu `InvoiceDomainService.refreshStatus(invoiceId)`.
     - `deletePayment(paymentId)`: Menghapus catatan pembayaran dan otomatis memperbarui status faktur via `InvoiceDomainService.refreshStatus(invoiceId)` sehingga status melakukan rollback yang akurat.
     - `getByInvoiceId(invoiceId)`: Mengambil seluruh transaksi pembayaran faktur dengan urutan tanggal terbaru.
     - `getSummary(invoiceId)`: Menghitung total tagihan, total terbayar, sisa saldo (*remaining balance*), persentase pelunasan, dan status pelunasan faktur.
  3. **Penyempurnaan Domain Faktur ([`InvoiceDomainService`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_services/invoice-domain-service.ts)):**
     - Menambahkan array `payments` ke interface `InvoiceFullDetails` dan `getFullDetails(id)` agar riwayat pembayaran selalu terintegrasi dalam data rincian faktur.
     - Memastikan `refreshStatus(id)` melakukan update status faktur di IndexedDB secara reaktif ketika pembayaran dicatat atau dihapus.
  4. **Komponen Antarmuka Pembayaran:**
     - **Modal Pencatatan Pembayaran ([`PaymentModal`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/payment-modal.tsx)):**
       - Modal dialog interaktif dengan ringkasan sisa saldo faktur.
       - Tombol cepat *"Lunasi Penuh"* yang otomatis mengisi jumlah sisa saldo ke input pembayaran.
       - Pilihan metode pembayaran berbasis `AppSelect` (sinkron tema Dark/Light), pemilih tanggal HTML5, dan input catatan transaksi.
     - **Kartu Riwayat Pembayaran ([`PaymentHistoryCard`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/payment-history-card.tsx)):**
       - *Progress bar* visual persentase pelunasan faktur.
       - 3 kartu ringkasan metrik: *Total Tagihan*, *Total Terbayar*, dan *Sisa Saldo*.
       - Daftar transaksi pembayaran dengan badge metode, tanggal, catatan, dan tombol hapus per transaksi disertai modal konfirmasi.
       - Tombol pemicu *"+ Catat Pembayaran"* yang otomatis dinonaktifkan jika faktur telah lunas atau dibatalkan (`cancelled`).
  5. **Integrasi Halaman & Komponen Faktur:**
     - [`InvoiceDetailView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-detail-view.tsx): Menyematkan tombol aksi cepat *"+ Catat Pembayaran"* pada baris aksi dokumen dan merender `PaymentHistoryCard` di bagian bawah dokumen faktur.
     - [`InvoiceListView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-list-view.tsx): Menyediakan tombol aksi cepat catat pembayaran (ikon dompet/kartu kredit) pada setiap baris tabel desktop dan kartu seluler yang belum lunas.
     - [`shared/_components/icons.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx): Menambahkan ikon SVG `creditCard` dan `receipt`.
     - [`features/invoices/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/index.ts): Mengekspor seluruh modul pembayaran (`PaymentService`, `PaymentModal`, `PaymentHistoryCard`, skema, dan tipe).
  6. **Pengujian Unit Otomatis ([`invoice-calculations.test.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_utils/invoice-calculations.test.ts)):**
     - Memperluas Suite 4 untuk menguji semua kriteria penerimaan Step 12: transisi otomatis status faktur dari 0 pembayaran, pembayaran parsial, pembayaran lunas, jatuh tempo (*overdue*), hingga *draft*.

---

---

## 14. Pengerjaan Step 13 — Implement Invoice PDF

* **Tujuan & Ruang Lingkup:**
  Membangun fungsionalitas pratinjau lembar faktur (*invoice preview*), pembuatan berkas PDF secara 100% lokal/offline (*client-side vector PDF generation*), pencetakan dokumen siap cetak (*print-ready styling*), serta integrasi data identitas usaha, pelanggan, rincian item, kalkulasi finansial, catatan, dan riwayat pembayaran sesuai spesifikasi Step 13 pada [`docs/invoice-expense-prd-blueprint.md`](file:///d:/DOT%20Indonesia/Project/ficco/docs/invoice-expense-prd-blueprint.md).
  - Pratinjau faktur interaktif (*Invoice Preview Modal*) dengan zoom controls (75%, 100%, 125%, reset) dan adaptasi tata letak A4 responsif untuk desktop dan layar ponsel/smartphone.
  - Pembuatan berkas PDF murni di sisi peramban (*zero-dependency client-side PDF 1.4 vector engine*) tanpa panggilan server atau pustaka pihak ketiga yang bermasalah dengan React 19.
  - Unduhan langsung berkas `.pdf` standar (`Faktur-{invoiceNumber}.pdf`) yang dapat dibuka di seluruh aplikasi pembaca PDF desktop dan seluler secara instan (< 20ms).
  - Integrasi pencetakan native peramban (`window.print()`) dengan stylesheet cetak terisolasi (`@media print`) yang otomatis menyembunyikan navigasi, sidebar, header, dan elemen interaktif lainnya.
  - Memastikan seluruh informasi penting termuat lengkap: profil usaha (nama, legal name, alamat, telepon, email, NPWP, logo base64), klien/pelanggan, tabel item penagihan, catatan faktur, instruksi rekening bank, ringkasan kalkulasi (Subtotal, Diskon, DPP, PPN, Grand Total), serta ringkasan pelunasan (Total Terbayar dan Sisa Tagihan).

* **Detail Arsitektur & Implementasi Teknis:**
  1. **Low-Level PDF Infrastructure (`infrastructure/pdf/`):**
     - [`pdf-document-builder.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/pdf/pdf-document-builder.ts): Mesin pembangun PDF 1.4 biner mandiri (*zero-dependency vector builder*). Mengimplementasikan translasi koordinat A4 (595.28 × 841.89 pt) top-left, font standar Type1 (Helvetica, Helvetica-Bold, Helvetica-Oblique), *word-wrap* otomatis, rendering teks rata kiri/kanan/tengah, gambar garis/persegi dengan palet warna HSL/RGB, tabel *cross-reference* (`xref`), kamus `trailer`, hingga kompilasi `Uint8Array`, `Blob`, dan pemicu download otomatis di browser.
     - [`invoice-pdf-generator.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/pdf/invoice-pdf-generator.ts): Templat tata letak dokumen faktur eksekutif A4. Mengatur tata letak header dua kolom (penerbit & metadata faktur dengan badge status visual), kotak identitas klien penagihan, tabel rincian item dengan garis pembatas halus dan warna latar selang-seling, kolom catatan & informasi rekening bank, tabel kalkulasi finansial terstruktur, kartu status pelunasan, hingga footer legal.
     - [`index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/pdf/index.ts): Barrel export infrastruktur PDF publik (`downloadInvoicePdf`, `generateInvoicePdfBlob`, `buildInvoicePdf`, `PdfDocumentBuilder`).
     - [`infrastructure/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/index.ts): Mengekspos namespace `pdf` ke seluruh aplikasi.
  2. **Domain Layer & Custom Hooks (`features/invoices/`):**
     - [`use-invoice-pdf.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_hooks/use-invoice-pdf.ts): Custom hook untuk mengelola proses pengunduhan PDF faktur, sinkronisasi profil usaha & instruksi rekening default via `SettingsService.loadAll()`, pelacakan status loading/generating, penanganan error, dan pemicu cetak dokumen.
  3. **Komponen Antarmuka Pratinjau & Cetak:**
     - [`InvoicePreviewSheet`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-preview-sheet.tsx): Komponen murni lembar A4 (210 × 297 mm) siap cetak dan pratinjau yang merender logo usaha, profil bisnis, identitas pelanggan, tabel rincian transaksi, instruksi bank, status pembayaran, dan total tagihan. Memiliki kelas `printable-invoice-sheet` untuk isolasi gaya cetak.
     - [`InvoicePreviewModal`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-preview-modal.tsx): Modal dialog pratinjau dokumen dengan latar belakang gelap/blur, bilah kontrol zoom persentase (60% - 150%), tombol pemicu unduh PDF instan, tombol pemicu cetak, dan viewport responsif ramah sentuhan.
  4. **Penyempurnaan Tampilan Faktur Eksisting:**
     - [`InvoiceDetailView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-detail-view.tsx):
       - Menambahkan tombol aksi cepat: *"Pratinjau"* (membuka `InvoicePreviewModal`), *"Unduh PDF"* (ekspor file PDF langsung), dan *"Cetak"* (`window.print()`).
       - Menampilkan logo usaha dan instruksi rekening bank dari pengaturan profil secara reaktif.
     - [`InvoiceListView`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_components/invoice-list-view.tsx):
       - Menyematkan tombol aksi cepat *"Pratinjau / PDF"* pada tabel desktop dan kartu seluler untuk kemudahan akses satu klik.
     - [`app/globals.css`](file:///d:/DOT%20Indonesia/Project/ficco/app/globals.css):
       - Konfigurasi `@media print` lengkap: `@page { size: A4 portrait; margin: 10mm 12mm; }`, menyembunyikan header, sidebar, navigasi mobile, tombol aksi, serta pencegahan pemotongan baris tabel (`break-inside: avoid`).
     - [`shared/_components/icons.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx):
       - Menambahkan ikon utilitas SVG ringan: `download`, `printer`, `zoomIn`, `zoomOut`.
  5. **Pengujian Unit Otomatis Biner PDF (`invoice-pdf.test.ts`):**
     - [`invoice-pdf.test.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/invoices/_utils/invoice-pdf.test.ts): Suite pengujian otomatis yang memverifikasi struktur biner PDF 1.4 (`%PDF-1.4`, `trailer`, `xref`, `%%EOF`), ketepatan penyisipan nomor faktur, profil usaha, identitas klien, ketahanan terhadap data kosong, serta paginasi dokumen multi-item.
     - Terintegrasi langsung ke dalam kartu pengujian mandiri [`infrastructure/database/diagnostics.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/diagnostics.ts).

---

## 16. Pengerjaan Step 14 — Implement Expense Management

* **Tujuan & Ruang Lingkup:**
  Membangun manajemen pencatatan beban dan pengeluaran operasional usaha (*expense management*) secara menyeluruh sesuai mandat Step 14 pada [`docs/invoice-expense-prd-blueprint.md`](file:///d:/DOT%20Indonesia/Project/ficco/docs/invoice-expense-prd-blueprint.md). Fitur mencakup:
  - Manajemen kategori pengeluaran (*expense categories*): inisialisasi kategori standar otomatis, buat/edit/toggle aktif/hapus dengan proteksi integritas transaksi.
  - Operasi CRUD pengeluaran (*expense CRUD*): catat pengeluaran baru, ubah, hapus, dan lihat rincian transaksi lengkap.
  - Pengelolaan data finansial terstruktur: tanggal transaksi ISO YYYY-MM-DD, nominal beban (Rupiah), metode pembayaran terintegrasi, deskripsi pengeluaran, serta catatan/nomor struk/kuitansi.
  - Mesin kalkulasi murni (*pure calculation engine*): total beban, rata-rata pengeluaran, agregasi persentase per kategori, perbandingan *month-over-month* (MoM), dan mitigasi ketidakakuratan *floating point*.
  - Penyaringan dan pencarian multi-kriteria (*search & filters*): pencarian teks bebas (deskripsi, catatan, nama kategori), filter kategori, filter metode bayar, filter rentang tanggal (preset bulan ini, bulan lalu, tahun ini, semua waktu, kustom), dan multi-sorting.
  - Integrasi antarmuka responsif desktop dan layar ponsel/smartphone dengan 4 kartu metrik eksekutif, modal pencatatan interaktif, laci rincian, dialog konfirmasi hapus aman, dan pengujian unit otomatis di browser.

* **Detail Arsitektur & Implementasi Teknis:**
  1. **Definisi Tipe Domain & Skema Validasi (`features/expenses/`):**
     - [`expense.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_types/expense.types.ts):
       - Re-export entitas database `Expense` dan `ExpenseCategory`.
       - Tipe `ExpenseWithCategory` (resolusi entitas kategori terkait).
       - Koleksi metode pembayaran [`EXPENSE_PAYMENT_METHODS`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_types/expense.types.ts#L18): Transfer Bank, Tunai / Kas Kecil, Kartu Kredit, Kartu Debit, QRIS, e-Wallet, Giro / Cek, dan Lainnya.
       - Koleksi 8 kategori bawaan [`DEFAULT_EXPENSE_CATEGORIES`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_types/expense.types.ts#L34): Operasional Kantor, Gaji & Upah, Pemasaran & Iklan, Server & Software, Transportasi & Perjalanan, Pemeliharaan & Servis, Pajak & Legalitas, dan Lain-lain.
       - Tipe kriteria filter `ExpenseFilter`, opsi pengurutan `ExpenseSortBy`, preset rentang tanggal `ExpenseDateRangePreset`, serta struktur metrik `ExpenseSummaryStats` & `CategoryBreakdownItem`.
     - [`expense.schemas.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_schemas/expense.schemas.ts):
       - `expenseSchema`: Validasi Zod v4 untuk kategori terpilih, deskripsi wajib (1-200 karakter), nominal belanja positif (`min: 1`, `max: 1.000.000.000.000`), tanggal format ISO `YYYY-MM-DD`, metode pembayaran valid, dan catatan opsional.
       - `expenseCategorySchema`: Validasi Zod v4 untuk nama kategori (1-60 karakter), deskripsi opsional, dan status boolean `active`.
  2. **Mesin Kalkulasi & Utilitas Filter Finansial (`expense-calculations.ts`):**
     - [`expense-calculations.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_utils/expense-calculations.ts):
       - `roundCurrency(amount, decimals)`: Mitigasi anomali presisi desimal JavaScript.
       - `calculateExpenseTotals()`: Menghitung total nominal, jumlah transaksi, rata-rata per transaksi, nominal terendah, dan nominal tertinggi.
       - `calculateCategoryBreakdown()`: Mengelompokkan beban per kategori, menghitung akumulasi nominal per kategori, dan menghitung persentase pangsa belanja relatif terhadap total.
       - `getDateRangeBounds()`: Menghitung batas tanggal awal dan akhir berdasarkan preset kalender menggunakan pustaka `date-fns` (`startOfMonth`, `endOfMonth`, `subMonths`, `startOfYear`, `endOfYear`).
       - `filterExpenses()`: Fungsi penyaringan murni untuk kata kunci pencarian, filter kategori, filter metode pembayaran, batas tanggal, dan pengurutan (terbaru, terlama, nominal terbesar/terkecil).
       - `calculateExpenseSummary()`: Menghasilkan ringkasan komparasi bulan berjalan versus bulan sebelumnya (*month-over-month growth/reduction percentage*) dan kategori pengeluaran dominan.
  3. **Lapisan Layanan Domain Local-First (`ExpenseDomainService`):**
     - [`expense-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_services/expense-service.ts):
       - Beroperasi langsung di atas `expenseRepository` dan `expenseCategoryRepository` pada IndexedDB.
       - `seedDefaultCategoriesIfEmpty()`: Menjamin 8 kategori usaha standar otomatis tersedia pada inisialisasi awal.
       - `seedSampleExpenses()`: Generator data dummy 4 transaksi beban operasional untuk pengujian instan.
       - `getAllExpenses()`, `getExpenseById()`, `createExpense()`, `updateExpense()`, `deleteExpense()`.
       - `getAllCategories()`, `createCategory()`, `updateCategory()`, `toggleCategoryActive()`.
       - `deleteCategory()`: Dilindungi dengan pemeriksaan `getCategoryUsageCount()`. Mencegah penghapusan jika kategori sudah terikat pada transaksi pengeluaran aktif guna menjaga integritas data historis.
       - `getSummaryStats()`: Mengambil ringkasan metrik eksekutif.
  4. **Custom Hook Pengendali State (`useExpenses`):**
     - [`use-expenses.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_hooks/use-expenses.ts):
       - Mengatur sinkronisasi data reaktif antara IndexedDB dan antarmuka.
       - Mengontrol parameter pencarian, filter kategori, filter metode, preset tanggal, custom range, dan pengurutan.
       - Mengelola status paginasi (10 transaksi per halaman) dengan penyesuaian otomatis ke halaman 1 saat filter berubah.
       - Mengendalikan status buka/tutup modal formulir, modal kelola kategori, dialog detail transaksi, dan konfirmasi hapus aman.
  5. **Komponen Antarmuka Pengguna (`features/expenses/_components/`):**
     - [`ExpenseListView`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_components/expense-list-view.tsx):
       - 4 Kartu Metrik KPI: Total Beban Bulan Ini (+/- MoM %), Total Transaksi, Kategori Terbesar (Rp & %), Rata-rata per Pengeluaran.
       - Bilah Filter & Pencarian: Input pencarian live dengan reset cepat, dropdown kategori `AppSelect`, dropdown rentang tanggal, pemilih metode pembayaran, dan dropdown sorting.
       - Tabel Desktop: Desain modern bernuansa slate/zinc dengan badge kategori biru, badge metode bayar, nominal font tebal bernuansa rose/merah, serta tombol aksi cepat (Lihat, Edit, Hapus).
       - Tampilan Kartu Ponsel: Tampilan kartu seluler responsif untuk kenyamanan satu tangan pada layar smartphone.
       - Empty State Interaktif: Tombol "Catat Pengeluaran Pertama" dan "Muat Data Contoh".
       - Kontrol Paginasi Cerdas: Navigasi halaman sebelumnya, halaman berikutnya, serta status total data.
     - [`ExpenseFormModal`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_components/expense-form-modal.tsx):
       - Modal dialog formulir catat/edit pengeluaran terintegrasi React Hook Form + Zod.
       - Input tanggal HTML5, input nominal dengan helper pratinjau format Rupiah otomatis (Rp 1.500.000), pemilih kategori dengan pintasan tombol "Kelola Kategori", pemilih metode bayar `AppSelect`, deskripsi pengeluaran, dan textarea catatan/nomor struk. Dilengkapi tombol *Dev Sample* untuk pengujian cepat.
     - [`ExpenseCategoryModal`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_components/expense-category-modal.tsx):
       - Dialog modal untuk mengelola direktori kategori pengeluaran.
       - Formulir inline tambah/edit kategori baru, daftar kategori dengan indikator aktif/non-aktif, tombol toggle status satu klik, tombol edit, dan tombol hapus disertai konfirmasi aman.
     - [`ExpenseDetailModal`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_components/expense-detail-modal.tsx):
       - Tampilan dialog detail rincian transaksi dengan kartu sorotan nominal besar, badge kategori, tanggal terformat, metode bayar, deskripsi lengkap, catatan, metadata timestamp, dan tombol aksi Edit / Hapus.
     - [`ExpenseDeleteDialog`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_components/expense-delete-dialog.tsx):
       - Dialog konfirmasi hapus permanen dengan rincian transaksi dan proteksi status loading.
  6. **Rangkaian Pengujian Unit Otomatis & Diagnostik Sistem:**
     - [`expense-calculations.test.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/_utils/expense-calculations.test.ts):
       - Suite pengujian unit otomatis mandiri mencakup 6 suite pengujian:
         1. *Suite 1 — Totals & Aggregations*: Perhitungan akumulasi jumlah, rata-rata, min, max, penanganan array kosong, dan presisi floating-point.
         2. *Suite 2 — Category Breakdown*: Agregasi per kategori dan akurasi persentase pangsa beban.
         3. *Suite 3 — Date Filtering*: Filter waktu berjalan (`this_month`), bulan lalu (`last_month`), tahun berjalan (`this_year`), dan batas tanggal kustom.
         4. *Suite 4 — Search & Filter*: Pencarian teks bebas multi-kolom dan filter metode pembayaran.
         5. *Suite 5 — Sorting*: Pengurutan nominal tertinggi/terendah dan tanggal transaksi.
         6. *Suite 6 — Executive Summary*: Perhitungan komparasi bulanan MoM dan kategori belanja terbesar.
       - Terintegrasi langsung sebagai langkah ke-9 pada diagnostik sistem di [`infrastructure/database/diagnostics.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/diagnostics.ts).
  7. **Ikon & Integrasi Halaman:**
     - [`shared/_components/icons.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx): Menambahkan ikon SVG ringan `calendar`, `tag`, `filter`, `wallet`, `trendingDown`.
     - [`shared/_utils/dev-data-generator.ts`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_utils/dev-data-generator.ts): Menambahkan fungsi generator dummy `generateExpenseDummy`.
     - [`features/expenses/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/expenses/index.ts): Barrel export lengkap modul pengeluaran.
     - [`app/(customer)/expenses/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/expenses/page.tsx): Integrasi langsung me-render `ExpenseListView` dengan metadata SEO lengkap.

---

---

## 17. Sesi Implementasi Step 15: Implement Dashboard

- **Tujuan Fitur**:
  - Membangun dasbor eksekutif keuangan komprehensif 100% offline lokal yang diturunkan langsung dari IndexedDB (Dexie) tanpa membutuhkan request server apapun.
  - Menyajikan metrik pendapatan (*Revenue*), pengeluaran (*Expenses*), laba bersih (*Net Profit*), persentase margin keuntungan (*Profit Margin*), piutang tertunda (*Outstanding Invoices*), dan faktur lewat jatuh tempo (*Overdue Invoices*).
  - Menyajikan visualisasi tren keuangan historis 6 bulan terakhir (Revenue vs Expenses vs Net Profit) dan distribusi 5 kategori pengeluaran terbesar (*Expense Category Share*).
  - Menampilkan daftar 5 faktur penjualan terbaru dan 5 pengeluaran terbaru dengan status dan navigasi langsung.
  - Menyediakan filter rentang waktu: Bulan Ini (`this_month`), Bulan Lalu (`last_month`), Tahun Ini (`this_year`), Semua Waktu (`all`), dan Rentang Tanggal Kustom (`custom`).

- **Detail Implementasi**:
  1. **Tipe Data & Model (`features/dashboard/_types/`):**
     - [`dashboard.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_types/dashboard.types.ts):
       - Definisi kontrak `DashboardMetrics`, `DashboardFilter`, `DashboardDateRangePreset`, `RecentInvoiceItem`, `RecentExpenseItem`, `MonthlyFinancialTrend`, `ExpenseCategoryShare`, dan `DashboardData`.
  2. **Mesin Kalkulasi Domain Murni (`features/dashboard/_utils/`):**
     - [`dashboard-calculations.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_utils/dashboard-calculations.ts):
       - `getDashboardDateBounds()` & `getPreviousPeriodBounds()`: Menghitung rentang tanggal presisi berdasarkan preset waktu atau rentang kustom beserta periode komparasi sebelumnya (MoM).
       - `calculateDashboardMetrics()`: Menghitung pendapatan aktual dari riwayat pembayaran / faktur lunas, total biaya pengeluaran, laba bersih, rasio margin %, perubahan persentase MoM, sisa piutang tertunda, dan faktur jatuh tempo.
       - `generateMonthlyTrends()`: Menghasilkan deret metrik 6 bulan historis berurutan untuk visualisasi tren arus kas.
       - `calculateDashboardCategoryBreakdown()`: Mengagregasi 5 kategori pengeluaran teratas dan menghitung porsi persentase share masing-masing.
  3. **Rangkaian Pengujian Unit Otomatis (`features/dashboard/_utils/`):**
     - [`dashboard-calculations.test.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_utils/dashboard-calculations.test.ts):
       - 6 suite pengujian unit (8 tes verifikasi): Perhitungan metrik eksekutif, pembatasan rentang tanggal, periode MoM, deret tren 6 bulan, distribusi beban kategori, dan batas aman pembagian nol (zero-division).
  4. **Domain Service & Hook Reaktif (`features/dashboard/`):**
     - [`dashboard-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_services/dashboard-service.ts):
       - `DashboardDomainService`: Mengakses data lokal secara asinkron dari `invoiceRepository`, `paymentRepository`, `expenseRepository`, `customerRepository`, dan `expenseCategoryRepository`, lalu mengagregasikannya.
     - [`use-dashboard.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_hooks/use-dashboard.ts):
       - Hook React `'use client'` untuk mengelola filter periode, tanggal kustom, pemuatan data reaktif, serta pembaruan instan (*refresh*).
  5. **Komponen Visual Dashboard (`features/dashboard/_components/`):**
     - [`DashboardQuickActions`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_components/dashboard-quick-actions.tsx): Toolbar header dengan pemilih preset tanggal `AppSelect`, input tanggal kustom (dari-sampai), tombol refresh, serta tombol pintasan aksi cepat `+ Biaya` dan `+ Faktur Baru`.
     - [`DashboardMetricsGrid`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_components/dashboard-metrics-grid.tsx): 5 kartu KPI eksekutif (Total Pendapatan, Total Beban, Laba Bersih & Margin %, Sisa Tagihan, dan Faktur Jatuh Tempo) lengkap dengan perbandingan MoM dan skeleton loading.
     - [`DashboardFinancialChart`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_components/dashboard-financial-chart.tsx): Grafik batang interaktif Recharts untuk arus kas 6 bulan terakhir (Pendapatan vs Beban vs Laba Bersih) serta bar progres visual 5 kategori pengeluaran terbesar.
     - [`DashboardRecentInvoices`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_components/dashboard-recent-invoices.tsx): Tabel ringkas 5 faktur penjualan terbaru dengan badge status warna, nama pelanggan, sisa tagihan, dan tautan langsung ke detail faktur.
     - [`DashboardRecentExpenses`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_components/dashboard-recent-expenses.tsx): Daftar 5 pengeluaran operasional terbaru dengan badge kategori, metode pembayaran, tanggal, dan nominal.
     - [`DashboardView`](file:///d:/DOT%20Indonesia/Project/ficco/features/dashboard/_components/dashboard-view.tsx): Wadah utama yang merangkai seluruh komponen dashboard di atas beserta widget status database offline IndexedDB yang dapat dilipat (*accordion*).
  6. **Ikon & Integrasi Diagnostik:**
     - [`shared/_components/icons.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx): Menambahkan ikon SVG `trendingUp`, `clock`, `alertCircle`, dan `arrowUpRight`.
     - [`infrastructure/database/diagnostics.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/diagnostics.ts): Mendaftarkan `Dashboard Domain Unit Tests` sebagai langkah diagnostik ke-10.
     - [`app/(customer)/dashboard/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/dashboard/page.tsx): Diperbarui untuk me-render `DashboardView` dengan metadata SEO lengkap.

- **Status & Hasil**:
  - Seluruh kriteria penerimaan Step 15 terpenuhi: Perhitungan akurat, 100% offline lokal tanpa request server, filter tanggal responsif, visualisasi grafik Recharts modern, dan data faktur/pengeluaran terintegrasi penuh.

---

---

## 18. Sesi Implementasi Step 16: Implement Reports

- **Tujuan Fitur**:
  - Membangun modul laporan keuangan komprehensif (*Financial Reports*) 100% lokal berbasis IndexedDB (Dexie) tanpa membutuhkan komunikasi server.
  - Menyediakan 3 tab laporan utama:
    1. **Ringkasan Laba Rugi (*Profit & Loss Statement*)**: Menampilkan pendapatan, beban operasional, laba bersih, margin laba %, perbandingan MoM/YoY, grafik batang komparasi bulanan, dan tabel rincian periodik lengkap dengan ringkasan total.
    2. **Laporan Pendapatan (*Revenue Report*)**: Menampilkan pendapatan terealisasi, total nilai faktur diterbitkan, tingkat pelunasan (*collection rate* %), rata-rata ukuran faktur, grafik tren penerimaan kas, tabel pendapatan per pelanggan (dengan kontribusi %), dan tabel pendapatan per produk/layanan.
    3. **Laporan Pengeluaran (*Expense Report*)**: Menampilkan total biaya, total transaksi beban, rata-rata pengeluaran, kategori pengeluaran terbesar, grafik tren pengeluaran bulanan, tabel rincian per kategori, dan tabel rincian per metode pembayaran.
  - Menyediakan filter waktu fleksibel: Bulan Ini (`this_month`), Bulan Lalu (`last_month`), Kuartal Ini (`this_quarter`), Tahun Ini (`this_year`), Semua Periode (`all`), dan Rentang Tanggal Kustom (`custom`).
  - Fitur ekspor data 100% offline: Unduh berkas CSV instan untuk setiap tab (dilengkapi UTF-8 BOM untuk Microsoft Excel) dan tombol cetak laporan (*Print / Save as PDF*).

- **Detail Implementasi**:
  1. **Tipe Data & Model (`features/reports/_types/`):**
     - [`reports.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_types/reports.types.ts):
       - Definisi kontrak `ReportDatePreset`, `ReportFilter`, `ProfitLossSummary`, `PeriodicFinancialRow`, `CustomerRevenueRow`, `ProductRevenueRow`, `CategoryExpenseRow`, `PaymentMethodExpenseRow`, `RevenueReportData`, `ExpenseReportData`, dan `ReportsData`.
  2. **Mesin Kalkulasi Domain Murni & Utilitas Ekspor (`features/reports/_utils/`):**
     - [`reports-calculations.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_utils/reports-calculations.ts):
       - `getReportDateBounds()`: Resolusi batas tanggal untuk seluruh preset (termasuk kuartal dan tahun).
       - `getPreviousReportBounds()`: Penentuan otomatis durasi periode pembanding sebelumnya.
       - `calculateProfitLossSummary()`: Menghitung pendapatan, beban, laba, margin %, dan laju pertumbuhan (*growth %*).
       - `generatePeriodicFinancialRows()`: Menyusun deret bulanan kronologis pendapatan, beban, laba bersih, margin %, dan frekuensi faktur/beban.
       - `calculateCustomerRevenue()`: Peringkat kontribusi pendapatan per pelanggan beserta persentase kontribusi.
       - `calculateProductRevenue()`: Peringkat penjualan per item barang/jasa beserta kuantitas dan nilai.
       - `calculateCategoryExpenses()`: Agregasi beban per kategori pos pengeluaran.
       - `calculatePaymentMethodExpenses()`: Agregasi beban menurut metode transaksi (Transfer Bank, Tunai, QRIS, dll).
     - [`reports-csv-export.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_utils/reports-csv-export.ts):
       - Utilitas ekspor CSV berbasis Blob offline untuk Laba Rugi, Pendapatan, dan Pengeluaran dengan format ramah spreadsheet.
  3. **Rangkaian Pengujian Unit Otomatis (`features/reports/_utils/`):**
     - [`reports-calculations.test.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_utils/reports-calculations.test.ts):
       - 5 suite pengujian unit: Batas tanggal preset/kuartal, formula laba rugi & zero-division safety, baris periodik bulanan, peringkat pendapatan pelanggan, dan distribusi kategori pengeluaran.
  4. **Domain Service & Hook Reaktif (`features/reports/`):**
     - [`reports-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_services/reports-service.ts):
       - `ReportsDomainService`: Mengakses repository lokal IndexedDB (`invoiceRepository`, `paymentRepository`, `expenseRepository`, `customerRepository`, `expenseCategoryRepository`, dan tabel `invoiceItems`).
     - [`use-reports.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_hooks/use-reports.ts):
       - Hook React `'use client'` untuk mengelola preset rentang tanggal, tanggal kustom, tab aktif, pemuatan asinkron, dan pembaruan reaktif.
  5. **Komponen Visual Laporan (`features/reports/_components/`):**
     - [`ReportsFilterBar`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_components/reports-filter-bar.tsx): Bilah navigasi tab, pemilih preset tanggal `AppSelect`, input tanggal kustom, tombol penyegaran, tombol ekspor CSV, dan tombol cetak laporan.
     - [`ReportsProfitLossTab`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_components/reports-profit-loss-tab.tsx): 4 kartu KPI (Pendapatan, Beban, Laba Bersih, Margin %), grafik batang komparasi bulanan Recharts, dan tabel rincian periodik dengan baris total footer.
     - [`ReportsRevenueTab`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_components/reports-revenue-tab.tsx): 4 KPI pendapatan (Total Pendapatan, Total Ditagihkan, Tingkat Pelunasan, Rata-rata Faktur), grafik tren penerimaan kas, tabel pendapatan per pelanggan, dan tabel penjualan per produk.
     - [`ReportsExpenseTab`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_components/reports-expense-tab.tsx): 4 KPI pengeluaran (Total Beban, Transaksi, Rata-rata, Kategori Terbesar), grafik tren beban bulanan, tabel rincian per kategori, dan tabel metode pembayaran.
     - [`ReportsView`](file:///d:/DOT%20Indonesia/Project/ficco/features/reports/_components/reports-view.tsx): Wadah utama yang mengintegrasikan seluruh filter, tab view, ekspor CSV, dan cetak.
  6. **Ikon & Integrasi Sistem:**
     - [`shared/_components/icons.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx): Menambahkan ikon SVG `download` dan `printer`.
     - [`infrastructure/database/diagnostics.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/diagnostics.ts): Mendaftarkan `Reports Domain Unit Tests` sebagai langkah diagnostik ke-11.
     - [`app/(customer)/reports/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/(customer)/reports/page.tsx): Diperbarui untuk me-render `ReportsView` dengan metadata SEO lengkap.

- **Status & Hasil**:
  - Seluruh kriteria penerimaan Step 16 terpenuhi: Laporan akurat diturunkan dari data lokal IndexedDB, perubahan filter memperbarui visualisasi seketika, grafik dan tabel responsive, serta ekspor CSV offline berfungsi penuh.

---

---

## 19. Sesi Implementasi Step 17: Implement JSON Export

- **Tujuan Fitur**:
  - Membangun mesin pencadangan (*Backup Engine*) dan ekspor data JSON 100% offline berbasis IndexedDB (Dexie) tanpa membutuhkan komunikasi server (Zero-Knowledge Architecture).
  - Membaca seluruh 9 tabel bisnis dari IndexedDB: `companies`, `customers`, `products`, `invoices`, `invoiceItems`, `expenses`, `expenseCategories`, `payments`, dan `settings`.
  - Membungkus seluruh data ke dalam skema cadangan terversi (*versioned backup schema*) sesuai spesifikasi Bagian 13.2 dari blueprint:
    - `format`: `"invoice-app-backup"`
    - `schemaVersion`: `1`
    - `appVersion`: `"1.0.0"`
    - `exportedAt`: Timestamp ISO 8601
    - `data`: Objek berisi seluruh entitas data dari 9 tabel
    - `metadata`: Rangkuman total records, per-table counts, dan generator identifier.
  - Melakukan validasi ketat menggunakan **Zod Schema** untuk menjamin data yang diekspor 100% valid dan memenuhi kontrak data publik.
  - Menghasilkan nama berkas otomatis yang terstandarisasi: `invoice-app-backup-YYYY-MM-DD.json`.
  - Memicu pengunduhan berkas langsung di browser pengguna (*client-side blob download*).
  - Menyimpan jejak waktu cadangan terakhir (`last_backup_date`) ke dalam pengaturan lokal database.

- **Detail Implementasi**:
  1. **Tipe Data & Model (`features/backup/_types/`):**
     - [`backup.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_types/backup.types.ts):
       - Konstanta: `BACKUP_FORMAT`, `BACKUP_SCHEMA_VERSION`, `APP_VERSION`.
       - Definisi kontrak: `BackupData`, `BackupPayload`, `BackupMetadata`, `BackupTableSummary`, dan `BackupExportResult`.
  2. **Skema Validasi Zod (`features/backup/_schemas/`):**
     - [`backup.schemas.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_schemas/backup.schemas.ts):
       - Skema validasi Zod untuk seluruh entitas database (`companySchema`, `customerSchema`, `productSchema`, `invoiceSchema`, `invoiceItemSchema`, `expenseSchema`, `expenseCategorySchema`, `paymentSchema`, `appSettingSchema`).
       - `backupPayloadSchema`: Memvalidasi payload cadangan utuh secara ketat sebelum proses serialisasi dan ekspor.
  3. **Mesin Ekspor Murni & Unit Test (`features/backup/_utils/`):**
     - [`backup-export.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_utils/backup-export.ts):
       - `generateBackupFilename()`: Generator nama berkas sesuai pola `invoice-app-backup-YYYY-MM-DD.json`.
       - `constructBackupPayload()`: Menyusun payload terversi lengkap dengan metadata statistik.
       - `serializeBackupPayload()`: Serialisasi JSON berformat rapi (*pretty-printed*).
       - `calculateBackupTableSummaries()`: Pemetaan label bahasa Indonesia dan jumlah record per tabel.
       - `triggerJsonDownload()`: Memicu pengunduhan file JSON berbasis Blob secara offline di browser.
     - [`backup-export.test.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_utils/backup-export.test.ts):
       - 4 suite pengujian unit: Penamaan file, pembungkusan & serialisasi payload, validasi Zod ketat (serta penolakan format korup), dan akurasi ringkasan 9 tabel.
  4. **Domain Service & Hook Reaktif (`features/backup/`):**
     - [`backup-export-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_services/backup-export-service.ts):
       - `BackupExportService`: Membaca seluruh tabel Dexie, menyusun payload terversi, memvalidasi dengan Zod, mencatat timestamp cadangan terakhir ke `settingsRepository`, dan memicu unduhan.
     - [`use-backup-export.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_hooks/use-backup-export.ts):
       - Hook React `'use client'` untuk mengelola status ekspor (`isExporting`), pemuatan statistik real-time, penanganan error, dan hasil ekspor terakhir.
  5. **Komponen Visual & Integrasi Antarmuka:**
     - [`BackupExportCard`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_components/backup-export-card.tsx):
       - Kartu antarmuka modern yang menampilkan:
         * Status format cadangan & versi schema.
         * Timestamp cadangan terakhir.
         * Rincian jumlah data aktif pada ke-9 tabel bisnis IndexedDB.
         * Tombol aksi "Unduh Cadangan Lengkap (.json)" dengan indikator loading.
         * Banner notifikasi sukses lengkap dengan nama file, ukuran byte, dan total record.
         * Jaminan privasi dan keamanan offline lokal (Zero-Knowledge Architecture).
     - [`SettingsView`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_components/settings-view.tsx):
       - Menambahkan tab navigasi ketiga: **Cadangan Data (JSON Backup)** yang langsung merender `BackupExportCard`.
  6. **Integrasi Diagnostik Sistem:**
     - [`infrastructure/database/diagnostics.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/diagnostics.ts): Mendaftarkan `Backup Domain Unit Tests` sebagai langkah diagnostik ke-12.

- **Status & Hasil**:
  - Seluruh kriteria penerimaan Step 17 terpenuhi: Satu file JSON memuat seluruh data dari 9 tabel bisnis, ekspor bekerja 100% offline di sisi client tanpa request server, serta JSON yang dihasilkan valid dan terverifikasi Zod.

---

## 20. Pengerjaan Step 18 — Implement JSON import

* **Tujuan Fitur:**
  Membangun fungsionalitas pemulihan basis data dari berkas cadangan JSON (*JSON Import / Restore*) secara aman, terverifikasi, dan transaksional (*local-first atomic database replacement*) sesuai spesifikasi Step 18 pada [`docs/invoice-expense-prd-blueprint.md`](file:///d:/DOT%20Indonesia/Project/ficco/docs/invoice-expense-prd-blueprint.md).
  - Mengizinkan pengguna memilih berkas cadangan `.json` melalui area *file picker* interaktif atau *drag-and-drop*.
  - Melakukan *safe JSON parsing* dengan proteksi *error boundary* jika berkas bukan JSON valid atau terpotong/rusak.
  - Memverifikasi kesesuaian format (`format === 'invoice-app-backup'`) dan penjagaan versi skema (`schemaVersion <= BACKUP_SCHEMA_VERSION = 1`) untuk mencegah inkonsistensi ke depan.
  - Menjalankan validasi skema integritas mendalam menggunakan **Zod Schema** (`backupPayloadSchema`) pada seluruh 9 tabel bisnis (`companies`, `customers`, `products`, `invoices`, `invoiceItems`, `expenses`, `expenseCategories`, `payments`, `settings`).
  - Menampilkan pratinjau data (*import preview card*) yang mencakup nama berkas, ukuran, waktu ekspor, total baris data, dan rincian per entitas tabel sebelum data diterapkan.
  - Menyediakan modal konfirmasi eksplisit (*explicit confirmation modal*) dengan peringatan jelas bahwa seluruh data saat ini akan digantikan.
  - Menjalankan strategi penggantian basis data secara atomik menggunakan transaksi Dexie (`db.transaction('rw', db.tables)`). Jika proses gagal di tengah jalan, transaksi dibatalkan (*rollback*) secara otomatis sehingga database saat ini tetap 100% utuh tanpa kerusakan data.

* **Detail Implementasi:**
  1. **Tipe Data & Kontrak Import (`features/backup/_types/`):**
     - [`backup.types.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_types/backup.types.ts): Menambahkan tipe `BackupImportPreview`, `BackupValidationResult`, dan `BackupImportResult`.
  2. **Utilitas Penguraian & Validasi (`features/backup/_utils/`):**
     - [`backup-import.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_utils/backup-import.ts):
       - `parseAndValidateBackupJson()`: Menguji sintaks JSON, tipe objek, format identifier, batas versi skema, validasi Zod integritas seluruh tabel, serta mengompilasi statistik pratinjau data.
     - [`backup-import.test.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_utils/backup-import.test.ts):
       - Suite pengujian unit otomatis yang mencakup 7 skenario uji: valid JSON parse & preview, tabel kosong valid, penolakan sintaks korup/malformed JSON, penolakan tipe non-objek, penolakan format yang tidak cocok, penolakan skema masa depan (`schemaVersion > 1`), dan penolakan entitas tabel rusak melalui Zod.
  3. **Layanan Transaksional Basis Data (`features/backup/_services/`):**
     - [`backup-import-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_services/backup-import-service.ts):
       - `BackupImportService`: Membaca berkas via `File.text()` / `FileReader`, validasi komprehensif, dan eksekusi penggantian tabel secara atomik melalui transaksi Dexie (`clear()` pada seluruh 9 tabel, diikuti `bulkAdd()` entitas cadangan dan pencatatan `last_import_date`).
  4. **Custom Hook Reaktif (`features/backup/_hooks/`):**
     - [`use-backup-import.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_hooks/use-backup-import.ts):
       - Hook React `'use client'` untuk mengelola alur pemilihan file, status validasi (`isValidating`), status pemulihan (`isImporting`), modal konfirmasi (`isConfirmOpen`), serta hasil akhir import atau pesan error.
  5. **Komponen Visual & Integrasi Antarmuka:**
     - [`BackupImportCard`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_components/backup-import-card.tsx):
       - Dropzone interaktif dengan event drag-and-drop dan input berkas `.json`.
       - Kartu pratinjau berkas: Nama, ukuran, tanggal dibuat, badge total rekaman, dan rincian tabel.
       - Modal dialog konfirmasi risiko tinggi berlatar belakang *backdrop blur* dengan tombol pembatalan dan tombol eksekusi pemulihan.
       - Banner sukses dengan rekomendasi muat ulang (*reload*) halaman.
     - [`SettingsView`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_components/settings-view.tsx):
       - Merender `BackupImportCard` berdampingan dengan `BackupExportCard` pada tab **Cadangan Data (JSON Backup)**.
     - [`app/(customer)/backup/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/%28customer%29/backup/page.tsx):
       - Memperbarui rute navigasi `/backup` agar menampilkan modul lengkap Ekspor dan Impor cadangan secara terintegrasi.
     - [`shared/_components/icons.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/shared/_components/icons.tsx):
       - Menambahkan SVG icon `upload`.
     - [`features/backup/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/index.ts):
       - Mengekspor seluruh API publik impor cadangan.
  6. **Integrasi Diagnostik Sistem:**
     - [`infrastructure/database/diagnostics.ts`](file:///d:/DOT%20Indonesia/Project/ficco/infrastructure/database/diagnostics.ts): Mendaftarkan `Backup Import Domain Unit Tests` sebagai langkah pengujian diagnostik ke-13.

* **Status & Hasil:**
  - Seluruh kriteria penerimaan Step 18 terpenuhi:
    1. Berkas tidak valid / korup ditolak secara aman dan tidak pernah merusak database lokal saat ini.
    2. Berkas cadangan valid memulihkan seluruh 9 tabel data dengan tepat secara *offline-ready*.

---

---

## 21. Pengerjaan Step 19 — Implement backup UX

* **Tujuan Fitur:**
  Membangun pengalaman pengguna (*User Experience / UX*) manajemen data dan pencadangan yang intuitif, informatif, dan dapat dipahami secara mandiri tanpa memerlukan dokumentasi teknis (*self-explanatory backup workflow*) sesuai spesifikasi Step 19 pada [`docs/invoice-expense-prd-blueprint.md`](file:///d:/DOT%20Indonesia/Project/ficco/docs/invoice-expense-prd-blueprint.md).
  - Menyediakan navigasi terpadu: **Settings → Data Management** (dan rute langsung `/backup`).
  - Menampilkan 3 metrik inti secara real-time dan komprehensif:
    1. **Last Backup**: Waktu dan tanggal tepat pencadangan terakhir yang tersimpan di IndexedDB lokal.
    2. **Backup File Format**: Format berkas terverifikasi (`JSON • invoice-app-backup v1 • Ficco v1.0.0`).
    3. **Data Size**: Estimasi ukuran data byte aktual dari snapshot 9 tabel basis data lokal, lengkap dengan jumlah rekaman aktif.
  - Menyediakan aksi utama yang tegas dan langsung:
    * **Export All Data**: Tombol aksi primer untuk mengunduh berkas cadangan JSON seketika dengan status indikator.
    * **Import Data**: Tombol navigasi / dropzone untuk memvalidasi berkas dan memulihkan data dengan proteksi transaksi atomik.
  - Menyajikan panduan alur kerja visual 3 langkah (*Visual 3-Step Backup Workflow*) dan FAQ interaktif seputar arsitektur *Local-First* dan *Zero-Knowledge* sehingga pengguna awam memahami bahwa data tersimpan 100% di perangkat mereka dan aman saat migrasi perangkat.

* **Detail Implementasi:**
  1. **Komponen Terpadu Data Management UX (`features/backup/_components/`):**
     - [`DataManagementView`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_components/data-management-view.tsx):
       - Header dinamis bergaya gradien modern dengan rekam jejak navigasi `Settings → Data Management`.
       - Widget ringkasan metrik 3 kartu: *Last Backup*, *Backup File Format*, dan *Data Size* dengan tombol penyegaran instan.
       - Panduan alur kerja visual: *1. Simpan di Perangkat*, *2. Ekspor Berkala*, *3. Pulihkan Kapan Saja*.
       - Panel FAQ interaktif (keamanan offline, cara memindahkan data antar-laptop, dan proteksi transaksi atomik).
       - Pengontrol segmen tab: *Semua Modul*, *Ekspor Data (Export All Data)*, dan *Impor Data (Import Data)*.
  2. **Penyempurnaan Layanan & Hook Metrik Data Size (`features/backup/`):**
     - [`backup-export-service.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_services/backup-export-service.ts): Menambahkan komputasi ukuran byte data aktual (`dataSizeBytes`) pada fungsi `getDatabaseStats()`.
     - [`use-backup-export.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_hooks/use-backup-export.ts): Memperbarui interface `DatabaseBackupStats` agar menyertakan `dataSizeBytes` secara reaktif.
     - [`backup-export-card.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/_components/backup-export-card.tsx): Menambahkan metrik *Data Size* dan melabeli tombol aksi secara tegas sebagai **Export All Data (.json)**.
  3. **Integrasi Halaman Pengaturan & Halaman Backup:**
     - [`SettingsView`](file:///d:/DOT%20Indonesia/Project/ficco/features/settings/_components/settings-view.tsx):
       - Menyelaraskan tab ketiga menjadi **Data Management** (`Settings → Data Management`), mendukung parameter URL `?tab=data-management`, dan merender `DataManagementView`.
     - [`app/(customer)/backup/page.tsx`](file:///d:/DOT%20Indonesia/Project/ficco/app/%28customer%29/backup/page.tsx):
       - Merender langsung `DataManagementView` sebagai pusat kendali data pada rute navigasi `/backup`.
     - [`features/backup/index.ts`](file:///d:/DOT%20Indonesia/Project/ficco/features/backup/index.ts):
       - Mengekspor `DataManagementView` ke publik API modul cadangan.

* **Status & Hasil:**
  - Seluruh kriteria penerimaan Step 19 terpenuhi dengan sempurna:
    1. Alur kerja pencadangan dan pemulihan data sangat jelas dan dapat dipahami tanpa perlu membaca dokumentasi eksternal (*understandable without documentation*).
    2. Navigasi `Settings → Data Management` tersedia dengan tampilan metrik *Last Backup*, *Backup File Format*, dan *Data Size* yang akurat dan responsif.
    3. Aksi *Export All Data* dan *Import Data* terintegrasi secara mulus dengan proteksi transaksi atomik Dexie.

---

## 22. Pengerjaan Step 20 — Implement PWA/offline support

* **Tujuan Fitur:**
  Membangun dukungan Progressive Web App (PWA) dan kapabilitas offline shell penuh (*Offline Application Shell*) sesuai spesifikasi Step 20, Section 4.10, dan Section 25 pada [`docs/invoice-expense-prd-blueprint.md`](file:///D:/DOT%20Indonesia/Project/ficco/docs/invoice-expense-prd-blueprint.md).
  - Menyediakan berkas Web App Manifest standar dan kompatibel lintas-peramban (`manifest.json` dan `app/manifest.ts`).
  - Menyediakan ikon aplikasi beresolusi tinggi dengan branding Ficco (`192x192`, `512x512`, maskable icons, `apple-touch-icon`, dan SVG).
  - Mengimplementasikan Service Worker mandiri di `public/sw.js` dengan strategi caching canggih (*Network-First with Cache Fallback* untuk navigasi HTML, *Stale-While-Revalidate / Cache-First* untuk static assets Next.js, dan bypass aman untuk `/api/`).
  - Menyediakan antarmuka cadangan offline (*Offline Fallback Page*) di [`app/offline/page.tsx`](file:///D:/DOT%20Indonesia/Project/ficco/app/offline/page.tsx) dengan panduan arsitektur *Local-First* bahwa data bisnis tetap aman tersimpan di IndexedDB.
  - Membangun layer infrastruktur PWA di `infrastructure/pwa/` dengan Zustand store untuk status konektivitas, deteksi mode display standalone, dan *Install Experience* (`beforeinstallprompt`).
  - Menyediakan komponen UI PWA (`PwaRegistrar`, `PwaInstallButton`, `PwaSettingsView`) di Header, Shell, dan Tab Pengaturan (`Settings → Aplikasi & PWA`).

* **Detail Implementasi:**
  1. **Aset Manifest & Ikon PWA (`public/` & `app/`):**
     - [`public/manifest.json`](file:///D:/DOT%20Indonesia/Project/ficco/public/manifest.json) & [`app/manifest.ts`](file:///D:/DOT%20Indonesia/Project/ficco/app/manifest.ts): Konfigurasi Web App Manifest dengan nama lengkap, nama ringkas, start URL `/dashboard`, display mode `standalone`, tema `#2563eb`, warna latar `#ffffff`, orientasi `any`, shortcuts (Faktur Baru, Pengeluaran, Laporan), dan daftar ikon lengkap.
     - [`public/icons/icon.svg`](file:///D:/DOT%20Indonesia/Project/ficco/public/icons/icon.svg) & [`public/icons/icon-maskable.svg`](file:///D:/DOT%20Indonesia/Project/ficco/public/icons/icon-maskable.svg): Desain vektor SVG monogram dokumen finansial Ficco bergradien biru elegan.
     - Berkas PNG raster resolusi tinggi: `icon-192x192.png`, `icon-512x512.png`, `icon-maskable-192x192.png`, `icon-maskable-512x512.png`, `apple-touch-icon.png` (180x180), dan `icon-96x96.png`.
  2. **Service Worker Shell & Caching (`public/sw.js`):**
     - [`public/sw.js`](file:///D:/DOT%20Indonesia/Project/ficco/public/sw.js):
       * `install`: Pre-caching aset penting (`/offline`, `/manifest.json`, ikon-ikon) secara resilien dengan `self.skipWaiting()`.
       * `activate`: Pembersihan versi cache usang dan klaim kendali peramban instan melalui `self.clients.claim()`.
       * `fetch`: Strategi navigasi *Network-First* yang menyimpan halaman HTML yang berhasil dikunjungi ke `PAGES_CACHE` dan otomatis mengembalikan cache atau fallback `/offline` saat internet terputus. Aset statis menggunakan *Stale-While-Revalidate* dengan penanganan `ignoreSearch: true`. Endpoint `/api/` dilindungi sebagai network-only untuk menjaga keakuratan probe koneksi.
  3. **Halaman Cadangan Offline (`app/offline/`):**
     - [`app/offline/page.tsx`](file:///D:/DOT%20Indonesia/Project/ficco/app/offline/page.tsx): Halaman responsif modern dengan status badge *Koneksi Internet Terputus*, edukasi bahwa Ficco adalah aplikasi *Local-First* tanpa risiko kehilangan data, tombol navigasi langsung *Buka Dashboard Lokal* dan *Muat Ulang Halaman*.
  4. **Layer Infrastruktur PWA (`infrastructure/pwa/`):**
     - [`infrastructure/pwa/types.ts`](file:///D:/DOT%20Indonesia/Project/ficco/infrastructure/pwa/types.ts): Definisi interface `BeforeInstallPromptEvent` dan `PwaState`.
     - [`infrastructure/pwa/pwa-store.ts`](file:///D:/DOT%20Indonesia/Project/ficco/infrastructure/pwa/pwa-store.ts): Global Zustand store untuk melacak status `isSupported`, `isStandalone`, `isInstalled`, `canInstall`, `isSwRegistered`, `hasUpdate`, dan fungsi `triggerInstall()`.
     - [`infrastructure/pwa/service-worker-manager.ts`](file:///D:/DOT%20Indonesia/Project/ficco/infrastructure/pwa/service-worker-manager.ts): Registrasi Service Worker pada konteks aman (HTTPS/localhost), pendengar pembaruan versi baru (*update found*), dan utilitas `cacheCurrentPageAssets()`.
     - [`infrastructure/pwa/index.ts`](file:///D:/DOT%20Indonesia/Project/ficco/infrastructure/pwa/index.ts) & [`infrastructure/index.ts`](file:///D:/DOT%20Indonesia/Project/ficco/infrastructure/index.ts): Ekspor modul PWA ke public API layer infrastruktur.
  5. **Komponen Pengalaman PWA & Integrasi Shell (`shared/_components/pwa/` & `features/settings/`):**
     - [`PwaRegistrar`](file:///D:/DOT%20Indonesia/Project/ficco/shared/_components/pwa/pwa-registrar.tsx): Komponen client yang otomatis mendaftarkan Service Worker dan menampilkan floating banner notifikasi pembaruan sistem (*Update Available*) dengan tombol *Perbarui*.
     - [`PwaInstallButton`](file:///D:/DOT%20Indonesia/Project/ficco/shared/_components/pwa/pwa-install-button.tsx): Tombol instalasi PWA responsif yang mendukung varian `compact`, `button`, dan status badge `PWA Standalone`.
     - [`shared/_components/shell/header.tsx`](file:///D:/DOT%20Indonesia/Project/ficco/shared/_components/shell/header.tsx): Menyematkan `PwaInstallButton` tepat di samping indikator status Online/Offline.
     - [`app/layout.tsx`](file:///D:/DOT%20Indonesia/Project/ficco/app/layout.tsx): Menambahkan deklarasi `viewport` (theme-color `#2563eb`), metadata PWA lengkap (`manifest`, `appleWebApp`, `icons`), dan me-mount `<PwaRegistrar />`.
     - [`PwaSettingsView`](file:///D:/DOT%20Indonesia/Project/ficco/features/settings/_components/pwa-settings-view.tsx): Panel kendali PWA pada tab baru di halaman Pengaturan (`Settings → Aplikasi & PWA`) yang memuat:
       * Kartu status real-time (Mode Tampilan, Service Worker, Penyimpanan Bisnis IndexedDB, Status Pemasangan).
       * Panduan instalasi multi-perangkat (Desktop Chrome/Edge/Brave, iPhone/iPad Safari, dan Android Chrome).
       * Fitur pemeliharaan mandiri: Uji Halaman Offline, Bersihkan Cache Aplikasi, dan Muat Ulang Halaman.
     - [`SettingsView`](file:///D:/DOT%20Indonesia/Project/ficco/features/settings/_components/settings-view.tsx): Menambahkan tab ke-4 **Aplikasi & PWA** terintegrasi.
  6. **Automated E2E Testing Suite (`e2e/pwa-offline.spec.ts`):**
     - [`e2e/pwa-offline.spec.ts`](file:///D:/DOT%20Indonesia/Project/ficco/e2e/pwa-offline.spec.ts): Menguji validitas manifest JSON & WebManifest, ketersediaan ikon, rute `/sw.js`, halaman `/offline`, panel tab Pengaturan PWA, dan pengujian simulasi offline Chromium sesuai 6 Kriteria Penerimaan resmi Step 20.

* **Status & Hasil:**
  - 100% Kriteria Penerimaan Step 20 terpenuhi:
    1. Buka aplikasi saat online → Berhasil dimuat dan dicache secara otomatis.
    2. Muat aplikasi → Seluruh komponen dan shell beroperasi normal.
    3. Putus koneksi internet → Indikator header otomatis mendeteksi *Offline Mode*.
    4. Segarkan halaman (Refresh) saat offline → Aplikasi tetap terbuka dan shell navigasi berfungsi.
    5. Data lokal yang ada tetap tersedia → Seluruh data bisnis di IndexedDB (Dexie) tetap utuh dan dapat diakses.

---

## 23. Status Saat Ini & Langkah Berikutnya

| Tahap | Deskripsi | Status | Git Commit |
| :--- | :--- | :---: | :--- |
| **Directive** | Konfigurasi otomatisasi blueprint di `AGENTS.md` | Selesai | `4ed325c` |
| **Step 3** | Establish architecture (`features/`, `shared/`, `infrastructure/`) | Selesai | `c5eb3b3` |
| **Step 4** | Build application shell (Desktop Sidebar, Header, Mobile Nav, Routing) | Selesai | `82e98dc` |
| **Step 5** | Implement IndexedDB/Dexie foundation (9 Tables, Repositories, Playground) | Selesai | `d0d86f2` |
| **Step 6** | Implement company/business settings (Profile, Logo, Invoice Defaults) | Selesai | `3e23be8` |
| **Step 7** | Implement customer management (CRUD Pelanggan, Search, Detail Drawer, Zod Form) | Selesai | Terverifikasi lokal |
| **Refactor** | Global AntD Select (`AppSelect`) & Dark/Light Mode Theme Synchronization | Selesai | `00dfef8` |
| **Step 8** | Implement product/service management (Katalog Barang/Jasa, SKU, Harga, Satuan, Pajak) | Selesai | Terverifikasi lokal |
| **Step 9** | Implement invoice domain (Invoice & Item Schema, Calculation, Tax, Discount, Totals) | Selesai | `5e82695` |
| **Step 10** | Implement invoice creation (Dynamic items, catalog picker, live totals, draft save) | Selesai | `a8a8bd4` |
| **Step 11** | Implement invoice list/detail (Search, filter, status badge, detail drawer/page, edit/delete) | Selesai | `476ff4b` |
| **Step 12** | Implement payments (Record payment, partial/full payment, history, automatic status update) | Selesai | Terverifikasi lokal |
| **Step 13** | Implement invoice PDF (PDF preview modal, offline vector generator, download & print) | Selesai | `0d3dea0` |
| **Step 14** | Implement expense management (Categories, Expense CRUD, date, amount, payment method) | Selesai | `dfa0956` |
| **Step 15** | Implement dashboard (Revenue, Expenses, Profit, Outstanding & Overdue Invoices, Filters) | Selesai | `f143746` |
| **Step 16** | Implement reports (Revenue report, Expense report, Profit summary, Charts, Tables) | Selesai | `d8d965a` |
| **Step 17** | Implement JSON export (Full database backup, versioned schema, offline download) | Selesai | `cb5a4c3` |
| **Step 18** | Implement JSON import (File picker, Zod validation, preview, transactional restore) | Selesai | `27b0cbe` |
| **Step 19** | Implement backup UX (Data management, stats display, backup workflow) | Selesai | Terverifikasi lokal |
| **Step 20** | Implement PWA/offline support (Manifest, icons, service worker, caching, install) | **Selesai** | Terverifikasi lokal |
| **Step 21** | Implement license database (Supabase project/table, MVP schema) | **Langkah Selanjutnya** | Menunggu instruksi |







