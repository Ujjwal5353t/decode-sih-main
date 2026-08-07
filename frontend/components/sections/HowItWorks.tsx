"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Camera, BookOpen, TrendingUp } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const steps = [
  {
    icon: Camera,
    number: "01",
    title: "Snap",
    description:
      "Take a photo of any textbook, worksheet, or handwritten notes. Our AI instantly extracts and understands the content.",
    accent: "var(--brand-primary)",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "Learn",
    description:
      "AI generates personalized lessons adapted to the child's language, learning pace, and cognitive needs.",
    accent: "var(--brand-accent)",
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "Grow",
    description:
      "Track progress with AI-driven insights. Parents receive voice updates. Teachers get actionable analytics.",
    accent: "var(--brand-sky)",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <SectionWrapper id="how-it-works" className="py-32">
      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-brand text-sm font-semibold uppercase tracking-widest mb-4
                     font-[family-name:var(--font-display)]"
          >
            How It Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight"
          >
            Three steps to{" "}
            <span className="gradient-text">better learning</span>
          </motion.h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] h-px"
               style={{ background: "var(--gradient-brand)" }}
               aria-hidden="true" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.2 + i * 0.15,
                  ease: [0.25, 0.4, 0, 1],
                }}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Icon circle */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative
                           shadow-[var(--shadow-md)] border border-border-primary"
                  style={{ background: `color-mix(in srgb, ${step.accent} 15%, var(--bg-surface))` }}
                >
                  <Icon
                    className="w-7 h-7"
                    style={{ color: step.accent }}
                  />
                  {/* Step number */}
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[11px] font-bold
                             text-white flex items-center justify-center font-[family-name:var(--font-display)]"
                    style={{ background: step.accent }}
                  >
                    {step.number}
                  </span>
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 font-[family-name:var(--font-display)]">
                  {step.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
