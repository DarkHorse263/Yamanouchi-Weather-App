import { Link } from "wouter";
import { MountainSnow } from "lucide-react";
import { PageMeta } from "@/lib/seo/PageMeta";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0055FF] px-4 py-12 text-center text-white">
      <PageMeta title="page not found" description="This page doesn't exist. Return to feelzlike to find your next mountain." noIndex />
      <main className="max-w-md space-y-5">
        <MountainSnow className="mx-auto h-14 w-14 text-white/80" aria-hidden="true" />
        <p className="text-sm font-bold uppercase tracking-widest text-white/70">404 · off piste</p>
        <h1 className="text-4xl font-black">page not found</h1>
        <p className="text-white/80">Looks like you skied out of bounds. This page doesn't exist.</p>
        <Link href="/" data-testid="link-not-found-home" className="inline-flex rounded-xl bg-white px-6 py-3 font-bold text-[#0055FF] hover:bg-white/90">
          back to the snow
        </Link>
      </main>
    </div>
  );
}
