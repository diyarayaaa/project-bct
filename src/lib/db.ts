import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

function getDbPath(): string {
  // Vercel filesystem is read-only except /tmp — use /tmp on Vercel
  const isVercel = !!process.env.VERCEL;
  if (isVercel) {
    // /tmp is writable on Vercel lambda
    try {
      fs.mkdirSync('/tmp/data', { recursive: true });
    } catch {}
    return path.join('/tmp', 'bct.sqlite');
  }
  const dbDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  } catch {}
  return path.join(dbDir, 'bct.sqlite');
}

const dbPath = getDbPath();

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
    try {
      dbInstance = new DatabaseSync(dbPath);
    } catch (e) {
      console.error('[db] DatabaseSync failed — is Node >=22? path:', dbPath, e);
      throw new Error('Database tidak tersedia di environment ini. Pastikan Node 22+');
    }
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

    // Performance Indexes for 5,000+ records
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
      CREATE INDEX IF NOT EXISTS idx_tickets_teknisi ON tickets (teknisi);
      CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets (nama_customer);
      CREATE INDEX IF NOT EXISTS idx_tickets_surat_jalan ON tickets (no_surat_jalan);
      CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_ticket_id ON audit_logs (ticket_id);
      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at DESC);
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

    // Seed Master Vendors
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
    }

    // Seed Master Keluhan
    const insertKeluhan = db.prepare(`
      INSERT OR IGNORE INTO master_keluhan (teks_keluhan)
      VALUES (?)
    `);

    const keluhanList = [
      'Mati Total (No Power)',
      'Mati Total / Tidak Bisa Dicas',
      'Nyala Mati / Restart Sendiri / Suka Mati Mendadak',
      'Mati Setelah Lama Tidak Digunakan',
      'Kena Tumpahan Cairan / Korosi / Serangga',
      'Konslet / Bau Hangus / Keluar Asap',
      'Komponen Mesin Terbakar / Elko Pecah',
      'Pin Processor Bengkok / Socket Rusak',
      'Slot RAM Tidak Berfungsi / Error',
      'Settingan BIOS Reset / Baterai CMOS Habis',
      'Pas Booting Langsung Mati',
      'Klaim Garansi Servis Mesin',
      'No Display / Layar Blank Gelap',
      'Layar Pecah / Retak (Ganti LCD)',
      'Layar Bergaris / Layar Kedip',
      'Layar Vignette / Bintik / White Spot',
      'Display Intermiten / Kadang Nyala Kadang Mati',
      'Tampilan Artefak / Glitch Grafis',
      'Cek Display & Benchmark VGA',
      'Klaim Garansi Layar / LCD',
      'SSD / HDD Tidak Terdeteksi (No Disk Detected)',
      'SSD / HDD Rusak / Bad Sector / Health 0%',
      'SSD / HDD Health Turun / Sering Freeze',
      'Storage Corrupt / Tidak Bisa Dipartisi',
      'Tidak Bisa Format / Gagal Resize Partisi',
      'Kapasitas Terbaca 0 MB / Storage RAW',
      'Drive / Partisi Penuh (Cleanup Storage)',
      'Instal Ulang Windows (Standar + Aplikasi)',
      'Instal Windows 10 (Aktivasi + Software)',
      'Instal Windows 11 (Aktivasi + Software)',
      'Instal Microsoft Office & Software Tambahan',
      'Update OS / Perbaikan Gagal Windows Update',
      'BSOD (Blue Screen of Death)',
      'Gagal Booting / Masuk BIOS Terus / No Bootable Device',
      'Stuck di Automatic Repair / Bootloop',
      'Sistem Lambat / Lemot / Sering Not Responding',
      'Unlock BitLocker / Reset Password Windows',
      'Cek & Scan Virus / Malware',
      'Keyboard Error / Tombol Tidak Berfungsi / Mengetik Sendiri',
      'Ganti Keyboard Baru',
      'Touchpad / Trackpad Mati / Tidak Responsif',
      'Tombol Power Tidak Berfungsi',
      'Baterai Drop / Tidak Tahan Lama',
      'Baterai Not Charging / Dicas Tidak Nambah',
      'Ganti Baterai Baru',
      'Adaptor / Charger Lemah / Rusak',
      'Overheat / Suhu Panas & Mati Sendiri',
      'Repasta Processor & Cleaning Debu Total',
      'Kipas / Fan Berisik / Bunyi Kasar',
      'Kipas / Fan Mati / Macet (Fan Error)',
      'Speaker Mati Total / Suara Hilang',
      'Speaker Pecah / Sembrang / Noise',
      'Port Audio Jack 3.5mm Tidak Berfungsi',
      'Mikrofon / Webcam Tidak Berfungsi',
      'Wi-Fi Tidak Terdeteksi / Suka Putus (Luplep)',
      'Port LAN (Ethernet) Tidak Berfungsi / Lampu Indikator Mati',
      'Port USB Rusak / Tidak Mendeteksi Perangkat',
      'Port HDMI / Type-C Display Tidak Berfungsi',
      'Upgrade SSD (Pemasangan + Kloning / OS)',
      'Upgrade RAM / Tambah Kapasitas Memori',
      'Rakit PC Baru + Cable Management + Instal OS',
      'Ganti Power Supply (PSU)',
      'Ganti Casing PC + Manajemen Fan',
      'General Check-up Hardware & Performa',
      'General Check-up Software & Sistem'
    ];

    for (const k of keluhanList) {
      insertKeluhan.run(k);
    }
  } catch (err) {
    console.error('Seed error ignored:', err);
  }
}

export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const real = getDatabase() as unknown as Record<string | symbol, unknown>;
    const val = real[prop];
    return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(real) : val;
  },
}) as DatabaseSync;
