import { fetchApi, setStoredAuth } from "./client";

export async function loginStudent(payload) {
  const res = await fetchApi("/auth/student/login", { method: "POST", body: JSON.stringify(payload) });
  await setStoredAuth(res.access_token, "student");
  return res;
}

export async function registerStudent(payload) {
  const res = await fetchApi("/auth/student/register", { method: "POST", body: JSON.stringify(payload) });
  await setStoredAuth(res.access_token, "student");
  return res;
}

export async function loginTeacher(payload) {
  const res = await fetchApi("/auth/teacher/login", { method: "POST", body: JSON.stringify(payload) });
  await setStoredAuth(res.access_token, "teacher");
  return res;
}

export async function registerTeacher(payload) {
  const res = await fetchApi("/auth/teacher/register", { method: "POST", body: JSON.stringify(payload) });
  await setStoredAuth(res.access_token, "teacher");
  return res;
}

export async function loginParent(payload) {
  const res = await fetchApi("/auth/parent/login", { method: "POST", body: JSON.stringify(payload) });
  await setStoredAuth(res.access_token, "parent");
  return res;
}

export async function registerParent(payload) {
  const res = await fetchApi("/auth/parent/register", { method: "POST", body: JSON.stringify(payload) });
  await setStoredAuth(res.access_token, "parent");
  return res;
}

export async function sendOTP(phone_number) {
  return fetchApi("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone_number }) });
}

export async function verifyOTP(phone_number, otp_code) {
  return fetchApi("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone_number, otp_code }) });
}

export async function getStudentProfile() {
  return fetchApi("/student/me");
}

export async function getTeacherProfile() {
  return fetchApi("/teacher/me");
}

export async function getParentProfile() {
  return fetchApi("/parent/me");
}

export async function setupStudentClass(payload) {
  return fetchApi("/auth/student/setup-class", { method: "POST", body: JSON.stringify(payload) });
}

export async function getRolePermissions(role, lang) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (lang) params.set("lang", lang);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchApi(`/auth/permissions${q}`);
}
