import { Ticket } from '@/types';
import { SALES_WA_NUMBER } from './constants';

/**
 * Membersihkan suffix wilayah (BDG / JKT / Lainnya) dari nama vendor
 * Contoh: "PT. ASIA RAYA COM BDG" -> "PT. ASIA RAYA COM"
 */
export function cleanVendorName(vendorName: string): string {
  if (!vendorName) return 'VENDOR';
  return vendorName
    .replace(/\s+(BDG|JKT|BANDUNG|JAKARTA)$/i, '')
    .trim();
}

/**
 * Format nomor HP Indonesia ke format internasional (e.g. 081234 -> 6281234)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 0) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Format tanggal ke format Indonesia DD/MM/YYYY
 */
export function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format datetime ke format Indonesia DD/MM/YYYY HH:mm
 */
export function formatDateTimeIndo(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

/**
 * Template A: Notifikasi Tanda Terima Masuk (Tiket Baru)
 */
export function formatCustomerReceiptMessage(ticket: Ticket): string {
  const kelengkapanStr = Array.isArray(ticket.kelengkapan) && ticket.kelengkapan.length > 0
    ? ticket.kelengkapan.join(', ')
    : 'Tidak ada';

  return `Hallo ${ticket.nama_customer}
Kami telah menerima perangkat Anda untuk proses ${ticket.jenis_layanan} dengan rincian berikut:
━━━━━━━━━━━━━━━
No RMA : ${ticket.nomor_layanan}
Tanggal Masuk : ${formatDateTimeIndo(ticket.tanggal_masuk)}
Jenis Barang : ${ticket.jenis_barang}
Nama Barang : ${ticket.nama_barang}
Serial Number : ${ticket.serial_number}
Keluhan : ${ticket.keluhan}
Kelengkapan : ${kelengkapanStr}
Estimasi Selesai : ${formatDateIndo(ticket.estimasi_selesai)}
━━━━━━━━━━━━━━━
Mohon simpan pesan ini sebagai bukti serah terima perangkat.
Catatan:
• Pengambilan perangkat wajib menunjukkan No RMA.
• Perangkat yang tidak diambil lebih dari 30 hari setelah konfirmasi selesai bukan menjadi tanggung jawab kami atas segala risiko yang terjadi.
• Mohon melakukan pengecekan perangkat saat pengambilan.
Terima kasih
-${ticket.teknisi} Best Computel Service`;
}

/**
 * Template B: Notifikasi Unit Selesai Siap Ambil
 */
export function formatCustomerDoneMessage(ticket: Ticket): string {
  return `Hallo ${ticket.nama_customer}
Saya ${ticket.teknisi} dari Best Computel Service, Ingin menginformasikan bahwa perangkat:
━━━━━━━━━━━━━━━
Nama Perangkat : ${ticket.nama_barang}
Keluhan : ${ticket.keluhan}
━━━━━━━━━━━━━━━
Telah *SELESAI* diperbaiki dan sudah dapat diambil.
Silakan datang sesuai jam operasional toko:
• Senin - Jumat : 09.00 - 17.00
• Sabtu : 09.00 - 15.00
• Minggu dan Tanggal Merah : Libur
Terima kasih.`;
}

/**
 * Pipeline 1: Laporan WA Operasional Mingguan (Hari Kamis)
 * Mengelompokkan:
 * 1. BARANG KE BANDUNG (dikirim hari ini ke BDG)
 * 2. BARANG DI VENDOR BDG (sedang di BDG)
 * 3. BARANG DI VENDOR JKT (sedang di JKT)
 * 4. GARANSIAN BELUM DIPROSES
 */
export function formatOperationalReport(tickets: Ticket[], dateString?: string): string {
  const todayStr = dateString || new Date().toISOString().split('T')[0];
  const dateDisplay = formatDateIndo(todayStr);

  // 1. Barang ke Bandung (dikirim hari ini ke BDG)
  const barangKeBdg = tickets.filter(t => {
    const isVendorBdg = (t.distributor_vendor || '').toUpperCase().includes('BDG');
    const isKirimHariIni = t.tgl_kirim_vendor && t.tgl_kirim_vendor.startsWith(todayStr);
    return isVendorBdg && isKirimHariIni;
  });

  // 2. Barang di Vendor BDG (status PROSES GARANSI / ALIH SERVICE di vendor BDG, belum selesai)
  const barangDiVendorBdg = tickets.filter(t => {
    const isVendorBdg = (t.distributor_vendor || '').toUpperCase().includes('BDG');
    const isProgress = t.status === 'PROSES GARANSI' || t.status === 'ALIH SERVICE';
    const bukanKirimHariIni = !t.tgl_kirim_vendor || !t.tgl_kirim_vendor.startsWith(todayStr);
    return isVendorBdg && isProgress && bukanKirimHariIni;
  });

  // 3. Barang di Vendor JKT (status PROSES GARANSI / ALIH SERVICE di vendor JKT)
  const barangDiVendorJkt = tickets.filter(t => {
    const isVendorJkt = (t.distributor_vendor || '').toUpperCase().includes('JKT');
    const isProgress = t.status === 'PROSES GARANSI' || t.status === 'ALIH SERVICE';
    return isVendorJkt && isProgress;
  });

  // 4. Garansian Belum Diproses (Jenis GARANSI atau ALIH SERVICE tapi belum ada tgl_kirim / no_surat_jalan dan masih berstatus pending/proses awal)
  const garansiBelumDiproses = tickets.filter(t => {
    const isGaransiOrAlih = t.jenis_layanan === 'GARANSI' || t.status === 'ALIH SERVICE' || t.status === 'PROSES GARANSI';
    const belumKirim = !t.tgl_kirim_vendor && !t.no_surat_jalan;
    const belumSelesai = t.status !== 'SELESAI & DIAMBIL' && t.status !== 'SELESAI BELUM DIAMBIL' && t.status !== 'GAGAL SERVICE/GARANSI';
    return isGaransiOrAlih && belumKirim && belumSelesai;
  });

  // Helper untuk grouping by vendor
  function groupByVendor(items: Ticket[]) {
    const map = new Map<string, Ticket[]>();
    for (const item of items) {
      const v = cleanVendorName(item.distributor_vendor || 'LAINNYA');
      if (!map.has(v)) map.set(v, []);
      map.get(v)!.push(item);
    }
    return map;
  }

  let text = `*📋 LAPORAN OPERASIONAL SERVICE & RMA BEST COMPUTEL*\n`;
  text += `*Tanggal:* ${dateDisplay}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 1. BARANG KE BANDUNG
  text += `*📦 BARANG KE BANDUNG (${barangKeBdg.length} UNIT)*\n`;
  if (barangKeBdg.length === 0) {
    text += `- (Tidak ada pengiriman ke Bandung hari ini)\n\n`;
  } else {
    const grouped = groupByVendor(barangKeBdg);
    grouped.forEach((vTickets, vName) => {
      text += `*${vName}*\n`;
      vTickets.forEach((t, idx) => {
        text += `${idx + 1}. [${t.nomor_layanan}] ${t.nama_barang} (SN: ${t.serial_number}) - Keluhan: ${t.keluhan} (${t.nama_customer})\n`;
      });
    });
    text += `\n`;
  }

  // 2. BARANG DI VENDOR BDG
  text += `*🏢 BARANG DI VENDOR BANDUNG (${barangDiVendorBdg.length} UNIT)*\n`;
  if (barangDiVendorBdg.length === 0) {
    text += `- (Tidak ada unit di vendor Bandung)\n\n`;
  } else {
    const grouped = groupByVendor(barangDiVendorBdg);
    grouped.forEach((vTickets, vName) => {
      text += `*${vName}*\n`;
      vTickets.forEach((t, idx) => {
        const kirim = formatDateIndo(t.tgl_kirim_vendor);
        text += `${idx + 1}. [${t.nomor_layanan}] ${t.nama_barang} (Kirim: ${kirim}) - ${t.keluhan} [${t.nama_customer}]\n`;
      });
    });
    text += `\n`;
  }

  // 3. BARANG DI VENDOR JKT
  text += `*🏢 BARANG DI VENDOR JAKARTA (${barangDiVendorJkt.length} UNIT)*\n`;
  if (barangDiVendorJkt.length === 0) {
    text += `- (Tidak ada unit di vendor Jakarta)\n\n`;
  } else {
    const grouped = groupByVendor(barangDiVendorJkt);
    grouped.forEach((vTickets, vName) => {
      text += `*${vName}*\n`;
      vTickets.forEach((t, idx) => {
        const kirim = formatDateIndo(t.tgl_kirim_vendor);
        text += `${idx + 1}. [${t.nomor_layanan}] ${t.nama_barang} (Kirim: ${kirim}) - ${t.keluhan} [${t.nama_customer}]\n`;
      });
    });
    text += `\n`;
  }

  // 4. GARANSIAN BELUM DIPROSES
  text += `*⏳ GARANSIAN BELUM DIPROSES / BELUM DIKIRIM (${garansiBelumDiproses.length} UNIT)*\n`;
  if (garansiBelumDiproses.length === 0) {
    text += `- (Semua unit garansi telah terproses/terkirim)\n\n`;
  } else {
    garansiBelumDiproses.forEach((t, idx) => {
      text += `${idx + 1}. [${t.nomor_layanan}] ${t.nama_barang} (Masuk: ${formatDateIndo(t.tanggal_masuk)}) - ${t.keluhan} [${t.nama_customer}] (Teknisi: ${t.teknisi})\n`;
    });
    text += `\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Best Computel Operasional & Logistics*`;

  return text;
}

/**
 * Pipeline 2: Laporan WA Sales (Target: 0821-2008-1484)
 * Filter ketat: Customer = 'STOCK BCT' atau 'GHITP'
 * Membandingkan SN Lama vs SN Baru jika 'Diganti baru'
 */
export function formatSalesReport(tickets: Ticket[], dateString?: string): string {
  const dateDisplay = formatDateIndo(dateString || new Date().toISOString().split('T')[0]);

  // Filter ketat stok internal
  const stockTickets = tickets.filter(t => {
    const upper = (t.nama_customer || '').toUpperCase();
    return upper.includes('STOCK BCT') || upper.includes('GHITP');
  });

  // 1. Garansian Selesai (Siap Jual / Selesai)
  const selesai = stockTickets.filter(t => 
    t.status === 'SELESAI BELUM DIAMBIL' || t.status === 'SELESAI & DIAMBIL'
  );

  // 2. Di Vendor BDG
  const diVendorBdg = stockTickets.filter(t => 
    (t.status === 'PROSES GARANSI' || t.status === 'ALIH SERVICE') &&
    (t.distributor_vendor || '').toUpperCase().includes('BDG')
  );

  // 3. Di Vendor JKT
  const diVendorJkt = stockTickets.filter(t => 
    (t.status === 'PROSES GARANSI' || t.status === 'ALIH SERVICE') &&
    (t.distributor_vendor || '').toUpperCase().includes('JKT')
  );

  // 4. Belum Diproses
  const belumDiproses = stockTickets.filter(t => 
    (t.jenis_layanan === 'GARANSI' || t.status === 'PROSES GARANSI') &&
    !t.tgl_kirim_vendor &&
    t.status !== 'SELESAI BELUM DIAMBIL' &&
    t.status !== 'SELESAI & DIAMBIL' &&
    t.status !== 'GAGAL SERVICE/GARANSI'
  );

  let text = `*💼 REKAP RMA STOK TOKO (STOCK BCT / GHITP)*\n`;
  text += `*Kepada:* Tim Sales (${SALES_WA_NUMBER})\n`;
  text += `*Tanggal:* ${dateDisplay}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 1. GARANSIAN SELESAI
  text += `*✅ 1. GARANSIAN SELESAI / SIAP JUAL (${selesai.length} UNIT)*\n`;
  if (selesai.length === 0) {
    text += `- (Belum ada unit stok baru yang selesai)\n\n`;
  } else {
    selesai.forEach((t, idx) => {
      const customerTag = t.nama_customer.toUpperCase().includes('GHITP') ? '[GHITP]' : '[STOCK BCT]';
      const hasil = t.hasil_service_garansi === 'Diganti baru' ? '🔄 GANTI UNIT BARU' : '🔧 DISERVICE';
      text += `${idx + 1}. ${customerTag} *${t.nama_barang}*\n`;
      text += `   • No RMA: ${t.nomor_layanan}\n`;
      text += `   • Hasil: ${hasil}\n`;
      if (t.hasil_service_garansi === 'Diganti baru' && t.sn_baru) {
        text += `   • SN Lama: ~${t.serial_number}~\n`;
        text += `   • SN Baru: *${t.sn_baru}* ✨\n`;
      } else {
        text += `   • SN: ${t.serial_number}\n`;
      }
      text += `   • Tanggal Datang: ${formatDateIndo(t.tgl_datang_vendor || t.updated_at)}\n\n`;
    });
  }

  // 2. DI VENDOR BDG
  text += `*🏢 2. GARANSIAN DI VENDOR BANDUNG (${diVendorBdg.length} UNIT)*\n`;
  if (diVendorBdg.length === 0) {
    text += `- (Kosong)\n\n`;
  } else {
    diVendorBdg.forEach((t, idx) => {
      const vClean = cleanVendorName(t.distributor_vendor || '');
      text += `${idx + 1}. [${t.nama_customer}] *${t.nama_barang}* (SN: ${t.serial_number})\n`;
      text += `   • Vendor: ${vClean}\n`;
      text += `   • Tgl Kirim: ${formatDateIndo(t.tgl_kirim_vendor)}\n`;
      text += `   • Keluhan: ${t.keluhan}\n\n`;
    });
  }

  // 3. DI VENDOR JKT
  text += `*🏢 3. GARANSIAN DI VENDOR JAKARTA (${diVendorJkt.length} UNIT)*\n`;
  if (diVendorJkt.length === 0) {
    text += `- (Kosong)\n\n`;
  } else {
    diVendorJkt.forEach((t, idx) => {
      const vClean = cleanVendorName(t.distributor_vendor || '');
      text += `${idx + 1}. [${t.nama_customer}] *${t.nama_barang}* (SN: ${t.serial_number})\n`;
      text += `   • Vendor: ${vClean}\n`;
      text += `   • Tgl Kirim: ${formatDateIndo(t.tgl_kirim_vendor)}\n`;
      text += `   • Keluhan: ${t.keluhan}\n\n`;
    });
  }

  // 4. BELUM DIPROSES
  text += `*⏳ 4. GARANSIAN BELUM DIPROSES (${belumDiproses.length} UNIT)*\n`;
  if (belumDiproses.length === 0) {
    text += `- (Semua stok garansi telah diproses)\n\n`;
  } else {
    belumDiproses.forEach((t, idx) => {
      text += `${idx + 1}. [${t.nama_customer}] *${t.nama_barang}* (SN: ${t.serial_number}) - ${t.keluhan}\n`;
    });
    text += `\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Best Computel RMA & Stock Division*`;

  return text;
}

/**
 * Buat link langsung WhatsApp Web / App
 */
export function createWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}
