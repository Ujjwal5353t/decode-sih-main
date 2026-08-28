"use client";

import { Info, Lock, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Banner,
  Field,
  LANGUAGE_OPTIONS,
  Panel,
  PanelHeading,
  Pill,
  SUBJECT_SUGGESTIONS,
  SelectInput,
  TextArea,
  TextInput,
} from "./primitives";
import type { MetadataErrors, ModuleMetadata } from "./types";

export const TITLE_MAX_LENGTH = 300;
export const DESCRIPTION_MAX_LENGTH = 500;

/** Validation mirrors what the backend accepts for a module title. */
export function validateMetadata(meta: ModuleMetadata): MetadataErrors {
  const errors: MetadataErrors = {};

  const title = meta.title.trim();
  if (!title) {
    errors.title = "A module title is required.";
  } else if (title.length < 3) {
    errors.title = "Use at least 3 characters so the module is easy to find.";
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Titles are limited to ${TITLE_MAX_LENGTH} characters.`;
  }

  if (meta.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Keep the description under ${DESCRIPTION_MAX_LENGTH} characters.`;
  }

  return errors;
}

export function DetailsStep({
  meta,
  errors,
  onChange,
  subjectSuggestions,
  ocrLanguageNotice,
  onBack,
  onContinue,
}: {
  meta: ModuleMetadata;
  errors: MetadataErrors;
  onChange: (next: Partial<ModuleMetadata>) => void;
  subjectSuggestions?: string[];
  /** True when the chosen language is not the one the OCR model reads. */
  ocrLanguageNotice: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const suggestions = subjectSuggestions && subjectSuggestions.length > 0
    ? subjectSuggestions
    : SUBJECT_SUGGESTIONS;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={SlidersHorizontal}
          title="Module details"
          description="Describe the module so teachers and students can find it in the class library."
          action={<Pill tone="neutral">Step 4 of 5</Pill>}
        />

        <div className="space-y-5">
          <Field
            label="Module title"
            required
            htmlFor="meta-title"
            error={errors.title}
            hint={`${meta.title.trim().length}/${TITLE_MAX_LENGTH} characters`}
          >
            <TextInput
              id="meta-title"
              value={meta.title}
              maxLength={TITLE_MAX_LENGTH}
              invalid={Boolean(errors.title)}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Math Magic — Chapter 3"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Class"
              required
              hint="Set when the file was uploaded — start a new upload to publish into a different class."
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-border-primary bg-surface-hover text-xs font-semibold text-text-primary">
                <Lock className="w-3.5 h-3.5 text-text-tertiary" />
                Class {meta.classNumber}
              </div>
            </Field>

            <Field
              label="Subject"
              htmlFor="meta-subject"
              error={errors.subject}
              hint="Choose from your school curriculum or type your own."
            >
              <TextInput
                id="meta-subject"
                list="module-subject-suggestions"
                value={meta.subject}
                maxLength={100}
                invalid={Boolean(errors.subject)}
                onChange={(e) => onChange({ subject: e.target.value })}
                placeholder="e.g. Mathematics"
              />
              <datalist id="module-subject-suggestions">
                {suggestions.map((subject) => (
                  <option key={subject} value={subject} />
                ))}
              </datalist>

              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {suggestions.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => onChange({ subject: sub })}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                        meta.subject === sub
                          ? "bg-brand text-white border-transparent font-bold"
                          : "bg-surface text-text-secondary border-border-primary hover:bg-surface-hover"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </Field>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Language" htmlFor="meta-language">
              <SelectInput
                id="meta-language"
                value={meta.language}
                onChange={(e) => onChange({ language: e.target.value })}
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field
              label="Chapter or topic"
              htmlFor="meta-chapter"
              hint="Helps teachers line the module up with their lesson plan."
            >
              <TextInput
                id="meta-chapter"
                value={meta.chapter}
                maxLength={200}
                onChange={(e) => onChange({ chapter: e.target.value })}
                placeholder="e.g. Chapter 3 — Shapes and Space"
              />
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="meta-description"
            error={errors.description}
            hint={`${meta.description.trim().length}/${DESCRIPTION_MAX_LENGTH} characters`}
          >
            <TextArea
              id="meta-description"
              rows={3}
              value={meta.description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              invalid={Boolean(errors.description)}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="What this module covers, and how a teacher might use it..."
            />
          </Field>

          {ocrLanguageNotice && (
            <Banner tone="warning" title="Text extraction reads English">
              The OCR model on the server is configured for English. Text extracted
              from {meta.language} pages may be incomplete — review the extracted
              content carefully before publishing.
            </Banner>
          )}

          <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 p-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-text-tertiary shrink-0 mt-px" />
            <p className="text-[11px] text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary">
                Title and class
              </span>{" "}
              are saved to the module record. Subject, language, chapter and
              description are shown in the review summary but are not persisted yet —
              the module API does not expose fields for them.
            </p>
          </div>
        </div>
      </Panel>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button variant="ghost" size="sm" type="button" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" size="sm" type="button" onClick={onContinue}>
          Review &amp; publish
        </Button>
      </div>
    </div>
  );
}
