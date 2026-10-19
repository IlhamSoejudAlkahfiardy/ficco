import { NextRequest, NextResponse } from 'next/server';
import { adminLoginSchema } from '@/features/admin/_schemas/admin.schemas';
import {
  validateAdminCredentials,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE,
} from '@/features/admin/_services/admin-auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = adminLoginSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0]?.message || 'Data login tidak valid';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const { username, password } = parseResult.data;

    const isValid = validateAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Generate signed HMAC session token
    const token = await createAdminSessionToken(username);

    // Build JSON response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login berhasil',
        user: { username, role: 'admin' },
      },
      { status: 200 }
    );

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('[API /api/admin/login] Internal error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memproses login' },
      { status: 500 }
    );
  }
}
