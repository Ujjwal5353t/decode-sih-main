import { DICTIONARIES } from "./languages";

function getNestedValue(obj, path) {
  let current = obj;
  for (const part of path.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Resolves a dotted key against the active language dictionary, falling
 * back to English, then to the key itself — same contract as the web app's
 * translate() so screens can reuse its existing key namespaces
 * (dashboard.*, lessons.*, diagnosticQuiz.*, ...). Keys under `mobile.*` are
 * app-specific and only exist in English; other languages fall back to
 * English for those rather than showing a raw key.
 */
export function translate(key, lang, params) {
  const dict = DICTIONARIES[lang] || DICTIONARIES.en;
  let result = getNestedValue(dict, key);
  if (result === undefined) result = getNestedValue(DICTIONARIES.en, key);
  if (result === undefined) result = key;

  if (typeof result === "string" && params) {
    let formatted = result;
    for (const [k, v] of Object.entries(params)) {
      formatted = formatted.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
    return formatted;
  }
  return result;
}
