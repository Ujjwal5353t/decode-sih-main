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

export type ModuleSourceType = "pdf_upload" | "image_upload" | "ncert";

/** Mirrors backend `OcrStatus` — pending | processing | done | failed | na. */
export type OcrStatusValue = "pending" | "processing" | "done" | "failed" | "na";

export interface ModuleOut {
  id: string;
  branch_name: string;
  class_number: number;
  subject: string;
  title: string;
  file_url: string | null;
  created_at: string;
  // Fields the backend always returns for school modules. Optional here so
  // existing callers that only read the properties above stay unchanged.
  source_type?: ModuleSourceType;
  ncert_book_id?: string | null;
  updated_at?: string;
  ocr_status?: OcrStatusValue;
  ocr_pdf_url?: string | null;
}

/** Response of GET /school/classes/{n}/modules/{id}/ocr */
export interface OcrStatusOut {
  module_id: string;
  ocr_status: OcrStatusValue;
  ocr_pdf_url: string | null;
  message: string;
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

// ── Diagnostic Quiz Types ──────────────────────────────────────────────────────

export type TopicType = "concept" | "skill";
export type QuizAttemptStatus = "in_progress" | "completed" | "abandoned";

export interface QuestionOut {
  id: string;
  subject: string;
  class_number: number;
  topic_name: string;
  topic_type: TopicType;
  question_text: string;
  options: string[];
  image_emoji: string | null;
  option_emojis: string[] | null;
  image_asset_key: string | null;
  option_asset_keys: string[] | null;
}

export interface StartQuizResponse {
  attempt_id: string;
  question: QuestionOut | null;
}

export interface AnswerResponse {
  finished: boolean;
  next_question: QuestionOut | null;
  was_correct: boolean;
}

export interface GapItemOut {
  subject: string;
  topic_code: string;
  topic_name: string;
  originating_class: number;
  student_current_class: number;
}

export interface SubjectScoreOut {
  score: number;
  topics_tested: number;
  gaps_found: number;
  average_classes_behind: number;
}

export type AiSummaryStatus = "pending" | "ready" | "failed";

export interface GapReportOut {
  attempt_id: string;
  subjects_covered: string[];
  gaps: GapItemOut[];
  completed_at: string | null;
  overall_score: number | null;
  subject_scores: Record<string, SubjectScoreOut | null>;
  student_class: number;
  ai_summary: string | null;
  ai_summary_status: AiSummaryStatus;
}

export interface StudentQuizSummaryOut {
  student_unique_number: string;
  student_email: string;
  completed: boolean;
  overall_score: number | null;
  gaps_found: number;
  ai_summary: string | null;
  ai_summary_status: AiSummaryStatus;
  completed_at: string | null;
}

export interface CurrentGapOut {
  subject: string;
  topic_code: string;
  topic_name: string;
  originating_class: number;
  updated_at: string;
}

export interface QuizAttemptSummaryOut {
  id: string;
  status: QuizAttemptStatus;
  subjects: string[];
  started_at: string;
  completed_at: string | null;
  overall_score: number | null;
}

export interface QuizStatusOut {
  completed: boolean;
  attempt_id: string | null;
  in_progress_attempt_id: string | null;
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

export interface SubjectPriorityOut {
  subject: string;
  priority_rank: number;
  gap_count: number;
  avg_classes_behind: number;
  gap_topics: string[];
}

export async function getSubjectPriority(): Promise<SubjectPriorityOut[]> {
  return fetchApi<SubjectPriorityOut[]>("/student/subject-priority");
}

export async function getSchoolClasses(): Promise<number[]> {
  return fetchApi<number[]>("/school/classes");
}

export async function getSchoolClassModules(
  class_number: number
): Promise<ModuleOut[]> {
  return fetchApi<ModuleOut[]>(`/school/classes/${class_number}/modules`);
}

export async function getSchoolClassQuizSummaries(
  class_number: number
): Promise<StudentQuizSummaryOut[]> {
  return fetchApi<StudentQuizSummaryOut[]>(`/school/classes/${class_number}/quiz-summaries`);
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

// Returns null (not thrown) if the child hasn't completed the diagnostic yet,
// since that's an expected state a parent dashboard needs to render around.
export async function getChildQuizResult(
  student_unique_number: string
): Promise<GapReportOut | null> {
  try {
    return await fetchApi<GapReportOut>(
      `/parent/children/${student_unique_number}/quiz-result`
    );
  } catch (err: any) {
    if (err?.message?.includes("has not completed their diagnostic")) return null;
    throw err;
  }
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

// ── School Module Upload & OCR ────────────────────────────────────────────────
// Wrappers around the module endpoints already exposed by the School Dashboard
// router (see backend `src/api/routes/school.py`). Nothing here is new backend
// surface — these are the same contracts the dashboard already relies on.

/**
 * Build the backend proxy URL used to view a stored PDF inline.
 * Mirrors `GET /files/view-pdf`, which streams both local `/uploads/...` paths
 * and remote Cloudinary URLs with the right `Content-Type`.
 */
export function buildPdfViewUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return `${API_BASE_URL}/files/view-pdf?url=${encodeURIComponent(url)}`;
}

/**
 * Multipart POST/PUT with real upload-progress reporting.
 *
 * `fetchApi` is used everywhere else, but `fetch` cannot report upload
 * progress, so the multipart module endpoints go through XHR instead. Auth,
 * error shape and the sliding-window token refresh behave identically.
 */
function uploadFormData<T>(
  endpoint: string,
  formData: FormData,
  options: { method?: "POST" | "PUT"; onProgress?: (percent: number) => void } = {}
): Promise<T> {
  const { method = "POST", onProgress } = options;

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE_URL}${endpoint}`);

    const token = getStoredToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      // Sliding window token update check from backend header
      const refreshedToken = xhr.getResponseHeader("x-access-token");
      if (refreshedToken) {
        const currentRole = getStoredRole();
        if (currentRole) {
          setStoredAuth(refreshedToken, currentRole);
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (xhr.status === 204 || !xhr.responseText) {
          resolve({} as T);
          return;
        }
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new Error("Received an invalid response from the server."));
        }
        return;
      }

      let errorMessage = "An unexpected error occurred.";
      try {
        const errorData = JSON.parse(xhr.responseText);
        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((e: { msg?: string }) => e.msg)
            .join(", ");
        }
      } catch {
        errorMessage = xhr.statusText || errorMessage;
      }
      reject(new Error(errorMessage));
    };

    xhr.onerror = () =>
      reject(new Error("Network error — could not reach the server."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.ontimeout = () => reject(new Error("The upload timed out."));

    xhr.send(formData);
  });
}

/** POST /school/classes/{class_number}/modules/pdf — upload a PDF as a module. */
export async function uploadSchoolPdfModule(
  class_number: number,
  title: string,
  file: File,
  onProgress?: (percent: number) => void,
  subject?: string
): Promise<ModuleOut> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  if (subject) formData.append("subject", subject);
  return uploadFormData<ModuleOut>(
    `/school/classes/${class_number}/modules/pdf`,
    formData,
    { onProgress }
  );
}

/**
 * POST /school/classes/{class_number}/modules/images — upload page images.
 * The backend merges them into one PDF and starts EasyOCR in the background,
 * so the created module comes back with `ocr_status: "pending"`.
 */
export async function uploadSchoolImagesModule(
  class_number: number,
  title: string,
  files: File[],
  onProgress?: (percent: number) => void,
  subject?: string
): Promise<ModuleOut> {
  const formData = new FormData();
  formData.append("title", title);
  files.forEach((file) => formData.append("files", file));
  if (subject) formData.append("subject", subject);
  return uploadFormData<ModuleOut>(
    `/school/classes/${class_number}/modules/images`,
    formData,
    { onProgress }
  );
}


/**
 * PUT /school/classes/{class_number}/modules/{module_id}/replace-images
 * Replaces the module's pages and re-runs OCR from scratch. This is the retry
 * path the backend documents for a failed extraction.
 */
export async function replaceSchoolModuleImages(
  class_number: number,
  module_id: string,
  files: File[],
  title?: string,
  onProgress?: (percent: number) => void
): Promise<ModuleOut> {
  const formData = new FormData();
  if (title) formData.append("title", title);
  files.forEach((file) => formData.append("files", file));
  return uploadFormData<ModuleOut>(
    `/school/classes/${class_number}/modules/${module_id}/replace-images`,
    formData,
    { method: "PUT", onProgress }
  );
}

/** GET /school/classes/{class_number}/modules/{module_id}/ocr — poll OCR state. */
export async function getModuleOcrStatus(
  class_number: number,
  module_id: string
): Promise<OcrStatusOut> {
  return fetchApi<OcrStatusOut>(
    `/school/classes/${class_number}/modules/${module_id}/ocr`
  );
}

/** PATCH /school/classes/{class_number}/modules/{module_id}/title */
export async function updateSchoolModuleTitle(
  class_number: number,
  module_id: string,
  title: string
): Promise<ModuleOut> {
  return fetchApi<ModuleOut>(
    `/school/classes/${class_number}/modules/${module_id}/title`,
    { method: "PATCH", body: JSON.stringify({ title }) }
  );
}

/** DELETE /school/classes/{class_number}/modules/{module_id} */
export async function deleteSchoolModule(
  class_number: number,
  module_id: string
): Promise<void> {
  await fetchApi<void>(`/school/classes/${class_number}/modules/${module_id}`, {
    method: "DELETE",
  });
}

// ── School Registration & Verification ────────────────────────────────────────
// Backend: src/api/routes/school_verification.py
// Phone verification reuses the existing sendOTP/verifyOTP helpers above —
// there is no second OTP client here.

export type ClaimStatusValue = "pending" | "approved" | "rejected";
export type AuthorityStatusValue =
  | "unverified"
  | "verified"
  | "manual_review"
  | "failed";
export type ClaimRouteValue = "first_admin" | "owner_approval";

export interface SchoolRecordOut {
  udise_code: string;
  school_name: string;
  state: string;
  district: string;
  management: string;
  board: string | null;
}

export interface EmailVerificationResponse {
  status: string;
  message: string;
  email?: string | null;
  verified?: boolean | null;
}

export interface PublisherWithSubjectsOut {
  id: string;
  name: string;
  subjects: string[];
}

export interface ClassSubjectPublisherItem {
  class_number: number;
  publisher_name: string;
  subjects: string[];
}

export interface ClaimStatusOut {
  id: string;
  udise_code: string;
  school_name: string;
  full_name: string;
  designation: string;
  official_email: string;
  phone_number: string;
  school_identity_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  authority_status: AuthorityStatusValue;
  route: ClaimRouteValue;
  status: ClaimStatusValue;
  authority_notes: string | null;
  decision_reason: string | null;
  evidence_url: string | null;
  class_subjects?: ClassSubjectPublisherItem[] | null;
  created_at: string;
  admin_access_granted: boolean;
}

export interface ClaimCreatedResponse {
  claim: ClaimStatusOut;
  message: string;
}

export interface OwnerClaimListItem {
  id: string;
  full_name: string;
  designation: string;
  official_email: string;
  phone_number: string;
  school_name: string;
  status: ClaimStatusValue;
  created_at: string;
}

/** List all textbook publishers and their available subjects */
export async function getPublishersWithSubjects(): Promise<PublisherWithSubjectsOut[]> {
  return fetchApi<PublisherWithSubjectsOut[]>("/school-verification/publishers");
}

/** Official school record by UDISE code. */
export async function lookupSchoolByUdise(
  udise_code: string
): Promise<SchoolRecordOut> {
  return fetchApi<SchoolRecordOut>(
    `/school-verification/lookup?udise_code=${encodeURIComponent(udise_code)}`
  );
}

/** Official school directory search by name / state / district. */
export async function searchSchoolDirectory(params: {
  name?: string;
  state?: string;
  district?: string;
}): Promise<SchoolRecordOut[]> {
  const query = new URLSearchParams();
  if (params.name?.trim()) query.append("name", params.name.trim());
  if (params.state?.trim()) query.append("state", params.state.trim());
  if (params.district?.trim()) query.append("district", params.district.trim());
  return fetchApi<SchoolRecordOut[]>(
    `/school-verification/search?${query.toString()}`
  );
}

export async function sendSchoolEmailCode(
  email: string
): Promise<EmailVerificationResponse> {
  return fetchApi<EmailVerificationResponse>("/school-verification/email/send", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifySchoolEmailCode(
  email: string,
  code: string
): Promise<EmailVerificationResponse> {
  return fetchApi<EmailVerificationResponse>("/school-verification/email/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function createSchoolClaim(payload: {
  udise_code: string;
  full_name: string;
  designation: string;
  official_email: string;
  phone_number: string;
  password: string;
  class_subjects?: ClassSubjectPublisherItem[];
}): Promise<ClaimCreatedResponse> {
  return fetchApi<ClaimCreatedResponse>("/school-verification/claims", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSchoolClaim(claim_id: string): Promise<ClaimStatusOut> {
  return fetchApi<ClaimStatusOut>(`/school-verification/claims/${claim_id}`);
}

/** Attach a supporting authority document. Never approves the claim by itself. */
export async function uploadClaimEvidence(
  claim_id: string,
  file: File
): Promise<ClaimStatusOut> {
  const formData = new FormData();
  formData.append("file", file);
  return uploadFormData<ClaimStatusOut>(
    `/school-verification/claims/${claim_id}/evidence`,
    formData
  );
}

/**
 * Exchange an approved claim for a School Admin session.
 * Fails with 403 while the claim is pending or rejected.
 */
export async function activateSchoolClaim(
  claim_id: string
): Promise<TokenResponse> {
  const res = await fetchApi<TokenResponse>(
    `/school-verification/claims/${claim_id}/activate`,
    { method: "POST", body: JSON.stringify({}) }
  );
  setStoredAuth(res.access_token, "school");
  return res;
}

// ── Verified owner: approve / reject administrator requests ───────────────────

export async function getOwnerClaimRequests(): Promise<OwnerClaimListItem[]> {
  return fetchApi<OwnerClaimListItem[]>("/school-verification/owner/requests");
}

export async function approveOwnerClaim(
  claim_id: string,
  reason?: string
): Promise<ClaimStatusOut> {
  return fetchApi<ClaimStatusOut>(
    `/school-verification/owner/requests/${claim_id}/approve`,
    { method: "POST", body: JSON.stringify({ reason: reason ?? null }) }
  );
}

export async function rejectOwnerClaim(
  claim_id: string,
  reason?: string
): Promise<ClaimStatusOut> {
  return fetchApi<ClaimStatusOut>(
    `/school-verification/owner/requests/${claim_id}/reject`,
    { method: "POST", body: JSON.stringify({ reason: reason ?? null }) }
  );
}

// ── Super Admin: school registration requests ─────────────────────────────────

export interface SchoolRequestListItem {
  id: string;
  school_name: string;
  udise_code: string;
  state: string | null;
  district: string | null;
  board: string | null;
  management: string | null;
  full_name: string;
  designation: string;
  official_email: string;
  phone_number: string;
  phone_verified: boolean;
  email_verified: boolean;
  authority_status: AuthorityStatusValue;
  authority_notes: string | null;
  evidence_url: string | null;
  status: ClaimStatusValue;
  decision_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  class_subjects?: ClassSubjectPublisherItem[] | null;
  admin_access_granted: boolean;
}


export async function getSchoolRegistrationRequests(
  status?: ClaimStatusValue
): Promise<SchoolRequestListItem[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchApi<SchoolRequestListItem[]>(`/admin/school-requests${query}`);
}

export async function approveSchoolRequest(
  claim_id: string,
  reason?: string
): Promise<SchoolRequestListItem> {
  return fetchApi<SchoolRequestListItem>(
    `/admin/school-requests/${claim_id}/approve`,
    { method: "POST", body: JSON.stringify({ reason: reason ?? null }) }
  );
}

export async function rejectSchoolRequest(
  claim_id: string,
  reason?: string
): Promise<SchoolRequestListItem> {
  return fetchApi<SchoolRequestListItem>(
    `/admin/school-requests/${claim_id}/reject`,
    { method: "POST", body: JSON.stringify({ reason: reason ?? null }) }
  );
}

// ── School Admin: first-run class/subject setup ───────────────────────────────

export interface ClassSubjectOptions {
  class_number: number;
  class_label: string;
  subject_count: number;
  subjects: string[];
  selected: string[];
}

export interface SubjectSetupOut {
  completed: boolean;
  configured_at: string | null;
  classes: ClassSubjectOptions[];
}

export async function getSchoolSubjectSetup(): Promise<SubjectSetupOut> {
  return fetchApi<SubjectSetupOut>("/school/subject-setup");
}

export interface SchoolSubjectDetail {
  id: string;
  class_number: number;
  subject: string;
  publisher_name?: string | null;
  created_at?: string;
}

export async function getSchoolSubjects(
  class_number?: number
): Promise<SchoolSubjectDetail[]> {
  const q = class_number ? `?class_number=${class_number}` : "";
  return fetchApi<SchoolSubjectDetail[]>(`/school/subjects${q}`);
}

export async function saveSchoolSubjectSetup(
  classes: { class_number: number; subjects: string[] }[]
): Promise<SubjectSetupOut> {
  return fetchApi<SubjectSetupOut>("/school/subject-setup", {
    method: "PUT",
    body: JSON.stringify({ classes }),
  });
}

// ── Diagnostic Quiz Endpoints ──────────────────────────────────────────────────

export async function startQuiz(payload?: {
  subjects?: string[];
}): Promise<StartQuizResponse> {
  return fetchApi<StartQuizResponse>("/quiz/start", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function answerQuiz(
  attemptId: string,
  payload: { question_id: string; selected_option_index: number }
): Promise<AnswerResponse> {
  return fetchApi<AnswerResponse>(`/quiz/${attemptId}/answer`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getQuizResult(attemptId: string): Promise<GapReportOut> {
  return fetchApi<GapReportOut>(`/quiz/${attemptId}/result`);
}

export async function getQuizAttempts(): Promise<QuizAttemptSummaryOut[]> {
  return fetchApi<QuizAttemptSummaryOut[]>("/quiz/attempts");
}

export async function getCurrentGaps(): Promise<CurrentGapOut[]> {
  return fetchApi<CurrentGapOut[]>("/quiz/gaps");
}

export async function getQuizStatus(): Promise<QuizStatusOut> {
  return fetchApi<QuizStatusOut>("/quiz/status");
}

// ── Animated Lessons ───────────────────────────────────────────────────────────

export interface LessonListItemOut {
  id: string;
  subject: string;
  class_number: number;
  chapter_number: number;
  chapter_title: string;
  slide_count: number;
}

export type LessonSlideType = "concept" | "example" | "check";

export interface LessonSlideOut {
  id: string;
  slide_index: number;
  slide_type: LessonSlideType;
  text: string;
  image_asset_key: string | null;
  image_emoji: string | null;
  options: string[] | null;
  correct_option_index: number | null;
  explanation: string | null;
}

export interface LessonOut {
  id: string;
  subject: string;
  class_number: number;
  chapter_number: number;
  chapter_title: string;
  slides: LessonSlideOut[];
}

export async function getLessons(
  subject?: string,
  classNumber?: number
): Promise<LessonListItemOut[]> {
  const params = new URLSearchParams();
  if (subject) params.append("subject", subject);
  if (classNumber) params.append("class_number", classNumber.toString());
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchApi<LessonListItemOut[]>(`/student/lessons${q}`);
}

export async function getLesson(lessonId: string): Promise<LessonOut> {
  return fetchApi<LessonOut>(`/student/lessons/${lessonId}`);
}
