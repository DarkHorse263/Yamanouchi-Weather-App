import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ja";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string | null | undefined, ja: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  // Attempt to load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("yamanouchi-lang") as Language;
    if (saved === "en" || saved === "ja") {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("yamanouchi-lang", lang);
  };

  const t = (en: string | null | undefined, ja: string | null | undefined) => {
    if (language === "ja" && ja) return ja;
    return en || "";
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
