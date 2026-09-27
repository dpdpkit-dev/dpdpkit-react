import type { PrincipalExport } from "@dpdpkit/client";
import { useId, useState } from "react";
import { useDpdp } from "../context";
import { useConsent, useNotice } from "../hooks";
import { NoticeLinks } from "./ConsentNotice";

interface HistoryRow {
  purpose: string;
  action: string;
  occurred_at: string;
  notice_version: number | null;
}

/** Current consent per purpose, one-click withdrawal, and the principal's consent history. */
export function PreferenceCenter({ className }: { className?: string }) {
  const { labels, client } = useDpdp();
  const { notice, loading, error } = useNotice();
  const { consents, record, withdraw } = useConsent();
  const [busy, setBusy] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>();
  const headingId = useId();

  if (loading && !notice) return <p role="status">{labels.loading}</p>;
  if (error || !notice) return <p role="alert">{labels.error}</p>;

  const byPurpose = new Map(consents.map((c) => [c.purpose, c]));
  const statusText = { granted: labels.granted, denied: labels.denied, withdrawn: labels.withdrawn } as const;

  async function act(purpose: string, grant: boolean) {
    if (!notice) return;
    setBusy(purpose);
    setFailed(false);
    try {
      if (grant) await record([{ purpose, granted: true }], notice.version, notice.locale);
      else await withdraw(purpose);
      setHistory(undefined);
    } catch {
      setFailed(true);
    } finally {
      setBusy(undefined);
    }
  }

  async function loadHistory() {
    const data: PrincipalExport = await client.exportMyData();
    setHistory((data.consent_history ?? []) as unknown as HistoryRow[]);
  }

  return (
    <section className={["dpdp", "dpdp-preferences", className].filter(Boolean).join(" ")} aria-labelledby={headingId}>
      <h2 id={headingId}>{labels.preferencesTitle}</h2>
      <ul className="dpdp-preference-list">
        {notice.purposes
          .filter((p) => p.legal_basis === "consent")
          .map((p) => {
            const state = byPurpose.get(p.id);
            const granted = state?.status === "granted";
            return (
              <li className="dpdp-preference" key={p.id}>
                <div>
                  <span className="dpdp-purpose-title">{p.title}</span>{" "}
                  <span className={`dpdp-state dpdp-state-${state?.status ?? "none"}`}>
                    {state ? statusText[state.status] : labels.notDecided}
                  </span>
                  {state ? (
                    <span className="dpdp-updated">
                      {" "}
                      · {labels.updated} <time dateTime={state.updated_at}>{new Date(state.updated_at).toLocaleDateString(notice.locale)}</time>
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="dpdp-button"
                  disabled={busy === p.id}
                  aria-label={`${granted ? labels.withdraw : labels.give}: ${p.title}`}
                  onClick={() => void act(p.id, !granted)}
                >
                  {granted ? labels.withdraw : labels.give}
                </button>
              </li>
            );
          })}
      </ul>
      <p role="status" aria-live="polite" className="dpdp-status">
        {failed ? labels.error : ""}
      </p>
      <details
        className="dpdp-history"
        onToggle={(e) => {
          if ((e.target as HTMLDetailsElement).open && !history) void loadHistory();
        }}
      >
        <summary>{labels.history}</summary>
        {history ? (
          <ol>
            {history.map((h, i) => (
              <li key={i}>
                <time dateTime={h.occurred_at}>{new Date(h.occurred_at).toLocaleString(notice.locale)}</time> · {h.purpose} ·{" "}
                {h.action}
                {h.notice_version ? ` · v${h.notice_version}` : ""}
              </li>
            ))}
          </ol>
        ) : (
          <p role="status">{labels.loading}</p>
        )}
      </details>
      <NoticeLinks notice={notice} />
    </section>
  );
}
