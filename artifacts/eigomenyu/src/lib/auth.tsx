import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Owner {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  owner: Owner | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "eigomenyu_auth";

function loadOwner(): Owner | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOwner(owner: Owner | null) {
  if (owner) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(owner));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<Owner | null>(loadOwner);

  const login = useCallback(async (email: string, _password: string) => {
    const o: Owner = {
      id: btoa(email),
      email,
      name: email.split("@")[0],
    };
    saveOwner(o);
    setOwner(o);
  }, []);

  const register = useCallback(async (email: string, _password: string, name: string) => {
    const o: Owner = {
      id: btoa(email),
      email,
      name,
    };
    saveOwner(o);
    setOwner(o);
  }, []);

  const logout = useCallback(() => {
    saveOwner(null);
    setOwner(null);
  }, []);

  return (
    <AuthContext.Provider value={{ owner, isAuthenticated: !!owner, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
