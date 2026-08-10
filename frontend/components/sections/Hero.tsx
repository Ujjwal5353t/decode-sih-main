"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ArrowRight, Play, WifiOff, Globe, Shield, Sparkles, GraduationCap, Brain } from "lucide-react";
import Image from "next/image";

const trustBadges = [
  { icon: WifiOff, label: "Offline First" },
  { icon: Globe, label: "20+ Languages" },
  { icon: Shield, label: "WCAG Accessible" },
  { icon: GraduationCap, label: "Trusted by Schools" },
];

const floatingCards = [
  {
    icon: Brain,
    label: "Adaptive Learning",
    sublabel: "AI-powered",
    position: "top-[8%] -right-[2%]",
    delay: 0.6,
  },
  {
    icon: Globe,
    label: "25+ Languages",
    sublabel: "Regional support",
    position: "bottom-[28%] -right-[8%]",
    delay: 0.9,
  },
  {
    icon: WifiOff,
    label: "Offline Ready",
    sublabel: "No internet needed",
    position: "bottom-[6%] right-[15%]",
    delay: 1.2,
  },
];

const statBadge = {
  value: "98%",
  label: "Lesson Completion",
  position: "top-[30%] -left-[5%]",
  delay: 0.8,
};

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Animated subtitle rotation
  const subPhrases = [
    "In Their Language",
    "At Their Pace",
    "On Their Terms",
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((p) => (p + 1) % subPhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [subPhrases.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: [0.22, 0.68, 0, 1] as const },
    },
  };

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center overflow-hidden pt-[var(--nav-height)] noise-overlay"
    >
      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Top-left blue radial glow */}
        <div
          className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px]"
          style={{
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.08), transparent 70%)",
          }}
        />
        {/* Center-right secondary glow */}
        <div
          className="absolute top-[20%] right-[10%] w-[600px] h-[600px]"
          style={{
            background: "radial-gradient(circle, rgba(14, 165, 233, 0.05), transparent 70%)",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--brand-primary) 1px, transparent 1px), linear-gradient(90deg, var(--brand-primary) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            opacity: 0.02,
            maskImage: "radial-gradient(ellipse 70% 60% at 30% 50%, black 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 30% 50%, black 10%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Content ── */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16"
      >
        <div
          ref={contentRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center"
        >
          {/* ════ Left Column ════ */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="max-w-xl"
          >
            {/* Eyebrow Badge */}
            <motion.div variants={childVariants} className="mb-6">
              <span
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold
                           font-[family-name:var(--font-display)] border shadow-xs"
                style={{
                  borderColor: "var(--border-brand)",
                  background: "color-mix(in srgb, var(--brand-primary) 6%, var(--bg-surface))",
                  color: "var(--brand-primary)",
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: "var(--brand-primary)" }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: "var(--brand-primary)" }}
                  />
                </span>
                Inclusive Education · AI Powered · Offline Ready
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={childVariants}
              className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem]
                         font-extrabold tracking-[-0.03em] leading-[1.12] mb-5"
            >
              Learning Built Around{" "}
              <span className="gradient-text-hero">Every Child</span>, Not the
              Other Way Around.
            </motion.h1>

            {/* Rotating sub-phrase */}
            <motion.div variants={childVariants} className="h-8 mb-5 flex items-center overflow-hidden">
              <motion.span
                key={phraseIndex}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.22, 0.68, 0, 1] }}
                className="text-lg sm:text-xl font-bold font-[family-name:var(--font-display)] text-brand"
              >
                {subPhrases[phraseIndex]}
              </motion.span>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={childVariants}
              className="text-text-secondary text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
            >
              Inclusive Education AI adapts to every learner with personalized
              lessons, regional languages, offline access, and accessibility
              tools — ensuring every student learns confidently.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={childVariants} className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <motion.a
                href="#playground"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[var(--radius-lg)] text-white
                           font-semibold text-sm cursor-pointer shadow-[var(--shadow-brand)]
                           font-[family-name:var(--font-display)] transition-all duration-300
                           hover:shadow-[0_8px_32px_rgba(37,99,235,0.35)]"
                style={{ background: "var(--gradient-brand)" }}
              >
                Start Learning Free
                <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[var(--radius-lg)]
                           font-semibold text-sm cursor-pointer border glass-card
                           text-text-primary font-[family-name:var(--font-display)]
                           hover:border-[var(--border-brand)] transition-all duration-300"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <Play className="w-4 h-4 text-brand" />
                Watch Demo
              </motion.a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={childVariants}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-border-secondary/60"
            >
              {trustBadges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <span
                    key={badge.label}
                    className="flex items-center gap-1.5 text-text-secondary text-xs"
                  >
                    <Icon className="w-3.5 h-3.5 text-brand" />
                    <span className="font-semibold">{badge.label}</span>
                  </span>
                );
              })}
            </motion.div>
          </motion.div>

          {/* ════ Right Column — Circular Composition ════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 0.68, 0, 1] }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] lg:w-[440px] lg:h-[440px]">
              {/* ── Decorative rings ── */}
              <motion.div
                className="absolute inset-[-12%] rounded-full border border-[var(--border-brand)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                style={{ opacity: 0.25 }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand/40" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky/40" />
              </motion.div>

              <motion.div
                className="absolute inset-[-4%] rounded-full border border-[var(--brand-primary)]"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ opacity: 0.15 }}
              >
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand/50" />
              </motion.div>

              <div
                className="absolute inset-[3%] rounded-full hero-ring-animated"
                style={{
                  border: "2px solid var(--brand-primary)",
                  opacity: 0.2,
                  boxShadow: "0 0 40px rgba(37, 99, 235, 0.1), inset 0 0 40px rgba(37, 99, 235, 0.05)",
                }}
              />

              <div
                className="absolute inset-[8%] rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(14, 165, 233, 0.08), rgba(96, 165, 250, 0.06))",
                }}
              />

              {/* ── Child Image ── */}
              <div className="absolute inset-[10%] rounded-full overflow-hidden shadow-[var(--shadow-xl)]">
                <Image
                  src="/child-hero.png"
                  alt="A smiling child learning with Inclusive Education AI"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 340px, 400px"
                />
              </div>

              {/* ── Floating Glass Cards ── */}
              {floatingCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, scale: 0.8, y: 15 }}
                    animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                    transition={{
                      duration: 0.5,
                      delay: card.delay,
                      ease: [0.22, 0.68, 0, 1],
                    }}
                    className={`absolute ${card.position} z-20`}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        duration: 4 + Math.random() * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)]
                                 glass-card shadow-[var(--shadow-md)] cursor-default
                                 hover:shadow-[var(--shadow-lg)] hover:scale-105 transition-all duration-300"
                    >
                      <div
                        className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                        style={{ background: "color-mix(in srgb, var(--brand-primary) 12%, var(--bg-surface))" }}
                      >
                        <Icon className="w-3.5 h-3.5 text-brand" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary font-[family-name:var(--font-display)] leading-tight">
                          {card.label}
                        </p>
                        <p className="text-[10px] text-text-tertiary leading-tight">
                          {card.sublabel}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* ── Stat Badge ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: statBadge.delay, ease: [0.22, 0.68, 0, 1] }}
                className={`absolute ${statBadge.position} z-20`}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)]
                             glass-card shadow-[var(--shadow-md)] hover:scale-105 transition-transform"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-text-primary font-[family-name:var(--font-display)] leading-none">
                      {statBadge.value}
                    </p>
                    <p className="text-[10px] text-text-tertiary leading-tight mt-0.5">
                      {statBadge.label}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Bottom gradient fade ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-10"
        style={{ background: "linear-gradient(to top, var(--bg-primary), transparent)" }}
        aria-hidden="true"
      />
    </section>
  );
}
