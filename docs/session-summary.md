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

## 10. Status Saat Ini & Langkah Berikutnya

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
| **Step 9** | Implement invoice domain (Invoice & Item Schema, Calculation, Tax, Discount, Totals) | **Langkah Selanjutnya** | Menunggu instruksi |


