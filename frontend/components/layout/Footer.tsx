"use client";

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
  return (
    <footer className="border-t border-border-primary bg-surface" role="contentinfo">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <a href="#hero" className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center"
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
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center
                             bg-muted hover:bg-brand/10 hover:text-brand
                             text-text-tertiary transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-text-primary mb-4 font-[family-name:var(--font-display)]">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-secondary hover:text-text-primary
                               transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border-secondary flex flex-col sm:flex-row items-center
                      justify-between gap-4">
          <p className="text-xs text-text-tertiary">
            © {new Date().getFullYear()} IncluLearn. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-text-tertiary hover:text-text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs text-text-tertiary hover:text-text-primary transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-text-tertiary hover:text-text-primary transition-colors">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
