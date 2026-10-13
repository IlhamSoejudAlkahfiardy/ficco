<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ficco Invoice & Expense Management — Core Blueprint Directive

## Authoritative Specification & Source of Truth
- The primary PRD and Implementation Blueprint for this project is:
  **`docs/invoice-expense-prd-blueprint.md`**
- **MANDATORY FOR ALL TASKS**: Whenever designing, creating, refactoring, or reviewing code, architecture, database schemas, state management, or UI features:
  1. Always treat `docs/invoice-expense-prd-blueprint.md` as the authoritative source of truth.
  2. Consult the relevant sections of this document before writing or modifying code.
  3. Never contradict or deviate from the rules, schemas, and flows specified in the blueprint unless explicitly instructed by the user.

## Core Architecture & Guardrails
1. **Local-First Business Data (Zero-Knowledge Server)**:
   - Business data (Invoices, Expenses, Customers, Products, Payments, Reports) lives EXCLUSIVELY on the client device in **IndexedDB (via Dexie)**.
   - The server is NEVER the source of truth for business data. Never send or store tenant financial/business data in Supabase or server databases.
2. **Server Role**:
   - Next.js Route Handlers (`app/api/`) and Supabase are strictly limited to:
     - License validation & device activation
     - Admin management
     - Future delivery services (e.g. WhatsApp backup)
3. **State Management & Data Flow**:
   - UI Components → Feature Hooks → Feature Services / Repositories → Dexie / IndexedDB Infrastructure.
   - Global client UI state is managed via **Zustand**.
   - Forms use **React Hook Form** + **Zod** validation.
   - UI components MUST NOT execute raw Dexie queries directly; always encapsulate data access in repositories/hooks.
4. **Folder Structure Conventions**:
   - Feature-specific code: `features/<feature>/` (e.g., `invoices`, `expenses`, `customers`, `products`, `reports`, `settings`, `backup`, `license`).
   - Cross-feature / shared utilities: `shared/components/`, `shared/hooks/`, `shared/utils/`, `shared/types/`.
   - Core DB and storage infrastructure: `infrastructure/database/`, `infrastructure/storage/`, `infrastructure/pwa/`.

## STRICT GIT COMMAND BAN (DILARANG MENJALANKAN GIT COMMAND APAPUN)
- **MUTLAK & TANPA PENGECUALIAN**: JANGAN PERNAH menjalankan perintah git apapun (`git add`, `git commit`, `git push`, `git status`, `git checkout`, `git reset`, `git stash`, `git restore`, `git diff`, dll.).
- Pengelolaan version control (staging, commit, branch, push, dll.) sepenuhnya dilakukan secara mandiri dan manual oleh USER.
- Agen dilarang mengeksekusi perintah terminal yang mengandung kata kunci `git`.

## Session Summary & Documentation Directive (Pencatatan Resume Fitur)
- **WAJIB SETELAH PENGERJAAN FITUR**:
  - Setiap kali selesai mengerjakan **fitur baru / kelanjutan implementasi fitur** (bukan perbaikan issue / bugfix / penanganan error kecil), agen **WAJIB** memperbarui dan mencatat resume pengerjaan ke:
    **`docs/session-summary.md`**
  - **Batasan & Kriteria Pemicu**:
    - **Wajib Ditulis (Fitur)**: Pembuatan atau penambahan fitur baru, implementasi step dari blueprint, pembuatan modul domain baru, flow bisnis baru, integrasi halaman/komponen fitur baru.
    - **Tidak Perlu Ditulis (Non-Fitur)**: Perbaikan bug/error, type error / linting fix, hotfix kecil, penyesuaian styling minor, atau investigasi issue.
  - **Format Resume yang Ditulis**:
    - Judul section pengerjaan fitur (melanjutkan penomoran yang sudah ada di dokumen).
    - **Tujuan Fitur**: Apa yang dibangun dan tujuannya.
    - **Detail Implementasi**: File-file yang dibuat/diubah dengan clickable link (`[`filename`](file:///path/to/file)`), struktur layer (`_components`, `_hooks`, `_services`, `_schemas`, `_types`, dll.).
    - **Status & Hasil**: Fungsionalitas yang berhasil diimplementasikan.

## Mandatory Manual Testing Scenarios Directive (Panduan Skenario Pengujian Manual)
- **WAJIB SETELAH PENGERJAAN FITUR / MODIFIKASI FUNGSIONAL**:
  - Setiap kali selesai mengerjakan **fitur baru atau modifikasi fungsional**, agen **WAJIB** menyertakan **Skenario Pengujian Manual (Manual Testing Scenarios)** berbasis teks di dalam respon.
  - **Karakteristik & Format Output**:
    - **Berbasis teks/markdown langsung**: Disajikan dalam format teks/code block checklist yang siap dibaca atau di-copas secara mandiri oleh USER untuk dieksekusi secara manual.
    - Skenario pengujian ditujukan untuk pengujian manual oleh USER langsung di antarmuka web/browser (bukan dieksekusi otomatis oleh skrip agen).
  - **Struktur Skenario yang Wajib Disajikan**:
    1. **Tujuan Pengujian (Testing Objective)**: Fungsionalitas atau alur bisnis yang diuji.
    2. **Prasyarat & Akses Halaman (Preconditions & Route)**: URL/halaman yang harus diakses (misal `/reports`, `/dashboard`), serta persiapan data awal yang diperlukan (apakah butuh data faktur/pengeluaran dummy).
    3. **Langkah-langkah Pengujian (Step-by-Step Test Actions)**: Rincian aksi konkret yang harus diklik, dipilih, diisi, atau dieksekusi oleh USER di browser.
    4. **Hasil yang Diharapkan (Expected Results)**: Indikator visual dan fungsional yang membuktikan fitur berjalan benar (angka metrik terhitung tepat, visual grafik Recharts tampil, respons filter tanggal instan, file CSV terunduh, dialog/modal muncul dengan benar, dsb.).
    5. **Pengujian Kasus Ekstrem / Edge Cases (Bila Relevan)**: Kondisi saat data kosong (*empty state*), input tidak lengkap, atau periode tanpa transaksi.

## Mandatory Commit Message Recommendation (Rekomendasi Pesan Commit)
- **WAJIB SETELAH SETIAP PENGERJAAN**:
  - Setiap kali selesai mengerjakan sesuatu (baik fitur baru, perbaikan bug/error, refactoring, perbaikan tipe/linting, penyesuaian styling, update dokumentasi, dsb.), agen **WAJIB** menyertakan rekomendasi perintah `git add` dan `git commit` di akhir respon.
  - Perintah harus disajikan dalam code block yang siap langsung di-copy-paste oleh USER:
    ```bash
    git add .
    git commit -m "<type>(<scope>): <deskripsi ringkas dan jelas>"
    ```
  - Format pesan commit harus mengikuti konvensi **Conventional Commits** (misal: `feat(...)`, `fix(...)`, `refactor(...)`, `docs(...)`, `chore(...)`, `style(...)`, `test(...)`).
  - Aturan ini tetap tunduk pada **STRICT GIT COMMAND BAN**: agen HANYA menyediakan teks/rekomendasi perintah untuk dijalankan mandiri oleh USER, dan **DILARANG** mengeksekusinya sendiri di terminal.




