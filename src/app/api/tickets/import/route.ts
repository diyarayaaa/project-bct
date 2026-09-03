import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

function parseIndoDate(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === '-') return null;

  // Standard ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 19).replace('T', ' ');
  }

  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05', jun: '06',
    jul: '07', agu: '08', aug: '08', sep: '09', okt: '10', oct: '10', nov: '11', des: '12', dec: '12'
  };

  // Format "2-Jun-2026"
  const dmyMatch = str.match(/^(\d{1,2})[-/ ]([a-zA-Z]{3})[-/ ](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const mStr = dmyMatch[2].toLowerCase();
    const month = monthNames[mStr] || '01';
    const year = dmyMatch[3];
    return `${year}-${month}-${day} 00:00:00`;
  }

  // Format "02/06/2026" or "02/06/26"
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    let year = slashMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day} 00:00:00`;
  }

  // Format "Thursday, 04 June 2026"
  const longMatch = str.match(/[a-zA-Z]+,\s*(\d{1,2})\s*([a-zA-Z]+)\s*(\d{4})/);
  if (longMatch) {
    const day = longMatch[1].padStart(2, '0');
    const mStr = longMatch[2].slice(0, 3).toLowerCase();
    const month = monthNames[mStr] || '01';
    const year = longMatch[3];
    return `${year}-${month}-${day} 00:00:00`;
  }

  return null;
}

function cleanNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const s = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseKelengkapan(val: any): string {
  if (!val) return JSON.stringify([]);
  const arr = String(val).split(',').map(s => s.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

export async function POST(req: NextRequest) {
  try {
    let rows: any[][] = [];
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const usePreset = formData.get('usePreset') as string | null;

      if (usePreset) {
        // Read file from public folder directly
        const presetPath = path.join(process.cwd(), 'public', usePreset);
        if (fs.existsSync(presetPath)) {
          const buffer = fs.readFileSync(presetPath);
          const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }) as any[][];
        } else {
          return NextResponse.json({ error: `File preset ${usePreset} tidak ditemukan di folder public` }, { status: 404 });
        }
      } else if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }) as any[][];
      } else {
        return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
      }
    } else {
      // JSON body
      const body = await req.json();
      if (body.usePreset) {
        const presetPath = path.join(process.cwd(), 'public', body.usePreset);
        if (fs.existsSync(presetPath)) {
          const buffer = fs.readFileSync(presetPath);
          const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }) as any[][];
        }
      }
    }

    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'Data spreadsheet kosong atau tidak memiliki baris data' }, { status: 400 });
    }

    const header = rows[0].map((h: any) => String(h || '').trim().toUpperCase());
    
    // Find column indexes
    const findCol = (...names: string[]) => {
      for (const name of names) {
        const idx = header.findIndex(h => h.includes(name));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const idxRma = findCol('NO RMA', 'RMA', 'NOMOR');
    const idxTglMasuk = findCol('TGL MASUK', 'TANGGAL MASUK');
    const idxJenis = findCol('JENIS RMA', 'JENIS LAYANAN', 'JENIS');
    const idxNamaCust = findCol('NAMA CUST', 'CUSTOMER', 'NAMA');
    const idxNoHp = findCol('NO HP', 'TELEPON', 'HP', 'WHATSAPP');
    const idxJenisBarang = findCol('JENIS BARANG', 'KATEGORI');
    const idxNamaBarang = findCol('NAMA BARANG', 'PERANGKAT');
    const idxSn = findCol('SERIAL NUMBER', 'SN');
    const idxKeluhan = findCol('KELUHAN', 'KERUSAKAN');
    const idxKelengkapan = findCol('KELENGKAPAN');
    const idxEstimasi = findCol('ESTIMASI SELESAI');
    const idxBiaya = findCol('ESTIMASI BIAYA');
    const idxDp = findCol('DP');
    const idxSisa = findCol('SISA');
    const idxTeknisi = findCol('TEKNISI');
    const idxStatus = findCol('STATUS');
    const idxDistributor = findCol('DISTRIBUTOR', 'VENDOR');
    const idxTglKirim = findCol('TGL KIRIM KE DISTRI', 'TGL KIRIM');
    const idxTglDatang = findCol('TGL DATANG DARI DISTRI', 'TGL DATANG');
    const idxTglAmbil = findCol('TGL DIAMBIL CUST', 'TGL DIAMBIL');
    const idxHasil = findCol('HASIL GARANSI', 'HASIL');
    const idxSnBaru = findCol('SN BARU');
    const idxCatatan = findCol('CATATAN');
    const idxBiayaAkhir = findCol('TOTAL BIAYA AKHIR', 'BIAYA AKHIR');
    const idxNoSj = findCol('NO SURAT JALAN', 'SURAT JALAN');

    const db = getDatabase();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

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

    let importedCount = 0;
    let skippedCount = 0;

    db.exec('BEGIN TRANSACTION');

    try {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const val = (idx: number) => (idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : '');

        const noRma = val(idxRma !== -1 ? idxRma : 0);
        if (!noRma || !noRma.toUpperCase().startsWith('BCTRS')) {
          skippedCount++;
          continue;
        }

        const tglMasuk = parseIndoDate(val(idxTglMasuk)) || now;
        const rawJenis = val(idxJenis).toUpperCase();
        const jenisLayanan = rawJenis.includes('GARANSI') ? 'GARANSI' : 'SERVICE';
        const namaCust = val(idxNamaCust) || 'Pelanggan';
        const noHp = val(idxNoHp) || '-';
        const jenisBarang = val(idxJenisBarang) || 'Other';
        const namaBarang = val(idxNamaBarang) || '-';
        const sn = val(idxSn) || '-';
        const keluhan = val(idxKeluhan) || '-';
        const kelengkapan = parseKelengkapan(val(idxKelengkapan));
        const estimasiSelesai = parseIndoDate(val(idxEstimasi));
        const estimasiBiaya = cleanNum(val(idxBiaya));
        const dp = cleanNum(val(idxDp));
        const sisa = cleanNum(val(idxSisa));
        const teknisi = val(idxTeknisi) || 'Wandi';
        const status = val(idxStatus) || 'PROSES SERVICE';
        const distributor = val(idxDistributor) || null;
        const tglKirimVendor = parseIndoDate(val(idxTglKirim));
        const tglDatangVendor = parseIndoDate(val(idxTglDatang));
        const tglDiambilCust = parseIndoDate(val(idxTglAmbil));
        const hasilGaransi = val(idxHasil) || null;
        const snBaru = val(idxSnBaru) || null;
        const catatan = val(idxCatatan) || null;
        const totalBiayaAkhir = cleanNum(val(idxBiayaAkhir));
        const noSuratJalan = val(idxNoSj) || null;

        const ticketId = 'imp-' + noRma;

        insertStmt.run(
          ticketId, noRma, tglMasuk, jenisLayanan, namaCust, noHp,
          jenisBarang, namaBarang, sn, keluhan, kelengkapan, estimasiSelesai,
          teknisi, status, catatan, estimasiBiaya, dp, sisa, totalBiayaAkhir,
          noSuratJalan, distributor, tglKirimVendor, tglDatangVendor,
          hasilGaransi, snBaru, tglDiambilCust, now, now
        );

        importedCount++;
      }

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const totalInDb = (db.prepare('SELECT COUNT(*) as c FROM tickets').get() as any)?.c || 0;

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      totalInDb,
      message: `Berhasil mengimpor ${importedCount} data tiket ke database.`
    });
  } catch (error: any) {
    console.error('API Import Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengimpor file' }, { status: 500 });
  }
}
