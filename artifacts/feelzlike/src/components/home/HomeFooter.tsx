import { useState } from "react";
import { ChevronDown, Heart } from "lucide-react";

import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Site-wide footer for the homepage.
 *
 * May 2026 reset:
 * - "Browse" column dropped (regions are reachable from the picker above).
 * - "Sources" links collapsed into a single dropdown under About so the
 *   per-region attribution pages are still one click away without taking
 *   the visual weight of a column.
 * - Contact mailto points at enquiries@navigatework.com.au (the operating
 *   business inbox), not the placeholder hello@feelzlike.com.
 */
export function HomeFooter() {
  const year = new Date().getFullYear();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-5 py-10 md:py-14 grid gap-8 md:grid-cols-2 text-sm">
        <div>
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
            About
          </p>
          <ul className="space-y-2 text-slate-700">
            {/* TODO(launch): wire real Privacy / Terms pages - currently the
                consent banner exposes preferences directly. */}
            <li>
              <a
                className="hover:text-sky-700"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("feelzlike:open-consent"));
                }}
              >
                Privacy & cookies
              </a>
            </li>
            <li>
              <a
                className="hover:text-sky-700"
                href="mailto:enquiries@navigatework.com.au"
              >
                Contact
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setSourcesOpen((v) => !v)}
                aria-expanded={sourcesOpen}
                className="inline-flex items-center gap-1 hover:text-sky-700"
              >
                Sources
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${sourcesOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {sourcesOpen && (
                <ul className="mt-2 ml-3 space-y-1.5 text-[12.5px] text-slate-600 border-l border-slate-200 pl-3">
                  <li>
                    <a className="hover:text-sky-700" href="/snowy-mountains/sources">
                      Snowy Mountains · AU
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-sky-700" href="/victorias-high-country/sources">
                      Victoria's High Country · AU
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-sky-700" href="/yamanouchi/sources">
                      Yamanouchi · JP
                    </a>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <span className="text-slate-400">
                © {year} Navigate Work Digital · feelzlike
              </span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
