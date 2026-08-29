"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  UserPlus,
  ClipboardCheck,
  Sparkles,
  GraduationCap,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { useTranslation } from "@/hooks/useTranslation";

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const { t } = useTranslation();

  const timelineSteps = [
    {
      number: 1,
      title: t("howItWorks.steps.0.title"),
      description: t("howItWorks.steps.0.desc"),
      icon: UserPlus,
      badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-600",
      gradient: "var(--gradient-brand)",
    },
    {
      number: 2,
      title: t("howItWorks.steps.1.title"),
      description: t("howItWorks.steps.1.desc"),
      icon: ClipboardCheck,
      badgeBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-600",
      gradient: "var(--gradient-cyan)",
    },
    {
      number: 3,
      title: t("howItWorks.steps.2.title"),
      description: t("howItWorks.steps.2.desc"),
      icon: Sparkles,
      badgeBg: "bg-violet-500/10 border-violet-500/20 text-violet-600",
      gradient: "var(--gradient-violet)",
    },
    {
      number: 4,
      title: t("howItWorks.steps.3.title"),
      description: t("howItWorks.steps.3.desc"),
      icon: GraduationCap,
      badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
      gradient: "var(--gradient-emerald)",
    },
    {
      number: 5,
      title: t("howItWorks.steps.4.title"),
      description: t("howItWorks.steps.4.desc"),
      icon: BarChart3,
      badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-600",
      gradient: "var(--gradient-amber)",
    },
    {
      number: 6,
      title: t("howItWorks.steps.5.title"),
      description: t("howItWorks.steps.5.desc"),
      icon: MessageSquare,
      badgeBg: "bg-rose-500/10 border-rose-500/20 text-rose-600",
      gradient: "var(--gradient-rose)",
    },
  ];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 80%"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <SectionWrapper id="how-it-works" className="py-20 lg:py-26 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6" ref={containerRef}>
        {/* Section Header */}
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
            {t("howItWorks.badge")}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight leading-[1.15]"
          >
            {t("howItWorks.title")}{" "}
            <span className="gradient-text">{t("howItWorks.titleHighlight")}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-text-secondary text-base sm:text-lg"
          >
            {t("howItWorks.subtitle")}
          </motion.p>
        </div>

        {/* Vertical Timeline Container */}
        <div className="relative">
          {/* Central Connecting Line (Background Track) */}
          <div
            className="absolute left-6 md:left-1/2 top-4 bottom-4 w-[2px] -translate-x-1/2 bg-border-primary"
            aria-hidden="true"
          />

          {/* Animated Line Fill on Scroll */}
          <motion.div
            className="absolute left-6 md:left-1/2 top-4 w-[2px] -translate-x-1/2 origin-top rounded-full"
            style={{
              height: lineHeight,
              background: "var(--gradient-brand)",
              boxShadow: "0 0 12px rgba(37, 99, 235, 0.4)",
            }}
            aria-hidden="true"
          />

          {/* 6 Alternating Steps with Spaced Out Vertical Timeline */}
          <div className="space-y-10 md:space-y-14 relative">
            {timelineSteps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 !== 0;

              return (
                <div
                  key={step.number}
                  className={`relative flex flex-col md:flex-row items-start md:items-center ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Card Content Side */}
                  <div
                    className={`w-full md:w-1/2 ${
                      isEven
                        ? "pl-16 md:pl-10 lg:pl-14 md:pr-0"
                        : "pl-16 md:pr-10 lg:pr-14 md:pl-0"
                    }`}
                  >
                    <motion.div
                      initial={{
                        opacity: 0,
                        x: isEven ? 30 : -30,
                        y: 16,
                      }}
                      whileInView={{ opacity: 1, x: 0, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.08,
                        ease: [0.22, 0.68, 0, 1] as const,
                      }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="card-premium p-6 sm:p-7 rounded-[var(--radius-xl)] bg-surface border border-border-primary
                                shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-brand/40
                                transition-all duration-300 relative group overflow-hidden text-left"
                    >
                      {/* Subtle hover gradient background */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(ellipse at top left, color-mix(in srgb, var(--brand-primary) 5%, transparent), transparent 70%)",
                        }}
                      />

                      {/* Header with Icon */}
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs transition-colors duration-300 ${step.badgeBg}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest font-[family-name:var(--font-display)]">
                          Step 0{step.number}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold mb-1.5 text-text-primary font-[family-name:var(--font-display)] relative z-10">
                        {step.title}
                      </h3>
                      <p className="text-text-secondary text-xs sm:text-sm leading-relaxed relative z-10">
                        {step.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* Number Badge Node (Centered on central line) */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-6 md:top-1/2 md:-translate-y-1/2 z-20">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                        delay: index * 0.08,
                      }}
                      whileHover={{ scale: 1.15, transition: { duration: 0.15 } }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs
                                font-[family-name:var(--font-display)] shadow-[var(--shadow-brand)]
                                border-2 border-surface cursor-pointer"
                      style={{ background: step.gradient }}
                    >
                      {step.number}
                    </motion.div>
                  </div>

                  {/* Empty Spacer Side for desktop balance */}
                  <div className="hidden md:block w-1/2" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
