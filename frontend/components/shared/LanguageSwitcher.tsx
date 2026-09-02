"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LANGUAGES, type SupportedLanguage } from "@/types/i18n";

interface LanguageSwitcherProps {
  placement?: "down" | "up";
  className?: string;
}

/**
 * LanguageSwitcher — accessible dropdown showing all supported languages
 * with their native script names. Keyboard-navigable, screen-reader friendly.
 */
export function LanguageSwitcher({ placement = "down", className }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen]);

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const isUp = placement === "up";

  return (
    <div
      ref={containerRef}
      className={`relative notranslate ${className || ""}`}
      translate="no"
      data-no-translate="true"
    >
      {/* Trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)]
                   bg-surface-hover hover:bg-muted border border-border-primary
                   hover:border-[var(--border-brand)] transition-colors duration-200
                   cursor-pointer text-sm font-medium text-text-secondary
                   hover:text-text-primary notranslate"
        translate="no"
        data-no-translate="true"
        aria-label={t("languageSwitcher.ariaLabel")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline notranslate" translate="no">
          {currentLang.nativeLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? (isUp ? "-rotate-180" : "rotate-180") : ""}`}
        />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isUp ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isUp ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 0.68, 0, 1] }}
            className={`absolute ${isUp ? "bottom-full mb-2" : "top-full mt-2"} right-0 min-w-[200px] py-1.5
                       bg-surface border border-border-primary rounded-[var(--radius-lg)]
                       shadow-[var(--shadow-lg)] z-[100] overflow-hidden notranslate`}
            translate="no"
            data-no-translate="true"
            role="listbox"
            aria-label={t("languageSwitcher.ariaLabel")}
          >
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  role="option"
                  aria-selected={isActive}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5
                             text-sm transition-colors duration-150 cursor-pointer
                             ${
                               isActive
                                 ? "bg-brand/8 text-brand font-semibold"
                                 : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                             }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-base leading-none"
                      style={{ fontFamily: lang.code === "ur" ? "'Noto Nastaliq Urdu', serif" : undefined }}
                    >
                      {lang.nativeLabel}
                    </span>
                    <span className="text-xs text-text-tertiary">{lang.label}</span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-brand shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
