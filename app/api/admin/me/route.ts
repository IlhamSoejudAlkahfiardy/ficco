import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from '@/features/admin/_services/admin-auth-service';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const payload = await verifyAdminSessionToken(sessionCookie);

    if (!payload) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          username: payload.username,
          role: payload.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/admin/me] Error checking admin session:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Gagal memverifikasi sesi' },
      { status: 500 }
    );
  }
}
