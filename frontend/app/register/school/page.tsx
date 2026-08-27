"use client";

import Link from "next/link";
import { Building2, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { SchoolRegistrationFlow } from "@/components/school/registration/SchoolRegistrationFlow";

export default function SchoolRegistrationPage() {
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
              <span>School registration</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        <div>
          <nav className="flex items-center gap-1.5 text-[11px] text-text-tertiary mb-2">
            <Link href="/register" className="hover:text-brand transition-colors">
              Create Account
            </Link>
            <span>/</span>
            <span className="text-text-secondary font-semibold">School</span>
          </nav>

          <h1 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
            Register Your School
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">
            Schools are verified before anyone can administer them. We confirm the
            school&apos;s official record, verify who you are, and then check your
            authority to manage it.
          </p>
        </div>

        <SchoolRegistrationFlow />
      </main>
    </div>
  );
}
