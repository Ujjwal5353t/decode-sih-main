"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clock, Loader2, ShieldCheck, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  approveOwnerClaim,
  getOwnerClaimRequests,
  rejectOwnerClaim,
  type OwnerClaimListItem,
} from "@/lib/api";
import { Banner, Panel, PanelHeading, Pill } from "../module-upload/primitives";

type Busy = { id: string; action: "approve" | "reject" } | null;

/**
 * Path A of school verification: the verified owner decides who else may
 * administer their school. Rendered as the "admin-requests" dashboard tab.
 */
export function AdminRequestsPanel() {
  const [requests, setRequests] = useState<OwnerClaimListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);

  // Bumped to re-run the fetch effect; keeps state updates inside async
  // continuations rather than synchronously in the effect body.
  const [refreshNonce, setRefreshNonce] = useState(0);
  const reload = useCallback(() => setRefreshNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getOwnerClaimRequests();
        if (!cancelled) {
          setRequests(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load administrator requests."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshNonce]);

  const decide = async (claim: OwnerClaimListItem, action: "approve" | "reject") => {
    setBusy({ id: claim.id, action });
    setError(null);
    setNotice(null);
    try {
      if (action === "approve") {
        await approveOwnerClaim(claim.id);
        setNotice(`${claim.full_name} now has administrator access.`);
      } else {
        await rejectOwnerClaim(claim.id);
        setNotice(`${claim.full_name}'s request was rejected.`);
      }
      reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update that request."
      );
    } finally {
      setBusy(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={ShieldCheck}
          title="Administrator Requests"
          description="People who have verified their identity and are requesting administrator access to your school."
          action={
            pending.length > 0 ? (
              <Pill tone="amber">
                <Clock className="w-3 h-3" /> {pending.length} pending
              </Pill>
            ) : undefined
          }
        />

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
        ) : pending.length === 0 && decided.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
            <UserCheck className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-text-primary">
              No administrator requests
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
              When someone verifies their identity and requests administrator
              access to your school, their request will appear here for you to
              approve or reject.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((r) => {
              const isBusy = busy?.id === r.id;
              return (
                <div
                  key={r.id}
                  className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-4"
                >
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      {r.full_name}{" "}
                      <span className="font-normal text-text-secondary">
                        is requesting administrator access to {r.school_name}.
                      </span>
                    </p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1">
                      {(
                        [
                          ["Designation", r.designation],
                          ["Verified phone", r.phone_number],
                          ["Verified email", r.official_email],
                        ] as [string, string][]
                      ).map(([label, value]) => (
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
                    <p className="text-[11px] text-text-tertiary mt-3">
                      Their designation is self-declared. Approve only if you know
                      this person is authorised to administer your school.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border-primary/50">
                    <Button
                      variant="primary"
                      size="sm"
                      type="button"
                      disabled={isBusy}
                      className="text-xs"
                      onClick={() => void decide(r, "approve")}
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
                      onClick={() => void decide(r, "reject")}
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
                </div>
              );
            })}

            {decided.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-2">
                  Decided
                </p>
                <div className="space-y-2">
                  {decided.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border-primary bg-surface/60 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-text-primary truncate">
                          {r.full_name}
                        </p>
                        <p className="text-[11px] text-text-tertiary truncate">
                          {r.designation} · {r.official_email}
                        </p>
                      </div>
                      <Pill tone={r.status === "approved" ? "emerald" : "rose"}>
                        {r.status === "approved" ? "Approved" : "Rejected"}
                      </Pill>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
