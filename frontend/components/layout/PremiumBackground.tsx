"use client";

/**
 * PremiumBackground — Apple / Linear / Stripe SaaS aesthetic
 *
 * Design principles:
 * 1. Strictly blue/white palette — zero non-blue colours
 * 2. Multiple depth layers: large blurred glows → thin orbital rings → SVG curves → micro-dot grid
 * 3. Slow, deliberate movement — nothing distracts from content
 * 4. Light-theme animated orbs are hidden in dark mode via `light-only` class
 * 5. All opacities are intentionally conservative (~0.03–0.10)
 */
export function PremiumBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* ══════════════════════════════════════════════════════════════
          LAYER 1 — Large Soft Blue Atmospheric Glows (always visible,
          very low opacity so they work on both themes)
      ══════════════════════════════════════════════════════════════ */}

      {/* Top-left hero glow — sapphire anchor */}
      <div
        className="absolute"
        style={{
          top: "-8%",
          left: "-6%",
          width: "900px",
          height: "900px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(37,99,235,0.07) 0%, rgba(14,165,233,0.03) 50%, transparent 70%)",
          filter: "blur(120px)",
        }}
      />

      {/* Mid-right glow — sky blue */}
      <div
        className="absolute"
        style={{
          top: "22%",
          right: "-8%",
          width: "750px",
          height: "750px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.06) 0%, rgba(37,99,235,0.025) 55%, transparent 72%)",
          filter: "blur(100px)",
        }}
      />

      {/* Lower-left deep-blue glow */}
      <div
        className="absolute"
        style={{
          top: "55%",
          left: "-10%",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(29,78,216,0.055) 0%, rgba(37,99,235,0.02) 55%, transparent 70%)",
          filter: "blur(130px)",
        }}
      />

      {/* Bottom-right sky aura */}
      <div
        className="absolute"
        style={{
          bottom: "-5%",
          right: "5%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(14,165,233,0.05) 0%, rgba(37,99,235,0.02) 60%, transparent 75%)",
          filter: "blur(110px)",
        }}
      />

      {/* Bottom-center wide horizon glow */}
      <div
        className="absolute"
        style={{
          bottom: 0,
          left: "15%",
          width: "950px",
          height: "380px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at bottom, rgba(37,99,235,0.045) 0%, rgba(96,165,250,0.02) 60%, transparent 80%)",
          filter: "blur(90px)",
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          LAYER 2 — Light-theme only: Animated Living Orbs
          (hidden in dark mode via [data-theme="dark"] .light-only)
      ══════════════════════════════════════════════════════════════ */}

      {/* Orb A — top-left, slow drift */}
      <div
        className="light-only light-ambient-orb light-ambient-orb-a"
        style={{
          top: "6%",
          left: "4%",
          width: "620px",
          height: "620px",
          background:
            "radial-gradient(circle, rgba(37,99,235,0.05) 0%, rgba(59,130,246,0.02) 55%, transparent 72%)",
          filter: "blur(105px)",
        }}
      />

      {/* Orb B — mid-right, offset drift */}
      <div
        className="light-only light-ambient-orb light-ambient-orb-b"
        style={{
          top: "32%",
          right: "1%",
          width: "560px",
          height: "560px",
          background:
            "radial-gradient(circle, rgba(14,165,233,0.045) 0%, rgba(37,99,235,0.018) 58%, transparent 72%)",
          filter: "blur(95px)",
        }}
      />

      {/* Orb C — lower center, slow breathe */}
      <div
        className="light-only light-ambient-orb light-ambient-orb-c"
        style={{
          top: "63%",
          left: "28%",
          width: "700px",
          height: "420px",
          background:
            "radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, rgba(37,99,235,0.015) 60%, transparent 78%)",
          filter: "blur(115px)",
        }}
      />

      {/* Orb D — bottom-left accent, delayed */}
      <div
        className="light-only light-ambient-orb light-ambient-orb-a"
        style={{
          bottom: "6%",
          left: "-2%",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(29,78,216,0.04) 0%, rgba(14,165,233,0.015) 55%, transparent 70%)",
          filter: "blur(88px)",
          animationDelay: "12s",
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          LAYER 3 — Slow-rotating Orbital Rings
          Large thin rings that spin very slowly — depth and elegance.
          transform-origin defaults to element center for a:absolute divs.
          Uses ring-pulse keyframe (gentle scale+opacity) + CSS orbit.
      ══════════════════════════════════════════════════════════════ */}

      {/* Ring 1 — top-left, slow clockwise */}
      <div
        className="absolute"
        style={{
          top: "4%",
          left: "3%",
          width: "640px",
          height: "640px",
          borderRadius: "50%",
          border: "1px solid rgba(37,99,235,0.07)",
          animation: "orbit 80s linear infinite",
          boxShadow: "0 0 0 1px rgba(37,99,235,0.03) inset",
        }}
      >
        {/* Small accent dot on the ring — makes the rotation visible but subtle */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "rgba(37,99,235,0.18)",
            boxShadow: "0 0 8px rgba(37,99,235,0.25)",
          }}
        />
      </div>

      {/* Ring 2 — mid-right, counter-clockwise, slightly larger */}
      <div
        className="absolute"
        style={{
          top: "30%",
          right: "2%",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          border: "1px solid rgba(59,130,246,0.06)",
          animation: "orbit-reverse 100s linear infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "rgba(14,165,233,0.15)",
            boxShadow: "0 0 6px rgba(14,165,233,0.2)",
          }}
        />
      </div>

      {/* Ring 3 — bottom area, very slow clockwise */}
      <div
        className="absolute light-only"
        style={{
          bottom: "8%",
          left: "38%",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          border: "1px solid rgba(37,99,235,0.055)",
          animation: "orbit 120s linear infinite",
        }}
      />

      {/* Ring 4 — inner concentric to Ring 1, faster, opposite direction */}
      <div
        className="absolute"
        style={{
          top: "10%",
          left: "9%",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          border: "1px solid rgba(37,99,235,0.04)",
          animation: "orbit-reverse 60s linear infinite",
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          LAYER 4 — SVG Abstract Curves (thin 1px stroke, low opacity)
          Flowing bezier curves that give the page a sense of motion
          and sophisticated visual depth (like Stripe / Linear).
      ══════════════════════════════════════════════════════════════ */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        style={{ opacity: 0.08 }}
      >
        <defs>
          {/* Gradient along path — blue fading to transparent */}
          <linearGradient id="bg-curve-grad-1" x1="0%" y1="0%" x2="100%" y2="60%">
            <stop offset="0%"   stopColor="#2563EB" stopOpacity="0" />
            <stop offset="25%"  stopColor="#2563EB" stopOpacity="0.55" />
            <stop offset="65%"  stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="bg-curve-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#1D4ED8" stopOpacity="0" />
            <stop offset="30%"  stopColor="#2563EB" stopOpacity="0.45" />
            <stop offset="70%"  stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="bg-curve-grad-3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#1E40AF" stopOpacity="0" />
            <stop offset="40%"  stopColor="#2563EB" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Curve 1 — large sweeping arc across the top half */}
        <path
          d="M -80 600 C 300 200, 700 900, 1300 350 C 1750 50, 2200 550, 2800 280 C 3200 120, 3600 480, 4000 300"
          stroke="url(#bg-curve-grad-1)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Curve 2 — mid-page flowing line */}
        <path
          d="M -80 1300 C 400 950, 900 1600, 1600 1100 C 2100 780, 2600 1400, 3200 1050 C 3600 820, 3900 1200, 4200 980"
          stroke="url(#bg-curve-grad-2)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* Curve 3 — lower page elegant sweep */}
        <path
          d="M 200 2200 C 700 1800, 1200 2500, 1900 2050 C 2400 1720, 2900 2350, 3500 1980"
          stroke="url(#bg-curve-grad-3)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        {/* Curve 4 — very thin subtle secondary arc */}
        <path
          d="M -80 400 C 600 100, 1100 700, 1800 250 C 2300 -50, 2800 400, 3400 150"
          stroke="url(#bg-curve-grad-1)"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>

      {/* ══════════════════════════════════════════════════════════════
          LAYER 5 — Subtle Geometric Diamond / Cross Marks
          Very faint structural markers — typical of premium SaaS
          landing pages (like Vercel, Linear, Raycast).
      ══════════════════════════════════════════════════════════════ */}
      <svg
        className="absolute inset-0 w-full h-full light-only"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        style={{ opacity: 0.12 }}
      >
        {/* Corner cross mark — top right */}
        <g transform="translate(calc(100vw - 120), 80)">
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#2563EB" strokeWidth="0.8" />
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#2563EB" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="2.5" stroke="#2563EB" strokeWidth="0.6" fill="none" />
        </g>

        {/* Mid-left cross mark */}
        <g transform="translate(60, 900)">
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#3B82F6" strokeWidth="0.8" />
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#3B82F6" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="2.5" stroke="#3B82F6" strokeWidth="0.6" fill="none" />
        </g>

        {/* Bottom right cross mark */}
        <g transform="translate(calc(100vw - 80), 1800)">
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#1D4ED8" strokeWidth="0.7" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#1D4ED8" strokeWidth="0.7" />
        </g>
      </svg>

      {/* ══════════════════════════════════════════════════════════════
          LAYER 6 — Micro Dot / Grid Texture
          Extremely faint repeating dot grid — adds designed texture
          without competing with any content.
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.028,
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(37,99,235,0.8) 1px, transparent 0)
          `,
          backgroundSize: "72px 72px",
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          LAYER 7 — Subtle Horizontal Mesh Band (light-only)
          A very faint atmospheric gradient band that shifts slowly —
          creates that subtle "luminous mid-section" feel.
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="light-only light-mesh-band absolute inset-x-0"
        style={{
          top: "38%",
          height: "280px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.022) 20%, rgba(59,130,246,0.028) 45%, rgba(14,165,233,0.022) 75%, transparent 100%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
