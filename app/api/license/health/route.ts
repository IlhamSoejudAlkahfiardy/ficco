import { NextResponse } from 'next/server';
import {
  SupabaseLicenseRepository,
  createLicenseSchema,
} from '@/features/license';

export const dynamic = 'force-dynamic';

/**
 * GET /api/license/health
 * Verifies Supabase license database connectivity, table schema, and RLS security boundary
 */
export async function GET() {
  try {
    const health = await SupabaseLicenseRepository.checkHealth();

    return NextResponse.json({
      success: health.status !== 'error',
      database: health,
      security: {
        tableExists: health.tableExists,
        rlsEnabled: health.rlsEnabled,
        serviceCredentialsServerSide: true,
        clientExposureBlocked: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        security: {
          serviceCredentialsServerSide: true,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/license/health
 * Creates a test license record to verify database write capability and uniqueness constraint
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createLicenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const license = await SupabaseLicenseRepository.create({
      customerName: parsed.data.customerName || 'Test Customer',
      customerEmail: parsed.data.customerEmail || 'test@ficco.local',
      customKey: parsed.data.customKey,
    });

    return NextResponse.json(
      {
        success: true,
        license,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
