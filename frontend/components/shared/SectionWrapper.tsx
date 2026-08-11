"use client";

import { type ReactNode, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  id: string;
  children: ReactNode;
  className?: string;
  noAnimation?: boolean;
}

export function SectionWrapper({
  id,
  children,
  className,
  noAnimation = false,
}: SectionWrapperProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [glowFired, setGlowFired] = useState(false);

  if (noAnimation) {
    return (
      <section id={id} className={cn("relative", className)}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 50, filter: "blur(6px)" }
      }
      transition={{ duration: 0.8, ease: [0.22, 0.68, 0, 1] }}
      onAnimationComplete={() => {
        if (isInView && !glowFired) setGlowFired(true);
      }}
      className={cn(
        "relative",
        // section-enter-glow adds a CSS ::before pseudo-element that animates in
        // and fades out — providing a soft ambient spotlight in light mode only.
        // In dark mode, the ::before is suppressed via [data-theme="dark"] CSS rule.
        glowFired && "section-enter-glow",
        className
      )}
    >
      {children}
    </motion.section>
  );
}
