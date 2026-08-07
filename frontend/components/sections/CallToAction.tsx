"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CallToAction() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="cta" className="py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, color-mix(in srgb, var(--brand-primary) 8%, transparent), transparent)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center" ref={ref}>
        {/* Sparkle icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 mx-auto mb-8 rounded-2xl flex items-center justify-center
                   shadow-[var(--shadow-brand)]"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.4, 0, 1] }}
          className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl
                   font-bold tracking-tight leading-tight"
        >
          Ready to make education{" "}
          <span className="gradient-text">truly inclusive?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed"
        >
          Join thousands of educators and parents who are already transforming
          how children learn. Start for free — no credit card required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="primary" size="lg">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="lg">
            Talk to Our Team
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-8 text-sm text-text-tertiary"
        >
          Free for individual learners • School plans available • No credit card needed
        </motion.p>
      </div>
    </section>
  );
}
