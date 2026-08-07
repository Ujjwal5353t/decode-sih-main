"use client";

import { type ReactNode, useRef } from "react";
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
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, ease: [0.25, 0.4, 0, 1] }}
      className={cn("relative", className)}
    >
      {children}
    </motion.section>
  );
}
