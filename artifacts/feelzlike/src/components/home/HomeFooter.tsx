import { Heart } from "lucide-react";

/**
 * Site-wide footer for the homepage. Per playbook 6.1 we want Privacy /
 * Terms / Contact / Photo credits / "Built with care in Australia". Privacy
 * is owned by the consent-banner skill; Terms + Contact are placeholder
 * mailto for now (TODO before public launch).
 */
export function HomeFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-5 py-10 md:py-14 grid gap-8 md:grid-cols-4 text-sm">
        <div className="md:col-span-2">
          <p
            className="text-lg text-slate-900 font-bold tracking-tight"
            style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}
          >
            FeelZlike
          </p>
          <p className="mt-2 text-slate-600 max-w-md leading-relaxed text-[13px]">
            Hand-built for skiers and snowboarders in NSW and Nagano.
            Real-time mountain weather, curated stays and eats, powder
            alerts — all in one place.
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> in Australia
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-3">
            Browse
          </p>
          <ul className="space-y-2 text-slate-700">
            <li><a className="hover:text-sky-700" href="/snowy-mountains/">Snowy Mountains</a></li>
            <li><a className="hover:text-sky-700" href="/yamanouchi/">Yamanouchi</a></li>
            <li><a className="hover:text-sky-700" href="/snowy-mountains/today">Today's Call · AU</a></li>
            <li><a className="hover:text-sky-700" href="/yamanouchi/today">Today's Call · JP</a></li>
            <li><a className="hover:text-sky-700" href="/snowy-mountains/alerts">Powder alerts</a></li>
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-3">
            About
          </p>
          <ul className="space-y-2 text-slate-700">
            {/* TODO(launch): wire real Privacy / Terms pages — currently the
                consent banner exposes preferences directly. */}
            <li><a className="hover:text-sky-700" href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("feelzlike:open-consent")); }}>Privacy & cookies</a></li>
            <li><a className="hover:text-sky-700" href="mailto:hello@feelzlike.com">Contact</a></li>
            <li><a className="hover:text-sky-700" href="mailto:photos@feelzlike.com">Photo credits</a></li>
            <li><span className="text-slate-400">© {year} FeelZlike</span></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
