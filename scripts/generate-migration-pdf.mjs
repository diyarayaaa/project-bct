import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'public', 'PANDUAN_MIGRASI_SERVER_BCT.pdf');

// Read logo as base64 to ensure it loads in PDF
let logoBase64 = '';
const logoPath = path.join(rootDir, 'public', 'logo.png');
if (fs.existsSync(logoPath)) {
  logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
}

const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Panduan Migrasi Server - Best Computel</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      font-size: 11pt;
      background: #ffffff;
    }

    .header-table {
      width: 100%;
      border-bottom: 3px solid #f97316;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }

    .header-logo {
      width: 65px;
      height: 65px;
      object-fit: contain;
    }

    .header-title {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .header-tag {
      display: inline-block;
      background: #f97316;
      color: white;
      font-size: 9pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 6px;
      vertical-align: middle;
    }

    .header-subtitle {
      font-size: 10pt;
      color: #64748b;
      font-weight: 500;
      margin-top: 2px;
    }

    .doc-badge {
      text-align: right;
      font-size: 8.5pt;
      color: #64748b;
    }

    .doc-badge strong {
      color: #0f172a;
    }

    .section-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 14px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .section-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-num {
      width: 22px;
      height: 22px;
      background: #f97316;
      color: white;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      font-weight: 700;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 700;
      color: #0f172a;
    }

    .section-body {
      padding: 12px 14px;
    }

    .item-list {
      list-style: none;
    }

    .item-list li {
      position: relative;
      padding-left: 18px;
      margin-bottom: 8px;
      font-size: 10pt;
    }

    .item-list li::before {
      content: "•";
      position: absolute;
      left: 4px;
      color: #f97316;
      font-size: 16pt;
      line-height: 1;
      top: -2px;
    }

    .alert-box {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-left: 4px solid #f97316;
      border-radius: 6px;
      padding: 10px 12px;
      margin: 10px 0;
      font-size: 9.5pt;
      color: #9a3412;
    }

    .alert-box strong {
      color: #7c2d12;
    }

    .code-block {
      background: #0f172a;
      color: #f1f5f9;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 6px 0 10px 0;
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .code-inline {
      background: #f1f5f9;
      color: #0f172a;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }

    .step-subcard {
      background: #fafafa;
      border: 1px solid #eee;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }

    .step-subtitle {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin-bottom: 4px;
    }

    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <table class="header-table">
    <tr>
      <td style="width: 75px; vertical-align: middle;">
        ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" alt="Logo" />` : ''}
      </td>
      <td style="vertical-align: middle;">
        <div class="header-title">
          BEST COMPUTEL <span class="header-tag">RMA</span>
        </div>
        <div class="header-subtitle">Panduan Operasional: Migrasi & Pemindahan Server Komputer Pusat</div>
      </td>
      <td class="doc-badge" style="vertical-align: middle;">
        <div>Dokumen: <strong>SOP-IT-01</strong></div>
        <div>Versi: <strong>1.0 (Node 22)</strong></div>
        <div>Tanggal: <strong>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
      </td>
    </tr>
  </table>

  <!-- TAHAPAN 1 -->
  <div class="section-card">
    <div class="section-header">
      <div class="step-num">1</div>
      <div class="section-title">Software yang Wajib Diinstal di Komputer Server Baru</div>
    </div>
    <div class="section-body">
      <ul class="item-list">
        <li>
          <strong>Node.js Versi 22+ (Wajib v22.x LTS)</strong><br />
          Unduh dari situs resmi: <span class="code-inline">https://nodejs.org</span> (pilih versi <strong>v22</strong>).<br />
          <em style="color: #64748b; font-size: 8.5pt;">*Penting: Aplikasi menggunakan database internal (node:sqlite) yang membutuhkan Node.js 22.</em>
        </li>
        <li>
          <strong>Git for Windows</strong><br />
          Unduh dari: <span class="code-inline">https://git-scm.com</span> (instal dengan pilihan default). Digunakan untuk mengunduh kode program dari GitHub.
        </li>
        <li>
          <strong>Web Browser (Google Chrome atau Microsoft Edge)</strong><br />
          Untuk membuka aplikasi, menjalankan panel admin, dan menginstal aplikasi ke desktop.
        </li>
      </ul>
    </div>
  </div>

  <!-- TAHAPAN 2 -->
  <div class="section-card">
    <div class="section-header">
      <div class="step-num">2</div>
      <div class="section-title">File Database yang Wajib Dipindahkan dari Server Lama</div>
    </div>
    <div class="section-body">
      <p style="font-size: 9.5pt; color: #334155; margin-bottom: 8px;">
        Database berisi seluruh riwayat tiket servis pelanggan, data vendor, dan surat jalan tidak diunggah ke GitHub demi keamanan data. Anda <strong>wajib menyalin folder data</strong> dari komputer server lama:
      </p>

      <div class="alert-box">
        <strong>Folder yang wajib dicopy ke Flashdisk / GDrive:</strong><br />
        <span class="code-inline">mybctapps/data/</span> (khususnya file utama: <strong>bct.sqlite</strong>)
      </div>

      <p style="font-size: 8.5pt; color: #64748b;">
        *Pastikan saat meng-copy file ini, aplikasi di komputer lama sudah dimatikan agar database tidak terkunci.
      </p>
    </div>
  </div>

  <!-- TAHAPAN 3 -->
  <div class="section-card">
    <div class="section-header">
      <div class="step-num">3</div>
      <div class="section-title">Tahapan Langkah Pemindahan & Menjalankan Aplikasi (Step-by-Step)</div>
    </div>
    <div class="section-body">

      <!-- Step 3A -->
      <div class="step-subcard">
        <div class="step-subtitle">A. Mengunduh Kode Program di Komputer Baru</div>
        <div style="font-size: 9pt; color: #475569; margin-bottom: 4px;">Buka <strong>PowerShell</strong> atau Command Prompt di komputer baru, lalu jalankan:</div>
        <div class="code-block">git clone https://github.com/diyarayaaa/mybctapps.git
cd mybctapps</div>
      </div>

      <!-- Step 3B -->
      <div class="step-subcard">
        <div class="step-subtitle">B. Memindahkan File Database & Install Dependencies</div>
        <div style="font-size: 9pt; color: #475569; margin-bottom: 4px;">
          1. Copy folder <span class="code-inline">data</span> dari flashdisk ke dalam folder <span class="code-inline">mybctapps/</span> di PC baru.<br />
          2. Jalankan perintah instalasi modul (cukup sekali):
        </div>
        <div class="code-block">npm install</div>
      </div>

      <!-- Step 3C -->
      <div class="step-subcard">
        <div class="step-subtitle">C. Menjalankan Aplikasi Server</div>
        <div style="font-size: 9pt; color: #475569; margin-bottom: 4px;">Pilih salah satu mode di bawah ini:</div>
        <div class="code-block"># Mode Pengembangan / Cepat:
npm run dev

# Mode Operasional Toko (Dianjurkan: Lebih cepat, hemat RAM & stabil):
npm run build
npm run start</div>
      </div>

      <!-- Step 3D -->
      <div class="step-subcard">
        <div class="step-subtitle">D. Mengetahui IP Server & Menghubungkan Komputer Lain</div>
        <div style="font-size: 9pt; color: #475569; margin-bottom: 4px;">
          Ketik <span class="code-inline">ipconfig</span> di PowerShell server, cari <strong>IPv4 Address</strong> (misal: <span class="code-inline">192.168.1.50</span>).<br />
          Di komputer kasir/teknisi lain, buka Chrome/Edge dan ketik alamat:
        </div>
        <div class="code-block">http://&lt;IP-PC-SERVER&gt;:3005   (Contoh: http://192.168.1.50:3005)</div>
        <div style="font-size: 8.5pt; color: #64748b;">
          Di browser komputer kasir/teknisi, klik tombol <strong>"Install App"</strong> di pojok kanan kolom URL browser untuk memasangnya sebagai aplikasi desktop.
        </div>
      </div>

    </div>
  </div>

  <!-- FOOTER -->
  <table style="width: 100%; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">
    <tr>
      <td>Best Computel Service & RMA Management System</td>
      <td style="text-align: right;">SOP Pemindahan Server Komputer Toko • Rahasia Internal</td>
    </tr>
  </table>

</body>
</html>
`;

async function generatePDF() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Loading HTML content...');
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  console.log('Printing to PDF at:', outputPath);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();
  console.log('PDF successfully generated at:', outputPath);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
