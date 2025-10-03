import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, Smartphone, Monitor, X } from 'lucide-react';

interface PWAInstallPromptProps {
  onDismiss: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt({ onDismiss }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Check if iOS and show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        setShowIosInstructions(true);
        return;
      }
      return;
    }

    try {
      // Show the install dialog
      deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleClose = () => {
    setShowIosInstructions(false);
    onDismiss();
  };

  return (
    <>
      {/* Main Install Prompt */}
      <Dialog open={!!deferredPrompt} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Download className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Install Smart Grocery App
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Install our app for the best experience with offline access and faster loading.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span>Fast access from your home screen</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Monitor className="h-4 w-4 text-green-600" />
                <span>Works offline when connection is poor</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Download className="h-4 w-4 text-purple-600" />
                <span>Automatical updates in the background</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Install App
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* iOS Installation Instructions */}
      <Dialog open={showIosInstructions} onOpenChange={() => setShowIosInstructions(false)}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Install on iOS
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              To install this app on your iPhone or iPad, follow these steps:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="text-sm text-gray-700">
                  <strong>Tap the Share button</strong> in your Safari browser (square with up arrow icon)
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="text-sm text-gray-700">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="text-sm text-gray-700">
                  Tap <strong>"Add"</strong> to confirm and install the app
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => setShowIosInstructions(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Got it, thanks!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
