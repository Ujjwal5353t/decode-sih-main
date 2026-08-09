"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const faqData = [
  {
    question: "Does it really work offline?",
    answer:
      "Yes. Lessons, narration, quizzes and the OCR pipeline run on-device using a local WatermelonDB store. Progress queues locally and syncs automatically the moment connectivity returns — no lost work, no duplicate records.",
  },
  {
    question: "Does it support dyslexia and other learning differences?",
    answer:
      "Yes. IncluLearn includes specialized fonts (such as OpenDyslexic), customizable line-spacing, high-contrast themes, ADHD focus modes, and screen-reader optimizations built directly into the core learning experience.",
  },
  {
    question: "How many languages are supported?",
    answer:
      "Over 50 regional languages are supported out of the box with natural voice narration, real-time textbook translation, and multi-lingual parent voice reports.",
  },
  {
    question: "What does the teacher dashboard show?",
    answer:
      "Teachers see real-time concept mastery trends, automated weak-concept detection, at-risk student alerts, attendance correlations, and ready-to-project AI lesson recap decks.",
  },
  {
    question: "How do parent reports work?",
    answer:
      "Parents receive weekly 1-minute AI voice summaries delivered in their native spoken language directly via WhatsApp or SMS, breaking down progress without complicated dashboards.",
  },
  {
    question: "Is it suitable for low-resource schools?",
    answer:
      "Absolutely. The platform is optimized to run smoothly on affordable Android tablets and low-cost hardware, requiring zero constant internet connectivity.",
  },
  {
    question: "What about pricing and school support?",
    answer:
      "IncluLearn is completely free for individual students. School and district plans offer bulk teacher co-pilot tools, custom curriculum mapping, and dedicated onboarding support.",
  },
];

export function FAQ() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <SectionWrapper id="faq" className="py-20 lg:py-26 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-14">
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
            FAQ
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 0.68, 0, 1] as const }}
            className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl
                     font-bold tracking-tight leading-[1.1]"
          >
            Answers, before <span className="gradient-text">you have to ask.</span>
          </motion.h2>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqData.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + index * 0.05 }}
                className={`rounded-[var(--radius-xl)] border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "bg-surface border-[var(--border-brand)] shadow-[var(--shadow-md)] ring-1 ring-brand/20"
                    : "bg-surface border-border-primary hover:border-border-brand"
                }`}
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full p-6 sm:p-7 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-base sm:text-lg text-text-primary font-[family-name:var(--font-display)]">
                    {item.question}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                      isOpen
                        ? "bg-brand/10 text-brand"
                        : "bg-muted text-text-secondary hover:bg-brand/10 hover:text-brand"
                    }`}
                  >
                    <motion.div
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isOpen ? (
                        <X className="w-4 h-4 text-brand" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 0.68, 0, 1] as const }}
                    >
                      <div className="px-6 pb-7 sm:px-7 text-text-secondary text-sm sm:text-base leading-relaxed border-t border-border-secondary/60 pt-4">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
