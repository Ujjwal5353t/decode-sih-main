"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Camera, FileText, BookOpen, CheckCircle } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const steps = [
  {
    icon: Camera,
    title: "Capture",
    subtitle: "Point camera at textbook",
    content: [
      "Chapter 5: Photosynthesis",
      "Plants use sunlight, water, and carbon dioxide",
      "to produce glucose and oxygen.",
      "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
    ],
  },
  {
    icon: FileText,
    title: "Extract",
    subtitle: "AI reads & understands",
    content: [
      "✓ Topic: Photosynthesis",
      "✓ Grade Level: 6th Standard",
      "✓ Key Concepts: 4 identified",
      "✓ Formula: 1 detected",
    ],
  },
  {
    icon: BookOpen,
    title: "Generate",
    subtitle: "Interactive lesson created",
    content: [
      "🌱 What is Photosynthesis?",
      "📊 Visual diagram of the process",
      "🧪 Interactive equation builder",
      "📝 Practice quiz: 5 questions",
    ],
  },
  {
    icon: CheckCircle,
    title: "Learn",
    subtitle: "Adapted to your needs",
    content: [
      "🗣️ Available in Hindi, Tamil, Bengali",
      "📖 Dyslexia-friendly format",
      "🎮 Gamified quiz ready",
      "📱 Saved for offline access",
    ],
  },
];

export function SnapAndLearn() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <SectionWrapper id="snap-learn" className="py-20 lg:py-26 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-brand text-sm font-semibold uppercase tracking-[0.2em] mb-4
                     font-[family-name:var(--font-display)]"
          >
            Snap & Learn
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.68, 0, 1] }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight"
          >
            From textbook to{" "}
            <span className="gradient-text">interactive lesson</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-text-secondary text-base sm:text-lg max-w-2xl mx-auto"
          >
            Just point your camera. AI does the rest.
          </motion.p>
        </div>

        {/* Demo area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Step indicators */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-3"
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === activeStep;

              return (
                <motion.button
                  key={step.title}
                  onClick={() => setActiveStep(i)}
                  className={`w-full flex items-start gap-4 p-5 rounded-[var(--radius-xl)] text-left
                            transition-all duration-300 cursor-pointer border relative overflow-hidden
                            ${isActive
                              ? "border-[var(--border-brand)] shadow-[var(--shadow-md)] bg-surface"
                              : "border-transparent hover:border-border-primary bg-transparent"}`}
                >
                  {/* Active background glow */}
                  {isActive && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "radial-gradient(ellipse at left center, color-mix(in srgb, var(--brand-primary) 5%, transparent), transparent 70%)",
                      }}
                    />
                  )}

                  <div
                    className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0
                              transition-all duration-300 relative z-10"
                    style={{
                      background: isActive
                        ? "var(--gradient-brand)"
                        : "var(--bg-muted)",
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{
                        color: isActive ? "white" : "var(--text-secondary)",
                      }}
                    />
                  </div>
                  <div className="relative z-10">
                    <h3 className={`font-bold font-[family-name:var(--font-display)] text-base
                                  ${isActive ? "text-text-primary" : "text-text-secondary"}`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-tertiary mt-0.5">
                      {step.subtitle}
                    </p>
                  </div>

                  {/* Progress bar */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-[2px] rounded-full"
                      style={{ background: "var(--gradient-brand)" }}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3.5, ease: "linear" }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Right: Preview card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className="gradient-border p-8 rounded-[var(--radius-xl)] bg-surface
                          shadow-[var(--shadow-lg)] min-h-[320px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    <span className="text-xs font-semibold text-brand uppercase tracking-wider
                                   font-[family-name:var(--font-display)]">
                      Step {activeStep + 1}: {steps[activeStep].title}
                    </span>
                  </div>

                  {/* Content lines */}
                  <div className="space-y-3">
                    {steps[activeStep].content.map((line, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: j * 0.1 }}
                        className="flex items-center gap-3 p-3.5 rounded-[var(--radius-md)]
                                 bg-muted/50 border border-border-secondary
                                 hover:border-[var(--border-brand)] transition-colors duration-200"
                      >
                        <span className="text-sm text-text-primary font-mono">
                          {line}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Decorative offset border */}
            <div className="absolute -z-10 -top-3 -right-3 w-full h-full rounded-[var(--radius-xl)]
                          border border-[var(--border-brand)] opacity-20"
                 aria-hidden="true" />
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  );
}
