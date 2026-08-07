"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Eye, Type, Focus, Contrast } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { cn } from "@/lib/utils";

type AccessibilityMode = "standard" | "dyslexia" | "adhd" | "highContrast";

const modes: { id: AccessibilityMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: "standard", label: "Standard", icon: Eye, description: "Default reading experience" },
  { id: "dyslexia", label: "Dyslexia Mode", icon: Type, description: "OpenDyslexic font, wider spacing" },
  { id: "adhd", label: "ADHD Focus", icon: Focus, description: "Reduced distractions, focus highlight" },
  { id: "highContrast", label: "High Contrast", icon: Contrast, description: "Enhanced color contrast" },
];

const sampleText = {
  title: "Chapter 3: The Water Cycle",
  content: "Water continuously moves through the environment in a process called the water cycle. The sun heats water in oceans, lakes, and rivers, causing it to evaporate into water vapor. This vapor rises into the atmosphere where it cools and condenses into tiny droplets, forming clouds.",
  highlight: "The three main stages are: evaporation, condensation, and precipitation.",
};

const modeStyles: Record<AccessibilityMode, { bg: string; text: string; font: string; spacing: string; titleSize: string; border: string }> = {
  standard: {
    bg: "bg-surface",
    text: "text-text-primary",
    font: "font-[family-name:var(--font-body)]",
    spacing: "leading-relaxed tracking-normal",
    titleSize: "text-xl",
    border: "border-border-primary",
  },
  dyslexia: {
    bg: "bg-[#FFF8E7]",
    text: "text-[#1a1a1a]",
    font: "font-[family-name:var(--font-body)]",
    spacing: "leading-loose tracking-wide",
    titleSize: "text-2xl",
    border: "border-[#E8D9B0]",
  },
  adhd: {
    bg: "bg-surface",
    text: "text-text-tertiary",
    font: "font-[family-name:var(--font-body)]",
    spacing: "leading-relaxed",
    titleSize: "text-xl",
    border: "border-brand",
  },
  highContrast: {
    bg: "bg-[#000000]",
    text: "text-[#FFFFFF]",
    font: "font-[family-name:var(--font-body)] font-bold",
    spacing: "leading-relaxed tracking-wide",
    titleSize: "text-2xl",
    border: "border-[#FFFF00]",
  },
};

export function AccessibilitySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [mode, setMode] = useState<AccessibilityMode>("standard");
  const styles = modeStyles[mode];

  return (
    <SectionWrapper id="accessibility" className="py-32">
      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-brand text-sm font-semibold uppercase tracking-widest mb-4
                     font-[family-name:var(--font-display)]"
          >
            Accessibility First
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight"
          >
            Education without{" "}
            <span className="gradient-text">barriers</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto"
          >
            Toggle between modes to see how content adapts for different learning needs.
          </motion.p>
        </div>

        {/* Mode toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <motion.button
                key={m.id}
                onClick={() => setMode(m.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-3 rounded-[var(--radius-lg)] text-sm font-medium",
                  "transition-all duration-300 cursor-pointer border",
                  "font-[family-name:var(--font-display)]",
                  isActive
                    ? "bg-brand text-white border-brand shadow-[var(--shadow-brand)]"
                    : "bg-surface border-border-primary text-text-secondary hover:border-border-brand"
                )}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <motion.div
            layout
            className={cn(
              "p-8 md:p-10 rounded-[var(--radius-xl)] border-2 transition-all duration-500",
              "shadow-[var(--shadow-lg)]",
              styles.bg,
              styles.border
            )}
          >
            <motion.h3
              layout
              className={cn(
                "font-bold mb-4 font-[family-name:var(--font-display)]",
                styles.text,
                styles.titleSize
              )}
            >
              {sampleText.title}
            </motion.h3>
            <motion.p
              layout
              className={cn(
                "mb-4 text-base",
                styles.text,
                styles.font,
                styles.spacing,
                mode === "adhd" ? "opacity-40" : "opacity-100"
              )}
            >
              {sampleText.content}
            </motion.p>
            <motion.p
              layout
              className={cn(
                "text-base font-semibold p-4 rounded-[var(--radius-md)]",
                styles.font,
                styles.spacing,
                mode === "adhd"
                  ? "text-text-primary bg-brand/10 border-2 border-brand opacity-100"
                  : mode === "highContrast"
                  ? "text-[#000] bg-[#FFFF00]"
                  : mode === "dyslexia"
                  ? "text-[#1a1a1a] bg-[#FFE4B5]"
                  : "text-brand bg-brand/5"
              )}
            >
              {sampleText.highlight}
            </motion.p>

            {/* Mode description */}
            <div className="mt-6 pt-4 border-t border-current/10 flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-wider",
                  mode === "highContrast" ? "text-[#FFFF00]" : "text-brand"
                )}
              >
                {modes.find((m) => m.id === mode)?.description}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
