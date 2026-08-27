const http = require('http');

async function request(options, postData = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const payload = postData ? JSON.stringify(postData) : null;
    const headers = { ...options.headers };
    if (cookie) headers['Cookie'] = cookie;
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({ ...options, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runComprehensiveTests() {
  console.log('=== STARTING COMPREHENSIVE AUTOMATED TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} -> ${extra}`);
      failed++;
    }
  }

  const BASE_PORT = 3005;

  try {
    // 1. TEST AUTH: Login with wrong password
    const resAuthFail = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/auth/login', method: 'POST' },
      { username: 'wandi', password: 'wrongpassword' }
    );
    assert('Auth: Reject invalid password', resAuthFail.statusCode === 401, JSON.stringify(resAuthFail.data));

    // 2. TEST AUTH: Login with valid user
    const resAuthOk = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/auth/login', method: 'POST' },
      { username: 'wandi', password: 'bct123' }
    );
    assert('Auth: Login valid user (Wandi)', resAuthOk.statusCode === 200 && resAuthOk.data?.user?.nama_lengkap === 'Wandi', JSON.stringify(resAuthOk.data));
    const setCookie = resAuthOk.headers['set-cookie'] ? resAuthOk.headers['set-cookie'][0] : '';
    const authCookie = setCookie.split(';')[0];

    // 3. TEST AUTH: Check /api/auth/me
    const resMe = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/auth/me', method: 'GET' },
      null,
      authCookie
    );
    assert('Auth: Session persistence (/api/auth/me)', resMe.data?.authenticated === true && resMe.data?.user?.username === 'wandi', JSON.stringify(resMe.data));

    // 4. TEST TICKETS: Next Service Number Generator
    const resNextNum = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/tickets/next-number', method: 'GET' }
    );
    assert('Tickets: Next number generator (e.g. BCTRS26-xxxx)', resNextNum.statusCode === 200 && typeof resNextNum.data?.nextNumber === 'string', JSON.stringify(resNextNum.data));

    // 5. TEST TICKETS: Create Regular SERVICE Ticket
    const newServiceTicket = {
      nomor_layanan: `BCTRS26-TST-${Date.now().toString().slice(-4)}`,
      jenis_layanan: 'SERVICE',
      nama_customer: 'TN/NY. AGUS SETIAWAN',
      no_hp: '081299887766',
      jenis_barang: 'Laptop',
      nama_barang: 'Acer Swift 3 SF314',
      serial_number: 'SN-TEST-ACER-991',
      keluhan: 'Mati Total setelah kena tumpahan kopi',
      kelengkapan: ['Unit', 'Charger', 'Tas'],
      teknisi: 'Wandi',
      status: 'PROSES SERVICE',
      estimasi_biaya: 400000,
      dp: 100000,
      sisa: 300000,
      actor: 'Wandi'
    };

    const resCreateService = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/tickets', method: 'POST' },
      newServiceTicket,
      authCookie
    );
    assert('Tickets: Create Service ticket', (resCreateService.statusCode === 200 || resCreateService.statusCode === 201), JSON.stringify(resCreateService.data));
    const createdTicketId = resCreateService.data?.ticket?.id;

    // 6. TEST TICKETS: Create GARANSI Ticket for STOCK BCT
    const newGaransiTicket = {
      nomor_layanan: `BCTRS26-STK-${Date.now().toString().slice(-4)}`,
      jenis_layanan: 'GARANSI',
      nama_customer: 'STOCK BCT',
      no_hp: '082120081484',
      jenis_barang: 'Laptop',
      nama_barang: 'Asus Vivobook Go 14',
      serial_number: 'SN-STK-OLD-001',
      keluhan: 'Gagal Booting / Masuk BIOS Terus',
      kelengkapan: ['Fulldus', 'Unit', 'Charger'],
      teknisi: 'Wandi',
      status: 'PROSES GARANSI',
      distributor_vendor: 'PT. ASIA RAYA COM BDG',
      estimasi_biaya: 0,
      dp: 0,
      sisa: 0,
      actor: 'Wandi'
    };

    const resCreateGaransi = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/tickets', method: 'POST' },
      newGaransiTicket,
      authCookie
    );
    assert('Tickets: Create Garansi Stock ticket', (resCreateGaransi.statusCode === 200 || resCreateGaransi.statusCode === 201), JSON.stringify(resCreateGaransi.data));
    const stockTicketId = resCreateGaransi.data?.ticket?.id;

    // 7. TEST TICKETS: Update Status with Diganti Baru & SN Baru
    const resUpdateStock = await request(
      { host: 'localhost', port: BASE_PORT, path: `/api/tickets/${stockTicketId}`, method: 'PUT' },
      {
        status: 'SELESAI BELUM DIAMBIL',
        hasil_service_garansi: 'Diganti baru',
        sn_baru: 'SN-STK-NEW-8899',
        actor: 'Wandi'
      },
      authCookie
    );
    assert('Tickets: Update status to Diganti Baru with SN Baru', resUpdateStock.statusCode === 200, JSON.stringify(resUpdateStock.data));

    // 8. TEST SURAT JALAN: Create Surat Jalan with Tickets
    const resCreateSJ = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/surat-jalan', method: 'POST' },
      {
        distributor_vendor: 'PT. ASIA RAYA COM BDG',
        tgl_kirim: new Date().toISOString().split('T')[0],
        ekspedisi: 'Travel Cipaganti',
        no_resi: 'TRV-TEST-1234',
        catatan: 'Unit tes pengiriman garansi',
        created_by: 'Admin Kasir',
        ticket_ids: [createdTicketId, stockTicketId]
      },
      authCookie
    );
    assert('Surat Jalan: Create Surat Jalan batch', (resCreateSJ.statusCode === 200 || resCreateSJ.statusCode === 201) && resCreateSJ.data?.suratJalan?.no_surat_jalan, JSON.stringify(resCreateSJ.data));
    const sjNo = resCreateSJ.data?.suratJalan?.no_surat_jalan;

    // 9. TEST SURAT JALAN: Detail by No Surat Jalan
    const resSJDetail = await request(
      { host: 'localhost', port: BASE_PORT, path: `/api/surat-jalan/${sjNo}`, method: 'GET' }
    );
    assert('Surat Jalan: Fetch detail by No Surat Jalan', resSJDetail.statusCode === 200 && resSJDetail.data?.suratJalan?.tickets?.length === 2, JSON.stringify(resSJDetail.data));

    // 10. TEST WHATSAPP: Operational Report Generation
    const resWaOp = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/whatsapp/generate?type=operational', method: 'GET' }
    );
    assert('WhatsApp: Generate Weekly Operational Report (Kamis)', resWaOp.statusCode === 200 && resWaOp.data?.message?.includes('BARANG KE BANDUNG'), JSON.stringify(resWaOp.data));

    // 11. TEST WHATSAPP: Sales Report Generation with SN Comparison
    const resWaSales = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/whatsapp/generate?type=sales', method: 'GET' }
    );
    assert('WhatsApp: Generate Sales Report for Stock BCT/GHITP', resWaSales.statusCode === 200 && (resWaSales.data?.message?.includes('LAPORAN STATUS BARANG RMA') || resWaSales.data?.message?.includes('STOCK BCT')), JSON.stringify(resWaSales.data));

    // 12. TEST MASTER DATA: Add Master Vendor
    const resAddVendor = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/master/vendors', method: 'POST' },
      {
        nama_vendor: `TEST VENDOR BDG ${Date.now().toString().slice(-4)}`,
        wilayah: 'BDG',
        alamat_lengkap: 'Jl. Naripan No. 99, Bandung',
        kontak_wa: '08129990001'
      }
    );
    assert('Master: Add new vendor', (resAddVendor.statusCode === 200 || resAddVendor.statusCode === 201), JSON.stringify(resAddVendor.data));

    // 13. TEST AUDIT LOGS: Verify audit entries
    const resLogs = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/logs', method: 'GET' }
    );
    assert('Audit Trail: Retrieve activity logs', resLogs.statusCode === 200 && resLogs.data?.logs?.length > 0, JSON.stringify(resLogs.data));

    // 14. TEST BULK DELETE TICKETS
    // Create 2 test tickets for bulk deletion
    const t1 = await request({ host: 'localhost', port: BASE_PORT, path: '/api/tickets', method: 'POST' }, {
      nomor_layanan: `BCTRS26-DEL1-${Date.now().toString().slice(-4)}`,
      jenis_layanan: 'SERVICE',
      nama_customer: 'DEL TEST 1',
      no_hp: '0811111111',
      jenis_barang: 'Laptop',
      nama_barang: 'Test Bulk 1',
      serial_number: 'SN-BULK-1',
      keluhan: 'Tes bulk delete 1',
      teknisi: 'Wandi',
      status: 'PROSES SERVICE'
    }, authCookie);

    const t2 = await request({ host: 'localhost', port: BASE_PORT, path: '/api/tickets', method: 'POST' }, {
      nomor_layanan: `BCTRS26-DEL2-${Date.now().toString().slice(-4)}`,
      jenis_layanan: 'SERVICE',
      nama_customer: 'DEL TEST 2',
      no_hp: '0822222222',
      jenis_barang: 'PC',
      nama_barang: 'Test Bulk 2',
      serial_number: 'SN-BULK-2',
      keluhan: 'Tes bulk delete 2',
      teknisi: 'Wandi',
      status: 'PROSES SERVICE'
    }, authCookie);

    const id1 = t1.data?.ticket?.id;
    const id2 = t2.data?.ticket?.id;

    const resBulkDel = await request(
      { host: 'localhost', port: BASE_PORT, path: '/api/tickets/bulk-delete', method: 'POST' },
      { ids: [id1, id2], actor: 'Wandi' },
      authCookie
    );
    assert('Bulk Delete: Delete multiple selected tickets', resBulkDel.statusCode === 200 && resBulkDel.data?.deletedCount === 2, JSON.stringify(resBulkDel.data));

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runComprehensiveTests();
