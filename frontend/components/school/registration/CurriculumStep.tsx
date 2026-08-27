"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Plus,
  Sparkles,
  Trash2,
  Library,
  Layers,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  getPublishersWithSubjects,
  type ClassSubjectPublisherItem,
  type PublisherWithSubjectsOut,
} from "@/lib/api";
import { Banner, Panel, PanelHeading, Pill } from "./parts";

const CLASSES = [1, 2, 3, 4, 5];

const COMMON_QUICK_SUBJECTS = [
  "Mathematics (Math-Magic)",
  "English (Marigold / Mridang)",
  "Hindi (Rimjhim / Sarangi)",
  "Environmental Studies (EVS)",
  "General Knowledge (GK)",
  "Computer Studies",
  "Moral Science / Value Education",
  "Art & Craft / Drawing",
  "Regional Language",
];

interface CurriculumStepProps {
  value: ClassSubjectPublisherItem[];
  onChange: (items: ClassSubjectPublisherItem[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function CurriculumStep({
  value,
  onChange,
  onBack,
  onNext,
}: CurriculumStepProps) {
  const [activeClass, setActiveClass] = useState<number>(1);
  const [dbPublishers, setDbPublishers] = useState<PublisherWithSubjectsOut[]>([]);
  const [loadingPublishers, setLoadingPublishers] = useState(true);
  const [newSubjectInput, setNewSubjectInput] = useState<Record<string, string>>({});
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Fetch standard publishers and subjects from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getPublishersWithSubjects();
        if (!cancelled && list.length > 0) {
          setDbPublishers(list);
        }
      } catch (err) {
        console.error("Failed to load publishers from API:", err);
      } finally {
        if (!cancelled) setLoadingPublishers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize with age-appropriate primary NCERT configuration if empty
  useEffect(() => {
    if (value.length === 0) {
      const defaultSetup: ClassSubjectPublisherItem[] = CLASSES.map((c) => ({
        class_number: c,
        publisher_name: "NCERT",
        subjects:
          c <= 2
            ? [
                "Mathematics (Math-Magic)",
                "English (Marigold / Mridang)",
                "Hindi (Rimjhim / Sarangi)",
                "Art & Craft",
              ]
            : [
                "Mathematics (Math-Magic)",
                "English (Marigold / Mridang)",
                "Hindi (Rimjhim / Sarangi)",
                "Environmental Studies (EVS)",
                "General Knowledge (GK)",
              ],
      }));
      onChange(defaultSetup);
    }
  }, [value, onChange]);


  // Group items by class
  const classItems = useMemo(() => {
    return value.filter((item) => item.class_number === activeClass);
  }, [value, activeClass]);

  // Check if a publisher exists in DB list
  const getDbPublisher = (name: string) => {
    return dbPublishers.find(
      (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  };

  // Update a specific publisher block
  const handleUpdatePublisherName = (indexInClass: number, newName: string) => {
    const updated = [...value];
    const targetIdx = value.findIndex(
      (it, idx) =>
        it.class_number === activeClass &&
        value.filter((x, i) => x.class_number === activeClass && i <= idx).length ===
          indexInClass + 1
    );

    if (targetIdx !== -1) {
      const existingDb = getDbPublisher(newName);
      // If switching to an existing publisher, inherit its subjects or keep matching ones
      const defaultSubjects = existingDb
        ? existingDb.subjects.slice(0, 4)
        : updated[targetIdx].subjects.length > 0
        ? updated[targetIdx].subjects
        : ["Mathematics", "English", "Hindi"];

      updated[targetIdx] = {
        ...updated[targetIdx],
        publisher_name: newName,
        subjects: defaultSubjects,
      };
      onChange(updated);
    }
  };

  // Toggle subject selection
  const handleToggleSubject = (indexInClass: number, subject: string) => {
    const updated = [...value];
    const targetIdx = value.findIndex(
      (it, idx) =>
        it.class_number === activeClass &&
        value.filter((x, i) => x.class_number === activeClass && i <= idx).length ===
          indexInClass + 1
    );

    if (targetIdx !== -1) {
      const currentSubjects = updated[targetIdx].subjects;
      const isSelected = currentSubjects.includes(subject);
      const newSubjects = isSelected
        ? currentSubjects.filter((s) => s !== subject)
        : [...currentSubjects, subject];

      updated[targetIdx] = {
        ...updated[targetIdx],
        subjects: newSubjects,
      };
      onChange(updated);
    }
  };

  // Add custom subject
  const handleAddCustomSubject = (indexInClass: number, customSubject: string) => {
    const trimmed = customSubject.trim();
    if (!trimmed) return;

    const updated = [...value];
    const targetIdx = value.findIndex(
      (it, idx) =>
        it.class_number === activeClass &&
        value.filter((x, i) => x.class_number === activeClass && i <= idx).length ===
          indexInClass + 1
    );

    if (targetIdx !== -1) {
      const item = updated[targetIdx];
      if (!item.subjects.includes(trimmed)) {
        updated[targetIdx] = {
          ...item,
          subjects: [...item.subjects, trimmed],
        };
        onChange(updated);
      }

      // Also dynamically update local dbPublishers cache so the checkbox is rendered
      setDbPublishers((prev) => {
        const exists = prev.find(
          (p) => p.name.toLowerCase() === item.publisher_name.toLowerCase()
        );
        if (exists) {
          if (!exists.subjects.includes(trimmed)) {
            return prev.map((p) =>
              p.name.toLowerCase() === item.publisher_name.toLowerCase()
                ? { ...p, subjects: [...p.subjects, trimmed] }
                : p
            );
          }
          return prev;
        } else {
          return [
            ...prev,
            { id: item.publisher_name, name: item.publisher_name, subjects: [trimmed] },
          ];
        }
      });

      // Clear input
      setNewSubjectInput((prev) => ({
        ...prev,
        [`${activeClass}_${indexInClass}`]: "",
      }));
    }
  };

  // Add another publisher for this class
  const handleAddPublisherToClass = () => {
    // Pick an unused publisher from DB or default
    const usedNames = classItems.map((i) => i.publisher_name.toLowerCase());
    const available = dbPublishers.find(
      (p) => !usedNames.includes(p.name.toLowerCase())
    );
    const pubName = available ? available.name : "Oxford University Press";
    const subjects = available ? available.subjects.slice(0, 2) : ["Science"];

    onChange([
      ...value,
      {
        class_number: activeClass,
        publisher_name: pubName,
        subjects: subjects,
      },
    ]);
  };

  // Remove a publisher block from this class
  const handleRemovePublisher = (indexInClass: number) => {
    if (classItems.length <= 1) return; // Keep at least one publisher block
    let count = -1;
    const updated = value.filter((item) => {
      if (item.class_number === activeClass) {
        count++;
        return count !== indexInClass;
      }
      return true;
    });
    onChange(updated);
  };

  // Apply active class setup to all classes (1 to 5)
  const handleApplyToAllClasses = () => {
    const currentBlocks = classItems;
    const updated: ClassSubjectPublisherItem[] = [];

    CLASSES.forEach((cls) => {
      currentBlocks.forEach((blk) => {
        updated.push({
          class_number: cls,
          publisher_name: blk.publisher_name,
          subjects: [...blk.subjects],
        });
      });
    });

    onChange(updated);
    setCopiedNotice(`Class ${activeClass} subjects & publishers applied to all classes (1 to 5)!`);
    setTimeout(() => setCopiedNotice(null), 4000);
  };

  // Calculate subject count for each class
  const getClassSubjectCount = (cls: number) => {
    const items = value.filter((it) => it.class_number === cls);
    const allSubs = new Set<string>();
    items.forEach((it) => it.subjects.forEach((s) => allSubs.add(s)));
    return allSubs.size;
  };

  // Validation: every class (1-5) must have at least 1 subject selected
  const invalidClasses = CLASSES.filter((cls) => getClassSubjectCount(cls) === 0);
  const isValid = invalidClasses.length === 0;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={BookOpen}
          title="Class-wise Subjects & Textbooks"
          description="Select which publishers' textbooks your school uses and configure subjects offered for each class."
          action={<Pill tone="neutral">Step 4 of 6</Pill>}
        />

        {copiedNotice && (
          <div className="mb-4">
            <Banner tone="success">{copiedNotice}</Banner>
          </div>
        )}

        {invalidClasses.length > 0 && (
          <div className="mb-4">
            <Banner tone="warning">
              Please configure at least one subject for Class{" "}
              {invalidClasses.join(", ")} before continuing.
            </Banner>
          </div>
        )}

        {/* ── Class Tabs (Classes 1 to 5) ─────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border-primary mb-6">
          {CLASSES.map((cls) => {
            const count = getClassSubjectCount(cls);
            const isSelected = activeClass === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setActiveClass(cls)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-brand text-white shadow-sm"
                    : "bg-surface border border-border-primary text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                <span>Class {cls}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : count > 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "bg-amber-500/10 text-amber-600 font-normal"
                  }`}
                >
                  {count} {count === 1 ? "subj" : "subs"}
                </span>
              </button>
            );
          })}

          <div className="ml-auto shrink-0">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleApplyToAllClasses}
              className="text-xs gap-1.5"
              title="Copy Class configuration to Classes 1-5"
            >
              <Copy className="w-3.5 h-3.5" />
              Apply to All Classes (1–5)
            </Button>
          </div>
        </div>

        {/* ── Publishers Configured for Active Class ──────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
              <Library className="w-4 h-4 text-brand" />
              Publishers & Subjects for Class {activeClass}
            </h3>
            <span className="text-[11px] text-text-tertiary">
              {classItems.length} publisher{classItems.length === 1 ? "" : "s"} configured
            </span>
          </div>

          {classItems.map((item, indexInClass) => {
            const dbPub = getDbPublisher(item.publisher_name);
            const isNewPublisher = !dbPub && item.publisher_name.trim().length > 0;
            const availableSubjects = dbPub
              ? Array.from(new Set([...dbPub.subjects, ...item.subjects]))
              : Array.from(new Set([...COMMON_QUICK_SUBJECTS, ...item.subjects]));
            const inputKey = `${activeClass}_${indexInClass}`;
            const customVal = newSubjectInput[inputKey] || "";

            return (
              <div
                key={indexInClass}
                className="rounded-[var(--radius-lg)] border border-border-primary bg-surface/70 p-5 space-y-4 shadow-sm relative transition-all hover:border-border-brand"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 max-w-md">
                    <label
                      htmlFor={`pub-select-${activeClass}-${indexInClass}`}
                      className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5"
                    >
                      Publisher Name / Book Provider
                    </label>

                    <div className="relative">
                      <input
                        id={`pub-select-${activeClass}-${indexInClass}`}
                        type="text"
                        list={`publishers-list-${activeClass}-${indexInClass}`}
                        value={item.publisher_name}
                        onChange={(e) =>
                          handleUpdatePublisherName(indexInClass, e.target.value)
                        }
                        placeholder="e.g. NCERT, Oxford, Cambridge, Pearson, S. Chand"
                        className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-surface border border-border-primary text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                      />
                      <datalist id={`publishers-list-${activeClass}-${indexInClass}`}>
                        {dbPublishers.map((p) => (
                          <option key={p.name} value={p.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isNewPublisher ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-full border border-border-brand">
                        <Sparkles className="w-3 h-3" /> New Publisher Entry
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Verified Publisher
                      </span>
                    )}

                    {classItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => handleRemovePublisher(indexInClass)}
                        className="text-text-tertiary hover:text-rose-500 p-1.5"
                        title="Remove publisher block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Subject Checklist */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-text-tertiary" />
                      Select Subjects taught under {item.publisher_name || "this publisher"}:
                    </p>
                    <span className="text-[11px] text-text-secondary">
                      {item.subjects.length} selected
                    </span>
                  </div>

                  {/* Checklist grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSubjects.map((sub) => {
                      const isChecked = item.subjects.includes(sub);
                      return (
                        <label
                          key={sub}
                          className={`flex items-center gap-2.5 p-2.5 rounded-[var(--radius-md)] border text-xs font-medium cursor-pointer transition-all ${
                            isChecked
                              ? "bg-brand/10 border-brand text-brand font-semibold shadow-xs"
                              : "bg-surface border-border-primary text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSubject(indexInClass, sub)}
                            className="w-4 h-4 rounded text-brand focus:ring-brand/40 border-border-primary cursor-pointer"
                          />
                          <span className="truncate">{sub}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Add Custom Subject Input */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <div className="relative flex-1 max-w-sm">
                      <input
                        type="text"
                        value={customVal}
                        onChange={(e) =>
                          setNewSubjectInput((prev) => ({
                            ...prev,
                            [inputKey]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomSubject(indexInClass, customVal);
                          }
                        }}
                        placeholder={`+ Add another subject for ${item.publisher_name}...`}
                        className="w-full px-3 py-1.5 rounded-[var(--radius-md)] bg-surface border border-border-primary text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      disabled={!customVal.trim()}
                      onClick={() => handleAddCustomSubject(indexInClass, customVal)}
                      className="text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Subject
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Another Publisher to this Class */}
          <div className="pt-1">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleAddPublisherToClass}
              className="text-xs border-dashed border-border-primary hover:border-brand"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Another Publisher for Class {activeClass}
            </Button>
          </div>
        </div>
      </Panel>

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button variant="ghost" size="sm" type="button" onClick={onBack}>
          Back to Admin Details
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!isValid}
          onClick={onNext}
        >
          Continue to Verification
          <ChevronRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
