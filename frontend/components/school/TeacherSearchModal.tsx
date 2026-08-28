"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  UserCheck,
  UserX,
  Sparkles,
  BookOpen,
  Phone,
  Check,
  Filter,
  ArrowUpDown,
  GraduationCap,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TeacherListItem } from "@/lib/api";

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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass rounded-[var(--radius-xl)] w-full max-w-2xl border border-border-primary shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border-primary/60 bg-surface/80">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center border border-border-brand font-bold text-sm">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    Assign Subject Teacher
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Search and filter teachers by availability, workload, and specialization.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Target Allocation Banner & Quick Controls */}
          <div className="mt-4 p-3 rounded-lg bg-surface/50 border border-border-primary flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                <span className="text-text-tertiary">Target:</span>
                <span className="px-2 py-0.5 rounded bg-brand/10 text-brand font-bold">
                  Class {classNum}{section}
                </span>
                <span className="text-text-tertiary">•</span>
                <span className={`px-2 py-0.5 rounded font-medium border ${subjectMeta.color}`}>
                  {subjectMeta.title} {subjectMeta.subtitle ? `(${subjectMeta.subtitle})` : ""}
                </span>
              </div>
            </div>

            {/* Optional dropdowns if user wants to change target on the fly */}
            {(onClassNumChange || onSectionChange || onSubjectChange) && (
              <div className="flex items-center gap-2 flex-wrap">
                {onClassNumChange && (
                  <select
                    value={classNum}
                    onChange={(e) => onClassNumChange(Number(e.target.value))}
                    className="px-2 py-1 bg-background text-text-primary rounded border border-border-primary outline-none focus:border-brand text-xs cursor-pointer"
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
                    className="px-2 py-1 bg-background text-text-primary rounded border border-border-primary outline-none focus:border-brand text-xs cursor-pointer"
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
                    className="px-2 py-1 bg-background text-text-primary rounded border border-border-primary outline-none focus:border-brand text-xs max-w-[160px] truncate cursor-pointer"
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
        <div className="p-4 border-b border-border-primary/40 bg-surface/30 space-y-3">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teacher by name, phone number, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-background text-text-primary text-xs rounded-lg border border-border-primary outline-none focus:border-brand placeholder:text-text-tertiary transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs and Sort Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedFilter === "all"
                    ? "bg-brand text-white shadow-sm"
                    : "bg-surface text-text-secondary hover:text-text-primary border border-border-primary"
                }`}
              >
                All ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter("unassigned")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === "unassigned"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-surface text-text-secondary hover:text-text-primary border border-border-primary"
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Unassigned / Free ({counts.unassigned})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter("assigned")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedFilter === "assigned"
                    ? "bg-brand text-white shadow-sm"
                    : "bg-surface text-text-secondary hover:text-text-primary border border-border-primary"
                }`}
              >
                Assigned ({counts.assigned})
              </button>

              {counts.specialist > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter("specialist")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedFilter === "specialist"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-surface text-text-secondary hover:text-text-primary border border-border-primary"
                  }`}
                >
                  <BookOpen className="w-3 h-3 text-sky-300" />
                  <span>{subjectMeta.title} Teachers ({counts.specialist})</span>
                </button>
              )}
            </div>

            {/* Sort Sorter */}
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-2 py-1 bg-background text-text-primary rounded border border-border-primary outline-none focus:border-brand text-xs cursor-pointer"
              >
                <option value="fewest_classes">Fewest Classes First</option>
                <option value="name">Name (A-Z)</option>
                <option value="most_classes">Most Classes First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teachers List */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1 divide-y divide-border-primary/20">
          {filteredTeachers.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-tertiary space-y-2">
              <UserX className="w-8 h-8 mx-auto text-text-tertiary/40" />
              <p className="font-semibold text-text-secondary text-sm">No teachers found</p>
              <p className="max-w-xs mx-auto text-[11px]">
                {searchQuery
                  ? `No teachers matching "${searchQuery}". Try a different name or phone number.`
                  : "No teachers found under this filter."}
              </p>
              {(searchQuery || selectedFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedFilter("all");
                  }}
                  className="text-xs text-brand hover:underline font-semibold cursor-pointer pt-2"
                >
                  Reset search & filters
                </button>
              )}
            </div>
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
                  className={`pt-2.5 first:pt-0 pb-2.5 px-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-brand/10 border-brand/50 shadow-sm"
                      : "bg-surface/30 hover:bg-surface/70 border-border-primary/60"
                  }`}
                >
                  {/* Left: Info & Avatar */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-all ${
                        isSelected
                          ? "bg-brand text-white border-brand shadow-sm"
                          : classCount === 0
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          : "bg-brand/10 text-brand border-border-brand"
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-text-primary truncate">
                          {teacher.name}
                        </span>

                        <span className="text-[11px] text-text-tertiary font-mono flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          {teacher.phone_number}
                        </span>

                        {classCount === 0 ? (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Free (0 classes)
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-surface text-text-secondary border border-border-primary">
                            {classCount} {classCount === 1 ? "class" : "classes"}
                          </span>
                        )}

                        {isSpecialist && !isCurrentAssignee && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/20">
                            Teaches {subjectMeta.title}
                          </span>
                        )}

                        {isCurrentAssignee && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Current Teacher
                          </span>
                        )}
                      </div>

                      {/* Assigned Classes Preview */}
                      {classCount > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[10px] text-text-tertiary font-medium">Assigned:</span>
                          {assignedClasses.slice(0, 4).map((c, idx) => (
                            <span
                              key={c.id || idx}
                              className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-surface text-text-secondary border border-border-primary/50"
                            >
                              {c.class_number}{c.section} ({parseSubjectMeta(c.subject || "").title})
                            </span>
                          ))}
                          {assignedClasses.length > 4 && (
                            <span className="text-[10px] text-text-tertiary">
                              +{assignedClasses.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-text-tertiary italic">
                          No classes assigned yet • Available for full allocation
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action */}
                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant={isSelected ? "primary" : "outline"}
                      size="sm"
                      disabled={isAssigning || isCurrentAssignee}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmAssignment(teacher.id);
                      }}
                      className="text-xs px-3 py-1.5 h-auto font-semibold"
                    >
                      {isCurrentAssignee ? (
                        <span className="flex items-center gap-1 text-text-tertiary">
                          <Check className="w-3.5 h-3.5" /> Assigned
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
        <div className="p-4 border-t border-border-primary/60 bg-surface/80 flex items-center justify-between gap-3">
          <div className="text-xs text-text-secondary truncate">
            {selectedTeacherId ? (
              <span>
                Selected: <strong className="text-text-primary">{teachers.find((t) => t.id === selectedTeacherId)?.name || "Teacher"}</strong>
              </span>
            ) : (
              <span className="text-text-tertiary">Select a teacher above to assign to Class {classNum}{section} ({subjectMeta.title})</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
      </div>
    </div>
  );
}
