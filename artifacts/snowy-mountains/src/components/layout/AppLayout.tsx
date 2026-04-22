import { Navbar } from "./Navbar";
import { InstallPrompt } from "./InstallPrompt";
import { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 w-full pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <InstallPrompt />
      <Navbar />
    </div>
  );
}
