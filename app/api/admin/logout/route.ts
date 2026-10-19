import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/features/admin/_services/admin-auth-service';

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout berhasil',
      },
      { status: 200 }
    );

    // Expire the cookie immediately
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('[API /api/admin/logout] Internal error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses logout' },
      { status: 500 }
    );
  }
}
