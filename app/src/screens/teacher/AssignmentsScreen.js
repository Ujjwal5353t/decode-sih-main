import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, LoadingScreen, ErrorBanner, EmptyState } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useTranslation } from "../../context/LanguageContext";
import {
  getTeacherClasses,
  getTeacherAssignments,
  createAiQuizAssignment,
  getAssignmentSubmissions,
  deleteAssignment,
  postStudentFeedback,
  getTeacherClassChapters,
} from "../../api/teacher";

function FeedbackRow({ assignmentId, submission, t }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await postStudentFeedback(assignmentId, submission.student_id, text.trim());
      setSent(true);
      setText("");
    } catch (err) {
      setError(err.message || t("teacherDashboard.mobile.assignments.feedbackError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="py-2 border-b border-slate-50">
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-slate-600 flex-1 pr-2" numberOfLines={1}>
          {submission.student_name || submission.student_unique_number}
        </Text>
        <Text className="text-xs font-bold text-slate-700">
          {submission.percentage != null ? `${Math.round(submission.percentage)}%` : "—"}
        </Text>
      </View>
      <View className="flex-row items-center gap-2 mt-2">
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v);
            setSent(false);
          }}
          placeholder={t("teacherDashboard.feedbackPlaceholder")}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
        />
        <Pressable
          onPress={send}
          disabled={sending || !text.trim()}
          className={`shrink-0 px-3 py-1.5 rounded-lg ${sending || !text.trim() ? "bg-slate-100" : "bg-sky-600"}`}
        >
          <Text className={`text-xs font-bold ${sending || !text.trim() ? "text-slate-400" : "text-white"}`} numberOfLines={1}>
            {sending ? t("teacherDashboard.saving") : t("teacherDashboard.mobile.assignments.sendFeedback")}
          </Text>
        </Pressable>
      </View>
      {sent && <Text className="text-xs text-emerald-600 mt-1">{t("teacherDashboard.mobile.assignments.feedbackSent")}</Text>}
      {error && <Text className="text-xs text-rose-500 mt-1">{error}</Text>}
    </View>
  );
}

function AssignmentCard({ assignment, onDeleted, t }) {
  const [expanded, setExpanded] = useState(false);
  const [submissions, setSubmissions] = useState(null);
  const [submissionsError, setSubmissionsError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toggle = async () => {
    if (!expanded && submissions === null) {
      try {
        setSubmissions(await getAssignmentSubmissions(assignment.id));
        setSubmissionsError(null);
      } catch (err) {
        setSubmissions([]);
        setSubmissionsError(err.message || t("teacherDashboard.mobile.assignments.submissionsError"));
      }
    }
    setExpanded((e) => !e);
  };

  const confirmDelete = () => {
    Alert.alert(
      t("teacherDashboard.deleteAssignment"),
      t("teacherDashboard.mobile.assignments.deleteConfirm", { title: assignment.title }),
      [
        { text: t("actions.cancel"), style: "cancel" },
        {
          text: t("teacherDashboard.deleteAssignment"),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAssignment(assignment.id);
              onDeleted(assignment.id);
            } catch (err) {
              Alert.alert(t("teacherDashboard.mobile.assignments.deleteError"), err.message || "");
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Card className="mb-3">
      <Pressable onPress={toggle}>
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text className="text-sm font-bold text-slate-900" numberOfLines={2}>
              {assignment.title}
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
              {assignment.assignment_type === "ai_quiz" ? t("teacherDashboard.aiQuiz") : t("teacherDashboard.pdfUpload")}
              {assignment.subject ? ` • ${assignment.subject}` : ""}
              {assignment.is_locked ? ` • ${t("teacherDashboard.locked")}` : ""}
            </Text>
          </View>
          <Text className="text-slate-400">{expanded ? "▾" : "▸"}</Text>
        </View>
      </Pressable>
      {expanded && (
        <View className="mt-3 pt-3 border-t border-slate-100">
          {submissionsError && <Text className="text-xs text-rose-500 mb-2">{submissionsError}</Text>}
          {submissions === null ? (
            <Text className="text-xs text-slate-400">{t("teacherDashboard.mobile.assignments.loadingSubmissions")}</Text>
          ) : submissions.length === 0 ? (
            <Text className="text-xs text-slate-400">{t("teacherDashboard.noSubmissionsYet")}</Text>
          ) : (
            submissions.map((s) => <FeedbackRow key={s.id} assignmentId={assignment.id} submission={s} t={t} />)
          )}
          <Pressable onPress={confirmDelete} disabled={deleting} hitSlop={8} className="mt-3 self-start py-1">
            <Text className="text-xs font-bold text-rose-500">
              {deleting ? t("teacherDashboard.saving") : `🗑 ${t("teacherDashboard.deleteAssignment")}`}
            </Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

function ChapterPicker({ classNumber, subject, selected, onToggle, t }) {
  const [chapters, setChapters] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getTeacherClassChapters(classNumber, subject)
      .then((cs) => {
        if (!cancelled) setChapters(cs);
      })
      .catch(() => {
        if (!cancelled) {
          setChapters([]);
          setError(t("teacherDashboard.mobile.assignments.chaptersError"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [classNumber, subject, t]);

  if (chapters === null) {
    return <Text className="text-xs text-slate-400 mb-3">{t("teacherDashboard.mobile.assignments.loadingChapters")}</Text>;
  }

  if (chapters.length === 0) {
    return (
      <Text className={`text-xs mb-3 ${error ? "text-rose-500" : "text-slate-400"}`}>
        {error || t("teacherDashboard.mobile.assignments.noChapters")}
      </Text>
    );
  }

  return (
    <View className="mb-3">
      <Text className="text-xs font-semibold text-slate-700 mb-2">{t("teacherDashboard.mobile.assignments.limitToChapters")}</Text>
      <View className="flex-row flex-wrap gap-2">
        {chapters.map((c) => {
          const isSelected = selected.includes(c.chapter_number);
          return (
            <Pressable
              key={c.chapter_number}
              onPress={() => onToggle(c.chapter_number)}
              className={`max-w-[85%] px-3 py-1.5 rounded-full border ${isSelected ? "bg-sky-600 border-sky-600" : "bg-white border-slate-200"}`}
            >
              <Text className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-600"}`} numberOfLines={1}>
                {t("teacherDashboard.mobile.assignments.chapterLabel", { number: c.chapter_number })}: {c.chapter_title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NewAssignmentForm({ classNumber, section, subject, onCreated, onCancel }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [chapterNumbers, setChapterNumbers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggleChapter = (num) => {
    setChapterNumbers((prev) => (prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]));
  };

  const submit = async () => {
    if (!title.trim()) {
      setError(t("teacherDashboard.mobile.assignments.titleRequired"));
      return;
    }
    const days = deadlineDays.trim() ? Number(deadlineDays) : undefined;
    if (days !== undefined && (!Number.isFinite(days) || days < 1)) {
      setError(t("teacherDashboard.mobile.assignments.deadlineInvalid"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createAiQuizAssignment(classNumber, section, {
        title: title.trim(),
        subject,
        description: description.trim() || undefined,
        deadline_days: days,
        chapter_numbers: chapterNumbers.length > 0 ? chapterNumbers : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err.message || t("teacherDashboard.mobile.assignments.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-4">
      <Text className="text-sm font-bold text-slate-900 mb-3">{t("teacherDashboard.generateAiQuizModalTitle")}</Text>
      <ErrorBanner message={error} />
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t("teacherDashboard.mobile.assignments.titlePlaceholder")}
        className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 mb-2.5"
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t("teacherDashboard.descInstructions")}
        className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 mb-2.5"
      />
      <TextInput
        value={deadlineDays}
        onChangeText={setDeadlineDays}
        placeholder={t("teacherDashboard.deadlinePlaceholder")}
        keyboardType="number-pad"
        className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 mb-3"
      />
      <ChapterPicker classNumber={classNumber} subject={subject} selected={chapterNumbers} onToggle={toggleChapter} t={t} />
      <Text className="text-xs text-slate-400 mb-3">
        {t("teacherDashboard.mobile.assignments.generatedFrom", { subject: subject || t("teacherDashboard.mobile.assignments.assignedSubject") })}
      </Text>
      <View className="flex-row gap-2">
        <Button title={t("actions.cancel")} variant="secondary" onPress={onCancel} className="flex-1" />
        <Button
          title={submitting ? t("teacherDashboard.generatingBtn") : t("teacherDashboard.generateQuizBtn")}
          onPress={submit}
          loading={submitting}
          className="flex-1"
        />
      </View>
    </Card>
  );
}

export default function AssignmentsScreen() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState(null);
  const [classesError, setClassesError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const cs = await getTeacherClasses();
      setClasses(cs);
      setClassesError(null);
      if (cs.length > 0) setSelected((prev) => prev || cs[0]);
    } catch (err) {
      setClassesError(err.message || t("teacherDashboard.mobile.home.loadError"));
    }
  }, [t]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const loadAssignments = useCallback(async () => {
    if (!selected) return;
    try {
      setAssignments(await getTeacherAssignments(selected.class_number, selected.section));
      setError(null);
    } catch (err) {
      setError(err.message || t("teacherDashboard.mobile.assignments.loadError"));
    }
  }, [selected, t]);

  useFocusEffect(
    useCallback(() => {
      loadAssignments();
    }, [loadAssignments])
  );

  const handleDeleted = (assignmentId) => {
    setAssignments((prev) => (prev || []).filter((a) => a.id !== assignmentId));
  };

  if (classes === null && !classesError) return <LoadingScreen label={t("teacherDashboard.mobile.assignments.loadingClasses")} />;

  return (
    <Screen contentClassName="px-5 pt-4 pb-24">
      <Text className="text-xl font-extrabold text-slate-900 mb-4">{t("teacherDashboard.assignmentsAndQuizzes")}</Text>

      <ErrorBanner message={classesError} />
      {classes === null && classesError && (
        <Button title={t("actions.retry")} variant="outline" onPress={loadClasses} className="mb-4" />
      )}

      {classes && classes.length > 1 && (
        <View className="flex-row flex-wrap gap-2 mb-4">
          {classes.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setSelected(c);
                setAssignments(null);
                setShowForm(false);
              }}
              className={`max-w-[85%] px-3.5 py-1.5 rounded-full border ${selected?.id === c.id ? "bg-sky-600 border-sky-600" : "bg-white border-slate-200"}`}
            >
              <Text className={`text-xs font-bold ${selected?.id === c.id ? "text-white" : "text-slate-600"}`} numberOfLines={1}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ErrorBanner message={error} />

      {classes && classes.length === 0 ? (
        <EmptyState
          emoji="🏫"
          title={t("teacherDashboard.mobile.home.noClassesTitle")}
          subtitle={t("teacherDashboard.mobile.assignments.unlockSubtitle")}
        />
      ) : selected && (
        <>
          {showForm ? (
            <NewAssignmentForm
              classNumber={selected.class_number}
              section={selected.section}
              subject={selected.subject}
              onCancel={() => setShowForm(false)}
              onCreated={() => {
                setShowForm(false);
                loadAssignments();
              }}
            />
          ) : (
            <Button title={`+ ${t("teacherDashboard.generateAiQuizBtn")}`} onPress={() => setShowForm(true)} className="mb-4" />
          )}

          {assignments === null ? (
            <LoadingScreen label={t("teacherDashboard.mobile.assignments.loadingAssignments")} />
          ) : assignments.length === 0 ? (
            <EmptyState emoji="📝" title={t("teacherDashboard.noAssignmentsTitle")} subtitle={t("teacherDashboard.noAssignmentsDesc")} />
          ) : (
            assignments.map((a) => <AssignmentCard key={a.id} assignment={a} onDeleted={handleDeleted} t={t} />)
          )}
        </>
      )}
    </Screen>
  );
}
