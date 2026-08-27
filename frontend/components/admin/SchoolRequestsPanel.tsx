"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  approveSchoolRequest,
  getSchoolRegistrationRequests,
  rejectSchoolRequest,
  type ClaimStatusValue,
  type SchoolRequestListItem,
} from "@/lib/api";
import {
  Banner,
  Panel,
  PanelHeading,
  Pill,
} from "../school/module-upload/primitives";

type Filter = "pending" | "approved" | "rejected" | "all";
type Busy = { id: string; action: "approve" | "reject" } | null;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

const STATUS_TONE: Record<ClaimStatusValue, "amber" | "emerald" | "rose"> = {
  pending: "amber",
  approved: "emerald",
  rejected: "rose",
};

const STATUS_LABEL: Record<ClaimStatusValue, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/** What the authority evaluation concluded — evidence for the reviewer, not a decision. */
const AUTHORITY_COPY: Record<
  string,
  { tone: "emerald" | "amber" | "rose" | "neutral"; label: string }
> = {
  verified: { tone: "emerald", label: "Matches official record" },
  manual_review: { tone: "amber", label: "Needs manual review" },
  failed: { tone: "rose", label: "Contradicts official record" },
  unverified: { tone: "neutral", label: "Not evaluated" },
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Registrations to School Requests.
 *
 * Every school registration lands here as Pending. A school administrator only
 * gets dashboard access once a platform administrator approves their request.
 */
export function SchoolRequestsPanel() {
  const [requests, setRequests] = useState<SchoolRequestListItem[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSchoolRegistrationRequests();
        if (!cancelled) {
          setRequests(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load school registration requests."
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

  const decide = async (
    request: SchoolRequestListItem,
    action: "approve" | "reject"
  ) => {
    setBusy({ id: request.id, action });
    setError(null);
    setNotice(null);
    try {
      // Both endpoints return the decided request, so the list is updated from
      // the decision itself. Re-listing here could race the write's commit and
      // show a just-approved school as still pending.
      const decided =
        action === "approve"
          ? await approveSchoolRequest(request.id)
          : await rejectSchoolRequest(request.id);

      setRequests((current) =>
        current.map((r) => (r.id === decided.id ? decided : r))
      );
      setNotice(
        action === "approve"
          ? `${decided.school_name} approved — ${decided.full_name} now has School Admin access.`
          : `${decided.school_name} rejected — no School Admin access was granted.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update that request."
      );
    } finally {
      setBusy(null);
    }
  };

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests]
  );

  const visible = useMemo(
    () =>
      filter === "all" ? requests : requests.filter((r) => r.status === filter),
    [requests, filter]
  );

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={ClipboardCheck}
          title="School Registration Requests"
          description="Schools that completed registration and identity verification. Approving a request activates the school account and grants its administrator School Admin access."
          action={
            pendingCount > 0 ? (
              <Pill tone="amber">
                <Clock className="w-3 h-3" /> {pendingCount} pending
              </Pill>
            ) : undefined
          }
        />

        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          {FILTERS.map((tab) => {
            const count =
              tab.id === "all"
                ? requests.length
                : requests.filter((r) => r.status === tab.id).length;
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold border transition-colors cursor-pointer ${
                  isActive
                    ? "bg-brand text-white border-transparent"
                    : "bg-surface text-text-secondary border-border-primary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                {tab.label}
                <span className={isActive ? "opacity-80" : "text-text-tertiary"}>
                  {" "}
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {notice && (
          <div className="mb-4">
            <Banner tone="success">{notice}</Banner>
          </div>
        )}
        {error && (
          <div className="mb-4">
            <Banner tone="error">{error}</Banner>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
            <Building2 className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-text-primary">
              {filter === "pending"
                ? "No requests awaiting review"
                : "Nothing to show here"}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
              When a school completes registration and identity verification, its
              request appears here for approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                busy={busy}
                onDecide={decide}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function RequestCard({
  request,
  busy,
  onDecide,
}: {
  request: SchoolRequestListItem;
  busy: Busy;
  onDecide: (r: SchoolRequestListItem, action: "approve" | "reject") => void;
}) {
  const isBusy = busy?.id === request.id;
  const isPending = request.status === "pending";
  const authority =
    AUTHORITY_COPY[request.authority_status] ?? AUTHORITY_COPY.unverified;

  const details: [string, string][] = [
    ["UDISE code", request.udise_code],
    [
      "State / District",
      [request.state, request.district].filter(Boolean).join(" · ") || "—",
    ],
    ["Administrator", request.full_name],
    ["Designation", request.designation],
    ["Registered on", formatDate(request.created_at)],
  ];

  return (
    <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary truncate">
            {request.school_name}
          </h3>
          <p className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {[request.board, request.management].filter(Boolean).join(" · ") ||
              "Official record"}
          </p>
        </div>
        <Pill tone={STATUS_TONE[request.status]}>
          {STATUS_LABEL[request.status]}
        </Pill>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-3">
        {details.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
              {label}
            </p>
            <p className="text-xs text-text-primary font-medium break-words">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={request.phone_verified ? "emerald" : "neutral"}>
            <Check className="w-3 h-3" /> Phone
          </Pill>
          <Pill tone={request.email_verified ? "emerald" : "neutral"}>
            <Check className="w-3 h-3" /> Email
          </Pill>
          <Pill tone={authority.tone}>
            <ShieldCheck className="w-3 h-3" /> {authority.label}
          </Pill>
          {request.evidence_url && (
            <a
              href={request.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Document
            </a>
          )}
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed break-words">
          {request.official_email} · {request.phone_number}
        </p>
        {request.authority_notes && (
          <p className="text-[11px] text-text-tertiary leading-relaxed">
            {request.authority_notes}
          </p>
        )}
      </div>

      {isPending ? (
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border-primary/50">
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={isBusy}
            className="text-xs"
            onClick={() => onDecide(request, "approve")}
          >
            {isBusy && busy?.action === "approve" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Approving…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={isBusy}
            className="text-xs text-text-secondary hover:text-rose-500"
            onClick={() => onDecide(request, "reject")}
          >
            {isBusy && busy?.action === "reject" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Rejecting…
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5 mr-1.5" /> Reject
              </>
            )}
          </Button>
        </div>
      ) : (
        <p className="text-[11px] text-text-tertiary pt-3 border-t border-border-primary/50">
          {request.status === "approved"
            ? "School Admin access granted"
            : "Rejected — no School Admin access"}
          {request.reviewed_by ? ` · ${request.reviewed_by}` : ""}
          {request.decision_reason ? ` · ${request.decision_reason}` : ""}
        </p>
      )}
    </div>
  );
}
