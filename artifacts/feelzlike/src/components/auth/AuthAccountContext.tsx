import { createContext, useContext, type ReactNode } from "react";

export interface AuthAccountState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  promptSignUp: (opts?: { email?: string; feature?: string }) => void;
  refresh: () => void;
}

const AuthAccountContext = createContext<AuthAccountState | null>(null);

export function AuthAccountProvider({
  value,
  children,
}: {
  value: AuthAccountState;
  children: ReactNode;
}) {
  return <AuthAccountContext.Provider value={value}>{children}</AuthAccountContext.Provider>;
}

export function useAuthAccount(): AuthAccountState {
  const ctx = useContext(AuthAccountContext);
  if (!ctx) throw new Error("useAuthAccount must be used inside SignUpProvider");
  return ctx;
}