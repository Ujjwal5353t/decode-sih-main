/**
 * i18n Type Definitions
 *
 * Derives the TranslationDictionary type directly from en.json (source of truth).
 * All other locale files must conform to this shape — missing keys fall back to
 * English at runtime via the translate() helper.
 */

import en from "@/locales/en.json";

// ── Supported Languages ──────────────────────────────────────────────────────
export type SupportedLanguage = "en" | "hi" | "pa" | "ur" | "ta" | "as";
export type TextDirection = "ltr" | "rtl";

// ── Language Metadata ────────────────────────────────────────────────────────
export interface LanguageMeta {
  code: SupportedLanguage;
  label: string;         // English name
  nativeLabel: string;   // Name in native script
  direction: TextDirection;
  fontClass: string;     // CSS class applied to <html> for script-specific font
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", label: "English",  nativeLabel: "English",   direction: "ltr", fontClass: "" },
  { code: "hi", label: "Hindi",    nativeLabel: "हिन्दी",     direction: "ltr", fontClass: "font-indic" },
  { code: "pa", label: "Punjabi",  nativeLabel: "ਪੰਜਾਬੀ",    direction: "ltr", fontClass: "font-indic" },
  { code: "ur", label: "Urdu",     nativeLabel: "اردو",       direction: "rtl", fontClass: "font-urdu" },
  { code: "ta", label: "Tamil",    nativeLabel: "தமிழ்",      direction: "ltr", fontClass: "font-indic" },
  { code: "as", label: "Assamese", nativeLabel: "অসমীয়া",    direction: "ltr", fontClass: "font-indic" },
];

// ── Translation Dictionary (derived from en.json) ───────────────────────────
export type TranslationDictionary = typeof en;

// ── Direction helper ─────────────────────────────────────────────────────────
export function getLanguageDirection(lang: SupportedLanguage): TextDirection {
  return LANGUAGES.find((l) => l.code === lang)?.direction ?? "ltr";
}

export function getLanguageMeta(lang: SupportedLanguage): LanguageMeta {
  return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
}

export function isValidLanguage(code: string): code is SupportedLanguage {
  return LANGUAGES.some((l) => l.code === code);
}
