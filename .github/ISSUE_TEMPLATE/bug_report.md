---
name: "🐛 Laporan Bug (Bug Report)"
about: "Laporkan bug, error sistem, atau ketidaksesuaian perilaku aplikasi Ficco"
title: "[Bug][<Modul>]: <Ringkasan Masalah>"
labels: ["bug", "triage"]
assignees: ""
---

### 📌 Ringkasan Masalah
<!-- Deskripsi singkat, padat, dan jelas mengenai bug yang dialami. -->

---

### 🏷️ Modul & Klasifikasi
- **Modul Terdampak**: [ ] Invoices / [ ] Expenses / [ ] Customers / [ ] Products / [ ] Reports / [ ] Settings / [ ] Backup / [ ] License / [ ] Lainnya: ______
- **Tingkat Keparahan (Severity)**:
  - [ ] **Critical (P0)**: Aplikasi crash / data hilang / fitur utama lumpuh total.
  - [ ] **High (P1)**: Alur bisnis utama terganggu tanpa ada solusi sementara (workaround).
  - [ ] **Medium (P2)**: Fungsionalitas terganggu namun masih ada cara alternatif.
  - [ ] **Low (P3)**: Masalah kosmetik, visual/UI glitch, atau typo teks.

---

### 💻 Lingkungan Pengujian (Environment)
- **Perangkat**: [ ] Desktop / [ ] Laptop / [ ] Tablet / [ ] Mobile (PWA)
- **Sistem Operasi**: Windows / macOS / Linux / Android / iOS
- **Browser & Versi**: Chrome / Edge / Firefox / Safari (contoh: Chrome 130.0)
- **Mode Aplikasi**: [ ] Development (`localhost:3000`) / [ ] Production Build (`pnpm start` / Web)
- **Status Database**: [ ] Data Baru (Bersih) / [ ] Data Dummy / [ ] Data Import Backup

---

### 🔄 Langkah untuk Mereproduksi Masalah (Steps to Reproduce)
1. Buka halaman `...`
2. Klik tombol `...`
3. Masukkan data `...`
4. Lakukan aksi `...`
5. Lihat error yang terjadi

---

### 🎯 Perilaku yang Diharapkan (Expected Behavior)
<!-- Jelaskan apa yang seharusnya terjadi menurut alur bisnis atau spesifikasi PRD. -->

---

### ❌ Perilaku yang Terjadi (Actual Behavior)
<!-- Jelaskan apa yang sebenarnya terjadi saat pengujian dilakukan. -->

---

### 📸 Tangkapan Layar / Rekaman Video / Log Error
<!-- Sertakan screenshot, rekaman layar, atau salinan error console browser jika ada -->
```log
// Tempelkan error console browser / stack trace di sini jika ada
```

---

### 🔍 Analisis Tambahan / Dugaan Penyebab (Opsional)
<!-- Bila ada dugaan fungsi/komponen yang bermasalah (misal: state Dexie, kalkulasi diskon, schema validation Zod, dll.) -->
