"use client";

/**
 * Family scene for the Parent hero.
 *
 * A light-background sibling to the console's ParentChildIllustration. That
 * one is painted for the deep-blue vibrant banner — its figures are solid
 * white, which would vanish entirely on the light hero this dashboard now
 * uses. Rather than recolour a shared asset that other surfaces depend on,
 * this is a separate scene tuned for a pale sky ground.
 *
 * House rules kept from the rest of the illustration set: flat geometry,
 * stylised figures with no facial features, a small fixed palette, and one
 * slow ambient motion per element so nothing pulses in unison.
 */

import { motion } from "framer-motion";

/** Tuned for a #EAF4FF–#DCEBFF ground: mid-tones carry, no white-on-white. */
const P = {
  ink: "#1E3A8A",
  parent: "#3B82F6",
  child: "#38BDF8",
  skin: "#F8FAFF",
  page: "#FFFFFF",
  pageEdge: "#93C5FD",
  amber: "#FBBF24",
  rose: "#FB7185",
  wash: "#BFDBFE",
};

const drift = (delay = 0, distance = 4) => ({
  animate: { y: [0, -distance, 0] },
  transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const, delay },
});

export function FamilyIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="fam-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fam-page" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFF6FF" />
        </linearGradient>
      </defs>

      {/* Soft room glow behind the pair */}
      <circle cx="160" cy="104" r="90" fill="url(#fam-halo)" />
      <path d="M52 168 A108 108 0 0 1 268 168 Z" fill={P.wash} opacity="0.45" />

      {/* Home cue — a simple window frame, keeps the scene domestic
          without drawing a whole room */}
      <g opacity="0.5">
        <rect x="228" y="42" width="56" height="52" rx="6" fill={P.page} stroke={P.pageEdge} strokeWidth="2" />
        <path d="M256 42 L256 94 M228 68 L284 68" stroke={P.pageEdge} strokeWidth="1.6" />
      </g>
      <motion.g {...drift(2.2, 4)} opacity="0.75">
        <rect x="38" y="120" width="26" height="34" rx="3" fill={P.page} stroke={P.pageEdge} strokeWidth="1.8" />
        <rect x="44" y="128" width="14" height="2.6" rx="1.3" fill={P.pageEdge} />
        <rect x="44" y="134" width="10" height="2.6" rx="1.3" fill={P.pageEdge} />
      </motion.g>

      {/* Parent */}
      <motion.g {...drift(0, 3)}>
        <circle cx="124" cy="70" r="20" fill={P.skin} stroke={P.parent} strokeWidth="2.5" />
        <path d="M104 66 A20 20 0 0 1 144 66 Q124 56 104 66 Z" fill={P.ink} />
        <path d="M124 94 Q154 96 154 168 L94 168 Q94 96 124 94 Z" fill={P.parent} />
        {/* arm around the child */}
        <path
          d="M152 118 Q178 112 192 124"
          stroke={P.parent}
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>

      {/* Child */}
      <motion.g {...drift(1.4, 3)}>
        <circle cx="198" cy="98" r="15" fill={P.skin} stroke={P.child} strokeWidth="2.5" />
        <path d="M183 95 A15 15 0 0 1 213 95 Q198 87 183 95 Z" fill={P.ink} />
        <path d="M198 118 Q222 120 222 168 L174 168 Q174 120 198 118 Z" fill={P.child} />
      </motion.g>

      {/* Shared open book */}
      <motion.g
        animate={{ rotate: [0, 1.6, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "160px 150px" }}
      >
        <path d="M160 148 Q132 134 102 142 L102 174 Q132 166 160 180 Z" fill="url(#fam-page)" stroke={P.pageEdge} strokeWidth="1.8" />
        <path d="M160 148 Q188 134 218 142 L218 174 Q188 166 160 180 Z" fill="url(#fam-page)" stroke={P.pageEdge} strokeWidth="1.8" />
        <path d="M160 148 L160 180" stroke={P.pageEdge} strokeWidth="2" />
        {[154, 162].map((y, i) => (
          <g key={y} opacity="0.6">
            <path d={`M112 ${y + i} L148 ${y - 2 + i}`} stroke={P.pageEdge} strokeWidth="2.2" strokeLinecap="round" />
            <path d={`M172 ${y - 2 + i} L208 ${y + i}`} stroke={P.pageEdge} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        ))}
      </motion.g>

      {/* One slow heartbeat above the pair */}
      <motion.path
        d="M162 40 C162 32 150 28 145 36 C140 44 162 58 162 58 C162 58 184 44 179 36 C174 28 162 32 162 40 Z"
        fill={P.rose}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "162px 43px" }}
      />

      <motion.circle cx="72" cy="72" r="3.2" fill={P.amber} opacity="0.9" {...drift(0.9, 6)} />
      <motion.circle cx="286" cy="140" r="2.6" fill={P.child} opacity="0.9" {...drift(1.6, 5)} />
    </svg>
  );
}
