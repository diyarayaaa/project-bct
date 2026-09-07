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

    // If no valid session cookie is present, user is unauthenticated
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  } catch (error) {
    console.error('Error in auth me route:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
