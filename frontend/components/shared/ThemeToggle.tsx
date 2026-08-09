"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="relative w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center
                 bg-surface-hover hover:bg-muted transition-colors duration-200 cursor-pointer
                 border border-border-primary hover:border-[var(--border-brand)]"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {theme === "dark" ? (
          <Moon className="w-[18px] h-[18px] text-text-primary" />
        ) : (
          <Sun className="w-[18px] h-[18px] text-text-primary" />
        )}
      </motion.div>
    </motion.button>
  );
}
