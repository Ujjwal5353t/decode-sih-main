"use client";

import { Navbar } from "@/components/layout/Navbar";
import { DotNav } from "@/components/layout/DotNav";
import { Footer } from "@/components/layout/Footer";
import { PremiumBackground } from "@/components/layout/PremiumBackground";
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
  return (
    <>
      {/* Subtle Premium Background Pattern Layer */}
      <PremiumBackground />

      <Navbar />
      <DotNav />
      <main id="main-content" className="flex-1 flex flex-col gap-0 relative z-10">
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
