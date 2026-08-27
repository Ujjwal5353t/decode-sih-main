"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  getSchoolSubjectSetup,
  saveSchoolSubjectSetup,
  type ClassSubjectOptions,
  type SubjectSetupOut,
} from "@/lib/api";
import { Banner, Panel, PanelHeading, Pill } from "./module-upload/primitives";

type Selection = Record<number, string[]>;

function toSelection(classes: ClassSubjectOptions[]): Selection {
  const next: Selection = {};
  for (const entry of classes) next[entry.class_number] = [...entry.selected];
  return next;
}

/**
 * First-run setup for a School Admin: which subjects each class is taught.
 *
 * Renders the setup instead of the dashboard until it is saved. Once the
 * backend records a completion timestamp, the gate never appears again — so a
 * school that has already configured its subjects goes straight through, as do
 * accounts that predate this step.
 */
export function SubjectSetupGate({ children }: { children: React.ReactNode }) {
  const [setup, setSetup] = useState<SubjectSetupOut | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSchoolSubjectSetup();
        if (!cancelled) {
          setSetup(data);
          setSelection(toSelection(data.classes));
          setLoadError(null);
        }
      } catch (err) {
        // A school that cannot read its setup state still gets its dashboard —
        // this step must never lock an approved admin out.
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Could not load subject setup."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((classNumber: number, subject: string) => {
    setSelection((current) => {
      const picked = current[classNumber] ?? [];
      const next = picked.includes(subject)
        ? picked.filter((s) => s !== subject)
        : [...picked, subject];
      return { ...current, [classNumber]: next };
    });
  }, []);

  const setAll = useCallback(
    (entry: ClassSubjectOptions, all: boolean) => {
      setSelection((current) => ({
        ...current,
        [entry.class_number]: all ? [...entry.subjects] : [],
      }));
    },
    []
  );

  const incomplete = useMemo(
    () =>
      (setup?.classes ?? []).filter(
        (entry) => (selection[entry.class_number] ?? []).length === 0
      ),
    [setup, selection]
  );

  const totalSelected = useMemo(
    () => Object.values(selection).reduce((sum, list) => sum + list.length, 0),
    [selection]
  );

  const save = async () => {
    if (!setup || incomplete.length > 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await saveSchoolSubjectSetup(
        setup.classes.map((entry) => ({
          class_number: entry.class_number,
          subjects: selection[entry.class_number] ?? [],
        }))
      );
      setSetup(saved);
      setSelection(toSelection(saved.classes));
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save your subjects."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-text-secondary">
          Preparing your school workspace…
        </p>
      </div>
    );
  }

  // Already configured, or the check itself failed — show the dashboard.
  if (loadError || !setup || setup.completed) return <>{children}</>;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={BookOpen}
          title="Select Your School Subjects"
          description="Tell us which subjects your school teaches in each class. This sets up your curriculum workspace and only needs doing once."
          action={
            <Pill tone="brand">
              <Sparkles className="w-3 h-3" /> Setup required
            </Pill>
          }
        />

        <div className="space-y-4">
          {setup.classes.map((entry) => {
            const picked = selection[entry.class_number] ?? [];
            const allPicked = picked.length === entry.subjects.length;

            return (
              <div
                key={entry.class_number}
                className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)]">
                      {entry.class_label}
                    </h3>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {entry.subject_count} Subjects
                      {picked.length > 0 && (
                        <span className="text-brand font-semibold">
                          {" "}
                          · {picked.length} selected
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAll(entry, !allPicked)}
                    className="self-start sm:self-auto text-[11px] font-semibold text-brand hover:underline cursor-pointer"
                  >
                    {allPicked ? "Clear all" : "Select all"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {entry.subjects.map((subject) => {
                    const isPicked = picked.includes(subject);
                    return (
                      <label
                        key={subject}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] border text-xs font-medium cursor-pointer transition-colors ${
                          isPicked
                            ? "border-[var(--border-brand)] bg-brand/10 text-text-primary"
                            : "border-border-primary bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isPicked}
                          onChange={() => toggle(entry.class_number, subject)}
                        />
                        <span
                          aria-hidden="true"
                          className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                            isPicked
                              ? "bg-brand border-transparent"
                              : "border-border-primary"
                          }`}
                        >
                          {isPicked && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className="truncate">{subject}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {saveError && <Banner tone="error">{saveError}</Banner>}

          {incomplete.length > 0 && (
            <Banner tone="warning" title="Selection incomplete">
              Select at least one subject for{" "}
              {incomplete.map((entry) => entry.class_label).join(", ")}.
            </Banner>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border-primary/50">
            <p className="text-[11px] text-text-tertiary">
              {totalSelected} subject{totalSelected === 1 ? "" : "s"} selected
              across {setup.classes.length} classes.
            </p>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={saving || incomplete.length > 0}
              onClick={() => void save()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" /> Save &amp; Continue
                </>
              )}
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
