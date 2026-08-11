"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const faqData = [
  {
    question: "01 — What is Inclusive Education AI?",
    answer:
      "Inclusive Education AI is an AI-powered learning platform built to make education accessible to every child—regardless of language, learning needs, or internet connectivity.\n\nIt combines adaptive learning, regional languages, offline-first education, assistive technology, life-skills learning, and AI-powered support for teachers and parents in one ecosystem.",
  },
  {
    question: "02 — What makes it different from a normal AI tutor?",
    answer:
      "We don't just make AI explain a lesson—we make the learning experience adapt to the learner.\n\nUnlike a conventional AI tutor, Inclusive Education AI combines personalized learning + accessibility + regional languages + offline learning + assistive technology + teacher/parent collaboration.\n\nA child doesn't simply receive an answer. The platform learns from their progress and adapts what they learn, how they learn it, and how much support they receive.",
  },
  {
    question: "03 — How does AI personalize learning for my child?",
    answer:
      "Every child learns differently.\n\nOur platform can use assessment results, learning progress, interactions, pace, and performance to build an individual learning profile. The system can then adapt the difficulty, pace, explanation style, content format, and activities to better match the child's needs.\n\nInstead of asking every child to fit the curriculum, we make the curriculum fit the child.",
  },
  {
    question: "04 — Can it work without the internet?",
    answer:
      "Yes—that's one of our core principles.\n\nThe platform follows an offline-first approach, allowing essential learning experiences to continue even when internet connectivity is unavailable. Learning activity can be stored locally and synchronized when connectivity returns.\n\nThis makes the platform especially relevant for low-connectivity schools and communities where continuous internet access cannot be assumed.",
  },
  {
    question: "05 — How does it support children with different learning needs?",
    answer:
      "Accessibility is built into the learning experience—not added as an afterthought.\n\nDepending on the learner's needs, the platform can provide features such as dyslexia-friendly reading modes, adjustable text and spacing, reduced cognitive load, high-contrast interfaces, captions, visual learning, sign-language support, and AAC-style communication.\n\nThe goal isn't to create a separate classroom for every child.\n\nIt's to create one learning environment that can adapt to different children.",
  },
  {
    question: "06 — What is Snap & Learn?",
    answer:
      "Snap & Learn turns an ordinary textbook page into an interactive AI lesson.\n\nA child photographs a page, and AI can read the content, understand it, simplify the explanation, translate it into a preferred language, narrate it, and generate interactive questions.\n\nSo instead of needing a specially digitized textbook, a printed page can become an accessible, personalized learning experience.",
  },
  {
    question: "07 — How do teachers and parents become part of the learning journey?",
    answer:
      "Learning shouldn't stop at the student's screen.\n\nOur Teacher/Parent AI Co-Pilot turns learning progress into useful, human-friendly insights.\n\nTeachers can receive actionable recommendations about where a child may need additional support, while parents can receive simple updates—potentially through voice in their preferred language—so they understand what the child is learning and how they can help.\n\nAI connects the child, teacher, and parent instead of isolating learning to an app.",
  },
  {
    question: "08 — Does Inclusive Education AI replace teachers?",
    answer:
      "No. It makes teachers more powerful.\n\nAI can handle repetitive tasks such as identifying learning patterns, adapting content, and summarizing progress. Teachers remain responsible for the human side of education—understanding the child, building confidence, mentoring, encouraging, and making important decisions.\n\nAI personalizes the learning. Humans personalize the care.",
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
                      <div className="px-6 pb-7 sm:px-7 text-text-secondary text-sm sm:text-base leading-relaxed border-t border-border-secondary/60 pt-4 whitespace-pre-line">
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
