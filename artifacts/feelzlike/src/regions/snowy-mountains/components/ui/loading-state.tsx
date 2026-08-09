import { motion } from "framer-motion";
import { Snowflake } from "lucide-react";

export function LoadingState({
  message = "Loading mountain data...",
  onCanvas = false,
}: {
  message?: string;
  /** Set when rendered directly on the blue/green page canvas · flips text white. */
  onCanvas?: boolean;
}) {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-5">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className={onCanvas ? "text-white opacity-90" : "text-primary opacity-80"}
      >
        <Snowflake className="w-16 h-16" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`text-lg font-medium font-display ${onCanvas ? "text-white/80" : "text-muted-foreground"}`}
      >
        {message}
      </motion.p>
    </div>
  );
}
