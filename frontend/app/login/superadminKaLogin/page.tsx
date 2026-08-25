"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError("Please fill in all required administrative fields.");
      return;
    }

    try {
      await login("admin", {
        email: email.trim(),
        password,
      });

      router.push("/dashboard");
    } catch (err: any) {
      // Error is stored in auth context or local state
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Ambient background glowing blobs */}
      <div
        className="blob w-[500px] h-[500px] top-[-100px] left-[-100px]"
        style={{ background: "var(--brand-primary)" }}
      />
      <div
        className="blob w-[450px] h-[450px] bottom-[-100px] right-[-100px]"
        style={{ background: "var(--brand-secondary)" }}
      />

      {/* Header Bar */}
      <header className="p-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary group-hover:text-brand transition-colors">
            VidyaSetu
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Standard Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Super Admin Glass Card */}
          <div className="glass rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-xl)] border border-border-primary relative overflow-hidden">
            {/* Top Accent Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: "var(--gradient-brand)" }}
            />

            {/* Header Badge & Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-semibold mb-3">
                <ShieldCheck className="w-4 h-4 text-brand" />
                Super Admin Portal
              </div>
              <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">
                System Administration
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Enter your administrative credentials to access global management
              </p>
            </div>

            {/* Error Alert */}
            {activeError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-3.5 rounded-[var(--radius-md)] bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{activeError}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Admin Email Field */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="email"
                    placeholder="admin@vidyasetu.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating Admin...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In as Super Admin
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Footer / Back link */}
            <div className="mt-6 pt-4 border-t border-border-primary text-center">
              <Link
                href="/login"
                className="text-xs text-text-secondary hover:text-brand transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to standard login page
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

