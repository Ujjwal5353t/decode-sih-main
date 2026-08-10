"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, ExternalLink, MessageCircle, Link2, Mail } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Playground", "Pricing", "Roadmap", "Changelog"],
  Resources: ["Documentation", "API Reference", "Blog", "Case Studies", "Help Center"],
  Company: ["About", "Careers", "Press", "Partners", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility Statement"],
};

const socialLinks = [
  { icon: MessageCircle, label: "Twitter", href: "#" },
  { icon: ExternalLink, label: "GitHub", href: "#" },
  { icon: Link2, label: "LinkedIn", href: "#" },
  { icon: Mail, label: "Email", href: "#" },
];

export function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer className="relative border-t border-border-primary bg-surface" role="contentinfo">
      {/* Blue gradient top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "var(--gradient-brand)" }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-6 py-14 sm:py-16" ref={ref}>
        {/* Main footer grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 0.68, 0, 1] }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12"
        >
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <a href="#hero" className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center
                         shadow-[var(--shadow-brand)]"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary">
                IncluLearn
              </span>
            </a>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              Making quality education accessible to every child, regardless of language,
              internet availability, or learning differences.
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

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links], i) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
            >
              <h4 className="text-sm font-semibold text-text-primary mb-4 font-[family-name:var(--font-display)]">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-secondary hover:text-brand
                               transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
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
            © {new Date().getFullYear()} IncluLearn. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-text-tertiary hover:text-brand transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs text-text-tertiary hover:text-brand transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-text-tertiary hover:text-brand transition-colors">
              Accessibility
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
