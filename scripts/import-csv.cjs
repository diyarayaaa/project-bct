const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function parseIndoDate(val) {
  if (!val) return null;
  val = String(val).trim();
  if (!val || val === '-') return null;

  // Already standard format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    return val.slice(0, 19).replace('T', ' ');
  }

  // Handle formats like "2-Jun-2026", "23-Jun-2026"
  const monthNames = {
    jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05', jun: '06',
    jul: '07', agu: '08', aug: '08', sep: '09', okt: '10', oct: '10', nov: '11', des: '12', dec: '12'
  };

  const dayMonthYearRegex = /^(\d{1,2})[-/ ]([a-zA-Z]{3})[-/ ](\d{4})/;
  const dmyMatch = val.match(dayMonthYearRegex);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const mStr = dmyMatch[2].toLowerCase();
    const month = monthNames[mStr] || '01';
    const year = dmyMatch[3];
    return `${year}-${month}-${day} 00:00:00`;
  }

  // Handle format "DD/MM/YYYY" e.g. "02/06/2026"
  const slashRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;
  const slashMatch = val.match(slashRegex);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day} 00:00:00`;
  }

  // Handle format "Thursday, 04 June 2026"
  const longRegex = /[a-zA-Z]+,\s*(\d{1,2})\s*([a-zA-Z]+)\s*(\d{4})/;
  const longMatch = val.match(longRegex);
  if (longMatch) {
    const day = longMatch[1].padStart(2, '0');
    const mStr = longMatch[2].slice(0, 3).toLowerCase();
    const month = monthNames[mStr] || '01';
    const year = longMatch[3];
    return `${year}-${month}-${day} 00:00:00`;
  }

  return null;
}

function cleanNum(val) {
  if (val === null || val === undefined || val === '') return 0;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function parseKelengkapan(val) {
  if (!val) return JSON.stringify([]);
  const arr = String(val).split(',').map(s => s.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

function importCsv(filePath) {
  console.log('📂 Membaca file:', filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    console.error('File CSV kosong atau tidak memiliki baris data');
    return;
  }

  const dbPath = path.join(process.cwd(), 'data', 'bct.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');

  // Header line
  const header = lines[0].split(';').map(h => h.trim().toUpperCase());
  console.log(`📋 Ditemukan ${lines.length - 1} baris data CSV dengan kolom:`, header.slice(0, 8).join(', ') + '...');

  const insertStmt = db.prepare(`
    INSERT INTO tickets (
      id, nomor_layanan, tanggal_masuk, jenis_layanan, nama_customer, no_hp,
      jenis_barang, nama_barang, serial_number, keluhan, kelengkapan, estimasi_selesai,
      teknisi, status, catatan, estimasi_biaya, dp, sisa, biaya_akhir,
      no_surat_jalan, distributor_vendor, tgl_kirim_vendor, tgl_datang_vendor,
      hasil_service_garansi, sn_baru, tgl_diambil_customer, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
    ON CONFLICT(nomor_layanan) DO UPDATE SET
      tanggal_masuk=excluded.tanggal_masuk,
      jenis_layanan=excluded.jenis_layanan,
      nama_customer=excluded.nama_customer,
      no_hp=excluded.no_hp,
      jenis_barang=excluded.jenis_barang,
      nama_barang=excluded.nama_barang,
      serial_number=excluded.serial_number,
      keluhan=excluded.keluhan,
      kelengkapan=excluded.kelengkapan,
      estimasi_selesai=excluded.estimasi_selesai,
      teknisi=excluded.teknisi,
      status=excluded.status,
      catatan=excluded.catatan,
      estimasi_biaya=excluded.estimasi_biaya,
      dp=excluded.dp,
      sisa=excluded.sisa,
      biaya_akhir=excluded.biaya_akhir,
      no_surat_jalan=excluded.no_surat_jalan,
      distributor_vendor=excluded.distributor_vendor,
      tgl_kirim_vendor=excluded.tgl_kirim_vendor,
      tgl_datang_vendor=excluded.tgl_datang_vendor,
      hasil_service_garansi=excluded.hasil_service_garansi,
      sn_baru=excluded.sn_baru,
      tgl_diambil_customer=excluded.tgl_diambil_customer,
      updated_at=datetime('now', 'localtime')
  `);

  let count = 0;
  let skipped = 0;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  db.exec('BEGIN TRANSACTION');

  try {
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(';').map(c => (c !== undefined ? c.trim() : ''));
      const noRma = row[0];

      if (!noRma || !noRma.startsWith('BCTRS')) {
        skipped++;
        continue;
      }

      const tglMasuk = parseIndoDate(row[1]) || now;
      const jenisLayanan = (row[2] && row[2].toUpperCase() === 'GARANSI') ? 'GARANSI' : 'SERVICE';
      const namaCust = row[3] || 'Pelanggan';
      const noHp = row[4] || '-';
      const jenisBarang = row[5] || 'Other';
      const namaBarang = row[6] || '-';
      const sn = row[7] || '-';
      const keluhan = row[8] || '-';
      const kelengkapan = parseKelengkapan(row[9]);
      const estimasiSelesai = parseIndoDate(row[10]);
      const estimasiBiaya = cleanNum(row[11]);
      const dp = cleanNum(row[12]);
      const sisa = cleanNum(row[13]);
      const teknisi = row[14] || 'Wandi';
      const status = row[15] || 'PROSES SERVICE';
      const distributor = row[16] || null;
      const tglKirimVendor = parseIndoDate(row[17]);
      const tglDatangVendor = parseIndoDate(row[18]);
      const tglDiambilCust = parseIndoDate(row[19]);
      const hasilGaransi = row[20] || null;
      const snBaru = row[21] || null;
      const catatan = row[22] || null;
      const totalBiayaAkhir = cleanNum(row[23]);
      const noSuratJalan = row[24] || null;

      const ticketId = 'imp-' + noRma;

      insertStmt.run(
        ticketId, noRma, tglMasuk, jenisLayanan, namaCust, noHp,
        jenisBarang, namaBarang, sn, keluhan, kelengkapan, estimasiSelesai,
        teknisi, status, catatan, estimasiBiaya, dp, sisa, totalBiayaAkhir,
        noSuratJalan, distributor, tglKirimVendor, tglDatangVendor,
        hasilGaransi, snBaru, tglDiambilCust, now, now
      );

      count++;
    }

    db.exec('COMMIT');
    console.log(`✅ Berhasil mengimpor/memperbarui ${count} tiket ke SQLite (dilewati: ${skipped})!`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('❌ Terjadi kesalahan saat import:', err);
  }

  const totalTickets = db.prepare('SELECT COUNT(*) as c FROM tickets').get().c;
  console.log(`📊 Total tiket aktif sekarang di database: ${totalTickets} baris.`);
}

const targetFile = process.argv[2] || path.join(process.cwd(), 'public', 'database-lama.csv');
importCsv(targetFile);
