import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Language } from "./types";

export const LANGUAGE_STORAGE_KEY = "feelzlike:lang";
export const LANGUAGE_CHANGE_EVENT = "feelzlike:languagechange";

function notifyLanguageChange() {
  window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
}

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
  locales,
  children,
}: {
  locales: Language[];
  children: ReactNode;
}) {
  const defaultLocale: Language = locales[0] ?? "en";
  const [language, setLanguageState] = useState<Language>(defaultLocale);

  useEffect(() => {
    let saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;

    // Preserve choices made before language became app-wide. Prefer Japanese
    // from any old page key so moving between Japan regions no longer resets it.
    if (!saved) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key?.startsWith("feelzlike:") &&
          key.endsWith(":lang") &&
          localStorage.getItem(key) === "ja"
        ) {
          saved = "ja";
          localStorage.setItem(LANGUAGE_STORAGE_KEY, saved);
          notifyLanguageChange();
          break;
        }
      }
    }

    if (
      !saved &&
      locales.includes("ja") &&
      (navigator.language || "").toLowerCase().startsWith("ja")
    ) {
      saved = "ja";
      localStorage.setItem(LANGUAGE_STORAGE_KEY, saved);
      notifyLanguageChange();
    }

    setLanguageState(saved && locales.includes(saved) ? saved : defaultLocale);
  }, [defaultLocale, locales]);

  useEffect(() => {
    const syncLanguage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY) return;
      const saved = event.newValue as Language | null;
      setLanguageState(saved && locales.includes(saved) ? saved : defaultLocale);
    };
    window.addEventListener("storage", syncLanguage);
    return () => window.removeEventListener("storage", syncLanguage);
  }, [defaultLocale, locales]);

  const setLanguage = (lang: Language) => {
    if (!locales.includes(lang)) return;
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    notifyLanguageChange();
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
