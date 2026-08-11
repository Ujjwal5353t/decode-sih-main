"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  Play,
  Pause,
  BookOpen,
  Sparkles,
  Flame,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { cn } from "@/lib/utils";

type DashboardRole = "teacher" | "parent" | "student";

const ROLES: { id: DashboardRole; label: string; icon: React.ElementType; badge: string }[] = [
  { id: "teacher", label: "Teacher View", icon: GraduationCap, badge: "Ms. Ananya · Grade 5 Science" },
  { id: "parent", label: "Parent View", icon: Heart, badge: "Mr. Sharma · Parent of Rohan" },
  { id: "student", label: "Student View", icon: Users, badge: "Rohan S. · Level 4 Learner" },
];

export function TeacherParentDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });

  const [activeRole, setActiveRole] = useState<DashboardRole>("teacher");
  const [isPlayingAudioReport, setIsPlayingAudioReport] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);

  // Animated counters on role change
  const [masteryScore, setMasteryScore] = useState<number>(0);
  const [studentXP, setStudentXP] = useState<number>(0);

  useEffect(() => {
    if (activeRole === "teacher") {
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current >= 87) {
          setMasteryScore(87);
          clearInterval(interval);
        } else {
          setMasteryScore(current);
        }
      }, 20);
      return () => clearInterval(interval);
    } else if (activeRole === "student") {
      let current = 0;
      const interval = setInterval(() => {
        current += 15;
        if (current >= 450) {
          setStudentXP(450);
          clearInterval(interval);
        } else {
          setStudentXP(current);
        }
      }, 15);
      return () => clearInterval(interval);
    }
  }, [activeRole]);

  // Audio Report Progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudioReport) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudioReport(false);
            return 0;
          }
          return prev + 2;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudioReport]);

  return (
    <SectionWrapper id="dashboard-demo" className="py-20 lg:py-26 overflow-hidden bg-muted/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12" ref={containerRef}>
        {/* ════ SECTION HEADER ════ */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold
                       tracking-wider uppercase font-[family-name:var(--font-display)] mb-3 border"
            style={{
              borderColor: "var(--border-brand)",
              background: "color-mix(in srgb, var(--brand-primary) 8%, var(--bg-surface))",
              color: "var(--brand-primary)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
            LIVE PRODUCT DASHBOARD DEMO
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight leading-[1.15]"
          >
            Teachers, parents & students <span className="gradient-text">connected in one place.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 text-text-secondary text-base sm:text-lg leading-relaxed"
          >
            Switch roles to experience how AI delivers actionable insights for educators, clear voice updates for parents, and adaptive goals for students.
          </motion.p>
        </div>

        {/* ════ ROLE SWITCHER TABS ════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center mb-8"
        >
          <div className="p-1.5 rounded-2xl bg-surface border border-border-primary shadow-sm inline-flex items-center gap-1.5 flex-wrap justify-center">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isActive = activeRole === role.id;

              return (
                <button
                  key={role.id}
                  onClick={() => {
                    setActiveRole(role.id);
                    setIsPlayingAudioReport(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer font-[family-name:var(--font-display)]",
                    isActive
                      ? "bg-brand text-white shadow-[var(--shadow-brand)]"
                      : "text-text-secondary hover:text-text-primary hover:bg-muted/60"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ════ MAIN DASHBOARD CANVAS ════ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-[32px] bg-surface border border-border-primary shadow-[var(--shadow-xl)] overflow-hidden"
        >
          {/* Dashboard Header Bar */}
          <div className="p-6 sm:p-7 border-b border-border-secondary bg-muted/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                style={{ background: "var(--gradient-brand)" }}
              >
                {activeRole === "teacher" ? <GraduationCap className="w-5 h-5" /> : activeRole === "parent" ? <Heart className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">
                  {ROLES.find((r) => r.id === activeRole)?.badge}
                </h3>
                <p className="text-xs text-text-tertiary">
                  IncluLearn AI Connected Ecosystem · Real-Time Sync
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Session Sync Active</span>
            </div>
          </div>

          {/* ════ ROLE CONTENT SWITCHER ════ */}
          <AnimatePresence mode="wait">
            {/* ── 1. TEACHER DASHBOARD VIEW ── */}
            {activeRole === "teacher" && (
              <motion.div
                key="teacher"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border-secondary">
                    <div className="flex items-center justify-between text-xs text-text-tertiary font-bold mb-2">
                      <span>CLASS MASTERY</span>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-3xl font-black text-brand font-[family-name:var(--font-display)]">
                      {masteryScore}%
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      +12% vs last week
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/40 border border-border-secondary">
                    <div className="flex items-center justify-between text-xs text-text-tertiary font-bold mb-2">
                      <span>STUDENTS ENROLLED</span>
                      <Users className="w-4 h-4 text-sky-500" />
                    </div>
                    <p className="text-3xl font-black text-text-primary font-[family-name:var(--font-display)]">
                      32
                    </p>
                    <p className="text-[11px] text-text-tertiary font-semibold mt-1">
                      100% Active Attendance
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                    <div className="flex items-center justify-between text-xs text-rose-600 font-bold mb-2">
                      <span>AT-RISK ALERT</span>
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-3xl font-black text-rose-600 font-[family-name:var(--font-display)]">
                      3
                    </p>
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">
                      Need Photosynthesis Recap
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
                    <div className="flex items-center justify-between text-xs text-violet-600 font-bold mb-2">
                      <span>ACCESSIBILITY MODES</span>
                      <Sparkles className="w-4 h-4 text-violet-500" />
                    </div>
                    <p className="text-3xl font-black text-violet-600 font-[family-name:var(--font-display)]">
                      8
                    </p>
                    <p className="text-[11px] text-violet-600 font-semibold mt-1">
                      Dyslexia & ADHD Active
                    </p>
                  </div>
                </div>

                {/* Main Teacher Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Weak Concept Breakdown */}
                  <div className="lg:col-span-7 p-6 rounded-2xl bg-surface border border-border-secondary shadow-xs">
                    <h4 className="text-base font-bold text-text-primary font-[family-name:var(--font-display)] mb-4 flex items-center justify-between">
                      <span>Weak Concepts & Class Gaps</span>
                      <span className="text-xs text-text-tertiary font-normal">Auto-detected by AI</span>
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-text-primary">Chemical Equation (CO₂ + H₂O)</span>
                          <span className="text-rose-500">42% Low Mastery</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full bg-rose-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "42%" }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-text-primary">Chlorophyll Role & Light Absorption</span>
                          <span className="text-amber-500">68% Moderate</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full bg-amber-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "68%" }}
                            transition={{ duration: 1, delay: 0.1 }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-text-primary">Plant Stomata & Oxygen Output</span>
                          <span className="text-emerald-600">91% High Mastery</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full bg-emerald-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "91%" }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Suggested Action & Next Lesson Deck */}
                  <div className="lg:col-span-5 p-6 rounded-2xl bg-brand/5 border border-brand/20 flex flex-col justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-full mb-3">
                        <Sparkles className="w-3.5 h-3.5" /> AI Recommended Next Lesson
                      </div>
                      <h4 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)] mb-2">
                        15-Min Visual Experiment Recap
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed mb-4">
                        AI generated a 4-slide interactive visual presentation to address the chemical equation gap identified in today&apos;s assessment.
                      </p>
                    </div>

                    <button className="w-full py-3 rounded-xl bg-brand text-white text-xs font-bold font-[family-name:var(--font-display)] cursor-pointer hover:bg-brand-hover transition-colors shadow-sm flex items-center justify-center gap-2">
                      <span>Project Recap Deck to Classroom</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 2. PARENT DASHBOARD VIEW ── */}
            {activeRole === "parent" && (
              <motion.div
                key="parent"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* Child Progress Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
                  <div>
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-wider font-[family-name:var(--font-display)]">
                      Rohan&apos;s Weekly Report
                    </span>
                    <h4 className="text-2xl font-extrabold font-[family-name:var(--font-display)] mt-1">
                      Great progress in Science this week! 🎉
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-lg">
                      Rohan completed 4 lessons, earned 450 XP points, and mastered plant photosynthesis in Hindi audio narration mode.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center bg-white/10 px-4 py-3 rounded-xl border border-white/20">
                      <div className="flex items-center justify-center gap-1 text-amber-400 text-xl font-bold font-[family-name:var(--font-display)]">
                        <Flame className="w-5 h-5 fill-amber-400" /> 7 Days
                      </div>
                      <span className="text-[10px] text-slate-300 font-semibold">Streak</span>
                    </div>

                    <div className="text-center bg-white/10 px-4 py-3 rounded-xl border border-white/20">
                      <div className="text-xl font-bold font-[family-name:var(--font-display)] text-sky-300">
                        4/4
                      </div>
                      <span className="text-[10px] text-slate-300 font-semibold">Lessons</span>
                    </div>
                  </div>
                </div>

                {/* Parent Audio Report Player & Homework Reminders */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Playable Hindi Voice Summary */}
                  <div className="lg:col-span-6 p-6 rounded-2xl bg-surface border border-border-secondary shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-rose-500" />
                        <h4 className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)]">
                          Hindi Audio Voice Update for Parents
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                        1 Min Audio
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed mb-4">
                      &ldquo;नमस्ते! रोहन ने इस सप्ताह प्रकाश संश्लेषण (Photosynthesis) का अध्याय 92% अंकों के साथ पूरा किया है।&rdquo;
                    </p>

                    {/* Audio Player Bar */}
                    <div className="p-4 rounded-xl bg-muted/40 border border-border-primary flex items-center gap-4">
                      <button
                        onClick={() => setIsPlayingAudioReport(!isPlayingAudioReport)}
                        className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-rose-600 transition-colors shrink-0"
                      >
                        {isPlayingAudioReport ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-border-primary overflow-hidden mb-1">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-200"
                            style={{ width: `${audioProgress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-text-tertiary">
                          <span>{isPlayingAudioReport ? "Playing Audio Report..." : "Tap to Play Summary"}</span>
                          <span>0:58</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Parent Home Activities */}
                  <div className="lg:col-span-6 p-6 rounded-2xl bg-surface border border-border-secondary shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)] mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-brand" />
                        Recommended 5-Min Home Activity
                      </h4>

                      <div className="p-3.5 rounded-xl bg-brand/5 border border-brand/20 mb-3 text-xs">
                        <p className="font-bold text-brand font-[family-name:var(--font-display)] mb-1">
                          🌱 Plant Sunlight Experiment
                        </p>
                        <p className="text-text-secondary leading-relaxed">
                          Ask Rohan to show you a leaf in your home garden and explain how plants use sunlight to make food.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-secondary flex items-center justify-between text-xs text-text-tertiary">
                      <span>Weekly WhatsApp Digest Sent</span>
                      <span className="font-bold text-emerald-600">✓ Delivered</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 3. STUDENT DASHBOARD VIEW ── */}
            {activeRole === "student" && (
              <motion.div
                key="student"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* Student Hero Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-brand via-sky-600 to-indigo-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
                  <div>
                    <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider font-[family-name:var(--font-display)]">
                      Level 4 Explorer
                    </span>
                    <h4 className="text-2xl font-extrabold font-[family-name:var(--font-display)] mt-2">
                      Welcome back, Rohan! 👋
                    </h4>
                    <p className="text-xs text-sky-100 mt-1">
                      You are 1 lesson away from earning your &ldquo;Botany Master&rdquo; badge!
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="p-4 rounded-xl bg-white/10 border border-white/20 text-center">
                      <div className="text-2xl font-black font-[family-name:var(--font-display)] text-amber-300">
                        {studentXP} XP
                      </div>
                      <span className="text-[10px] text-sky-100 font-semibold">Total Points</span>
                    </div>
                  </div>
                </div>

                {/* Active Learning Path Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-surface border border-border-secondary shadow-xs hover:border-brand transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mb-3">
                      ✓
                    </div>
                    <h5 className="font-bold text-sm text-text-primary font-[family-name:var(--font-display)] mb-1">
                      1. Plant Structure
                    </h5>
                    <p className="text-xs text-emerald-600 font-semibold">Completed 100%</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-brand/10 border-2 border-brand shadow-xs cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold mb-3">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                    <h5 className="font-bold text-sm text-text-primary font-[family-name:var(--font-display)] mb-1">
                      2. Photosynthesis
                    </h5>
                    <p className="text-xs text-brand font-bold">In Progress (85%)</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/40 border border-border-secondary opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-muted text-text-tertiary flex items-center justify-center font-bold mb-3">
                      🔒
                    </div>
                    <h5 className="font-bold text-sm text-text-primary font-[family-name:var(--font-display)] mb-1">
                      3. Solar Energy Quiz
                    </h5>
                    <p className="text-xs text-text-tertiary">Unlocks Next</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
