import { useState, useEffect } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: string;
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    platform: 'unknown'
  });

  useEffect(() => {
    const updatePWAState = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = window.navigator.standalone || isStandalone || window.matchMedia('(display-mode: fullscreen)').matches;
      
      // Detect platform
      const userAgent = navigator.userAgent.toLowerCase();
      let platform = 'unknown';
      if (userAgent.includes('android')) {
        platform = 'android';
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
        platform = 'ios';
      } else if (userAgent.includes('windows')) {
        platform = 'windows';
      } else if (userAgent.includes('macintosh')) {
        platform = 'mac';
      }

      setPwaState({
        isInstallable: !isInstalled,
        isInstalled,
        isStandalone,
        platform
      });
    };

    // Check initial state
    updatePWAState();

    // Listen for PWA installation events
    const handleAppInstalled = () => {
      updatePWAState();
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return pwaState;
}
