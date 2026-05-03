import { motion } from "framer-motion";
import { cn } from "./cn";

export function LiveBadge({ label, className }: { label: string; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass", className)}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="byline text-foreground">{label}</span>
    </motion.div>
  );
}
