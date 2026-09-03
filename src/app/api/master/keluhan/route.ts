import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MasterKeluhan } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stmt = db.prepare('SELECT * FROM master_keluhan ORDER BY teks_keluhan ASC');
    const keluhan = stmt.all() as MasterKeluhan[];
    return NextResponse.json({ keluhan });
  } catch (error) {
    console.error('Error fetching keluhan list:', error);
    return NextResponse.json({ error: 'Failed to fetch keluhan list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teks_keluhan = body.teks_keluhan?.trim();

    if (!teks_keluhan) {
      return NextResponse.json({ error: 'Teks keluhan wajib diisi' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT OR IGNORE INTO master_keluhan (teks_keluhan) VALUES (?)');
    const info = stmt.run(teks_keluhan);

    // Fetch existing or newly inserted record
    const getStmt = db.prepare('SELECT * FROM master_keluhan WHERE teks_keluhan = ?');
    const existing = getStmt.get(teks_keluhan) as MasterKeluhan;

    return NextResponse.json({
      success: true,
      keluhan: existing || {
        id: info.lastInsertRowid,
        teks_keluhan
      }
    });
  } catch (error) {
    console.error('Error creating keluhan:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to create keluhan' }, { status: 500 });
  }
}
