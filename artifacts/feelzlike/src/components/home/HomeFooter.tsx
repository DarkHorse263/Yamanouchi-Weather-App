import { Heart } from "lucide-react";

import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";
import { NewsletterSignup } from "../NewsletterSignup";

/**
 * Site-wide footer for the homepage.
 *
 * Apr 2026 reset:
 * - Brand mark now uses the actual wordmark image (consistent with the
 *   region headers + RegionPicker), not the plain "FeelZlike" text.
 * - "Today's Call" links removed - the route was retired in this reset.
 * - Browse list now points at the Sources page (the new region-level
 *   attribution surface) instead of the old `/today` placeholder.
 *
 * Privacy / Terms / Contact / Photo credits + "Built with care in
 * Australia" remain. Privacy is owned by the consent-banner skill;
 * Terms + Contact are placeholder mailto for now (TODO before public
 * launch).
 */
export function HomeFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-5 py-10 md:py-14 grid gap-8 md:grid-cols-5 text-sm">
        <div className="md:col-span-2">
          <img
            src={wordmark}
            alt="feelzlike"
            className="h-7 md:h-8 w-auto select-none"
            draggable={false}
          />
          <p className="mt-3 text-slate-600 max-w-md leading-relaxed text-[13px]">
            Real-time mountain weather, road and lift status, and live
            cams for the Snowy Mountains, Victoria's High Country and Yamanouchi. Built so you can
            decide where to go today.
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> in Australia
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-3">
            The digest
          </p>
          <p className="text-[12.5px] text-slate-600 leading-snug mb-3">
            A short read every fortnight on what the mountains are doing.
            No daily noise.
          </p>
          <NewsletterSignup source="footer" />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-3">
            Browse
          </p>
          <ul className="space-y-2 text-slate-700">
            <li><a className="hover:text-sky-700" href="/snowy-mountains/">Snowy Mountains</a></li>
            <li><a className="hover:text-sky-700" href="/yamanouchi/">Yamanouchi</a></li>
            <li><a className="hover:text-sky-700" href="/snowy-mountains/sources">Sources · AU</a></li>
            <li><a className="hover:text-sky-700" href="/yamanouchi/sources">Sources · JP</a></li>
            <li><a className="hover:text-sky-700" href="/snowy-mountains/alerts">Powder alerts</a></li>
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-3">
            About
          </p>
          <ul className="space-y-2 text-slate-700">
            {/* TODO(launch): wire real Privacy / Terms pages - currently the
                consent banner exposes preferences directly. */}
            <li><a className="hover:text-sky-700" href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("feelzlike:open-consent")); }}>Privacy & cookies</a></li>
            <li><a className="hover:text-sky-700" href="mailto:hello@feelzlike.com">Contact</a></li>
            <li><span className="text-slate-400">© {year} Navigate Work Digital - feelzlike</span></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
