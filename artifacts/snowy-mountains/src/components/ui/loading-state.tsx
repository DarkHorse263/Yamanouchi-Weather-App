import { motion } from "framer-motion";
import { Snowflake } from "lucide-react";

export function LoadingState({ message = "Loading mountain data..." }: { message?: string }) {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="text-primary opacity-80"
      >
        <Snowflake className="w-16 h-16" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-lg font-medium text-muted-foreground font-display"
      >
        {message}
      </motion.p>
    </div>
  );
}
