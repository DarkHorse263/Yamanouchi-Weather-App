import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";
import type { ReactNode } from "react";

/**
 * Shared chrome for the standalone /legal/* pages (privacy, terms).
 * Keeps these pages light · no region context, no season, no shell.
 * They render under the top-level App router so they're reachable from
 * any country / region / town footer link.
 */
export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-sky-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <Link href="/" className="inline-flex items-center">
            <img
              src={wordmark}
              alt="feelzlike"
              className="h-6 w-auto select-none"
              draggable={false}
            />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 md:py-10">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-sky-700">
          Legal
        </p>
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-slate-900 mt-2">
          {title}
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Last updated · {lastUpdated}
        </p>

        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-slate-800">
          {children}
        </div>

        <div className="mt-9 pt-5 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
          <Link href="/legal/privacy" className="hover:text-sky-700">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-sky-700">
            Terms
          </Link>
          <a
            href="mailto:enquiries@navigatework.com.au"
            className="hover:text-sky-700"
          >
            Contact
          </a>
          <Link href="/" className="hover:text-sky-700">
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display font-semibold text-xl text-slate-900">
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
