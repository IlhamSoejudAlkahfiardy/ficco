'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ReportDatePreset,
  ReportFilter,
  ReportsData,
} from '../_types/reports.types';
import { reportsDomainService } from '../_services/reports-service';

export type ReportTab = 'profit_loss' | 'revenue' | 'expenses';

export function useReports() {
  const [preset, setPreset] = useState<ReportDatePreset>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ReportTab>('profit_loss');
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filter: ReportFilter = {
        preset,
        startDate: preset === 'custom' ? startDate : undefined,
        endDate: preset === 'custom' ? endDate : undefined,
      };

      const result = await reportsDomainService.getReportsData(filter);
      setData(result);
    } catch (err) {
      console.error('Failed to load reports data:', err);
      setError((err as Error).message || 'Gagal memuat laporan keuangan');
    } finally {
      setIsLoading(false);
    }
  }, [preset, startDate, endDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return {
    data,
    isLoading,
    error,
    preset,
    setPreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    activeTab,
    setActiveTab,
    refresh: loadReports,
  };
}
