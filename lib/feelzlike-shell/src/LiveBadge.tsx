import { motion } from "framer-motion";
import { cn } from "./cn";

export function LiveBadge({
  label,
  className,
  tone = "light",
}: {
  label: string;
  className?: string;
  /**
   * `light` (default) = light glass pill on a white surface.
   * `onDark` = translucent white pill suitable for gradient/coloured panels
   * (e.g. inside `<PageHeader>`).
   */
  tone?: "light" | "onDark";
}) {
  const isDark = tone === "onDark";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        isDark
          ? "bg-white/15 backdrop-blur-sm ring-1 ring-inset ring-white/30"
          : "glass",
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping",
            isDark ? "bg-emerald-300" : "bg-emerald-500",
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isDark ? "bg-emerald-300" : "bg-emerald-500",
          )}
        />
      </span>
      <span
        className={cn("text-[11px] font-bold lowercase tracking-wider", isDark ? "text-white" : "text-[#0F172A]")}
      >
        {label}
      </span>
    </motion.div>
  );
}
