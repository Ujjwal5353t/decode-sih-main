"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { Users, BookX, Languages, Brain, WifiOff, Sparkles, HeartHandshake } from "lucide-react";

export function WhyItMatters() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-60px" });

  return (
    <SectionWrapper id="why" className="py-20 lg:py-26 overflow-hidden">
      {/* Background ambient glows (GPU Accelerated) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-0 w-[500px] h-[500px] -translate-y-1/2 rounded-full transform-gpu"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 6%, transparent), transparent 70%)",
            willChange: "transform",
          }}
        />
        <div
          className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full transform-gpu"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, var(--brand-sky) 5%, transparent), transparent 70%)",
            willChange: "transform",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12" ref={containerRef}>
        {/* ════ SECTION HEADER ════ */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold
                       tracking-wider uppercase font-[family-name:var(--font-display)] mb-3 border transform-gpu"
            style={{
              borderColor: "var(--border-brand)",
              background: "color-mix(in srgb, var(--brand-primary) 6%, var(--bg-surface))",
              color: "var(--brand-primary)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            WHY IT MATTERS — INDIA EVIDENCE
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight leading-[1.15] transform-gpu"
          >
            Education is a right,{" "}
            <span className="gradient-text">not a privilege.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            className="mt-3 text-text-secondary text-base sm:text-lg leading-relaxed max-w-2xl mx-auto transform-gpu"
          >
            India-specific evidence highlights the critical learning gaps that demand adaptive, multilingual, and offline-first AI education.
          </motion.p>
        </div>

        {/* ════ COMPOSITION: ASYMMETRIC AWWWARDS STATS LAYOUT ════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch mb-8">
          {/* ── LEFT FEATURED HERO CARD (12.09 Cr Stat) ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="lg:col-span-6 rounded-[28px] bg-surface border border-border-primary
                       shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-brand)]
                       p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 transform-gpu"
          >
            {/* Ambient Background Gradient Mesh */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none group-hover:opacity-70 transition-opacity duration-500"
              style={{
                background:
                  "radial-gradient(ellipse at top left, color-mix(in srgb, var(--brand-primary) 12%, transparent), transparent 70%)",
              }}
            />

            {/* Top Icon Badge & Eyebrow */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-[var(--border-brand)]
                           shadow-[var(--shadow-brand)]"
                style={{ background: "color-mix(in srgb, var(--brand-primary) 10%, var(--bg-surface))" }}
              >
                <Users className="w-6 h-6 text-brand" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-brand bg-brand/10 border border-brand/20 font-[family-name:var(--font-display)]">
                India Education Data
              </span>
            </div>

            {/* Hero Number Display */}
            <div className="relative my-2 z-10">
              <div className="flex items-baseline gap-1">
                <AnimatedCounter
                  target={12.09}
                  decimals={2}
                  suffix=" Cr"
                  className="text-5xl sm:text-6xl lg:text-7xl font-black font-[family-name:var(--font-display)] gradient-text tracking-tight"
                  duration={2.0}
                />
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-text-primary font-[family-name:var(--font-display)] mt-3 mb-1.5">
                Children in India&apos;s Foundational + Preparatory stages
              </h3>
              <p className="text-text-secondary text-xs sm:text-sm leading-relaxed max-w-md">
               Too many learners still navigate one-size-fits-all education that cannot adapt to their language, location, pace, or individual learning needs.  </p>
            </div>

            {/* Bottom Citation Line */}
            <div className="pt-4 mt-4 border-t border-border-secondary/70 relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider font-[family-name:var(--font-display)]">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                According to UDISE+ 2023–24
              </div>
              <span className="text-xs font-bold text-brand font-[family-name:var(--font-display)]">
                Target Population
              </span>
            </div>
          </motion.div>

          {/* ── RIGHT STAGGERED STAT CARDS (51.2%, 35%, 10.5 Lakh, 36.5%) ── */}
          <div className="lg:col-span-6 flex flex-col gap-3.5">
            {/* Card 1: 51.2% Learning Gap */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-[24px] bg-surface border border-border-primary
                         shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-brand)]
                         p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden group transition-all duration-300 transform-gpu"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border-secondary group-hover:border-[var(--border-brand)] transition-colors"
                  style={{ background: "color-mix(in srgb, var(--brand-sky) 10%, var(--bg-surface))" }}
                >
                  <BookX className="w-5 h-5 text-sky" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)] leading-snug">
                    Rural Class V children cannot read a Class II-level text
                  </h4>
                  <p className="text-[11px] text-text-tertiary mt-0.5">
                    According to ASER 2024
                  </p>
                </div>
              </div>
              <AnimatedCounter
                target={51.2}
                decimals={1}
                suffix="%"
                className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-display)] text-sky shrink-0"
                duration={1.8}
              />
            </motion.div>

            {/* Card 2: 35% Language Barrier */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-[24px] bg-surface border border-border-primary
                         shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-brand)]
                         p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden group transition-all duration-300 transform-gpu"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border-secondary group-hover:border-[var(--border-brand)] transition-colors"
                  style={{ background: "color-mix(in srgb, var(--brand-primary) 10%, var(--bg-surface))" }}
                >
                  <Languages className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)] leading-snug">
                    Students in India are not taught in the language they speak and understand best
                  </h4>
                  <p className="text-[11px] text-text-tertiary mt-0.5">
                    According to UNICEF India
                  </p>
                </div>
              </div>
              <AnimatedCounter
                target={35}
                suffix="%"
                className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-display)] text-brand shrink-0"
                duration={1.8}
              />
            </motion.div>

            {/* Card 3: 10.5 Lakh Special Needs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-[24px] bg-surface border border-border-primary
                         shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-brand)]
                         p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden group transition-all duration-300 transform-gpu"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border-secondary group-hover:border-[var(--border-brand)] transition-colors"
                  style={{ background: "color-mix(in srgb, var(--brand-violet) 10%, var(--bg-surface))" }}
                >
                  <Brain className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)] leading-snug">
                    Children with Special Needs in India&apos;s Foundational + Preparatory stages
                  </h4>
                  <p className="text-[11px] text-text-tertiary mt-0.5">
                    According to UDISE+ 2023–24
                  </p>
                </div>
              </div>
              <AnimatedCounter
                target={10.5}
                decimals={1}
                suffix=" Lakh"
                className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-display)] text-violet-600 shrink-0"
                duration={1.8}
              />
            </motion.div>

            {/* Card 4: 36.5% Offline-First / Internet Access */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-[24px] bg-surface border border-border-primary
                         shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-brand)]
                         p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden group transition-all duration-300 transform-gpu"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border-secondary group-hover:border-[var(--border-brand)] transition-colors"
                  style={{ background: "color-mix(in srgb, var(--brand-primary) 10%, var(--bg-surface))" }}
                >
                  <WifiOff className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)] leading-snug">
                    Schools in India still lack internet access
                  </h4>
                  <p className="text-[11px] text-text-tertiary mt-0.5">
                    According to UDISE+ 2024–25
                  </p>
                </div>
              </div>
              <AnimatedCounter
                target={36.5}
                decimals={1}
                suffix="%"
                className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-display)] text-brand shrink-0"
                duration={1.8}
              />
            </motion.div>
          </div>
        </div>

        {/* ════ ELEGANT FULL-WIDTH CORE MISSION CARD (RESTORED TO ORIGINAL APPROVED STYLE) ════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
          className="gradient-border rounded-[24px] p-6 sm:p-8 bg-surface shadow-[var(--shadow-md)] text-center relative overflow-hidden transform-gpu"
        >
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-xs"
              style={{ background: "var(--gradient-brand)" }}
            >
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <p className="text-base sm:text-lg md:text-xl font-bold text-text-primary leading-relaxed font-[family-name:var(--font-display)]">
              &ldquo;Every child deserves the chance to learn in a way that works for them — regardless of language, ability, or internet access.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand font-[family-name:var(--font-display)]">
                Our Core Mission
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
