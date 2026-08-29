import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Convenience hook — re-exports the language context.
 *
 * Usage:
 *   const { t, language, setLanguage, direction } = useTranslation();
 *   <span>{t("nav.dashboard")}</span>
 */
export function useTranslation() {
  return useLanguage();
}
