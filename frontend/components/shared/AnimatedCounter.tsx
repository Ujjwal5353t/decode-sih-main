"use client";

import { useEffect, useRef } from "react";
import { useInView, motion } from "framer-motion";

interface AnimatedCounterProps {
  target: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  decimals,
  suffix = "",
  prefix = "",
  duration = 1.8,
  className,
}: AnimatedCounterProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "0px 0px -40px 0px" });

  useEffect(() => {
    if (!isInView || !textRef.current) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const formatVal = (val: number) => {
      const formatted =
        decimals !== undefined
          ? val.toFixed(decimals)
          : Math.floor(val).toLocaleString();
      return `${prefix}${formatted}${suffix}`;
    };

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Fast ease-out cubic curve
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = target * easedProgress;

      if (textRef.current) {
        textRef.current.textContent = formatVal(currentVal);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else if (textRef.current) {
        textRef.current.textContent = formatVal(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, target, decimals, prefix, suffix, duration]);

  const initialDisplay = `${prefix}${decimals !== undefined ? (0).toFixed(decimals) : "0"}${suffix}`;

  return (
    <motion.span
      ref={containerRef}
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ willChange: "opacity, transform" }}
    >
      <span ref={textRef}>{initialDisplay}</span>
    </motion.span>
  );
}
