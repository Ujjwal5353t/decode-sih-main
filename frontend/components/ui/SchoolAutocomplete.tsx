"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Building, CheckCircle, Search } from "lucide-react";
import { searchSchools, SchoolSearchResult } from "@/lib/api";

interface SchoolAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onSelect: (item: SchoolSearchResult) => void;
  icon?: any;
  searchType: "school" | "branch";
  required?: boolean;
}

export function SchoolAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  icon: Icon = Building2,
  searchType,
  required = false,
}: SchoolAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SchoolSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic suggestions whenever value changes
  useEffect(() => {
    if (value && value.trim().length > 0) {
      searchSchools(value)
        .then((res) => {
          setSuggestions(res);
          setIsOpen(res.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setIsOpen(false);
        });
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value]);

  // Click outside listener to close suggestion popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-brand font-normal flex items-center gap-1">
          <Search className="w-3 h-3" /> 
        </span>
      </label>
      <div className="relative">
        <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
          required={required}
        />
      </div>

      {/* Dynamic Floating Dropdown (YouTube/IG style overlay) */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 glass rounded-[var(--radius-md)] border border-border-brand shadow-[var(--shadow-xl)] max-h-48 overflow-y-auto divide-y divide-border-primary/50"
          >
            {suggestions.map((item, idx) => {
              const primaryText =
                searchType === "school" ? item.school_name : item.branch_name;
              const secondaryText =
                searchType === "school"
                  ? `Branch: ${item.branch_name} | ${item.state}`
                  : `School: ${item.school_name} | ${item.state}`;
              const ItemIcon = searchType === "school" ? Building2 : Building;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs hover:bg-brand/10 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ItemIcon className="w-3.5 h-3.5 text-brand group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-semibold text-text-primary block">
                        {primaryText}
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        {secondaryText}
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="w-3.5 h-3.5 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
