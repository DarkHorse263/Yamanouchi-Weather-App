import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorState({
  error: _error,
  onRetry,
  onCanvas = false,
}: {
  error: unknown;
  onRetry?: () => void;
  /** Set when rendered directly on the blue/green page canvas · flips text white. */
  onCanvas?: boolean;
}) {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`p-6 rounded-full mb-5 ${onCanvas ? "bg-white/15" : "bg-destructive/10"}`}
      >
        <AlertTriangle className={`w-12 h-12 ${onCanvas ? "text-white" : "text-destructive"}`} />
      </motion.div>
      <h2 className={`text-2xl font-bold mb-2 ${onCanvas ? "text-white" : ""}`}>Unable to load data</h2>
      <p className={`${onCanvas ? "text-white/80" : "text-muted-foreground"} max-w-md mb-6`}>
        We hit a blizzard trying to get this information. The servers might be temporarily down or unreachable.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0 ${
            onCanvas ? "bg-white text-[#0055FF]" : "bg-primary text-primary-foreground"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
