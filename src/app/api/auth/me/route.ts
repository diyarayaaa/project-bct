import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userCookie = request.cookies.get('bct_auth_user');

    if (!userCookie?.value) {
      // Return list of available users for easy quick-login
      const stmt = db.prepare('SELECT id, username, nama_lengkap, role, spesialisasi, avatar_color FROM users ORDER BY id ASC');
      const allUsers = stmt.all() as User[];
      return NextResponse.json({ authenticated: false, users: allUsers });
    }

    const parsedUser = JSON.parse(userCookie.value) as User;

    // Verify user exists in database
    const stmt = db.prepare('SELECT id, username, nama_lengkap, role, spesialisasi, avatar_color FROM users WHERE id = ?');
    const user = stmt.get(parsedUser.id) as User | undefined;

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('Error in auth me route:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
