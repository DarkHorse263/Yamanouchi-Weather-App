import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, X, Smartphone } from "lucide-react";
import { isStandaloneMode, isIOSSafari } from "@/lib/registerSW";
import { track } from "@/lib/analytics";
import { useConsent } from "@/lib/consent";
import { getRegion } from "@/regions";
import { LANGUAGE_STORAGE_KEY } from "@workspace/feelzlike-shell";

/**
 * PWA install prompt.
 *
 * Behaviour:
 *  - Android/Desktop Chrome: waits for `beforeinstallprompt`, then offers
 *    a one-tap Install button.
 *  - iOS Safari (no `beforeinstallprompt` support): shows the Share-icon
 *    instructions.
 *  - Hidden once installed (`display-mode: standalone` or iOS standalone).
 *  - Hidden once the user has accepted the install on this device.
 *  - Waits until the cookie consent banner has been decided, so the two
 *    bottom prompts never stack on a phone's first visit.
 *  - "Not now" / the X persist a dismissal for DISMISS_COOLDOWN_DAYS so the
 *    prompt doesn't nag every visit (it comes back after the cooldown until
 *    the app is installed).
 *  - On phones it sits ABOVE the fixed bottom nav (h-16 + safe-area inset)
 *    so navigation is never hidden behind it.
 */

const ACCEPTED_KEY = "feelzlike:installAccepted";
const DISMISSED_AT_KEY = "feelzlike:installDismissedAt";
const DISMISS_COOLDOWN_DAYS = 14;

function isDismissalActive(): boolean {
  const dismissedAt = readJSON<number | null>(DISMISSED_AT_KEY, null);
  if (typeof dismissedAt !== "number") return false;
  const ageMs = Date.now() - dismissedAt;
  return ageMs >= 0 && ageMs < DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Detect whether the visitor is currently on a Japan region with 日本語
 * selected. The prompt mounts outside LanguageProvider, so it reads the
 * app-wide preference directly while still checking that the current region
 * supports Japanese.
 * English everywhere else.
 */
function useJapaneseUi(): boolean {
  const [location] = useLocation();
  const seg = location.split("/").filter(Boolean)[0] ?? "";
  const region = getRegion(seg);
  if (!region?.language?.locales.includes("ja")) return false;
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "ja";
  } catch {
    return false;
  }
}

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
  const { hasDecided } = useConsent();
  const ja = useJapaneseUi();

  useEffect(() => {
    // Wait until the consent banner is out of the way so the two
    // bottom-anchored prompts never stack on a first visit.
    if (!hasDecided) return;
    // Already installed → never show
    if (isStandaloneMode()) return;
    // Previously accepted → never show again on this device
    if (readJSON<boolean>(ACCEPTED_KEY, false)) return;
    // Recently dismissed → stay quiet for the cooldown window
    if (isDismissalActive()) return;

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
  }, [hasDecided]);

  // Dismissing persists for DISMISS_COOLDOWN_DAYS so the prompt doesn't
  // reappear on every visit and hide the bottom navigation.
  const dismiss = () => {
    writeJSON(DISMISSED_AT_KEY, Date.now());
    track("install_prompt_dismissed", { category: "install", data: { platform: variant } });
    setShow(false);
  };

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
          aria-label={ja ? "FeelZlikeをホーム画面に追加" : "Add FeelZlike to your home screen"}
          className="fixed inset-x-3 bottom-[calc(var(--mobile-bottom-nav,0px)+0.75rem)] md:inset-x-auto md:right-4 md:bottom-4 md:max-w-sm z-[60]"
        >
          <div className="rounded-2xl bg-slate-900 text-white shadow-[0_24px_60px_-20px_rgba(2,6,23,0.6)] border border-white/10 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-sky-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  {ja ? "ホーム画面に追加" : "Add to home screen"}
                </p>
                <p className="mt-1 text-sm font-semibold text-white leading-snug">
                  {ja ? "パウダーの日を逃さない。" : "Never miss a powder day."}
                </p>
                {variant === "ios" ? (
                  <p className="mt-1.5 text-[12px] text-white/70 leading-relaxed">
                    {ja ? (
                      <>
                        共有 <Share className="w-3.5 h-3.5 inline-block mx-0.5 -mt-0.5 text-sky-300" />
                        をタップして、<span className="font-semibold text-white">「ホーム画面に追加」</span>を選択してください。
                      </>
                    ) : (
                      <>
                        Tap <Share className="w-3.5 h-3.5 inline-block mx-0.5 -mt-0.5 text-sky-300" />
                        Share, then <span className="font-semibold text-white">Add to Home Screen</span>.
                      </>
                    )}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[12px] text-white/70 leading-relaxed">
                    {ja
                      ? "FeelZlikeをインストールすると、すぐにアクセスでき、ロック画面でパウダーアラートを受け取れます。"
                      : "Install FeelZlike for instant access and powder alerts on your lock screen."}
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
                      {ja ? "インストール" : "Install"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={dismiss}
                    className="text-[12px] text-white/60 hover:text-white/90 px-2 py-1.5 transition-colors"
                  >
                    {ja ? "あとで" : "Not now"}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label={ja ? "インストール案内を閉じる" : "Dismiss install prompt"}
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
