import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SECTION_IDS = [
  "hero",
  "why",
  "how-it-works",
  "features",
  "snap-learn",
  "accessibility",
  "teacher-parent",
  "playground",
  "cta",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Home",
  why: "Why It Matters",
  "how-it-works": "How It Works",
  features: "Features",
  "snap-learn": "Snap & Learn",
  accessibility: "Accessibility",
  "teacher-parent": "Teacher & Parent",
  playground: "Playground",
  cta: "Get Started",
};
