import { useCallback, useMemo, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { PremiumAccessProvider } from "@workspace/feelzlike-shell";
import { track } from "@/lib/analytics";
import {
  AuthAccountProvider,
  type AuthAccountState,
} from "./AuthAccountContext";

/**
 * Host-side wiring for the soft member gate:
 *  - resolves the current account session via Clerk's useUser() hook,
 *  - feeds `{ isAuthenticated, isLoading, promptSignUp }` into the shell's
 *    PremiumAccessProvider so PremiumGate can soft-lock on tap, and
 *  - routes sign-up prompts to Clerk's sign-up page.
 *
 * Gentle by design: nothing here ever opens the prompt on its own · only an
 * explicit tap on a premium surface (or a sign-up button) does.
 */

export function SignUpProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const promptSignUp = useCallback(
    (opts?: { email?: string; feature?: string }) => {
      // Non-identifying event · which premium surface triggered the prompt.
      track("signup_prompt_open", { category: "auth", data: { feature: opts?.feature ?? "unknown" } });
      // This is an acquisition prompt, so start on account creation rather
      // than presenting returning-member sign-in copy.
      setLocation("/sign-up");
    },
    [setLocation],
  );

  // Clerk manages sessions; refresh is a no-op here (useUser re-renders when
  // Clerk's auth state changes). Kept for API compatibility with consumers.
  const refresh = useCallback(() => {
    // no-op: Clerk's useUser() re-renders reactively
  }, []);

  const state = useMemo<AuthAccountState>(
    () => ({
      isAuthenticated: !!user,
      isLoading: !isLoaded,
      email,
      promptSignUp,
      refresh,
    }),
    [user, isLoaded, email, promptSignUp, refresh],
  );

  return (
    <AuthAccountProvider value={state}>
      <PremiumAccessProvider
        value={{ isAuthenticated: state.isAuthenticated, isLoading: state.isLoading, promptSignUp }}
      >
        {children}
      </PremiumAccessProvider>
    </AuthAccountProvider>
  );
}

// Export signOut helper for components that need it (e.g. Account, Premium pages).
export { useClerk };
export { AuthAccountProvider, useAuthAccount } from "./AuthAccountContext";
export type { AuthAccountState } from "./AuthAccountContext";
