"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
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
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const features = [
  {
    icon: Brain,
    title: "Adaptive Learning",
    description: "AI adjusts difficulty, pace, and teaching style in real-time based on each child's unique learning patterns.",
    size: "large" as const,
    accent: "var(--brand-primary)",
  },
  {
    icon: Camera,
    title: "Snap & Learn",
    description: "Point your camera at any textbook page — AI extracts content and creates interactive lessons instantly.",
    size: "small" as const,
    accent: "var(--brand-accent)",
  },
  {
    icon: Globe,
    title: "50+ Regional Languages",
    description: "Learn in Hindi, Tamil, Bengali, Marathi, or any of 50+ supported regional languages.",
    size: "small" as const,
    accent: "var(--brand-sky)",
  },
  {
    icon: WifiOff,
    title: "Offline-First",
    description: "Download lessons once, learn anywhere. No internet required after initial sync.",
    size: "small" as const,
    accent: "var(--brand-success)",
  },
  {
    icon: Accessibility,
    title: "Accessibility Suite",
    description: "Dyslexia-friendly fonts, ADHD focus modes, high-contrast themes, and screen reader optimized content.",
    size: "large" as const,
    accent: "var(--brand-rose)",
  },
  {
    icon: Gamepad2,
    title: "Gamified Learning",
    description: "XP points, streak rewards, leaderboards, and achievement badges that make learning addictive.",
    size: "small" as const,
    accent: "var(--brand-accent)",
  },
  {
    icon: GraduationCap,
    title: "Teacher AI Assistant",
    description: "Automated lesson planning, smart grading, and personalized student insights.",
    size: "small" as const,
    accent: "var(--brand-primary)",
  },
  {
    icon: Mic,
    title: "Parent Voice Updates",
    description: "AI-generated audio summaries of your child's progress — in your language.",
    size: "small" as const,
    accent: "var(--brand-sky)",
  },
  {
    icon: Sparkles,
    title: "AI-Generated Lessons",
    description: "Personalized lesson content created by AI, tailored to curriculum and learning goals.",
    size: "small" as const,
    accent: "var(--brand-secondary)",
  },
];

export function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <SectionWrapper id="features" className="py-32">
      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-brand text-sm font-semibold uppercase tracking-widest mb-4
                     font-[family-name:var(--font-display)]"
          >
            Built For Everyone
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight"
          >
            Features that make a{" "}
            <span className="gradient-text">real difference</span>
          </motion.h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const isLarge = feature.size === "large";

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: 0.15 + i * 0.06,
                  ease: [0.25, 0.4, 0, 1],
                }}
                whileHover={{
                  y: -4,
                  scale: 1.01,
                  transition: { duration: 0.2 },
                }}
                className={`relative p-7 rounded-[var(--radius-xl)] bg-surface border border-border-primary
                          shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-border-brand
                          transition-all duration-300 group overflow-hidden cursor-default
                          ${isLarge ? "md:col-span-2 lg:col-span-2" : ""}`}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(ellipse at top left, color-mix(in srgb, ${feature.accent} 5%, transparent), transparent 70%)`,
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center mb-5
                             border border-border-secondary"
                    style={{
                      background: `color-mix(in srgb, ${feature.accent} 10%, var(--bg-surface))`,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: feature.accent }}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold mb-2 font-[family-name:var(--font-display)]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
