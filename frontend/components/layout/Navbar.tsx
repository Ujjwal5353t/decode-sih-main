"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, LayoutDashboard, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";


// Translation keys mapped to anchor hrefs
const navLinkDefs = [
  { tKey: "nav.product",    href: "#how-it-works" },
  { tKey: "nav.features",   href: "#features" },
  { tKey: "nav.playground", href: "#quiz-showcase" },
  { tKey: "nav.about",      href: "#why" },
  { tKey: "nav.contact",    href: "#cta" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 0.68, 0, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
          scrolled
            ? "glass shadow-[var(--shadow-md)] border-b border-border-primary"
            : "bg-transparent"
        )}
      >
        <nav
          className="mx-auto max-w-7xl px-6 flex items-center justify-between"
          style={{ height: "var(--nav-height)" }}
          aria-label="Main navigation"
        >
          {/* Logo */}
          <BrandLogo size="md" priority className="py-0.5" />







          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinkDefs.map((link) => (
              <a
                key={link.tKey}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-text-secondary
                         hover:text-text-primary transition-colors duration-200 rounded-[var(--radius-md)]
                         hover:bg-surface-hover relative group"
              >
                {t(link.tKey)}
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full
                               bg-brand transition-all duration-300 group-hover:w-6"
                />
              </a>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />

            {user && role ? (
              <>
                <Link href="/dashboard">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white rounded-[var(--radius-lg)]
                             cursor-pointer shadow-[var(--shadow-brand)] font-[family-name:var(--font-display)]
                             hover:shadow-[0_6px_24px_rgba(37,99,235,0.3)] transition-shadow duration-300"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t("nav.dashboard")}
                  </motion.div>
                </Link>
                <button
                  onClick={logout}
                  className="p-2.5 rounded-[var(--radius-lg)] text-text-secondary hover:text-rose-500
                           hover:bg-surface-hover transition-colors duration-200 cursor-pointer"
                  aria-label={t("actions.logOut")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary
                           transition-colors duration-200 font-[family-name:var(--font-display)]"
                >
                  {t("nav.login")}
                </Link>
                <Link href="/register">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-[var(--radius-lg)]
                             cursor-pointer shadow-[var(--shadow-brand)] font-[family-name:var(--font-display)]
                             hover:shadow-[0_6px_24px_rgba(37,99,235,0.3)] transition-shadow duration-300"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {t("nav.signup")}
                  </motion.div>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button & Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center
                       hover:bg-surface-hover transition-colors cursor-pointer"
              aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-text-primary" />
              ) : (
                <Menu className="w-5 h-5 text-text-primary" />
              )}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-[300px] bg-surface border-l border-border-primary
                       shadow-[var(--shadow-xl)] p-6 pt-24 flex flex-col gap-2"
            >
              {navLinkDefs.map((link, i) => (
                <motion.a
                  key={link.tKey}
                  href={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-base font-medium text-text-secondary
                           hover:text-text-primary hover:bg-surface-hover rounded-[var(--radius-md)]
                           transition-colors duration-200"
                >
                  {t(link.tKey)}
                </motion.a>
              ))}

              <div className="mt-auto flex flex-col gap-3 pb-6">
                {user && role ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="w-full px-6 py-3 text-center text-sm font-semibold text-white
                               rounded-[var(--radius-lg)] shadow-[var(--shadow-brand)]
                               font-[family-name:var(--font-display)] flex items-center justify-center gap-2"
                      style={{ background: "var(--gradient-brand)" }}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t("nav.dashboard")}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="w-full px-6 py-3 text-center text-sm font-medium text-text-secondary
                               border border-border-primary rounded-[var(--radius-lg)]
                               hover:border-rose-500 hover:text-rose-500 transition-colors duration-200 cursor-pointer"
                    >
                      {t("nav.signout")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full px-6 py-3 text-center text-sm font-medium text-text-secondary
                               border border-border-primary rounded-[var(--radius-lg)]
                               hover:border-[var(--border-brand)] transition-colors duration-200 font-[family-name:var(--font-display)]"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="w-full px-6 py-3 text-center text-sm font-semibold text-white
                               rounded-[var(--radius-lg)] shadow-[var(--shadow-brand)]
                               font-[family-name:var(--font-display)] flex items-center justify-center"
                      style={{ background: "var(--gradient-brand)" }}
                    >
                      {t("nav.signup")}
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
