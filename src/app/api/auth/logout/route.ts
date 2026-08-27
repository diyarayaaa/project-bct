import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Berhasil logout' });
  response.cookies.delete('bct_auth_user');
  return response;
}
