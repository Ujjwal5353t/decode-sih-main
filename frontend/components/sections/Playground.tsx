"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  Eye,
  Globe,
  Sparkles,
  Type,
  AlignJustify,
  Minus,
  Contrast,
  ChevronRight,
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { GradientBlob } from "@/components/shared/GradientBlob";
import { cn } from "@/lib/utils";

type Tab = "accessibility" | "language" | "ai-lesson";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "accessibility", label: "Try Accessibility", icon: Eye },
  { id: "language", label: "Try Languages", icon: Globe },
  { id: "ai-lesson", label: "Try AI Lesson", icon: Sparkles },
];

const languages = [
  { code: "en", label: "English", sample: "The sun is the closest star to Earth. It gives us light and heat." },
  { code: "hi", label: "हिन्दी", sample: "सूर्य पृथ्वी का सबसे निकटतम तारा है। यह हमें प्रकाश और ऊष्मा देता है।" },
  { code: "ta", label: "தமிழ்", sample: "சூரியன் பூமிக்கு மிக அருகில் உள்ள நட்சத்திரம். இது நமக்கு ஒளியையும் வெப்பத்தையும் தருகிறது." },
  { code: "bn", label: "বাংলা", sample: "সূর্য পৃথিবীর নিকটতম তারা। এটি আমাদের আলো এবং তাপ দেয়।" },
  { code: "mr", label: "मराठी", sample: "सूर्य हा पृथ्वीचा सर्वात जवळचा तारा आहे. तो आपल्याला प्रकाश आणि उष्णता देतो." },
];

const aiLessonSteps = [
  "🔍 Analyzing topic: \"Photosynthesis\"",
  "📚 Matching curriculum: CBSE Grade 6",
  "🧠 Adapting to learning profile...",
  "🎨 Generating visual aids...",
  "📝 Creating practice questions...",
  "✅ Lesson ready!",
];

export function Playground() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<Tab>("accessibility");

  // Accessibility state
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [lineSpacing, setLineSpacing] = useState(false);
  const [readingRuler, setReadingRuler] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Language state
  const [selectedLang, setSelectedLang] = useState("en");

  // AI lesson state
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(-1);
  const [lessonReady, setLessonReady] = useState(false);

  const startGeneration = () => {
    setGenerating(true);
    setLessonReady(false);
    setGenerationStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= aiLessonSteps.length) {
        clearInterval(interval);
        setGenerating(false);
        setLessonReady(true);
      }
      setGenerationStep(step);
    }, 600);
  };

  const sampleText = languages.find((l) => l.code === selectedLang)?.sample || languages[0].sample;

  return (
    <SectionWrapper id="playground" className="py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <GradientBlob color="brand" size="lg" className="bottom-0 right-0 opacity-10" />
        <GradientBlob color="sky" size="md" className="top-[20%] left-0 opacity-10" />
      </div>

      <div className="max-w-5xl mx-auto px-6" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-brand text-sm font-semibold uppercase tracking-widest mb-4
                     font-[family-name:var(--font-display)]"
          >
            Interactive Playground
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight"
          >
            Experience it{" "}
            <span className="gradient-text">yourself</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto"
          >
            Try our accessibility features, language support, and AI lesson generation right here.
          </motion.p>
        </div>

        {/* Playground Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="gradient-border rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-xl)]"
        >
          {/* Tabs */}
          <div className="flex border-b border-border-primary bg-surface/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium",
                    "transition-all duration-200 cursor-pointer relative",
                    "font-[family-name:var(--font-display)]",
                    isActive
                      ? "text-brand"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="playground-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 bg-surface min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* Accessibility Tab */}
              {activeTab === "accessibility" && (
                <motion.div
                  key="accessibility"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8"
                >
                  {/* Controls */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary font-[family-name:var(--font-display)]">
                      Toggle Features
                    </h4>
                    {[
                      { label: "Dyslexia Font", icon: Type, state: dyslexiaFont, toggle: () => setDyslexiaFont(!dyslexiaFont) },
                      { label: "Line Spacing", icon: AlignJustify, state: lineSpacing, toggle: () => setLineSpacing(!lineSpacing) },
                      { label: "Reading Ruler", icon: Minus, state: readingRuler, toggle: () => setReadingRuler(!readingRuler) },
                      { label: "High Contrast", icon: Contrast, state: highContrast, toggle: () => setHighContrast(!highContrast) },
                    ].map((toggle) => {
                      const Icon = toggle.icon;
                      return (
                        <button
                          key={toggle.label}
                          onClick={toggle.toggle}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)]",
                            "text-sm font-medium transition-all duration-200 cursor-pointer border",
                            toggle.state
                              ? "bg-brand/10 border-brand text-brand"
                              : "bg-muted/50 border-border-secondary text-text-secondary hover:border-border-primary"
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {toggle.label}
                          <div className={cn(
                            "ml-auto w-8 h-5 rounded-full relative transition-colors duration-200",
                            toggle.state ? "bg-brand" : "bg-border-primary"
                          )}>
                            <motion.div
                              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                              animate={{ left: toggle.state ? "14px" : "2px" }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Preview */}
                  <div
                    className={cn(
                      "p-6 rounded-[var(--radius-lg)] border transition-all duration-300 relative overflow-hidden",
                      highContrast
                        ? "bg-[#000] border-[#FFFF00] text-[#FFF]"
                        : "bg-muted/30 border-border-secondary"
                    )}
                  >
                    {readingRuler && (
                      <div className="absolute left-0 right-0 h-8 bg-brand/10 border-y border-brand/20 top-[40%] pointer-events-none" />
                    )}
                    <h3
                      className={cn(
                        "text-lg font-bold mb-3 font-[family-name:var(--font-display)]",
                        highContrast ? "text-[#FFFF00]" : "text-text-primary"
                      )}
                    >
                      The Solar System
                    </h3>
                    <p
                      className={cn(
                        "text-sm transition-all duration-300",
                        dyslexiaFont ? "tracking-wider font-medium" : "",
                        lineSpacing ? "leading-[2.2]" : "leading-relaxed",
                        highContrast ? "text-[#FFF] font-bold" : "text-text-secondary"
                      )}
                    >
                      Our solar system consists of the Sun and everything that orbits around it,
                      including eight planets, dwarf planets, moons, asteroids, and comets.
                      The four inner planets — Mercury, Venus, Earth, and Mars — are called
                      terrestrial planets because they have solid, rocky surfaces.
                    </p>
                    <p
                      className={cn(
                        "text-sm mt-4 transition-all duration-300",
                        dyslexiaFont ? "tracking-wider font-medium" : "",
                        lineSpacing ? "leading-[2.2]" : "leading-relaxed",
                        highContrast ? "text-[#FFF] font-bold" : "text-text-secondary"
                      )}
                    >
                      The four outer planets — Jupiter, Saturn, Uranus, and Neptune — are called
                      gas giants because they are much larger and made primarily of gases.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Language Tab */}
              {activeTab === "language" && (
                <motion.div
                  key="language"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <h4 className="text-sm font-semibold text-text-primary mb-4 font-[family-name:var(--font-display)]">
                    Select a language
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {languages.map((lang) => (
                      <motion.button
                        key={lang.code}
                        onClick={() => setSelectedLang(lang.code)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium cursor-pointer",
                          "transition-all duration-200 border",
                          "font-[family-name:var(--font-display)]",
                          selectedLang === lang.code
                            ? "bg-brand text-white border-brand"
                            : "bg-muted/50 border-border-secondary text-text-secondary hover:border-brand"
                        )}
                      >
                        {lang.label}
                      </motion.button>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedLang}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-6 rounded-[var(--radius-lg)] bg-muted/30 border border-border-secondary"
                    >
                      <p className="text-lg leading-relaxed text-text-primary">
                        {sampleText}
                      </p>
                      <p className="mt-4 text-xs text-text-tertiary">
                        Same content, automatically translated to{" "}
                        {languages.find((l) => l.code === selectedLang)?.label}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}

              {/* AI Lesson Tab */}
              {activeTab === "ai-lesson" && (
                <motion.div
                  key="ai-lesson"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="text-center mb-8">
                    <h4 className="text-sm font-semibold text-text-primary mb-2 font-[family-name:var(--font-display)]">
                      Generate an AI Lesson
                    </h4>
                    <p className="text-sm text-text-secondary mb-6">
                      Click to simulate how AI creates a personalized lesson
                    </p>

                    {!generating && !lessonReady && (
                      <motion.button
                        onClick={startGeneration}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-[var(--radius-lg)]
                                 text-white font-semibold cursor-pointer
                                 font-[family-name:var(--font-display)]"
                        style={{ background: "var(--gradient-brand)" }}
                      >
                        <Sparkles className="w-5 h-5" />
                        Generate Lesson: Photosynthesis
                      </motion.button>
                    )}
                  </div>

                  {/* Generation steps */}
                  {(generating || lessonReady) && (
                    <div className="space-y-3 max-w-md mx-auto">
                      {aiLessonSteps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={
                            i <= generationStep
                              ? { opacity: 1, x: 0 }
                              : { opacity: 0, x: -20 }
                          }
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-[var(--radius-md)] border",
                            i <= generationStep
                              ? "bg-brand/5 border-brand/20"
                              : "bg-muted/30 border-border-secondary"
                          )}
                        >
                          <span className="text-sm">{step}</span>
                          {i <= generationStep && i < aiLessonSteps.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-brand ml-auto" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Lesson preview */}
                  {lessonReady && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-8 p-6 rounded-[var(--radius-lg)] border border-brand/20 bg-brand/5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-brand" />
                        <span className="text-sm font-semibold text-brand font-[family-name:var(--font-display)]">
                          AI-Generated Lesson Preview
                        </span>
                      </div>
                      <h4 className="font-bold text-lg mb-2 font-[family-name:var(--font-display)]">
                        🌱 Photosynthesis — Grade 6
                      </h4>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        Plants are like tiny food factories! They use sunlight as energy,
                        drink water through their roots, and breathe in carbon dioxide from the air.
                        With all three ingredients, they cook up glucose (their food!) and release
                        oxygen for us to breathe. Amazing, right?
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["Visual Diagram", "Interactive Quiz", "Key Terms", "Practice Problems"].map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand
                                     font-[family-name:var(--font-display)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <motion.button
                        onClick={() => {
                          setGenerating(false);
                          setLessonReady(false);
                          setGenerationStep(-1);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-6 px-6 py-2 rounded-[var(--radius-md)] bg-brand text-white text-sm
                                 font-semibold cursor-pointer font-[family-name:var(--font-display)]"
                      >
                        Try Again
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
