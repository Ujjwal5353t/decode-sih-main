/**
 * Device-local key/value store behind the app's local-first behavior.
 *
 * Mirrors the web app's IndexedDB cache (frontend/lib/offline/db.ts) but on
 * AsyncStorage, which is what a bare Expo/React Native app has without an
 * extra native module. Two roles, same as the web version:
 *
 *   CACHE  — last-known-good copies of read-only server data (lessons,
 *            progress, quiz status) so a learner who loses signal mid-lesson
 *            can keep going.
 *   QUEUE  — learning-activity events recorded on this device that the
 *            server has not yet acknowledged. An event leaves the queue only
 *            once a sync response names it, never on a timer or a guess.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "vidyasetu:cache:";
const QUEUE_KEY = "vidyasetu:learning_event_queue";

export async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key, value) {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full/unavailable — the app just loses its offline safety net
  }
}

export async function deleteCache(key) {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // ignore
  }
}

export async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setQueue(events) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}
