'use client';

import React, { useState } from 'react';
import { usePwaStore } from '@/infrastructure/pwa';

interface PwaInstallButtonProps {
  variant?: 'button' | 'compact' | 'badge';
  className?: string;
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { canInstall, isStandalone, triggerInstall } = usePwaStore();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await triggerInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  // If already running standalone, show status badge if requested
  if (isStandalone) {
    if (variant === 'badge') {
      return (
        <span
          data-testid="pwa-standalone-badge"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          PWA Standalone
        </span>
      );
    }
    return null;
  }

  // If not installable yet (or browser doesn't prompt), don't show button unless fallback
  if (!canInstall && variant !== 'badge') {
    return null;
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        data-testid="pwa-install-compact-btn"
        title="Instal Ficco di Komputer / Smartphone Anda"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-colors ${className}`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>{isInstalling ? 'Memasang...' : 'Instal App'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      disabled={isInstalling || !canInstall}
      data-testid="pwa-install-btn"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 disabled:pointer-events-none transition-colors ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span>{isInstalling ? 'Memasang...' : 'Pasang Aplikasi Ficco (PWA)'}</span>
    </button>
  );
};
