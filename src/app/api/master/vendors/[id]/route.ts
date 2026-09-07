import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MasterVendor } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = parseInt(id, 10);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: 'ID vendor tidak valid' }, { status: 400 });
    }

    const stmt = db.prepare('SELECT * FROM master_vendors WHERE id = ?');
    const vendor = stmt.get(vendorId) as MasterVendor | undefined;

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = parseInt(id, 10);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: 'ID vendor tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const nama_vendor = body.nama_vendor?.trim();
    const wilayah = body.wilayah?.trim() || 'BDG';
    const alamat_lengkap = body.alamat_lengkap?.trim() || null;
    const kontak_wa = body.kontak_wa?.trim() || null;

    if (!nama_vendor) {
      return NextResponse.json({ error: 'Nama vendor wajib diisi' }, { status: 400 });
    }

    // Check if another vendor already uses this name
    const checkStmt = db.prepare('SELECT id FROM master_vendors WHERE nama_vendor = ? AND id != ?');
    const existing = checkStmt.get(nama_vendor, vendorId);
    if (existing) {
      return NextResponse.json({ error: 'Nama vendor sudah digunakan oleh vendor lain' }, { status: 400 });
    }

    const updateStmt = db.prepare(`
      UPDATE master_vendors 
      SET nama_vendor = ?, wilayah = ?, alamat_lengkap = ?, kontak_wa = ?
      WHERE id = ?
    `);

    const result = updateStmt.run(nama_vendor, wilayah, alamat_lengkap, kontak_wa, vendorId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Vendor tidak ditemukan atau tidak ada perubahan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendorId,
        nama_vendor,
        wilayah,
        alamat_lengkap,
        kontak_wa
      }
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to update vendor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = parseInt(id, 10);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: 'ID vendor tidak valid' }, { status: 400 });
    }

    const deleteStmt = db.prepare('DELETE FROM master_vendors WHERE id = ?');
    const result = deleteStmt.run(vendorId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Vendor tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to delete vendor' }, { status: 500 });
  }
}
