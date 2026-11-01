import { useId, useState, type FormEvent } from "react";
import { useDpdp } from "../context";

export type GuardianMethod = "existing_kyc" | "digilocker_token" | "partner_token" | "court_order";

/** Mirrors the `GuardianVerification` schema of the dpdpkit contract. */
export interface GuardianVerification {
  id: string;
  method: GuardianMethod;
  status: "pending" | "verified" | "failed";
  redirect_url?: string | null;
  verified_at?: string | null;
}

/** The two guardian endpoints (`/guardian/verify/start` and `/guardian/verify/callback`). */
export interface GuardianApi {
  start: (body: { method: GuardianMethod; guardian_ref?: string }) => Promise<GuardianVerification>;
  callback: (body: { verification_id: string; token?: string }) => Promise<GuardianVerification>;
}

export interface GuardianFlowProps {
  api: GuardianApi;
  /** Methods offered (all by default). */
  methods?: GuardianMethod[];
  /** Stable reference for the guardian; must not contain personal data. */
  guardianRef?: string;
  onVerified?: (verification: GuardianVerification) => void;
  className?: string;
}

const METHODS: GuardianMethod[] = ["existing_kyc", "digilocker_token", "partner_token", "court_order"];

/** Hands a child's account over to verifiable parental (guardian) consent: start, redirect, complete. */
export function GuardianFlow({ api, methods = METHODS, guardianRef, onVerified, className }: GuardianFlowProps) {
  const { labels } = useDpdp();
  const [method, setMethod] = useState<GuardianMethod>(methods[0] ?? "existing_kyc");
  const [verification, setVerification] = useState<GuardianVerification>();
  const [token, setToken] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function run(call: () => Promise<GuardianVerification>) {
    setBusy(true);
    setFailed(false);
    try {
      const result = await call();
      setVerification(result);
      if (result.status === "verified") onVerified?.(result);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const start = (e: FormEvent) => {
    e.preventDefault();
    void run(() => api.start({ method, guardian_ref: guardianRef }));
  };
  const complete = (e: FormEvent) => {
    e.preventDefault();
    if (verification) void run(() => api.callback({ verification_id: verification.id, token: token || undefined }));
  };

  const pending = verification?.status === "pending";
  const message = failed
    ? labels.error
    : verification?.status === "verified"
      ? labels.guardianVerified
      : verification?.status === "failed"
        ? labels.guardianFailed
        : pending
          ? labels.guardianPending
          : "";

  return (
    <section className={["dpdp", "dpdp-guardian", className].filter(Boolean).join(" ")} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{labels.guardianTitle}</h2>
      <p>{labels.guardianIntro}</p>
      {verification && pending ? (
        <form onSubmit={complete}>
          {verification.redirect_url ? (
            <p>
              <a href={verification.redirect_url}>{labels.continueWithVerifier}</a>
            </p>
          ) : null}
          <div className="dpdp-field">
            <label htmlFor={`${id}-token`}>{labels.verifierToken}</label>
            <input id={`${id}-token`} value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
          <div className="dpdp-actions">
            <button type="submit" className="dpdp-button" disabled={busy}>
              {labels.completeVerification}
            </button>
          </div>
        </form>
      ) : verification?.status === "verified" ? null : (
        <form onSubmit={start}>
          <div className="dpdp-field">
            <label htmlFor={`${id}-method`}>{labels.guardianMethod}</label>
            <select id={`${id}-method`} value={method} onChange={(e) => setMethod(e.target.value as GuardianMethod)}>
              {methods.map((m) => (
                <option key={m} value={m}>
                  {labels.guardianMethods[m]}
                </option>
              ))}
            </select>
          </div>
          <div className="dpdp-actions">
            <button type="submit" className="dpdp-button" disabled={busy}>
              {labels.startVerification}
            </button>
          </div>
        </form>
      )}
      <p role="status" aria-live="polite" className="dpdp-status">
        {message}
      </p>
    </section>
  );
}
