import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  formatCustomerReceiptMessage,
  formatCustomerDoneMessage,
  formatOperationalReport,
  formatSalesReport,
  createWhatsAppUrl
} from '@/lib/whatsapp-formatter';
import { SALES_WA_NUMBER } from '@/lib/constants';
import { Ticket } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const ticketId = searchParams.get('ticket_id');
    const dateStr = searchParams.get('date') || undefined;

    if (type === 'receipt' || type === 'done') {
      if (!ticketId) {
        return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
      }

      const stmt = db.prepare('SELECT * FROM tickets WHERE id = ? OR nomor_layanan = ?');
      const raw = stmt.get(ticketId, ticketId) as Record<string, unknown> | undefined;

      if (!raw) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      const ticket: Ticket = {
        ...(raw as unknown as Ticket),
        kelengkapan: typeof raw.kelengkapan === 'string' ? JSON.parse(raw.kelengkapan || '[]') : (raw.kelengkapan || [])
      };

      const message = type === 'receipt'
        ? formatCustomerReceiptMessage(ticket)
        : formatCustomerDoneMessage(ticket);

      const waUrl = createWhatsAppUrl(ticket.no_hp, message);

      return NextResponse.json({
        type,
        ticket,
        message,
        recipientPhone: ticket.no_hp,
        waUrl
      });
    }

    // Fetch all tickets for report generation
    const stmt = db.prepare('SELECT * FROM tickets ORDER BY created_at ASC');
    const rawAll = stmt.all() as Record<string, unknown>[];
    const allTickets: Ticket[] = rawAll.map(t => ({
      ...(t as unknown as Ticket),
      kelengkapan: typeof t.kelengkapan === 'string' ? JSON.parse(t.kelengkapan || '[]') : (t.kelengkapan || [])
    }));

    if (type === 'operational') {
      const message = formatOperationalReport(allTickets, dateStr);
      return NextResponse.json({
        type: 'operational',
        message,
        totalTickets: allTickets.length
      });
    }

    if (type === 'sales') {
      const message = formatSalesReport(allTickets, dateStr);
      const waUrl = createWhatsAppUrl(SALES_WA_NUMBER, message);
      return NextResponse.json({
        type: 'sales',
        message,
        recipientPhone: SALES_WA_NUMBER,
        waUrl
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Error generating WhatsApp text:', error);
    return NextResponse.json({ error: 'Failed to generate WhatsApp text' }, { status: 500 });
  }
}
