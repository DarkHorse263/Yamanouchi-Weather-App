import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import type { ReactNode } from "react";
import { useAdminQuery } from "./useAdminFetch";

interface Props {
  children: ReactNode;
  /** Currently active tab key for highlighting */
  active: "stats" | "traffic" | "newsletter";
}

const TABS: Array<{ key: Props["active"]; label: string; href: string }> = [
  { key: "stats", label: "stats", href: "/admin" },
  { key: "traffic", label: "traffic", href: "/admin/traffic" },
  { key: "newsletter", label: "newsletter", href: "/admin/newsletter" },
];

/**
 * Shared chrome for every /admin page. Two-state auth gate:
 *   - not logged in → CTA to /api/login (preserves return-to)
 *   - logged in but not on the email allowlist → "not authorised"
 *   - admin → renders the tab nav and the page content
 *
 * The actual "are you an admin" check is server-side (requireAdminUser
 * middleware on /api/admin/*). Here we use a soft check: if /api/admin/stats
 * 403s we render the not-authorised view. We don't trust the client.
 */
export function AdminLayout({ children, active }: Props) {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  // Server-side admin gate for EVERY tab (including Traffic, which doesn't
  // call any other /api/admin/* endpoint of its own). Returns 401 if logged
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
            sign in with your replit account to continue.
          </p>
          <button
            onClick={() => login()}
            className="inline-flex items-center justify-center rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2"
          >
            sign in with replit
          </button>
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

  // Fail-closed for any other error · we never render admin tabs without a
  // confirmed `/me` 200. Tabs like Traffic don't have a server fetch of their
  // own, so a 5xx on the gate must NOT silently let the embed render.
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-semibold lowercase">
              feelzlike · admin
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {TABS.map((t) => (
                <Link
                  key={t.key}
                  href={t.href}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
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
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{user?.email}</span>
            <button
              onClick={() => logout()}
              className="text-slate-500 hover:text-slate-900 underline-offset-2 hover:underline"
            >
              sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}

/**
 * Wraps a fetch result so admin pages render a clean "not authorised" state
 * if the API returns 403, instead of an error toast or blank screen.
 */
export function AdminForbidden() {
  const { logout, user } = useAuth();
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <h2 className="font-semibold mb-1">not authorised</h2>
      <p className="text-sm">
        signed in as <strong>{user?.email ?? "unknown"}</strong>, but this email
        isn't on the admin allowlist. ask the owner to add you, or sign in with
        a different account.
      </p>
      <button
        onClick={() => logout()}
        className="mt-3 text-sm underline underline-offset-2"
      >
        sign out
      </button>
    </div>
  );
}
