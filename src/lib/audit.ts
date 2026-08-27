import { db } from './db';

/**
 * Catat riwayat aktivitas perubahan tiket / sistem ke tabel audit_logs
 */
export function logActivity(
  ticketId: string | null,
  nomorLayanan: string | null,
  actor: string,
  action: string,
  keterangan: string,
  oldData?: Record<string, unknown> | null,
  newData?: Record<string, unknown> | null
) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        ticket_id, nomor_layanan, actor, action, keterangan, payload_sebelum, payload_sesudah
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      ticketId,
      nomorLayanan,
      actor || 'System',
      action,
      keterangan,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
