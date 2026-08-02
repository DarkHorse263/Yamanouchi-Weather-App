import { useState } from "react";
import { ChevronDown, Shield } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useUnitsControl } from "@/components/auth/UserPrefsProvider";

/**
 * Site-wide footer for the homepage.
 *
 * May 2026 reset:
 * - Compacted to a single centered row · tagline, description paragraph
 *   and "built with heart" line were dropping unnecessary vertical weight
 *   on mobile and overshadowing the home content above.
 * - Links collapsed to inline middot-separated row. Sources stays as a
 *   small dropdown so per-region attribution is one click away.
 * - Padding halved (py-5 md:py-6) so the footer no longer dominates short
 *   pages like Welcome and Countries.
 */
export function HomeFooter() {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  // Soft-render the admin link only for signed-in users. The /admin page
  // itself does the real authorization check (server-side allowlist), so this
  // is purely UI hygiene · non-admins simply never see the link.
  const { isAuthenticated } = useAuth();
  const { units, fromAccount, setLocalUnits } = useUnitsControl();

  const linkCls = "text-white/80 hover:text-white transition-colors";
  const sep = <span className="text-white/30" aria-hidden>&middot;</span>;

  return (
    <footer className="relative z-10 border-t border-white/20 bg-[#0055FF]">
      <div className="mx-auto max-w-3xl px-5 py-5 md:py-6 text-center text-[12px] md:text-[13px]">
        <nav
          aria-label="footer"
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 leading-relaxed"
        >
          <a className={linkCls} href="/legal/privacy">privacy</a>
          {sep}
          <a className={linkCls} href="/legal/terms">terms</a>
          {sep}
          <a
            className={linkCls}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("feelzlike:open-consent"));
            }}
          >
            cookies
          </a>
          {sep}
          <a className={linkCls} href="mailto:info@feelzlike.com">contact</a>
          {sep}
          <a className={linkCls} href="/account">account</a>
          {sep}
          <div className="relative inline-flex items-baseline">
            <button
              type="button"
              onClick={() => setSourcesOpen((v) => !v)}
              aria-expanded={sourcesOpen}
              className={`${linkCls} inline-flex items-center gap-0.5`}
            >
              sources
              <ChevronDown
                className={`h-3 w-3 transition-transform ${sourcesOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
          </div>
          {isAuthenticated && (
            <>
              {sep}
              <a className={`${linkCls} inline-flex items-center gap-1`} href="/admin">
                <Shield className="h-3 w-3" aria-hidden />
                admin
              </a>
            </>
          )}
        </nav>

        {sourcesOpen && (
          <ul className="mx-auto mt-3 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg bg-white/10 px-4 py-2 text-[11.5px] text-white/80 border border-white/20">
            <li><a className="hover:text-white" href="/snowy-mountains/sources">snowy mountains &middot; au</a></li>
            <li aria-hidden className="text-white/30">&middot;</li>
            <li><a className="hover:text-white" href="/victorias-high-country/sources">victoria&rsquo;s high country &middot; au</a></li>
            <li aria-hidden className="text-white/30">&middot;</li>
            <li><a className="hover:text-white" href="/yamanouchi/sources">yamanouchi &middot; jp</a></li>
          </ul>
        )}

        {!fromAccount && (
          <div className="mt-3 inline-flex items-center gap-1 text-[11.5px]">
            <span className="text-white/60 mr-1">units</span>
            <div
              role="group"
              aria-label="units"
              className="inline-flex overflow-hidden rounded-full border border-white/30 bg-white/10"
            >
              {(["metric", "imperial"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={units === u}
                  onClick={() => setLocalUnits(u)}
                  className={`px-2.5 py-1 transition-colors ${
                    units === u
                      ? "bg-white text-[#0055FF] font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/20"
                  }`}
                >
                  {u === "metric" ? "°c · km/h" : "°f · mph"}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-white/50">
          &copy; 2026 Navigate Work Digital
        </p>
        <p className="mt-1.5 text-[11px] text-white/50 max-w-xl mx-auto leading-relaxed">
          some links to accommodation and travel partners are affiliate links
          &middot; we may earn a commission if you book through them &middot;
          this never changes the price you pay.{" "}
          <a className="hover:text-white underline underline-offset-2" href="/legal/terms#affiliate-links">
            more
          </a>
        </p>
      </div>
    </footer>
  );
}
