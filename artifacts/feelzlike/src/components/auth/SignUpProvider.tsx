import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { PremiumAccessProvider } from "@workspace/feelzlike-shell";
import { track } from "@/lib/analytics";
import { SignUpSheet } from "./SignUpSheet";

/**
 * Host-side wiring for the soft member gate:
 *  - resolves the current account session (GET /api/auth/user),
 *  - feeds `{ isAuthenticated, isLoading, promptSignUp }` into the shell's
 *    PremiumAccessProvider so PremiumGate can soft-lock on tap, and
 *  - owns the single app-wide SignUpSheet modal.
 *
 * Gentle by design: nothing here ever opens the prompt on its own · only an
 * explicit tap on a premium surface (or a sign-up button) does.
 */

interface AuthAccountState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  promptSignUp: (opts?: { email?: string; feature?: string }) => void;
  refresh: () => void;
}

const AuthAccountContext = createContext<AuthAccountState | null>(null);

export function useAuthAccount(): AuthAccountState {
  const ctx = useContext(AuthAccountContext);
  if (!ctx) throw new Error("useAuthAccount must be used inside SignUpProvider");
  return ctx;
}

export function SignUpProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const query = useGetCurrentAuthUser({
    query: { queryKey: ["auth", "user"], staleTime: 60_000, retry: 1 },
  });
  const user = query.data?.user ?? null;

  const [sheet, setSheet] = useState<{ open: boolean; email?: string; feature?: string }>({ open: false });

  const promptSignUp = useCallback(
    (opts?: { email?: string; feature?: string }) => {
      setSheet({ open: true, email: opts?.email, feature: opts?.feature });
      // Non-identifying event · which premium surface triggered the prompt.
      track("signup_prompt_open", { category: "auth", data: { feature: opts?.feature ?? "unknown" } });
    },
    [],
  );

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  const state = useMemo<AuthAccountState>(
    () => ({
      isAuthenticated: !!user,
      isLoading: query.isLoading,
      email: user?.email ?? null,
      promptSignUp,
      refresh,
    }),
    [user, query.isLoading, promptSignUp, refresh],
  );

  return (
    <AuthAccountContext.Provider value={state}>
      <PremiumAccessProvider
        value={{ isAuthenticated: state.isAuthenticated, isLoading: state.isLoading, promptSignUp }}
      >
        {children}
        <SignUpSheet
          open={sheet.open}
          initialEmail={sheet.email}
          feature={sheet.feature}
          returnTo={location || "/"}
          onClose={() => setSheet((s) => ({ ...s, open: false }))}
        />
      </PremiumAccessProvider>
    </AuthAccountContext.Provider>
  );
}
