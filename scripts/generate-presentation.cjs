const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const pres = new PptxGenJS();

// Set 16:9 Widescreen (13.333 x 7.5 inches)
pres.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
pres.layout = 'WIDE';

// Brand Design Tokens (Navy & Industrial Orange)
const C_BG_DARK = '0F172A';      // Deep Navy / Slate 900
const C_CARD_DARK = '1E293B';    // Slate 800
const C_CARD_BORDER = '334155';  // Slate 700
const C_ACCENT = 'F97316';       // Best Computel Orange
const C_ACCENT_LIGHT = 'FB923C'; // Lighter Orange
const C_TEXT_WHITE = 'FFFFFF';   // Pure White
const C_TEXT_MUTED = '94A3B8';   // Slate 400
const C_TEXT_DIM = '64748B';     // Slate 500
const C_EMERALD = '10B981';      // Emerald Green
const C_BLUE = '3B82F6';         // Primary Blue
const C_AMBER = 'F59E0B';        // Amber Warning

const FONT_PRIMARY = 'Segoe UI';

// Helper: Add Standard Slide Header & Footer
function addHeaderFooter(slide, tag, title, subtitle, slideNum, totalSlides = 10) {
  slide.background = { color: C_BG_DARK };

  // Tag Badge
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 0.5,
    w: 2.6,
    h: 0.28,
    fill: { color: '1E293B' },
    line: { color: C_ACCENT, width: 1 },
    rectRadius: 0.04
  });
  slide.addText(tag.toUpperCase(), {
    x: 0.8,
    y: 0.52,
    w: 2.6,
    h: 0.24,
    fontSize: 9,
    fontFace: FONT_PRIMARY,
    color: C_ACCENT,
    bold: true,
    align: 'center',
    valign: 'middle',
    margin: 0
  });

  // Main Title
  slide.addText(title, {
    x: 0.8,
    y: 0.85,
    w: 11.7,
    h: 0.55,
    fontSize: 22,
    fontFace: FONT_PRIMARY,
    color: C_TEXT_WHITE,
    bold: true,
    margin: 0
  });

  // Subtitle
  slide.addText(subtitle, {
    x: 0.8,
    y: 1.4,
    w: 11.7,
    h: 0.35,
    fontSize: 12,
    fontFace: FONT_PRIMARY,
    color: C_TEXT_MUTED,
    margin: 0
  });

  // Top accent horizontal line
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 1.82,
    w: 11.733,
    h: 0.02,
    fill: { color: C_CARD_BORDER },
    line: { type: 'none' }
  });

  // Footer
  slide.addText('Best Computel Service & RMA Management System (mybctapps v1.0)', {
    x: 0.8,
    y: 7.0,
    w: 8.0,
    h: 0.25,
    fontSize: 9,
    fontFace: FONT_PRIMARY,
    color: C_TEXT_DIM,
    margin: 0
  });

  slide.addText(`${slideNum} / ${totalSlides}`, {
    x: 11.5,
    y: 7.0,
    w: 1.0,
    h: 0.25,
    fontSize: 9,
    fontFace: FONT_PRIMARY,
    color: C_TEXT_DIM,
    align: 'right',
    margin: 0
  });
}

// Helper: Card Container
function addCard(slide, x, y, w, h, title, accentColor = C_ACCENT) {
  slide.addShape(pres.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: C_CARD_DARK },
    line: { color: C_CARD_BORDER, width: 1 },
    rectRadius: 0.08
  });

  // Left accent bar
  slide.addShape(pres.ShapeType.rect, {
    x,
    y,
    w: 0.08,
    h,
    fill: { color: accentColor },
    line: { type: 'none' }
  });

  if (title) {
    slide.addText(title, {
      x: x + 0.25,
      y: y + 0.2,
      w: w - 0.45,
      h: 0.35,
      fontSize: 14,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_WHITE,
      bold: true,
      margin: 0
    });
  }
}

// ==========================================
// SLIDE 1: COVER
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C_BG_DARK };

  // Minimalist decorative background accents
  s.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.25,
    h: 7.5,
    fill: { color: C_ACCENT },
    line: { type: 'none' }
  });

  // Tag Badge
  s.addShape(pres.ShapeType.rect, {
    x: 1.2,
    y: 1.1,
    w: 3.4,
    h: 0.32,
    fill: { color: '1E293B' },
    line: { color: C_ACCENT, width: 1 },
    rectRadius: 0.04
  });
  s.addText('SISTEM ARSITEKTUR & OPERASIONAL', {
    x: 1.2,
    y: 1.12,
    w: 3.4,
    h: 0.28,
    fontSize: 9.5,
    fontFace: FONT_PRIMARY,
    color: C_ACCENT,
    bold: true,
    align: 'center',
    valign: 'middle',
    margin: 0
  });

  // Main Title
  s.addText('BEST COMPUTEL\nSERVICE & RMA', {
    x: 1.2,
    y: 1.65,
    w: 10.5,
    h: 1.4,
    fontSize: 40,
    fontFace: FONT_PRIMARY,
    color: C_TEXT_WHITE,
    bold: true,
    margin: 0
  });

  // Subtitle
  s.addText('Aplikasi Web Manajemen Servis Terpadu, Distribusi Garansi Vendor, dan Otomasi Logistik (mybctapps)', {
    x: 1.2,
    y: 3.15,
    w: 10.5,
    h: 0.45,
    fontSize: 15,
    fontFace: FONT_PRIMARY,
    color: C_ACCENT_LIGHT,
    bold: true,
    margin: 0
  });

  // Descriptive Lead Paragraph (Authentic, AI-less tone)
  s.addText('Migrasi menyeluruh dari operasional manual berbasis Google AppSheet & Google Sheets menuju platform web terpusat yang cepat, presisi di meja teknisi, serta akuntabel secara keuangan dan logistik pengiriman.', {
    x: 1.2,
    y: 3.7,
    w: 9.8,
    h: 0.8,
    fontSize: 12.5,
    fontFace: FONT_PRIMARY,
    color: C_TEXT_MUTED,
    margin: 0
  });

  // Bottom 4 Spec Cards
  const specs = [
    { title: 'KODE REPOSITORI', val: 'mybctapps v1.0', desc: 'Next.js 16 • React 19 • Tailwind v4' },
    { title: 'CAKUPAN OPERASI', val: 'Servis & Garansi', desc: 'Intake, Kasir, Vendor RMA, Sales' },
    { title: 'OTOMASI UTAMA', val: 'Dual WA & Surat Jalan', desc: 'Notifikasi Pelanggan & Laporan Kamis' },
    { title: 'PROTEKSI SISTEM', val: '5-Device Node-Lock', desc: 'Audit Trail & Akses Khusus Bengkel' }
  ];

  specs.forEach((item, idx) => {
    const xPos = 1.2 + (idx * 2.8);
    s.addShape(pres.ShapeType.rect, {
      x: xPos,
      y: 5.1,
      w: 2.55,
      h: 1.5,
      fill: { color: C_CARD_DARK },
      line: { color: C_CARD_BORDER, width: 1 },
      rectRadius: 0.06
    });

    s.addText(item.title, {
      x: xPos + 0.2,
      y: 5.28,
      w: 2.15,
      h: 0.22,
      fontSize: 8.5,
      fontFace: FONT_PRIMARY,
      color: C_ACCENT,
      bold: true,
      margin: 0
    });

    s.addText(item.val, {
      x: xPos + 0.2,
      y: 5.55,
      w: 2.15,
      h: 0.35,
      fontSize: 13.5,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_WHITE,
      bold: true,
      margin: 0
    });

    s.addText(item.desc, {
      x: xPos + 0.2,
      y: 6.0,
      w: 2.15,
      h: 0.4,
      fontSize: 9.5,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_MUTED,
      margin: 0
    });
  });
}

// ==========================================
// SLIDE 2: PROBLEM STATEMENT
// ==========================================
{
  const s = pres.addSlide();
  addHeaderFooter(s, '01 / Latar Belakang & Masalah', 'Tantangan Operasional di Sistem Lama (AppSheet & Sheets)', 'Kendala nyata di lapangan yang menghambat akuntabilitas dan kecepatan pelayanan servis harian', 2);

  const problems = [
    {
      title: 'Desinkronisasi & Batasan Spreadsheet',
      sub: 'Integritas Data Sering Terganggu',
      desc: 'Penggunaan Google Sheets multi-user sering memicu tabrakan input data, formula kalkulasi biaya tidak sengaja terhapus, dan loading sistem melambat secara signifikan saat data servis mencapai ribuan baris.',
      color: C_AMBER
    },
    {
      title: 'Titik Buta Pelacakan Garansi Vendor',
      sub: 'Distribusi Bandung & Jakarta Tidak Terdata',
      desc: 'Unit yang dikirim ke distributor pihak ketiga (PT. Asia Raya Com BDG, Agres ID JKT, dll) tidak memiliki nomor Surat Jalan terstandar. Ketika pelanggan menanyakan status barang, teknisi kesulitan melacak riwayat pengiriman.',
      color: 'F43F5E'
    },
    {
      title: 'Beban Komunikasi WhatsApp Manual',
      sub: '5-10 Menit Terbuang per Perangkat',
      desc: 'Teknisi harus menyalin-tempel teks tanda terima, nomor nota, keluhan, dan kelengkapan secara manual ke chat pelanggan. Rawan salah ketik rincian perangkat serta tidak ada format pesan yang seragam.',
      color: C_BLUE
    },
    {
      title: 'Kerancuan Barang Pelanggan vs Stok Toko',
      sub: 'Unit Inventaris Internal Sering Tertahan',
      desc: 'Unit milik toko (STOCK BCT dan GHITP) yang digaransikan bercampur dalam antrean servis umum. Tim sales terlambat mengetahui jika unit sudah selesai klaim ganti baru, sehingga barang siap jual tertahan lama di meja servis.',
      color: C_ACCENT
    }
  ];

  problems.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const xPos = 0.8 + (col * 6.0);
    const yPos = 2.1 + (row * 2.3);

    addCard(s, xPos, yPos, 5.733, 2.1, p.title, p.color);

    s.addText(p.sub, {
      x: xPos + 0.25,
      y: yPos + 0.58,
      w: 5.2,
      h: 0.25,
      fontSize: 10,
      fontFace: FONT_PRIMARY,
      color: p.color,
      bold: true,
      margin: 0
    });

    s.addText(p.desc, {
      x: xPos + 0.25,
      y: yPos + 0.9,
      w: 5.2,
      h: 1.0,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_MUTED,
      margin: 0
    });
  });
}

// ==========================================
// SLIDE 3: THE SOLUTION & ARCHITECTURE
// ==========================================
{
  const s = pres.addSlide();
  addHeaderFooter(s, '02 / Solusi Terpadu', 'Pilar Solusi mybctapps: Satu Ekosistem Terpusat', 'Menggabungkan dynamic intake, logistik vendor berresi, dan automasi laporan WhatsApp', 3);

  const pillars = [
    {
      num: 'PILAR 01',
      title: 'Dynamic Intake Engine',
      focus: 'Kecepatan & Presisi Meja Servis',
      color: C_ACCENT,
      items: [
        'Penomoran otomatis standar BCTRS26-XXXX dengan kemampuan manual override fleksibel.',
        'Standarisasi otomatis prefix nama pelanggan dengan format TN/NY.',
        'Checklist kelengkapan adaptif: opsi berubah otomatis berdasarkan jenis barang (Laptop, PC, Printer).',
        'Kalkulasi keuangan instan: Sisa Pembayaran terhitung otomatis dari Estimasi Biaya dikurangi DP.'
      ]
    },
    {
      num: 'PILAR 02',
      title: 'Vendor Logistics & RMA',
      focus: 'Transparansi Distribusi Distributor',
      color: C_BLUE,
      items: [
        'Form dinamis garansi otomatis muncul saat memilih jenis GARANSI atau ALIH SERVICE.',
        'Consolidated Surat Jalan: Multi-unit ke vendor yang sama digabungkan dalam 1 lembar Surat Jalan.',
        'Validasi wajib Serial Number Baru dari distributor jika hasil servis berstatus Diganti Baru.',
        'Layout cetak resmi A4 Surat Jalan dengan 3 kolom tanda tangan dan stiker label paket ekspedisi.'
      ]
    },
    {
      num: 'PILAR 03',
      title: 'WhatsApp Engine & Control',
      focus: 'Automasi Komunikasi & Akuntabilitas',
      color: C_EMERALD,
      items: [
        'Notifikasi tanda terima & unit selesai 1-klik langsung ke nomor WhatsApp pelanggan.',
        'Pipeline Laporan Operasional Mingguan (setiap Kamis) dengan grouping nama distributor yang bersih.',
        'Pipeline Laporan Sales terisolasi khusus barang internal (STOCK BCT / GHITP) siap pajang.',
        'Audit Trail mencatat nama teknisi pelaksana, timestamp, dan histori payload perubahan status.'
      ]
    }
  ];

  pillars.forEach((p, idx) => {
    const xPos = 0.8 + (idx * 4.0);
    const yPos = 2.1;
    const w = 3.733;
    const h = 4.6;

    addCard(s, xPos, yPos, w, h, p.title, p.color);

    s.addText(`${p.num} • ${p.focus}`, {
      x: xPos + 0.25,
      y: yPos + 0.58,
      w: w - 0.45,
      h: 0.25,
      fontSize: 9.5,
      fontFace: FONT_PRIMARY,
      color: p.color,
      bold: true,
      margin: 0
    });

    s.addShape(pres.ShapeType.rect, {
      x: xPos + 0.25,
      y: yPos + 0.9,
      w: w - 0.5,
      h: 0.015,
      fill: { color: C_CARD_BORDER },
      line: { type: 'none' }
    });

    p.items.forEach((bullet, bIdx) => {
      const bY = yPos + 1.05 + (bIdx * 0.85);

      s.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25,
        y: bY + 0.05,
        w: 0.06,
        h: 0.06,
        fill: { color: p.color },
        line: { type: 'none' }
      });

      s.addText(bullet, {
        x: xPos + 0.45,
        y: bY,
        w: w - 0.7,
        h: 0.75,
        fontSize: 10.5,
        fontFace: FONT_PRIMARY,
        color: C_TEXT_MUTED,
        margin: 0
      });
    });
  });
}

// ==========================================
// SLIDE 4: USER ROLES & WORKFLOW
// ==========================================
{
  const s = pres.addSlide();
  addHeaderFooter(s, '03 / Pembagian Wewenang', 'Struktur Peran Pengguna & Alur Kerja Lapangan', 'Pemisahan tanggung jawab yang jelas untuk memastikan operasional tertib dan transparan', 4);

  const roles = [
    {
      title: 'Teknisi Servis',
      sub: 'Wandi, Satryo, Derida, Anzar',
      color: C_ACCENT,
      tasks: [
        'Menerima unit masuk, memeriksa kondisi fisik, dan mencatat checklist kelengkapan barang.',
        'Melakukan diagnosis kerusakan, estimasi biaya perbaikan, dan pengujian fungsi unit.',
        'Mengupdate status pengerjaan (Proses Service, Pending, Selesai Belum Diambil, Gagal).',
        'Aturan Khusus: Servis reguler ditangani tim teknisi; Alur Garansi & Alih Servis dipusatkan ke Wandi.'
      ]
    },
    {
      title: 'Admin / Kasir',
      sub: 'Administrasi, Kasir & Pengiriman',
      color: C_BLUE,
      tasks: [
        'Mengelola pembayaran uang muka (DP) dan pencatatan pelunasan sisa biaya servis.',
        'Mencetak lembar tanda terima resmi untuk diserahkan ke pelanggan sebagai bukti pengambilan.',
        'Mengelola jadwal kirim vendor dan menerbitkan nomor Surat Jalan mingguan (hari Sabtu).',
        'Mencetak label alamat pengiriman paket kardus untuk ekspedisi (JNE, J&T, Travel).'
      ]
    },
    {
      title: 'Tim Sales',
      sub: 'Pengawasan Stok Toko (STOCK BCT / GHITP)',
      color: C_EMERALD,
      tasks: [
        'Memantau unit inventaris internal toko yang sedang dalam proses klaim garansi vendor.',
        'Menerima rekap berkala otomatis melalui saluran WhatsApp Sales khusus (0821-2008-1484).',
        'Mendapatkan nomor seri baru (SN Baru) pengganti dari distributor untuk segera diperbarui di stok.',
        'Mengalokasikan unit yang sudah selesai garansi kembali ke etalase penjualan toko.'
      ]
    },
    {
      title: 'Superadmin / Owner',
      sub: 'Pengawasan Sistem & Kebijakan',
      color: 'A855F7',
      tasks: [
        'Memantau metrik performa: jumlah servis aktif, unit pending konfirmasi, dan antrean vendor.',
        'Memeriksa tabel Audit Trail untuk meninjau riwayat perubahan status dan log teknisi pelaksana.',
        'Mengelola data master distributor vendor wilayah Bandung, Jakarta, dan wilayah lainnya.',
        'Mengatur dan mereset otorisasi lisensi perangkat (5-Device Node-Lock).'
      ]
    }
  ];

  roles.forEach((r, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const xPos = 0.8 + (col * 6.0);
    const yPos = 2.1 + (row * 2.3);

    addCard(s, xPos, yPos, 5.733, 2.1, r.title, r.color);

    s.addText(r.sub, {
      x: xPos + 0.25,
      y: yPos + 0.58,
      w: 5.2,
      h: 0.25,
      fontSize: 10,
      fontFace: FONT_PRIMARY,
      color: r.color,
      bold: true,
      margin: 0
    });

    r.tasks.forEach((t, tIdx) => {
      const tY = yPos + 0.85 + (tIdx * 0.28);
      s.addText(`•  ${t}`, {
        x: xPos + 0.25,
        y: tY,
        w: 5.2,
        h: 0.26,
        fontSize: 9.5,
        fontFace: FONT_PRIMARY,
        color: C_TEXT_MUTED,
        margin: 0
      });
    });
  });
}

// ==========================================
// SLIDE 5: DYNAMIC FORM INTAKE
// ==========================================
{
  const s = pres.addSlide();
  addHeaderFooter(s, '04 / Fitur Utama 1', 'Dynamic Form Engine: Intake Cerdas di Meja Teknisi', 'Formulir beradaptasi otomatis sesuai jenis perangkat dan alur layanan untuk mencegah salah input', 5);

  const features = [
    {
      title: 'Penomoran & Prefix Pelanggan',
      sub: 'Format Baku & Konsisten',
      color: C_ACCENT,
      items: [
        'Format Otomatis BCTRS[YY]-[0000]: Menggunakan pola tahunan (contoh: BCTRS26-0312).',
        'Dukungan Override Manual: Teknisi tetap dapat mengedit nomor layanan bila harus melompati nomor tanpa merusak data.',
        'Prefix Standar TN/NY.: Nama pelanggan otomatis tersimpan dengan format standar TN/NY. NAMA untuk kerapian database dan nota.'
      ]
    },
    {
      title: 'Checklist Kelengkapan Adaptif',
      sub: 'Checkbox Berubah Real-Time',
      color: C_BLUE,
      items: [
        'Jika Perangkat = Laptop: Checklist menampilkan Unit, Charger, Tas, Baterai, Unit Saja, RAM, SSD.',
        'Jika Perangkat = PC: Menampilkan Tutup Case 1, Tutup Case Full, Dus, RAM, SSD, HDD, VGA, PSU.',
        'Jika Selain Laptop/PC: Otomatis menampilkan Fulldus, Unit Saja, Adaptor, Kabel Power.',
        'Mencegah risiko klaim barang tertinggal atau hilang tanpa bukti serah terima yang jelas.'
      ]
    },
    {
      title: 'Kalkulasi Keuangan Otomatis',
      sub: 'Perhitungan Real-Time Tanpa Manual',
      color: C_EMERALD,
      items: [
        'Kalkulasi Sisa Otomatis: Sisa = Estimasi Biaya - DP dihitung langsung saat teknisi mengetik nominal.',
        'Trigger Biaya Akhir: Saat status diubah menjadi SELESAI & DIAMBIL, kolom Biaya Akhir dan Tanggal Diambil otomatis terisi default waktu saat ini.',
        'Format Rupiah Terstandarisasi: Semua nominal mata uang diformat rapi (contoh: Rp 150.000).'
      ]
    }
  ];

  features.forEach((f, idx) => {
    const xPos = 0.8 + (idx * 4.0);
    const yPos = 2.1;
    const w = 3.733;
    const h = 4.6;

    addCard(s, xPos, yPos, w, h, f.title, f.color);

    s.addText(f.sub, {
      x: xPos + 0.25,
      y: yPos + 0.58,
      w: w - 0.45,
      h: 0.25,
      fontSize: 9.5,
      fontFace: FONT_PRIMARY,
      color: f.color,
      bold: true,
      margin: 0
    });

    s.addShape(pres.ShapeType.rect, {
      x: xPos + 0.25,
      y: yPos + 0.9,
      w: w - 0.5,
      h: 0.015,
      fill: { color: C_CARD_BORDER },
      line: { type: 'none' }
    });

    f.items.forEach((item, iIdx) => {
      const iY = yPos + 1.1 + (iIdx * 1.05);

      s.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25,
        y: iY + 0.05,
        w: 0.06,
        h: 0.06,
        fill: { color: f.color },
        line: { type: 'none' }
      });

      s.addText(item, {
        x: xPos + 0.45,
        y: iY,
        w: w - 0.7,
        h: 0.95,
        fontSize: 10.5,
        fontFace: FONT_PRIMARY,
        color: C_TEXT_MUTED,
        margin: 0
      });
    });
  });
}

// ==========================================
// SLIDE 6: VENDOR LOGISTICS & RMA
// ==========================================
{
  const s = pres.addSlide();
  addHeaderFooter(s, '05 / Fitur Utama 2', 'Logistik Garansi Vendor: Distribusi Bandung & Jakarta', 'Pengendalian alur pengiriman distributor dengan surat jalan terpadu dan verifikasi nomor seri', 6);

  // Left Column: Alur & Grouping
  addCard(s, 0.8, 2.1, 5.733, 4.6, 'Alur Pengalihan & Grouping Surat Jalan', C_ACCENT);

  s.addText('Mekanisme Alur Garansi & Alih Servis Pihak Ketiga', {
    x: 1.05,
    y: 2.68,
    w: 5.2,
    h: 0.25,
    fontSize: 10,
    fontFace: FONT_PRIMARY,
    color: C_ACCENT,
    bold: true,
    margin: 0
  });

  const leftPoints = [
    {
      title: 'Pemicu Kondisional Form Garansi',
      desc: 'Saat jenis layanan GARANSI atau status ALIH SERVICE dipilih, sistem membuka field logistik khusus: Distributor Vendor, Tanggal Kirim, Tanggal Datang, dan Hasil Servis/Garansi.'
    },
    {
      title: 'Consolidated Surat Jalan (Grouping)',
      desc: 'Apabila beberapa unit dikirim ke distributor yang sama pada hari pengiriman (umumnya hari Sabtu), sistem menggabungkan unit-unit tersebut ke dalam satu Nomor Surat Jalan tunggal (misal: SJ-BCTRS-260015).'
    },
    {
      title: 'Integrasi Data Master Vendor',
      desc: 'Dropdown vendor terhubung langsung ke tabel master_vendors, mencakup nama distributor resmi, wilayah operasional (Bandung / Jakarta / Other), alamat gudang, dan kontak WhatsApp PIC distributor.'
    }
  ];

  leftPoints.forEach((p, idx) => {
    const pY = 3.05 + (idx * 1.15);
    s.addText(`${idx + 1}.  ${p.title}`, {
      x: 1.05,
      y: pY,
      w: 5.2,
      h: 0.28,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_WHITE,
      bold: true,
      margin: 0
    });
    s.addText(p.desc, {
      x: 1.35,
      y: pY + 0.3,
      w: 4.9,
      h: 0.75,
      fontSize: 10,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_MUTED,
      margin: 0
    });
  });

  // Right Column: Validasi & Dokumen
  addCard(s, 6.8, 2.1, 5.733, 4.6, 'Validasi Pergantian Unit & Cetak Dokumen', C_BLUE);

  s.addText('Standar Dokumen Fisik & Pelacakan Serial Number Baru', {
    x: 7.05,
    y: 2.68,
    w: 5.2,
    h: 0.25,
    fontSize: 10,
    fontFace: FONT_PRIMARY,
    color: C_BLUE,
    bold: true,
    margin: 0
  });

  const rightPoints = [
    {
      title: 'Validasi Wajib Serial Number Baru',
      desc: 'Jika hasil garansi vendor adalah "Diganti baru", sistem memberlakukan validasi ketat di mana teknisi wajib menginput Serial Number Baru dari unit pengganti sebelum tiket dapat ditutup.'
    },
    {
      title: 'Template Cetak Surat Jalan A4 Resmi',
      desc: 'Layout cetak A4 siap print yang rapi dengan kop resmi toko, rincian seluruh perangkat yang termasuk dalam nomor SJ terkait, serta 3 kolom tanda tangan legal: Pengirim Toko, Ekspedisi, dan Penerima Vendor.'
    },
    {
      title: 'Cetak Stiker Label Alamat Pengiriman',
      desc: 'Fitur cetak label stiker ukuran dus paket untuk ditempel pada kardus pengiriman ekspedisi (JNE/J&T), memuat data pengirim Best Computel dan alamat lengkap vendor tujuan secara otomatis.'
    }
  ];

  rightPoints.forEach((p, idx) => {
    const pY = 3.05 + (idx * 1.15);
    s.addText(`${idx + 1}.  ${p.title}`, {
      x: 7.05,
      y: pY,
      w: 5.2,
      h: 0.28,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_WHITE,
      bold: true,
      margin: 0
    });
    s.addText(p.desc, {
      x: 7.35,
      y: pY + 0.3,
      w: 4.9,
      h: 0.75,
      fontSize: 10,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_MUTED,
      margin: 0
    });
  });
}

// ==========================================
// SLIDE 7: WHATSAPP AUTOMATION ENGINE
// ==========================================
{
  const s = pres.addSlide();
  addHeaderFooter(s, '06 / Fitur Utama 3', 'Dual-Pipeline WhatsApp: Automasi Komunikasi 3 Jalur', 'Mengeliminasi pekerjaan manual salin-tempel pesan dan memastikan akurasi data ke setiap target', 7);

  const channels = [
    {
      tag: 'JALUR 1',
      title: 'Notifikasi Pelanggan',
      sub: 'Pesan Transaksional Pelanggan',
      color: C_ACCENT,
      desc: 'Tanda terima instan saat unit masuk & pengumuman unit selesai siap diambil.',
      bullets: [
        'Template A (Tanda Terima Masuk): Mengirimkan No RMA, nama barang, SN, keluhan, kelengkapan, dan estimasi selesai sebagai bukti digital serah terima.',
        'Template B (Unit Selesai): Memberitahukan bahwa unit selesai diperbaiki lengkap dengan rincian jam operasional toko untuk pengambilan.',
        'Tombol 1-klik membuka WhatsApp Web / Desktop langsung dengan pesan terformat rapi.'
      ]
    },
    {
      tag: 'JALUR 2',
      title: 'Laporan Operasional',
      sub: 'Rekap Mingguan Tim Teknisi',
      color: C_BLUE,
      desc: 'Broadcast ke Grup WhatsApp Tim Operasional setiap hari Kamis.',
      bullets: [
        'Kategori 1: Unit yang dikirim hari ini ke distributor Bandung.',
        'Kategori 2 & 3: Rekap unit yang sedang diproses di vendor Bandung dan Jakarta.',
        'Kategori 4: Antrean garansi yang belum diproses/dikirim.',
        'Aturan Parser: Header nama vendor digrouping dan suffix wilayah BDG/JKT dibersihkan otomatis (contoh: PT. ASIA RAYA COM BDG -> *PT. ASIA RAYA COM*).'
      ]
    },
    {
      tag: 'JALUR 3',
      title: 'Laporan Tim Sales',
      sub: 'Filter Khusus Unit Toko',
      color: C_EMERALD,
      desc: 'Dikirim khusus ke nomor WhatsApp Sales (0821-2008-1484).',
      bullets: [
        'Filter Mandatori: Khusus data dengan nama customer STOCK BCT atau GHITP.',
        'Informasi Pergantian Unit: Menampilkan unit garansi selesai dengan komparasi SN Lama dan SN Baru pengganti.',
        'Monitoring Barang Toko: Sales langsung mengetahui unit inventaris mana saja yang masih tertahan di vendor Bandung/Jakarta.',
        'Mempercepat rotasi produk siap display dan penjualan kembali.'
      ]
    }
  ];

  channels.forEach((ch, idx) => {
    const xPos = 0.8 + (idx * 4.0);
    const yPos = 2.1;
    const w = 3.733;
    const h = 4.6;

    addCard(s, xPos, yPos, w, h, ch.title, ch.color);

    s.addText(`${ch.tag} • ${ch.sub}`, {
      x: xPos + 0.25,
      y: yPos + 0.58,
      w: w - 0.45,
      h: 0.25,
      fontSize: 9.5,
      fontFace: FONT_PRIMARY,
      color: ch.color,
      bold: true,
      margin: 0
    });

    s.addText(ch.desc, {
      x: xPos + 0.25,
      y: yPos + 0.88,
      w: w - 0.5,
      h: 0.45,
      fontSize: 10,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_WHITE,
      margin: 0
    });

    s.addShape(pres.ShapeType.rect, {
      x: xPos + 0.25,
      y: yPos + 1.4,
      w: w - 0.5,
      h: 0.015,
      fill: { color: C_CARD_BORDER },
      line: { type: 'none' }
    });

    ch.bullets.forEach((bullet, bIdx) => {
      const bY = yPos + 1.55 + (bIdx * 0.95);

      s.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25,
        y: bY + 0.05,
        w: 0.06,
        h: 0.06,
        fill: { color: ch.color },
        line: { type: 'none' }
      });

      s.addText(bullet, {
        x: xPos + 0.45,
        y: bY,
        w: w - 0.7,
        h: 0.85,
        fontSize: 10,
        fontFace: FONT_PRIMARY,
        color: C_TEXT_MUTED,
        margin: 0
      });
    });
  });
}

// ==========================================
// SLIDE 8: TECH STACK & ARCHITECTURE
// ==========================================
{
  const s = pres.addSlide();
  addHeaderFooter(s, '07 / Landasan Teknologi', 'Arsitektur Teknis: Ringan, Cepat, dan Skalabel', 'Kombinasi teknologi modern untuk performa tinggi di lingkungan kerja bengkel servis', 8);

  const stack = [
    {
      title: 'Frontend & App Framework',
      sub: 'Next.js 16 (App Router) & React 19',
      color: C_ACCENT,
      desc: 'Mendukung server-rendered page untuk inisialisasi cepat dan transisi halaman tanpa reload. TypeScript menjamin keketatan tipe data di seluruh komponen form, routing, dan validasi schema.'
    },
    {
      title: 'Design System & Cetak Dokumen',
      sub: 'Tailwind CSS v4 & Print Media Rules',
      color: C_BLUE,
      desc: 'Palet warna industri modern Slate & Orange yang nyaman dipandang. Dilengkapi CSS media print khusus untuk memastikan cetakan tanda terima 80mm dan Surat Jalan A4 presisi tanpa elemen navigasi browser.'
    },
    {
      title: 'Database & Integritas Relasi',
      sub: 'PostgreSQL / SQLite & Relational Schema',
      color: C_EMERALD,
      desc: 'Skema relasional kokoh dengan tabel utama: tickets, surat_jalan, master_vendors, master_keluhan, dan audit_logs. Didukung cascading relation dan index untuk pencarian instan nomor RMA dan serial number.'
    },
    {
      title: 'Integrasi Utilitas & Ekspor',
      sub: 'SheetJS / XLSX & WA URL Formatter',
      color: 'EAB308',
      desc: 'Fitur ekspor data antrean ke format Excel tabular untuk pembukuan akuntansi toko. Generator pesan WhatsApp mandiri yang menyusun teks terstruktur dengan pemformatan tebal dan tata letak rapi.'
    }
  ];

  stack.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const xPos = 0.8 + (col * 6.0);
    const yPos = 2.1 + (row * 2.3);

    addCard(s, xPos, yPos, 5.733, 2.1, item.title, item.color);

    s.addText(item.sub, {
      x: xPos + 0.25,
      y: yPos + 0.58,
      w: 5.2,
      h: 0.25,
      fontSize: 10,
      fontFace: FONT_PRIMARY,
      color: item.color,
      bold: true,
      margin: 0
    });

    s.addText(item.desc, {
      x: xPos + 0.25,
      y: yPos + 0.9,
      w: 5.2,
      h: 1.0,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_MUTED,
      margin: 0
    });
  });
}

// ==========================================
// SLIDE 9: SECURITY, AUDIT & NODE-LOCK
// ==========================================
{
  const s = pres.addSlide();
  addHeaderFooter(s, '08 / Keamanan & Tata Kelola', 'Akuntabilitas Data: Audit Trail & 5-Device Node-Lock', 'Mekanisme proteksi internal untuk memastikan setiap mutasi data tercatat dan akses terkendali', 9);

  const securityPillars = [
    {
      title: 'Immutable Audit Trail',
      sub: 'Pencatatan Setiap Perubahan Data',
      color: C_ACCENT,
      desc: 'Setiap aksi perubahan status pengerjaan atau pengeditan data tiket otomatis tersimpan ke tabel audit_logs. Mencatat identitas teknisi pelaksana (actor), jenis aksi, waktu milidetik, serta perbandingan JSON payload data sebelum dan sesudah perubahan.'
    },
    {
      title: '5-Device Node-Lock Licensing',
      sub: 'Pembatasan Akses Khusus Bengkel',
      color: C_BLUE,
      desc: 'Sistem dibatasi hanya dapat diakses oleh maksimal 5 perangkat fisik yang terdaftar (PC Kasir, Meja Teknisi 1-3, dan Komputer Owner). Verifikasi menggunakan hardware identifier token lokal untuk mencegah sistem diakses dari jaringan atau perangkat liar di luar toko.'
    },
    {
      title: 'Safeguards Pencegahan Human Error',
      sub: 'Validasi Form & Proteksi Aksi Kritis',
      color: C_EMERALD,
      desc: 'Sistem dilengkapi proteksi anti double-submit (tombol otomatis disabled dengan status spinner saat request berlangsung), konfirmasi modal untuk tindakan berbahaya (pembatalan/penghapusan tiket), serta auto-trim whitespace pada input nomor seri dan nomor telepon.'
    }
  ];

  securityPillars.forEach((sec, idx) => {
    const xPos = 0.8 + (idx * 4.0);
    const yPos = 2.1;
    const w = 3.733;
    const h = 4.6;

    addCard(s, xPos, yPos, w, h, sec.title, sec.color);

    s.addText(sec.sub, {
      x: xPos + 0.25,
      y: yPos + 0.58,
      w: w - 0.45,
      h: 0.25,
      fontSize: 9.5,
      fontFace: FONT_PRIMARY,
      color: sec.color,
      bold: true,
      margin: 0
    });

    s.addShape(pres.ShapeType.rect, {
      x: xPos + 0.25,
      y: yPos + 0.9,
      w: w - 0.5,
      h: 0.015,
      fill: { color: C_CARD_BORDER },
      line: { type: 'none' }
    });

    s.addText(sec.desc, {
      x: xPos + 0.25,
      y: yPos + 1.15,
      w: w - 0.5,
      h: 3.2,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_MUTED,
      margin: 0
    });
  });
}

// ==========================================
// SLIDE 10: IMPACT & ROADMAP
// ==========================================
{
  const s = pres.addSlide();
  addHeaderFooter(s, '09 / Dampak & Rencana', 'Dampak Operasional Nyata & Rencana Pengembangan', 'Evaluasi peningkatan efisiensi kerja di bengkel servis dan langkah penyempurnaan ke depan', 10);

  // Top 3 Metrics
  const metrics = [
    {
      val: '80%',
      label: 'WAKTU INPUT LEBIH CEPAT',
      desc: 'Waktu registrasi tiket servis berkurang dari ~5 menit menjadi kurang dari 1 menit berkat formulir dinamis & auto-formatting.'
    },
    {
      val: '100%',
      label: 'PELACAKAN GARANSI VENDOR',
      desc: 'Nol kasus unit garansi hilang di distributor tanpa nomor Surat Jalan baku dan nomor resi pengiriman ekspedisi.'
    },
    {
      val: '2x',
      label: 'PERPUTARAN STOK TOKO',
      desc: 'Unit inventaris internal (STOCK BCT / GHITP) yang selesai klaim garansi langsung teridentifikasi oleh Tim Sales untuk dipajang kembali.'
    }
  ];

  metrics.forEach((m, idx) => {
    const xPos = 0.8 + (idx * 4.0);
    const yPos = 2.1;
    const w = 3.733;
    const h = 1.9;

    s.addShape(pres.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w,
      h,
      fill: { color: C_CARD_DARK },
      line: { color: C_CARD_BORDER, width: 1 },
      rectRadius: 0.08
    });

    s.addText(m.val, {
      x: xPos + 0.25,
      y: yPos + 0.15,
      w: w - 0.5,
      h: 0.6,
      fontSize: 34,
      fontFace: FONT_PRIMARY,
      color: C_ACCENT,
      bold: true,
      margin: 0
    });

    s.addText(m.label, {
      x: xPos + 0.25,
      y: yPos + 0.75,
      w: w - 0.5,
      h: 0.25,
      fontSize: 9,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_WHITE,
      bold: true,
      margin: 0
    });

    s.addText(m.desc, {
      x: xPos + 0.25,
      y: yPos + 1.05,
      w: w - 0.5,
      h: 0.75,
      fontSize: 9.5,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_MUTED,
      margin: 0
    });
  });

  // Bottom Roadmap Box
  addCard(s, 0.8, 4.25, 11.733, 2.45, 'Roadmap Pengembangan Selanjutnya (Next Milestones)', C_BLUE);

  const roadmapItems = [
    {
      phase: 'Fase 2 (Q4)',
      title: 'Direct Bluetooth Thermal Printing',
      desc: 'Pencetakan struk nota tanda terima langsung ke printer thermal 80mm meja teknisi melalui Web Bluetooth API tanpa dialog print browser.'
    },
    {
      phase: 'Fase 3 (Q1)',
      title: 'Modul Inventaris Sparepart Terintegrasi',
      desc: 'Pencatatan pemakaian sparepart (SSD, RAM, LCD, Baterai) yang otomatis memotong stok gudang saat status pengerjaan tiket ditandai selesai.'
    },
    {
      phase: 'Fase 4 (Q2)',
      title: 'Portal Pelacakan Publik (QR Code)',
      desc: 'Pelanggan dapat memantau progres servis secara mandiri secara online cukup dengan memindai kode QR yang tertera pada nota fisik tanda terima.'
    }
  ];

  roadmapItems.forEach((rm, idx) => {
    const xPos = 1.05 + (idx * 3.8);
    const yPos = 4.95;
    const w = 3.6;

    s.addShape(pres.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: 0.9,
      h: 0.24,
      fill: { color: '0F172A' },
      line: { color: C_BLUE, width: 1 },
      rectRadius: 0.04
    });
    s.addText(rm.phase, {
      x: xPos,
      y: yPos + 0.02,
      w: 0.9,
      h: 0.2,
      fontSize: 8.5,
      fontFace: FONT_PRIMARY,
      color: C_BLUE,
      bold: true,
      align: 'center',
      valign: 'middle',
      margin: 0
    });

    s.addText(rm.title, {
      x: xPos,
      y: yPos + 0.32,
      w,
      h: 0.3,
      fontSize: 11.5,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_WHITE,
      bold: true,
      margin: 0
    });

    s.addText(rm.desc, {
      x: xPos,
      y: yPos + 0.65,
      w: w - 0.2,
      h: 0.95,
      fontSize: 9.5,
      fontFace: FONT_PRIMARY,
      color: C_TEXT_MUTED,
      margin: 0
    });
  });
}

// Generate & Write file
const outputPath = path.resolve(__dirname, '../Best_Computel_Service_RMA_Presentation.pptx');
pres.writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`Presentation generated successfully at: ${outputPath}`);
  })
  .catch((err) => {
    console.error('Error generating presentation:', err);
    process.exit(1);
  });
