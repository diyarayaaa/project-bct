import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { SuratJalan } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export function getNextSuratJalanNumber(): string {
  const currentYear2Digit = new Date().getFullYear().toString().slice(-2);
  const prefix = `SJ-BCTRS-${currentYear2Digit}`;

  const stmt = db.prepare(`
    SELECT no_surat_jalan FROM surat_jalan 
    WHERE no_surat_jalan LIKE ? 
    ORDER BY id DESC
  `);
  const rows = stmt.all(`${prefix}%`) as { no_surat_jalan: string }[];

  let maxNum = 15; // Base offset from sample data
  for (const row of rows) {
    const raw = row.no_surat_jalan.replace(`SJ-BCTRS-${currentYear2Digit}`, '');
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const nextSeq = maxNum + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export async function GET() {
  try {
    const stmt = db.prepare(`
      SELECT 
        sj.*,
        (SELECT COUNT(*) FROM tickets t WHERE t.no_surat_jalan = sj.no_surat_jalan) as ticket_count
      FROM surat_jalan sj
      ORDER BY sj.created_at DESC
    `);
    const suratJalanList = stmt.all() as SuratJalan[];

    return NextResponse.json({ suratJalan: suratJalanList });
  } catch (error) {
    console.error('Error fetching surat jalan:', error);
    return NextResponse.json({ error: 'Failed to fetch surat jalan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = body.id || `sj-${crypto.randomUUID()}`;
    const no_surat_jalan = body.no_surat_jalan?.trim() || getNextSuratJalanNumber();
    const distributor_vendor = body.distributor_vendor?.trim();
    const tgl_kirim = body.tgl_kirim || new Date().toISOString().split('T')[0];
    const ekspedisi = body.ekspedisi?.trim() || null;
    const no_resi = body.no_resi?.trim() || null;
    const catatan = body.catatan?.trim() || null;
    const created_by = body.created_by || 'Admin Kasir';
    const ticket_ids: string[] = Array.isArray(body.ticket_ids) ? body.ticket_ids : [];

    if (!distributor_vendor) {
      return NextResponse.json({ error: 'Distributor/Vendor wajib dipilih' }, { status: 400 });
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const stmt = db.prepare(`
      INSERT INTO surat_jalan (
        id, no_surat_jalan, distributor_vendor, tgl_kirim, ekspedisi, no_resi, catatan, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      no_surat_jalan,
      distributor_vendor,
      tgl_kirim,
      ekspedisi,
      no_resi,
      catatan,
      created_by,
      now
    );

    // Update tickets yang dikirim di surat jalan ini
    if (ticket_ids.length > 0) {
      const updateTicketStmt = db.prepare(`
        UPDATE tickets SET
          no_surat_jalan = ?,
          distributor_vendor = ?,
          tgl_kirim_vendor = ?,
          status = CASE 
            WHEN status = 'PROSES SERVICE' THEN 'ALIH SERVICE' 
            ELSE 'PROSES GARANSI' 
          END,
          updated_at = ?
        WHERE id = ?
      `);

      for (const ticketId of ticket_ids) {
        updateTicketStmt.run(no_surat_jalan, distributor_vendor, tgl_kirim, now, ticketId);

        logActivity(
          ticketId,
          null,
          created_by,
          'SURAT_JALAN_CREATED',
          `${created_by} membuat Surat Jalan [${no_surat_jalan}] ke ${distributor_vendor} (Ekspedisi: ${ekspedisi || '-'})`
        );
      }
    }

    return NextResponse.json({
      success: true,
      suratJalan: {
        id,
        no_surat_jalan,
        distributor_vendor,
        tgl_kirim,
        ticket_count: ticket_ids.length
      }
    });
  } catch (error) {
    console.error('Error creating surat jalan:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to create surat jalan' }, { status: 500 });
  }
}
