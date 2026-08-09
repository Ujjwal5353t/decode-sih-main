"use client";

import { motion, useScroll } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { DotNav } from "@/components/layout/DotNav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { WhyItMatters } from "@/components/sections/WhyItMatters";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { SnapAndLearn } from "@/components/sections/SnapAndLearn";
import { AccessibilitySection } from "@/components/sections/AccessibilitySection";
import { TeacherParentAI } from "@/components/sections/TeacherParentAI";
import { TeacherParentDashboard } from "@/components/sections/TeacherParentDashboard";
import { Playground } from "@/components/sections/Playground";
import { FAQ } from "@/components/sections/FAQ";
import { CallToAction } from "@/components/sections/CallToAction";

export default function Home() {
  const { scrollYProgress } = useScroll();

  return (
    <>
      {/* Sleek Top Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left pointer-events-none"
        style={{
          scaleX: scrollYProgress,
          background: "var(--gradient-brand)",
          boxShadow: "0 0 10px rgba(37, 99, 235, 0.6)",
        }}
      />

      <Navbar />
      <DotNav />
      <main id="main-content" className="flex-1 flex flex-col gap-0">
        <Hero />
        <WhyItMatters />
        <HowItWorks />
        <Features />
        <SnapAndLearn />
        <AccessibilitySection />
        <TeacherParentAI />
        <TeacherParentDashboard />
        <Playground />
        <FAQ />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
