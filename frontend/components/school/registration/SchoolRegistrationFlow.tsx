"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  ClipboardCheck,
  Clock,
  Loader2,
  Search,
  ShieldCheck,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  activateSchoolClaim,
  createSchoolClaim,
  lookupSchoolByUdise,
  searchSchoolDirectory,
  sendOTP,
  sendSchoolEmailCode,
  uploadClaimEvidence,
  verifyOTP,
  verifySchoolEmailCode,
  type ClaimStatusOut,
  type SchoolRecordOut,
} from "@/lib/api";
import {
  AuthorityNotice,
  Banner,
  DESIGNATIONS,
  Field,
  Panel,
  PanelHeading,
  Pill,
  RegStepRail,
  SchoolRecordCard,
  SelectInput,
  TextInput,
  VerificationChecklist,
  type CheckState,
  type RegStepId,
} from "./parts";

type LookupMode = "udise" | "name";

export function SchoolRegistrationFlow() {
  const router = useRouter();
  const [step, setStep] = useState<RegStepId>("find");

  // ── Step 1: find ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<LookupMode>("udise");
  const [udise, setUdise] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<SchoolRecordOut[] | null>(null);

  // ── Step 2: confirm ─────────────────────────────────────────────────────────
  const [record, setRecord] = useState<SchoolRecordOut | null>(null);

  // ── Step 3: claim ───────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);

  // ── Step 4: verification ────────────────────────────────────────────────────
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpNote, setOtpNote] = useState<string | null>(null);

  const [emailSent, setEmailSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNote, setEmailNote] = useState<string | null>(null);

  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 5: result ──────────────────────────────────────────────────────────
  const [claim, setClaim] = useState<ClaimStatusOut | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [evidenceBusy, setEvidenceBusy] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  // ── Lookup ──────────────────────────────────────────────────────────────────

  const runLookup = useCallback(async () => {
    setSearchError(null);
    setResults(null);

    if (mode === "udise") {
      if (udise.trim().length < 3) {
        setSearchError("Enter the school's UDISE code to continue.");
        return;
      }
      setSearching(true);
      try {
        const found = await lookupSchoolByUdise(udise.trim());
        setRecord(found);
        setStep("confirm");
      } catch (err) {
        setSearchError(
          err instanceof Error ? err.message : "Could not look up that school."
        );
      } finally {
        setSearching(false);
      }
      return;
    }

    if (!name.trim() && !state.trim() && !district.trim()) {
      setSearchError("Enter a school name, state or district to search.");
      return;
    }
    setSearching(true);
    try {
      const found = await searchSchoolDirectory({ name, state, district });
      setResults(found);
      if (found.length === 0) {
        setSearchError(
          "No school matched that search. Try the UDISE code for an exact match."
        );
      }
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Could not search the directory."
      );
    } finally {
      setSearching(false);
    }
  }, [district, mode, name, state, udise]);

  // ── Verification helpers ────────────────────────────────────────────────────

  const handleSendOtp = async () => {
    setVerifyError(null);
    setOtpBusy(true);
    try {
      const res = await sendOTP(phone.trim());
      setOtpSent(true);
      setOtpNote(res.message || "OTP sent.");
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Could not send the OTP.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyError(null);
    setOtpBusy(true);
    try {
      await verifyOTP(phone.trim(), otpCode.trim());
      setPhoneVerified(true);
      setOtpNote(null);
    } catch (err) {
      setPhoneVerified(false);
      setVerifyError(err instanceof Error ? err.message : "Invalid OTP code.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleSendEmail = async () => {
    setVerifyError(null);
    setEmailBusy(true);
    try {
      const res = await sendSchoolEmailCode(email.trim());
      setEmailSent(true);
      setEmailNote(res.message || "Verification code sent.");
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : "Could not send the verification code."
      );
    } finally {
      setEmailBusy(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyError(null);
    setEmailBusy(true);
    try {
      await verifySchoolEmailCode(email.trim(), emailCode.trim());
      setEmailVerified(true);
      setEmailNote(null);
    } catch (err) {
      setEmailVerified(false);
      setVerifyError(
        err instanceof Error ? err.message : "Invalid verification code."
      );
    } finally {
      setEmailBusy(false);
    }
  };

  // ── Submit the claim ────────────────────────────────────────────────────────

  const submitClaim = async () => {
    if (!record) return;
    setVerifyError(null);
    setSubmitting(true);
    try {
      const res = await createSchoolClaim({
        udise_code: record.udise_code,
        full_name: fullName.trim(),
        designation,
        official_email: email.trim(),
        phone_number: phone.trim(),
        password,
      });
      setClaim(res.claim);
      setResultMessage(res.message);
      setStep("result");
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : "Could not submit your request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvidence = async (file: File) => {
    if (!claim) return;
    setResultError(null);
    setEvidenceBusy(true);
    try {
      const updated = await uploadClaimEvidence(claim.id, file);
      setClaim(updated);
    } catch (err) {
      setResultError(
        err instanceof Error ? err.message : "Could not upload the document."
      );
    } finally {
      setEvidenceBusy(false);
    }
  };

  const enterDashboard = async () => {
    if (!claim) return;
    setResultError(null);
    setEntering(true);
    try {
      await activateSchoolClaim(claim.id);
      router.push("/dashboard");
    } catch (err) {
      setResultError(
        err instanceof Error ? err.message : "Could not open the dashboard."
      );
      setEntering(false);
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const claimErrors = {
    fullName: fullName.trim().length < 2 ? "Enter your full name." : undefined,
    email: !/^\S+@\S+\.\S+$/.test(email.trim())
      ? "Enter a valid official school email."
      : undefined,
    phone:
      phone.replace(/\D/g, "").length < 7
        ? "Enter a valid phone number."
        : undefined,
    password:
      password.length < 8 ? "Password must be at least 8 characters." : undefined,
  };
  const claimValid = !Object.values(claimErrors).some(Boolean);

  return (
    <div className="space-y-6">
      <RegStepRail current={step} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {/* ── STEP 1: FIND YOUR SCHOOL ─────────────────────────────────── */}
          {step === "find" && (
            <div className="space-y-6">
              <Panel>
                <PanelHeading
                  icon={Search}
                  title="Find Your School"
                  description="We identify your school from its official record before anyone can claim it."
                  action={<Pill tone="neutral">Step 1 of 5</Pill>}
                />

                <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-[var(--radius-md)] w-fit mb-5">
                  {(
                    [
                      ["udise", "UDISE Code"],
                      ["name", "Search by Name"],
                    ] as [LookupMode, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setMode(id);
                        setSearchError(null);
                        setResults(null);
                      }}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer ${
                        mode === id
                          ? "bg-surface text-brand shadow-sm"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {label}
                      {id === "udise" && (
                        <span className="ml-1.5 text-[9px] uppercase tracking-wide text-emerald-500">
                          Recommended
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {searchError && (
                  <div className="mb-4">
                    <Banner tone="error">{searchError}</Banner>
                  </div>
                )}

                {mode === "udise" ? (
                  <Field
                    label="UDISE Code"
                    required
                    htmlFor="udise"
                    hint="An 11-digit code issued to every recognised school in India."
                  >
                    <TextInput
                      id="udise"
                      value={udise}
                      onChange={(e) => setUdise(e.target.value)}
                      placeholder="e.g. 07040100201"
                      onKeyDown={(e) => e.key === "Enter" && void runLookup()}
                    />
                  </Field>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="School Name" htmlFor="sname">
                      <TextInput
                        id="sname"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. ABC Public School"
                      />
                    </Field>
                    <Field label="State" htmlFor="sstate">
                      <TextInput
                        id="sstate"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Delhi"
                      />
                    </Field>
                    <Field label="District" htmlFor="sdist">
                      <TextInput
                        id="sdist"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. South Delhi"
                      />
                    </Field>
                  </div>
                )}

                <div className="mt-5">
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    disabled={searching}
                    onClick={() => void runLookup()}
                  >
                    {searching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Searching…
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-1.5" /> Find school
                      </>
                    )}
                  </Button>
                </div>

                {results && results.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                      {results.length} matching school{results.length === 1 ? "" : "s"}
                    </p>
                    {results.map((r) => (
                      <button
                        key={r.udise_code}
                        type="button"
                        onClick={() => {
                          setRecord(r);
                          setStep("confirm");
                        }}
                        className="w-full text-left glass rounded-[var(--radius-md)] p-4 border border-border-primary hover:border-brand transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate">
                              {r.school_name}
                            </p>
                            <p className="text-[11px] text-text-secondary mt-0.5">
                              {r.district}, {r.state} · UDISE {r.udise_code}
                            </p>
                          </div>
                          {r.board && <Pill tone="neutral">{r.board}</Pill>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* ── STEP 2: OFFICIAL RECORD ──────────────────────────────────── */}
          {step === "confirm" && record && (
            <div className="space-y-6">
              <Panel>
                <PanelHeading
                  icon={Building2}
                  title="Official School Record"
                  description="This is the record we hold for the school you selected."
                  action={<Pill tone="neutral">Step 2 of 5</Pill>}
                />
                <SchoolRecordCard record={record} />

                <p className="text-sm font-semibold text-text-primary mt-5">
                  Is this your school?
                </p>
              </Panel>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setRecord(null);
                    setStep("find");
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  No, search again
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => setStep("claim")}
                >
                  Yes, claim this school
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CLAIM ────────────────────────────────────────────── */}
          {step === "claim" && record && (
            <div className="space-y-6">
              <Panel>
                <PanelHeading
                  icon={UserCheck}
                  title="Administrator Verification"
                  description={`Tell us who you are at ${record.school_name}. We verify these details in the next step.`}
                  action={<Pill tone="neutral">Step 3 of 5</Pill>}
                />

                {claimError && (
                  <div className="mb-4">
                    <Banner tone="error">{claimError}</Banner>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Full Name"
                      required
                      htmlFor="fullname"
                      error={fullName ? claimErrors.fullName : undefined}
                    >
                      <TextInput
                        id="fullname"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </Field>

                    <Field label="Designation" required htmlFor="designation">
                      <SelectInput
                        id="designation"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      >
                        {DESIGNATIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Official School Email"
                      required
                      htmlFor="email"
                      error={email ? claimErrors.email : undefined}
                    >
                      <TextInput
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@school.edu.in"
                      />
                    </Field>

                    <Field
                      label="Phone Number"
                      required
                      htmlFor="phone"
                      error={phone ? claimErrors.phone : undefined}
                    >
                      <TextInput
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98100 11001"
                      />
                    </Field>
                  </div>

                  <Field
                    label="Create a Password"
                    required
                    htmlFor="password"
                    error={password ? claimErrors.password : undefined}
                    hint="Used to sign in once your request is approved."
                  >
                    <TextInput
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </Field>

                  <AuthorityNotice />
                </div>
              </Panel>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setStep("confirm")}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  disabled={!claimValid}
                  onClick={() => {
                    setClaimError(null);
                    setStep("verify");
                  }}
                >
                  Continue to verification
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: PHONE + EMAIL VERIFICATION ───────────────────────── */}
          {step === "verify" && record && (
            <div className="space-y-6">
              <Panel>
                <PanelHeading
                  icon={ShieldCheck}
                  title="Verify Your Identity"
                  description="Confirm you control the phone number and email address you supplied."
                  action={<Pill tone="neutral">Step 4 of 5</Pill>}
                />

                {verifyError && (
                  <div className="mb-4">
                    <Banner tone="error">{verifyError}</Banner>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Phone */}
                  <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-text-primary font-[family-name:var(--font-display)]">
                        Phone · {phone}
                      </p>
                      {phoneVerified && (
                        <Pill tone="emerald">
                          <Check className="w-3 h-3" /> Phone Verified
                        </Pill>
                      )}
                    </div>

                    {!phoneVerified && (
                      <>
                        {otpNote && <Banner tone="info">{otpNote}</Banner>}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {otpSent && (
                            <TextInput
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="6-digit OTP"
                              className="sm:max-w-[180px]"
                            />
                          )}
                          <Button
                            variant={otpSent ? "primary" : "secondary"}
                            size="sm"
                            type="button"
                            disabled={otpBusy}
                            onClick={() =>
                              otpSent ? void handleVerifyOtp() : void handleSendOtp()
                            }
                          >
                            {otpBusy ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                Working…
                              </>
                            ) : otpSent ? (
                              "Verify OTP"
                            ) : (
                              "Send OTP"
                            )}
                          </Button>
                          {otpSent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              disabled={otpBusy}
                              onClick={() => void handleSendOtp()}
                            >
                              Resend
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Email */}
                  <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-text-primary font-[family-name:var(--font-display)] break-all">
                        Email · {email}
                      </p>
                      {emailVerified && (
                        <Pill tone="emerald">
                          <Check className="w-3 h-3" /> Email Verified
                        </Pill>
                      )}
                    </div>

                    {!emailVerified && (
                      <>
                        {emailNote && <Banner tone="info">{emailNote}</Banner>}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {emailSent && (
                            <TextInput
                              value={emailCode}
                              onChange={(e) => setEmailCode(e.target.value)}
                              placeholder="6-digit code"
                              className="sm:max-w-[180px]"
                            />
                          )}
                          <Button
                            variant={emailSent ? "primary" : "secondary"}
                            size="sm"
                            type="button"
                            disabled={emailBusy}
                            onClick={() =>
                              emailSent
                                ? void handleVerifyEmail()
                                : void handleSendEmail()
                            }
                          >
                            {emailBusy ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                Working…
                              </>
                            ) : emailSent ? (
                              "Verify Email"
                            ) : (
                              "Send Code"
                            )}
                          </Button>
                          {emailSent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              disabled={emailBusy}
                              onClick={() => void handleSendEmail()}
                            >
                              Resend
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <AuthorityNotice />
                </div>
              </Panel>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setStep("claim")}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  disabled={!phoneVerified || !emailVerified || submitting}
                  onClick={() => void submitClaim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Submit claim"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 5: RESULT ───────────────────────────────────────────── */}
          {step === "result" && claim && (
            <ResultView
              claim={claim}
              message={resultMessage}
              error={resultError}
              evidenceBusy={evidenceBusy}
              entering={entering}
              onEvidence={handleEvidence}
              onEnterDashboard={() => void enterDashboard()}
              onBackToLogin={() => router.push("/login")}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Result / status screen ────────────────────────────────────────────────────

function ResultView({
  claim,
  message,
  error,
  evidenceBusy,
  entering,
  onEvidence,
  onEnterDashboard,
  onBackToLogin,
}: {
  claim: ClaimStatusOut;
  message: string | null;
  error: string | null;
  evidenceBusy: boolean;
  entering: boolean;
  onEvidence: (file: File) => void;
  onEnterDashboard: () => void;
  onBackToLogin: () => void;
}) {
  const approved = claim.admin_access_granted;
  const rejected = claim.status === "rejected";
  const awaitingOwner = claim.route === "owner_approval" && claim.status === "pending";

  const authorityState: CheckState = approved
    ? "done"
    : rejected
      ? "failed"
      : "pending";

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={approved ? Check : rejected ? X : ClipboardCheck}
          title={
            approved
              ? "Verification Complete"
              : rejected
                ? "Verification Failed"
                : awaitingOwner
                  ? "Approval Requested"
                  : "Authority Verification Pending"
          }
          description={message ?? undefined}
          action={<Pill tone="neutral">Step 5 of 5</Pill>}
        />

        <div className="space-y-5">
          <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
              School
            </p>
            <p className="text-sm font-bold text-text-primary mt-0.5">
              {claim.school_name}
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              UDISE {claim.udise_code} · {claim.designation} · {claim.full_name}
            </p>
          </div>

          <VerificationChecklist
            items={[
              {
                label: "School Identity",
                state: claim.school_identity_verified ? "done" : "failed",
                note: "Matched against the official school record.",
              },
              {
                label: "Phone",
                state: claim.phone_verified ? "done" : "idle",
                note: claim.phone_number,
              },
              {
                label: "Email",
                state: claim.email_verified ? "done" : "idle",
                note: claim.official_email,
              },
              {
                label: "Authority Verification",
                state: authorityState,
                note:
                  claim.decision_reason ||
                  claim.authority_notes ||
                  "Checking your authority to administer this school.",
              },
            ]}
          />

          {approved && (
            <Banner tone="success" title="School Admin access granted">
              Your authority has been verified and your school account is active.
            </Banner>
          )}

          {rejected && (
            <Banner tone="error" title="Administrator access not granted">
              {claim.decision_reason ||
                "This request was rejected. If you believe this is a mistake, contact your school's existing administrator or our support team."}
            </Banner>
          )}

          {awaitingOwner && (
            <Banner tone="info" title="Waiting on your school's administrator">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Your request has been sent to the verified owner of{" "}
                {claim.school_name}. You will get access once they approve it.
              </span>
            </Banner>
          )}

          {!approved && !rejected && !awaitingOwner && (
            <>
              <Banner tone="warning" title="Awaiting platform approval">
                Your school has been identified successfully. Your registration
                is now with the VidyaSetu team, who review every new school
                before its administrator gets access. School management features
                will become available once your request is approved.
              </Banner>

              <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 p-4">
                <p className="text-xs font-bold text-text-primary font-[family-name:var(--font-display)]">
                  Speed this up with supporting evidence
                </p>
                <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                  Attach a recognition certificate, board affiliation letter,
                  state education authority document or an authorisation letter on
                  school letterhead. A reviewer still checks it — uploading a
                  document does not grant access on its own.
                </p>

                {claim.evidence_url ? (
                  <div className="mt-3">
                    <Pill tone="emerald">
                      <Check className="w-3 h-3" /> Document submitted
                    </Pill>
                  </div>
                ) : (
                  <label className="mt-3 inline-flex">
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={evidenceBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onEvidence(file);
                      }}
                    />
                    <span
                      className={`inline-flex items-center justify-center font-semibold rounded-[var(--radius-lg)] cursor-pointer transition-all duration-300 px-4 py-2 text-sm gap-1.5 bg-surface text-text-primary border border-border-primary hover:bg-surface-hover font-[family-name:var(--font-display)] ${
                        evidenceBusy ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {evidenceBusy ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" /> Upload document
                        </>
                      )}
                    </span>
                  </label>
                )}
              </div>
            </>
          )}

          {error && <Banner tone="error">{error}</Banner>}
        </div>
      </Panel>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button variant="ghost" size="sm" type="button" onClick={onBackToLogin}>
          Back to sign in
        </Button>
        {approved && (
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={entering}
            onClick={onEnterDashboard}
          >
            {entering ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Opening…
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 mr-1.5" /> Go to School Dashboard
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
