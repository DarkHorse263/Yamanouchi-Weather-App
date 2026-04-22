import { useGetRoadConditions } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { motion } from "framer-motion";
import { Car, MapPin, ExternalLink, AlertTriangle, ShieldAlert, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

function getStatusColor(condition: string) {
  switch (condition) {
    case "open": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "closed": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "chains-required": return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "caution": return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    case "reduced-speed": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    default: return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
  }
}

export default function RoadConditions() {
  const { data, isLoading, error, refetch } = useGetRoadConditions();

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Snowy mountain road" 
            className="w-full h-full object-cover opacity-40 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Car className="w-8 h-8 text-blue-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 drop-shadow-sm">
              Alpine Road <br className="hidden md:block"/>
              <span className="text-blue-300">Conditions</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 font-medium max-w-xl">
              Live updates on road statuses, chain requirements, and hazards for safe travel to the resorts.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-24">
        {isLoading ? (
          <div className="bg-card rounded-3xl shadow-xl p-12">
            <LoadingState message="Fetching live traffic updates..." />
          </div>
        ) : error || !data ? (
          <div className="bg-card rounded-3xl shadow-xl p-12">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-card p-6 rounded-3xl shadow-sm border border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Information provided by Live Traffic NSW</p>
                <p className="font-medium">Last updated: {format(parseISO(data.lastUpdated), "PPpp")}</p>
              </div>
              <a 
                href={data.liveTrafficUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-5 py-2.5 rounded-full font-semibold transition-colors"
              >
                View Map on Live Traffic
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-primary" />
                  Road Status
                </h2>
                
                <div className="grid gap-4">
                  {data.roads.map((road, idx) => (
                    <motion.div 
                      key={road.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-card p-6 rounded-2xl border border-border shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold font-display">{road.roadName}</h3>
                          <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Navigation className="w-4 h-4" />
                            {road.segment}
                          </p>
                        </div>
                        <div className={cn(
                          "px-4 py-1.5 rounded-full font-bold text-sm border uppercase tracking-wider text-center md:text-left whitespace-nowrap",
                          getStatusColor(road.condition)
                        )}>
                          {road.condition.replace("-", " ")}
                        </div>
                      </div>

                      <p className="text-foreground/90 leading-relaxed mb-4">{road.description}</p>
                      
                      {road.chainsRequired && (
                        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-800 dark:text-amber-200 mb-4">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Chains Required</p>
                            <p className="text-sm opacity-90">2WD vehicles must carry and fit chains where directed.</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
                        {road.affectedResorts?.map(resort => (
                          <span key={resort} className="bg-secondary px-3 py-1 rounded-md text-xs font-semibold text-secondary-foreground">
                            {resort}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-primary text-primary-foreground p-8 rounded-3xl shadow-lg">
                  <h2 className="text-2xl font-display font-bold mb-4">General Advice</h2>
                  <p className="text-primary-foreground/90 leading-relaxed">
                    {data.generalAdvice}
                  </p>
                </div>

                {data.chainFittingBays && data.chainFittingBays.length > 0 && (
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Chain Fitting Bays
                    </h3>
                    <div className="space-y-4">
                      {data.chainFittingBays.map((bay, i) => (
                        <div key={i} className="p-4 bg-muted/30 rounded-xl">
                          <p className="font-semibold">{bay.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{bay.location} ({bay.road})</p>
                          {bay.description && (
                            <p className="text-sm mt-2">{bay.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
