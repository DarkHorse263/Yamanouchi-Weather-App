import { Link } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import type { ReactNode } from "react";
import { useAdminQuery } from "./useAdminFetch";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

interface Props {
  children: ReactNode;
  /** Currently active tab key for highlighting */
  active: "stats";
}

const TABS: Array<{ key: Props["active"]; label: string; href: string }> = [
  { key: "stats", label: "stats", href: "/admin" },
];

/**
 * Shared chrome for every /admin page. Two-state auth gate:
 *   - not logged in → CTA to /sign-in
 *   - logged in but not on the email allowlist → "not authorised"
 *   - admin → renders the tab nav and the page content
 *
 * The actual "are you an admin" check is server-side (requireAdminUser
 * middleware on /api/admin/*). Here we use a soft check: if /api/admin/stats
 * 403s we render the not-authorised view. We don't trust the client.
 */
export function AdminLayout({ children, active }: Props) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const isAuthenticated = !!user;
  const isLoading = !isLoaded;

  // Server-side admin gate for EVERY tab. Returns 401 if logged
  // out, 403 if logged in but not on ADMIN_EMAILS, 200 if admin.
  const me = useAdminQuery<{ user: { id: string; email: string } }>("me", "/me");

  if (isLoading || me.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        loading…
      </div>
    );
  }

  if (!isAuthenticated || me.error?.status === 401) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-semibold lowercase">admin</h1>
          <p className="text-sm text-muted-foreground">
            sign in to continue.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2"
          >
            sign in
          </Link>
        </div>
      </div>
    );
  }

  if (me.error?.status === 403) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <AdminForbidden />
        </div>
      </div>
    );
  }

  // Fail-closed for any other error.
  if (me.error || !me.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <h2 className="font-semibold mb-1">admin gate unavailable</h2>
          <p className="text-sm">
            couldn't verify admin access right now ·{" "}
            <span className="font-mono text-xs">{me.error?.message ?? "unknown error"}</span>
          </p>
          <button
            onClick={() => me.refetch()}
            className="mt-3 text-sm underline underline-offset-2"
          >
            retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <img src={wordmark} alt="feelzlike" className="h-7 w-auto" />
              <span className="text-sm font-semibold lowercase text-slate-500">· admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{user?.primaryEmailAddress?.emailAddress}</span>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="text-slate-500 hover:text-slate-900 underline-offset-2 hover:underline"
            >
              sign out
            </button>
          </div>
          <nav className="-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-1 overflow-x-auto px-1 pb-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`shrink-0 rounded-md px-3 py-1.5 transition-colors ${
                  active === t.key
                    ? "bg-sky-100 text-sky-900 font-medium"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

/**
 * Wraps a fetch result so admin pages render a clean "not authorised" state
 * if the API returns 403, instead of an error toast or blank screen.
 */
export function AdminForbidden() {
  const { user } = useUser();
  const { signOut } = useClerk();
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <h2 className="font-semibold mb-1">not authorised</h2>
      <p className="text-sm">
        signed in as <strong>{user?.primaryEmailAddress?.emailAddress ?? "unknown"}</strong>, but this email
        isn't on the admin allowlist. ask the owner to add you, or sign in with
        a different account.
      </p>
      <button
        onClick={() => signOut({ redirectUrl: "/" })}
        className="mt-3 text-sm underline underline-offset-2"
      >
        sign out
      </button>
    </div>
  );
}
