"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ExternalLink, MessageCircle, Link2, Mail } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";

interface FooterLinkItem {
  tKey: string;
  href: string;
}

const footerLinkDefs: { sectionTKey: string; links: FooterLinkItem[] }[] = [
  {
    sectionTKey: "footer.sections.product",
    links: [
      { tKey: "footer.links.adaptiveLearning", href: "#features" },
      { tKey: "footer.links.regionalLanguages", href: "#features" },
      { tKey: "footer.links.offlineLearning", href: "#features" },
      { tKey: "footer.links.accessibility", href: "#features" },
    ],
  },
  {
    sectionTKey: "footer.sections.explore",
    links: [
      { tKey: "footer.links.whyItMatters", href: "#why" },
      { tKey: "footer.links.features", href: "#features" },
      { tKey: "footer.links.faqs", href: "#faq" },
    ],
  },
  {
    sectionTKey: "footer.sections.quickLinks",
    links: [
      { tKey: "footer.links.home", href: "#hero" },
      { tKey: "footer.links.playground", href: "#playground" },
      { tKey: "footer.links.dashboards", href: "#dashboards" },
      { tKey: "footer.links.contactUs", href: "#contact" },
    ],
  },
];

const socialLinks = [
  { icon: MessageCircle, label: "Twitter", href: "#contact" },
  { icon: ExternalLink, label: "GitHub", href: "#contact" },
  { icon: Link2, label: "LinkedIn", href: "#contact" },
  { icon: Mail, label: "Email", href: "#contact" },
];

export function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { t } = useTranslation();

  return (
    <footer className="relative bg-surface overflow-hidden" role="contentinfo">
      {/* ══ CREATIVE ASYMMETRIC LAYERED WAVE TOP EDGE DIVIDER ══ */}
      <div className="relative w-full overflow-hidden leading-none z-10 pointer-events-none -mt-1">
        {/* Ambient Glow Behind Top Wave Curves */}
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1000px] h-[120px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top, rgba(37, 99, 235, 0.2), rgba(14, 165, 233, 0.08) 50%, transparent 80%)",
          }}
        />

        <svg
          className="relative block w-full h-14 sm:h-20 lg:h-24 text-[var(--bg-surface)]"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Wave Gradient Stroke */}
            <linearGradient id="footer-top-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
              <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
            </linearGradient>

            {/* Asymmetric Layer Fills */}
            <linearGradient id="footer-top-wave-layer1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.04" />
            </linearGradient>

            <linearGradient id="footer-top-wave-layer2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.05" />
            </linearGradient>

            {/* Seamless Dark Contact Overlay Fill Above Curve */}
            <linearGradient id="cta-bottom-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(10, 15, 28, 0.95)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0.98)" />
            </linearGradient>
          </defs>

          {/* Contact Section Dark Overlay Fill Above Main Wave Curve */}
          <path
            d="M0,45 C320,95 680,25 1040,65 C1240,85 1360,35 1440,45 L1440,0 L0,0 Z"
            fill="url(#cta-bottom-gradient)"
          />

          {/* Layer 1: Backing Flowing Accent Curve */}
          <path
            d="M0,30 C360,90 720,10 1080,70 C1260,100 1380,40 1440,20 L1440,120 L0,120 Z"
            fill="url(#footer-top-wave-layer1)"
          />

          {/* Layer 2: Middle Accent Wave */}
          <path
            d="M0,65 C240,20 540,90 840,45 C1140,0 1320,60 1440,40 L1440,120 L0,120 Z"
            fill="url(#footer-top-wave-layer2)"
          />

          {/* Layer 3: Main Footer Surface Fill Below Wave */}
          <path
            d="M0,45 C320,95 680,25 1040,65 C1240,85 1360,35 1440,45 L1440,120 L0,120 Z"
            fill="currentColor"
          />

          {/* Glowing Top Boundary Stroke Line */}
          <path
            d="M0,45 C320,95 680,25 1040,65 C1240,85 1360,35 1440,45"
            fill="none"
            stroke="url(#footer-top-stroke)"
            strokeWidth="3"
          />
        </svg>
      </div>

      {/* ══ Layered Flowing Wave Background Pattern ══ */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Subtle Ambient Radial Blue Glow */}
        <div
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[900px] h-[350px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(37, 99, 235, 0.07), rgba(14, 165, 233, 0.03) 55%, transparent 80%)",
          }}
        />

        {/* SVG Flowing Wave Layers */}
        <svg
          className="absolute bottom-0 left-0 w-full h-full min-h-[280px] opacity-40 dark:opacity-20 pointer-events-none"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="footer-wave-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="footer-wave-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.07" />
              <stop offset="50%" stopColor="#2563EB" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="footer-wave-3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Deep Back Wave */}
          <path
            d="M0,192 C280,240 560,120 840,180 C1120,240 1320,150 1440,120 L1440,320 L0,320 Z"
            fill="url(#footer-wave-1)"
          />

          {/* Middle Flowing Wave */}
          <path
            d="M0,128 C320,180 640,96 960,160 C1200,210 1360,140 1440,160 L1440,320 L0,320 Z"
            fill="url(#footer-wave-2)"
          />

          {/* Foreground Soft Accent Wave */}
          <path
            d="M0,224 C240,160 520,240 800,200 C1080,160 1280,220 1440,210 L1440,320 L0,320 Z"
            fill="url(#footer-wave-3)"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14 sm:py-16" ref={ref}>
        {/* Main footer grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 0.68, 0, 1] }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start mb-12"
        >
          <div className="md:col-span-5 lg:col-span-5 mb-6 md:mb-0">
            <a href="#hero" className="inline-block mb-4">
              <Image
                src="/vidyasetu-logo.png"
                alt="VidyaSetu — LEARN • GROW • BELONG — AI for Inclusive Education"
                width={500}
                height={150}
                className="h-24 sm:h-28 md:h-32 lg:h-36 w-auto object-contain"
                priority
              />
            </a>



            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              {t("footer.description")}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center
                             bg-muted hover:bg-brand/10 hover:text-brand
                             text-text-tertiary transition-all duration-200 cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Navigation Group (Product, Explore, Quick Links) shifted right with compact column gaps */}
          <div className="md:col-span-7 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-8 items-start md:pl-6 lg:pl-10">
            {footerLinkDefs.map((section, i) => (
              <motion.div
                key={section.sectionTKey}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                className="col-span-1 flex flex-col items-start pt-1"
              >
                <h4 className="text-sm font-bold text-text-primary mb-4 font-[family-name:var(--font-display)] uppercase tracking-wider">
                  {t(section.sectionTKey)}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((item) => (
                    <li key={item.tKey}>
                      <a
                        href={item.href}
                        className="text-sm text-text-secondary hover:text-brand
                                  transition-colors duration-200 block"
                      >
                        {t(item.tKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>


        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="pt-8 border-t border-border-secondary flex flex-col sm:flex-row items-center
                    justify-between gap-4"
        >
          <p className="text-xs text-text-tertiary">
            {t("footer.copyright").replace("{year}", String(new Date().getFullYear()))}
          </p>
          <div className="flex items-center gap-6">
            <a href="#why" className="text-xs text-text-tertiary hover:text-brand transition-colors">
              {t("footer.links.indiaData")}
            </a>
            <a href="#features" className="text-xs text-text-tertiary hover:text-brand transition-colors">
              {t("footer.links.features")}
            </a>
            <a href="#dashboards" className="text-xs text-text-tertiary hover:text-brand transition-colors">
              {t("footer.links.dashboards")}
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}



