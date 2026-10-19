'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLicenseStats, AdminDashboardStatsResponse } from '../_types/admin.types';

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminLicenseStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/admin/dashboard/stats');
      const data: AdminDashboardStatsResponse = await res.json();

      if (!res.ok || !data.success || !data.stats) {
        setError(data.error || 'Gagal memuat statistik lisensi');
      } else {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gangguan koneksi jaringan');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadInitialStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        const data: AdminDashboardStatsResponse = await res.json();
        if (!ignore) {
          if (data.success && data.stats) {
            setStats(data.stats);
          } else {
            setError(data.error || 'Gagal memuat statistik');
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Gangguan koneksi');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadInitialStats();

    return () => {
      ignore = true;
    };
  }, []);

  const seedDemoData = async (): Promise<boolean> => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });
      const data: AdminDashboardStatsResponse = await res.json();
      if (res.ok && data.success && data.stats) {
        setStats(data.stats);
        return true;
      }
      setError(data.error || 'Gagal membuat data percontohan');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gangguan jaringan');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    stats,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchStats(true),
    seedDemoData,
  };
}
