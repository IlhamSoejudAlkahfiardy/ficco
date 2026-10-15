'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BackupExportResult,
  BackupTableSummary,
} from '../_types/backup.types';
import { backupExportService } from '../_services/backup-export-service';

export interface DatabaseBackupStats {
  totalRecords: number;
  tableSummaries: BackupTableSummary[];
  lastBackupDate: string | null;
}

export function useBackupExport() {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DatabaseBackupStats | null>(null);
  const [lastResult, setLastResult] = useState<BackupExportResult | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      setError(null);
      const res = await backupExportService.getDatabaseStats();
      setStats({
        totalRecords: res.totalRecords,
        tableSummaries: res.tableSummaries,
        lastBackupDate: res.lastBackupDate,
      });
    } catch (err) {
      console.error('Failed to load backup stats:', err);
      setError((err as Error).message || 'Gagal membaca statistik database.');
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const exportData = useCallback(async (): Promise<BackupExportResult | null> => {
    try {
      setIsExporting(true);
      setError(null);
      const result = await backupExportService.exportBackup();
      setLastResult(result);
      await refreshStats();
      return result;
    } catch (err) {
      console.error('Failed to export backup JSON:', err);
      setError((err as Error).message || 'Gagal mengekspor data cadangan.');
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [refreshStats]);

  useEffect(() => {
    let isMounted = true;

    async function initializeStats() {
      try {
        const res = await backupExportService.getDatabaseStats();
        if (isMounted) {
          setStats({
            totalRecords: res.totalRecords,
            tableSummaries: res.tableSummaries,
            lastBackupDate: res.lastBackupDate,
          });
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load backup stats:', err);
          setError((err as Error).message || 'Gagal membaca statistik database.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingStats(false);
        }
      }
    }

    void initializeStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isExporting,
    isLoadingStats,
    error,
    stats,
    lastResult,
    exportData,
    refreshStats,
  };
}
