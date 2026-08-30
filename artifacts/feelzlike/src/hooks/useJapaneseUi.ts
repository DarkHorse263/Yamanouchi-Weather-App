import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
} from "@workspace/feelzlike-shell";
import { getRegion } from "@/regions";

function isJapaneseUi(location: string): boolean {
  const segment = location.split("/").filter(Boolean)[0] ?? "";
  const region = getRegion(segment);
  if (!region?.language?.locales.includes("ja")) return false;

  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved) return saved === "ja";
    return (window.navigator.language || "").toLowerCase().startsWith("ja");
  } catch {
    return false;
  }
}

/**
 * Detect whether the visitor is currently on a Japan region with 日本語
 * selected. App-wide chrome mounts outside the region-scoped LanguageProvider,
 * so mirror the canonical app-wide preference and its same-document updates.
 */
export function useJapaneseUi(): boolean {
  const [location] = useLocation();
  const [japanese, setJapanese] = useState(() => isJapaneseUi(location));

  useEffect(() => {
    const sync = () => setJapanese(isJapaneseUi(location));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, sync);
    };
  }, [location]);

  return japanese;
}