import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-destructive/10 p-6 rounded-full mb-5"
      >
        <AlertTriangle className="w-12 h-12 text-destructive" />
      </motion.div>
      <h2 className="text-2xl font-bold mb-2">Unable to load data</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        We hit a blizzard trying to get this information. The servers might be temporarily down or unreachable.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
