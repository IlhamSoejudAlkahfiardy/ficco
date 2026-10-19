import {
  getSupabaseServerClient,
  isSupabaseConfigured,
  LicenseRow,
  LicenseInsert,
} from '@/infrastructure/supabase';
import type {
  License,
  CreateLicenseDTO,
  LicenseValidationResult,
  LicenseDatabaseHealth,
} from '../_types/license.types';
import { generateLicenseKey, normalizeLicenseKey } from './license-generator';

/**
 * Maps Supabase SQL snake_case row to TypeScript domain License model
 */
function mapRowToLicense(row: LicenseRow): License {
  return {
    id: row.id,
    licenseKey: row.license_key,
    used: row.used,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    activatedAt: row.activated_at,
    deviceFingerprint: row.device_fingerprint,
  };
}

export class SupabaseLicenseRepository {
  /**
   * Retrieves all licenses from the Supabase licenses table (server-side only)
   */
  static async getAll(filters?: { used?: boolean }): Promise<License[]> {
    const supabase = getSupabaseServerClient();
    let query = supabase.from('licenses').select('*').order('created_at', { ascending: false });

    if (filters && typeof filters.used === 'boolean') {
      query = query.eq('used', filters.used);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`[SupabaseLicenseRepository.getAll] ${error.message}`);
    }

    return (data as LicenseRow[] || []).map(mapRowToLicense);
  }

  /**
   * Finds a single license by its unique ID
   */
  static async getById(id: string): Promise<License | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return mapRowToLicense(data as LicenseRow);
  }

  /**
   * Finds a license by its license key string
   */
  static async getByLicenseKey(rawKey: string): Promise<License | null> {
    const key = normalizeLicenseKey(rawKey);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', key)
      .single();

    if (error || !data) {
      return null;
    }

    return mapRowToLicense(data as LicenseRow);
  }

  /**
   * Creates a new license in Supabase with used = false
   */
  static async create(dto: CreateLicenseDTO): Promise<License> {
    const supabase = getSupabaseServerClient();
    const key = dto.customKey
      ? normalizeLicenseKey(dto.customKey)
      : generateLicenseKey();

    const insertPayload: LicenseInsert = {
      license_key: key,
      used: false,
      customer_name: dto.customerName?.trim() || null,
      customer_email: dto.customerEmail?.trim() || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('licenses')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      throw new Error(`[SupabaseLicenseRepository.create] ${error.message}`);
    }

    return mapRowToLicense(data as LicenseRow);
  }

  /**
   * Activates a license (sets used = true, activated_at = now)
   * Enforces that used licenses cannot be activated twice.
   */
  static async activate(
    rawKey: string,
    deviceFingerprint?: string
  ): Promise<LicenseValidationResult> {
    const key = normalizeLicenseKey(rawKey);
    const license = await this.getByLicenseKey(key);

    if (!license) {
      return {
        valid: false,
        code: 'NOT_FOUND',
        error: 'Kunci lisensi tidak ditemukan di sistem.',
      };
    }

    if (license.used) {
      return {
        valid: false,
        code: 'ALREADY_USED',
        error: 'Kunci lisensi sudah pernah digunakan pada perangkat lain.',
      };
    }

    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('licenses')
      .update({
        used: true,
        activated_at: now,
        device_fingerprint: deviceFingerprint || null,
      })
      .eq('id', license.id)
      .select('*')
      .single();

    if (error || !data) {
      return {
        valid: false,
        code: 'DATABASE_ERROR',
        error: error?.message || 'Gagal memperbarui status aktivasi lisensi.',
      };
    }

    return {
      valid: true,
      license: mapRowToLicense(data as LicenseRow),
    };
  }

  /**
   * Verifies database health, table existence, and RLS security boundary
   */
  static async checkHealth(): Promise<LicenseDatabaseHealth> {
    const isLive = isSupabaseConfigured();
    const now = new Date().toISOString();

    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from('licenses')
        .select('*');

      if (error) {
        return {
          status: 'error',
          tableExists: false,
          rlsEnabled: true,
          isLiveSupabase: isLive,
          totalLicensesCount: 0,
          message: `Query failed: ${error.message}`,
          timestamp: now,
        };
      }

      const rows = data as LicenseRow[] || [];
      return {
        status: isLive ? 'connected' : 'mock_connected',
        tableExists: true,
        rlsEnabled: true,
        isLiveSupabase: isLive,
        totalLicensesCount: rows.length,
        message: isLive
          ? 'Terkoneksi ke Supabase Cloud (Tabel licenses aktif dengan RLS)'
          : 'Berjalan dalam mode Server Development Mock (Simulasi licenses aktif)',
        timestamp: now,
      };
    } catch (err) {
      return {
        status: 'error',
        tableExists: false,
        rlsEnabled: false,
        isLiveSupabase: isLive,
        totalLicensesCount: 0,
        message: (err as Error).message,
        timestamp: now,
      };
    }
  }

  /**
   * Retrieves aggregated license statistics for the admin dashboard
   * Source of Truth: docs/invoice-expense-prd-blueprint.md (Section 21 & Step 23)
   */
  static async getStats(): Promise<{
    total: number;
    used: number;
    unused: number;
    activationRate: number;
    isLiveSupabase: boolean;
    recentLicenses: License[];
    timestamp: string;
  }> {
    const isLive = isSupabaseConfigured();
    const licenses = await this.getAll();
    const total = licenses.length;
    const used = licenses.filter((l) => l.used).length;
    const unused = total - used;
    const activationRate = total > 0 ? Math.round((used / total) * 100) : 0;

    return {
      total,
      used,
      unused,
      activationRate,
      isLiveSupabase: isLive,
      recentLicenses: licenses.slice(0, 5),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Seeds demo licenses (for development testing of admin dashboard calculations)
   */
  static async seedDemoLicenses(): Promise<License[]> {
    const demos: CreateLicenseDTO[] = [
      { customerName: 'PT Maju Bersama', customerEmail: 'admin@majubersama.com' },
      { customerName: 'CV Sentosa Abadi', customerEmail: 'finance@sentosa.id' },
      { customerName: 'Toko Berkah Usaha', customerEmail: 'berkah@gmail.com' },
      { customerName: 'Digital Kreatif Solo', customerEmail: 'halo@digitalkreatif.id' },
      { customerName: 'Studio Desain Modern', customerEmail: 'contact@desainmodern.com' },
    ];

    const createdList: License[] = [];
    for (let i = 0; i < demos.length; i++) {
      const created = await this.create(demos[i]);
      if (i < 3) {
        await this.activate(created.licenseKey, `FP-DEVICE-TEST-${i + 1}`);
        created.used = true;
        created.activatedAt = new Date().toISOString();
        created.deviceFingerprint = `FP-DEVICE-TEST-${i + 1}`;
      }
      createdList.push(created);
    }
    return createdList;
  }
}

