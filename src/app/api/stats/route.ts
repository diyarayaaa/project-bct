import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DashboardStats } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Total Service Aktif ('PROSES SERVICE')
    const activeStmt = db.prepare(`SELECT COUNT(*) as count FROM tickets WHERE status = 'PROSES SERVICE'`);
    const totalServiceAktif = (activeStmt.get() as { count: number }).count;

    // 2. Pending Service ('PENDING SERVICE')
    const pendingStmt = db.prepare(`SELECT COUNT(*) as count FROM tickets WHERE status = 'PENDING SERVICE'`);
    const pendingService = (pendingStmt.get() as { count: number }).count;

    // 3. Barang Belum Diambil ('SELESAI BELUM DIAMBIL')
    const readyStmt = db.prepare(`SELECT COUNT(*) as count FROM tickets WHERE status = 'SELESAI BELUM DIAMBIL'`);
    const barangBelumDiambil = (readyStmt.get() as { count: number }).count;

    // 4. Garansi di Vendor ('PROSES GARANSI' / 'ALIH SERVICE' yang punya distributor_vendor)
    const vendorStmt = db.prepare(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE (status = 'PROSES GARANSI' OR status = 'ALIH SERVICE')
    `);
    const garansiDiVendor = (vendorStmt.get() as { count: number }).count;

    // 5. Stok Toko Ready (Customer like STOCK BCT or GHITP and status SELESAI BELUM DIAMBIL or SELESAI & DIAMBIL)
    const stockStmt = db.prepare(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE (UPPER(nama_customer) LIKE '%STOCK BCT%' OR UPPER(nama_customer) LIKE '%GHITP%')
        AND (status = 'SELESAI BELUM DIAMBIL' OR status = 'SELESAI & DIAMBIL')
    `);
    const stokTokoReady = (stockStmt.get() as { count: number }).count;

    // Total Tiket
    const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM tickets`);
    const totalTiket = (totalStmt.get() as { count: number }).count;

    // Selesai Bulan Ini
    const selesaiBulanIniStmt = db.prepare(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE status = 'SELESAI & DIAMBIL'
    `);
    const serviceSelesaiBulanIni = (selesaiBulanIniStmt.get() as { count: number }).count;

    const stats: DashboardStats = {
      totalServiceAktif,
      pendingService,
      barangBelumDiambil,
      garansiDiVendor,
      stokTokoReady,
      totalTiket,
      serviceSelesaiBulanIni
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
