import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function getNextServiceNumber(): string {
  const currentYear2Digit = new Date().getFullYear().toString().slice(-2);
  const prefix = `BCTRS${currentYear2Digit}-`;

  const stmt = db.prepare(`
    SELECT nomor_layanan FROM tickets 
    WHERE nomor_layanan LIKE ? 
    ORDER BY id DESC
  `);
  const rows = stmt.all(`${prefix}%`) as { nomor_layanan: string }[];

  let maxNum = 0; // Mulai dari 0 sehingga tiket pertama adalah BCTRS26-0001
  for (const row of rows) {
    const parts = row.nomor_layanan.split('-');
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextSeq = maxNum + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export async function GET() {
  try {
    const nextNumber = getNextServiceNumber();
    return NextResponse.json({ nextNumber });
  } catch (error) {
    console.error('Error generating next service number:', error);
    return NextResponse.json({ error: 'Failed to generate next service number' }, { status: 500 });
  }
}
