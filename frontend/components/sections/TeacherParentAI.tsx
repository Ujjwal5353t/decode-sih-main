"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  GraduationCap,
  Mic,
  BookOpen,
  BarChart3,
  ClipboardCheck,
  Volume2,
  LineChart,
  Bell,
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const teacherFeatures = [
  { icon: BookOpen, label: "Auto Lesson Plans" },
  { icon: ClipboardCheck, label: "Smart Grading" },
  { icon: BarChart3, label: "Student Analytics" },
  { icon: LineChart, label: "Progress Reports" },
];

const parentFeatures = [
  { icon: Volume2, label: "Voice Summaries" },
  { icon: Bell, label: "Daily Updates" },
  { icon: BarChart3, label: "Performance Trends" },
  { icon: Mic, label: "In Your Language" },
];

export function TeacherParentAI() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <SectionWrapper id="teacher-parent" className="py-32">
      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-brand text-sm font-semibold uppercase tracking-widest mb-4
                     font-[family-name:var(--font-display)]"
          >
            For Teachers & Parents
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight"
          >
            AI that empowers{" "}
            <span className="gradient-text">the whole ecosystem</span>
          </motion.h2>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teacher Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative p-8 rounded-[var(--radius-xl)] bg-surface border border-border-primary
                     shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-xl)] hover:border-border-brand
                     transition-all duration-300 group overflow-hidden"
          >
            {/* Accent gradient */}
            <div
              className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "var(--gradient-brand)" }}
              aria-hidden="true"
            />

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center
                           bg-brand/10 border border-brand/20">
                <GraduationCap className="w-7 h-7 text-brand" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-display)]">
                  Teacher AI Assistant
                </h3>
                <p className="text-sm text-text-secondary">
                  Your intelligent teaching co-pilot
                </p>
              </div>
            </div>

            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Automate lesson planning, grade assignments with AI insights,
              and get personalized recommendations for each student&apos;s growth.
            </p>

            {/* Mini features */}
            <div className="grid grid-cols-2 gap-3">
              {teacherFeatures.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={feat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)]
                             bg-muted/50 border border-border-secondary text-sm"
                  >
                    <Icon className="w-4 h-4 text-brand shrink-0" />
                    <span className="text-text-secondary font-medium text-xs">
                      {feat.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Parent Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative p-8 rounded-[var(--radius-xl)] bg-surface border border-border-primary
                     shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-xl)] hover:border-border-brand
                     transition-all duration-300 group overflow-hidden"
          >
            {/* Accent gradient */}
            <div
              className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "var(--gradient-warm)" }}
              aria-hidden="true"
            />

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center
                           bg-accent/10 border border-accent/20">
                <Mic className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-display)]">
                  Parent Voice Updates
                </h3>
                <p className="text-sm text-text-secondary">
                  Stay connected to your child&apos;s progress
                </p>
              </div>
            </div>

            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Receive daily AI-generated voice summaries of your child&apos;s learning journey —
              in your preferred language, delivered as simple audio messages.
            </p>

            {/* Waveform visualization */}
            <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-muted/50 border border-border-secondary">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Daily Summary</p>
                  <p className="text-[10px] text-text-tertiary">Today at 6:00 PM</p>
                </div>
              </div>
              {/* Animated waveform bars */}
              <div className="flex items-center gap-[3px] h-8">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-accent/60"
                    animate={{
                      height: [
                        `${Math.random() * 60 + 20}%`,
                        `${Math.random() * 60 + 20}%`,
                        `${Math.random() * 60 + 20}%`,
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.03,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Mini features */}
            <div className="grid grid-cols-2 gap-3">
              {parentFeatures.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={feat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)]
                             bg-muted/50 border border-border-secondary text-sm"
                  >
                    <Icon className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-text-secondary font-medium text-xs">
                      {feat.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  );
}
