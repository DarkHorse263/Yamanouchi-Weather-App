import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
      <div className="text-5xl mb-4">🏮</div>
      <h1 className="text-2xl font-bold text-sumi mb-2">Page Not Found</h1>
      <p className="text-sm text-muted-foreground mb-6">
        The page you're looking for doesn't exist or the menu link may have changed.
      </p>
      <Button onClick={() => navigate("/")}>Go Home</Button>
    </div>
  );
}
