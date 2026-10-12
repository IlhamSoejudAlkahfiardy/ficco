'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DashboardFilter,
  DashboardData,
  DashboardDateRangePreset,
} from '../_types/dashboard.types';
import { dashboardDomainService } from '../_services/dashboard-service';

export function useDashboard() {
  const [dateRange, setDateRange] = useState<DashboardDateRangePreset>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filter: DashboardFilter = {
        dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined,
      };

      const result = await dashboardDomainService.getDashboardData(filter);
      setData(result);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError((err as Error).message || 'Gagal memuat ringkasan dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    data,
    isLoading,
    error,
    dateRange,
    setDateRange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    refresh: loadDashboard,
  };
}
