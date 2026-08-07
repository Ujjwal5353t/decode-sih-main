"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";

const headlineWords = ["Every", "Child", "Deserves", "to", "Learn."];

const subPhrases = [
  { text: "In Their Language", color: "var(--brand-primary)" },
  { text: "At Their Pace", color: "var(--brand-secondary)" },
  { text: "On Their Terms", color: "var(--brand-sky)" },
];

function useParticleRing(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    angle: (360 / count) * i,
    delay: i * 0.3,
    size: Math.random() * 2 + 1.5,
    duration: 18 + Math.random() * 12,
    radius: 160 + Math.random() * 80,
    opacity: 0.15 + Math.random() * 0.25,
  }));
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  const particles = useParticleRing(20);

  const [phraseIndex, setPhraseIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((p) => (p + 1) % subPhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden
                 pt-[var(--nav-height)] noise-overlay"
    >
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Top glow — teal beam */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, var(--brand-primary), transparent)",
            opacity: 0.08,
          }}
        />

        {/* Center radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px]"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 6%, transparent), transparent 70%)",
          }}
        />

        {/* Grid — perspective lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--brand-primary) 1px, transparent 1px), linear-gradient(90deg, var(--brand-primary) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            opacity: 0.025,
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 70%)",
          }}
        />

        {/* Orbiting particles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: "var(--brand-primary)",
                opacity: p.opacity,
                ["--orbit-radius" as string]: `${p.radius}px`,
              }}
              animate={{
                rotate: [p.angle, p.angle + 360],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "linear",
                delay: p.delay,
              }}
            />
          ))}
        </div>

        {/* Cursor-following glow */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            x: springX,
            y: springY,
            translateX: "-50%",
            translateY: "-50%",
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 5%, transparent), transparent 60%)",
          }}
        />

        {/* Horizontal accent lines */}
        <motion.div
          className="absolute left-0 right-0 h-px top-[30%]"
          style={{ background: "var(--gradient-brand)", opacity: 0.06 }}
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute left-0 right-0 h-px top-[70%]"
          style={{ background: "var(--gradient-cool)", opacity: 0.04 }}
          animate={{ opacity: [0.02, 0.06, 0.02] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0, 1] }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 mb-10 rounded-full
                   border text-sm font-medium
                   font-[family-name:var(--font-display)]"
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
          AI-Powered Inclusive Education
        </motion.div>

        {/* Main Headline */}
        <h1
          className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem]
                     font-extrabold tracking-[-0.03em] leading-[1.05] mb-8"
        >
          {headlineWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 50, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                delay: 0.35 + i * 0.09,
                ease: [0.22, 0.68, 0, 1],
              }}
              className={`inline-block mr-[0.22em] ${
                word === "Child" || word === "Learn."
                  ? "gradient-text"
                  : ""
              }`}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Rotating sub-phrase */}
        <div className="h-10 mb-10 flex items-center justify-center overflow-hidden">
          <motion.div
            key={phraseIndex}
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1] }}
            className="text-xl sm:text-2xl md:text-3xl font-semibold
                     font-[family-name:var(--font-display)] tracking-tight"
            style={{ color: subPhrases[phraseIndex].color }}
          >
            {subPhrases[phraseIndex].text}
          </motion.div>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2, ease: [0.25, 0.4, 0, 1] }}
          className="max-w-xl mx-auto text-text-secondary text-base sm:text-lg leading-relaxed mb-12"
        >
          Adaptive AI that understands every learner. 50+ regional languages,
          offline-first, and designed for dyslexia, ADHD & visual impairments.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4, ease: [0.25, 0.4, 0, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="primary" size="lg">
            Start Learning Free
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="lg">
            <Play className="w-4 h-4" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-20 flex flex-col items-center gap-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-border-primary" />
            <p
              className="text-[10px] text-text-tertiary font-semibold uppercase tracking-[0.2em]
                       font-[family-name:var(--font-display)]"
            >
              Trusted by educators across
            </p>
            <div className="h-px w-12 bg-border-primary" />
          </div>

          <div className="flex items-center gap-10">
            {[
              { num: "12", label: "States" },
              { num: "500+", label: "Schools" },
              { num: "1M+", label: "Students" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0 + i * 0.1 }}
                className="text-center"
              >
                <span className="block text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">
                  {stat.num}
                </span>
                <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-medium">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
        style={{
          background: "linear-gradient(to top, var(--bg-primary), transparent)",
        }}
        aria-hidden="true"
      />
    </section>
  );
}
