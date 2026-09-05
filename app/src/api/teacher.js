import { fetchApi } from "./client";

export async function getTeacherClasses() {
  return fetchApi("/teacher/classes");
}

export async function getTeacherClassStudents(classNumber, section) {
  return fetchApi(`/teacher/classes/${classNumber}/${section}/students`);
}

export async function getTeacherClassModules(classNumber, section, subject) {
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return fetchApi(`/teacher/classes/${classNumber}/${section}/modules${q}`);
}

export async function getTeacherAssignments(classNumber, section) {
  return fetchApi(`/teacher/classes/${classNumber}/${section}/assignments`);
}

export async function createAiQuizAssignment(classNumber, section, payload) {
  return fetchApi(`/teacher/classes/${classNumber}/${section}/assignments/ai-quiz`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteAssignment(assignmentId) {
  return fetchApi(`/teacher/assignments/${assignmentId}`, { method: "DELETE" });
}

export async function getAssignmentSubmissions(assignmentId) {
  return fetchApi(`/teacher/assignments/${assignmentId}/submissions`);
}

export async function postStudentFeedback(assignmentId, studentId, feedbackText) {
  return fetchApi(`/teacher/assignments/${assignmentId}/students/${studentId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ feedback_text: feedbackText }),
  });
}

export async function getClassLearningProgress(classNumber, section, subject) {
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return fetchApi(`/teacher/classes/${classNumber}/${section}/progress${q}`);
}

export async function getTeacherStudentDetailedProgress(studentUniqueNumber, subject) {
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return fetchApi(`/teacher/students/${encodeURIComponent(studentUniqueNumber)}/detailed-progress${q}`);
}

export async function getTeacherClassLeaderboard(classNumber, section) {
  return fetchApi(`/teacher/classes/${classNumber}/${section}/leaderboard`);
}

export async function getTeacherClassChapters(classNumber, subject, moduleId) {
  const params = new URLSearchParams();
  if (subject) params.append("subject", subject);
  if (moduleId) params.append("module_id", moduleId);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchApi(`/teacher/classes/${classNumber}/chapters${q}`);
}
