import { Link } from "wouter";
import { MountainSnow } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
          <MountainSnow className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-foreground">Off Piste</h1>
        <p className="text-lg text-muted-foreground">
          Looks like you've skied out of bounds. This page doesn't exist.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
        >
          Return to Base
        </Link>
      </div>
    </div>
  );
}
