import { useGetWebcams } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { motion } from "framer-motion";
import { Camera, MapPin, ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";

function WebcamImage({ webcam }: { webcam: any }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {!imgError ? (
          <img 
            src={webcam.imageUrl} 
            alt={webcam.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Image unavailable</p>
              <p className="text-sm text-muted-foreground">The resort camera feed might be offline or blocked.</p>
            </div>
          </div>
        )}
        
        {webcam.elevation && (
          <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <MapPin className="w-3 h-3" />
            {webcam.elevation}m
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-lg mb-2">{webcam.name}</h3>
        {webcam.description && (
          <p className="text-muted-foreground text-sm flex-1">{webcam.description}</p>
        )}
        
        <a 
          href={webcam.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold transition-colors"
        >
          View on resort website
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function Webcams() {
  const { data, isLoading, error, refetch } = useGetWebcams();

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Mountain Webcams" 
            className="w-full h-full object-cover opacity-50"
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
                <Camera className="w-8 h-8 text-blue-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 drop-shadow-sm">
              Live Mountain <br className="hidden md:block"/>
              <span className="text-blue-300">Webcams</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 font-medium max-w-xl">
              Check real-time snow conditions and weather across all major resorts.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-24">
        {isLoading ? (
          <div className="bg-card rounded-3xl shadow-xl p-12">
            <LoadingState message="Fetching live camera feeds..." />
          </div>
        ) : error || !data ? (
          <div className="bg-card rounded-3xl shadow-xl p-12">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : (
          <div className="space-y-16">
            <div className="flex justify-end">
              <button 
                onClick={() => refetch()}
                className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Feeds
              </button>
            </div>

            {data.locations.map((loc, idx) => (
              <motion.section 
                key={loc.locationId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="scroll-mt-24"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-display font-bold">{loc.locationName}</h2>
                  <a 
                    href={loc.webcamPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    {loc.webcams.length > 0 ? `All ${loc.locationName} Cams` : `View ${loc.locationName} Cams`}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                
                {loc.webcams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loc.webcams.map((webcam) => (
                      <WebcamImage key={webcam.id} webcam={webcam} />
                    ))}
                  </div>
                ) : (
                  <a
                    href={loc.webcamPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-card border border-border rounded-2xl p-8 hover:shadow-md transition-shadow text-center"
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">View {loc.locationName} Webcams</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Live webcam feeds are available on the {loc.locationName} website.
                    </p>
                    <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm">
                      Visit {loc.locationName} webcam page
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </a>
                )}
              </motion.section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
