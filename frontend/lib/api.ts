const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export type Role = "student" | "school" | "parent" | "admin";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
}

export interface StudentProfile {
  id: string;
  unique_number: string;
  email: string;
  state: string;
  school_name: string;
  branch_name: string;
  enrollment_type: string;
  class_number: number | null;
  section: string | null;
  created_at: string;
}

export interface SchoolSearchResult {
  school_name: string;
  branch_name: string;
  state: string;
}

export interface NCERTBookOut {
  id: string;
  class_number: number;
  subject: string;
  title: string;
  description: string;
  file_url: string | null;
  created_at: string;
}

export interface SchoolProfile {
  id: string;
  school_name: string;
  branch_name: string;
  student_prefix: string;
  email: string;
  state: string;
  created_at: string;
}

export interface ParentProfile {
  id: string;
  email: string;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  created_at: string;
}

export interface ModuleOut {
  id: string;
  branch_name: string;
  class_number: number;
  subject: string;
  title: string;
  file_url: string | null;
  created_at: string;
}

export interface ChildLinkOut {
  id: string;
  parent_id: string;
  student_unique_number: string;
  created_at: string;
}

// Token Helpers
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function getStoredRole(): Role | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_role") as Role | null;
}

export function setStoredAuth(token: string, role: Role) {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_role", role);
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_role");
}

// Universal Fetch Wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Sliding window token update check from backend header
  const refreshedToken = response.headers.get("x-access-token") || response.headers.get("X-Access-Token");
  if (refreshedToken) {
    const currentRole = getStoredRole();
    if (currentRole) {
      setStoredAuth(refreshedToken, currentRole);
    }
  }

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred.";
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((e: any) => e.msg).join(", ");
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ── Auth Endpoints ─────────────────────────────────────────────────────────────

export async function loginStudent(payload: {
  branch_name?: string;
  enrollment_type?: string;
  email: string;
  password: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/student/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "student");
  return res;
}

export async function registerStudent(payload: {
  enrollment_type?: string;
  school_name?: string;
  branch_name?: string;
  email: string;
  password: string;
  state?: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/student/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "student");
  return res;
}

export async function loginSchool(payload: {
  branch_name: string;
  email: string;
  password: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/school/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "school");
  return res;
}

export async function registerSchool(payload: {
  school_name: string;
  branch_name: string;
  student_prefix: string;
  email: string;
  password: string;
  state: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/school/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "school");
  return res;
}

export async function loginParent(payload: {
  email: string;
  password: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/parent/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "parent");
  return res;
}

export async function registerParent(payload: {
  email: string;
  password: string;
  student_unique_number: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/parent/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "parent");
  return res;
}

export async function loginAdmin(payload: {
  email: string;
  password: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "admin");
  return res;
}

export async function refreshAuthToken(access_token: string): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/token/refresh", {
    method: "POST",
    body: JSON.stringify({ access_token }),
  });
  setStoredAuth(res.access_token, res.role);
  return res;
}

// ── Profile Endpoints ──────────────────────────────────────────────────────────

export async function getStudentProfile(): Promise<StudentProfile> {
  return fetchApi<StudentProfile>("/student/me");
}

export async function getSchoolProfile(): Promise<SchoolProfile> {
  return fetchApi<SchoolProfile>("/school/me");
}

export async function getParentProfile(): Promise<ParentProfile> {
  return fetchApi<ParentProfile>("/parent/me");
}

export async function getAdminProfile(): Promise<AdminProfile> {
  return fetchApi<AdminProfile>("/admin/me");
}

// ── Role Specific Data Endpoints ──────────────────────────────────────────────

export async function setupStudentClass(payload: {
  class_number: number;
  section: string;
}): Promise<StudentProfile> {
  return fetchApi<StudentProfile>("/auth/student/setup-class", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getStudentModules(): Promise<ModuleOut[]> {
  return fetchApi<ModuleOut[]>("/student/modules");
}

export async function getSchoolClasses(): Promise<number[]> {
  return fetchApi<number[]>("/school/classes");
}

export async function getSchoolClassModules(
  class_number: number
): Promise<ModuleOut[]> {
  return fetchApi<ModuleOut[]>(`/school/classes/${class_number}/modules`);
}

export async function getParentChildren(): Promise<ChildLinkOut[]> {
  return fetchApi<ChildLinkOut[]>("/parent/children");
}

export async function addParentChild(payload: {
  student_unique_number: string;
}): Promise<ChildLinkOut> {
  return fetchApi<ChildLinkOut>("/parent/children/add", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getChildProfile(
  student_unique_number: string
): Promise<StudentProfile> {
  return fetchApi<StudentProfile>(
    `/parent/children/${student_unique_number}/profile`
  );
}

export async function searchSchools(query?: string): Promise<SchoolSearchResult[]> {
  const param = query ? `?query=${encodeURIComponent(query)}` : "";
  return fetchApi<SchoolSearchResult[]>(`/auth/schools/search${param}`);
}

export async function getNCERTBooksForClass(class_number: number): Promise<NCERTBookOut[]> {
  return fetchApi<NCERTBookOut[]>(`/ncert/books/class/${class_number}`);
}

export interface ContactInquiryResponse {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  status_message: string;
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactInquiryResponse> {
  return fetchApi<ContactInquiryResponse>("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
