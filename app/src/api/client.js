import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../config/api";

const TOKEN_KEY = "vidyasetu:auth_token";
const ROLE_KEY = "vidyasetu:auth_role";
const LANG_KEY = "vidyasetu:preferred_language";

export async function getStoredToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getStoredRole() {
  try {
    return await AsyncStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
}

export async function setStoredAuth(token, role) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(ROLE_KEY, role);
  } catch {
    // ignore
  }
}

export async function clearStoredAuth() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
  } catch {
    // ignore
  }
}

export async function getPreferredLanguage() {
  try {
    return (await AsyncStorage.getItem(LANG_KEY)) || "en";
  } catch {
    return "en";
  }
}

/** Universal fetch wrapper — same contract as the web app's lib/api.ts. */
export async function fetchApi(endpoint, options = {}) {
  const [token, lang] = await Promise.all([getStoredToken(), getPreferredLanguage()]);

  const headers = {
    "Content-Type": "application/json",
    "Accept-Language": lang,
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Generous: the deployed free-tier backend spins down when idle and can take
  // 30-50s to cold-start on the first request after a while — a shorter timeout
  // would falsely report "server unreachable" on exactly that first request.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      const error = new Error("The server took too long to respond. Check your connection and try again.");
      error.status = 504;
      throw error;
    }
    const error = new Error(
      "Couldn't reach the server. Check that the backend is reachable and your network connection."
    );
    error.status = 503;
    throw error;
  }
  clearTimeout(timeoutId);

  const refreshedToken =
    response.headers.get("x-access-token") || response.headers.get("X-Access-Token");
  if (refreshedToken) {
    const currentRole = await getStoredRole();
    if (currentRole) await setStoredAuth(refreshedToken, currentRole);
  }

  if (!response.ok) {
    let message = "An unexpected error occurred.";
    try {
      const data = await response.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail)) message = data.detail.map((e) => e.msg).join(", ");
    } catch {
      message = response.statusText || message;
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return {};
  return response.json();
}

export async function uploadFormData(endpoint, formData) {
  const token = await getStoredToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "Upload failed.");
  }
  return response.json();
}
