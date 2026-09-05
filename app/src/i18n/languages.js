import en from "./locales/en.json";
import hi from "./locales/hi.json";
import bn from "./locales/bn.json";
import mr from "./locales/mr.json";
import pa from "./locales/pa.json";
import ur from "./locales/ur.json";
import ta from "./locales/ta.json";
import as_ from "./locales/as.json";

export const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "as", label: "Assamese", nativeLabel: "অসমীয়া" },
];

export const DICTIONARIES = { en, hi, bn, mr, pa, ur, ta, as: as_ };

export function isValidLanguage(code) {
  return LANGUAGES.some((l) => l.code === code);
}
