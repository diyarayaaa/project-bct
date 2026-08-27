// Impor FULL data tiket lama (320 baris) dari _db_rows.json -> SQLite tickets
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const dbPath = path.join(process.cwd(), 'data', 'bct.sqlite');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

const jsonPath = path.join(process.cwd(), 'scripts', '_db_rows.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Kolom DB: 0 NO RMA,1 TGL MASUK,2 JENIS RMA,3 NAMA CUST,4 NO HP,5 JENIS BARANG,
// 6 NAMA BARANG,7 SERIAL NUMBER,8 KELUHAN,9 KELENGKAPAN,10 ESTIMASI SELESAI,
// 11 ESTIMASI BIAYA,12 DP,13 SISA,14 TEKNISI,15 NEXT,16 STATUS,17 DISTRIBUTOR,
// 18 TGL KIRIM KE DISTRI,19 TGL DATANG DARI DISTRI,20 TGL DIAMBIL CUST,
// 21 HASIL GARANSI,22 SN BARU,23 CATATAN,24 BIAYA AKHIR

function num(v){ if(v===''||v==null) return 0; const n=parseFloat(String(v).replace(/[^0-9.\-]/g,'')); return isNaN(n)?0:n; }
function jdate(v){
  if(!v) return null;
  if(v instanceof Date) return v.toISOString().slice(0,19).replace('T',' ');
  const s=String(v).replace('T',' ');
  return s.slice(0,19) || null;
}
function kelengkapan(v){
  if(!v) return JSON.stringify([]);
  const arr = String(v).split(',').map(x=>x.trim()).filter(Boolean);
  return JSON.stringify(arr.length?arr:[]);
}
const clean = s => (s||'').toString().trim();

db.exec("DELETE FROM tickets WHERE id LIKE 'ticket-%';");
db.exec("DELETE FROM tickets WHERE id LIKE 'imp-%';");

const insert = db.prepare(`
  INSERT OR REPLACE INTO tickets (
    id, nomor_layanan, tanggal_masuk, jenis_layanan, nama_customer, no_hp,
    jenis_barang, nama_barang, serial_number, keluhan, kelengkapan, estimasi_selesai,
    teknisi, status, catatan, estimasi_biaya, dp, sisa, biaya_akhir,
    no_surat_jalan, distributor_vendor, tgl_kirim_vendor, tgl_datang_vendor,
    hasil_service_garansi, sn_baru, tgl_diambil_customer, created_at, updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

let n=0, skip=0, byJenis={SERVICE:0,GARANSI:0};
for(const r of data){
  const nomor = clean(r[0]);
  if(!nomor.startsWith('BCTRS')){ skip++; continue; }
  const jenis = (clean(r[2]).toUpperCase()==='GARANSI')?'GARANSI':'SERVICE';
  const status = clean(r[16]) || 'PROSES SERVICE';
  const now = new Date().toISOString().slice(0,19).replace('T',' ');
  insert.run(
    'imp-'+nomor, nomor, jdate(r[1])||now, jenis, clean(r[3]), clean(r[4]),
    clean(r[5])||'Other', clean(r[6]), clean(r[7]), clean(r[8]), kelengkapan(r[9]), jdate(r[10]),
    clean(r[14])||'Wandi', status, clean(r[23]), num(r[11]), num(r[12]), num(r[13]), num(r[24]),
    clean(r[19]), clean(r[17])||null, jdate(r[18]), jdate(r[19]),
    clean(r[21])||null, clean(r[22])||null, jdate(r[20]), now, now
  );
  n++; byJenis[jenis]++;
}
const total = db.prepare('SELECT COUNT(*) c FROM tickets').get().c;
console.log(`✅ Imported ${n} tickets (SERVICE:${byJenis.SERVICE}, GARANSI:${byJenis.GARANSI}, skipped:${skip}). Total tickets: ${total}`);
fs.unlinkSync(jsonPath);
