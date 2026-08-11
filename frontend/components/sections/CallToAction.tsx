"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle2,
  User,
  Mail,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import Image from "next/image";

import { submitContactForm } from "@/lib/api";

export function CallToAction() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  /* ── Form state ── */
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    setSending(true);
    try {
      await submitContactForm(formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputBaseClass =
    "w-full bg-white/[0.07] border border-white/[0.12] rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-blue-200/40 outline-none transition-all duration-300 backdrop-blur-sm font-[family-name:var(--font-body)]";

  const inputFocusClass =
    "focus:border-blue-400/60 focus:bg-white/[0.1] focus:shadow-[0_0_0_3px_rgba(96,165,250,0.15),0_4px_24px_rgba(37,99,235,0.12)] focus:ring-0";

  return (
    <section
      id="cta"
      className="py-20 lg:py-28 relative overflow-hidden flex items-center justify-center min-h-[650px]"
    >
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

        {/* Subtle Sapphire Gradient Vignette Overlay */}
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

      {/* ══ TWO-COLUMN LAYOUT: MESSAGING + FORM ══ */}
      <div
        className="relative z-20 max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        ref={ref}
      >
        {/* ── LEFT COLUMN: Messaging ── */}
        <div className="text-center lg:text-left">
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
            START A CONVERSATION
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl
                       font-black tracking-tight leading-[1.1] text-white drop-shadow-md"
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
            className="mt-6 text-blue-100/90 text-base sm:text-lg max-w-xl leading-relaxed drop-shadow-sm font-medium
                       mx-auto lg:mx-0"
          >
            Join thousands of educators and parents transforming how every child learns.
            Start for free — no credit card required.
          </motion.p>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-blue-100/80 font-medium"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Free for individuals
            </span>
            <span className="hidden sm:inline text-white/25">•</span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-300" />
              School plans
            </span>
            <span className="hidden sm:inline text-white/25">•</span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-300" />
              No credit card
            </span>
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN: Premium Glass Contact Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 0.68, 0, 1] as const }}
        >
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow:
                "0 32px 80px rgba(0, 0, 0, 0.35), 0 8px 32px rgba(37, 99, 235, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Card top gradient accent line */}
            <div
              className="h-[2px] w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.6) 20%, rgba(59, 130, 246, 0.8) 50%, rgba(96, 165, 250, 0.6) 80%, transparent)",
              }}
            />

            <div className="px-8 sm:px-10 py-10">
              {/* Form Header */}
              <div className="mb-8">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.4 }}
                  className="text-blue-300/80 text-xs font-bold tracking-[0.2em] uppercase font-[family-name:var(--font-display)] mb-2"
                >
                  GET IN TOUCH
                </motion.p>
                <motion.h3
                  initial={{ opacity: 0, y: 12 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-display)] tracking-tight"
                >
                  We&apos;d love to hear from you
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5 }}
                  className="mt-2 text-sm text-blue-200/60 leading-relaxed"
                >
                  Whether you&apos;re an educator, a parent, or a school — reach out and let&apos;s build something inclusive together.
                </motion.p>
              </div>

              {/* Form */}
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1] }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                      style={{
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.15))",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white font-[family-name:var(--font-display)] mb-2">
                      Message sent!
                    </h4>
                    <p className="text-sm text-blue-200/70 max-w-xs">
                      Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-6 text-xs text-blue-300/80 hover:text-blue-200 underline underline-offset-4 transition-colors cursor-pointer"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Name Input */}
                    <div className="relative">
                      <div
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                          focusedField === "name" ? "text-blue-400" : "text-blue-300/30"
                        }`}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Your name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        className={`${inputBaseClass} ${inputFocusClass} pl-11`}
                      />
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                      <div
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                          focusedField === "email" ? "text-blue-400" : "text-blue-300/30"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        className={`${inputBaseClass} ${inputFocusClass} pl-11`}
                      />
                    </div>

                    {/* Message Textarea */}
                    <div className="relative">
                      <div
                        className={`absolute left-4 top-4 transition-colors duration-300 ${
                          focusedField === "message" ? "text-blue-400" : "text-blue-300/30"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <textarea
                        placeholder="Tell us how we can help..."
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        onFocus={() => setFocusedField("message")}
                        onBlur={() => setFocusedField(null)}
                        className={`${inputBaseClass} ${inputFocusClass} pl-11 resize-none`}
                      />
                    </div>

                    {/* Error Feedback */}
                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs font-medium text-center backdrop-blur-sm">
                        {errorMessage}
                      </div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={sending}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl
                                 font-bold text-sm text-white cursor-pointer
                                 font-[family-name:var(--font-display)] transition-all duration-300
                                 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #0EA5E9 100%)",
                        boxShadow: "0 8px 32px rgba(37, 99, 235, 0.35), 0 2px 8px rgba(37, 99, 235, 0.2)",
                      }}
                    >
                      {/* Subtle shimmer overlay on button */}
                      <div
                        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.06) 100%)",
                        }}
                      />

                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </motion.button>

                    {/* Privacy note */}
                    <p className="text-center text-[11px] text-blue-200/40 pt-1">
                      We respect your privacy. No spam, ever.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
