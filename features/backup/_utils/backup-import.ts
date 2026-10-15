import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  BackupPayload,
  BackupValidationResult,
} from '../_types/backup.types';
import { backupPayloadSchema } from '../_schemas/backup.schemas';
import { calculateBackupTableSummaries } from './backup-export';

export interface ParseOptions {
  filename?: string;
  fileSizeBytes?: number;
}

/**
 * Parses raw JSON string and thoroughly validates format, schema version,
 * and individual entity tables using Zod schemas.
 * Guarantees that corrupted or invalid payloads are rejected before touching IndexedDB.
 */
export function parseAndValidateBackupJson(
  jsonString: string,
  options?: ParseOptions
): BackupValidationResult {
  // 1. Safe JSON Syntax Parse
  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(jsonString);
  } catch (err) {
    return {
      valid: false,
      error: 'Berkas bukan format JSON yang valid atau data terpotong/rusak.',
      details: [(err as Error).message],
    };
  }

  // 2. Object Type Guard
  if (!rawParsed || typeof rawParsed !== 'object' || Array.isArray(rawParsed)) {
    return {
      valid: false,
      error: 'Format berkas tidak sesuai: isi data harus berupa objek JSON cadangan.',
    };
  }

  const record = rawParsed as Record<string, unknown>;

  // 3. Format Identifier Check
  if (record.format !== BACKUP_FORMAT) {
    return {
      valid: false,
      error: `Format cadangan '${String(record.format || 'unknown')}' tidak didukung. Berkas harus bertipe '${BACKUP_FORMAT}'.`,
    };
  }

  // 4. Schema Version Check
  const schemaVersion = record.schemaVersion;
  if (typeof schemaVersion !== 'number' || schemaVersion < 1) {
    return {
      valid: false,
      error: 'Versi skema cadangan tidak valid atau tidak ditemukan.',
    };
  }

  if (schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Versi skema berkas (v${schemaVersion}) lebih baru dari versi aplikasi yang didukung (v${BACKUP_SCHEMA_VERSION}). Harap perbarui aplikasi Ficco terlebih dahulu.`,
    };
  }

  // 5. Zod Schema Integrity Validation (All 9 entity tables)
  const zodResult = backupPayloadSchema.safeParse(rawParsed);
  if (!zodResult.success) {
    const errorMessages = zodResult.error.issues.slice(0, 10).map((issue) => {
      const path = issue.path.join('.') || 'root';
      return `[${path}] ${issue.message}`;
    });

    if (zodResult.error.issues.length > 10) {
      errorMessages.push(`...dan ${zodResult.error.issues.length - 10} kesalahan lainnya`);
    }

    return {
      valid: false,
      error: 'Validasi integritas data cadangan gagal. Struktur data di dalam tabel tidak sesuai skema.',
      details: errorMessages,
    };
  }

  const payload = zodResult.data as BackupPayload;

  // 6. Construct Import Preview Summaries
  const tableSummaries = calculateBackupTableSummaries(payload.data);
  const totalRecords =
    payload.metadata?.totalRecords ??
    tableSummaries.reduce((sum, item) => sum + item.count, 0);

  const fallbackSize = typeof window !== 'undefined'
    ? new Blob([jsonString]).size
    : Buffer.byteLength(jsonString, 'utf8');

  return {
    valid: true,
    payload,
    preview: {
      filename: options?.filename || 'backup.json',
      fileSizeBytes: options?.fileSizeBytes ?? fallbackSize,
      format: payload.format,
      schemaVersion: payload.schemaVersion,
      appVersion: payload.appVersion,
      exportedAt: payload.exportedAt,
      totalRecords,
      tableSummaries,
    },
  };
}
