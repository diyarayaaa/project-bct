import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MasterVendor } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stmt = db.prepare('SELECT * FROM master_vendors WHERE is_active = 1 ORDER BY nama_vendor ASC');
    const vendors = stmt.all() as MasterVendor[];
    return NextResponse.json({ vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nama_vendor = body.nama_vendor?.trim();
    const wilayah = body.wilayah?.trim() || 'BDG';
    const alamat_lengkap = body.alamat_lengkap?.trim() || null;
    const kontak_wa = body.kontak_wa?.trim() || null;

    if (!nama_vendor) {
      return NextResponse.json({ error: 'Nama vendor wajib diisi' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO master_vendors (nama_vendor, wilayah, alamat_lengkap, kontak_wa, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);

    const info = stmt.run(nama_vendor, wilayah, alamat_lengkap, kontak_wa);

    return NextResponse.json({
      success: true,
      vendor: {
        id: info.lastInsertRowid,
        nama_vendor,
        wilayah,
        alamat_lengkap,
        kontak_wa
      }
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to create vendor' }, { status: 500 });
  }
}
