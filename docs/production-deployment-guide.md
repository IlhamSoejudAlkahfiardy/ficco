# Panduan Deployment Produksi — Ficco (Step 33)

Dokumen ini merupakan panduan resmi dan komprehensif untuk melakukan *Production Deployment* aplikasi **Ficco — Invoice & Expense Management** ke platform **Vercel** dan integrasi basis data lisensi **Supabase**, sesuai mandat **Step 33** pada [`docs/invoice-expense-prd-blueprint.md`](file:///d:/DOT%20Indonesia/Project/ficco/docs/invoice-expense-prd-blueprint.md).

---

## 1. Ikhtisar Arsitektur Produksi (Zero-Knowledge Server)

Aplikasi Ficco beroperasi dengan prinsip dasar:
1. **Data Bisnis 100% di Sisi Klien (Local-First)**:
   - Semua data faktur (*invoices*), pengeluaran (*expenses*), pelanggan (*customers*), katalog produk/jasa (*products*), pembayaran (*payments*), dan laporan keuangan disimpan **hanya di peramban pengguna** menggunakan **IndexedDB (via Dexie)**.
   - **TIDAK ADA backend API untuk data bisnis**. Server Vercel maupun Supabase **sama sekali tidak pernah** menerima atau menyimpan data finansial pengguna (*zero-knowledge architecture*).
2. **Peran Server Next.js (Vercel Route Handlers)**:
   - Validasi lisensi komersial & aktivasi perangkat (`/api/license/activate`).
   - Pemantauan kesehatan koneksi lisensi (`/api/license/health`).
   - Autentikasi dan manajemen lisensi administratif bagi pemilik aplikasi (`/api/admin/*` dan `/admin-dashboard`).
3. **PWA Standalone & Dukungan Offline Penuh**:
   - Manifest aplikasi web standar (`/manifest.webmanifest`).
   - Service Worker (`/sw.js`) dengan strategi *Network-First (HTML)* dan *Stale-While-Revalidate (Assets)*.
   - Halaman cadangan offline mandiri (`/offline`).

---

## 2. Prasyarat Deployment

Sebelum melakukan deployment, pastikan Anda telah menyiapkan:
1. **Akun Vercel** ([https://vercel.com](https://vercel.com)) yang telah terhubung ke penyedia Git (GitHub, GitLab, atau Bitbucket).
2. **Akun Supabase** ([https://supabase.com](https://supabase.com)) untuk basis data lisensi komersial.
3. **Domain Kustom (Opsional)** yang memiliki akses konfigurasi DNS (misal: Cloudflare, Namecheap, Niagahoster, dll.).

---

## 3. Langkah 1: Konfigurasi Basis Data Lisensi di Supabase

1. **Buat Proyek Supabase Baru**:
   - Masuk ke dasbor Supabase -> Klik **"New Project"**.
   - Beri nama proyek (misal: `ficco-license-prod`).
   - Pilih wilayah (*Region*) terdekat dengan pengguna target Anda (misal: `Singapore (ap-southeast-1)`).
   - Tentukan *Database Password* yang kuat dan simpan dengan aman.
2. **Jalankan Skrip SQL Migrasi**:
   - Buka menu **SQL Editor** pada panel samping Supabase.
   - Salin dan jalankan seluruh isi berkas migrasi:
     [`supabase/migrations/20261016_create_licenses_table.sql`](file:///d:/DOT%20Indonesia/Project/ficco/supabase/migrations/20261016_create_licenses_table.sql)
   - Skrip ini akan membuat:
     - Tabel `public.licenses` dengan kolom `id`, `license_key`, `used`, `created_at`, `customer_name`, `customer_email`, `activated_at`, dan `device_fingerprint`.
     - *Unique index* dan constraint validasi format kunci lisensi.
     - Kebijakan **Row Level Security (RLS)** ketat yang memblokir akses publik `anon` secara total dan hanya mengizinkan `service_role` dari server Next.js.
3. **Ambil Kredensial API Supabase**:
   - Buka **Project Settings** -> **API**.
   - Salin **Project URL** (format: `https://xxxxxxxx.supabase.co`).
   - Salin **`service_role` secret key** (klik *Reveal* pada bagian *service_role*).
   - > [!CAUTION]
     > Jangan pernah membagikan atau menyematkan `service_role` key pada variabel berawalan `NEXT_PUBLIC_` atau kode client-side. Kunci ini hanya untuk server Route Handler!

---

## 4. Langkah 2: Konfigurasi Variabel Lingkungan di Vercel

Pada dasbor Vercel proyek Anda, buka tab **Settings** -> **Environment Variables**, lalu tambahkan variabel berikut untuk lingkungan **Production**:

| Nama Variabel | Contoh Nilai | Keterangan & Proteksi |
| :--- | :--- | :--- |
| `DEVELOPMENT` | `FALSE` | Wajib `FALSE` untuk menonaktifkan seluruh tombol dummy data generator dan dev aids di antarmuka produksi. |
| `NEXT_PUBLIC_DEVELOPMENT` | `FALSE` | Nilai sinkronisasi untuk bundle sisi klien. |
| `SUPABASE_URL` | `https://xxxxxxxx.supabase.co` | URL endpoint Supabase resmi Anda. |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Kunci `service_role` Supabase (server-only). |
| `ADMIN_USERNAME` | `admin` (atau username pilihan Anda) | Username untuk masuk ke panel `/admin-dashboard`. |
| `ADMIN_PASSWORD` | *(Password kuat min. 16 karakter)* | Password administratif produksi. Wajib diisi agar guard login mengizinkan akses di mode produksi. |
| `ADMIN_SESSION_SECRET` | *(String acak min. 32 karakter)* | Kunci rahasia untuk tanda tangan HMAC-SHA256 cookie sesi admin (`ficco_admin_session`). |

> [!NOTE]
> Format template lengkap dapat dilihat pada berkas [`.env.production.example`](file:///d:/DOT%20Indonesia/Project/ficco/.env.production.example).

---

## 5. Langkah 3: Konfigurasi Domain Kustom & HTTPS

1. **Menghubungkan Domain di Vercel**:
   - Di dasbor proyek Vercel, buka **Settings** -> **Domains**.
   - Masukkan nama domain produksi Anda (misal: `app.ficco.id` atau `ficco.id`).
2. **Pengaturan DNS di Penyedia Domain**:
   - Untuk subdomain (misal: `app.ficco.id`):
     - Tipe: `CNAME`
     - Name/Host: `app`
     - Value/Target: `cname.vercel-dns.com`
   - Untuk Apex domain (misal: `ficco.id`):
     - Tipe: `A`
     - Name/Host: `@`
     - Value: `76.76.21.21`
3. **Penyediaan Otomatis Sertifikat SSL (HTTPS)**:
   - Vercel akan memverifikasi DNS dan secara otomatis menerbitkan sertifikat SSL/TLS gratis (Let's Encrypt).
   - Aplikasi dikonfigurasi dengan header **HSTS** (*HTTP Strict Transport Security*) pada [`next.config.ts`](file:///d:/DOT%20Indonesia/Project/ficco/next.config.ts):
     ```text
     Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
     ```
   - Semua koneksi HTTP otomatis dialihkan (*308 Permanent Redirect*) ke HTTPS yang aman.

---

## 6. Langkah 4: Verifikasi PWA & Caching Produksi

1. **Web Manifest**:
   - Tersedia di `/manifest.webmanifest` dan `/manifest.json`.
   - Mendukung instalasi aplikasi di layar utama Android, iOS, Windows, dan macOS.
   - Dikonfigurasi dengan header `Cache-Control: public, max-age=0, must-revalidate` agar pembaruan metadata langsung terdeteksi.
2. **Service Worker**:
   - Berkas `/sw.js` dikonfigurasi dengan `Cache-Control: no-cache, no-store, must-revalidate`.
   - Mengisolasi caching aset statis dan navigasi halaman dengan cadangan offline di `/offline`.

---

## 7. Langkah 5: Checklist Pengujian Pasca Deployment

Setelah proses deployment Vercel selesai (*Status: Ready*), lakukan rangkaian verifikasi berikut:

- [ ] **1. Pemeriksaan Endpoint Health Check**:
  - Akses: `https://your-domain.com/api/license/health`
  - Respon harus menghasilkan HTTP 200 dengan status Supabase `connected: true`.
- [ ] **2. Akses Panel Admin**:
  - Buka rute `https://your-domain.com/admin-dashboard`.
  - Sistem harus mengalihkan ke halaman login admin.
  - Masuk dengan `ADMIN_USERNAME` dan `ADMIN_PASSWORD` produksi Anda.
- [ ] **3. Pembuatan Lisensi Baru**:
  - Buat 1 lisensi uji coba di panel admin.
  - Salin kunci lisensi yang berhasil dibuat.
- [ ] **4. Aktivasi Lisensi Pelanggan**:
  - Buka jendela *Incognito* / *Private Browser*, lalu akses `https://your-domain.com/license`.
  - Masukkan nama pelanggan dan kunci lisensi, lalu klik **"Aktivasi Lisensi Sekarang"**.
  - Aplikasi harus langsung terbuka dan mengarahkan ke Dasbor (`/dashboard`).
- [ ] **5. Uji Coba Mode Offline**:
  - Matikan koneksi internet (atau aktifkan mode pesawat).
  - Buat faktur dan catat pengeluaran baru.
  - Refresh halaman saat offline: Seluruh data harus tetap utuh dan aplikasi tetap berjalan mulus.
- [ ] **6. Verifikasi Zero Business-Data API**:
  - Buka DevTools Network tab saat menginput data bisnis.
  - Pastikan tidak ada panggilan API POST/GET/DELETE ke server untuk data pelanggan, invoice, atau expense.
