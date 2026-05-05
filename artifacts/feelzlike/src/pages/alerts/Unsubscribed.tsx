import { Link } from "wouter";
import { Snowflake } from "lucide-react";

export default function Unsubscribed() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center rounded-3xl glass border border-white/10 p-8">
        <Snowflake className="w-10 h-10 text-sky-400 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-foreground mb-2">You're unsubscribed</h1>
        <p className="text-sm text-muted-foreground">
          You won't receive any more powder alerts at that email. Resubscribe anytime from any region's Alerts page.
        </p>
        <div className="mt-6">
          <Link href="/" className="rounded-lg bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5">
            Back to FeelZlike
          </Link>
        </div>
      </div>
    </div>
  );
}
