"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveSection } from "@/hooks/useActiveSection";
import { SECTION_LABELS, type SectionId } from "@/lib/utils";

const DOT_SECTIONS: SectionId[] = [
  "hero",
  "why",
  "features",
  "snap-learn",
  "playground",
  "cta",
];

export function DotNav() {
  const active = useActiveSection();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-4"
      aria-label="Section navigation"
    >
      {DOT_SECTIONS.map((id) => {
        const isActive = id === active;
        const isHovered = hoveredId === id;

        return (
          <div key={id} className="relative flex items-center">
            {/* Tooltip label — right-to-left reveal on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 8, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.9 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-8 whitespace-nowrap"
                >
                  <span
                    className="px-3 py-1.5 rounded-[var(--radius-sm)] text-[11px] font-semibold
                             tracking-wide uppercase bg-surface border border-border-primary
                             text-text-secondary shadow-[var(--shadow-md)]
                             font-[family-name:var(--font-display)]"
                  >
                    {SECTION_LABELS[id]}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dot button */}
            <button
              onClick={() => scrollTo(id)}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
              onTouchStart={() => setHoveredId(id)}
              onTouchEnd={() => {
                scrollTo(id);
                setTimeout(() => setHoveredId(null), 1000);
              }}
              className="relative flex items-center justify-center w-6 h-6 cursor-pointer
                       group touch-manipulation"
              aria-label={`Jump to ${SECTION_LABELS[id]}`}
              aria-current={isActive ? "true" : undefined}
            >
              {/* Outer ring — visible on active */}
              <motion.div
                className="absolute rounded-full"
                animate={{
                  width: isActive ? 18 : 0,
                  height: isActive ? 18 : 0,
                  opacity: isActive ? 1 : 0,
                  borderWidth: isActive ? 1.5 : 0,
                }}
                style={{
                  borderColor: "var(--brand-primary)",
                  borderStyle: "solid",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />

              {/* Core dot */}
              <motion.div
                className="rounded-full"
                animate={{
                  width: isActive ? 7 : 5,
                  height: isActive ? 7 : 5,
                  backgroundColor: isActive
                    ? "var(--brand-primary)"
                    : isHovered
                    ? "var(--text-secondary)"
                    : "var(--text-tertiary)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        );
      })}
    </nav>
  );
}
