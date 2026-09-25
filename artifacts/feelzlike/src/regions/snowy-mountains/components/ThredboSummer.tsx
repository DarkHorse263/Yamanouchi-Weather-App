import { motion } from "framer-motion";
import { Mountain, Bike, MapPin, Calendar, ExternalLink, Cable } from "lucide-react";

/**
 * Thredbo summer-mode panel. Thredbo is the only Snowy Mountains resort
 * with year-round non-snow activities. Summer lift schedules vary and this
 * panel never asserts that a chairlift is operating right now.
 *
 * Replaces the snow / lift-status panels on Thredbo's LocationDetail page
 * when the global season is "green". All facts here come from
 * thredbo.com.au · we don't try to duplicate their booking flow, just
 * describe seasonal activities and link out for tickets and current hours.
 */
export function ThredboSummer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-3xl p-5 md:p-8 col-span-full"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <p className="byline text-muted-foreground">Summer at Thredbo</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
            <Mountain className="text-primary w-5 h-5" />
            Open year-round
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
            Thredbo offers green-season walks to Mt Kosciuszko, mountain biking and village activities. Check the operator for current dates, lift service and hours.
          </p>
        </div>
        <a
          href="https://www.thredbo.com.au/summer/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-widest transition-colors"
        >
          Tickets & hours
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="rule mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummerCard
          icon={<Cable className="w-4 h-4 text-sky-500" />}
          title="Kosciuszko Express chairlift"
          body="Seasonal chairlift access for Mt Kosciuszko walks (13 km summit return). Service and hours vary · check the operator before travelling."
        />
        <SummerCard
          icon={<MapPin className="w-4 h-4 text-emerald-500" />}
          title="Walking tracks"
          body="Mt Kosciuszko summit (13 km return), Dead Horse Gap (10 km one-way, descent into village), Cascade Hut, Merritts Nature Track. Conditions change fast above the treeline · always check forecasts and carry layers."
        />
        <SummerCard
          icon={<Bike className="w-4 h-4 text-amber-500" />}
          title="Mountain bike park"
          body="Downhill and flow trails with seasonal bike-haul access. Tickets and rentals via Thredbo; dates and lift service vary year-on-year."
        />
        <SummerCard
          icon={<Calendar className="w-4 h-4 text-rose-500" />}
          title="Village & events"
          body="Bobsled, mini-golf, leisure centre and sightseeing are among Thredbo's non-snow activities. Check the resort calendar and opening hours before visiting."
        />
      </div>
    </motion.div>
  );
}

function SummerCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
