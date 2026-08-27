import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { getNextServiceNumber } from './next-number/route';
import { Ticket } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'all';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const teknisi = searchParams.get('teknisi');
    const jenisLayanan = searchParams.get('jenis_layanan');

    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params: unknown[] = [];

    // Filter berdasarkan tab
    if (tab === 'on_progress') {
      query += " AND status = 'PROSES SERVICE'";
    } else if (tab === 'waiting_vendor') {
      query += " AND (status = 'PROSES GARANSI' OR status = 'ALIH SERVICE')";
    } else if (tab === 'ready_pickup') {
      query += " AND status = 'SELESAI BELUM DIAMBIL'";
    } else if (tab === 'internal_stock') {
      query += " AND (UPPER(nama_customer) LIKE '%STOCK BCT%' OR UPPER(nama_customer) LIKE '%GHITP%')";
    }

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (teknisi && teknisi !== 'ALL') {
      query += ' AND teknisi = ?';
      params.push(teknisi);
    }

    if (jenisLayanan && jenisLayanan !== 'ALL') {
      query += ' AND jenis_layanan = ?';
      params.push(jenisLayanan);
    }

    if (search) {
      query += ` AND (
        nomor_layanan LIKE ? OR 
        nama_customer LIKE ? OR 
        nama_barang LIKE ? OR 
        serial_number LIKE ? OR 
        keluhan LIKE ? OR 
        distributor_vendor LIKE ? OR
        no_surat_jalan LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      for (let i = 0; i < 7; i++) {
        params.push(searchPattern);
      }
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rawTickets = stmt.all(...params) as Record<string, unknown>[];

    const tickets: Ticket[] = rawTickets.map((t) => ({
      ...(t as unknown as Ticket),
      kelengkapan: typeof t.kelengkapan === 'string' ? JSON.parse(t.kelengkapan || '[]') : (t.kelengkapan || [])
    }));

    return NextResponse.json({ tickets, total: tickets.length });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = body.id || `ticket-${crypto.randomUUID()}`;
    const nomor_layanan = body.nomor_layanan?.trim() || getNextServiceNumber();
    const jenis_layanan = body.jenis_layanan || 'SERVICE';

    // Format nama customer: prefix TN/NY. jika belum ada dan bukan akun stok internal
    let nama_customer = body.nama_customer?.trim() || '';
    const upperCust = nama_customer.toUpperCase();
    if (
      !upperCust.startsWith('TN/NY.') &&
      !upperCust.startsWith('TN/NY ') &&
      !upperCust.startsWith('TN.') &&
      !upperCust.startsWith('NY.') &&
      !upperCust.includes('STOCK BCT') &&
      !upperCust.includes('GHITP') &&
      nama_customer.length > 0
    ) {
      nama_customer = `TN/NY. ${nama_customer.toUpperCase()}`;
    }

    const no_hp = body.no_hp?.trim() || '';
    const jenis_barang = body.jenis_barang || 'Laptop';
    const nama_barang = body.nama_barang?.trim() || '';
    const serial_number = body.serial_number?.trim() || '';
    const keluhan = body.keluhan?.trim() || '';
    const kelengkapan = JSON.stringify(Array.isArray(body.kelengkapan) ? body.kelengkapan : []);
    const estimasi_selesai = body.estimasi_selesai || null;
    const teknisi = body.teknisi || 'Wandi';
    const status = body.status || (jenis_layanan === 'GARANSI' ? 'PROSES GARANSI' : 'PROSES SERVICE');
    const catatan = body.catatan?.trim() || null;

    const estimasi_biaya = Number(body.estimasi_biaya) || 0;
    const dp = Number(body.dp) || 0;
    const sisa = estimasi_biaya - dp;
    const biaya_akhir = Number(body.biaya_akhir) || 0;

    const no_surat_jalan = body.no_surat_jalan?.trim() || null;
    const distributor_vendor = body.distributor_vendor?.trim() || null;
    const tgl_kirim_vendor = body.tgl_kirim_vendor || null;
    const tgl_datang_vendor = body.tgl_datang_vendor || null;
    const hasil_service_garansi = body.hasil_service_garansi || null;
    const sn_baru = body.sn_baru?.trim() || null;
    const tgl_diambil_customer = body.tgl_diambil_customer || null;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const stmt = db.prepare(`
      INSERT INTO tickets (
        id, nomor_layanan, tanggal_masuk, jenis_layanan, nama_customer, no_hp,
        jenis_barang, nama_barang, serial_number, keluhan, kelengkapan, estimasi_selesai,
        teknisi, status, catatan, estimasi_biaya, dp, sisa, biaya_akhir,
        no_surat_jalan, distributor_vendor, tgl_kirim_vendor, tgl_datang_vendor,
        hasil_service_garansi, sn_baru, tgl_diambil_customer, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      nomor_layanan,
      now,
      jenis_layanan,
      nama_customer,
      no_hp,
      jenis_barang,
      nama_barang,
      serial_number,
      keluhan,
      kelengkapan,
      estimasi_selesai,
      teknisi,
      status,
      catatan,
      estimasi_biaya,
      dp,
      sisa,
      biaya_akhir,
      no_surat_jalan,
      distributor_vendor,
      tgl_kirim_vendor,
      tgl_datang_vendor,
      hasil_service_garansi,
      sn_baru,
      tgl_diambil_customer,
      now,
      now
    );

    // Catat ke audit log
    logActivity(
      id,
      nomor_layanan,
      teknisi,
      'CREATE_TICKET',
      `${teknisi} membuat tiket baru [${nomor_layanan}] - ${nama_barang} (${nama_customer})`,
      null,
      {
        nomor_layanan,
        nama_customer,
        nama_barang,
        jenis_layanan,
        teknisi,
        status,
        keluhan
      }
    );

    return NextResponse.json({
      success: true,
      ticket: {
        id,
        nomor_layanan,
        nama_customer,
        nama_barang,
        status
      }
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to create ticket' }, { status: 500 });
  }
}
