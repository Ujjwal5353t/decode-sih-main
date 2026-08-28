"use client";

import type { JSX } from "react";
import { motion } from "framer-motion";
import { ICON_REGISTRY, type IconShape } from "./registry";

interface QuizIllustrationProps {
  assetKey: string;
  size?: number;
  className?: string;
}

function renderShape(shape: IconShape, i: number) {
  switch (shape.t) {
    case "circle":
      return (
        <circle
          key={i}
          cx={shape.cx} cy={shape.cy} r={shape.r}
          fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.sw} opacity={shape.opacity}
        />
      );
    case "ellipse":
      return (
        <ellipse
          key={i}
          cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry}
          fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.sw} opacity={shape.opacity}
          transform={shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined}
        />
      );
    case "rect":
      return (
        <rect
          key={i}
          x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx}
          fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.sw} opacity={shape.opacity}
        />
      );
    case "path":
      return (
        <path
          key={i}
          d={shape.d}
          fill={shape.fill ?? "none"} stroke={shape.stroke} strokeWidth={shape.sw}
          strokeLinecap={shape.cap} opacity={shape.opacity}
        />
      );
    case "polygon":
      return (
        <polygon
          key={i}
          points={shape.points}
          fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.sw} opacity={shape.opacity}
        />
      );
    case "line":
      return (
        <line
          key={i}
          x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2}
          stroke={shape.stroke} strokeWidth={shape.sw} strokeLinecap={shape.cap}
        />
      );
    default:
      return null;
  }
}

// Generic renderer for every ICON_REGISTRY recipe — one component instead of
// 74 hand-written ones. Entrance is a lively spring pop-in (same energy as
// Mascot's celebrate/dance), settling into a slow idle bob so the picture
// stays alive without stealing focus; hover/tap bounce doubles as a tap
// affordance since these also sit inside answer-option buttons. Timings are
// kept gentle and non-repeating-fast — no strobing, nothing near 3 flashes/
// sec — per the app's accessibility-first design.
export function QuizIllustration({ assetKey, size = 96, className }: QuizIllustrationProps): JSX.Element | null {
  const recipe = ICON_REGISTRY[assetKey];
  if (!recipe) return null;

  const viewBox = recipe.viewBox ?? "0 0 100 100";

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size, display: "inline-block" }}
      initial={{ opacity: 0, scale: 0, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 14, mass: 0.9 }}
      whileHover={{ scale: 1.08, rotate: 3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.92, rotate: -2, transition: { duration: 0.1 } }}
    >
      <motion.div
        style={{ width: size, height: size, filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.15))" }}
        animate={{ y: [0, -3, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <svg viewBox={viewBox} width={size} height={size}>
          {recipe.shapes.map(renderShape)}
        </svg>
      </motion.div>
    </motion.div>
  );
}
