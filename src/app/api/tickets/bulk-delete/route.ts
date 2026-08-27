import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, actor } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Pilih minimal 1 tiket untuk dihapus' },
        { status: 400 }
      );
    }

    const activeActor = actor || 'Admin';

    // 1. Fetch details of tickets to be deleted for audit logging
    const placeholders = ids.map(() => '?').join(',');
    const getStmt = db.prepare(`SELECT id, nomor_layanan, nama_barang, nama_customer FROM tickets WHERE id IN (${placeholders})`);
    const ticketsToDelete = getStmt.all(...ids) as { id: string; nomor_layanan: string; nama_barang: string; nama_customer: string }[];

    if (ticketsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'Tiket yang dipilih tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. Perform deletion in SQLite
    const deleteStmt = db.prepare(`DELETE FROM tickets WHERE id IN (${placeholders})`);
    deleteStmt.run(...ids);

    // 3. Record Audit Logs for each deleted ticket
    const deletedNos = ticketsToDelete.map(t => t.nomor_layanan).join(', ');
    for (const t of ticketsToDelete) {
      logActivity(
        t.id,
        t.nomor_layanan,
        activeActor,
        'BULK_DELETE_TICKET',
        `${activeActor} menghapus tiket [${t.nomor_layanan}] - ${t.nama_barang} (Customer: ${t.nama_customer}) via Hapus Massal`
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: ticketsToDelete.length,
      message: `Berhasil menghapus ${ticketsToDelete.length} tiket (${deletedNos})`
    });
  } catch (error) {
    console.error('Error bulk deleting tickets:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Gagal menghapus beberapa tiket' },
      { status: 500 }
    );
  }
}
