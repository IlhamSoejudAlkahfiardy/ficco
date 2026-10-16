'use client';

import React, { useEffect } from 'react';
import { usePwaStore, registerServiceWorker } from '@/infrastructure/pwa';

export const PwaRegistrar: React.FC = () => {
  const { initPwa, hasUpdate, updateServiceWorker } = usePwaStore();

  useEffect(() => {
    initPwa();
    registerServiceWorker();
  }, [initPwa]);

  if (!hasUpdate) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md bg-blue-600 text-white p-4 rounded-xl shadow-2xl border border-blue-400 z-50 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-lg">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div className="text-xs">
          <p className="font-semibold text-white">Versi Baru Tersedia!</p>
          <p className="text-blue-100">Pembaruan sistem Ficco telah diunduh.</p>
        </div>
      </div>
      <button
        onClick={updateServiceWorker}
        className="px-3 py-1.5 bg-white text-blue-700 font-semibold text-xs rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex-shrink-0"
      >
        Perbarui
      </button>
    </div>
  );
};
