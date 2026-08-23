import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, X, WifiOff, CheckCircle, Share, PlusSquare } from 'lucide-react';
import { isStandaloneMode, isIosDevice } from '../services/pwaService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (isStandaloneMode()) {
      setIsInstalled(true);
    }

    // Capture beforeinstallprompt for Chrome/Edge/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 5000);
    };

    // Online/Offline status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check dismissed state from session storage
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIosDevice()) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const isIos = isIosDevice();
  const canShowBanner = (!isInstalled && !isDismissed && (deferredPrompt || isIos));

  return (
    <>
      {/* OFFLINE STATUS TOAST */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-2xl shadow-lg border border-amber-400 flex items-center space-x-2 text-xs"
          >
            <WifiOff className="w-4 h-4 animate-bounce" />
            <span>Offline Mode Active — Cached study toolkit and notes available!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JUST INSTALLED TOAST */}
      <AnimatePresence>
        {justInstalled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center space-x-2 text-xs"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Ascend Study installed successfully on your device!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING / EMBEDDABLE PWA INSTALL BANNER */}
      <AnimatePresence>
        {canShowBanner && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 max-w-sm w-[calc(100%-1.5rem)] sm:w-88 z-40 bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl text-slate-100 space-y-3"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                    <span>Install Ascend Study</span>
                    <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded uppercase">
                      PWA
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1">
                    Fast offline access & native app experience
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIos ? 'How to Add to Home Screen' : 'Install App (Free)'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IOS SAFARI INSTALL INSTRUCTIONS MODAL */}
      <AnimatePresence>
        {showIosGuide && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                    📱
                  </div>
                  <h3 className="font-extrabold text-sm text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIosGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start space-x-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Tap the Share Button</span>
                      <Share className="w-3.5 h-3.5 text-indigo-400 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400">
                      In Safari browser at the bottom or top of your screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>Scroll & Tap 'Add to Home Screen'</span>
                      <PlusSquare className="w-3.5 h-3.5 text-indigo-400 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Look for the plus icon in the share menu options.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-white">Tap 'Add' in Top Right</p>
                    <p className="text-[11px] text-slate-400">
                      Ascend Study will appear directly on your home screen!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Got It!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Compact Install Button for Header / Settings Bar
 */
export function PWAHeaderButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIosDevice()) {
      setShowIosGuide(true);
    } else {
      alert('To install Ascend Study, click the Install App icon in your browser address bar.');
    }
  };

  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold">
        <CheckCircle className="w-3 h-3 text-emerald-400" />
        <span>PWA Installed</span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition cursor-pointer active:scale-95"
        title="Install App as PWA"
      >
        <Download className="w-3 h-3 text-indigo-600" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* IOS SAFARI GUIDE MODAL */}
      <AnimatePresence>
        {showIosGuide && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-white">Add to Home Screen (iOS)</h3>
                <button
                  onClick={() => setShowIosGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-300">
                1. Tap the <strong>Share</strong> button in Safari.<br />
                2. Tap <strong>'Add to Home Screen'</strong> ➕.<br />
                3. Tap <strong>Add</strong> in the top-right corner.
              </p>
              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
