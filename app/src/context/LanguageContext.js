import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LANGUAGES, isValidLanguage } from "../i18n/languages";
import { translate } from "../i18n/translate";

const STORAGE_KEY = "vidyasetu:preferred_language";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && isValidLanguage(stored)) setLanguageState(stored);
      } catch {
        // default to English
      }
    })();
  }, []);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  }, []);

  const t = useCallback((key, params) => translate(key, language, params), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within a LanguageProvider");
  return ctx;
}
