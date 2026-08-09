"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useCallback, useEffect, memo } from "react";
import {
  Eye,
  Type,
  Focus,
  Contrast,
  Volume2,
  Play,
  Pause,
  Sparkles,
  Maximize2,
  ArrowLeftRight,
  Hand,
  CheckCircle2,
  Palette,
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { cn } from "@/lib/utils";

type AccessibilityFeatureId =
  | "dyslexia"
  | "adhd"
  | "high-contrast"
  | "color-blind"
  | "large-text"
  | "screen-reader"
  | "sign-language";

interface FeatureMode {
  id: AccessibilityFeatureId;
  label: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  beforeLabel: string;
  afterLabel: string;
}

const ACCESSIBILITY_FEATURES: FeatureMode[] = [
  {
    id: "dyslexia",
    label: "Dyslexia Support",
    badge: "OpenDyslexic Font",
    icon: Type,
    description: "Weighted character bottoms, wider letter spacing, and warm background tint to eliminate visual crowding.",
    beforeLabel: "Standard Dense Text",
    afterLabel: "Dyslexia-Adapted Format",
  },
  {
    id: "adhd",
    label: "ADHD Focus Mode",
    badge: "Spotlight Ruler",
    icon: Focus,
    description: "Dimmed background with an interactive reading spotlight ruler that tracks reading lines and removes clutter.",
    beforeLabel: "Standard Full Page",
    afterLabel: "Focused Reading Ruler",
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    badge: "WCAG AAA 21:1",
    icon: Contrast,
    description: "Ultra-high contrast color themes engineered for low vision, glare reduction, and outdoor sunlight reading.",
    beforeLabel: "Standard Contrast (4.5:1)",
    afterLabel: "WCAG AAA High Contrast (21:1)",
  },
  {
    id: "color-blind",
    label: "Color Blind Friendly",
    badge: "Palette Adapted",
    icon: Palette,
    description: "Pattern fills, high-contrast borders, and adaptive color schemes tailored for Protanopia, Deuteranopia & Tritanopia.",
    beforeLabel: "Standard Color Diagram",
    afterLabel: "Adaptive Color & Pattern Diagram",
  },
  {
    id: "large-text",
    label: "Dynamic Sizing",
    badge: "Scalable Typography",
    icon: Maximize2,
    description: "Instant font magnification and customizable line height without breaking layout structure or button alignment.",
    beforeLabel: "Standard 14px Text",
    afterLabel: "Enhanced 22px Scaled Text",
  },
  {
    id: "screen-reader",
    label: "Audio Narration",
    badge: "Live Word Sync",
    icon: Volume2,
    description: "Natural AI voice narration with real-time karaoke-style word highlighting and audio speed control.",
    beforeLabel: "Silent Reading Text",
    afterLabel: "Animated Voice Narration",
  },
  {
    id: "sign-language",
    label: "Sign Language AI",
    badge: "ISL/ASL Avatar",
    icon: Hand,
    description: "Integrated picture-in-picture sign language avatar interpreting key concepts for deaf and hard-of-hearing learners.",
    beforeLabel: "Text Only Lesson",
    afterLabel: "Text + Sign Language Avatar",
  },
];

// Sample Content for Comparison Demonstrations
const LESSON_CONTENT = {
  title: "Photosynthesis: How Plants Make Food",
  subtitle: "Grade 6 Science · Chapter 4",
  body: "Plants are nature's solar food factories. They draw liquid water from soil through roots, capture carbon dioxide gas from surrounding air, and absorb radiant sunlight using green chlorophyll pigments inside leaf cells.",
  equation: "6CO₂ + 6H₂O + Sunlight ⟶ C₆H₁₂O₆ + 6O₂",
  takeaway: "Key Takeaway: Water + Carbon Dioxide + Sunlight = Glucose (Food) + Oxygen.",
};

// Isolated Sub-component for Audio Karaoke Narration to avoid re-rendering main section
const AudioKaraokeNarration = memo(function AudioKaraokeNarration({
  isPlayingAudio,
  setIsPlayingAudio,
}: {
  isPlayingAudio: boolean;
  setIsPlayingAudio: (val: boolean) => void;
}) {
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const wordsList = LESSON_CONTENT.body.split(" ");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setActiveWordIdx((prev) => (prev + 1) % wordsList.length);
      }, 350);
    } else {
      setActiveWordIdx(0);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, wordsList.length]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-2xl font-extrabold text-text-primary font-[family-name:var(--font-display)]">
          {LESSON_CONTENT.title}
        </h4>
        <button
          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md hover:bg-rose-600 transition-colors"
        >
          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          <span>{isPlayingAudio ? "Pause Audio" : "Listen Live 🔊"}</span>
        </button>
      </div>

      {isPlayingAudio && (
        <div className="flex items-center gap-1.5 h-6 mb-6 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
          {Array.from({ length: 24 }).map((_, idx) => (
            <motion.div
              key={idx}
              className="flex-1 bg-rose-500 rounded-full"
              animate={{
                height: [
                  `${(idx % 5 + 2) * 3}px`,
                  `${((idx + 3) % 6 + 2) * 4}px`,
                  `${(idx % 5 + 2) * 3}px`,
                ],
              }}
              transition={{ duration: 0.5, repeat: Infinity, delay: idx * 0.02 }}
            />
          ))}
        </div>
      )}

      <p className="text-lg sm:text-xl text-text-primary leading-relaxed font-medium mb-6">
        {wordsList.map((word, wIdx) => (
          <span
            key={wIdx}
            className={cn(
              "px-1 py-0.5 rounded transition-all duration-200 inline-block mr-1",
              isPlayingAudio && activeWordIdx === wIdx
                ? "bg-rose-500 text-white font-bold scale-110 shadow-sm"
                : ""
            )}
          >
            {word}
          </span>
        ))}
      </p>
    </div>
  );
});

// Isolated Indian Sign Language (ISL) Prototype Player Component
const IndianSignLanguagePlayer = memo(function IndianSignLanguagePlayer() {
  const [selectedDialect, setSelectedDialect] = useState<"ISL" | "ASL">("ISL");
  const [activeConcept, setActiveConcept] = useState<"photosynthesis" | "chlorophyll" | "sunlight">("photosynthesis");
  const [isPlayingSign, setIsPlayingSign] = useState<boolean>(true);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [frameStep, setFrameStep] = useState<number>(0);

  const concepts = [
    { id: "photosynthesis", name: "Photosynthesis", islGloss: "PLANT + SUNLIGHT + FOOD MAKE", gesture: "🌱 🤲 ☀️ ➔ 🍏" },
    { id: "chlorophyll", name: "Chlorophyll", islGloss: "LEAF + GREEN + LIGHT CAPTURE", gesture: "🍃 🟢 ⚡ ➔ 🔋" },
    { id: "sunlight", name: "Sunlight Energy", islGloss: "SUN + RAY + CELL ABSORB", gesture: "☀️ 🫴 🌿 ➔ ✨" },
  ] as const;

  const activeConceptObj = concepts.find((c) => c.id === activeConcept) || concepts[0];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingSign) {
      interval = setInterval(() => {
        setFrameStep((prev) => (prev + 1) % 4);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isPlayingSign]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left side: Lesson Text with Synced Highlighting */}
      <div className="lg:col-span-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            ✓ ISL Synchronized Lesson Text
          </span>

          {/* Dialect Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-[11px] font-bold">
            <button
              onClick={() => setSelectedDialect("ISL")}
              className={cn(
                "px-2.5 py-0.5 rounded cursor-pointer transition-all",
                selectedDialect === "ISL" ? "bg-brand text-white shadow-xs" : "text-text-secondary"
              )}
            >
              🇮🇳 ISL (Indian)
            </button>
            <button
              onClick={() => setSelectedDialect("ASL")}
              className={cn(
                "px-2.5 py-0.5 rounded cursor-pointer transition-all",
                selectedDialect === "ASL" ? "bg-brand text-white shadow-xs" : "text-text-secondary"
              )}
            >
              🇺🇸 ASL
            </button>
          </div>
        </div>

        <h4 className="text-2xl font-extrabold text-text-primary font-[family-name:var(--font-display)]">
          {LESSON_CONTENT.title}
        </h4>

        {/* Concept Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-tertiary">Select Concept:</span>
          {concepts.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveConcept(c.id);
                setFrameStep(0);
                setIsPlayingSign(true);
              }}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                activeConcept === c.id
                  ? "bg-emerald-600 text-white border-transparent shadow-xs"
                  : "bg-surface text-text-secondary border-border-primary hover:border-emerald-500/40"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        <p className="text-base text-text-secondary leading-relaxed font-medium">
          Plants draw liquid water from soil through roots, capture carbon dioxide gas from surrounding air, and absorb radiant{" "}
          <span
            className={cn(
              "px-1.5 py-0.5 rounded transition-all font-bold",
              activeConcept === "sunlight" ? "bg-amber-400 text-black shadow-xs" : "bg-amber-400/20 text-amber-700"
            )}
          >
            sunlight
          </span>{" "}
          using green{" "}
          <span
            className={cn(
              "px-1.5 py-0.5 rounded transition-all font-bold",
              activeConcept === "chlorophyll" ? "bg-emerald-500 text-white shadow-xs" : "bg-emerald-500/20 text-emerald-700"
            )}
          >
            chlorophyll
          </span>{" "}
          pigments during{" "}
          <span
            className={cn(
              "px-1.5 py-0.5 rounded transition-all font-bold",
              activeConcept === "photosynthesis" ? "bg-brand text-white shadow-xs" : "bg-brand/20 text-brand"
            )}
          >
            photosynthesis
          </span>.
        </p>
      </div>

      {/* Right side: ISL Video/Avatar Prototype Player Box */}
      <div className="lg:col-span-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        {/* Player Top Bar */}
        <div className="flex items-center justify-between mb-4 border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider font-[family-name:var(--font-display)]">
              {selectedDialect} AI Avatar Interpreter
            </span>
          </div>
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className="text-[11px] font-bold text-indigo-300 hover:text-white px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 cursor-pointer"
          >
            {showCaptions ? "CC Captions ON" : "CC Captions OFF"}
          </button>
        </div>

        {/* Avatar Visual Prototype Canvas Box */}
        <div className="relative h-56 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex flex-col items-center justify-center p-4 text-center overflow-hidden mb-4">
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase font-[family-name:var(--font-display)]">
            ISL Sign: &ldquo;{activeConceptObj.name}&rdquo;
          </div>

          {/* Animated Gesture Representation */}
          <motion.div
            key={`${activeConcept}-${frameStep}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-5xl mb-2"
          >
            {activeConceptObj.gesture}
          </motion.div>

          <h5 className="font-bold text-sm font-[family-name:var(--font-display)] text-indigo-200">
            Demonstrating {activeConceptObj.name}
          </h5>
          <p className="text-[11px] text-indigo-300/80 mt-0.5">
            Synchronized with Grade 6 Science Curriculum
          </p>

          {/* ISL Gloss Subtitles Overlay */}
          {showCaptions && (
            <div className="absolute bottom-3 inset-x-3 p-2 rounded bg-black/80 border border-indigo-500/40 text-emerald-300 font-mono text-[11px] font-bold">
              ISL Gloss: {activeConceptObj.islGloss}
            </div>
          )}
        </div>

        {/* Player Controls Bar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlayingSign(!isPlayingSign)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-extrabold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-400 transition-colors"
            >
              {isPlayingSign ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              <span>{isPlayingSign ? "Pause" : "Play"}</span>
            </button>
            <button
              onClick={() => {
                setFrameStep(0);
                setIsPlayingSign(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 font-bold hover:bg-indigo-500/30 cursor-pointer"
            >
              Replay 🔄
            </button>
          </div>

          <span className="text-[11px] text-indigo-300/70 font-mono">
            Ready for real ISL video feeds
          </span>
        </div>
      </div>
    </div>
  );
});

export function AccessibilitySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });

  // Currently Selected Feature Mode
  const [activeFeature, setActiveFeature] = useState<AccessibilityFeatureId>("dyslexia");

  // Comparison Slider State (0 to 100 percentage of AFTER side revealed)
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Customizer Live Controls
  const [fontSizePx, setFontSizePx] = useState<number>(18);
  const [lineHeightVal] = useState<number>(1.8);
  const [colorBlindMode, setColorBlindMode] = useState<"deuteranopia" | "protanopia" | "tritanopia">("deuteranopia");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [spotlightY, setSpotlightY] = useState<number>(45);

  const activeModeObj = ACCESSIBILITY_FEATURES.find((f) => f.id === activeFeature) || ACCESSIBILITY_FEATURES[0];

  // High performance RAF throttle for slider dragging
  const animFrameId = useRef<number | null>(null);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    if (animFrameId.current !== null) cancelAnimationFrame(animFrameId.current);

    animFrameId.current = requestAnimationFrame(() => {
      if (!sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPos(percent);
      animFrameId.current = null;
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    updateSliderPosition(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) updateSliderPosition(e.clientX);
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateSliderPosition]);

  // High performance RAF throttle for ADHD spotlight ruler mouse tracking
  const spotlightAnimFrame = useRef<number | null>(null);

  const handleSpotlightMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeFeature !== "adhd" || !sliderContainerRef.current) return;
      const clientY = e.clientY;
      if (spotlightAnimFrame.current !== null) cancelAnimationFrame(spotlightAnimFrame.current);

      spotlightAnimFrame.current = requestAnimationFrame(() => {
        if (!sliderContainerRef.current) return;
        const rect = sliderContainerRef.current.getBoundingClientRect();
        const y = ((clientY - rect.top) / rect.height) * 100;
        setSpotlightY(Math.max(10, Math.min(90, y)));
        spotlightAnimFrame.current = null;
      });
    },
    [activeFeature]
  );

  return (
    <SectionWrapper id="accessibility" className="py-20 lg:py-26 overflow-hidden noise-overlay">
      {/* Background radial ambient light */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(ellipse, var(--brand-primary), transparent 70%)",
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold
                       tracking-wider uppercase font-[family-name:var(--font-display)] mb-4 border"
            style={{
              borderColor: "var(--border-brand)",
              background: "color-mix(in srgb, var(--brand-primary) 8%, var(--bg-surface))",
              color: "var(--brand-primary)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
            ACCESSIBILITY FIRST
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight leading-[1.15]"
          >
            Education without <span className="gradient-text">barriers.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-text-secondary text-base sm:text-lg leading-relaxed"
          >
            Experience every accessibility feature in real time. Drag the interactive comparison slider to compare standard content with the accessibility-enhanced version.
          </motion.p>
        </div>

        {/* ════ ACCESSIBILITY FEATURE MODE TAB SELECTOR ════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10"
        >
          {ACCESSIBILITY_FEATURES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeFeature === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() => {
                  setActiveFeature(mode.id);
                  setSliderPos(50);
                  setIsPlayingAudio(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border",
                  "font-[family-name:var(--font-display)] shadow-xs hover:scale-[1.02]",
                  isActive
                    ? "text-white border-transparent shadow-[var(--shadow-brand)]"
                    : "bg-surface border-border-primary text-text-secondary hover:border-brand/40 hover:text-text-primary"
                )}
                style={isActive ? { background: "var(--gradient-brand)" } : {}}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{mode.label}</span>
                {isActive && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
                    {mode.badge}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* ════ MAIN PLAYGROUND CANVAS WITH COMPARISON SLIDER ════ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="rounded-[32px] bg-surface border border-border-primary shadow-[var(--shadow-xl)] overflow-hidden"
        >
          {/* Header Info Bar */}
          <div className="p-6 sm:p-8 border-b border-border-secondary bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
                  {activeModeObj.label} Interactive Demo
                </h3>
              </div>
              <p className="text-sm text-text-secondary mt-1 max-w-2xl">
                {activeModeObj.description}
              </p>
            </div>

            {/* Instruction Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand/10 border border-brand/20 text-brand text-xs font-bold font-[family-name:var(--font-display)] shrink-0 self-start sm:self-center">
              <ArrowLeftRight className="w-4 h-4" />
              <span>Drag slider left / right</span>
            </div>
          </div>

          {/* ════ INTERACTIVE BEFORE VS AFTER SLIDER CONTAINER ════ */}
          <div
            ref={sliderContainerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={() => setIsDragging(true)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
            onMouseMove={handleSpotlightMouseMove}
            className="relative min-h-[460px] sm:min-h-[500px] select-none cursor-ew-resize overflow-hidden"
          >
            {/* ── 1. BEFORE LAYER (Full Width Background Layer) ── */}
            <div className="absolute inset-0 p-8 sm:p-12 bg-surface text-text-primary flex flex-col justify-between overflow-hidden">
              <div className="max-w-3xl mx-auto w-full">
                {/* Before Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider font-[family-name:var(--font-display)] mb-6">
                  <span>BEFORE</span> · <span>{activeModeObj.beforeLabel}</span>
                </div>

                {/* Standard Content Render */}
                <h4 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-2 font-[family-name:var(--font-display)]">
                  {LESSON_CONTENT.title}
                </h4>
                <p className="text-xs text-text-tertiary font-semibold uppercase tracking-wider mb-6">
                  {LESSON_CONTENT.subtitle}
                </p>

                {/* Standard Text Body */}
                <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6 font-normal">
                  {LESSON_CONTENT.body}
                </p>

                {/* Standard Chemical Equation */}
                <div className="p-4 rounded-xl bg-muted/60 border border-border-primary text-center font-mono text-sm sm:text-base text-text-primary mb-6">
                  {LESSON_CONTENT.equation}
                </div>

                {/* Standard Takeaway */}
                <p className="text-sm font-semibold text-text-tertiary italic">
                  {LESSON_CONTENT.takeaway}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-border-secondary flex items-center justify-between text-xs text-text-tertiary">
                <span>Standard Unadapted Display</span>
                <span className="font-semibold">Slide right to reveal accessibility enhancements ➔</span>
              </div>
            </div>

            {/* ── 2. AFTER LAYER (Clipped Overlay Layer with GPU acceleration) ── */}
            <div
              className="absolute inset-0 p-8 sm:p-12 overflow-hidden pointer-events-none"
              style={{
                clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                backgroundColor:
                  activeFeature === "high-contrast"
                    ? "#000000"
                    : activeFeature === "dyslexia"
                    ? "#FFF9E6"
                    : "var(--bg-surface)",
                willChange: "clip-path",
              }}
            >
              <div
                className={cn(
                  "max-w-3xl mx-auto w-full h-full flex flex-col justify-between",
                  activeFeature === "high-contrast" ? "text-[#FFFFFF]" : "text-text-primary"
                )}
              >
                <div>
                  {/* After Badge */}
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider font-[family-name:var(--font-display)] mb-6 shadow-xs",
                      activeFeature === "high-contrast"
                        ? "bg-[#FFFF00] text-black font-extrabold"
                        : "bg-brand text-white"
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>AFTER</span> · <span>{activeModeObj.afterLabel}</span>
                  </div>

                  {/* ── DYSLEXIA MODE RENDER ── */}
                  {activeFeature === "dyslexia" && (
                    <div>
                      <h4 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] mb-2 font-sans tracking-wide leading-snug">
                        {LESSON_CONTENT.title}
                      </h4>
                      <p className="text-xs text-[#665c40] font-bold uppercase tracking-widest mb-6">
                        {LESSON_CONTENT.subtitle} · Dyslexia Adapted
                      </p>
                      <p className="text-lg sm:text-xl text-[#1a1a1a] leading-loose tracking-wide font-sans mb-6">
                        {LESSON_CONTENT.body}
                      </p>
                      <div className="p-5 rounded-2xl bg-[#FFE4B5] border-2 border-[#E8D9B0] text-center font-mono text-base font-bold text-[#1a1a1a] mb-6 shadow-xs">
                        🌱 {LESSON_CONTENT.equation}
                      </div>
                      <div className="p-4 rounded-xl bg-[#FFF0C2] border border-[#E8D9B0] text-base font-bold text-[#1a1a1a]">
                        ✨ {LESSON_CONTENT.takeaway}
                      </div>
                    </div>
                  )}

                  {/* ── ADHD FOCUS SPOTLIGHT MODE RENDER ── */}
                  {activeFeature === "adhd" && (
                    <div className="relative">
                      {/* Spotlight Overlay Window */}
                      <div
                        className="absolute inset-x-0 h-24 bg-brand/10 border-y-2 border-brand pointer-events-none z-10 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                        style={{ top: `${spotlightY}%`, transform: "translateY(-50%)", willChange: "top" }}
                      >
                        <div className="absolute top-1 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-brand text-white">
                          Spotlight Focus Line
                        </div>
                      </div>

                      <h4 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-2 font-[family-name:var(--font-display)]">
                        {LESSON_CONTENT.title}
                      </h4>
                      <p className="text-xs text-brand font-bold uppercase tracking-wider mb-6">
                        ADHD Reading Ruler Active (Move mouse up/down)
                      </p>
                      <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6 font-medium opacity-80">
                        {LESSON_CONTENT.body}
                      </p>
                      <div className="p-4 rounded-xl bg-brand/5 border border-brand/30 text-center font-mono text-sm text-brand font-bold mb-6">
                        {LESSON_CONTENT.equation}
                      </div>
                      <p className="text-sm font-bold text-brand bg-brand/10 p-3 rounded-lg border border-brand/20">
                        🎯 {LESSON_CONTENT.takeaway}
                      </p>
                    </div>
                  )}

                  {/* ── HIGH CONTRAST MODE RENDER ── */}
                  {activeFeature === "high-contrast" && (
                    <div>
                      <h4 className="text-2xl sm:text-3xl font-black text-[#FFFF00] mb-2 font-mono tracking-wider">
                        {LESSON_CONTENT.title}
                      </h4>
                      <p className="text-xs text-[#00FFFF] font-bold uppercase tracking-widest mb-6">
                        WCAG AAA 21:1 LUMINANCE CONTRAST
                      </p>
                      <p className="text-lg sm:text-xl text-[#FFFFFF] leading-loose font-bold mb-6">
                        {LESSON_CONTENT.body}
                      </p>
                      <div className="p-5 rounded-2xl bg-[#000000] border-4 border-[#FFFF00] text-center font-mono text-lg font-black text-[#FFFF00] mb-6">
                        {LESSON_CONTENT.equation}
                      </div>
                      <div className="p-4 rounded-xl bg-[#FFFF00] text-[#000000] font-black text-base">
                        ⚡ {LESSON_CONTENT.takeaway}
                      </div>
                    </div>
                  )}

                  {/* ── COLOR BLIND ADAPTED RENDER ── */}
                  {activeFeature === "color-blind" && (
                    <div>
                      <h4 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-2 font-[family-name:var(--font-display)]">
                        {LESSON_CONTENT.title}
                      </h4>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          Pattern-Coded Diagram ({colorBlindMode.toUpperCase()})
                        </span>
                      </div>

                      {/* Color Blind Visual Diagram Simulation */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 rounded-2xl bg-sky-500/10 border-2 border-sky-500 text-center">
                          <div className="w-8 h-8 rounded-full bg-sky-500 mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">
                            H₂O
                          </div>
                          <span className="text-xs font-bold text-sky-600 block">Water (Stripes //)</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">
                            CO₂
                          </div>
                          <span className="text-xs font-bold text-emerald-600 block">Carbon (Dots ::)</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500 text-center">
                          <div className="w-8 h-8 rounded-full bg-amber-500 mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">
                            Sun
                          </div>
                          <span className="text-xs font-bold text-amber-600 block">Energy (Cross XX)</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-muted/80 border border-border-primary font-mono text-sm text-text-primary font-bold">
                        {LESSON_CONTENT.equation}
                      </div>
                    </div>
                  )}

                  {/* ── DYNAMIC FONT SIZING RENDER ── */}
                  {activeFeature === "large-text" && (
                    <div>
                      <h4
                        className="font-extrabold text-brand mb-3 font-[family-name:var(--font-display)]"
                        style={{ fontSize: `${fontSizePx + 6}px` }}
                      >
                        {LESSON_CONTENT.title}
                      </h4>
                      <p
                        className="text-text-primary font-medium mb-6"
                        style={{ fontSize: `${fontSizePx}px`, lineHeight: lineHeightVal }}
                      >
                        {LESSON_CONTENT.body}
                      </p>
                      <div
                        className="p-5 rounded-2xl bg-brand/5 border border-brand/30 text-center font-mono font-bold text-brand"
                        style={{ fontSize: `${fontSizePx}px` }}
                      >
                        {LESSON_CONTENT.equation}
                      </div>
                    </div>
                  )}

                  {/* ── AUDIO NARRATION WORD SYNC RENDER ── */}
                  {activeFeature === "screen-reader" && (
                    <AudioKaraokeNarration
                      isPlayingAudio={isPlayingAudio}
                      setIsPlayingAudio={setIsPlayingAudio}
                    />
                  )}

                  {/* ── INDIAN SIGN LANGUAGE (ISL) PROTOTYPE PLAYER RENDER ── */}
                  {activeFeature === "sign-language" && (
                    <IndianSignLanguagePlayer />
                  )}
                </div>

                <div
                  className={cn(
                    "mt-8 pt-4 border-t flex items-center justify-between text-xs",
                    activeFeature === "high-contrast"
                      ? "border-[#FFFF00]/30 text-[#FFFF00]"
                      : "border-border-secondary text-brand"
                  )}
                >
                  <span className="font-bold">✓ Active Feature: {activeModeObj.label}</span>
                  <span className="font-semibold">Drag handle left to compare standard view</span>
                </div>
              </div>
            </div>

            {/* ── 3. INTERACTIVE SLIDER SPLIT HANDLE BAR (GPU Accelerated) ── */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-brand via-sky-400 to-brand z-30 cursor-ew-resize pointer-events-none shadow-[0_0_12px_rgba(37,99,235,0.6)]"
              style={{ left: `${sliderPos}%`, willChange: "left" }}
            >
              {/* Handle Center Knob Circle */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-surface border-2 border-brand shadow-[var(--shadow-brand)] flex items-center justify-center text-brand pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* ════ BOTTOM INTERACTIVE CONTROLS BAR ════ */}
          <div className="p-6 border-t border-border-primary bg-surface flex flex-wrap items-center justify-between gap-4">
            {/* Left Status */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSliderPos(sliderPos === 50 ? 90 : 50)}
                className="px-3.5 py-1.5 rounded-xl border border-border-primary bg-muted/40 hover:border-brand/40 text-xs font-semibold text-text-secondary cursor-pointer transition-all font-[family-name:var(--font-display)]"
              >
                Reset Split (50/50)
              </button>

              <span className="text-xs font-bold text-text-tertiary">
                Slider: <span className="text-brand">{Math.round(sliderPos)}%</span>
              </span>
            </div>

            {/* Feature Customizer Sliders / Sub-controls */}
            <div className="flex flex-wrap items-center gap-4">
              {activeFeature === "large-text" && (
                <div className="flex items-center gap-3 bg-muted/40 px-3 py-1.5 rounded-xl border border-border-secondary text-xs">
                  <span className="font-bold text-text-secondary">Font Size:</span>
                  <input
                    type="range"
                    min={14}
                    max={26}
                    value={fontSizePx}
                    onChange={(e) => setFontSizePx(Number(e.target.value))}
                    className="w-24 accent-brand cursor-pointer"
                  />
                  <span className="font-mono font-bold text-brand">{fontSizePx}px</span>
                </div>
              )}

              {activeFeature === "color-blind" && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-text-secondary">Deficiency Filter:</span>
                  {(["deuteranopia", "protanopia", "tritanopia"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setColorBlindMode(type)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-bold capitalize text-[11px] cursor-pointer transition-all",
                        colorBlindMode === type
                          ? "bg-brand text-white"
                          : "bg-muted/50 text-text-secondary hover:bg-muted"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              {activeFeature === "screen-reader" && (
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 font-bold text-xs cursor-pointer hover:bg-rose-500/20"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPlayingAudio ? "Pause Audio" : "Play Narration"}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
