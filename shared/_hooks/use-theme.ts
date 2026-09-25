'use client';

import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Hook to manage and detect dark / light mode synchronization
 * across Tailwind CSS and Ant Design ConfigProvider.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const computeIsDark = useCallback((mode: ThemeMode): boolean => {
    if (typeof window === 'undefined') return false;
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  const applyThemeClass = useCallback((dark: boolean) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    let initialMode: ThemeMode = 'system';
    try {
      const stored = localStorage.getItem('ficco_theme') as ThemeMode | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        initialMode = stored;
      }
    } catch {
      // localStorage may be disabled
    }

    setThemeState(initialMode);
    const dark = computeIsDark(initialMode);
    setIsDark(dark);
    applyThemeClass(dark);

    // Watch OS system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      try {
        const currentStored = localStorage.getItem('ficco_theme');
        if (!currentStored || currentStored === 'system') {
          setIsDark(e.matches);
          applyThemeClass(e.matches);
        }
      } catch {
        setIsDark(e.matches);
        applyThemeClass(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    // Watch class changes on html element
    const observer = new MutationObserver(() => {
      const root = document.documentElement;
      const hasDark = root.classList.contains('dark');
      setIsDark((prev) => (prev !== hasDark ? hasDark : prev));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, [computeIsDark, applyThemeClass]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem('ficco_theme', newTheme);
      } catch {
        // Ignore storage error
      }
      const dark = computeIsDark(newTheme);
      setIsDark(dark);
      applyThemeClass(dark);
    },
    [computeIsDark, applyThemeClass]
  );

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
  }, [isDark, setTheme]);

  return {
    theme,
    isDark,
    mounted,
    setTheme,
    toggleTheme,
  };
}
