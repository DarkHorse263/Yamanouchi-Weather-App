import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Language } from "./types";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Translate: returns ja text when language === "ja" and ja is provided, else en */
  t: (en: string | null | undefined, ja?: string | null | undefined) => string;
  /** All locales available in this region */
  locales: Language[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({
  regionId,
  locales,
  children,
}: {
  regionId: string;
  locales: Language[];
  children: ReactNode;
}) {
  const storageKey = `feelzlike:${regionId}:lang`;
  const defaultLocale: Language = locales[0] ?? "en";
  const [language, setLanguageState] = useState<Language>(defaultLocale);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Language | null;
    if (saved && locales.includes(saved)) setLanguageState(saved);
  }, [storageKey, locales]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(storageKey, lang);
  };

  const t = (en: string | null | undefined, ja?: string | null | undefined) => {
    if (language === "ja" && ja) return ja;
    return en ?? "";
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, locales }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Permissive fallback so single-language regions don't need to wrap
    return {
      language: "en",
      setLanguage: () => {},
      t: (en) => en ?? "",
      locales: ["en"],
    };
  }
  return ctx;
}
