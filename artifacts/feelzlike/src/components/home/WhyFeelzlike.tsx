import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, BedDouble, BellRing, X } from "lucide-react";

/**
 * "Why FeelZlike" value-prop section. Per playbook 6.1, this should ONLY
 * render for first-time visitors (cookie-gated) so returning users — who
 * already know the value — see a cleaner, denser homepage.
 *
 * Implementation:
 *  - On mount: read `feelzlike:hasSeenWhy` from localStorage. If absent,
 *    render the section AND mark it seen. If present, render nothing.
 *  - Visitors can also dismiss explicitly via the X button — same outcome.
 *  - Renders nothing during SSR / before useEffect to avoid hydration flicker.
 */
const SEEN_KEY = "feelzlike:hasSeenWhy";

export function WhyFeelzlike() {
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(SEEN_KEY);
      if (seen === "1") {
        setShow(false);
      } else {
        setShow(true);
        window.localStorage.setItem(SEEN_KEY, "1");
      }
    } catch {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    try { window.localStorage.setItem(SEEN_KEY, "1"); } catch { /* noop */ }
    setShow(false);
  };

  if (show !== true) return null;

  const items = [
    {
      icon: ShieldCheck,
      title: "Live conditions you can trust",
      body: "Direct from BOM, JMA, NSW Live Traffic + a six-source forecast ensemble. Never a single guess.",
      tone: "text-sky-600 bg-sky-50",
    },
    {
      icon: BedDouble,
      title: "Stays curated for skiers",
      body: "Every property hand-checked for ski access, baths, tattoo policy, family fit — not algorithmic.",
      tone: "text-rose-600 bg-rose-50",
    },
    {
      icon: BellRing,
      title: "Powder alerts when it counts",
      body: "Email + browser push the moment forecast snowfall meets your threshold. No noise.",
      tone: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-5 mt-12 md:mt-16">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 md:p-10 shadow-[0_30px_60px_-30px_rgba(2,6,23,0.55)]"
      >
        <button
          onClick={dismiss}
          aria-label="Dismiss intro"
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300 mb-3">
          New here · why FeelZlike
        </p>
        <h2 className="text-2xl md:text-3xl font-bold leading-tight max-w-2xl" style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}>
          Three things make this different from every other ski app.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${it.tone}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <p className="mt-3 text-sm font-bold text-white">{it.title}</p>
                <p className="mt-1.5 text-[12px] text-white/70 leading-relaxed">{it.body}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
