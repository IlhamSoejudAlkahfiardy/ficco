'use client';

import React, { useEffect } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { BottomNav } from './bottom-nav';
import { useShellStore } from '../../_hooks/use-shell-store';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { setIsOnline, checkConnectivity } = useShellStore();

  // Listen to connectivity changes for offline status badge
  useEffect(() => {
    checkConnectivity();

    const handleOnline = () => {
      checkConnectivity();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, checkConnectivity]);

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb', // Blue-600
          borderRadius: 8,
          fontFamily: 'inherit',
        },
      }}
    >
      <div className="flex h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Slide-over Drawer */}
        <MobileNav />

        {/* Main Workspace Column */}
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
          {/* Header */}
          <Header />

          {/* Scrollable Content Area */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 pb-24 md:pb-8 focus:outline-none"
          >
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </div>
      </div>
    </ConfigProvider>
  );
};
