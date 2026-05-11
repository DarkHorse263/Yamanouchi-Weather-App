import { Link } from "wouter";
import { Mail, AlertTriangle } from "lucide-react";

/**
 * Newsletter unsubscribe landing page. Reached from the GET redirect of
 * /api/newsletter/unsubscribe Â· gives a one-click email link a clear
 * confirmation surface (required for AU Spam Act / CAN-SPAM compliance).
 */
function readErrorFromQuery(): string | null {
  if (typeof window === "undefined") return null;
  const code = new URLSearchParams(window.location.search).get("error");
  return code && /^[A-Z_]{1,40}$/.test(code) ? code : null;
}

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  INVALID_TOKEN: {
    title: "This unsubscribe link isn't valid",
    body: "It may have been opened twice, or the link in your email is corrupted. Reply to any digest email and we'll handle it manually.",
  },
  SUBSCRIBER_NOT_FOUND: {
    title: "We couldn't find that subscription",
    body: "It may have already been removed. You won't receive any more digests.",
  },
  UNSUB_FAILED: {
    title: "Something went wrong",
    body: "We couldn't process your request. Please try again in a few minutes, or reply to any of our emails.",
  },
};

export default function NewsletterUnsubscribed() {
  const errorCode = readErrorFromQuery();
  const errorMeta = errorCode ? (ERROR_COPY[errorCode] ?? ERROR_COPY["UNSUB_FAILED"]!) : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center rounded-3xl glass border border-white/10 p-8">
        {errorMeta ? (
          <>
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-foreground mb-2">{errorMeta.title}</h1>
            <p className="text-sm text-muted-foreground">{errorMeta.body}</p>
          </>
        ) : (
          <>
            <Mail className="w-10 h-10 text-sky-400 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-foreground mb-2">You're unsubscribed</h1>
            <p className="text-sm text-muted-foreground">
              You won't receive any more digests at that email. Resubscribe anytime from the footer.
            </p>
          </>
        )}
        <div className="mt-6">
          <Link
            href="/"
            className="rounded-lg bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5"
          >
            Back to feelzlike
          </Link>
        </div>
      </div>
    </div>
  );
}
