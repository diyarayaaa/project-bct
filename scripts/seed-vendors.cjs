// Seed 35 vendor asli BCT dari referensi (DB ALAMAT + distributor dari data tiket)
// Jalankan: node scripts/seed-vendors.cjs  (dari root project-bct)
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, 'bct.sqlite');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

// [nama_vendor, wilayah, alamat_lengkap, kontak_wa]
// Sumber: sheet DB ALAMAT (23) + distributor unik dari data tiket GARANSI/SERVICE
const vendors = [
  // --- BDG (Bandung & sekitar) ---
  ['CV. PRISMA MITRA BUANA', 'BDG', 'Ruko Harco Mangga 2 Selatan Blok i-47, Kel. Mangga 2 selatan, Kec. Sawah Besar, Jakarta Pusat 10730', '0821-1922-8869'],
  ['PT. ASIA GLOBAL SUKSESINDO (AGS)', 'BDG', 'Ruko Harco Mangga 2 Selatan Blok F-8, Kel. Mangga 2 selatan, Jakarta Pusat 10730', '0817-1777-7002'],
  ['ELITE KOMPUTER (PAK AMIN)', 'BDG', 'Jl. Cagak Kp. Picung Gede No.32 RT 02/RW 05, Ds. Cipatik, Kec. Cihampelas, Bandung Barat 40562', '081223495909'],
  ['JETE PASKAL 23 BANDUNG', 'BDG', 'Paskal 23 Bandung, Jl. Pasir Kaliki No.25-27 Lantai 2 Unit No.39, Kb. Jeruk, Kec. Andir, Kota Bandung 40241', '0857-3378-4023'],
  ['PT. ASTRINDO SENTOSA (ASUS SC)', 'BDG', 'Ruko Segitiga Mas Kosambi, JL. Jend A. Yani No.221-223 Bl C/13, Merdeka, Sumurbandung, Bandung 40113', '0812-2156-0599'],
  ['AGRES ID BDG', 'BDG', 'AGRES Info Teknologi, Bandung', '0812-3456-7890'],
  ['ASUS SERVICE CENTER BDG', 'BDG', 'Service Center ASUS Bandung', '-'],
  ['ACER SERVICE CENTER BDG', 'BDG', 'Service Center Acer Bandung', '-'],
  ['CCK BDG', 'BDG', 'CCK Bandung', '-'],
  ['GPL BDG', 'BDG', 'GPL Bandung', '-'],
  ['DTG BDG', 'BDG', 'DTG Bandung', '-'],
  ['NOVUS BDG', 'BDG', 'Novus Bandung', '-'],
  ['NSN BDG', 'BDG', 'NSN Bandung', '-'],
  ['ANYAR KOMPUTER BDG', 'BDG', 'Anyar Komputer Bandung', '-'],
  ['NE BANDUNG', 'BDG', 'NE Bandung', '-'],
  ['MEGA KOMPUTER BDG', 'BDG', 'Mega Komputer Bandung', '-'],
  ['Q-CHOX COMPUTER', 'BDG', 'Jalan Raya Cilauteureun KM.00 Pameungpeuk - Garut 44175 (dekat Alun-Alun Pameungpeuk)', '0821-2222-7280'],
  ['PAK TONI GREEN NET', 'BDG', 'Ciawi - Cibalong, depan Garasi AL', '0812-2258-0770'],
  ['DADAN KOMPUTER', 'BDG', 'Jalan Raya Siliwangi No.2 Gang Al-Falah, Cikaret, Cianjur', '0856-2191-507'],
  ['ARIA COMPUTER', 'BDG', 'Ruko Cimenteng samping Baso Mojok Jalan Arwinda, Cianjur 43215', '0856-5949-4246'],
  ['TN.GANJAR LESMANA', 'BDG', 'Kp. Cikoer - Kec. Cikelet', '0821-2017-8492'],
  ['PT. METRO PEARL INDONESIA', 'BDG', 'Jl. Pramuka Raya Km 0.99 No.18, Desa Bunder, Kec. Jatiluhur, Purwakarta', '0877-7975-5416'],

  // --- JKT (Jakarta) ---
  ['AGRES INFO TEKNOLOGI (AGRES JKT)', 'JKT', 'AGRES (Gudang Abdad) Mangga Dua Abdad No.44-45, RW.12 Mangga Dua Selatan, Jakarta 10730', '0813-5566-7788'],
  ['CV. GOLDEN TECHNOLOGY INDO', 'JKT', 'Ruko Sedayu Square Blok J26, Cengkareng Barat, Jakarta Barat 11730', '0811-1903-2716'],
  ['ABACUS KOMPUTER', 'JKT', 'Mall Mangga Dua Blok A Lantai 4 No.51, Jakarta Pusat 10730', '0858-8031-2805'],
  ['PT NANO SOLUSI TECHNOLOGY (SC COMPUTER)', 'JKT', 'Grand Boutique Center Blok E10, Jl. Mangga Dua Raya, Ancol, Jakarta Utara 14430', '0815-1013-5638'],
  ['PT. SURYA ARTHA KOMPUTAMA (SAK)', 'JKT', 'Ruko Mangga 2 Mas D25, Jalan Mangga Dua Abdad, Jakarta Pusat 10730', '0877-8810-1990'],
  ['FM KOMPUTER', 'JKT', 'Green Sedayu Bizpark Blok DM3 no 11G, Kalideres, Jakarta Barat 11840', '0878-8004-5463'],
  ['KC JAKARTA GROUP (ROG X MOG)', 'JKT', 'WTC Manggadua Lantai UG Blok C No 58, Jakarta Utara 14430', '0858-8848-2918'],
  ['Surya Kencana 30', 'JKT', 'Jl. Buncit Raya No.30, Kalibata, Pancoran, Jakarta Selatan 12740', '0858-6063-2297'],
  ['AGRES JAKARTA', 'JKT', 'AGRES (Gudang Abdad) Mangga Dua Abdad No.44-45, Jakarta 10730', '0813-5566-7788'],
  ['Cahaya Distribusi Nusantara', 'JKT', 'Mangga Dua Mall Ruko Blok A10, Jakarta', '0855-147-8985'],
  ['INNOVATION', 'JKT', 'Ruko Bahan Bangunan (RBB) Blok H1 No.9 Jl. Mangga 2 Dalam, Jakarta Pusat 10730', '0812-9898-0909'],
  ['INTERAKSI CIPTA', 'JKT', 'Ruko Harco Mangga Dua Blok J no.26, Jakarta Pusat', '0813-1135-5564'],
  ['ASIA RAYA JKT', 'JKT', 'PT. Asia Raya, Jakarta', '-'],
  ['MSA JKT', 'JKT', 'MSA Jakarta', '-'],
  ['PT. ASIA GLOBAL SUKSESINDO (AGS) JKT', 'JKT', 'PT. Asia Global Suksesindo Jakarta', '-'],

  // --- OTHER (luar BDG/JKT) ---
  ['Suyantou / Kayun', 'OTHER', 'Blanten Rejo RT 02 RW 05 Sukorejo, Kec. Musuk, Boyolali, Jateng 57361', '0856-0248-3047'],
  ['CV. PRISMA MITRA BUANA (JKT)', 'JKT', 'Ruko Harco Mangga 2 Selatan Blok i-47, Jakarta Pusat', '0821-1922-8869'],
];

const insert = db.prepare(
  `INSERT OR REPLACE INTO master_vendors (nama_vendor, wilayah, alamat_lengkap, kontak_wa, is_active)
   VALUES (?, ?, ?, ?, 1)`
);

let count = 0;
const seen = new Set();
for (const [nama, wilayah, alamat, wa] of vendors) {
  if (seen.has(nama)) continue;
  seen.add(nama);
  insert.run(nama, wilayah, alamat, wa);
  count++;
}

const total = db.prepare('SELECT COUNT(*) as c FROM master_vendors').get().c;
console.log(`✅ Inserted/updated ${count} vendor entries. Total in master_vendors: ${total}`);
// Show distribution
const dist = db.prepare('SELECT wilayah, COUNT(*) as c FROM master_vendors GROUP BY wilayah').all();
console.log('Distribusi:', JSON.stringify(dist));
