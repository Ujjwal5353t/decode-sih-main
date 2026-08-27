const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export type Role = "student" | "school" | "parent" | "admin" | "teacher";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
}

export interface OTPResponse {
  status: string;
  message: string;
  phone_number?: string;
  verified?: boolean;
}

export interface StudentProfile {
  id: string;
  unique_number: string;
  full_name?: string;
  email?: string | null;
  phone_number?: string | null;
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
  email?: string | null;
  phone_number?: string | null;
  state: string;
  created_at: string;
}

export interface ParentProfile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
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
  full_name?: string;
  class_number?: number | null;
  section?: string | null;
  school_name?: string | null;
  branch_name?: string | null;
  enrollment_type?: string | null;
  created_at: string;
}

// ── Permission & RBAC Navigation Schema ───────────────────────────────────────

export interface PermissionAction {
  key: string;
  label: string;
  description: string;
}

export interface DashboardPermissionItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  category?: string;
  badge?: string | null;
  is_default?: boolean;
  actions?: PermissionAction[];
}

export interface RolePermissionsResponse {
  role: Role;
  role_label: string;
  capabilities: string[];
  navigation: DashboardPermissionItem[];
}

export async function getRolePermissions(role?: Role): Promise<RolePermissionsResponse> {
  const q = role ? `?role=${encodeURIComponent(role)}` : "";
  return fetchApi<RolePermissionsResponse>(`/auth/permissions${q}`);
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

// ── OTP Endpoints ─────────────────────────────────────────────────────────────

export async function sendOTP(phone_number: string): Promise<OTPResponse> {
  return fetchApi<OTPResponse>("/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ phone_number }),
  });
}

export async function verifyOTP(phone_number: string, otp_code: string): Promise<OTPResponse> {
  return fetchApi<OTPResponse>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone_number, otp_code }),
  });
}

export async function loginWithOTP(payload: {
  phone_number: string;
  otp_code: string;
  role: Role;
  branch_name?: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/login/otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, payload.role);
  return res;
}

// ── Auth Endpoints ─────────────────────────────────────────────────────────────

export async function loginStudent(payload: {
  branch_name?: string;
  enrollment_type?: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
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
  full_name?: string;
  enrollment_type?: string;
  school_name?: string;
  branch_name?: string;
  email?: string;
  phone_number?: string;
  password: string;
  state?: string;
  class_number?: number;
  section?: string;
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
  email?: string;
  phone_number?: string;
  identifier?: string;
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
  email?: string;
  phone_number?: string;
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
  email?: string;
  phone_number?: string;
  identifier?: string;
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
  full_name?: string;
  email?: string;
  phone_number?: string;
  password: string;
  student_unique_number?: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/parent/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "parent");
  return res;
}

export async function loginAdmin(payload: {
  email?: string;
  identifier?: string;
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

export async function getAllNCERTBooks(class_number?: number, subject?: string): Promise<NCERTBookOut[]> {
  const params = new URLSearchParams();
  if (class_number) params.append("class_number", class_number.toString());
  if (subject) params.append("subject", subject);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchApi<NCERTBookOut[]>(`/ncert/books${q}`);
}

export async function uploadNCERTBookPdf(book_id: string, file: File): Promise<NCERTBookOut> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/ncert/books/${book_id}/upload-pdf`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      typeof err.detail === "string" ? err.detail : "Failed to upload NCERT PDF file."
    );
  }
  return response.json();
}

export async function createNCERTBook(formData: FormData): Promise<NCERTBookOut> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/ncert/books`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      typeof err.detail === "string" ? err.detail : "Failed to create NCERT book."
    );
  }
  return response.json();
}

export async function updateNCERTBook(
  book_id: string,
  payload: { title?: string; subject?: string; description?: string; class_number?: number }
): Promise<NCERTBookOut> {
  return fetchApi<NCERTBookOut>(`/ncert/books/${book_id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function detachNCERTBookFile(book_id: string): Promise<NCERTBookOut> {
  return fetchApi<NCERTBookOut>(`/ncert/books/${book_id}/file`, {
    method: "DELETE",
  });
}

export async function deleteNCERTBook(book_id: string): Promise<void> {
  await fetchApi<{}>(`/ncert/books/${book_id}`, {
    method: "DELETE",
  });
}

export async function addNCERTModuleToSchool(
  class_number: number,
  ncert_book_id: string,
  title?: string
): Promise<ModuleOut> {
  return fetchApi<ModuleOut>(`/school/classes/${class_number}/modules/ncert`, {
    method: "POST",
    body: JSON.stringify({ ncert_book_id, title }),
  });
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

// ── Teacher Types ──────────────────────────────────────────────────────────────

export interface TeacherProfile {
  id: string;
  name: string;
  phone_number: string;
  school_name: string;
  branch_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TeacherClassOut {
  id: string;
  class_number: number;
  section: string;
  label: string;  // e.g. "4A"
  assigned_at: string;
}

export interface AssignmentOut {
  id: string;
  teacher_id: string;
  branch_name: string;
  class_number: number;
  section: string;
  title: string;
  description: string | null;
  assignment_type: "pdf_upload" | "ai_quiz";
  file_url: string | null;
  module_ids: string | null;  // JSON array string
  deadline_at: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubmissionOut {
  id: string;
  student_id: string;
  student_unique_number: string;
  student_name: string | null;
  student_email: string | null;
  score: number | null;
  max_score: number | null;
  attempted_at: string;
  last_attempted_at: string;
}

export interface FeedbackOut {
  id: string;
  assignment_id: string;
  student_id: string;
  teacher_id: string;
  feedback_text: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherListItem {
  id: string;
  name: string;
  phone_number: string;
  is_active: boolean;
  assigned_classes: TeacherClassOut[];
  created_at: string;
}

// ── Teacher Auth ───────────────────────────────────────────────────────────────

export async function loginTeacher(payload: {
  phone_number: string;
  branch_name: string;
  password: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/teacher/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "teacher");
  return res;
}

export async function registerTeacher(payload: {
  name: string;
  phone_number: string;
  school_name: string;
  branch_name: string;
  password: string;
}): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>("/auth/teacher/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setStoredAuth(res.access_token, "teacher");
  return res;
}

export async function getTeacherProfile(): Promise<TeacherProfile> {
  return fetchApi<TeacherProfile>("/teacher/me");
}

// ── Teacher Dashboard APIs ────────────────────────────────────────────────────

export async function getTeacherClasses(): Promise<TeacherClassOut[]> {
  return fetchApi<TeacherClassOut[]>("/teacher/classes");
}

export async function getTeacherClassStudents(
  class_number: number,
  section: string
): Promise<StudentProfile[]> {
  return fetchApi<StudentProfile[]>(`/teacher/classes/${class_number}/${section}/students`);
}

export async function getTeacherClassModules(
  class_number: number,
  section: string
): Promise<ModuleOut[]> {
  return fetchApi<ModuleOut[]>(`/teacher/classes/${class_number}/${section}/modules`);
}

export async function getTeacherAssignments(
  class_number: number,
  section: string
): Promise<AssignmentOut[]> {
  return fetchApi<AssignmentOut[]>(`/teacher/classes/${class_number}/${section}/assignments`);
}

export async function createPdfAssignment(
  class_number: number,
  section: string,
  formData: FormData
): Promise<AssignmentOut> {
  const token = getStoredToken();
  const response = await fetch(
    `${API_BASE_URL}/teacher/classes/${class_number}/${section}/assignments/upload-pdf`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      typeof err.detail === "string" ? err.detail : "Failed to create PDF assignment."
    );
  }
  return response.json();
}

export async function createAiQuizAssignment(
  class_number: number,
  section: string,
  payload: {
    title: string;
    description?: string | null;
    module_ids: string[];
    deadline_days?: number | null;
  }
): Promise<AssignmentOut> {
  return fetchApi<AssignmentOut>(
    `/teacher/classes/${class_number}/${section}/assignments/ai-quiz`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function updateAssignment(
  assignment_id: string,
  payload: { title?: string; description?: string; deadline_days?: number }
): Promise<AssignmentOut> {
  return fetchApi<AssignmentOut>(`/teacher/assignments/${assignment_id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAssignment(assignment_id: string): Promise<void> {
  await fetchApi<{}>(`/teacher/assignments/${assignment_id}`, { method: "DELETE" });
}

export async function getAssignmentSubmissions(
  assignment_id: string
): Promise<SubmissionOut[]> {
  return fetchApi<SubmissionOut[]>(`/teacher/assignments/${assignment_id}/submissions`);
}

export async function setSubmissionScore(
  assignment_id: string,
  student_id: string,
  score: number,
  max_score: number
): Promise<SubmissionOut> {
  return fetchApi<SubmissionOut>(
    `/teacher/assignments/${assignment_id}/submissions/${student_id}/score`,
    { method: "PATCH", body: JSON.stringify({ score, max_score }) }
  );
}

export async function postStudentFeedback(
  assignment_id: string,
  student_id: string,
  feedback_text: string
): Promise<FeedbackOut> {
  return fetchApi<FeedbackOut>(
    `/teacher/assignments/${assignment_id}/students/${student_id}/feedback`,
    { method: "POST", body: JSON.stringify({ feedback_text }) }
  );
}

export async function getStudentFeedbackForAssignment(
  assignment_id: string,
  student_id: string
): Promise<FeedbackOut | null> {
  return fetchApi<FeedbackOut | null>(
    `/teacher/assignments/${assignment_id}/students/${student_id}/feedback`
  );
}

// ── Student Assignment APIs ────────────────────────────────────────────────────

export async function getStudentAssignments(): Promise<AssignmentOut[]> {
  return fetchApi<AssignmentOut[]>("/student/assignments");
}

export async function submitStudentAssignment(
  assignment_id: string
): Promise<SubmissionOut> {
  return fetchApi<SubmissionOut>(`/student/assignments/${assignment_id}/submit`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getStudentAssignmentFeedback(
  assignment_id: string
): Promise<FeedbackOut | null> {
  return fetchApi<FeedbackOut | null>(`/student/assignments/${assignment_id}/feedback`);
}

// ── School Admin Teacher Management ───────────────────────────────────────────

export async function getSchoolTeachers(): Promise<TeacherListItem[]> {
  return fetchApi<TeacherListItem[]>("/school/teachers");
}

export async function assignClassToTeacher(
  teacher_id: string,
  class_number: number,
  section: string
): Promise<TeacherClassOut> {
  return fetchApi<TeacherClassOut>(`/school/teachers/${teacher_id}/assign-class`, {
    method: "POST",
    body: JSON.stringify({ class_number, section }),
  });
}

export async function deassignClassFromTeacher(
  teacher_id: string,
  class_number: number,
  section: string
): Promise<void> {
  await fetchApi<{}>(
    `/school/teachers/${teacher_id}/assign-class/${class_number}/${section}`,
    { method: "DELETE" }
  );
}
