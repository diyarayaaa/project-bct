import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'bct.sqlite');

declare global {
  // eslint-disable-next-line no-var
  var _sqliteDb: DatabaseSync | undefined;
  // eslint-disable-next-line no-var
  var _sqliteDbInitialized: boolean | undefined;
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (global._sqliteDb) {
    return global._sqliteDb;
  }

  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);
    try {
      dbInstance.exec('PRAGMA busy_timeout = 5000;');
    } catch {
      // ignore
    }

    if (!global._sqliteDbInitialized) {
      initDatabase(dbInstance);
      global._sqliteDbInitialized = true;
    }

    global._sqliteDb = dbInstance;
  }

  return dbInstance;
}

function initDatabase(db: DatabaseSync) {
  try {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
  } catch {
    // Ignore PRAGMA lock if already set
  }

  try {
    // 0. Table users
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nama_lengkap TEXT NOT NULL,
        role TEXT NOT NULL,
        spesialisasi TEXT,
        avatar_color TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // 1. Table tickets
    db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        nomor_layanan TEXT UNIQUE NOT NULL,
        tanggal_masuk TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
        jenis_layanan TEXT NOT NULL,
        nama_customer TEXT NOT NULL,
        no_hp TEXT NOT NULL,
        jenis_barang TEXT NOT NULL,
        nama_barang TEXT NOT NULL,
        serial_number TEXT NOT NULL,
        keluhan TEXT NOT NULL,
        kelengkapan TEXT NOT NULL DEFAULT '[]',
        estimasi_selesai TEXT,
        teknisi TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PROSES SERVICE',
        catatan TEXT,
        estimasi_biaya REAL DEFAULT 0,
        dp REAL DEFAULT 0,
        sisa REAL DEFAULT 0,
        biaya_akhir REAL DEFAULT 0,
        no_surat_jalan TEXT,
        distributor_vendor TEXT,
        tgl_kirim_vendor TEXT,
        tgl_datang_vendor TEXT,
        hasil_service_garansi TEXT,
        sn_baru TEXT,
        tgl_diambil_customer TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // 2. Table surat_jalan
    db.exec(`
      CREATE TABLE IF NOT EXISTS surat_jalan (
        id TEXT PRIMARY KEY,
        no_surat_jalan TEXT UNIQUE NOT NULL,
        distributor_vendor TEXT NOT NULL,
        tgl_kirim TEXT NOT NULL,
        ekspedisi TEXT,
        no_resi TEXT,
        catatan TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // 3. Table master_vendors
    db.exec(`
      CREATE TABLE IF NOT EXISTS master_vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_vendor TEXT UNIQUE NOT NULL,
        wilayah TEXT NOT NULL,
        alamat_lengkap TEXT,
        kontak_wa TEXT,
        is_active INTEGER DEFAULT 1
      );
    `);

    // 4. Table master_keluhan
    db.exec(`
      CREATE TABLE IF NOT EXISTS master_keluhan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teks_keluhan TEXT UNIQUE NOT NULL
      );
    `);

    // 5. Table audit_logs
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT,
        nomor_layanan TEXT,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        keterangan TEXT NOT NULL,
        payload_sebelum TEXT,
        payload_sesudah TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      );
    `);

    seedInitialData(db);
  } catch (err) {
    console.error('Database initialization warning:', err);
  }
}

function seedInitialData(db: DatabaseSync) {
  try {
    // Seed Users
    const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const userCount = userCountStmt.get() as { count: number };

    if (userCount.count === 0) {
      const insertUser = db.prepare(`
        INSERT INTO users (id, username, password_hash, nama_lengkap, role, spesialisasi, avatar_color)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const defaultUsers = [
        ['usr-wandi', 'wandi', 'bct123', 'Wandi', 'TEKNISI', 'Teknisi Utama & Garansi', 'orange'],
        ['usr-satryo', 'satryo', 'bct123', 'Satryo', 'TEKNISI', 'Teknisi Servis Reguler', 'blue'],
        ['usr-derida', 'derida', 'bct123', 'Derida', 'TEKNISI', 'Teknisi Servis', 'emerald'],
        ['usr-anzar', 'anzar', 'bct123', 'Anzar', 'TEKNISI', 'Teknisi Servis', 'indigo'],
        ['usr-admin', 'admin', 'bct123', 'Admin Kasir', 'ADMIN', 'Administrasi, Kasir & Logistik', 'purple'],
        ['usr-sales', 'sales', 'bct123', 'Sales Toko', 'SALES', 'Sales & Stok BCT / GHITP', 'pink']
      ];

      for (const u of defaultUsers) {
        insertUser.run(...u);
      }
    }

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM master_vendors');
    const result = countStmt.get() as { count: number };

    if (result.count === 0) {
      const insertVendor = db.prepare(`
        INSERT INTO master_vendors (nama_vendor, wilayah, alamat_lengkap, kontak_wa, is_active)
        VALUES (?, ?, ?, ?, 1)
      `);

      const vendors = [
        ['PT. ASIA RAYA COM BDG', 'BDG', 'Komplek Pertokoan Naripan No. 42, Bandung', '08122001122'],
        ['PT. AGRES INFO TEKNOLOGI BDG', 'BDG', 'BEC Lt. 2 Blok C-10, Jl. Purnawarman, Bandung', '08133002233'],
        ['METRODATA ELECTRONICS BDG', 'BDG', 'Jl. Sunda No. 55, Bandung', '08129988776'],
        ['PT. SYNNEX METRODATA JKT', 'JKT', 'Kawasan Industri Pulogadung, Jakarta Timur', '08119008811'],
        ['AGRES ID JKT', 'JKT', 'Harco Mangga Dua Plaza Blok A No. 12, Jakarta', '08138877665'],
        ['PT. ASIA SURYA TECH JKT', 'JKT', 'Mangga Dua Mall Lt. 3 No. 45, Jakarta Pusat', '08157788990'],
        ['PT. EP-TECH SERVICE CENTER', 'OTHER', 'Ruko ITC Cempaka Mas, Jakarta', '08128899001']
      ];

      for (const v of vendors) {
        insertVendor.run(v[0], v[1], v[2], v[3]);
      }

      const insertKeluhan = db.prepare(`
        INSERT INTO master_keluhan (teks_keluhan)
        VALUES (?)
      `);

      const keluhanList = [
        'Mati Total (No Power)',
        'No Display / Layar Gelap',
        'Lambat / Lemot / Hang',
        'Keyboard Eror / Mengetik Sendiri',
        'Baterai Drop / Not Charging',
        'Layar Bergaris / LCD Rusak',
        'Overheat / Suhu Panas & Mati Sendiri',
        'Gagal Booting / Masuk BIOS Terus',
        'Hasil Print Putus-Putus',
        'Engsel Layar Patah / Rusak',
        'Harddisk / SSD Tidak Terbaca',
        'Install Ulang OS + Software Standar'
      ];

      for (const k of keluhanList) {
        insertKeluhan.run(k);
      }

      const insertTicket = db.prepare(`
        INSERT INTO tickets (
          id, nomor_layanan, tanggal_masuk, jenis_layanan, nama_customer, no_hp,
          jenis_barang, nama_barang, serial_number, keluhan, kelengkapan, estimasi_selesai,
          teknisi, status, catatan, estimasi_biaya, dp, sisa, biaya_akhir,
          no_surat_jalan, distributor_vendor, tgl_kirim_vendor, tgl_datang_vendor,
          hasil_service_garansi, sn_baru, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);

      const today = new Date().toISOString().split('T')[0];

      const sampleTickets = [
        [
          'ticket-1',
          'BCTRS26-0001',
          `${today} 09:30:00`,
          'SERVICE',
          'TN/NY. BUDI SANTOSO',
          '081234567890',
          'Laptop',
          'Asus TUF Gaming FX505',
          'SN-ASUS-982138',
          'Mati Total (No Power) setelah terkena petir',
          JSON.stringify(['Unit', 'Charger', 'Tas']),
          '2026-08-30',
          'Wandi',
          'PROSES SERVICE',
          'Password Windows: 1234. Cek jalur power IC dan vcore.',
          450000,
          100000,
          350000,
          0,
          null,
          null,
          null,
          null,
          null,
          null,
          `${today} 09:30:00`,
          `${today} 09:30:00`
        ],
        [
          'ticket-2',
          'BCTRS26-0002',
          `${today} 10:15:00`,
          'SERVICE',
          'TN/NY. SITI AMINAH',
          '081398765432',
          'Laptop',
          'Lenovo Ideapad Slim 3',
          'SN-LNVO-448291',
          'Layar Bergaris / LCD Rusak',
          JSON.stringify(['Unit', 'Charger']),
          '2026-08-29',
          'Satryo',
          'PENDING SERVICE',
          'Menunggu konfirmasi customer untuk ganti panel LCD FHD IPS Rp 850.000',
          850000,
          0,
          850000,
          0,
          null,
          null,
          null,
          null,
          null,
          null,
          `${today} 10:15:00`,
          `${today} 10:15:00`
        ],
        [
          'ticket-3',
          'BCTRS26-0003',
          `${today} 11:00:00`,
          'SERVICE',
          'TN/NY. AHMAD FAUZI',
          '081987654321',
          'PC',
          'Custom PC Core i5 12400F + RTX 3060',
          'SN-PC-773910',
          'Install Ulang OS + Bersihkan Debu & Ganti Thermal Paste',
          JSON.stringify(['Dus', 'PSU', 'Tutup case full', 'RAM', 'SSD', 'VGA']),
          '2026-08-27',
          'Wandi',
          'SELESAI BELUM DIAMBIL',
          'Sudah running test Furmark 30 menit suhu aman 65C.',
          250000,
          0,
          250000,
          250000,
          null,
          null,
          null,
          null,
          null,
          null,
          `${today} 11:00:00`,
          `${today} 11:00:00`
        ],
        [
          'ticket-4',
          'BCTRS26-0004',
          `${today} 08:45:00`,
          'GARANSI',
          'TN/NY. RENDY PRATAMA',
          '082211445566',
          'Laptop',
          'Acer Nitro 5 AN515',
          'SN-ACER-110099',
          'Keyboard Eror / Mengetik Sendiri',
          JSON.stringify(['Unit', 'Charger', 'Dus']),
          '2026-09-10',
          'Wandi',
          'PROSES GARANSI',
          'Klaim garansi resmi Acer via distributor.',
          0,
          0,
          0,
          0,
          'SJ-BCTRS-260002',
          'PT. ASIA RAYA COM BDG',
          `${today}`,
          null,
          null,
          null,
          `${today} 08:45:00`,
          `${today} 08:45:00`
        ],
        [
          'ticket-5',
          'BCTRS26-0005',
          `${today} 09:00:00`,
          'GARANSI',
          'TN/NY. DEWI LESTARI',
          '085611223344',
          'Laptop',
          'HP Pavilion 14 Aero',
          'SN-HP-993821',
          'No Display / Layar Gelap',
          JSON.stringify(['Unit', 'Charger']),
          '2026-09-15',
          'Wandi',
          'PROSES GARANSI',
          'Kirim via ekspedisi JNE ke Harco Mangga Dua.',
          0,
          0,
          0,
          0,
          'SJ-BCTRS-260001',
          'AGRES ID JKT',
          '2026-08-25',
          null,
          null,
          null,
          '2026-08-25 09:00:00',
          '2026-08-25 09:00:00'
        ],
        [
          'ticket-6',
          'BCTRS26-0006',
          '2026-08-20 14:00:00',
          'GARANSI',
          'STOCK BCT',
          '082120081484',
          'Laptop',
          'Asus Vivobook 14 A1404',
          'SN-OLD-ASUS-8847',
          'Motherboard Rusak / Gagal Booting',
          JSON.stringify(['Fulldus', 'Unit', 'Charger']),
          '2026-08-27',
          'Wandi',
          'SELESAI BELUM DIAMBIL',
          'Unit stok toko siap pajang dan jual kembali.',
          0,
          0,
          0,
          0,
          'SJ-BCTRS-260002',
          'PT. ASIA RAYA COM BDG',
          '2026-08-21',
          `${today}`,
          'Diganti baru',
          'SN-NEW-ASUS-991244',
          '2026-08-20 14:00:00',
          `${today} 10:00:00`
        ],
        [
          'ticket-7',
          'BCTRS26-0007',
          '2026-08-22 15:30:00',
          'GARANSI',
          'GHITP',
          '082120081484',
          'Laptop',
          'Lenovo Yoga 6 13ABR8',
          'SN-GHITP-55291',
          'Baterai Drop / Tidak Mengisi',
          JSON.stringify(['Fulldus', 'Unit', 'Charger']),
          '2026-09-05',
          'Wandi',
          'PROSES GARANSI',
          'Stok display pameran ITB.',
          0,
          0,
          0,
          0,
          'SJ-BCTRS-260002',
          'PT. AGRES INFO TEKNOLOGI BDG',
          '2026-08-24',
          null,
          null,
          null,
          '2026-08-22 15:30:00',
          '2026-08-24 10:00:00'
        ],
        [
          'ticket-8',
          'BCTRS26-0008',
          `${today} 11:30:00`,
          'GARANSI',
          'TN/NY. INDRA KURNIAWAN',
          '081344556677',
          'Printer',
          'Epson L3210 EcoTank',
          'SN-EPSON-44120',
          'Hasil Print Putus-Putus & Head Buntu',
          JSON.stringify(['Fulldus', 'Unit Saja', 'Kabel']),
          '2026-09-08',
          'Wandi',
          'PROSES GARANSI',
          'Siapkan surat jalan ke Metrodata Bandung.',
          0,
          0,
          0,
          0,
          null,
          'METRODATA ELECTRONICS BDG',
          null,
          null,
          null,
          null,
          `${today} 11:30:00`,
          `${today} 11:30:00`
        ]
      ];

      for (const t of sampleTickets) {
        insertTicket.run(...t);
      }

      const insertSJ = db.prepare(`
        INSERT INTO surat_jalan (id, no_surat_jalan, distributor_vendor, tgl_kirim, ekspedisi, no_resi, catatan, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertSJ.run(
        'sj-1',
        'SJ-BCTRS-260002',
        'PT. ASIA RAYA COM BDG',
        today,
        'Travel Cipaganti / Kirim Langsung',
        'TRV-BDG-9921',
        'Pengiriman unit servis garansi mingguan hari Kamis',
        'Admin Kasir'
      );

      insertSJ.run(
        'sj-2',
        'SJ-BCTRS-260001',
        'AGRES ID JKT',
        '2026-08-25',
        'JNE REG',
        'JNE88471209382',
        'Klaim garansi laptop display HP',
        'Admin Kasir'
      );

      const insertLog = db.prepare(`
        INSERT INTO audit_logs (ticket_id, nomor_layanan, actor, action, keterangan, payload_sebelum, payload_sesudah)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertLog.run(
        'ticket-1',
        'BCTRS26-0001',
        'Wandi',
        'CREATE_TICKET',
        'Wandi membuat tiket servis baru No. BCTRS26-0001',
        null,
        JSON.stringify({ status: 'PROSES SERVICE', nama_barang: 'Asus TUF Gaming FX505' })
      );

      insertLog.run(
        'ticket-6',
        'BCTRS26-0006',
        'Wandi',
        'STATUS_CHANGE',
        'Wandi mengubah status PROSES GARANSI -> SELESAI BELUM DIAMBIL (Diganti baru SN: SN-NEW-ASUS-991244)',
        JSON.stringify({ status: 'PROSES GARANSI', sn_baru: null }),
        JSON.stringify({ status: 'SELESAI BELUM DIAMBIL', sn_baru: 'SN-NEW-ASUS-991244' })
      );
    }
  } catch {
    // Seed error ignored if already exists
  }
}

export const db = getDatabase();
