import { useGetWeather } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LocationCard } from "@/components/weather/LocationCard";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useGetWeather();

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Snowy mountain peaks" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 drop-shadow-sm">
              Snowy Mountains <br className="hidden md:block"/>
              <span className="text-blue-300">Weather Report</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 font-medium max-w-xl">
              Live conditions, snow depths, and 7-day forecasts for Thredbo, Perisher, Charlotte's Pass, and Jindabyne.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-24">
        {isLoading ? (
          <div className="bg-card rounded-3xl shadow-xl p-12">
            <LoadingState message="Fetching latest resort conditions..." />
          </div>
        ) : error ? (
          <div className="bg-card rounded-3xl shadow-xl p-12">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data?.locations.map((loc, idx) => (
              <LocationCard key={loc.location.id} data={loc} index={idx} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
