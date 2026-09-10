# 📋 MASTER TESTING CHECKLIST & QA MATRIX
## BEST COMPUTEL SERVICE & RMA WEB / DESKTOP APPLICATION (`mybctapps`)
> **Panduan & Standar Pengujian Kualitas Aplikasi (Web & Desktop)**  
> *Diadaptasi dari Standar QA Universal & Spesifikasi Bisnis SRS [bctplan.md](bctplan.md)*

---

## 📑 DAFTAR ISI
1. [Prinsip & Lingkungan Pengujian](#1-prinsip--lingkungan-pengujian)
2. [General Web & Desktop GUI / Usability Scenarios](#2-general-web--desktop-gui--usability-scenarios)
3. [Pengujian Modul Spesifik MyBCTApps](#3-pengujian-modul-spesifik-mybctapps)
   - [3.1 Dynamic Ticket Form (Service & Garansi)](#31-dynamic-ticket-form-service--garansi)
   - [3.2 Antrean & Dashboard (Active Queue & Filter Tab)](#32-antrean--dashboard-active-queue--filter-tab)
   - [3.3 WhatsApp Automation & Dual-Pipeline Reporting](#33-whatsapp-automation--dual-pipeline-reporting)
   - [3.4 Cetak Surat Jalan & Tanda Terima Pelanggan](#34-cetak-surat-jalan--tanda-terima-pelanggan)
   - [3.5 Excel Export & Data Grid](#35-excel-export--data-grid)
4. [Database, Integrity & Audit Trail Scenarios](#4-database-integrity--audit-trail-scenarios)
5. [Security & 5-Device Node-Lock Licensing Scenarios](#5-security--5-device-node-lock-licensing-scenarios)
6. [Performance, Stress & Responsiveness Scenarios](#6-performance-stress--responsiveness-scenarios)

---

## 1. Prinsip & Lingkungan Pengujian

### 1.1 Peran Pengguna (User Roles Matrix)
Setiap skenario wajib diuji menggunakan akun dengan peran:
- **Teknisi (Wandi, Satryo, Derida, Anzar)**: Akses input servis, update pengerjaan, ganti sparepart/SN baru.
- **Admin / Kasir**: Administrasi biaya/DP/sisa, surat jalan vendor, cetak nota, broadcast WA customer.
- **Sales**: Rekap stok internal (`STOCK BCT`, `GHITP`), unit siap jual.
- **Superadmin / Owner**: Master data teknisi, reset lisensi, audit log.

### 1.2 Lingkungan & Resolusi Target
- **Desktop Browsers**: Google Chrome, Microsoft Edge, Mozilla Firefox (resolusi 1366x768, 1920x1080).
- **Tablet / Mobile Phone**: Teknisi di meja servis (resolusi 768px - 1024px).
- **Desktop App (.exe)** (jika dibungkus Electron/Tauri): Uji pada Windows 10 & Windows 11.

---

## 2. General Web & Desktop GUI / Usability Scenarios

- [ ] **Validasi Field Wajib**: Semua input wajib ditandai tanda bintang merah (`*`) dan memunculkan pesan validasi jika dikosongkan.
- [ ] **Gaya Pesan Error & Sukses**:
  - Pesan error menggunakan styling konsisten (`text-rose-600 bg-rose-50 border-rose-200`).
  - Pesan sukses/konfirmasi menggunakan styling hijau (`text-emerald-600 bg-emerald-50`).
- [ ] **Dropdown Selection**: Opsi pertama berupa placeholder default ("-- Pilih Jenis Barang --", "-- Pilih Teknisi --").
- [ ] **Format Mata Uang**: Semua nominal biaya menggunakan format rupiah standar (`Rp 150.000`), right-aligned pada tabel/grid.
- [ ] **Konfirmasi Tindakan Berbahaya**: Aksi hapus data tiket atau pembatalan wajib memunculkan modal dialog konfirmasi (*"Apakah Anda yakin ingin membatalkan tiket ini?"*).
- [ ] **Pencegahan Double-Submit**: Tombol simpan/submit wajib disable dan menampilkan status loading (*spinner*) saat proses penyimpanan sedang berlangsung agar data tidak terkirim ganda.
- [ ] **Penanganan Spasi Input**: Spasi di awal dan akhir (*leading/trailing whitespace*) otomatis di-*trim* sebelum disimpan ke database.
- [ ] **Tab Order**: Navigasi menggunakan tombol `Tab` dan `Shift + Tab` berpindah secara teratur dari input atas ke bawah.

---

## 3. Pengujian Modul Spesifik MyBCTApps

### 3.1 Dynamic Ticket Form (Service & Garansi)
- [ ] **Auto-generate No Layanan**: Format otomatis keluar sesuai standar `BCTRS26-XXXX` tanpa error ketika nomor diedit/dilompati.
- [ ] **Format Nama Pelanggan**: Otomatis tersimpan dengan format prefix `TN.` / `NY.` (contoh: `TN. BUDI SANTOSO`).
- [ ] **Kelengkapan Dinamis**:
  - Memilih jenis barang `PC` -> memunculkan kelengkapan: *Tutup Case, Kabel Power, PSU, VGA Card, dll.*
  - Memilih jenis barang `Laptop` -> memunculkan kelengkapan: *Charger/Adaptor, Tas Laptop, Baterai, dll.*
- [ ] **Conditional Field Garansi & Alih Servis**:
  - Memilih jenis layanan `GARANSI` atau `ALIH SERVICE` -> memunculkan kolom vendor: *Distributor/Vendor, No Surat Jalan, Tanggal Kirim, Tanggal Datang, dan Hasil*.
  - Memilih `SERVICE` biasa -> kolom vendor tersembunyi (*hidden*).
- [ ] **Mandatory SN Baru**:
  - Jika hasil garansi dipilih `Diganti Baru` -> input `Serial Number Baru` otomatis muncul dan bersifat **Wajib Diisi (Mandatory)**.
- [ ] **Perhitungan Otomatis Biaya**:
  - `Sisa Biaya` otomatis terhitung: `Estimasi Biaya - DP`.
  - Jika nilai DP melebihi total biaya, munculkan peringatan validasi.

### 3.2 Antrean & Dashboard (Active Queue & Filter Tab)
- [ ] **Metrik Angka Real-time**: Widget kartu atas (`Total Service Aktif`, `Pending Service`, `Barang Belum Diambil`, `Garansi di Vendor`, `Stok Toko Ready`) menampilkan angka yang akurat sesuai status tiket.
- [ ] **Filter Tabs**:
  - Tab `Semua`: Menampilkan seluruh tiket aktif.
  - Tab `Service On Progress`: Hanya menampilkan tiket status pengerjaan aktif.
  - Tab `Menunggu Vendor`: Menampilkan tiket yang sedang dikirim ke vendor BDG/JKT.
  - Tab `Siap Ambil`: Menampilkan tiket dengan status `SELESAI BELUM DIAMBIL`.
  - Tab `Stok Internal`: Hanya menampilkan unit customer `STOCK BCT` atau `GHITP`.
- [ ] **Search Global**: Pencarian berdasarkan No Layanan, Nama Customer, No HP, atau Serial Number langsung memfilter baris tanpa reload halaman.

### 3.3 WhatsApp Automation & Dual-Pipeline Reporting
- [ ] **Validasi No WhatsApp**: Otomatis mengonversi nomor lokal (`0812...`) menjadi format internasional (`62812...`) dan menghapus karakter strip/spasi.
- [ ] **Template Pesan Notifikasi Customer**:
  - Variabel placeholder `{nama_customer}`, `{no_layanan}`, `{nama_barang}`, `{status}` terisi sempurna tanpa sisa tag mentah.
  - Link status tracking pelanggan dapat diklik dan membuka halaman tracking publik yang benar.
- [ ] **Laporan WhatsApp Sales (Internal Stock)**:
  - Hanya merangkum item yang customer-nya adalah `STOCK BCT` atau `GHITP`.
  - Barang milik pelanggan umum tidak boleh bocor ke pesan rekap Sales.
- [ ] **Pembersihan Nama Vendor (Sanitasi String)**:
  - Judul pengelompokan vendor otomatis membersihkan akhiran `BDG` atau `JKT` (contoh: `ASTRINDO BDG` -> `ASTRINDO`).

### 3.4 Cetak Surat Jalan & Tanda Terima Pelanggan
- [ ] **Struk Tanda Terima Pelanggan (Thermal 58/80mm / A5)**:
  - Memuat logo Best Computel, No Layanan Barcode/QR Code, Nama Customer, Keluhan, dan Daftar Kelengkapan.
  - Terdapat klausul syarat & ketentuan pengambilan servis.
- [ ] **Surat Jalan Vendor (Kertas A4 Landscape / Portrait)**:
  - Tabel memuat No Surat Jalan, Tanggal, Nama Distributor, Rincian Barang & SN, Keluhan, dan Kolom Tanda Tangan Ekspedisi/Penerima.
  - Saat `window.print()` dipanggil, elemen sidebar, topbar, dan tombol aksi otomatis disembunyikan via CSS `@media print`.

### 3.5 Excel Export & Data Grid
- [ ] **Format File & Penamaan**: File terunduh berekstensi `.xlsx` dengan nama sesuai tanggal/timestamp (contoh: `Laporan_RMA_BCT_2026-09-10.xlsx`).
- [ ] **Kelengkapan Kolom**: Kolom tanggal berformat `DD/MM/YYYY`, nominal rupiah berupa tipe angka murni (bisa dijumlahkan di Excel).
- [ ] **Integritas Data Terfilter**: Jika pengguna melakukan filter data di web (misal hanya vendor Astrindo), file Excel yang terunduh hanya memuat data hasil filter tersebut.

---

## 4. Database, Integrity & Audit Trail Scenarios

- [ ] **Primary Key & UUID**: Semua record memiliki UUID unik dan tidak ada duplikasi ID.
- [ ] **Foreign Key Cascade**: Penghapusan surat jalan atau penugasan tidak merusak integritas tabel `tickets`.
- [ ] **Audit Trail Log**:
  - Setiap perubahan status tiket wajib mencatat: `ticket_id`, `status_lama`, `status_baru`, `teknisi_pelaksana`, `timestamp`.
  - Log bersifat *append-only* (tidak bisa diedit atau dihapus oleh teknisi biasa).
- [ ] **Rollback Transaksi**: Jika pengiriman data tiket gagal di tengah jalan (misal input sparepart gagal), transaksi database dibatalkan utuh (*rollback*) tanpa data sampah (*orphan record*).

---

## 5. Security & 5-Device Node-Lock Licensing Scenarios

- [ ] **Aktivasi Serial Key**:
  - Memasukkan Serial Key valid pertama kali berhasil mengaktifkan komputer.
  - Hardware ID (Motherboard UUID / Machine ID) komputer tersimpan di tabel aktivasi server.
- [ ] **Batas Maksimal 5 Komputer**:
  - Komputer ke-1 sampai ke-5 berhasil teraktivasi.
  - Komputer ke-6 yang mencoba memakai Serial Key yang sama otomatis ditolak dengan pesan: *"Batas aktivasi 5 perangkat telah tercapai"*.
- [ ] **Reaktivasi Mesin yang Sama**: Komputer yang sudah teraktivasi tidak memotong kuota baru saat membuka ulang aplikasi.
- [ ] **Pencegahan SQL Injection & XSS**: Semua input form di-sanitasi, query database menggunakan parameterized queries (Prisma/Drizzle/ORM).
- [ ] **Proteksi API**: Endpoint broadcast WA dan manipulasi tiket diverifikasi dengan session/token yang valid.

---

## 6. Performance, Stress & Responsiveness Scenarios

- [ ] **Kecepatan Muat Tabel**: Tabel dengan 1.000+ data tiket tetap responsif (menggunakan pagination atau virtualized list).
- [ ] **Koneksi Jaringan Offline/Lambat**:
  - Aplikasi menampilkan indikator loading saat koneksi lambat.
  - Menampilkan pesan ramah jika koneksi server/database terputus (*"Gagal menghubungkan ke server, coba beberapa saat lagi"*).
- [ ] **Uji Stress Multi-User**: Teknisi Wandi dan Satryo mengupdate dua tiket berbeda secara bersamaan tanpa terjadi *race condition* atau data saling menimpa.
