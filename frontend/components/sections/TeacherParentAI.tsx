"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  Users,
  Calendar,
  Lightbulb,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
}
 from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { useTranslation } from "@/hooks/useTranslation";

const insightCardDefs = [
  {
    id: "weakConcepts",
    icon: AlertTriangle,
    accent: "var(--brand-accent)",
  },
  {
    id: "aiSuggestions",
    icon: Users,
    accent: "var(--brand-primary)",
  },
  {
    id: "attendance",
    icon: Calendar,
    accent: "var(--brand-sky)",
  },
  {
    id: "lessonRecap",
    icon: Lightbulb,
    accent: "var(--brand-violet)",
  },
];

const masteryData = [
  { topic: "Cells", height: "45%" },
  { topic: "Energy", height: "65%" },
  { topic: "Photosynthesis", height: "85%", active: true },
  { topic: "Respiration", height: "55%" },
  { topic: "Fractions", height: "92%", active: true },
  { topic: "Decimals", height: "40%" },
  { topic: "Algebra", height: "70%" },
  { topic: "Geometry", height: "88%", active: true },
  { topic: "Gravity", height: "50%" },
];

export function TeacherParentAI() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeInsight, setActiveInsight] = useState<string>("weakConcepts");
  const { t } = useTranslation();

  return (
    <SectionWrapper id="teacher-parent" className="py-20 lg:py-26 overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 70% 50%, color-mix(in srgb, var(--brand-primary) 4%, transparent), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* ════ LEFT COLUMN: Heading & Insight Cards ════ */}
          <div className="lg:col-span-5">
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold
                         tracking-wider uppercase font-[family-name:var(--font-display)] mb-5 border"
              style={{
                borderColor: "var(--border-brand)",
                background: "color-mix(in srgb, var(--brand-primary) 6%, var(--bg-surface))",
                color: "var(--brand-primary)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              {t("teacherAI.badge")}
            </motion.div>

            {/* Main Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
              className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                       font-extrabold tracking-tight leading-[1.1] mb-4"
            >
              {t("teacherAI.title")}{" "}
              <span className="gradient-text">{t("teacherAI.titleHighlight")}</span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-base sm:text-lg leading-relaxed mb-6"
            >
              {t("teacherAI.subtitle")}
            </motion.p>

            {/* Insight Cards Stack */}
            <div className="space-y-2.5">
              {insightCardDefs.map((card, i) => {
                const Icon = card.icon;
                const isActive = activeInsight === card.id;

                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                    onClick={() => setActiveInsight(card.id)}
                    className={`p-4 sm:p-5 rounded-[var(--radius-xl)] border cursor-pointer
                               transition-all duration-300 flex items-start gap-4 ${
                                 isActive
                                   ? "bg-surface border-[var(--border-brand)] shadow-[var(--shadow-md)] ring-1 ring-brand/20"
                                   : "bg-surface/50 border-border-primary hover:border-border-brand hover:bg-surface"
                               }`}
                  >
                    <div
                      className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background:
                          "color-mix(in srgb, var(--brand-primary) 8%, var(--bg-surface))",
                      }}
                    >
                      <Icon className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary font-[family-name:var(--font-display)] mb-0.5">
                        {t(`teacherAI.insights.${card.id}.title`)}
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {t(`teacherAI.insights.${card.id}.subtitle`)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ════ RIGHT COLUMN: Teacher Analytics Dashboard Mock ════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 0.68, 0, 1] as const }}
            className="lg:col-span-7"
          >
            <div className="gradient-border rounded-[24px] bg-surface p-6 sm:p-8 shadow-[var(--shadow-xl)] border border-border-primary">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border-secondary">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg sm:text-xl text-text-primary font-[family-name:var(--font-display)]">
                      {t("teacherAI.dashboard.classHeader")}
                    </h3>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5 font-medium">
                    {t("teacherAI.dashboard.studentsWeek")}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 font-[family-name:var(--font-display)]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +12% WoW
                </span>
              </div>

              {/* Metric Summary Cards (3 columns) */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 my-6">
                <div className="p-4 rounded-[var(--radius-lg)] bg-muted/40 border border-border-secondary">
                  <span className="text-[10px] sm:text-xs font-semibold text-text-tertiary uppercase tracking-wider block mb-1 font-[family-name:var(--font-display)]">
                    {t("teacherAI.dashboard.mastery")}
                  </span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-primary font-[family-name:var(--font-display)]">
                    78%
                  </span>
                </div>
                <div className="p-4 rounded-[var(--radius-lg)] bg-muted/40 border border-border-secondary">
                  <span className="text-[10px] sm:text-xs font-semibold text-text-tertiary uppercase tracking-wider block mb-1 font-[family-name:var(--font-display)]">
                    {t("teacherAI.dashboard.attendance")}
                  </span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-primary font-[family-name:var(--font-display)]">
                    94%
                  </span>
                </div>
                <div className="p-4 rounded-[var(--radius-lg)] bg-muted/40 border border-border-secondary">
                  <span className="text-[10px] sm:text-xs font-semibold text-text-tertiary uppercase tracking-wider block mb-1 font-[family-name:var(--font-display)]">
                    {t("teacherAI.dashboard.atRisk")}
                  </span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-brand font-[family-name:var(--font-display)]">
                    4
                  </span>
                </div>
              </div>

              {/* Bar Chart Section */}
              <div className="p-5 rounded-[var(--radius-xl)] bg-muted/30 border border-border-secondary mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-text-secondary font-[family-name:var(--font-display)]">
                    {t("teacherAI.dashboard.conceptMastery")}
                  </span>
                  <span className="text-[11px] text-brand font-medium">
                    {t("teacherAI.dashboard.updatedToday")}
                  </span>
                </div>
                {/* Bar Chart Visualization */}
                <div className="h-32 flex items-end justify-between gap-1.5 sm:gap-2 pt-4 px-2">
                  {masteryData.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <motion.div
                        initial={{ height: "0%" }}
                        animate={isInView ? { height: item.height } : {}}
                        transition={{ duration: 1, delay: 0.5 + idx * 0.05, ease: "easeOut" }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          item.active
                            ? "bg-gradient-to-t from-brand-primary to-brand-light shadow-[var(--shadow-brand)]"
                            : "bg-border-primary/80 group-hover:bg-brand/30"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Row: Engagement Heatmap + AI Action Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Engagement Heatmap */}
                <div className="p-5 rounded-[var(--radius-xl)] bg-muted/30 border border-border-secondary flex flex-col justify-between">
                  <span className="text-xs font-semibold text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
                    {t("teacherAI.dashboard.engagementHeatmap")}
                  </span>
                  <div className="grid grid-cols-6 gap-1.5 my-auto">
                    {Array.from({ length: 30 }).map((_, idx) => {
                      const opacityLevel = ((idx * 7 + 13) % 100) / 100 * 0.75 + 0.25;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={isInView ? { opacity: opacityLevel, scale: 1 } : {}}
                          transition={{ delay: 0.6 + idx * 0.01 }}
                          className="h-5 rounded-md bg-brand"
                        />
                      );
                    })}
                  </div>
                </div>

                {/* AI Action Card */}
                <div
                  className="p-5 rounded-[var(--radius-xl)] text-white flex flex-col justify-between shadow-[var(--shadow-brand)] relative overflow-hidden"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 uppercase tracking-wider mb-2 font-[family-name:var(--font-display)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("teacherAI.dashboard.aiActionCard")}
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white leading-snug my-2 font-[family-name:var(--font-display)]">
                    {t("teacherAI.dashboard.aiActionMsg")}
                  </p>
                  <button className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:underline mt-3 cursor-pointer font-[family-name:var(--font-display)]">
                    {t("teacherAI.dashboard.assignNow")}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  );
}
