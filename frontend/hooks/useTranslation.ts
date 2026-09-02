import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { fetchBatchTranslations, translatePhrase } from "@/lib/universalTranslator";

/**
 * Convenience hook — re-exports the language context.
 *
 * Usage:
 *   const { t, language, setLanguage, direction } = useTranslation();
 *   <span>{t("Personal Assessment & Attempt History")}</span>
 */
export function useTranslation() {
  return useLanguage();
}

/**
 * Dynamic translation hook for unstructured, asynchronous text (e.g. AI advice, teacher feedback).
 * 1. Checks phrase table and local cache immediately (0ms sync return).
 * 2. If missing and language != 'en', asynchronously fetches translation from backend Gemini API and updates.
 */
export function useDynamicTranslation(text?: string | null): string {
  const { language, t } = useLanguage();
  const rawText = text || "";
  const [translated, setTranslated] = useState<string>(() => {
    if (!rawText || language === "en") return rawText;
    return t(rawText);
  });

  useEffect(() => {
    if (!rawText || language === "en") {
      setTranslated(rawText);
      return;
    }

    // 1. Synchronous phrase map / cache lookup
    const local = t(rawText);
    if (local !== rawText) {
      setTranslated(local);
      return;
    }

    // 2. Fetch from backend Gemini translation API
    let isMounted = true;
    fetchBatchTranslations([rawText], language)
      .then((res) => {
        if (isMounted && res[rawText]) {
          setTranslated(res[rawText]);
        }
      })
      .catch((err) => {
        console.warn("Dynamic translation note:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [rawText, language, t]);

  return translated;
}

/**
 * React Component for automatic dynamic translation of unstructured text (AI advice, notes, feedback).
 */
export function DynamicText({ text, className }: { text?: string | null; className?: string }) {
  const translated = useDynamicTranslation(text);
  return React.createElement("span", { className }, translated);
}
