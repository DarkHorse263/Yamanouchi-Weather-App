import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, MapPin, Clock, Info } from "lucide-react";
import type { BusRoute } from "@workspace/api-client-react";
import { cn } from "../../lib/utils";

export function BusRouteCard({ route, index }: { route: BusRoute; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
      >
        <div>
          <h3 className="text-xl font-display font-bold text-foreground mb-1">{route.name}</h3>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {route.stops.length} Stops along route
          </p>
        </div>
        <div className={cn(
          "p-2 rounded-full bg-secondary/50 transition-transform duration-300",
          isOpen && "rotate-180"
        )}>
          <ChevronDown className="w-5 h-5 text-primary" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-6 bg-muted/10 space-y-6">
              
              <div>
                <p className="text-foreground leading-relaxed mb-4">{route.description}</p>
                {route.seasonalInfo && (
                  <div className="flex items-start gap-3 bg-amber-500/10 text-amber-800 dark:text-amber-200 p-4 rounded-xl text-sm">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{route.seasonalInfo}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Timetable
                </h4>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 font-semibold">From</th>
                        <th className="px-4 py-3 font-semibold">To</th>
                        <th className="px-4 py-3 font-semibold">Depart</th>
                        <th className="px-4 py-3 font-semibold">Arrive</th>
                        <th className="px-4 py-3 font-semibold">Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {route.schedule.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-muted/50 bg-card">
                          <td className="px-4 py-3 font-medium text-foreground">{entry.from}</td>
                          <td className="px-4 py-3">{entry.to}</td>
                          <td className="px-4 py-3 font-display font-semibold text-primary">{entry.departure}</td>
                          <td className="px-4 py-3 font-display">{entry.arrival}</td>
                          <td className="px-4 py-3 text-muted-foreground">{entry.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Route Stops</h4>
                <div className="flex flex-wrap gap-2">
                  {route.stops.map((stop, idx) => (
                    <span key={idx} className="bg-background border border-border px-3 py-1 rounded-full text-sm">
                      {stop}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
