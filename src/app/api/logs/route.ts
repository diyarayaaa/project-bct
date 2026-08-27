import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuditLog } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actor = searchParams.get('actor');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: unknown[] = [];

    if (actor && actor !== 'ALL') {
      query += ' AND actor = ?';
      params.push(actor);
    }

    if (search) {
      query += ' AND (keterangan LIKE ? OR nomor_layanan LIKE ? OR action LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const rawLogs = stmt.all(...params) as Record<string, unknown>[];

    const logs: AuditLog[] = rawLogs.map(l => ({
      ...(l as unknown as AuditLog),
      payload_sebelum: typeof l.payload_sebelum === 'string' ? JSON.parse(l.payload_sebelum) : l.payload_sebelum,
      payload_sesudah: typeof l.payload_sesudah === 'string' ? JSON.parse(l.payload_sesudah) : l.payload_sesudah
    }));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
