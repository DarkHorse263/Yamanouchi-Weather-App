import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, X, Smartphone } from "lucide-react";
import { isStandaloneMode, isIOSSafari } from "@/lib/registerSW";
import { track } from "@/lib/analytics";

/**
 * PWA install prompt - shown on every visit until the app is installed.
 *
 * Behaviour:
 *  - Android/Desktop Chrome: waits for `beforeinstallprompt`, then offers
 *    a one-tap Install button.
 *  - iOS Safari (no `beforeinstallprompt` support): shows the Share-icon
 *    instructions every visit.
 *  - Hidden once installed (`display-mode: standalone` or iOS standalone).
 *  - Hidden once the user has accepted the install on this device.
 *  - "Not now" only closes the prompt for the current page - it reappears
 *    on the next fresh page load until the app is actually installed.
 *    (Earlier behaviour gated on 3+ visits and a 30-day dismissal cooldown;
 *    those have been removed so the prompt is impossible to miss while we
 *    drive install adoption.)
 */

const ACCEPTED_KEY = "feelzlike:installAccepted";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown): void {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [variant, setVariant] = useState<"android" | "ios">("android");
  const [bipEvent, setBipEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed → never show
    if (isStandaloneMode()) return;
    // Previously accepted → never show again on this device
    if (readJSON<boolean>(ACCEPTED_KEY, false)) return;

    if (isIOSSafari()) {
      setVariant("ios");
      setShow(true);
      track("install_prompt_shown", { category: "install", data: { platform: "ios" } });
      return;
    }

    // Android / Desktop Chrome path: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setBipEvent(e as BeforeInstallPromptEvent);
      setVariant("android");
      setShow(true);
      track("install_prompt_shown", { category: "install", data: { platform: "android" } });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // "Not now" just closes for the current page render. We deliberately do
  // not persist a dismissal - the prompt should reappear next visit until
  // the user actually installs.
  const dismiss = () => setShow(false);

  const install = async () => {
    if (!bipEvent) return;
    try {
      await bipEvent.prompt();
      const { outcome } = await bipEvent.userChoice;
      track("install_prompt_result", { category: "install", data: { outcome } });
      if (outcome === "accepted") {
        writeJSON(ACCEPTED_KEY, true);
      }
    } catch {
      /* swallow - the prompt closes either way */
    } finally {
      setBipEvent(null);
      setShow(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-label="Add FeelZlike to your home screen"
          className="fixed inset-x-3 bottom-3 sm:inset-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[60]"
        >
          <div className="rounded-2xl bg-slate-900 text-white shadow-[0_24px_60px_-20px_rgba(2,6,23,0.6)] border border-white/10 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-sky-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Add to home screen
                </p>
                <p className="mt-1 text-sm font-semibold text-white leading-snug">
                  Never miss a powder day.
                </p>
                {variant === "ios" ? (
                  <p className="mt-1.5 text-[12px] text-white/70 leading-relaxed">
                    Tap <Share className="w-3.5 h-3.5 inline-block mx-0.5 -mt-0.5 text-sky-300" />
                    Share, then <span className="font-semibold text-white">Add to Home Screen</span>.
                  </p>
                ) : (
                  <p className="mt-1.5 text-[12px] text-white/70 leading-relaxed">
                    Install FeelZlike for instant access and powder alerts on your lock screen.
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {variant === "android" && (
                    <button
                      type="button"
                      onClick={install}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 px-3 py-1.5 text-[12px] font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Install
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={dismiss}
                    className="text-[12px] text-white/60 hover:text-white/90 px-2 py-1.5 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss install prompt"
                className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
