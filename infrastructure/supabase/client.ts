import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database, LicenseRow, LicenseInsert, LicenseUpdate } from './types';

/**
 * Global in-memory license storage used exclusively when live Supabase credentials
 * are not configured in environment variables (local offline development & CI testing).
 */
const mockLicenseStorage: Map<string, LicenseRow> = new Map();

/**
 * Check if live Supabase service credentials are configured in the environment.
 * Note: Service credentials MUST remain strictly server-side.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    url &&
    serviceKey &&
    url.trim().length > 0 &&
    serviceKey.trim().length > 0 &&
    !url.includes('example.supabase.co') &&
    !serviceKey.includes('placeholder')
  );
}

/**
 * Creates a server-side Supabase client with service_role permissions.
 * Throws an error if invoked on the client-side (Zero-Knowledge / Server Boundary rule).
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[Security Violation] Supabase server client must never be instantiated on the client side.'
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (isSupabaseConfigured() && supabaseUrl && serviceKey) {
    return createClient<Database>(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // Fallback: In-memory simulation when live credentials are not yet set
  return createMockSupabaseClient();
}

/**
 * In-memory mock adapter mimicking the Supabase PostgREST client for local development
 */
function createMockSupabaseClient(): SupabaseClient<Database> {
  const mockClient = {
    from: (table: string) => {
      if (table !== 'licenses') {
        throw new Error(`Mock Supabase only supports table "licenses", received: "${table}"`);
      }

      let selectedRows = Array.from(mockLicenseStorage.values());
      let pendingUpdates: Partial<LicenseUpdate> | null = null;
      let pendingInsert: LicenseInsert | LicenseInsert[] | null = null;
      let isDelete = false;
      let isSingle = false;

      const queryBuilder = {
        select: (_columns = '*') => {
          return queryBuilder;
        },
        eq: (column: keyof LicenseRow, value: unknown) => {
          selectedRows = selectedRows.filter((row) => row[column] === value);
          return queryBuilder;
        },
        order: (column: keyof LicenseRow, { ascending = true } = {}) => {
          selectedRows.sort((a, b) => {
            const valA = a[column];
            const valB = b[column];
            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;
            return ascending
              ? String(valA).localeCompare(String(valB))
              : String(valB).localeCompare(String(valA));
          });
          return queryBuilder;
        },
        insert: (data: LicenseInsert | LicenseInsert[]) => {
          pendingInsert = data;
          return queryBuilder;
        },
        update: (data: Partial<LicenseUpdate>) => {
          pendingUpdates = data;
          return queryBuilder;
        },
        delete: () => {
          isDelete = true;
          return queryBuilder;
        },
        single: () => {
          isSingle = true;
          return queryBuilder;
        },
        // Thenables for async resolution (await)
        then: (
          resolve: (result: {
            data: unknown;
            error: null | { message: string; code?: string };
          }) => void
        ) => {
          // 1. Handle INSERT
          if (pendingInsert) {
            const items = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
            const createdRows: LicenseRow[] = items.map((item) => {
              // Check uniqueness
              for (const existing of mockLicenseStorage.values()) {
                if (existing.license_key === item.license_key) {
                  const err = { message: 'duplicate key value violates unique constraint', code: '23505' };
                  resolve({ data: null, error: err });
                  return existing;
                }
              }

              const row: LicenseRow = {
                id: item.id || `lic_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                license_key: item.license_key,
                used: item.used ?? false,
                created_at: item.created_at || new Date().toISOString(),
                customer_name: item.customer_name ?? null,
                customer_email: item.customer_email ?? null,
                activated_at: item.activated_at ?? null,
                device_fingerprint: item.device_fingerprint ?? null,
              };
              mockLicenseStorage.set(row.id, row);
              return row;
            });

            resolve({
              data: isSingle ? createdRows[0] : createdRows,
              error: null,
            });
            return;
          }

          // 2. Handle DELETE
          if (isDelete) {
            const deletedRows: LicenseRow[] = [];
            for (const row of selectedRows) {
              if (mockLicenseStorage.has(row.id)) {
                deletedRows.push(row);
                mockLicenseStorage.delete(row.id);
              }
            }

            resolve({
              data: isSingle ? deletedRows[0] || null : deletedRows,
              error: null,
            });
            return;
          }

          // 3. Handle UPDATE
          if (pendingUpdates) {
            const updatedRows: LicenseRow[] = [];
            for (const row of selectedRows) {
              const current = mockLicenseStorage.get(row.id);
              if (current) {
                const updated: LicenseRow = {
                  ...current,
                  ...pendingUpdates,
                };
                mockLicenseStorage.set(row.id, updated);
                updatedRows.push(updated);
              }
            }

            resolve({
              data: isSingle ? updatedRows[0] || null : updatedRows,
              error: null,
            });
            return;
          }

          // 4. Handle SELECT
          if (isSingle) {
            const result = selectedRows[0] || null;
            resolve({
              data: result,
              error: result ? null : { message: 'Row not found', code: 'PGRST116' },
            });
            return;
          }

          resolve({
            data: selectedRows,
            error: null,
          });
        },
      };

      return queryBuilder;
    },
  };

  return mockClient as unknown as SupabaseClient<Database>;
}

/**
 * Utility helper to reset in-memory mock storage (useful during automated tests)
 */
export function resetMockLicenseStorage(): void {
  mockLicenseStorage.clear();
}
