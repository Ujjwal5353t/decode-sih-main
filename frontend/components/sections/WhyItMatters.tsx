"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { GradientBlob } from "@/components/shared/GradientBlob";

const stats = [
  {
    value: 260,
    suffix: "M",
    label: "Children out of school worldwide",
    color: "var(--brand-primary)",
  },
  {
    value: 40,
    suffix: "%",
    label: "Cannot read in their native language",
    color: "var(--brand-accent)",
  },
  {
    value: 93,
    suffix: "%",
    label: "Lack access to adaptive learning tools",
    color: "var(--brand-sky)",
  },
  {
    value: 15,
    suffix: "%",
    label: "Of learners have dyslexia or ADHD",
    color: "var(--brand-sky)",
  },
];

export function WhyItMatters() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <SectionWrapper id="why" className="py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <GradientBlob color="brand" size="lg" className="top-0 right-0 opacity-20" />
      </div>

      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="text-brand text-sm font-semibold uppercase tracking-widest mb-4
                     font-[family-name:var(--font-display)]"
          >
            Why It Matters
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.4, 0, 1] }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl
                     font-bold tracking-tight leading-tight max-w-3xl mx-auto"
          >
            Education is a right,{" "}
            <span className="gradient-text">not a privilege</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Millions of children are left behind by systems that weren&apos;t designed for them.
            We&apos;re building the technology to change that.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.3 + i * 0.1,
                ease: [0.25, 0.4, 0, 1],
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative p-8 rounded-[var(--radius-xl)] bg-surface border border-border-primary
                       shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-border-brand
                       transition-all duration-300 text-center group"
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: stat.color }}
              />
              <AnimatedCounter
                target={stat.value}
                suffix={stat.suffix}
                className="text-4xl md:text-5xl font-extrabold font-[family-name:var(--font-display)]"
                duration={2}
              />
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
