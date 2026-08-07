"use client";

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
import { Playground } from "@/components/sections/Playground";
import { CallToAction } from "@/components/sections/CallToAction";

export default function Home() {
  return (
    <>
      <Navbar />
      <DotNav />
      <main id="main-content" className="flex-1">
        <Hero />
        <WhyItMatters />
        <HowItWorks />
        <Features />
        <SnapAndLearn />
        <AccessibilitySection />
        <TeacherParentAI />
        <Playground />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
