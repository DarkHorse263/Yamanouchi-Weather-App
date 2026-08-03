import { useState } from "react";
import { Link } from "wouter";
import { Sparkles, X, ArrowUpRight } from "lucide-react";
import { WHATS_NEW, LATEST_WHATS_NEW_ID } from "@/data/whatsNew";
import { readLastTown } from "@/lib/favouriteRegion";
import { track } from "@/lib/analytics";

/**
 * WhatsNewNote · a small one-time dismissible note on the home page telling
 * returning visitors something changed, linking to the full list on /about.
 *
 * Rules (per the "never nags" brief):
 * - Returning visitors only · first-time visitors have no baseline to compare
 *   against, so anyone without a saved last town never sees it.
 * - Seen-tracking is per-entry, not a cooldown: dismissing (or opening the
 *   list) stores the newest entry id in localStorage and the note stays gone
 *   until a genuinely new entry lands in src/data/whatsNew.ts.
 * - localStorage reads/writes are wrapped in try/catch (Safari private mode
 *   etc.) · on failure we fail quiet and show nothing rather than nag.
 */

const SEEN_KEY = "feelzlike:whatsNewSeenId";

function shouldShow(): boolean {
  if (!LATEST_WHATS_NEW_ID) return false;
  try {
    // returning visitors only
    if (!readLastTown()) return false;
    return window.localStorage.getItem(SEEN_KEY) !== LATEST_WHATS_NEW_ID;
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, LATEST_WHATS_NEW_ID);
  } catch {
    /* noop · private mode etc. */
  }
}

export function WhatsNewNote() {
  const [visible, setVisible] = useState(shouldShow);

  if (!visible) return null;

  const latest = WHATS_NEW[0];

  const dismiss = () => {
    markSeen();
    setVisible(false);
    track("whats_new_dismissed", { category: "ui" });
  };

  return (
    <div className="px-6 pb-2">
      <div
        className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left"
        data-testid="banner-whats-new"
      >
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-white/80" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold lowercase tracking-wider text-white/70">
            what&rsquo;s new
          </p>
          <p className="mt-0.5 text-[13px] font-medium lowercase leading-snug text-white/90">
            {latest.text}
          </p>
          <Link
            href="/about#whats-new"
            onClick={() => {
              markSeen();
              track("whats_new_clicked", { category: "navigation" });
            }}
            className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold lowercase text-white underline underline-offset-2 hover:text-white/80"
            data-testid="link-whats-new"
          >
            see everything new
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="dismiss what's new note"
          className="shrink-0 text-white/50 transition-colors hover:text-white"
          data-testid="button-whats-new-dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
