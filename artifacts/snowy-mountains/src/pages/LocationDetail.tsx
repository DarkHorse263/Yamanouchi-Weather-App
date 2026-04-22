import { useRoute } from "wouter";
import { useGetLocationWeather, useGetLocationWebcams, useGetLocationLiftStatus } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { WeatherIcon } from "@/components/ui/weather-icon";
import { ForecastChart } from "@/components/weather/ForecastChart";
import { formatTemp, formatSnow } from "@/lib/utils";
import { motion } from "framer-motion";
import { MapPin, Wind, Droplets, Snowflake, Sunrise, Sunset, CalendarDays, BarChart2, Camera, Cable, CheckCircle2, XCircle, AlertCircle, Clock, Activity, Gauge, Thermometer, CloudRain, Eye, Navigation } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

type LocationId = "thredbo" | "perisher" | "charlottes-pass" | "jindabyne";

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
    case "open": return <CheckCircle2 className="w-3 h-3" />;
    case "closed": return <XCircle className="w-3 h-3" />;
    case "wind-hold": return <Wind className="w-3 h-3" />;
    case "on-hold": return <AlertCircle className="w-3 h-3" />;
    case "scheduled": return <Clock className="w-3 h-3" />;
    default: return null;
  }
}

export default function LocationDetail() {
  const [, params] = useRoute("/location/:id");
  const locationId = params?.id as LocationId;
  
  const { data: weatherData, isLoading: weatherLoading, error: weatherError, refetch: weatherRefetch } = useGetLocationWeather(locationId, {
    query: {
      enabled: !!locationId,
    }
  });

  const { data: webcamData } = useGetLocationWebcams(locationId, {
    query: {
      enabled: !!locationId,
    }
  });

  const isResort = locationId === "thredbo" || locationId === "perisher" || locationId === "charlottes-pass";
  const { data: liftData } = useGetLocationLiftStatus(locationId as any, {
    query: {
      enabled: isResort,
    }
  });

  const [activeChartMetric, setActiveChartMetric] = useState<"temperature" | "snowfall" | "windSpeed">("temperature");

  if (weatherLoading) return <AppLayout><LoadingState message={`Loading data for ${locationId}...`} /></AppLayout>;
  if (weatherError || !weatherData) return <AppLayout><ErrorState error={weatherError} onRetry={() => weatherRefetch()} /></AppLayout>;

  const { location, current, daily, hourly } = weatherData;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-8 items-start lg:items-end justify-between bg-card p-8 md:p-10 rounded-3xl shadow-sm border border-border"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-primary font-semibold bg-primary/10 w-fit px-4 py-1.5 rounded-full text-sm">
                <MapPin className="w-4 h-4" />
                <span>Elev: {location.elevation}m</span>
              </div>
              {location.bomStation && (
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium bg-muted w-fit px-4 py-1.5 rounded-full text-sm">
                  <span>BOM: {location.bomStation}</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{location.name}</h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              {location.description}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-6 bg-secondary/30 p-6 rounded-2xl w-full lg:w-auto">
              <WeatherIcon code={current.weatherCode} isDay={current.isDay} className="w-20 h-20 drop-shadow-md" />
              <div>
                <div className="text-6xl font-display font-bold tracking-tighter">
                  {formatTemp(current.temperature)}
                </div>
                <div className="text-muted-foreground font-medium text-lg mt-1">
                  {current.weatherDescription}
                </div>
              </div>
            </div>
            {current.dataSource === "BOM" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  BOM Live Data
                </span>
                {current.bomStation && (
                  <span className="text-muted-foreground/70">{current.bomStation}</span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Current Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Feels Like", value: formatTemp(current.feelsLike), icon: Thermometer, color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "Wind", value: `${current.windSpeed} km/h${current.windDirectionCompass ? ` ${current.windDirectionCompass}` : ""}`, icon: Navigation, color: "text-teal-500", bg: "bg-teal-500/10" },
            ...(current.windGust ? [{ label: "Wind Gusts", value: `${current.windGust} km/h`, icon: Wind, color: "text-teal-600", bg: "bg-teal-600/10" }] : []),
            { label: "Humidity", value: `${current.humidity}%`, icon: Droplets, color: "text-cyan-500", bg: "bg-cyan-500/10" },
            { label: "Snow Depth", value: formatSnow(current.snowDepth), icon: Snowflake, color: "text-blue-500", bg: "bg-blue-500/10" },
            ...(current.dewpoint !== undefined ? [{ label: "Dew Point", value: formatTemp(current.dewpoint), icon: Droplets, color: "text-indigo-500", bg: "bg-indigo-500/10" }] : []),
            ...(current.pressure !== undefined ? [{ label: "Pressure", value: `${current.pressure} hPa`, icon: Gauge, color: "text-purple-500", bg: "bg-purple-500/10" }] : []),
            ...(current.rainSince9am !== undefined ? [{ label: "Rain Since 9am", value: `${current.rainSince9am} mm`, icon: CloudRain, color: "text-sky-500", bg: "bg-sky-500/10" }] : []),
            ...(current.visibility && current.visibility !== 10000 ? [{ label: "Visibility", value: `${(current.visibility / 1000).toFixed(0)} km`, icon: Eye, color: "text-slate-500", bg: "bg-slate-500/10" }] : []),
          ].map((stat, i) => (
            <div key={i} className="bg-card p-5 rounded-2xl border border-border/50 flex flex-col items-start gap-3 shadow-sm">
              <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{stat.label}</p>
                <p className="text-xl font-display font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hourly Forecast Chart */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                <BarChart2 className="text-primary w-6 h-6" />
                24-Hour Trend
              </h2>
              <div className="flex bg-muted p-1 rounded-xl">
                {(["temperature", "snowfall", "windSpeed"] as const).map(metric => (
                  <button
                    key={metric}
                    onClick={() => setActiveChartMetric(metric)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all",
                      activeChartMetric === metric 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {metric.replace("Speed", "")}
                  </button>
                ))}
              </div>
            </div>
            <ForecastChart data={hourly} metric={activeChartMetric} />
          </motion.div>

          {/* 7-Day Forecast */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm"
          >
            <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-6">
              <CalendarDays className="text-primary w-6 h-6" />
              7-Day Forecast
            </h2>
            <div className="space-y-4">
              {daily.map((day, i) => (
                <div key={day.date} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors">
                  <div className="w-1/3">
                    <p className="font-semibold">{i === 0 ? "Today" : format(parseISO(day.date), "EEE")}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(day.date), "MMM d")}</p>
                  </div>
                  <div className="flex items-center justify-center w-1/3">
                    <WeatherIcon code={day.weatherCode} className="w-8 h-8" />
                  </div>
                  <div className="flex justify-end gap-3 w-1/3 font-display font-semibold">
                    <span className="text-foreground">{Math.round(day.maxTemp)}°</span>
                    <span className="text-muted-foreground">{Math.round(day.minTemp)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Webcams and Lift Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Webcams Section */}
          {webcamData && webcamData.webcams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm"
            >
              <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-6">
                <Camera className="text-primary w-6 h-6" />
                Live Webcams
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {webcamData.webcams.slice(0, 4).map((webcam) => (
                  <div key={webcam.id} className="group overflow-hidden rounded-xl bg-muted relative aspect-video border border-border">
                    <img 
                      src={webcam.imageUrl} 
                      alt={webcam.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-white text-sm font-semibold truncate drop-shadow-md">{webcam.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Lift Status Section */}
          {isResort && liftData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                  <Cable className="text-primary w-6 h-6" />
                  Lift Status
                </h2>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                  liftData.seasonStatus === 'open' ? "bg-green-500/10 text-green-700 border-green-500/20" :
                  "bg-amber-500/10 text-amber-700 border-amber-500/20"
                )}>
                  {liftData.seasonStatus.replace('-', ' ')}
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="bg-muted/50 px-4 py-3 rounded-2xl flex-1 flex flex-col items-center justify-center">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Lifts Open</p>
                  <p className="text-2xl font-display font-bold leading-none">
                    <span className="text-primary">{liftData.liftsOpen}</span>
                    <span className="text-muted-foreground text-lg">/{liftData.totalLifts}</span>
                  </p>
                </div>
                {(liftData.runsOpen !== undefined && liftData.totalRuns !== undefined) && (
                  <div className="bg-muted/50 px-4 py-3 rounded-2xl flex-1 flex flex-col items-center justify-center">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Runs Open</p>
                    <p className="text-2xl font-display font-bold leading-none">
                      <span className="text-blue-500">{liftData.runsOpen}</span>
                      <span className="text-muted-foreground text-lg">/{liftData.totalRuns}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] pr-2">
                {liftData.lifts.map((lift) => (
                  <div key={lift.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{lift.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{lift.type.replace('-', ' ')}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1",
                      getStatusColor(lift.status)
                    )}>
                      {getStatusIcon(lift.status)}
                      <span className="capitalize">{lift.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
