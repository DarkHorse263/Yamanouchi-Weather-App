import { Link } from "wouter";
import { ArrowRight, Map } from "lucide-react";

interface HomeRegionCardViewProps {
  isAuthenticated: boolean;
  region: { id: string; name: string } | null;
  feelsLike: string | null;
  isLoading: boolean;
  onNavigate?: () => void;
}

export function HomeRegionCardView({
  isAuthenticated,
  region,
  feelsLike,
  isLoading,
  onNavigate,
}: HomeRegionCardViewProps) {
  if (!isAuthenticated || !region) return null;

  return (
    <div className="mx-4 mb-6 overflow-hidden rounded-2xl bg-white text-[#0055FF] shadow-xl md:mx-6">
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <Map className="h-3.5 w-3.5" />
          your home region
        </div>
        <p className="mt-1 text-[18px] font-semibold leading-tight text-slate-900 md:text-[20px]">
          {region.name.toLowerCase()}
        </p>

        {isLoading ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <Link
            href={`/${region.id}/`}
            onClick={onNavigate}
            className="group mt-3 flex items-center gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                {feelsLike !== null && (
                  <>
                    <span className="text-3xl font-bold leading-none tabular-nums text-[#0055FF]">
                      {feelsLike}&deg;
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      feelzlike
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#0055FF]">
                see full forecast &amp; radar
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}