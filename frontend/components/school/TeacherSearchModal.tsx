"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  UserX,
  Sparkles,
  Phone,
  Check,
  ArrowUpDown,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TeacherListItem } from "@/lib/api";
import { EASE, QUICK } from "@/components/dashboard/console/motion";
import { Chip, EmptyState, Segmented, inputClass } from "@/components/dashboard/console/primitives";

export interface TeacherSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherListItem[];
  classNum: number;
  section: string;
  subject: string;
  onClassNumChange?: (cls: number) => void;
  onSectionChange?: (sec: string) => void;
  onSubjectChange?: (subj: string) => void;
  availableSubjects?: string[];
  onAssign: (teacherId: string, classNum: number, section: string, subject: string) => Promise<void> | void;
  isAssigning?: boolean;
  initialTeacherId?: string;
  parseSubjectMeta?: (raw: string) => { title: string; subtitle: string; color: string };
  isMatchingSubject?: (a: string, b: string) => boolean;
}

type FilterType = "all" | "unassigned" | "assigned" | "specialist";
type SortType = "name" | "fewest_classes" | "most_classes";

/**
 * The teacher-search-and-assign flyout opened from the School Admin's
 * Teacher & Subject Allocation panel (see SchoolTeacherManagement in
 * app/dashboard/page.tsx) — same console surface language, kept as its own
 * component since the panel's chrome (target banner, search+filter bar,
 * scrollable list, footer) doesn't fit the single-slot <Modal> primitive.
 */
export function TeacherSearchModal({
  isOpen,
  onClose,
  teachers,
  classNum,
  section,
  subject,
  onClassNumChange,
  onSectionChange,
  onSubjectChange,
  availableSubjects = [],
  onAssign,
  isAssigning = false,
  initialTeacherId = "",
  parseSubjectMeta = (s) => ({ title: s || "General", subtitle: "", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" }),
  isMatchingSubject = (a, b) => (a || "").toLowerCase().includes((b || "").toLowerCase()),
}: TeacherSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("fewest_classes");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId);

  // Sync selected teacher if initial changes when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedTeacherId(initialTeacherId || "");
      setSearchQuery("");
      setSelectedFilter("all");
    }
  }, [isOpen, initialTeacherId]);

  // Derived counts for filters
  const counts = useMemo(() => {
    let unassigned = 0;
    let assigned = 0;
    let specialist = 0;

    teachers.forEach((t) => {
      const classCount = (t.assigned_classes || []).length;
      if (classCount === 0) {
        unassigned++;
      } else {
        assigned++;
      }

      // Check if teacher already teaches this subject in any class
      const teachesSubject = (t.assigned_classes || []).some((c) =>
        isMatchingSubject(c.subject || "", subject)
      );
      if (teachesSubject) {
        specialist++;
      }
    });

    return {
      all: teachers.length,
      unassigned,
      assigned,
      specialist,
    };
  }, [teachers, subject, isMatchingSubject]);

  // Filtered and sorted teachers
  const filteredTeachers = useMemo(() => {
    let list = [...teachers];

    // Filter by tab
    if (selectedFilter === "unassigned") {
      list = list.filter((t) => (t.assigned_classes || []).length === 0);
    } else if (selectedFilter === "assigned") {
      list = list.filter((t) => (t.assigned_classes || []).length > 0);
    } else if (selectedFilter === "specialist") {
      list = list.filter((t) =>
        (t.assigned_classes || []).some((c) =>
          isMatchingSubject(c.subject || "", subject)
        )
      );
    }

    // Search query (name, phone, subjects taught)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const nameMatch = (t.name || "").toLowerCase().includes(q);
        const phoneMatch = (t.phone_number || "").toLowerCase().includes(q);
        const subjectMatch = (t.assigned_classes || []).some((c) =>
          (c.subject || "").toLowerCase().includes(q) ||
          `class ${c.class_number}${c.section}`.toLowerCase().includes(q)
        );
        return nameMatch || phoneMatch || subjectMatch;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "fewest_classes") {
        const aCount = (a.assigned_classes || []).length;
        const bCount = (b.assigned_classes || []).length;
        return aCount - bCount;
      } else if (sortBy === "most_classes") {
        const aCount = (a.assigned_classes || []).length;
        const bCount = (b.assigned_classes || []).length;
        return bCount - aCount;
      }
      return 0;
    });

    return list;
  }, [teachers, selectedFilter, searchQuery, sortBy, subject, isMatchingSubject]);

  if (!isOpen) return null;

  const subjectMeta = parseSubjectMeta(subject);

  const handleConfirmAssignment = (teacherIdToAssign?: string) => {
    const targetId = teacherIdToAssign || selectedTeacherId;
    if (!targetId) return;
    onAssign(targetId, classNum, section, subject);
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: `All (${counts.all})` },
    { value: "unassigned", label: `Unassigned / Free (${counts.unassigned})` },
    { value: "assigned", label: `Assigned (${counts.assigned})` },
  ];
  if (counts.specialist > 0) {
    filterOptions.push({
      value: "specialist",
      label: `${subjectMeta.title} Teachers (${counts.specialist})`,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={QUICK}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: 0.24, ease: EASE }}
        className="console-panel relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden shadow-[var(--shadow-lg)]"
      >
        {/* Header */}
        <div className="border-b border-[var(--c-line)] bg-[var(--c-sunken)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-brand/20 bg-brand/8 text-brand">
                <GraduationCap className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold text-text-primary font-[family-name:var(--font-display)]">
                  Assign Subject Teacher
                </h3>
                <p className="text-xs text-text-secondary">
                  Search and filter teachers by availability, workload, and specialization.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="cursor-pointer rounded-md p-1 text-text-tertiary transition-colors hover:bg-[var(--c-panel)] hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Target Allocation Banner & Quick Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-panel)] p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 font-semibold text-text-primary">
              <span className="text-text-tertiary">Target:</span>
              <Chip tone="brand">
                Class {classNum}
                {section}
              </Chip>
              <span
                className={`rounded border px-2 py-0.5 font-medium ${subjectMeta.color}`}
              >
                {subjectMeta.title} {subjectMeta.subtitle ? `(${subjectMeta.subtitle})` : ""}
              </span>
            </div>

            {/* Optional dropdowns if user wants to change target on the fly */}
            {(onClassNumChange || onSectionChange || onSubjectChange) && (
              <div className="flex flex-wrap items-center gap-2">
                {onClassNumChange && (
                  <select
                    value={classNum}
                    onChange={(e) => onClassNumChange(Number(e.target.value))}
                    className={`${inputClass} w-auto py-1`}
                  >
                    {[1, 2, 3, 4, 5].map((c) => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                )}

                {onSectionChange && (
                  <select
                    value={section}
                    onChange={(e) => onSectionChange(e.target.value)}
                    className={`${inputClass} w-auto py-1`}
                  >
                    {["A", "B", "C", "D"].map((s) => (
                      <option key={s} value={s}>Sec {s}</option>
                    ))}
                  </select>
                )}

                {onSubjectChange && availableSubjects.length > 0 && (
                  <select
                    value={subject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    className={`${inputClass} w-auto max-w-[160px] truncate py-1`}
                  >
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>
                        {parseSubjectMeta(s).title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-3 border-b border-[var(--c-line)] p-4">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search teacher by name, phone number, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} py-2 pl-9 pr-9`}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-tertiary hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs and Sort Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Segmented
              idPrefix="teacher-search-filter"
              value={selectedFilter}
              onChange={(v) => setSelectedFilter(v)}
              options={filterOptions}
            />

            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <ArrowUpDown className="h-3.5 w-3.5 text-text-tertiary" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className={`${inputClass} w-auto py-1`}
              >
                <option value="fewest_classes">Fewest Classes First</option>
                <option value="name">Name (A-Z)</option>
                <option value="most_classes">Most Classes First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teachers List */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {filteredTeachers.length === 0 ? (
            <EmptyState icon={UserX} title="No teachers found">
              {searchQuery
                ? `No teachers matching "${searchQuery}". Try a different name or phone number.`
                : "No teachers found under this filter."}
              {(searchQuery || selectedFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedFilter("all");
                  }}
                  className="mt-3 block cursor-pointer text-xs font-semibold text-brand hover:underline"
                >
                  Reset search &amp; filters
                </button>
              )}
            </EmptyState>
          ) : (
            filteredTeachers.map((teacher) => {
              const assignedClasses = teacher.assigned_classes || [];
              const classCount = assignedClasses.length;
              const isSelected = selectedTeacherId === teacher.id;

              // Check if teacher is currently assigned to this specific class & subject
              const isCurrentAssignee = assignedClasses.some(
                (c) =>
                  Number(c.class_number) === Number(classNum) &&
                  (c.section || "").toUpperCase().trim() === (section || "").toUpperCase().trim() &&
                  isMatchingSubject(c.subject || "", subject)
              );

              // Check if teacher teaches this subject elsewhere
              const isSpecialist = assignedClasses.some((c) =>
                isMatchingSubject(c.subject || "", subject)
              );

              return (
                <div
                  key={teacher.id}
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  className={`console-lift flex cursor-pointer flex-col gap-3 rounded-[var(--c-radius)] border px-3.5 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    isSelected
                      ? "border-brand/40 bg-brand/8"
                      : "border-[var(--c-line)] bg-[var(--c-panel)] hover:bg-[var(--c-sunken)]"
                  }`}
                >
                  {/* Left: Info & Avatar */}
                  <div className="flex min-w-0 items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--c-radius)] border text-xs font-bold transition-colors ${
                        isSelected
                          ? "border-brand bg-brand text-white"
                          : classCount === 0
                          ? "border-emerald-500/25 bg-emerald-500/10 text-[var(--accent-emerald)]"
                          : "border-brand/20 bg-brand/8 text-brand"
                      }`}
                    >
                      {teacher.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>

                    {/* Teacher Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-xs font-semibold text-text-primary">
                          {teacher.name}
                        </span>

                        <span className="flex items-center gap-1 font-mono text-[11px] text-text-tertiary">
                          <Phone className="h-2.5 w-2.5" />
                          {teacher.phone_number}
                        </span>

                        {classCount === 0 ? (
                          <Chip tone="emerald">
                            <Sparkles className="h-2.5 w-2.5" /> Free (0 classes)
                          </Chip>
                        ) : (
                          <Chip tone="neutral">
                            {classCount} {classCount === 1 ? "class" : "classes"}
                          </Chip>
                        )}

                        {isSpecialist && !isCurrentAssignee && (
                          <Chip tone="sky">Teaches {subjectMeta.title}</Chip>
                        )}

                        {isCurrentAssignee && <Chip tone="amber">Current Teacher</Chip>}
                      </div>

                      {/* Assigned Classes Preview */}
                      {classCount > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[10px] font-medium text-text-tertiary">
                            Assigned:
                          </span>
                          {assignedClasses.slice(0, 4).map((c, idx) => (
                            <span
                              key={c.id || idx}
                              className="rounded border border-[var(--c-line)] bg-[var(--c-sunken)] px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
                            >
                              {c.class_number}
                              {c.section} ({parseSubjectMeta(c.subject || "").title})
                            </span>
                          ))}
                          {assignedClasses.length > 4 && (
                            <span className="text-[10px] text-text-tertiary">
                              +{assignedClasses.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] italic text-text-tertiary">
                          No classes assigned yet • Available for full allocation
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action */}
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <Button
                      variant={isSelected ? "primary" : "outline"}
                      size="sm"
                      disabled={isAssigning || isCurrentAssignee}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmAssignment(teacher.id);
                      }}
                      className="h-auto px-3 py-1.5 text-xs"
                    >
                      {isCurrentAssignee ? (
                        <span className="flex items-center gap-1 text-text-tertiary">
                          <Check className="h-3.5 w-3.5" /> Assigned
                        </span>
                      ) : isAssigning && isSelected ? (
                        "Assigning..."
                      ) : (
                        "Assign Teacher"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--c-line)] bg-[var(--c-sunken)] p-4">
          <div className="truncate text-xs text-text-secondary">
            {selectedTeacherId ? (
              <span>
                Selected:{" "}
                <strong className="text-text-primary">
                  {teachers.find((t) => t.id === selectedTeacherId)?.name || "Teacher"}
                </strong>
              </span>
            ) : (
              <span className="text-text-tertiary">
                Select a teacher above to assign to Class {classNum}
                {section} ({subjectMeta.title})
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={isAssigning}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => handleConfirmAssignment()}
              disabled={isAssigning || !selectedTeacherId}
              className="text-xs"
            >
              {isAssigning ? "Assigning..." : "Confirm & Assign"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
