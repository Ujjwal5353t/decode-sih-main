"use client";

export function PremiumBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* ════ 1. Ambient Blurred Lavender & Blue Glow Orbs ════ */}
      {/* Top Hero Glow: Sapphire + Sky Blue */}
      <div
        className="absolute -top-[5%] -left-[5%] w-[800px] h-[800px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(14, 165, 233, 0.09) 45%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      {/* Why It Matters / Features Glow: Lavender + Cyan (Right) */}
      <div
        className="absolute top-[22%] -right-[10%] w-[750px] h-[750px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.13) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Accessibility / Teacher Section Glow: Soft Sapphire + Violet (Left) */}
      <div
        className="absolute top-[48%] -left-[12%] w-[850px] h-[850px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(30, 64, 175, 0.14) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 70%)",
          filter: "blur(85px)",
        }}
      />

      {/* Playground / FAQ Section Glow: Sky Blue + Cyan (Right) */}
      <div
        className="absolute top-[72%] -right-[8%] w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(14, 165, 233, 0.13) 0%, rgba(37, 99, 235, 0.09) 50%, transparent 70%)",
          filter: "blur(75px)",
        }}
      />

      {/* Bottom CTA / Footer Glow: Deep Sapphire (Center Bottom) */}
      <div
        className="absolute bottom-0 left-[25%] w-[900px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at bottom, rgba(37, 99, 235, 0.12) 0%, rgba(96, 165, 250, 0.06) 60%, transparent 80%)",
          filter: "blur(60px)",
        }}
      />

      {/* ════ 2. Visible Abstract Flowing Wave Lines (SVG Gradients) ════ */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.22]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id="wave-blue-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="wave-violet-blue" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.3" />
          </linearGradient>
        </defs>



        {/* Mid flowing wave */}
        <path
          d="M -100 750 C 500 350, 1000 950, 1700 420 C 2300 620, 2700 220, 3100 520"
          stroke="url(#wave-violet-blue)"
          strokeWidth="1.8"
        />

        {/* Lower flowing wave */}
        <path
          d="M -100 1350 C 600 1050, 1100 1550, 1800 1150 C 2400 1350, 2800 920, 3200 1220"
          stroke="url(#wave-blue-cyan)"
          strokeWidth="2.2"
        />
      </svg>

      {/* ════ 3. Subtle Abstract Geometric Elements & Floating Rings ════ */}
      {/* Decorative Geometric Ring 1 */}
      <div
        className="absolute top-[18%] left-[8%] w-[380px] h-[380px] rounded-full border border-blue-500/15"
        style={{
          boxShadow: "inset 0 0 30px rgba(37, 99, 235, 0.04)",
        }}
      />

      {/* Decorative Geometric Ring 2 */}
      <div
        className="absolute top-[55%] right-[6%] w-[460px] h-[460px] rounded-full border border-violet-500/15"
        style={{
          boxShadow: "inset 0 0 40px rgba(139, 92, 246, 0.04)",
        }}
      />

      {/* ════ 4. Elegant Network Dot & Grid Texture Layer ════ */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30px 30px, #2563EB 1.5px, transparent 0),
            linear-gradient(to right, rgba(37, 99, 235, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37, 99, 235, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px, 160px 160px, 160px 160px",
        }}
      />
    </div>
  );
}
