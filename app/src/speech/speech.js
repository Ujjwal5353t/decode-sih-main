/**
 * On-device speech I/O for the app — the integration point for the
 * RunAnywhere SDK (on-device TTS/STT, runanywhere.ai).
 *
 * RunAnywhere ships native on-device speech models (no round trip to a
 * cloud STT/TTS API), which is exactly what a local-first, low-connectivity
 * classroom app needs: lessons stay readable/listenable with zero network,
 * and a child's voice never has to leave the device.
 *
 * This build stands in with Expo's built-in `expo-speech` for text-to-speech
 * (so the app runs end-to-end today) and stubs speech-to-text, since Expo
 * has no on-device STT module of its own. Every call site in the app goes
 * through the functions below, not through expo-speech directly — dropping
 * in the real RunAnywhere SDK later is a change to this one file.
 */

import * as Speech from "expo-speech";

// VidyaSetu's own locale codes -> BCP-47 tags for the platform TTS voice.
// RunAnywhere's on-device models would take the same input text + language
// hint through this same function signature.
const LANGUAGE_TO_LOCALE = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  pa: "pa-IN",
  ur: "ur-IN",
  ta: "ta-IN",
  as: "as-IN",
};

export function localeForLanguage(lang) {
  return LANGUAGE_TO_LOCALE[lang] || "en-IN";
}

export function speak(text, lang) {
  if (!text) return;
  Speech.stop();
  Speech.speak(text, { language: localeForLanguage(lang), pitch: 1.0, rate: 0.95 });
}

export function stopSpeaking() {
  Speech.stop();
}

export async function isSpeaking() {
  return Speech.isSpeakingAsync();
}

/**
 * Speech-to-text. Not implemented in this build — wire the RunAnywhere SDK's
 * on-device recognizer here (record -> transcribe -> resolve(text)). Kept as
 * a real async function (not a UI-level `if`) so every call site already
 * matches the shape the real integration will have.
 */
export async function listen() {
  throw new Error(
    "Voice input runs on the RunAnywhere on-device speech-to-text SDK, which is not wired into this build yet."
  );
}
