import React from 'react';
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-card rounded-2xl p-5 shadow-lg shadow-black/5 border border-border/50", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  colorClass
}: {
  label: string,
  value: string | number | React.ReactNode,
  unit?: string,
  colorClass: string
}) {
  return (
    <div className={cn("rounded-2xl p-4 flex flex-col justify-between text-white shadow-lg", colorClass)}>
      <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-display font-bold leading-none">{value}</span>
        {unit && <span className="text-sm font-medium opacity-80">{unit}</span>}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default'|'primary'|'destructive'|'outline', className?: string }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary text-primary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border-2 border-border text-foreground bg-transparent"
  };

  return (
    <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wide", variants[variant], className)}>
      {children}
    </span>
  );
}

export function LoadingScreen() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse"></div>
        <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Loading conditions...</p>
    </div>
  );
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <span className="text-2xl">❄️</span>
      </div>
      <h2 className="text-xl font-bold">Failed to load data</h2>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
