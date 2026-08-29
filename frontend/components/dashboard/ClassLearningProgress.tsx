"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { ClassProgressOut, getClassLearningProgress } from "@/lib/api";
import { Item, Stagger } from "@/components/dashboard/console/motion";
import {
  Chip,
  Code,
  EmptyState,
  Loading,
  Meter,
  Notice,
  Panel,
  PanelHead,
  Table,
  Td,
  Th,
} from "@/components/dashboard/console/primitives";

import { useTranslation } from "@/hooks/useTranslation";

function percentColor(percent: number): string {
  if (percent >= 100) return "text-emerald-500";
  if (percent >= 50) return "text-brand";
  if (percent > 0) return "text-amber-500";
  return "text-text-tertiary";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso.endsWith("Z") ? iso : `${iso}Z`).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);
  if (!Number.isFinite(minutes)) return "—";
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export function ClassLearningProgress({
  classNumber,
  section,
}: {
  classNumber: number;
  section: string;
}) {
  const { t } = useTranslation();
  const viewKey = `${classNumber}|${section}`;
  const [result, setResult] = useState<{
    key: string;
    data: ClassProgressOut | null;
    error: string | null;
  }>({ key: "", data: null, error: null });

  const loading = result.key !== viewKey;
  const progress = loading ? null : result.data;
  const error = loading ? null : result.error;

  useEffect(() => {
    let cancelled = false;
    getClassLearningProgress(classNumber, section)
      .then((data) => {
        if (!cancelled) setResult({ key: viewKey, data, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: viewKey,
            data: null,
            error: err.message || "Could not load class progress.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [classNumber, section, viewKey]);

  return (
    <Panel flush className="overflow-hidden">
      <PanelHead
        icon={TrendingUp}
        title={t("learningProgress.moduleProgress")}
        actions={
          progress ? (
            <Chip tone="brand">
              {progress.students.length} {t("dashboard.students")}
            </Chip>
          ) : undefined
        }
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="p-5">
          <Notice tone="rose">{error}</Notice>
        </div>
      ) : !progress || progress.subjects.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={`${t("teacherDashboard.noModulesFoundFor")} ${t("teacherDashboard.classPrefix")} ${classNumber}.`}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t("dashboard.student.studentPrefix")}</Th>
              {progress.subjects.map((subject) => {
                const subKey = `schoolAdmin.subjects.${subject.toLowerCase()}`;
                const translatedSub = t(subKey as any);
                return <Th key={subject}>{translatedSub && translatedSub !== subKey ? translatedSub : subject}</Th>;
              })}
              <Th>{t("learningProgress.overallProgress")}</Th>
              <Th>{t("dashboard.recentActivity")}</Th>
            </tr>
          </thead>
          <Stagger as="tbody" className="divide-y divide-[var(--c-line)]">
            {progress.students.map((row) => (
              <Item as="tr" key={row.student_id} className="console-row">
                <Td>
                  <span className="block font-medium text-text-primary">
                    {row.full_name || row.unique_number}
                  </span>
                  <Code className="mt-1 inline-block">{row.unique_number}</Code>
                </Td>

                {row.subjects.map((subject) => (
                  <Td key={subject.subject}>
                    <span
                      className={`console-num font-semibold ${percentColor(
                        subject.progress_percent
                      )}`}
                    >
                      {subject.progress_percent}%
                    </span>
                  </Td>
                ))}

                <Td>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`console-num w-9 font-semibold ${percentColor(
                        row.overall_percent
                      )}`}
                    >
                      {row.overall_percent}%
                    </span>
                    <Meter
                      className="w-16"
                      value={row.overall_percent}
                      tone={row.overall_percent >= 100 ? "emerald" : "brand"}
                    />
                  </div>
                  <span className="mt-1 block text-[10px] text-text-tertiary">
                    {row.modules_completed} {t("learningProgress.completed")} · {row.modules_in_progress} {t("learningProgress.inProgress")}
                  </span>
                </Td>

                <Td className="console-num text-text-tertiary">
                  {relativeTime(row.last_activity_at)}
                </Td>
              </Item>
            ))}
          </Stagger>
        </Table>
      )}
    </Panel>
  );
}
