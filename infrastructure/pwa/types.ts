/**
 * PWA & Service Worker Types
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PwaState {
  /** Whether the browser supports Service Worker & PWA installation */
  isSupported: boolean;
  /** Whether the app is currently running in standalone display mode */
  isStandalone: boolean;
  /** Whether the app has been installed or running as standalone */
  isInstalled: boolean;
  /** Whether the browser fired beforeinstallprompt and installation can be triggered */
  canInstall: boolean;
  /** Whether the Service Worker is registered and active */
  isSwRegistered: boolean;
  /** Whether a newer version of the Service Worker is waiting to activate */
  hasUpdate: boolean;
  /** The captured beforeinstallprompt event */
  deferredPrompt: BeforeInstallPromptEvent | null;
}
