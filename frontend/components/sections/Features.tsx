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
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface FeatureItem {
  id: string;
  icon: any;
  titleKey: string;
  descKey: string;
  badgeKey: string;
  span: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

const featureDefs: FeatureItem[] = [
  {
    id: "adaptive-learning",
    icon: Brain,
    titleKey: "features.items.adaptive.title",
    descKey: "features.items.adaptive.desc",
    badgeKey: "features.items.adaptive.badge",
    span: "lg:col-span-2 lg:row-span-1",
    colorBg: "bg-brand/10",
    colorBorder: "border-brand/20",
    colorText: "text-brand",
  },
  {
    id: "snap-learn",
    icon: Camera,
    titleKey: "features.items.snap.title",
    descKey: "features.items.snap.desc",
    badgeKey: "features.items.snap.badge",
    span: "lg:col-span-1 lg:row-span-1",
    colorBg: "bg-cyan-500/10",
    colorBorder: "border-cyan-500/20",
    colorText: "text-cyan-600",
  },
  {
    id: "languages",
    icon: Globe,
    titleKey: "features.items.languages.title",
    descKey: "features.items.languages.desc",
    badgeKey: "features.items.languages.badge",
    span: "lg:col-span-1 lg:row-span-1",
    colorBg: "bg-emerald-500/10",
    colorBorder: "border-emerald-500/20",
    colorText: "text-emerald-600",
  },
  {
    id: "accessibility",
    icon: Accessibility,
    titleKey: "features.items.accessibility.title",
    descKey: "features.items.accessibility.desc",
    badgeKey: "features.items.accessibility.badge",
    span: "lg:col-span-2 lg:row-span-1",
    colorBg: "bg-violet-500/10",
    colorBorder: "border-violet-500/20",
    colorText: "text-violet-600",
  },
  {
    id: "offline-first",
    icon: WifiOff,
    titleKey: "features.items.offline.title",
    descKey: "features.items.offline.desc",
    badgeKey: "features.items.offline.badge",
    span: "lg:col-span-1 lg:row-span-1",
    colorBg: "bg-emerald-500/10",
    colorBorder: "border-emerald-500/20",
    colorText: "text-emerald-600",
  },
  {
    id: "gamified",
    icon: Gamepad2,
    titleKey: "features.items.gamified.title",
    descKey: "features.items.gamified.desc",
    badgeKey: "features.items.gamified.badge",
    span: "lg:col-span-1 lg:row-span-1",
    colorBg: "bg-amber-500/10",
    colorBorder: "border-amber-500/20",
    colorText: "text-amber-600",
  },
  {
    id: "teacher-assistant",
    icon: GraduationCap,
    titleKey: "features.items.teacherAssistant.title",
    descKey: "features.items.teacherAssistant.desc",
    badgeKey: "features.items.teacherAssistant.badge",
    span: "lg:col-span-1 lg:row-span-1",
    colorBg: "bg-brand/10",
    colorBorder: "border-brand/20",
    colorText: "text-brand",
  },
  {
    id: "parent-voice",
    icon: Mic,
    titleKey: "features.items.parentVoice.title",
    descKey: "features.items.parentVoice.desc",
    badgeKey: "features.items.parentVoice.badge",
    span: "lg:col-span-1 lg:row-span-1",
    colorBg: "bg-rose-500/10",
    colorBorder: "border-rose-500/20",
    colorText: "text-rose-600",
  },
  {
    id: "ai-lessons",
    icon: Sparkles,
    titleKey: "features.items.aiLessons.title",
    descKey: "features.items.aiLessons.desc",
    badgeKey: "features.items.aiLessons.badge",
    span: "lg:col-span-1 lg:row-span-1",
    colorBg: "bg-violet-500/10",
    colorBorder: "border-violet-500/20",
    colorText: "text-violet-600",
  },
];

function FeatureCard({
  feature,
  idx,
  isInView,
}: {
  feature: FeatureItem;
  idx: number;
  isInView: boolean;
}) {
  const { t } = useTranslation();
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: 0.1 + idx * 0.04,
        ease: [0.22, 0.68, 0, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-[28px] bg-surface border border-border-primary",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-brand/40",
        "p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all duration-300",
        feature.span
      )}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top left, color-mix(in srgb, var(--brand-primary) 6%, transparent), transparent 70%)",
        }}
      />

      <div className="relative z-10">
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
            {t(feature.badgeKey)}
          </span>
        </div>

        <h3 className="text-xl font-bold mb-2 text-text-primary font-[family-name:var(--font-display)]">
          {t(feature.titleKey)}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {t(feature.descKey)}
        </p>
      </div>
    </motion.div>
  );
}

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const { t } = useTranslation();

  return (
    <SectionWrapper id="features" className="py-20 lg:py-26 overflow-hidden">
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
            {t("features.badge")}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight leading-[1.15]"
          >
            {t("features.title")} <span className="gradient-text">{t("features.titleHighlight")}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-text-secondary text-base sm:text-lg"
          >
            {t("features.subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureDefs.map((feature, idx) => (
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
