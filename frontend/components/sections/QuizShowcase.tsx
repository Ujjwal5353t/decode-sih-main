"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  Brain, BookOpen, Trophy, Flame, Zap, CheckCircle2, XCircle,
  ChevronRight, Star, TrendingUp, Users, Globe, WifiOff,
  Upload, Sparkles, Target, ArrowRight, Lock, FileText,
  AlertCircle, RefreshCw, GraduationCap,
  MessageSquare, Cpu, Check, Wifi
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

/* ══════════════════════════════════════════════════════════════
   TYPES & DATA LAYER
══════════════════════════════════════════════════════════════ */

type Mode = "quiz" | "curriculum-upload" | "curriculum-builder";
type Difficulty = "Easy" | "Medium" | "Hard";

interface Question {
  id: number;
  topic: string;
  text: string;
  options: string[];
  correctIndex: number;
  difficulty: Difficulty;
  xp: number;
  explanation: string;
}

const SUBJECTS = [
  { id: "science" as const,  label: "Science",     emoji: "🔬", color: "#10B981", darkColor: "#34D399", progress: 72 },
  { id: "math"    as const,  label: "Mathematics", emoji: "➗", color: "#2563EB", darkColor: "#60A5FA", progress: 58 },
  { id: "history" as const,  label: "History",     emoji: "📜", color: "#F59E0B", darkColor: "#FBBF24", progress: 45 },
  { id: "geo"     as const,  label: "Geography",   emoji: "🌍", color: "#06B6D4", darkColor: "#22D3EE", progress: 83 },
  { id: "hindi"   as const,  label: "Hindi",       emoji: "📖", color: "#F43F5E", darkColor: "#FB7185", progress: 61 },
] as const;

type SubjectId = (typeof SUBJECTS)[number]["id"];

const QUESTIONS: Record<SubjectId, Question[]> = {
  science: [
    { id: 1,  topic: "Photosynthesis", difficulty: "Easy",   xp: 10, text: "Which part of the plant is primarily responsible for photosynthesis?", options: ["Root", "Stem", "Leaf", "Flower"], correctIndex: 2, explanation: "Leaves contain chlorophyll — the green pigment that absorbs sunlight to power photosynthesis." },
    { id: 2,  topic: "Photosynthesis", difficulty: "Medium", xp: 20, text: "What gas do plants release as a byproduct of photosynthesis?",           options: ["CO₂", "Nitrogen", "Oxygen", "Hydrogen"], correctIndex: 2, explanation: "Oxygen (O₂) is released when plants split water molecules using sunlight energy." },
    { id: 3,  topic: "Water Cycle",    difficulty: "Easy",   xp: 10, text: "What process converts liquid water into water vapor in the water cycle?", options: ["Condensation", "Precipitation", "Evaporation", "Infiltration"], correctIndex: 2, explanation: "Evaporation is when liquid water gains heat energy to become water vapor." },
    { id: 4,  topic: "Photosynthesis", difficulty: "Hard",   xp: 30, text: "In which part of the chloroplast does the light-dependent reaction occur?", options: ["Stroma", "Matrix", "Thylakoid Membrane", "Cell Wall"], correctIndex: 2, explanation: "Light-dependent reactions occur in the thylakoid membranes where chlorophyll resides." },
  ],
  math: [
    { id: 5, topic: "Fractions", difficulty: "Easy",   xp: 10, text: "What is ½ + ¼?", options: ["⅓", "¾", "⅖", "⅔"], correctIndex: 1, explanation: "Convert to common denominator: 2/4 + 1/4 = 3/4 = ¾" },
    { id: 6, topic: "Fractions", difficulty: "Medium", xp: 20, text: "3/5 of a class of 40 students are girls. How many boys are there?", options: ["24", "16", "20", "12"], correctIndex: 1, explanation: "Girls = 3/5 × 40 = 24. Boys = 40 − 24 = 16." },
    { id: 7, topic: "Geometry",  difficulty: "Medium", xp: 20, text: "What is the area of a triangle with base 8 cm and height 5 cm?", options: ["40 cm²", "13 cm²", "20 cm²", "80 cm²"], correctIndex: 2, explanation: "Area = ½ × base × height = ½ × 8 × 5 = 20 cm²" },
  ],
  history: [
    { id: 8, topic: "Freedom Movement", difficulty: "Easy",   xp: 10, text: "Who led the Salt March of 1930?", options: ["Nehru", "Mahatma Gandhi", "Sardar Patel", "Ambedkar"], correctIndex: 1, explanation: "Gandhi led the 241-mile Dandi March to protest the British salt tax." },
    { id: 9, topic: "Ancient India",    difficulty: "Medium", xp: 20, text: "Which ruler converted to Buddhism after the Kalinga War?", options: ["Chandragupta", "Harsha", "Ashoka", "Akbar"], correctIndex: 2, explanation: "Emperor Ashoka embraced Buddhism's path of non-violence after Kalinga." },
  ],
  geo: [
    { id: 10, topic: "Indian Rivers", difficulty: "Easy",   xp: 10, text: "Which is the longest river in India?", options: ["Brahmaputra", "Godavari", "Ganga", "Yamuna"], correctIndex: 2, explanation: "The Ganga stretches ~2,525 km, making it the longest river in India." },
    { id: 11, topic: "Climate",       difficulty: "Medium", xp: 20, text: "What climate type does the Thar Desert have?", options: ["Tropical", "Arid", "Mediterranean", "Temperate"], correctIndex: 1, explanation: "The Thar Desert has an arid climate with very hot temperatures and minimal rainfall." },
  ],
  hindi: [
    { id: 12, topic: "व्याकरण",  difficulty: "Easy",   xp: 10, text: "निम्न में से कौन-सा शब्द संज्ञा है?", options: ["सुंदर", "दौड़ना", "धीरे", "किताब"], correctIndex: 3, explanation: "'किताब' एक संज्ञा (Noun) है — यह एक वस्तु का नाम है।" },
    { id: 13, topic: "साहित्य", difficulty: "Medium", xp: 20, text: "'रामचरितमानस' के रचयिता कौन हैं?", options: ["कबीरदास", "तुलसीदास", "सूरदास", "मीराबाई"], correctIndex: 1, explanation: "तुलसीदास जी ने 16वीं शताब्दी में 'रामचरितमानस' की रचना की।" },
  ],
};

const PATH_STEPS = [
  { id: "assess",   label: "Assessment", icon: Target,     desc: "Baseline test" },
  { id: "lesson",   label: "Lesson",     icon: BookOpen,   desc: "AI-built lesson" },
  { id: "practice", label: "Practice",   icon: Brain,      desc: "Guided practice" },
  { id: "quiz",     label: "Quiz",       icon: Zap,        desc: "Adaptive quiz" },
  { id: "mastery",  label: "Mastery",    icon: Star,       desc: "Concept locked" },
  { id: "next",     label: "Next Topic", icon: ArrowRight, desc: "AI recommendation" },
];

const RECOMMENDED_NEXT: Record<SubjectId, { topic: string; reason: string; emoji: string }> = {
  science: { topic: "Respiration in Plants",  reason: "Follows photosynthesis — 94% success rate in this order", emoji: "🌱" },
  math:    { topic: "Ratio & Proportion",     reason: "Fraction mastery unlocks this concept", emoji: "⚖️" },
  history: { topic: "Quit India Movement",    reason: "Sequential timeline builds memory retention", emoji: "🇮🇳" },
  geo:     { topic: "Soil Types & Formation", reason: "Related to climate + geography", emoji: "🌿" },
  hindi:   { topic: "काल (Tenses)",            reason: "Grammar progression: Noun → Verb → Tenses", emoji: "📝" },
};

const LANGUAGES: { code: any; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
  { code: "bn", label: "বাং" },
  { code: "mr", label: "मरा" },
  { code: "pa", label: "ਪੰਜ" },
  { code: "ur", label: "اردو" },
  { code: "ta", label: "தமி" },
  { code: "as", label: "অসমী" },
];

/* ── Shared card style using CSS variables — fully theme-aware ── */
const cardStyle: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border-primary)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-sm)",
};

const cardInnerStyle: React.CSSProperties = {
  background: "var(--bg-muted)",
  border: "1px solid var(--border-primary)",
  borderRadius: "12px",
};

/* ══════════════════════════════════════════════════════════════
   LEFT PANEL
══════════════════════════════════════════════════════════════ */

function LearningPathPanel({
  activeSubject,
  onSubjectChange,
  activePathStep,
}: {
  activeSubject: SubjectId;
  onSubjectChange: (id: SubjectId) => void;
  activePathStep: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Student Card */}
      <div style={cardStyle} className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{ background: "var(--gradient-blue-subtle)", border: "1px solid var(--border-brand)" }}
          >
            🎓
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold font-[family-name:var(--font-display)] leading-tight" style={{ color: "var(--text-primary)" }}>Aarav Kumar</p>
            <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Class 5B · DPS, New Delhi</p>
          </div>
          {/* Premium Centered Level 12 Circle Badge */}
          <div className="ml-auto flex items-center shrink-0">
            <div
              className="relative w-11 h-11 rounded-full flex flex-col items-center justify-center shadow-sm"
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 182, 212, 0.12) 100%)",
                border: "1.5px solid rgba(16, 185, 129, 0.4)",
                boxShadow: "0 0 12px rgba(16, 185, 129, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
              }}
            >
              <span className="text-[7.5px] font-bold uppercase tracking-wider leading-none text-emerald-400 opacity-90 mb-[1px]">
                {t("quizShowcase.studentCard.lvl")}
              </span>
              <span className="text-base font-black leading-none text-emerald-400 font-[family-name:var(--font-display)]">
                12
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid var(--border-brand)" }}>
          <Upload className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-primary)" }} />
          <span className="text-[10px] font-medium leading-tight" style={{ color: "var(--text-secondary)" }}>
            {t("quizShowcase.controls.cbseClass")} · {t("quizShowcase.studentCard.uploadedBy")} <strong style={{ color: "var(--brand-primary)" }}>Teacher Priya</strong>
          </span>
        </div>
      </div>

      {/* Path Stepper */}
      <div style={cardStyle} className="p-4 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3 font-[family-name:var(--font-display)]" style={{ color: "var(--text-tertiary)" }}>
          {t("quizShowcase.learningPath.title")}
        </p>
        <div className="space-y-0.5">
          {PATH_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < activePathStep;
            const isActive    = idx === activePathStep;
            const isLocked    = idx > activePathStep;
            return (
              <div key={step.id} className="flex items-start gap-2.5">
                <div className="flex flex-col items-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                    style={{
                      background: isCompleted ? "var(--brand-primary)" : isActive ? "var(--bg-surface)" : "var(--bg-muted)",
                      border: isCompleted ? "1px solid var(--brand-primary)" : isActive ? "1px solid var(--brand-primary)" : "1px solid var(--border-primary)",
                      color: isCompleted ? "white" : isActive ? "var(--brand-primary)" : "var(--text-tertiary)",
                      boxShadow: isActive ? "0 0 0 3px var(--border-brand)" : "none",
                    }}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isLocked ? <Lock className="w-3 h-3" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  {idx < PATH_STEPS.length - 1 && (
                    <div className="w-px h-4 my-0.5 rounded-full transition-colors duration-300"
                      style={{ background: idx < activePathStep ? "var(--brand-primary)" : "var(--border-primary)", opacity: 0.5 }}
                    />
                  )}
                </div>
                <div className="pb-1">
                  <p className="text-xs font-bold leading-tight font-[family-name:var(--font-display)]"
                    style={{ color: isCompleted ? "var(--brand-primary)" : isActive ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                    {t(`quizShowcase.learningPath.steps.${step.id}.label`)}
                    {isActive && (
                      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full align-middle" style={{ background: "var(--brand-primary)" }}
                      />
                    )}
                  </p>
                  <p className="text-[10px] leading-tight" style={{ color: "var(--text-tertiary)" }}>{t(`quizShowcase.learningPath.steps.${step.id}.desc`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Selector */}
      <div style={cardStyle} className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5 font-[family-name:var(--font-display)]" style={{ color: "var(--text-tertiary)" }}>
          {t("quizShowcase.subjects.title")}
        </p>
        <div className="space-y-1.5">
          {SUBJECTS.map((s) => {
            const isActive = activeSubject === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSubjectChange(s.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-left transition-all duration-200"
                style={{
                  background: isActive ? `${s.color}15` : "transparent",
                  border: `1px solid ${isActive ? s.color + "40" : "transparent"}`,
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span className="text-sm">{s.emoji}</span>
                <span className="text-xs font-semibold flex-1 font-[family-name:var(--font-display)]"
                  style={{ color: isActive ? s.color : "var(--text-secondary)" }}>
                  {t(`quizShowcase.subjects.${s.id}`)}
                </span>
                <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-primary)" }}>
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                    animate={{ width: `${s.progress}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                </div>
                <span className="text-[10px] w-7 text-right" style={{ color: "var(--text-tertiary)" }}>{s.progress}%</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   RIGHT PANEL: AI Insights
══════════════════════════════════════════════════════════════ */

function MasteryRing({ percent, color, label }: { percent: number; color: string; label: string }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="rotate-[-90deg]">
          <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border-primary)" strokeWidth="7" />
          <motion.circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circ} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: "easeOut" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span key={percent} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
            className="text-xl font-black font-[family-name:var(--font-display)]" style={{ color }}>
            {percent}%
          </motion.span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-display)]"
        style={{ color: "var(--text-tertiary)" }}>{label}</span>
    </div>
  );
}

function AIInsightsPanel({
  subject, mastery, isOffline, onOfflineToggle,
}: {
  subject: (typeof SUBJECTS)[number]; mastery: number;
  isOffline: boolean; onOfflineToggle: () => void;
}) {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Mastery ring */}
      <div style={cardStyle} className="p-4 flex flex-col items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-wider self-start font-[family-name:var(--font-display)]"
          style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.controls.topicMastery")}</p>
        <MasteryRing percent={mastery} color={subject.color} label={t(`quizShowcase.subjects.${subject.id}`) || subject.label} />
        <div className="w-full space-y-1.5 pt-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
          {SUBJECTS.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="text-[10px] w-14 shrink-0 truncate font-[family-name:var(--font-display)]"
                style={{ color: "var(--text-secondary)" }}>{t(`quizShowcase.subjects.${s.id}`) || s.label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-primary)" }}>
                <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                  animate={{ width: `${s.progress}%` }} transition={{ duration: 0.8, delay: 0.05 * SUBJECTS.indexOf(s) }} />
              </div>
              <span className="text-[10px] w-6 text-right" style={{ color: "var(--text-tertiary)" }}>{s.progress}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Teacher Co-pilot */}
      <div style={cardStyle} className="p-4 flex-1">
        <div className="flex items-center gap-1.5 mb-3">
          <GraduationCap className="w-4 h-4" style={{ color: "var(--accent-violet)" }} />
          <p className="text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-display)]"
            style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.insights.teacherCopilot")}</p>
        </div>
        <div className="space-y-2">
          {[
            { icon: AlertCircle, color: "var(--accent-amber)", title: t("quizShowcase.insights.weakConceptAlert"), desc: t("quizShowcase.insights.weakConceptDesc"), bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
            { icon: Users,       color: "var(--brand-primary)", title: t("quizShowcase.insights.classInsight"),      desc: t("quizShowcase.insights.classInsightDesc"), bg: "rgba(37,99,235,0.08)", border: "var(--border-brand)" },
            { icon: TrendingUp,  color: "var(--accent-emerald)", title: t("quizShowcase.insights.topProgress"),      desc: t("quizShowcase.insights.topProgressDesc"), bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="px-3 py-2 rounded-xl" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                <div className="flex items-start gap-2">
                  <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: item.color }} />
                  <div>
                    <p className="text-[11px] font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="text-[10px] leading-tight" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Language + Offline */}
      <div style={cardStyle} className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2 font-[family-name:var(--font-display)]"
          style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.insights.regionalLanguage")}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => setLanguage(l.code)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
              style={{
                background: language === l.code ? "var(--brand-primary)" : "var(--bg-muted)",
                border: `1px solid ${language === l.code ? "var(--brand-primary)" : "var(--border-primary)"}`,
                color: language === l.code ? "white" : "var(--text-secondary)",
              }}
            >{l.label}</button>
          ))}
        </div>
        <button onClick={onOfflineToggle}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
          style={{
            background: isOffline ? "var(--bg-muted)" : "rgba(16,185,129,0.08)",
            border: `1px solid ${isOffline ? "var(--border-primary)" : "rgba(16,185,129,0.25)"}`,
            color: isOffline ? "var(--text-secondary)" : "var(--accent-emerald)",
          }}
        >
          {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          <span className="font-[family-name:var(--font-display)]">{isOffline ? t("quizShowcase.controls.offlineActive") : t("quizShowcase.controls.offlineReady")}</span>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   QUIZ ENGINE
══════════════════════════════════════════════════════════════ */

function QuizEngine({ subject, onMasteryChange, onPathStepChange }: {
  subject: (typeof SUBJECTS)[number];
  onMasteryChange: (m: number) => void;
  onPathStepChange: (step: number) => void;
}) {
  const { dictionary, language, t } = useTranslation();
  const localizedQuizData = (dictionary as any)?.quizQuestions?.[subject.id] || t(`quizQuestions.${subject.id}` as any);
  const baseQuestions = QUESTIONS[subject.id];
  const questions: Question[] = baseQuestions.map((bq, i) => {
    const loc = Array.isArray(localizedQuizData) && localizedQuizData[i] ? localizedQuizData[i] : null;
    return {
      ...bq,
      text: loc?.text || bq.text,
      options: Array.isArray(loc?.options) && loc.options.length ? loc.options : bq.options,
      explanation: loc?.explanation || bq.explanation,
      topic: loc?.topic || bq.topic,
    };
  });
  const [qIdx, setQIdx]               = useState(0);
  const [selected, setSelected]       = useState<number | null>(null);
  const [answered, setAnswered]       = useState(false);
  const [xp, setXp]                   = useState(320);
  const [streak, setStreak]           = useState(6);
  const [consecutiveCorrect, setCC]   = useState(0);
  const [difficulty, setDifficulty]   = useState<Difficulty>("Easy");
  const [showAIToast, setShowAIToast] = useState(false);
  const [aiToastMsg, setAiToastMsg]   = useState("");
  const [showResults, setShowResults] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [xpFlash, setXpFlash]         = useState(false);

  const totalQ = questions.length;
  const q = questions[Math.min(qIdx, totalQ - 1)];
  const isCorrect = answered && selected === q.correctIndex;

  useEffect(() => {
    setQIdx(0); setSelected(null); setAnswered(false);
    setSessionScore(0); setShowResults(false); setDifficulty("Easy"); setCC(0);
    onPathStepChange(3);
  }, [subject.id, onPathStepChange]);

  const fireToast = (msg: string) => {
    setAiToastMsg(msg); setShowAIToast(true);
    setTimeout(() => setShowAIToast(false), 2800);
  };

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx); setAnswered(true);
    const correct = idx === q.correctIndex;
    if (correct) {
      const newXP = xp + q.xp;
      setXp(newXP); setXpFlash(true); setTimeout(() => setXpFlash(false), 600);
      setStreak((p) => p + 1);
      const newCC = consecutiveCorrect + 1; setCC(newCC);
      setSessionScore((p) => p + 1);
      if (newCC === 2 && difficulty === "Easy") { setDifficulty("Medium"); fireToast("🔥 You're doing great! Adapting difficulty to Medium."); }
      else if (newCC === 3 && difficulty === "Medium") { setDifficulty("Hard"); fireToast("🚀 Perfect score streak! Unlocking Hard difficulty."); }
      onMasteryChange(Math.min(100, subject.progress + Math.round((sessionScore + 1) * 5)));
    } else {
      setStreak(0); setCC(0);
      if (difficulty === "Hard") { setDifficulty("Medium"); fireToast("💡 Adapting difficulty to Medium for better practice."); }
      else { fireToast("💡 AI provided extra explanation below!"); }
    }
  };

  const handleNext = () => {
    if (qIdx + 1 >= totalQ) { setShowResults(true); onPathStepChange(4); }
    else { setQIdx((p) => p + 1); setSelected(null); setAnswered(false); }
  };

  const handleRestart = () => {
    setQIdx(0); setSelected(null); setAnswered(false);
    setSessionScore(0); setShowResults(false); setDifficulty("Easy"); setCC(0);
    onPathStepChange(3); onMasteryChange(subject.progress);
  };

  const rec = RECOMMENDED_NEXT[subject.id];

  const diffBadgeStyle = (d: Difficulty): React.CSSProperties => {
    if (d === "Easy")   return { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--accent-emerald)" };
    if (d === "Medium") return { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "var(--accent-amber)" };
    return { background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)", color: "var(--accent-rose)" };
  };

  const getOptionStyle = (idx: number): React.CSSProperties => {
    const isSelected = selected === idx;
    const isRight    = answered && idx === q.correctIndex;
    const isWrong    = answered && isSelected && !isRight;
    if (isRight)     return { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: "var(--accent-emerald)" };
    if (isWrong)     return { background: "rgba(244,63,94,0.12)",  border: "1px solid rgba(244,63,94,0.35)",  color: "var(--accent-rose)" };
    if (isSelected)  return { background: "rgba(37,99,235,0.12)",  border: "1px solid var(--brand-primary)",  color: "var(--brand-primary)" };
    return { background: "var(--bg-muted)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" };
  };

  const getBadgeStyle = (idx: number): React.CSSProperties => {
    const isSelected = selected === idx;
    const isRight    = answered && idx === q.correctIndex;
    const isWrong    = answered && isSelected && !isRight;
    if (isRight)    return { background: "var(--accent-emerald)", border: "1px solid var(--accent-emerald)", color: "white" };
    if (isWrong)    return { background: "var(--accent-rose)",    border: "1px solid var(--accent-rose)",    color: "white" };
    if (isSelected) return { background: "var(--brand-primary)",  border: "1px solid var(--brand-primary)",  color: "white" };
    return { background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-tertiary)" };
  };

  const difficultyLabel = difficulty === "Easy" ? t("quizShowcase.controls.easy") : difficulty === "Medium" ? t("quizShowcase.controls.medium") : t("quizShowcase.controls.hard");

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="px-5 pt-4 pb-3" style={{ ...cardStyle, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: "none" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide font-[family-name:var(--font-display)]"
              style={{ background: "rgba(37,99,235,0.1)", border: "1px solid var(--border-brand)", color: "var(--brand-primary)" }}>
              <Upload className="w-3 h-3" /> {t("quizShowcase.controls.cbseClass")}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide font-[family-name:var(--font-display)]"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "var(--accent-violet)" }}>
              <Sparkles className="w-3 h-3" /> {t("quizShowcase.controls.aiAdaptive")}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide font-[family-name:var(--font-display)]"
              style={diffBadgeStyle(difficulty)}>{difficultyLabel}
            </span>
          </div>
          <span className="text-xl">{subject.emoji}</span>
        </div>

        <div className="flex items-center gap-3">
          <motion.div animate={xpFlash ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <Zap className="w-3.5 h-3.5" style={{ color: "var(--accent-violet)" }} />
            <motion.span key={xp} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="text-xs font-black font-[family-name:var(--font-display)]" style={{ color: "var(--accent-violet)" }}>
              {xp} XP
            </motion.span>
          </motion.div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <Flame className="w-3.5 h-3.5" style={{ color: "var(--accent-amber)" }} />
            <span className="text-xs font-black font-[family-name:var(--font-display)]" style={{ color: "var(--accent-amber)" }}>{streak} {t("quizShowcase.controls.streak")}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <Trophy className="w-3.5 h-3.5" style={{ color: "var(--accent-emerald)" }} />
            <span className="text-xs font-black font-[family-name:var(--font-display)]" style={{ color: "var(--accent-emerald)" }}>{sessionScore}/{totalQ}</span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {questions.map((_, i) => (
              <motion.div key={i} className="rounded-full transition-all duration-300"
                style={{
                  width: i <= qIdx ? "16px" : "8px",
                  height: "8px",
                  background: i < qIdx ? "var(--brand-secondary)" : i === qIdx ? "var(--brand-primary)" : "var(--border-primary)",
                  boxShadow: i === qIdx ? "0 0 6px rgba(37,99,235,0.5)" : "none",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-1.5"
        style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border-primary)", borderRight: "1px solid var(--border-primary)" }}>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-primary)" }}>
          <motion.div className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #7C3AED, #2563EB, #06B6D4)" }}
            animate={{ width: showResults ? "100%" : `${(qIdx / totalQ) * 100}%` }}
            transition={{ type: "spring", stiffness: 150, damping: 22 }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.controls.question")} {Math.min(qIdx + 1, totalQ)} {t("quizShowcase.controls.of")} {totalQ}</span>
          <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.controls.topic")}: {q.topic}</span>
        </div>
      </div>

      {/* Question Body */}
      <div className="overflow-hidden relative"
        style={{ ...cardStyle, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: "none" }}>
        <AnimatePresence>
          {showAIToast && (
            <motion.div initial={{ opacity: 0, y: -12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }} transition={{ duration: 0.25 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg font-[family-name:var(--font-display)]"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", boxShadow: "var(--shadow-lg)" }}>
                <Brain className="w-3.5 h-3.5" style={{ color: "var(--accent-violet)" }} />
                {aiToastMsg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div key={q.id} initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.3, ease: [0.22, 0.68, 0, 1] }}
              className="px-6 py-6">
              <h3 className="text-base sm:text-lg font-bold font-[family-name:var(--font-display)] leading-snug mb-6"
                style={{ color: "var(--text-primary)" }}>{q.text}</h3>

              <div className="space-y-2.5">
                {q.options.map((opt, idx) => {
                  const isRight = answered && idx === q.correctIndex;
                  const isWrong = answered && selected === idx && !isRight;
                  return (
                    <motion.button key={idx} onClick={() => handleSelect(idx)} disabled={answered}
                      whileHover={!answered ? { scale: 1.015 } : {}} whileTap={!answered ? { scale: 0.985 } : {}}
                      className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-left transition-all duration-200 font-[family-name:var(--font-display)] text-sm font-medium"
                      style={{ cursor: answered ? "default" : "pointer", ...getOptionStyle(idx) }}>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all"
                        style={getBadgeStyle(idx)}>
                        {isRight ? <CheckCircle2 className="w-4 h-4" /> : isWrong ? <XCircle className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isRight && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-base">🎉</motion.span>}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {answered && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }} className="mt-5 space-y-3">
                    <div className="px-4 py-3.5 rounded-xl flex items-start gap-3 text-sm"
                      style={isCorrect
                        ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }
                        : { background: "rgba(244,63,94,0.1)",  border: "1px solid rgba(244,63,94,0.3)" }}>
                      {isCorrect
                        ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-emerald)" }} />
                        : <XCircle      className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-rose)" }} />}
                      <div>
                        <p className="font-bold font-[family-name:var(--font-display)] text-sm"
                          style={{ color: isCorrect ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                          {isCorrect ? t("quizShowcase.quiz.correctMsg").replace("{xp}", String(q.xp)) : t("quizShowcase.quiz.explanation")}
                          {isCorrect ? t("quizShowcase.quiz.correctMsg").replace("{xp}", String(q.xp)) : t("quizShowcase.quiz.explanationLabel")}
                        </p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{q.explanation}</p>
                      </div>
                    </div>
                    <button onClick={handleNext}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm cursor-pointer font-[family-name:var(--font-display)] transition-all"
                      style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(37,99,235,0.35)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                      {qIdx + 1 < totalQ ? t("quizShowcase.quiz.nextQuestion") : t("quizShowcase.quiz.seeResults")}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="px-6 py-6">
              <div className="text-center mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3"
                  style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
                  <Trophy className="w-9 h-9 text-white" />
                </motion.div>
                <h3 className="text-xl font-black font-[family-name:var(--font-display)]" style={{ color: "var(--text-primary)" }}>
                  {sessionScore === totalQ ? t("quizShowcase.quiz.perfectScore") : t("quizShowcase.quiz.greatWork")}
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {t("quizShowcase.quiz.resultsOf").replace("{score}", String(sessionScore)).replace("{total}", String(totalQ)).replace("{xp}", String(sessionScore * 15))}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: t("quizShowcase.quiz.accuracy"),  value: `${Math.round((sessionScore / totalQ) * 100)}%`, color: "var(--brand-primary)",   bg: "rgba(37,99,235,0.08)",  border: "var(--border-brand)" },
                  { label: t("quizShowcase.quiz.streak"),    value: `${streak}🔥`, color: "var(--accent-amber)",  bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
                  { label: t("quizShowcase.quiz.difficulty"),value: difficulty,   color: "var(--accent-violet)", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl p-3 text-center"
                    style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                    <p className="text-sm font-black font-[family-name:var(--font-display)]" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[9px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 mb-4"
                style={{ background: "rgba(37,99,235,0.08)", border: "2px dashed var(--border-brand)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Brain className="w-3.5 h-3.5" style={{ color: "var(--brand-primary)" }} />
                  <span className="text-[10px] font-black uppercase tracking-wider font-[family-name:var(--font-display)]"
                    style={{ color: "var(--brand-primary)" }}>{t("quizShowcase.quiz.aiRecommends")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{rec.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--text-primary)" }}>{rec.topic}</p>
                    <p className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--text-secondary)" }}>{rec.reason}</p>
                  </div>
                  <button onClick={handleRestart}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold cursor-pointer font-[family-name:var(--font-display)]"
                    style={{ background: "var(--brand-primary)" }}>
                    Start <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer font-[family-name:var(--font-display)] transition-all"
                style={{ border: "1px solid var(--border-primary)", color: "var(--text-secondary)", background: "transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <RefreshCw className="w-4 h-4" /> {t("quizShowcase.quiz.retakeQuiz")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Parent Update Strip */}
      <div className="mt-3 px-4 py-3 rounded-xl flex items-center gap-3"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-sm)" }}>
        <MessageSquare className="w-4 h-4 shrink-0" style={{ color: "var(--accent-emerald)" }} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--text-primary)" }}>{t("quizShowcase.quiz.parentUpdateSent")}</p>
          <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
            &quot;Aarav scored {sessionScore}/{totalQ} in {subject.label}. Next: {rec.topic}&quot;
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "var(--accent-emerald)" }}>Auto</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODE 2: Curriculum Upload
══════════════════════════════════════════════════════════════ */

function CurriculumUploadDemo() {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<string>("CBSE_Class5_Science_Syllabus.pdf");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [isProcessed, setIsProcessed]   = useState<boolean>(false);

  const sampleFiles = [
    { name: "CBSE_Class5_Science_Syllabus.pdf", size: "2.4 MB" },
    { name: "NCERT_Mathematics_Ch4_Fractions.pdf", size: "1.8 MB" },
    { name: "State_Board_Grade5_SocialScience.pdf", size: "3.1 MB" },
  ];

  const steps = [
    { id: "parsing", label: t("quizShowcase.upload.steps.parsing.label"),   desc: t("quizShowcase.upload.steps.parsing.desc") },
    { id: "graphing", label: t("quizShowcase.upload.steps.graphing.label"),   desc: t("quizShowcase.upload.steps.graphing.desc") },
    { id: "synthesis", label: t("quizShowcase.upload.steps.synthesis.label"), desc: t("quizShowcase.upload.steps.synthesis.desc") },
    { id: "multilingual", label: t("quizShowcase.upload.steps.multilingual.label"),   desc: t("quizShowcase.upload.steps.multilingual.desc") },
  ];

  const handleProcess = () => {
    setIsProcessing(true); setIsProcessed(false); setPipelineStep(0);
    let s = 0;
    const interval = setInterval(() => {
      s++;
      if (s >= steps.length) { clearInterval(interval); setIsProcessing(false); setIsProcessed(true); }
      setPipelineStep(s);
    }, 750);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Controller */}
        <div style={cardStyle} className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(37,99,235,0.1)", border: "1px solid var(--border-brand)" }}>
                <Upload className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
              </div>
              <div>
                <h4 className="text-sm font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--text-primary)" }}>
                  {t("quizShowcase.upload.title")}
                </h4>
                <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{t("quizShowcase.upload.subtitle")}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl p-5 text-center"
              style={{ background: "rgba(37,99,235,0.05)", border: "2px dashed var(--border-brand)" }}>
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-70" style={{ color: "var(--brand-primary)" }} />
              <p className="text-xs font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--text-primary)" }}>
                {t("quizShowcase.upload.dropZoneTitle")}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.upload.dropZoneSubtitle")}</p>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-display)]"
                style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.upload.selectFileLabel")}</p>
              {sampleFiles.map((file) => {
                const isSelected = selectedFile === file.name;
                return (
                  <button key={file.name} onClick={() => setSelectedFile(file.name)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer"
                    style={{
                      background: isSelected ? "rgba(37,99,235,0.1)" : "var(--bg-muted)",
                      border: `1px solid ${isSelected ? "var(--brand-primary)" : "var(--border-primary)"}`,
                      color: "var(--text-secondary)",
                      fontWeight: isSelected ? "600" : "400",
                    }}>
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-primary)" }} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-tertiary)" }}>{file.size}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={handleProcess} disabled={isProcessing}
            className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm cursor-pointer font-[family-name:var(--font-display)] transition-all"
            style={{ background: isProcessing ? "var(--text-tertiary)" : "var(--brand-primary)", opacity: isProcessing ? 0.7 : 1 }}>
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isProcessing ? t("quizShowcase.upload.processingBtn") : t("quizShowcase.upload.convertBtn")}
          </button>
        </div>

        {/* Pipeline Visualizer */}
        <div style={cardStyle} className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-display)]"
                style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.upload.pipelineTitle")}</h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-[family-name:var(--font-display)]"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "var(--accent-violet)" }}>
                {t("quizShowcase.upload.pipelineBadge")}
              </span>
            </div>
            <div className="space-y-3">
              {steps.map((st, idx) => {
                const isDone    = isProcessed || idx < pipelineStep;
                const isCurrent = isProcessing && idx === pipelineStep;
                return (
                  <div key={st.label} className="flex items-start gap-3 p-3 rounded-xl transition-all duration-300"
                    style={isDone
                      ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--accent-emerald)" }
                      : isCurrent
                      ? { background: "rgba(37,99,235,0.1)", border: "1px solid var(--border-brand)", color: "var(--brand-primary)" }
                      : { background: "var(--bg-muted)", border: "1px solid var(--border-primary)", color: "var(--text-tertiary)" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={isDone
                        ? { background: "var(--accent-emerald)", border: "1px solid var(--accent-emerald)", color: "white" }
                        : isCurrent
                        ? { background: "var(--brand-primary)", border: "1px solid var(--brand-primary)", color: "white" }
                        : { background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-tertiary)" }}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold font-[family-name:var(--font-display)]">{st.label}</p>
                      <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {isProcessed && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid var(--border-brand)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--brand-primary)" }}>
                    {t("quizShowcase.upload.readyBadge")}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.1)", color: "var(--accent-emerald)" }}>{t("quizShowcase.upload.alignedBadge")}</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {t("quizShowcase.upload.generatedMsg")}{" "}
                  <strong style={{ color: "var(--text-primary)" }}>{selectedFile}</strong>.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODE 3: Curriculum Builder
 ══════════════════════════════════════════════════════════════ */

function CurriculumBuilderDemo() {
  const [studentScore, setStudentScore] = useState<"high" | "low">("high");
  const { t } = useTranslation();

  const nodes = [
    { title: t("quizShowcase.builder.nodes.unit1"),         status: t("quizShowcase.builder.nodes.mastered"),    score: "96%",     icon: CheckCircle2, bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)",  badgeBg: "rgba(16,185,129,0.12)", badgeColor: "var(--accent-emerald)" },
    { title: t("quizShowcase.builder.nodes.unit2"),         status: t("quizShowcase.builder.nodes.currentFocus"),score: "72%",   icon: Sparkles,     bg: "rgba(37,99,235,0.1)",   border: "var(--border-brand)",   badgeBg: "rgba(37,99,235,0.12)",  badgeColor: "var(--brand-primary)" },
    {
      title: studentScore === "high" ? t("quizShowcase.builder.nodes.unit3High") : t("quizShowcase.builder.nodes.unit3Low"),
      status: studentScore === "high" ? t("quizShowcase.builder.nodes.aiUnlocked")  : t("quizShowcase.builder.nodes.aiRemediation"),
      score:  studentScore === "high" ? t("quizShowcase.builder.nodes.scoreReady")  : t("quizShowcase.builder.nodes.scoreAssigned"),
      icon:   studentScore === "high" ? TrendingUp : AlertCircle,
      bg:     studentScore === "high" ? "rgba(139,92,246,0.1)"  : "rgba(245,158,11,0.1)",
      border: studentScore === "high" ? "rgba(139,92,246,0.35)" : "rgba(245,158,11,0.35)",
      badgeBg:     studentScore === "high" ? "rgba(139,92,246,0.12)"  : "rgba(245,158,11,0.12)",
      badgeColor:  studentScore === "high" ? "var(--accent-violet)"   : "var(--accent-amber)",
    },
    { title: t("quizShowcase.builder.nodes.unit4"), status: t("quizShowcase.builder.nodes.upcoming"),     score: t("quizShowcase.builder.nodes.scoreLocked"), icon: Lock,         bg: "var(--bg-muted)",       border: "var(--border-primary)", badgeBg: "var(--border-primary)", badgeColor: "var(--text-tertiary)" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Simulator Control */}
      <div style={cardStyle} className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" style={{ color: "var(--accent-violet)" }} />
            <h4 className="text-sm font-bold font-[family-name:var(--font-display)]" style={{ color: "var(--text-primary)" }}>
              {t("quizShowcase.simulator.title")}
            </h4>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t("quizShowcase.simulator.desc")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setStudentScore("high")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all font-[family-name:var(--font-display)]"
            style={studentScore === "high"
              ? { background: "var(--accent-emerald)", border: "1px solid var(--accent-emerald)", color: "white" }
              : { background: "var(--bg-muted)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
            {t("quizShowcase.simulator.simHighScore")}
          </button>
          <button onClick={() => setStudentScore("low")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all font-[family-name:var(--font-display)]"
            style={studentScore === "low"
              ? { background: "var(--accent-amber)", border: "1px solid var(--accent-amber)", color: "white" }
              : { background: "var(--bg-muted)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
            {t("quizShowcase.simulator.simStruggling")}
          </button>
        </div>
      </div>

      {/* Graph */}
      <div style={cardStyle} className="p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-display)]"
            style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.simulator.depGraph")}</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "rgba(37,99,235,0.1)", border: "1px solid var(--border-brand)", color: "var(--brand-primary)" }}>
            {t("quizShowcase.simulator.realTimeAdapt")}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {nodes.map((node) => {
            const Icon = node.icon;
            return (
              <motion.div key={node.title} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="p-4 rounded-xl flex flex-col justify-between h-36 relative transition-all"
                style={{ background: node.bg, border: `1px solid ${node.border}` }}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full font-[family-name:var(--font-display)]"
                      style={{ background: node.badgeBg, color: node.badgeColor }}>
                      {node.status}
                    </span>
                    <Icon className="w-4 h-4" style={{ color: node.badgeColor }} />
                  </div>
                  <h5 className="text-xs font-bold font-[family-name:var(--font-display)] leading-snug"
                    style={{ color: "var(--text-primary)" }}>{node.title}</h5>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2"
                  style={{ borderTop: "1px solid var(--border-primary)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>{t("quizShowcase.simulator.masteryLabel")}</span>
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>{node.score}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
 ══════════════════════════════════════════════════════════════ */

export function QuizShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const { t, language } = useTranslation();

  const [mode, setMode]                       = useState<Mode>("quiz");
  const [activeSubjectId, setActiveSubjectId] = useState<SubjectId>("science");
  const [mastery, setMastery]                 = useState(72);
  const [activePathStep, setActivePathStep]   = useState(3);
  const [isOffline, setIsOffline]             = useState(false);

  const subject = SUBJECTS.find((s) => s.id === activeSubjectId)!;

  const handleSubjectChange = useCallback((id: SubjectId) => {
    const s = SUBJECTS.find((x) => x.id === id)!;
    setActiveSubjectId(id); setMastery(s.progress); setActivePathStep(3);
  }, []);

  const tabs = [
    { id: "quiz",               label: t("quizShowcase.tabs.quiz"),   icon: Target },
    { id: "curriculum-upload",  label: t("quizShowcase.tabs.upload"), icon: Upload },
    { id: "curriculum-builder", label: t("quizShowcase.tabs.builder"),icon: Cpu },
  ] as const;

  return (
    <SectionWrapper id="quiz-showcase" className="py-20 lg:py-28 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12" ref={containerRef}>

        {/* Header */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold
                       tracking-wider uppercase font-[family-name:var(--font-display)] mb-4"
            style={{ background: "color-mix(in srgb, var(--brand-primary) 8%, var(--bg-surface))", border: "1px solid var(--border-brand)", color: "var(--brand-primary)" }}>
            <Brain className="w-3.5 h-3.5" />
            {t("quizShowcase.badge")}
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.68, 0, 1] }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15]">
            {t("quizShowcase.title")}{" "}
            <span className="gradient-text">{t("quizShowcase.titleHighlight")}</span>
          </motion.h2>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            {t("quizShowcase.subtitle")}
          </motion.p>
        </div>

        {/* Mode Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl max-w-full overflow-x-auto"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border-primary)", boxShadow: "inset 0 1px 4px rgba(0,0,0,0.04)" }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = mode === tab.id;
              return (
                <button key={tab.id} onClick={() => setMode(tab.id as Mode)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap font-[family-name:var(--font-display)]"
                  style={{
                    background: isActive ? "var(--bg-surface)" : "transparent",
                    color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
                    boxShadow: isActive ? "var(--shadow-md)" : "none",
                    border: isActive ? "1px solid var(--border-primary)" : "1px solid transparent",
                  }}>
                  <Icon className="w-4 h-4" style={{ color: isActive ? "var(--brand-primary)" : "var(--text-tertiary)" }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Views */}
        <AnimatePresence mode="wait">
          {mode === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-5 items-start">
                <div className="hidden lg:block">
                  <LearningPathPanel activeSubject={activeSubjectId} onSubjectChange={handleSubjectChange} activePathStep={activePathStep} />
                </div>

                <div>
                  {/* Mobile subject tabs */}
                  <div className="flex gap-2 mb-4 overflow-x-auto lg:hidden">
                    {SUBJECTS.map((s) => {
                      const isActive = activeSubjectId === s.id;
                      return (
                        <button key={s.id} onClick={() => handleSubjectChange(s.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all font-[family-name:var(--font-display)]"
                          style={{
                            background: isActive ? `${s.color}15` : "var(--bg-surface)",
                            border: `1px solid ${isActive ? s.color + "40" : "var(--border-primary)"}`,
                            color: isActive ? s.color : "var(--text-secondary)",
                          }}>
                          <span>{s.emoji}</span><span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div key={`${activeSubjectId}-${language}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      <QuizEngine subject={subject} onMasteryChange={setMastery} onPathStepChange={setActivePathStep} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="hidden lg:block">
                  <AIInsightsPanel subject={subject} mastery={mastery}
                    isOffline={isOffline} onOfflineToggle={() => setIsOffline(!isOffline)} />
                </div>
              </div>
            </motion.div>
          )}

          {mode === "curriculum-upload" && (
            <motion.div key="curriculum-upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <CurriculumUploadDemo />
            </motion.div>
          )}

          {mode === "curriculum-builder" && (
            <motion.div key="curriculum-builder" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <CurriculumBuilderDemo />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Feature Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Upload,  color: "var(--brand-primary)",   bg: "rgba(37,99,235,0.06)",  border: "var(--border-brand)",            label: t("quizShowcase.pills.curriculumUpload.label"), desc: t("quizShowcase.pills.curriculumUpload.desc") },
            { icon: Cpu,     color: "var(--accent-violet)",   bg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.2)",           label: t("quizShowcase.pills.curriculumBuilder.label"),desc: t("quizShowcase.pills.curriculumBuilder.desc") },
            { icon: Globe,   color: "var(--accent-emerald)",  bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)",           label: t("quizShowcase.pills.regionalLanguages.label"), desc: t("quizShowcase.pills.regionalLanguages.desc") },
            { icon: WifiOff, color: "var(--text-secondary)",  bg: "var(--bg-muted)",       border: "var(--border-primary)",          label: t("quizShowcase.pills.offlineFirst.label"),       desc: t("quizShowcase.pills.offlineFirst.desc") },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: f.bg, border: `1px solid ${f.border}`, boxShadow: "var(--shadow-sm)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-sm)" }}>
                  <Icon className="w-4 h-4" style={{ color: f.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold font-[family-name:var(--font-display)] leading-tight" style={{ color: "var(--text-primary)" }}>{f.label}</p>
                  <p className="text-[10px] leading-snug mt-0.5" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
