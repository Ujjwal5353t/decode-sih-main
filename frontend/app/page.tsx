"use client";

import { Navbar } from "@/components/layout/Navbar";
import { DotNav } from "@/components/layout/DotNav";
import { Footer } from "@/components/layout/Footer";
import { PremiumBackground } from "@/components/layout/PremiumBackground";
import { Hero } from "@/components/sections/Hero";
import { WhyItMatters } from "@/components/sections/WhyItMatters";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { QuizShowcase } from "@/components/sections/QuizShowcase";
import { SnapAndLearn } from "@/components/sections/SnapAndLearn";
import { AccessibilitySection } from "@/components/sections/AccessibilitySection";
import { TeacherParentAI } from "@/components/sections/TeacherParentAI";
import { TeacherParentDashboard } from "@/components/sections/TeacherParentDashboard";
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
        <div className="section-divider max-w-5xl mx-auto w-full" aria-hidden="true" />
        <WhyItMatters />
        <div className="section-divider max-w-5xl mx-auto w-full" aria-hidden="true" />
        <HowItWorks />
        <div className="section-divider max-w-5xl mx-auto w-full" aria-hidden="true" />
        <Features />
        <div className="section-divider max-w-5xl mx-auto w-full" aria-hidden="true" />
        <QuizShowcase />
        <div className="section-divider max-w-5xl mx-auto w-full" aria-hidden="true" />
        <SnapAndLearn />
        <div className="section-divider max-w-5xl mx-auto w-full" aria-hidden="true" />
        <AccessibilitySection />
        <div className="section-divider max-w-5xl mx-auto w-full" aria-hidden="true" />
        <TeacherParentAI />
        <TeacherParentDashboard />
        <div className="section-divider max-w-5xl mx-auto w-full" aria-hidden="true" />
        <FAQ />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
