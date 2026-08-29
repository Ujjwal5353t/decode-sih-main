"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Layers, BookOpen, ChevronRight, Sparkles, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentProfile, LessonListItemOut } from "@/lib/api";
import { loadLessons } from "@/lib/offline/contentCache";
import { recordLearningEvent } from "@/lib/offline/learningEvents";

export default function LearnPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && (!user || !role)) {
      router.push("/login");
    }
  }, [loading, user, role, router]);

  if (loading || !user || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-text-secondary">{t("dashboard.common.loading")}</p>
        </div>
      </div>
    );
  }

  if (role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h1 className="text-base font-bold text-text-primary">{t("diagnosticQuiz.studentsOnly")}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {t("diagnosticQuiz.studentsOnlyDesc")}
          </p>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="mt-4">
              {t("diagnosticQuiz.backToDashboard")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <LessonListFlow student={user as StudentProfile} />;
}

function LessonListFlow({ student }: { student: StudentProfile }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const subjectFilter = searchParams.get("subject") || undefined;

  const [lessons, setLessons] = useState<LessonListItemOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setLessons(null);
    setError(null);
    (async () => {
      try {
        const result = await loadLessons(
          student.id,
          subjectFilter,
          student.class_number || undefined
        );
        if (!cancelled) {
          setLessons(result.data);
          setStale(result.stale);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load lessons.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectFilter, student.class_number, student.id]);

  useEffect(() => {
    if (!subjectFilter || !student.class_number) return;
    void recordLearningEvent({
      studentId: student.id,
      eventType: "MODULE_OPENED",
      subject: subjectFilter,
      classNumber: student.class_number,
    });
  }, [subjectFilter, student.id, student.class_number]);

  const groups: { subject: string; items: LessonListItemOut[] }[] = [];
  if (lessons) {
    const bySubject = new Map<string, LessonListItemOut[]>();
    for (const lesson of lessons) {
      if (!bySubject.has(lesson.subject)) bySubject.set(lesson.subject, []);
      bySubject.get(lesson.subject)!.push(lesson);
    }
    for (const [subject, items] of bySubject.entries()) {
      groups.push({
        subject,
        items: items.sort((a, b) => a.chapter_number - b.chapter_number),
      });
    }
    groups.sort((a, b) => a.subject.localeCompare(b.subject));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 glass border-b border-border-primary px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t("diagnosticQuiz.backToDashboard")}</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-border-brand text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{subjectFilter ? `${subjectFilter}` : t("lessons.title")}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6">
        {error && (
          <div className="mb-4 p-3 rounded bg-rose-500/10 text-rose-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {stale && (
          <div className="mb-4 p-3 rounded bg-amber-500/10 text-amber-600 text-xs flex items-center gap-2">
            <CloudOff className="w-4 h-4 shrink-0" />
            <span>{t("learningProgress.offlineNotice")}</span>
          </div>
        )}

        {lessons === null && !error ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
            <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-text-primary">{t("dashboard.common.noRecords")}</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
              {t("lessons.subtitle")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.subject}>
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-brand" />
                  {group.subject}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((lesson, idx) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                    >
                      <Link
                        href={`/dashboard/learn/${lesson.id}`}
                        className="block glass rounded-[var(--radius-md)] p-5 border border-border-primary hover:border-brand transition-all h-full"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">
                            {t("lessons.slide")} {lesson.chapter_number}
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {lesson.slide_count} {t("lessons.slide")}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary">{lesson.chapter_title}</h3>
                        <div className="mt-4 pt-3 border-t border-border-primary/50 flex items-center justify-between">
                          <span className="text-[11px] text-text-tertiary">{t("dashboard.student.class")} {lesson.class_number}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-brand font-semibold">
                            {t("lessons.startLesson")} <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
