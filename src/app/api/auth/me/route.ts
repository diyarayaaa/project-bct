import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userCookie = request.cookies.get('bct_auth_user');

    if (userCookie?.value) {
      try {
        const parsedUser = JSON.parse(userCookie.value) as User;
        const stmt = db.prepare('SELECT id, username, nama_lengkap, role, spesialisasi, avatar_color FROM users WHERE id = ?');
        const user = stmt.get(parsedUser.id) as User | undefined;
        if (user) {
          return NextResponse.json({ authenticated: true, user });
        }
      } catch {
        // invalid cookie, fallback to default
      }
    }

    // Default auto-session for seamless local network / multi-device access (Admin Kasir)
    const defaultUserStmt = db.prepare('SELECT id, username, nama_lengkap, role, spesialisasi, avatar_color FROM users WHERE username = "admin" OR role = "ADMIN" LIMIT 1');
    const defaultUser = (defaultUserStmt.get() as User | undefined) || {
      id: 'usr-admin',
      username: 'admin',
      nama_lengkap: 'Admin Kasir',
      role: 'ADMIN',
      spesialisasi: 'Administrasi & Kasir',
      avatar_color: 'purple'
    };

    const response = NextResponse.json({ authenticated: true, user: defaultUser });
    response.cookies.set({
      name: 'bct_auth_user',
      value: JSON.stringify(defaultUser),
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Error in auth me route:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
