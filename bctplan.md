# 📘 SYSTEM ARCHITECTURE & IMPLEMENTATION SPECIFICATION
## BEST COMPUTEL SERVICE & RMA WEB APPLICATION
> **Panduan Implementasi Teknis & Standar Eksekusi (Untuk Junior Developer / AI Coder)**  
> *Versi Dokumen: 1.0.0 | Target Platform: Modern Web App (Full-stack)*

---

## 📑 DAFTAR ISI
1. [Ringkasan Eksekutif & Tujuan Sistem](#1-ringkasan-eksekutif--tujuan-sistem)
2. [Desain UI/UX & Design System (Navy Blue & Orange)](#2-desain-uiux--design-system-navy-blue--orange)
3. [Skema Database & Relasi Tabel (PostgreSQL / SQLite)](#3-skema-database--relasi-tabel-postgresql--sqlite)
4. [Logika Bisnis & Dynamic Form Engine](#4-logika-bisnis--dynamic-form-engine)
5. [WhatsApp Automation Engine & Dual-Pipeline Reporting](#5-whatsapp-automation-engine--dual-pipeline-reporting)
6. [Sistem Surat Jalan & Cetak Dokumen](#6-sistem-surat-jalan--cetak-dokumen)
7. [Audit Trail & Activity Log](#7-audit-trail--activity-log)
8. [Struktur Folder & Panduan Koding Junior Dev](#8-struktur-folder--panduan-koding-junior-dev)
9. [Checklist Pengujian & Acceptance Criteria](#9-checklist-pengujian--acceptance-criteria)

---

## 1. Ringkasan Eksekutif & Tujuan Sistem
Sistem ini dibuat untuk menggantikan alur operasional sebelumnya yang menggunakan **Google AppSheet & Google Spreadsheet** menjadi **Web Application Fullstack modern** yang terpusat.

### Peran Pengguna (User Roles):
- **Teknisi (Wandi, Satryo, Derida, Anzar)**: Melayani customer, menginput data tiket servis/garansi, mengubah status pengerjaan, mencatat pergantian sparepart/SN baru.
  - *Aturan Tugas*: Servis reguler dikerjakan oleh Wandi & Satryo. Garansi & Alih Servis ditangani oleh Wandi.
- **Admin / Kasir**: Mengurus administrasi, mencetak tanda terima, mengelola pengiriman vendor, membuat Surat Jalan mingguan.
- **Sales**: Memantau stok barang internal (`STOCK BCT` dan `GHITP`) yang sedang digaransikan dan menerima rekap saat unit siap dijual.

---

## 2. Desain UI/UX & Design System (Navy Blue & Orange)
Desain mengadopsi dashboard modern SaaS (*seperti Flowdash layout*): Sidebar gelap di kiri, topbar dengan global search, dan konten utama berbasis widget card responsif.

### 2.1 Skema Warna (Color Palette)
Gunakan kode warna CSS / Tailwind berikut:
- **Primary Navy (Sidebar & Base Dark)**: `#0F172A` (Tailwind: `slate-900`)
- **Secondary Navy (Card & Sub-element Dark)**: `#1E293B` (Tailwind: `slate-800`)
- **Accent Orange (Action Buttons & Highlights)**: `#F97316` (Tailwind: `orange-500`)
- **Accent Orange Hover**: `#EA580C` (Tailwind: `orange-600`)
- **Background Content**: `#F8FAFC` (Tailwind: `slate-50`)
- **Card Background**: `#FFFFFF` (Tailwind: `white`)
- **Status Badges**:
  - Selesai / Siap Ambil: Emerald (`#10B981` / `bg-emerald-100 text-emerald-700`)
  - Proses / Aktif: Blue (`#3B82F6` / `bg-blue-100 text-blue-700`)
  - Pending / Warning: Amber (`#F59E0B` / `bg-amber-100 text-amber-700`)
  - Gagal / Batal: Rose (`#F43F5E` / `bg-rose-100 text-rose-700`)

### 2.2 Komponen Halaman Dashboard
1. **Top Metric Cards**:
   - `Total Service Aktif` (Jumlah unit berstatus 'PROSES SERVICE')
   - `Pending Service` (Jumlah unit berstatus 'PENDING SERVICE' - butuh konfirmasi)
   - `Barang Belum Diambil` (Jumlah unit berstatus 'SELESAI BELUM DIAMBIL')
   - `Garansi di Vendor (BDG/JKT)` (Jumlah unit di vendor)
   - `Stok Toko Ready (BCT/GHITP)` (Unit internal yang sudah selesai)
2. **Tabel Antrean Utama (Active Queue Table)**:
   - Filter Tab: `Semua`, `Service On Progress`, `Menunggu Vendor`, `Siap Ambil`, `Stok Internal`.
   - Kolom: `No RMA`, `Tanggal`, `Nama Customer`, `Jenis & Nama Barang`, `Keluhan`, `Teknisi`, `Status`, `Aksi`.

---

## 3. Skema Database & Relasi Tabel (PostgreSQL / SQLite)

### 3.1 Tabel `tickets` (Tabel Utama Service & RMA)
```sql
CREATE TABLE tickets (
    id VARCHAR(36) PRIMARY KEY, -- UUID v4
    nomor_layanan VARCHAR(30) UNIQUE NOT NULL, -- Format: BCTRS26-0312 (Auto-increment format tahun-nomor)
    tanggal_masuk TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    jenis_layanan VARCHAR(20) NOT NULL, -- 'SERVICE' | 'GARANSI'
    
    -- Info Pelanggan
    nama_customer VARCHAR(100) NOT NULL, -- Format otomatis simpan: "TN/NY. NAMA"
    no_hp VARCHAR(25) NOT NULL,
    
    -- Info Perangkat
    jenis_barang VARCHAR(30) NOT NULL, -- 'Laptop' | 'PC' | 'Printer' | 'Projector' | 'Aksesoris' | 'Sparepart' | 'Other'
    nama_barang VARCHAR(150) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    keluhan TEXT NOT NULL,
    kelengkapan TEXT[] NOT NULL DEFAULT '{}', -- Array string kelengkapan yang dititipkan
    estimasi_selesai DATE,
    
    -- Penugasan & Status
    teknisi VARCHAR(50) NOT NULL, -- 'Wandi' | 'Satryo' | 'Derida' | 'Anzar'
    status VARCHAR(50) NOT NULL DEFAULT 'PROSES SERVICE',
    -- Opsi Status:
    -- 1. 'PROSES SERVICE'
    -- 2. 'PENDING SERVICE'
    -- 3. 'SELESAI BELUM DIAMBIL'
    -- 4. 'SELESAI & DIAMBIL'
    -- 5. 'GAGAL SERVICE/GARANSI'
    -- 6. 'PROSES GARANSI'
    -- 7. 'ALIH SERVICE'
    
    catatan TEXT, -- Password laptop/PC, catatan teknis khusus
    
    -- Keuangan
    estimasi_biaya NUMERIC(12, 2) DEFAULT 0,
    dp NUMERIC(12, 2) DEFAULT 0,
    sisa NUMERIC(12, 2) GENERATED ALWAYS AS (estimasi_biaya - dp) STORED,
    biaya_akhir NUMERIC(12, 2) DEFAULT 0,
    
    -- Alur Vendor & Garansi
    no_surat_jalan VARCHAR(50), -- Relasi ke tabel surat_jalan (nullable)
    distributor_vendor VARCHAR(100), -- Contoh: 'PT. ASIA RAYA COM BDG'
    tgl_kirim_vendor DATE,
    tgl_datang_vendor DATE,
    hasil_service_garansi VARCHAR(30), -- 'Diservice' | 'Diganti baru'
    sn_baru VARCHAR(100), -- Wajib jika hasil 'Diganti baru'
    tgl_diambil_customer TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Tabel `surat_jalan` (Logistik Vendor)
```sql
CREATE TABLE surat_jalan (
    id VARCHAR(36) PRIMARY KEY,
    no_surat_jalan VARCHAR(50) UNIQUE NOT NULL, -- Format: SJ-BCTRS-260015
    distributor_vendor VARCHAR(100) NOT NULL,
    tgl_kirim DATE NOT NULL,
    ekspedisi VARCHAR(50), -- JNE / J&T / Travel / Ekspedisi Toko
    no_resi VARCHAR(100),
    catatan TEXT,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Tabel `master_vendors` & `master_keluhan`
```sql
CREATE TABLE master_vendors (
    id SERIAL PRIMARY KEY,
    nama_vendor VARCHAR(100) UNIQUE NOT NULL, -- Contoh: "PT. ASIA RAYA COM BDG", "AGRES ID JKT"
    wilayah VARCHAR(10) NOT NULL, -- 'BDG' | 'JKT' | 'OTHER'
    alamat_lengkap TEXT,
    kontak_wa VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE master_keluhan (
    id SERIAL PRIMARY KEY,
    teks_keluhan VARCHAR(100) UNIQUE NOT NULL -- Contoh: "Mati Total", "Lambat / Lemot", "No Display", "Keyboard Eror"
);
```

### 3.4 Tabel `audit_logs` (Histori Perubahan)
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(36) REFERENCES tickets(id) ON DELETE CASCADE,
    actor VARCHAR(50) NOT NULL, -- Nama Teknisi / Admin
    action VARCHAR(50) NOT NULL, -- 'STATUS_CHANGE', 'UPDATE_DATA', 'SURAT_JALAN_CREATED'
    keterangan TEXT NOT NULL, -- Contoh: "Wandi changed status PROSES SERVICE -> SELESAI"
    payload_sebelum JSONB,
    payload_sesudah JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Logika Bisnis & Dynamic Form Engine

Junior developer / AI builder wajib menerapkan aturan visibilitas dan validasi form di bawah ini:

### 4.1 Logika Penamaan Nomor Layanan & Input Pelanggan
1. **Nomor Layanan**:
   - Pola: `BCTRS[YY]-[0000]` (Contoh: tahun 2026 urutan ke-312 ➔ `BCTRS26-0312`).
   - Sistem men-generate otomatis dari ID terakhir + 1, namun field ini tetap **bisa diedit manual** jika perlu melompati nomor.
2. **Nama Customer**:
   - Di formulir, sediakan prefix otomatis `TN/NY. ` di depan input teks agar konsisten (Contoh: `TN/NY. WANDI ADITYA PUTRA`).
3. **Kalkulasi Sisa Biaya**:
   - `Sisa = Estimasi Biaya - DP` (Hitung secara real-time di UI saat user mengetik).

### 4.2 Logika Opsi Kelengkapan (Dynamic Checklist)
Pilihan kelengkapan berubah secara dinamis berdasarkan `Jenis Barang` yang dipilih:
- **Jika `Jenis Barang` = 'Laptop'**:
  - Tampilkan opsi: `Unit`, `Charger`, `Tas`, `Unit saja`, `RAM`, `SSD`, `BATERAI`.
- **Jika `Jenis Barang` = 'PC'**:
  - Tampilkan opsi: `Tutup case 1`, `Tutup case full`, `Dus`, `RAM`, `SSD`, `HDD`, `VGA`, `PSU`.
- **Jika `Jenis Barang` = Selain Laptop & PC (Printer, Projector, Aksesoris, Sparepart, Other)**:
  - Tampilkan opsi: `Fulldus`, `Unit Saja`, `Adaptor`, `Kabel`.

### 4.3 Matrix Kondisional Tampilan Field Form (UI State Matrix)

| Kondisi Form / Status Terpilih | Field Tambahan yang Wajib Muncul di Layar | Aturan Validasi |
|---|---|---|
| **Jenis Layanan = 'SERVICE'** *(Status normal)* | Form Standar Service | - |
| **Jenis Layanan = 'GARANSI'** | • `No Surat Jalan`<br>• `Distributor/Vendor`<br>• `Tgl Kirim ke Vendor`<br>• `Tgl Datang dari Vendor`<br>• `Hasil Service/Garansi` | Dropdown vendor mengambil dari `master_vendors`. |
| **Status = 'ALIH SERVICE'** *(Pada Jenis Service)* | • `No Surat Jalan`<br>• `Distributor/Vendor`<br>• `Tgl Kirim ke Vendor`<br>• `Tgl Datang dari Vendor`<br>• `Hasil Service/Garansi` | Sama dengan form garansi karena unit dialihkan ke pihak ketiga/vendor. |
| **Hasil Service/Garansi = 'Diganti baru'** | • `SN Baru` (Serial Number Baru) | Wajib diisi nomor seri baru dari vendor pengganti. |
| **Status = 'SELESAI & DIAMBIL'** ATAU **'GAGAL SERVICE/GARANSI'** | • `Biaya Akhir`<br>• `Tgl Diambil Customer` | `Biaya Akhir` default ke nilai `Estimasi Biaya`, `Tgl Diambil` default ke waktu saat ini. |

---

## 5. WhatsApp Automation Engine & Dual-Pipeline Reporting

Sistem WhatsApp Automation terbagi menjadi 3 jalur pesan:

```
[ DATABASE TIKET & LOGISTIK ]
             │
             ├──► 1. NOTIFIKASI TRANSAKSIONAL (Ke Nomor WA Pelanggan)
             │      ├─ Pesan Tanda Terima Masuk (Saat tiket dibuat)
             │      └─ Pesan Unit Selesai (Saat status SELESAI / SIAP AMBIL)
             │
             ├──► 2. PIPELINE LAPORAN OPERASIONAL (Grup WA Tim Operasional)
             │      └─ Dikirim rutin berkala (Jadwal Utama: Setiap Hari Kamis)
             │
             └──► 3. PIPELINE LAPORAN SALES (Nomor WA Sales: 0821-2008-1484)
                    └─ Filter Khusus: NAMA CUST = 'STOCK BCT' ATAU 'GHITP'
```

### 5.1 Template Pesan Transaksional Pelanggan

#### Template A: Tanda Terima Masuk (Tiket Baru)
```text
Hallo {nama_customer}
Kami telah menerima perangkat Anda untuk proses {jenis_layanan} dengan rincian berikut:
━━━━━━━━━━━━━━━
No RMA : {nomor_layanan}
Tanggal Masuk : {tanggal_masuk}
Jenis Barang : {jenis_barang}
Nama Barang : {nama_barang}
Serial Number : {serial_number}
Keluhan : {keluhan}
Kelengkapan : {kelengkapan_string}
Estimasi Selesai : {estimasi_selesai}
━━━━━━━━━━━━━━━
Mohon simpan pesan ini sebagai bukti serah terima perangkat.
Catatan:
• Pengambilan perangkat wajib menunjukkan No RMA.
• Perangkat yang tidak diambil lebih dari 30 hari setelah konfirmasi selesai bukan menjadi tanggung jawab kami atas segala risiko yang terjadi.
• Mohon melakukan pengecekan perangkat saat pengambilan.
Terima kasih
-{teknisi} Best Computel Service
```

#### Template B: Unit Selesai Siap Ambil
```text
Hallo {nama_customer}
Saya {teknisi} dari Best Computel Service, Ingin menginformasikan bahwa perangkat:
━━━━━━━━━━━━━━━
Nama Perangkat : {nama_barang}
Keluhan : {keluhan}
━━━━━━━━━━━━━━━
Telah *SELESAI* diperbaiki dan sudah dapat diambil.
Silakan datang sesuai jam operasional toko:
• Senin - Jumat : 09.00 - 17.00
• Sabtu : 09.00 - 15.00
• Minggu dan Tanggal Merah : Libur
Terima kasih.
```

---

### 5.2 Pipeline 1: Laporan WA Operasional Mingguan (`LAPORAN_WA`)
- **Tujuan**: Rekap alur logistik & servis vendor ke Grup WhatsApp Tim Operasional (Rutin setiap hari Kamis).
- **Cakupan Data**: Semua data (Customer Umum + Stok Toko).
- **Struktur Query**:
  1. `BARANG KE BANDUNG`: Unit yang dikirim hari ini ke vendor BDG.
  2. `BARANG DI VENDOR BDG`: Status `PROSES GARANSI` / `ALIH SERVICE` dengan vendor wilayah Bandung (`%BDG`).
  3. `BARANG DI VENDOR JKT`: Status `PROSES GARANSI` / `ALIH SERVICE` dengan vendor wilayah Jakarta (`%JKT`).
  4. `GARANSIAN BELUM DIPROSES`: Semua tiket yang belum diproses/dikirim.
- **Aturan Pembersihan String (Parser Rule)**:
  - Header nama vendor **hanya ditulis 1 kali** (grouping).
  - Hilangkan suffix wilayah `BDG` atau `JKT` pada judul header dengan Regex/string helper (Contoh: `PT. ASIA RAYA COM BDG` ➔ `*PT. ASIA RAYA COM*`).

---

### 5.3 Pipeline 2: Laporan WA Sales (`LAPORAN_WA_SALES`)
- **Tujuan**: Laporan kesiapan stok internal untuk Tim Penjualan.
- **Target Nomor**: `0821-2008-1484` (Format intern: `6282120081484`).
- **Filter Ketat (Mandatory Filter)**:
  ```sql
  WHERE UPPER(nama_customer) LIKE '%STOCK BCT%' 
     OR UPPER(nama_customer) LIKE '%GHITP%'
  ```
- **Struktur Output Pesan Sales**:
  1. `GARANSIAN SELESAI (STOK BCT / GHITP)`: Menampilkan perbandingan `SN Lama` dan `SN Baru` (jika ganti baru).
  2. `GARANSIAN DI VENDOR BDG (STOK BCT / GHITP)`
  3. `GARANSIAN DI VENDOR JKT (STOK BCT / GHITP)`
  4. `GARANSIAN BELUM DIPROSES (STOK BCT / GHITP)`

---

## 6. Sistem Surat Jalan & Cetak Dokumen

Sistem harus menyediakan template cetak HTML / Print CSS yang responsif dan rapi saat ditekan `Ctrl+P` (atau tombol cetak):

### 6.1 Fitur Surat Jalan Vendor (Logika Grouping)
- Apabila beberapa barang (misal: 3 unit laptop/printer) dikirim ke 1 distributor yang sama pada hari pengiriman (umumnya hari Sabtu), sistem akan menetapkan **No Surat Jalan yang sama** pada ketiga tiket tersebut (Contoh: `SJ-BCTRS-260015`).
- Saat mencetak Surat Jalan nomor `SJ-BCTRS-260015`:
  - Sistem menampilkan data vendor tujuan di bagian atas ("Kepada Yth. PT. ASIA RAYA COM").
  - Menampilkan tabel rincian seluruh barang yang termasuk dalam surat jalan tersebut (No RMA, Nama Barang, SN, Keluhan, Kelengkapan).
  - Menyediakan kolom tanda tangan: Pengirim Toko, Ekspedisi, dan Penerima Vendor.

### 6.2 Fitur Cetak Label Alamat Vendor
- Tombol cetak langsung label ukuran stiker/kertas untuk ditempel pada kardus/dus pengiriman ekspedisi (JNE/J&T), berisi Nama Toko Pengirim & Alamat Lengkap Vendor Penerima yang diambil dari tabel `master_vendors`.

---

## 7. Audit Trail & Activity Log

Setiap ada mutasi status atau pengeditan data tiket, backend wajib mengeksekusi insert ke tabel `audit_logs`:
```javascript
// Pseudocode trigger log
async function logActivity(ticketId, actor, action, textDescription, oldData, newData) {
  await db.audit_logs.create({
    data: {
      ticket_id: ticketId,
      actor: actor, // e.g., 'Wandi', 'Satryo'
      action: action, // e.g., 'STATUS_CHANGE'
      keterangan: textDescription, // e.g., "Wandi changed status PROSES SERVICE -> SELESAI & DIAMBIL"
      payload_sebelum: oldData,
      payload_sesudah: newData,
      created_at: new Date()
    }
  });
}
```

---

## 8. Struktur Folder & Panduan Koding Junior Dev

Rekomendasi arsitektur project berbasis Next.js App Router / React Node.js:

```text
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx                 # Dashboard Utama & Metrik Widget
│   │   │   ├── tickets/
│   │   │   │   ├── page.tsx             # List Antrean Tiket Service & RMA
│   │   │   │   ├── new/page.tsx         # Form Tambah Tiket Baru (Dynamic Form)
│   │   │   │   └── [id]/page.tsx        # Detail Tiket & Edit Status
│   │   │   ├── surat-jalan/
│   │   │   │   ├── page.tsx             # Manajemen Surat Jalan Vendor
│   │   │   │   └── print/[no_sj]/page.tsx # Template Cetak Surat Jalan (A4)
│   │   │   ├── whatsapp/
│   │   │   │   └── page.tsx             # Hub Broadcast WA (Operasional & Sales)
│   │   │   └── logs/
│   │   │       └── page.tsx             # Tampilan Audit Trail
│   │   └── api/
│   │       ├── tickets/route.ts         # REST API CRUD Tiket
│   │       ├── whatsapp/send/route.ts   # Gateway API WA Dispatcher
│   │       └── reports/route.ts         # Generator Laporan Teks WA
│   ├── components/
│   │   ├── ui/                          # Button, Modal, Badge, Input, Card
│   │   ├── forms/
│   │   │   ├── DynamicTicketForm.tsx    # Form Dinamis Laptop/PC/Garansi
│   │   │   └── VendorDispatchForm.tsx   # Form Pengiriman Vendor
│   │   └── prints/
│   │       ├── ReceiptPrint.tsx         # Struk / Tanda Terima Pelanggan
│   │       └── ShippingLabelPrint.tsx   # Cetak Label Alamat Paket
│   ├── lib/
│   │   ├── db.ts                        # Database Connection (Prisma / Drizzle)
│   │   ├── whatsapp-formatter.ts        # Helper pembuat string pesan & parsing BDG/JKT
│   │   └── constants.ts                 # List Teknisi, Jenis Barang, Status List
│   └── types/
│       └── index.ts                     # TypeScript Interfaces & Enums
```

---

## 9. Checklist Pengujian & Acceptance Criteria

Untuk AI / Junior Programmer, pastikan sistem lulus uji poin-poin berikut:

- [ ] **Penomoran Layanan**: Otomatis menghasilkan format `BCTRS26-XXXX` dan tidak error saat nomor dilompati/diedit manual.
- [ ] **Kelengkapan Dinamis**: Mengubah jenis barang ke `PC` memunculkan opsi kelengkapan PC (*Tutup Case, PSU, VGA*), dan memilih `Laptop` memunculkan opsi (*Charger, Tas, Baterai*).
- [ ] **Dynamic Field Garansi & Alih Servis**: Saat memilih `GARANSI` atau `ALIH SERVICE`, kolom `No Surat Jalan`, `Distributor/Vendor`, `Tgl Kirim`, `Tgl Datang`, dan `Hasil` otomatis muncul.
- [ ] **Ganti Baru SN**: Jika hasil garansi dipilih `Diganti baru`, input `SN Baru` wajib muncul dan berstatus mandatory.
- [ ] **Kalkulasi Biaya**: Sisa otomatis terhitung `Estimasi Biaya - DP`.
- [ ] **Laporan WhatsApp Sales**: Laporan Sales hanya berisi item dengan nama customer `STOCK BCT` atau `GHITP`.
- [ ] **Pembersihan Nama Vendor**: Judul vendor di laporan WA tidak menyertakan akhiran `BDG` atau `JKT`.
- [ ] **Audit Trail**: Setiap perubahan status tercatat nama teknisi pelakunya di tabel log.

---
*Dokumen ini merupakan acuan resmi pengembangan aplikasi Web Best Computel Service & RMA.*
