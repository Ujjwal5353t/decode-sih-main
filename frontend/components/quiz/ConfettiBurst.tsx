"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiBurstProps {
  // Bump this to a new value to fire a new burst (e.g. Date.now() or a
  // counter) — kept dependency-free (no canvas-confetti) since this is a
  // small, self-contained visual flourish.
  triggerKey: number;
  count?: number;
}

const COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899"];

// Deterministic pseudo-random in [0, 1), seeded by an integer — keeps particle
// layout a pure function of (triggerKey, index) instead of calling Math.random()
// during render, while still looking randomized burst-to-burst since triggerKey
// changes each time.
function seededRandom(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function ConfettiBurst({ triggerKey, count = 24 }: ConfettiBurstProps) {
  const particles = useMemo(() => {
    if (!triggerKey) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: `${triggerKey}-${i}`,
      angle: (Math.PI * 2 * i) / count + seededRandom(triggerKey + i) * 0.5,
      distance: 60 + seededRandom(triggerKey + i + 1000) * 90,
      color: COLORS[i % COLORS.length],
      size: 6 + seededRandom(triggerKey + i + 2000) * 6,
      rotate: seededRandom(triggerKey + i + 3000) * 360,
    }));
  }, [triggerKey, count]);

  if (!triggerKey) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute top-1/3 left-1/2 rounded-sm"
            style={{ width: p.size, height: p.size, backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(p.angle) * p.distance,
              y: Math.sin(p.angle) * p.distance + 40,
              opacity: 0,
              rotate: p.rotate,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
