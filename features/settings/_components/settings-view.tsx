'use client';

import React, { useState } from 'react';
import { useCompanySettings } from '../_hooks/use-company-settings';
import { CompanyProfileForm } from './company-profile-form';
import { InvoiceDefaultsForm } from './invoice-defaults-form';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'invoice'>('profile');
  const {
    isLoading,
    isSaving,
    saveMessage,
    errorMessage,
    company,
    invoiceDefaults,
    saveCompany,
    saveDefaults,
    clearMessage,
  } = useCompanySettings();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Pengaturan Bisnis
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Kelola profil usaha, logo, mata uang, dan konfigurasi default faktur.
          </p>
        </div>

        {/* Local Storage Indicator Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs text-slate-600 dark:text-zinc-300 self-start sm:self-auto border border-slate-200 dark:border-zinc-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Tersimpan di IndexedDB (Offline-Ready)</span>
        </div>
      </div>

      {/* Notifications */}
      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold">✓</span>
            <span>{saveMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearMessage}
            className="text-emerald-600 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearMessage}
            className="text-rose-600 hover:text-rose-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Tabs Card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 px-6 pt-3 bg-slate-50/50 dark:bg-zinc-800/30 gap-6">
          <button
            type="button"
            onClick={() => {
              clearMessage();
              setActiveTab('profile');
            }}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Profil Usaha & Identitas
          </button>
          <button
            type="button"
            onClick={() => {
              clearMessage();
              setActiveTab('invoice');
            }}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'invoice'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Default Faktur & Penomoran
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {isLoading ? (
            <div className="space-y-4 py-8 animate-pulse text-center text-slate-400">
              <span className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Memuat pengaturan dari IndexedDB...</p>
            </div>
          ) : activeTab === 'profile' ? (
            <CompanyProfileForm
              initialData={company}
              onSubmit={saveCompany}
              isSaving={isSaving}
            />
          ) : (
            <InvoiceDefaultsForm
              initialData={invoiceDefaults}
              onSubmit={saveDefaults}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
};
