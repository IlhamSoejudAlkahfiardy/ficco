import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from '@/features/admin/_services/admin-auth-service';
import {
  SupabaseLicenseRepository,
  createLicenseSchema,
} from '@/features/license';

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

    // 2. Optional query filters
    const { searchParams } = new URL(request.url);
    const usedParam = searchParams.get('used');
    const searchParam = searchParams.get('search') || undefined;

    const filters: { used?: boolean; search?: string } = {};
    if (usedParam === 'true') {
      filters.used = true;
    } else if (usedParam === 'false') {
      filters.used = false;
    }

    if (searchParam && searchParam.trim().length > 0) {
      filters.search = searchParam.trim();
    }

    const licenses = await SupabaseLicenseRepository.getAll(filters);

    return NextResponse.json({
      success: true,
      licenses,
    });
  } catch (error) {
    console.error('[API /api/admin/licenses GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal mengambil data lisensi',
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
        { success: false, error: 'Unauthorized: Sesi admin diperlukan untuk membuat lisensi' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const parseResult = createLicenseSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = parseResult.error.issues || [];
      const errorMsg = issues.map((e) => e.message).join(', ');
      return NextResponse.json(
        {
          success: false,
          error: errorMsg || 'Data lisensi yang dikirim tidak valid',
          details: issues,
        },
        { status: 400 }
      );
    }

    const { customerName, customerEmail, customKey } = parseResult.data;

    // 3. Create license in Supabase (starts with used = false)
    const newLicense = await SupabaseLicenseRepository.create({
      customerName: customerName || null,
      customerEmail: customerEmail || null,
      customKey: customKey || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Kunci lisensi baru berhasil dibuat dan disimpan.',
        license: newLicense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/admin/licenses POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Gagal membuat kunci lisensi';
    const isDuplicate = message.toLowerCase().includes('duplicate') || message.includes('23505');

    return NextResponse.json(
      {
        success: false,
        error: isDuplicate
          ? 'Kunci lisensi tersebut sudah terdaftar di sistem. Gunakan kunci yang berbeda.'
          : message,
      },
      { status: isDuplicate ? 400 : 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 1. Verify admin session cookie
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi admin diperlukan untuk mengubah status lisensi' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const { id, used } = body;

    if (!id || typeof id !== 'string' || typeof used !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Parameter id (string) dan used (boolean) wajib disertakan' },
        { status: 400 }
      );
    }

    // 3. Toggle/update used state
    const updated = await SupabaseLicenseRepository.setUsedState(id, used);

    return NextResponse.json({
      success: true,
      message: `Status lisensi berhasil diubah menjadi ${used ? 'Digunakan' : 'Belum Digunakan'}.`,
      license: updated,
    });
  } catch (error) {
    console.error('[API /api/admin/licenses PATCH] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memperbarui status lisensi',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify admin session cookie
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi admin diperlukan untuk menghapus lisensi' },
        { status: 401 }
      );
    }

    // 2. Extract id from query params or body
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Parameter id lisensi yang ingin dihapus wajib disertakan' },
        { status: 400 }
      );
    }

    // 3. Delete from repository
    await SupabaseLicenseRepository.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Lisensi berhasil dihapus dari sistem.',
    });
  } catch (error) {
    console.error('[API /api/admin/licenses DELETE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus lisensi',
      },
      { status: 500 }
    );
  }
}
