"use client";

/**
 * Motion vocabulary for the Admin / Teacher / Parent console.
 *
 * Deliberately small: three entrance patterns, one number roll, one shared
 * easing curve. Everything is short (140–320ms) and moves a short distance,
 * so the interface feels responsive rather than animated. Nothing here loops,
 * bounces or floats.
 *
 * Reduced motion is handled once, at the console root, by <ConsoleMotion>:
 * framer-motion's MotionConfig reducedMotion="user" strips transform and
 * layout animation for anyone who asked for it, leaving opacity alone.
 * AnimatedNumber checks the media query itself since it animates text.
 */

import { ReactNode } from "react";
import {
  MotionConfig,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  type Transition,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** One curve for the whole console — a firm ease-out, no overshoot. */
export const EASE = [0.22, 0.68, 0, 1] as const;

export const QUICK: Transition = { duration: 0.18, ease: EASE };
export const SETTLE: Transition = { duration: 0.32, ease: EASE };

/** Wrap the console once, near the root of each dashboard view. */
export function ConsoleMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const listVariants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0, transition: SETTLE },
};

/**
 * Staggered entrance for a group of siblings. Children must be <Item>.
 * The stagger is fast enough (45ms) to read as one movement, not a queue.
 */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "tbody";
}) {
  const Component = motion[as];
  return (
    <Component initial="hidden" animate="shown" variants={listVariants} className={className}>
      {children}
    </Component>
  );
}

export function Item({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "tr";
}) {
  const Component = motion[as];
  return (
    <Component variants={itemVariants} className={className}>
      {children}
    </Component>
  );
}

/** Reveals a block the first time it scrolls into view, once. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ ...SETTLE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Rolls a number up to its value. Used only where the figure is a headline
 * statistic — never on values inside tables, where a moving digit would make
 * the data harder to read.
 */
export function AnimatedNumber({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 22, mass: 0.6 });
  const [rolled, setRolled] = useState(0);

  useEffect(() => {
    if (reduced) return;
    motionValue.set(value);
    return spring.on("change", (latest) => setRolled(Math.round(latest)));
  }, [value, reduced, motionValue, spring]);

  // Anyone who asked for reduced motion reads the final figure straight away.
  const shown = reduced ? value : rolled;

  return (
    <span className={className}>
      {shown}
      {suffix}
    </span>
  );
}
