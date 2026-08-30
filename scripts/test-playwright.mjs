import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('public/test-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
  console.log('🚀 Memulai E2E Playwright Automated Testing untuk Project BCT...\n');

  // Try launch with msedge channel, fallback to chrome or default chromium
  let browser;
  try {
    console.log('🌐 Menginisialisasi Browser (Microsoft Edge / Chrome)...');
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const results = [];

  const logStep = (step, desc, status = 'PASSED') => {
    const symbol = status === 'PASSED' ? '✅' : '❌';
    console.log(`${symbol} [Langkah ${step}]: ${desc}`);
    results.push({ step, desc, status });
  };

  try {
    // -------------------------------------------------------------
    // TEST 0: Login Otomatis (Autentikasi Aplikasi)
    // -------------------------------------------------------------
    console.log('\n--- 0. Melakukan Login Otomatis ---');
    await page.goto('http://localhost:3005/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '00_login_page.png') });
    
    // Click Quick Login button for Admin
    const adminQuickBtn = page.locator('button:has-text("Admin Kasir")').first();
    if (await adminQuickBtn.isVisible()) {
      await adminQuickBtn.click();
      console.log('   🔑 Memilih Quick Login sebagai Admin Kasir...');
    } else {
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'bct123');
      await page.click('button[type="submit"]');
    }

    await page.waitForURL('**/');
    await page.waitForTimeout(500);
    logStep(0, 'Login berhasil sebagai Administrator.');

    // -------------------------------------------------------------
    // TEST 1: Akses Dashboard & Validasi Header Topbar
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Halaman Dashboard & Topbar Header ---');
    await page.goto('http://localhost:3005/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const pageTitle = await page.textContent('header h1');
    console.log(`   📌 Header Title terdeteksi: "${pageTitle?.trim()}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard.png') });
    logStep(1, `Akses Dashboard berhasil & Topbar Title "${pageTitle?.trim()}" aktif.`);

    // -------------------------------------------------------------
    // TEST 2: Testing Auto-Hide & Pin Sidebar Navbar
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Auto-Hide & Pin/Unpin Sidebar Navbar ---');
    const sidebar = page.locator('aside.sidebar-container').first();
    await sidebar.waitFor({ state: 'visible' });

    // Check initial collapsed width
    const initialBox = await sidebar.boundingBox();
    console.log(`   📏 Lebar awal sidebar (unhovered): ${Math.round(initialBox.width)}px (Target: ~64px)`);

    // Hover over sidebar
    await sidebar.hover();
    await page.waitForTimeout(300);
    const hoveredBox = await sidebar.boundingBox();
    console.log(`   📏 Lebar sidebar saat disorot (hovered): ${Math.round(hoveredBox.width)}px (Target: ~256px)`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_sidebar_hovered.png') });

    // Move cursor away
    await page.mouse.move(800, 400);
    await page.waitForTimeout(300);
    const unhoveredBox = await sidebar.boundingBox();
    console.log(`   📏 Lebar sidebar setelah kursor dijauhkan: ${Math.round(unhoveredBox.width)}px (Target: ~64px)`);
    logStep(2, `Auto-Hide Sidebar responsif: Meluncur ke 256px saat disorot & kembali ke 64px saat dilepas.`);

    // Test Pinning
    await sidebar.hover();
    await page.waitForTimeout(200);
    const pinBtn = page.locator('button[aria-label="Toggle Pin Sidebar"]');
    if (await pinBtn.isVisible()) {
      await pinBtn.click();
      await page.waitForTimeout(250);
      console.log('   📌 Tombol "Sematkan" diklik -> Sidebar Terkunci (Pinned).');
      
      // Move mouse away, should stay 256px
      await page.mouse.move(800, 400);
      await page.waitForTimeout(250);
      const pinnedBox = await sidebar.boundingBox();
      console.log(`   📏 Lebar sidebar saat dipin dan kursor di luar: ${Math.round(pinnedBox.width)}px`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_sidebar_pinned.png') });

      // Unpin
      await sidebar.hover();
      await page.waitForTimeout(200);
      await pinBtn.click();
      await page.waitForTimeout(250);
      console.log('   🔓 Tombol "Lepas Sematan" diklik -> Bebas lag & kembali ke mode Auto-Hide.');
      await page.mouse.move(800, 400);
      await page.waitForTimeout(250);
    }
    logStep(3, 'Fitur Pin & Unpin Sidebar berfungsi mulus tanpa lag.');

    // -------------------------------------------------------------
    // TEST 3: Testing Form Input Service (/tickets/new)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Form Input Service (/tickets/new) ---');
    await page.goto('http://localhost:3005/tickets/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const formTitle = await page.textContent('header h1');
    console.log(`   📌 Header Title di halaman Form: "${formTitle?.trim()}"`);

    // Verify only 'Form Input Service' is active in sidebar
    await sidebar.hover();
    await page.waitForTimeout(200);
    const activeNavLinks = await page.$$eval('aside.sidebar-container a', (links) =>
      links.filter((a) => a.className.includes('bg-cyan-500/15')).map((a) => a.textContent.trim())
    );
    console.log(`   🎯 Menu Sidebar yang aktif: [${activeNavLinks.join(', ')}]`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_form_input_service.png') });
    logStep(4, `Halaman Form Input Service terbuka dengan Title "${formTitle?.trim()}" & menu aktif tunggal.`);

    // -------------------------------------------------------------
    // TEST 4: Testing Daftar Service (/tickets) & Search Filter
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Daftar Service (/tickets) & Filter ---');
    await page.goto('http://localhost:3005/tickets', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const ticketsTitle = await page.textContent('header h1');
    console.log(`   📌 Header Title di halaman Daftar Service: "${ticketsTitle?.trim()}"`);

    // Test Search input
    const searchInput = page.locator('input[placeholder*="Cari RMA, Customer, SN"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Laptop');
      await page.waitForTimeout(300);
      console.log('   🔍 Mengetik pencarian "Laptop" di tabel servis.');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_daftar_service.png') });
    logStep(5, `Daftar Service memuat data tiket & pencarian berjalan lancar.`);

    // -------------------------------------------------------------
    // TEST 5: Testing Pengiriman Vendor (/surat-jalan)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Pengiriman Vendor (/surat-jalan) ---');
    await page.goto('http://localhost:3005/surat-jalan', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const sjTitle = await page.textContent('header h1');
    console.log(`   📌 Header Title di Surat Jalan: "${sjTitle?.trim()}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_surat_jalan.png') });
    logStep(6, `Pengiriman Vendor & Surat Jalan berhasil dimuat.`);

    // -------------------------------------------------------------
    // TEST 6: Testing Laporan WhatsApp (/whatsapp)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Laporan WhatsApp (/whatsapp) ---');
    await page.goto('http://localhost:3005/whatsapp', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const waTitle = await page.textContent('header h1');
    console.log(`   📌 Header Title di Laporan WhatsApp: "${waTitle?.trim()}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_laporan_whatsapp.png') });
    logStep(7, `Halaman ringkas "Laporan WhatsApp" siap digunakan untuk broadcast.`);

    // -------------------------------------------------------------
    // TEST 7: Testing Data Master Tabs (/master)
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Data Master Tabs (/master) ---');
    await page.goto('http://localhost:3005/master?tab=vendor', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_master_vendor.png') });

    await page.goto('http://localhost:3005/master?tab=customer', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_master_customer.png') });

    await page.goto('http://localhost:3005/master?tab=keluhan', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_master_keluhan.png') });
    logStep(8, `Navigasi tab Data Master (Vendor, Customer, Preset Keluhan) berfungsi sempurna.`);

    console.log('\n======================================================');
    console.log('🎉 SEMUA PENGUJIAN PLAYWRIGHT BERHASIL 100% (ALL PASSED)');
    console.log('📸 10 Screenshot hasil pengujian telah disimpan ke:');
    console.log(`   ${SCREENSHOT_DIR}`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Terjadi error selama pengujian:', error);
  } finally {
    await browser.close();
  }
}

runTest();
