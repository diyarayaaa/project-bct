import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SuratJalan, Ticket, MasterVendor } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Search by ID or no_surat_jalan
    const sjStmt = db.prepare('SELECT * FROM surat_jalan WHERE id = ? OR no_surat_jalan = ?');
    const sj = sjStmt.get(id, id) as SuratJalan | undefined;

    if (!sj) {
      return NextResponse.json({ error: 'Surat Jalan tidak ditemukan' }, { status: 404 });
    }

    // Get all tickets with this no_surat_jalan
    const ticketsStmt = db.prepare('SELECT * FROM tickets WHERE no_surat_jalan = ? ORDER BY created_at ASC');
    const rawTickets = ticketsStmt.all(sj.no_surat_jalan) as Record<string, unknown>[];

    const tickets: Ticket[] = rawTickets.map(t => ({
      ...(t as unknown as Ticket),
      kelengkapan: typeof t.kelengkapan === 'string' ? JSON.parse(t.kelengkapan || '[]') : (t.kelengkapan || [])
    }));

    // Get Vendor Details
    const vendorStmt = db.prepare('SELECT * FROM master_vendors WHERE nama_vendor = ?');
    const vendor = vendorStmt.get(sj.distributor_vendor) as MasterVendor | undefined;

    return NextResponse.json({
      suratJalan: {
        ...sj,
        tickets,
        ticket_count: tickets.length
      },
      vendor
    });
  } catch (error) {
    console.error('Error fetching surat jalan detail:', error);
    return NextResponse.json({ error: 'Failed to fetch surat jalan' }, { status: 500 });
  }
}
