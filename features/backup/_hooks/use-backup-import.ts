'use client';

import { useState, useCallback } from 'react';
import {
  BackupValidationResult,
  BackupImportResult,
} from '../_types/backup.types';
import { backupImportService } from '../_services/backup-import-service';

export function useBackupImport(onSuccessCallback?: () => void) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [importResult, setImportResult] = useState<BackupImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setIsValidating(false);
    setIsImporting(false);
    setValidationResult(null);
    setErrorMessage(null);
    setIsConfirmOpen(false);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsValidating(true);
    setErrorMessage(null);
    setImportResult(null);
    setValidationResult(null);

    try {
      const result = await backupImportService.validateBackupFile(file);
      setValidationResult(result);
      if (!result.valid) {
        setErrorMessage(result.error || 'Berkas cadangan tidak valid.');
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Terjadi kesalahan saat memeriksa berkas.');
    } finally {
      setIsValidating(false);
    }
  }, []);

  const openConfirmation = useCallback(() => {
    if (validationResult?.valid && validationResult.payload) {
      setIsConfirmOpen(true);
    }
  }, [validationResult]);

  const closeConfirmation = useCallback(() => {
    if (!isImporting) {
      setIsConfirmOpen(false);
    }
  }, [isImporting]);

  const confirmAndRestore = useCallback(async () => {
    if (!validationResult?.valid || !validationResult.payload) {
      setErrorMessage('Tidak ada data cadangan yang valid untuk dipulihkan.');
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const result = await backupImportService.restoreBackupTransaction(validationResult.payload);
      setImportResult(result);
      setIsConfirmOpen(false);
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    } catch (err) {
      setErrorMessage(
        (err as Error).message ||
          'Gagal memulihkan database. Operasi dibatalkan dan data saat ini tetap utuh.'
      );
    } finally {
      setIsImporting(false);
    }
  }, [validationResult, onSuccessCallback]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    if (!validationResult?.valid) {
      setSelectedFile(null);
      setValidationResult(null);
    }
  }, [validationResult]);

  const clearSuccess = useCallback(() => {
    setImportResult(null);
    setSelectedFile(null);
    setValidationResult(null);
  }, []);

  return {
    selectedFile,
    isValidating,
    isImporting,
    validationResult,
    importResult,
    errorMessage,
    isConfirmOpen,
    handleFileSelect,
    openConfirmation,
    closeConfirmation,
    confirmAndRestore,
    clearError,
    clearSuccess,
    reset,
  };
}
