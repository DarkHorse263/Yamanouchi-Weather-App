import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { REGIONS } from "@/regions";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

export default function RegionPicker() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-10 pt-6 md:pt-12 pb-12">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <img src={wordmark} alt="feelzlike" className="h-9 md:h-10 w-auto" />
          <p className="byline text-muted-foreground/70 mt-6">The skier &amp; snowboarder's bible</p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight text-foreground mt-3 max-w-3xl leading-[1.05]">
            What does the mountain feel like today?
          </h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl leading-relaxed">
            real-time mountain weather, live road alerts, and lift status. From transport
            updates to the best base-town spots, we bring you the local word as it happens.
          </p>
          <p className="text-muted-foreground/80 text-base mt-3">
            Pick a region to see the live view.
          </p>
        </motion.header>

        <div className="rule mt-10 mb-8" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {REGIONS.map((region, i) => (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 + i * 0.05 }}
            >
              <Link
                href={`/${region.id}`}
                className="group block glass rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="byline text-muted-foreground/80 inline-flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {region.shortTag}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <h2 className="font-display font-semibold text-2xl text-foreground mt-4 leading-tight">
                  {region.name}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">{region.subtitle}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {(region.mountains ?? []).slice(0, 4).map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-secondary text-secondary-foreground"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="rule mt-12 mb-6" />
        <p className="byline text-muted-foreground/60">v0.3 · feelzlike - single app, all regions</p>
      </div>
    </div>
  );
}
