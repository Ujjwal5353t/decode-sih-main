"use client";

/**
 * LanguageProvider — mirrors ThemeProvider pattern.
 *
 * Manages the active UI language, persists to localStorage, and keeps
 * <html lang="…" dir="…"> in sync.  An inline <script> in layout.tsx
 * handles the initial attribute set (before React hydrates) to prevent FOUC.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import type {
  SupportedLanguage,
  TextDirection,
  TranslationDictionary,
} from "@/types/i18n";
import { getLanguageDirection, getLanguageMeta, isValidLanguage } from "@/types/i18n";

// ── Static imports for all locale dictionaries ──────────────────────────────
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import pa from "@/locales/pa.json";
import ur from "@/locales/ur.json";
import ta from "@/locales/ta.json";
import as_ from "@/locales/as.json";

const DICTIONARIES: Record<SupportedLanguage, TranslationDictionary> = {
  en: en as unknown as TranslationDictionary,
  hi: hi as unknown as TranslationDictionary,
  pa: pa as unknown as TranslationDictionary,
  ur: ur as unknown as TranslationDictionary,
  ta: ta as unknown as TranslationDictionary,
  as: as_ as unknown as TranslationDictionary,
};

const STORAGE_KEY = "preferred_language";

// ── Nested key resolver with English fallback ───────────────────────────────
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function translate(
  key: string,
  dict: TranslationDictionary,
  fallbackDict: TranslationDictionary = en as TranslationDictionary,
  params?: Record<string, string | number>
): any {
  let result = getNestedValue(dict, key);
  if (result === undefined) {
    result = getNestedValue(fallbackDict, key);
  }
  if (result === undefined) {
    return key;
  }

  if (typeof result === "string" && params) {
    let formatted = result;
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      formatted = formatted.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
    });
    return formatted;
  }

  return result;
}

// ── Context ─────────────────────────────────────────────────────────────────
interface LanguageContextValue {
  language: SupportedLanguage;
  direction: TextDirection;
  dictionary: TranslationDictionary;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  direction: "ltr",
  dictionary: en as TranslationDictionary,
  setLanguage: () => {},
  t: (key: string, params?: Record<string, string | number>) => {
    let result = key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
      });
    }
    return result;
  },
});

export function useLanguage() {
  return useContext(LanguageContext);
}

// ── Provider ────────────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [mounted, setMounted] = useState(false);

  // On mount, read stored preference
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidLanguage(stored)) {
        setLanguageState(stored);
      }
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  // When language changes, sync DOM attributes + localStorage
  useEffect(() => {
    if (!mounted) return;

    const dir = getLanguageDirection(language);
    const meta = getLanguageMeta(language);

    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("data-lang", language);

    // Apply / remove script-specific font class
    document.documentElement.classList.remove("font-indic", "font-urdu");
    if (meta.fontClass) {
      document.documentElement.classList.add(meta.fontClass);
    }

    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // localStorage unavailable
    }
  }, [language, mounted]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
  }, []);

  const direction = getLanguageDirection(language);
  const dictionary = DICTIONARIES[language] ?? (en as TranslationDictionary);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string =>
      translate(key, dictionary, en as TranslationDictionary, params),
    [dictionary]
  );

  return (
    <LanguageContext.Provider
      value={{ language, direction, dictionary, setLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
