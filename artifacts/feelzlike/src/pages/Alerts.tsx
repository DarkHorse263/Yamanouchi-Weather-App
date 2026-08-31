import { Link } from "wouter";
import { ArrowLeft, BellRing } from "lucide-react";
import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";
import { PageMeta } from "@/lib/seo/PageMeta";

export default function Alerts() {
  return (
    <div className="min-h-[100dvh] bg-[#0055FF] text-white">
      <PageMeta
        title="powder alerts · feelzlike"
        description="Set a snowfall threshold for the ski regions and mountains you care about. Powder alerts are a standard feelzlike feature with no account required."
        path="/alerts"
      />
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-bold text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          back
        </Link>

        <header className="mb-6">
          <p className="byline uppercase text-white/75">standard feature · no account needed</p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-white md:text-5xl">
            <BellRing className="h-8 w-8 md:h-10 md:w-10" />
            powder alerts
          </h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-white/80">
            choose your regions or mountains and set the snowfall threshold that matters to you.
            we'll email only when the forecast reaches it.
          </p>
        </header>

        <AlertSubscribeForm />
      </main>
    </div>
  );
}