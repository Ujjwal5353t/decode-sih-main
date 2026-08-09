"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { Users, BookX, Puzzle, Brain, Sparkles, HeartHandshake } from "lucide-react";

export function WhyItMatters() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });

  return (
    <SectionWrapper id="why" className="py-20 lg:py-26 overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-0 w-[500px] h-[500px] -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 6%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, var(--brand-sky) 5%, transparent), transparent 70%)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12" ref={containerRef}>
        {/* ════ SECTION HEADER ════ */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold
                       tracking-wider uppercase font-[family-name:var(--font-display)] mb-3 border"
            style={{
              borderColor: "var(--border-brand)",
              background: "color-mix(in srgb, var(--brand-primary) 6%, var(--bg-surface))",
              color: "var(--brand-primary)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            WHY IT MATTERS
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight leading-[1.15]"
          >
            Education is a right,{" "}
            <span className="gradient-text">not a privilege.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 text-text-secondary text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            Millions of children are left behind by systems that weren&apos;t designed for them.
            We&apos;re building the technology to change that.
          </motion.p>
        </div>

        {/* ════ COMPOSITION: ASYMMETRIC AWWWARDS STATS LAYOUT ════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch mb-8">
          {/* ── LEFT FEATURED HERO CARD (260M Stat) ── */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 16 }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 0.68, 0, 1] as const }}
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            className="lg:col-span-6 rounded-[28px] bg-surface border border-border-primary
                       shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-brand)]
                       p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group transition-all duration-300"
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
                Global Impact
              </span>
            </div>

            {/* Hero Number Display with Orbital Ring Decoration */}
            <div className="relative my-2 z-10">
              <div className="flex items-baseline gap-1">
                <AnimatedCounter
                  target={260}
                  suffix="M"
                  className="text-5xl sm:text-6xl lg:text-7xl font-black font-[family-name:var(--font-display)] gradient-text tracking-tight"
                  duration={2.2}
                />
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-text-primary font-[family-name:var(--font-display)] mt-3 mb-1.5">
                Children out of school worldwide
              </h3>
              <p className="text-text-secondary text-xs sm:text-sm leading-relaxed max-w-md">
                Left behind by traditional rigid educational systems that fail to accommodate language, location, or learning differences.
              </p>
            </div>

            {/* Bottom Progress Arc Illustration */}
            <div className="pt-4 mt-4 border-t border-border-secondary/70 relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider font-[family-name:var(--font-display)]">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                Targeting 100% Inclusion
              </div>
              <span className="text-xs font-bold text-brand font-[family-name:var(--font-display)]">
                UN SDG 4 Aligned
              </span>
            </div>
          </motion.div>

          {/* ── RIGHT STAGGERED STAT CARDS (40%, 93%, 15%) ── */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Card 1: 40% Cannot read in native language */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 16 }}
              animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 0.68, 0, 1] as const }}
              whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.2 } }}
              className="rounded-[24px] bg-surface border border-border-primary
                         shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-brand)]
                         p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border-secondary group-hover:border-[var(--border-brand)] transition-colors"
                  style={{ background: "color-mix(in srgb, var(--brand-sky) 10%, var(--bg-surface))" }}
                >
                  <BookX className="w-5 h-5 text-sky" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-text-primary font-[family-name:var(--font-display)]">
                    Cannot read in their native language
                  </h4>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Severe barriers caused by monolingual learning materials.
                  </p>
                </div>
              </div>
              <AnimatedCounter
                target={40}
                suffix="%"
                className="text-3xl sm:text-4xl font-black font-[family-name:var(--font-display)] text-sky shrink-0"
                duration={1.8}
              />
            </motion.div>

            {/* Card 2: 93% Lack adaptive tools */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 16 }}
              animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 0.68, 0, 1] as const }}
              whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.2 } }}
              className="rounded-[24px] bg-surface border border-border-primary
                         shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-brand)]
                         p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border-secondary group-hover:border-[var(--border-brand)] transition-colors"
                  style={{ background: "color-mix(in srgb, var(--brand-primary) 10%, var(--bg-surface))" }}
                >
                  <Puzzle className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-text-primary font-[family-name:var(--font-display)]">
                    Lack access to adaptive learning tools
                  </h4>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    One-size-fits-all education leaves neurodivergent learners behind.
                  </p>
                </div>
              </div>
              <AnimatedCounter
                target={93}
                suffix="%"
                className="text-3xl sm:text-4xl font-black font-[family-name:var(--font-display)] text-brand shrink-0"
                duration={1.8}
              />
            </motion.div>

            {/* Card 3: 15% Dyslexia or ADHD */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 16 }}
              animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 0.68, 0, 1] as const }}
              whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.2 } }}
              className="rounded-[24px] bg-surface border border-border-primary
                         shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-brand)]
                         p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border-secondary group-hover:border-[var(--border-brand)] transition-colors"
                  style={{ background: "color-mix(in srgb, var(--brand-violet) 10%, var(--bg-surface))" }}
                >
                  <Brain className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-text-primary font-[family-name:var(--font-display)]">
                    Of learners have dyslexia or ADHD
                  </h4>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Require specialized font weighting, focus tools, and pace adjustments.
                  </p>
                </div>
              </div>
              <AnimatedCounter
                target={15}
                suffix="%"
                className="text-3xl sm:text-4xl font-black font-[family-name:var(--font-display)] text-violet-600 shrink-0"
                duration={1.8}
              />
            </motion.div>
          </div>
        </div>

        {/* ════ ELEGANT MISSION STATEMENT CARD ════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="gradient-border rounded-[24px] p-6 sm:p-8 bg-surface shadow-[var(--shadow-md)] text-center relative overflow-hidden"
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
