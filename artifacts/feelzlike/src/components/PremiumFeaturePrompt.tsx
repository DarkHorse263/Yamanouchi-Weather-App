import { useState, useEffect } from "react";
import { Link } from "wouter";
import { BellRing, ArrowRight, X } from "lucide-react";
import { useAuthAccount } from "@/components/auth/SignUpProvider";
import { usePremium } from "@workspace/feelzlike-shell";
import { track } from "@/lib/analytics";

interface PremiumFeaturePromptProps {
  id: string;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  href?: string;
  className?: string;
}

export function PremiumFeaturePrompt({
  id,
  icon: Icon = BellRing,
  title,
  blurb,
  href = "/premium",
  className = "",
}: PremiumFeaturePromptProps) {
  const { isAuthenticated } = useAuthAccount();
  const { isPremium, isPromoPeriod } = usePremium();
  
  // We use localStorage to ensure it's "never naggy".
  const dismissKey = `feelzlike:premiumPrompt:${id}`;
  const [dismissed, setDismissed] = useState(true); // default true to avoid hydration flicker
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(dismissKey) === "1");
    } catch {
      setDismissed(false);
    }
    setMounted(true);
  }, [dismissKey]);

  // Don't nag them if they dismissed it, or if they are already signed in.
  if (!mounted || dismissed || isAuthenticated) return null;
  
  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      window.localStorage.setItem(dismissKey, "1");
    } catch {}
    setDismissed(true);
    track("premium_prompt_dismissed", { category: "alert", data: { id } });
  };
  
  return (
    <div className={`relative ${className}`}>
      <Link href={href} className="block rounded-2xl bg-white border border-border p-4 hover:border-primary/50 transition-colors group">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0055FF]/10 text-[#0055FF] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
              {title}
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#0055FF]" />
            </p>
            <p className="text-sm text-slate-600 mt-0.5 leading-snug font-medium">
              {blurb}
            </p>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
