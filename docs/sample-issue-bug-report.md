# Contoh Format Issue GitHub (Sample Bug Report)

> **Catatan Dokumen**:
> Dokumen ini merupakan contoh (*sample*) konkret pengisian template laporan bug untuk proyek **Ficco**. Format ini siap disalin (*copy-paste*) atau dijadikan rujukan standar pembuatan issue secara langsung ke GitHub repository via GitHub CLI (`gh`) maupun web interface.

---

```markdown
---
name: "🐛 Laporan Bug (Bug Report)"
about: "Laporkan bug, error sistem, atau ketidaksesuaian perilaku aplikasi Ficco"
title: "[Bug][Invoices]: Nilai Pajak PPN 11% Mengalami Pembulatan Keliru pada Faktur dengan Diskon Persentase Bertingkat"
labels: ["bug", "triage", "invoices", "calculation"]
assignees: "IlhamSoejudAlkahfiardy"
---

### 📌 Ringkasan Masalah
Pada saat membuat faktur baru dengan beberapa baris item yang masing-masing dikenakan diskon persentase (misal 15%) dan pajak PPN 11%, nilai total akhir (*Grand Total*) berselisih Rp 1,- hingga Rp 2,- dibandingkan perhitungan kalkulator akuntansi standar akibat pembulatan desimal yang dilakukan sebelum subtotal dijumlahkan.

---

### 🏷️ Modul & Klasifikasi
- **Modul Terdampak**: [x] Invoices / [ ] Expenses / [ ] Customers / [ ] Products / [ ] Reports / [ ] Settings / [ ] Backup / [ ] License
- **Tingkat Keparahan (Severity)**:
  - [ ] **Critical (P0)**: Aplikasi crash / data hilang / fitur utama lumpuh total.
  - [x] **High (P1)**: Alur bisnis utama terganggu (selisih pembukuan keuangan/pajak).
  - [ ] **Medium (P2)**: Fungsionalitas terganggu namun masih ada cara alternatif.
  - [ ] **Low (P3)**: Masalah kosmetik, visual/UI glitch, atau typo teks.

---

### 💻 Lingkungan Pengujian (Environment)
- **Perangkat**: Laptop
- **Sistem Operasi**: Windows 11 Home 64-bit
- **Browser & Versi**: Google Chrome Version 131.0.6778.86
- **Mode Aplikasi**: [x] Development (`localhost:3000`) / [ ] Production Build (`pnpm start`)
- **Status Database**: [x] Data Dummy / [ ] Data Baru (Bersih) / [ ] Data Import Backup

---

### 🔄 Langkah untuk Mereproduksi Masalah (Steps to Reproduce)
1. Akses menu navigasi **Faktur** lalu klik tombol **Buat Faktur Baru** (`/invoices/new`).
2. Pilih salah satu pelanggan dummy (misal: "PT Sinergi Abadi").
3. Tambahkan 2 baris item produk:
   - **Item 1**: "Jasa Konsultasi IT" — Kuantitas: `1`, Harga Satuan: `Rp 1.350.000`, Diskon: `15%`.
   - **Item 2**: "Lisensi Software Bulanan" — Kuantitas: `3`, Harga Satuan: `Rp 425.000`, Diskon: `10%`.
4. Aktifkan sakelar (toggle) **Pajak PPN 11%**.
5. Perhatikan bagian kalkulasi ringkasan (*Summary Card*) di sisi kanan bawah formulir.
6. Bandingkan angka **Total Pajak (PPN)** dan **Grand Total** dengan rumus matematis akuntansi.

---

### 🎯 Perilaku yang Diharapkan (Expected Behavior)
- Subtotal setelah diskon dihitung dengan presisi desimal penuh terlebih dahulu sebelum dikalikan PPN:
  - Item 1 Net: `1.350.000 * 0.85 = 1.147.500`
  - Item 2 Net: `(3 * 425.000) * 0.90 = 1.275.000 * 0.90 = 1.147.500`
  - Total DPP (Dasar Pengenaan Pajak): `Rp 2.295.000`
  - PPN 11%: `2.295.000 * 0.11 = Rp 252.450`
  - Grand Total: `Rp 2.547.450`
- Hasil kalkulasi harus bulat sempurna dan konsisten tanpa deviasi angka desimal mengambang (*floating point drift*).

---

### ❌ Perilaku yang Terjadi (Actual Behavior)
- Aplikasi melakukan pembulatan (`Math.round`) per baris item secara terpisah sebelum menjumlahkannya ke DPP, sehingga:
  - Total PPN tertera: `Rp 252.451`
  - Grand Total tertera: `Rp 2.547.451` (Selisih `+Rp 1,-`).
- Faktur yang tersimpan ke IndexedDB (Dexie) memuat angka yang selisih tersebut, sehingga laporan laba rugi bulanan mengalami ketidakseimbangan balance.

---

### 📸 Tangkapan Layar / Rekaman Video / Log Error
```json
// Data snapshot invoice summary dari inspect state Zustand / Dexie:
{
  "subtotal": 2295000,
  "taxRate": 11,
  "calculatedTax": 252451,
  "grandTotal": 2547451,
  "roundingMethod": "per_item_premature_round"
}
```

---

### 🔍 Analisis Tambahan / Dugaan Penyebab
- Berdasarkan penelusuran arsitektur kode pada modul `features/invoices`:
  - Fungsi utilitas kalkulasi pembulatan pajak di `features/invoices/utils/tax.ts` melakukan `Math.round(itemTax)` di level loop item, bukan mengakumulasikan seluruh `taxableAmount` terlebih dahulu baru menerapkan rumus pembulatan pajak akhir.
  - Perlu penyesuaian fungsi utilitas pembulatan menggunakan library penanganan presisi (misal `bignumber.js` / fungsi utilitas presisi mata uang terstandar) agar bebas dari kelemahan floating-point JavaScript.
```
