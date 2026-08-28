"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Layers, BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { StudentProfile, LessonListItemOut, getLessons } from "@/lib/api";

export default function LearnPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

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
          <p className="text-sm font-medium text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h1 className="text-base font-bold text-text-primary">Students Only</h1>
          <p className="text-sm text-text-secondary mt-1">
            Animated lessons are only available on student accounts.
          </p>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="mt-4">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <LessonListFlow student={user as StudentProfile} />;
}

function LessonListFlow({ student }: { student: StudentProfile }) {
  const searchParams = useSearchParams();
  const subjectFilter = searchParams.get("subject") || undefined;

  const [lessons, setLessons] = useState<LessonListItemOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLessons(null);
    setError(null);
    (async () => {
      try {
        const data = await getLessons(subjectFilter, student.class_number || undefined);
        if (!cancelled) setLessons(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load lessons.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectFilter, student.class_number]);

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
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-border-brand text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{subjectFilter ? `${subjectFilter} Lessons` : "Animated Lessons"}</span>
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

        {lessons === null && !error ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
            <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-text-primary">No lessons available yet</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
              {subjectFilter
                ? `No animated lessons have been generated for ${subjectFilter} yet.`
                : "No animated lessons have been generated for your class yet."}
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
                            Chapter {lesson.chapter_number}
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {lesson.slide_count} slide{lesson.slide_count === 1 ? "" : "s"}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary">{lesson.chapter_title}</h3>
                        <div className="mt-4 pt-3 border-t border-border-primary/50 flex items-center justify-between">
                          <span className="text-[11px] text-text-tertiary">Class {lesson.class_number}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-brand font-semibold">
                            Start lesson <ChevronRight className="w-3.5 h-3.5" />
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
