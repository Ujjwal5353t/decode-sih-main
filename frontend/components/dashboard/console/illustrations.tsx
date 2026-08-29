"use client";

/**
 * Editorial illustrations for the Admin / Teacher / Parent dashboard heroes.
 *
 * Hand-built flat SVG rather than a stock illustration pack: no dependency,
 * no licensing, a few KB each, and — most importantly — they inherit the
 * theme's own tokens, so they recolour correctly in dark mode instead of
 * sitting on the page as a bright rectangle.
 *
 * House style, applied consistently across all three:
 *   · Geometric flat shapes, no gradients beyond one soft ground wash.
 *   · Figures are stylised — no facial features. A dashboard illustration
 *     that stares at you reads as clip art; silhouettes read as editorial.
 *   · Five colours maximum per scene, drawn from the brand palette.
 *   · One slow ambient motion each (a page turn, a wave, a bounce), which
 *     framer-motion drops automatically under prefers-reduced-motion via the
 *     <ConsoleMotion> MotionConfig wrapper these render inside.
 */

import { motion } from "framer-motion";
import { EASE } from "./motion";

/** Shared palette — semantic names so a scene reads as composition, not hex. */
const C = {
  ink: "var(--brand-deep)",
  brand: "var(--brand-primary)",
  light: "var(--brand-light)",
  sky: "var(--accent-sky)",
  cyan: "var(--accent-cyan)",
  lavender: "var(--accent-violet)",
  amber: "var(--accent-amber)",
  paper: "var(--c-panel)",
  wash: "var(--c-sunken)",
};

/** Slow, small, and offset per element so nothing pulses in unison. */
const drift = (delay = 0, distance = 4) => ({
  animate: { y: [0, -distance, 0] },
  transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const, delay },
});

// ── School Admin ──────────────────────────────────────────────────────────────

/**
 * Administration, not just "a school".
 *
 * The scene is a civic/institutional facade — colonnade, pediment, flag — with
 * the two artefacts an administrator actually works in front of floating
 * either side of it: a class register on the left, a cohort analytics card on
 * the right, plus an accreditation seal. Governance and oversight, rather
 * than a generic campus.
 *
 * PALETTE NOTE — this one does NOT use the theme tokens the other scenes use.
 * It is rendered on the hero's fixed blue gradient (#1E40AF → #3B82F6) in both
 * light and dark mode, so `var(--brand-primary)` would paint blue-on-blue and
 * disappear. The palette below is therefore fixed and tuned for that banner:
 * white and white-alpha carry the structure, amber and cyan do the accents.
 */
const ADMIN = {
  white: "#FFFFFF",
  line: "rgba(255,255,255,0.55)",
  fill: "rgba(255,255,255,0.16)",
  fillSoft: "rgba(255,255,255,0.09)",
  navy: "#1E3A8A",
  navySoft: "#3B6BD6",
  amber: "#FBBF24",
  cyan: "#67E8F9",
};

export function SchoolIllustration({ className }: { className?: string }) {
  const A = ADMIN;
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="admin-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.20" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="admin-card" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8F0FF" />
        </linearGradient>
      </defs>

      {/* Ambient halo behind the institution */}
      <circle cx="160" cy="104" r="86" fill="url(#admin-halo)" />

      {/* ── Institutional facade ─────────────────────────────────────────── */}
      <g>
        {/* Pediment */}
        <path d="M108 92 L160 62 L212 92 Z" fill={A.white} opacity="0.95" />
        <path d="M120 92 L160 72 L200 92 Z" fill={A.navySoft} opacity="0.35" />

        {/* Entablature */}
        <rect x="110" y="92" width="100" height="11" rx="2" fill={A.white} opacity="0.9" />

        {/* Colonnade — the civic/administration cue */}
        {[122, 141, 160, 179, 198].map((x) => (
          <g key={x}>
            <rect x={x - 4.5} y="103" width="9" height="42" rx="1.5" fill={A.white} opacity="0.82" />
            <rect x={x - 4.5} y="103" width="3" height="42" fill={A.navySoft} opacity="0.18" />
          </g>
        ))}

        {/* Stylobate / steps */}
        <rect x="106" y="145" width="108" height="6" rx="2" fill={A.white} opacity="0.9" />
        <rect x="99" y="151" width="122" height="6" rx="2" fill={A.white} opacity="0.62" />
        <rect x="92" y="157" width="136" height="6" rx="2" fill={A.white} opacity="0.36" />

        {/* Flag — the only ambient motion on the facade */}
        <rect x="159" y="34" width="2.5" height="30" rx="1.25" fill={A.white} opacity="0.8" />
        <motion.path
          d="M161.5 38 L184 44 L161.5 50 Z"
          fill={A.amber}
          animate={{ scaleX: [1, 0.84, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "161.5px 44px" }}
        />
      </g>

      {/* ── Left: class register ─────────────────────────────────────────── */}
      <motion.g {...drift(0.4, 5)} style={{ transformOrigin: "58px 118px" }}>
        <g transform="rotate(-7 58 118)">
          <rect x="18" y="86" width="80" height="64" rx="7" fill="url(#admin-card)" />
          <rect x="18" y="86" width="80" height="15" rx="7" fill={A.navy} opacity="0.9" />
          <rect x="18" y="94" width="80" height="7" fill={A.navy} opacity="0.9" />
          <rect x="25" y="91" width="26" height="4" rx="2" fill={A.white} opacity="0.75" />

          {/* roster rows: avatar dot + name line + tick */}
          {[110, 124, 138].map((y, i) => (
            <g key={y}>
              <circle cx="31" cy={y} r="4.5" fill={A.navySoft} opacity="0.55" />
              <rect x="40" y={y - 2.5} width="34" height="5" rx="2.5" fill={A.navy} opacity="0.22" />
              <path
                d={`M82 ${y} l3 3 l6 -7`}
                stroke={i === 2 ? A.amber : "#16A34A"}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          ))}
        </g>
      </motion.g>

      {/* ── Right: cohort analytics ──────────────────────────────────────── */}
      <motion.g {...drift(1.5, 5)} style={{ transformOrigin: "262px 108px" }}>
        <g transform="rotate(7 262 108)">
          <rect x="224" y="74" width="78" height="68" rx="7" fill="url(#admin-card)" />
          <rect x="232" y="83" width="30" height="4.5" rx="2.25" fill={A.navy} opacity="0.3" />

          {/* animated column chart */}
          {[
            { x: 234, h: 20, c: A.navySoft },
            { x: 250, h: 32, c: A.navy },
            { x: 266, h: 14, c: A.navySoft },
            { x: 282, h: 26, c: A.amber },
          ].map((b, i) => (
            <motion.rect
              key={b.x}
              x={b.x}
              width="10"
              rx="3"
              fill={b.c}
              initial={{ height: 0, y: 130 }}
              animate={{ height: b.h, y: 130 - b.h }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.35 + i * 0.11 }}
            />
          ))}
          <rect x="232" y="132" width="62" height="2" rx="1" fill={A.navy} opacity="0.18" />
        </g>
      </motion.g>

      {/* ── Accreditation seal ───────────────────────────────────────────── */}
      <motion.g {...drift(0.9, 4)}>
        <circle cx="252" cy="176" r="17" fill={A.white} opacity="0.95" />
        <circle cx="252" cy="176" r="13" fill="none" stroke={A.navy} strokeWidth="1.4" strokeOpacity="0.35" strokeDasharray="2.5 3" />
        <path
          d="M246 176 l4 4.5 l8 -9.5"
          stroke="#16A34A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* ribbon tails */}
        <path d="M245 190 l-3 12 l7 -4 l6 4 l-3 -12 Z" fill={A.amber} opacity="0.9" />
      </motion.g>

      {/* ── Graduation cap ───────────────────────────────────────────────── */}
      <motion.g {...drift(2.1, 5)}>
        <path d="M52 52 L74 44 L96 52 L74 60 Z" fill={A.white} opacity="0.95" />
        <path d="M62 56 L62 66 Q74 72 86 66 L86 56 L74 61 Z" fill={A.cyan} opacity="0.85" />
        <path d="M96 52 L96 66" stroke={A.amber} strokeWidth="2" strokeLinecap="round" />
        <circle cx="96" cy="68" r="2.6" fill={A.amber} />
      </motion.g>

      {/* Restrained sparkle accents */}
      <motion.circle cx="292" cy="46" r="3" fill={A.cyan} opacity="0.75" {...drift(1.1, 6)} />
      <motion.circle cx="30" cy="62" r="2.4" fill={A.amber} opacity="0.8" {...drift(2.4, 5)} />
      <motion.circle cx="300" cy="196" r="2.2" fill={A.white} opacity="0.5" {...drift(0.6, 4)} />
    </svg>
  );
}

// ── Student ───────────────────────────────────────────────────────────────────

/**
 * A learner rising out of an open book, ringed by their own progress.
 *
 * Echoes the brand mark (child + open book) deliberately, so the dashboard
 * greeting and the logo in the sidebar feel like the same product. The
 * progress arc is decorative, not a data readout — it draws once and stops.
 *
 * Palette is the fixed ADMIN set, not theme tokens: this renders on the
 * hero's blue gradient in both light and dark mode.
 */
export function StudentIllustration({ className }: { className?: string }) {
  const A = ADMIN;
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="stu-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="stu-screen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E6EEFF" />
        </linearGradient>
        <linearGradient id="stu-desk" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <circle cx="160" cy="104" r="90" fill="url(#stu-halo)" />

      {/* ── Learner at a desk, working ──────────────────────────────────── */}

      {/* Chair back, behind the figure */}
      <path d="M118 128 Q118 112 134 112 L134 168 L118 168 Z" fill={A.white} opacity="0.18" />

      {/* Figure — seated, leaning slightly toward the screen */}
      <motion.g {...drift(0, 3)}>
        {/* torso */}
        <path d="M132 172 Q132 128 156 128 Q180 128 180 172 Z" fill={A.cyan} opacity="0.95" />
        {/* head */}
        <circle cx="156" cy="108" r="19" fill={A.white} />
        {/* hair — a soft cap with a side sweep, reads young without a face */}
        <path
          d="M137 105 A19 19 0 0 1 175 105 Q166 96 156 98 Q145 100 137 105 Z"
          fill={A.navy}
          opacity="0.88"
        />
        {/* collar detail */}
        <path d="M148 130 L156 140 L164 130" stroke={A.white} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
        {/* forward arm resting on the desk */}
        <path
          d="M176 148 Q196 150 202 158"
          stroke={A.cyan}
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
      </motion.g>

      {/* ── Desk ────────────────────────────────────────────────────────── */}
      <rect x="86" y="166" width="150" height="7" rx="3.5" fill="url(#stu-desk)" />
      <rect x="98" y="173" width="6" height="26" rx="3" fill={A.white} opacity="0.45" />
      <rect x="218" y="173" width="6" height="26" rx="3" fill={A.white} opacity="0.45" />

      {/* ── Open workbook on the desk ───────────────────────────────────── */}
      <g>
        <path d="M120 166 Q104 158 90 161 L90 152 Q104 149 120 157 Z" fill={A.white} opacity="0.95" />
        <path d="M120 166 Q136 158 150 161 L150 152 Q136 149 120 157 Z" fill={A.white} opacity="0.8" />
        <path d="M96 155 L114 159" stroke={A.navy} strokeOpacity="0.22" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M126 159 L144 155" stroke={A.navy} strokeOpacity="0.22" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      {/* ── Lesson screen, angled on the desk ───────────────────────────── */}
      <motion.g {...drift(1.1, 4)}>
        <g transform="rotate(-4 214 128)">
          <rect x="176" y="90" width="76" height="60" rx="7" fill="url(#stu-screen)" />
          {/* screen header */}
          <rect x="184" y="98" width="24" height="4.5" rx="2.25" fill={A.navy} opacity="0.3" />
          {/* three lesson progress bars, filling on mount */}
          {[
            { y: 110, w: 52, c: A.navySoft, d: 0.35 },
            { y: 122, w: 38, c: A.cyan, d: 0.5 },
            { y: 134, w: 26, c: A.amber, d: 0.65 },
          ].map((b) => (
            <g key={b.y}>
              <rect x="184" y={b.y} width="60" height="6" rx="3" fill={A.navy} opacity="0.1" />
              <motion.rect
                x="184"
                y={b.y}
                height="6"
                rx="3"
                fill={b.c}
                initial={{ width: 0 }}
                animate={{ width: b.w }}
                transition={{ duration: 0.7, ease: EASE, delay: b.d }}
              />
            </g>
          ))}
          {/* stand */}
          <rect x="206" y="150" width="16" height="5" rx="2" fill={A.white} opacity="0.6" />
        </g>
      </motion.g>

      {/* ── Achievement badge, awarded above ────────────────────────────── */}
      <motion.g {...drift(0.7, 6)}>
        <circle cx="252" cy="52" r="19" fill={A.white} opacity="0.97" />
        <circle cx="252" cy="52" r="14" fill="none" stroke={A.amber} strokeWidth="2" />
        <path
          d="M252 43 l2.6 5.4 5.9 0.8 -4.3 4.1 1 5.9 -5.2 -2.8 -5.2 2.8 1 -5.9 -4.3 -4.1 5.9 -0.8 Z"
          fill={A.amber}
        />
        {/* ribbon tails */}
        <path d="M245 69 l-3 13 l10 -5 l10 5 l-3 -13 Z" fill={A.cyan} opacity="0.9" />
      </motion.g>

      {/* ── Floating knowledge cues ─────────────────────────────────────── */}
      {/* Lightbulb — the idea landing */}
      <motion.g {...drift(1.8, 5)}>
        <circle cx="66" cy="62" r="14" fill={A.white} opacity="0.95" />
        <path
          d="M66 54 a7 7 0 0 0 -4 12.6 l0 2.4 l8 0 l0 -2.4 A7 7 0 0 0 66 54 Z"
          fill={A.amber}
        />
        <rect x="63" y="70" width="6" height="2.6" rx="1.3" fill={A.navy} opacity="0.45" />
        {/* radiating ticks */}
        <path d="M66 40 L66 45" stroke={A.amber} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M48 62 L53 62" stroke={A.amber} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M52 48 L56 52" stroke={A.amber} strokeWidth="2.4" strokeLinecap="round" />
      </motion.g>

      {/* Pencil */}
      <motion.g {...drift(2.4, 4)}>
        <g transform="rotate(34 64 132)">
          <rect x="58" y="112" width="12" height="30" rx="2.5" fill={A.white} opacity="0.95" />
          <rect x="58" y="112" width="12" height="7" rx="2.5" fill={A.cyan} />
          <path d="M58 142 L64 153 L70 142 Z" fill={A.amber} />
        </g>
      </motion.g>

      {/* Restrained sparkles */}
      <motion.circle cx="292" cy="112" r="3" fill={A.cyan} opacity="0.7" {...drift(1.2, 6)} />
      <motion.circle cx="36" cy="164" r="2.4" fill={A.white} opacity="0.5" {...drift(2.0, 4)} />
      <motion.circle cx="286" cy="186" r="2.2" fill={A.amber} opacity="0.7" {...drift(0.5, 5)} />
    </svg>
  );
}

// ── Teacher ───────────────────────────────────────────────────────────────────

/**
 * A teacher presenting at a board, with the class seated in front. The board's
 * trend line draws itself once on mount — the lesson being delivered, not a
 * chart of anything real.
 */
export function ClassroomIllustration({ className }: { className?: string }) {
  const A = ADMIN;
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="tea-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.20" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tea-board" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E4EDFF" />
        </linearGradient>
      </defs>

      <circle cx="150" cy="102" r="88" fill="url(#tea-halo)" />

      {/* Board */}
      <g>
        <rect x="42" y="30" width="164" height="98" rx="7" fill="url(#tea-board)" />
        <rect x="42" y="128" width="164" height="6" rx="3" fill={A.navySoft} opacity="0.7" />

        {/* Heading rules */}
        <rect x="58" y="44" width="52" height="5" rx="2.5" fill={A.navy} opacity="0.28" />
        <rect x="58" y="55" width="32" height="5" rx="2.5" fill={A.navy} opacity="0.16" />

        {/* Trend line, drawn once */}
        <motion.path
          d="M60 112 L92 92 L120 100 L150 68 L188 56"
          stroke={A.navy}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.15, ease: EASE, delay: 0.3 }}
          opacity="0.6"
        />
        <motion.circle
          cx="188"
          cy="56"
          r="5"
          fill={A.amber}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: EASE, delay: 1.4 }}
        />
      </g>

      {/* Teacher, gesturing at the board */}
      <motion.g {...drift(0, 4)}>
        <circle cx="252" cy="70" r="17" fill={A.white} />
        <path d="M235 66 A17 17 0 0 1 269 66 Q252 57 235 66 Z" fill={A.navy} opacity="0.85" />
        <path d="M252 92 Q276 94 276 154 L228 154 Q228 94 252 92 Z" fill={A.cyan} opacity="0.95" />
        <motion.path
          d="M234 104 L210 84"
          stroke={A.white}
          strokeWidth="8"
          strokeLinecap="round"
          animate={{ rotate: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "234px 104px" }}
        />
      </motion.g>

      {/* Seated class */}
      {[
        { x: 44, fill: A.white, delay: 0.4 },
        { x: 104, fill: A.amber, delay: 1.0 },
        { x: 164, fill: A.white, delay: 0.6 },
      ].map((s) => (
        <motion.g key={s.x} {...drift(s.delay, 3)}>
          <circle cx={s.x + 18} cy="150" r="9" fill={s.fill} opacity="0.92" />
          <path
            d={`M${s.x + 4} 178 Q${s.x + 4} 162 ${s.x + 18} 162 Q${s.x + 32} 162 ${s.x + 32} 178 Z`}
            fill={s.fill}
            opacity="0.75"
          />
          <rect x={s.x} y="178" width="36" height="5" rx="2.5" fill={A.white} opacity="0.4" />
        </motion.g>
      ))}

      <motion.circle cx="296" cy="40" r="3" fill={A.cyan} opacity="0.7" {...drift(1.4, 6)} />
      <motion.circle cx="26" cy="160" r="2.4" fill={A.amber} opacity="0.75" {...drift(2.3, 5)} />
    </svg>
  );
}

// ── Parent ────────────────────────────────────────────────────────────────────

/**
 * A parent and child reading together — closer-in and warmer than the staff
 * scenes, since this is the dashboard a family member opens. The heart is the
 * only ornament, and it beats slowly rather than pulsing.
 */
export function ParentChildIllustration({ className }: { className?: string }) {
  const A = ADMIN;
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="par-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.20" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="par-page" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E4EDFF" />
        </linearGradient>
      </defs>

      <circle cx="160" cy="106" r="88" fill="url(#par-halo)" />

      {/* Sofa/ground arc, suggesting a room without drawing one */}
      <path d="M52 168 A108 108 0 0 1 268 168 Z" fill={A.white} opacity="0.08" />

      {/* Parent */}
      <motion.g {...drift(0, 4)}>
        <circle cx="122" cy="66" r="20" fill={A.white} />
        <path d="M102 62 A20 20 0 0 1 142 62 Q122 52 102 62 Z" fill={A.navy} opacity="0.85" />
        <path d="M122 92 Q152 94 152 166 L92 166 Q92 94 122 92 Z" fill={A.white} opacity="0.92" />
        {/* arm around the child */}
        <path
          d="M150 116 Q176 110 190 122"
          stroke={A.white}
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
          opacity="0.92"
        />
      </motion.g>

      {/* Child */}
      <motion.g {...drift(1.4, 4)}>
        <circle cx="196" cy="96" r="15" fill={A.white} />
        <path d="M181 93 A15 15 0 0 1 211 93 Q196 85 181 93 Z" fill={A.navy} opacity="0.85" />
        <path d="M196 116 Q220 118 220 166 L172 166 Q172 118 196 116 Z" fill={A.cyan} opacity="0.95" />
      </motion.g>

      {/* Shared open book */}
      <motion.g
        animate={{ rotate: [0, 1.6, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "158px 150px" }}
      >
        <path d="M158 146 Q130 132 100 140 L100 172 Q130 164 158 178 Z" fill="url(#par-page)" />
        <path d="M158 146 Q186 132 216 140 L216 172 Q186 164 158 178 Z" fill="url(#par-page)" />
        <path d="M158 146 L158 178" stroke={A.navy} strokeWidth="2" strokeOpacity="0.25" />
        {[152, 160].map((y, i) => (
          <g key={y}>
            <path
              d={`M110 ${y + i} L146 ${y - 2 + i}`}
              stroke={A.navy}
              strokeOpacity="0.22"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d={`M170 ${y - 2 + i} L206 ${y + i}`}
              stroke={A.navy}
              strokeOpacity="0.22"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        ))}
        <path
          d="M100 172 Q130 164 158 178 Q186 164 216 172 L216 180 Q186 172 158 186 Q130 172 100 180 Z"
          fill={A.navySoft}
          opacity="0.75"
        />
      </motion.g>

      {/* A single slow heartbeat above the pair */}
      <motion.path
        d="M160 44 C160 36 148 32 143 40 C138 48 160 62 160 62 C160 62 182 48 177 40 C172 32 160 36 160 44 Z"
        fill={A.amber}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "160px 47px" }}
      />

      <motion.circle cx="266" cy="70" r="3.2" fill={A.cyan} opacity="0.7" {...drift(0.9, 6)} />
      <motion.circle cx="48" cy="82" r="2.6" fill={A.amber} opacity="0.75" {...drift(2.1, 5)} />
      <motion.circle cx="284" cy="152" r="2.4" fill={A.white} opacity="0.5" {...drift(1.5, 4)} />
    </svg>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────

/**
 * Small, quiet, monochrome — an empty state should read as "nothing here
 * yet", not compete with the page's real hero illustration.
 */
export function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <ellipse cx="60" cy="76" rx="42" ry="7" fill={C.wash} />
      <rect x="30" y="24" width="60" height="46" rx="4" fill={C.paper} stroke={C.brand} strokeWidth="2" strokeOpacity="0.35" />
      <rect x="30" y="24" width="60" height="12" rx="4" fill={C.brand} opacity="0.12" />
      <rect x="40" y="46" width="40" height="3.5" rx="1.75" fill={C.brand} opacity="0.2" />
      <rect x="40" y="55" width="26" height="3.5" rx="1.75" fill={C.brand} opacity="0.14" />
      <circle cx="90" cy="30" r="11" fill={C.paper} stroke={C.brand} strokeWidth="2" strokeOpacity="0.4" />
      <path d="M86 30 L89 33 L95 27" stroke={C.brand} strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
