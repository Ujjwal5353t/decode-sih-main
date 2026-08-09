"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles, Star, ShieldCheck, HeartHandshake, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export function CallToAction() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="cta" className="py-20 lg:py-28 relative overflow-hidden flex items-center justify-center min-h-[550px]">
      {/* ══ FULL-WIDTH VIBRANT BACKGROUND IMAGE & SUBTLE OVERLAYS ══ */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Classroom Collaboration Background Photo */}
        <Image
          src="/cta-education-bg.png"
          alt="Inclusive education classroom collaboration"
          fill
          className="object-cover object-center brightness-90 contrast-105 scale-105"
          priority
          sizes="100vw"
        />

        {/* Subtle Sapphire Gradient Vignette Overlay (Leaves image visible while ensuring high text contrast) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10, 15, 28, 0.7) 0%, rgba(15, 23, 42, 0.65) 40%, rgba(15, 23, 42, 0.85) 80%, rgba(10, 15, 28, 0.95) 100%)",
          }}
        />

        {/* Ambient Blue Radial Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px]"
          style={{
            background: "radial-gradient(ellipse, rgba(37, 99, 235, 0.25), transparent 70%)",
          }}
        />
      </div>

      {/* Decorative Floating Stars */}
      <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
        {[
          { top: "12%", left: "8%", size: 18, delay: 0 },
          { top: "22%", right: "12%", size: 14, delay: 0.5 },
          { bottom: "18%", left: "15%", size: 16, delay: 1 },
          { bottom: "25%", right: "10%", size: 12, delay: 1.5 },
        ].map((star, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: star.top,
              left: star.left,
              right: star.right,
              bottom: star.bottom,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.25, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          >
            <Star className="text-blue-200/50" style={{ width: star.size, height: star.size }} />
          </motion.div>
        ))}
      </div>

      {/* ══ FOREGROUND CONTENT PLACED DIRECTLY ON THE IMMERSIVE CANVAS ══ */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center" ref={ref}>
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold
                     tracking-wider uppercase font-[family-name:var(--font-display)] mb-6
                     bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />
          JOIN THE INCLUSIVE EDUCATION MOVEMENT
        </motion.div>

        {/* Immersive Main Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
          className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                     font-black tracking-tight leading-[1.1] text-white drop-shadow-md max-w-4xl mx-auto"
        >
          Ready to make education{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-sky-300 to-indigo-200">
            truly inclusive?
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-blue-100/90 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-medium"
        >
          Join thousands of educators and parents transforming how every child learns.
          Start for free — no credit card required.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.a
            href="#playground"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-[var(--radius-lg)]
                     bg-white text-blue-700 font-extrabold text-base cursor-pointer
                     shadow-[0_12px_36px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(37,99,235,0.4)]
                     font-[family-name:var(--font-display)] transition-all duration-300"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </motion.a>

          <motion.a
            href="#why"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-[var(--radius-lg)]
                     bg-white/10 backdrop-blur-md text-white font-bold text-base cursor-pointer
                     border border-white/30 hover:bg-white/20 hover:border-white/50
                     font-[family-name:var(--font-display)] transition-all duration-300 shadow-md"
          >
            <HeartHandshake className="w-5 h-5 text-blue-200" />
            Talk to Our Team
          </motion.a>
        </motion.div>

        {/* Trust Badges Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-blue-100/80 font-medium"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Free for individual learners
          </span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-300" />
            School plans available
          </span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-300" />
            No credit card needed
          </span>
        </motion.div>
      </div>
    </section>
  );
}
