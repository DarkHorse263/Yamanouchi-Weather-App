import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGetBusServices } from "@workspace/api-client-react";
import { Bus, Phone, Globe, ArrowRight, CalendarCheck } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

export function TownTransport() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const query = useGetBusServices();

  const routes = useMemo(() => {
    if (!query.data || !town) return [];
    const townName = town.name.toLowerCase();
    return query.data.routes.filter((r) => {
      const stops = (r.stops ?? []).some((s) => s.toLowerCase().includes(townName));
      const inName = r.name?.toLowerCase().includes(townName) || r.description?.toLowerCase().includes(townName);
      const sched = (r.schedule ?? []).some(
        (s) =>
          s.from?.toLowerCase().includes(townName) ||
          s.to?.toLowerCase().includes(townName),
      );
      return stops || inName || sched;
    });
  }, [query.data, town]);

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">
              {region.name} · {town ? t(town.name, town.nameJa) : t("Town", "町")}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t("Transport", "交通")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                `Buses, shuttles and trains serving ${town?.name ?? "town"}.`,
                `${town ? t(town.name, town.nameJa) : "町"}を発着するバス・送迎・電車。`,
              )}
            </p>
          </div>
          <LiveBadge label={query.isFetching ? t("Loading", "読込中") : t("Schedules", "時刻表")} />
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {query.isError && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm">{t("Couldn't load transport info.", "交通情報を読み込めませんでした。")}</p>
        </div>
      )}

      {query.isLoading && <TransportSkeleton />}

      {!query.isLoading && query.data && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Provider sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-5">
              <p className="byline text-muted-foreground/70">{t("Provider", "運行会社")}</p>
              <h2 className="font-display font-semibold text-lg text-foreground mt-1">{query.data.provider}</h2>
              <div className="mt-4 space-y-2">
                {query.data.phone && (
                  <a
                    href={`tel:${query.data.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    {query.data.phone}
                  </a>
                )}
                {query.data.website && (
                  <a
                    href={query.data.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4 text-primary" />
                    {t("Visit website", "ウェブサイト")}
                  </a>
                )}
              </div>
            </div>

            {query.data.bookingInfo && (
              <div className="rounded-2xl border border-border bg-white p-5">
                <h3 className="font-display font-semibold text-sm text-foreground inline-flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                  {t("Booking", "予約")}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{query.data.bookingInfo}</p>
              </div>
            )}
          </aside>

          {/* Routes */}
          <div className="space-y-4">
            {routes.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white p-8 text-center">
                <Bus className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground mt-3">
                  {t(
                    `No routes serving ${town?.name ?? "this town"} found.`,
                    `${town ? t(town.name, town.nameJa) : "この町"}を発着する路線は見つかりませんでした。`,
                  )}
                </p>
              </div>
            ) : (
              routes.map((route, idx) => (
                <motion.article
                  key={route.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border border-border bg-white p-5"
                >
                  <h3 className="font-display font-semibold text-lg text-foreground">{route.name}</h3>
                  {route.description && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{route.description}</p>
                  )}

                  {route.stops && route.stops.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1.5">
                      {route.stops.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-md font-medium ${
                              s.toLowerCase().includes(town!.name.toLowerCase())
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {s}
                          </span>
                          {i < route.stops!.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {route.schedule && route.schedule.length > 0 && (
                    <div className="mt-4 rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-secondary/50">
                          <tr className="text-left text-muted-foreground">
                            <th className="px-3 py-2 font-semibold">{t("Depart", "出発")}</th>
                            <th className="px-3 py-2 font-semibold">{t("Arrive", "到着")}</th>
                            <th className="px-3 py-2 font-semibold">{t("From → To", "発 → 着")}</th>
                            <th className="px-3 py-2 font-semibold">{t("Days", "運行日")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {route.schedule.map((s, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="px-3 py-2 font-mono font-semibold">{s.departure}</td>
                              <td className="px-3 py-2 font-mono">{s.arrival}</td>
                              <td className="px-3 py-2 text-muted-foreground">{s.from} → {s.to}</td>
                              <td className="px-3 py-2 text-muted-foreground">{s.days}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {route.notes && (
                    <p className="text-xs text-muted-foreground mt-3 italic">{route.notes}</p>
                  )}
                </motion.article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TransportSkeleton() {
  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="rounded-2xl border border-border bg-white p-5 h-40 animate-pulse" />
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5">
            <div className="h-5 w-1/3 rounded bg-secondary animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-secondary animate-pulse mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
