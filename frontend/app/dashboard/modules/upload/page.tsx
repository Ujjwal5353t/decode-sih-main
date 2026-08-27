"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ModuleUploadWizard } from "@/components/school/module-upload/ModuleUploadWizard";
import { CLASS_OPTIONS } from "@/components/school/module-upload/primitives";
import { useAuth } from "@/hooks/useAuth";
import type { SchoolProfile } from "@/lib/api";

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-text-secondary">{message}</p>
      </div>
    </div>
  );
}

function ModuleUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading } = useAuth();

  // Only a signed-in school branch admin can upload class modules.
  useEffect(() => {
    if (loading) return;
    if (!user || !role) {
      router.push("/login");
    } else if (role !== "school") {
      router.push("/dashboard");
    }
  }, [loading, user, role, router]);

  if (loading || !user || role !== "school") {
    return <LoadingScreen message="Loading module upload..." />;
  }

  const school = user as SchoolProfile;
  const requestedClass = Number(searchParams.get("class"));
  const initialClass = CLASS_OPTIONS.includes(
    requestedClass as (typeof CLASS_OPTIONS)[number]
  )
    ? requestedClass
    : CLASS_OPTIONS[0];

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <header className="sticky top-0 z-30 glass border-b border-border-primary px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary group-hover:text-brand transition-colors">
              VidyaSetu
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-border-brand text-xs font-semibold text-brand uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>school dashboard</span>
            </div>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-text-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div>
          <nav className="flex items-center gap-1.5 text-[11px] text-text-tertiary mb-2">
            <Link href="/dashboard" className="hover:text-brand transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard" className="hover:text-brand transition-colors">
              Modules &amp; Content
            </Link>
            <span>/</span>
            <span className="text-text-secondary font-semibold">Upload Module</span>
          </nav>

          <h1 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
            Upload Module
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Add a book, chapter or worksheet to {school.school_name} —{" "}
            {school.branch_name}. Text is extracted on the server so the content can
            power AI quizzes and adaptive lessons.
          </p>
        </div>

        <ModuleUploadWizard
          initialClass={initialClass}
          branchName={school.branch_name}
          replaceModuleId={searchParams.get("replace") ?? undefined}
          onExit={() => router.push("/dashboard")}
        />
      </main>
    </div>
  );
}

export default function ModuleUploadPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading module upload..." />}>
      <ModuleUploadContent />
    </Suspense>
  );
}
