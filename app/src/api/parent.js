import { fetchApi } from "./client";

export async function getParentChildren() {
  return fetchApi("/parent/children");
}

export async function addParentChild(studentUniqueNumber) {
  return fetchApi("/parent/children/add", {
    method: "POST",
    body: JSON.stringify({ student_unique_number: studentUniqueNumber }),
  });
}

export async function getChildProfile(studentUniqueNumber) {
  return fetchApi(`/parent/children/${studentUniqueNumber}/profile`);
}

export async function getChildQuizResult(studentUniqueNumber) {
  try {
    return await fetchApi(`/parent/children/${studentUniqueNumber}/quiz-result`);
  } catch (err) {
    if (err?.message?.includes("has not completed their diagnostic")) return null;
    throw err;
  }
}

export async function getChildLearningProgress(studentUniqueNumber) {
  return fetchApi(`/parent/children/${encodeURIComponent(studentUniqueNumber)}/progress`);
}

export async function getChildDetailedProgress(studentUniqueNumber) {
  return fetchApi(`/parent/children/${encodeURIComponent(studentUniqueNumber)}/detailed-progress`);
}

export async function getParentChildLeaderboard(studentUniqueNumber) {
  return fetchApi(`/parent/children/${studentUniqueNumber}/leaderboard`);
}

export async function getChildTestResults(studentUniqueNumber) {
  return fetchApi(`/parent/children/${studentUniqueNumber}/test-results`);
}
