import { useGetBusServices } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { BusRouteCard } from "@/components/bus/BusRouteCard";
import { motion } from "framer-motion";
import { Phone, Globe, CalendarCheck } from "lucide-react";

export default function BusServices() {
  const { data, isLoading, error, refetch } = useGetBusServices();

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white border-b-4 border-primary">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/bus-hero.png`}
            alt="Mountain Bus Service" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/20 text-blue-300 border border-blue-400/30 text-sm font-bold tracking-wider mb-4 uppercase">
              Transit Info
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6 leading-tight">
              Snowy Mountains <br/>Bus Services
            </h1>
            <p className="text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
              Skip the snowy drive and parking hassle. Find schedules and routes for Cooma Coaches connecting Jindabyne with all major ski resorts.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {isLoading ? (
          <LoadingState message="Loading transit schedules..." />
        ) : error || !data ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            
            {/* Info Sidebar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:w-1/3 shrink-0 space-y-6"
            >
              <div className="bg-primary text-primary-foreground p-8 rounded-3xl shadow-lg">
                <h2 className="text-2xl font-display font-bold mb-6">Service Provider</h2>
                <p className="text-primary-foreground/90 font-medium text-lg mb-8">{data.provider}</p>
                
                <div className="space-y-4">
                  <a href={`tel:${data.phone}`} className="flex items-center gap-4 hover:bg-black/10 p-3 rounded-xl transition-colors">
                    <div className="p-2 bg-white/20 rounded-full">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">{data.phone}</span>
                  </a>
                  
                  <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:bg-black/10 p-3 rounded-xl transition-colors">
                    <div className="p-2 bg-white/20 rounded-full">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="font-semibold break-all">Visit Website</span>
                  </a>
                </div>
              </div>

              {data.bookingInfo && (
                <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
                  <h3 className="font-display font-bold text-xl flex items-center gap-2 mb-4">
                    <CalendarCheck className="w-5 h-5 text-primary" />
                    Booking Info
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {data.bookingInfo}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Routes List */}
            <div className="w-full lg:w-2/3 space-y-6">
              <h2 className="text-3xl font-display font-bold mb-8">Available Routes</h2>
              {data.routes.map((route, idx) => (
                <BusRouteCard key={route.id} route={route} index={idx} />
              ))}
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
