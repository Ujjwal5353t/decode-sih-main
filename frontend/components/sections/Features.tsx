"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  Brain,
  Camera,
  Globe,
  WifiOff,
  Accessibility,
  Gamepad2,
  GraduationCap,
  Mic,
  Sparkles,
  Flame,
  Volume2,
  Play,
  Pause,
  ScanLine,
  RefreshCw,
  Check,
  Sparkle,
  ArrowRight,
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { cn } from "@/lib/utils";

const featuresData = [
  {
    id: "adaptive-learning",
    icon: Brain,
    title: "Adaptive Learning",
    description: "AI adjusts difficulty, pace, and teaching style in real-time based on each child's unique learning patterns.",
    badge: "Core AI Engine",
    span: "lg:col-span-2 lg:row-span-1",
    previewType: "adaptive",
    colorBg: "bg-brand/10",
    colorBorder: "border-brand/20",
    colorText: "text-brand",
  },
  {
    id: "snap-learn",
    icon: Camera,
    title: "Snap & Learn",
    description: "Point your camera at any textbook page — AI extracts content and creates interactive lessons instantly.",
    badge: "Instant OCR",
    span: "lg:col-span-1 lg:row-span-1",
    previewType: "camera",
    colorBg: "bg-cyan-500/10",
    colorBorder: "border-cyan-500/20",
    colorText: "text-cyan-600",
  },
  {
    id: "languages",
    icon: Globe,
    title: "50+ Regional Languages",
    description: "Learn in Hindi, Tamil, Bengali, Marathi, or any of 50+ supported regional languages.",
    badge: "Native Voices",
    span: "lg:col-span-1 lg:row-span-1",
    previewType: "languages",
    colorBg: "bg-emerald-500/10",
    colorBorder: "border-emerald-500/20",
    colorText: "text-emerald-600",
  },
  {
    id: "accessibility",
    icon: Accessibility,
    title: "Accessibility Suite",
    description: "Dyslexia-friendly fonts, ADHD focus modes, high-contrast themes, and screen reader optimized content.",
    badge: "WCAG AAA",
    span: "lg:col-span-2 lg:row-span-1",
    previewType: "accessibility",
    colorBg: "bg-violet-500/10",
    colorBorder: "border-violet-500/20",
    colorText: "text-violet-600",
  },
  {
    id: "offline-first",
    icon: WifiOff,
    title: "Offline-First",
    description: "Download lessons once, learn anywhere. No internet required after initial sync.",
    badge: "Zero Latency",
    span: "lg:col-span-1 lg:row-span-1",
    previewType: "offline",
    colorBg: "bg-emerald-500/10",
    colorBorder: "border-emerald-500/20",
    colorText: "text-emerald-600",
  },
  {
    id: "gamified",
    icon: Gamepad2,
    title: "Gamified Learning",
    description: "XP points, streak rewards, leaderboards, and achievement badges that make learning addictive.",
    badge: "Fun & Engaging",
    span: "lg:col-span-1 lg:row-span-1",
    previewType: "gamified",
    colorBg: "bg-amber-500/10",
    colorBorder: "border-amber-500/20",
    colorText: "text-amber-600",
  },
  {
    id: "teacher-assistant",
    icon: GraduationCap,
    title: "Teacher AI Assistant",
    description: "Automated lesson planning, smart grading, and personalized student insights.",
    badge: "Time Saver",
    span: "lg:col-span-1 lg:row-span-1",
    previewType: "teacher",
    colorBg: "bg-brand/10",
    colorBorder: "border-brand/20",
    colorText: "text-brand",
  },
  {
    id: "parent-voice",
    icon: Mic,
    title: "Parent Voice Updates",
    description: "AI-generated audio summaries of your child's progress — in your language.",
    badge: "Daily Audio",
    span: "lg:col-span-1 lg:row-span-1",
    previewType: "audio",
    colorBg: "bg-rose-500/10",
    colorBorder: "border-rose-500/20",
    colorText: "text-rose-600",
  },
  {
    id: "ai-lessons",
    icon: Sparkles,
    title: "AI-Generated Lessons",
    description: "Personalized lesson content created by AI, tailored to curriculum and learning goals.",
    badge: "Auto Curriculum",
    span: "lg:col-span-1 lg:row-span-1",
    previewType: "curriculum",
    colorBg: "bg-violet-500/10",
    colorBorder: "border-violet-500/20",
    colorText: "text-violet-600",
  },
];

// Isolated Feature Card Component for zero-lag local hover state
function FeatureCard({
  feature,
  idx,
  isInView,
}: {
  feature: (typeof featuresData)[number];
  idx: number;
  isInView: boolean;
}) {
  const Icon = feature.icon;
  const [isHovered, setIsHovered] = useState(false);

  // Widget sub-states
  const [difficultyLevel, setDifficultyLevel] = useState<"beginner" | "adaptive" | "advanced">("adaptive");
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [langIndex, setLangIndex] = useState(0);
  const [isOffline, setIsOffline] = useState(true);
  const [accessMode, setAccessMode] = useState<"dyslexia" | "contrast" | "adhd">("dyslexia");
  const [xpCount, setXpCount] = useState(250);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [deckGenerated, setDeckGenerated] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);

  const sampleTranslations = [
    { lang: "English", flag: "🇬🇧", text: "Welcome to learning!" },
    { lang: "हिन्दी", flag: "🇮🇳", text: "सीखने में आपका स्वागत है!" },
    { lang: "தமிழ்", flag: "🇮🇳", text: "கற்றலுக்கு வரவேற்கிறோம்!" },
    { lang: "বাংলা", flag: "🇮🇳", text: "শেখার জগতে স্বাগতম!" },
    { lang: "मराठी", flag: "🇮🇳", text: "शिकण्यात आपले स्वागत आहे!" },
  ];

  const handleScanTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 1000);
  };

  const handleDeckGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingDeck(true);
    setTimeout(() => {
      setIsGeneratingDeck(false);
      setDeckGenerated(true);
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: 0.1 + idx * 0.04,
        ease: [0.22, 0.68, 0, 1],
      }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-[28px] bg-surface border border-border-primary",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-brand/40",
        "p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all duration-300",
        feature.span
      )}
    >
      {/* Subtle Hover Ambient Glow Overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top left, color-mix(in srgb, var(--brand-primary) 6%, transparent), transparent 70%)",
        }}
      />

      {/* ══ DEFAULT CLEAN MINIMAL CARD LAYOUT ══ */}
      <div className="relative z-10 pointer-events-none">
        {/* Top Bar: Icon + Badge */}
        <div className="flex items-center justify-between mb-5">
          <div
            className={cn(
              "w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center border shadow-xs transition-all duration-300",
              feature.colorBg,
              feature.colorBorder,
              feature.colorText
            )}
          >
            <Icon className="w-6 h-6" />
          </div>

          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold font-[family-name:var(--font-display)] border",
              feature.colorBg,
              feature.colorBorder,
              feature.colorText
            )}
          >
            {feature.badge}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold mb-2 text-text-primary font-[family-name:var(--font-display)]">
          {feature.title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* ══ DEFAULT BOTTOM PILL INDICATOR (Visible when NOT hovered) ══ */}
      {!isHovered && (
        <div className="pt-5 mt-6 border-t border-border-secondary/60 flex items-center justify-between text-xs text-text-tertiary font-semibold font-[family-name:var(--font-display)] relative z-10 pointer-events-none">
          <span className="flex items-center gap-1.5 text-brand group-hover:text-brand-hover transition-colors">
            <Sparkle className="w-3.5 h-3.5" />
            Hover to preview feature
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-text-tertiary group-hover:translate-x-1 group-hover:text-brand transition-all" />
        </div>
      )}

      {/* ══ HOVER-REVEALED LIVE DEMO IMPLEMENTATION WIDGET PANEL ══ */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 0.68, 0, 1],
            }}
            className="pt-4 mt-5 border-t border-border-secondary relative z-20 overflow-hidden"
          >
            {/* 1. Adaptive Learning Demo */}
            {feature.previewType === "adaptive" && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-secondary font-[family-name:var(--font-display)]">
                    AI Pace Mode:
                  </span>
                  <span className="text-xs font-extrabold text-brand uppercase font-[family-name:var(--font-display)]">
                    {difficultyLevel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(["beginner", "adaptive", "advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDifficultyLevel(lvl);
                      }}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer font-[family-name:var(--font-display)]",
                        difficultyLevel === lvl
                          ? "bg-brand text-white shadow-xs"
                          : "bg-surface text-text-secondary hover:bg-muted"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <div className="h-2 rounded-full bg-border-primary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-brand)" }}
                    animate={{
                      width:
                        difficultyLevel === "beginner"
                          ? "35%"
                          : difficultyLevel === "adaptive"
                          ? "70%"
                          : "95%",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                </div>
              </div>
            )}

            {/* 2. Snap & Learn Camera Scanner Demo */}
            {feature.previewType === "camera" && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
                    <ScanLine className="w-3.5 h-3.5 text-cyan-500" />
                    Scanner
                  </span>
                  <button
                    onClick={handleScanTrigger}
                    disabled={isScanning}
                    className="px-2.5 py-1 rounded-md bg-cyan-600 text-white text-[11px] font-bold cursor-pointer hover:bg-cyan-700 font-[family-name:var(--font-display)]"
                  >
                    {isScanning ? "Scanning..." : "Snap 📸"}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border-primary relative overflow-hidden text-[11px] font-mono text-text-secondary">
                  {isScanning && (
                    <motion.div
                      className="absolute inset-x-0 h-1 bg-cyan-500 shadow-[0_0_10px_#06B6D4]"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {scanComplete
                    ? "✨ Extracted 4 Concepts & Quiz!"
                    : isScanning
                    ? "🔍 Scanning page..."
                    : "Page 42: Photosynthesis & Energy..."}
                </div>
              </div>
            )}

            {/* 3. 50+ Regional Languages Translator Demo */}
            {feature.previewType === "languages" && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-secondary">Live Translator</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLangIndex((prev) => (prev + 1) % sampleTranslations.length);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer font-[family-name:var(--font-display)]"
                  >
                    <RefreshCw className="w-3 h-3" /> Cycle
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border-primary">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{sampleTranslations[langIndex].flag}</span>
                    <span className="text-[11px] font-bold text-emerald-600 font-[family-name:var(--font-display)]">
                      {sampleTranslations[langIndex].lang}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-text-primary">
                    {sampleTranslations[langIndex].text}
                  </p>
                </div>
              </div>
            )}

            {/* 4. Accessibility Suite Demo */}
            {feature.previewType === "accessibility" && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-secondary font-[family-name:var(--font-display)]">
                    Reading Mode:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAccessMode("dyslexia");
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer font-[family-name:var(--font-display)]",
                        accessMode === "dyslexia" ? "bg-violet-600 text-white" : "bg-surface text-text-secondary"
                      )}
                    >
                      Dyslexia
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAccessMode("contrast");
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer font-[family-name:var(--font-display)]",
                        accessMode === "contrast" ? "bg-yellow-400 text-black font-bold" : "bg-surface text-text-secondary"
                      )}
                    >
                      Contrast
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAccessMode("adhd");
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer font-[family-name:var(--font-display)]",
                        accessMode === "adhd" ? "bg-brand text-white" : "bg-surface text-text-secondary"
                      )}
                    >
                      ADHD Focus
                    </button>
                  </div>
                </div>
                <div
                  className={cn(
                    "p-2.5 rounded-xl border text-xs transition-all",
                    accessMode === "dyslexia"
                      ? "bg-[#FFF9E6] text-[#1a1a1a] border-[#E8D9B0] font-sans"
                      : accessMode === "contrast"
                      ? "bg-[#000000] text-[#FFFF00] border-[#FFFF00] font-bold"
                      : "bg-surface text-text-primary border-brand font-medium"
                  )}
                >
                  {accessMode === "dyslexia"
                    ? "Ph-o-to-syn-the-sis is how plants create energy."
                    : accessMode === "contrast"
                    ? "HIGH LUMINANCE CONTRAST MODE ACTIVE"
                    : "🔍 Active Line Spotlight: Chlorophyll captures sunlight."}
                </div>
              </div>
            )}

            {/* 5. Offline-First Demo */}
            {feature.previewType === "offline" && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-secondary">Network Mode</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOffline(!isOffline);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer font-[family-name:var(--font-display)]",
                      isOffline ? "bg-emerald-600 text-white" : "bg-brand text-white"
                    )}
                  >
                    {isOffline ? "📶 Offline" : "🌐 Online"}
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-border-primary flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-text-primary">WatermelonDB Cache</span>
                  <span className="font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    ✓ 100% Ready
                  </span>
                </div>
              </div>
            )}

            {/* 6. Gamified Learning Demo */}
            {feature.previewType === "gamified" && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" /> 5-Day Streak
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setXpCount((prev) => prev + 50);
                    }}
                    className="px-2.5 py-0.5 rounded bg-amber-500 text-white text-[11px] font-bold cursor-pointer hover:bg-amber-600 font-[family-name:var(--font-display)]"
                  >
                    +50 XP ⚡
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-border-primary flex items-center justify-between text-xs font-bold text-amber-600 font-[family-name:var(--font-display)]">
                  <span>Score:</span>
                  <span>{xpCount} XP</span>
                </div>
              </div>
            )}

            {/* 7. Teacher AI Assistant Demo */}
            {feature.previewType === "teacher" && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-secondary font-[family-name:var(--font-display)]">
                    AI Lesson Builder
                  </span>
                  <button
                    onClick={handleDeckGenerate}
                    disabled={isGeneratingDeck}
                    className="px-2.5 py-0.5 rounded bg-brand text-white text-[11px] font-bold cursor-pointer hover:bg-brand-hover font-[family-name:var(--font-display)]"
                  >
                    {isGeneratingDeck ? "Building..." : "Generate ⚡"}
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-border-primary text-[11px]">
                  {deckGenerated ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 20-min Recap Deck Ready!
                    </span>
                  ) : (
                    <span className="text-text-tertiary">Tap to generate presentation...</span>
                  )}
                </div>
              </div>
            )}

            {/* 8. Parent Voice Updates Demo */}
            {feature.previewType === "audio" && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" /> Hindi Voice Update
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlayingAudio(!isPlayingAudio);
                    }}
                    className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center cursor-pointer"
                  >
                    {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-1 h-4 px-2 bg-surface rounded-xl border border-border-primary">
                  {Array.from({ length: 18 }).map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="flex-1 rounded-full bg-rose-500"
                      animate={{
                        height: isPlayingAudio
                          ? [`${(idx % 4 + 2) * 2.5}px`, `${((idx + 2) % 5 + 2) * 3.5}px`, `${(idx % 4 + 2) * 2.5}px`]
                          : "3px",
                      }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: idx * 0.03 }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 9. AI-Generated Lessons Demo */}
            {feature.previewType === "curriculum" && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border-secondary">
                <p className="text-[11px] font-bold text-text-primary mb-1.5 font-[family-name:var(--font-display)]">
                  What do plants produce?
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuizSelected(1);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer font-[family-name:var(--font-display)]",
                      quizSelected === 1 ? "bg-emerald-500/10 border-emerald-500 text-emerald-600" : "bg-surface border-border-primary text-text-secondary"
                    )}
                  >
                    Glucose & O₂ {quizSelected === 1 && "✓"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuizSelected(2);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer font-[family-name:var(--font-display)]",
                      quizSelected === 2 ? "bg-rose-500/10 border-rose-500 text-rose-600" : "bg-surface border-border-primary text-text-secondary"
                    )}
                  >
                    Carbon {quizSelected === 2 && "×"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });

  return (
    <SectionWrapper id="features" className="py-20 lg:py-26 overflow-hidden">
      {/* Ambient Multi-Color Background Mesh */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, var(--accent-cyan), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, var(--accent-violet), transparent 70%)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12" ref={containerRef}>
        {/* ════ SECTION HEADER ════ */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold
                       tracking-wider uppercase font-[family-name:var(--font-display)] mb-4 border"
            style={{
              borderColor: "var(--border-brand)",
              background: "color-mix(in srgb, var(--brand-primary) 6%, var(--bg-surface))",
              color: "var(--brand-primary)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            BUILT FOR EVERYONE
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight leading-[1.15]"
          >
            Features that make a <span className="gradient-text">real difference.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-text-secondary text-base sm:text-lg"
          >
            Clean and minimal by default. Hover any feature card to reveal its live interactive demo.
          </motion.p>
        </div>

        {/* ════ CREATIVE BENTO GRID WITH ISOLATED HOVER CARDS ════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresData.map((feature, idx) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              idx={idx}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
