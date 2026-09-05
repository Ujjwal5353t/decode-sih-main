import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "vidyasetu:preferences";

const DEFAULTS = {
  signLanguageAssist: false,
  readAloudEnabled: true,
  soundEffectsEnabled: true,
};

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch {
        // defaults stand
      }
    })();
  }, []);

  const update = useCallback((patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return <PreferencesContext.Provider value={{ ...prefs, update }}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
}
