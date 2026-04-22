import { Navbar } from "./Navbar";
import { InstallPrompt } from "./InstallPrompt";
import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-11">
          <a
            href="/"
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            All regions
          </a>
          <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/70">
            Snowy Mountains
          </span>
        </div>
      </header>
      <main className="flex-1 w-full pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <InstallPrompt />
      <Navbar />
    </div>
  );
}
