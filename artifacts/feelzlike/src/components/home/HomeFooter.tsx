import { useState } from "react";
import { ChevronDown, Shield } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

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
  const year = new Date().getFullYear();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  // Soft-render the admin link only for signed-in users. The /admin page
  // itself does the real authorization check (server-side allowlist), so this
  // is purely UI hygiene · non-admins simply never see the link.
  const { isAuthenticated } = useAuth();

  const linkCls = "text-slate-600 hover:text-sky-700 transition-colors";
  const sep = <span className="text-slate-300" aria-hidden>&middot;</span>;

  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white">
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
          <a className={linkCls} href="mailto:enquiries@navigatework.com.au">contact</a>
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
          <ul className="mx-auto mt-3 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg bg-slate-50 px-4 py-2 text-[11.5px] text-slate-600">
            <li><a className="hover:text-sky-700" href="/snowy-mountains/sources">snowy mountains &middot; au</a></li>
            <li aria-hidden className="text-slate-300">&middot;</li>
            <li><a className="hover:text-sky-700" href="/victorias-high-country/sources">victoria&rsquo;s high country &middot; au</a></li>
            <li aria-hidden className="text-slate-300">&middot;</li>
            <li><a className="hover:text-sky-700" href="/yamanouchi/sources">yamanouchi &middot; jp</a></li>
          </ul>
        )}

        <p className="mt-3 text-[11px] text-slate-400">
          &copy; {year} Navigate Work Digital &middot; feelzlike
        </p>
        <p className="mt-1.5 text-[11px] text-slate-400 max-w-xl mx-auto leading-relaxed">
          some links to accommodation and travel partners are affiliate links
          &middot; we may earn a commission if you book through them &middot;
          this never changes the price you pay.{" "}
          <a className="hover:text-sky-700 underline underline-offset-2" href="/legal/terms#affiliate-links">
            more
          </a>
        </p>
      </div>
    </footer>
  );
}
