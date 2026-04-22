import { useState, useEffect } from "react";
import { X, Share, Plus, MoreVertical, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;
}

export function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    if (isIOS()) {
      setPlatform("ios");
      setTimeout(() => setShowBanner(true), 3000);
    } else if (isAndroid()) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowInstructions(false);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  if (isStandalone()) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 bg-primary text-primary-foreground rounded-2xl p-4 shadow-2xl flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Add to Home Screen</p>
              <p className="text-xs opacity-80">Get the full app experience with quick access</p>
            </div>
            <button
              onClick={handleInstall}
              className="bg-white text-primary font-bold text-sm px-4 py-2 rounded-xl shrink-0 hover:bg-white/90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstructions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={handleDismiss}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-2">
                <h2 className="font-display font-bold text-xl">Add to Home Screen</h2>
                <button
                  onClick={handleDismiss}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="px-6 pb-8 space-y-6">
                <p className="text-muted-foreground text-sm">
                  Install Snowy Mts Weather on your phone for instant access — just like a native app, with no app store needed.
                </p>

                {platform === "ios" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span className="text-lg">🍎</span> iPhone / iPad
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
                        <div>
                          <p className="font-semibold text-sm">Tap the Share button</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Look for the <Share className="w-3.5 h-3.5 inline-block -mt-0.5" /> icon at the bottom of Safari</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
                        <div>
                          <p className="font-semibold text-sm">Scroll down and tap "Add to Home Screen"</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Look for the <Plus className="w-3.5 h-3.5 inline-block -mt-0.5" /> icon next to the option</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
                        <div>
                          <p className="font-semibold text-sm">Tap "Add"</p>
                          <p className="text-xs text-muted-foreground mt-0.5">The app will appear on your home screen</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {platform === "android" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span className="text-lg">🤖</span> Android
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
                        <div>
                          <p className="font-semibold text-sm">Tap the menu button</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Look for <MoreVertical className="w-3.5 h-3.5 inline-block -mt-0.5" /> (three dots) in Chrome's top right</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
                        <div>
                          <p className="font-semibold text-sm">Tap "Add to Home screen"</p>
                          <p className="text-xs text-muted-foreground mt-0.5">or "Install app" if available</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
                        <div>
                          <p className="font-semibold text-sm">Tap "Add" or "Install"</p>
                          <p className="text-xs text-muted-foreground mt-0.5">The app will appear on your home screen</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {platform !== "ios" && platform !== "android" && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <span className="text-lg">🍎</span> iPhone / iPad (Safari)
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
                          <p className="font-semibold text-sm">Tap the <Share className="w-3.5 h-3.5 inline-block -mt-0.5" /> Share button at the bottom of Safari</p>
                        </div>
                        <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
                          <p className="font-semibold text-sm">Scroll down, tap "Add to Home Screen"</p>
                        </div>
                        <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
                          <p className="font-semibold text-sm">Tap "Add" to confirm</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <span className="text-lg">🤖</span> Android (Chrome)
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
                          <p className="font-semibold text-sm">Tap <MoreVertical className="w-3.5 h-3.5 inline-block -mt-0.5" /> menu (three dots) in Chrome</p>
                        </div>
                        <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
                          <p className="font-semibold text-sm">Tap "Add to Home screen" or "Install app"</p>
                        </div>
                        <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
                          <p className="font-semibold text-sm">Tap "Add" or "Install" to confirm</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Once installed, Snowy Mts Weather opens full-screen like a native app — no browser bars, instant access from your home screen.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
