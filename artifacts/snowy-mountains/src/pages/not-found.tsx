import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { MountainSnow, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="w-full h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
          <div className="text-[120px] font-display font-bold text-primary/10 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <MountainSnow className="w-20 h-20 text-primary" />
          </div>
        </motion.div>
        
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
          Lost in the whiteout?
        </h1>
        <p className="text-muted-foreground max-w-md mb-8 text-lg">
          We couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        
        <Link 
          href="/" 
          className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </AppLayout>
  );
}
