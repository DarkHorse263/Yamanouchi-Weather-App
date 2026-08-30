import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useJapaneseUi } from "@/hooks/useJapaneseUi";

/**
 * Tiny "you're offline" banner. Slides down from the top when the browser
 * fires `offline`, hides on `online`. The SW continues to serve cached
 * weather + region data so the page itself doesn't go blank - this banner
 * just acknowledges the state so users understand stale-looking timestamps.
 *
 * navigator.onLine isn't perfectly reliable (it's `false` when the radio is
 * off, `true` even on captive-portal Wi-Fi), but combined with the
 * `online`/`offline` events it's good enough for a UX hint.
 */
export function OfflineBanner() {
  const ja = useJapaneseUi();
  const [offline, setOffline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-[70] bg-amber-500 text-amber-950 text-[12px] font-semibold py-2 px-4 flex items-center justify-center gap-2 shadow-md"
        >
          <WifiOff className="w-3.5 h-3.5" />
          {ja ? "オフラインです。最後に保存されたコンディションを表示しています。" : "You're offline - showing last cached conditions."}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
