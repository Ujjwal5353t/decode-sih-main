import { fetchApi } from "./client";

export async function getStudentModules() {
  return fetchApi("/student/modules");
}

export async function getSubjectPriority() {
  return fetchApi("/student/subject-priority");
}

export async function getLessons(subject, classNumber) {
  const params = new URLSearchParams();
  if (subject) params.append("subject", subject);
  if (classNumber) params.append("class_number", String(classNumber));
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchApi(`/student/lessons${q}`);
}

export async function getLesson(lessonId) {
  return fetchApi(`/student/lessons/${lessonId}`);
}

export async function getStudentLearningProgress() {
  return fetchApi("/student/progress");
}

export async function getStudentDetailedProgress() {
  return fetchApi("/student/detailed-progress");
}

export async function syncLearningEvents(events) {
  return fetchApi("/student/learning-events", { method: "POST", body: JSON.stringify({ events }) });
}

// ── Diagnostic quiz ──────────────────────────────────────────────────────────

export async function startQuiz(payload) {
  return fetchApi("/quiz/start", { method: "POST", body: JSON.stringify(payload || {}) });
}

export async function answerQuiz(attemptId, payload) {
  return fetchApi(`/quiz/${attemptId}/answer`, { method: "POST", body: JSON.stringify(payload) });
}

export async function getQuizResult(attemptId) {
  return fetchApi(`/quiz/${attemptId}/result`);
}

export async function getQuizStatus() {
  return fetchApi("/quiz/status");
}

export async function getCurrentGaps() {
  return fetchApi("/quiz/gaps");
}

// ── Gap-driven learning modules ───────────────────────────────────────────────

export async function getLearningModules() {
  const res = await fetchApi("/student/learning-modules");
  return res.modules;
}

export async function getLearningModule(gapId) {
  return fetchApi(`/student/learning-modules/${gapId}`);
}

export async function startModuleQuiz(gapId) {
  return fetchApi(`/student/learning-modules/${gapId}/quiz/start`, { method: "POST" });
}

export async function submitModuleQuiz(gapId, answers) {
  return fetchApi(`/student/learning-modules/${gapId}/quiz/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

// ── Assignments ────────────────────────────────────────────────────────────────

export async function getStudentAssignments() {
  return fetchApi("/student/assignments");
}

export async function getAssignmentQuizForStudent(assignmentId) {
  return fetchApi(`/student/assignments/${assignmentId}/quiz`);
}

export async function submitAssignmentQuiz(assignmentId, answers) {
  return fetchApi(`/student/assignments/${assignmentId}/submit-quiz`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function getStudentAssignmentFeedback(assignmentId) {
  return fetchApi(`/student/assignments/${assignmentId}/feedback`);
}

// Bundles assignment + submission (score/pass-fail) + attempts + teacher feedback
// for every assignment this student has ever had, so a list screen can show
// status (not started / submitted / passed / failed) without an N+1 fetch.
export async function getStudentTestResults() {
  return fetchApi("/student/test-results");
}

// ── Gamification & leaderboard ─────────────────────────────────────────────────

export async function getGamificationSummary() {
  return fetchApi("/student/gamification");
}

export async function claimRewardChest() {
  return fetchApi("/student/gamification/claim-chest", { method: "POST" });
}

export async function getStudentLeaderboard() {
  return fetchApi("/student/leaderboard");
}
