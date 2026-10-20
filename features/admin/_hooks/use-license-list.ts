'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { License } from '@/features/license';
import type {
  LicenseFilterType,
  LicenseListResponse,
  ToggleLicenseResponse,
  DeleteLicenseResponse,
} from '../_types/admin.types';

export function useLicenseList(onMutationSuccess?: () => void) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<LicenseFilterType>('all');
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const fetchLicenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/licenses');
      const data: LicenseListResponse = await res.json();

      if (!res.ok || !data.success || !data.licenses) {
        setError(data.error || 'Gagal mengambil daftar lisensi');
      } else {
        setLicenses(data.licenses);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gangguan koneksi jaringan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadInitialLicenses = async () => {
      try {
        const res = await fetch('/api/admin/licenses');
        const data: LicenseListResponse = await res.json();
        if (!ignore) {
          if (!res.ok || !data.success || !data.licenses) {
            setError(data.error || 'Gagal mengambil daftar lisensi');
          } else {
            setLicenses(data.licenses);
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Gangguan koneksi jaringan');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialLicenses();

    return () => {
      ignore = true;
    };
  }, []);

  // Client-side filtering and searching for lightning-fast responsiveness
  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      // 1. Status filter
      if (filter === 'used' && !lic.used) return false;
      if (filter === 'unused' && lic.used) return false;

      // 2. Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matchesKey = lic.licenseKey.toLowerCase().includes(q);
        const matchesName = lic.customerName ? lic.customerName.toLowerCase().includes(q) : false;
        const matchesEmail = lic.customerEmail ? lic.customerEmail.toLowerCase().includes(q) : false;
        const matchesDevice = lic.deviceFingerprint ? lic.deviceFingerprint.toLowerCase().includes(q) : false;

        return matchesKey || matchesName || matchesEmail || matchesDevice;
      }

      return true;
    });
  }, [licenses, filter, searchQuery]);

  // Toggle used state (Step 25: Toggle used state)
  const toggleUsed = async (id: string, currentUsed: boolean): Promise<boolean> => {
    setMutatingId(id);
    setError(null);
    const targetState = !currentUsed;

    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, used: targetState }),
      });

      const data: ToggleLicenseResponse = await res.json();
      if (!res.ok || !data.success || !data.license) {
        setError(data.error || 'Gagal mengubah status lisensi');
        return false;
      }

      // Optimistically update local list
      setLicenses((prev) =>
        prev.map((l) => (l.id === id ? data.license! : l))
      );

      if (onMutationSuccess) {
        onMutationSuccess();
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gangguan jaringan');
      return false;
    } finally {
      setMutatingId(null);
    }
  };

  // Delete license (Step 25: Delete license)
  const deleteLicense = async (id: string): Promise<boolean> => {
    setMutatingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/licenses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      const data: DeleteLicenseResponse = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Gagal menghapus lisensi');
        return false;
      }

      // Remove from local state
      setLicenses((prev) => prev.filter((l) => l.id !== id));

      if (onMutationSuccess) {
        onMutationSuccess();
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gangguan jaringan');
      return false;
    } finally {
      setMutatingId(null);
    }
  };

  return {
    licenses,
    filteredLicenses,
    totalCount: licenses.length,
    usedCount: licenses.filter((l) => l.used).length,
    unusedCount: licenses.filter((l) => !l.used).length,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    mutatingId,
    refresh: fetchLicenses,
    toggleUsed,
    deleteLicense,
  };
}
