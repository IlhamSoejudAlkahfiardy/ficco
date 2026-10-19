import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from '@/features/admin/_services/admin-auth-service';
import { SupabaseLicenseRepository } from '@/features/license';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify admin session cookie
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi admin tidak valid atau telah kedaluwarsa' },
        { status: 401 }
      );
    }

    // 2. Fetch statistics from Supabase repository
    const stats = await SupabaseLicenseRepository.getStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[API /api/admin/dashboard/stats GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal mengambil statistik lisensi',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin session cookie
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi admin tidak valid' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.action === 'seed') {
      await SupabaseLicenseRepository.seedDemoLicenses();
    }

    const stats = await SupabaseLicenseRepository.getStats();

    return NextResponse.json({
      success: true,
      message: 'Operasi statistik admin berhasil diproses',
      stats,
    });
  } catch (error) {
    console.error('[API /api/admin/dashboard/stats POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memproses data statistik admin',
      },
      { status: 500 }
    );
  }
}
