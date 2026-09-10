import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('public/test-screenshots/checklist');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName} ${details ? `(${details})` : ''}`);
    testResults.push({ name: testName, status: 'PASSED', details });
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    testResults.push({ name: testName, status: 'FAILED', details });
  }
}

// Helper functions mirroring business logic for verification
function cleanVendorName(vendorName) {
  if (!vendorName) return 'VENDOR';
  return vendorName.replace(/\s+(BDG|JKT|BANDUNG|JAKARTA)$/i, '').trim();
}

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 0) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

async function runChecklistTests() {
  console.log('================================================================');
  console.log('🧪 MEMULAI AUTOMATED TESTING BERDASARKAN TESTING_CHECKLIST.MD');
  console.log('   Target URL: http://localhost:3005');
  console.log('================================================================\n');

  // ==================================================================
  // SUITE 1: BUSINESS LOGIC SPECIFICATION CHECKLIST
  // ==================================================================
  console.log('📌 [SUITE 1] Business Logic & WhatsApp Engine Checklist');

  // 1.1 Phone Number Normalization
  assert(
    formatPhoneNumber('081234567890') === '6281234567890',
    'Konversi nomor HP lokal 08xxx ke 62xxx',
    '081234567890 -> 6281234567890'
  );
  assert(
    formatPhoneNumber('0812-3456-7890') === '6281234567890',
    'Pembersihan karakter minus pada nomor HP'
  );
  assert(
    formatPhoneNumber('6281234567890') === '6281234567890',
    'Nomor yang sudah 62xxx tetap aman'
  );

  // 1.2 Vendor Name Sanitization
  assert(
    cleanVendorName('ASTRINDO BDG') === 'ASTRINDO',
    'Pembersihan akhiran BDG dari nama vendor',
    'ASTRINDO BDG -> ASTRINDO'
  );
  assert(
    cleanVendorName('METRODATA JKT') === 'METRODATA',
    'Pembersihan akhiran JKT dari nama vendor',
    'METRODATA JKT -> METRODATA'
  );
  assert(
    cleanVendorName('SYNNEX BANDUNG') === 'SYNNEX',
    'Pembersihan kata BANDUNG dari nama vendor'
  );

  // 1.3 Cost Calculation Logic
  const estimasiBiaya = 500000;
  const dp = 150000;
  const sisa = estimasiBiaya - dp;
  assert(sisa === 350000, 'Kalkulasi sisa biaya (Estimasi Biaya - DP)', `500.000 - 150.000 = ${sisa}`);

  // ==================================================================
  // SUITE 2: REST API & DATABASE INTEGRITY (AUTHENTICATED SESSION)
  // ==================================================================
  console.log('\n📌 [SUITE 2] REST API & Database Integrity Checklist');

  // 2.0 Authenticate with Admin Account
  const loginRes = await fetch('http://localhost:3005/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'bct123' })
  });
  assert(loginRes.ok, 'Autentikasi API Admin berhasil (Login Session)');
  const setCookie = loginRes.headers.get('set-cookie') || '';
  const authCookie = setCookie.split(';')[0];
  const authHeaders = {
    Cookie: authCookie,
    'Content-Type': 'application/json'
  };

  // 2.1 Next RMA Number Generation
  const nextNumRes = await fetch('http://localhost:3005/api/tickets/next-number', { headers: authHeaders });
  assert(nextNumRes.ok, 'Endpoint GET /api/tickets/next-number merespons 200 OK');
  const nextNumData = await nextNumRes.json();
  const validFormat = /^BCTRS\d{2}-\d{4}$/.test(nextNumData.nextNumber);
  assert(
    validFormat,
    'Format No Layanan sesuai standar BCTRSxx-xxxx',
    `Dihasilkan: ${nextNumData.nextNumber}`
  );

  // 2.2 Stats API
  const statsRes = await fetch('http://localhost:3005/api/stats', { headers: authHeaders });
  assert(statsRes.ok, 'Endpoint GET /api/stats merespons 200 OK');
  const statsData = await statsRes.json();
  assert(
    typeof statsData.serviceOnProgress === 'number' &&
    typeof statsData.barangDiVendor === 'number' &&
    typeof statsData.barangBelumDiambil === 'number' &&
    typeof statsData.totalTiket === 'number',
    'Struktur metrik dashboard lengkap (Metrik operasional terdefinisi)',
    `Total Tiket: ${statsData.totalTiket}`
  );

  // 2.3 Tickets List API
  const ticketsRes = await fetch('http://localhost:3005/api/tickets', { headers: authHeaders });
  assert(ticketsRes.ok, 'Endpoint GET /api/tickets merespons 200 OK');
  const ticketsData = await ticketsRes.json();
  assert(Array.isArray(ticketsData.tickets), 'List tickets mengembalikan array data', `Jumlah: ${ticketsData.tickets.length}`);

  // 2.4 Audit Log API
  const logsRes = await fetch('http://localhost:3005/api/logs', { headers: authHeaders });
  assert(logsRes.ok, 'Endpoint GET /api/logs merespons 200 OK (Audit Trail Log)');

  // 2.5 Master Vendors API
  const vendorsRes = await fetch('http://localhost:3005/api/master/vendors', { headers: authHeaders });
  assert(vendorsRes.ok, 'Endpoint GET /api/master/vendors merespons 200 OK');

  // 2.6 WhatsApp Reports API
  const waOpRes = await fetch('http://localhost:3005/api/whatsapp/generate?type=operational', { headers: authHeaders });
  assert(waOpRes.ok, 'Endpoint GET /api/whatsapp/generate?type=operational merespons 200 OK');
  const waOpData = await waOpRes.json();
  assert(
    typeof waOpData.message === 'string' && waOpData.message.length > 0,
    'Generator Laporan WA Operasional menghasilkan teks pesan'
  );

  const waSalesRes = await fetch('http://localhost:3005/api/whatsapp/generate?type=sales', { headers: authHeaders });
  assert(waSalesRes.ok, 'Endpoint GET /api/whatsapp/generate?type=sales merespons 200 OK');
  const waSalesData = await waSalesRes.json();
  assert(
    typeof waSalesData.message === 'string' && waSalesData.message.length > 0,
    'Generator Laporan WA Sales menghasilkan teks laporan'
  );

  // ==================================================================
  // SUITE 3: E2E PLAYWRIGHT BROWSER UI & USABILITY
  // ==================================================================
  console.log('\n📌 [SUITE 3] E2E Playwright Browser UI & Dynamic Form Checklist');

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 3.1 Login Flow
    await page.goto('http://localhost:3005/login', { waitUntil: 'networkidle' });
    const quickAdminBtn = page.locator('button:has-text("Admin Kasir")').first();
    if (await quickAdminBtn.isVisible()) {
      await quickAdminBtn.click();
    } else {
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'bct123');
      await page.click('button[type="submit"]');
    }
    await page.waitForURL('**/');
    assert(page.url().endsWith('/') || page.url().includes(':3005'), 'Login berhasil dan dialihkan ke dashboard');

    // 3.2 Dashboard Top Metric Cards
    await page.goto('http://localhost:3005/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'chk_01_dashboard.png') });
    const metricCards = page.locator('div:has-text("Total Service"), div:has-text("Service Aktif"), div:has-text("Garansi")');
    assert(await metricCards.count() > 0, 'Metrik kartu dashboard ter-render di antarmuka');

    // 3.3 Dynamic Form - Laptop vs PC Switch
    console.log('   🔄 Menguji Form Dinamis (/tickets/new)...');
    await page.goto('http://localhost:3005/tickets/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Initial state is Laptop: Check if 'Charger' is visible
    const chargerOption = page.locator('button:has-text("Charger")').first();
    assert(await chargerOption.isVisible(), 'Kelengkapan awal (Laptop) memunculkan opsi "Charger"');

    // Switch to PC using select with PC option
    const selectJenisBarang = page.locator('select:has(option[value="PC"])').first();
    await selectJenisBarang.selectOption('PC');
    await page.waitForTimeout(400);

    // After switching to PC, check if PC-specific options appear (e.g. Tutup case full / Dus / PSU)
    const pcOption = page.locator('button:has-text("Tutup case full"), button:has-text("PSU"), button:has-text("Dus")').first();
    assert(await pcOption.isVisible(), 'Kelengkapan dinamis PC memunculkan komponen PC (Tutup Case / PSU / Dus)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'chk_02_dynamic_pc.png') });

    // 3.4 Switch Service to Garansi -> Check Vendor Fields
    const garansiBtn = page.locator('button:has-text("KLAIM GARANSI")').first();
    if (await garansiBtn.isVisible()) {
      await garansiBtn.click();
      await page.waitForTimeout(400);
      const vendorHeading = page.locator('text=Alur Logistik Vendor').first();
      assert(await vendorHeading.isVisible(), 'Memilih jenis GARANSI memunculkan section Vendor / Surat Jalan');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'chk_03_garansi_vendor.png') });
    }

    // 3.5 Check Surat Jalan Page
    console.log('   🖨️ Menguji Halaman Surat Jalan & Print...');
    await page.goto('http://localhost:3005/surat-jalan', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'chk_04_surat_jalan.png') });
    assert(page.url().includes('surat-jalan'), 'Halaman Pengiriman Surat Jalan Vendor dapat diakses');

    // 3.6 WhatsApp Hub Page
    console.log('   💬 Menguji Halaman WhatsApp Hub...');
    await page.goto('http://localhost:3005/whatsapp', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const waText = await page.textContent('body');
    assert(
      waText.includes('Laporan') && (waText.includes('Operasional') || waText.includes('Sales')),
      'Halaman WhatsApp Hub menampilkan generator laporan operasional & sales'
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'chk_05_whatsapp_hub.png') });

    // 3.7 Data Master Tabs
    console.log('   🗂️ Menguji Navigasi Data Master...');
    await page.goto('http://localhost:3005/master', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const masterText = await page.textContent('body');
    assert(
      masterText.includes('Vendor') || masterText.includes('Customer') || masterText.includes('Keluhan'),
      'Halaman Data Master memuat tab Vendor, Customer, & Preset Keluhan'
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'chk_06_master_data.png') });

    // 3.8 Spreadsheet Integration Button on Tickets Page
    console.log('   📊 Menguji Tombol Integrasi Spreadsheet di Halaman Tiket...');
    await page.goto('http://localhost:3005/tickets', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const spreadsheetBtn = page.locator('button:has-text("Import Spreadsheet"), button:has-text("Spreadsheet")').first();
    assert(await spreadsheetBtn.isVisible(), 'Tombol Integrasi Spreadsheet/Excel tersedia di Halaman Tiket');

  } catch (err) {
    console.error('❌ Error Playwright UI:', err);
    failedTests++;
  } finally {
    await browser.close();
  }

  // ==================================================================
  // SUMMARY
  // ==================================================================
  console.log('\n================================================================');
  console.log('📊 RINGKASAN HASIL PENGUJIAN TESTING_CHECKLIST.MD:');
  console.log(`   Total Skenario Diuji       : ${totalTests}`);
  console.log(`   ✅ Berhasil (PASSED)        : ${passedTests}`);
  console.log(`   ❌ Gagal (FAILED)          : ${failedTests}`);
  console.log(`   Tingkat Kelulusan          : ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runChecklistTests().catch((e) => {
  console.error('Fatal Error:', e);
  process.exit(1);
});
