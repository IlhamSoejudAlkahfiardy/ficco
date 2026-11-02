---
name: "🧪 Temuan Hasil Pengujian (Test Finding / QA)"
about: "Catat temuan hasil pengujian manual/eksplorasi (edge case, inkonsistensi UX, atau performa)"
title: "[QA Finding][<Modul>]: <Ringkasan Temuan>"
labels: ["qa-finding", "triage"]
assignees: ""
---

### 📌 Ringkasan Temuan
<!-- Ringkasan singkat mengenai hasil pengamatan atau temuan saat menjalankan skenario pengujian. -->

---

### 🏷️ Kategori Temuan
- **Modul**: [ ] Invoices / [ ] Expenses / [ ] Customers / [ ] Products / [ ] Reports / [ ] Settings / [ ] Backup / [ ] License
- **Tipe Temuan**:
  - [ ] **Edge Case**: Input batas ekstrem, format tak terduga, atau kondisi jaringan/offline.
  - [ ] **Data Integrity**: Ketidaksinkronan data lokal IndexedDB (Dexie) atau kalkulasi angka.
  - [ ] **UI/UX Inconsistency**: Tampilan tidak responsif, navigasi membingungkan, feedback tombol kurang jelas.
  - [ ] **Performance**: Latensi render lambat, query Dexie berat pada volume data besar.
  - [ ] **Accessibility / Usability**: Kontras warna, navigasi keyboard, atau keterbacaan teks.

---

### 📋 Skenario Pengujian yang Dijalankan
- **Referensi Skenario**: [ ] Manual Testing Scenario dari sesi pengembangan / [ ] Skenario Eksploratori Baru
- **Data Uji yang Digunakan**: <!-- Misal: Faktur dengan 50 item, nilai desimal 0.001, karakter spesial pada nama pelanggan -->

---

### 🔄 Langkah Pengujian
1. Akses halaman `...`
2. Jalankan kondisi `...`
3. Amati respons aplikasi pada kondisi tersebut

---

### 💡 Dampak & Rekomendasi Solusi
- **Dampak terhadap Pengguna**: <!-- Apa pengaruh temuan ini terhadap pengalaman pengguna atau akurasi pencatatan keuangan? -->
- **Rekomendasi / Solusi yang Disarankan**: <!-- Saran perbaikan arsitektural, validasi input, atau penyesuaian UI -->

---

### 📸 Bukti Pendukung (Screenshot / Log)
<!-- Masukkan bukti visual atau log data jika tersedia -->
