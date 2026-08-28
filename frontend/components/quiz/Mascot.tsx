"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type MascotMood = "idle" | "happy" | "encourage" | "celebrate" | "dance";

interface MascotProps {
  mood: MascotMood;
  size?: number;
  className?: string;
  /** Disable the click-for-a-little-cheer interaction (e.g. inside a
   * read-only context). Defaults to interactive. */
  interactive?: boolean;
}

const PANDA_BLACK = "#2B2B2B";
const BOW_RED = "#F04770";

// Taller than wide — a full sitting panda (head + body + arms + legs), not
// just a floating face. `size` below is the rendered width; height follows
// this aspect ratio automatically.
const VIEW_W = 100;
const VIEW_H = 128;
const ASPECT = VIEW_H / VIEW_W;

const GLOW_COLOR: Record<MascotMood, string> = {
  idle: "var(--brand-primary)",
  dance: "var(--brand-primary)",
  happy: "#22C55E",
  celebrate: "#F5B700",
  encourage: "#60A5FA",
};

const BUBBLE: Partial<Record<MascotMood, string>> = {
  happy: "Yes! 🎉",
  encourage: "Ooh, tricky! 🤔",
  celebrate: "Amazing! 🏆",
};

// A friendly panda buddy — kept as plain SVG shapes (no external asset
// files) so it's cheap to reuse anywhere in the app that wants the same
// encouraging presence (learning modules, other assessments, the dashboard
// shell itself). Never shows a sad/frowning face, even on a wrong answer:
// "encourage" is a puzzled head-tilt + a scratch of the head, not a
// punishment — but its motion (slow side-to-side, no hop) and face (raised
// eyebrow, flat "hmm" mouth, no closed-happy eyes) are deliberately built
// from different parts than "happy" so the two are never confusable, even
// for a child too young to read the accompanying text bubble.
//
// Idle blinking, an ear wiggle, a soft floating shadow, and a click-for-a-
// cheer interaction run underneath whatever `mood` is passed in, so the
// character reads as alive even when nothing eventful is happening —
// not just a static image that occasionally plays a reaction clip.
export function Mascot({ mood, size = 88, className, interactive = true }: MascotProps) {
  const filterId = useId();
  const shadowFilterId = useId();

  // A short "cheer" burst overrides the incoming mood for a moment when
  // clicked/tapped — purely a delight touch, never changes what the caller
  // thinks the mood is (no callback, no prop mutation).
  const [burst, setBurst] = useState(false);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectiveMood: MascotMood = burst ? "happy" : mood;

  const handleTap = () => {
    if (!interactive) return;
    setBurst(true);
    if (burstTimer.current) clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(false), 1100);
  };
  useEffect(() => () => { if (burstTimer.current) clearTimeout(burstTimer.current); }, []);

  // Idle blink — randomized interval so it never looks metronomic. Skipped
  // for the "happy-face" moods since those already draw closed/curved eyes.
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = 2200 + Math.random() * 2600;
      closeTimer = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 140);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(closeTimer);
  }, []);

  const isHappyFace = effectiveMood === "celebrate" || effectiveMood === "happy" || effectiveMood === "dance";
  const bubbleText = BUBBLE[effectiveMood];
  const height = size * ASPECT;

  const bodyAnimation =
    effectiveMood === "celebrate"
      ? { y: [0, -14, 0, -8, 0], rotate: [0, -10, 10, -8, 0], scale: [1, 1.18, 1.05, 1.12, 1] }
      : effectiveMood === "happy"
      ? { y: [0, -20, 0, -8, 0], scale: [1, 1.12, 1, 1.05, 1] }
      : effectiveMood === "encourage"
      ? { rotate: [0, -9, 6, -5, 0] }
      : effectiveMood === "dance"
      ? { y: [0, -12, 0, -6, 0], rotate: [0, -10, 10, -8, 0], scale: [1, 1.05, 1, 1.05, 1] }
      : { y: [0, -5, 0], rotate: [0, 1.5, 0, -1.5, 0] };

  const bodyTransition =
    effectiveMood === "idle"
      ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const }
      : effectiveMood === "dance" || effectiveMood === "celebrate"
      ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
      : effectiveMood === "encourage"
      ? { duration: 1, ease: "easeInOut" as const }
      : { duration: 0.7, ease: "easeOut" as const };

  // Ears get a tiny life-of-their-own wiggle, offset from the body's own
  // motion so the whole thing doesn't move as one rigid unit.
  const earAnimation =
    effectiveMood === "idle"
      ? { rotate: [0, 4, 0, -4, 0] }
      : effectiveMood === "dance" || effectiveMood === "celebrate"
      ? { rotate: [-6, 6, -6] }
      : { rotate: 0 };
  const earTransition =
    effectiveMood === "idle"
      ? { duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay: 0.4 }
      : effectiveMood === "dance" || effectiveMood === "celebrate"
      ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" as const }
      : { duration: 0.4 };

  // Left arm: a cheerful raised-arm wave for happy/celebrate/dance, static
  // otherwise. Kept separate from the right arm so "encourage" can move
  // just one arm (scratching its head) while this one stays put — a right
  // /left split reads as a distinct gesture rather than a mirrored bounce.
  const leftArmAnimation =
    effectiveMood === "celebrate"
      ? { rotate: [-90, -70, -90] }
      : effectiveMood === "happy"
      ? { rotate: [0, -110, -95] }
      : effectiveMood === "dance"
      ? { rotate: [-18, 18, -18] }
      : { rotate: 0 };

  const leftArmTransition =
    effectiveMood === "celebrate" || effectiveMood === "dance"
      ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
      : { duration: 0.5, ease: "easeOut" as const };

  // Right arm: mirrors the left for happy/celebrate/dance, but scratches
  // near the ear for "encourage" — the one gesture on this mascot that
  // only ever plays for a wrong answer.
  const rightArmAnimation =
    effectiveMood === "celebrate"
      ? { rotate: [90, 70, 90] }
      : effectiveMood === "happy"
      ? { rotate: [0, 110, 95] }
      : effectiveMood === "dance"
      ? { rotate: [18, -18, 18] }
      : effectiveMood === "encourage"
      ? { rotate: [0, -75, -65, -78, -65] }
      : { rotate: 0 };

  const rightArmTransition =
    effectiveMood === "celebrate" || effectiveMood === "dance"
      ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
      : effectiveMood === "encourage"
      ? { duration: 1.1, ease: "easeInOut" as const }
      : { duration: 0.5, ease: "easeOut" as const };

  const glowAnimation =
    effectiveMood === "idle"
      ? { opacity: [0.08, 0.18, 0.08] }
      : effectiveMood === "dance"
      ? { opacity: [0.15, 0.3, 0.15] }
      : effectiveMood === "celebrate"
      ? { opacity: [0.25, 0.45, 0.25] }
      : { opacity: [0, 0.4, 0.25] };

  const glowTransition =
    effectiveMood === "idle" || effectiveMood === "dance" || effectiveMood === "celebrate"
      ? { duration: effectiveMood === "idle" ? 3.2 : 1.2, repeat: Infinity, ease: "easeInOut" as const }
      : { duration: 0.8, ease: "easeOut" as const };

  // The floating shadow breathes opposite the body bob — body up, shadow
  // shrinks — the cheapest possible cue that it's airborne, not glued down.
  const shadowAnimation =
    effectiveMood === "celebrate" || effectiveMood === "happy"
      ? { scaleX: [1, 0.7, 0.85, 0.78, 1], opacity: [0.22, 0.12, 0.18, 0.14, 0.22] }
      : effectiveMood === "dance"
      ? { scaleX: [1, 0.8, 1], opacity: [0.22, 0.15, 0.22] }
      : { scaleX: [1, 0.92, 1], opacity: [0.2, 0.16, 0.2] };
  const shadowTransition = bodyTransition;

  return (
    <div
      className={`relative inline-block select-none ${interactive ? "cursor-pointer" : ""} ${className ?? ""}`}
      style={{ width: size, height }}
      onClick={handleTap}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? "Panda companion — tap for a cheer" : undefined}
    >
      <AnimatePresence>
        {bubbleText && (
          <motion.div
            key={`${effectiveMood}-bubble`}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-10 whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-text-primary shadow-md border border-border-primary"
            style={{ top: -26 }}
          >
            {bubbleText}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileTap={interactive ? { scale: 0.92 } : undefined}
        style={{ width: size, height, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" }}
        animate={bodyAnimation}
        transition={bodyTransition}
      >
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width={size} height={height}>
          <defs>
            <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter id={shadowFilterId} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <radialGradient id={`${filterId}-cheek`} cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#FFB3C6" />
              <stop offset="100%" stopColor="#FF9EB1" />
            </radialGradient>
          </defs>

          {/* ambient glow — color-coded per mood so right/wrong reads even
              before the face registers (green = happy, blue = try again,
              gold = celebrating, brand-tinted = just idling) */}
          <motion.circle
            cx="50" cy="62" r="46"
            fill={GLOW_COLOR[effectiveMood]}
            filter={`url(#${filterId})`}
            animate={glowAnimation}
            transition={glowTransition}
          />

          {/* grounding shadow — sells the idle float/bounce */}
          <motion.ellipse
            cx="50" cy="123" rx="26" ry="5"
            fill="#000000"
            filter={`url(#${shadowFilterId})`}
            style={{ transformOrigin: "50px 123px" }}
            animate={shadowAnimation}
            transition={shadowTransition}
          />

          {/* legs/feet peek out from under the body */}
          <ellipse cx="35" cy="118" rx="10" ry="8" fill={PANDA_BLACK} />
          <ellipse cx="65" cy="118" rx="10" ry="8" fill={PANDA_BLACK} />

          {/* body */}
          <ellipse cx="50" cy="97" rx="27" ry="25" fill="#FFFFFF" stroke="#E7E7E7" strokeWidth="1.5" />

          {/* arms */}
          <motion.ellipse
            cx="21" cy="88" rx="9.5" ry="14"
            style={{ fill: PANDA_BLACK, transformOrigin: "21px 79px" }}
            animate={leftArmAnimation}
            transition={leftArmTransition}
          />
          <motion.ellipse
            cx="79" cy="88" rx="9.5" ry="14"
            style={{ fill: PANDA_BLACK, transformOrigin: "79px 79px" }}
            animate={rightArmAnimation}
            transition={rightArmTransition}
          />

          {/* ears — drawn behind the head so they peek out at the top, each
              with its own subtle wiggle so the head doesn't feel rigid */}
          <motion.circle
            cx="27" cy="15" r="13" fill={PANDA_BLACK}
            style={{ transformOrigin: "27px 28px" }}
            animate={earAnimation}
            transition={earTransition}
          />
          <motion.circle
            cx="73" cy="15" r="13" fill={PANDA_BLACK}
            style={{ transformOrigin: "73px 28px" }}
            animate={{ ...earAnimation, rotate: Array.isArray(earAnimation.rotate) ? (earAnimation.rotate as number[]).map((v) => -v) : earAnimation.rotate }}
            transition={{ ...earTransition, delay: ((earTransition as { delay?: number }).delay ?? 0) + 0.15 }}
          />

          {/* a small bow for a touch of color/personality */}
          <g transform="translate(69, 6) rotate(-18)">
            <path d="M0 0 L-7 -4 L-7 4 Z" fill={BOW_RED} />
            <path d="M0 0 L7 -4 L7 4 Z" fill={BOW_RED} />
            <circle cx="0" cy="0" r="2.2" fill="#C23458" />
          </g>

          {/* head */}
          <circle cx="50" cy="40" r="30" fill="#FFFFFF" stroke="#E7E7E7" strokeWidth="1.5" />

          {/* eye patches */}
          <ellipse cx="39" cy="34" rx="8.5" ry="11" fill={PANDA_BLACK} transform="rotate(-10 39 34)" />
          <ellipse cx="61" cy="34" rx="8.5" ry="11" fill={PANDA_BLACK} transform="rotate(10 61 34)" />

          {/* cheeks — soft gradient instead of flat pink for a little more depth */}
          <circle cx="28" cy="46" r="4.5" fill={`url(#${filterId}-cheek)`} opacity={0.6} />
          <circle cx="72" cy="46" r="4.5" fill={`url(#${filterId}-cheek)`} opacity={0.6} />

          {/* eyebrows — only for "encourage": one raised, one furrowed,
              the clearest single signal that this is NOT a happy reaction */}
          {effectiveMood === "encourage" && (
            <motion.g
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <path d="M32 22 Q39 17 46 21" stroke={PANDA_BLACK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
              <path d="M56 24 Q61 20 68 23" stroke={PANDA_BLACK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            </motion.g>
          )}

          {/* eyes — white so they read clearly against the black patches.
              A blink overlay (two thin closing lids) plays on top of the
              open-round eyes on a randomized idle timer, skipped for the
              happy-face moods which already draw closed/curved eyes. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.g key={isHappyFace ? "happy-eyes" : "normal-eyes"}>
              {isHappyFace ? (
                <>
                  <path d="M34 34 Q39 28 44 34" stroke="white" strokeWidth={3} fill="none" strokeLinecap="round" />
                  <path d="M56 34 Q61 28 66 34" stroke="white" strokeWidth={3} fill="none" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="39" cy="35" r="3.6" fill="white" />
                  <circle cx="61" cy="35" r="3.6" fill="white" />
                  {blinking && (
                    <motion.rect
                      x="33" y="33.5" width="12" height="3.2" rx="1.6" fill={PANDA_BLACK}
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }}
                      style={{ transformOrigin: "39px 35px" }}
                    />
                  )}
                  {blinking && (
                    <motion.rect
                      x="55" y="33.5" width="12" height="3.2" rx="1.6" fill={PANDA_BLACK}
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }}
                      style={{ transformOrigin: "61px 35px" }}
                    />
                  )}
                </>
              )}
            </motion.g>
          </AnimatePresence>

          {/* nose */}
          <ellipse cx="50" cy="45" rx="4" ry="3" fill={PANDA_BLACK} />

          {/* mouth — always warm, never a frown. "encourage" gets a flat,
              slightly wavy "hmm" instead of any curve that could read as
              a smile, so it's unmistakably not the happy reaction. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.path
              key={effectiveMood}
              d={
                effectiveMood === "celebrate"
                  ? "M36 50 Q50 68 64 50"
                  : effectiveMood === "happy"
                  ? "M35 50 Q50 66 65 50"
                  : effectiveMood === "dance"
                  ? "M38 50 Q50 62 62 50"
                  : effectiveMood === "encourage"
                  ? "M41 52 Q45 55 49 52 Q53 49 57 52"
                  : "M42 51 Q50 55 58 51"
              }
              stroke={PANDA_BLACK}
              strokeWidth={2.8}
              fill="none"
              strokeLinecap="round"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
          </AnimatePresence>

          {/* music notes while dancing — signals "having fun", not "waiting" */}
          {effectiveMood === "dance" && (
            <>
              <motion.text
                x="8" y="22" fontSize="13"
                initial={{ opacity: 0, y: 0, rotate: -10 }}
                animate={{ opacity: [0, 1, 0], y: -10, rotate: 10 }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.2 }}
              >
                🎵
              </motion.text>
              <motion.text
                x="78" y="18" fontSize="12"
                initial={{ opacity: 0, y: 0, rotate: 10 }}
                animate={{ opacity: [0, 1, 0], y: -8, rotate: -10 }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4, delay: 0.3 }}
              >
                🎶
              </motion.text>
            </>
          )}

          {/* sparkles on celebrate */}
          {effectiveMood === "celebrate" && (
            <>
              <motion.text
                x="4" y="20" fontSize="14"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -8 }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.3 }}
              >
                ✨
              </motion.text>
              <motion.text
                x="82" y="16" fontSize="12"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -6 }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5, delay: 0.2 }}
              >
                ✨
              </motion.text>
            </>
          )}

          {/* a faint, occasional sparkle even at rest — the "still alive"
              heartbeat for the idle state specifically */}
          {effectiveMood === "idle" && (
            <motion.text
              x="80" y="20" fontSize="10"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0, 0.9, 0], scale: [0.6, 0.6, 1, 0.6] }}
              transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
            >
              ✨
            </motion.text>
          )}

          {/* a small "?" while puzzling over a wrong answer */}
          {effectiveMood === "encourage" && (
            <motion.text
              x="70" y="14" fontSize="16"
              initial={{ opacity: 0, y: 4, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -6, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              ❓
            </motion.text>
          )}
        </svg>
      </motion.div>
    </div>
  );
}
