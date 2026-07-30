import { createContext, useContext, type ReactNode } from "react";

/**
 * Auth bridge for the soft member gate. The shell must not depend on any
 * concrete auth stack, so the host app (feelzlike) wires its own auth state
 * and sign-up modal into this provider. Without a provider the gate is a
 * pass-through (isAuthenticated defaults to true), so other consumers of the
 * shell and older call sites keep working unchanged.
 */
export interface PremiumAccessState {
  /** True when the visitor has a signed-in account session. */
  isAuthenticated: boolean;
  /** True while the auth state is still being resolved · gates stay open. */
  isLoading: boolean;
  /** Open the host app's free-sign-up prompt (optionally prefilled). */
  promptSignUp: (opts?: { email?: string; feature?: string }) => void;
}

const PASS_THROUGH: PremiumAccessState = {
  isAuthenticated: true,
  isLoading: false,
  promptSignUp: () => {},
};

const PremiumAccessContext = createContext<PremiumAccessState>(PASS_THROUGH);

export function PremiumAccessProvider({
  value,
  children,
}: {
  value: PremiumAccessState;
  children: ReactNode;
}) {
  return (
    <PremiumAccessContext.Provider value={value}>{children}</PremiumAccessContext.Provider>
  );
}

export function usePremiumAccess(): PremiumAccessState {
  return useContext(PremiumAccessContext);
}
