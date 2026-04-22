import { useGetLiftStatus } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { motion } from "framer-motion";
import { Cable, ExternalLink, Clock, MountainSnow, Activity, CheckCircle2, XCircle, AlertCircle, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

function getStatusColor(status: string) {
  switch (status) {
    case "open": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "closed": return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
    case "wind-hold": return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "on-hold": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "scheduled": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    default: return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "open": return <CheckCircle2 className="w-4 h-4" />;
    case "closed": return <XCircle className="w-4 h-4" />;
    case "wind-hold": return <Wind className="w-4 h-4" />;
    case "on-hold": return <AlertCircle className="w-4 h-4" />;
    case "scheduled": return <Clock className="w-4 h-4" />;
    default: return null;
  }
}

export default function LiftStatus() {
  const { data, isLoading, error, refetch } = useGetLiftStatus();

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Ski Lifts" 
            className="w-full h-full object-cover opacity-60"
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
                <Cable className="w-8 h-8 text-blue-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 drop-shadow-sm">
              Lift & Trail <br className="hidden md:block"/>
              <span className="text-blue-300">Status</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 font-medium max-w-xl">
              Live operating status for all ski lifts and terrain across the Snowy Mountains resorts.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-24">
        {isLoading ? (
          <div className="bg-card rounded-3xl shadow-xl p-12">
            <LoadingState message="Fetching current lift operations..." />
          </div>
        ) : error || !data ? (
          <div className="bg-card rounded-3xl shadow-xl p-12">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : (
          <div className="space-y-12">
            {data.resorts.map((resort, idx) => (
              <motion.section 
                key={resort.locationId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm"
              >
                {/* Resort Header */}
                <div className="bg-muted/30 border-b border-border p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-display font-bold">{resort.locationName}</h2>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                        resort.seasonStatus === 'open' ? "bg-green-500/10 text-green-700 border-green-500/20" :
                        "bg-amber-500/10 text-amber-700 border-amber-500/20"
                      )}>
                        {resort.seasonStatus.replace('-', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
                      {resort.operatingHours && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {resort.operatingHours}
                        </div>
                      )}
                      {resort.snowCondition && (
                        <div className="flex items-center gap-1.5">
                          <MountainSnow className="w-4 h-4" />
                          {resort.snowCondition}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="bg-background px-4 py-3 rounded-2xl border border-border flex-1 md:flex-none flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Cable className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Lifts Open</p>
                        <p className="text-xl font-display font-bold leading-none">
                          <span className="text-primary">{resort.liftsOpen}</span>
                          <span className="text-muted-foreground text-base">/{resort.totalLifts}</span>
                        </p>
                      </div>
                    </div>
                    
                    {(resort.runsOpen !== undefined && resort.totalRuns !== undefined) && (
                      <div className="bg-background px-4 py-3 rounded-2xl border border-border flex-1 md:flex-none flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                          <Activity className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase">Runs Open</p>
                          <p className="text-xl font-display font-bold leading-none">
                            <span className="text-blue-500">{resort.runsOpen}</span>
                            <span className="text-muted-foreground text-base">/{resort.totalRuns}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lifts List */}
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resort.lifts.map(lift => (
                      <div key={lift.id} className="bg-background border border-border rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold font-display">{lift.name}</h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{lift.type.replace('-', ' ')}</p>
                          </div>
                          <div className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap",
                            getStatusColor(lift.status)
                          )}>
                            {getStatusIcon(lift.status)}
                            <span className="hidden sm:inline-block capitalize">{lift.status.replace('-', ' ')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium pt-3 border-t border-border/50">
                          {lift.openingTime && lift.closingTime && (
                            <span>{lift.openingTime} - {lift.closingTime}</span>
                          )}
                          {lift.verticalRise && (
                            <span>{lift.verticalRise}m vert</span>
                          )}
                          {lift.difficulty && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded capitalize",
                              lift.difficulty === 'beginner' ? 'bg-green-500/10 text-green-700' :
                              lift.difficulty === 'intermediate' ? 'bg-blue-500/10 text-blue-700' :
                              lift.difficulty === 'advanced' ? 'bg-black text-white dark:bg-white dark:text-black' :
                              'bg-muted text-muted-foreground'
                            )}>
                              {lift.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {resort.liftStatusUrl && (
                    <div className="mt-8 flex justify-center">
                      <a 
                        href={resort.liftStatusUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground px-6 py-3 rounded-full font-semibold transition-colors"
                      >
                        View Official Resort Status
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
